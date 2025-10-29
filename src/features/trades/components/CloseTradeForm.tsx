import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCloseTrade } from '../hooks/useTrades';
import { Trade, ClosingAction, getValidCloseAction } from '@/types/trade';
import { calculateCloseTotalCost, calculateProfitLoss, formatCurrency } from '@/shared/utils/calculations';
import { useNavigate } from 'react-router-dom';

const closeTradeSchema = z.object({
  closePremium: z.number().positive('Premium must be positive'),
  closeCommission: z.number().min(0, 'Commission cannot be negative'),
  closeTradeDate: z.string().min(1, 'Trade date is required'),
});

type CloseTradeFormData = z.infer<typeof closeTradeSchema>;

interface CloseTradeFormProps {
  trade: Trade;
  portfolioId?: string;
}

export const CloseTradeForm = ({ trade, portfolioId }: CloseTradeFormProps) => {
  const navigate = useNavigate();
  const { mutate: closeTrade, isPending } = useCloseTrade();

  // Determine the valid closing action based on opening action
  const closeAction = getValidCloseAction(trade.openAction);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CloseTradeFormData>({
    resolver: zodResolver(closeTradeSchema),
    defaultValues: {
      closeCommission: 0,
      closeTradeDate: new Date().toISOString().split('T')[0],
    },
  });

  const closePremium = watch('closePremium');
  const closeCommission = watch('closeCommission');

  // Calculate projected values
  const closeTotalCost =
    closePremium && closeCommission !== undefined
      ? calculateCloseTotalCost(closeAction, closePremium, trade.openQuantity, closeCommission)
      : 0;

  const projectedPL =
    closeTotalCost
      ? calculateProfitLoss(trade.openTotalCost, closeTotalCost, trade.openAction)
      : 0;

  const onSubmit = (data: CloseTradeFormData) => {
    closeTrade(
      {
        tradeId: trade.id,
        closeData: {
          closeAction,
          closePremium: data.closePremium,
          closeCommission: data.closeCommission,
          closeTradeDate: data.closeTradeDate,
        },
      },
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
  };

  const formatActionText = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to format date without timezone issues
  const formatDate = (dateString: string): string => {
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString();
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Close Trade</h2>

      {/* Opening Transaction Summary */}
      <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#f8f9fa' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Opening Transaction</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Symbol</div>
            <div style={{ fontWeight: 'bold' }}>{trade.symbol}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Type</div>
            <div style={{ fontWeight: 'bold' }}>{trade.optionType.toUpperCase()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Strike</div>
            <div style={{ fontWeight: 'bold' }}>{formatCurrency(trade.strikePrice)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Expiration</div>
            <div style={{ fontWeight: 'bold' }}>{formatDate(trade.expirationDate)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Action</div>
            <div style={{ fontWeight: 'bold' }}>{formatActionText(trade.openAction)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Quantity</div>
            <div style={{ fontWeight: 'bold' }}>{trade.openQuantity} contracts</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Premium</div>
            <div style={{ fontWeight: 'bold' }}>{formatCurrency(trade.openPremium)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Commission</div>
            <div style={{ fontWeight: 'bold' }}>{formatCurrency(trade.openCommission)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Total</div>
            <div style={{ fontWeight: 'bold', color: '#007bff' }}>{formatCurrency(trade.openTotalCost)}</div>
          </div>
        </div>
      </div>

      {/* Closing Transaction Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Closing Transaction</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Closing Action</label>
            <input
              type="text"
              className="form-control"
              value={formatActionText(closeAction)}
              readOnly
              style={{ backgroundColor: '#e9ecef' }}
            />
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
              Auto-determined based on opening action
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input
              type="text"
              className="form-control"
              value={`${trade.openQuantity} contracts`}
              readOnly
              style={{ backgroundColor: '#e9ecef' }}
            />
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
              Must match opening quantity
            </p>
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

        {/* Projected P/L Summary */}
        {closePremium && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: projectedPL >= 0 ? '#d4edda' : '#f8d7da',
              borderRadius: '4px',
              marginTop: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>
                Closing Total: {formatCurrency(closeTotalCost)}
              </strong>
              <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                = ({closePremium} × {trade.openQuantity} × 100) {closeAction === ClosingAction.SELL_TO_CLOSE ? '-' : '+'} {closeCommission}
              </div>
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginTop: '0.75rem' }}>
              <div style={{ color: '#666', fontSize: '0.875rem', fontWeight: 'normal' }}>Projected Profit/Loss:</div>
              <span style={{ color: projectedPL >= 0 ? '#155724' : '#721c24' }}>
                {projectedPL >= 0 ? '+' : ''}{formatCurrency(projectedPL)}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(portfolioId ? `/portfolios/${portfolioId}` : '/trades')}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Closing...' : 'Close Trade'}
          </button>
        </div>
      </form>
    </div>
  );
};
