import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';

// Max distance to show level up effects (squared for performance)
const MAX_EVENT_DISTANCE_SQ = 800 * 800;

interface LevelUpDisplay {
  id: string;
  playerId: string;
  playerName: string;
  newLevel: number;
  x: number;
  z: number;
  createdAt: number;
}

// Level up text with burst animation
function LevelUpText({ levelUp }: { levelUp: LevelUpDisplay }) {
  const groupRef = useRef<THREE.Group>(null);
  const getInterpolatedPosition = useGameStore((s) => s.getInterpolatedPosition);
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(0.5);
  const [isDone, setIsDone] = useState(false);

  // Animation constants
  const DURATION = 2500; // Total animation duration in ms
  const HOLD_TIME = 1500; // Time to hold at full opacity
  const INITIAL_Y = 90;

  useFrame(() => {
    if (!groupRef.current) return;

    const age = Date.now() - levelUp.createdAt;
    const progress = Math.min(1, age / DURATION);

    // Follow player position
    const playerPos = getInterpolatedPosition(levelUp.playerId);
    const baseX = playerPos ? playerPos.x : levelUp.x;
    const baseZ = playerPos ? playerPos.y : levelUp.z;

    // Slight float upward
    const floatY = 20 * progress;

    groupRef.current.position.x = baseX;
    groupRef.current.position.y = INITIAL_Y + floatY;
    groupRef.current.position.z = baseZ;

    // Scale animation: burst in, then shrink out
    const fadeInDuration = 200;
    const fadeOutStart = HOLD_TIME;

    if (age < fadeInDuration) {
      // Burst in with overshoot
      const t = age / fadeInDuration;
      const easeOutBack = 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
      setScale(Math.min(1.2, easeOutBack));
      setOpacity(Math.min(1, t * 2));
    } else if (age < fadeOutStart) {
      // Pulse effect while holding
      const pulsePhase = (age - fadeInDuration) / 300;
      setScale(1 + 0.05 * Math.sin(pulsePhase * Math.PI * 2));
      setOpacity(1);
    } else {
      // Fade out
      const fadeProgress = (age - fadeOutStart) / (DURATION - fadeOutStart);
      setOpacity(1 - fadeProgress);
      setScale(1 + fadeProgress * 0.3);
    }

    if (progress >= 1 && !isDone) {
      setIsDone(true);
    }
  });

  if (isDone || opacity <= 0) return null;

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <Billboard>
        {/* Glow effect behind text */}
        <Text
          fontSize={10}
          color="#ffff00"
          anchorX="center"
          anchorY="middle"
          outlineWidth={2}
          outlineColor="#ff8800"
          fillOpacity={opacity * 0.8}
          outlineOpacity={opacity * 0.6}
          material-depthTest={false}
          material-depthWrite={false}
          renderOrder={9999}
          fontWeight="bold"
        >
          LEVEL UP!
        </Text>
        {/* Level number below */}
        <Text
          position={[0, -12, 0]}
          fontSize={8}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={1}
          outlineColor="#ff8800"
          fillOpacity={opacity}
          outlineOpacity={opacity}
          material-depthTest={false}
          material-depthWrite={false}
          renderOrder={9999}
          fontWeight="bold"
        >
          {`Lv.${levelUp.newLevel}`}
        </Text>
      </Billboard>
    </group>
  );
}

export function LevelUpEffect() {
  const levelUpEvents = useGameStore((s) => s.levelUpEvents);
  const getInterpolatedPosition = useGameStore((s) => s.getInterpolatedPosition);
  const [levelUps, setLevelUps] = useState<LevelUpDisplay[]>([]);
  const processedEventsRef = useRef<Set<string>>(new Set());

  // Process new level up events
  useEffect(() => {
    const newLevelUps: LevelUpDisplay[] = [];

    // Get current player position for distance culling
    const currentPlayerPos = useGameStore.getState().currentPlayerPos;
    const camX = currentPlayerPos?.x ?? 0;
    const camZ = currentPlayerPos?.y ?? 0;

    for (const event of levelUpEvents) {
      if (processedEventsRef.current.has(event.id)) continue;
      processedEventsRef.current.add(event.id);

      // Get player position
      const playerPos = getInterpolatedPosition(event.playerId);
      const x = playerPos ? playerPos.x : event.x;
      const z = playerPos ? playerPos.y : event.y;

      // Distance culling - skip events too far from camera/player
      const dx = x - camX;
      const dz = z - camZ;
      const distSq = dx * dx + dz * dz;
      if (distSq > MAX_EVENT_DISTANCE_SQ) continue;

      newLevelUps.push({
        id: event.id,
        playerId: event.playerId,
        playerName: event.playerName,
        newLevel: event.newLevel,
        x,
        z,
        createdAt: Date.now(),
      });
    }

    if (newLevelUps.length > 0) {
      setLevelUps((prev) => [...prev, ...newLevelUps]);
    }

    // Cleanup old items
    const now = Date.now();
    setLevelUps((prev) => prev.filter((l) => now - l.createdAt < 3000));

    // Cleanup old processed events
    if (processedEventsRef.current.size > 50) {
      const arr = Array.from(processedEventsRef.current);
      processedEventsRef.current = new Set(arr.slice(-25));
    }
  }, [levelUpEvents, getInterpolatedPosition]);

  return (
    <>
      {levelUps.map((levelUp) => (
        <LevelUpText key={levelUp.id} levelUp={levelUp} />
      ))}
    </>
  );
}
