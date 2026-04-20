import { api } from './client';
import { Challenge } from '../types';

export const challengesApi = {
  getMine: () => api.get<Challenge[]>('/challenges').then(r => r.data),
  create: (data: { challengedUserId: string; description: string; deadline: string }) =>
    api.post<Challenge>('/challenges', data).then(r => r.data),
  accept: (id: string) => api.put<Challenge>(`/challenges/${id}/accept`).then(r => r.data),
  setScore: (id: string, score: string) =>
    api.put<Challenge>(`/challenges/${id}/score`, { score }).then(r => r.data),
};
