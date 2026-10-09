from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.api.deps import get_db, get_current_user
from backend.database.models import User, UserAlert
from backend.schemas.alerts import AlertCreateRequest, AlertResponse, AlertsListResponse

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("", response_model=AlertsListResponse)
def get_user_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve active and triggered alerts for the authenticated user."""
    alerts = db.query(UserAlert).filter(UserAlert.user_id == current_user.id).order_by(UserAlert.created_at.desc()).all()
    
    resp_alerts = [
        AlertResponse(
            id=a.id,
            symbol=a.symbol,
            alert_type=a.alert_type,
            condition_type=a.condition_type,
            threshold_value=a.threshold_value,
            status=a.status,
            message=a.message,
            triggered_at=a.triggered_at.isoformat() if a.triggered_at else None,
            created_at=a.created_at.isoformat() if a.created_at else ""
        )
        for a in alerts
    ]
    active_count = sum(1 for a in alerts if a.status == "ACTIVE")
    triggered_count = sum(1 for a in alerts if a.status == "TRIGGERED")
    return AlertsListResponse(alerts=resp_alerts, active_count=active_count, triggered_count=triggered_count)


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(
    payload: AlertCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new alert rule for the authenticated user."""
    sym = payload.symbol.strip().upper()
    alert = UserAlert(
        user_id=current_user.id,
        symbol=sym,
        alert_type=payload.alert_type,
        condition_type=payload.condition_type,
        threshold_value=payload.threshold_value,
        status="ACTIVE",
        message=payload.message or f"Alert configured for {sym} ({payload.condition_type} {payload.threshold_value or ''})",
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return AlertResponse(
        id=alert.id,
        symbol=alert.symbol,
        alert_type=alert.alert_type,
        condition_type=alert.condition_type,
        threshold_value=alert.threshold_value,
        status=alert.status,
        message=alert.message,
        triggered_at=None,
        created_at=alert.created_at.isoformat() if alert.created_at else ""
    )


@router.post("/{alert_id}/dismiss", response_model=AlertResponse)
def dismiss_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a triggered alert as dismissed."""
    alert = db.query(UserAlert).filter(
        UserAlert.id == alert_id,
        UserAlert.user_id == current_user.id
    ).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert rule not found.")
    
    alert.status = "DISMISSED"
    db.commit()
    db.refresh(alert)
    return AlertResponse(
        id=alert.id,
        symbol=alert.symbol,
        alert_type=alert.alert_type,
        condition_type=alert.condition_type,
        threshold_value=alert.threshold_value,
        status=alert.status,
        message=alert.message,
        triggered_at=alert.triggered_at.isoformat() if alert.triggered_at else None,
        created_at=alert.created_at.isoformat() if alert.created_at else ""
    )


@router.delete("/{alert_id}", status_code=status.HTTP_200_OK)
def delete_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently delete an alert rule."""
    alert = db.query(UserAlert).filter(
        UserAlert.id == alert_id,
        UserAlert.user_id == current_user.id
    ).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert rule not found.")
    
    db.delete(alert)
    db.commit()
    return {"message": f"Alert '{alert_id}' deleted successfully.", "id": alert_id}
