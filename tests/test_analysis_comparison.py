import pytest
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from backend.database.models import User, AnalysisRun
from backend.services.analysis_comparison_service import analysis_comparison_service


def test_analysis_comparison_diffs_runs_and_identifies_causes(db_session: Session):
    """Verify run comparison calculates score deltas, agent changes, and plain-language root causes."""
    user = User(name="Compare User", email="comp@test.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    # Run A: earlier run (Score +14, BUY)
    run_a = AnalysisRun(
        id="ANL-TEST-AAA",
        user_id=user.id,
        symbol="TATA",
        status="SUCCESS",
        final_decision="BUY",
        confidence=85,
        net_score=14,
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        full_json={
            "agents": {
                "fundamental": {"impact_score": 8, "signal": "BUY"},
                "technical": {"impact_score": 6, "signal": "BUY"}
            }
        }
    )

    # Run B: later run (Score +4, HOLD) due to fundamental compression
    run_b = AnalysisRun(
        id="ANL-TEST-BBB",
        user_id=user.id,
        symbol="TATA",
        status="SUCCESS",
        final_decision="HOLD",
        confidence=70,
        net_score=4,
        created_at=datetime(2026, 2, 1, tzinfo=timezone.utc),
        full_json={
            "agents": {
                "fundamental": {"impact_score": 2, "signal": "HOLD"},
                "technical": {"impact_score": 2, "signal": "HOLD"}
            }
        }
    )
    db_session.add_all([run_a, run_b])
    db_session.commit()

    diff = analysis_comparison_service.compare_runs(
        db=db_session,
        user_id=user.id,
        run_id_a="ANL-TEST-AAA",
        run_id_b="ANL-TEST-BBB"
    )

    assert diff["symbol"] == "TATA"
    assert diff["changes"]["score_delta"] == -10
    assert diff["changes"]["verdict_changed"] is True
    assert diff["run_a"]["verdict"] == "BUY"
    assert diff["run_b"]["verdict"] == "HOLD"
    assert len(diff["changes"]["material_causes"]) >= 1
    assert "Fundamental" in diff["changes"]["material_causes"][0]


def test_analysis_comparison_cross_user_forbidden(db_session: Session):
    """Verify user cannot compare analysis records belonging to a different user."""
    u1 = User(name="U1", email="u1_c@test.com", password_hash="hash")
    u2 = User(name="U2", email="u2_c@test.com", password_hash="hash")
    db_session.add_all([u1, u2])
    db_session.commit()

    run1 = AnalysisRun(id="ANL-U1", user_id=u1.id, symbol="INFY", final_decision="BUY", confidence=80, net_score=10)
    run2 = AnalysisRun(id="ANL-U2", user_id=u2.id, symbol="INFY", final_decision="HOLD", confidence=70, net_score=5)
    db_session.add_all([run1, run2])
    db_session.commit()

    with pytest.raises(Exception):
        analysis_comparison_service.compare_runs(db_session, user_id=u1.id, run_id_a="ANL-U1", run_id_b="ANL-U2")
