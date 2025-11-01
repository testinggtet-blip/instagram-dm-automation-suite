from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class InstagramAccount(Base):
    __tablename__ = "instagram_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    instagram_business_account_id = Column(String, unique=True, index=True, nullable=False)
    username = Column(String)
    profile_picture_url = Column(String)
    page_id = Column(String)  # Facebook Page ID
    page_access_token = Column(String)  # Page access token for API calls
    token_expires_at = Column(DateTime)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="instagram_accounts")
    conversations = relationship("Conversation", back_populates="instagram_account", cascade="all, delete-orphan")
    automation_rules = relationship("AutomationRule", back_populates="instagram_account", cascade="all, delete-orphan")
