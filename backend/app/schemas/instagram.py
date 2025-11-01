from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict

class InstagramAccountResponse(BaseModel):
    id: int
    instagram_business_account_id: str
    username: Optional[str]
    profile_picture_url: Optional[str]
    page_id: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConnectInstagramAccountRequest(BaseModel):
    instagram_business_account_id: str
    username: Optional[str]
    profile_picture_url: Optional[str]
    page_id: str
    page_access_token: str

class ConversationResponse(BaseModel):
    id: int
    thread_id: str
    participant_id: Optional[str]
    participant_username: Optional[str]
    participant_profile_pic: Optional[str]
    last_message_time: Optional[datetime]
    unread_count: int
    
    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: int
    message_id: str
    sender_id: str
    recipient_id: str
    message_text: Optional[str]
    message_type: str
    attachments: Optional[Dict]
    is_from_me: bool
    is_automated: bool
    sent_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class SendMessageRequest(BaseModel):
    recipient_id: str
    message_text: str
    conversation_id: Optional[int]
