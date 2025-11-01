from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.instagram_account import InstagramAccount
from app.models.message import Conversation, Message
from app.services.auth_service import get_current_user
from app.services.instagram_service import InstagramService
from app.schemas.instagram import (
    InstagramAccountResponse,
    ConnectInstagramAccountRequest,
    ConversationResponse,
    MessageResponse,
    SendMessageRequest
)

router = APIRouter()

@router.get("/accounts", response_model=List[dict])
async def get_available_instagram_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all Instagram Business accounts available for the user"""
    try:
        accounts = await InstagramService.get_instagram_accounts(current_user)
        return accounts
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/connect", response_model=InstagramAccountResponse)
async def connect_instagram_account(
    account_data: ConnectInstagramAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Connect an Instagram Business account to the user"""
    # Check if account already exists
    existing = db.query(InstagramAccount).filter(
        InstagramAccount.instagram_business_account_id == account_data.instagram_business_account_id
    ).first()
    
    if existing:
        # Update existing account
        existing.username = account_data.username
        existing.profile_picture_url = account_data.profile_picture_url
        existing.page_id = account_data.page_id
        existing.page_access_token = account_data.page_access_token
        existing.is_active = True
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    
    # Create new account
    instagram_account = InstagramAccount(
        user_id=current_user.id,
        instagram_business_account_id=account_data.instagram_business_account_id,
        username=account_data.username,
        profile_picture_url=account_data.profile_picture_url,
        page_id=account_data.page_id,
        page_access_token=account_data.page_access_token
    )
    
    db.add(instagram_account)
    db.commit()
    db.refresh(instagram_account)
    
    return instagram_account


@router.get("/connected-accounts", response_model=List[InstagramAccountResponse])
async def get_connected_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all connected Instagram accounts for the current user"""
    accounts = db.query(InstagramAccount).filter(
        InstagramAccount.user_id == current_user.id,
        InstagramAccount.is_active == True
    ).all()
    
    return accounts


@router.get("/accounts/{account_id}/conversations", response_model=List[dict])
async def get_account_conversations(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all conversations for an Instagram account"""
    instagram_account = db.query(InstagramAccount).filter(
        InstagramAccount.id == account_id,
        InstagramAccount.user_id == current_user.id
    ).first()
    
    if not instagram_account:
        raise HTTPException(status_code=404, detail="Instagram account not found")
    
    try:
        conversations = await InstagramService.get_conversations(instagram_account, db)
        return conversations
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/conversations/{conversation_id}/messages", response_model=List[dict])
async def get_conversation_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all messages from a conversation"""
    conversation = db.query(Conversation).join(InstagramAccount).filter(
        Conversation.id == conversation_id,
        InstagramAccount.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    try:
        messages = await InstagramService.get_messages(
            conversation,
            conversation.instagram_account
        )
        return messages
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/send-message")
async def send_message(
    message_data: SendMessageRequest,
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message to a user"""
    instagram_account = db.query(InstagramAccount).filter(
        InstagramAccount.id == account_id,
        InstagramAccount.user_id == current_user.id
    ).first()
    
    if not instagram_account:
        raise HTTPException(status_code=404, detail="Instagram account not found")
    
    try:
        result = await InstagramService.send_message(
            instagram_account,
            message_data.recipient_id,
            message_data.message_text
        )
        
        # Save message to database if conversation_id provided
        if message_data.conversation_id:
            conversation = db.query(Conversation).filter(
                Conversation.id == message_data.conversation_id
            ).first()
            
            if conversation:
                message = Message(
                    conversation_id=conversation.id,
                    message_id=result.get("message_id", ""),
                    sender_id=instagram_account.instagram_business_account_id,
                    recipient_id=message_data.recipient_id,
                    message_text=message_data.message_text,
                    is_from_me=True,
                    sent_at=datetime.utcnow()
                )
                db.add(message)
                db.commit()
        
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/accounts/{account_id}")
async def disconnect_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disconnect an Instagram account"""
    instagram_account = db.query(InstagramAccount).filter(
        InstagramAccount.id == account_id,
        InstagramAccount.user_id == current_user.id
    ).first()
    
    if not instagram_account:
        raise HTTPException(status_code=404, detail="Instagram account not found")
    
    instagram_account.is_active = False
    db.commit()
    
    return {"success": True, "message": "Account disconnected"}
