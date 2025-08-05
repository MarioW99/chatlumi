"""
Enhanced Supabase service with improved error handling, RLS compliance, and better data management
"""
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timezone
import json
import logging
from contextlib import asynccontextmanager

from supabase import create_client, Client
from postgrest.exceptions import APIError
from app.core.config import settings

logger = logging.getLogger(__name__)

class SupabaseError(Exception):
    """Custom exception for Supabase-related errors"""
    def __init__(self, message: str, error_code: str = None, details: Dict = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)

class SupabaseService:
    def __init__(self):
        """Initialize Supabase client with proper error handling"""
        try:
            self.client: Client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY
            )
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise SupabaseError(
                "Failed to connect to Supabase",
                error_code="CONNECTION_ERROR",
                details={"original_error": str(e)}
            )
    
    @asynccontextmanager
    async def _handle_supabase_errors(self, operation: str):
        """Context manager for consistent error handling"""
        try:
            yield
        except APIError as e:
            logger.error(f"Supabase API error in {operation}: {e}")
            error_details = {
                "operation": operation,
                "status_code": getattr(e, 'status_code', None),
                "original_error": str(e)
            }
            
            if hasattr(e, 'details') and e.details:
                error_details.update(e.details)
            
            raise SupabaseError(
                f"Database operation failed: {operation}",
                error_code="API_ERROR",
                details=error_details
            )
        except Exception as e:
            logger.error(f"Unexpected error in {operation}: {e}")
            raise SupabaseError(
                f"Unexpected error in {operation}",
                error_code="UNEXPECTED_ERROR",
                details={"operation": operation, "original_error": str(e)}
            )
    
    def _ensure_timezone_aware(self, dt: Union[datetime, str, None]) -> Optional[str]:
        """Ensure datetime is timezone-aware and properly formatted"""
        if dt is None:
            return None
        
        if isinstance(dt, str):
            try:
                # Try to parse the string and make it timezone-aware
                parsed_dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
                if parsed_dt.tzinfo is None:
                    parsed_dt = parsed_dt.replace(tzinfo=timezone.utc)
                return parsed_dt.isoformat()
            except ValueError:
                logger.warning(f"Invalid datetime string: {dt}")
                return None
        
        if isinstance(dt, datetime):
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.isoformat()
        
        return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID with proper error handling"""
        async with self._handle_supabase_errors("get_user_by_id"):
            try:
                response = self.client.table("users").select("*").eq("id", user_id).single().execute()
                
                if response.data:
                    # Ensure proper timezone handling
                    user_data = response.data.copy()
                    for field in ['created_at', 'last_active', 'familiarization_completed_at']:
                        if field in user_data and user_data[field]:
                            user_data[field] = self._ensure_timezone_aware(user_data[field])
                    
                    return user_data
                return None
                
            except APIError as e:
                if "PGRST116" in str(e):  # Not found
                    return None
                raise
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile - alias for get_user_by_id"""
        return await self.get_user_by_id(user_id)
    
    async def create_user_profile(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user profile with proper validation"""
        async with self._handle_supabase_errors("create_user_profile"):
            # Ensure required fields
            required_fields = ['id', 'email']
            for field in required_fields:
                if field not in user_data:
                    raise SupabaseError(
                        f"Missing required field: {field}",
                        error_code="VALIDATION_ERROR"
                    )
            
            # Set defaults and ensure timezone awareness
            profile_data = {
                'id': user_data['id'],
                'email': user_data['email'],
                'created_at': self._ensure_timezone_aware(datetime.now(timezone.utc)),
                'last_active': self._ensure_timezone_aware(datetime.now(timezone.utc)),
                'level': user_data.get('level', 1),
                'points': user_data.get('points', 0),
                'silver_keys': user_data.get('silver_keys', 0),
                'gold_keys': user_data.get('gold_keys', 0),
                'familiarization_completed': user_data.get('familiarization_completed', False),
                'motivation_level': user_data.get('motivation_level', 5)
            }
            
            response = self.client.table("users").insert(profile_data).select().single().execute()
            return response.data
    
    async def update_user_profile(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile with validation and timezone handling"""
        async with self._handle_supabase_errors("update_user_profile"):
            # Always update last_active
            updates["last_active"] = self._ensure_timezone_aware(datetime.now(timezone.utc))
            
            # Handle timezone-aware fields
            timezone_fields = ['familiarization_completed_at']
            for field in timezone_fields:
                if field in updates and updates[field]:
                    updates[field] = self._ensure_timezone_aware(updates[field])
            
            # Validate constraints
            if 'level' in updates and updates['level'] <= 0:
                raise SupabaseError(
                    "Level must be positive",
                    error_code="VALIDATION_ERROR"
                )
            
            if 'motivation_level' in updates:
                level = updates['motivation_level']
                if level < 1 or level > 10:
                    raise SupabaseError(
                        "Motivation level must be between 1 and 10",
                        error_code="VALIDATION_ERROR"
                    )
            
            response = self.client.table("users").update(updates).eq("id", user_id).select().single().execute()
            return response.data
    
    async def save_chat_message(
        self,
        user_id: str,
        sender: str,
        content: str,
        path: str = "main",
        emotion: Optional[str] = None
    ) -> Dict[str, Any]:
        """Save a chat message with validation"""
        async with self._handle_supabase_errors("save_chat_message"):
            # Validate input
            if not content or not content.strip():
                raise SupabaseError(
                    "Message content cannot be empty",
                    error_code="VALIDATION_ERROR"
                )
            
            if sender not in ['user', 'lumi']:
                raise SupabaseError(
                    "Invalid sender type",
                    error_code="VALIDATION_ERROR"
                )
            
            message_data = {
                "user_id": user_id,
                "sender": sender,
                "content": content.strip(),
                "path": path,
                "timestamp": self._ensure_timezone_aware(datetime.now(timezone.utc))
            }
            
            response = self.client.table("chat_messages").insert(message_data).select().single().execute()
            return response.data
    
    async def get_chat_history(
        self,
        user_id: str,
        path: str = "main",
        limit: int = 50,
        before_timestamp: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get chat history with pagination support"""
        async with self._handle_supabase_errors("get_chat_history"):
            query = (
                self.client.table("chat_messages")
                .select("*")
                .eq("user_id", user_id)
                .eq("path", path)
                .order("timestamp", desc=False)
                .limit(limit)
            )
            
            if before_timestamp:
                query = query.lt("timestamp", before_timestamp)
            
            response = query.execute()
            
            # Ensure timezone handling in response
            messages = []
            for msg in response.data:
                msg_copy = msg.copy()
                if 'timestamp' in msg_copy:
                    msg_copy['timestamp'] = self._ensure_timezone_aware(msg_copy['timestamp'])
                messages.append(msg_copy)
            
            return messages
    
    async def get_recent_messages(
        self,
        user_id: str,
        path: str = "main",
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent messages for context"""
        async with self._handle_supabase_errors("get_recent_messages"):
            response = (
                self.client.table("chat_messages")
                .select("sender, content, timestamp")
                .eq("user_id", user_id)
                .eq("path", path)
                .order("timestamp", desc=True)
                .limit(limit)
                .execute()
            )
            
            # Return in chronological order
            return list(reversed(response.data))
    
    async def clear_chat_history(self, user_id: str, path: Optional[str] = None):
        """Clear chat history for a user with optional path filter"""
        async with self._handle_supabase_errors("clear_chat_history"):
            query = self.client.table("chat_messages").delete().eq("user_id", user_id)
            
            if path:
                query = query.eq("path", path)
            
            query.execute()
            logger.info(f"Cleared chat history for user {user_id}, path: {path or 'all'}")
    
    async def process_familiarization(
        self,
        user_id: str,
        answers: List[str]
    ) -> Dict[str, Any]:
        """Process familiarization answers with improved analysis"""
        async with self._handle_supabase_errors("process_familiarization"):
            if len(answers) < 3:
                raise SupabaseError(
                    "Insufficient familiarization answers",
                    error_code="VALIDATION_ERROR"
                )
            
            # Enhanced keyword-based processing
            all_text = " ".join(answers).lower()
            
            # Determine primary path with better scoring
            path_scores = {
                'fitness': 0,
                'nutrition': 0,
                'mental-strength': 0,
                'general': 0
            }
            
            # Fitness keywords
            fitness_keywords = [
                'fitness', 'workout', 'exercise', 'strength', 'gym', 'training',
                'muscle', 'cardio', 'running', 'lifting', 'sports', 'athletic'
            ]
            path_scores['fitness'] = sum(1 for word in fitness_keywords if word in all_text)
            
            # Nutrition keywords
            nutrition_keywords = [
                'nutrition', 'diet', 'eating', 'food', 'meal', 'healthy eating',
                'weight loss', 'calories', 'vitamins', 'cooking', 'recipes'
            ]
            path_scores['nutrition'] = sum(1 for word in nutrition_keywords if word in all_text)
            
            # Mental strength keywords
            mental_keywords = [
                'mental', 'stress', 'anxiety', 'mindfulness', 'meditation',
                'emotional', 'therapy', 'counseling', 'depression', 'mood'
            ]
            path_scores['mental-strength'] = sum(1 for word in mental_keywords if word in all_text)
            
            # Determine primary path
            primary_path = max(path_scores, key=path_scores.get)
            if path_scores[primary_path] == 0:
                primary_path = 'general'
            
            # Extract motivation level with better parsing
            motivation_level = 5  # default
            import re
            
            # Look for numbers in the motivation-related answer (typically answer 2)
            if len(answers) > 1:
                motivation_text = answers[1].lower()
                # Look for patterns like "8/10", "8 out of 10", "level 8", etc.
                patterns = [
                    r'(\d+)/10',
                    r'(\d+)\s*out\s*of\s*10',
                    r'level\s*(\d+)',
                    r'(\d+)\s*(?:very|quite|really)',
                    r'\b(\d+)\b'
                ]
                
                for pattern in patterns:
                    match = re.search(pattern, motivation_text)
                    if match:
                        try:
                            level = int(match.group(1))
                            if 1 <= level <= 10:
                                motivation_level = level
                                break
                        except ValueError:
                            continue
            
            # Enhanced challenge identification
            main_challenges = []
            challenge_keywords = {
                'time_management': ['time', 'busy', 'schedule', 'work', 'no time'],
                'consistency': ['consistent', 'motivation', 'stick to', 'give up', 'quit'],
                'knowledge_gap': ['don\'t know', 'learn', 'understand', 'confused', 'help'],
                'social_support': ['alone', 'support', 'friends', 'family', 'lonely'],
                'physical_limitations': ['injury', 'pain', 'disability', 'health issues'],
                'financial_constraints': ['money', 'expensive', 'cost', 'afford', 'budget']
            }
            
            for challenge, keywords in challenge_keywords.items():
                if any(keyword in all_text for keyword in keywords):
                    main_challenges.append(challenge)
            
            # Enhanced support needs identification
            support_needs = []
            support_keywords = {
                'encouragement': ['encourage', 'motivate', 'support', 'cheer', 'positive'],
                'structured_guidance': ['plan', 'structure', 'guide', 'step by step', 'routine'],
                'progress_tracking': ['track', 'progress', 'monitor', 'measure', 'results'],
                'accountability': ['accountable', 'check in', 'remind', 'follow up'],
                'education': ['learn', 'teach', 'explain', 'understand', 'knowledge'],
                'community': ['group', 'others', 'community', 'social', 'together']
            }
            
            for need, keywords in support_keywords.items():
                if any(keyword in all_text for keyword in keywords):
                    support_needs.append(need)
            
            # Update user profile
            updates = {
                "familiarization_completed": True,
                "familiarization_completed_at": self._ensure_timezone_aware(datetime.now(timezone.utc)),
                "familiarization_answers": answers,
                "primary_path": primary_path,
                "motivation_level": motivation_level,
                "main_challenges": main_challenges,
                "support_needs": support_needs
            }
            
            await self.update_user_profile(user_id, updates)
            
            logger.info(f"Processed familiarization for user {user_id}: path={primary_path}, motivation={motivation_level}")
            
            return {
                "primary_path": primary_path,
                "motivation_level": motivation_level,
                "main_challenges": main_challenges,
                "support_needs": support_needs
            }
    
    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user statistics using database function"""
        async with self._handle_supabase_errors("get_user_stats"):
            try:
                # Use the database function for better performance
                response = self.client.rpc('get_user_statistics', {'user_uuid': user_id}).execute()
                
                if response.data:
                    return response.data
                else:
                    # Fallback to manual calculation
                    return await self._calculate_user_stats_fallback(user_id)
                    
            except APIError:
                # Fallback if function doesn't exist
                return await self._calculate_user_stats_fallback(user_id)
    
    async def _calculate_user_stats_fallback(self, user_id: str) -> Dict[str, Any]:
        """Fallback method for calculating user statistics"""
        # Get message count
        messages_response = (
            self.client.table("chat_messages")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        
        # Get user profile
        profile = await self.get_user_profile(user_id)
        
        # Get quest statistics
        quests_response = (
            self.client.table("quests")
            .select("completed", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        
        completed_quests = len([q for q in quests_response.data if q.get('completed', False)])
        total_quests = len(quests_response.data)
        
        return {
            "total_messages": messages_response.count or 0,
            "messages_this_week": 0,  # Would need more complex query
            "completed_quests": completed_quests,
            "active_quests": total_quests - completed_quests,
            "total_points": profile.get("points", 0) if profile else 0,
            "current_level": profile.get("level", 1) if profile else 1,
            "days_active": 1,  # Placeholder
            "favorite_path": profile.get("primary_path") if profile else None,
            "progress_percentage": min(100, (profile.get("points", 0) / 1000) * 100) if profile else 0
        }
    
    async def create_quest(
        self,
        user_id: str,
        path: str,
        quest_id: int,
        text: str,
        points: int
    ) -> Dict[str, Any]:
        """Create a new quest for a user"""
        async with self._handle_supabase_errors("create_quest"):
            quest_data = {
                "user_id": user_id,
                "path": path,
                "quest_id": quest_id,
                "text": text,
                "points": points,
                "completed": False
            }
            
            response = self.client.table("quests").insert(quest_data).select().single().execute()
            return response.data
    
    async def complete_quest(self, user_id: str, quest_id: int) -> Dict[str, Any]:
        """Mark a quest as completed and award points"""
        async with self._handle_supabase_errors("complete_quest"):
            # Get quest details
            quest_response = (
                self.client.table("quests")
                .select("*")
                .eq("id", quest_id)
                .eq("user_id", user_id)
                .single()
                .execute()
            )
            
            if not quest_response.data:
                raise SupabaseError(
                    "Quest not found",
                    error_code="NOT_FOUND"
                )
            
            quest = quest_response.data
            if quest['completed']:
                raise SupabaseError(
                    "Quest already completed",
                    error_code="ALREADY_COMPLETED"
                )
            
            # Mark quest as completed
            self.client.table("quests").update({"completed": True}).eq("id", quest_id).execute()
            
            # Award points to user
            user_profile = await self.get_user_profile(user_id)
            if user_profile:
                new_points = user_profile.get('points', 0) + quest['points']
                new_level = max(1, new_points // 100)  # Level up every 100 points
                
                await self.update_user_profile(user_id, {
                    'points': new_points,
                    'level': new_level
                })
            
            return quest
    
    async def get_user_quests(
        self,
        user_id: str,
        completed: Optional[bool] = None,
        path: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get user's quests with optional filters"""
        async with self._handle_supabase_errors("get_user_quests"):
            query = self.client.table("quests").select("*").eq("user_id", user_id)
            
            if completed is not None:
                query = query.eq("completed", completed)
            
            if path:
                query = query.eq("path", path)
            
            response = query.order("id", desc=True).execute()
            return response.data
    
    async def cleanup_old_data(self, days_to_keep: int = 365):
        """Clean up old data for GDPR compliance"""
        async with self._handle_supabase_errors("cleanup_old_data"):
            try:
                # Use the database function if available
                self.client.rpc('cleanup_old_chat_messages').execute()
                logger.info("Successfully cleaned up old data using database function")
            except APIError:
                # Fallback to manual cleanup
                cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_to_keep)
                cutoff_str = self._ensure_timezone_aware(cutoff_date)
                
                # Delete old chat messages
                self.client.table("chat_messages").delete().lt("timestamp", cutoff_str).execute()
                
                logger.info(f"Manually cleaned up chat messages older than {days_to_keep} days")
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform a health check on the Supabase connection"""
        try:
            # Simple query to test connection
            response = self.client.table("users").select("id").limit(1).execute()
            
            return {
                "status": "healthy",
                "timestamp": self._ensure_timezone_aware(datetime.now(timezone.utc)),
                "connection": "active"
            }
        except Exception as e:
            logger.error(f"Supabase health check failed: {e}")
            return {
                "status": "unhealthy",
                "timestamp": self._ensure_timezone_aware(datetime.now(timezone.utc)),
                "connection": "failed",
                "error": str(e)
            }