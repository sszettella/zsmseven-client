import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { AdminRoute } from '@/features/auth/components/AdminRoute';
import { Layout } from '@/shared/components/Layout/Layout';
import { Dashboard } from '@/features/portfolios/components/Dashboard';
import { PortfolioList } from '@/features/portfolios/components/PortfolioList';
import { PortfolioDetail } from '@/features/portfolios/components/PortfolioDetail';
import { TradeForm } from '@/features/trades/components/TradeForm';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginForm />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'portfolios',
        children: [
          {
            index: true,
            element: <PortfolioList />,
          },
          {
            path: ':portfolioId',
            element: <PortfolioDetail />,
          },
          {
            path: ':portfolioId/trades/new',
            element: <TradeFormWrapper />,
          },
          {
            path: ':portfolioId/trades/:tradeId/edit',
            element: <TradeFormWrapper isEdit />,
          },
        ],
      },
      {
        path: 'admin',
        element: (
          <AdminRoute>
            <div>Admin Area</div>
          </AdminRoute>
        ),
        children: [
          {
            path: 'users',
            element: <div className="card"><h2>User Management</h2><p>User management interface coming soon...</p></div>,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

// Wrapper components to handle params
import { useParams } from 'react-router-dom';
import { useTrade } from '@/features/trades/hooks/useTrades';

function TradeFormWrapper({ isEdit }: { isEdit?: boolean }) {
  const { portfolioId, tradeId } = useParams<{ portfolioId: string; tradeId?: string }>();
  const { data: trade } = useTrade(portfolioId!, tradeId!, { enabled: isEdit && !!tradeId });

  if (isEdit && !trade) {
    return <div className="loading">Loading trade...</div>;
  }

  return <TradeForm portfolioId={portfolioId!} trade={isEdit ? trade : undefined} />;
}
