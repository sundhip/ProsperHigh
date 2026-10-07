from fastapi import APIRouter, HTTPException, status
from backend.core.config import settings
from backend.database.session import check_database_connection
from backend.schemas.health import HealthResponse, ReadinessResponse

router = APIRouter(prefix="/api", tags=["Health & Diagnostics"])


@router.get("/health", response_model=HealthResponse)
def health_check():
    """Liveness probe: returns 200 OK if service process is running."""
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


@router.get("/health/ready", response_model=ReadinessResponse)
def readiness_check():
    """Readiness probe: verifies operational connectivity to the persistent database."""
    db_ok = check_database_connection()
    if not db_ok:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connectivity check failed."
        )
    return {
        "status": "ready",
        "database": "connected",
        "environment": settings.ENVIRONMENT
    }
