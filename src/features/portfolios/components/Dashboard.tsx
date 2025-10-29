import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useOpenTrades, useTrades } from '@/features/trades/hooks/useTrades';
import { TradeStatus } from '@/types/trade';

// Helper function to calculate win percentage
const getWinPercentage = (trades: any[]): number => {
  if (trades.length === 0) return 0;
  const winningTrades = trades.filter((trade) => (trade.profitLoss || 0) > 0).length;
  return (winningTrades / trades.length) * 100;
};

export const Dashboard = () => {
  const { user } = useAuth();
  const { data: openTrades } = useOpenTrades();
  const { data: allTrades } = useTrades();

  const closedTrades = allTrades?.filter((t) => t.status === TradeStatus.CLOSED) || [];
  const winRate = getWinPercentage(closedTrades);

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
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
              Win Rate: <span style={{ fontWeight: 'bold', color: winRate >= 50 ? '#28a745' : '#dc3545' }}>
                {winRate.toFixed(1)}%
              </span>
            </p>
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
