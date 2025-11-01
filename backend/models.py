from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    facebook_user_id = Column(String(255), unique=True, nullable=False, index=True)
    facebook_access_token = Column(Text, nullable=True)
    facebook_token_expires_at = Column(DateTime, nullable=True)
    
    instagram_account_id = Column(String(255), nullable=True, index=True)
    instagram_username = Column(String(255), nullable=True)
    instagram_access_token = Column(Text, nullable=True)
    instagram_token_expires_at = Column(DateTime, nullable=True)
    
    name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    profile_picture_url = Column(Text, nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    automation_rules = relationship("AutomationRule", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    message_logs = relationship("MessageLog", back_populates="user", cascade="all, delete-orphan")


class AutomationRule(Base):
    __tablename__ = "automation_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    trigger_type = Column(String(50), nullable=False)  # keyword, new_message, time
    trigger_config = Column(JSON, nullable=True)  # {keywords: [], time: ""}
    
    action_type = Column(String(50), nullable=False)  # auto_reply, forward
    action_config = Column(JSON, nullable=False)  # {message_template: "", forward_to: ""}
    
    is_enabled = Column(Boolean, default=True)
    priority = Column(Integer, default=0)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="automation_rules")


class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    conversation_id = Column(String(255), unique=True, nullable=False, index=True)
    participant_id = Column(String(255), nullable=False)
    participant_username = Column(String(255), nullable=True)
    participant_name = Column(String(255), nullable=True)
    participant_profile_pic = Column(Text, nullable=True)
    
    last_message_text = Column(Text, nullable=True)
    last_message_time = Column(DateTime, nullable=True)
    unread_count = Column(Integer, default=0)
    
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    
    message_id = Column(String(255), unique=True, nullable=False, index=True)
    sender_id = Column(String(255), nullable=False)
    sender_username = Column(String(255), nullable=True)
    
    message_text = Column(Text, nullable=True)
    message_type = Column(String(50), default="text")  # text, image, video, etc.
    
    is_from_user = Column(Boolean, default=False)  # False if from customer, True if from automation
    is_automated = Column(Boolean, default=False)
    
    timestamp = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")


class MessageLog(Base):
    __tablename__ = "message_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    conversation_id = Column(String(255), nullable=False)
    participant_username = Column(String(255), nullable=True)
    
    message_text = Column(Text, nullable=False)
    message_type = Column(String(50), default="sent")  # sent, received
    
    is_automated = Column(Boolean, default=False)
    automation_rule_id = Column(Integer, ForeignKey("automation_rules.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(String(50), default="success")  # success, failed
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="message_logs")
