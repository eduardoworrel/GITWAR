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
- PerspectiveCamera with follow/free modes and zoom controls
- Floating damage numbers with arc animations
- Real-time connection status with auto-reconnect
- Item shop and inventory system
- Monster events (Bug, AI Hallucination, Manager, Boss)

## Project Structure

```
.
├── src/
│   ├── GitWorld.Api/          # Backend .NET 10
│   │   ├── Program.cs         # Entry point + game loop (~1000 lines)
│   │   ├── Core/              # Game systems
│   │   │   ├── World.cs       # World state management
│   │   │   ├── Systems/       # MovementSystem, EventSystem
│   │   ├── Auth/              # Clerk JWT validation
│   │   ├── Stream/            # S2.dev integration
│   │   ├── GitHub/            # GitHub stats fetcher
│   │   ├── Providers/         # GitLab, HuggingFace fetchers
│   │   └── Data/              # Entity Framework + PostgreSQL
│   └── GitWorld.Shared/       # Shared types and constants
├── web/                       # Frontend React 19
│   ├── src/three/             # 3D components (React Three Fiber)
│   ├── src/components/        # UI components
│   ├── src/stores/            # Zustand state management
│   └── src/hooks/             # Custom hooks (useS2Stream, etc)
├── .do/app.yaml               # DigitalOcean App Platform config
├── docker-compose.yml         # Local development
├── deploy.sh                  # Production deployment script
├── .env.example               # Environment variables template
└── .env                       # Local secrets (gitignored)
```

## Build & Run Commands

### Local Development (Docker)
```bash
# First time setup
cp .env.example .env
# Edit .env with your secrets

# Start everything (PostgreSQL + API)
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
- Route `/api` in app.yaml → Request `/api/health` → Container receives `/health`
- Endpoints in code should NOT include the route prefix

**Routes configured in `.do/app.yaml`:**
- `/api` → API
- `/game` → API
- `/health` → API
- `/` → Web (fallback)

## Architecture

### Backend (.NET 10)
- **Program.cs** - Main entry point, configures services and game loop
- **Core/World.cs** - World state, player management, combat logic
- **Core/Systems/** - Game systems
  - `MovementSystem.cs` - Player movement and pathfinding
  - `EventSystem.cs` - Monster spawning and world events
- **Stream/S2Publisher.cs** - S2.dev integration for real-time state broadcasting
- **Auth/ClerkJwtValidator.cs** - Validates JWT tokens and extracts username from external_accounts
- **GitHub/, Providers/** - Fetches user stats from GitHub, GitLab, HuggingFace APIs
- **Data/** - Entity Framework with PostgreSQL

The game loop runs at 20 ticks/second, broadcasting state every 2 ticks (~100ms) via S2.dev streams.

### Frontend (React + Three.js)
- **src/three/** - All 3D rendering components using React Three Fiber
  - `Scene.tsx` - Main canvas with WebGL config
  - `Player.tsx` - Minecraft-style blocky character with avatar textures
  - `Map.tsx` - Desk environment (monitor, keyboard, mousepad)
  - `IsometricCamera.tsx` - PerspectiveCamera with follow/free modes
  - `FloatingDamage.tsx` - Animated damage numbers with arc trajectory
  - `constants.ts` - Map dimensions (5000x3000), camera settings
- **src/components/** - UI overlays
  - `LoginBar.tsx` - Bottom bar with OAuth login buttons
  - `SpectatorBanner.tsx` - Top banner showing spectated player
  - `PlayerModal.tsx` - Player details with Shop/Attributes tabs
  - `Minimap.tsx` - Top-left minimap reflecting desk layout
  - `ConnectionStatus.tsx` - Connection state with reconnect handling
- **src/stores/gameStore.ts** - Zustand store with position interpolation
- **src/hooks/useS2Stream.ts** - SSE connection with heartbeat monitoring
- **src/hooks/useSpectatorMode.ts** - Auto-cycles through players every 20s

### Real-time Data Flow
```
API GameLoop (20 ticks/s) → S2.dev stream → Web polls S2 → Zustand store → Three.js renders
```

Position interpolation smooths movement between server updates (INTERPOLATION_DURATION_MS = 150ms).

## Key Constraints

### WebGL Compatibility
- Use `meshBasicMaterial` instead of `meshStandardMaterial` for cross-device support (iOS Safari, Windows)
- Avoid `gridHelper`, `Line` components - they fail on some devices
- PerspectiveCamera with near=20, far=10000 to avoid flickering
- Use `zIndexRange={[0, 1]}` on Html components to prevent overlapping modals

### UI/UX
- Login buttons use native emojis for provider icons
- SpectatorBanner at top, LoginBar at bottom (translucent with backdrop blur)
- PlayerModal shows tabs (Shop/Attributes) only for authenticated user's own character
- Minimap positioned top-left, proportional to map (5:3 ratio)

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
| `GITHUB_TOKEN` | GitHub PAT for fetching player stats |
| `Clerk__SecretKey` | Clerk secret key for JWT validation |
| `Clerk__Domain` | Clerk domain |

### Web
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (build-time) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |

## Game Systems

### Combat
- Players auto-attack nearby enemies
- Damage based on player stats (derived from GitHub activity)
- Critical hits with floating damage numbers
- ELO-based matchmaking consideration

### Events (EventSystem)
- Monster spawning: Bug, AI Hallucination, Manager, Unexplained Bug, Boss
- AI Invasion event spawns ML/AI error monsters (Vanishing Gradient, Exploding Gradient, etc.)
- Monsters have health pools and drop rewards
- Events trigger based on player activity

### Progression System (XP & Gold)

**Level System:**
- Max Level: 100
- XP Formula: `BaseExp * (1.15 ^ level)` where BaseExp = 100
- Stats increase per level (damage, HP, etc.)

**XP Rewards per kill:**
| Source | XP | Gold |
|--------|------|------|
| Bug | 10 | 5 |
| AI Hallucination | 25 | 15 |
| Manager | 30 | 20 |
| Unexplained Bug | 150 | 75 |
| Boss | 200 | 100 |
| Player Kill | 50 (scales with level) | 25 |

**Key Files:**
- `Core/Systems/ProgressionSystem.cs` - XP/Gold/LevelUp logic
- `GitWorld.Shared/Constants.cs` - All reward values

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
- Notebook, Processador, Café, Energético, Teclado, Fone, Camiseta, IDE, Comida, Pet, Acessório

**Item Stats (bonuses can be positive or negative):**
- DanoBonus, ArmaduraBonus, HpBonus, CriticoBonus, EvasaoBonus
- VelocidadeAtaqueBonus, VelocidadeMovimentoBonus

**Duration:**
- Permanent items: `DurationMinutes = null`
- Temporary items: Coffee, Food, Energy drinks have `DurationMinutes` set

**Key Files:**
- `Services/ItemService.cs` - Buy, equip, unequip logic
- `Program.cs` (lines 84-174) - Item seeding with all items
- `Data/Entities/Item.cs`, `PlayerItem.cs` - Data models

**API Endpoints:**
- `GET /api/items` - List all shop items
- `GET /api/inventory/{playerId}` - Player inventory
- `POST /api/items/buy` - Purchase item
- `POST /api/items/equip` - Equip item
- `POST /api/items/unequip` - Unequip item
