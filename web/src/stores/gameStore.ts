import { create } from 'zustand';
import { INTERPOLATION_DURATION_MS } from '../three/constants';

export type EntityType = 'player' | 'npc' | 'bug' | 'aihallucination' | 'manager' | 'boss' | 'unexplainedbug';

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

export interface Player {
  id: string;
  githubLogin: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  reino: string;
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
}

export type CombatEventType = 'damage' | 'miss' | 'critical' | 'kill' | 'death' | 'respawn';

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
  createdAt: number; // Local timestamp for cleanup
}

export type CameraMode = 'follow' | 'free' | 'drone';
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

// Selected player for radial menu
export interface SelectedPlayerForMenu {
  id: string;
  githubLogin: string;
  position: { x: number; y: number };
}

interface GameState {
  players: Map<string, InterpolatedPlayer>;
  combatEvents: CombatEvent[];
  currentPlayerId: string | null;
  frameTime: number; // Consistent timestamp for entire frame
  currentPlayerPos: { x: number; y: number } | null; // Cached position for current player
  currentPlayerRotation: number; // Y rotation of current player (radians)
  cameraMode: CameraMode; // 'follow' = auto-follow player, 'free' = user control
  activeEvent: ActiveEvent | null; // Current active event
  connectionStatus: ConnectionStatus; // Server connection status
  showReconnectedModal: boolean; // Show modal after reconnection
  // Item system
  shopItems: Item[];
  inventory: PlayerItem[];
  inventoryLoading: boolean;
  // Radial menu
  selectedPlayerForMenu: SelectedPlayerForMenu | null;
  radialMenuScreenPos: { x: number; y: number } | null;
  setCameraMode: (mode: CameraMode) => void;
  setCurrentPlayer: (id: string | null) => void;
  setCurrentPlayerPos: (pos: { x: number; y: number } | null) => void;
  setCurrentPlayerRotation: (rotation: number) => void;
  updatePlayer: (player: Player) => void;
  removePlayer: (id: string) => void;
  setPlayers: (players: Player[]) => void;
  setFrameTime: (time: number) => void;
  getInterpolatedPosition: (id: string) => { x: number; y: number } | null;
  addCombatEvents: (events: CombatEvent[]) => void;
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
  // Radial menu
  setSelectedPlayerForMenu: (player: SelectedPlayerForMenu | null) => void;
  setRadialMenuScreenPos: (pos: { x: number; y: number } | null) => void;
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * Math.min(1, Math.max(0, t));
}

export const useGameStore = create<GameState>((set, get) => ({
  players: new Map(),
  combatEvents: [],
  currentPlayerId: null,
  frameTime: Date.now(),
  currentPlayerPos: null,
  currentPlayerRotation: 0,
  cameraMode: 'follow',
  activeEvent: null,
  connectionStatus: 'connected',
  showReconnectedModal: false,
  // Item system
  shopItems: [],
  inventory: [],
  inventoryLoading: false,
  // Radial menu
  selectedPlayerForMenu: null,
  radialMenuScreenPos: null,

  setCameraMode: (mode) => set({ cameraMode: mode }),

  setActiveEvent: (event) => set({ activeEvent: event }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setShowReconnectedModal: (show) => set({ showReconnectedModal: show }),

  setCurrentPlayer: (id) => set({ currentPlayerId: id }),

  setCurrentPlayerPos: (pos) => set({ currentPlayerPos: pos }),

  setCurrentPlayerRotation: (rotation) => set({ currentPlayerRotation: rotation }),

  setFrameTime: (time) => set({ frameTime: time }),

  updatePlayer: (player) =>
    set((state) => {
      const newPlayers = new Map(state.players);
      const existing = newPlayers.get(player.id);
      const now = Date.now();

      if (existing) {
        // Update target position, keep current position for interpolation
        newPlayers.set(player.id, {
          ...player,
          x: existing.x,
          y: existing.y,
          targetX: player.x,
          targetY: player.y,
          lastUpdateTime: now,
        });
      } else {
        // New player, set position directly
        newPlayers.set(player.id, {
          ...player,
          targetX: player.x,
          targetY: player.y,
          lastUpdateTime: now,
        });
      }
      return { players: newPlayers };
    }),

  removePlayer: (id) =>
    set((state) => {
      const newPlayers = new Map(state.players);
      newPlayers.delete(id);
      return { players: newPlayers };
    }),

  setPlayers: (players) =>
    set((state) => {
      const newPlayers = new Map<string, InterpolatedPlayer>();
      const now = Date.now();

      for (const player of players) {
        const existing = state.players.get(player.id);

        if (existing) {
          // Check if player just respawned (was dead, now alive) or teleported
          const wasDeadNowAlive = existing.estado === 'dead' && player.estado !== 'dead';
          const dx = Math.abs(player.x - existing.targetX);
          const dy = Math.abs(player.y - existing.targetY);
          const isTeleport = dx > 500 || dy > 500; // Large position change = teleport/respawn

          if (wasDeadNowAlive || isTeleport) {
            // Skip interpolation - set position directly
            newPlayers.set(player.id, {
              ...player,
              x: player.x,
              y: player.y,
              targetX: player.x,
              targetY: player.y,
              lastUpdateTime: now,
            });
          } else {
            // Calculate current interpolated position to use as new starting point
            const elapsed = now - existing.lastUpdateTime;
            const t = Math.min(1, elapsed / INTERPOLATION_DURATION_MS);
            const currentX = lerp(existing.x, existing.targetX, t);
            const currentY = lerp(existing.y, existing.targetY, t);

            // Update: use current interpolated position as starting point
            newPlayers.set(player.id, {
              ...player,
              x: currentX,
              y: currentY,
              targetX: player.x,
              targetY: player.y,
              lastUpdateTime: now,
            });
          }
        } else {
          // New player, set position directly
          newPlayers.set(player.id, {
            ...player,
            targetX: player.x,
            targetY: player.y,
            lastUpdateTime: now,
          });
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
    const t = elapsed / INTERPOLATION_DURATION_MS;

    return {
      x: lerp(player.x, player.targetX, t),
      y: lerp(player.y, player.targetY, t),
    };
  },

  addCombatEvents: (events) =>
    set((state) => {
      const now = Date.now();
      const newEvents = events.map((e) => ({ ...e, createdAt: now }));
      // Keep max 50 events
      const allEvents = [...state.combatEvents, ...newEvents].slice(-50);
      return { combatEvents: allEvents };
    }),

  clearOldEvents: () =>
    set((state) => {
      const now = Date.now();
      const maxAge = 2000; // Remove events older than 2 seconds
      const filtered = state.combatEvents.filter(
        (e) => now - e.createdAt < maxAge
      );
      return { combatEvents: filtered };
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

  setSelectedPlayerForMenu: (player) => set({ selectedPlayerForMenu: player }),

  setRadialMenuScreenPos: (pos) => set({ radialMenuScreenPos: pos }),
}));
