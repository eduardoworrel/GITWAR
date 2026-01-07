import { useTranslation } from 'react-i18next';
import { useGameStore } from '../stores/gameStore';

export function SpectatorBanner() {
  const { t } = useTranslation();
  const cameraMode = useGameStore((s) => s.cameraMode);
  const players = useGameStore((s) => s.players);

  // Count active players (not NPCs or monsters)
  const playerCount = Array.from(players.values()).filter(
    (p) => p.type === 'player'
  ).length;

  const isDroneMode = cameraMode === 'drone';

  return (
    <div className="spectator-banner">
      <span className="spectator-icon">{isDroneMode ? '🎥' : '👁'}</span>
      <span className="spectator-text">
        {isDroneMode ? (
          <>
            {t('game.droneMode')} <strong>{playerCount} {t('game.playersOnline')}</strong>
          </>
        ) : (
          t('game.spectatorMode')
        )}
      </span>
    </div>
  );
}
