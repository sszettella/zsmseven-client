import { apiClient } from '@/api/client';
import { OptionTrade, CreateTradeData, UpdateTradeData } from '@/types/trade';

export const tradesService = {
  // Get all trades for the user (standalone API)
  getAll: async (): Promise<OptionTrade[]> => {
    const { data } = await apiClient.get<OptionTrade[]>('/trades');
    return data;
  },

  // Get trades by portfolio (backward compatibility)
  getByPortfolio: async (portfolioId: string): Promise<OptionTrade[]> => {
    const { data } = await apiClient.get<OptionTrade[]>(`/portfolios/${portfolioId}/trades`);
    return data;
  },

  // Get trade by ID (standalone API)
  getById: async (tradeId: string): Promise<OptionTrade> => {
    const { data } = await apiClient.get<OptionTrade>(`/trades/${tradeId}`);
    return data;
  },

  // Get trade by ID and portfolio (backward compatibility)
  getByIdWithPortfolio: async (portfolioId: string, tradeId: string): Promise<OptionTrade> => {
    const { data } = await apiClient.get<OptionTrade>(
      `/portfolios/${portfolioId}/trades/${tradeId}`
    );
    return data;
  },

  // Create trade (supports both standalone and portfolio-based)
  create: async (trade: CreateTradeData): Promise<OptionTrade> => {
    if (trade.portfolioId) {
      // Use portfolio-scoped endpoint for backward compatibility
      const { data } = await apiClient.post<OptionTrade>(
        `/portfolios/${trade.portfolioId}/trades`,
        trade
      );
      return data;
    } else {
      // Use standalone endpoint
      const { data } = await apiClient.post<OptionTrade>('/trades', trade);
      return data;
    }
  },

  // Update trade (standalone API)
  update: async (tradeId: string, trade: UpdateTradeData): Promise<OptionTrade> => {
    const { data } = await apiClient.put<OptionTrade>(`/trades/${tradeId}`, trade);
    return data;
  },

  // Update trade with portfolio context (backward compatibility)
  updateWithPortfolio: async (
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

  // Delete trade (standalone API)
  delete: async (tradeId: string): Promise<void> => {
    await apiClient.delete(`/trades/${tradeId}`);
  },

  // Delete trade with portfolio context (backward compatibility)
  deleteWithPortfolio: async (portfolioId: string, tradeId: string): Promise<void> => {
    await apiClient.delete(`/portfolios/${portfolioId}/trades/${tradeId}`);
  },
};
