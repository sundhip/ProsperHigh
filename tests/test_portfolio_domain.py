import pytest
from fastapi import status
from backend.database.models import Portfolio, Holding, Transaction
from backend.services.portfolio_service import portfolio_service
from backend.services.transaction_service import transaction_service


def test_default_portfolio_auto_creation(db_session, test_user_a):
    """Verify that a default portfolio is automatically created if one does not exist."""
    portfolios = db_session.query(Portfolio).filter(Portfolio.user_id == test_user_a.id).all()
    assert len(portfolios) == 0

    port = portfolio_service.get_or_create_default_portfolio(db_session, test_user_a.id)
    assert port is not None
    assert port.user_id == test_user_a.id
    assert port.is_default is True
    assert port.name == "Main Portfolio"

    # Calling again should retrieve the same portfolio, not duplicate
    port2 = portfolio_service.get_or_create_default_portfolio(db_session, test_user_a.id)
    assert port2.id == port.id


def test_record_buy_transaction_and_reconcile_holdings(db_session, test_user_a):
    """Verify BUY transaction creates holding and updates weighted average cost basis."""
    port = portfolio_service.get_or_create_default_portfolio(db_session, test_user_a.id)

    # First BUY: 10 shares @ 1000
    txn1 = transaction_service.record_transaction(
        db=db_session,
        user_id=test_user_a.id,
        portfolio_id=port.id,
        symbol="INFY",
        transaction_type="BUY",
        quantity=10,
        price=1000.0,
        fees=20.0
    )
    assert txn1.symbol == "INFY"
    assert txn1.total_amount == 10020.0

    holding = db_session.query(Holding).filter(Holding.portfolio_id == port.id, Holding.symbol == "INFY").first()
    assert holding is not None
    assert holding.quantity == 10.0
    assert holding.average_price == 1000.0

    # Second BUY: 10 shares @ 1200 -> Average should be (10*1000 + 10*1200)/20 = 1100
    txn2 = transaction_service.record_transaction(
        db=db_session,
        user_id=test_user_a.id,
        portfolio_id=port.id,
        symbol="INFY",
        transaction_type="BUY",
        quantity=10,
        price=1200.0
    )
    db_session.refresh(holding)
    assert holding.quantity == 20.0
    assert holding.average_price == 1100.0


def test_record_sell_transaction_and_oversell_rejection(db_session, test_user_a):
    """Verify SELL transaction reduces holding, and overselling raises 400."""
    port = portfolio_service.get_or_create_default_portfolio(db_session, test_user_a.id)

    # BUY 15 shares of TCS
    transaction_service.record_transaction(
        db=db_session,
        user_id=test_user_a.id,
        portfolio_id=port.id,
        symbol="TCS",
        transaction_type="BUY",
        quantity=15,
        price=3500.0
    )

    # Over-sell: attempt to SELL 20 shares (only 15 owned)
    with pytest.raises(Exception) as exc_info:
        transaction_service.record_transaction(
            db=db_session,
            user_id=test_user_a.id,
            portfolio_id=port.id,
            symbol="TCS",
            transaction_type="SELL",
            quantity=20,
            price=3600.0
        )
    assert "Cannot SELL" in str(exc_info.value)

    # Valid SELL: sell 5 shares
    txn_sell = transaction_service.record_transaction(
        db=db_session,
        user_id=test_user_a.id,
        portfolio_id=port.id,
        symbol="TCS",
        transaction_type="SELL",
        quantity=5,
        price=3600.0
    )
    assert txn_sell.transaction_type == "SELL"

    holding = db_session.query(Holding).filter(Holding.portfolio_id == port.id, Holding.symbol == "TCS").first()
    assert holding.quantity == 10.0

    # Sell remaining 10 shares -> holding should be removed
    transaction_service.record_transaction(
        db=db_session,
        user_id=test_user_a.id,
        portfolio_id=port.id,
        symbol="TCS",
        transaction_type="SELL",
        quantity=10,
        price=3700.0
    )
    holding_after = db_session.query(Holding).filter(Holding.portfolio_id == port.id, Holding.symbol == "TCS").first()
    assert holding_after is None


def test_api_portfolio_ownership_isolation(client, auth_headers_user_a, auth_headers_user_b, test_user_b):
    """Verify that User A cannot view User B's portfolio by user_id (403 Forbidden)."""
    # User B adds a holding
    res = client.post(
        "/api/portfolio/holding",
        headers=auth_headers_user_b,
        json={"symbol": "RELIANCE", "quantity": 10, "average_price": 2800.0}
    )
    assert res.status_code == status.HTTP_200_OK

    # User A attempts to view User B's portfolio
    res_forbidden = client.get(
        f"/api/portfolio/{test_user_b.id}",
        headers=auth_headers_user_a
    )
    assert res_forbidden.status_code == status.HTTP_403_FORBIDDEN


def test_api_portfolio_transactions_and_list(client, auth_headers_user_a):
    """Verify listing portfolios and executing transactions via API."""
    # List portfolios
    res = client.get("/api/portfolio/list", headers=auth_headers_user_a)
    assert res.status_code == status.HTTP_200_OK
    portfolios = res.json()
    assert len(portfolios) >= 1
    port_id = portfolios[0]["id"]

    # Record transaction via API
    txn_res = client.post(
        "/api/portfolio/transaction",
        headers=auth_headers_user_a,
        json={
            "symbol": "HDFCBANK",
            "transaction_type": "BUY",
            "quantity": 25,
            "price": 1600.0,
            "fees": 15.0,
            "portfolio_id": port_id
        }
    )
    assert txn_res.status_code == status.HTTP_200_OK
    txn_data = txn_res.json()
    assert txn_data["symbol"] == "HDFCBANK"
    assert txn_data["quantity"] == 25.0

    # Get transaction history
    hist_res = client.get(
        f"/api/portfolio/transactions/list?portfolio_id={port_id}",
        headers=auth_headers_user_a
    )
    assert hist_res.status_code == status.HTTP_200_OK
    history = hist_res.json()
    assert len(history) == 1
    assert history[0]["symbol"] == "HDFCBANK"
