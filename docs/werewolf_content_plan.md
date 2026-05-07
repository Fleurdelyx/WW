# Werewolf Game Platform Technical Design Document — Chapter Content Plan

## Chapter 1: Executive Summary

### Specific Content Points
1.1 Project overview — a production-grade multiplayer Werewolf platform with AI-driven human-like NPC players
1.2 Architectural philosophy — authoritative server, event sourcing, polyglot backend, WebSocket-first real-time communication
1.3 AI differentiation — three agent types (NPC player, moderator, co-designer), A2A protocol, Big Five personality model, 70-85% cost reduction over naive LLM approaches
1.4 Game mechanics summary — 15-state FSM, 12+ roles with weightings, 3 standard presets, night/day phase resolution
1.5 Platform features — multiplayer matchmaking (4 modes), 6 chat channel types, spectator mode, replay system
1.6 AI-Only Simulation Mode — tournament formats, 25 behavioral metrics, LLM-as-a-Judge evaluation, data flywheel for model improvement
1.7 Technical highlights — Redis pub/sub orchestration, JSON action schemas, NLP generation pipeline, 4-tier moderation
1.8 Document structure guide — roadmap of remaining chapters

### Required Tables
| Table | Column Headers |
|---|---|
| T-1.1 | Platform Capability Summary — Capability, Status, Technology |
| T-1.2 | AI Agent Roles — Agent Type, Function, AI Model, Key Feature |
| T-1.3 | Game Preset Overview — Preset Name, Player Count, Role Composition, Estimated Duration |
| T-1.4 | Key Performance Metrics — Metric, Target, Measurement Method |

### Required Code Blocks
- **C-1.1**: Minimal JSON action schema example showing a werewolf night kill decision
- **C-1.2**: Pseudocode snippet demonstrating the core game loop state transitions

### Key Citations to Incorporate
- Cost reduction figure (70-85%) — reference Chapter 9 simulation optimization findings
- 15-state FSM — reference Chapter 4 formal specification
- Big Five personality model — reference Chapter 3 psychological foundation
- 25 behavioral metrics — reference Chapter 10 analytics framework
- 4-tier moderation — reference Chapter 6 chat system architecture

### Suggested Visuals/Diagrams
- **D-1.1**: ASCII system overview block diagram — Client (React) <-> API Gateway (WebSocket) <-> Game Server (Node.js) <-> AI Orchestrator (Python/Go) <-> LLM Provider
- **D-1.2**: ASCII data flow diagram — Game Event -> Event Sourcing Store -> Redis Pub/Sub -> AI Agent -> JSON Action -> Game State Update

### Cross-References
- Forward refs to: Ch2 (architecture), Ch3 (AI framework), Ch4 (game loop), Ch5 (roles), Ch6 (chat), Ch8 (game modes), Ch9 (simulation), Ch10 (analytics)
- All subsequent chapters reference back to Ch1 for scope context

---

## Chapter 2: System Architecture

### Specific Content Points
2.1 High-level architecture — 3-layer model (Presentation, Game Logic, AI/Orchestration), rationale for separation
2.2 Presentation layer — React-based client, real-time WebSocket connection, state synchronization protocol
2.3 Game logic layer — Node.js authoritative server, event sourcing store, Redis pub/sub for inter-service messaging, game state persistence
2.4 AI orchestration layer — Python/Go polyglot backend, agent lifecycle management, LLM provider abstraction, request batching and routing
2.5 Communication protocols — WebSocket message framing, heartbeat/keepalive, reconnection strategy, message ordering guarantees
2.6 Event sourcing design — event log structure, snapshotting strategy, replay capability, event schema versioning
2.7 Redis pub/sub topology — channel naming conventions, message types, consumer groups, backpressure handling
2.8 Deployment topology — containerized services, horizontal scaling strategy, LLM provider failover
2.9 Security model — input validation, rate limiting, anti-cheating on authoritative server, action signature verification
2.10 Performance targets — latency budgets per operation type, concurrent game capacity, LLM response time SLAs

### Required Tables
| Table | Column Headers |
|---|---|
| T-2.1 | Layer Responsibilities — Layer, Primary Language, Core Responsibility, Scaling Strategy |
| T-2.2 | WebSocket Message Types — Type, Direction, Payload Schema, Trigger Condition |
| T-2.3 | Redis Channel Topology — Channel Name, Producer, Consumers, Message Format |
| T-2.4 | Event Log Schema — Field, Type, Description, Example |
| T-2.5 | Latency Budgets — Operation, Target Latency (ms), SLA Percentile, Optimization Strategy |
| T-2.6 | Technology Stack — Component, Technology, Version, Rationale |

### Required Code Blocks
- **C-2.1**: TypeScript WebSocket message interface definitions (client/server shared types)
- **C-2.2**: Redis pub/sub producer/consumer example in Node.js
- **C-2.3**: Event sourcing event store append and snapshot retrieval (pseudocode)
- **C-2.4**: Game state delta calculation and broadcast logic

### Key Citations to Incorporate
- Polyglot backend rationale — Python for ML/AI, Node.js for I/O, Go for performance-critical paths
- Event sourcing pattern — enables replay, debugging, audit trail
- Redis pub/sub — decouples game logic from AI orchestration
- Authoritative server — prevents client-side cheating

### Suggested Visuals/Diagrams
- **D-2.1**: ASCII 3-layer architecture diagram with arrows showing data flow between layers
- **D-2.2**: ASCII event sourcing timeline — Events E1..En -> Snapshot at S -> Events En+1..Em
- **D-2.3**: ASCII Redis channel topology — publishers, channels, subscriber groups
- **D-2.4**: ASCII deployment diagram — Load Balancer -> Game Server Instances -> Redis Cluster -> AI Orchestrator Pods -> LLM Provider

### Cross-References
- Forward refs to: Ch3 (AI orchestrator implementation), Ch4 (game loop server logic), Ch6 (WebSocket chat transport), Ch7 (client architecture), Ch8 (matchmaking service)
- Back refs from: Ch3 (AI layer sits on this architecture), Ch4 (game server uses event sourcing), Ch9 (simulation uses same infrastructure)

---

## Chapter 3: AI Player Framework

### Specific Content Points
3.1 Framework overview — three agent types (NPC Player, Moderator, Co-Designer), their roles and interactions
3.2 Agent definitions — NPC Player (participates in game), Moderator (enforces rules, narrates), Co-Designer (generates content, balances)
3.3 A2A (Agent-to-Agent) protocol — message format, discovery mechanism, negotiation patterns, action commitment flow
3.4 NPC player architecture — perception module, memory module (STM/LTM/episodic/semantic), reasoning engine, action selector
3.5 Big Five personality model — Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism; mapping to game behavior; personality configuration per role
3.6 Memory system — short-term (current game), long-term (player models), episodic (specific events), semantic (general knowledge); decay and consolidation
3.7 ReCon dual-perspective reasoning — self-perspective vs. observer perspective; when each activates; integration with action selection
3.8 Suspicion scoring — mathematical formulation, evidence accumulation, threshold-based action triggers, false positive handling
3.9 Action schema system — JSON schema definitions for each action type; validation; how schemas constrain LLM output
3.10 Cost optimization — tiered model selection (small/fast for simple, large for complex), prompt caching, response parsing, batching; 70-85% cost reduction breakdown
3.11 LLM provider abstraction — unified interface, provider switching, fallback chains, token budget management
3.12 Agent lifecycle — initialization, warm-up, active play, graceful degradation, termination

### Required Tables
| Table | Column Headers |
|---|---|
| T-3.1 | Agent Type Comparison — Agent Type, Role in Game, AI Model Tier, Key Capabilities |
| T-3.2 | Big Five to Game Behavior Mapping — Trait, High Score Behavior, Low Score Behavior, Game Impact |
| T-3.3 | Memory Type Specifications — Memory Type, Capacity, Decay Rate, Storage Format, Retrieval Trigger |
| T-3.4 | Action Schema Catalog — Action Type, Schema Fields, Valid Values, Validation Rules |
| T-3.5 | Cost Optimization Techniques — Technique, Description, Cost Saving, Implementation Complexity |
| T-3.6 | LLM Provider Configuration — Provider, Model, Use Case, Max Tokens, Fallback Order |

### Required Code Blocks
- **C-3.1**: A2A protocol message structure (JSON schema)
- **C-3.2**: NPC player action schema — werewolf vote, seer check, villager accusation examples
- **C-3.3**: Big Five personality configuration object
- **C-3.4**: Suspicion score calculation pseudocode
- **C-3.5**: Memory retrieval and consolidation logic (STM to LTM promotion)
- **C-3.6**: ReCon dual-perspective reasoning prompt template
- **C-3.7**: LLM provider abstraction interface (Python)

### Key Citations to Incorporate
- Big Five personality model — Costa & McCrae psychological foundation
- A2A protocol — inspired by Google's Agent-to-Agent protocol draft
- ReCon reasoning — dual-perspective cognitive theory applied to deception games
- Cost reduction methodology — tiered prompting, model cascading, structured output parsing
- 70-85% figure — benchmarked against naive single-model approaches

### Suggested Visuals/Diagrams
- **D-3.1**: ASCII agent interaction diagram — NPC Player <-> Moderator <-> Co-Designer via A2A protocol
- **D-3.2**: ASCII NPC player internal architecture — Perception -> Memory (STM/LTM) -> Reasoning (ReCon) -> Action Selector -> JSON Output
- **D-3.3**: ASCII memory hierarchy — STM (current game, decaying) -> Episodic (key events) -> LTM (player models) + Semantic (game knowledge)
- **D-3.4**: ASCII cost optimization pipeline — Request Classification -> Model Selection (small/medium/large) -> Caching Check -> LLM Call -> Parsed Output

### Cross-References
- Forward refs to: Ch4 (game loop triggers AI actions), Ch5 (role-specific AI behavior), Ch6 (chat generation pipeline), Ch9 (simulation uses same agents), Ch10 (behavioral metrics from AI)
- Back refs from: Ch1 (AI capabilities overview), Ch4 (AI actions are called from game states), Ch5 (role-specific prompts), Ch6 (NLP generation)

---

## Chapter 4: Game Loop & Phase Management

### Specific Content Points
4.1 Core game loop — 15-state finite state machine (FSM), state definitions, transitions, terminal states
4.2 State definitions — Lobby, NightStart, WerewolfPhase, SeerPhase, WitchPhase, HunterPhase, NightEnd, DayStart, Discussion, Nomination, Defense, Voting, Execution, GameOver, Cleanup
4.3 Transition logic — conditions for each state transition, timeout handling, player-driven vs. system-driven transitions
4.4 Night phase resolution — 11-category resolution system, category definitions, resolution order, priority rules
4.5 Category definitions — WerewolfKill, SeerCheck, WitchSave, WitchKill, HunterRevenge, CupidLink, BodyguardProtect, ElderProtection, ThiefSteal, PiperCharm, Scapegoat — each with detailed resolution
4.6 Timing configuration — per-phase timeout defaults, player count scaling, configurable game speed presets
4.7 Deadlock prevention — identification of deadlock scenarios, timeout escalation, forced progression, safe state recovery
4.8 Concurrent action handling — how multiple simultaneous actions are ordered and resolved, race condition prevention
4.9 Event log during gameplay — what is logged, log format, real-time vs. deferred logging
4.10 State machine implementation — event-driven vs. polling, state persistence, crash recovery, state validation invariants
4.11 Spectator mode integration — how spectators receive state updates, delay handling, replay sync points

### Required Tables
| Table | Column Headers |
|---|---|
| T-4.1 | Complete State Machine — State ID, State Name, Enter Condition, Exit Conditions, Timeout (s) |
| T-4.2 | State Transition Matrix — From State, To State, Trigger, Condition, Timeout Action |
| T-4.3 | Night Resolution Categories — Category, Priority, Initiator, Effect, Counter-interactions |
| T-4.4 | Timing Configuration Defaults — Phase, Base Timeout (s), Per-Player Additive (s), Fast/Medium/Slow Preset |
| T-4.5 | Deadlock Scenarios — Scenario, Detection Method, Resolution Strategy, Fallback State |
| T-4.6 | Concurrent Action Resolution Order — Priority, Action Type, Resolution Rule, Example Conflict |

### Required Code Blocks
- **C-4.1**: FSM state definition enum and transition function skeleton
- **C-4.2**: State transition validation function with all rules
- **C-4.3**: Night resolution category executor — iterates categories in priority order, applies effects
- **C-4.4**: Timing configuration object with scaling formula
- **C-4.5**: Deadlock detection and forced progression handler
- **C-4.6**: Event log entry structure and append function
- **C-4.7**: Concurrent action merge and resolution algorithm

### Key Citations to Incorporate
- 15-state FSM — formally specified with complete transition matrix
- 11-category night resolution — each category has deterministic resolution rules
- Deadlock prevention — analyzed from Mafia/Werewolf tournament rule sets
- Timing configs — player-tested for engagement vs. pace balance

### Suggested Visuals/Diagrams
- **D-4.1**: ASCII complete state machine diagram — all 15 states as boxes, transitions as labeled arrows, including timeout edges
- **D-4.2**: ASCII night resolution pipeline — Category 1 (priority N) -> Category 2 (priority N-1) -> ... -> Final resolution state
- **D-4.3**: ASCII timing diagram — timeline showing night phases with configurable durations and overlap potential
- **D-4.4**: ASCII deadlock detection flowchart — scenario identification -> timeout check -> escalation -> forced progression

### Cross-References
- Forward refs to: Ch5 (role abilities define night categories), Ch6 (chat is gated by game state), Ch7 (UI reflects current state), Ch8 (game modes use same loop)
- Back refs from: Ch1 (game loop overview), Ch2 (game server implements this FSM), Ch3 (AI agents receive state triggers), Ch5 (role abilities map to categories)

---

## Chapter 5: Roles & Meta Design

### Specific Content Points
5.1 Role system overview — 12+ distinct roles, categorization by team (Werewolf/Villager/Neutral), information asymmetry design
5.2 Villager-aligned roles — Villager, Seer, Witch, Hunter, Bodyguard, Elder, Cupid — abilities, usage constraints, strategic value
5.3 Werewolf-aligned roles — Werewolf, Alpha Wolf, Minion — abilities, coordination requirements, information advantage
5.4 Neutral roles — Thief, Piper, Scapegoat, Fool (if included) — win conditions, special mechanics
5.5 Role weighting system — numeric power ratings per role, derived from win rate data, sensitivity analysis
5.6 Balance formula — mathematical model for team composition balance, weight sum equations, acceptable deviation thresholds
5.7 Standard presets — 8-player (beginner), 12-player (standard), 16-player (advanced) — exact compositions, rationale
5.8 Meta strategies — emergent patterns, optimal play analysis, counter-strategies, meta evolution tracking
5.9 Role interaction matrix — how every pair of roles interacts, special case rules, edge case handling
5.10 Custom role creation framework — Co-Designer agent generates balanced roles, evaluation criteria, community submission pipeline
5.11 Dynamic balance adjustment — how simulation data feeds back into weight adjustments, automated rebalancing triggers

### Required Tables
| Table | Column Headers |
|---|---|
| T-5.1 | Complete Role Catalog — Role Name, Team, Ability, Night Action, Weight, Complexity |
| T-5.2 | Role Weighting Values — Role, Win Rate (%), Derived Weight, Confidence Interval, Sample Size |
| T-5.3 | Team Balance Formula — Preset, Villager Weight Sum, Werewolf Weight Sum, Deviation, Acceptable Range |
| T-5.4 | Standard Presets — Preset Name, Player Count, Role List, Estimated Duration, Difficulty |
| T-5.5 | Role Interaction Matrix — Role A, Role B, Interaction Type, Resolution Rule, Example |
| T-5.6 | Meta Strategy Evolution — Time Period, Dominant Strategy, Counter-Strategy, Win Rate Impact |

### Required Code Blocks
- **C-5.1**: Role definition data structure with abilities, constraints, and weight
- **C-5.2**: Balance validation function — checks weight sums within acceptable deviation
- **C-5.3**: Preset configuration object (8p/12p/16p)
- **C-5.4**: Night action resolution for a multi-role interaction example (Witch + Hunter)
- **C-5.5**: Weight adjustment algorithm based on simulation win rate feedback

### Key Citations to Incorporate
- 12+ roles — expanded from classic Werewolf/Mafia with modern asymmetric design influences
- Balance formula — derived from competitive balance theory (similar to Dota 2/LoL balancing)
- Meta strategies — informed by social deduction game tournament analysis
- Dynamic balance — feedback loop from Ch9 simulation data

### Suggested Visuals/Diagrams
- **D-5.1**: ASCII role team alignment diagram — Villagers (blue), Werewolves (red), Neutral (gray) with role icons/names
- **D-5.2**: ASCII information asymmetry chart — what each team knows at game start
- **D-5.3**: ASCII balance formula diagram — Villager Sum = Werewolf Sum +/- Epsilon
- **D-5.4**: ASCII meta evolution timeline — strategy dominance shifts over time periods

### Cross-References
- Forward refs to: Ch4 (night resolution uses role abilities), Ch7 (role cards UI), Ch8 (custom games use role selection), Ch9 (simulation tests balance), Ch10 (win rates by role tracked)
- Back refs from: Ch1 (role system summary), Ch3 (AI behavior varies by role), Ch4 (categories map to role abilities)

---

## Chapter 6: Chat & Communication System

### Specific Content Points
6.1 Chat architecture overview — 6 channel types, message routing, WebSocket transport, NLP generation pipeline
6.2 Channel types — Global (all players), Team (faction-only), Dead (eliminated players), Private (1-on-1), System (game announcements), Spectator (observer chat)
6.3 Channel access control — who can read/write per channel, per-game-state restrictions (e.g., dead can't talk to living)
6.4 Message schemas — 9 distinct message types, JSON schema for each, validation rules
6.5 Message type definitions — ChatMessage, SystemAnnouncement, VoteDeclaration, Accusation, Defense, Whisper, Emote, RoleReveal, ModeratorNarration
6.6 NLP generation pipeline — how AI players generate natural language from structured actions, prompt engineering, context window management
6.7 AI chat behavior — personality-inflected responses, strategic vs. social speech, timing and verbosity control
6.8 Four-tier moderation — Tier 1 (regex filter), Tier 2 (keyword ML), Tier 3 (contextual semantic), Tier 4 (human review queue)
6.9 Moderation pipeline — message ingestion -> tier progression -> action (allow/mask/block/flag) -> logging
6.10 Whisper/PM system — delivery guarantees, read receipts, privacy rules, evidence of whispering
6.11 Chat history API — pagination, filtering, export for replay, retention policy
6.12 Multi-language support — i18n framework, LLM prompt adaptation, RTL considerations

### Required Tables
| Table | Column Headers |
|---|---|
| T-6.1 | Channel Type Definitions — Channel, Visibility, Read Access, Write Access, Game State Restriction |
| T-6.2 | Message Schema Catalog — Message Type, Schema Fields, Sender Rules, Channel |
| T-6.3 | Moderation Tier Details — Tier, Method, Latency, Coverage, Action Types |
| T-6.4 | NLP Generation Pipeline Stages — Stage, Input, Process, Output, Latency Budget |
| T-6.5 | Chat Access Matrix by Game State — Game State, Global, Team, Dead, Private, Spectator |
| T-6.6 | Message Type Routing — Message Type, Source Channel, Destination Channels, Delivery Mode |

### Required Code Blocks
- **C-6.1**: Message schema definitions (TypeScript interfaces for all 9 types)
- **C-6.2**: Channel access control middleware — checks permissions per message
- **C-6.3**: NLP generation prompt template for AI player chat
- **C-6.4**: Four-tier moderation pipeline implementation
- **C-6.5**: WebSocket message broadcast with channel filtering
- **C-6.6**: Chat history query with pagination and filters

### Key Citations to Incorporate
- 6 channel types — adapted from standard social deduction game communication patterns
- 4-tier moderation — inspired by Discord/Reddit trust-and-safety architectures
- NLP pipeline — fine-tuned LLM with constrained decoding for game-appropriate output
- 9 message schemas — covers complete Werewolf communication taxonomy

### Suggested Visuals/Diagrams
- **D-6.1**: ASCII channel topology — 6 channels as circles, players positioned by access, arrows showing message flow
- **D-6.2**: ASCII moderation pipeline — Message -> T1 (regex) -> T2 (ML keyword) -> T3 (semantic) -> T4 (human) -> Action
- **D-6.3**: ASCII NLP generation flow — Structured Action -> Context Assembly -> Prompt Construction -> LLM Generation -> Post-processing -> Chat Message
- **D-6.4**: ASCII access matrix heatmap — Game States x Channel Types, colored by read/write/none access

### Cross-References
- Forward refs to: Ch7 (chat UI rendering), Ch8 (custom chat rules in game modes), Ch9 (chat patterns in simulation metrics), Ch10 (chat analytics)
- Back refs from: Ch1 (chat system summary), Ch2 (WebSocket transport), Ch3 (AI generates chat via NLP pipeline), Ch4 (chat gated by game state)

---

## Chapter 7: UI/UX, Animations & Visual Effects

### Specific Content Points
7.1 Design philosophy — dark fantasy theme, immersive atmosphere, information hierarchy, accessibility compliance
7.2 Color system — day/night palette, team color coding (villager blue, werewolf red, neutral gray), semantic colors (danger, warning, info, success)
7.3 Typography — heading hierarchy, monospace for game logs, readable sizes, contrast ratios
7.4 Layout architecture — responsive grid, game board view, player card grid, chat panel, action bar, minimap/overview
7.5 Day/night transitions — animated phase changes, ambient lighting effects, sound cues, duration
7.6 Voting animations — vote casting visual, tally counter, reveal sequence, elimination animation
7.7 Role reveal effects — card flip animation, dramatic reveal sequence, sound design, particle effects
7.8 Player card design — avatar, name, status indicators (alive/dead, role known/unknown), interaction affordances
7.9 Action UI — context-sensitive action buttons, confirmation dialogs, cooldown indicators, quick action shortcuts
7.10 Chat UI — message bubbles, channel tabs, typing indicators, message history scroll, @mentions
7.11 Spectator mode UI — information overlay (full knowledge), player thought indicators, timeline scrubber
7.12 Animation system — CSS transitions, WebGL effects for particles, timeline sequencing, performance optimization
7.13 Accessibility — WCAG 2.1 AA compliance, screen reader support, keyboard navigation, color-blind mode, reduced motion option
7.14 Mobile responsiveness — touch targets, swipe gestures, collapsed layouts, portrait/landscape adaptation
7.15 Component library — design tokens, reusable components, theming system, dark/light mode

### Required Tables
| Table | Column Headers |
|---|---|
| T-7.1 | Color System Specification — Token, Day Value, Night Value, Usage, Contrast Ratio |
| T-7.2 | Animation Inventory — Animation, Trigger, Duration (ms), Easing, Performance Budget |
| T-7.3 | Screen Layout Breakpoints — Breakpoint, Layout, Visible Panels, Action Bar Position |
| T-7.4 | UI Component Catalog — Component, Props, States, Accessibility Requirements |
| T-7.5 | Sound Cue Mapping — Game Event, Sound Type, Duration, Priority, Fallback |
| T-7.6 | Accessibility Feature Matrix — Feature, WCAG Criterion, Implementation, Testing Method |

### Required Code Blocks
- **C-7.1**: CSS design token definitions (color, spacing, typography)
- **C-7.2**: Day/night transition animation keyframes
- **C-7.3**: Voting animation sequence — React component with state machine
- **C-7.4**: Responsive layout grid component
- **C-7.5**: Accessibility hook — prefers-reduced-motion, high-contrast detection

### Key Citations to Incorporate
- Dark fantasy theme — genre conventions from tabletop Werewolf, Blood on the Clocktower
- WCAG 2.1 AA — legal and ethical accessibility standard
- Animation performance — 60fps target, GPU-accelerated transforms only
- Mobile-first responsive — 30%+ of players expected on mobile devices

### Suggested Visuals/Diagrams
- **D-7.1**: ASCII wireframe — main game screen layout (desktop), annotated with component names
- **D-7.2**: ASCII wireframe — main game screen layout (mobile), stacked panels
- **D-7.3**: ASCII day/night transition visual — gradient shift from warm to cool palette
- **D-7.4**: ASCII voting animation storyboard — 5 frames showing vote accumulate -> tally -> reveal
- **D-7.5**: ASCII player card states — alive/hidden, alive/revealed, dead, highlighted (targeted)

### Cross-References
- Forward refs to: Ch8 (game mode UI variations), Ch10 (heatmap data informs UI placement)
- Back refs from: Ch1 (UI/UX highlights), Ch2 (client architecture), Ch4 (UI reflects game state), Ch6 (chat UI implementation)

---

## Chapter 8: Game Modes & Customization

### Specific Content Points
8.1 Multiplayer lobby system — 6-state lobby FSM, room creation, join flow, ready check, host controls
8.2 Lobby states — Idle, Creating, Waiting, Ready, Starting, Closing — transitions, timeout behaviors
8.3 Matchmaking modes — 4 modes: Quick Match (skill-based), Ranked (ELO), Custom (player-configured), Tournament (bracket)
8.4 Quick Match — MMR-based pairing, queue timeout, bot backfill option, casual play
8.5 Ranked mode — ELO rating system, K-factor tuning, placement matches, seasonal resets, rank tiers
8.6 Per-role ELO tracking — individual skill ratings per role played, role-specific MMR, composite score calculation
8.7 Custom games — host-configured rules, role selection, timing overrides, password protection, invite links
8.8 Tournament mode — bracket generation, seeding algorithms, best-of configurations, scheduling, observer access
8.9 Spectator mode — full information view, replay controls, delay settings, broadcast overlays
8.10 Replay system — event log playback, speed controls, pause/step, annotation, shareable links
8.11 Game rule customization — timing adjustments, role inclusion/exclusion, win condition variants, special rules
8.12 Player progression — experience points, achievement system, unlockable cosmetics, statistics dashboard
8.13 Social features — friend list, party system, recent players, block/mute, player reputation

### Required Tables
| Table | Column Headers |
|---|---|
| T-8.1 | Lobby State Machine — State, Enter Condition, Exit Conditions, Timeout, Host Actions |
| T-8.2 | Matchmaking Mode Comparison — Mode, Queue Type, ELO Impact, Player Count, Duration |
| T-8.3 | ELO Rating Formula Parameters — Parameter, Value, Description, Rationale |
| T-8.4 | Rank Tiers — Tier Name, ELO Range, Badge, Season Reward |
| T-8.5 | Custom Game Options — Option, Type, Default, Range, Description |
| T-8.6 | Tournament Bracket Formats — Format, Player Count, Seeding, Match Format, Duration Estimate |
| T-8.7 | Player Progression System — Level, XP Required, Unlock, Cosmetic Reward |

### Required Code Blocks
- **C-8.1**: Lobby FSM state definitions and transition logic
- **C-8.2**: ELO rating calculation with per-role tracking
- **C-8.3**: Matchmaking queue service — enqueue, match, dequeue logic
- **C-8.4**: Tournament bracket generation algorithm
- **C-8.5**: Replay event stream player — load, play, pause, seek implementation
- **C-8.6**: Custom game configuration validation

### Key Citations to Incorporate
- 6-state lobby FSM — inspired by Among Us and Secret Hitler lobby patterns
- 4 matchmaking modes — covers casual to competitive spectrum
- ELO with per-role tracking — innovation over standard single-rating systems
- Tournament formats — single elimination, double elimination, round-robin, Swiss

### Suggested Visuals/Diagrams
- **D-8.1**: ASCII lobby FSM diagram — 6 states with transition arrows and timeout edges
- **D-8.2**: ASCII matchmaking flow — Queue -> MMR Filter -> Pool -> Match -> Lobby
- **D-8.3**: ASCII ELO calculation diagram — show Rating Change formula with inputs (Expected, Actual, K-factor, Role weight)
- **D-8.4**: ASCII tournament bracket example — 8-player single elimination bracket

### Cross-References
- Forward refs to: Ch9 (tournament mode enables simulation events), Ch10 (player stats feed progression)
- Back refs from: Ch1 (game modes overview), Ch2 (lobby/matchmaking services), Ch4 (game loop launched from lobby), Ch5 (role selection in custom games), Ch7 (mode-specific UI)

---

## Chapter 9: AI-Only Simulation Mode

### Specific Content Points
9.1 Simulation mode purpose — data generation, balance testing, strategy discovery, model evaluation, cost-effective experimentation
9.2 Tournament formats — round-robin, Swiss system, single elimination, ladder, free-for-all, structured league
9.3 Agent configuration — personality distribution, role assignment strategies, skill level calibration
9.4 25 behavioral metrics — detailed enumeration of each metric, measurement method, categorization
9.5 Metric categories — Social (cooperation, betrayal), Strategic (vote accuracy, bluff success), Communication (message frequency, deception ratio), Performance (win rate, survival time), Meta (adaptation, strategy diversity)
9.6 LLM-as-a-Judge evaluation framework — judge prompt design, evaluation rubric, consistency checking, bias mitigation
9.7 Judge evaluation dimensions — strategy soundness, social manipulation, consistency, creativity, fairness
9.8 Data pipeline — simulation run -> raw logs -> metric extraction -> aggregation -> visualization -> feedback loop
9.9 Data flywheel — simulation generates data -> data improves models -> better AI -> more realistic simulations
9.10 Balance testing methodology — controlled experiments, A/B testing for role changes, statistical significance
9.11 Strategy discovery — emergent strategy identification, pattern clustering, strategy cataloging
9.12 Cost analysis of simulation — per-game token cost, batch optimization, cost vs. insight tradeoff
9.13 Simulation scaling — parallel game execution, result aggregation, convergence detection
9.14 Replay generation — simulation games as replayable content, highlight extraction, anomaly detection

### Required Tables
| Table | Column Headers |
|---|---|
| T-9.1 | Tournament Format Specifications — Format, Rounds, Pairing Algorithm, Advancement, Use Case |
| T-9.2 | Complete Behavioral Metrics Catalog — Metric ID, Name, Category, Measurement Method, Scale, Interpretation |
| T-9.3 | LLM-as-Judge Rubric — Dimension, Criteria, Score Range, Example High/Low, Weight |
| T-9.4 | Data Pipeline Stages — Stage, Input, Process, Output, Storage |
| T-9.5 | Simulation Configuration Parameters — Parameter, Type, Default, Range, Impact |
| T-9.6 | Cost Analysis per Simulation Run — Format, Games, Avg Tokens/Game, Total Cost, Insight Yield |
| T-9.7 | Convergence Criteria — Metric, Threshold, Sample Size Required, Check Frequency |

### Required Code Blocks
- **C-9.1**: Tournament orchestrator — runs N games with specified format
- **C-9.2**: Behavioral metric extraction from game logs
- **C-9.3**: LLM-as-Judge prompt template with evaluation rubric
- **C-9.4**: Data pipeline aggregation and convergence detection
- **C-9.5**: Simulation game runner — parallel execution with shared configuration
- **C-9.6**: Strategy clustering algorithm — identifies emergent patterns from action sequences
- **C-9.7**: Cost tracker — logs token usage per agent type per game phase

### Key Citations to Incorporate
- 25 behavioral metrics — comprehensive taxonomy covering social deduction game research
- LLM-as-a-Judge — methodology adapted from LMSYS Arena and MT-Bench evaluation
- Data flywheel — closed-loop improvement cycle for AI agents
- Cost optimization — simulation runs on cheaper models, only validation uses premium models
- Tournament formats — adapted from chess and esports competitive structures

### Suggested Visuals/Diagrams
- **D-9.1**: ASCII data flywheel diagram — Simulation -> Data -> Training -> Improved AI -> Better Simulation
- **D-9.2**: ASCII behavioral metrics radar chart description — 5 axes (Social, Strategic, Communication, Performance, Meta)
- **D-9.3**: ASCII data pipeline — Game Logs -> Extract -> Metrics -> Aggregate -> Visualize -> Feedback
- **D-9.4**: ASCII LLM-as-Judge pipeline — Game Replay -> Judge Prompt -> LLM Evaluation -> Scored Dimensions -> Report
- **D-9.5**: ASCII simulation scaling architecture — Master Controller -> N Game Workers -> Result Aggregator -> Dashboard

### Cross-References
- Forward refs to: Ch10 (simulation data feeds analytics), Ch11 (simulation informs roadmap priorities)
- Back refs from: Ch1 (simulation mode highlights), Ch3 (uses same AI agents), Ch5 (balance testing), Ch8 (tournament mode reuse)

---

## Chapter 10: Data & Analytics

### Specific Content Points
10.1 Analytics architecture — data collection points, ingestion pipeline, storage, query interface, visualization
10.2 Data collection schema — game events, player actions, chat messages, AI decisions, performance metrics
10.3 Game outcome analytics — win rates by role, by team composition, by preset, statistical significance testing
10.4 Player behavior analytics — action frequency, decision timing, chat patterns, voting patterns, social network analysis
10.5 AI performance analytics — decision quality, deception detection rate, win rate by personality config, cost per decision
10.6 Heatmaps and visualizations — vote distribution maps, suspicion network graphs, action timing distributions
10.7 Time-series analysis — meta trend detection, balance drift identification, seasonal patterns
10.8 A/B testing framework — experiment design, hypothesis formulation, randomization, statistical testing
10.9 Reporting system — automated reports, dashboard widgets, alert thresholds, scheduled exports
10.10 Data retention and privacy — GDPR compliance, anonymization, retention schedules, data deletion
10.11 Real-time analytics — live game monitoring, anomaly detection, operational dashboards
10.12 Export and API — data export formats, REST API endpoints, query language, rate limits

### Required Tables
| Table | Column Headers |
|---|---|
| T-10.1 | Data Collection Schema — Event Type, Fields, Frequency, Storage, Retention |
| T-10.2 | Core Analytics Metrics — Metric, Category, Calculation, Update Frequency, Visualization |
| T-10.3 | Win Rate Analysis Dimensions — Dimension, Granularity, Statistical Method, Significance Threshold |
| T-10.4 | A/B Testing Framework — Component, Description, Configuration, Analysis Method |
| T-10.5 | Data Retention Policy — Data Type, Retention Period, Anonymization Level, Deletion Trigger |
| T-10.6 | API Endpoint Catalog — Endpoint, Method, Parameters, Response Schema, Rate Limit |
| T-10.7 | Alert Thresholds — Metric, Warning Threshold, Critical Threshold, Notification Channel |

### Required Code Blocks
- **C-10.1**: Game event data structure (typed schema for all collectible events)
- **C-10.2**: Win rate calculation with confidence intervals
- **C-10.3**: Suspicion network graph construction from voting/chat data
- **C-10.4**: A/B test statistical significance calculator (chi-square, t-test)
- **C-10.5**: Time-series anomaly detection (simple statistical method)
- **C-10.6**: Data anonymization function for GDPR compliance

### Key Citations to Incorporate
- 25 behavioral metrics from Ch9 — integrated into analytics dashboard
- Statistical significance — proper hypothesis testing for balance claims
- GDPR compliance — EU data protection requirements for player data
- Real-time monitoring — operational necessity for production multiplayer service

### Suggested Visuals/Diagrams
- **D-10.1**: ASCII analytics pipeline — Collect -> Ingest -> Store -> Process -> Visualize -> Alert
- **D-10.2**: ASCII suspicion network graph — nodes as players, edge weights as suspicion scores, directed arrows
- **D-10.3**: ASCII win rate heatmap — Role x Role Composition matrix with color-coded win percentages
- **D-10.4**: ASCII dashboard layout — KPI cards at top, time-series charts middle, detailed tables bottom
- **D-10.5**: ASCII data retention timeline — event creation -> hot storage -> warm -> anonymized cold -> deletion

### Cross-References
- Forward refs to: Ch11 (analytics inform roadmap decisions), Ch5 (balance data from analytics)
- Back refs from: Ch1 (analytics summary), Ch2 (data collection infrastructure), Ch3 (AI performance tracked), Ch8 (player stats), Ch9 (simulation metrics aggregation)

---

## Chapter 11: Development Roadmap

### Specific Content Points
11.1 Roadmap overview — 24-week phased delivery, 4 major milestones, risk mitigation strategy
11.2 Phase 1 (Weeks 1-6): Foundation — core game server, basic FSM, WebSocket infrastructure, simple villager/werewolf roles, basic UI
11.3 Phase 2 (Weeks 7-12): AI Integration — NPC player agent, A2A protocol, Big Five personality, memory system, NLP chat generation
11.4 Phase 3 (Weeks 13-18): Multiplayer & Polish — matchmaking, ELO system, spectator mode, replay system, animation system, moderation
11.5 Phase 4 (Weeks 19-24): Advanced Features — simulation mode, tournament system, analytics dashboard, custom role framework, mobile optimization
11.6 Milestone definitions — acceptance criteria per milestone, demo deliverables, QA gates
11.7 Dependency graph — task dependencies, critical path, parallel workstreams, resource allocation
11.8 Risk assessment — technical risks (LLM latency, scaling), design risks (balance issues), schedule risks, mitigation plans
11.9 Team structure — recommended team composition, skill requirements, workstream assignments
11.10 Definition of Done — code review, testing (unit/integration/E2E), documentation, performance benchmark, accessibility check
11.11 Post-launch plan — live operations, content updates, community feedback integration, seasonal events

### Required Tables
| Table | Column Headers |
|---|---|
| T-11.1 | 24-Week Roadmap — Week, Phase, Deliverables, Dependencies, Success Criteria |
| T-11.2 | Milestone Definitions — Milestone, Date, Deliverables, Acceptance Criteria, Demo |
| T-11.3 | Dependency Graph — Task, Depends On, Duration, Assigned Workstream, Critical Path |
| T-11.4 | Risk Register — Risk ID, Category, Description, Probability, Impact, Mitigation, Owner |
| T-11.5 | Team Composition — Role, Count, Skills, Workstream, Start Week |
| T-11.6 | Definition of Done Checklist — Category, Item, Verification Method, Tool |
| T-11.7 | Post-Launch Content Plan — Quarter, Content Type, Scope, Player Impact |

### Required Code Blocks
- **C-11.1**: Phase dependency DAG (simplified directed graph representation)
- **C-11.2**: Milestone acceptance criteria template (pseudocode/test outline)
- **C-11.3**: Performance benchmark harness for game server load testing

### Key Citations to Incorporate
- 24-week timeline — aggressive but achievable with specified team size
- 4 phases — each builds on previous, with clear deliverables
- Risk mitigation — LLM provider fallback, scaling strategy, community feedback loops
- Post-launch — continuous improvement model informed by live analytics

### Suggested Visuals/Diagrams
- **D-11.1**: ASCII Gantt chart — 4 phases across 24 weeks, major deliverables marked, dependency arrows
- **D-11.2**: ASCII dependency graph — nodes as major features, edges as dependencies, critical path highlighted
- **D-11.3**: ASCII risk matrix — Probability (Y) x Impact (X) with risk items positioned, mitigation arrows
- **D-11.4**: ASCII team structure — workstreams as lanes, roles assigned, communication paths

### Cross-References
- Back refs from all chapters — every previous chapter's features map to a roadmap phase
- Summary cross-reference table mapping each feature to its delivery phase

---

## Appendix: Cross-Reference Master Index

### Required Tables
| Table | Column Headers |
|---|---|
| T-A.1 | Feature-to-Chapter Mapping — Feature Name, Design Chapter, Implementation Phase, Depends On |
| T-A.2 | Code Block Index — ID, Chapter, Description, Language, Lines |
| T-A.3 | Table Index — ID, Chapter, Description, Row Estimate |
| T-A.4 | Diagram Index — ID, Chapter, Description, Type |

### Cross-Reference Rules
- Every chapter references Ch1 for scope and Ch11 for delivery timing
- Architecture chapters (2, 3) provide foundation for implementation chapters (4-10)
- Game mechanics chapters (4, 5) define what AI chapters (3, 9) must handle
- Communication chapter (6) bridges game state (4) and presentation (7)
- Analytics (10) receives data from all operational chapters
- Simulation (9) exercises all game systems without human players
