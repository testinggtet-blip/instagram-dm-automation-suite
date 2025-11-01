import httpx
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.instagram_account import InstagramAccount
from app.models.message import Conversation, Message
from app.models.user import User


class InstagramService:
    """Service for interacting with Instagram Graph API"""
    
    BASE_URL = "https://graph.facebook.com/v18.0"
    
    @staticmethod
    async def get_instagram_accounts(user: User) -> List[Dict]:
        """Fetch user's Instagram Business accounts connected to Facebook Pages"""
        async with httpx.AsyncClient() as client:
            # Get user's Facebook pages
            response = await client.get(
                f"{InstagramService.BASE_URL}/me/accounts",
                params={
                    "access_token": user.access_token,
                    "fields": "id,name,access_token,instagram_business_account"
                }
            )
            
            if response.status_code != 200:
                raise Exception("Failed to fetch Facebook pages")
            
            pages_data = response.json()
            instagram_accounts = []
            
            for page in pages_data.get("data", []):
                if "instagram_business_account" in page:
                    ig_account_id = page["instagram_business_account"]["id"]
                    
                    # Get Instagram account details
                    ig_response = await client.get(
                        f"{InstagramService.BASE_URL}/{ig_account_id}",
                        params={
                            "access_token": page["access_token"],
                            "fields": "id,username,profile_picture_url"
                        }
                    )
                    
                    if ig_response.status_code == 200:
                        ig_data = ig_response.json()
                        instagram_accounts.append({
                            "instagram_business_account_id": ig_data["id"],
                            "username": ig_data.get("username"),
                            "profile_picture_url": ig_data.get("profile_picture_url"),
                            "page_id": page["id"],
                            "page_name": page["name"],
                            "page_access_token": page["access_token"]
                        })
            
            return instagram_accounts
    
    @staticmethod
    async def get_conversations(instagram_account: InstagramAccount, db: Session) -> List[Dict]:
        """Fetch all conversations for an Instagram account"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{InstagramService.BASE_URL}/{instagram_account.instagram_business_account_id}/conversations",
                params={
                    "access_token": instagram_account.page_access_token,
                    "fields": "id,updated_time,participants"
                }
            )
            
            if response.status_code != 200:
                raise Exception("Failed to fetch conversations")
            
            conversations_data = response.json()
            result = []
            
            for conv_data in conversations_data.get("data", []):
                # Get or create conversation in database
                conversation = db.query(Conversation).filter(
                    Conversation.thread_id == conv_data["id"]
                ).first()
                
                participants = conv_data.get("participants", {}).get("data", [])
                other_participant = None
                for p in participants:
                    if p["id"] != instagram_account.instagram_business_account_id:
                        other_participant = p
                        break
                
                if not conversation and other_participant:
                    conversation = Conversation(
                        instagram_account_id=instagram_account.id,
                        thread_id=conv_data["id"],
                        participant_id=other_participant.get("id"),
                        participant_username=other_participant.get("username"),
                        last_message_time=datetime.fromisoformat(
                            conv_data["updated_time"].replace("Z", "+00:00")
                        )
                    )
                    db.add(conversation)
                    db.commit()
                    db.refresh(conversation)
                
                if conversation:
                    result.append({
                        "id": conversation.id,
                        "thread_id": conversation.thread_id,
                        "participant_id": conversation.participant_id,
                        "participant_username": conversation.participant_username,
                        "last_message_time": conversation.last_message_time,
                        "unread_count": conversation.unread_count
                    })
            
            return result
    
    @staticmethod
    async def get_messages(conversation: Conversation, instagram_account: InstagramAccount) -> List[Dict]:
        """Fetch messages from a conversation"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{InstagramService.BASE_URL}/{conversation.thread_id}/messages",
                params={
                    "access_token": instagram_account.page_access_token,
                    "fields": "id,from,to,message,created_time,attachments"
                }
            )
            
            if response.status_code != 200:
                raise Exception("Failed to fetch messages")
            
            messages_data = response.json()
            result = []
            
            for msg_data in messages_data.get("data", []):
                result.append({
                    "id": msg_data.get("id"),
                    "sender_id": msg_data.get("from", {}).get("id"),
                    "message_text": msg_data.get("message"),
                    "created_time": msg_data.get("created_time"),
                    "attachments": msg_data.get("attachments", {}).get("data", [])
                })
            
            return result
    
    @staticmethod
    async def send_message(
        instagram_account: InstagramAccount,
        recipient_id: str,
        message_text: str
    ) -> Dict:
        """Send a message to a user"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{InstagramService.BASE_URL}/me/messages",
                params={"access_token": instagram_account.page_access_token},
                json={
                    "recipient": {"id": recipient_id},
                    "message": {"text": message_text}
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to send message: {response.text}")
            
            return response.json()
    
    @staticmethod
    async def refresh_token(instagram_account: InstagramAccount, db: Session):
        """Refresh the page access token to long-lived token"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{InstagramService.BASE_URL}/oauth/access_token",
                params={
                    "grant_type": "fb_exchange_token",
                    "client_id": instagram_account.page_id,
                    "client_secret": instagram_account.page_access_token,
                    "fb_exchange_token": instagram_account.page_access_token
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                instagram_account.page_access_token = data["access_token"]
                expires_in = data.get("expires_in", 5184000)
                instagram_account.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
                db.commit()
