# Werewolf Game Platform: Technical Design Document & System Architecture Specification

## Executive Summary

### Platform Vision
#### A multiplayer Werewolf/Mafia social deduction platform supporting human players, AI bots, and LLM-powered agents in hybrid and fully autonomous play
#### Three-tier AI agent system (rule-based, personality-driven, LLM-powered) with polyglot backend (Node.js + Python + Redis)
#### Event-sourced architecture enabling replay, training data generation, and real-time analytics simultaneously
### Core Capabilities
#### Real-time multiplayer lobbies (6-16 players), WebSocket communication, 4 matchmaking modes (Quick/Ranked/Custom/Tournament)
#### 12+ roles with mathematical balance framework, 3 standard presets (8p/12p/16p), configurable custom setups
#### AI-only simulation mode at accelerated speed with 25+ behavioral metrics, ELO ranking, and LLM-as-a-Judge evaluation
#### Cost-optimized LLM integration achieving 70-85% reduction via caching, model routing, and context compaction
### Technology Stack
#### Presentation: React client with WebSocket real-time sync and dark fantasy visual theme
#### Game Logic: Node.js authoritative server with Redis pub/sub and event sourcing
#### AI Orchestration: Python/FastAPI with LLM provider abstraction, GRPO training pipeline, A2A protocol
#### Data: Redis (hot state), PostgreSQL (persistent), ClickHouse (analytics warehouse)

## 1. System Architecture (~3,500 words, 6 tables, 4 code blocks, 4 diagrams)

### 1.1 Architectural Principles
#### 1.1.1 Separation of concerns: game logic (Node.js) handles real-time state; AI reasoning (Python/FastAPI) handles agent decisions; never mix on same thread
#### 1.1.2 Stateless AI service: no AI instance holds game state between HTTP requests; all context provided per-request
#### 1.1.3 Event sourcing as foundation: every action is an append-only immutable event enabling deterministic replay and training data generation
#### 1.1.4 Polyglot persistence: Redis for hot game state and pub/sub; PostgreSQL for player data and analytics; dual-store CQRS pattern
### 1.2 Service Topology
#### 1.2.1 Game Orchestrator (Node.js/WebSocket): room lifecycle, phase transitions, WebSocket fanout, client state sync
#### 1.2.2 AI Service (Python/FastAPI): agent initialization, LLM inference orchestration, prompt templating, response parsing
#### 1.2.3 State Store (Redis): event log streams, current game state snapshots, session indexes, pub/sub channels
#### 1.2.4 Analytics Store (PostgreSQL + ClickHouse): normalized player data, time-series analytics, behavioral aggregates
#### 1.2.5 Service inventory table: service, language, protocol, scaling strategy, critical SLI
### 1.3 Communication Patterns
#### 1.3.1 WebSocket protocol: JSON message framing, 30s heartbeat, exponential backoff reconnection, message ordering guarantees
#### 1.3.2 Internal REST API between Game Orchestrator and AI Service: request/response contracts with 5s timeout
#### 1.3.3 Redis pub/sub: game events broadcast to AI workers; response events routed back to game room
#### 1.3.4 Data flow matrix: source, destination, protocol, data type, frequency
### 1.4 Event Sourcing Design
#### 1.4.1 Event schema: event_id (ULID), timestamp (ISO 8601), game_id (UUID), sequence_number (int), event_type (enum), payload (JSONB)
#### 1.4.2 Event categories: player_action, phase_transition, vote_cast, role_action, chat_message, system_event, agent_decision
#### 1.4.3 State reconstruction: replay events from sequence 0 to rebuild any game state at any point in time
#### 1.4.4 Event sourcing benefits: deterministic replay, training dataset generation, audit trail, analytics pipeline input
### 1.5 Scalability & Deployment
#### 1.5.1 Horizontal scaling: Game Orchestrator instances behind ALB with sticky WebSocket sessions
#### 1.5.2 AI Service autoscaling: inference queue depth > 50 or p95 response > 3s triggers pod scale-up
#### 1.5.3 Container orchestration: docker-compose for local development; Kubernetes + Agones for production game servers
#### 1.5.4 Complete Docker Compose configuration for local development stack
### 1.6 Resilience & Fault Tolerance
#### 1.6.1 Reconnection protocol: client disconnect triggers 30s grace period; state resync on reconnect via event replay
#### 1.6.2 AI degradation chain: LLM unavailable → personality-driven → rule-based → random legal action
#### 1.6.3 Session recovery: Redis AOF persistence, automatic state snapshotting every 60s, crash recovery procedure

## 2. AI Player Framework (~4,000 words, 6 tables, 7 code blocks, 4 diagrams)

### 2.1 Agent Architecture Overview
#### 2.1.1 Three-tier system: Tier 1 Rule-based (decision trees), Tier 2 Personality-driven (trait vectors), Tier 3 LLM-powered (prompt-based)
#### 2.1.2 Tier comparison table: capability, latency (10ms/50ms/2000ms), cost ($0/$0.001/$0.30/game), use case, fallback trigger
#### 2.1.3 Unified agent interface: all tiers expose identical API contract (observe → decide → act → speak) to Game Orchestrator
#### 2.1.4 Dynamic tier assignment: per-turn routing based on context complexity, budget, LLM availability
### 2.2 Tier 1: Rule-Based Agents
#### 2.2.1 Decision engine: finite state machine with Werewolf-specific heuristics (random night target, majority day vote)
#### 2.2.2 Core heuristics: self-preservation threshold at <30% survival probability, bandwagon voting after 60% consensus
#### 2.2.3 Appropriate usage: fast-paced games, tutorial mode, network fallback, minimal compute environments
#### 2.2.4 Pseudocode for rule-based voting and targeting decisions
### 2.3 Tier 2: Personality-Driven Agents
#### 2.3.1 Personality system: OCEAN trait vectors (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism) modulating rule outputs
#### 2.3.2 Personality-to-behavior mapping: high Neuroticism increases defensiveness; high Extraversion increases accusation frequency
#### 2.3.3 ReCon-inspired theory-of-mind: belief tracking about other players' roles based on observed actions and statements
#### 2.3.4 Personality configuration schema and example agent profiles (Aggressive, Cautious, Analytical, Social)
### 2.4 Tier 3: LLM-Powered Agents
#### 2.4.1 Pipeline: context assembly → prompt construction → LLM inference → JSON response parsing → action validation
#### 2.4.2 Prompt engineering: system prompt (role identity) + game context (visible state) + instruction (decision) + output schema (structured JSON)
#### 2.4.3 Context window management: conversation summarization, token budget allocation (40% state / 30% history / 20% memory / 10% instruction)
#### 2.4.4 Complete prompt template with variable substitution for Werewolf, Villager, Seer roles
#### 2.4.5 Response JSON schema: action_type, target_id, reasoning (internal), public_statement, confidence (0.0-1.0)
### 2.5 Persuasion Training with GRPO
#### 2.5.1 GRPO application: Group Relative Policy Optimization trains persuasive Werewolf agents via self-play
#### 2.5.2 Reward components: faction win (+1.0), vote influenced (+0.2), survival round (+0.05), detected as wolf (-0.5)
#### 2.5.3 Training pipeline: self-play data collection → reward computation → policy update → evaluation gating
#### 2.5.4 GRPO reward function pseudocode and iterative refinement loop
### 2.6 Cost Optimization Strategies
#### 2.6.1 Five-lever optimization: prompt caching (59-90%), context compaction (50-70%), model routing (40-70%), smart tiering (30-50%), batching (10-20%)
#### 2.6.2 Caching: identical game states SHA-256 hashed to cache key with 5-minute TTL
#### 2.6.3 Smart routing: low-stakes turns → Tier 2; critical decisions → Tier 3; voting → cached Tier 3
#### 2.6.4 Cost reduction strategies table: technique, savings, complexity, tradeoffs
### 2.7 Agent Response Validation
#### 2.7.1 Validation layer: JSON schema validation → action legality check → safety filter
#### 2.7.2 Retry logic: malformed response triggers re-prompt with error context, maximum 3 attempts
#### 2.7.3 Graceful degradation: validation failure → fallback to lower tier → random legal action as last resort

## 3. Game Loop & Phase Management (~2,800 words, 6 tables, 7 code blocks, 4 diagrams)

### 3.1 Game Lifecycle
#### 3.1.1 Lifecycle stages: Lobby → Setup → Active (phases) → Resolution → Post-Game
#### 3.1.2 Lobby mechanics: room creation, 6-digit join codes, host controls, AI backfill, 6-player minimum to start
#### 3.1.3 Setup sequence: role assignment algorithm, faction distribution validation, AI agent initialization with role-specific prompts
### 3.2 Night Phase
#### 3.2.1 Night structure: sequential role actions with simultaneous resolution, strict information asymmetry preservation
#### 3.2.2 Werewolf pack communication: private WebSocket room for target nomination, majority vote to confirm kill target
#### 3.2.3 Night action resolution order: WerewolfKill(1) → BodyguardProtect(2) → SeerCheck(3) → WitchSave(4) → WitchKill(5) → HunterRevenge(6)
#### 3.2.4 Resolution order table: role, action type, priority, target selection, result visibility
#### 3.2.5 Night timer: 90s default, extends by 10s per living player, forced resolution on timeout
### 3.3 Day Phase
#### 3.3.1 Day structure: Dawn announcement (death reveals) → Discussion (open chat) → Nomination → Defense → Voting → Execution
#### 3.3.2 Discussion mechanics: open chat, 3-minute default, optional speaking queue, no interrupt rules
#### 3.3.3 Nomination: any living player can nominate another; nominee gets 30s defense statement
#### 3.3.4 Voting: public or secret ballot (configurable), plurality wins, tie = no execution
#### 3.3.5 Complete phase specification matrix: phase, sub-phases, duration, player actions, system actions
### 3.4 Phase State Machine
#### 3.4.1 15-state FSM: Lobby, NightStart, WerewolfPhase, SeerPhase, WitchPhase, HunterPhase, NightEnd, DawnAnnouncement, Discussion, Nomination, DefenseSpeech, Voting, Execution, CheckWin, GameOver
#### 3.4.2 State machine implementation with transition guards and validation
#### 3.4.3 Transition triggers: timer expiry, unanimous action, host override, system event
#### 3.4.4 Timer configuration table: phase, base duration, per-player additive, fast/medium/slow presets
### 3.5 Win Condition Detection
#### 3.5.1 Win conditions: Werewolf parity (wolves >= villagers), Villager elimination (all wolves dead), role-specific (Fool, Hunter alternate)
#### 3.5.2 Win detection algorithm: after each execution, evaluate all faction victory predicates
#### 3.5.3 Game end sequence: reveal all roles, compute final scores, trigger analytics recording, ELO updates

## 4. Roles & Meta Design (~2,800 words, 6 tables, 5 code blocks, 4 diagrams)

### 4.1 Role Design Philosophy
#### 4.1.1 Design principles: information asymmetry creates tension, meaningful decisions every turn, faction interdependence
#### 4.1.2 Information taxonomy: perfect (public votes), probabilistic (Seer checks), hidden (secret roles)
#### 4.1.3 Deception as legitimate strategy: lying is not cheating — it is core gameplay; detection asymmetry creates difficulty progression
### 4.2 Core Role Definitions
#### 4.2.1 Villager: no special abilities, relies on social deduction, baseline information, must identify wolves through discussion
#### 4.2.2 Werewolf: night kill participation, hidden faction chat, must deceive during day, wins at parity
#### 4.2.3 Seer: night investigation revealing faction alignment, high-value target, claim risk/reward calculation
#### 4.2.4 Bodyguard: night protection of chosen target, conditional on Werewolf target match, cannot self-protect consecutive nights
#### 4.2.5 Witch: one-use heal potion, one-use kill potion, decision scarcity creates high-tension choices
#### 4.2.6 Complete role roster table: role, faction, ability, information level, complexity rating, weight
### 4.3 Balance Framework
#### 4.3.1 Balance formula: b = 1 - |2*p_imp - 1| where p_imp is probability of village win; target b > 0.75
#### 4.3.2 Role weight assignment: each role rated for information value (+/-3), kill/defend capability (+/-3), swing potential (+/-2)
#### 4.3.3 Villager:Werewolf ratio guidelines: 3:1 (no reveal), 3.5:1 (death reveal), 4:1 (full reveal with many special roles)
#### 4.3.4 Faction composition algorithm: constraint satisfaction ensuring weight sums balanced within epsilon
#### 4.3.5 Role assignment and balance validation code
### 4.4 Tells & Deception Tactics
#### 4.4.1 Soft tells: hesitation patterns, over-justification, vague language, tone shifts — moderate reliability
#### 4.4.2 Hard tells: contradictions with known facts, impossible claims, voting pattern inconsistencies — high reliability
#### 4.4.3 Meta reads: early accusation patterns, bandwagon timing, defense posturing, information claim credibility
#### 4.4.4 Deception-detection asymmetry: 93% truth-speaking rate vs 10% fabricated claim rate creates natural difficulty curve
### 4.5 Role Expansion Design
#### 4.5.1 Design pattern for new roles: ability specification, faction, power weight, AI prompt template, interaction rules
#### 4.5.2 Role compatibility matrix: which roles coexist without degenerate strategies
#### 4.5.3 Extended roles: Hunter (revenge kill), Fool (wins if executed), Mason (secret villager pair), Minion (knows wolves)

## 5. Chat & Communication System (~2,500 words, 6 tables, 6 code blocks, 4 diagrams)

### 5.1 Communication Architecture
#### 5.1.1 6-channel model: Global (day chat), Werewolf (night faction), Dead (spectator), System (announcements), Private (whisper), Moderator (AI narration)
#### 5.1.2 Delivery guarantees: ordered within channel (sequence numbers), at-least-once across reconnection (event log replay)
#### 5.1.3 Message persistence: in-game messages stored in event log, retrievable on reconnection, queryable for replay
### 5.2 Channel Specifications
#### 5.2.1 Global day chat: all living players, day phase only, free-form text, public visibility
#### 5.2.2 Werewolf night channel: Werewolf faction only, night phase, kill target coordination
#### 5.2.3 System channel: phase announcements, death reveals, vote results — server-generated, read-only
#### 5.2.4 Dead player chat: eliminated players only, spectator overlay, no living player visibility
#### 5.2.5 Channel permissions matrix: channel, eligible senders, eligible receivers, phase restriction, message type
### 5.3 Message Taxonomy
#### 5.3.1 Player messages: FreeText (chat), VoteDeclaration (nomination), Accusation (structured), Defense (structured), ClaimRole (Seer claim)
#### 5.3.2 System messages: PhaseChange, DeathAnnouncement, VoteTally, RoleReveal, GameResult
#### 5.3.3 AI messages: StructuredReasoning (internal), GeneratedSpeech (external), ActionSubmission
#### 5.3.4 Complete message type taxonomy table: type, sender, channel, schema, visibility, persistence
### 5.4 AI Speech Generation
#### 5.4.1 NLP pipeline: game context → personality filter → prompt construction → LLM generation → safety filter → delivery
#### 5.4.2 Tier-based speech: Tier 1 (canned phrases), Tier 2 (template + personality), Tier 3 (fully generated with context)
#### 5.4.3 Contextual awareness: AI references game events, player statements, voting patterns in generated speech
#### 5.4.4 Rate limiting: max 3 messages per discussion phase, minimum 5s between messages, anti-spam rules
### 5.5 Moderation & Safety
#### 5.5.1 4-tier moderation: T1 regex filter (0ms), T2 keyword classifier (10ms), T3 semantic analysis (50ms), T4 LLM review (2s)
#### 5.5.2 Moderation actions: allow, mask (replace), block (reject), flag (human review), escalating by severity
#### 5.5.3 AI safety: prompt-level refusal training, output guardrails, policy enforcement, no off-topic generation
#### 5.5.4 Moderation pipeline implementation code

## 6. UI/UX, Animations & Visual Effects (~2,200 words, 6 tables, 5 code blocks, 5 diagrams)

### 6.1 UI Architecture
#### 6.1.1 Screen inventory: Lobby, GameBoard (day/night variants), RoleReveal, VotingInterface, GameOver, Settings, SpectatorView
#### 6.1.2 Component hierarchy: shared (PlayerCard, ChatPanel, Timer) + screen-specific layouts
#### 6.1.3 Real-time sync: WebSocket events map to React state transitions with optimistic updates for voting
#### 6.1.4 Screen inventory table: screen, purpose, entry condition, exit condition, key components
### 6.2 Game Board Design
#### 6.2.1 Player card: avatar, name, role indicator (face-down while alive), living/eliminated state, voting target indicator
#### 6.2.2 Day layout: circular player grid, central chat panel, action bar (nominate/vote), phase timer
#### 6.2.3 Night layout: contextual action panel (role-specific), Werewolf chat overlay, target selection
#### 6.2.4 Information revelation: role reveal on death (card flip), Seer result overlay, final role exposure on game end
### 6.3 Animations & Visual Effects
#### 6.3.1 Day-to-night transition: 2s gradient shift from warm gold (#F5A623) to deep blue (#1A1A3E), ambient sound crossfade
#### 6.3.2 Death reveal: card flip animation (0.8s ease-out), dramatic spotlight dimming on eliminated player
#### 6.3.3 Voting tally: progressive vote counter with particle effects, final reveal with drumroll delay (1.5s)
#### 6.3.4 Animation specification table: animation, trigger, duration, easing, target elements
#### 6.3.5 CSS keyframe code examples for day/night transition and card flip
### 6.4 Accessibility
#### 6.4.1 WCAG 2.1 AA compliance: color contrast 4.5:1 minimum, keyboard navigation, ARIA labels for all interactive elements
#### 6.4.2 Accessible alternatives: audio cues for phase changes, text descriptions for animations, screen reader announcements for vote results
#### 6.4.3 Accessibility requirements table: requirement, implementation, verification method
### 6.5 Responsive Design
#### 6.5.1 Breakpoints: desktop (1280px+, primary), tablet (768px), mobile (375px, degraded but functional)
#### 6.5.2 Mobile adaptations: simplified player grid (2-column), collapsible chat drawer, touch-optimized voting buttons
#### 6.5.3 Minimum viable mobile: all game functions accessible, chat readable, voting functional

## 7. Game Modes & Customization (~2,200 words, 7 tables, 6 code blocks, 4 diagrams)

### 7.1 Standard Modes
#### 7.1.1 Classic mode: fixed roles (Villager, Werewolf, Seer), 8-12 players, standard phases, recommended for beginners
#### 7.1.2 Extended mode: adds Doctor, Hunter, Witch, 10-16 players, more strategic depth
#### 7.1.3 Quick Play: 6-8 players, accelerated timers (60s day, 30s night), simplified role set, rapid matchmaking
### 7.2 AI-Human Hybrid Modes
#### 7.2.1 Human + AI fill: human players joined by AI agents to reach minimum player count, configurable AI difficulty
#### 7.2.2 AI difficulty calibration: tier assignment linked to human player average ELO (below 1200 → Tier 1, 1200-1800 → Tier 2, 1800+ → Tier 3)
#### 7.2.3 Spectator mode: observe any active game, configurable delay (0s for finished games, 30s for live), full information overlay
#### 7.2.4 Mode comparison table: mode, player count, AI count, duration, ranked, role set
### 7.3 Custom Game Framework
#### 7.3.1 Host-customizable parameters: role set selection, player count (6-16), timer durations, victory conditions
#### 7.3.2 Balance validation: real-time balance score calculation, warnings for unbalanced configurations, suggested fixes
#### 7.3.3 Preset configurations: Beginner (5 Villagers, 2 Werewolves, 1 Seer), Balanced (3W, 1 Seer, 1 Witch, 1 Hunter, 5 Villagers), Chaos (maximum special roles)
#### 7.3.4 Mode configuration JSON schema with validation rules
### 7.4 Matchmaking & Ranked
#### 7.4.1 Quick Match: skill-based queue, <60s target wait time, bot backfill option
#### 7.4.2 Ranked mode: ELO-impacting, standard balance configurations, seasonal resets, rank tiers (Bronze to Master)
#### 7.4.3 Per-role ELO: individual skill rating per role played, composite score for matchmaking
### 7.5 Rules Engine
#### 7.5.1 Declarative rule definitions evaluated at runtime: phase rules, action rules, victory rules
#### 7.5.2 Rules engine pseudocode: rule loading, evaluation context, condition checking, action execution
#### 7.5.3 Custom house rules: host-defined overrides stored and validated against rules engine

## 8. AI-Only Simulation Mode (~2,800 words, 7 tables, 7 code blocks, 5 diagrams)

### 8.1 Simulation Architecture
#### 8.1.1 Batch runner: orchestrate N parallel AI-only games without human-facing game server overhead
#### 8.1.2 Headless execution: event sourcing enables deterministic replay and analysis; no WebSocket, direct function calls
#### 8.1.3 Parallelization: game instances run concurrently, no inter-game dependencies, horizontal scaling limited only by compute
#### 8.1.4 Simulation parameter table: parameter, range, default, description
### 8.2 Tournament Formats
#### 8.2.1 Round-robin: each agent plays against all others, fair but computationally expensive (O(n^2))
#### 8.2.2 Swiss system: 5-7 rounds, pairing by record, efficient for large agent pools
#### 8.2.3 Single elimination: bracket format, dramatic but high variance
#### 8.2.4 Tournament format specifications table
### 8.3 AI Benchmarking
#### 8.3.1 ELO-based ranking: per-role ELO tracking, cross-configuration comparison, confidence intervals
#### 8.3.2 Benchmark metrics: win rate by role, survival rounds, vote accuracy, deception success rate
#### 8.3.3 Benchmark metrics table: metric, definition, target value, measurement frequency
#### 8.3.4 ELO update algorithm code with per-role rating adjustment
### 8.4 Behavioral Metrics
#### 8.4.1 Social metrics: cooperation index, betrayal rate, alliance formation frequency
#### 8.4.2 Strategic metrics: vote accuracy, bluff success rate, claim consistency
#### 8.4.3 Communication metrics: message frequency, deception ratio, persuasive impact
#### 8.4.4 Performance metrics: win rate by role, average survival, cost per decision
#### 8.4.5 Complete behavioral metrics catalog table
### 8.5 LLM-as-a-Judge Evaluation
#### 8.5.1 Judge prompt design: game replay provided as context, evaluation rubric with 5 dimensions
#### 8.5.2 Evaluation dimensions: strategy soundness, social manipulation, consistency, creativity, fairness
#### 8.5.3 Consistency checking: 3 independent judge runs, inter-rater reliability >0.8 required
#### 8.5.4 LLM-as-Judge rubric table and prompt template code
### 8.6 Training Data Generation
#### 8.6.1 Event log to training data: filter relevant events, format as instruction-response pairs, annotate outcomes
#### 8.6.2 Dataset schema: game_state (input), agent_action (output), reward_value (label), role_context
#### 8.6.3 Data flywheel: simulation generates data → data improves models → better AI → more realistic simulations
#### 8.6.4 Training data export code

## 9. Data & Analytics (~2,200 words, 7 tables, 6 code blocks, 5 diagrams)

### 9.1 Data Model
#### 9.1.1 Core entities: Player, GameSession, GameEvent, AgentConfiguration, ELOHistory, AnalyticsAggregate
#### 9.1.2 Event store: append-only log with JSONB payload for flexible event types, partitioned by month
#### 9.1.3 Relational schema: normalized player and agent tables, foreign key relationships, indexed for query performance
#### 9.1.4 Entity relationship overview table
### 9.2 Analytics Pipeline
#### 9.2.1 Real-time pipeline: Redis Streams consumed by aggregation workers, incrementally updating metrics
#### 9.2.2 Batch pipeline: nightly ETL from event store to ClickHouse warehouse, complex aggregations
#### 9.2.3 Derived metrics: win rate trends, role balance over time, AI performance distribution, player retention
#### 9.2.4 Pipeline stages table: stage, input, output, frequency, technology
### 9.3 Matchmaking Analytics
#### 9.3.1 ELO system: per-player general ELO, per-role ELO for AI difficulty calibration
#### 9.3.2 Match quality: rating differential, role balance score, predicted fairness, queue time
#### 9.3.3 Matchmaking query code for real-time pairing decisions
### 9.4 AI Performance Analytics
#### 9.4.1 Agent dashboard: win rate by tier and role, cost per game, latency distribution, cache hit rate
#### 9.4.2 Prompt effectiveness: token usage, response quality scores, model selection distribution
#### 9.4.3 A/B testing: agent version comparison, statistical significance testing, rollout recommendations
#### 9.4.4 Dashboard metrics table
### 9.5 Data Retention & Privacy
#### 9.5.1 Retention: hot data (30 days Redis), warm data (90 days PostgreSQL), cold archive (ClickHouse, indefinite for research)
#### 9.5.2 GDPR compliance: player data export (30-day SLA), deletion right, consent tracking, anonymization
#### 9.5.3 Data anonymization: personal identifiers stripped from research datasets, pseudonymized player IDs

## 10. Development Roadmap (~1,500 words, 7 tables, 3 code blocks, 4 diagrams)

### 10.1 Phase 1: Foundation (Weeks 1-6)
#### 10.1.1 Core server: Node.js WebSocket game server, Redis state management, basic FSM (5 states)
#### 10.1.2 Basic gameplay: Villager + Werewolf + Seer roles, day/night cycle, voting, win detection
#### 10.1.3 Basic UI: React client, player grid, chat panel, lobby creation
#### 10.1.4 Milestone: working multiplayer game with 3 roles, no AI yet
### 10.2 Phase 2: AI Integration (Weeks 7-12)
#### 10.2.1 Three-tier agent system: rule-based + personality-driven + LLM integration via FastAPI
#### 10.2.2 Prompt management: role-specific templates, context assembly, JSON response parsing
#### 10.2.3 Cost optimization: caching layer, model routing, smart tiering
#### 10.2.4 Milestone: human vs AI games with all 3 agent tiers
### 10.3 Phase 3: Multiplayer & Polish (Weeks 13-18)
#### 10.3.1 Matchmaking: ELO system, 4 queue modes, ranked play
#### 10.3.2 Full role set: 12 roles with balance framework, custom game configuration
#### 10.3.3 Visual polish: animations, effects, spectator mode, replay system
#### 10.3.4 Milestone: production-ready platform with ranked multiplayer
### 10.4 Phase 4: Simulation & Scale (Weeks 19-24)
#### 10.4.1 AI-only simulation: batch runner, tournament formats, behavioral analytics
#### 10.4.2 Analytics suite: real-time dashboard, A/B testing, data pipeline
#### 10.4.3 Platform hardening: load testing, mobile optimization, accessibility, monitoring
#### 10.4.4 Milestone: fully featured platform with AI simulation and analytics
### 10.5 Risk Assessment
#### 10.5.1 Technical risks: LLM latency >5s, scaling costs exceeding $500/day, model availability changes
#### 10.5.2 Project risks: scope creep on AI features, balance issues requiring redesign, regulatory concerns on AI deception
#### 10.5.3 Risk assessment table: risk, probability, impact, mitigation, owner

## Appendix: Reference Materials (~1,500 words, 4 tables, 3 code blocks)

### A.1 API Reference
#### A.1.1 WebSocket API: message types (Action, Chat, Vote, PhaseAck), payload schemas, authentication (JWT)
#### A.1.2 AI Service REST API: /agent/init, /agent/decide, /agent/speak endpoints with request/response schemas
#### A.1.3 API endpoint reference table
### A.2 Glossary
#### A.2.1 Game terms: role names, phase names, faction concepts, action types, meta terms
#### A.2.2 Technical terms: event sourcing, GRPO, ReCon, ELO, polyglot, CQRS, A2A
#### A.2.3 Glossary table: term, definition, context
### A.3 Example Messages
#### A.3.1 WebSocket action message: JSON payload for a Werewolf night kill vote
#### A.3.2 AI service request: game state context with expected structured response
#### A.3.3 Event log entry: complete event with all required fields
### A.4 Configuration Reference
#### A.4.1 Environment variables: all service config options, defaults, validation rules
#### A.4.2 Game constants: default timers, balance thresholds, ELO K-factor, cache TTLs
#### A.4.3 Configuration reference table

# References
## werewolf_game_design.agent.outline.md
- **Type**: Report outline
- **Description**: Master outline for the Werewolf Game Platform design document
- **Path**: /mnt/agents/output/werewolf_game_design.agent.outline.md

## werewolf_outline_references_raw.md
- **Type**: Citation collection
- **Description**: All sources gathered during outline design and research phases
- **Path**: /mnt/agents/output/werewolf_outline_references_raw.md

## Research Dimension Files
- **Type**: Deep research artifacts
- **Description**: 10 dimension deep-dive files with structured evidence
- **Path**: /mnt/agents/output/research/werewolf_dim01.md through werewolf_dim10.md

## Wide Exploration Files
- **Type**: Wide exploration research
- **Description**: 5 facet-wide exploration summaries
- **Path**: /mnt/agents/output/research/werewolf_wide01.md through werewolf_wide05.md

## Cross-Verification
- **Type**: Evidence classification
- **Description**: Confidence tiers and conflict zone analysis
- **Path**: /mnt/agents/output/research/werewolf_cross_verification.md

## Insights
- **Type**: Cross-dimension synthesis
- **Description**: 10 non-obvious insights derived from research
- **Path**: /mnt/agents/output/research/werewolf_insight.md
