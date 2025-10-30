import { useMemo } from 'react';
import { usePortfolioPositions } from './usePositions';
import { useTrades } from '@/features/trades/hooks/useTrades';
import { TradeStatus, Trade } from '@/types/trade';
import { PortfolioYieldMetrics } from '@/types/portfolio';
import { calculateYieldPercent, calculateAnnualizedYield } from '@/shared/utils/calculations';

/**
 * Hook to calculate portfolio yield metrics based on closed trades in the last 30 days
 * compared to the current portfolio value
 */
export const usePortfolioYield = (portfolioId: string): PortfolioYieldMetrics | null => {
  const { data: positions } = usePortfolioPositions(portfolioId);
  const { data: trades } = useTrades(portfolioId);

  const yieldMetrics = useMemo(() => {
    if (!positions || !trades) {
      return null;
    }

    // Calculate portfolio value (market value if available, otherwise cost basis)
    const portfolioValue = positions.reduce((sum, p) => {
      return sum + (p.marketValue || p.costBasis);
    }, 0);

    // If portfolio has no value, can't calculate yield
    if (portfolioValue === 0) {
      return {
        last30DaysPL: 0,
        last30DaysYieldPercent: 0,
        last30DaysYieldDollar: 0,
        last30DaysAnnualizedYield: 0,
        portfolioValue: 0,
        tradesCount: 0,
      };
    }

    // Filter closed trades from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const last30DaysTrades = trades.filter((trade: Trade) => {
      if (trade.status !== TradeStatus.CLOSED || !trade.closeTradeDate) {
        return false;
      }
      const closeDate = new Date(trade.closeTradeDate);
      return closeDate >= thirtyDaysAgo;
    });

    // Calculate total P&L from last 30 days
    const last30DaysPL = last30DaysTrades.reduce((sum, trade) => {
      return sum + (trade.profitLoss || 0);
    }, 0);

    // Calculate yield percentage
    const yieldPercent = calculateYieldPercent(last30DaysPL, portfolioValue);

    // Calculate annualized yield (30 days scaled to 365 days)
    const annualizedYield = calculateAnnualizedYield(yieldPercent, 30);

    return {
      last30DaysPL,
      last30DaysYieldPercent: yieldPercent,
      last30DaysYieldDollar: last30DaysPL, // Same as P&L for clarity
      last30DaysAnnualizedYield: annualizedYield,
      portfolioValue,
      tradesCount: last30DaysTrades.length,
    };
  }, [positions, trades]);

  return yieldMetrics;
};
