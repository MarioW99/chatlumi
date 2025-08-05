"""
Dependency injection for FastAPI endpoints
"""
from typing import Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.core.config import settings
from app.services.supabase_service import SupabaseService

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db_service: SupabaseService = Depends()
) -> Dict[str, Any]:
    """
    Get the current authenticated user from JWT token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode JWT token
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    user = await db_service.get_user_by_id(user_id)
    if user is None:
        raise credentials_exception
        
    return user

async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db_service: SupabaseService = Depends()
) -> Dict[str, Any] | None:
    """
    Get the current user if authenticated, otherwise return None.
    """
    try:
        return await get_current_user(credentials, db_service)
    except HTTPException:
        return None

def get_supabase_service() -> SupabaseService:
    """
    Get Supabase service instance.
    """
    return SupabaseService()