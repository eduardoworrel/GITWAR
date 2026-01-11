import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { IsometricCamera } from './IsometricCamera';
import { GameMap } from './Map';
import { Players } from './Players';
import { FloatingDamage } from './FloatingDamage';
import { FloatingReward } from './FloatingReward';
import { LevelUpEffect } from './LevelUpEffect';
import { CombatEffects } from './CombatEffects';
import { RadialMenuOverlay } from '../components/RadialMenuOverlay';
import { useGameStore } from '../stores/gameStore';
import { MAP_WIDTH, MAP_HEIGHT } from './constants';

// Smooth lerp for menu position
const menuPosRef = { x: 0, y: 0, initialized: false };

// Component that calculates screen position for radial menu
// Updates DOM directly via ref to avoid React re-renders
function RadialMenuPositionCalculator() {
  const selectedPlayer = useGameStore((s) => s.selectedPlayerForMenu);
  const getInterpolatedPosition = useGameStore((s) => s.getInterpolatedPosition);
  const { camera, size } = useThree();

  useFrame(() => {
    // Find the radial menu element directly
    const menuEl = document.getElementById('radial-menu-overlay');
    if (!menuEl) return;

    if (!selectedPlayer) {
      menuEl.style.opacity = '0';
      menuEl.style.pointerEvents = 'none';
      menuPosRef.initialized = false;
      return;
    }

    const pos = getInterpolatedPosition(selectedPlayer.id);
    if (!pos) {
      menuEl.style.opacity = '0';
      menuEl.style.pointerEvents = 'none';
      return;
    }

    // Create 3D vector at player position (above head)
    const worldPos = new THREE.Vector3(pos.x, 70, pos.y);

    // Project to normalized device coordinates
    const ndc = worldPos.clone().project(camera);

    // Convert to screen coordinates
    const targetX = (ndc.x * 0.5 + 0.5) * size.width;
    const targetY = (-ndc.y * 0.5 + 0.5) * size.height;

    // Initialize or lerp to target position
    if (!menuPosRef.initialized) {
      menuPosRef.x = targetX;
      menuPosRef.y = targetY;
      menuPosRef.initialized = true;
    } else {
      // Smooth lerp - higher value = more responsive but potentially more jittery
      // Lower value = smoother but more laggy
      const lerpFactor = 0.15;
      menuPosRef.x += (targetX - menuPosRef.x) * lerpFactor;
      menuPosRef.y += (targetY - menuPosRef.y) * lerpFactor;
    }

    // Use transform instead of left/top for GPU acceleration
    menuEl.style.opacity = '1';
    menuEl.style.pointerEvents = 'auto';
    menuEl.style.transform = `translate3d(${menuPosRef.x}px, ${menuPosRef.y}px, 0) translate(-50%, -50%)`;
  });

  return null;
}

function SceneContent() {
  // Initialize to map center so camera doesn't show map corner while waiting for player data
  const targetRef = useRef<[number, number, number]>([MAP_WIDTH / 2, 30, MAP_HEIGHT / 2]);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);
  const getInterpolatedPosition = useGameStore((s) => s.getInterpolatedPosition);
  const setCurrentPlayerPos = useGameStore((s) => s.setCurrentPlayerPos);
  const setSelectedPlayerForMenu = useGameStore((s) => s.setSelectedPlayerForMenu);

  // Update camera target every frame
  // Also cache the position for the current player mesh to use (prevents jitter)
  useFrame(() => {
    // No longer calling setFrameTime - getInterpolatedPosition uses Date.now() directly
    // This avoids triggering 60 Zustand re-renders per second
    if (currentPlayerId) {
      const pos = getInterpolatedPosition(currentPlayerId);
      if (pos) {
        // Y=30 targets the body/chest area instead of feet
        targetRef.current = [pos.x, 30, pos.y];

        // Only update Zustand if position changed significantly (> 0.1 units)
        // This prevents unnecessary re-renders while still caching position for jitter prevention
        const lastPos = lastPosRef.current;
        if (!lastPos || Math.abs(pos.x - lastPos.x) > 0.1 || Math.abs(pos.y - lastPos.y) > 0.1) {
          lastPosRef.current = pos;
          setCurrentPlayerPos(pos);
        }
      }
    }
  });

  return (
    <>
      {/* Perspective 3D camera - follows current player */}
      <IsometricCamera targetRef={targetRef} fov={50} />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[100, 200, 100]} intensity={0.8} castShadow />

      {/* Map (desk) */}
      <GameMap />

      {/* Background click catcher to close radial menu */}
      <mesh
        position={[0, -10, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={() => setSelectedPlayerForMenu(null)}
      >
        <planeGeometry args={[10000, 10000]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Dynamic players from store */}
      <Players />

      {/* Combat particle effects (sparks, explosions, respawn) */}
      <CombatEffects />

      {/* Floating damage numbers */}
      <FloatingDamage />

      {/* Floating XP/Gold rewards */}
      <FloatingReward />

      {/* Level up effects */}
      <LevelUpEffect />

      {/* Calculate screen position for radial menu */}
      <RadialMenuPositionCalculator />
    </>
  );
}

export function GameScene() {
  return (
    <>
      <Canvas
        style={{ width: '100vw', height: '100vh', background: '#000' }}
        gl={{
          antialias: true,
          alpha: false,
          depth: true,
          stencil: false,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
        }}
        dpr={[1, 2]}
        flat
        legacy
      >
        <SceneContent />
      </Canvas>
      {/* Radial menu overlay - rendered outside Canvas */}
      <RadialMenuOverlay />
    </>
  );
}
