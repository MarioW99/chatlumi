"""
Shared Pydantic schemas used across multiple modules
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class BaseResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None

class PaginationParams(BaseModel):
    page: int = 1
    limit: int = 50
    offset: Optional[int] = None

class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool

class TimestampMixin(BaseModel):
    created_at: datetime
    updated_at: Optional[datetime] = None