# Updated Trade Data Model - Open/Close Transaction Pairing

## Overview

A **Trade** represents a complete options position with an opening transaction and an optional closing transaction. Trades remain "open" until a matching closing transaction is added.

---

## Data Model Changes

### 1. Core Entities

#### Trade (formerly OptionTrade)
Represents a complete options trade with opening and optional closing transactions.

```typescript
enum TradeStatus {
  OPEN = 'open',
  CLOSED = 'closed'
}

enum OpeningAction {
  BUY_TO_OPEN = 'buy_to_open',
  SELL_TO_OPEN = 'sell_to_open'
}

enum ClosingAction {
  BUY_TO_CLOSE = 'buy_to_close',
  SELL_TO_CLOSE = 'sell_to_close'
}

enum OptionType {
  CALL = 'call',
  PUT = 'put'
}

interface Trade {
  // Identifiers
  id: string;                          // UUID - Trade identifier
  userId: string;                      // UUID - Owner
  portfolioId?: string;                // UUID - Optional portfolio

  // Trade Specification (same for open and close)
  symbol: string;                      // Stock ticker
  optionType: OptionType;              // CALL or PUT
  strikePrice: number;                 // Strike price
  expirationDate: string;              // ISO date - Same for both legs

  // Opening Transaction
  openAction: OpeningAction;           // BUY_TO_OPEN or SELL_TO_OPEN
  openQuantity: number;                // Number of contracts opened
  openPremium: number;                 // Premium per share on open
  openCommission: number;              // Commission on open
  openTradeDate: string;               // ISO date when opened
  openTotalCost: number;               // Calculated: (premium × quantity × 100) ± commission

  // Closing Transaction (null if still open)
  closeAction?: ClosingAction;         // BUY_TO_CLOSE or SELL_TO_CLOSE
  closeQuantity?: number;              // Must equal openQuantity when closing
  closePremium?: number;               // Premium per share on close
  closeCommission?: number;            // Commission on close
  closeTradeDate?: string;             // ISO date when closed
  closeTotalCost?: number;             // Calculated: (premium × quantity × 100) ± commission

  // Status & Profit/Loss
  status: TradeStatus;                 // OPEN or CLOSED
  profitLoss?: number;                 // Calculated only when CLOSED

  // Metadata
  notes?: string;                      // Trade notes
  createdAt: string;                   // When trade was created
  updatedAt: string;                   // Last update timestamp
}
```

---

## Business Rules

### 1. Transaction Pairing Rules

| Opening Action | Valid Closing Action | Direction |
|----------------|---------------------|-----------|
| BUY_TO_OPEN    | SELL_TO_CLOSE      | Long position (debit → credit) |
| SELL_TO_OPEN   | BUY_TO_CLOSE       | Short position (credit → debit) |

**Validation:**
- Cannot close a trade with wrong action type
- Cannot close an already closed trade
- Close quantity must equal open quantity
- Strike price, expiration, symbol, and option type must remain the same

### 2. Cost Calculations

**Opening Transaction:**
```
If openAction = BUY_TO_OPEN:
  openTotalCost = (openPremium × openQuantity × 100) + openCommission
  // Money paid (debit)

If openAction = SELL_TO_OPEN:
  openTotalCost = (openPremium × openQuantity × 100) - openCommission
  // Money received (credit)
```

**Closing Transaction:**
```
If closeAction = SELL_TO_CLOSE:
  closeTotalCost = (closePremium × closeQuantity × 100) - closeCommission
  // Money received (credit)

If closeAction = BUY_TO_CLOSE:
  closeTotalCost = (closePremium × closeQuantity × 100) + closeCommission
  // Money paid (debit)
```

**Profit/Loss Calculation:**
```
If openAction = BUY_TO_OPEN (long position):
  profitLoss = closeTotalCost - openTotalCost
  // Positive = profit (sold for more than bought)

If openAction = SELL_TO_OPEN (short position):
  profitLoss = openTotalCost - closeTotalCost
  // Positive = profit (bought back for less than sold)
```

**Examples:**

```
Example 1: Profitable Long Trade
Open:  BUY_TO_OPEN,  qty=1, premium=$2.50, commission=$0.65
       openTotalCost = (2.50 × 1 × 100) + 0.65 = $250.65

Close: SELL_TO_CLOSE, qty=1, premium=$3.50, commission=$0.65
       closeTotalCost = (3.50 × 1 × 100) - 0.65 = $349.35

P/L = $349.35 - $250.65 = $98.70 profit

Example 2: Profitable Short Trade
Open:  SELL_TO_OPEN,  qty=1, premium=$3.00, commission=$0.65
       openTotalCost = (3.00 × 1 × 100) - 0.65 = $299.35

Close: BUY_TO_CLOSE,  qty=1, premium=$1.50, commission=$0.65
       closeTotalCost = (1.50 × 1 × 100) + 0.65 = $150.65

P/L = $299.35 - $150.65 = $148.70 profit
```

---

## API Endpoints (Updated)

### 1. GET /api/trades

Get all trades (open and closed).

**Response:**
```json
[
  {
    "id": "trade-uuid-1",
    "userId": "user-uuid",
    "portfolioId": "portfolio-uuid",
    "symbol": "AAPL",
    "optionType": "call",
    "strikePrice": 150.00,
    "expirationDate": "2024-03-15",

    "openAction": "buy_to_open",
    "openQuantity": 5,
    "openPremium": 3.50,
    "openCommission": 6.50,
    "openTradeDate": "2024-01-15",
    "openTotalCost": 1756.50,

    "closeAction": "sell_to_close",
    "closeQuantity": 5,
    "closePremium": 4.25,
    "closeCommission": 6.50,
    "closeTradeDate": "2024-02-01",
    "closeTotalCost": 2118.50,

    "status": "closed",
    "profitLoss": 362.00,

    "notes": "Tech sector play",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-02-01T14:20:00Z"
  },
  {
    "id": "trade-uuid-2",
    "userId": "user-uuid",
    "portfolioId": null,
    "symbol": "TSLA",
    "optionType": "put",
    "strikePrice": 200.00,
    "expirationDate": "2024-04-20",

    "openAction": "sell_to_open",
    "openQuantity": 10,
    "openPremium": 5.75,
    "openCommission": 8.00,
    "openTradeDate": "2024-01-20",
    "openTotalCost": 5742.00,

    "closeAction": null,
    "closeQuantity": null,
    "closePremium": null,
    "closeCommission": null,
    "closeTradeDate": null,
    "closeTotalCost": null,

    "status": "open",
    "profitLoss": null,

    "notes": "Covered put strategy",
    "createdAt": "2024-01-20T09:00:00Z",
    "updatedAt": "2024-01-20T09:00:00Z"
  }
]
```

### 2. GET /api/trades/open

Get only open trades (useful for close transaction selection).

**Query Parameters:**
- `openAction` (optional): Filter by "buy_to_open" or "sell_to_open"
- `symbol` (optional): Filter by symbol

**Response:** Array of trades with `status: "open"`

### 3. POST /api/trades

Create a new trade (opening transaction only).

**Request:**
```json
{
  "portfolioId": "portfolio-uuid",
  "symbol": "AAPL",
  "optionType": "call",
  "strikePrice": 150.00,
  "expirationDate": "2024-03-15",
  "openAction": "buy_to_open",
  "openQuantity": 5,
  "openPremium": 3.50,
  "openCommission": 6.50,
  "openTradeDate": "2024-01-15",
  "notes": "Bullish on tech"
}
```

**Validation:**
- `openAction` must be BUY_TO_OPEN or SELL_TO_OPEN
- All open transaction fields required
- No close transaction fields allowed
- Server sets `status: "open"`

**Response (201):** Created trade with calculated `openTotalCost`

### 4. PUT /api/trades/:id/close

Close an open trade (add closing transaction).

**Request:**
```json
{
  "closeAction": "sell_to_close",
  "closePremium": 4.25,
  "closeCommission": 6.50,
  "closeTradeDate": "2024-02-01"
}
```

**Validation:**
- Trade must have `status: "open"`
- `closeAction` must match `openAction`:
  - If `openAction = buy_to_open` → `closeAction` must be `sell_to_close`
  - If `openAction = sell_to_open` → `closeAction` must be `buy_to_close`
- `closeQuantity` is auto-set to `openQuantity`
- Cannot modify symbol, strike, expiration, or option type

**Business Logic:**
- Set `closeQuantity = openQuantity`
- Calculate `closeTotalCost`
- Calculate `profitLoss`
- Set `status = "closed"`
- Update `updatedAt`

**Response (200):** Updated trade with all close fields populated

### 5. PUT /api/trades/:id

Update trade details (only allowed for open trades).

**Allowed Updates:**
- Opening transaction details (quantity, premium, commission, date)
- Trade metadata (symbol, strike, expiration, option type)
- Notes, portfolioId

**Forbidden:**
- Cannot update closed trades
- Cannot update closing transaction via this endpoint

### 6. DELETE /api/trades/:id

Delete a trade.

**Rules:**
- Can delete both open and closed trades
- User must own the trade or be admin

---

## UI Changes

### 1. Trade Entry Form (Opening Only)

**Fields:**
- Symbol
- Option Type (Call/Put)
- Strike Price
- Expiration Date
- **Opening Action** (BUY_TO_OPEN or SELL_TO_OPEN only)
- Quantity (contracts)
- Premium (per share)
- Commission
- Trade Date
- Notes

**Display:**
- Show "Total Cost" for BUY_TO_OPEN
- Show "Total Credit" for SELL_TO_OPEN

### 2. Close Trade Form

**Triggered by:** Click "Close" button on open trade

**Pre-filled Fields (read-only):**
- Symbol
- Option Type
- Strike Price
- Expiration Date
- Opening Action
- Quantity (auto-set from opening)

**Editable Fields:**
- **Closing Action** (auto-determined based on opening action)
  - If opened with BUY_TO_OPEN → SELL_TO_CLOSE
  - If opened with SELL_TO_OPEN → BUY_TO_CLOSE
- Premium (closing premium)
- Commission
- Trade Date (closing date)

**Display:**
- Show opening transaction summary
- Show projected P/L based on entered close premium
- Show "Total Credit" for SELL_TO_CLOSE
- Show "Total Cost" for BUY_TO_CLOSE

### 3. Trade List

**Columns:**
- Status Badge (OPEN / CLOSED)
- Symbol
- Type (Call/Put)
- Strike
- Expiration
- Action (Opening action)
- Quantity
- Open Date
- Open Premium
- Open Total
- Close Date (if closed)
- Close Premium (if closed)
- Close Total (if closed)
- **P/L** (if closed, color-coded: green=profit, red=loss)
- Actions:
  - **Close** button (only for OPEN trades)
  - **Edit** button (only for OPEN trades)
  - **Delete** button (always)
  - **View Details** (always)

### 4. Dashboard Updates

**Metrics:**
- Total Open Trades
- Total Closed Trades
- Total Profit/Loss (sum of all closed trades)
- Largest Win
- Largest Loss
- Win Rate (% of profitable closed trades)

---

## Migration Strategy

### Option A: Database Schema Change (Breaking)

```sql
-- Drop old table
DROP TABLE option_trades;

-- Create new table
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL,

  -- Trade specification
  symbol VARCHAR(10) NOT NULL,
  option_type VARCHAR(10) NOT NULL CHECK (option_type IN ('call', 'put')),
  strike_price DECIMAL(10,2) NOT NULL,
  expiration_date DATE NOT NULL,

  -- Opening transaction
  open_action VARCHAR(20) NOT NULL CHECK (open_action IN ('buy_to_open', 'sell_to_open')),
  open_quantity INTEGER NOT NULL CHECK (open_quantity > 0),
  open_premium DECIMAL(10,2) NOT NULL,
  open_commission DECIMAL(10,2) NOT NULL,
  open_trade_date DATE NOT NULL,
  open_total_cost DECIMAL(12,2) NOT NULL,

  -- Closing transaction (nullable)
  close_action VARCHAR(20) CHECK (close_action IN ('buy_to_close', 'sell_to_close')),
  close_quantity INTEGER CHECK (close_quantity > 0),
  close_premium DECIMAL(10,2),
  close_commission DECIMAL(10,2),
  close_trade_date DATE,
  close_total_cost DECIMAL(12,2),

  -- Status and P/L
  status VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  profit_loss DECIMAL(12,2),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_close_action CHECK (
    (open_action = 'buy_to_open' AND (close_action IS NULL OR close_action = 'sell_to_close'))
    OR
    (open_action = 'sell_to_open' AND (close_action IS NULL OR close_action = 'buy_to_close'))
  ),
  CONSTRAINT close_quantity_matches CHECK (
    (close_quantity IS NULL AND status = 'open')
    OR
    (close_quantity = open_quantity AND status = 'closed')
  ),
  CONSTRAINT status_consistency CHECK (
    (status = 'open' AND close_action IS NULL)
    OR
    (status = 'closed' AND close_action IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_user_status ON trades(user_id, status);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_expiration ON trades(expiration_date);
```

### Option B: Gradual Migration (Non-breaking)

If you have existing data:
1. Keep old `option_trades` table
2. Mark existing trades as "legacy single transactions"
3. New trades use paired model
4. Provide migration tool to convert old data

---

## TypeScript Type Definitions

```typescript
// src/types/trade.ts

export enum TradeStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

export enum OpeningAction {
  BUY_TO_OPEN = 'buy_to_open',
  SELL_TO_OPEN = 'sell_to_open',
}

export enum ClosingAction {
  BUY_TO_CLOSE = 'buy_to_close',
  SELL_TO_CLOSE = 'sell_to_close',
}

export enum OptionType {
  CALL = 'call',
  PUT = 'put',
}

export interface Trade {
  id: string;
  userId: string;
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
  openTotalCost: number;

  closeAction?: ClosingAction;
  closeQuantity?: number;
  closePremium?: number;
  closeCommission?: number;
  closeTradeDate?: string;
  closeTotalCost?: number;

  status: TradeStatus;
  profitLoss?: number;

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface CloseTradeData {
  closeAction: ClosingAction;
  closePremium: number;
  closeCommission: number;
  closeTradeDate: string;
}

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
}

// Helper function
export function getValidCloseAction(openAction: OpeningAction): ClosingAction {
  return openAction === OpeningAction.BUY_TO_OPEN
    ? ClosingAction.SELL_TO_CLOSE
    : ClosingAction.BUY_TO_CLOSE;
}
```

---

## Summary of Changes

### Data Model
- ✅ Trade now contains both opening and closing transactions
- ✅ Status field (OPEN/CLOSED)
- ✅ Profit/Loss calculated on close
- ✅ Quantity must match between open and close
- ✅ Validation rules for action pairing

### API
- ✅ New endpoint: `GET /api/trades/open` for selecting trades to close
- ✅ New endpoint: `PUT /api/trades/:id/close` for closing trades
- ✅ Updated response format with all open/close fields

### UI
- ✅ Separate forms for opening and closing trades
- ✅ Close button on open trades
- ✅ Auto-fill close form with trade details
- ✅ P/L display on closed trades
- ✅ Status badges (OPEN/CLOSED)
- ✅ Filter to show only matching open trades when closing

### Business Logic
- ✅ Action pairing validation
- ✅ Cost calculation for both legs
- ✅ P/L calculation based on position direction
- ✅ Prevent closing already closed trades
- ✅ Prevent editing closed trades
