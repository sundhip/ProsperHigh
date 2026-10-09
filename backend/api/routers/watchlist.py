from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.api.deps import get_db, get_current_user
from backend.database.models import User, WatchlistItem
from backend.schemas.watchlist import WatchlistAddRequest, WatchlistResponse, WatchlistItemResponse
from backend.services.market_data.service import market_data_service

router = APIRouter(prefix="/api/watchlist", tags=["Watchlist"])


@router.get("", response_model=WatchlistResponse)
def get_user_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve the authenticated user's persistent watchlist with latest quotes."""
    items = db.query(WatchlistItem).filter(WatchlistItem.user_id == current_user.id).order_by(WatchlistItem.created_at.desc()).all()
    
    response_items: List[WatchlistItemResponse] = []
    for it in items:
        quote = market_data_service.get_quote(it.symbol)
        response_items.append(
            WatchlistItemResponse(
                id=it.id,
                symbol=it.symbol,
                name=quote.name if quote else it.symbol,
                sector=quote.sector if quote else "General",
                exchange=quote.exchange if quote else "NSE",
                current_price=quote.price if quote else None,
                change_pct=quote.change_pct if quote else None,
                is_stale=quote.is_stale if quote else True,
                is_available=quote.is_available if quote else False,
                as_of=quote.as_of.isoformat() if quote else None,
                notes=it.notes,
                created_at=it.created_at.isoformat() if it.created_at else ""
            )
        )
    return WatchlistResponse(items=response_items, total_count=len(response_items))


@router.post("", response_model=WatchlistItemResponse, status_code=status.HTTP_201_CREATED)
def add_to_watchlist(
    payload: WatchlistAddRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a symbol to the authenticated user's watchlist."""
    sym = payload.symbol.strip().upper()
    existing = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.symbol == sym
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Symbol '{sym}' is already in your watchlist."
        )

    # Verify symbol exists in universe
    quote = market_data_service.get_quote(sym)
    if not quote:
        # Check if known in dev universe
        results = market_data_service.search_symbols(sym)
        if not results:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Symbol '{sym}' not found in supported market universe."
            )

    item = WatchlistItem(
        user_id=current_user.id,
        symbol=sym,
        notes=payload.notes
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return WatchlistItemResponse(
        id=item.id,
        symbol=item.symbol,
        name=quote.name if quote else sym,
        sector=quote.sector if quote else "General",
        exchange=quote.exchange if quote else "NSE",
        current_price=quote.price if quote else None,
        change_pct=quote.change_pct if quote else None,
        is_stale=quote.is_stale if quote else False,
        is_available=quote.is_available if quote else True,
        as_of=quote.as_of.isoformat() if quote else None,
        notes=item.notes,
        created_at=item.created_at.isoformat() if item.created_at else ""
    )


@router.delete("/{symbol}", status_code=status.HTTP_200_OK)
def remove_from_watchlist(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a symbol from the authenticated user's watchlist."""
    sym = symbol.strip().upper()
    item = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.symbol == sym
    ).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Symbol '{sym}' not found in your watchlist."
        )
    db.delete(item)
    db.commit()
    return {"message": f"Symbol '{sym}' removed from watchlist.", "symbol": sym}
