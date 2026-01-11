import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';

interface KillEntry {
  id: string;
  killerName: string;
  victimName: string;
  timestamp: number;
}

const MAX_ENTRIES = 5;
const ENTRY_DURATION_MS = 8000; // 8 seconds

// Monster names to filter out (original + all language error monsters)
const MONSTER_NAMES = [
  // Original monsters
  'Bug',
  'AI Hallucination',
  'Manager',
  'Deploy Final Expediente',
  'Unexplained Bug',
  // JavaScript
  'undefined',
  'NaN',
  'Callback Hell',
  // Python
  'IndentationError',
  'NoneType',
  'ImportError',
  // Java
  'NullPointerException',
  'ClassNotFoundException',
  'OutOfMemoryError',
  // C#
  'NullReferenceException',
  'StackOverflowException',
  'InvalidCastException',
  // C/C++
  'Segmentation Fault',
  'Stack Overflow',
  'Memory Leak',
  // TypeScript
  'Type Error',
  'any',
  'readonly',
  // PHP
  'T_PAAMAYIM_NEKUDOTAYIM',
  'Fatal Error',
  'Undefined Index',
  // Go
  'nil panic',
  'Deadlock',
  'Import Cycle',
  // Rust
  'Borrow Checker',
  'panic!',
  'Lifetime Error',
  // Ruby
  'NoMethodError',
  'LoadError',
  'SyntaxError',
  // Swift
  'found nil',
  'Force Unwrap',
  'Index out of range',
  // Kotlin
  'KotlinNullPointerException',
  'ClassCastException',
  'UninitializedPropertyAccess',
  // Scala
  'MatchError',
  'AbstractMethodError',
  'StackOverflowError',
  // R
  'Error in eval',
  'object not found',
  'subscript out of bounds',
  // SQL
  'Syntax Error',
  'Connection Timeout',
  // Bash
  'command not found',
  'Permission denied',
  'core dumped',
  // Perl
  'uninitialized value',
  'syntax error',
  "Can't locate",
  // Lua
  'attempt to index nil',
  'bad argument',
  'stack overflow',
  // Dart
  'Null check on null',
  'RangeError',
  'NoSuchMethodError',
  // Elixir
  'FunctionClauseError',
  'ArgumentError',
  'KeyError',
];

export function Killfeed() {
  const combatEvents = useGameStore((s) => s.combatEvents);
  const [entries, setEntries] = useState<KillEntry[]>([]);

  // Process kill events from combat events (only player vs player)
  useEffect(() => {
    const killEvents = combatEvents.filter(
      (e) =>
        e.type === 'kill' &&
        !MONSTER_NAMES.includes(e.attackerName) &&
        !MONSTER_NAMES.includes(e.targetName)
    );

    // Convert to kill entries
    const newEntries: KillEntry[] = killEvents.map((e) => ({
      id: e.id,
      killerName: e.attackerName,
      victimName: e.targetName,
      timestamp: e.createdAt,
    }));

    // Merge with existing entries, avoiding duplicates
    setEntries((prev) => {
      const existingIds = new Set(prev.map((e) => e.id));
      const uniqueNew = newEntries.filter((e) => !existingIds.has(e.id));
      const merged = [...prev, ...uniqueNew];
      // Keep only recent entries
      const now = Date.now();
      return merged
        .filter((e) => now - e.timestamp < ENTRY_DURATION_MS)
        .slice(-MAX_ENTRIES);
    });
  }, [combatEvents]);

  // Cleanup old entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setEntries((prev) =>
        prev.filter((e) => now - e.timestamp < ENTRY_DURATION_MS)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '270px', // Below PlayerHUD (175px + ~80px height + 15px gap)
        left: '16px',
        width: '200px',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '8px',
        zIndex: 999,
        pointerEvents: 'none',
      }}
    >
      {entries.map((entry, index) => {
        const age = Date.now() - entry.timestamp;
        const opacity = Math.max(0.3, 1 - age / ENTRY_DURATION_MS);

        return (
          <div
            key={entry.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 0',
              fontSize: '10px',
              fontFamily: "'Inter', system-ui, sans-serif",
              color: 'rgba(255, 255, 255, 0.9)',
              opacity,
              transition: 'opacity 0.3s ease',
              borderBottom:
                index < entries.length - 1
                  ? '1px solid rgba(255, 255, 255, 0.05)'
                  : 'none',
            }}
          >
            <span
              style={{
                color: '#ef4444',
                fontWeight: 600,
                maxWidth: '70px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={entry.killerName}
            >
              {entry.killerName}
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '8px' }}>
              killed
            </span>
            <span
              style={{
                color: '#94a3b8',
                fontWeight: 500,
                maxWidth: '70px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={entry.victimName}
            >
              {entry.victimName}
            </span>
          </div>
        );
      })}
    </div>
  );
}
