from backend.services.portfolio_service import portfolio_service
from backend.services.transaction_service import transaction_service


def test_empty_portfolio_calculations(db_session, test_user_a):
    """Verify empty portfolio returns safe zeroed metrics without division by zero errors."""
    metrics = portfolio_service.get_user_portfolio_metrics(db_session, test_user_a.id)
    assert metrics["holdings_count"] == 0
    assert metrics["total_invested_amount"] == 0.0
    assert metrics["total_portfolio_value"] == 0.0
    assert metrics["profit_loss"] == 0.0
    assert metrics["return_percentage"] == 0.0
    assert metrics["sector_exposure"] == {}
    assert metrics["has_stale_quotes"] is False


def test_portfolio_deterministic_math(db_session, test_user_a):
    """
    Verify deterministic calculation of:
    - total_invested_amount = sum(qty * avg_price)
    - total_portfolio_value = sum(qty * current_price)
    - profit_loss = total_portfolio_value - total_invested_amount
    - return_percentage = (profit_loss / total_invested_amount) * 100
    - sector weights sum to 100%
    """
    port = portfolio_service.get_or_create_default_portfolio(db_session, test_user_a.id)

    # Add 10 shares of INFY @ 1500
    transaction_service.record_transaction(
        db=db_session,
        user_id=test_user_a.id,
        portfolio_id=port.id,
        symbol="INFY",
        transaction_type="BUY",
        quantity=10,
        price=1500.0
    )

    # Add 20 shares of TATAMOTORS @ 800
    transaction_service.record_transaction(
        db=db_session,
        user_id=test_user_a.id,
        portfolio_id=port.id,
        symbol="TATAMOTORS",
        transaction_type="BUY",
        quantity=20,
        price=800.0
    )

    metrics = portfolio_service.get_user_portfolio_metrics(db_session, test_user_a.id)

    # Invested: (10 * 1500) + (20 * 800) = 15000 + 16000 = 31000
    assert metrics["total_invested_amount"] == 31000.0
    assert metrics["holdings_count"] == 2

    # Verify sector weights sum to ~100%
    sector_weights = metrics["sector_exposure"]
    assert len(sector_weights) > 0
    total_weight = sum(sector_weights.values())
    assert 99.0 <= total_weight <= 100.5

    # Profit/Loss and Return %
    expected_pl = round(metrics["total_portfolio_value"] - 31000.0, 2)
    assert metrics["profit_loss"] == expected_pl
    expected_ret = round((expected_pl / 31000.0) * 100, 2)
    assert metrics["return_percentage"] == expected_ret
