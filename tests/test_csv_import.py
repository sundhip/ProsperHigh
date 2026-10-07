from fastapi import status
from backend.services.csv_import_service import csv_import_service
from backend.services.portfolio_service import portfolio_service
from backend.database.models import Holding


def test_csv_import_success(db_session, test_user_a):
    """Verify importing valid CSV atomically records holdings and securities."""
    port = portfolio_service.get_or_create_default_portfolio(db_session, test_user_a.id)

    csv_data = """Symbol,Quantity,Price
INFY,50,1600.50
TATAMOTORS,25,920.00
RELIANCE,10,2950.00
"""
    result = csv_import_service.import_csv_to_portfolio(
        db=db_session,
        user_id=test_user_a.id,
        portfolio_id=port.id,
        csv_content=csv_data
    )

    assert result["success"] is True
    assert result["imported_count"] == 3

    holdings = db_session.query(Holding).filter(Holding.portfolio_id == port.id).all()
    assert len(holdings) == 3
    symbols = [h.symbol for h in holdings]
    assert "INFY" in symbols
    assert "TATAMOTORS" in symbols
    assert "RELIANCE" in symbols


def test_csv_import_atomic_rollback_on_invalid_row(db_session, test_user_a):
    """Verify that if ANY row is invalid, the entire transaction rolls back and 0 holdings are created."""
    port = portfolio_service.get_or_create_default_portfolio(db_session, test_user_a.id)

    # Row 1 is valid, Row 2 has negative price
    csv_data = """Symbol,Quantity,Price
INFY,50,1600.50
TATAMOTORS,-5,-100.00
"""
    result = csv_import_service.import_csv_to_portfolio(
        db=db_session,
        user_id=test_user_a.id,
        portfolio_id=port.id,
        csv_content=csv_data
    )

    assert result["success"] is False
    assert result["imported_count"] == 0
    assert len(result["errors"]) >= 1

    # Database must have 0 holdings (atomic rollback)
    holdings = db_session.query(Holding).filter(Holding.portfolio_id == port.id).all()
    assert len(holdings) == 0


def test_csv_import_missing_headers(db_session, test_user_a):
    """Verify that missing required headers returns an immediate error."""
    port = portfolio_service.get_or_create_default_portfolio(db_session, test_user_a.id)

    csv_data = """ColA,ColB,ColC
1,2,3
"""
    result = csv_import_service.import_csv_to_portfolio(
        db=db_session,
        user_id=test_user_a.id,
        portfolio_id=port.id,
        csv_content=csv_data
    )

    assert result["success"] is False
    assert any("headers" in str(err).lower() for err in result["errors"])


def test_api_csv_import_endpoint(client, auth_headers_user_a):
    """Verify CSV import via POST /api/portfolio/import-csv endpoint."""
    csv_data = "Symbol,Quantity,Price\nHDFCBANK,40,1650.00\nTCS,15,3800.00\n"

    res = client.post(
        "/api/portfolio/import-csv",
        headers=auth_headers_user_a,
        json={"csv_content": csv_data}
    )

    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["success"] is True
    assert data["imported_count"] == 2
