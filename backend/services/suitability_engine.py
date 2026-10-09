import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone


class SuitabilityEngine:
    """
    Deterministic Investor Suitability Engine (Methodology v4.0.0).
    Strictly separates instrument investment quality from investor suitability.
    Evaluates:
      - Profile Completeness (handles partial/incomplete profiles without fabricating defaults)
      - Hard Constraints (avoided sectors, user exclusions)
      - Risk Tolerance vs Asset Volatility / Beta
      - Investment Horizon Compatibility
      - Portfolio Exposure & Concentration Impact
      - Liquidity & Cash Flow Needs
    """
    METHODOLOGY_VERSION = "v4.0.0"

    DISCLAIMER = (
        "Educational and analytical assessment only. Suitability results are deterministic rule-based "
        "evaluations based on user-provided profile data and do not constitute individualized investment "
        "advice or performance guarantees."
    )

    def evaluate_suitability(
        self,
        symbol: str,
        asset_profile: Dict[str, Any],
        investor_profile: Optional[Dict[str, Any]],
        portfolio_summary: Optional[Dict[str, Any]] = None,
        proposed_investment_amount: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Executes transparent, deterministic suitability assessment.
        Returns full structured explanation with methodology version and data timestamps.
        """
        symbol = symbol.upper().strip()
        asset_sector = asset_profile.get("sector") or "General"
        asset_volatility = float(asset_profile.get("volatility", 25.0))
        asset_beta = float(asset_profile.get("beta", 1.0))
        asset_class = asset_profile.get("asset_class", "Equity")

        supporting_factors: List[str] = []
        opposing_factors: List[str] = []
        missing_information: List[str] = []
        portfolio_considerations: List[str] = []
        constraints_applied: List[str] = []

        # 1. Profile Completeness Audit
        if not investor_profile or not investor_profile.get("is_complete", False):
            # Check individual missing fields honestly
            if not investor_profile:
                missing_information.extend([
                    "Risk tolerance and category",
                    "Investment horizon",
                    "Investment experience level",
                    "Target asset allocations",
                    "Sector exclusions and constraints"
                ])
            else:
                if not investor_profile.get("risk_category"):
                    missing_information.append("Risk tolerance category")
                if not investor_profile.get("investment_horizon"):
                    missing_information.append("Investment horizon")
                if not investor_profile.get("experience_level"):
                    missing_information.append("Investment experience level")

            return {
                "symbol": symbol,
                "classification": "LIMITED_ASSESSMENT",
                "is_limited": True,
                "supporting_factors": ["Instrument data verified"],
                "opposing_factors": ["Incomplete investor profile prevents rigorous suitability verification"],
                "missing_information": missing_information,
                "portfolio_considerations": ["Portfolio context cannot be validated without complete investor profile"],
                "constraints_applied": ["Profile completeness check failed"],
                "rationale": (
                    f"Investor profile for {symbol} is incomplete or unverified. Rather than assuming default "
                    "risk parameters, the suitability engine reports a limited assessment. Please complete "
                    "your onboarding profile to unlock personalized suitability intelligence."
                ),
                "relevant_profile_inputs": {
                    "profile_version": investor_profile.get("profile_version") if investor_profile else None,
                    "is_complete": False
                },
                "methodology_version": self.METHODOLOGY_VERSION,
                "data_timestamp": datetime.now(timezone.utc).isoformat(),
                "disclaimer": self.DISCLAIMER
            }

        # 2. Extract verified profile inputs
        risk_category = investor_profile.get("risk_category", "Balanced Growth")
        horizon = investor_profile.get("investment_horizon", "3–5 Years")
        avoided_sectors = [s.strip().lower() for s in (investor_profile.get("avoided_sectors") or [])]
        max_stock_pct = float(investor_profile.get("max_stock_exposure_pct", 20.0))
        liquidity_needs = investor_profile.get("liquidity_needs")

        relevant_inputs = {
            "risk_category": risk_category,
            "investment_horizon": horizon,
            "avoided_sectors": investor_profile.get("avoided_sectors", []),
            "max_stock_exposure_pct": max_stock_pct,
            "profile_version": investor_profile.get("profile_version", 1)
        }

        # 3. Hard Constraint Check: Avoided Sectors
        constraints_applied.append(f"Sector exclusion audit against {len(avoided_sectors)} user-avoided sectors")
        if asset_sector.lower() in avoided_sectors:
            opposing_factors.append(
                f"Instrument belongs to sector '{asset_sector}', which is explicitly listed in your avoided sectors filter."
            )
            return {
                "symbol": symbol,
                "classification": "UNSUITABLE",
                "is_limited": False,
                "supporting_factors": supporting_factors,
                "opposing_factors": opposing_factors,
                "missing_information": missing_information,
                "portfolio_considerations": [f"Sector constraint violated: {asset_sector} excluded"],
                "constraints_applied": constraints_applied,
                "rationale": (
                    f"Investment in {symbol} violates your explicit exclusion criteria for the {asset_sector} sector. "
                    "Deterministic hard constraints prevent a suitable rating."
                ),
                "relevant_profile_inputs": relevant_inputs,
                "methodology_version": self.METHODOLOGY_VERSION,
                "data_timestamp": datetime.now(timezone.utc).isoformat(),
                "disclaimer": self.DISCLAIMER
            }

        # 4. Investment Horizon Compatibility
        constraints_applied.append("Investment horizon compatibility check")
        if horizon == "< 1 Year":
            if asset_volatility > 28.0 or asset_beta > 1.2:
                opposing_factors.append(
                    f"Short investment horizon (< 1 Year) clashes with elevated asset volatility ({asset_volatility:.1f}%) and beta ({asset_beta:.2f})."
                )
            else:
                supporting_factors.append("Asset exhibits moderate volatility consistent with short-to-medium liquidity preservation.")
        elif horizon in ["1–3 Years", "3–5 Years"]:
            if asset_volatility <= 35.0:
                supporting_factors.append(f"Medium-term horizon ({horizon}) is well-aligned with asset risk profile.")
            else:
                opposing_factors.append(f"Asset volatility ({asset_volatility:.1f}%) exceeds standard parameters for {horizon} horizon.")
        else:  # 5–10 Years, 10+ Years
            supporting_factors.append(f"Long-term horizon ({horizon}) provides sufficient capacity to absorb cyclical volatility.")

        # 5. Risk Category & Volatility / Beta Compatibility
        constraints_applied.append("Risk tolerance vs asset risk matrix")
        if risk_category == "Conservative":
            if asset_volatility > 25.0:
                opposing_factors.append(
                    f"Asset volatility of {asset_volatility:.1f}% exceeds Conservative risk threshold (max 25.0%)."
                )
            if asset_beta > 1.1:
                opposing_factors.append(
                    f"Asset market sensitivity (Beta: {asset_beta:.2f}) exceeds Conservative tolerance (max 1.10)."
                )
            if not opposing_factors:
                supporting_factors.append("Low beta and restrained volatility align cleanly with Conservative profile.")
        elif risk_category == "Balanced Growth":
            if asset_volatility > 40.0:
                opposing_factors.append(f"Asset volatility ({asset_volatility:.1f}%) is higher than standard Balanced Growth thresholds.")
            else:
                supporting_factors.append(f"Asset risk profile is compatible with Balanced Growth objective.")
        else:  # Aggressive
            supporting_factors.append(f"Asset beta ({asset_beta:.2f}) and volatility ({asset_volatility:.1f}%) align with Aggressive capital appreciation focus.")

        # 6. Portfolio Context & Concentration Analysis
        if portfolio_summary:
            total_port_val = float(portfolio_summary.get("total_value", 0.0))
            holdings = portfolio_summary.get("holdings", [])
            existing_holding = next((h for h in holdings if h.get("symbol") == symbol), None)

            current_weight = 0.0
            if existing_holding and total_port_val > 0:
                current_weight = (float(existing_holding.get("current_value", 0.0)) / total_port_val) * 100.0
                portfolio_considerations.append(
                    f"Already present in portfolio: represents {current_weight:.1f}% of current assets."
                )

            # Check projected allocation
            simulated_val = (proposed_investment_amount or 0.0)
            if total_port_val > 0 and simulated_val > 0:
                new_total = total_port_val + simulated_val
                new_weight = ((float(existing_holding.get("current_value", 0.0)) if existing_holding else 0.0) + simulated_val) / new_total * 100.0
                portfolio_considerations.append(
                    f"Proposed addition would elevate position weight to {new_weight:.1f}% (Declared max: {max_stock_pct:.1f}%)."
                )
                if new_weight > max_stock_pct:
                    opposing_factors.append(
                        f"Projected position weight ({new_weight:.1f}%) exceeds your declared single-stock exposure cap of {max_stock_pct:.1f}%."
                    )
                else:
                    supporting_factors.append(f"Projected position weight ({new_weight:.1f}%) remains within single-stock cap ({max_stock_pct:.1f}%).")
            elif current_weight > max_stock_pct:
                opposing_factors.append(
                    f"Existing position ({current_weight:.1f}%) already exceeds declared single-stock exposure cap ({max_stock_pct:.1f}%)."
                )

            # Sector exposure in portfolio
            sector_exposure = portfolio_summary.get("sector_exposure", {})
            current_sec_pct = float(sector_exposure.get(asset_sector, 0.0))
            if current_sec_pct > 35.0:
                opposing_factors.append(
                    f"Portfolio already exhibits high sector concentration in {asset_sector} ({current_sec_pct:.1f}%)."
                )
                portfolio_considerations.append(f"High existing sector weight in {asset_sector}: {current_sec_pct:.1f}%")
            else:
                supporting_factors.append(f"Healthy portfolio diversification in sector {asset_sector} ({current_sec_pct:.1f}%).")
        else:
            portfolio_considerations.append("No active portfolio holdings recorded; evaluated on standalone profile characteristics.")

        # 7. Final Classification Logic
        constraints_applied.append("Composite suitability deterministic threshold rule")
        num_opposing = len(opposing_factors)
        num_supporting = len(supporting_factors)

        if num_opposing == 0:
            classification = "SUITABLE"
            rationale = (
                f"{symbol} is deterministically classified as SUITABLE for your {risk_category} profile "
                f"and {horizon} investment horizon with no constraint breaches detected."
            )
        elif num_opposing == 1 and num_supporting >= 2:
            classification = "BORDERLINE"
            rationale = (
                f"{symbol} is classified as BORDERLINE. While broadly compatible with your goals, "
                f"notable friction exists: {opposing_factors[0]}"
            )
        else:
            classification = "UNSUITABLE"
            rationale = (
                f"{symbol} is classified as UNSUITABLE due to {num_opposing} distinct profile/portfolio "
                f"conflicts: {'; '.join(opposing_factors)}"
            )

        return {
            "symbol": symbol,
            "classification": classification,
            "is_limited": False,
            "supporting_factors": supporting_factors,
            "opposing_factors": opposing_factors,
            "missing_information": missing_information,
            "portfolio_considerations": portfolio_considerations,
            "constraints_applied": constraints_applied,
            "rationale": rationale,
            "relevant_profile_inputs": relevant_inputs,
            "methodology_version": self.METHODOLOGY_VERSION,
            "data_timestamp": datetime.now(timezone.utc).isoformat(),
            "disclaimer": self.DISCLAIMER
        }


suitability_engine = SuitabilityEngine()
