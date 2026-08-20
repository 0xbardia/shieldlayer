"""Structured logging configuration for ShieldLayer API."""

import logging
import logging.handlers
import json
import os
from datetime import datetime, timezone
from pathlib import Path


class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)

        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id

        if hasattr(record, "client_ip"):
            log_entry["client_ip"] = record.client_ip

        return json.dumps(log_entry)


def setup_logging(log_dir: str = "logs", level: int = logging.INFO) -> None:
    """Configure logging for the API."""

    # Create log directory
    log_path = Path(log_dir)
    log_path.mkdir(parents=True, exist_ok=True)

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Clear existing handlers
    root_logger.handlers.clear()

    # Console handler (for development)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(level)
    console_formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)

    # File handler (JSON format for production)
    file_handler = logging.handlers.RotatingFileHandler(
        log_path / "api.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(level)
    file_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(file_handler)

    # Error file handler
    error_handler = logging.handlers.RotatingFileHandler(
        log_path / "api-error.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding="utf-8",
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(error_handler)


# Configure logging on import
setup_logging()
