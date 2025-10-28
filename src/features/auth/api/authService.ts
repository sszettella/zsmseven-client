import { apiClient } from '@/api/client';
import { AuthResponse, LoginCredentials, RegisterData, User } from '@/types/auth';

const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'auth_token';
const REFRESH_TOKEN_KEY = import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    return data;
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', userData);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const { data } = await apiClient.post<{ token: string }>('/auth/refresh', {
      refreshToken,
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  },
};
