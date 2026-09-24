import { request, getApiBase, ApiError } from '@/lib/api';

// ==========================================
// Master Admin Hub Feature API (Super-Admin)
// ==========================================
export const adminApi = {
  getHospitalProfile: () =>
    request<{ hospital: any; branches: any[] }>('/core/admin/hospital-profile'),

  updateHospitalProfile: (data: Record<string, unknown>) =>
    request<{ status: string; message: string }>('/core/admin/hospital-profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  listDomains: () =>
    request<
      {
        key: string;
        filename: string;
        title: string;
        description: string;
        headers: string[];
      }[]
    >('/core/admin/domains'),

  downloadCsvUrl: (domain: string, mode: 'blank' | 'export') => {
    const apiBase = getApiBase();
    return `${apiBase}/core/admin/csv-templates/${domain}?mode=${mode}`;
  },

  downloadCsv: async (domain: string, mode: 'blank' | 'export', filename?: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vaidya_md_token') : null;
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/core/admin/csv-templates/${domain}?mode=${mode}`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to download CSV' }));
      throw new ApiError(res.status, err.detail || 'Failed to download CSV');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${domain}_${mode}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  previewCsv: async (domain: string, file: File | Blob, conflictMode: 'overwrite' | 'skip') => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vaidya_md_token') : null;
    const apiBase = getApiBase();
    const formData = new FormData();
    formData.append('file', file, file instanceof File ? file.name : `${domain}.csv`);
    formData.append('conflict_mode', conflictMode);

    const res = await fetch(`${apiBase}/core/admin/preview-csv/${domain}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'CSV preview failed' }));
      throw new ApiError(res.status, err.detail || 'CSV preview failed');
    }

    return res.json();
  },

  importCsv: async (domain: string, file: File | Blob, conflictMode: 'overwrite' | 'skip', dryRun: boolean = false) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vaidya_md_token') : null;
    const apiBase = getApiBase();
    const formData = new FormData();
    formData.append('file', file, file instanceof File ? file.name : `${domain}.csv`);
    formData.append('conflict_mode', conflictMode);
    if (dryRun) {
      formData.append('dry_run', 'true');
    }

    const res = await fetch(`${apiBase}/core/admin/import-csv/${domain}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Import failed' }));
      throw new ApiError(res.status, err.detail || 'Import failed');
    }

    return res.json();
  },
};
