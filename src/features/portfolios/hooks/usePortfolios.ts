import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfoliosService } from '../api/portfoliosService';
import { CreatePortfolioData, UpdatePortfolioData } from '@/types/portfolio';

export const usePortfolios = () => {
  return useQuery({
    queryKey: ['portfolios'],
    queryFn: () => portfoliosService.getAll(),
  });
};

export const usePortfolio = (id: string) => {
  return useQuery({
    queryKey: ['portfolio', id],
    queryFn: () => portfoliosService.getById(id),
    enabled: !!id,
  });
};

export const useCreatePortfolio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (portfolio: CreatePortfolioData) => portfoliosService.create(portfolio),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
};

export const useUpdatePortfolio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePortfolioData }) =>
      portfoliosService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', variables.id] });
    },
  });
};

export const useDefaultPortfolio = () => {
  return useQuery({
    queryKey: ['portfolios', 'default'],
    queryFn: () => portfoliosService.getDefault(),
  });
};

export const useSetDefaultPortfolio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => portfoliosService.setDefault(id),
    onSuccess: (_, id) => {
      // Invalidate all portfolio queries to update isDefault flags
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      // Invalidate the default portfolio query
      queryClient.invalidateQueries({ queryKey: ['portfolios', 'default'] });
      // Invalidate the specific portfolio that was updated
      queryClient.invalidateQueries({ queryKey: ['portfolio', id] });
    },
  });
};

export const useDeletePortfolio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => portfoliosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
};

export const usePortfolioAnalysis = (id: string, includeDetails: boolean = false) => {
  return useQuery({
    queryKey: ['portfolio', id, 'analysis', includeDetails],
    queryFn: () => portfoliosService.getAnalysis(id, includeDetails),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes since analysis doesn't change frequently
    retry: false, // Don't retry on 404 - analysis may not exist yet
  });
};
