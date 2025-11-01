import { apiClient } from '@/api/client';
import { Portfolio, CreatePortfolioData, UpdatePortfolioData, PortfolioAnalysis } from '@/types/portfolio';

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
    // According to API spec, set default by updating the portfolio with isDefault: true
    // The server automatically unsets isDefault on all other user portfolios
    const { data } = await apiClient.put<Portfolio>(`/portfolios/${id}`, { isDefault: true });
    // API returns portfolio directly according to spec
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/portfolios/${id}`);
  },

  getAnalysis: async (id: string, includeDetails: boolean = false): Promise<PortfolioAnalysis> => {
    const { data } = await apiClient.get<any>(
      `/portfolios/${id}/analysis`,
      {
        params: {
          limit: 1,
          includeDetails,
        },
      }
    );

    // Handle case where parsed_data is a JSON string instead of an object
    if (data && typeof data.parsed_data === 'string') {
      try {
        data.parsed_data = JSON.parse(data.parsed_data);
      } catch (e) {
        console.error('Failed to parse parsed_data:', e);
      }
    }

    // Transform the API response to match our TypeScript interface
    // The API returns an array directly in parsed_data, with fields: score, reason, price, rsi, ma50
    // We need to transform it to match PositionOpportunity interface
    if (data && Array.isArray(data.parsed_data)) {
      data.parsed_data = {
        opportunities: data.parsed_data.map((item: any) => ({
          ticker: item.ticker,
          opportunityScore: item.score,
          reasoning: item.reason,
          weight_percent: item.weight_percent,
          pl_percent: item.pl_percent,
        }))
      };
    }

    return data as PortfolioAnalysis;
  },
};
