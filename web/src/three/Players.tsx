import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';
import type { InterpolatedPlayer } from '../stores/gameStore';
import { Player } from './Player';
import type { EquippableItem } from './ItemPreviewComponents';

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
      groupRef.current.position.x = pos.x;
      groupRef.current.position.z = pos.y;

      // Calculate rotation based on movement direction or nearest enemy
      let targetRotation = lastRotationRef.current;

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

          const dx = otherPos.x - pos.x;
          const dy = otherPos.y - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < nearestDist) {
            nearestDist = dist;
            nearestEnemyId = other.id;
          }
        });

        if (nearestEnemyId) {
          const enemyPos = getInterpolatedPosition(nearestEnemyId);
          if (enemyPos) {
            const dx = enemyPos.x - pos.x;
            const dz = enemyPos.y - pos.y;
            targetRotation = Math.atan2(dx, dz);
          }
        }
      } else if (player.estado === 'moving') {
        // When moving, face movement direction
        const dx = player.targetX - pos.x;
        const dz = player.targetY - pos.y;
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

  // Get equipped items for current player from local inventory (for immediate UI updates)
  const localEquippedItems = useMemo(() => {
    return inventory.filter((pi) => pi.isEquipped);
  }, [inventory]);

  return (
    <>
      {Array.from(players.values()).map((player) => {
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
