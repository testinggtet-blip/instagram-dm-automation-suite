from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = Field(default="postgresql://user:password@localhost:5432/instagram_dm_automation")
    
    # Facebook/Instagram API
    FACEBOOK_APP_ID: str = Field(default="")
    FACEBOOK_APP_SECRET: str = Field(default="")
    FACEBOOK_REDIRECT_URI: str = Field(default="http://localhost:8000/api/auth/callback")
    
    # JWT
    SECRET_KEY: str = Field(default="your-secret-key-change-in-production")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    
    # Frontend
    FRONTEND_URL: str = Field(default="http://localhost:3000")
    
    # API
    API_HOST: str = Field(default="0.0.0.0")
    API_PORT: int = Field(default=8000)
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
