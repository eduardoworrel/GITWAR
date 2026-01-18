import { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import type { StreamInfo } from '../stores/gameStore';

const CYCLE_INTERVAL_MS = 20000; // 20 seconds
const FETCH_INTERVAL_MS = 30000; // Refresh player list every 30s

interface SpectatePlayer {
  playerId: string;
  entityId: string;
  githubLogin: string;
  reino: string;
  level: number;
  elo: number;
  x: number;
  y: number;
  stream: {
    streamName: string;
    basin: string;
    baseUrl: string;
    readToken: string;
  };
}

interface SpectatePlayersResponse {
  players: SpectatePlayer[];
}

export function useSpectatorMode(enabled: boolean) {
  const setCameraMode = useGameStore((s) => s.setCameraMode);
  const setCurrentPlayer = useGameStore((s) => s.setCurrentPlayer);
  const setStreamInfo = useGameStore((s) => s.setStreamInfo);

  const [spectatePlayers, setSpectatePlayers] = useState<SpectatePlayer[]>([]);
  const [currentSpectateIndex, setCurrentSpectateIndex] = useState(0);
  const [spectatePlayerName, setSpectatePlayerName] = useState<string | null>(null);

  const cycleIntervalRef = useRef<number | null>(null);
  const fetchIntervalRef = useRef<number | null>(null);
  const isEnabledRef = useRef(enabled);
  isEnabledRef.current = enabled;

  // Fetch online players for spectating
  const fetchSpectatePlayers = useCallback(async () => {
    if (!isEnabledRef.current) return;

    try {
      const response = await fetch('/api/game/spectate/players');
      if (!response.ok) {
        console.warn('[Spectator] Failed to fetch players:', response.status);
        return;
      }

      const data: SpectatePlayersResponse = await response.json();
      if (data.players && data.players.length > 0) {
        setSpectatePlayers(data.players);
        console.log(`[Spectator] Found ${data.players.length} online players`);
      } else {
        console.log('[Spectator] No online players found');
        setSpectatePlayers([]);
      }
    } catch (error) {
      console.error('[Spectator] Error fetching players:', error);
    }
  }, []);

  // Select a player to spectate
  const selectPlayer = useCallback((players: SpectatePlayer[], index: number) => {
    if (players.length === 0) return;

    const safeIndex = index % players.length;
    const player = players[safeIndex];

    console.log(`[Spectator] Following ${player.githubLogin} (${player.reino}) - stream: ${player.stream.streamName}`);

    // Set stream info so useS2Stream connects to this player's stream
    const streamInfo: StreamInfo = {
      streamName: player.stream.streamName,
      basin: player.stream.basin,
      baseUrl: player.stream.baseUrl,
      readToken: player.stream.readToken,
    };
    setStreamInfo(streamInfo);

    // Set current player for camera following
    setCurrentPlayer(player.entityId);
    setSpectatePlayerName(player.githubLogin);
  }, [setStreamInfo, setCurrentPlayer]);

  // Cycle to next player
  const cycleToNextPlayer = useCallback(() => {
    setCurrentSpectateIndex((prev) => {
      const nextIndex = prev + 1;
      return nextIndex;
    });
  }, []);

  // Effect: Apply player selection when index or players change
  useEffect(() => {
    if (enabled && spectatePlayers.length > 0) {
      selectPlayer(spectatePlayers, currentSpectateIndex);
    }
  }, [enabled, spectatePlayers, currentSpectateIndex, selectPlayer]);

  // Effect: Main spectator mode logic
  useEffect(() => {
    if (enabled) {
      // Enable drone mode for spectators
      setCameraMode('drone');

      // Fetch players immediately
      fetchSpectatePlayers();

      // Set up periodic fetch for player list
      fetchIntervalRef.current = window.setInterval(() => {
        fetchSpectatePlayers();
      }, FETCH_INTERVAL_MS);

      // Set up cycling interval
      cycleIntervalRef.current = window.setInterval(() => {
        cycleToNextPlayer();
      }, CYCLE_INTERVAL_MS);

    } else {
      // Cleanup when disabled
      setStreamInfo(null);
      setCurrentPlayer(null);
      setSpectatePlayerName(null);
      setSpectatePlayers([]);
      setCurrentSpectateIndex(0);
      setCameraMode('follow');
    }

    return () => {
      if (cycleIntervalRef.current) {
        clearInterval(cycleIntervalRef.current);
        cycleIntervalRef.current = null;
      }
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
        fetchIntervalRef.current = null;
      }
    };
  }, [enabled, setCameraMode, setCurrentPlayer, setStreamInfo, fetchSpectatePlayers, cycleToNextPlayer]);

  return {
    isDroneMode: enabled,
    spectatePlayerName,
    spectatePlayers,
    currentSpectateIndex: spectatePlayers.length > 0 ? currentSpectateIndex % spectatePlayers.length : 0,
  };
}
