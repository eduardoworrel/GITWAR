import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PlayerItem } from '../stores/gameStore';

// Character dimensions (shared with Player.tsx)
export const HEAD_SIZE = 12;
export const BODY_WIDTH = 10;
export const BODY_HEIGHT = 14;
export const BODY_DEPTH = 6;
export const ARM_WIDTH = 4;
export const ARM_HEIGHT = 14;
export const ARM_DEPTH = 4;
export const LEG_WIDTH = 4;
export const LEG_HEIGHT = 14;
export const LEG_DEPTH = 4;

// Tier colors for item glow effects
export const tierColors: Record<string, string> = {
  SS: '#ff00ff',
  S: '#ff4444',
  A: '#ff8800',
  B: '#8855ff',
  C: '#00aaff',
  D: '#00cc66',
  E: '#888888',
  F: '#666666',
};

// Props for item preview components
interface ItemPreviewProps {
  itemName: string;
  tier: string;
}

// Notebook visuals - closed, extending along arm (RIGHT ARM)
export function NotebookPreview({ itemName, tier }: ItemPreviewProps) {
  const tierColor = tierColors[tier] || '#888888';

  const isMacBook = itemName.toLowerCase().includes('macbook');
  const isAlienware = itemName.toLowerCase().includes('alienware');
  const isThinkPad = itemName.toLowerCase().includes('thinkpad');
  const isRazer = itemName.toLowerCase().includes('razer') || itemName.toLowerCase().includes('blade');
  const isROG = itemName.toLowerCase().includes('rog') || itemName.toLowerCase().includes('zephyrus') || itemName.toLowerCase().includes('asus');

  const getBodyColor = () => {
    if (isMacBook) return '#a8a8a8';
    if (isAlienware) return '#1a1a2e';
    if (isThinkPad) return '#2d2d2d';
    if (isRazer) return '#0a0a0a';
    if (isROG) return '#1a1a1a';
    return '#333333';
  };

  const getLidColor = () => {
    if (isMacBook) return '#c0c0c0';
    if (isAlienware) return '#0f0f1a';
    if (isThinkPad) return '#1a1a1a';
    if (isRazer) return '#050505';
    if (isROG) return '#0f0f0f';
    return '#222222';
  };

  return (
    <group position={[0, -ARM_HEIGHT - 4, 0]} rotation={[0, 0, 0]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[6, 12, 1]} />
        <meshBasicMaterial color={getBodyColor()} />
      </mesh>
      <mesh position={[0, 0, 0.6]}>
        <boxGeometry args={[6, 12, 0.3]} />
        <meshBasicMaterial color={getLidColor()} />
      </mesh>

      {isMacBook && (
        <>
          <mesh position={[0, 0, 0.8]}>
            <boxGeometry args={[2, 2.5, 0.1]} />
            <meshBasicMaterial color="#f5f5f7" />
          </mesh>
          <mesh position={[0.7, 0.6, 0.85]}>
            <boxGeometry args={[0.5, 0.5, 0.1]} />
            <meshBasicMaterial color="#c0c0c0" />
          </mesh>
          <pointLight color="#f5f5f7" intensity={0.4} distance={15} />
        </>
      )}

      {isAlienware && (
        <>
          <mesh position={[0, 1, 0.8]}>
            <boxGeometry args={[2, 1.5, 0.1]} />
            <meshBasicMaterial color="#00ff41" />
          </mesh>
          <mesh position={[0, -0.5, 0.8]}>
            <boxGeometry args={[1.2, 1.5, 0.1]} />
            <meshBasicMaterial color="#00ff41" />
          </mesh>
          <mesh position={[2.8, 0, 0.5]}>
            <boxGeometry args={[0.3, 11, 0.3]} />
            <meshBasicMaterial color="#00ff41" />
          </mesh>
          <mesh position={[-2.8, 0, 0.5]}>
            <boxGeometry args={[0.3, 11, 0.3]} />
            <meshBasicMaterial color="#00ff41" />
          </mesh>
          <pointLight color="#00ff41" intensity={0.6} distance={20} />
        </>
      )}

      {isThinkPad && (
        <>
          <mesh position={[0, 3, 0.8]}>
            <boxGeometry args={[4, 1, 0.1]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <mesh position={[1.5, 3, 0.85]}>
            <boxGeometry args={[0.5, 0.5, 0.1]} />
            <meshBasicMaterial color="#e60012" />
          </mesh>
          <mesh position={[0, -4, 0.8]}>
            <boxGeometry args={[3, 0.8, 0.1]} />
            <meshBasicMaterial color="#e60012" />
          </mesh>
        </>
      )}

      {isRazer && (
        <>
          <mesh position={[0, 0.5, 0.8]}>
            <boxGeometry args={[1.5, 3, 0.1]} />
            <meshBasicMaterial color="#44d62c" />
          </mesh>
          <mesh position={[-0.8, -0.5, 0.8]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.5, 2.5, 0.1]} />
            <meshBasicMaterial color="#44d62c" />
          </mesh>
          <mesh position={[0.8, -0.5, 0.8]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.5, 2.5, 0.1]} />
            <meshBasicMaterial color="#44d62c" />
          </mesh>
          <mesh position={[0, -5.5, 0.5]}>
            <boxGeometry args={[5, 0.3, 0.5]} />
            <meshBasicMaterial color="#ff00ff" />
          </mesh>
          <pointLight color="#44d62c" intensity={0.8} distance={20} />
        </>
      )}

      {isROG && (
        <>
          <mesh position={[0, 0, 0.8]}>
            <boxGeometry args={[2.5, 1.5, 0.1]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          <mesh position={[0.3, 0, 0.85]}>
            <boxGeometry args={[0.8, 0.8, 0.1]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[1.5, 2, 0.78]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.2, 3, 0.1]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          <mesh position={[-1.5, -2, 0.78]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.2, 3, 0.1]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          <pointLight color="#ff0000" intensity={0.6} distance={18} />
        </>
      )}

      {!isMacBook && !isAlienware && !isThinkPad && !isRazer && !isROG && (
        <pointLight color={tierColor} intensity={0.3} distance={15} />
      )}
    </group>
  );
}

// Keyboard visuals - held in LEFT hand
export function TecladoPreview({ itemName, tier }: ItemPreviewProps) {
  const tierColor = tierColors[tier] || '#888888';
  const isCustom = itemName.toLowerCase().includes('custom');
  const isKeychron = itemName.toLowerCase().includes('keychron');
  const isMoonlander = itemName.toLowerCase().includes('moonlander') || itemName.toLowerCase().includes('zsa');
  const isWooting = itemName.toLowerCase().includes('wooting');
  const isDucky = itemName.toLowerCase().includes('ducky');

  if (isMoonlander) {
    return (
      <group position={[0, -ARM_HEIGHT - 2, 0]}>
        <group position={[-3, 0, 0]} rotation={[0, 0, 0.2]}>
          <mesh>
            <boxGeometry args={[5, 8, 1]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {[-2.5, -0.8, 0.8, 2.5].map((y, i) => (
            <mesh key={i} position={[0, y, 0.55]}>
              <boxGeometry args={[4.2, 1.3, 0.25]} />
              <meshBasicMaterial color="#2a2a2a" />
            </mesh>
          ))}
          <mesh position={[1.5, -4.5, 0.9]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[2, 1.5, 0.3]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
        </group>
        <group position={[3, 0, 0]} rotation={[0, 0, -0.2]}>
          <mesh>
            <boxGeometry args={[5, 8, 1]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {[-2.5, -0.8, 0.8, 2.5].map((y, i) => (
            <mesh key={i} position={[0, y, 0.55]}>
              <boxGeometry args={[4.2, 1.3, 0.25]} />
              <meshBasicMaterial color="#2a2a2a" />
            </mesh>
          ))}
          <mesh position={[-1.5, -4.5, 0.9]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[2, 1.5, 0.3]} />
            <meshBasicMaterial color="#00ffff" />
          </mesh>
        </group>
        <pointLight color="#ff00ff" intensity={0.8} distance={20} />
      </group>
    );
  }

  if (isWooting) {
    return (
      <group position={[0, -ARM_HEIGHT - 2, 0]}>
        <mesh>
          <boxGeometry args={[5, 8, 1.2]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        {[-2.5, -0.8, 0.8, 2.5].map((y, i) => (
          <mesh key={i} position={[0, y, 0.65]}>
            <boxGeometry args={[4.2, 1.3, 0.3]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        ))}
        <mesh position={[0, -3.5, 1]}>
          <boxGeometry args={[3, 0.4, 0.15]} />
          <meshBasicMaterial color="#ff6b00" />
        </mesh>
        <pointLight color="#ff6b00" intensity={1} distance={20} />
      </group>
    );
  }

  if (isDucky) {
    return (
      <group position={[0, -ARM_HEIGHT - 2, 0]}>
        <mesh>
          <boxGeometry args={[5, 10, 1]} />
          <meshBasicMaterial color="#f5f5f5" />
        </mesh>
        <mesh position={[0, 3, 0.6]}>
          <boxGeometry args={[4, 1.5, 0.3]} />
          <meshBasicMaterial color="#ffcc00" />
        </mesh>
        <mesh position={[0, 1, 0.6]}>
          <boxGeometry args={[4, 1.5, 0.3]} />
          <meshBasicMaterial color="#ff6699" />
        </mesh>
        <mesh position={[0, -1, 0.6]}>
          <boxGeometry args={[4, 1.5, 0.3]} />
          <meshBasicMaterial color="#66ccff" />
        </mesh>
        <mesh position={[0, -3, 0.6]}>
          <boxGeometry args={[4, 1.5, 0.3]} />
          <meshBasicMaterial color="#99ff66" />
        </mesh>
        <pointLight color="#ffcc00" intensity={0.5} distance={15} />
      </group>
    );
  }

  const baseColor = isCustom ? '#2a2a2a' : isKeychron ? '#3a3a3a' : '#4a4a4a';
  const keyColor = isCustom ? tierColor : isKeychron ? '#5a5a5a' : '#555555';

  return (
    <group position={[0, -ARM_HEIGHT - 2, 0]} rotation={[0, 0, 0]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[5, 10, 1]} />
        <meshBasicMaterial color={baseColor} />
      </mesh>
      {[-3, -1, 1, 3].map((y, i) => (
        <mesh key={i} position={[0, y, 0.6]}>
          <boxGeometry args={[4, 1.5, 0.3]} />
          <meshBasicMaterial color={keyColor} />
        </mesh>
      ))}
      {isCustom && (
        <>
          <mesh position={[2.3, 0, 0.3]}>
            <boxGeometry args={[0.3, 9, 0.3]} />
            <meshBasicMaterial color={tierColor} />
          </mesh>
          <mesh position={[-2.3, 0, 0.3]}>
            <boxGeometry args={[0.3, 9, 0.3]} />
            <meshBasicMaterial color={tierColor} />
          </mesh>
          <pointLight color={tierColor} intensity={0.8} distance={15} />
        </>
      )}
      {isKeychron && (
        <mesh position={[0, -4, 0.6]}>
          <boxGeometry args={[2, 0.8, 0.2]} />
          <meshBasicMaterial color="#ff6600" />
        </mesh>
      )}
    </group>
  );
}

// Headphones visuals - on head
export function FonePreview({ itemName }: ItemPreviewProps) {
  const isAirPods = itemName.toLowerCase().includes('airpods');
  const isSony = itemName.toLowerCase().includes('sony') || itemName.toLowerCase().includes('wh-1000');
  const isBose = itemName.toLowerCase().includes('bose') || itemName.toLowerCase().includes('quietcomfort');
  const isSennheiser = itemName.toLowerCase().includes('sennheiser') || itemName.toLowerCase().includes('hd 800');
  const isBeyerdynamic = itemName.toLowerCase().includes('beyerdynamic') || itemName.toLowerCase().includes('dt 1990');

  if (isAirPods) {
    return (
      <group position={[0, 0, 0]}>
        <group position={[-HEAD_SIZE / 2 - 1, -2, 0]}>
          <mesh>
            <boxGeometry args={[2.2, 3, 2.2]} />
            <meshBasicMaterial color="#f5f5f7" />
          </mesh>
          <mesh position={[0, -2.5, 0]}>
            <boxGeometry args={[1.2, 2.5, 1.2]} />
            <meshBasicMaterial color="#f5f5f7" />
          </mesh>
        </group>
        <group position={[HEAD_SIZE / 2 + 1, -2, 0]}>
          <mesh>
            <boxGeometry args={[2.2, 3, 2.2]} />
            <meshBasicMaterial color="#f5f5f7" />
          </mesh>
          <mesh position={[0, -2.5, 0]}>
            <boxGeometry args={[1.2, 2.5, 1.2]} />
            <meshBasicMaterial color="#f5f5f7" />
          </mesh>
        </group>
        <pointLight color="#ffffff" intensity={0.3} distance={15} />
      </group>
    );
  }

  if (isSony) {
    return (
      <group position={[0, HEAD_SIZE / 2 + 2, 0]}>
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[HEAD_SIZE + 6, 1.5, 2.5]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        <group position={[-HEAD_SIZE / 2 - 3, -2, 0]}>
          <mesh>
            <boxGeometry args={[2.5, 7, 6]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[-1.35, 0, 0]}>
            <boxGeometry args={[0.15, 6, 5]} />
            <meshBasicMaterial color="#b87333" />
          </mesh>
        </group>
        <group position={[HEAD_SIZE / 2 + 3, -2, 0]}>
          <mesh>
            <boxGeometry args={[2.5, 7, 6]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[1.35, 0, 0]}>
            <boxGeometry args={[0.15, 6, 5]} />
            <meshBasicMaterial color="#b87333" />
          </mesh>
        </group>
        <pointLight color="#b87333" intensity={0.4} distance={20} />
      </group>
    );
  }

  if (isBose) {
    return (
      <group position={[0, HEAD_SIZE / 2 + 2, 0]}>
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[HEAD_SIZE + 5, 2, 3]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        <group position={[-HEAD_SIZE / 2 - 2.5, -2, 0]}>
          <mesh>
            <boxGeometry args={[2.5, 7.5, 6.5]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
        </group>
        <group position={[HEAD_SIZE / 2 + 2.5, -2, 0]}>
          <mesh>
            <boxGeometry args={[2.5, 7.5, 6.5]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
        </group>
        <pointLight color="#ffffff" intensity={0.3} distance={20} />
      </group>
    );
  }

  if (isSennheiser) {
    return (
      <group position={[0, HEAD_SIZE / 2 + 2, 0]}>
        <mesh position={[0, 4, 0]}>
          <boxGeometry args={[HEAD_SIZE + 8, 1.5, 2]} />
          <meshBasicMaterial color="#2a2a2a" />
        </mesh>
        <mesh position={[0, 4.8, 0]}>
          <boxGeometry args={[4, 0.3, 1.5]} />
          <meshBasicMaterial color="#c0c0c0" />
        </mesh>
        <group position={[-HEAD_SIZE / 2 - 4, -1, 0]}>
          <mesh>
            <boxGeometry args={[2, 9, 9]} />
            <meshBasicMaterial color="#3a3a3a" />
          </mesh>
        </group>
        <group position={[HEAD_SIZE / 2 + 4, -1, 0]}>
          <mesh>
            <boxGeometry args={[2, 9, 9]} />
            <meshBasicMaterial color="#3a3a3a" />
          </mesh>
        </group>
        <pointLight color="#c0c0c0" intensity={0.4} distance={25} />
      </group>
    );
  }

  if (isBeyerdynamic) {
    return (
      <group position={[0, HEAD_SIZE / 2 + 2, 0]}>
        <mesh position={[0, 3.5, 0]}>
          <boxGeometry args={[HEAD_SIZE + 6, 1, 1.5]} />
          <meshBasicMaterial color="#2a2a2a" />
        </mesh>
        <group position={[-HEAD_SIZE / 2 - 2.5, -1.5, 0]}>
          <mesh>
            <boxGeometry args={[2.5, 7, 7]} />
            <meshBasicMaterial color="#3a3a3a" />
          </mesh>
        </group>
        <group position={[HEAD_SIZE / 2 + 2.5, -1.5, 0]}>
          <mesh>
            <boxGeometry args={[2.5, 7, 7]} />
            <meshBasicMaterial color="#3a3a3a" />
          </mesh>
        </group>
        <mesh position={[-HEAD_SIZE / 2 - 0.5, 1, 0]}>
          <boxGeometry args={[2, 3, 1]} />
          <meshBasicMaterial color="#808080" />
        </mesh>
        <mesh position={[HEAD_SIZE / 2 + 0.5, 1, 0]}>
          <boxGeometry args={[2, 3, 1]} />
          <meshBasicMaterial color="#808080" />
        </mesh>
        <pointLight color="#808080" intensity={0.3} distance={20} />
      </group>
    );
  }

  // Generic headphones
  return (
    <group position={[0, HEAD_SIZE / 2 + 2, 0]}>
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[HEAD_SIZE + 5, 1, 2]} />
        <meshBasicMaterial color="#444444" />
      </mesh>
      <group position={[-HEAD_SIZE / 2 - 2, -2, 0]}>
        <mesh>
          <boxGeometry args={[2, 5, 4]} />
          <meshBasicMaterial color="#3a3a3a" />
        </mesh>
      </group>
      <group position={[HEAD_SIZE / 2 + 2, -2, 0]}>
        <mesh>
          <boxGeometry args={[2, 5, 4]} />
          <meshBasicMaterial color="#3a3a3a" />
        </mesh>
      </group>
    </group>
  );
}

// Shirt/Hoodie visuals - on body
export function CamisetaPreview({ itemName }: ItemPreviewProps) {
  const isHoodie = itemName.toLowerCase().includes('hoodie');
  const isGitHub = itemName.toLowerCase().includes('github');

  const color = isGitHub ? '#24292e' : isHoodie ? '#2d3748' : '#4a5568';

  return (
    <group>
      <mesh position={[0, BODY_HEIGHT / 2, BODY_DEPTH / 2 + 0.6]}>
        <boxGeometry args={[BODY_WIDTH + 1, BODY_HEIGHT, 0.5]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      {isGitHub && (
        <mesh position={[0, BODY_HEIGHT / 2 + 2, BODY_DEPTH / 2 + 1]}>
          <boxGeometry args={[4, 4, 0.2]} />
          <meshBasicMaterial color="#f5f5f5" />
        </mesh>
      )}
      {isHoodie && (
        <mesh position={[0, BODY_HEIGHT + 2, -1]}>
          <boxGeometry args={[8, 5, 4]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}

// Coffee/Energy drink - orbiting around head
export function BebidaPreview({ itemName, tier }: ItemPreviewProps) {
  const tierColor = tierColors[tier] || '#888888';
  const isCafeSoluvel = itemName.toLowerCase().includes('solúvel') || itemName.toLowerCase().includes('soluvel');
  const isEspresso = itemName.toLowerCase().includes('espresso');
  const isColdBrew = itemName.toLowerCase().includes('cold brew');
  const isCoffee = isCafeSoluvel || isEspresso || isColdBrew;
  const isMonster = itemName.toLowerCase().includes('monster');
  const isRedBull = itemName.toLowerCase().includes('red bull');
  const isGFuel = itemName.toLowerCase().includes('g fuel');

  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      <group position={[18, 0, 0]}>
        {isCoffee ? (
          <>
            {isColdBrew ? (
              <>
                <mesh>
                  <boxGeometry args={[3.5, 5, 3.5]} />
                  <meshBasicMaterial color="#87CEEB" transparent opacity={0.4} />
                </mesh>
                <mesh position={[0, -0.5, 0]}>
                  <boxGeometry args={[3, 3.5, 3]} />
                  <meshBasicMaterial color="#1a0f0a" transparent opacity={0.85} />
                </mesh>
                <mesh position={[0.8, 1, 0.8]} rotation={[0.1, 0, 0.1]}>
                  <boxGeometry args={[0.4, 6, 0.4]} />
                  <meshBasicMaterial color="#2d5a27" />
                </mesh>
              </>
            ) : isEspresso ? (
              <>
                <mesh>
                  <boxGeometry args={[2.5, 2.5, 2.5]} />
                  <meshBasicMaterial color="#f5f5f5" />
                </mesh>
                <mesh position={[0, 0.8, 0]}>
                  <boxGeometry args={[2, 0.8, 2]} />
                  <meshBasicMaterial color="#c4a574" />
                </mesh>
                <mesh position={[1.5, 0, 0]}>
                  <boxGeometry args={[0.6, 1.5, 0.6]} />
                  <meshBasicMaterial color="#f5f5f5" />
                </mesh>
                <mesh position={[0, -1.5, 0]}>
                  <boxGeometry args={[4, 0.3, 4]} />
                  <meshBasicMaterial color="#f5f5f5" />
                </mesh>
                <pointLight color="#ffaa66" intensity={0.3} distance={10} />
              </>
            ) : (
              <>
                <mesh>
                  <boxGeometry args={[3, 3.5, 3]} />
                  <meshBasicMaterial color="#d4a574" />
                </mesh>
                <mesh position={[0, 1.2, 0]}>
                  <boxGeometry args={[2.5, 1, 2.5]} />
                  <meshBasicMaterial color="#3d2314" />
                </mesh>
                <mesh position={[1.8, 0.3, 0]}>
                  <boxGeometry args={[0.7, 2, 0.7]} />
                  <meshBasicMaterial color="#d4a574" />
                </mesh>
              </>
            )}
          </>
        ) : isMonster ? (
          <>
            <mesh>
              <boxGeometry args={[2.8, 5.5, 2.8]} />
              <meshBasicMaterial color="#0a0a0a" />
            </mesh>
            <mesh position={[-0.5, 0.5, 1.45]}>
              <boxGeometry args={[0.4, 3, 0.1]} />
              <meshBasicMaterial color="#00ff00" />
            </mesh>
            <mesh position={[0, 0.3, 1.45]} rotation={[0, 0, 0.15]}>
              <boxGeometry args={[0.4, 3.2, 0.1]} />
              <meshBasicMaterial color="#00ff00" />
            </mesh>
            <mesh position={[0.5, 0.5, 1.45]} rotation={[0, 0, -0.1]}>
              <boxGeometry args={[0.4, 2.8, 0.1]} />
              <meshBasicMaterial color="#00ff00" />
            </mesh>
            <pointLight color="#00ff00" intensity={0.5} distance={15} />
          </>
        ) : isRedBull ? (
          <>
            <mesh>
              <boxGeometry args={[2.2, 5, 2.2]} />
              <meshBasicMaterial color="#1e3a6e" />
            </mesh>
            <mesh position={[0, 1.8, 0]}>
              <boxGeometry args={[2.25, 1.5, 2.25]} />
              <meshBasicMaterial color="#c41e3a" />
            </mesh>
            <mesh position={[0, 0.5, 1.15]}>
              <boxGeometry args={[1.5, 1.5, 0.1]} />
              <meshBasicMaterial color="#ffd700" />
            </mesh>
            <pointLight color="#ffd700" intensity={0.4} distance={12} />
          </>
        ) : isGFuel ? (
          <>
            <mesh>
              <boxGeometry args={[3, 5.5, 3]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[0, -0.5, 0]}>
              <boxGeometry args={[2.7, 3.5, 2.7]} />
              <meshBasicMaterial color="#ff00ff" transparent opacity={0.7} />
            </mesh>
            <mesh position={[0, 3, 0]}>
              <boxGeometry args={[3.2, 0.8, 3.2]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
            <pointLight color="#ff00ff" intensity={0.6} distance={15} />
          </>
        ) : (
          <>
            <mesh>
              <boxGeometry args={[2.5, 5, 2.5]} />
              <meshBasicMaterial color={tierColor} />
            </mesh>
            <mesh position={[0, 2.7, 0]}>
              <boxGeometry args={[2, 0.3, 2]} />
              <meshBasicMaterial color="#c0c0c0" />
            </mesh>
            <pointLight color={tierColor} intensity={0.4} distance={15} />
          </>
        )}
      </group>
    </group>
  );
}

// IDE - floating screen
export function IDEPreview({ itemName, tier }: ItemPreviewProps) {
  const tierColor = tierColors[tier] || '#888888';
  const isVSCode = itemName.toLowerCase().includes('vs code');
  const isNeovim = itemName.toLowerCase().includes('neovim') || itemName.toLowerCase().includes('vim');
  const isJetBrains = itemName.toLowerCase().includes('jetbrains') || itemName.toLowerCase().includes('fleet');

  const bgColor = isVSCode ? '#1e1e1e' : isNeovim ? '#1a1b26' : isJetBrains ? '#2b2b2b' : '#282c34';
  const accentColor = isVSCode ? '#007acc' : isNeovim ? '#7aa2f7' : isJetBrains ? '#ff5722' : tierColor;

  return (
    <group position={[25, BODY_HEIGHT / 2 + LEG_HEIGHT + 20, 35]} rotation={[0.1, -0.3, 0]}>
      <mesh>
        <boxGeometry args={[18, 12, 0.4]} />
        <meshBasicMaterial color="#222222" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.25]}>
        <boxGeometry args={[17, 11, 0.1]} />
        <meshBasicMaterial color={bgColor} transparent opacity={0.8} />
      </mesh>
      {[-4, -2, 0, 2, 4].map((y, i) => (
        <mesh key={i} position={[-3 + (i % 3) * 1.5, y, 0.4]}>
          <boxGeometry args={[5 + (i % 2) * 3, 0.5, 0.1]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.75} />
        </mesh>
      ))}
      <pointLight color={accentColor} intensity={0.5} distance={30} />
    </group>
  );
}

// Processor - rotating chip INSIDE the glass head
export function ProcessadorPreview({ itemName, tier }: ItemPreviewProps) {
  const tierColor = tierColors[tier] || '#888888';
  const isIntel = itemName.toLowerCase().includes('intel');
  const isAMD = itemName.toLowerCase().includes('amd') || itemName.toLowerCase().includes('ryzen');
  const isApple = itemName.toLowerCase().includes('apple') || itemName.toLowerCase().includes('m3');

  const chipColor = isIntel ? '#0071c5' : isAMD ? '#ed1c24' : isApple ? '#555555' : '#2d2d2d';
  const glowColor = isIntel ? '#00c7ff' : isAMD ? '#ff6600' : isApple ? '#f5f5f7' : tierColor;

  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.03;
    }
  });

  // Position inside the head (head is at BODY_HEIGHT + HEAD_SIZE/2 from body group)
  // Scale down to fit inside HEAD_SIZE (12 units)
  return (
    <group position={[0, BODY_HEIGHT + HEAD_SIZE / 2, 0]}>
      <group ref={groupRef} scale={0.5}>
        {/* CPU chip */}
        <mesh>
          <boxGeometry args={[8, 1.5, 8]} />
          <meshBasicMaterial color={chipColor} />
        </mesh>
        {/* CPU pins (bottom) */}
        <mesh position={[0, -1, 0]}>
          <boxGeometry args={[7, 0.5, 7]} />
          <meshBasicMaterial color="#c0a060" />
        </mesh>
        {/* Brand marking on top */}
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[4, 0.1, 2]} />
          <meshBasicMaterial color={glowColor} />
        </mesh>
        {/* Glow effect */}
        <pointLight color={glowColor} intensity={0.8} distance={15} />
      </group>
    </group>
  );
}

// Pet - companion floating
export function PetPreview({ itemName, tier }: ItemPreviewProps) {
  const tierColor = tierColors[tier] || '#888888';
  const isRubberDuck = itemName.toLowerCase().includes('rubber') || itemName.toLowerCase().includes('duck');
  const isGatoPreto = itemName.toLowerCase().includes('gato') || itemName.toLowerCase().includes('preto');
  const isOctocat = itemName.toLowerCase().includes('octocat');

  const groupRef = useRef<THREE.Group>(null);
  const bounceRef = useRef(0);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.02;
      bounceRef.current += 0.08;
      groupRef.current.position.y = Math.sin(bounceRef.current) * 2;
    }
  });

  return (
    <group ref={groupRef}>
      <group position={[20, 5, 0]}>
        {isRubberDuck ? (
          <>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[4, 3.5, 3]} />
              <meshBasicMaterial color="#ffd700" />
            </mesh>
            <mesh position={[0, 2.5, 0.5]}>
              <boxGeometry args={[3, 2.5, 2.5]} />
              <meshBasicMaterial color="#ffd700" />
            </mesh>
            <mesh position={[0, 2.2, 1.8]}>
              <boxGeometry args={[1.5, 0.8, 1]} />
              <meshBasicMaterial color="#ff8c00" />
            </mesh>
            <mesh position={[-0.6, 3, 1.3]}>
              <boxGeometry args={[0.5, 0.5, 0.2]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
            <mesh position={[0.6, 3, 1.3]}>
              <boxGeometry args={[0.5, 0.5, 0.2]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
            <pointLight color="#ffd700" intensity={0.4} distance={15} />
          </>
        ) : isGatoPreto ? (
          <>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[3.5, 3, 5]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[0, 2, 2]}>
              <boxGeometry args={[3, 2.5, 2.5]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[-1, 3.5, 2]} rotation={[0, 0, -0.3]}>
              <boxGeometry args={[0.8, 1.2, 0.4]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[1, 3.5, 2]} rotation={[0, 0, 0.3]}>
              <boxGeometry args={[0.8, 1.2, 0.4]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[-0.6, 2.3, 3.3]}>
              <boxGeometry args={[0.7, 0.5, 0.2]} />
              <meshBasicMaterial color="#00ff00" />
            </mesh>
            <mesh position={[0.6, 2.3, 3.3]}>
              <boxGeometry args={[0.7, 0.5, 0.2]} />
              <meshBasicMaterial color="#00ff00" />
            </mesh>
            <pointLight color="#00ff00" intensity={0.3} distance={12} />
          </>
        ) : isOctocat ? (
          <>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[4, 4, 4]} />
              <meshBasicMaterial color="#f5f5f5" />
            </mesh>
            <mesh position={[0, 3, 0]}>
              <boxGeometry args={[4.5, 3.5, 4]} />
              <meshBasicMaterial color="#f5f5f5" />
            </mesh>
            <mesh position={[-1.5, 5, 0]} rotation={[0, 0, -0.2]}>
              <boxGeometry args={[1.2, 1.5, 0.8]} />
              <meshBasicMaterial color="#f5f5f5" />
            </mesh>
            <mesh position={[1.5, 5, 0]} rotation={[0, 0, 0.2]}>
              <boxGeometry args={[1.2, 1.5, 0.8]} />
              <meshBasicMaterial color="#f5f5f5" />
            </mesh>
            <mesh position={[-0.9, 3.5, 2.1]}>
              <boxGeometry args={[1, 1.2, 0.2]} />
              <meshBasicMaterial color="#24292e" />
            </mesh>
            <mesh position={[0.9, 3.5, 2.1]}>
              <boxGeometry args={[1, 1.2, 0.2]} />
              <meshBasicMaterial color="#24292e" />
            </mesh>
            <pointLight color="#ffffff" intensity={0.3} distance={15} />
          </>
        ) : (
          <>
            <mesh>
              <boxGeometry args={[4, 4, 4]} />
              <meshBasicMaterial color={tierColor} />
            </mesh>
            <mesh position={[-0.8, 0.5, 2.1]}>
              <boxGeometry args={[0.8, 0.8, 0.2]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
            <mesh position={[0.8, 0.5, 2.1]}>
              <boxGeometry args={[0.8, 0.8, 0.2]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
            <pointLight color={tierColor} intensity={0.3} distance={15} />
          </>
        )}
      </group>
    </group>
  );
}

// Food - orbiting around head
export function ComidaPreview({ itemName }: ItemPreviewProps) {
  const isMiojo = itemName.toLowerCase().includes('miojo');
  const isPizza = itemName.toLowerCase().includes('pizza');

  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.025;
    }
  });

  return (
    <group ref={groupRef}>
      <group position={[18, 0, 0]}>
        {isMiojo ? (
          <>
            <mesh>
              <boxGeometry args={[3.5, 4.5, 3.5]} />
              <meshBasicMaterial color="#d32f2f" />
            </mesh>
            <mesh position={[0, 1.8, 0]}>
              <boxGeometry args={[3.6, 0.8, 3.6]} />
              <meshBasicMaterial color="#f5f5f5" />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
              <boxGeometry args={[3, 1.2, 3]} />
              <meshBasicMaterial color="#c9a66b" transparent opacity={0.9} />
            </mesh>
            <mesh position={[-0.5, 2, 0.3]}>
              <boxGeometry args={[0.3, 0.8, 2]} />
              <meshBasicMaterial color="#f4d03f" />
            </mesh>
            <mesh position={[1.2, 2.5, 0.5]} rotation={[0.3, 0.2, 0.5]}>
              <boxGeometry args={[0.2, 5, 0.2]} />
              <meshBasicMaterial color="#8b4513" />
            </mesh>
            <pointLight color="#ffaa00" intensity={0.4} distance={12} />
          </>
        ) : isPizza ? (
          <>
            <group rotation={[0.2, 0, 0]}>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[5, 0.6, 4]} />
                <meshBasicMaterial color="#daa520" />
              </mesh>
              <mesh position={[0, 0.2, -2.2]}>
                <boxGeometry args={[5.2, 1, 0.8]} />
                <meshBasicMaterial color="#cd853f" />
              </mesh>
              <mesh position={[0, 0.45, 0.2]}>
                <boxGeometry args={[4.3, 0.15, 3]} />
                <meshBasicMaterial color="#ffd700" />
              </mesh>
              <mesh position={[-1, 0.6, 0.5]}>
                <boxGeometry args={[1, 0.2, 1]} />
                <meshBasicMaterial color="#8b0000" />
              </mesh>
              <mesh position={[1, 0.6, -0.3]}>
                <boxGeometry args={[0.9, 0.2, 0.9]} />
                <meshBasicMaterial color="#8b0000" />
              </mesh>
            </group>
            <pointLight color="#ff6600" intensity={0.3} distance={10} />
          </>
        ) : (
          <>
            <mesh>
              <boxGeometry args={[3, 2.5, 3]} />
              <meshBasicMaterial color="#8b4513" />
            </mesh>
            <mesh position={[0, 1.4, 0]}>
              <boxGeometry args={[2.5, 0.3, 2.5]} />
              <meshBasicMaterial color="#a0522d" />
            </mesh>
          </>
        )}
      </group>
    </group>
  );
}

// Accessory - furniture near character (full detailed version)
export function AcessorioPreview({ itemName, tier }: ItemPreviewProps) {
  const tierColor = tierColors[tier] || '#888888';
  const isMousepad = itemName.toLowerCase().includes('mousepad');
  const isStandingDesk = itemName.toLowerCase().includes('standing') || itemName.toLowerCase().includes('desk');
  const isHermanMiller = itemName.toLowerCase().includes('herman') || itemName.toLowerCase().includes('miller') || itemName.toLowerCase().includes('gaming chair') || itemName.toLowerCase().includes('cadeira');

  const groupRef = useRef<THREE.Group>(null);
  const glowPhaseRef = useRef(0);

  useFrame(() => {
    glowPhaseRef.current += 0.05;
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(glowPhaseRef.current) * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={[0, -20, -25]}>
      {isMousepad ? (
        // RGB Mousepad with glowing mouse on top
        <group scale={0.8}>
          <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <boxGeometry args={[14, 10, 0.4]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <boxGeometry args={[14.5, 10.5, 0.2]} />
            <meshBasicMaterial color="#ff00ff" transparent opacity={0.9} />
          </mesh>
          <mesh position={[6.8, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.6, 9.5, 0.2]} />
            <meshBasicMaterial color="#00ffff" />
          </mesh>
          <mesh position={[-6.8, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.6, 9.5, 0.2]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
          <group position={[2, 1.5, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[3, 2, 5]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[0, 1, -0.5]}>
              <boxGeometry args={[2.8, 1, 4]} />
              <meshBasicMaterial color="#2a2a2a" />
            </mesh>
            <mesh position={[0, 1.6, 0]}>
              <boxGeometry args={[2, 0.3, 3]} />
              <meshBasicMaterial color="#ff00ff" />
            </mesh>
            <mesh position={[0, 1.8, -1.5]}>
              <boxGeometry args={[0.6, 0.6, 1]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
          </group>
          <pointLight color="#ff00ff" intensity={1.5} distance={30} />
          <pointLight color="#00ffff" intensity={1} distance={25} position={[5, 2, 0]} />
        </group>
      ) : isStandingDesk ? (
        // Standing Desk - LARGE
        <group scale={1.2}>
          <mesh position={[0, 20, 0]}>
            <boxGeometry args={[24, 1.5, 12]} />
            <meshBasicMaterial color="#8b5a2b" />
          </mesh>
          <mesh position={[0, 20.8, 0]}>
            <boxGeometry args={[23.5, 0.2, 11.5]} />
            <meshBasicMaterial color="#a0522d" />
          </mesh>
          <mesh position={[0, 19.5, 6]}>
            <boxGeometry args={[24.2, 0.5, 0.5]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[-9, 10, 0]}>
            <boxGeometry args={[2, 20, 8]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
          <mesh position={[9, 10, 0]}>
            <boxGeometry args={[2, 20, 8]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
          <mesh position={[-9, 0.5, 0]}>
            <boxGeometry args={[3, 1, 10]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[9, 0.5, 0]}>
            <boxGeometry args={[3, 1, 10]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[8, 19, 6.5]}>
            <boxGeometry args={[2, 0.8, 0.2]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
          <mesh position={[0, 28, -2]}>
            <boxGeometry args={[16, 10, 0.8]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0, 28, -1.5]}>
            <boxGeometry args={[15, 9, 0.2]} />
            <meshBasicMaterial color="#0066cc" />
          </mesh>
          <mesh position={[0, 22, -1]}>
            <boxGeometry args={[3, 3, 2]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
          <pointLight color="#00ff00" intensity={0.5} distance={35} />
        </group>
      ) : isHermanMiller ? (
        // Gaming Chair - LARGE racing style
        <group scale={1.3}>
          {/* Seat base - bucket style */}
          <mesh position={[0, 8, 0]}>
            <boxGeometry args={[12, 2, 12]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Seat cushion */}
          <mesh position={[0, 9.5, 0]}>
            <boxGeometry args={[11, 2, 11]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          {/* Seat side bolsters */}
          <mesh position={[-5.5, 11, 0]}>
            <boxGeometry args={[2, 4, 10]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[5.5, 11, 0]}>
            <boxGeometry args={[2, 4, 10]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Backrest - tall racing style */}
          <mesh position={[0, 22, -5]}>
            <boxGeometry args={[12, 22, 3]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Backrest red stripe */}
          <mesh position={[0, 22, -3.4]}>
            <boxGeometry args={[4, 18, 0.3]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          {/* Backrest side wings */}
          <mesh position={[-5.5, 20, -4]}>
            <boxGeometry args={[2, 16, 2]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[5.5, 20, -4]}>
            <boxGeometry args={[2, 16, 2]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Headrest */}
          <mesh position={[0, 34, -4.5]}>
            <boxGeometry args={[8, 5, 3]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Headrest pillow */}
          <mesh position={[0, 34, -2.8]}>
            <boxGeometry args={[6, 4, 2]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          {/* Lumbar pillow */}
          <mesh position={[0, 14, -3]}>
            <boxGeometry args={[6, 3, 2]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          {/* Armrests */}
          <mesh position={[-7, 12, 1]}>
            <boxGeometry args={[2, 2, 8]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[7, 12, 1]}>
            <boxGeometry args={[2, 2, 8]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Armrest pads */}
          <mesh position={[-7, 13.2, 1]}>
            <boxGeometry args={[2.5, 0.5, 6]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <mesh position={[7, 13.2, 1]}>
            <boxGeometry args={[2.5, 0.5, 6]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          {/* Gas lift cylinder */}
          <mesh position={[0, 4, 0]}>
            <boxGeometry args={[3, 8, 3]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          {/* Chrome cylinder accent */}
          <mesh position={[0, 2, 0]}>
            <boxGeometry args={[2.5, 2, 2.5]} />
            <meshBasicMaterial color="#c0c0c0" />
          </mesh>
          {/* 5-star base */}
          {[0, 72, 144, 216, 288].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <mesh key={i} position={[Math.sin(rad) * 8, 1, Math.cos(rad) * 8]} rotation={[0, -rad, 0]}>
                <boxGeometry args={[2, 1.5, 10]} />
                <meshBasicMaterial color="#1a1a1a" />
              </mesh>
            );
          })}
          {/* Casters with red accent */}
          {[0, 72, 144, 216, 288].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <group key={`caster-${i}`} position={[Math.sin(rad) * 10, 0, Math.cos(rad) * 10]}>
                <mesh>
                  <boxGeometry args={[2, 2, 2]} />
                  <meshBasicMaterial color="#333333" />
                </mesh>
                <mesh position={[0, 0, 1.1]}>
                  <boxGeometry args={[1.5, 1.5, 0.2]} />
                  <meshBasicMaterial color="#ff0000" />
                </mesh>
              </group>
            );
          })}
          {/* RGB underglow */}
          <pointLight color="#ff0000" intensity={1} distance={30} position={[0, 0, 0]} />
          <pointLight color={tierColor} intensity={0.6} distance={25} position={[0, 20, 0]} />
        </group>
      ) : (
        // Generic accessory
        <>
          <mesh>
            <boxGeometry args={[5, 5, 5]} />
            <meshBasicMaterial color={tierColor} />
          </mesh>
          <pointLight color={tierColor} intensity={0.3} distance={15} />
        </>
      )}
    </group>
  );
}

// Helper function to render all equipped items for a player
export function EquippedItemsRenderer({ equippedItems }: { equippedItems: PlayerItem[] }) {
  if (!equippedItems || equippedItems.length === 0) return null;

  return (
    <>
      {equippedItems.map((playerItem) => {
        const category = playerItem.item.category?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
        const itemName = playerItem.item.name;
        const tier = playerItem.item.tier;

        switch (category) {
          case 'notebook':
            // Rendered in right arm - handled separately
            return null;
          case 'teclado':
            // Rendered in left arm - handled separately
            return null;
          case 'fone':
            // Rendered on head - handled separately
            return null;
          case 'camiseta':
            // Rendered on body - handled separately
            return null;
          case 'cafe':
          case 'energetico':
            return <BebidaPreview key={playerItem.id} itemName={itemName} tier={tier} />;
          case 'comida':
            return <ComidaPreview key={playerItem.id} itemName={itemName} tier={tier} />;
          case 'ide':
            return <IDEPreview key={playerItem.id} itemName={itemName} tier={tier} />;
          case 'processador':
            return <ProcessadorPreview key={playerItem.id} itemName={itemName} tier={tier} />;
          case 'pet':
            return <PetPreview key={playerItem.id} itemName={itemName} tier={tier} />;
          case 'acessorio':
            return <AcessorioPreview key={playerItem.id} itemName={itemName} tier={tier} />;
          default:
            return null;
        }
      })}
    </>
  );
}

// Simple equipped item info from server (without full item details)
export interface SimpleEquippedItem {
  name: string;
  category: string;
  tier: string;
}

// Type that can be either local PlayerItem or server EquippedItemInfo
export type EquippableItem = PlayerItem | SimpleEquippedItem;

// Helper to extract item info from either format
function getItemInfo(item: EquippableItem): { name: string; category: string; tier: string } {
  if ('item' in item) {
    // PlayerItem format (local inventory)
    return { name: item.item.name, category: item.item.category, tier: item.item.tier };
  }
  // SimpleEquippedItem format (server)
  return { name: item.name, category: item.category, tier: item.tier };
}

// Get equipped item by category (works with both formats)
export function getEquippedByCategory(equippedItems: EquippableItem[], category: string): { name: string; category: string; tier: string } | undefined {
  const found = equippedItems.find((item) => {
    const info = getItemInfo(item);
    return info.category?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === category;
  });
  return found ? getItemInfo(found) : undefined;
}
