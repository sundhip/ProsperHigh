import pytest
from backend.services.rag.service import rag_service


def test_complete_product_integration_lifecycle(client, db_session):
    # Step 0: Ensure filings are indexed
    rag_service.ingest_default_documents(db_session)

    # 1. User Registration
    reg_resp = client.post(
        "/api/auth/register",
        json={
            "name": "Integration Tester",
            "email": "integrator@example.com",
            "password": "Password123!",
        },
    )
    assert reg_resp.status_code == 201
    auth_data = reg_resp.json()
    token = auth_data.get("token") or auth_data.get("access_token")
    user_id = auth_data["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Complete Onboarding Profile
    onboard_resp = client.post(
        "/api/profile/onboarding",
        json={
            "country": "India",
            "currency": "INR",
            "market_preference": "NSE",
            "experience_level": "Active Investor",
            "past_assets": ["Mutual Funds", "Direct Equity"],
            "primary_goals": ["Wealth Growth"],
            "primary_goal_top": "Wealth Growth",
            "investment_horizon": "3–5 Years",
            "loss_reaction": "Buy more at discount",
            "volatility_comfort": 65,
            "explanation_style": "Standard",
            "planned_investment": "₹1 Lakh – ₹5 Lakh",
            "current_invested": "₹50,000",
            "monthly_capacity": "₹15,000",
            "emergency_savings": "Yes",
            "financial_obligations": ["None"],
        },
        headers=headers,
    )
    assert onboard_resp.status_code == 200

    # Verify Profile Fetched
    prof_resp = client.get("/api/profile/me", headers=headers)
    assert prof_resp.status_code == 200
    prof_data = prof_resp.json()
    assert prof_data["onboarding_completed"] is True
    assert prof_data["risk_score"] > 0

    # 3. Fetch Portfolio & Add Holdings
    port_resp = client.get("/api/portfolio/me", headers=headers)
    assert port_resp.status_code == 200
    port_data = port_resp.json()
    portfolio_id = port_data.get("portfolio_id")

    add_holding_resp = client.post(
        "/api/portfolio/holding",
        json={
            "symbol": "RELIANCE",
            "quantity": 10.0,
            "average_price": 2800.0,
            "portfolio_id": portfolio_id,
        },
        headers=headers,
    )
    assert add_holding_resp.status_code == 200

    # Verify Portfolio Updated with Market Valuation
    port_updated = client.get("/api/portfolio/me", headers=headers).json()
    assert port_updated["holdings_count"] == 1
    assert port_updated["total_portfolio_value"] > 0

    # 4. Run Multi-Agent Stock Analysis (Phase 3 AI Engine)
    analysis_resp = client.post(
        "/api/analyze",
        json={"symbol": "RELIANCE"},
        headers=headers,
    )
    assert analysis_resp.status_code == 200
    analysis_data = analysis_resp.json()
    assert analysis_data["symbol"] == "RELIANCE"
    assert len(analysis_data["agents"]) == 6
    assert "final_decision" in analysis_data
    assert "confidence" in analysis_data
    assert "conflicts" in analysis_data

    # Verify Analysis History Audit Trail
    hist_resp = client.get("/api/analyze/history", headers=headers)
    assert hist_resp.status_code == 200
    hist_list = hist_resp.json()
    assert len(hist_list) >= 1
    assert hist_list[0]["symbol"] == "RELIANCE"

    # 5. Query Filing Research Terminal (Phase 5 RAG Engine)
    res_resp = client.post(
        "/api/research/ask",
        json={
            "symbol": "RELIANCE",
            "query": "capex commitments for phase 2 gigafactories and telecom tariffs",
        },
        headers=headers,
    )
    assert res_resp.status_code == 200
    res_data = res_resp.json()
    assert res_data["insufficient_evidence"] is False
    assert len(res_data["citations"]) > 0

    # Verify Research Query History Saved for this User
    res_hist = client.get("/api/research/history", headers=headers)
    assert res_hist.status_code == 200
    res_hist_list = res_hist.json()
    assert len(res_hist_list) == 1
    assert res_hist_list[0]["symbol"] == "RELIANCE"

    # 6. Update Settings Preferences
    update_resp = client.put(
        "/api/profile/me",
        json={
            "max_stock_exposure_pct": 25.0,
            "investment_horizon": "Long-Term",
        },
        headers=headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["max_stock_exposure_pct"] == 25.0
