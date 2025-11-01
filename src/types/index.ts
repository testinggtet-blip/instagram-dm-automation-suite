export interface User {
  id: number;
  facebook_id: string;
  email?: string;
  name?: string;
  is_active: boolean;
  created_at: string;
}

export interface InstagramAccount {
  id: number;
  user_id: number;
  instagram_business_account_id: string;
  username?: string;
  profile_picture_url?: string;
  page_id: string;
  page_access_token: string;
  token_expires_at: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Conversation {
  id: number;
  thread_id: string;
  participant_id?: string;
  participant_username?: string;
  participant_profile_pic?: string;
  last_message_time?: string;
  unread_count: number;
}

export interface Message {
  id: number;
  message_id?: string;
  sender_id?: string;
  message_text?: string;
  message_type: string;
  is_from_me: boolean;
  is_automated: boolean;
  sent_at?: string;
}

export type TriggerType = "keyword" | "new_message" | "scheduled" | "welcome";
export type RuleStatus = "active" | "inactive" | "paused";

export interface AutomationRule {
  id: number;
  instagram_account_id: number;
  name: string;
  description?: string;
  trigger_type: TriggerType;
  trigger_keywords?: string[];
  trigger_schedule?: any;
  reply_message: string;
  reply_delay_seconds: number;
  status: RuleStatus;
  priority: number;
  max_triggers_per_user?: number;
  cooldown_minutes?: number;
  triggered_count: number;
  success_count: number;
  failure_count: number;
  last_triggered_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Stats {
  total_accounts: number;
  total_conversations: number;
  total_messages: number;
}

export interface AutomationStats {
  total_rules: number;
  active_rules: number;
  inactive_rules: number;
  total_triggers: number;
  total_success: number;
  total_failures: number;
  success_rate: number;
}
