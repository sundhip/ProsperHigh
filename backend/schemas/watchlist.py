from typing import Optional, List
from pydantic import BaseModel, Field


class WatchlistAddRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=30)
    notes: Optional[str] = None


class WatchlistItemResponse(BaseModel):
    id: str
    symbol: str
    name: str
    sector: str
    exchange: str
    current_price: Optional[float] = None
    change_pct: Optional[float] = None
    is_stale: bool = False
    is_available: bool = True
    as_of: Optional[str] = None
    notes: Optional[str] = None
    created_at: str


class WatchlistResponse(BaseModel):
    items: List[WatchlistItemResponse]
    total_count: int
