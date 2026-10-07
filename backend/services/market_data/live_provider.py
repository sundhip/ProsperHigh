import urllib.request
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict
from backend.services.market_data.base import BaseMarketDataProvider, NormalizedQuote, SecuritySearchResult


class LiveMarketDataProvider(BaseMarketDataProvider):
    """
    Live market data provider adapter.
    Fetches quotes via external market endpoints with strict timeouts and error isolation.
    """

    @property
    def name(self) -> str:
        return "live_external"

    def _fetch_quote_online(self, symbol: str) -> Optional[Dict]:
        """Fetch real-time quote via public market API (NSE/Yahoo format)."""
        sym = symbol.strip().upper()
        # Add .NS for NSE equities if not present
        ticker = f"{sym}.NS" if not sym.endswith(".NS") and not sym.endswith(".BO") else sym
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=2d"
        
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ProsperHigh/3.1"}
        )
        try:
            with urllib.request.urlopen(req, timeout=3.5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    result = data.get("chart", {}).get("result", [])
                    if result:
                        meta = result[0].get("meta", {})
                        price = meta.get("regularMarketPrice")
                        prev_close = meta.get("chartPreviousClose", price)
                        if price:
                            return {
                                "symbol": sym,
                                "name": meta.get("shortName", meta.get("symbol", sym)),
                                "price": float(price),
                                "prev_close": float(prev_close or price),
                                "exchange": meta.get("exchangeName", "NSE"),
                                "currency": meta.get("currency", "INR")
                            }
        except Exception:
            return None
        return None

    def get_quote(self, symbol: str) -> Optional[NormalizedQuote]:
        raw = self._fetch_quote_online(symbol)
        if not raw:
            return None

        price = raw["price"]
        prev_close = raw.get("prev_close", price)
        change = round(price - prev_close, 2)
        change_pct = round((change / max(0.01, prev_close)) * 100, 2)

        return NormalizedQuote(
            symbol=raw["symbol"],
            name=raw.get("name", raw["symbol"]),
            price=price,
            previous_close=prev_close,
            change=change,
            change_pct=change_pct,
            exchange=raw.get("exchange", "NSE"),
            sector="Equities",
            currency=raw.get("currency", "INR"),
            as_of=datetime.now(timezone.utc),
            is_stale=False,
            is_available=True,
            provider=self.name
        )

    def get_quotes(self, symbols: List[str]) -> Dict[str, NormalizedQuote]:
        results = {}
        for s in symbols:
            q = self.get_quote(s)
            if q:
                results[q.symbol] = q
        return results

    def search_symbols(self, query: str) -> List[SecuritySearchResult]:
        # Return empty list if no online symbol lookup performed
        return []
