# ProsperHigh — Phase 3: Production AI Engine Audit

## 1. Audit of Existing AI Architecture & Prior Foundations

Before formalizing Phase 3, the underlying architecture and prior Phase 1 and Phase 2 implementations were thoroughly audited:
- **Phase 1 Verification**: Confirmed PostgreSQL persistence, versioned Alembic migrations (`001` through `005`), Bcrypt salted password hashing, JWT security, Google Sign-In verification, and strict user ownership isolation.
- **Phase 2 Verification**: Confirmed market data services (`market_data_service`), real database portfolio holdings, weighted average cost basis transaction accounting, dynamic security search, and honest quote availability states (no fabricated prices).
- **AI Architecture Audit**:
  - Confirmed the 7 specialized domain agents operate with distinct responsibilities and inputs.
  - Identified that the final verdict scoring was previously embedded directly inside `SynthesisAgent`.
  - **Remediation**: Extracted a dedicated, versioned `DecisionEngine` (`v3.1.0`) with explicit weighting per domain, conflict penalties, and step-by-step mathematical traceability independent of any LLM prompt.

---

## 2. The Seven Specialized Intelligence Agents

| Agent | Responsibility | Data Source | Missing Data Behavior |
| :--- | :--- | :--- | :--- |
| **Market Agent** | Broad market regime, Nifty 50 trend, benchmark comparisons, price momentum. | Phase 2 `market_data_service` & macro quotes | Returns `INSUFFICIENT_DATA` for unlisted stocks; flags cached data. Never invents index prices. |
| **Technical Agent** | Programmatic indicator calculation: SMA 20/50/200, 14-day RSI, MACD, and timeframe conflicts. | Historical OHLCV price series | Distinguishes deterministic math from AI prose. Returns `INSUFFICIENT_DATA` if price bars < minimum required. |
| **Fundamental Agent** | Financial health, revenue CAGR, operating margin, debt-to-equity, cash flow divergence. | Audited company filings & income statements | Sourced from verified records. Returns `INSUFFICIENT_DATA` if fundamentals are absent. |
| **News Agent** | Analyzes recent financial headlines, FinBERT sentiment scoring, and market news impact. | Verified financial news corpus | Preserves publisher, source, and date. Returns `INSUFFICIENT_DATA` if 0 articles exist. Never hallucinates URLs. |
| **Regulatory Agent** | Statutory risk disclosures, SEBI regulatory notices, capital allocation announcements. | Exchange filings & regulatory notices | Cites exact document names, sections, and page references. Discloses coverage boundaries truthfully. |
| **Risk Agent** | Single-stock portfolio concentration %, sector concentration %, multiple compression risk. | User database portfolio ledger & stock multiples | Deterministic penalties: sector concentration > 25% or position > 15%. |
| **Synthesis Agent** | Aggregates all 6 agent outputs, detects signal friction/conflicts, and formulates structured thesis. | Validated outputs of the 6 domain specialists | Preserves disagreements; articulates Evidence, Interpretation, Conclusion, and Uncertainty. |

---

## 3. Dedicated Deterministic Decision Engine (`v3.1.0`)

Separated from LLM text generation, `DecisionEngine` (`backend/services/decision_engine.py`) provides transparent, reproducible assessments:
- **Domain Weights**:
  - Fundamental: 1.5
  - Risk: 1.4
  - Technical: 1.2
  - Regulatory: 1.1
  - Market: 1.0
  - News: 0.8
- **Conflict Friction Deduction**:
  - High Conflict: -4 net score deduction, -15% confidence penalty.
  - Moderate Conflict: -2 net score deduction, -8% confidence penalty.
- **Thresholds**:
  - Net Score $\ge 12$: **BUY**
  - Net Score $\ge -4$: **HOLD**
  - Net Score $< -4$: **AVOID**
- **Traceability**: Produces a complete breakdown of raw impact scores, applied weights, conflict deductions, and confidence derivations persisted in `analyses.full_json`.

---

## 4. Model Provider Abstraction & Cost Safeguards

- **`BaseAIProvider`**: Clean interface defining `generate()` and `agenerate()` with structured validation.
- **`DeterministicAIProvider`**: Zero-cost, 100% reproducible provider for test suites and offline operation.
- **`OpenAICompatibleProvider` & `GeminiProvider`**: External provider adapters with bounded 15s timeouts and exponential backoff retries.
- **Concurrency & Cost Controls**:
  - `AI_MAX_CONCURRENT_ANALYSES = 8` semaphore limit.
  - Maximum 2 retries with exponential backoff on transient errors; validation errors never retried.
  - Automatic fallback to deterministic provider on external API failures.
