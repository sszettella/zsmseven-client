import { Link } from 'react-router-dom';
import { useTrades, useDeleteTrade } from '../hooks/useTrades';
import { formatCurrency } from '@/shared/utils/calculations';
import { usePermissions } from '@/shared/hooks/usePermissions';
import { TradeStatus, Trade } from '@/types/trade';

// Helper function to calculate days to expiration
const calculateDaysToExpiration = (expirationDate: string, fromDate?: string): number => {
  const referenceDate = fromDate ? new Date(fromDate) : new Date();
  referenceDate.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  const diffTime = expDate.getTime() - referenceDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper function to format strike price without cents
const formatStrikePrice = (price: number): string => {
  return `$${Math.round(price)}`;
};

// Helper function to format date without timezone issues
const formatDate = (dateString: string): string => {
  // Parse the date string directly without timezone conversion
  const [year, month, day] = dateString.split('T')[0].split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString();
};

// Helper function to calculate days in trade
const calculateDaysInTrade = (openDate: string, closeDate: string): number => {
  const open = new Date(openDate);
  open.setHours(0, 0, 0, 0);
  const close = new Date(closeDate);
  close.setHours(0, 0, 0, 0);
  const diffTime = close.getTime() - open.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

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
            Open New Trade
          </Link>
        </div>
        <div className="card">
          <p>No trades found. Open your first trade to get started!</p>
        </div>
      </div>
    );
  }

  const openTrades = trades
    .filter((t) => t.status === TradeStatus.OPEN)
    .sort((a, b) => {
      // First, sort by DTE ascending (lowest/expiring soonest first)
      const dteA = calculateDaysToExpiration(a.expirationDate);
      const dteB = calculateDaysToExpiration(b.expirationDate);

      if (dteA !== dteB) {
        return dteA - dteB;
      }

      // If DTE is the same, sort by open date (oldest first)
      const dateA = new Date(a.openTradeDate).getTime();
      const dateB = new Date(b.openTradeDate).getTime();
      return dateA - dateB;
    });

  const closedTrades = trades
    .filter((t) => t.status === TradeStatus.CLOSED)
    .sort((a, b) => {
      // Sort by close date descending (most recent first)
      const dateA = a.closeTradeDate ? new Date(a.closeTradeDate).getTime() : 0;
      const dateB = b.closeTradeDate ? new Date(b.closeTradeDate).getTime() : 0;
      return dateB - dateA;
    });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>All Trades</h1>
        <Link to="/trades/new" className="btn btn-primary">
          Open New Trade
        </Link>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Open Trades</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>{openTrades.length}</div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Closed Trades</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{closedTrades.length}</div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Win Rate</div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: getWinPercentage(closedTrades) >= 50 ? '#28a745' : '#dc3545',
            }}
          >
            {closedTrades.length > 0 ? `${getWinPercentage(closedTrades).toFixed(1)}%` : 'N/A'}
          </div>
          {closedTrades.length > 0 && (
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
              {closedTrades.filter((trade) => (trade.profitLoss || 0) > 0).length} of {closedTrades.length} {closedTrades.length === 1 ? 'trade' : 'trades'}
            </div>
          )}
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Total P/L</div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: getTotalPL(closedTrades) >= 0 ? '#28a745' : '#dc3545',
            }}
          >
            {formatCurrency(getTotalPL(closedTrades))}
          </div>
        </div>
      </div>

      {/* Open Trades Table */}
      {openTrades.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Open Positions</h2>
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Symbol</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Strike</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Exp</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>DTE</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Action</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Premium</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {openTrades.map((trade) => (
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
      )}

      {/* Closed Trades Table */}
      {closedTrades.length > 0 && (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Closed Positions</h2>
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Symbol</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Strike</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>DTE</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Opened</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Closed</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Days</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Open</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Close</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>P/L</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>% G/L</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {closedTrades.map((trade) => (
                    <ClosedTradeRow
                      key={trade.id}
                      trade={trade}
                      canDelete={canDeleteTrade(trade.userId)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface TradeRowProps {
  trade: Trade;
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

  const daysToExpiration = calculateDaysToExpiration(trade.expirationDate);
  const getDTEColor = (dte: number) => {
    if (dte < 0) return '#dc3545'; // Red - expired
    if (dte <= 7) return '#ff6b6b'; // Light red - expiring soon
    if (dte <= 30) return '#ffa500'; // Orange - expiring this month
    return '#666'; // Gray - normal
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
      <td style={{ padding: '0.75rem' }}>{formatStrikePrice(trade.strikePrice)}</td>
      <td style={{ padding: '0.75rem' }}>{formatDate(trade.expirationDate)}</td>
      <td style={{ padding: '0.75rem', textAlign: 'right', color: getDTEColor(daysToExpiration), fontWeight: daysToExpiration <= 7 ? 'bold' : 'normal' }}>
        {daysToExpiration}
      </td>
      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{formatAction(trade.openAction)}</td>
      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{trade.openQuantity}</td>
      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(trade.openPremium)}</td>
      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>
        {formatCurrency(trade.openTotalCost)}
      </td>
      <td style={{ padding: '0.75rem' }}>{formatDate(trade.openTradeDate)}</td>
      <td style={{ padding: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <Link
            to={`/trades/${trade.id}/close`}
            className="btn btn-primary"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
          >
            Close
          </Link>
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

interface ClosedTradeRowProps {
  trade: Trade;
  canDelete: boolean;
}

const ClosedTradeRow = ({ trade, canDelete }: ClosedTradeRowProps) => {
  const { mutate: deleteTrade } = useDeleteTrade();

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this closed trade?')) {
      deleteTrade({ tradeId: trade.id });
    }
  };

  const profitLoss = trade.profitLoss || 0;
  const daysToExpiration = calculateDaysToExpiration(trade.expirationDate, trade.closeTradeDate || undefined);
  const percentGainLoss = getPercentGainLoss(trade);
  const daysInTrade = trade.closeTradeDate ? calculateDaysInTrade(trade.openTradeDate, trade.closeTradeDate) : 0;

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
      <td style={{ padding: '0.75rem' }}>{formatStrikePrice(trade.strikePrice)}</td>
      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#999' }}>
        {daysToExpiration}
      </td>
      <td style={{ padding: '0.75rem' }}>{formatDate(trade.openTradeDate)}</td>
      <td style={{ padding: '0.75rem' }}>
        {trade.closeTradeDate ? formatDate(trade.closeTradeDate) : 'N/A'}
      </td>
      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{daysInTrade}</td>
      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(trade.openTotalCost)}</td>
      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(trade.closeTotalCost || 0)}</td>
      <td
        style={{
          padding: '0.75rem',
          textAlign: 'right',
          fontWeight: 'bold',
          color: profitLoss >= 0 ? '#28a745' : '#dc3545',
        }}
      >
        {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
      </td>
      <td
        style={{
          padding: '0.75rem',
          textAlign: 'right',
          fontWeight: 'bold',
          color: percentGainLoss >= 0 ? '#28a745' : '#dc3545',
        }}
      >
        {percentGainLoss >= 0 ? '+' : ''}{percentGainLoss.toFixed(1)}%
      </td>
      <td style={{ padding: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <Link to={`/trades/${trade.id}/view`}>
            <button
              className="btn btn-primary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
            >
              Edit
            </button>
          </Link>
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

// Helper function to calculate total P/L
const getTotalPL = (trades: Trade[]): number => {
  return trades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
};

// Helper function to calculate win percentage
const getWinPercentage = (trades: Trade[]): number => {
  if (trades.length === 0) return 0;
  const winningTrades = trades.filter((trade) => (trade.profitLoss || 0) > 0).length;
  return (winningTrades / trades.length) * 100;
};

// Helper function to calculate percent gain/loss
const getPercentGainLoss = (trade: Trade): number => {
  const openCost = Math.abs(trade.openTotalCost);
  if (openCost === 0) return 0;
  const profitLoss = trade.profitLoss || 0;
  return (profitLoss / openCost) * 100;
};
