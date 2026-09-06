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
// 1. Core Auth, Branches, Users, Permissions, Templates
// ==========================================
export const authApi = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: any }>('/core/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  listUsers: () => request<any[]>('/core/auth/users'),
  me: () => request<any>('/core/auth/me'),
};

export const branchesApi = {
  list: () => request<any[]>('/core/branches/'),
  get: (id: string) => request<any>(`/core/branches/${id}`),
  create: (data: Record<string, unknown>) =>
    request('/core/branches/', { method: 'POST', body: JSON.stringify(data) }),
};

export const permissionProfilesApi = {
  list: () => request<any[]>('/core/permission-profiles/'),
  get: (id: string) => request<any>(`/core/permission-profiles/${id}`),
  update: (id: string, data: Record<string, unknown>) =>
    request(`/core/permission-profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const templatesApi = {
  list: () => request<any[]>('/core/templates/'),
  get: (id: string) => request<any>(`/core/templates/${id}`),
  create: (data: Record<string, unknown>) =>
    request('/core/templates/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request(`/core/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const notificationsApi = {
  list: (userId?: string, unreadOnly?: boolean) =>
    request<any[]>(`/core/notifications/${toQueryString({ user_id: userId, unread_only: unreadOnly })}`),
  markRead: (id: string) => request(`/core/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: (userId: string) => request(`/core/notifications/mark-all-read/${userId}`, { method: 'POST' }),
};

// ==========================================
// 2. Patients & Couple EMR
// ==========================================
export const patientsApi = {
  list: (params?: { page?: number; per_page?: number; search?: string; referred_by_type?: string; area?: string; branch_id?: string; start_date?: string; end_date?: string }) =>
    request<any>(`/core/patients/${toQueryString(params)}`),
  get: (id: string) => request<any>(`/core/patients/${id}`),
  getTimeline: (id: string) => request<any>(`/core/patients/${id}/timeline`),
  getCouple: (id: string) => request<any>(`/core/patients/${id}/couple`),
  create: (data: Record<string, unknown>) =>
    request<any>('/core/patients/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request<any>(`/core/patients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  linkPartner: (id: string, partnerId: string) =>
    request<any>(`/core/patients/${id}/link-partner`, { method: 'POST', body: JSON.stringify({ partner_id: partnerId }) }),
  updateAlerts: (id: string, alertNotes: string[]) =>
    request<any>(`/core/patients/${id}/alerts`, { method: 'POST', body: JSON.stringify({ alert_notes: alertNotes }) }),
  updateClinicalNotes: (id: string, clinicalNotes: string[]) =>
    request<any>(`/core/patients/${id}/clinical-notes`, { method: 'POST', body: JSON.stringify({ clinical_notes: clinicalNotes }) }),
};

// ==========================================
// 3. Appointments
// ==========================================
export const appointmentsApi = {
  list: (params?: { date_filter?: string; status?: string; department?: string; branch_id?: string }) =>
    request<{ appointments: any[]; total: number }>(`/core/appointments/${toQueryString(params)}`),
  create: (data: Record<string, unknown>) =>
    request<any>('/core/appointments/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request<any>(`/core/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  triage: (id: string, data: { vitals: Record<string, any>; chief_complaint?: string }) =>
    request<any>(`/core/appointments/${id}/triage`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ==========================================
// 4. Billing, Packages, Wallet
// ==========================================
export const walletApi = {
  get: (patientId: string) => request<any>(`/core/wallet/${patientId}`),
  getWallet: (patientId: string) => request<any>(`/core/wallet/${patientId}`),
  topUp: (patientId: string, data: { amount: number; payment_method: string; notes?: string }) =>
    request<any>(`/core/wallet/${patientId}/topup`, { method: 'POST', body: JSON.stringify(data) }),
  deposit: (patientIdOrData: any, amount?: number, payment_method: string = 'Cash', notes?: string) => {
    if (typeof patientIdOrData === 'object' && patientIdOrData !== null) {
      const pId = patientIdOrData.patient_id || patientIdOrData.id;
      return request<any>(`/core/wallet/${pId}/topup`, {
        method: 'POST',
        body: JSON.stringify({
          amount: patientIdOrData.amount,
          payment_method: patientIdOrData.payment_method || 'Cash',
          notes: patientIdOrData.notes,
        }),
      });
    }
    return request<any>(`/core/wallet/${patientIdOrData}/topup`, {
      method: 'POST',
      body: JSON.stringify({ amount, payment_method, notes }),
    });
  },
  payInvoice: (patientId: string, data: { invoice_id: string; amount: number }) =>
    request<any>(`/core/wallet/${patientId}/pay-invoice`, { method: 'POST', body: JSON.stringify(data) }),
};

export const billingApi = {
  listInvoices: (params?: { status?: string; patient_id?: string; appointment_source?: string }) =>
    request<any[]>(`/core/billing/invoices${toQueryString(params)}`),
  getInvoice: (id: string) => request<any>(`/core/billing/invoices/${id}`),
  createInvoice: (data: Record<string, unknown>) =>
    request<any>('/core/billing/invoices', { method: 'POST', body: JSON.stringify(data) }),
  recordPayment: (id: string, data: { amount: number; payment_method: string; upi_pay_mode?: string; notes?: string }) =>
    request<any>(`/core/billing/invoices/${id}/payment`, { method: 'POST', body: JSON.stringify(data) }),
  listPackages: () => request<any[]>('/core/billing/packages'),
  getWallet: (patientId: string) => walletApi.get(patientId),
};

// ==========================================
// 5. OPD Plugin & Ambient AI Scribe (Module 02)
// ==========================================
export const opdApi = {
  getSchema: () => request<any>('/plugins/opd/schemas'),
  getOrderSets: () => request<any[]>('/plugins/opd/order-sets'),
  createOrderSet: (data: Record<string, unknown>) =>
    request<any>('/plugins/opd/order-sets', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderSet: (id: string, data: Record<string, unknown>) =>
    request<any>(`/plugins/opd/order-sets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  parseScribeAudio: (payload?: { transcript_or_audio?: string; patient_id?: string; doctor_notes_context?: string }) =>
    request<any>('/plugins/opd/scribe/parse', { method: 'POST', body: JSON.stringify(payload || {}) }),
  saveConsultation: (data: { patient_id: string; data: Record<string, unknown>; created_by?: string }) =>
    request<any>('/plugins/opd/clinical-records', { method: 'POST', body: JSON.stringify(data) }),
  getPatientConsultations: (patientId: string) =>
    request<any[]>(`/plugins/opd/clinical-records/${patientId}`),
};

// ==========================================
// 6. IVF Embryology & Fertility Cycles (Module 03)
// ==========================================
export const embryologyApi = {
  getOocytes: (cycleId: string) => request<any[]>(`/plugins/fertility/embryology/oocytes?cycle_id=${cycleId}`),
  batchCreateOocytes: (data: { treatment_cycle_id: string; count: number; procedure_type?: string; default_maturity?: string }) =>
    request<any>('/plugins/fertility/embryology/oocytes/batch', { method: 'POST', body: JSON.stringify(data) }),
  updateOocyteDay: (data: { oocyte_id: string; day_number: number; day_data: Record<string, any>; fert_check?: string; disposition?: Record<string, any> }) =>
    request<any>('/plugins/fertility/embryology/oocytes/update-day', { method: 'PATCH', body: JSON.stringify(data) }),
  signoffWitness: (data: { treatment_cycle_id: string; day_number: number; checked_by_id?: string; witnessed_by_id: string; notes?: string }) =>
    request<any>('/plugins/fertility/embryology/witnesses', { method: 'POST', body: JSON.stringify(data) }),
  getWitnesses: (cycleId: string) => request<any[]>(`/plugins/fertility/embryology/witnesses?cycle_id=${cycleId}`),
  getCycleKPIs: (cycleId: string) => request<any>(`/plugins/fertility/embryology/cycles/${cycleId}/kpis`),
  getKPIs: (cycleId: string) => request<any>(`/plugins/fertility/embryology/cycles/${cycleId}/kpis`),
  listCycles: (params?: { patient_id?: string; status?: string }) =>
    request<any[]>(`/plugins/fertility/treatment-cycles/${toQueryString(params)}`),
  getCycle: (id: string) => request<any>(`/plugins/fertility/treatment-cycles/${id}`),
};

export const treatmentCyclesApi = {
  list: (params?: { patient_id?: string; status?: string }) =>
    request<any[]>(`/plugins/fertility/treatment-cycles/${toQueryString(params)}`),
  get: (id: string) => request<any>(`/plugins/fertility/treatment-cycles/${id}`),
  create: (data: Record<string, unknown>) =>
    request<any>('/plugins/fertility/treatment-cycles/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request<any>(`/plugins/fertility/treatment-cycles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getCalendar: (cycleId: string) => request<any>(`/plugins/fertility/treatment-cycles/${cycleId}/calendar`),
};

export const fertilityApi = {
  ...treatmentCyclesApi,
  getSchemas: () => request<any>('/plugins/fertility/schemas'),
  getSchema: (pluginId?: string) => request<any>(`/plugins/${pluginId || 'fertility'}/schemas`),
  getDues: (patientId: string) => request<any>(`/plugins/fertility/patient-dues/${patientId}`),
  getRecords: (patientId: string, pluginId?: string) =>
    request<any[]>(`/plugins/fertility/clinical-records/${patientId}${toQueryString({ plugin_id: pluginId })}`),
  saveRecord: (data: Record<string, unknown>) =>
    request<any>('/plugins/fertility/clinical-records', { method: 'POST', body: JSON.stringify(data) }),
};

export const andrologyApi = {
  list: (params?: { patient_id?: string }) =>
    request<any[]>(`/plugins/fertility/andrology/${toQueryString(params)}`),
  create: (data: Record<string, unknown>) =>
    request<any>('/plugins/fertility/andrology/', { method: 'POST', body: JSON.stringify(data) }),
};

export const cryoApi = {
  list: (params?: { status?: string; patient_id?: string }) =>
    request<any[]>(`/plugins/fertility/cryo/samples${toQueryString(params)}`),
  listSamples: (params?: { status?: string; patient_id?: string }) =>
    request<any[]>(`/plugins/fertility/cryo/samples${toQueryString(params)}`),
  getExpiringSoon: (params?: any) =>
    request<any[]>('/plugins/fertility/cryo/samples/expiring-soon'),
  createSample: (data: Record<string, unknown>) =>
    request<any>('/plugins/fertility/cryo/samples/freeze', { method: 'POST', body: JSON.stringify(data) }),
  freeze: (data: Record<string, unknown>) =>
    request<any>('/plugins/fertility/cryo/samples/freeze', { method: 'POST', body: JSON.stringify(data) }),
  thaw: (id: string, data: Record<string, unknown>) =>
    request<any>(`/plugins/fertility/cryo/samples/${id}/thaw`, { method: 'POST', body: JSON.stringify(data) }),
  thawSample: (id: string, data: Record<string, unknown>) =>
    request<any>(`/plugins/fertility/cryo/samples/${id}/thaw`, { method: 'POST', body: JSON.stringify(data) }),
  discard: (id: string, data: Record<string, unknown>) =>
    request<any>(`/plugins/fertility/cryo/samples/${id}/discard`, { method: 'POST', body: JSON.stringify(data) }),
  getTankMap: () => request<any>('/plugins/fertility/cryo/tank-map'),
  renewConsent: (id: string, data: Record<string, unknown>) =>
    request<any>(`/plugins/fertility/cryo/samples/${id}/renew-consent`, { method: 'POST', body: JSON.stringify(data) }),
};

export const protocolsApi = {
  list: (params?: { search?: string }) =>
    request<any[]>(`/plugins/fertility/protocol-library/templates${toQueryString(params)}`),
  get: (id: string) => request<any>(`/plugins/fertility/protocol-library/templates/${id}`),
  create: (data: Record<string, unknown>) =>
    request<any>('/plugins/fertility/protocol-library/templates', { method: 'POST', body: JSON.stringify(data) }),
  previewCalendar: (data: Record<string, unknown>) =>
    request<any>('/plugins/fertility/protocol-library/preview-calendar', { method: 'POST', body: JSON.stringify(data) }),
};

// ==========================================
// 7. IPD Bedboard & Nursing Station (Module 04)
// ==========================================
export const ipdApi = {
  listWards: () => request<any[]>('/core/ipd/wards'),
  createWard: (data: Record<string, unknown>) =>
    request<any>('/core/ipd/wards', { method: 'POST', body: JSON.stringify(data) }),
  listBeds: (params?: { ward_id?: string; status?: string }) =>
    request<any[]>(`/core/ipd/beds${toQueryString(params)}`),
  updateBedStatus: (bedId: string, status: string) =>
    request<any>(`/core/ipd/beds/${bedId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  listAdmissions: (params?: { status?: string }) =>
    request<any[]>(`/core/ipd/admissions${toQueryString(params)}`),
  admitPatient: (data: { patient_id: string; bed_id: string; admitting_doctor_id?: string; diagnosis?: string; package_name?: string; notes?: string }) =>
    request<any>('/core/ipd/admissions', { method: 'POST', body: JSON.stringify(data) }),
  dischargePatient: (admissionId: string, notes?: string) =>
    request<any>(`/core/ipd/admissions/${admissionId}/discharge`, { method: 'POST', body: JSON.stringify({ notes }) }),
  transferBed: (admissionId: string, targetBedId: string) =>
    request<any>(`/core/ipd/admissions/${admissionId}/transfer-bed`, { method: 'POST', body: JSON.stringify({ target_bed_id: targetBedId }) }),
  listNursingTasks: (params?: { admission_id?: string; bed_id?: string; status?: string }) =>
    request<any[]>(`/core/ipd/nursing-tasks${toQueryString(params)}`),
  createNursingTask: (data: { admission_id: string; bed_id: string; task_type: string; description: string; frequency?: string; scheduled_time?: string }) =>
    request<any>('/core/ipd/nursing-tasks', { method: 'POST', body: JSON.stringify(data) }),
  completeNursingTask: (taskId: string, data: { completed_by_id?: string; vitals_payload?: Record<string, any>; notes?: string }) =>
    request<any>(`/core/ipd/nursing-tasks/${taskId}/complete`, { method: 'POST', body: JSON.stringify(data) }),
  accrueDailyCharges: () =>
    request<any>('/core/ipd/accrue-daily-charges', { method: 'POST' }),
};

// ==========================================
// 8. Pharmacy & AI OCR Inventory (Module 05)
// ==========================================
export const pharmacyApi = {
  listIndents: (params?: { status?: string }) =>
    request<any[]>(`/core/pharmacy/indents${toQueryString(params)}`),
  createIndent: (data: { requesting_department: string; requested_by_id?: string; urgency?: string; items: any[]; notes?: string }) =>
    request<any>('/core/pharmacy/indents', { method: 'POST', body: JSON.stringify(data) }),
  updateIndentStatus: (id: string, status: string) =>
    request<any>(`/core/pharmacy/indents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  listPurchaseOrders: (params?: { status?: string }) =>
    request<any[]>(`/core/pharmacy/purchase-orders${toQueryString(params)}`),
  createPurchaseOrder: (data: { vendor_name: string; vendor_gst?: string; items: any[]; total_amount: number; expected_delivery_date?: string; notes?: string }) =>
    request<any>('/core/pharmacy/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),

  listGRNs: (params?: { status?: string }) =>
    request<any[]>(`/core/pharmacy/grns${toQueryString(params)}`),
  createGRN: (data: { invoice_number: string; vendor_name: string; total_amount: number; po_id?: string; items: any[]; ocr_raw_data?: any; verified_by_id?: string }) =>
    request<any>('/core/pharmacy/grns', { method: 'POST', body: JSON.stringify(data) }),
  stockGRN: (id: string) =>
    request<any>(`/core/pharmacy/grns/${id}/stock`, { method: 'POST' }),

  listBatches: (params?: { category?: string; search?: string }) =>
    request<any[]>(`/core/pharmacy/batches${toQueryString(params)}`),
  
  parseOcrInvoice: (payload?: { base64_image?: string; invoice_hint?: string; file_name?: string; vendor_name?: string } | Record<string, any>) =>
    request<any>('/core/pharmacy/ocr/invoice', { method: 'POST', body: JSON.stringify(payload || {}) }),


  dispenseFEFO: (data: { patient_id: string; items: Array<{ item_code: string; quantity: number }>; doctor_id?: string; notes?: string }) =>
    request<any>('/core/pharmacy/dispense', { method: 'POST', body: JSON.stringify(data) }),
};

// ==========================================
// 9. LIMS & HL7 Equipment Integration (Module 06)
// ==========================================
export const limsApi = {
  getWorklist: (params?: { status?: string; test_type?: string }) =>
    request<any[]>(`/core/lims/worklist${toQueryString(params)}`),
  getRecord: (id: string) =>
    request<any>(`/core/lims/records/${id}`),
  createManualReport: (data: { patient_id: string; test_name: string; category?: string; sample_id?: string; observations?: Record<string, any>; pathologist_notes?: string }) =>
    request<any>('/core/lims/manual-report', { method: 'POST', body: JSON.stringify(data) }),
  simulateHl7Ingestion: (data: { sample_barcode?: string; patient_mrn?: string; patient_name?: string; analyzer_type: 'casa' | 'hematology' | 'biochemistry'; test_code: string }) =>
    request<any>('/core/lims/simulate-hl7', { method: 'POST', body: JSON.stringify(data) }),
  authorizeReport: (id: string, data: { pathologist_id?: string; comments?: string; verified_values?: Record<string, any> }) =>
    request<any>(`/core/lims/records/${id}/authorize`, { method: 'POST', body: JSON.stringify(data) }),
};

// ==========================================
// 10. IVF Lab Environmental QC & Incubator Logs
// ==========================================
export const qcApi = {
  listLogs: (limit?: number) =>
    request<any[]>(`/plugins/fertility/qc/logs${toQueryString({ limit })}`),
  createLog: (data: { co2: number; o2: number; ph: number; temp: number; autodialer_test?: string; checked_by?: string; date?: string; notes?: string }) =>
    request<any>('/plugins/fertility/qc/logs', { method: 'POST', body: JSON.stringify(data) }),
};

// ==========================================
// 11. Revenue Leakage & Analytics Dashboard (Module 07)
// ==========================================
export const analyticsApi = {
  getRevenueBreakdown: () =>
    request<any>('/core/analytics/revenue-breakdown'),
  getRevenueLeakage: () =>
    request<any>('/core/analytics/revenue-leakage'),
  getNoShows: () =>
    request<any[]>('/core/analytics/no-shows'),
  resolveLeakage: (data: { leakage_item_id: string; patient_id: string; item_description: string; amount: number; department: string }) =>
    request<any>('/core/analytics/resolve-leakage', { method: 'POST', body: JSON.stringify(data) }),
};

