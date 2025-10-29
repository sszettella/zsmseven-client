# Options Trades API Specification - Open/Close Model

## Overview

Build a RESTful API for managing options trades with an **open/close transaction model**. Each trade consists of an opening transaction (required) and an optional closing transaction. Trades remain "open" until a matching closing transaction is added.

---

## Key Concepts

### Trade Lifecycle
1. **Opening**: User creates a trade with BUY_TO_OPEN or SELL_TO_OPEN → Status: OPEN
2. **Open Period**: Trade remains open (can be edited/deleted)
3. **Closing**: User adds closing transaction (SELL_TO_CLOSE or BUY_TO_CLOSE) → Status: CLOSED
4. **Closed Period**: Trade is locked (cannot be edited, only viewed/deleted)

### Transaction Pairing Rules
| Opening Action | Valid Closing Action | Position Type |
|----------------|---------------------|---------------|
| BUY_TO_OPEN    | SELL_TO_CLOSE       | Long (debit → credit) |
| SELL_TO_OPEN   | BUY_TO_CLOSE        | Short (credit → debit) |

---

## Base Configuration

- **Base URL**: `/api`
- **Content-Type**: `application/json`
- **Authentication**: JWT Bearer token via `Authorization` header
- **Error Format**:
```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

---

## Data Models

### Enums

```typescript
enum TradeStatus {
  OPEN = "open",
  CLOSED = "closed"
}

enum OpeningAction {
  BUY_TO_OPEN = "buy_to_open",
  SELL_TO_OPEN = "sell_to_open"
}

enum ClosingAction {
  BUY_TO_CLOSE = "buy_to_close",
  SELL_TO_CLOSE = "sell_to_close"
}

enum OptionType {
  CALL = "call",
  PUT = "put"
}
```

### Trade Entity

```typescript
interface Trade {
  // Identifiers
  id: string;                          // UUID
  userId: string;                      // UUID - owner
  portfolioId?: string;                // UUID - optional portfolio

  // Trade Specification (same for open and close legs)
  symbol: string;                      // Stock ticker (e.g., "AAPL")
  optionType: OptionType;              // CALL or PUT
  strikePrice: number;                 // Strike price
  expirationDate: string;              // ISO date (YYYY-MM-DD)

  // Opening Transaction (always present)
  openAction: OpeningAction;           // BUY_TO_OPEN or SELL_TO_OPEN
  openQuantity: number;                // Number of contracts (integer)
  openPremium: number;                 // Premium per share (not per contract)
  openCommission: number;              // Opening commission
  openTradeDate: string;               // ISO date when opened
  openTotalCost: number;               // SERVER-CALCULATED (see formula)

  // Closing Transaction (null when trade is open)
  closeAction?: ClosingAction;         // BUY_TO_CLOSE or SELL_TO_CLOSE
  closeQuantity?: number;              // Must equal openQuantity
  closePremium?: number;               // Closing premium per share
  closeCommission?: number;            // Closing commission
  closeTradeDate?: string;             // ISO date when closed
  closeTotalCost?: number;             // SERVER-CALCULATED

  // Status and Performance
  status: TradeStatus;                 // OPEN or CLOSED
  profitLoss?: number;                 // SERVER-CALCULATED (only when closed)

  // Metadata
  notes?: string;
  createdAt: string;                   // ISO datetime
  updatedAt: string;                   // ISO datetime
}
```

---

## Server-Side Calculations

### Opening Total Cost

```
If openAction = BUY_TO_OPEN:
  openTotalCost = (openPremium × openQuantity × 100) + openCommission
  // Debit: money paid

If openAction = SELL_TO_OPEN:
  openTotalCost = (openPremium × openQuantity × 100) - openCommission
  // Credit: money received
```

### Closing Total Cost

```
If closeAction = SELL_TO_CLOSE:
  closeTotalCost = (closePremium × closeQuantity × 100) - closeCommission
  // Credit: money received

If closeAction = BUY_TO_CLOSE:
  closeTotalCost = (closePremium × closeQuantity × 100) + closeCommission
  // Debit: money paid
```

### Profit/Loss

**IMPORTANT**: Only calculated when status = CLOSED

```
If openAction = BUY_TO_OPEN (Long Position):
  profitLoss = closeTotalCost - openTotalCost
  // Positive = sold for more than bought

If openAction = SELL_TO_OPEN (Short Position):
  profitLoss = openTotalCost - closeTotalCost
  // Positive = bought back for less than sold
```

**Examples**:

```
PROFITABLE LONG TRADE:
Open:  BUY_TO_OPEN, qty=1, premium=$2.50, commission=$0.65
       openTotalCost = (2.50 × 1 × 100) + 0.65 = $250.65

Close: SELL_TO_CLOSE, qty=1, premium=$3.50, commission=$0.65
       closeTotalCost = (3.50 × 1 × 100) - 0.65 = $349.35

P/L = $349.35 - $250.65 = +$98.70 ✓

PROFITABLE SHORT TRADE:
Open:  SELL_TO_OPEN, qty=2, premium=$5.00, commission=$1.30
       openTotalCost = (5.00 × 2 × 100) - 1.30 = $998.70

Close: BUY_TO_CLOSE, qty=2, premium=$3.00, commission=$1.30
       closeTotalCost = (3.00 × 2 × 100) + 1.30 = $601.30

P/L = $998.70 - $601.30 = +$397.40 ✓
```

---

## API Endpoints

### 1. GET /api/trades

Get all trades for authenticated user.

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
- `status` (optional): Filter by "open" or "closed"
- `symbol` (optional): Filter by stock symbol
- `portfolioId` (optional): Filter by portfolio UUID

**Authorization**:
- Regular users: Returns only their trades (`userId` matches token)
- Admin users: Returns all trades

**Response (200)**:
```json
[
  {
    "id": "trade-123",
    "userId": "user-456",
    "portfolioId": "portfolio-789",
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
    "id": "trade-124",
    "userId": "user-456",
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

    "notes": null,
    "createdAt": "2024-01-20T09:00:00Z",
    "updatedAt": "2024-01-20T09:00:00Z"
  }
]
```

---

### 2. GET /api/trades/open

Get only open trades (useful for selecting a trade to close).

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
- `openAction` (optional): Filter by "buy_to_open" or "sell_to_open"
- `symbol` (optional): Filter by symbol

**Use Case**: When user wants to close a position, show them only open trades with the appropriate action type.

**Response (200)**: Array of Trade objects with `status: "open"`

---

### 3. GET /api/trades/:id

Get a specific trade by ID.

**Headers**:
```
Authorization: Bearer {token}
```

**Path Parameters**:
- `id` - Trade UUID

**Authorization**:
- User must own the trade OR be admin

**Response (200)**: Single Trade object

**Errors**:
- `403 Forbidden` - User doesn't own trade and is not admin
- `404 Not Found` - Trade doesn't exist

---

### 4. POST /api/trades

Create a new trade (opening transaction only).

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "portfolioId": "portfolio-789",
  "symbol": "NVDA",
  "optionType": "call",
  "strikePrice": 500.00,
  "expirationDate": "2024-06-21",
  "openAction": "buy_to_open",
  "openQuantity": 3,
  "openPremium": 15.50,
  "openCommission": 5.00,
  "openTradeDate": "2024-02-15",
  "notes": "AI semiconductor play"
}
```

**Validation Rules**:

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `portfolioId` | No | UUID | Must exist if provided |
| `symbol` | Yes | String | 1-10 chars, uppercase |
| `optionType` | Yes | Enum | "call" or "put" |
| `strikePrice` | Yes | Number | > 0 |
| `expirationDate` | Yes | String | Valid ISO date (YYYY-MM-DD) |
| `openAction` | Yes | Enum | "buy_to_open" or "sell_to_open" |
| `openQuantity` | Yes | Integer | > 0 |
| `openPremium` | Yes | Number | ≥ 0.01 |
| `openCommission` | Yes | Number | ≥ 0 |
| `openTradeDate` | Yes | String | Valid ISO date |
| `notes` | No | String | Max 1000 chars |

**Business Logic**:
- Automatically set `userId` from authenticated token
- Calculate `openTotalCost` server-side
- Set `status = "open"`
- All close fields must be null

**Response (201)**:
```json
{
  "id": "trade-125",
  "userId": "user-456",
  "portfolioId": "portfolio-789",
  "symbol": "NVDA",
  "optionType": "call",
  "strikePrice": 500.00,
  "expirationDate": "2024-06-21",

  "openAction": "buy_to_open",
  "openQuantity": 3,
  "openPremium": 15.50,
  "openCommission": 5.00,
  "openTradeDate": "2024-02-15",
  "openTotalCost": 4655.00,

  "closeAction": null,
  "closeQuantity": null,
  "closePremium": null,
  "closeCommission": null,
  "closeTradeDate": null,
  "closeTotalCost": null,

  "status": "open",
  "profitLoss": null,

  "notes": "AI semiconductor play",
  "createdAt": "2024-02-15T11:30:00Z",
  "updatedAt": "2024-02-15T11:30:00Z"
}
```

**Errors**:
- `400 Bad Request` - Validation failed
- `403 Forbidden` - User doesn't have access to portfolio

---

### 5. PUT /api/trades/:id/close

Close an open trade by adding closing transaction.

**Headers**:
```
Authorization: Bearer {token}
```

**Path Parameters**:
- `id` - Trade UUID to close

**Request Body**:
```json
{
  "closeAction": "sell_to_close",
  "closePremium": 18.25,
  "closeCommission": 5.00,
  "closeTradeDate": "2024-03-01"
}
```

**Validation Rules**:

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `closeAction` | Yes | Enum | Must pair with openAction (see rules below) |
| `closePremium` | Yes | Number | ≥ 0.01 |
| `closeCommission` | Yes | Number | ≥ 0 |
| `closeTradeDate` | Yes | String | Valid ISO date |

**Action Pairing Validation**:
```
If openAction = "buy_to_open":
  closeAction MUST be "sell_to_close"

If openAction = "sell_to_open":
  closeAction MUST be "buy_to_close"
```

**Business Logic**:
1. Verify trade exists and user owns it (or is admin)
2. Verify trade status is "open"
3. Verify closeAction pairs correctly with openAction
4. Auto-set `closeQuantity = openQuantity`
5. Calculate `closeTotalCost`
6. Calculate `profitLoss`
7. Set `status = "closed"`
8. Update `updatedAt`

**Restrictions**:
- Cannot close an already closed trade
- Cannot change symbol, strike, expiration, optionType
- Quantity is automatically matched to opening

**Response (200)**:
```json
{
  "id": "trade-125",
  "userId": "user-456",
  "portfolioId": "portfolio-789",
  "symbol": "NVDA",
  "optionType": "call",
  "strikePrice": 500.00,
  "expirationDate": "2024-06-21",

  "openAction": "buy_to_open",
  "openQuantity": 3,
  "openPremium": 15.50,
  "openCommission": 5.00,
  "openTradeDate": "2024-02-15",
  "openTotalCost": 4655.00,

  "closeAction": "sell_to_close",
  "closeQuantity": 3,
  "closePremium": 18.25,
  "closeCommission": 5.00,
  "closeTradeDate": "2024-03-01",
  "closeTotalCost": 5470.00,

  "status": "closed",
  "profitLoss": 815.00,

  "notes": "AI semiconductor play",
  "createdAt": "2024-02-15T11:30:00Z",
  "updatedAt": "2024-03-01T10:15:00Z"
}
```

**Errors**:
- `400 Bad Request` - Invalid closeAction pairing or trade already closed
- `403 Forbidden` - User doesn't own trade
- `404 Not Found` - Trade doesn't exist

---

### 6. PUT /api/trades/:id

Update an open trade (edit opening transaction details).

**Headers**:
```
Authorization: Bearer {token}
```

**Path Parameters**:
- `id` - Trade UUID

**Request Body** (all fields optional):
```json
{
  "portfolioId": null,
  "symbol": "AAPL",
  "openQuantity": 5,
  "openPremium": 3.75,
  "notes": "Updated notes"
}
```

**Allowed Updates**:
- Trade specification: `symbol`, `optionType`, `strikePrice`, `expirationDate`
- Opening transaction: `openAction`, `openQuantity`, `openPremium`, `openCommission`, `openTradeDate`
- Metadata: `notes`, `portfolioId`

**Business Logic**:
- Recalculate `openTotalCost` if any cost components change
- Update `updatedAt` timestamp

**Restrictions**:
- **Cannot update closed trades** (status must be "open")
- Cannot update closing transaction fields via this endpoint
- Cannot change `userId` or `id`

**Response (200)**: Updated Trade object

**Errors**:
- `400 Bad Request` - Attempting to update closed trade or invalid data
- `403 Forbidden` - User doesn't own trade
- `404 Not Found` - Trade doesn't exist

---

### 7. DELETE /api/trades/:id

Delete a trade (open or closed).

**Headers**:
```
Authorization: Bearer {token}
```

**Path Parameters**:
- `id` - Trade UUID

**Authorization**:
- User must own trade OR be admin

**Response**: `204 No Content`

**Errors**:
- `403 Forbidden` - User doesn't own trade
- `404 Not Found` - Trade doesn't exist

---

## Database Schema

```sql
CREATE TABLE trades (
  -- Identifiers
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL,

  -- Trade specification
  symbol VARCHAR(10) NOT NULL,
  option_type VARCHAR(10) NOT NULL CHECK (option_type IN ('call', 'put')),
  strike_price DECIMAL(10,2) NOT NULL CHECK (strike_price > 0),
  expiration_date DATE NOT NULL,

  -- Opening transaction
  open_action VARCHAR(20) NOT NULL CHECK (open_action IN ('buy_to_open', 'sell_to_open')),
  open_quantity INTEGER NOT NULL CHECK (open_quantity > 0),
  open_premium DECIMAL(10,2) NOT NULL CHECK (open_premium > 0),
  open_commission DECIMAL(10,2) NOT NULL CHECK (open_commission >= 0),
  open_trade_date DATE NOT NULL,
  open_total_cost DECIMAL(12,2) NOT NULL,

  -- Closing transaction (nullable)
  close_action VARCHAR(20) CHECK (close_action IN ('buy_to_close', 'sell_to_close')),
  close_quantity INTEGER CHECK (close_quantity > 0),
  close_premium DECIMAL(10,2) CHECK (close_premium > 0),
  close_commission DECIMAL(10,2) CHECK (close_commission >= 0),
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
    (close_quantity IS NULL) OR (close_quantity = open_quantity)
  ),

  CONSTRAINT status_consistency CHECK (
    (status = 'open' AND close_action IS NULL AND profit_loss IS NULL)
    OR
    (status = 'closed' AND close_action IS NOT NULL AND profit_loss IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_user_status ON trades(user_id, status);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_expiration ON trades(expiration_date);
CREATE INDEX idx_trades_portfolio_id ON trades(portfolio_id) WHERE portfolio_id IS NOT NULL;
```

---

## Implementation Checklist

- [ ] Create database schema with constraints
- [ ] Implement opening transaction creation (POST /api/trades)
- [ ] Implement server-side cost calculations
- [ ] Implement closing transaction (PUT /api/trades/:id/close)
- [ ] Add action pairing validation
- [ ] Implement P/L calculation
- [ ] Add open trades filtering (GET /api/trades/open)
- [ ] Prevent editing closed trades
- [ ] Add request validation middleware
- [ ] Write unit tests for calculations
- [ ] Write integration tests for pairing rules
- [ ] Add transaction support for close operation
- [ ] Document all endpoints (Swagger/OpenAPI)

---

This specification provides a complete open/close transaction model for options trading that matches your client application's requirements.
