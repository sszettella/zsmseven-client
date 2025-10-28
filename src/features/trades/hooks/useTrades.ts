import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tradesService } from '../api/tradesService';
import { CreateTradeData, UpdateTradeData } from '@/types/trade';

export const useTrades = (portfolioId: string) => {
  return useQuery({
    queryKey: ['trades', portfolioId],
    queryFn: () => tradesService.getByPortfolio(portfolioId),
    enabled: !!portfolioId,
  });
};

export const useTrade = (portfolioId: string, tradeId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['trade', portfolioId, tradeId],
    queryFn: () => tradesService.getById(portfolioId, tradeId),
    enabled: options?.enabled !== undefined ? options.enabled : (!!portfolioId && !!tradeId),
  });
};

export const useCreateTrade = (portfolioId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trade: CreateTradeData) => tradesService.create(portfolioId, trade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', portfolioId] });
    },
  });
};

export const useUpdateTrade = (portfolioId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tradeId, data }: { tradeId: string; data: UpdateTradeData }) =>
      tradesService.update(portfolioId, tradeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trades', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['trade', portfolioId, variables.tradeId] });
    },
  });
};

export const useDeleteTrade = (portfolioId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tradeId: string) => tradesService.delete(portfolioId, tradeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades', portfolioId] });
    },
  });
};
