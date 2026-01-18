import { useMemo } from 'react';
import * as THREE from 'three';
import { MAP_WIDTH, MAP_HEIGHT, DESK_WIDTH, DESK_HEIGHT, DESK_OFFSET_X, DESK_OFFSET_Z } from './constants';
import { getTerrainHeight } from './TerrainHeight';
import { Buildings } from './Buildings';

// Desk center position (for positioning desk elements)
const DESK_CENTER_X = DESK_OFFSET_X + DESK_WIDTH / 2;
const DESK_CENTER_Z = DESK_OFFSET_Z + DESK_HEIGHT / 2;

// Cores da mesa
const WOOD_DARK = 0x654321;        // Marrom escuro (borda)
const MONITOR_FRAME = 0x2a2a2a;    // Cinza escuro

// Wall depth for edge (going DOWN like a building)
const WALL_DEPTH = 2000;

// Create a procedural wood texture
function useWoodTexture() {
  return useMemo(() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base wood color
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, size, size);

    // Wood grain lines (horizontal with variation)
    for (let y = 0; y < size; y += 6) {
      const shade = Math.floor(Math.random() * 30 - 15);
      const r = Math.min(255, Math.max(0, 139 + shade));
      const g = Math.min(255, Math.max(0, 69 + shade));
      const b = Math.min(255, Math.max(0, 19 + shade));
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      // Wavy line
      for (let x = 0; x < size; x += 15) {
        ctx.lineTo(x, y + Math.sin(x * 0.015 + y * 0.01) * 2);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(DESK_WIDTH / 400, DESK_HEIGHT / 400);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;

    return texture;
  }, []);
}

// Monitor component - positioned relative to desk center
function Monitor() {
  const screenWidth = 1200;
  const screenHeight = 700;
  const screenDepth = 40;
  const bezelSize = 15;
  const baseWidth = 350;
  const baseHeight = 12;
  const standHeight = 180;
  const standWidth = 60;
  const standDepth = 30;

  // Position relative to desk (original: center X, Z=600 from desk top)
  const posX = DESK_CENTER_X;
  const posZ = DESK_OFFSET_Z + 600;

  return (
    <group position={[posX, 0, posZ]}>
      {/* Monitor base - oval shape */}
      <mesh position={[0, baseHeight / 2, 0]}>
        <cylinderGeometry args={[baseWidth / 2, baseWidth / 2.2, baseHeight, 32]} />
        <meshBasicMaterial color={MONITOR_FRAME} />
      </mesh>

      {/* Base rim detail */}
      <mesh position={[0, baseHeight, 0]}>
        <cylinderGeometry args={[baseWidth / 2.5, baseWidth / 2.3, 4, 32]} />
        <meshBasicMaterial color={0x1a1a1a} />
      </mesh>

      {/* Monitor stand - neck */}
      <mesh position={[0, baseHeight + standHeight / 2, 0]}>
        <boxGeometry args={[standWidth, standHeight, standDepth]} />
        <meshBasicMaterial color={MONITOR_FRAME} />
      </mesh>

      {/* Stand cable management hole */}
      <mesh position={[0, baseHeight + standHeight / 2, standDepth / 2 + 1]}>
        <circleGeometry args={[15, 16]} />
        <meshBasicMaterial color={0x0a0a0a} />
      </mesh>

      {/* Monitor back panel */}
      <mesh position={[0, baseHeight + standHeight + screenHeight / 2, -screenDepth / 2]}>
        <boxGeometry args={[screenWidth - 100, screenHeight - 100, 10]} />
        <meshBasicMaterial color={0x1a1a1a} />
      </mesh>

      {/* Monitor frame - thin bezel design */}
      <mesh position={[0, baseHeight + standHeight + screenHeight / 2, 0]}>
        <boxGeometry args={[screenWidth, screenHeight, screenDepth]} />
        <meshBasicMaterial color={MONITOR_FRAME} />
      </mesh>

      {/* Screen bezel - top */}
      <mesh position={[0, baseHeight + standHeight + screenHeight - bezelSize / 2, screenDepth / 2 + 0.5]}>
        <boxGeometry args={[screenWidth - 10, bezelSize, 2]} />
        <meshBasicMaterial color={0x1a1a1a} />
      </mesh>

      {/* Screen bezel - bottom (thicker for logo) */}
      <mesh position={[0, baseHeight + standHeight + 25, screenDepth / 2 + 0.5]}>
        <boxGeometry args={[screenWidth - 10, 50, 2]} />
        <meshBasicMaterial color={0x1a1a1a} />
      </mesh>

      {/* Monitor screen - with subtle glow */}
      <mesh position={[0, baseHeight + standHeight + screenHeight / 2 + 20, screenDepth / 2 + 2]}>
        <planeGeometry args={[screenWidth - 40, screenHeight - 80]} />
        <meshBasicMaterial color={0x0d1b2a} />
      </mesh>

      {/* Screen content - code lines effect */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <mesh key={i} position={[-screenWidth / 4 + (i % 3) * 80, baseHeight + standHeight + screenHeight / 2 + 150 - i * 50, screenDepth / 2 + 3]}>
          <planeGeometry args={[180 + Math.sin(i) * 60, 8]} />
          <meshBasicMaterial color={i % 3 === 0 ? 0x4fc3f7 : i % 3 === 1 ? 0x81c784 : 0xffb74d} transparent opacity={0.7} />
        </mesh>
      ))}

      {/* Power LED */}
      <mesh position={[0, baseHeight + standHeight + 15, screenDepth / 2 + 2]}>
        <circleGeometry args={[4, 12]} />
        <meshBasicMaterial color={0x00ff00} />
      </mesh>

      {/* Brand logo placeholder */}
      <mesh position={[0, baseHeight + standHeight + 25, screenDepth / 2 + 3]}>
        <boxGeometry args={[60, 8, 1]} />
        <meshBasicMaterial color={0x3a3a3a} />
      </mesh>
    </group>
  );
}

// Individual key component with keycap detail
function KeyCap({ position, width: w = 26, depth: d = 26, color = 0x2d2d2d, isSpecial = false }: {
  position: [number, number, number];
  width?: number;
  depth?: number;
  color?: number;
  isSpecial?: boolean;
}) {
  const height = 10;
  const topInset = 3;

  return (
    <group position={position}>
      {/* Key base */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[w, height, d]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Key top (slightly smaller - creates keycap look) */}
      <mesh position={[0, height + 1, 0]}>
        <boxGeometry args={[w - topInset, 2, d - topInset]} />
        <meshBasicMaterial color={isSpecial ? 0x3a3a3a : 0x353535} />
      </mesh>
      {/* Key stem hint */}
      <mesh position={[0, height + 2.5, 0]}>
        <boxGeometry args={[w - 6, 1, d - 6]} />
        <meshBasicMaterial color={0x404040} />
      </mesh>
    </group>
  );
}

// Keyboard component - positioned relative to desk center
function Keyboard() {
  const width = 580;
  const height = 16;
  const depth = 200;
  const keySize = 26;
  const keyGap = 3;

  // Position relative to desk center
  const posX = DESK_CENTER_X;
  const posZ = DESK_CENTER_Z - 100;

  return (
    <group position={[posX, 0, posZ]}>
      {/* Keyboard aluminum base */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial color={0x1c1c1c} />
      </mesh>

      {/* Keyboard plate (visible between keys) */}
      <mesh position={[0, height + 0.5, 0]}>
        <boxGeometry args={[width - 20, 1, depth - 20]} />
        <meshBasicMaterial color={0x0f0f0f} />
      </mesh>

      {/* Top case rim */}
      <mesh position={[0, height + 6, -depth / 2 + 8]}>
        <boxGeometry args={[width, 12, 16]} />
        <meshBasicMaterial color={0x1a1a1a} />
      </mesh>

      {/* Function row (Esc + F1-F12) */}
      <KeyCap position={[-width / 2 + 25, height, -depth / 2 + 30]} color={0x404040} isSpecial />
      {Array.from({ length: 12 }).map((_, i) => (
        <KeyCap
          key={`fn-${i}`}
          position={[-width / 2 + 70 + i * (keySize + keyGap + 2), height, -depth / 2 + 30]}
          width={24}
          depth={22}
          color={0x2a2a2a}
        />
      ))}

      {/* Number row (` 1-0 - = Backspace) */}
      {Array.from({ length: 13 }).map((_, i) => (
        <KeyCap
          key={`num-${i}`}
          position={[-width / 2 + 25 + i * (keySize + keyGap), height, -depth / 2 + 60]}
        />
      ))}
      <KeyCap position={[width / 2 - 40, height, -depth / 2 + 60]} width={55} color={0x333333} isSpecial />

      {/* QWERTY row (Tab + Q-] + \) */}
      <KeyCap position={[-width / 2 + 30, height, -depth / 2 + 90]} width={40} color={0x333333} isSpecial />
      {Array.from({ length: 12 }).map((_, i) => (
        <KeyCap
          key={`qwerty-${i}`}
          position={[-width / 2 + 65 + i * (keySize + keyGap), height, -depth / 2 + 90]}
        />
      ))}
      <KeyCap position={[width / 2 - 35, height, -depth / 2 + 90]} width={45} />

      {/* ASDF row (Caps + A-' + Enter) */}
      <KeyCap position={[-width / 2 + 35, height, -depth / 2 + 120]} width={50} color={0x333333} isSpecial />
      {Array.from({ length: 11 }).map((_, i) => (
        <KeyCap
          key={`asdf-${i}`}
          position={[-width / 2 + 75 + i * (keySize + keyGap), height, -depth / 2 + 120]}
        />
      ))}
      <KeyCap position={[width / 2 - 42, height, -depth / 2 + 120]} width={60} color={0x444444} isSpecial />

      {/* ZXCV row (Shift + Z-/ + Shift) */}
      <KeyCap position={[-width / 2 + 42, height, -depth / 2 + 150]} width={65} color={0x333333} isSpecial />
      {Array.from({ length: 10 }).map((_, i) => (
        <KeyCap
          key={`zxcv-${i}`}
          position={[-width / 2 + 95 + i * (keySize + keyGap), height, -depth / 2 + 150]}
        />
      ))}
      <KeyCap position={[width / 2 - 50, height, -depth / 2 + 150]} width={75} color={0x333333} isSpecial />

      {/* Bottom row (Ctrl, Win, Alt, Space, Alt, Fn, Menu, Ctrl) */}
      <KeyCap position={[-width / 2 + 30, height, -depth / 2 + 180]} width={38} color={0x333333} isSpecial />
      <KeyCap position={[-width / 2 + 72, height, -depth / 2 + 180]} width={32} color={0x333333} isSpecial />
      <KeyCap position={[-width / 2 + 108, height, -depth / 2 + 180]} width={32} color={0x333333} isSpecial />
      {/* Spacebar */}
      <KeyCap position={[0, height, -depth / 2 + 180]} width={180} depth={26} />
      <KeyCap position={[width / 2 - 108, height, -depth / 2 + 180]} width={32} color={0x333333} isSpecial />
      <KeyCap position={[width / 2 - 72, height, -depth / 2 + 180]} width={32} color={0x333333} isSpecial />
      <KeyCap position={[width / 2 - 30, height, -depth / 2 + 180]} width={38} color={0x333333} isSpecial />

      {/* Arrow key cluster */}
      <KeyCap position={[width / 2 - 70, height, depth / 2 - 45]} width={24} depth={22} color={0x2a2a2a} />
      <KeyCap position={[width / 2 - 100, height, depth / 2 - 20]} width={24} depth={22} color={0x2a2a2a} />
      <KeyCap position={[width / 2 - 70, height, depth / 2 - 20]} width={24} depth={22} color={0x2a2a2a} />
      <KeyCap position={[width / 2 - 40, height, depth / 2 - 20]} width={24} depth={22} color={0x2a2a2a} />

      {/* RGB underglow */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[width - 10, 2, depth - 10]} />
        <meshBasicMaterial color={0x00ffff} transparent opacity={0.3} />
      </mesh>

      {/* Status LEDs */}
      <mesh position={[width / 2 - 60, height + 14, -depth / 2 + 10]}>
        <circleGeometry args={[3, 8]} />
        <meshBasicMaterial color={0x00ff00} />
      </mesh>
      <mesh position={[width / 2 - 45, height + 14, -depth / 2 + 10]}>
        <circleGeometry args={[3, 8]} />
        <meshBasicMaterial color={0x333333} />
      </mesh>
      <mesh position={[width / 2 - 30, height + 14, -depth / 2 + 10]}>
        <circleGeometry args={[3, 8]} />
        <meshBasicMaterial color={0x333333} />
      </mesh>
    </group>
  );
}

// Mouse and Mousepad component - positioned relative to desk center
function MouseAndPad() {
  const padWidth = 900;
  const padDepth = 400;
  const padThickness = 4;

  // Position relative to desk center
  const posX = DESK_CENTER_X + 550;
  const posZ = DESK_CENTER_Z;

  return (
    <group position={[posX, 0, posZ]}>
      {/* === MOUSEPAD === */}
      {/* Mousepad base - soft rubber */}
      <mesh position={[0, padThickness / 2, 0]}>
        <boxGeometry args={[padWidth, padThickness, padDepth]} />
        <meshBasicMaterial color={0x1a1a1a} />
      </mesh>

      {/* Mousepad cloth surface */}
      <mesh position={[0, padThickness + 0.5, 0]}>
        <boxGeometry args={[padWidth - 6, 1, padDepth - 6]} />
        <meshBasicMaterial color={0x2a2a2a} />
      </mesh>

      {/* Stitched edge - all around */}
      {/* Top edge */}
      <mesh position={[0, padThickness + 1, -padDepth / 2 + 4]}>
        <boxGeometry args={[padWidth - 4, 2, 8]} />
        <meshBasicMaterial color={0x3d3d3d} />
      </mesh>
      {/* Bottom edge */}
      <mesh position={[0, padThickness + 1, padDepth / 2 - 4]}>
        <boxGeometry args={[padWidth - 4, 2, 8]} />
        <meshBasicMaterial color={0x3d3d3d} />
      </mesh>
      {/* Left edge */}
      <mesh position={[-padWidth / 2 + 4, padThickness + 1, 0]}>
        <boxGeometry args={[8, 2, padDepth - 4]} />
        <meshBasicMaterial color={0x3d3d3d} />
      </mesh>
      {/* Right edge */}
      <mesh position={[padWidth / 2 - 4, padThickness + 1, 0]}>
        <boxGeometry args={[8, 2, padDepth - 4]} />
        <meshBasicMaterial color={0x3d3d3d} />
      </mesh>

      {/* Brand logo area */}
      <mesh position={[-padWidth / 3, padThickness + 1.5, padDepth / 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[50, 70, 32]} />
        <meshBasicMaterial color={0x333333} />
      </mesh>
      <mesh position={[-padWidth / 3, padThickness + 1.5, padDepth / 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[40, 32]} />
        <meshBasicMaterial color={0x2a2a2a} />
      </mesh>

      {/* Surface texture pattern */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`tex-${i}`} position={[-padWidth / 4 + i * 80, padThickness + 1.2, -padDepth / 4]} rotation={[-Math.PI / 2, 0, 0.1]}>
          <planeGeometry args={[60, 2]} />
          <meshBasicMaterial color={0x252525} transparent opacity={0.5} />
        </mesh>
      ))}

      {/* === GAMING MOUSE - Logitech G Pro style === */}
      <group position={[100, padThickness, -20]}>
        {/* Mouse shell - bottom */}
        <mesh position={[0, 8, 0]}>
          <boxGeometry args={[65, 16, 120]} />
          <meshBasicMaterial color={0x0a0a0a} />
        </mesh>

        {/* Mouse shell - main body curved */}
        <mesh position={[0, 20, 5]}>
          <boxGeometry args={[62, 12, 110]} />
          <meshBasicMaterial color={0x111111} />
        </mesh>

        {/* Mouse hump - ergonomic curve */}
        <mesh position={[0, 28, 20]}>
          <sphereGeometry args={[32, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color={0x111111} />
        </mesh>

        {/* Front slope */}
        <mesh position={[0, 22, -35]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[58, 8, 40]} />
          <meshBasicMaterial color={0x111111} />
        </mesh>

        {/* === BUTTONS === */}
        {/* Left click */}
        <mesh position={[-14, 26, -25]}>
          <boxGeometry args={[24, 3, 50]} />
          <meshBasicMaterial color={0x151515} />
        </mesh>
        {/* Left click top surface */}
        <mesh position={[-14, 28, -25]}>
          <boxGeometry args={[22, 1, 48]} />
          <meshBasicMaterial color={0x1a1a1a} />
        </mesh>

        {/* Right click */}
        <mesh position={[14, 26, -25]}>
          <boxGeometry args={[24, 3, 50]} />
          <meshBasicMaterial color={0x151515} />
        </mesh>
        {/* Right click top surface */}
        <mesh position={[14, 28, -25]}>
          <boxGeometry args={[22, 1, 48]} />
          <meshBasicMaterial color={0x1a1a1a} />
        </mesh>

        {/* Button gap/divider */}
        <mesh position={[0, 27, -25]}>
          <boxGeometry args={[3, 5, 55]} />
          <meshBasicMaterial color={0x050505} />
        </mesh>

        {/* === SCROLL WHEEL === */}
        {/* Scroll wheel housing */}
        <mesh position={[0, 28, -10]}>
          <boxGeometry args={[18, 10, 20]} />
          <meshBasicMaterial color={0x0a0a0a} />
        </mesh>
        {/* Scroll wheel */}
        <mesh position={[0, 32, -10]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[7, 7, 14, 24]} />
          <meshBasicMaterial color={0x2a2a2a} />
        </mesh>
        {/* Scroll wheel rubber grip rings */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={`scroll-${i}`} position={[0, 32, -10]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[7, 0.8, 8, 24]} />
            <meshBasicMaterial color={0x1a1a1a} />
          </mesh>
        ))}
        {/* Scroll wheel click */}
        <mesh position={[0, 32, -10]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[3, 3, 16, 12]} />
          <meshBasicMaterial color={0x333333} />
        </mesh>

        {/* === DPI BUTTON === */}
        <mesh position={[0, 28, -38]}>
          <boxGeometry args={[10, 2, 10]} />
          <meshBasicMaterial color={0x222222} />
        </mesh>
        {/* DPI LED indicator */}
        <mesh position={[0, 29.5, -38]}>
          <boxGeometry args={[6, 1, 6]} />
          <meshBasicMaterial color={0x00ffff} transparent opacity={0.8} />
        </mesh>

        {/* === SIDE BUTTONS (Left side) === */}
        {/* Button 1 (front) */}
        <mesh position={[-33, 18, -15]}>
          <boxGeometry args={[3, 10, 18]} />
          <meshBasicMaterial color={0x1a1a1a} />
        </mesh>
        <mesh position={[-34, 18, -15]}>
          <boxGeometry args={[2, 8, 16]} />
          <meshBasicMaterial color={0x252525} />
        </mesh>
        {/* Button 2 (back) */}
        <mesh position={[-33, 18, 8]}>
          <boxGeometry args={[3, 10, 18]} />
          <meshBasicMaterial color={0x1a1a1a} />
        </mesh>
        <mesh position={[-34, 18, 8]}>
          <boxGeometry args={[2, 8, 16]} />
          <meshBasicMaterial color={0x252525} />
        </mesh>

        {/* === RGB LIGHTING === */}
        {/* Logo RGB (top) */}
        <mesh position={[0, 30, 25]} rotation={[-0.3, 0, 0]}>
          <circleGeometry args={[12, 16]} />
          <meshBasicMaterial color={0x00ffff} transparent opacity={0.7} />
        </mesh>
        {/* Side RGB strips */}
        <mesh position={[32, 14, 0]}>
          <boxGeometry args={[1, 6, 70]} />
          <meshBasicMaterial color={0xff00ff} transparent opacity={0.5} />
        </mesh>
        <mesh position={[-32, 14, 0]}>
          <boxGeometry args={[1, 6, 70]} />
          <meshBasicMaterial color={0xff00ff} transparent opacity={0.5} />
        </mesh>
        {/* Bottom RGB glow */}
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[50, 1, 100]} />
          <meshBasicMaterial color={0x00ffff} transparent opacity={0.3} />
        </mesh>

        {/* === MOUSE FEET (PTFE) === */}
        {/* Front feet */}
        <mesh position={[-20, 1, -50]}>
          <boxGeometry args={[15, 1, 10]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
        <mesh position={[20, 1, -50]}>
          <boxGeometry args={[15, 1, 10]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
        {/* Middle feet */}
        <mesh position={[-25, 1, 0]}>
          <boxGeometry args={[12, 1, 25]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
        <mesh position={[25, 1, 0]}>
          <boxGeometry args={[12, 1, 25]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
        {/* Back feet */}
        <mesh position={[0, 1, 50]}>
          <boxGeometry args={[40, 1, 12]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>

        {/* === SENSOR WINDOW === */}
        <mesh position={[0, 0.5, 10]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[8, 16]} />
          <meshBasicMaterial color={0x1a0000} />
        </mesh>
        {/* Sensor lens */}
        <mesh position={[0, 0.8, 10]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[4, 12]} />
          <meshBasicMaterial color={0x330000} />
        </mesh>

        {/* === TEXTURED GRIP SIDES === */}
        {/* Left grip texture */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`grip-l-${i}`} position={[-32, 12 + i * 3, 0]}>
            <boxGeometry args={[1.5, 1.5, 60]} />
            <meshBasicMaterial color={0x1a1a1a} />
          </mesh>
        ))}
        {/* Right grip texture */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`grip-r-${i}`} position={[32, 12 + i * 3, 0]}>
            <boxGeometry args={[1.5, 1.5, 60]} />
            <meshBasicMaterial color={0x1a1a1a} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Desk edge walls - positioned relative to desk in the expanded map
function DeskEdges() {
  const edgeColor = WOOD_DARK;

  return (
    <group>
      {/* North edge (desk top) */}
      <mesh position={[DESK_CENTER_X, -WALL_DEPTH / 2, DESK_OFFSET_Z]}>
        <planeGeometry args={[DESK_WIDTH, WALL_DEPTH]} />
        <meshBasicMaterial color={edgeColor} side={THREE.DoubleSide} />
      </mesh>

      {/* South edge (desk bottom) */}
      <mesh position={[DESK_CENTER_X, -WALL_DEPTH / 2, DESK_OFFSET_Z + DESK_HEIGHT]}>
        <planeGeometry args={[DESK_WIDTH, WALL_DEPTH]} />
        <meshBasicMaterial color={edgeColor} side={THREE.DoubleSide} />
      </mesh>

      {/* West edge (desk left) */}
      <mesh position={[DESK_OFFSET_X, -WALL_DEPTH / 2, DESK_CENTER_Z]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[DESK_HEIGHT, WALL_DEPTH]} />
        <meshBasicMaterial color={edgeColor} side={THREE.DoubleSide} />
      </mesh>

      {/* East edge (desk right) */}
      <mesh position={[DESK_OFFSET_X + DESK_WIDTH, -WALL_DEPTH / 2, DESK_CENTER_Z]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[DESK_HEIGHT, WALL_DEPTH]} />
        <meshBasicMaterial color={edgeColor} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Table legs component - positioned relative to desk in the expanded map
function TableLegs() {
  const legColor = 0x2a2a2a;
  const legWidth = 60;
  const legHeight = 150;
  const legDepth = 60;
  const inset = 150; // How far from edge

  // Desk boundaries
  const deskMinX = DESK_OFFSET_X;
  const deskMaxX = DESK_OFFSET_X + DESK_WIDTH;
  const deskMinZ = DESK_OFFSET_Z;
  const deskMaxZ = DESK_OFFSET_Z + DESK_HEIGHT;

  return (
    <group>
      {/* Front left leg */}
      <mesh position={[deskMinX + inset, -legHeight / 2, deskMinZ + inset]}>
        <boxGeometry args={[legWidth, legHeight, legDepth]} />
        <meshBasicMaterial color={legColor} />
      </mesh>

      {/* Front right leg */}
      <mesh position={[deskMaxX - inset, -legHeight / 2, deskMinZ + inset]}>
        <boxGeometry args={[legWidth, legHeight, legDepth]} />
        <meshBasicMaterial color={legColor} />
      </mesh>

      {/* Back left leg */}
      <mesh position={[deskMinX + inset, -legHeight / 2, deskMaxZ - inset]}>
        <boxGeometry args={[legWidth, legHeight, legDepth]} />
        <meshBasicMaterial color={legColor} />
      </mesh>

      {/* Back right leg */}
      <mesh position={[deskMaxX - inset, -legHeight / 2, deskMaxZ - inset]}>
        <boxGeometry args={[legWidth, legHeight, legDepth]} />
        <meshBasicMaterial color={legColor} />
      </mesh>

      {/* Cross bars for stability */}
      {/* Front bar */}
      <mesh position={[DESK_CENTER_X, -legHeight + 30, deskMinZ + inset]}>
        <boxGeometry args={[DESK_WIDTH - inset * 2 - legWidth, 20, 20]} />
        <meshBasicMaterial color={legColor} />
      </mesh>

      {/* Back bar */}
      <mesh position={[DESK_CENTER_X, -legHeight + 30, deskMaxZ - inset]}>
        <boxGeometry args={[DESK_WIDTH - inset * 2 - legWidth, 20, 20]} />
        <meshBasicMaterial color={legColor} />
      </mesh>

      {/* Left bar */}
      <mesh position={[deskMinX + inset, -legHeight + 30, DESK_CENTER_Z]}>
        <boxGeometry args={[20, 20, DESK_HEIGHT - inset * 2 - legDepth]} />
        <meshBasicMaterial color={legColor} />
      </mesh>

      {/* Right bar */}
      <mesh position={[deskMaxX - inset, -legHeight + 30, DESK_CENTER_Z]}>
        <boxGeometry args={[20, 20, DESK_HEIGHT - inset * 2 - legDepth]} />
        <meshBasicMaterial color={legColor} />
      </mesh>

      {/* Desk frame/apron - just the edges, not solid */}
      {/* Front apron */}
      <mesh position={[DESK_CENTER_X, -20, deskMinZ]}>
        <boxGeometry args={[DESK_WIDTH + 40, 40, 30]} />
        <meshBasicMaterial color={0x5a3a2a} />
      </mesh>
      {/* Back apron */}
      <mesh position={[DESK_CENTER_X, -20, deskMaxZ]}>
        <boxGeometry args={[DESK_WIDTH + 40, 40, 30]} />
        <meshBasicMaterial color={0x5a3a2a} />
      </mesh>
      {/* Left apron */}
      <mesh position={[deskMinX, -20, DESK_CENTER_Z]}>
        <boxGeometry args={[30, 40, DESK_HEIGHT]} />
        <meshBasicMaterial color={0x5a3a2a} />
      </mesh>
      {/* Right apron */}
      <mesh position={[deskMaxX, -20, DESK_CENTER_Z]}>
        <boxGeometry args={[30, 40, DESK_HEIGHT]} />
        <meshBasicMaterial color={0x5a3a2a} />
      </mesh>
    </group>
  );
}

// Terrain colors for height-based coloring
const TERRAIN_COLORS = {
  low: new THREE.Color(0x4a6741),     // Dark green grass
  mid: new THREE.Color(0x5d8a47),     // Green (grassy hills)
  high: new THREE.Color(0x8b7355),    // Lighter brown (rocky peaks)
};

const TERRAIN_MAX_HEIGHT = 150;

// Create terrain geometry for a specific region (outside the desk)
function createTerrainGeometry(
  startX: number,
  startZ: number,
  width: number,
  height: number,
  segmentsX: number,
  segmentsZ: number
): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(width, height, segmentsX, segmentsZ);
  const positions = geo.attributes.position;
  const colors: number[] = [];

  for (let i = 0; i < positions.count; i++) {
    const localX = positions.getX(i);
    const localY = positions.getY(i);

    // Convert to world coordinates
    const worldX = localX + startX + width / 2;
    const worldZ = localY + startZ + height / 2;

    // Get terrain height (returns 0 for desk area)
    const terrainHeight = getTerrainHeight(worldX, worldZ);
    // After -90° X rotation, local +Z becomes world +Y (elevation)
    positions.setZ(i, terrainHeight);

    // Vertex color based on height
    const normalizedHeight = terrainHeight / TERRAIN_MAX_HEIGHT;
    let color: THREE.Color;
    if (normalizedHeight < 0.3) {
      color = TERRAIN_COLORS.low.clone();
    } else if (normalizedHeight < 0.7) {
      const t = (normalizedHeight - 0.3) / 0.4;
      color = TERRAIN_COLORS.low.clone().lerp(TERRAIN_COLORS.mid, t);
    } else {
      const t = (normalizedHeight - 0.7) / 0.3;
      color = TERRAIN_COLORS.mid.clone().lerp(TERRAIN_COLORS.high, t);
    }
    colors.push(color.r, color.g, color.b);
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

// Terrain meshes ONLY for expanded areas (outside desk)
function ExpandedTerrain() {
  // Create terrain for 4 regions: North, South, West, East (and corners)
  const geometries = useMemo(() => {
    const segments = 40;

    // North area (above desk)
    const northGeo = createTerrainGeometry(0, 0, MAP_WIDTH, DESK_OFFSET_Z, segments * 2, segments);

    // South area (below desk)
    const southGeo = createTerrainGeometry(0, DESK_OFFSET_Z + DESK_HEIGHT, MAP_WIDTH, MAP_HEIGHT - DESK_OFFSET_Z - DESK_HEIGHT, segments * 2, segments);

    // West area (left of desk, between north and south)
    const westGeo = createTerrainGeometry(0, DESK_OFFSET_Z, DESK_OFFSET_X, DESK_HEIGHT, segments, segments);

    // East area (right of desk, between north and south)
    const eastGeo = createTerrainGeometry(DESK_OFFSET_X + DESK_WIDTH, DESK_OFFSET_Z, MAP_WIDTH - DESK_OFFSET_X - DESK_WIDTH, DESK_HEIGHT, segments, segments);

    return { northGeo, southGeo, westGeo, eastGeo };
  }, []);

  // Base Y position - terrain starts below desk level (Y=0)
  // With maxHeight=150, terrain peaks will reach Y=150 at highest points
  const baseY = -50; // Valleys are 50 units below desk, peaks reach up to 100 above

  return (
    <group>
      {/* North terrain */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[MAP_WIDTH / 2, baseY, DESK_OFFSET_Z / 2]}
        geometry={geometries.northGeo}
      >
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>

      {/* South terrain */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[MAP_WIDTH / 2, baseY, DESK_OFFSET_Z + DESK_HEIGHT + (MAP_HEIGHT - DESK_OFFSET_Z - DESK_HEIGHT) / 2]}
        geometry={geometries.southGeo}
      >
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>

      {/* West terrain */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[DESK_OFFSET_X / 2, baseY, DESK_CENTER_Z]}
        geometry={geometries.westGeo}
      >
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>

      {/* East terrain */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[DESK_OFFSET_X + DESK_WIDTH + (MAP_WIDTH - DESK_OFFSET_X - DESK_WIDTH) / 2, baseY, DESK_CENTER_Z]}
        geometry={geometries.eastGeo}
      >
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Flat desk surface (wood texture) - ONLY the desk area
function DeskSurface({ woodTexture }: { woodTexture: THREE.Texture }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[DESK_CENTER_X, 0, DESK_CENTER_Z]}>
      <planeGeometry args={[DESK_WIDTH, DESK_HEIGHT]} />
      <meshBasicMaterial map={woodTexture} />
    </mesh>
  );
}

// Ground base for the entire map (dark grass under terrain)
function GroundBase() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[MAP_WIDTH / 2, -1, MAP_HEIGHT / 2]}>
      <planeGeometry args={[MAP_WIDTH, MAP_HEIGHT]} />
      <meshBasicMaterial color={0x2a3a2a} />
    </mesh>
  );
}

export function GameMap() {
  const woodTexture = useWoodTexture();

  return (
    <group>
      {/* Ground base under everything */}
      <GroundBase />

      {/* Expanded terrain (outside desk area) */}
      <ExpandedTerrain />

      {/* Table legs and structure */}
      <TableLegs />

      {/* Desk edge walls */}
      <DeskEdges />

      {/* Desk surface (wood texture) - flat, at Y=0 */}
      <DeskSurface woodTexture={woodTexture} />

      {/* Desk elements */}
      <Monitor />
      <Keyboard />
      <MouseAndPad />

      {/* Tech buildings in expanded areas */}
      <Buildings />
    </group>
  );
}
