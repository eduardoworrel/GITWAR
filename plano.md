# Plano: Streams S2 Individuais por Usuário

## Status: IMPLEMENTADO

A implementação foi concluída. Este documento serve como referência para manutenção e possíveis ajustes.

---

## 1. O Que Foi Implementado

### Backend (.NET)

#### 1.1 S2TokenService (`src/GitWorld.Api/Services/S2TokenService.cs`)
- Novo serviço para criar tokens read-only via API S2
- Endpoint: `POST https://aws.s2.dev/v1/access-tokens`
- Token com escopo limitado ao stream do player (`streams.exact = "player-{playerId}"`)
- Expiração padrão de 24 horas

#### 1.2 Modificações no Program.cs
- Registro do `IS2TokenService` no DI (linha ~39)
- Game loop modificado para publicar em streams individuais (linhas ~225-266):
  - **Stream individual é AUTO-SUFICIENTE** - player recebe tudo que precisa:
    - Entidades próximas (raio 500 unidades)
    - Combat events de entidades próximas (não apenas do próprio player)
    - Level ups de players próximos (para killfeed)
    - Rewards pessoais
    - ActiveEvent (eventos globais como boss spawn)
  - Stream global (`game-state`) mantido **apenas para espectadores**
  - Frontend usa **apenas um stream** por vez (individual OU global, nunca ambos)
- Endpoint `/game/join` gera token read-only para o player (linha ~835)
- Endpoint `/game/player/{id}` também gera token para reconexão (linha ~869)

#### 1.3 Modificações nos Modelos
- `StreamInfo` agora inclui `ReadToken` opcional (`src/GitWorld.Api/Models/GameModels.cs`)
- `IS2Publisher.BroadcastGameStateAsync()` aceita `streamName` opcional

### Frontend (React)

#### 1.4 GameStore (`web/src/stores/gameStore.ts`)
- Novo tipo `StreamInfo` com campos: `streamName`, `basin`, `baseUrl`, `readToken`
- Novo estado `streamInfo` para armazenar informações do stream individual
- Nova action `setStreamInfo()`

#### 1.5 App.tsx
- Salva `streamInfo` após join bem-sucedido
- Limpa `streamInfo` no logout
- Passa `streamName` e `readToken` para `useS2Stream`

#### 1.6 useS2Stream (`web/src/hooks/useS2Stream.ts`)
- Aceita novos parâmetros: `streamName` e `readToken`
- Usa stream individual quando disponível, fallback para global
- Reconecta automaticamente quando stream/token muda

---

## 2. Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│  JOGADOR FAZ LOGIN                                          │
│  POST /game/join                                            │
│       │                                                      │
│       ├── Valida token Clerk                                │
│       ├── Cria/atualiza player no DB                        │
│       ├── Cria stream S2 "player-{id}"                      │
│       ├── Gera read token via S2TokenService                │
│       └── Retorna JoinResponse com StreamInfo               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND RECEBE STREAMINFO                                 │
│       │                                                      │
│       ├── Salva em gameStore.streamInfo                     │
│       ├── Desconecta do stream global (se estava conectado) │
│       └── Conecta APENAS ao stream individual               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  GAME LOOP (20 ticks/s, broadcast a cada 2 ticks)           │
│       │                                                      │
│       ├── Para cada player online:                          │
│       │    ├── Entidades próximas (raio 500)                │
│       │    ├── Combat events de entidades próximas          │
│       │    ├── Level ups de players próximos                │
│       │    ├── Rewards pessoais                             │
│       │    ├── ActiveEvent (boss, etc)                      │
│       │    └── Append → player-{id}                         │
│       │                                                      │
│       └── Espectadores (sem auth):                          │
│            └── Append → game-state (tudo)                   │
└─────────────────────────────────────────────────────────────┘

IMPORTANTE: Frontend usa APENAS UM stream por vez:
- Autenticado: player-{id} (individual, filtrado)
- Espectador: game-state (global, tudo)
```

---

## 3. Arquivos Modificados/Criados

### Criados
- `src/GitWorld.Api/Services/S2TokenService.cs`

### Modificados
- `src/GitWorld.Api/Program.cs` (game loop, endpoints, DI)
- `src/GitWorld.Api/Stream/S2Publisher.cs` (interface e implementação)
- `src/GitWorld.Api/Models/GameModels.cs` (StreamInfo)
- `web/src/stores/gameStore.ts` (StreamInfo, streamInfo state)
- `web/src/App.tsx` (salvar streamInfo, passar para hook)
- `web/src/hooks/useS2Stream.ts` (aceitar stream individual)

---

## 4. Evidências da Documentação S2.dev

### Limites (de https://s2.dev/docs/limits)
- Streams por basin: **Ilimitado**
- Records: até 1 MiB por record
- Leitura: **Sem rate limit**

### Preços (de https://s2.dev/pricing)
- Storage: $0.05/GiB/mês
- Write: $0.05/GiB
- Read: $0.10/GiB (internet)
- Access Tokens: $10/milhão/mês
- **Free tier**: $10 em créditos

### API de Tokens (de https://s2.dev/blog/access-control)
```bash
POST https://aws.s2.dev/v1/access-tokens
{
  "basins": { "exact": "gitworld" },
  "streams": { "exact": "player-{uuid}" },
  "operations": ["read"],
  "expires_at": "2024-12-31T23:59:59Z"
}
```

---

## 5. Otimizações de Stream (IMPLEMENTADO)

### 5.1 Frequência Adaptativa
**Status: IMPLEMENTADO**

O backend agora ajusta a frequência de broadcast baseado na atividade do player:
- **Combat**: 10 updates/s (cada 2 ticks = 100ms)
- **Moving**: 5 updates/s (cada 4 ticks = 200ms)
- **Idle**: 2 updates/s (cada 10 ticks = 500ms)

Arquivos modificados:
- `src/GitWorld.Api/Core/PlayerSession.cs` - Adicionado `PlayerActivityLevel` enum e tracking
- `src/GitWorld.Api/Program.cs` - Game loop com broadcast seletivo por atividade

### 5.2 Delta Updates
**Status: IMPLEMENTADO**

O backend agora envia apenas campos que mudaram desde o último broadcast:
- Payload típico reduzido de ~500 bytes para ~50-100 bytes
- Full state enviado a cada 100 ticks (~5 segundos) para sync
- Frontend faz merge de deltas com estado existente

Arquivos modificados:
- `src/GitWorld.Api/Stream/S2Publisher.cs` - `EntityStateTracker` e `BroadcastDeltaGameStateAsync`
- `web/src/stores/gameStore.ts` - `updatePlayersPartial` action
- `web/src/hooks/useS2Stream.ts` - Suporte a `isFullState` flag

### 5.3 AppendSession
**Status: SKIPPED**

O projeto usa chamadas HTTP diretas ao S2, não um SDK .NET com suporte nativo a AppendSession.
As outras duas otimizações já trazem ganhos significativos.

---

## 6. Próximos Passos (Opcional)

### 6.1 Performance Adicional
- [ ] Implementar cache de tokens (evitar criar token a cada reconexão)
- [ ] Batch de publicação para múltiplos players
- [ ] Compressão de payload

### 6.2 Monitoramento
- [ ] Métricas de latência por stream
- [ ] Alertas de falha de publicação
- [ ] Dashboard de custos S2

### 6.3 Segurança
- [ ] Rotação automática de tokens
- [ ] Revogação de tokens em logout forçado
- [ ] Rate limiting por player

---

## 7. Testando a Implementação

### Local
```bash
# Backend
docker compose build && docker compose up -d

# Frontend (em outro terminal)
cd web && npm run dev
```

### Verificar
1. Login com GitHub/GitLab
2. Verificar no console: `[S2 Stream] Switching to stream: player-{uuid}`
3. Verificar que apenas entidades próximas são recebidas
4. Logout e verificar volta para stream global

---

## Referências

- [S2.dev Docs - Limits](https://s2.dev/docs/limits)
- [S2.dev Pricing](https://s2.dev/pricing)
- [S2.dev Blog - Access Control](https://s2.dev/blog/access-control)
- [S2.dev Blog - Stream per Agent Session](https://s2.dev/blog/agent-sessions)
- [S2 TypeScript SDK](https://s2-streamstore.github.io/s2-sdk-typescript/)
