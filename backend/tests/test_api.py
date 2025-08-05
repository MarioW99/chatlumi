"""
API tests for Chat Me backend
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

from main import app

client = TestClient(app)

class TestHealthEndpoints:
    def test_root_endpoint(self):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json()["message"] == "Chat Me API is running"
        assert response.json()["version"] == "1.0.0"
    
    def test_health_check(self):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        assert response.json()["service"] == "chat-me-backend"

class TestChatEndpoints:
    @patch('app.services.supabase_service.SupabaseService')
    @patch('app.services.nlp_agent_service.NLPAgentService')
    def test_send_message_unauthorized(self, mock_nlp, mock_db):
        """Test sending message without authentication."""
        response = client.post(
            "/api/v1/chat/send",
            json={
                "message": "Hello",
                "agent_type": "main"
            }
        )
        assert response.status_code == 401

    def test_get_chat_history_unauthorized(self):
        """Test getting chat history without authentication."""
        response = client.get("/api/v1/chat/history")
        assert response.status_code == 401

class TestUserEndpoints:
    def test_get_user_profile_unauthorized(self):
        """Test getting user profile without authentication."""
        response = client.get("/api/v1/users/profile")
        assert response.status_code == 401

    def test_update_user_profile_unauthorized(self):
        """Test updating user profile without authentication."""
        response = client.put(
            "/api/v1/users/profile",
            json={"level": 2}
        )
        assert response.status_code == 401

class TestLabelingEndpoints:
    def test_create_labeling_task_unauthorized(self):
        """Test creating labeling task without authentication."""
        response = client.post(
            "/api/v1/labeling/tasks",
            json={
                "data": {"text": "Sample text"},
                "project_id": 1
            }
        )
        assert response.status_code == 401

    def test_get_labeling_tasks_unauthorized(self):
        """Test getting labeling tasks without authentication."""
        response = client.get("/api/v1/labeling/tasks")
        assert response.status_code == 401

# Integration tests would go here with proper authentication setup
# and database mocking for more comprehensive testing