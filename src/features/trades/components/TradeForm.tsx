import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTrade, useUpdateTrade } from '../hooks/useTrades';
import { Trade, OpeningAction, OptionType } from '@/types/trade';
import { calculateOpenTotalCost, formatCurrency } from '@/shared/utils/calculations';
import { useNavigate } from 'react-router-dom';

const tradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(10, 'Symbol is too long').toUpperCase(),
  optionType: z.nativeEnum(OptionType),
  strikePrice: z.number().positive('Strike price must be positive'),
  expirationDate: z.string().min(1, 'Expiration date is required'),
  openAction: z.nativeEnum(OpeningAction),
  openQuantity: z.number().int().positive('Quantity must be a positive integer'),
  openPremium: z.number().positive('Premium must be positive'),
  openCommission: z.number().min(0, 'Commission cannot be negative'),
  openTradeDate: z.string().min(1, 'Trade date is required'),
  notes: z.string().optional(),
});

type TradeFormData = z.infer<typeof tradeSchema>;

interface TradeFormProps {
  portfolioId?: string;
  trade?: Trade; // For editing open trades only
}

export const TradeForm = ({ portfolioId, trade }: TradeFormProps) => {
  const navigate = useNavigate();
  const { mutate: createTrade, isPending: isCreating } = useCreateTrade(portfolioId);
  const { mutate: updateTrade, isPending: isUpdating } = useUpdateTrade();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: trade
      ? {
          symbol: trade.symbol,
          optionType: trade.optionType,
          strikePrice: trade.strikePrice,
          expirationDate: trade.expirationDate.split('T')[0],
          openAction: trade.openAction,
          openQuantity: trade.openQuantity,
          openPremium: trade.openPremium,
          openCommission: trade.openCommission,
          openTradeDate: trade.openTradeDate.split('T')[0],
          notes: trade.notes || '',
        }
      : {
          optionType: OptionType.CALL,
          openAction: OpeningAction.BUY_TO_OPEN,
          openCommission: 0,
          openTradeDate: new Date().toISOString().split('T')[0],
        },
  });

  const openAction = watch('openAction');
  const openPremium = watch('openPremium');
  const openQuantity = watch('openQuantity');
  const openCommission = watch('openCommission');

  const openTotalCost =
    openPremium && openQuantity && openCommission !== undefined
      ? calculateOpenTotalCost(openAction, openPremium, openQuantity, openCommission)
      : 0;

  const onSubmit = (data: TradeFormData) => {
    if (trade) {
      // Update existing open trade
      updateTrade(
        { tradeId: trade.id, data },
        {
          onSuccess: () => {
            if (portfolioId) {
              navigate(`/portfolios/${portfolioId}`);
            } else {
              navigate('/trades');
            }
          },
        }
      );
    } else {
      // Create new trade
      createTrade(data, {
        onSuccess: () => {
          if (portfolioId) {
            navigate(`/portfolios/${portfolioId}`);
          } else {
            navigate('/trades');
          }
        },
      });
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>
        {trade ? 'Edit Trade' : 'Open New Trade'}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="card">
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

        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            marginBottom: '1rem',
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

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(portfolioId ? `/portfolios/${portfolioId}` : '/trades')}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Saving...' : trade ? 'Update Trade' : 'Open Trade'}
          </button>
        </div>
      </form>
    </div>
  );
};
