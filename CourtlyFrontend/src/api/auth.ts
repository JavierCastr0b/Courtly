import { api } from './client';
import { AuthResponse } from '../types';

export const authApi = {
  register: (name: string, username: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { name, username, email, password }).then(r => r.data),

  login: (username: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { username, password }).then(r => r.data),
};
