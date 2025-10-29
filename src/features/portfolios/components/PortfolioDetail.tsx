import { useParams, Link } from 'react-router-dom';
import { usePortfolio } from '../hooks/usePortfolios';
import { useTrades, useDeleteTrade } from '@/features/trades/hooks/useTrades';
import { formatDate } from '@/shared/utils/formatters';
import { formatCurrency } from '@/shared/utils/calculations';
import { TradeStatus } from '@/types/trade';

export const PortfolioDetail = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio(portfolioId!);
  const { data: trades, isLoading: tradesLoading } = useTrades(portfolioId!);
  const { mutate: deleteTrade } = useDeleteTrade();

  if (portfolioLoading || tradesLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!portfolio) {
    return <div>Portfolio not found</div>;
  }

  const openTrades = trades?.filter((t) => t.status === TradeStatus.OPEN) || [];
  const closedTrades = trades?.filter((t) => t.status === TradeStatus.CLOSED) || [];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/portfolios" style={{ color: '#007bff', textDecoration: 'none' }}>
          ← Back to Portfolios
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>{portfolio.name}</h1>
            {portfolio.description && (
              <p style={{ color: '#666', marginBottom: '0.5rem' }}>{portfolio.description}</p>
            )}
            <p style={{ fontSize: '0.875rem', color: '#999' }}>
              Created: {formatDate(portfolio.createdAt)}
            </p>
          </div>
          <Link
            to={`/portfolios/${portfolioId}/trades/new`}
            className="btn btn-primary"
          >
            Open New Trade
          </Link>
        </div>
      </div>

      {/* Open Trades */}
      {openTrades.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Open Positions</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Symbol</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Strike</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Action</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Quantity</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Premium</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {openTrades.map((trade) => (
                  <tr key={trade.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{trade.symbol}</td>
                    <td style={{ padding: '1rem' }}>
                      {trade.optionType.charAt(0).toUpperCase() + trade.optionType.slice(1)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      ${trade.strikePrice.toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {trade.openAction.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{trade.openQuantity}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      ${trade.openPremium.toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {formatCurrency(trade.openTotalCost)}
                    </td>
                    <td style={{ padding: '1rem' }}>{formatDate(trade.openTradeDate)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Link
                          to={`/trades/${trade.id}/close`}
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                        >
                          Close
                        </Link>
                        <Link
                          to={`/portfolios/${portfolioId}/trades/${trade.id}/edit`}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                        >
                          Edit
                        </Link>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this trade?')) {
                              deleteTrade({ tradeId: trade.id });
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Closed Trades */}
      {closedTrades.length > 0 && (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Closed Positions</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Symbol</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Strike</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Open Total</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Close Total</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>P/L</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Closed</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {closedTrades.map((trade) => (
                  <tr key={trade.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{trade.symbol}</td>
                    <td style={{ padding: '1rem' }}>
                      {trade.optionType.charAt(0).toUpperCase() + trade.optionType.slice(1)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      ${trade.strikePrice.toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {formatCurrency(trade.openTotalCost)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {formatCurrency(trade.closeTotalCost || 0)}
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: (trade.profitLoss || 0) >= 0 ? '#28a745' : '#dc3545',
                      }}
                    >
                      {(trade.profitLoss || 0) >= 0 ? '+' : ''}{formatCurrency(trade.profitLoss || 0)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {trade.closeTradeDate ? formatDate(trade.closeTradeDate) : 'N/A'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this closed trade?')) {
                            deleteTrade({ tradeId: trade.id });
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No trades */}
      {trades && trades.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            No trades yet. Start tracking your options trades!
          </p>
          <Link
            to={`/portfolios/${portfolioId}/trades/new`}
            className="btn btn-primary"
          >
            Open Your First Trade
          </Link>
        </div>
      )}
    </div>
  );
};
