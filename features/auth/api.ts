import { request } from '@/lib/api';

// ==========================================
// 1. Core Auth Feature API (Clean Architecture)
// ==========================================
export const authApi = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: any }>('/core/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  listUsers: () => request<any[]>('/core/auth/users'),
  getDoctors: () => request<any[]>('/core/auth/doctors'),
  me: () => request<any>('/core/auth/me'),
  updateUser: (id: string, data: Record<string, unknown>) =>
    request<any>(`/core/auth/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};
