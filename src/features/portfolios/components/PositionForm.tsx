import { useState } from 'react';
import { Position, CreatePositionData, UpdatePositionData, formatTicker } from '@/types/position';
import { useCreatePosition, useUpdatePosition } from '../hooks/usePositions';

interface PositionFormProps {
  portfolioId: string;
  position?: Position;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PositionForm = ({ portfolioId, position, onSuccess, onCancel }: PositionFormProps) => {
  const { mutate: createPosition, isPending: isCreating } = useCreatePosition();
  const { mutate: updatePosition, isPending: isUpdating } = useUpdatePosition();

  const [formData, setFormData] = useState<CreatePositionData | UpdatePositionData>({
    ticker: position?.ticker || '',
    shares: position?.shares || 0,
    costBasis: position?.costBasis || 0,
    currentPrice: position?.currentPrice,
    notes: position?.notes || '',
  });

  // Store display value for cost basis to preserve commas
  const [costBasisDisplay, setCostBasisDisplay] = useState<string>(
    position?.costBasis ? position.costBasis.toString() : ''
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const isPending = isCreating || isUpdating;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.ticker) {
      newErrors.ticker = 'Ticker is required';
    } else if (formData.ticker.length > 10) {
      newErrors.ticker = 'Ticker must be 10 characters or less';
    }

    if (!formData.shares || formData.shares <= 0) {
      newErrors.shares = 'Shares must be greater than 0';
    }

    if (!formData.costBasis || formData.costBasis <= 0) {
      newErrors.costBasis = 'Cost basis must be greater than 0';
    }

    if (formData.currentPrice !== undefined && formData.currentPrice !== null && formData.currentPrice < 0) {
      newErrors.currentPrice = 'Current price must be 0 or greater';
    }

    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = 'Notes must be 1000 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Format ticker to uppercase
    const ticker = formatTicker(formData.ticker || '');

    if (position) {
      // Update existing position
      const updateData: UpdatePositionData = {
        ...formData,
        ticker,
      };
      updatePosition(
        { portfolioId, positionId: position.id, data: updateData },
        {
          onSuccess: () => {
            console.log('Position updated successfully');
            onSuccess();
          },
          onError: (error: any) => {
            console.error('Error updating position:', error);
            setErrors({ submit: error.response?.data?.error?.message || 'Failed to update position. Please try again.' });
          },
        }
      );
    } else {
      // Create new position - ensure required fields are present
      const createData: CreatePositionData = {
        ticker,
        shares: formData.shares || 0,
        costBasis: formData.costBasis || 0,
        currentPrice: formData.currentPrice !== null ? formData.currentPrice : undefined,
        notes: formData.notes,
      };
      createPosition(
        { portfolioId, data: createData },
        {
          onSuccess: () => {
            console.log('Position created successfully');
            onSuccess();
          },
          onError: (error: any) => {
            console.error('Error creating position:', error);
            setErrors({ submit: error.response?.data?.error?.message || 'Failed to create position. Please try again.' });
          },
        }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <label htmlFor="ticker" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Ticker Symbol *
          </label>
          <input
            id="ticker"
            type="text"
            value={formData.ticker}
            onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
            placeholder="AAPL"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
          {errors.ticker && <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>{errors.ticker}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label htmlFor="shares" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Shares *
            </label>
            <input
              id="shares"
              type="number"
              step="0.001"
              value={formData.shares || ''}
              onChange={(e) => setFormData({ ...formData, shares: parseFloat(e.target.value) })}
              placeholder="100"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
            {errors.shares && <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>{errors.shares}</span>}
          </div>

          <div>
            <label htmlFor="costBasis" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Cost Basis ($) *
            </label>
            <input
              id="costBasis"
              type="text"
              value={costBasisDisplay}
              onChange={(e) => {
                const value = e.target.value;
                setCostBasisDisplay(value);
                // Remove dollar signs and commas, then parse the number
                const numericValue = parseFloat(value.replace(/[$,]/g, ''));
                setFormData({ ...formData, costBasis: isNaN(numericValue) ? 0 : numericValue });
              }}
              placeholder="$15,000.00"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
            {errors.costBasis && <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>{errors.costBasis}</span>}
          </div>
        </div>

        <div>
          <label htmlFor="currentPrice" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Current Price ($)
            <span style={{ fontWeight: 400, color: '#666', marginLeft: '0.5rem' }}>(optional)</span>
          </label>
          <input
            id="currentPrice"
            type="number"
            step="0.01"
            value={formData.currentPrice || ''}
            onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="175.50"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
          {errors.currentPrice && <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>{errors.currentPrice}</span>}
        </div>

        <div>
          <label htmlFor="notes" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Notes
            <span style={{ fontWeight: 400, color: '#666', marginLeft: '0.5rem' }}>(optional)</span>
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Added during tech dip..."
            rows={3}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
          {errors.notes && <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>{errors.notes}</span>}
        </div>

        {errors.submit && (
          <div style={{ padding: '0.75rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
            {errors.submit}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isPending}
          >
            {isPending ? 'Saving...' : (position ? 'Update Position' : 'Add Position')}
          </button>
        </div>
      </div>
    </form>
  );
};
