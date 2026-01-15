import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../stores/gameStore';

interface Stats {
  fps: number;
  frameTime: number;
  minFps: number;
  maxFps: number;
  avgFps: number;
  memory: number | null;
  drawCalls: number;
  triangles: number;
  playerCount: number;
}

// Component that runs inside Canvas to access Three.js renderer
export function PerformanceStats({ onUpdate }: { onUpdate: (stats: Stats) => void }) {
  const { gl } = useThree();
  const players = useGameStore((s) => s.players);

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);
  const minFpsRef = useRef(Infinity);
  const maxFpsRef = useRef(0);

  useFrame(() => {
    frameCountRef.current++;
    const now = performance.now();

    if (now - lastTimeRef.current >= 1000) {
      const fps = Math.round(frameCountRef.current * 1000 / (now - lastTimeRef.current));
      const frameTime = (now - lastTimeRef.current) / frameCountRef.current;

      fpsHistoryRef.current.push(fps);
      if (fpsHistoryRef.current.length > 60) fpsHistoryRef.current.shift();

      minFpsRef.current = Math.min(minFpsRef.current, fps);
      maxFpsRef.current = Math.max(maxFpsRef.current, fps);

      const avgFps = Math.round(
        fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length
      );

      // Memory (Chrome only)
      const memory = (performance as any).memory
        ? Math.round((performance as any).memory.usedJSHeapSize / 1048576)
        : null;

      // Renderer info
      const info = gl.info;

      onUpdate({
        fps,
        frameTime: Math.round(frameTime * 100) / 100,
        minFps: minFpsRef.current,
        maxFps: maxFpsRef.current,
        avgFps,
        memory,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        playerCount: players.size,
      });

      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
  });

  return null;
}

// UI Overlay component (outside Canvas)
export function PerformanceMonitorUI() {
  const [stats, setStats] = useState<Stats>({
    fps: 0,
    frameTime: 0,
    minFps: Infinity,
    maxFps: 0,
    avgFps: 0,
    memory: null,
    drawCalls: 0,
    triangles: 0,
    playerCount: 0,
  });

  // Expose stats updater globally for the Canvas component
  useEffect(() => {
    (window as any).__updatePerfStats = setStats;
    return () => { delete (window as any).__updatePerfStats; };
  }, []);

  const getFpsColor = (fps: number) => {
    if (fps >= 55) return '#22c55e';
    if (fps >= 30) return '#eab308';
    return '#ef4444';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0, 0, 0, 0.6)',
        color: '#fff',
        borderRadius: 6,
        padding: '6px 10px',
        fontFamily: 'monospace',
        fontSize: 11,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span style={{ color: getFpsColor(stats.fps), fontWeight: 'bold' }}>
        {stats.fps} FPS
      </span>
      <span style={{ opacity: 0.5 }}>|</span>
      <span>{stats.playerCount} entities</span>
    </div>
  );
}

// Wrapper to connect Canvas stats to UI
export function PerformanceStatsConnector() {
  const handleUpdate = (stats: Stats) => {
    if ((window as any).__updatePerfStats) {
      (window as any).__updatePerfStats(stats);
    }
  };

  return <PerformanceStats onUpdate={handleUpdate} />;
}
