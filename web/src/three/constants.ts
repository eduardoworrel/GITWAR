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

// Cores por reino (linguagens de programação) - ainda usadas para colorir jogadores
export const CORES_REINO: Record<string, number> = {
  Python: 0x3776ab,
  JavaScript: 0xf7df1e,
  TypeScript: 0x3178c6,
  Java: 0xed8b00,
  'C#': 0x239120,
  Go: 0x00add8,
  Rust: 0xdea584,
  Ruby: 0xcc342d,
  PHP: 0x777bb4,
  'C++': 0x00599c,
  C: 0x555555,
  Swift: 0xfa7343,
  Kotlin: 0x7f52ff,
  Shell: 0x89e051,
  Scala: 0xdc322f,
  IA: 0xa855f7,  // Purple/violet - HuggingFace users
};

// Cor padrão para reinos não mapeados
export const COR_PADRAO = 0x808080;

export function getCorReino(reino: string): number {
  return CORES_REINO[reino] ?? COR_PADRAO;
}
