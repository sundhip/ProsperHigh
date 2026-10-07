from typing import Dict, Any, List, Optional
from backend.services.market_data.service import market_data_service


class MarketDataProviderAdapter:
    """Adapter forwarding legacy market_provider calls to the new MarketDataService."""

    def search_symbol(self, query: str) -> List[Dict[str, Any]]:
        results = market_data_service.search_symbols(query)
        return [
            {
                "symbol": r.symbol,
                "name": r.name,
                "sector": r.sector,
                "exchange": r.exchange,
                "price": r.price,
                "current_price": r.price,
                "change_pct": r.change_pct
            }
            for r in results
        ]

    def get_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        q = market_data_service.get_quote(symbol)
        if not q:
            return None
        return {
            "symbol": q.symbol,
            "name": q.name,
            "sector": q.sector,
            "exchange": q.exchange,
            "current_price": q.price,
            "price": q.price,
            "change_pct": q.change_pct,
            "is_stale": q.is_stale,
            "as_of": q.as_of.isoformat()
        }

    def get_popular_universe(self) -> List[Dict[str, Any]]:
        return market_data_service.get_popular_universe()


market_provider = MarketDataProviderAdapter()
