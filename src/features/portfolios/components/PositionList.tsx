import { useState } from 'react';
import { Position, calculateUnrealizedPLPercent } from '@/types/position';
import { formatCurrency } from '@/shared/utils/calculations';
import { PositionForm } from './PositionForm';

interface PositionListProps {
  portfolioId: string;
  positions: Position[];
  onDeletePosition?: (positionId: string) => void;
}

export const PositionList = ({ portfolioId, positions, onDeletePosition }: PositionListProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string>('ticker');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleDelete = (positionId: string, ticker: string) => {
    if (confirm(`Are you sure you want to delete position ${ticker}?`)) {
      onDeletePosition?.(positionId);
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIndicator = ({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) => (
    <span style={{ marginLeft: '0.25rem', fontSize: '0.75rem', opacity: active ? 1 : 0.3 }}>
      {direction === 'asc' ? '▲' : '▼'}
    </span>
  );

  const editingPosition = positions.find(p => p.id === editingId);

  // Helper to format currency without decimals
  const formatCurrencyNoDecimals = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Sort positions
  const sortedPositions = [...positions].sort((a, b) => {
    let aVal: any = a[sortKey as keyof Position];
    let bVal: any = b[sortKey as keyof Position];

    // Handle special calculated field
    if (sortKey === 'plPercent') {
      aVal = calculateUnrealizedPLPercent(a);
      bVal = calculateUnrealizedPLPercent(b);
    }

    // Handle undefined/null values
    if (aVal === undefined || aVal === null) aVal = 0;
    if (bVal === undefined || bVal === null) bVal = 0;

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

  // Calculate totals
  const totalCostBasis = positions.reduce((sum, p) => sum + p.costBasis, 0);
  const totalMarketValue = positions.reduce((sum, p) => sum + (p.marketValue || 0), 0);
  const totalUnrealizedPL = positions.reduce((sum, p) => sum + (p.unrealizedPL || 0), 0);
  const totalUnrealizedPLPercent = totalCostBasis > 0 ? (totalUnrealizedPL / totalCostBasis) * 100 : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Positions</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          Add Position
        </button>
      </div>

      {showCreateForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add New Position</h3>
          <PositionForm
            portfolioId={portfolioId}
            onSuccess={() => setShowCreateForm(false)}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {positions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            No positions yet. Start building your portfolio!
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            Add Your First Position
          </button>
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div className="card" style={{ marginBottom: '1rem', backgroundColor: '#f8f9fa' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Total Positions</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{positions.length}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Cost Basis</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrencyNoDecimals(totalCostBasis)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Market Value</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrencyNoDecimals(totalMarketValue)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Unrealized P&L</div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: totalUnrealizedPL >= 0 ? '#28a745' : '#dc3545'
                }}>
                  {totalUnrealizedPL >= 0 ? '+' : ''}{formatCurrencyNoDecimals(totalUnrealizedPL)}
                  <span style={{ fontSize: '1rem', marginLeft: '0.5rem' }}>
                    ({totalUnrealizedPLPercent >= 0 ? '+' : ''}{totalUnrealizedPLPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Positions Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                  <th
                    style={{ padding: '0.5rem', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('ticker')}
                  >
                    Ticker
                    <SortIndicator active={sortKey === 'ticker'} direction={sortDir} />
                  </th>
                  <th
                    style={{ padding: '0.5rem', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('shares')}
                  >
                    Shares
                    <SortIndicator active={sortKey === 'shares'} direction={sortDir} />
                  </th>
                  <th
                    style={{ padding: '0.5rem', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('currentPrice')}
                  >
                    Current Price
                    <SortIndicator active={sortKey === 'currentPrice'} direction={sortDir} />
                  </th>
                  <th
                    style={{ padding: '0.5rem', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('averageCost')}
                  >
                    Avg Cost
                    <SortIndicator active={sortKey === 'averageCost'} direction={sortDir} />
                  </th>
                  <th
                    style={{ padding: '0.5rem', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('costBasis')}
                  >
                    Cost Basis
                    <SortIndicator active={sortKey === 'costBasis'} direction={sortDir} />
                  </th>
                  <th
                    style={{ padding: '0.5rem', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('marketValue')}
                  >
                    Market Value
                    <SortIndicator active={sortKey === 'marketValue'} direction={sortDir} />
                  </th>
                  <th
                    style={{ padding: '0.5rem', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('unrealizedPL')}
                  >
                    Unrealized P&L
                    <SortIndicator active={sortKey === 'unrealizedPL'} direction={sortDir} />
                  </th>
                  <th
                    style={{ padding: '0.5rem', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('plPercent')}
                  >
                    % Gain/Loss
                    <SortIndicator active={sortKey === 'plPercent'} direction={sortDir} />
                  </th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPositions.map((position) => {
                  const plPercent = calculateUnrealizedPLPercent(position);

                  if (editingId === position.id && editingPosition) {
                    return (
                      <tr key={position.id}>
                        <td colSpan={9} style={{ padding: '0.5rem' }}>
                          <h4 style={{ marginBottom: '0.5rem' }}>Edit Position</h4>
                          <PositionForm
                            portfolioId={portfolioId}
                            position={editingPosition}
                            onSuccess={() => setEditingId(null)}
                            onCancel={() => setEditingId(null)}
                          />
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={position.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{position.ticker}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{Math.round(position.shares)}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        {position.currentPrice ? formatCurrency(position.currentPrice) : '-'}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(position.averageCost)}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrencyNoDecimals(position.costBasis)}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        {position.marketValue ? formatCurrencyNoDecimals(position.marketValue) : '-'}
                      </td>
                      <td style={{
                        padding: '0.5rem',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: (position.unrealizedPL || 0) >= 0 ? '#28a745' : '#dc3545'
                      }}>
                        {position.unrealizedPL ? (
                          <>
                            {position.unrealizedPL >= 0 ? '+' : ''}{formatCurrencyNoDecimals(position.unrealizedPL)}
                          </>
                        ) : '-'}
                      </td>
                      <td style={{
                        padding: '0.5rem',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: (plPercent || 0) >= 0 ? '#28a745' : '#dc3545'
                      }}>
                        {plPercent !== undefined ? (
                          <>{plPercent >= 0 ? '+' : ''}{plPercent.toFixed(1)}%</>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => setEditingId(position.id)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => handleDelete(position.id, position.ticker)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Notes section for positions with notes */}
          {positions.some(p => p.notes) && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Notes</h3>
              {positions.filter(p => p.notes).map(position => (
                <div key={position.id} style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                  <strong>{position.ticker}:</strong> {position.notes}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
