# GitWar

A 3D browser MMO where you **program your character's behavior in JavaScript** and watch it fight in real-time. Scripts run server-side in a sandboxed [Jint](https://github.com/sebastienros/jint) engine every game tick. Game state streams to each player through individual [S2](https://s2.dev) pipes via SSE.

**Live:** [gitwar.eduardoworrel.com](https://gitwar.eduardoworrel.com)

## Player Scripting

Each player writes a JavaScript `onTick()` function that executes every tick (50ms). This is the default script every player starts with:

```js
function onTick() {
    // During events, prioritize monsters
    if (event.active) {
        const monster = getNearestMonster();
        if (monster) {
            if (isInAttackRange(monster)) {
                attack(monster);
            } else {
                moveToEntity(monster);
            }
            return;
        }
    }

    // Find nearest enemy
    const enemy = getNearestEnemy();

    if (!enemy) {
        stop();
        return;
    }

    // Attack if in range, otherwise move towards enemy
    if (isInAttackRange(enemy)) {
        attack(enemy);
    } else {
        moveToEntity(enemy);
    }
}
```

Sandboxed with 10ms timeout, 1000 statement limit, 2MB memory cap, and auto-disable after 3 consecutive failures.

## Real-time Streaming with S2

Game state is delivered through **individual [S2](https://s2.dev) streams** — one pipe per connected player:

```
Game Loop (20 ticks/s)
  → EntityStateTracker (computes delta per player)
    → S2Publisher (appends to player's stream)
      → S2 cloud
        → Frontend SSE client
          → Zustand store (merges + interpolates)
            → Three.js render
```

The server computes **per-player delta payloads** — only fields that changed since the last broadcast — and appends them to that player's dedicated S2 stream. Full state sync every 10th broadcast as fallback. The frontend interpolates positions over 150ms windows for smooth 60fps movement.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | .NET 10, Entity Framework Core, PostgreSQL |
| Scripting | Jint (sandboxed JS engine) |
| Streaming | S2.dev (per-player pipes via SSE) |
| Caching | Redis with in-memory fallback |
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
