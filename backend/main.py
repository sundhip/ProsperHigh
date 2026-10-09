import os
import sys
import time
import uuid
from contextlib import asynccontextmanager
from typing import Dict, Any

# Ensure project root is on Python sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from backend.core.config import settings
from backend.core.logging import setup_logging, logger, request_id_ctx
from backend.core.rate_limiter import rate_limiter
from backend.database.session import check_database_connection, init_db

# Routers
from backend.api.routers import (
    health,
    auth,
    profile,
    portfolio,
    stocks,
    analysis,
    research,
    jobs,
    goals,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging()
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} [{settings.ENVIRONMENT}]")
    db_connected = check_database_connection()
    if db_connected:
        logger.info("Database connection established successfully.")
    else:
        logger.warning("Database connection failed or not yet initialized.")
        try:
            init_db()
            logger.info("Database tables initialized.")
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
    yield
    # Shutdown
    logger.info(f"Shutting down {settings.APP_NAME} gracefully.")


app = FastAPI(
    title=settings.APP_NAME,
    description="Explainable Multi-Agent Investment Intelligence Platform API",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# 1. Environment-based CORS Configuration
origins = settings.ALLOWED_ORIGINS
if isinstance(origins, str):
    origins = [origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "Retry-After"],
)


# 2. Request Correlation & Observability Middleware
@app.middleware("http")
async def observability_and_correlation_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:12]}"
    token = request_id_ctx.set(req_id)
    request.state.request_id = req_id
    start_time = time.perf_counter()

    # Rate limiting check (exempting health checks)
    path = request.url.path
    if not path.startswith("/health"):
        client_ip = request.client.host if request.client else "127.0.0.1"
        limit = rate_limiter.get_limit_for_path(path)
        allowed, retry_after = rate_limiter.is_allowed(f"{client_ip}:{path}", limit)
        if not allowed:
            logger.warning(f"Rate limit exceeded for {client_ip} on {path}")
            request_id_ctx.reset(token)
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Too many requests. Please slow down and try again.",
                    "request_id": req_id,
                    "retry_after": retry_after,
                },
                headers={"Retry-After": str(retry_after), "X-Request-ID": req_id},
            )

    try:
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        response.headers["X-Request-ID"] = req_id

        # Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        if not path.startswith("/health"):
            logger.info(f"{request.method} {path} completed with {response.status_code} in {elapsed_ms:.1f}ms")

        return response
    finally:
        request_id_ctx.reset(token)


# 3. Global Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    req_id = getattr(request.state, "request_id", "-")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "status_code": exc.status_code,
            "request_id": req_id,
        },
        headers={**(exc.headers or {}), "X-Request-ID": req_id},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    req_id = getattr(request.state, "request_id", "-")
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        errors.append({
            "location": loc,
            "message": err.get("msg"),
            "type": err.get("type"),
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Request validation failed.",
            "status_code": 422,
            "validation_errors": errors,
            "request_id": req_id,
        },
        headers={"X-Request-ID": req_id},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "-")
    logger.exception(f"Unhandled server exception: {exc}")
    # Shield internal stack trace from end users
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred. Please contact support if the issue persists.",
            "status_code": 500,
            "request_id": req_id,
        },
        headers={"X-Request-ID": req_id},
    )


# 4. Mount API Routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(portfolio.router)
app.include_router(stocks.router)
app.include_router(analysis.router)
app.include_router(research.router)
app.include_router(jobs.router)
app.include_router(goals.router)

