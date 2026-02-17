// GitWorld - Constantes visuais e do jogo

// S2 Stream - matches backend GameConstants.RaioBroadcast
export const RAIO_BROADCAST = 1000;
export const INTERPOLATION_DURATION_MS = 150;

// Câmera isométrica
export const CAMERA_ANGLE = 60; // graus (estilo Ragnarok)
export const CAMERA_HEIGHT = 180;    // mais baixa = mais inclinada para ver horizonte
export const CAMERA_DISTANCE = 300;  // mais perto do player
export const CAMERA_DIAGONAL_OFFSET = 0.35; // radianos (~20°) - levemente diagonal

// Character dimensions are now defined in Player.tsx (Minecraft-style blocky character)

// Mapa expandido (10k x 10k) - mesa de escritório fica no centro
export const MAP_WIDTH = 10000;
export const MAP_HEIGHT = 10000;

// Área original da mesa (fica plana no centro do mapa)
export const DESK_WIDTH = 5000;
export const DESK_HEIGHT = 3000;
export const DESK_OFFSET_X = (MAP_WIDTH - DESK_WIDTH) / 2;   // 2500
export const DESK_OFFSET_Z = (MAP_HEIGHT - DESK_HEIGHT) / 2; // 3500

// Drone mode (spectator camera) - orbits around desk center
export const DRONE_HEIGHT = 800;
export const DRONE_ORBIT_RADIUS_X = 2000;
export const DRONE_ORBIT_RADIUS_Z = 1200;
export const DRONE_ORBIT_SPEED = 0.002;
export const DRONE_CENTER_X = DESK_OFFSET_X + DESK_WIDTH / 2;  // Center of desk
export const DRONE_CENTER_Z = DESK_OFFSET_Z + DESK_HEIGHT / 2; // Center of desk

// Spawn único no centro do desk
export const SPAWN_POINT = { x: DESK_OFFSET_X + DESK_WIDTH / 2, y: DESK_OFFSET_Z + DESK_HEIGHT / 2 };

// ELO-based player colors
export function getCorElo(elo: number): number {
  if (elo >= 2000) return 0xb9f2ff; // Diamond
  if (elo >= 1600) return 0x00ced1; // Platinum
  if (elo >= 1200) return 0xffd700; // Gold
  if (elo >= 800) return 0xc0c0c0;  // Silver
  return 0xcd7f32;                   // Bronze
}

// ELO-based CSS colors (for UI components)
export function getCorEloHex(elo: number): string {
  if (elo >= 2000) return '#B9F2FF'; // Diamond
  if (elo >= 1600) return '#00CED1'; // Platinum
  if (elo >= 1200) return '#FFD700'; // Gold
  if (elo >= 800) return '#C0C0C0';  // Silver
  return '#CD7F32';                   // Bronze
}
