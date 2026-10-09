import pytest
from backend.core.config import Settings, settings
from backend.services.jobs.manager import job_manager
from backend.services.rag.service import rag_service
from backend.database.models import Document, DocumentChunk


def test_production_secret_validation():
    """Verify that Settings raises a fatal error when an insecure default secret key is configured in production."""
    # 1. Default dev key in production should fail
    with pytest.raises(ValueError, match="FATAL SECURITY MISCONFIGURATION"):
        Settings(
            ENVIRONMENT="production",
            JWT_SECRET_KEY="dev-secret-key-change-this-in-production-to-a-secure-random-32char-token"
        )

    # 2. Key shorter than 32 characters in production should fail
    with pytest.raises(ValueError, match="FATAL SECURITY MISCONFIGURATION"):
        Settings(
            ENVIRONMENT="production",
            JWT_SECRET_KEY="short_insecure_secret_key"
        )

    # 3. Secure 32+ character key in production should succeed
    valid_settings = Settings(
        ENVIRONMENT="production",
        JWT_SECRET_KEY="a" * 32
    )
    assert valid_settings.JWT_SECRET_KEY == "a" * 32

    # 4. In development, default secret is accepted
    dev_settings = Settings(
        ENVIRONMENT="development",
        JWT_SECRET_KEY="dev-secret-key-change-this-in-production-to-a-secure-random-32char-token"
    )
    assert dev_settings.ENVIRONMENT == "development"


def test_idor_protection_user_uploaded_document(client, test_user_a, test_user_b, auth_headers_user_a, auth_headers_user_b, db_session):
    """Verify that User B cannot access User A's private uploaded financial documents via IDOR."""
    # User A uploads a private document
    doc = rag_service.upload_user_document(
        db=db_session,
        filename="user_a_private_filing.txt",
        file_bytes=b"CONFIDENTIAL: User A quarterly revenue grew by 45 percent and internal net margins reached 22 percent.",
        company="USER_A_VENTURE",
        user_id=test_user_a.id,
        document_type="Private Disclosure"
    )
    assert doc.id is not None
    assert doc.is_user_uploaded is True
    assert doc.user_id == test_user_a.id

    # 1. User A (owner) can retrieve document details
    resp_a = client.get(f"/api/research/documents/{doc.id}", headers=auth_headers_user_a)
    assert resp_a.status_code == 200
    assert resp_a.json()["id"] == doc.id

    # 2. User B (different user) is blocked with 403 Forbidden
    resp_b = client.get(f"/api/research/documents/{doc.id}", headers=auth_headers_user_b)
    assert resp_b.status_code == 403
    assert "Forbidden" in resp_b.json()["detail"]

    # 3. Unauthenticated request is blocked with 403 Forbidden
    resp_anon = client.get(f"/api/research/documents/{doc.id}")
    assert resp_anon.status_code == 403


def test_idor_protection_citation_inspection(client, test_user_a, test_user_b, auth_headers_user_a, auth_headers_user_b, db_session):
    """Verify that citations derived from private documents cannot be inspected by unauthorized users."""
    doc = rag_service.upload_user_document(
        db=db_session,
        filename="user_a_secrets.txt",
        file_bytes=b"Executive compensation details: CEO base salary 500k, equity incentive 2.5M subject to EBITDA hurdle.",
        company="USER_A_HOLDINGS",
        user_id=test_user_a.id,
        document_type="Executive Compensation"
    )
    chunk = db_session.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).first()
    assert chunk is not None

    # User A can inspect citation
    resp_a = client.get(f"/api/research/citations/{chunk.id}", headers=auth_headers_user_a)
    assert resp_a.status_code == 200
    assert resp_a.json()["chunk_id"] == chunk.id

    # User B is rejected with 403 Forbidden
    resp_b = client.get(f"/api/research/citations/{chunk.id}", headers=auth_headers_user_b)
    assert resp_b.status_code == 403
    assert "Forbidden" in resp_b.json()["detail"]


def test_background_jobs_multi_tenancy(client, test_user_a, test_user_b, auth_headers_user_a, auth_headers_user_b):
    """Verify that background jobs are strictly scoped to the initiating user."""
    def dummy_task():
        return {"status": "ok"}

    job_a = job_manager.submit_job(
        job_type="EXPORT_REPORT",
        fn=dummy_task,
        idempotency_key="EXPORT_USER_A_1",
        user_id=test_user_a.id
    )

    # User A can retrieve their job
    resp_a = client.get(f"/api/jobs/{job_a.job_id}", headers=auth_headers_user_a)
    assert resp_a.status_code == 200
    assert resp_a.json()["job_id"] == job_a.job_id

    # User B cannot retrieve User A's job (returns 404)
    resp_b = client.get(f"/api/jobs/{job_a.job_id}", headers=auth_headers_user_b)
    assert resp_b.status_code == 404

    # User A's job listing includes job_a
    list_a = client.get("/api/jobs", headers=auth_headers_user_a).json()
    assert any(j["job_id"] == job_a.job_id for j in list_a)

    # User B's job listing does NOT include job_a
    list_b = client.get("/api/jobs", headers=auth_headers_user_b).json()
    assert not any(j["job_id"] == job_a.job_id for j in list_b)


def test_auth_logout_endpoint(client, auth_headers_user_a):
    """Verify POST /api/auth/logout terminates session cleanly."""
    resp = client.post("/api/auth/logout", headers=auth_headers_user_a)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "logged out" in data["message"].lower()


def test_health_metrics_observability(client):
    """Verify that operational metrics endpoint reports infrastructure health without leaking secrets."""
    resp = client.get("/health/metrics")
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] in ["healthy", "degraded"]
    assert "database" in data
    assert "market_data" in data
    assert "background_jobs" in data
    assert "ai_engine" in data
    assert data["database"]["connected"] is True

    # Security assertion: ensure no credentials or secret keys are exposed
    json_str = resp.text.lower()
    assert "jwt_secret" not in json_str
    assert "password" not in json_str
    assert "api_key" not in json_str
    assert "secret" not in json_str
