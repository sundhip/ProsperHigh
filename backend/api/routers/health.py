from fastapi import APIRouter, HTTPException, status
from backend.core.config import settings
from backend.database.session import check_database_connection
from backend.schemas.health import HealthResponse, ReadinessResponse

router = APIRouter(tags=["Health & Diagnostics"])


@router.get("/health", response_model=HealthResponse)
@router.get("/health/live", response_model=HealthResponse)
@router.get("/api/health", response_model=HealthResponse)
@router.get("/api/health/live", response_model=HealthResponse)
def health_check():
    """Liveness probe: returns 200 OK if service process is running."""
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/health/ready", response_model=ReadinessResponse)
@router.get("/api/health/ready", response_model=ReadinessResponse)
def readiness_check():
    """Readiness probe: verifies operational connectivity to the persistent database."""
    db_ok = check_database_connection()
    if not db_ok:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connectivity check failed.",
        )
    return {
        "status": "ready",
        "database": "connected",
        "environment": settings.ENVIRONMENT,
    }


@router.get("/health/metrics")
@router.get("/api/health/metrics")
def metrics_check():
    """
    Operational observability metrics endpoint.
    Exposes pool configuration, cache state, and operational capacity without exposing secrets.
    """
    from backend.services.market_data.service import market_data_service
    from backend.services.jobs.manager import job_manager
    from backend.database.session import is_sqlite

    db_ok = check_database_connection()
    return {
        "status": "healthy" if db_ok else "degraded",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": {
            "connected": db_ok,
            "engine": "sqlite" if is_sqlite else "postgresql",
            "pool_size": settings.DB_POOL_SIZE,
            "max_overflow": settings.DB_MAX_OVERFLOW,
        },
        "market_data": {
            "cached_symbols": len(market_data_service._cache),
            "primary_provider": "live" if market_data_service.live_provider else "dev",
        },
        "background_jobs": {
            "total_jobs": len(job_manager._jobs),
            "active_or_pending": sum(1 for j in job_manager._jobs.values() if j.status in ["PENDING", "RUNNING"]),
        },
        "ai_engine": {
            "max_concurrent_analyses": settings.AI_MAX_CONCURRENT_ANALYSES,
            "analysis_timeout_seconds": settings.AI_ANALYSIS_TIMEOUT_SECONDS,
            "agent_timeout_seconds": settings.AI_AGENT_TIMEOUT_SECONDS,
        },
    }
