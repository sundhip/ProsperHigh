import pytest


def test_alerts_unauthenticated(client):
    resp = client.get("/api/alerts")
    assert resp.status_code == 401


def test_alerts_create_and_list(client, test_user_a, auth_headers_user_a):
    resp_create = client.post(
        "/api/alerts",
        headers=auth_headers_user_a,
        json={
            "symbol": "TATAMOTORS",
            "alert_type": "PRICE_TARGET",
            "condition_type": "ABOVE",
            "threshold_value": 1100.0,
            "message": "Notify if Tata Motors crosses INR 1100"
        }
    )
    assert resp_create.status_code == 201
    alert_data = resp_create.json()
    assert alert_data["symbol"] == "TATAMOTORS"
    assert alert_data["status"] == "ACTIVE"
    alert_id = alert_data["id"]

    # List alerts
    resp_list = client.get("/api/alerts", headers=auth_headers_user_a)
    assert resp_list.status_code == 200
    list_data = resp_list.json()
    assert list_data["active_count"] == 1
    assert list_data["alerts"][0]["id"] == alert_id

    # Dismiss alert
    resp_dismiss = client.post(f"/api/alerts/{alert_id}/dismiss", headers=auth_headers_user_a)
    assert resp_dismiss.status_code == 200
    assert resp_dismiss.json()["status"] == "DISMISSED"

    # Delete alert
    resp_del = client.delete(f"/api/alerts/{alert_id}", headers=auth_headers_user_a)
    assert resp_del.status_code == 200


def test_alerts_user_isolation(client, test_user_a, auth_headers_user_a, test_user_b, auth_headers_user_b):
    resp = client.post(
        "/api/alerts",
        headers=auth_headers_user_a,
        json={"symbol": "RELIANCE", "threshold_value": 3200.0}
    )
    assert resp.status_code == 201
    alert_id = resp.json()["id"]

    # User B cannot see User A's alerts
    resp_b = client.get("/api/alerts", headers=auth_headers_user_b)
    assert resp_b.status_code == 200
    assert resp_b.json()["active_count"] == 0

    # User B cannot dismiss User A's alert -> 404
    resp_dismiss_b = client.post(f"/api/alerts/{alert_id}/dismiss", headers=auth_headers_user_b)
    assert resp_dismiss_b.status_code == 404
