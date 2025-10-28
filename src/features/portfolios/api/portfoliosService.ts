import { apiClient } from '@/api/client';
import { Portfolio, CreatePortfolioData, UpdatePortfolioData } from '@/types/portfolio';

export const portfoliosService = {
  getAll: async (): Promise<Portfolio[]> => {
    const { data } = await apiClient.get<Portfolio[]>('/portfolios');
    return data;
  },

  getById: async (id: string): Promise<Portfolio> => {
    const { data } = await apiClient.get<Portfolio>(`/portfolios/${id}`);
    return data;
  },

  create: async (portfolio: CreatePortfolioData): Promise<Portfolio> => {
    const { data } = await apiClient.post<Portfolio>('/portfolios', portfolio);
    return data;
  },

  update: async (id: string, portfolio: UpdatePortfolioData): Promise<Portfolio> => {
    const { data } = await apiClient.put<Portfolio>(`/portfolios/${id}`, portfolio);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/portfolios/${id}`);
  },
};
