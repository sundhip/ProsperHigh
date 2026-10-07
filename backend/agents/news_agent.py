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


class NewsAgent:
    """
    News & Sentiment Specialist Agent: Analyzes verified recent news articles,
    FinBERT sentiment scores, and editorial trends.
    Never fabricates fake news headlines, URLs, or synthetic publications.
    """

    def analyze(self, symbol: str) -> AgentOutput:
        start_time = time.time()
        canon_sym = data_service.normalize_symbol(symbol)
        news_data = data_service.get_stock_news(canon_sym)

        articles = news_data.get("articles", []) if news_data else []

        if not articles:
            return AgentOutput(
                agent_name="news",
                symbol=canon_sym,
                status=AgentStatus.INSUFFICIENT_DATA,
                signal=SignalType.NEUTRAL,
                confidence=0.0,
                impact_score=0,
                summary=f"No verified current news articles or press releases found for {canon_sym}.",
                findings=[],
                evidence=[],
                risks=["Information opacity due to absence of verified news flow"],
                warnings=["News feed contains 0 articles for this ticker"],
                limitations=["No financial news articles indexed in system for this company"],
                data_timestamp=datetime.utcnow().isoformat(),
                execution_metadata={"latency_ms": int((time.time() - start_time) * 1000)}
            )

        trend = news_data.get("sentiment_trend", "NEUTRAL")
        net_score = float(news_data.get("net_sentiment_score", 0.0))
        flags = news_data.get("flags", [])

        # Process articles into verified findings & evidence
        findings: List[AgentFinding] = []
        evidence: List[EvidenceItem] = []
        impact_score = 0
        risks = []
        warnings = []

        if "SENTIMENT_DETERIORATION" in flags:
            warnings.append("Rapid news sentiment deterioration detected across recent news cycles.")

        for article in articles:
            art_id = article.get("id", "NEWS")
            headline = article.get("headline", "")
            source = article.get("source", "Financial Press")
            date_str = article.get("date", datetime.utcnow().strftime("%Y-%m-%d"))
            score = float(article.get("finbert_score", 0.0))
            category = article.get("category", "General")
            art_summary = article.get("summary", "")

            sentiment_label = "POSITIVE" if score > 0.2 else ("NEGATIVE" if score < -0.2 else "NEUTRAL")
            item_impact = int(score * 6)
            impact_score += item_impact

            findings.append(AgentFinding(
                title=f"{category}: {headline[:70]}...",
                description=art_summary or headline,
                sentiment=sentiment_label,
                impact_score=item_impact
            ))

            evidence.append(EvidenceItem(
                claim=f"{source}: \"{headline}\" (FinBERT score: {score:+.2f})",
                source=source,
                metric_value=f"{score:+.2f}",
                timestamp=date_str,
                reference=f"Article ID: {art_id} [{category}]"
            ))

            if score < -0.3:
                risks.append(f"Negative media exposure: {headline[:60]}...")

        signal = SignalType.BUY if net_score > 0.2 else (SignalType.AVOID if net_score < -0.2 else SignalType.HOLD)

        summary = (
            f"Analyzed {len(articles)} verified news articles with overall sentiment trend '{trend}' "
            f"(net FinBERT score: {net_score:+.2f}). "
            f"{'Sentiment deterioration flagged.' if 'SENTIMENT_DETERIORATION' in flags else 'Coverage is stable.'}"
        )

        latency_ms = int((time.time() - start_time) * 1000)

        return AgentOutput(
            agent_name="news",
            symbol=canon_sym,
            status=AgentStatus.SUCCESS,
            signal=signal,
            confidence=0.84 if len(articles) >= 2 else 0.65,
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
                "articles_count": len(articles),
                "sentiment_trend": trend
            }
        )


news_agent = NewsAgent()
