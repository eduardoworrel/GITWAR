import { create } from 'zustand';
import { INTERPOLATION_DURATION_MS } from '../three/constants';

export type EntityType = 'player' | 'npc' | 'bug' | 'aihallucination' | 'manager' | 'boss' | 'unexplainedbug' |
  // JavaScript
  'jsundefined' | 'jsnan' | 'jscallbackhell' |
  // Python
  'pyindentationerror' | 'pynonetype' | 'pyimporterror' |
  // Java
  'javanullpointer' | 'javaclassnotfound' | 'javaoutofmemory' |
  // C#
  'csnullreference' | 'csstackoverflow' | 'csinvalidcast' |
  // C/C++
  'csegfault' | 'cstackoverflow' | 'cmemoryleak' |
  // TypeScript
  'tstypeerror' | 'tsany' | 'tsreadonly' |
  // PHP
  'phppaamayim' | 'phpfatalerror' | 'phpundefinedindex' |
  // Go
  'gonilpanic' | 'godeadlock' | 'goimportcycle' |
  // Rust
  'rustborrowchecker' | 'rustpanic' | 'rustlifetimeerror' |
  // Ruby
  'rubynomethoderror' | 'rubyloaderror' | 'rubysyntaxerror' |
  // Swift
  'swiftfoundnil' | 'swiftforceunwrap' | 'swiftindexoutofrange' |
  // Kotlin
  'kotlinnullpointer' | 'kotlinclasscast' | 'kotlinuninitialized' |
  // Scala
  'scalamatcherror' | 'scalaabstractmethod' | 'scalastackoverflow' |
  // R
  'revalerror' | 'robjectnotfound' | 'rsubscriptoutofbounds' |
  // SQL
  'sqldeadlock' | 'sqlsyntaxerror' | 'sqltimeout' |
  // Bash
  'bashcommandnotfound' | 'bashpermissiondenied' | 'bashcoredumped' |
  // Perl
  'perluninitialized' | 'perlsyntaxerror' | 'perlcantlocate' |
  // Lua
  'luaindexnil' | 'luabadargument' | 'luastackoverflow' |
  // Dart
  'dartnullcheck' | 'dartrangeerror' | 'dartnosuchmethod' |
  // Elixir
  'elixirfunctionclause' | 'elixirargumenterror' | 'elixirkeyerror' |
  // AI/ML Errors
  'aivanishinggradient' | 'aiexplodinggradient' | 'aidyingrelu' | 'aioverfitting' |
  'aiunderfitting' | 'aimodecollapse' | 'aicatastrophicforgetting' | 'aidataleakage' |
  'aicudaoutofmemory' | 'aibiasvariance' | 'aideadneuron' | 'ainanloss';

// Item system types
export interface ItemStats {
  dano: number;
  armadura: number;
  hp: number;
  critico: number;
  evasao: number;
  velocidadeAtaque: number;
  velocidadeMovimento: number;
}

export interface Item {
  id: string;
  name: string;
  category: string;
  tier: string;
  price: number;
  stats: ItemStats;
  durationMinutes?: number;
  durationCondition?: string;
  visualDescription?: string;
}

export interface PlayerItem {
  id: string;
  isEquipped: boolean;
  acquiredAt: string;
  expiresAt?: string;
  item: Item;
}

// Equipped item info from server (minimal for visual display)
export interface EquippedItemInfo {
  name: string;
  category: string;
  tier: string;
}

// Raw entity payload from server (before defaults are applied)
export interface EntityPayload {
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
  equippedItems?: EquippedItemInfo[] | null;
}

export interface Player {
  id: string;
  githubLogin: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  type?: EntityType;
  estado?: string;
  velocidadeAtaque?: number;
  elo?: number;
  vitorias?: number;
  derrotas?: number;
  // Combat stats
  dano?: number;
  critico?: number;
  evasao?: number;
  armadura?: number;
  velocidadeMovimento?: number;
  // Progression stats
  level?: number;
  exp?: number;
  gold?: number;
  // Equipped items (from server)
  equippedItems?: EquippedItemInfo[];
}

export type EventType = 'none' | 'bugswarm' | 'intermediate' | 'boss';

export interface ActiveEvent {
  type: EventType;
  monstersRemaining: number;
}

export interface InterpolatedPlayer extends Player {
  targetX: number;
  targetY: number;
  lastUpdateTime: number;
  isAttacking?: boolean;
  isDead?: boolean;
  isRespawning?: boolean;
  deathTime?: number; // Timestamp when entity entered 'dead' state (for auto-cleanup)
}

export type CombatEventType = 'damage' | 'miss' | 'critical' | 'kill' | 'death' | 'respawn';

export interface ProjectileInfo {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  size: number;
  attackSpeed: number; // VelocidadeAtaque - determines projectile speed
}

export interface CombatEvent {
  id: string;
  type: CombatEventType;
  tick: number;
  timestamp: number;
  attackerId: string;
  attackerName: string;
  targetId: string;
  targetName: string;
  damage?: number;
  isCritical?: boolean;
  projectile?: ProjectileInfo;
  createdAt: number; // Local timestamp for cleanup
}

export interface RewardEvent {
  id: string;
  playerId: string;
  x: number;
  y: number;
  expGained: number;
  goldGained: number;
  leveledUp: boolean;
  newLevel: number;
  source: string;
  tick: number;
  createdAt: number;
}

export interface LevelUpEvent {
  id: string;
  playerId: string;
  playerName: string;
  oldLevel: number;
  newLevel: number;
  x: number;
  y: number;
  tick: number;
  createdAt: number;
}

export type CameraMode = 'follow' | 'free' | 'drone';
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

// Stream info from server
export interface StreamInfo {
  streamName: string;
  basin: string;
  baseUrl: string;
  readToken?: string | null;
}

interface GameState {
  players: Map<string, InterpolatedPlayer>;
  combatEvents: CombatEvent[];
  rewardEvents: RewardEvent[];
  levelUpEvents: LevelUpEvent[];
  currentPlayerId: string | null;
  frameTime: number; // Consistent timestamp for entire frame
  currentPlayerPos: { x: number; y: number } | null; // Cached position for current player
  currentPlayerRotation: number; // Y rotation of current player (radians)
  cameraMode: CameraMode; // 'follow' = auto-follow player, 'free' = user control
  activeEvent: ActiveEvent | null; // Current active event
  connectionStatus: ConnectionStatus; // Server connection status
  showReconnectedModal: boolean; // Show modal after reconnection
  // Stream info for individual player streams
  streamInfo: StreamInfo | null;
  // Item system
  shopItems: Item[];
  inventory: PlayerItem[];
  inventoryLoading: boolean;
  setCameraMode: (mode: CameraMode) => void;
  setCurrentPlayer: (id: string | null) => void;
  setStreamInfo: (info: StreamInfo | null) => void;
  setCurrentPlayerPos: (pos: { x: number; y: number } | null) => void;
  setCurrentPlayerRotation: (rotation: number) => void;
  removePlayer: (id: string) => void;
  mergeEntities: (players: Player[], removeAbsent: boolean) => void;
  mergeEntitiesRaw: (entities: EntityPayload[], removeAbsent: boolean, parseEntityType: (type?: string) => EntityType) => void;
  setFrameTime: (time: number) => void;
  getInterpolatedPosition: (id: string) => { x: number; y: number } | null;
  addCombatEvents: (events: CombatEvent[]) => void;
  addRewardEvents: (events: RewardEvent[]) => void;
  addLevelUpEvents: (events: LevelUpEvent[]) => void;
  clearOldEvents: () => void;
  getLastAttackTime: (playerId: string) => number | null;
  setActiveEvent: (event: ActiveEvent | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setShowReconnectedModal: (show: boolean) => void;
  // Item system actions
  setShopItems: (items: Item[]) => void;
  setInventory: (items: PlayerItem[]) => void;
  setInventoryLoading: (loading: boolean) => void;
  addToInventory: (item: PlayerItem) => void;
  updateInventoryItem: (playerItemId: string, updates: Partial<PlayerItem>) => void;
  removeFromInventory: (playerItemId: string) => void;
  getEquippedItems: () => PlayerItem[];
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * Math.min(1, Math.max(0, t));
}

export const useGameStore = create<GameState>((set, get) => ({
  players: new Map(),
  combatEvents: [],
  rewardEvents: [],
  levelUpEvents: [],
  currentPlayerId: null,
  frameTime: Date.now(),
  currentPlayerPos: null,
  currentPlayerRotation: 0,
  cameraMode: 'follow',
  activeEvent: null,
  connectionStatus: 'connected',
  showReconnectedModal: false,
  // Stream info
  streamInfo: null,
  // Item system
  shopItems: [],
  inventory: [],
  inventoryLoading: false,
  setCameraMode: (mode) => set({ cameraMode: mode }),

  setStreamInfo: (info) => set({ streamInfo: info }),

  setActiveEvent: (event) => set({ activeEvent: event }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setShowReconnectedModal: (show) => set({ showReconnectedModal: show }),

  setCurrentPlayer: (id) => set({ currentPlayerId: id }),

  setCurrentPlayerPos: (pos) => set({ currentPlayerPos: pos }),

  setCurrentPlayerRotation: (rotation) => set({ currentPlayerRotation: rotation }),

  setFrameTime: (time) => set({ frameTime: time }),

  removePlayer: (id) =>
    set((state) => {
      const newPlayers = new Map(state.players);
      newPlayers.delete(id);
      return { players: newPlayers };
    }),

  // Smart merge: add new, update existing, optionally remove absent
  // This avoids full Map replacement which causes re-renders
  mergeEntities: (players, removeAbsent) =>
    set((state) => {
      const newPlayers = new Map(state.players);
      const now = Date.now();
      const incomingIds = new Set(players.map(p => p.id));

      // Update existing and add new
      for (const player of players) {
        const existing = newPlayers.get(player.id);

        if (existing) {
          // Check if anything actually changed to avoid unnecessary updates
          const posChanged = Math.abs(player.x - existing.targetX) > 0.1 ||
                            Math.abs(player.y - existing.targetY) > 0.1;
          const hpChanged = player.hp !== existing.hp || player.maxHp !== existing.maxHp;
          const stateChanged = player.estado !== existing.estado;
          const statsChanged = player.level !== existing.level ||
                              player.exp !== existing.exp ||
                              player.gold !== existing.gold;

          if (posChanged || hpChanged || stateChanged || statsChanged) {
            // Calculate interpolated position for smooth movement
            const elapsed = now - existing.lastUpdateTime;
            const t = Math.min(1, elapsed / INTERPOLATION_DURATION_MS);
            const currentX = lerp(existing.x, existing.targetX, t);
            const currentY = lerp(existing.y, existing.targetY, t);

            newPlayers.set(player.id, {
              ...existing,
              ...player,
              x: currentX,
              y: currentY,
              targetX: player.x,
              targetY: player.y,
              lastUpdateTime: now,
              // Track when entity enters dead state for auto-cleanup
              deathTime: (player.estado === 'dead' && existing.estado !== 'dead') ? now : existing.deathTime,
            });
          }
          // If nothing changed, keep existing reference (no update)
        } else {
          // New entity - add it
          newPlayers.set(player.id, {
            ...player,
            targetX: player.x,
            targetY: player.y,
            lastUpdateTime: now,
          });
        }
      }

      // Remove entities not in incoming list (only for full state)
      if (removeAbsent) {
        for (const id of newPlayers.keys()) {
          if (!incomingIds.has(id)) {
            newPlayers.delete(id);
          }
        }
      }

      return { players: newPlayers };
    }),

  // Smart merge from raw server data - only applies defaults for NEW entities
  // For existing entities, only updates fields that are actually present in the payload
  mergeEntitiesRaw: (entities, removeAbsent, parseEntityType) =>
    set((state) => {
      const newPlayers = new Map(state.players);
      const now = Date.now();
      const incomingIds = new Set(entities.map(e => e.id));

      for (const e of entities) {
        const existing = newPlayers.get(e.id);

        if (existing) {
          // EXISTING entity - only update fields that are ACTUALLY present in payload
          // This prevents overwriting real values with defaults
          const updates: Partial<InterpolatedPlayer> = {};
          let hasChanges = false;

          // Position - always update if present
          if (e.x !== undefined && e.y !== undefined) {
            const posChanged = Math.abs(e.x - existing.targetX) > 0.1 ||
                              Math.abs(e.y - existing.targetY) > 0.1;
            if (posChanged) {
              const elapsed = now - existing.lastUpdateTime;
              const t = Math.min(1, elapsed / INTERPOLATION_DURATION_MS);
              updates.x = lerp(existing.x, existing.targetX, t);
              updates.y = lerp(existing.y, existing.targetY, t);
              updates.targetX = e.x;
              updates.targetY = e.y;
              updates.lastUpdateTime = now;
              hasChanges = true;
            }
          }

          // HP - only if server sent it
          const serverHp = e.hp ?? e.currentHp;
          const serverMaxHp = e.hpMax ?? e.maxHp;
          if (serverHp !== undefined && serverHp !== existing.hp) {
            updates.hp = serverHp;
            hasChanges = true;
          }
          if (serverMaxHp !== undefined && serverMaxHp !== existing.maxHp) {
            updates.maxHp = serverMaxHp;
            hasChanges = true;
          }

          // State - only if server sent it
          const serverEstado = e.estado || e.state;
          if (serverEstado !== undefined && serverEstado !== existing.estado) {
            updates.estado = serverEstado;
            hasChanges = true;
            // Track when entity enters dead state for auto-cleanup
            if (serverEstado === 'dead' && existing.estado !== 'dead') {
              updates.deathTime = now;
            }
          }

          // Progression stats - only if server sent them
          if (e.level !== undefined && e.level !== existing.level) {
            updates.level = e.level;
            hasChanges = true;
          }
          if (e.exp !== undefined && e.exp !== existing.exp) {
            updates.exp = e.exp;
            hasChanges = true;
          }
          if (e.gold !== undefined && e.gold !== existing.gold) {
            updates.gold = e.gold;
            hasChanges = true;
          }

          // Combat stats - only if server sent them
          if (e.dano !== undefined) updates.dano = e.dano;
          if (e.critico !== undefined) updates.critico = e.critico;
          if (e.evasao !== undefined) updates.evasao = e.evasao;
          if (e.armadura !== undefined) updates.armadura = e.armadura;
          if (e.velocidadeAtaque !== undefined) updates.velocidadeAtaque = e.velocidadeAtaque;
          if (e.velocidadeMovimento !== undefined) updates.velocidadeMovimento = e.velocidadeMovimento;

          // Only update if something actually changed
          if (hasChanges) {
            newPlayers.set(e.id, { ...existing, ...updates });
          }
        } else {
          // NEW entity - apply defaults here
          const newPlayer: InterpolatedPlayer = {
            id: e.id,
            githubLogin: e.login || e.githubLogin || 'Unknown',
            x: e.x,
            y: e.y,
            targetX: e.x,
            targetY: e.y,
            lastUpdateTime: now,
            hp: e.hp ?? e.currentHp ?? 100,
            maxHp: e.hpMax ?? e.maxHp ?? 100,
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
          };
          newPlayers.set(e.id, newPlayer);
        }
      }

      // Remove absent entities only if explicitly requested
      if (removeAbsent) {
        for (const id of newPlayers.keys()) {
          if (!incomingIds.has(id)) {
            newPlayers.delete(id);
          }
        }
      }

      return { players: newPlayers };
    }),

  getInterpolatedPosition: (id) => {
    const state = get();
    const player = state.players.get(id);

    if (!player) return null;

    // Use Date.now() directly - within a single frame, time difference is negligible
    // This avoids triggering Zustand re-renders by not depending on frameTime state
    const now = Date.now();
    const elapsed = now - player.lastUpdateTime;
    // Clamp t to [0, 1] to prevent overshoot and jitter
    const t = Math.min(1, Math.max(0, elapsed / INTERPOLATION_DURATION_MS));

    return {
      x: lerp(player.x, player.targetX, t),
      y: lerp(player.y, player.targetY, t),
    };
  },

  addCombatEvents: (events) =>
    set((state) => {
      const now = Date.now();
      // Filter out duplicates by ID
      const existingIds = new Set(state.combatEvents.map((e) => e.id));
      const uniqueNewEvents = events
        .filter((e) => !existingIds.has(e.id))
        .map((e) => ({ ...e, createdAt: now }));
      // Keep max 50 events
      const allEvents = [...state.combatEvents, ...uniqueNewEvents].slice(-50);
      return { combatEvents: allEvents };
    }),

  addRewardEvents: (events) =>
    set((state) => {
      const now = Date.now();
      // Filter out duplicates by ID
      const existingIds = new Set(state.rewardEvents.map((e) => e.id));
      const uniqueNewEvents = events
        .filter((e) => !existingIds.has(e.id))
        .map((e) => ({ ...e, createdAt: now }));
      // Keep max 30 reward events
      const allEvents = [...state.rewardEvents, ...uniqueNewEvents].slice(-30);
      return { rewardEvents: allEvents };
    }),

  addLevelUpEvents: (events) =>
    set((state) => {
      const now = Date.now();
      // Filter out duplicates by ID
      const existingIds = new Set(state.levelUpEvents.map((e) => e.id));
      const uniqueNewEvents = events
        .filter((e) => !existingIds.has(e.id))
        .map((e) => ({ ...e, createdAt: now }));
      // Keep max 10 level up events
      const allEvents = [...state.levelUpEvents, ...uniqueNewEvents].slice(-10);
      return { levelUpEvents: allEvents };
    }),

  clearOldEvents: () =>
    set((state) => {
      const now = Date.now();
      const maxAge = 2000; // Remove events older than 2 seconds
      const filteredCombat = state.combatEvents.filter(
        (e) => now - e.createdAt < maxAge
      );
      const filteredRewards = state.rewardEvents.filter(
        (e) => now - e.createdAt < maxAge
      );
      const filteredLevelUps = state.levelUpEvents.filter(
        (e) => now - e.createdAt < 3000 // Level ups last longer
      );

      // Auto-remove dead non-player entities after death animation completes
      const DEATH_CLEANUP_MS = 3000; // 3 seconds: enough for fall + ghost animation
      let playersChanged = false;
      const newPlayers = new Map(state.players);
      for (const [id, player] of newPlayers) {
        if (player.estado === 'dead' && player.type !== 'player') {
          if (!player.deathTime) {
            // Backfill deathTime for entities that were already dead before tracking
            newPlayers.set(id, { ...player, deathTime: now });
            playersChanged = true;
          } else if (now - player.deathTime > DEATH_CLEANUP_MS) {
            newPlayers.delete(id);
            playersChanged = true;
          }
        }
      }

      return {
        combatEvents: filteredCombat,
        rewardEvents: filteredRewards,
        levelUpEvents: filteredLevelUps,
        ...(playersChanged ? { players: newPlayers } : {}),
      };
    }),

  getLastAttackTime: (playerId: string) => {
    const state = get();
    // Find the most recent attack event where this player was the attacker
    const attackEvents = state.combatEvents.filter(
      (e) =>
        e.attackerId === playerId &&
        (e.type === 'damage' || e.type === 'critical' || e.type === 'miss')
    );
    if (attackEvents.length === 0) return null;
    // Return the most recent one (highest createdAt)
    return Math.max(...attackEvents.map((e) => e.createdAt));
  },

  // Item system actions
  setShopItems: (items) => set({ shopItems: items }),

  setInventory: (items) => set({ inventory: items }),

  setInventoryLoading: (loading) => set({ inventoryLoading: loading }),

  addToInventory: (item) =>
    set((state) => ({
      inventory: [...state.inventory, item],
    })),

  updateInventoryItem: (playerItemId, updates) =>
    set((state) => ({
      inventory: state.inventory.map((pi) =>
        pi.id === playerItemId ? { ...pi, ...updates } : pi
      ),
    })),

  removeFromInventory: (playerItemId) =>
    set((state) => ({
      inventory: state.inventory.filter((pi) => pi.id !== playerItemId),
    })),

  getEquippedItems: () => {
    const state = get();
    return state.inventory.filter((pi) => pi.isEquipped);
  },

}));
