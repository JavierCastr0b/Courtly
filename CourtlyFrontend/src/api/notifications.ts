import { api } from './client';

export interface AppNotification {
  id: string;
  type: string; // FOLLOW | LIKE
  read: boolean;
  createdAt: string;
  referenceId: string | null;
  sender: { id: string; name: string; username: string; avatar: string | null };
  recipient: { id: string };
}

export const notificationsApi = {
  getAll: () => api.get<AppNotification[]>('/notifications').then(r => r.data),
  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count').then(r => r.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};
