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
  const [visible, setVisible] = useState(false);
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

  const logSnapshot = () => {
    console.log('📊 Performance Snapshot:', {
      ...stats,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <>
      {/* Toggle button - always visible */}
      <button
        onClick={() => setVisible((v) => !v)}
        style={{
          position: 'fixed',
          top: 10,
          left: 10,
          background: visible ? '#7c3aed' : 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '8px 12px',
          fontFamily: 'monospace',
          fontSize: 12,
          cursor: 'pointer',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ color: getFpsColor(stats.fps), fontWeight: 'bold' }}>
          {stats.fps} FPS
        </span>
        <span style={{ opacity: 0.7 }}>|</span>
        <span>{stats.playerCount} players</span>
      </button>

      {/* Expanded stats panel */}
      {visible && (
        <div
          style={{
            position: 'fixed',
            top: 50,
            left: 10,
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: 8,
            fontFamily: 'monospace',
            fontSize: 13,
            zIndex: 99998,
            minWidth: 200,
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#a78bfa' }}>
            Performance Details
          </div>

          <div style={{ color: getFpsColor(stats.fps), fontSize: 24, fontWeight: 'bold' }}>
            {stats.fps} FPS
          </div>

          <div style={{ marginTop: 8, color: '#9ca3af', fontSize: 12 }}>
            <div>Frame Time: {stats.frameTime}ms</div>
            <div>Min: {stats.minFps === Infinity ? '-' : stats.minFps} | Avg: {stats.avgFps} | Max: {stats.maxFps}</div>
          </div>

          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #333' }}>
            <div>Players: {stats.playerCount}</div>
            <div>Draw Calls: {stats.drawCalls}</div>
            <div>Triangles: {(stats.triangles / 1000).toFixed(1)}K</div>
            {stats.memory && <div>Memory: {stats.memory}MB</div>}
          </div>

          <button
            onClick={logSnapshot}
            style={{
              marginTop: 10,
              background: '#374151',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: 11,
              width: '100%',
            }}
          >
            Log to Console
          </button>
        </div>
      )}
    </>
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
