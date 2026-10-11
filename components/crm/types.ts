export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'follow_up'
  | 'converted'
  | 'lost'
  | 'do_not_call';

export type LeadSource =
  | 'google_ads'
  | 'meta_ads'
  | 'website'
  | 'doctor_referral'
  | 'walk_in'
  | 'whatsapp'
  | 'excel_import'
  | 'other';

export type CallDisposition =
  | 'interested'
  | 'callback_requested'
  | 'wrong_number'
  | 'not_reachable'
  | 'not_interested'
  | 'converted_appointment'
  | 'dnd';

export interface Lead {
  id: string;
  tenant_id: string;
  branch_id?: string | null;
  name: string;
  phone: string;
  alternate_phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  source: LeadSource;
  source_campaign?: string | null;
  status: LeadStatus;
  priority: number;
  assigned_to_id?: string | null;
  last_contacted_at?: string | null;
  next_follow_up_date?: string | null;
  tags?: string[];
  notes_summary?: string | null;
  is_converted: boolean;
  converted_patient_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadListResponse {
  total: number;
  items: Lead[];
}

export interface CallLog {
  id: string;
  tenant_id: string;
  branch_id?: string | null;
  lead_id: string;
  telecaller_id: string;
  phone_dialed: string;
  call_started_at: string;
  call_ended_at?: string | null;
  duration_seconds: number;
  recording_file_path?: string | null;
  transcript_text?: string | null;
  transcript_status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  whisper_model_used?: string | null;
  disposition?: CallDisposition | null;
  notes?: string | null;
  follow_up_scheduled_at?: string | null;
  created_at: string;
}

export interface DialerQueueItem {
  lead: Lead;
  previous_call_count: number;
  last_disposition?: string | null;
  last_notes?: string | null;
}

export interface CRMAnalytics {
  total_leads: number;
  new_leads: number;
  calls_made_today: number;
  conversions_total: number;
  pending_follow_ups_today: number;
  overdue_follow_ups: number;
  status_breakdown: Record<string, number>;
  source_breakdown: Record<string, number>;
}

export interface TelecallerRosterItem {
  user_id: string;
  user_name: string;
  email: string;
  device_model?: string | null;
  app_version?: string | null;
  sim_operator?: string | null;
  battery_level?: number | null;
  is_online: boolean;
  current_state: 'idle' | 'ringing' | 'on_call' | 'wrap_up' | 'offline';
  current_lead_name?: string | null;
  current_lead_phone?: string | null;
  call_duration_seconds: number;
  last_heartbeat_at: string;
  calls_today: number;
  conversions_today: number;
  total_talk_time_seconds: number;
}

export interface TelecallerKPIItem {
  user_id: string;
  user_name: string;
  total_calls: number;
  answered_calls: number;
  total_duration_seconds: number;
  avg_duration_seconds: number;
  conversions: number;
  conversion_rate_percentage: number;
  overdue_follow_ups: number;
}
