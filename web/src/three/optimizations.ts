import * as THREE from 'three';

// =============================================================================
// PERFORMANCE OPTIMIZATIONS
// =============================================================================

// Reusable Vector3 for lerp operations - prevents GC pressure
export const TEMP_VECTOR3 = new THREE.Vector3(1, 1, 1);
export const UNIT_VECTOR3 = new THREE.Vector3(1, 1, 1);

// Reset temp vector to unit scale
export function resetTempVector(): THREE.Vector3 {
  return TEMP_VECTOR3.set(1, 1, 1);
}

// =============================================================================
// SHARED MATERIALS - Created once, reused by all monsters
// =============================================================================

// Material cache to avoid creating new materials every frame
const materialCache = new Map<string, THREE.MeshBasicMaterial>();

// Get or create a cached material
export function getCachedMaterial(
  key: string,
  color: number,
  options: {
    transparent?: boolean;
    opacity?: number;
    wireframe?: boolean;
    side?: THREE.Side;
    depthTest?: boolean;
    depthWrite?: boolean;
  } = {}
): THREE.MeshBasicMaterial {
  const cacheKey = `${key}-${color}-${options.transparent}-${options.opacity?.toFixed(2)}-${options.wireframe}-${options.side}`;

  let material = materialCache.get(cacheKey);
  if (!material) {
    material = new THREE.MeshBasicMaterial({
      color,
      transparent: options.transparent ?? false,
      opacity: options.opacity ?? 1,
      wireframe: options.wireframe ?? false,
      side: options.side ?? THREE.FrontSide,
      depthTest: options.depthTest ?? true,
      depthWrite: options.depthWrite ?? true,
    });
    materialCache.set(cacheKey, material);
  }

  return material;
}

// =============================================================================
// SHARED GEOMETRIES FOR HP BAR
// =============================================================================

// Cache for HP bar fill geometries by percentage
const hpBarGeometryCache = new Map<number, THREE.PlaneGeometry>();

// Get cached HP bar geometry - rounds to nearest 5% to reduce cache entries
export function getHpBarGeometry(hpPercent: number): THREE.PlaneGeometry {
  // Round to nearest 5% (0, 5, 10, 15, ... 100)
  const rounded = Math.round(hpPercent * 20) * 5;
  const key = Math.max(0, Math.min(100, rounded));

  let geometry = hpBarGeometryCache.get(key);
  if (!geometry) {
    const width = (key / 100) * 30;
    geometry = new THREE.PlaneGeometry(Math.max(0.1, width), 2.5);
    hpBarGeometryCache.set(key, geometry);
  }

  return geometry;
}

// Get HP bar position X based on percentage
export function getHpBarPositionX(hpPercent: number): number {
  return -15 + hpPercent * 15;
}

// =============================================================================
// FRUSTUM CULLING HELPERS
// =============================================================================

const frustum = new THREE.Frustum();
const projScreenMatrix = new THREE.Matrix4();
const boundingSphere = new THREE.Sphere();

// Check if a position is visible in the camera frustum
export function isInFrustum(
  camera: THREE.Camera,
  position: { x: number; y: number },
  radius: number = 100
): boolean {
  // Update frustum from camera
  projScreenMatrix.multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  );
  frustum.setFromProjectionMatrix(projScreenMatrix);

  // Check if bounding sphere intersects frustum
  boundingSphere.center.set(position.x, 30, position.y);
  boundingSphere.radius = radius;

  return frustum.intersectsSphere(boundingSphere);
}

// =============================================================================
// ANIMATION FRAME THROTTLING
// =============================================================================

// Throttle animation updates based on distance from camera
export function getAnimationThrottle(
  distanceFromCamera: number,
  maxDistance: number = 2000
): number {
  // Close entities animate every frame (1)
  // Far entities animate less frequently (up to 4 = every 4th frame)
  const normalized = Math.min(1, distanceFromCamera / maxDistance);
  return Math.floor(1 + normalized * 3);
}

// Global frame counter for throttled animations
let globalFrameCount = 0;

export function getGlobalFrameCount(): number {
  return globalFrameCount;
}

export function incrementGlobalFrameCount(): void {
  globalFrameCount = (globalFrameCount + 1) % 1000;
}

// Check if entity should animate this frame
export function shouldAnimateThisFrame(
  entityIndex: number,
  throttle: number
): boolean {
  return (globalFrameCount + entityIndex) % throttle === 0;
}

// =============================================================================
// COMMON MONSTER COLORS (cached)
// =============================================================================

export const MONSTER_MATERIAL_COLORS = {
  // Original monsters
  bug: 0x8b4513,
  aihallucination: 0x9932cc,
  manager: 0x4169e1,
  boss: 0xff0000,
  unexplainedbug: 0x00ff00,
  // Common colors
  white: 0xffffff,
  black: 0x000000,
  red: 0xff0000,
  yellow: 0xffff00,
  jsYellow: 0xf7df1e,
  pythonBlue: 0x3776ab,
  pythonYellow: 0xffd43b,
  javaOrange: 0xed8b00,
  csharpPurple: 0x9b4f96,
  tsBlue: 0x3178c6,
  phpPurple: 0x777bb4,
} as const;
