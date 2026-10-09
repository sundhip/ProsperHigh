import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone


class ThesisEngine:
    """
    Investment Thesis & Invalidation Engine:
    Synthesizes versioned, auditable investment theses with concrete supporting pillars,
    explicit operational assumptions, and verifiable invalidation conditions.
    """
    METHODOLOGY_VERSION = "v4.0.0"

    def generate_thesis(
        self,
        symbol: str,
        synthesis_result: Dict[str, Any],
        agent_outputs: Dict[str, Any],
        version: str = "1.0"
    ) -> Dict[str, Any]:
        """
        Builds a versioned structured investment thesis with explicit falsifiability criteria.
        """
        symbol = symbol.upper().strip()
        thesis_id = f"THS-{uuid.uuid4().hex[:10].upper()}"

        decision = synthesis_result.get("final_decision", "HOLD")
        net_score = synthesis_result.get("net_score", 0)

        # 1. Supporting pillars from successful agent findings
        pillars: List[Dict[str, Any]] = []
        counters: List[Dict[str, Any]] = []

        for name, out in agent_outputs.items():
            data = out.model_dump() if hasattr(out, "model_dump") else out
            if not isinstance(data, dict):
                continue
            impact = data.get("impact_score", 0)
            summary = data.get("summary", "")
            findings = data.get("findings", [])

            if impact > 2:
                pillars.append({
                    "domain": name.capitalize(),
                    "pillar": summary,
                    "evidence": [f.get("title") if isinstance(f, dict) else str(f) for f in findings[:2]]
                })
            elif impact < -2:
                counters.append({
                    "domain": name.capitalize(),
                    "counter": summary,
                    "risk_factor": [f.get("title") if isinstance(f, dict) else str(f) for f in findings[:2]]
                })

        # 2. Central Thesis Narrative
        if decision == "BUY":
            central_thesis = (
                f"{symbol} demonstrates resilient financial and momentum characteristics (Net Score: {net_score:+d}). "
                "The core premise relies on persistent operational execution and market-trend tailwinds."
            )
        elif decision == "AVOID":
            central_thesis = (
                f"{symbol} faces elevated structural or valuation headwinds (Net Score: {net_score:+d}). "
                "Capital preservation dictates underweighting until fundamental inflection or valuation reset occurs."
            )
        else:
            central_thesis = (
                f"{symbol} exhibits balanced risk/reward trade-offs (Net Score: {net_score:+d}). "
                "Current valuation reflects visible prospects; catalyst clarity is required before initiating aggressive exposure."
            )

        # 3. Explicit Analytical Assumptions
        assumptions = [
            "Operating margins remain within historical standard deviation bounds over the next 4 quarters.",
            "Domestic macroeconomic consumption trends remain steady without unexpected regulatory interventions.",
            "Historical trading liquidity remains sufficient for orderly position entries and exits."
        ]

        # 4. Conditions That Weaken Conviction
        weakening_conditions = [
            "Consecutive quarterly operating margin deceleration of greater than 150 basis points.",
            "Sustained weekly closes below key 50-day moving average volume weighted levels.",
            "Rise in customer concentration metrics where top 3 accounts exceed 45% of gross revenue."
        ]

        # 5. Concrete Invalidation Conditions (Kill-Criteria)
        invalidation_conditions = [
            f"Debt-to-equity ratio expands beyond 2.0x, indicating excessive balance sheet leverage.",
            f"Breakdown below 200-day simple moving average accompanied by above-average distribution volume.",
            f"Adverse statutory or regulatory ruling imposing structural operational bans or material penalties.",
            f"Operating cash flow conversion drops negative for two consecutive trailing half-year periods."
        ]

        # 6. Observable Monitoring Indicators
        monitoring_indicators = [
            "Next quarterly earnings disclosure: revenue growth YoY & EBITDA margin trajectory.",
            "Institutional shareholding changes in upcoming quarterly shareholding pattern.",
            "Delivery volume percentage on key technical breakout/breakdown days."
        ]

        return {
            "thesis_id": thesis_id,
            "symbol": symbol,
            "version": version,
            "central_thesis": central_thesis,
            "final_verdict": decision,
            "net_score": net_score,
            "supporting_pillars": pillars,
            "counter_arguments": counters,
            "core_assumptions": assumptions,
            "weakening_conditions": weakening_conditions,
            "invalidation_conditions": invalidation_conditions,
            "monitoring_indicators": monitoring_indicators,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "methodology_version": self.METHODOLOGY_VERSION
        }

    def compare_theses(
        self,
        prior_thesis: Dict[str, Any],
        current_thesis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Diffs two versions of an investment thesis to expose evolution of conviction, pillars, and invalidation triggers.
        """
        prior_pillars = set(p.get("pillar") for p in prior_thesis.get("supporting_pillars", []))
        curr_pillars = set(p.get("pillar") for p in current_thesis.get("supporting_pillars", []))

        prior_score = prior_thesis.get("net_score", 0)
        curr_score = current_thesis.get("net_score", 0)

        return {
            "symbol": current_thesis.get("symbol"),
            "prior_version": prior_thesis.get("version"),
            "current_version": current_thesis.get("version"),
            "prior_verdict": prior_thesis.get("final_verdict"),
            "current_verdict": current_thesis.get("final_verdict"),
            "score_change": curr_score - prior_score,
            "new_pillars": list(curr_pillars - prior_pillars),
            "removed_pillars": list(prior_pillars - curr_pillars),
            "invalidation_status": (
                "CONVICTION_CHANGED" if prior_thesis.get("final_verdict") != current_thesis.get("final_verdict")
                else "CONVICTION_MAINTAINED"
            ),
            "comparison_timestamp": datetime.now(timezone.utc).isoformat()
        }


thesis_engine = ThesisEngine()
