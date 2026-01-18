import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';

// Max concurrent projectiles for performance
const MAX_PROJECTILES = 50;

// Base projectile speed multiplier (distance per second at attackSpeed=1)
const BASE_SPEED = 50;

// Height of the arc relative to distance (parabolic curve)
const ARC_HEIGHT_FACTOR = 0.15;

// How long after landing to fade out (ms)
const FADE_DURATION = 200;

interface ActiveProjectile {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: THREE.Color;
  size: number;
  attackSpeed: number;
  startTime: number;
  duration: number; // ms
  distance: number;
}

// Pool of reusable Color objects
const colorPool: THREE.Color[] = [];
function getPooledColor(hex: string): THREE.Color {
  const color = colorPool.pop() || new THREE.Color();
  color.set(hex);
  return color;
}
function returnColor(color: THREE.Color) {
  if (colorPool.length < 100) {
    colorPool.push(color);
  }
}

export function Projectiles() {
  const combatEvents = useGameStore((s) => s.combatEvents);
  const currentPlayerPos = useGameStore((s) => s.currentPlayerPos);

  // Track active projectiles
  const activeProjectilesRef = useRef<Map<string, ActiveProjectile>>(new Map());
  const processedEventsRef = useRef<Set<string>>(new Set());

  // Instanced mesh refs
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummyMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  // Geometry and material (shared)
  const geometry = useMemo(() => new THREE.SphereGeometry(3, 8, 8), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 1,
  }), []);

  // Process new combat events with projectiles
  useEffect(() => {
    const active = activeProjectilesRef.current;
    const processed = processedEventsRef.current;

    for (const event of combatEvents) {
      // Only process damage, miss, or critical events with projectile data
      if (!event.projectile) continue;
      if (event.type !== 'damage' && event.type !== 'miss' && event.type !== 'critical') continue;
      if (processed.has(event.id)) continue;

      // Skip if we already have too many projectiles
      if (active.size >= MAX_PROJECTILES) break;

      const proj = event.projectile;
      const dx = proj.endX - proj.startX;
      const dy = proj.endY - proj.startY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Calculate duration based on distance and attackSpeed
      // Higher attackSpeed = faster projectile
      const speed = BASE_SPEED * Math.max(1, proj.attackSpeed / 10);
      const duration = (distance / speed) * 1000; // Convert to ms

      active.set(event.id, {
        id: event.id,
        startX: proj.startX,
        startY: proj.startY,
        endX: proj.endX,
        endY: proj.endY,
        color: getPooledColor(proj.color),
        size: proj.size,
        attackSpeed: proj.attackSpeed,
        startTime: Date.now(),
        duration: Math.max(100, Math.min(duration, 2000)), // Clamp to 0.1-2 seconds
        distance,
      });

      processed.add(event.id);
    }

    // Clean up old processed event IDs (keep last 200)
    if (processed.size > 200) {
      const arr = Array.from(processed);
      for (let i = 0; i < arr.length - 200; i++) {
        processed.delete(arr[i]);
      }
    }
  }, [combatEvents]);

  // Animation frame - update projectile positions
  useFrame(() => {
    const mesh = instancedMeshRef.current;
    if (!mesh) return;

    const active = activeProjectilesRef.current;
    const now = Date.now();
    const playerX = currentPlayerPos?.x ?? 0;
    const playerY = currentPlayerPos?.y ?? 0;

    // Hide all instances first
    for (let i = 0; i < MAX_PROJECTILES; i++) {
      dummyMatrix.makeScale(0, 0, 0);
      mesh.setMatrixAt(i, dummyMatrix);
    }

    let instanceIndex = 0;
    const toRemove: string[] = [];

    for (const [id, proj] of active) {
      if (instanceIndex >= MAX_PROJECTILES) break;

      const elapsed = now - proj.startTime;
      const totalDuration = proj.duration + FADE_DURATION;

      // Remove if fully faded
      if (elapsed > totalDuration) {
        toRemove.push(id);
        returnColor(proj.color);
        continue;
      }

      // Calculate progress (0-1 for travel, then fade)
      const travelProgress = Math.min(1, elapsed / proj.duration);

      // Distance culling - skip if too far from player
      const centerX = (proj.startX + proj.endX) / 2;
      const centerY = (proj.startY + proj.endY) / 2;
      const distToPlayer = Math.sqrt(
        Math.pow(centerX - playerX, 2) + Math.pow(centerY - playerY, 2)
      );
      if (distToPlayer > 1000) {
        toRemove.push(id);
        returnColor(proj.color);
        continue;
      }

      // Lerp position
      const x = proj.startX + (proj.endX - proj.startX) * travelProgress;
      const z = proj.startY + (proj.endY - proj.startY) * travelProgress;

      // Parabolic arc for Y (height)
      // y = 4h * t * (1-t) where h is max height, t is progress
      const arcHeight = proj.distance * ARC_HEIGHT_FACTOR;
      const y = 30 + 4 * arcHeight * travelProgress * (1 - travelProgress);

      // Calculate opacity for fade-out
      let opacity = 1;
      if (elapsed > proj.duration) {
        const fadeProgress = (elapsed - proj.duration) / FADE_DURATION;
        opacity = 1 - fadeProgress;
      }

      // Scale based on projectile size and slight pulsing effect
      const pulseScale = 1 + 0.1 * Math.sin(elapsed * 0.02);
      const scale = proj.size * pulseScale * 3;

      // Set position and scale
      tempPos.set(x, y, z);
      dummyMatrix.makeScale(scale, scale, scale);
      dummyMatrix.setPosition(tempPos);
      mesh.setMatrixAt(instanceIndex, dummyMatrix);

      // Set color with opacity
      tempColor.copy(proj.color);
      // Note: InstancedMesh doesn't support per-instance opacity easily
      // We'll use color brightness as a proxy for opacity
      tempColor.multiplyScalar(opacity);
      mesh.setColorAt(instanceIndex, tempColor);

      instanceIndex++;
    }

    // Clean up finished projectiles
    for (const id of toRemove) {
      active.delete(id);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
    mesh.count = instanceIndex;
  });

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[geometry, material, MAX_PROJECTILES]}
      frustumCulled={false}
    />
  );
}
