from fastapi import status
from backend.database.models import AnalysisRun, AgentRun


def test_api_analyze_and_persistence(client, auth_headers_user_a, db_session, test_user_a):
    """Verify POST /api/analyze executes orchestrator and persists records in database."""
    res = client.post(
        "/api/analyze",
        headers=auth_headers_user_a,
        json={"symbol": "INFY"}
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["symbol"] == "INFY"
    assert "analysis_id" in data
    analysis_id = data["analysis_id"]

    # Verify database persistence
    run = db_session.query(AnalysisRun).filter(AnalysisRun.id == analysis_id).first()
    assert run is not None
    assert run.user_id == test_user_a.id
    assert run.symbol == "INFY"
    assert len(run.agent_runs) == 6


def test_api_analysis_history(client, auth_headers_user_a):
    """Verify GET /api/analyze/history retrieves past user analyses."""
    # Run analysis first
    client.post("/api/analyze", headers=auth_headers_user_a, json={"symbol": "TATAMOTORS"})

    res = client.get("/api/analyze/history", headers=auth_headers_user_a)
    assert res.status_code == status.HTTP_200_OK
    history = res.json()
    assert len(history) >= 1
    assert any(h["symbol"] == "TATAMOTORS" for h in history)


def test_api_analysis_ownership_isolation(client, auth_headers_user_a, auth_headers_user_b):
    """Verify User A cannot retrieve User B's analysis record (403 Forbidden)."""
    # User B runs analysis
    res_b = client.post("/api/analyze", headers=auth_headers_user_b, json={"symbol": "TCS"})
    assert res_b.status_code == status.HTTP_200_OK
    b_analysis_id = res_b.json()["analysis_id"]

    # User A attempts to view User B's analysis
    res_unauth = client.get(f"/api/analyze/{b_analysis_id}", headers=auth_headers_user_a)
    assert res_unauth.status_code == status.HTTP_403_FORBIDDEN
    assert "forbidden" in res_unauth.json()["detail"].lower()


def test_api_analysis_unauthenticated(client):
    """Verify unauthenticated requests to /api/analyze return 401."""
    res = client.post("/api/analyze", json={"symbol": "INFY"})
    assert res.status_code == status.HTTP_401_UNAUTHORIZED
