"""
Chat endpoints for the Chat Me API
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.v1.schemas.chat_schemas import (
    ChatMessageRequest,
    ChatMessageResponse,
    ChatHistoryResponse
)
from app.services.nlp_agent_service import NLPAgentService
from app.services.supabase_service import SupabaseService, SupabaseError
from app.core.dependencies import get_current_user

router = APIRouter()

# Initialize NLP service as a singleton
nlp_service = None

async def get_nlp_service():
    """Get or create NLP service instance."""
    global nlp_service
    if nlp_service is None:
        nlp_service = NLPAgentService()
    return nlp_service

class ChatHealthResponse(BaseModel):
    total_messages: int
    recent_activity: bool
    agent_status: str
    last_message_time: Optional[str] = None

@router.post("/send", response_model=ChatMessageResponse)
async def send_message(
    request: ChatMessageRequest,
    current_user: dict = Depends(get_current_user),
    nlp_service: NLPAgentService = Depends(get_nlp_service),
    db_service: SupabaseService = Depends()
):
    """
    Send a message to the AI agent and get a response.
    """
    try:
        # Validate message content
        if not request.message or not request.message.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message content cannot be empty"
            )
        
        if len(request.message) > 2000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message too long (max 2000 characters)"
            )
        
        # Process message with NLP agent
        agent_response = await nlp_service.process_message(
            message=request.message,
            agent_type=request.agent_type,
            user_id=current_user["id"],
            context=request.context
        )
        
        # Save message to database
        await db_service.save_chat_message(
            user_id=current_user["id"],
            sender="user",
            content=request.message,
            path=request.path or "main"
        )
        
        # Save agent response to database
        if not agent_response.error:
            await db_service.save_chat_message(
                user_id=current_user["id"],
                sender="lumi",
                content=agent_response.response,
                path=request.path or "main",
                emotion=agent_response.emotion
            )
        
        return ChatMessageResponse(
            response=agent_response.response,
            emotion=agent_response.emotion,
            suggestions=agent_response.suggestions,
            agent_type=request.agent_type
        )
        
    except HTTPException:
        raise
    except SupabaseError as e:
        if e.error_code == "VALIDATION_ERROR":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=e.message
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )

@router.get("/history", response_model=List[ChatHistoryResponse])
async def get_chat_history(
    path: Optional[str] = "main",
    limit: int = 50,
    before_timestamp: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db_service: SupabaseService = Depends()
):
    """
    Get chat history for a user and path with pagination support.
    """
    try:
        # Validate limit
        if limit > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit cannot exceed 100 messages"
            )
        
        messages = await db_service.get_chat_history(
            user_id=current_user["id"],
            path=path,
            limit=limit,
            before_timestamp=before_timestamp
        )
        
        return [
            ChatHistoryResponse(
                id=msg["id"],
                sender=msg["sender"],
                content=msg["content"],
                timestamp=msg["timestamp"],
                path=msg["path"]
            )
            for msg in messages
        ]
        
    except HTTPException:
        raise
    except SupabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching chat history: {str(e)}"
        )

@router.delete("/history")
async def clear_chat_history(
    path: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db_service: SupabaseService = Depends()
):
    """
    Clear chat history for a user and optional path.
    """
    try:
        await db_service.clear_chat_history(
            user_id=current_user["id"],
            path=path
        )
        
        return {
            "message": "Chat history cleared successfully",
            "path": path or "all paths",
            "timestamp": db_service._ensure_timezone_aware(datetime.now())
        }
        
    except SupabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing chat history: {str(e)}"
        )

@router.get("/health", response_model=ChatHealthResponse)
async def get_chat_health(
    current_user: dict = Depends(get_current_user),
    db_service: SupabaseService = Depends(),
    nlp_service: NLPAgentService = Depends(get_nlp_service)
):
    """
    Get chat system health status for the current user.
    """
    try:
        # Get recent messages count
        recent_messages = await db_service.get_recent_messages(
            user_id=current_user["id"],
            limit=1
        )
        
        # Get total message count
        all_messages = await db_service.get_chat_history(
            user_id=current_user["id"],
            limit=1000  # Get count estimate
        )
        
        return ChatHealthResponse(
            total_messages=len(all_messages),
            recent_activity=len(recent_messages) > 0,
            agent_status="active" if nlp_service else "inactive",
            last_message_time=recent_messages[0]["timestamp"] if recent_messages else None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting chat health: {str(e)}"
        )