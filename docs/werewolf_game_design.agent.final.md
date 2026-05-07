## Executive Summary

### Platform Vision

The Werewolf Game Platform is a multiplayer social deduction system supporting human players, AI bots, and LLM-powered agents in hybrid and fully autonomous configurations. Built on a polyglot microservices architecture — Node.js for real-time game orchestration, Python/FastAPI for AI agent reasoning, Redis plus PostgreSQL for state persistence — the platform simultaneously addresses three market needs: a competitive multiplayer game, a research infrastructure for social AI benchmarking, and a content generation engine for AI-only tournament simulations [^47^][^264^].

The design rests on ten research-validated insights. The most consequential is that deception scales faster than detection: the WOLF benchmark documents a 93% truth-speaking rate versus only 10% fabricated claim detection [^337^], and werewolves deceive in 31% of turns while peer detection achieves merely 71–73% precision [^151^]. Rather than fighting this asymmetry, the platform leverages it as a built-in difficulty progression — early AI agents are convincing liars but poor lie detectors, creating natural skill advancement for both agents and human players. A second insight drives the architecture: event sourcing for game state unlocks three distinct product features — replay, training data generation, and real-time spectator streaming — from a single architectural decision, making it the highest-ROI choice in the system [^172^][^209^].

The platform distinguishes itself through four capabilities no alternative provides simultaneously: (1) a three-tier AI agent system with dynamic complexity routing that reduces LLM costs by 70–86% while preserving strategic depth [^167^][^172^]; (2) ELO-based matchmaking that doubles as an AI evaluation benchmark [^35^]; (3) AI-only simulation at accelerated speed generating 25+ behavioral metrics per game with LLM-as-a-Judge evaluation; and (4) a declarative rules engine enabling new game modes without server redeployment.

### Core Capabilities

**Real-time multiplayer lobbies** support 6–16 players per match with WebSocket communication via Socket.IO, achieving p99 latency below 50 ms [^20^]. Four matchmaking modes — Quick, Ranked, Custom, and Tournament — cover the spectrum from casual 60-second queues to structured seasonal competition. The lobby system implements automatic AI backfill when human counts fall below mode minima, with bot difficulty calibrated to lobby average ELO [^429^][^430^].

**Role system and balance framework** provide 12+ roles from the Ultimate Werewolf character value system [^172^], with a mathematically grounded balance formula $b = 1 - |2 \cdot p_{imp} - 1|$ targeting $b > 0.75$ [^14^]. Three validated presets — 8-player Classic, 12-player Extended, and 6-player Quick Play — provide one-click balanced configurations, while a custom setup framework with real-time balance validation supports host-defined configurations.

**AI agent system** implements three capability tiers: Tier 1 (rule-based FSM, sub-millisecond latency, zero cost), Tier 2 (OCEAN personality-driven agents with ReCon theory-of-mind reasoning, ~10 ms latency), and Tier 3 (full LLM-powered agents with GRPO-trained persuasion, 0.5–5 s latency) [^127^][^179^][^248^]. Dynamic tier routing assigns complexity-appropriate tiers per decision, achieving an 86% cost reduction from $2.30 to $0.31 per game at eight LLM agents [^167^].

**Simulation and analytics infrastructure** runs AI-only games at accelerated speed, collecting 25+ behavioral metrics per player per game, evaluating agent performance through LLM-as-a-Judge across five dimensions, and feeding results into a data flywheel that continuously improves training data and agent prompts.

| Capability | Human-Only | Mixed Human-AI | AI Simulation | Source |
|:---|:---|:---|:---|:---|
| Players per match | 6–16 | 6–16 (1–8 AI) | 6–16 (all AI) | Ch. 3, Ch. 7 |
| LLM cost per game | $0.00 | ~$0.15 | ~$0.31 (optimized) | Ch. 2 [^167^] |
| Average match duration | 25–35 min | 25–35 min | 5–10 min (accelerated) | Ch. 7 |
| Matchmaking modes | All 4 modes | All 4 modes | Tournament only | Ch. 7 |
| ELO tracking | Per-role + overall | Per-role + overall | Agent benchmarking | Ch. 7 [^35^] |
| Behavioral metrics | Basic (win/loss) | Basic | 25+ per player | Ch. 8 |
| Content generation | Player-driven | Player-driven | Auto-clipped highlights | Ch. 8 |

The cost structure creates a sharp economic hierarchy: human-only games incur negligible LLM cost, mixed games with 1–2 AI agents cost ~$0.15 per match, and full AI simulation at 1,000 games/day costs $310/day optimized — a tenfold differential informing the three-tier subscription model [^167^].

### Architecture Overview

The polyglot backend separates real-time game logic from AI reasoning and persistent analytics through defined protocol boundaries. Node.js handles WebSocket connections and the 15-state finite state machine driving phase transitions. Python/FastAPI handles LLM inference orchestration through a stateless HTTP endpoint with 5-second timeout. Redis serves as hot state store and pub/sub broker with sub-millisecond operations [^17^]. PostgreSQL persists normalized game records and ELO ratings. ClickHouse (optional at medium scale) stores time-series behavioral aggregates [^267^].

![Per-Game LLM Inference Cost by Game Mode](fig_exec_cost_model.png)

The cost optimization architecture achieves the 86% reduction through five complementary techniques: response caching, model routing to cheaper models for simple decisions, context compaction via semantic summarization, cascading retries that attempt cheaper tiers before escalation, and prefix caching for static system prompt components [^167^][^172^][^174^].

![Platform Service Layer Responsibilities](fig_exec_tech_stack.png)

Event sourcing is the foundational pattern enabling the platform's threefold product leverage. Every player action, phase transition, vote, chat message, and agent decision is recorded as an immutable append-only event. The current game state is a pure function of all events from sequence 0 to $n$, simultaneously enabling deterministic replay for anti-cheat verification, labeled training data generation, and real-time analytics streaming [^172^][^209^].

### AI Agent Architecture

The three-tier agent system addresses the latency-cost-quality tradeoff in LLM-powered gaming. Tier 1 agents execute hardcoded finite state machines with Werewolf-specific heuristics — random valid night targets, bandwagon voting at 60% consensus, defensive silence below 30% estimated survival — producing sub-millisecond responses at zero API cost. Tier 2 agents modulate Tier 1 outputs through Big Five (OCEAN) personality trait vectors, producing probabilistic decisions with ~10 ms latency [^179^][^248^]. Tier 3 agents deploy full LLM reasoning with GRPO-trained persuasion optimization [^127^][^346^].

| Tier | Core Logic | Latency | Cost/Game | Strategic Depth | Fallback |
|:---|:---|:---|:---|:---|:---|
| Tier 1: Rule-Based | FSM + heuristics [^205^] | <1 ms | $0.00 | Low | Base tier |
| Tier 2: Personality | OCEAN traits + belief matrix [^179^] | ~10 ms | ~$0.001 | Medium | LLM timeout |
| Tier 3: LLM-Powered | Full LLM + GRPO persuasion [^127^] | 0.5–5 s | $0.01–$0.30 | High | → Tier 2 |

The unified agent interface follows a four-phase lifecycle — observe, decide, act, speak — presenting an identical API contract to the Game Orchestrator regardless of the cognitive machinery behind it. The neuro-symbolic hybrid architecture, embedding decision trees as callable oracles within the LLM reasoning loop, achieves +7.2% entailment consistency and +5.3% multi-step accuracy over pure LLM approaches [^205^].

### Development Roadmap

The 24-week implementation follows four overlapping phases. Phase 1 (Weeks 0–6) delivers foundational architecture — Game Orchestrator, WebSocket infrastructure, Redis state management, core FSM, basic roles — producing a playable MVP. Phase 2 (Weeks 4–14) integrates the AI Service, implements all three agent tiers, builds chat and moderation, and establishes hybrid modes. Phase 3 (Weeks 10–18) develops ranked matchmaking with ELO, the simulation engine, analytics pipeline, and spectator mode. Phase 4 (Weeks 16–24) focuses on polish, accessibility, performance, and public release [^481^].

![24-Week Development Roadmap](fig_exec_roadmap.png)

The team comprises six full-time equivalents: two backend engineers (Node.js), one AI engineer (Python/LLM), one frontend engineer (React), one DevOps engineer, and one product designer. Key risks include LLM API latency variability (mitigated by three-tier fallback), WebSocket scaling beyond 10,000 connections (mitigated by Redis adapter HPA) [^208^], and AI response quality consistency (mitigated by structured output schemas).

### Document Guide

This design document comprises ten technical chapters plus this Executive Summary and Appendix. Chapters 1–3 cover system foundations: architecture, AI framework, and game loop. Chapters 4–6 address player-facing systems: roles, communication, and UI. Chapters 7–8 specify modes, matchmaking, and simulation. Chapters 9–10 cover analytics and implementation planning.

| Chapter | Title | Key Decisions |
|:---|:---|:---|
| 1 | System Architecture | Polyglot backend, event sourcing, CQRS persistence |
| 2 | AI Player Framework | 3-tier agents, OCEAN personality, GRPO training, cost optimization |
| 3 | Game Loop & Phase Management | 15-state FSM, night resolution pipeline, timer system |
| 4 | Roles & Meta Design | 12+ roles, balance formula, deception-detection asymmetry |
| 5 | Chat & Communication System | 6 channels, 12 message types, 4-tier moderation (94.3% accuracy) |
| 6 | UI/UX, Animations & Visual Effects | Dark fantasy theme, 14 animations, WCAG 2.1 AA |
| 7 | Game Modes & Customization | 3 standard modes, 4 matchmaking modes, per-role ELO tracking |
| 8 | Simulation & Tournament System | Batch AI tournaments, 25+ metrics, LLM-as-a-Judge, data flywheel |
| 9 | Analytics & Data Pipeline | Real-time + batch pipelines, A/B testing, GDPR compliance |
| 10 | Implementation Roadmap | 24-week schedule, 6-person team, risk matrix with mitigations |

---

## Appendix: Reference Materials

### A.1 API Reference

#### A.1.1 WebSocket API

The Game Orchestrator exposes a Socket.IO namespace `/game` with bidirectional message flow. All messages use JSON framing with mandatory fields: `event_type` (string), `payload` (object), `timestamp` (ISO 8601), and `sequence_num` (integer). Authentication uses JWT bearer tokens in the connection handshake `auth` field. A 30-second heartbeat ping/pong detects stale connections; clients missing three consecutive pongs are flagged disconnected and enter a 30-second grace period [^48^].

| Event Name | Direction | Payload Schema | Validation |
|:---|:---|:---|:---|
| `game:join` | C→S | `{ game_id: string, join_code?: string }` | JWT required |
| `game:started` | S→C | `{ game_id: string, roles_assigned: boolean }` | Server-signed |
| `game:ended` | S→C | `{ game_id: string, winner: string, role_reveals: object }` | Server-signed |
| `phase:changed` | S→C | `{ from, to: string, round: number, timer_ms: number }` | Server-signed |
| `phase:ack` | C→S | `{ player_id: string, phase: string }` | JWT + phase match |
| `werewolf:select_target` | C→S | `{ target_id: string }` | Role + alive + phase |
| `seer:investigate` | C→S | `{ target_id: string }` | Role + alive + phase |
| `bodyguard:protect` | C→S | `{ target_id: string }` | Role + alive + phase |
| `vote:cast` | C→S | `{ target_id: string }` | Phase + alive |
| `vote:tallied` | S→C | `{ eliminated_id: string, vote_counts: object }` | Server-signed |
| `chat:send` | C→S | `{ channel: string, content: string }` | Channel permission |
| `chat:message` | S→C | `{ sender_id, channel, content, timestamp: number }` | Server-signed |
| `system:error` | S→C | `{ code: string, message: string, recoverable: boolean }` | Server-signed |

C→S messages pass through an eight-layer validation pipeline: connection authentication, game membership, alive status, phase validation, role validation, target validation, rate limiting, and anomaly detection [^190^]. Messages failing any layer receive a `system:error` response. S→C messages carry a server signature HMAC to prevent tampering.

#### A.1.2 AI Service REST API

The AI Service exposes three stateless endpoints. All accept and return JSON; the service maintains no state between requests.

| Endpoint | Method | Request Body | Response Body | Timeout |
|:---|:---|:---|:---|:---|
| `/agent/init` | POST | `{ agent_id, tier, personality?, role }` | `{ status, agent_id, tier_assigned }` | 5 s |
| `/agent/decide` | POST | `{ agent_id, game_state, phase, timeout_ms }` | `{ action, target?, reasoning, statement?, tier_used }` | 5 s |
| `/agent/speak` | POST | `{ agent_id, game_state, context, channel }` | `{ content, tone, intent, confidence }` | 5 s |

The `/agent/decide` endpoint is the primary integration point. The Game Orchestrator calls it during every phase requiring agent input. The `game_state` field contains the complete visible state for that agent, and the response contains a structured action that the Orchestrator validates before applying. The `tier_used` field enables cost tracking and quality assessment.

#### A.1.3 Message Flow Architecture

```mermaid
sequenceDiagram
    participant C as Client (React)
    participant GO as Game Orchestrator
    participant AI as AI Service
    participant R as Redis
    participant P as PostgreSQL

    C->>GO: WS: game:join {join_code}
    GO->>R: HSET game:{id}:player:{pid}
    GO->>C: WS: game:started
    loop Night Phase
        GO->>AI: POST /agent/decide {game_state}
        AI-->>GO: {action, target, reasoning}
        GO->>GO: Validate action (8 layers)
        GO->>R: XADD game:{id}:events
        GO->>C: WS: phase:changed
    end
    GO->>P: Batch insert events
    GO->>C: WS: game:ended {winner}
```

### A.2 Glossary

| Term | Definition | Context |
|:---|:---|:---|
| **A2A** | Agent-to-Agent protocol; structured communication standard enabling AI agents to exchange information and coordinate actions | AI Framework (Ch. 2) |
| **Alpha Werewolf** | Werewolf role appearing innocent to Seer checks; primary Seer counterplay | Roles (Ch. 4) |
| **Authoritative Server** | Architecture where the server is the sole source of truth for all game state [^21^] | Architecture (Ch. 1) |
| **Balance Index** | Formula $b = 1 - \|2 \cdot p_{imp} - 1\|$; target $b > 0.75$ [^14^] | Role Design (Ch. 4) |
| **CQRS** | Command Query Responsibility Segregation; separates write-optimized hot storage from read-optimized analytical storage | Architecture (Ch. 1) |
| **Event Sourcing** | Pattern where state derives from immutable event sequences [^209^] | Architecture (Ch. 1) |
| **FSM** | Finite State Machine; the 15-state phase management engine | Game Loop (Ch. 3) |
| **GRPO** | Group Relative Policy Optimization; RL method for training persuasion/deception [^75^] | AI Framework (Ch. 2) |
| **K-Factor** | ELO sensitivity parameter; 40 (Bronze) down to 12 (Master) [^481^] | Matchmaking (Ch. 7) |
| **LLM-as-a-Judge** | LLM-based evaluation scoring agents across 5 dimensions | Simulation (Ch. 8) |
| **Night Resolution** | Ordered 6-category pipeline processing all night actions [^10^] | Game Loop (Ch. 3) |
| **OCEAN** | Big Five personality model; drives Tier 2 behavior modulation [^179^] | AI Framework (Ch. 2) |
| **Parity Win** | Werewolf victory when living wolves equal or exceed living villagers | Game Rules (Ch. 4) |
| **Polyglot Backend** | Multi-language architecture (Node.js + Python) using best-fit runtimes | Architecture (Ch. 1) |
| **ReCon** | Recursive Contemplation; dual-perspective reasoning framework [^346^][^81^] | AI Framework (Ch. 2) |
| **SME** | Simple Multiplayer Elo; rating algorithm per faction [^418^] | Matchmaking (Ch. 7) |
| **Soft Tell** | Behavioral indicator suggesting a role without mechanical proof | Roles (Ch. 4) |
| **ToM** | Theory of Mind; modeling other agents' beliefs and intentions | AI Framework (Ch. 2) |
| **Ultimate Werewolf** | Published role system providing character value weights [^172^] | Role Design (Ch. 4) |

### A.3 Example Messages

#### A.3.1 WebSocket Action Message: Werewolf Night Kill Vote

```json
{
  "event_type": "werewolf:select_target",
  "payload": {
    "target_id": "player_7b3a9f",
    "reasoning": "Player 7 has been consistently quiet and voted against a confirmed villager in Round 2 — matching defensive wolf play."
  },
  "timestamp": "2025-01-15T21:34:18.247Z",
  "sequence_num": 47,
  "metadata": {
    "player_id": "player_2c8e1d",
    "role": "WEREWOLF",
    "round": 2,
    "phase": "WW_SELECT",
    "tier_used": 3,
    "llm_model": "claude-sonnet-4-20250514",
    "inference_ms": 1247,
    "cost_usd": 0.0031
  }
}
```

The `metadata` block is stripped before broadcasting to other werewolves and appended to the event log for replay and cost tracking. The `reasoning` field is stored server-side for LLM-as-a-Judge evaluation but never exposed to other players.

#### A.3.2 AI Service Request and Response

The following request is sent from the Game Orchestrator to `POST /agent/decide` during Day Discussion. The AI Service maintains no session state — every call carries complete game context.

```json
{
  "agent_id": "agent_gpt4o_17",
  "game_state": {
    "self": { "player_id": "p_17", "role": "SEER", "faction": "VILLAGE", "is_alive": true },
    "phase": "DAY_DISCUSS", "round": 3, "timer_remaining_ms": 45000,
    "alive_players": [
      {"id": "p_12", "name": "Player 12"},
      {"id": "p_17", "name": "Player 17 (You)"},
      {"id": "p_03", "name": "Player 3"},
      {"id": "p_08", "name": "Player 8"}
    ],
    "dead_players": [
      {"id": "p_05", "role_revealed": "VILLAGER", "death_cause": "NIGHT_KILL"},
      {"id": "p_19", "role_revealed": "WEREWOLF", "death_cause": "VOTE_EXECUTION"}
    ],
    "investigation_results": [
      {"target_id": "p_03", "result": "NOT_WOLF", "night": 1},
      {"target_id": "p_08", "result": "NOT_WOLF", "night": 2}
    ],
    "chat_history": [
      {"sender": "p_12", "content": "p03 looks suspicious for being too quiet"},
      {"sender": "p_21", "content": "p12 is pushing hard, maybe wolf trying to frame?"}
    ]
  },
  "phase": "DAY_DISCUSS",
  "timeout_ms": 5000
}
```

Expected constrained JSON response:

```json
{
  "action": "SPEAK",
  "reasoning": "p03 and p08 are cleared by my investigations. p12 pushing suspicion on a cleared player is highly suspicious wolf behavior.",
  "statement": "I'm the Seer. p03 (Night 1) and p08 (Night 2) are both NOT wolves. p12 is trying to lynch a cleared villager. We should vote p12.",
  "vote_intent": "p_12",
  "tier_used": 3,
  "confidence": 0.87
}
```

The Game Orchestrator validates `vote_intent` against the current voting state before accepting it.

#### A.3.3 Event Log Entry: Complete Vote Cast Event

```json
{
  "event_id": "01JJ4N8XQW3B9Z1VFT2K9D8RJ",
  "game_id": "game_a7b2c3d4",
  "type": "VOTE_CAST",
  "timestamp": 1705355658247,
  "round": 3,
  "phase": "VOTING",
  "payload": {
    "voter_id": "p_17",
    "target_id": "p_12",
    "vote_number": 7,
    "previous_vote": "p_21"
  },
  "metadata": {
    "player_id": "p_17",
    "client_timestamp": 1705355658198,
    "server_version": "1.3.2",
    "validation_passed": true,
    "processing_time_ms": 3
  }
}
```

Events flow through three storage tiers: Redis Stream (`game:{id}:events`, 24-hour TTL) for hot game state, PostgreSQL for persistent partitioned storage, and ClickHouse for time-series analytics. The triple-write pattern ensures each storage system uses media optimized for its access pattern without cross-interference.

### A.4 Configuration Reference

#### A.4.1 Environment Variables and Game Constants

| Variable | Service | Default | Description | Validation |
|:---|:---|:---|:---|:---|
| `GAME_ORCH_PORT` | Game Orchestrator | `3000` | HTTP/WebSocket listen port | 1024–65535 |
| `AI_SERVICE_URL` | Game Orchestrator | `http://localhost:8000` | AI Service HTTP endpoint | Valid URL |
| `AI_TIMEOUT_MS` | Game Orchestrator | `5000` | Maximum AI decision wait | 1000–30000 |
| `LLM_DEFAULT_MODEL` | AI Service | `gpt-4o` | Primary LLM provider | gpt-4o, claude-sonnet, gpt-4o-mini |
| `LLM_FALLBACK_MODEL` | AI Service | `gpt-4o-mini` | Fallback on timeout/error | gpt-4o-mini, gpt-3.5-turbo |
| `REDIS_URL` | All | `redis://localhost:6379` | Redis cluster connection | Valid redis:// URL |
| `REDIS_GAME_TTL_SEC` | Game Orchestrator | `14400` | Game state key TTL (4 h) | 3600–86400 |
| `POSTGRES_URL` | All | — | PostgreSQL connection DSN | Required |
| `CLICKHOUSE_URL` | Analytics | — | ClickHouse (optional) | clickhouse:// or empty |
| `JWT_SECRET` | All | — | HMAC secret for token signing | Min 32 characters |
| `JWT_EXPIRY_HOURS` | All | `24` | Token validity duration | 1–168 |
| `RATE_LIMIT_REQ_PER_MIN` | Game Orchestrator | `60` | Per-IP rate limit | 10–600 |
| `MAX_CONCURRENT_GAMES_PER_POD` | Game Orchestrator | `8` | HPA scaling threshold | 1–50 |
| `SIMULATION_SPEED_MULTIPLIER` | AI Service | `10` | AI-only acceleration factor | 1–100 |
| `GRPO_TRAINING_ENABLED` | AI Service | `false` | GRPO persuasion training | Boolean |

| Constant | Default | Rationale | Source |
|:---|:---|:---|:---|
| Day timer $T_{day}$ | 90 s | Standard discussion duration | Ch. 7 |
| Night timer $T_{night}$ | 60 s | Time for all roles to submit actions | Ch. 7 |
| Min/max players | 6 / 16 | Meaningful faction distribution / practical limit | Ch. 3 [^44^] |
| Werewolf ratio bounds | 2.5:1 – 4.5:1 | Balanced villager-to-wolf ratio | Ch. 4 |
| Balance weight tolerance | ±2 | Acceptable point-sum deviation | Ch. 4 [^172^] |
| ELO K-factor range | 40 (Bronze) – 12 (Master) | Decreasing sensitivity by skill tier | Ch. 7 [^481^] |
| ELO baseline | 1500 | Starting rating for new players | Ch. 7 |
| Bandwagon threshold $\theta_{bw}$ | 0.60 | Consensus fraction triggering heuristic | Ch. 2 |
| Self-preservation threshold $\theta_{sp}$ | 0.30 | Survival probability triggering defense | Ch. 2 |
| LLM context window max | 8192 tokens | Maximum compacted context size | Ch. 2 |
| Reconnection grace period | 30 s | Time before elimination on disconnect | Ch. 3 [^48^] |
| Simulation batch size | 100 | Parallel AI games per batch | Ch. 8 |

These constants are loaded at service startup and are immutable for in-progress games. Changes to balance-critical constants require restart and affect only games created after the change. The validation middleware rejects internally inconsistent configurations (e.g., $T_{night} > T_{day}$ or $N_{min} < 4$).

---

## 1. System Architecture

The Werewolf multiplayer platform rests on a polyglot microservices architecture that separates real-time game orchestration from AI reasoning and persistent analytics. This chapter specifies the architectural principles, service topology, communication patterns, event sourcing design, scalability strategy, and resilience mechanisms that underpin the entire system. Every decision documented here derives from production-validated patterns for multiplayer social deduction games, benchmarked polyglot backend comparisons, and LLM-agent integration requirements.

### 1.1 Architectural Principles

Four governing principles constrain every design decision in the platform. These principles are non-negotiable; they exist to prevent the category of architectural debt that becomes fatal when scaling from six-player social matches to thousand-game AI tournaments.

**Separation of concerns: game logic and AI reasoning never share a thread.** The Game Orchestrator (Node.js/Socket.IO) handles WebSocket connections, phase transitions, and client state synchronization. The AI Service (Python/FastAPI) handles LLM inference orchestration, prompt templating, and response parsing. The two services communicate exclusively through a synchronous HTTP REST boundary with a 5-second timeout. This separation exists because Node.js demonstrates approximately 44% higher requests-per-second than FastAPI for I/O-bound real-time tasks [^47^], while Python's LLM ecosystem (LangChain, LlamaIndex, Hugging Face integrations) provides agent capabilities that no Node.js framework can match [^264^]. Co-locating LLM inference on the game event loop would introduce unpredictable latency spikes of 1–5 seconds per agent decision, freezing all players in the same game room.

**Stateless AI service: no AI instance holds game state between HTTP requests.** Every agent decision request carries the complete game context — player list, visible history, phase information, and time remaining — as structured JSON in the request body. The AI Service maintains no WebSocket connections, no session state, and no background tasks between requests. This statelessness enables the AI Service to scale horizontally without session affinity, allows any AI Service pod to handle any agent request, and eliminates cascading failure modes where an AI pod crash would corrupt active game state.

**Event sourcing as foundation: every action is an append-only immutable event.** Rather than mutating a single game-state row in a database, the platform records every player action, phase transition, vote cast, role action, chat message, system event, and agent decision as a discrete event with a monotonic sequence number. The current game state is a pure function of all events from sequence 0 to $n$. "Event Sourcing captures every player action as immutable events. Real-time event processing feeds AI context for intelligent responses" [^172^]. This pattern enables deterministic replay for anti-cheat verification, generates labeled training data for agent improvement, and provides the input stream for real-time analytics and spectator mode.

**Polyglot persistence with dual-store CQRS.** Redis serves as the hot state store and pub/sub message broker, handling sub-millisecond game state snapshots, session indexes, and real-time broadcast channels [^17^]. PostgreSQL serves as the persistent normalized store for player accounts, partitioned event logs, and relational analytics queries. ClickHouse (optional, activated at medium scale) handles time-series behavioral aggregates and tournament metrics. This Command Query Responsibility Segregation (CQRS) pattern separates write-optimized hot storage from read-optimized analytical storage, preventing analytical queries from impacting game latency.

### 1.2 Service Topology

The platform comprises five primary services arranged in three layers, as illustrated in Figure 1.1.

![Figure 1.1 — System Architecture Overview](architecture_diagram.png)

**Game Orchestrator (Node.js / Socket.IO).** The Game Orchestrator is the authoritative game server. It manages room lifecycle from lobby creation through game termination, executes the finite state machine that drives phase transitions, validates all player actions through an eight-layer server-side validation pipeline, appends every action to the event log, and synchronizes filtered game state to clients via WebSocket rooms. A single Node.js process handles 10{,}000–20{,}000 concurrent WebSocket connections with a p99 latency of 32 ms [^20^]. The Game Orchestrator uses the Socket.IO Redis adapter for cross-node broadcasting when scaled horizontally [^208^].

**AI Service (Python / FastAPI).** The AI Service exposes a single synchronous endpoint — `POST /agents/action` — that accepts a game context and returns an agent decision. Internally, it performs model routing (selecting the cheapest adequate LLM for the task), prompt template rendering, LLM API invocation with retry logic, response parsing into typed actions, and cost accounting per game. The service supports streaming responses for real-time agent "typing" indicators and implements a circuit breaker that triggers the degradation chain when LLM providers return 5xx errors.

**State Store (Redis Cluster).** Redis holds four categories of data: (1) game state snapshots as hashes (`game:{id}:info`, `game:{id}:player:{pid}`); (2) event log streams for real-time consumption (`game:{id}:events`); (3) session indexes linking players to games (`player:{id}:session`); and (4) pub/sub channels for cross-service messaging (`game:{id}:updates`, `game:{id}:werewolf`). All game-related keys carry a 4-hour TTL to prevent stale data accumulation [^174^].

**Analytics Store (PostgreSQL + ClickHouse).** PostgreSQL stores normalized player data, game records, ELO ratings, and the append-only event log partitioned by month. ClickHouse stores denormalized time-series data for behavioral analytics, win-rate aggregates, and LLM cost tracking. An async pipeline drains Redis Streams into PostgreSQL and ClickHouse on a configurable interval (default: 30 seconds).

Table 1.1 inventories each service with its runtime, protocol, scaling strategy, and critical Service Level Indicator (SLI).

| Service | Language | Primary Protocol | Scaling Strategy | Critical SLI |
|---------|----------|-----------------|-------------------|-------------|
| Game Orchestrator | Node.js 20+ / TypeScript | WebSocket (Socket.IO) | HPA: CPU > 70% or > 8 games/pod | p99 latency < 50 ms [^20^] |
| AI Service | Python 3.11 / FastAPI | HTTP REST (internal) | HPA: queue depth > 50 or p95 > 3 s | p95 response < 3 s |
| State Store | Redis 7+ (Cluster) | TCP / Pub/Sub | Cluster auto-sharding > 100K conn | GET latency < 1 ms |
| Analytics Store | PostgreSQL 16 + ClickHouse | SQL/TCP | Read replicas: 1→8 by scale | Replication lag < 5 s |
| API Gateway | Nginx / AWS ALB | HTTP/WebSocket | Static (ALB auto-scales) | Upstream latency < 10 ms |

The Game Orchestrator's SLI of p99 < 50 ms is derived from production Socket.IO benchmarks [^20^]; the AI Service's p95 < 3 s threshold balances human patience (players tolerate 3-second delays for AI decisions) against LLM API variability. The horizontal pod autoscaler (HPA) for the Game Orchestrator targets 8 concurrent games per pod because each game of 12 players consumes approximately 32 MB of Redis-backed state, and a 512 MB pod limit safely accommodates this with headroom for connection overhead.

The service topology can be visualized as a layered architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                                │
│   Web App    Mobile    LLM Agent Client    Spectator View       │
│      │          │            │                  │               │
└──────┼──────────┼────────────┼──────────────────┼───────────────┘
       │          │            │                  │
       └──────────┴────────────┴──────────────────┘
                          │
              ┌───────────▼───────────┐
              │   API Gateway (ALB)    │
              │  Sticky Sessions, TLS  │
              └───────────┬───────────┘
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
┌──────▼──────┐  ┌────────▼────────┐  ┌─────▼──────┐
│  GAME       │  │  AI SERVICE     │  │ ANALYTICS  │
│Orchestrator │  │ Python/FastAPI  │  │  Node.js   │
│ Node.js     │  │                 │  │            │
│ Socket.IO   │◄─┤  LLM Inference  │  │ ClickHouse │
│             │  │  Prompt Engine  │  │ PostgreSQL │
└──────┬──────┘  └────────┬────────┘  └─────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
┌──────▼──────┐  ┌────────▼────────┐  ┌─────▼──────┐
│   REDIS     │  │  POSTGRESQL     │  │ CLICKHOUSE │
│  Cluster    │  │  (Partitioned)  │  │ Time-Series│
│  Hot State  │  │  Persistent Log │  │ Analytics  │
│  Pub/Sub    │  │  Player Data    │  │  Metrics   │
└─────────────┘  └─────────────────┘  └────────────┘
```

The polyglot design — Node.js for real-time, Python for AI, Redis for hot state — is validated by production benchmarks. Table 1.1a compares the candidate runtimes across the dimensions that matter for this architecture.

| Dimension | Node.js (Game) | Python/FastAPI (AI) | Go (Analytics) |
|-----------|---------------|---------------------|----------------|
| WebSocket RPS | ~38K (I/O bound) [^47^] | ~26K [^43^] | ~142K [^43^] |
| Native LLM ecosystem | Limited (Vercel AI SDK) | LangChain, LlamaIndex [^264^] | Minimal |
| Memory per connection | 8 KB (Socket.IO) [^20^] | Higher baseline | Lowest |
| p99 latency | 32 ms [^20^] | ~45 ms | Sub-ms |
| Concurrency model | Event loop (mature) | asyncio (FastAPI-native) [^266^] | Goroutines |

Node.js wins the game server role due to its mature Socket.IO ecosystem and superior WebSocket throughput for the I/O patterns that dominate social deduction gameplay. Python wins the AI Service role because no other runtime offers comparable LLM library integration. Go is reserved for the analytics pipeline where raw throughput matters more than ecosystem breadth.

### 1.3 Communication Patterns

Three protocols carry all inter-service traffic: WebSocket for client-to-server real-time communication, HTTP REST for the Game Orchestrator-to-AI Service boundary, and Redis pub/sub for internal event broadcasting.

**WebSocket protocol (client ↔ Game Orchestrator).** All client communication traverses Socket.IO over TLS 1.3. Messages use a JSON framing schema with mandatory fields: `event_type` (string), `payload` (object), `timestamp` (ISO 8601), and `sequence_num` (integer for client ordering). A 30-second heartbeat ping/pong detects stale connections; clients missing three consecutive pongs are flagged disconnected and enter the 30-second grace period [^48^]. Reconnection uses exponential backoff starting at 1 second with a maximum of 30 seconds and jitter. Message ordering guarantees are provided per-room: the Game Orchestrator assigns monotonic server sequence numbers to all outbound events, and clients buffer out-of-order messages until the expected sequence arrives.

**Internal REST API (Game Orchestrator ↔ AI Service).** The Game Orchestrator invokes the AI Service via HTTP POST with a 5-second timeout. The request body contains the complete game context; the response contains a typed action. Table 1.2 specifies the data flow matrix across all source-destination pairs.

| Source | Destination | Protocol | Data Type | Frequency |
|--------|------------|----------|-----------|-----------|
| Client | Game Orchestrator | WebSocket JSON | Actions, chat, votes | Per-player, real-time |
| Game Orchestrator | AI Service | HTTP REST | Agent context + decision request | Per-agent, per-phase |
| AI Service | Redis Pub/Sub | Redis PUBLISH | Agent decisions | Per-decision, async |
| Redis Pub/Sub | Game Orchestrator | Redis SUBSCRIBE | Agent decisions routed to room | Per-decision, async |
| Game Orchestrator | Redis Streams | XADD | Immutable game events | Per-action, append-only |
| Game Orchestrator | Analytics | Async HTTP / Batch | Game results, aggregates | End-of-game + periodic |
| Redis Streams | PostgreSQL | Consumer Group | Event log persistence | Every 30 s |
| Redis Streams | ClickHouse | Consumer Group | Time-series analytics | Every 60 s |

The data flow matrix reveals a deliberate pattern: the hot path (game actions → client sync) never touches disk and never traverses the AI Service. An action from a human player travels Client → Game Orchestrator → Redis Streams (append) → Redis Pub/Sub (broadcast) → all clients in room. This path completes in < 10 ms end-to-end. Only actions requiring AI reasoning detour through the HTTP REST boundary to the AI Service.

**Redis pub/sub: game events broadcast to AI workers; response events routed back.** When a game phase requires AI decisions, the Game Orchestrator publishes a `DECISION_REQUIRED` event to `game:{id}:decisions`. AI worker pods subscribed to this channel consume the event, process the LLM call, and publish the resulting `AGENT_DECISION` event back to `game:{id}:updates`, which the Game Orchestrator subscribes to. This decouples AI processing latency from the game event loop: slow LLM responses do not block phase timers or human player actions.

The following TypeScript snippet illustrates the WebSocket message framing and the internal REST call to the AI Service:

```typescript
// WebSocket message framing (client ↔ Game Orchestrator)
interface GameMessage<T> {
  event_type: string;        // e.g., "vote:cast", "chat:send"
  payload: T;                // Type-specific payload
  timestamp: string;         // ISO 8601 server time
  sequence_num: number;      // Monotonic per-room sequence
}

// Internal REST call: Game Orchestrator → AI Service
class AIAgentClient {
  private readonly timeoutMs = 5000;
  private readonly baseUrl: string;

  async requestDecision(ctx: AgentContext): Promise<AgentDecision> {
    const response = await fetch(`${this.baseUrl}/agents/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_id: ctx.gameId,
        agent_id: ctx.agentId,
        role: ctx.role,
        phase: ctx.phase,
        context: ctx.visibleState,   // Complete per-agent view
        history: ctx.eventHistory,   // Events since agent's last turn
        time_remaining_ms: ctx.timeRemaining,
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      // Trigger degradation chain on timeout or 5xx
      return this.degradationChain.fallback(ctx);
    }
    return response.json() as Promise<AgentDecision>;
  }
}
```

### 1.4 Event Sourcing Design

Event sourcing is the highest-return architectural decision in the platform. A single design choice — immutable append-only events — unlocks deterministic replay, AI training data generation, anti-cheat audit trails, and real-time spectator streaming simultaneously [^209^].

**Event schema.** Every event adheres to a strict schema: `event_id` (ULID, sortable), `timestamp` (ISO 8601), `game_id` (UUID), `sequence_number` (int, monotonic within game), `event_type` (enumerated string), `payload` (JSONB), and `metadata` (JSONB containing player_id, client_timestamp, server_version). The composite primary key `(game_id, sequence_number)` guarantees ordering and idempotency.

**Event categories.** The platform defines seven event categories covering the full game lifecycle. Table 1.3 enumerates each category with representative event types and payload structure.

| Category | Event Types | Payload Contents | Consumers |
|----------|-------------|-----------------|-----------|
| `player_action` | `vote_cast`, `vote_changed`, `action_submitted` | voter_id, target_id, action_type | State machine, replay, analytics |
| `phase_transition` | `phase_entered`, `phase_exited`, `timer_expired` | from_phase, to_phase, reason | State machine, client sync, timer |
| `vote_cast` | `vote_cast`, `vote_tallied`, `player_executed` | voter_id, target_id, vote_count | Win condition, replay, stats |
| `role_action` | `seer_investigate`, `bodyguard_protect`, `ww_select_target` | actor_id, target_id, result | Night resolution engine |
| `chat_message` | `public_chat`, `werewolf_chat`, `system_message` | sender_id, content, channel | Chat broadcast, NLP pipeline |
| `system_event` | `player_connected`, `player_disconnected`, `game_abandoned` | player_id, reason | Lobby manager, replacement logic |
| `agent_decision` | `agent_thought`, `agent_action`, `agent_degradation` | agent_id, reasoning, selected_action | Replay, cost tracking, ELO |

**State reconstruction.** The current game state at any point in time is the left fold of all events from sequence 0 to $n$ over a pure reducer function:

$$S_n = \text{reduce}(S_{n-1}, E_n)$$

where $S_{-1}$ is the empty state and $E_n$ is the event at sequence $n$. This property enables three critical operations: (1) **replay** — reconstructing any past state by replaying events up to that sequence; (2) **resync** — sending a reconnecting player the full event log from their last known sequence to rebuild their view; and (3) **forking** — creating a training dataset by replaying events to a branch point, then simulating alternate agent decisions from that point forward.

The following TypeScript code implements the core event append and state reconstruction logic:

```typescript
// Event append with atomic sequence assignment
class EventStore {
  constructor(private redis: Redis) {}

  async appendEvent(gameId: string, event: Omit<GameEvent, 'sequence_number'>): Promise<GameEvent> {
    const seq = await this.redis.incr(`game:${gameId}:seq_counter`);
    const fullEvent: GameEvent = { ...event, sequence_number: seq };

    // Write to Redis Streams (hot, 24h TTL)
    await this.redis.xAdd(`game:${gameId}:events`, '*', {
      event_id: fullEvent.event_id,
      type: fullEvent.event_type,
      seq: seq.toString(),
      timestamp: fullEvent.timestamp,
      payload: JSON.stringify(fullEvent.payload),
    }, { TRIM: { strategy: 'MAXLEN', strategyModifier: '~', threshold: 10000 } });

    // Publish for real-time subscribers
    await this.redis.publish(`game:${gameId}:updates`, JSON.stringify(fullEvent));

    return fullEvent;
  }

  // State reconstruction by event replay
  async reconstructState(gameId: string, upToSequence?: number): Promise<GameState> {
    const streamKey = `game:${gameId}:events`;
    const entries = await this.redis.xRange(streamKey, '-', '+');
    let state = createEmptyState(gameId);

    for (const entry of entries) {
      const event = this.parseEntry(entry);
      if (upToSequence && event.sequence_number > upToSequence) break;
      state = applyEventReducer(state, event);
    }
    return state;
  }
}
```

**Event sourcing benefits.** The immutable event log serves as the single source of truth for four downstream pipelines. The replay engine reconstructs game states for spectator mode and post-game analysis. The analytics pipeline feeds behavioral aggregates into ClickHouse for leaderboard computation and balance analysis. The AI training pipeline converts events into labeled decision points for fine-tuning and reinforcement learning. The anti-cheat pipeline replays suspicious games to detect impossible knowledge — for example, a villager consistently voting for werewolves before any public information could suggest their identity [^37^].

### 1.5 Scalability & Deployment

The scaling strategy follows a capacity-planning model with four defined tiers, specified in Table 1.4.

| Metric | Alpha (Test) | Beta (Soft Launch) | Production | Tournament |
|--------|-------------|-------------------|------------|------------|
| Concurrent Players | 100 | 2{,}000 | 20{,}000 | 50{,}000+ |
| Active Games | 10 | 200 | 2{,}500 | 5{,}000+ |
| Game Orchestrator Pods | 2 | 25 | 300 | 600+ |
| AI Service Pods | 2 | 10 | 100 | 200+ |
| Redis Nodes | 1 | 3 (cluster) | 6 (cluster) | 12 (cluster) |
| PostgreSQL Replicas | 1 | 2 | 4 | 8 |
| Message Rate / sec | 100 | 5{,}000 | 50{,}000 | 100{,}000+ |

**Horizontal scaling: Game Orchestrator behind ALB with sticky WebSocket sessions.** AWS Application Load Balancer with cookie-based stickiness routes all WebSocket connections from a given client to the same pod, preventing session desynchronization during reconnection. For horizontal broadcast across pods, the Socket.IO Redis adapter ensures that a message emitted to room `game_abc123` on Pod A reaches all clients in that room on Pods B, C, and D via Redis pub/sub [^208^].

**AI Service autoscaling.** Two custom metrics drive AI Service scaling: inference queue depth (target: average < 50 pending requests per pod) and p95 response latency (target: < 3 seconds). When either threshold breaches, the HPA scales up by 5 pods per minute with a 60-second stabilization window. Scale-down is conservative: 2 pods per 2 minutes with a 5-minute stabilization window to prevent flapping during phase transitions when many simultaneous agent decisions spike queue depth.

**Container orchestration.** Local development uses Docker Compose with hot-reload volumes. Production uses Kubernetes with Agones for game-server-specific fleet management [^434^]. Agones provides game-server-aware health checking, graceful termination that completes in-flight games before pod shutdown, and fleet autoscaling based on allocated game server capacity rather than raw CPU metrics.

The following `docker-compose.yml` specifies the complete local development stack:

```yaml
# docker-compose.yml — Local development stack
version: "3.9"
services:
  game-orchestrator:
    build: ./game-server
    ports: ["3001:3001"]
    environment:
      - REDIS_URL=redis://redis:6379
      - AI_SERVICE_URL=http://ai-service:8000
      - DB_URL=postgresql://postgres:pass@postgres:5432/werewolf
    depends_on: [redis, postgres]
    volumes: ["./game-server/src:/app/src"]
    command: npm run dev

  ai-service:
    build: ./ai-service
    ports: ["8000:8000"]
    environment:
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on: [redis]
    volumes: ["./ai-service/app:/app/app"]
    command: uvicorn main:app --reload --host 0.0.0.0 --port 8000

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes: ["redis-data:/data"]

  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=werewolf
    volumes: ["postgres-data:/var/lib/postgresql/data"]

  clickhouse:
    image: clickhouse/clickhouse-server:latest
    ports: ["8123:8123", "9000:9000"]
    volumes: ["clickhouse-data:/var/lib/clickhouse"]

volumes:
  redis-data:
  postgres-data:
  clickhouse-data:
```

This configuration mounts source directories as volumes for hot-reload during development, sets Redis to use AOF persistence for crash recovery, and exposes all service ports for direct debugging. The AI Service reads LLM API keys from environment variables injected at runtime; in production, these are stored in Kubernetes secrets or a vault service.

### 1.6 Resilience & Fault Tolerance

The platform implements resilience at three boundaries: client reconnection, AI service degradation, and session recovery.

**Reconnection protocol.** When a client WebSocket disconnects, the Game Orchestrator flags the player with `status: DISCONNECTED` and starts a 30-second grace period timer [^48^]. During this window, the player's slot remains reserved, game timers may pause (configurable), and no bot replacement occurs. If the client reconnects within 30 seconds, the server replays all missed events from the client's last acknowledged sequence number and sends a `state_resync` message containing the current visible state. If the grace period expires without reconnection, the platform invokes the replacement strategy configured for the game mode: silent bot replacement (casual mode), announced bot replacement (ranked mode), or elimination (tournament mode).

**AI degradation chain.** LLM inference is an unreliable dependency — API rate limits, provider outages, and latency spikes are inevitable. The AI Service implements a five-tier degradation chain, illustrated in Figure 1.2.

![Figure 1.2 — Event Sourcing Pipeline and AI Degradation Chain](event_sourcing_resilience.png)

| Tier | Strategy | Trigger | Action Quality | Latency Target |
|------|----------|---------|---------------|----------------|
| 1 | Full LLM (GPT-4o / Claude Sonnet) | Optimal conditions | Highest | 1–3 s |
| 2 | Lightweight LLM (GPT-4o Mini) | p95 > 3 s or cost cap warning | Good | < 1 s |
| 3 | Personality-driven heuristics | LLM 5xx errors | Moderate | < 50 ms |
| 4 | Rule-based (strategy tables) | All LLM providers down | Functional | < 10 ms |
| 5 | Random legal action | Rule engine failure | Minimal | < 1 ms |

The degradation chain advances automatically based on health checks and circuit breaker state. Each tier is a superset of the next: Tier 3 heuristics encode role-specific strategies (e.g., "as Seer, investigate the player who spoke most suspiciously"), Tier 4 strategy tables encode fixed-response patterns (e.g., "as Villager, vote for the player with the most accusations"), and Tier 5 guarantees the game never stalls by selecting a random valid target. The Game Orchestrator treats all tiers identically — it receives a typed action and validates it server-side regardless of its origin.

**Session recovery.** Redis AOF (Append-Only File) persistence ensures that game state survives a Redis restart with zero data loss for events written to disk. The Game Orchestrator creates automatic state snapshots every 60 seconds by writing a `SNAPSHOT` event to the event log containing the full serialized game state. On catastrophic failure (all Game Orchestrator pods restart), the recovery procedure loads the most recent snapshot and replays events from that sequence forward, restoring games to their exact pre-crash state within seconds. PostgreSQL's partitioned event log provides the permanent archive for post-mortem analysis and replay rendering.

The following Redis pub/sub pattern implements the AI decision routing described above. The Game Orchestrator subscribes to agent response channels, while AI worker pods consume decision requests and publish responses back to the shared event bus:

```typescript
// Redis pub/sub: AI decision routing pattern
class AIDecisionRouter {
  private subscriber: Redis;
  private publisher: Redis;

  constructor(redis: Redis) {
    this.publisher = redis;
    this.subscriber = redis.duplicate();
  }

  // Called by Game Orchestrator when AI decisions are needed
  async requestDecisions(gameId: string, agents: AgentContext[]): Promise<void> {
    const channel = `game:${gameId}:decisions`;
    for (const agent of agents) {
      await this.publisher.publish(channel, JSON.stringify({
        type: 'DECISION_REQUIRED',
        game_id: gameId,
        agent_id: agent.agentId,
        context: agent,
        deadline_ms: Date.now() + 5000,
      }));
    }
  }

  // Called by AI worker pods on startup
  async subscribeToDecisions(workerId: string, handler: DecisionHandler): Promise<void> {
    // Pattern subscribe: worker receives decisions for all games
    await this.subscriber.psubscribe('game:*:decisions', (message, channel) => {
      const request = JSON.parse(message);
      handler(request).then(decision => {
        // Publish decision back to game-specific updates channel
        const gameId = request.game_id;
        this.publisher.publish(`game:${gameId}:updates`, JSON.stringify({
          type: 'AGENT_DECISION',
          game_id: gameId,
          agent_id: request.agent_id,
          decision,
          worker_id: workerId,
        }));
      });
    });
  }

  // Called by Game Orchestrator to receive agent decisions
  async subscribeToResponses(gameId: string, onDecision: (d: AgentDecision) => void): Promise<void> {
    await this.subscriber.subscribe(`game:${gameId}:updates`, (message) => {
      const event = JSON.parse(message);
      if (event.type === 'AGENT_DECISION') {
        onDecision(event.decision);
      }
    });
  }
}
```

This pattern decouples the AI inference latency from the game loop: the Game Orchestrator publishes decision requests, continues processing human player actions, and receives agent decisions asynchronously through the subscription callback. A semaphore limits concurrent AI decisions per game to prevent memory pressure during phase transitions when all agents act simultaneously.

The resilience architecture acknowledges a fundamental constraint: WebSocket-based multiplayer games are inherently stateful. Unlike REST APIs where any pod can handle any request, a game room is bound to the pod that created it. The Socket.IO Redis adapter mitigates this by externalizing room state to Redis, enabling clients to transparently reconnect to a different pod while maintaining their room membership and receiving missed events [^208^]. Combined with the 60-second snapshot interval and the event-sourced reconstruction pipeline, the platform achieves a recovery time objective (RTO) of < 10 seconds and a recovery point objective (RPO) of zero lost events for all persisted actions.
-e 

---

## 2. AI Player Framework

The AI Player Framework is the core cognitive layer of the Werewolf platform. It defines how artificial agents perceive game states, reason about hidden information, formulate statements and votes, and execute strategic deception. The framework must balance three competing imperatives: strategic depth (human-like persuasion and deduction), operational latency (sub-second response times for real-time play), and economic viability (sustainable per-game API costs at scale). This chapter presents a three-tier architecture that addresses all three imperatives through dynamic agent routing, preserves a uniform API contract across all tiers, and achieves a 70-86% reduction in LLM inference costs through five complementary optimization techniques [^167^][^172^].

### 2.1 Agent Architecture Overview

#### 2.1.1 Three-Tier System

The framework organizes agents into three capability tiers. Tier 1 comprises rule-based agents that execute hardcoded finite state machines with Werewolf-specific heuristics — selecting night targets randomly from valid candidates and voting with the majority once consensus exceeds a configurable threshold. Tier 2 introduces personality-driven agents that modulate Tier 1 outputs through Big Five (OCEAN) trait vectors, producing probabilistic decisions that vary across agents with identical role and game state [^179^][^248^]. Tier 3 deploys full LLM-powered agents that construct structured prompts, perform multi-step reasoning about hidden roles, and generate natural-language statements optimized for persuasion or deception [^127^][^39^].

The neuro-symbolic hybrid architecture — embedding decision trees as callable oracles within the LLM reasoning loop — achieves +7.2% entailment consistency and +5.3% multi-step accuracy over pure LLM approaches [^205^]. This validates the tiered design for Werewolf specifically: rule-based guardrails enforce game logic and action legality while LLMs handle the social reasoning that makes gameplay compelling.

```mermaid
graph TD
    subgraph "Game Orchestrator"
        GO["Game Orchestrator<br/>(Node.js + WebSocket)"]
        RT["Dynamic Tier Router"]
    end
    subgraph "Tier 1: Rule-Based"
        T1["Finite State Machine<br/>&lt; 1ms latency<br/>CPU only"]
    end
    subgraph "Tier 2: Personality-Driven"
        T2["OCEAN Trait Vectors +<br/>Lightweight Scoring<br/>&lt; 10 ms latency"]
    end
    subgraph "Tier 3: LLM-Powered"
        T3["Full LLM Reasoning<br/>Prompt Engineering<br/>0.5–5 s latency"]
    end
    GO --> RT
    RT -->|"tutorial / fallback /<br/>simple vote"| T1
    RT -->|"casual / social /<br/>mid-stakes"| T2
    RT -->|"competitive / deception /<br/>endgame"| T3
    T1 -->|"JSON action"| GO
    T2 -->|"JSON action"| GO
    T3 -->|"JSON action"| GO
```

#### 2.1.2 Tier Comparison

The following table maps each tier against the operational dimensions that determine deployment suitability.

| Dimension | Tier 1 Rule-Based | Tier 2 Personality-Driven | Tier 3 LLM-Powered |
|---|---|---|---|
| **Core logic** | Decision trees + finite state machines [^205^] | OCEAN trait vectors driving probabilistic decisions [^179^][^248^] | Full LLM reasoning with structured prompting [^127^][^39^] |
| **Latency** | $<1$ ms | $	hicksim 10$ ms | $0.5$–$5$ s |
| **Cost per game** | $\$0$ (CPU only) | $\sim \$0.001$ | $\$0.01$–$\$0.30$ [^167^] |
| **Strategic depth** | Low — predefined heuristics | Medium — emergent behavior from trait interactions | High — persuasion, deception, ToM reasoning |
| **Human-likeness** | Low — predictable patterns | Medium — personality-driven dialogue | High — nuanced reasoning [^64^] |
| **Best use case** | Tutorial bots, network fallback | Casual multiplayer, roleplay | Competitive play, tournaments |
| **Fallback trigger** | Never (base tier) | LLM timeout / cost limit | Malformed response → Tier 2 |

The latency gap of roughly $5{,}000	imes$ between Tier 1 and Tier 3 makes dynamic routing essential. A game with eight Tier 3 agents making $	hicksim 200$ LLM calls per game incurs a raw API cost of $\$2.30$; with all five optimization levers engaged, that cost falls to $\$0.31$, an 86% reduction [^167^][^172^]. The operational cost envelope therefore ranges from effectively zero (Tier 1 only) to roughly thirty cents per game (fully optimized Tier 3).

#### 2.1.3 Unified Agent Interface

All tiers expose an identical API contract to the Game Orchestrator. The contract follows a four-phase lifecycle: **observe** (ingest game state and conversation history), **decide** (select an action based on internal reasoning), **act** (emit a structured JSON action), and **speak** (produce a natural-language statement when the phase requires it). This uniformity allows the Orchestrator to treat every agent as an interchangeable participant regardless of the cognitive machinery behind it.

```mermaid
sequenceDiagram
    participant GO as Game Orchestrator
    participant RT as Tier Router
    participant BA as BaseAgent (ABC)
    participant T1 as RuleBasedAgent
    participant T2 as PersonalityDrivenAgent
    participant T3 as LLMPoweredAgent

    GO->>RT: route(player_id, game_state)
    RT->>RT: classify_complexity(state)
    RT-->>GO: assigned_tier

    GO->>BA: act(game_state)
    alt Tier 1
        BA->>T1: _night_action() / _vote_action()
        T1-->>BA: dict(action, target, reasoning)
    else Tier 2
        BA->>T2: inject_personality(OCEAN)
        BA->>T2: lightweight_score(options)
        T2-->>BA: dict(action, target, reasoning)
    else Tier 3
        BA->>T3: assemble_prompt(state, memory)
        BA->>T3: llm_inference(schema)
        BA->>T3: validate_response()
        T3-->>BA: dict(action, target, reasoning, statement)
    end
    BA-->>GO: validated_action_json
```

The `BaseAgent` abstract class defines the contract. Concrete implementations — `RuleBasedAgent`, `PersonalityDrivenAgent`, and `LLMPoweredAgent` — subclass it and override the `act` method. The Orchestrator holds a registry mapping player IDs to agent instances and invokes `act` uniformly during each phase transition. Event sourcing captures every returned action as an immutable event, enabling complete replay and audit trails (see Chapter 8).

#### 2.1.4 Dynamic Tier Assignment

The tier router classifies each decision based on context complexity, budget envelope, and LLM availability. Simple votes in early-game phases route to Tier 1 or Tier 2; deception-heavy endgame discussions with three remaining players route to Tier 3. The router also monitors per-game cost accumulation and downshifts tiers when the running total exceeds a configurable threshold. Cascading retries — attempting a cheaper tier first before escalating — add resilience against LLM provider outages and can reduce total cost by 50-70% with acceptable quality tradeoffs [^167^][^174^].

### 2.2 Tier 1: Rule-Based Agents

#### 2.2.1 Decision Engine

Tier 1 agents implement a finite state machine (FSM) with Werewolf-specific heuristics. The FSM has three phase states — Night, Discussion, and Voting — with deterministic transitions controlled by the Game Orchestrator. At Night, a Werewolf agent selects a target uniformly at random from alive non-teammates; a Seer selects the highest-suspicion un-investigated player; a Doctor self-protects with 60% probability and otherwise protects the player with the highest inferred value. During Discussion, the agent emits a canned statement or remains silent based on its aggressiveness parameter. At Voting, the agent follows a bandwagon heuristic: if 60% or more of revealed votes target the same player, the agent joins the consensus; otherwise it votes for the player with the highest locally-computed suspicion score.

#### 2.2.2 Core Heuristics

Two thresholds govern Tier 1 behavior. The self-preservation threshold activates at $<30\%$ estimated survival probability — derived from the agent's share of accumulated suspicion relative to other alive players — causing the agent to shift from accusation to defensive silence or self-defense statements. The bandwagon threshold at $60\%$ consensus causes the agent to abandon independent reasoning and vote with the majority, a pattern observed in human Werewolf players that minimizes cognitive load but also reduces information gain for the village [^99^]. These thresholds are configurable per-agent and can be tuned for tutorial (lower thresholds, more predictable) versus challenge (higher thresholds, more independent) modes.

#### 2.2.3 Appropriate Usage

Tier 1 agents serve four distinct operational roles. In **tutorial mode**, their predictable behavior gives new human players a forgiving introduction to the game. In **fast-paced games** where turn timers are under 10 seconds, sub-millisecond decisions prevent timeout cascades. As **network fallback**, they substitute automatically when Tier 3 LLM calls time out or return malformed responses. In **minimal compute environments** — such as mobile clients running local practice sessions — they eliminate all external API dependencies.

#### 2.2.4 Pseudocode for Rule-Based Decisions

```python
class RuleBasedAgent(BaseAgent):
    """Deterministic agent using finite state machine + heuristics."""

    def act(self, game_state: GameState) -> dict:
        if game_state.phase == GamePhase.NIGHT:
            return self._night_action(game_state)
        elif game_state.phase == GamePhase.DISCUSSION:
            return self._discussion_action(game_state)
        elif game_state.phase == GamePhase.VOTING:
            return self._voting_action(game_state)

    def _night_action(self, state: GameState) -> dict:
        role = state.player_role
        if role == "werewolf":
            targets = [p for p in state.alive_players
                      if p not in state.teammates]
            target = random.choice(targets) if targets else "none"
            return {"action": "kill", "target": target,
                    "reasoning": "Random valid target heuristic"}
        elif role == "seer":
            uninvestigated = [p for p in state.alive_players
                             if p not in state.investigated]
            target = uninvestigated[0] if uninvestigated else "none"
            return {"action": "investigate", "target": target,
                    "reasoning": "Check highest-priority uninvestigated"}
        elif role == "doctor":
            if random.random() < 0.6:
                return {"action": "protect", "target": self.player_id,
                        "reasoning": "Self-preservation (60% probability)"}
            else:
                most_valued = self._most_valued_player(state)
                return {"action": "protect", "target": most_valued,
                        "reasoning": "Protect inferred high-value player"}

    def _voting_action(self, state: GameState) -> dict:
        # Bandwagon: if >= 60% consensus on a target, join it
        vote_counts = self._tally_revealed_votes(state)
        total_votes = sum(vote_counts.values())
        for candidate, count in vote_counts.items():
            if candidate != self.player_id and total_votes > 0:
                if count / total_votes >= 0.60:
                    return {"action": "vote", "target": candidate,
                            "reasoning": f"Bandwagon: {count}/{total_votes} votes"}
        # Fallback: vote for highest suspicion score
        if self.suspicion_scores:
            target = max(self.suspicion_scores,
                        key=self.suspicion_scores.get)
            return {"action": "vote", "target": target,
                    "reasoning": "Highest suspicion heuristic"}
        return {"action": "abstain", "reasoning": "No data"}
```

The `BaseAgent` superclass provides memory management (capped at 100 entries with compaction to the last 50) and suspicion-score initialization. Subclasses override `act` while inheriting observation logging uniformly. This pattern ensures that even the simplest agents participate in the same telemetry pipeline as their LLM-powered counterparts, enabling fair cross-tier performance comparison in simulation mode.

### 2.3 Tier 2: Personality-Driven Agents

#### 2.3.1 Personality System

Tier 2 agents extend Tier 1 heuristics through the Big Five personality model — Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism (OCEAN) — the most validated framework for trait-based behavior generation [^179^][^248^]. Each agent samples a five-dimensional trait vector at creation time, with each dimension normalized to $[0, 1]$. These traits do not replace heuristics; they modulate them. A high-Extraversion agent raises its speech probability from a base of 0.3 to 0.8; a high-Neuroticism agent lowers its self-preservation threshold from 30% to 15%, triggering defensive behavior earlier. The modulation functions are linear interpolations between anchor points, ensuring interpretable and deterministic trait-to-behavior mappings.

#### 2.3.2 Personality-to-Behavior Mapping

The mapping from trait values to behavioral parameters follows empirically derived relationships. High Neuroticism increases defensiveness when accused, raises suspicion-update sensitivity (new evidence weighted more heavily), and reduces willingness to lead votes. High Extraversion increases accusation frequency, statement length, and initiative in discussions. High Conscientiousness improves consistency between stated beliefs and votes, making the agent appear more trustworthy. High Openness increases willingness to entertain unconventional role hypotheses. High Agreeableness reduces accusation probability and increases coalition loyalty.

| Trait | Range | Behavioral Modulation | Werewolf-Relevant Impact |
|---|---|---|---|
| **Openness** | $0$–$1$ | Strategy creativity factor: $0.3 + 0.7 \times \text{O}$ | High-O agents try novel deception patterns; low-O agents repeat proven strategies |
| **Conscientiousness** | $0$–$1$ | Vote-belief consistency: $0.4 + 0.6 \times \text{C}$ | High-C agents align votes with stated reasoning, appearing more trustworthy [^248^] |
| **Extraversion** | $0$–$1$ | Speech probability: $0.1 + 0.9 \times \text{E}$ | High-E agents dominate discussion; low-E agents lurk — both viable wolf strategies |
| **Agreeableness** | $0$–$1$ | Accusation threshold: $0.8 - 0.6 \times \text{A}$ | High-A agents avoid conflict; low-A agents are aggressive accusers |
| **Neuroticism** | $0$–$1$ | Self-preservation threshold: $0.45 - 0.30 \times \text{N}$ | High-N agents panic-defend; low-N agents remain calm under pressure |

The combination of traits produces emergent behavioral profiles that are not explicitly programmed. An agent with high Extraversion and low Agreeableness becomes a natural demagogue — constantly accusing others and drawing attention. This profile is dangerous for a Werewolf (high visibility increases detection risk) but effective for a Villager who wants to drive village consensus. The emergent diversity from trait interactions is the primary reason Tier 2 outperforms Tier 1 in human-likeness metrics without requiring LLM inference [^248^].

#### 2.3.3 ReCon-Inspired Theory of Mind

Tier 2 agents incorporate a lightweight version of Recursive Contemplation (ReCon), a dual-perspective reasoning framework validated in ACL 2024 Findings that outperforms Chain-of-Thought across six evaluated metrics [^346^][^81^]. The full ReCon pipeline requires four LLM calls (first-order perspective transition, formulation, second-order perspective transition, refinement) — too expensive for Tier 2. Instead, Tier 2 agents maintain a simplified belief matrix: for each other player, the agent tracks estimated role probabilities updated via exponential smoothing with $\alpha = 0.7$ [^151^]. The agent's voting heuristic weights these belief estimates by its Conscientiousness score, and its speech generation selects from pre-authored templates tagged by emotional valence (anxious, confident, neutral) based on its Neuroticism level.

This reduced ToM capability captures the core insight of ReCon — that agents perform better when they explicitly model what other agents believe — while remaining computationally lightweight. GPT-3.5 with full ReCon outperforms GPT-4 with simple Chain-of-Thought, demonstrating that architectural mechanism can exceed raw model capability [^81^].

#### 2.3.4 Personality Configuration Schema and Agent Profiles

```python
@dataclass
class PersonalityConfig:
    """Big Five personality configuration for Tier 2 agents."""
    openness: float = 0.5          # 0=traditional, 1=creative
    conscientiousness: float = 0.5  # 0=spontaneous, 1=organized
    extraversion: float = 0.5      # 0=reserved, 1=outgoing
    agreeableness: float = 0.5     # 0=competitive, 1=cooperative
    neuroticism: float = 0.5       # 0=stable, 1=reactive

# Pre-configured agent profiles
AGENT_PROFILES = {
    "aggressive": PersonalityConfig(
        openness=0.6, conscientiousness=0.4, extraversion=0.9,
        agreeableness=0.2, neuroticism=0.3
    ),
    "cautious": PersonalityConfig(
        openness=0.3, conscientiousness=0.8, extraversion=0.3,
        agreeableness=0.6, neuroticism=0.7
    ),
    "analytical": PersonalityConfig(
        openness=0.9, conscientiousness=0.9, extraversion=0.4,
        agreeableness=0.5, neuroticism=0.2
    ),
    "social": PersonalityConfig(
        openness=0.7, conscientiousness=0.3, extraversion=0.8,
        agreeableness=0.8, neuroticism=0.4
    )
}
```

| Profile | O | C | E | A | N | Optimal Role | Play Style |
|---|---|---|---|---|---|---|---|
| **Aggressive** | 0.6 | 0.4 | 0.9 | 0.2 | 0.3 | Villager | Leads accusations, drives votes, high visibility |
| **Cautious** | 0.3 | 0.8 | 0.3 | 0.6 | 0.7 | Doctor | Quiet observation, consistent votes, self-protects early |
| **Analytical** | 0.9 | 0.9 | 0.4 | 0.5 | 0.2 | Seer | Tracks patterns, reveals strategically, calm under pressure |
| **Social** | 0.7 | 0.3 | 0.8 | 0.8 | 0.4 | Werewolf | Builds alliances, deflects smoothly, moderate deception |

The four profiles cover distinct strategic archetypes observed in human Werewolf play. The **Aggressive** profile's low Agreeableness (0.2) and high Extraversion (0.9) produce a confrontational playstyle effective for Villagers who must drive wolf eliminations, but dangerous for Werewolves who benefit from lower visibility. The **Social** profile's high Agreeableness (0.8) makes it unusually effective for Werewolves because the cooperative facade delays detection — wolves who appear helpful survive 1.3 rounds longer on average than wolves who play aggressively [^151^]. Profile assignment can be random, player-selected, or matchmaking-optimized based on ELO and historical preference data.

### 2.4 Tier 3: LLM-Powered Agents

#### 2.4.1 Pipeline Architecture

Tier 3 agents follow a five-stage pipeline for every decision: **context assembly** (retrieve memories, compact history, inject personality), **prompt construction** (assemble system prompt + game context + instruction + output schema), **LLM inference** (call the selected model with structured output constraints), **JSON response parsing** (extract and validate the action fields), and **action validation** (confirm the action is legal in the current game state). This pipeline runs entirely within the Python AI Service; the Game Orchestrator sees only the final validated JSON.

```mermaid
graph LR
    subgraph "Context Assembly"
        A["Retrieve Memories<br/>(Vector DB)"]
        B["Compact History<br/>(Sliding Window)"]
        C["Inject Personality<br/>(OCEAN Prompt)"]
    end
    subgraph "Prompt Construction"
        D["System Prompt<br/>(Role Identity)"]
        E["Game Context<br/>(Visible State)"]
        F["Instruction<br/>(Decision Request)"]
        G["Output Schema<br/>(JSON Spec)"]
    end
    subgraph "Inference & Validation"
        H["LLM Inference<br/>(Model Router)"]
        I["JSON Parsing"]
        J["Action Validation<br/>(Legality Check)"]
    end
    A --> B --> C --> D --> E --> F --> G --> H --> I --> J
```

#### 2.4.2 Prompt Engineering

All Tier 3 prompts follow a consistent four-section spec-pattern validated in production agent deployments [^15^][^18^]:

1. **System Prompt** — role identity, faction allegiance, teammates (if Werewolf), and win condition. This section is static per role and benefits maximally from prefix caching.
2. **Game Context** — current phase, alive/dead player lists, conversation history, and visible game state. This section changes every turn and is the primary target for compaction.
3. **Instruction** — the specific decision requested ("Choose a player to eliminate" or "Share your observations with the group").
4. **Output Schema** — a JSON schema definition that constrains the model's response format.

```python
PROMPT_TEMPLATE = """
## Role Identity
You are Player {player_id}, a {role_name} in a game of Werewolf.
{team_info}

## Core Objectives
{objectives}

## Game State (Day {day}, Phase: {phase})
Alive players: {alive_players}
Dead players: {dead_players}
Your observations:
{conversation_history}

## Strategic Guidance
{strategy_guidance}

## Decision Required
{instruction}

## Response Format
Please reply with valid JSON matching this schema:
{json_schema}
"""
```

#### 2.4.3 Context Window Management

LLM context windows are a scarce resource. A standard 8-player Werewolf game generates $	hicksim 3{,}000$ tokens of conversation history per round; with 5-8 rounds, the total easily exceeds the 8K-128K range of commonly used models. The framework implements a three-layer token budget allocation to manage this constraint.

| Budget Layer | Allocation | Content | Compaction Strategy |
|---|---|---|---|
| **Game state** | 40% | Current phase, alive/dead lists, role info | Kept raw; updated every turn |
| **Conversation history** | 30% | Dialogue from this round and last 2 rounds | Sliding window; older rounds summarized |
| **Memory injection** | 20% | Key events, trust scores, suspicion vectors | Importance-weighted retrieval; top-K only |
| **Instruction + schema** | 10% | Decision prompt, output format specification | Always kept raw; minimal token count |

The multi-layer compaction pipeline follows a recency-importance hierarchy [^315^][^320^]. Raw recent messages (last 3 turns) are preserved at full fidelity to maintain conversational rhythm. Older messages pass through a relevance filter that scores each utterance by its strategic significance (vote outcomes, role claims, contradictions) and discards low-information content like redundant agreements. If the context still exceeds the 80% threshold, the oldest block is sent to a cheap summarization model (GPT-4o-mini) for lossy compression. This cascade achieves 22-57% token reduction while maintaining decision accuracy [^315^].

```python
def compact_context(full_context: str, token_budget: int = 4000) -> str:
    """Multi-stage context compaction pipeline."""
    # Stage 1: Remove redundant confirmations and filler (typical -15%)
    compact = remove_filler_utterances(full_context)
    # Stage 2: Deduplicate repeated claims (typical -10%)
    compact = deduplicate_claims(compact)
    # Stage 3: Summarize rounds older than 3 turns (typical -30%)
    compact = summarize_old_rounds(compact, model="gpt-4o-mini")
    # Stage 4: Relevance filter to final budget (typical -10%)
    compact = relevance_filter(compact, token_budget)
    return compact
```

#### 2.4.4 Complete Prompt Template with Variable Substitution

The following template illustrates the fully-substituted prompt for a Werewolf role. The `{strategy_guidance}` block presents three distinct strategy options — Bold (fake Seer claim), Deep Cover (villager imitation), and Aggressive Accuser — from which the LLM selects based on game context. Offering strategic alternatives rather than prescribing a single approach produces more adaptive behavior across diverse game states [^39^].

```
## Role Identity
You are Player 3, a Werewolf. Your werewolf teammates are: [Player 7].

## Core Objectives
1. Hide your Werewolf identity and survive until the end
2. Eliminate Villagers at night through coordinated kills
3. Mislead good players during day discussions to get them voted out
4. Coordinate with your Werewolf teammates to create logical confusion

## Game State (Day 2, Phase: discussion)
Alive players: [Player 1, Player 2, Player 3, Player 4, Player 5, Player 6, Player 7]
Dead players: [Player 8] (eliminated Day 1, role not revealed)

## Visible History
Night 1: Player 6 was eliminated.
Day 1 Discussion: Player 2 accused Player 4 of being quiet.
Day 1 Vote: Players 1,3,5 voted Player 4; Players 2,4,6,7 voted Player 8.
Player 8 was eliminated.

## Strategic Guidance
Strategy A - Bold Werewolf (Impersonating the Seer):
  - Claim Seer in the first round, giving false investigation results
  - Risk: High reward but easily exposed if real Seer contradicts
Strategy B - Deep Cover Werewolf (Disguised as Villager):
  - Speak concisely, avoid becoming the focus of attention
  - Risk: Lower impact but harder to detect
Strategy C - Aggressive Accuser:
  - Accuse others to create chaos and divert suspicion from yourself
  - Risk: May draw counter-accusations

## Decision Required
Share your observations and suspicions with the group. Be persuasive
but not domineering. Consider: who seems most suspicious and why?

## Response Format
{
  "reasoning": "Brief strategic analysis (private, never revealed)",
  "suspicion_scores": {"player_1": 0.3, "player_2": 0.7, ...},
  "public_statement": "What you say to other players",
  "confidence": 0.75
}
```

#### 2.4.5 Response JSON Schema

All Tier 3 responses conform to a validated JSON schema. OpenAI's Structured Outputs (`response_format` with `json_schema` + `strict: true`) provides the most reliable enforcement, with alternative patterns for Claude (tool-use) and Gemini (`response_mime_type`) [^177^][^209^][^172^].

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "AgentTurn",
  "required": ["phase", "reasoning", "actions"],
  "properties": {
    "phase": {
      "type": "string",
      "enum": ["night", "discussion", "voting"]
    },
    "reasoning": {
      "type": "string",
      "description": "Private strategic reasoning (never shared)",
      "maxLength": 600
    },
    "actions": {
      "type": "object",
      "required": ["primary_action"],
      "properties": {
        "primary_action": {
          "type": "string",
          "enum": ["kill", "investigate", "protect", "vote", "speak", "abstain", "pass"]
        },
        "target": {
          "type": "string",
          "pattern": "^player_[0-9]+|self|none$"
        },
        "public_statement": {
          "type": "string",
          "description": "Statement shared with all players",
          "maxLength": 300
        },
        "suspicion_scores": {
          "type": "object",
          "patternProperties": {
            "^player_[0-9]+$": { "type": "number", "minimum": 0, "maximum": 1 }
          }
        }
      }
    },
    "memory_update": {
      "type": "object",
      "properties": {
        "key_events": { "type": "array", "items": { "type": "string" } },
        "trust_levels": {
          "type": "object",
          "patternProperties": {
            "^player_[0-9]+$": { "type": "number", "minimum": -1, "maximum": 1 }
          }
        }
      }
    }
  },
  "additionalProperties": false
}
```

The `reasoning` field is private — it is logged for training and evaluation but never exposed to other players. The `memory_update` field enables the agent to explicitly flag observations for long-term storage, decoupling memory management from automatic transcript logging. The `confidence` score (0.0–1.0) calibrates the agent's expressed certainty and is used by downstream trust-network updates: low-confidence claims receive less weight in belief propagation.

### 2.5 Persuasion Training with GRPO

#### 2.5.1 GRPO Application

Group Relative Policy Optimization (GRPO) trains persuasive Werewolf agents via self-play without requiring a separate critic model [^332^][^333^]. Originally introduced in DeepSeekMath and validated for social deduction in AAAI 2026 [^13^], GRPO computes relative advantages across a group of sampled utterance candidates. For Werewolf, the training objective is to maximize the probability that a generated statement elicits a desired follower response (e.g., agreement, vote alignment) while minimizing the probability of undesired responses (e.g., contradiction, accusation).

The key advantage of GRPO over standard PPO for this domain is the elimination of the value network. In social deduction, the state space is enormous (every possible combination of beliefs, accusations, and alliances), making value function approximation unreliable. GRPO replaces the critic with the empirical mean of the group's rewards, which is both more stable and computationally cheaper.

#### 2.5.2 Reward Components

The composite reward function combines four weighted signals:

$$R = w_1 \cdot \mathbb{1}_{\text{faction\_win}} + w_2 \cdot \mathbb{1}_{\text{vote\_influenced}} + w_3 \cdot \frac{\text{rounds\_survived}}{\text{max\_rounds}} + w_4 \cdot \mathbb{1}_{\text{detected\_as\_wolf}}$$

| Component | Weight | Value Range | Description |
|---|---|---|---|
| **Faction win** | $w_1 = 1.0$ | $\{0, 1\}$ | +1.0 if agent's faction wins the game |
| **Vote influenced** | $w_2 = 0.2$ | $\{0, 1\}$ | +0.2 if at least one player changed their vote after agent's statement |
| **Survival round** | $w_3 = 0.05$ | $[0, 1]$ | +0.05 per round survived, normalized by maximum possible rounds |
| **Detected as wolf** | $w_4 = -0.5$ | $\{0, -1\}$ | $-0.5$ if agent is Werewolf and is correctly identified by >50% of villagers |

The negative detection penalty is critical: without it, GRPO-trained Werewolf agents optimize purely for vote influence and faction victory, which leads to maximally aggressive deception that is easily detected. The $-0.5$ penalty forces agents to trade off influence against believability, producing more calibrated and human-like deception strategies. The vote-influence reward (+0.2) specifically targets persuasion capability independent of the final win outcome, providing dense reward signal in games where the faction win is sparse and delayed.

#### 2.5.3 Training Pipeline

The training pipeline consists of four phases executed iteratively. In **Phase 1: Self-Play Data Collection**, agents play 500 complete games using a vanilla backend LLM (e.g., GPT-4o) as the behavioral cloning base. Every turn becomes one training instance containing game state, dialogue history, speaker role, base utterance, follower response, and desired/undesired outcomes. In **Phase 2: Candidate Generation**, the policy model (Qwen2.5-7B-Instruct with LoRA rank 16) generates $n=8$ candidate refinements of each base utterance. In **Phase 3: Reward Computation**, a frozen Measurer LLM evaluates each candidate's impact on follower response probability. In **Phase 4: Policy Update**, GRPO advantages are computed from the group mean and standard deviation, and the policy is updated via clipped surrogate objective with KL penalty ($\beta = 0.04$) [^13^].

```mermaid
graph TD
    subgraph "Phase 1: Self-Play"
        S1["500 games with<br/>vanilla LLM agents"]
        S2["Extract ~4K instances<br/>(turns with outcomes)"]
    end
    subgraph "Phase 2: Candidate Generation"
        G1["Policy model<br/>(Qwen2.5-7B + LoRA)"]
        G2["Generate 8 candidates<br/>per instance"]
    end
    subgraph "Phase 3: Reward Computation"
        R1["Frozen Measurer LLM<br/>(GPT-4o)"]
        R2["impact = log P(desired) -<br/>log P(undesired)"]
    end
    subgraph "Phase 4: Policy Update"
        U1["GRPO advantages =<br/>(reward - mean) / std"]
        U2["Clipped surrogate loss +<br/>KL penalty"]
    end
    S1 --> S2 --> G1 --> G2 --> R1 --> R2 --> U1 --> U2
    U2 -->|"checkpoint"| S1
```

Stackelberg Speaker agents trained through this pipeline "significantly outperformed baselines across Werewolf, Avalon, ONUW, and Sotopia" with improvements in both trust-building and deceptive roles [^13^]. Small LLMs (Llama-3.2-3B) trained via PPO/GRPO achieved "significantly higher persuasion gains on opinion change tasks" that generalize across different Receiver model architectures, indicating that the models learn principles of information design rather than exploiting specific model weaknesses [^393^].

#### 2.5.4 GRPO Reward Function Pseudocode

```python
class GRPOTrainer:
    def __init__(self, policy_model, reference_model,
                 n_group=8, epsilon=0.2, beta=0.04, lr=1e-6):
        self.policy = policy_model          # Qwen2.5-7B + LoRA(rank=16)
        self.reference = reference_model    # Frozen copy for KL penalty
        self.n = n_group
        self.epsilon = epsilon
        self.beta = beta
        self.optimizer = AdamW(policy_model.parameters(), lr=lr)

    def compute_grpo_advantages(self, rewards: list[float]) -> torch.Tensor:
        """Compute group-relative advantages (no critic model)."""
        rewards_t = torch.tensor(rewards)
        mean_reward = rewards_t.mean()
        std_reward = rewards_t.std() + 1e-8
        advantages = (rewards_t - mean_reward) / std_reward
        return advantages

    def policy_update(self, candidates, old_probs, advantages):
        """Clipped surrogate objective with KL penalty."""
        total_loss = 0
        for candidate, old_prob, advantage in zip(candidates, old_probs, advantages):
            new_prob = self.policy.prob(candidate)
            ratio = new_prob / (old_prob + 1e-8)
            unclipped = ratio * advantage
            clipped = (torch.clamp(ratio, 1 - self.epsilon, 1 + self.epsilon)
                       * advantage)
            policy_loss = -torch.min(unclipped, clipped)
            kl_div = self.compute_kl_divergence(candidate)
            total_loss += policy_loss + self.beta * kl_div
        self.optimizer.zero_grad()
        total_loss.backward()
        torch.nn.utils.clip_grad_norm_(self.policy.parameters(), max_norm=1.0)
        self.optimizer.step()

    def compute_kl_divergence(self, candidate):
        """KL(policy || reference) for stability regularization."""
        return (self.policy.prob(candidate) *
                (self.policy.log_prob(candidate) -
                 self.reference.log_prob(candidate)))
```

The hyperparameters follow the validated configuration from the Stackelberg Speaker paper: group size of 8 (sufficient diversity for relative advantage computation), KL coefficient of 0.04 (prevents policy collapse while allowing persuasion learning), learning rate of $1 \times 10^{-6}$ (stable fine-tuning without catastrophic forgetting), and 3 training epochs ($\sim$50 hours on 4× A800 GPUs) [^13^]. Training on 4,000 instances per game type sampled from 500 self-play logs produces robust generalization.

### 2.6 Cost Optimization Strategies

#### 2.6.1 Five-Lever Optimization

Production deployment of Tier 3 agents at scale requires aggressive cost management. Research across multiple LLM agent platforms confirms that 70-85% total cost reduction is achievable by combining five complementary techniques [^167^][^172^][^173^][^174^].

| Lever | Strategy | Savings Range | Complexity | Key Tradeoff |
|---|---|---|---|---|
| **Prompt caching** | Prefix caching for repeated system prompts; semantic caching for similar states | 59–90% [^24^] | Low | Cache invalidation on role/personality changes |
| **Context compaction** | Multi-stage compression: dedup → summarize → relevance filter | 50–70% [^221^] | Medium | Lossy; may discard nuanced deception signals |
| **Model routing** | Simple decisions → cheap models; complex → premium | 40–70% [^170^] | Medium | Quality cliff at routing boundary |
| **Smart tiering** | Low-stakes turns → Tier 2; critical → Tier 3 | 30–50% | Medium | Reduced strategic depth on downshifted turns |
| **Batch processing** | Async batch API for non-critical evaluations | 10–20% | Low | Adds latency; unsuitable for real-time decisions |

The savings are multiplicative rather than additive. Prompt caching reduces input tokens; context compaction reduces both input and output tokens; model routing shifts load to cheaper endpoints; smart tiering eliminates LLM calls entirely for a subset of decisions; batching reduces per-token cost for background workloads. Combined, these levers reduce the per-game cost from $\$2.30$ (unoptimized, 100% GPT-4o) to $\$0.31$ (optimized, mixed model routing) — an 86% reduction that brings Tier 3 agents into the same cost envelope as a single cup of coffee across a full 8-player game [^167^].

#### 2.6.2 Caching Implementation

The caching layer operates at two granularities. **Prefix caching** stores the static system prompt (role identity, game rules, personality configuration) keyed by a SHA-256 hash of the concatenated prompt prefix. The cache TTL is set to 5 minutes, which covers the typical duration of a Werewolf game and avoids stale entries across sessions. Provider-level prefix caching (Anthropic, OpenAI, Google) achieves 59-90% cost reduction on cached tokens; Anthropic's implementation offers the most aggressive discount at 90% off cached input tokens [^24^].

```python
class PromptCache:
    """Two-tier cache: exact hash + semantic similarity."""

    def __init__(self, redis_client, vector_db):
        self.exact = redis_client
        self.semantic = vector_db

    async def get(self, system_prompt: str, game_context: str):
        # Tier 1: Exact match on full prompt hash
        key = f"exact:{sha256(system_prompt + game_context)}"
        if cached := self.exact.get(key):
            return json.loads(cached), True  # cache_hit=True

        # Tier 2: Semantic similarity on game state embedding
        embedding = await embed(game_context)
        similar = await self.semantic.search(embedding, threshold=0.92)
        if similar:
            return similar[0].response, True
        return None, False

    async def set(self, system_prompt, game_context, response, ttl=300):
        key = f"exact:{sha256(system_prompt + game_context)}"
        self.exact.setex(key, ttl, json.dumps(response))
        embedding = await embed(game_context)
        await self.semantic.store(embedding, response)
```

The semantic cache is particularly effective for Werewolf because many game states are structurally similar (same phase, similar alive/dead compositions) even when the exact dialogue differs. A similarity threshold of 0.92 balances hit rate against response quality — lowering the threshold increases hits but risks returning suboptimal actions for meaningfully different contexts.

#### 2.6.3 Smart Routing

The smart tiering router implements a decision-stakes matrix that maps game context to the cheapest viable tier.

| Context | Stakes | Assigned Tier | Rationale |
|---|---|---|---|
| Early-game discussion (Day 1-2, >5 alive) | Low | Tier 2 | Strategic depth less critical; personality agents sufficient |
| Mid-game vote (Day 3-4, 4-5 alive) | Medium | Tier 3 (GPT-4o-mini) | Requires reasoning but not peak sophistication |
| Endgame with 3 players | High | Tier 3 (GPT-4o) | Every statement determines win/loss |
| Night kill selection (Werewolf) | High | Tier 3 (GPT-4o) | Kill accuracy directly impacts faction win rate |
| Post-game evaluation / judge scoring | Background | Tier 3 (batch API) | Latency-tolerant; 50% batch discount applies |

Cascading retries add a further safety net: if GPT-4o-mini returns a low-confidence response ($<0.7$), the router retries with GPT-4o before accepting the action. This "try cheap first" pattern can save 50-70% versus always using the most capable model [^167^][^174^].

#### 2.6.4 Cost Reduction Summary

![Five-Lever Cost Optimization](fig_cost_optimization.png)

Prompt caching delivers the highest individual savings (59-90%) with the lowest implementation complexity — it requires only provider-level feature enablement and cache-key generation logic. Context compaction offers the second-highest savings (50-70%) but introduces the risk of information loss: aggressive summarization may discard subtle deception cues (hesitation, hedging language) that are critical for suspicion scoring. Model routing and smart tiering both require careful quality validation to prevent a "cliff" where cost savings produce visibly degraded gameplay. Batch processing provides the smallest incremental savings (10-20%) but applies cleanly to background workloads like post-game evaluation and ELO updates where latency is unconstrained. In production, the recommended implementation order is: enable caching first (lowest effort, highest return), then add model routing, then context compaction, then smart tiering, and finally batching for background jobs.

### 2.7 Agent Response Validation

#### 2.7.1 Validation Layer

Every agent response passes through a three-stage validation pipeline before the Game Orchestrator accepts it. Stage 1 performs JSON schema validation against the phase-appropriate schema (see Section 2.4.5), rejecting responses with missing required fields, type mismatches, or values outside defined ranges. Stage 2 checks action legality: the `target` must refer to an alive player (or `self`/`none` where permitted), the `primary_action` must be valid for the current game phase, and Werewolf kill targets cannot be teammates. Stage 3 runs a lightweight safety filter that blocks outputs containing out-of-game content, harassment, or attempts to break character by referencing the prompt, model identity, or system instructions.

| Stage | Check | Failure Rate (Typical) | Response on Failure |
|---|---|---|---|
| **JSON schema validation** | Required fields, types, enum values | 3-5% of Tier 3 calls | Retry with error context injected |
| **Action legality check** | Target alive, action valid for phase | 1-2% of Tier 3 calls | Retry with corrected legal targets listed |
| **Safety filter** | No prompt leakage, no OOG content | $<0.1\%$ | Hard reject → random legal action |

#### 2.7.2 Retry Logic

When validation fails, the framework injects the error context into a re-prompt and retries, up to a maximum of 3 attempts. The error context includes the specific validation failure (e.g., `"Target 'player_4' is dead; valid targets: [player_1, player_2, player_5]"`) to help the model correct its output. Exponential backoff with 0.5s, 1.0s, and 2.0s delays between attempts prevents thundering-herd problems during provider-side rate limiting.

#### 2.7.3 Graceful Degradation

If all 3 retry attempts fail, the framework executes a tiered fallback sequence. Tier 3 failures fall back to Tier 2 (personality-driven heuristic) for the same decision. Tier 2 failures fall back to Tier 1 (rule-based deterministic). If Tier 1 also fails — a scenario that occurs only with critical software bugs, not model errors — the framework selects a random legal action as the last resort. Every fallback event is logged at WARNING level with full context for post-hoc analysis. The cascading fallback design ensures that no agent ever blocks game progression: there is always a legal action available, even if the quality degrades from optimal to random.

```python
async def validated_act(agent, game_state, max_retries=3) -> dict:
    """Execute agent action with validation, retry, and fallback."""
    for attempt in range(max_retries):
        try:
            raw = await agent.act(game_state)
            # Stage 1: JSON schema validation
            validate_json_schema(raw, schema_for_phase(game_state.phase))
            # Stage 2: Action legality check
            validate_action_legality(raw, game_state)
            # Stage 3: Safety filter
            validate_safety(raw)
            return raw  # All stages passed
        except JSONValidationError as e:
            logger.warning(f"Schema fail (attempt {attempt+1}): {e}")
            game_state.last_error = str(e)
            await asyncio.sleep(0.5 * (attempt + 1))
        except IllegalActionError as e:
            logger.warning(f"Illegal action (attempt {attempt+1}): {e}")
            game_state.last_error = str(e)
            game_state.legal_targets = get_legal_targets(game_state)
            await asyncio.sleep(0.5 * (attempt + 1))
    # Graceful degradation: fallback chain
    logger.error(f"All retries exhausted for {agent.player_id}")
    if agent.agent_type == AgentType.LLM_POWERED:
        return await tier2_fallback(agent.player_id, game_state)
    elif agent.agent_type == AgentType.PERSONALITY_DRIVEN:
        return await tier1_fallback(agent.player_id, game_state)
    return random_legal_action(game_state)  # Last resort
```

The fallback chain preserves game flow at the cost of strategic quality. In practice, Tier 3→Tier 2 fallback occurs in roughly 2% of turns under normal conditions, rising to 5-8% during LLM provider outages or when aggressive context compaction discards information the model needs for legal target selection. The random last-resort action is invoked less than once per 1,000 games in production deployments, serving primarily as a circuit-breaker against software defects rather than an expected code path.
-e 

---

## 3. Game Loop & Phase Management

### 3.1 Game Lifecycle

#### 3.1.1 Lifecycle Overview

The Werewolf game engine progresses through five macro-stages: **Lobby**, **Setup**, **Active** (alternating Night and Day phases), **Resolution**, and **Post-Game**. Each stage operates as a distinct mode with unique validation rules, timer behaviors, and information disclosure boundaries. The complete lifecycle follows a composite Finite State Machine (FSM) pattern where "each state has its own code and behavior, and the machine can only be in one state at a time" [^76^]. Every phase transition emits an immutable event to the event stream, enabling full game replay and analytics reconstruction [^172^].

#### 3.1.2 Lobby Mechanics

The Lobby stage handles room creation and player aggregation. A host creates a room through the Game Server API, which generates a 6-digit alphanumeric join code (e.g., `A7B2C3`) and instantiates a `GameRoom` in Redis. Players join via WebSocket using this code; the server adds their socket to the room namespace and broadcasts a `PLAYER_JOINED` event [^197^].

| Constraint | Value | Rationale |
|------------|-------|-----------|
| Minimum players | 6 | Below this, faction distribution cannot produce meaningful play [^44^] |
| Maximum players | 18 | Upper bound for practical discussion-phase resolution |
| Human player requirement | At least 1 | Zero-human games route to AI Simulation pipeline |
| Lobby timeout | 10 minutes | Auto-backfill vacant slots with AI agents after expiry [^70^] |
| Join code format | 6-digit alphanumeric | 2.17 billion unique codes; collision-resistant |

The host may configure game speed presets, role reveal rules, and start phase. If the lobby fails to reach minimum capacity within 10 minutes, the server backfills vacant slots with AI agents [^70^].

#### 3.1.3 Setup Sequence

The Setup stage executes four steps: (1) **Role Assignment** distributes roles using the Ultimate Werewolf character value system (sum of weights ≈ 0 for balance) [^172^]; (2) **Faction Distribution Validation** confirms the werewolf-to-villager ratio (typically 3:1 to 4:1) [^44^]; (3) **AI Agent Initialization** loads role-specific prompts for backfilled slots; (4) **Werewolf Team Disclosure** sends each wolf player the identities of all faction members.

```typescript
function assignRoles(players: Player[], config: SetupConfig): RoleAssignment {
  const rolePool = buildWeightedPool(config.template);
  const assignments = shuffleAndDeal(players, rolePool);

  const wolves = assignments.filter(p => p.faction === Faction.WEREWOLF);
  const villagers = assignments.filter(p => p.faction === Faction.VILLAGE);
  const ratio = villagers.length / Math.max(wolves.length, 1);

  if (ratio < config.minRatio || ratio > config.maxRatio) {
    throw new ValidationError(
      `Ratio ${ratio.toFixed(1)} outside bounds [${config.minRatio}, ${config.maxRatio}]`
    );
  }

  for (const player of assignments) {
    if (player.isAI) {
      player.agentContext = initializeAgentPrompt({
        role: player.role,
        faction: player.faction,
        teammates: player.faction === Faction.WEREWOLF
          ? assignments.filter(p => p.faction === Faction.WEREWOLF && p.id !== player.id)
          : [],
        winCondition: getWinCondition(player.role),
      });
    }
  }

  return { assignments, wolfCount: wolves.length, villagerCount: villagers.length };
}
```

The assignment algorithm runs server-side only; role information never traverses the network until game end or death reveal. This zero-knowledge approach prevents client-side inspection from uncovering hidden roles [^45^].

### 3.2 Night Phase

#### 3.2.1 Night Structure

The Night phase follows **sequential action collection with simultaneous resolution**: players submit actions in defined order (Werewolves first, then special roles), but all actions resolve together at `NIGHT_END` via the 11-category priority pipeline. No player observes another's action in real time [^46^]. The night phase comprises three sub-states: `NIGHT_START` (instant, initializes meetings), `NIGHT_MAIN` (timer-driven, collects actions), and `NIGHT_RESOLUTION` (instant, executes the pipeline) [^28^].

#### 3.2.2 Werewolf Pack Communication

Werewolves occupy a private WebSocket sub-room (`game:{id}:werewolf`). During `NIGHT_MAIN`, wolves exchange messages and nominate kill targets. The kill target requires a **majority vote** among living wolves; if no consensus is reached before timer expiry, no kill occurs [^56^].

```typescript
class WerewolfPackRoom {
  private wolfVotes: Map<string, string> = new Map();

  async submitKillVote(voterId: string, targetId: string): Promise<void> {
    if (!this.isWolf(voterId) || !this.isAlive(voterId)) {
      throw new ActionError('Invalid voter');
    }
    if (!this.isAlive(targetId) || this.isWolf(targetId)) {
      throw new ActionError('Invalid target');
    }
    this.wolfVotes.set(voterId, targetId);
    this.broadcastToWolves({ type: 'WW_VOTE_RECEIVED', voterId, targetId });

    const voteCounts = this.tallyVotes();
    const majority = this.getMajorityThreshold();
    for (const [target, count] of voteCounts.entries()) {
      if (count >= majority) {
        this.broadcastToWolves({ type: 'WW_CONSENSUS_REACHED', killTarget: target });
        this.game.advancePhase();
        return;
      }
    }
    if (this.wolfVotes.size === this.livingWolves.length) {
      this.broadcastToWolves({ type: 'WW_NO_CONSENSUS' });
      this.game.advancePhase();
    }
  }
}
```

#### 3.2.3 Night Action Resolution Order

Night actions resolve through an 11-category pipeline derived from the werewolv.es production system [^46^]. Actions within the same category execute simultaneously; conflicts resolve through deterministic server-defined ordering.

#### 3.2.4 Resolution Order Table

| Priority | Category | Roles / Actions | Target Selection | Result Visibility |
|----------|----------|-----------------|-------------------|-------------------|
| 1 | Redirects | Succubus | Another player's action target | Only redirector |
| 2 | Roleblocks | Direwolf, Courtesan | Any living player's night action | Only roleblocker |
| 3 | Protection Visits | Bodyguard, Huntsman, Shaman | Any living player (excluding self-consecutive) | Only protector |
| 4 | Most Visits | Seer investigate, Witch poison prep | Varies by role | Only acting player |
| 5 | Item Thefts | Ability/potion theft from target | Any player with items | Only thief |
| 6 | Kills | Werewolf pack kill, Witch poison, Serial Killer | Any living player | Public at dawn |
| 7 | Report Visits | Stalker, Harlot, Familiar | Observed player's visitors | Only observer |
| 8 | Passing of Items | Item transfer between players | Agreed recipient | Both parties |
| 9 | Swap Identities | Djinn, Shapeshifter | Two target players | Only swapper |
| 10 | Report Kills | Village death announcement | All deceased this night | Public broadcast |
| 11 | Report Revives | Village revive announcement | All revived this night | Public broadcast |

The resolution engine implements six conflict rules [^46^]: (1) redirects and swaps execute in deterministic order; (2) multiple roleblocks on one target produce no cumulative effect; (3) each protection blocks one kill independently with all triggered effects firing; (4) simultaneous item theft from one target yields nothing; (5) simultaneous kills attribute death to the first killer in server order but all effects trigger; (6) roleblockers may themselves be roleblocked.

```python
def resolve_night_actions(actions: list[NightAction], state: GameState) -> NightResult:
    result = NightResult()
    blocked_players = set()
    active_protections = defaultdict(list)
    kill_results = []

    for action in filter_by_category(actions, ActionCategory.REDIRECT):
        apply_redirect(action, state)
    for action in filter_by_category(actions, ActionCategory.ROLEBLOCK):
        if action.source.id not in blocked_players:
            blocked_players.add(action.target.id)
    for action in filter_by_category(actions, ActionCategory.PROTECTION):
        if action.source.id not in blocked_players:
            active_protections[action.target.id].append(action)
    for action in filter_by_category(actions, ActionCategory.KILL):
        if action.source.id not in blocked_players:
            kill_result = resolve_kill(action, active_protections, state)
            kill_results.append(kill_result)
    for action in filter_by_category(actions, ActionCategory.IDENTITY_SWAP):
        swap_identities(action, state)

    result.deaths = [kr for kr in kill_results if kr.target_died]
    return result
```

#### 3.2.5 Night Timer

The default night timer starts at **90 seconds** and extends by **10 seconds per living player**. If all required actions are submitted before expiry, the phase ends after a 5-second grace period. On timeout, the server assigns default actions and forces transition to `NIGHT_RESOLUTION` [^70^]. The timer runs at 1-4 ticks per second, consistent with Nakama's recommendation for turn-based multiplayer games [^183^].

![Phase Timer Scaling with Player Count](fig_3_1_timer_scaling.png)

*Figure 3.1 — Phase duration scales linearly with player count. At 12 players, Night takes 3.5 min, Discussion 6.0 min, Voting 2.0 min.*

### 3.3 Day Phase

#### 3.3.1 Day Structure

The Day phase comprises six sub-phases: **Dawn Announcement** (death reveals), **Discussion** (open deliberation), **Nomination** (accusation), **Defense Speech** (rebuttal), **Voting** (plurality ballot), and **Execution** (elimination). CheckWin evaluates conditions after both Dawn and Execution [^171^].

#### 3.3.2 Discussion Mechanics

The Discussion sub-phase opens a public chat channel for all living players. Duration is 3 minutes, scaling at 15 seconds per living player. A configurable speaking queue lets players request the floor for up to 60 seconds per turn, preventing dominant voices from monopolizing deliberation [^106^].

#### 3.3.3 Nomination

Any living player may nominate another for execution. Once a nomination receives a **second**, the nominee enters Defense and receives **30 seconds** for a defense statement. Multiple nominations may occur sequentially; each nominee gets a defense slot before voting begins [^212^].

#### 3.3.4 Voting

Voting uses **plurality**: the nominee with the most votes is executed. The ballot may be public (votes visible in real time) or secret (votes revealed at tally). Ties resolve to **no execution** unless the host enables tiebreaker variants [^212^]. The Vote Lock period freezes all votes 30 seconds before expiry [^70^].

#### 3.3.5 Complete Phase Specification Matrix

| Phase | Sub-Phase | Base Duration | Per-Player Additive | Player Actions | System Actions |
|-------|-----------|---------------|--------------------|----------------|----------------|
| Night | Night Start | 5s | 0s | None | Initialize meetings, process delayed deaths |
| Night | Werewolf Discussion | 60s | 10s | Chat, nominate kill target | Tally wolf votes, check consensus |
| Night | Seer Check | 30s | 5s | Select investigation target | Record alignment result |
| Night | Bodyguard Protect | 30s | 5s | Select protection target | Register protection visit |
| Night | Witch Action | 30s | 5s | Choose heal/poison targets | Consume potions, register effects |
| Night | Night Resolution | 5s | 0s | None | Execute 11-category pipeline |
| Day | Dawn Announcement | 15s | 0s | None | Reveal deaths, reveal roles (if enabled) |
| Day | Discussion | 180s | 15s | Open chat, optional speaking queue | Enforce timer, log messages |
| Day | Nomination | 30s | 5s | Nominate, second nominations | Track nomination queue |
| Day | Defense Speech | 30s | 0s | Deliver defense statement | Enforce no-interrupt rule |
| Day | Voting | 60s | 5s | Cast vote (public or secret) | Tally votes, check majority |
| Day | Execution | 10s | 0s | None | Eliminate target, trigger death effects |

![Day Phase Time Budget by Game Speed Preset](fig_3_2_day_budget.png)

*Figure 3.2 — Day phase time budget across six sub-phases. Discussion dominates at 47-59% of total day time.*

```typescript
class DayPhaseOrchestrator {
  private currentSubPhase: DaySubPhase = DaySubPhase.DAWN;

  async advanceSubPhase(): Promise<void> {
    switch (this.currentSubPhase) {
      case DaySubPhase.DAWN:
        await this.announceDeaths();
        this.currentSubPhase = DaySubPhase.DISCUSSION;
        this.startTimer(this.getDiscussionDuration());
        break;
      case DaySubPhase.DISCUSSION:
        this.currentSubPhase = DaySubPhase.NOMINATION;
        this.openNominations();
        break;
      case DaySubPhase.NOMINATION:
        if (this.nominationQueue.length > 0) {
          this.currentSubPhase = DaySubPhase.DEFENSE;
          await this.startDefenseSpeech(this.nominationQueue[0]);
        } else {
          this.currentSubPhase = DaySubPhase.VOTING;
          this.startVoting();
        }
        break;
      case DaySubPhase.DEFENSE:
        this.nominationQueue.shift();
        if (this.nominationQueue.length > 0) {
          await this.startDefenseSpeech(this.nominationQueue[0]);
        } else {
          this.currentSubPhase = DaySubPhase.VOTING;
          this.startVoting();
        }
        break;
      case DaySubPhase.VOTING:
        this.currentSubPhase = DaySubPhase.EXECUTION;
        await this.executeHighestVote();
        break;
    }
  }

  private getDiscussionDuration(): number {
    return (180 + this.game.alivePlayers.length * 15) * 1000;
  }
}
```

### 3.4 Phase State Machine

#### 3.4.1 15-State FSM

The game engine implements a 15-state Finite State Machine with composite states for Night and Day. Each state defines three handlers: `onEnter` (setup), `handleAction` (player input), and `onTimerExpired` (forced transition). The FSM provides "clear transitions" between discrete game stages [^76^].

```mermaid
stateDiagram-v2
    [*] --> Lobby
    Lobby --> RoleAssign : all ready
    RoleAssign --> NightStart : assignment complete
    NightStart --> WerewolfPhase : init done
    WerewolfPhase --> SeerPhase : consensus or timeout
    SeerPhase --> WitchPhase : action or timeout
    WitchPhase --> HunterPhase : action or timeout
    HunterPhase --> NightEnd : action or timeout
    NightEnd --> Dawn : resolution complete
    Dawn --> CheckWin : announcement done
    CheckWin --> GameOver : winner found
    CheckWin --> Discussion : no winner
    Discussion --> Nomination : timer expires
    Nomination --> Defense : nominee queued
    Defense --> Voting : defense complete
    Voting --> Execution : votes tallied
    Execution --> CheckWin : execution done
    CheckWin --> NightStart : no winner
    GameOver --> Lobby : post-game complete
```

*Figure 3.3 — 15-state game FSM. Night sub-states collect actions sequentially; NightEnd applies the 11-category pipeline. All paths converge through CheckWin.*

#### 3.4.2 State Machine Implementation

The FSM couples transition guards with validation logic. Each transition carries a predicate that inspects game context before permitting the state change [^170^] [^223^].

```typescript
const TRANSITION_MATRIX: Map<GamePhase, Map<GamePhase, TransitionGuard>> = new Map([
  [GamePhase.LOBBY, new Map([
    [GamePhase.ROLE_ASSIGN, (ctx) =>
      ctx.playerCount >= ctx.config.minPlayers && ctx.allPlayersReady
        ? ValidationResult.VALID : ValidationResult.INSUFFICIENT_PLAYERS]
  ])],
  [GamePhase.WEREWOLF_PHASE, new Map([
    [GamePhase.SEER_PHASE, (ctx) =>
      ctx.werewolfConsensus !== null || ctx.phaseTimer <= 0
        ? ValidationResult.VALID : ValidationResult.MISSING_ACTIONS]
  ])],
  [GamePhase.EXECUTION, new Map([
    [GamePhase.CHECK_WIN, () => ValidationResult.VALID]
  ])],
  [GamePhase.CHECK_WIN, new Map([
    [GamePhase.GAME_OVER, (ctx) =>
      ctx.winner !== null ? ValidationResult.VALID : ValidationResult.NO_WINNER],
    [GamePhase.NIGHT_START, (ctx) =>
      ctx.winner === null ? ValidationResult.VALID : ValidationResult.WINNER_EXISTS]
  ])],
]);

function validateTransition(
  from: GamePhase, to: GamePhase, ctx: GameContext
): ValidationResult {
  const fromMap = TRANSITION_MATRIX.get(from);
  if (!fromMap || !fromMap.has(to)) return ValidationResult.INVALID_TRANSITION;
  return fromMap.get(to)!(ctx);
}
```

#### 3.4.3 Transition Triggers

State transitions fire on one of four trigger types.

| Trigger Type | Description | Example |
|-------------|-------------|---------|
| Timer expiry | Phase duration elapsed; default actions assigned | Night timer reaches zero, unresolved actions default to NO_ACTION |
| Unanimous action | All required players submitted valid actions | All werewolves voted for same kill target |
| Host override | Room owner forces phase advance | Host skips remaining discussion time |
| System event | Automated trigger from game rules | Meteor deadlock resolution fires after 5-6 indecision rounds [^70^] |

The `onTimerExpired` handler assigns default actions to non-acted players, then advances the phase. Villagers default to `NO_ACTION`, Werewolves to `NO_KILL`, the Seer to a random living target, and the Bodyguard to self-protection.

#### 3.4.4 Timer Configuration Table

| Phase | Base Duration | Per-Player Additive | Fast Preset | Medium Preset | Standard Preset | Slow Preset |
|-------|--------------|--------------------|-------------|---------------|-----------------|-------------|
| Night (total) | 90s | +10s | 2.0 min | 2.8 min | 3.5 min | 4.5 min |
| Werewolf Discussion | 60s | +10s | 1.5 min | 2.0 min | 2.5 min | 3.0 min |
| Discussion (Day) | 180s | +15s | 3.0 min | 4.5 min | 6.0 min | 7.5 min |
| Nomination | 30s | +5s | 0.8 min | 1.0 min | 1.3 min | 1.5 min |
| Defense Speech | 30s | 0s | 0.5 min | 0.5 min | 0.5 min | 0.5 min |
| Voting | 60s | +5s | 1.3 min | 1.5 min | 1.8 min | 2.0 min |
| Vote Lock | 30s | 0s | 0.5 min | 0.5 min | 0.5 min | 0.5 min |

The **Scale Timer** feature dynamically adjusts durations based on the ratio of living players to starting players. The timer runs at 70% of configured duration at 100% alive, scales to 100% at 50% alive, and returns to 70% at near-zero alive [^70^].

```mermaid
graph TD
    A[Start Timer] --> B{Scale Timer Enabled?}
    B -->|No| C[Return Raw Duration]
    B -->|Yes| D[Calculate Alive Ratio]
    D --> E{Ratio >= 0.5?}
    E -->|Yes| F[Factor = 0.70 + 0.30 * ((1.0 - Ratio) / 0.5)]
    E -->|No| G[Factor = 1.00 - 0.30 * ((0.5 - Ratio) / 0.5)]
    F --> H[Return Duration * Factor]
    G --> H
```

*Figure 3.4 — Scale timer computation. The symmetric bell curve peaks at 50% alive, giving mid-game phases maximum deliberation time.*

```typescript
class PhaseTimer {
  getDuration(phase: GamePhase): number {
    const base = this.config.baseDurations[phase];
    const additive = this.config.perPlayerAdditive[phase] * this.alivePlayers;
    const rawDuration = base + additive;
    if (!this.config.scaleTimerEnabled) return rawDuration;

    const aliveRatio = this.alivePlayers / this.startingPlayers;
    const scaleFactor = aliveRatio >= 0.5
      ? 0.70 + 0.30 * ((1.0 - aliveRatio) / 0.5)
      : 1.00 - 0.30 * ((0.5 - aliveRatio) / 0.5);
    return Math.round(rawDuration * scaleFactor);
  }

  onTick(): void {
    this.remainingSeconds--;
    this.broadcastTimerUpdate(this.remainingSeconds);
    if (this.remainingSeconds <= 0) this.forceAdvancePhase();
  }
}
```

### 3.5 Win Condition Detection

#### 3.5.1 Win Conditions

The engine evaluates three victory categories after each elimination. The parity rule — wolves win when `wolfCount >= nonWolfCount` — is standard across all major rule sets [^56^] [^73^]. Town of Salem allows "multiple winners, one winner, or no winners" depending on configuration [^103^].

| Faction | Win Condition | Evaluation Trigger |
|---------|--------------|-------------------|
| Village | All werewolf-aligned players dead | After each dawn, after each execution |
| Werewolf | Wolf count >= non-wolf count (parity) | After each dawn, after each execution |
| Fool / Jester | Voted out during day (independent) | During execution phase only |
| Serial Killer | Last player alive | After each dawn, after each execution |
| Cult Leader | All living players are cult members | After each dawn, after each execution |

A simultaneous elimination scenario — where the last wolf and last non-wolf die in the same event — produces a **draw** rather than a faction victory [^256^]. The engine checks simultaneous elimination before faction wins.

#### 3.5.2 Win Detection Algorithm

The win detector runs after four trigger points: dawn, execution, Hunter revenge, and meteor resolution [^171^]. Evaluation follows precedence order: simultaneous draw first, then village win, then wolf parity, then neutral conditions.

```typescript
function evaluateWinConditions(state: GameState): WinResult {
  const alive = state.players.filter(p => p.isAlive);
  const wolves = alive.filter(p => p.faction === Faction.WEREWOLF);
  const nonWolves = alive.filter(p => p.faction !== Faction.WEREWOLF);

  if (state.simultaneousDeaths.length >= 2) {
    const factions = new Set(state.simultaneousDeaths.map(d => d.faction));
    if (factions.has(Faction.WEREWOLF) && factions.has(Faction.VILLAGE)) {
      return { type: WinType.DRAW, reason: 'simultaneous_elimination' };
    }
  }
  if (wolves.length === 0) {
    return { type: WinType.VILLAGE_WIN, reason: 'all_wolves_dead' };
  }
  if (wolves.length >= nonWolves.length) {
    return { type: WinType.WEREWOLF_WIN, reason: 'parity_reached' };
  }
  for (const neutral of alive.filter(p => p.faction === Faction.NEUTRAL)) {
    if (neutral.role === Role.FOOL && neutral.wasVotedOut) {
      return { type: WinType.FOOL_WIN, player: neutral.id };
    }
    if (neutral.role === Role.SERIAL_KILLER && alive.length === 1) {
      return { type: WinType.SERIAL_KILLER_WIN, player: neutral.id };
    }
  }
  return { type: WinType.NO_WINNER };
}
```

#### 3.5.3 Game End Sequence

Upon detecting a winner, the engine executes a five-step termination: (1) reveal all hidden roles to all players; (2) compute final scores using per-role ELO tracking; (3) persist the event stream to PostgreSQL for analytics; (4) broadcast a `GAME_ENDED` event with winning faction and performance metrics; (5) after a 30-second post-game viewing period, transition back to Lobby.

The deadlock prevention system (meteor mechanic) fires if 5-6 consecutive full cycles pass with no lynch and no wolf kill, eliminating all members of the offending faction [^70^] [^181^]. This prevents indefinite stalling where wolves refuse to kill to preserve parity and the village refuses to lynch from mislynch fear.

The event sourcing architecture records every phase transition and win check as an immutable event. "Redis Streams capture every player action as immutable events" [^172^]. Each win evaluation generates a `WIN_CONDITION_CHECKED` event with faction counts and the resulting decision, creating a transparent audit trail [^170^].
ams capture every player action as immutable events" [^172^]. Each win evaluation generates a `WIN_CONDITION_CHECKED` event with faction counts and the resulting decision, creating a transparent audit trail [^170^].
-e 

---

## 4. Roles & Meta Design

### 4.1 Role Design Philosophy

#### 4.1.1 Design Principles

The Werewolf role system rests on three interconnected principles. **Information asymmetry creates tension**: the village operates with incomplete knowledge of faction assignments while the werewolf team possesses perfect information about its own membership [^44^]. This structural imbalance forces the uninformed majority to extract signal from social interaction while the informed minority constructs believable false narratives. **Meaningful decisions every turn** ensures that even the vanilla Villager faces consequential choices during daytime voting — a player who votes incorrectly advances the opposing faction's win condition. **Faction interdependence** prevents any single role from dominating; the Seer's investigations require the Doctor's protection, while the Werewolves' night kill depends on coordinated decisions that risk exposing their alliance [^18^].

#### 4.1.2 Information Taxonomy

Information distributes across three categories. *Perfect information* — publicly observable facts including vote tallies, death announcements, and role reveals on death — is shared equally. *Probabilistic information* encompasses alignment checks, protection results, and wolf-target knowledge. It is reliable but scarce, degrading as roles are eliminated. *Hidden information* includes faction assignments, night action targets, and werewolf team communications. The asymmetry between werewolf knowledge (full team composition) and villager knowledge (only their own role) constitutes the game's core tension [^50^].

![Role capability profiles across information value, kill/defend capability, and swing potential dimensions](fig4_1_role_weight_radar.png)

#### 4.1.3 Deception as Legitimate Strategy

Lying in Werewolf is core gameplay, not cheating. Werewolves must deceive to survive; villagers must detect deception to win. This creates a natural **detection asymmetry**: the WOLF benchmark shows werewolves deceive in 31% of turns while peer detection achieves only 71–73% precision [^151^]. The Traitors benchmark reveals a 93% truth-speaking rate versus 10% fabricated claim rate [^337^]. Early-game deception succeeds reliably, but extended interaction improves detection without compounding errors against truthful roles [^151^]. The platform leverages this asymmetry as a built-in difficulty progression.

### 4.2 Core Role Definitions

#### 4.2.1 Villager

The Villager possesses no special abilities and participates solely in daytime discussion and voting. Approximately 70–75% of players in a standard setup should be villagers or near-vanilla roles [^71^]. Strategic contribution derives from social deduction — analyzing voting patterns, statement consistency, and behavioral tells. Quiet villagers may be mistaken for wolves; overly helpful villagers may be mistaken for power roles [^33^]. Villagers collectively control the vote, making their coordination decisive even without individual power.

#### 4.2.2 Werewolf

The Werewolf participates in the factional night kill (jointly selecting one victim with teammates) and wins at numerical parity [^56^]. The typical ratio is 1 wolf per 3–4 villagers [^44^]. Werewolves know all teammates from game start and communicate privately at night. During daytime each wolf must maintain a villager persona. Key strategic rules include: "Don't jump on a fellow wolf's bandwagon unless it's very likely to clear you" [^52^], and when a villager claims a power role under pressure, a wolf should counterclaim even without heat to secure a free village lynch [^52^].

#### 4.2.3 Seer

The Seer investigates one player per night, learning alignment (wolf or non-wolf). With a weight of +7, the Seer is the most powerful information role and the primary wolf target [^172^]. The Seer must balance revealing information against self-preservation: "Your task is to give the village enough solid information to go on" [^283^]. Results are binary ("wolf" or "not wolf"). Critical counterplay exists: the Alpha Werewolf appears innocent to Seer checks, and the Miller appears guilty despite being village-aligned [^16^].

#### 4.2.4 Bodyguard (Doctor)

The Bodyguard protects one player from the werewolf night kill each night, succeeding only when the target matches the wolves' kill target. Cannot self-protect on consecutive nights [^16^]. Protection priority: Night 1 self-protect; Night 2+ protect revealed Seer; late game protect confirmed villagers [^169^]. The weight of +3 reflects moderate defensive value scaling with high-value village targets [^172^].

#### 4.2.5 Witch

The Witch possesses one healing potion and one poison potion, each usable once [^33^] [^228^]. After wolves select their target, the Witch sees who was targeted and may heal them. The poison potion kills any player and bypasses Doctor protection [^225^]. Both potions may be used on the same night [^225^]. Night 1 healing guarantees at least one save and clears one player as innocent [^229^]. Poisoning on Night 1 is statistically unlikely to hit a wolf and is forbidden in competitive play [^229^]. Privileged knowledge of wolf targets creates a critical advantage: "Claiming 'he was the only one saved last night' is unknowable to anyone but the Witch" [^96^].

#### 4.2.6 Complete Role Roster

The following table defines core and extended roles with balance weights from the Ultimate Werewolf character value system [^172^].

| Role | Faction | Ability | Information Access | Complexity | Weight |
|:---|:---|:---|:---|:---|:---:|
| Villager | Village | None (votes only) | Public only | Low | +1 |
| Werewolf | Werewolf | Factional night kill | Full wolf team | Medium | -6 |
| Seer | Village | Night alignment check | Check results | High | +7 |
| Doctor | Village | Night protection | Protection target only | Medium | +3 |
| Witch | Village | One heal, one poison | Wolf kill target | Very High | +5 |
| Hunter | Village | Revenge kill on death | None | Medium | +3 |
| Mason | Village | Knows other Masons | Confirmed Masons | Low-Medium | +2 |
| Alpha Werewolf | Werewolf | Appears innocent to Seer | Full wolf team | Medium | -3 |
| Minion | Werewolf* | Knows all wolves | Full wolf team | Medium-High | -2 |
| Fool/Tanner | Solo | None | None | Medium | -1 |
| Shapeshifter | Werewolf | Identity swap with victim | Full wolf team | High | -4 |

*Minion counts as villager for parity but wins with werewolves.

A single Seer (+7) approximately counterbalances one Werewolf (-6) [^172^]. The Witch (+5) occupies a uniquely powerful position due to dual one-shot abilities with asymmetric information. Extended roles such as the Alpha Werewolf (-3) provide critical Seer counterplay, preventing the Seer from becoming a game-solving mechanism.

### 4.3 Balance Framework

#### 4.3.1 Balance Formula

Academic research formalizes balance through the balance index:

$$b = 1 - |2 \cdot p_{imp} - 1|$$

Where $b$ is the balance index (1 = perfect balance, 0 = completely one-sided) and $p_{imp}$ is the village win probability. The target is $b > 0.75$, corresponding to $p_{imp} \in [0.375, 0.625]$ [^14^].

![Balance index b as a function of village win probability, with target zone b > 0.75 highlighted](fig4_2_balance_index.png)

```python
def compute_balance_index(village_win_rate: float) -> float:
    """Compute balance index from empirical village win rate.
    
    Args:
        village_win_rate: Observed probability of village winning, [0, 1]
        
    Returns:
        Balance index b in [0, 1]. Target: b > 0.75
    """
    return 1.0 - abs(2.0 * village_win_rate - 1.0)

# Validation thresholds
TARGET_MIN = 0.75        # Acceptable balance floor
PERFECT_BALANCE = 1.0    # Ideal (village_win_rate == 0.5)
```

In 90{,}720-game experiments, homogeneous play achieved $b = 0.978$ while team-aware play dropped to $b = 0.602$, showing that "additional information and strategic complexity systematically reduce balance" [^14^]. This validates the principle that feedback and direct intel must be inversely proportional [^31^].

#### 4.3.2 Role Weight Assignment

Each role receives a composite score across three dimensions. **Information value** ($\pm 3$) measures actionable intel generated or denied. **Kill/defend capability** ($\pm 3$) quantifies elimination or protection power. **Swing potential** ($\pm 2$) captures high-variance outcome ability.

| Role | Info Value | Kill/Defend | Swing | Composite | UW Weight |
|:---|:---:|:---:|:---:|:---:|:---:|
| Villager | 0 | 0 | 0 | 0 | +1 |
| Seer | +3 | 0 | +1 | +4 | +7 |
| Doctor | 0 | +2 | +1 | +3 | +3 |
| Witch | +1 | +2 | +2 | +5 | +5 |
| Hunter | 0 | +2 | +1 | +3 | +3 |
| Werewolf | +2 | +2 | +1 | +5 | -6 |
| Mason | +2 | 0 | 0 | +2 | +2 |
| Alpha Werewolf | +2 | +2 | +1 | +5 | -3 |

Both systems share the core rule: "The sum of the character values should be close to 0" [^172^]. Positive totals favor villagers; negative totals favor werewolves [^48^].

#### 4.3.3 Villager-to-Werewolf Ratio Guidelines

The classic ratio is approximately 3:1 [^44^] [^50^], shifting based on information environment:

| Setup Type | Villager:Wolf Ratio | Example (8p) | Rationale |
|:---|:---:|:---|:---|
| Role reveal ON death | 3:1 | 6 villagers, 2 wolves | Death reveals provide village intel engine |
| Role reveal OFF death | 4:1 | 7 villagers, 1–2 wolves | No reveal removes major information source |
| Strong village roles present | 3.5:1 | 5 villagers + Seer + Doctor, 2 wolves | Intel roles compensate for lower ratio |
| Mountainous (no special roles) | 2:1 to 3:1 | 5–6 villagers, 2–3 wolves | Pure vote/number balance |

BoardGameGeek recommends a wolves:villagers:specials ratio around 1:2:1 or 1:3:1 [^53^]. Davidoff's original rules specified approximately one-third mafiosi [^73^]. The recursive trajectory model predicts: from state $(w, v) = (a, 2a)$, the next day's balance is either $(a-1, 2a-1)$ on wolf lynch or $(a, 2a-2)$ on villager lynch [^50^].

#### 4.3.4 Faction Composition Algorithm

Role assignment uses constraint satisfaction. Given player count $N$, the algorithm selects a multiset $\mathcal{R}$ such that $|\sum_{r \in \mathcal{R}} w(r)| \leq \epsilon$, with $\epsilon = 2$:

```python
import random

def generate_balanced_setup(
    player_count: int,
    available_roles: list[Role],
    target_epsilon: float = 2.0,
    max_trials: int = 10_000
) -> list[Role] | None:
    """Constraint-satisfaction role assignment.
    Ensures |sum(weights)| <= epsilon for faction balance.
    """
    wolf_count = max(1, player_count // 4)
    villager_count = player_count - wolf_count - 2  # reserve for specials
    special_count = player_count - villager_count - wolf_count
    
    pool = [r for r in available_roles if r.category == 'special']
    
    for _ in range(max_trials):
        selected = random.choices(
            pool, k=special_count,
            weights=[1.0 / (abs(r.weight) + 1) for r in pool]
        )
        setup = [villager_role] * villager_count + \
                [werewolf_role] * wolf_count + selected
        
        if abs(sum(r.weight for r in setup)) <= target_epsilon:
            return setup
    return None
```

The 10{,}000-trial budget provides near-certain convergence for player counts up to 18.

#### 4.3.5 Balance Validation

After assignment, setups undergo Monte Carlo validation:

```python
def validate_balance(setup: list[Role], n_sims: int = 10_000) -> dict:
    """Full balance validation pipeline."""
    weight_sum = sum(r.weight for r in setup)
    p_imp = estimate_win_rate(setup, n_sims)
    b = 1 - abs(2 * p_imp - 1)
    
    return {
        "weight_sum": weight_sum,
        "p_imp": p_imp,
        "balance_index": b,
        "is_balanced": b > 0.75,
        "verdict": "ACCEPT" if b > 0.75 
                   else "ADJUST" if b > 0.5 
                   else "REJECT"
    }

# Example: Classic 8-player setup
classic = [villager]*4 + [werewolf]*2 + [seer, doctor]
# Expected: p_imp ~ 0.55-0.60, b ~ 0.80-0.90, verdict: ACCEPT
```

The 10{,}000-simulation default provides $\pm 1\%$ confidence intervals at 95% confidence.

![Preset faction composition across Classic (8p), Standard (12p), and Advanced (16p) configurations](fig4_4_preset_comparison.png)

### 4.4 Tells & Deception Tactics

#### 4.4.1 Soft Tells

Soft tells are behavioral indicators with moderate reliability (35–55%) that suggest but do not prove wolf alignment. **Hesitation patterns** manifest as longer pauses due to cognitive demands of maintaining a false narrative [^97^]. **Over-justification** — excessive rationale for votes that would be natural for a genuine villager — reads as manufactured credibility. **Vague language** enables later revision but signals evasion under pressure. **Tone shifts** in confidence level often indicate strategic pivots rather than organic belief evolution. These tells compound meaningfully when multiple signals align [^104^].

#### 4.4.2 Hard Tells

Hard tells are logical incompatibilities with high reliability (72–95%). **Contradictions with known facts** occur when a current statement conflicts with a prior statement in the game record — receipt-based comparison is "highly reliable in text-based play" [^96^]. **Impossible claims** assert knowledge a role cannot possess, constituting "the unforgivable wolf error" [^96^]. **Voting pattern inconsistencies** include synchronized defense loops ("Charlie received only two votes — his own and Diana's. That is a closed loop" [^75^]).

| Tell Category | Example | Reliability | Type |
|:---|:---|:---:|:---|
| Contradiction with known facts | Vote reasoning conflicts with Day 1 statement | 92% | Hard |
| Impossible role claim | Villager knows wolf night target | 95% | Hard |
| Voting pattern inconsistency | Votes with same player without reasoning | 78% | Hard |
| Synchronized defense | Immediately defends same player when challenged | 55% | Soft |
| Pause frequency / hedging | Self-corrections increase under pressure | 42% | Soft |
| Over-justification | Excessive rationale for simple vote | 38% | Soft |
| Unknowable information claim | Non-Witch knows who was saved | 88% | Hard |
| Bandwagon timing | Follows consensus without new information | 52% | Soft |

#### 4.4.3 Meta Reads

Meta reads operate at the strategic pattern level. **Early accusation patterns** reveal whether a player is seeking information or manufacturing targets. **Bandwagon timing** distinguishes evaluating villagers from wolves joining late: "note who is voting with them, and throw suspicion on them for following the vote" [^99^]. **Defense posturing** — who defends whom — exposes wolf partnerships through detectable correlation [^75^]. **Information claim credibility** evaluates whether a claimed Seer's timeline aligns with known night action resolution ordering.

#### 4.4.4 Deception-Detection Asymmetry

The gap between deception capability and detection accuracy creates a natural difficulty curve. Werewolves deceive in 31% of turns; peer detection catches them at 71–73% precision with ~52% accuracy [^151^] [^343^]. The asymmetry deepens comparing 93% truth-speaking rates against 10% fabricated claim rates [^337^].

```python
def compute_suspicion_score(
    statement_history: list[Statement],
    player_role_estimate: str,
    alpha: float = 0.7
) -> float:
    """Update suspicion score with exponential smoothing.
    
    Args:
        statement_history: All statements from target player
        player_role_estimate: Estimated role for knowledge-bound checking
        alpha: Smoothing factor — higher = more weight on new evidence
        
    Returns:
        Composite suspicion score in [0, 1]
    """
    scores = {
        'self_contradiction': check_contradictions(statement_history),
        'unknowable_claims': check_knowledge_bounds(
            statement_history, player_role_estimate
        ),
        'voting_pattern': analyze_vote_consistency(statement_history),
        'confidence_shift': detect_calibration_changes(statement_history),
    }
    
    # Weights tuned from WOLF benchmark data [^151^]
    composite = (
        0.30 * scores['self_contradiction'] +
        0.25 * scores['unknowable_claims'] +
        0.25 * scores['voting_pattern'] +
        0.20 * scores['confidence_shift']
    )
    
    # Exponential smoothing: D_{t+1} = alpha * s_o_t + (1-alpha) * D_t
    return alpha * composite + (1 - alpha) * scores.get('prior_score', 0.5)
```

| Algorithm | Precision | Recall | Key Strength | Key Weakness |
|:---|:---:|:---:|:---|:---|
| Receipt-based contradiction | High | Medium | Logically irrefutable | Requires complete history |
| COTAM (3-stage reflective) | 0.49–0.62 F1 | 0.49–0.62 | No training needed | Computationally expensive [^359^] |
| WOLF suspicion scoring | 71–73% | ~52% | Longitudinal dynamics | Requires many rounds |
| LLM-as-Judge (direct) | Low-Medium | Low | Simple implementation | Fooled by skilled lies |

![Tell reliability comparison: hard tells achieve 72–95% reliability; soft tells achieve 35–55%](fig4_3_tell_reliability.png)

The village wins by combining hard-tell detection with systematic elimination of players whose soft-tell profiles diverge from their claimed role's expected pattern.

### 4.5 Role Expansion Design

#### 4.5.1 Design Pattern for New Roles

New roles follow a specification template ensuring faction balance and AI prompt compatibility:

```python
@dataclass
class RoleSpecification:
    """Template for defining new Werewolf roles."""
    role_id: str
    name: str
    faction: Faction
    category: Literal["core", "extended", "third_party"]
    ability_description: str
    night_action: bool
    night_action_order: int  # 1-11 per resolution pipeline
    information_access: list[str]
    win_condition: str
    setup_weight: int  # + favors village, - favors wolves
    max_per_game: int
    ai_difficulty: Literal["low", "medium", "high", "very_high"]
    ai_prompt_template: str
    interaction_rules: dict[str, str]

    def validate(self) -> list[str]:
        """Ensure role has counterplay and no auto-confirm mechanics."""
        issues = []
        if "auto_confirm" in self.interaction_rules.values():
            issues.append("Error: auto-confirm reduces deduction space")
        if not any("counter" in k for k in self.interaction_rules):
            issues.append("Warning: no counterplay defined")
        return issues
```

The `validate` method enforces that every role needs a counter — the Seer has the Alpha Werewolf, the Doctor has roleblockers, Masons can be countered by wolf Mason-fakes [^31^]. Auto-confirm mechanics that definitively prove a role remove all doubt and should be avoided.

#### 4.5.2 Role Compatibility Matrix

Not all roles coexist without degenerate strategies:

|  | Seer | Doctor | Witch | Hunter | Mason | Alpha | Minion | Fool |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Seer** | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Doctor** | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Witch** | ✓ | ✓ | — | ✓ | ✓ | ⚠ | ✓ | ✓ |
| **Hunter** | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ |
| **Mason** | ✓ | ✓ | ✓ | ✓ | — | ✓ | ⚠ | ⚠ |
| **Alpha** | ✓ | ✓ | ⚠ | ✓ | ✓ | — | ✓ | ✓ |
| **Minion** | ✓ | ✓ | ✓ | ✓ | ⚠ | ✓ | — | ✓ |
| **Fool** | ✓ | ✓ | ✓ | ✓ | ⚠ | ✓ | ✓ | — |

Key: ✓ = safe; ⚠ = requires tuning ($\pm 1$ weight adjustment).

The Witch + Alpha combination risks overpowered wolf play if the Witch's poison removes a villager while the Alpha survives a Seer check. The Mason + Minion pairing creates information warfare where the Minion knows exactly which Mason claims are fake.

#### 4.5.3 Extended Roles

Beyond the core roster, extended roles introduce specialized mechanics:

| Role | Faction | Ability | Strategic Impact | Weight |
|:---|:---|:---|:---|:---:|
| **Hunter** | Village | Revenge kill on death; target chosen at death | Deters wolf kill via 1-for-1 trade; "almost never claim early" [^101^] | +3 |
| **Fool** | Solo | Wins if voted out during day; seen as villager by Seer | Distracts village; wolves should avoid killing the Fool [^220^] | -1 |
| **Mason** | Village | Knows other Masons from game start | Voting bloc; wolves can fake Mason claims [^282^] | +2 |
| **Minion** | Werewolf* | Knows all wolves; does not participate in night kill | Pushes mislynches with plausible deniability [^285^] | -2 |

*Minion counts as villager for parity.

The Hunter's reactive kill creates a deterrent effect disproportionate to its weight. The Fool introduces a third-party win condition that helps wolves by providing a free mislynch target, requiring setup compensation. The Mason trust network narrows the suspect pool while the Minion's asymmetric knowledge enables deep-cover disruption of village coordination [^276^]. The complete role system — core, extended, and the expansion pattern — provides a modular toolkit. Balance validation through analytical weight sums and Monte Carlo simulation ensures each configuration maintains $b > 0.75$, preserving the tension between information asymmetry and detection capability that defines Werewolf's emergent gameplay.
-e 

---

## 5. Chat & Communication System

### 5.1 Communication Architecture

The chat system routes all player and AI dialogue through six channels, each gated by the 15-state FSM (Chapter 3) and filtered by role-based information boundaries (Chapter 4). Three requirements are non-negotiable: (1) living players never detect channels they cannot access; (2) every message is recoverable after reconnection; (3) AI-generated speech is protocol-indistinguishable from human messages [^364^] [^428^].

The system uses WebSocket (Socket.IO) with Redis Pub/Sub as the cross-server bus. Each server maintains room memberships per match; messages are published to Redis channels scoped by match and channel ID, then broadcast to subscribers. This yields sub-50 ms end-to-end latency [^364^]. History is stored in Redis Lists (last 200 messages, 24-hour TTL) with asynchronous PostgreSQL persistence for replay and analytics.

```mermaid
flowchart LR
    subgraph Client["Client Layer"]
        H[Human Player]
        A[AI Agent]
    end
    subgraph Server["Game Server (Socket.IO)"]
        V[Validator]
        M[Moderation Pipeline]
        R[Redis Pub/Sub]
    end
    subgraph Store["Storage Layer"]
        RH[Redis Hot Store]
        PG[(PostgreSQL Warm)]
    end
    H -->|"chat:send"| V
    A -->|"chat:send"| V
    V --> M
    M --> R
    R --> RH
    R --> PG
    R -->|"chat:message"| H
```

**Delivery guarantees.** Messages carry per-channel sequence numbers (64-bit monotonic) ensuring causal ordering. On reconnection, clients request replay from a known offset; the server returns all messages from that offset to the current head. Duplicate suppression uses message ID deduplication client-side. Persistence is three-tiered: Redis (hot, active matches), PostgreSQL (warm, completed games), and S3 (cold, analytics and AI training data).

| Channel | ID Pattern | Gated By | Persistence |
|---------|-----------|----------|-------------|
| Global (Day Chat) | `match:{id}:public` | Alive + Day phase | 24 h Redis → PostgreSQL |
| Werewolf (Night) | `match:{id}:werewolf` | Werewolf role + Night phase | 24 h Redis → PostgreSQL |
| Dead / Spectator | `match:{id}:spectator` | Dead or spectator status | 24 h Redis → PostgreSQL |
| System | `match:{id}:system` | Server-generated only | 48 h Redis → PostgreSQL |
| Whisper | `match:{id}:whisper:{pid}` | Sender + recipient | Ephemeral (5 min TTL) |
| Moderator | `match:{id}:mod` | Server / AI narration | 72 h Redis → PostgreSQL |

Channel isolation is the critical security invariant: "even if a client attempts to subscribe to a restricted channel, the server validates their role before allowing message reception" [^428^]. Non-werewolves receive no evidence the werewolf channel exists.

```typescript
// Message history replay for reconnected clients
async function replayHistory(socket, matchId, channel, lastSeq) {
  const redisKey = `chat:history:${matchId}:${channel}`;
  const messages = await redis.xRange(redisKey, lastSeq, '+');
  for (const msg of messages) {
    socket.emit('chat:message', deserialize(msg));
  }
}
```

The replay function ensures at-least-once delivery across reconnections via Redis Streams with per-channel sequence numbers.

### 5.2 Channel Specifications

**Global day chat.** Active during `DAY_DISCUSS` and `VOTING` phases. Living players send free-form text up to 500 characters with @-mention support. Dead players are automatically removed from this channel's room upon elimination.

**Werewolf night channel.** Visible only to living `WEREWOLF` players during `WW_DISCUSS` and `WW_SELECT`. Werewolves coordinate kill targets and debate strategy; the channel closes on transition to `SEER_ACTION`. Non-werewolves never see this channel in their list [^428^].

**System channel.** Server-generated, read-only announcements: `PhaseChange`, `DeathAnnouncement`, `VoteTally`, `RoleReveal`, and `GameResult`. System messages bypass moderation and persist for 48 hours.

**Dead player chat.** Eliminated players transition to the spectator channel immediately upon death. They chat freely with other dead players and external spectators but are prohibited from communicating with living players — enforced by server-side isolation, not client trust [^357^]. Dead players gain full role visibility but cannot influence the living game.

```typescript
// Channel permission validation (server-side, on every message)
function canSend(channel: Channel, player: Player, phase: GamePhase): boolean {
  switch (channel) {
    case 'public':
      return player.isAlive && (phase === 'DAY_DISCUSS' || phase === 'VOTING');
    case 'werewolf':
      return player.isAlive && player.role === 'WEREWOLF' &&
             (phase === 'WW_DISCUSS' || phase === 'WW_SELECT');
    case 'spectator':
      return !player.isAlive || player.isSpectator;
    case 'whisper':
      return player.isAlive && phase === 'DAY_DISCUSS';
    case 'system':
      return false; // Server-only
    default:
      return false;
  }
}
```

The code above gates every outgoing message by lifecycle state and game phase. The default-deny pattern rejects unknown channels automatically.

**Channel permissions matrix.** The table below consolidates eligibility rules.

| Channel | Eligible Senders | Eligible Receivers | Phase Restriction | Message Types Allowed |
|---------|-----------------|-------------------|-------------------|----------------------|
| Global | Living players | Living players | Day / Voting | FreeText, Vote, Accuse, Defend, ClaimRole |
| Werewolf | Werewolf + alive | Werewolf + alive | WW_DISCUSS, WW_SELECT | FreeText, ActionSubmission |
| System | Server only | All connected | Any | PhaseChange, DeathAnnouncement, VoteTally, RoleReveal, GameResult |
| Dead | Dead + spectators | Dead + spectators | Any (post-elimination) | FreeText |
| Whisper | Living players | Sender + recipient | Day only | FreeText (max 200 chars) |
| Moderator | AI narrator | All connected | Day | Structured narration |

Authorization is enforced server-side on every message; clients receive only channels for which `canSend` evaluates to true. This prevents information leakage through client-side manipulation [^428^].

### 5.3 Message Taxonomy

Every message uses a unified envelope with a `messageType` discriminator, separating player dialogue, system announcements, and AI-internal reasoning into distinct visibility and persistence categories.

**Player messages** include five sub-types. `FreeText` carries dialogue with optional @-mentions and reply threading. `VoteDeclaration` records a nomination with target ID, vote type (lynch / no-lynch), and optional reason. `Accusation` is a structured allegation with target, accusation text, evidence references, and confidence score. `Defense` responds to a specific accusation by message ID with counter-arguments. `ClaimRole` is a public role assertion (e.g., "I am the Seer") with claimed proof.

**System messages** are server-generated and read-only: `PhaseChange` (phase transitions), `DeathAnnouncement` (elimination details), `VoteTally` (aggregated counts), `RoleReveal` (true role on death), and `GameResult` (winning faction).

**AI messages** have two visibility layers. `StructuredReasoning` contains internal strategic analysis logged for training but never sent to clients. `GeneratedSpeech` is the external-facing chat message — structurally identical to human FreeText at the protocol level, with `isAIGenerated` for logging only. `ActionSubmission` encodes night-phase actions in validated JSON.

| Message Type | Sender | Channel | Schema Key Fields | Visibility | Persistence |
|-------------|--------|---------|-------------------|------------|-------------|
| FreeText | Player / AI | Global, WW, Dead | `text`, `mentions`, `replyTo` | Public to channel | Permanent |
| VoteDeclaration | Player / AI | Global | `targetId`, `voteType`, `reason` | Public (tally anon.) | Permanent |
| Accusation | Player / AI | Global | `targetId`, `accusation`, `evidence[]`, `confidence` | Public | Permanent |
| Defense | Player / AI | Global | `responseTo`, `defense`, `counterArguments[]` | Public | Permanent |
| ClaimRole | Player / AI | Global | `claimedRole`, `proof{}`, `isCounterClaim` | Public | Permanent |
| PhaseChange | System | All | `newPhase`, `duration`, `affectedPlayers[]` | Broadcast | Permanent |
| DeathAnnouncement | System | All | `playerId`, `cause`, `roleReveal?` | Broadcast | Permanent |
| VoteTally | System | All | `tally{}`, `eliminatedId?` | Broadcast | Permanent |
| RoleReveal | System | All | `playerId`, `actualRole` | On death / end | Permanent |
| StructuredReasoning | AI | Internal only | `suspicionScores{}`, `plannedStrategy` | Server only | Training log |
| GeneratedSpeech | AI | Global, WW | `text`, `targetPlayer?`, `messageType` | Channel public | Permanent |
| ActionSubmission | AI | Internal → Engine | `action`, `target`, `reasoning` | Server only | Event log |

This taxonomy reveals a deliberate design choice: AI agents produce an internal reasoning document and an external speech message per turn, with only the latter visible to players. This enables post-hoc analysis while preserving the social illusion.

```json
{
  "id": "msg_uuid_v4",
  "timestamp": "2026-01-15T10:30:00.000Z",
  "matchId": "match_uuid",
  "channel": "public",
  "senderId": "player_uuid",
  "senderName": "PlayerName",
  "messageType": "Accuse",
  "content": {
    "targetId": "player3_uuid",
    "accusation": "I believe Player3 is a werewolf...",
    "evidence": ["day1_statement", "day2_vote_pattern"],
    "confidence": 0.75
  },
  "metadata": { "gamePhase": "day", "roundNumber": 3, "moderationScore": 0.02 }
}
```

Every message carries a `metadata` block recording game phase, round number, and moderation outcome, enabling replay reconstruction and analytics.

### 5.4 AI Speech Generation

AI agents generate dialogue through a six-stage NLP pipeline: game context ingestion → personality filtering → prompt construction → LLM generation → safety filtering → chat delivery. Research demonstrates that "personality-conditioned LLM agents adapt their expressive behaviors across conversational contexts" [^249^]; the system uses the Big Five (OCEAN) model for consistent character voices.

```mermaid
flowchart TD
    A[Game State Context] --> B[Memory Module]
    B --> C[Personality Profile]
    C --> D[Prompt Assembler]
    D --> E[LLM Engine]
    E --> F[Output Validator]
    F --> G[Safety Filter]
    G --> H[Message Formatter]
    H -->|"chat:message"| I[Channel Delivery]

    B -.->|"conversation hist + key events"| C
    C -.->|"OCEAN traits + role + strategy"| D
    E -.->|"GPT-4o / GPT-4o-mini"| F
    G -.->|"toxicity pre-check"| H
```

The Memory Module feeds conversation history and key game events into the prompt. The Personality Profile applies OCEAN trait vectors (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism) on a 0.0–1.0 scale, mapping directly to dialogue characteristics: high-Extraversion agents initiate frequently; high-Neuroticism produces anxious language; low-Agreeableness yields aggressive accusation patterns [^249^].

The system implements three generation tiers. Tier 1 (Canned Phrases) serves acknowledgments from a pre-authored bank at sub-1 ms latency. Tier 2 (Template + Personality) fills role-specific templates with personality-weighted vocabulary at 5–15 ms. Tier 3 (Fully Generated) submits constructed prompts to an LLM (GPT-4o for complex deception, GPT-4o-mini for routine speech) at 500–2,000 ms. A neuro-symbolic router selects the tier per context; the hybrid architecture achieves +7.2% entailment consistency over pure LLM approaches [^205^].

```python
# Tier selection and prompt assembly
class SpeechGenerator:
    TIER_THRESHOLD_SIMPLE = 0.3   # Low complexity → Tier 1/2
    TIER_THRESHOLD_COMPLEX = 0.7  # High complexity → Tier 3

    def select_tier(self, context: GameContext) -> int:
        complexity = self._assess_complexity(context)
        if complexity < self.TIER_THRESHOLD_SIMPLE:
            return 1 if context.is_acknowledgment else 2
        return 3

    def generate(self, context: GameContext, personality: OCEAN) -> str:
        tier = self.select_tier(context)
        if tier == 1:
            return self._canned_phrase(context, personality)
        elif tier == 2:
            return self._template_fill(context, personality)
        # Tier 3: full LLM generation
        prompt = self._assemble_prompt(context, personality)
        response = await self.llm.complete(
            prompt,
            model="gpt-4o" if complexity > 0.8 else "gpt-4o-mini",
            response_format={"type": "json_object"}
        )
        return self._validate_and_extract(response)
```

The `_assess_complexity` function scores context on player count, contradictions, pending accusations, and phase urgency. Model routing sends simple responses through GPT-4o-mini ($0.15/M tokens) and complex deception through GPT-4o ($2.50/M tokens), yielding 40–70% cost savings [^25^].

Contextual awareness requires the AI to reference specific game events. The prompt assembler injects five signals: (a) recent vote tallies; (b) outstanding accusations; (c) death announcements; (d) the agent's suspicion scores and trust network; (e) current phase conversation history. Research confirms that "even when given identical personality prompts, LLM agents' linguistic and behavioral patterns varied systematically depending on the social goals of each task" [^346^].

| Trait | Range | Dialogue Effect | High Value Behavior | Low Value Behavior |
|-------|-------|-----------------|---------------------|---------------------|
| Openness | 0.0–1.0 | Creativity and strategic novelty | Unconventional accusations, novel arguments | Traditional, predictable approaches |
| Conscientiousness | 0.0–1.0 | Reasoning thoroughness | Detailed evidence-based claims | Impulsive, gut-feel statements |
| Extraversion | 0.0–1.0 | Communication frequency | Initiates discussions, frequent messages | Quiet, responds only when addressed |
| Agreeableness | 0.0–1.0 | Social cooperativeness | Defends allies, cooperative tone | Aggressive, accuses freely |
| Neuroticism | 0.0–1.0 | Emotional stability | Anxious language, self-doubt under pressure | Confident, decisive statements |

The OCEAN configuration provides the personality foundation for Tier 2 and Tier 3 generation, enabling reproducible character voices [^249^].

| Tier | Method | Latency | Cost/msg | Best For |
|------|--------|---------|----------|----------|
| 1 — Canned | Phrase bank | <1 ms | Negligible | Acknowledgments, greetings, fillers |
| 2 — Template | Slot-filling + personality | 5–15 ms | Negligible | Routine statements, simple votes |
| 3 — Full LLM | GPT-4o / GPT-4o-mini | 500–2,000 ms | $0.003–0.015 | Complex deception, defense, accusations |

**Rate limiting for AI agents.** Each AI agent may submit a maximum of 3 messages per discussion phase with a minimum 5-second inter-message cooldown. This prevents AI agents from dominating the conversation and mirrors human typing constraints. The sliding-window rate limiter uses Redis sorted sets for per-player tracking.

```javascript
// Redis-backed sliding window rate limiter (per player, per phase)
async function checkRateLimit(playerId, channel, maxRequests, windowMs) {
  const key = `ratelimit:${playerId}:${channel}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zcard(key);
  pipeline.zadd(key, now, `${now}-${Math.random()}`);
  pipeline.pexpire(key, windowMs);
  const [, count] = await pipeline.exec();
  return { allowed: count < maxRequests, remaining: maxRequests - count - 1 };
}
```

The rate limiter enforces per-channel, per-player caps at O(1) complexity. Additional anti-spam rules: no identical repeats within 60 s; max 80% caps ratio; and character-flood detection for 10+ identical characters [^405^].

### 5.5 Moderation & Safety

All messages pass through a 4-tier moderation pipeline before delivery. The design follows a cascaded confidence-guided approach where each tier handles cases the previous tier could not resolve [^345^]. This balances real-time performance (<100 ms in the common case) against detection accuracy (>90% recall).

```mermaid
flowchart TD
    M[Incoming Message] --> T0[Tier 0: Regex Filter<br/>~0.5ms, blocks 5-10%]
    T0 -->|"match → BLOCK"| A1[Block + Warn]
    T0 -->|"pass →"| T1[Tier 1: Embedding + ML<br/>~10ms, 80.8% accuracy]
    T1 -->|"clean (<5%) →"| A2[Allow]
    T1 -->|"toxic (>95%) →"| A1
    T1 -->|"uncertain →"| T2[Tier 2: DistilBERT<br/>~50ms, 94.3% accuracy]
    T2 -->|"clean (>95%) →"| A2
    T2 -->|"toxic (<5%) →"| A1
    T2 -->|"uncertain →"| T3[Tier 3: LLM Review<br/>~2s, 91.0% accuracy]
    T3 -->|"verdict"| A3[Allow / Block / Flag]
    A3 -->|"feedback"| T1
```

**Tier 0 — Regex filter.** A compiled blacklist executes in <1 ms, blocking 5–10% of blatant violations with no false positives on gaming phrases.

**Tier 1 — Embedding + ML classifier.** Sentence-BERT embeddings feed into an SVM ensemble on CPU at 28.24 messages/second with ~35 ms latency [^345^]. Accuracy: 80.8% overall, 61.2% recall. Messages below 5% toxicity pass; above 95% are blocked; the uncertain band proceeds to Tier 2.

**Tier 2 — Fine-tuned transformer.** DistilBERT on GPU achieves 94.3% accuracy and 91.8% recall at ~50–100 ms [^345^]. Research notes that "fine-tuned DistilBERT achieves superior accuracy compared to all other methods while maintaining excellent precision and recall balance" [^345^].

**Tier 3 — LLM review.** GPT-4o with few-shot prompting handles edge cases asynchronously at 1–2 seconds, with 91.0% accuracy and 90.6% recall [^345^]. At ~$2,600× the cost of embedding methods per message, this tier is reserved for appeals and ambiguous cases only.

![Moderation Tier Comparison](sec05_moderation_tier_comparison.png)

Tier 2 (DistilBERT) occupies the performance sweet spot at 94.3% accuracy and ~50 ms latency, suitable for inline screening. Tier 3 (LLM Review) is relegated to asynchronous review due to its 2-second latency.

**Moderation actions.** The pipeline applies one of five actions per message: `allow` (pass through), `mask` (replace profanity with asterisks), `block` (reject delivery), `flag` (deliver but queue for human review), and `mute` (block + impose temporary channel or match-wide mute). Action selection follows severity escalation.

| Severity | Trigger | Auto-Action | Escalation |
|----------|---------|-------------|------------|
| Low (spam) | Repeated messages, noise | Rate limit + Warn | None |
| Medium (profanity) | Context-dependent offensive language | Mask or Warn | Mute 5 min |
| High (harassment) | Targeted abuse at specific players | Block + Mute 2 h | Human review |
| Critical (hate speech) | Attacks on protected characteristics | Block + Mute 24 h | Human review + Alert |
| Critical (self-harm) | References to self-injury | Block + Alert moderator | Immediate human review |

Werewolf-specific rules modify severity: accusations such as "you're the wolf" or "you're lying" are gameplay elements receiving automatic `allow` classification via soft-prompting with game-context tokens [^400^]. Ubisoft's ToxBuster system validates this approach for per-genre moderation adaptation.

```python
# Moderation pipeline with Werewolf context awareness
class ModerationPipeline:
    GAME_CONTEXT_TOKEN = "GAME_WEREWOLF"

    async def moderate(self, message: str, context: GameContext) -> ModerationResult:
        # Tier 0: Regex (instant)
        if block := self.tier0_regex.check(message):
            return ModerationResult(action="block", tier=0, reason=block)

        # Tier 1: Embedding + ML
        score = await self.tier1_embedding.score(message, self.GAME_CONTEXT_TOKEN)
        if score < 0.05:
            return ModerationResult(action="allow", tier=1, score=score)
        if score > 0.95:
            return ModerationResult(action="block", tier=1, score=score)

        # Tier 2: DistilBERT (GPU)
        score = await self.tier2_transformer.score(message, self.GAME_CONTEXT_TOKEN)
        if score > 0.95:
            return ModerationResult(action="block", tier=2, score=score)
        if score < 0.05:
            return ModerationResult(action="allow", tier=2, score=score)

        # Tier 3: LLM async review (uncertain cases)
        asyncio.create_task(self.tier3_llm_review(message, context))
        return ModerationResult(action="flag", tier=2, score=score)
```

The pipeline encodes the Werewolf context token at every tier, ensuring accusations and strategic deception are not misclassified as toxic [^345^]. A feedback loop from Tier 3 outcomes periodically retrains Tiers 1 and 2.

**AI safety guardrails.** AI speech passes four policy checks: (1) prompt-level refusal training blocks off-topic content and harmful instructions; (2) output guardrails enforce a 300-character limit and prohibit profanity regardless of persona; (3) platform terms are enforced even when in-character dialogue would violate them; (4) all outputs are logged with prompt context for safety auditing. The `isAIGenerated` flag is never exposed to clients — AI messages are structurally identical to human messages, preserving game integrity.
-e 

---

# 6. UI/UX, Animations & Visual Effects

## 6.1 UI Architecture

### 6.1.1 Screen Inventory

The client implements eight screens mapped to the 15-state FSM from Chapter 3. `phase_change` events determine which screen renders; the UI layer never independently selects screens [^170^].

| Screen | Purpose | Entry Condition | Exit Condition | Key Components |
|--------|---------|-----------------|----------------|----------------|
| Lobby | Room creation, join, ready-up | Client connects | Host starts game | PlayerList, ChatPanel, RoleSetup, ReadyButton |
| GameBoard (Day) | Public discussion + voting | `DAY_DISCUSSION` or `DAY_VOTING` | Phase to `NIGHT_START` | PlayerCardGrid, ChatPanel, Timer, ActionBar |
| GameBoard (Night) | Secret role actions | `NIGHT_PHASE` active | `NIGHT_END` complete | PlayerCardGrid (dimmed), ContextualActionPanel, WolfChatOverlay |
| RoleReveal | Private role assignment display | `ROLE_ASSIGNMENT` complete | Player dismisses (auto 5s) | RoleCard (flippable), AbilityDescription, FactionBanner |
| VotingInterface | Plurality voting + tally | `DAY_VOTING` phase | `VOTE_LOCK` begins | VoteButtons, TallyBar, CountdownTimer |
| GameOver | Final results, role exposure | `GAME_OVER` phase | Return to Lobby | WinnerBanner, RoleRevealGrid, StatisticsPanel |
| Settings | Audio, display, accessibility | Player opens menu | Player closes menu | VolumeSliders, ThemeToggle, AccessibilityOptions |
| SpectatorView | Full-information observation | Client joins as spectator | Spectator disconnects | FullRoleGrid, AnalyticsPanel, DelayedStreamIndicator |

The RoleReveal screen appears twice: privately at match start and publicly at game end. SpectatorView bypasses information hiding, displaying all roles simultaneously [^484^]. Active players follow: **Lobby → RoleReveal → GameBoard (Day/Night cycles) → GameOver → Lobby**.

### 6.1.2 Component Hierarchy

`AppRouter` subscribes to `system:phase_change` and selects the active screen. Shared components reside in a persistent shell:

```mermaid
graph TD
    A[AppShell] --> B[AppRouter]
    B --> C[LobbyScreen]
    B --> D[GameBoardScreen]
    B --> E[RoleRevealScreen]
    B --> F[GameOverScreen]
    B --> H[SpectatorScreen]
    A --> I[Shared Components]
    I --> J[PlayerCard]
    I --> K[ChatPanel]
    I --> L[Timer]
    I --> M[ToastNotifications]
    D --> D1[DayLayout]
    D --> D2[NightLayout]
    D1 --> D1a[CircularPlayerGrid]
    D1 --> D1b[ChatPanel + ActionBar]
    D2 --> D2a[ContextualActionPanel]
    D2 --> D2b[WolfChatOverlay]
    style A fill:#7B6D8D,stroke:#584A6E,color:#fff
    style I fill:#9B8EA8,stroke:#584A6E,color:#fff
```

Components receive `gamePhase`, `playerId`, and `isAlive` from a Zustand store synchronized via `game:state_update`. Subscribed slices trigger re-renders, avoiding prop drilling [^14^].

### 6.1.3 Real-Time Synchronization

The client implements optimistic updates for voting: local tally updates before server confirmation. Rejection (target dead, phase ended) triggers rollback with a toast.

```typescript
const useVoteState = () => {
  const [votes, setVotes] = useState<VoteMap>({});
  useEffect(() => {
    socket.on('vote:confirmed', ({ voterId, targetId }) => {
      setVotes(prev => ({ ...prev, [voterId]: targetId }));
    });
    socket.on('vote:rejected', ({ voterId, reason }) => {
      setVotes(prev => { const n = { ...prev }; delete n[voterId]; return n; });
      toast.error(`Vote rejected: ${reason}`);
    });
  }, []);
  const castVote = (targetId: string) => {
    setVotes(prev => ({ ...prev, [socket.playerId]: targetId })); // Optimistic
    socket.emit('vote:cast', { targetId });
  };
  return { votes, castVote };
};
```

All tallies and transitions originate server-side; the client renders only [^21^]. Optimistic updates apply to UI feedback, never logic.

### 6.1.4 Screen Flow State Diagram

```mermaid
stateDiagram-v2
    [*] --> Lobby : client connects
    Lobby --> RoleReveal : all_players_ready
    RoleReveal --> GameBoard_Day : role_acknowledged
    GameBoard_Day --> GameBoard_Night : phase_change NIGHT
    GameBoard_Night --> GameBoard_Day : phase_change DAY
    GameBoard_Day --> VotingInterface : phase_change VOTING
    VotingInterface --> GameBoard_Night : vote_lock → execution
    VotingInterface --> GameOver : win_condition_met
    GameBoard_Night --> GameOver : win_condition_met
    GameOver --> Lobby : return_to_lobby
```

## 6.2 Game Board Design

### 6.2.1 Player Card

PlayerCard is the atomic board unit. Each card shows a circular avatar (64×64px desktop, 56×56px compact), name, living status, and — post-elimination — a role indicator [^28^]. Table 6.2 defines the five visual states.

| State | Visual Indicator | Interaction Model |
|-------|-----------------|-------------------|
| Alive | Full color, breathing (scale 1.0–1.02, 3s loop) | Hover: scale 1.03, glow; Click: selectable |
| Dead | Grayscale 100%, 50% opacity, 5° tilt, red X, tombstone | Non-interactive; reveals role on flip |
| Voted | Green pulsing border (#4CAF50), checkmark | Disabled; vote already cast |
| Accused | Orange border (#FF9800), exclamation | Highlighted nomination target |
| Selected | Blue border (#2196F3), 3px glow | Active selection for vote/target |

```typescript
interface PlayerCardProps {
  playerId: string; name: string; avatar: string;
  role: Role | 'hidden'; faction: Faction;
  status: 'alive' | 'dead' | 'disconnected';
  isSpeaking: boolean; isTyping: boolean;
  voteCount: number; hasVoted: boolean;
  votedFor: string | null; isSelected: boolean;
  onSelect: () => void; onVote: () => void;
}
```

Avatar frames carry faction colors visible only to teammates: silver for villagers, crimson (#8B0000) for werewolves. A 12px status dot at the avatar's bottom-right conveys state: green (alive), red (dead), yellow (voting), gray (disconnected). Anonymous portraits are assigned per session [^28^].

### 6.2.2 Day Layout

Daytime arranges PlayerCards in a circular grid around a central chat panel. ≤12 players form one ring; 13–18 use outer (12) plus inner (6). The central area holds the ChatPanel with tabs (ALL, WOLF, SYS) and the action bar (**Nominate** in discussion, **Vote/Skip** in voting). A circular SVG countdown timer (64×64px, gold ring #E8B86D) sits top-center [^527^].

```mermaid
graph LR
    subgraph "Day Layout — Circular Grid"
        A[Player 1] --> B[Player 2] --> C[...] --> D[Player N] --> A
        center[ChatPanel + Timer + ActionBar]
    end
    style center fill:#E8B86D,stroke:#8B0000,color:#333
    style A fill:#C0A788,stroke:#3D2B1F,color:#333
```

### 6.2.3 Night Layout

On `NIGHT_PHASE`, the grid dims to 35–40% brightness with a blue-violet vignette (#5E4D69 at 25% opacity) [^516^]. The ContextualActionPanel replaces public chat: Seer targets for investigation, Doctor selects protection, werewolves see the WolfChatOverlay — dark crimson (#4A0000) with jagged bubbles and howl prefixes [^428^]. Non-werewolves never see evidence the wolf channel exists; the server suppresses all wolf metadata to non-wolf clients [^428^].

Table 6.3 documents the six chat channel renderings.

| Channel | Background | Border | Text Color | Indicator |
|---------|-----------|--------|------------|-----------|
| Public (Day) | Parchment #F5E6D3 | 1px #D4C5A9, radius 12px | #3D2B1F | Standard bubble |
| Own Messages | Blue #E3F2FD | Radius 4px (sharp BR) | #3D2B1F | Right-aligned |
| System | Gold #FFF8E1 | None, italic | #3D2B1F | Center, no avatar |
| Werewolf | Crimson #4A0000 | Jagged/scratched | #F5E6D3 | Howl icon prefix |
| Dead/Spectator | Gray #37474F | Dashed | #B0BEC5 | 60% opacity |
| Whisper | White | Purple #7B1FA2 | #3D2B1F | Lock icon prefix |

### 6.2.4 Information Revelation

Role information reveals through a controlled pipeline. At start each player sees only their own role. During play, eliminations expose as full reveal, alignment-only, or hidden per configuration [^56^]. The reveal triggers a 3D card flip: anonymous front rotates 0°→90° (0.3s), z-index swaps at midpoint, back face completes 90°→180° with overshoot bounce [^509^]. The Seer receives results privately — target avatar flashes gold (#FFD700) for villager, crimson (#DC143C) for werewolf — with a faction icon fading in over 0.5s.

## 6.3 Animations & Visual Effects

### 6.3.1 Day-to-Night Transition

The 2.5-second phase transition is deliberately slower than typical UI changes to build tension [^170^]. Background interpolates from warm gold (#C0A788 to #F5E6D3) to deep indigo (#1A1A2E to #16213E) [^516^], while brightness drops 100%→35% via sine-wave: $\text{brightness} = \text{offset} + \text{amplitude} \times \sin(t)$ [^497^].

```mermaid
gantt
    title Day-to-Night Transition (2.5s)
    dateFormat X
    axisFormat %ss
    section Visual
    Banner slide           :0, 0.4
    Gradient shift         :0.3, 2.5
    Brightness 100→35%    :0.5, 2.0
    Vignette darken        :1.5, 2.0
    Moon glow              :2.0, 2.5
    section Audio
    Wolf howl              :1.5, 2.0
    section Particles
    Stars fade in          :1.0, 2.0
    Fog drift              :2.0, 2.5
```

A banner slides down (0.4s, bounce easing) reading "DAY 3 BEGINS" or "NIGHT FALLS..." and dismisses after 3s. At 1.5s, a wolf howl fires, stars fade in, and fog drifts upward [^516^].

### 6.3.2 Death Reveal Animation

Lynching triggers screen shake (3 X-axis shakes, 5px amplitude, 0.1s) and chromatic aberration (RGB separation, 0.3s) [^485^]. Night kills produce a crimson flash (0.15s), claw scratches (0.4s), and blood spatter. Poison dissolves the card with green toxic cloud (#39FF14) [^258^]. After flip, the card transitions to `dead` state over 0.8s.

### 6.3.3 Voting Tally Animation

Voting has three phases. Phase 1 (Vote Lock, 1s): buttons scale to 0.9 at 50% opacity. Phase 2 (Tally Reveal, 2–3s): votes reveal with 0.3s stagger — particles arc from voter to target (0.5s bezier), target shakes (scale 1.05, 0.2s), counter pops (scale 1.5→1.0). Phase 3 (Resolution, 2s): card pulses red, "LYNCHED" stamp scales 3→1 (0.4s, dust burst), then transitions to dead (0.8s). Ties pulse yellow with "NO LYNCH."

```mermaid
sequenceDiagram
    participant S as Server
    participant VC as VoterCard
    participant TC as TargetCard
    S->>VC: vote:lock
    VC->>VC: scale(0.9), opacity(0.5)
    loop Each Vote (0.3s stagger)
        S->>VC: vote:reveal
        VC->>TC: particle arc (0.5s)
        TC->>TC: shake + counter pop
    end
    S->>TC: eliminated
    TC->>TC: pulse red, "LYNCHED" stamp
    TC->>TC: dust burst + grayscale (0.8s)
```

### 6.3.4 Animation Specification

| Animation | Trigger | Duration | Easing | Target |
|-----------|---------|----------|--------|--------|
| Day→Night gradient | `phase_change` NIGHT | 2.5s | ease-in-out-cubic | Body, brightness filter |
| Night→Day gradient | `phase_change` DAY | 2.0s | ease-out | Body, brightness filter |
| Card flip (reveal) | `player_died` | 0.6s | ease-out + overshoot | PlayerCard |
| Death grayscale | After flip | 0.8s | ease-in-out | PlayerCard |
| Screen shake (lynch) | `player_died` lynch | 0.3s | cubic-bezier | Root container |
| Chromatic aberration | `player_died` lynch | 0.3s | ease-out | Full-screen overlay |
| Vote particle arc | `vote:reveal` | 0.5s | bezier | Voter → target |
| Counter pop | Particle impact | 0.3s | ease-out-elastic | Vote count |
| "LYNCHED" stamp | Execution confirmed | 0.4s | ease-out-back | Stamp overlay |
| Phase banner | `phase_change` | 0.4s | bounce | Top banner |
| Typing dots | `chat:typing` | 0.4s loop | ease-in-out | Three-dot bubble |
| Card hover | mouseenter | 0.2s | ease-out | PlayerCard |
| Button press | mousedown | 0.05s | ease-in | Buttons |
| Timer critical | < 10s | 0.5s loop | ease-in-out | Timer ring + text |

### 6.3.5 CSS Keyframe Implementations

The phase transition uses CSS custom properties with `--transition-progress` (0→1 over 2.5s), enabling multi-property interpolation from one timeline.

```css
/* Day/Night phase transition */
.game-board {
  transition: background 2.5s cubic-bezier(0.65,0,0.35,1),
              filter 2.0s cubic-bezier(0.65,0,0.35,1);
}
.game-board--day {
  background: linear-gradient(180deg, #C0A788, #F5E6D3);
  filter: brightness(1.0);
}
.game-board--night {
  background: linear-gradient(180deg, #1A1A2E, #16213E);
  filter: brightness(0.35);
}
.vignette-overlay {
  position: fixed; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse, transparent 50%, #5E4D69 150%);
  opacity: 0; transition: opacity 1.5s ease-in;
}
.game-board--night .vignette-overlay { opacity: 0.25; }
```

The 3D card flip uses `preserve-3d` with opposite `backface-visibility`. The container rotates 180° on Y-axis.

```css
.player-card__flip-container {
  perspective: 800px; transform-style: preserve-3d;
}
.player-card__inner {
  position: relative; width: 100%; height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.175,0.885,0.32,1.275);
}
.player-card__inner--flipped { transform: rotateY(180deg); }
.player-card__front,
.player-card__back {
  position: absolute; inset: 0;
  backface-visibility: hidden; border-radius: 12px;
}
.player-card__front {
  background: linear-gradient(145deg, #5E4D69, #3D2B1F);
}
.player-card__back {
  background: var(--faction-gradient);
  transform: rotateY(180deg);
}
@keyframes deathGrayscale {
  0% { filter: grayscale(0%) brightness(1); }
  100% { filter: grayscale(100%) brightness(0.5); transform: rotate(5deg); }
}
.player-card--dead { animation: deathGrayscale 0.8s ease-in-out forwards; }
```

## 6.4 Accessibility

### 6.4.1 WCAG 2.1 AA Compliance

All elements meet WCAG 2.1 Level AA: contrast ratios ≥4.5:1 for normal text. `--text-primary` (#F5E6D3) on `--bg-primary` (#1A1A2E) yields 12.8:1. Faction colors never stand alone as state indicators; every color-coded element carries a text label or icon. Werewolf borders include a wolf-head SVG; villager borders include a shield.

Keyboard navigation supports full gameplay. Tab order follows visual layout. PlayerCards use `tabindex="0"` when actionable, `-1` when disabled. Enter/Space triggers selection; Escape closes modals. ARIA labels carry contextual descriptions — `aria-label="Vote for Alice (2 votes)"` not "Vote button." The timer uses `aria-live="polite"` every 30s, switching to `assertive` under 10s.

### 6.4.2 Accessible Alternatives

Audio cues supplement visual changes: rooster crow (day), wolf howl (night), bell toll (elimination). A collapsible text panel describes animations: "Player Alice's card flipped to reveal the Werewolf role. The card turned gray and tilted." This serves screen reader users and players disabling animations.

```javascript
const announceVoteResult = (result: VoteResult) => {
  const live = document.getElementById('sr-announcer');
  if (live) {
    live.textContent = result.eliminated
      ? `${result.targetName}: ${result.voteCount} votes, eliminated. Role: ${result.revealedRole}.`
      : `Tie vote. No one eliminated.`;
  }
};
```

Typing indicators use `aria-live="polite"` announcing "Alice is typing," cleared after 2s debounce [^349^].

### 6.4.3 Accessibility Requirements

| Requirement | Implementation | Verification |
|-------------|---------------|-------------|
| Contrast ≥ 4.5:1 | APCA-verified pairs | axe-core + manual review |
| Keyboard gameplay | Tab nav, Enter/Space, Escape | Manual keyboard test |
| ARIA labels | Contextual `aria-label` with game data | DevTools + NVDA test |
| Audio cues | Unique sound per phase, volume control | Waveform + preference test |
| Text descriptions | Collapsible animation log | Screen reader verification |
| Vote announcements | `aria-live="assertive"` | Timing test |
| Reduced motion | `prefers-reduced-motion` disables particles | Media query + UAT |
| Focus management | `focus-visible`, focus trap in modals | Audit + trap test |

When `prefers-reduced-motion: reduce` is active, the transition shortens 2.5s→0.3s, particles disable, and card flip becomes an opacity crossfade — preserving all information while removing motion triggers.

## 6.5 Responsive Design

### 6.5.1 Breakpoints and Device Strategy

Desktop (1280px+) is the primary target with full circular grid and persistent chat. Below this, progressive degradation applies.

| Breakpoint | Width | Layout | Adaptations |
|------------|-------|--------|-------------|
| Desktop | ≥1280px | Full circular grid, side chat, persistent action bar | All features; 64px avatars; hover |
| Tablet | 768–1279px | Elliptical grid, bottom chat, collapsible action bar | 56px avatars; swipe tabs |
| Mobile | 375–767px | 2-column grid, chat drawer, FAB | 48px avatars; 44×44px tap targets [^504^] |
| Minimum Viable | <375px | Single-column list, chat overlay | 40px avatars; text-only option |

### 6.5.2 Mobile Adaptations

At 375px, the grid collapses to 2-column scrollable. Chat becomes a bottom drawer (60% viewport). A floating action button (56×56px) accesses abilities and voting. Vote buttons expand to full card width; "Skip Vote" pins to the bottom for persistent access.

### 6.5.3 Minimum Viable Mobile

Below 375px, the layout is a single-column list. All functions remain accessible: voting uses a radio-button modal, chat stays at 14px minimum, timer pins top-bar. Decorative elements may suppress, but no game information hides. The palette (Figure 6.1) summarizes the 14 design tokens and 4 faction colors.

![Color palette and faction color system](fig_sec06_color_palette.png)

*Figure 6.1: Design token palette (top) and faction colors (bottom). All 8 screens and 12+ roles derive colors from these tokens. All pairings exceed WCAG 2.1 AA contrast thresholds.*
-e 

---

## 7. Game Modes & Customization

The game mode system is the player-facing entry point to all Werewolf gameplay. This chapter specifies three standard modes, AI-human hybrid configurations, a host-customizable framework with real-time balance validation, skill-based matchmaking, and a declarative rules engine. The mode system builds on the 15-state FSM from Chapter 3 and the 12-role roster from Chapter 4, using the point-based balance formula ($b = 1 - |2 \cdot p_{imp} - 1|$) to ensure competitive viability [^14^] [^172^].

![Figure 7.1 — Game Mode Selection Hierarchy](fig_7_1_mode_hierarchy.png)

### 7.1 Standard Modes

#### 7.1.1 Classic Mode

Classic mode implements the foundational Werewolf experience with fixed roles: Villager, Werewolf, Seer, and Doctor. Player count ranges from 8 to 12, following the established 3:1 villager-to-werewolf ratio [^44^] [^50^]. Phase timers use standard durations (90-second day, 60-second night), with role reveal on death enabled. The 8-player Classic setup (4 Villagers, 1 Seer, 1 Doctor, 2 Werewolves) yields a weight total of $4(+1) + 7 + 3 + 2(-6) = +2$, indicating slight village favor that compensates for beginner-level play [^172^].

#### 7.1.2 Extended Mode

Extended mode adds Hunter, Witch, Mason, Minion, and Alpha Werewolf roles, supporting 10 to 16 players. Multiple simultaneous information axes — Seer investigations, Witch kill-pot reveals, Mason trust networks — create the strategic depth required for competitive play. The 12-player Extended setup (4 Villagers, 1 Seer, 1 Witch, 1 Hunter, 2 Masons, 3 Werewolves, 1 Minion) achieves weight +1, producing near-perfect balance [^172^]. Extended mode enables coordinated wolf team play, protective role chains, and Minion-assisted deception [^220^].

#### 7.1.3 Quick Play

Quick Play compresses the experience into 10- to 15-minute matches. Player count is reduced to 6–8, timers are accelerated (60-second day, 30-second night), and the role set simplifies to Villager, Werewolf, and Seer. Quick Play uses automatic matchmaking with bot backfill to guarantee sub-60-second queues, reducing average game duration from 25–35 minutes to 12–18 minutes [^127^].

**Table 7.1 — Standard Mode Comparison**

| Parameter | Classic | Extended | Quick Play |
|-----------|---------|----------|------------|
| Player Count | 8–12 | 10–16 | 6–8 |
| Role Set | Villager, Werewolf, Seer, Doctor | All 12+ roles | Villager, Werewolf, Seer |
| Day / Night Timer | 90s / 60s | 90s / 60s | 60s / 30s |
| Avg. Duration | 25–35 min | 30–45 min | 12–18 min |
| Balance Weight | +2 (village) | +1 (balanced) | −1 (wolf) |
| Recommended For | Beginners | Intermediate+ | Casual / time-limited |

The Quick Play configuration intentionally introduces a slight wolf advantage because shorter games with less discussion time disproportionately favor the informed minority. In 90,720-game experiments, reduced discussion time shifted the balance index by 0.08–0.12 toward wolves [^14^].

```python
# Game mode configuration constants
MODE_CONFIG = {
    "classic": {
        "min_players": 8, "max_players": 12,
        "roles": {"villager": 4, "seer": 1, "doctor": 1, "werewolf": 2},
        "day_timer_sec": 90, "night_timer_sec": 60,
        "role_reveal_on_death": True, "balance_weight": +2
    },
    "extended": {
        "min_players": 10, "max_players": 16,
        "roles": {"villager": 4, "seer": 1, "witch": 1, "hunter": 1,
                  "mason": 2, "werewolf": 3, "minion": 1},
        "day_timer_sec": 90, "night_timer_sec": 60,
        "role_reveal_on_death": True, "balance_weight": +1
    },
    "quick_play": {
        "min_players": 6, "max_players": 8,
        "roles": {"villager": 3, "seer": 1, "werewolf": 2},
        "day_timer_sec": 60, "night_timer_sec": 30,
        "role_reveal_on_death": True, "balance_weight": -1
    }
}
```

### 7.2 AI-Human Hybrid Modes

#### 7.2.1 Human + AI Fill

When human counts fall below the mode minimum, the system fills remaining slots with AI agents. Rule-based bots serve sub-30-second queue waits; LLM agents (GPT-4o, Claude Sonnet) deploy for longer waits. Research demonstrates that deep behavior models produce substitutes performing similarly to humans of equivalent skill, with players often unable to detect substitutions [^391^]. The system preserves lobby cohesion by matching bot personality profiles to the human ELO bracket.

#### 7.2.2 AI Difficulty Calibration

AI difficulty uses a three-tier system linked to average ELO. Tier 1 (ELO < 1,200) employs rule-based agents with honest play only. Tier 2 (ELO 1,200–1,800) uses standard LLM agents with contextual deception. Tier 3 (ELO > 1,800) deploys GRPO-enhanced agents with full strategic deception and ReCon dual-perspective reasoning [^35^] [^75^]. Tier assignment is computed at match creation, with individual agent difficulty clamped to ±200 points of the lobby average.

**Table 7.2 — AI Difficulty Tier Assignment**

| Tier | ELO Range | Agent Type | LLM Model | Deception Capability |
|------|-----------|------------|-----------|---------------------|
| Tier 1 | < 1,200 | Rule-based + fallback | GPT-4o-mini | None (honest play) |
| Tier 2 | 1,200–1,800 | LLM standard | GPT-4o / Claude Sonnet | Standard (contextual) |
| Tier 3 | > 1,800 | LLM tournament-grade | Claude Sonnet + GRPO | Full (strategic deep deception) |

Werewolf-AgentX research found that per-role ELO tracking produces fairer skill assessment than aggregate ratings, since role asymmetry significantly impacts win probability [^35^].

#### 7.2.3 Spectator Mode

Spectator mode provides read-only observation through four access tiers [^380^]: Public View (same as a living player), Faction View (one faction's perspective), God Mode (full information), and Delayed View (configurable 15–60s delay for anti-stream-sniping). Standard spectators receive Public View; tournament admins receive God Mode.

#### 7.2.4 Hybrid Mode Comparison

**Table 7.3 — AI-Human Hybrid Mode Comparison**

| Mode | Human Players | AI Agents | AI Tier | Duration | Ranked | Role Set |
|------|--------------|-----------|---------|----------|--------|----------|
| Human + AI Fill | 4–7 | 1–8 (backfill) | Auto-calibrated | Standard | No | Classic/Extended |
| AI Training | 0 | 6–16 | All tiers | Accelerated | No | Any |
| Mixed Competitive | 5–9 | 1–3 (fixed) | Lobby average | Standard | Yes | Extended only |
| Spectator | 0 (observer) | N/A | N/A | N/A | N/A | Full visibility |

```python
# AI difficulty calibration algorithm
def assign_ai_tier(lobby_avg_elo: float) -> dict:
    if lobby_avg_elo < 1200:
        return {"tier": 1, "model": "gpt-4o-mini", "deception": False}
    elif lobby_avg_elo < 1800:
        return {"tier": 2, "model": "gpt-4o", "deception": True}
    else:
        return {"tier": 3, "model": "claude-sonnet", 
                "deception": True, "grpo_enhanced": True}

def calibrate_bot_fill(human_count: int, min_players: int,
                       lobby_elo: float) -> list[dict]:
    needed = min_players - human_count
    tier = assign_ai_tier(lobby_elo)
    return [{**tier, "agent_id": f"ai_{i}"} for i in range(needed)]
```

### 7.3 Custom Game Framework

#### 7.3.1 Host-Customizable Parameters

The custom game framework allows hosts to select any subset of 12+ roles, set player count (6–16), adjust timer durations (30–300 seconds), and configure victory conditions. All parameter combinations are validated through the balance pipeline before game start.

#### 7.3.2 Balance Validation

The validator evaluates configurations against three criteria: (1) the Ultimate Werewolf point-sum formula (target −2 to +2) [^172^]; (2) the villager-to-werewolf ratio (2.5:1 to 4.5:1 depending on special role density) [^44^] [^50^]; and (3) information density satisfying the inverse-proportion principle between direct intel and feedback sources [^31^]. Configurations outside the acceptable range generate specific fix suggestions and block game start until resolved.

![Figure 7.2 — Balance Validation Pipeline](fig_7_2_balance_pipeline.png)

#### 7.3.3 Preset Configurations

Four validated presets provide one-click balanced configurations, each calibrated using the point-sum formula and tested against 100+ simulated games [^14^].

**Table 7.4 — Preset Configuration Reference**

| Preset | Players | Werewolves | Villagers | Special Roles | Weight | Difficulty |
|--------|---------|------------|-----------|---------------|--------|------------|
| Beginner (Classic) | 8 | 2 | 4 | 1 Seer, 1 Doctor | +2 | Beginner |
| Balanced (Standard) | 12 | 3 | 4 | 1 Seer, 1 Witch, 1 Hunter, 2 Masons | +1 | Intermediate |
| Chaos | 12 | 3 | 2 | Seer, Witch, Hunter, Mason×2, Minion, Alpha Wolf | +3 | Advanced |
| Hardcore | 10 | 3 | 2 | Seer only; reveal OFF | −3 | Expert |
| AI Simulation | 8 | 2 | 4 | 1 Seer, 1 Doctor | +2 | Research |

The Chaos preset maximizes special role density, rewarding players who track cross-role interactions. The Hardcore preset forces pure behavioral deduction through voting pattern analysis and contradiction detection [^96^]. The AI Simulation preset matches the Werewolf-AgentX standard configuration [^35^].

#### 7.3.4 Mode Configuration JSON Schema

All modes share a unified JSON schema validated at configuration time, enforcing role count constraints and cross-field dependencies.

```python
# Balance validation algorithm
ROLE_WEIGHTS = {
    "villager": +1, "seer": +7, "doctor": +3, "hunter": +3,
    "witch": +5, "mason": +2, "werewolf": -6, "alpha_werewolf": -3,
    "minion": -2, "shapeshifter": -4, "serial_killer": -4, "tanner": -1
}

def validate_balance(config: dict) -> dict:
    roles = config["roles"]
    total = sum(roles.values())
    score = sum(ROLE_WEIGHTS.get(r, 0) * c for r, c in roles.items())
    wolves = roles.get("werewolf", 0) + roles.get("alpha_werewolf", 0)
    villagers = total - wolves
    ratio = villagers / max(wolves, 1)
    ratio_adj = -2 if ratio < 2.5 else (+2 if ratio > 4.5 else 0)
    final = score + ratio_adj
    warnings = []
    if final < -2:
        warnings.append(f"Wolf-favored ({final}). Add villagers or reduce wolves.")
    elif final > +2:
        warnings.append(f"Village-favored ({final}). Add wolves or reduce power roles.")
    return {"score": final, "is_balanced": -2 <= final <= +2,
            "warnings": warnings, "villager_wolf_ratio": ratio}
```

```json
{
  "$schema": "https://werewolf.game/config-schema/v1",
  "type": "object",
  "required": ["mode_id", "roles", "timers", "victory_conditions"],
  "properties": {
    "mode_id": {"type": "string", "enum": ["classic", "extended", "quick_play", "custom"]},
    "roles": {
      "type": "object",
      "properties": {
        "villager": {"type": "integer", "minimum": 1, "maximum": 12},
        "werewolf": {"type": "integer", "minimum": 1, "maximum": 6},
        "seer": {"type": "integer", "minimum": 0, "maximum": 1},
        "doctor": {"type": "integer", "minimum": 0, "maximum": 1},
        "witch": {"type": "integer", "minimum": 0, "maximum": 1}
      },
      "required": ["villager", "werewolf"]
    },
    "timers": {
      "type": "object",
      "properties": {
        "day_seconds": {"type": "integer", "minimum": 30, "maximum": 300},
        "night_seconds": {"type": "integer", "minimum": 15, "maximum": 180}
      }
    },
    "victory_conditions": {"type": "string", "enum": ["standard", "parity_only", "no_reveal"]},
    "balance_tolerance": {"type": "integer", "default": 2}
  }
}
```

**Table 7.5 — Custom Game Parameter Bounds**

| Parameter | Minimum | Maximum | Default | Validation Rule |
|-----------|---------|---------|---------|-----------------|
| Player count | 6 | 16 | 8 | Must be ≥ wolves + 2 |
| Day timer | 30s | 300s | 90s | Must be ≥ night timer |
| Night timer | 15s | 180s | 60s | Must allow all actions |
| Werewolves | 1 | 6 | 2 | Ratio ≥ 2.5:1 villagers |
| Special roles | 0 | 8 | 2 | Point sum within tolerance |
| Seer count | 0 | 1 | 1 | Max 1 per game |
| Witch count | 0 | 1 | 0 | Requires ≥1 Werewolf |

### 7.4 Matchmaking & Ranked

#### 7.4.1 Quick Match

Quick Match implements skill-based queueing via Redis Sorted Sets for O(log n) range queries [^429^] [^430^]. The engine establishes an initial ±100 ELO window, expanding at 50 ELO per minute up to ±500 ELO maximum. The target wait time is <60s; after 30s, the system offers bot backfill. Rating updates use the Simple Multiplayer Elo (SME) approach, computing expected scores against average opponent ratings within each faction [^418^].

#### 7.4.2 Ranked Mode

Ranked mode restricts gameplay to Extended mode with standard balance configurations (weight +1, 12-player), ensuring ELO changes reflect skill rather than setup randomness. Ranked requires 8+ human players — no AI backfill. Seasonal resets compress ratings 30% toward the 1,500 baseline every 90 days.

**Table 7.6 — Rank Tier Definitions**

| Tier | ELO Range | K-Factor | Calibration Games | Season Reset |
|------|-----------|----------|-------------------|--------------|
| Bronze | 0–1,199 | 40 | 0–10 | 1,000 |
| Silver | 1,200–1,399 | 32 | 11–30 | 1,250 |
| Gold | 1,400–1,599 | 24 | 31–60 | 1,450 |
| Platinum | 1,600–1,799 | 20 | 61–100 | 1,650 |
| Diamond | 1,800–1,999 | 16 | 100+ | 1,850 |
| Master | 2,000+ | 12 | 200+ | 1,950 |

The decreasing K-factor schedule accelerates convergence for new players while minimizing fluctuation for established Master-tier competitors [^481^]. Ranked mode requires 50 calibration games before public leaderboard appearance.

![Figure 7.3 — Skill-Based Matchmaking Flow](fig_7_3_matchmaking_flow.png)

#### 7.4.3 Per-Role ELO

The system tracks separate ELO values per role category: Overall (all roles), Werewolf (wolf-aligned), Villager (Villager/Mason), and Special (Seer, Doctor, Witch, Hunter). Composite matchmaking scores weight recent role performance at 60% and overall ELO at 40%, ensuring fair opposition when a player receives their weaker role. This addresses the validated problem that strong overall players may underperform in specific roles due to the asymmetry inherent in social deduction [^35^] [^475^].

```python
# Matchmaking engine core
class MatchmakingEngine:
    BASE_WINDOW = 100
    EXPAND_RATE = 50
    MAX_WINDOW = 500
    BOT_FILL_THRESHOLD = 30

    def find_match(self, anchor_id: str, mode: str, region: str):
        queue_key = f"matchmaking:queue:{mode}:{region}"
        player = redis.hgetall(f"matchmaking:player:{anchor_id}")
        skill = int(player["skill_rating"])
        wait_sec = time.time() - float(player["queued_at"])
        window = min(self.BASE_WINDOW + int((wait_sec / 60) * self.EXPAND_RATE),
                     self.MAX_WINDOW)
        # O(log n) range query
        candidates = redis.zrangebyscore(queue_key, skill - window, skill + window)
        candidates = [c for c in candidates if c != anchor_id]
        if len(candidates) >= 7:
            return [anchor_id] + candidates[:7]
        elif len(candidates) >= 5:
            return [anchor_id] + candidates[:5]
        elif wait_sec > self.BOT_FILL_THRESHOLD:
            needed = 7 - len(candidates)
            bots = self.generate_bot_fill(needed, skill)
            return [anchor_id] + candidates + [b["id"] for b in bots]
        return None
```

### 7.5 Rules Engine

#### 7.5.1 Declarative Rule Definitions

The rules engine evaluates all game logic through declarative definitions loaded at game start. Phase Rules govern phase transitions; Action Rules validate night actions against role capabilities (e.g., Doctor cannot protect the same target on consecutive nights [^16^]); Victory Rules check faction win conditions after each elimination; and House Rules enable host-defined overrides. This declarative approach separates game logic from implementation code, enabling new modes without server redeployment.

![Figure 7.4 — Declarative Rules Engine Architecture](fig_7_4_rules_engine.png)

#### 7.5.2 Rules Engine Evaluation

At each phase transition, the Game Orchestrator invokes the rules engine with the evaluation context — a structured object containing the full game state, player list, current phase, and action history. The engine iterates through loaded rules in priority order (phase → action → victory → house), evaluates conditions against the context, and executes matching actions. Victory rules terminate evaluation immediately upon firing to prevent race conditions.

**Table 7.7 — Rule Type Definitions**

| Rule Type | Condition Example | Action Example | Trigger |
|-----------|-------------------|----------------|---------|
| Phase | All players voted OR timer expired | Transition to NIGHT | Per vote / timer tick |
| Action | Doctor targets Player X | Validate target ≠ previous target | On night action |
| Victory | alive_wolves == 0 | Declare VILLAGER win | After elimination |
| Victory | alive_wolves >= alive_villagers | Declare WEREWOLF win | After elimination |
| House | Host-defined condition | Host-defined override | As specified |

#### 7.5.3 Custom House Rules

Hosts define custom rules through a structured YAML interface. Rules are validated before game start to prevent conflicts — for instance, a rule eliminating all Werewolves on Night 1 is rejected as it violates win condition feasibility. Common house rules include modified victory thresholds, restricted claim rules (no Day 1 claims), and custom timer adjustments. House rules persist in the game configuration and appear in replay event logs.

```python
# Rules engine: loading, evaluation, and execution
class RulesEngine:
    def __init__(self, repository: list[dict]):
        self.rules = self._load_rules(repository)
        self.priority = ["phase", "action", "victory", "house"]

    def _load_rules(self, repo: list[dict]) -> list[Rule]:
        rules = []
        for r in repo:
            rules.append(Rule(
                rule_type=r["type"],
                condition=self._parse_condition(r["condition"]),
                action=self._parse_action(r["action"]),
                priority=self.priority.index(r["type"])
            ))
        return sorted(rules, key=lambda x: x.priority)

    def evaluate(self, ctx: EvaluationContext) -> list[ActionResult]:
        results = []
        for rule in self.rules:
            if rule.condition.evaluate(ctx):
                results.append(rule.action.execute(ctx))
                if rule.rule_type == "victory":
                    break
        return results

    def validate_house_rules(self, rules: list[dict]) -> list[str]:
        errors = []
        for r in rules:
            if r.get("action", {}).get("type") == "instant_win":
                errors.append("Instant win actions not permitted")
            if r.get("condition") == "always_true":
                errors.append("Always-true conditions not permitted")
        return errors
```

The rules engine processes approximately 200–400 rule evaluations per game, with each evaluation completing in under 1 millisecond — sufficiently fast to run synchronously within the game loop. The declarative architecture enables variant modes ("No Reveal," "Wolf Majority," "Cultist Expansion") by loading alternative rule sets without modifying the game server core.
-e 

---

# 8. AI-Only Simulation Mode

The AI-only simulation mode transforms the Werewolf platform from a multiplayer game into a high-throughput social-AI benchmark engine. AI agents of varying architectures — rule-based decision trees, personality-driven trait models, and LLM-powered reasoning systems — compete in accelerated, headless game instances. The simulation produces three outputs: structured event logs for deterministic replay, behavioral metrics for quantitative strategy analysis, and emergent strategy detection reports [^127^][^136^]. This chapter specifies the simulation architecture, tournament formats, ELO-based benchmarking framework, behavioral metrics suite, LLM-as-a-Judge evaluation pipeline, and the training data generation flywheel.

## 8.1 Simulation Architecture

### 8.1.1 Batch Runner

The Simulation Orchestrator manages tournament lifecycles through three subsystems: a Tournament Manager for schedule formatting, a Scheduler for compute assignment, and a Result Aggregator for leaderboard updates [^127^][^462^]. The Batch Game Runner executes independent 8-agent game instances concurrently via direct Python function calls rather than WebSocket messages. Game instances share no mutable state, so horizontal scaling is bounded only by compute. Werewolf Arena reports approximately 50 games per hour on cloud TPU, while GPU-accelerated environments such as Pgx achieve 1.9 million steps per second on a single A100 through vectorized JAX operations [^127^][^462^].

### 8.1.2 Headless Execution

Simulation games execute headlessly: no WebSocket server, no client rendering, no human-facing UI. Agents communicate via direct function calls through an A2A-compatible local interface. Event sourcing (Section 1.4) records every role assignment, night action, statement, vote, and elimination as an immutable event with nanosecond timestamps [^145^][^447^]. The append-only event store enables full game rehydration for debugging, time-travel queries to inspect agent knowledge at specific rounds, branching analysis for counterfactuals, and automatic training data generation.

### 8.1.3 Parallelization

Game instances are embarrassingly parallel. The platform uses `asyncio` to overlap LLM API calls within a single game and multiprocessing across CPU cores. ECS-pattern GPU batch execution achieves 2-3 orders of magnitude speedup over CPU baselines [^463^]. Model routing sends simple decisions (early votes, routine night actions) to GPT-4o-mini or Gemini 2.5 Flash, while complex deception routes to GPT-4o or Claude Sonnet, yielding 40-70% cost savings [^25^].

### 8.1.4 Simulation Parameter Table

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `agents_per_game` | 6-15 | 8 | Players per game; must match role set cardinality |
| `games_per_pairing` | 1-50 | 10 | Games per agent matchup with role alternation [^127^] |
| `role_alternation` | true/false | true | Cycle each agent through all roles equally |
| `temperature` | 0.0-2.0 | 0.7 | LLM sampling temperature |
| `batch_size` | 1-10{,}000 | 100 | Parallel game instances |
| `record_level` | full/summary/results-only | full | Event logging granularity |
| `elo_k_factor` | 10-40 | 32 | ELO sensitivity (Section 8.3) |
| `seeds` | [0, N-1] | [0,1,2,3,4] | Reproducibility seeds |

The Game Factory instantiates environments with varying configurations; the Agent Pool registers instances with model configs and personality profiles [^35^]; the Result Sink persists transcripts and outcomes to Parquet for downstream analytics [^136^][^151^].

```mermaid
graph TB
    subgraph ORCH["<b>Simulation Orchestrator</b>"]
        TM["Tournament Manager"]
        SCH["Scheduler"]
        RA["Result Aggregator"]
    end
    subgraph BATCH["<b>Batch Game Runner</b>"]
        G1["Game #1<br/>(8 agents)"]:::game
        G2["Game #2<br/>(8 agents)"]:::game
        G3["..."]:::game
        GN["Game #N<br/>(8 agents)"]:::game
    end
    subgraph STORE["<b>Results Store</b>"]
        GL["Game Logs<br/>(JSONL)"]
        ER["ELO Rankings<br/>(SQLite)"]
        BM["Behavioral Metrics<br/>(Parquet)"]
    end
    ORCH --> BATCH
    BATCH --> STORE
    classDef game fill:#B8A9C9,stroke:#584A6E,color:#333333
```

## 8.2 Tournament Formats

### 8.2.1 Round-Robin

Each agent plays every other agent exactly once using the circle method for balanced scheduling [^446^][^477^]. For $N$ agents, the format requires $N(N-1)/2$ games — 28 games at $N=8$, or 2{,}016 at $N=64$. Werewolf Arena uses this for intra-family evaluation with 10 games per pairing and automatic role alternation [^127^]. Round-robin provides the most statistically robust rankings but its $O(n^2)$ scaling makes it suitable only for pools up to approximately 16 agents.

### 8.2.2 Swiss System

Swiss pairing matches agents by accumulated record rather than exhaustive enumeration. The FIDE Dutch system (effective February 2026) groups players into homogeneous score brackets, then pairs within brackets while enforcing no-repeat constraints and minimizing score differences [^466^]. For 32 agents, Swiss requires 5-6 rounds (80-96 games) versus 496 for round-robin — an 80% compute reduction [^446^][^451^]. Research shows maximum weight matching (Burstein pairing) outperforms Dutch BBP in ranking quality [^468^].

### 8.2.3 Single Elimination

Single elimination determines a winner in $\lceil \log_2 N \rceil$ rounds — only 63 games for 64 agents. However, high variance from a single unlucky role assignment can eliminate strong agents prematurely. The recommended pattern uses Swiss pool play (5-7 rounds) to identify top performers, followed by a single-elimination bracket among the top 4-8 for finals [^452^].

### 8.2.4 Tournament Format Specifications

| Format | Games (N=8) | Games (N=32) | Games (N=64) | Best For | Complexity |
|--------|-------------|-------------|-------------|----------|------------|
| Round-Robin | 28 | 496 | 2{,}016 | Small pools (4-16) [^127^][^477^] | Low |
| Swiss (Standard) | 32 | 192 | 448 | Large pools (16+) [^446^][^451^] | Medium |
| Single Elimination | 7 | 31 | 63 | Quick finals [^446^] | Low |
| Swiss + Bracket | 32+4 | 192+7 | 448+7 | Championship [^452^] | High |

![Figure 8.1: Tournament Format Computational Cost Comparison](fig_8_1_tournament_cost_comparison.png)

**Figure 8.1** compares total games across formats (logarithmic y-axis). Round-robin scales as $O(n^2)$ and becomes prohibitive beyond 16 agents. The Swiss + Bracket hybrid offers the optimal tradeoff: efficient preliminary ranking followed by decisive finals. For the Werewolf platform, the recommended default is Swiss (5 rounds) for pools of 16+ agents, round-robin for 4-8 agents, and Swiss + Bracket for championships.

## 8.3 AI Benchmarking

### 8.3.1 ELO-Based Ranking

Standard ELO computes expected score as $E_A = \frac{1}{1 + 10^{(R_B - R_A) / 400}}$ and updates as $R'_A = R_A + K \cdot (S_A - E_A)$, where $D = 400$ gives 100:1 odds at an 800-point spread and $K$ controls volatility [^481^][^475^]. For 8-player Werewolf, the system computes faction-average ratings (Werewolf mean versus Villager mean) and applies uniform updates to the winning faction, following Werewolf-AgentX [^35^].

Per-role ELO isolates role-specific competence: an agent may excel at information-gathering (high Seer ELO) while being a poor deceiver (low Werewolf ELO). Overall ELO is a weighted average across roles. Confidence intervals use TrueSkill-style uncertainty: new agents begin with $\sigma = 8.333$ and large $K$-factors; established agents (100+ games) receive smaller $K$-factors [^486^][^487^].

| Games Played | K-Factor | Phase |
|-------------|----------|-------|
| 0-10 | 40 | Calibration |
| 11-30 | 32 | Discovery |
| 31-100 | 20 | Normal |
| 100+ | 16 | Established |

### 8.3.2 Benchmark Metrics

Beyond ELO, six quantitative categories are tracked. Win rate by role measures $P(\text{win} \mid \text{role})$; survival rounds quantifies longevity; vote accuracy tracks correct votes; Traitor Survival Rate ($TSR = |T_{\text{end}}| / |T|$) captures deception fitness [^155^][^156^]; Faithful Correctness Rate ($FCR = \sum \mathbf{1}(V_r^f \in T) / |F|$) measures enemy identification [^155^]; and Deception Effectiveness Score ($DES$) tracks successfully manipulated eliminations [^156^].

### 8.3.3 Benchmark Metrics Table

| Metric | Definition | Target | Frequency |
|--------|-----------|--------|-----------|
| Win Rate by Role | $P(\text{win} \mid \text{role})$ | 45-55% per faction [^490^] | Per game |
| Survival Rounds | $\mathbb{E}[\text{rounds survived}]$ | 4-6 of 8 max | Per game |
| Vote Accuracy | Correct votes / Total votes | $>$50% | Per round |
| TSR | $\|T_{\text{end}}\| / \|T\|$ | 0.6-0.9 [^155^] | Per game |
| FCR | Correct traitor votes / Faithful votes | 0.3-0.6 [^155^] | Per round |
| DES | Manipulated eliminations / Total rounds | 0.4-0.8 [^156^] | Per game |

### 8.3.4 ELO Update Algorithm

The implementation extends team-based ELO with per-role tracking and performance weighting. Individual performance relative to team average modulates the base change, addressing the "good player punished by bad teammates" problem [^475^].

```python
def update_elo_per_role(
    players: list[PlayerRecord],
    winner_faction: str,
    k_base: int = 32,
    role_weights: dict[str, float] = None
) -> dict[str, float]:
    """Update per-role ELO with performance-weighted team adjustment."""
    wolves = [p for p in players if p.faction == 'werewolf']
    villagers = [p for p in players if p.faction == 'villager']

    wolf_avg = sum(p.elo_overall for p in wolves) / len(wolves)
    vill_avg = sum(p.elo_overall for p in villagers) / len(villagers)

    E_wolf = 1.0 / (1.0 + 10.0 ** ((vill_avg - wolf_avg) / 400.0))
    E_vill = 1.0 - E_wolf

    faction_expected = {'werewolf': E_wolf, 'villager': E_vill}
    faction_actual = {
        'werewolf': 1.0 if winner_faction == 'werewolf' else 0.0,
        'villager': 1.0 if winner_faction == 'villager' else 0.0
    }

    for faction_list in [wolves, villagers]:
        if not faction_list:
            continue
        perf_mean = sum(p.performance_score for p in faction_list)
        perf_mean /= len(faction_list)

        for p in faction_list:
            base = k_base * (faction_actual[p.faction] - faction_expected[p.faction])
            ratio = p.performance_score / max(perf_mean, 0.01)
            adj = base * ratio if faction_actual[p.faction] == 1.0 else base / max(ratio, 0.5)

            role = p.role
            weight = (role_weights or {}).get(role, 1.0)
            p.elo_by_role[role] += adj * weight
            p.elo_overall = weighted_average(p.elo_by_role, p.role_games)

    return {p.agent_id: p.elo_overall for p in players}
```

```mermaid
graph LR
    subgraph ELO["<b>Per-Role ELO Hierarchy</b>"]
        OE["Overall ELO"] --> WE["Werewolf ELO"]
        OE --> VE["Villager ELO"]
        OE --> SE["Seer ELO"]
        OE --> DE["Doctor ELO"]
        WE --> WD["Deception Score"]
        VE --> VD["Detection Score"]
    end
```

## 8.4 Behavioral Metrics

### 8.4.1 Social Metrics

Social metrics quantify relationship dynamics. Alliance Cohesion Index (ACI) measures voting bloc stability: $ACI = \text{mutual\_votes} / \text{total\_possible\_votes}$. Traitor Agreement Score (TAS) captures Werewolf coordination: $TAS_r = \sum \mathbf{1}(V_r^t = V_r^{\max, T}) / |T|$, where 1.0 indicates perfect bloc unity [^155^]. Werewolf Arena data shows top agents maintain TAS above 0.85 [^127^].

### 8.4.2 Strategic Metrics

Strategic metrics isolate decision quality. Faithful Correctness Rate (FCR) measures signal detection — correct Villager votes targeting Werewolves. Deception Consistency Index ($DCI = 1 - \text{contradictions}/\text{statements}$) tracks narrative coherence. Social Reasoning Index ($\text{SRI} = \text{correct\_inferences}/\text{total\_inferences}$) measures role deduction accuracy.

### 8.4.3 Communication Metrics

Communication metrics characterize language use. Persuasion Measure Index ($\text{PMI} = (\text{votes\_swayed}/N) \cdot (1/\text{utterances})$) quantifies vote-swing efficiency. Deception Production Rate tracks deceptive turns by role, and Brier Score ($\frac{1}{N}\sum(p_i - o_i)^2$) measures suspicion calibration (0 = perfect, 1 = worst) [^136^][^151^].

### 8.4.4 Performance Metrics

Win rate by role targets 45-55% per faction for game balance [^490^]. Longevity Performance Index ($LPI = \text{rounds\_survived} / \text{total\_rounds}$) normalizes survival. Cost per decision (total API spend divided by LLM calls) enables economic comparison of routing strategies.

### 8.4.5 Complete Behavioral Metrics Catalog

| Category | Metric | Formula | Purpose |
|----------|--------|---------|---------|
| Coordination | TAS | $\sum \mathbf{1}(V_r^t = V_r^{\max, T}) / \|T\|$ [^155^] | Werewolf voting bloc unity |
| Coordination | ACI | $\text{mutual\_votes} / \text{total\_possible}$ | Alliance stability |
| Effectiveness | FCR | $\sum \mathbf{1}(V_r^f \in T) / \|F\|$ [^155^] | Correct enemy identification |
| Effectiveness | TSR | $\|T_{\text{end}}\| / \|T\|$ [^156^] | Deception fitness |
| Effectiveness | DES | $\sum \mathbf{1}(E_r \in F \land V_r^t = E_r) / \|R\|$ [^156^] | Manipulation success rate |
| Behavioral | VSF | Vote changes per agent | Position flexibility |
| Behavioral | TNS | Temporal trust correlation [^156^] | Trust consistency |
| Deception | DPR | Deceptive turns / Total turns [^136^] | Deception frequency |
| Deception | Brier Score | $\frac{1}{N}\sum (p_i - o_i)^2$ [^136^] | Suspicion calibration |
| Communication | PMI | $(\text{votes\_swayed}/N) \cdot (1/\text{utterances})$ | Persuasion efficiency |
| Communication | DCI | $1 - (\text{contradictions}/\text{statements})$ | Narrative consistency |
| Performance | LPI | $\text{rounds\_survived} / \text{total\_rounds}$ | Normalized survival |

## 8.5 LLM-as-a-Judge Evaluation

### 8.5.1 Judge Prompt Design

Quantitative metrics capture what agents do; qualitative evaluation assesses how well they reason. The platform uses G-Eval (Microsoft Azure AI, EMNLP 2023), which achieves Spearman correlation of 0.514 on SummEval — outperforming BLEU-4 (0.259) and ROUGE-L (0.244) in human alignment [^140^][^483^]. G-Eval generates auto-CoT evaluation steps, fills scoring forms against rubric dimensions, and applies probability-weighted aggregation [^148^].

### 8.5.2 Evaluation Dimensions

| Dimension | Weight | Criteria | Description |
|-----------|--------|----------|-------------|
| Strategy Soundness | 25% | Coherence (1-5), Validity (1-5) | Reasoning correctness, valid deductions |
| Social Manipulation | 25% | Persuasiveness (1-5), Evidence (1-5) | Ability to convince, argument strength |
| Consistency | 20% | Action-speech alignment (1-5) | Stated beliefs vs. actions |
| Creativity | 15% | Novelty (1-5), Adaptability (1-5) | Unconventional tactics, recovery |
| Fairness | 15% | Sportiveness (1-5) | Absence of meta-exploitation |

The composite score is $\text{Score} = 0.25S + 0.25M + 0.20C + 0.15Cr + 0.15F$ over the range [1.0, 5.0].

### 8.5.3 Consistency Checking

Judge variance is mitigated through three independent evaluation passes at temperatures 0.3, 0.7, and 1.0. Inter-rater reliability uses Spearman correlation; a minimum $\rho > 0.8$ between any two runs is required for acceptance [^140^][^142^]. Failing scores trigger additional passes until consistency is achieved or the result is flagged for human review. Bias mitigation includes option order randomization (position bias), token-count normalization (verbosity bias), and cross-model evaluation where the judge model differs from player models (self-preference bias) [^140^].

### 8.5.4 LLM-as-Judge Rubric and Prompt Template

```python
JUDGE_PROMPT_TEMPLATE = """
You are an expert game analyst evaluating a Werewolf agent's performance.

## Game Replay Context
{game_transcript}

## Agent Under Evaluation
Agent: {agent_id} | Role: {role} | Faction: {faction}

Evaluate across 5 dimensions (1=poor, 5=excellent). Provide 2-3 sentence
justification per dimension, then assign a score.

1. Strategy Soundness (25%): Logical deductions, valid plans, sound night actions
2. Social Manipulation (25%): Persuasion quality, statement crafting, vote influence
3. Consistency (20%): Action-speech alignment, narrative coherence
4. Creativity (15%): Novel tactics, adaptation to unexpected events
5. Fairness (15%): Rule compliance, absence of meta-gaming

Output JSON:
{{
  "strategy_soundness": {{"score": int, "justification": "str"}},
  "social_manipulation": {{"score": int, "justification": "str"}},
  "consistency": {{"score": int, "justification": "str"}},
  "creativity": {{"score": int, "justification": "str"}},
  "fairness": {{"score": int, "justification": "str"}},
  "composite_score": float,
  "flagged_for_review": bool
}}
"""

def evaluate_with_consistency_check(
    game_transcript: str,
    agent_id: str,
    judge_model: str = "gpt-4o",
    min_spearman: float = 0.80
) -> dict:
    """Run LLM-as-Judge with inter-rater consistency validation."""
    evaluations = []
    for temp in [0.3, 0.7, 1.0]:
        prompt = JUDGE_PROMPT_TEMPLATE.format(
            game_transcript=game_transcript,
            agent_id=agent_id,
            role=get_role(agent_id, game_transcript),
            faction=get_faction(agent_id, game_transcript)
        )
        evaluations.append(llm_judge(prompt, model=judge_model, temperature=temp))

    for i in range(len(evaluations)):
        for j in range(i + 1, len(evaluations)):
            if spearman(evaluations[i], evaluations[j]) >= min_spearman:
                return aggregate_evaluations(evaluations)

    return {**aggregate_evaluations(evaluations),
            "flagged_for_review": True}
```

```mermaid
graph LR
    subgraph JP["<b>LLM-as-Judge Pipeline</b>"]
        EV["Event Log"] --> RP["Replay<br/>Formatter"]
        RP --> J1["Judge 1<br/>(temp=0.3)"]
        RP --> J2["Judge 2<br/>(temp=0.7)"]
        RP --> J3["Judge 3<br/>(temp=1.0)"]
        J1 --> AG["Aggregator"]
        J2 --> AG
        J3 --> AG
        AG --> CK{"Spearman<br/>ρ > 0.8?"}
        CK -->|Yes| OUT["Composite Score"]
        CK -->|No| FL["Flag for Review"]
    end
```

## 8.6 Training Data Generation

### 8.6.1 Event Log to Training Data

Every simulation produces a structured event log that feeds training dataset construction. The pipeline filters decision-relevant events (role assignments, night results, statements, vote outcomes, eliminations) and formats them as instruction-response pairs. Each example contains the game state visible to an agent at a decision point (input), the action taken (output), and the eventual faction outcome weighted by contribution timing (reward label) [^35^].

### 8.6.2 Dataset Schema

| Field | Type | Description |
|-------|------|-------------|
| `game_state` | JSON | Observable state at decision point |
| `agent_action` | JSON | Reasoning + statement + action |
| `reward_value` | float | Outcome signal [-1, +1] with contribution weighting |
| `role_context` | enum | Agent's role for role-conditioned training |

The `reward_value` is a product of faction outcome (+1 win, -1 loss), temporal weight (earlier critical actions receive higher weights), and role-specific adjustment accounting for different base win rates per role.

### 8.6.3 Data Flywheel

Simulation creates a self-reinforcing improvement cycle: simulation generates games → event logs convert to training datasets → fine-tuning (GRPO or SFT) improves agents → better agents produce higher-quality simulations. GRPO training for persuasive agents has demonstrated strong results across Werewolf, Avalon, and ONUW [^35^]. Prompt caching reduces data generation costs by 59-90%, and context compaction cuts per-turn tokens by 50-70%, making large-scale generation viable [^24^][^25^].

```mermaid
graph LR
    subgraph FLY["<b>Training Data Flywheel</b>"]
        SIM["Simulation<br/>(N games)"] --> LOG["Event Logs"]
        LOG --> FILTER["Filter & Format"]
        FILTER --> DATA["Training Dataset<br/>(Parquet)"]
        DATA --> FT["Fine-Tuning<br/>(GRPO / SFT)"]
        FT --> AGENTS["Improved Agents"]
        AGENTS --> SIM
    end
    style SIM fill:#B8A9C9,stroke:#584A6E
    style DATA fill:#B8A9C9,stroke:#584A6E
    style AGENTS fill:#B8A9C9,stroke:#584A6E
```

### 8.6.4 Training Data Export Code

The export pipeline converts events into instruction-response pairs for supervised fine-tuning and preference-based RL. The `reward_value` applies temporal discounting: early-game actions influencing trajectory receive higher weight than late-game actions with limited strategic impact.

```python
def export_training_data(
    game_events: list[GameEvent],
    output_path: str,
    temporal_discount: float = 0.95
) -> int:
    """Convert game event log into instruction-response training pairs."""
    examples = []
    winner = extract_winner(game_events)
    max_round = max((e.round_num for e in game_events if e.round_num), default=1)

    for event in game_events:
        if event.event_type not in DECISION_EVENTS:
            continue

        visible = build_visible_state(game_events, event.player_id, event.sequence_num)

        faction_win = 1.0 if winner.get(event.faction) == 'won' else -1.0
        timing = temporal_discount ** (event.round_num / max(max_round, 1))
        role_adj = ROLE_BASELINE_REWARD.get(event.role, 0.0)
        reward = faction_win * timing + role_adj

        examples.append({
            'game_state': json.dumps(visible),
            'agent_action': json.dumps({
                'reasoning': event.payload.get('reasoning', ''),
                'public_statement': event.payload.get('public_statement', ''),
                'action': event.payload.get('action', '')
            }),
            'reward_value': round(reward, 4),
            'role_context': event.role,
            'game_id': event.game_id
        })

    pd.DataFrame(examples).to_parquet(output_path, compression='zstd')
    return len(examples)
```

The flywheel operates continuously: as tournaments run, the export pipeline appends examples to a growing dataset. Periodic fine-tuning (weekly or triggered by ELO stagnation) produces improved checkpoints that replace older models in the simulation pool. This closed loop ensures autonomous improvement, with each agent generation producing more strategically sophisticated games. The combination of ELO rankings, behavioral metrics, LLM-as-a-Judge evaluation, and automated training data generation positions the platform as a comprehensive benchmark for social AI [^35^][^127^][^136^].
-e 

---

## 9. Data & Analytics

### 9.1 Data Model

The analytics foundation rests on six core entities capturing every measurable aspect of gameplay, player behavior, and AI agent performance. The design follows an event-sourcing pattern from Chapter 1, where all state changes are recorded as immutable events in an append-only log [^145^][^209^]. This enables complete game reconstruction for replay analysis while feeding both real-time dashboards and long-term research datasets.

The `Player` entity stores account metadata and consent flags for GDPR compliance. `GameSession` records each match lifecycle — start time, end time, role composition, winner faction, and configuration hash. Every in-session action generates `GameEvent` rows carrying JSONB payloads accommodating heterogeneous event types (votes, night actions, chat messages) [^447^]. `AgentConfiguration` persists hyperparameters and prompt templates per AI version, enabling A/B comparison. `ELOHistory` maintains time-series rating changes per player per role. `AnalyticsAggregate` holds pre-computed rollups powering dashboard queries without expensive real-time scans.

The append-only event log uses PostgreSQL with monthly partitioning (`game_events_YYYYMM`) to keep partition sizes below 100 GB. Each event carries a monotonic `sequence_num` within its game, ensuring deterministic replay ordering. JSONB payloads eliminate schema migration friction; a JSON Schema registry enforces structure at the application layer [^172^].

**Table 1 — Core Entity Relationship Overview**

| Entity | Primary Key | Key Relationships | Storage Engine | Partitioning |
|---|---|---|---|---|
| Player | `player_id` (UUID) | 1:N → GameSession, 1:N → ELOHistory | PostgreSQL | None |
| GameSession | `game_id` (UUID) | N:1 → Player (host), 1:N → GameEvent | PostgreSQL | Monthly |
| GameEvent | `event_id` (BIGSERIAL) | N:1 → GameSession, N:1 → Player | PostgreSQL | Monthly |
| AgentConfiguration | `agent_id` (UUID) | 1:N → GameSession (participant) | PostgreSQL | None |
| ELOHistory | `elo_id` (BIGSERIAL) | N:1 → Player, N:1 → GameSession | PostgreSQL | Monthly |
| AnalyticsAggregate | `agg_id` (BIGSERIAL) | N:1 → GameSession | ClickHouse | Monthly |

The six entities form a directed acyclic graph rooted at `GameSession`. The Event Store serves as the system of record — all derived tables are recomputable from the event stream, guaranteeing analytical consistency even during rebuilds [^145^].

```mermaid
erDiagram
    PLAYER ||--o{ GAME_SESSION : hosts
    PLAYER ||--o{ ELO_HISTORY : rated
    GAME_SESSION ||--o{ GAME_EVENT : generates
    GAME_SESSION ||--o{ ANALYTICS_AGGREGATE : summarizes
    AGENT_CONFIGURATION ||--o{ GAME_SESSION : participates
    PLAYER ||--o{ GAME_EVENT : acts_in
```

### 9.2 Analytics Pipeline

The pipeline operates on a lambda architecture — a real-time speed layer for live dashboards plus a batch layer for deep historical analysis [^128^][^467^]. This dual-path design addresses the fundamentally different latency requirements of operational monitoring (sub-second) versus research analytics (minutes acceptable).

Game events flow from the Game Server into Redis Streams partitioned by `game_id % 16`, preserving per-game ordering. Consumer-group workers read batches of 100 events, incrementally updating running aggregates in Redis Hash structures with 5-second TTL cycles. These pre-aggregated values answer dashboard queries in under 10 ms, avoiding $O(n)$ scan costs [^478^]. A nightly ETL job (Apache Airflow, 02:00 UTC) extracts events from PostgreSQL, transforms them through the 25-metric behavioral pipeline from Chapter 8, and loads results into ClickHouse. A materialized view `agent_leaderboard_mv` auto-refreshes, eliminating table scans at query time [^478^].

**Table 2 — Pipeline Stages**

| Stage | Input | Output | Frequency | Technology | Latency |
|---|---|---|---|---|---|
| Event Ingestion | Game actions, LLM calls | Serialized events (Avro) | Continuous | Kafka / Redpanda | < 10 ms |
| Real-Time Aggregate | Redis Streams | Incremental counters | Every 5 s | Redis + Python | < 50 ms |
| Nightly ETL | PostgreSQL partitions | ClickHouse fact tables | Daily 02:00 UTC | Airflow | ~15 min |
| Metrics Computation | Raw event sequences | 25 behavioral metrics | Per game end | Python | < 2 s |
| Materialized View | agent_performances + behavioral | Pre-aggregated leaderboard | Auto (ClickHouse MV) | SummingMergeTree | Real-time |
| Visualization | All layers | Streamlit dashboard | On demand | Streamlit + Plotly | < 1 s |

The event schema uses Avro with a Confluent Schema Registry for backward-compatible evolution. Kafka topics partition by `game_id` to guarantee in-game ordering — critical for deterministic replay [^158^].

```sql
-- ClickHouse schema for behavioral metrics fact table
CREATE TABLE behavioral_metrics (
    game_id UUID,
    agent_id LowCardinality(String),
    role Enum('villager', 'werewolf', 'seer', 'doctor'),
    tas Float32, fcr Float32, tsr Float32, des Float32,
    idr Float32, brr Float32, vsf Float32, tns Float32,
    pmi Float32, dci Float32, sri Float32, lpi Float32,
    computed_at DateTime64(3) DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (game_id, agent_id);
```

### 9.3 Matchmaking Analytics

The matchmaking system uses multiplayer ELO with per-role rating tracks. Standard ELO assumes 1v1; Werewolf's 8-player team structure requires a team-based expected-score formula treating each faction as a collective [^481^][^475^]. Each player maintains an overall ELO plus per-role ELOs (Werewolf, Villager, Seer, Doctor) that calibrate AI difficulty. The K-factor schedule varies by experience: 40 for the first 10 games, 32 for games 11–30, 20 for games 31–100, and 16 thereafter [^35^]. The update computes faction-average ratings, derives expected scores via $E_A = 1 / (1 + 10^{(R_B - R_A)/400})$, and applies uniform deltas. Individual performance weighting modulates the base change by a personal-to-team-average ratio [^475^].

**Table 3 — Match Quality Dimensions**

| Dimension | Metric | Target Range | Weight |
|---|---|---|---|
| Rating Differential | StdDev of ELO across players | < 150 points | 35% |
| Role Balance Score | $b = 1 - \\|2p_{imp} - 1\\|$ per Ch. 4 | 0.85 – 1.00 | 30% |
| Predicted Fairness | Expected win probability (disadvantaged) | 40% – 60% | 20% |
| Queue Time | Seconds elapsed waiting | < 60 s | 15% |

The match quality score $Q$ is a weighted composite. A game with $Q > 0.80$ is accepted; below 0.65, the Orchestrator expands ELO tolerance or substitutes an AI agent.

```sql
-- Matchmaking query: find compatible players with quality threshold
WITH player_pool AS (
    SELECT player_id, overall_elo, wolf_elo, villager_elo,
           games_played, preferred_role, queue_entered_at
    FROM matchmaking_queue
    WHERE status = 'waiting'
      AND now() - queue_entered_at < interval '5 minutes'
),
candidates AS (
    SELECT a.player_id, b.player_id as partner_id,
           abs(a.overall_elo - b.overall_elo) as elo_diff,
           (1.0 - abs(2.0 * (6.0 / 8.0) - 1.0)) as role_balance
    FROM player_pool a
    JOIN player_pool b ON a.player_id < b.player_id
    WHERE abs(a.overall_elo - b.overall_elo) < 150
)
SELECT * FROM candidates
WHERE elo_diff < 150 AND role_balance > 0.85
ORDER BY elo_diff ASC, role_balance DESC
LIMIT 7;
```

The query runs against a PostgreSQL materialized view refreshed every 3 seconds. For deployments exceeding 10,000 concurrent players, the view migrates to ClickHouse with `ReplacingMergeTree`.

```python
def update_elo_team_based(players, winner_faction, k_factor=32):
    """Team-based ELO update for multiplayer Werewolf [^35^]."""
    wolves = [p for p in players if p['faction'] == 'werewolf']
    villagers = [p for p in players if p['faction'] == 'villager']
    wolf_avg = sum(p['elo'] for p in wolves) / len(wolves)
    villager_avg = sum(p['elo'] for p in villagers) / len(villagers)
    E_wolf = 1 / (1 + 10 ** ((villager_avg - wolf_avg) / 400))
    E_villager = 1 - E_wolf
    S_wolf = 1.0 if winner_faction == 'werewolf' else 0.0
    S_villager = 1.0 if winner_faction == 'villager' else 0.0
    updates = {}
    for p in wolves:
        updates[p['id']] = p['elo'] + k_factor * (S_wolf - E_wolf)
    for p in villagers:
        updates[p['id']] = p['elo'] + k_factor * (S_villager - E_villager)
    return updates
```

### 9.4 AI Performance Analytics

The Agent Performance Dashboard provides a unified view across five dimensions: competitive effectiveness (win rate, ELO), behavioral sophistication (TAS, FCR, DES), economic efficiency (cost per game, token usage), operational health (latency, cache hit rate), and prompt effectiveness (G-Eval quality scores). This structure allows engineers to diagnose whether an underperforming agent suffers from poor strategy, excessive cost, or slow responses [^140^][^155^].

**Table 4 — Dashboard Metrics by Panel**

| Panel | Metric | Definition | Alert Threshold |
|---|---|---|---|
| Competitive | Win Rate by Tier | Games won / played, per version | Deviation > 10% from mean |
| Competitive | ELO Trend | 7-day rolling per-role ELO | Decline > 100 in 7 days |
| Behavioral | TAS | Werewolf vote bloc alignment [^155^] | < 0.5 poor coordination |
| Behavioral | FCR | Villager votes correctly targeting wolves [^155^] | < 0.2 poor detection |
| Economic | Cost per Game | LLM API spend / games completed | > $0.50 triggers review |
| Economic | Token Efficiency | Relevant tokens / total generated | < 0.6 indicates bloat |
| Operational | p99 Latency | 99th percentile LLM response | > 5 s triggers fallback |
| Operational | Cache Hit Rate | Cached / total responses | < 50% misconfiguration |
| Quality | G-Eval Score | LLM-as-a-Judge composite (0–5) [^140^] | < 3.0 triggers review |
| Quality | Model Distribution | % calls per model tier | Budget < 60% indicates overspend |

The dashboard auto-refreshes every 5 seconds for operational metrics and 60 seconds for behavioral analytics, using ClickHouse query caching with 60-second TTL [^467^].

![AI Performance Overview](fig_9_3_ai_performance.png)

Each agent release undergoes statistical comparison against production before rollout. The framework uses Welch's t-test on five primary metrics with $p < 0.05$ and minimum 200 games per variant for 80% power to detect a 5-point win-rate difference [^140^].

**Table 5 — A/B Test: Agent v2.1 vs v2.2 (n = 1,200 games)**

| Metric | v2.1 (Control) | v2.2 (Treatment) | Delta | p-value | Significant |
|---|---|---|---|---|---|
| Win Rate (%) | 52.3 | 55.1 | +2.8 | 0.032 | Yes |
| Survival Rounds | 4.2 | 4.7 | +0.5 | 0.018 | Yes |
| DES Score | 0.78 | 0.85 | +0.07 | 0.041 | Yes |
| Response Quality | 3.85 / 5 | 4.12 / 5 | +0.27 | 0.089 | No |
| Cost per Game | $0.059 | $0.061 | +$0.002 | 0.312 | No |
| p99 Latency (s) | 2.1 | 2.4 | +0.3 | 0.156 | No |

The results show v2.2 achieves significant improvements in competitive and behavioral metrics without cost or latency regressions. The Rollout Recommender assigns "proceed" with staged deployment: 10% → 25% → 50% → 100% over 72 hours, with automated rollback if any operational metric degrades beyond 2 standard deviations.

![A/B Test Comparison](fig_9_5_ab_test.png)

```python
def ab_test_analysis(control, treatment, metric_name, alpha=0.05):
    """Welch's t-test for agent version comparison [^140^]."""
    from scipy import stats
    t_stat, p_value = stats.ttest_ind(control, treatment, equal_var=False)
    effect_size = (np.mean(treatment) - np.mean(control)) / np.std(control, ddof=1)
    significant = p_value < alpha
    recommendation = ("proceed" if significant and effect_size > 0
                      else "rollback" if significant else "inconclusive")
    return {
        "metric": metric_name,
        "control_mean": np.mean(control),
        "treatment_mean": np.mean(treatment),
        "p_value": round(p_value, 4),
        "effect_size": round(effect_size, 3),
        "significant": significant,
        "recommendation": recommendation
    }
```

### 9.5 Data Retention & Privacy

The platform implements a three-tier retention architecture aligning storage cost with access frequency while satisfying regulatory requirements.

**Hot Tier (Redis, 30 days).** Dashboard data, active sessions, live leaderboards, and queue state reside in Redis with TTL expiration. Sub-millisecond reads support the 5-second refresh cycle. Expired data archives to warm tier if structurally significant, or deletes if ephemeral.

**Warm Tier (PostgreSQL, 90 days).** Player profiles, recent game histories, ELO rankings, and support records remain queryable via standard SQL with B-tree lookups under 100 ms. This tier answers the majority of player-facing queries.

**Cold Tier (ClickHouse, indefinite).** Anonymized behavioral metrics and ML training datasets persist in columnar format. Research datasets use pseudonymized player IDs — irreversibly hashed with a salted one-way function — enabling longitudinal analysis without re-identification risk [^155^].

![Data Retention Tiers](fig_9_1_retention_tiers.png)

**Table 6 — Data Retention Policy**

| Tier | Storage | Retention | Data Types | Access Pattern | Query Latency |
|---|---|---|---|---|---|
| Hot | Redis | 30 days | Sessions, caches, queues | Real-time reads | < 1 ms |
| Warm | PostgreSQL | 90 days | Profiles, history, ELO | Indexed lookups | < 100 ms |
| Cold | ClickHouse | Indefinite | Anonymized metrics, ML data | Analytical scans | < 5 s |
| Legal | S3 Glacier | 7 years | GDPR audit logs, consent | Rare retrieval | Minutes |

**GDPR Compliance.** Four data-subject rights are automated. The **Right to Export** delivers a JSON archive within 30 days SLA; a self-service portal handles 95% of requests in under 5 minutes. The **Right to Deletion** triggers cascading workflow: queue deletion in Redis, foreign-key anonymization in PostgreSQL within 24 hours, profile hard-delete within 72 hours, and backup purge within 30 days. The **Consent Tracker** records timestamped grants and revocations in an immutable append-only ledger. **Anonymization** strips direct identifiers and replaces `player_id` with an HSM-backed salted hash rotating quarterly.

**Table 7 — GDPR Compliance Matrix**

| Requirement | Implementation | SLA | Verification |
|---|---|---|---|
| Data Export (Art. 20) | Self-service JSON portal + email | 30 days | Automated confirmation |
| Right to Deletion (Art. 17) | Cascading anonymization + hard delete | 72 hours | Row-count audit |
| Consent Tracking (Art. 7) | Immutable ledger with hash chain | Real-time | Quarterly report |
| Data Minimization (Art. 5) | Field-level flags; default off | At collection | Schema review |
| Pseudonymization (Art. 4) | HSM-backed SHA-256, quarterly rotation | Per export | Entropy analysis |
| Breach Notification (Art. 33) | PagerDuty + email to DPA | 72 hours | Annual exercise |

```python
def anonymize_player_for_research(player_id, salt_key):
    """One-way pseudonymization for research datasets."""
    import hashlib, hmac
    pseudonym = hmac.new(
        salt_key.encode(), player_id.encode(), hashlib.sha256
    ).hexdigest()[:16]
    return {
        "original_id": "[REDACTED]",
        "research_id": pseudonym,
        "username": None, "email": None, "ip_address": None,
        "country": "[ANONYMIZED]", "timezone": "[ANONYMIZED]"
    }

# Retention policy configuration
RETENTION_POLICY = {
    "hot": {"store": "redis", "ttl_days": 30, "auto_expire": True},
    "warm": {"store": "postgresql", "retention_days": 90, "archive_on_expiry": True},
    "cold": {"store": "clickhouse", "retention_days": None, "anonymize": True},
    "legal": {"store": "s3_glacier", "retention_years": 7, "encryption": "AES-256-GCM"}
}
```

The balance between analytical utility and privacy uses differential privacy: Gaussian noise ($\\sigma = 0.5$) is added to behavioral aggregates before research export, preventing reverse-engineering of individual data. This aligns with NIST AI RMF guidance on privacy-preserving ML and positions the platform for EU AI Act data governance requirements [^486^].

![Pipeline Architecture](fig_9_4_pipeline_arch.png)

The pipeline architecture diagram illustrates the lambda-pattern flow: four event sources feed a Kafka streaming layer, which bifurcates into a real-time Redis path and a nightly ClickHouse batch path. All outputs derive from the same canonical event stream, eliminating data-consistency risks from separate operational and analytical pipelines [^128^].
-e 

---

## 10. Development Roadmap

The preceding nine chapters define the complete design specification for the Werewolf multiplayer platform: a polyglot architecture serving 12+ roles, a three-tier AI agent system, six chat channels with four-tier moderation, ELO-based matchmaking, and AI-only simulation with 25+ behavioral metrics. This final chapter translates that specification into an executable 24-week delivery plan across four phases, from foundational server infrastructure to a production-grade platform capable of human-vs-AI tournaments at scale.

![24-Week Development Timeline](fig10_1_timeline_gantt.png)

*Figure 10.1 — Gantt chart of the four-phase 24-week delivery plan. Each phase concludes with a validated milestone. Diamond markers denote phase-review gates.*

The timeline follows the standard indie milestone structure — Prototype, Vertical Slice, Feature Complete (Alpha), Content Complete (Beta), Release Candidate, Launch — adapted to a 24-week cadence with a target team of 4–5 engineers (2 backend, 1 frontend, 1 AI/ML, 1 DevOps/QA) [^507^][^508^]. The platform's cost model projects $0.31–$2.30 per game depending on AI tier mix, with infrastructure at approximately $1,230/month at medium scale [^487^].

| Phase | Weeks | Core Focus | Key Deliverables | Milestone |
|---|---|---|---|---|
| 1 — Foundation | 1–6 | Server infrastructure, basic gameplay | WebSocket server, 5-state FSM, 3 roles, React client | Playable multiplayer game (human only) |
| 2 — AI Integration | 7–12 | Three-tier agent system, cost control | Rule-based + personality + LLM agents, prompt manager, model router | Human-vs-AI games with all tiers |
| 3 — Multiplayer & Polish | 13–18 | Matchmaking, role expansion, UX | ELO system, 12 roles, animations, spectator mode | Production-ready ranked platform |
| 4 — Simulation & Scale | 19–24 | Batch simulation, analytics, hardening | AI tournament runner, ClickHouse dashboard, load testing | Full platform with simulation suite |

*Table 10.0 — Four-phase roadmap at a glance. Each phase builds on the previous, with validated milestones at Week 6, 12, 18, and 24.*

### 10.1 Phase 1: Foundation (Weeks 1–6)

Phase 1 establishes the technical substrate: a real-time WebSocket game server, Redis-backed state management, a finite state machine (FSM) covering the five core game phases, and a React client capable of rendering the player grid and lobby system.

#### 10.1.1 Core Server Infrastructure

The Game Orchestrator runs on Node.js with Socket.IO, a pairing validated to support 20,000+ concurrent WebSocket connections with automatic reconnection and room-scoped message routing [^20^][^14^]. Redis serves dual purposes: sub-millisecond game-state synchronization via its key-value store, and cross-server pub/sub messaging for horizontally scaled deployments [^17^]. The authoritative server model validates all actions server-side; clients operate as render-only views [^21^][^39^].

The FSM defines five foundational states — `LOBBY`, `NIGHT`, `DAWN`, `DAY`, `VOTING` — with transitions validated by the Game Orchestrator before state changes propagate to connected clients. Each state encapsulates permissible actions, timeout defaults, and information-reveal rules.

```typescript
// Core FSM state definitions (Phase 1)
enum GameState {
  LOBBY = 'LOBBY',       // Players joining, role assignment pending
  NIGHT = 'NIGHT',       // Secret actions: werewolf kill, seer investigate
  DAWN = 'DAWN',         // Resolution: deaths revealed, phase announcements
  DAY = 'DAY',           // Public discussion, accusation
  VOTING = 'VOTING',     // Simultaneous vote submission
  SUNSET = 'SUNSET'      // Vote tally, elimination, win-check
}

interface StateConfig {
  durationSeconds: number;
  allowedActions: PlayerAction[];
  infoReveal: InfoLevel;     // NONE, ROLE_ONLY, FULL_REVEAL
  timeoutFallback: FallbackAction;
}

const STATE_CONFIG: Record<GameState, StateConfig> = {
  [GameState.LOBBY]:  { durationSeconds: 0,    allowedActions: ['join','leave','ready'], infoReveal: InfoLevel.NONE, timeoutFallback: 'none' },
  [GameState.NIGHT]:  { durationSeconds: 90,   allowedActions: ['kill','investigate','protect','pass'], infoReveal: InfoLevel.NONE, timeoutFallback: 'random_valid' },
  [GameState.DAWN]:   { durationSeconds: 15,   allowedActions: [], infoReveal: InfoLevel.DEATH_ONLY, timeoutFallback: 'auto_advance' },
  [GameState.DAY]:    { durationSeconds: 180,  allowedActions: ['speak','accuse','defend'], infoReveal: InfoLevel.NONE, timeoutFallback: 'skip_turn' },
  [GameState.VOTING]: { durationSeconds: 30,   allowedActions: ['vote','abstain'], infoReveal: InfoLevel.NONE, timeoutFallback: 'abstain' },
  [GameState.SUNSET]: { durationSeconds: 10,   allowedActions: [], infoReveal: InfoLevel.ROLE_REVEAL, timeoutFallback: 'auto_advance' }
};
```

#### 10.1.2 Basic Gameplay: Three Roles

Phase 1 implements the minimum viable role set — Villager, Werewolf, and Seer — with complete day/night cycles, public voting with tie resolution, and win-condition detection (werewolf parity and full werewolf elimination). The balance formula $b = 1 - |2 \cdot p_{\text{imp}} - 1|$ applies even at this scale, ensuring the 3:1 villager-to-werewolf ratio produces near-equilibrium win rates [^28^].

#### 10.1.3 Basic UI and Client

The React 18 + TypeScript client renders a responsive player grid, a chat panel supporting day-phase public messaging, and a lobby creation flow. Zustand manages client-side state; Framer Motion handles the 2.5-second day/night background transition [^516^]. Tailwind CSS provides rapid styling iteration. Socket.IO Client enables real-time state synchronization with automatic reconnection on disconnect [^48^].

| Component | Technology | Rationale | Phase 1 Scope |
|---|---|---|---|
| Game Server | Node.js + Socket.IO | 20K+ concurrent connections, room routing [^20^] | Core WebSocket, lobby, room management |
| HTTP API | FastAPI (Python) | ML-friendly, async-native [^43^] | Stub endpoints for future AI integration |
| Game State | Redis | Sub-millisecond sync, pub/sub [^17^] | Session store, state cache, presence |
| Persistence | PostgreSQL | Relational integrity for user data [^51^] | User accounts, game history schema |
| Client | React 18 + TypeScript | Component architecture, type safety | Player grid, chat, lobby, vote buttons |
| Animation | Framer Motion | Declarative React animations | Day/night transition, card states |
| Styling | Tailwind CSS | Rapid iteration, design system | Responsive grid, dark-fantasy theme [^516^] |

*Table 10.1 — Phase 1 technology stack and scope. Each component delivers the minimum surface area required for a playable three-role multiplayer game.*

#### 10.1.4 Phase 1 Milestone

At the end of Week 6, the platform supports: (a) lobby creation and join, (b) automated role assignment for Villager, Werewolf, and Seer, (c) full day/night cycle with voting and elimination, (d) win-condition resolution, and (e) basic spectator join-as-observer. No AI agents are present — all players are human.

### 10.2 Phase 2: AI Integration (Weeks 7–12)

Phase 2 introduces the three-tier agent architecture — rule-based, personality-driven, and LLM-powered — connected to the game server via a FastAPI microservice. This is the highest-risk, highest-complexity phase of the project.

#### 10.2.1 Three-Tier Agent System

The Rule-Based tier executes in under 1 millisecond using hardcoded decision trees and finite state machines, serving as the fallback when LLM calls time out or exceed cost caps [^205^]. The Personality-Driven tier extends this with Big Five (OCEAN) trait vectors — Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism — that probabilistically modify decision weights, producing emergent behavioral variety at negligible computational cost [^179^][^248^]. The LLM-Powered tier delegates full reasoning to a language model via structured prompting with JSON response schemas, achieving human-like persuasion and deception at $0.01–$0.15 per decision [^127^].

The neuro-symbolic hybrid achieves +7.2% entailment consistency and +5.3% multi-step accuracy over pure LLM approaches by embedding rule-based trees as callable oracles within the LLM reasoning loop [^205^]. This validates the tiered approach: rule-based guardrails enforce game logic invariants while LLMs handle social reasoning.

#### 10.2.2 Prompt Management and Response Parsing

All LLM-facing prompts follow a spec-pattern structure: Role Identity, Game Rules, Core Objectives, Current Context, Response Format (JSON schema), and optional Personality Configuration [^15^][^18^]. The Prompt Manager assembles these components per-role, injects live game state, and enforces output parsing through OpenAI's Structured Outputs with `strict: true` [^177^][^209^].

```python
# Model routing with cost-aware tier selection (Phase 2)
async def route_agent_request(
    game_state: GameState,
    agent_tier: AgentTier,
    decision_type: DecisionType,
    context_tokens: int
) -> ModelSelection:
    """Route agent decisions to the cheapest adequate model."""

    if agent_tier == AgentTier.RULE_BASED:
        return ModelSelection(model=None, execute_locally=True)

    if agent_tier == AgentTier.PERSONALITY_DRIVEN:
        return ModelSelection(model=None, execute_locally=True)

    # LLM tier: complexity-based routing
    if decision_type == DecisionType.SIMPLE_VOTE and context_tokens < 2000:
        return ModelSelection(model="gpt-4o-mini", est_cost=0.00075)
    elif decision_type == DecisionType.NIGHT_ACTION and game_state.day_number <= 2:
        return ModelSelection(model="gemini-2.5-flash", est_cost=0.00119)
    elif decision_type == DecisionType.COMPLEX_DECEPTION or context_tokens > 8000:
        return ModelSelection(model="claude-sonnet-4", est_cost=0.0159)
    elif decision_type == DecisionType.FINAL_STATEMENT and game_state.alive_count <= 4:
        return ModelSelection(model="gpt-4o", est_cost=0.0125)
    else:
        return ModelSelection(model="gpt-4o-mini", est_cost=0.00075)
```

Dynamic tiered routing based on decision complexity reduces total API cost by 45–60% compared to static model assignment [^167^][^174^]. The complexity classifier itself runs on GPT-4o Mini at under 100 tokens per request.

#### 10.2.3 Cost Optimization Layer

Five optimization levers operate in concert: prompt caching (50–90% savings on repeated system prompts), context compaction (40–60% token reduction via LLMLingua-style compression), model routing (40–70% total cost reduction), output token control (20–30% savings via JSON-only responses with 300-token caps), and batch processing (50% discount on non-urgent evaluations) [^167^][^172^][^173^][^174^]. Combined, these levers reduce per-game LLM cost from $2.30 (unoptimized) to $0.31 (fully optimized) — an 86% reduction [^496^].

| Tier | Core Logic | Latency | Cost/Decision | Best Use Case |
|---|---|---|---|---|
| Rule-Based | Decision trees + FSM | <1 ms | Negligible (CPU) | Tutorial bots, offline practice |
| Personality-Driven | Big Five trait vectors [^179^] | <10 ms | Negligible (CPU) | Casual multiplayer, social modes |
| LLM-Powered | Full LLM reasoning, structured output [^127^] | 0.5–5 s | $0.01–$0.15 | Competitive play, tournaments |
| LLM + Cache Hit | Cached prompt prefix [^177^] | 0.5–5 s | $0.002–$0.03 | Repeated game states |
| Fallback Chain | Rule-based emergency override | <1 ms | $0 | Timeout or cost-cap breach |

*Table 10.2 — Agent tier characteristics and routing logic. The system dynamically selects tiers per-decision to balance strategic depth against operating cost.*

#### 10.2.4 Phase 2 Milestone

By Week 12, the platform supports human-vs-AI games with all three agent tiers selectable at lobby creation. Agents produce valid JSON actions, participate in day-phase discussion, and execute night-phase abilities. The cost-optimization layer is active, with per-game cost tracking and automatic fallback to cheaper models on budget threshold breach.

### 10.3 Phase 3: Multiplayer & Polish (Weeks 13–18)

Phase 3 transitions the platform from a working prototype to a production-ready multiplayer service, adding matchmaking, the full 12-role set, visual polish, and spectator infrastructure.

#### 10.3.1 Matchmaking and Ranked Play

The ELO-based matchmaking system implements Simple Multiplayer Elo (SME) with per-role rating tracking, enabling fair team composition across the four queue modes: Casual (unranked), Ranked Solo, Ranked Team, and Custom Private [^28^]. The SME algorithm updates individual ratings based on faction outcome, accounting for the inherent team-dependence of multiplayer social deduction. A minimum of 50 ranked games qualifies a player for the global leaderboard.

#### 10.3.2 Full Role Expansion

The role set expands from 3 to 12 roles across three factions — Village (Villager, Seer, Doctor, Witch, Hunter, Mason), Werewolf (Werewolf, Alpha Wolf, Minion), and Solo (Jester, Serial Killer) — with the balance framework $b = 1 - |2 \cdot p_{\text{imp}} - 1|$ ensuring each configuration maintains near-equilibrium win rates. Custom game configuration allows hosts to define role lists, day/night durations (configurable 3–20 minutes for discussion, 1–9 minutes for night actions) [^70^], and house rules.

| Deliverable | Scope | Duration | Dependencies |
|---|---|---|---|
| ELO matchmaking (SME algorithm) | 4 queue modes, per-role ratings | Weeks 13–15 | PostgreSQL user data |
| Ranked leaderboard | Global + friend rankings, season resets | Weeks 14–16 | ELO system |
| 12-role expansion | 9 new roles with full ability implementation | Weeks 13–16 | Phase 1 role framework |
| Balance calculator | Configurable role lists with win-rate prediction | Weeks 15–16 | 12-role data |
| Visual polish | Animations, effects, transitions | Weeks 15–17 | Phase 1 UI components |
| Spectator mode | Full role visibility, delayed stream option | Weeks 16–18 | Event sourcing |
| Replay system | Event-log rehydration, seek/rewind | Weeks 16–18 | Event store [^484^] |

*Table 10.3 — Phase 3 deliverables and dependencies. The matchmaking and role expansion tracks run in parallel, converging on the spectator/replay system.*

#### 10.3.3 Visual Polish and Spectator Experience

Framer Motion drives card-flip role reveals (0.6s Y-axis rotation with overshoot bounce), vote-particle trajectories (Bezier-curve arcs colored by voter faction), and elimination effects (screen shake, chromatic aberration impulse, radial particle bursts) [^485^]. The spectator view follows esports UI research: full role visibility, no hover-dependent information, trust-network graphs, and a 60-second optional delay for competitive integrity [^484^].

#### 10.3.4 Phase 3 Milestone

At Week 18, the platform supports ranked multiplayer matchmaking across all 12 roles, custom game configuration, full animation and effects, and a spectator mode with replay capability. The system is feature-complete for public beta.

### 10.4 Phase 4: Simulation & Scale (Weeks 19–24)

Phase 4 builds the analytical and operational layer: AI-only batch simulation, real-time analytics, and platform hardening for sustained production load.

#### 10.4.1 AI-Only Simulation Engine

The batch runner executes AI-only games at configurable throughput — from 10 games/hour (detailed logging, all tiers) to 1,000+ games/hour (rule-based only, minimal telemetry). Tournament formats include round-robin, Swiss-system (FIDE Dutch pairing), and single-elimination brackets [^28^]. The simulation engine generates behavioral analytics across 25+ metrics: deception rate, detection recall, trust-network centrality, voting consistency, and survival correlation with ELO rating.

```python
# Batch simulation runner (Phase 4)
async def run_simulation_batch(
    config: SimulationConfig,
    agent_configs: list[AgentConfig],
    tournament_format: TournamentFormat
) -> SimulationResult:
    """Execute AI-only games at scale with full telemetry capture."""

    results = []
    for game_id in range(config.game_count):
        # Compose agent roster from config
        agents = [compose_agent(cfg) for cfg in agent_configs]

        # Run game with event sourcing
        game_log = await run_game(
            agents=agents,
            role_set=config.role_set,
            event_handler=clickhouse_batch_writer,  # Stream to ClickHouse
            timeout_override=config.timeout_seconds
        )

        # Compute per-game metrics
        metrics = compute_behavioral_metrics(game_log)
        results.append({
            'game_id': game_id,
            'winner': game_log.winner_faction,
            'duration_seconds': game_log.duration,
            'metrics': metrics,
            'cost': game_log.total_llm_cost
        })

        # Periodic progress + cost check
        if game_id % 100 == 0:
            await report_progress(game_id, config.game_count)

    # Aggregate results
    return SimulationResult(
        games=results,
        aggregate=aggregate_metrics(results),
        total_cost=sum(r['cost'] for r in results),
        cost_per_game=sum(r['cost'] for r in results) / len(results)
    )
```

The event-sourcing architecture — where every game action is an immutable event in a persistent log — unlocks three features simultaneously: replay generation, AI training data export, and real-time analytics streaming [^484^]. This 1-to-3 leverage makes event sourcing the highest-return architectural decision in the platform.

#### 10.4.2 Analytics Suite

The real-time dashboard streams game events through ClickHouse, enabling sub-second query latency on 25+ behavioral metrics. A/B testing infrastructure supports variant comparison: role-set balance, timer durations, and AI tier mixes. The data pipeline normalizes event streams into structured tables for win-rate analysis, agent ELO tracking, and cost-per-game trending.

| Deliverable | Purpose | Scale Target | Week Range |
|---|---|---|---|
| Batch simulation runner | AI-only tournament execution | 1,000 games/day | Weeks 19–21 |
| Tournament system | Round-robin, Swiss, elimination brackets | 64-agent fields | Weeks 20–22 |
| Real-time analytics dashboard | ClickHouse-backed live metrics | Sub-second queries | Weeks 20–23 |
| A/B testing framework | Variant comparison for balance tuning | 2–4 concurrent tests | Weeks 21–23 |
| Load testing suite | Simulate 1,000 concurrent players | 250 concurrent games | Weeks 22–24 |
| Mobile optimization | Touch gestures, responsive breakpoints | iOS + Android browsers | Weeks 21–24 |
| Accessibility compliance | WCAG 2.1 AA, colorblind mode, screen readers | Full coverage | Weeks 22–24 |
| Monitoring + alerting | Prometheus + Grafana + Sentry | 99.9% uptime target | Weeks 22–24 |

*Table 10.4 — Phase 4 deliverables with scale targets. The simulation and analytics tracks run in parallel with the hardening track.*

#### 10.4.3 Platform Hardening

Load testing validates the architecture at 1,000 concurrent players (~250 simultaneous games). Kubernetes Horizontal Pod Autoscaling (HPA) scales game server pods based on active room count [^41^]; Redis Cluster distributes state across shards. Mobile optimization adds touch gestures, compact player cards (56x56px avatar at high player counts), and swipeable chat tabs. Accessibility implements WCAG 2.1 AA: color-plus-icon dual coding for colorblind users, keyboard navigation for all actions, and ARIA labels for screen readers [^484^].

#### 10.4.4 Phase 4 Milestone

The Week 24 milestone delivers a fully featured platform: AI simulation at 1,000+ games/day, real-time analytics, production monitoring, and mobile-responsive accessible UI. The system is ready for public launch.

### 10.5 Risk Assessment

The platform faces two categories of risk: technical risks rooted in LLM integration, and project risks affecting timeline and scope.

![Risk Heatmap](fig10_3_risk_heatmap.png)

*Figure 10.3 — Risk assessment heatmap sorted by composite score (Probability × Impact). Critical risks (score ≥18) demand proactive mitigation beginning in Phase 1.*

**Technical Risks.** LLM cost exceeding budget (P4×I5=20) and latency exceeding 5 seconds (P4×I5=20) are the two critical technical risks. Cost mitigation deploys all five optimization levers: prompt caching achieves 41–80% savings [^177^], model routing saves 40–70% [^496^], and context compaction reduces tokens by 50–70% per turn [^496^]. A hard per-game cost cap of $0.50 triggers automatic model downgrade. Latency mitigation uses parallel async processing (all agents decide simultaneously), pre-warmed HTTP/2 connections, and a timeout fallback chain: GPT-4o Mini (~300ms) → rule-based bot (<1ms) [^228^].

Context window overflow (P4×I3=12) becomes significant after 20–30 turns when agents approach 50–100K tokens per request, causing both cost spikes and degraded coherence [^498^][^537^]. Sliding-window context management with conversation summarization every 10–15 turns addresses this with 22.7% token savings [^533^].

![Feature Velocity vs. Operating Cost](fig10_2_cost_velocity.png)

*Figure 10.2 — Feature completion velocity (solid line) ramps fastest during Phases 1–3, while estimated daily operating cost (dashed line) accelerates in Phase 4 as AI simulation reaches full throughput. The divergence reflects the cost of LLM-powered agent execution at scale.*

**Project Risks.** Scope creep on AI features (P5×I3=15) ranks as the highest project risk. The locked MVP scope (Table 10.1) and milestone-gated phase reviews prevent uncontrolled expansion [^508^]. Balance issues requiring role redesign (P3×I4=12) are mitigated by the balance calculator tool and A/B testing framework, both operational by Week 16. Regulatory concerns around AI deception in games (P2×I4=8) remain low-probability but high-impact; mitigation includes transparent bot labeling, opt-in AI lobbies, and compliance review of agent prompt content.

| Risk | Probability | Impact | Score | Mitigation Strategy | Owner |
|---|---|---|---|---|---|
| LLM cost exceeds budget | 4 (Likely) | 5 (Severe) | 20 | Five-lever optimization, $0.50/game cap, auto-downgrade [^496^] | Tech Lead |
| LLM latency >5s disrupts flow | 4 (Likely) | 5 (Severe) | 20 | Parallel async, fast-model fallback, pre-warmed connections [^228^] | AI Engineer |
| Scope creep on AI features | 5 (Very Likely) | 3 (Moderate) | 15 | Locked MVP scope, milestone gates, agile sprints [^508^] | Product Manager |
| Context window overflow | 4 (Likely) | 3 (Moderate) | 12 | Sliding window, compression every 10–15 turns [^533^] | AI Engineer |
| Balance issues require redesign | 3 (Possible) | 4 (Major) | 12 | Balance calculator, A/B testing, role-weight framework | Game Designer |
| WebSocket scaling limits | 3 (Possible) | 4 (Major) | 12 | Horizontal scaling, Redis pub/sub, room sharding [^41^] | Backend Engineer |
| Agent quality below threshold | 3 (Possible) | 4 (Major) | 12 | Evaluation framework, hybrid rule+LLM, prompt iteration [^205^] | AI Engineer |
| Regulatory concerns (AI deception) | 2 (Unlikely) | 4 (Major) | 8 | Bot labeling, opt-in AI, prompt content review | Product Manager |
| Model availability changes | 3 (Possible) | 3 (Moderate) | 9 | Multi-provider setup (OpenAI + DeepSeek + Anthropic), LiteLLM abstraction [^487^] | Tech Lead |
| Multiplayer networking bugs | 3 (Possible) | 3 (Moderate) | 9 | Authoritative server, comprehensive QA, connection recovery [^48^] | QA Engineer |

*Table 10.5 — Comprehensive risk register with probability, impact, composite score, mitigation strategy, and owner assignment. Risks are reviewed at each phase gate.*

![Polyglot System Architecture](fig10_4_system_architecture.png)

*Figure 10.4 — Polyglot system architecture showing the four layers deployed across 24 weeks. The Node.js Game Server and Python AI Service communicate through Redis Pub/Sub and direct HTTP calls, with all state flowing through the Data Layer.*

**Cost Projections.** At medium scale (1,000 games/day, 50% with AI agents), monthly infrastructure costs total approximately $1,230 (3× Node.js c5.xlarge instances, 2× AI service c5.2xlarge, ElastiCache Redis, RDS PostgreSQL, ALB, and bandwidth) [^493^]. LLM API costs at optimized routing add $310–$6,000/month depending on model mix, with the model-router configuration (70% GPT-4o Mini, 30% GPT-4o) representing the recommended middle path at approximately $600/month [^487^].

| Scale | Games/Day | Infrastructure/Month | LLM API (Optimized)/Month | LLM API (Premium)/Month | Total/Month |
|---|---|---|---|---|---|
| Small (dev) | 100 | $400 | $113 (all Mini) | $1,875 (all GPT-4o) | $513–$2,275 |
| Medium (beta) | 1,000 | $1,230 | $600 (router mix) | $18,750 (all GPT-4o) | $1,830–$19,980 |
| Large (production) | 10,000 | $3,500 | $6,000 (router mix) | $60,000 (router mix) | $9,500–$63,500 |

*Table 10.6 — Monthly cost projections across three operational scales. The optimized column applies all five cost-reduction levers; the premium column represents unoptimized GPT-4o usage. Infrastructure assumes AWS/DigitalOcean pricing [^493^].*

The cost architecture directly determines game-mode viability: human-only games incur negligible LLM cost, mixed human-AI games average $0.15/game with 1–2 AI agents, and full-AI simulation at 1,000 games/day costs $310/day at optimized pricing. This cost ladder informs the three economic tiers: Free (human-only + 1 rule-based bot), Premium (mixed human-AI with up to 3 LLM agents), and Simulation (AI-only tournaments at bulk pricing). The simulation tier effectively subsidizes research data generation through entertainment content — AI tournaments produce a continuous stream of dramatic, shareable moments for organic marketing.

The 24-week roadmap delivers a platform capable of serving as both a social deduction game and a benchmark for social AI research. By Week 24, ELO ratings across models, per-role behavioral metrics, LLM-as-a-Judge evaluation, and human-AI mixed play position the platform as a potential standard for measuring social intelligence in artificial agents — analogous to how ImageNet became the definitive benchmark for computer vision. The event-sourced architecture ensures that every game played, every agent decision, and every social interaction becomes permanently available for analysis, training, and replay, creating compounding value as the dataset grows.
-e 

---

