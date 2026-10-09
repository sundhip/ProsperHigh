import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.main import app
from backend.database.models import User, InvestorProfile, Holding, Portfolio
from backend.services.portfolio_service import portfolio_service


def test_api_personalized_analyze_and_sub_resources(client: TestClient, auth_headers_user_a, test_user_a: User, db_session: Session):
    # Set complete profile
    prof = db_session.query(InvestorProfile).filter(InvestorProfile.user_id == test_user_a.id).first()
    if not prof:
        prof = InvestorProfile(user_id=test_user_a.id)
        db_session.add(prof)
    prof.is_complete = True
    prof.risk_category = "Balanced Growth"
    prof.investment_horizon = "3–5 Years"
    prof.max_stock_exposure_pct = 25.0
    db_session.commit()

    # 1. Run personalized analyze
    res = client.post("/api/analyze", json={"symbol": "TATAMOTORS", "personalized": True}, headers=auth_headers_user_a)
    assert res.status_code == 200
    data = res.json()
    assert data["symbol"] == "TATAMOTORS"
    assert data["is_personalized"] is True
    assert data["suitability_assessment"] is not None
    assert data["ai_debate"] is not None
    assert data["investment_thesis"] is not None
    assert len(data["counterfactual_scenarios"]) >= 3

    analysis_id = data["analysis_id"]

    # 2. Get debate sub-resource
    deb_res = client.get(f"/api/analyze/{analysis_id}/debate", headers=auth_headers_user_a)
    assert deb_res.status_code == 200
    assert "threads" in deb_res.json()

    # 3. Get thesis sub-resource
    ths_res = client.get(f"/api/analyze/{analysis_id}/thesis", headers=auth_headers_user_a)
    assert ths_res.status_code == 200
    assert "invalidation_conditions" in ths_res.json()

    # 4. Run counterfactual
    cf_res = client.post("/api/analyze/counterfactual", json={"analysis_id": analysis_id}, headers=auth_headers_user_a)
    assert cf_res.status_code == 200
    assert len(cf_res.json()) >= 3


def test_api_portfolio_composition_what_if_and_stress(client: TestClient, auth_headers_user_a, test_user_a: User, db_session: Session):
    port = portfolio_service.get_or_create_default_portfolio(db_session, test_user_a.id)
    h = Holding(portfolio_id=port.id, user_id=test_user_a.id, symbol="INFY", quantity=20, average_price=1500.0, sector="Technology")
    db_session.add(h)
    db_session.commit()

    # 1. Composition
    comp_res = client.get("/api/portfolio/composition", headers=auth_headers_user_a)
    assert comp_res.status_code == 200
    assert comp_res.json()["holdings_count"] == 1
    assert comp_res.json()["hhi_index"] > 0

    # 2. Pre-trade impact
    pre_res = client.post("/api/portfolio/pre-trade-impact", json={
        "symbol": "TCS",
        "quantity": 10,
        "price": 3000.0,
        "transaction_type": "BUY"
    }, headers=auth_headers_user_a)
    assert pre_res.status_code == 200
    assert pre_res.json()["projected"]["total_portfolio_value"] > pre_res.json()["baseline"]["total_portfolio_value"]

    # 3. What-if simulation
    wif_res = client.post("/api/portfolio/what-if", json={
        "actions": [{"action": "ADD", "symbol": "TCS", "quantity": 10, "price": 3000.0}]
    }, headers=auth_headers_user_a)
    assert wif_res.status_code == 200
    assert wif_res.json()["simulated"]["holdings_count"] == 2

    # 4. Stress test
    st_res = client.post("/api/portfolio/stress-test", json={"scenario_key": "MARKET_CORRECTION_10"}, headers=auth_headers_user_a)
    assert st_res.status_code == 200
    assert st_res.json()["summary"]["estimated_pnl"] < 0


def test_api_goals_crud(client: TestClient, auth_headers_user_a):
    # Create goal
    create_res = client.post("/api/goals", json={
        "name": "Retirement Target",
        "target_amount": 500000.0,
        "monthly_contribution": 10000.0
    }, headers=auth_headers_user_a)
    assert create_res.status_code == 200
    goal_id = create_res.json()["id"]

    # List goals
    list_res = client.get("/api/goals", headers=auth_headers_user_a)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # Update goal
    up_res = client.put(f"/api/goals/{goal_id}", json={"monthly_contribution": 12000.0}, headers=auth_headers_user_a)
    assert up_res.status_code == 200
    assert up_res.json()["monthly_contribution"] == 12000.0

    # Delete goal
    del_res = client.delete(f"/api/goals/{goal_id}", headers=auth_headers_user_a)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
