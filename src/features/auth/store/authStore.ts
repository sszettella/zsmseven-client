import { create } from 'zustand';
import { User, UserRole } from '@/types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

// Storage keys
const AUTH_USER_KEY = 'auth_user';
const TOKEN_KEY = 'auth_token';

// Helper to get initial state from localStorage
const getInitialState = () => {
  try {
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (storedUser && storedToken) {
      const user: User = JSON.parse(storedUser);
      const isAdmin = user.role === UserRole.ADMIN;
      console.log('Auth state loaded from localStorage:', {
        user,
        role: user.role,
        expectedRole: UserRole.ADMIN,
        isAdmin,
        roleMatch: user.role === UserRole.ADMIN
      });
      return {
        user,
        token: storedToken,
        isAuthenticated: true,
        isAdmin,
      };
    }
  } catch (error) {
    console.error('Error loading auth state from localStorage:', error);
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isAdmin: false,
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialState(),
  setAuth: (user, token) => {
    // Persist to localStorage
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);

    const isAdmin = user.role === UserRole.ADMIN;
    console.log('setAuth called:', {
      user,
      role: user.role,
      expectedRole: UserRole.ADMIN,
      isAdmin,
      roleMatch: user.role === UserRole.ADMIN
    });

    set({
      user,
      token,
      isAuthenticated: true,
      isAdmin,
    });
  },
  clearAuth: () => {
    // Clear from localStorage
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(TOKEN_KEY);

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
    });
  },
}));
