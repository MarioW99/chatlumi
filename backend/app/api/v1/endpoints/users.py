"""
User endpoints for the Chat Me API
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.v1.schemas.user_schemas import (
    UserProfileResponse,
    UserProfileUpdate,
    FamiliarizationRequest,
    FamiliarizationResponse,
    UserStatsResponse
)
from app.services.supabase_service import SupabaseService, SupabaseError
from app.core.dependencies import get_current_user

router = APIRouter()

class QuestRequest(BaseModel):
    path: str
    quest_id: int
    text: str
    points: int

class QuestResponse(BaseModel):
    id: int
    path: str
    quest_id: int
    text: str
    points: int
    completed: bool

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: dict = Depends(get_current_user),
    db_service: SupabaseService = Depends()
):
    """
    Get the current user's profile.
    """
    try:
        profile = await db_service.get_user_profile(current_user["id"])
        
        if not profile:
            # Create profile if it doesn't exist
            profile = await db_service.create_user_profile({
                'id': current_user["id"],
                'email': current_user.get("email", ""),
            })
        
        return UserProfileResponse(**profile)
        
    except SupabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching user profile: {str(e)}"
        )

@router.post("/profile", response_model=UserProfileResponse)
async def create_user_profile(
    current_user: dict = Depends(get_current_user),
    db_service: SupabaseService = Depends()
):
    """
    Create a new user profile.
    """
    try:
        # Check if profile already exists
        existing_profile = await db_service.get_user_profile(current_user["id"])
        if existing_profile:
            return UserProfileResponse(**existing_profile)
        
        # Create new profile
        profile_data = {
            'id': current_user["id"],
            'email': current_user.get("email", ""),
        }
        
        profile = await db_service.create_user_profile(profile_data)
        return UserProfileResponse(**profile)
        
    except SupabaseError as e:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user profile: {str(e)}"
        )

@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db_service: SupabaseService = Depends()
):
    """
    Update the current user's profile.
    """
    try:
        updated_profile = await db_service.update_user_profile(
            user_id=current_user["id"],
            updates=profile_update.dict(exclude_unset=True)
        )
        
        return UserProfileResponse(**updated_profile)
        
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
            detail=f"Error updating user profile: {str(e)}"
        )

@router.post("/familiarization", response_model=FamiliarizationResponse)
async def complete_familiarization(
    request: FamiliarizationRequest,
    current_user: dict = Depends(get_current_user),
    db_service: SupabaseService = Depends()
):
    """
    Complete user familiarization process.
    """
    try:
        # Validate answers
        if not request.answers or len(request.answers) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least 3 familiarization answers are required"
            )
        
        # Process familiarization answers
        processed_data = await db_service.process_familiarization(
            user_id=current_user["id"],
            answers=request.answers
        )
        
        return FamiliarizationResponse(
            success=True,
            primary_path=processed_data["primary_path"],
            motivation_level=processed_data["motivation_level"],
            main_challenges=processed_data["main_challenges"],
            support_needs=processed_data["support_needs"]
        )
        
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
            detail=f"Error processing familiarization: {str(e)}"
        )

@router.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(
    current_user: dict = Depends(get_current_user),
    db_service: SupabaseService = Depends()
):
    """
    Get user statistics and progress.
    """
    try:
        stats = await db_service.get_user_stats(current_user["id"])
        return UserStatsResponse(**stats)
        
    except SupabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching user stats: {str(e)}"
        )

@router.post("/quests", response_model=QuestResponse)
async def create_quest(
    quest_request: QuestRequest,
    current_user: dict = Depends(get_current_user),
    db_service: SupabaseService = Depends()
):
    """
    Create a new quest for the user.
    """
    try:
        quest = await db_service.create_quest(
            user_id=current_user["id"],
            path=quest_request.path,
            quest_id=quest_request.quest_id,
            text=quest_request.text,
            points=quest_request.points
        )
        
        return QuestResponse(**quest)
        
    except SupabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating quest: {str(e)}"
        )

@router.get("/quests", response_model=List[QuestResponse])
async def get_user_quests(
    completed: Optional[bool] = None,
    path: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db_service: SupabaseService = Depends()
):
    """
    Get user's quests with optional filters.
    """
    try:
        quests = await db_service.get_user_quests(
            user_id=current_user["id"],
            completed=completed,
            path=path
        )
        
        return [QuestResponse(**quest) for quest in quests]
        
    except SupabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching quests: {str(e)}"
        )

@router.put("/quests/{quest_id}/complete", response_model=QuestResponse)
async def complete_quest(
    quest_id: int,
    current_user: dict = Depends(get_current_user),
    db_service: SupabaseService = Depends()
):
    """
    Mark a quest as completed and award points.
    """
    try:
        quest = await db_service.complete_quest(
            user_id=current_user["id"],
            quest_id=quest_id
        )
        
        return QuestResponse(**quest)
        
    except SupabaseError as e:
        if e.error_code == "NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quest not found"
            )
        elif e.error_code == "ALREADY_COMPLETED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quest already completed"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error completing quest: {str(e)}"
        )