import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePortfolio } from '../hooks/usePortfolios';
import { usePortfolioPositions, useDeletePosition } from '../hooks/usePositions';
import { usePortfolioYield } from '../hooks/usePortfolioYield';
import { formatDate } from '@/shared/utils/formatters';
import { PositionList } from './PositionList';
import { useTrades } from '@/features/trades/hooks/useTrades';
import { TradeStatus } from '@/types/trade';
import { formatCurrency } from '@/shared/utils/calculations';

export const PortfolioDetail = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio(portfolioId!);
  const { data: positions, isLoading: positionsLoading } = usePortfolioPositions(portfolioId!);
  const { data: trades, isLoading: tradesLoading } = useTrades(portfolioId);
  const yieldMetrics = usePortfolioYield(portfolioId!);
  const { mutate: deletePosition } = useDeletePosition();

  const [showTradesSection, setShowTradesSection] = useState(false);

  if (portfolioLoading || positionsLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!portfolio) {
    return <div>Portfolio not found</div>;
  }

  const handleDeletePosition = (positionId: string) => {
    if (confirm('Are you sure you want to delete this position?')) {
      deletePosition({ portfolioId: portfolioId!, positionId });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/portfolios" style={{ color: '#007bff', textDecoration: 'none' }}>
          ← Back to Portfolios
        </Link>
      </div>

      {/* Portfolio Header */}
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
            {!portfolio.isActive && (
              <span style={{
                display: 'inline-block',
                marginTop: '0.5rem',
                padding: '0.25rem 0.75rem',
                backgroundColor: '#ffc107',
                color: '#000',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}>
                Inactive
              </span>
            )}
          </div>
          <Link
            to={`/portfolios/${portfolioId}/edit`}
            className="btn btn-secondary"
          >
            Edit Portfolio
          </Link>
        </div>
      </div>

      {/* Positions Section */}
      <div style={{ marginBottom: '2rem' }}>
        <PositionList
          portfolioId={portfolioId!}
          positions={positions || []}
          onDeletePosition={handleDeletePosition}
        />
      </div>

      {/* Associated Trades Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Associated Options Trades</h2>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.875rem' }}
            onClick={() => setShowTradesSection(!showTradesSection)}
          >
            {showTradesSection ? 'Hide' : 'Show'} Trades
          </button>
        </div>

        {tradesLoading ? (
          <p style={{ color: '#666' }}>Loading trades...</p>
        ) : !trades || trades.length === 0 ? (
          <div>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              No trades are currently associated with this portfolio.
            </p>
            <Link
              to={`/trades/new?portfolioId=${portfolioId}`}
              className="btn btn-primary"
            >
              Open New Trade
            </Link>
          </div>
        ) : (
          <>
            {/* Trades Summary - Always visible */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>Open Trades</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#007bff' }}>
                  {trades.filter(t => t.status === TradeStatus.OPEN).length}
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>Closed Trades</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {trades.filter(t => t.status === TradeStatus.CLOSED).length}
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>Total P/L</div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: getTotalPL(trades.filter(t => t.status === TradeStatus.CLOSED)) >= 0 ? '#28a745' : '#dc3545'
                  }}
                >
                  {formatCurrency(getTotalPL(trades.filter(t => t.status === TradeStatus.CLOSED)))}
                </div>
              </div>
            </div>

            {/* Yield Metrics - 30 Day Performance */}
            {yieldMetrics && yieldMetrics.tradesCount > 0 && (
              <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#333' }}>Yield (Past 30 Days)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>30-Day Yield</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          color: yieldMetrics.last30DaysYieldPercent >= 0 ? '#28a745' : '#dc3545',
                        }}
                      >
                        {yieldMetrics.last30DaysYieldPercent >= 0 ? '+' : ''}
                        {yieldMetrics.last30DaysYieldPercent.toFixed(2)}%
                      </span>
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        ({yieldMetrics.last30DaysYieldPercent >= 0 ? '+' : ''}
                        {formatCurrency(yieldMetrics.last30DaysYieldDollar)})
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>Annualized Yield</div>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: yieldMetrics.last30DaysAnnualizedYield >= 0 ? '#28a745' : '#dc3545',
                      }}
                    >
                      {yieldMetrics.last30DaysAnnualizedYield >= 0 ? '+' : ''}
                      {yieldMetrics.last30DaysAnnualizedYield.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>Portfolio Value</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                      {formatCurrency(yieldMetrics.portfolioValue)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#999' }}>
                      {yieldMetrics.tradesCount} {yieldMetrics.tradesCount === 1 ? 'trade' : 'trades'} closed
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Collapsible Trade Tables */}
            {showTradesSection && (
              <>
                {/* Open Trades */}
                {trades.filter(t => t.status === TradeStatus.OPEN).length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Open Trades</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Symbol</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Type</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Strike</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Expiration</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Qty</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Premium</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total</th>
                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trades.filter(t => t.status === TradeStatus.OPEN).map(trade => (
                            <tr key={trade.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                              <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{trade.symbol}</td>
                              <td style={{ padding: '0.5rem' }}>
                                <span
                                  style={{
                                    padding: '0.2rem 0.4rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    backgroundColor: trade.optionType === 'call' ? '#e3f2fd' : '#fce4ec',
                                    color: trade.optionType === 'call' ? '#1976d2' : '#c2185b',
                                  }}
                                >
                                  {trade.optionType.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '0.5rem', textAlign: 'right' }}>${Math.round(trade.strikePrice)}</td>
                              <td style={{ padding: '0.5rem' }}>{new Date(trade.expirationDate).toLocaleDateString()}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right' }}>{trade.openQuantity}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(trade.openPremium)}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                                {formatCurrency(trade.openTotalCost)}
                              </td>
                              <td style={{ padding: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                  <Link
                                    to={`/trades/${trade.id}/close`}
                                    className="btn btn-primary"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  >
                                    Close
                                  </Link>
                                  <Link
                                    to={`/trades/${trade.id}/edit`}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  >
                                    Edit
                                  </Link>
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
                {trades.filter(t => t.status === TradeStatus.CLOSED).length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Closed Trades</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Symbol</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Type</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Strike</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Opened</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Closed</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Open Cost</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Close Cost</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>P/L</th>
                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trades.filter(t => t.status === TradeStatus.CLOSED).map(trade => {
                            const profitLoss = trade.profitLoss || 0;
                            return (
                              <tr key={trade.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{trade.symbol}</td>
                                <td style={{ padding: '0.5rem' }}>
                                  <span
                                    style={{
                                      padding: '0.2rem 0.4rem',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      backgroundColor: trade.optionType === 'call' ? '#e3f2fd' : '#fce4ec',
                                      color: trade.optionType === 'call' ? '#1976d2' : '#c2185b',
                                    }}
                                  >
                                    {trade.optionType.toUpperCase()}
                                  </span>
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>${Math.round(trade.strikePrice)}</td>
                                <td style={{ padding: '0.5rem' }}>{new Date(trade.openTradeDate).toLocaleDateString()}</td>
                                <td style={{ padding: '0.5rem' }}>
                                  {trade.closeTradeDate ? new Date(trade.closeTradeDate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(trade.openTotalCost)}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(trade.closeTotalCost || 0)}</td>
                                <td
                                  style={{
                                    padding: '0.5rem',
                                    textAlign: 'right',
                                    fontWeight: 'bold',
                                    color: profitLoss >= 0 ? '#28a745' : '#dc3545',
                                  }}
                                >
                                  {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
                                </td>
                                <td style={{ padding: '0.5rem' }}>
                                  <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                    <Link
                                      to={`/trades/${trade.id}/view`}
                                      className="btn btn-secondary"
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                    >
                                      Edit
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <Link
                    to={`/trades/new?portfolioId=${portfolioId}`}
                    className="btn btn-primary"
                    style={{ fontSize: '0.875rem' }}
                  >
                    Open New Trade
                  </Link>
                  <Link
                    to="/trades"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.875rem' }}
                  >
                    View All Trades
                  </Link>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Helper function to calculate total P/L
const getTotalPL = (trades: any[]): number => {
  return trades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
};
