import pytest
from sqlalchemy.orm import Session

from backend.database.models import User, Portfolio, Holding, InvestorProfile
from backend.services.portfolio_service import portfolio_service


def test_portfolio_composition_and_hhi_calculation(db_session: Session):
    """Verify deterministic calculation of HHI index, position weights, and concentration."""
    user = User(name="HHI Investor", email="hhi@test.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    port = portfolio_service.get_or_create_default_portfolio(db_session, user.id)

    # Add 3 holdings: 50%, 30%, 20%
    h1 = Holding(portfolio_id=port.id, user_id=user.id, symbol="STOCK1", quantity=50, average_price=100.0, sector="Technology")
    h2 = Holding(portfolio_id=port.id, user_id=user.id, symbol="STOCK2", quantity=30, average_price=100.0, sector="Finance")
    h3 = Holding(portfolio_id=port.id, user_id=user.id, symbol="STOCK3", quantity=20, average_price=100.0, sector="Consumer")
    db_session.add_all([h1, h2, h3])
    db_session.commit()

    comp = portfolio_service.analyze_portfolio_composition(db_session, user.id, port.id)

    assert comp["holdings_count"] == 3
    assert comp["total_value"] == 10000.0
    assert comp["top3_concentration_pct"] == 100.0
    # HHI = 50^2 + 30^2 + 20^2 = 2500 + 900 + 400 = 3800
    assert comp["hhi_index"] == 3800.0
    assert comp["hhi_category"] == "HIGHLY_CONCENTRATED"
    assert comp["sector_count"] == 3


def test_target_allocation_drift_honesty(db_session: Session):
    """Verify target drift returns None if user has not set targets, and calculates delta if provided."""
    user = User(name="Drift User", email="drift@test.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    port = portfolio_service.get_or_create_default_portfolio(db_session, user.id)
    h = Holding(portfolio_id=port.id, user_id=user.id, symbol="TCS", quantity=10, average_price=1000.0, sector="Technology")
    db_session.add(h)
    db_session.commit()

    # 1. No profile targets -> target_allocation_drift must be None
    comp1 = portfolio_service.analyze_portfolio_composition(db_session, user.id, port.id)
    assert comp1["target_allocation_drift"] is None

    # 2. User defines target allocations
    prof = InvestorProfile(
        user_id=user.id,
        target_allocations={"Equities": 50.0, "Debt": 50.0},
        is_complete=True
    )
    db_session.add(prof)
    db_session.commit()

    comp2 = portfolio_service.analyze_portfolio_composition(db_session, user.id, port.id)
    drift = comp2["target_allocation_drift"]
    assert drift is not None
    assert drift["has_targets"] is True
    # Equities actual is 100%, target is 50%, drift is +50%
    eq_drift = next(item for item in drift["allocations"] if item["category"] == "Equities")
    assert eq_drift["actual_pct"] == 100.0
    assert eq_drift["target_pct"] == 50.0
    assert eq_drift["drift_pct"] == 50.0
    assert eq_drift["status"] == "OVERWEIGHT"


def test_pre_trade_impact_does_not_mutate_holdings(db_session: Session):
    """Verify pre-trade simulation executes purely in-memory with zero DB writes."""
    user = User(name="PreTrade User", email="pretrade@test.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    port = portfolio_service.get_or_create_default_portfolio(db_session, user.id)
    h = Holding(portfolio_id=port.id, user_id=user.id, symbol="RELIANCE", quantity=10, average_price=2000.0, sector="Energy")
    db_session.add(h)
    db_session.commit()

    initial_holdings_count = db_session.query(Holding).filter(Holding.user_id == user.id).count()

    # Run pre-trade impact for INFOSYS
    impact = portfolio_service.calculate_pre_trade_impact(
        db=db_session,
        user_id=user.id,
        symbol="INFY",
        quantity=10,
        price=1500.0,
        transaction_type="BUY"
    )

    assert impact["symbol"] == "INFY"
    assert impact["baseline"]["total_portfolio_value"] > 0
    assert impact["projected"]["total_portfolio_value"] == round(impact["baseline"]["total_portfolio_value"] + impact["trade_amount"], 2)
    assert impact["projected"]["position_weight_pct"] > 0

    # Verify holdings count in database is completely unchanged!
    post_count = db_session.query(Holding).filter(Holding.user_id == user.id).count()
    assert post_count == initial_holdings_count

