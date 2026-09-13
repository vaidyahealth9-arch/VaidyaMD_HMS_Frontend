import { request, toQueryString } from '@/lib/api';

export const notificationsApi = {
  list: (userId?: string, unreadOnly?: boolean) =>
    request<any[]>(`/core/notifications/${toQueryString({ user_id: userId, unread_only: unreadOnly })}`),
  markRead: (id: string) => request(`/core/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: (userId: string) => request(`/core/notifications/mark-all-read/${userId}`, { method: 'POST' }),
};
