import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.database.models import SavedScenario, Portfolio
from backend.services.portfolio_service import portfolio_service
from backend.services.market_data.service import market_data_service


class WhatIfService:
    """
    What-If Portfolio Simulator:
    Allows investors to model hypothetical portfolio additions, reductions, and liquidations.
    Executes strictly in-memory with ACID isolation, guaranteeing zero writes to live holdings or transactions.
    """

    def simulate_what_if(
        self,
        db: Session,
        user_id: str,
        actions: List[Dict[str, Any]],
        portfolio_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Simulates hypothetical trade actions on current portfolio snapshot.
        actions: list of {"action": "ADD"|"TRIM"|"SELL", "symbol": str, "quantity": float, "price": Optional[float]}
        """
        baseline_metrics = portfolio_service.get_user_portfolio_metrics(db, user_id, portfolio_id)
        baseline_holdings = {h["symbol"]: dict(h) for h in baseline_metrics.get("holdings", [])}

        simulated_holdings = dict(baseline_holdings)

        for act in actions:
            action_type = act.get("action", "ADD").upper()
            sym = act.get("symbol", "").strip().upper()
            qty = abs(float(act.get("quantity", 0.0)))
            custom_price = act.get("price")

            if not sym or qty <= 0:
                continue

            # Determine price
            if custom_price and float(custom_price) > 0:
                sim_price = float(custom_price)
            else:
                q = market_data_service.get_quote(sym)
                sim_price = float(q.price) if q else 1000.0

            q_quote = market_data_service.get_quote(sym)
            sec_sector = q_quote.sector if (q_quote and q_quote.sector) else "General"
            sec_name = q_quote.name if (q_quote and q_quote.name) else sym

            if action_type == "ADD":
                if sym in simulated_holdings:
                    existing = simulated_holdings[sym]
                    old_qty = existing["quantity"]
                    old_cost = existing["invested_amount"]
                    new_qty = old_qty + qty
                    new_invested = old_cost + (qty * sim_price)
                    new_avg = new_invested / new_qty
                    existing["quantity"] = new_qty
                    existing["average_price"] = round(new_avg, 2)
                    existing["invested_amount"] = round(new_invested, 2)
                    existing["current_price"] = sim_price
                    existing["current_value"] = round(new_qty * sim_price, 2)
                else:
                    simulated_holdings[sym] = {
                        "symbol": sym,
                        "name": sec_name,
                        "sector": sec_sector,
                        "quantity": qty,
                        "average_price": sim_price,
                        "current_price": sim_price,
                        "current_value": round(qty * sim_price, 2),
                        "invested_amount": round(qty * sim_price, 2),
                        "gain_loss": 0.0,
                        "gain_loss_pct": 0.0,
                        "portfolio_weight_pct": 0.0
                    }
            elif action_type in ["TRIM", "SELL"]:
                if sym in simulated_holdings:
                    existing = simulated_holdings[sym]
                    old_qty = existing["quantity"]
                    if action_type == "SELL" or qty >= old_qty:
                        del simulated_holdings[sym]
                    else:
                        new_qty = old_qty - qty
                        existing["quantity"] = new_qty
                        existing["current_value"] = round(new_qty * existing["current_price"], 2)
                        existing["invested_amount"] = round(new_qty * existing["average_price"], 2)

        # Recalculate totals and weights
        sim_total_val = round(sum(h["current_value"] for h in simulated_holdings.values()), 2)
        sim_total_cost = round(sum(h["invested_amount"] for h in simulated_holdings.values()), 2)
        sim_sector_values: Dict[str, float] = {}

        for h in simulated_holdings.values():
            w = round((h["current_value"] / max(0.01, sim_total_val)) * 100.0, 2) if sim_total_val > 0 else 0.0
            h["portfolio_weight_pct"] = w
            sec = h.get("sector") or "General"
            sim_sector_values[sec] = sim_sector_values.get(sec, 0.0) + h["current_value"]

        sim_sector_exposure = {
            sec: round((val / max(0.01, sim_total_val)) * 100.0, 2)
            for sec, val in sim_sector_values.items()
        } if sim_total_val > 0 else {}

        # Concentration metrics
        sim_hhi = round(sum((h["portfolio_weight_pct"]) ** 2 for h in simulated_holdings.values()), 2)
        sorted_sim = sorted(sim_holdings_list := list(simulated_holdings.values()), key=lambda x: x["portfolio_weight_pct"], reverse=True)
        top3_weight = round(sum(h["portfolio_weight_pct"] for h in sorted_sim[:3]), 2)

        return {
            "baseline": {
                "total_portfolio_value": baseline_metrics.get("total_portfolio_value"),
                "total_invested_amount": baseline_metrics.get("total_invested_amount"),
                "holdings_count": len(baseline_holdings),
                "sector_exposure": baseline_metrics.get("sector_exposure"),
                "health_score": baseline_metrics.get("health_score")
            },
            "simulated": {
                "total_portfolio_value": sim_total_val,
                "total_invested_amount": sim_total_cost,
                "holdings_count": len(sim_holdings_list),
                "holdings": sim_holdings_list,
                "sector_exposure": sim_sector_exposure,
                "top3_concentration_pct": top3_weight,
                "hhi_index": sim_hhi
            },
            "delta": {
                "value_change": round(sim_total_val - float(baseline_metrics.get("total_portfolio_value", 0.0)), 2),
                "holdings_change": len(sim_holdings_list) - len(baseline_holdings)
            },
            "disclaimer": "Hypothetical what-if simulation performed in memory. Real portfolio holdings and transactions remain unchanged."
        }

    def save_scenario(
        self,
        db: Session,
        user_id: str,
        name: str,
        scenario_type: str,
        parameters: Dict[str, Any],
        results: Dict[str, Any],
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Persists a saved simulation scenario for authenticated user."""
        scn_id = f"SCN-{uuid.uuid4().hex[:10].upper()}"
        record = SavedScenario(
            id=scn_id,
            user_id=user_id,
            name=name,
            scenario_type=scenario_type,
            description=description,
            parameters_json=parameters,
            results_json=results
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return {
            "id": record.id,
            "name": record.name,
            "scenario_type": record.scenario_type,
            "parameters": record.parameters_json,
            "results": record.results_json,
            "created_at": record.created_at.isoformat()
        }

    def list_scenarios(
        self,
        db: Session,
        user_id: str,
        scenario_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Lists user's saved scenarios with tenant isolation."""
        query = db.query(SavedScenario).filter(SavedScenario.user_id == user_id)
        if scenario_type:
            query = query.filter(SavedScenario.scenario_type == scenario_type)
        rows = query.order_by(SavedScenario.created_at.desc()).all()
        return [
            {
                "id": r.id,
                "name": r.name,
                "scenario_type": r.scenario_type,
                "description": r.description,
                "parameters": r.parameters_json,
                "results": r.results_json,
                "created_at": r.created_at.isoformat()
            }
            for r in rows
        ]

    def delete_scenario(self, db: Session, user_id: str, scenario_id: str) -> bool:
        """Deletes a saved scenario enforcing user ownership."""
        rec = db.query(SavedScenario).filter(SavedScenario.id == scenario_id, SavedScenario.user_id == user_id).first()
        if not rec:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found or access denied.")
        db.delete(rec)
        db.commit()
        return True


what_if_service = WhatIfService()
