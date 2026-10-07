from typing import List, Optional
from pydantic import BaseModel


class StockQuote(BaseModel):
    symbol: str
    name: Optional[str] = None
    sector: Optional[str] = None
    price: Optional[float] = None
    change_pct: Optional[float] = None
    exchange: Optional[str] = "NSE"


class StockSearchResponse(BaseModel):
    stocks: List[StockQuote]


class MarketTickerResponse(BaseModel):
    ticker: List[StockQuote]
