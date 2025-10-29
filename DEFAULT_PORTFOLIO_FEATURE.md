# Default Portfolio Feature - Implementation Summary

## Overview

Added support for marking a portfolio as "default" for options trades. Users can:
- Mark any portfolio as the default for options trades
- See which portfolio is the default at a glance
- Have trades automatically associated with the default portfolio (if no portfolio is explicitly selected)
- Override the default selection when creating trades

## Changes Made

### 1. Data Model Updates

#### Portfolio Type ([src/types/portfolio.ts](src/types/portfolio.ts))
```typescript
export interface Portfolio {
  // ... existing fields
  isDefault: boolean;  // New field: marks portfolio as default for trades
}
```

**Key Rules:**
- Only one portfolio per user can be marked as default
- Setting a portfolio as default automatically unsets any other default
- Defaults to `false` for new portfolios

### 2. API Specification Updates

#### New Portfolio Model Field
Added `isDefault: boolean` to Portfolio model with full documentation in [PORTFOLIO_API_SPEC.md](PORTFOLIO_API_SPEC.md#L31)

#### New Endpoints

**Get Default Portfolio:**
```
GET /portfolios/default
```
Returns the user's default portfolio (404 if none set)

**Set Default Portfolio:**
```
POST /portfolios/:id/set-default
```
Sets a portfolio as default, automatically unsetting any other default

#### Updated Endpoints

**Create Portfolio (POST /portfolios):**
- Added `isDefault` optional field (defaults to false)
- Server automatically handles ensuring only one default exists

**Update Portfolio (PUT /portfolios/:id):**
- Added `isDefault` optional field
- Server automatically unsets other defaults when set to true

### 3. API Service Layer

#### [portfoliosService.ts](src/features/portfolios/api/portfoliosService.ts)
```typescript
// New methods
getDefault: async (): Promise<Portfolio | null>
setDefault: async (id: string): Promise<Portfolio>
```

#### [usePortfolios.ts](src/features/portfolios/hooks/usePortfolios.ts)
```typescript
// New hooks
export const useDefaultPortfolio = () => { ... }
export const useSetDefaultPortfolio = () => { ... }
```

### 4. UI Components

#### [PortfolioList.tsx](src/features/portfolios/components/PortfolioList.tsx)
**Added:**
- "DEFAULT FOR TRADES" badge next to default portfolio name (green)
- "Set as Default for Trades" button for non-default portfolios
- One-click action to set a portfolio as default

**Visual Indicators:**
```
Portfolio Name [DEFAULT FOR TRADES] [INACTIVE]
├─ Description
├─ Created date
└─ [Set as Default for Trades] button (if not default)
```

#### [PortfolioForm.tsx](src/features/portfolios/components/PortfolioForm.tsx)
**Added:**
- "Default for Options Trades" checkbox
- Help text: "When creating trades, this portfolio will be selected by default"
- Supports both create and edit operations

#### [PortfolioSelector.tsx](src/features/portfolios/components/PortfolioSelector.tsx) - NEW
**Purpose:** Reusable component for selecting a portfolio in trade forms

**Features:**
- Automatically selects default portfolio if no value set
- Shows "(Default)" label next to default portfolio in dropdown
- Displays green message when using default: "Using default portfolio: Portfolio Name"
- Allows selecting "None (unassigned)" to create unlinked trades
- Only shows active portfolios
- Configurable label and help text

**Usage Example:**
```typescript
<PortfolioSelector
  value={portfolioId}
  onChange={setPortfolioId}
  allowNone={true}
  label="Associate with Portfolio"
  helpText="Optionally link this trade to a portfolio"
/>
```

## User Workflows

### Workflow 1: Set Default Portfolio

1. Navigate to Portfolios page
2. Find desired portfolio
3. Click "Set as Default for Trades"
4. Portfolio immediately gets green "DEFAULT FOR TRADES" badge
5. Other portfolios lose default status (if any had it)

### Workflow 2: Create Trade with Default Portfolio

1. Navigate to Create Trade page
2. PortfolioSelector shows default portfolio pre-selected
3. Green message: "Using default portfolio: [Name]"
4. User can:
   - Keep the default selection
   - Choose a different portfolio from dropdown
   - Select "None (unassigned)" to create unlinked trade

### Workflow 3: Create Portfolio as Default

1. Click "Create Portfolio"
2. Fill in name and description
3. Check "Default for Options Trades" checkbox
4. Submit form
5. New portfolio is created and marked as default
6. Any existing default is automatically unset

### Workflow 4: Change Default in Edit Form

1. Open portfolio for editing
2. Check/uncheck "Default for Options Trades"
3. Save changes
4. If checked: This portfolio becomes default, others lose default status
5. If unchecked: This portfolio is no longer default (no portfolio is default)

## Database Considerations

### Schema Changes

**portfolios table:**
```sql
ALTER TABLE portfolios ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;
```

**Unique Constraint (Recommended):**
```sql
CREATE UNIQUE INDEX idx_portfolios_user_default
ON portfolios (user_id, is_default)
WHERE is_default = true;
```
This ensures only one default portfolio per user at the database level.

### Migrations

When a user sets `isDefault: true` on a portfolio:
1. Server finds any existing default portfolio for that user
2. Sets `isDefault: false` on the existing default
3. Sets `isDefault: true` on the new portfolio
4. Both operations in a transaction to ensure consistency

## Integration Points

### Trade Forms
Any component creating trades should use the `PortfolioSelector` component:

```typescript
import { PortfolioSelector } from '@/features/portfolios/components/PortfolioSelector';

function TradeForm() {
  const [portfolioId, setPortfolioId] = useState<string | undefined>();

  return (
    <form>
      {/* Other trade fields */}

      <PortfolioSelector
        value={portfolioId}
        onChange={setPortfolioId}
        allowNone={true}
      />

      {/* Submit button */}
    </form>
  );
}
```

The selector will automatically:
- Pre-select the default portfolio (if one exists)
- Show visual indicator that default is being used
- Allow user to override or remove portfolio selection

## Testing Checklist

### Backend Tests
- [ ] Only one portfolio per user can be default at a time
- [ ] Setting portfolio A as default unsets portfolio B (if B was default)
- [ ] Setting isDefault=false removes default status
- [ ] GET /portfolios/default returns 404 when no default exists
- [ ] POST /portfolios/:id/set-default updates correct portfolio
- [ ] Creating portfolio with isDefault=true works correctly
- [ ] Updating portfolio with isDefault=true works correctly
- [ ] Cannot set another user's portfolio as your default (403)
- [ ] Deleting default portfolio removes default status

### Frontend Tests
- [ ] PortfolioList shows "DEFAULT FOR TRADES" badge correctly
- [ ] "Set as Default for Trades" button only shows on non-default portfolios
- [ ] Clicking "Set as Default" updates UI immediately
- [ ] PortfolioForm checkbox for isDefault works in create mode
- [ ] PortfolioForm checkbox for isDefault works in edit mode
- [ ] PortfolioSelector pre-selects default portfolio
- [ ] PortfolioSelector shows "(Default)" label in dropdown
- [ ] PortfolioSelector displays green message when using default
- [ ] User can override default selection in PortfolioSelector
- [ ] User can select "None" to create unlinked trade

## Benefits

1. **Faster Trade Entry:** Users who frequently associate trades with one portfolio don't need to select it every time
2. **Better Organization:** Encourages users to organize trades by setting up a logical default
3. **Flexibility:** Users can still override the default or create unlinked trades
4. **Clear Visual Feedback:** Badges and messages make it obvious which portfolio is default
5. **Simple UX:** One-click to set default from portfolio list

## Future Enhancements

Potential additions for future versions:

1. **Multiple Defaults by Category:**
   - Allow one default per option type (calls vs puts)
   - Allow one default per strategy type (covered calls, spreads, etc.)

2. **Smart Defaults:**
   - Suggest default based on recent trade patterns
   - Remember last-used portfolio per symbol

3. **Default Templates:**
   - Save trade templates with associated portfolios
   - Quick-create trades from templates

4. **Bulk Operations:**
   - Batch-assign multiple trades to default portfolio
   - Move all unassigned trades to default

## Version History

- **v2.1** - Added default portfolio feature (2025-01-29)
- **v2.0** - Position-based portfolio model (2025-01-29)
- **v1.0** - Initial trade-based specification (2024-01-15)
