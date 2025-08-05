"""
User-related Pydantic schemas
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserProfileResponse(BaseModel):
    id: str
    email: EmailStr
    created_at: datetime
    last_active: Optional[datetime] = None
    path: Optional[str] = None
    level: int = 1
    points: int = 0
    silver_keys: int = 0
    gold_keys: int = 0
    last_emotion: Optional[str] = None
    familiarization_completed: bool = False
    familiarization_completed_at: Optional[datetime] = None
    familiarization_answers: Optional[List[str]] = None
    primary_path: Optional[str] = None
    motivation_level: Optional[int] = None
    main_challenges: Optional[List[str]] = None
    support_needs: Optional[List[str]] = None

class UserProfileUpdate(BaseModel):
    path: Optional[str] = None
    level: Optional[int] = None
    points: Optional[int] = None
    silver_keys: Optional[int] = None
    gold_keys: Optional[int] = None
    last_emotion: Optional[str] = None
    primary_path: Optional[str] = None
    motivation_level: Optional[int] = None
    main_challenges: Optional[List[str]] = None
    support_needs: Optional[List[str]] = None

class FamiliarizationRequest(BaseModel):
    answers: List[str]
    
    class Config:
        schema_extra = {
            "example": {
                "answers": [
                    "I want to improve my fitness and lose weight",
                    "My motivation level is 8 out of 10",
                    "I need structured guidance and progress tracking"
                ]
            }
        }

class FamiliarizationResponse(BaseModel):
    success: bool
    primary_path: str
    motivation_level: int
    main_challenges: List[str]
    support_needs: List[str]

class UserStatsResponse(BaseModel):
    total_messages: int
    messages_this_week: int
    completed_quests: int
    active_quests: int
    total_points: int
    current_level: int
    days_active: int
    favorite_path: Optional[str] = None
    progress_percentage: float

class UserHealthResponse(BaseModel):
    user_id: str
    profile_exists: bool
    last_active: Optional[datetime] = None
    total_sessions: int
    data_integrity: bool
    rls_enabled: bool