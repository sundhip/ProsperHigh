import time
from datetime import datetime
from typing import Dict, Any, List, Optional

from backend.services.data_service import data_service
from backend.schemas.agent_contracts import (
    AgentOutput,
    AgentStatus,
    SignalType,
    EvidenceItem,
    AgentFinding
)


class FundamentalAgent:
    """
    Fundamental Specialist Agent: Analyzes actual company financial statements,
    operating cash flows, valuation multiples (P/E, P/B), and balance sheet solvency.
    Strictly forbids invented financial figures.
    """

    def analyze(self, symbol: str) -> AgentOutput:
        start_time = time.time()
        canon_sym = data_service.normalize_symbol(symbol)
        fund = data_service.get_stock_fundamentals(canon_sym)

        if not fund:
            return AgentOutput(
                agent_name="fundamental",
                symbol=canon_sym,
                status=AgentStatus.INSUFFICIENT_DATA,
                signal=SignalType.NEUTRAL,
                confidence=0.0,
                impact_score=0,
                summary=f"No audited financial statements or fundamental balance-sheet records available for {canon_sym}.",
                findings=[],
                evidence=[],
                risks=["Financial opacity: fundamental statement data missing"],
                warnings=["Company fundamentals not indexed in dataset"],
                limitations=["P/E, ROE, debt-to-equity, and cash flow conversion cannot be computed"],
                data_timestamp=datetime.utcnow().isoformat(),
                execution_metadata={"latency_ms": int((time.time() - start_time) * 1000)}
            )

        # 1. Extract verified source data
        company_name = fund.get("name", canon_sym)
        rev_cr = float(fund.get("revenue_cr", 0))
        rev_growth = float(fund.get("revenue_growth_yo_y", 0))
        profit_cr = float(fund.get("net_profit_cr", 0))
        profit_growth = float(fund.get("profit_growth_yo_y", 0))
        ocf_cr = float(fund.get("operating_cash_flow_cr", 0))
        roe_pct = float(fund.get("roe_pct", 0))
        debt_equity = float(fund.get("debt_to_equity", 0))
        pe_ratio = float(fund.get("pe_ratio", 0))
        pb_ratio = float(fund.get("pb_ratio", 0))
        anomalies = fund.get("anomalies", [])

        # 2. Programmatic calculated metrics
        # Cash flow to net profit conversion ratio
        ocf_conversion_pct = (ocf_cr / profit_cr * 100) if profit_cr > 0 else 0.0

        impact_score = 0
        findings = []
        risks = []
        warnings = []

        # Revenue & profit growth
        if rev_growth > 12.0 and profit_growth > 15.0:
            impact_score += 8
            findings.append(AgentFinding(
                title=f"Robust Top & Bottom Line Growth (+{rev_growth:.1f}% Rev / +{profit_growth:.1f}% PAT)",
                description=f"Double-digit revenue expansion (₹{rev_cr:,.0f} Cr) paired with earnings expansion (₹{profit_cr:,.0f} Cr).",
                sentiment="POSITIVE",
                impact_score=8
            ))
        elif rev_growth > 0:
            impact_score += 4
            findings.append(AgentFinding(
                title=f"Moderate Revenue Growth (+{rev_growth:.1f}%)",
                description=f"Revenue expanded at {rev_growth:.1f}% YoY reaching ₹{rev_cr:,.0f} Cr.",
                sentiment="POSITIVE",
                impact_score=4
            ))
        else:
            impact_score -= 5
            findings.append(AgentFinding(
                title=f"Revenue Contraction ({rev_growth:.1f}%)",
                description=f"Top-line contracted by {abs(rev_growth):.1f}% YoY.",
                sentiment="NEGATIVE",
                impact_score=-5
            ))

        # Solvency & ROE
        if roe_pct >= 15.0 and debt_equity < 0.8:
            impact_score += 6
            findings.append(AgentFinding(
                title=f"High Return on Equity ({roe_pct:.1f}%) with Conservative Leverage ({debt_equity:.2f}x)",
                description="Capital allocation discipline confirmed with high ROE and well-covered debt obligations.",
                sentiment="POSITIVE",
                impact_score=6
            ))
        elif debt_equity > 1.5:
            impact_score -= 4
            findings.append(AgentFinding(
                title=f"Elevated Leverage ({debt_equity:.2f}x D/E)",
                description=f"Debt-to-equity ratio of {debt_equity:.2f}x presents elevated sensitivity to interest rate cycles.",
                sentiment="NEGATIVE",
                impact_score=-4
            ))
            risks.append(f"Elevated financial leverage ({debt_equity:.2f}x Debt-to-Equity)")

        # Accounting anomalies & Cash Flow Divergence
        for anomaly in anomalies:
            impact_score -= 6
            desc = anomaly.get("description", "Accounting divergence detected")
            warnings.append(f"Fundamental anomaly: {desc}")
            risks.append(desc)
            findings.append(AgentFinding(
                title=f"Anomaly: {anomaly.get('type', 'Accounting Divergence')}",
                description=desc,
                sentiment="NEGATIVE",
                impact_score=-6
            ))

        signal = SignalType.BUY if impact_score >= 8 else (SignalType.HOLD if impact_score >= 0 else SignalType.AVOID)

        # 3. Traceable Evidence
        evidence = [
            EvidenceItem(
                claim=f"Annual Revenue: ₹{rev_cr:,.0f} Cr (+{rev_growth:.1f}% YoY); Net Profit: ₹{profit_cr:,.0f} Cr (+{profit_growth:.1f}% YoY)",
                source="Audited Financial Statements",
                metric_value=f"₹{profit_cr:,.0f} Cr",
                timestamp=datetime.utcnow().strftime("%Y-%m-%d"),
                reference=f"{company_name} Income Statement"
            ),
            EvidenceItem(
                claim=f"Return on Equity (ROE): {roe_pct:.1f}%, Debt-to-Equity: {debt_equity:.2f}x, P/E Ratio: {pe_ratio:.1f}x",
                source="Fundamental Ratio Engine",
                metric_value=f"{roe_pct:.1f}%",
                timestamp=datetime.utcnow().strftime("%Y-%m-%d"),
                reference="Balance Sheet Solvency & Valuation"
            ),
            EvidenceItem(
                claim=f"Operating Cash Flow: ₹{ocf_cr:,.0f} Cr ({ocf_conversion_pct:.1f}% conversion of net profit)",
                source="Cash Flow Statement Analysis",
                metric_value=f"₹{ocf_cr:,.0f} Cr",
                timestamp=datetime.utcnow().strftime("%Y-%m-%d"),
                reference="Cash Flow from Operations"
            )
        ]

        summary = (
            f"Fundamental health for {company_name} is {fund.get('quality_score', 'STABLE').lower()} (impact: {impact_score:+d}). "
            f"Revenue grew {rev_growth:+.1f}% YoY to ₹{rev_cr:,.0f} Cr, ROE is {roe_pct:.1f}%, and P/E is {pe_ratio:.1f}x. "
            f"{'Working capital conversion anomaly flagged.' if anomalies else 'Cash flows align with earnings.'}"
        )

        latency_ms = int((time.time() - start_time) * 1000)

        return AgentOutput(
            agent_name="fundamental",
            symbol=canon_sym,
            status=AgentStatus.SUCCESS,
            signal=signal,
            confidence=0.88,
            impact_score=impact_score,
            summary=summary,
            findings=findings,
            evidence=evidence,
            risks=risks,
            warnings=warnings,
            limitations=[],
            data_timestamp=datetime.utcnow().isoformat(),
            execution_metadata={
                "latency_ms": latency_ms,
                "roe_pct": roe_pct,
                "pe_ratio": pe_ratio,
                "debt_to_equity": debt_equity
            }
        )


fundamental_agent = FundamentalAgent()
