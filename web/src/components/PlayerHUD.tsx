import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';

// Match backend formula: BaseExpToLevel * (ExpScalingFactor ^ (level - 1))
const BASE_EXP = 100;
const EXP_SCALING = 1.15;

// XP needed to go from level to level+1
function getExpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(BASE_EXP * Math.pow(EXP_SCALING, level - 1));
}

// Total accumulated XP needed to reach a level (from level 1)
function getTotalExpForLevel(level: number): number {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += getExpForLevel(i);
  }
  return total;
}

export function PlayerHUD() {
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);
  const players = useGameStore((s) => s.players);
  const [showExpPercent, setShowExpPercent] = useState(false);
  const [showHpPercent, setShowHpPercent] = useState(false);

  const player = currentPlayerId ? players.get(currentPlayerId) : null;

  if (!player || player.type !== 'player') {
    return null;
  }

  const hp = player.hp ?? 100;
  const maxHp = player.maxHp ?? 100;
  const level = player.level ?? 1;
  const exp = player.exp ?? 0;
  const gold = player.gold ?? 0;

  // Total EXP needed to reach current level (from level 1)
  const totalExpToReachCurrentLevel = getTotalExpForLevel(level);
  // EXP needed to go from current level to next level
  const expNeededForNextLevel = getExpForLevel(level + 1);
  // How much EXP we have within the current level
  const expWithinLevel = exp - totalExpToReachCurrentLevel;
  // Calculate percentage and remaining
  const expPercent = expNeededForNextLevel > 0 ? Math.min(100, Math.max(0, (expWithinLevel / expNeededForNextLevel) * 100)) : 0;
  const expRemaining = Math.max(0, expNeededForNextLevel - expWithinLevel);
  const hpPercent = Math.min(100, (hp / maxHp) * 100);

  const avatarUrl = `https://unavatar.io/github/${player.githubLogin}?fallback=false`;

  return (
    <div
      style={{
        position: 'fixed',
        top: '175px',
        left: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px',
        zIndex: 100,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Avatar with Level Badge */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '6px',
            border: '2px solid rgba(180,190,200,0.6)',
            overflow: 'hidden',
            background: '#2a3040',
          }}
        >
          <img
            src={avatarUrl}
            alt={player.githubLogin}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        {/* Level Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, #4a5568 0%, #2d3748 100%)',
            border: '1px solid rgba(150,160,170,0.5)',
            borderRadius: '4px',
            padding: '1px 8px',
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
          }}
        >
          {level}
        </div>
      </div>

      {/* Bars Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
        {/* HP Bar */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          onMouseEnter={() => setShowHpPercent(true)}
          onMouseLeave={() => setShowHpPercent(false)}
        >
          <span
            style={{
              color: '#e57373',
              fontSize: '10px',
              fontWeight: 'bold',
              minWidth: '50px',
              textShadow: '0 1px 1px rgba(0,0,0,0.6)',
            }}
          >
            HP
          </span>
          <div
            style={{
              flex: 1,
              height: '12px',
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '2px',
              border: '1px solid rgba(60,60,60,0.6)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${hpPercent}%`,
                height: '100%',
                background: 'linear-gradient(180deg, #e57373 0%, #c62828 100%)',
                transition: 'width 0.3s ease',
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: '50%',
                right: '4px',
                transform: 'translateY(-50%)',
                color: '#fff',
                fontSize: '9px',
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0,0,0,1)',
              }}
            >
              {showHpPercent ? `${hpPercent.toFixed(0)}%` : `${hp}`}
            </span>
          </div>
        </div>

        {/* EXP Bar - shows level markers like Ragnarok */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          onMouseEnter={() => setShowExpPercent(true)}
          onMouseLeave={() => setShowExpPercent(false)}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '2px',
              minWidth: '50px',
            }}
          >
            <span
              style={{
                color: '#64b5f6',
                fontSize: '10px',
                fontWeight: 'bold',
                textShadow: '0 1px 1px rgba(0,0,0,0.6)',
              }}
            >
              BASE
            </span>
            <span
              style={{
                color: '#90caf9',
                fontSize: '11px',
                fontWeight: 'bold',
                textShadow: '0 1px 1px rgba(0,0,0,0.6)',
              }}
            >
              {level}
            </span>
          </div>
          <div
            style={{
              flex: 1,
              height: '12px',
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '2px',
              border: '1px solid rgba(60,60,60,0.6)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${expPercent}%`,
                height: '100%',
                background: 'linear-gradient(180deg, #64b5f6 0%, #1976d2 100%)',
                transition: 'width 0.3s ease',
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: '50%',
                right: '4px',
                transform: 'translateY(-50%)',
                color: '#fff',
                fontSize: '9px',
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0,0,0,1)',
              }}
            >
              {showExpPercent ? `${expPercent.toFixed(1)}%` : `${expRemaining}`}
            </span>
          </div>
        </div>

        {/* Gold */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              color: '#ffd54f',
              fontSize: '10px',
              fontWeight: 'bold',
              minWidth: '50px',
              textShadow: '0 1px 1px rgba(0,0,0,0.6)',
            }}
          >
            Gold
          </span>
          <span
            style={{
              color: '#ffd54f',
              fontSize: '11px',
              fontWeight: 'bold',
              textShadow: '0 1px 1px rgba(0,0,0,0.6)',
            }}
          >
            {gold.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
