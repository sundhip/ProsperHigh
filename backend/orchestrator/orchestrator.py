import asyncio
import time
import uuid
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.agents.market_agent import market_agent
from backend.agents.technical_agent import technical_agent
from backend.agents.news_agent import news_agent
from backend.agents.fundamental_agent import fundamental_agent
from backend.agents.regulatory_agent import regulatory_agent
from backend.agents.risk_agent import risk_agent
from backend.agents.synthesis_agent import synthesis_agent

from backend.schemas.agent_contracts import (
    AgentOutput,
    AgentStatus,
    SignalType,
    SynthesisOutput
)
from backend.services.data_service import data_service
from backend.database.models import AnalysisRun, AgentRun


class Orchestrator:
    """
    AI Multi-Agent Orchestrator:
    Manages concurrent async execution of domain specialists, validates structured outputs,
    isolates agent failures, aggregates through Synthesis, and persists audit runs to the database.
    """

    async def _run_agent_safe(self, name: str, fn, *args) -> AgentOutput:
        """Executes an agent in a background thread with error isolation and schema validation."""
        start_time = time.time()
        try:
            res = await asyncio.to_thread(fn, *args)
            if isinstance(res, AgentOutput):
                return res
            # If agent returned dict, validate into AgentOutput
            return AgentOutput(**res)
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            return AgentOutput(
                agent_name=name,
                symbol=args[0] if args else "UNKNOWN",
                status=AgentStatus.FAILED,
                signal=SignalType.NEUTRAL,
                confidence=0.0,
                impact_score=0,
                summary=f"Execution error in {name} agent: {str(e)}",
                findings=[],
                evidence=[],
                risks=[],
                warnings=[f"{name} agent execution failed: {str(e)}"],
                limitations=[f"Exception: {type(e).__name__}"],
                execution_metadata={"latency_ms": latency_ms, "error": str(e)}
            )

    async def aanalyze_stock(
        self,
        symbol: str,
        user_id: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Asynchronously runs 6 domain specialists concurrently, validates outputs,
        synthesizes final thesis, and saves execution records to the database.
        """
        start_time = time.time()
        canon_symbol = data_service.normalize_symbol(symbol)

        # 1. Concurrent execution of the 6 independent domain agents
        market_task = self._run_agent_safe("market", market_agent.analyze, canon_symbol)
        technical_task = self._run_agent_safe("technical", technical_agent.analyze, canon_symbol)
        news_task = self._run_agent_safe("news", news_agent.analyze, canon_symbol)
        fundamental_task = self._run_agent_safe("fundamental", fundamental_agent.analyze, canon_symbol)
        regulatory_task = self._run_agent_safe("regulatory", regulatory_agent.analyze, canon_symbol)
        risk_task = self._run_agent_safe("risk", risk_agent.analyze, canon_symbol, user_id)

        results = await asyncio.gather(
            market_task,
            technical_task,
            news_task,
            fundamental_task,
            regulatory_task,
            risk_task
        )

        agent_outputs: Dict[str, AgentOutput] = {
            "market": results[0],
            "technical": results[1],
            "news": results[2],
            "fundamental": results[3],
            "regulatory": results[4],
            "risk": results[5],
        }

        # 2. Run Synthesis layer
        synthesis_res: SynthesisOutput = await asyncio.to_thread(
            synthesis_agent.synthesize, canon_symbol, user_id, agent_outputs
        )

        total_latency_ms = int((time.time() - start_time) * 1000)
        analysis_id = f"ANL-{uuid.uuid4().hex[:12].upper()}"

        # 3. Format response aligned with AnalysisResponse schema
        agents_dict = {}
        for name, out in agent_outputs.items():
            agents_dict[name] = out.model_dump()

        user_name = "Investor"
        if user_id:
            try:
                u = data_service.get_user_profile(user_id)
                user_name = u.get("name", "Investor")
            except Exception:
                pass

        # Build decision trace and factors
        positives = []
        negatives = []
        for out in agent_outputs.values():
            if out.status == AgentStatus.SUCCESS:
                for f in out.findings:
                    if f.sentiment == "POSITIVE":
                        positives.append(f.title)
                    elif f.sentiment == "NEGATIVE":
                        negatives.append(f.title)

        decision_trace = [
            {"stage": "Market Regime & Macro", "status": agent_outputs["market"].signal.value, "impact": f"{agent_outputs['market'].impact_score:+d}"},
            {"stage": "Technical Momentum", "status": agent_outputs["technical"].signal.value, "impact": f"{agent_outputs['technical'].impact_score:+d}"},
            {"stage": "News Sentiment", "status": agent_outputs["news"].signal.value, "impact": f"{agent_outputs['news'].impact_score:+d}"},
            {"stage": "Fundamental Health", "status": agent_outputs["fundamental"].signal.value, "impact": f"{agent_outputs['fundamental'].impact_score:+d}"},
            {"stage": "Regulatory Compliance", "status": agent_outputs["regulatory"].signal.value, "impact": f"{agent_outputs['regulatory'].impact_score:+d}"},
            {"stage": "Portfolio Risk & Exposure", "status": agent_outputs["risk"].signal.value, "impact": f"{agent_outputs['risk'].impact_score:+d}"},
            {"stage": "Synthesized Verdict", "status": synthesis_res.final_decision.value, "impact": f"{synthesis_res.net_score:+d}"}
        ]

        response_dict: Dict[str, Any] = {
            "analysis_id": analysis_id,
            "symbol": canon_symbol,
            "status": synthesis_res.status.value,
            "user_id": user_id,
            "user_name": user_name,
            "final_decision": synthesis_res.final_decision.value,
            "confidence": synthesis_res.confidence,
            "net_score": synthesis_res.net_score,
            "agents": agents_dict,
            "conflicts": synthesis_res.conflict_report.model_dump(),
            "positive_factors": positives,
            "negative_factors": negatives,
            "biggest_factor": {
                "agent": "risk" if agent_outputs["risk"].impact_score < 0 else "fundamental",
                "score": agent_outputs["risk"].impact_score if agent_outputs["risk"].impact_score < 0 else agent_outputs["fundamental"].impact_score
            },
            "decision_trace": decision_trace,
            "counterfactuals": [
                "Technical momentum confirms above 50-day moving average" if agent_outputs["technical"].impact_score < 0 else "Maintain current risk parameters",
                "Regulatory compliance inquiries are clarified by exchange circulars"
            ],
            "thesis_invalidation": [
                "Quarterly operating cash flow conversion deteriorates below historical averages",
                "Broad market volatility index spikes significantly above current levels"
            ],
            "stock_switcher": [],
            "explanation": synthesis_res.interpretation,
            "uncertainty": synthesis_res.uncertainty,
            "evidence": [e.model_dump() for e in synthesis_res.evidence],
            "llm_provider": synthesis_res.model_provider,
            "warnings": synthesis_res.warnings
        }

        # 4. Database Persistence (Audit Trail)
        if db and user_id:
            try:
                analysis_record = AnalysisRun(
                    id=analysis_id,
                    user_id=user_id,
                    symbol=canon_symbol,
                    status=synthesis_res.status.value,
                    final_decision=synthesis_res.final_decision.value,
                    confidence=synthesis_res.confidence,
                    net_score=synthesis_res.net_score,
                    summary=synthesis_res.summary,
                    conflict_level=synthesis_res.conflict_report.conflict_level,
                    model_provider=synthesis_res.model_provider,
                    execution_time_ms=total_latency_ms,
                    full_json=response_dict
                )
                db.add(analysis_record)

                for name, out in agent_outputs.items():
                    agent_record = AgentRun(
                        id=f"AGR-{uuid.uuid4().hex[:12].upper()}",
                        analysis_id=analysis_id,
                        agent_name=name,
                        status=out.status.value,
                        signal=out.signal.value if out.signal else None,
                        confidence=out.confidence,
                        impact_score=out.impact_score,
                        summary=out.summary,
                        findings_json=[f.model_dump() for f in out.findings],
                        evidence_json=[e.model_dump() for e in out.evidence],
                        warnings_json=out.warnings,
                        model_used=synthesis_res.model_provider,
                        execution_time_ms=out.execution_metadata.get("latency_ms", 0)
                    )
                    db.add(agent_record)

                db.commit()
            except Exception as e:
                db.rollback()
                # Log error without failing analysis return
                print(f"Failed to persist analysis audit run: {e}")

        return response_dict

    def analyze_stock(
        self,
        symbol: str,
        user_id: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """Synchronous bridge to aanalyze_stock."""
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                return pool.submit(lambda: asyncio.run(self.aanalyze_stock(symbol, user_id, db))).result()
        else:
            return asyncio.run(self.aanalyze_stock(symbol, user_id, db))


orchestrator = Orchestrator()
