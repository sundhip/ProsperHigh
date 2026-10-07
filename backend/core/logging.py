import logging
import sys
from backend.core.config import settings


def setup_logging():
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True
    )
    
    # Silence overly verbose libraries if in INFO
    if log_level == logging.INFO:
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    logger = logging.getLogger("prosperhigh")
    logger.info(f"Logging initialized at level {settings.LOG_LEVEL} for environment '{settings.ENVIRONMENT}'")
    return logger


logger = logging.getLogger("prosperhigh")
