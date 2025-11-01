from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict
from app.models.automation_rule import TriggerType, RuleStatus

class AutomationRuleCreate(BaseModel):
    name: str
    description: Optional[str]
    trigger_type: TriggerType
    trigger_keywords: Optional[List[str]]
    trigger_schedule: Optional[Dict]
    reply_message: str
    reply_delay_seconds: int = 0
    priority: int = 0
    max_triggers_per_user: Optional[int]
    cooldown_minutes: Optional[int]

class AutomationRuleUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    trigger_type: Optional[TriggerType]
    trigger_keywords: Optional[List[str]]
    trigger_schedule: Optional[Dict]
    reply_message: Optional[str]
    reply_delay_seconds: Optional[int]
    status: Optional[RuleStatus]
    priority: Optional[int]
    max_triggers_per_user: Optional[int]
    cooldown_minutes: Optional[int]

class AutomationRuleResponse(BaseModel):
    id: int
    instagram_account_id: int
    name: str
    description: Optional[str]
    trigger_type: TriggerType
    trigger_keywords: Optional[List[str]]
    trigger_schedule: Optional[Dict]
    reply_message: str
    reply_delay_seconds: int
    status: RuleStatus
    priority: int
    max_triggers_per_user: Optional[int]
    cooldown_minutes: Optional[int]
    triggered_count: int
    success_count: int
    failure_count: int
    last_triggered_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True
