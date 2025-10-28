import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLogout } from '@/features/auth/hooks/useAuth';

export const Navigation = () => {
  const { user, isAdmin } = useAuth();
  const { mutate: logout } = useLogout();

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
              Financial Tracker
            </Link>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/portfolios" style={{ textDecoration: 'none', color: '#666' }}>
                Portfolios
              </Link>
              {isAdmin && (
                <Link to="/admin/users" style={{ textDecoration: 'none', color: '#666' }}>
                  Users
                </Link>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ color: '#666' }}>{user?.name}</span>
            <button onClick={() => logout()} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
