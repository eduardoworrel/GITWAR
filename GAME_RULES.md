# GitWorld - Game Rules & Mechanics

GitWorld is a passive 2D MMO where your combat stats are calculated from your GitHub profile. Players are automatically assigned to kingdoms based on their most-used programming language and fight for territory dominance.

---

## Table of Contents
1. [Player Stats](#1-player-stats)
2. [Combat System](#2-combat-system)
3. [ELO Ranking System](#3-elo-ranking-system)
4. [Movement System](#4-movement-system)
5. [NPC/AI Behavior](#5-npcai-behavior)
6. [Territories & Kingdoms](#6-territories--kingdoms)
7. [Respawn Mechanics](#7-respawn-mechanics)
8. [Game Constants](#8-game-constants)

---

## 1. Player Stats

All player stats are calculated from GitHub profile data.

### Stat Formulas

| Stat | Formula | Minimum |
|------|---------|---------|
| **HP** | `(dias×0.5) + (commits×0.3) + (repos×10) + 200` | 200 |
| **Dano** | `30 + (commits/50) + (commits30d×2) + (stars/5) + (forks×3)` | 30 |
| **Critico %** | `5 + (commits/200) + (mergeRatio×20) + (avgStars×3) + (reviews/30)` | 5 |
| **Evasao %** | `5 + (repos/10) + langs + orgs + (extRepos/2) + (followers/500)` | 5 |
| **Armadura** | `5 + (issues×0.5) + (reviews×0.8) + (commits/100) + (extCommits/20)` | 5 |
| **Vel. Ataque** | `20 + (commits/80) + (commits7d×1.5) + (commits30d×0.5)` | 20 |
| **Vel. Movimento** | `(repos×2 + languages×5) × 2` | 0 |

### Stat Explanations

- **HP (Health Points)**: Based on account age, total commits, and number of repositories. Base of 200 ensures all players have viable HP.
- **Dano (Damage)**: Based on total commits, recent activity (commits30d), stars, and forks. Base of 30 ensures minimum damage output.
- **Critico (Critical Hit %)**: Based on total commits, PR merge ratio, average stars per repo, and code reviews. Base of 5% ensures some crit chance.
- **Evasao (Evasion %)**: Based on repos, languages used, organizations, external contributions, and followers. Base of 5% ensures some dodge chance.
- **Armadura (Armor)**: Based on issues closed, reviews given, total commits, and external commits. Base of 5 ensures some damage reduction.
- **Vel. Ataque (Attack Speed)**: Based on commit history with emphasis on recent activity (7d and 30d). Base of 20 ensures minimum attack speed.
- **Vel. Movimento (Movement Speed)**: Based on number of repositories and programming languages used.

---

## 2. Combat System

Combat is automatic and passive. Players automatically target and attack the nearest enemy from a different kingdom.

### Combat Flow

```
1. Find nearest enemy (different kingdom, alive)
2. Move toward enemy if outside attack range
3. When in range (30 units), start attacking
4. Each attack follows the damage calculation below
5. Continue until one player dies
```

### Damage Calculation

Each attack follows this sequence:

```
Step 1: Evasion Check
├─ Roll 0-100
├─ If roll < target.Evasao → MISS (0 damage)
└─ Otherwise → continue

Step 2: Base Damage
└─ damage = attacker.Dano

Step 3: Critical Check
├─ Roll 0-100
├─ If roll < attacker.Critico → damage × 1.5
└─ Otherwise → normal damage

Step 4: Armor Reduction
├─ damage = damage - target.Armadura
└─ finalDamage = max(damage, 1)
```

### Attack Cooldown

```
cooldown = max(2, 30 - VelocidadeAtaque) ticks
```

- Base cooldown: 30 ticks (1.5 seconds)
- Minimum cooldown: 2 ticks (0.1 seconds)
- Higher attack speed = faster attacks

### Combat Events

| Event | Description |
|-------|-------------|
| `damage` | Normal hit |
| `miss` | Attack evaded |
| `critical` | Critical hit (1.5× damage) |
| `kill` | Target killed |
| `death` | Player died |
| `respawn` | Player respawned |

---

## 3. ELO Ranking System

ELO is only awarded/removed for **Player vs Player** kills. NPC kills don't affect ELO.

### ELO Protection (New!)

**Players with 200+ ELO advantage will IGNORE weaker players.**

This prevents strong players from farming weak players:
- If your ELO is 200+ higher than another player, you won't target them
- The weaker player CAN still attack you (they take the risk)
- NPCs are always valid targets regardless of ELO

### ELO Formula (Balanced)

The K-factor scales based on ELO difference to reward upsets and discourage farming:

```
eloDiff = killerElo - victimElo

K multiplier based on eloDiff:
├─ eloDiff > 400  → K × 0.10 (almost no reward for stomping)
├─ eloDiff > 200  → K × 0.25 (small reward)
├─ eloDiff > 0    → K × 0.50-0.75 (reduced reward)
├─ eloDiff > -200 → K × 0.75-1.25 (normal to good reward)
├─ eloDiff > -400 → K × 1.50 (big reward for upset)
└─ eloDiff ≤ -400 → K × 2.00 (huge reward for major upset)

effectiveK = 32 × multiplier
expected = 1 / (1 + 10^((victimElo - killerElo) / 400))

killerGain = max(1, effectiveK × (1 - expected))
victimLoss = max(1, effectiveK × expected × 1.2)
```

### ELO Constants

| Constant | Value | Description |
|----------|-------|-------------|
| Base K-Factor | 32 | Rating volatility base |
| Min ELO | 100 | Floor (can't go below) |
| Loss Multiplier | 1.2 | Losses are 20% higher than gains |
| Starting ELO | 1000 | Default rating |
| Protection Threshold | 200 | ELO diff to ignore weak players |

### ELO Characteristics

- **Balanced**: Strong killing weak = minimal gain, weak killing strong = big gain
- **Protection**: Players 200+ ELO below you are ignored (can't be farmed)
- **Deflationary**: 20% loss multiplier keeps total ELO in check
- **Upset Bonus**: Killing higher-rated players gives significantly more ELO
- **Minimum Changes**: Both killer and victim change by at least 1 point
- **Floor Protection**: Can't drop below 100 ELO

### Examples

| Scenario | Killer ELO | Victim ELO | Diff | K-mult | Gain | Loss |
|----------|------------|------------|------|--------|------|------|
| Equal match | 1000 | 1000 | 0 | 0.75 | ~12 | ~14 |
| Slight advantage | 1100 | 1000 | +100 | 0.63 | ~5 | ~15 |
| Strong vs weak | 1300 | 1000 | +300 | 0.25 | ~1 | ~8 |
| **IGNORED** | 1200 | 950 | +250 | N/A | N/A | N/A |
| Upset (weak wins) | 800 | 1000 | -200 | 1.25 | ~30 | ~10 |
| Major upset | 700 | 1200 | -500 | 2.00 | ~60 | ~5 |

---

## 4. Movement System

### Speed Calculation

```
speed = (100 + VelocidadeMovimento/5) × 0.05 units/tick
```

- Base speed: 5 units/tick (100 units/second)
- VelocidadeMovimento of 100 adds ~1 unit/tick
- Maximum practical speed: ~6 units/tick (120 units/second)

### Movement Rules

1. Player automatically moves toward nearest enemy
2. Movement stops when within attack range (30 units)
3. Position clamped to world bounds (0-10000)
4. Movement updates every tick (50ms)

---

## 5. NPC/AI Behavior

NPCs are AI-controlled entities that defend territories.

### AI States

| State | Behavior |
|-------|----------|
| **Idle** | Standing at spawn, passive until attacked |
| **Chasing** | Moving toward attacker |
| **Attacking** | In combat range, attacking target |
| **Returning** | Moving back to spawn location |

### Aggro Rules

- NPCs are **passive** - they don't attack unless attacked first
- Once attacked, NPC will chase and attack the aggressor
- Max chase distance: 500 units from spawn
- If target moves >500 units away, NPC returns to spawn
- When target dies, NPC returns to spawn

### NPC Constants

| Constant | Value |
|----------|-------|
| Chase Distance | 500 units |
| Attack Range | 30 units |
| Return Threshold | 5 units from spawn |

---

## 6. Territories & Kingdoms

The map is 10,000 × 10,000 units divided into 16 programming language kingdoms (including IA/AI).

### Kingdom Map

```
┌──────────┬─────────────────────────────────────────────────────┬──────────┐
│  SWIFT   │                       RUST                          │  KOTLIN  │  Y: 0-1000
│   (2%)   │                       (3%)                          │   (2%)   │
├──────────┼──────────────────────┬──────────────────────────────┼──────────┤
│   RUBY   │         GO           │           JAVA               │    C#    │  Y: 1000-3000
│   (5%)   │        (10%)         │           (12%)              │   (4%)   │
├──────────┤                      │                              ├──────────┤
│  SHELL   ├──────────────────────┴───────────────────┬──────────┤   PHP    │  Y: 3000-4500
│   (3%)   │              PYTHON (14%)                │    IA    │   (5%)   │
├──────────┤                                          │   (3%)   ├──────────┤
│    C     │                                          │ HuggingF │  SCALA   │  Y: 4500-6000
│   (4%)   │                                          │          │   (1%)   │
├──────────┼──────────────────────────────────────────┴──────────┼──────────┤
│   C++    │                   JAVASCRIPT (10%)                  │TYPESCRIPT│  Y: 6000-8000
│   (9%)   │                                                     │   (8%)   │
└──────────┴─────────────────────────────────────────────────────┴──────────┘
   X:0-1k              X:1k-8.5k                                   X:9k-10k
```

### Kingdom Assignment

1. Find your most-used programming language on GitHub
2. If it's one of the 16 main languages → assigned to that kingdom
3. If it's a rare/niche language → mapped to a related kingdom:

| Niche Language | Mapped To |
|----------------|-----------|
| Haskell, Elixir, Erlang, F#, Clojure, OCaml | Scala |
| Perl, Lua, R, Julia, MATLAB | Python |
| Dart, Objective-C | Kotlin / Swift |
| Zig, Nim, D, Assembly | Rust / C++ |
| CoffeeScript, Elm, Vue, Svelte | JavaScript / TypeScript |
| COBOL, Fortran, Visual Basic, Groovy | Java / C# |
| HTML, CSS, SQL variants | JavaScript / Java |

4. Fallback: Python (largest kingdom)

### Spawn Mechanics

- Players spawn at random position within their kingdom
- 50-unit margin from kingdom borders
- Respawn always in own kingdom territory

---

## 7. Respawn Mechanics

### Respawn Timing

```
Respawn Time = 1 second (20 ticks)
```

### Respawn Behavior

| Entity Type | Respawn Location |
|-------------|------------------|
| **Player** | Random position in own kingdom |
| **NPC** | Original spawn location |

### On Respawn

- HP restored to MaxHP (full heal)
- State reset to Idle
- Combat target cleared
- AI state reset (NPCs)

---

## 8. Game Constants

### Core Constants

| Constant | Value | Description |
|----------|-------|-------------|
| Tick Rate | 50ms | 20 ticks/second |
| Map Width | 10,000 | World X dimension |
| Map Height | 10,000 | World Y dimension |
| Attack Range | 30 units | Distance to start attacking |
| Vision Range | 300 units | Awareness distance |
| Respawn Time | 1,000ms | Time to respawn |

### Combat Constants

| Constant | Value | Description |
|----------|-------|-------------|
| Critical Multiplier | 1.5× | Damage boost on crit |
| Minimum Damage | 1 | Floor damage per hit |
| Base Attack Cooldown | 30 ticks | 1.5 seconds |
| Min Attack Cooldown | 2 ticks | 0.1 seconds |

### Movement Constants

| Constant | Value | Description |
|----------|-------|-------------|
| Base Speed | 100 | Movement speed base |
| Speed Divisor | 5 | VelocidadeMovimento / 5 |

---

## Summary Table

| Mechanic | Formula | Notes |
|----------|---------|-------|
| HP | `(dias×0.5) + (commits×0.3) + (repos×10) + 200` | Base 200 |
| Damage | `30 + (commits/50) + (commits30d×2) + (stars/5) + (forks×3)` | Base 30 |
| Attack Speed | `20 + (commits/80) + (commits7d×1.5) + (commits30d×0.5)` | Base 20 |
| Movement | `(100 + vel/5) × 0.05` units/tick | ~5-6 units/tick |
| Critical % | `5 + (commits/200) + (mergeRatio×20) + (avgStars×3) + (reviews/30)` | Base 5% |
| Evasion % | `5 + (repos/10) + langs + orgs + (extRepos/2) + (followers/500)` | Base 5% |
| Armor | `5 + (issues×0.5) + (reviews×0.8) + (commits/100) + (extCommits/20)` | Base 5 |
| Cooldown | `max(2, 30 - vel_ataque)` ticks | 0.1-1.5 seconds |
| ELO Gain | `max(1, K × mult × (1 - expected))` | Scales with ELO diff |
| ELO Loss | `max(1, K × mult × expected × 1.2)` | 20% deflationary |
| ELO Protection | 200 | Ignore players 200+ below |
| Respawn | 1 second | Fixed |
| Kingdoms | 16 | Includes IA/AI kingdom |

---

*GitWorld - Where your code becomes your power.*
