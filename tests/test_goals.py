import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from backend.database.models import User, Portfolio, Holding
from backend.services.portfolio_service import portfolio_service
from backend.services.goal_service import goal_service


def test_goal_creation_and_progress_calculation(db_session: Session):
    """Verify financial goal progress and savings gap calculated deterministically against portfolio."""
    user = User(name="Goal Investor", email="goal@test.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    # User portfolio has 25,000 INR
    port = portfolio_service.get_or_create_default_portfolio(db_session, user.id)
    h = Holding(portfolio_id=port.id, user_id=user.id, symbol="SAFE", quantity=25, average_price=1000.0)
    db_session.add(h)
    db_session.commit()

    # Create goal for 100,000 INR in 12 months
    target_date = datetime.now(timezone.utc) + timedelta(days=365)
    goal = goal_service.create_goal(
        db=db_session,
        user_id=user.id,
        name="House Downpayment",
        target_amount=100000.0,
        target_date=target_date,
        monthly_contribution=5000.0,
        portfolio_id=port.id
    )

    assert goal["name"] == "House Downpayment"
    assert goal["current_portfolio_value"] == 25000.0
    assert goal["progress_percentage"] == 25.0
    assert goal["funding_gap"] == 75000.0
    assert goal["months_remaining"] == 12
    # 75,000 / 12 months = 6,250 / month required
    assert goal["required_monthly_savings_at_zero_growth"] == 6250.0


def test_goal_isolation_across_users(db_session: Session):
    """Verify users cannot view, edit, or delete goals of another user."""
    u1 = User(name="Goal 1", email="g1@test.com", password_hash="hash")
    u2 = User(name="Goal 2", email="g2@test.com", password_hash="hash")
    db_session.add_all([u1, u2])
    db_session.commit()

    g = goal_service.create_goal(db_session, user_id=u1.id, name="U1 Goal", target_amount=50000.0)
    goal_id = g["id"]

    # User 2 list is empty
    u2_goals = goal_service.list_goals(db_session, u2.id)
    assert len(u2_goals) == 0

    # User 2 cannot access User 1's goal
    with pytest.raises(Exception):
        goal_service.get_goal(db_session, u2.id, goal_id)

    # User 2 cannot delete User 1's goal
    with pytest.raises(Exception):
        goal_service.delete_goal(db_session, u2.id, goal_id)

    # User 1 deletes successfully
    assert goal_service.delete_goal(db_session, u1.id, goal_id) is True
