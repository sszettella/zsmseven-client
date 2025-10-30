import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tradesService } from '../api/tradesService';
import { CreateTradeData, CloseTradeData, UpdateTradeData } from '@/types/trade';

// Get all trades - supports filtering by portfolio
export const useTrades = (portfolioId?: string) => {
  return useQuery({
    queryKey: portfolioId ? ['trades', portfolioId] : ['trades'],
    queryFn: () => portfolioId ? tradesService.getByPortfolio(portfolioId) : tradesService.getAll(),
  });
};

// Get only open trades (for close selection)
export const useOpenTrades = () => {
  return useQuery({
    queryKey: ['trades', 'open'],
    queryFn: () => tradesService.getOpen(),
  });
};

// Get single trade
export const useTrade = (tradeId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['trade', tradeId],
    queryFn: () => tradesService.getById(tradeId),
    enabled: options?.enabled !== undefined ? options.enabled : !!tradeId,
  });
};

// Create trade (opening transaction)
export const useCreateTrade = (portfolioId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trade: CreateTradeData) => {
      const tradeData = portfolioId ? { ...trade, portfolioId } : trade;
      return tradesService.create(tradeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['trades', 'open'] });
      if (portfolioId) {
        queryClient.invalidateQueries({ queryKey: ['trades', portfolioId] });
        queryClient.invalidateQueries({ queryKey: ['portfolio', portfolioId] });
      }
    },
  });
};

// Close an open trade
export const useCloseTrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tradeId, closeData }: { tradeId: string; closeData: CloseTradeData }) =>
      tradesService.close(tradeId, closeData),
    onSuccess: (updatedTrade) => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['trades', 'open'] });
      queryClient.invalidateQueries({ queryKey: ['trade', updatedTrade.id] });
      if (updatedTrade.portfolioId) {
        queryClient.invalidateQueries({ queryKey: ['trades', updatedTrade.portfolioId] });
        queryClient.invalidateQueries({ queryKey: ['portfolio', updatedTrade.portfolioId] });
      }
    },
  });
};

// Update trade (open trades only)
export const useUpdateTrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tradeId, data }: {
      tradeId: string;
      data: UpdateTradeData;
      oldPortfolioId?: string;
    }) =>
      tradesService.update(tradeId, data),
    onSuccess: (updatedTrade, variables) => {
      // Invalidate general trade queries
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['trades', 'open'] });
      queryClient.invalidateQueries({ queryKey: ['trade', updatedTrade.id] });

      // Invalidate old portfolio cache if it existed and was different
      if (variables.oldPortfolioId && variables.oldPortfolioId !== updatedTrade.portfolioId) {
        queryClient.invalidateQueries({ queryKey: ['trades', variables.oldPortfolioId] });
        queryClient.invalidateQueries({ queryKey: ['portfolio', variables.oldPortfolioId] });
      }

      // Invalidate new portfolio cache if one is set
      if (updatedTrade.portfolioId) {
        queryClient.invalidateQueries({ queryKey: ['trades', updatedTrade.portfolioId] });
        queryClient.invalidateQueries({ queryKey: ['portfolio', updatedTrade.portfolioId] });
      }
    },
  });
};

// Delete trade
export const useDeleteTrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tradeId }: { tradeId: string }) => tradesService.delete(tradeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['trades', 'open'] });
    },
  });
};
