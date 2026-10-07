from datetime import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, ConfigDict


class HoldingCreateRequest(BaseModel):
    portfolio_id: Optional[str] = None
    user_id: Optional[str] = None
    symbol: str = Field(..., min_length=1, max_length=30)
    quantity: float = Field(..., gt=0)
    average_price: float = Field(..., ge=0.01)


class HoldingItemResponse(BaseModel):
    id: int
    symbol: str
    name: Optional[str] = None
    sector: Optional[str] = None
    quantity: float
    average_price: float
    current_price: float
    current_value: float
    invested_amount: float
    gain_loss: float
    gain_loss_pct: float
    portfolio_weight_pct: float
    is_stale: bool = False
    quote_available: bool = True


class PortfolioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    currency: str
    is_default: bool
    status: str
    created_at: datetime


class PortfolioMetricsResponse(BaseModel):
    portfolio_id: Optional[str] = None
    portfolio_name: Optional[str] = None
    user_id: str
    total_portfolio_value: float
    total_invested_amount: float
    profit_loss: float
    return_percentage: float
    holdings_count: int
    holdings: List[Dict[str, Any]]
    sector_exposure: Dict[str, float]
    health_score: int
    health_breakdown: Dict[str, int]
    has_stale_quotes: bool = False
    onboarding_completed: Optional[bool] = False


class TransactionCreateRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=30)
    transaction_type: str = Field(default="BUY", description="BUY, SELL, or DIVIDEND")
    quantity: float = Field(..., gt=0)
    price: float = Field(..., ge=0)
    fees: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None
    portfolio_id: Optional[str] = None


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    portfolio_id: str
    user_id: str
    symbol: str
    transaction_type: str
    quantity: float
    price: float
    fees: float
    total_amount: float
    executed_at: datetime
    notes: Optional[str] = None
    created_at: datetime


class CSVImportErrorItem(BaseModel):
    row: int
    field: Optional[str] = None
    error: str


class CSVImportResponse(BaseModel):
    success: bool
    total_rows_processed: int
    imported_count: int
    errors: List[CSVImportErrorItem] = Field(default_factory=list)
