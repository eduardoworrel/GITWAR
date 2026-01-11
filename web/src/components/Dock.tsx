import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../stores/gameStore';
import { PlayerModal } from './PlayerModal';
import { CalendarModal } from './CalendarModal';
import { UserProfileModal } from './UserProfileModal';
import { ScriptEditorModal } from './ScriptEditorModal';

// SVG Icons
const DiscordIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const ShopIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const CompassIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
);

const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

interface DockItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}

function DockItem({ icon, label, onClick, href, disabled }: DockItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`dock-item ${disabled ? 'dock-item-disabled' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="dock-icon">
        {icon}
      </div>
      {isHovered && (
        <div className="dock-tooltip">
          {label}
        </div>
      )}
    </div>
  );
}

function DockSeparator() {
  return <div className="dock-separator" />;
}

export function Dock() {
  const { isSignedIn } = useAuth();
  const { t } = useTranslation();
  const [showShop, setShowShop] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showScriptEditor, setShowScriptEditor] = useState(false);

  const currentPlayerId = useGameStore((s) => s.currentPlayerId);
  const players = useGameStore((s) => s.players);
  const currentPlayer = currentPlayerId ? players.get(currentPlayerId) : null;

  // Don't show dock for spectators (not signed in)
  if (!isSignedIn) {
    return null;
  }

  return (
    <>
      <div className="dock-container">
        <div className="dock">
          {/* Future items (left side) */}
          <DockItem
            icon={<CompassIcon />}
            label={t('ui.comingSoon')}
            disabled
          />
          <DockItem
            icon={<UserIcon />}
            label={t('dock.profile')}
            onClick={() => setShowProfile(true)}
          />

          <DockSeparator />

          {/* Calendar */}
          <DockItem
            icon={<CalendarIcon />}
            label={t('dock.events')}
            onClick={() => setShowCalendar(true)}
          />

          {/* Shop */}
          <DockItem
            icon={<ShopIcon />}
            label={t('dock.shop')}
            onClick={() => setShowShop(true)}
          />

          {/* Script Editor */}
          <DockItem
            icon={<CodeIcon />}
            label={t('dock.script', 'Script')}
            onClick={() => setShowScriptEditor(true)}
          />

          <DockSeparator />

          {/* External links (right side) */}
          <DockItem
            icon={<GitHubIcon />}
            label="GitHub"
            href="https://github.com/eduardoworrel/GITWAR"
          />
          <DockItem
            icon={<DiscordIcon />}
            label={t('dock.discord')}
            href="https://discord.gg/bG2s53BcGh"
          />
        </div>
      </div>

      {/* Shop Modal (PlayerModal) */}
      {showShop && currentPlayer && createPortal(
        <PlayerModal
          player={currentPlayer}
          onClose={() => setShowShop(false)}
        />,
        document.body
      )}

      {/* Calendar Modal */}
      {showCalendar && createPortal(
        <CalendarModal onClose={() => setShowCalendar(false)} />,
        document.body
      )}

      {/* User Profile Modal */}
      {showProfile && currentPlayer && createPortal(
        <UserProfileModal
          username={currentPlayer.githubLogin}
          onClose={() => setShowProfile(false)}
        />,
        document.body
      )}

      {/* Script Editor Modal */}
      {showScriptEditor && currentPlayer && (
        <ScriptEditorModal
          reinoColor={getReinoColor(currentPlayer.reino)}
          onClose={() => setShowScriptEditor(false)}
        />
      )}
    </>
  );
}

// Helper to get reino color
const reinoColors: Record<string, string> = {
  Python: '#3776AB',
  JavaScript: '#F7DF1E',
  TypeScript: '#3178C6',
  Java: '#ED8B00',
  CSharp: '#239120',
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
};

function getReinoColor(reino: string): string {
  return reinoColors[reino] || '#888888';
}
