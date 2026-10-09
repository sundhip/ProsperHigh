from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from backend.api.deps import get_db, get_current_user
from backend.database.models import User
from backend.services.jobs.manager import job_manager, JobStatus
from backend.services.rag.service import rag_service

router = APIRouter(prefix="/api/jobs", tags=["Background Processing"])


def _run_ingest_job():
    from backend.database.session import SessionLocal
    with SessionLocal() as db:
        count = rag_service.ingest_default_documents(db)
        return {"documents_indexed": count}


@router.post("/ingest", status_code=status.HTTP_202_ACCEPTED)
def trigger_background_ingest(current_user: User = Depends(get_current_user)):
    """Triggers asynchronous document indexing in a background worker."""
    job = job_manager.submit_job(
        job_type="DOCUMENT_INGESTION",
        fn=_run_ingest_job,
        idempotency_key="DEFAULT_INGESTION",
        max_retries=2,
        user_id=current_user.id,
    )
    return {
        "message": "Document ingestion job queued.",
        "job": job.to_dict(),
    }


@router.get("/{job_id}")
def get_job_status(job_id: str, current_user: User = Depends(get_current_user)):
    """Retrieves status and progress of a background job with user ownership verification."""
    job = job_manager.get_job(job_id, user_id=current_user.id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return job.to_dict()


@router.get("", response_model=List[Dict[str, Any]])
def list_jobs(current_user: User = Depends(get_current_user)):
    """Lists recent background jobs for the authenticated user."""
    return job_manager.list_jobs(user_id=current_user.id)
