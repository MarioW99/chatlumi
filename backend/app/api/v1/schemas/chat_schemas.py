"""
Chat-related Pydantic schemas with enhanced validation.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, validator, Field
import re

class ChatMessageRequest(BaseModel):
    """Request schema for chat messages with comprehensive validation."""
    
    message: str = Field(..., min_length=1, max_length=2000, description="Message content")
    agent_type: str = Field(..., description="Type of AI agent to use")
    path: Optional[str] = Field(None, description="Chat path/context")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    
    @validator('message')
    def validate_message(cls, v):
        """Validate and sanitize message content."""
        if not v or not v.strip():
            raise ValueError('Message cannot be empty')
        
        # Remove excessive whitespace
        v = ' '.join(v.split())
        
        # Basic XSS protection
        dangerous_patterns = [
            r'<script[^>]*>',
            r'javascript:',
            r'on\w+\s*=',
            r'data:text/html',
            r'vbscript:',
            r'<iframe[^>]*>',
            r'<object[^>]*>',
            r'<embed[^>]*>'
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError('Message contains potentially unsafe content')
        
        return v.strip()
    
    @validator('agent_type')
    def validate_agent_type(cls, v):
        """Validate agent type."""
        valid_agents = ['main', 'fitness', 'nutrition', 'mental-strength']
        if v not in valid_agents:
            raise ValueError(f'Invalid agent type. Must be one of: {valid_agents}')
        return v
    
    @validator('path')
    def validate_path(cls, v):
        """Validate chat path."""
        if v is not None:
            # Only allow alphanumeric, hyphens, and underscores
            if not re.match(r'^[a-zA-Z0-9_-]+$', v):
                raise ValueError('Path can only contain letters, numbers, hyphens, and underscores')
        return v

class ChatMessageResponse(BaseModel):
    """Response schema for chat messages."""
    
    response: str = Field(..., description="AI agent response")
    emotion: Optional[str] = Field(None, description="Detected emotion")
    suggestions: Optional[List[str]] = Field(None, description="Suggested follow-up messages")
    agent_type: Optional[str] = Field(None, description="Agent type used")
    error: Optional[str] = Field(None, description="Error message if any")
    
    @validator('response')
    def validate_response(cls, v):
        """Validate response content."""
        if not v or not v.strip():
            raise ValueError('Response cannot be empty')
        return v.strip()
    
    @validator('emotion')
    def validate_emotion(cls, v):
        """Validate emotion field."""
        if v is not None:
            valid_emotions = [
                'positive', 'negative', 'neutral', 'concerned', 
                'supportive', 'understanding', 'curious', 'warm', 'apologetic'
            ]
            if v not in valid_emotions:
                raise ValueError(f'Invalid emotion. Must be one of: {valid_emotions}')
        return v

class ChatHistoryResponse(BaseModel):
    """Response schema for chat history."""
    
    id: int = Field(..., description="Message ID")
    sender: str = Field(..., description="Message sender")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(..., description="Message timestamp")
    path: Optional[str] = Field(None, description="Chat path")
    emotion: Optional[str] = Field(None, description="Detected emotion")
    
    @validator('sender')
    def validate_sender(cls, v):
        """Validate sender field."""
        valid_senders = ['user', 'lumi']
        if v not in valid_senders:
            raise ValueError(f'Invalid sender. Must be one of: {valid_senders}')
        return v

class AgentResponse(BaseModel):
    """Response schema for AI agent processing."""
    
    response: str = Field(..., description="AI agent response")
    emotion: Optional[str] = Field(None, description="Detected emotion")
    suggestions: Optional[List[str]] = Field(None, description="Suggested follow-up messages")
    error: Optional[str] = Field(None, description="Error message if any")
    
    @validator('response')
    def validate_response(cls, v):
        """Validate response content."""
        if not v or not v.strip():
            raise ValueError('Response cannot be empty')
        return v.strip()

class AgentContext(BaseModel):
    """Context schema for AI agent processing."""
    
    user_id: Optional[str] = Field(None, description="User ID")
    path: Optional[str] = Field(None, description="Chat path")
    previous_messages: Optional[List[Dict[str, Any]]] = Field(None, description="Previous messages")
    user_profile: Optional[Dict[str, Any]] = Field(None, description="User profile data")
    
    @validator('user_id')
    def validate_user_id(cls, v):
        """Validate user ID format."""
        if v is not None:
            # UUID format validation
            uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            if not re.match(uuid_pattern, v, re.IGNORECASE):
                raise ValueError('Invalid user ID format')
        return v

class ChatHealthResponse(BaseModel):
    """Response schema for chat health check."""
    
    total_messages: int = Field(..., description="Total number of messages")
    recent_activity: bool = Field(..., description="Whether there's recent activity")
    agent_status: str = Field(..., description="Agent service status")
    last_message_time: Optional[datetime] = Field(None, description="Last message timestamp")
    
    @validator('agent_status')
    def validate_agent_status(cls, v):
        """Validate agent status."""
        valid_statuses = ['active', 'inactive', 'degraded']
        if v not in valid_statuses:
            raise ValueError(f'Invalid agent status. Must be one of: {valid_statuses}')
        return v