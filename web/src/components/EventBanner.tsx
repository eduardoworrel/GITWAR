import { useGameStore } from '../stores/gameStore';
import type { EventType } from '../stores/gameStore';

// Event display info
const EVENT_INFO: Record<EventType, { icon: string; name: string; color: string }> = {
  none: { icon: '', name: '', color: '' },
  bugswarm: { icon: '🐛', name: 'Bug Swarm', color: '#8b4513' },
  intermediate: { icon: '🤖', name: 'AI Invasion', color: '#9932cc' },
  boss: { icon: '💀', name: 'Deploy de Final de Expediente', color: '#ff0000' },
};

export function EventBanner() {
  const activeEvent = useGameStore((s) => s.activeEvent);

  if (!activeEvent || activeEvent.type === 'none') {
    return null;
  }

  const info = EVENT_INFO[activeEvent.type];

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        borderRadius: '12px',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        zIndex: 1000,
        border: `2px solid ${info.color}`,
        boxShadow: `0 0 20px ${info.color}40`,
      }}
    >
      {/* Event icon with pulse animation */}
      <div
        style={{
          fontSize: '32px',
          animation: 'pulse 2s infinite',
        }}
      >
        {info.icon}
      </div>

      {/* Event info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div
          style={{
            color: info.color,
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          {info.name}
        </div>
        <div
          style={{
            color: '#aaa',
            fontSize: '14px',
          }}
        >
          {activeEvent.monstersRemaining} monstro{activeEvent.monstersRemaining !== 1 ? 's' : ''} restante{activeEvent.monstersRemaining !== 1 ? 's' : ''}
        </div>
      </div>

      {/* CSS for pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `}
      </style>
    </div>
  );
}
