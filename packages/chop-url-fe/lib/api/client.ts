import { removeToken } from '@/lib/auth';
import { useAuthStore } from '@/lib/store/auth';
import useUrlStore from '@/lib/store/url';
import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
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
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    let status: number | undefined;

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      status = error.response.status;
      const data = error.response.data as { error?: string };

      switch (status) {
        case 401:
          toast.error('Authentication required');
          break;
        case 403:
          toast.error('You do not have permission to perform this action');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 429:
          toast.error('Too many requests. Please try again later');
          break;
        case 500:
          toast.error('Internal server error');
          break;
        default:
          toast.error(data.error || 'An unexpected error occurred');
      }
    } else if (error.request) {
      // The request was made but no response was received
      toast.error('No response from server');
    } else {
      // Something happened in setting up the request
      toast.error('Failed to make request');
    }

    const isLoginOrRegisterRoute = ['login', 'register'].includes(
      error.request?.responseURL?.split('/').pop() || ''
    );

    if (status === 401 && !isLoginOrRegisterRoute) {
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

export default apiClient;
