import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLogout } from '@/features/auth/hooks/useAuth';

export const Navigation = () => {
  const { user, isAdmin } = useAuth();
  const { mutate: logout } = useLogout();
  const location = useLocation();

  const isActive = (path: string) => {
    // Check if current path starts with the menu path
    // This handles nested routes like /trades/new, /trades/:id, etc.
    return location.pathname.startsWith(path) && path !== '/';
  };

  return (
    <nav
      style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        padding: '1rem 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      }}
    >
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', textDecoration: 'none', color: '#333' }}>
              ZSM Seven
            </Link>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Link to="/trades/new" className="btn btn-primary">
                Open New Trade
              </Link>
              <Link
                to="/trades"
                className={`nav-link ${isActive('/trades') ? 'active' : ''}`}
              >
                All Trades
              </Link>
              <Link
                to="/portfolios"
                className={`nav-link ${isActive('/portfolios') ? 'active' : ''}`}
              >
                Portfolios
              </Link>
              {isAdmin && (
                <Link
                  to="/admin/users"
                  className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                >
                  Users
                </Link>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link
              to="/profile"
              className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
            >
              {user?.name}
            </Link>
            <button onClick={() => logout()} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
