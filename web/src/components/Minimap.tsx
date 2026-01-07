import { useTranslation } from 'react-i18next';
import { useGameStore } from '../stores/gameStore';
import { MAP_WIDTH, MAP_HEIGHT } from '../three/constants';

// Proporção do mapa real: 5000 x 3000 (5:3)
const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 120;
const MINIMAP_HEADER_HEIGHT = 28;

const reinoColors: Record<string, string> = {
  Python: '#3776AB',
  JavaScript: '#F7DF1E',
  TypeScript: '#3178C6',
  Java: '#ED8B00',
  'C#': '#239120',
  Go: '#00ADD8',
  Rust: '#DEA584',
  Ruby: '#CC342D',
  PHP: '#777BB4',
  'C++': '#00599C',
  C: '#555555',
  Swift: '#FA7343',
  Kotlin: '#7F52FF',
  Shell: '#89E051',
  Scala: '#DC322F',
  IA: '#a855f7',
  NPC: '#ff4444',
};

function getColorForReino(reino: string): string {
  return reinoColors[reino] || '#888888';
}

export function Minimap() {
  const { t } = useTranslation();
  const players = useGameStore((s) => s.players);
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);
  const getInterpolatedPosition = useGameStore((s) => s.getInterpolatedPosition);
  const currentPlayerRotation = useGameStore((s) => s.currentPlayerRotation);

  const playerList = Array.from(players.values());

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        width: `${MINIMAP_WIDTH}px`,
        height: `${MINIMAP_HEIGHT + MINIMAP_HEADER_HEIGHT}px`,
        background: 'rgb(15, 23, 42)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        overflow: 'hidden',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '6px 10px',
          height: `${MINIMAP_HEADER_HEIGHT}px`,
          boxSizing: 'border-box',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          {t('ui.worldMap')}
        </span>
        <span
          style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '9px',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          {MAP_WIDTH / 1000}k x {MAP_HEIGHT / 1000}k
        </span>
      </div>

      {/* Map Area - Desk surface */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: `${MINIMAP_HEIGHT}px`,
          background: 'linear-gradient(135deg, #8B4513 0%, #6B3510 100%)',
        }}
      >
        {/* Monitor - posição: x=50% (2500/5000), y=20% (600/3000) */}
        <div
          style={{
            position: 'absolute',
            left: '38%',
            top: '12%',
            width: '24%',
            height: '20%',
            background: '#2a2a2a',
            borderRadius: '2px',
            boxShadow: 'inset 0 0 4px rgba(0,0,0,0.5)',
          }}
          title="Monitor"
        >
          {/* Tela do monitor */}
          <div
            style={{
              position: 'absolute',
              left: '8%',
              top: '12%',
              width: '84%',
              height: '70%',
              background: '#0d1b2a',
              borderRadius: '1px',
            }}
          />
        </div>
        {/* Stand do monitor */}
        <div
          style={{
            position: 'absolute',
            left: '48%',
            top: '32%',
            width: '4%',
            height: '8%',
            background: '#2a2a2a',
          }}
          title="Monitor Stand"
        />

        {/* Keyboard - posição: x=50% (2500/5000), y=47% (1400/3000) */}
        <div
          style={{
            position: 'absolute',
            left: '38%',
            top: '40%',
            width: '24%',
            height: '14%',
            background: '#1c1c1c',
            borderRadius: '2px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
          title="Keyboard"
        >
          {/* Teclas simplificadas */}
          <div
            style={{
              position: 'absolute',
              left: '5%',
              top: '15%',
              width: '90%',
              height: '70%',
              background: '#252525',
              borderRadius: '1px',
            }}
          />
        </div>

        {/* Mousepad - posição: x=61% (3050/5000), y=50% (1500/3000) */}
        <div
          style={{
            position: 'absolute',
            left: '57%',
            top: '33%',
            width: '18%',
            height: '27%',
            background: '#1a1a1a',
            borderRadius: '2px',
            border: '1px solid #2a2a2a',
          }}
          title="Mousepad"
        >
          {/* Mouse */}
          <div
            style={{
              position: 'absolute',
              left: '55%',
              top: '35%',
              width: '25%',
              height: '30%',
              background: '#111111',
              borderRadius: '40% 40% 50% 50%',
            }}
          />
        </div>

        {/* Player dots */}
        {playerList.map((player) => {
          const pos = getInterpolatedPosition(player.id);
          if (!pos) return null;

          const isCurrentPlayer = player.id === currentPlayerId;
          const isDead = player.estado === 'dead';
          const isNpc = player.type === 'npc';
          const isMonster = ['bug', 'aihallucination', 'manager', 'boss', 'unexplainedbug'].includes(player.type || '');

          // Convert world coordinates to minimap coordinates
          const mapX = (pos.x / MAP_WIDTH) * 100;
          const mapY = (pos.y / MAP_HEIGHT) * 100;

          const color = isMonster ? '#ff4444' : getColorForReino(isNpc ? 'NPC' : player.reino);
          const size = isCurrentPlayer ? 8 : isNpc || isMonster ? 4 : 6;

          // Convert rotation to degrees for CSS
          const rotationDeg = isCurrentPlayer
            ? 180 - (currentPlayerRotation * 180 / Math.PI)
            : 0;

          return (
            <div
              key={player.id}
              style={{
                position: 'absolute',
                left: `${mapX}%`,
                top: `${mapY}%`,
                transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`,
                width: `${size}px`,
                height: `${size}px`,
                opacity: isDead ? 0.3 : 1,
                transition: isCurrentPlayer ? 'none' : 'left 0.1s linear, top 0.1s linear',
                zIndex: isCurrentPlayer ? 10 : 1,
              }}
              title={`${player.githubLogin} (${player.reino})`}
            >
              {isCurrentPlayer ? (
                // Arrow/triangle for current player showing direction
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderBottom: `10px solid white`,
                  }}
                />
              ) : (
                // Simple dot for other players
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: isNpc || isMonster ? '1px' : '50%',
                    backgroundColor: color,
                    boxShadow: `0 0 3px ${color}`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
