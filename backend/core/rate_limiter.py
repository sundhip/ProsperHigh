import time
from typing import Dict, List, Tuple
from collections import defaultdict
import threading
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from backend.core.config import settings


class InMemoryRateLimiter:
    """
    Thread-safe sliding-window rate limiter for sensitive and expensive API endpoints.
    Protects login, signup, AI analysis, and RAG document ingestion from brute-force
    and request/cost storms.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._requests: Dict[str, List[float]] = defaultdict(list)

    def _clean_old_entries(self, key: str, window_seconds: float, now: float) -> None:
        threshold = now - window_seconds
        self._requests[key] = [ts for ts in self._requests[key] if ts > threshold]

    def is_allowed(self, key: str, limit: int, window_seconds: float = 60.0) -> Tuple[bool, int]:
        """
        Returns (is_allowed, retry_after_seconds).
        """
        if not settings.RATE_LIMIT_ENABLED:
            return True, 0

        now = time.time()
        with self._lock:
            self._clean_old_entries(key, window_seconds, now)
            count = len(self._requests[key])

            if count >= limit:
                oldest = self._requests[key][0]
                retry_after = max(1, int(oldest + window_seconds - now))
                return False, retry_after

            self._requests[key].append(now)
            return True, 0

    def get_limit_for_path(self, path: str) -> int:
        if path.startswith("/api/auth/"):
            return settings.RATE_LIMIT_AUTH_PER_MINUTE
        if path.startswith("/api/analyze"):
            return settings.RATE_LIMIT_AI_PER_MINUTE
        if path.startswith("/api/research/"):
            return settings.RATE_LIMIT_RESEARCH_PER_MINUTE
        return settings.RATE_LIMIT_GENERAL_PER_MINUTE


rate_limiter = InMemoryRateLimiter()
