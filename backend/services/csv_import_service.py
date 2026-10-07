import csv
import io
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.database.models import Portfolio
from backend.services.transaction_service import transaction_service
from backend.services.data_service import data_service


class CSVImportService:
    """
    Transactional CSV Portfolio Import Service.
    Guarantees that malformed CSV data never leaves corrupted partial state.
    """

    REQUIRED_FIELD_ALIASES = {
        "symbol": ["symbol", "ticker", "stock", "instrument", "name"],
        "quantity": ["quantity", "qty", "shares", "units", "count"],
        "price": ["price", "cost", "avg_price", "average_price", "rate", "cost_basis"]
    }

    def parse_and_validate_csv(self, csv_content: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Parses CSV string and validates every row before any database operation.
        Returns (valid_rows, error_list).
        """
        f = io.StringIO(csv_content.strip())
        reader = csv.reader(f)

        try:
            raw_headers = next(reader)
        except StopIteration:
            return [], [{"row": 0, "error": "CSV file is empty."}]

        headers = [h.strip().lower() for h in raw_headers]
        
        # Resolve column indices
        col_map = {}
        for canonical, aliases in self.REQUIRED_FIELD_ALIASES.items():
            for idx, h in enumerate(headers):
                if any(alias in h for alias in aliases):
                    col_map[canonical] = idx
                    break

        missing = [req for req in ["symbol", "quantity", "price"] if req not in col_map]
        if missing:
            return [], [{
                "row": 1,
                "error": f"Missing required CSV column(s): {', '.join(missing)}. Recognized headers include Symbol, Quantity, Price."
            }]

        sym_idx = col_map["symbol"]
        qty_idx = col_map["quantity"]
        pr_idx = col_map["price"]

        valid_rows = []
        errors = []

        for row_num, cols in enumerate(reader, start=2):
            if not cols or all(not c.strip() for c in cols):
                continue  # skip blank lines

            if len(cols) <= max(sym_idx, qty_idx, pr_idx):
                errors.append({
                    "row": row_num,
                    "error": f"Row has insufficient columns (expected at least {max(sym_idx, qty_idx, pr_idx) + 1})."
                })
                continue

            raw_sym = cols[sym_idx].strip().replace('"', '').replace("'", "")
            raw_qty = cols[qty_idx].strip().replace('"', '').replace("'", "")
            raw_price = cols[pr_idx].strip().replace('"', '').replace("'", "")

            if not raw_sym:
                errors.append({"row": row_num, "field": "symbol", "error": "Symbol cannot be empty."})
                continue

            try:
                qty = float(raw_qty)
                if qty <= 0:
                    errors.append({"row": row_num, "field": "quantity", "error": f"Quantity must be positive (got {raw_qty})."})
                    continue
            except ValueError:
                errors.append({"row": row_num, "field": "quantity", "error": f"Invalid numeric quantity: '{raw_qty}'."})
                continue

            try:
                price = float(raw_price)
                if price < 0:
                    errors.append({"row": row_num, "field": "price", "error": f"Price cannot be negative (got {raw_price})."})
                    continue
            except ValueError:
                errors.append({"row": row_num, "field": "price", "error": f"Invalid numeric price: '{raw_price}'."})
                continue

            valid_rows.append({
                "row": row_num,
                "symbol": data_service.normalize_symbol(raw_sym),
                "quantity": qty,
                "price": price
            })

        return valid_rows, errors

    def import_csv_to_portfolio(
        self,
        db: Session,
        user_id: str,
        portfolio_id: str,
        csv_content: str
    ) -> Dict[str, Any]:
        """
        Atomically import CSV holdings.
        If validation errors exist, rolls back immediately with zero partial corruption.
        """
        valid_rows, errors = self.parse_and_validate_csv(csv_content)

        if errors:
            return {
                "success": False,
                "total_rows_processed": len(valid_rows) + len(errors),
                "imported_count": 0,
                "errors": errors
            }

        if not valid_rows:
            return {
                "success": False,
                "total_rows_processed": 0,
                "imported_count": 0,
                "errors": [{"row": 0, "error": "No valid data rows found in CSV."}]
            }

        # Verify portfolio exists and belongs to user
        port = db.query(Portfolio).filter(Portfolio.id == portfolio_id, Portfolio.user_id == user_id).first()
        if not port:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found or unauthorized.")

        # Atomic execution of all import rows
        try:
            with db.begin_nested():
                for item in valid_rows:
                    transaction_service.record_transaction(
                        db=db,
                        user_id=user_id,
                        portfolio_id=portfolio_id,
                        symbol=item["symbol"],
                        transaction_type="BUY",
                        quantity=item["quantity"],
                        price=item["price"],
                        fees=0.0,
                        notes=f"CSV Import from row {item['row']}",
                        commit=False
                    )
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Transactional import failed: {str(e)}"
            )

        return {
            "success": True,
            "total_rows_processed": len(valid_rows),
            "imported_count": len(valid_rows),
            "errors": []
        }


csv_import_service = CSVImportService()
