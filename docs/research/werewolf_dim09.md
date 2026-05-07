# Dimension 09: AI Simulation, Analytics & Evaluation Systems

*Deep-dive research into AI-only simulation modes, tournament systems, analytics pipelines, and evaluation frameworks for Werewolf multiplayer game platform.*

---

## Table of Contents

1. [AI-Only Accelerated Simulation](#1-ai-only-accelerated-simulation)
2. [Tournament Formats](#2-tournament-formats)
3. [ELO Rating System: Multiplayer Adaptation](#3-elo-rating-system-multiplayer-adaptation)
4. [Win Rate Analytics by Role & Faction](#4-win-rate-analytics-by-role--faction)
5. [Behavioral Metrics Suite](#5-behavioral-metrics-suite)
6. [LLM-as-a-Judge Evaluation Framework](#6-llm-as-a-judge-evaluation-framework)
7. [Replay System with Event Sourcing](#7-replay-system-with-event-sourcing)
8. [Real-Time Dashboard Architecture](#8-real-time-dashboard-architecture)
9. [Emergent Strategy Detection](#9-emergent-strategy-detection)
10. [Data Pipeline: Events → Kafka → ClickHouse → Streamlit](#10-data-pipeline)

---

## 1. AI-Only Accelerated Simulation

### 1.1 Design Philosophy

AI-only accelerated simulation eliminates all human-introduced delays (thinking time, typing, reading) to enable high-throughput game execution for model evaluation, strategy discovery, and statistical analysis [^127^][^136^]. The core principle is **batch parallelization**: running thousands of game instances simultaneously across compute clusters.

### 1.2 Simulation Architecture

Based on Werewolf Arena (Google Research) and WOLF benchmark architectures [^127^][^136^][^462^]:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SIMULATION ORCHESTRATOR                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Tournament  │  │   Scheduler  │  │   Result Aggregator  │  │
│  │   Manager    │  │              │  │                      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼────────────────────┼──────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BATCH GAME RUNNER                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         ┌──────────┐   │
│  │ Game #1  │ │ Game #2  │ │ Game #3  │  . . .  │ Game #N  │   │
│  │(8 agents)│ │(8 agents)│ │(8 agents)│         │(8 agents)│   │
│  └──────────┘ └──────────┘ └──────────┘         └──────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│              RESULTS DATABASE + ANALYTICS                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Game Logs   │  │   ELO Rank   │  │   Behavioral Store   │  │
│  │   (JSONL)    │  │   (SQLite)   │  │     (Parquet)        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Key Implementation Components

| Component | Description | Reference |
|-----------|-------------|-----------|
| **Batch Runner** | Parallel game execution using asyncio or multiprocessing; configurable batch size | [^127^][^462^] |
| **Agent Pool** | Registry of agent instances with model configs, temperature, role assignments | [^35^] |
| **Game Factory** | Instantiate game environments with varying configurations (role sets, player counts) | [^136^] |
| **Result Sink** | Persist game transcripts, vote records, win/loss outcomes, timing data | [^136^][^151^] |
| **Progress Tracker** | Real-time monitoring of simulation progress, ETA, failure rates | [^35^] |

### 1.4 Acceleration Techniques

From hardware-accelerated game simulation research [^462^][^463^]:

1. **Vectorized Execution**: Use JAX/PyTorch batch operations to step multiple game environments in parallel (Pgx achieves 1024 simultaneous games on single GPU) [^462^]
2. **Async API Calls**: Overlap LLM inference with game state management using asyncio; pipelined requests for 8-agent games [^35^]
3. **GPU-Accelerated Environments**: ECS (Entity-Component-System) pattern enables fully GPU-accelerated batch simulation with 2-3 orders of magnitude speedup over CPU baselines [^463^]
4. **Model Routing**: Route simpler reasoning tasks to cheaper models (GPT-4o-mini) while reserving frontier models (GPT-4o/Claude Sonnet) for complex deception scenarios; achieves 40-70% cost savings [^25^]
5. **Prompt Caching**: Cache repeated system prompts and role instructions across games; reduces cost 59-90% [^24^]
6. **Context Compaction**: Compress game history to high-signal tokens, reducing per-turn context by 50-70% [^25^]

### 1.5 Simulation Configuration Parameters

```python
SIMULATION_CONFIG = {
    "agents": 8,                          # Players per game
    "games_per_pairing": 10,              # Games per agent matchup
    "role_alternation": True,             # Rotate roles across games
    "temperature": 0.7,                   # LLM sampling temperature
    "top_p": 0.9,                         # Nucleus sampling parameter
    "max_turns_per_phase": 20,            # Turn limit per phase
    "batch_size": 100,                    # Parallel games
    "output_format": "jsonl",             # Structured log format
    "record_level": "full",               # full | summary | results-only
    "elo_k_factor": 32,                   # ELO sensitivity
    "seeds": [0, 1, 2, 3, 4]              # Reproducibility seeds
}
```

### 1.6 Throughput Benchmarks

| System | Games/Hour | Agents | Hardware | Source |
|--------|-----------|--------|----------|--------|
| Werewolf Arena | ~50 | 8 LLMs | Cloud TPU | [^127^] |
| WOLF Benchmark | ~30 | 4 LLMs | Single GPU | [^136^] |
| Pgx (GPU batch) | 1.9M steps/sec | N/A | Single A100 | [^462^] |
| Multi-GPU AlphaZero | ~500K games/hr | 2 | 8x A100 | [^462^] |
| Werewolf-AgentX | ~120 | 8 agents | GitHub Actions | [^35^] |

---

## 2. Tournament Formats

### 2.1 Format Comparison

| Format | Rounds | Elimination | Best For | Complexity | Source |
|--------|--------|-------------|----------|------------|--------|
| **Round-Robin** | n-1 | No | Small groups (4-16), comprehensive evaluation | Low | [^446^][^477^] |
| **Swiss System** | ceil(log2(n)) | No | Large fields (16+), fair ranking | Medium | [^446^][^451^][^466^] |
| **Single Elimination** | log2(n) | Yes (1 loss) | Quick winner determination | Low | [^446^] |
| **Double Elimination** | 2*log2(n) | Yes (2 losses) | Competitive second chances | Medium | [^446^] |
| **Bracket + Swiss Hybrid** | Variable | Top-4/8 advance | Best of both worlds | High | [^452^] |

### 2.2 Round-Robin Specification

The fairest format for small AI agent tournaments, used by Werewolf Arena and Foaster.ai [^127^][^75^].

**Algorithm (Circle Method)**:
```python
def generate_round_robin(players):
    """Generate round-robin schedule using circle method."""
    n = len(players)
    if n % 2 == 1:
        players.append("BYE")  # Add bye for odd counts
    
    schedule = []
    for round_num in range(len(players) - 1):
        round_pairs = []
        for i in range(len(players) // 2):
            if players[i] != "BYE" and players[-(i+1)] != "BYE":
                round_pairs.append((players[i], players[-(i+1)]))
        schedule.append(round_pairs)
        # Rotate all players except first
        players = [players[0]] + [players[-1]] + players[1:-1]
    return schedule
```

**Properties**:
- Games per tournament: `N * (N-1) / 2` for N players
- For 8 agents: 28 games (single) or 56 games (double round-robin)
- Every agent plays every other agent exactly once
- Role alternation: each agent plays each role an equal number of times [^127^]

### 2.3 Swiss System Specification

Swiss is the standard for competitive gaming tournaments (chess, MTG, esports). FIDE Dutch system (effective February 2026) provides the authoritative pairing specification [^466^].

**Key Rules (FIDE Dutch System)**:
1. **Scoregroups**: Players grouped by identical scores [^466^]
2. **Pairing Brackets**: Homogeneous (all same score) or heterogeneous (mixed scores)
3. **Absolute Criteria**: No repeat pairings [C1]; no second bye [C2]; no same-color violation for non-topscorers [C3] [^466^]
4. **Quality Criteria**: Minimize score differences within pairings [C6]; minimize floaters [C7-C21] [^466^]
5. **Tiebreakers**: Buchholz (sum of opponents' scores), Sonneborn-Berger (sum of defeated opponents' scores), head-to-head [^451^][^452^]

**Swiss Rounds Calculator**:
| Players | Rounds (Fast) | Rounds (Standard) | Games |
|---------|--------------|-------------------|-------|
| 8 | 3 | 4 | 12 |
| 16 | 4 | 5 | 32 |
| 32 | 5 | 6 | 80 |
| 64 | 6 | 7 | 192 |

**Maximum Weight Matching Alternative**: Research shows Burstein pairing >> Dutch BBP in ranking quality, with implementations using Edmonds' blossom algorithm on weighted graphs [^468^].

### 2.4 Bracket Tournament (Single/Double Elimination)

Standard bracket format for playoff stages after Swiss pool play [^452^].

```python
def generate_bracket(players, seeding=None):
    """Generate single-elimination bracket with optional seeding."""
    n = len(players)
    # Ensure power of 2
    bracket_size = 2 ** math.ceil(math.log2(n))
    while len(players) < bracket_size:
        players.append(None)  # Byes
    
    if seeding:
        players = apply_seeding(players, seeding)
    
    rounds = []
    current = list(zip(players[::2], players[1::2]))
    while len(current) > 0:
        rounds.append(current)
        winners = [f"W{len(rounds)}-{i}" for i in range(len(current))]
        current = list(zip(winners[::2], winners[1::2])) if len(winners) > 1 else []
    return rounds
```

### 2.5 Werewolf-Specific Tournament Adaptations

Based on Werewolf Arena and Werewolf-AgentX implementations [^127^][^35^]:

**Intra-Family Round Robin**:
- All agents from the same model family play each other
- 10 games per pairing with automatic role alternation
- Balances role distribution across games

**Inter-Family Head-to-Head**:
- Top performers from each family compete
- Best-of-10 or best-of-20 matchups
- ELO updates after every game

**Fixed Team Composition** (8-player standard):
- 2 Werewolves, 1 Seer, 1 Doctor, 4 Villagers [^35^]
- Ensures consistent balance across all games
- Enables per-role ELO tracking

---

## 3. ELO Rating System: Multiplayer Adaptation

### 3.1 Standard ELO Fundamentals

Standard ELO uses two formulas [^481^][^475^]:

**Expected Score**:
$$E_A = \frac{1}{1 + 10^{(R_B - R_A) / 400}}$$

**Rating Update**:
$$R'_A = R_A + K \cdot (S_A - E_A)$$

Where `D = 400` means an 800-point difference gives 100:1 odds, and K-factor controls rating volatility (typically 10-40) [^481^].

### 3.2 Multiplayer ELO Adaptation

Standard ELO is designed for 1v1; Werewolf requires adaptation for 8-player free-for-all with team dynamics [^35^][^75^].

**Team-Based Approach (Werewolf-AgentX)** [^35^]:
```python
def update_elo_team_based(players, winner_faction, k_factor=32):
    """
    Update ELO for multiplayer Werewolf.
    
    Args:
        players: List of {id, elo, role, faction}
        winner_faction: 'werewolf' or 'villager'
        k_factor: Sensitivity (32 for new, 16 for established)
    
    Returns:
        Updated ELO for all players
    """
    # Separate by faction
    wolves = [p for p in players if p['faction'] == 'werewolf']
    villagers = [p for p in players if p['faction'] == 'villager']
    
    # Calculate average team ratings
    wolf_avg = sum(p['elo'] for p in wolves) / len(wolves)
    villager_avg = sum(p['elo'] for p in villagers) / len(villagers)
    
    # Expected scores for each faction
    E_wolf = 1 / (1 + 10 ** ((villager_avg - wolf_avg) / 400))
    E_villager = 1 - E_wolf
    
    # Actual scores
    S_wolf = 1.0 if winner_faction == 'werewolf' else 0.0
    S_villager = 1.0 if winner_faction == 'villager' else 0.0
    
    # Update each player's ELO
    updates = {}
    for p in wolves:
        updates[p['id']] = p['elo'] + k_factor * (S_wolf - E_wolf)
    for p in villagers:
        updates[p['id']] = p['elo'] + k_factor * (S_villager - E_villager)
    
    return updates
```

### 3.3 Individual Performance-Weighted ELO (MOBA Adaptation)

From ELO analysis in MOBA games [^475^], an enhanced variant weights updates by individual performance relative to team average:

```python
def update_elo_performance_weighted(player, team_avg_performance, 
                                     won, k_factor=32):
    """
    Performance-weighted ELO update.
    Players who outperform team average gain more / lose less.
    """
    PS = player.performance_score       # Derived from game metrics
    PS_team = team_avg_performance
    
    if won:
        adjustment = (PS / PS_team) * k_factor * (1 - player.expected_score)
    else:
        adjustment = (PS_team / PS) * k_factor * (0 - player.expected_score)
    
    return player.elo + adjustment
```

This approach addresses the "good player punished by bad teammates" problem [^475^].

### 3.4 Alternative: TrueSkill for Multiplayer

TrueSkill (Microsoft Research, used on Xbox LIVE) natively handles multiplayer games [^486^][^487^]:

- Represents skill as Gaussian distribution: `N(μ, σ²)` where `μ` = mean skill, `σ` = uncertainty
- Default: `Rating(mu=25.000, sigma=8.333)` [^486^]
- Handles any match structure: N:N teams, free-for-all, unbalanced
- Convergence: ~3 games for 8P-FFA, ~12 games for 2P-FFA [^486^]
- Better than ELO at predicting tight matches in FFA and Head-to-Head modes [^487^]

**TrueSkill Python Implementation**:
```python
from trueskill import Rating, quality, rate

# 8-player free-for-all (all individual)
ratings = [Rating() for _ in range(8)]
rating_groups = [(r,) for r in ratings]  # Each player is their own "team"

# Rate after game (ranks: 0=1st place, 1=2nd place, ...)
new_ratings = rate(rating_groups, ranks=[0, 1, 1, 3, 4, 5, 6, 7])
# Ties get same rank
```

### 3.5 Elo-MMR: Massive Multiplayer Rating

Elo-MMR provides a principled Bayesian approximation for massive multiplayer competitions [^493^]:
- Fast and embarrassingly parallel
- Accurate predictions comparable to TrueSkill
- Simpler than TrueSkill while retaining Bayesian properties
- Used by Codeforces, Topcoder competitive programming platforms
- Handles free-for-all settings via principled approximation rather than ad-hoc heuristics

### 3.6 Recommended ELO Architecture for Werewolf

```
┌─────────────────────────────────────────────────────────────────┐
│              WEREWOLF RATING SYSTEM                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  OVERALL ELO: Standard multiplayer adaptation (team-based)        │
│  ├── WEREWOLF ELO: Performance when playing as Werewolf          │
│  ├── VILLAGER ELO: Performance when playing as Villager          │
│  ├── SEER ELO: Performance when playing as Seer                  │
│  └── DOCTOR ELO: Performance when playing as Doctor              │
│                                                                   │
│  AUXILIARY RATINGS:                                               │
│  ├── Deception Score: ELO-like for deception effectiveness       │
│  ├── Detection Score: ELO-like for identifying enemies           │
│  ├── Influence Score: ELO-like for vote swaying                  │
│  └── Survival Score: ELO-like for living longest                 │
│                                                                   │
│  UNCERTAINTY TRACKING (TrueSkill-style):                          │
│  └── Sigma (σ) indicates confidence in rating estimate            │
│      → New agents: high σ, large K-factor                         │
│      → Established agents: low σ, small K-factor                  │
└─────────────────────────────────────────────────────────────────┘
```

**K-Factor Schedule**:
| Games Played | K-Factor | Phase |
|-------------|----------|-------|
| 0-10 | 40 | Calibration |
| 11-30 | 32 | Discovery |
| 31-100 | 20 | Normal |
| 100+ | 16 | Established |

---

## 4. Win Rate Analytics by Role & Faction

### 4.1 Balance Targets

| Metric | Target | Tolerance | Measurement |
|--------|--------|-----------|-------------|
| Villager Win Rate | 50-55% | ±5% | Games where villagers eliminate all wolves |
| Werewolf Win Rate | 45-50% | ±5% | Games where wolves equal/surpass villagers |
| Game Length (rounds) | 5-8 | ±2 | Number of day/night cycles |
| First Elimination Accuracy | 50%+ | ±10% | % of games where eliminated player was wolf |

### 4.2 Win Rate Framework

Based on Werewolf Arena, WOLF, and Kaggle Game Arena analytics [^127^][^136^][^490^]:

**Faction-Level Metrics**:
- **Macro Win Rate**: Overall faction win percentage (Villager vs Werewolf)
- **Micro Win Rate**: Per-role win rate within faction
- **Weighted Win Rate**: Villager-doubled weighting (AIWolfDial approach) [^137^]
- **Survival Rate**: % of games player survives to end [^127^]
- **Conditional Win Rate**: Win rate given specific conditions (e.g., "win rate when Seer reveals Round 1")

**Per-Role Analytics** (from Werewolf Arena) [^127^][^160^]:
| Role | Metrics |
|------|---------|
| Seer | Reveals/game, first reveal round, unmasked wolf %, believed %, backfired % |
| Werewolf | Kill accuracy, teammate coordination %, detection avoidance |
| Doctor | Save accuracy, self-save %, revealed-save % |
| Villager | Vote accuracy, bandwagon frequency, correct suspicion rate |

### 4.3 Balance Assessment

```python
class WinRateAnalyzer:
    def faction_balance(self, games):
        """Assess faction balance across all games."""
        villager_wins = sum(1 for g in games if g.winner == 'villager')
        total = len(games)
        
        return {
            'villager_win_rate': villager_wins / total,
            'werewolf_win_rate': (total - villager_wins) / total,
            'chi_square_p': chisquare([villager_wins, total - villager_wins]).pvalue,
            'is_balanced': 0.40 <= villager_wins / total <= 0.60,
            'games_needed_for_significance': self.power_analysis()
        }
    
    def role_performance(self, games, role):
        """Per-role win rate analysis."""
        role_games = [g for g in games if any(p.role == role for p in g.players)]
        wins = sum(1 for g in role_games if g.is_winner(role))
        return {
            'role': role,
            'games': len(role_games),
            'wins': wins,
            'win_rate': wins / len(role_games) if role_games else 0,
            'avg_survival_rounds': self.avg_survival(role_games, role)
        }
```

---

## 5. Behavioral Metrics Suite

### 5.1 The Traitors Metrics (Primary Framework)

The most comprehensive behavioral metrics framework for social deduction evaluation [^155^][^156^].

#### 5.1.1 Coordination Metrics

| Metric | Name | Formula | Description |
|--------|------|---------|-------------|
| **TAS** | Traitor Agreement Score | `TAS_r = Σ 1(V_r^t = V_r^max,T) / \|T\|` | Measures voting bloc unity among Werewolves; 1.0 = perfect coordination [^155^] |
| **FAS** | Faithful Agreement Score | `FAS_r = Σ 1(V_r^f = V_r^max,F) / \|F\|` | Measures consensus among Villagers; lower values indicate diverse voting [^155^] |

#### 5.1.2 Effectiveness Metrics

| Metric | Name | Formula | Description |
|--------|------|---------|-------------|
| **FCR** | Faithful Correctness Rate | `FCR_r = Σ 1(V_r^f ∈ T) / \|F\|` | % of faithful votes correctly targeting traitors; signal detection theory metric [^155^][^156^] |
| **TSR** | Traitor Survival Rate | `TSR = \|T_end\| / \|T\|` | Fraction of traitors surviving to game end; evolutionary fitness of deception [^155^][^156^] |
| **FSR** | Faithful Survival Rate | `FSR = \|F_end\| / \|F\|` | Fraction of faithful surviving; complement to TSR [^156^] |
| **DES** | Deception Effectiveness Score | `DES = Σ 1(E_r ∈ F ∧ V_r^t = E_r) / \|R\|` | % of rounds where traitors successfully manipulate elimination of faithful [^156^] |

#### 5.1.3 Behavioral Metrics

| Metric | Name | Formula | Description |
|--------|------|---------|-------------|
| **IDR** | Information Diffusion Rate | Tracks belief spread | How effectively correct traitor beliefs spread among faithful agents [^155^] |
| **BRR** | Betrayal Recognition Rate | Identifies early detectors | % of faithful who detect traitors before group consensus forms [^155^] |
| **VSF** | Vote Switching Frequency | Count of vote changes | Quantifies agent willingness to change votes across rounds [^155^] |
| **TNS** | Trust Network Stability | Temporal correlation of voting | Measures consistency of trust relationships over time [^156^] |

### 5.2 WOLF Deception Taxonomy Metrics

From the WOLF benchmark [^136^][^151^]:

| Metric | Description |
|--------|-------------|
| **Deception Production Rate** | % of turns containing deceptive statements by role |
| **Detection Precision** | True positive rate of identifying deceptive statements |
| **Detection Recall** | % of deceptive statements correctly flagged |
| **Brier Score** | Calibration of suspicion scores (0=perfect, 1=worst) |
| **Cross-Perception Matrix** | Observer-target suspicion heatmap |
| **Temporal Trend Slope** | Theil-Sen slope of suspicion over rounds (e.g., +1.6pp/round for Wolf suspicion) [^136^] |

### 5.3 Werewolf Arena Analytics

| Metric | Description | Source |
|--------|-------------|--------|
| **Voting Entropy** | Shannon entropy of vote distribution per round; measures consensus | [^127^] |
| **Bidding Behavior** | Turn-taking bid patterns and resource management | [^127^] |
| **Seer Reveal Timing** | Round when Seer first reveals; optimal: f(config) | [^127^][^160^] |
| **Vote Accuracy** | % of votes cast for actual Werewolves | [^127^] |

### 5.4 Custom Werewolf Metrics

| Metric | Category | Formula | Purpose |
|--------|----------|---------|---------|
| **PMI (Persuasion Measure Index)** | Influence | `(votes_swayed / total_players) * (1 / utterances_needed)` | Measures vote-swing efficiency per message |
| **DCI (Deception Consistency Index)** | Deception | `1 - (contradictions / total_statements)` | Tracks internal consistency of deceptive narratives |
| **SRI (Social Reasoning Index)** | Reasoning | `correct_role_inferences / total_inferences` | Measures accuracy of role deductions |
| **ACI (Alliance Cohesion Index)** | Coordination | `mutual_votes / total_possible_votes` | Measures alliance stability over time |
| **LPI (Longevity Performance Index)** | Survival | `rounds_survived / total_rounds` | Normalized survival metric |

### 5.5 Complete Metrics Definitions Table

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    BEHAVIORAL METRICS MATRIX                              │
├──────────────┬─────────┬─────────────────────────────────────────────────┤
│ Category     │ Count   │ Metrics                                         │
├──────────────┼─────────┼─────────────────────────────────────────────────┤
│ Coordination │ 2       │ TAS, FAS, ACI                                   │
│ Effectiveness│ 4       │ FCR, TSR, FSR, DES                              │
│ Behavioral   │ 4       │ IDR, BRR, VSF, TNS                              │
│ Deception    │ 6       │ DPR, DPrec, DRec, Brier, Cross-PM, Trend-Slope  │
│ Arena Custom │ 4       │ Voting Entropy, Bidding, Seer Timing, Vote Acc  │
│ Platform     │ 5       │ PMI, DCI, SRI, ACI, LPI                         │
├──────────────┼─────────┼─────────────────────────────────────────────────┤
│ TOTAL        │ 25      │ All behavioral metrics for comprehensive eval   │
└──────────────┴─────────┴─────────────────────────────────────────────────┘
```

---

## 6. LLM-as-a-Judge Evaluation Framework

### 6.1 G-Eval: Primary Evaluation Method

G-Eval (Microsoft Azure AI, EMNLP 2023) is the most validated LLM-as-a-Judge framework for game agent evaluation [^140^][^142^][^148^].

**Three-Component Architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    G-EVAL PIPELINE                                │
│                                                                   │
│  STEP 1: Evaluation Step Generation (Auto-CoT)                   │
│  ├── Input: Task Introduction + Evaluation Criteria               │
│  └── Output: Structured evaluation steps                         │
│       "1. Check logical consistency of arguments"                 │
│       "2. Evaluate persuasiveness of claims"                      │
│       "3. Assess deception sophistication"                        │
│                                                                   │
│  STEP 2: Judging (Form-Filling Paradigm)                          │
│  ├── Input: Evaluation Steps + Game Transcript                    │
│  └── Output: Scored evaluation form                              │
│       Reasoning Quality: 4/5                                      │
│       Persuasive Power: 3/5                                       │
│       Deceptive Skill: 5/5                                        │
│                                                                   │
│  STEP 3: Probability-Weighted Scoring                             │
│  ├── score = Σ p(s_i) * s_i                                       │
│  └── Fine-grained continuous scores from discrete ratings         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Performance Benchmarks** [^140^][^483^]:
| Metric | G-EVAL-4 | G-EVAL-3.5 | BLEU-4 | ROUGE-L |
|--------|----------|-----------|--------|---------|
| Spearman (SummEval) | 0.514 | 0.401 | 0.259 | 0.244 |
| Spearman (QAGS-XSUM)| 0.537 | 0.406 | 0.083 | -0.011 |
| Cost per evaluation | ~$0.01-0.05 | ~$0.005 | N/A | N/A |

### 6.2 ChatEval: Multi-Agent Debate

ChatEval (ICLR 2024) uses multi-agent debate for more robust evaluation [^117^][^162^][^450^]:

**Architecture**:
- Multiple LLM agents with distinct personas debate response quality
- **Diversity of roles is critical**: same persona degrades performance [^117^]
- 10-16% improvement over single-agent prompting on human correlation [^117^]
- Kendall Tau: 0.57 (ChatEval) vs 0.52 (single GPT-4) on TopicalChat [^117^]

**Agent Personas for Werewolf Evaluation**:
```yaml
eval_agents:
  - name: "Logic_Critic"
    role: "Evaluate logical consistency of reasoning"
  - name: "Psychology_Analyst"  
    role: "Assess psychological manipulation techniques"
  - name: "Strategy_Evaluator"
    role: "Judge strategic decision-making quality"
  - name: "Communication_Expert"
    role: "Evaluate clarity and persuasiveness of speech"
  - name: "Fairness_Auditor"
    role: "Detect position bias and self-preference"
```

### 6.3 Agent-as-a-Judge

For trajectory-level evaluation of multi-step game agents [^122^]:

- **~90% agreement** with human expert evaluations
- **97% cost reduction**: $1,297 → $31 per evaluation
- Autonomous agent observes full game execution and provides step-by-step assessment
- Better than LLM-as-a-Judge for complex multi-step tasks [^122^]

### 6.4 Evaluation Dimensions for Werewolf

Based on Werewolf-AgentX's five-dimension framework [^35^]:

| Dimension | Description | G-Eval Criteria | Weight |
|-----------|-------------|-----------------|--------|
| **Reasoning Quality** | Logical consistency, valid deductions, coherent argumentation | Coherence (1-5), Logical validity (1-5) | 25% |
| **Persuasive Power** | Ability to convince others, argument strength | Persuasiveness (1-5), Evidence quality (1-5) | 25% |
| **Deceptive Skill** | Sophistication of lies, consistency with cover story | Deception depth (1-5), Plausibility (1-5) | 20% |
| **Adaptability** | Response to changing game state, recovery from mistakes | Flexibility (1-5), Recovery skill (1-5) | 15% |
| **Consistency** | Alignment between stated beliefs and actions | Action-speech alignment (1-5) | 15% |

### 6.5 Evaluation Pipeline

```python
def evaluate_game(game_transcript, judge_model="gpt-4o"):
    """
    Full evaluation pipeline for a single game.
    Returns composite score + per-dimension breakdown.
    """
    # Phase 1: Quantitative metrics (automatic)
    quantitative = {
        'win': game_transcript.winner,
        'survival_rounds': game_transcript.rounds_survived,
        'vote_accuracy': compute_vote_accuracy(game_transcript),
        'tas': compute_traitor_agreement(game_transcript),
        'fcr': compute_faithful_correctness(game_transcript),
        'tsr': compute_traitor_survival(game_transcript),
        'des': compute_deception_effectiveness(game_transcript)
    }
    
    # Phase 2: G-Eval qualitative scoring
    g_eval_scores = {}
    for dimension in ['reasoning', 'persuasion', 'deception', 'adaptability', 'consistency']:
        score = g_eval_score(
            transcript=game_transcript,
            dimension=dimension,
            model=judge_model
        )
        g_eval_scores[dimension] = score
    
    # Phase 3: Composite (weighted)
    quantitative_weight = 0.4
    qualitative_weight = 0.6
    
    composite = (
        quantitative_weight * normalize(quantitative) +
        qualitative_weight * weighted_sum(g_eval_scores)
    )
    
    return {
        'composite_score': composite,
        'quantitative': quantitative,
        'qualitative': g_eval_scores
    }
```

### 6.6 Bias Mitigation

| Bias Type | Description | Mitigation Strategy |
|-----------|-------------|-------------------|
| **Position Bias** | Order of presented options affects judgment | Randomize option order; evaluate multiple orderings [^140^] |
| **Verbosity Bias** | Longer responses rated higher | Normalize by token count; penalize excessive length [^142^] |
| **Self-Preference** | Models rate own family higher | Use different judge model than players; cross-evaluation [^140^] |
| **Score Clustering** | Scores cluster around single value | Probability-weighted normalization [^140^] |

---

## 7. Replay System with Event Sourcing

### 7.1 Event Sourcing Architecture

Event sourcing captures every game state change as an immutable event, enabling complete replay and temporal queries [^145^][^209^][^447^].

**Core Pattern (CQRS + Event Sourcing)** [^145^]:
```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT SOURCING ARCHITECTURE                    │
│                                                                   │
│  WRITE SIDE (Commands)          READ SIDE (Queries)              │
│  ┌─────────────────────┐        ┌─────────────────────┐          │
│  │  Command Handler    │        │  Materialized Views │          │
│  │  - CreateGame       │        │  - Leaderboard      │          │
│  │  - CastVote         │──Event──▶│  - Player Stats   │          │
│  │  - MakeAccusation   │  Bus   │  - Win/Loss Records │          │
│  │  - EliminatePlayer  │        │  - ELO Rankings     │          │
│  └─────────────────────┘        └─────────────────────┘          │
│           │                              │                        │
│           ▼                              ▼                        │
│  ┌─────────────────────────────────────────────┐                  │
│  │           EVENT STORE (Append-Only)           │                  │
│  │                                               │                  │
│  │  Event 1: GameCreated {game_id, config, ts}  │                  │
│  │  Event 2: RoleAssigned {player, role, ts}    │                  │
│  │  Event 3: NightAction {player, target, ts}   │                  │
│  │  Event 4: DaySpeech {player, content, ts}    │                  │
│  │  Event 5: VoteCast {voter, target, ts}       │                  │
│  │  Event 6: PlayerEliminated {player, ts}      │                  │
│  │  Event 7: GameEnded {winner, final_state}    │                  │
│  └─────────────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Event Schema

```python
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional

class EventType(Enum):
    GAME_CREATED = "game.created"
    PHASE_CHANGED = "phase.changed"  # night/day
    ROLE_ASSIGNED = "role.assigned"
    NIGHT_ACTION = "night.action"    # kill, see, save
    DAY_SPEECH = "day.speech"
    VOTE_CAST = "vote.cast"
    VOTE_RESULT = "vote.result"
    PLAYER_ELIMINATED = "player.eliminated"
    GAME_ENDED = "game.ended"

@dataclass
class GameEvent:
    event_id: str              # UUID v4
    game_id: str               # Reference to game
    event_type: EventType
    timestamp: datetime        # Nanosecond precision
    sequence_num: int          # Monotonic within game
    player_id: Optional[str]   # Acting player
    payload: dict              # Event-specific data
    
    # Example payloads:
    # NightAction: {"action": "kill", "target": "player_3", "reasoning": "..."}
    # DaySpeech: {"content": "I think player_2 is suspicious because...", "mentions": ["player_2"]}
    # VoteCast: {"target": "player_4", "round": 3}
```

### 7.3 Replay Capabilities

| Feature | Implementation | Use Case |
|---------|---------------|----------|
| **Full Replay** | Rehydrate game state from event stream | Post-game analysis, debugging |
| **Time-Travel Query** | Query state at specific sequence number | "What did player 3 know at round 2?" |
| **Partial Replay** | Replay from round N to round M | Focus on critical game phases |
| **Branching** | Fork game at event N, try alternative actions | Counterfactual analysis |
| **Event Subscription** | Real-time stream of specific event types | Live dashboards, alerts |

### 7.4 Rehydration Algorithm

```python
def rehydrate_game_state(event_stream: List[GameEvent]) -> GameState:
    """Reconstruct game state from event log."""
    state = GameState()
    for event in sorted(event_stream, key=lambda e: e.sequence_num):
        match event.event_type:
            case EventType.GAME_CREATED:
                state.init(event.payload['config'])
            case EventType.ROLE_ASSIGNED:
                state.assign_role(event.player_id, event.payload['role'])
            case EventType.NIGHT_ACTION:
                state.apply_night_action(
                    event.player_id,
                    event.payload['action'],
                    event.payload['target']
                )
            case EventType.DAY_SPEECH:
                state.record_speech(event.player_id, event.payload['content'])
            case EventType.VOTE_CAST:
                state.record_vote(event.player_id, event.payload['target'])
            case EventType.PLAYER_ELIMINATED:
                state.eliminate(event.payload['player'])
            case EventType.GAME_ENDED:
                state.finalize(event.payload['winner'])
    return state
```

---

## 8. Real-Time Dashboard Architecture

### 8.1 Dashboard Wireframe Specifications

```
┌─────────────────────────────────────────────────────────────────┐
│  🐺 WEREWOLF ARENA ANALYTICS                    [Auto-refresh: 5s]│
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │  Games     │  │  Avg Time  │  │  Villager  │  │  Wolf Win  ││
│  │  Played    │  │  / Game    │  │  Win Rate  │  │  Rate      ││
│  │  1,247     │  │  4.2 min   │  │  52.3%     │  │  47.7%     ││
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘│
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  LIVE ELO LEADERBOARD                                       ││
│  │  Rank  Agent          ELO    Games  Win%  TSR   FCR   DES  ││
│  │  ────  ────────────   ────   ────   ────  ────  ────  ──── ││
│  │  1     GPT-4o         1847   312    62%   0.93  0.10  1.00 ││
│  │  2     Claude-Sonnet  1782   298    58%   0.71  0.35  0.89 ││
│  │  3     Gemini-Pro     1721   305    55%   0.65  0.42  0.85 ││
│  │  4     DeepSeek-V3    1689   287    53%   0.33  0.56  1.00 ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌──────────────────────┐  ┌────────────────────────────────────┐│
│  │  WIN RATE BY ROLE    │  │  VOTING ENTROPY OVER TIME          ││
│  │                      │  │                                    ││
│  │  Villager ████████   │  │  1.0 ┤    ╭─╮                     ││
│  │  Werewolf ██████     │  │  0.8 ┤   ╱   ╲   ╭─╮              ││
│  │  Seer     ███████    │  │  0.6 ┤──╱     ╲─╱   ╲───          ││
│  │  Doctor   ██████     │  │  0.4 ┤                              ││
│  │                      │  │  0.2 ┤                              ││
│  │  (bar chart)         │  │  0.0 ┼──────────────────────        ││
│  └──────────────────────┘  └────────────────────────────────────┘│
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  LIVE GAME FEED                                             ││
│  │  [Game #1248] Round 3 - Day Phase: Player_2 accuses Player_7││
│  │  [Game #1247] Ended: Villagers win (5 rounds)               ││
│  │  [Game #1246] Round 2 - Night: Seer investigating Player_4  ││
│  │  [Game #1249] Started: 8 agents assigned roles              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Dashboard Pages

| Page | Content | Refresh Rate |
|------|---------|-------------|
| **Overview** | KPI cards, live leaderboard, win rates | 5s |
| **Agent Detail** | Per-agent ELO history, role breakdown, metrics | 30s |
| **Game Explorer** | Searchable game list, replay viewer | On demand |
| **Analytics** | Win rate trends, behavioral heatmaps, correlations | 60s |
| **Tournament** | Brackets, standings, schedule, results | 10s |
| **System Health** | Pipeline lag, error rates, throughput | 5s |

### 8.3 Technical Implementation

Using ClickHouse + Streamlit as the primary stack [^467^][^128^]:

```python
# clickhouse_utils.py - Connection and query utilities
import streamlit as st
import clickhouse_connect

@st.cache_resource
def get_clickhouse_client():
    return clickhouse_connect.get_client(
        host=st.secrets["clickhouse"]["host"],
        port=st.secrets["clickhouse"]["port"],
        username=st.secrets["clickhouse"]["username"],
        password=st.secrets["clickhouse"]["password"],
        database="werewolf_analytics",
        settings={
            "max_execution_time": 30,
            "use_query_cache": 1,
            "query_cache_ttl": 60
        }
    )

def get_leaderboard(limit=50):
    return get_clickhouse_client().query(f"""
        SELECT 
            agent_name,
            elo_rating,
            games_played,
            win_rate,
            traitor_survival_rate,
            faithful_correctness_rate,
            deception_effectiveness
        FROM agent_leaderboard
        ORDER BY elo_rating DESC
        LIMIT {limit}
    """).result_rows
```

---

## 9. Emergent Strategy Detection

### 9.1 Detection Framework

Based on MultiagentBench's three-pattern framework [^133^] and OpenAI's hide-and-seek emergent tool use research [^464^]:

**Three Emergent Behavior Categories**:

| Pattern | Description | Detection Method |
|---------|-------------|-----------------|
| **Strategic Information Sharing** | Selective revelation of game state to allies | Utterance analysis + LLM-as-Judge [^133^] |
| **Trust-Polarized Collaboration** | Formation of stable voting blocs | Voting matrix clustering + TAS analysis [^133^] |
| **Role-Driven Strategy Iteration** | Adaptive strategy evolution across rounds | Temporal pattern matching (e.g., Seer conservative→leader) [^133^] |

### 9.2 Detection Pipeline

```python
class EmergentStrategyDetector:
    def __init__(self, llm_judge):
        self.llm = llm_judge
    
    def detect_strategic_information_sharing(self, transcript):
        """Detect selective information revelation."""
        # Analyze: do agents share private info selectively with allies?
        private_mentions = self.extract_private_info_mentions(transcript)
        sharing_patterns = self.analyze_sharing_recipients(private_mentions)
        
        # LLM-as-Judge: classify sharing as strategic or random
        prompt = f"""Analyze if the following information sharing 
        patterns in a Werewolf game represent strategic coordination:
        {sharing_patterns}
        
        Classify as: STRATEGIC, RANDOM, or UNCLEAR."""
        
        return self.llm.classify(prompt)
    
    def detect_trust_polarization(self, transcript):
        """Detect formation of voting blocs."""
        # Build voting adjacency matrix per round
        vote_matrix = self.build_vote_matrix(transcript)
        
        # Cluster analysis: detect stable blocs
        clusters = spectral_clustering(vote_matrix, n_clusters=2)
        stability = self.measure_bloc_stability(clusters, transcript.rounds)
        
        return {
            'has_polarization': stability > 0.7,
            'bloc_sizes': [len(c) for c in clusters],
            'stability_score': stability
        }
    
    def detect_strategy_iteration(self, transcript):
        """Detect strategy evolution over time."""
        # Segment transcript by early/mid/late game
        segments = self.segment_by_game_phase(transcript)
        
        # Extract strategy signatures per phase
        signatures = [self.extract_strategy_signature(s) for s in segments]
        
        # Measure strategy drift between phases
        drift = [cosine_distance(signatures[i], signatures[i+1]) 
                 for i in range(len(signatures)-1)]
        
        return {
            'has_iteration': max(drift) > 0.5,
            'drift_scores': drift,
            'phase_signatures': signatures
        }
```

### 9.3 Emergent Strategy Taxonomy

Based on research across Werewolf implementations [^133^][^464^][^155^]:

| Strategy | Agents Involved | Detection Signal | Game Phase |
|----------|----------------|-------------------|------------|
| **Wolf Bloc Voting** | 2+ Werewolves | TAS = 1.0 across rounds | All |
| **Seer Early Reveal** | Seer | First reveal round < 3 | Early |
| **False Seer Claim** | Werewolf | Contradictory info from two "Seers" | Early-Mid |
| **Bus Throw** | Werewolf | Wolf votes for wolf teammate | Mid |
| **Doctor Self-Save Chain** | Doctor | Consecutive self-targeting | All |
| **Quiet Wolf** | Werewolf | Low utterance count, selective speech | All |
| **Aggressive Villager** | Villager | High accusation rate, early claims | Early |
| **Trust Network Flip** | Any | TNS drops > 0.3 in single round | Late |

---

## 10. Data Pipeline

### 10.1 Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WEREWOLF ANALYTICS DATA PIPELINE                       │
│                                                                          │
│  LAYER 1: EVENT GENERATION                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────────────┐ │
│  │  Game    │  │  Agent   │  │  System  │  │  Evaluation             │ │
│  │  Events  │  │  Events  │  │  Metrics │  │  Results                │ │
│  │  (JSON)  │  │  (JSON)  │  │  (JSON)  │  │  (JSON)                 │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────────┬─────────────┘ │
│       └──────────────┴──────────────┴────────────────────┘               │
│                          │                                               │
│  LAYER 2: STREAMING INGESTION                                           │
│                          ▼                                               │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │              KAFKA / REDPANDA CLUSTER                          │       │
│  │                                                                │       │
│  │  Topic: werewolf.game-events      (game actions, votes)        │       │
│  │  Topic: werewolf.agent-events     (LLM calls, responses)       │       │
│  │  Topic: werewolf.system-metrics   (timing, errors, costs)      │       │
│  │  Topic: werewolf.evaluations      (G-Eval scores, ELO updates) │       │
│  │  Topic: werewolf.replay-events    (full event stream for CQRS) │       │
│  │                                                                │       │
│  │  Partitioning: By game_id (ensures in-game event ordering)     │       │
│  │  Schema: Avro with Schema Registry                             │       │
│  │  Retention: 7 days hot, 90 days warm                           │       │
│  └──────────────────────────┬─────────────────────────────────────┘       │
│                             │                                            │
│  LAYER 3: PROCESSING & STORAGE                                          │
│                             ▼                                            │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │              CLICKHOUSE CLUSTER                                  │       │
│  │                                                                │       │
│  │  Table: game_results (MergeTree)                                │       │
│  │    game_id, timestamp, winner, duration, config_hash           │       │
│  │                                                                │       │
│  │  Table: agent_performances (MergeTree)                          │       │
│  │    agent_id, game_id, role, won, survival_rounds, elo_delta    │       │
│  │                                                                │       │
│  │  Table: behavioral_metrics (MergeTree)                          │       │
│  │    game_id, agent_id, tas, fcr, tsr, des, vsf, idr             │       │
│  │                                                                │       │
│  │  Materialized View: leaderboard (auto-updating)                 │       │
│  │    agent_id, elo, games, wins, avg_tsr, avg_des                │       │
│  │                                                                │       │
│  │  Table: events (raw event log for replay)                       │       │
│  │    game_id, sequence_num, event_type, timestamp, payload       │       │
│  └──────────────────────────┬─────────────────────────────────────┘       │
│                             │                                            │
│  LAYER 4: VISUALIZATION                                                 │
│                             ▼                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  Streamlit   │  │  Grafana     │  │  API Server  │                   │
│  │  Dashboard   │  │  Monitoring  │  │  (REST)      │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.2 ClickHouse Schema

```sql
-- Core game results table
CREATE TABLE game_results (
    game_id UUID,
    tournament_id Nullable(String),
    started_at DateTime64(3),
    ended_at DateTime64(3),
    duration_ms UInt32,
    winner_faction Enum('villager', 'werewolf'),
    total_rounds UInt8,
    num_players UInt8 DEFAULT 8,
    config_hash String,
    
    INDEX idx_winner winner_faction TYPE bloom_filter GRANULARITY 3,
    INDEX idx_tournament tournament_id TYPE bloom_filter GRANULARITY 3
) ENGINE = MergeTree()
ORDER BY (started_at, game_id);

-- Agent performance per game
CREATE TABLE agent_performances (
    agent_id LowCardinality(String),
    game_id UUID,
    role Enum('villager', 'werewolf', 'seer', 'doctor'),
    faction Enum('villager', 'werewolf'),
    won Bool,
    survival_rounds UInt8,
    elo_before Float32,
    elo_after Float32,
    elo_delta Float32,
    votes_cast UInt8,
    correct_votes UInt8,
    statements_made UInt8,
    
    INDEX idx_agent agent_id TYPE bloom_filter GRANULARITY 3,
    INDEX idx_role role TYPE bloom_filter GRANULARITY 3
) ENGINE = MergeTree()
ORDER BY (agent_id, game_id);

-- Behavioral metrics (The Traitors suite + custom)
CREATE TABLE behavioral_metrics (
    game_id UUID,
    agent_id LowCardinality(String),
    role Enum('villager', 'werewolf', 'seer', 'doctor'),
    
    -- Coordination
    tas Float32,  -- Traitor Agreement Score
    fas Float32,  -- Faithful Agreement Score
    aci Float32,  -- Alliance Cohesion Index (custom)
    
    -- Effectiveness
    fcr Float32,  -- Faithful Correctness Rate
    tsr Float32,  -- Traitor Survival Rate
    fsr Float32,  -- Faithful Survival Rate
    des Float32,  -- Deception Effectiveness Score
    
    -- Behavioral
    idr Float32,  -- Information Diffusion Rate
    brr Float32,  -- Betrayal Recognition Rate
    vsf Float32,  -- Vote Switching Frequency
    tns Float32,  -- Trust Network Stability
    
    -- Custom
    pmi Float32,  -- Persuasion Measure Index
    dci Float32,  -- Deception Consistency Index
    sri Float32,  -- Social Reasoning Index
    lpi Float32,  -- Longevity Performance Index
    
    computed_at DateTime64(3) DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (game_id, agent_id);

-- Auto-updating leaderboard materialized view
CREATE MATERIALIZED VIEW agent_leaderboard_mv
ENGINE = SummingMergeTree()
ORDER BY (agent_id)
AS SELECT
    agent_id,
    count() as games_played,
    sum(won) as wins,
    avg(elo_after) as current_elo,
    avg(tas) as avg_tas,
    avg(tsr) as avg_tsr,
    avg(fcr) as avg_fcr,
    avg(des) as avg_des,
    avg(pmi) as avg_pmi,
    avg(lpi) as avg_lpi
FROM agent_performances ap
JOIN behavioral_metrics bm ON ap.game_id = bm.game_id AND ap.agent_id = bm.agent_id
GROUP BY agent_id;

-- Raw event store for replay
CREATE TABLE game_events (
    game_id UUID,
    sequence_num UInt32,
    event_type LowCardinality(String),
    timestamp DateTime64(6),
    player_id Nullable(String),
    payload String,  -- JSON
    
    INDEX idx_game game_id TYPE bloom_filter GRANULARITY 3,
    INDEX idx_type event_type TYPE bloom_filter GRANULARITY 3
) ENGINE = MergeTree()
ORDER BY (game_id, sequence_num);
```

### 10.3 Kafka/Redpanda Configuration

```python
# Producer configuration
KAFKA_CONFIG = {
    "bootstrap.servers": "redpanda:9092",
    "client.id": "werewolf-game-producer",
    
    # Serialization
    "key.serializer": "org.apache.kafka.common.serialization.StringSerializer",
    "value.serializer": "io.confluent.kafka.serializers.KafkaAvroSerializer",
    "schema.registry.url": "http://schema-registry:8081",
    
    # Reliability
    "acks": "all",                    # Wait for all replicas
    "enable.idempotence": True,       # Exactly-once semantics
    "max.in.flight.requests": 5,
    
    # Performance
    "batch.size": 16384,
    "linger.ms": 10,
    "compression.type": "lz4",
    
    # Topic configuration
    "topic": {
        "werewolf.game-events": {
            "partitions": 12,         # Shard by game_id % 12
            "replication.factor": 3,
            "retention.ms": 604800000  # 7 days
        }
    }
}
```

### 10.4 Streamlit Dashboard Code Skeleton

```python
# dashboard.py - Main Streamlit application
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
from clickhouse_utils import get_leaderboard, run_query

st.set_page_config(
    page_title="Werewolf Arena Analytics",
    page_icon="🐺",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Auto-refresh
st_autorefresh(interval=5000, key="auto_refresh")

# ── Sidebar ──
st.sidebar.title("🐺 Arena Analytics")
page = st.sidebar.radio("Navigation", [
    "Overview", "Leaderboard", "Agent Details", 
    "Game Explorer", "Tournaments", "System Health"
])

# ── Overview Page ──
if page == "Overview":
    st.title("Werewolf Arena - Real-Time Overview")
    
    # KPI Cards
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        total_games = run_query("SELECT count() FROM game_results")[0][0]
        st.metric("Total Games", f"{total_games:,}")
    
    with col2:
        avg_time = run_query("SELECT avg(duration_ms)/60000 FROM game_results")[0][0]
        st.metric("Avg Game Time", f"{avg_time:.1f} min")
    
    with col3:
        v_win = run_query("""
            SELECT countIf(winner_faction='villager') * 100.0 / count() 
            FROM game_results
        """)[0][0]
        st.metric("Villager Win Rate", f"{v_win:.1f}%")
    
    with col4:
        active = run_query("SELECT uniqExact(agent_id) FROM agent_performances WHERE ended_at > now() - 3600")[0][0]
        st.metric("Active Agents (1h)", active)
    
    # Charts
    col_left, col_right = st.columns(2)
    
    with col_left:
        st.subheader("Win Rate by Role")
        role_data = run_query("""
            SELECT role, avg(won) * 100 as win_rate, count() as games
            FROM agent_performances
            GROUP BY role
            ORDER BY win_rate DESC
        """)
        df_role = pd.DataFrame(role_data, columns=['Role', 'Win Rate', 'Games'])
        fig = px.bar(df_role, x='Role', y='Win Rate', color='Games')
        st.plotly_chart(fig, use_container_width=True)
    
    with col_right:
        st.subheader("ELO Distribution")
        elo_data = run_query("""
            SELECT elo_after, count() as freq
            FROM agent_performances
            GROUP BY elo_after
            ORDER BY elo_after
        """)
        df_elo = pd.DataFrame(elo_data, columns=['ELO', 'Frequency'])
        fig = px.histogram(df_elo, x='ELO', y='Frequency', nbins=30)
        st.plotly_chart(fig, use_container_width=True)
```

### 10.5 Pipeline Throughput Specifications

| Layer | Component | Target Throughput | Latency |
|-------|-----------|-------------------|---------|
| Ingestion | Kafka | 100K events/sec | <10ms produce |
| Processing | ClickHouse insert | 50K rows/sec | <100ms visible |
| Query | ClickHouse SELECT | <50ms for dashboard queries | 50ms p99 |
| Visualization | Streamlit | 10 concurrent users | <1s page load |
| Monitoring | Grafana | 50 panels | <5s refresh |

---

## Appendix A: ELO Algorithm Pseudocode (Complete)

### A.1 Multiplayer Team-Based ELO

```
FUNCTION update_elo_team_based(players, winner_faction, k_factor=32):
    // Separate players by faction
    wolves = FILTER players WHERE faction == 'werewolf'
    villagers = FILTER players WHERE faction == 'villager'
    
    // Calculate average team ratings
    wolf_avg = MEAN(wolves.elo)
    villager_avg = MEAN(villagers.elo)
    
    // Expected scores
    E_wolf = 1 / (1 + 10^((villager_avg - wolf_avg) / 400))
    E_villager = 1 - E_wolf
    
    // Actual scores
    S_wolf = 1 IF winner_faction == 'werewolf' ELSE 0
    S_villager = 1 IF winner_faction == 'villager' ELSE 0
    
    // Update each player
    FOR EACH player IN wolves:
        player.elo += k_factor * (S_wolf - E_wolf)
    
    FOR EACH player IN villagers:
        player.elo += k_factor * (S_villager - E_villager)
    
    RETURN players

FUNCTION update_elo_individual_performance(players, game_metrics, k_factor=32):
    // Weight ELO change by individual performance
    FOR EACH player IN players:
        team_avg_perf = MEAN(FILTER players WHERE faction == player.faction).performance
        individual_perf = game_metrics[player.id].performance_score
        
        // Performance ratio: >1 means above-average contribution
        perf_ratio = individual_perf / team_avg_perf
        
        // Base ELO change
        base_change = k_factor * (player.actual_score - player.expected_score)
        
        // Weight by performance
        player.elo += base_change * perf_ratio
    
    RETURN players
```

### A.2 TrueSkill Werewolf Integration

```python
from trueskill import Rating, rate

def rate_werewolf_game(players, winner_faction):
    """
    Rate a Werewolf game using TrueSkill.
    
    Players in the winning faction get rank 0.
    Players in the losing faction get rank 1.
    Ties (draws) would get equal ranks.
    """
    # Build rating groups: each player is their own team
    rating_groups = [(p.rating,) for p in players]
    
    # Assign ranks by faction
    ranks = [
        0 if p.faction == winner_faction else 1
        for p in players
    ]
    
    # TrueSkill update
    new_ratings = rate(rating_groups, ranks=ranks)
    
    # Update player ratings
    for i, player in enumerate(players):
        player.rating = new_ratings[i][0]
    
    return players

def get_match_quality(ratings_a, ratings_b):
    """Assess match quality between two teams of agents."""
    from trueskill import quality
    return quality([ratings_a, ratings_b])
```

---

## Appendix B: Tournament Format Decision Matrix

| Scenario | Recommended Format | Rounds | Games | Rationale |
|----------|-------------------|--------|-------|-----------|
| 4-8 agents, thorough evaluation | Round-Robin | 7 | 28-56 | Everyone plays everyone; role alternation [^127^] |
| 8-16 agents, balanced | Swiss (Standard) | 4-5 | 32-80 | Good ranking without full RR [^446^] |
| 16-64 agents, large scale | Swiss (Extended) | 6-7 | 96-224 | Efficient for large fields [^451^] |
| Quick preliminary screening | Swiss (Fast) | ceil(log2(n)) | Varies | Minimum rounds for ranking [^446^] |
| Championship final | Bracket (top-4/8) | 2-3 | 3-7 | Clear winner from pool play [^452^] |
| Annual competition | Swiss + Bracket Hybrid | 7+ | 100+ | Best of both systems [^452^] |

---

## Appendix C: Complete Metrics Reference

### C.1 Metric Computation Pseudocode

```python
class MetricsCalculator:
    def compute_tas(self, votes, round_num, traitors):
        """Traitor Agreement Score - voting bloc unity."""
        if len(traitors) <= 1:
            return 1.0
        traitor_votes = [votes[t][round_num] for t in traitors]
        most_common = mode(traitor_votes)
        return sum(1 for v in traitor_votes if v == most_common) / len(traitors)
    
    def compute_fcr(self, votes, round_num, faithful, traitors):
        """Faithful Correctness Rate - correct traitor identification."""
        if not faithful:
            return 0.0
        correct = sum(1 for f in faithful if votes[f][round_num] in traitors)
        return correct / len(faithful)
    
    def compute_tsr(self, initial_traitors, surviving_traitors):
        """Traitor Survival Rate - deception effectiveness."""
        return len(surviving_traitors) / len(initial_traitors)
    
    def compute_des(self, eliminations, rounds, traitors, faithful):
        """Deception Effectiveness Score - successful manipulation."""
        manipulations = 0
        for r in rounds:
            eliminated = eliminations[r]
            if eliminated in faithful:
                # Check if all traitors voted for the eliminated faithful
                if all(votes[t][r] == eliminated for t in traitors):
                    manipulations += 1
        return manipulations / len(rounds)
    
    def compute_voting_entropy(self, votes, round_num):
        """Shannon entropy of vote distribution."""
        vote_counts = Counter(votes[round_num].values())
        total = sum(vote_counts.values())
        entropy = -sum((c/total) * math.log2(c/total) for c in vote_counts.values())
        return entropy
    
    def compute_tns(self, trust_matrix, rounds):
        """Trust Network Stability - temporal consistency."""
        correlations = []
        for i in range(len(rounds) - 1):
            r1 = trust_matrix[rounds[i]].flatten()
            r2 = trust_matrix[rounds[i+1]].flatten()
            correlations.append(pearsonr(r1, r2)[0])
        return mean(correlations) if correlations else 0.0
```

### C.2 Metric Correlations and Interpretation

| Metric Pair | Expected Correlation | Interpretation |
|-------------|---------------------|----------------|
| TAS ↑ → TSR ↑ | Strong positive | Coordinated wolves survive longer |
| FCR ↑ → FSR ↑ | Strong positive | Correct detection → faithful survival |
| TAS ↑ → FCR ↓ | Strong negative | Wolf coordination confuses faithful |
| DES ↑ → TSR ↑ | Strong positive | Effective manipulation → survival |
| VSF ↑ → TNS ↓ | Moderate negative | Frequent switching → unstable trust |
| Voting Entropy ↓ → DES ↑ | Moderate negative | Consensus often manipulated by wolves |

---

## Appendix D: Source Index

| Citation | Source | Description |
|----------|--------|-------------|
| [^127^] | Werewolf Arena (Google Research) | LLM evaluation through social deduction; ELO tournaments, dynamic bidding, 100K simulations |
| [^135^] | ELO-rated Sequence Rewards (ERRL) | ELO applied to RL reward shaping for Atari games |
| [^136^] | WOLF Benchmark | LangGraph Werewolf; 7,320 statements analyzed; deception taxonomy, exponential smoothing |
| [^140^] | G-Eval (Microsoft Azure AI) | LLM-as-Judge with CoT; 0.514 Spearman correlation; probability-weighted scoring |
| [^142^] | G-Eval Deep Dive (Galileo) | Probability normalization, cost analysis, purpose-built eval models |
| [^145^] | Event Sourcing Pattern (Azure) | Microsoft architecture guide for event sourcing + CQRS |
| [^148^] | G-Eval Guide (Confident AI) | Three-step process, Auto-CoT, bias mitigation strategies |
| [^155^] | The Traitors | Multi-agent deception; 10-metric evaluation; GPT-4o deception-detection asymmetry |
| [^156^] | The Traitors (Full Paper) | Complete metric definitions, formal notation, behavioral analysis |
| [^209^] | Event Sourcing + CQRS (Medium) | Hero adventure game example; Node.js/TypeScript implementation |
| [^446^] | Swiss Bracket Generator (Brakto) | Swiss system overview, round calculator, format comparison |
| [^447^] | Event Sourcing + CQRS (Medium) | Append-only store, advantages, chess game example |
| [^451^] | Swiss System Generator | Dutch, Monrad, Burstein pairing; tiebreakers; round counts |
| [^462^] | Pgx (GPU Batch Simulation) | Hardware-accelerated parallel game simulators; JAX-based; 1024-game batches |
| [^464^] | Emergent Tool Use (OpenAI) | Hide-and-seek emergent strategies; 6 distinct strategy phases |
| [^466^] | FIDE Dutch System (2026) | Official Swiss pairing rules; 21 criteria; C1-C21 specification |
| [^467^] | ClickHouse + Streamlit (OneUptime) | Real-time dashboard setup, query caching, connection management |
| [^475^] | ELO in MOBA Games | Performance-weighted ELO; MOBA adaptation; dominance coefficients |
| [^477^] | Round Robin Scheduler | Circle method algorithm; balanced home/away; 2-32 teams |
| [^478^] | ClickHouse Real-Time Analytics | Stream processing vs analytical querying; materialized views |
| [^481^] | Team-Based ELO Ranking | ELO math fundamentals; multiplayer adaptation formula; K-factor |
| [^486^] | TrueSkill Documentation | Python implementation; Gaussian skill model; any match structure |
| [^487^] | TrueSkill Paper (NIPS) | Bayesian skill rating; Halo 2 evaluation; convergence properties |
| [^490^] | Kaggle Werewolf | LLM evaluation; ~60% villager win rate target; competitive adjustments |
| [^493^] | Elo-MMR | Principled Bayesian approximation; massive multiplayer; parallel computation |
| [^35^] | Werewolf-AgentX | A2A protocol; dual ELO + LLM-Judge; 8-player standard; multi-dimensional metrics |
| [^117^] | Agent-as-a-Judge Survey | ChatEval multi-agent debate; 10-16% improvement; diverse personas critical |
| [^121^] | Kaggle Game Arena | Evergreen benchmarks; streamed tournaments; discoverable leaderboards |
| [^24^] | Prompt Caching | 59-90% cost reduction; repeated content optimization |
| [^25^] | LLM Cost Optimization | 5 levers: routing, caching, compaction, batching, prompt optimization |
| [^128^] | Redpanda + ClickHouse + Streamlit | Real-time gaming analytics; materialized views; SQL-first pipeline |
| [^158^] | Kafka Gaming Architecture (2025) | KRaft mode; Avro/Protobuf; exactly-once; partitioned by player |
| [^133^] | MultiagentBench | Emergent behavior detection; LLM-as-Judge for pattern detection |
| [^448^] | CourtEval | Courtroom-based multi-agent evaluation; Grader/Critic/Defender/Controller |
| [^450^] | ChatEval GitHub | Multi-agent referee team; simultaneous talk; persona diversity |
| [^454^] | ChatEval (ICLR 2024) | Multi-agent debate; 10-16% human correlation improvement |
| [^468^] | Swiss MWM Engine | Maximum weight matching; Burstein >> Dutch BBP ranking quality |

---

## Appendix E: Implementation Checklist

### Phase 1: Simulation Engine (Weeks 1-2)
- [ ] Implement batch game runner with async execution
- [ ] Integrate LLM API clients with model routing
- [ ] Build event schema and JSONL logging
- [ ] Create agent registry with role assignment

### Phase 2: Tournament System (Weeks 2-3)
- [ ] Round-robin scheduler with circle method
- [ ] Swiss system with Dutch pairing (FIDE-compliant)
- [ ] Bracket generator for playoffs
- [ ] Tournament orchestrator with progress tracking

### Phase 3: Rating System (Week 3)
- [ ] Multiplayer ELO with team-based adaptation
- [ ] Per-role ELO tracking
- [ ] TrueSkill integration as alternative
- [ ] K-factor schedule implementation

### Phase 4: Metrics Pipeline (Weeks 3-4)
- [ ] The Traitors metrics suite (TAS, FCR, TSR, DES, IDR, BRR, VSF, TNS)
- [ ] Custom metrics (PMI, DCI, SRI, ACI, LPI)
- [ ] WOLF deception taxonomy integration
- [ ] Real-time metrics computation

### Phase 5: Evaluation Framework (Week 4)
- [ ] G-Eval integration with 5 dimensions
- [ ] ChatEval multi-agent debate setup
- [ ] Agent-as-a-Judge for trajectory evaluation
- [ ] Bias detection and mitigation

### Phase 6: Event Sourcing & Replay (Weeks 4-5)
- [ ] Event store with append-only semantics
- [ ] CQRS read/write model separation
- [ ] Full game rehydration
- [ ] Time-travel query support

### Phase 7: Data Pipeline (Week 5)
- [ ] Kafka/Redpanda event streaming
- [ ] ClickHouse schema and materialized views
- [ ] Streamlit dashboard with auto-refresh
- [ ] Grafana monitoring setup

### Phase 8: Dashboard & Visualization (Week 6)
- [ ] Overview page with KPI cards
- [ ] Live ELO leaderboard
- [ ] Agent detail pages
- [ ] Game explorer with replay
- [ ] Tournament bracket display

---

*Research compiled from 20+ independent web searches across AI tournament systems, ELO rating adaptations, event sourcing architectures, real-time analytics pipelines, LLM evaluation frameworks, behavioral metrics, and game simulation platforms. All findings include inline citations to original sources.*

*Dimension 09 completes the simulation, analytics, and evaluation systems specification for the Werewolf multiplayer game platform.*
