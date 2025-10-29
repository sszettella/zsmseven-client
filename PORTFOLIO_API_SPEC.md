# Portfolio & Trade API Specification

## Overview

This specification defines a RESTful API for managing investment portfolios and options trades. Portfolios serve as organizational containers for option trades, with the system calculating profit/loss, performance metrics, and analytics.

**Base URL:** `http://localhost:8000/api`

**Authentication:** Bearer token (JWT) in Authorization header

---

## Data Models

### Portfolio

```typescript
{
  id: string;              // UUID, server-generated
  userId: string;          // UUID, from authenticated user
  name: string;            // 1-100 characters, required
  description?: string;    // Max 500 characters, optional
  isActive: boolean;       // Default: true
  createdAt: string;       // ISO 8601 datetime
  updatedAt: string;       // ISO 8601 datetime
}
```

### Trade

```typescript
{
  // Identifiers
  id: string;                    // UUID, server-generated
  userId: string;                // UUID, from authenticated user
  portfolioId?: string;          // UUID, optional (trades can be unassigned)

  // Option Specification
  symbol: string;                // Underlying stock symbol (e.g., "AAPL")
  optionType: "call" | "put";   // Option type
  strikePrice: number;           // Strike price (e.g., 150.00)
  expirationDate: string;        // ISO 8601 date (e.g., "2024-12-20")

  // Opening Transaction
  openAction: "buy_to_open" | "sell_to_open";  // Opening action
  openQuantity: number;          // Number of contracts (must be > 0)
  openPremium: number;           // Premium per contract (e.g., 2.50)
  openCommission: number;        // Commission paid (e.g., 0.65)
  openTradeDate: string;         // ISO 8601 date
  openTotalCost: number;         // SERVER CALCULATED - see calculation rules

  // Closing Transaction (null until trade is closed)
  closeAction?: "sell_to_close" | "buy_to_close";  // Must match openAction
  closeQuantity?: number;        // Must equal openQuantity when closing
  closePremium?: number;         // Premium per contract
  closeCommission?: number;      // Commission paid
  closeTradeDate?: string;       // ISO 8601 date
  closeTotalCost?: number;       // SERVER CALCULATED - see calculation rules

  // Status and P/L
  status: "open" | "closed";     // Trade status
  profitLoss?: number;           // SERVER CALCULATED - only for closed trades

  // Metadata
  notes?: string;                // Optional notes (max 1000 characters)
  createdAt: string;             // ISO 8601 datetime
  updatedAt: string;             // ISO 8601 datetime
}
```

### Portfolio Statistics

```typescript
{
  portfolioId: string;
  totalTrades: number;           // Count of all trades
  openTradesCount: number;       // Count of open trades
  closedTradesCount: number;     // Count of closed trades
  totalProfitLoss: number;       // Sum of all closed trade P&L
  winRate: number;               // Percentage of profitable closed trades (0-100)
  winningTrades: number;         // Count of trades with profitLoss > 0
  losingTrades: number;          // Count of trades with profitLoss < 0
  averageWin: number;            // Average profit of winning trades
  averageLoss: number;           // Average loss of losing trades
  totalCapitalDeployed: number;  // Sum of |openTotalCost| for open trades
  last30DaysProfitLoss: number;  // P&L for trades closed in past 30 days
  last30DaysTradeCount: number;  // Count of trades closed in past 30 days
}
```

---

## Calculation Rules

### Open Total Cost

Represents the net debit or credit when opening a position:

- **BUY_TO_OPEN (debit):**
  ```
  openTotalCost = (openPremium × openQuantity × 100) + openCommission
  ```
  *Example: Buy 2 contracts @ $2.50 with $0.65 commission*
  ```
  openTotalCost = (2.50 × 2 × 100) + 0.65 = $500.65
  ```

- **SELL_TO_OPEN (credit):**
  ```
  openTotalCost = (openPremium × openQuantity × 100) - openCommission
  ```
  *Example: Sell 2 contracts @ $2.50 with $0.65 commission*
  ```
  openTotalCost = (2.50 × 2 × 100) - 0.65 = $499.35
  ```

### Close Total Cost

Represents the net credit or debit when closing a position:

- **SELL_TO_CLOSE (credit):**
  ```
  closeTotalCost = (closePremium × closeQuantity × 100) - closeCommission
  ```

- **BUY_TO_CLOSE (debit):**
  ```
  closeTotalCost = (closePremium × closeQuantity × 100) + closeCommission
  ```

### Profit/Loss

Calculated differently based on whether position was long or short:

- **Long positions (BUY_TO_OPEN → SELL_TO_CLOSE):**
  ```
  profitLoss = closeTotalCost - openTotalCost
  ```
  *Example: Bought for $500.65, sold for $600.35*
  ```
  profitLoss = $600.35 - $500.65 = $99.70
  ```

- **Short positions (SELL_TO_OPEN → BUY_TO_CLOSE):**
  ```
  profitLoss = openTotalCost - closeTotalCost
  ```
  *Example: Sold for $499.35, bought back for $400.65*
  ```
  profitLoss = $499.35 - $400.65 = $98.70
  ```

---

## API Endpoints

### Portfolio Endpoints

#### 1. List All Portfolios

**GET** `/portfolios`

Returns all portfolios for the authenticated user.

**Query Parameters:**
- `isActive` (optional): `true` | `false` - Filter by active status

**Response:** `200 OK`
```json
{
  "portfolios": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "Tech Options",
      "description": "Technology sector options trades",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### 2. Get Portfolio by ID

**GET** `/portfolios/:id`

Returns a single portfolio by ID.

**Path Parameters:**
- `id` (required): Portfolio UUID

**Response:** `200 OK`
```json
{
  "portfolio": {
    "id": "uuid",
    "userId": "uuid",
    "name": "Tech Options",
    "description": "Technology sector options trades",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - Portfolio does not exist
- `403 Forbidden` - Portfolio belongs to different user

---

#### 3. Create Portfolio

**POST** `/portfolios`

Creates a new portfolio for the authenticated user.

**Request Body:**
```json
{
  "name": "Tech Options",
  "description": "Technology sector options trades",  // optional
  "isActive": true  // optional, defaults to true
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `description`: Optional, max 500 characters
- `isActive`: Optional, boolean, defaults to true

**Response:** `201 Created`
```json
{
  "portfolio": {
    "id": "uuid",
    "userId": "uuid",
    "name": "Tech Options",
    "description": "Technology sector options trades",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `409 Conflict` - Portfolio with same name already exists for user

---

#### 4. Update Portfolio

**PUT** `/portfolios/:id`

Updates an existing portfolio.

**Path Parameters:**
- `id` (required): Portfolio UUID

**Request Body:**
```json
{
  "name": "Updated Tech Options",  // optional
  "description": "Updated description",  // optional
  "isActive": false  // optional
}
```

**Validation Rules:**
- All fields are optional
- `name`: 1-100 characters if provided
- `description`: Max 500 characters if provided

**Response:** `200 OK`
```json
{
  "portfolio": {
    "id": "uuid",
    "userId": "uuid",
    "name": "Updated Tech Options",
    "description": "Updated description",
    "isActive": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:45:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Portfolio does not exist
- `403 Forbidden` - Portfolio belongs to different user
- `409 Conflict` - Portfolio with new name already exists for user

---

#### 5. Delete Portfolio

**DELETE** `/portfolios/:id`

Deletes a portfolio.

**Path Parameters:**
- `id` (required): Portfolio UUID

**Query Parameters:**
- `orphanTrades` (optional): `true` | `false` (default: `true`)
  - If `true`: Set portfolioId to null for all associated trades (orphan them)
  - If `false`: Delete all associated trades (cascade delete)

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Portfolio does not exist
- `403 Forbidden` - Portfolio belongs to different user

---

#### 6. Get Portfolio Statistics

**GET** `/portfolios/:id/stats`

Returns aggregated statistics for a portfolio.

**Path Parameters:**
- `id` (required): Portfolio UUID

**Response:** `200 OK`
```json
{
  "stats": {
    "portfolioId": "uuid",
    "totalTrades": 25,
    "openTradesCount": 5,
    "closedTradesCount": 20,
    "totalProfitLoss": 1250.50,
    "winRate": 65.0,
    "winningTrades": 13,
    "losingTrades": 7,
    "averageWin": 150.75,
    "averageLoss": -85.25,
    "totalCapitalDeployed": 2500.00,
    "last30DaysProfitLoss": 350.25,
    "last30DaysTradeCount": 5
  }
}
```

**Error Responses:**
- `404 Not Found` - Portfolio does not exist
- `403 Forbidden` - Portfolio belongs to different user

---

### Trade Endpoints

#### 7. List All Trades

**GET** `/trades`

Returns all trades for the authenticated user.

**Query Parameters:**
- `status` (optional): `open` | `closed` - Filter by status
- `portfolioId` (optional): UUID - Filter by portfolio (use `null` for unassigned)
- `symbol` (optional): String - Filter by symbol
- `sortBy` (optional): `openDate` | `closeDate` | `expiration` | `profitLoss`
- `sortOrder` (optional): `asc` | `desc` (default: `desc`)
- `limit` (optional): Integer - Max results (default: 100)
- `offset` (optional): Integer - Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "trades": [
    {
      "id": "uuid",
      "userId": "uuid",
      "portfolioId": "uuid",
      "symbol": "AAPL",
      "optionType": "call",
      "strikePrice": 150.00,
      "expirationDate": "2024-12-20",
      "openAction": "buy_to_open",
      "openQuantity": 2,
      "openPremium": 2.50,
      "openCommission": 0.65,
      "openTradeDate": "2024-01-10",
      "openTotalCost": 500.65,
      "status": "open",
      "notes": "Bullish on AAPL earnings",
      "createdAt": "2024-01-10T14:30:00Z",
      "updatedAt": "2024-01-10T14:30:00Z"
    }
  ],
  "total": 25,
  "limit": 100,
  "offset": 0
}
```

---

#### 8. Get Open Trades

**GET** `/trades/open`

Convenience endpoint for open trades (equivalent to `/trades?status=open`).

**Query Parameters:** Same as List All Trades

**Response:** Same format as List All Trades

---

#### 9. Get Trades by Portfolio

**GET** `/portfolios/:portfolioId/trades`

Returns all trades for a specific portfolio.

**Path Parameters:**
- `portfolioId` (required): Portfolio UUID

**Query Parameters:**
- `status` (optional): `open` | `closed`
- Other parameters same as List All Trades

**Response:** Same format as List All Trades

**Error Responses:**
- `404 Not Found` - Portfolio does not exist
- `403 Forbidden` - Portfolio belongs to different user

---

#### 10. Get Trade by ID

**GET** `/trades/:id`

Returns a single trade by ID.

**Path Parameters:**
- `id` (required): Trade UUID

**Response:** `200 OK`
```json
{
  "trade": {
    "id": "uuid",
    "userId": "uuid",
    "portfolioId": "uuid",
    "symbol": "AAPL",
    "optionType": "call",
    "strikePrice": 150.00,
    "expirationDate": "2024-12-20",
    "openAction": "buy_to_open",
    "openQuantity": 2,
    "openPremium": 2.50,
    "openCommission": 0.65,
    "openTradeDate": "2024-01-10",
    "openTotalCost": 500.65,
    "status": "open",
    "notes": "Bullish on AAPL earnings",
    "createdAt": "2024-01-10T14:30:00Z",
    "updatedAt": "2024-01-10T14:30:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - Trade does not exist
- `403 Forbidden` - Trade belongs to different user

---

#### 11. Create Trade

**POST** `/trades`

Creates a new trade.

**Request Body:**
```json
{
  "portfolioId": "uuid",  // optional
  "symbol": "AAPL",
  "optionType": "call",
  "strikePrice": 150.00,
  "expirationDate": "2024-12-20",
  "openAction": "buy_to_open",
  "openQuantity": 2,
  "openPremium": 2.50,
  "openCommission": 0.65,
  "openTradeDate": "2024-01-10",
  "notes": "Bullish on AAPL earnings"  // optional
}
```

**Validation Rules:**
- `portfolioId`: Optional UUID, must exist and belong to user if provided
- `symbol`: Required, 1-10 uppercase characters
- `optionType`: Required, must be "call" or "put"
- `strikePrice`: Required, must be > 0
- `expirationDate`: Required, ISO date, must be in the future
- `openAction`: Required, must be "buy_to_open" or "sell_to_open"
- `openQuantity`: Required, must be > 0
- `openPremium`: Required, must be >= 0
- `openCommission`: Required, must be >= 0
- `openTradeDate`: Required, ISO date, cannot be in the future
- `notes`: Optional, max 1000 characters

**Server Calculations:**
- `openTotalCost`: Calculated based on action, premium, quantity, commission
- `status`: Set to "open"
- `closeAction`, `closeQuantity`, `closePremium`, `closeCommission`, `closeTradeDate`, `closeTotalCost`, `profitLoss`: Set to null

**Response:** `201 Created`
```json
{
  "trade": {
    "id": "uuid",
    "userId": "uuid",
    "portfolioId": "uuid",
    "symbol": "AAPL",
    "optionType": "call",
    "strikePrice": 150.00,
    "expirationDate": "2024-12-20",
    "openAction": "buy_to_open",
    "openQuantity": 2,
    "openPremium": 2.50,
    "openCommission": 0.65,
    "openTradeDate": "2024-01-10",
    "openTotalCost": 500.65,
    "status": "open",
    "notes": "Bullish on AAPL earnings",
    "createdAt": "2024-01-10T14:30:00Z",
    "updatedAt": "2024-01-10T14:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Portfolio does not exist (if portfolioId provided)
- `403 Forbidden` - Portfolio belongs to different user (if portfolioId provided)

---

#### 12. Close Trade

**PUT** `/trades/:id/close`

Closes an open trade.

**Path Parameters:**
- `id` (required): Trade UUID

**Request Body:**
```json
{
  "closePremium": 3.00,
  "closeCommission": 0.65,
  "closeTradeDate": "2024-02-10",
  "notes": "Taking profit before earnings"  // optional
}
```

**Validation Rules:**
- Trade must have `status: "open"`
- `closePremium`: Required, must be >= 0
- `closeCommission`: Required, must be >= 0
- `closeTradeDate`: Required, ISO date, cannot be in the future, must be >= openTradeDate
- `notes`: Optional, max 1000 characters (merged with existing notes if provided)

**Server Calculations:**
- `closeAction`: Automatically determined based on `openAction`
  - BUY_TO_OPEN → SELL_TO_CLOSE
  - SELL_TO_OPEN → BUY_TO_CLOSE
- `closeQuantity`: Set equal to `openQuantity`
- `closeTotalCost`: Calculated based on closeAction, premium, quantity, commission
- `profitLoss`: Calculated based on open/close actions and totals
- `status`: Set to "closed"

**Response:** `200 OK`
```json
{
  "trade": {
    "id": "uuid",
    "userId": "uuid",
    "portfolioId": "uuid",
    "symbol": "AAPL",
    "optionType": "call",
    "strikePrice": 150.00,
    "expirationDate": "2024-12-20",
    "openAction": "buy_to_open",
    "openQuantity": 2,
    "openPremium": 2.50,
    "openCommission": 0.65,
    "openTradeDate": "2024-01-10",
    "openTotalCost": 500.65,
    "closeAction": "sell_to_close",
    "closeQuantity": 2,
    "closePremium": 3.00,
    "closeCommission": 0.65,
    "closeTradeDate": "2024-02-10",
    "closeTotalCost": 599.35,
    "status": "closed",
    "profitLoss": 98.70,
    "notes": "Taking profit before earnings",
    "createdAt": "2024-01-10T14:30:00Z",
    "updatedAt": "2024-02-10T15:20:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error or trade already closed
- `404 Not Found` - Trade does not exist
- `403 Forbidden` - Trade belongs to different user

---

#### 13. Update Trade

**PUT** `/trades/:id`

Updates an existing trade (open or closed).

**Path Parameters:**
- `id` (required): Trade UUID

**Request Body:**
```json
{
  "portfolioId": "uuid",  // optional, use null to unassign
  "symbol": "AAPL",  // optional
  "optionType": "call",  // optional
  "strikePrice": 150.00,  // optional
  "expirationDate": "2024-12-20",  // optional
  "openQuantity": 2,  // optional
  "openPremium": 2.50,  // optional
  "openCommission": 0.65,  // optional
  "openTradeDate": "2024-01-10",  // optional
  "closeQuantity": 2,  // optional (closed trades only)
  "closePremium": 3.00,  // optional (closed trades only)
  "closeCommission": 0.65,  // optional (closed trades only)
  "closeTradeDate": "2024-02-10",  // optional (closed trades only)
  "notes": "Updated notes"  // optional
}
```

**Validation Rules:**
- All fields are optional
- Same validation as Create Trade for each field if provided
- Cannot change `openAction` or `closeAction`
- For closed trades: `closeQuantity` must equal `openQuantity`
- Cannot update closing fields if trade is open

**Server Calculations:**
- Recalculates `openTotalCost` if any open fields change
- Recalculates `closeTotalCost` if any close fields change (closed trades only)
- Recalculates `profitLoss` if any cost fields change (closed trades only)

**Response:** `200 OK`
```json
{
  "trade": { /* updated trade object */ }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Trade or portfolio does not exist
- `403 Forbidden` - Trade or portfolio belongs to different user

---

#### 14. Delete Trade

**DELETE** `/trades/:id`

Deletes a trade.

**Path Parameters:**
- `id` (required): Trade UUID

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Trade does not exist
- `403 Forbidden` - Trade belongs to different user

---

## Authentication

### Authorization Header

All endpoints require a valid JWT token:

```
Authorization: Bearer <token>
```

### Error Responses

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Valid token but insufficient permissions

---

## Common Error Response Format

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context (optional)"
    }
  }
}
```

### Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `FORBIDDEN` - Insufficient permissions
- `CONFLICT` - Resource conflict (e.g., duplicate name)
- `UNAUTHORIZED` - Authentication required
- `INTERNAL_ERROR` - Server error

---

## Database Considerations

### Indexes

**Portfolios table:**
- Primary key on `id`
- Index on `userId`
- Unique index on `(userId, name)` for duplicate name prevention

**Trades table:**
- Primary key on `id`
- Index on `userId`
- Index on `portfolioId`
- Index on `status`
- Composite index on `(userId, status)` for common queries
- Index on `closeTradeDate` for date-range queries

### Foreign Keys

- `trades.userId` → `users.id` (CASCADE DELETE)
- `trades.portfolioId` → `portfolios.id` (SET NULL or CASCADE based on orphanTrades parameter)
- `portfolios.userId` → `users.id` (CASCADE DELETE)

---

## Implementation Notes

### Server-Side Calculation Requirements

**CRITICAL:** The server MUST calculate the following fields and reject any client-provided values:

1. `openTotalCost` - Calculate from openAction, openPremium, openQuantity, openCommission
2. `closeTotalCost` - Calculate from closeAction, closePremium, closeQuantity, closeCommission
3. `profitLoss` - Calculate from openAction, openTotalCost, closeTotalCost
4. `closeAction` - Derive from openAction when closing trade
5. `closeQuantity` - Set equal to openQuantity when closing trade

### Validation Requirements

**Trade Closing Validation:**
1. Verify trade is open before allowing close operation
2. Ensure closeTradeDate >= openTradeDate
3. Ensure closeTradeDate is not in the future
4. Automatically set closeAction based on openAction:
   - BUY_TO_OPEN → SELL_TO_CLOSE
   - SELL_TO_OPEN → BUY_TO_CLOSE
5. Set closeQuantity equal to openQuantity

**Portfolio Assignment Validation:**
1. Verify portfolio exists
2. Verify portfolio belongs to authenticated user
3. Allow null portfolioId (unassigned trades)

### Query Optimization

**Default Sorting:**
- Open trades: Sort by expiration date ASC (expiring soonest first), then openTradeDate ASC
- Closed trades: Sort by closeTradeDate DESC (most recent first)

**Pagination:**
- Default limit: 100
- Maximum limit: 1000

### Cache Invalidation

When implementing with a cache layer, invalidate:
- Portfolio queries when portfolio is created/updated/deleted
- Trade queries when trade is created/updated/deleted
- Portfolio stats when associated trades change
- Portfolio trade queries when trades are assigned/unassigned

---

## Example Workflows

### Workflow 1: Open and Close a Long Call

**Step 1:** Create portfolio
```
POST /portfolios
{
  "name": "Tech Options",
  "description": "Technology sector trades"
}
```

**Step 2:** Open a long call position
```
POST /trades
{
  "portfolioId": "uuid",
  "symbol": "AAPL",
  "optionType": "call",
  "strikePrice": 150.00,
  "expirationDate": "2024-12-20",
  "openAction": "buy_to_open",
  "openQuantity": 2,
  "openPremium": 2.50,
  "openCommission": 0.65,
  "openTradeDate": "2024-01-10"
}

Server calculates:
- openTotalCost = (2.50 × 2 × 100) + 0.65 = $500.65
- status = "open"
```

**Step 3:** Close the position for profit
```
PUT /trades/{id}/close
{
  "closePremium": 3.50,
  "closeCommission": 0.65,
  "closeTradeDate": "2024-02-10"
}

Server calculates:
- closeAction = "sell_to_close" (derived from openAction)
- closeQuantity = 2 (matches openQuantity)
- closeTotalCost = (3.50 × 2 × 100) - 0.65 = $699.35
- profitLoss = 699.35 - 500.65 = $198.70
- status = "closed"
```

**Step 4:** View portfolio statistics
```
GET /portfolios/{id}/stats

Returns:
{
  "totalTrades": 1,
  "closedTradesCount": 1,
  "totalProfitLoss": 198.70,
  "winRate": 100.0,
  "winningTrades": 1,
  ...
}
```

---

### Workflow 2: Open and Close a Short Put

**Step 1:** Open a short put position (credit)
```
POST /trades
{
  "portfolioId": "uuid",
  "symbol": "TSLA",
  "optionType": "put",
  "strikePrice": 200.00,
  "expirationDate": "2024-12-20",
  "openAction": "sell_to_open",
  "openQuantity": 1,
  "openPremium": 5.00,
  "openCommission": 0.65,
  "openTradeDate": "2024-01-15"
}

Server calculates:
- openTotalCost = (5.00 × 1 × 100) - 0.65 = $499.35 (credit)
- status = "open"
```

**Step 2:** Close the position (buy back)
```
PUT /trades/{id}/close
{
  "closePremium": 2.00,
  "closeCommission": 0.65,
  "closeTradeDate": "2024-02-15"
}

Server calculates:
- closeAction = "buy_to_close" (derived from openAction)
- closeQuantity = 1 (matches openQuantity)
- closeTotalCost = (2.00 × 1 × 100) + 0.65 = $200.65 (debit)
- profitLoss = 499.35 - 200.65 = $298.70 (profit on short)
- status = "closed"
```

---

## Testing Checklist

### Calculation Tests
- [ ] BUY_TO_OPEN cost calculation with various premiums/quantities
- [ ] SELL_TO_OPEN cost calculation with various premiums/quantities
- [ ] SELL_TO_CLOSE cost calculation
- [ ] BUY_TO_CLOSE cost calculation
- [ ] Long position P&L (profit and loss scenarios)
- [ ] Short position P&L (profit and loss scenarios)
- [ ] Commission impacts on all calculations

### Validation Tests
- [ ] Cannot close already-closed trade
- [ ] Cannot close with invalid closeTradeDate
- [ ] Cannot assign to non-existent portfolio
- [ ] Cannot assign to another user's portfolio
- [ ] Portfolio name uniqueness per user
- [ ] Field length limits (name, description, notes)
- [ ] Numeric field constraints (> 0 where required)

### Authorization Tests
- [ ] Cannot access another user's portfolios
- [ ] Cannot access another user's trades
- [ ] Cannot assign trades to another user's portfolio
- [ ] Proper 401/403 responses

### Statistics Tests
- [ ] Win rate calculation with various scenarios
- [ ] Last 30 days filtering
- [ ] Average win/loss calculations
- [ ] Total capital deployed for open positions only

### Edge Cases
- [ ] Deleting portfolio with orphan vs cascade
- [ ] Unassigning trade from portfolio (set portfolioId to null)
- [ ] Reassigning trade to different portfolio
- [ ] Zero commission trades
- [ ] Zero premium trades (unusual but possible)
- [ ] Same-day open and close

---

## Future Enhancements

Consider these additions in future versions:

1. **Multi-leg strategies:** Support for spreads (bull call, iron condor, etc.)
2. **Partial closes:** Allow closing portion of position
3. **Adjustments:** Track rolled positions and adjustments
4. **Performance charts:** Time-series P&L data endpoints
5. **Tax reporting:** Cost basis, wash sale tracking, tax lot selection
6. **Import/export:** CSV/Excel import for bulk trade entry
7. **Alerts:** Price alerts, expiration reminders
8. **Greeks:** Delta, theta, implied volatility tracking
9. **Benchmarking:** Compare portfolio performance to indices
10. **Tags/labels:** Categorize trades beyond portfolios

---

## Version History

- **v1.0** - Initial specification (2024-01-15)
