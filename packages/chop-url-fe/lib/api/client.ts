import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Remove CORS headers from client side as they should be set by the server
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 0 && error.message === 'Network Error') {
      console.error('CORS or Network Error:', error);
      return Promise.reject(
        new Error('Network error occurred. Please try again.')
      );
    }

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const response = await apiClient.post('/auth/refresh');
        const { token } = response.data;

        // Update the token in cookies
        Cookies.set('auth_token', token, {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });

        // Update the Authorization header
        originalRequest.headers.Authorization = `Bearer ${token}`;

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, redirect to login
        Cookies.remove('auth_token');
        window.location.href = '/auth/signin';
        return Promise.reject(refreshError);
      }
    }

    // If the error is 404, redirect to home page only if it's an auth endpoint
    if (
      error.response?.status === 404 &&
      error.config.url?.includes('/auth/')
    ) {
      window.location.href = '/';
    }

    return Promise.reject(error);
  }
);
