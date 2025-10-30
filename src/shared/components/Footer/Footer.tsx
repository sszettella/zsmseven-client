export const Footer = () => {
  const version = import.meta.env.VITE_APP_VERSION || '1.0.0';
  const buildNumber = import.meta.env.VITE_BUILD_NUMBER || 'dev';

  return (
    <footer
      style={{
        padding: '1rem',
        textAlign: 'center',
        borderTop: '1px solid #e0e0e0',
        backgroundColor: '#f5f5f5',
        fontSize: '0.875rem',
        color: '#666',
      }}
    >
      <div>
        ZSM7 v{version} | Build #{buildNumber}
      </div>
    </footer>
  );
};
