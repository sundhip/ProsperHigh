from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.api.deps import get_db, get_current_user
from backend.database.models import User, Portfolio
from backend.schemas.portfolio import (
    HoldingCreateRequest,
    PortfolioMetricsResponse,
    PortfolioResponse,
    TransactionCreateRequest,
    TransactionResponse,
    CSVImportResponse
)
from backend.services.portfolio_service import portfolio_service
from backend.services.transaction_service import transaction_service
from backend.services.csv_import_service import csv_import_service

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])


class CSVImportPayload(BaseModel):
    csv_content: str
    portfolio_id: Optional[str] = None


@router.get("", response_model=PortfolioMetricsResponse)
@router.get("/me", response_model=PortfolioMetricsResponse)
def get_my_portfolio(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve computed portfolio metrics for the authenticated user's default portfolio."""
    return portfolio_service.get_user_portfolio_metrics(db, current_user.id)


@router.get("/list", response_model=List[PortfolioResponse])
def list_portfolios(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all portfolios owned by the authenticated user."""
    # Ensure default portfolio exists
    portfolio_service.get_or_create_default_portfolio(db, current_user.id)
    return db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()




@router.post("/holding", response_model=PortfolioMetricsResponse)
def add_holding(
    payload: HoldingCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a holding to the authenticated user's portfolio."""
    return portfolio_service.add_holding(
        db,
        user_id=current_user.id,
        symbol=payload.symbol,
        quantity=payload.quantity,
        price=payload.average_price,
        portfolio_id=payload.portfolio_id
    )


@router.delete("/holding/{holding_id}", response_model=PortfolioMetricsResponse)
def delete_holding(
    holding_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a holding by ID, verifying ownership server-side."""
    return portfolio_service.delete_holding(db, user_id=current_user.id, holding_id=holding_id)


@router.delete("/holding/{user_id}/{holding_id}", response_model=PortfolioMetricsResponse)
def delete_holding_legacy(
    user_id: str,
    holding_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Legacy route for holding deletion with ownership verification."""
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You cannot delete another user's holdings."
        )
    return portfolio_service.delete_holding(db, user_id=current_user.id, holding_id=holding_id)


@router.get("/transactions/list", response_model=List[TransactionResponse])
def get_transactions(
    portfolio_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List historical transactions for the authenticated user's portfolio."""
    return transaction_service.get_portfolio_transactions(db, current_user.id, portfolio_id)


@router.post("/transaction", response_model=TransactionResponse)
def record_transaction(
    payload: TransactionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Execute a BUY or SELL transaction and reconcile holdings atomically."""
    port = portfolio_service.get_or_create_default_portfolio(db, current_user.id) if not payload.portfolio_id else \
        db.query(Portfolio).filter(Portfolio.id == payload.portfolio_id, Portfolio.user_id == current_user.id).first()
    if not port:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found or unauthorized.")

    return transaction_service.record_transaction(
        db=db,
        user_id=current_user.id,
        portfolio_id=port.id,
        symbol=payload.symbol,
        transaction_type=payload.transaction_type,
        quantity=payload.quantity,
        price=payload.price,
        fees=payload.fees,
        notes=payload.notes
    )


@router.post("/import-csv", response_model=CSVImportResponse)
def import_csv(
    payload: CSVImportPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Import portfolio holdings from CSV content with full transactional rollback safety.
    """
    port = portfolio_service.get_or_create_default_portfolio(db, current_user.id) if not payload.portfolio_id else \
        db.query(Portfolio).filter(Portfolio.id == payload.portfolio_id, Portfolio.user_id == current_user.id).first()
    if not port:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found or unauthorized.")

    result = csv_import_service.import_csv_to_portfolio(
        db=db,
        user_id=current_user.id,
        portfolio_id=port.id,
        csv_content=payload.csv_content
    )
    return result


# -------------------------------------------------------------------------
# Phase 4: Advanced Portfolio Intelligence, What-If & Stress Testing
# -------------------------------------------------------------------------

@router.get("/composition")
def get_portfolio_composition(
    portfolio_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Advanced portfolio composition intelligence.
    Calculates Herfindahl-Hirschman Index (HHI), concentration ratios,
    and target allocation drift (only if user provided explicit targets).
    """
    return portfolio_service.analyze_portfolio_composition(db, current_user.id, portfolio_id)


class PreTradeImpactRequest(BaseModel):
    symbol: str
    quantity: float
    price: float
    transaction_type: str = "BUY"
    portfolio_id: Optional[str] = None


@router.post("/pre-trade-impact")
def pre_trade_impact(
    payload: PreTradeImpactRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Simulates hypothetical pre-trade impact on portfolio weights and sector exposure.
    Executes in memory without mutating real transactions.
    """
    return portfolio_service.calculate_pre_trade_impact(
        db=db,
        user_id=current_user.id,
        symbol=payload.symbol,
        quantity=payload.quantity,
        price=payload.price,
        transaction_type=payload.transaction_type,
        portfolio_id=payload.portfolio_id
    )


class WhatIfActionPayload(BaseModel):
    action: str  # "ADD", "TRIM", "SELL"
    symbol: str
    quantity: float
    price: Optional[float] = None


class WhatIfRequest(BaseModel):
    actions: List[WhatIfActionPayload]
    portfolio_id: Optional[str] = None


@router.post("/what-if")
def simulate_what_if(
    payload: WhatIfRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    What-If Portfolio Simulator:
    Simulates hypothetical additions, trims, and sales on portfolio snapshot in memory.
    Guarantees zero writes to live holdings or transactions.
    """
    from backend.services.what_if_service import what_if_service
    actions_dicts = [a.model_dump() for a in payload.actions]
    return what_if_service.simulate_what_if(
        db=db,
        user_id=current_user.id,
        actions=actions_dicts,
        portfolio_id=payload.portfolio_id
    )


class StressTestPayload(BaseModel):
    scenario_key: Optional[str] = None
    custom_market_shock_pct: Optional[float] = None
    custom_sector_shocks: Optional[Dict[str, float]] = None
    portfolio_id: Optional[str] = None


@router.post("/stress-test")
def run_stress_test(
    payload: StressTestPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Portfolio Stress Testing:
    Simulates deterministic market, sector, and volatility shocks based on asset betas.
    """
    from backend.services.stress_test_service import stress_test_service
    return stress_test_service.run_stress_test(
        db=db,
        user_id=current_user.id,
        scenario_key=payload.scenario_key,
        custom_market_shock_pct=payload.custom_market_shock_pct,
        custom_sector_shocks=payload.custom_sector_shocks,
        portfolio_id=payload.portfolio_id
    )


class SaveScenarioPayload(BaseModel):
    name: str
    scenario_type: str  # "what_if" or "stress_test"
    parameters: Dict[str, Any]
    results: Dict[str, Any]
    description: Optional[str] = None


@router.post("/scenarios")
def save_scenario(
    payload: SaveScenarioPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Persist a saved scenario for the authenticated user."""
    from backend.services.what_if_service import what_if_service
    return what_if_service.save_scenario(
        db=db,
        user_id=current_user.id,
        name=payload.name,
        scenario_type=payload.scenario_type,
        parameters=payload.parameters,
        results=payload.results,
        description=payload.description
    )


@router.get("/scenarios")
def list_scenarios(
    scenario_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List saved scenarios for authenticated user."""
    from backend.services.what_if_service import what_if_service
    return what_if_service.list_scenarios(db, current_user.id, scenario_type)


@router.delete("/scenarios/{scenario_id}")
def delete_scenario(
    scenario_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a saved scenario enforcing user ownership."""
    from backend.services.what_if_service import what_if_service
    return {"success": what_if_service.delete_scenario(db, current_user.id, scenario_id)}


@router.get("/{user_id}", response_model=PortfolioMetricsResponse)
def get_portfolio_by_id(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve portfolio metrics by user_id with ownership authorization.
    Cross-user access is rejected with 403 Forbidden.
    """
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You cannot access another user's portfolio data."
        )
    return portfolio_service.get_user_portfolio_metrics(db, current_user.id)

