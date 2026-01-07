import { useEffect, useRef, useCallback } from 'react';
import { S2 } from '@s2-dev/streamstore';
import { useGameStore } from '../stores/gameStore';
import type { Player, CombatEvent, CombatEventType, EntityType, EventType } from '../stores/gameStore';

// S2 Configuration from environment
const S2_TOKEN = import.meta.env.VITE_S2_READ_TOKEN;
const S2_BASIN = import.meta.env.VITE_S2_BASIN || 'gitworld';
const S2_STREAM = import.meta.env.VITE_S2_STREAM || 'game-state';

interface EquippedItemPayload {
  name: string;
  category: string;
  tier: string;
}

interface EntityPayload {
  id: string;
  login?: string;
  githubLogin?: string;
  x: number;
  y: number;
  hp?: number;
  currentHp?: number;
  hpMax?: number;
  maxHp?: number;
  estado?: string;
  state?: string;
  reino: string;
  type?: string;
  alvoId?: string;
  velocidadeAtaque?: number;
  elo?: number;
  vitorias?: number;
  derrotas?: number;
  dano?: number;
  critico?: number;
  evasao?: number;
  armadura?: number;
  velocidadeMovimento?: number;
  equippedItems?: EquippedItemPayload[] | null;
}

interface EventPayload {
  type: string;
  tick: number;
  timestamp: number;
  attackerId: string;
  attackerName: string;
  targetId: string;
  targetName: string;
  damage?: number;
  isCritical?: boolean;
}

interface ActiveEventPayload {
  type: string;
  monstersRemaining: number;
}

interface GameStatePayload {
  tick: number;
  timestamp?: number;
  serverVersion?: string;
  entidades?: EntityPayload[];
  entities?: EntityPayload[];
  eventos?: EventPayload[];
  activeEvent?: ActiveEventPayload | null;
}

interface UseS2StreamOptions {
  enabled?: boolean;
}

let eventIdCounter = 0;

export function useS2Stream(options: UseS2StreamOptions = {}) {
  const { enabled = true } = options;

  // Store selectors
  const setPlayers = useGameStore((s) => s.setPlayers);
  const addCombatEvents = useGameStore((s) => s.addCombatEvents);
  const clearOldEvents = useGameStore((s) => s.clearOldEvents);
  const setActiveEvent = useGameStore((s) => s.setActiveEvent);
  const setConnectionStatus = useGameStore((s) => s.setConnectionStatus);
  const setShowReconnectedModal = useGameStore((s) => s.setShowReconnectedModal);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const cleanupIntervalRef = useRef<number | null>(null);
  const heartbeatCheckRef = useRef<number | null>(null);
  const lastMessageTimeRef = useRef<number>(Date.now());
  const wasDisconnectedRef = useRef(false);
  const isConnectingRef = useRef(false);
  const hasEverConnectedRef = useRef(false);

  // Entity type parser
  const parseEntityType = useCallback((typeStr?: string): EntityType => {
    const type = typeStr?.toLowerCase();
    if (type === 'npc') return 'npc';
    if (type === 'bug') return 'bug';
    if (type === 'aihallucination') return 'aihallucination';
    if (type === 'manager') return 'manager';
    if (type === 'boss') return 'boss';
    if (type === 'unexplainedbug') return 'unexplainedbug';
    return 'player';
  }, []);

  // Process entities
  const processEntities = useCallback((entities: EntityPayload[]) => {
    if (entities.length === 0) return;

    const players: Player[] = entities.map((e) => ({
      id: e.id,
      githubLogin: e.login || e.githubLogin || 'Unknown',
      x: e.x,
      y: e.y,
      hp: e.hp ?? e.currentHp ?? 100,
      maxHp: e.hpMax ?? e.maxHp ?? 100,
      reino: e.reino,
      type: parseEntityType(e.type),
      estado: e.estado || e.state || 'idle',
      velocidadeAtaque: e.velocidadeAtaque ?? 50,
      elo: e.elo ?? 1000,
      vitorias: e.vitorias ?? 0,
      derrotas: e.derrotas ?? 0,
      dano: e.dano ?? 20,
      critico: e.critico ?? 10,
      evasao: e.evasao ?? 5,
      armadura: e.armadura ?? 10,
      velocidadeMovimento: e.velocidadeMovimento ?? 50,
      equippedItems: e.equippedItems ?? undefined,
    }));

    setPlayers(players);
  }, [setPlayers, parseEntityType]);

  // Process events
  const processEvents = useCallback((events: EventPayload[]) => {
    if (!events || events.length === 0) return;

    const combatEvents: CombatEvent[] = events.map((e) => ({
      id: `${e.tick}-${e.attackerId}-${e.targetId}-${eventIdCounter++}`,
      type: e.type as CombatEventType,
      tick: e.tick,
      timestamp: e.timestamp,
      attackerId: e.attackerId,
      attackerName: e.attackerName,
      targetId: e.targetId,
      targetName: e.targetName,
      damage: e.damage,
      isCritical: e.isCritical,
      createdAt: Date.now(),
    }));

    addCombatEvents(combatEvents);
  }, [addCombatEvents]);

  // Process payload
  const processPayload = useCallback((payload: GameStatePayload) => {
    lastMessageTimeRef.current = Date.now();

    const entities = payload.entidades || payload.entities || [];
    processEntities(entities);

    if (payload.eventos && payload.eventos.length > 0) {
      processEvents(payload.eventos);
    }

    if (payload.activeEvent) {
      setActiveEvent({
        type: payload.activeEvent.type as EventType,
        monstersRemaining: payload.activeEvent.monstersRemaining,
      });
    } else {
      setActiveEvent(null);
    }
  }, [processEntities, processEvents, setActiveEvent]);

  // Handle connection success
  const handleConnected = useCallback(() => {
    if (wasDisconnectedRef.current && hasEverConnectedRef.current) {
      wasDisconnectedRef.current = false;
      setTimeout(() => {
        setConnectionStatus('connected');
        setShowReconnectedModal(true);
      }, 500);
    } else {
      setConnectionStatus('connected');
      setTimeout(() => {
        hasEverConnectedRef.current = true;
      }, 2000);
    }
    isConnectingRef.current = false;
  }, [setConnectionStatus, setShowReconnectedModal]);

  // Handle disconnection
  const handleDisconnected = useCallback(() => {
    if (!wasDisconnectedRef.current) {
      wasDisconnectedRef.current = true;
      setConnectionStatus('reconnecting');
    }
    isConnectingRef.current = false;
  }, [setConnectionStatus]);

  /**
   * Connect directly to S2 using the TypeScript SDK
   * No proxy needed - browser reads directly from S2 with read-only token
   */
  const connectToS2 = useCallback(async () => {
    if (isConnectingRef.current) return;

    if (!S2_TOKEN) {
      await connectViaProxy();
      return;
    }

    isConnectingRef.current = true;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const s2 = new S2({ accessToken: S2_TOKEN });
      const basin = s2.basin(S2_BASIN);
      const stream = basin.stream(S2_STREAM);
      const readSession = await stream.readSession({
        start: { from: { tailOffset: 1 }, clamp: true },
      });

      handleConnected();

      try {
        for await (const record of readSession) {
          try {
            let jsonStr: string;
            if (typeof record.body === 'string') {
              try {
                jsonStr = atob(record.body);
              } catch {
                jsonStr = record.body;
              }
            } else {
              const decoder = new TextDecoder();
              jsonStr = decoder.decode(record.body);
            }
            const payload = JSON.parse(jsonStr) as GameStatePayload;
            processPayload(payload);
          } catch {
            // Ignore parse errors
          }
        }
      } catch (iterError) {
        const err = iterError as Error;
        if (err.message?.includes('cancel') || err.message?.includes('locked')) {
          return;
        }
        throw iterError;
      }

      handleDisconnected();

    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        isConnectingRef.current = false;
        return;
      }

      isConnectingRef.current = false;
      connectViaProxyRef.current();
    }
  }, [processPayload, handleConnected, handleDisconnected]);

  /**
   * Fallback: Connect via backend proxy (original implementation)
   * Used when S2_READ_TOKEN is not configured
   */
  const connectViaProxy = useCallback(async () => {
    const S2_PROXY_URL = '/api/stream/s2';

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(S2_PROXY_URL, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`S2 Proxy HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      handleConnected();

      // NDJSON line splitter transform
      let buffer = '';
      const ndjsonTransform = new TransformStream<string, GameStatePayload>({
        transform(chunk, controller) {
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              controller.enqueue(JSON.parse(line));
            } catch {
              // Ignore parse errors
            }
          }
        }
      });

      await response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(ndjsonTransform)
        .pipeTo(new WritableStream({
          write: (payload) => processPayload(payload)
        }));

      handleDisconnected();

    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        isConnectingRef.current = false;
        return;
      }

      handleDisconnected();
      reconnectTimeoutRef.current = window.setTimeout(() => connectViaProxy(), 2000);
    }
  }, [processPayload, handleConnected, handleDisconnected]);

  // Store callbacks in refs to avoid useEffect re-running and circular deps
  const connectToS2Ref = useRef(connectToS2);
  connectToS2Ref.current = connectToS2;

  const connectViaProxyRef = useRef(connectViaProxy);
  connectViaProxyRef.current = connectViaProxy;

  const handleDisconnectedRef = useRef(handleDisconnected);
  handleDisconnectedRef.current = handleDisconnected;

  useEffect(() => {
    if (!enabled) return;

    cleanupIntervalRef.current = window.setInterval(() => clearOldEvents(), 500);

    lastMessageTimeRef.current = Date.now();
    heartbeatCheckRef.current = window.setInterval(() => {
      const timeSinceLastMessage = Date.now() - lastMessageTimeRef.current;
      if (timeSinceLastMessage > 5000 && !wasDisconnectedRef.current && !isConnectingRef.current) {
        handleDisconnectedRef.current();
        abortControllerRef.current?.abort();
        connectToS2Ref.current();
      }
    }, 1000);

    connectToS2Ref.current();

    return () => {
      abortControllerRef.current?.abort();

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
      if (heartbeatCheckRef.current) {
        clearInterval(heartbeatCheckRef.current);
      }
    };
  }, [enabled, clearOldEvents]);
}
