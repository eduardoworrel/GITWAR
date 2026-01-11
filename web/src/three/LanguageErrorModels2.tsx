// @ts-nocheck
// Models may not use all props - each has its own internal color scheme
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNIT_VECTOR3 } from './optimizations';
import { getSharedMaterial, SHARED_MATERIALS } from './AnimationManager';

interface ErrorModelProps {
  color: number;
  opacity: number;
  isWalking: boolean;
  lastAttackTime: number | null;
}

// ============================================================================
// GO ERRORS
// ============================================================================

// Go nil panic - Gopher zumbi
export function GoNilPanicModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Zombie shamble
    if (isWalking) {
      groupRef.current.rotation.z = Math.sin(phaseRef.current * 4) * 0.15;
    }

    // Attack lunge
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.position.z = 10;
    }
    groupRef.current.position.z *= 0.9;
  });

  const goBlue = 0x00add8;
  const zombieGreen = 0x556b2f;

  return (
    <group ref={groupRef}>
      {/* Gopher body - zombified */}
      <mesh ref={bodyRef} position={[0, 12, 0]}>
        <capsuleGeometry args={[8, 10, 8, 16]} />
        <meshBasicMaterial color={zombieGreen} transparent opacity={opacity} />
      </mesh>

      {/* Big zombie eyes */}
      <mesh position={[-4, 18, 6]}>
        <sphereGeometry args={[4, 12, 12]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      <mesh position={[4, 18, 6]}>
        <sphereGeometry args={[4, 12, 12]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      {/* X eyes */}
      <mesh position={[-4, 18, 9]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[3, 0.5, 0.5]} />
        <meshBasicMaterial color={0xff0000} />
      </mesh>
      <mesh position={[-4, 18, 9]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[3, 0.5, 0.5]} />
        <meshBasicMaterial color={0xff0000} />
      </mesh>
      <mesh position={[4, 18, 9]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[3, 0.5, 0.5]} />
        <meshBasicMaterial color={0xff0000} />
      </mesh>
      <mesh position={[4, 18, 9]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[3, 0.5, 0.5]} />
        <meshBasicMaterial color={0xff0000} />
      </mesh>

      {/* Ears */}
      <mesh position={[-6, 25, 0]}>
        <sphereGeometry args={[3, 8, 8]} />
        <meshBasicMaterial color={zombieGreen} transparent opacity={opacity} />
      </mesh>
      <mesh position={[6, 25, 0]}>
        <sphereGeometry args={[3, 8, 8]} />
        <meshBasicMaterial color={zombieGreen} transparent opacity={opacity} />
      </mesh>

      {/* "nil" text */}
      <mesh position={[0, 30, 0]}>
        <boxGeometry args={[10, 4, 1]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>

      {/* Teeth */}
      <mesh position={[0, 8, 8]}>
        <boxGeometry args={[6, 2, 2]} />
        <meshBasicMaterial color={0xffffcc} />
      </mesh>
    </group>
  );
}

// Go Deadlock - Dois gophers presos em abraço eterno
export function GoDeadlockModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const rotationRef = useRef(0);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;
    rotationRef.current += delta * 0.2;

    // Slow rotation - they're stuck
    groupRef.current.rotation.y = rotationRef.current;

    // Attack - brief struggle
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.scale.setScalar(1.2);
    }
    groupRef.current.scale.lerp(UNIT_VECTOR3, 0.1);
  });

  const goBlue = 0x00add8;

  return (
    <group ref={groupRef}>
      {/* Gopher 1 */}
      <group position={[-8, 12, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <capsuleGeometry args={[5, 6, 8, 16]} />
          <meshBasicMaterial color={goBlue} transparent opacity={opacity} />
        </mesh>
        {/* Arms reaching */}
        <mesh position={[0, 3, 6]} rotation={[0.5, 0, 0]}>
          <capsuleGeometry args={[1.5, 6, 4, 8]} />
          <meshBasicMaterial color={goBlue} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* Gopher 2 */}
      <group position={[8, 12, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <capsuleGeometry args={[5, 6, 8, 16]} />
          <meshBasicMaterial color={goBlue} transparent opacity={opacity} />
        </mesh>
        {/* Arms reaching */}
        <mesh position={[0, 3, 6]} rotation={[0.5, 0, 0]}>
          <capsuleGeometry args={[1.5, 6, 4, 8]} />
          <meshBasicMaterial color={goBlue} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* Chain/lock between them */}
      <mesh position={[0, 15, 0]}>
        <torusGeometry args={[5, 1, 8, 16]} />
        <meshBasicMaterial color={0x888888} transparent opacity={opacity} />
      </mesh>

      {/* "DEADLOCK" text */}
      <mesh position={[0, 28, 0]}>
        <boxGeometry args={[18, 4, 1]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// Go Import Cycle - Cobra engolindo própria cauda
export function GoImportCycleModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const segmentsRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Rotating ouroboros
    groupRef.current.rotation.z += delta * 0.5;

    // Segments pulse
    segmentsRef.current.forEach((seg, i) => {
      if (seg) {
        const scale = 1 + Math.sin(phaseRef.current + i * 0.3) * 0.1;
        seg.scale.setScalar(scale);
      }
    });

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.rotation.z += Math.PI / 2;
    }
  });

  const goBlue = 0x00add8;
  const segments = 12;

  return (
    <group ref={groupRef} position={[0, 18, 0]}>
      {/* Circular snake */}
      {Array.from({ length: segments }).map((_, i) => {
        const angle = (i / segments) * Math.PI * 2;
        const radius = 12;
        return (
          <mesh
            key={`seg-${i}`}
            ref={(el) => { if (el) segmentsRef.current[i] = el; }}
            position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]}
          >
            <sphereGeometry args={[3 - (i === 0 ? 0 : i * 0.1), 8, 8]} />
            <meshBasicMaterial color={goBlue} transparent opacity={opacity} />
          </mesh>
        );
      })}

      {/* Head eating tail */}
      <mesh position={[12, 0, 0]}>
        <coneGeometry args={[4, 6, 8]} />
        <meshBasicMaterial color={goBlue} transparent opacity={opacity} />
      </mesh>

      {/* Arrow showing cycle */}
      <mesh position={[0, 0, 5]} rotation={[0, 0, phaseRef.current]}>
        <torusGeometry args={[8, 0.5, 8, 16, Math.PI * 1.5]} />
        <meshBasicMaterial color={0xffaa00} transparent opacity={opacity * 0.5} />
      </mesh>
    </group>
  );
}

// ============================================================================
// RUST ERRORS
// ============================================================================

// Rust Borrow Checker - Caranguejo com garras que prendem
export function RustBorrowCheckerModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftClawRef = useRef<THREE.Group>(null);
  const rightClawRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Claws open and close
    if (leftClawRef.current) {
      leftClawRef.current.rotation.z = Math.sin(phaseRef.current) * 0.3;
    }
    if (rightClawRef.current) {
      rightClawRef.current.rotation.z = -Math.sin(phaseRef.current) * 0.3;
    }

    // Attack - claws snap
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (leftClawRef.current) leftClawRef.current.rotation.z = 0;
      if (rightClawRef.current) rightClawRef.current.rotation.z = 0;
    }
  });

  const rustOrange = 0xdea584;
  const rustBrown = 0x8b4513;

  return (
    <group ref={groupRef}>
      {/* Crab body */}
      <mesh position={[0, 10, 0]}>
        <sphereGeometry args={[10, 12, 8]} />
        <meshBasicMaterial color={rustOrange} transparent opacity={opacity} />
      </mesh>

      {/* Shell pattern */}
      <mesh position={[0, 12, 5]}>
        <boxGeometry args={[12, 8, 2]} />
        <meshBasicMaterial color={rustBrown} transparent opacity={opacity} />
      </mesh>

      {/* Left claw */}
      <group ref={leftClawRef} position={[-15, 10, 5]}>
        <mesh>
          <boxGeometry args={[8, 4, 3]} />
          <meshBasicMaterial color={rustOrange} transparent opacity={opacity} />
        </mesh>
        <mesh position={[-5, 3, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[6, 2, 2]} />
          <meshBasicMaterial color={rustOrange} transparent opacity={opacity} />
        </mesh>
        <mesh position={[-5, -1, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[6, 2, 2]} />
          <meshBasicMaterial color={rustOrange} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* Right claw */}
      <group ref={rightClawRef} position={[15, 10, 5]}>
        <mesh>
          <boxGeometry args={[8, 4, 3]} />
          <meshBasicMaterial color={rustOrange} transparent opacity={opacity} />
        </mesh>
        <mesh position={[5, 3, 0]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[6, 2, 2]} />
          <meshBasicMaterial color={rustOrange} transparent opacity={opacity} />
        </mesh>
        <mesh position={[5, -1, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[6, 2, 2]} />
          <meshBasicMaterial color={rustOrange} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* Eyes on stalks */}
      <mesh position={[-4, 18, 6]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>
      <mesh position={[4, 18, 6]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>

      {/* Legs */}
      {[-1, 1].map((side) =>
        [0, 1, 2].map((i) => (
          <mesh
            key={`leg-${side}-${i}`}
            position={[side * 12, 5, -3 + i * 3]}
            rotation={[0, 0, side * 0.5]}
          >
            <cylinderGeometry args={[1, 0.5, 8, 6]} />
            <meshBasicMaterial color={rustOrange} transparent opacity={opacity} />
          </mesh>
        ))
      )}
    </group>
  );
}

// Rust panic! - Caranguejo explodindo
export function RustPanicModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const fragmentsRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);
  const explodedRef = useRef(false);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 3;

    // Fragments shake/float
    fragmentsRef.current.forEach((frag, i) => {
      if (frag) {
        frag.rotation.x += delta * (i + 1);
        frag.rotation.y += delta * (i + 0.5);
        frag.position.y = 15 + Math.sin(phaseRef.current + i) * 3;
      }
    });

    // Attack - explosion
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      fragmentsRef.current.forEach((frag, i) => {
        if (frag) {
          const angle = (i / fragmentsRef.current.length) * Math.PI * 2;
          frag.position.x += Math.cos(angle) * 15;
          frag.position.z += Math.sin(angle) * 15;
          frag.position.y += 10;
        }
      });
    }
    // Return fragments
    fragmentsRef.current.forEach((frag) => {
      if (frag) {
        frag.position.x *= 0.98;
        frag.position.z *= 0.98;
      }
    });
  });

  const rustOrange = 0xdea584;

  return (
    <group ref={groupRef}>
      {/* Exploding crab fragments */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={`frag-${i}`}
            ref={(el) => { if (el) fragmentsRef.current[i] = el; }}
            position={[Math.cos(angle) * 5, 15, Math.sin(angle) * 5]}
          >
            <tetrahedronGeometry args={[4]} />
            <meshBasicMaterial color={rustOrange} transparent opacity={opacity} />
          </mesh>
        );
      })}

      {/* Central explosion */}
      <mesh position={[0, 15, 0]}>
        <icosahedronGeometry args={[6, 0]} />
        <meshBasicMaterial color={0xff4400} transparent opacity={opacity * 0.8} />
      </mesh>

      {/* "panic!" text */}
      <mesh position={[0, 30, 0]}>
        <boxGeometry args={[14, 4, 1]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>

      {/* Exclamation marks */}
      {[0, 1, 2].map((i) => (
        <group key={`excl-${i}`} position={[(i - 1) * 8, 25, 5]}>
          <mesh position={[0, 2, 0]}>
            <boxGeometry args={[2, 5, 1]} />
            <meshBasicMaterial color={0xffff00} transparent opacity={opacity} />
          </mesh>
          <mesh position={[0, -2, 0]}>
            <boxGeometry args={[2, 2, 1]} />
            <meshBasicMaterial color={0xffff00} transparent opacity={opacity} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Rust Lifetime Error - Caranguejo com relógio de areia
export function RustLifetimeErrorModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const hourglassRef = useRef<THREE.Group>(null);
  const sandRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;

    // Hourglass rotates slowly
    if (hourglassRef.current) {
      hourglassRef.current.rotation.z = Math.sin(phaseRef.current * 0.5) * 0.2;
    }

    // Sand falls
    if (sandRef.current) {
      sandRef.current.scale.y = 0.5 + Math.abs(Math.sin(phaseRef.current * 0.3)) * 0.5;
    }

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (hourglassRef.current) {
        hourglassRef.current.rotation.z = Math.PI;
      }
    }
  });

  const rustOrange = 0xdea584;
  const oldRust = 0x8b6914;

  return (
    <group ref={groupRef}>
      {/* Old weathered crab body */}
      <mesh position={[0, 10, 0]}>
        <sphereGeometry args={[8, 10, 8]} />
        <meshBasicMaterial color={oldRust} transparent opacity={opacity} />
      </mesh>

      {/* Cracks on shell */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={`crack-${i}`}
          position={[(i - 1) * 4, 12, 6]}
          rotation={[0, 0, (i - 1) * 0.3]}
        >
          <boxGeometry args={[0.5, 5, 0.5]} />
          <meshBasicMaterial color={0x333333} transparent opacity={opacity} />
        </mesh>
      ))}

      {/* Hourglass on back */}
      <group ref={hourglassRef} position={[0, 22, 0]}>
        {/* Top glass */}
        <mesh position={[0, 5, 0]}>
          <coneGeometry args={[4, 6, 8]} />
          <meshBasicMaterial color={0xaaddff} transparent opacity={opacity * 0.5} />
        </mesh>
        {/* Bottom glass */}
        <mesh position={[0, -5, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[4, 6, 8]} />
          <meshBasicMaterial color={0xaaddff} transparent opacity={opacity * 0.5} />
        </mesh>
        {/* Sand */}
        <mesh ref={sandRef} position={[0, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 8, 8]} />
          <meshBasicMaterial color={0xdaa520} transparent opacity={opacity} />
        </mesh>
        {/* Frame */}
        <mesh position={[0, 8, 0]}>
          <boxGeometry args={[10, 1, 3]} />
          <meshBasicMaterial color={0x8b4513} transparent opacity={opacity} />
        </mesh>
        <mesh position={[0, -8, 0]}>
          <boxGeometry args={[10, 1, 3]} />
          <meshBasicMaterial color={0x8b4513} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* Tired eyes */}
      <mesh position={[-3, 14, 6]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color={0x888888} />
      </mesh>
      <mesh position={[3, 14, 6]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color={0x888888} />
      </mesh>

      {/* 'a lifetime annotation */}
      <mesh position={[12, 15, 0]}>
        <boxGeometry args={[4, 6, 1]} />
        <meshBasicMaterial color={rustOrange} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// ============================================================================
// RUBY ERRORS
// ============================================================================

// Ruby NoMethodError - Gema rachada sem brilho
export function RubyNoMethodErrorModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const gemRef = useRef<THREE.Mesh>(null);
  const cracksRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;

    // Gem rotates slowly, no sparkle
    if (gemRef.current) {
      gemRef.current.rotation.y += delta * 0.3;
    }

    // Cracks pulse
    cracksRef.current.forEach((crack, i) => {
      if (crack) {
        const mat = crack.material as THREE.MeshBasicMaterial;
        mat.opacity = opacity * (0.5 + Math.sin(phaseRef.current * 2 + i) * 0.3);
      }
    });

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (gemRef.current) {
        gemRef.current.scale.setScalar(1.3);
      }
    }
    if (gemRef.current) {
      gemRef.current.scale.lerp(UNIT_VECTOR3, 0.1);
    }
  });

  const rubyRed = 0xcc342d;
  const darkRuby = 0x661a17;

  return (
    <group ref={groupRef} position={[0, 15, 0]}>
      {/* Cracked ruby gem */}
      <mesh ref={gemRef}>
        <octahedronGeometry args={[12, 0]} />
        <meshBasicMaterial color={darkRuby} transparent opacity={opacity * 0.7} />
      </mesh>

      {/* Cracks */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={`crack-${i}`}
          ref={(el) => { if (el) cracksRef.current[i] = el; }}
          position={[(i - 1.5) * 4, (i - 1.5) * 3, 8]}
          rotation={[0.3, 0, (i - 1.5) * 0.5]}
        >
          <boxGeometry args={[1, 8, 0.5]} />
          <meshBasicMaterial color={0x000000} transparent opacity={opacity} />
        </mesh>
      ))}

      {/* "?" where method should be */}
      <mesh position={[0, 0, 15]}>
        <boxGeometry args={[4, 8, 1]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, -6, 15]}>
        <boxGeometry args={[2, 2, 1]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
      </mesh>

      {/* Dull surface - no shine */}
      <mesh position={[0, 0, 0]}>
        <octahedronGeometry args={[12.5, 0]} />
        <meshBasicMaterial color={0x333333} transparent opacity={0.2} wireframe />
      </mesh>
    </group>
  );
}

// Ruby LoadError - Trilhos quebrados
export function RubyLoadErrorModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const trainRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Train shakes
    if (trainRef.current && isWalking) {
      trainRef.current.position.x = Math.sin(phaseRef.current * 8) * 2;
      trainRef.current.rotation.z = Math.sin(phaseRef.current * 8) * 0.1;
    }

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (trainRef.current) {
        trainRef.current.position.z = 10;
      }
    }
    if (trainRef.current) {
      trainRef.current.position.z *= 0.95;
    }
  });

  const rubyRed = 0xcc342d;
  const railColor = 0x555555;

  return (
    <group ref={groupRef}>
      {/* Broken rails */}
      <mesh position={[-8, 2, 0]}>
        <boxGeometry args={[30, 2, 2]} />
        <meshBasicMaterial color={railColor} transparent opacity={opacity} />
      </mesh>
      <mesh position={[8, 2, 0]}>
        <boxGeometry args={[30, 2, 2]} />
        <meshBasicMaterial color={railColor} transparent opacity={opacity} />
      </mesh>

      {/* Broken section */}
      <mesh position={[0, 2, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[10, 2, 2]} />
        <meshBasicMaterial color={railColor} transparent opacity={opacity} />
      </mesh>

      {/* Railway ties */}
      {[-2, -1, 0, 1, 2].map((i) => (
        <mesh key={`tie-${i}`} position={[0, 0, i * 6]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[20, 1, 3]} />
          <meshBasicMaterial color={0x8b4513} transparent opacity={opacity} />
        </mesh>
      ))}

      {/* Derailed train */}
      <mesh ref={trainRef} position={[5, 10, 0]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[12, 8, 20]} />
        <meshBasicMaterial color={rubyRed} transparent opacity={opacity} />
      </mesh>

      {/* Wheels */}
      <mesh position={[0, 5, -8]}>
        <cylinderGeometry args={[3, 3, 2, 16]} />
        <meshBasicMaterial color={0x333333} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 5, 8]}>
        <cylinderGeometry args={[3, 3, 2, 16]} />
        <meshBasicMaterial color={0x333333} transparent opacity={opacity} />
      </mesh>

      {/* "LoadError" sign */}
      <mesh position={[0, 25, 0]}>
        <boxGeometry args={[18, 4, 1]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// Ruby SyntaxError - Gema mal lapidada
export function RubySyntaxErrorModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const facetsRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    groupRef.current.rotation.y += delta * 0.5;

    // Facets jitter - badly cut
    facetsRef.current.forEach((facet, i) => {
      if (facet) {
        facet.rotation.x = Math.sin(phaseRef.current + i) * 0.2;
        facet.rotation.z = Math.cos(phaseRef.current + i) * 0.2;
      }
    });

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.scale.setScalar(1.5);
    }
    groupRef.current.scale.lerp(UNIT_VECTOR3, 0.1);
  });

  const rubyRed = 0xcc342d;

  return (
    <group ref={groupRef} position={[0, 15, 0]}>
      {/* Badly cut gem - irregular facets */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 8 + (i % 3) * 2;
        const height = (i % 2) * 4;
        return (
          <mesh
            key={`facet-${i}`}
            ref={(el) => { if (el) facetsRef.current[i] = el; }}
            position={[Math.cos(angle) * radius, height, Math.sin(angle) * radius]}
            rotation={[Math.random(), Math.random(), Math.random()]}
          >
            <tetrahedronGeometry args={[5 + (i % 3)]} />
            <meshBasicMaterial color={rubyRed} transparent opacity={opacity * (0.6 + (i % 3) * 0.1)} />
          </mesh>
        );
      })}

      {/* Syntax symbols floating */}
      <mesh position={[0, 15, 0]}>
        <boxGeometry args={[3, 6, 1]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
      </mesh>
      <mesh position={[6, 15, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[3, 1, 1]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// ============================================================================
// SWIFT ERRORS
// ============================================================================

// Swift found nil - Pássaro caindo, asas transparentes
export function SwiftFoundNilModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wingsRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);
  const fallRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 3;
    fallRef.current += delta;

    // Falling motion
    groupRef.current.rotation.x = Math.sin(fallRef.current) * 0.3;
    groupRef.current.position.y = 20 + Math.sin(fallRef.current * 2) * 5;

    // Wings flap weakly
    wingsRef.current.forEach((wing, i) => {
      if (wing) {
        wing.rotation.z = (i === 0 ? 1 : -1) * Math.sin(phaseRef.current) * 0.3;
      }
    });

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.position.y = 30;
    }
  });

  const swiftOrange = 0xfa7343;

  return (
    <group ref={groupRef}>
      {/* Bird body */}
      <mesh position={[0, 0, 0]} rotation={[0.3, 0, 0]}>
        <capsuleGeometry args={[4, 8, 8, 16]} />
        <meshBasicMaterial color={swiftOrange} transparent opacity={opacity} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 8, 4]}>
        <sphereGeometry args={[4, 12, 12]} />
        <meshBasicMaterial color={swiftOrange} transparent opacity={opacity} />
      </mesh>

      {/* Beak */}
      <mesh position={[0, 7, 8]} rotation={[-0.3, 0, 0]}>
        <coneGeometry args={[1.5, 4, 8]} />
        <meshBasicMaterial color={0xffaa00} transparent opacity={opacity} />
      </mesh>

      {/* Transparent wings - fading */}
      <mesh
        ref={(el) => { if (el) wingsRef.current[0] = el; }}
        position={[-8, 0, 0]}
        rotation={[0, 0, 0.5]}
      >
        <boxGeometry args={[10, 2, 8]} />
        <meshBasicMaterial color={swiftOrange} transparent opacity={opacity * 0.3} />
      </mesh>
      <mesh
        ref={(el) => { if (el) wingsRef.current[1] = el; }}
        position={[8, 0, 0]}
        rotation={[0, 0, -0.5]}
      >
        <boxGeometry args={[10, 2, 8]} />
        <meshBasicMaterial color={swiftOrange} transparent opacity={opacity * 0.3} />
      </mesh>

      {/* Dizzy eyes */}
      <mesh position={[-1.5, 9, 7]}>
        <torusGeometry args={[1, 0.3, 8, 16]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>
      <mesh position={[1.5, 9, 7]}>
        <torusGeometry args={[1, 0.3, 8, 16]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>

      {/* "nil" text */}
      <mesh position={[0, 18, 0]}>
        <boxGeometry args={[8, 3, 1]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// Swift Force Unwrap - Presente explodindo
export function SwiftForceUnwrapModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Mesh>(null);
  const contentsRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Lid bounces
    if (lidRef.current) {
      lidRef.current.position.y = 20 + Math.abs(Math.sin(phaseRef.current * 3)) * 10;
      lidRef.current.rotation.z = Math.sin(phaseRef.current) * 0.5;
    }

    // Contents fly out
    contentsRef.current.forEach((item, i) => {
      if (item) {
        const angle = phaseRef.current + (i * Math.PI * 2 / 5);
        item.position.x = Math.cos(angle) * (10 + Math.sin(phaseRef.current) * 3);
        item.position.z = Math.sin(angle) * (10 + Math.sin(phaseRef.current) * 3);
        item.position.y = 15 + Math.sin(phaseRef.current * 2 + i) * 5;
        item.rotation.x += delta * 2;
        item.rotation.y += delta * 3;
      }
    });

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      contentsRef.current.forEach((item) => {
        if (item) {
          item.position.y = 30;
        }
      });
    }
  });

  const swiftOrange = 0xfa7343;

  return (
    <group ref={groupRef}>
      {/* Gift box */}
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[16, 10, 16]} />
        <meshBasicMaterial color={swiftOrange} transparent opacity={opacity} />
      </mesh>

      {/* Ribbon */}
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[3, 11, 17]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[17, 11, 3]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
      </mesh>

      {/* Exploding lid */}
      <mesh ref={lidRef} position={[0, 20, 0]}>
        <boxGeometry args={[17, 3, 17]} />
        <meshBasicMaterial color={swiftOrange} transparent opacity={opacity} />
      </mesh>

      {/* Flying contents - errors */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={`content-${i}`}
          ref={(el) => { if (el) contentsRef.current[i] = el; }}
        >
          <octahedronGeometry args={[3]} />
          <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
        </mesh>
      ))}

      {/* "!" mark */}
      <mesh position={[0, 35, 0]}>
        <boxGeometry args={[3, 10, 2]} />
        <meshBasicMaterial color={0xffff00} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 27, 0]}>
        <boxGeometry args={[3, 3, 2]} />
        <meshBasicMaterial color={0xffff00} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// Swift Index out of range - Pássaro voando fora da tela
export function SwiftIndexOutOfRangeModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const birdRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Bird flies back and forth, hitting walls
    if (birdRef.current) {
      birdRef.current.position.x = Math.sin(phaseRef.current) * 20;
      birdRef.current.rotation.y = Math.sin(phaseRef.current) > 0 ? 0 : Math.PI;
    }

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (birdRef.current) {
        birdRef.current.position.x = 30;
      }
    }
  });

  const swiftOrange = 0xfa7343;

  return (
    <group ref={groupRef}>
      {/* Boundary walls */}
      <mesh position={[-25, 15, 0]}>
        <boxGeometry args={[2, 30, 20]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity * 0.5} />
      </mesh>
      <mesh position={[25, 15, 0]}>
        <boxGeometry args={[2, 30, 20]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity * 0.5} />
      </mesh>

      {/* Index numbers on floor */}
      {[-2, -1, 0, 1, 2].map((i) => (
        <mesh key={`idx-${i}`} position={[i * 10, 0, 10]}>
          <boxGeometry args={[8, 1, 8]} />
          <meshBasicMaterial
            color={Math.abs(i) === 2 ? 0xff0000 : 0x00ff00}
            transparent
            opacity={opacity}
          />
        </mesh>
      ))}

      {/* Flying bird */}
      <group ref={birdRef} position={[0, 15, 0]}>
        <mesh>
          <coneGeometry args={[4, 12, 8]} />
          <meshBasicMaterial color={swiftOrange} transparent opacity={opacity} />
        </mesh>
        {/* Wings */}
        <mesh position={[-6, 0, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[8, 1, 4]} />
          <meshBasicMaterial color={swiftOrange} transparent opacity={opacity} />
        </mesh>
        <mesh position={[6, 0, 0]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[8, 1, 4]} />
          <meshBasicMaterial color={swiftOrange} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* "[X]" text */}
      <mesh position={[0, 32, 0]}>
        <boxGeometry args={[12, 4, 1]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// Export all models from this file
export const LanguageErrorModels2 = {
  // Go
  gonilpanic: GoNilPanicModel,
  godeadlock: GoDeadlockModel,
  goimportcycle: GoImportCycleModel,
  // Rust
  rustborrowchecker: RustBorrowCheckerModel,
  rustpanic: RustPanicModel,
  rustlifetimeerror: RustLifetimeErrorModel,
  // Ruby
  rubynomethoderror: RubyNoMethodErrorModel,
  rubyloaderror: RubyLoadErrorModel,
  rubysyntaxerror: RubySyntaxErrorModel,
  // Swift
  swiftfoundnil: SwiftFoundNilModel,
  swiftforceunwrap: SwiftForceUnwrapModel,
  swiftindexoutofrange: SwiftIndexOutOfRangeModel,
};
