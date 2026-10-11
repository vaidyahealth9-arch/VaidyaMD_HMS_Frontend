import { request, toQueryString } from '@/lib/api';

export const analyticsApi = {
  getHospitalPulse: (days: number = 7) =>
    request<any>(`/core/analytics/hospital-pulse?days=${days}`),
  getRevenueBreakdown: (params?: { timeframe?: string; start_date?: string; end_date?: string } | string) => {
    if (typeof params === 'string') {
      return request<any>(`/core/analytics/revenue-breakdown${params ? `?timeframe=${encodeURIComponent(params)}` : ''}`);
    }
    const qs = toQueryString(params || {});
    return request<any>(`/core/analytics/revenue-breakdown${qs}`);
  },
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
  getDoctorProductivity: (params?: Record<string, any>) =>
    request<any>(`/core/analytics/doctor-productivity${toQueryString(params || {})}`),
  getClinicalLab: (params?: Record<string, any>) =>
    request<any>(`/core/analytics/clinical-lab${toQueryString(params || {})}`),
  getOperationsIpd: (params?: Record<string, any>) =>
    request<any>(`/core/analytics/operations-ipd${toQueryString(params || {})}`),
  getPharmacyLab: (params?: Record<string, any>) =>
    request<any>(`/core/analytics/pharmacy-lab${toQueryString(params || {})}`),
  getIncomeByUser: () =>
    request<any[]>('/plugins/fertility/analytics/financial/income-by-user'),
  getPatientsByCity: () =>
    request<any[]>('/plugins/fertility/analytics/patients/by-city'),
};

