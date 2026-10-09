import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.database.models import InvestorProfile, FinancialProfile


class ProfileEngine:
    def calculate_risk_and_weights(self, profile_data: Dict[str, Any], financial_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates dynamic Risk Score (0-100) and Dynamic Agent Synthesis Weights based on:
        - Investment Experience
        - Investment Horizon
        - Drawdown Scenario Reaction (20% drop)
        - Financial Context (Emergency savings status, Monthly capacity, Obligations)
        """
        score = 50  # Base neutral score
        
        # 1. Experience Impact
        exp = profile_data.get("experience_level", "Learning Investor")
        if exp == "Beginner":
            score -= 12
        elif exp == "Learning Investor":
            score -= 4
        elif exp == "Active Investor":
            score += 8
        elif exp == "Advanced":
            score += 16
            
        # 2. Horizon Impact
        horizon = profile_data.get("investment_horizon", "3–5 Years")
        if horizon == "< 1 Year":
            score -= 16
        elif horizon == "1–3 Years":
            score -= 6
        elif horizon == "3–5 Years":
            score += 4
        elif horizon == "5–10 Years":
            score += 12
        elif horizon == "10+ Years":
            score += 20
            
        # 3. Loss Reaction Scenario
        reaction = profile_data.get("loss_reaction", "Wait and monitor")
        if reaction == "Sell immediately":
            score -= 22
        elif reaction == "Sell some investments":
            score -= 10
        elif reaction == "Invest more":
            score += 18
        elif reaction == "Hold":
            score += 4
            
        # 4. Financial Context Impact
        emergency = financial_data.get("emergency_savings", "Yes")
        if emergency == "No":
            score -= 10
        elif emergency == "Partially":
            score -= 4
            
        risk_score = max(10, min(95, score))
        
        if risk_score < 40:
            category = "Conservative"
            weights = {
                "risk_weight": 0.35,
                "fundamental_weight": 0.30,
                "technical_weight": 0.10,
                "market_weight": 0.10,
                "news_weight": 0.08,
                "regulatory_weight": 0.07
            }
        elif risk_score < 70:
            category = "Balanced Growth"
            weights = {
                "risk_weight": 0.25,
                "fundamental_weight": 0.25,
                "technical_weight": 0.20,
                "market_weight": 0.10,
                "news_weight": 0.10,
                "regulatory_weight": 0.10
            }
        else:
            category = "Aggressive"
            weights = {
                "risk_weight": 0.15,
                "fundamental_weight": 0.25,
                "technical_weight": 0.30,
                "market_weight": 0.12,
                "news_weight": 0.10,
                "regulatory_weight": 0.08
            }
            
        return {
            "risk_score": risk_score,
            "risk_category": category,
            "agent_weights": weights,
            "max_stock_exposure_pct": 15.0 if category == "Conservative" else (25.0 if category == "Balanced Growth" else 35.0)
        }

    def save_full_profile(self, db: Session, user_id: str, profile_data: Dict[str, Any], financial_data: Dict[str, Any]) -> Dict[str, Any]:
        calc = self.calculate_risk_and_weights(profile_data, financial_data)
        score = calc["risk_score"]
        category = calc["risk_category"]
        max_exp = calc["max_stock_exposure_pct"]
        
        # Upsert Investor Profile
        investor_prof = db.query(InvestorProfile).filter(InvestorProfile.user_id == user_id).first()
        if not investor_prof:
            investor_prof = InvestorProfile(user_id=user_id)
            db.add(investor_prof)

        investor_prof.country = profile_data.get("country", "India")
        investor_prof.currency = profile_data.get("currency", "INR")
        investor_prof.market_preference = profile_data.get("market_preference", "NSE")
        investor_prof.experience_level = profile_data.get("experience_level", "Learning Investor")
        investor_prof.past_assets = profile_data.get("past_assets", [])
        investor_prof.primary_goals = profile_data.get("primary_goals", ["Wealth Growth"])
        investor_prof.primary_goal_top = profile_data.get("primary_goal_top", "Wealth Growth")
        investor_prof.investment_horizon = profile_data.get("investment_horizon", "3–5 Years")
        investor_prof.loss_reaction = profile_data.get("loss_reaction", "Wait and monitor")
        investor_prof.volatility_comfort = profile_data.get("volatility_comfort", 50)
        investor_prof.risk_score = score
        investor_prof.risk_category = category
        investor_prof.max_stock_exposure_pct = max_exp
        investor_prof.avoided_sectors = profile_data.get("avoided_sectors", [])
        investor_prof.target_allocations = profile_data.get("target_allocations", {})
        investor_prof.liquidity_needs = profile_data.get("liquidity_needs")
        investor_prof.investment_preferences = profile_data.get("investment_preferences", {})
        investor_prof.profile_version = (investor_prof.profile_version or 1) + 1
        investor_prof.is_complete = True
        investor_prof.onboarding_completed = True

        # Upsert Financial Profile
        fin_prof = db.query(FinancialProfile).filter(FinancialProfile.user_id == user_id).first()
        if not fin_prof:
            fin_prof = FinancialProfile(user_id=user_id)
            db.add(fin_prof)

        fin_prof.planned_investment = financial_data.get("planned_investment", "₹25,000 – ₹1 Lakh")
        fin_prof.current_invested = financial_data.get("current_invested", "₹25,000")
        fin_prof.monthly_capacity = financial_data.get("monthly_capacity", "₹5,000 – ₹15,000")
        fin_prof.emergency_savings = financial_data.get("emergency_savings", "Yes")
        fin_prof.financial_obligations = financial_data.get("financial_obligations", [])

        db.commit()

        return {
            "user_id": user_id,
            "risk_score": score,
            "risk_category": category,
            "profile_version": investor_prof.profile_version,
            "is_complete": True,
            "onboarding_completed": True,
            "max_stock_exposure_pct": max_exp
        }

    def get_full_profile(self, db: Session, user_id: str) -> Dict[str, Any]:
        p_row = db.query(InvestorProfile).filter(InvestorProfile.user_id == user_id).first()
        f_row = db.query(FinancialProfile).filter(FinancialProfile.user_id == user_id).first()
        
        if not p_row:
            return {
                "user_id": user_id,
                "is_complete": False,
                "onboarding_completed": False,
                "profile_version": 1,
                "country": "India",
                "currency": "INR",
                "market_preference": "NSE",
                "experience_level": None,
                "past_assets": [],
                "primary_goals": [],
                "primary_goal_top": None,
                "investment_horizon": None,
                "loss_reaction": None,
                "volatility_comfort": None,
                "risk_score": None,
                "risk_category": None,
                "max_stock_exposure_pct": 20.0,
                "avoided_sectors": [],
                "target_allocations": {},
                "liquidity_needs": None,
                "investment_preferences": {},
                "financial": {
                    "planned_investment": None,
                    "current_invested": None,
                    "monthly_capacity": None,
                    "emergency_savings": None,
                    "financial_obligations": []
                }
            }
            
        return {
            "user_id": user_id,
            "is_complete": bool(getattr(p_row, "is_complete", p_row.onboarding_completed)),
            "onboarding_completed": bool(p_row.onboarding_completed),
            "profile_version": getattr(p_row, "profile_version", 1) or 1,
            "country": p_row.country,
            "currency": p_row.currency,
            "market_preference": p_row.market_preference,
            "experience_level": p_row.experience_level,
            "past_assets": p_row.past_assets or [],
            "primary_goals": p_row.primary_goals or [],
            "primary_goal_top": p_row.primary_goal_top,
            "investment_horizon": p_row.investment_horizon,
            "loss_reaction": p_row.loss_reaction,
            "volatility_comfort": p_row.volatility_comfort,
            "risk_score": p_row.risk_score,
            "risk_category": p_row.risk_category,
            "max_stock_exposure_pct": p_row.max_stock_exposure_pct,
            "avoided_sectors": p_row.avoided_sectors or [],
            "target_allocations": getattr(p_row, "target_allocations", {}) or {},
            "liquidity_needs": getattr(p_row, "liquidity_needs", None),
            "investment_preferences": getattr(p_row, "investment_preferences", {}) or {},
            "financial": {
                "planned_investment": f_row.planned_investment if f_row else None,
                "current_invested": f_row.current_invested if f_row else None,
                "monthly_capacity": f_row.monthly_capacity if f_row else None,
                "emergency_savings": f_row.emergency_savings if f_row else None,
                "financial_obligations": f_row.financial_obligations if f_row else []
            }
        }

    def update_user_profile(self, db: Session, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update investor preferences directly."""
        investor_prof = db.query(InvestorProfile).filter(InvestorProfile.user_id == user_id).first()
        if not investor_prof:
            investor_prof = InvestorProfile(user_id=user_id)
            db.add(investor_prof)

        for key, val in updates.items():
            if hasattr(investor_prof, key) and key not in ["user_id", "created_at"]:
                setattr(investor_prof, key, val)

        investor_prof.profile_version = (getattr(investor_prof, "profile_version", 1) or 1) + 1
        db.commit()
        return self.get_full_profile(db, user_id)


profile_engine = ProfileEngine()

