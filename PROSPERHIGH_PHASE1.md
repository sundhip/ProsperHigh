# ProsperHigh — Phase 1: Production Foundation & Architecture

## 1. Executive Summary

Phase 1 established the production-grade foundation for **ProsperHigh** — transitioning the application from a demo prototype with client-side localStorage fallbacks and unauthenticated raw SQLite queries into an enterprise-ready, layered architecture with a single source of persistent truth in PostgreSQL/SQLAlchemy, cryptographically secure JWT authentication, server-side ownership authorization, Alembic database migrations, and clean data boundaries.

---

## 2. Architecture Comparison

### Existing Architecture (Pre-Phase 1)
- **Database**: Ad-hoc raw SQLite script (`sqlite3` DDL executed at import time in `backend/database/models.py`) with no migrations or connection pooling.
- **Data Boundaries**: When the backend was offline, the Next.js frontend silently fabricated users (`USR-Date.now()`, `PH-TOKEN-Date.now()`), synthetic portfolio metrics, fake 6-agent stock analysis recommendations, and hardcoded annual report citations directly in `frontend/lib/api.ts` and `localStorage`.
- **Authentication**: Demo SHA-256 password hashing; issued unstored fake tokens (`PH-TOKEN-...`) that were never validated on subsequent API calls.
- **Authorization**: APIs accepted unauthenticated requests with arbitrary `user_id` query/body parameters. Any user could spoof or mutate any other user's portfolio or profile.
- **API Layer**: Unstructured dictionary endpoints in `backend/main.py` without Pydantic response models, unified error formats, or database dependency lifecycles.
- **CORS & Security**: Permissive wildcard `allow_origins=["*"]` with no security response headers.

### Confirmed Production Architecture (Post-Phase 1)
```
Frontend (Next.js 14 App Router, TypeScript, Tailwind CSS)
   │  HTTPS + Bearer JWT Tokens
   ▼
API Gateway Layer (FastAPI, Lifespan Handler, Security Headers, CORS Policy)
   │  Dependency Injection: get_db, get_current_user
   ▼
API Routers & Schemas (Pydantic v2 Request/Response Validation, Truthful Errors)
   │
   ▼
Service Layer (AuthService, ProfileEngine, PortfolioService, AnalyticsEngine, Model-Agnostic Routers)
   │
   ▼
Data Access & ORM (SQLAlchemy 2.0 Declarative Models, Clean Session Lifecycle)
   │
   ▼
Database (PostgreSQL / SQLite Dev-Fallback, Managed via Alembic Migrations)
```

---

## 3. Database Architecture

### Engine & ORM
- **Engine**: SQLAlchemy 2.0 with connection pooling (`pool_pre_ping=True`) and dialect abstraction supporting production PostgreSQL (`postgresql+psycopg2://...`) and development SQLite.
- **Foreign Key Enforcement**: Enabled across all dialects (including SQLite via connection pragmas).
- **Session Management**: Generator `get_db()` provides scoped transaction management with guaranteed closure in `backend/database/session.py`.

### Schema Models (`backend/database/models.py`)
1. **`users`**:
   - `id`: String(36) PK (`USR-...`)
   - `name`: String(100) NOT NULL
   - `email`: String(255) UNIQUE NOT NULL (Indexed)
   - `password_hash`: String(255) NOT NULL (Bcrypt)
   - `is_active`: Boolean NOT NULL DEFAULT True
   - `created_at`, `updated_at`: DateTime(timezone=True) NOT NULL
2. **`investor_profiles`**:
   - `user_id`: String(36) PK, FK(`users.id`, ON DELETE CASCADE)
   - 10-step wizard state: `country`, `currency`, `market_preference`, `experience_level`, `past_assets` (JSON), `primary_goals` (JSON), `primary_goal_top`, `investment_horizon`, `loss_reaction`, `volatility_comfort`, `risk_score`, `risk_category`, `max_stock_exposure_pct`, `avoided_sectors` (JSON), `onboarding_completed`.
   - `created_at`, `updated_at`: DateTime(timezone=True)
3. **`financial_profiles`**:
   - `user_id`: String(36) PK, FK(`users.id`, ON DELETE CASCADE)
   - Context: `planned_investment`, `current_invested`, `monthly_capacity`, `emergency_savings`, `financial_obligations` (JSON)
   - `created_at`, `updated_at`: DateTime(timezone=True)
4. **`holdings`**:
   - `id`: Integer PK Autoincrement
   - `user_id`: String(36) FK(`users.id`, ON DELETE CASCADE, Indexed)
   - `symbol`: String(30) NOT NULL (Indexed)
   - `name`, `sector`: String NOT NULL/NULL
   - `quantity`: Integer NOT NULL
   - `average_price`: Float NOT NULL
   - `purchase_date`, `created_at`, `updated_at`: DateTime(timezone=True)
5. **`analyses`**:
   - `id`: String(64) PK (`ANL-...`)
   - `user_id`: String(36) FK(`users.id`, ON DELETE CASCADE, Indexed)
   - `symbol`: String(30) NOT NULL (Indexed)
   - `final_decision`: String(50), `confidence`: Integer, `net_score`: Integer, `summary`: Text, `full_json`: JSON
   - `created_at`: DateTime(timezone=True)

### Migrations (Alembic)
- Alembic configured via `alembic.ini` and `alembic/env.py`.
- Dynamic connection binding from `settings.DATABASE_URL`.
- Baseline migration applied: `001_initial_schema` (`d749c3262150`).

---

## 4. Authentication Architecture

- **Password Hashing**: Implemented with `bcrypt` (12 rounds) with salted password digests. Replaced insecure raw SHA-256 digests.
- **Token Generation**: Cryptographically signed JSON Web Tokens (`HS256`) containing standard claims (`sub: user_id`, `iat`, `exp`, `type: "access"`, `name`, `email`).
- **Token Verification**: Handled via `backend/core/security.py` and `backend/api/deps.py` (`get_current_user`). Returns HTTP 401 Unauthorized with standard `WWW-Authenticate: Bearer` header on missing, malformed, or expired credentials.
- **Frontend Session**: `frontend/lib/auth.ts` manages access tokens and transmits `Authorization: Bearer <token>` automatically on all protected requests.

---

## 5. Authorization Model

- **Server-Side Ownership Enforcement**: Browser-supplied `user_id` inputs are never trusted to determine data ownership.
- **Profile Endpoints**:
  - `GET /api/profile/me`: Returns the authenticated user's profile.
  - `GET /api/profile/{user_id}`: Verifies `current_user.id == user_id`. If cross-user access is attempted, strictly rejects with **HTTP 403 Forbidden**.
  - `POST /api/profile/onboarding`: Saves profile directly against `current_user.id`.
- **Portfolio Endpoints**:
  - `GET /api/portfolio/me`: Scoped to `current_user.id`.
  - `POST /api/portfolio/holding`: Inserts holding bound to `current_user.id`.
  - `DELETE /api/portfolio/holding/{holding_id}`: Performs ownership query `WHERE id = :id AND user_id = :user_id`. If holding belongs to another user, rejects with **HTTP 404/403**.
- **Analysis Endpoint**:
  - `POST /api/analyze`: Requires valid JWT and personalizes risk scoring using `current_user.id`'s real database portfolio and profile.

---

## 6. API Architecture & Schemas

### Route Organization
- `backend/api/routers/health.py`: Liveness (`/api/health`) and database readiness (`/api/health/ready`).
- `backend/api/routers/auth.py`: Registration, login, and user profile resolution (`/api/auth/*`).
- `backend/api/routers/profile.py`: Profile retrieval and onboarding wizard submission (`/api/profile/*`).
- `backend/api/routers/portfolio.py`: Holdings CRUD and deterministic portfolio analytics (`/api/portfolio/*`).
- `backend/api/routers/stocks.py`: Live universe ticker and stock symbol search (`/api/market/*`, `/api/stocks/*`).
- `backend/api/routers/analysis.py`: Multi-agent synthesis pipeline (`/api/analyze`).
- `backend/api/routers/research.py`: RAG research query endpoint (`/api/research/*`).

### Validation & Error Handling
- Structured Pydantic v2 schemas in `backend/schemas/` (`auth.py`, `profile.py`, `portfolio.py`, `stocks.py`, `analysis.py`, `research.py`, `health.py`, `error.py`).
- Global exception handlers in `backend/main.py` convert Pydantic validation errors into structured 422 responses and HTTP exceptions into consistent payloads:
  ```json
  {
    "detail": "Descriptive error message",
    "status_code": 401
  }
  ```

---

## 7. Configuration Strategy & Secrets Management

- Centralized configuration via `pydantic-settings.BaseSettings` in `backend/core/config.py`.
- Complete `.env.example` created in project root documenting development and production variables.
- All secrets (`JWT_SECRET_KEY`, `DATABASE_URL`, API keys) moved outside source code into environment variables.
- Git configuration (`.gitignore`) verifies `.env` and `*.db` files are ignored.
- Backward compatibility layer maintained in `backend/config.py` forwarding legacy imports to `settings`.

---

## 8. Security Hardening

1. **CORS Policy**: Restricted from wildcard `*` to explicit origins via `settings.ALLOWED_ORIGINS` (defaults to `http://localhost:3000,http://127.0.0.1:3000`, configurable per environment).
2. **Security Headers**: Injected via FastAPI middleware on every response:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
3. **Elimination of Fake Data Fabrication**:
   - `frontend/lib/api.ts`: Completely removed synthetic user creation (`USR-${Date.now()}`), fake token generation, fake portfolio calculation fallback, and fake analysis synthesis (`getFallbackAnalysis`). The frontend now surfaces truthful error/offline states.
   - `frontend/app/settings/page.tsx`: Removed hardcoded demo strings (`"Rohith Kumar"`, `"rohith@example.com"`).
   - `backend/services/market_provider.py`: Eliminated dynamic fabrication of arbitrary stock prices (e.g. ₹1250, ₹1450).
   - `backend/services/data_service.py`: Replaced hardcoded fallback to seed user `U001` with database queries and clean empty defaults.
   - `backend/agents/synthesis_agent.py`: Removed hardcoded `symbol == "RELIANCE" and user_id == "U001"` special cases in stock switching.

---

## 9. Testing & Verification Performed

### 1. Automated Test Suite (`pytest tests/ -v`)
23 tests implemented across 4 test modules, all passing:
- `tests/test_api_validation.py`:
  - `test_health_liveness_endpoint` (PASSED)
  - `test_health_readiness_endpoint` (PASSED)
  - `test_registration_validation_errors` (PASSED)
  - `test_holding_validation_errors` (PASSED)
  - `test_stock_search_and_ticker` (PASSED)
  - `test_research_ask` (PASSED)
- `tests/test_auth.py`:
  - `test_register_user_success` (PASSED)
  - `test_register_duplicate_email` (PASSED)
  - `test_login_success` (PASSED)
  - `test_login_incorrect_password` (PASSED)
  - `test_login_nonexistent_email` (PASSED)
  - `test_password_is_properly_hashed` (PASSED)
  - `test_auth_me_endpoint` (PASSED)
  - `test_auth_me_unauthenticated` (PASSED)
- `tests/test_database.py`:
  - `test_database_connection` (PASSED)
  - `test_user_creation_and_relationships` (PASSED)
  - `test_unique_email_constraint` (PASSED)
  - `test_cascade_delete` (PASSED)
- `tests/test_protected_routes.py`:
  - `test_unauthenticated_protected_requests` (PASSED)
  - `test_invalid_bearer_token` (PASSED)
  - `test_user_ownership_profile_isolation` (PASSED)
  - `test_user_ownership_portfolio_isolation` (PASSED)
  - `test_user_holding_creation_and_cross_user_deletion` (PASSED)

### 2. Frontend Production Build (`npm run build`)
- Next.js 14.2 production compilation and optimization completed with **0 errors**.
- All 12 routes successfully generated and statically optimized.

### 3. Live Server End-to-End Verification
- Started `uvicorn backend.main:app --port 8000`.
- Verified `/api/health` returned 200 OK with security headers.
- Verified `/api/health/ready` tested DB connectivity and returned 200 OK.
- Verified real registration (`USR-65248180`) returned 201 Created with signed JWT.
- Verified login returned 200 OK.
- Verified protected endpoints rejected unauthenticated requests with 401 and accepted valid JWTs with 200.

---

## 10. Remaining Technical Debt & Decisions Made

### Decisions Made
1. **Preservation of Existing Agent Architecture**: Preserved the 7 domain analysis agents and deterministic financial formulas intact, isolating them behind clean services without rewriting core domain calculations.
2. **Dual-Dialect Database Compatibility**: Implemented PostgreSQL-first ORM definitions while maintaining SQLite developer/test mode via SQLite connection pragmas (`PRAGMA foreign_keys=ON`) and connection pooling abstractions.
3. **Single Source of Truth**: Completely removed parallel localStorage data stores for persistent application entities.

### Remaining Technical Debt & Known Limitations
1. **In-Memory/JSON Seed Data for Stocks**: Stock quotes and market data currently originate from `backend/services/market_provider.py` and `backend/data/` static fixtures; a live external market data provider (e.g., Yahoo Finance, NSE/BSE API) should be plugged in during Phase 2.
2. **History Page Persistence**: The frontend history view currently displays a static table; it can be wired to the persistent `analyses` table in Phase 2.

---

## 11. Deferred to Phase 2+

The following items were intentionally deferred in accordance with Phase 1 constraints:
- Real-time market data feed integration (AlphaVantage, Yahoo Finance, Zerodha Kite Connect).
- Multi-agent LLM router runtime optimization and streaming token responses.
- Vector database / dense embeddings for company filings in RAG terminal (ChromaDB / pgvector).
- Comprehensive UI redesign or overhaul.
