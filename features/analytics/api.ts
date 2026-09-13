import { request, toQueryString } from '@/lib/api';

export const analyticsApi = {
  getRevenueBreakdown: (timeframe?: string) =>
    request<any>(`/core/analytics/revenue-breakdown${timeframe ? `?timeframe=${encodeURIComponent(timeframe)}` : ''}`),
  getRevenueLeakage: () =>
    request<any>('/core/analytics/revenue-leakage'),
  getNoShows: () =>
    request<any[]>('/core/analytics/no-shows'),
  sendNoShowReminder: (appointmentId: string) =>
    request<any>(`/core/analytics/no-shows/${appointmentId}/send-reminder`, { method: 'POST' }),
  resolveLeakage: (data: { leakage_item_id: string; patient_id: string; item_description: string; amount: number; department: string }) =>
    request<any>('/core/analytics/resolve-leakage', { method: 'POST', body: JSON.stringify(data) }),
  getClinicalOutcomes: () =>
    request<any>('/plugins/fertility/analytics/clinical/cycle-outcomes'),
  getIncomeByUser: () =>
    request<any[]>('/plugins/fertility/analytics/financial/income-by-user'),
  getPatientsByCity: () =>
    request<any[]>('/plugins/fertility/analytics/patients/by-city'),
};
