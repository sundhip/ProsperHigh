import time
from datetime import datetime
from typing import Dict, Any, Optional

from backend.services.data_service import data_service
from backend.services.market_data.service import market_data_service
from backend.services.ai_provider.service import ai_provider_service
from backend.services.ai_provider.base import ModelRequest
from backend.schemas.agent_contracts import (
    AgentOutput,
    AgentStatus,
    SignalType,
    EvidenceItem,
    AgentFinding
)


class MarketAgent:
    """
    Market Specialist Agent: Analyzes real-time market regimes, price movements,
    market breadth, and sector conditions using Phase 2 market data services.
    Never hallucinates unlisted stocks or fabricated market numbers.
    """

    def analyze(self, symbol: str) -> AgentOutput:
        start_time = time.time()
        canon_sym = data_service.normalize_symbol(symbol)
        quote = market_data_service.get_quote(canon_sym)
        macro = data_service.get_market_macro() or {}

        # 1. Truthful handling of unavailable stocks
        if not quote:
            return AgentOutput(
                agent_name="market",
                symbol=canon_sym,
                status=AgentStatus.INSUFFICIENT_DATA,
                signal=SignalType.NEUTRAL,
                confidence=0.0,
                impact_score=0,
                summary=f"Market data quote unavailable for symbol '{canon_sym}'. Unable to evaluate market conditions.",
                findings=[],
                evidence=[],
                risks=["Missing real-time market quote data"],
                warnings=["Stock quote not found in active market universe"],
                limitations=["No exchange quote stream accessible for this ticker"],
                data_timestamp=datetime.utcnow().isoformat(),
                execution_metadata={"latency_ms": int((time.time() - start_time) * 1000)}
            )

        # 2. Gather verified data facts
        price = quote.price
        change_pct = quote.change_pct
        prev_close = quote.previous_close
        sector = quote.sector or "General"
        nifty_trend = macro.get("nifty50_trend", "NEUTRAL")
        breadth = macro.get("market_breadth", "Balanced")
        sector_status = macro.get("sector_status", {}).get(sector, "NEUTRAL")

        warnings = []
        if quote.is_stale:
            warnings.append("Quote is utilizing cached or previous closing session pricing.")

        # 3. Calculate verified deterministic impact score
        impact_score = 0
        if change_pct > 1.5:
            impact_score += 3
        elif change_pct < -1.5:
            impact_score -= 3

        if nifty_trend == "BULLISH":
            impact_score += 4
        elif nifty_trend == "BEARISH":
            impact_score -= 4

        if sector_status == "LEADING":
            impact_score += 4
        elif sector_status == "LAGGING":
            impact_score -= 4
        elif sector_status == "WEAKENING":
            impact_score -= 2

        signal = SignalType.BUY if impact_score >= 4 else (SignalType.HOLD if impact_score >= -2 else SignalType.AVOID)

        # 4. Compile strictly traceable evidence
        evidence = [
            EvidenceItem(
                claim=f"{quote.name or canon_sym} traded at ₹{price:.2f} ({change_pct:+.2f}%) on {quote.exchange}",
                source=f"{quote.exchange} Live Market Feed",
                metric_value=f"₹{price:.2f}",
                timestamp=quote.as_of.isoformat() if hasattr(quote, "as_of") else datetime.utcnow().isoformat(),
                reference="Market Data Provider"
            ),
            EvidenceItem(
                claim=f"Broad market regime: Nifty 50 trend is {nifty_trend} with {breadth} market breadth",
                source="Exchange Macro Telemetry",
                metric_value=nifty_trend,
                timestamp=datetime.utcnow().strftime("%Y-%m-%d"),
                reference=f"Advancing: {macro.get('advancing_stocks', 'N/A')}, Declining: {macro.get('declining_stocks', 'N/A')}"
            ),
            EvidenceItem(
                claim=f"Sector allocation status for {sector} is {sector_status}",
                source="Sector Rotation Matrix",
                metric_value=sector_status,
                timestamp=datetime.utcnow().strftime("%Y-%m-%d"),
                reference=f"Sector: {sector}"
            )
        ]

        findings = [
            AgentFinding(
                title=f"Market Regime: {nifty_trend}",
                description=f"Nifty 50 index is exhibiting {nifty_trend.lower()} momentum with {breadth.lower()} breadth.",
                sentiment="POSITIVE" if nifty_trend == "BULLISH" else ("NEGATIVE" if nifty_trend == "BEARISH" else "NEUTRAL"),
                impact_score=4 if nifty_trend == "BULLISH" else (-4 if nifty_trend == "BEARISH" else 0)
            ),
            AgentFinding(
                title=f"Sector Momentum: {sector_status}",
                description=f"{sector} sector is currently classified as {sector_status.lower()}.",
                sentiment="POSITIVE" if sector_status == "LEADING" else ("NEGATIVE" if sector_status in ["LAGGING", "WEAKENING"] else "NEUTRAL"),
                impact_score=4 if sector_status == "LEADING" else (-4 if sector_status == "LAGGING" else -2)
            )
        ]

        summary = (
            f"Market conditions are {nifty_trend.lower()} with {breadth.lower()} market breadth. "
            f"{canon_sym} closed at ₹{price:.2f} ({change_pct:+.2f}%), with its sector ({sector}) categorized as {sector_status.lower()}."
        )

        latency_ms = int((time.time() - start_time) * 1000)

        return AgentOutput(
            agent_name="market",
            symbol=canon_sym,
            status=AgentStatus.SUCCESS,
            signal=signal,
            confidence=0.85 if not quote.is_stale else 0.70,
            impact_score=impact_score,
            summary=summary,
            findings=findings,
            evidence=evidence,
            risks=[f"Sector rotation risk if {sector} weakens further"] if sector_status in ["WEAKENING", "LAGGING"] else [],
            warnings=warnings,
            limitations=[],
            data_timestamp=datetime.utcnow().isoformat(),
            execution_metadata={
                "latency_ms": latency_ms,
                "provider": quote.provider if hasattr(quote, "provider") else "phase2_market_service"
            }
        )


market_agent = MarketAgent()
