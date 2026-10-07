def test_health_liveness_endpoint(client):
    """Test /api/health returns online status."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert "version" in data
    assert "environment" in data


def test_health_readiness_endpoint(client):
    """Test /api/health/ready returns connected database status."""
    res = client.get("/api/health/ready")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"


def test_registration_validation_errors(client):
    """Missing or invalid fields return structured 422 error."""
    # Missing email and password
    res = client.post("/api/auth/register", json={"name": "Bob"})
    assert res.status_code == 422
    data = res.json()
    assert "validation_errors" in data
    assert len(data["validation_errors"]) >= 2

    # Invalid email format
    res_bad_email = client.post("/api/auth/register", json={
        "name": "Bob",
        "email": "not-an-email",
        "password": "Password123"
    })
    assert res_bad_email.status_code == 422


def test_holding_validation_errors(client, auth_headers_user_a):
    """Invalid holding payload (e.g. negative quantity) returns 422."""
    res = client.post("/api/portfolio/holding", headers=auth_headers_user_a, json={
        "symbol": "TCS",
        "quantity": -5,
        "average_price": 100.0
    })
    assert res.status_code == 422


def test_stock_search_and_ticker(client):
    """Test stock search and live ticker return valid data structure."""
    res_ticker = client.get("/api/market/ticker")
    assert res_ticker.status_code == 200
    assert "ticker" in res_ticker.json()
    assert len(res_ticker.json()["ticker"]) > 0

    res_search = client.get("/api/stocks/search?q=TATAMOTORS")
    assert res_search.status_code == 200
    stocks = res_search.json()["stocks"]
    assert len(stocks) >= 1
    assert stocks[0]["symbol"] == "TATAMOTORS"


def test_research_ask(client):
    """Test /api/research/ask returns structured answer with citations."""
    res = client.post("/api/research/ask", json={
        "symbol": "RELIANCE",
        "query": "capex commitments"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["symbol"] == "RELIANCE"
    assert "citations" in data
    assert "answer" in data
