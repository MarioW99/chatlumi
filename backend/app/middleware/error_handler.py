"""
Global error handling middleware for FastAPI
"""
import logging
from typing import Union
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import log_error, get_logger

logger = get_logger(__name__)

class GlobalErrorHandler(BaseHTTPMiddleware):
    """Global error handling middleware"""
    
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            return await self.handle_exception(request, exc)
    
    async def handle_exception(self, request: Request, exc: Exception) -> JSONResponse:
        """Handle different types of exceptions"""
        
        # Get user ID from request if available
        user_id = getattr(request.state, 'user_id', None)
        
        if isinstance(exc, HTTPException):
            log_error(
                logger, 
                exc, 
                operation=f"{request.method} {request.url.path}",
                user_id=user_id,
                status_code=exc.status_code
            )
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "error": exc.detail,
                    "status_code": exc.status_code,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        elif isinstance(exc, RequestValidationError):
            log_error(
                logger, 
                exc, 
                operation=f"{request.method} {request.url.path}",
                user_id=user_id,
                validation_errors=exc.errors()
            )
            return JSONResponse(
                status_code=422,
                content={
                    "error": "Validation error",
                    "details": exc.errors(),
                    "status_code": 422,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        elif isinstance(exc, StarletteHTTPException):
            log_error(
                logger, 
                exc, 
                operation=f"{request.method} {request.url.path}",
                user_id=user_id,
                status_code=exc.status_code
            )
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "error": exc.detail,
                    "status_code": exc.status_code,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        else:
            # Unexpected error
            log_error(
                logger, 
                exc, 
                operation=f"{request.method} {request.url.path}",
                user_id=user_id,
                error_type=type(exc).__name__
            )
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal server error",
                    "message": "An unexpected error occurred",
                    "status_code": 500,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )

# Exception handlers for FastAPI app
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    user_id = getattr(request.state, 'user_id', None)
    
    log_error(
        logger, 
        exc, 
        operation=f"{request.method} {request.url.path}",
        user_id=user_id,
        status_code=exc.status_code
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation exceptions"""
    user_id = getattr(request.state, 'user_id', None)
    
    log_error(
        logger, 
        exc, 
        operation=f"{request.method} {request.url.path}",
        user_id=user_id,
        validation_errors=exc.errors()
    )
    
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation error",
            "details": exc.errors(),
            "status_code": 422,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    user_id = getattr(request.state, 'user_id', None)
    
    log_error(
        logger, 
        exc, 
        operation=f"{request.method} {request.url.path}",
        user_id=user_id,
        error_type=type(exc).__name__
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "status_code": 500,
            "timestamp": datetime.utcnow().isoformat()
        }
    )