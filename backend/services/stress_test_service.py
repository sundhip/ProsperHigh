from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.services.portfolio_service import portfolio_service
from backend.services.market_data.service import market_data_service


class StressTestService:
    """
    Portfolio Stress Testing Engine:
    Conducts deterministic shock simulations on live portfolios based on beta and sector exposures.
    Clearly marks outputs as hypothetical scenario simulations without forecasting certainty.
    """

    PRESET_SCENARIOS = {
        "MARKET_CORRECTION_10": {
            "name": "Broad Market Correction (-10%)",
            "market_shock_pct": -10.0,
            "sector_shocks": {},
            "description": "Standard market pull-back across major equity indices."
        },
        "MARKET_CRASH_20": {
            "name": "Severe Market Crash (-20%)",
            "market_shock_pct": -20.0,
            "sector_shocks": {},
            "description": "Macroeconomic liquidity crunch mirroring historical market panics."
        },
        "TECH_SELLOFF_15": {
            "name": "Technology Sector Shock (-15%)",
            "market_shock_pct": -5.0,
            "sector_shocks": {"Technology": -15.0, "IT": -15.0},
            "description": "Valuation compression concentrated in high-multiple tech equities."
        },
        "BANKING_LIQUIDITY_SQUEEZE": {
            "name": "Financials & Banking Squeeze (-18%)",
            "market_shock_pct": -7.0,
            "sector_shocks": {"Banking": -18.0, "Financial Services": -18.0},
            "description": "Credit contraction and rate volatility impacting financial sector balance sheets."
        }
    }

    def run_stress_test(
        self,
        db: Session,
        user_id: str,
        scenario_key: Optional[str] = None,
        custom_market_shock_pct: Optional[float] = None,
        custom_sector_shocks: Optional[Dict[str, float]] = None,
        portfolio_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes deterministic stress simulation on user portfolio.
        Holding shock is derived from holding's beta to market shock + sector specific shock.
        """
        metrics = portfolio_service.get_user_portfolio_metrics(db, user_id, portfolio_id)
        holdings = metrics.get("holdings", [])
        total_baseline = float(metrics.get("total_portfolio_value", 0.0))

        # Resolve scenario parameters
        if scenario_key and scenario_key in self.PRESET_SCENARIOS:
            preset = self.PRESET_SCENARIOS[scenario_key]
            scenario_name = preset["name"]
            market_shock = preset["market_shock_pct"]
            sector_shocks = preset["sector_shocks"]
            scenario_desc = preset["description"]
        else:
            scenario_name = "Custom Shock Scenario"
            market_shock = float(custom_market_shock_pct if custom_market_shock_pct is not None else -10.0)
            sector_shocks = custom_sector_shocks or {}
            scenario_desc = f"Custom scenario applying {market_shock}% market shock."

        holding_results: List[Dict[str, Any]] = []
        total_stressed_value = 0.0

        for h in holdings:
            sym = h["symbol"]
            curr_val = float(h["current_value"])
            sec = h.get("sector") or "General"

            # Retrieve beta
            q = market_data_service.get_quote(sym)
            beta = 1.0  # default market beta
            if q and hasattr(q, "beta") and q.beta:
                beta = float(q.beta)

            # Combined holding shock: (market_shock * beta) + sector_shock
            sec_shock = float(sector_shocks.get(sec, 0.0))
            asset_shock_pct = (market_shock * beta) + sec_shock
            # Bound asset shock to max -90% loss
            asset_shock_pct = max(-90.0, min(100.0, asset_shock_pct))

            stressed_val = round(max(0.0, curr_val * (1.0 + (asset_shock_pct / 100.0))), 2)
            dollar_loss = round(stressed_val - curr_val, 2)
            loss_pct = round((dollar_loss / max(0.01, curr_val)) * 100.0, 2)

            total_stressed_value += stressed_val

            holding_results.append({
                "symbol": sym,
                "name": h.get("name"),
                "sector": sec,
                "beta": beta,
                "baseline_value": curr_val,
                "stressed_value": stressed_val,
                "impact_dollar": dollar_loss,
                "impact_pct": loss_pct
            })

        total_loss = round(total_stressed_value - total_baseline, 2)
        total_loss_pct = round((total_loss / max(0.01, total_baseline)) * 100.0, 2) if total_baseline > 0 else 0.0

        return {
            "scenario_name": scenario_name,
            "scenario_description": scenario_desc,
            "scenario_type": "DETERMINISTIC_SHOCK_SIMULATION",
            "parameters": {
                "market_shock_pct": market_shock,
                "sector_shocks": sector_shocks
            },
            "summary": {
                "baseline_value": total_baseline,
                "stressed_value": round(total_stressed_value, 2),
                "estimated_pnl": total_loss,
                "estimated_pnl_pct": total_loss_pct,
                "holdings_tested": len(holdings)
            },
            "holding_impacts": holding_results,
            "assumptions": [
                f"Market shock of {market_shock}% propagates to assets via beta sensitivity.",
                "Sector shocks apply additively to companies within targeted industry classifications.",
                "Asset liquidity remains constant during the stress event."
            ],
            "limitations": (
                "Stress test results represent conditional simulation scenarios, not predictions or maximum potential losses. "
                "Correlations may diverge in real market crises."
            )
        }


stress_test_service = StressTestService()
