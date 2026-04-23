import { api } from './client';
import { Post, Level } from '../types';

interface CreatePostData {
  title: string;
  description?: string;
  location?: string;
  level?: Level;
  playersNeeded?: number;
  date?: string;
  time?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export const postsApi = {
  getFeed: (page = 0, size = 20) =>
    api.get<PageResponse<Post>>('/posts', { params: { page, size } }).then(r => r.data),
  getFollowingFeed: (page = 0, size = 20) =>
    api.get<PageResponse<Post>>('/posts/following', { params: { page, size } }).then(r => r.data),
  getByUser: (userId: string) => api.get<Post[]>(`/posts/user/${userId}`).then(r => r.data),
  create: (data: CreatePostData) => api.post<Post>('/posts', data).then(r => r.data),
  delete: (id: string) => api.delete(`/posts/${id}`),
  like: (id: string) => api.post(`/posts/${id}/like`),
  unlike: (id: string) => api.delete(`/posts/${id}/like`),
};
