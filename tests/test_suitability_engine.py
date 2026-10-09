import pytest
from backend.services.suitability_engine import suitability_engine


def test_suitability_incomplete_profile_reports_limited_assessment():
    """Verify that incomplete or missing profile reports LIMITED_ASSESSMENT without inventing defaults."""
    # 1. None profile
    res_none = suitability_engine.evaluate_suitability(
        symbol="TCS",
        asset_profile={"sector": "Technology", "volatility": 22.0, "beta": 0.85},
        investor_profile=None
    )
    assert res_none["classification"] == "LIMITED_ASSESSMENT"
    assert res_none["is_limited"] is True
    assert len(res_none["missing_information"]) > 0
    assert "Risk tolerance" in str(res_none["missing_information"])

    # 2. Incomplete profile (missing risk category / horizon)
    partial_prof = {
        "is_complete": False,
        "country": "India",
        "currency": "INR",
        "experience_level": None,
        "investment_horizon": None,
        "risk_category": None
    }
    res_part = suitability_engine.evaluate_suitability(
        symbol="TCS",
        asset_profile={"sector": "Technology", "volatility": 22.0, "beta": 0.85},
        investor_profile=partial_prof
    )
    assert res_part["classification"] == "LIMITED_ASSESSMENT"
    assert res_part["is_limited"] is True
    assert "Risk tolerance category" in res_part["missing_information"]
    assert "Investment horizon" in res_part["missing_information"]


def test_suitability_hard_constraint_avoided_sector():
    """Verify that an asset belonging to an avoided sector deterministically returns UNSUITABLE."""
    prof = {
        "is_complete": True,
        "risk_category": "Balanced Growth",
        "investment_horizon": "3–5 Years",
        "avoided_sectors": ["Tobacco", "Defense", "Automobile"],
        "max_stock_exposure_pct": 25.0
    }
    res = suitability_engine.evaluate_suitability(
        symbol="TATAMOTORS",
        asset_profile={"sector": "Automobile", "volatility": 24.0, "beta": 1.1},
        investor_profile=prof
    )
    assert res["classification"] == "UNSUITABLE"
    assert any("avoided sectors filter" in factor for factor in res["opposing_factors"])
    assert any("Sector constraint violated" in pc for pc in res["portfolio_considerations"])


def test_suitability_conservative_profile_volatility_mismatch():
    """Verify conservative investor evaluating high-volatility speculative asset receives opposing friction."""
    prof = {
        "is_complete": True,
        "risk_category": "Conservative",
        "investment_horizon": "3–5 Years",
        "avoided_sectors": [],
        "max_stock_exposure_pct": 15.0
    }
    res = suitability_engine.evaluate_suitability(
        symbol="HIGHBETA",
        asset_profile={"sector": "Technology", "volatility": 38.0, "beta": 1.6},
        investor_profile=prof
    )
    assert res["classification"] in ["BORDERLINE", "UNSUITABLE"]
    assert any("exceeds Conservative risk threshold" in f for f in res["opposing_factors"])


def test_suitability_exposure_cap_breach():
    """Verify that proposed addition breaching single-stock exposure cap generates warning."""
    prof = {
        "is_complete": True,
        "risk_category": "Balanced Growth",
        "investment_horizon": "3–5 Years",
        "avoided_sectors": [],
        "max_stock_exposure_pct": 20.0
    }
    portfolio = {
        "total_value": 100000.0,
        "holdings": [{"symbol": "INFY", "current_value": 15000.0}],
        "sector_exposure": {"Technology": 15.0}
    }
    # Propose adding 15,000 to INFY (total 30,000 / 115,000 = 26.0% > 20% cap)
    res = suitability_engine.evaluate_suitability(
        symbol="INFY",
        asset_profile={"sector": "Technology", "volatility": 20.0, "beta": 0.9},
        investor_profile=prof,
        portfolio_summary=portfolio,
        proposed_investment_amount=15000.0
    )
    assert any("exceeds your declared single-stock exposure cap" in f for f in res["opposing_factors"])


def test_suitability_clean_alignment():
    """Verify an asset aligned with goals, horizon, and constraints receives SUITABLE classification."""
    prof = {
        "is_complete": True,
        "risk_category": "Balanced Growth",
        "investment_horizon": "5–10 Years",
        "avoided_sectors": ["Tobacco"],
        "max_stock_exposure_pct": 25.0
    }
    portfolio = {
        "total_value": 200000.0,
        "holdings": [],
        "sector_exposure": {}
    }
    res = suitability_engine.evaluate_suitability(
        symbol="HDFCBANK",
        asset_profile={"sector": "Banking", "volatility": 18.0, "beta": 0.95},
        investor_profile=prof,
        portfolio_summary=portfolio,
        proposed_investment_amount=10000.0
    )
    assert res["classification"] == "SUITABLE"
    assert len(res["opposing_factors"]) == 0
    assert len(res["supporting_factors"]) >= 2
    assert res["methodology_version"] == "v4.0.0"
