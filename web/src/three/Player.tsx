import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text, Billboard } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import { getCorReino } from './constants';
import {
  NotebookPreview,
  TecladoPreview,
  FonePreview,
  CamisetaPreview,
  BebidaPreview,
  ComidaPreview,
  IDEPreview,
  ProcessadorPreview,
  PetPreview,
  AcessorioPreview,
  getEquippedByCategory,
  type EquippableItem,
} from './ItemPreviewComponents';
import { MonsterModel, type MonsterType } from './MonsterModels';

// Ghost effect constants
const GHOST_DURATION = 4500; // ms - ghost rises for most of respawn time
const GHOST_RISE_HEIGHT = 200; // units - rises high to "heaven"

// Character dimensions (Minecraft-style blocky proportions)
const HEAD_SIZE = 12;
const BODY_WIDTH = 10;
const BODY_HEIGHT = 14;
const BODY_DEPTH = 6;
const ARM_WIDTH = 4;
const ARM_HEIGHT = 14;
const ARM_DEPTH = 4;
const LEG_WIDTH = 4;
const LEG_HEIGHT = 14;
const LEG_DEPTH = 4;

// Shared geometries - created once, reused by all players to reduce VRAM usage
const SHARED_GEOMETRIES = {
  head: new THREE.BoxGeometry(HEAD_SIZE, HEAD_SIZE, HEAD_SIZE),
  body: new THREE.BoxGeometry(BODY_WIDTH, BODY_HEIGHT, BODY_DEPTH),
  arm: new THREE.BoxGeometry(ARM_WIDTH, ARM_HEIGHT, ARM_DEPTH),
  leg: new THREE.BoxGeometry(LEG_WIDTH, LEG_HEIGHT, LEG_DEPTH),
  shadow: new THREE.CircleGeometry(10, 16),
  ring: new THREE.RingGeometry(12, 15, 32),
  hpBarBg: new THREE.PlaneGeometry(30, 3),
  hpBarFill: new THREE.PlaneGeometry(30, 2.5),
};

// Monster type colors
const MONSTER_COLORS: Record<string, number> = {
  // Original monsters
  bug: 0x8b4513,
  aihallucination: 0x9932cc,
  manager: 0x4169e1,
  boss: 0xff0000,
  unexplainedbug: 0x00ff00,
  // JavaScript
  jsundefined: 0xaaaaaa,
  jsnan: 0xf7df1e,
  jscallbackhell: 0xf7df1e,
  // Python
  pyindentationerror: 0x3776ab,
  pynonetype: 0x000000,
  pyimporterror: 0x3776ab,
  // Java
  javanullpointer: 0xf89820,
  javaclassnotfound: 0x5382a1,
  javaoutofmemory: 0x5382a1,
  // C#
  csnullreference: 0x68217a,
  csstackoverflow: 0x68217a,
  csinvalidcast: 0x68217a,
  // C/C++
  csegfault: 0xa8b9cc,
  cstackoverflow: 0x00599c,
  cmemoryleak: 0x00599c,
  // TypeScript
  tstypeerror: 0x3178c6,
  tsany: 0x888888,
  tsreadonly: 0x3178c6,
  // PHP
  phppaamayim: 0x777bb4,
  phpfatalerror: 0x777bb4,
  phpundefinedindex: 0x777bb4,
  // Go
  gonilpanic: 0x00add8,
  godeadlock: 0x00add8,
  goimportcycle: 0x00add8,
  // Rust
  rustborrowchecker: 0xdea584,
  rustpanic: 0xdea584,
  rustlifetimeerror: 0xdea584,
  // Ruby
  rubynomethoderror: 0xcc342d,
  rubyloaderror: 0xcc342d,
  rubysyntaxerror: 0xcc342d,
  // Swift
  swiftfoundnil: 0xfa7343,
  swiftforceunwrap: 0xfa7343,
  swiftindexoutofrange: 0xfa7343,
  // Kotlin
  kotlinnullpointer: 0x7f52ff,
  kotlinclasscast: 0x7f52ff,
  kotlinuninitialized: 0x7f52ff,
  // Scala
  scalamatcherror: 0xdc322f,
  scalaabstractmethod: 0xdc322f,
  scalastackoverflow: 0xdc322f,
  // R
  revalerror: 0x276dc3,
  robjectnotfound: 0x276dc3,
  rsubscriptoutofbounds: 0x276dc3,
  // SQL
  sqldeadlock: 0x0078d7,
  sqlsyntaxerror: 0x0078d7,
  sqltimeout: 0x0078d7,
  // Bash
  bashcommandnotfound: 0x00ff00,
  bashpermissiondenied: 0xff0000,
  bashcoredumped: 0xff6600,
  // Perl
  perluninitialized: 0x39457e,
  perlsyntaxerror: 0x39457e,
  perlcantlocate: 0x39457e,
  // Lua
  luaindexnil: 0x000080,
  luabadargument: 0x000080,
  luastackoverflow: 0x000080,
  // Dart
  dartnullcheck: 0x0175c2,
  dartrangeerror: 0x0175c2,
  dartnosuchmethod: 0x0175c2,
  // Elixir
  elixirfunctionclause: 0x4e2a8e,
  elixirargumenterror: 0x4e2a8e,
  elixirkeyerror: 0x4e2a8e,
};

// Monster model heights (base height before scaling) - for HP bar positioning
// These values represent the approximate TOP of each model in its local coordinate system
const MONSTER_HEIGHTS: Record<string, number> = {
  // Original monsters (based on actual model geometry analysis)
  bug: 25,           // Antennae top at ~22-25
  aihallucination: 45, // Floats at Y=20, core radius 8, ring +12 = ~40-45
  manager: 52,       // Head at Y=40, box height 10 = top at 45-50
  boss: 70,          // Horns at Y=56, cone extends up = ~65-70
  unexplainedbug: 35, // Parts scatter up to ~30-35
  // Language errors - heights based on model geometry (capsules, boxes, spheres)
  // Most have floating animations adding ~5-10 units
  jsundefined: 35, jsnan: 30, jscallbackhell: 45,
  pyindentationerror: 40, pynonetype: 30, pyimporterror: 40,
  javanullpointer: 45, javaclassnotfound: 40, javaoutofmemory: 50,
  csnullreference: 40, csstackoverflow: 45, csinvalidcast: 35,
  csegfault: 45, cstackoverflow: 40, cmemoryleak: 40,
  tstypeerror: 40, tsany: 35, tsreadonly: 30,
  phppaamayim: 40, phpfatalerror: 45, phpundefinedindex: 35,
  gonilpanic: 40, godeadlock: 50, goimportcycle: 40,
  rustborrowchecker: 45, rustpanic: 40, rustlifetimeerror: 40,
  rubynomethoderror: 40, rubyloaderror: 40, rubysyntaxerror: 30,
  swiftfoundnil: 40, swiftforceunwrap: 40, swiftindexoutofrange: 45,
  kotlinnullpointer: 40, kotlinclasscast: 35, kotlinuninitialized: 45,
  scalamatcherror: 40, scalaabstractmethod: 40, scalastackoverflow: 50,
  revalerror: 40, robjectnotfound: 40, rsubscriptoutofbounds: 30,
  sqldeadlock: 50, sqlsyntaxerror: 40, sqltimeout: 45,
  bashcommandnotfound: 40, bashpermissiondenied: 45, bashcoredumped: 40,
  perluninitialized: 40, perlsyntaxerror: 30, perlcantlocate: 40,
  luaindexnil: 35, luabadargument: 30, luastackoverflow: 45,
  dartnullcheck: 40, dartrangeerror: 40, dartnosuchmethod: 40,
  elixirfunctionclause: 45, elixirargumenterror: 40, elixirkeyerror: 40,
};

// Monster type scales - language errors are 1.5-2.5 range
const MONSTER_SCALES: Record<string, number> = {
  // Original monsters
  bug: 0.6,
  aihallucination: 3.1,
  manager: 3.74,
  boss: 3.84,
  unexplainedbug: 2.0,
  // JavaScript
  jsundefined: 1.8,
  jsnan: 1.6,
  jscallbackhell: 2.2,
  // Python
  pyindentationerror: 1.7,
  pynonetype: 1.5,
  pyimporterror: 2.0,
  // Java
  javanullpointer: 2.0,
  javaclassnotfound: 1.8,
  javaoutofmemory: 2.5,
  // C#
  csnullreference: 1.8,
  csstackoverflow: 2.2,
  csinvalidcast: 1.7,
  // C/C++
  csegfault: 2.3,
  cstackoverflow: 2.0,
  cmemoryleak: 2.0,
  // TypeScript
  tstypeerror: 1.7,
  tsany: 2.0,
  tsreadonly: 1.6,
  // PHP
  phppaamayim: 1.8,
  phpfatalerror: 2.2,
  phpundefinedindex: 1.6,
  // Go
  gonilpanic: 1.8,
  godeadlock: 2.5,
  goimportcycle: 2.0,
  // Rust
  rustborrowchecker: 2.2,
  rustpanic: 2.0,
  rustlifetimeerror: 2.0,
  // Ruby
  rubynomethoderror: 1.8,
  rubyloaderror: 2.2,
  rubysyntaxerror: 1.6,
  // Swift
  swiftfoundnil: 1.8,
  swiftforceunwrap: 2.0,
  swiftindexoutofrange: 2.0,
  // Kotlin
  kotlinnullpointer: 1.8,
  kotlinclasscast: 1.7,
  kotlinuninitialized: 2.2,
  // Scala
  scalamatcherror: 2.0,
  scalaabstractmethod: 1.8,
  scalastackoverflow: 2.5,
  // R
  revalerror: 2.0,
  robjectnotfound: 1.8,
  rsubscriptoutofbounds: 1.6,
  // SQL
  sqldeadlock: 2.2,
  sqlsyntaxerror: 1.8,
  sqltimeout: 2.0,
  // Bash
  bashcommandnotfound: 2.0,
  bashpermissiondenied: 2.2,
  bashcoredumped: 2.0,
  // Perl
  perluninitialized: 1.8,
  perlsyntaxerror: 1.7,
  perlcantlocate: 2.0,
  // Lua
  luaindexnil: 1.8,
  luabadargument: 1.6,
  luastackoverflow: 2.2,
  // Dart
  dartnullcheck: 1.8,
  dartrangeerror: 2.0,
  dartnosuchmethod: 1.7,
  // Elixir
  elixirfunctionclause: 2.0,
  elixirargumenterror: 1.8,
  elixirkeyerror: 1.7,
};

// All monster type keys for type checking
const MONSTER_TYPE_KEYS = Object.keys(MONSTER_COLORS);

type EntityType = 'player' | 'npc' | 'bug' | 'aihallucination' | 'manager' | 'boss' | 'unexplainedbug' |
  // JavaScript
  'jsundefined' | 'jsnan' | 'jscallbackhell' |
  // Python
  'pyindentationerror' | 'pynonetype' | 'pyimporterror' |
  // Java
  'javanullpointer' | 'javaclassnotfound' | 'javaoutofmemory' |
  // C#
  'csnullreference' | 'csstackoverflow' | 'csinvalidcast' |
  // C/C++
  'csegfault' | 'cstackoverflow' | 'cmemoryleak' |
  // TypeScript
  'tstypeerror' | 'tsany' | 'tsreadonly' |
  // PHP
  'phppaamayim' | 'phpfatalerror' | 'phpundefinedindex' |
  // Go
  'gonilpanic' | 'godeadlock' | 'goimportcycle' |
  // Rust
  'rustborrowchecker' | 'rustpanic' | 'rustlifetimeerror' |
  // Ruby
  'rubynomethoderror' | 'rubyloaderror' | 'rubysyntaxerror' |
  // Swift
  'swiftfoundnil' | 'swiftforceunwrap' | 'swiftindexoutofrange' |
  // Kotlin
  'kotlinnullpointer' | 'kotlinclasscast' | 'kotlinuninitialized' |
  // Scala
  'scalamatcherror' | 'scalaabstractmethod' | 'scalastackoverflow' |
  // R
  'revalerror' | 'robjectnotfound' | 'rsubscriptoutofbounds' |
  // SQL
  'sqldeadlock' | 'sqlsyntaxerror' | 'sqltimeout' |
  // Bash
  'bashcommandnotfound' | 'bashpermissiondenied' | 'bashcoredumped' |
  // Perl
  'perluninitialized' | 'perlsyntaxerror' | 'perlcantlocate' |
  // Lua
  'luaindexnil' | 'luabadargument' | 'luastackoverflow' |
  // Dart
  'dartnullcheck' | 'dartrangeerror' | 'dartnosuchmethod' |
  // Elixir
  'elixirfunctionclause' | 'elixirargumenterror' | 'elixirkeyerror';

interface PlayerProps {
  position: [number, number, number];
  reino: string;
  isCurrentPlayer?: boolean;
  hp?: number;
  maxHp?: number;
  type?: EntityType;
  githubLogin?: string;
  estado?: string;
  lastAttackTime?: number | null;
  equippedItems?: EquippableItem[];
  level?: number;
}

// Avatar texture on head front - with proper cleanup to prevent memory leaks
function useAvatarTexture(githubLogin?: string) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    if (!githubLogin) return;

    let isMounted = true;

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(
      `https://unavatar.io/github/${githubLogin}?fallback=false`,
      (loadedTexture) => {
        if (!isMounted) {
          // Component unmounted before load finished - dispose immediately
          loadedTexture.dispose();
          return;
        }
        loadedTexture.minFilter = THREE.NearestFilter;
        loadedTexture.magFilter = THREE.NearestFilter;
        textureRef.current = loadedTexture;
        setTexture(loadedTexture);
      },
      undefined,
      () => {
        if (isMounted) setTexture(null);
      }
    );

    // Cleanup: dispose texture when component unmounts or githubLogin changes
    return () => {
      isMounted = false;
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
    };
  }, [githubLogin]);

  return texture;
}


// Ghost sprite that rises and fades on death
function DeathGhost({ startTime }: { startTime: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [visible, setVisible] = useState(true);

  useFrame(() => {
    if (!meshRef.current || !visible) return;

    const elapsed = Date.now() - startTime;
    const progress = elapsed / GHOST_DURATION;

    if (progress >= 1) {
      setVisible(false);
      return;
    }

    // Rise upward
    meshRef.current.position.y = 40 + progress * GHOST_RISE_HEIGHT;

    // Fade out
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = 0.7 * (1 - progress);

    // Slight wobble
    meshRef.current.position.x = Math.sin(elapsed * 0.01) * 3;
  });

  if (!visible) return null;

  return (
    <Billboard>
      <mesh ref={meshRef} position={[0, 40, 0]}>
        {/* Simple ghost shape: circle for head + trapezoid body */}
        <group>
          {/* Head */}
          <mesh position={[0, 6, 0]}>
            <circleGeometry args={[6, 16]} />
            <meshBasicMaterial color={0xffffff} transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
          {/* Body - wavy bottom */}
          <mesh position={[0, -2, 0]}>
            <planeGeometry args={[12, 12]} />
            <meshBasicMaterial color={0xffffff} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
          {/* Eyes */}
          <mesh position={[-2.5, 7, 0.1]}>
            <circleGeometry args={[1.5, 8]} />
            <meshBasicMaterial color={0x333333} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[2.5, 7, 0.1]}>
            <circleGeometry args={[1.5, 8]} />
            <meshBasicMaterial color={0x333333} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </mesh>
    </Billboard>
  );
}

// Head component - transparent glass cube with avatar on front
function Head({ avatarTexture, isNpc }: { avatarTexture: THREE.Texture | null; isNpc: boolean }) {
  // NPCs: solid brown head
  if (isNpc) {
    return (
      <group position={[0, BODY_HEIGHT + HEAD_SIZE / 2, 0]}>
        <mesh geometry={SHARED_GEOMETRIES.head}>
          <meshBasicMaterial color={0x8b4513} />
        </mesh>
      </group>
    );
  }

  // Players: glass head with avatar
  // Use depthTest={false} with very low opacity to minimize overlap visual issues
  return (
    <group position={[0, BODY_HEIGHT + HEAD_SIZE / 2, 0]}>
      {/* Glass head cube */}
      <mesh renderOrder={1}>
        <boxGeometry args={[HEAD_SIZE, HEAD_SIZE, HEAD_SIZE]} />
        <meshBasicMaterial
          color={0x00ffff}
          transparent
          opacity={0.15}
          side={THREE.FrontSide}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      {/* Avatar on front face */}
      {avatarTexture && (
        <mesh position={[0, 0, HEAD_SIZE / 2 + 0.1]} renderOrder={2}>
          <planeGeometry args={[HEAD_SIZE, HEAD_SIZE]} />
          <meshBasicMaterial map={avatarTexture} transparent depthTest={false} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// Body/torso component
function Body({ color, opacity }: { color: number; opacity: number }) {
  return (
    <mesh position={[0, BODY_HEIGHT / 2, 0]} geometry={SHARED_GEOMETRIES.body}>
      <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}

// Arm component - EVENT-DRIVEN animation
// Only swings when lastAttackTime changes (actual attack happened)
function Arm({
  side,
  color,
  opacity,
  lastAttackTime,
  children,
}: {
  side: 'left' | 'right';
  color: number;
  opacity: number;
  lastAttackTime: number | null;
  children?: React.ReactNode;
}) {
  const armRef = useRef<THREE.Group>(null);
  const lastProcessedAttackRef = useRef<number | null>(null);
  const swingPhaseRef = useRef(0);
  const isSwingingRef = useRef(false);

  const xOffset = side === 'left' ? -(BODY_WIDTH / 2 + ARM_WIDTH / 2 + 1) : BODY_WIDTH / 2 + ARM_WIDTH / 2 + 1;

  // Swing duration in milliseconds
  const SWING_DURATION = 250;

  useFrame(() => {
    if (!armRef.current) return;

    // Only right arm attacks
    if (side === 'right') {
      // Check if a NEW attack happened
      if (lastAttackTime !== null && lastAttackTime !== lastProcessedAttackRef.current) {
        // Start a new swing
        lastProcessedAttackRef.current = lastAttackTime;
        isSwingingRef.current = true;
        swingPhaseRef.current = 0;
      }

      // Animate the swing
      if (isSwingingRef.current) {
        const elapsed = Date.now() - (lastProcessedAttackRef.current || 0);
        const progress = Math.min(1, elapsed / SWING_DURATION);

        // Swing forward then back: sin(0 to PI) goes 0 -> 1 -> 0
        const swingAngle = Math.sin(progress * Math.PI) * 1.5;
        armRef.current.rotation.x = -swingAngle;

        if (progress >= 1) {
          isSwingingRef.current = false;
        }
      } else {
        // Return to rest smoothly
        armRef.current.rotation.x *= 0.85;
      }
    } else {
      // Left arm stays at rest
      armRef.current.rotation.x *= 0.85;
    }
  });

  return (
    <group ref={armRef} position={[xOffset, BODY_HEIGHT, 0]}>
      {/* Single arm mesh - pivots from shoulder */}
      <mesh position={[0, -ARM_HEIGHT / 2, 0]} geometry={SHARED_GEOMETRIES.arm}>
        <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      {/* Item held in hand */}
      {children}
    </group>
  );
}

// Leg component - manages its own animation phase for smooth animation
function Leg({
  side,
  color,
  isWalking,
  opacity,
  animationSpeed,
}: {
  side: 'left' | 'right';
  color: number;
  isWalking: boolean;
  opacity: number;
  animationSpeed: number;
}) {
  const legRef = useRef<THREE.Group>(null);
  const walkPhaseRef = useRef(0); // Each leg manages its own phase
  const xOffset = side === 'left' ? -LEG_WIDTH / 2 - 1 : LEG_WIDTH / 2 + 1;

  useFrame((_, delta) => {
    if (!legRef.current) return;

    if (isWalking) {
      // Update walk phase every frame
      walkPhaseRef.current += delta * animationSpeed;
      // Walking animation - alternate legs
      const swing = Math.sin(walkPhaseRef.current) * 0.8;
      legRef.current.rotation.x = side === 'left' ? swing : -swing;
    } else {
      // Return to standing position smoothly
      legRef.current.rotation.x *= 0.85;
    }
  });

  // Darker color for pants
  const legColor = new THREE.Color(color).multiplyScalar(0.6).getHex();

  return (
    <group ref={legRef} position={[xOffset, 0, 0]}>
      {/* Single leg mesh - pivots from hip */}
      <mesh position={[0, -LEG_HEIGHT / 2, 0]} geometry={SHARED_GEOMETRIES.leg}>
        <meshBasicMaterial color={legColor} transparent={opacity < 1} opacity={opacity} />
      </mesh>
    </group>
  );
}

// Helper to check if entity is a monster type
function isMonsterType(type: EntityType): boolean {
  return MONSTER_TYPE_KEYS.includes(type);
}

export function Player({
  position,
  reino,
  isCurrentPlayer = false,
  hp = 100,
  maxHp = 100,
  type = 'player',
  githubLogin,
  estado = 'idle',
  lastAttackTime = null,
  equippedItems = [],
  level = 1,
}: PlayerProps) {
  const { t } = useTranslation();
  const groupRef = useRef<THREE.Group>(null);
  const isPlayerType = type === 'player';
  const isMonster = isMonsterType(type);

  // Get equipped items by category
  const notebookItem = useMemo(() => getEquippedByCategory(equippedItems, 'notebook'), [equippedItems]);
  const tecladoItem = useMemo(() => getEquippedByCategory(equippedItems, 'teclado'), [equippedItems]);
  const foneItem = useMemo(() => getEquippedByCategory(equippedItems, 'fone'), [equippedItems]);
  const camisetaItem = useMemo(() => getEquippedByCategory(equippedItems, 'camiseta'), [equippedItems]);
  const cafeItem = useMemo(() => getEquippedByCategory(equippedItems, 'cafe'), [equippedItems]);
  const energeticoItem = useMemo(() => getEquippedByCategory(equippedItems, 'energetico'), [equippedItems]);
  const comidaItem = useMemo(() => getEquippedByCategory(equippedItems, 'comida'), [equippedItems]);
  const ideItem = useMemo(() => getEquippedByCategory(equippedItems, 'ide'), [equippedItems]);
  const processadorItem = useMemo(() => getEquippedByCategory(equippedItems, 'processador'), [equippedItems]);
  const petItem = useMemo(() => getEquippedByCategory(equippedItems, 'pet'), [equippedItems]);
  const acessorioItem = useMemo(() => getEquippedByCategory(equippedItems, 'acessorio'), [equippedItems]);

  // Translate monster names, keep player names as-is
  // For players, show "Lv.X Name" format
  const displayName = useMemo(() => {
    if (!githubLogin) return undefined;
    if (isMonster) {
      const translated = t(`monsters.${githubLogin}`, { defaultValue: githubLogin });
      return translated;
    }
    // Show level for players
    return `Lv.${level} ${githubLogin}`;
  }, [githubLogin, isMonster, level, t]);
  const isDead = estado === 'dead';
  const isWalking = estado === 'walking' || estado === 'moving';

  // Get color based on entity type
  const color = isMonster
    ? MONSTER_COLORS[type] ?? 0x888888
    : getCorReino(reino);

  // Get scale based on entity type
  const scale = isMonster
    ? MONSTER_SCALES[type] ?? 1
    : 1;

  // Avatar texture for head - only for players
  const avatarTexture = useAvatarTexture(isPlayerType ? githubLogin : undefined);

  // Determine if entity should show NPC-style head (no avatar)
  const isNpcHead = !isPlayerType;

  // Animation speed for walking - natural pace (2-3 cycles per second)
  // velocidadeAtaque affects combat, not walk animation
  const animationSpeed = 8;

  const [opacity, setOpacity] = useState(1);
  const [ghostStartTime, setGhostStartTime] = useState<number | null>(null);
  const wasDeadRef = useRef(false);

  // Death effect - trigger ghost when transitioning to dead
  useEffect(() => {
    setOpacity(isDead ? 0.3 : 1);

    // Trigger ghost when player dies (transition from alive to dead)
    if (isDead && !wasDeadRef.current) {
      setGhostStartTime(Date.now());
    }

    // Clear ghost after animation completes
    if (!isDead && wasDeadRef.current) {
      setGhostStartTime(null);
    }

    wasDeadRef.current = isDead;
  }, [isDead]);

  // Main animation loop - only handles death animation now
  // Leg animations are handled internally by each Leg component
  useFrame(() => {
    if (!groupRef.current) return;

    // Death fall animation
    if (isDead) {
      const targetRotation = -Math.PI / 2;
      groupRef.current.rotation.x += (targetRotation - groupRef.current.rotation.x) * 0.1;
    } else {
      groupRef.current.rotation.x *= 0.9;
    }
  });

  // Height offset for HP bar based on monster type
  // Billboard is inside scaled group, so position is already scaled by parent
  // Just use model's local height + padding (padding also needs to be compensated for scale)
  const hpBarHeight = isMonster
    ? (MONSTER_HEIGHTS[type] ?? 30) + (10 / scale)
    : HEAD_SIZE + BODY_HEIGHT + LEG_HEIGHT + (20 / scale);

  return (
    <group position={position} ref={groupRef} scale={[scale, scale, scale]}>
      {/* Name and HP as 3D Billboard */}
      <Billboard position={[0, hpBarHeight, 0]} follow={true}>
        {/* HP Bar background */}
        {!isDead && maxHp > 0 && (
          <>
            <mesh position={[0, 4, 0]} geometry={SHARED_GEOMETRIES.hpBarBg} renderOrder={200}>
              <meshBasicMaterial color="#21262d" depthTest={false} />
            </mesh>
            {/* HP Bar fill */}
            {hp > 0 && (
              <mesh position={[-15 + (hp / maxHp) * 15, 4, 0.1]} renderOrder={201}>
                <planeGeometry args={[(hp / maxHp) * 30, 2.5]} />
                <meshBasicMaterial color={(hp / maxHp) > 0.6 ? '#238636' : (hp / maxHp) > 0.3 ? '#d29922' : '#f85149'} depthTest={false} />
              </mesh>
            )}
          </>
        )}
        {/* Name text - above HP bar, compensate fontSize for entity scale */}
        {displayName && (
          <Text
            position={[0, 10, 0]}
            fontSize={5 / scale}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.3 / scale}
            outlineColor="black"
            material-depthTest={false}
            renderOrder={202}
          >
            {displayName}
          </Text>
        )}
      </Billboard>

      {/* Render monster model or player model */}
      {isMonster ? (
        /* Monster-specific models */
        <MonsterModel
          type={type as MonsterType}
          color={color}
          opacity={opacity}
          isWalking={isWalking}
          lastAttackTime={lastAttackTime}
        />
      ) : (
        /* Player humanoid model */
        <>
          {/* Character body offset to stand on ground */}
          <group position={[0, LEG_HEIGHT, 0]}>
            {/* Head with avatar */}
            <Head avatarTexture={avatarTexture} isNpc={isNpcHead} />

            {/* Processor INSIDE the glass head */}
            {processadorItem && (
              <ProcessadorPreview itemName={processadorItem.name} tier={processadorItem.tier} />
            )}

            {/* Headphones on head */}
            {foneItem && (
              <group position={[0, BODY_HEIGHT + HEAD_SIZE / 2, 0]}>
                <FonePreview itemName={foneItem.name} tier={foneItem.tier} />
              </group>
            )}

            {/* Orbiting items around head */}
            {(cafeItem || energeticoItem) && (
              <group position={[0, BODY_HEIGHT + HEAD_SIZE / 2, 0]}>
                <BebidaPreview
                  itemName={(cafeItem || energeticoItem)!.name}
                  tier={(cafeItem || energeticoItem)!.tier}
                />
              </group>
            )}
            {comidaItem && (
              <group position={[0, BODY_HEIGHT + HEAD_SIZE / 2, 0]}>
                <ComidaPreview itemName={comidaItem.name} tier={comidaItem.tier} />
              </group>
            )}

            {/* Body/Torso */}
            <Body color={color} opacity={opacity} />

            {/* Shirt/Hoodie on body */}
            {camisetaItem && (
              <CamisetaPreview itemName={camisetaItem.name} tier={camisetaItem.tier} />
            )}

            {/* Arms - animation triggered by lastAttackTime */}
            <Arm
              side="left"
              color={color}
              opacity={opacity}
              lastAttackTime={lastAttackTime}
            >
              {/* Keyboard in left hand */}
              {tecladoItem && (
                <TecladoPreview itemName={tecladoItem.name} tier={tecladoItem.tier} />
              )}
            </Arm>
            <Arm
              side="right"
              color={color}
              opacity={opacity}
              lastAttackTime={lastAttackTime}
            >
              {/* Notebook in right hand */}
              {notebookItem && (
                <NotebookPreview itemName={notebookItem.name} tier={notebookItem.tier} />
              )}
            </Arm>
          </group>

          {/* IDE floating screen */}
          {ideItem && (
            <IDEPreview itemName={ideItem.name} tier={ideItem.tier} />
          )}

          {/* Pet companion */}
          {petItem && (
            <PetPreview itemName={petItem.name} tier={petItem.tier} />
          )}

          {/* Accessory furniture */}
          {acessorioItem && (
            <AcessorioPreview itemName={acessorioItem.name} tier={acessorioItem.tier} />
          )}

          {/* Legs (pivot at hip) - each leg manages its own animation */}
          <group position={[0, LEG_HEIGHT, 0]}>
            <Leg
              side="left"
              color={color}
              isWalking={isWalking}
              opacity={opacity}
              animationSpeed={animationSpeed}
            />
            <Leg
              side="right"
              color={color}
              isWalking={isWalking}
              opacity={opacity}
              animationSpeed={animationSpeed}
            />
          </group>
        </>
      )}

      {/* Shadow on ground - renderOrder -1 ensures it renders before transparent objects */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} renderOrder={-1} geometry={SHARED_GEOMETRIES.shadow}>
        <meshBasicMaterial color={0x000000} transparent opacity={isDead ? 0.1 : 0.3} depthWrite={false} />
      </mesh>

      {/* Current player indicator ring */}
      {isCurrentPlayer && !isDead && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]} renderOrder={-1} geometry={SHARED_GEOMETRIES.ring}>
          <meshBasicMaterial color={0xffffff} transparent opacity={0.5} depthWrite={false} />
        </mesh>
      )}

      {/* Death ghost effect */}
      {ghostStartTime !== null && <DeathGhost startTime={ghostStartTime} />}
    </group>
  );
}
