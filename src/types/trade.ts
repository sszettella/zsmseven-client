// Trade Status
export enum TradeStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

// Opening Actions (create new positions)
export enum OpeningAction {
  BUY_TO_OPEN = 'buy_to_open',
  SELL_TO_OPEN = 'sell_to_open',
}

// Closing Actions (close existing positions)
export enum ClosingAction {
  BUY_TO_CLOSE = 'buy_to_close',
  SELL_TO_CLOSE = 'sell_to_close',
}

// Option Type
export enum OptionType {
  CALL = 'call',
  PUT = 'put',
}

// Main Trade interface - represents a complete options position
export interface Trade {
  // Identifiers
  id: string;
  userId: string;
  portfolioId?: string;

  // Trade Specification (applies to both open and close)
  symbol: string;
  optionType: OptionType;
  strikePrice: number;
  expirationDate: string; // ISO date string

  // Opening Transaction (always present)
  openAction: OpeningAction;
  openQuantity: number;
  openPremium: number;
  openCommission: number;
  openTradeDate: string; // ISO date string
  openTotalCost: number; // Calculated by server

  // Closing Transaction (null until trade is closed)
  closeAction?: ClosingAction;
  closeQuantity?: number; // Must equal openQuantity when closing
  closePremium?: number;
  closeCommission?: number;
  closeTradeDate?: string; // ISO date string
  closeTotalCost?: number; // Calculated by server

  // Status and P/L
  status: TradeStatus;
  profitLoss?: number; // Calculated by server when closed

  // Metadata
  notes?: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

// Data for creating a new trade (opening transaction only)
export interface CreateTradeData {
  portfolioId?: string;
  symbol: string;
  optionType: OptionType;
  strikePrice: number;
  expirationDate: string;
  openAction: OpeningAction;
  openQuantity: number;
  openPremium: number;
  openCommission: number;
  openTradeDate: string;
  notes?: string;
}

// Data for closing an existing trade
export interface CloseTradeData {
  closeAction: ClosingAction;
  closePremium: number;
  closeCommission: number;
  closeTradeDate: string;
}

// Data for updating an open trade (or closed trade if backend supports it)
export interface UpdateTradeData {
  portfolioId?: string | null;
  symbol?: string;
  optionType?: OptionType;
  strikePrice?: number;
  expirationDate?: string;
  openAction?: OpeningAction;
  openQuantity?: number;
  openPremium?: number;
  openCommission?: number;
  openTradeDate?: string;
  notes?: string;
  // Closing transaction fields (for updating closed trades)
  closeAction?: ClosingAction;
  closePremium?: number;
  closeCommission?: number;
  closeTradeDate?: string;
}

// Helper function to determine valid closing action based on opening action
export function getValidCloseAction(openAction: OpeningAction): ClosingAction {
  return openAction === OpeningAction.BUY_TO_OPEN
    ? ClosingAction.SELL_TO_CLOSE
    : ClosingAction.BUY_TO_CLOSE;
}

// Helper function to check if an action is an opening action
export function isOpeningAction(action: string): action is OpeningAction {
  return action === OpeningAction.BUY_TO_OPEN || action === OpeningAction.SELL_TO_OPEN;
}

// Helper function to check if an action is a closing action
export function isClosingAction(action: string): action is ClosingAction {
  return action === ClosingAction.BUY_TO_CLOSE || action === ClosingAction.SELL_TO_CLOSE;
}

// Helper to check if actions are properly paired
export function areActionsPaired(openAction: OpeningAction, closeAction: ClosingAction): boolean {
  if (openAction === OpeningAction.BUY_TO_OPEN) {
    return closeAction === ClosingAction.SELL_TO_CLOSE;
  }
  if (openAction === OpeningAction.SELL_TO_OPEN) {
    return closeAction === ClosingAction.BUY_TO_CLOSE;
  }
  return false;
}

// Legacy type for backward compatibility during migration
export interface OptionTrade extends Trade {}
