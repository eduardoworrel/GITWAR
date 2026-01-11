import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/clerk-react';
import { useGameStore, type InterpolatedPlayer, type PlayerItem, type Item } from '../stores/gameStore';
import { getCorReino } from '../three/constants';

const reinoColors: Record<string, string> = {
  Python: '#3776AB',
  JavaScript: '#F7DF1E',
  TypeScript: '#3178C6',
  Java: '#ED8B00',
  CSharp: '#239120',
  Go: '#00ADD8',
  Rust: '#DEA584',
  Ruby: '#CC342D',
  PHP: '#777BB4',
  'C++': '#00599C',
  C: '#555555',
  Swift: '#FA7343',
  Kotlin: '#7F52FF',
  Shell: '#89E051',
  Scala: '#DC322F',
};

const tierColors: Record<string, string> = {
  SS: '#ff00ff',
  S: '#ff4444',
  A: '#ff8800',
  B: '#8855ff',
  C: '#00aaff',
  D: '#00cc66',
  E: '#888888',
  F: '#666666',
};

interface PlayerModalProps {
  player: InterpolatedPlayer;
  onClose: () => void;
}

function StatBar({ label, value, max, color, formula }: { label: string; value: number; max: number; color: string; formula?: string }) {
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const pct = Math.min(100, (value / max) * 100);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!formula) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  };

  return (
    <div
      style={{ marginBottom: '8px', cursor: formula ? 'help' : 'default' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setTooltipPos(null)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>{label}</span>
        <span style={{ fontSize: '10px', fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
      </div>
      {tooltipPos && formula && createPortal(
        <div style={{
          position: 'fixed',
          left: tooltipPos.x,
          top: tooltipPos.y,
          transform: 'translate(-50%, -100%)',
          padding: '6px 10px',
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: '6px',
          fontSize: '9px',
          fontFamily: 'monospace',
          color: '#8b949e',
          whiteSpace: 'nowrap',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
        }}>
          {formula}
        </div>,
        document.body
      )}
    </div>
  );
}

// Character dimensions for preview
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

// Item preview visual components - specific visuals per item name

// Notebook visuals - closed, extending along arm
function NotebookPreview({ itemName, tier }: { itemName: string; tier: string }) {
  const tierColor = tierColors[tier] || '#888888';

  // Determine notebook style based on name
  const isMacBook = itemName.toLowerCase().includes('macbook');
  const isAlienware = itemName.toLowerCase().includes('alienware');
  const isThinkPad = itemName.toLowerCase().includes('thinkpad');
  const isRazer = itemName.toLowerCase().includes('razer') || itemName.toLowerCase().includes('blade');
  const isROG = itemName.toLowerCase().includes('rog') || itemName.toLowerCase().includes('zephyrus') || itemName.toLowerCase().includes('asus');

  // Get body color based on brand
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

  // All notebooks closed, extending along arm direction
  return (
    <group position={[0, -ARM_HEIGHT - 4, 0]} rotation={[0, 0, 0]}>
      {/* Closed laptop body - stretched along arm */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[6, 12, 1]} />
        <meshBasicMaterial color={getBodyColor()} />
      </mesh>
      {/* Top lid */}
      <mesh position={[0, 0, 0.6]}>
        <boxGeometry args={[6, 12, 0.3]} />
        <meshBasicMaterial color={getLidColor()} />
      </mesh>

      {/* MacBook - Apple logo */}
      {isMacBook && (
        <>
          <mesh position={[0, 0, 0.8]}>
            <boxGeometry args={[2, 2.5, 0.1]} />
            <meshBasicMaterial color="#f5f5f7" />
          </mesh>
          {/* Bite mark */}
          <mesh position={[0.7, 0.6, 0.85]}>
            <boxGeometry args={[0.5, 0.5, 0.1]} />
            <meshBasicMaterial color="#c0c0c0" />
          </mesh>
          <pointLight color="#f5f5f7" intensity={0.4} distance={15} />
        </>
      )}

      {/* Alienware - alien head + RGB */}
      {isAlienware && (
        <>
          {/* Alien head shape */}
          <mesh position={[0, 1, 0.8]}>
            <boxGeometry args={[2, 1.5, 0.1]} />
            <meshBasicMaterial color="#00ff41" />
          </mesh>
          <mesh position={[0, -0.5, 0.8]}>
            <boxGeometry args={[1.2, 1.5, 0.1]} />
            <meshBasicMaterial color="#00ff41" />
          </mesh>
          {/* RGB strips on edges */}
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

      {/* ThinkPad - red accent + logo */}
      {isThinkPad && (
        <>
          {/* ThinkPad text area */}
          <mesh position={[0, 3, 0.8]}>
            <boxGeometry args={[4, 1, 0.1]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          {/* Red dot (TrackPoint reference) */}
          <mesh position={[1.5, 3, 0.85]}>
            <boxGeometry args={[0.5, 0.5, 0.1]} />
            <meshBasicMaterial color="#e60012" />
          </mesh>
          {/* Lenovo logo area */}
          <mesh position={[0, -4, 0.8]}>
            <boxGeometry args={[3, 0.8, 0.1]} />
            <meshBasicMaterial color="#e60012" />
          </mesh>
        </>
      )}

      {/* Razer Blade - Triple headed snake + RGB */}
      {isRazer && (
        <>
          {/* Razer logo - 3 snakes */}
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
          {/* RGB chroma strip */}
          <mesh position={[2.8, 0, 0.5]}>
            <boxGeometry args={[0.2, 11, 0.5]} />
            <meshBasicMaterial color="#44d62c" />
          </mesh>
          <mesh position={[-2.8, 0, 0.5]}>
            <boxGeometry args={[0.2, 11, 0.5]} />
            <meshBasicMaterial color="#44d62c" />
          </mesh>
          {/* Bottom RGB accent */}
          <mesh position={[0, -5.5, 0.5]}>
            <boxGeometry args={[5, 0.3, 0.5]} />
            <meshBasicMaterial color="#ff00ff" />
          </mesh>
          <pointLight color="#44d62c" intensity={0.8} distance={20} />
        </>
      )}

      {/* ASUS ROG Zephyrus - ROG eye + slash design */}
      {isROG && (
        <>
          {/* ROG eye logo */}
          <mesh position={[0, 0, 0.8]}>
            <boxGeometry args={[2.5, 1.5, 0.1]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          {/* Eye pupil */}
          <mesh position={[0.3, 0, 0.85]}>
            <boxGeometry args={[0.8, 0.8, 0.1]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Slash lines on lid */}
          <mesh position={[1.5, 2, 0.78]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.2, 3, 0.1]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          <mesh position={[-1.5, -2, 0.78]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.2, 3, 0.1]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          {/* ROG text area */}
          <mesh position={[0, -4, 0.8]}>
            <boxGeometry args={[2.5, 0.6, 0.1]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          {/* Vent details */}
          {[-3, -1, 1, 3].map((y, i) => (
            <mesh key={i} position={[2.5, y, 0.78]}>
              <boxGeometry args={[0.3, 0.5, 0.1]} />
              <meshBasicMaterial color="#333333" />
            </mesh>
          ))}
          <pointLight color="#ff0000" intensity={0.6} distance={18} />
        </>
      )}

      {/* Generic notebook glow */}
      {!isMacBook && !isAlienware && !isThinkPad && !isRazer && !isROG && (
        <pointLight color={tierColor} intensity={0.3} distance={15} />
      )}
    </group>
  );
}

// Keyboard visuals - held in LEFT hand, extending along arm
function TecladoPreview({ itemName, tier }: { itemName: string; tier: string }) {
  const tierColor = tierColors[tier] || '#888888';
  const isCustom = itemName.toLowerCase().includes('custom');
  const isKeychron = itemName.toLowerCase().includes('keychron');
  const isMoonlander = itemName.toLowerCase().includes('moonlander') || itemName.toLowerCase().includes('zsa');
  const isWooting = itemName.toLowerCase().includes('wooting');
  const isDucky = itemName.toLowerCase().includes('ducky');

  // ZSA Moonlander - Split ergonomic keyboard
  if (isMoonlander) {
    return (
      <group position={[0, -ARM_HEIGHT - 2, 0]}>
        {/* Left half */}
        <group position={[-3, 0, 0]} rotation={[0, 0, 0.2]}>
          <mesh>
            <boxGeometry args={[5, 8, 1]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Ortholinear keys */}
          {[-2.5, -0.8, 0.8, 2.5].map((y, i) => (
            <mesh key={i} position={[0, y, 0.55]}>
              <boxGeometry args={[4.2, 1.3, 0.25]} />
              <meshBasicMaterial color="#2a2a2a" />
            </mesh>
          ))}
          {/* Thumb cluster */}
          <mesh position={[1.5, -4.5, 0.5]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[2.5, 2, 0.8]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[1.5, -4.5, 0.9]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[2, 1.5, 0.3]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          {/* RGB strip */}
          <mesh position={[0, 4.2, 0.3]}>
            <boxGeometry args={[5, 0.3, 0.3]} />
            <meshBasicMaterial color="#ff00ff" />
          </mesh>
        </group>
        {/* Right half */}
        <group position={[3, 0, 0]} rotation={[0, 0, -0.2]}>
          <mesh>
            <boxGeometry args={[5, 8, 1]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Ortholinear keys */}
          {[-2.5, -0.8, 0.8, 2.5].map((y, i) => (
            <mesh key={i} position={[0, y, 0.55]}>
              <boxGeometry args={[4.2, 1.3, 0.25]} />
              <meshBasicMaterial color="#2a2a2a" />
            </mesh>
          ))}
          {/* Thumb cluster */}
          <mesh position={[-1.5, -4.5, 0.5]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[2.5, 2, 0.8]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[-1.5, -4.5, 0.9]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[2, 1.5, 0.3]} />
            <meshBasicMaterial color="#00ffff" />
          </mesh>
          {/* RGB strip */}
          <mesh position={[0, 4.2, 0.3]}>
            <boxGeometry args={[5, 0.3, 0.3]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
        </group>
        <pointLight color="#ff00ff" intensity={0.8} distance={20} />
        <pointLight color="#00ffff" intensity={0.8} distance={20} position={[5, 0, 0]} />
      </group>
    );
  }

  // Wooting 60HE - Compact with analog switches
  if (isWooting) {
    return (
      <group position={[0, -ARM_HEIGHT - 2, 0]}>
        {/* 60% compact body */}
        <mesh>
          <boxGeometry args={[5, 8, 1.2]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        {/* Keys with lekker switches look */}
        {[-2.5, -0.8, 0.8, 2.5].map((y, i) => (
          <group key={i}>
            <mesh position={[0, y, 0.65]}>
              <boxGeometry args={[4.2, 1.3, 0.3]} />
              <meshBasicMaterial color="#2a2a2a" />
            </mesh>
            {/* Transparent keycap look */}
            <mesh position={[0, y, 0.85]}>
              <boxGeometry args={[4, 1.1, 0.15]} />
              <meshBasicMaterial color="#3a3a3a" transparent opacity={0.7} />
            </mesh>
          </group>
        ))}
        {/* Wooting logo stripe */}
        <mesh position={[0, -3.5, 1]}>
          <boxGeometry args={[3, 0.4, 0.15]} />
          <meshBasicMaterial color="#ff6b00" />
        </mesh>
        {/* RGB side glow */}
        <mesh position={[2.55, 0, 0]}>
          <boxGeometry args={[0.15, 8, 1]} />
          <meshBasicMaterial color="#ff00ff" />
        </mesh>
        <mesh position={[-2.55, 0, 0]}>
          <boxGeometry args={[0.15, 8, 1]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
        <pointLight color="#ff6b00" intensity={1} distance={20} />
      </group>
    );
  }

  // Ducky One 3 - Hot-swap with colorful keycaps
  if (isDucky) {
    return (
      <group position={[0, -ARM_HEIGHT - 2, 0]}>
        {/* Case */}
        <mesh>
          <boxGeometry args={[5, 10, 1]} />
          <meshBasicMaterial color="#f5f5f5" />
        </mesh>
        {/* Colorful keycap rows */}
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
        {/* Ducky logo */}
        <mesh position={[1.5, -4.5, 0.55]}>
          <boxGeometry args={[1, 0.6, 0.15]} />
          <meshBasicMaterial color="#ffcc00" />
        </mesh>
        {/* Accent enter key */}
        <mesh position={[1.8, 0, 0.65]}>
          <boxGeometry args={[0.8, 2, 0.35]} />
          <meshBasicMaterial color="#ff3366" />
        </mesh>
        <pointLight color="#ffcc00" intensity={0.5} distance={15} />
      </group>
    );
  }

  const baseColor = isCustom ? '#2a2a2a' : isKeychron ? '#3a3a3a' : '#4a4a4a';
  const keyColor = isCustom ? tierColor : isKeychron ? '#5a5a5a' : '#555555';

  return (
    <group position={[0, -ARM_HEIGHT - 2, 0]} rotation={[0, 0, 0]}>
      {/* Keyboard base - vertical along arm */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[5, 10, 1]} />
        <meshBasicMaterial color={baseColor} />
      </mesh>
      {/* Keys (simplified as rows) */}
      {[-3, -1, 1, 3].map((y, i) => (
        <mesh key={i} position={[0, y, 0.6]}>
          <boxGeometry args={[4, 1.5, 0.3]} />
          <meshBasicMaterial color={keyColor} />
        </mesh>
      ))}
      {/* RGB underglow for custom */}
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
      {/* Keychron orange accent */}
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
function FonePreview({ itemName }: { itemName: string; tier: string }) {
  const isAirPods = itemName.toLowerCase().includes('airpods');
  const isSony = itemName.toLowerCase().includes('sony') || itemName.toLowerCase().includes('wh-1000');
  const isBose = itemName.toLowerCase().includes('bose') || itemName.toLowerCase().includes('quietcomfort');
  const isSennheiser = itemName.toLowerCase().includes('sennheiser') || itemName.toLowerCase().includes('hd 800');
  const isBeyerdynamic = itemName.toLowerCase().includes('beyerdynamic') || itemName.toLowerCase().includes('dt 1990');

  if (isAirPods) {
    // AirPods Pro - premium white earbuds with silicone tips
    return (
      <group position={[0, 0, 0]}>
        {/* Left earbud */}
        <group position={[-HEAD_SIZE / 2 - 1, -2, 0]}>
          {/* Main body - rounded */}
          <mesh>
            <boxGeometry args={[2.2, 3, 2.2]} />
            <meshBasicMaterial color="#f5f5f7" />
          </mesh>
          {/* Glossy top */}
          <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[1.8, 0.8, 1.8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Silicone ear tip */}
          <mesh position={[0.8, 0, 0]}>
            <boxGeometry args={[0.8, 2, 1.8]} />
            <meshBasicMaterial color="#e0e0e0" />
          </mesh>
          {/* Black mesh speaker grille */}
          <mesh position={[1.2, 0, 0]}>
            <boxGeometry args={[0.2, 1.5, 1.5]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Stem */}
          <mesh position={[0, -2.5, 0]}>
            <boxGeometry args={[1.2, 2.5, 1.2]} />
            <meshBasicMaterial color="#f5f5f7" />
          </mesh>
          {/* Stem sensor strip */}
          <mesh position={[0, -2.5, 0.65]}>
            <boxGeometry args={[0.8, 2, 0.15]} />
            <meshBasicMaterial color="#e8e8e8" />
          </mesh>
          {/* Black edges */}
          <mesh position={[0, 1.6, 0]}>
            <boxGeometry args={[2.3, 0.12, 2.3]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <mesh position={[0, -3.8, 0]}>
            <boxGeometry args={[1.3, 0.12, 1.3]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
        </group>
        {/* Right earbud */}
        <group position={[HEAD_SIZE / 2 + 1, -2, 0]}>
          {/* Main body */}
          <mesh>
            <boxGeometry args={[2.2, 3, 2.2]} />
            <meshBasicMaterial color="#f5f5f7" />
          </mesh>
          {/* Glossy top */}
          <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[1.8, 0.8, 1.8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Silicone ear tip */}
          <mesh position={[-0.8, 0, 0]}>
            <boxGeometry args={[0.8, 2, 1.8]} />
            <meshBasicMaterial color="#e0e0e0" />
          </mesh>
          {/* Black mesh speaker grille */}
          <mesh position={[-1.2, 0, 0]}>
            <boxGeometry args={[0.2, 1.5, 1.5]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Stem */}
          <mesh position={[0, -2.5, 0]}>
            <boxGeometry args={[1.2, 2.5, 1.2]} />
            <meshBasicMaterial color="#f5f5f7" />
          </mesh>
          {/* Stem sensor strip */}
          <mesh position={[0, -2.5, 0.65]}>
            <boxGeometry args={[0.8, 2, 0.15]} />
            <meshBasicMaterial color="#e8e8e8" />
          </mesh>
          {/* Black edges */}
          <mesh position={[0, 1.6, 0]}>
            <boxGeometry args={[2.3, 0.12, 2.3]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <mesh position={[0, -3.8, 0]}>
            <boxGeometry args={[1.3, 0.12, 1.3]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
        </group>
        {/* Subtle glow */}
        <pointLight color="#ffffff" intensity={0.3} distance={15} />
      </group>
    );
  }

  if (isSony) {
    // Sony WH-1000XM5 - Premium noise cancelling headphones
    return (
      <group position={[0, HEAD_SIZE / 2 + 2, 0]}>
        {/* Headband - slim premium design */}
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[HEAD_SIZE + 6, 1.5, 2.5]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        {/* Headband padding */}
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[HEAD_SIZE + 2, 1, 3]} />
          <meshBasicMaterial color="#2a2a2a" />
        </mesh>
        {/* Headband inner cushion */}
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[HEAD_SIZE, 0.5, 2.5]} />
          <meshBasicMaterial color="#3a3a3a" />
        </mesh>
        {/* Left ear cup - large oval */}
        <group position={[-HEAD_SIZE / 2 - 3, -2, 0]}>
          {/* Outer shell */}
          <mesh>
            <boxGeometry args={[2.5, 7, 6]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Touch panel surface */}
          <mesh position={[-1.3, 0, 0]}>
            <boxGeometry args={[0.2, 5.5, 4.5]} />
            <meshBasicMaterial color="#0a0a0a" />
          </mesh>
          {/* Copper ring accent */}
          <mesh position={[-1.35, 0, 0]}>
            <boxGeometry args={[0.15, 6, 5]} />
            <meshBasicMaterial color="#b87333" />
          </mesh>
          {/* Inner copper detail */}
          <mesh position={[-1.4, 0, 0]}>
            <boxGeometry args={[0.1, 4, 3.5]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Ear cushion */}
          <mesh position={[1, 0, 0]}>
            <boxGeometry args={[1, 6, 5]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
          {/* Cushion inner (soft) */}
          <mesh position={[1.5, 0, 0]}>
            <boxGeometry args={[0.5, 5, 4]} />
            <meshBasicMaterial color="#3a3a3a" />
          </mesh>
          {/* LED indicator */}
          <mesh position={[-1.3, -2.5, -1.5]}>
            <boxGeometry args={[0.15, 0.3, 0.3]} />
            <meshBasicMaterial color="#00aaff" />
          </mesh>
        </group>
        {/* Right ear cup */}
        <group position={[HEAD_SIZE / 2 + 3, -2, 0]}>
          {/* Outer shell */}
          <mesh>
            <boxGeometry args={[2.5, 7, 6]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Touch panel surface */}
          <mesh position={[1.3, 0, 0]}>
            <boxGeometry args={[0.2, 5.5, 4.5]} />
            <meshBasicMaterial color="#0a0a0a" />
          </mesh>
          {/* Copper ring accent */}
          <mesh position={[1.35, 0, 0]}>
            <boxGeometry args={[0.15, 6, 5]} />
            <meshBasicMaterial color="#b87333" />
          </mesh>
          {/* Inner copper detail */}
          <mesh position={[1.4, 0, 0]}>
            <boxGeometry args={[0.1, 4, 3.5]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Ear cushion */}
          <mesh position={[-1, 0, 0]}>
            <boxGeometry args={[1, 6, 5]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
          {/* Cushion inner */}
          <mesh position={[-1.5, 0, 0]}>
            <boxGeometry args={[0.5, 5, 4]} />
            <meshBasicMaterial color="#3a3a3a" />
          </mesh>
          {/* NC/Ambient button */}
          <mesh position={[1.3, 2, 2]}>
            <boxGeometry args={[0.2, 0.8, 0.8]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
        </group>
        {/* Hinge connectors */}
        <mesh position={[-HEAD_SIZE / 2 - 1, 1, 0]}>
          <boxGeometry args={[1.5, 1.5, 2]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[HEAD_SIZE / 2 + 1, 1, 0]}>
          <boxGeometry args={[1.5, 1.5, 2]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        {/* Premium glow */}
        <pointLight color="#b87333" intensity={0.4} distance={20} />
      </group>
    );
  }

  // Bose QuietComfort Ultra - Smooth oval design
  if (isBose) {
    return (
      <group position={[0, HEAD_SIZE / 2 + 2, 0]}>
        {/* Headband - smooth curved */}
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[HEAD_SIZE + 5, 2, 3]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        {/* Headband cushion */}
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[HEAD_SIZE + 3, 1.5, 3.5]} />
          <meshBasicMaterial color="#2a2a2a" />
        </mesh>
        {/* Left ear cup - oval */}
        <group position={[-HEAD_SIZE / 2 - 2.5, -2, 0]}>
          <mesh>
            <boxGeometry args={[2.5, 7.5, 6.5]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Bose logo indent */}
          <mesh position={[-1.3, 1, 0]}>
            <boxGeometry args={[0.15, 2, 1.5]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          {/* Plush cushion */}
          <mesh position={[1, 0, 0]}>
            <boxGeometry args={[1.2, 6.5, 5.5]} />
            <meshBasicMaterial color="#3a3a3a" />
          </mesh>
          {/* Button */}
          <mesh position={[-1.3, -2.5, 2]}>
            <boxGeometry args={[0.2, 1, 0.5]} />
            <meshBasicMaterial color="#444444" />
          </mesh>
        </group>
        {/* Right ear cup */}
        <group position={[HEAD_SIZE / 2 + 2.5, -2, 0]}>
          <mesh>
            <boxGeometry args={[2.5, 7.5, 6.5]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Bose logo indent */}
          <mesh position={[1.3, 1, 0]}>
            <boxGeometry args={[0.15, 2, 1.5]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          {/* Plush cushion */}
          <mesh position={[-1, 0, 0]}>
            <boxGeometry args={[1.2, 6.5, 5.5]} />
            <meshBasicMaterial color="#3a3a3a" />
          </mesh>
        </group>
        <pointLight color="#ffffff" intensity={0.3} distance={20} />
      </group>
    );
  }

  // Sennheiser HD 800 S - Open back audiophile
  if (isSennheiser) {
    return (
      <group position={[0, HEAD_SIZE / 2 + 2, 0]}>
        {/* Wide headband arc */}
        <mesh position={[0, 4, 0]}>
          <boxGeometry args={[HEAD_SIZE + 8, 1.5, 2]} />
          <meshBasicMaterial color="#2a2a2a" />
        </mesh>
        {/* Headband padding */}
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[HEAD_SIZE + 4, 1, 2.5]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        {/* Sennheiser silver accent */}
        <mesh position={[0, 4.8, 0]}>
          <boxGeometry args={[4, 0.3, 1.5]} />
          <meshBasicMaterial color="#c0c0c0" />
        </mesh>
        {/* Left ear cup - large open back */}
        <group position={[-HEAD_SIZE / 2 - 4, -1, 0]}>
          {/* Ring frame */}
          <mesh>
            <boxGeometry args={[2, 9, 9]} />
            <meshBasicMaterial color="#3a3a3a" />
          </mesh>
          {/* Open back grille */}
          <mesh position={[-1, 0, 0]}>
            <boxGeometry args={[0.3, 7, 7]} />
            <meshBasicMaterial color="#1a1a1a" transparent opacity={0.5} />
          </mesh>
          {/* Mesh pattern */}
          {[-2, 0, 2].map((y, i) => (
            <mesh key={i} position={[-1.1, y, 0]}>
              <boxGeometry args={[0.1, 0.3, 6]} />
              <meshBasicMaterial color="#2a2a2a" />
            </mesh>
          ))}
          {/* Velour pad */}
          <mesh position={[0.8, 0, 0]}>
            <boxGeometry args={[1.5, 8, 8]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Inner silver ring */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2.2, 8.5, 8.5]} />
            <meshBasicMaterial color="#4a4a4a" />
          </mesh>
        </group>
        {/* Right ear cup */}
        <group position={[HEAD_SIZE / 2 + 4, -1, 0]}>
          <mesh>
            <boxGeometry args={[2, 9, 9]} />
            <meshBasicMaterial color="#3a3a3a" />
          </mesh>
          <mesh position={[1, 0, 0]}>
            <boxGeometry args={[0.3, 7, 7]} />
            <meshBasicMaterial color="#1a1a1a" transparent opacity={0.5} />
          </mesh>
          {[-2, 0, 2].map((y, i) => (
            <mesh key={i} position={[1.1, y, 0]}>
              <boxGeometry args={[0.1, 0.3, 6]} />
              <meshBasicMaterial color="#2a2a2a" />
            </mesh>
          ))}
          <mesh position={[-0.8, 0, 0]}>
            <boxGeometry args={[1.5, 8, 8]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2.2, 8.5, 8.5]} />
            <meshBasicMaterial color="#4a4a4a" />
          </mesh>
        </group>
        {/* Connectors */}
        <mesh position={[-HEAD_SIZE / 2 - 1, 2, 0]}>
          <boxGeometry args={[2, 2, 1.5]} />
          <meshBasicMaterial color="#2a2a2a" />
        </mesh>
        <mesh position={[HEAD_SIZE / 2 + 1, 2, 0]}>
          <boxGeometry args={[2, 2, 1.5]} />
          <meshBasicMaterial color="#2a2a2a" />
        </mesh>
        <pointLight color="#c0c0c0" intensity={0.4} distance={25} />
      </group>
    );
  }

  // Beyerdynamic DT 1990 - Studio monitor look
  if (isBeyerdynamic) {
    return (
      <group position={[0, HEAD_SIZE / 2 + 2, 0]}>
        {/* Spring steel headband */}
        <mesh position={[0, 3.5, 0]}>
          <boxGeometry args={[HEAD_SIZE + 6, 1, 1.5]} />
          <meshBasicMaterial color="#2a2a2a" />
        </mesh>
        {/* Padding strap */}
        <mesh position={[0, 2.5, 0]}>
          <boxGeometry args={[HEAD_SIZE + 2, 1.5, 2.5]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        {/* Left ear cup - circular */}
        <group position={[-HEAD_SIZE / 2 - 2.5, -1.5, 0]}>
          {/* Metal housing */}
          <mesh>
            <boxGeometry args={[2.5, 7, 7]} />
            <meshBasicMaterial color="#3a3a3a" />
          </mesh>
          {/* Center grille */}
          <mesh position={[-1.3, 0, 0]}>
            <boxGeometry args={[0.2, 5, 5]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Beyerdynamic B logo */}
          <mesh position={[-1.35, 0, 0]}>
            <boxGeometry args={[0.15, 2, 1.5]} />
            <meshBasicMaterial color="#4a4a4a" />
          </mesh>
          {/* Velour pad - thick */}
          <mesh position={[1, 0, 0]}>
            <boxGeometry args={[1.5, 6.5, 6.5]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
          {/* Inner velour */}
          <mesh position={[1.3, 0, 0]}>
            <boxGeometry args={[0.5, 5.5, 5.5]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
        </group>
        {/* Right ear cup */}
        <group position={[HEAD_SIZE / 2 + 2.5, -1.5, 0]}>
          <mesh>
            <boxGeometry args={[2.5, 7, 7]} />
            <meshBasicMaterial color="#3a3a3a" />
          </mesh>
          <mesh position={[1.3, 0, 0]}>
            <boxGeometry args={[0.2, 5, 5]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[1.35, 0, 0]}>
            <boxGeometry args={[0.15, 2, 1.5]} />
            <meshBasicMaterial color="#4a4a4a" />
          </mesh>
          <mesh position={[-1, 0, 0]}>
            <boxGeometry args={[1.5, 6.5, 6.5]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
          <mesh position={[-1.3, 0, 0]}>
            <boxGeometry args={[0.5, 5.5, 5.5]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
        </group>
        {/* Yoke connectors - silver */}
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

  // Generic cheap headphones - visible wires, plastic look
  return (
    <group position={[0, HEAD_SIZE / 2 + 2, 0]}>
      {/* Thin plastic headband */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[HEAD_SIZE + 5, 1, 2]} />
        <meshBasicMaterial color="#444444" />
      </mesh>
      {/* Headband adjustment sliders */}
      <mesh position={[-HEAD_SIZE / 2 - 0.5, 0.5, 0]}>
        <boxGeometry args={[1.5, 4, 1]} />
        <meshBasicMaterial color="#555555" />
      </mesh>
      <mesh position={[HEAD_SIZE / 2 + 0.5, 0.5, 0]}>
        <boxGeometry args={[1.5, 4, 1]} />
        <meshBasicMaterial color="#555555" />
      </mesh>
      {/* Slider marks */}
      {[-0.5, 0.5, 1.5].map((y, i) => (
        <mesh key={`l-${i}`} position={[-HEAD_SIZE / 2 - 0.5, y, 0.55]}>
          <boxGeometry args={[1, 0.2, 0.1]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
      ))}
      {[-0.5, 0.5, 1.5].map((y, i) => (
        <mesh key={`r-${i}`} position={[HEAD_SIZE / 2 + 0.5, y, 0.55]}>
          <boxGeometry args={[1, 0.2, 0.1]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
      ))}
      {/* Left ear cup - small and basic */}
      <group position={[-HEAD_SIZE / 2 - 2, -2, 0]}>
        {/* Plastic shell */}
        <mesh>
          <boxGeometry args={[2, 5, 4]} />
          <meshBasicMaterial color="#3a3a3a" />
        </mesh>
        {/* Foam pad */}
        <mesh position={[1, 0, 0]}>
          <boxGeometry args={[0.8, 4, 3.5]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        {/* Cheap logo circle */}
        <mesh position={[-1.05, 0, 0]}>
          <boxGeometry args={[0.15, 2.5, 2.5]} />
          <meshBasicMaterial color="#4a4a4a" />
        </mesh>
      </group>
      {/* Right ear cup */}
      <group position={[HEAD_SIZE / 2 + 2, -2, 0]}>
        {/* Plastic shell */}
        <mesh>
          <boxGeometry args={[2, 5, 4]} />
          <meshBasicMaterial color="#3a3a3a" />
        </mesh>
        {/* Foam pad */}
        <mesh position={[-1, 0, 0]}>
          <boxGeometry args={[0.8, 4, 3.5]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        {/* Cheap logo circle */}
        <mesh position={[1.05, 0, 0]}>
          <boxGeometry args={[0.15, 2.5, 2.5]} />
          <meshBasicMaterial color="#4a4a4a" />
        </mesh>
      </group>
      {/* Visible cable from left cup */}
      <mesh position={[-HEAD_SIZE / 2 - 2, -5.5, 0]}>
        <boxGeometry args={[0.3, 2, 0.3]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-HEAD_SIZE / 2 - 2, -7, 0.5]}>
        <boxGeometry args={[0.3, 1.5, 0.3]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      {/* 3.5mm jack */}
      <mesh position={[-HEAD_SIZE / 2 - 2, -8, 0.5]}>
        <boxGeometry args={[0.5, 0.8, 0.5]} />
        <meshBasicMaterial color="#666666" />
      </mesh>
    </group>
  );
}

// Shirt/Hoodie visuals - on body
function CamisetaPreview({ itemName }: { itemName: string; tier: string }) {
  const isHoodie = itemName.toLowerCase().includes('hoodie');
  const isGitHub = itemName.toLowerCase().includes('github');

  const color = isGitHub ? '#24292e' : isHoodie ? '#2d3748' : '#4a5568';

  return (
    <group>
      {/* Shirt/hoodie overlay on body */}
      <mesh position={[0, BODY_HEIGHT / 2, BODY_DEPTH / 2 + 0.6]}>
        <boxGeometry args={[BODY_WIDTH + 1, BODY_HEIGHT, 0.5]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      {/* GitHub logo placeholder */}
      {isGitHub && (
        <mesh position={[0, BODY_HEIGHT / 2 + 2, BODY_DEPTH / 2 + 1]}>
          <boxGeometry args={[4, 4, 0.2]} />
          <meshBasicMaterial color="#f5f5f5" />
        </mesh>
      )}
      {/* Hoodie hood */}
      {isHoodie && (
        <mesh position={[0, BODY_HEIGHT + 2, -1]}>
          <boxGeometry args={[8, 5, 4]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}

// Coffee/Energy drink - orbiting around head with detailed visuals
function BebidaPreview({ itemName, tier }: { itemName: string; tier: string }) {
  const tierColor = tierColors[tier] || '#888888';
  const isCafeSoluvel = itemName.toLowerCase().includes('solúvel') || itemName.toLowerCase().includes('soluvel');
  const isEspresso = itemName.toLowerCase().includes('espresso');
  const isColdBrew = itemName.toLowerCase().includes('cold brew');
  const isCoffee = isCafeSoluvel || isEspresso || isColdBrew;
  const isMonster = itemName.toLowerCase().includes('monster');
  const isRedBull = itemName.toLowerCase().includes('red bull');
  const isGFuel = itemName.toLowerCase().includes('g fuel');

  const groupRef = useRef<THREE.Group>(null);
  const steamRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.03;
    }
    // Animate steam
    if (steamRef.current && !isColdBrew) {
      steamRef.current.position.y = 3 + Math.sin(Date.now() * 0.005) * 0.5;
      steamRef.current.rotation.y += 0.05;
    }
  });

  // Position orbiting around head
  return (
    <group ref={groupRef}>
      <group position={[18, 0, 0]}>
        {isCoffee ? (
          // Detailed coffee cup
          <>
            {isColdBrew ? (
              // Cold Brew - transparent cup with ice
              <>
                {/* Clear plastic cup */}
                <mesh>
                  <boxGeometry args={[3.5, 5, 3.5]} />
                  <meshBasicMaterial color="#87CEEB" transparent opacity={0.4} />
                </mesh>
                {/* Cup rim */}
                <mesh position={[0, 2.6, 0]}>
                  <boxGeometry args={[3.8, 0.3, 3.8]} />
                  <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
                </mesh>
                {/* Coffee liquid */}
                <mesh position={[0, -0.5, 0]}>
                  <boxGeometry args={[3, 3.5, 3]} />
                  <meshBasicMaterial color="#1a0f0a" transparent opacity={0.85} />
                </mesh>
                {/* Ice cubes */}
                <mesh position={[-0.6, 1.2, 0.6]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshBasicMaterial color="#e0f0ff" transparent opacity={0.7} />
                </mesh>
                <mesh position={[0.7, 0.8, -0.5]}>
                  <boxGeometry args={[0.9, 1.1, 0.9]} />
                  <meshBasicMaterial color="#e0f0ff" transparent opacity={0.7} />
                </mesh>
                <mesh position={[0, 1.5, 0]}>
                  <boxGeometry args={[0.8, 0.8, 0.8]} />
                  <meshBasicMaterial color="#e0f0ff" transparent opacity={0.7} />
                </mesh>
                {/* Straw */}
                <mesh position={[0.8, 1, 0.8]} rotation={[0.1, 0, 0.1]}>
                  <boxGeometry args={[0.4, 6, 0.4]} />
                  <meshBasicMaterial color="#2d5a27" />
                </mesh>
                {/* "Artesanal" label */}
                <mesh position={[0, 0, 1.8]}>
                  <boxGeometry args={[2.5, 1.2, 0.1]} />
                  <meshBasicMaterial color="#8B4513" />
                </mesh>
              </>
            ) : isEspresso ? (
              // Espresso - small ceramic cup with crema
              <>
                {/* Small cup */}
                <mesh>
                  <boxGeometry args={[2.5, 2.5, 2.5]} />
                  <meshBasicMaterial color="#f5f5f5" />
                </mesh>
                {/* Cup rim */}
                <mesh position={[0, 1.3, 0]}>
                  <boxGeometry args={[2.8, 0.2, 2.8]} />
                  <meshBasicMaterial color="#e8e8e8" />
                </mesh>
                {/* Espresso with crema */}
                <mesh position={[0, 0.8, 0]}>
                  <boxGeometry args={[2, 0.8, 2]} />
                  <meshBasicMaterial color="#c4a574" />
                </mesh>
                <mesh position={[0, 0.2, 0]}>
                  <boxGeometry args={[2, 1, 2]} />
                  <meshBasicMaterial color="#2d1810" />
                </mesh>
                {/* Handle */}
                <mesh position={[1.5, 0, 0]}>
                  <boxGeometry args={[0.6, 1.5, 0.6]} />
                  <meshBasicMaterial color="#f5f5f5" />
                </mesh>
                {/* Saucer */}
                <mesh position={[0, -1.5, 0]}>
                  <boxGeometry args={[4, 0.3, 4]} />
                  <meshBasicMaterial color="#f5f5f5" />
                </mesh>
                {/* Steam */}
                <group ref={steamRef} position={[0, 3, 0]}>
                  <mesh position={[-0.3, 0, 0]}>
                    <boxGeometry args={[0.2, 1.5, 0.2]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
                  </mesh>
                  <mesh position={[0.3, 0.3, 0.2]}>
                    <boxGeometry args={[0.2, 1.2, 0.2]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.25} />
                  </mesh>
                </group>
                <pointLight color="#ffaa66" intensity={0.3} distance={10} />
              </>
            ) : (
              // Café Solúvel - basic mug
              <>
                {/* Mug body */}
                <mesh>
                  <boxGeometry args={[3, 3.5, 3]} />
                  <meshBasicMaterial color="#d4a574" />
                </mesh>
                {/* Mug rim */}
                <mesh position={[0, 1.8, 0]}>
                  <boxGeometry args={[3.3, 0.2, 3.3]} />
                  <meshBasicMaterial color="#c49464" />
                </mesh>
                {/* Coffee */}
                <mesh position={[0, 1.2, 0]}>
                  <boxGeometry args={[2.5, 1, 2.5]} />
                  <meshBasicMaterial color="#3d2314" />
                </mesh>
                {/* Handle */}
                <mesh position={[1.8, 0.3, 0]}>
                  <boxGeometry args={[0.7, 2, 0.7]} />
                  <meshBasicMaterial color="#d4a574" />
                </mesh>
                {/* Steam */}
                <group ref={steamRef} position={[0, 3, 0]}>
                  <mesh>
                    <boxGeometry args={[0.3, 1, 0.3]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.25} />
                  </mesh>
                </group>
              </>
            )}
          </>
        ) : isMonster ? (
          // Monster Energy - detailed can
          <>
            {/* Black can body */}
            <mesh>
              <boxGeometry args={[2.8, 5.5, 2.8]} />
              <meshBasicMaterial color="#0a0a0a" />
            </mesh>
            {/* Green M claw marks */}
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
            {/* Can top */}
            <mesh position={[0, 2.9, 0]}>
              <boxGeometry args={[2.5, 0.3, 2.5]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            {/* Pull tab */}
            <mesh position={[0, 3.1, 0]}>
              <boxGeometry args={[0.8, 0.15, 0.4]} />
              <meshBasicMaterial color="#333333" />
            </mesh>
            {/* Bottom rim */}
            <mesh position={[0, -2.85, 0]}>
              <boxGeometry args={[2.9, 0.2, 2.9]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <pointLight color="#00ff00" intensity={0.5} distance={15} />
          </>
        ) : isRedBull ? (
          // Red Bull - detailed can
          <>
            {/* Blue/silver can body */}
            <mesh>
              <boxGeometry args={[2.2, 5, 2.2]} />
              <meshBasicMaterial color="#1e3a6e" />
            </mesh>
            {/* Red top section */}
            <mesh position={[0, 1.8, 0]}>
              <boxGeometry args={[2.25, 1.5, 2.25]} />
              <meshBasicMaterial color="#c41e3a" />
            </mesh>
            {/* Yellow/gold sun design */}
            <mesh position={[0, 0.5, 1.15]}>
              <boxGeometry args={[1.5, 1.5, 0.1]} />
              <meshBasicMaterial color="#ffd700" />
            </mesh>
            {/* Red bulls silhouette */}
            <mesh position={[-0.4, 0.5, 1.2]}>
              <boxGeometry args={[0.5, 0.8, 0.1]} />
              <meshBasicMaterial color="#c41e3a" />
            </mesh>
            <mesh position={[0.4, 0.5, 1.2]}>
              <boxGeometry args={[0.5, 0.8, 0.1]} />
              <meshBasicMaterial color="#c41e3a" />
            </mesh>
            {/* Can top */}
            <mesh position={[0, 2.65, 0]}>
              <boxGeometry args={[2, 0.25, 2]} />
              <meshBasicMaterial color="#c0c0c0" />
            </mesh>
            {/* Pull tab */}
            <mesh position={[0, 2.85, 0]}>
              <boxGeometry args={[0.6, 0.1, 0.3]} />
              <meshBasicMaterial color="#a0a0a0" />
            </mesh>
            <pointLight color="#ffd700" intensity={0.4} distance={12} />
          </>
        ) : isGFuel ? (
          // G Fuel - shaker cup
          <>
            {/* Shaker body */}
            <mesh>
              <boxGeometry args={[3, 5.5, 3]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            {/* Neon liquid visible */}
            <mesh position={[0, -0.5, 0]}>
              <boxGeometry args={[2.7, 3.5, 2.7]} />
              <meshBasicMaterial color="#ff00ff" transparent opacity={0.7} />
            </mesh>
            {/* Lid */}
            <mesh position={[0, 3, 0]}>
              <boxGeometry args={[3.2, 0.8, 3.2]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
            {/* Flip cap */}
            <mesh position={[0, 3.6, 0.8]}>
              <boxGeometry args={[1.2, 0.5, 1]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
            {/* G logo */}
            <mesh position={[0, 1, 1.55]}>
              <boxGeometry args={[1.5, 1.5, 0.1]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
            <pointLight color="#ff00ff" intensity={0.6} distance={15} />
          </>
        ) : (
          // Generic energy drink
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

// IDE - floating screen, offset to the right
function IDEPreview({ itemName, tier }: { itemName: string; tier: string }) {
  const tierColor = tierColors[tier] || '#888888';
  const isVSCode = itemName.toLowerCase().includes('vs code');
  const isNeovim = itemName.toLowerCase().includes('neovim') || itemName.toLowerCase().includes('vim');
  const isJetBrains = itemName.toLowerCase().includes('jetbrains') || itemName.toLowerCase().includes('fleet');

  const bgColor = isVSCode ? '#1e1e1e' : isNeovim ? '#1a1b26' : isJetBrains ? '#2b2b2b' : '#282c34';
  const accentColor = isVSCode ? '#007acc' : isNeovim ? '#7aa2f7' : isJetBrains ? '#ff5722' : tierColor;

  return (
    <group position={[25, BODY_HEIGHT / 2 + LEG_HEIGHT + 20, 35]} rotation={[0.1, -0.3, 0]}>
      {/* Monitor frame */}
      <mesh>
        <boxGeometry args={[18, 12, 0.4]} />
        <meshBasicMaterial color="#222222" transparent opacity={0.9} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0, 0.25]}>
        <boxGeometry args={[17, 11, 0.1]} />
        <meshBasicMaterial color={bgColor} transparent opacity={0.8} />
      </mesh>
      {/* Code lines */}
      {[-4, -2, 0, 2, 4].map((y, i) => (
        <mesh key={i} position={[-3 + (i % 3) * 1.5, y, 0.4]}>
          <boxGeometry args={[5 + (i % 2) * 3, 0.5, 0.1]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.75} />
        </mesh>
      ))}
      {/* IDE glow */}
      <pointLight color={accentColor} intensity={0.5} distance={30} />
    </group>
  );
}

// Processor - floating chip with glow
function ProcessadorPreview({ itemName, tier }: { itemName: string; tier: string }) {
  const tierColor = tierColors[tier] || '#888888';
  const isIntel = itemName.toLowerCase().includes('intel');
  const isAMD = itemName.toLowerCase().includes('amd') || itemName.toLowerCase().includes('ryzen');
  const isApple = itemName.toLowerCase().includes('apple') || itemName.toLowerCase().includes('m3');

  const chipColor = isIntel ? '#0071c5' : isAMD ? '#ed1c24' : isApple ? '#555555' : '#2d2d2d';
  const glowColor = isIntel ? '#00c7ff' : isAMD ? '#ff6600' : isApple ? '#f5f5f7' : tierColor;

  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.02;
      groupRef.current.position.y = Math.sin(Date.now() * 0.003) * 2;
    }
  });

  return (
    <group ref={groupRef} position={[0, BODY_HEIGHT + LEG_HEIGHT + 20, 0]}>
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
      <pointLight color={glowColor} intensity={1} distance={30} />
    </group>
  );
}

// Pet - companion floating/orbiting near character
function PetPreview({ itemName, tier }: { itemName: string; tier: string }) {
  const tierColor = tierColors[tier] || '#888888';
  const isRubberDuck = itemName.toLowerCase().includes('rubber') || itemName.toLowerCase().includes('duck');
  const isGatoPreto = itemName.toLowerCase().includes('gato') || itemName.toLowerCase().includes('preto');
  const isOctocat = itemName.toLowerCase().includes('octocat');

  const groupRef = useRef<THREE.Group>(null);
  const bounceRef = useRef(0);

  useFrame(() => {
    if (groupRef.current) {
      // Orbit around character
      groupRef.current.rotation.y += 0.02;
      // Bounce animation
      bounceRef.current += 0.08;
      groupRef.current.position.y = Math.sin(bounceRef.current) * 2;
    }
  });

  return (
    <group ref={groupRef}>
      <group position={[20, 5, 0]}>
        {isRubberDuck ? (
          // Rubber Duck - classic yellow debug duck
          <>
            {/* Body */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[4, 3.5, 3]} />
              <meshBasicMaterial color="#ffd700" />
            </mesh>
            {/* Head */}
            <mesh position={[0, 2.5, 0.5]}>
              <boxGeometry args={[3, 2.5, 2.5]} />
              <meshBasicMaterial color="#ffd700" />
            </mesh>
            {/* Beak - orange */}
            <mesh position={[0, 2.2, 1.8]}>
              <boxGeometry args={[1.5, 0.8, 1]} />
              <meshBasicMaterial color="#ff8c00" />
            </mesh>
            {/* Eyes */}
            <mesh position={[-0.6, 3, 1.3]}>
              <boxGeometry args={[0.5, 0.5, 0.2]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
            <mesh position={[0.6, 3, 1.3]}>
              <boxGeometry args={[0.5, 0.5, 0.2]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
            {/* Eye highlights */}
            <mesh position={[-0.5, 3.1, 1.4]}>
              <boxGeometry args={[0.2, 0.2, 0.1]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.7, 3.1, 1.4]}>
              <boxGeometry args={[0.2, 0.2, 0.1]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Tail */}
            <mesh position={[0, 1, -1.8]}>
              <boxGeometry args={[1, 1.5, 0.8]} />
              <meshBasicMaterial color="#ffd700" />
            </mesh>
            {/* Wings */}
            <mesh position={[-2, 0.5, 0]} rotation={[0, 0, 0.3]}>
              <boxGeometry args={[0.5, 2, 1.5]} />
              <meshBasicMaterial color="#ffc300" />
            </mesh>
            <mesh position={[2, 0.5, 0]} rotation={[0, 0, -0.3]}>
              <boxGeometry args={[0.5, 2, 1.5]} />
              <meshBasicMaterial color="#ffc300" />
            </mesh>
            <pointLight color="#ffd700" intensity={0.4} distance={15} />
          </>
        ) : isGatoPreto ? (
          // Black Cat - mysterious companion
          <>
            {/* Body */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[3.5, 3, 5]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            {/* Head */}
            <mesh position={[0, 2, 2]}>
              <boxGeometry args={[3, 2.5, 2.5]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            {/* Ears - triangular approximation */}
            <mesh position={[-1, 3.5, 2]} rotation={[0, 0, -0.3]}>
              <boxGeometry args={[0.8, 1.2, 0.4]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[1, 3.5, 2]} rotation={[0, 0, 0.3]}>
              <boxGeometry args={[0.8, 1.2, 0.4]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            {/* Inner ears - pink */}
            <mesh position={[-1, 3.4, 2.15]} rotation={[0, 0, -0.3]}>
              <boxGeometry args={[0.4, 0.7, 0.15]} />
              <meshBasicMaterial color="#ffb6c1" />
            </mesh>
            <mesh position={[1, 3.4, 2.15]} rotation={[0, 0, 0.3]}>
              <boxGeometry args={[0.4, 0.7, 0.15]} />
              <meshBasicMaterial color="#ffb6c1" />
            </mesh>
            {/* Eyes - glowing green */}
            <mesh position={[-0.6, 2.3, 3.3]}>
              <boxGeometry args={[0.7, 0.5, 0.2]} />
              <meshBasicMaterial color="#00ff00" />
            </mesh>
            <mesh position={[0.6, 2.3, 3.3]}>
              <boxGeometry args={[0.7, 0.5, 0.2]} />
              <meshBasicMaterial color="#00ff00" />
            </mesh>
            {/* Eye pupils - vertical slits */}
            <mesh position={[-0.6, 2.3, 3.4]}>
              <boxGeometry args={[0.15, 0.45, 0.1]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
            <mesh position={[0.6, 2.3, 3.4]}>
              <boxGeometry args={[0.15, 0.45, 0.1]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
            {/* Nose */}
            <mesh position={[0, 1.8, 3.3]}>
              <boxGeometry args={[0.4, 0.3, 0.2]} />
              <meshBasicMaterial color="#ffb6c1" />
            </mesh>
            {/* Tail - curved up */}
            <mesh position={[0, 1.5, -3]}>
              <boxGeometry args={[0.6, 0.6, 2]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[0, 3, -3.5]}>
              <boxGeometry args={[0.6, 2, 0.6]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            {/* Paws */}
            <mesh position={[-1.2, -1.2, 1.5]}>
              <boxGeometry args={[1, 0.8, 1]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[1.2, -1.2, 1.5]}>
              <boxGeometry args={[1, 0.8, 1]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[-1.2, -1.2, -1.5]}>
              <boxGeometry args={[1, 0.8, 1]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[1.2, -1.2, -1.5]}>
              <boxGeometry args={[1, 0.8, 1]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <pointLight color="#00ff00" intensity={0.3} distance={12} />
          </>
        ) : isOctocat ? (
          // Octocat - GitHub mascot
          <>
            {/* Body - octo-like */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[4, 4, 4]} />
              <meshBasicMaterial color="#f5f5f5" />
            </mesh>
            {/* Head */}
            <mesh position={[0, 3, 0]}>
              <boxGeometry args={[4.5, 3.5, 4]} />
              <meshBasicMaterial color="#f5f5f5" />
            </mesh>
            {/* Cat ears */}
            <mesh position={[-1.5, 5, 0]} rotation={[0, 0, -0.2]}>
              <boxGeometry args={[1.2, 1.5, 0.8]} />
              <meshBasicMaterial color="#f5f5f5" />
            </mesh>
            <mesh position={[1.5, 5, 0]} rotation={[0, 0, 0.2]}>
              <boxGeometry args={[1.2, 1.5, 0.8]} />
              <meshBasicMaterial color="#f5f5f5" />
            </mesh>
            {/* Inner ears - pink */}
            <mesh position={[-1.5, 4.9, 0.3]} rotation={[0, 0, -0.2]}>
              <boxGeometry args={[0.6, 0.9, 0.3]} />
              <meshBasicMaterial color="#ffb6c1" />
            </mesh>
            <mesh position={[1.5, 4.9, 0.3]} rotation={[0, 0, 0.2]}>
              <boxGeometry args={[0.6, 0.9, 0.3]} />
              <meshBasicMaterial color="#ffb6c1" />
            </mesh>
            {/* Eyes - big and dark */}
            <mesh position={[-0.9, 3.5, 2.1]}>
              <boxGeometry args={[1, 1.2, 0.2]} />
              <meshBasicMaterial color="#24292e" />
            </mesh>
            <mesh position={[0.9, 3.5, 2.1]}>
              <boxGeometry args={[1, 1.2, 0.2]} />
              <meshBasicMaterial color="#24292e" />
            </mesh>
            {/* Eye highlights */}
            <mesh position={[-0.7, 3.7, 2.2]}>
              <boxGeometry args={[0.3, 0.3, 0.1]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[1.1, 3.7, 2.2]}>
              <boxGeometry args={[0.3, 0.3, 0.1]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Nose */}
            <mesh position={[0, 2.8, 2.1]}>
              <boxGeometry args={[0.5, 0.4, 0.2]} />
              <meshBasicMaterial color="#ffb6c1" />
            </mesh>
            {/* Tentacles - 5 visible */}
            {[-1.5, -0.75, 0, 0.75, 1.5].map((x, i) => (
              <mesh key={i} position={[x, -2.5, i % 2 === 0 ? 0.5 : -0.5]}>
                <boxGeometry args={[0.8, 3, 0.8]} />
                <meshBasicMaterial color="#f5f5f5" />
              </mesh>
            ))}
            {/* Suction cups on tentacles */}
            {[-1.5, 0, 1.5].map((x, i) => (
              <mesh key={`suction-${i}`} position={[x, -3.5, i % 2 === 0 ? 0.9 : -0.9]}>
                <boxGeometry args={[0.4, 0.4, 0.2]} />
                <meshBasicMaterial color="#ffcccc" />
              </mesh>
            ))}
            {/* GitHub purple glow */}
            <pointLight color="#6e5494" intensity={0.5} distance={20} />
          </>
        ) : (
          // Generic pet
          <>
            <mesh>
              <boxGeometry args={[3, 3, 3]} />
              <meshBasicMaterial color={tierColor} />
            </mesh>
            <pointLight color={tierColor} intensity={0.3} distance={15} />
          </>
        )}
      </group>
    </group>
  );
}

// Accessory - furniture/desk items floating near character
function AcessorioPreview({ itemName, tier }: { itemName: string; tier: string }) {
  const tierColor = tierColors[tier] || '#888888';
  const isMousepad = itemName.toLowerCase().includes('mousepad');
  const isStandingDesk = itemName.toLowerCase().includes('standing') || itemName.toLowerCase().includes('desk');
  const isHermanMiller = itemName.toLowerCase().includes('herman') || itemName.toLowerCase().includes('miller');

  const groupRef = useRef<THREE.Group>(null);
  const glowPhaseRef = useRef(0);

  useFrame(() => {
    glowPhaseRef.current += 0.05;
    // Subtle floating animation
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(glowPhaseRef.current) * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={[0, -20, -25]}>
      {isMousepad ? (
        // RGB Mousepad with glowing mouse on top
        <group scale={0.8}>
          {/* Mousepad base - extended gaming pad */}
          <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <boxGeometry args={[14, 10, 0.4]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* RGB edge strips - bright glowing */}
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
          <mesh position={[0, 0.4, 4.8]} rotation={[-Math.PI / 2, 0, 0]}>
            <boxGeometry args={[13, 0.6, 0.2]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          <mesh position={[0, 0.4, -4.8]} rotation={[-Math.PI / 2, 0, 0]}>
            <boxGeometry args={[13, 0.6, 0.2]} />
            <meshBasicMaterial color="#ffff00" />
          </mesh>
          {/* Gaming Mouse on top */}
          <group position={[2, 1.5, 0]}>
            {/* Mouse body - ergonomic shape */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[3, 2, 5]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            {/* Mouse top curve */}
            <mesh position={[0, 1, -0.5]}>
              <boxGeometry args={[2.8, 1, 4]} />
              <meshBasicMaterial color="#2a2a2a" />
            </mesh>
            {/* RGB strip on mouse */}
            <mesh position={[0, 1.6, 0]}>
              <boxGeometry args={[2, 0.3, 3]} />
              <meshBasicMaterial color="#ff00ff" />
            </mesh>
            {/* Scroll wheel */}
            <mesh position={[0, 1.8, -1.5]}>
              <boxGeometry args={[0.6, 0.6, 1]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
            {/* Side buttons */}
            <mesh position={[-1.6, 0.5, -0.5]}>
              <boxGeometry args={[0.2, 0.5, 1.5]} />
              <meshBasicMaterial color="#333333" />
            </mesh>
            {/* Mouse cable */}
            <mesh position={[0, 0.5, -3]}>
              <boxGeometry args={[0.3, 0.3, 2]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
          </group>
          {/* Strong RGB glow */}
          <pointLight color="#ff00ff" intensity={1.5} distance={30} />
          <pointLight color="#00ffff" intensity={1} distance={25} position={[5, 2, 0]} />
        </group>
      ) : isStandingDesk ? (
        // Standing Desk - LARGE
        <group scale={1.2}>
          {/* Desktop surface - wood grain */}
          <mesh position={[0, 20, 0]}>
            <boxGeometry args={[24, 1.5, 12]} />
            <meshBasicMaterial color="#8b5a2b" />
          </mesh>
          {/* Desktop top polish */}
          <mesh position={[0, 20.8, 0]}>
            <boxGeometry args={[23.5, 0.2, 11.5]} />
            <meshBasicMaterial color="#a0522d" />
          </mesh>
          {/* Desktop edge trim */}
          <mesh position={[0, 19.5, 6]}>
            <boxGeometry args={[24.2, 0.5, 0.5]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Left leg frame */}
          <mesh position={[-9, 10, 0]}>
            <boxGeometry args={[2, 20, 8]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
          {/* Right leg frame */}
          <mesh position={[9, 10, 0]}>
            <boxGeometry args={[2, 20, 8]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
          {/* Feet */}
          <mesh position={[-9, 0.5, 0]}>
            <boxGeometry args={[3, 1, 10]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[9, 0.5, 0]}>
            <boxGeometry args={[3, 1, 10]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Height adjustment motor housing */}
          <mesh position={[-9, 15, 4.5]}>
            <boxGeometry args={[1.5, 4, 1.5]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <mesh position={[9, 15, 4.5]}>
            <boxGeometry args={[1.5, 4, 1.5]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          {/* Control panel */}
          <mesh position={[8, 19, 6.2]}>
            <boxGeometry args={[4, 1.5, 0.5]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* LED display */}
          <mesh position={[8, 19, 6.5]}>
            <boxGeometry args={[2, 0.8, 0.2]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
          {/* Monitor on desk */}
          <mesh position={[0, 28, -2]}>
            <boxGeometry args={[16, 10, 0.8]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Monitor screen */}
          <mesh position={[0, 28, -1.5]}>
            <boxGeometry args={[15, 9, 0.2]} />
            <meshBasicMaterial color="#0066cc" />
          </mesh>
          {/* Monitor stand */}
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
          {/* Seat side bolsters left */}
          <mesh position={[-5.5, 11, 0]}>
            <boxGeometry args={[2, 4, 10]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          {/* Seat side bolsters right */}
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

// Food - orbiting around head with detailed visuals
function ComidaPreview({ itemName }: { itemName: string; tier: string }) {
  const isMiojo = itemName.toLowerCase().includes('miojo');
  const isPizza = itemName.toLowerCase().includes('pizza');

  const groupRef = useRef<THREE.Group>(null);
  const steamRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.025;
    }
    // Steam animation for hot foods
    if (steamRef.current) {
      steamRef.current.position.y = 4 + Math.sin(Date.now() * 0.004) * 0.4;
      steamRef.current.rotation.y += 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      <group position={[18, 0, 0]}>
        {isMiojo ? (
          // Detailed Cup Noodles
          <>
            {/* Cup body - red with white rim */}
            <mesh>
              <boxGeometry args={[3.5, 4.5, 3.5]} />
              <meshBasicMaterial color="#d32f2f" />
            </mesh>
            {/* White band at top */}
            <mesh position={[0, 1.8, 0]}>
              <boxGeometry args={[3.6, 0.8, 3.6]} />
              <meshBasicMaterial color="#f5f5f5" />
            </mesh>
            {/* Cup rim */}
            <mesh position={[0, 2.35, 0]}>
              <boxGeometry args={[3.8, 0.2, 3.8]} />
              <meshBasicMaterial color="#e0e0e0" />
            </mesh>
            {/* Broth */}
            <mesh position={[0, 1.5, 0]}>
              <boxGeometry args={[3, 1.2, 3]} />
              <meshBasicMaterial color="#c9a66b" transparent opacity={0.9} />
            </mesh>
            {/* Noodles - multiple strands */}
            <mesh position={[-0.5, 2, 0.3]}>
              <boxGeometry args={[0.3, 0.8, 2]} />
              <meshBasicMaterial color="#f4d03f" />
            </mesh>
            <mesh position={[0.3, 2.1, -0.2]}>
              <boxGeometry args={[0.25, 0.6, 1.8]} />
              <meshBasicMaterial color="#f4d03f" />
            </mesh>
            <mesh position={[0, 1.9, 0.5]}>
              <boxGeometry args={[1.5, 0.2, 0.3]} />
              <meshBasicMaterial color="#f4d03f" />
            </mesh>
            {/* Egg slice */}
            <mesh position={[0.8, 2.2, 0]}>
              <boxGeometry args={[1, 0.3, 1]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.8, 2.35, 0]}>
              <boxGeometry args={[0.5, 0.15, 0.5]} />
              <meshBasicMaterial color="#ffa500" />
            </mesh>
            {/* Green onions */}
            <mesh position={[-0.7, 2.3, -0.5]}>
              <boxGeometry args={[0.3, 0.15, 0.3]} />
              <meshBasicMaterial color="#228b22" />
            </mesh>
            <mesh position={[0.2, 2.25, 0.7]}>
              <boxGeometry args={[0.25, 0.15, 0.25]} />
              <meshBasicMaterial color="#228b22" />
            </mesh>
            {/* Chopsticks */}
            <mesh position={[1.2, 2.5, 0.5]} rotation={[0.3, 0.2, 0.5]}>
              <boxGeometry args={[0.2, 5, 0.2]} />
              <meshBasicMaterial color="#8b4513" />
            </mesh>
            <mesh position={[1.5, 2.3, 0.3]} rotation={[0.25, 0.15, 0.4]}>
              <boxGeometry args={[0.2, 5, 0.2]} />
              <meshBasicMaterial color="#8b4513" />
            </mesh>
            {/* Steam */}
            <group ref={steamRef} position={[0, 4, 0]}>
              <mesh position={[-0.4, 0, 0.2]}>
                <boxGeometry args={[0.2, 1.2, 0.2]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
              </mesh>
              <mesh position={[0.3, 0.2, -0.3]}>
                <boxGeometry args={[0.2, 1, 0.2]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.25} />
              </mesh>
              <mesh position={[0, 0.4, 0.4]}>
                <boxGeometry args={[0.15, 0.8, 0.15]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
              </mesh>
            </group>
            {/* Warm glow */}
            <pointLight color="#ffaa00" intensity={0.4} distance={12} />
          </>
        ) : isPizza ? (
          // Detailed Pizza slice
          <>
            {/* Crust base - triangular shape approximation */}
            <group rotation={[0.2, 0, 0]}>
              {/* Main pizza triangle */}
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[5, 0.6, 4]} />
                <meshBasicMaterial color="#daa520" />
              </mesh>
              {/* Crust edge (thicker back) */}
              <mesh position={[0, 0.2, -2.2]}>
                <boxGeometry args={[5.2, 1, 0.8]} />
                <meshBasicMaterial color="#cd853f" />
              </mesh>
              {/* Sauce layer */}
              <mesh position={[0, 0.35, 0.3]}>
                <boxGeometry args={[4.5, 0.1, 3.2]} />
                <meshBasicMaterial color="#8b0000" />
              </mesh>
              {/* Cheese - melty look with multiple pieces */}
              <mesh position={[0, 0.45, 0.2]}>
                <boxGeometry args={[4.3, 0.15, 3]} />
                <meshBasicMaterial color="#ffd700" />
              </mesh>
              <mesh position={[1.5, 0.5, 0.8]}>
                <boxGeometry args={[1, 0.1, 0.8]} />
                <meshBasicMaterial color="#ffec8b" />
              </mesh>
              <mesh position={[-1.2, 0.48, 0]}>
                <boxGeometry args={[0.8, 0.12, 1]} />
                <meshBasicMaterial color="#ffd700" />
              </mesh>
              {/* Pepperoni slices */}
              <mesh position={[-1, 0.6, 0.5]}>
                <boxGeometry args={[1, 0.2, 1]} />
                <meshBasicMaterial color="#8b0000" />
              </mesh>
              <mesh position={[1, 0.6, -0.3]}>
                <boxGeometry args={[0.9, 0.2, 0.9]} />
                <meshBasicMaterial color="#8b0000" />
              </mesh>
              <mesh position={[0, 0.6, 1]}>
                <boxGeometry args={[0.85, 0.2, 0.85]} />
                <meshBasicMaterial color="#8b0000" />
              </mesh>
              <mesh position={[-0.3, 0.6, -0.8]}>
                <boxGeometry args={[0.8, 0.2, 0.8]} />
                <meshBasicMaterial color="#8b0000" />
              </mesh>
              {/* Basil leaves */}
              <mesh position={[0.5, 0.65, 0.3]}>
                <boxGeometry args={[0.5, 0.08, 0.3]} />
                <meshBasicMaterial color="#228b22" />
              </mesh>
              <mesh position={[-1.5, 0.63, -0.5]}>
                <boxGeometry args={[0.4, 0.08, 0.25]} />
                <meshBasicMaterial color="#228b22" />
              </mesh>
              {/* Oil/grease spots */}
              <mesh position={[0.8, 0.58, 0.6]}>
                <boxGeometry args={[0.3, 0.05, 0.3]} />
                <meshBasicMaterial color="#ff8c00" transparent opacity={0.6} />
              </mesh>
            </group>
            {/* Warm pizza glow */}
            <pointLight color="#ff6600" intensity={0.3} distance={10} />
          </>
        ) : (
          // Generic food item
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

interface PreviewCharacterProps {
  reino: string;
  githubLogin: string;
  estado: string;
  previewItem?: Item | null;
}

function PreviewCharacter({ reino, githubLogin, estado, previewItem }: PreviewCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const walkPhaseRef = useRef(0);

  const color = getCorReino(reino);
  const legColor = new THREE.Color(color).multiplyScalar(0.6).getHex();
  const isWalking = estado === 'walking' || estado === 'moving';
  const isAttacking = estado === 'attacking';
  const isDead = estado === 'dead';

  // Determine which visual to show based on item category
  const itemCategory = previewItem?.category?.toLowerCase() || '';
  const itemTier = previewItem?.tier || 'F';

  // Load avatar texture
  const [avatarTexture, setAvatarTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(
      `https://unavatar.io/github/${githubLogin}?fallback=false`,
      (tex) => {
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        setAvatarTexture(tex);
      }
    );
  }, [githubLogin]);

  // Head materials: glass on sides, avatar on front face only (like Minecraft)
  // Box face order: +X, -X, +Y, -Y, +Z (front), -Z (back)
  const headMaterials = useMemo(() => {
    const glass = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.3,
    });
    const front = avatarTexture
      ? new THREE.MeshBasicMaterial({ map: avatarTexture, side: THREE.DoubleSide })
      : new THREE.MeshBasicMaterial({ color: 0xffdbac, side: THREE.DoubleSide });
    // +X, -X, +Y, -Y, +Z (front=avatar), -Z (back=glass)
    return [glass, glass, glass, glass, front, glass];
  }, [avatarTexture]);

  // Animate based on state
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Death animation
    if (isDead) {
      const targetRotation = -Math.PI / 2;
      groupRef.current.rotation.x += (targetRotation - groupRef.current.rotation.x) * 0.1;
    } else {
      groupRef.current.rotation.x *= 0.9;
    }

    // Walking animation - legs
    if (isWalking && leftLegRef.current && rightLegRef.current) {
      walkPhaseRef.current += delta * 8;
      const swing = Math.sin(walkPhaseRef.current) * 0.8;
      leftLegRef.current.rotation.x = swing;
      rightLegRef.current.rotation.x = -swing;
    } else if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x *= 0.85;
      rightLegRef.current.rotation.x *= 0.85;
    }

    // Attacking animation - right arm
    if (isAttacking && rightArmRef.current) {
      walkPhaseRef.current += delta * 12;
      const swing = Math.sin(walkPhaseRef.current) * 1.2;
      rightArmRef.current.rotation.x = -swing;
    } else if (rightArmRef.current) {
      rightArmRef.current.rotation.x *= 0.85;
    }
  });

  return (
    <group ref={groupRef} position={[0, -20, 0]}>
      {/* Legs with animation */}
      <group position={[0, LEG_HEIGHT, 0]}>
        <group ref={leftLegRef} position={[-LEG_WIDTH / 2 - 1, 0, 0]}>
          <mesh position={[0, -LEG_HEIGHT / 2, 0]}>
            <boxGeometry args={[LEG_WIDTH, LEG_HEIGHT, LEG_DEPTH]} />
            <meshStandardMaterial color={legColor} transparent={isDead} opacity={isDead ? 0.3 : 1} />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[LEG_WIDTH / 2 + 1, 0, 0]}>
          <mesh position={[0, -LEG_HEIGHT / 2, 0]}>
            <boxGeometry args={[LEG_WIDTH, LEG_HEIGHT, LEG_DEPTH]} />
            <meshStandardMaterial color={legColor} transparent={isDead} opacity={isDead ? 0.3 : 1} />
          </mesh>
        </group>
      </group>

      {/* Body */}
      <group position={[0, LEG_HEIGHT, 0]}>
        <mesh position={[0, BODY_HEIGHT / 2, 0]}>
          <boxGeometry args={[BODY_WIDTH, BODY_HEIGHT, BODY_DEPTH]} />
          <meshStandardMaterial color={color} transparent={isDead} opacity={isDead ? 0.3 : 1} />
        </mesh>

        {/* Left Arm - holds keyboard */}
        <group position={[-(BODY_WIDTH / 2 + ARM_WIDTH / 2 + 1), BODY_HEIGHT, 0]}>
          <mesh position={[0, -ARM_HEIGHT / 2, 0]}>
            <boxGeometry args={[ARM_WIDTH, ARM_HEIGHT, ARM_DEPTH]} />
            <meshStandardMaterial color={color} transparent={isDead} opacity={isDead ? 0.3 : 1} />
          </mesh>
          {/* Keyboard in left hand */}
          {itemCategory === 'teclado' && previewItem && (
            <TecladoPreview itemName={previewItem.name} tier={itemTier} />
          )}
        </group>

        {/* Right Arm with animation - holds notebook */}
        <group ref={rightArmRef} position={[BODY_WIDTH / 2 + ARM_WIDTH / 2 + 1, BODY_HEIGHT, 0]}>
          <mesh position={[0, -ARM_HEIGHT / 2, 0]}>
            <boxGeometry args={[ARM_WIDTH, ARM_HEIGHT, ARM_DEPTH]} />
            <meshStandardMaterial color={color} transparent={isDead} opacity={isDead ? 0.3 : 1} />
          </mesh>
          {/* Notebook in right hand */}
          {itemCategory === 'notebook' && previewItem && (
            <NotebookPreview itemName={previewItem.name} tier={itemTier} />
          )}
        </group>

        {/* Head with avatar - glass helmet with face on front only (Minecraft style) */}
        <group position={[0, BODY_HEIGHT + HEAD_SIZE / 2, 0]}>
          <mesh ref={headRef} material={headMaterials}>
            <boxGeometry args={[HEAD_SIZE, HEAD_SIZE, HEAD_SIZE]} />
          </mesh>
          {/* Processor inside the glass head */}
          {itemCategory === 'processador' && previewItem && (
            <ProcessadorPreview itemName={previewItem.name} tier={itemTier} />
          )}
          {/* Headphones preview */}
          {itemCategory === 'fone' && previewItem && (
            <FonePreview itemName={previewItem.name} tier={itemTier} />
          )}
          {/* Orbiting items around head */}
          {(itemCategory === 'café' || itemCategory === 'energético') && previewItem && (
            <BebidaPreview itemName={previewItem.name} tier={itemTier} />
          )}
          {itemCategory === 'comida' && previewItem && (
            <ComidaPreview itemName={previewItem.name} tier={itemTier} />
          )}
        </group>

        {/* Shirt/hoodie preview (on body) */}
        {itemCategory === 'camiseta' && previewItem && (
          <CamisetaPreview itemName={previewItem.name} tier={itemTier} />
        )}
      </group>

      {/* IDE preview (floating screen) */}
      {itemCategory === 'ide' && previewItem && (
        <IDEPreview itemName={previewItem.name} tier={itemTier} />
      )}

      {/* Pet preview (orbiting companion) */}
      {itemCategory === 'pet' && previewItem && (
        <PetPreview itemName={previewItem.name} tier={itemTier} />
      )}

      {/* Accessory preview (furniture near character) */}
      {(itemCategory === 'acessório' || itemCategory === 'acessorio') && previewItem && (
        <AcessorioPreview itemName={previewItem.name} tier={itemTier} />
      )}

      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <circleGeometry args={[10, 16]} />
        <meshBasicMaterial color={0x000000} transparent opacity={isDead ? 0.1 : 0.3} />
      </mesh>
    </group>
  );
}

interface PlayerPreview3DProps {
  reino: string;
  githubLogin: string;
  estado: string;
  previewItem?: Item | null;
}

function PlayerPreview3D({ reino, githubLogin, estado, previewItem }: PlayerPreview3DProps) {
  return (
    <div
      style={{
        width: '180px',
        minHeight: '400px',
        background: 'rgba(0,0,0,0.3)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <Canvas camera={{ position: [85, 65, 85], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={0.8} />
        <PreviewCharacter reino={reino} githubLogin={githubLogin} estado={estado} previewItem={previewItem} />
      </Canvas>
      {/* Preview item name overlay */}
      {previewItem && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 12px',
            background: `${tierColors[previewItem.tier] || '#666'}dd`,
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: 600,
            color: 'white',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            maxWidth: '160px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {previewItem.name}
        </div>
      )}
    </div>
  );
}

type TabType = 'shop' | 'attributes';

export function PlayerModal({ player: initialPlayer, onClose }: PlayerModalProps) {
  const { t } = useTranslation();
  const { isSignedIn, getToken } = useAuth();
  // Get live player data from store (updates in real-time)
  const livePlayer = useGameStore((s) => s.players.get(initialPlayer.id));
  const currentPlayerId = useGameStore((s) => s.currentPlayerId);
  const player = livePlayer || initialPlayer;

  // Item system state from store
  const shopItems = useGameStore((s) => s.shopItems);
  const inventory = useGameStore((s) => s.inventory);
  const inventoryLoading = useGameStore((s) => s.inventoryLoading);
  const setShopItems = useGameStore((s) => s.setShopItems);
  const setInventory = useGameStore((s) => s.setInventory);
  const setInventoryLoading = useGameStore((s) => s.setInventoryLoading);
  const updateInventoryItem = useGameStore((s) => s.updateInventoryItem);

  // Only show shop tabs if user is authenticated AND viewing their own character
  const isOwnPlayer = isSignedIn && player.id === currentPlayerId;

  // Persist active tab in localStorage
  const [activeTab, setActiveTabState] = useState<TabType>(() => {
    const saved = localStorage.getItem('playerModal_activeTab');
    return (saved === 'shop' || saved === 'attributes') ? saved : 'shop';
  });
  const setActiveTab = (tab: TabType) => {
    localStorage.setItem('playerModal_activeTab', tab);
    setActiveTabState(tab);
  };
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<Item | null>(null);
  const addToInventory = useGameStore((s) => s.addToInventory);

  const reinoColor = reinoColors[player.reino] || '#888';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;

  // Fetch shop items and inventory when modal opens
  // Only show loading if we don't have cached data - otherwise fetch silently in background
  useEffect(() => {
    if (!isOwnPlayer) return;

    const hasCachedData = shopItems.length > 0;

    const fetchData = async () => {
      try {
        // Only show loading spinner if we have no cached data
        if (!hasCachedData) {
          setInventoryLoading(true);
        }

        // Fetch shop items
        const shopRes = await fetch('/api/shop/items');
        if (shopRes.ok) {
          const items = await shopRes.json();
          setShopItems(items);
        }

        // Fetch player inventory
        const token = await getToken();
        if (token) {
          const invRes = await fetch('/api/player/inventory', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (invRes.ok) {
            const inv = await invRes.json();
            setInventory(inv);
          }
        }
      } catch (err) {
        console.error('Failed to fetch shop data:', err);
      } finally {
        setInventoryLoading(false);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwnPlayer, getToken]);

  // Category order: head to toe
  const categoryOrder: Record<string, number> = {
    'Fone': 1,        // head
    'Camiseta': 2,    // body
    'Notebook': 3,    // hands
    'Teclado': 4,     // hands
    'Acessório': 5,   // hands (mouse)
    'IDE': 6,         // software
    'Processador': 7, // internal
    'Café': 8,        // consumable
    'Energético': 9,  // consumable
    'Comida': 10,     // consumable
    'Pet': 11,        // companion
  };

  // Tier order for sorting items
  const tierOrder: Record<string, number> = {
    'SS': 1, 'S': 2, 'A': 3, 'B': 4, 'C': 5, 'D': 6, 'E': 7, 'F': 8,
  };

  // Group shop items by category, sorted by body position
  const categories = [...new Set(shopItems.map((i) => i.category))]
    .sort((a, b) => (categoryOrder[a] || 99) - (categoryOrder[b] || 99));

  // Handle equip/unequip
  const handleEquipToggle = useCallback(async (playerItem: PlayerItem) => {
    const token = await getToken();
    if (!token) return;

    setActionLoading(playerItem.id);
    try {
      const endpoint = playerItem.isEquipped
        ? `/api/player/items/${playerItem.id}/unequip`
        : `/api/player/items/${playerItem.id}/equip`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        // If equipping, unequip other items in same category
        if (!playerItem.isEquipped) {
          inventory
            .filter((pi) => pi.item.category === playerItem.item.category && pi.id !== playerItem.id && pi.isEquipped)
            .forEach((pi) => updateInventoryItem(pi.id, { isEquipped: false }));
        }
        updateInventoryItem(playerItem.id, { isEquipped: !playerItem.isEquipped });
      }
    } finally {
      setActionLoading(null);
    }
  }, [getToken, inventory, updateInventoryItem]);

  // Handle acquire item (purchase with gold)
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const handleAcquireItem = useCallback(async (itemId: string) => {
    const token = await getToken();
    if (!token) return;

    setPurchaseError(null);
    setActionLoading(itemId);
    try {
      const res = await fetch(`/api/player/items/acquire?itemId=${itemId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const acquired = await res.json();
        // Find the full item from shopItems
        const item = shopItems.find((i) => i.id === itemId);
        if (item) {
          addToInventory({
            id: acquired.id,
            isEquipped: false,
            acquiredAt: acquired.acquiredAt,
            expiresAt: acquired.expiresAt,
            item,
          });
        }
      } else {
        const errorData = await res.json().catch(() => null);
        if (errorData?.code === 'INSUFFICIENT_GOLD') {
          setPurchaseError(t('errors.insufficientGold', 'Gold insuficiente!'));
          // Clear error after 3 seconds
          setTimeout(() => setPurchaseError(null), 3000);
        }
      }
    } finally {
      setActionLoading(null);
    }
  }, [getToken, shopItems, addToInventory, t]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const hpPct = Math.round((player.hp / player.maxHp) * 100);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          width: isMobile ? '100%' : '720px',
          maxWidth: '95vw',
          maxHeight: '95vh',
          overflow: 'auto',
          fontFamily: "'Inter', system-ui, sans-serif",
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - always visible top right */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            color: 'white',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          ×
        </button>

        {/* Main area: Preview + Content */}
        <div style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
          {/* 3D Character Preview - always visible */}
          <PlayerPreview3D reino={player.reino} githubLogin={player.githubLogin} estado={player.estado || 'idle'} previewItem={previewItem} />

          {/* Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            paddingRight: '50px', // space for close button
            background: `linear-gradient(135deg, ${reinoColor}33 0%, transparent 100%)`,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Avatar */}
          <img
            src={`https://unavatar.io/github/${player.githubLogin}`}
            alt={player.githubLogin}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              border: `2px solid ${reinoColor}`,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>{player.githubLogin}</div>
            <div style={{ fontSize: '12px', color: reinoColor, fontWeight: 500 }}>{player.reino}</div>
          </div>
        </div>

        {/* Tabs for own player */}
        {isOwnPlayer && (
          <div style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            padding: '0 20px',
          }}>
            <button
              onClick={() => setActiveTab('shop')}
              style={{
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'shop' ? `2px solid ${reinoColor}` : '2px solid transparent',
                color: activeTab === 'shop' ? 'white' : 'rgba(255,255,255,0.5)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {t('ui.shop', 'Loja')}
            </button>
            <button
              onClick={() => setActiveTab('attributes')}
              style={{
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'attributes' ? `2px solid ${reinoColor}` : '2px solid transparent',
                color: activeTab === 'attributes' ? 'white' : 'rgba(255,255,255,0.5)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {t('ui.attributes', 'Atributos')}
            </button>
          </div>
        )}

        {/* Content - fixed minHeight to prevent size changes between tabs */}
        <div style={{ padding: '14px 18px', flex: 1, overflow: 'auto', minHeight: '220px' }}>
          {/* Shop tab content (only for own player) */}
          {isOwnPlayer && activeTab === 'shop' ? (
            <div style={{ minHeight: '180px' }}>
              {/* Gold display header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                padding: '8px 12px',
                background: 'rgba(255,215,0,0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255,215,0,0.2)',
              }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                  {t('ui.yourGold', 'Seu Gold')}:
                </span>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#ffd54f',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}>
                  {(player.gold ?? 0).toLocaleString()}
                </span>
              </div>

              {/* Purchase error message */}
              {purchaseError && (
                <div style={{
                  marginBottom: '12px',
                  padding: '8px 12px',
                  background: 'rgba(239,68,68,0.2)',
                  borderRadius: '6px',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  fontSize: '12px',
                  textAlign: 'center',
                }}>
                  {purchaseError}
                </div>
              )}

              {inventoryLoading ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '180px',
                  color: 'rgba(255,255,255,0.5)',
                }}>
                  {t('ui.loading', 'Carregando...')}
                </div>
              ) : (
                <>
                  {/* Items grouped by category */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      maxHeight: '450px',
                      overflowY: 'auto',
                      background: 'rgba(0,0,0,0.15)',
                      borderRadius: '10px',
                      padding: '6px',
                    }}>
                      {categories.map((category, idx) => {
                        const isExpanded = expandedCategory === category;
                        const categoryItems = shopItems
                          .filter((item) => item.category === category)
                          .sort((a, b) => (tierOrder[a.tier] || 99) - (tierOrder[b.tier] || 99));
                        const isLast = idx === categories.length - 1;
                        const categoryIcon = (() => {
                          const cat = category?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
                          if (cat === 'notebook') return '💻';
                          if (cat === 'teclado') return '⌨️';
                          if (cat === 'fone') return '🎧';
                          if (cat === 'cafe') return '☕';
                          if (cat === 'energetico') return '🥤';
                          if (cat === 'comida') return '🍕';
                          if (cat === 'camiseta') return '👕';
                          if (cat === 'ide') return '📝';
                          if (cat === 'processador') return '🔲';
                          if (cat === 'pet') return '🐤';
                          if (cat === 'acessorio') return '🖱️';
                          return '📦';
                        })();
                        return (
                        <div key={category} style={{ position: 'relative' }}>
                          {/* Category header - todo style */}
                          <div
                            onClick={() => setExpandedCategory(isExpanded ? null : category)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '10px 12px',
                              background: isExpanded ? 'rgba(255,255,255,0.08)' : 'transparent',
                              borderRadius: isExpanded ? '8px 8px 0 0' : '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              borderBottom: !isExpanded && !isLast ? '1px solid rgba(255,255,255,0.06)' : 'none',
                            }}
                            onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                            onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                          >
                            {/* Checkbox style indicator */}
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '6px',
                              border: `2px solid ${isExpanded ? reinoColor : 'rgba(255,255,255,0.2)'}`,
                              background: isExpanded ? `${reinoColor}22` : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              transition: 'all 0.2s ease',
                              flexShrink: 0,
                            }}>
                              {categoryIcon}
                            </div>

                            {/* Category name */}
                            <span style={{
                              flex: 1,
                              fontSize: '13px',
                              fontWeight: 600,
                              color: isExpanded ? 'white' : 'rgba(255,255,255,0.7)',
                              transition: 'color 0.2s ease',
                            }}>
                              {category}
                            </span>

                            {/* Item count badge */}
                            <span style={{
                              padding: '2px 8px',
                              fontSize: '10px',
                              fontWeight: 600,
                              background: isExpanded ? reinoColor : 'rgba(255,255,255,0.1)',
                              color: isExpanded ? 'white' : 'rgba(255,255,255,0.5)',
                              borderRadius: '10px',
                              transition: 'all 0.2s ease',
                            }}>
                              {categoryItems.length}
                            </span>

                            {/* Chevron */}
                            <span style={{
                              fontSize: '10px',
                              color: isExpanded ? reinoColor : 'rgba(255,255,255,0.3)',
                              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                              transition: 'all 0.2s ease',
                            }}>▶</span>
                          </div>

                          {/* Expanded items container - nested look */}
                          {isExpanded && (
                          <div style={{
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '0 0 8px 8px',
                            padding: '8px',
                            marginLeft: '10px',
                            borderLeft: `2px solid ${reinoColor}40`,
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {categoryItems.map((item) => {
                                const playerItem = inventory.find(pi => pi.item.id === item.id);
                                const owned = !!playerItem;
                                const isEquipped = playerItem?.isEquipped || false;
                                const isHovered = previewItem?.id === item.id;
                                const tierColor = tierColors[item.tier] || '#666';
                                return (
                                  <div
                                    key={item.id}
                                    onMouseEnter={() => setPreviewItem(item)}
                                    onMouseLeave={() => setPreviewItem(null)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      padding: '8px 10px',
                                      background: isHovered ? 'rgba(255,255,255,0.06)' : 'transparent',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    {/* Tier indicator dot */}
                                    <div style={{
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      background: tierColor,
                                      boxShadow: isHovered ? `0 0 8px ${tierColor}` : 'none',
                                      flexShrink: 0,
                                      transition: 'box-shadow 0.15s ease',
                                    }} />

                                    {/* Item name and tier */}
                                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: isHovered ? 'white' : 'rgba(255,255,255,0.8)',
                                        transition: 'color 0.15s ease',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}>{item.name}</span>
                                      <span style={{
                                        fontSize: '9px',
                                        fontWeight: 700,
                                        color: tierColor,
                                        opacity: 0.9,
                                      }}>{item.tier}</span>
                                      {item.durationMinutes && (
                                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>{item.durationMinutes}m</span>
                                      )}
                                    </div>

                                    {/* Stats preview - compact */}
                                    <div style={{
                                      display: 'flex',
                                      gap: '6px',
                                      fontSize: '9px',
                                      color: 'rgba(255,255,255,0.5)',
                                    }}>
                                      {item.stats.dano !== 0 && <span style={{ color: item.stats.dano > 0 ? '#4ade80' : '#f87171' }}>+{item.stats.dano}D</span>}
                                      {item.stats.hp !== 0 && <span style={{ color: item.stats.hp > 0 ? '#4ade80' : '#f87171' }}>+{item.stats.hp}H</span>}
                                      {item.stats.armadura !== 0 && <span style={{ color: item.stats.armadura > 0 ? '#4ade80' : '#f87171' }}>+{item.stats.armadura}A</span>}
                                    </div>

                                    {/* Action button - Pegar/Equipar/Desequipar */}
                                    {isEquipped ? (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); playerItem && handleEquipToggle(playerItem); }}
                                        disabled={actionLoading === playerItem?.id}
                                        style={{
                                          padding: '4px 10px',
                                          fontSize: '9px',
                                          fontWeight: 600,
                                          background: '#ef444420',
                                          border: '1px solid #ef4444',
                                          borderRadius: '4px',
                                          color: '#ef4444',
                                          cursor: actionLoading === playerItem?.id ? 'wait' : 'pointer',
                                          opacity: actionLoading === playerItem?.id ? 0.5 : 1,
                                          transition: 'all 0.15s ease',
                                        }}
                                      >
                                        {actionLoading === playerItem?.id ? '...' : t('ui.unequip', 'Desequipar')}
                                      </button>
                                    ) : owned ? (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); playerItem && handleEquipToggle(playerItem); }}
                                        disabled={actionLoading === playerItem?.id}
                                        style={{
                                          padding: '4px 10px',
                                          fontSize: '9px',
                                          fontWeight: 600,
                                          background: '#22c55e20',
                                          border: '1px solid #22c55e',
                                          borderRadius: '4px',
                                          color: '#22c55e',
                                          cursor: actionLoading === playerItem?.id ? 'wait' : 'pointer',
                                          opacity: actionLoading === playerItem?.id ? 0.5 : 1,
                                          transition: 'all 0.15s ease',
                                        }}
                                      >
                                        {actionLoading === playerItem?.id ? '...' : t('ui.equip', 'Equipar')}
                                      </button>
                                    ) : (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleAcquireItem(item.id); }}
                                        disabled={actionLoading === item.id || (player.gold ?? 0) < item.price}
                                        style={{
                                          padding: '4px 10px',
                                          fontSize: '9px',
                                          fontWeight: 600,
                                          background: (player.gold ?? 0) < item.price ? 'rgba(100,100,100,0.2)' : '#ffd54f20',
                                          border: `1px solid ${(player.gold ?? 0) < item.price ? 'rgba(100,100,100,0.4)' : '#ffd54f'}`,
                                          borderRadius: '4px',
                                          color: (player.gold ?? 0) < item.price ? 'rgba(255,255,255,0.4)' : '#ffd54f',
                                          cursor: actionLoading === item.id || (player.gold ?? 0) < item.price ? 'not-allowed' : 'pointer',
                                          opacity: actionLoading === item.id ? 0.5 : 1,
                                          transition: 'all 0.15s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                          if ((player.gold ?? 0) >= item.price) {
                                            e.currentTarget.style.background = '#ffd54f30';
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = (player.gold ?? 0) < item.price ? 'rgba(100,100,100,0.2)' : '#ffd54f20';
                                        }}
                                      >
                                        {actionLoading === item.id ? '...' : `${item.price}G`}
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          )}
                        </div>
                      );
                      })}
                    </div>
                </>
              )}
            </div>
          ) : (
            <>
              {/* ELO and W/L - compact */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '12px',
                  padding: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#fbbf24' }}>{player.elo ?? 1000}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>ELO</div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>
                    <span style={{ color: '#22c55e' }}>{player.vitorias ?? 0}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 3px' }}>/</span>
                    <span style={{ color: '#ef4444' }}>{player.derrotas ?? 0}</span>
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>W / L</div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>
                    <span style={{ color: hpPct > 60 ? '#22c55e' : hpPct > 30 ? '#eab308' : '#ef4444' }}>
                      {player.hp}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>/{player.maxHp}</span>
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>HP</div>
                </div>
              </div>

              {/* Combat Stats with formula tooltips */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                <StatBar label={t('stats.damage')} value={player.dano ?? 20} max={100} color="#ef4444" formula="30 + (commits/50) + (commits30d×2) + (stars/5) + (forks×3)" />
                <StatBar label={t('stats.armor')} value={player.armadura ?? 10} max={100} color="#3b82f6" formula="5 + (issues×0.5) + (reviews×0.8) + (commits/100)" />
                <StatBar label={t('stats.critChance')} value={player.critico ?? 10} max={100} color="#f59e0b" formula="5 + (commits/200) + (merged×20) + (avgStars×3)" />
                <StatBar label={t('stats.evasion')} value={player.evasao ?? 5} max={100} color="#22c55e" formula="5 + (repos/10) + langs + orgs + (followers/500)" />
                <StatBar label={t('stats.attackSpeed')} value={player.velocidadeAtaque ?? 50} max={100} color="#8b5cf6" formula="20 + (commits/80) + (commits7d×1.5)" />
                <StatBar label={t('stats.moveSpeed')} value={player.velocidadeMovimento ?? 50} max={100} color="#06b6d4" formula="(repos×2 + languages×5) ×2" />
              </div>
            </>
          )}
        </div>
          </div>
        </div>

        {/* Footer - full width */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <a
            href={`https://github.com/${player.githubLogin}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
            }}
          >
            {t('ui.viewOnGithub')} →
          </a>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
            {t('ui.pressEscClose')}
          </div>
        </div>
      </div>
    </div>
  );
}
