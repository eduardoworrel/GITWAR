# GitWorld - Plano de Implementação

## Status: PRONTO PARA DESENVOLVIMENTO

---

## DECISÕES CONFIRMADAS

| Item | Decisão |
|------|---------|
| **Visual** | 3D isométrico (2.5D estilo Ragnarok) |
| **Assets** | Geometric boxes (BoxGeometry) |
| **Câmera** | Fixa de cima, ângulo isométrico |
| **Engine Frontend** | Three.js (React Three Fiber) |
| **Backend** | **.NET 8 (C#)** |
| **Streaming** | **S2.dev** |
| **Fórmulas** | Normalizadas (seção 2.2) |

---

## ARQUITETURA EM 4 BLOCOS PARALELOS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GitWorld Architecture                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │    BLOCO A      │  │    BLOCO B      │  │    BLOCO C      │             │
│  │   FRONTEND      │  │   GAME CORE     │  │    GITHUB       │             │
│  │                 │  │                 │  │                 │             │
│  │ • Three.js      │  │ • Game Loop     │  │ • OAuth/Clerk   │             │
│  │ • Câmera 2.5D   │  │ • Movimento     │  │ • API Fetcher   │             │
│  │ • Personagens   │  │ • Combate       │  │ • Stats Calc    │             │
│  │ • Mapa/Terreno  │  │ • Death/Respawn │  │ • Cache         │             │
│  │ • UI/HUD        │  │ • Spatial Index │  │ • Reino         │             │
│  │                 │  │                 │  │                 │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│           └────────────────────┼────────────────────┘                       │
│                                │                                            │
│                    ┌───────────┴───────────┐                               │
│                    │       BLOCO D         │                               │
│                    │    INFRAESTRUTURA     │                               │
│                    │                       │                               │
│                    │ • Streaming SSE       │                               │
│                    │ • Database            │                               │
│                    │ • Monorepo Setup      │                               │
│                    │ • Deploy              │                               │
│                    │                       │                               │
│                    └───────────────────────┘                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## BLOCO A - FRONTEND (Three.js)

### Responsabilidades
- Renderização 3D isométrica
- Câmera fixa 2.5D
- Personagens como boxes coloridos
- Mapa com reinos coloridos
- UI de stats e HP bars
- Receber e processar stream de estado

### Stack
- React + Vite
- Three.js / React Three Fiber
- Zustand (estado local)

### Tarefas

| # | Tarefa | Dependência |
|---|--------|-------------|
| A1 | Setup React + Vite + Three.js | - |
| A2 | Câmera isométrica (45° ou 60°) | A1 |
| A3 | Renderizar box colorido (personagem) | A1 |
| A4 | Renderizar múltiplos personagens | A3 |
| A5 | Renderizar terreno/mapa (plano colorido por reino) | A1 |
| A6 | Animação de movimento (lerp) | A4 |
| A7 | Animação de ataque (scale pulse) | A4 |
| A8 | HP bar flutuante sobre personagem | A4 |
| A9 | UI: painel de stats do jogador | A1 |
| A10 | Conectar ao stream SSE | D2 |
| A11 | Câmera seguindo personagem do jogador | A2, A10 |
| A12 | Efeitos visuais (hit, crit, miss) | A7 |

### Especificação Visual

```javascript
// Câmera isométrica
const CAMERA_ANGLE = 60 // graus
const CAMERA_HEIGHT = 500
const CAMERA_DISTANCE = 800

// Personagem (box)
const PLAYER_WIDTH = 20
const PLAYER_HEIGHT = 30  // mais alto = mais HP (visual)
const PLAYER_DEPTH = 20

// Cores por reino (do GDD)
const CORES_REINO = {
  'Python': 0x3776AB,
  'JavaScript': 0xF7DF1E,
  'TypeScript': 0x3178C6,
  'Java': 0xED8B00,
  'C#': 0x239120,
  'Go': 0x00ADD8,
  'Rust': 0xDEA584,
  'Ruby': 0xCC342D,
  'PHP': 0x777BB4,
  'C++': 0x00599C,
  'C': 0x555555,
  'Swift': 0xFA7343,
  'Kotlin': 0x7F52FF,
  'Shell': 0x89E051,
  'Scala': 0xDC322F,
}
```

---

## BLOCO B - GAME CORE (Backend .NET)

### Responsabilidades
- Loop de jogo (20 ticks/s)
- Gerenciar todas as entidades
- Sistema de decisão (IA simples)
- Sistema de movimento
- Sistema de combate
- Sistema de morte/respawn
- Spatial indexing para proximidade

### Stack
- **.NET 8 / C#**
- ASP.NET Core (API)
- ECS pattern ou classes simples
- System.Threading.Timer para game loop

### Tarefas

| # | Tarefa | Dependência |
|---|--------|-------------|
| B1 | Setup projeto backend | - |
| B2 | Estrutura de Entity (posição, stats, estado) | B1 |
| B3 | World class (mapa, reinos, bounds) | B1 |
| B4 | Game Loop (setInterval 50ms) | B1 |
| B5 | MovementSystem (mover entidades) | B2, B4 |
| B6 | Spatial indexing (grid ou quadtree) | B3 |
| B7 | DecisionSystem (encontrar alvo, vagar) | B2, B6 |
| B8 | CombatSystem (atacar, dano, crit, evasão) | B2 |
| B9 | DeathSystem (morte, agendar respawn) | B2, B3 |
| B10 | API: adicionar/remover jogador | B2 |
| B11 | Callback de broadcast (para D2) | B4 |
| B12 | Testes unitários dos sistemas | B5-B9 |

### Constantes do Game Core

```csharp
public static class GameConstants
{
    public const int TickRateMs = 50;        // 20 ticks/s
    public const float RangeVisao = 300f;    // unidades
    public const float RangeAtaque = 30f;    // unidades
    public const int TempoRespawnMs = 10000; // ms
    public const float VelocidadeBase = 50f; // unidades/s

    public const int MapaWidth = 10000;
    public const int MapaHeight = 10000;
}
```

---

## BLOCO C - GITHUB INTEGRATION (.NET)

### Responsabilidades
- OAuth via Clerk (ou direto com GitHub OAuth)
- Buscar dados do GitHub (6 queries)
- Calcular stats normalizados
- Cache de stats
- Determinar reino (linguagem principal)

### Stack
- **.NET 8 / C#**
- HttpClient para GitHub API
- IMemoryCache ou Redis
- Octokit.NET (opcional)

### Tarefas

| # | Tarefa | Dependência |
|---|--------|-------------|
| C1 | Setup Clerk (OAuth GitHub) | - |
| C2 | Endpoint: callback OAuth | C1 |
| C3 | GitHubFetcher: buscar perfil | C1 |
| C4 | GitHubFetcher: buscar repos | C3 |
| C5 | GitHubFetcher: buscar commits (Search API) | C3 |
| C6 | GitHubFetcher: buscar PRs e issues | C3 |
| C7 | GitHubFetcher: buscar reviews | C3 |
| C8 | StatsCalculator: aplicar fórmulas normalizadas | C3-C7 |
| C9 | Determinar reino (linguagem com mais repos) | C4 |
| C10 | Cache de stats (1 hora TTL) | C8 |
| C11 | Endpoint: GET /me (retorna player completo) | C8, C10 |
| C12 | Edge cases (conta sem repos, etc) | C8 |

### Fórmulas Normalizadas (Confirmadas)

```csharp
public class StatsCalculator
{
    public PlayerStats Calculate(GitHubData data)
    {
        // HP: logarítmico
        var dias = (DateTime.UtcNow - data.CreatedAt).Days;
        var hp = (int)(Math.Log2(dias + 1) * 50) + 50;

        // Dano: linear com mínimo
        var danoRaw = (data.Commits / 100.0) + (data.Forks * 2) + (data.Stars / 10.0);
        var dano = Math.Max((int)danoRaw, 10);

        // Velocidade: cap 100
        var velRaw = data.Commits30d + (data.Prs30d * 3) + (data.Issues30d * 2) + (data.Commits7d * 2);
        var velocidade = Math.Min(velRaw / 10, 100);

        // Crítico: cap 50%
        var critRaw = (data.PrsMerged / (double)Math.Max(data.PrsTotal, 1) * 40)
                    + (data.AvgStars * 2) + (data.Reviews / 50.0);
        var critico = Math.Min((int)critRaw, 50);

        // Evasão: cap 30%
        var evaRaw = (data.ExternalRepos * 2) + (data.Orgs * 3)
                   + (data.Followers / 100.0) + (data.Languages * 2);
        var evasao = Math.Min((int)evaRaw, 30);

        // Armadura: cap 200
        var armRaw = (data.IssuesClosed * 2) + (data.Reviews * 3) + (data.CommitsExternal / 10.0);
        var armadura = Math.Min((int)(armRaw / 5), 200);

        return new PlayerStats(hp, dano, velocidade, critico, evasao, armadura);
    }
}
```

---

## BLOCO D - INFRAESTRUTURA

### Responsabilidades
- Setup do monorepo
- Banco de dados (schema, conexão)
- Streaming via S2.dev
- Deploy
- CI/CD

### Stack
- Turborepo ou pnpm workspaces
- PostgreSQL (Supabase/Neon)
- **S2.dev** (streaming serverless)

---

### S2.dev - O que é

S2 é um serviço de streaming serverless (YC-backed) - essencialmente "S3 para streams".

**Por que S2 ao invés de SSE/WebSocket:**

| Aspecto | SSE/WebSocket | S2.dev |
|---------|---------------|--------|
| Durabilidade | Perde dados se desconectar | Durable - reconecta de onde parou |
| Infraestrutura | Gerenciar servidor de WS | Serverless, zero infra |
| Escalabilidade | Complexa (sticky sessions) | Ilimitada |
| API | Implementar do zero | REST simples (append/read/tail) |
| Latência | Depende | p99 < 50ms (Express) |

**Modelo de uso para GitWorld:**
```
┌─────────────────┐
│   GAME CORE     │
│                 │
│  a cada tick:   │
│  para cada user │────────► S2 APPEND ────► s2://gitworld/user/{id}
│  online:        │
│  - filtra raio  │
│  - serializa    │
└─────────────────┘
                                                      │
                                                      ▼
┌─────────────────┐                          ┌───────────────┐
│   FRONTEND      │◄──── S2 READ (tail) ─────│ Stream durável│
│                 │                          │ por jogador   │
│  - reconecta    │                          └───────────────┘
│    automatico   │
│  - continua de  │
│    onde parou   │
└─────────────────┘
```

**API S2 (simplificada):**
```typescript
// Server: append game state
await fetch(`https://api.s2.dev/v1/basins/gitworld/streams/user-${userId}`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${S2_TOKEN}` },
  body: JSON.stringify({
    tick: currentTick,
    player: serializeEntity(playerEntity),
    entidades: nearbyEntities,
    eventos: events
  })
})

// Client: tail stream (real-time)
const response = await fetch(
  `https://api.s2.dev/v1/basins/gitworld/streams/user-${userId}/records?start_seq_num=latest`,
  { headers: { 'Authorization': `Bearer ${S2_TOKEN}` } }
)
// Response streams records as they're appended
```

**Pricing S2:**
- $10 crédito grátis (sem cartão)
- Storage: $0.05/GiB/mês
- Append: $0.0000001 por operação
- Read: $0.0000010 por operação
- **Para GitWorld:** ~$5-20/mês para milhares de jogadores

---

### Tarefas

| # | Tarefa | Dependência |
|---|--------|-------------|
| D1 | Setup monorepo (packages: web, server, shared) | - |
| D2 | Setup S2.dev (criar basin, tokens) | - |
| D3 | S2 Publisher: append game state | D2, B11 |
| D4 | S2 Consumer: hook no frontend | D2 |
| D5 | Schema do banco (players, battles) | D1 |
| D6 | Migrations | D5 |
| D7 | Conexão com banco (Prisma ou raw) | D5 |
| D8 | Salvar/carregar jogador | D7 |
| D9 | Broadcast filtrado por raio | D3, B11 |
| D10 | Dockerfile para backend | D1 |
| D11 | Deploy frontend (Vercel) | A1 |
| D12 | Deploy backend (Fly.io ou Railway) | D10 |
| D13 | CI/CD (GitHub Actions) | D1 |
| D14 | Variáveis de ambiente | D1 |

### Schema do Banco

```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id BIGINT UNIQUE NOT NULL,
  github_login VARCHAR(255) NOT NULL,

  -- Stats calculados
  hp INT NOT NULL,
  dano INT NOT NULL,
  velocidade INT NOT NULL,
  critico INT NOT NULL,
  evasao INT NOT NULL,
  armadura INT NOT NULL,

  -- Reino
  reino VARCHAR(50) NOT NULL,

  -- Posição atual
  x FLOAT NOT NULL DEFAULT 5000,
  y FLOAT NOT NULL DEFAULT 5000,

  -- Ranking
  vitorias INT NOT NULL DEFAULT 0,
  derrotas INT NOT NULL DEFAULT 0,

  -- Metadata
  last_github_sync TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID REFERENCES players(id),
  player2_id UUID REFERENCES players(id),
  winner_id UUID REFERENCES players(id),

  duration_ms INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## DEPENDÊNCIAS ENTRE BLOCOS

```
BLOCO A (Frontend)
  └── Depende de D2 (SSE stream)

BLOCO B (Game Core)
  └── Depende de C11 (dados do jogador)
  └── Fornece para D7 (estado para broadcast)

BLOCO C (GitHub)
  └── Independente (pode começar imediatamente)
  └── Fornece para B10 (criar jogador)

BLOCO D (Infra)
  └── Independente (pode começar imediatamente)
  └── Fornece para todos (estrutura base)
```

---

## ORDEM DE PRIORIDADE

### Fase 1 - Fundação (paralelo)
```
D1 → Setup monorepo
C1 → Setup Clerk
A1 → Setup React + Three.js
B1 → Setup backend
```

### Fase 2 - Core (paralelo após Fase 1)
```
A2-A5 → Renderização básica
B2-B6 → Entidades e movimento
C3-C8 → Fetcher + Stats
D2-D5 → SSE + Banco
```

### Fase 3 - Integração
```
A10 → Conectar frontend ao stream
B10-B11 → API de jogadores + broadcast
C11 → Endpoint /me
D6-D7 → Persistência + broadcast filtrado
```

### Fase 4 - Combate e Polish
```
A6-A12 → Animações e efeitos
B7-B9 → Decision + Combat + Death
```

---

## ESTRUTURA DE PASTAS SUGERIDA

```
gitworld/
├── src/
│   ├── GitWorld.Api/              # BLOCO B + C + D - Backend .NET
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs
│   │   │   └── PlayerController.cs
│   │   ├── Core/                  # Game loop, systems
│   │   │   ├── GameLoop.cs
│   │   │   ├── World.cs
│   │   │   ├── Entity.cs
│   │   │   └── Systems/
│   │   │       ├── MovementSystem.cs
│   │   │       ├── CombatSystem.cs
│   │   │       ├── DecisionSystem.cs
│   │   │       └── DeathSystem.cs
│   │   ├── GitHub/                # BLOCO C
│   │   │   ├── GitHubFetcher.cs
│   │   │   ├── StatsCalculator.cs
│   │   │   └── Models/
│   │   ├── Stream/                # S2 integration
│   │   │   └── S2Publisher.cs
│   │   ├── Data/                  # EF Core / Dapper
│   │   │   ├── AppDbContext.cs
│   │   │   └── Migrations/
│   │   ├── Program.cs
│   │   └── GitWorld.Api.csproj
│   │
│   └── GitWorld.Shared/           # Tipos compartilhados
│       ├── Types.cs
│       ├── Constants.cs
│       └── GitWorld.Shared.csproj
│
├── web/                           # BLOCO A - Frontend React
│   ├── src/
│   │   ├── components/
│   │   ├── three/                 # Cena, câmera, personagens
│   │   │   ├── Scene.tsx
│   │   │   ├── Camera.tsx
│   │   │   ├── Player.tsx
│   │   │   └── Map.tsx
│   │   ├── hooks/
│   │   │   ├── useS2Stream.ts
│   │   │   └── useGame.ts
│   │   └── stores/                # Zustand
│   ├── package.json
│   └── vite.config.ts
│
├── GitWorld.sln
├── .env.example
└── docker-compose.yml
```

---

## PRÓXIMO PASSO

Todas as decisões foram tomadas. Podemos começar a implementação.

**Stack Final:**
- Backend: .NET 8 / C# / ASP.NET Core
- Frontend: React + Vite + Three.js (React Three Fiber)
- Streaming: S2.dev
- Banco: PostgreSQL
- Deploy: Fly.io (backend) + Vercel (frontend)

**Sugestão:** Começar criando a estrutura base do projeto (.NET solution + React app).
