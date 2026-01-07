import { usePictureInPicture } from '../hooks/usePictureInPicture';

export function PiPButton() {
  const { isPiPActive, isPiPSupported, togglePiP } = usePictureInPicture();

  if (!isPiPSupported) {
    return null;
  }

  return (
    <button
      onClick={togglePiP}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: isPiPActive
          ? 'rgba(34, 197, 94, 0.3)'
          : 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.85) 100%)',
        backdropFilter: 'blur(8px)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s ease',
        zIndex: 1000,
      }}
      title={isPiPActive ? 'Exit Picture-in-Picture' : 'Enter Picture-in-Picture'}
    >
      {/* PiP Icon */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={isPiPActive ? '#22c55e' : 'rgba(255, 255, 255, 0.7)'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <rect x="12" y="9" width="8" height="6" rx="1" fill={isPiPActive ? '#22c55e' : 'rgba(255, 255, 255, 0.3)'} />
      </svg>
    </button>
  );
}
