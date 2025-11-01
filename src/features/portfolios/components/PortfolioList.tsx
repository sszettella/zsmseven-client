import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePortfolios, useDeletePortfolio, useSetDefaultPortfolio } from '../hooks/usePortfolios';
import { usePortfolioPositions } from '../hooks/usePositions';
import { usePortfolioYield } from '../hooks/usePortfolioYield';
import { formatDate } from '@/shared/utils/formatters';
import { formatCurrency } from '@/shared/utils/calculations';

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
        <span style={{ marginRight: '1rem' }}>
          <strong>{positionCount}</strong> {positionCount === 1 ? 'position' : 'positions'}
        </span>
        {totalValue > 0 && (
          <span>
            Total Value: <strong>{formatCurrency(totalValue)}</strong>
          </span>
        )}
      </div>
      {yieldMetrics && yieldMetrics.tradesCount > 0 && (
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e0e0e0' }}>
          <div style={{ marginBottom: '0.25rem' }}>
            <strong>Yield (Past 30 Days):</strong>{' '}
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
        </div>
      )}
    </div>
  );
};

// Component to aggregate metrics across all portfolios
const AggregatePortfolioSummary = ({ portfolioIds }: { portfolioIds: string[] }) => {
  if (portfolioIds.length === 0) {
    return null;
  }

  return (
    <div className="card" style={{
      backgroundColor: '#f8f9fa',
      border: '2px solid #007bff',
      marginBottom: '1.5rem'
    }}>
      <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#007bff' }}>
        Portfolio Summary
      </h2>
      <AggregateCalculator portfolioIds={portfolioIds} />
    </div>
  );
};

// Helper component that actually does the calculation
const AggregateCalculator = ({ portfolioIds }: { portfolioIds: string[] }) => {
  const positionsData = portfolioIds.map(id => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return usePortfolioPositions(id);
  });

  // Use useMemo to calculate stats only when the actual data changes
  const stats = useMemo(() => {
    let totalPositions = 0;
    let totalValue = 0;
    let loadedCount = 0;

    positionsData.forEach(({ data, isLoading }) => {
      if (!isLoading && data) {
        loadedCount++;
        totalPositions += data.length || 0;
        totalValue += data.reduce((sum, p) => sum + (p.marketValue || p.costBasis), 0) || 0;
      }
    });

    return { positions: totalPositions, value: totalValue, loaded: loadedCount };
  }, [positionsData.map(pd => `${pd.isLoading}-${pd.data?.length}-${pd.data?.reduce((s, p) => s + (p.marketValue || p.costBasis), 0)}`).join(',')]);

  const isLoading = stats.loaded < portfolioIds.length;

  return isLoading ? (
    <div style={{ color: '#666' }}>Loading aggregate data...</div>
  ) : (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
      <div>
        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
          Total Portfolios
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
          {portfolioIds.length}
        </div>
      </div>
      <div>
        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
          Total Positions
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
          {stats.positions}
        </div>
      </div>
      <div>
        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
          Total Value
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
          {formatCurrency(stats.value)}
        </div>
      </div>
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

  // Sort portfolios to show default first
  const sortedPortfolios = [...(portfolios || [])].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Portfolios</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/portfolios/new')}
        >
          Create Portfolio
        </button>
      </div>

      {/* Aggregate Summary across all portfolios */}
      <AggregatePortfolioSummary portfolioIds={sortedPortfolios?.map(p => p.id) || []} />

      <div style={{ display: 'grid', gap: '1rem' }}>
        {sortedPortfolios?.map((portfolio) => (
          <div key={portfolio.id} className="card">
            <>
                <div className="portfolio-card-content">
                  <div className="portfolio-card-main">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0 }}>
                        <Link
                          to={`/portfolios/${portfolio.id}`}
                          style={{ textDecoration: 'none', color: '#007bff' }}
                        >
                          {portfolio.name}
                        </Link>
                      </h3>
                      {portfolio.isDefault && (
                        <span className="portfolio-badge default-badge">
                          DEFAULT FOR TRADES
                        </span>
                      )}
                      {!portfolio.isActive && (
                        <span className="portfolio-badge inactive-badge">
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
                  <div className="portfolio-card-actions">
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

      {/* Mobile-responsive styles */}
      <style>{`
        .portfolio-card-content {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 1rem;
        }

        .portfolio-card-main {
          flex: 1;
          min-width: 0;
        }

        .portfolio-card-actions {
          display: flex;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .portfolio-badge {
          padding: 0.25rem 0.5rem;
          color: white;
          border-radius: 4px;
          fontSize: 0.75rem;
          font-weight: bold;
          white-space: nowrap;
        }

        .default-badge {
          background-color: #28a745;
        }

        .inactive-badge {
          background-color: #ffc107;
          color: #000;
        }

        @media (max-width: 768px) {
          .portfolio-card-content {
            flex-direction: column;
          }

          .portfolio-card-actions {
            width: 100%;
            flex-direction: column;
          }

          .portfolio-card-actions .btn {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .portfolio-badge {
            font-size: 0.65rem;
            padding: 0.2rem 0.4rem;
          }
        }
      `}</style>

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
