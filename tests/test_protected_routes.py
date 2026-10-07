def test_unauthenticated_protected_requests(client):
    """Verify all protected endpoints reject anonymous access with 401."""
    routes = [
        ("GET", "/api/profile/me"),
        ("GET", "/api/portfolio/me"),
        ("POST", "/api/profile/onboarding"),
        ("POST", "/api/portfolio/holding"),
        ("POST", "/api/analyze"),
    ]
    for method, path in routes:
        if method == "GET":
            res = client.get(path)
        else:
            res = client.post(path, json={})
        assert res.status_code == 401, f"{path} did not reject unauthenticated access"


def test_invalid_bearer_token(client):
    """Verify malformed/fake tokens are rejected with 401."""
    headers = {"Authorization": "Bearer PH-FAKE-TOKEN-12345"}
    res = client.get("/api/profile/me", headers=headers)
    assert res.status_code == 401


def test_user_ownership_profile_isolation(client, auth_headers_user_a, test_user_a, test_user_b):
    """User A cannot access User B's profile (403 Forbidden)."""
    # User A accesses own profile -> 200
    res_own = client.get(f"/api/profile/{test_user_a.id}", headers=auth_headers_user_a)
    assert res_own.status_code == 200
    assert res_own.json()["user_id"] == test_user_a.id

    # User A attempts to access User B's profile -> 403
    res_cross = client.get(f"/api/profile/{test_user_b.id}", headers=auth_headers_user_a)
    assert res_cross.status_code == 403
    assert "Forbidden" in res_cross.json()["detail"]


def test_user_ownership_portfolio_isolation(client, auth_headers_user_a, test_user_a, test_user_b):
    """User A cannot access User B's portfolio (403 Forbidden)."""
    res_cross = client.get(f"/api/portfolio/{test_user_b.id}", headers=auth_headers_user_a)
    assert res_cross.status_code == 403


def test_user_holding_creation_and_cross_user_deletion(
    client, auth_headers_user_a, auth_headers_user_b, test_user_a, test_user_b
):
    """User A creates a holding; User B attempts to delete it and is rejected."""
    # User A adds holding
    res_add = client.post("/api/portfolio/holding", headers=auth_headers_user_a, json={
        "symbol": "INFY",
        "quantity": 25,
        "average_price": 1800.0
    })
    assert res_add.status_code == 200
    holdings = res_add.json()["holdings"]
    assert len(holdings) == 1
    holding_id = holdings[0]["id"]
    assert holdings[0]["symbol"] == "INFY"

    # User B attempts to delete User A's holding -> rejected 404
    res_del_attack = client.delete(f"/api/portfolio/holding/{holding_id}", headers=auth_headers_user_b)
    assert res_del_attack.status_code == 404

    # Verify User A's holding was NOT deleted
    res_check = client.get("/api/portfolio/me", headers=auth_headers_user_a)
    assert len(res_check.json()["holdings"]) == 1

    # User A deletes their own holding -> 200
    res_del_own = client.delete(f"/api/portfolio/holding/{holding_id}", headers=auth_headers_user_a)
    assert res_del_own.status_code == 200
    assert len(res_del_own.json()["holdings"]) == 0
