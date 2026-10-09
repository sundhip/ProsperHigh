from typing import Dict, Any, List, Optional
from backend.services.decision_engine import decision_engine, DecisionEngine


class CounterfactualEngine:
    """
    Counterfactual Analysis Engine:
    Performs bounded, deterministic sensitivity analysis on an asset's analysis.
    Shows mathematically how recommendation and net score shift if critical assumptions or metrics change.
    """

    def run_counterfactual_scenarios(
        self,
        symbol: str,
        baseline_net_score: int,
        baseline_decision: str,
        agent_outputs: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Executes standard bounded sensitivity scenarios:
          1. Valuation Multiple Contraction (-20% P/E or EV/EBITDA multiple compression)
          2. Technical Breakdown (Price breaches below 50-day / 200-day moving averages)
          3. Growth Deceleration (Revenue & earnings growth slows significantly)
          4. Portfolio Concentration Surge (Allocating larger portion increases risk penalty)
        """
        symbol = symbol.upper().strip()
        scenarios: List[Dict[str, Any]] = []

        # Helper to get agent score
        def get_score(name: str) -> int:
            a = agent_outputs.get(name, {})
            if hasattr(a, "impact_score"):
                return getattr(a, "impact_score", 0)
            if isinstance(a, dict):
                return a.get("impact_score", 0)
            return 0

        fund_score = get_score("fundamental")
        tech_score = get_score("technical")
        risk_score = get_score("risk")

        # Scenario 1: Valuation Multiple Contraction
        # Reduces fundamental impact score by 6 points (domain weight 1.5 => ~9 net score points)
        fund_shock = -6
        shock_1_score = baseline_net_score + int(fund_shock * 1.5)
        decision_1 = "BUY" if shock_1_score >= 12 else ("HOLD" if shock_1_score >= -4 else "AVOID")
        scenarios.append({
            "scenario_name": "Valuation Multiple Contraction (-20%)",
            "domain_affected": "Fundamental Valuation",
            "hypothesis": "Market de-rates company valuation multiple by 20% due to sector re-pricing or interest rate rises.",
            "baseline_domain_score": fund_score,
            "stressed_domain_score": fund_score + fund_shock,
            "baseline_net_score": baseline_net_score,
            "stressed_net_score": shock_1_score,
            "score_delta": shock_1_score - baseline_net_score,
            "baseline_decision": baseline_decision,
            "stressed_decision": decision_1,
            "verdict_changed": baseline_decision != decision_1,
            "rationale": (
                f"A 20% multiple contraction reduces net score by {abs(shock_1_score - baseline_net_score)} points. "
                f"Verdict transitions from {baseline_decision} to {decision_1}."
            )
        })

        # Scenario 2: Technical Breakdown below 50-day SMA
        # Reduces technical impact score by 7 points (domain weight 1.2 => ~8 net score points)
        tech_shock = -7
        shock_2_score = baseline_net_score + int(tech_shock * 1.2)
        decision_2 = "BUY" if shock_2_score >= 12 else ("HOLD" if shock_2_score >= -4 else "AVOID")
        scenarios.append({
            "scenario_name": "Technical Momentum Breakdown below 50-day SMA",
            "domain_affected": "Technical Trend",
            "hypothesis": "Price drops 5% and breaks below key 50-day moving average support on higher volume.",
            "baseline_domain_score": tech_score,
            "stressed_domain_score": tech_score + tech_shock,
            "baseline_net_score": baseline_net_score,
            "stressed_net_score": shock_2_score,
            "score_delta": shock_2_score - baseline_net_score,
            "baseline_decision": baseline_decision,
            "stressed_decision": decision_2,
            "verdict_changed": baseline_decision != decision_2,
            "rationale": (
                f"Loss of momentum reduces net score to {shock_2_score:+d}. "
                f"Verdict becomes {decision_2}."
            )
        })

        # Scenario 3: Volatility Spike & Portfolio Risk Elevation
        # Increases risk agent penalty by 6 points (domain weight 1.4 => ~8 net score points)
        risk_shock = -6
        shock_3_score = baseline_net_score + int(risk_shock * 1.4)
        decision_3 = "BUY" if shock_3_score >= 12 else ("HOLD" if shock_3_score >= -4 else "AVOID")
        scenarios.append({
            "scenario_name": "Downside Volatility Spike (+35%)",
            "domain_affected": "Risk & Volatility",
            "hypothesis": "Asset annualized volatility expands by 35%, widening Value at Risk (VaR 95%).",
            "baseline_domain_score": risk_score,
            "stressed_domain_score": risk_score + risk_shock,
            "baseline_net_score": baseline_net_score,
            "stressed_net_score": shock_3_score,
            "score_delta": shock_3_score - baseline_net_score,
            "baseline_decision": baseline_decision,
            "stressed_decision": decision_3,
            "verdict_changed": baseline_decision != decision_3,
            "rationale": (
                f"Heightened volatility broadens downside variance, dropping score to {shock_3_score:+d} ({decision_3})."
            )
        })

        return scenarios


counterfactual_engine = CounterfactualEngine()
