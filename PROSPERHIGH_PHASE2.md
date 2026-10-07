# ProsperHigh — Phase 2: Real Data & Core Platform Architecture

## Executive Summary
Phase 2 replaces all demo-oriented core financial data structures with a real, end-to-end persistent platform. The PostgreSQL/SQLite database serves as the single source of truth for investor profiles, portfolios, transactions, holdings, and securities. Market data providers are abstracted behind a unified interface with in-memory TTL caching and staleness detection. All portfolio analytics are computed deterministically, and portfolio imports execute with full transactional rollback safety.

---

## 1. Database Schema & Migrations

### Applied Migrations
1. **`001_initial_schema`**: Users, password hashing, Investor Profile, Financial Profile, initial holdings.
2. **`d6cf4a775952_002_real_data_platform`**: Added enterprise portfolio management and market securities schema.

### Core Tables & Relationships
- **`portfolios`** (`Portfolio`):
  - Primary Key: `id` (`PORT-...`)
  - Foreign Key: `user_id` -> `users.id` (Indexed, CASCADE delete)
  - Fields: `name`, `currency` (default INR), `is_default`, `status`, `created_at`, `updated_at`
- **`securities`** (`Security`):
  - Primary Key: `id` (Integer autoincrement)
  - Unique Index: `symbol`
  - Fields: `name`, `exchange` (NSE/BSE), `sector`, `asset_class`, `currency`
- **`transactions`** (`Transaction`):
  - Primary Key: `id` (`TXN-...`)
  - Foreign Keys: `portfolio_id` -> `portfolios.id`, `user_id` -> `users.id`
  - Fields: `symbol`, `transaction_type` (BUY, SELL, DIVIDEND), `quantity`, `price`, `fees`, `total_amount`, `executed_at`, `notes`
- **`holdings`** (`Holding`):
  - Linked to `portfolio_id` and optional `security_id`
  - Fields: `symbol`, `name`, `sector`, `quantity` (Float), `average_price` (Cost Basis), `purchase_date`

---

## 2. Market Data Architecture & Caching

### Provider Abstraction (`backend/services/market_data/`)
- **`BaseMarketDataProvider`** (`base.py`):
  - Standard interface specifying `get_quote(symbol)` and `search_symbols(query)`.
  - Standard normalized quote object: `NormalizedQuote(symbol, name, price, previous_close, change, change_pct, exchange, sector, currency, as_of, is_stale, is_available, provider)`.
- **`DevMarketDataProvider`** (`dev_provider.py`):
  - Deterministic fixture provider covering prominent NSE/BSE equities (IT, Financials, Energy, Auto, Consumer, Telecom, Healthcare).
  - Explicitly returns `None` for unlisted/unknown symbols to avoid fabricating artificial or hallucinated prices.
- **`LiveMarketDataProvider`** (`live_provider.py`):
  - Real-world HTTP provider with configurable timeouts and robust error handling.
- **`MarketDataService`** (`service.py`):
  - Coordinates provider lookups with an in-memory TTL cache (60 seconds default).
  - Flags `is_stale: True` if returning cached data during external outage or closed market hours.
  - Exposes `get_popular_universe()` and `search_symbols(query)`.

---

## 3. Portfolio Reconciliation & Calculations

### Transaction & Holding Reconciliation (`backend/services/transaction_service.py`)
- **BUY Orders**:
  - Automatically verifies or creates the underlying `Security` record.
  - Updates existing holding with weighted average cost basis:
    $$\text{Average Price} = \frac{(\text{Existing Qty} \times \text{Avg Price}) + (\text{New Qty} \times \text{New Price})}{\text{Existing Qty} + \text{New Qty}}$$
- **SELL Orders**:
  - Validates holding existence and share balance.
  - Rejects over-selling with `400 Bad Request` (`"Cannot SELL X shares. Only Y shares held"`).
  - Automatically deletes holding when remaining quantity reaches zero.
- **Atomic Operations**:
  - Supports `commit=False` for atomic multi-row batch execution.

### Deterministic Portfolio Calculations (`backend/services/portfolio_service.py`)
- **Total Invested Amount**:
  $$\text{Invested} = \sum (\text{Holding Quantity} \times \text{Average Cost Price})$$
- **Total Current Portfolio Value**:
  $$\text{Value} = \sum (\text{Holding Quantity} \times \text{Current Market Price})$$
- **Profit & Loss**:
  $$\text{P\&L} = \text{Total Portfolio Value} - \text{Total Invested Amount}$$
- **Return Percentage**:
  $$\text{Return \%} = \frac{\text{P\&L}}{\text{Total Invested Amount}} \times 100$$
- **Sector Exposure**:
  - Grouped by sector and weighted as percentage of total portfolio value; sums deterministically to 100%.
- **Zero-Division Protection**:
  - Empty portfolios cleanly return `0.0` value, `0.0%` return, and `{}` sector exposure without runtime errors.

---

## 4. Atomic CSV Import Engine

### Implementation (`backend/services/csv_import_service.py`)
- **Header Inspection**: Requires case-insensitive columns for Symbol/Ticker, Quantity/Shares, and Price/Cost.
- **Row-by-Row Validation**: Rejects invalid numeric values, zero/negative quantities, and negative prices.
- **ACID Transaction Guarantee**:
  - Executes all valid rows within a single database transaction (`with db.begin_nested()`).
  - If any row encounters an error during import, the entire batch is rolled back immediately. Zero partial state is committed.

---

## 5. API Layer & Verification

### Endpoints
| Method | Route | Description | Ownership Check |
|---|---|---|---|
| `GET` | `/api/portfolio/me` | Metrics for user's default portfolio | Current User |
| `GET` | `/api/portfolio/list` | List all portfolios owned by user | Current User |
| `GET` | `/api/portfolio/{user_id}` | Portfolio metrics by user ID | 403 on mismatch |
| `POST` | `/api/portfolio/holding` | Add holding to portfolio | Current User |
| `DELETE` | `/api/portfolio/holding/{id}` | Delete holding from portfolio | Current User |
| `POST` | `/api/portfolio/transaction` | Execute BUY/SELL transaction | Current User |
| `GET` | `/api/portfolio/transactions/list`| Get historical transactions | Current User |
| `POST` | `/api/portfolio/import-csv` | Atomic CSV import | Current User |
| `GET` | `/api/market/quote/{symbol}` | Normalized market quote | Public (404 on unlisted) |
| `GET` | `/api/market/ticker` | Ticker universe | Public |
| `GET` | `/api/stocks/search` | Search securities universe | Public |
| `PUT` | `/api/profile/me` | Update investor profile | Current User |

---

## 6. Frontend Integration

1. **`frontend/lib/api.ts`**:
   - Added client bindings: `updateProfile()`, `listPortfolios()`, `getTransactions()`, `createTransaction()`, `importPortfolioCSV()`, `getQuote()`.
2. **`frontend/app/portfolio/page.tsx`**:
   - Wired CSV upload modal to call `importPortfolioCSV(file)`.
   - Rendered real-time validation error alerts and success notifications.
   - Displayed market data quote availability badges (`(cost basis)` fallback indicator).
   - Displayed stale market data notice if quotes are cached.
3. **`frontend/app/page.tsx`**:
   - Removed all artificial price multipliers (`* 1.02`, `* 1.05`, etc.).
   - Connected performance valuation area chart directly to real portfolio positions.
   - Added empty-state handling for new accounts with 0 holdings.

---

## 7. Verification & Automated Test Results

### Test Execution
- Total Tests: **39 passing** (0 failures, 100% pass rate)
- Suite breakdown:
  - `tests/test_portfolio_domain.py`: Default portfolio auto-creation, BUY/SELL transaction reconciliation, weighted average cost, oversell rejection, ownership isolation.
  - `tests/test_market_data.py`: Quote retrieval, caching TTL, unlisted stock 404, ticker universe, search.
  - `tests/test_calculations.py`: Empty portfolio protection, deterministic invested/value/P&L/return math, sector exposure weights.
  - `tests/test_csv_import.py`: Valid import, header validation, atomic rollback on invalid row, API endpoint.
  - `tests/test_auth.py`, `tests/test_database.py`, `tests/test_api_validation.py`, `tests/test_protected_routes.py`: Phase 1 regressions all passing.

### Production Build
- `next build`: Successfully compiled all 12 routes with zero TypeScript errors or warnings.

---

## 8. Deferred to Future Phases (Explicitly Not Implemented)
- Phase 3: The 7 Autonomous AI Financial Agents (Market Analyst, Quant Risk, Valuation, Macro, Sentiment, Fundamental, Synthesis Orchestrator).
- Phase 3/4: RAG System, Vector Store, Financial Document Ingestion, Embedding Pipelines.
