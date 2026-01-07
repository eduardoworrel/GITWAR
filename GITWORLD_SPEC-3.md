# GitWorld - Game Design Document (GDD)

## Visão Geral

**GitWorld** é um MMO 2D passivo onde jogadores fazem login via GitHub OAuth e um personagem é criado automaticamente no mundo. O jogador **apenas observa** seu personagem interagir e lutar - não há controle direto.

Os stats e características do personagem são derivados **exclusivamente** dos dados da conta GitHub do usuário.

---

## Conceito Core

- **Mundo aberto 2D** com reinos baseados em linguagens de programação
- **PVP automático** - personagens lutam sozinhos quando se encontram
- **Passivo** - usuário apenas assiste, não controla
- **Stats dinâmicos** - mudam conforme atividade real no GitHub

---

## Sistema de Reinos

### Definição do Reino do Jogador

```
reino = linguagem_de_programação com maior número de commits
```

Em caso de empate: linguagem usada mais recentemente.

### Dados de Popularidade (Base para Tamanho dos Territórios)

Dados baseados no GitHut 2.0 e GitHub Octoverse 2024-2025:

| Rank | Linguagem | % Share (aprox) | Tamanho Território |
|------|-----------|-----------------|-------------------|
| 1 | Python | ~17% | Muito Grande |
| 2 | Java | ~12% | Grande |
| 3 | Go | ~10% | Grande |
| 4 | JavaScript | ~10% | Grande |
| 5 | C++ | ~9% | Médio-Grande |
| 6 | TypeScript | ~8% | Médio-Grande |
| 7 | PHP | ~5% | Médio |
| 8 | Ruby | ~5% | Médio |
| 9 | C | ~4% | Médio |
| 10 | C# | ~4% | Médio |
| 11 | Rust | ~3% | Pequeno |
| 12 | Shell | ~3% | Pequeno |
| 13 | Kotlin | ~2% | Pequeno |
| 14 | Swift | ~2% | Pequeno |
| 15 | Scala | ~1% | Muito Pequeno |

**Linguagens fora do top 15** (Lua, Perl, R, Haskell, Elixir, Dart, etc.): jogadores são alocados no reino da linguagem mais semanticamente próxima ou na segunda linguagem mais usada.

### Cálculo de Área do Território

```typescript
const MAPA_WIDTH = 10000
const MAPA_HEIGHT = 10000
const AREA_TOTAL_MAPA = MAPA_WIDTH * MAPA_HEIGHT // 100M unidades²

const LINGUAGENS_SHARE: Record<string, number> = {
  'Python': 17,
  'Java': 12,
  'Go': 10,
  'JavaScript': 10,
  'C++': 9,
  'TypeScript': 8,
  'PHP': 5,
  'Ruby': 5,
  'C': 4,
  'C#': 4,
  'Rust': 3,
  'Shell': 3,
  'Kotlin': 2,
  'Swift': 2,
  'Scala': 1,
}

function calcularAreaReino(linguagem: string): number {
  const percentual = LINGUAGENS_SHARE[linguagem] || 1
  return AREA_TOTAL_MAPA * (percentual / 100)
}

// Exemplo:
// Python: ~17M unidades² (maior reino)
// Scala: ~1M unidades² (menor reino)
```

### Mapa do Mundo

Reinos são regiões geográficas com tamanho proporcional à popularidade da linguagem.

```
┌──────────┬─────────────────────────────────────────────────────┬──────────┐
│          │                                                     │          │
│  SWIFT   │                       RUST                          │  KOTLIN  │
│   (2%)   │                       (3%)                          │   (2%)   │
│          │                                                     │          │
├──────────┼──────────────────────┬──────────────────────────────┼──────────┤
│          │                      │                              │          │
│   RUBY   │                      │                              │    C#    │
│   (5%)   │         GO           │           JAVA               │   (4%)   │
│          │        (10%)         │           (12%)              │          │
│          │                      │                              │          │
├──────────┤                      │                              ├──────────┤
│          │                      │                              │          │
│  SHELL   ├──────────────────────┴──────────────────────────────┤   PHP    │
│   (3%)   │                                                     │   (5%)   │
│          │                                                     │          │
├──────────┤                    PYTHON                           ├──────────┤
│          │                     (17%)                           │          │
│    C     │                                                     │  SCALA   │
│   (4%)   │                 (maior território)                  │   (1%)   │
│          │                                                     │          │
├──────────┼─────────────────────────────────────────────────────┼──────────┤
│          │                                                     │          │
│          │                   JAVASCRIPT                        │TYPESCRIPT│
│   C++    │                      (10%)                          │   (8%)   │
│   (9%)   │                                                     │          │
│          │                                                     │          │
│          │                                                     │          │
└──────────┴─────────────────────────────────────────────────────┴──────────┘
```

### Estrutura de Dados do Mapa

```typescript
interface Reino {
  nome: string
  linguagem: string
  cor: string
  bounds: {
    x: number      // canto superior esquerdo
    y: number
    width: number
    height: number
  }
  spawnPoints: Array<{ x: number, y: number }>
  vizinhos: string[]  // reinos adjacentes
}

const REINOS: Record<string, Reino> = {
  'python': {
    nome: 'Reino Python',
    linguagem: 'Python',
    cor: '#3776AB',
    bounds: { x: 1000, y: 4000, width: 5000, height: 2500 },
    spawnPoints: [
      { x: 3500, y: 5250 },
      { x: 2500, y: 4500 },
      { x: 4500, y: 5000 },
    ],
    vizinhos: ['go', 'java', 'javascript', 'c', 'shell', 'ruby']
  },
  // ... demais reinos
}
```

### Cores dos Reinos

```typescript
const CORES_REINO: Record<string, number> = {
  'Python': 0x3776AB,      // Azul
  'Java': 0xED8B00,        // Laranja
  'Go': 0x00ADD8,          // Ciano
  'JavaScript': 0xF7DF1E,  // Amarelo
  'C++': 0x00599C,         // Azul escuro
  'TypeScript': 0x3178C6,  // Azul royal
  'PHP': 0x777BB4,         // Roxo
  'Ruby': 0xCC342D,        // Vermelho
  'C': 0x555555,           // Cinza
  'C#': 0x239120,          // Verde
  'Rust': 0xDEA584,        // Cobre/Laranja
  'Shell': 0x89E051,       // Verde claro
  'Kotlin': 0x7F52FF,      // Roxo
  'Swift': 0xFA7343,       // Laranja claro
  'Scala': 0xDC322F,       // Vermelho escuro
}
```

### Mapeamento de Linguagens Raras

Linguagens fora do top 15 são mapeadas para o reino mais próximo semanticamente:

```typescript
const MAPEAMENTO_LINGUAGENS_RARAS: Record<string, string> = {
  // Linguagens funcionais → Scala
  'Haskell': 'Scala',
  'Elixir': 'Scala',
  'Erlang': 'Scala',
  'Clojure': 'Scala',
  'F#': 'Scala',
  
  // Linguagens de scripting → Python
  'Perl': 'Python',
  'Lua': 'Python',
  'R': 'Python',
  'Julia': 'Python',
  
  // Linguagens mobile → Swift/Kotlin
  'Dart': 'Kotlin',
  'Objective-C': 'Swift',
  
  // Linguagens sistemas → Rust/C++
  'Zig': 'Rust',
  'Nim': 'Rust',
  'D': 'C++',
  
  // Linguagens web → JavaScript/TypeScript
  'CoffeeScript': 'JavaScript',
  'Elm': 'TypeScript',
  'ReasonML': 'TypeScript',
  
  // Linguagens legadas → Java/C#
  'COBOL': 'Java',
  'Fortran': 'C',
  'Pascal': 'C',
  'Visual Basic': 'C#',
  'Groovy': 'Java',
}

function getReinoParaLinguagem(linguagem: string): string {
  // Se é uma linguagem principal, retorna ela mesma
  if (LINGUAGENS_SHARE[linguagem]) {
    return linguagem.toLowerCase()
  }
  
  // Se tem mapeamento, usa o mapeamento
  if (MAPEAMENTO_LINGUAGENS_RARAS[linguagem]) {
    return MAPEAMENTO_LINGUAGENS_RARAS[linguagem].toLowerCase()
  }
  
  // Fallback: Python (maior reino)
  return 'python'
}
```

### Comportamento Territorial

- Reinos servem como **demarcação visual** e **direcionamento**
- Personagens são impelidos a ir em direção a reinos inimigos para confronto
- Tamanho do território é proporcional à popularidade da linguagem
- Não há bônus ou penalidades territoriais no MVP

---

## Sistema de Stats de Combate

### HP (Pontos de Vida)

```javascript
HP = dias_desde_criação_conta
```

Simples, direto. Contas mais antigas = mais HP.

**Fonte GitHub:** `created_at`

---

### Dano

```javascript
dano = (commits_total / 100) 
     + (linhas_adicionadas / 10000)
     + (releases × 5)
     + (forks_recebidos × 2)
```

**Fontes GitHub:**
- `commits_total` - via API de eventos ou contribution graph
- `linhas_adicionadas` - agregado dos repositórios
- `releases` - total de releases criadas
- `forks_recebidos` - soma de forks de todos os repos

---

### Velocidade de Ataque

```javascript
velocidade = commits_30d 
           + (PRs_abertas_30d × 3)
           + (issues_abertas_30d × 2)
           + (commits_7d × 2)
```

**Fontes GitHub:**
- `commits_30d` - commits nos últimos 30 dias
- `commits_7d` - commits nos últimos 7 dias
- `PRs_abertas_30d` - pull requests abertas nos últimos 30 dias
- `issues_abertas_30d` - issues abertas nos últimos 30 dias

---

### Chance de Crítico (%)

```javascript
crit = (PRs_merged / PRs_total × 40)
     + (média_stars_por_repo × 2)
     + (code_reviews_feitos / 50)

// CAP: máximo 50%
```

**Fontes GitHub:**
- `PRs_merged` - pull requests aceitas
- `PRs_total` - total de pull requests abertas
- `média_stars_por_repo` - `stars_total / repos_total`
- `code_reviews_feitos` - reviews em PRs de outros

---

### Evasão (%)

```javascript
evasão = (repos_externos_contribuídos × 2)
       + (orgs × 3)
       + (followers / 100)
       + (linguagens_válidas × 2)

// CAP: máximo 30%
```

**Fontes GitHub:**
- `repos_externos_contribuídos` - repos de outros onde contribuiu
- `orgs` - número de organizações que participa
- `followers` - seguidores
- `linguagens_válidas` - linguagens com >= 5% dos commits

---

### Armadura

```javascript
armadura = (issues_fechadas × 2)
         + (PRs_revisadas × 3)
         + (commits_repos_alheios)
         + (discussions_respondidas)
```

**Fontes GitHub:**
- `issues_fechadas` - issues que o usuário fechou
- `PRs_revisadas` - code reviews feitos
- `commits_repos_alheios` - commits em repositórios de outros
- `discussions_respondidas` - respostas em GitHub Discussions

---

## Sistema de Versatilidade (Linguagens)

### Cálculo de Linguagens Válidas

```javascript
// Para cada linguagem:
peso = commits_nessa_linguagem / total_commits

// Só conta se for relevante (evita gaming com 1 commit)
if (peso >= 0.05) { // 5% dos commits
  linguagens_válidas++
}
```

### Bônus de Versatilidade

| Linguagens Válidas | Bônus |
|--------------------|-------|
| 1-2 | Nenhum (especialista) |
| 3-4 | +5% dano |
| 5-6 | +10% dano, +5% evasão |
| 7-8 | +15% dano, +10% evasão |
| 9-10 | +20% dano, +15% evasão |

### Bônus de Especialista (Alternativo)

```javascript
// Se >80% dos commits são em 1 linguagem:
velocidade_ataque += 25%
```

O jogador naturalmente escolhe: ser versátil ou especialista. Ambos são viáveis.

---

## Mecânica de Combate

### Fórmula de Dano

```javascript
function calcularDano(atacante, defensor) {
  let dano_base = atacante.dano
  
  // Aplicar armadura
  let dano_final = dano_base * (100 / (100 + defensor.armadura))
  
  // Checar crítico
  if (Math.random() < atacante.crit / 100) {
    dano_final *= 2
  }
  
  return Math.max(dano_final, 1) // mínimo 1 de dano
}
```

### Fórmula de Evasão

```javascript
function tentarAcertar(atacante, defensor) {
  if (Math.random() < defensor.evasão / 100) {
    return false // esquivou
  }
  return true // acertou
}
```

### Loop de Combate

```javascript
function combate(player1, player2) {
  // Velocidade determina intervalo entre ataques
  // Mais velocidade = mais ataques por segundo
  
  let intervalo_p1 = 1000 / (player1.velocidade / 50) // ms
  let intervalo_p2 = 1000 / (player2.velocidade / 50) // ms
  
  // Combate continua até um morrer
  while (player1.hp > 0 && player2.hp > 0) {
    // Player 1 ataca
    if (tentarAcertar(player1, player2)) {
      player2.hp -= calcularDano(player1, player2)
    }
    
    // Player 2 ataca
    if (tentarAcertar(player2, player1)) {
      player1.hp -= calcularDano(player2, player1)
    }
    
    // Aguardar tick baseado na velocidade
  }
  
  return player1.hp > 0 ? player1 : player2
}
```

---

## Dados do GitHub - Mapeamento Completo

### Via OAuth (Escopo Básico: `read:user`, `user:email`)

```javascript
// Perfil do usuário
GET /user

{
  "login": "username",
  "id": 12345,
  "created_at": "2015-03-14T00:00:00Z",  // → HP
  "public_repos": 42,
  "followers": 150,                       // → Evasão
  "following": 89,
  "public_gists": 5
}
```

### Via API Pública

```javascript
// Repositórios do usuário
GET /users/{username}/repos

// Para cada repo, extrair:
// - stargazers_count → Dano, Crítico
// - forks_count → Dano
// - language → Reino, Versatilidade

// Eventos do usuário (commits, PRs, issues)
GET /users/{username}/events

// Organizações
GET /users/{username}/orgs
// → Evasão

// Contribution graph (commits por dia)
// Requer scraping ou GraphQL
```

### GraphQL (Recomendado para Dados Agregados)

```graphql
query($username: String!) {
  user(login: $username) {
    createdAt
    followers { totalCount }
    following { totalCount }
    repositories(first: 100) {
      totalCount
      nodes {
        stargazerCount
        forkCount
        primaryLanguage { name }
        releases { totalCount }
      }
    }
    contributionsCollection {
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
    pullRequests(states: MERGED) { totalCount }
    issues(states: CLOSED) { totalCount }
    organizations { totalCount }
    repositoriesContributedTo { totalCount }
  }
}
```

---

## Visual - Estilo Minecraft (Voxel/Blocky)

### Stack Tecnológico

- **Three.js** para renderização 3D/2.5D
- **Personagens blocados** usando `BoxGeometry`
- **Cores sólidas** baseadas no reino (linguagem)

### Aparência Baseada em Stats

| Aspecto Visual | Determinado Por |
|----------------|-----------------|
| Tamanho do personagem | HP (dias de conta) |
| Cor principal | Reino (linguagem) |
| Tamanho da arma | Dano |
| Brilho/Aura | Stars recebidas |
| Velocidade da animação | Velocidade de ataque |

### Cores por Reino

```javascript
const CORES_REINO = {
  'Python': 0x3776AB,      // Azul
  'JavaScript': 0xF7DF1E,  // Amarelo
  'TypeScript': 0x3178C6,  // Azul escuro
  'Java': 0xED8B00,        // Laranja
  'Rust': 0xDEA584,        // Cobre
  'Go': 0x00ADD8,          // Ciano
  'Ruby': 0xCC342D,        // Vermelho
  'PHP': 0x777BB4,         // Roxo
  'C': 0x555555,           // Cinza
  'C++': 0x00599C,         // Azul
  'C#': 0x239120,          // Verde
  'Swift': 0xFA7343,       // Laranja claro
  'Kotlin': 0x7F52FF,      // Roxo
}
```

---

## Fluxo do MVP

```
1. Usuário acessa o site
2. Clica em "Login com GitHub"
3. OAuth redirect → autoriza (escopo básico)
4. Backend recebe token, busca dados da API GitHub
5. Calcula todos os stats
6. Cria/atualiza personagem no banco
7. Personagem aparece no mapa no reino correspondente
8. Personagem começa a se mover em direção a inimigos
9. Quando encontra outro personagem de reino diferente → luta
10. Usuário assiste em tempo real
11. Resultado da luta atualiza ranking
```

---

## Estrutura de Dados Sugerida

### Player

```typescript
interface Player {
  id: string
  github_id: number
  github_login: string
  github_created_at: Date
  
  // Stats calculados
  hp: number
  dano: number
  velocidade: number
  critico: number
  evasao: number
  armadura: number
  
  // Reino
  reino: string // linguagem principal
  linguagens_validas: number
  bonus_tipo: 'versatil' | 'especialista' | 'nenhum'
  
  // Posição no mundo
  x: number
  y: number
  
  // Ranking
  elo: number
  vitorias: number
  derrotas: number
  
  // Metadata
  last_github_sync: Date
  created_at: Date
  updated_at: Date
}
```

### Batalha

```typescript
interface Batalha {
  id: string
  player1_id: string
  player2_id: string
  vencedor_id: string
  
  // Log para replay
  log: BatalhaEvento[]
  
  // Stats no momento da luta
  player1_stats: PlayerStats
  player2_stats: PlayerStats
  
  // Resultado
  dano_dado_p1: number
  dano_dado_p2: number
  duracao_ms: number
  
  created_at: Date
}

interface BatalhaEvento {
  tick: number
  atacante: string
  tipo: 'hit' | 'miss' | 'crit'
  dano: number
  hp_restante_alvo: number
}
```

---

## Game Core (Engine)

O Core é o **cérebro central** que dá vida ao jogo. Ele:

1. **Conhece todos os personagens** e seus stats
2. **Decide ações** para cada um (mover, atacar)
3. **Executa as ações** (atualiza posições, calcula dano)
4. **Propaga o estado** para quem estiver assistindo

### Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        GAME CORE                            │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   WORLD     │    │   ENTITIES  │    │   SYSTEMS   │     │
│  │             │    │             │    │             │     │
│  │ - Mapa      │    │ - Players   │    │ - Decision  │     │
│  │ - Regiões   │    │ - Stats     │    │ - Movement  │     │
│  │ - Spawns    │    │ - Posição   │    │ - Combat    │     │
│  │             │    │ - Estado    │    │ - Death     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    GAME LOOP                         │   │
│  │                                                      │   │
│  │   while (running) {                                  │   │
│  │     deltaTime = now - lastTick                       │   │
│  │                                                      │   │
│  │     DecisionSystem.update(entities, world)           │   │
│  │     MovementSystem.update(entities, deltaTime)       │   │
│  │     CombatSystem.update(entities)                    │   │
│  │     DeathSystem.update(entities)                     │   │
│  │                                                      │   │
│  │     broadcastState(entities)                         │   │
│  │                                                      │   │
│  │     lastTick = now                                   │   │
│  │     sleep(TICK_RATE)                                 │   │
│  │   }                                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    [ Clientes assistem ]
```

> **Nota sobre "AI"**: Os sistemas de decisão usam lógica determinística simples (if/else, state machines), **não** inteligência artificial generativa (LLMs, ML, etc). É apenas código que decide o comportamento dos personagens.

### Componentes

#### World (Mundo)

```typescript
interface World {
  width: number
  height: number
  reinos: Map<string, Regiao>  // 'python' -> {bounds, spawnPoints}
  
  // Spatial indexing para detectar proximidade
  getEntitiesInRadius(x: number, y: number, radius: number): Entity[]
  getRegiao(x: number, y: number): string  // retorna reino
}
```

#### Entity (Personagem)

```typescript
interface Entity {
  id: string
  
  // Identidade
  githubLogin: string
  reino: string
  
  // Stats (calculados do GitHub)
  hp: number
  hpMax: number
  dano: number
  velocidade: number
  critico: number
  evasao: number
  armadura: number
  
  // Estado atual
  x: number
  y: number
  estado: 'idle' | 'moving' | 'fighting' | 'dead'
  alvo: string | null  // id do alvo atual
  
  // Combate
  cooldownAtaque: number  // ms até poder atacar de novo
}
```

### Systems (Lógica de Jogo)

#### DecisionSystem - Decide o que cada personagem faz

```typescript
class DecisionSystem {
  update(entities: Map<string, Entity>, world: World) {
    for (const entity of entities.values()) {
      if (entity.estado === 'dead') continue
      
      // Se não tem alvo, procurar um
      if (!entity.alvo) {
        const alvo = this.encontrarAlvo(entity, entities, world)
        if (alvo) {
          entity.alvo = alvo.id
          entity.estado = 'moving'
        } else {
          // Vagar pelo mundo em direção a reinos inimigos
          this.definirDestinoVagar(entity, world)
        }
      }
      
      // Se tem alvo, verificar se ainda é válido
      if (entity.alvo) {
        const alvo = entities.get(entity.alvo)
        if (!alvo || alvo.estado === 'dead') {
          entity.alvo = null
          entity.estado = 'idle'
        }
      }
    }
  }
  
  encontrarAlvo(entity: Entity, entities: Map<string, Entity>, world: World): Entity | null {
    const proximos = world.getEntitiesInRadius(entity.x, entity.y, RANGE_VISAO)
    
    // Filtrar: inimigos (reino diferente), vivos
    const inimigos = proximos.filter(e => 
      e.reino !== entity.reino && 
      e.estado !== 'dead'
    )
    
    // Retornar o mais próximo
    return this.maisProximo(entity, inimigos)
  }
  
  definirDestinoVagar(entity: Entity, world: World) {
    // Encontrar direção para reino inimigo mais próximo
    const reinoInimigo = world.getReinoInimigoMaisProximo(entity.x, entity.y, entity.reino)
    entity.destinoX = reinoInimigo.centro.x
    entity.destinoY = reinoInimigo.centro.y
    entity.estado = 'moving'
  }
}
```

#### MovementSystem - Move os personagens

```typescript
class MovementSystem {
  update(entities: Map<string, Entity>, deltaTime: number) {
    for (const entity of entities.values()) {
      if (entity.estado !== 'moving') continue
      
      // Determinar destino (alvo ou ponto de vagar)
      let destinoX: number, destinoY: number
      
      if (entity.alvo) {
        const alvo = entities.get(entity.alvo)
        if (!alvo) continue
        destinoX = alvo.x
        destinoY = alvo.y
      } else {
        destinoX = entity.destinoX
        destinoY = entity.destinoY
      }
      
      // Calcular direção
      const dx = destinoX - entity.x
      const dy = destinoY - entity.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      // Se está perto o suficiente para atacar
      if (entity.alvo && dist < RANGE_ATAQUE) {
        entity.estado = 'fighting'
        continue
      }
      
      // Mover em direção ao destino
      const velocidadeReal = entity.velocidade * (deltaTime / 1000)
      entity.x += (dx / dist) * velocidadeReal
      entity.y += (dy / dist) * velocidadeReal
    }
  }
}
```

#### CombatSystem - Resolve combates

```typescript
class CombatSystem {
  update(entities: Map<string, Entity>, deltaTime: number) {
    for (const entity of entities.values()) {
      if (entity.estado !== 'fighting') continue
      
      // Reduzir cooldown
      entity.cooldownAtaque -= deltaTime
      if (entity.cooldownAtaque > 0) continue
      
      const alvo = entities.get(entity.alvo)
      if (!alvo || alvo.estado === 'dead') {
        entity.estado = 'idle'
        entity.alvo = null
        continue
      }
      
      // Verificar distância (alvo pode ter se movido)
      const dist = this.distancia(entity, alvo)
      if (dist > RANGE_ATAQUE) {
        entity.estado = 'moving'
        continue
      }
      
      // Atacar
      this.atacar(entity, alvo)
      
      // Reset cooldown baseado na velocidade
      entity.cooldownAtaque = 1000 / (entity.velocidade / 50)
    }
  }
  
  atacar(atacante: Entity, defensor: Entity) {
    // Checar evasão
    if (Math.random() < defensor.evasao / 100) {
      this.emitEvento('miss', atacante, defensor)
      return
    }
    
    // Calcular dano
    let dano = atacante.dano * (100 / (100 + defensor.armadura))
    
    // Checar crítico
    const critico = Math.random() < atacante.critico / 100
    if (critico) {
      dano *= 2
    }
    
    dano = Math.max(Math.floor(dano), 1)
    defensor.hp -= dano
    
    this.emitEvento(critico ? 'crit' : 'hit', atacante, defensor, dano)
  }
  
  distancia(a: Entity, b: Entity): number {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.sqrt(dx * dx + dy * dy)
  }
}
```

#### DeathSystem - Gerencia mortes e respawn

```typescript
class DeathSystem {
  update(entities: Map<string, Entity>, world: World) {
    for (const entity of entities.values()) {
      if (entity.hp <= 0 && entity.estado !== 'dead') {
        entity.estado = 'dead'
        entity.alvo = null
        
        this.emitEvento('death', entity)
        
        // Agendar respawn
        setTimeout(() => {
          this.respawn(entity, world)
        }, TEMPO_RESPAWN)
      }
    }
  }
  
  respawn(entity: Entity, world: World) {
    const spawn = world.reinos.get(entity.reino).getRandomSpawn()
    entity.x = spawn.x
    entity.y = spawn.y
    entity.hp = entity.hpMax
    entity.estado = 'idle'
    entity.alvo = null
    
    this.emitEvento('respawn', entity)
  }
}
```

### Game Loop Principal

```typescript
class GameCore {
  private world: World
  private entities: Map<string, Entity> = new Map()
  
  private decisionSystem: DecisionSystem
  private movementSystem: MovementSystem
  private combatSystem: CombatSystem
  private deathSystem: DeathSystem
  
  private lastTick: number = Date.now()
  private running: boolean = false
  
  // Callback para broadcast
  private onStateChange: (state: GameState) => void
  
  constructor(onStateChange: (state: GameState) => void) {
    this.world = new World()
    this.decisionSystem = new DecisionSystem()
    this.movementSystem = new MovementSystem()
    this.combatSystem = new CombatSystem()
    this.deathSystem = new DeathSystem()
    this.onStateChange = onStateChange
  }
  
  start() {
    this.running = true
    this.loop()
  }
  
  stop() {
    this.running = false
  }
  
  private loop() {
    if (!this.running) return
    
    const now = Date.now()
    const deltaTime = now - this.lastTick
    
    // Update all systems
    this.decisionSystem.update(this.entities, this.world)
    this.movementSystem.update(this.entities, deltaTime)
    this.combatSystem.update(this.entities, deltaTime)
    this.deathSystem.update(this.entities, this.world)
    
    // Broadcast state
    this.onStateChange(this.getState())
    
    this.lastTick = now
    
    // Next tick
    setTimeout(() => this.loop(), TICK_RATE)
  }
  
  // API externa
  addPlayer(player: PlayerData) {
    const entity = this.createEntityFromPlayer(player)
    this.entities.set(entity.id, entity)
  }
  
  removePlayer(playerId: string) {
    this.entities.delete(playerId)
  }
  
  getState(): GameState {
    return {
      timestamp: Date.now(),
      entities: Array.from(this.entities.values()).map(e => ({
        id: e.id,
        x: e.x,
        y: e.y,
        hp: e.hp,
        hpMax: e.hpMax,
        estado: e.estado,
        reino: e.reino
      }))
    }
  }
}
```

### Onde o Core Roda

O Core é **agnóstico de transporte**. O `onStateChange` callback conecta ao broadcast:

```typescript
// Exemplo com WebSocket
const wss = new WebSocketServer({ port: 8080 })
const clients = new Set<WebSocket>()

const game = new GameCore((state) => {
  const payload = JSON.stringify(state)
  for (const client of clients) {
    client.send(payload)
  }
})

game.start()
```

Pode rodar em: Node.js, PartyKit, Cloudflare Workers, .NET, ou qualquer servidor.

---

## Arquitetura de Streaming

### Modelo de Transmissão

- Câmera **sempre centrada** no personagem do usuário
- Usuário **não controla** nada, apenas assiste
- Cliente recebe **apenas eventos ao redor do seu personagem**
- Usar **Stream (S2/SSE)** ao invés de WebSocket - comunicação é unidirecional (server → client)

### Por que Stream e não WebSocket?

| Aspecto | WebSocket | Stream (S2/SSE) |
|---------|-----------|-----------------|
| **Direção** | Bidirecional | Unidirecional (server → client) |
| **Overhead** | Maior (handshake, frames) | Menor (só HTTP) |
| **Reconexão** | Manual | Automática (SSE) |
| **Necessidade GitWorld** | ❌ Cliente não envia nada | ✅ Só server → client |

### Arquitetura

```
┌─────────────────────────────────────────┐
│              GAME CORE                  │
│                                         │
│  - Processa todo o mundo                │
│  - Para cada user online:               │
│    - Filtra entidades no raio de visão  │
│    - Envia só o relevante               │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Stream por User (S2)            │
│                                         │
│  Topic: gitworld/user/{user_id}         │
│                                         │
│  Conteúdo:                              │
│  - Seu char (posição, hp, estado)       │
│  - Entidades no raio de visão           │
│  - Combates visíveis                    │
│  - Mortes/respawns visíveis             │
└─────────────────────────────────────────┘
```

### Lógica de Broadcast Filtrado

```typescript
const RAIO_VISAO = 500 // unidades do mapa

function broadcast(onlineUsers: Map<string, User>, entities: Map<string, Entity>) {
  for (const user of onlineUsers.values()) {
    const meuChar = entities.get(user visão do user.odId)
    if (!meuChar) continue
    
    // Filtra só entidades próximas
    const visiveis = Array.from(entities.values()).filter(e => 
      e.id !== meuChar.id && 
      distancia(e, meuChar) <= RAIO_VISAO
    )
    
    // Envia pro stream do user
    s2.publish(`gitworld/user/${user.id}`, {
      tick: currentTick,
      timestamp: Date.now(),
      player: serializeEntity(meuChar),
      entidades: visiveis.map(serializeEntity),
      eventos: getEventosVisiveis(meuChar, RAIO_VISAO)
    })
  }
}

function distancia(a: Entity, b: Entity): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}
```

### Payload do Stream

```typescript
interface StreamPayload {
  tick: number
  timestamp: number
  
  // Seu personagem (sempre presente)
  player: {
    id: string
    x: number
    y: number
    hp: number
    hpMax: number
    estado: 'idle' | 'moving' | 'fighting' | 'dead'
    alvoId: string | null
    reino: string
  }
  
  // Entidades visíveis (outros chars no raio de visão)
  entidades: Array<{
    id: string
    x: number
    y: number
    hp: number
    hpMax: number
    estado: string
    reino: string
    alvoId: string | null
  }>
  
  // Eventos que aconteceram nesse tick
  eventos: Array<{
    tipo: 'hit' | 'miss' | 'crit' | 'death' | 'respawn'
    atacanteId?: string
    alvoId?: string
    dano?: number
  }>
}
```

### Vantagens deste Modelo

| Aspecto | Benefício |
|---------|-----------|
| **Tráfego** | Cada cliente recebe ~50-100 entidades, não milhares |
| **Simplicidade** | Um stream por user, sem gestão de chunks |
| **Segurança** | Não vaza posição de chars fora do campo de visão |
| **Performance cliente** | Renderiza só o necessário |

### Estrutura de Topics S2

```
gitworld/user/{user_id}  → stream personalizado por usuário
```

---

## Considerações Técnicas

### Rate Limits GitHub API

- **Sem autenticação:** 60 req/hora
- **Com OAuth token:** 5000 req/hora
- **GraphQL:** 5000 pontos/hora

**Recomendação:** Usar GraphQL para buscar tudo de uma vez, cachear por 1 hora.

### Atualização de Stats

| Frequência | Ação |
|------------|------|
| No login | Sync completo com GitHub |
| A cada 1 hora | Re-sync se usuário online |
| Via webhook (futuro) | Atualização em tempo real |

### Escalabilidade

- Personagens só existem "ativos" se usuário logou nas últimas 24h
- Combates são server-side, broadcast para clientes
- Mapa pode ser dividido em chunks/regiões

---

## Próximos Passos Sugeridos

1. **Setup do projeto**
   - Frontend: React + Vite + Three.js
   - Backend: Go ou .NET (Game Core)
   - Streaming: S2.dev
   - Auth: Clerk (GitHub OAuth)
   - DB: PostgreSQL

2. **OAuth GitHub** - Login via Clerk + fetch de dados GitHub API
3. **Cálculo de stats** - Implementar fórmulas
4. **Game Core** - Loop principal, systems (Decision, Movement, Combat, Death)
5. **Streaming** - Configurar S2, broadcast filtrado por raio de visão
6. **Renderização** - Three.js, personagens estilo Minecraft
7. **Mapa** - Reinos e spawn points
8. **Frontend** - UI de observação
9. **Ranking** - Sistema de Elo
