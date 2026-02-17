import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { IsometricCamera } from './IsometricCamera';
import { GameMap } from './Map';
import { Players } from './Players';
import { FloatingDamage } from './FloatingDamage';
import { FloatingReward } from './FloatingReward';
import { LevelUpEffect } from './LevelUpEffect';
import { CombatEffects } from './CombatEffects';
import { Projectiles } from './Projectile';
import { PerformanceStatsConnector, PerformanceMonitorUI } from '../components/PerformanceMonitor';
import { useGameStore } from '../stores/gameStore';
import { MAP_WIDTH, MAP_HEIGHT } from './constants';
import { AnimationManagerProvider } from './AnimationManager';
import { getTerrainHeight, isInTerrainArea } from './TerrainHeight';

// Base Y for terrain - must match other files
const TERRAIN_BASE_Y = -50;

function SceneContent() {
  // Initialize to map center so camera doesn't show map corner while waiting for player data
  const targetRef = useRef<[number, number, number]>([MAP_WIDTH / 2, 30, MAP_HEIGHT / 2]);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);
  const getInterpolatedPosition = useGameStore((s) => s.getInterpolatedPosition);
  const setCurrentPlayerPos = useGameStore((s) => s.setCurrentPlayerPos);
  // Update camera target every frame
  // Also cache the position for the current player mesh to use (prevents jitter)
  useFrame(() => {
    // No longer calling setFrameTime - getInterpolatedPosition uses Date.now() directly
    // This avoids triggering 60 Zustand re-renders per second
    if (currentPlayerId) {
      const pos = getInterpolatedPosition(currentPlayerId);
      if (pos) {
        // Calculate terrain height at player position
        const terrainHeight = getTerrainHeight(pos.x, pos.y);
        const terrainY = terrainHeight > 0
        ? (isInTerrainArea(pos.x, pos.y) ? TERRAIN_BASE_Y + terrainHeight : terrainHeight)
        : 0;
        // Y targets the body/chest area (30 units above terrain)
        targetRef.current = [pos.x, terrainY + 30, pos.y];

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

      {/* Dynamic players from store */}
      <Players />

      {/* Combat particle effects (sparks, explosions, respawn) */}
      <CombatEffects />

      {/* Projectiles for ranged attacks */}
      <Projectiles />

      {/* Floating damage numbers */}
      <FloatingDamage />

      {/* Floating XP/Gold rewards */}
      <FloatingReward />

      {/* Level up effects */}
      <LevelUpEffect />

      {/* Performance stats collector (F3 to show UI) */}
      <PerformanceStatsConnector />
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
        <AnimationManagerProvider>
          <SceneContent />
        </AnimationManagerProvider>
      </Canvas>
      {/* Performance monitor UI (F3 to toggle) */}
      <PerformanceMonitorUI />
    </>
  );
}
