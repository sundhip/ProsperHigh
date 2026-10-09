import json
from datetime import datetime, timezone
import logging
import sys
from contextvars import ContextVar
from typing import Optional
from backend.core.config import settings

# Context variable for request correlation ID
request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id_ctx", default=None)


class RequestIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = request_id_ctx.get() or "-"
        return True


class JsonLogFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "request_id": getattr(record, "request_id", "-"),
            "logger": record.name,
            "message": record.getMessage(),
            "environment": settings.ENVIRONMENT,
        }
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)


def setup_logging():
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    if settings.LOG_FORMAT == "json":
        formatter = JsonLogFormatter()
    else:
        log_format = "%(asctime)s [%(levelname)s] [req:%(request_id)s] %(name)s: %(message)s"
        formatter = logging.Formatter(log_format)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    handler.addFilter(RequestIdFilter())

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.handlers = [handler]

    # Silence overly verbose libraries in INFO
    if log_level == logging.INFO:
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    logger = logging.getLogger("prosperhigh")
    logger.info(f"Logging initialized at level {settings.LOG_LEVEL} for environment '{settings.ENVIRONMENT}'")
    return logger


logger = logging.getLogger("prosperhigh")
