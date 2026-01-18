# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Rules

1. **"Restart" = LOCAL** - When user asks to restart, it's ALWAYS local:
   ```bash
   docker compose build && docker compose up -d
   ```

2. **Deploy = PRODUCTION** - Production deploy uses `./deploy.sh`:
   ```bash
   ./deploy.sh api    # API only
   ./deploy.sh web    # Web only
   ./deploy.sh all    # API + Web
   ```

3. **NEVER deploy without explicit confirmation** - Always ask before deploying to production.

4. **Local vs Production**:
   - Local: `docker compose up` (port 5138)
   - Production: https://gitwar.eduardoworrel.com

## Project Overview

GitWorld is a 3D passive MMO game where players login via OAuth (GitHub, GitLab, or HuggingFace) and watch their character auto-battle in a world divided by programming language kingdoms. Player stats are derived from GitHub/GitLab activity (commits, contributions, followers).

**Game Features:**
- Spectator mode for non-authenticated users (auto-cycles players every 20s)
- PerspectiveCamera with follow/free/drone modes and zoom controls
- Floating damage numbers with arc animations
- Real-time connection via individual S2.dev player streams
- Item shop and inventory system with tier-based pricing
- Monster events (Bug, AI Hallucination, Manager, Boss, 50+ Language Error types)
- Player scripting system with Monaco editor (JavaScript via Jint engine)
- Redis caching (Upstash in production) with memory fallback

## Project Structure

```
.
├── src/
│   ├── GitWorld.Api/              # Backend .NET 10
│   │   ├── Program.cs             # Entry point + game loop + endpoints (~2000 lines)
│   │   ├── Core/
│   │   │   ├── World.cs           # Entity management, world state
│   │   │   ├── Entity.cs          # Base entity class
│   │   │   ├── GameLoop.cs        # Game loop at 20 ticks/s
│   │   │   ├── PlayerSession.cs   # Player session management
│   │   │   ├── Scripting/         # Player custom scripting
│   │   │   │   ├── ScriptContext.cs
│   │   │   │   └── ScriptExecutor.cs  # Jint JavaScript engine
│   │   │   └── Systems/
│   │   │       ├── MovementSystem.cs      # A* pathfinding + collision
│   │   │       ├── CombatSystem.cs        # Damage, critical, evasion
│   │   │       ├── AISystem.cs            # NPC/Monster AI behavior
│   │   │       ├── EventSystem.cs         # Monster spawn events
│   │   │       ├── ProgressionSystem.cs   # XP, leveling, rewards
│   │   │       ├── PlayerBehaviorSystem.cs
│   │   │       ├── PlayerScriptSystem.cs  # Execute custom scripts
│   │   │       └── HealthBehaviorSystem.cs
│   │   ├── Auth/
│   │   │   ├── ClerkJwtValidator.cs   # Clerk JWT validation
│   │   │   └── ClerkAuthMiddleware.cs
│   │   ├── Stream/
│   │   │   ├── S2Publisher.cs         # Publishes game state to S2
│   │   │   ├── S2TokenService.cs      # Generate player read tokens
│   │   │   └── EntityStateTracker.cs  # Delta state tracking
│   │   ├── GitHub/                # GitHub stats fetcher
│   │   ├── Providers/             # GitLab, HuggingFace fetchers
│   │   ├── Caching/
│   │   │   └── RedisCacheService.cs   # Redis with memory fallback
│   │   ├── Services/
│   │   │   └── ItemService.cs     # Shop/Inventory system
│   │   └── Data/                  # Entity Framework + PostgreSQL
│   │
│   └── GitWorld.Shared/           # Shared types and constants
│       ├── Constants.cs           # Game constants (~220+ lines)
│       ├── PlayerStats.cs
│       ├── Territories.cs         # Language kingdoms
│       └── Entities/              # Player, Item, PlayerItem, Battle
│
├── web/                           # Frontend React 19
│   ├── src/
│   │   ├── App.tsx                # Main orchestration
│   │   ├── three/                 # 3D components (React Three Fiber)
│   │   │   ├── Scene.tsx          # Canvas + WebGL setup
│   │   │   ├── Player.tsx         # Player model rendering
│   │   │   ├── Players.tsx        # Multiple players with LOD
│   │   │   ├── InstancedPlayers.tsx   # Instanced rendering
│   │   │   ├── IsometricCamera.tsx    # Camera (follow/free/drone)
│   │   │   ├── Map.tsx            # Desk environment
│   │   │   ├── FloatingDamage.tsx # Damage numbers animation
│   │   │   ├── FloatingReward.tsx # Reward numbers
│   │   │   ├── CombatEffects.tsx  # Hit effects, blood splats
│   │   │   ├── LevelUpEffect.tsx  # Level up visual
│   │   │   ├── MonsterModels.tsx  # Bug/Manager/Boss models
│   │   │   ├── AIErrorModels.tsx  # AI/ML error monsters
│   │   │   ├── LanguageErrorModels.tsx   # 50+ language error types
│   │   │   ├── LanguageErrorModels2.tsx
│   │   │   ├── LanguageErrorModels3.tsx
│   │   │   ├── AnimationManager.tsx   # Centralized animation pooling
│   │   │   └── constants.ts       # Map dimensions (5000x3000)
│   │   ├── components/            # UI overlays
│   │   │   ├── LoginBar.tsx       # OAuth login buttons
│   │   │   ├── SpectatorBanner.tsx    # Spectator mode banner
│   │   │   ├── PlayerModal.tsx    # Player details + Shop/Attributes (~1200 lines)
│   │   │   ├── PlayerHUD.tsx      # Stats, level, ELO display
│   │   │   ├── Minimap.tsx        # Top-left minimap (5:3 ratio)
│   │   │   ├── ConnectionStatus.tsx   # Connection state indicator
│   │   │   ├── ScriptEditor.tsx   # Monaco editor for custom scripts
│   │   │   ├── Killfeed.tsx       # Combat event feed
│   │   │   └── EventBanner.tsx    # Active event banner
│   │   ├── stores/
│   │   │   └── gameStore.ts       # Zustand state (~250+ lines)
│   │   ├── hooks/
│   │   │   ├── useS2Stream.ts     # S2 SSE connection (~400 lines)
│   │   │   └── useSpectatorMode.ts    # Auto-cycle players (~150 lines)
│   │   └── i18n/                  # Internationalization
│   ├── Dockerfile                 # Node + Nginx
│   ├── nginx.conf
│   └── package.json               # React 19.2, Three.js 0.182, Zustand 5.0
│
├── .do/app.yaml                   # DigitalOcean App Platform config
├── docker-compose.yml             # Local: PostgreSQL + Redis + API
├── deploy.sh                      # Production deployment script
└── .env.example                   # Environment variables template
```

## Build & Run Commands

### Local Development (Docker)
```bash
# First time setup
cp .env.example .env
# Edit .env with your secrets

# Start everything (PostgreSQL + Redis + API)
docker compose build && docker compose up -d

# View logs
docker compose logs -f api

# Restart after code changes
docker compose build && docker compose up -d
```

### Backend (API) - Without Docker
```bash
dotnet build src/GitWorld.Api/GitWorld.Api.csproj
dotnet run --project src/GitWorld.Api/GitWorld.Api.csproj
```

### Frontend (Web)
```bash
cd web
npm install
npm run dev      # Development server with HMR (port 5173)
npm run build    # TypeScript check + production build
npm run lint     # ESLint
```

### Deployment (DigitalOcean App Platform)

**App ID:** `a85bc799-f622-4953-a8d9-1c256133b924`
**App URL:** `https://gitwar.eduardoworrel.com`

```bash
# Use deploy.sh script (preferred)
./deploy.sh api    # Build, push and deploy API only
./deploy.sh web    # Build, push and deploy Web only
./deploy.sh all    # Build, push and deploy everything

# Check deployment status
doctl apps get-deployment a85bc799-f622-4953-a8d9-1c256133b924 <deployment-id> --format Phase,Progress

# View logs
doctl apps logs a85bc799-f622-4953-a8d9-1c256133b924 api
doctl apps logs a85bc799-f622-4953-a8d9-1c256133b924 web
```

#### Route Configuration (Important)
DO App Platform REMOVES the route prefix before forwarding to container:
- Route `/api` in app.yaml -> Request `/api/health` -> Container receives `/health`
- Endpoints in code should NOT include the route prefix

**Routes configured in `.do/app.yaml`:**
- `/api` -> API
- `/game` -> API
- `/health` -> API
- `/` -> Web (fallback)

## Architecture

### Backend (.NET 10)
- **Program.cs** - Main entry point, game loop, all endpoints (~2000 lines)
- **Core/World.cs** - Entity management, world state
- **Core/GameLoop.cs** - 20 ticks/s game loop
- **Core/Systems/** - Game systems (Movement, Combat, AI, Events, Progression, Scripting)
- **Core/Scripting/** - Jint JavaScript engine for player custom scripts
- **Stream/S2Publisher.cs** - S2.dev integration with delta state tracking
- **Stream/S2TokenService.cs** - Generates individual player read tokens
- **Auth/ClerkJwtValidator.cs** - Validates JWT tokens from Clerk
- **GitHub/, Providers/** - Fetches stats from GitHub, GitLab, HuggingFace APIs
- **Caching/RedisCacheService.cs** - Redis with memory fallback
- **Data/** - Entity Framework Core with PostgreSQL

The game loop runs at 20 ticks/second, broadcasting state every 2 ticks (~100ms) via S2.dev streams.

### Frontend (React 19 + Three.js)
- **src/three/** - All 3D rendering using React Three Fiber
  - `Scene.tsx` - Main canvas with WebGL config
  - `Player.tsx` - Player model with avatar textures
  - `Players.tsx` / `InstancedPlayers.tsx` - Optimized multi-player rendering
  - `IsometricCamera.tsx` - Camera with follow/free/drone modes
  - `Map.tsx` - Desk environment (monitor, keyboard, mousepad)
  - `FloatingDamage.tsx` / `FloatingReward.tsx` - Animated damage/reward numbers
  - `MonsterModels.tsx`, `AIErrorModels.tsx`, `LanguageErrorModels*.tsx` - 50+ monster types
  - `AnimationManager.tsx` - Centralized animation pooling for performance
- **src/components/** - UI overlays
  - `LoginBar.tsx` - OAuth login buttons
  - `SpectatorBanner.tsx` - Spectator mode banner
  - `PlayerModal.tsx` - Player details with Shop/Attributes tabs (~1200 lines)
  - `PlayerHUD.tsx` - Stats, level, ELO display
  - `Minimap.tsx` - Top-left minimap (filtered by 1000-unit broadcast range)
  - `ScriptEditor.tsx` - Monaco editor for custom player scripts
  - `Killfeed.tsx` - Combat event feed
- **src/stores/gameStore.ts** - Zustand store with position interpolation
- **src/hooks/useS2Stream.ts** - Individual player S2 SSE connection
- **src/hooks/useSpectatorMode.ts** - Auto-cycles through players every 20s
- **src/i18n/** - Internationalization support

### Real-time Data Flow
```
API GameLoop (20 ticks/s) -> EntityStateTracker (delta) -> S2Publisher -> S2.dev
                                                                            |
                                                                            v
Three.js <- Zustand store <- useS2Stream hook <- Individual Player Stream (SSE)
```

Position interpolation smooths movement between server updates (INTERPOLATION_DURATION_MS = 150ms).

## Key Constraints

### WebGL Compatibility
- Use `meshBasicMaterial` instead of `meshStandardMaterial` for cross-device support (iOS Safari, Windows)
- Avoid `gridHelper`, `Line` components - they fail on some devices
- PerspectiveCamera with near=20, far=10000 to avoid flickering
- Use `zIndexRange={[0, 1]}` on Html components to prevent overlapping modals

### Performance Optimizations
- Position interpolation: 150ms client-side smoothing
- Material pooling in AnimationManager
- Instanced rendering for multiple players
- LOD culling by distance
- Broadcast filtering by 1000-unit range
- Delta state updates instead of full broadcasts

### Deployment
- Web Docker images must be built with `--platform linux/amd64` on Mac
- API health check configured with generous timeout (30s initial delay) due to S2 stream initialization
- App spec at `.do/app.yaml`
- Secrets configured via DigitalOcean dashboard (not in app.yaml)

## Environment Variables

All secrets should be in `.env` file (gitignored). See `.env.example` for template.

### API
| Variable | Description |
|----------|-------------|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string |
| `S2__Token` | S2.dev access token |
| `S2__Basin` | S2.dev basin name |
| `S2__StreamName` | S2.dev stream name |
| `GITHUB_TOKEN` | GitHub PAT for fetching player stats |
| `Clerk__SecretKey` | Clerk secret key for JWT validation |
| `Clerk__Domain` | Clerk domain |
| `Redis__Enabled` | Enable Redis caching (true/false) |
| `Redis__ConnectionString` | Redis connection string (Upstash in prod) |

### Web (build-time)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `VITE_S2_BASIN` | S2 basin name |
| `VITE_S2_STREAM` | S2 stream name |
| `VITE_S2_READ_TOKEN` | S2 read-only token (optional) |

## API Endpoints (~45 total)

### Health & Debug
- `GET /health` - Service health check
- `GET /game/state` - Full world state (debug)

### Game Core
- `GET /game/spectate/players` - List online players for spectating
- `GET /game/player/{id}` - Get player entity info
- `POST /game/join` - Authenticate and join (returns playerId + streamInfo)
- `POST /game/player/{id}/heartbeat` - Keep-alive signal
- `POST /game/player/{id}/leave` - Leave game
- `POST /game/entity/{id}/move` - Command player movement

### Stats Integration
- `GET /github/{username}` - Get cached player profile
- `POST /github/{username}/refresh` - Refresh GitHub cache
- `GET /gitlab/{username}/raw` - Raw GitLab data
- `GET /huggingface/{username}/raw` - Raw HuggingFace data
- `GET /profile/linked-accounts` - User's linked OAuth accounts

### Stream
- `GET /stream/info` - S2 configuration info
- `GET /stream/s2` - S2 stream endpoint (SSE)

### Shop & Inventory
- `GET /shop/items` - List all shop items
- `GET /player/inventory` - Get player inventory
- `POST /player/items/acquire` - Buy item from shop
- `POST /player/items/{playerItemId}/equip` - Equip item
- `POST /player/items/{playerItemId}/unequip` - Unequip item
- `GET /player/bonuses` - Get current item stat bonuses

### Player Scripting
- `GET /player/script` - Get player's custom script
- `POST /player/script` - Update custom script
- `POST /player/script/validate` - Validate script syntax
- `POST /player/script/toggle` - Enable/disable script
- `GET /player/script/status` - Get script execution status
- `POST /player/script/reset` - Reset script to default
- `GET /player/script/default` - Get default template
- `GET /player/script/docs` - Get script API documentation

### Admin
- `POST /admin/spawn-monster` - Spawn single monster
- `POST /admin/spawn-all-monsters` - Spawn all monster types
- `POST /admin/clear-monsters` - Clear monsters
- `POST /admin/spawn-fake-players` - Spawn N fake players
- `POST /admin/clear-fake-players` - Remove fake players

## Game Systems

### Game Loop
- **Tick Rate:** 20 ticks/second (50ms per tick)
- **Update Order:** Movement -> Combat -> AI -> Events -> Progression -> Broadcasting
- **Broadcast:** Every 2 ticks (~100ms) via S2.dev

### World Configuration
- **Map Size:** 5000 x 3000 units (desk environment)
- **Spawn Position:** 1800, 2300 (safe area)
- **Broadcast Range:** 1000 units (entities beyond this are culled)

### Combat
- **Attack Cooldown:** 60 ticks (3 seconds base)
- **Range:** 30 units melee
- **Damage Formula:** Base damage +/- variance + critical multiplier
- **Critical Hit Multiplier:** 1.5x
- **ELO Protection:** Players ignore targets 200+ ELO below them
- **ELO Danger Threshold:** Avoid targets 300+ ELO above

### Entity Types
- **player** - User character
- **bug** - Basic enemy (10 XP, 5 gold)
- **aihallucination** - AI error monster (25 XP, 15 gold)
- **manager** - Manager monster (30 XP, 20 gold)
- **unexplainedbug** - Rare high-HP boss (150 XP, 75 gold)
- **boss** - Daily boss at 18h UTC (200 XP, 100 gold)
- **Language Error Monsters** - 50+ types (JavaScript, Python, Java, C#, Go, Rust, etc.)
- **AI/ML Error Monsters** - VanishingGradient, ExplodingGradient, DyingReLU, Overfitting, etc.

### Events (EventSystem)
- **Bug Swarm:** Every 1 minute - spawns 1-3 bugs per online player
- **Intermediate Event:** Every 5 minutes - AI Hallucinations + Managers + Language errors
- **Unexplained Bug:** Every 1 hour - single high-HP boss
- **Boss Event:** Daily at 18:00 UTC - major boss encounter
- **Death Animation:** 1-second delay before monster removal

### Progression System
- **Max Level:** 100
- **XP Formula:** `BaseExp * (1.15 ^ (level - 1))` where BaseExp = 100
- **Level-up Bonuses:** +2 HP max, +1 damage, +0.5 attack speed

### Item Shop & Inventory

**Tier-based Pricing:**
| Tier | Price (Gold) |
|------|--------------|
| F | 50 |
| D | 150 |
| C | 400 |
| B | 1000 |
| A | 2500 |
| S | 5000 |

**Item Categories:**
- Notebook, Processor, Coffee, Energy Drink, Keyboard, Headphones, T-Shirt, IDE, Food, Pet, Accessory

**Item Stats (bonuses can be positive or negative):**
- DamageBonus, ArmorBonus, HpBonus, CriticalBonus, EvasionBonus
- AttackSpeedBonus, MovementSpeedBonus

**Duration Types:**
- Permanent: `DurationMinutes = null`
- Temporary: Coffee (30min), Food (10min), Energy drinks (60min)

### Player Scripting
- **Engine:** Jint (JavaScript)
- **Editor:** Monaco Editor in frontend
- **Execution:** Sandboxed context per player
- **Features:** Custom behavior logic, script validation, toggle on/off
