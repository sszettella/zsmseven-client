import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePortfolios } from '../hooks/usePortfolios';
import { usePortfolioPositions } from '../hooks/usePositions';
import { usePortfolioYield } from '../hooks/usePortfolioYield';
import { useOpenTrades, useTrades } from '@/features/trades/hooks/useTrades';
import { TradeStatus, Trade } from '@/types/trade';
import { formatCurrency } from '@/shared/utils/calculations';

// Helper function to calculate win percentage
const getWinPercentage = (trades: Trade[]): number => {
  if (trades.length === 0) return 0;
  const winningTrades = trades.filter((trade) => (trade.profitLoss || 0) > 0).length;
  return (winningTrades / trades.length) * 100;
};

// Helper function to get trades closed in last 30 days
const getLast30DaysTrades = (trades: Trade[]): Trade[] => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return trades.filter((trade) => {
    if (!trade.closeTradeDate) return false;
    const closeDate = new Date(trade.closeTradeDate);
    return closeDate >= thirtyDaysAgo;
  });
};

// Helper function to calculate last 30 days P&L
const getLast30DaysPL = (trades: Trade[]): number => {
  const recentTrades = getLast30DaysTrades(trades);
  return recentTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
};

// Helper function to calculate average profit percentage for closed trades
const getAverageClosedProfitPercent = (trades: Trade[]): number => {
  if (trades.length === 0) return 0;

  const totalProfitPercent = trades.reduce((sum, trade) => {
    const openCost = Math.abs(trade.openTotalCost);
    if (openCost === 0) return sum;

    // Calculate actual profit/loss percentage based on closed trades
    const profitLoss = trade.profitLoss || 0;
    const percentChange = (profitLoss / openCost) * 100;
    return sum + percentChange;
  }, 0);

  return totalProfitPercent / trades.length;
};

// Component to fetch and display portfolio metrics
const PortfolioMetrics = ({ portfolioId }: { portfolioId: string }) => {
  const { data: positions, isLoading } = usePortfolioPositions(portfolioId);
  const yieldMetrics = usePortfolioYield(portfolioId);

  if (isLoading) {
    return <span style={{ color: '#999', fontSize: '0.875rem' }}>Loading...</span>;
  }

  const positionCount = positions?.length || 0;
  const totalValue = positions?.reduce((sum, p) => sum + (p.marketValue || p.costBasis), 0) || 0;

  return (
    <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
      <div style={{ marginBottom: '0.25rem' }}>
        <strong>{positionCount}</strong> {positionCount === 1 ? 'position' : 'positions'}
      </div>
      {totalValue > 0 && (
        <div style={{ marginBottom: '0.25rem' }}>
          Total Value: <strong>{formatCurrency(totalValue)}</strong>
        </div>
      )}
      {yieldMetrics && yieldMetrics.tradesCount > 0 && (
        <>
          <div style={{ marginBottom: '0.25rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e0e0e0' }}>
            <strong>Yield (Past 30 Days)</strong>
          </div>
          <div style={{ marginBottom: '0.25rem' }}>
            <span
              style={{
                fontWeight: 'bold',
                color: yieldMetrics.last30DaysYieldPercent >= 0 ? '#28a745' : '#dc3545',
              }}
            >
              {yieldMetrics.last30DaysYieldPercent >= 0 ? '+' : ''}
              {yieldMetrics.last30DaysYieldPercent.toFixed(2)}%
            </span>
            {' '}
            ({yieldMetrics.last30DaysYieldPercent >= 0 ? '+' : ''}
            {formatCurrency(yieldMetrics.last30DaysYieldDollar)})
          </div>
          <div style={{ fontSize: '0.75rem', color: '#999' }}>
            Annualized: {yieldMetrics.last30DaysAnnualizedYield >= 0 ? '+' : ''}
            {yieldMetrics.last30DaysAnnualizedYield.toFixed(2)}%
          </div>
        </>
      )}
    </div>
  );
};

export const Dashboard = () => {
  const { user } = useAuth();
  const { data: portfolios } = usePortfolios();
  const { data: openTrades } = useOpenTrades();
  const { data: allTrades } = useTrades();

  const closedTrades = allTrades?.filter((t) => t.status === TradeStatus.CLOSED) || [];
  const winRate = getWinPercentage(closedTrades);
  const winningTrades = closedTrades.filter((trade) => (trade.profitLoss || 0) > 0).length;
  const last30DaysPL = getLast30DaysPL(closedTrades);
  const avgClosedProfitPercent = getAverageClosedProfitPercent(closedTrades);

  const activePortfolios = portfolios?.filter(p => p.isActive).sort((a, b) => {
    // Sort default portfolio first
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    // Then sort alphabetically by name
    return a.name.localeCompare(b.name);
  }) || [];

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Welcome back, {user?.name}!</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Getting Started / Info - Only show if user has no portfolios or no trades */}
        {(activePortfolios.length === 0 || !allTrades || allTrades.length === 0) && (
          <div className="card" style={{ backgroundColor: '#f8f9fa' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Getting Started</h3>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Portfolios</strong>
                <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                  <Link to="/portfolios/new" style={{ color: '#007bff', textDecoration: 'none', fontWeight: '500' }}>Create a portfolio</Link> to track your stock and ETF positions with cost basis and current values.
                </p>
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Options Trades</strong>
                <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                  <Link to="/trades/new" style={{ color: '#007bff', textDecoration: 'none', fontWeight: '500' }}>Open a new position</Link> to track options trades. Optionally link them to portfolios for organization and portfolio-level metrics.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Options Trades Overview */}
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem' }}>Options Trades</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745', marginBottom: '0.25rem' }}>
            {openTrades?.length || 0}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
            Open
          </p>
          {closedTrades.length > 0 && (
            <>
              <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                Avg Profit %: <span style={{ fontWeight: 'bold', color: avgClosedProfitPercent >= 0 ? '#28a745' : '#dc3545' }}>
                  {avgClosedProfitPercent >= 0 ? '+' : ''}{avgClosedProfitPercent.toFixed(1)}%
                </span>
              </p>
              <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                Win Rate: <span style={{ fontWeight: 'bold', color: winRate >= 50 ? '#28a745' : '#dc3545' }}>
                  {winRate.toFixed(1)}%
                </span> ({winningTrades}/{closedTrades.length})
              </p>
              <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                Last 30 Days: <span style={{ fontWeight: 'bold', color: last30DaysPL >= 0 ? '#28a745' : '#dc3545' }}>
                  {last30DaysPL >= 0 ? '+' : ''}{formatCurrency(last30DaysPL)}
                </span>
              </p>
            </>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/trades/new" className="btn btn-primary" style={{ flex: 1 }}>
              Open New
            </Link>
            <Link to="/trades" className="btn btn-secondary" style={{ flex: 1 }}>
              View All
            </Link>
          </div>
        </div>

        {/* Portfolios Overview */}
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem' }}>Portfolios</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff', marginBottom: '0.5rem' }}>
            {activePortfolios.length}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
            Active portfolios tracking your equity positions
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/portfolios/new" className="btn btn-primary" style={{ flex: 1 }}>
              New
            </Link>
            <Link to="/portfolios" className="btn btn-secondary" style={{ flex: 1 }}>
              View All
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Portfolios */}
      {activePortfolios.length > 0 && (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Your Portfolios</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {activePortfolios.slice(0, 4).map((portfolio) => (
              <Link
                key={portfolio.id}
                to={`/portfolios/${portfolio.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="card"
                  style={{
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                >
                  <h4 style={{ marginBottom: '0.5rem', color: '#007bff' }}>{portfolio.name}</h4>
                  {portfolio.description && (
                    <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                      {portfolio.description.length > 80
                        ? portfolio.description.substring(0, 80) + '...'
                        : portfolio.description}
                    </p>
                  )}
                  <PortfolioMetrics portfolioId={portfolio.id} />
                  <div style={{ fontSize: '0.875rem', color: '#999', marginTop: '0.5rem' }}>
                    Click to view positions →
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {activePortfolios.length > 4 && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/portfolios" className="btn btn-secondary">
                View All {activePortfolios.length} Portfolios
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {activePortfolios.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Start Tracking Your Investments</h2>
          <p style={{ color: '#666', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Create your first portfolio to start tracking your stock and ETF positions with
            automatic unrealized P&L calculations. You can also track your options trades separately.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/portfolios/new" className="btn btn-primary">
              Create Your First Portfolio
            </Link>
            <Link to="/trades/new" className="btn btn-secondary">
              Or Track an Options Trade
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
