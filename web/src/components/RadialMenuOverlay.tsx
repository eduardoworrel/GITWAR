import { useMemo, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';

interface RadialMenuButton {
  icon: string;
  label: string;
  onClick: () => void;
}

// This component renders outside the Canvas as a regular React component
// Position is updated directly via DOM by RadialMenuPositionCalculator in Scene.tsx
export function RadialMenuOverlay() {
  const selectedPlayer = useGameStore((s) => s.selectedPlayerForMenu);
  const setSelectedPlayerForMenu = useGameStore((s) => s.setSelectedPlayerForMenu);

  const buttons: RadialMenuButton[] = useMemo(() => {
    if (!selectedPlayer) return [];

    return [
      {
        icon: 'github',
        label: 'GitHub',
        onClick: () => {
          window.open(`https://github.com/${selectedPlayer.githubLogin}`, '_blank');
          setSelectedPlayerForMenu(null);
        },
      },
    ];
  }, [selectedPlayer, setSelectedPlayerForMenu]);

  const handleClose = useCallback(() => {
    setSelectedPlayerForMenu(null);
  }, [setSelectedPlayerForMenu]);

  // Arc layout
  const arcRadius = 50;
  const arcStartAngle = -Math.PI * 0.8;
  const arcEndAngle = -Math.PI * 0.2;
  const buttonCount = buttons.length;

  // Always render the container, position controlled by RadialMenuPositionCalculator via DOM
  return (
    <div
      id="radial-menu-overlay"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform: 'translate3d(0, 0, 0) translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 1000,
        opacity: 0,
        willChange: 'transform',
        backfaceVisibility: 'hidden',
      }}
    >
      {/* Arc path visualization */}
      <svg
        width="200"
        height="120"
        viewBox="-100 -100 200 120"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        <path
          d={describeArc(0, 0, arcRadius, arcStartAngle, arcEndAngle)}
          fill="none"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* Buttons along the arc */}
      {buttons.map((button, index) => {
        const angle = buttonCount === 1
          ? (arcStartAngle + arcEndAngle) / 2
          : arcStartAngle + (arcEndAngle - arcStartAngle) * (index / (buttonCount - 1));

        const x = Math.cos(angle) * arcRadius;
        const y = Math.sin(angle) * arcRadius;

        return (
          <button
            key={button.label}
            onClick={(e) => {
              e.stopPropagation();
              button.onClick();
            }}
            style={{
              position: 'absolute',
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: 'translate(-50%, -50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '2px solid rgba(255, 255, 255, 0.7)',
              background: 'rgba(20, 20, 20, 0.95)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
              transition: 'transform 0.15s ease, background 0.15s ease, border-color 0.15s ease',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.15)';
              e.currentTarget.style.background = 'rgba(40, 40, 40, 0.98)';
              e.currentTarget.style.borderColor = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
              e.currentTarget.style.background = 'rgba(20, 20, 20, 0.95)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.7)';
            }}
            title={button.label}
          >
            {button.icon === 'github' && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            )}
          </button>
        );
      })}

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '2px solid rgba(255, 100, 100, 0.7)',
          background: 'rgba(50, 20, 20, 0.95)',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          pointerEvents: 'auto',
          transition: 'transform 0.15s ease, background 0.15s ease',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
          e.currentTarget.style.background = 'rgba(80, 30, 30, 0.98)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
          e.currentTarget.style.background = 'rgba(50, 20, 20, 0.95)';
        }}
        title="Close"
      >
        ×
      </button>
    </div>
  );
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = {
    x: x + Math.cos(startAngle) * radius,
    y: y + Math.sin(startAngle) * radius,
  };
  const end = {
    x: x + Math.cos(endAngle) * radius,
    y: y + Math.sin(endAngle) * radius,
  };

  const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}
