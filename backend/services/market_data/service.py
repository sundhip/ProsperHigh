from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
from sqlalchemy.orm import Session

from backend.services.market_data.base import NormalizedQuote, SecuritySearchResult
from backend.services.market_data.dev_provider import DevMarketDataProvider
from backend.services.market_data.live_provider import LiveMarketDataProvider
from backend.database.models import Security


class MarketDataService:
    """
    Core Market Data Service with caching, staleness detection, and provider failover.
    Ensures truthful pricing: never fabricates random or synthetic numbers.
    """

    def __init__(self, cache_ttl_seconds: int = 60):
        self.cache_ttl = timedelta(seconds=cache_ttl_seconds)
        self.live_provider = LiveMarketDataProvider()
        self.dev_provider = DevMarketDataProvider()
        self._cache: Dict[str, Dict] = {}  # {symbol: {"quote": NormalizedQuote, "cached_at": datetime}}

    def get_quote(self, symbol: str) -> Optional[NormalizedQuote]:
        """
        Fetch normalized quote with caching and staleness awareness.
        Never fabricates arbitrary prices.
        """
        sym = symbol.strip().upper()
        now = datetime.now(timezone.utc)

        # 1. Check in-memory cache
        cached = self._cache.get(sym)
        if cached:
            cached_at = cached["cached_at"]
            if (now - cached_at) <= self.cache_ttl:
                return cached["quote"]

        # 2. Cache miss or expired: Attempt providers
        quote: Optional[NormalizedQuote] = None

        # Try live provider
        try:
            quote = self.live_provider.get_quote(sym)
        except Exception:
            quote = None

        # If live provider didn't return a quote, try dev/verified universe provider
        if not quote:
            try:
                quote = self.dev_provider.get_quote(sym)
            except Exception:
                quote = None

        if quote:
            # Cache freshly fetched quote
            self._cache[sym] = {"quote": quote, "cached_at": now}
            return quote

        # 3. If both providers failed but stale cached data exists, return marked as stale
        if cached:
            stale_quote = cached["quote"].model_copy()
            stale_quote.is_stale = True
            return stale_quote

        # 4. Symbol is genuinely unavailable
        return None

    def get_quotes(self, symbols: List[str]) -> Dict[str, NormalizedQuote]:
        results = {}
        for s in symbols:
            q = self.get_quote(s)
            if q:
                results[q.symbol] = q
        return results

    def search_symbols(self, query: str, db: Optional[Session] = None) -> List[SecuritySearchResult]:
        """Search instruments across database registry and dev provider universe."""
        results: Dict[str, SecuritySearchResult] = {}
        q_clean = query.strip().upper()

        # 1. Search database securities registry if db session provided
        if db:
            try:
                q_filter = f"%{q_clean}%"
                db_secs = db.query(Security).filter(
                    (Security.symbol.ilike(q_filter)) | (Security.name.ilike(q_filter))
                ).limit(15).all()
                for s in db_secs:
                    quote = self.get_quote(s.symbol)
                    results[s.symbol] = SecuritySearchResult(
                        symbol=s.symbol,
                        name=s.name,
                        exchange=s.exchange,
                        sector=s.sector or "General",
                        price=quote.price if quote else None,
                        change_pct=quote.change_pct if quote else None
                    )
            except Exception:
                pass

        # 2. Search dev provider universe
        dev_results = self.dev_provider.search_symbols(query)
        for r in dev_results:
            if r.symbol not in results:
                results[r.symbol] = r

        return list(results.values())

    def get_popular_universe(self) -> List[Dict]:
        """Return popular market universe list with current quotes."""
        symbols = [
            "RELIANCE", "TCS", "TATAMOTORS", "INFY", "HDFCBANK",
            "ICICIBANK", "SBIN", "ITC", "BHARTIARTL", "LT"
        ]
        items = []
        for s in symbols:
            q = self.get_quote(s)
            if q:
                items.append({
                    "symbol": q.symbol,
                    "name": q.name,
                    "sector": q.sector,
                    "price": q.price,
                    "current_price": q.price,
                    "change_pct": q.change_pct,
                    "exchange": q.exchange,
                    "is_stale": q.is_stale
                })
        return items

    def clear_cache(self):
        """Helper for testing cache invalidation."""
        self._cache.clear()


market_data_service = MarketDataService()
