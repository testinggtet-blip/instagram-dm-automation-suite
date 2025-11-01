from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import httpx

from app.database import get_db
from app.core.config import settings
from app.models.user import User
from app.services.auth_service import create_access_token, get_current_user
from app.schemas.auth import TokenResponse, UserResponse

router = APIRouter()

@router.get("/login")
async def facebook_login():
    """
    Initiate Facebook OAuth login flow.
    Redirects user to Facebook login page.
    """
    scope = "instagram_basic,instagram_manage_messages,pages_show_list,pages_read_engagement,pages_manage_metadata"
    auth_url = (
        f"https://www.facebook.com/v18.0/dialog/oauth?"
        f"client_id={settings.FACEBOOK_APP_ID}&"
        f"redirect_uri={settings.FACEBOOK_REDIRECT_URI}&"
        f"scope={scope}&"
        f"response_type=code"
    )
    return {"auth_url": auth_url}


@router.get("/callback")
async def facebook_callback(code: str, db: Session = Depends(get_db)):
    """
    Handle Facebook OAuth callback.
    Exchanges authorization code for access token and creates/updates user.
    """
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code not provided")
    
    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.get(
            "https://graph.facebook.com/v18.0/oauth/access_token",
            params={
                "client_id": settings.FACEBOOK_APP_ID,
                "client_secret": settings.FACEBOOK_APP_SECRET,
                "redirect_uri": settings.FACEBOOK_REDIRECT_URI,
                "code": code,
            }
        )
        
        if token_response.status_code != 200:
            raise HTTPException(
                status_code=400, 
                detail="Failed to exchange code for access token"
            )
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        expires_in = token_data.get("expires_in", 5184000)  # Default 60 days
        
        # Get user info from Facebook
        user_response = await client.get(
            "https://graph.facebook.com/v18.0/me",
            params={
                "fields": "id,name,email",
                "access_token": access_token
            }
        )
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        user_data = user_response.json()
        
    # Create or update user in database
    user = db.query(User).filter(User.facebook_id == user_data["id"]).first()
    
    if user:
        user.access_token = access_token
        user.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        user.name = user_data.get("name")
        user.email = user_data.get("email")
        user.updated_at = datetime.utcnow()
    else:
        user = User(
            facebook_id=user_data["id"],
            name=user_data.get("name"),
            email=user_data.get("email"),
            access_token=access_token,
            token_expires_at=datetime.utcnow() + timedelta(seconds=expires_in)
        )
        db.add(user)
    
    db.commit()
    db.refresh(user)
    
    # Create JWT token for our app
    jwt_token = create_access_token(data={"sub": str(user.id)})
    
    # Redirect to frontend with token
    redirect_url = f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}"
    return RedirectResponse(url=redirect_url)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information"""
    return current_user


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logout user (invalidate tokens)"""
    # In a production app, you would invalidate the JWT token here
    # For now, we'll just return success
    return {"message": "Logged out successfully"}
