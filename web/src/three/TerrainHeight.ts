import { createNoise2D, type NoiseFunction2D } from 'simplex-noise';
import { MAP_WIDTH, MAP_HEIGHT, DESK_WIDTH, DESK_HEIGHT, DESK_OFFSET_X, DESK_OFFSET_Z } from './constants';

// Terrain configuration - ONLY for areas OUTSIDE the desk
export const TERRAIN_CONFIG = {
  // Maximum height of terrain (visual only)
  maxHeight: 150,

  // Noise scales for different terrain features
  primaryScale: 0.0005,    // Large hills
  secondaryScale: 0.0015,   // Medium bumps
  detailScale: 0.004,      // Small details

  // Noise weights (should sum to ~1.0)
  primaryWeight: 0.6,
  secondaryWeight: 0.3,
  detailWeight: 0.1,

  // Transition zone width from desk edge to full terrain
  transitionWidth: 300,
};

// Noise functions - initialized lazily
let primaryNoise: NoiseFunction2D | null = null;
let secondaryNoise: NoiseFunction2D | null = null;
let detailNoise: NoiseFunction2D | null = null;

function initializeNoise(): void {
  if (primaryNoise) return;
  primaryNoise = createNoise2D(() => 0.1);
  secondaryNoise = createNoise2D(() => 0.5);
  detailNoise = createNoise2D(() => 0.9);
}

/**
 * Check if a point is inside the desk area
 * Desk is centered in the expanded map
 */
function isInsideDesk(x: number, z: number): boolean {
  const deskMinX = DESK_OFFSET_X;
  const deskMaxX = DESK_OFFSET_X + DESK_WIDTH;
  const deskMinZ = DESK_OFFSET_Z;
  const deskMaxZ = DESK_OFFSET_Z + DESK_HEIGHT;

  return x >= deskMinX && x <= deskMaxX && z >= deskMinZ && z <= deskMaxZ;
}

/**
 * Get distance from desk edge (negative if inside, positive if outside)
 */
function getDistanceFromDeskEdge(x: number, z: number): number {
  const deskMinX = DESK_OFFSET_X;
  const deskMaxX = DESK_OFFSET_X + DESK_WIDTH;
  const deskMinZ = DESK_OFFSET_Z;
  const deskMaxZ = DESK_OFFSET_Z + DESK_HEIGHT;

  // Distance to each edge
  const distToLeft = x - deskMinX;
  const distToRight = deskMaxX - x;
  const distToTop = z - deskMinZ;
  const distToBottom = deskMaxZ - z;

  // If inside desk, return negative of minimum distance to edge
  if (x >= deskMinX && x <= deskMaxX && z >= deskMinZ && z <= deskMaxZ) {
    return -Math.min(distToLeft, distToRight, distToTop, distToBottom);
  }

  // If outside, calculate positive distance
  let dx = 0;
  let dz = 0;

  if (x < deskMinX) dx = deskMinX - x;
  else if (x > deskMaxX) dx = x - deskMaxX;

  if (z < deskMinZ) dz = deskMinZ - z;
  else if (z > deskMaxZ) dz = z - deskMaxZ;

  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Calculate edge fade factor (0 at map edges, 1 in terrain)
 */
function getMapEdgeFadeFactor(x: number, z: number): number {
  const fadeDistance = 200;

  const distFromLeft = x;
  const distFromRight = MAP_WIDTH - x;
  const distFromTop = z;
  const distFromBottom = MAP_HEIGHT - z;

  const minDist = Math.min(distFromLeft, distFromRight, distFromTop, distFromBottom);

  if (minDist >= fadeDistance) return 1;
  return minDist / fadeDistance;
}

// Debug flag - set to true to see terrain height values
let debugLogCount = 0;

/**
 * Get terrain height at a given world position
 * Returns 0 for the desk area, terrain height for expanded areas
 */
export function getTerrainHeight(x: number, z: number): number {
  // DESK AREA - always flat at 0
  if (isInsideDesk(x, z)) {
    return 0;
  }

  initializeNoise();

  // Debug log first few calls outside desk
  if (debugLogCount < 5) {
    debugLogCount++;
    console.log(`[Terrain] Outside desk at (${x.toFixed(0)}, ${z.toFixed(0)})`);
  }

  if (!primaryNoise || !secondaryNoise || !detailNoise) return 0;

  const {
    maxHeight,
    primaryScale, secondaryScale, detailScale,
    primaryWeight, secondaryWeight, detailWeight,
    transitionWidth
  } = TERRAIN_CONFIG;

  // Sample noise at different scales
  const primary = primaryNoise(x * primaryScale, z * primaryScale);
  const secondary = secondaryNoise(x * secondaryScale, z * secondaryScale);
  const detail = detailNoise(x * detailScale, z * detailScale);

  // Combine noise layers (result is -1 to 1)
  const combined = (
    primary * primaryWeight +
    secondary * secondaryWeight +
    detail * detailWeight
  );

  // Normalize to 0-1 range and apply max height
  const normalizedHeight = (combined + 1) * 0.5;
  let height = normalizedHeight * maxHeight;

  // Apply transition from desk edge
  const distFromDesk = getDistanceFromDeskEdge(x, z);
  if (distFromDesk < transitionWidth) {
    // Smooth transition from desk (0) to full terrain
    const t = distFromDesk / transitionWidth;
    const smoothT = t * t * (3 - 2 * t); // smoothstep
    height *= smoothT;
  }

  // Apply edge fade at map boundaries
  const edgeFade = getMapEdgeFadeFactor(x, z);
  height *= edgeFade;

  // Debug log height values
  if (debugLogCount <= 5 && height > 0) {
    console.log(`[Terrain] Height at (${x.toFixed(0)}, ${z.toFixed(0)}) = ${height.toFixed(1)}`);
  }

  return height;
}

/**
 * Check if position is in the terrain area (outside desk)
 */
export function isInTerrainArea(x: number, z: number): boolean {
  return !isInsideDesk(x, z);
}

// Building positions - now in EXPANDED areas outside the desk
export const BUILDING_POSITIONS = [
  // === NORTH AREA (above desk, z < DESK_OFFSET_Z) ===
  // Server Racks
  { type: 'serverRack', x: 3000, z: 1500, width: 80, depth: 40, rotation: 0 },
  { type: 'serverRack', x: 7000, z: 1500, width: 80, depth: 40, rotation: 0 },
  // Data Center
  { type: 'dataCenter', x: 5000, z: 1000, width: 200, depth: 150, rotation: 0 },
  // Whiteboards
  { type: 'whiteboard', x: 4000, z: 2500, width: 150, depth: 20, rotation: 0 },
  { type: 'whiteboard', x: 6000, z: 2500, width: 150, depth: 20, rotation: 0 },

  // === SOUTH AREA (below desk, z > DESK_OFFSET_Z + DESK_HEIGHT) ===
  // Server Racks
  { type: 'serverRack', x: 3000, z: 8500, width: 80, depth: 40, rotation: Math.PI },
  { type: 'serverRack', x: 7000, z: 8500, width: 80, depth: 40, rotation: Math.PI },
  // Data Center
  { type: 'dataCenter', x: 5000, z: 9000, width: 200, depth: 150, rotation: Math.PI },
  // Coffee Stations
  { type: 'coffeeStation', x: 4000, z: 7500, width: 100, depth: 60, rotation: 0 },
  { type: 'coffeeStation', x: 6000, z: 7500, width: 100, depth: 60, rotation: 0 },

  // === WEST AREA (left of desk, x < DESK_OFFSET_X) ===
  // Server Racks
  { type: 'serverRack', x: 1000, z: 4000, width: 80, depth: 40, rotation: -Math.PI / 2 },
  { type: 'serverRack', x: 1000, z: 6000, width: 80, depth: 40, rotation: -Math.PI / 2 },
  // UPS Units
  { type: 'ups', x: 500, z: 5000, width: 50, depth: 80, rotation: -Math.PI / 2 },
  // Network Switches
  { type: 'networkSwitch', x: 1500, z: 4500, width: 60, depth: 30, rotation: 0 },
  { type: 'networkSwitch', x: 1500, z: 5500, width: 60, depth: 30, rotation: 0 },

  // === EAST AREA (right of desk, x > DESK_OFFSET_X + DESK_WIDTH) ===
  // Server Racks
  { type: 'serverRack', x: 9000, z: 4000, width: 80, depth: 40, rotation: Math.PI / 2 },
  { type: 'serverRack', x: 9000, z: 6000, width: 80, depth: 40, rotation: Math.PI / 2 },
  // UPS Units
  { type: 'ups', x: 9500, z: 5000, width: 50, depth: 80, rotation: Math.PI / 2 },
  // Network Switches
  { type: 'networkSwitch', x: 8500, z: 4500, width: 60, depth: 30, rotation: Math.PI },
  { type: 'networkSwitch', x: 8500, z: 5500, width: 60, depth: 30, rotation: Math.PI },

  // === CORNER AREAS ===
  // Northwest
  { type: 'dataCenter', x: 1000, z: 1000, width: 200, depth: 150, rotation: 0 },
  // Northeast
  { type: 'dataCenter', x: 9000, z: 1000, width: 200, depth: 150, rotation: 0 },
  // Southwest
  { type: 'dataCenter', x: 1000, z: 9000, width: 200, depth: 150, rotation: 0 },
  // Southeast
  { type: 'dataCenter', x: 9000, z: 9000, width: 200, depth: 150, rotation: 0 },
];

/**
 * Check if a position is inside any building's collision zone
 */
export function isInsideBuilding(x: number, z: number): boolean {
  for (const building of BUILDING_POSITIONS) {
    const halfWidth = building.width / 2;
    const halfDepth = building.depth / 2;

    if (
      x >= building.x - halfWidth &&
      x <= building.x + halfWidth &&
      z >= building.z - halfDepth &&
      z <= building.z + halfDepth
    ) {
      return true;
    }
  }
  return false;
}
