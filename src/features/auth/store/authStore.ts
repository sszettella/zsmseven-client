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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  setAuth: (user, token) =>
    set({
      user,
      token,
      isAuthenticated: true,
      isAdmin: user.role === UserRole.ADMIN,
    }),
  clearAuth: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
    }),
}));
