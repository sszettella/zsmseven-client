# Portfolio & Trade API Specification

## Overview

This specification defines a RESTful API for managing investment portfolios and options trades.

**Key Concepts:**
- **Portfolios** contain **positions** (stock/ETF holdings with ticker, shares, and cost basis)
- **Trades** (options) can be associated with portfolios for organizational purposes, but exist independently
- Portfolios track equity positions, while trades track options activity

**Base URL:** `http://localhost:8000/api`

**Authentication:** Bearer token (JWT) in Authorization header

---

## Data Models

### Portfolio

A portfolio represents a collection of equity positions (stocks, ETFs, etc.).

```typescript
{
  id: string;              // UUID, server-generated
  userId: string;          // UUID, from authenticated user
  name: string;            // 1-100 characters, required
  description?: string;    // Max 500 characters, optional
  isActive: boolean;       // Default: true
  isDefault: boolean;      // Default: false - Only one portfolio per user can be default
  createdAt: string;       // ISO 8601 datetime
  updatedAt: string;       // ISO 8601 datetime
}
```

**Note on `isDefault`:**
- Only one portfolio per user can be marked as default
- When creating a trade, if no portfolio is specified, it can be associated with the default portfolio
- Setting a portfolio as default will automatically unset any other default portfolio for that user
- Default portfolios are useful for quickly associating options trades without manual selection

### Position

A position represents a holding of shares in a portfolio.

```typescript
{
  id: string;              // UUID, server-generated
  portfolioId: string;     // UUID, required - positions must belong to a portfolio
  ticker: string;          // Stock ticker symbol (e.g., "AAPL", "SPY"), uppercase
  shares: number;          // Number of shares (can be fractional, e.g., 10.5)
  costBasis: number;       // Total cost basis in dollars (e.g., 1500.00)
  averageCost: number;     // SERVER CALCULATED: costBasis / shares
  currentPrice?: number;   // Optional: Current market price per share
  marketValue?: number;    // SERVER CALCULATED: shares × currentPrice (if price available)
  unrealizedPL?: number;   // SERVER CALCULATED: marketValue - costBasis (if price available)
  notes?: string;          // Optional notes (max 1000 characters)
  createdAt: string;       // ISO 8601 datetime
  updatedAt: string;       // ISO 8601 datetime
}
```

### Trade (Options)

Trades (options) can optionally be associated with portfolios for organizational purposes, but are managed separately.

```typescript
{
  // Identifiers
  id: string;                    // UUID, server-generated
  userId: string;                // UUID, from authenticated user
  portfolioId?: string;          // UUID, optional (trades can be unassigned)

  // Option Specification
  symbol: string;                // Underlying stock symbol (e.g., "AAPL")
  optionType: "call" | "put";    // Option type
  strikePrice: number;           // Strike price (e.g., 150.00)
  expirationDate: string;        // ISO 8601 date (e.g., "2024-12-20")

  // Opening Transaction
  openAction: "buy_to_open" | "sell_to_open";  // Opening action
  openQuantity: number;          // Number of contracts (must be > 0)
  openPremium: number;           // Premium per contract (e.g., 2.50)
  openCommission: number;        // Commission paid (e.g., 0.65)
  openTradeDate: string;         // ISO 8601 date
  openTotalCost: number;         // SERVER CALCULATED

  // Closing Transaction (optional, null until trade is closed)
  closeAction?: "sell_to_close" | "buy_to_close";  // Must match openAction
  closeQuantity?: number;        // Must equal openQuantity when closing
  closePremium?: number;         // Premium per contract
  closeCommission?: number;      // Commission paid
  closeTradeDate?: string;       // ISO 8601 date
  closeTotalCost?: number;       // SERVER CALCULATED

  // Status and P/L
  status: "open" | "closed";     // Trade status
  profitLoss?: number;           // SERVER CALCULATED - only for closed trades

  // Metadata
  notes?: string;                // Optional notes (max 1000 characters)
  createdAt: string;             // ISO 8601 datetime
  updatedAt: string;             // ISO 8601 datetime
}
```

### Portfolio Summary

Aggregated view of a portfolio including positions and optional metrics.

```typescript
{
  portfolio: Portfolio;
  positions: Position[];
  metrics: {
    totalPositions: number;          // Count of positions
    totalMarketValue: number;        // Sum of all position market values
    totalCostBasis: number;          // Sum of all position cost bases
    totalUnrealizedPL: number;       // Sum of all position unrealized P&L
    totalUnrealizedPLPercent: number; // (totalUnrealizedPL / totalCostBasis) × 100
    topGainer?: {                    // Position with highest unrealized P&L %
      ticker: string;
      unrealizedPLPercent: number;
    };
    topLoser?: {                     // Position with lowest unrealized P&L %
      ticker: string;
      unrealizedPLPercent: number;
    };
  };
  associatedTrades?: {               // Optional: trades linked to this portfolio
    openCount: number;
    closedCount: number;
    totalProfitLoss: number;
  };
}
```

---

## Calculation Rules

### Position Calculations

- **Average Cost:**
  ```
  averageCost = costBasis / shares
  ```
  *Example: 100 shares with $5,000 cost basis*
  ```
  averageCost = $5,000 / 100 = $50.00 per share
  ```

- **Market Value:**
  ```
  marketValue = shares × currentPrice
  ```
  *Example: 100 shares at current price of $55.00*
  ```
  marketValue = 100 × $55.00 = $5,500.00
  ```

- **Unrealized P&L:**
  ```
  unrealizedPL = marketValue - costBasis
  ```
  *Example: Market value $5,500, cost basis $5,000*
  ```
  unrealizedPL = $5,500 - $5,000 = $500.00
  ```

- **Unrealized P&L Percent:**
  ```
  unrealizedPLPercent = (unrealizedPL / costBasis) × 100
  ```
  *Example: Unrealized P&L $500, cost basis $5,000*
  ```
  unrealizedPLPercent = ($500 / $5,000) × 100 = 10%
  ```

### Trade Calculations

**Opening Transaction:**
- BUY_TO_OPEN: `openTotalCost = (openPremium × openQuantity × 100) + openCommission`
- SELL_TO_OPEN: `openTotalCost = (openPremium × openQuantity × 100) - openCommission`

**Closing Transaction:**
- SELL_TO_CLOSE: `closeTotalCost = (closePremium × closeQuantity × 100) - closeCommission`
- BUY_TO_CLOSE: `closeTotalCost = (closePremium × closeQuantity × 100) + closeCommission`

**Profit/Loss:**
- Long (BUY_TO_OPEN): `profitLoss = closeTotalCost - openTotalCost`
- Short (SELL_TO_OPEN): `profitLoss = openTotalCost - closeTotalCost`

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
[
  {
    "id": "uuid",
    "userId": "uuid",
    "name": "Long-Term Holdings",
    "description": "Core equity positions",
    "isActive": true,
    "isDefault": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

---

#### 2. Get Portfolio by ID

**GET** `/portfolios/:id`

Returns a single portfolio with optional related data.

**Path Parameters:**
- `id` (required): Portfolio UUID

**Query Parameters:**
- `includePositions` (optional): `true` | `false` (default: `false`)
- `includeMetrics` (optional): `true` | `false` (default: `false`)
- `includeTrades` (optional): `true` | `false` (default: `false`)

**Response:** `200 OK`

*Basic response:*
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Long-Term Holdings",
  "description": "Core equity positions",
  "isActive": true,
  "isDefault": false,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

*Full response with all data:*
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Long-Term Holdings",
  "description": "Core equity positions",
  "isActive": true,
  "isDefault": false,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "positions": [...],
  "metrics": {
    "totalPositions": 5,
    "totalMarketValue": 125000.00,
    "totalCostBasis": 100000.00,
    "totalUnrealizedPL": 25000.00,
    "totalUnrealizedPLPercent": 25.0,
    "topGainer": {
      "ticker": "NVDA",
      "unrealizedPLPercent": 45.5
    },
    "topLoser": {
      "ticker": "DIS",
      "unrealizedPLPercent": -8.2
    }
  },
  "associatedTrades": {
    "openCount": 3,
    "closedCount": 12,
    "totalProfitLoss": 4500.00
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
  "name": "Long-Term Holdings",
  "description": "Core equity positions",
  "isActive": true,
  "isDefault": false
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `description`: Optional, max 500 characters
- `isActive`: Optional, boolean, defaults to true
- `isDefault`: Optional, boolean, defaults to false

**Server Behavior:**
- If `isDefault: true`, automatically sets `isDefault: false` on all other user portfolios
- Returns 409 Conflict if portfolio name already exists for user

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Long-Term Holdings",
  "description": "Core equity positions",
  "isActive": true,
  "isDefault": false,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `409 Conflict` - Portfolio with same name already exists

---

#### 4. Update Portfolio

**PUT** `/portfolios/:id`

Updates an existing portfolio.

**Path Parameters:**
- `id` (required): Portfolio UUID

**Request Body:**
```json
{
  "name": "Updated Long-Term Holdings",
  "description": "Updated description",
  "isActive": false,
  "isDefault": true
}
```

**Validation Rules:**
- All fields are optional
- `name`: 1-100 characters if provided
- `description`: Max 500 characters if provided

**Server Behavior:**
- If `isDefault: true`, automatically sets `isDefault: false` on all other user portfolios

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Updated Long-Term Holdings",
  "description": "Updated description",
  "isActive": false,
  "isDefault": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T11:45:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Portfolio does not exist
- `403 Forbidden` - Portfolio belongs to different user
- `409 Conflict` - Portfolio with new name already exists

---

#### 5. Delete Portfolio

**DELETE** `/portfolios/:id`

Deletes a portfolio. Positions are cascade deleted. Associated trades have their portfolioId set to null.

**Path Parameters:**
- `id` (required): Portfolio UUID

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Portfolio does not exist
- `403 Forbidden` - Portfolio belongs to different user

---

### Position Endpoints

#### 6. List Positions by Portfolio

**GET** `/portfolios/:portfolioId/positions`

Returns all positions for a portfolio.

**Path Parameters:**
- `portfolioId` (required): Portfolio UUID

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "portfolioId": "uuid",
    "ticker": "AAPL",
    "shares": 100,
    "costBasis": 15000.00,
    "averageCost": 150.00,
    "currentPrice": 175.50,
    "marketValue": 17550.00,
    "unrealizedPL": 2550.00,
    "notes": "Added during tech dip",
    "createdAt": "2024-01-10T14:30:00Z",
    "updatedAt": "2024-01-10T14:30:00Z"
  }
]
```

**Error Responses:**
- `404 Not Found` - Portfolio does not exist
- `403 Forbidden` - Portfolio belongs to different user

---

#### 7. Get Position by ID

**GET** `/positions/:id`

Returns a single position by ID.

**Path Parameters:**
- `id` (required): Position UUID

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "portfolioId": "uuid",
  "ticker": "AAPL",
  "shares": 100,
  "costBasis": 15000.00,
  "averageCost": 150.00,
  "currentPrice": 175.50,
  "marketValue": 17550.00,
  "unrealizedPL": 2550.00,
  "notes": "Added during tech dip",
  "createdAt": "2024-01-10T14:30:00Z",
  "updatedAt": "2024-01-10T14:30:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Position does not exist
- `403 Forbidden` - Position belongs to portfolio owned by different user

---

#### 8. Create Position

**POST** `/portfolios/:portfolioId/positions`

Creates a new position in a portfolio.

**Path Parameters:**
- `portfolioId` (required): Portfolio UUID

**Request Body:**
```json
{
  "ticker": "AAPL",
  "shares": 100,
  "costBasis": 15000.00,
  "currentPrice": 175.50,
  "notes": "Added during tech dip"
}
```

**Validation Rules:**
- `ticker`: Required, 1-10 characters (auto-converted to uppercase)
- `shares`: Required, must be > 0, can be fractional
- `costBasis`: Required, must be > 0
- `currentPrice`: Optional, must be > 0 if provided
- `notes`: Optional, max 1000 characters
- Cannot create duplicate ticker in same portfolio

**Server Calculations:**
- `averageCost = costBasis / shares`
- `marketValue = shares × currentPrice` (if currentPrice provided)
- `unrealizedPL = marketValue - costBasis` (if currentPrice provided)

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "portfolioId": "uuid",
  "ticker": "AAPL",
  "shares": 100,
  "costBasis": 15000.00,
  "averageCost": 150.00,
  "currentPrice": 175.50,
  "marketValue": 17550.00,
  "unrealizedPL": 2550.00,
  "notes": "Added during tech dip",
  "createdAt": "2024-01-10T14:30:00Z",
  "updatedAt": "2024-01-10T14:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Portfolio does not exist
- `403 Forbidden` - Portfolio belongs to different user
- `409 Conflict` - Position with same ticker already exists in portfolio

---

#### 9. Update Position

**PUT** `/positions/:id`

Updates an existing position.

**Path Parameters:**
- `id` (required): Position UUID

**Request Body:**
```json
{
  "ticker": "AAPL",
  "shares": 150,
  "costBasis": 22500.00,
  "currentPrice": 180.00,
  "notes": "Updated notes"
}
```

**Validation Rules:**
- All fields are optional
- Same validation as Create Position for each field if provided
- Changing ticker may cause conflict if new ticker already exists in portfolio

**Server Calculations:**
- Recalculates `averageCost` if shares or costBasis changes
- Recalculates `marketValue` if shares or currentPrice changes
- Recalculates `unrealizedPL` if marketValue or costBasis changes

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "portfolioId": "uuid",
  "ticker": "AAPL",
  "shares": 150,
  "costBasis": 22500.00,
  "averageCost": 150.00,
  "currentPrice": 180.00,
  "marketValue": 27000.00,
  "unrealizedPL": 4500.00,
  "notes": "Updated notes",
  "createdAt": "2024-01-10T14:30:00Z",
  "updatedAt": "2024-02-15T16:20:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Position does not exist
- `403 Forbidden` - Position belongs to portfolio owned by different user
- `409 Conflict` - Ticker change conflicts with existing position in portfolio

---

#### 10. Delete Position

**DELETE** `/positions/:id`

Deletes a position from a portfolio.

**Path Parameters:**
- `id` (required): Position UUID

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Position does not exist
- `403 Forbidden` - Position belongs to portfolio owned by different user

---

#### 11. Update Position Prices (Batch)

**PATCH** `/portfolios/:portfolioId/positions/prices`

Updates current prices for multiple positions at once (useful for market data updates).

**Path Parameters:**
- `portfolioId` (required): Portfolio UUID

**Request Body:**
```json
{
  "prices": [
    { "ticker": "AAPL", "currentPrice": 175.50 },
    { "ticker": "GOOGL", "currentPrice": 140.25 },
    { "ticker": "MSFT", "currentPrice": 415.80 }
  ]
}
```

**Validation Rules:**
- Each price entry must have ticker and currentPrice
- currentPrice must be > 0
- Tickers that don't exist in portfolio are ignored (no error)

**Response:** `200 OK`
```json
{
  "updated": 3,
  "positions": [
    {
      "id": "uuid",
      "ticker": "AAPL",
      "currentPrice": 175.50,
      "marketValue": 17550.00,
      "unrealizedPL": 2550.00
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Portfolio does not exist
- `403 Forbidden` - Portfolio belongs to different user

---

### Trade Endpoints

#### 12. List All Trades

**GET** `/trades`

Returns all trades for the authenticated user.

**Query Parameters:**
- `status` (optional): `open` | `closed` - Filter by status
- `portfolioId` (optional): UUID - Filter by portfolio
- `symbol` (optional): String - Filter by symbol

**Response:** `200 OK`
```json
[
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
]
```

---

#### 13. Get Trade by ID

**GET** `/trades/:id`

Returns a single trade by ID.

**Path Parameters:**
- `id` (required): Trade UUID

**Response:** `200 OK`
```json
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
```

**Error Responses:**
- `404 Not Found` - Trade does not exist
- `403 Forbidden` - Trade belongs to different user

---

#### 14. Create Trade

**POST** `/trades`

Creates a new options trade.

**Request Body:**
```json
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
  "openTradeDate": "2024-01-10",
  "notes": "Bullish on AAPL earnings"
}
```

**Validation Rules:**
- `portfolioId`: Optional UUID, must exist and belong to user if provided
- `symbol`: Required, 1-10 uppercase characters
- `optionType`: Required, "call" or "put"
- `strikePrice`: Required, must be > 0
- `expirationDate`: Required, ISO date
- `openAction`: Required, "buy_to_open" or "sell_to_open"
- `openQuantity`: Required, must be > 0
- `openPremium`: Required, must be >= 0
- `openCommission`: Required, must be >= 0
- `openTradeDate`: Required, ISO date
- `notes`: Optional, max 1000 characters

**Server Calculations:**
- BUY_TO_OPEN: `openTotalCost = (openPremium × openQuantity × 100) + openCommission`
- SELL_TO_OPEN: `openTotalCost = (openPremium × openQuantity × 100) - openCommission`
- `status` set to "open"

**Response:** `201 Created`
```json
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
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Portfolio does not exist (if portfolioId provided)

---

#### 15. Close Trade

**PUT** `/trades/:id/close`

Closes an open options trade.

**Path Parameters:**
- `id` (required): Trade UUID

**Request Body:**
```json
{
  "closePremium": 3.00,
  "closeCommission": 0.65,
  "closeTradeDate": "2024-02-10"
}
```

**Validation Rules:**
- `closePremium`: Required, must be >= 0
- `closeCommission`: Required, must be >= 0
- `closeTradeDate`: Required, ISO date

**Server Calculations:**
- `closeAction`: Automatically determined (BUY_TO_OPEN → SELL_TO_CLOSE, SELL_TO_OPEN → BUY_TO_CLOSE)
- `closeQuantity`: Set equal to openQuantity
- SELL_TO_CLOSE: `closeTotalCost = (closePremium × closeQuantity × 100) - closeCommission`
- BUY_TO_CLOSE: `closeTotalCost = (closePremium × closeQuantity × 100) + closeCommission`
- Long: `profitLoss = closeTotalCost - openTotalCost`
- Short: `profitLoss = openTotalCost - closeTotalCost`
- `status` set to "closed"

**Response:** `200 OK`
```json
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
  "closeAction": "sell_to_close",
  "closeQuantity": 2,
  "closePremium": 3.00,
  "closeCommission": 0.65,
  "closeTradeDate": "2024-02-10",
  "closeTotalCost": 599.35,
  "status": "closed",
  "profitLoss": 98.70,
  "notes": "Bullish on AAPL earnings",
  "createdAt": "2024-01-10T14:30:00Z",
  "updatedAt": "2024-02-10T09:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation error or trade already closed
- `404 Not Found` - Trade does not exist
- `403 Forbidden` - Trade belongs to different user

---

#### 16. Update Trade

**PUT** `/trades/:id`

Updates trade details (can update both open and closed trades).

**Path Parameters:**
- `id` (required): Trade UUID

**Request Body:**
```json
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
  "openTradeDate": "2024-01-10",
  "closeAction": "sell_to_close",
  "closePremium": 3.00,
  "closeCommission": 0.65,
  "closeTradeDate": "2024-02-10",
  "notes": "Updated notes"
}
```

**Validation Rules:**
- All fields are optional
- Same validation as Create Trade for each field if provided
- Server recalculates openTotalCost, closeTotalCost, and profitLoss if relevant fields change

**Response:** `200 OK`
```json
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
  "closeAction": "sell_to_close",
  "closeQuantity": 2,
  "closePremium": 3.00,
  "closeCommission": 0.65,
  "closeTradeDate": "2024-02-10",
  "closeTotalCost": 599.35,
  "status": "closed",
  "profitLoss": 98.70,
  "notes": "Updated notes",
  "createdAt": "2024-01-10T14:30:00Z",
  "updatedAt": "2024-02-15T16:20:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Trade does not exist
- `403 Forbidden` - Trade belongs to different user

---

#### 17. Delete Trade

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
- `CONFLICT` - Resource conflict (e.g., duplicate ticker)
- `UNAUTHORIZED` - Authentication required
- `INTERNAL_ERROR` - Server error

---

## Database Schema

### Tables

**portfolios**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → users.id, CASCADE DELETE)
- `name` (VARCHAR(100), NOT NULL)
- `description` (VARCHAR(500), NULLABLE)
- `is_active` (BOOLEAN, DEFAULT true)
- `is_default` (BOOLEAN, DEFAULT false)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- UNIQUE INDEX on `(user_id, name)`
- INDEX on `user_id`
- INDEX on `(user_id, is_default)` for finding default portfolio

**positions**
- `id` (UUID, PRIMARY KEY)
- `portfolio_id` (UUID, FOREIGN KEY → portfolios.id, CASCADE DELETE)
- `ticker` (VARCHAR(10), NOT NULL)
- `shares` (DECIMAL, NOT NULL)
- `cost_basis` (DECIMAL, NOT NULL)
- `average_cost` (DECIMAL, COMPUTED)
- `current_price` (DECIMAL, NULLABLE)
- `market_value` (DECIMAL, COMPUTED)
- `unrealized_pl` (DECIMAL, COMPUTED)
- `notes` (TEXT, NULLABLE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- UNIQUE INDEX on `(portfolio_id, ticker)`
- INDEX on `portfolio_id`

**trades**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → users.id, CASCADE DELETE)
- `portfolio_id` (UUID, FOREIGN KEY → portfolios.id, SET NULL, NULLABLE)
- `symbol` (VARCHAR(10), NOT NULL)
- `option_type` (ENUM: 'call', 'put', NOT NULL)
- `strike_price` (DECIMAL, NOT NULL)
- `expiration_date` (DATE, NOT NULL)
- `open_action` (ENUM: 'buy_to_open', 'sell_to_open', NOT NULL)
- `open_quantity` (INTEGER, NOT NULL)
- `open_premium` (DECIMAL, NOT NULL)
- `open_commission` (DECIMAL, NOT NULL)
- `open_trade_date` (DATE, NOT NULL)
- `open_total_cost` (DECIMAL, COMPUTED)
- `close_action` (ENUM: 'sell_to_close', 'buy_to_close', NULLABLE)
- `close_quantity` (INTEGER, NULLABLE)
- `close_premium` (DECIMAL, NULLABLE)
- `close_commission` (DECIMAL, NULLABLE)
- `close_trade_date` (DATE, NULLABLE)
- `close_total_cost` (DECIMAL, COMPUTED)
- `status` (ENUM: 'open', 'closed', NOT NULL)
- `profit_loss` (DECIMAL, COMPUTED)
- `notes` (TEXT, NULLABLE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- INDEX on `user_id`
- INDEX on `portfolio_id`
- INDEX on `status`
- COMPOSITE INDEX on `(user_id, status)`

---

## Implementation Notes

### Server-Side Calculation Requirements

**CRITICAL:** The server MUST calculate the following fields automatically:

**Positions:**
1. `averageCost = costBasis / shares`
2. `marketValue = shares × currentPrice` (if currentPrice available)
3. `unrealizedPL = marketValue - costBasis` (if marketValue available)

**Trades:**
1. `openTotalCost` - Based on openAction, openPremium, openQuantity, openCommission
2. `closeTotalCost` - Based on closeAction, closePremium, closeQuantity, closeCommission
3. `profitLoss` - Based on openAction, openTotalCost, closeTotalCost
4. `closeAction` - Automatically determined from openAction when closing
5. `closeQuantity` - Set equal to openQuantity when closing

### Validation Requirements

**Position Validation:**
- Ticker must be unique within portfolio
- Shares must be > 0
- Cost basis must be > 0
- Current price must be > 0 if provided

**Portfolio Validation:**
- Name must be unique per user
- Only one portfolio per user can have `isDefault = true`

**Trade Validation:**
- openQuantity must be > 0
- closeQuantity must equal openQuantity (when closing)
- Actions must be properly paired (BUY_TO_OPEN → SELL_TO_CLOSE, etc.)

---

## Version History

- **v3.0** - Simplified specification, removed backward compatibility notes (2025-01-29)
- **v2.0** - Position-based portfolio model (2024-01-29)
- **v1.0** - Initial trade-based specification (2024-01-15)
