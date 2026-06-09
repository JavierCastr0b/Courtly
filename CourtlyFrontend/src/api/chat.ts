import { api } from './client';
import type { ChatMessage, MatchAttendance, AttendanceStatus } from '../types';

export const chatApi = {
  getMessages: (matchId: string): Promise<ChatMessage[]> =>
    api.get<ChatMessage[]>(`/matches/${matchId}/chat`).then(r => r.data),

  sendMessage: (matchId: string, content: string, type: ChatMessage['type'] = 'TEXT'): Promise<ChatMessage> =>
    api.post<ChatMessage>(`/matches/${matchId}/chat`, { content, type }).then(r => r.data),

  getAttendance: (matchId: string): Promise<MatchAttendance[]> =>
    api.get<MatchAttendance[]>(`/matches/${matchId}/attendance`).then(r => r.data),

  updateAttendance: (matchId: string, status: AttendanceStatus): Promise<MatchAttendance> =>
    api.put<MatchAttendance>(`/matches/${matchId}/attendance`, { status }).then(r => r.data),
};
