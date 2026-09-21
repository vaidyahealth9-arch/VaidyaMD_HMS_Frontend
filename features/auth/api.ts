import { request, toQueryString } from '@/lib/api';

// ==========================================
// 1. Core Auth Feature API (Clean Architecture)
// ==========================================
export const authApi = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: any }>('/core/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  listUsers: (params?: { per_page?: number; page?: number; role?: string; include_inactive?: boolean }) =>
    request<any[]>(`/core/auth/users${toQueryString(params)}`),
  getDoctors: () => request<any[]>('/core/auth/doctors'),
  me: () => request<any>('/core/auth/me'),
  updateUser: (id: string, data: Record<string, unknown>) =>
    request<any>(`/core/auth/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  createUser: (data: Record<string, unknown>) =>
    request<any>('/core/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateUser: (id: string, data: Record<string, unknown>) =>
    request<any>(`/core/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};
