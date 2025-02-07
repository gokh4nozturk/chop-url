import { getToken } from '@/lib/auth';
import { User } from '@/lib/types';
import axios from 'axios';

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

export interface UpdateProfileData {
  username: string;
  email: string;
  name: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const updateProfile = async (data: UpdateProfileData): Promise<User> => {
  const response = await client.put('/api/auth/profile', data);
  return response.data.user;
};

export const updatePassword = async (
  data: UpdatePasswordData
): Promise<void> => {
  await client.put('/api/auth/password', data);
};

export default client;
