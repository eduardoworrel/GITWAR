import { useMemo } from 'react';
import * as THREE from 'three';

interface HealthBarProps {
  hp: number;
  maxHp: number;
  isPlayer?: boolean;
  alwaysOnTop?: boolean;
}

const BAR_WIDTH = 20;
const BAR_HEIGHT = 2;
const BAR_DEPTH = 0.5;

export function HealthBar({
  hp,
  maxHp,
  isPlayer: _isPlayer = true,
  alwaysOnTop = false,
}: HealthBarProps) {
  const healthPercentage = Math.max(0, Math.min(1, hp / maxHp));

  const barColor = useMemo(() => {
    const hpPct = healthPercentage * 100;
    if (hpPct > 60) return 0x238636; // GitHub green
    if (hpPct > 30) return 0xd29922; // GitHub orange
    return 0xf85149; // GitHub red
  }, [healthPercentage]);

  const healthWidth = BAR_WIDTH * healthPercentage;
  const healthOffset = (healthWidth - BAR_WIDTH) / 2;

  return (
    <group>
      {/* Background bar */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[BAR_WIDTH, BAR_HEIGHT, BAR_DEPTH]} />
        <meshBasicMaterial color={0x21262d} depthTest={!alwaysOnTop} depthWrite={!alwaysOnTop} />
      </mesh>

      {/* Health fill */}
      {healthPercentage > 0 && (
        <mesh position={[healthOffset, 0, 0.1]}>
          <boxGeometry args={[healthWidth, BAR_HEIGHT - 0.5, BAR_DEPTH]} />
          <meshBasicMaterial color={barColor} depthTest={!alwaysOnTop} depthWrite={!alwaysOnTop} />
        </mesh>
      )}

      {/* Border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(BAR_WIDTH + 0.5, BAR_HEIGHT + 0.5, BAR_DEPTH)]} />
        <lineBasicMaterial color={0x30363d} depthTest={!alwaysOnTop} depthWrite={!alwaysOnTop} />
      </lineSegments>
    </group>
  );
}
