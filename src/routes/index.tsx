import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { AdminRoute } from '@/features/auth/components/AdminRoute';
import { Layout } from '@/shared/components/Layout/Layout';
import { Dashboard } from '@/features/portfolios/components/Dashboard';
import { PortfolioList } from '@/features/portfolios/components/PortfolioList';
import { PortfolioDetail } from '@/features/portfolios/components/PortfolioDetail';
import { CreatePortfolio } from '@/features/portfolios/components/CreatePortfolio';
import { TradeForm } from '@/features/trades/components/TradeForm';
import { TradeList } from '@/features/trades/components/TradeList';
import { CloseTradeForm } from '@/features/trades/components/CloseTradeForm';
import { ClosedTradeEditForm } from '@/features/trades/components/ClosedTradeEditForm';
import { UserList } from '@/features/users/components/UserList';
import { Profile } from '@/features/users/components/Profile';
import { useTrade } from '@/features/trades/hooks/useTrades';

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
            path: 'new',
            element: <CreatePortfolio />,
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
        path: 'trades',
        children: [
          {
            index: true,
            element: <TradeListWrapper />,
          },
          {
            path: 'new',
            element: <StandaloneTradeFormWrapper />,
          },
          {
            path: ':tradeId/edit',
            element: <StandaloneTradeFormWrapper isEdit />,
          },
          {
            path: ':tradeId/close',
            element: <CloseTradeFormWrapper />,
          },
          {
            path: ':tradeId/view',
            element: <ClosedTradeEditFormWrapper />,
          },
        ],
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'admin/users',
        element: (
          <AdminRoute>
            <UserList />
          </AdminRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

// Wrapper components to handle params
function TradeFormWrapper({ isEdit }: { isEdit?: boolean }) {
  const { portfolioId, tradeId } = useParams<{ portfolioId: string; tradeId?: string }>();
  const { data: trade } = useTrade(tradeId!, { enabled: isEdit && !!tradeId });

  if (isEdit && !trade) {
    return <div className="loading">Loading trade...</div>;
  }

  return <TradeForm portfolioId={portfolioId} trade={isEdit ? trade : undefined} />;
}

function TradeListWrapper() {
  return <TradeList />;
}

function StandaloneTradeFormWrapper({ isEdit }: { isEdit?: boolean }) {
  const { tradeId } = useParams<{ tradeId?: string }>();
  const { data: trade } = useTrade(tradeId!, { enabled: isEdit && !!tradeId });

  if (isEdit && !trade) {
    return <div className="loading">Loading trade...</div>;
  }

  return <TradeForm trade={isEdit ? trade : undefined} />;
}

function CloseTradeFormWrapper() {
  const { tradeId } = useParams<{ tradeId: string }>();
  const { data: trade } = useTrade(tradeId!);

  if (!trade) {
    return <div className="loading">Loading trade...</div>;
  }

  return <CloseTradeForm trade={trade} />;
}

function ClosedTradeEditFormWrapper() {
  const { tradeId } = useParams<{ tradeId: string }>();
  const { data: trade } = useTrade(tradeId!);

  if (!trade) {
    return <div className="loading">Loading trade...</div>;
  }

  return <ClosedTradeEditForm trade={trade} />;
}
