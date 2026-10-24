import { request, toQueryString, getApiBase } from '@/lib/api';
import type {
  DoctorDirectoryItem,
  DoctorHierarchyDetailResponse,
  ReferringDoctor,
  ReferringDoctorCreate,
  ReferralSettlement,
  ReferralSettlementCreate,
  ReferralSummaryResponse,
  ReferralInvoiceReportItem,
  HospitalReferralOverviewResponse,
  CommissionConfigSchema,
} from './types';

export const referralsApi = {
  // Hospital-wide Executive Overview
  getOverview: () =>
    request<HospitalReferralOverviewResponse>('/plugins/referrals/overview'),

  // Level 1: Master Directory of Doctors
  getDirectory: (params?: { search?: string; filter_type?: string }) =>
    request<DoctorDirectoryItem[]>(`/plugins/referrals/directory${toQueryString(params)}`),

  // Level 2 & 3: Master-Detail hierarchy for selected doctor
  getDoctorDetail: (doctorName: string) =>
    request<DoctorHierarchyDetailResponse>(
      `/plugins/referrals/doctor-detail?doctor_name=${encodeURIComponent(doctorName)}`
    ),

  // Save/Update doctor profile & bank details
  saveDoctorProfile: (data: ReferringDoctorCreate) =>
    request<ReferringDoctor>('/plugins/referrals/doctor-profile', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Record commission settlement
  settleCommission: (data: ReferralSettlementCreate) =>
    request<ReferralSettlement>('/plugins/referrals/settle', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Settlement history
  getSettlements: (doctorName?: string) =>
    request<ReferralSettlement[]>(
      `/plugins/referrals/settlements${doctorName ? `?doctor_name=${encodeURIComponent(doctorName)}` : ''}`
    ),

  // Summary & Report
  getSummary: (params?: { doctor_name?: string; date_from?: string; date_to?: string }) =>
    request<ReferralSummaryResponse>(`/plugins/referrals/summary${toQueryString(params)}`),

  getReport: (params?: {
    doctor_name?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    status?: string;
  }) => request<ReferralInvoiceReportItem[]>(`/plugins/referrals/report${toQueryString(params)}`),

  getDoctors: () =>
    request<Array<{ doctor_name: string; patient_count: number }>>('/plugins/referrals/doctors'),

  getCommissionSettings: () =>
    request<CommissionConfigSchema>('/plugins/referrals/commission-settings'),

  saveCommissionSettings: (data: CommissionConfigSchema) =>
    request<CommissionConfigSchema>('/plugins/referrals/commission-settings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getExportUrl: (doctorName?: string) => {
    const base = getApiBase();
    return `${base}/plugins/referrals/export${doctorName ? `?doctor_name=${encodeURIComponent(doctorName)}` : ''}`;
  },
};
