// Position represents a holding of shares in a portfolio
export interface Position {
  id: string;
  portfolioId: string;
  ticker: string;
  shares: number; // Can be fractional (e.g., 10.5)
  costBasis: number; // Total cost basis in dollars
  averageCost: number; // SERVER CALCULATED: costBasis / shares
  currentPrice?: number; // Optional: Current market price per share
  marketValue?: number; // SERVER CALCULATED: shares × currentPrice
  unrealizedPL?: number; // SERVER CALCULATED: marketValue - costBasis
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Data for creating a new position
export interface CreatePositionData {
  ticker: string;
  shares: number;
  costBasis: number;
  currentPrice?: number;
  notes?: string;
}

// Data for updating a position
export interface UpdatePositionData {
  ticker?: string;
  shares?: number;
  costBasis?: number;
  currentPrice?: number | null; // Can be set to null to clear
  notes?: string;
}

// Batch price update
export interface PositionPriceUpdate {
  ticker: string;
  currentPrice: number;
}

export interface BatchPriceUpdateData {
  prices: PositionPriceUpdate[];
}

export interface BatchPriceUpdateResponse {
  updated: number;
  positions: Array<{
    id: string;
    ticker: string;
    currentPrice: number;
    marketValue: number;
    unrealizedPL: number;
  }>;
}

// Helper function to calculate unrealized P&L percentage
export function calculateUnrealizedPLPercent(position: Position): number | undefined {
  if (!position.unrealizedPL || !position.costBasis) {
    return undefined;
  }
  return (position.unrealizedPL / position.costBasis) * 100;
}

// Helper function to format ticker symbol (uppercase)
export function formatTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

// Helper function to check if position has current price data
export function hasCurrentPrice(position: Position): boolean {
  return position.currentPrice !== undefined && position.currentPrice !== null;
}
