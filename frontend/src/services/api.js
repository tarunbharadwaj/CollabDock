import axios from 'axios';
import { auth } from '@/lib/firebase';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:4000/api/v1', timeout: 15000 });
api.interceptors.request.use(async (config) => {
  if (auth?.currentUser) config.headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
  return config;
});

export function apiMessage(error) { return error.response?.data?.error?.message || error.message || 'Something went wrong'; }
