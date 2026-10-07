import json
import os
from typing import Dict, Any, Optional, List
from backend.database.session import SessionLocal
from backend.database.models import User, InvestorProfile, Holding

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")


class DataService:
    def __init__(self):
        self.market_data = self._load_json("market", "market_data.json")
        self.fundamentals_data = self._load_json("fundamentals", "fundamentals.json")
        self.news_data = self._load_json("news", "news_sentiment.json")
        self.documents_data = self._load_json("documents", "company_filings.json")
        self.users_data = self._load_json("users", "users_data.json")

    def _load_json(self, category: str, filename: str) -> Dict[str, Any]:
        filepath = os.path.join(DATA_DIR, category, filename)
        if not os.path.exists(filepath):
            return {}
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            return {}

    def normalize_symbol(self, symbol: str) -> str:
        """Translates variations like 'RELIANCE.NS', 'reliance', 'Reliance Industries' -> 'RELIANCE'"""
        clean = symbol.strip().upper().replace(".NS", "").replace(".BO", "")
        symbol_map = {
            "RELIANCE": "RELIANCE",
            "RELIANCE INDUSTRIES": "RELIANCE",
            "TCS": "TCS",
            "TATA CONSULTANCY SERVICES": "TCS",
            "INFY": "INFY",
            "INFOSYS": "INFY",
            "HDFCBANK": "HDFCBANK",
            "HDFC BANK": "HDFCBANK",
            "ICICIBANK": "ICICIBANK",
            "ICICI BANK": "ICICIBANK",
            "SBIN": "SBIN",
            "STATE BANK OF INDIA": "SBIN",
            "ITC": "ITC",
            "BHARTIARTL": "BHARTIARTL",
            "AIRTEL": "BHARTIARTL",
            "SUNPHARMA": "SUNPHARMA",
            "TATAMOTORS": "TATAMOTORS",
            "TATA MOTORS": "TATAMOTORS"
        }
        return symbol_map.get(clean, clean)

    def get_market_macro(self) -> Dict[str, Any]:
        return self.market_data.get("macro", {})

    def get_stock_market_data(self, symbol: str) -> Optional[Dict[str, Any]]:
        canon = self.normalize_symbol(symbol)
        from backend.services.market_data.service import market_data_service
        q = market_data_service.get_quote(canon)
        if q:
            return {
                "symbol": q.symbol,
                "name": q.name,
                "sector": q.sector,
                "current_price": q.price,
                "price": q.price,
                "previous_close": q.previous_close,
                "change_pct": q.change_pct,
                "exchange": q.exchange,
                "is_stale": q.is_stale
            }
        return self.market_data.get("stocks", {}).get(canon)

    def get_stock_fundamentals(self, symbol: str) -> Optional[Dict[str, Any]]:
        canon = self.normalize_symbol(symbol)
        return self.fundamentals_data.get(canon)

    def get_stock_news(self, symbol: str) -> Optional[Dict[str, Any]]:
        canon = self.normalize_symbol(symbol)
        return self.news_data.get(canon)

    def get_company_documents(self, symbol: str) -> list:
        canon = self.normalize_symbol(symbol)
        all_docs = self.documents_data.get("documents", [])
        return [doc for doc in all_docs if doc.get("company") == canon]

    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Fetch user profile and portfolio from database as single source of truth."""
        try:
            with SessionLocal() as db:
                db_user = db.query(User).filter(User.id == user_id).first()
                if db_user:
                    prof = db_user.investor_profile
                    holdings_rows = db_user.holdings
                    
                    holdings_list = []
                    total_val = 0.0
                    sector_val: Dict[str, float] = {}
                    
                    for h in holdings_rows:
                        q = self.get_stock_market_data(h.symbol) or {}
                        cp = float(q.get("current_price", h.average_price))
                        val = h.quantity * cp
                        total_val += val
                        sec = h.sector or "General"
                        sector_val[sec] = sector_val.get(sec, 0.0) + val
                        holdings_list.append({
                            "symbol": h.symbol,
                            "name": h.name or h.symbol,
                            "sector": sec,
                            "quantity": h.quantity,
                            "average_price": h.average_price,
                            "current_value": val,
                            "portfolio_weight_pct": 0.0
                        })
                        
                    sector_exposure = {}
                    if total_val > 0:
                        for item in holdings_list:
                            item["portfolio_weight_pct"] = round((item["current_value"] / total_val) * 100, 2)
                        for sec, val in sector_val.items():
                            sector_exposure[sec] = round((val / total_val) * 100, 2)

                    return {
                        "user_id": db_user.id,
                        "name": db_user.name,
                        "email": db_user.email,
                        "risk_profile": prof.risk_category if prof else "Balanced Growth",
                        "investment_horizon": prof.investment_horizon if prof else "3–5 Years",
                        "investment_goal": prof.primary_goal_top if prof else "Wealth Growth",
                        "total_portfolio_value": round(total_val, 2),
                        "holdings": holdings_list,
                        "sector_exposure": sector_exposure
                    }
        except Exception:
            pass

        # Check explicit static seed data by ID without silent fallback to U001
        users_dict = self.users_data.get("users", {})
        if user_id in users_dict:
            return users_dict[user_id]

        # Return empty default profile for unknown user
        return {
            "user_id": user_id,
            "name": "Investor",
            "risk_profile": "Balanced Growth",
            "investment_horizon": "3–5 Years",
            "investment_goal": "Wealth Growth",
            "total_portfolio_value": 0.0,
            "holdings": [],
            "sector_exposure": {}
        }

    def get_all_stocks(self) -> list:
        stocks_dict = self.market_data.get("stocks", {})
        res = []
        for sym, data in stocks_dict.items():
            res.append({
                "symbol": sym,
                "name": data.get("name"),
                "sector": data.get("sector"),
                "price": data.get("current_price"),
                "change_pct": round(((data.get("current_price", 0) - data.get("previous_close", 0)) / max(1, data.get("previous_close", 1))) * 100, 2)
            })
        return res


data_service = DataService()
