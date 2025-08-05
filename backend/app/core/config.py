"""
Configuration settings for the Chat Me backend application.
"""
import os
from typing import List, Optional
from pydantic import BaseSettings, validator
from pydantic.types import SecretStr

class Settings(BaseSettings):
    """Application settings with validation."""
    
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_KEY: SecretStr
    
    # Security
    SECRET_KEY: SecretStr
    
    # OpenAI Configuration
    OPENAI_API_KEY: SecretStr
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    OPENAI_MAX_TOKENS: int = 500
    OPENAI_TEMPERATURE: float = 0.7
    
    # Database Configuration
    DATABASE_URL: Optional[str] = None
    
    # Label Studio Configuration
    LABEL_STUDIO_URL: Optional[str] = None
    LABEL_STUDIO_API_KEY: Optional[SecretStr] = None
    
    # Application Settings
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "https://localhost:3000"]
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 900  # 15 minutes
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # Performance
    CACHE_TTL: int = 300  # 5 minutes
    MAX_MESSAGE_LENGTH: int = 2000
    MAX_CONVERSATION_HISTORY: int = 50
    
    @validator('ALLOWED_ORIGINS', pre=True)
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
    
    @validator('ENVIRONMENT')
    def validate_environment(cls, v):
        if v not in ['development', 'staging', 'production']:
            raise ValueError('ENVIRONMENT must be one of: development, staging, production')
        return v
    
    @validator('LOG_LEVEL')
    def validate_log_level(cls, v):
        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if v.upper() not in valid_levels:
            raise ValueError(f'LOG_LEVEL must be one of: {valid_levels}')
        return v.upper()
    
    @validator('OPENAI_TEMPERATURE')
    def validate_temperature(cls, v):
        if not 0 <= v <= 2:
            raise ValueError('OPENAI_TEMPERATURE must be between 0 and 2')
        return v
    
    @validator('RATE_LIMIT_REQUESTS')
    def validate_rate_limit(cls, v):
        if v <= 0:
            raise ValueError('RATE_LIMIT_REQUESTS must be positive')
        return v
    
    @validator('MAX_MESSAGE_LENGTH')
    def validate_message_length(cls, v):
        if v <= 0 or v > 10000:
            raise ValueError('MAX_MESSAGE_LENGTH must be between 1 and 10000')
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

# Create settings instance
settings = Settings()

# Additional computed properties
def get_database_url() -> str:
    """Get database URL with fallback."""
    if settings.DATABASE_URL:
        return settings.DATABASE_URL
    
    # Fallback to Supabase URL if no explicit DATABASE_URL
    return f"{settings.SUPABASE_URL}/rest/v1/"

def is_production() -> bool:
    """Check if running in production."""
    return settings.ENVIRONMENT == "production"

def is_development() -> bool:
    """Check if running in development."""
    return settings.ENVIRONMENT == "development"

def get_cors_origins() -> List[str]:
    """Get CORS origins based on environment."""
    if is_production():
        return [
            "https://chatme.app",
            "https://www.chatme.app",
            "https://app.chatme.app"
        ]
    return settings.ALLOWED_ORIGINS

# Logging configuration
import logging

def setup_logging():
    """Setup logging configuration."""
    log_level = getattr(logging, settings.LOG_LEVEL)
    
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('app.log') if is_production() else logging.NullHandler()
        ]
    )
    
    # Set specific logger levels
    logging.getLogger('uvicorn').setLevel(logging.INFO)
    logging.getLogger('fastapi').setLevel(logging.INFO)
    
    if is_development():
        logging.getLogger('app').setLevel(logging.DEBUG)