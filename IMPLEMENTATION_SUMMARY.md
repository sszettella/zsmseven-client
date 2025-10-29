# Trade Model Update - Implementation Summary

## What Changed

### Before (Single Transaction Model)
- Each `OptionTrade` was a standalone transaction
- Actions: BUY_TO_OPEN, BUY_TO_CLOSE, SELL_TO_OPEN, SELL_TO_CLOSE (all independent)
- No relationship between opening and closing transactions
- P/L calculated manually by user

### After (Open/Close Paired Model)
- Each `Trade` contains opening + optional closing transaction
- Opening actions: BUY_TO_OPEN, SELL_TO_OPEN only
- Closing actions: SELL_TO_CLOSE, BUY_TO_CLOSE only (must pair correctly)
- Status: OPEN or CLOSED
- P/L automatically calculated when trade is closed

---

## Files Created/Updated

### Documentation
1. **UPDATED_TRADE_MODEL_SPEC.md** - Complete data model specification
2. **TRADES_API_SPEC_UPDATED.md** - Full API specification for backend
3. **IMPLEMENTATION_SUMMARY.md** - This file

### Code Updated
1. **src/types/trade.ts** - New TypeScript interfaces
   - `Trade` interface (main)
   - `TradeStatus` enum (OPEN/CLOSED)
   - `OpeningAction` enum (BUY_TO_OPEN, SELL_TO_OPEN)
   - `ClosingAction` enum (BUY_TO_CLOSE, SELL_TO_CLOSE)
   - `CreateTradeData` interface
   - `CloseTradeData` interface
   - `UpdateTradeData` interface
   - Helper functions for validation

---

## Key Business Rules

### 1. Transaction Pairing
| Opening Action | Valid Closing Action |
|----------------|---------------------|
| BUY_TO_OPEN    | SELL_TO_CLOSE       |
| SELL_TO_OPEN   | BUY_TO_CLOSE        |

### 2. Cost Calculations

**Opening**:
- BUY_TO_OPEN: `(premium × quantity × 100) + commission` (debit)
- SELL_TO_OPEN: `(premium × quantity × 100) - commission` (credit)

**Closing**:
- SELL_TO_CLOSE: `(premium × quantity × 100) - commission` (credit)
- BUY_TO_CLOSE: `(premium × quantity × 100) + commission` (debit)

**Profit/Loss** (when closed):
- Long (BUY_TO_OPEN): `closeTotalCost - openTotalCost`
- Short (SELL_TO_OPEN): `openTotalCost - closeTotalCost`

### 3. Validation Rules
- ✅ Close action must match open action (pairing)
- ✅ Close quantity must equal open quantity
- ✅ Cannot close an already closed trade
- ✅ Cannot edit a closed trade
- ✅ Symbol, strike, expiration, type must remain same

---

## API Endpoints (New/Updated)

### New Endpoints
- `GET /api/trades/open` - Get only open trades (for close selection)
- `PUT /api/trades/:id/close` - Close an open trade

### Updated Endpoints
- `GET /api/trades` - Returns trades with open/close structure
- `GET /api/trades/:id` - Returns single trade with open/close structure
- `POST /api/trades` - Create opening transaction only
- `PUT /api/trades/:id` - Update open trade details (not closing)
- `DELETE /api/trades/:id` - Delete any trade

---

## Next Steps for Full Implementation

### Backend API
1. ⬜ Update database schema
2. ⬜ Implement opening transaction creation
3. ⬜ Implement closing transaction logic
4. ⬜ Add action pairing validation
5. ⬜ Implement cost and P/L calculations
6. ⬜ Add constraints and triggers
7. ⬜ Write tests

### Frontend Client
1. ⬜ Update trades service
2. ⬜ Update trades hooks
3. ⬜ Update TradeForm (opening only)
4. ⬜ Create CloseTradeForm component
5. ⬜ Update TradeList component
6. ⬜ Add "Close" button to open trades
7. ⬜ Update profit/loss displays
8. ⬜ Update calculations utilities
9. ⬜ Add open trade selector

---

## UI Changes Needed

### 1. Trade Entry Form (Opening)
- Remove BUY_TO_CLOSE and SELL_TO_CLOSE from action dropdown
- Keep only BUY_TO_OPEN and SELL_TO_OPEN
- Form creates trade with `status: "open"`
- Label as "Open Trade" or "New Position"

### 2. Close Trade Form (New Component)
- Triggered by "Close" button on open trade
- Pre-fill: symbol, type, strike, expiration, quantity (read-only)
- Auto-determine close action based on open action
- Editable: close premium, commission, date
- Show projected P/L as user enters close premium
- Label as "Close Trade" or "Close Position"

### 3. Trade List Updates
```
Columns to Add:
- Status badge (OPEN/CLOSED)
- Close Date (if closed)
- Close Premium (if closed)
- P/L (if closed, color-coded)

Buttons:
- "Close" button (only show for OPEN trades)
- "Edit" button (only for OPEN trades)
- "Delete" button (always)
- "View" button (always)

Filters:
- Show All / Show Open / Show Closed
```

### 4. Dashboard Metrics (New)
```
- Total Open Trades: Count of status="open"
- Total Closed Trades: Count of status="closed"
- Total P/L: Sum of all profitLoss
- Largest Win: Max positive profitLoss
- Largest Loss: Max negative profitLoss
- Win Rate: % of closed trades with profitLoss > 0
```

---

## Example User Flow

### Opening a Trade
1. User clicks "New Trade"
2. Fills out form with opening details
3. Selects BUY_TO_OPEN or SELL_TO_OPEN
4. Submits → Trade created with `status: "open"`

### Closing a Trade
1. User views trade list, sees open trades
2. Clicks "Close" button on an open BUY_TO_OPEN trade
3. Close form opens, pre-filled with trade details
4. closeAction auto-set to SELL_TO_CLOSE (read-only)
5. User enters close premium, commission, date
6. Form shows projected P/L
7. Submits → Trade updated with `status: "closed"` and calculated profitLoss

### Viewing History
1. User views all trades
2. Sees both open (no close data) and closed (with P/L)
3. Can filter to show only open or closed trades
4. Can see total P/L across all closed trades

---

## Migration Strategy

### Option A: Clean Break (Recommended for new projects)
- Drop old table
- Create new schema
- No existing data to migrate

### Option B: Data Migration (For existing data)
```sql
-- If you have existing single-transaction data:
-- 1. Keep old table as archive
-- 2. Migrate opening transactions to new schema
-- 3. Mark them all as status='open'
-- 4. User can manually close them via new UI
```

---

## Testing Scenarios

### Test Case 1: Long Trade (Profit)
```
Open:  BUY_TO_OPEN,  5 contracts @ $3.50, commission $6.50
       openTotalCost = $1,756.50

Close: SELL_TO_CLOSE, 5 contracts @ $4.25, commission $6.50
       closeTotalCost = $2,118.50

Expected P/L = $362.00 (profit)
```

### Test Case 2: Short Trade (Profit)
```
Open:  SELL_TO_OPEN,  10 contracts @ $5.75, commission $8.00
       openTotalCost = $5,742.00

Close: BUY_TO_CLOSE,  10 contracts @ $3.00, commission $8.00
       closeTotalCost = $3,008.00

Expected P/L = $2,734.00 (profit)
```

### Test Case 3: Validation Errors
```
✗ Try to close BUY_TO_OPEN with BUY_TO_CLOSE (wrong pairing)
✗ Try to close already closed trade
✗ Try to edit closed trade
✗ Try to close with different quantity than opened
```

---

## API Specification Files

1. **TRADES_API_SPEC_UPDATED.md** - Give this to your backend developer
   - Complete endpoint documentation
   - Request/response examples
   - Validation rules
   - Database schema
   - Calculation formulas

2. **UPDATED_TRADE_MODEL_SPEC.md** - Reference for data structure
   - Business rules
   - Type definitions
   - Migration strategies
   - UI mockups

---

## TypeScript Usage Examples

```typescript
import {
  Trade,
  TradeStatus,
  OpeningAction,
  ClosingAction,
  getValidCloseAction,
  areActionsPaired
} from '@/types/trade';

// Create opening trade data
const newTrade: CreateTradeData = {
  symbol: 'AAPL',
  optionType: OptionType.CALL,
  strikePrice: 150,
  expirationDate: '2024-03-15',
  openAction: OpeningAction.BUY_TO_OPEN,
  openQuantity: 5,
  openPremium: 3.50,
  openCommission: 6.50,
  openTradeDate: '2024-01-15',
  notes: 'Bullish on tech'
};

// Determine valid close action
const closeAction = getValidCloseAction(OpeningAction.BUY_TO_OPEN);
// Returns: ClosingAction.SELL_TO_CLOSE

// Validate pairing
const isValid = areActionsPaired(
  OpeningAction.BUY_TO_OPEN,
  ClosingAction.SELL_TO_CLOSE
);
// Returns: true
```

---

## Summary

✅ **Type definitions updated** - src/types/trade.ts
✅ **API spec created** - TRADES_API_SPEC_UPDATED.md
✅ **Data model documented** - UPDATED_TRADE_MODEL_SPEC.md
⬜ **Backend API** - Not implemented (use spec document)
⬜ **Frontend components** - Not updated yet (next phase)

**Ready for backend implementation using TRADES_API_SPEC_UPDATED.md**
