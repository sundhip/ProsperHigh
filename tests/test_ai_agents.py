from backend.agents.market_agent import market_agent
from backend.agents.technical_agent import technical_agent
from backend.agents.news_agent import news_agent
from backend.agents.fundamental_agent import fundamental_agent
from backend.agents.regulatory_agent import regulatory_agent
from backend.agents.risk_agent import risk_agent
from backend.schemas.agent_contracts import AgentStatus, SignalType


def test_market_agent_valid_symbol():
    """Verify Market Agent produces valid structured output for listed equities."""
    out = market_agent.analyze("INFY")
    assert out.agent_name == "market"
    assert out.status == AgentStatus.SUCCESS
    assert out.confidence > 0.0
    assert len(out.evidence) >= 1
    assert any("₹" in e.claim for e in out.evidence)


def test_market_agent_unlisted_symbol():
    """Verify Market Agent returns INSUFFICIENT_DATA for unlisted stocks without hallucination."""
    out = market_agent.analyze("UNLISTED_XYZ_UNKNOWN")
    assert out.agent_name == "market"
    assert out.status == AgentStatus.INSUFFICIENT_DATA
    assert out.confidence == 0.0
    assert len(out.limitations) >= 1


def test_technical_agent_programmatic_calculation():
    """Verify Technical Agent calculates programmatic indicators accurately."""
    out = technical_agent.analyze("TCS")
    assert out.agent_name == "technical"
    assert out.status == AgentStatus.SUCCESS
    assert out.confidence > 0.0
    assert len(out.findings) >= 1
    # Check that evidence references SMA or RSI
    assert any("RSI" in e.claim or "SMA" in e.claim for e in out.evidence)


def test_technical_agent_missing_data():
    """Verify Technical Agent reports INSUFFICIENT_DATA when history is unavailable."""
    out = technical_agent.analyze("MISSING_TICKER_123")
    assert out.status == AgentStatus.INSUFFICIENT_DATA
    assert out.confidence == 0.0


def test_news_agent_real_articles():
    """Verify News Agent analyzes verified news and cites real sources."""
    out = news_agent.analyze("RELIANCE")
    assert out.agent_name == "news"
    assert out.status == AgentStatus.SUCCESS
    assert len(out.evidence) >= 1
    assert any("Economic Times" in e.source or "Mint" in e.source or "Business Standard" in e.source for e in out.evidence)


def test_news_agent_missing_news():
    """Verify News Agent returns INSUFFICIENT_DATA when no articles exist."""
    out = news_agent.analyze("NO_NEWS_TICKER")
    assert out.status == AgentStatus.INSUFFICIENT_DATA
    assert out.confidence == 0.0


def test_fundamental_agent_real_data():
    """Verify Fundamental Agent analyzes verified balance sheets and cash flows."""
    out = fundamental_agent.analyze("RELIANCE")
    assert out.agent_name == "fundamental"
    assert out.status == AgentStatus.SUCCESS
    assert len(out.evidence) >= 1
    assert any("Cr" in e.claim for e in out.evidence)
    # Check anomaly check or ROE calculation
    assert "roe_pct" in out.execution_metadata


def test_fundamental_agent_missing_fundamentals():
    """Verify Fundamental Agent returns INSUFFICIENT_DATA when records are missing."""
    out = fundamental_agent.analyze("UNKNOWN_CORP")
    assert out.status == AgentStatus.INSUFFICIENT_DATA


def test_regulatory_agent_real_filings():
    """Verify Regulatory Agent evaluates verified annual reports with page citations."""
    out = regulatory_agent.analyze("RELIANCE")
    assert out.agent_name == "regulatory"
    assert out.status == AgentStatus.SUCCESS
    assert len(out.evidence) >= 1
    # Check page citations
    assert any("Page" in e.reference or "Section" in e.reference for e in out.evidence)


def test_regulatory_agent_missing_documents():
    """Verify Regulatory Agent reports INSUFFICIENT_DATA if no filings exist."""
    out = regulatory_agent.analyze("STARTUP_NO_FILINGS")
    assert out.status == AgentStatus.INSUFFICIENT_DATA


def test_risk_agent_portfolio_context(test_user_a):
    """Verify Risk Agent evaluates portfolio concentration using real user ledger."""
    out = risk_agent.analyze("RELIANCE", user_id=test_user_a.id)
    assert out.agent_name == "risk"
    assert out.status == AgentStatus.SUCCESS
    assert len(out.evidence) >= 1
    assert "sector_exposure_pct" in out.execution_metadata
