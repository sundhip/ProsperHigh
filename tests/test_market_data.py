from fastapi import status
from backend.services.market_data.service import market_data_service
from backend.services.market_data.dev_provider import DevMarketDataProvider


def test_dev_provider_quotes():
    """Verify DevMarketDataProvider returns realistic deterministic quotes for listed equities."""
    provider = DevMarketDataProvider()
    quote = provider.get_quote("INFY")
    assert quote is not None
    assert quote.symbol == "INFY"
    assert quote.price > 0
    assert quote.exchange in ["NSE", "BSE"]
    assert quote.sector == "IT"

    # Unknown stock returns None (no synthetic hallucinated data)
    unknown = provider.get_quote("XYZ_NONEXISTENT_STOCK")
    assert unknown is None


def test_market_data_service_caching():
    """Verify MarketDataService caches quotes and updates TTL."""
    # First fetch
    q1 = market_data_service.get_quote("TATAMOTORS")
    assert q1 is not None

    # Cached fetch should return same object or equal attributes
    q2 = market_data_service.get_quote("TATAMOTORS")
    assert q2 is not None
    assert q2.price == q1.price
    assert q2.is_stale is False


def test_market_data_service_universe():
    """Verify universe ticker retrieval returns populated symbols with valid quotes."""
    universe = market_data_service.get_popular_universe()
    assert len(universe) >= 10
    symbols = [item["symbol"] for item in universe]
    assert "RELIANCE" in symbols
    assert "TCS" in symbols


def test_api_stock_quote_and_unlisted_404(client):
    """Verify GET /api/market/quote/{symbol} returns quote or 404 for unknown symbol."""
    res_valid = client.get("/api/market/quote/INFY")
    assert res_valid.status_code == status.HTTP_200_OK
    data = res_valid.json()
    assert data["symbol"] == "INFY"
    assert "price" in data
    assert "is_stale" in data

    res_invalid = client.get("/api/market/quote/INVALID_NOT_LISTED")
    assert res_invalid.status_code == status.HTTP_404_NOT_FOUND
    assert "unavailable" in res_invalid.json()["detail"].lower()


def test_api_stock_search(client):
    """Verify stock search endpoint returns relevant matching equities."""
    res = client.get("/api/stocks/search?q=bank")
    assert res.status_code == status.HTTP_200_OK
    results = res.json()["stocks"]
    assert len(results) >= 1
    # Check HDFCBANK or ICICIBANK or SBIN is found
    symbols = [r["symbol"] for r in results]
    assert any("BANK" in s or "SBIN" in s for s in symbols)
