import { api } from './client';
import { Match, Level } from '../types';

interface CreateMatchData {
  courtId?: string;
  customLocation?: string;
  date: string;
  time: string;
  level: Level;
  totalSpots: number;
  description?: string;
  matchType?: string;
  sportType?: string;
}

export interface MatchSet { a: number; b: number; }

export const matchesApi = {
  getAll: (params?: { courtId?: string; level?: Level; date?: string }) =>
    api.get<Match[]>('/matches', { params }).then(r => r.data),
  getById: (id: string) => api.get<Match>(`/matches/${id}`).then(r => r.data),
  create: (data: CreateMatchData) => api.post<Match>('/matches', data).then(r => r.data),
  join: (id: string, team?: 'A' | 'B', guestName?: string) =>
    api.post<Match>(`/matches/${id}/join`, team ? { team, guestName } : {}).then(r => r.data),
  setMyTeam: (id: string, team: 'A' | 'B') =>
    api.post<Match>(`/matches/${id}/my-team`, { team }).then(r => r.data),
  leave: (id: string) => api.delete(`/matches/${id}/leave`),
  delete: (id: string) => api.delete(`/matches/${id}`),
  recordResult: (id: string, winningTeam: 'A' | 'B' | null, sets: MatchSet[], winnerIds?: string[]) =>
    api.patch<Match>(`/matches/${id}/result`, { winningTeam, sets, winnerIds }).then(r => r.data),
};
