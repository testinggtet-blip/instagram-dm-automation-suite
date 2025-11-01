from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    facebook_id: str
    email: Optional[str]
    name: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
