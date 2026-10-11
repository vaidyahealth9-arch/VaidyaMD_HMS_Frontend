import { request, getApiBase } from '@/lib/api';
import { 
  Lead, 
  LeadListResponse, 
  DialerQueueItem, 
  CRMAnalytics, 
  CallLog, 
  CallDisposition,
  LeadStatus,
  LeadSource,
  TelecallerRosterItem,
  TelecallerKPIItem
} from '@/components/crm/types';

export const crmApi = {
  // Leads
  listLeads: (params?: { status?: LeadStatus; source?: LeadSource; search?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.source) q.append('source', params.source);
    if (params?.search) q.append('search', params.search);
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.offset) q.append('offset', String(params.offset));
    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return request<LeadListResponse>(`/crm/leads${queryStr}`);
  },

  createLead: (data: {
    name: string;
    phone: string;
    city?: string;
    state?: string;
    source?: LeadSource;
    source_campaign?: string;
    notes_summary?: string;
  }) => {
    return request<Lead>('/crm/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  importCsv: async (file: File) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vaidya_md_token') : null;
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${getApiBase()}/crm/leads/import-csv`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      throw new Error('Failed to import leads CSV');
    }
    return res.json() as Promise<{ imported: number; skipped: number }>;
  },

  // Dialer
  getNextLead: () => {
    return request<DialerQueueItem | null>('/crm/dialer/next-lead');
  },

  startCall: (leadId: string, phone: string) => {
    const formData = new FormData();
    formData.append('lead_id', leadId);
    formData.append('phone', phone);

    const token = typeof window !== 'undefined' ? localStorage.getItem('vaidya_md_token') : null;
    return fetch(`${getApiBase()}/crm/calls/start`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then((res) => res.json()) as Promise<CallLog>;
  },

  submitDisposition: (
    callId: string,
    data: {
      disposition: CallDisposition;
      notes?: string;
      follow_up_scheduled_at?: string;
      lead_status?: LeadStatus;
    }
  ) => {
    return request<CallLog>(`/crm/calls/${callId}/disposition`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Analytics
  getAnalytics: () => {
    return request<CRMAnalytics>('/crm/analytics/dashboard');
  },

  // Companion App & Device Pairing
  getAppVersion: () => {
    return request<{
      version_code: number;
      version_name: string;
      download_url: string;
      mandatory: boolean;
      changelog: string;
    }>('/crm/app/version');
  },

  getPairToken: () => {
    return request<{
      pair_token: string;
      user_id: string;
      user_name: string;
      hospital_id: string;
      branch_id: string | null;
      expires_in_seconds: number;
    }>('/crm/app/pair-token', {
      method: 'POST',
    });
  },

  getApkDownloadUrl: () => {
    return `${getApiBase()}/crm/app/download`;
  },

  // Fleet Presence & Admin KPIs
  getFleetRoster: () => {
    return request<TelecallerRosterItem[]>('/crm/fleet/roster');
  },

  getFleetKpis: () => {
    return request<TelecallerKPIItem[]>('/crm/fleet/kpis');
  },
};
