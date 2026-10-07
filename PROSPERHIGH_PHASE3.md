# ProsperHigh — Phase 3: Production AI Engine Architecture

## Executive Summary
Phase 3 establishes ProsperHigh's production AI analysis engine. The architecture features seven specialized domain agents (Market, Technical, News, Fundamental, Regulatory, Risk, and Synthesis) operating over real Phase 2 market, fundamental, regulatory, and portfolio ledger data. External model providers are fully abstracted behind a provider service with timeouts, bounded exponential-backoff retries, and offline deterministic fallback. Every agent communicates via strictly validated Pydantic contracts with full evidence traceability. Independent agents execute concurrently, partial data gaps are honestly reported without hallucination, and all analysis runs are persisted to the database for auditability.

---

## 1. AI Architecture Overview

The multi-agent intelligence pipeline follows a clean, layered structure:

```
Frontend (Next.js 14)
       ↓  POST /api/analyze (Bearer Token)
Analysis API Router
       ↓
AI Orchestrator (Concurrent Async Execution)
       ├── Market Agent (Phase 2 Live/Cached Quotes & Macro)
       ├── Technical Agent (Deterministic SMA/RSI/MACD calculations)
       ├── News Agent (Verified FinBERT news articles)
       ├── Fundamental Agent (Audited Income/Balance Sheet & Cash Flows)
       ├── Regulatory Agent (Statutory filings & Annual Report citations)
       └── Risk Agent (Real portfolio ledger concentration & exposure)
       ↓
Synthesis Agent (Reasoning, Conflict Detection & Thesis Synthesis)
       ↓
Pydantic Schema Validation (AgentOutput & SynthesisOutput)
       ↓
Database Audit Persistence (analyses & agent_runs tables)
       ↓
Validated Analysis API Response
```

---

## 2. AI Provider Abstraction (`backend/services/ai_provider/`)

All LLM and model interactions are isolated behind the `BaseAIProvider` abstraction. No component outside this package interacts directly with external model APIs.

### Architecture
- **`BaseAIProvider`** (`base.py`): Abstract interface defining `generate(request)` and `agenerate(request)` along with `ModelRequest`, `ModelResponse`, `ModelUsage`, and an exception hierarchy (`AIProviderTimeoutError`, `AIProviderRateLimitError`, `AIProviderValidationError`).
- **`DeterministicAIProvider`** (`deterministic_provider.py`): High-fidelity deterministic provider for test suites, zero-key development, and emergency fallback. Produces valid structured JSON derived strictly from input facts without hallucinations.
- **`OpenAICompatibleProvider`** (`openai_compatible_provider.py`): Universal client supporting OpenRouter, Groq, local Ollama (`qwen2.5`), and OpenAI endpoints with JSON mode and configurable timeouts.
- **`GeminiProvider`** (`gemini_provider.py`): Direct integration with Google Gemini (`gemini-1.5-flash`) using structured JSON output schema.
- **`AIProviderService`** (`service.py`): Centralized factory and manager.
  - Manages call timeouts (default 15.0 seconds).
  - Enforces bounded retries (maximum 2 retries with exponential backoff for transient timeouts and rate limits).
  - Validation errors are not retried to prevent retry storms.
  - Automatically falls back to deterministic provider if external APIs fail or are unconfigured.

---

## 3. Structured Agent Contracts (`backend/schemas/agent_contracts.py`)

No arbitrary unstructured strings flow between agents. Every specialist returns a strictly validated `AgentOutput`:

- **`AgentStatus`**: `SUCCESS`, `PARTIAL`, `FAILED`, `INSUFFICIENT_DATA`.
- **`SignalType`**: `BUY`, `HOLD`, `AVOID`, `NEUTRAL`.
- **`EvidenceItem`**:
  - `claim`: Factual statement
  - `source`: Specific data source (e.g., "NSE Live Market Feed", "Annual Report FY26 (p. 42)")
  - `metric_value`: Exact numeric or qualitative value
  - `timestamp`: Date/time of evidence
  - `reference`: Citation or index key
- **`AgentFinding`**: `title`, `description`, `sentiment` (`POSITIVE`, `NEGATIVE`, `NEUTRAL`), `impact_score`.
- **`ConflictReport`**: `conflict_level` (`LOW`, `MODERATE`, `HIGH`), `badge`, `summary`, `disagreements`, `signals_breakdown`.
- **`SynthesisOutput`**: Structured synthesis distinguishing **Evidence**, **Interpretation**, **Conclusion**, and **Uncertainty**.

---

## 4. Specialized Agents

| Agent | Responsibility | Data Source | Missing Data Behavior |
|---|---|---|---|
| **Market Agent** | Price action, day change, Nifty 50 trend, market breadth, sector rotation. | Phase 2 `market_data_service` & macro feed | Returns `INSUFFICIENT_DATA` for unlisted stocks; flags cached quotes. Never hallucinates prices. |
| **Technical Agent** | Programmatic calculation of SMA50, SMA200, 14-day RSI, MACD histogram, and timeframe conflict. | Price history & indicator calculator | Distinguishes deterministic math from AI interpretation. Returns `INSUFFICIENT_DATA` if bars < minimum threshold. |
| **News Agent** | Analyzes verified articles, FinBERT scores, and sentiment trends. | Verified financial news corpus | Cites real sources and dates. Returns `INSUFFICIENT_DATA` if 0 articles exist. Never creates fake URLs. |
| **Fundamental Agent** | Top-line/bottom-line growth, ROE, debt-to-equity, cash flow to net profit conversion. | Audited annual reports & financial statements | Flags cash flow divergence anomalies. All figures are sourced from actual records. |
| **Regulatory Agent** | Statutory risk factors, SEBI inquiries, capital allocation disclosures. | Annual filings & presentation disclosures | Cites exact document names, sections, and page numbers. Reports `INSUFFICIENT_DATA` if unfiled. |
| **Risk Agent** | Portfolio sector exposure %, single-stock concentration weight, multiple compression risk. | User database portfolio ledger & stock multiples | Uses documented mathematical formulas: penalty applied if sector > 25% or stock > 15%. |
| **Synthesis Agent** | Aggregates all 6 outputs, detects signal friction/conflicts, and formulates balanced thesis. | Validated outputs of the 6 domain agents | Preserves disagreements instead of forcing alignment. Clearly articulates Evidence, Interpretation, Conclusion, and Uncertainty. |

---

## 5. Orchestration, Concurrency & Failure Isolation

### Concurrent Execution (`backend/orchestrator/orchestrator.py`)
- Independent agents (Market, Technical, News, Fundamental, Regulatory, Risk) run concurrently in parallel threads using `asyncio.gather`.
- Controlled concurrency bounds thread pool resource utilization.

### Failure Isolation & Partial Tolerance
- Individual agent exceptions are caught cleanly and wrapped into `AgentOutput(status=AgentStatus.FAILED, error=...)`.
- If an individual non-critical agent reports `INSUFFICIENT_DATA` or encounters an error, the pipeline does **not** abort. The overall analysis status is set to `PARTIAL`, warnings are recorded, and the remaining valid agents proceed to the Synthesis layer.

---

## 6. Database Persistence & Migrations

### Schema Enhancements
- **`analyses` table (`AnalysisRun`)**:
  - Primary Key: `id` (`ANL-...`)
  - Fields: `user_id`, `symbol`, `status`, `final_decision`, `confidence`, `net_score`, `summary`, `conflict_level`, `model_provider`, `execution_time_ms`, `full_json`, `created_at`.
- **`agent_runs` table (`AgentRun`)**:
  - Primary Key: `id` (`AGR-...`)
  - Foreign Key: `analysis_id` -> `analyses.id` (CASCADE delete)
  - Fields: `agent_name`, `status`, `signal`, `confidence`, `impact_score`, `summary`, `findings_json`, `evidence_json`, `warnings_json`, `model_used`, `execution_time_ms`, `created_at`.
- **Migration**: `003_ai_analysis_engine` created and applied via Alembic with named foreign keys and server defaults.

---

## 7. API Endpoints

- `POST /api/analyze`: Authenticated endpoint running the concurrent orchestrator, recording audit runs in the database, and returning `AnalysisResponse`.
- `GET /api/analyze/history`: Authenticated endpoint returning user's historical AI analyses.
- `GET /api/analyze/{analysis_id}`: Authenticated endpoint retrieving full analysis by ID, strictly enforcing server-side ownership authorization (`403 Forbidden` on cross-user access).

---

## 8. Frontend Integration (`frontend/`)

- **`frontend/lib/api.ts`**: Connected `analyzeStock()`, `getAnalysisHistory()`, and `getAnalysisById()`.
- **`frontend/app/analyze/page.tsx`**:
  - Removed artificial delays and synthetic mock synthesis.
  - Added honest error card if backend execution halts.
  - Rendered synthesis warnings and model uncertainty profile.
- **`frontend/components/AgentBoard.tsx`**:
  - Truthfully renders `NO DATA` (grey) for `INSUFFICIENT_DATA` and `FAILED` (red) for `FAILED` status, preventing false positive representations.

---

## 9. Verification & Automated Test Results

### Automated Tests (`pytest tests/ -v`)
- **62 passing tests** (0 failed, 100% pass rate in 13.97s).
  - `tests/test_ai_provider.py`: Deterministic provider generation, async execution, bounded retries, and fallback.
  - `tests/test_ai_agents.py`: All 6 domain agents tested independently with valid data and missing data states.
  - `tests/test_ai_orchestrator.py`: Concurrent execution, partial failure tolerance, and sync bridge.
  - `tests/test_ai_synthesis.py`: Conflict detection, signal friction, and evidence traceability.
  - `tests/test_ai_persistence_security.py`: Database audit trail persistence, history listing, and 403 cross-user access isolation.
  - `tests/test_portfolio_domain.py`, `tests/test_market_data.py`, `tests/test_calculations.py`, `tests/test_csv_import.py`, `tests/test_auth.py`, `tests/test_database.py`, `tests/test_protected_routes.py`: Zero regressions from Phases 1 & 2.

### Production Build
- `npm run build` in `frontend/`: Compiled successfully with zero TypeScript or linting errors across all 12 routes.

---

## 10. Explicitly Deferred to Phase 4
As mandated by the project requirements, the following personalization and decision engine features were **not** implemented in Phase 3:
- Investor-specific agent weighting based on risk preferences.
- Suitability decision matrix conditioned on user investor profile.
- Dynamic thesis invalidation triggers.
- Counterfactual engine and portfolio stock switcher recommendations.
- These will be implemented in Phase 4 on top of this verified AI intelligence engine.
