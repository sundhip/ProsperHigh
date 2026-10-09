import asyncio
import time
import uuid
import threading
from enum import Enum
from typing import Dict, Any, Optional, Callable, List
from datetime import datetime, timezone
from backend.core.logging import logger


class JobStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class Job:
    def __init__(
        self,
        job_id: str,
        job_type: str,
        fn: Callable,
        args: tuple = (),
        kwargs: dict = None,
        max_retries: int = 2,
        idempotency_key: Optional[str] = None,
        user_id: Optional[str] = None,
    ):
        self.job_id = job_id
        self.job_type = job_type
        self.fn = fn
        self.args = args or ()
        self.kwargs = kwargs or {}
        self.status = JobStatus.PENDING
        self.progress_pct = 0
        self.result: Optional[Any] = None
        self.error: Optional[str] = None
        self.retries = 0
        self.max_retries = max_retries
        self.idempotency_key = idempotency_key
        self.user_id = user_id
        self.created_at = datetime.now(timezone.utc).isoformat()
        self.updated_at = self.created_at

    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "job_type": self.job_type,
            "status": self.status.value,
            "progress_pct": self.progress_pct,
            "result": self.result,
            "error": self.error,
            "retries": self.retries,
            "user_id": self.user_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class JobManager:
    """
    Lightweight, reliable background job queue with status tracking,
    bounded retries, idempotency, and graceful exception handling.
    """

    def __init__(self):
        self._jobs: Dict[str, Job] = {}
        self._idempotency_map: Dict[str, str] = {}
        self._lock = threading.Lock()

    def submit_job(
        self,
        job_type: str,
        fn: Callable,
        *args,
        max_retries: int = 2,
        idempotency_key: Optional[str] = None,
        user_id: Optional[str] = None,
        **kwargs
    ) -> Job:
        with self._lock:
            # Check idempotency
            scoped_idempotency = f"{user_id}:{idempotency_key}" if (idempotency_key and user_id) else idempotency_key
            if scoped_idempotency and scoped_idempotency in self._idempotency_map:
                existing_id = self._idempotency_map[scoped_idempotency]
                if existing_id in self._jobs:
                    existing_job = self._jobs[existing_id]
                    if existing_job.status in [JobStatus.PENDING, JobStatus.RUNNING, JobStatus.COMPLETED]:
                        return existing_job

            job_id = f"JOB-{uuid.uuid4().hex[:10].upper()}"
            job = Job(
                job_id=job_id,
                job_type=job_type,
                fn=fn,
                args=args,
                kwargs=kwargs,
                max_retries=max_retries,
                idempotency_key=scoped_idempotency,
                user_id=user_id,
            )
            self._jobs[job_id] = job
            if scoped_idempotency:
                self._idempotency_map[scoped_idempotency] = job_id

        # Launch execution in thread
        thread = threading.Thread(target=self._run_job, args=(job,), daemon=True)
        thread.start()
        return job

    def _run_job(self, job: Job) -> None:
        job.status = JobStatus.RUNNING
        job.updated_at = datetime.now(timezone.utc).isoformat()
        logger.info(f"Background job {job.job_id} [{job.job_type}] started.")

        while True:
            try:
                result = job.fn(*job.args, **job.kwargs)
                job.status = JobStatus.COMPLETED
                job.progress_pct = 100
                job.result = result
                job.updated_at = datetime.now(timezone.utc).isoformat()
                logger.info(f"Background job {job.job_id} completed successfully.")
                break
            except Exception as e:
                job.retries += 1
                job.updated_at = datetime.now(timezone.utc).isoformat()
                logger.warning(f"Background job {job.job_id} encountered error (attempt {job.retries}/{job.max_retries}): {e}")

                if job.retries <= job.max_retries:
                    time.sleep(1.0 * job.retries)
                    continue
                else:
                    job.status = JobStatus.FAILED
                    job.error = str(e)
                    logger.error(f"Background job {job.job_id} permanently failed after {job.retries} attempts.")
                    break

    def get_job(self, job_id: str, user_id: Optional[str] = None) -> Optional[Job]:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None
            if user_id and job.user_id and job.user_id != user_id:
                return None
            return job

    def list_jobs(self, user_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        with self._lock:
            all_jobs = list(self._jobs.values())
            if user_id:
                filtered = [j for j in all_jobs if j.user_id == user_id or j.user_id is None]
            else:
                filtered = all_jobs
            return [j.to_dict() for j in filtered[-limit:]]


job_manager = JobManager()
