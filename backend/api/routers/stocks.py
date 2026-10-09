from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel
from backend.schemas.stocks import StockSearchResponse, MarketTickerResponse
from backend.services.market_data.service import market_data_service

router = APIRouter(prefix="/api", tags=["Market & Stocks"])


class NormalizedQuoteResponse(BaseModel):
    symbol: str
    name: str
    price: float
    previous_close: float
    change: float
    change_pct: float
    exchange: str
    sector: str
    currency: str
    as_of: str
    is_stale: bool
    is_available: bool
    provider: str


@router.get("/market/ticker", response_model=MarketTickerResponse)
def get_live_ticker():
    """Retrieve universe ticker list with live or cached quotes and provider status."""
    from datetime import datetime, timezone
    now_str = datetime.now(timezone.utc).strftime("%H:%M UTC")
    return {
        "ticker": market_data_service.get_popular_universe(),
        "as_of": f"As of {now_str}",
        "status": "Market Active",
        "provider": "NSE Market Feed"
    }


@router.get("/stocks/search", response_model=StockSearchResponse)
def search_stocks(q: str = Query("", description="Stock search query (symbol, name, sector)")):
    """Search for verified stocks in universe."""
    results = market_data_service.search_symbols(q)
    return {
        "stocks": [
            {
                "symbol": r.symbol,
                "name": r.name,
                "sector": r.sector,
                "price": r.price,
                "change_pct": r.change_pct,
                "exchange": r.exchange
            }
            for r in results
        ]
    }


@router.get("/market/quote/{symbol}", response_model=NormalizedQuoteResponse)
def get_stock_quote(symbol: str):
    """Retrieve normalized quote for a symbol with staleness awareness. Returns 404 if unlisted."""
    quote = market_data_service.get_quote(symbol)
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Market data quote unavailable for symbol '{symbol.upper()}'."
        )
    return {
        "symbol": quote.symbol,
        "name": quote.name,
        "price": quote.price,
        "previous_close": quote.previous_close,
        "change": quote.change,
        "change_pct": quote.change_pct,
        "exchange": quote.exchange,
        "sector": quote.sector,
        "currency": quote.currency,
        "as_of": quote.as_of.isoformat(),
        "is_stale": quote.is_stale,
        "is_available": quote.is_available,
        "provider": quote.provider
    }
