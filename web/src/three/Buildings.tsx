import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BUILDING_POSITIONS, getTerrainHeight } from './TerrainHeight';

// Color palette for tech buildings
const COLORS = {
  serverRack: 0x1a1a1a,
  serverRackFrame: 0x2a2a2a,
  ledGreen: 0x00ff00,
  ledRed: 0xff0000,
  ledBlue: 0x0088ff,
  ledYellow: 0xffff00,
  dataCenter: 0x2d2d2d,
  dataCenterVent: 0x1a1a1a,
  networkSwitch: 0x333333,
  ethernetPort: 0x0066cc,
  ups: 0x222222,
  upsBattery: 0x3a5a3a,
  coffeeStation: 0x4a3a2a,
  coffeeMachine: 0x1a1a1a,
  whiteboard: 0xf5f5f5,
  whiteboardFrame: 0x3a3a3a,
  cable: 0x111111,
};

// Server Rack - tall cabinet with blinking LEDs
function ServerRack({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const ledsRef = useRef<THREE.Group>(null);
  const timeRef = useRef(Math.random() * 100); // Random offset for LED blinking

  useFrame((_, delta) => {
    if (ledsRef.current) {
      timeRef.current += delta;
    }
  });

  const rackWidth = 80;
  const rackHeight = 120;
  const rackDepth = 40;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main rack body */}
      <mesh position={[0, rackHeight / 2, 0]}>
        <boxGeometry args={[rackWidth, rackHeight, rackDepth]} />
        <meshBasicMaterial color={COLORS.serverRack} />
      </mesh>

      {/* Rack frame edges */}
      {/* Vertical corner posts */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([x, z], i) => (
        <mesh key={`post-${i}`} position={[x * (rackWidth / 2 - 3), rackHeight / 2, z * (rackDepth / 2 - 3)]}>
          <boxGeometry args={[6, rackHeight + 4, 6]} />
          <meshBasicMaterial color={COLORS.serverRackFrame} />
        </mesh>
      ))}

      {/* Server units (U slots) with LEDs */}
      <group ref={ledsRef}>
        {Array.from({ length: 6 }).map((_, i) => {
          const yPos = 15 + i * 17;
          const isActive = Math.sin(timeRef.current * 3 + i) > 0;
          return (
            <group key={`server-${i}`} position={[0, yPos, rackDepth / 2 - 2]}>
              {/* Server unit face */}
              <mesh>
                <planeGeometry args={[rackWidth - 16, 14]} />
                <meshBasicMaterial color={0x0a0a0a} />
              </mesh>
              {/* Status LEDs */}
              <mesh position={[-rackWidth / 2 + 15, 3, 1]}>
                <circleGeometry args={[2, 8]} />
                <meshBasicMaterial color={isActive ? COLORS.ledGreen : 0x003300} />
              </mesh>
              <mesh position={[-rackWidth / 2 + 22, 3, 1]}>
                <circleGeometry args={[2, 8]} />
                <meshBasicMaterial color={Math.random() > 0.7 ? COLORS.ledYellow : 0x333300} />
              </mesh>
              {/* Ventilation holes */}
              {Array.from({ length: 5 }).map((_, j) => (
                <mesh key={`vent-${j}`} position={[10 + j * 10, 0, 1]}>
                  <planeGeometry args={[6, 10]} />
                  <meshBasicMaterial color={0x050505} />
                </mesh>
              ))}
            </group>
          );
        })}
      </group>

      {/* Top ventilation */}
      <mesh position={[0, rackHeight + 3, 0]}>
        <boxGeometry args={[rackWidth - 8, 6, rackDepth - 8]} />
        <meshBasicMaterial color={COLORS.serverRackFrame} />
      </mesh>

      {/* Cables coming out the back */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={`cable-${i}`} position={[-25 + i * 18, rackHeight - 20, -rackDepth / 2 - 10]}>
          <cylinderGeometry args={[3, 3, 20, 8]} />
          <meshBasicMaterial color={COLORS.cable} />
        </mesh>
      ))}
    </group>
  );
}

// Data Center - larger building with multiple racks and cooling
function DataCenter({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const fanRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (fanRef.current) {
      fanRef.current.rotation.z += delta * 15; // Fast spinning fan
    }
  });

  const width = 200;
  const height = 150;
  const depth = 150;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main building structure */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial color={COLORS.dataCenter} />
      </mesh>

      {/* Roof structure */}
      <mesh position={[0, height + 5, 0]}>
        <boxGeometry args={[width + 10, 10, depth + 10]} />
        <meshBasicMaterial color={0x3a3a3a} />
      </mesh>

      {/* Ventilation units on sides */}
      {[-1, 1].map((side, i) => (
        <group key={`vent-unit-${i}`} position={[side * (width / 2 - 5), height / 2, 0]}>
          {/* Vent grille */}
          {Array.from({ length: 4 }).map((_, j) => (
            <mesh key={`grille-${j}`} position={[side * 3, -height / 4 + j * 30, 0]}>
              <planeGeometry args={[6, 25]} />
              <meshBasicMaterial color={COLORS.dataCenterVent} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Large cooling fan on top */}
      <group position={[0, height + 20, 0]}>
        {/* Fan housing */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[30, 30, 15, 16]} />
          <meshBasicMaterial color={0x2a2a2a} />
        </mesh>
        {/* Fan blades */}
        <mesh ref={fanRef} position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[25, 6]} />
          <meshBasicMaterial color={0x4a4a4a} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Front door */}
      <mesh position={[0, height / 3, depth / 2 + 1]}>
        <planeGeometry args={[60, height * 0.6]} />
        <meshBasicMaterial color={0x1a1a1a} />
      </mesh>

      {/* Door handle */}
      <mesh position={[20, height / 3, depth / 2 + 3]}>
        <boxGeometry args={[3, 15, 3]} />
        <meshBasicMaterial color={0x666666} />
      </mesh>

      {/* Status panel with LEDs */}
      <group position={[-width / 4, height - 20, depth / 2 + 2]}>
        <mesh>
          <planeGeometry args={[50, 20]} />
          <meshBasicMaterial color={0x0a0a0a} />
        </mesh>
        {/* Status LEDs row */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`status-led-${i}`} position={[-18 + i * 9, 0, 1]}>
            <circleGeometry args={[3, 8]} />
            <meshBasicMaterial color={i < 4 ? COLORS.ledGreen : COLORS.ledBlue} />
          </mesh>
        ))}
      </group>

      {/* AC Unit exhaust */}
      <mesh position={[width / 3, height + 15, 0]}>
        <boxGeometry args={[40, 30, 40]} />
        <meshBasicMaterial color={0x3a3a3a} />
      </mesh>
    </group>
  );
}

// Network Switch - small device with ethernet ports
function NetworkSwitch({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const width = 60;
  const height = 12;
  const depth = 30;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Switch body */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial color={COLORS.networkSwitch} />
      </mesh>

      {/* Front panel with ports */}
      <mesh position={[0, height / 2, depth / 2 + 0.5]}>
        <planeGeometry args={[width - 4, height - 2]} />
        <meshBasicMaterial color={0x1a1a1a} />
      </mesh>

      {/* Ethernet ports */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`port-${i}`} position={[-width / 2 + 8 + i * 7, height / 2, depth / 2 + 1]}>
          <boxGeometry args={[5, 4, 2]} />
          <meshBasicMaterial color={COLORS.ethernetPort} />
        </mesh>
      ))}

      {/* Status LEDs */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`led-${i}`} position={[-width / 2 + 8 + i * 7, height - 1, depth / 2 + 1]}>
          <circleGeometry args={[1.5, 6]} />
          <meshBasicMaterial color={Math.random() > 0.3 ? COLORS.ledGreen : 0x003300} />
        </mesh>
      ))}

      {/* Power LED */}
      <mesh position={[width / 2 - 5, height / 2, depth / 2 + 1]}>
        <circleGeometry args={[2, 8]} />
        <meshBasicMaterial color={COLORS.ledGreen} />
      </mesh>

      {/* Mounting brackets */}
      {[-1, 1].map((side, i) => (
        <mesh key={`bracket-${i}`} position={[side * (width / 2 + 3), height / 2, 0]}>
          <boxGeometry args={[6, height + 4, 8]} />
          <meshBasicMaterial color={0x4a4a4a} />
        </mesh>
      ))}
    </group>
  );
}

// UPS/Battery Unit - power backup
function UPSUnit({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const width = 50;
  const height = 80;
  const depth = 80;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main UPS body */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial color={COLORS.ups} />
      </mesh>

      {/* Battery compartment indicator */}
      <mesh position={[0, height / 3, depth / 2 + 1]}>
        <planeGeometry args={[width - 10, height / 2]} />
        <meshBasicMaterial color={COLORS.upsBattery} />
      </mesh>

      {/* Display panel */}
      <mesh position={[0, height - 15, depth / 2 + 1]}>
        <planeGeometry args={[30, 15]} />
        <meshBasicMaterial color={0x001a00} />
      </mesh>

      {/* Power indicator */}
      <mesh position={[-width / 4, height - 8, depth / 2 + 2]}>
        <circleGeometry args={[3, 8]} />
        <meshBasicMaterial color={COLORS.ledGreen} />
      </mesh>

      {/* Battery level indicators */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={`batt-${i}`} position={[5 + i * 6, height - 8, depth / 2 + 2]}>
          <boxGeometry args={[4, 8, 1]} />
          <meshBasicMaterial color={i < 3 ? COLORS.ledGreen : 0x003300} />
        </mesh>
      ))}

      {/* Ventilation grilles */}
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={`vent-${i}`} position={[0, 10 + i * 15, depth / 2 + 1]}>
          <planeGeometry args={[width - 15, 3]} />
          <meshBasicMaterial color={0x0a0a0a} />
        </mesh>
      ))}

      {/* Power cord */}
      <mesh position={[0, 10, -depth / 2 - 8]}>
        <cylinderGeometry args={[4, 4, 15, 8]} />
        <meshBasicMaterial color={COLORS.cable} />
      </mesh>
    </group>
  );
}

// Coffee Station - break area with coffee machine
function CoffeeStation({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Counter/Table */}
      <mesh position={[0, 35, 0]}>
        <boxGeometry args={[100, 10, 60]} />
        <meshBasicMaterial color={COLORS.coffeeStation} />
      </mesh>

      {/* Table legs */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([x, z], i) => (
        <mesh key={`leg-${i}`} position={[x * 40, 15, z * 22]}>
          <boxGeometry args={[8, 30, 8]} />
          <meshBasicMaterial color={0x3a3a3a} />
        </mesh>
      ))}

      {/* Coffee machine */}
      <group position={[-25, 40, 0]}>
        {/* Machine body */}
        <mesh position={[0, 20, 0]}>
          <boxGeometry args={[30, 40, 25]} />
          <meshBasicMaterial color={COLORS.coffeeMachine} />
        </mesh>
        {/* Water tank */}
        <mesh position={[0, 45, 0]}>
          <boxGeometry args={[20, 15, 18]} />
          <meshBasicMaterial color={0x4488aa} transparent opacity={0.6} />
        </mesh>
        {/* Dispenser area */}
        <mesh position={[0, 8, 10]}>
          <boxGeometry args={[20, 16, 10]} />
          <meshBasicMaterial color={0x0a0a0a} />
        </mesh>
        {/* Power LED */}
        <mesh position={[-10, 30, 13]}>
          <circleGeometry args={[2, 8]} />
          <meshBasicMaterial color={COLORS.ledRed} />
        </mesh>
      </group>

      {/* Coffee cups stack */}
      <group position={[15, 45, 0]}>
        {Array.from({ length: 3 }).map((_, i) => (
          <mesh key={`cup-${i}`} position={[i * 8 - 8, 0, 0]}>
            <cylinderGeometry args={[4, 3, 10, 12]} />
            <meshBasicMaterial color={0xffffff} />
          </mesh>
        ))}
      </group>

      {/* Sugar/Cream containers */}
      <group position={[35, 45, 0]}>
        <mesh position={[0, 5, 0]}>
          <cylinderGeometry args={[6, 6, 10, 12]} />
          <meshBasicMaterial color={0xeeeeee} />
        </mesh>
        <mesh position={[15, 5, 0]}>
          <cylinderGeometry args={[6, 6, 10, 12]} />
          <meshBasicMaterial color={0x8b4513} />
        </mesh>
      </group>
    </group>
  );
}

// Whiteboard - meeting/brainstorm area
function Whiteboard({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Stand/Frame */}
      <group>
        {/* Vertical posts */}
        {[-1, 1].map((side, i) => (
          <mesh key={`post-${i}`} position={[side * 70, 60, 0]}>
            <boxGeometry args={[8, 120, 8]} />
            <meshBasicMaterial color={COLORS.whiteboardFrame} />
          </mesh>
        ))}
        {/* Base feet */}
        {[-1, 1].map((side, i) => (
          <mesh key={`foot-${i}`} position={[side * 70, 3, 0]}>
            <boxGeometry args={[25, 6, 40]} />
            <meshBasicMaterial color={COLORS.whiteboardFrame} />
          </mesh>
        ))}
      </group>

      {/* Whiteboard surface */}
      <mesh position={[0, 75, 5]}>
        <boxGeometry args={[150, 90, 4]} />
        <meshBasicMaterial color={COLORS.whiteboard} />
      </mesh>

      {/* Frame border */}
      {/* Top */}
      <mesh position={[0, 123, 5]}>
        <boxGeometry args={[158, 6, 6]} />
        <meshBasicMaterial color={0x555555} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, 27, 5]}>
        <boxGeometry args={[158, 6, 6]} />
        <meshBasicMaterial color={0x555555} />
      </mesh>
      {/* Left */}
      <mesh position={[-77, 75, 5]}>
        <boxGeometry args={[6, 96, 6]} />
        <meshBasicMaterial color={0x555555} />
      </mesh>
      {/* Right */}
      <mesh position={[77, 75, 5]}>
        <boxGeometry args={[6, 96, 6]} />
        <meshBasicMaterial color={0x555555} />
      </mesh>

      {/* Marker tray */}
      <mesh position={[0, 25, 12]}>
        <boxGeometry args={[100, 5, 10]} />
        <meshBasicMaterial color={0x444444} />
      </mesh>

      {/* Markers */}
      {[0xff0000, 0x0000ff, 0x00aa00, 0x000000].map((color, i) => (
        <mesh key={`marker-${i}`} position={[-30 + i * 20, 27, 12]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[2, 2, 15, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}

      {/* Drawn content (simulated diagrams) */}
      <group position={[0, 75, 8]}>
        {/* Box diagram */}
        <mesh position={[-40, 20, 0]}>
          <planeGeometry args={[35, 25]} />
          <meshBasicMaterial color={0x0066cc} transparent opacity={0.3} />
        </mesh>
        {/* Another box */}
        <mesh position={[20, 20, 0]}>
          <planeGeometry args={[35, 25]} />
          <meshBasicMaterial color={0x00aa00} transparent opacity={0.3} />
        </mesh>
        {/* Arrow line */}
        <mesh position={[-10, 20, 0]}>
          <planeGeometry args={[25, 3]} />
          <meshBasicMaterial color={0x333333} />
        </mesh>
        {/* Text lines */}
        {Array.from({ length: 3 }).map((_, i) => (
          <mesh key={`text-${i}`} position={[-30, -15 - i * 12, 0]}>
            <planeGeometry args={[60 - i * 10, 4]} />
            <meshBasicMaterial color={0x666666} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Base Y offset for terrain (must match Map.tsx)
const TERRAIN_BASE_Y = -50;

// Main Buildings component that renders all buildings
export function Buildings() {
  return (
    <group>
      {BUILDING_POSITIONS.map((building, index) => {
        // Get terrain height at building position and add base offset
        const terrainHeight = getTerrainHeight(building.x, building.z);
        const position: [number, number, number] = [building.x, TERRAIN_BASE_Y + terrainHeight, building.z];

        switch (building.type) {
          case 'serverRack':
            return <ServerRack key={`building-${index}`} position={position} rotation={building.rotation} />;
          case 'dataCenter':
            return <DataCenter key={`building-${index}`} position={position} rotation={building.rotation} />;
          case 'networkSwitch':
            return <NetworkSwitch key={`building-${index}`} position={position} rotation={building.rotation} />;
          case 'ups':
            return <UPSUnit key={`building-${index}`} position={position} rotation={building.rotation} />;
          case 'coffeeStation':
            return <CoffeeStation key={`building-${index}`} position={position} rotation={building.rotation} />;
          case 'whiteboard':
            return <Whiteboard key={`building-${index}`} position={position} rotation={building.rotation} />;
          default:
            return null;
        }
      })}
    </group>
  );
}
