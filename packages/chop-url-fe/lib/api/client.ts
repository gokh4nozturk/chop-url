import { removeToken } from '@/lib/auth';
import { useAuthStore } from '@/lib/store/auth';
import useUrlStore from '@/lib/store/url';
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
client.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isLoginOrRegisterRoute = ['login', 'register'].includes(
      error.request.responseURL.split('/').pop()
    );

    if (error.response?.status === 401 && !isLoginOrRegisterRoute) {
      // Clear all stores
      useAuthStore.getState().logout();
      useUrlStore.getState().clearStore();

      // Remove token
      removeToken();

      // Redirect to auth page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
