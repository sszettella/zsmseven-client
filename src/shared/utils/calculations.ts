import { OpeningAction, ClosingAction } from '@/types/trade';

/**
 * Calculate total cost/credit for an opening transaction
 * For BUY_TO_OPEN (debit): (premium * quantity * 100) + commission
 * For SELL_TO_OPEN (credit): (premium * quantity * 100) - commission
 */
export const calculateOpenTotalCost = (
  openAction: OpeningAction,
  premium: number,
  quantity: number,
  commission: number
): number => {
  const optionValue = premium * quantity * 100;

  if (openAction === OpeningAction.BUY_TO_OPEN) {
    return optionValue + commission; // Debit
  } else {
    return optionValue - commission; // Credit
  }
};

/**
 * Calculate total cost/credit for a closing transaction
 * For SELL_TO_CLOSE (credit): (premium * quantity * 100) - commission
 * For BUY_TO_CLOSE (debit): (premium * quantity * 100) + commission
 */
export const calculateCloseTotalCost = (
  closeAction: ClosingAction,
  premium: number,
  quantity: number,
  commission: number
): number => {
  const optionValue = premium * quantity * 100;

  if (closeAction === ClosingAction.SELL_TO_CLOSE) {
    return optionValue - commission; // Credit
  } else {
    return optionValue + commission; // Debit
  }
};

/**
 * Calculate profit/loss for a closed position
 * For BUY_TO_OPEN (long): profitLoss = closeTotalCost - openTotalCost
 * For SELL_TO_OPEN (short): profitLoss = openTotalCost - closeTotalCost
 */
export const calculateProfitLoss = (
  openTotalCost: number,
  closeTotalCost: number,
  openAction: OpeningAction
): number => {
  if (openAction === OpeningAction.BUY_TO_OPEN) {
    // Long position - profit when sell price > buy price
    return closeTotalCost - openTotalCost;
  } else {
    // Short position - profit when buy back price < sell price
    return openTotalCost - closeTotalCost;
  }
};

/**
 * Format currency value
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

/**
 * Calculate yield percentage based on profit/loss and cost basis
 * @param profitLoss - Total profit or loss
 * @param costBasis - Initial investment or portfolio value
 * @returns Yield as a percentage
 */
export const calculateYieldPercent = (profitLoss: number, costBasis: number): number => {
  if (costBasis === 0) return 0;
  return (profitLoss / costBasis) * 100;
};

/**
 * Calculate annualized yield percentage
 * @param yieldPercent - Yield percentage for the period
 * @param days - Number of days in the period
 * @returns Annualized yield as a percentage
 */
export const calculateAnnualizedYield = (yieldPercent: number, days: number): number => {
  if (days === 0) return 0;
  // Annualize by scaling to 365 days
  return (yieldPercent / days) * 365;
};
