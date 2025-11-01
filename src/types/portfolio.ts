import { Position } from './position';

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isDefault: boolean; // Default portfolio for options trades
}

export interface CreatePortfolioData {
  name: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdatePortfolioData {
  name?: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

// Portfolio metrics calculated from positions
export interface PortfolioMetrics {
  totalPositions: number;
  totalMarketValue: number;
  totalCostBasis: number;
  totalUnrealizedPL: number;
  totalUnrealizedPLPercent: number;
  topGainer?: {
    ticker: string;
    unrealizedPLPercent: number;
  };
  topLoser?: {
    ticker: string;
    unrealizedPLPercent: number;
  };
}

// Associated trades summary (options linked to portfolio)
export interface AssociatedTradesSummary {
  openCount: number;
  closedCount: number;
  totalProfitLoss: number;
}

// Yield metrics for a portfolio based on closed trades
export interface PortfolioYieldMetrics {
  // 30-day yield metrics
  last30DaysPL: number;
  last30DaysYieldPercent: number;
  last30DaysYieldDollar: number;
  last30DaysAnnualizedYield: number;

  // Portfolio value for calculation
  portfolioValue: number;

  // Number of trades used in calculation
  tradesCount: number;
}

// Full portfolio summary with positions and metrics
export interface PortfolioSummary {
  portfolio: Portfolio;
  positions: Position[];
  metrics: PortfolioMetrics;
  associatedTrades?: AssociatedTradesSummary;
}

// Portfolio analysis data structure
export interface PositionOpportunity {
  ticker: string;
  opportunityScore: number; // -10 to 10
  reasoning?: string;
  weight_percent?: number;
  pl_percent?: number;
}

export interface PortfolioAnalysis {
  portfolioId: string;
  timestamp: string;
  portfolioName: string;
  model: string;
  dataAsOf: string;
  analysis?: string;
  prompt?: string;
  parsed_data?: {
    summary?: {
      total_value?: number;
      total_pl?: number;
      pl_percentage?: number;
      risk_level?: string;
    };
    top_positions?: Array<{
      ticker: string;
      weight_percent?: number;
      pl_percent?: number;
    }>;
    recommendations?: string[];
    opportunities?: PositionOpportunity[];
  };
  error?: string;
}
