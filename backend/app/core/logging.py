"""
Centralized logging configuration for the Chat Me backend
"""
import logging
import sys
from typing import Any, Dict
from datetime import datetime
import json
from pathlib import Path

from app.core.config import settings

class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        # Create structured log entry
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, 'user_id'):
            log_entry["user_id"] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry["request_id"] = record.request_id
        if hasattr(record, 'operation'):
            log_entry["operation"] = record.operation
        
        return json.dumps(log_entry)

def setup_logging():
    """Setup centralized logging configuration"""
    
    # Create logs directory if it doesn't exist
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.LOG_LEVEL))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Console handler with structured formatting
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, settings.LOG_LEVEL))
    
    if settings.ENVIRONMENT == "production":
        # Use structured logging in production
        console_handler.setFormatter(StructuredFormatter())
    else:
        # Use readable formatting in development
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(console_formatter)
    
    root_logger.addHandler(console_handler)
    
    # File handler for production
    if settings.ENVIRONMENT == "production":
        file_handler = logging.FileHandler(logs_dir / "app.log")
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(StructuredFormatter())
        root_logger.addHandler(file_handler)
        
        # Error file handler
        error_handler = logging.FileHandler(logs_dir / "errors.log")
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(StructuredFormatter())
        root_logger.addHandler(error_handler)
    
    # Configure specific loggers
    logging.getLogger('uvicorn').setLevel(logging.INFO)
    logging.getLogger('fastapi').setLevel(logging.INFO)
    logging.getLogger('supabase').setLevel(logging.WARNING)
    logging.getLogger('httpx').setLevel(logging.WARNING)
    
    # Set app logger to debug in development
    if settings.ENVIRONMENT == "development":
        logging.getLogger('app').setLevel(logging.DEBUG)
    
    logging.info("Logging configuration initialized")

def get_logger(name: str) -> logging.Logger:
    """Get a logger with the specified name"""
    return logging.getLogger(name)

def log_operation(logger: logging.Logger, operation: str, user_id: str = None, **kwargs):
    """Log an operation with structured data"""
    extra = {"operation": operation}
    if user_id:
        extra["user_id"] = user_id
    extra.update(kwargs)
    
    logger.info(f"Operation: {operation}", extra=extra)

def log_error(logger: logging.Logger, error: Exception, operation: str = None, user_id: str = None, **kwargs):
    """Log an error with structured data"""
    extra = {"operation": operation or "unknown"}
    if user_id:
        extra["user_id"] = user_id
    extra.update(kwargs)
    
    logger.error(f"Error in {operation}: {str(error)}", exc_info=error, extra=extra)