import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePortfolio, usePortfolioAnalysis } from '../hooks/usePortfolios';
import { usePortfolioPositions, useDeletePosition } from '../hooks/usePositions';
import { usePortfolioYield } from '../hooks/usePortfolioYield';
import { formatDate } from '@/shared/utils/formatters';
import { PositionList } from './PositionList';
import { OpportunityIndex } from './OpportunityIndex';
import { useTrades } from '@/features/trades/hooks/useTrades';
import { TradeStatus } from '@/types/trade';
import { formatCurrency } from '@/shared/utils/calculations';

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

// Helper function to calculate days in trade for open positions
const calculateDaysInOpenTrade = (openDate: string): number => {
  const open = new Date(openDate);
  open.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - open.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper function to calculate percent gain/loss
const getPercentGainLoss = (trade: any): number => {
  const openCost = Math.abs(trade.openTotalCost);
  if (openCost === 0) return 0;
  const profitLoss = trade.profitLoss || 0;
  return (profitLoss / openCost) * 100;
};

export const PortfolioDetail = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio(portfolioId!);
  const { data: positions, isLoading: positionsLoading } = usePortfolioPositions(portfolioId!);
  const { data: trades, isLoading: tradesLoading } = useTrades(portfolioId);
  const { data: analysis, isLoading: analysisLoading, error: analysisError } = usePortfolioAnalysis(portfolioId!, false);
  const yieldMetrics = usePortfolioYield(portfolioId!);
  const { mutate: deletePosition } = useDeletePosition();

  // Debug: Log analysis data
  console.log('Portfolio Analysis Debug:', {
    portfolioId,
    isLoading: analysisLoading,
    hasData: !!analysis,
    error: analysisError,
    analysis
  });

  const [showTradesSection, setShowTradesSection] = useState(false);
  const [openTradesSortKey, setOpenTradesSortKey] = useState<string>('symbol');
  const [openTradesSortDir, setOpenTradesSortDir] = useState<'asc' | 'desc'>('asc');
  const [closedTradesSortKey, setClosedTradesSortKey] = useState<string>('closeTradeDate');
  const [closedTradesSortDir, setClosedTradesSortDir] = useState<'asc' | 'desc'>('desc');

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

  // Sorting handler for open trades
  const handleOpenTradesSort = (key: string) => {
    if (openTradesSortKey === key) {
      setOpenTradesSortDir(openTradesSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setOpenTradesSortKey(key);
      setOpenTradesSortDir('asc');
    }
  };

  // Sorting handler for closed trades
  const handleClosedTradesSort = (key: string) => {
    if (closedTradesSortKey === key) {
      setClosedTradesSortDir(closedTradesSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setClosedTradesSortKey(key);
      setClosedTradesSortDir('asc');
    }
  };

  // Sort indicator component
  const SortIndicator = ({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) => (
    <span style={{ marginLeft: '0.25rem', fontSize: '0.75rem', opacity: active ? 1 : 0.3 }}>
      {direction === 'asc' ? '▲' : '▼'}
    </span>
  );

  // Generic sort function
  const sortTrades = (tradesArray: any[], sortKey: string, sortDir: 'asc' | 'desc') => {
    return [...tradesArray].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      // Handle special calculated fields
      if (sortKey === 'daysToExpiration') {
        aVal = calculateDaysToExpiration(a.expirationDate, a.closeTradeDate || undefined);
        bVal = calculateDaysToExpiration(b.expirationDate, b.closeTradeDate || undefined);
      } else if (sortKey === 'daysInTrade') {
        if (a.status === TradeStatus.OPEN) {
          aVal = calculateDaysInOpenTrade(a.openTradeDate);
          bVal = calculateDaysInOpenTrade(b.openTradeDate);
        } else {
          aVal = a.closeTradeDate ? calculateDaysInTrade(a.openTradeDate, a.closeTradeDate) : 0;
          bVal = b.closeTradeDate ? calculateDaysInTrade(b.openTradeDate, b.closeTradeDate) : 0;
        }
      } else if (sortKey === 'percentGainLoss') {
        aVal = getPercentGainLoss(a);
        bVal = getPercentGainLoss(b);
      }

      // Handle date fields
      if (sortKey === 'expirationDate' || sortKey === 'openTradeDate' || sortKey === 'closeTradeDate') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      // Handle numeric fields
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle string fields
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();

      if (sortDir === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
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
            Edit
          </Link>
        </div>
      </div>

      {/* Yield Metrics - 30 Day Performance */}
      {yieldMetrics && yieldMetrics.tradesCount > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
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
              <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>Profit/Loss</div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: yieldMetrics.last30DaysYieldDollar >= 0 ? '#28a745' : '#dc3545'
                }}
              >
                {yieldMetrics.last30DaysYieldDollar >= 0 ? '+' : ''}
                {formatCurrency(yieldMetrics.last30DaysYieldDollar)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#999' }}>
                {yieldMetrics.tradesCount} {yieldMetrics.tradesCount === 1 ? 'trade' : 'trades'} closed
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Opportunity Index - AI Analysis */}
      {/* Show loading state */}
      {analysisLoading && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#333' }}>
            Opportunity Index
          </h3>
          <p style={{ color: '#666', fontSize: '0.875rem' }}>Loading AI analysis...</p>
        </div>
      )}

      {/* Show error state if API call failed */}
      {!analysisLoading && analysisError && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: '#f8d7da', borderColor: '#dc3545' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#721c24' }}>
            Analysis Not Available
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#721c24', margin: 0 }}>
            Portfolio analysis has not been generated yet. Analysis is typically generated daily for portfolios with positions.
          </p>
          <details style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#721c24' }}>
            <summary style={{ cursor: 'pointer' }}>Technical Details</summary>
            <pre style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', overflow: 'auto', color: '#333' }}>
              {JSON.stringify(analysisError, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Show analysis data with debug info */}
      {!analysisLoading && !analysisError && analysis && (
        <>
          {/* Debug: Show if analysis exists but no opportunities */}
          {(!analysis.parsed_data?.opportunities || analysis.parsed_data.opportunities.length === 0) && (
            <div className="card" style={{ marginBottom: '2rem', backgroundColor: '#fff3cd', borderColor: '#ffc107' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#856404' }}>
                Portfolio Analysis Available
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#856404', margin: 0 }}>
                Analysis data received but no opportunity scores available yet. The AI analysis may still be processing position opportunities.
              </p>
              {/* Debug info */}
              <details style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#666' }}>
                <summary style={{ cursor: 'pointer' }}>Debug Info (Click to expand full analysis data)</summary>
                <pre style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', overflow: 'auto', maxHeight: '300px' }}>
                  {JSON.stringify(analysis, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* Show OpportunityIndex when data is available */}
          {analysis.parsed_data?.opportunities && analysis.parsed_data.opportunities.length > 0 && (
            <OpportunityIndex
              opportunities={analysis.parsed_data.opportunities}
              isLoading={analysisLoading}
            />
          )}
        </>
      )}

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
            {showTradesSection ? 'Hide' : 'Show'}
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
                            <th
                              style={{ padding: '0.5rem', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleOpenTradesSort('symbol')}
                            >
                              Symbol
                              <SortIndicator active={openTradesSortKey === 'symbol'} direction={openTradesSortDir} />
                            </th>
                            <th
                              style={{ padding: '0.5rem', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleOpenTradesSort('optionType')}
                            >
                              Type
                              <SortIndicator active={openTradesSortKey === 'optionType'} direction={openTradesSortDir} />
                            </th>
                            <th
                              style={{ padding: '0.5rem', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleOpenTradesSort('strikePrice')}
                            >
                              Strike
                              <SortIndicator active={openTradesSortKey === 'strikePrice'} direction={openTradesSortDir} />
                            </th>
                            <th
                              style={{ padding: '0.5rem', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleOpenTradesSort('expirationDate')}
                            >
                              Exp
                              <SortIndicator active={openTradesSortKey === 'expirationDate'} direction={openTradesSortDir} />
                            </th>
                            <th
                              style={{ padding: '0.5rem', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleOpenTradesSort('daysToExpiration')}
                            >
                              DTE
                              <SortIndicator active={openTradesSortKey === 'daysToExpiration'} direction={openTradesSortDir} />
                            </th>
                            <th
                              style={{ padding: '0.5rem', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleOpenTradesSort('openQuantity')}
                            >
                              Qty
                              <SortIndicator active={openTradesSortKey === 'openQuantity'} direction={openTradesSortDir} />
                            </th>
                            <th
                              style={{ padding: '0.5rem', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleOpenTradesSort('openPremium')}
                            >
                              Premium
                              <SortIndicator active={openTradesSortKey === 'openPremium'} direction={openTradesSortDir} />
                            </th>
                            <th
                              style={{ padding: '0.5rem', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleOpenTradesSort('openTotalCost')}
                            >
                              Total
                              <SortIndicator active={openTradesSortKey === 'openTotalCost'} direction={openTradesSortDir} />
                            </th>
                            <th
                              style={{ padding: '0.5rem', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleOpenTradesSort('openTradeDate')}
                            >
                              Date
                              <SortIndicator active={openTradesSortKey === 'openTradeDate'} direction={openTradesSortDir} />
                            </th>
                            <th
                              style={{ padding: '0.5rem', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleOpenTradesSort('daysInTrade')}
                            >
                              Days
                              <SortIndicator active={openTradesSortKey === 'daysInTrade'} direction={openTradesSortDir} />
                            </th>
                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortTrades(
                            trades.filter(t => t.status === TradeStatus.OPEN),
                            openTradesSortKey,
                            openTradesSortDir
                          ).map(trade => (
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
                              <td style={{ padding: '0.5rem' }}>{formatDate(trade.expirationDate)}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right' }}>{calculateDaysToExpiration(trade.expirationDate)}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right' }}>{trade.openQuantity}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(trade.openPremium)}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                                {formatCurrency(trade.openTotalCost)}
                              </td>
                              <td style={{ padding: '0.5rem' }}>{formatDate(trade.openTradeDate)}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right' }}>{calculateDaysInOpenTrade(trade.openTradeDate)}</td>
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
                            <th
                              style={{ padding: '0.5rem', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleClosedTradesSort('symbol')}
                            >
                              Symbol
                              <SortIndicator active={closedTradesSortKey === 'symbol'} direction={closedTradesSortDir} />
                            </th>
                            <th
                              style={{ padding: '0.5rem', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleClosedTradesSort('optionType')}
                            >
                              Type
                              <SortIndicator active={closedTradesSortKey === 'optionType'} direction={closedTradesSortDir} />
                            </th>
                            <th
                              style={{ padding: '0.5rem', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleClosedTradesSort('daysToExpiration')}
                            >
                              DTE
                              <SortIndicator active={closedTradesSortKey === 'daysToExpiration'} direction={closedTradesSortDir} />
                            </th>
                            <th
                              style={{ padding: '0.5rem', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleClosedTradesSort('openTradeDate')}
                            >
                              Opened
                              <SortIndicator active={closedTradesSortKey === 'openTradeDate'} direction={closedTradesSortDir} />
                            </th>
                            <th
                              style={{ padding: '0.5rem', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleClosedTradesSort('closeTradeDate')}
                            >
                              Closed
                              <SortIndicator active={closedTradesSortKey === 'closeTradeDate'} direction={closedTradesSortDir} />
                            </th>
                            <th
                              style={{ padding: '0.5rem', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleClosedTradesSort('daysInTrade')}
                            >
                              Days
                              <SortIndicator active={closedTradesSortKey === 'daysInTrade'} direction={closedTradesSortDir} />
                            </th>
                            <th
                              style={{ padding: '0.5rem', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleClosedTradesSort('openTotalCost')}
                            >
                              Open
                              <SortIndicator active={closedTradesSortKey === 'openTotalCost'} direction={closedTradesSortDir} />
                            </th>
                            <th
                              style={{ padding: '0.5rem', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleClosedTradesSort('closeTotalCost')}
                            >
                              Close
                              <SortIndicator active={closedTradesSortKey === 'closeTotalCost'} direction={closedTradesSortDir} />
                            </th>
                            <th
                              style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleClosedTradesSort('profitLoss')}
                            >
                              P/L
                              <SortIndicator active={closedTradesSortKey === 'profitLoss'} direction={closedTradesSortDir} />
                            </th>
                            <th
                              style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleClosedTradesSort('percentGainLoss')}
                            >
                              % G/L
                              <SortIndicator active={closedTradesSortKey === 'percentGainLoss'} direction={closedTradesSortDir} />
                            </th>
                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortTrades(
                            trades.filter(t => t.status === TradeStatus.CLOSED),
                            closedTradesSortKey,
                            closedTradesSortDir
                          ).map(trade => {
                            const profitLoss = trade.profitLoss || 0;
                            const daysToExpiration = calculateDaysToExpiration(trade.expirationDate, trade.closeTradeDate || undefined);
                            const percentGainLoss = getPercentGainLoss(trade);
                            const daysInTrade = trade.closeTradeDate ? calculateDaysInTrade(trade.openTradeDate, trade.closeTradeDate) : 0;
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
                                <td style={{ padding: '0.5rem', textAlign: 'right', color: '#999' }}>{daysToExpiration}</td>
                                <td style={{ padding: '0.5rem' }}>{formatDate(trade.openTradeDate)}</td>
                                <td style={{ padding: '0.5rem' }}>
                                  {trade.closeTradeDate ? formatDate(trade.closeTradeDate) : 'N/A'}
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{daysInTrade}</td>
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
                                <td
                                  style={{
                                    padding: '0.5rem',
                                    textAlign: 'right',
                                    fontWeight: 'bold',
                                    color: percentGainLoss >= 0 ? '#28a745' : '#dc3545',
                                  }}
                                >
                                  {percentGainLoss >= 0 ? '+' : ''}{percentGainLoss.toFixed(1)}%
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
