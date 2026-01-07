# GitWorld

MMO 3D passivo onde jogadores logam via OAuth (GitHub, GitLab, HuggingFace) e assistem seus personagens auto-batalhar em um mundo dividido por linguagens de programação. Stats derivados da atividade no GitHub/GitLab.

**Produção:** https://gitwar.eduardoworrel.com

## Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Web         │◄────│    S2.dev       │◄────│      API        │
│  React + Three  │ SSE │   (Streaming)   │     │   .NET 10       │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                    ┌────▼────┐
                                                    │PostgreSQL│
                                                    └─────────┘
```

- **API** (.NET 10): Game loop 20 ticks/s, auth Clerk, broadcast via S2.dev
- **Web** (React 19 + Three.js): Renderização 3D, SSE para estado em tempo real
- **S2.dev**: Stream de eventos para sincronização cliente-servidor

## Executar Localmente

```bash
# 1. Clonar e configurar
git clone <repo>
cp .env.example .env  # Configurar variáveis se necessário

# 2. Subir tudo (PostgreSQL + API)
docker compose build && docker compose up -d

# 3. Frontend (em outro terminal)
cd web
npm install
npm run dev
```

**URLs locais:**
- API: http://localhost:5138
- Web: http://localhost:5173

## Estrutura

```
.
├── src/
│   ├── GitWorld.Api/       # Backend .NET
│   │   ├── Program.cs      # Entry point + game loop
│   │   ├── Core/           # Sistemas (Movement, Events, Combat)
│   │   ├── Auth/           # Validação JWT Clerk
│   │   ├── Stream/         # Integração S2.dev
│   │   └── GitHub/         # Fetch de stats do usuário
│   └── GitWorld.Shared/    # Tipos compartilhados
├── web/                    # Frontend React
│   ├── src/three/          # Componentes 3D (Player, Map, Camera)
│   ├── src/components/     # UI (Login, Minimap, Modals)
│   ├── src/stores/         # Zustand (estado global)
│   └── src/hooks/          # useS2Stream, useSpectatorMode
├── .do/app.yaml            # Config DigitalOcean
├── docker-compose.yml      # Dev local
└── deploy.sh               # Script de deploy
```

## Tecnologias

| Camada | Stack |
|--------|-------|
| Backend | .NET 10, Entity Framework, PostgreSQL |
| Frontend | React 19, Three.js, React Three Fiber, Zustand |
| Auth | Clerk (GitHub, GitLab, HuggingFace OAuth) |
| Streaming | S2.dev (SSE) |
| Deploy | DigitalOcean App Platform |

## Deploy (Produção)

```bash
./deploy.sh api    # Só API
./deploy.sh web    # Só Web
./deploy.sh all    # Tudo
```

## Variáveis de Ambiente

### API
| Variável | Descrição |
|----------|-----------|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string |
| `S2__Token`, `S2__Basin` | Credenciais S2.dev |
| `Clerk__Domain`, `Clerk__SecretKey` | Auth Clerk |
| `GITHUB_TOKEN` | Para fetch de stats |

### Web
| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL da API (build-time) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk frontend key |

## Game Loop

```
Server (20 ticks/s) → S2.dev stream → Web polls S2 → Zustand → Three.js
```

- Tick rate: 20/s (50ms)
- Broadcast: a cada 2 ticks (~100ms)
- Interpolação cliente: 150ms

## Regras Importantes

1. **WebGL**: Usar `meshBasicMaterial` (não `meshStandardMaterial`) para compatibilidade iOS/Safari
2. **Rotas DO**: O prefixo é removido antes de chegar no container (`/api/health` → `/health`)
3. **Docker Mac**: Build com `--platform linux/amd64`
