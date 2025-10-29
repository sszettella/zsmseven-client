import { apiClient } from '@/shared/api/client';
import {
  Position,
  CreatePositionData,
  UpdatePositionData,
  BatchPriceUpdateData,
  BatchPriceUpdateResponse,
} from '@/types/position';

const POSITIONS_BASE_URL = '/positions';

// Get all positions for a portfolio
export const getPortfolioPositions = async (portfolioId: string): Promise<Position[]> => {
  const response = await apiClient.get(`/portfolios/${portfolioId}/positions`);
  return response.data.positions;
};

// Get a single position by ID
export const getPosition = async (positionId: string): Promise<Position> => {
  const response = await apiClient.get(`${POSITIONS_BASE_URL}/${positionId}`);
  return response.data.position;
};

// Create a new position
export const createPosition = async (
  portfolioId: string,
  data: CreatePositionData
): Promise<Position> => {
  const response = await apiClient.post(`/portfolios/${portfolioId}/positions`, data);
  return response.data.position;
};

// Update an existing position
export const updatePosition = async (
  positionId: string,
  data: UpdatePositionData
): Promise<Position> => {
  const response = await apiClient.put(`${POSITIONS_BASE_URL}/${positionId}`, data);
  return response.data.position;
};

// Delete a position
export const deletePosition = async (positionId: string): Promise<void> => {
  await apiClient.delete(`${POSITIONS_BASE_URL}/${positionId}`);
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
