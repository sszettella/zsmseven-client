export enum OptionAction {
  BUY_TO_OPEN = 'buy_to_open',
  BUY_TO_CLOSE = 'buy_to_close',
  SELL_TO_OPEN = 'sell_to_open',
  SELL_TO_CLOSE = 'sell_to_close',
}

export enum OptionType {
  CALL = 'call',
  PUT = 'put',
}

export interface OptionTrade {
  id: string;
  portfolioId?: string; // Optional - for standalone trades
  userId: string;

  // Trade details
  symbol: string;
  action: OptionAction;
  optionType: OptionType;
  strikePrice: number;
  expirationDate: string;

  // Transaction details
  quantity: number; // number of contracts
  premium: number; // price per share
  commission: number;
  tradeDate: string;

  // Calculated fields
  totalCost: number; // (premium * quantity * 100) + commission

  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTradeData {
  portfolioId?: string; // Optional - for standalone trades
  symbol: string;
  action: OptionAction;
  optionType: OptionType;
  strikePrice: number;
  expirationDate: string;
  quantity: number;
  premium: number;
  commission: number;
  tradeDate: string;
  notes?: string;
}

export interface UpdateTradeData {
  portfolioId?: string | null; // Can be updated or set to null
  symbol?: string;
  action?: OptionAction;
  optionType?: OptionType;
  strikePrice?: number;
  expirationDate?: string;
  quantity?: number;
  premium?: number;
  commission?: number;
  tradeDate?: string;
  notes?: string;
}
