import { api } from './client';
import { Club, User } from '../types';

export const clubsApi = {
  getAll: () => api.get<Club[]>('/clubs').then(r => r.data),
  getById: (id: string) => api.get<Club>(`/clubs/${id}`).then(r => r.data),
  getMembers: (id: string) => api.get<User[]>(`/clubs/${id}/members`).then(r => r.data),
  create: (data: { name: string; description?: string; location?: string }) =>
    api.post<Club>('/clubs', data).then(r => r.data),
  join: (id: string) => api.post(`/clubs/${id}/join`),
  leave: (id: string) => api.delete(`/clubs/${id}/leave`),
};
