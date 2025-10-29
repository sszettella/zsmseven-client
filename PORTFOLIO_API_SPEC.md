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
- When creating a trade, if no portfolio is specified, it will be associated with the default portfolio (if one exists)
- Setting a portfolio as default will automatically unset any other default portfolio for that user
- Default portfolios are useful for quickly associating options trades without manual selection

### Position

A position represents a holding of shares in a portfolio.

```typescript
{
  id: string;              // UUID, server-generated
  portfolioId: string;     // UUID, required - positions must belong to a portfolio
  ticker: string;          // Stock ticker symbol (e.g., "AAPL", "SPY")
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

### Trade

Trades (options) can optionally be associated with portfolios for organizational purposes, but are managed separately.

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
  openTotalCost: number;         // SERVER CALCULATED

  // Closing Transaction (null until trade is closed)
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

*(Same as original specification - see Trade Endpoints section for details)*

---

## API Endpoints

### Portfolio Endpoints

#### 1. List All Portfolios

**GET** `/portfolios`

Returns all portfolios for the authenticated user.

**Query Parameters:**
- `isActive` (optional): `true` | `false` - Filter by active status
- `includeSummary` (optional): `true` | `false` - Include position summaries

**Response:** `200 OK`
```json
{
  "portfolios": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "Long-Term Holdings",
      "description": "Core equity positions",
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

**Query Parameters:**
- `includePositions` (optional): `true` | `false` (default: `false`) - Include positions array
- `includeMetrics` (optional): `true` | `false` (default: `false`) - Include calculated metrics
- `includeTrades` (optional): `true` | `false` (default: `false`) - Include associated trades summary

**Response:** `200 OK`

*Basic response (no query params):*
```json
{
  "portfolio": {
    "id": "uuid",
    "userId": "uuid",
    "name": "Long-Term Holdings",
    "description": "Core equity positions",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

*Full response (all query params true):*
```json
{
  "portfolio": {
    "id": "uuid",
    "userId": "uuid",
    "name": "Long-Term Holdings",
    "description": "Core equity positions",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "positions": [
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
  ],
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
  "description": "Core equity positions",  // optional
  "isActive": true,  // optional, defaults to true
  "isDefault": false  // optional, defaults to false
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `description`: Optional, max 500 characters
- `isActive`: Optional, boolean, defaults to true
- `isDefault`: Optional, boolean, defaults to false

**Server Behavior for `isDefault`:**
- If `isDefault: true`, the server will automatically set `isDefault: false` on any other portfolio for this user
- Only one portfolio per user can be marked as default at a time
- Default portfolios are used for auto-associating options trades when no portfolio is explicitly selected

**Response:** `201 Created`
```json
{
  "portfolio": {
    "id": "uuid",
    "userId": "uuid",
    "name": "Long-Term Holdings",
    "description": "Core equity positions",
    "isActive": true,
    "isDefault": false,
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
  "name": "Updated Long-Term Holdings",  // optional
  "description": "Updated description",  // optional
  "isActive": false,  // optional
  "isDefault": true  // optional
}
```

**Validation Rules:**
- All fields are optional
- `name`: 1-100 characters if provided
- `description`: Max 500 characters if provided

**Server Behavior for `isDefault`:**
- If `isDefault: true`, the server will automatically set `isDefault: false` on any other portfolio for this user
- Setting `isDefault: false` is allowed if you want to remove the default designation

**Response:** `200 OK`
```json
{
  "portfolio": {
    "id": "uuid",
    "userId": "uuid",
    "name": "Updated Long-Term Holdings",
    "description": "Updated description",
    "isActive": false,
    "isDefault": true,
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

Deletes a portfolio and handles associated positions and trades.

**Path Parameters:**
- `id` (required): Portfolio UUID

**Query Parameters:**
- `deletePositions` (required): `true` | `false`
  - If `true`: Delete all positions (CASCADE DELETE)
  - If `false`: Reject if portfolio has positions (must be empty)
- `orphanTrades` (optional): `true` | `false` (default: `true`)
  - If `true`: Set portfolioId to null for associated trades
  - If `false`: Keep trades linked (no action - trades reference becomes invalid)

**Response:** `204 No Content`

**Error Responses:**
- `400 Bad Request` - Portfolio has positions and deletePositions=false
- `404 Not Found` - Portfolio does not exist
- `403 Forbidden` - Portfolio belongs to different user

---

#### 6. Get Default Portfolio

**GET** `/portfolios/default`

Returns the user's default portfolio for options trades (if one is set).

**Response:** `200 OK`
```json
{
  "portfolio": {
    "id": "uuid",
    "userId": "uuid",
    "name": "Options Trading",
    "description": "Default portfolio for options trades",
    "isActive": true,
    "isDefault": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - No default portfolio set for user

---

#### 7. Set Default Portfolio

**POST** `/portfolios/:id/set-default`

Sets a portfolio as the default for options trades. Automatically unsets any other default portfolio.

**Path Parameters:**
- `id` (required): Portfolio UUID

**Response:** `200 OK`
```json
{
  "portfolio": {
    "id": "uuid",
    "userId": "uuid",
    "name": "Options Trading",
    "description": "Default portfolio for options trades",
    "isActive": true,
    "isDefault": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - Portfolio does not exist
- `403 Forbidden` - Portfolio belongs to different user

---

### Position Endpoints

#### 8. List Positions by Portfolio

**GET** `/portfolios/:portfolioId/positions`

Returns all positions for a portfolio.

**Path Parameters:**
- `portfolioId` (required): Portfolio UUID

**Query Parameters:**
- `sortBy` (optional): `ticker` | `shares` | `costBasis` | `marketValue` | `unrealizedPL` | `unrealizedPLPercent` (default: `ticker`)
- `sortOrder` (optional): `asc` | `desc` (default: `asc`)

**Response:** `200 OK`
```json
{
  "positions": [
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
  ],
  "total": 5
}
```

**Error Responses:**
- `404 Not Found` - Portfolio does not exist
- `403 Forbidden` - Portfolio belongs to different user

---

#### 9. Get Position by ID

**GET** `/positions/:id`

Returns a single position by ID.

**Path Parameters:**
- `id` (required): Position UUID

**Response:** `200 OK`
```json
{
  "position": {
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
}
```

**Error Responses:**
- `404 Not Found` - Position does not exist
- `403 Forbidden` - Position belongs to portfolio owned by different user

---

#### 10. Create Position

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
  "currentPrice": 175.50,  // optional
  "notes": "Added during tech dip"  // optional
}
```

**Validation Rules:**
- `ticker`: Required, 1-10 uppercase characters (auto-converted to uppercase)
- `shares`: Required, must be > 0, can be fractional (e.g., 10.5)
- `costBasis`: Required, must be > 0
- `currentPrice`: Optional, must be > 0 if provided
- `notes`: Optional, max 1000 characters
- Cannot create duplicate ticker in same portfolio (must update existing position instead)

**Server Calculations:**
- `averageCost`: Calculated as costBasis / shares
- `marketValue`: Calculated as shares × currentPrice (if currentPrice provided)
- `unrealizedPL`: Calculated as marketValue - costBasis (if currentPrice provided)

**Response:** `201 Created`
```json
{
  "position": {
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
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Portfolio does not exist
- `403 Forbidden` - Portfolio belongs to different user
- `409 Conflict` - Position with same ticker already exists in portfolio

---

#### 11. Update Position

**PUT** `/positions/:id`

Updates an existing position.

**Path Parameters:**
- `id` (required): Position UUID

**Request Body:**
```json
{
  "ticker": "AAPL",  // optional (usually shouldn't change)
  "shares": 150,  // optional
  "costBasis": 22500.00,  // optional
  "currentPrice": 180.00,  // optional (can set to null to clear)
  "notes": "Updated notes"  // optional
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
  "position": {
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
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Position does not exist
- `403 Forbidden` - Position belongs to portfolio owned by different user
- `409 Conflict` - Ticker change conflicts with existing position in portfolio

---

#### 12. Delete Position

**DELETE** `/positions/:id`

Deletes a position from a portfolio.

**Path Parameters:**
- `id` (required): Position UUID

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Position does not exist
- `403 Forbidden` - Position belongs to portfolio owned by different user

---

#### 13. Update Position Prices (Batch)

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

*(Trades remain largely the same but are now clearly separated from portfolios)*

#### 14. List All Trades

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

#### 15. Get Trades by Portfolio

**GET** `/portfolios/:portfolioId/trades`

Returns all trades associated with a portfolio (for organizational purposes).

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

#### 16. Create Trade

**POST** `/trades`

Creates a new options trade.

**Request Body:**
```json
{
  "portfolioId": "uuid",  // optional - can associate with portfolio for organization
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
- `openTotalCost`:
  - BUY_TO_OPEN: `(openPremium × openQuantity × 100) + openCommission`
  - SELL_TO_OPEN: `(openPremium × openQuantity × 100) - openCommission`
- `status`: Set to "open"

**Response:** `201 Created`
*(Same as original specification)*

---

#### 17. Close Trade

**PUT** `/trades/:id/close`

Closes an open options trade.

**Path Parameters:**
- `id` (required): Trade UUID

**Request Body:**
```json
{
  "closePremium": 3.00,
  "closeCommission": 0.65,
  "closeTradeDate": "2024-02-10",
  "notes": "Taking profit"  // optional
}
```

**Server Calculations:**
- `closeAction`: Automatically determined (BUY_TO_OPEN → SELL_TO_CLOSE, etc.)
- `closeQuantity`: Set equal to openQuantity
- `closeTotalCost`:
  - SELL_TO_CLOSE: `(closePremium × closeQuantity × 100) - closeCommission`
  - BUY_TO_CLOSE: `(closePremium × closeQuantity × 100) + closeCommission`
- `profitLoss`:
  - Long (BUY_TO_OPEN): `closeTotalCost - openTotalCost`
  - Short (SELL_TO_OPEN): `openTotalCost - closeTotalCost`
- `status`: Set to "closed"

**Response:** `200 OK`
*(Same as original specification)*

---

#### 18. Update Trade

**PUT** `/trades/:id`

Updates trade details.

*(Same as original specification)*

---

#### 19. Delete Trade

**DELETE** `/trades/:id`

Deletes a trade.

**Response:** `204 No Content`

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

## Database Considerations

### Indexes

**Portfolios table:**
- Primary key on `id`
- Index on `userId`
- Unique index on `(userId, name)` for duplicate name prevention

**Positions table:**
- Primary key on `id`
- Index on `portfolioId`
- Unique index on `(portfolioId, ticker)` for duplicate ticker prevention
- Index on `ticker` for cross-portfolio ticker searches

**Trades table:**
- Primary key on `id`
- Index on `userId`
- Index on `portfolioId`
- Index on `status`
- Composite index on `(userId, status)` for common queries
- Index on `closeTradeDate` for date-range queries

### Foreign Keys

- `positions.portfolioId` → `portfolios.id` (CASCADE DELETE)
- `trades.portfolioId` → `portfolios.id` (SET NULL) - trades can be orphaned
- `trades.userId` → `users.id` (CASCADE DELETE)
- `portfolios.userId` → `users.id` (CASCADE DELETE)

---

## Implementation Notes

### Server-Side Calculation Requirements

**CRITICAL:** The server MUST calculate the following fields:

**Positions:**
1. `averageCost` - Calculate from costBasis / shares
2. `marketValue` - Calculate from shares × currentPrice (if price available)
3. `unrealizedPL` - Calculate from marketValue - costBasis (if price available)

**Trades:**
1. `openTotalCost` - Calculate from openAction, openPremium, openQuantity, openCommission
2. `closeTotalCost` - Calculate from closeAction, closePremium, closeQuantity, closeCommission
3. `profitLoss` - Calculate from openAction, openTotalCost, closeTotalCost
4. `closeAction` - Derive from openAction when closing trade
5. `closeQuantity` - Set equal to openQuantity when closing trade

### Validation Requirements

**Position Validation:**
1. Ticker must be unique within portfolio
2. Shares must be > 0
3. Cost basis must be > 0
4. Current price must be > 0 if provided

**Portfolio Deletion:**
1. Must handle positions (delete or reject if has positions)
2. Must handle trades (orphan or keep references)

---

## Example Workflows

### Workflow 1: Create Portfolio with Positions

**Step 1:** Create portfolio
```
POST /portfolios
{
  "name": "Tech Growth Portfolio",
  "description": "High-growth tech stocks"
}
```

**Step 2:** Add first position
```
POST /portfolios/{id}/positions
{
  "ticker": "AAPL",
  "shares": 100,
  "costBasis": 15000.00,
  "currentPrice": 175.50
}

Server calculates:
- averageCost = 15000.00 / 100 = $150.00
- marketValue = 100 × 175.50 = $17,550.00
- unrealizedPL = 17550.00 - 15000.00 = $2,550.00
```

**Step 3:** Add more positions
```
POST /portfolios/{id}/positions
{
  "ticker": "GOOGL",
  "shares": 50,
  "costBasis": 7000.00,
  "currentPrice": 140.25
}
```

**Step 4:** Get portfolio summary
```
GET /portfolios/{id}?includePositions=true&includeMetrics=true

Returns full portfolio with all positions and aggregated metrics
```

---

### Workflow 2: Update Position Prices

**Step 1:** Update prices for all positions (e.g., end-of-day update)
```
PATCH /portfolios/{id}/positions/prices
{
  "prices": [
    { "ticker": "AAPL", "currentPrice": 178.25 },
    { "ticker": "GOOGL", "currentPrice": 142.50 }
  ]
}

Server recalculates for each:
- marketValue = shares × new currentPrice
- unrealizedPL = marketValue - costBasis
```

**Step 2:** Get updated portfolio metrics
```
GET /portfolios/{id}?includeMetrics=true

Returns updated totalMarketValue, totalUnrealizedPL, etc.
```

---

### Workflow 3: Portfolio with Associated Trades

**Step 1:** Create portfolio with positions
```
POST /portfolios
{
  "name": "AAPL Growth",
  "description": "AAPL shares + options strategy"
}

POST /portfolios/{id}/positions
{
  "ticker": "AAPL",
  "shares": 100,
  "costBasis": 15000.00
}
```

**Step 2:** Create options trade associated with portfolio
```
POST /trades
{
  "portfolioId": "{portfolio-id}",
  "symbol": "AAPL",
  "optionType": "call",
  "strikePrice": 180.00,
  "expirationDate": "2024-12-20",
  "openAction": "sell_to_open",  // covered call
  "openQuantity": 1,  // 1 contract covers 100 shares
  "openPremium": 3.50,
  "openCommission": 0.65,
  "openTradeDate": "2024-01-15"
}
```

**Step 3:** View portfolio with positions and trades
```
GET /portfolios/{id}?includePositions=true&includeTrades=true

Returns:
- Position: 100 AAPL shares
- Associated trades: 1 open covered call
```

---

## Testing Checklist

### Position Tests
- [ ] Create position with all fields
- [ ] Create position with minimal fields (no current price)
- [ ] Update position shares/cost basis (recalculate averageCost)
- [ ] Update position current price (recalculate market value and P&L)
- [ ] Batch update prices for multiple positions
- [ ] Cannot create duplicate ticker in portfolio
- [ ] Position calculations are accurate (averageCost, marketValue, unrealizedPL)
- [ ] Fractional shares support (e.g., 10.5 shares)

### Portfolio Tests
- [ ] Create portfolio
- [ ] List portfolios with/without summaries
- [ ] Get portfolio with all optional data (positions, metrics, trades)
- [ ] Update portfolio details
- [ ] Delete empty portfolio
- [ ] Delete portfolio with positions (cascade delete)
- [ ] Reject delete if portfolio has positions and deletePositions=false
- [ ] Portfolio metrics calculations are accurate
- [ ] Cannot create duplicate portfolio name for same user

### Portfolio-Position Integration
- [ ] Adding position updates portfolio metrics
- [ ] Deleting position updates portfolio metrics
- [ ] Updating position price updates portfolio metrics
- [ ] Top gainer/loser calculations are correct
- [ ] Empty portfolio has zero metrics

### Trade-Portfolio Association
- [ ] Create trade with portfolioId
- [ ] Create trade without portfolioId (unassigned)
- [ ] List trades by portfolio
- [ ] Update trade portfolioId (reassign)
- [ ] Delete portfolio orphans associated trades
- [ ] Portfolio trade summary counts are accurate

### Authorization Tests
- [ ] Cannot access another user's portfolios
- [ ] Cannot access positions in another user's portfolio
- [ ] Cannot access another user's trades
- [ ] Proper 401/403 responses

### Edge Cases
- [ ] Position with zero current price (no market value/P&L)
- [ ] Very small fractional shares (e.g., 0.001 shares)
- [ ] Very large position values
- [ ] Negative cost basis (not allowed)
- [ ] Negative shares (not allowed)
- [ ] Portfolio with 1000+ positions (performance)

---

## Future Enhancements

Consider these additions in future versions:

**Position Features:**
1. **Position history** - Track adds/sells over time with lot tracking
2. **Cost basis methods** - FIFO, LIFO, average cost, specific lot
3. **Dividend tracking** - Record dividends received per position
4. **Tax lots** - Track individual purchase lots for tax reporting
5. **Corporate actions** - Stock splits, mergers, spinoffs
6. **Real-time pricing** - Integration with market data providers
7. **Price alerts** - Notify when position reaches target price

**Portfolio Features:**
1. **Asset allocation** - Sector breakdown, position weighting
2. **Performance metrics** - Sharpe ratio, beta, alpha
3. **Benchmarking** - Compare to S&P 500, etc.
4. **Rebalancing** - Suggest trades to maintain target allocation
5. **Dividend summary** - Total dividends by portfolio
6. **Risk metrics** - Portfolio volatility, correlation matrix

**Integration:**
1. **Trade-to-Position** - Close options trade into stock position (e.g., assignment)
2. **Covered calls** - Link positions with corresponding options
3. **Import** - Import positions from brokerage (CSV, API)
4. **Export** - Export for tax software (TurboTax, etc.)

---

## Version History

- **v2.0** - Position-based portfolio model (2024-01-29)
- **v1.0** - Initial trade-based specification (2024-01-15)
