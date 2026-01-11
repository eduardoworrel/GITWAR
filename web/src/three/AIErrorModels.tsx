// @ts-nocheck
// AI/ML Error Models - Visually stunning representations of real ML bugs
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNIT_VECTOR3 } from './optimizations';

interface AIErrorModelProps {
  color: number;
  opacity: number;
  isWalking: boolean;
  lastAttackTime: number | null;
}

// ============================================================================
// VANISHING GRADIENT - Fantasma matemático evaporando, números desaparecendo
// ============================================================================
export function AIVanishingGradientModel({ opacity, lastAttackTime }: AIErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const layersRef = useRef<THREE.Mesh[]>([]);
  const numbersRef = useRef<THREE.Group[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Floating effect
    groupRef.current.position.y = Math.sin(phaseRef.current * 0.5) * 3 + 20;

    // Layers fading from bottom to top (vanishing effect)
    layersRef.current.forEach((layer, i) => {
      if (layer) {
        const mat = layer.material as THREE.MeshBasicMaterial;
        const fadeProgress = (Math.sin(phaseRef.current + i * 0.5) + 1) / 2;
        mat.opacity = opacity * (0.1 + fadeProgress * 0.4 * (1 - i * 0.15));
      }
    });

    // Numbers floating up and disappearing
    numbersRef.current.forEach((num, i) => {
      if (num) {
        num.position.y += delta * 15;
        if (num.position.y > 40) num.position.y = -10;
        const fadeOut = 1 - (num.position.y / 40);
        num.scale.setScalar(fadeOut * 0.8);
      }
    });

    // Attack pulse
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.scale.setScalar(1.5);
    }
    groupRef.current.scale.lerp(UNIT_VECTOR3, 0.1);
  });

  return (
    <group ref={groupRef}>
      {/* Neural network layers - fading from bottom to top */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={`layer-${i}`}
          ref={(el) => { if (el) layersRef.current[i] = el; }}
          position={[0, i * 8 - 15, 0]}
        >
          <boxGeometry args={[20 - i * 3, 3, 12 - i * 2]} />
          <meshBasicMaterial
            color={new THREE.Color().setHSL(0.6 - i * 0.1, 0.7, 0.5)}
           
           
          />
        </mesh>
      ))}

      {/* Floating gradient numbers (∇) disappearing */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <group
          key={`num-${i}`}
          ref={(el) => { if (el) numbersRef.current[i] = el; }}
          position={[(Math.random() - 0.5) * 30, i * 8, (Math.random() - 0.5) * 20]}
        >
          {/* Triangle representing gradient symbol */}
          <mesh rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[2, 4, 3]} />
            <meshBasicMaterial color={0x00ffff} />
          </mesh>
        </group>
      ))}

      {/* Core - pulsing weakly */}
      <mesh>
        <icosahedronGeometry args={[6, 1]} />
        <meshBasicMaterial color={0x4488ff} wireframe />
      </mesh>

      {/* Ghost trail effect */}
      <mesh position={[0, -5, 0]}>
        <coneGeometry args={[10, 20, 8]} />
        <meshBasicMaterial color={0x6666ff} side={THREE.DoubleSide} />
      </mesh>

      <pointLight color={0x4488ff} intensity={0.4} distance={30} />
    </group>
  );
}

// ============================================================================
// EXPLODING GRADIENT - Núcleo instável com números voando, explosões
// ============================================================================
export function AIExplodingGradientModel({ opacity, lastAttackTime }: AIErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Group[]>([]);
  const phaseRef = useRef(0);
  const explosionRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 4;
    explosionRef.current += delta;

    // Unstable shaking
    groupRef.current.position.x = (Math.random() - 0.5) * 3;
    groupRef.current.position.z = (Math.random() - 0.5) * 3;
    groupRef.current.position.y = 15 + Math.sin(phaseRef.current) * 2;

    // Core pulsing erratically
    if (coreRef.current) {
      const pulse = 1 + Math.sin(phaseRef.current * 5) * 0.3 + Math.random() * 0.2;
      coreRef.current.scale.setScalar(pulse);
      coreRef.current.rotation.x += delta * 3;
      coreRef.current.rotation.y += delta * 4;
    }

    // Particles exploding outward
    particlesRef.current.forEach((p, i) => {
      if (p) {
        const angle = (i / 12) * Math.PI * 2 + phaseRef.current;
        const radius = 15 + Math.sin(phaseRef.current * 3 + i) * 10;
        p.position.x = Math.cos(angle) * radius;
        p.position.z = Math.sin(angle) * radius;
        p.position.y = Math.sin(phaseRef.current * 2 + i * 0.5) * 10;
        p.rotation.x += delta * 5;
        p.rotation.z += delta * 3;
      }
    });

    // Attack explosion
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      explosionRef.current = 0;
      groupRef.current.scale.setScalar(2);
    }
    groupRef.current.scale.lerp(UNIT_VECTOR3, 0.08);
  });

  return (
    <group ref={groupRef}>
      {/* Unstable core */}
      <mesh ref={coreRef}>
        <dodecahedronGeometry args={[8, 0]} />
        <meshBasicMaterial color={0xff4400} />
      </mesh>

      {/* Inner chaotic core */}
      <mesh>
        <icosahedronGeometry args={[5, 1]} />
        <meshBasicMaterial color={0xffff00} wireframe />
      </mesh>

      {/* Exploding number particles (∞ symbols) */}
      {Array.from({ length: 12 }).map((_, i) => (
        <group
          key={`particle-${i}`}
          ref={(el) => { if (el) particlesRef.current[i] = el; }}
        >
          {/* Infinity symbol made of tori */}
          <mesh position={[-1.5, 0, 0]}>
            <torusGeometry args={[1.5, 0.4, 8, 12]} />
            <meshBasicMaterial color={0xff6600} />
          </mesh>
          <mesh position={[1.5, 0, 0]}>
            <torusGeometry args={[1.5, 0.4, 8, 12]} />
            <meshBasicMaterial color={0xff6600} />
          </mesh>
        </group>
      ))}

      {/* Energy rings expanding */}
      {[0, 1, 2].map((i) => (
        <mesh key={`ring-${i}`} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[12 + i * 5, 0.5, 8, 32]} />
          <meshBasicMaterial color={0xff8800} />
        </mesh>
      ))}

      {/* Warning sparks */}
      <pointLight color={0xff4400} intensity={1.5} distance={40} />
      <pointLight color={0xffff00} intensity={0.8} distance={25} position={[10, 10, 0]} />
    </group>
  );
}

// ============================================================================
// DYING RELU - Cérebro robótico com partes apagando, neurônios morrendo
// ============================================================================
export function AIDyingReluModel({ opacity, isWalking, lastAttackTime }: AIErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const neuronsRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  const neuronPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < 20; i++) {
      positions.push([
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 25 + 15,
        (Math.random() - 0.5) * 25,
      ]);
    }
    return positions;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 1.5;

    // Slow dying movement
    if (isWalking) {
      groupRef.current.rotation.y += delta * 0.3;
    }
    groupRef.current.position.y = Math.sin(phaseRef.current * 0.3) * 2 + 15;

    // Neurons randomly dying (flickering off)
    neuronsRef.current.forEach((neuron, i) => {
      if (neuron) {
        const mat = neuron.material as THREE.MeshBasicMaterial;
        const isDying = Math.sin(phaseRef.current * 2 + i * 1.7) > 0.3;
        mat.opacity = isDying ? opacity * 0.8 : opacity * 0.1;
        mat.color.setHex(isDying ? 0x00ff88 : 0x333333);
      }
    });

    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.scale.setScalar(1.3);
    }
    groupRef.current.scale.lerp(UNIT_VECTOR3, 0.1);
  });

  return (
    <group ref={groupRef}>
      {/* Brain shell */}
      <mesh>
        <sphereGeometry args={[15, 16, 12]} />
        <meshBasicMaterial color={0x444466} wireframe />
      </mesh>

      {/* Neurons - some alive, some dead */}
      {neuronPositions.map((pos, i) => (
        <mesh
          key={`neuron-${i}`}
          ref={(el) => { if (el) neuronsRef.current[i] = el; }}
          position={pos}
        >
          <sphereGeometry args={[1.5, 8, 8]} />
          <meshBasicMaterial color={0x00ff88} />
        </mesh>
      ))}

      {/* Dead zone - dark area */}
      <mesh position={[5, 5, 5]}>
        <sphereGeometry args={[8, 12, 12]} />
        <meshBasicMaterial color={0x111111} />
      </mesh>

      {/* ReLU graph visualization - flat line after 0 */}
      <group position={[0, -10, 15]} rotation={[0, 0, 0]}>
        {/* Negative side - flat (dead) */}
        <mesh position={[-8, 0, 0]}>
          <boxGeometry args={[12, 0.5, 0.5]} />
          <meshBasicMaterial color={0x333333} />
        </mesh>
        {/* Positive side - angled (alive but weak) */}
        <mesh position={[6, 3, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[12, 0.5, 0.5]} />
          <meshBasicMaterial color={0x00ff88} />
        </mesh>
      </group>

      <pointLight color={0x00ff88} intensity={0.3} distance={25} />
    </group>
  );
}

// ============================================================================
// OVERFITTING - Robô com espelho, só repete o que vê, memoriza tudo
// ============================================================================
export function AIOverfittingModel({ opacity, isWalking, lastAttackTime }: AIErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const mirrorRef = useRef<THREE.Mesh>(null);
  const dataPointsRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    if (isWalking) {
      groupRef.current.rotation.y += delta * 0.5;
    }
    groupRef.current.position.y = 15;

    // Mirror reflection effect
    if (mirrorRef.current) {
      mirrorRef.current.rotation.y = Math.sin(phaseRef.current * 0.5) * 0.2;
    }

    // Data points orbit closely (memorized)
    dataPointsRef.current.forEach((point, i) => {
      if (point) {
        const angle = phaseRef.current * 0.5 + (i / 15) * Math.PI * 2;
        const radius = 18 + Math.sin(i * 0.5) * 2;
        point.position.x = Math.cos(angle) * radius;
        point.position.z = Math.sin(angle) * radius;
        point.position.y = Math.sin(phaseRef.current + i) * 3;
      }
    });

    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.scale.setScalar(1.4);
    }
    groupRef.current.scale.lerp(UNIT_VECTOR3, 0.1);
  });

  return (
    <group ref={groupRef}>
      {/* Robot body - chunky, heavy */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[14, 20, 10]} />
        <meshBasicMaterial color={0x8844cc} />
      </mesh>

      {/* Robot head */}
      <mesh position={[0, 14, 0]}>
        <boxGeometry args={[10, 8, 8]} />
        <meshBasicMaterial color={0x9955dd} />
      </mesh>

      {/* Eyes - screens showing data */}
      <mesh position={[-2, 15, 4.5]}>
        <boxGeometry args={[3, 2, 0.5]} />
        <meshBasicMaterial color={0x00ff00} />
      </mesh>
      <mesh position={[2, 15, 4.5]}>
        <boxGeometry args={[3, 2, 0.5]} />
        <meshBasicMaterial color={0x00ff00} />
      </mesh>

      {/* Mirror in front */}
      <mesh ref={mirrorRef} position={[0, 5, 12]}>
        <boxGeometry args={[16, 20, 0.5]} />
        <meshBasicMaterial color={0xaaddff} side={THREE.DoubleSide} />
      </mesh>

      {/* Memorized data points - tightly clustered */}
      {Array.from({ length: 15 }).map((_, i) => (
        <mesh
          key={`data-${i}`}
          ref={(el) => { if (el) dataPointsRef.current[i] = el; }}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={0xff88ff} />
        </mesh>
      ))}

      {/* "100%" accuracy badge */}
      <mesh position={[0, 22, 0]}>
        <cylinderGeometry args={[3, 3, 1, 16]} />
        <meshBasicMaterial color={0xffdd00} />
      </mesh>

      <pointLight color={0x8844cc} intensity={0.5} distance={30} />
    </group>
  );
}

// ============================================================================
// UNDERFITTING - Robô simplório, ignora padrões, muito básico
// ============================================================================
export function AIUnderfittingModel({ opacity, isWalking, lastAttackTime }: AIErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.Mesh>(null);
  const dataRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 1.5;

    if (isWalking) {
      groupRef.current.position.y = 12 + Math.abs(Math.sin(phaseRef.current * 2)) * 3;
    } else {
      groupRef.current.position.y = 12;
    }

    // Simple line stays straight (doesn't fit data)
    if (lineRef.current) {
      lineRef.current.rotation.z = 0.1; // Barely any slope
    }

    // Data points scattered (ignored by model)
    dataRef.current.forEach((point, i) => {
      if (point) {
        point.position.y = Math.sin(phaseRef.current * 0.5 + i * 2) * 3 + (i - 5) * 2;
      }
    });

    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.scale.setScalar(1.3);
    }
    groupRef.current.scale.lerp(UNIT_VECTOR3, 0.1);
  });

  return (
    <group ref={groupRef}>
      {/* Simple cubic robot - very basic */}
      <mesh>
        <boxGeometry args={[15, 15, 15]} />
        <meshBasicMaterial color={0x666688} />
      </mesh>

      {/* Dumb face - confused expression */}
      <mesh position={[-3, 2, 8]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color={0x222222} />
      </mesh>
      <mesh position={[3, 2, 8]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color={0x222222} />
      </mesh>
      {/* Confused mouth */}
      <mesh position={[0, -3, 8]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[6, 1, 0.5]} />
        <meshBasicMaterial color={0x222222} />
      </mesh>

      {/* Simple straight line (underfitting) */}
      <mesh ref={lineRef} position={[0, 12, 0]}>
        <boxGeometry args={[30, 0.5, 0.5]} />
        <meshBasicMaterial color={0xff4444} />
      </mesh>

      {/* Scattered data points (not fitted) */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh
          key={`data-${i}`}
          ref={(el) => { if (el) dataRef.current[i] = el; }}
          position={[(i - 5) * 4, 0, 12]}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={0x44ff44} />
        </mesh>
      ))}

      {/* Question marks floating */}
      <mesh position={[0, 18, 0]}>
        <boxGeometry args={[2, 5, 1]} />
        <meshBasicMaterial color={0xffff00} />
      </mesh>
      <mesh position={[0, 12, 0]}>
        <boxGeometry args={[2, 2, 1]} />
        <meshBasicMaterial color={0xffff00} />
      </mesh>

      <pointLight color={0x666688} intensity={0.3} distance={20} />
    </group>
  );
}

// ============================================================================
// MODE COLLAPSE - GAN colapsado, clones idênticos saindo de máquina
// ============================================================================
export function AIModeCollapseModel({ opacity, isWalking, lastAttackTime }: AIErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const clonesRef = useRef<THREE.Group[]>([]);
  const machineRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    groupRef.current.position.y = 15;
    if (isWalking) {
      groupRef.current.rotation.y += delta * 0.3;
    }

    // Machine vibrating
    if (machineRef.current) {
      machineRef.current.position.x = Math.sin(phaseRef.current * 10) * 0.5;
    }

    // Clones emerging in a line (all identical)
    clonesRef.current.forEach((clone, i) => {
      if (clone) {
        const offset = (phaseRef.current * 20 + i * 15) % 60 - 30;
        clone.position.z = offset;
        clone.position.y = Math.sin(offset * 0.1) * 2;
        // All same rotation (identical)
        clone.rotation.y = 0;
      }
    });

    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.scale.setScalar(1.4);
    }
    groupRef.current.scale.lerp(UNIT_VECTOR3, 0.1);
  });

  return (
    <group ref={groupRef}>
      {/* GAN Machine */}
      <mesh ref={machineRef} position={[0, 0, 0]}>
        <boxGeometry args={[20, 25, 12]} />
        <meshBasicMaterial color={0x444455} />
      </mesh>

      {/* Machine display - "COLLAPSED" */}
      <mesh position={[0, 8, 6.5]}>
        <boxGeometry args={[14, 6, 0.5]} />
        <meshBasicMaterial color={0xff0000} />
      </mesh>

      {/* Output slot */}
      <mesh position={[0, -5, 6.5]}>
        <boxGeometry args={[10, 8, 1]} />
        <meshBasicMaterial color={0x222222} />
      </mesh>

      {/* Identical clones coming out */}
      {Array.from({ length: 5 }).map((_, i) => (
        <group
          key={`clone-${i}`}
          ref={(el) => { if (el) clonesRef.current[i] = el; }}
          position={[0, -5, i * 15]}
        >
          {/* Simple identical cube "outputs" */}
          <mesh>
            <boxGeometry args={[5, 5, 5]} />
            <meshBasicMaterial color={0x00aaff} />
          </mesh>
          {/* Same face on all */}
          <mesh position={[0, 0, 2.6]}>
            <planeGeometry args={[4, 4]} />
            <meshBasicMaterial color={0xffaa00} />
          </mesh>
        </group>
      ))}

      {/* Warning lights */}
      <mesh position={[-8, 15, 0]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color={0xff0000} />
      </mesh>
      <mesh position={[8, 15, 0]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color={0xff0000} />
      </mesh>

      <pointLight color={0x00aaff} intensity={0.5} distance={30} />
    </group>
  );
}

// ============================================================================
// CATASTROPHIC FORGETTING - Robô com memória vazando, blocos caindo
// ============================================================================
export function AICatastrophicForgettingModel({ opacity, isWalking, lastAttackTime }: AIErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const memoryBlocksRef = useRef<THREE.Mesh[]>([]);
  const brainRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    groupRef.current.position.y = 15;
    if (isWalking) {
      groupRef.current.rotation.y += delta * 0.4;
    }

    // Brain shrinking/pulsing (losing memories)
    if (brainRef.current) {
      const shrink = 0.8 + Math.sin(phaseRef.current) * 0.1;
      brainRef.current.scale.setScalar(shrink);
    }

    // Memory blocks falling and fading
    memoryBlocksRef.current.forEach((block, i) => {
      if (block) {
        block.position.y -= delta * 15;
        if (block.position.y < -30) {
          block.position.y = 20;
          block.position.x = (Math.random() - 0.5) * 20;
          block.position.z = (Math.random() - 0.5) * 20;
        }
        const mat = block.material as THREE.MeshBasicMaterial;
        mat.opacity = opacity * Math.max(0, (block.position.y + 30) / 50);
        block.rotation.x += delta * 2;
        block.rotation.z += delta * 1.5;
      }
    });

    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.scale.setScalar(1.3);
    }
    groupRef.current.scale.lerp(UNIT_VECTOR3, 0.1);
  });

  return (
    <group ref={groupRef}>
      {/* Robot head/container */}
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[18, 22, 16]} />
        <meshBasicMaterial color={0x556677} />
      </mesh>

      {/* Brain - shrinking */}
      <mesh ref={brainRef} position={[0, 8, 0]}>
        <sphereGeometry args={[8, 16, 12]} />
        <meshBasicMaterial color={0xff88aa} />
      </mesh>

      {/* Crack in head */}
      <mesh position={[0, 5, 8.5]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[2, 15, 0.5]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>

      {/* Memory blocks falling out */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={`memory-${i}`}
          ref={(el) => { if (el) memoryBlocksRef.current[i] = el; }}
          position={[(Math.random() - 0.5) * 20, Math.random() * 40 - 10, (Math.random() - 0.5) * 20]}
        >
          <boxGeometry args={[3, 3, 3]} />
          <meshBasicMaterial
            color={new THREE.Color().setHSL(Math.random(), 0.7, 0.5)}
           
           
          />
        </mesh>
      ))}

      {/* Sad eyes */}
      <mesh position={[-4, 10, 8.5]}>
        <boxGeometry args={[4, 2, 0.5]} />
        <meshBasicMaterial color={0x333333} />
      </mesh>
      <mesh position={[4, 10, 8.5]}>
        <boxGeometry args={[4, 2, 0.5]} />
        <meshBasicMaterial color={0x333333} />
      </mesh>

      <pointLight color={0xff88aa} intensity={0.4} distance={25} />
    </group>
  );
}

// ============================================================================
// DATA LEAKAGE - Tubos com dados escapando, informação vazando
// ============================================================================
export function AIDataLeakageModel({ opacity, isWalking, lastAttackTime }: AIErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leaksRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 3;

    groupRef.current.position.y = 15;
    if (isWalking) {
      groupRef.current.rotation.y += delta * 0.5;
    }

    // Data particles leaking out
    leaksRef.current.forEach((leak, i) => {
      if (leak) {
        const angle = (i / 15) * Math.PI * 2;
        const expansion = (phaseRef.current * 10 + i * 5) % 30;
        leak.position.x = Math.cos(angle) * (10 + expansion);
        leak.position.z = Math.sin(angle) * (10 + expansion);
        leak.position.y = Math.sin(phaseRef.current + i) * 5;
        const mat = leak.material as THREE.MeshBasicMaterial;
        mat.opacity = opacity * (1 - expansion / 30);
      }
    });

    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.scale.setScalar(1.5);
    }
    groupRef.current.scale.lerp(UNIT_VECTOR3, 0.1);
  });

  return (
    <group ref={groupRef}>
      {/* Data container - cracked */}
      <mesh>
        <cylinderGeometry args={[10, 10, 25, 16]} />
        <meshBasicMaterial color={0x4488aa} />
      </mesh>

      {/* Cracks with light */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`crack-${i}`} position={[0, i * 5 - 8, 10.5]} rotation={[0, 0, (i - 1.5) * 0.3]}>
          <boxGeometry args={[1, 6, 0.5]} />
          <meshBasicMaterial color={0x00ffff} />
        </mesh>
      ))}

      {/* Leaking data particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <mesh
          key={`leak-${i}`}
          ref={(el) => { if (el) leaksRef.current[i] = el; }}
        >
          <boxGeometry args={[2, 2, 2]} />
          <meshBasicMaterial color={0x00ff88} />
        </mesh>
      ))}

      {/* "LEAK" warning pipes */}
      {[0, 1, 2].map((i) => (
        <mesh key={`pipe-${i}`} position={[Math.cos(i * 2.1) * 12, 0, Math.sin(i * 2.1) * 12]} rotation={[Math.PI / 2, 0, i * 2.1]}>
          <cylinderGeometry args={[2, 2, 8, 8]} />
          <meshBasicMaterial color={0xff6600} />
        </mesh>
      ))}

      {/* Dripping effect */}
      <pointLight color={0x00ffff} intensity={0.8} distance={35} />
      <pointLight color={0x00ff88} intensity={0.5} distance={25} position={[15, 0, 0]} />
    </group>
  );
}

// ============================================================================
// CUDA OUT OF MEMORY - GPU derretendo, chip fumando
// ============================================================================
export function AICudaOutOfMemoryModel({ opacity, isWalking, lastAttackTime }: AIErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const smokeRef = useRef<THREE.Mesh[]>([]);
  const meltRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Heavy, slow movement
    groupRef.current.position.y = 10 + Math.sin(phaseRef.current * 0.3) * 1;
    if (isWalking) {
      groupRef.current.rotation.y += delta * 0.15; // Very slow
    }

    // Melt effect
    if (meltRef.current) {
      meltRef.current.scale.y = 0.7 + Math.sin(phaseRef.current) * 0.1;
      meltRef.current.position.y = -8 - Math.sin(phaseRef.current) * 2;
    }

    // Smoke rising
    smokeRef.current.forEach((smoke, i) => {
      if (smoke) {
        smoke.position.y += delta * 20;
        if (smoke.position.y > 50) {
          smoke.position.y = 15;
          smoke.position.x = (Math.random() - 0.5) * 15;
          smoke.position.z = (Math.random() - 0.5) * 15;
        }
        const scale = 1 + (smoke.position.y - 15) * 0.05;
        smoke.scale.setScalar(scale);
        const mat = smoke.material as THREE.MeshBasicMaterial;
        mat.opacity = opacity * Math.max(0, 0.5 - (smoke.position.y - 15) / 70);
      }
    });

    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.scale.setScalar(1.2);
    }
    groupRef.current.scale.lerp(UNIT_VECTOR3, 0.05); // Slow recovery
  });

  return (
    <group ref={groupRef}>
      {/* GPU Card body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[30, 20, 8]} />
        <meshBasicMaterial color={0x222222} />
      </mesh>

      {/* GPU Chip (overheating) */}
      <mesh position={[0, 0, 4.5]}>
        <boxGeometry args={[12, 12, 2]} />
        <meshBasicMaterial color={0xff4400} />
      </mesh>

      {/* Heat sink fins */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`fin-${i}`} position={[(i - 3.5) * 3.5, 8, 0]}>
          <boxGeometry args={[2, 8, 8]} />
          <meshBasicMaterial color={0x888888} />
        </mesh>
      ))}

      {/* Melting part */}
      <mesh ref={meltRef} position={[0, -8, 4]}>
        <cylinderGeometry args={[8, 12, 6, 16]} />
        <meshBasicMaterial color={0xff6600} />
      </mesh>

      {/* VRAM indicators (all red - full) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`vram-${i}`} position={[-12 + i * 3, -6, 4.5]}>
          <boxGeometry args={[2, 3, 0.5]} />
          <meshBasicMaterial color={0xff0000} />
        </mesh>
      ))}

      {/* Smoke particles */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh
          key={`smoke-${i}`}
          ref={(el) => { if (el) smokeRef.current[i] = el; }}
          position={[(Math.random() - 0.5) * 15, 15 + i * 4, (Math.random() - 0.5) * 10]}
        >
          <sphereGeometry args={[3, 8, 8]} />
          <meshBasicMaterial color={0x444444} />
        </mesh>
      ))}

      {/* "OOM" error display */}
      <mesh position={[0, 12, 5]}>
        <boxGeometry args={[15, 4, 0.5]} />
        <meshBasicMaterial color={0xff0000} />
      </mesh>

      {/* Heat glow */}
      <pointLight color={0xff4400} intensity={1} distance={40} />
      <pointLight color={0xff0000} intensity={0.5} distance={25} position={[0, -10, 0]} />
    </group>
  );
}

// ============================================================================
// BIAS VARIANCE - Balança desequilibrada com cérebros
// ============================================================================
export function AIBiasVarianceModel({ opacity, isWalking, lastAttackTime }: AIErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    groupRef.current.position.y = 15;
    if (isWalking) {
      groupRef.current.rotation.y += delta * 0.4;
    }

    // Scale tilting back and forth
    if (scaleRef.current) {
      scaleRef.current.rotation.z = Math.sin(phaseRef.current) * 0.4;
    }

    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.scale.setScalar(1.4);
    }
    groupRef.current.scale.lerp(UNIT_VECTOR3, 0.1);
  });

  return (
    <group ref={groupRef}>
      {/* Scale base/stand */}
      <mesh position={[0, -10, 0]}>
        <cylinderGeometry args={[8, 10, 4, 16]} />
        <meshBasicMaterial color={0x886644} />
      </mesh>
      <mesh position={[0, -5, 0]}>
        <cylinderGeometry args={[2, 2, 15, 8]} />
        <meshBasicMaterial color={0x886644} />
      </mesh>

      {/* Tilting beam */}
      <group ref={scaleRef}>
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[35, 2, 3]} />
          <meshBasicMaterial color={0xaaaa66} />
        </mesh>

        {/* Left pan - BIAS (heavy, simple) */}
        <group position={[-15, -5, 0]}>
          <mesh>
            <cylinderGeometry args={[6, 5, 2, 16]} />
            <meshBasicMaterial color={0xcc8844} />
          </mesh>
          {/* Simple cube brain (high bias = simple) */}
          <mesh position={[0, 4, 0]}>
            <boxGeometry args={[6, 6, 6]} />
            <meshBasicMaterial color={0xff8888} />
          </mesh>
          <mesh position={[0, 10, 0]}>
            <boxGeometry args={[4, 2, 1]} />
            <meshBasicMaterial color={0xffff00} />
          </mesh>
        </group>

        {/* Right pan - VARIANCE (light, complex) */}
        <group position={[15, -5, 0]}>
          <mesh>
            <cylinderGeometry args={[6, 5, 2, 16]} />
            <meshBasicMaterial color={0xcc8844} />
          </mesh>
          {/* Complex spiky brain (high variance = complex) */}
          <mesh position={[0, 4, 0]}>
            <icosahedronGeometry args={[5, 2]} />
            <meshBasicMaterial color={0x88ffff} wireframe />
          </mesh>
          <mesh position={[0, 4, 0]}>
            <dodecahedronGeometry args={[4, 0]} />
            <meshBasicMaterial color={0x88ff88} />
          </mesh>
        </group>

        {/* Chains */}
        {[-15, 15].map((x, i) => (
          <mesh key={`chain-${i}`} position={[x, -2, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 8, 8]} />
            <meshBasicMaterial color={0x666666} />
          </mesh>
        ))}
      </group>

      {/* "TRADEOFF" indicator */}
      <mesh position={[0, 15, 0]}>
        <torusGeometry args={[4, 1, 8, 16]} />
        <meshBasicMaterial color={0xffaa00} />
      </mesh>

      <pointLight color={0xffaa44} intensity={0.5} distance={30} />
    </group>
  );
}

// ============================================================================
// DEAD NEURON - Célula cerebral apagada, zumbi lento
// ============================================================================
export function AIDeadNeuronModel({ opacity, isWalking, lastAttackTime }: AIErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const dendritesRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 0.8; // Very slow

    // Zombie-like slow floating
    groupRef.current.position.y = 15 + Math.sin(phaseRef.current * 0.3) * 2;
    if (isWalking) {
      groupRef.current.rotation.y += delta * 0.1; // Very slow rotation
    }

    // Dendrites occasionally twitch (dying signals)
    dendritesRef.current.forEach((d, i) => {
      if (d) {
        const twitch = Math.random() > 0.98 ? 0.3 : 0;
        d.rotation.z = Math.sin(phaseRef.current * 0.5 + i) * 0.1 + twitch;
      }
    });

    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.scale.setScalar(1.2);
    }
    groupRef.current.scale.lerp(UNIT_VECTOR3, 0.05); // Very slow recovery
  });

  return (
    <group ref={groupRef}>
      {/* Neuron cell body - gray/dead */}
      <mesh>
        <sphereGeometry args={[10, 16, 12]} />
        <meshBasicMaterial color={0x333344} />
      </mesh>

      {/* Nucleus - dark */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[5, 12, 12]} />
        <meshBasicMaterial color={0x111122} />
      </mesh>

      {/* Dead dendrites (input branches) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const length = 15 + Math.random() * 5;
        return (
          <mesh
            key={`dendrite-${i}`}
            ref={(el) => { if (el) dendritesRef.current[i] = el; }}
            position={[Math.cos(angle) * 12, Math.sin(angle) * 12, (Math.random() - 0.5) * 10]}
            rotation={[0, 0, angle + Math.PI / 2]}
          >
            <cylinderGeometry args={[1, 0.3, length, 6]} />
            <meshBasicMaterial color={0x444455} />
          </mesh>
        );
      })}

      {/* Axon (output) - broken/short */}
      <mesh position={[0, -12, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[2, 1, 10, 8]} />
        <meshBasicMaterial color={0x333344} />
      </mesh>

      {/* Broken end */}
      <mesh position={[0, -18, 0]}>
        <coneGeometry args={[3, 4, 8]} />
        <meshBasicMaterial color={0x222233} />
      </mesh>

      {/* X eyes (dead) */}
      <group position={[0, 3, 9]}>
        <mesh position={[-3, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[4, 1, 0.5]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
        <mesh position={[-3, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[4, 1, 0.5]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
        <mesh position={[3, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[4, 1, 0.5]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
        <mesh position={[3, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[4, 1, 0.5]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
      </group>

      <pointLight color={0x334455} intensity={0.2} distance={20} />
    </group>
  );
}

// ============================================================================
// NaN LOSS - Display com "NaN" e faíscas, caos total
// ============================================================================
export function AINaNLossModel({ opacity, lastAttackTime }: AIErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const sparksRef = useRef<THREE.Mesh[]>([]);
  const screenRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 5; // Fast, chaotic

    // Chaotic movement
    groupRef.current.position.x = (Math.random() - 0.5) * 8;
    groupRef.current.position.z = (Math.random() - 0.5) * 8;
    groupRef.current.position.y = 15 + (Math.random() - 0.5) * 5;
    groupRef.current.rotation.z = (Math.random() - 0.5) * 0.3;

    // Screen flicker
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshBasicMaterial;
      mat.color.setHex(Math.random() > 0.5 ? 0xff0000 : 0xff4400);
    }

    // Sparks flying everywhere
    sparksRef.current.forEach((spark, i) => {
      if (spark) {
        spark.position.x += (Math.random() - 0.5) * 5;
        spark.position.y += (Math.random() - 0.5) * 5;
        spark.position.z += (Math.random() - 0.5) * 5;

        // Reset if too far
        const dist = spark.position.length();
        if (dist > 30) {
          spark.position.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
          );
        }
      }
    });

    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.scale.setScalar(2);
    }
    groupRef.current.scale.lerp(UNIT_VECTOR3, 0.15);
  });

  return (
    <group ref={groupRef}>
      {/* Monitor/Display */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[25, 18, 3]} />
        <meshBasicMaterial color={0x222222} />
      </mesh>

      {/* Screen showing error */}
      <mesh ref={screenRef} position={[0, 0, 2]}>
        <boxGeometry args={[22, 15, 0.5]} />
        <meshBasicMaterial color={0xff0000} />
      </mesh>

      {/* "NaN" text representation */}
      <group position={[0, 0, 2.5]}>
        {/* N */}
        <mesh position={[-7, 0, 0]}>
          <boxGeometry args={[2, 10, 0.5]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
        <mesh position={[-3, 0, 0]}>
          <boxGeometry args={[2, 10, 0.5]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
        <mesh position={[-5, 0, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[2, 12, 0.5]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>

        {/* a */}
        <mesh position={[0, -2, 0]}>
          <torusGeometry args={[3, 1, 8, 16]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>

        {/* N */}
        <mesh position={[5, 0, 0]}>
          <boxGeometry args={[2, 10, 0.5]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
        <mesh position={[9, 0, 0]}>
          <boxGeometry args={[2, 10, 0.5]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
        <mesh position={[7, 0, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[2, 12, 0.5]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
      </group>

      {/* Sparks */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh
          key={`spark-${i}`}
          ref={(el) => { if (el) sparksRef.current[i] = el; }}
          position={[(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color={Math.random() > 0.5 ? 0xffff00 : 0xff8800} />
        </mesh>
      ))}

      {/* Error symbols floating */}
      {[0, 1, 2].map((i) => (
        <mesh key={`error-${i}`} position={[Math.cos(i * 2.1) * 18, Math.sin(i * 2.1) * 12, 5]}>
          <octahedronGeometry args={[3, 0]} />
          <meshBasicMaterial color={0xff0000} />
        </mesh>
      ))}

      {/* Chaotic lights */}
      <pointLight color={0xff0000} intensity={1.5} distance={35} />
      <pointLight color={0xffff00} intensity={1} distance={25} position={[10, 10, 10]} />
      <pointLight color={0xff8800} intensity={0.8} distance={20} position={[-10, -5, 5]} />
    </group>
  );
}
