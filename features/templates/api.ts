import { request } from '@/lib/api';

export const templatesApi = {
  list: (pluginId?: string) =>
    request<any[]>(pluginId ? `/core/templates?plugin_id=${encodeURIComponent(pluginId)}` : '/core/templates/'),
  get: (id: string) => request<any>(`/core/templates/${id}`),
  create: (data: Record<string, unknown>) =>
    request('/core/templates/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request(`/core/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

