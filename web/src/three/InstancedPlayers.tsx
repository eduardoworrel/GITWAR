/**
 * InstancedPlayers - Maximum Performance Player Rendering
 *
 * Uses THREE.InstancedMesh to render ALL players in minimal draw calls.
 * Colors players by ELO rank for efficient batch rendering.
 *
 * Performance: 1000+ players at 60 FPS vs 200 players at 5 FPS with individual meshes
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';
import { getCorElo } from './constants';
import { getTerrainHeight, isInTerrainArea } from './TerrainHeight';

// Maximum player instances
const MAX_INSTANCES = 5000;

// Character dimensions
const BODY_HEIGHT = 14;
const LEG_HEIGHT = 14;
const HEAD_SIZE = 12;

// Base Y offset for terrain (must match Map.tsx, Buildings.tsx, Player.tsx)
const TERRAIN_BASE_Y = -50;

// Shared geometries - created once
const BODY_GEOMETRY = new THREE.BoxGeometry(10, BODY_HEIGHT, 6);
const HEAD_GEOMETRY = new THREE.BoxGeometry(HEAD_SIZE, HEAD_SIZE, HEAD_SIZE);
const LEG_GEOMETRY = new THREE.BoxGeometry(4, LEG_HEIGHT, 4);
const ARM_GEOMETRY = new THREE.BoxGeometry(4, 14, 4);

// Reusable objects for matrix calculations (avoid GC)
const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3(1, 1, 1);
const tempEuler = new THREE.Euler();
const tempColor = new THREE.Color();

interface PlayerInstance {
  id: string;
  index: number;
  rotation: number;
  walkPhase: number;
  lastAttackTime: number | null;
  isSwinging: boolean;
}

// Shared materials - single white material that gets colored per-instance
const bodyMaterial = new THREE.MeshBasicMaterial({ vertexColors: false });
const headMaterial = new THREE.MeshBasicMaterial({ color: 0x00cccc });
const legMaterial = new THREE.MeshBasicMaterial({ vertexColors: false });
const armMaterial = new THREE.MeshBasicMaterial({ vertexColors: false });

/**
 * InstancedPlayers - Renders ALL players using instanced meshes with per-instance ELO colors
 *
 * Draw calls: 6 (body parts) vs 1200+ with individual meshes
 * Memory: Shared geometries and materials
 * CPU: Single useFrame for all players
 */
export function InstancedPlayers() {
  const bodyMeshRef = useRef<THREE.InstancedMesh>(null);
  const headMeshRef = useRef<THREE.InstancedMesh>(null);
  const leftLegMeshRef = useRef<THREE.InstancedMesh>(null);
  const rightLegMeshRef = useRef<THREE.InstancedMesh>(null);
  const leftArmMeshRef = useRef<THREE.InstancedMesh>(null);
  const rightArmMeshRef = useRef<THREE.InstancedMesh>(null);

  // Access store methods once - they don't change
  const getInterpolatedPosition = useGameStore((s) => s.getInterpolatedPosition);
  const getLastAttackTime = useGameStore((s) => s.getLastAttackTime);

  // Track player instances
  const instancesRef = useRef<Map<string, PlayerInstance>>(new Map());
  const countRef = useRef(0);

  // Single animation loop for ALL players
  useFrame((_, delta) => {
    const meshes = [
      bodyMeshRef.current,
      headMeshRef.current,
      leftLegMeshRef.current,
      rightLegMeshRef.current,
      leftArmMeshRef.current,
      rightArmMeshRef.current
    ];

    if (meshes.some(m => !m)) return;

    // Access players directly from store state to avoid re-renders
    const players = useGameStore.getState().players;
    const instances = instancesRef.current;
    const allPlayers = Array.from(players.values()).filter(
      p => p.type === 'player' || p.type === undefined
    );

    // Update instance count
    const count = Math.min(allPlayers.length, MAX_INSTANCES);
    countRef.current = count;

    // Update instance map and remove stale entries
    const currentIds = new Set(allPlayers.map(p => p.id));
    for (const id of instances.keys()) {
      if (!currentIds.has(id)) {
        instances.delete(id);
      }
    }

    // Process each player
    allPlayers.forEach((player, i) => {
      if (i >= MAX_INSTANCES) return;

      const pos = getInterpolatedPosition(player.id);
      if (!pos) return;

      // Get or create instance data
      let instance = instances.get(player.id);
      if (!instance) {
        instance = {
          id: player.id,
          index: i,
          rotation: 0,
          walkPhase: Math.random() * Math.PI * 2,
          lastAttackTime: null,
          isSwinging: false
        };
        instances.set(player.id, instance);
      }
      instance.index = i;

      const isWalking = player.estado === 'walking' || player.estado === 'moving';
      const isDead = player.estado === 'dead';

      // Calculate rotation based on movement
      let targetRotation = instance.rotation;
      if (player.estado === 'moving') {
        const dx = player.targetX - pos.x;
        const dz = player.targetY - pos.y;
        if (dx * dx + dz * dz > 1) {
          targetRotation = Math.atan2(dx, dz);
        }
      }

      // Smooth rotation
      const rotDiff = targetRotation - instance.rotation;
      const normalizedDiff = Math.atan2(Math.sin(rotDiff), Math.cos(rotDiff));
      instance.rotation += normalizedDiff * 0.15;

      // Walking animation
      if (isWalking) {
        instance.walkPhase += delta * 8;
      }

      const legSwing = isWalking ? Math.sin(instance.walkPhase) * 0.8 : 0;

      // Calculate terrain height for this player's position
      const terrainHeight = getTerrainHeight(pos.x, pos.y);
      const terrainOffset = terrainHeight > 0
        ? (isInTerrainArea(pos.x, pos.y) ? TERRAIN_BASE_Y + terrainHeight : terrainHeight)
        : 0;
      const baseY = LEG_HEIGHT + terrainOffset;

      // Per-instance ELO color
      const eloColor = getCorElo(player.elo ?? 1000);
      tempColor.set(eloColor);

      // Set body and arm colors
      bodyMeshRef.current!.setColorAt(i, tempColor);
      leftArmMeshRef.current!.setColorAt(i, tempColor);
      rightArmMeshRef.current!.setColorAt(i, tempColor);

      // Leg color is darker version of ELO color
      const legColor = tempColor.clone().multiplyScalar(0.6);
      leftLegMeshRef.current!.setColorAt(i, legColor);
      rightLegMeshRef.current!.setColorAt(i, legColor);

      // Head color (cyan for all)
      tempColor.set(0x00cccc);
      headMeshRef.current!.setColorAt(i, tempColor);

      // === BODY ===
      tempPosition.set(pos.x, baseY + BODY_HEIGHT / 2, pos.y);
      tempEuler.set(isDead ? -Math.PI / 2 : 0, instance.rotation, 0);
      tempQuaternion.setFromEuler(tempEuler);
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      bodyMeshRef.current!.setMatrixAt(i, tempMatrix);

      // === HEAD ===
      tempPosition.set(pos.x, baseY + BODY_HEIGHT + HEAD_SIZE / 2, pos.y);
      const headOffsetX = Math.sin(instance.rotation) * 0;
      const headOffsetZ = Math.cos(instance.rotation) * 0;
      tempPosition.x += headOffsetX;
      tempPosition.z += headOffsetZ;
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      headMeshRef.current!.setMatrixAt(i, tempMatrix);

      // === LEFT LEG ===
      tempPosition.set(pos.x - 3, baseY - LEG_HEIGHT / 2, pos.y);
      tempEuler.set(legSwing, instance.rotation, 0);
      tempQuaternion.setFromEuler(tempEuler);
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      leftLegMeshRef.current!.setMatrixAt(i, tempMatrix);

      // === RIGHT LEG ===
      tempPosition.set(pos.x + 3, baseY - LEG_HEIGHT / 2, pos.y);
      tempEuler.set(-legSwing, instance.rotation, 0);
      tempQuaternion.setFromEuler(tempEuler);
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      rightLegMeshRef.current!.setMatrixAt(i, tempMatrix);

      // === LEFT ARM ===
      tempPosition.set(pos.x - 8, baseY + BODY_HEIGHT - 7, pos.y);
      tempEuler.set(0, instance.rotation, 0);
      tempQuaternion.setFromEuler(tempEuler);
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      leftArmMeshRef.current!.setMatrixAt(i, tempMatrix);

      // === RIGHT ARM (with attack animation) ===
      let armSwing = 0;
      const playerLastAttack = getLastAttackTime(player.id);
      if (player.estado === 'attacking' && instance.lastAttackTime !== playerLastAttack) {
        instance.lastAttackTime = playerLastAttack;
        instance.isSwinging = true;
      }
      if (instance.isSwinging && instance.lastAttackTime) {
        const elapsed = Date.now() - instance.lastAttackTime;
        const progress = Math.min(1, elapsed / 250);
        armSwing = Math.sin(progress * Math.PI) * 1.5;
        if (progress >= 1) instance.isSwinging = false;
      }
      tempPosition.set(pos.x + 8, baseY + BODY_HEIGHT - 7, pos.y);
      tempEuler.set(-armSwing, instance.rotation, 0);
      tempQuaternion.setFromEuler(tempEuler);
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      rightArmMeshRef.current!.setMatrixAt(i, tempMatrix);
    });

    // Mark matrices and colors as needing update
    const safeCount = Math.max(0, Math.min(count, MAX_INSTANCES)) | 0;
    meshes.forEach(mesh => {
      if (mesh) {
        mesh.count = safeCount;
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
    });
  });

  return (
    <group>
      <instancedMesh
        ref={bodyMeshRef}
        args={[BODY_GEOMETRY, bodyMaterial, MAX_INSTANCES]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={headMeshRef}
        args={[HEAD_GEOMETRY, headMaterial, MAX_INSTANCES]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={leftLegMeshRef}
        args={[LEG_GEOMETRY, legMaterial, MAX_INSTANCES]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={rightLegMeshRef}
        args={[LEG_GEOMETRY, legMaterial, MAX_INSTANCES]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={leftArmMeshRef}
        args={[ARM_GEOMETRY, armMaterial, MAX_INSTANCES]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={rightArmMeshRef}
        args={[ARM_GEOMETRY, armMaterial, MAX_INSTANCES]}
        frustumCulled={false}
      />
    </group>
  );
}
