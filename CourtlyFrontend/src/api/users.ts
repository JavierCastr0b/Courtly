import { api } from './client';
import { User } from '../types';

export const usersApi = {
  me: () => api.get<User>('/users/me').then(r => r.data),
  getById: (id: string) => api.get<User>(`/users/${id}`).then(r => r.data),
  search: (q: string) => api.get<User[]>(`/users/search`, { params: { q } }).then(r => r.data),
  update: (id: string, data: Partial<Pick<User, 'name' | 'bio' | 'location' | 'available'>>) =>
    api.put<User>(`/users/${id}`, data).then(r => r.data),
  follow: (id: string) => api.post(`/users/${id}/follow`),
  unfollow: (id: string) => api.delete(`/users/${id}/follow`),
};
