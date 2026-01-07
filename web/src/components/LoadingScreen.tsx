import { useTranslation } from 'react-i18next';

interface LoadingScreenProps {
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  showLogout?: boolean;
  onLogout?: () => void;
}

export function LoadingScreen({ message, showRetry, onRetry, showLogout, onLogout }: LoadingScreenProps) {
  const { t } = useTranslation();
  const displayMessage = message || t('messages.loading');

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <h1 className="loading-title">GitWorld</h1>
        <div className="loading-spinner" />
        <p className="loading-message">{displayMessage}</p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          {showRetry && onRetry && (
            <button className="loading-retry" onClick={onRetry}>
              {t('messages.retry')}
            </button>
          )}
          {showLogout && onLogout && (
            <button
              className="loading-retry"
              onClick={onLogout}
              style={{ background: '#ef4444' }}
            >
              {t('messages.logout', 'Sair e tentar outra conta')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
