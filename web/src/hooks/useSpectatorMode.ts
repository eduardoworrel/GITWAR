import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';

export function useSpectatorMode(enabled: boolean) {
  const setCameraMode = useGameStore((s) => s.setCameraMode);
  const setCurrentPlayer = useGameStore((s) => s.setCurrentPlayer);

  useEffect(() => {
    if (enabled) {
      // Enable drone mode for spectators
      setCameraMode('drone');
      setCurrentPlayer(null);
    } else {
      // Return to follow mode when logged in
      setCameraMode('follow');
    }
  }, [enabled, setCameraMode, setCurrentPlayer]);

  return { isDroneMode: enabled };
}
