import { Link } from 'react-router-dom';
import { useTrades } from '../hooks/useTrades';
import { useDeleteTrade } from '../hooks/useTrades';
import { formatCurrency } from '@/shared/utils/calculations';
import { usePermissions } from '@/shared/hooks/usePermissions';

export const TradeList = () => {
  const { data: trades, isLoading } = useTrades();
  const { canEditTrade, canDeleteTrade } = usePermissions();

  if (isLoading) {
    return <div className="loading">Loading trades...</div>;
  }

  if (!trades || trades.length === 0) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>All Trades</h1>
          <Link to="/trades/new" className="btn btn-primary">
            New Trade
          </Link>
        </div>
        <div className="card">
          <p>No trades found. Create your first trade to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>All Trades</h1>
        <Link to="/trades/new" className="btn btn-primary">
          New Trade
        </Link>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Symbol</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Action</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Strike</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Expiration</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Quantity</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Premium</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Cost</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Portfolio</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Trade Date</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <TradeRow
                  key={trade.id}
                  trade={trade}
                  canEdit={canEditTrade(trade.userId)}
                  canDelete={canDeleteTrade(trade.userId)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface TradeRowProps {
  trade: any;
  canEdit: boolean;
  canDelete: boolean;
}

const TradeRow = ({ trade, canEdit, canDelete }: TradeRowProps) => {
  const { mutate: deleteTrade } = useDeleteTrade();

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      deleteTrade({ tradeId: trade.id });
    }
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
      <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{trade.symbol}</td>
      <td style={{ padding: '0.75rem' }}>
        <span
          style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.875rem',
            backgroundColor: trade.optionType === 'call' ? '#e3f2fd' : '#fce4ec',
            color: trade.optionType === 'call' ? '#1976d2' : '#c2185b',
          }}
        >
          {trade.optionType.toUpperCase()}
        </span>
      </td>
      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{formatAction(trade.action)}</td>
      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(trade.strikePrice)}</td>
      <td style={{ padding: '0.75rem' }}>{new Date(trade.expirationDate).toLocaleDateString()}</td>
      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{trade.quantity}</td>
      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(trade.premium)}</td>
      <td
        style={{
          padding: '0.75rem',
          textAlign: 'right',
          fontWeight: 'bold',
          color: trade.action.includes('buy') ? '#d32f2f' : '#388e3c',
        }}
      >
        {formatCurrency(trade.totalCost)}
      </td>
      <td style={{ padding: '0.75rem' }}>
        {trade.portfolioId ? (
          <Link to={`/portfolios/${trade.portfolioId}`} style={{ textDecoration: 'none', color: '#007bff' }}>
            View Portfolio
          </Link>
        ) : (
          <span style={{ color: '#999', fontStyle: 'italic' }}>Standalone</span>
        )}
      </td>
      <td style={{ padding: '0.75rem' }}>{new Date(trade.tradeDate).toLocaleDateString()}</td>
      <td style={{ padding: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          {canEdit && (
            <Link
              to={`/trades/${trade.id}/edit`}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
            >
              Edit
            </Link>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="btn btn-danger"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
            >
              Delete
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
