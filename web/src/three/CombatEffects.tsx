import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';

// Particle types
type ParticleType = 'spark' | 'explosion' | 'respawn_light' | 'respawn_converge';

interface Particle {
  id: string;
  type: ParticleType;
  x: number;
  y: number;
  z: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  scale: number;
  color: THREE.Color;
  createdAt: number;
  duration: number;
}

// Constants
const MAX_PARTICLES = 150;

// Reusable objects for performance
const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3();
const tempColor = new THREE.Color();

export function CombatEffects() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<Particle[]>([]);
  const processedEventsRef = useRef<Set<string>>(new Set());

  const combatEvents = useGameStore((s) => s.combatEvents);

  // Process combat events and spawn particles
  // Note: We access getInterpolatedPosition via useGameStore.getState() to avoid
  // including it in dependencies, which would cause this effect to run every frame
  useEffect(() => {
    const { getInterpolatedPosition } = useGameStore.getState();

    for (const event of combatEvents) {
      // Skip already processed events
      const eventKey = `${event.id}-particles`;
      if (processedEventsRef.current.has(eventKey)) continue;
      processedEventsRef.current.add(eventKey);

      const targetPos = getInterpolatedPosition(event.targetId);
      if (!targetPos) continue;

      const now = Date.now();

      // Normal damage: small sparks
      if (event.type === 'damage' && !event.isCritical) {
        spawnSparks(targetPos.x, targetPos.y, now, particlesRef.current);
      }

      // Critical hit: explosion
      if (event.type === 'critical' || event.isCritical) {
        spawnExplosion(targetPos.x, targetPos.y, now, particlesRef.current);
      }

      // Respawn: flash + converging particles
      if (event.type === 'respawn') {
        spawnRespawnEffect(targetPos.x, targetPos.y, now, particlesRef.current);
      }
    }

    // Cleanup old processed events
    if (processedEventsRef.current.size > 200) {
      const arr = Array.from(processedEventsRef.current);
      processedEventsRef.current = new Set(arr.slice(-100));
    }
  }, [combatEvents]);

  // Animation loop
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const now = Date.now();
    const particles = particlesRef.current;

    // Update particles and remove expired ones
    let writeIndex = 0;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const age = now - p.createdAt;
      const progress = age / p.duration;

      if (progress >= 1) {
        continue; // Skip expired particles
      }

      // Update position based on velocity
      p.x += p.velocityX * delta;
      p.y += p.velocityY * delta;
      p.z += p.velocityZ * delta;

      // Apply gravity for sparks/explosion
      if (p.type === 'spark' || p.type === 'explosion') {
        p.velocityY -= 100 * delta; // Gravity
      }

      // Converging particles move inward (velocity already set toward center)
      if (p.type === 'respawn_converge') {
        // Slow down as they approach center
        p.velocityX *= 0.95;
        p.velocityZ *= 0.95;
      }

      // Calculate scale with fade out
      const fadeScale = p.type === 'respawn_light'
        ? p.scale * (1 + progress * 5) // Light expands
        : p.scale * (1 - progress); // Others shrink

      // Update instance matrix
      tempPosition.set(p.x, p.y, p.z);
      tempScale.set(fadeScale, fadeScale, fadeScale);
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      meshRef.current.setMatrixAt(writeIndex, tempMatrix);

      // Update color with opacity (using color intensity as proxy for opacity)
      const opacity = 1 - progress * 0.8;
      tempColor.copy(p.color).multiplyScalar(opacity);
      meshRef.current.setColorAt(writeIndex, tempColor);

      // Keep particle
      particles[writeIndex] = p;
      writeIndex++;
    }

    // Trim array to active particles
    particles.length = writeIndex;

    // Hide unused instances
    for (let i = writeIndex; i < MAX_PARTICLES; i++) {
      tempScale.set(0, 0, 0);
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      meshRef.current.setMatrixAt(i, tempMatrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial transparent vertexColors />
    </instancedMesh>
  );
}

// Spawn small sparks for normal attacks
function spawnSparks(x: number, z: number, now: number, particles: Particle[]) {
  if (particles.length >= MAX_PARTICLES - 4) return;

  for (let i = 0; i < 4; i++) {
    particles.push({
      id: `spark-${now}-${i}`,
      type: 'spark',
      x: x + (Math.random() - 0.5) * 10,
      y: 25 + Math.random() * 10,
      z: z + (Math.random() - 0.5) * 10,
      velocityX: (Math.random() - 0.5) * 80,
      velocityY: Math.random() * 40 + 20,
      velocityZ: (Math.random() - 0.5) * 80,
      scale: 2,
      color: new THREE.Color(0xff8800),
      createdAt: now,
      duration: 200,
    });
  }
}

// Spawn explosion for critical hits
function spawnExplosion(x: number, z: number, now: number, particles: Particle[]) {
  if (particles.length >= MAX_PARTICLES - 14) return;

  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2;
    particles.push({
      id: `explosion-${now}-${i}`,
      type: 'explosion',
      x: x,
      y: 25,
      z: z,
      velocityX: Math.cos(angle) * 120 + (Math.random() - 0.5) * 40,
      velocityY: Math.random() * 60 + 20,
      velocityZ: Math.sin(angle) * 120 + (Math.random() - 0.5) * 40,
      scale: 4,
      color: new THREE.Color(0xff2222),
      createdAt: now,
      duration: 400,
    });
  }
}

// Spawn respawn effect: light flash + converging particles
function spawnRespawnEffect(x: number, z: number, now: number, particles: Particle[]) {
  if (particles.length >= MAX_PARTICLES - 25) return;

  // Light flash at center
  particles.push({
    id: `respawn-light-${now}`,
    type: 'respawn_light',
    x: x,
    y: 15,
    z: z,
    velocityX: 0,
    velocityY: 0,
    velocityZ: 0,
    scale: 8,
    color: new THREE.Color(0xffffff),
    createdAt: now,
    duration: 300,
  });

  // Converging particles from a ring
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const radius = 80;
    const startX = x + Math.cos(angle) * radius;
    const startZ = z + Math.sin(angle) * radius;

    particles.push({
      id: `respawn-converge-${now}-${i}`,
      type: 'respawn_converge',
      x: startX,
      y: 20 + Math.random() * 15,
      z: startZ,
      velocityX: -Math.cos(angle) * 160,
      velocityY: 0,
      velocityZ: -Math.sin(angle) * 160,
      scale: 3,
      color: new THREE.Color(0xffff88),
      createdAt: now,
      duration: 500,
    });
  }
}
