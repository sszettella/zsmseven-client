import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTrade, useUpdateTrade } from '../hooks/useTrades';
import { OptionTrade, OptionAction, OptionType } from '@/types/trade';
import { calculateTotalCost, formatCurrency } from '@/shared/utils/calculations';
import { useNavigate } from 'react-router-dom';

const tradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(10, 'Symbol is too long').toUpperCase(),
  action: z.nativeEnum(OptionAction),
  optionType: z.nativeEnum(OptionType),
  strikePrice: z.number().positive('Strike price must be positive'),
  expirationDate: z.string().min(1, 'Expiration date is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  premium: z.number().positive('Premium must be positive'),
  commission: z.number().min(0, 'Commission cannot be negative'),
  tradeDate: z.string().min(1, 'Trade date is required'),
  notes: z.string().optional(),
});

type TradeFormData = z.infer<typeof tradeSchema>;

interface TradeFormProps {
  portfolioId: string;
  trade?: OptionTrade;
}

export const TradeForm = ({ portfolioId, trade }: TradeFormProps) => {
  const navigate = useNavigate();
  const { mutate: createTrade, isPending: isCreating } = useCreateTrade(portfolioId);
  const { mutate: updateTrade, isPending: isUpdating } = useUpdateTrade(portfolioId);

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
          action: trade.action,
          optionType: trade.optionType,
          strikePrice: trade.strikePrice,
          expirationDate: trade.expirationDate.split('T')[0],
          quantity: trade.quantity,
          premium: trade.premium,
          commission: trade.commission,
          tradeDate: trade.tradeDate.split('T')[0],
          notes: trade.notes || '',
        }
      : {
          action: OptionAction.BUY_TO_OPEN,
          optionType: OptionType.CALL,
          commission: 0,
          tradeDate: new Date().toISOString().split('T')[0],
        },
  });

  const action = watch('action');
  const premium = watch('premium');
  const quantity = watch('quantity');
  const commission = watch('commission');

  const totalCost = premium && quantity && commission !== undefined
    ? calculateTotalCost(action, premium, quantity, commission)
    : 0;

  const onSubmit = (data: TradeFormData) => {
    if (trade) {
      updateTrade(
        { tradeId: trade.id, data },
        {
          onSuccess: () => navigate(`/portfolios/${portfolioId}`),
        }
      );
    } else {
      createTrade(data, {
        onSuccess: () => navigate(`/portfolios/${portfolioId}`),
      });
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>
        {trade ? 'Edit Trade' : 'New Trade'}
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
            <label className="form-label" htmlFor="action">
              Action *
            </label>
            <select {...register('action')} id="action" className="form-control">
              <option value={OptionAction.BUY_TO_OPEN}>Buy to Open</option>
              <option value={OptionAction.BUY_TO_CLOSE}>Buy to Close</option>
              <option value={OptionAction.SELL_TO_OPEN}>Sell to Open</option>
              <option value={OptionAction.SELL_TO_CLOSE}>Sell to Close</option>
            </select>
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
            <label className="form-label" htmlFor="tradeDate">
              Trade Date *
            </label>
            <input
              {...register('tradeDate')}
              type="date"
              id="tradeDate"
              className="form-control"
            />
            {errors.tradeDate && (
              <p className="error-message">{errors.tradeDate.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="quantity">
              Quantity (Contracts) *
            </label>
            <input
              {...register('quantity', { valueAsNumber: true })}
              type="number"
              id="quantity"
              className="form-control"
              placeholder="1"
            />
            {errors.quantity && <p className="error-message">{errors.quantity.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="premium">
              Premium (per share) *
            </label>
            <input
              {...register('premium', { valueAsNumber: true })}
              type="number"
              step="0.01"
              id="premium"
              className="form-control"
              placeholder="2.50"
            />
            {errors.premium && <p className="error-message">{errors.premium.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="commission">
              Commission *
            </label>
            <input
              {...register('commission', { valueAsNumber: true })}
              type="number"
              step="0.01"
              id="commission"
              className="form-control"
              placeholder="0.65"
            />
            {errors.commission && (
              <p className="error-message">{errors.commission.message}</p>
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
          <strong>Total Cost: {formatCurrency(totalCost)}</strong>
          <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
            = ({premium} × {quantity} × 100) {action.includes('buy') ? '+' : '-'} {commission}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(`/portfolios/${portfolioId}`)}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Saving...' : trade ? 'Update Trade' : 'Create Trade'}
          </button>
        </div>
      </form>
    </div>
  );
};
