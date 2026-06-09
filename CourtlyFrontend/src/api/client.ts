import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'http://192.168.1.39:8080/api';
const TOKEN_KEY = '@courtly_token';

// Cache token in memory — avoids concurrent AsyncStorage reads per-request
let _cachedToken: string | null | undefined = undefined;
let _tokenPromise: Promise<string | null> | null = null;

export async function getToken(): Promise<string | null> {
  if (_cachedToken !== undefined) return _cachedToken;
  if (!_tokenPromise) {
    _tokenPromise = AsyncStorage.getItem(TOKEN_KEY).then(t => {
      _cachedToken = t;
      _tokenPromise = null;
      return t;
    });
  }
  return _tokenPromise;
}

export async function setToken(token: string): Promise<void> {
  _cachedToken = token;
  return AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  _cachedToken = null;
  return AsyncStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async config => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.error ?? err.response?.data ?? err.message;
    return Promise.reject(new Error(message));
  }
);
