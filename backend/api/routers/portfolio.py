from typing import List, Optional
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
