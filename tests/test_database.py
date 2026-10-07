import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from backend.database.models import User, InvestorProfile, FinancialProfile, Holding, AnalysisHistory
from backend.core.security import hash_password


def test_database_connection(db_session):
    """Test raw database connectivity."""
    result = db_session.execute(text("SELECT 1")).scalar()
    assert result == 1


def test_user_creation_and_relationships(db_session):
    """Test User model creation, defaults, and relationships."""
    user = User(
        name="Test User",
        email="test@example.com",
        password_hash=hash_password("Password123")
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id.startswith("USR-")
    assert user.is_active is True
    assert user.created_at is not None
    assert user.updated_at is not None

    # Attach profile and holding
    prof = InvestorProfile(user_id=user.id, risk_score=60, risk_category="Balanced Growth")
    fin = FinancialProfile(user_id=user.id)
    holding = Holding(user_id=user.id, symbol="RELIANCE", quantity=10, average_price=2800.0)
    db_session.add_all([prof, fin, holding])
    db_session.commit()

    db_session.refresh(user)
    assert user.investor_profile.risk_score == 60
    assert len(user.holdings) == 1
    assert user.holdings[0].symbol == "RELIANCE"


def test_unique_email_constraint(db_session):
    """Verify unique constraint on user email."""
    user1 = User(name="User 1", email="duplicate@example.com", password_hash=hash_password("Pass1"))
    user2 = User(name="User 2", email="duplicate@example.com", password_hash=hash_password("Pass2"))

    db_session.add(user1)
    db_session.commit()

    db_session.add(user2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_cascade_delete(db_session):
    """Verify that deleting a User cascades to their profiles and holdings."""
    user = User(name="Cascade Target", email="cascade@example.com", password_hash=hash_password("Pass"))
    db_session.add(user)
    db_session.commit()

    prof = InvestorProfile(user_id=user.id)
    fin = FinancialProfile(user_id=user.id)
    holding = Holding(user_id=user.id, symbol="TCS", quantity=5, average_price=3500.0)
    analysis = AnalysisHistory(user_id=user.id, symbol="TCS", final_decision="BUY", confidence=85, net_score=15)
    db_session.add_all([prof, fin, holding, analysis])
    db_session.commit()

    user_id = user.id
    db_session.delete(user)
    db_session.commit()

    assert db_session.query(InvestorProfile).filter(InvestorProfile.user_id == user_id).first() is None
    assert db_session.query(FinancialProfile).filter(FinancialProfile.user_id == user_id).first() is None
    assert db_session.query(Holding).filter(Holding.user_id == user_id).all() == []
    assert db_session.query(AnalysisHistory).filter(AnalysisHistory.user_id == user_id).all() == []
