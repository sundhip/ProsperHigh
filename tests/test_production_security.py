import pytest
from backend.core.rate_limiter import rate_limiter
from backend.core.config import settings
from backend.services.jobs.manager import job_manager, JobStatus


def test_request_correlation_id_and_security_headers(client):
    # Send request with custom X-Request-ID
    custom_id = "test-corr-id-999"
    resp = client.get("/health/live", headers={"X-Request-ID": custom_id})
    assert resp.status_code == 200
    assert resp.headers.get("X-Request-ID") == custom_id

    # Verify security response headers
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("X-XSS-Protection") == "1; mode=block"
    assert "Strict-Transport-Security" in resp.headers


def test_rate_limiter_blocks_abuse(client):
    # Test rate limiter directly
    client_ip = "192.168.1.100"
    test_key = f"{client_ip}:/api/auth/login"
    limit = 5

    # Consume allowed quota
    for _ in range(limit):
        allowed, retry_after = rate_limiter.is_allowed(test_key, limit=limit, window_seconds=60.0)
        assert allowed is True

    # Next attempt should be blocked with 429 logic
    blocked, retry_after = rate_limiter.is_allowed(test_key, limit=limit, window_seconds=60.0)
    assert blocked is False
    assert retry_after > 0


def test_unhandled_exception_shielding(client):
    # Non-existent endpoint returns clean 404 without internal server traceback
    resp = client.get("/api/nonexistent-route-random-123")
    assert resp.status_code == 404
    data = resp.json()
    assert "Traceback" not in str(data)
    assert "detail" in data


def test_background_jobs_lifecycle(test_user_a, auth_headers_user_a, client):
    # Submit a job via JobManager
    def sample_work(x, y):
        return x + y

    job = job_manager.submit_job(
        job_type="CALCULATION_TEST",
        fn=sample_work,
        x=10,
        y=25,
        idempotency_key="TEST_CALC_1",
    )
    assert job is not None
    assert job.job_id.startswith("JOB-")

    # Fetch job from manager
    retrieved = job_manager.get_job(job.job_id)
    assert retrieved is not None
    assert retrieved.job_id == job.job_id

    # Test API endpoint
    resp = client.get(f"/api/jobs/{job.job_id}", headers=auth_headers_user_a)
    assert resp.status_code == 200
    data = resp.json()
    assert data["job_id"] == job.job_id
    assert data["job_type"] == "CALCULATION_TEST"
