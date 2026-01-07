import { useAuth, useClerk, AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GameScene } from './three/Scene';
import { PlayerList } from './components/PlayerList';
import { Minimap } from './components/Minimap';
import { LoadingScreen } from './components/LoadingScreen';
import { SpectatorBanner } from './components/SpectatorBanner';
import { LoginBar } from './components/LoginBar';
import { EventBanner } from './components/EventBanner';
import { PiPButton } from './components/PiPButton';
import { CameraResetButton } from './components/CameraResetButton';
import { ConnectionStatus } from './components/ConnectionStatus';
import { Dock } from './components/Dock';
import { useGameStore } from './stores/gameStore';
import { useSpectatorMode } from './hooks/useSpectatorMode';
import { useS2Stream } from './hooks/useS2Stream';

function App() {
  const { t } = useTranslation();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { signOut } = useClerk();
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);
  const setCurrentPlayer = useGameStore((s) => s.setCurrentPlayer);

  // S2 stream - always active, never unmounted during login/logout
  useS2Stream({ enabled: true });

  const handleLogout = async () => {
    setJoinError(null);
    await signOut();
  };

  // Spectator mode: not signed in OR signed in but not yet joined
  const isSpectator = !isSignedIn;
  useSpectatorMode(isSpectator);

  useEffect(() => {
    // Don't retry if there's already an error (user must click retry manually)
    if (isSignedIn && !currentPlayerId && !isJoining && !joinError) {
      joinGame();
    }
  }, [isSignedIn, currentPlayerId, isJoining, joinError]);

  const joinGame = async () => {
    setIsJoining(true);
    setJoinError(null);
    try {
      const token = await getToken();
      const res = await fetch('/api/game/join', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        // Check if backend returned an i18n key
        if (errorData?.errorKey) {
          const translatedError = t(errorData.errorKey, { provider: errorData.provider || '' });
          throw new Error(translatedError);
        }
        throw new Error(errorData?.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.playerId) {
        setCurrentPlayer(data.playerId);
      }
    } catch (err) {
      console.error('Failed to join game:', err);
      setJoinError(err instanceof Error ? err.message : 'Failed to join game');
    }
    setIsJoining(false);
  };

  // Loading Clerk
  if (!isLoaded) {
    return <LoadingScreen message={t('messages.loading')} />;
  }

  // Handle OAuth callback
  if (window.location.pathname === '/sso-callback') {
    return <AuthenticateWithRedirectCallback />;
  }

  // Join error (only show if signed in)
  if (isSignedIn && joinError) {
    return (
      <LoadingScreen
        message={joinError}
        showRetry
        onRetry={joinGame}
        showLogout
        onLogout={handleLogout}
      />
    );
  }

  // Joining game (show loading only if signed in and joining)
  if (isSignedIn && (isJoining || !currentPlayerId)) {
    return <LoadingScreen message={t('messages.joiningGame')} />;
  }

  // Game scene - always show (spectator mode or in-game)
  return (
    <>
      <GameScene />
      <PlayerList />
      <Minimap />
      <PiPButton />
      <CameraResetButton />
      <EventBanner />
      {isSpectator && <SpectatorBanner />}
      {isSpectator && <LoginBar />}
      <Dock />
      <ConnectionStatus />
    </>
  );
}

export default App;
