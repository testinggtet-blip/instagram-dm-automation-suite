from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    instagram_account_id = Column(Integer, ForeignKey("instagram_accounts.id"), nullable=False)
    thread_id = Column(String, unique=True, index=True, nullable=False)  # Instagram thread ID
    participant_id = Column(String)  # Instagram user ID of the other person
    participant_username = Column(String)
    participant_profile_pic = Column(String)
    last_message_time = Column(DateTime)
    unread_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    instagram_account = relationship("InstagramAccount", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    message_id = Column(String, unique=True, index=True)  # Instagram message ID
    sender_id = Column(String)  # Instagram user ID of sender
    recipient_id = Column(String)  # Instagram user ID of recipient
    message_text = Column(Text)
    message_type = Column(String, default="text")  # text, image, video, etc.
    attachments = Column(JSON)  # Store attachment URLs and metadata
    is_from_me = Column(Boolean, default=False)
    is_automated = Column(Boolean, default=False)  # Was this sent by automation?
    automation_rule_id = Column(Integer, ForeignKey("automation_rules.id"), nullable=True)
    sent_at = Column(DateTime)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
