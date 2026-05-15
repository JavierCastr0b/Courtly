import { api } from './client';
import { AuthResponse, Level } from '../types';

export const authApi = {
  register: (name: string, username: string, email: string, password: string, level: Level) =>
    api.post<AuthResponse>('/auth/register', { name, username, email, password, level }).then(r => r.data),

  login: (username: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { username, password }).then(r => r.data),
};
