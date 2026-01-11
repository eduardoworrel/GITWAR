// @ts-nocheck
// Models may not use all props - each has its own internal color scheme
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNIT_VECTOR3 } from './optimizations';

interface ErrorModelProps {
  color: number;
  opacity: number;
  isWalking: boolean;
  lastAttackTime: number | null;
}

// ============================================================================
// KOTLIN ERRORS
// ============================================================================

// Kotlin NullPointerException - K estilizado quebrado
export function KotlinNullPointerModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const fragmentsRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // K fragments float and separate
    fragmentsRef.current.forEach((frag, i) => {
      if (frag) {
        frag.position.x = (i - 1) * 8 + Math.sin(phaseRef.current + i) * 2;
        frag.position.y = 15 + Math.sin(phaseRef.current * 1.5 + i) * 3;
        frag.rotation.z = Math.sin(phaseRef.current + i * 0.5) * 0.2;
      }
    });

    // Attack - fragments scatter
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      fragmentsRef.current.forEach((frag, i) => {
        if (frag) {
          frag.position.x += (i - 1) * 10;
        }
      });
    }
  });

  const kotlinPurple = 0x7f52ff;
  const kotlinOrange = 0xf88909;

  return (
    <group ref={groupRef}>
      {/* Broken K - vertical bar */}
      <mesh
        ref={(el) => { if (el) fragmentsRef.current[0] = el; }}
        position={[-8, 15, 0]}
      >
        <boxGeometry args={[4, 20, 3]} />
        <meshBasicMaterial color={kotlinPurple} transparent opacity={opacity} />
      </mesh>

      {/* K upper diagonal - cracked */}
      <mesh
        ref={(el) => { if (el) fragmentsRef.current[1] = el; }}
        position={[0, 20, 0]}
        rotation={[0, 0, -0.7]}
      >
        <boxGeometry args={[4, 12, 3]} />
        <meshBasicMaterial color={kotlinOrange} transparent opacity={opacity} />
      </mesh>

      {/* K lower diagonal - cracked */}
      <mesh
        ref={(el) => { if (el) fragmentsRef.current[2] = el; }}
        position={[0, 10, 0]}
        rotation={[0, 0, 0.7]}
      >
        <boxGeometry args={[4, 12, 3]} />
        <meshBasicMaterial color={kotlinOrange} transparent opacity={opacity} />
      </mesh>

      {/* Crack lines */}
      {[0, 1, 2].map((i) => (
        <mesh key={`crack-${i}`} position={[-4 + i * 4, 15 + (i - 1) * 3, 2]}>
          <boxGeometry args={[0.5, 6, 0.5]} />
          <meshBasicMaterial color={0x333333} transparent opacity={opacity} />
        </mesh>
      ))}

      {/* "null" spark */}
      <mesh position={[0, 30, 0]}>
        <sphereGeometry args={[3, 8, 8]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity * 0.7} />
      </mesh>
    </group>
  );
}

// Kotlin ClassCastException - Diamante tentando virar círculo
export function KotlinClassCastModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const shapeRef = useRef<THREE.Mesh>(null);
  const morphRef = useRef(0);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;
    morphRef.current += delta * 0.5;

    // Shape wobbles between forms
    if (shapeRef.current) {
      shapeRef.current.rotation.y += delta;
      shapeRef.current.scale.x = 1 + Math.sin(morphRef.current) * 0.3;
      shapeRef.current.scale.z = 1 + Math.cos(morphRef.current) * 0.3;
    }

    // Attack - violent morph
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      morphRef.current += 2;
    }
  });

  const kotlinPurple = 0x7f52ff;

  return (
    <group ref={groupRef} position={[0, 15, 0]}>
      {/* Morphing shape */}
      <mesh ref={shapeRef}>
        <octahedronGeometry args={[10, 0]} />
        <meshBasicMaterial color={kotlinPurple} transparent opacity={opacity} wireframe />
      </mesh>

      {/* Target circle (dashed) */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[12, 1, 8, 16]} />
        <meshBasicMaterial color={0x00ff00} transparent opacity={opacity * 0.3} />
      </mesh>

      {/* Arrow showing cast direction */}
      <mesh position={[0, 0, 15]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[3, 8, 8]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>

      {/* "as" text */}
      <mesh position={[15, 0, 0]}>
        <boxGeometry args={[6, 4, 1]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// Kotlin UninitializedPropertyAccess - Construcao inacabada
export function KotlinUninitializedModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const blocksRef = useRef<THREE.Mesh[]>([]);
  const craneRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;

    // Crane swings
    if (craneRef.current) {
      craneRef.current.rotation.y = Math.sin(phaseRef.current * 0.5) * 0.3;
    }

    // Blocks wobble
    blocksRef.current.forEach((block, i) => {
      if (block) {
        block.rotation.z = Math.sin(phaseRef.current + i) * 0.05;
      }
    });

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      blocksRef.current.forEach((block) => {
        if (block) block.position.y += 5;
      });
    }
    blocksRef.current.forEach((block) => {
      if (block) block.position.y *= 0.98;
    });
  });

  const kotlinPurple = 0x7f52ff;
  const concrete = 0x888888;

  return (
    <group ref={groupRef}>
      {/* Incomplete building blocks */}
      <mesh
        ref={(el) => { if (el) blocksRef.current[0] = el; }}
        position={[0, 5, 0]}
      >
        <boxGeometry args={[20, 10, 15]} />
        <meshBasicMaterial color={concrete} transparent opacity={opacity} />
      </mesh>
      <mesh
        ref={(el) => { if (el) blocksRef.current[1] = el; }}
        position={[-5, 15, 0]}
      >
        <boxGeometry args={[10, 10, 15]} />
        <meshBasicMaterial color={concrete} transparent opacity={opacity * 0.8} />
      </mesh>
      <mesh
        ref={(el) => { if (el) blocksRef.current[2] = el; }}
        position={[5, 12, 0]}
      >
        <boxGeometry args={[10, 4, 15]} />
        <meshBasicMaterial color={concrete} transparent opacity={opacity * 0.5} wireframe />
      </mesh>

      {/* Construction crane */}
      <group ref={craneRef} position={[15, 0, 0]}>
        <mesh position={[0, 20, 0]}>
          <boxGeometry args={[2, 40, 2]} />
          <meshBasicMaterial color={0xffaa00} transparent opacity={opacity} />
        </mesh>
        <mesh position={[10, 38, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[2, 20, 2]} />
          <meshBasicMaterial color={0xffaa00} transparent opacity={opacity} />
        </mesh>
        {/* Hanging block */}
        <mesh position={[15, 30, 0]}>
          <boxGeometry args={[5, 5, 5]} />
          <meshBasicMaterial color={kotlinPurple} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* "lateinit" sign */}
      <mesh position={[0, 25, 10]}>
        <boxGeometry args={[14, 4, 1]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// ============================================================================
// SCALA ERRORS
// ============================================================================

// Scala MatchError - Escada sem degraus
export function ScalaMatchErrorModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const stepsRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Missing steps flicker
    stepsRef.current.forEach((step, i) => {
      if (step) {
        const mat = step.material as THREE.MeshBasicMaterial;
        mat.opacity = (i % 2 === 0) ? opacity * 0.2 : opacity * (0.3 + Math.sin(phaseRef.current + i) * 0.2);
      }
    });

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.rotation.z = 0.3;
    }
    groupRef.current.rotation.z *= 0.95;
  });

  const scalaRed = 0xdc322f;

  return (
    <group ref={groupRef}>
      {/* Staircase rails */}
      <mesh position={[-8, 15, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[2, 35, 2]} />
        <meshBasicMaterial color={scalaRed} transparent opacity={opacity} />
      </mesh>
      <mesh position={[8, 15, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[2, 35, 2]} />
        <meshBasicMaterial color={scalaRed} transparent opacity={opacity} />
      </mesh>

      {/* Missing/ghost steps */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh
          key={`step-${i}`}
          ref={(el) => { if (el) stepsRef.current[i] = el; }}
          position={[0, 3 + i * 5, i * 3]}
        >
          <boxGeometry args={[14, 2, 6]} />
          <meshBasicMaterial color={scalaRed} transparent opacity={opacity * 0.3} />
        </mesh>
      ))}

      {/* "case _" pattern */}
      <mesh position={[0, 35, 0]}>
        <boxGeometry args={[12, 4, 1]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
      </mesh>

      {/* Question marks */}
      {[-1, 0, 1].map((i) => (
        <mesh key={`q-${i}`} position={[i * 6, 38, 5]}>
          <boxGeometry args={[3, 5, 1]} />
          <meshBasicMaterial color={0xffff00} transparent opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
}

// Scala AbstractMethodError - Forma abstrata incompleta
export function ScalaAbstractMethodModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const outlineRef = useRef<THREE.Mesh>(null);
  const dotsRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Outline pulses
    if (outlineRef.current) {
      outlineRef.current.scale.setScalar(1 + Math.sin(phaseRef.current) * 0.1);
    }

    // Dots move around trying to fill
    dotsRef.current.forEach((dot, i) => {
      if (dot) {
        const angle = phaseRef.current + (i * Math.PI * 2 / 5);
        dot.position.x = Math.cos(angle) * 8;
        dot.position.z = Math.sin(angle) * 8;
      }
    });

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (outlineRef.current) {
        outlineRef.current.scale.setScalar(1.5);
      }
    }
  });

  const scalaRed = 0xdc322f;

  return (
    <group ref={groupRef} position={[0, 15, 0]}>
      {/* Abstract shape outline - hollow */}
      <mesh ref={outlineRef}>
        <dodecahedronGeometry args={[12, 0]} />
        <meshBasicMaterial color={scalaRed} transparent opacity={opacity} wireframe />
      </mesh>

      {/* Floating dots - implementation attempts */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={`dot-${i}`}
          ref={(el) => { if (el) dotsRef.current[i] = el; }}
          position={[0, 0, 0]}
        >
          <sphereGeometry args={[2, 8, 8]} />
          <meshBasicMaterial color={0xffffff} transparent opacity={opacity * 0.5} />
        </mesh>
      ))}

      {/* "???" inside */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[6, 4, 1]} />
        <meshBasicMaterial color={0xffff00} transparent opacity={opacity} />
      </mesh>

      {/* "def" label */}
      <mesh position={[0, 18, 0]}>
        <boxGeometry args={[8, 3, 1]} />
        <meshBasicMaterial color={scalaRed} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// Scala StackOverflowError - Escada infinita
export function ScalaStackOverflowModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spiralRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;

    // Infinite spiral rotates
    if (spiralRef.current) {
      spiralRef.current.rotation.y += delta * 0.5;
    }

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (spiralRef.current) {
        spiralRef.current.rotation.y += 2;
      }
    }
  });

  const scalaRed = 0xdc322f;

  return (
    <group ref={groupRef}>
      {/* Infinite spiral staircase */}
      <group ref={spiralRef}>
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * Math.PI * 4;
          const radius = 10;
          return (
            <mesh
              key={`step-${i}`}
              position={[
                Math.cos(angle) * radius,
                i * 2,
                Math.sin(angle) * radius
              ]}
              rotation={[0, -angle, 0]}
            >
              <boxGeometry args={[8, 1, 4]} />
              <meshBasicMaterial
                color={scalaRed}
                transparent
                opacity={opacity * (1 - i * 0.04)}
              />
            </mesh>
          );
        })}
      </group>

      {/* Central pole */}
      <mesh position={[0, 20, 0]}>
        <cylinderGeometry args={[2, 2, 45, 16]} />
        <meshBasicMaterial color={0x666666} transparent opacity={opacity} />
      </mesh>

      {/* Infinity symbol at top */}
      <mesh position={[-4, 45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[3, 1, 8, 16]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
      </mesh>
      <mesh position={[4, 45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[3, 1, 8, 16]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// ============================================================================
// R ERRORS
// ============================================================================

// R Error in eval - Grafico estatistico corrompido
export function REvalErrorModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const barsRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 3;

    // Bars glitch
    barsRef.current.forEach((bar, i) => {
      if (bar) {
        bar.scale.y = 0.5 + Math.random() * 1.5;
        bar.position.y = bar.scale.y * 5;
        bar.rotation.z = Math.sin(phaseRef.current + i) * 0.3;
      }
    });

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      barsRef.current.forEach((bar) => {
        if (bar) bar.scale.y = 3;
      });
    }
  });

  const rBlue = 0x276dc3;

  return (
    <group ref={groupRef}>
      {/* Chart axes */}
      <mesh position={[-12, 10, 0]}>
        <boxGeometry args={[2, 25, 2]} />
        <meshBasicMaterial color={0x333333} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[30, 2, 2]} />
        <meshBasicMaterial color={0x333333} transparent opacity={opacity} />
      </mesh>

      {/* Corrupted bar chart */}
      {[-2, -1, 0, 1, 2].map((i) => (
        <mesh
          key={`bar-${i}`}
          ref={(el) => { if (el) barsRef.current[i + 2] = el; }}
          position={[i * 5, 10, 0]}
        >
          <boxGeometry args={[4, 20, 4]} />
          <meshBasicMaterial color={rBlue} transparent opacity={opacity} />
        </mesh>
      ))}

      {/* Error scatter */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={`scatter-${i}`}
          position={[(i - 1.5) * 8, 20 + i * 3, 5]}
        >
          <sphereGeometry args={[2, 8, 8]} />
          <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
        </mesh>
      ))}

      {/* "Error in eval" */}
      <mesh position={[0, 35, 0]}>
        <boxGeometry args={[20, 4, 1]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// R object not found - Lupa procurando invisivel
export function RObjectNotFoundModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const magnifierRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Magnifier searches around
    if (magnifierRef.current) {
      magnifierRef.current.position.x = Math.sin(phaseRef.current) * 10;
      magnifierRef.current.position.z = Math.cos(phaseRef.current * 0.7) * 5;
      magnifierRef.current.rotation.z = Math.sin(phaseRef.current * 0.5) * 0.2;
    }

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (magnifierRef.current) {
        magnifierRef.current.scale.setScalar(1.5);
      }
    }
    if (magnifierRef.current) {
      magnifierRef.current.scale.lerp(UNIT_VECTOR3, 0.1);
    }
  });

  const rBlue = 0x276dc3;

  return (
    <group ref={groupRef}>
      {/* Magnifying glass */}
      <group ref={magnifierRef} position={[0, 18, 0]}>
        {/* Glass */}
        <mesh>
          <torusGeometry args={[8, 1.5, 16, 32]} />
          <meshBasicMaterial color={rBlue} transparent opacity={opacity} />
        </mesh>
        <mesh>
          <circleGeometry args={[8, 32]} />
          <meshBasicMaterial color={0xaaddff} transparent opacity={opacity * 0.3} />
        </mesh>
        {/* Handle */}
        <mesh position={[8, -8, 0]} rotation={[0, 0, -0.7]}>
          <cylinderGeometry args={[1.5, 1.5, 12, 8]} />
          <meshBasicMaterial color={0x8b4513} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* Ghost outline of missing object */}
      <mesh position={[0, 15, 0]}>
        <boxGeometry args={[10, 10, 10]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={0.1} wireframe />
      </mesh>

      {/* Question marks around */}
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2;
        return (
          <mesh
            key={`q-${i}`}
            position={[Math.cos(angle) * 15, 25, Math.sin(angle) * 15]}
          >
            <boxGeometry args={[3, 5, 1]} />
            <meshBasicMaterial color={0xffff00} transparent opacity={opacity} />
          </mesh>
        );
      })}
    </group>
  );
}

// R subscript out of bounds - Vetor com indice vermelho
export function RSubscriptOutOfBoundsModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pointerRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Pointer bounces beyond array
    if (pointerRef.current) {
      pointerRef.current.position.x = 15 + Math.abs(Math.sin(phaseRef.current * 2)) * 10;
    }

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (pointerRef.current) {
        pointerRef.current.position.x = 35;
      }
    }
  });

  const rBlue = 0x276dc3;

  return (
    <group ref={groupRef}>
      {/* Vector/Array boxes */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={`box-${i}`} position={[-10 + i * 5, 10, 0]}>
          <boxGeometry args={[4, 8, 8]} />
          <meshBasicMaterial color={rBlue} transparent opacity={opacity} />
        </mesh>
      ))}

      {/* Index numbers */}
      {[1, 2, 3, 4, 5].map((i) => (
        <mesh key={`idx-${i}`} position={[-10 + (i - 1) * 5, 0, 5]}>
          <boxGeometry args={[3, 3, 1]} />
          <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
        </mesh>
      ))}

      {/* Out of bounds pointer */}
      <mesh ref={pointerRef} position={[20, 20, 0]}>
        <coneGeometry args={[4, 8, 8]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>

      {/* Invalid index */}
      <mesh position={[25, 0, 5]}>
        <boxGeometry args={[5, 3, 1]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>

      {/* Array boundary */}
      <mesh position={[12, 10, 0]}>
        <boxGeometry args={[1, 15, 10]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity * 0.5} />
      </mesh>
    </group>
  );
}

// ============================================================================
// SQL ERRORS
// ============================================================================

// SQL Deadlock - Tabelas encadeadas com cadeados
export function SqlDeadlockModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const tablesRef = useRef<THREE.Group[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;

    // Tables shake trying to escape
    tablesRef.current.forEach((table, i) => {
      if (table) {
        table.rotation.z = Math.sin(phaseRef.current * 5 + i) * 0.05;
      }
    });

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      tablesRef.current.forEach((table) => {
        if (table) table.rotation.z = 0.3;
      });
    }
  });

  const sqlBlue = 0x0078d7;

  return (
    <group ref={groupRef}>
      {/* Table 1 */}
      <group ref={(el) => { if (el) tablesRef.current[0] = el; }} position={[-12, 15, 0]}>
        <mesh>
          <boxGeometry args={[15, 12, 8]} />
          <meshBasicMaterial color={sqlBlue} transparent opacity={opacity} />
        </mesh>
        {/* Grid lines */}
        <mesh position={[0, 0, 4.1]}>
          <boxGeometry args={[15, 0.5, 0.5]} />
          <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
        </mesh>
        <mesh position={[0, 0, 4.1]}>
          <boxGeometry args={[0.5, 12, 0.5]} />
          <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* Table 2 */}
      <group ref={(el) => { if (el) tablesRef.current[1] = el; }} position={[12, 15, 0]}>
        <mesh>
          <boxGeometry args={[15, 12, 8]} />
          <meshBasicMaterial color={sqlBlue} transparent opacity={opacity} />
        </mesh>
        <mesh position={[0, 0, 4.1]}>
          <boxGeometry args={[15, 0.5, 0.5]} />
          <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
        </mesh>
        <mesh position={[0, 0, 4.1]}>
          <boxGeometry args={[0.5, 12, 0.5]} />
          <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* Chains between them */}
      <mesh position={[0, 20, 0]}>
        <torusGeometry args={[8, 1, 8, 16]} />
        <meshBasicMaterial color={0x888888} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 10, 0]}>
        <torusGeometry args={[8, 1, 8, 16]} />
        <meshBasicMaterial color={0x888888} transparent opacity={opacity} />
      </mesh>

      {/* Locks */}
      <mesh position={[-5, 15, 8]}>
        <boxGeometry args={[4, 5, 2]} />
        <meshBasicMaterial color={0xffcc00} transparent opacity={opacity} />
      </mesh>
      <mesh position={[5, 15, 8]}>
        <boxGeometry args={[4, 5, 2]} />
        <meshBasicMaterial color={0xffcc00} transparent opacity={opacity} />
      </mesh>

      {/* DEADLOCK sign */}
      <mesh position={[0, 30, 0]}>
        <boxGeometry args={[18, 4, 1]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// SQL Syntax Error - Query quebrada
export function SqlSyntaxErrorModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const fragmentsRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Fragments float chaotically
    fragmentsRef.current.forEach((frag, i) => {
      if (frag) {
        frag.position.y = 15 + Math.sin(phaseRef.current + i * 0.5) * 5;
        frag.rotation.z = Math.sin(phaseRef.current * 0.5 + i) * 0.3;
      }
    });

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      fragmentsRef.current.forEach((frag, i) => {
        if (frag) {
          frag.position.x += (i - 2) * 5;
        }
      });
    }
    fragmentsRef.current.forEach((frag) => {
      if (frag) frag.position.x *= 0.95;
    });
  });

  const sqlBlue = 0x0078d7;

  return (
    <group ref={groupRef}>
      {/* Broken SQL keywords */}
      <mesh
        ref={(el) => { if (el) fragmentsRef.current[0] = el; }}
        position={[-15, 15, 0]}
      >
        <boxGeometry args={[10, 4, 2]} />
        <meshBasicMaterial color={sqlBlue} transparent opacity={opacity} />
      </mesh>
      <mesh
        ref={(el) => { if (el) fragmentsRef.current[1] = el; }}
        position={[-5, 18, 0]}
        rotation={[0, 0, 0.2]}
      >
        <boxGeometry args={[8, 3, 2]} />
        <meshBasicMaterial color={0x00aa00} transparent opacity={opacity} />
      </mesh>
      <mesh
        ref={(el) => { if (el) fragmentsRef.current[2] = el; }}
        position={[5, 12, 0]}
        rotation={[0, 0, -0.3]}
      >
        <boxGeometry args={[12, 3, 2]} />
        <meshBasicMaterial color={0xffaa00} transparent opacity={opacity} />
      </mesh>
      <mesh
        ref={(el) => { if (el) fragmentsRef.current[3] = el; }}
        position={[15, 20, 0]}
        rotation={[0, 0, 0.5]}
      >
        <boxGeometry args={[6, 3, 2]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>

      {/* Broken semicolon */}
      <mesh position={[20, 10, 5]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
      <mesh position={[20, 5, 5]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>

      {/* Error caret */}
      <mesh position={[0, 5, 5]}>
        <coneGeometry args={[2, 4, 3]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// SQL Timeout - Tubo de dados entupido
export function SqlTimeoutModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const dataRef = useRef<THREE.Mesh[]>([]);
  const clockRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;

    // Data blocks stuck and jiggle
    dataRef.current.forEach((data, i) => {
      if (data) {
        data.position.x = -10 + i * 3 + Math.sin(phaseRef.current * 3 + i) * 0.5;
      }
    });

    // Clock ticks
    if (clockRef.current) {
      clockRef.current.rotation.z = -phaseRef.current * 0.5;
    }

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (clockRef.current) {
        clockRef.current.scale.setScalar(1.5);
      }
    }
    if (clockRef.current) {
      clockRef.current.scale.lerp(UNIT_VECTOR3, 0.1);
    }
  });

  const sqlBlue = 0x0078d7;

  return (
    <group ref={groupRef}>
      {/* Pipe */}
      <mesh position={[0, 15, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[6, 6, 40, 16, 1, true]} />
        <meshBasicMaterial color={0x666666} transparent opacity={opacity} side={THREE.DoubleSide} />
      </mesh>

      {/* Stuck data blocks */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <mesh
          key={`data-${i}`}
          ref={(el) => { if (el) dataRef.current[i] = el; }}
          position={[-10 + i * 3, 15, 0]}
        >
          <boxGeometry args={[2, 3, 3]} />
          <meshBasicMaterial color={sqlBlue} transparent opacity={opacity} />
        </mesh>
      ))}

      {/* Blockage */}
      <mesh position={[5, 15, 0]}>
        <sphereGeometry args={[5, 8, 8]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity * 0.7} />
      </mesh>

      {/* Clock */}
      <group ref={clockRef} position={[0, 30, 5]}>
        <mesh>
          <circleGeometry args={[6, 16]} />
          <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, 2, 0.5]}>
          <boxGeometry args={[0.5, 4, 0.5]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
      </group>
    </group>
  );
}

// ============================================================================
// SHELL/BASH ERRORS
// ============================================================================

// Bash command not found - Terminal com "?" piscando
export function BashCommandNotFoundModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cursorRef = useRef<THREE.Mesh>(null);
  const questionRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 4;

    // Cursor blinks
    if (cursorRef.current) {
      const mat = cursorRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.sin(phaseRef.current * 2) > 0 ? opacity : 0;
    }

    // Question mark pulses
    if (questionRef.current) {
      questionRef.current.scale.setScalar(1 + Math.sin(phaseRef.current) * 0.2);
    }

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (questionRef.current) {
        questionRef.current.scale.setScalar(2);
      }
    }
  });

  const terminalGreen = 0x00ff00;
  const terminalBg = 0x1a1a1a;

  return (
    <group ref={groupRef}>
      {/* Terminal screen */}
      <mesh position={[0, 15, 0]}>
        <boxGeometry args={[30, 22, 3]} />
        <meshBasicMaterial color={terminalBg} transparent opacity={opacity} />
      </mesh>

      {/* Screen bezel */}
      <mesh position={[0, 15, -2]}>
        <boxGeometry args={[34, 26, 2]} />
        <meshBasicMaterial color={0x333333} transparent opacity={opacity} />
      </mesh>

      {/* Prompt line */}
      <mesh position={[-10, 18, 2]}>
        <boxGeometry args={[4, 2, 0.5]} />
        <meshBasicMaterial color={terminalGreen} transparent opacity={opacity} />
      </mesh>

      {/* Command text */}
      <mesh position={[0, 18, 2]}>
        <boxGeometry args={[12, 2, 0.5]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
      </mesh>

      {/* Blinking cursor */}
      <mesh ref={cursorRef} position={[10, 18, 2]}>
        <boxGeometry args={[2, 3, 0.5]} />
        <meshBasicMaterial color={terminalGreen} transparent opacity={opacity} />
      </mesh>

      {/* Error message */}
      <mesh position={[0, 12, 2]}>
        <boxGeometry args={[24, 2, 0.5]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>

      {/* Big question mark */}
      <mesh ref={questionRef} position={[0, 5, 5]}>
        <boxGeometry args={[6, 10, 2]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// Bash Permission denied - Cadeado gigante vermelho
export function BashPermissionDeniedModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lockRef = useRef<THREE.Group>(null);
  const shackleRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;

    // Lock shakes when walking
    if (isWalking && lockRef.current) {
      lockRef.current.rotation.z = Math.sin(phaseRef.current * 10) * 0.1;
    }

    // Attack - shackle shakes violently
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (shackleRef.current) {
        shackleRef.current.rotation.x = 0.5;
      }
    }
    if (shackleRef.current) {
      shackleRef.current.rotation.x *= 0.95;
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={lockRef} position={[0, 15, 0]}>
        {/* Lock body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[20, 16, 8]} />
          <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
        </mesh>

        {/* Keyhole */}
        <mesh position={[0, -2, 5]}>
          <cylinderGeometry args={[2, 2, 2, 16]} />
          <meshBasicMaterial color={0x111111} />
        </mesh>
        <mesh position={[0, -5, 5]}>
          <boxGeometry args={[2, 4, 2]} />
          <meshBasicMaterial color={0x111111} />
        </mesh>

        {/* Shackle */}
        <mesh ref={shackleRef} position={[0, 14, 0]}>
          <torusGeometry args={[8, 2, 8, 16, Math.PI]} />
          <meshBasicMaterial color={0x888888} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* "X" marks */}
      <mesh position={[-8, 28, 5]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[8, 2, 1]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
      </mesh>
      <mesh position={[-8, 28, 5]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[8, 2, 1]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
      </mesh>
      <mesh position={[8, 28, 5]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[8, 2, 1]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
      </mesh>
      <mesh position={[8, 28, 5]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[8, 2, 1]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// Bash core dumped - Nucleo vazando dados
export function BashCoreDumpedModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const dataRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Core pulses and leaks
    if (coreRef.current) {
      coreRef.current.scale.setScalar(1 + Math.sin(phaseRef.current * 3) * 0.1);
    }

    // Data particles leak out
    dataRef.current.forEach((data, i) => {
      if (data) {
        const angle = phaseRef.current * 0.5 + (i * Math.PI * 2 / 8);
        const radius = 12 + Math.sin(phaseRef.current + i) * 3;
        data.position.x = Math.cos(angle) * radius;
        data.position.z = Math.sin(angle) * radius;
        data.position.y = 15 - (phaseRef.current * 2 + i * 2) % 20;
      }
    });

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      dataRef.current.forEach((data) => {
        if (data) data.position.y = 30;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* Cracked core */}
      <mesh ref={coreRef} position={[0, 15, 0]}>
        <icosahedronGeometry args={[10, 0]} />
        <meshBasicMaterial color={0xff6600} transparent opacity={opacity} />
      </mesh>

      {/* Cracks */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={`crack-${i}`}
          position={[
            Math.cos(i * Math.PI / 2) * 8,
            15,
            Math.sin(i * Math.PI / 2) * 8
          ]}
          rotation={[0, i * Math.PI / 2, 0]}
        >
          <boxGeometry args={[1, 10, 1]} />
          <meshBasicMaterial color={0x000000} transparent opacity={opacity} />
        </mesh>
      ))}

      {/* Leaking data particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={`data-${i}`}
          ref={(el) => { if (el) dataRef.current[i] = el; }}
        >
          <boxGeometry args={[2, 2, 2]} />
          <meshBasicMaterial color={0x00ff00} transparent opacity={opacity * 0.7} />
        </mesh>
      ))}

      {/* Memory addresses floating */}
      {[0, 1, 2].map((i) => (
        <mesh key={`addr-${i}`} position={[(i - 1) * 10, 30, 0]}>
          <boxGeometry args={[8, 2, 1]} />
          <meshBasicMaterial color={0x00ffff} transparent opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// PERL ERRORS
// ============================================================================

// Perl uninitialized value - Camelo transparente
export function PerlUninitializedModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Ghost camel flickers
    if (bodyRef.current) {
      const mat = bodyRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = opacity * (0.3 + Math.sin(phaseRef.current * 3) * 0.2);
    }

    // Walking sway
    if (isWalking) {
      groupRef.current.rotation.z = Math.sin(phaseRef.current * 4) * 0.1;
    }

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (bodyRef.current) {
        (bodyRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
      }
    }
  });

  const perlBlue = 0x39457e;

  return (
    <group ref={groupRef}>
      {/* Camel body - transparent */}
      <mesh ref={bodyRef} position={[0, 12, 0]}>
        <capsuleGeometry args={[8, 12, 8, 16]} />
        <meshBasicMaterial color={perlBlue} transparent opacity={opacity * 0.3} />
      </mesh>

      {/* Humps */}
      <mesh position={[-4, 20, 0]}>
        <sphereGeometry args={[4, 8, 8]} />
        <meshBasicMaterial color={perlBlue} transparent opacity={opacity * 0.3} />
      </mesh>
      <mesh position={[4, 22, 0]}>
        <sphereGeometry args={[5, 8, 8]} />
        <meshBasicMaterial color={perlBlue} transparent opacity={opacity * 0.3} />
      </mesh>

      {/* Head */}
      <mesh position={[12, 18, 0]}>
        <sphereGeometry args={[4, 8, 8]} />
        <meshBasicMaterial color={perlBlue} transparent opacity={opacity * 0.3} />
      </mesh>

      {/* Legs - dashed/broken */}
      {[-1, 1].map((side) => (
        [-1, 1].map((front) => (
          <mesh
            key={`leg-${side}-${front}`}
            position={[front * 6, 4, side * 5]}
          >
            <cylinderGeometry args={[1.5, 1.5, 8, 8]} />
            <meshBasicMaterial color={perlBlue} transparent opacity={opacity * 0.2} />
          </mesh>
        ))
      ))}

      {/* "undef" text */}
      <mesh position={[0, 30, 0]}>
        <boxGeometry args={[12, 4, 1]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// Perl syntax error - Regex impossivel de ler
export function PerlSyntaxErrorModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const symbolsRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Symbols swirl chaotically
    symbolsRef.current.forEach((sym, i) => {
      if (sym) {
        const angle = phaseRef.current + (i * Math.PI * 2 / 10);
        const radius = 8 + Math.sin(phaseRef.current * 0.5 + i) * 3;
        sym.position.x = Math.cos(angle) * radius;
        sym.position.z = Math.sin(angle) * radius;
        sym.rotation.z = phaseRef.current + i;
      }
    });

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      symbolsRef.current.forEach((sym) => {
        if (sym) sym.scale.setScalar(2);
      });
    }
    symbolsRef.current.forEach((sym) => {
      if (sym) sym.scale.lerp(UNIT_VECTOR3, 0.1);
    });
  });

  const perlBlue = 0x39457e;
  const symbols = ['$', '@', '%', '&', '*', '/', '\\', '|', '?', '+'];

  return (
    <group ref={groupRef} position={[0, 15, 0]}>
      {/* Chaotic regex symbols */}
      {symbols.map((_, i) => (
        <mesh
          key={`sym-${i}`}
          ref={(el) => { if (el) symbolsRef.current[i] = el; }}
          position={[0, 0, 0]}
        >
          <boxGeometry args={[3, 4, 1]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? perlBlue : 0xff0000}
            transparent
            opacity={opacity}
          />
        </mesh>
      ))}

      {/* Slashes everywhere */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={`slash-${i}`}
          position={[(i - 1.5) * 5, 15, 0]}
          rotation={[0, 0, Math.PI / 4]}
        >
          <boxGeometry args={[1, 8, 1]} />
          <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
        </mesh>
      ))}

      {/* Confused face */}
      <mesh position={[0, -5, 8]}>
        <torusGeometry args={[3, 0.5, 8, 16]} />
        <meshBasicMaterial color={0xffff00} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// Perl Can't locate - Camelo perdido no deserto
export function PerlCantLocateModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const camelRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;

    // Camel wanders in circles
    if (camelRef.current) {
      camelRef.current.position.x = Math.sin(phaseRef.current * 0.5) * 8;
      camelRef.current.position.z = Math.cos(phaseRef.current * 0.5) * 8;
      camelRef.current.rotation.y = phaseRef.current * 0.5 + Math.PI / 2;
    }

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (camelRef.current) {
        camelRef.current.position.y = 10;
      }
    }
    if (camelRef.current && camelRef.current.position.y > 0) {
      camelRef.current.position.y *= 0.95;
    }
  });

  const perlBlue = 0x39457e;
  const sandColor = 0xdeb887;

  return (
    <group ref={groupRef}>
      {/* Desert dunes */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[25, 16]} />
        <meshBasicMaterial color={sandColor} transparent opacity={opacity} />
      </mesh>

      {/* Small dunes */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={`dune-${i}`}
          position={[(i - 1) * 15, 2, (i - 1) * 5]}
          scale={[1, 0.3, 1]}
        >
          <sphereGeometry args={[8, 8, 8]} />
          <meshBasicMaterial color={sandColor} transparent opacity={opacity} />
        </mesh>
      ))}

      {/* Lost camel */}
      <group ref={camelRef}>
        <mesh position={[0, 8, 0]}>
          <capsuleGeometry args={[4, 6, 8, 16]} />
          <meshBasicMaterial color={perlBlue} transparent opacity={opacity} />
        </mesh>
        {/* Head */}
        <mesh position={[6, 12, 0]}>
          <sphereGeometry args={[2.5, 8, 8]} />
          <meshBasicMaterial color={perlBlue} transparent opacity={opacity} />
        </mesh>
        {/* "?" above head */}
        <mesh position={[6, 18, 0]}>
          <boxGeometry args={[3, 5, 1]} />
          <meshBasicMaterial color={0xffff00} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* Footprints in circles */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={`print-${i}`}
            position={[Math.cos(angle) * 12, 0.5, Math.sin(angle) * 12]}
          >
            <boxGeometry args={[2, 0.5, 3]} />
            <meshBasicMaterial color={0x8b7355} transparent opacity={opacity * 0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

// ============================================================================
// LUA ERRORS
// ============================================================================

// Lua attempt to index nil - Lua com cratera
export function LuaIndexNilModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const craterRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;

    // Moon rotates slowly
    if (moonRef.current) {
      moonRef.current.rotation.y += delta * 0.2;
    }

    // Crater pulses
    if (craterRef.current) {
      craterRef.current.scale.setScalar(1 + Math.sin(phaseRef.current * 2) * 0.1);
    }

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (craterRef.current) {
        craterRef.current.scale.setScalar(1.5);
      }
    }
  });

  const luaBlue = 0x000080;
  const moonGray = 0xc0c0c0;

  return (
    <group ref={groupRef} position={[0, 15, 0]}>
      {/* Moon sphere */}
      <mesh ref={moonRef}>
        <sphereGeometry args={[12, 16, 16]} />
        <meshBasicMaterial color={moonGray} transparent opacity={opacity} />
      </mesh>

      {/* Dark crater (nil index) */}
      <mesh ref={craterRef} position={[6, 4, 8]}>
        <sphereGeometry args={[5, 12, 12]} />
        <meshBasicMaterial color={0x000000} transparent opacity={opacity} />
      </mesh>

      {/* Small craters */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={`crater-${i}`}
          position={[
            Math.cos(i * 2) * 10,
            Math.sin(i * 3) * 8,
            8
          ]}
        >
          <sphereGeometry args={[2, 8, 8]} />
          <meshBasicMaterial color={0x666666} transparent opacity={opacity} />
        </mesh>
      ))}

      {/* "nil" emerging from crater */}
      <mesh position={[6, 10, 12]}>
        <boxGeometry args={[6, 3, 1]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>

      {/* Lua logo crescent */}
      <mesh position={[-8, 8, 8]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[5, 1, 8, 16, Math.PI]} />
        <meshBasicMaterial color={luaBlue} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// Lua bad argument - Joia lunar mal encaixada
export function LuaBadArgumentModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const gemsRef = useRef<THREE.Mesh[]>([]);
  const socketRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Wrong gems try to fit
    gemsRef.current.forEach((gem, i) => {
      if (gem) {
        gem.position.y = 15 + Math.sin(phaseRef.current + i * 2) * 5;
        gem.rotation.z = Math.sin(phaseRef.current * 0.5 + i) * 0.3;
      }
    });

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      gemsRef.current.forEach((gem) => {
        if (gem) gem.position.y = 25;
      });
    }
  });

  const luaBlue = 0x000080;

  return (
    <group ref={groupRef}>
      {/* Socket (expects circle) */}
      <mesh ref={socketRef} position={[0, 5, 0]}>
        <cylinderGeometry args={[8, 8, 4, 16]} />
        <meshBasicMaterial color={luaBlue} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 5, 0]}>
        <torusGeometry args={[6, 1, 8, 16]} />
        <meshBasicMaterial color={0xaaddff} transparent opacity={opacity} />
      </mesh>

      {/* Wrong shaped gems */}
      <mesh
        ref={(el) => { if (el) gemsRef.current[0] = el; }}
        position={[-8, 15, 0]}
      >
        <boxGeometry args={[6, 6, 6]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
      <mesh
        ref={(el) => { if (el) gemsRef.current[1] = el; }}
        position={[0, 18, 0]}
      >
        <tetrahedronGeometry args={[5]} />
        <meshBasicMaterial color={0x00ff00} transparent opacity={opacity} />
      </mesh>
      <mesh
        ref={(el) => { if (el) gemsRef.current[2] = el; }}
        position={[8, 15, 0]}
      >
        <octahedronGeometry args={[4]} />
        <meshBasicMaterial color={0xffff00} transparent opacity={opacity} />
      </mesh>

      {/* X marks on each */}
      {[-8, 0, 8].map((x, i) => (
        <group key={`x-${i}`} position={[x, 25, 5]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[4, 1, 0.5]} />
            <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[4, 1, 0.5]} />
            <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Lua stack overflow - Pilha de luas
export function LuaStackOverflowModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const moonsRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;

    // Moons wobble
    moonsRef.current.forEach((moon, i) => {
      if (moon) {
        moon.rotation.z = Math.sin(phaseRef.current + i * 0.5) * 0.1;
        moon.position.x = Math.sin(phaseRef.current * 0.5 + i) * 2;
      }
    });

    // Attack - stack explodes up
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      moonsRef.current.forEach((moon, i) => {
        if (moon) moon.position.y += i * 2;
      });
    }
    moonsRef.current.forEach((moon, i) => {
      if (moon) {
        const targetY = i * 6;
        moon.position.y = THREE.MathUtils.lerp(moon.position.y, targetY, 0.1);
      }
    });
  });

  const luaBlue = 0x000080;
  const moonGray = 0xc0c0c0;

  return (
    <group ref={groupRef}>
      {/* Stack of moons */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={`moon-${i}`}
          ref={(el) => { if (el) moonsRef.current[i] = el; }}
          position={[0, i * 6, 0]}
        >
          <sphereGeometry args={[5 - i * 0.3, 12, 12]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? moonGray : luaBlue}
            transparent
            opacity={opacity * (1 - i * 0.08)}
          />
        </mesh>
      ))}

      {/* Overflow warning */}
      <mesh position={[0, 50, 0]}>
        <boxGeometry args={[16, 4, 1]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>

      {/* Up arrows */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={`arrow-${i}`}
          position={[(i - 1) * 8, 55, 0]}
          rotation={[0, 0, Math.PI]}
        >
          <coneGeometry args={[2, 4, 4]} />
          <meshBasicMaterial color={0xffff00} transparent opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// DART ERRORS
// ============================================================================

// Dart Null check on null - Alvo acertando o vazio
export function DartNullCheckModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const dartRef = useRef<THREE.Mesh>(null);
  const targetRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Dart flies through empty target
    if (dartRef.current) {
      dartRef.current.position.z = Math.sin(phaseRef.current) * 15;
    }

    // Target is hollow/empty
    if (targetRef.current) {
      targetRef.current.rotation.z = Math.sin(phaseRef.current * 0.5) * 0.1;
    }

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (dartRef.current) {
        dartRef.current.position.z = -20;
      }
    }
  });

  const dartBlue = 0x0175c2;

  return (
    <group ref={groupRef}>
      {/* Empty target (no center) */}
      <group ref={targetRef} position={[0, 15, 0]}>
        <mesh>
          <torusGeometry args={[12, 2, 16, 32]} />
          <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
        </mesh>
        <mesh>
          <torusGeometry args={[8, 1.5, 16, 32]} />
          <meshBasicMaterial color={0xffffff} transparent opacity={opacity} />
        </mesh>
        <mesh>
          <torusGeometry args={[4, 1, 16, 32]} />
          <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
        </mesh>
        {/* Missing center - just wireframe */}
        <mesh>
          <circleGeometry args={[3, 16]} />
          <meshBasicMaterial color={0x000000} transparent opacity={0.2} wireframe />
        </mesh>
      </group>

      {/* Flying dart */}
      <mesh ref={dartRef} position={[0, 15, -10]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[2, 12, 8]} />
        <meshBasicMaterial color={dartBlue} transparent opacity={opacity} />
      </mesh>

      {/* "null" text */}
      <mesh position={[0, 15, 15]}>
        <boxGeometry args={[8, 4, 1]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>

      {/* "!" exclamation */}
      <mesh position={[15, 20, 0]}>
        <boxGeometry args={[2, 8, 1]} />
        <meshBasicMaterial color={0xffff00} transparent opacity={opacity} />
      </mesh>
      <mesh position={[15, 13, 0]}>
        <boxGeometry args={[2, 2, 1]} />
        <meshBasicMaterial color={0xffff00} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// Dart RangeError - Dardo voando alem do limite
export function DartRangeErrorModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const dartRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Dart flies past boundary
    if (dartRef.current) {
      dartRef.current.position.x = 15 + Math.abs(Math.sin(phaseRef.current)) * 15;
    }

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (dartRef.current) {
        dartRef.current.position.x = 40;
      }
    }
  });

  const dartBlue = 0x0175c2;

  return (
    <group ref={groupRef}>
      {/* Valid range zone */}
      <mesh position={[0, 10, 0]}>
        <boxGeometry args={[30, 20, 15]} />
        <meshBasicMaterial color={0x00ff00} transparent opacity={opacity * 0.2} />
      </mesh>

      {/* Range boundary */}
      <mesh position={[16, 10, 0]}>
        <boxGeometry args={[2, 25, 20]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity * 0.5} />
      </mesh>

      {/* Index markers */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={`idx-${i}`} position={[-12 + i * 6, 0, 10]}>
          <boxGeometry args={[4, 2, 2]} />
          <meshBasicMaterial color={dartBlue} transparent opacity={opacity} />
        </mesh>
      ))}

      {/* Flying dart going out of bounds */}
      <mesh ref={dartRef} position={[20, 15, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[2, 10, 8]} />
        <meshBasicMaterial color={dartBlue} transparent opacity={opacity} />
      </mesh>

      {/* "RangeError" */}
      <mesh position={[0, 28, 0]}>
        <boxGeometry args={[18, 4, 1]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// Dart NoSuchMethodError - Alvo sem centro
export function DartNoSuchMethodModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;

    // Rings pulse outward
    ringsRef.current.forEach((ring, i) => {
      if (ring) {
        ring.scale.setScalar(1 + Math.sin(phaseRef.current + i * 0.5) * 0.1);
      }
    });

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      ringsRef.current.forEach((ring) => {
        if (ring) ring.scale.setScalar(1.3);
      });
    }
  });

  const dartBlue = 0x0175c2;

  return (
    <group ref={groupRef} position={[0, 15, 0]}>
      {/* Concentric rings - no center */}
      {[12, 9, 6].map((radius, i) => (
        <mesh
          key={`ring-${i}`}
          ref={(el) => { if (el) ringsRef.current[i] = el; }}
        >
          <torusGeometry args={[radius, 1.5, 16, 32]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? dartBlue : 0xffffff}
            transparent
            opacity={opacity}
          />
        </mesh>
      ))}

      {/* Missing center - black hole */}
      <mesh>
        <circleGeometry args={[4, 16]} />
        <meshBasicMaterial color={0x000000} transparent opacity={opacity} />
      </mesh>

      {/* Question mark in center */}
      <mesh position={[0, 0, 2]}>
        <boxGeometry args={[2, 4, 0.5]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, -3, 2]}>
        <boxGeometry args={[1, 1, 0.5]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>

      {/* Confused darts around */}
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
        return (
          <mesh
            key={`dart-${i}`}
            position={[Math.cos(angle) * 18, Math.sin(angle) * 18, 0]}
            rotation={[0, 0, angle - Math.PI / 2]}
          >
            <coneGeometry args={[1.5, 6, 8]} />
            <meshBasicMaterial color={dartBlue} transparent opacity={opacity} />
          </mesh>
        );
      })}
    </group>
  );
}

// ============================================================================
// ELIXIR ERRORS
// ============================================================================

// Elixir FunctionClauseError - Pocao com receita errada
export function ElixirFunctionClauseModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const potionRef = useRef<THREE.Mesh>(null);
  const bubblesRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Potion bubbles violently
    if (potionRef.current) {
      potionRef.current.scale.y = 1 + Math.sin(phaseRef.current * 4) * 0.1;
    }

    // Error bubbles rise
    bubblesRef.current.forEach((bubble, i) => {
      if (bubble) {
        bubble.position.y = 15 + ((phaseRef.current * 3 + i * 5) % 20);
        bubble.position.x = Math.sin(phaseRef.current + i) * 3;
      }
    });

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (potionRef.current) {
        potionRef.current.scale.y = 1.5;
      }
    }
  });

  const elixirPurple = 0x4e2a8e;
  const potionGreen = 0x00ff88;

  return (
    <group ref={groupRef}>
      {/* Potion flask */}
      <mesh position={[0, 8, 0]}>
        <cylinderGeometry args={[8, 6, 12, 16]} />
        <meshBasicMaterial color={elixirPurple} transparent opacity={opacity} />
      </mesh>
      {/* Flask neck */}
      <mesh position={[0, 18, 0]}>
        <cylinderGeometry args={[3, 4, 8, 16]} />
        <meshBasicMaterial color={elixirPurple} transparent opacity={opacity} />
      </mesh>

      {/* Wrong colored potion */}
      <mesh ref={potionRef} position={[0, 6, 0]}>
        <cylinderGeometry args={[7, 5, 8, 16]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity * 0.7} />
      </mesh>

      {/* Error bubbles */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={`bubble-${i}`}
          ref={(el) => { if (el) bubblesRef.current[i] = el; }}
          position={[(i - 1.5) * 2, 15, 4]}
        >
          <sphereGeometry args={[1.5, 8, 8]} />
          <meshBasicMaterial color={0xff0000} transparent opacity={opacity * 0.6} />
        </mesh>
      ))}

      {/* Wrong recipe scroll */}
      <mesh position={[15, 12, 0]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[8, 12, 1]} />
        <meshBasicMaterial color={0xf5deb3} transparent opacity={opacity} />
      </mesh>
      {/* X on recipe */}
      <mesh position={[15, 12, 1]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[6, 1, 0.5]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
      <mesh position={[15, 12, 1]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[6, 1, 0.5]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// Elixir ArgumentError - Frasco com ingredientes incompativeis
export function ElixirArgumentErrorModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ingredientsRef = useRef<THREE.Mesh[]>([]);
  const explosionRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 3;

    // Ingredients clash
    ingredientsRef.current.forEach((ing, i) => {
      if (ing) {
        const dir = i === 0 ? 1 : -1;
        ing.position.x = dir * (5 + Math.sin(phaseRef.current * 2) * 3);
      }
    });

    // Explosion pulses
    if (explosionRef.current) {
      explosionRef.current.scale.setScalar(1 + Math.abs(Math.sin(phaseRef.current * 2)) * 0.3);
    }

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (explosionRef.current) {
        explosionRef.current.scale.setScalar(2);
      }
    }
  });

  const elixirPurple = 0x4e2a8e;

  return (
    <group ref={groupRef}>
      {/* Flask */}
      <mesh position={[0, 10, 0]}>
        <sphereGeometry args={[10, 12, 12]} />
        <meshBasicMaterial color={elixirPurple} transparent opacity={opacity * 0.5} />
      </mesh>

      {/* Incompatible ingredients */}
      <mesh
        ref={(el) => { if (el) ingredientsRef.current[0] = el; }}
        position={[-5, 10, 0]}
      >
        <icosahedronGeometry args={[4, 0]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
      <mesh
        ref={(el) => { if (el) ingredientsRef.current[1] = el; }}
        position={[5, 10, 0]}
      >
        <icosahedronGeometry args={[4, 0]} />
        <meshBasicMaterial color={0x0000ff} transparent opacity={opacity} />
      </mesh>

      {/* Explosion/reaction */}
      <mesh ref={explosionRef} position={[0, 10, 0]}>
        <dodecahedronGeometry args={[6, 0]} />
        <meshBasicMaterial color={0xffff00} transparent opacity={opacity * 0.5} />
      </mesh>

      {/* Sparks */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={`spark-${i}`}
            position={[
              Math.cos(angle) * 12,
              10 + Math.sin(angle) * 8,
              Math.sin(angle) * 5
            ]}
          >
            <sphereGeometry args={[1, 4, 4]} />
            <meshBasicMaterial color={0xffaa00} transparent opacity={opacity} />
          </mesh>
        );
      })}

      {/* "!=" symbol */}
      <mesh position={[0, 25, 0]}>
        <boxGeometry args={[3, 8, 1]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 25, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[1, 12, 1]} />
        <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// Elixir KeyError - Mapa de alquimia sem chave
export function ElixirKeyErrorModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const keyRef = useRef<THREE.Mesh>(null);
  const lockRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Key floats around but can't find lock
    if (keyRef.current) {
      keyRef.current.position.x = Math.sin(phaseRef.current) * 15;
      keyRef.current.position.y = 25 + Math.sin(phaseRef.current * 1.5) * 5;
      keyRef.current.rotation.z = Math.sin(phaseRef.current * 0.5) * 0.3;
    }

    // Lock shakes
    if (lockRef.current) {
      lockRef.current.rotation.z = Math.sin(phaseRef.current * 5) * 0.05;
    }

    // Attack
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (keyRef.current) {
        keyRef.current.position.x = 0;
        keyRef.current.position.y = 15;
      }
    }
  });

  const elixirPurple = 0x4e2a8e;
  const goldColor = 0xffd700;

  return (
    <group ref={groupRef}>
      {/* Alchemy map/tome */}
      <mesh position={[0, 8, 0]}>
        <boxGeometry args={[25, 2, 20]} />
        <meshBasicMaterial color={0x8b4513} transparent opacity={opacity} />
      </mesh>
      {/* Map surface */}
      <mesh position={[0, 9.5, 0]}>
        <boxGeometry args={[23, 0.5, 18]} />
        <meshBasicMaterial color={0xf5deb3} transparent opacity={opacity} />
      </mesh>

      {/* Locked chest on map */}
      <mesh ref={lockRef} position={[0, 14, 0]}>
        <boxGeometry args={[12, 8, 10]} />
        <meshBasicMaterial color={elixirPurple} transparent opacity={opacity} />
      </mesh>
      {/* Lock on chest */}
      <mesh position={[0, 12, 6]}>
        <boxGeometry args={[4, 4, 2]} />
        <meshBasicMaterial color={goldColor} transparent opacity={opacity} />
      </mesh>

      {/* Floating wrong key */}
      <group ref={keyRef} position={[10, 25, 0]}>
        {/* Key head */}
        <mesh>
          <torusGeometry args={[3, 1, 8, 16]} />
          <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
        </mesh>
        {/* Key shaft */}
        <mesh position={[0, -5, 0]}>
          <boxGeometry args={[1.5, 8, 1]} />
          <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
        </mesh>
        {/* Key teeth (wrong) */}
        <mesh position={[2, -7, 0]}>
          <boxGeometry args={[3, 1, 1]} />
          <meshBasicMaterial color={0xff0000} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* "?" symbols */}
      {[-1, 1].map((side) => (
        <mesh key={`q-${side}`} position={[side * 12, 20, 5]}>
          <boxGeometry args={[3, 5, 1]} />
          <meshBasicMaterial color={0xffff00} transparent opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
}

// Export all models from this file
export const LanguageErrorModels3 = {
  // Kotlin
  kotlinnullpointer: KotlinNullPointerModel,
  kotlinclasscast: KotlinClassCastModel,
  kotlinuninitialized: KotlinUninitializedModel,
  // Scala
  scalamatcherror: ScalaMatchErrorModel,
  scalaabstractmethod: ScalaAbstractMethodModel,
  scalastackoverflow: ScalaStackOverflowModel,
  // R
  revalerror: REvalErrorModel,
  robjectnotfound: RObjectNotFoundModel,
  rsubscriptoutofbounds: RSubscriptOutOfBoundsModel,
  // SQL
  sqldeadlock: SqlDeadlockModel,
  sqlsyntaxerror: SqlSyntaxErrorModel,
  sqltimeout: SqlTimeoutModel,
  // Bash
  bashcommandnotfound: BashCommandNotFoundModel,
  bashpermissiondenied: BashPermissionDeniedModel,
  bashcoredumped: BashCoreDumpedModel,
  // Perl
  perluninitialized: PerlUninitializedModel,
  perlsyntaxerror: PerlSyntaxErrorModel,
  perlcantlocate: PerlCantLocateModel,
  // Lua
  luaindexnil: LuaIndexNilModel,
  luabadargument: LuaBadArgumentModel,
  luastackoverflow: LuaStackOverflowModel,
  // Dart
  dartnullcheck: DartNullCheckModel,
  dartrangeerror: DartRangeErrorModel,
  dartnosuchmethod: DartNoSuchMethodModel,
  // Elixir
  elixirfunctionclause: ElixirFunctionClauseModel,
  elixirargumenterror: ElixirArgumentErrorModel,
  elixirkeyerror: ElixirKeyErrorModel,
};
