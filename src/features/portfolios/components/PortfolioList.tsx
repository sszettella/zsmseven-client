import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortfolios, useDeletePortfolio, useSetDefaultPortfolio } from '../hooks/usePortfolios';
import { PortfolioForm } from './PortfolioForm';
import { formatDate } from '@/shared/utils/formatters';

export const PortfolioList = () => {
  const { data: portfolios, isLoading, error } = usePortfolios();
  const { mutate: deletePortfolio } = useDeletePortfolio();
  const { mutate: setDefaultPortfolio } = useSetDefaultPortfolio();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isLoading) return <div className="loading">Loading portfolios...</div>;
  if (error) return <div>Error loading portfolios</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>My Portfolios</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          Create Portfolio
        </button>
      </div>

      {showCreateForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Create New Portfolio</h3>
          <PortfolioForm
            onSuccess={() => setShowCreateForm(false)}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {portfolios?.map((portfolio) => (
          <div key={portfolio.id} className="card">
            {editingId === portfolio.id ? (
              <>
                <h3 style={{ marginBottom: '1rem' }}>Edit Portfolio</h3>
                <PortfolioForm
                  portfolio={portfolio}
                  onSuccess={() => setEditingId(null)}
                  onCancel={() => setEditingId(null)}
                />
              </>
            ) : (
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
                    <p style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.5rem' }}>
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
                      onClick={() => setEditingId(portfolio.id)}
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
            )}
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
            onClick={() => setShowCreateForm(true)}
          >
            Create Your First Portfolio
          </button>
        </div>
      )}
    </div>
  );
};
