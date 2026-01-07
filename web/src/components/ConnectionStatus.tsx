import { useTranslation } from 'react-i18next';
import { useGameStore } from '../stores/gameStore';

export function ConnectionStatus() {
  const { t } = useTranslation();
  const connectionStatus = useGameStore((s) => s.connectionStatus);
  const showReconnectedModal = useGameStore((s) => s.showReconnectedModal);
  const setShowReconnectedModal = useGameStore((s) => s.setShowReconnectedModal);

  // Reconnecting overlay
  if (connectionStatus === 'reconnecting') {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        gap: '20px',
      }}>
        {/* Spinner */}
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(255, 255, 255, 0.2)',
          borderTop: '4px solid #58a6ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />

        <div style={{
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
        }}>
          {t('connection.reconnecting')}
        </div>

        <div style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '14px',
        }}>
          {t('connection.reconnectingDesc')}
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Reconnected modal
  if (showReconnectedModal) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}>
        <div style={{
          backgroundColor: '#161b22',
          border: '1px solid #30363d',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '400px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}>
          {/* Success icon */}
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 20px',
            backgroundColor: '#238636',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <div style={{
            color: 'white',
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '12px',
          }}>
            {t('connection.reconnected')}
          </div>

          <div style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            marginBottom: '24px',
            lineHeight: '1.5',
          }}>
            {t('connection.reconnectedDesc')}
          </div>

          <button
            onClick={() => setShowReconnectedModal(false)}
            style={{
              backgroundColor: '#238636',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2ea043'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#238636'}
          >
            {t('connection.ok')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
