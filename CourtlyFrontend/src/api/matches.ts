import { api } from './client';
import { Match, Level } from '../types';

interface CreateMatchData {
  courtId: string;
  date: string;
  time: string;
  level: Level;
  totalSpots: number;
  description?: string;
}

export const matchesApi = {
  getAll: (params?: { courtId?: string; level?: Level; date?: string }) =>
    api.get<Match[]>('/matches', { params }).then(r => r.data),
  getById: (id: string) => api.get<Match>(`/matches/${id}`).then(r => r.data),
  create: (data: CreateMatchData) => api.post<Match>('/matches', data).then(r => r.data),
  join: (id: string) => api.post<Match>(`/matches/${id}/join`).then(r => r.data),
  leave: (id: string) => api.delete(`/matches/${id}/leave`),
  delete: (id: string) => api.delete(`/matches/${id}`),
};
