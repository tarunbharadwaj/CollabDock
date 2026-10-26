import axios from 'axios';
import { auth } from '@/lib/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();

if (!API_BASE_URL && import.meta.env.DEV) {
  console.warn('VITE_API_BASE_URL is not configured. API requests will use the current origin.');
}

export const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });
api.interceptors.request.use(async (config) => {
  if (auth?.currentUser) config.headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
  return config;
});

export function apiMessage(error) { return error.response?.data?.error?.message || error.message || 'Something went wrong'; }
