import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLogout } from '@/features/auth/hooks/useAuth';
import iconLogo from '@/assets/images/zsm-icon.svg';

export const Navigation = () => {
  const { user, isAdmin } = useAuth();
  const { mutate: logout } = useLogout();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    // Check if current path starts with the menu path
    // This handles nested routes like /trades/new, /trades/:id, etc.
    return location.pathname.startsWith(path) && path !== '/';
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav
      style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        padding: '0.5rem 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      }}
    >
      <div className="container">
        {/* Desktop Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flex: 1 }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src={iconLogo} alt="ZSM Properties" style={{ height: '40px', width: 'auto' }} />
            </Link>
            <div
              className="desktop-menu"
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
              }}
            >
              <Link to="/trades/new" className="btn btn-primary">
                Open New Trade
              </Link>
              <Link
                to="/trades"
                className={`nav-link ${isActive('/trades') ? 'active' : ''}`}
              >
                Trades
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
          <div
            className="desktop-menu"
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
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

          {/* Mobile Hamburger Menu */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
            }}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div
            className="mobile-menu"
            style={{
              display: 'none',
              flexDirection: 'column',
              gap: '0.5rem',
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e0e0e0',
            }}
          >
            <Link
              to="/trades/new"
              className="btn btn-primary"
              onClick={closeMobileMenu}
              style={{ width: '100%', textAlign: 'center' }}
            >
              Open New Trade
            </Link>
            <Link
              to="/trades"
              className={`nav-link ${isActive('/trades') ? 'active' : ''}`}
              onClick={closeMobileMenu}
              style={{ padding: '0.5rem', display: 'block' }}
            >
              Trades
            </Link>
            <Link
              to="/portfolios"
              className={`nav-link ${isActive('/portfolios') ? 'active' : ''}`}
              onClick={closeMobileMenu}
              style={{ padding: '0.5rem', display: 'block' }}
            >
              Portfolios
            </Link>
            {isAdmin && (
              <Link
                to="/admin/users"
                className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                onClick={closeMobileMenu}
                style={{ padding: '0.5rem', display: 'block' }}
              >
                Users
              </Link>
            )}
            <Link
              to="/profile"
              className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
              onClick={closeMobileMenu}
              style={{ padding: '0.5rem', display: 'block' }}
            >
              {user?.name}
            </Link>
            <button
              onClick={() => {
                logout();
                closeMobileMenu();
              }}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* CSS for responsive behavior */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-menu {
            display: none !important;
          }
          .mobile-menu-toggle {
            display: block !important;
          }
          .mobile-menu {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
};
