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
  getFollowing: () => api.get<string[]>('/users/me/following').then(r => r.data),
  getStats: (id: string) => api.get<{ followersCount: number; followingCount: number }>(`/users/${id}/stats`).then(r => r.data),
  getFollowersList: (id: string) => api.get<User[]>(`/users/${id}/followers`).then(r => r.data),
  getFollowingList: (id: string) => api.get<User[]>(`/users/${id}/following`).then(r => r.data),
  getFriends: (id: string) => api.get<User[]>(`/users/${id}/friends`).then(r => r.data),
};
