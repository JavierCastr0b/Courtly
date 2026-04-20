import { api } from './client';
import { Court, Match } from '../types';

export const courtsApi = {
  getAll: () => api.get<Court[]>('/courts').then(r => r.data),
  getById: (id: string) => api.get<Court>(`/courts/${id}`).then(r => r.data),
  getMatches: (id: string) => api.get<Match[]>(`/courts/${id}/matches`).then(r => r.data),
  search: (q: string) => api.get<Court[]>('/courts/search', { params: { q } }).then(r => r.data),
};
