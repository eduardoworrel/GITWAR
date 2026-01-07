import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useClerk, useAuth } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../stores/gameStore';
import type { InterpolatedPlayer } from '../stores/gameStore';
import { PlayerModal } from './PlayerModal';

function StatusDot({ status }: { status: string }) {
  const color = status === 'dead' ? '#f85149' : status === 'attacking' ? '#d29922' : '#238636';
  return (
    <span
      style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 4px ${color}`,
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}

interface AccordionSectionProps {
  title: string;
  badge?: string | number;
  badgeColor?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

function AccordionSection({ title, badge, badgeColor = '#238636', defaultExpanded = false, children }: AccordionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div style={{ borderBottom: '1px solid #30363d' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#c9d1d9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              transition: 'transform 0.2s',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              fontSize: '10px',
              color: '#8b949e',
            }}
          >
            ▶
          </span>
          <span style={{ fontWeight: 600, fontSize: '11px', color: '#8b949e' }}>
            {title}
          </span>
        </div>
        {badge !== undefined && (
          <span
            style={{
              background: `${badgeColor}33`,
              color: badgeColor,
              padding: '2px 6px',
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: 600,
            }}
          >
            {badge}
          </span>
        )}
      </button>
      <div
        style={{
          maxHeight: isExpanded ? '500px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-in-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function PlayerList() {
  const { t } = useTranslation();
  const players = useGameStore((s) => s.players);
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);
  const [selectedPlayer, setSelectedPlayer] = useState<InterpolatedPlayer | null>(null);
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();

  const playerList = Array.from(players.values())
    .filter((p) => p.type === 'player')
    .sort((a, b) => {
      const eloA = Number(a.elo) || 1000;
      const eloB = Number(b.elo) || 1000;
      return eloB - eloA;
    });

  // Current player or spectated player - always visible
  const activePlayer = currentPlayerId ? players.get(currentPlayerId) : null;
  const activePlayerRank = activePlayer ? playerList.findIndex(p => p.id === activePlayer.id) + 1 : 0;

  // Helper to render a player row
  const renderPlayerRow = (player: InterpolatedPlayer, index: number, isActive: boolean = false) => {
    const hpPct = Math.round((player.hp / player.maxHp) * 100);
    const isMe = player.id === currentPlayerId && isSignedIn;
    const isDead = player.estado === 'dead';

    return (
      <div
        key={player.id}
        onClick={() => setSelectedPlayer(player)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 8px',
          marginBottom: isActive ? '0' : '4px',
          background: isMe ? 'rgba(56, 139, 253, 0.1)' : isActive ? '#21262d' : '#161b22',
          borderRadius: '6px',
          border: isMe ? '1px solid rgba(56, 139, 253, 0.4)' : '1px solid #30363d',
          opacity: isDead ? 0.4 : 1,
          cursor: 'pointer',
        }}
      >
        {/* Rank */}
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '4px',
            background: index === 0 ? '#d29922' : index === 1 ? '#8b949e' : index === 2 ? '#a87232' : '#21262d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 700,
            color: index < 3 ? '#0d1117' : '#8b949e',
            flexShrink: 0,
          }}
        >
          {index + 1}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
            <StatusDot status={player.estado || 'idle'} />
            <span
              style={{
                fontWeight: isMe ? 600 : 400,
                fontSize: '11px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: '#c9d1d9',
              }}
            >
              {player.githubLogin}
            </span>
            {isMe && (
              <span style={{ fontSize: '8px', color: '#58a6ff', fontWeight: 600 }}>{t('ui.you')}</span>
            )}
            {!isSignedIn && isActive && (
              <span style={{ fontSize: '8px', color: '#238636', fontWeight: 600 }}>👁</span>
            )}
          </div>
          <div style={{ fontSize: '9px', color: '#8b949e', marginBottom: '3px' }}>
            {player.reino}
          </div>
          {/* HP Bar */}
          <div
            style={{
              height: '3px',
              backgroundColor: '#21262d',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${hpPct}%`,
                height: '100%',
                background: hpPct > 60 ? '#238636' : hpPct > 30 ? '#d29922' : '#f85149',
                transition: 'width 0.2s',
              }}
            />
          </div>
        </div>

        {/* ELO */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#d29922' }}>
            {player.elo ?? 1000}
          </div>
          <div style={{ fontSize: '9px', color: '#8b949e' }}>
            {player.vitorias ?? 0}/{player.derrotas ?? 0}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        width: '220px',
        background: '#0d1117',
        backdropFilter: 'blur(8px)',
        borderRadius: '6px',
        border: '1px solid #30363d',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        color: '#c9d1d9',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
        fontSize: '11px',
        zIndex: 1000,
        maxHeight: 'calc(100vh - 32px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Active Player - Always visible */}
      {activePlayer && activePlayer.type === 'player' && (
        <div style={{ padding: '8px', borderBottom: '1px solid #30363d' }}>
          {renderPlayerRow(activePlayer, activePlayerRank - 1, true)}
        </div>
      )}

      {/* Players Accordion */}
      <AccordionSection
        title={t('ui.players')}
        badge={playerList.length}
        badgeColor="#238636"
        defaultExpanded={false}
      >
        <div style={{ padding: '0 6px 6px 6px', overflowY: 'auto', maxHeight: '400px' }}>
          {playerList.map((player, index) => renderPlayerRow(player, index))}

          {playerList.length === 0 && (
            <div style={{ textAlign: 'center', color: '#8b949e', padding: '20px', fontSize: '11px' }}>
              {t('ui.noPlayers')}
            </div>
          )}
        </div>
      </AccordionSection>

      {/* Logout button */}
      {isSignedIn && (
        <div style={{ padding: '8px' }}>
          <button
            onClick={() => signOut()}
            style={{
              width: '100%',
              padding: '6px 12px',
              background: '#21262d',
              color: '#c9d1d9',
              border: '1px solid #30363d',
              borderRadius: '6px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            {t('auth.signOut')}
          </button>
        </div>
      )}

      {selectedPlayer && createPortal(
        <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />,
        document.body
      )}
    </div>
  );
}
