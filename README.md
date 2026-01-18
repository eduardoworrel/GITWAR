# GitWorld

A passive 3D MMO where players log in via OAuth (GitHub, GitLab, HuggingFace) and watch their characters auto-battle in a desk-themed world divided by programming language kingdoms. Player stats are derived from GitHub/GitLab activity (commits, contributions, followers).

**Production:** https://gitwar.eduardoworrel.com

## Features

- **Multi-provider OAuth** - GitHub, GitLab, HuggingFace via Clerk
- **Spectator Mode** - Watch other players battle (auto-cycles every 20s)
- **50+ Monster Types** - Language-specific errors (JavaScript, Python, Java, C#, Go, Rust, etc.)
- **AI/ML Error Monsters** - VanishingGradient, Overfitting, ExplodingGradient, etc.
- **Item Shop** - Tier-based pricing (F to S), equippable gear with stat bonuses
- **Player Scripting** - Custom JavaScript behavior via Monaco editor
- **Real-time Combat** - Floating damage numbers, critical hits, level-up effects
- **Progression System** - XP, levels (max 100), gold rewards

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Web         │◄────│    S2.dev       │◄────│      API        │
│  React + Three  │ SSE │ (Per-player     │     │   .NET 10       │
│                 │     │  streams)       │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                              ┌──────────┼──────────┐
                                              │          │          │
                                         ┌────▼────┐ ┌───▼───┐ ┌────▼────┐
                                         │PostgreSQL│ │ Redis │ │ GitHub  │
                                         └─────────┘ │Upstash│ │  API    │
                                                     └───────┘ └─────────┘
```

- **API** (.NET 10): Game loop 20 ticks/s, Clerk auth, S2.dev streaming, Jint scripting
- **Web** (React 19 + Three.js): 3D rendering, individual player SSE streams, Monaco editor
- **S2.dev**: Per-player event streams with delta state updates
- **Redis**: Caching layer (Upstash in production, memory fallback)

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | .NET 10, Entity Framework Core, PostgreSQL, Redis, Jint |
| Frontend | React 19.2, Three.js 0.182, React Three Fiber, Zustand 5.0, Monaco Editor |
| Auth | Clerk (GitHub, GitLab, HuggingFace OAuth) |
| Streaming | S2.dev (SSE with per-player streams) |
| i18n | i18next |
| Deploy | DigitalOcean App Platform |

## Run Locally

```bash
# 1. Clone and configure
git clone <repo>
cd GithubWar
cp .env.example .env  # Configure variables

# 2. Start backend (PostgreSQL + Redis + API)
docker compose build && docker compose up -d
# API: http://localhost:5138

# 3. Start frontend (in another terminal)
cd web
npm install
npm run dev
# Web: http://localhost:5173
```

### Docker Compose Services
- **postgres** - PostgreSQL 16 (port 5432)
- **redis** - Redis 7 with persistence (port 6379)
- **api** - .NET 10 API (port 5138)

## Project Structure

```
.
├── src/
│   ├── GitWorld.Api/           # Backend .NET 10
│   │   ├── Program.cs          # Entry point + game loop + endpoints (~2000 lines)
│   │   ├── Core/
│   │   │   ├── World.cs        # Entity management
│   │   │   ├── GameLoop.cs     # 20 ticks/s game loop
│   │   │   ├── Scripting/      # Jint JavaScript engine
│   │   │   └── Systems/        # Movement, Combat, AI, Events, Progression
│   │   ├── Auth/               # Clerk JWT validation
│   │   ├── Stream/             # S2.dev integration + per-player tokens
│   │   ├── Caching/            # Redis with memory fallback
│   │   ├── GitHub/             # GitHub stats fetcher
│   │   └── Providers/          # GitLab, HuggingFace fetchers
│   └── GitWorld.Shared/        # Shared types and constants
│
├── web/                        # Frontend React 19
│   ├── src/
│   │   ├── three/              # 3D components (50+ monster models)
│   │   ├── components/         # UI (PlayerModal, ScriptEditor, Minimap, etc.)
│   │   ├── stores/             # Zustand state management
│   │   ├── hooks/              # useS2Stream, useSpectatorMode
│   │   └── i18n/               # Internationalization
│   └── package.json
│
├── .do/app.yaml                # DigitalOcean config
├── docker-compose.yml          # Local dev (PostgreSQL + Redis + API)
└── deploy.sh                   # Production deployment
```

## Environment Variables

### API
| Variable | Description |
|----------|-------------|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection |
| `S2__Token`, `S2__Basin`, `S2__StreamName` | S2.dev credentials |
| `Clerk__Domain`, `Clerk__SecretKey` | Clerk auth |
| `Redis__Enabled`, `Redis__ConnectionString` | Redis cache |
| `GITHUB_TOKEN` | GitHub API token |

### Web (build-time)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `VITE_S2_BASIN`, `VITE_S2_STREAM` | S2 config |

## Deploy (Production)

```bash
./deploy.sh api    # API only
./deploy.sh web    # Web only
./deploy.sh all    # Everything
```

## Game Loop

```
Server (20 ticks/s) -> Delta State -> S2.dev -> Per-player SSE -> Zustand -> Three.js
```

- **Tick rate:** 20/s (50ms)
- **Broadcast:** Every 2 ticks (~100ms)
- **Client interpolation:** 150ms

## Game Systems

### Combat
- Auto-attack nearby enemies (30 unit range)
- Critical hits (1.5x multiplier)
- ELO-based matchmaking protection
- Floating damage numbers with arc animation

### Events
- **Bug Swarm:** Every 1 min (1-3 bugs per player)
- **Intermediate:** Every 5 min (AI Hallucinations, Managers, Language errors)
- **Unexplained Bug:** Every 1 hour (high-HP boss)
- **Boss:** Daily at 18:00 UTC

### Progression
- Max level: 100
- XP formula: `100 * (1.15 ^ (level - 1))`
- Level-up bonuses: +2 HP, +1 damage, +0.5 attack speed

### Item Shop
| Tier | Price |
|------|-------|
| F | 50g |
| D | 150g |
| C | 400g |
| B | 1000g |
| A | 2500g |
| S | 5000g |

### Player Scripting
- Custom JavaScript behavior via Monaco editor
- Executed in sandboxed Jint engine
- Toggle on/off, validation, reset to default

## Important Notes

1. **WebGL:** Use `meshBasicMaterial` (not `meshStandardMaterial`) for iOS/Safari compatibility
2. **Routes:** DigitalOcean strips prefix before container (`/api/health` -> `/health`)
3. **Docker Mac:** Build with `--platform linux/amd64`
4. **Performance:** Instanced rendering, material pooling, LOD culling by distance
