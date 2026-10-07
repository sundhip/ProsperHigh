import os
import sys
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.models import Base, User, InvestorProfile, FinancialProfile
from backend.database.session import get_db
from backend.core.security import hash_password, create_access_token
from backend.main import app

# In-memory SQLite test database with StaticPool to share connection across threads/sessions
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

@event.listens_for(test_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database schema for each test, then drop it after."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI test client with get_db overridden to use test session."""
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_a(db_session):
    user = User(
        id="USR-USER-A",
        name="Alice Investor",
        email="alice@example.com",
        password_hash=hash_password("Password123!"),
        is_active=True
    )
    db_session.add(user)
    
    prof = InvestorProfile(
        user_id="USR-USER-A",
        risk_score=45,
        risk_category="Balanced Growth",
        onboarding_completed=True
    )
    db_session.add(prof)
    
    fin = FinancialProfile(user_id="USR-USER-A")
    db_session.add(fin)
    
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def token_user_a(test_user_a):
    return create_access_token(
        subject=test_user_a.id,
        extra_claims={"email": test_user_a.email, "name": test_user_a.name}
    )


@pytest.fixture
def auth_headers_user_a(token_user_a):
    return {"Authorization": f"Bearer {token_user_a}"}


@pytest.fixture
def test_user_b(db_session):
    user = User(
        id="USR-USER-B",
        name="Bob Trader",
        email="bob@example.com",
        password_hash=hash_password("SecretPass456!"),
        is_active=True
    )
    db_session.add(user)
    
    prof = InvestorProfile(
        user_id="USR-USER-B",
        risk_score=75,
        risk_category="Aggressive",
        onboarding_completed=True
    )
    db_session.add(prof)
    
    fin = FinancialProfile(user_id="USR-USER-B")
    db_session.add(fin)
    
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def token_user_b(test_user_b):
    return create_access_token(
        subject=test_user_b.id,
        extra_claims={"email": test_user_b.email, "name": test_user_b.name}
    )


@pytest.fixture
def auth_headers_user_b(token_user_b):
    return {"Authorization": f"Bearer {token_user_b}"}
