import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tradesService } from '../api/tradesService';
import { CreateTradeData, UpdateTradeData } from '@/types/trade';

// Get all trades - supports both all trades and portfolio-filtered
export const useTrades = (portfolioId?: string) => {
  return useQuery({
    queryKey: portfolioId ? ['trades', portfolioId] : ['trades'],
    queryFn: () => portfolioId ? tradesService.getByPortfolio(portfolioId) : tradesService.getAll(),
  });
};

// Get single trade - supports both standalone and portfolio-scoped
export const useTrade = (portfolioId: string | undefined, tradeId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: portfolioId ? ['trade', portfolioId, tradeId] : ['trade', tradeId],
    queryFn: () => portfolioId
      ? tradesService.getByIdWithPortfolio(portfolioId, tradeId)
      : tradesService.getById(tradeId),
    enabled: options?.enabled !== undefined ? options.enabled : !!tradeId,
  });
};

// Create trade - supports both standalone and portfolio-scoped
export const useCreateTrade = (portfolioId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trade: CreateTradeData) => {
      // Add portfolioId to trade data if provided
      const tradeData = portfolioId ? { ...trade, portfolioId } : trade;
      return tradesService.create(tradeData);
    },
    onSuccess: () => {
      // Invalidate all trades query
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      // Also invalidate portfolio-specific queries if applicable
      if (portfolioId) {
        queryClient.invalidateQueries({ queryKey: ['trades', portfolioId] });
        queryClient.invalidateQueries({ queryKey: ['portfolio', portfolioId] });
      }
    },
  });
};

// Update trade - supports both standalone and portfolio-scoped
export const useUpdateTrade = (portfolioId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tradeId, data }: { tradeId: string; data: UpdateTradeData }) =>
      portfolioId
        ? tradesService.updateWithPortfolio(portfolioId, tradeId, data)
        : tradesService.update(tradeId, data),
    onSuccess: (_, variables) => {
      // Invalidate all trades query
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      // Invalidate specific trade
      queryClient.invalidateQueries({ queryKey: ['trade', variables.tradeId] });
      // Also invalidate portfolio-specific queries if applicable
      if (portfolioId) {
        queryClient.invalidateQueries({ queryKey: ['trades', portfolioId] });
        queryClient.invalidateQueries({ queryKey: ['trade', portfolioId, variables.tradeId] });
      }
    },
  });
};

// Delete trade - supports both standalone and portfolio-scoped
export const useDeleteTrade = (portfolioId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tradeId }: { tradeId: string }) =>
      portfolioId
        ? tradesService.deleteWithPortfolio(portfolioId, tradeId)
        : tradesService.delete(tradeId),
    onSuccess: () => {
      // Invalidate all trades query
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      // Also invalidate portfolio-specific queries if applicable
      if (portfolioId) {
        queryClient.invalidateQueries({ queryKey: ['trades', portfolioId] });
      }
    },
  });
};
