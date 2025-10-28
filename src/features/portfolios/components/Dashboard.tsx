import { Link } from 'react-router-dom';
import { usePortfolios } from '@/features/portfolios/hooks/usePortfolios';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const Dashboard = () => {
  const { user } = useAuth();
  const { data: portfolios } = usePortfolios();

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Welcome back, {user?.name}!</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem' }}>Portfolios</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff', marginBottom: '1rem' }}>
            {portfolios?.length || 0}
          </p>
          <Link to="/portfolios" className="btn btn-primary">
            Manage Portfolios
          </Link>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '0.5rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
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
