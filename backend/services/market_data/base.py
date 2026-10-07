from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class NormalizedQuote(BaseModel):
    symbol: str
    name: str
    price: float
    previous_close: float = 0.0
    change: float = 0.0
    change_pct: float = 0.0
    exchange: str = "NSE"
    sector: str = "General"
    currency: str = "INR"
    as_of: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_stale: bool = False
    is_available: bool = True
    provider: str = "unknown"


class SecuritySearchResult(BaseModel):
    symbol: str
    name: str
    exchange: str = "NSE"
    sector: str = "General"
    price: Optional[float] = None
    change_pct: Optional[float] = None


class BaseMarketDataProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def get_quote(self, symbol: str) -> Optional[NormalizedQuote]:
        """Fetch quote for a single symbol. Returns None if unlisted or unavailable."""
        pass

    @abstractmethod
    def get_quotes(self, symbols: List[str]) -> Dict[str, NormalizedQuote]:
        """Fetch quotes for multiple symbols."""
        pass

    @abstractmethod
    def search_symbols(self, query: str) -> List[SecuritySearchResult]:
        """Search instruments matching the query string."""
        pass
