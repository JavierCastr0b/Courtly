import { api } from './client';
import { Equipment, Match, User, UserActivity } from '../types';

export const usersApi = {
  me: () => api.get<User>('/users/me').then(r => r.data),
  getById: (id: string) => api.get<User>(`/users/${id}`).then(r => r.data),
  search: (q: string) => api.get<User[]>(`/users/search`, { params: { q } }).then(r => r.data),
  update: (id: string, data: Partial<Pick<User, 'name' | 'bio' | 'location' | 'available' | 'dominantHand' | 'preferredSide' | 'preferredFormat' | 'preferredStyle'>>) =>
    api.put<User>(`/users/${id}`, data).then(r => r.data),
  follow: (id: string) => api.post(`/users/${id}/follow`),
  unfollow: (id: string) => api.delete(`/users/${id}/follow`),
  getFollowing: () => api.get<string[]>('/users/me/following').then(r => r.data),
  getStats: (id: string) => api.get<{ followersCount: number; followingCount: number }>(`/users/${id}/stats`).then(r => r.data),
  getFollowersList: (id: string) => api.get<User[]>(`/users/${id}/followers`).then(r => r.data),
  getFollowingList: (id: string) => api.get<User[]>(`/users/${id}/following`).then(r => r.data),
  getFriends: (id: string) => api.get<User[]>(`/users/${id}/friends`).then(r => r.data),
  getEquipment: (id: string) => api.get<Equipment[]>(`/users/${id}/equipment`).then(r => r.data),
  getActivity: (id: string) => api.get<UserActivity[]>(`/users/${id}/activity`).then(r => r.data),
  getMatches: (id: string) => api.get<Match[]>(`/users/${id}/matches`).then(r => r.data),
  addEquipment: (data: { type: 'PALA' | 'ZAPATILLA'; name?: string; brand?: string }) =>
    api.post<Equipment>('/equipment', data).then(r => r.data),
  deleteEquipment: (id: string) => api.delete(`/equipment/${id}`),
  recommend: (id: string, stars: number) =>
    api.post<{ rating: number; count: number }>(`/users/${id}/recommend`, { stars }).then(r => r.data),
  getMyRecommendation: (id: string) =>
    api.get<{ stars: number }>(`/users/${id}/my-recommendation`).then(r => r.data),
};
