import { api } from './client';
import { Invitation } from '../types';

export const invitationsApi = {
  getPending: () => api.get<Invitation[]>('/invitations').then(r => r.data),
  create: (data: { toUserId: string; courtId?: string; customLocation?: string; date: string; time: string; message?: string }) =>
    api.post<Invitation>('/invitations', data).then(r => r.data),
  accept: (id: string) => api.put<Invitation>(`/invitations/${id}/accept`).then(r => r.data),
  reject: (id: string) => api.put<Invitation>(`/invitations/${id}/reject`).then(r => r.data),
};
