import { apiClient } from '@/api/client';
import { User, RegisterData } from '@/types/auth';

export const usersService = {
  getAll: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users');
    return data;
  },

  getById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },

  create: async (user: RegisterData): Promise<User> => {
    const { data } = await apiClient.post<User>('/users', user);
    return data;
  },

  update: async (id: string, user: Partial<User>): Promise<User> => {
    const { data } = await apiClient.put<User>(`/users/${id}`, user);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
