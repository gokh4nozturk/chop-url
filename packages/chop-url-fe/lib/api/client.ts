import axios from 'axios';
import { getToken } from '../auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
client.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Delete the token and redirect to the login page
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default client;
