"""
Label Studio service for managing labeling tasks and annotations
"""
from typing import List, Dict, Any, Optional
import httpx
from datetime import datetime

from app.core.config import settings

class LabelStudioService:
    def __init__(self):
        self.base_url = settings.LABEL_STUDIO_URL
        self.api_key = settings.LABEL_STUDIO_API_KEY
        self.headers = {
            "Authorization": f"Token {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def create_task(
        self,
        data: Dict[str, Any],
        project_id: int,
        user_id: str
    ) -> Dict[str, Any]:
        """Create a new labeling task."""
        async with httpx.AsyncClient() as client:
            task_data = {
                "data": data,
                "project": project_id,
                "meta": {
                    "created_by": user_id,
                    "created_at": datetime.utcnow().isoformat()
                }
            }
            
            response = await client.post(
                f"{self.base_url}/api/tasks/",
                json=task_data,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    async def get_tasks(
        self,
        user_id: str,
        project_id: Optional[int] = None,
        status_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get labeling tasks for a user."""
        async with httpx.AsyncClient() as client:
            params = {}
            if project_id:
                params["project"] = project_id
            if status_filter:
                params["status"] = status_filter
            
            response = await client.get(
                f"{self.base_url}/api/tasks/",
                params=params,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    async def submit_annotation(
        self,
        task_id: int,
        annotations: List[Dict[str, Any]],
        user_id: str
    ) -> Dict[str, Any]:
        """Submit an annotation for a task."""
        async with httpx.AsyncClient() as client:
            annotation_data = {
                "task": task_id,
                "result": annotations,
                "completed_by": user_id,
                "created_at": datetime.utcnow().isoformat()
            }
            
            response = await client.post(
                f"{self.base_url}/api/annotations/",
                json=annotation_data,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    async def get_project_info(self, project_id: int) -> Dict[str, Any]:
        """Get information about a labeling project."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/projects/{project_id}/",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    async def create_project(
        self,
        title: str,
        description: str,
        label_config: str
    ) -> Dict[str, Any]:
        """Create a new labeling project."""
        async with httpx.AsyncClient() as client:
            project_data = {
                "title": title,
                "description": description,
                "label_config": label_config
            }
            
            response = await client.post(
                f"{self.base_url}/api/projects/",
                json=project_data,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()