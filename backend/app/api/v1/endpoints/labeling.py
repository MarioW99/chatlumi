"""
Labeling endpoints for the Chat Me API
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.v1.schemas.labeling_schemas import (
    LabelingTaskRequest,
    LabelingTaskResponse,
    LabelingSubmissionRequest,
    LabelingSubmissionResponse
)
from app.services.label_studio_service import LabelStudioService
from app.core.dependencies import get_current_user

router = APIRouter()

@router.post("/tasks", response_model=LabelingTaskResponse)
async def create_labeling_task(
    request: LabelingTaskRequest,
    current_user: dict = Depends(get_current_user),
    label_service: LabelStudioService = Depends()
):
    """
    Create a new labeling task.
    """
    try:
        task = await label_service.create_task(
            data=request.data,
            project_id=request.project_id,
            user_id=current_user["id"]
        )
        
        return LabelingTaskResponse(**task)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating labeling task: {str(e)}"
        )

@router.get("/tasks", response_model=List[LabelingTaskResponse])
async def get_labeling_tasks(
    project_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    label_service: LabelStudioService = Depends()
):
    """
    Get labeling tasks for the current user.
    """
    try:
        tasks = await label_service.get_tasks(
            user_id=current_user["id"],
            project_id=project_id,
            status_filter=status_filter
        )
        
        return [LabelingTaskResponse(**task) for task in tasks]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching labeling tasks: {str(e)}"
        )

@router.post("/submissions", response_model=LabelingSubmissionResponse)
async def submit_labeling(
    request: LabelingSubmissionRequest,
    current_user: dict = Depends(get_current_user),
    label_service: LabelStudioService = Depends()
):
    """
    Submit a labeling annotation.
    """
    try:
        submission = await label_service.submit_annotation(
            task_id=request.task_id,
            annotations=request.annotations,
            user_id=current_user["id"]
        )
        
        return LabelingSubmissionResponse(**submission)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting labeling: {str(e)}"
        )