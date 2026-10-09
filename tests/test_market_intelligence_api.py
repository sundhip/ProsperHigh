import pytest


def test_market_intelligence_overview(client):
    resp = client.get("/api/market/intelligence")
    assert resp.status_code == 200
    data = resp.json()
    assert "benchmark_indices" in data
    assert len(data["benchmark_indices"]) >= 4
    assert "top_gainers" in data
    assert "top_losers" in data
    assert "sector_performance" in data
    assert "recent_filings" in data
    assert "as_of" in data


def test_market_compare_valid(client):
    resp = client.get("/api/market/compare?symbols=RELIANCE,TCS,INFY")
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] == 3
    symbols = [item["symbol"] for item in data["comparison"]]
    assert "RELIANCE" in symbols
    assert "TCS" in symbols
    assert "INFY" in symbols


def test_market_compare_insufficient_symbols(client):
    resp = client.get("/api/market/compare?symbols=RELIANCE")
    assert resp.status_code == 400
