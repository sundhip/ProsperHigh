# ProsperHigh — Phase 2: Real Data & Portfolio Platform Audit

## 1. Audit of Existing Data Flows & Phase 1 Verification

Before expanding Phase 2, the Phase 1 production foundation was rigorously inspected:
- **PostgreSQL Database & Migrations**: Verified 5 versioned Alembic migrations (`001_initial_schema` through `005_add_google_auth`). All foreign key constraints, cascades, indexes, and timezone-aware timestamps operate correctly.
- **Authentication & User Isolation**: Verified `bcrypt` salted password hashing, cryptographically signed HS256 JWTs, Google OAuth OpenID Connect verification, and server-side ownership enforcement on all user-owned endpoints.
- **Data Flow Inspection**:
  - Found that previous prototype iterations had client-side calculations (`computePortfolioFromHoldings`) and fake price multipliers (`* 1.02`, `* 1.05`).
  - Found hardcoded ticker status text (`LIVE • Updated 12s ago`).
  - **Remediation**: Completely replaced client-side pricing and synthetic calculations with deterministic backend services. Updated the stock ticker bar to display real provider-backed timestamps (`As of HH:MM UTC • NSE Market Feed`).

---

## 2. Market Data Architecture & Truthful Pricing

- **Provider Interface (`BaseMarketDataProvider`)**:
  - `get_quote(symbol)`: Returns `NormalizedQuote` or `None` if unlisted/unavailable.
  - `get_quotes(symbols)`: Bulk quote retrieval.
  - `search_symbols(query)`: Instrument search across symbols and company names.
- **Provider Adapters**:
  - **`LiveMarketDataProvider`**: Real-world external HTTP market data adapter with 3.5s timeout and resilient error handling.
  - **`DevMarketDataProvider`**: Deterministic reference fixture provider covering prominent NSE equities across IT, Banking, Energy, FMCG, Auto, Telecom, Engineering, and Healthcare.
- **Truthful Pricing Guarantee**:
  - If a quote cannot be resolved from live feeds or the verified universe, the API returns HTTP 404 (`detail: "Market data quote unavailable for symbol 'XYZ'"`).
  - The system **never fabricates synthetic prices** for unknown instruments.
- **Caching & Staleness**:
  - `MarketDataService` implements an in-memory TTL cache (60 seconds).
  - If providers experience a temporary outage, cached quotes are returned with `is_stale: True` and explicit timestamp labeling.

---

## 3. Real Portfolio Management & Reconciliation

- **Database Models**:
  - `Portfolio` (`portfolios` table): Multi-portfolio support with `is_default` flag and currency.
  - `Holding` (`holdings` table): Real-time positions linked to portfolios.
  - `Transaction` (`transactions` table): Complete immutable audit trail of BUY, SELL, and DIVIDEND operations.
  - `Security` (`securities` table): Authoritative registry of instrument symbols, exchanges, and sectors.
- **Weighted Average Cost Accounting**:
  - BUY transactions update average cost basis:
    $$\text{Average Price} = \frac{(\text{Existing Qty} \times \text{Avg Price}) + (\text{New Qty} \times \text{New Price})}{\text{Existing Qty} + \text{New Qty}}$$
- **Overselling Prevention**:
  - SELL transactions validate holding existence and balance. Rejects with `400 Bad Request` if attempting to sell more shares than currently owned.
- **Atomic CSV Import**:
  - `CSVImportService` validates headers, validates each row's quantity and price, and executes the entire batch within an atomic database transaction. Any row failure triggers immediate rollback.

---

## 4. Deterministic Portfolio Intelligence

- **Calculations**:
  - Total Invested Amount: $\sum (\text{Qty} \times \text{Avg Price})$
  - Total Current Value: $\sum (\text{Qty} \times \text{Market Price})$
  - Unrealized Profit & Loss: $\text{Current Value} - \text{Invested Amount}$
  - Return Percentage: $(\text{P\&L} / \text{Invested}) \times 100$
  - Sector Exposure: Percentage allocation per sector, summing deterministically to 100%.
- **Zero-Division & Empty State Protection**:
  - Accounts with 0 holdings cleanly return 0.0 values without division-by-zero errors.
- **Portfolio Health Score**:
  - Deterministic 0-100 score calculated from position count diversification, concentration penalty (>20% in single stock), and sector concentration penalty (>25% in single sector).
