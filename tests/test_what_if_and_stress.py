import pytest
from sqlalchemy.orm import Session

from backend.database.models import User, Portfolio, Holding, Transaction
from backend.services.portfolio_service import portfolio_service
from backend.services.what_if_service import what_if_service
from backend.services.stress_test_service import stress_test_service


def test_what_if_simulation_never_mutates_database(db_session: Session):
    """Verify What-If simulation calculates new allocations while live holdings and transactions remain untouched."""
    user = User(name="WhatIf User", email="whatif@test.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    port = portfolio_service.get_or_create_default_portfolio(db_session, user.id)
    h = Holding(portfolio_id=port.id, user_id=user.id, symbol="TATA", quantity=10, average_price=500.0, sector="Automobile")
    db_session.add(h)
    db_session.commit()

    init_holdings_count = db_session.query(Holding).filter(Holding.user_id == user.id).count()
    init_txns_count = db_session.query(Transaction).filter(Transaction.user_id == user.id).count()

    actions = [
        {"action": "ADD", "symbol": "INFY", "quantity": 20, "price": 1000.0},
        {"action": "ADD", "symbol": "TATA", "quantity": 10, "price": 600.0}
    ]

    res = what_if_service.simulate_what_if(db_session, user.id, actions, port.id)

    # Check simulated values
    assert res["simulated"]["holdings_count"] == 2
    assert res["simulated"]["total_portfolio_value"] > res["baseline"]["total_portfolio_value"]
    assert res["delta"]["holdings_change"] == 1

    # Verify zero database mutations occurred!
    assert db_session.query(Holding).filter(Holding.user_id == user.id).count() == init_holdings_count
    assert db_session.query(Transaction).filter(Transaction.user_id == user.id).count() == init_txns_count


def test_stress_testing_deterministic_shocks(db_session: Session):
    """Verify stress test applies beta and sector shocks accurately without forecasting claims."""
    user = User(name="Stress User", email="stress@test.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    port = portfolio_service.get_or_create_default_portfolio(db_session, user.id)
    h = Holding(portfolio_id=port.id, user_id=user.id, symbol="TECH1", quantity=10, average_price=1000.0, sector="Technology")
    db_session.add(h)
    db_session.commit()

    res = stress_test_service.run_stress_test(
        db=db_session,
        user_id=user.id,
        scenario_key="TECH_SELLOFF_15",
        portfolio_id=port.id
    )

    assert "Technology Sector Shock" in res["scenario_name"]
    assert res["summary"]["baseline_value"] == 10000.0
    assert res["summary"]["stressed_value"] < 10000.0
    assert res["summary"]["estimated_pnl"] < 0
    assert len(res["holding_impacts"]) == 1
    assert "Technology" in res["holding_impacts"][0]["sector"]


def test_saved_scenarios_persistence_and_isolation(db_session: Session):
    """Verify saved scenario lifecycle and strict user ownership isolation."""
    user1 = User(name="User 1", email="u1_scen@test.com", password_hash="hash")
    user2 = User(name="User 2", email="u2_scen@test.com", password_hash="hash")
    db_session.add_all([user1, user2])
    db_session.commit()

    saved = what_if_service.save_scenario(
        db=db_session,
        user_id=user1.id,
        name="Growth Tech Push",
        scenario_type="what_if",
        parameters={"actions": [{"action": "ADD", "symbol": "INFY", "quantity": 10}]},
        results={"simulated_val": 50000.0}
    )

    scen_id = saved["id"]

    # User 1 can list
    u1_list = what_if_service.list_scenarios(db_session, user1.id)
    assert len(u1_list) == 1
    assert u1_list[0]["id"] == scen_id

    # User 2 list is empty (strict tenant isolation)
    u2_list = what_if_service.list_scenarios(db_session, user2.id)
    assert len(u2_list) == 0

    # User 2 cannot delete User 1's scenario
    with pytest.raises(Exception):
        what_if_service.delete_scenario(db_session, user2.id, scen_id)

    # User 1 deletes successfully
    assert what_if_service.delete_scenario(db_session, user1.id, scen_id) is True
