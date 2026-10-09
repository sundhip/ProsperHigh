import uuid
from typing import Dict, Any, List, Optional
from backend.schemas.agent_contracts import AgentOutput, SignalType


class DebateEngine:
    """
    AI Multi-Agent Debate Engine:
    Examines actual stored specialist agent findings (Technical, Fundamental, Risk, News, Market, Regulatory)
    to surface genuine, evidence-backed disagreements without fabricating quotes or forcing artificial consensus.
    """

    def analyze_disagreements(
        self,
        symbol: str,
        agent_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Scans agent signals and impact scores for material tensions.
        Returns structured debate threads with bull/bear arguments, conflict types, and information gaps.
        """
        symbol = symbol.upper().strip()
        debate_id = f"DEB-{uuid.uuid4().hex[:10].upper()}"

        def get_agent_data(name: str):
            out = agent_outputs.get(name)
            if not out:
                return None
            if hasattr(out, "model_dump"):
                return out.model_dump()
            return out

        tech = get_agent_data("technical")
        fund = get_agent_data("fundamental")
        risk = get_agent_data("risk")
        news = get_agent_data("news")
        mkt = get_agent_data("market")
        reg = get_agent_data("regulatory")

        debates: List[Dict[str, Any]] = []

        # 1. Technical vs Fundamental Divergence (Momentum vs Valuation)
        if tech and fund:
            tech_sig = tech.get("signal")
            fund_sig = fund.get("signal")
            tech_impact = tech.get("impact_score", 0)
            fund_impact = fund.get("impact_score", 0)

            # Divergence if one is BUY/positive and other is AVOID/negative
            if (tech_impact >= 3 and fund_impact <= -3) or (tech_impact <= -3 and fund_impact >= 3):
                bull = tech if tech_impact > fund_impact else fund
                bear = fund if tech_impact > fund_impact else tech
                bull_name = "Technical Analysis" if tech_impact > fund_impact else "Fundamental Health"
                bear_name = "Fundamental Health" if tech_impact > fund_impact else "Technical Analysis"

                debates.append({
                    "topic": "Momentum Breakout vs Underlying Valuation Discipline",
                    "conflict_type": "INTERPRETIVE",
                    "bull_perspective": {
                        "agent": bull_name,
                        "claim": bull.get("summary", "Positive trend indicators"),
                        "evidence": [e.get("claim") if isinstance(e, dict) else str(e) for e in bull.get("evidence", [])][:3],
                        "assumptions": ["Price action discounts forward fundamental improvements before quarterly disclosures"]
                    },
                    "bear_perspective": {
                        "agent": bear_name,
                        "claim": bear.get("summary", "Stretched valuation or margin compression"),
                        "evidence": [e.get("claim") if isinstance(e, dict) else str(e) for e in bear.get("evidence", [])][:3],
                        "assumptions": ["Valuation multiples eventually mean-revert toward historical industry averages"]
                    },
                    "evidence_strength": "High quantitative basis from historical price series and published balance sheet statements.",
                    "information_gap": "Upcoming quarterly earnings release showing whether revenue growth trajectory validates current multiple.",
                    "resolution_summary": (
                        f"Technical indicators favor short-term upside momentum ({bull_name}), while "
                        f"fundamental metrics warn of elevated multiples or compression ({bear_name}). "
                        "The tension is unresolved until actual revenue inflection is demonstrated."
                    )
                })

        # 2. Risk vs Market / Growth Opportunity (Concentration/Volatility vs Macro)
        if risk and (tech or mkt):
            risk_impact = risk.get("impact_score", 0)
            opp_agent = tech if (tech and tech.get("impact_score", 0) > 4) else mkt
            opp_impact = opp_agent.get("impact_score", 0) if opp_agent else 0

            if risk_impact <= -4 and opp_impact >= 4:
                debates.append({
                    "topic": "Portfolio Risk Exposure vs Upside Capital Participation",
                    "conflict_type": "INTERPRETIVE",
                    "bull_perspective": {
                        "agent": opp_agent.get("agent_name", "Market Opportunity").capitalize(),
                        "claim": opp_agent.get("summary", "Favorable asset setup and market participation catalyst"),
                        "evidence": [e.get("claim") if isinstance(e, dict) else str(e) for e in opp_agent.get("evidence", [])][:2],
                        "assumptions": ["Capitalizing on high-conviction trends outweighs marginal variance increases"]
                    },
                    "bear_perspective": {
                        "agent": "Risk & Portfolio Agent",
                        "claim": risk.get("summary", "Excessive single-stock concentration or volatility contribution"),
                        "evidence": [e.get("claim") if isinstance(e, dict) else str(e) for e in risk.get("evidence", [])][:2],
                        "assumptions": ["Downside risk mitigation and capital preservation preserve long-term survival"]
                    },
                    "evidence_strength": "Empirical portfolio weighting metrics and historical asset drawdown statistics.",
                    "information_gap": "Dynamic portfolio rebalancing policy or stop-loss trigger levels to limit downside tail-risk.",
                    "resolution_summary": (
                        "The opportunity offers meaningful upside participation, but risk controls indicate that "
                        "allocating further capital violates balanced concentration safeguards."
                    )
                })

        # 3. News Sentiment vs Regulatory/Governance Stance
        if news and reg:
            news_impact = news.get("impact_score", 0)
            reg_impact = reg.get("impact_score", 0)
            if abs(news_impact - reg_impact) >= 6:
                debates.append({
                    "topic": "Public News Sentiment vs Formal Regulatory Filings",
                    "conflict_type": "FACTUAL",
                    "bull_perspective": {
                        "agent": "News Sentiment" if news_impact > reg_impact else "Regulatory Compliance",
                        "claim": (news if news_impact > reg_impact else reg).get("summary", "Favorable public narrative"),
                        "evidence": [e.get("claim") if isinstance(e, dict) else str(e) for e in (news if news_impact > reg_impact else reg).get("evidence", [])][:2],
                        "assumptions": ["Media headlines reflect imminent commercial tailwinds and consumer demand"]
                    },
                    "bear_perspective": {
                        "agent": "Regulatory Compliance" if news_impact > reg_impact else "News Sentiment",
                        "claim": (reg if news_impact > reg_impact else news).get("summary", "Scrutiny or legal disclosures pending"),
                        "evidence": [e.get("claim") if isinstance(e, dict) else str(e) for e in (reg if news_impact > reg_impact else news).get("evidence", [])][:2],
                        "assumptions": ["Statutory filings disclose systemic operational risks often omitted in popular media"]
                    },
                    "evidence_strength": "Verified regulatory circulars compared against news article feeds.",
                    "information_gap": "Formal adjudication of ongoing statutory inquiries or official company clarification filings.",
                    "resolution_summary": (
                        "Public news coverage is discordant with regulatory disclosures. Investors should cross-verify "
                        "promotional headlines against auditable SEC/SEBI statutory filings."
                    )
                })

        has_active_debate = len(debates) > 0

        return {
            "debate_id": debate_id,
            "symbol": symbol,
            "has_material_disagreement": has_active_debate,
            "disagreement_count": len(debates),
            "threads": debates if has_active_debate else [
                {
                    "topic": "Broad Domain Consensus",
                    "conflict_type": "INTERPRETIVE",
                    "bull_perspective": {"agent": "Synthesizer", "claim": "Specialists are broadly congruent", "evidence": [], "assumptions": []},
                    "bear_perspective": {"agent": "Synthesizer", "claim": "No sharp contradictions detected across agents", "evidence": [], "assumptions": []},
                    "evidence_strength": "Consistent signals observed across technical, fundamental, and risk models.",
                    "information_gap": "None identified at current granularity.",
                    "resolution_summary": f"All evaluated specialist domains demonstrate directional consensus for {symbol}."
                }
            ],
            "methodology_version": "v4.0.0"
        }


debate_engine = DebateEngine()
