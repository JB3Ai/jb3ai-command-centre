export type Priority = 1 | 2 | 3 | 4 | 5;

export type Tag = 'corporate' | 'fiscal-host' | 'employee-nominator' | 'foundation' | 'local-sa' | 'global';

export interface CustomVars {
  language?: string;
  tier?: string;
  region?: string;
  [key: string]: string | undefined;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  program: string;
  source: string;
  priority: Priority;
  tags: Tag[];
  custom_vars: CustomVars;
  created_at: string;
  linkedin_url?: string;
  notes?: string;
}

export type TemplateCategory = 'initial-outreach' | 'follow-up' | 'reply-template' | 'pitch';
export type TemplateTone = 'formal' | 'warm' | 'technical';

export interface Template {
  id: string;
  name: string;
  subject_line: string;
  body_html: string;
  body_text: string;
  category: TemplateCategory;
  variables: string[];
  tone: TemplateTone;
}

export type CampaignStatus = 'draft' | 'sending' | 'paused' | 'completed';

export interface SendWindow {
  start_time: string; // e.g. "08:00"
  end_time: string;   // e.g. "18:00"
  timezone: string;   // e.g. "SAST"
}

export interface Campaign {
  id: string;
  name: string;
  template_id: string;
  status: CampaignStatus;
  send_window: SendWindow;
  throttle_per_hour: number; // e.g. 5 or 20
  random_delay_range: [number, number]; // e.g. [45, 120] seconds
  total_contacts: number;
  sent_count: number;
  created_at: string;
}

export type ThreadStatus = 
  | 'draft'             // 🟡 Yellow
  | 'queued'            // 🔵 Blue
  | 'sent'              // 🟢 Sent
  | 'delivered'         // ⚪ Delivered
  | 'opened'            // 🟠 Opened
  | 'waiting'           // 🔴 Waiting for Reply
  | 'replied'           // 🟢 Replied
  | 'meeting-booked'    // 🟣 Meeting Booked
  | 'closed';           // ⚫ Closed

export type Sentiment = 'positive' | 'neutral' | 'needs-follow-up' | 'negative';
export type SuggestedActionType = 'send-follow-up' | 'wait' | 'escalate-to-call' | 'send-calendly' | 'mark-closed';

export interface EmailLog {
  id: string;
  direction: 'outbound' | 'inbound';
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
  gmail_message_id?: string;
}

export interface Thread {
  id: string;
  contact_id: string;
  campaign_id: string;
  gmail_thread_id?: string;
  status: ThreadStatus;
  last_activity: string;
  reply_detected: boolean;
  sentiment?: Sentiment;
  next_action_suggested: SuggestedActionType;
  suggested_reason?: string;
  suggested_template_id?: string;
  history: EmailLog[];
  follow_up_count: number;
}

export interface QueueItem {
  id: string;
  thread_id: string;
  contact_id: string;
  campaign_id: string;
  scheduled_at: string;
  status: 'queued' | 'sending' | 'sent' | 'failed';
  error_message?: string;
}

export interface DailyBrief {
  date: string;
  replies_awaiting: number;
  followups_ready: number;
  new_contacts_imported: number;
  suggested_sends_today: number;
  high_priority_replies: { contact_name: string; company: string; sentiment: Sentiment; snippet: string }[];
}
