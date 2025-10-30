import { useState } from 'react';
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

// Helper function to calculate days in trade for open positions (from open date to today)
const calculateDaysInOpenTrade = (openDate: string): number => {
  const open = new Date(openDate);
  open.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - open.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const TradeList = () => {
  const { data: trades, isLoading } = useTrades();
  const { canEditTrade, canDeleteTrade } = usePermissions();

  // Pagination state for closed trades
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Sorting state
  const [openTradesSortKey, setOpenTradesSortKey] = useState<string>('expirationDate');
  const [openTradesSortDir, setOpenTradesSortDir] = useState<'asc' | 'desc'>('asc');
  const [closedTradesSortKey, setClosedTradesSortKey] = useState<string>('closeTradeDate');
  const [closedTradesSortDir, setClosedTradesSortDir] = useState<'asc' | 'desc'>('desc');

  // Sorting handlers
  const handleOpenTradesSort = (key: string) => {
    if (openTradesSortKey === key) {
      setOpenTradesSortDir(openTradesSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setOpenTradesSortKey(key);
      setOpenTradesSortDir('asc');
    }
  };

  const handleClosedTradesSort = (key: string) => {
    if (closedTradesSortKey === key) {
      setClosedTradesSortDir(closedTradesSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setClosedTradesSortKey(key);
      setClosedTradesSortDir('asc');
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  // Sort indicator component
  const SortIndicator = ({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) => (
    <span style={{ marginLeft: '0.25rem', fontSize: '0.75rem', opacity: active ? 1 : 0.3 }}>
      {direction === 'asc' ? '▲' : '▼'}
    </span>
  );

  // Generic sort function
  const sortTrades = (tradesArray: Trade[], sortKey: string, sortDir: 'asc' | 'desc'): Trade[] => {
    return [...tradesArray].sort((a, b) => {
      let aVal: any = a[sortKey as keyof Trade];
      let bVal: any = b[sortKey as keyof Trade];

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

  if (isLoading) {
    return <div className="loading">Loading trades...</div>;
  }

  if (!trades || trades.length === 0) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>Trades</h1>
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

  const openTrades = sortTrades(
    trades.filter((t) => t.status === TradeStatus.OPEN),
    openTradesSortKey,
    openTradesSortDir
  );

  const closedTrades = sortTrades(
    trades.filter((t) => t.status === TradeStatus.CLOSED),
    closedTradesSortKey,
    closedTradesSortDir
  );

  // Pagination calculations
  const totalPages = Math.ceil(closedTrades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClosedTrades = closedTrades.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to closed trades section
    window.scrollTo({ top: document.getElementById('closed-trades-section')?.offsetTop || 0, behavior: 'smooth' });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Trades</h1>
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
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Portfolio</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Actions</th>
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
        <div id="closed-trades-section">
          <h2 style={{ marginBottom: '1rem' }}>Closed Positions</h2>
          <div className="card">
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
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Portfolio</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClosedTrades.map((trade) => (
                    <ClosedTradeRow
                      key={trade.id}
                      trade={trade}
                      canDelete={canDeleteTrade(trade.userId)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                borderTop: '1px solid #e0e0e0'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  Showing {startIndex + 1}-{Math.min(endIndex, closedTrades.length)} of {closedTrades.length} trades
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.875rem',
                      opacity: currentPage === 1 ? 0.5 : 1,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);

                    // Show ellipsis
                    const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                    const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;

                    if (showEllipsisBefore || showEllipsisAfter) {
                      return (
                        <span key={page} style={{ padding: '0.25rem 0.5rem', color: '#666' }}>
                          ...
                        </span>
                      );
                    }

                    if (!showPage) return null;

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={page === currentPage ? 'btn btn-primary' : 'btn btn-secondary'}
                        style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.875rem',
                          minWidth: '2rem'
                        }}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.875rem',
                      opacity: currentPage === totalPages ? 0.5 : 1,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
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

  const daysToExpiration = calculateDaysToExpiration(trade.expirationDate);
  const daysInTrade = calculateDaysInOpenTrade(trade.openTradeDate);
  const getDTEColor = (dte: number) => {
    if (dte < 0) return '#dc3545'; // Red - expired
    if (dte <= 7) return '#ff6b6b'; // Light red - expiring soon
    if (dte <= 30) return '#ffa500'; // Orange - expiring this month
    return '#666'; // Gray - normal
  };

  return (
    <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
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
      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatStrikePrice(trade.strikePrice)}</td>
      <td style={{ padding: '0.5rem' }}>{formatDate(trade.expirationDate)}</td>
      <td style={{ padding: '0.5rem', textAlign: 'right', color: getDTEColor(daysToExpiration), fontWeight: daysToExpiration <= 7 ? 'bold' : 'normal' }}>
        {daysToExpiration}
      </td>
      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{trade.openQuantity}</td>
      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(trade.openPremium)}</td>
      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
        {formatCurrency(trade.openTotalCost)}
      </td>
      <td style={{ padding: '0.5rem' }}>{formatDate(trade.openTradeDate)}</td>
      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{daysInTrade}</td>
      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
        {trade.portfolioId && (
          <Link
            to={`/portfolios/${trade.portfolioId}`}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            P
          </Link>
        )}
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
          {canEdit && (
            <Link
              to={`/trades/${trade.id}/edit`}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            >
              Edit
            </Link>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="btn btn-danger"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
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
      <td style={{ padding: '0.5rem', textAlign: 'right', color: '#999' }}>
        {daysToExpiration}
      </td>
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
      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
        {trade.portfolioId && (
          <Link
            to={`/portfolios/${trade.portfolioId}`}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            P
          </Link>
        )}
      </td>
      <td style={{ padding: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
          <Link to={`/trades/${trade.id}/view`}>
            <button
              className="btn btn-primary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            >
              Edit
            </button>
          </Link>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="btn btn-danger"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
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
