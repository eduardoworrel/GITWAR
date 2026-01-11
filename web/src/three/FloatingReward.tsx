import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';

// Max distance to show floating rewards (squared for performance)
const MAX_EVENT_DISTANCE_SQ = 250 * 250;

interface RewardNumber {
  id: string;
  playerId: string;
  x: number;
  z: number;
  expGained: number;
  goldGained: number;
  offsetX: number;
  createdAt: number;
}

// Individual reward text with upward float animation
function RewardText({ reward, type }: { reward: RewardNumber; type: 'exp' | 'gold' }) {
  const groupRef = useRef<THREE.Group>(null);
  const getInterpolatedPosition = useGameStore((s) => s.getInterpolatedPosition);
  const [opacity, setOpacity] = useState(1);
  const [isDone, setIsDone] = useState(false);

  // Animation constants
  const DURATION = 1500; // Total animation duration in ms
  const FLOAT_HEIGHT = 50; // How high it floats
  const INITIAL_Y = type === 'exp' ? 70 : 80; // Gold floats slightly higher

  useFrame(() => {
    if (!groupRef.current) return;

    const age = Date.now() - reward.createdAt;
    const progress = Math.min(1, age / DURATION);

    // Follow player position
    const playerPos = getInterpolatedPosition(reward.playerId);
    const baseX = playerPos ? playerPos.x : reward.x;
    const baseZ = playerPos ? playerPos.y : reward.z;

    // Float upward with easing
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const floatY = FLOAT_HEIGHT * easeOut;

    // Slight horizontal drift based on type
    const driftX = type === 'exp' ? -15 * progress : 15 * progress;

    groupRef.current.position.x = baseX + reward.offsetX * 5 + driftX;
    groupRef.current.position.y = INITIAL_Y + floatY;
    groupRef.current.position.z = baseZ;

    // Fade out in the last 30% of animation
    if (progress > 0.7) {
      const fadeProgress = (progress - 0.7) / 0.3;
      setOpacity(1 - fadeProgress);
    }

    if (progress >= 1 && !isDone) {
      setIsDone(true);
    }
  });

  if (isDone || opacity <= 0) return null;

  const value = type === 'exp' ? reward.expGained : reward.goldGained;
  if (value <= 0) return null;

  const text = type === 'exp' ? `+${value} XP` : `+${value} G`;
  const color = type === 'exp' ? '#00ff88' : '#ffd700'; // Green for XP, Gold for gold
  const fontSize = type === 'exp' ? 5 : 4.5;

  return (
    <group ref={groupRef}>
      <Billboard>
        <Text
          fontSize={fontSize}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.6}
          outlineColor="black"
          fillOpacity={opacity}
          outlineOpacity={opacity}
          material-depthTest={false}
          material-depthWrite={false}
          renderOrder={9998}
          fontWeight="bold"
        >
          {text}
        </Text>
      </Billboard>
    </group>
  );
}

export function FloatingReward() {
  const rewardEvents = useGameStore((s) => s.rewardEvents);
  const getInterpolatedPosition = useGameStore((s) => s.getInterpolatedPosition);
  const [rewardNumbers, setRewardNumbers] = useState<RewardNumber[]>([]);
  const processedEventsRef = useRef<Set<string>>(new Set());

  // Process new reward events
  useEffect(() => {
    const newRewards: RewardNumber[] = [];

    // Get current player position for distance culling
    const currentPlayerPos = useGameStore.getState().currentPlayerPos;
    const camX = currentPlayerPos?.x ?? 0;
    const camZ = currentPlayerPos?.y ?? 0;

    for (const event of rewardEvents) {
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

      // Small random offset
      const offsetX = (Math.random() - 0.5) * 2;

      newRewards.push({
        id: event.id,
        playerId: event.playerId,
        x,
        z,
        expGained: event.expGained,
        goldGained: event.goldGained,
        offsetX,
        createdAt: Date.now(),
      });
    }

    if (newRewards.length > 0) {
      setRewardNumbers((prev) => [...prev, ...newRewards]);
    }

    // Cleanup old items
    const now = Date.now();
    setRewardNumbers((prev) => prev.filter((r) => now - r.createdAt < 1800));

    // Cleanup old processed events
    if (processedEventsRef.current.size > 100) {
      const arr = Array.from(processedEventsRef.current);
      processedEventsRef.current = new Set(arr.slice(-50));
    }
  }, [rewardEvents, getInterpolatedPosition]);

  return (
    <>
      {rewardNumbers.map((reward) => (
        <group key={reward.id}>
          {reward.expGained > 0 && <RewardText reward={reward} type="exp" />}
          {reward.goldGained > 0 && <RewardText reward={reward} type="gold" />}
        </group>
      ))}
    </>
  );
}
