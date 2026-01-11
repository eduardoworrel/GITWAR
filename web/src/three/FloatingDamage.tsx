import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../stores/gameStore';

// Throttle combat event processing to reduce re-renders
const PROCESS_EVENTS_INTERVAL_MS = 50; // Process new events every 50ms max


interface DamageNumber {
  id: string;
  targetId: string;
  attackerId: string;
  // Target position at creation time
  targetX: number;
  targetZ: number;
  // Random offset for stacking
  offsetX: number;
  offsetZ: number;
  damage: number;
  isCritical: boolean;
  isMiss: boolean;
  createdAt: number;
}

// Damage text with arc trajectory - rendered in 3D space (visible in PiP)
function DamageText({ damage }: { damage: DamageNumber }) {
  const { t } = useTranslation();
  const groupRef = useRef<THREE.Group>(null);
  const getInterpolatedPosition = useGameStore((s) => s.getInterpolatedPosition);
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);
  const [opacity, setOpacity] = useState(1);
  const [isDone, setIsDone] = useState(false);

  // Animation constants
  const DURATION = 1200; // Total animation duration in ms
  const MAX_HEIGHT = 30; // Maximum arc height in world units
  const DRIFT_AMOUNT = 22; // Horizontal drift in world units

  useFrame(() => {
    if (!groupRef.current) return;

    const age = Date.now() - damage.createdAt;
    const progress = Math.min(1, age / DURATION);

    // Follow target position in world space
    const targetPos = getInterpolatedPosition(damage.targetId);
    const baseX = targetPos ? targetPos.x : damage.targetX;
    const baseZ = targetPos ? targetPos.y : damage.targetZ;

    // Horizontal drift based on initial offset direction
    const driftX = damage.offsetX > 0 ? DRIFT_AMOUNT * progress : -DRIFT_AMOUNT * progress;

    // Parabolic arc: y = 4h*t*(1-t) - starts at 0, peaks at h when t=0.5, returns to 0
    const arcHeight = 4 * MAX_HEIGHT * progress * (1 - progress);

    // Update position - start higher (60) to avoid head collision
    groupRef.current.position.x = baseX + damage.offsetX * 10 + driftX;
    groupRef.current.position.y = 60 + arcHeight; // Start above character head
    groupRef.current.position.z = baseZ + damage.offsetZ * 10;

    // Fade out in the last 40% of animation
    if (progress > 0.6) {
      const fadeProgress = (progress - 0.6) / 0.4;
      setOpacity(1 - fadeProgress * 0.9);
    }

    if (progress >= 1 && !isDone) {
      setIsDone(true);
    }
  });

  if (isDone || opacity <= 0) return null;

  // Color coding: player takes damage = red, everything else = white
  const isPlayerTakingDamage = damage.targetId === currentPlayerId;
  const color = isPlayerTakingDamage ? '#ff2222' : '#ffffff';

  const text = damage.isMiss
    ? t('game.miss')
    : damage.isCritical
    ? `${t('game.crit')}${damage.damage}`
    : `${damage.damage}`;

  const fontSize = damage.isMiss ? 5 : 7;
  const baseOpacity = damage.isMiss ? 0.6 : 1;

  return (
    <group ref={groupRef}>
      <Billboard>
        <Text
          fontSize={fontSize}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.8}
          outlineColor="black"
          fillOpacity={opacity * baseOpacity}
          outlineOpacity={opacity * baseOpacity}
          material-depthTest={false}
          material-depthWrite={false}
          renderOrder={9999}
          fontWeight="bold"
        >
          {text}
        </Text>
      </Billboard>
    </group>
  );
}

export function FloatingDamage() {
  const combatEvents = useGameStore((s) => s.combatEvents);
  const getInterpolatedPosition = useGameStore((s) => s.getInterpolatedPosition);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const processedEventsRef = useRef<Set<string>>(new Set());
  const lastProcessTimeRef = useRef(0);
  const pendingEventsRef = useRef<typeof combatEvents>([]);

  // Memoized event processor to avoid recreating function
  const processEvents = useCallback(() => {
    const eventsToProcess = pendingEventsRef.current;
    if (eventsToProcess.length === 0) return;

    const newDamages: DamageNumber[] = [];
    const now = Date.now();

    for (const event of eventsToProcess) {
      // Skip already processed events
      if (processedEventsRef.current.has(event.id)) continue;
      processedEventsRef.current.add(event.id);

      // Only show damage/miss/critical events
      if (event.type !== 'damage' && event.type !== 'critical' && event.type !== 'miss') continue;

      // Get target position (damage originates from target)
      const targetPos = getInterpolatedPosition(event.targetId);
      if (!targetPos) continue;

      // Add random offset so multiple hits don't overlap
      const offsetX = (Math.random() - 0.5) * 1.5;
      const offsetZ = (Math.random() - 0.5) * 1.5;

      // Add damage number - originates at target
      newDamages.push({
        id: event.id,
        targetId: event.targetId,
        attackerId: event.attackerId,
        targetX: targetPos.x,
        targetZ: targetPos.y,
        offsetX,
        offsetZ,
        damage: event.damage || 0,
        isCritical: event.isCritical || event.type === 'critical',
        isMiss: event.type === 'miss',
        createdAt: now,
      });
    }

    pendingEventsRef.current = [];

    if (newDamages.length > 0) {
      setDamageNumbers((prev) => {
        // Cleanup old items and add new ones in single update
        const filtered = prev.filter((d) => now - d.createdAt < 1400);
        return [...filtered, ...newDamages];
      });
    }

    // Cleanup old processed events (keep only last 100)
    if (processedEventsRef.current.size > 200) {
      const arr = Array.from(processedEventsRef.current);
      processedEventsRef.current = new Set(arr.slice(-100));
    }
  }, [getInterpolatedPosition]);

  // Throttled event processing - batch updates instead of processing every change
  useEffect(() => {
    // Store events for batch processing
    pendingEventsRef.current = combatEvents;

    const now = Date.now();
    const timeSinceLastProcess = now - lastProcessTimeRef.current;

    if (timeSinceLastProcess >= PROCESS_EVENTS_INTERVAL_MS) {
      // Process immediately if enough time has passed
      lastProcessTimeRef.current = now;
      processEvents();
    } else {
      // Schedule processing for later
      const timeoutId = setTimeout(() => {
        lastProcessTimeRef.current = Date.now();
        processEvents();
      }, PROCESS_EVENTS_INTERVAL_MS - timeSinceLastProcess);
      return () => clearTimeout(timeoutId);
    }
  }, [combatEvents, processEvents]);

  // Periodic cleanup of old damage numbers (separate from event processing)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setDamageNumbers((prev) => prev.filter((d) => now - d.createdAt < 1400));
    }, 500); // Cleanup every 500ms
    return () => clearInterval(cleanupInterval);
  }, []);

  return (
    <>
      {damageNumbers.map((damage) => (
        <DamageText key={damage.id} damage={damage} />
      ))}
    </>
  );
}
