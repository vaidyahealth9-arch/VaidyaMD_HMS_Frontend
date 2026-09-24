/**
 * VaidyaMD HMS — Central API Client
 * Enterprise-grade typed API client covering all Core, OPD, IVF Lab, IPD, Pharmacy, LIMS, and Analytics endpoints.
 * Compatible with TanStack Query (useQuery / useMutation).
 */

export function getApiBase(): string {
  let base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    if (currentOrigin.includes('localhost:3000')) {
      base = 'http://localhost:8000/api';
    } else if (currentOrigin.includes('-3000.')) {
      base = currentOrigin.replace('-3000.', '-8000.') + '/api';
    } else if (
      currentOrigin.includes('vaidyamd.vaidyahealth.com') ||
      currentOrigin.includes('web.app') ||
      currentOrigin.includes('firebaseapp.com')
    ) {
      // On Firebase Hosting, /api/** routes directly to hms-backend on the same origin
      base = `${currentOrigin}/api`;
    }
  }
  return base;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('vaidya_md_token') : null;
  const apiBase = getApiBase();

  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Unknown server error' }));
    throw new ApiError(res.status, error.detail || 'Request failed');
  }

  return res.json();
}

export function toQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      searchParams.append(key, String(val));
    }
  });
  const q = searchParams.toString();
  return q ? `?${q}` : '';
}

// ==========================================
// Domain Types Re-Exports
// ==========================================
export * from '@/features/auth/types';
export * from '@/features/patients/types';
export * from '@/features/billing/types';
export * from '@/features/fertility/types';
export * from '@/features/cosgyn/types';
export * from '@/features/ipd/types';

// ==========================================
// 1. Core Auth, Branches, Users, Permissions, Templates
// ==========================================
export { authApi } from '@/features/auth/api';
export { adminApi } from '@/features/admin/api';
export { templatesApi } from '@/features/templates/api';
export { notificationsApi } from '@/features/notifications/api';

export const branchesApi = {
  list: () => request<any[]>('/core/branches/'),
  get: (id: string) => request<any>(`/core/branches/${id}`),
  create: (data: Record<string, unknown>) =>
    request('/core/branches/', { method: 'POST', body: JSON.stringify(data) }),
};

export const permissionProfilesApi = {
  list: () => request<any[]>('/core/permission-profiles/'),
  get: (id: string) => request<any>(`/core/permission-profiles/${id}`),
  create: (data: Record<string, unknown>) =>
    request('/core/permission-profiles/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request(`/core/permission-profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ==========================================
// 2. Patients & Couple EMR
// ==========================================
export { patientsApi } from '@/features/patients/api';

// ==========================================
// 3. Appointments
// ==========================================
export { appointmentsApi } from '@/features/appointments/api';

// ==========================================
// 4. Billing, Packages, Wallet
// ==========================================
export { walletApi, billingApi, patientPackagesApi } from '@/features/billing/api';

// ==========================================
// 5. OPD Plugin & Ambient AI Scribe
// ==========================================
export { opdApi } from '@/features/opd/api';

// ==========================================
// Cosmetic Gynecology Plugin (CosGyn)
// ==========================================
export { cosgynApi } from '@/features/cosgyn/api';

// ==========================================
// 6. IVF Embryology & Fertility Cycles
// ==========================================
export { embryologyApi, treatmentCyclesApi, fertilityApi, andrologyApi, cryoApi, protocolsApi, qcApi } from '@/features/fertility/api';

// ==========================================
// 7. IPD Bedboard & Nursing Station
// ==========================================
export { ipdApi } from '@/features/ipd/api';

// ==========================================
// 8. Pharmacy & AI OCR Inventory
// ==========================================
export { pharmacyApi } from '@/features/pharmacy/api';

// ==========================================
// 9. LIMS & HL7 Equipment Integration
// ==========================================
export { limsApi } from '@/features/lims/api';

// ==========================================
// 11. Revenue Leakage & Analytics Dashboard
// ==========================================
export { analyticsApi } from '@/features/analytics/api';

// ==========================================
// 12. Patient Documents & Reports
// ==========================================
export { documentsApi } from '@/features/documents/api';

// ==========================================
// 13. Pre-ART Clinical Counseling
// ==========================================
export { counselingApi, type CounselingNote } from '@/features/counseling/api';
