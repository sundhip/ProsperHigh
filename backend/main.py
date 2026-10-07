import os
import sys
from contextlib import asynccontextmanager
from typing import Dict, Any

# Ensure project root is on Python sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from backend.core.config import settings
from backend.core.logging import setup_logging, logger
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
    logger.info(f"Shutting down {settings.APP_NAME}")


app = FastAPI(
    title=settings.APP_NAME,
    description="Explainable Multi-Agent Investment Intelligence Platform API",
    version=settings.APP_VERSION,
    lifespan=lifespan
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
)


# 2. Security Headers Middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# 3. Structured Error Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "status_code": exc.status_code
        },
        headers=exc.headers
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        errors.append({
            "location": loc,
            "message": err.get("msg"),
            "type": err.get("type")
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Request validation failed.",
            "status_code": 422,
            "validation_errors": errors
        }
    )


# 4. Mount API Routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(portfolio.router)
app.include_router(stocks.router)
app.include_router(analysis.router)
app.include_router(research.router)
