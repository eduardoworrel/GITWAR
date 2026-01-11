import { useEffect, useRef, useCallback } from 'react';
import { S2 } from '@s2-dev/streamstore';
import { useGameStore } from '../stores/gameStore';
import type { Player, CombatEvent, CombatEventType, EntityType, EventType, RewardEvent, LevelUpEvent } from '../stores/gameStore';

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
  level?: number;
  exp?: number;
  gold?: number;
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

interface RewardEventPayload {
  playerId: string;
  x: number;
  y: number;
  expGained: number;
  goldGained: number;
  leveledUp: boolean;
  newLevel: number;
  source: string;
  tick: number;
}

interface LevelUpEventPayload {
  playerId: string;
  playerName: string;
  oldLevel: number;
  newLevel: number;
  x: number;
  y: number;
  tick: number;
}

interface GameStatePayload {
  tick: number;
  timestamp?: number;
  serverVersion?: string;
  isFullState?: boolean; // true = full state (replace all), false = delta (merge changes)
  entidades?: EntityPayload[];
  entities?: EntityPayload[];
  eventos?: EventPayload[];
  rewards?: RewardEventPayload[];
  levelUps?: LevelUpEventPayload[];
  activeEvent?: ActiveEventPayload | null;
}

interface UseS2StreamOptions {
  enabled?: boolean;
  streamName?: string; // Individual player stream name
  readToken?: string; // Read token for individual stream
}

export function useS2Stream(options: UseS2StreamOptions = {}) {
  const { enabled = true, streamName: customStreamName, readToken: customReadToken } = options;

  // Determine which stream to use (individual or global)
  const effectiveStreamName = customStreamName || S2_STREAM;
  const effectiveToken = customReadToken || S2_TOKEN;

  // Store selectors
  const setPlayers = useGameStore((s) => s.setPlayers);
  const updatePlayersPartial = useGameStore((s) => s.updatePlayersPartial);
  const addCombatEvents = useGameStore((s) => s.addCombatEvents);
  const addRewardEvents = useGameStore((s) => s.addRewardEvents);
  const addLevelUpEvents = useGameStore((s) => s.addLevelUpEvents);
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

  // Entity type parser - pass through all valid types (server sends lowercase)
  const parseEntityType = useCallback((typeStr?: string): EntityType => {
    if (!typeStr) return 'player';
    // Server already sends lowercase types, just pass through
    return typeStr.toLowerCase() as EntityType;
  }, []);

  // Process entities - handles both full state and delta updates
  const processEntities = useCallback((entities: EntityPayload[], isFullState: boolean = true) => {
    if (entities.length === 0) return;

    if (isFullState) {
      // Full state: replace all entities
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
        level: e.level ?? 1,
        exp: e.exp ?? 0,
        gold: e.gold ?? 0,
        equippedItems: e.equippedItems ?? undefined,
      }));
      setPlayers(players);
    } else {
      // Delta update: merge only changed fields
      const partials: Partial<Player & { id: string }>[] = entities.map((e) => {
        const partial: Partial<Player & { id: string }> = { id: e.id };

        // Only include fields that are present in the delta
        if (e.login !== undefined || e.githubLogin !== undefined)
          partial.githubLogin = e.login || e.githubLogin;
        if (e.x !== undefined) partial.x = e.x;
        if (e.y !== undefined) partial.y = e.y;
        if (e.hp !== undefined || e.currentHp !== undefined)
          partial.hp = e.hp ?? e.currentHp;
        if (e.hpMax !== undefined || e.maxHp !== undefined)
          partial.maxHp = e.hpMax ?? e.maxHp;
        if (e.reino !== undefined) partial.reino = e.reino;
        if (e.type !== undefined) partial.type = parseEntityType(e.type);
        if (e.estado !== undefined || e.state !== undefined)
          partial.estado = e.estado || e.state;
        if (e.velocidadeAtaque !== undefined) partial.velocidadeAtaque = e.velocidadeAtaque;
        if (e.elo !== undefined) partial.elo = e.elo;
        if (e.vitorias !== undefined) partial.vitorias = e.vitorias;
        if (e.derrotas !== undefined) partial.derrotas = e.derrotas;
        if (e.dano !== undefined) partial.dano = e.dano;
        if (e.critico !== undefined) partial.critico = e.critico;
        if (e.evasao !== undefined) partial.evasao = e.evasao;
        if (e.armadura !== undefined) partial.armadura = e.armadura;
        if (e.velocidadeMovimento !== undefined) partial.velocidadeMovimento = e.velocidadeMovimento;
        if (e.level !== undefined) partial.level = e.level;
        if (e.exp !== undefined) partial.exp = e.exp;
        if (e.gold !== undefined) partial.gold = e.gold;
        if (e.equippedItems !== undefined) partial.equippedItems = e.equippedItems ?? undefined;

        return partial;
      });
      updatePlayersPartial(partials);
    }
  }, [setPlayers, updatePlayersPartial, parseEntityType]);

  // Process events
  const processEvents = useCallback((events: EventPayload[]) => {
    if (!events || events.length === 0) return;

    const combatEvents: CombatEvent[] = events.map((e) => ({
      // Deterministic ID for deduplication (no counter)
      id: `${e.tick}-${e.type}-${e.attackerId}-${e.targetId}-${e.damage ?? 0}`,
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

  // Process reward events
  const processRewards = useCallback((rewards: RewardEventPayload[]) => {
    if (!rewards || rewards.length === 0) return;

    const rewardEvents: RewardEvent[] = rewards.map((r) => ({
      // Deterministic ID for deduplication
      id: `reward-${r.tick}-${r.playerId}-${r.expGained}-${r.goldGained}`,
      playerId: r.playerId,
      x: r.x,
      y: r.y,
      expGained: r.expGained,
      goldGained: r.goldGained,
      leveledUp: r.leveledUp,
      newLevel: r.newLevel,
      source: r.source,
      tick: r.tick,
      createdAt: Date.now(),
    }));

    addRewardEvents(rewardEvents);
  }, [addRewardEvents]);

  // Process level up events
  const processLevelUps = useCallback((levelUps: LevelUpEventPayload[]) => {
    if (!levelUps || levelUps.length === 0) return;

    const levelUpEvents: LevelUpEvent[] = levelUps.map((l) => ({
      // Deterministic ID for deduplication
      id: `levelup-${l.tick}-${l.playerId}-${l.oldLevel}-${l.newLevel}`,
      playerId: l.playerId,
      playerName: l.playerName,
      oldLevel: l.oldLevel,
      newLevel: l.newLevel,
      x: l.x,
      y: l.y,
      tick: l.tick,
      createdAt: Date.now(),
    }));

    addLevelUpEvents(levelUpEvents);
  }, [addLevelUpEvents]);

  // Process payload
  const processPayload = useCallback((payload: GameStatePayload) => {
    lastMessageTimeRef.current = Date.now();

    const entities = payload.entidades || payload.entities || [];
    // Default to full state if not specified (backwards compatible with global stream)
    const isFullState = payload.isFullState !== false;
    processEntities(entities, isFullState);

    if (payload.eventos && payload.eventos.length > 0) {
      processEvents(payload.eventos);
    }

    if (payload.rewards && payload.rewards.length > 0) {
      processRewards(payload.rewards);
    }

    if (payload.levelUps && payload.levelUps.length > 0) {
      processLevelUps(payload.levelUps);
    }

    if (payload.activeEvent) {
      setActiveEvent({
        type: payload.activeEvent.type as EventType,
        monstersRemaining: payload.activeEvent.monstersRemaining,
      });
    } else {
      setActiveEvent(null);
    }
  }, [processEntities, processEvents, processRewards, processLevelUps, setActiveEvent]);

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

    // Use effective token (individual player token or global token)
    if (!effectiveToken) {
      await connectViaProxy();
      return;
    }

    isConnectingRef.current = true;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const s2 = new S2({ accessToken: effectiveToken });
      const basin = s2.basin(S2_BASIN);
      const stream = basin.stream(effectiveStreamName);
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
  }, [processPayload, handleConnected, handleDisconnected, effectiveToken, effectiveStreamName]);

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

  // Track stream changes to force reconnection
  const prevStreamNameRef = useRef(effectiveStreamName);
  const prevTokenRef = useRef(effectiveToken);

  useEffect(() => {
    if (!enabled) return;

    // Check if stream or token changed - force reconnection
    const streamChanged = prevStreamNameRef.current !== effectiveStreamName;
    const tokenChanged = prevTokenRef.current !== effectiveToken;
    if (streamChanged || tokenChanged) {
      console.log(`[S2 Stream] Switching to stream: ${effectiveStreamName}`);
      prevStreamNameRef.current = effectiveStreamName;
      prevTokenRef.current = effectiveToken;
      // Abort current connection and reconnect
      abortControllerRef.current?.abort();
      isConnectingRef.current = false;
      wasDisconnectedRef.current = false;
    }

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
  }, [enabled, clearOldEvents, effectiveStreamName, effectiveToken]);
}
