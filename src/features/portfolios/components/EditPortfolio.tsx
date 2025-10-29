import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePortfolio, useUpdatePortfolio } from '../hooks/usePortfolios';
import {
  usePortfolioPositions,
  useCreatePosition,
  useUpdatePosition,
  useDeletePosition,
} from '../hooks/usePositions';
import { CreatePositionData } from '@/types/position';

const portfolioSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

const positionSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required').max(10, 'Ticker is too long'),
  shares: z.number().positive('Shares must be greater than 0'),
  costBasis: z.number().positive('Cost basis must be greater than 0'),
  currentPrice: z.number().positive('Price must be greater than 0').optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
});

type PortfolioFormData = z.infer<typeof portfolioSchema>;
type PositionFormData = z.infer<typeof positionSchema>;

interface PositionInput extends Omit<CreatePositionData, 'currentPrice'> {
  id?: string; // Existing position ID (if editing existing position)
  currentPrice?: number | string;
  tempId: string; // Temporary ID for new positions
  isNew?: boolean; // Flag to indicate if this is a new position
}

export const EditPortfolio = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const navigate = useNavigate();

  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio(portfolioId!);
  const { data: existingPositions, isLoading: positionsLoading } = usePortfolioPositions(portfolioId!);
  const { mutate: updatePortfolio, isPending: isUpdatingPortfolio } = useUpdatePortfolio();
  const { mutate: createPosition } = useCreatePosition();
  const { mutate: updatePosition } = useUpdatePosition();
  const { mutate: deletePosition } = useDeletePosition();

  const [positions, setPositions] = useState<PositionInput[]>([]);
  const [deletedPositionIds, setDeletedPositionIds] = useState<string[]>([]);
  const [isAddingPosition, setIsAddingPosition] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);

  // Initialize positions from existing data
  useEffect(() => {
    if (existingPositions && positions.length === 0) {
      const mappedPositions: PositionInput[] = existingPositions.map((pos) => ({
        id: pos.id,
        ticker: pos.ticker,
        shares: pos.shares,
        costBasis: pos.costBasis,
        currentPrice: pos.currentPrice,
        notes: pos.notes,
        tempId: pos.id,
        isNew: false,
      }));
      setPositions(mappedPositions);
    }
  }, [existingPositions, positions.length]);

  const {
    register: registerPortfolio,
    handleSubmit: handleSubmitPortfolio,
    formState: { errors: portfolioErrors },
    reset: resetPortfolio,
  } = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
  });

  // Reset form when portfolio data loads
  useEffect(() => {
    if (portfolio) {
      resetPortfolio({
        name: portfolio.name,
        description: portfolio.description || '',
        isActive: portfolio.isActive,
        isDefault: portfolio.isDefault,
      });
    }
  }, [portfolio, resetPortfolio]);

  const {
    register: registerPosition,
    handleSubmit: handleSubmitPosition,
    formState: { errors: positionErrors },
    reset: resetPosition,
    setValue: setPositionValue,
  } = useForm<PositionFormData>({
    resolver: zodResolver(positionSchema),
  });

  const handleAddPosition = (data: PositionFormData) => {
    console.log('handleAddPosition called with:', data);
    console.log('editingPositionId:', editingPositionId);
    console.log('current positions:', positions);

    const newPosition: PositionInput = {
      ...data,
      ticker: data.ticker.toUpperCase(),
      currentPrice: data.currentPrice || undefined,
      tempId: editingPositionId || `temp-${Date.now()}`,
      isNew: !editingPositionId || editingPositionId.startsWith('temp-'),
    };

    console.log('newPosition created:', newPosition);

    if (editingPositionId) {
      // Update existing position in the list
      const updatedPositions = positions.map((p) =>
        p.tempId === editingPositionId
          ? { ...newPosition, id: p.id, isNew: p.isNew } // Preserve original id and isNew flag
          : p
      );
      console.log('Updated positions after edit:', updatedPositions);
      setPositions(updatedPositions);
      setEditingPositionId(null);
    } else {
      // Add new position
      const updatedPositions = [...positions, newPosition];
      console.log('Updated positions after add:', updatedPositions);
      setPositions(updatedPositions);
    }

    resetPosition();
    setIsAddingPosition(false);
  };

  const handleEditPosition = (position: PositionInput) => {
    setPositionValue('ticker', position.ticker);
    setPositionValue('shares', position.shares);
    setPositionValue('costBasis', position.costBasis);
    if (position.currentPrice) {
      setPositionValue('currentPrice', position.currentPrice as number);
    }
    setPositionValue('notes', position.notes || '');
    setEditingPositionId(position.tempId);
    setIsAddingPosition(true);
  };

  const handleRemovePosition = (position: PositionInput) => {
    // If it's an existing position, add to deleted list
    if (position.id && !position.isNew) {
      setDeletedPositionIds([...deletedPositionIds, position.id]);
    }
    // Remove from positions list
    setPositions(positions.filter((p) => p.tempId !== position.tempId));
  };

  const handleCancelAddPosition = () => {
    resetPosition();
    setIsAddingPosition(false);
    setEditingPositionId(null);
  };

  const onSubmit = async (data: PortfolioFormData) => {
    console.log('=== EditPortfolio Submit ===');
    console.log('Positions to process:', positions);
    console.log('Deleted position IDs:', deletedPositionIds);

    // Update portfolio first
    updatePortfolio(
      { id: portfolioId!, data },
      {
        onSuccess: async () => {
          // Handle position deletions
          const deletePromises = deletedPositionIds.map((id) => {
            console.log('Deleting position:', id);
            return new Promise((resolve, reject) => {
              deletePosition(id, { onSuccess: resolve, onError: reject });
            });
          });

          // Handle position updates and creations
          const positionPromises = positions.map((position) => {
            if (position.isNew || !position.id) {
              // Create new position
              console.log('Creating new position:', position);
              const positionData: CreatePositionData = {
                ticker: position.ticker,
                shares: position.shares,
                costBasis: position.costBasis,
                currentPrice: position.currentPrice ? Number(position.currentPrice) : undefined,
                notes: position.notes,
              };

              return new Promise((resolve, reject) => {
                createPosition(
                  { portfolioId: portfolioId!, data: positionData },
                  { onSuccess: resolve, onError: reject }
                );
              });
            } else {
              // Update existing position
              console.log('Updating existing position:', position);
              const positionData: CreatePositionData = {
                ticker: position.ticker,
                shares: position.shares,
                costBasis: position.costBasis,
                currentPrice: position.currentPrice ? Number(position.currentPrice) : undefined,
                notes: position.notes,
              };

              return new Promise((resolve, reject) => {
                updatePosition(
                  { positionId: position.id!, data: positionData },
                  {
                    onSuccess: (result) => {
                      console.log('Position updated successfully:', result);
                      resolve(result);
                    },
                    onError: (error) => {
                      console.error('Error updating position:', error);
                      reject(error);
                    },
                  }
                );
              });
            }
          });

          try {
            await Promise.all([...deletePromises, ...positionPromises]);
            navigate(`/portfolios/${portfolioId}`);
          } catch (error) {
            console.error('Error updating positions:', error);
            // Still navigate to the portfolio even if some operations failed
            navigate(`/portfolios/${portfolioId}`);
          }
        },
      }
    );
  };

  if (portfolioLoading || positionsLoading) {
    return <div className="loading">Loading portfolio...</div>;
  }

  if (!portfolio) {
    return <div>Portfolio not found</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Edit Portfolio</h1>

      <form onSubmit={handleSubmitPortfolio(onSubmit)}>
        {/* Portfolio Details */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Portfolio Details</h2>

          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Portfolio Name *
            </label>
            <input
              {...registerPortfolio('name')}
              type="text"
              id="name"
              className="form-control"
              placeholder="My Investment Portfolio"
            />
            {portfolioErrors.name && <p className="error-message">{portfolioErrors.name.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Description
            </label>
            <textarea
              {...registerPortfolio('description')}
              id="description"
              className="form-control"
              rows={3}
              placeholder="Optional description..."
            />
            {portfolioErrors.description && (
              <p className="error-message">{portfolioErrors.description.message}</p>
            )}
          </div>

          <div className="form-group">
            <label>
              <input {...registerPortfolio('isActive')} type="checkbox" style={{ marginRight: '0.5rem' }} />
              Active
            </label>
          </div>

          <div className="form-group">
            <label>
              <input {...registerPortfolio('isDefault')} type="checkbox" style={{ marginRight: '0.5rem' }} />
              Default for Options Trades
            </label>
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
              When creating trades, this portfolio will be selected by default
            </p>
          </div>
        </div>

        {/* Positions Section */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Positions</h2>
            {!isAddingPosition && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsAddingPosition(true)}
                style={{ fontSize: '0.875rem' }}
              >
                Add Position
              </button>
            )}
          </div>

          {positions.length === 0 && !isAddingPosition && (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              No positions in this portfolio. Click "Add Position" to add equity holdings.
            </p>
          )}

          {/* Position List */}
          {positions.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Ticker</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Shares</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Cost Basis</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Current Price</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Notes</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => (
                    <tr key={position.tempId} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>
                        {position.ticker}
                        {position.isNew && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#28a745' }}>
                            (New)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{position.shares}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>${position.costBasis.toFixed(2)}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        {position.currentPrice ? `$${Number(position.currentPrice).toFixed(2)}` : '-'}
                      </td>
                      <td style={{ padding: '0.5rem' }}>{position.notes || '-'}</td>
                      <td style={{ padding: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleEditPosition(position)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => handleRemovePosition(position)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add/Edit Position Form */}
          {isAddingPosition && (
            <div style={{ border: '1px solid #e0e0e0', padding: '1rem', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
              <h3 style={{ marginBottom: '1rem' }}>{editingPositionId ? 'Edit Position' : 'Add Position'}</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="ticker">
                    Ticker *
                  </label>
                  <input
                    {...registerPosition('ticker')}
                    type="text"
                    id="ticker"
                    className="form-control"
                    placeholder="AAPL"
                    style={{ textTransform: 'uppercase' }}
                  />
                  {positionErrors.ticker && <p className="error-message">{positionErrors.ticker.message}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="shares">
                    Shares *
                  </label>
                  <input
                    {...registerPosition('shares', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    id="shares"
                    className="form-control"
                    placeholder="100"
                  />
                  {positionErrors.shares && <p className="error-message">{positionErrors.shares.message}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="costBasis">
                    Cost Basis *
                  </label>
                  <input
                    {...registerPosition('costBasis', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    id="costBasis"
                    className="form-control"
                    placeholder="15000.00"
                  />
                  {positionErrors.costBasis && <p className="error-message">{positionErrors.costBasis.message}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="currentPrice">
                    Current Price
                  </label>
                  <input
                    {...registerPosition('currentPrice', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    id="currentPrice"
                    className="form-control"
                    placeholder="175.50"
                  />
                  {positionErrors.currentPrice && (
                    <p className="error-message">{positionErrors.currentPrice.message}</p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="notes">
                  Notes
                </label>
                <textarea
                  {...registerPosition('notes')}
                  id="notes"
                  className="form-control"
                  rows={2}
                  placeholder="Optional notes..."
                />
                {positionErrors.notes && <p className="error-message">{positionErrors.notes.message}</p>}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelAddPosition}
                  style={{ fontSize: '0.875rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmitPosition(handleAddPosition)}
                  style={{ fontSize: '0.875rem' }}
                >
                  {editingPositionId ? 'Update Position' : 'Add Position'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(`/portfolios/${portfolioId}`)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isUpdatingPortfolio}>
            {isUpdatingPortfolio ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
