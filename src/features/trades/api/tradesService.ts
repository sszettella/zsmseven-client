import { apiClient } from '@/api/client';
import { Trade, CreateTradeData, CloseTradeData, UpdateTradeData } from '@/types/trade';

export const tradesService = {
  // Get all trades for the user
  getAll: async (): Promise<Trade[]> => {
    const { data } = await apiClient.get<Trade[]>('/trades');
    return data;
  },

  // Get only open trades (for close selection)
  getOpen: async (): Promise<Trade[]> => {
    const { data } = await apiClient.get<Trade[]>('/trades/open');
    return data;
  },

  // Get trades by portfolio
  getByPortfolio: async (portfolioId: string): Promise<Trade[]> => {
    const { data } = await apiClient.get<Trade[]>(`/portfolios/${portfolioId}/trades`);
    return data;
  },

  // Get trade by ID
  getById: async (tradeId: string): Promise<Trade> => {
    const { data } = await apiClient.get<Trade>(`/trades/${tradeId}`);
    return data;
  },

  // Create new trade (opening transaction)
  create: async (trade: CreateTradeData): Promise<Trade> => {
    const { data } = await apiClient.post<Trade>('/trades', trade);
    return data;
  },

  // Close an open trade
  close: async (tradeId: string, closeData: CloseTradeData): Promise<Trade> => {
    const { data } = await apiClient.put<Trade>(`/trades/${tradeId}/close`, closeData);
    return data;
  },

  // Update open trade details
  update: async (tradeId: string, trade: UpdateTradeData): Promise<Trade> => {
    const { data } = await apiClient.put<Trade>(`/trades/${tradeId}`, trade);
    return data;
  },

  // Delete trade
  delete: async (tradeId: string): Promise<void> => {
    await apiClient.delete(`/trades/${tradeId}`);
  },
};
