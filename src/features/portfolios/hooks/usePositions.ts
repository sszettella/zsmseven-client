import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPortfolioPositions,
  getPosition,
  createPosition,
  updatePosition,
  deletePosition,
  batchUpdatePrices,
} from '../api/positionsService';
import { CreatePositionData, UpdatePositionData, BatchPriceUpdateData } from '@/types/position';

// Query keys
export const positionKeys = {
  all: ['positions'] as const,
  portfolio: (portfolioId: string) => [...positionKeys.all, 'portfolio', portfolioId] as const,
  detail: (positionId: string) => [...positionKeys.all, 'detail', positionId] as const,
};

// Get all positions for a portfolio
export const usePortfolioPositions = (portfolioId: string) => {
  return useQuery({
    queryKey: positionKeys.portfolio(portfolioId),
    queryFn: () => getPortfolioPositions(portfolioId),
    enabled: !!portfolioId,
  });
};

// Get a single position
export const usePosition = (portfolioId: string, positionId: string) => {
  return useQuery({
    queryKey: positionKeys.detail(positionId),
    queryFn: () => getPosition(portfolioId, positionId),
    enabled: !!portfolioId && !!positionId,
  });
};

// Create position mutation
export const useCreatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ portfolioId, data }: { portfolioId: string; data: CreatePositionData }) =>
      createPosition(portfolioId, data),
    onSuccess: (_, variables) => {
      // Invalidate portfolio positions query
      queryClient.invalidateQueries({
        queryKey: positionKeys.portfolio(variables.portfolioId),
      });
      // Invalidate portfolio query to refresh metrics
      queryClient.invalidateQueries({
        queryKey: ['portfolio', variables.portfolioId],
      });
    },
  });
};

// Update position mutation
export const useUpdatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ portfolioId, positionId, data }: { portfolioId: string; positionId: string; data: UpdatePositionData }) =>
      updatePosition(portfolioId, positionId, data),
    onSuccess: (position) => {
      // Invalidate the specific position
      queryClient.invalidateQueries({
        queryKey: positionKeys.detail(position.id),
      });
      // Invalidate portfolio positions
      queryClient.invalidateQueries({
        queryKey: positionKeys.portfolio(position.portfolioId),
      });
      // Invalidate portfolio query to refresh metrics
      queryClient.invalidateQueries({
        queryKey: ['portfolio', position.portfolioId],
      });
    },
  });
};

// Delete position mutation
export const useDeletePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ portfolioId, positionId }: { portfolioId: string; positionId: string }) =>
      deletePosition(portfolioId, positionId),
    onSuccess: (_, variables) => {
      // Invalidate all position queries
      queryClient.invalidateQueries({
        queryKey: positionKeys.all,
      });
      // Invalidate all portfolio queries to refresh metrics
      queryClient.invalidateQueries({
        queryKey: ['portfolios'],
      });
      // Invalidate specific portfolio
      queryClient.invalidateQueries({
        queryKey: ['portfolio', variables.portfolioId],
      });
    },
  });
};

// Batch update prices mutation
export const useBatchUpdatePrices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ portfolioId, data }: { portfolioId: string; data: BatchPriceUpdateData }) =>
      batchUpdatePrices(portfolioId, data),
    onSuccess: (_, variables) => {
      // Invalidate portfolio positions to refresh with new prices
      queryClient.invalidateQueries({
        queryKey: positionKeys.portfolio(variables.portfolioId),
      });
      // Invalidate portfolio query to refresh metrics
      queryClient.invalidateQueries({
        queryKey: ['portfolio', variables.portfolioId],
      });
    },
  });
};
