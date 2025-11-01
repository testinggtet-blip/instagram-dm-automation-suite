from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/instagram_automation"
    
    # Facebook/Instagram API
    FACEBOOK_APP_ID: str
    FACEBOOK_APP_SECRET: str
    FACEBOOK_REDIRECT_URI: str
    INSTAGRAM_API_VERSION: str = "v21.0"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200
    
    # Server
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Webhook
    WEBHOOK_VERIFY_TOKEN: str
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
