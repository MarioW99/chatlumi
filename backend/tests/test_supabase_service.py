"""
Tests for enhanced Supabase service
"""
import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timezone

from app.services.supabase_service import SupabaseService, SupabaseError

class TestSupabaseService:
    
    @pytest.fixture
    def supabase_service(self):
        """Create Supabase service instance for testing."""
        with patch('app.services.supabase_service.create_client'):
            service = SupabaseService()
            service.client = Mock()
            return service
    
    @pytest.mark.asyncio
    async def test_ensure_timezone_aware(self, supabase_service):
        """Test timezone awareness handling."""
        # Test with timezone-aware datetime
        dt_with_tz = datetime.now(timezone.utc)
        result = supabase_service._ensure_timezone_aware(dt_with_tz)
        assert result is not None
        assert 'T' in result
        
        # Test with naive datetime
        dt_naive = datetime.now()
        result = supabase_service._ensure_timezone_aware(dt_naive)
        assert result is not None
        assert '+00:00' in result or 'Z' in result
        
        # Test with ISO string
        iso_string = "2023-01-01T12:00:00Z"
        result = supabase_service._ensure_timezone_aware(iso_string)
        assert result is not None
        
        # Test with None
        result = supabase_service._ensure_timezone_aware(None)
        assert result is None
    
    @pytest.mark.asyncio
    async def test_get_user_by_id_success(self, supabase_service):
        """Test successful user retrieval."""
        mock_response = Mock()
        mock_response.data = {
            'id': 'test-user-id',
            'email': 'test@example.com',
            'created_at': '2023-01-01T12:00:00Z',
            'level': 1,
            'points': 0
        }
        
        supabase_service.client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response
        
        result = await supabase_service.get_user_by_id('test-user-id')
        
        assert result is not None
        assert result['id'] == 'test-user-id'
        assert result['email'] == 'test@example.com'
    
    @pytest.mark.asyncio
    async def test_get_user_by_id_not_found(self, supabase_service):
        """Test user not found scenario."""
        from postgrest.exceptions import APIError
        
        mock_error = APIError({'code': 'PGRST116', 'message': 'Not found'})
        supabase_service.client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.side_effect = mock_error
        
        result = await supabase_service.get_user_by_id('nonexistent-user')
        assert result is None
    
    @pytest.mark.asyncio
    async def test_create_user_profile_success(self, supabase_service):
        """Test successful user profile creation."""
        user_data = {
            'id': 'test-user-id',
            'email': 'test@example.com'
        }
        
        mock_response = Mock()
        mock_response.data = {
            **user_data,
            'level': 1,
            'points': 0,
            'created_at': '2023-01-01T12:00:00Z'
        }
        
        supabase_service.client.table.return_value.insert.return_value.select.return_value.single.return_value.execute.return_value = mock_response
        
        result = await supabase_service.create_user_profile(user_data)
        
        assert result['id'] == 'test-user-id'
        assert result['email'] == 'test@example.com'
        assert result['level'] == 1
    
    @pytest.mark.asyncio
    async def test_create_user_profile_missing_required_field(self, supabase_service):
        """Test user profile creation with missing required field."""
        user_data = {'email': 'test@example.com'}  # Missing 'id'
        
        with pytest.raises(SupabaseError) as exc_info:
            await supabase_service.create_user_profile(user_data)
        
        assert exc_info.value.error_code == "VALIDATION_ERROR"
        assert "Missing required field: id" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_update_user_profile_validation(self, supabase_service):
        """Test user profile update with validation."""
        # Test invalid level
        with pytest.raises(SupabaseError) as exc_info:
            await supabase_service.update_user_profile('test-user', {'level': 0})
        
        assert exc_info.value.error_code == "VALIDATION_ERROR"
        assert "Level must be positive" in str(exc_info.value)
        
        # Test invalid motivation level
        with pytest.raises(SupabaseError) as exc_info:
            await supabase_service.update_user_profile('test-user', {'motivation_level': 11})
        
        assert exc_info.value.error_code == "VALIDATION_ERROR"
        assert "Motivation level must be between 1 and 10" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_save_chat_message_validation(self, supabase_service):
        """Test chat message validation."""
        # Test empty content
        with pytest.raises(SupabaseError) as exc_info:
            await supabase_service.save_chat_message('user-id', 'user', '', 'main')
        
        assert exc_info.value.error_code == "VALIDATION_ERROR"
        assert "Message content cannot be empty" in str(exc_info.value)
        
        # Test invalid sender
        with pytest.raises(SupabaseError) as exc_info:
            await supabase_service.save_chat_message('user-id', 'invalid', 'Hello', 'main')
        
        assert exc_info.value.error_code == "VALIDATION_ERROR"
        assert "Invalid sender type" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_save_chat_message_success(self, supabase_service):
        """Test successful chat message saving."""
        mock_response = Mock()
        mock_response.data = {
            'id': 1,
            'user_id': 'test-user',
            'sender': 'user',
            'content': 'Hello world',
            'path': 'main',
            'timestamp': '2023-01-01T12:00:00Z'
        }
        
        supabase_service.client.table.return_value.insert.return_value.select.return_value.single.return_value.execute.return_value = mock_response
        
        result = await supabase_service.save_chat_message(
            'test-user', 'user', 'Hello world', 'main'
        )
        
        assert result['content'] == 'Hello world'
        assert result['sender'] == 'user'
    
    @pytest.mark.asyncio
    async def test_process_familiarization_insufficient_answers(self, supabase_service):
        """Test familiarization with insufficient answers."""
        with pytest.raises(SupabaseError) as exc_info:
            await supabase_service.process_familiarization('user-id', ['answer1'])
        
        assert exc_info.value.error_code == "VALIDATION_ERROR"
        assert "Insufficient familiarization answers" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_process_familiarization_success(self, supabase_service):
        """Test successful familiarization processing."""
        answers = [
            "I want to improve my fitness and build muscle",
            "My motivation level is 8 out of 10",
            "I need structured guidance and progress tracking"
        ]
        
        # Mock the update_user_profile method
        supabase_service.update_user_profile = AsyncMock()
        
        result = await supabase_service.process_familiarization('user-id', answers)
        
        assert result['primary_path'] == 'fitness'
        assert result['motivation_level'] == 8
        assert 'structured_guidance' in result['support_needs']
        assert 'progress_tracking' in result['support_needs']
    
    @pytest.mark.asyncio
    async def test_get_chat_history_with_pagination(self, supabase_service):
        """Test chat history retrieval with pagination."""
        mock_response = Mock()
        mock_response.data = [
            {
                'id': 1,
                'sender': 'user',
                'content': 'Hello',
                'timestamp': '2023-01-01T12:00:00Z',
                'path': 'main'
            }
        ]
        
        # Mock the query chain
        mock_query = Mock()
        mock_query.execute.return_value = mock_response
        mock_query.lt.return_value = mock_query
        
        supabase_service.client.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.limit.return_value = mock_query
        
        result = await supabase_service.get_chat_history(
            'user-id', 'main', 10, '2023-01-01T13:00:00Z'
        )
        
        assert len(result) == 1
        assert result[0]['content'] == 'Hello'
    
    @pytest.mark.asyncio
    async def test_create_quest_success(self, supabase_service):
        """Test successful quest creation."""
        mock_response = Mock()
        mock_response.data = {
            'id': 1,
            'user_id': 'test-user',
            'path': 'fitness',
            'quest_id': 101,
            'text': 'Complete 10 push-ups',
            'points': 50,
            'completed': False
        }
        
        supabase_service.client.table.return_value.insert.return_value.select.return_value.single.return_value.execute.return_value = mock_response
        
        result = await supabase_service.create_quest(
            'test-user', 'fitness', 101, 'Complete 10 push-ups', 50
        )
        
        assert result['text'] == 'Complete 10 push-ups'
        assert result['points'] == 50
        assert result['completed'] is False
    
    @pytest.mark.asyncio
    async def test_complete_quest_success(self, supabase_service):
        """Test successful quest completion."""
        # Mock quest retrieval
        mock_quest_response = Mock()
        mock_quest_response.data = {
            'id': 1,
            'user_id': 'test-user',
            'points': 50,
            'completed': False
        }
        
        # Mock user profile
        mock_user_profile = {
            'id': 'test-user',
            'points': 100,
            'level': 1
        }
        
        supabase_service.client.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = mock_quest_response
        supabase_service.client.table.return_value.update.return_value.eq.return_value.execute.return_value = Mock()
        
        # Mock methods
        supabase_service.get_user_profile = AsyncMock(return_value=mock_user_profile)
        supabase_service.update_user_profile = AsyncMock()
        
        result = await supabase_service.complete_quest('test-user', 1)
        
        assert result['points'] == 50
        # Verify that update_user_profile was called with new points and level
        supabase_service.update_user_profile.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_complete_quest_already_completed(self, supabase_service):
        """Test completing an already completed quest."""
        mock_quest_response = Mock()
        mock_quest_response.data = {
            'id': 1,
            'user_id': 'test-user',
            'points': 50,
            'completed': True  # Already completed
        }
        
        supabase_service.client.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = mock_quest_response
        
        with pytest.raises(SupabaseError) as exc_info:
            await supabase_service.complete_quest('test-user', 1)
        
        assert exc_info.value.error_code == "ALREADY_COMPLETED"
    
    @pytest.mark.asyncio
    async def test_health_check_success(self, supabase_service):
        """Test successful health check."""
        mock_response = Mock()
        mock_response.data = [{'id': 'test-user'}]
        
        supabase_service.client.table.return_value.select.return_value.limit.return_value.execute.return_value = mock_response
        
        result = await supabase_service.health_check()
        
        assert result['status'] == 'healthy'
        assert result['connection'] == 'active'
        assert 'timestamp' in result
    
    @pytest.mark.asyncio
    async def test_health_check_failure(self, supabase_service):
        """Test health check failure."""
        supabase_service.client.table.return_value.select.return_value.limit.return_value.execute.side_effect = Exception("Connection failed")
        
        result = await supabase_service.health_check()
        
        assert result['status'] == 'unhealthy'
        assert result['connection'] == 'failed'
        assert 'error' in result

if __name__ == "__main__":
    pytest.main([__file__])