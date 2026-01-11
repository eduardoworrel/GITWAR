import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LanguageErrorModels } from './LanguageErrorModels';
import { LanguageErrorModels2 } from './LanguageErrorModels2';
import { LanguageErrorModels3 } from './LanguageErrorModels3';
import { UNIT_VECTOR3 } from './optimizations';
import { getSharedMaterial, SHARED_MATERIALS } from './AnimationManager';

// Shared monster geometries - created once, reused
const BUG_GEOMETRIES = {
  body: new THREE.SphereGeometry(8, 12, 8),
  head: new THREE.SphereGeometry(5, 12, 8),
  leg: new THREE.CylinderGeometry(0.8, 0.5, 12, 6),
  antenna: new THREE.CylinderGeometry(0.3, 0.3, 8, 6),
  antennaTip: new THREE.SphereGeometry(1, 8, 6),
  eye: new THREE.SphereGeometry(2, 8, 6),
};

const AI_GEOMETRIES = {
  core: new THREE.IcosahedronGeometry(8, 0),
  fragment: new THREE.TetrahedronGeometry(4, 0),
  ring: new THREE.TorusGeometry(12, 1, 8, 16),
  eye: new THREE.SphereGeometry(2.5, 8, 6),
};

const MANAGER_GEOMETRIES = {
  head: new THREE.BoxGeometry(10, 10, 10),
  body: new THREE.BoxGeometry(14, 16, 8),
  arm: new THREE.BoxGeometry(4, 14, 4),
  leg: new THREE.BoxGeometry(5, 14, 5),
  tie: new THREE.BoxGeometry(3, 12, 1),
  tieKnot: new THREE.BoxGeometry(4, 3, 2),
  briefcase: new THREE.BoxGeometry(10, 8, 3),
  glasses: new THREE.BoxGeometry(12, 3, 1),
};

const BOSS_GEOMETRIES = {
  body: new THREE.DodecahedronGeometry(12, 0),
  head: new THREE.BoxGeometry(14, 14, 14),
  horn: new THREE.ConeGeometry(3, 12, 8),
  arm: new THREE.BoxGeometry(6, 18, 6),
  claw: new THREE.ConeGeometry(2, 6, 6),
  shoulder: new THREE.SphereGeometry(5, 8, 6),
  eye: new THREE.SphereGeometry(3, 8, 6),
  chest: new THREE.BoxGeometry(18, 20, 10),
};

const UNEXPLAINED_GEOMETRIES = {
  cube: new THREE.BoxGeometry(6, 6, 6),
  sphere: new THREE.SphereGeometry(4, 8, 6),
  tetra: new THREE.TetrahedronGeometry(5, 0),
  octa: new THREE.OctahedronGeometry(5, 0),
};

interface MonsterProps {
  color: number;
  opacity: number;
  isWalking: boolean;
  lastAttackTime: number | null;
}

// Bug Monster - Insect-like creature with 6 legs and antennae
export function BugModel({ color, isWalking, lastAttackTime }: MonsterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const legsRef = useRef<THREE.Group[]>([]);
  const antennaeRef = useRef<THREE.Group[]>([]);
  const walkPhaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);
  const attackPhaseRef = useRef(0);

  // Memoized materials - solid for WebGPU compatibility
  const materials = useMemo(() => {
    const darkColor = new THREE.Color(color).multiplyScalar(0.6).getHex();
    return {
      body: getSharedMaterial(color),
      dark: getSharedMaterial(darkColor),
      eye: getSharedMaterial(0xff0000),
      antennaTip: getSharedMaterial(0xffff00),
    };
  }, [color]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Walking animation - legs move
    if (isWalking) {
      walkPhaseRef.current += delta * 12;
      legsRef.current.forEach((leg, i) => {
        if (leg) {
          const offset = (i % 2 === 0 ? 0 : Math.PI);
          leg.rotation.x = Math.sin(walkPhaseRef.current + offset + (i * Math.PI / 3)) * 0.5;
        }
      });
    } else {
      legsRef.current.forEach((leg) => {
        if (leg) leg.rotation.x *= 0.9;
      });
    }

    // Antennae wiggle
    antennaeRef.current.forEach((antenna, i) => {
      if (antenna) {
        antenna.rotation.z = Math.sin(Date.now() * 0.005 + i * Math.PI) * 0.2;
      }
    });

    // Attack animation - bug lunges forward
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      attackPhaseRef.current = 0;
    }
    if (attackPhaseRef.current < 1 && lastAttackRef.current !== null) {
      attackPhaseRef.current += delta * 4;
      groupRef.current.position.z = Math.sin(attackPhaseRef.current * Math.PI) * 5;
    } else {
      groupRef.current.position.z *= 0.9;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body - oval shape */}
      <mesh position={[0, 10, 0]} geometry={BUG_GEOMETRIES.body} material={materials.body} />

      {/* Head */}
      <mesh position={[0, 10, 10]} geometry={BUG_GEOMETRIES.head} material={materials.dark} />

      {/* Compound eyes */}
      <mesh position={[-3, 12, 13]} geometry={BUG_GEOMETRIES.eye} material={materials.eye} />
      <mesh position={[3, 12, 13]} geometry={BUG_GEOMETRIES.eye} material={materials.eye} />

      {/* Antennae */}
      {[0, 1].map((i) => (
        <group
          key={`antenna-${i}`}
          ref={(el) => { if (el) antennaeRef.current[i] = el; }}
          position={[i === 0 ? -2 : 2, 14, 12]}
        >
          <mesh rotation={[0.3, 0, i === 0 ? -0.3 : 0.3]} geometry={BUG_GEOMETRIES.antenna} material={materials.dark} />
          <mesh position={[i === 0 ? -2 : 2, 6, 2]} geometry={BUG_GEOMETRIES.antennaTip} material={materials.antennaTip} />
        </group>
      ))}

      {/* 6 Legs - 3 on each side */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const side = i < 3 ? -1 : 1;
        const zOffset = (i % 3 - 1) * 6;
        return (
          <group
            key={`leg-${i}`}
            ref={(el) => { if (el) legsRef.current[i] = el; }}
            position={[side * 8, 6, zOffset]}
            rotation={[0, 0, side * 0.5]}
          >
            <mesh position={[side * 4, -4, 0]} rotation={[0, 0, side * 0.8]} geometry={BUG_GEOMETRIES.leg} material={materials.dark} />
          </group>
        );
      })}
    </group>
  );
}

// AI Hallucination - Ethereal floating entity with fragments
export function AIHallucinationModel({ color, isWalking: _isWalking, lastAttackTime }: MonsterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const fragmentsRef = useRef<THREE.Mesh[]>([]);
  const ringRef = useRef<THREE.Mesh>(null);
  const floatPhaseRef = useRef(Math.random() * Math.PI * 2);
  const lastAttackRef = useRef<number | null>(null);

  // Memoized materials - solid for WebGPU compatibility
  const materials = useMemo(() => ({
    coreWireframe: getSharedMaterial(color, { wireframe: true }),
    coreSolid: getSharedMaterial(new THREE.Color(color).multiplyScalar(0.7).getHex()),
    ring: getSharedMaterial(new THREE.Color(color).multiplyScalar(0.8).getHex()),
    fragment: getSharedMaterial(color),
    eye: SHARED_MATERIALS.magenta,
  }), [color]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    floatPhaseRef.current += delta * 2;

    // Floating bob animation
    groupRef.current.position.y = Math.sin(floatPhaseRef.current) * 3;

    // Rotate ring
    if (ringRef.current) {
      ringRef.current.rotation.x += delta * 0.5;
      ringRef.current.rotation.y += delta * 0.3;
    }

    // Orbiting fragments
    fragmentsRef.current.forEach((frag, i) => {
      if (frag) {
        const angle = floatPhaseRef.current + (i * Math.PI * 2 / 6);
        const radius = 15 + Math.sin(floatPhaseRef.current * 2 + i) * 3;
        frag.position.x = Math.cos(angle) * radius;
        frag.position.z = Math.sin(angle) * radius;
        frag.position.y = Math.sin(angle * 2) * 5;
        frag.rotation.x += delta * 2;
        frag.rotation.y += delta * 3;
      }
    });

    // Attack pulse
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      // Scale pulse effect
      groupRef.current.scale.setScalar(1.3);
    }
    // Return to normal scale (using cached vector to avoid GC)
    groupRef.current.scale.lerp(UNIT_VECTOR3, 0.1);
  });

  return (
    <group ref={groupRef} position={[0, 10, 0]}>
      {/* Core - icosahedron */}
      <mesh geometry={AI_GEOMETRIES.core} material={materials.coreWireframe} />
      <mesh geometry={AI_GEOMETRIES.core} scale={0.8} material={materials.coreSolid} />

      {/* Glowing eye */}
      <mesh position={[0, 0, 6]} geometry={AI_GEOMETRIES.eye} material={materials.eye} />

      {/* Rotating ring */}
      <mesh ref={ringRef} geometry={AI_GEOMETRIES.ring} material={materials.ring} />

      {/* Orbiting fragments */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh
          key={`frag-${i}`}
          ref={(el) => { if (el) fragmentsRef.current[i] = el; }}
          geometry={AI_GEOMETRIES.fragment}
          material={materials.fragment}
        />
      ))}
    </group>
  );
}

// Manager - Business suit with briefcase
export function ManagerModel({ color, isWalking, lastAttackTime }: MonsterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const walkPhaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);
  const attackPhaseRef = useRef(1);

  // Memoized materials - solid for WebGPU compatibility
  const materials = useMemo(() => ({
    suit: getSharedMaterial(0x1a1a2e),
    shirt: getSharedMaterial(0xffffff),
    skin: getSharedMaterial(0xffdbac),
    tie: getSharedMaterial(color),
    glasses: getSharedMaterial(0x222222),
    briefcase: getSharedMaterial(0x8b4513),
  }), [color]);

  useFrame((_, delta) => {
    // Walking animation
    if (isWalking) {
      walkPhaseRef.current += delta * 6;
      const swing = Math.sin(walkPhaseRef.current) * 0.4;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.5;
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.9;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.9;
      if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.9;
    }

    // Attack animation - swing briefcase
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      attackPhaseRef.current = 0;
    }
    if (attackPhaseRef.current < 1) {
      attackPhaseRef.current += delta * 4;
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -Math.sin(attackPhaseRef.current * Math.PI) * 1.5;
      }
    } else {
      if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.9;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 40, 0]} geometry={MANAGER_GEOMETRIES.head} material={materials.skin} />

      {/* Glasses */}
      <mesh position={[0, 42, 5.5]} geometry={MANAGER_GEOMETRIES.glasses} material={materials.glasses} />

      {/* Body/Suit */}
      <mesh position={[0, 22, 0]} geometry={MANAGER_GEOMETRIES.body} material={materials.suit} />

      {/* Shirt collar visible */}
      <mesh position={[0, 30, 4]} scale={[0.8, 0.2, 0.5]} material={materials.shirt}>
        <boxGeometry args={[14, 4, 2]} />
      </mesh>

      {/* Tie */}
      <mesh position={[0, 22, 4.5]} geometry={MANAGER_GEOMETRIES.tie} material={materials.tie} />
      <mesh position={[0, 28, 4.5]} geometry={MANAGER_GEOMETRIES.tieKnot} material={materials.tie} />

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-9, 28, 0]}>
        <mesh position={[0, -7, 0]} geometry={MANAGER_GEOMETRIES.arm} material={materials.suit} />
      </group>

      {/* Right Arm with briefcase */}
      <group ref={rightArmRef} position={[9, 28, 0]}>
        <mesh position={[0, -7, 0]} geometry={MANAGER_GEOMETRIES.arm} material={materials.suit} />
        {/* Briefcase */}
        <mesh position={[0, -16, 4]} geometry={MANAGER_GEOMETRIES.briefcase} material={materials.briefcase} />
      </group>

      {/* Legs */}
      <group ref={leftLegRef} position={[-4, 14, 0]}>
        <mesh position={[0, -7, 0]} geometry={MANAGER_GEOMETRIES.leg} material={materials.suit} />
      </group>
      <group ref={rightLegRef} position={[4, 14, 0]}>
        <mesh position={[0, -7, 0]} geometry={MANAGER_GEOMETRIES.leg} material={materials.suit} />
      </group>
    </group>
  );
}

// Boss - Demonic entity with horns and multiple arms
export function BossModel({ color, isWalking, lastAttackTime }: MonsterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const armsRef = useRef<THREE.Group[]>([]);
  const walkPhaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);
  const attackPhaseRef = useRef(1);
  const pulseRef = useRef(0);

  // Memoized materials - solid for WebGPU compatibility
  const materials = useMemo(() => {
    const darkColor = new THREE.Color(color).multiplyScalar(0.4).getHex();
    return {
      body: getSharedMaterial(color),
      dark: getSharedMaterial(darkColor),
      eye: getSharedMaterial(0xff0000),
      horn: getSharedMaterial(0x222222),
    };
  }, [color]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    pulseRef.current += delta * 3;

    // Menacing idle sway
    groupRef.current.rotation.y = Math.sin(pulseRef.current * 0.5) * 0.1;

    // Walking
    if (isWalking) {
      walkPhaseRef.current += delta * 4;
    }

    // Arms idle movement
    armsRef.current.forEach((arm, i) => {
      if (arm) {
        arm.rotation.z = Math.sin(pulseRef.current + i * Math.PI / 2) * 0.2;
        arm.rotation.x = Math.sin(pulseRef.current * 0.7 + i) * 0.1;
      }
    });

    // Attack - all arms swing
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      attackPhaseRef.current = 0;
    }
    if (attackPhaseRef.current < 1) {
      attackPhaseRef.current += delta * 3;
      armsRef.current.forEach((arm) => {
        if (arm) {
          arm.rotation.x = -Math.sin(attackPhaseRef.current * Math.PI) * 1.2;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main body - chest */}
      <mesh position={[0, 28, 0]} geometry={BOSS_GEOMETRIES.chest} material={materials.body} />

      {/* Armored plates */}
      <mesh position={[0, 28, 6]} scale={[0.9, 0.9, 0.3]} geometry={BOSS_GEOMETRIES.chest} material={materials.dark} />

      {/* Head */}
      <mesh position={[0, 48, 0]} geometry={BOSS_GEOMETRIES.head} material={materials.dark} />

      {/* Glowing eyes */}
      <mesh position={[-4, 50, 7]} geometry={BOSS_GEOMETRIES.eye} material={materials.eye} />
      <mesh position={[4, 50, 7]} geometry={BOSS_GEOMETRIES.eye} material={materials.eye} />

      {/* Horns */}
      <mesh position={[-6, 56, 0]} rotation={[0.3, 0, -0.4]} geometry={BOSS_GEOMETRIES.horn} material={materials.horn} />
      <mesh position={[6, 56, 0]} rotation={[0.3, 0, 0.4]} geometry={BOSS_GEOMETRIES.horn} material={materials.horn} />

      {/* 4 Arms */}
      {[0, 1, 2, 3].map((i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const yOffset = i < 2 ? 0 : -8;
        return (
          <group
            key={`arm-${i}`}
            ref={(el) => { if (el) armsRef.current[i] = el; }}
            position={[side * 12, 34 + yOffset, 0]}
          >
            {/* Shoulder */}
            <mesh geometry={BOSS_GEOMETRIES.shoulder} material={materials.body} />
            {/* Arm */}
            <mesh position={[side * 4, -9, 0]} geometry={BOSS_GEOMETRIES.arm} material={materials.body} />
            {/* Claw */}
            <mesh position={[side * 4, -20, 0]} rotation={[Math.PI, 0, 0]} geometry={BOSS_GEOMETRIES.claw} material={materials.horn} />
          </group>
        );
      })}

      {/* Legs (thick, sturdy) */}
      <mesh position={[-6, 7, 0]} scale={[1.5, 1, 1.5]} geometry={BOSS_GEOMETRIES.arm} material={materials.dark} />
      <mesh position={[6, 7, 0]} scale={[1.5, 1, 1.5]} geometry={BOSS_GEOMETRIES.arm} material={materials.dark} />
    </group>
  );
}

// Unexplained Bug - Glitchy, impossible geometry
export function UnexplainedBugModel({ color, isWalking: _isWalking, lastAttackTime }: MonsterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const partsRef = useRef<THREE.Mesh[]>([]);
  const glitchPhaseRef = useRef(0);
  const lastAttackRef = useRef<number | null>(null);

  // Memoized materials - solid for WebGPU compatibility
  const materials = useMemo(() => {
    return {
      parts: [
        getSharedMaterial(color, { wireframe: true }),
        getSharedMaterial(0xff00ff),
        getSharedMaterial(0x00ffff, { wireframe: true }),
        getSharedMaterial(color),
        getSharedMaterial(0xffff00, { wireframe: true }),
        getSharedMaterial(0xff00ff),
      ],
      question: getSharedMaterial(0xffffff),
    };
  }, [color]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    glitchPhaseRef.current += delta;

    // Glitch effect - random position offsets
    const glitchIntensity = Math.sin(glitchPhaseRef.current * 10) > 0.8 ? 1 : 0;

    partsRef.current.forEach((part, i) => {
      if (part) {
        // Random glitch displacement
        if (glitchIntensity > 0 && Math.random() > 0.7) {
          part.position.x += (Math.random() - 0.5) * 4;
          part.position.y += (Math.random() - 0.5) * 4;
          part.position.z += (Math.random() - 0.5) * 4;
        } else {
          // Return to base position
          const baseX = ((i % 3) - 1) * 8;
          const baseY = Math.floor(i / 3) * 8 + 10;
          const baseZ = 0;
          part.position.x += (baseX - part.position.x) * 0.1;
          part.position.y += (baseY - part.position.y) * 0.1;
          part.position.z += (baseZ - part.position.z) * 0.1;
        }

        // Constant rotation
        part.rotation.x += delta * (1 + i * 0.5);
        part.rotation.y += delta * (0.5 + i * 0.3);
      }
    });

    // Main group wobble
    groupRef.current.rotation.z = Math.sin(glitchPhaseRef.current * 5) * 0.1 * glitchIntensity;

    // Attack - explode outward then reform
    if (lastAttackTime !== null && lastAttackTime !== lastAttackRef.current) {
      lastAttackRef.current = lastAttackTime;
      partsRef.current.forEach((part) => {
        if (part) {
          part.position.x += (Math.random() - 0.5) * 30;
          part.position.y += (Math.random() - 0.5) * 30;
          part.position.z += (Math.random() - 0.5) * 30;
        }
      });
    }
  });

  const geometries = [
    UNEXPLAINED_GEOMETRIES.cube,
    UNEXPLAINED_GEOMETRIES.sphere,
    UNEXPLAINED_GEOMETRIES.tetra,
    UNEXPLAINED_GEOMETRIES.octa,
    UNEXPLAINED_GEOMETRIES.cube,
    UNEXPLAINED_GEOMETRIES.tetra,
  ];

  return (
    <group ref={groupRef}>
      {geometries.map((geo, i) => (
        <mesh
          key={`part-${i}`}
          ref={(el) => { if (el) partsRef.current[i] = el; }}
          position={[((i % 3) - 1) * 8, Math.floor(i / 3) * 8 + 10, 0]}
          geometry={geo}
          material={materials.parts[i]}
        />
      ))}

      {/* Central "?" symbol */}
      <mesh position={[0, 15, 5]} material={materials.question}>
        <boxGeometry args={[3, 8, 1]} />
      </mesh>
      <mesh position={[0, 5, 5]} material={materials.question}>
        <boxGeometry args={[3, 3, 1]} />
      </mesh>
    </group>
  );
}

// Original monster types
export type OriginalMonsterType = 'bug' | 'aihallucination' | 'manager' | 'boss' | 'unexplainedbug';

// JavaScript error types
export type JsErrorType = 'jsundefined' | 'jsnan' | 'jscallbackhell';

// Python error types
export type PyErrorType = 'pyindentationerror' | 'pynonetype' | 'pyimporterror';

// Java error types
export type JavaErrorType = 'javanullpointer' | 'javaclassnotfound' | 'javaoutofmemory';

// C# error types
export type CsErrorType = 'csnullreference' | 'csstackoverflow' | 'csinvalidcast';

// C/C++ error types
export type CErrorType = 'csegfault' | 'cstackoverflow' | 'cmemoryleak';

// TypeScript error types
export type TsErrorType = 'tstypeerror' | 'tsany' | 'tsreadonly';

// PHP error types
export type PhpErrorType = 'phppaamayim' | 'phpfatalerror' | 'phpundefinedindex';

// Go error types
export type GoErrorType = 'gonilpanic' | 'godeadlock' | 'goimportcycle';

// Rust error types
export type RustErrorType = 'rustborrowchecker' | 'rustpanic' | 'rustlifetimeerror';

// Ruby error types
export type RubyErrorType = 'rubynomethoderror' | 'rubyloaderror' | 'rubysyntaxerror';

// Swift error types
export type SwiftErrorType = 'swiftfoundnil' | 'swiftforceunwrap' | 'swiftindexoutofrange';

// Kotlin error types
export type KotlinErrorType = 'kotlinnullpointer' | 'kotlinclasscast' | 'kotlinuninitialized';

// Scala error types
export type ScalaErrorType = 'scalamatcherror' | 'scalaabstractmethod' | 'scalastackoverflow';

// R error types
export type RErrorType = 'revalerror' | 'robjectnotfound' | 'rsubscriptoutofbounds';

// SQL error types
export type SqlErrorType = 'sqldeadlock' | 'sqlsyntaxerror' | 'sqltimeout';

// Bash error types
export type BashErrorType = 'bashcommandnotfound' | 'bashpermissiondenied' | 'bashcoredumped';

// Perl error types
export type PerlErrorType = 'perluninitialized' | 'perlsyntaxerror' | 'perlcantlocate';

// Lua error types
export type LuaErrorType = 'luaindexnil' | 'luabadargument' | 'luastackoverflow';

// Dart error types
export type DartErrorType = 'dartnullcheck' | 'dartrangeerror' | 'dartnosuchmethod';

// Elixir error types
export type ElixirErrorType = 'elixirfunctionclause' | 'elixirargumenterror' | 'elixirkeyerror';

// All monster types combined
export type MonsterType =
  | OriginalMonsterType
  | JsErrorType
  | PyErrorType
  | JavaErrorType
  | CsErrorType
  | CErrorType
  | TsErrorType
  | PhpErrorType
  | GoErrorType
  | RustErrorType
  | RubyErrorType
  | SwiftErrorType
  | KotlinErrorType
  | ScalaErrorType
  | RErrorType
  | SqlErrorType
  | BashErrorType
  | PerlErrorType
  | LuaErrorType
  | DartErrorType
  | ElixirErrorType;

// Combine all language error models
const allLanguageModels = {
  ...LanguageErrorModels,
  ...LanguageErrorModels2,
  ...LanguageErrorModels3,
};

interface MonsterModelSelectorProps extends MonsterProps {
  type: MonsterType;
}

export function MonsterModel({ type, ...props }: MonsterModelSelectorProps) {
  // Check original monsters first
  switch (type) {
    case 'bug':
      return <BugModel {...props} />;
    case 'aihallucination':
      return <AIHallucinationModel {...props} />;
    case 'manager':
      return <ManagerModel {...props} />;
    case 'boss':
      return <BossModel {...props} />;
    case 'unexplainedbug':
      return <UnexplainedBugModel {...props} />;
  }

  // Check language error models
  const LanguageModel = allLanguageModels[type as keyof typeof allLanguageModels];

  if (LanguageModel) {
    return <LanguageModel {...props} />;
  }

  return null;
}
