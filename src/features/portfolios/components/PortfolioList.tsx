import { Link, useNavigate } from 'react-router-dom';
import { usePortfolios, useDeletePortfolio, useSetDefaultPortfolio } from '../hooks/usePortfolios';
import { usePortfolioPositions } from '../hooks/usePositions';
import { formatDate } from '@/shared/utils/formatters';
import { formatCurrency } from '@/shared/utils/calculations';

// Component to fetch and display portfolio metrics
const PortfolioMetrics = ({ portfolioId }: { portfolioId: string }) => {
  const { data: positions, isLoading } = usePortfolioPositions(portfolioId);

  if (isLoading) {
    return <span style={{ color: '#999', fontSize: '0.875rem' }}>Loading...</span>;
  }

  const positionCount = positions?.length || 0;
  const totalValue = positions?.reduce((sum, p) => sum + (p.marketValue || p.costBasis), 0) || 0;

  return (
    <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
      <span style={{ marginRight: '1rem' }}>
        <strong>{positionCount}</strong> {positionCount === 1 ? 'position' : 'positions'}
      </span>
      {totalValue > 0 && (
        <span>
          Total Value: <strong>{formatCurrency(totalValue)}</strong>
        </span>
      )}
    </div>
  );
};

export const PortfolioList = () => {
  const navigate = useNavigate();
  const { data: portfolios, isLoading, error } = usePortfolios();
  const { mutate: deletePortfolio } = useDeletePortfolio();
  const { mutate: setDefaultPortfolio } = useSetDefaultPortfolio();

  if (isLoading) return <div className="loading">Loading portfolios...</div>;
  if (error) return <div>Error loading portfolios</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>My Portfolios</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/portfolios/new')}
        >
          Create Portfolio
        </button>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {portfolios?.map((portfolio) => (
          <div key={portfolio.id} className="card">
            <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0 }}>
                        <Link
                          to={`/portfolios/${portfolio.id}`}
                          style={{ textDecoration: 'none', color: '#007bff' }}
                        >
                          {portfolio.name}
                        </Link>
                      </h3>
                      {portfolio.isDefault && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#28a745',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                        }}>
                          DEFAULT FOR TRADES
                        </span>
                      )}
                      {!portfolio.isActive && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#ffc107',
                          color: '#000',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                        }}>
                          INACTIVE
                        </span>
                      )}
                    </div>
                    {portfolio.description && (
                      <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                        {portfolio.description}
                      </p>
                    )}
                    <PortfolioMetrics portfolioId={portfolio.id} />
                    <p style={{ fontSize: '0.875rem', color: '#999', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                      Created: {formatDate(portfolio.createdAt)}
                    </p>
                    {!portfolio.isDefault && (
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => setDefaultPortfolio(portfolio.id)}
                      >
                        Set as Default for Trades
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate(`/portfolios/${portfolio.id}/edit`)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this portfolio?')) {
                          deletePortfolio(portfolio.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </>
          </div>
        ))}
      </div>

      {portfolios?.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            You don't have any portfolios yet.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/portfolios/new')}
          >
            Create Your First Portfolio
          </button>
        </div>
      )}
    </div>
  );
};
