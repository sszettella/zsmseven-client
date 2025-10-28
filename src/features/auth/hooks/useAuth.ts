import { useMutation, useQuery } from '@tanstack/react-query';
import { authService } from '../api/authService';
import { useAuthStore } from '../store/authStore';
import { LoginCredentials, RegisterData } from '@/types/auth';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const { user, isAuthenticated, isAdmin, setAuth, clearAuth } = useAuthStore();
  return { user, isAuthenticated, isAdmin, setAuth, clearAuth };
};

export const useLogin = () => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      navigate('/');
    },
  });
};

export const useRegister = () => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (userData: RegisterData) => authService.register(userData),
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      navigate('/');
    },
  });
};

export const useLogout = () => {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearAuth();
      navigate('/login');
    },
  });
};

export const useCurrentUser = () => {
  const { setAuth, clearAuth } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const user = await authService.getCurrentUser();
        const token = localStorage.getItem('auth_token') || '';
        setAuth(user, token);
        return user;
      } catch (error) {
        clearAuth();
        throw error;
      }
    },
    retry: false,
  });
};
