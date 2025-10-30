import { usePortfolios, useDefaultPortfolio } from '../hooks/usePortfolios';

interface PortfolioSelectorProps {
  value?: string;
  onChange: (portfolioId: string | undefined) => void;
  allowNone?: boolean;
  label?: string;
  helpText?: string;
  autoSelectDefault?: boolean;
}

export const PortfolioSelector = ({
  value,
  onChange,
  allowNone = true,
  label = 'Portfolio',
  helpText = 'Optionally associate this trade with a portfolio for organization',
  autoSelectDefault = true,
}: PortfolioSelectorProps) => {
  const { data: portfolios, isLoading } = usePortfolios();
  const { data: defaultPortfolio } = useDefaultPortfolio();

  // Auto-select default portfolio if no value is set (only if autoSelectDefault is true)
  const effectiveValue = value || (autoSelectDefault ? defaultPortfolio?.id : undefined) || '';

  const activePortfolios = portfolios?.filter((p) => p.isActive) || [];

  if (isLoading) {
    return (
      <div className="form-group">
        <label className="form-label">{label}</label>
        <select className="form-control" disabled>
          <option>Loading portfolios...</option>
        </select>
      </div>
    );
  }

  return (
    <div className="form-group">
      <label className="form-label" htmlFor="portfolioId">
        {label}
        {!allowNone && ' *'}
      </label>
      <select
        id="portfolioId"
        className="form-control"
        value={effectiveValue}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        {allowNone && <option value="">None (unassigned)</option>}
        {activePortfolios.map((portfolio) => (
          <option key={portfolio.id} value={portfolio.id}>
            {portfolio.name}
            {portfolio.isDefault && ' (Default)'}
          </option>
        ))}
      </select>
      {helpText && (
        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
          {helpText}
        </p>
      )}
      {autoSelectDefault && defaultPortfolio && !value && (
        <p style={{ fontSize: '0.875rem', color: '#28a745', marginTop: '0.25rem' }}>
          Using default portfolio: <strong>{defaultPortfolio.name}</strong>
        </p>
      )}
    </div>
  );
};
