import pytest
from backend.database.models import WatchlistItem


def test_watchlist_unauthenticated(client):
    resp = client.get("/api/watchlist")
    assert resp.status_code == 401


def test_watchlist_add_and_list(client, test_user_a, auth_headers_user_a, db_session):
    # Add RELIANCE to User A's watchlist
    resp_add = client.post(
        "/api/watchlist",
        headers=auth_headers_user_a,
        json={"symbol": "RELIANCE", "notes": "Core conglomerate holding"}
    )
    assert resp_add.status_code == 201
    data_add = resp_add.json()
    assert data_add["symbol"] == "RELIANCE"
    assert data_add["notes"] == "Core conglomerate holding"
    assert data_add["current_price"] is not None

    # List watchlist
    resp_list = client.get("/api/watchlist", headers=auth_headers_user_a)
    assert resp_list.status_code == 200
    data_list = resp_list.json()
    assert data_list["total_count"] == 1
    assert data_list["items"][0]["symbol"] == "RELIANCE"


def test_watchlist_duplicate_conflict(client, test_user_a, auth_headers_user_a):
    resp1 = client.post(
        "/api/watchlist",
        headers=auth_headers_user_a,
        json={"symbol": "TCS"}
    )
    assert resp1.status_code == 201

    # Adding again -> 409 Conflict
    resp2 = client.post(
        "/api/watchlist",
        headers=auth_headers_user_a,
        json={"symbol": "TCS"}
    )
    assert resp2.status_code == 409


def test_watchlist_user_isolation(client, test_user_a, auth_headers_user_a, test_user_b, auth_headers_user_b):
    # User A adds INFY
    client.post(
        "/api/watchlist",
        headers=auth_headers_user_a,
        json={"symbol": "INFY"}
    )

    # User B lists watchlist -> Should be empty (0 items)
    resp_b = client.get("/api/watchlist", headers=auth_headers_user_b)
    assert resp_b.status_code == 200
    assert resp_b.json()["total_count"] == 0


def test_watchlist_delete(client, test_user_a, auth_headers_user_a):
    client.post(
        "/api/watchlist",
        headers=auth_headers_user_a,
        json={"symbol": "HDFCBANK"}
    )

    resp_del = client.delete("/api/watchlist/HDFCBANK", headers=auth_headers_user_a)
    assert resp_del.status_code == 200

    # Delete non-existent -> 404
    resp_del404 = client.delete("/api/watchlist/HDFCBANK", headers=auth_headers_user_a)
    assert resp_del404.status_code == 404
