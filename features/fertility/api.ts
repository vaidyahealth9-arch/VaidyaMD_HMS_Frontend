import { request, toQueryString } from '@/lib/api';

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
  updateMedicationCalendar: (cycleId: string, calendar: any[]) =>
    request<any>(`/plugins/fertility/treatment-cycles/${cycleId}`, { method: 'PATCH', body: JSON.stringify({ medication_calendar: calendar }) }),
  updateSentinelDates: (cycleId: string, sentinelDates: Record<string, any>, endometrialMonitoring?: any[]) =>
    request<any>(`/plugins/fertility/treatment-cycles/${cycleId}/sentinel-dates`, { method: 'PATCH', body: JSON.stringify({ sentinel_dates: sentinelDates, endometrial_monitoring: endometrialMonitoring }) }),
  updateEtDischarge: (cycleId: string, data: Record<string, unknown>) =>
    request<any>(`/plugins/fertility/treatment-cycles/${cycleId}/et-discharge`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getArtRegistryExport: (params?: { format?: 'json' | 'csv'; start_date?: string; end_date?: string; status?: string }) =>
    request<any>(`/plugins/fertility/treatment-cycles/art-registry-export${toQueryString(params)}`),
  getCalendar: (cycleId: string) => request<any>(`/plugins/fertility/treatment-cycles/${cycleId}/calendar`),
  addMedication: (cycleId: string, data: { day_number: number; drug_name: string; dose: string; frequency?: string; instructions?: string }) =>
    request<any>(`/plugins/fertility/treatment-cycles/${cycleId}/medications`, { method: 'POST', body: JSON.stringify(data) }),
  listTypes: () => request<any[]>('/plugins/fertility/treatment-cycles/types'),
};

export const fertilityApi = {
  ...treatmentCyclesApi,
  getSchemas: () => request<any>('/plugins/fertility/schemas'),
  getSchema: (recordType?: string) =>
    request<any>(recordType && recordType !== 'fertility' ? `/plugins/fertility/schemas/${recordType}` : '/plugins/fertility/schemas'),
  getDues: (patientId: string) => request<any>(`/plugins/fertility/patient-dues/${patientId}`),
  getRecords: (patientId: string, pluginId?: string) =>
    request<any[]>(`/core/clinical-records/${patientId}${toQueryString({ plugin_id: pluginId || 'fertility' })}`),
  saveRecord: (data: Record<string, unknown>) =>
    request<any>('/core/clinical-records', { method: 'POST', body: JSON.stringify(data) }),
};

export const andrologyApi = {
  list: (params?: { patient_id?: string }) =>
    request<any[]>(`/plugins/fertility/andrology/${toQueryString(params)}`),
  create: (data: Record<string, unknown>) =>
    request<any>('/plugins/fertility/andrology/', { method: 'POST', body: JSON.stringify(data) }),
  saveSurgicalRetrieval: (data: Record<string, unknown>) =>
    request<any>('/plugins/fertility/andrology/', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        is_surgical_retrieval: true,
      }),
    }),
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
  list: (params?: { search?: string; category?: string }) =>
    request<any[]>(`/plugins/fertility/protocols/${toQueryString(params)}`),
  get: (id: string) => request<any>(`/plugins/fertility/protocols/${id}`),
  create: (data: Record<string, unknown>) =>
    request<any>('/plugins/fertility/protocols/', { method: 'POST', body: JSON.stringify(data) }),
  previewCalendar: (data: Record<string, unknown>) =>
    request<any>('/plugins/fertility/protocols/preview-calendar', { method: 'POST', body: JSON.stringify(data) }),
};

export const qcApi = {
  listLogs: (limit?: number) =>
    request<any[]>(`/plugins/fertility/qc/logs${toQueryString({ limit })}`),
  createLog: (data: { co2: number; o2: number; ph: number; temp: number; autodialer_test?: string; checked_by?: string; date?: string; notes?: string }) =>
    request<any>('/plugins/fertility/qc/logs', { method: 'POST', body: JSON.stringify(data) }),
};
