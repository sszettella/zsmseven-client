import { OptionAction } from '@/types/trade';

/**
 * Calculate total cost/credit for an option trade
 * For buying (debit): (premium * quantity * 100) + commission
 * For selling (credit): (premium * quantity * 100) - commission
 */
export const calculateTotalCost = (
  action: OptionAction,
  premium: number,
  quantity: number,
  commission: number
): number => {
  const optionValue = premium * quantity * 100;

  if (
    action === OptionAction.BUY_TO_OPEN ||
    action === OptionAction.BUY_TO_CLOSE
  ) {
    return optionValue + commission;
  } else {
    return optionValue - commission;
  }
};

/**
 * Calculate profit/loss for a closed position
 */
export const calculateProfitLoss = (
  openCost: number,
  closeCost: number,
  openAction: OptionAction
): number => {
  if (
    openAction === OptionAction.BUY_TO_OPEN ||
    openAction === OptionAction.BUY_TO_CLOSE
  ) {
    // Bought position - profit when sell price > buy price
    return closeCost - openCost;
  } else {
    // Sold position - profit when buy back price < sell price
    return openCost - closeCost;
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
