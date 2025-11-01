from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import hmac
import hashlib

from app.database import get_db
from app.core.config import settings
from app.models.instagram_account import InstagramAccount
from app.models.message import Conversation, Message
from app.models.automation_rule import AutomationRule, TriggerType, RuleStatus
from app.services.instagram_service import InstagramService

router = APIRouter()

@router.get("/instagram")
async def verify_webhook(request: Request):
    """
    Verify webhook endpoint for Instagram.
    Facebook will send a GET request to verify the webhook URL.
    """
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    
    # Verify token should match what you set in Facebook App settings
    verify_token = "instagram_dm_automation_verify_token"
    
    if mode == "subscribe" and token == verify_token:
        return int(challenge)
    else:
        raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/instagram")
async def instagram_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle incoming Instagram webhook events.
    Processes new messages and triggers automation rules.
    """
    body = await request.json()
    
    # Verify webhook signature (recommended for production)
    # signature = request.headers.get("X-Hub-Signature-256")
    # if not verify_signature(body, signature):
    #     raise HTTPException(status_code=403, detail="Invalid signature")
    
    # Process webhook payload
    for entry in body.get("entry", []):
        for messaging_event in entry.get("messaging", []):
            await process_messaging_event(messaging_event, db)
    
    return {"success": True}


async def process_messaging_event(event: dict, db: Session):
    """Process a single messaging event from webhook"""
    sender_id = event.get("sender", {}).get("id")
    recipient_id = event.get("recipient", {}).get("id")
    timestamp = event.get("timestamp")
    
    # Check if this is a message event
    message_data = event.get("message")
    if not message_data:
        return
    
    message_text = message_data.get("text", "")
    message_id = message_data.get("mid")
    
    # Find Instagram account
    instagram_account = db.query(InstagramAccount).filter(
        InstagramAccount.instagram_business_account_id == recipient_id
    ).first()
    
    if not instagram_account:
        return
    
    # Find or create conversation
    conversation = db.query(Conversation).filter(
        Conversation.instagram_account_id == instagram_account.id,
        Conversation.participant_id == sender_id
    ).first()
    
    if not conversation:
        conversation = Conversation(
            instagram_account_id=instagram_account.id,
            thread_id=f"t_{sender_id}_{recipient_id}",
            participant_id=sender_id,
            last_message_time=datetime.fromtimestamp(timestamp / 1000)
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    else:
        conversation.last_message_time = datetime.fromtimestamp(timestamp / 1000)
        conversation.unread_count += 1
    
    # Save message
    message = Message(
        conversation_id=conversation.id,
        message_id=message_id,
        sender_id=sender_id,
        recipient_id=recipient_id,
        message_text=message_text,
        is_from_me=False,
        sent_at=datetime.fromtimestamp(timestamp / 1000)
    )
    db.add(message)
    db.commit()
    
    # Check automation rules
    await check_automation_rules(
        instagram_account,
        conversation,
        message_text,
        sender_id,
        db
    )


async def check_automation_rules(
    instagram_account: InstagramAccount,
    conversation: Conversation,
    message_text: str,
    sender_id: str,
    db: Session
):
    """Check if any automation rules should be triggered"""
    # Get active rules for this account
    rules = db.query(AutomationRule).filter(
        AutomationRule.instagram_account_id == instagram_account.id,
        AutomationRule.status == RuleStatus.ACTIVE
    ).order_by(AutomationRule.priority.desc()).all()
    
    for rule in rules:
        should_trigger = False
        
        # Check trigger type
        if rule.trigger_type == TriggerType.NEW_MESSAGE:
            should_trigger = True
        
        elif rule.trigger_type == TriggerType.KEYWORD:
            if rule.trigger_keywords:
                message_lower = message_text.lower()
                for keyword in rule.trigger_keywords:
                    if keyword.lower() in message_lower:
                        should_trigger = True
                        break
        
        elif rule.trigger_type == TriggerType.WELCOME:
            # Check if this is first message from user
            message_count = db.query(Message).filter(
                Message.conversation_id == conversation.id,
                Message.is_from_me == False
            ).count()
            should_trigger = (message_count == 1)
        
        if should_trigger:
            # Send automated reply
            try:
                await InstagramService.send_message(
                    instagram_account,
                    sender_id,
                    rule.reply_message
                )
                
                # Update rule statistics
                rule.triggered_count += 1
                rule.success_count += 1
                rule.last_triggered_at = datetime.utcnow()
                
                # Save automated message to database
                auto_message = Message(
                    conversation_id=conversation.id,
                    message_id=f"auto_{datetime.utcnow().timestamp()}",
                    sender_id=instagram_account.instagram_business_account_id,
                    recipient_id=sender_id,
                    message_text=rule.reply_message,
                    is_from_me=True,
                    is_automated=True,
                    automation_rule_id=rule.id,
                    sent_at=datetime.utcnow()
                )
                db.add(auto_message)
                db.commit()
                
                # Only trigger first matching rule (by priority)
                break
                
            except Exception as e:
                rule.triggered_count += 1
                rule.failure_count += 1
                db.commit()
                print(f"Error sending automated reply: {e}")


def verify_signature(payload: dict, signature: str) -> bool:
    """Verify webhook signature from Facebook"""
    if not signature:
        return False
    
    expected_signature = hmac.new(
        settings.FACEBOOK_APP_SECRET.encode(),
        str(payload).encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(f"sha256={expected_signature}", signature)
