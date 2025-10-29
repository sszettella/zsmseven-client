import { useNavigate } from 'react-router-dom';
import { PortfolioForm } from './PortfolioForm';

export const CreatePortfolio = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/portfolios');
  };

  const handleCancel = () => {
    navigate('/portfolios');
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Create New Portfolio</h1>
      <div className="card">
        <PortfolioForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
};
