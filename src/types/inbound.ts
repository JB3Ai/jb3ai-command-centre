export type OriginSource = 
  | 'Website'
  | 'Email'
  | 'Facebook'
  | 'Instagram'
  | 'LinkedIn'
  | 'YouTube'
  | 'WhatsApp'
  | 'VoiceGrid';

export type OriginType = 
  | 'Form Signup'
  | 'Direct Email'
  | 'Comment'
  | 'Direct Message'
  | 'Lead Ad'
  | 'Voice Call';

export type LeadStatus = 
  | 'New'
  | 'In Due Diligence'
  | 'Researched'
  | 'Booking Sent'
  | 'Call Scheduled';

export type AccessType = 
  | 'Investor Access'
  | 'Advisory / Client'
  | 'Collaborator'
  | 'Press / Media'
  | 'News Newsletter'
  | 'General Website Signup';

export interface StatusHistoryItem {
  id: string;
  from_status?: LeadStatus;
  to_status: LeadStatus;
  changed_by: string;
  timestamp: string;
  note?: string;
}

export interface Lead {
  id: string;
  signal_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_e164: string;
  origin_source: OriginSource;
  origin_type: OriginType;
  access_type: AccessType | string;
  newsletter_opt_in: boolean;
  ip_address: string;
  current_status: LeadStatus;
  ai_output: string;
  popia_consent: boolean;
  lang_code: string;
  area_node: string;
  notes: string;
  created_at: string;
  updated_at: string;
  call_date?: string;
  call_time?: string;
  status_history?: StatusHistoryItem[];
  raw_payload?: Record<string, any>;
}

export interface LeadMessage {
  id: string;
  lead_id: string;
  sender: 'Lead' | 'Agent 1 Intake' | 'Agent 2 Research' | 'Agent 3 Outreach' | 'Automated Gmail Trigger' | 'Operator' | 'System' | string;
  channel: OriginSource | 'System' | 'Email' | 'Gmail' | string;
  type: 'incoming_msg' | 'ai_response' | 'due_diligence' | 'outreach_draft' | 'manual_reply' | 'system_event' | 'due_diligence_email' | string;
  message_text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'pending' | 'draft' | 'failed';
}

export interface SheetSyncLog {
  id: string;
  lead_id?: string;
  lead_name: string;
  signal_id: string;
  action: 'INSERT_ROW' | 'UPDATE_STATUS' | 'AI_OUTPUT_SYNC' | 'EXPORT_SYNC' | 'IMPORT_SYNC' | 'CREATE_SHEET' | 'GMAIL_DUE_DILIGENCE_TRIGGER' | 'GMAIL_SENT' | string;
  sheet_tab: 'MASTER_PIPELINE' | 'SOURCE_WEBSITE' | 'SOURCE_WHATSAPP' | 'SOURCE_FACEBOOK' | 'SOURCE_EMAIL' | 'SOURCE_VOICEGRID' | string;
  status: 'SUCCESS' | 'QUEUED' | 'ERROR';
  timestamp: string;
  response_ms: number;
  details?: string;
}

export interface AgentConfig {
  agent_id: 'agent_1_intake' | 'agent_2_due_diligence' | 'agent_3_engagement' | 'agent_4_handoff';
  name: string;
  role: string;
  system_prompt: string;
  enabled: boolean;
  auto_trigger: boolean;
  description: string;
}

export interface WebhookSimulationRequest {
  source: OriginSource;
  payload: Record<string, any>;
}
