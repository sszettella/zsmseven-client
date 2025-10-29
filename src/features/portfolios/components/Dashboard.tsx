import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useOpenTrades, useTrades } from '@/features/trades/hooks/useTrades';
import { TradeStatus, Trade } from '@/types/trade';
import { formatCurrency } from '@/shared/utils/calculations';

// Helper function to calculate win percentage
const getWinPercentage = (trades: any[]): number => {
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

export const Dashboard = () => {
  const { user } = useAuth();
  const { data: openTrades } = useOpenTrades();
  const { data: allTrades } = useTrades();

  const closedTrades = allTrades?.filter((t) => t.status === TradeStatus.CLOSED) || [];
  const winRate = getWinPercentage(closedTrades);
  const last30DaysTrades = getLast30DaysTrades(closedTrades);
  const last30DaysPL = getLast30DaysPL(closedTrades);

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Welcome back, {user?.name}!</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem' }}>Open Trades</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff', marginBottom: '0.5rem' }}>
            {openTrades?.length || 0}
          </p>
          {closedTrades.length > 0 && (
            <>
              <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                Win Rate: <span style={{ fontWeight: 'bold', color: winRate >= 50 ? '#28a745' : '#dc3545' }}>
                  {winRate.toFixed(1)}%
                </span>
              </p>
              <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                Last 30 Days: <span style={{ fontWeight: 'bold', color: last30DaysPL >= 0 ? '#28a745' : '#dc3545' }}>
                  {last30DaysPL >= 0 ? '+' : ''}{formatCurrency(last30DaysPL)}
                </span> ({last30DaysTrades.length} {last30DaysTrades.length === 1 ? 'trade' : 'trades'})
              </p>
            </>
          )}
          <Link to="/trades/new" className="btn btn-primary">
            Create New Trade
          </Link>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '0.5rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <Link to="/trades/new" className="btn btn-primary">
              Enter New Trade
            </Link>
            <Link to="/trades" className="btn btn-secondary">
              View All Trades
            </Link>
            <Link to="/portfolios" className="btn btn-secondary">
              View All Portfolios
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin/users" className="btn btn-secondary">
                Manage Users
              </Link>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '0.5rem' }}>Getting Started</h3>
          <ul style={{ marginLeft: '1.5rem', marginTop: '1rem', lineHeight: '1.8' }}>
            <li>Create a portfolio to organize your trades</li>
            <li>Add option trades with detailed information</li>
            <li>Track your performance over time</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
