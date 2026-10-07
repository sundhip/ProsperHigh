import os
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session
from backend.core.config import settings
from backend.database.models import Base

# Database engine configuration
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

connect_args = {}
if is_sqlite:
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

# Enforce foreign key constraints on SQLite
if is_sqlite:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI database session dependency with guaranteed closure."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> bool:
    """Test database connectivity with a lightweight ping query."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


def init_db():
    """Create all database tables defined in models."""
    Base.metadata.create_all(bind=engine)
