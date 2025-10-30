import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'auth_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL || ''}${config.url || ''}`,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
    });
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      // Only redirect to login if it's NOT a login or register attempt
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') ||
                             error.config?.url?.includes('/auth/register');

      console.log('401 Unauthorized:', {
        url: error.config?.url,
        isAuthEndpoint,
        errorMessage: error.response?.data?.message || error.message,
        headers: error.config?.headers
      });

      if (!isAuthEndpoint) {
        // Handle unauthorized - clear all auth data and redirect to login
        console.warn('Clearing auth data and redirecting to login due to 401');
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
