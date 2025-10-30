import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateTrade } from '../hooks/useTrades';
import { Trade, OpeningAction, ClosingAction, OptionType } from '@/types/trade';
import { calculateOpenTotalCost, calculateCloseTotalCost, calculateProfitLoss, formatCurrency } from '@/shared/utils/calculations';
import { useNavigate, useLocation } from 'react-router-dom';
import { PortfolioSelector } from '@/features/portfolios/components/PortfolioSelector';
import { useState } from 'react';

const closedTradeEditSchema = z.object({
  // Opening transaction fields
  symbol: z.string().min(1, 'Symbol is required').max(10, 'Symbol is too long').toUpperCase(),
  optionType: z.nativeEnum(OptionType),
  strikePrice: z.number().positive('Strike price must be positive'),
  expirationDate: z.string().min(1, 'Expiration date is required'),
  openAction: z.nativeEnum(OpeningAction),
  openQuantity: z.number().int().positive('Quantity must be a positive integer'),
  openPremium: z.number().positive('Premium must be positive'),
  openCommission: z.number().min(0, 'Commission cannot be negative'),
  openTradeDate: z.string().min(1, 'Trade date is required'),

  // Closing transaction fields
  closeAction: z.nativeEnum(ClosingAction),
  closePremium: z.number().positive('Closing premium must be positive'),
  closeCommission: z.number().min(0, 'Closing commission cannot be negative'),
  closeTradeDate: z.string().min(1, 'Closing date is required'),

  // Notes
  notes: z.string().optional(),
});

type ClosedTradeEditFormData = z.infer<typeof closedTradeEditSchema>;

interface ClosedTradeEditFormProps {
  trade: Trade;
  portfolioId?: string;
}

export const ClosedTradeEditForm = ({ trade, portfolioId }: ClosedTradeEditFormProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: updateTrade, isPending } = useUpdateTrade();

  // Track selected portfolio separately from the form
  // Only use portfolioId prop or trade's existing portfolioId, don't auto-select default
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | undefined>(
    portfolioId || trade.portfolioId || undefined
  );

  // Determine if we came from the trade list (check if the path includes /trades without a portfolioId in route)
  const cameFromTradeList = location.pathname.startsWith('/trades/') && !location.pathname.includes('/portfolios/');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ClosedTradeEditFormData>({
    resolver: zodResolver(closedTradeEditSchema),
    defaultValues: {
      symbol: trade.symbol,
      optionType: trade.optionType,
      strikePrice: trade.strikePrice,
      expirationDate: trade.expirationDate.split('T')[0],
      openAction: trade.openAction,
      openQuantity: trade.openQuantity,
      openPremium: trade.openPremium,
      openCommission: trade.openCommission,
      openTradeDate: trade.openTradeDate.split('T')[0],
      closeAction: trade.closeAction!,
      closePremium: trade.closePremium!,
      closeCommission: trade.closeCommission!,
      closeTradeDate: trade.closeTradeDate!.split('T')[0],
      notes: trade.notes || '',
    },
  });

  // Watch form values for calculations
  const openAction = watch('openAction');
  const openPremium = watch('openPremium');
  const openQuantity = watch('openQuantity');
  const openCommission = watch('openCommission');
  const closeAction = watch('closeAction');
  const closePremium = watch('closePremium');
  const closeCommission = watch('closeCommission');

  // Calculate totals
  const openTotalCost =
    openPremium && openQuantity && openCommission !== undefined
      ? calculateOpenTotalCost(openAction, openPremium, openQuantity, openCommission)
      : 0;

  const closeTotalCost =
    closePremium && openQuantity && closeCommission !== undefined
      ? calculateCloseTotalCost(closeAction, closePremium, openQuantity, closeCommission)
      : 0;

  const profitLoss =
    openTotalCost && closeTotalCost
      ? calculateProfitLoss(openTotalCost, closeTotalCost, openAction)
      : 0;

  const onSubmit = (data: ClosedTradeEditFormData) => {
    // Build update payload with all fields
    const updateData = {
      portfolioId: selectedPortfolioId || null,
      symbol: data.symbol,
      optionType: data.optionType,
      strikePrice: data.strikePrice,
      expirationDate: data.expirationDate,
      openAction: data.openAction,
      openQuantity: data.openQuantity,
      openPremium: data.openPremium,
      openCommission: data.openCommission,
      openTradeDate: data.openTradeDate,
      notes: data.notes,
      // Include closing fields for closed trades
      closeAction: data.closeAction,
      closePremium: data.closePremium,
      closeCommission: data.closeCommission,
      closeTradeDate: data.closeTradeDate,
    };

    updateTrade(
      {
        tradeId: trade.id,
        data: updateData,
        oldPortfolioId: trade.portfolioId
      },
      {
        onSuccess: () => {
          // Navigate back to where we came from
          if (cameFromTradeList) {
            navigate('/trades');
          } else if (selectedPortfolioId || portfolioId) {
            navigate(`/portfolios/${selectedPortfolioId || portfolioId}`);
          } else {
            navigate('/trades');
          }
        },
      }
    );
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Edit Closed Trade</h2>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Portfolio Selection - only show if not explicitly set via prop */}
        {!portfolioId && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <PortfolioSelector
              value={selectedPortfolioId}
              onChange={setSelectedPortfolioId}
              allowNone={true}
              autoSelectDefault={false}
              label="Portfolio"
              helpText="Optionally associate this trade with a portfolio for organization"
            />
          </div>
        )}

        {/* Opening Transaction Section */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Opening Transaction</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="symbol">
                Symbol *
              </label>
              <input
                {...register('symbol')}
                type="text"
                id="symbol"
                className="form-control"
                placeholder="AAPL"
              />
              {errors.symbol && <p className="error-message">{errors.symbol.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="optionType">
                Option Type *
              </label>
              <select {...register('optionType')} id="optionType" className="form-control">
                <option value={OptionType.CALL}>Call</option>
                <option value={OptionType.PUT}>Put</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="strikePrice">
                Strike Price *
              </label>
              <input
                {...register('strikePrice', { valueAsNumber: true })}
                type="number"
                step="0.01"
                id="strikePrice"
                className="form-control"
                placeholder="150.00"
              />
              {errors.strikePrice && (
                <p className="error-message">{errors.strikePrice.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="expirationDate">
                Expiration Date *
              </label>
              <input
                {...register('expirationDate')}
                type="date"
                id="expirationDate"
                className="form-control"
              />
              {errors.expirationDate && (
                <p className="error-message">{errors.expirationDate.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="openAction">
                Opening Action *
              </label>
              <select {...register('openAction')} id="openAction" className="form-control">
                <option value={OpeningAction.BUY_TO_OPEN}>Buy to Open</option>
                <option value={OpeningAction.SELL_TO_OPEN}>Sell to Open</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="openQuantity">
                Quantity (Contracts) *
              </label>
              <input
                {...register('openQuantity', { valueAsNumber: true })}
                type="number"
                id="openQuantity"
                className="form-control"
                placeholder="1"
              />
              {errors.openQuantity && (
                <p className="error-message">{errors.openQuantity.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="openPremium">
                Premium (per share) *
              </label>
              <input
                {...register('openPremium', { valueAsNumber: true })}
                type="number"
                step="0.01"
                id="openPremium"
                className="form-control"
                placeholder="2.50"
              />
              {errors.openPremium && (
                <p className="error-message">{errors.openPremium.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="openCommission">
                Commission *
              </label>
              <input
                {...register('openCommission', { valueAsNumber: true })}
                type="number"
                step="0.01"
                id="openCommission"
                className="form-control"
                placeholder="0.65"
              />
              {errors.openCommission && (
                <p className="error-message">{errors.openCommission.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="openTradeDate">
                Trade Date *
              </label>
              <input
                {...register('openTradeDate')}
                type="date"
                id="openTradeDate"
                className="form-control"
              />
              {errors.openTradeDate && (
                <p className="error-message">{errors.openTradeDate.message}</p>
              )}
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              marginTop: '1rem',
            }}
          >
            <strong>
              {openAction === OpeningAction.SELL_TO_OPEN ? 'Total Credit: ' : 'Total Cost: '}
              {formatCurrency(openTotalCost)}
            </strong>
            <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
              = ({openPremium} × {openQuantity} × 100) {openAction === OpeningAction.BUY_TO_OPEN ? '+' : '-'} {openCommission}
            </div>
          </div>
        </div>

        {/* Closing Transaction Section */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Closing Transaction</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="closeAction">
                Closing Action *
              </label>
              <select {...register('closeAction')} id="closeAction" className="form-control">
                <option value={ClosingAction.BUY_TO_CLOSE}>Buy to Close</option>
                <option value={ClosingAction.SELL_TO_CLOSE}>Sell to Close</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="closePremium">
                Closing Premium (per share) *
              </label>
              <input
                {...register('closePremium', { valueAsNumber: true })}
                type="number"
                step="0.01"
                id="closePremium"
                className="form-control"
                placeholder="3.50"
              />
              {errors.closePremium && (
                <p className="error-message">{errors.closePremium.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="closeCommission">
                Commission *
              </label>
              <input
                {...register('closeCommission', { valueAsNumber: true })}
                type="number"
                step="0.01"
                id="closeCommission"
                className="form-control"
                placeholder="0.65"
              />
              {errors.closeCommission && (
                <p className="error-message">{errors.closeCommission.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="closeTradeDate">
                Closing Date *
              </label>
              <input
                {...register('closeTradeDate')}
                type="date"
                id="closeTradeDate"
                className="form-control"
              />
              {errors.closeTradeDate && (
                <p className="error-message">{errors.closeTradeDate.message}</p>
              )}
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              marginTop: '1rem',
            }}
          >
            <strong>
              Closing Total: {formatCurrency(closeTotalCost)}
            </strong>
            <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
              = ({closePremium} × {openQuantity} × 100) {closeAction === ClosingAction.SELL_TO_CLOSE ? '-' : '+'} {closeCommission}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="notes">
              Notes
            </label>
            <textarea
              {...register('notes')}
              id="notes"
              className="form-control"
              rows={3}
              placeholder="Optional trade notes..."
            />
          </div>
        </div>

        {/* Profit/Loss Summary */}
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            backgroundColor: profitLoss >= 0 ? '#d4edda' : '#f8d7da',
          }}
        >
          <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
            <div style={{ color: '#666', fontSize: '0.875rem', fontWeight: 'normal', marginBottom: '0.5rem' }}>
              Total Profit/Loss:
            </div>
            <span style={{ color: profitLoss >= 0 ? '#155724' : '#721c24', fontSize: '1.5rem' }}>
              {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              if (cameFromTradeList) {
                navigate('/trades');
              } else if (selectedPortfolioId || portfolioId) {
                navigate(`/portfolios/${selectedPortfolioId || portfolioId}`);
              } else {
                navigate('/trades');
              }
            }}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Saving...' : 'Update Trade'}
          </button>
        </div>
      </form>
    </div>
  );
};
