"""
Labeling-related Pydantic schemas
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

class LabelingTaskRequest(BaseModel):
    data: Dict[str, Any]
    project_id: int

class LabelingTaskResponse(BaseModel):
    id: int
    data: Dict[str, Any]
    project_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

class LabelingSubmissionRequest(BaseModel):
    task_id: int
    annotations: List[Dict[str, Any]]

class LabelingSubmissionResponse(BaseModel):
    id: int
    task_id: int
    annotations: List[Dict[str, Any]]
    created_at: datetime
    status: str

class LabelingProject(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    label_config: str
    created_at: datetime