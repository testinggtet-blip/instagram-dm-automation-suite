from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.instagram_account import InstagramAccount
from app.models.automation_rule import AutomationRule, RuleStatus
from app.services.auth_service import get_current_user
from app.schemas.automation import (
    AutomationRuleCreate,
    AutomationRuleUpdate,
    AutomationRuleResponse
)

router = APIRouter()

@router.post("/rules", response_model=AutomationRuleResponse)
async def create_automation_rule(
    rule_data: AutomationRuleCreate,
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new automation rule"""
    # Verify account belongs to user
    instagram_account = db.query(InstagramAccount).filter(
        InstagramAccount.id == account_id,
        InstagramAccount.user_id == current_user.id
    ).first()
    
    if not instagram_account:
        raise HTTPException(status_code=404, detail="Instagram account not found")
    
    # Create rule
    rule = AutomationRule(
        instagram_account_id=account_id,
        name=rule_data.name,
        description=rule_data.description,
        trigger_type=rule_data.trigger_type,
        trigger_keywords=rule_data.trigger_keywords,
        trigger_schedule=rule_data.trigger_schedule,
        reply_message=rule_data.reply_message,
        reply_delay_seconds=rule_data.reply_delay_seconds,
        priority=rule_data.priority,
        max_triggers_per_user=rule_data.max_triggers_per_user,
        cooldown_minutes=rule_data.cooldown_minutes,
        status=RuleStatus.ACTIVE
    )
    
    db.add(rule)
    db.commit()
    db.refresh(rule)
    
    return rule


@router.get("/rules", response_model=List[AutomationRuleResponse])
async def get_automation_rules(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all automation rules for an account"""
    # Verify account belongs to user
    instagram_account = db.query(InstagramAccount).filter(
        InstagramAccount.id == account_id,
        InstagramAccount.user_id == current_user.id
    ).first()
    
    if not instagram_account:
        raise HTTPException(status_code=404, detail="Instagram account not found")
    
    rules = db.query(AutomationRule).filter(
        AutomationRule.instagram_account_id == account_id
    ).order_by(AutomationRule.priority.desc(), AutomationRule.created_at.desc()).all()
    
    return rules


@router.get("/rules/{rule_id}", response_model=AutomationRuleResponse)
async def get_automation_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific automation rule"""
    rule = db.query(AutomationRule).join(InstagramAccount).filter(
        AutomationRule.id == rule_id,
        InstagramAccount.user_id == current_user.id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")
    
    return rule


@router.put("/rules/{rule_id}", response_model=AutomationRuleResponse)
async def update_automation_rule(
    rule_id: int,
    rule_data: AutomationRuleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an automation rule"""
    rule = db.query(AutomationRule).join(InstagramAccount).filter(
        AutomationRule.id == rule_id,
        InstagramAccount.user_id == current_user.id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")
    
    # Update fields
    update_data = rule_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
    
    db.commit()
    db.refresh(rule)
    
    return rule


@router.delete("/rules/{rule_id}")
async def delete_automation_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an automation rule"""
    rule = db.query(AutomationRule).join(InstagramAccount).filter(
        AutomationRule.id == rule_id,
        InstagramAccount.user_id == current_user.id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")
    
    db.delete(rule)
    db.commit()
    
    return {"success": True, "message": "Automation rule deleted"}


@router.post("/rules/{rule_id}/toggle")
async def toggle_automation_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle automation rule status (active/inactive)"""
    rule = db.query(AutomationRule).join(InstagramAccount).filter(
        AutomationRule.id == rule_id,
        InstagramAccount.user_id == current_user.id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")
    
    # Toggle status
    if rule.status == RuleStatus.ACTIVE:
        rule.status = RuleStatus.INACTIVE
    else:
        rule.status = RuleStatus.ACTIVE
    
    db.commit()
    db.refresh(rule)
    
    return {"success": True, "status": rule.status}
