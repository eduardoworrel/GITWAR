import { createContext, useContext, useRef, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// =============================================================================
// ANIMATION MANAGER - Centralizes all animations into a single useFrame
// =============================================================================

type AnimationCallback = (delta: number, elapsedTime: number, distanceFromCamera: number) => void;

interface AnimationEntry {
  callback: AnimationCallback;
  position: THREE.Vector3;
  priority: number; // 0 = high (always animate), 1 = medium, 2 = low
}

interface AnimationContextType {
  register: (id: string, callback: AnimationCallback, position: THREE.Vector3, priority?: number) => void;
  unregister: (id: string) => void;
  updatePosition: (id: string, position: THREE.Vector3) => void;
}

const AnimationContext = createContext<AnimationContextType | null>(null);

// Global frame counter for throttling
let globalFrame = 0;

// Throttle rates based on distance
const THROTTLE_DISTANCE_NEAR = 500;   // Animate every frame
const THROTTLE_DISTANCE_MED = 1000;   // Animate every 2 frames
const THROTTLE_DISTANCE_FAR = 2000;   // Animate every 4 frames

export function AnimationManagerProvider({ children }: { children: React.ReactNode }) {
  const animations = useRef<Map<string, AnimationEntry>>(new Map());
  const { camera } = useThree();
  const elapsedTimeRef = useRef(0);
  const cameraPosition = useRef(new THREE.Vector3());

  const register = useCallback((
    id: string,
    callback: AnimationCallback,
    position: THREE.Vector3,
    priority: number = 1
  ) => {
    animations.current.set(id, { callback, position: position.clone(), priority });
  }, []);

  const unregister = useCallback((id: string) => {
    animations.current.delete(id);
  }, []);

  const updatePosition = useCallback((id: string, position: THREE.Vector3) => {
    const entry = animations.current.get(id);
    if (entry) {
      entry.position.copy(position);
    }
  }, []);

  // Single useFrame that handles ALL animations
  useFrame((_, delta) => {
    globalFrame++;
    elapsedTimeRef.current += delta;

    // Cache camera position
    cameraPosition.current.copy(camera.position);

    // Process all registered animations
    animations.current.forEach((entry, _id) => {
      // Calculate distance from camera
      const distance = cameraPosition.current.distanceTo(entry.position);

      // Determine throttle rate based on distance and priority
      let shouldAnimate = false;

      if (entry.priority === 0) {
        // High priority - always animate
        shouldAnimate = true;
      } else if (distance < THROTTLE_DISTANCE_NEAR) {
        // Near - animate every frame
        shouldAnimate = true;
      } else if (distance < THROTTLE_DISTANCE_MED) {
        // Medium distance - animate every 2 frames
        shouldAnimate = globalFrame % 2 === 0;
      } else if (distance < THROTTLE_DISTANCE_FAR) {
        // Far - animate every 4 frames
        shouldAnimate = globalFrame % 4 === 0;
      } else {
        // Very far - animate every 8 frames
        shouldAnimate = globalFrame % 8 === 0;
      }

      if (shouldAnimate) {
        try {
          entry.callback(delta, elapsedTimeRef.current, distance);
        } catch (e) {
          // Silently ignore animation errors to prevent breaking the loop
        }
      }
    });
  });

  return (
    <AnimationContext.Provider value={{ register, unregister, updatePosition }}>
      {children}
    </AnimationContext.Provider>
  );
}

// Hook to register an animation
export function useAnimation(
  id: string,
  callback: AnimationCallback,
  position: THREE.Vector3,
  deps: React.DependencyList = [],
  priority: number = 1
) {
  const ctx = useContext(AnimationContext);

  useEffect(() => {
    if (!ctx) return;

    ctx.register(id, callback, position, priority);

    return () => {
      ctx.unregister(id);
    };
  }, [id, ctx, ...deps]);

  // Return function to update position
  return useCallback((newPosition: THREE.Vector3) => {
    ctx?.updatePosition(id, newPosition);
  }, [id, ctx]);
}

// Hook to get animation context
export function useAnimationContext() {
  return useContext(AnimationContext);
}

// =============================================================================
// SHARED MATERIALS - Created once, reused everywhere
// =============================================================================

// Material cache - keyed by color and options
const materialCache = new Map<string, THREE.MeshBasicMaterial>();

export function getSharedMaterial(
  color: number | string,
  options: {
    transparent?: boolean;
    opacity?: number;
    wireframe?: boolean;
    side?: THREE.Side;
  } = {}
): THREE.MeshBasicMaterial {
  const key = `${color}-${options.transparent ?? false}-${options.opacity ?? 1}-${options.wireframe ?? false}-${options.side ?? THREE.FrontSide}`;

  let material = materialCache.get(key);
  if (!material) {
    material = new THREE.MeshBasicMaterial({
      color,
      transparent: options.transparent ?? false,
      opacity: options.opacity ?? 1,
      wireframe: options.wireframe ?? false,
      side: options.side ?? THREE.FrontSide,
    });
    materialCache.set(key, material);
  }

  return material;
}

// Pre-create common materials for monsters
export const SHARED_MATERIALS = {
  // Common colors
  white: getSharedMaterial(0xffffff),
  black: getSharedMaterial(0x000000),
  red: getSharedMaterial(0xff0000),
  redTransparent: getSharedMaterial(0xff0000, { transparent: true, opacity: 0.8 }),
  yellow: getSharedMaterial(0xffff00),
  yellowTransparent: getSharedMaterial(0xffff00, { transparent: true, opacity: 0.8 }),

  // Monster colors
  bugBrown: getSharedMaterial(0x8b4513),
  bugBrownDark: getSharedMaterial(0x533010),
  aiPurple: getSharedMaterial(0x9932cc),
  aiPurpleTransparent: getSharedMaterial(0x9932cc, { transparent: true, opacity: 0.7 }),
  aiPurpleWireframe: getSharedMaterial(0x9932cc, { transparent: true, opacity: 0.7, wireframe: true }),
  managerBlue: getSharedMaterial(0x4169e1),
  bossRed: getSharedMaterial(0xff0000),
  bossRedDark: getSharedMaterial(0x660000),
  unexplainedGreen: getSharedMaterial(0x00ff00),

  // Language colors
  jsYellow: getSharedMaterial(0xf7df1e),
  jsYellowTransparent: getSharedMaterial(0xf7df1e, { transparent: true, opacity: 0.8 }),
  pythonBlue: getSharedMaterial(0x3776ab),
  pythonYellow: getSharedMaterial(0xffd43b),
  javaOrange: getSharedMaterial(0xed8b00),
  javaRed: getSharedMaterial(0xf89820),
  csharpPurple: getSharedMaterial(0x9b4f96),
  csharpGreen: getSharedMaterial(0x68217a),
  tsBlue: getSharedMaterial(0x3178c6),
  phpPurple: getSharedMaterial(0x777bb4),
  goBlue: getSharedMaterial(0x00add8),
  rustOrange: getSharedMaterial(0xdea584),
  rubyRed: getSharedMaterial(0xcc342d),
  swiftOrange: getSharedMaterial(0xfa7343),
  kotlinPurple: getSharedMaterial(0x7f52ff),

  // Transparent variants
  ghostWhite: getSharedMaterial(0xffffff, { transparent: true, opacity: 0.3 }),
  ghostGray: getSharedMaterial(0xaaaaaa, { transparent: true, opacity: 0.3 }),
  shadowBlack: getSharedMaterial(0x000000, { transparent: true, opacity: 0.3 }),

  // Suit colors
  suitDark: getSharedMaterial(0x1a1a2e),
  shirtWhite: getSharedMaterial(0xffffff),
  skinTone: getSharedMaterial(0xffdbac),
  briefcaseBrown: getSharedMaterial(0x8b4513),
  glassesDark: getSharedMaterial(0x222222),

  // Special
  magenta: getSharedMaterial(0xff00ff),
  cyan: getSharedMaterial(0x00ffff),
  glowMagenta: getSharedMaterial(0xff00ff, { transparent: true, opacity: 0.8 }),
};

// Function to get or create a material with specific opacity
export function getMaterialWithOpacity(baseMaterial: THREE.MeshBasicMaterial, opacity: number): THREE.MeshBasicMaterial {
  if (opacity >= 1) return baseMaterial;

  const color = baseMaterial.color.getHex();
  return getSharedMaterial(color, { transparent: true, opacity });
}

// =============================================================================
// SHARED GEOMETRIES - For common shapes
// =============================================================================

export const SHARED_MONSTER_GEOMETRIES = {
  // Basic shapes
  smallSphere: new THREE.SphereGeometry(2, 8, 6),
  mediumSphere: new THREE.SphereGeometry(5, 12, 8),
  largeSphere: new THREE.SphereGeometry(8, 12, 8),

  // Boxes
  smallBox: new THREE.BoxGeometry(2, 2, 2),
  mediumBox: new THREE.BoxGeometry(6, 6, 6),
  largeBox: new THREE.BoxGeometry(10, 10, 10),

  // Cylinders
  thinCylinder: new THREE.CylinderGeometry(0.5, 0.5, 8, 6),
  mediumCylinder: new THREE.CylinderGeometry(2, 2, 10, 8),

  // Special
  icosahedron: new THREE.IcosahedronGeometry(8, 0),
  tetrahedron: new THREE.TetrahedronGeometry(4, 0),
  octahedron: new THREE.OctahedronGeometry(5, 0),
  dodecahedron: new THREE.DodecahedronGeometry(8, 0),
  torus: new THREE.TorusGeometry(12, 1, 8, 16),
  cone: new THREE.ConeGeometry(3, 8, 8),
};
