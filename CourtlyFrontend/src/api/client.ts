import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

function getBaseUrl(): string {
  // In dev, hostUri is the Metro bundler address (e.g. "192.168.x.x:8081")
  // We swap the port for our backend port
  const hostUri = Constants.expoConfig?.hostUri;
  if (__DEV__ && hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:8080/api`;
  }
  return 'https://your-production-api.com/api';
}

export const BASE_URL = getBaseUrl();
const TOKEN_KEY = '@courtly_token';

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  return AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
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
