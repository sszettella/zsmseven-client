import { apiClient } from '@/api/client';
import {
  Position,
  CreatePositionData,
  UpdatePositionData,
  BatchPriceUpdateData,
  BatchPriceUpdateResponse,
} from '@/types/position';

// Get all positions for a portfolio
export const getPortfolioPositions = async (portfolioId: string): Promise<Position[]> => {
  try {
    const response = await apiClient.get(`/portfolios/${portfolioId}/positions`);
    // API returns array directly according to spec, not wrapped in {positions: [...]}
    return Array.isArray(response.data) ? response.data : (response.data.positions || []);
  } catch (error: any) {
    // If endpoint doesn't exist or returns 404, return empty array
    if (error.response?.status === 404 || !error.response) {
      console.warn('Positions endpoint not available, returning empty array');
      return [];
    }
    throw error;
  }
};

// Get a single position by ID
export const getPosition = async (portfolioId: string, positionId: string): Promise<Position> => {
  const response = await apiClient.get(`/portfolios/${portfolioId}/positions/${positionId}`);
  // API returns position directly according to spec
  return response.data;
};

// Create a new position
export const createPosition = async (
  portfolioId: string,
  data: CreatePositionData
): Promise<Position> => {
  const response = await apiClient.post(`/portfolios/${portfolioId}/positions`, data);
  // API returns position directly according to spec
  return response.data;
};

// Update an existing position
export const updatePosition = async (
  portfolioId: string,
  positionId: string,
  data: UpdatePositionData
): Promise<Position> => {
  const response = await apiClient.put(`/portfolios/${portfolioId}/positions/${positionId}`, data);
  // API returns position directly according to spec
  return response.data;
};

// Delete a position
export const deletePosition = async (portfolioId: string, positionId: string): Promise<void> => {
  await apiClient.delete(`/portfolios/${portfolioId}/positions/${positionId}`);
};

// Batch update current prices for multiple positions
export const batchUpdatePrices = async (
  portfolioId: string,
  data: BatchPriceUpdateData
): Promise<BatchPriceUpdateResponse> => {
  const response = await apiClient.patch(
    `/portfolios/${portfolioId}/positions/prices`,
    data
  );
  return response.data;
};
