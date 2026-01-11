// @ts-nocheck
// Models may not use all props - each has its own internal color scheme
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNIT_VECTOR3 } from './optimizations';
import { getSharedMaterial, SHARED_MATERIALS } from './AnimationManager';

// Pre-create shared geometries for language error models
const SHARED_GEOMETRIES = {
  capsule: new THREE.CapsuleGeometry(8, 12, 8, 16),
  smallSphere: new THREE.SphereGeometry(2, 8, 8),
  mediumSphere: new THREE.SphereGeometry(5, 12, 8),
  largeSphere: new THREE.SphereGeometry(8, 16, 16),
  smallBox: new THREE.BoxGeometry(2, 2, 1),
  mediumBox: new THREE.BoxGeometry(6, 4, 1),
  largeBox: new THREE.BoxGeometry(12, 8, 3),
  torus: new THREE.TorusGeometry(8, 0.3, 8, 16),
  ring: new THREE.RingGeometry(1.5, 2.5, 16),
  circle: new THREE.CircleGeometry(4, 16),
  cylinder: new THREE.CylinderGeometry(2, 2, 25, 8),
  cone: new THREE.ConeGeometry(5, 12, 8),
  icosahedron: new THREE.IcosahedronGeometry(6, 0),
  dodecahedron: new THREE.DodecahedronGeometry(4),
};

interface ErrorModelProps {
  color: number;
  opacity: number;
  isWalking: boolean;
  lastAttackTime: number | null;
}
// Note: Not all models use all props - models have their own internal colors/behaviors

// ============================================================================
// JAVASCRIPT ERRORS
// ============================================================================

// JS undefined - Fantasma translúcido, contorno pontilhado, "?" flutuantes
export function JsUndefinedModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const questionMarksRef = useRef<THREE.Group[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Floating ghost effect
    groupRef.current.position.y = Math.sin(phaseRef.current) * 3 + 15;

    // Flickering opacity (ghost-like)
    if (bodyRef.current) {
      const mat = bodyRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = opacity * (0.3 + Math.sin(phaseRef.current * 3) * 0.2);
    }

    // Rotating question marks
    questionMarksRef.current.forEach((qm, i) => {
      if (qm) {
        const angle = phaseRef.current + (i * Math.PI * 2 / 4);
        qm.position.x = Math.cos(angle) * 15;
        qm.position.z = Math.sin(angle) * 15;
        qm.position.y = Math.sin(phaseRef.current * 2 + i) * 5;
        qm.rotation.y += delta * 2;
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
      {/* Ghost body - translucent with dotted outline effect */}
      <mesh ref={bodyRef}>
        <capsuleGeometry args={[8, 12, 8, 16]} />
        <meshBasicMaterial color={0xaaaaaa} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Dotted outline rings */}
      {[0, 5, 10, 15].map((y, i) => (
        <mesh key={`ring-${i}`} position={[0, y - 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[8 - i * 0.5, 0.3, 8, 16]} />
          <meshBasicMaterial color={0xcccccc}  />
        </mesh>
      ))}

      {/* Empty eyes */}
      <mesh position={[-3, 5, 7]}>
        <ringGeometry args={[1.5, 2.5, 16]} />
        <meshBasicMaterial color={0x333333} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[3, 5, 7]}>
        <ringGeometry args={[1.5, 2.5, 16]} />
        <meshBasicMaterial color={0x333333} side={THREE.DoubleSide} />
      </mesh>

      {/* Floating question marks */}
      {[0, 1, 2, 3].map((i) => (
        <group key={`qm-${i}`} ref={(el) => { if (el) questionMarksRef.current[i] = el; }}>
          <mesh>
            <boxGeometry args={[2, 6, 1]} />
            <meshBasicMaterial color={0xf7df1e}  />
          </mesh>
          <mesh position={[0, -5, 0]}>
            <boxGeometry args={[2, 2, 1]} />
            <meshBasicMaterial color={0xf7df1e}  />
          </mesh>
        </group>
      ))}

      {/* "undefined" text representation - wavy bottom */}
      <mesh position={[0, -10, 0]}>
        <planeGeometry args={[20, 8]} />
        <meshBasicMaterial color={0x666666}  side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// JS NaN - Dígitos quebrados orbitando, glitch constante, cores impossíveis
export function JsNaNModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const digitsRef = useRef<THREE.Mesh[]>([]);
  const coreRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const glitchRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 3;
    glitchRef.current += delta;

    // Glitch effect - random position jumps
    const glitchIntensity = Math.sin(glitchRef.current * 20) > 0.9 ? 1 : 0;
    if (glitchIntensity > 0) {
      groupRef.current.position.x = (Math.random() - 0.5) * 5;
      groupRef.current.position.z = (Math.random() - 0.5) * 5;
    } else {
      groupRef.current.position.x *= 0.9;
      groupRef.current.position.z *= 0.9;
    }

    // Core pulsing with impossible colors
    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshBasicMaterial;
      const hue = (phaseRef.current * 0.5) % 1;
      mat.color.setHSL(hue, 1, 0.5);
      coreRef.current.rotation.x += delta * 2;
      coreRef.current.rotation.y += delta * 3;
    }

    // Orbiting broken digits
    digitsRef.current.forEach((digit, i) => {
      if (digit) {
        const angle = phaseRef.current + (i * Math.PI * 2 / 8);
        const radius = 12 + Math.sin(phaseRef.current * 2 + i) * 3;
        digit.position.x = Math.cos(angle) * radius;
        digit.position.z = Math.sin(angle) * radius;
        digit.position.y = Math.sin(angle * 2) * 8;
        digit.rotation.x += delta * (i + 1);
        digit.rotation.z += delta * (i + 0.5);

        // Random scale glitch
        if (Math.random() > 0.95) {
          digit.scale.setScalar(Math.random() * 2);
        } else {
          digit.scale.lerp(UNIT_VECTOR3, 0.1);
        }
      }
    });

    // Attack - explode outward
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      digitsRef.current.forEach((digit) => {
        if (digit) {
          digit.position.multiplyScalar(2);
        }
      });
    }
  });

  const digitGeometries = [
    new THREE.BoxGeometry(3, 5, 1),     // 0
    new THREE.BoxGeometry(1, 5, 1),     // 1
    new THREE.BoxGeometry(3, 3, 1),     // broken
    new THREE.CylinderGeometry(1.5, 1.5, 5, 6), // 8-ish
    new THREE.TetrahedronGeometry(2),   // glitch
    new THREE.OctahedronGeometry(2),    // glitch
    new THREE.BoxGeometry(2, 4, 1),     // 7-ish
    new THREE.SphereGeometry(2, 4, 4),  // corrupted
  ];

  return (
    <group ref={groupRef} position={[0, 15, 0]}>
      {/* Core - chaotic shape with impossible colors */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[6, 0]} />
        <meshBasicMaterial color={0xff00ff}  wireframe />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[5, 0]} />
        <meshBasicMaterial color={0x00ffff}  />
      </mesh>

      {/* NaN text in center */}
      <mesh position={[0, 0, 6]}>
        <boxGeometry args={[8, 4, 0.5]} />
        <meshBasicMaterial color={0xff0000}  />
      </mesh>

      {/* Orbiting broken digits */}
      {digitGeometries.map((geo, i) => (
        <mesh
          key={`digit-${i}`}
          ref={(el) => { if (el) digitsRef.current[i] = el; }}
          geometry={geo}
        >
          <meshBasicMaterial
            color={[0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffffff, 0x888888][i]}
            transparent
            opacity={opacity * 0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

// JS Callback Hell - Espiral de parênteses e chaves, pirâmide invertida
export function JsCallbackHellModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const layersRef = useRef<THREE.Group[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;

    // Each layer rotates at different speed - creates spiral effect
    layersRef.current.forEach((layer, i) => {
      if (layer) {
        layer.rotation.y += delta * (0.5 + i * 0.1);
        // Slight bob
        layer.position.y = (i * 5) + Math.sin(phaseRef.current + i * 0.5) * 1;
      }
    });

    // Walking sway
    if (isWalking) {
      groupRef.current.rotation.z = Math.sin(phaseRef.current * 4) * 0.1;
    }

    // Attack - spiral collapses and expands
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      layersRef.current.forEach((layer, i) => {
        if (layer) {
          layer.scale.setScalar(0.5);
        }
      });
    }
    layersRef.current.forEach((layer) => {
      if (layer) {
        layer.scale.lerp(UNIT_VECTOR3, 0.05);
      }
    });
  });

  // Pyramid of doom - each layer smaller, more nested
  const layers = 8;
  const jsYellow = 0xf7df1e;
  const jsBlack = 0x323330;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {Array.from({ length: layers }).map((_, i) => {
        const size = 20 - i * 2;
        const y = i * 5;
        return (
          <group
            key={`layer-${i}`}
            ref={(el) => { if (el) layersRef.current[i] = el; }}
            position={[0, y, 0]}
          >
            {/* Opening bracket/brace */}
            <mesh position={[-size / 2, 0, 0]}>
              <boxGeometry args={[1, 4, 1]} />
              <meshBasicMaterial color={jsYellow}  />
            </mesh>
            <mesh position={[-size / 2 + 1, 2, 0]}>
              <boxGeometry args={[2, 1, 1]} />
              <meshBasicMaterial color={jsYellow}  />
            </mesh>
            <mesh position={[-size / 2 + 1, -2, 0]}>
              <boxGeometry args={[2, 1, 1]} />
              <meshBasicMaterial color={jsYellow}  />
            </mesh>

            {/* Closing bracket/brace */}
            <mesh position={[size / 2, 0, 0]}>
              <boxGeometry args={[1, 4, 1]} />
              <meshBasicMaterial color={jsYellow}  />
            </mesh>
            <mesh position={[size / 2 - 1, 2, 0]}>
              <boxGeometry args={[2, 1, 1]} />
              <meshBasicMaterial color={jsYellow}  />
            </mesh>
            <mesh position={[size / 2 - 1, -2, 0]}>
              <boxGeometry args={[2, 1, 1]} />
              <meshBasicMaterial color={jsYellow}  />
            </mesh>

            {/* Callback arrow => */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[size - 4, 0.5, 0.5]} />
              <meshBasicMaterial color={jsBlack}  />
            </mesh>
            <mesh position={[size / 2 - 4, 1, 0]} rotation={[0, 0, 0.5]}>
              <boxGeometry args={[2, 0.5, 0.5]} />
              <meshBasicMaterial color={jsBlack}  />
            </mesh>
            <mesh position={[size / 2 - 4, -1, 0]} rotation={[0, 0, -0.5]}>
              <boxGeometry args={[2, 0.5, 0.5]} />
              <meshBasicMaterial color={jsBlack}  />
            </mesh>
          </group>
        );
      })}

      {/* Eyes peeking from the depths */}
      <mesh position={[-3, layers * 5 + 5, 5]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color={0xff0000}  />
      </mesh>
      <mesh position={[3, layers * 5 + 5, 5]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color={0xff0000}  />
      </mesh>
    </group>
  );
}

// ============================================================================
// PYTHON ERRORS
// ============================================================================

// Python IndentationError - Blocos desalinhados, tabs/espaços visíveis
export function PyIndentationErrorModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const blocksRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Blocks jitter - trying to align but failing
    blocksRef.current.forEach((block, i) => {
      if (block) {
        // Offset pattern - wrong indentation
        const wrongOffset = Math.sin(phaseRef.current + i * 0.7) * 3;
        block.position.x = (i % 2 === 0 ? -5 : 5) + wrongOffset;

        // Shaking - frustration
        if (isWalking) {
          block.position.x += (Math.random() - 0.5) * 0.5;
        }
      }
    });

    // Attack - blocks scatter
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      blocksRef.current.forEach((block) => {
        if (block) {
          block.position.x += (Math.random() - 0.5) * 20;
          block.position.z += (Math.random() - 0.5) * 20;
        }
      });
    }
  });

  const pythonBlue = 0x3776ab;
  const pythonYellow = 0xffd43b;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Staircase of misaligned blocks */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh
          key={`block-${i}`}
          ref={(el) => { if (el) blocksRef.current[i] = el; }}
          position={[i % 2 === 0 ? -5 : 5, i * 6, 0]}
        >
          <boxGeometry args={[12, 5, 8]} />
          <meshBasicMaterial color={i % 2 === 0 ? pythonBlue : pythonYellow}  />
        </mesh>
      ))}

      {/* Tab character visualization */}
      <mesh position={[-12, 15, 5]}>
        <boxGeometry args={[4, 8, 1]} />
        <meshBasicMaterial color={0xff0000}  />
      </mesh>

      {/* Space character dots */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`space-${i}`} position={[12 + i * 2, 15, 5]}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshBasicMaterial color={0x00ff00}  />
        </mesh>
      ))}

      {/* Angry snake head on top */}
      <group position={[0, 38, 0]}>
        <mesh>
          <sphereGeometry args={[5, 12, 8]} />
          <meshBasicMaterial color={pythonBlue}  />
        </mesh>
        {/* Eyes */}
        <mesh position={[-2, 2, 4]}>
          <sphereGeometry args={[1.5, 8, 8]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
        <mesh position={[2, 2, 4]}>
          <sphereGeometry args={[1.5, 8, 8]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
        <mesh position={[-2, 2, 5]}>
          <sphereGeometry args={[0.7, 8, 8]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
        <mesh position={[2, 2, 5]}>
          <sphereGeometry args={[0.7, 8, 8]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
        {/* Tongue */}
        <mesh position={[0, -2, 5]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.5, 4, 0.3]} />
          <meshBasicMaterial color={0xff0000} />
        </mesh>
      </group>
    </group>
  );
}

// Python NoneType - Buraco negro pequeno, vazio com contorno
export function PyNoneTypeModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const voidRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Mesh[]>([]);
  const particlesRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Void rotation
    if (voidRef.current) {
      voidRef.current.rotation.z += delta * 0.5;
    }

    // Rings pulse outward
    ringsRef.current.forEach((ring, i) => {
      if (ring) {
        const scale = 1 + Math.sin(phaseRef.current + i * 0.5) * 0.2;
        ring.scale.setScalar(scale);
        ring.rotation.z += delta * (i + 1) * 0.3;
      }
    });

    // Particles being sucked in
    particlesRef.current.forEach((particle, i) => {
      if (particle) {
        const angle = phaseRef.current * 2 + i * Math.PI / 4;
        const radius = 20 - (phaseRef.current % 20);
        particle.position.x = Math.cos(angle) * radius;
        particle.position.z = Math.sin(angle) * radius;
        particle.position.y = Math.sin(angle * 2) * 5;

        // Fade as approaching center
        const mat = particle.material as THREE.MeshBasicMaterial;
        mat.opacity = opacity * (radius / 20);
      }
    });

    // Attack - void expands
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (voidRef.current) {
        voidRef.current.scale.setScalar(2);
      }
    }
    if (voidRef.current) {
      voidRef.current.scale.lerp(UNIT_VECTOR3, 0.05);
    }
  });

  return (
    <group ref={groupRef} position={[0, 15, 0]}>
      {/* Central void - black sphere */}
      <mesh ref={voidRef}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>

      {/* "None" text outline */}
      <mesh position={[0, 0, 9]}>
        <ringGeometry args={[6, 8, 32]} />
        <meshBasicMaterial color={0x3776ab}  side={THREE.DoubleSide} />
      </mesh>

      {/* Concentric rings */}
      {[12, 16, 20].map((radius, i) => (
        <mesh
          key={`ring-${i}`}
          ref={(el) => { if (el) ringsRef.current[i] = el; }}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[radius, 0.5, 8, 32]} />
          <meshBasicMaterial color={0x3776ab} transparent opacity={opacity * (0.8 - i * 0.2)} />
        </mesh>
      ))}

      {/* Particles being consumed */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <mesh
          key={`particle-${i}`}
          ref={(el) => { if (el) particlesRef.current[i] = el; }}
        >
          <boxGeometry args={[2, 2, 2]} />
          <meshBasicMaterial color={0xffd43b}  />
        </mesh>
      ))}
    </group>
  );
}

// Python ImportError - Caixa de pacote quebrada, cobras escapando
export function PyImportErrorModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const boxRef = useRef<THREE.Group>(null);
  const snakesRef = useRef<THREE.Group[]>([]);
  const lidRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Box shaking
    if (boxRef.current && isWalking) {
      boxRef.current.rotation.z = Math.sin(phaseRef.current * 8) * 0.05;
    }

    // Lid bouncing open
    if (lidRef.current) {
      lidRef.current.rotation.x = -0.3 + Math.sin(phaseRef.current * 3) * 0.2;
    }

    // Snakes escaping - slithering motion
    snakesRef.current.forEach((snake, i) => {
      if (snake) {
        const escapeProgress = (phaseRef.current * 0.5 + i * 0.3) % 3;
        snake.position.y = 10 + escapeProgress * 10;
        snake.position.x = Math.sin(phaseRef.current * 4 + i) * (5 + escapeProgress * 3);
        snake.rotation.y = phaseRef.current * 2;
        // Slither
        snake.children.forEach((segment, j) => {
          if (segment instanceof THREE.Mesh) {
            segment.position.x = Math.sin(phaseRef.current * 6 + j * 0.5) * 2;
          }
        });
      }
    });

    // Attack - snakes lunge
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      snakesRef.current.forEach((snake) => {
        if (snake) {
          snake.position.z += 15;
        }
      });
    }
    snakesRef.current.forEach((snake) => {
      if (snake) {
        snake.position.z *= 0.95;
      }
    });
  });

  const pythonBlue = 0x3776ab;
  const pythonYellow = 0xffd43b;

  return (
    <group ref={groupRef}>
      {/* Broken package box */}
      <group ref={boxRef} position={[0, 5, 0]}>
        {/* Box body */}
        <mesh>
          <boxGeometry args={[16, 12, 12]} />
          <meshBasicMaterial color={0x8b4513}  />
        </mesh>
        {/* Broken edges */}
        <mesh position={[8, 6, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[2, 4, 12]} />
          <meshBasicMaterial color={0x654321}  />
        </mesh>
        <mesh position={[-8, 6, 0]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[2, 4, 12]} />
          <meshBasicMaterial color={0x654321}  />
        </mesh>

        {/* Lid */}
        <mesh ref={lidRef} position={[0, 6, -6]}>
          <boxGeometry args={[16, 2, 12]} />
          <meshBasicMaterial color={0x654321}  />
        </mesh>

        {/* PyPI logo on box */}
        <mesh position={[0, 0, 6.1]}>
          <circleGeometry args={[4, 16]} />
          <meshBasicMaterial color={pythonBlue}  />
        </mesh>
      </group>

      {/* Escaping snakes */}
      {[0, 1, 2].map((i) => (
        <group
          key={`snake-${i}`}
          ref={(el) => { if (el) snakesRef.current[i] = el; }}
          position={[(i - 1) * 6, 10, 0]}
        >
          {/* Snake head */}
          <mesh position={[0, 4, 0]}>
            <sphereGeometry args={[2, 8, 8]} />
            <meshBasicMaterial color={i % 2 === 0 ? pythonBlue : pythonYellow}  />
          </mesh>
          {/* Snake body segments */}
          {[0, 1, 2, 3].map((j) => (
            <mesh key={`segment-${j}`} position={[0, -j * 3, 0]}>
              <sphereGeometry args={[1.5 - j * 0.2, 8, 8]} />
              <meshBasicMaterial color={j % 2 === 0 ? pythonBlue : pythonYellow}  />
            </mesh>
          ))}
          {/* Eyes */}
          <mesh position={[-0.8, 4.5, 1.5]}>
            <sphereGeometry args={[0.4, 8, 8]} />
            <meshBasicMaterial color={0xff0000} />
          </mesh>
          <mesh position={[0.8, 4.5, 1.5]}>
            <sphereGeometry args={[0.4, 8, 8]} />
            <meshBasicMaterial color={0xff0000} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// JAVA ERRORS
// ============================================================================

// Java NullPointerException - Seta apontando pro vazio, amarelo Java rachado
export function JavaNullPointerModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const arrowRef = useRef<THREE.Group>(null);
  const cracksRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Arrow wobbles - pointing at nothing
    if (arrowRef.current) {
      arrowRef.current.rotation.z = Math.sin(phaseRef.current) * 0.2;
      arrowRef.current.rotation.y = Math.sin(phaseRef.current * 0.7) * 0.3;
    }

    // Cracks pulse/glow
    cracksRef.current.forEach((crack, i) => {
      if (crack) {
        const mat = crack.material as THREE.MeshBasicMaterial;
        mat.opacity = opacity * (0.5 + Math.sin(phaseRef.current * 3 + i) * 0.3);
      }
    });

    // Attack - arrow jabs forward
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (arrowRef.current) {
        arrowRef.current.position.z = 15;
      }
    }
    if (arrowRef.current) {
      arrowRef.current.position.z *= 0.9;
    }
  });

  const javaOrange = 0xed8b00;
  const javaRed = 0xf89820;

  return (
    <group ref={groupRef} position={[0, 15, 0]}>
      {/* Main arrow pointing at void */}
      <group ref={arrowRef}>
        {/* Arrow shaft */}
        <mesh position={[0, 0, -10]}>
          <cylinderGeometry args={[2, 2, 25, 8]} />
          <meshBasicMaterial color={javaOrange}  />
        </mesh>
        {/* Arrow head */}
        <mesh position={[0, 0, 5]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[5, 12, 8]} />
          <meshBasicMaterial color={javaRed}  />
        </mesh>

        {/* Cracks on arrow */}
        {[0, 1, 2].map((i) => (
          <mesh
            key={`crack-${i}`}
            ref={(el) => { if (el) cracksRef.current[i] = el; }}
            position={[(i - 1) * 3, 0, -5 + i * 3]}
            rotation={[0, 0, Math.PI / 4 + i * 0.3]}
          >
            <boxGeometry args={[0.5, 6, 0.5]} />
            <meshBasicMaterial color={0x000000}  />
          </mesh>
        ))}
      </group>

      {/* "null" target - empty/void */}
      <mesh position={[0, 0, 15]}>
        <ringGeometry args={[5, 8, 16]} />
        <meshBasicMaterial color={0x333333}  side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 15]}>
        <ringGeometry args={[0, 3, 16]} />
        <meshBasicMaterial color={0x000000} side={THREE.DoubleSide} />
      </mesh>

      {/* Java coffee cup base */}
      <mesh position={[0, -15, 0]}>
        <cylinderGeometry args={[6, 5, 10, 16]} />
        <meshBasicMaterial color={javaOrange}  />
      </mesh>
      {/* Cup handle */}
      <mesh position={[7, -15, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[3, 1, 8, 16, Math.PI]} />
        <meshBasicMaterial color={javaOrange}  />
      </mesh>
    </group>
  );
}

// Java ClassNotFoundException - Silhueta de classe com "?", procurando algo
export function JavaClassNotFoundModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const silhouetteRef = useRef<THREE.Mesh>(null);
  const searchLightRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Silhouette flickers
    if (silhouetteRef.current) {
      const mat = silhouetteRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = opacity * (0.3 + Math.sin(phaseRef.current * 5) * 0.2);
    }

    // Search light rotates - looking for the class
    if (searchLightRef.current) {
      searchLightRef.current.rotation.y = phaseRef.current;
    }

    // Wandering motion when walking
    if (isWalking) {
      groupRef.current.rotation.y = Math.sin(phaseRef.current * 0.5) * 0.3;
    }

    // Attack - flash bright
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (silhouetteRef.current) {
        const mat = silhouetteRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 1;
      }
    }
  });

  const javaOrange = 0xed8b00;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Class silhouette - dotted/incomplete */}
      <mesh ref={silhouetteRef} position={[0, 20, 0]}>
        <boxGeometry args={[15, 25, 3]} />
        <meshBasicMaterial color={0x444444} transparent opacity={0.3} wireframe />
      </mesh>

      {/* Class keyword bracket */}
      <mesh position={[-8, 30, 0]}>
        <boxGeometry args={[2, 8, 2]} />
        <meshBasicMaterial color={javaOrange}  />
      </mesh>
      <mesh position={[8, 30, 0]}>
        <boxGeometry args={[2, 8, 2]} />
        <meshBasicMaterial color={javaOrange}  />
      </mesh>

      {/* Question mark in center */}
      <group position={[0, 20, 2]}>
        <mesh position={[0, 5, 0]}>
          <boxGeometry args={[6, 2, 1]} />
          <meshBasicMaterial color={0xff0000}  />
        </mesh>
        <mesh position={[3, 3, 0]}>
          <boxGeometry args={[2, 4, 1]} />
          <meshBasicMaterial color={0xff0000}  />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[6, 2, 1]} />
          <meshBasicMaterial color={0xff0000}  />
        </mesh>
        <mesh position={[-3, -2, 0]}>
          <boxGeometry args={[2, 4, 1]} />
          <meshBasicMaterial color={0xff0000}  />
        </mesh>
        <mesh position={[0, -6, 0]}>
          <boxGeometry args={[2, 2, 1]} />
          <meshBasicMaterial color={0xff0000}  />
        </mesh>
      </group>

      {/* Search light cone */}
      <group ref={searchLightRef} position={[0, 35, 0]}>
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <coneGeometry args={[3, 20, 16, 1, true]} />
          <meshBasicMaterial color={0xffff00}  side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Eyes - searching */}
      <mesh position={[-4, 25, 3]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      <mesh position={[4, 25, 3]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      <mesh position={[-4, 25, 4.5]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>
      <mesh position={[4, 25, 4.5]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>
    </group>
  );
}

// Java OutOfMemoryError - Xícara de café transbordando, heap gigante
export function JavaOutOfMemoryModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const overflowRef = useRef<THREE.Mesh[]>([]);
  const heapRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;

    // Coffee overflow animation
    overflowRef.current.forEach((drop, i) => {
      if (drop) {
        const fallProgress = (phaseRef.current + i * 0.3) % 2;
        drop.position.y = 15 - fallProgress * 20;
        drop.position.x = Math.sin(fallProgress * Math.PI) * (3 + i);
        const mat = drop.material as THREE.MeshBasicMaterial;
        mat.opacity = opacity * (1 - fallProgress / 2);
      }
    });

    // Heap growing
    if (heapRef.current) {
      const heapScale = 1 + Math.sin(phaseRef.current * 0.5) * 0.1;
      heapRef.current.scale.setScalar(heapScale);
    }

    // Attack - explode coffee
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      overflowRef.current.forEach((drop) => {
        if (drop) {
          drop.position.y = 30;
        }
      });
    }
  });

  const javaOrange = 0xed8b00;
  const coffeeColor = 0x4a2c2a;

  return (
    <group ref={groupRef}>
      {/* Giant coffee cup */}
      <mesh position={[0, 10, 0]}>
        <cylinderGeometry args={[12, 10, 20, 16]} />
        <meshBasicMaterial color={javaOrange}  />
      </mesh>
      {/* Cup handle */}
      <mesh position={[14, 10, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[5, 2, 8, 16, Math.PI]} />
        <meshBasicMaterial color={javaOrange}  />
      </mesh>

      {/* Coffee inside - overflowing */}
      <mesh position={[0, 15, 0]}>
        <cylinderGeometry args={[11, 11, 12, 16]} />
        <meshBasicMaterial color={coffeeColor}  />
      </mesh>

      {/* Overflow drops */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={`drop-${i}`}
          ref={(el) => { if (el) overflowRef.current[i] = el; }}
        >
          <sphereGeometry args={[2, 8, 8]} />
          <meshBasicMaterial color={coffeeColor}  />
        </mesh>
      ))}

      {/* Heap representation - blocks stacking */}
      <group ref={heapRef} position={[0, 30, 0]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={`heap-${i}`} position={[(i - 2) * 5, i * 3, 0]}>
            <boxGeometry args={[4, 4, 4]} />
            <meshBasicMaterial color={0xff0000}  />
          </mesh>
        ))}
        {/* "HEAP" text */}
        <mesh position={[0, 18, 5]}>
          <boxGeometry args={[15, 4, 1]} />
          <meshBasicMaterial color={0xffffff}  />
        </mesh>
      </group>

      {/* Steam */}
      {[0, 1, 2].map((i) => (
        <mesh key={`steam-${i}`} position={[(i - 1) * 5, 25 + Math.sin(phaseRef.current + i) * 3, 0]}>
          <sphereGeometry args={[2, 8, 8]} />
          <meshBasicMaterial color={0xffffff}  />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// C# ERRORS
// ============================================================================

// C# NullReferenceException - Espelho quebrado refletindo nada
export function CsNullReferenceModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const shardsRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Shards float and rotate
    shardsRef.current.forEach((shard, i) => {
      if (shard) {
        shard.position.y = 15 + Math.sin(phaseRef.current + i * 0.5) * 3;
        shard.rotation.y += delta * (i + 1) * 0.3;
        shard.rotation.z = Math.sin(phaseRef.current + i) * 0.2;
      }
    });

    // Attack - shards fly outward
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      shardsRef.current.forEach((shard, i) => {
        if (shard) {
          const angle = (i / shardsRef.current.length) * Math.PI * 2;
          shard.position.x = Math.cos(angle) * 20;
          shard.position.z = Math.sin(angle) * 20;
        }
      });
    }
    shardsRef.current.forEach((shard) => {
      if (shard) {
        shard.position.x *= 0.95;
        shard.position.z *= 0.95;
      }
    });
  });

  const csharpPurple = 0x9b4f96;
  const csharpGreen = 0x68217a;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Mirror frame */}
      <mesh position={[0, 15, -2]}>
        <boxGeometry args={[25, 30, 2]} />
        <meshBasicMaterial color={csharpGreen}  />
      </mesh>

      {/* Broken mirror shards */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const x = (i % 3 - 1) * 8;
        const y = Math.floor(i / 3) * 10;
        return (
          <mesh
            key={`shard-${i}`}
            ref={(el) => { if (el) shardsRef.current[i] = el; }}
            position={[x, y + 10, 0]}
            rotation={[0, 0, (i * 0.3) - 0.5]}
          >
            <boxGeometry args={[6, 8, 0.5]} />
            <meshBasicMaterial color={0xaaddff}  />
          </mesh>
        );
      })}

      {/* "null" reflection - empty */}
      <mesh position={[0, 15, 1]}>
        <planeGeometry args={[15, 8]} />
        <meshBasicMaterial color={0x000000}  />
      </mesh>

      {/* .NET logo hint */}
      <mesh position={[0, 32, 0]}>
        <dodecahedronGeometry args={[4]} />
        <meshBasicMaterial color={csharpPurple}  />
      </mesh>
    </group>
  );
}

// C# StackOverflowException - Pilha de janelas Windows empilhadas
export function CsStackOverflowModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const windowsRef = useRef<THREE.Group[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;

    // Windows sway
    windowsRef.current.forEach((win, i) => {
      if (win) {
        win.rotation.z = Math.sin(phaseRef.current + i * 0.2) * 0.05 * (i + 1);
        win.position.x = Math.sin(phaseRef.current * 0.5 + i) * (i * 0.5);
      }
    });

    // Attack - windows cascade
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      windowsRef.current.forEach((win, i) => {
        if (win) {
          win.rotation.z = 0.3 * (i % 2 === 0 ? 1 : -1);
        }
      });
    }
  });

  const windowBlue = 0x0078d4;
  const windowGray = 0xf0f0f0;

  return (
    <group ref={groupRef}>
      {/* Stack of Windows windows */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <group
          key={`window-${i}`}
          ref={(el) => { if (el) windowsRef.current[i] = el; }}
          position={[(i % 2 - 0.5) * 3, i * 6, -i * 2]}
        >
          {/* Window frame */}
          <mesh>
            <boxGeometry args={[18, 12, 1]} />
            <meshBasicMaterial color={windowGray}  />
          </mesh>
          {/* Title bar */}
          <mesh position={[0, 5, 0.6]}>
            <boxGeometry args={[18, 2, 0.5]} />
            <meshBasicMaterial color={windowBlue}  />
          </mesh>
          {/* Close button */}
          <mesh position={[7.5, 5, 0.8]}>
            <boxGeometry args={[2, 1.5, 0.3]} />
            <meshBasicMaterial color={0xff0000}  />
          </mesh>
          {/* Error icon */}
          <mesh position={[0, 0, 0.6]}>
            <circleGeometry args={[3, 16]} />
            <meshBasicMaterial color={0xff0000}  />
          </mesh>
        </group>
      ))}

      {/* Recursive arrow */}
      <mesh position={[15, 25, 5]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[3, 8, 8]} />
        <meshBasicMaterial color={0xff0000}  />
      </mesh>
    </group>
  );
}

// C# InvalidCastException - Forma tentando encaixar em buraco errado
export function CsInvalidCastModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const shapeRef = useRef<THREE.Mesh>(null);
  const holeRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Shape trying to fit - bobbing and rotating
    if (shapeRef.current) {
      shapeRef.current.position.y = 30 + Math.sin(phaseRef.current) * 5;
      shapeRef.current.rotation.y += delta;
      shapeRef.current.rotation.z = Math.sin(phaseRef.current * 2) * 0.3;
    }

    // Attack - shape slams down
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (shapeRef.current) {
        shapeRef.current.position.y = 15;
      }
    }
  });

  const csharpPurple = 0x9b4f96;

  return (
    <group ref={groupRef}>
      {/* Square peg (trying to fit) */}
      <mesh ref={shapeRef} position={[0, 30, 0]}>
        <boxGeometry args={[10, 10, 10]} />
        <meshBasicMaterial color={csharpPurple}  />
      </mesh>

      {/* Round hole */}
      <group position={[0, 5, 0]}>
        <mesh ref={holeRef}>
          <cylinderGeometry args={[8, 8, 10, 16]} />
          <meshBasicMaterial color={0x333333}  />
        </mesh>
        {/* Hole opening */}
        <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, 6, 16]} />
          <meshBasicMaterial color={0x000000} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Error sparks */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={`spark-${i}`}
          position={[
            Math.cos(phaseRef.current * 3 + i * Math.PI / 2) * 12,
            20,
            Math.sin(phaseRef.current * 3 + i * Math.PI / 2) * 12
          ]}
        >
          <octahedronGeometry args={[2]} />
          <meshBasicMaterial color={0xffff00}  />
        </mesh>
      ))}

      {/* "InvalidCast" text bar */}
      <mesh position={[0, -5, 10]}>
        <boxGeometry args={[20, 3, 1]} />
        <meshBasicMaterial color={0xff0000}  />
      </mesh>
    </group>
  );
}

// ============================================================================
// C/C++ ERRORS
// ============================================================================

// Segmentation Fault - Blocos de RAM fragmentados, vermelho crítico
export function CSegFaultModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const blocksRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Blocks shake violently
    blocksRef.current.forEach((block, i) => {
      if (block) {
        block.position.x += (Math.random() - 0.5) * 0.5;
        block.position.y += (Math.random() - 0.5) * 0.5;
        block.rotation.x += (Math.random() - 0.5) * 0.1;
        block.rotation.z += (Math.random() - 0.5) * 0.1;
      }
    });

    // Attack - blocks explode
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      blocksRef.current.forEach((block, i) => {
        if (block) {
          block.position.x += (Math.random() - 0.5) * 30;
          block.position.y += Math.random() * 20;
          block.position.z += (Math.random() - 0.5) * 30;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* Fragmented RAM blocks */}
      {Array.from({ length: 16 }).map((_, i) => {
        const x = (i % 4 - 1.5) * 8;
        const y = Math.floor(i / 4) * 6 + 5;
        const isBroken = i === 5 || i === 9 || i === 10;
        return (
          <mesh
            key={`block-${i}`}
            ref={(el) => { if (el) blocksRef.current[i] = el; }}
            position={[x, y, 0]}
            rotation={[0, 0, isBroken ? 0.3 : 0]}
          >
            <boxGeometry args={[6, 4, 3]} />
            <meshBasicMaterial
              color={isBroken ? 0xff0000 : 0x00ff00}
              transparent
              opacity={opacity * (isBroken ? 0.8 : 0.5)}
            />
          </mesh>
        );
      })}

      {/* Skull warning */}
      <mesh position={[0, 35, 5]}>
        <sphereGeometry args={[5, 8, 8]} />
        <meshBasicMaterial color={0xff0000}  />
      </mesh>
      {/* Skull eyes */}
      <mesh position={[-2, 36, 8]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>
      <mesh position={[2, 36, 8]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>

      {/* "SIGSEGV" text */}
      <mesh position={[0, -5, 5]}>
        <boxGeometry args={[20, 4, 1]} />
        <meshBasicMaterial color={0xff0000}  />
      </mesh>
    </group>
  );
}

// C Stack Overflow - Torre de frames infinita
export function CStackOverflowModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const framesRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;

    // Frames sway like a tall tower
    framesRef.current.forEach((frame, i) => {
      if (frame) {
        frame.rotation.z = Math.sin(phaseRef.current + i * 0.1) * 0.02 * (i + 1);
        frame.position.x = Math.sin(phaseRef.current * 0.5) * (i * 0.3);
      }
    });

    // Attack - tower wobbles severely
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.rotation.z = 0.3;
    }
    groupRef.current.rotation.z *= 0.95;
  });

  return (
    <group ref={groupRef}>
      {/* Stack frames - tower going up */}
      {Array.from({ length: 15 }).map((_, i) => (
        <mesh
          key={`frame-${i}`}
          ref={(el) => { if (el) framesRef.current[i] = el; }}
          position={[0, i * 4, 0]}
        >
          <boxGeometry args={[12 - i * 0.3, 3, 8 - i * 0.2]} />
          <meshBasicMaterial
            color={i > 10 ? 0xff0000 : i > 7 ? 0xffaa00 : 0x00aa00}
            transparent
            opacity={opacity}
          />
        </mesh>
      ))}

      {/* Recursive arrow */}
      <group position={[15, 30, 0]}>
        <mesh rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[3, 10, 8]} />
          <meshBasicMaterial color={0xff0000}  />
        </mesh>
        <mesh position={[0, -15, 0]}>
          <cylinderGeometry args={[1, 1, 20, 8]} />
          <meshBasicMaterial color={0xff0000}  />
        </mesh>
      </group>

      {/* "main()" at bottom */}
      <mesh position={[0, -3, 5]}>
        <boxGeometry args={[12, 3, 1]} />
        <meshBasicMaterial color={0x555555}  />
      </mesh>
    </group>
  );
}

// C Memory Leak - Criatura derretendo, poças de memória
export function CMemoryLeakModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const dripsRef = useRef<THREE.Mesh[]>([]);
  const puddlesRef = useRef<THREE.Mesh[]>([]);
  const bodyRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;

    // Body slowly melting/deforming
    if (bodyRef.current) {
      bodyRef.current.scale.y = 1 - Math.sin(phaseRef.current * 0.5) * 0.1;
      bodyRef.current.scale.x = 1 + Math.sin(phaseRef.current * 0.5) * 0.05;
    }

    // Drips falling
    dripsRef.current.forEach((drip, i) => {
      if (drip) {
        const fallProgress = (phaseRef.current * 0.5 + i * 0.3) % 2;
        drip.position.y = 20 - fallProgress * 25;
        const mat = drip.material as THREE.MeshBasicMaterial;
        mat.opacity = opacity * (1 - fallProgress / 2);
      }
    });

    // Puddles grow
    puddlesRef.current.forEach((puddle, i) => {
      if (puddle) {
        const scale = 1 + (phaseRef.current * 0.1 + i) % 1;
        puddle.scale.setScalar(scale);
      }
    });

    // Attack - burst of leaks
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      dripsRef.current.forEach((drip) => {
        if (drip) drip.position.y = 25;
      });
    }
  });

  const leakColor = 0x00ff88;

  return (
    <group ref={groupRef}>
      {/* Melting body */}
      <mesh ref={bodyRef} position={[0, 20, 0]}>
        <sphereGeometry args={[10, 12, 12]} />
        <meshBasicMaterial color={leakColor}  />
      </mesh>

      {/* Dripping drops */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={`drip-${i}`}
          ref={(el) => { if (el) dripsRef.current[i] = el; }}
          position={[(i - 2) * 4, 15, 0]}
        >
          <sphereGeometry args={[1.5, 8, 8]} />
          <meshBasicMaterial color={leakColor}  />
        </mesh>
      ))}

      {/* Puddles on ground */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={`puddle-${i}`}
          ref={(el) => { if (el) puddlesRef.current[i] = el; }}
          position={[(i - 1) * 10, 0.5, (i - 1) * 5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[5, 16]} />
          <meshBasicMaterial color={leakColor}  />
        </mesh>
      ))}

      {/* Sad eyes */}
      <mesh position={[-4, 23, 8]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      <mesh position={[4, 23, 8]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      <mesh position={[-4, 22, 9.5]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>
      <mesh position={[4, 22, 9.5]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>

      {/* "malloc" tag */}
      <mesh position={[0, 35, 0]}>
        <boxGeometry args={[12, 3, 1]} />
        <meshBasicMaterial color={0xffaa00}  />
      </mesh>
    </group>
  );
}

// ============================================================================
// TYPESCRIPT ERRORS
// ============================================================================

// TypeScript Type Error - Cubo tentando ser esfera
export function TsTypeErrorModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cubeRef = useRef<THREE.Mesh>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);
  const morphRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Cube trying to morph into sphere (and failing)
    morphRef.current = (Math.sin(phaseRef.current) + 1) / 2;

    if (cubeRef.current) {
      cubeRef.current.scale.setScalar(1 - morphRef.current * 0.3);
      cubeRef.current.rotation.y += delta;
    }
    if (sphereRef.current) {
      const mat = sphereRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = opacity * morphRef.current * 0.5;
    }

    // Attack - violent morphing
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (cubeRef.current) {
        cubeRef.current.scale.setScalar(1.5);
      }
    }
  });

  const tsBlue = 0x3178c6;

  return (
    <group ref={groupRef} position={[0, 15, 0]}>
      {/* Cube trying to be sphere */}
      <mesh ref={cubeRef}>
        <boxGeometry args={[12, 12, 12]} />
        <meshBasicMaterial color={tsBlue}  />
      </mesh>

      {/* Ghost sphere it wants to be */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={0.3} wireframe />
      </mesh>

      {/* Type annotation */}
      <mesh position={[0, -15, 0]}>
        <boxGeometry args={[20, 4, 1]} />
        <meshBasicMaterial color={0xff0000}  />
      </mesh>

      {/* TS logo */}
      <mesh position={[0, 0, 7]}>
        <boxGeometry args={[6, 8, 0.5]} />
        <meshBasicMaterial color={0xffffff}  />
      </mesh>

      {/* Error squiggles */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={`squiggle-${i}`}
          position={[-10 + i * 5, -18, 0]}
          rotation={[0, 0, Math.sin(phaseRef.current + i) * 0.3]}
        >
          <boxGeometry args={[4, 0.5, 0.5]} />
          <meshBasicMaterial color={0xff0000}  />
        </mesh>
      ))}
    </group>
  );
}

// TypeScript any - Blob amorfo que muda de forma
export function TsAnyModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const blobRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 3;

    // Blob constantly changing shape
    if (blobRef.current) {
      const scale = new THREE.Vector3(
        1 + Math.sin(phaseRef.current) * 0.3,
        1 + Math.sin(phaseRef.current * 1.3) * 0.3,
        1 + Math.sin(phaseRef.current * 0.7) * 0.3
      );
      blobRef.current.scale.copy(scale);
      blobRef.current.rotation.x += delta;
      blobRef.current.rotation.y += delta * 0.7;

      // Color shifting
      const mat = blobRef.current.material as THREE.MeshBasicMaterial;
      const hue = (phaseRef.current * 0.2) % 1;
      mat.color.setHSL(hue, 0.5, 0.5);
    }

    // Attack - rapid shape shifting
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (blobRef.current) {
        blobRef.current.scale.setScalar(2);
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 15, 0]}>
      {/* Amorphous blob */}
      <mesh ref={blobRef}>
        <dodecahedronGeometry args={[10, 1]} />
        <meshBasicMaterial color={0x888888}  />
      </mesh>

      {/* "any" text floating */}
      <mesh position={[0, 18, 0]}>
        <boxGeometry args={[10, 4, 1]} />
        <meshBasicMaterial color={0xffaa00}  />
      </mesh>

      {/* Question marks around */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 + phaseRef.current;
        return (
          <mesh
            key={`qm-${i}`}
            position={[Math.cos(angle) * 15, 0, Math.sin(angle) * 15]}
          >
            <boxGeometry args={[2, 4, 1]} />
            <meshBasicMaterial color={0xffffff}  />
          </mesh>
        );
      })}
    </group>
  );
}

// TypeScript readonly - Estátua congelada com cadeado
export function TsReadonlyModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lockRef = useRef<THREE.Group>(null);
  const iceRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;

    // Lock swings slightly
    if (lockRef.current) {
      lockRef.current.rotation.z = Math.sin(phaseRef.current * 2) * 0.1;
    }

    // Ice crystals shimmer
    iceRef.current.forEach((ice, i) => {
      if (ice) {
        const mat = ice.material as THREE.MeshBasicMaterial;
        mat.opacity = opacity * (0.3 + Math.sin(phaseRef.current * 2 + i) * 0.2);
      }
    });

    // Attack - ice shards fly
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      iceRef.current.forEach((ice, i) => {
        if (ice) {
          ice.position.z = 10;
        }
      });
    }
    iceRef.current.forEach((ice) => {
      if (ice) {
        ice.position.z *= 0.95;
      }
    });
  });

  const tsBlue = 0x3178c6;
  const iceColor = 0xaaddff;

  return (
    <group ref={groupRef}>
      {/* Frozen statue base */}
      <mesh position={[0, 15, 0]}>
        <boxGeometry args={[12, 25, 8]} />
        <meshBasicMaterial color={tsBlue}  />
      </mesh>

      {/* Ice covering */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={`ice-${i}`}
          ref={(el) => { if (el) iceRef.current[i] = el; }}
          position={[(i - 2) * 4, 10 + i * 5, 5]}
          rotation={[0, 0, (i - 2) * 0.2]}
        >
          <octahedronGeometry args={[3]} />
          <meshBasicMaterial color={iceColor} transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Padlock */}
      <group ref={lockRef} position={[0, 30, 5]}>
        {/* Lock body */}
        <mesh>
          <boxGeometry args={[8, 6, 3]} />
          <meshBasicMaterial color={0xffd700}  />
        </mesh>
        {/* Lock shackle */}
        <mesh position={[0, 5, 0]}>
          <torusGeometry args={[3, 1, 8, 16, Math.PI]} />
          <meshBasicMaterial color={0xcccccc}  />
        </mesh>
        {/* Keyhole */}
        <mesh position={[0, -1, 1.6]}>
          <circleGeometry args={[1, 16]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
      </group>

      {/* "readonly" text */}
      <mesh position={[0, -5, 5]}>
        <boxGeometry args={[16, 3, 1]} />
        <meshBasicMaterial color={0x3178c6}  />
      </mesh>
    </group>
  );
}

// ============================================================================
// PHP ERRORS
// ============================================================================

// PHP T_PAAMAYIM_NEKUDOTAYIM - Dois pontos gigantes com olhos
export function PhpPaamayimModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const dot1Ref = useRef<THREE.Mesh>(null);
  const dot2Ref = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Dots bounce
    if (dot1Ref.current) {
      dot1Ref.current.position.y = 25 + Math.sin(phaseRef.current) * 3;
    }
    if (dot2Ref.current) {
      dot2Ref.current.position.y = 10 + Math.sin(phaseRef.current + Math.PI) * 3;
    }

    // Attack - dots slam together
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      if (dot1Ref.current) dot1Ref.current.position.y = 17;
      if (dot2Ref.current) dot2Ref.current.position.y = 17;
    }
  });

  const phpPurple = 0x777bb4;

  return (
    <group ref={groupRef}>
      {/* Giant colon :: */}
      <mesh ref={dot1Ref} position={[0, 25, 0]}>
        <sphereGeometry args={[6, 16, 16]} />
        <meshBasicMaterial color={phpPurple}  />
      </mesh>
      <mesh ref={dot2Ref} position={[0, 10, 0]}>
        <sphereGeometry args={[6, 16, 16]} />
        <meshBasicMaterial color={phpPurple}  />
      </mesh>

      {/* Eyes on top dot */}
      <mesh position={[-2, 27, 5]}>
        <sphereGeometry args={[1.5, 8, 8]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      <mesh position={[2, 27, 5]}>
        <sphereGeometry args={[1.5, 8, 8]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      <mesh position={[-2, 27, 6]}>
        <sphereGeometry args={[0.7, 8, 8]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>
      <mesh position={[2, 27, 6]}>
        <sphereGeometry args={[0.7, 8, 8]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>

      {/* Eyes on bottom dot */}
      <mesh position={[-2, 12, 5]}>
        <sphereGeometry args={[1.5, 8, 8]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      <mesh position={[2, 12, 5]}>
        <sphereGeometry args={[1.5, 8, 8]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      <mesh position={[-2, 12, 6]}>
        <sphereGeometry args={[0.7, 8, 8]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>
      <mesh position={[2, 12, 6]}>
        <sphereGeometry args={[0.7, 8, 8]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>

      {/* Confused expression lines */}
      <mesh position={[0, 17, 5]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[8, 1, 1]} />
        <meshBasicMaterial color={0xffffff}  />
      </mesh>

      {/* PHP elephant hint */}
      <mesh position={[12, 20, 0]}>
        <sphereGeometry args={[4, 8, 8]} />
        <meshBasicMaterial color={phpPurple}  />
      </mesh>
    </group>
  );
}

// PHP Fatal Error - Elefante zumbi
export function PhpFatalErrorModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const trunkRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta;

    // Zombie shamble
    if (isWalking) {
      groupRef.current.rotation.z = Math.sin(phaseRef.current * 3) * 0.1;
    }

    // Trunk swings
    if (trunkRef.current) {
      trunkRef.current.rotation.x = Math.sin(phaseRef.current * 2) * 0.3;
    }

    // Attack - lunge forward
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.position.z = 10;
    }
    groupRef.current.position.z *= 0.9;
  });

  const zombieGray = 0x556b2f;
  const deadEye = 0xff0000;

  return (
    <group ref={groupRef}>
      {/* Elephant body - zombified */}
      <mesh ref={bodyRef} position={[0, 15, 0]}>
        <sphereGeometry args={[12, 12, 12]} />
        <meshBasicMaterial color={zombieGray}  />
      </mesh>

      {/* Head */}
      <mesh position={[0, 25, 8]}>
        <sphereGeometry args={[8, 12, 12]} />
        <meshBasicMaterial color={zombieGray}  />
      </mesh>

      {/* Trunk */}
      <group ref={trunkRef} position={[0, 22, 14]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={`trunk-${i}`} position={[0, -i * 3, i * 2]}>
            <sphereGeometry args={[2.5 - i * 0.3, 8, 8]} />
            <meshBasicMaterial color={zombieGray}  />
          </mesh>
        ))}
      </group>

      {/* Zombie eyes - X marks */}
      <mesh position={[-4, 27, 12]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[4, 1, 1]} />
        <meshBasicMaterial color={deadEye} />
      </mesh>
      <mesh position={[-4, 27, 12]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[4, 1, 1]} />
        <meshBasicMaterial color={deadEye} />
      </mesh>
      <mesh position={[4, 27, 12]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[4, 1, 1]} />
        <meshBasicMaterial color={deadEye} />
      </mesh>
      <mesh position={[4, 27, 12]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[4, 1, 1]} />
        <meshBasicMaterial color={deadEye} />
      </mesh>

      {/* Ears */}
      <mesh position={[-10, 25, 5]}>
        <circleGeometry args={[5, 16]} />
        <meshBasicMaterial color={zombieGray}  side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[10, 25, 5]}>
        <circleGeometry args={[5, 16]} />
        <meshBasicMaterial color={zombieGray}  side={THREE.DoubleSide} />
      </mesh>

      {/* "FATAL" text */}
      <mesh position={[0, 40, 0]}>
        <boxGeometry args={[15, 4, 1]} />
        <meshBasicMaterial color={0xff0000}  />
      </mesh>
    </group>
  );
}

// PHP Undefined Index - Array com buracos
export function PhpUndefinedIndexModel({ color, opacity, isWalking, lastAttackTime }: ErrorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const slotsRef = useRef<THREE.Mesh[]>([]);
  const phaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phaseRef.current += delta * 2;

    // Slots flicker
    slotsRef.current.forEach((slot, i) => {
      if (slot) {
        const mat = slot.material as THREE.MeshBasicMaterial;
        if (i === 2 || i === 5) {
          // Missing indices flicker
          mat.opacity = opacity * (0.2 + Math.sin(phaseRef.current * 5 + i) * 0.2);
        }
      }
    });

    // Attack - array shakes
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      groupRef.current.rotation.z = 0.3;
    }
    groupRef.current.rotation.z *= 0.9;
  });

  const phpPurple = 0x777bb4;

  return (
    <group ref={groupRef}>
      {/* Array container */}
      <mesh position={[0, 15, -2]}>
        <boxGeometry args={[45, 12, 2]} />
        <meshBasicMaterial color={phpPurple}  />
      </mesh>

      {/* Array slots */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const isMissing = i === 2 || i === 5;
        return (
          <mesh
            key={`slot-${i}`}
            ref={(el) => { if (el) slotsRef.current[i] = el; }}
            position={[(i - 3) * 6, 15, 0]}
          >
            <boxGeometry args={[5, 8, 3]} />
            <meshBasicMaterial
              color={isMissing ? 0x000000 : 0xffffff}
              transparent
              opacity={isMissing ? 0.3 : opacity}
            />
          </mesh>
        );
      })}

      {/* Index numbers */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <mesh key={`idx-${i}`} position={[(i - 3) * 6, 25, 0]}>
          <boxGeometry args={[3, 3, 1]} />
          <meshBasicMaterial color={0xffffff}  />
        </mesh>
      ))}

      {/* "?" marks on missing indices */}
      <mesh position={[-6, 15, 3]}>
        <boxGeometry args={[2, 4, 1]} />
        <meshBasicMaterial color={0xff0000}  />
      </mesh>
      <mesh position={[12, 15, 3]}>
        <boxGeometry args={[2, 4, 1]} />
        <meshBasicMaterial color={0xff0000}  />
      </mesh>

      {/* Brackets */}
      <mesh position={[-25, 15, 0]}>
        <boxGeometry args={[2, 14, 3]} />
        <meshBasicMaterial color={phpPurple}  />
      </mesh>
      <mesh position={[25, 15, 0]}>
        <boxGeometry args={[2, 14, 3]} />
        <meshBasicMaterial color={phpPurple}  />
      </mesh>
    </group>
  );
}

// Export all models
export const LanguageErrorModels = {
  // JavaScript
  jsundefined: JsUndefinedModel,
  jsnan: JsNaNModel,
  jscallbackhell: JsCallbackHellModel,
  // Python
  pyindentationerror: PyIndentationErrorModel,
  pynonetype: PyNoneTypeModel,
  pyimporterror: PyImportErrorModel,
  // Java
  javanullpointer: JavaNullPointerModel,
  javaclassnotfound: JavaClassNotFoundModel,
  javaoutofmemory: JavaOutOfMemoryModel,
  // C#
  csnullreference: CsNullReferenceModel,
  csstackoverflow: CsStackOverflowModel,
  csinvalidcast: CsInvalidCastModel,
  // C/C++
  csegfault: CSegFaultModel,
  cstackoverflow: CStackOverflowModel,
  cmemoryleak: CMemoryLeakModel,
  // TypeScript
  tstypeerror: TsTypeErrorModel,
  tsany: TsAnyModel,
  tsreadonly: TsReadonlyModel,
  // PHP
  phppaamayim: PhpPaamayimModel,
  phpfatalerror: PhpFatalErrorModel,
  phpundefinedindex: PhpUndefinedIndexModel,
};

export type LanguageErrorType = keyof typeof LanguageErrorModels;
