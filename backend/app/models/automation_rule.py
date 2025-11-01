from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

class TriggerType(str, enum.Enum):
    KEYWORD = "keyword"
    NEW_MESSAGE = "new_message"
    SCHEDULED = "scheduled"
    WELCOME = "welcome"

class RuleStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PAUSED = "paused"

class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id = Column(Integer, primary_key=True, index=True)
    instagram_account_id = Column(Integer, ForeignKey("instagram_accounts.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    trigger_type = Column(Enum(TriggerType), nullable=False)
    trigger_keywords = Column(JSON)  # Array of keywords for keyword trigger
    trigger_schedule = Column(JSON)  # Schedule configuration for scheduled messages
    reply_message = Column(Text, nullable=False)
    reply_delay_seconds = Column(Integer, default=0)  # Delay before sending reply
    status = Column(Enum(RuleStatus), default=RuleStatus.ACTIVE)
    priority = Column(Integer, default=0)  # Higher priority rules are checked first
    max_triggers_per_user = Column(Integer, nullable=True)  # Limit triggers per user
    cooldown_minutes = Column(Integer, nullable=True)  # Cooldown between triggers
    
    # Statistics
    triggered_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    last_triggered_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    instagram_account = relationship("InstagramAccount", back_populates="automation_rules")
