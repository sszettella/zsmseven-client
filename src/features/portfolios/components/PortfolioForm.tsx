import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePortfolio, useUpdatePortfolio } from '../hooks/usePortfolios';
import { Portfolio } from '@/types/portfolio';

const portfolioSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

type PortfolioFormData = z.infer<typeof portfolioSchema>;

interface PortfolioFormProps {
  portfolio?: Portfolio;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PortfolioForm = ({ portfolio, onSuccess, onCancel }: PortfolioFormProps) => {
  const { mutate: createPortfolio, isPending: isCreating } = useCreatePortfolio();
  const { mutate: updatePortfolio, isPending: isUpdating } = useUpdatePortfolio();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: portfolio
      ? {
          name: portfolio.name,
          description: portfolio.description || '',
          isActive: portfolio.isActive,
          isDefault: portfolio.isDefault,
        }
      : {
          isActive: true,
          isDefault: false,
        },
  });

  const onSubmit = (data: PortfolioFormData) => {
    if (portfolio) {
      updatePortfolio(
        { id: portfolio.id, data },
        {
          onSuccess,
        }
      );
    } else {
      createPortfolio(data, {
        onSuccess,
      });
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="form-group">
        <label className="form-label" htmlFor="name">
          Portfolio Name *
        </label>
        <input
          {...register('name')}
          type="text"
          id="name"
          className="form-control"
          placeholder="My Investment Portfolio"
        />
        {errors.name && <p className="error-message">{errors.name.message}</p>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="description">
          Description
        </label>
        <textarea
          {...register('description')}
          id="description"
          className="form-control"
          rows={3}
          placeholder="Optional description..."
        />
        {errors.description && (
          <p className="error-message">{errors.description.message}</p>
        )}
      </div>

      <div className="form-group">
        <label>
          <input {...register('isActive')} type="checkbox" style={{ marginRight: '0.5rem' }} />
          Active
        </label>
      </div>

      <div className="form-group">
        <label>
          <input {...register('isDefault')} type="checkbox" style={{ marginRight: '0.5rem' }} />
          Default for Options Trades
        </label>
        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
          When creating trades, this portfolio will be selected by default
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Saving...' : portfolio ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};
