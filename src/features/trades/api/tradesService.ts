import { apiClient } from '@/api/client';
import { OptionTrade, CreateTradeData, UpdateTradeData } from '@/types/trade';

export const tradesService = {
  getByPortfolio: async (portfolioId: string): Promise<OptionTrade[]> => {
    const { data } = await apiClient.get<OptionTrade[]>(`/portfolios/${portfolioId}/trades`);
    return data;
  },

  getById: async (portfolioId: string, tradeId: string): Promise<OptionTrade> => {
    const { data } = await apiClient.get<OptionTrade>(
      `/portfolios/${portfolioId}/trades/${tradeId}`
    );
    return data;
  },

  create: async (portfolioId: string, trade: CreateTradeData): Promise<OptionTrade> => {
    const { data } = await apiClient.post<OptionTrade>(
      `/portfolios/${portfolioId}/trades`,
      trade
    );
    return data;
  },

  update: async (
    portfolioId: string,
    tradeId: string,
    trade: UpdateTradeData
  ): Promise<OptionTrade> => {
    const { data } = await apiClient.put<OptionTrade>(
      `/portfolios/${portfolioId}/trades/${tradeId}`,
      trade
    );
    return data;
  },

  delete: async (portfolioId: string, tradeId: string): Promise<void> => {
    await apiClient.delete(`/portfolios/${portfolioId}/trades/${tradeId}`);
  },
};
