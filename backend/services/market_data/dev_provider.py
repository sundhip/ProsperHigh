from datetime import datetime, timezone
from typing import Optional, List, Dict
from backend.services.market_data.base import BaseMarketDataProvider, NormalizedQuote, SecuritySearchResult


class DevMarketDataProvider(BaseMarketDataProvider):
    """
    Deterministic development and test provider.
    Maintains verified equities reference data and never fabricates prices for unknown symbols.
    """

    @property
    def name(self) -> str:
        return "dev_fixture"

    UNIVERSE: Dict[str, Dict] = {
        "RELIANCE": {"name": "Reliance Industries Ltd.", "sector": "Energy", "price": 2985.40, "prev_close": 2962.00, "exchange": "NSE"},
        "TCS": {"name": "Tata Consultancy Services Ltd.", "sector": "IT", "price": 4250.75, "prev_close": 4210.00, "exchange": "NSE"},
        "TATAMOTORS": {"name": "Tata Motors Ltd.", "sector": "Automobile", "price": 985.60, "prev_close": 971.50, "exchange": "NSE"},
        "INFY": {"name": "Infosys Ltd.", "sector": "IT", "price": 1895.30, "prev_close": 1872.00, "exchange": "NSE"},
        "HDFCBANK": {"name": "HDFC Bank Ltd.", "sector": "Banking", "price": 1675.20, "prev_close": 1660.00, "exchange": "NSE"},
        "ICICIBANK": {"name": "ICICI Bank Ltd.", "sector": "Banking", "price": 1240.50, "prev_close": 1228.00, "exchange": "NSE"},
        "SBIN": {"name": "State Bank of India", "sector": "Banking", "price": 845.30, "prev_close": 838.00, "exchange": "NSE"},
        "ITC": {"name": "ITC Ltd.", "sector": "FMCG", "price": 495.60, "prev_close": 491.00, "exchange": "NSE"},
        "BHARTIARTL": {"name": "Bharti Airtel Ltd.", "sector": "Telecom", "price": 1580.40, "prev_close": 1560.00, "exchange": "NSE"},
        "LT": {"name": "Larsen & Toubro Ltd.", "sector": "Engineering", "price": 3650.00, "prev_close": 3626.50, "exchange": "NSE"},
        "ONGC": {"name": "Oil & Natural Gas Corp", "sector": "Energy", "price": 248.50, "prev_close": 245.00, "exchange": "NSE"},
        "WIPRO": {"name": "Wipro Ltd.", "sector": "IT", "price": 542.20, "prev_close": 538.00, "exchange": "NSE"},
        "HINDUNILVR": {"name": "Hindustan Unilever Ltd.", "sector": "FMCG", "price": 2720.00, "prev_close": 2705.00, "exchange": "NSE"},
        "SUNPHARMA": {"name": "Sun Pharmaceutical Industries Ltd.", "sector": "Healthcare", "price": 1780.00, "prev_close": 1765.00, "exchange": "NSE"},
        "KOTAKBANK": {"name": "Kotak Mahindra Bank Ltd.", "sector": "Banking", "price": 1825.00, "prev_close": 1812.00, "exchange": "NSE"},
    }

    def get_quote(self, symbol: str) -> Optional[NormalizedQuote]:
        sym = symbol.strip().upper()
        item = self.UNIVERSE.get(sym)
        if not item:
            return None

        price = float(item["price"])
        prev_close = float(item["prev_close"])
        change = round(price - prev_close, 2)
        change_pct = round((change / max(0.01, prev_close)) * 100, 2)

        return NormalizedQuote(
            symbol=sym,
            name=item["name"],
            price=price,
            previous_close=prev_close,
            change=change,
            change_pct=change_pct,
            exchange=item.get("exchange", "NSE"),
            sector=item.get("sector", "General"),
            currency="INR",
            as_of=datetime.now(timezone.utc),
            is_stale=False,
            is_available=True,
            provider=self.name
        )

    def get_quotes(self, symbols: List[str]) -> Dict[str, NormalizedQuote]:
        results = {}
        for sym in symbols:
            q = self.get_quote(sym)
            if q:
                results[q.symbol] = q
        return results

    def search_symbols(self, query: str) -> List[SecuritySearchResult]:
        q = query.strip().upper()
        if not q:
            return [
                SecuritySearchResult(
                    symbol=k,
                    name=v["name"],
                    exchange=v["exchange"],
                    sector=v["sector"],
                    price=v["price"],
                    change_pct=round(((v["price"] - v["prev_close"]) / v["prev_close"]) * 100, 2)
                )
                for k, v in list(self.UNIVERSE.items())[:10]
            ]

        results = []
        for k, v in self.UNIVERSE.items():
            if q in k or q in v["name"].upper() or q in v["sector"].upper():
                results.append(
                    SecuritySearchResult(
                        symbol=k,
                        name=v["name"],
                        exchange=v["exchange"],
                        sector=v["sector"],
                        price=v["price"],
                        change_pct=round(((v["price"] - v["prev_close"]) / v["prev_close"]) * 100, 2)
                    )
                )
        return results
