import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.database.models import Portfolio, Holding, Transaction, Security
from backend.services.data_service import data_service
from backend.services.market_data.service import market_data_service


class TransactionService:
    def record_transaction(
        self,
        db: Session,
        user_id: str,
        portfolio_id: str,
        symbol: str,
        transaction_type: str,
        quantity: float,
        price: float,
        fees: float = 0.0,
        notes: Optional[str] = None,
        executed_at: Optional[datetime] = None,
        commit: bool = True
    ) -> Transaction:
        """
        Record a buy/sell transaction and reconcile portfolio holdings with ACID safety.
        """
        txn_type = transaction_type.strip().upper()
        if txn_type not in ["BUY", "SELL", "DIVIDEND"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid transaction type '{transaction_type}'. Must be BUY, SELL, or DIVIDEND."
            )

        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transaction quantity must be greater than zero."
            )

        if price < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transaction execution price cannot be negative."
            )

        # 1. Verify portfolio ownership
        portfolio = db.query(Portfolio).filter(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == user_id
        ).first()
        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Portfolio '{portfolio_id}' not found or unauthorized."
            )

        sym = data_service.normalize_symbol(symbol)
        quote = market_data_service.get_quote(sym)
        name = quote.name if quote else sym
        sector = quote.sector if quote else "General"

        # 2. Find or register Security instrument in DB
        sec = db.query(Security).filter(Security.symbol == sym).first()
        if not sec:
            sec = Security(
                symbol=sym,
                name=name,
                exchange="NSE",
                sector=sector,
                asset_class="Equity",
                currency="INR"
            )
            db.add(sec)
            db.flush()

        exec_time = executed_at or datetime.now(timezone.utc)
        total_amt = round((quantity * price) + fees if txn_type == "BUY" else (quantity * price) - fees, 2)

        # 3. Reconcile Holdings
        holding = db.query(Holding).filter(
            Holding.portfolio_id == portfolio_id,
            Holding.symbol == sym
        ).first()

        if txn_type == "BUY":
            if holding:
                old_cost_total = holding.quantity * holding.average_price
                new_cost_total = old_cost_total + (quantity * price)
                new_qty = holding.quantity + quantity
                new_avg_cost = round(new_cost_total / new_qty, 2)
                
                holding.quantity = new_qty
                holding.average_price = new_avg_cost
            else:
                holding = Holding(
                    portfolio_id=portfolio_id,
                    user_id=user_id,
                    symbol=sym,
                    name=name,
                    sector=sector,
                    quantity=quantity,
                    average_price=round(price, 2),
                    security_id=sec.id,
                    purchase_date=exec_time
                )
                db.add(holding)

        elif txn_type == "SELL":
            if not holding or holding.quantity < quantity:
                held_qty = holding.quantity if holding else 0
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot SELL {quantity} shares of {sym}. Only {held_qty} shares currently held."
                )

            remaining_qty = holding.quantity - quantity
            if remaining_qty <= 0.0001:
                db.delete(holding)
            else:
                holding.quantity = round(remaining_qty, 4)

        # 4. Insert Transaction audit record
        txn_record = Transaction(
            id=f"TXN-{uuid.uuid4().hex[:10].upper()}",
            portfolio_id=portfolio_id,
            user_id=user_id,
            symbol=sym,
            transaction_type=txn_type,
            quantity=quantity,
            price=price,
            fees=fees,
            total_amount=total_amt,
            executed_at=exec_time,
            notes=notes
        )
        db.add(txn_record)
        if commit:
            db.commit()
            db.refresh(txn_record)
        else:
            db.flush()

        return txn_record

    def get_portfolio_transactions(
        self,
        db: Session,
        user_id: str,
        portfolio_id: Optional[str] = None
    ) -> List[Transaction]:
        """List transactions for a specific portfolio or all portfolios of the user."""
        query = db.query(Transaction).filter(Transaction.user_id == user_id)
        if portfolio_id:
            query = query.filter(Transaction.portfolio_id == portfolio_id)
        return query.order_by(Transaction.executed_at.desc()).all()


transaction_service = TransactionService()
