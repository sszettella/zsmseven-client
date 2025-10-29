import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePortfolio } from '../hooks/usePortfolios';
import { formatDate } from '@/shared/utils/formatters';
import { PositionList } from './PositionList';
import { Position } from '@/types/position';

export const PortfolioDetail = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio(portfolioId!);

  // TODO: Replace with actual API hook when positions API is implemented
  const [positions] = useState<Position[]>([
    // Mock data for demonstration
    {
      id: '1',
      portfolioId: portfolioId!,
      ticker: 'AAPL',
      shares: 100,
      costBasis: 15000,
      averageCost: 150,
      currentPrice: 175.50,
      marketValue: 17550,
      unrealizedPL: 2550,
      notes: 'Added during tech dip',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      portfolioId: portfolioId!,
      ticker: 'GOOGL',
      shares: 50,
      costBasis: 7000,
      averageCost: 140,
      currentPrice: 142.50,
      marketValue: 7125,
      unrealizedPL: 125,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const [showTradesSection, setShowTradesSection] = useState(false);

  if (portfolioLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!portfolio) {
    return <div>Portfolio not found</div>;
  }

  const handleDeletePosition = (positionId: string) => {
    // TODO: Implement delete position API call
    console.log('Delete position:', positionId);
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
          positions={positions}
          onDeletePosition={handleDeletePosition}
        />
      </div>

      {/* Associated Trades Section (Optional) */}
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

        {showTradesSection ? (
          <div>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Options trades can be associated with this portfolio for organizational purposes.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <Link
                to={`/trades?portfolioId=${portfolioId}`}
                className="btn btn-secondary"
              >
                View All Trades
              </Link>
              <Link
                to={`/trades/new?portfolioId=${portfolioId}`}
                className="btn btn-primary"
              >
                Open New Trade
              </Link>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#999' }}>
              Note: Trades are managed separately from portfolio positions. They can be optionally
              linked to portfolios for tracking purposes (e.g., covered calls on your stock positions).
            </div>
          </div>
        ) : (
          <p style={{ color: '#999', fontSize: '0.875rem', margin: 0 }}>
            Click "Show Trades" to view and manage options trades associated with this portfolio.
          </p>
        )}
      </div>
    </div>
  );
};
