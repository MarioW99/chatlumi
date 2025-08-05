"""
Main entry point for the Chat Me backend application.
"""
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints import chat, users, labeling, health
from app.core.config import settings

# Create FastAPI application
app = FastAPI(
    title="Chat Me API",
    description="Backend API for Chat Me - Empathic Companion Application",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(labeling.router, prefix="/api/v1/labeling", tags=["labeling"])
app.include_router(health.router, prefix="/api/v1/health", tags=["health"])

@app.get("/")
async def root():
    """Root endpoint for health check."""
    return {"message": "Chat Me API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        from app.services.supabase_service import SupabaseService
        db_service = SupabaseService()
        db_health = await db_service.health_check()
        
        return {
            "status": "healthy" if db_health["status"] == "healthy" else "degraded",
            "service": "chat-me-backend",
            "database": db_health["status"],
            "timestamp": db_health["timestamp"]
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "chat-me-backend",
            "error": str(e)
        }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )