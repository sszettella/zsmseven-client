import { Outlet } from 'react-router-dom';
import { Navigation } from '../Navigation/Navigation';

export const Layout = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navigation />
      <main style={{ flex: 1, padding: '20px' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
