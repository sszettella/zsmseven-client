import { apiClient } from '@/api/client';
import { Portfolio, CreatePortfolioData, UpdatePortfolioData } from '@/types/portfolio';

export const portfoliosService = {
  getAll: async (): Promise<Portfolio[]> => {
    const { data } = await apiClient.get<Portfolio[]>('/portfolios');
    // API returns array directly according to spec
    return data;
  },

  getById: async (id: string): Promise<Portfolio> => {
    const { data } = await apiClient.get<Portfolio>(`/portfolios/${id}`);
    // API returns portfolio directly according to spec
    return data;
  },

  getDefault: async (): Promise<Portfolio | null> => {
    try {
      const { data } = await apiClient.get<Portfolio>('/portfolios/default');
      // API returns portfolio directly, not wrapped
      return data;
    } catch (error: any) {
      // Return null if no default portfolio found (404)
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  create: async (portfolio: CreatePortfolioData): Promise<Portfolio> => {
    const { data } = await apiClient.post<Portfolio>('/portfolios', portfolio);
    // API returns portfolio directly according to spec
    return data;
  },

  update: async (id: string, portfolio: UpdatePortfolioData): Promise<Portfolio> => {
    const { data } = await apiClient.put<Portfolio>(`/portfolios/${id}`, portfolio);
    // API returns portfolio directly according to spec
    return data;
  },

  setDefault: async (id: string): Promise<Portfolio> => {
    const { data } = await apiClient.post<Portfolio>(`/portfolios/${id}/set-default`);
    // API returns portfolio directly according to spec
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/portfolios/${id}`);
  },
};
