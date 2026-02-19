# GitWar

A 3D browser MMO where you **program your character's behavior in JavaScript** and watch it fight in real-time. Characters auto-battle in a shared world — your code decides the strategy.

**Live:** [gitwar.eduardoworrel.com](https://gitwar.eduardoworrel.com)

## Player Scripting

Each player writes a JavaScript `onTick()` function that runs server-side every game tick (50ms). The script controls movement, targeting, and combat decisions through a sandboxed API.

```js
function onTick() {
  // During monster events, prioritize PvE
  if (event.active) {
    const monster = getNearestMonster();
    if (monster) {
      if (isInAttackRange(monster)) attack(monster);
      else moveToEntity(monster);
      return;
    }
  }

  // Low HP? Run.
  if (self.Hp < self.MaxHp * 0.3) {
    flee();
    return;
  }

  // Find weakest nearby enemy
  const targets = enemies.filter(e => e.Hp < self.Hp);
  const weakest = targets.sort((a, b) => a.Hp - b.Hp)[0];

  if (weakest) {
    if (isInAttackRange(weakest)) attack(weakest);
    else moveToEntity(weakest);
  } else {
    attackNearest();
  }
}
```

### Script API

| Context | Description |
|---------|-------------|
| `self` | Your character's stats (Hp, MaxHp, Level, Elo, Dano, Armadura, ...) |
| `enemies` | All hostile entities in range (players + monsters) |
| `monsters` | All monsters in range |
| `players` | All other players in range |
| `event` | Current world event info (`active`, `type`, `monstersRemaining`) |
| `tick` | Current server tick |

| Action | Description |
|--------|-------------|
| `moveTo(x, y)` | Move to coordinates |
| `moveToEntity(entity)` | Move toward an entity |
| `attack(entity)` | Attack a specific entity |
| `attackNearest()` | Attack nearest enemy |
| `flee()` | Run away from enemies |
| `stop()` | Stop all actions |

| Query | Description |
|-------|-------------|
| `getDistance(entity)` | Distance to entity |
| `isInAttackRange(entity)` | Whether entity is in melee range |
| `getNearestEnemy()` | Closest hostile |
| `getNearestMonster()` | Closest monster |
| `getNearestPlayer()` | Closest player |
| `getEntitiesInRange(range)` | All entities within range |
| `random()` / `randomRange(min, max)` | RNG |

Scripts run with [Jint](https://github.com/sebastienros/jint) (JavaScript interpreter for .NET), sandboxed with 10ms timeout, 1000 statement limit, 2MB memory cap, and auto-disable after repeated failures.

## Real-time Streaming with S2

Game state is delivered to each player through **individual [S2](https://s2.dev) streams** — one stream per connected player. This replaces traditional WebSocket broadcast with a pipe-based architecture:

```
Game Loop (20 ticks/s)
  → EntityStateTracker (computes delta per player)
    → S2Publisher (appends to player's individual stream)
      → S2 cloud (stores + delivers)
        → Frontend SSE client (reads from own stream)
          → Zustand store (merges + interpolates)
            → Three.js render
```

### Why per-player streams?

Each player sees a different slice of the world (entities within 1000-unit broadcast range). Instead of broadcasting everything and filtering client-side, the server computes **per-player delta payloads** — only fields that changed since the last broadcast for that specific player — and appends them to that player's dedicated S2 stream.

- **Delta updates**: Position changed? Send `{id, x, y}`. HP changed? Send `{id, hp}`. Nothing changed? Send nothing. Full state sync every 10th broadcast as fallback.
- **No WebSocket server**: S2 handles connection management, buffering, and delivery. The API just appends records.
- **SSE on the frontend**: The S2 JS SDK reads the stream via Server-Sent Events. Reconnection and sequencing are handled by S2.

### Frontend interpolation

Server broadcasts at ~10Hz (every 2 ticks). The frontend interpolates positions client-side over 150ms windows to produce smooth 60fps movement.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | .NET 10, Entity Framework Core, PostgreSQL |
| Scripting | Jint (sandboxed JavaScript engine) |
| Streaming | S2.dev (per-player streams via SSE) |
| Caching | Redis (Upstash) with in-memory fallback |
| Frontend | React 19, Three.js (React Three Fiber), Zustand |
| Auth | Clerk (GitHub, GitLab, HuggingFace OAuth) |
| Deploy | Docker, GitHub Container Registry |

## Running Locally

```bash
cp .env.example .env
# Fill in secrets (see .env.example for required vars)

docker compose build && docker compose up -d
# API at http://localhost:5138

# Frontend dev server (optional, for HMR)
cd web && npm install && npm run dev
# Web at http://localhost:5173
```

## License

MIT
