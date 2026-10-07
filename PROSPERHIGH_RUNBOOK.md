# ProsperHigh — Production Operations Runbook

This runbook provides actionable procedures for operators, SREs, and engineers managing ProsperHigh in production.

---

## 1. Application Startup & Deployment

### 1.1 Local / Direct Deployment
```bash
# 1. Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# 2. Run database migrations
python -m alembic upgrade head

# 3. Start FastAPI backend (2 workers, port 8000)
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 2

# 4. Start Next.js frontend (production server)
cd frontend
npm start
```

### 1.2 Docker Compose Deployment
```bash
# Build and start all services (PostgreSQL, Backend, Frontend)
docker compose up -d --build

# Inspect running containers
docker compose ps
```

---

## 2. Health Probes & Diagnostics

| Check | URL | Expected Response | Description |
|---|---|---|---|
| Liveness | `GET /health/live` | `{"status": "online"}` (HTTP 200) | Process running |
| Readiness | `GET /health/ready` | `{"status": "ready", "database": "connected"}` (HTTP 200) | Database connected |

```bash
# Quick health verification
curl -f http://localhost:8000/health/live
curl -f http://localhost:8000/health/ready
```

---

## 3. Database Migrations

### 3.1 Applying Migrations
```bash
# Apply all pending migrations to head
python -m alembic upgrade head
```

### 3.2 Rolling Back a Migration
```bash
# Step backward by 1 migration
python -m alembic downgrade -1

# Rollback to specific revision
python -m alembic downgrade <revision_id>
```

---

## 4. Backup & Disaster Recovery

### 4.1 Creating an On-Demand Backup
```bash
python scripts/backup_db.py backups/
```
Output:
- `backups/prosperhigh_backup_<timestamp>.db` (or `.dump` for PostgreSQL)
- `backups/prosperhigh_backup_<timestamp>.db.sha256`

### 4.2 Restoring from Backup
```bash
python scripts/restore_db.py backups/prosperhigh_backup_<timestamp>.db
```
The script automatically verifies SHA-256 integrity and validates database tables before completing.

---

## 5. Log Inspection & Request Correlation

All log lines contain the `[req:<request_id>]` tag for end-to-end tracing:
```
2026-10-07 21:38:00,102 [INFO] [req:req_a1b2c3d4e5f6] prosperhigh: POST /api/analyze completed with 200 in 242.1ms
```

To trace a specific user incident:
```bash
# Search logs for a specific request ID
grep "req_a1b2c3d4e5f6" /var/log/prosperhigh.log
```

---

## 6. Incident Response & Failure Playbooks

### 6.1 AI Provider Failure / Quota Exhaustion
- **Symptom**: 500 errors or elevated timeout logs on `/api/analyze`.
- **Mitigation**:
  1. The AI engine automatically falls back to secondary/deterministic providers.
  2. To switch fallback provider globally without downtime, update `.env`:
     ```env
     FALLBACK_LLM_PROVIDER=deterministic
     ```
  3. Restart backend workers:
     ```bash
     docker compose restart backend
     ```

### 6.2 Market Data Provider Failure
- **Symptom**: Stale quote indicators in holdings.
- **Mitigation**:
  1. MarketDataService retains cached quotes (60s TTL) and marks `is_stale=True`.
  2. The frontend displays the stale indicator without crashing.
  3. Inspect provider connectivity in logs: `grep "MarketDataProvider"`.

### 6.3 Rate Limiting / 429 Elevated Responses
- **Symptom**: Users receiving `HTTP 429 Too Many Requests`.
- **Mitigation**:
  1. Verify if requests are legitimate or an abuse attempt.
  2. Adjust limits in `.env`:
     ```env
     RATE_LIMIT_AI_PER_MINUTE=50
     RATE_LIMIT_AUTH_PER_MINUTE=30
     ```
  3. Reload backend service.

### 6.4 Secret Rotation
1. Generate new JWT secret:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```
2. Update `JWT_SECRET_KEY` in environment.
3. Restart backend workers. Users will be prompted to re-authenticate cleanly.
