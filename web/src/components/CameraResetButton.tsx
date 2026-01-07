import { useGameStore } from '../stores/gameStore';

export function CameraResetButton() {
  const cameraMode = useGameStore((s) => s.cameraMode);
  const setCameraMode = useGameStore((s) => s.setCameraMode);

  // Only show when in free mode
  if (cameraMode !== 'free') {
    return null;
  }

  return (
    <button
      onClick={() => setCameraMode('follow')}
      style={{
        position: 'fixed',
        bottom: '70px',
        right: '20px',
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.3) 100%)',
        backdropFilter: 'blur(8px)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s ease',
        zIndex: 1000,
      }}
      title="Travar câmera no personagem"
    >
      {/* Lock icon */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(255, 255, 255, 0.9)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </button>
  );
}
