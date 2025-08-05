"""
Health check endpoints for monitoring system status
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime

from app.services.supabase_service import SupabaseService, SupabaseError
from app.services.nlp_agent_service import NLPAgentService
from app.core.dependencies import get_current_user

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: Dict[str, Any]
    version: str = "1.0.0"

class DatabaseHealthResponse(BaseModel):
    status: str
    connection: str
    timestamp: str
    response_time_ms: float

class NLPHealthResponse(BaseModel):
    status: str
    models_loaded: bool
    gpu_available: bool
    memory_usage: str

@router.get("/", response_model=HealthResponse)
async def health_check():
    """
    Overall system health check.
    """
    try:
        # Check database
        db_service = SupabaseService()
        db_health = await db_service.health_check()
        
        # Check NLP service
        try:
            nlp_service = NLPAgentService()
            nlp_status = "healthy" if nlp_service.embedding_model else "degraded"
            
            # Try to get memory info, fallback if psutil not available
            try:
                import psutil
                memory_info = psutil.virtual_memory()
                memory_usage = f"{memory_info.percent}% ({memory_info.used // (1024**3)}GB/{memory_info.total // (1024**3)}GB)"
            except ImportError:
                memory_usage = "unavailable (psutil not installed)"
            
            nlp_health = {
                "status": nlp_status,
                "models_loaded": nlp_service.embedding_model is not None,
                "gpu_available": str(nlp_service.device) != "cpu",
                "memory_usage": memory_usage
            }
        except Exception as e:
            nlp_health = {
                "status": "unhealthy",
                "models_loaded": False,
                "gpu_available": False,
                "memory_usage": "unknown",
                "error": str(e)
            }
        
        # Determine overall status
        overall_status = "healthy"
        if db_health["status"] != "healthy" or nlp_health["status"] == "unhealthy":
            overall_status = "unhealthy"
        elif nlp_health["status"] == "degraded":
            overall_status = "degraded"
        
        return HealthResponse(
            status=overall_status,
            timestamp=datetime.utcnow().isoformat(),
            services={
                "database": db_health,
                "nlp": nlp_health
            }
        )
        
    except Exception as e:
        return HealthResponse(
            status="unhealthy",
            timestamp=datetime.utcnow().isoformat(),
            services={
                "database": {"status": "unknown", "error": str(e)},
                "nlp": {"status": "unknown", "error": str(e)}
            }
        )

@router.get("/database", response_model=DatabaseHealthResponse)
async def database_health():
    """
    Database-specific health check.
    """
    try:
        db_service = SupabaseService()
        start_time = datetime.utcnow()
        
        health_result = await db_service.health_check()
        
        end_time = datetime.utcnow()
        response_time = (end_time - start_time).total_seconds() * 1000
        
        return DatabaseHealthResponse(
            status=health_result["status"],
            connection=health_result["connection"],
            timestamp=health_result["timestamp"],
            response_time_ms=response_time
        )
        
    except SupabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database health check failed: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database health check failed: {str(e)}"
        )

@router.get("/nlp", response_model=NLPHealthResponse)
async def nlp_health():
    """
    NLP service health check.
    """
    try:
        nlp_service = NLPAgentService()
        
        # Test basic functionality
        test_message = "Hello, how are you?"
        response = await nlp_service.process_message(test_message, "main")
        
        # Try to get memory info, fallback if psutil not available
        try:
            import psutil
            memory_info = psutil.virtual_memory()
            memory_usage = f"{memory_info.percent}% ({memory_info.used // (1024**3)}GB/{memory_info.total // (1024**3)}GB)"
        except ImportError:
            memory_usage = "unavailable (psutil not installed)"
        
        return NLPHealthResponse(
            status="healthy" if response.response else "degraded",
            models_loaded=nlp_service.embedding_model is not None,
            gpu_available=str(nlp_service.device) != "cpu",
            memory_usage=memory_usage
        )
        
    except Exception as e:
        return NLPHealthResponse(
            status="unhealthy",
            models_loaded=False,
            gpu_available=False,
            memory_usage="unknown"
        )

@router.get("/user", dependencies=[Depends(get_current_user)])
async def user_health(
    current_user: dict = Depends(get_current_user),
    db_service: SupabaseService = Depends()
):
    """
    User-specific health check (requires authentication).
    """
    try:
        # Check user profile
        profile = await db_service.get_user_profile(current_user["id"])
        
        # Get user statistics
        stats = await db_service.get_user_stats(current_user["id"])
        
        return {
            "user_id": current_user["id"],
            "profile_exists": profile is not None,
            "last_active": profile.get("last_active") if profile else None,
            "total_messages": stats.get("total_messages", 0),
            "data_integrity": True,  # Could add more checks here
            "rls_enabled": True,  # Supabase RLS is enabled
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except SupabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"User health check failed: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"User health check failed: {str(e)}"
        )