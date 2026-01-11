import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useRef, useMemo, useCallback, useState } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';
import type { InterpolatedPlayer } from '../stores/gameStore';
import { Player } from './Player';
import type { EquippableItem } from './ItemPreviewComponents';
import { incrementGlobalFrameCount } from './optimizations';

// Frustum culling - reusable objects
const frustum = new THREE.Frustum();
const projScreenMatrix = new THREE.Matrix4();
const boundingSphere = new THREE.Sphere();
const CULLING_RADIUS = 150; // Entity bounding sphere radius
const CULLING_UPDATE_FRAMES = 5; // Update culling every N frames
const MAX_RENDER_DISTANCE_SQ = 300 * 300; // Max distance to render entities (squared)

// Shared geometry for click hitbox
const HITBOX_GEOMETRY = new THREE.CylinderGeometry(15, 15, 50, 8);

interface InterpolatedPlayerMeshProps {
  player: InterpolatedPlayer;
  isCurrentPlayer: boolean;
  equippedItems?: EquippableItem[];
}

function InterpolatedPlayerMesh({ player, isCurrentPlayer, equippedItems = [] }: InterpolatedPlayerMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const getInterpolatedPosition = useGameStore((s) => s.getInterpolatedPosition);
  const getLastAttackTime = useGameStore((s) => s.getLastAttackTime);
  const setCurrentPlayerRotation = useGameStore((s) => s.setCurrentPlayerRotation);
  const setSelectedPlayerForMenu = useGameStore((s) => s.setSelectedPlayerForMenu);
  const players = useGameStore((s) => s.players);
  const lastRotationRef = useRef(0);
  // Smoothed position to eliminate jitter
  const smoothedPosRef = useRef<{ x: number; z: number } | null>(null);

  // Only allow clicking on players (not monsters)
  const isClickable = player.type === 'player' || player.type === undefined;

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (!isClickable) return;
    e.stopPropagation();
    const pos = getInterpolatedPosition(player.id);
    if (pos) {
      setSelectedPlayerForMenu({
        id: player.id,
        githubLogin: player.githubLogin,
        position: pos,
      });
    }
  }, [player.id, player.githubLogin, isClickable, getInterpolatedPosition, setSelectedPlayerForMenu]);

  // Get last attack time for this player (triggers arm animation)
  const lastAttackTime = getLastAttackTime(player.id);

  useFrame(() => {
    if (!groupRef.current) return;

    // For current player, use the cached position from Scene.tsx (same as camera target)
    // This prevents jitter from separate calculations
    // For other players, calculate normally
    let pos: { x: number; y: number } | null;
    if (isCurrentPlayer) {
      pos = useGameStore.getState().currentPlayerPos;
    } else {
      pos = getInterpolatedPosition(player.id);
    }

    if (pos) {
      // Initialize smoothed position on first frame
      if (!smoothedPosRef.current) {
        smoothedPosRef.current = { x: pos.x, z: pos.y };
      }

      // Smooth the position to eliminate micro-jitter from interpolation discontinuities
      // Higher factor = more responsive but more jitter, lower = smoother but more lag
      const smoothFactor = 0.25;
      smoothedPosRef.current.x += (pos.x - smoothedPosRef.current.x) * smoothFactor;
      smoothedPosRef.current.z += (pos.y - smoothedPosRef.current.z) * smoothFactor;

      groupRef.current.position.x = smoothedPosRef.current.x;
      groupRef.current.position.z = smoothedPosRef.current.z;

      // Calculate rotation based on movement direction or nearest enemy
      let targetRotation = lastRotationRef.current;

      // Use smoothed position for rotation calculations
      const myX = smoothedPosRef.current.x;
      const myZ = smoothedPosRef.current.z;

      if (player.estado === 'attacking') {
        // When attacking, find nearest enemy and face them
        let nearestEnemyId: string | null = null;
        let nearestDist = Infinity;

        players.forEach((other) => {
          if (other.id === player.id) return;
          if (other.reino === player.reino) return;
          if (other.estado === 'dead') return;

          const otherPos = getInterpolatedPosition(other.id);
          if (!otherPos) return;

          const dx = otherPos.x - myX;
          const dy = otherPos.y - myZ;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < nearestDist) {
            nearestDist = dist;
            nearestEnemyId = other.id;
          }
        });

        if (nearestEnemyId) {
          const enemyPos = getInterpolatedPosition(nearestEnemyId);
          if (enemyPos) {
            const dx = enemyPos.x - myX;
            const dz = enemyPos.y - myZ;
            targetRotation = Math.atan2(dx, dz);
          }
        }
      } else if (player.estado === 'moving') {
        // When moving, face movement direction
        const dx = player.targetX - myX;
        const dz = player.targetY - myZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 1) {
          targetRotation = Math.atan2(dx, dz);
        }
      }

      // Smoothly interpolate rotation
      const rotationDiff = targetRotation - lastRotationRef.current;
      // Handle wrapping around PI/-PI
      const normalizedDiff = Math.atan2(Math.sin(rotationDiff), Math.cos(rotationDiff));
      lastRotationRef.current += normalizedDiff * 0.15;

      groupRef.current.rotation.y = lastRotationRef.current;

      // Store rotation for camera to follow (current player only)
      if (isCurrentPlayer) {
        setCurrentPlayerRotation(lastRotationRef.current);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Invisible clickable hitbox */}
      {isClickable && (
        <mesh
          geometry={HITBOX_GEOMETRY}
          position={[0, 25, 0]}
          onClick={handleClick}
          onPointerOver={() => {
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'grab';
          }}
        >
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
      <Player
        position={[0, 0, 0]}
        reino={player.reino}
        isCurrentPlayer={isCurrentPlayer}
        hp={player.hp}
        maxHp={player.maxHp}
        type={player.type}
        githubLogin={player.githubLogin}
        estado={player.estado}
        lastAttackTime={lastAttackTime}
        equippedItems={equippedItems}
        level={player.level}
      />
    </group>
  );
}

export function Players() {
  const players = useGameStore((s) => s.players);
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);
  const inventory = useGameStore((s) => s.inventory);
  const getInterpolatedPosition = useGameStore((s) => s.getInterpolatedPosition);
  const { camera } = useThree();

  // Track which entities are visible (frustum culling)
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const frameCountRef = useRef(0);

  // Update frustum culling periodically (not every frame)
  useFrame(() => {
    // Increment global frame counter for throttled animations
    incrementGlobalFrameCount();

    frameCountRef.current++;
    if (frameCountRef.current % CULLING_UPDATE_FRAMES !== 0) return;

    // Update frustum from camera
    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(projScreenMatrix);

    const newVisible = new Set<string>();

    // Get current player position for distance culling
    const currentPlayerPos = useGameStore.getState().currentPlayerPos;
    const myX = currentPlayerPos?.x ?? 0;
    const myZ = currentPlayerPos?.y ?? 0;

    players.forEach((player) => {
      // Always show current player
      if (player.id === currentPlayerId) {
        newVisible.add(player.id);
        return;
      }

      // Get interpolated position for culling check
      const pos = getInterpolatedPosition(player.id);
      if (!pos) return;

      // Distance culling - skip entities too far from current player
      const dx = pos.x - myX;
      const dz = pos.y - myZ;
      const distSq = dx * dx + dz * dz;
      if (distSq > MAX_RENDER_DISTANCE_SQ) return;

      // Check if in frustum
      boundingSphere.center.set(pos.x, 50, pos.y);
      boundingSphere.radius = CULLING_RADIUS;

      if (frustum.intersectsSphere(boundingSphere)) {
        newVisible.add(player.id);
      }
    });

    // Only update state if visibility changed
    if (newVisible.size !== visibleIds.size ||
        ![...newVisible].every(id => visibleIds.has(id))) {
      setVisibleIds(newVisible);
    }
  });

  // Get equipped items for current player from local inventory (for immediate UI updates)
  const localEquippedItems = useMemo(() => {
    return inventory.filter((pi) => pi.isEquipped);
  }, [inventory]);

  return (
    <>
      {Array.from(players.values())
        .filter((player) => {
          // Always render current player
          if (player.id === currentPlayerId) return true;
          // Skip dead entities that have been dead for a while (reduce render count)
          if (player.estado === 'dead') return true; // Still show dead for ghost effect
          // Frustum culling - only render visible entities
          return visibleIds.has(player.id);
        })
        .map((player) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          // For current player: use local inventory if available (immediate updates), else server state
          // For other players: use server state
          const equippedItems: EquippableItem[] = isCurrentPlayer && localEquippedItems.length > 0
            ? localEquippedItems
            : (player.equippedItems ?? []);
          return (
            <InterpolatedPlayerMesh
              key={player.id}
              player={player}
              isCurrentPlayer={isCurrentPlayer}
              equippedItems={equippedItems}
            />
          );
        })}
    </>
  );
}
