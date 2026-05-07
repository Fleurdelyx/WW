# Werewolf Game Platform: Technical Design Document & System Architecture Specification

---

## 1. Executive Summary

**Word Count Target**: 1,200
**Required Elements**: Table (feature comparison), Table (technology stack)
**Dependencies**: None (prerequisite for all chapters)

### 1.1 Vision & Project Scope

#### 1.1.1 Define the platform's purpose as a multiplayer Werewolf/Mafia game with AI-human hybrid play
#### 1.1.2 Articulate the unique value proposition of LLM-powered agents as believable social opponents
#### 1.1.3 State document scope: full technical specification for developers, AI engineers, and product managers

### 1.2 Platform Capabilities Overview

#### 1.2.1 Enumerate core capabilities: real-time multiplayer, tiered AI agents, multiple game modes, spectator tools
#### 1.2.2 Present capability-at-a-glance table: capability, technology approach, maturity target

### 1.3 Technology Stack Summary

#### 1.3.1 Document polyglot architecture decision: Node.js (real-time layer), Python/FastAPI (AI layer), Redis (state), PostgreSQL (persistent data)
#### 1.3.2 Present condensed stack table: layer, technology, purpose, rationale

### 1.4 Document Conventions

#### 1.4.1 Define terminology: AI agent, player slot, game session, phase, role, faction
#### 1.4.2 Explain heading numbering system and cross-reference notation used throughout document

---

## 2. System Architecture

**Word Count Target**: 3,500
**Required Elements**: Table (service inventory), Table (data flow matrix), Code (docker-compose.yml), Code (Redis state schema), Diagram reference (architecture overview), Diagram reference (data flow), Diagram reference (deployment topology)
**Dependencies**: Chapter 1 (terminology, scope)

### 2.1 Architectural Principles

#### 2.1.1 Define separation of concerns: game logic (Node.js) vs AI reasoning (Python) enforced at service boundary
#### 2.1.2 State stateless AI service design: no AI instance holds game state between requests
#### 2.1.3 Document event sourcing as foundational pattern: every action is an append-only immutable event
#### 2.1.4 Specify polyglot persistence: Redis for hot game state, PostgreSQL for analytics and player data

### 2.2 Service Topology

#### 2.2.1 Describe Game Orchestrator (Node.js/WebSocket): room management, phase transitions, player connection handling
#### 2.2.2 Describe AI Service (Python/FastAPI): agent initialization, LLM inference orchestration, prompt management
#### 2.2.3 Describe State Store (Redis): event log streams, current game state snapshots, session indexes
#### 2.2.4 Describe Analytics Store (PostgreSQL): game history, player ELO, AI performance metrics, training datasets
#### 2.2.5 Present complete service inventory table: service, language, protocol, scaling strategy, critical SLI

### 2.3 Communication Patterns

#### 2.3.1 Document WebSocket protocol between clients and Game Orchestrator: message types, heartbeat, reconnection
#### 2.3.2 Document HTTP/REST internal API between Game Orchestrator and AI Service: request/response contracts
#### 2.3.3 Document Redis Pub/Sub for cross-instance broadcast in horizontally scaled deployment
#### 2.3.4 Present data flow matrix: source, destination, protocol, data type, frequency

### 2.4 Event Sourcing Design

#### 2.4.1 Define event schema: event_id, timestamp, game_id, sequence_number, event_type, payload
#### 2.4.2 Document event categories: player_action, phase_transition, vote_cast, role_action, chat_message, system_event
#### 2.4.3 Specify state reconstruction mechanism: replay events from sequence 0 to rebuild any game state
#### 2.4.4 Present event sourcing benefits: deterministic replay, training data generation, audit trail, analytics pipeline

### 2.5 Scalability & Deployment

#### 2.5.1 Document horizontal scaling strategy: Game Orchestrator instances behind load balancer with sticky sessions
#### 2.5.2 Specify AI Service autoscaling criteria: inference queue depth, GPU utilization, p95 response time
#### 2.5.3 Present container orchestration specification: docker-compose for development, Kubernetes for production
#### 2.5.4 Include complete Docker Compose configuration for local development stack

### 2.6 Resilience & Fault Tolerance

#### 2.6.1 Document reconnection protocol: client disconnect during active game, state resync on reconnect
#### 2.6.2 Specify AI service degradation path: LLM unavailable -> personality-driven -> rule-based fallback
#### 2.6.3 Define game session recovery: Redis persistence, automatic state snapshotting, crash recovery procedure

---

## 3. AI Player Framework

**Word Count Target**: 4,000
**Required Elements**: Table (agent tier comparison), Table (prompt template structure), Code (agent base class), Code (prompt builder), Code (JSON schema for agent responses), Code (GRPO reward function pseudo-code), Table (LLM cost reduction strategies), Diagram reference (agent decision pipeline), Diagram reference (tier fallback hierarchy)
**Dependencies**: Chapter 2 (service topology, communication patterns)

### 3.1 Agent Architecture Overview

#### 3.1.1 Define the three-tier agent system: Rule-based (Tier 1), Personality-driven (Tier 2), LLM-powered (Tier 3)
#### 3.1.2 Present tier comparison table: capability, latency, cost, use case, fallback trigger
#### 3.1.3 Document unified agent interface: all tiers expose identical API contract to Game Orchestrator
#### 3.1.4 Specify dynamic tier assignment: per-turn routing based on context complexity, budget, availability

### 3.2 Tier 1: Rule-Based Agents

#### 3.2.1 Define rule-based decision engine: finite state machine with Werewolf-specific heuristics
#### 3.2.2 Document core heuristics: random target selection (night), vote with majority (day), basic self-preservation
#### 3.2.3 Specify when Tier 1 is appropriate: fast-paced games, tutorial mode, network fallback, minimal compute
#### 3.2.4 Include pseudocode for rule-based voting and targeting decisions

### 3.3 Tier 2: Personality-Driven Agents

#### 3.3.1 Define personality system: trait vectors (aggression, trust, analytical, deceptiveness) modulating rule outputs
#### 3.3.2 Document personality-to-behavior mapping: each trait affects decision weights, communication style, risk tolerance
#### 3.3.3 Specify ReCon-inspired theory-of-mind: belief tracking about other players' roles based on observed actions
#### 3.3.4 Present personality configuration schema and example agent profiles

### 3.4 Tier 3: LLM-Powered Agents

#### 3.4.1 Define LLM agent pipeline: context assembly -> prompt construction -> inference -> response parsing -> validation
#### 3.4.2 Document prompt engineering strategy: system prompt (role identity), game context (visible state), instruction (specific decision), output schema (structured JSON)
#### 3.4.3 Specify context window management: summarization of earlier phases, token budget allocation, priority ranking of information
#### 3.4.4 Include complete prompt template structure with variable substitution schema
#### 3.4.5 Document response JSON schema: action_type, target_id, reasoning (internal), public_statement (if applicable)

### 3.5 Persuasion Training with GRPO

#### 3.5.1 Document GRPO application: Group Relative Policy Optimization for training persuasive Werewolf agents
#### 3.5.2 Define reward components: faction win outcome (sparse), vote influence (dense), survival duration (dense), detection avoidance (dense)
#### 3.5.3 Specify training pipeline: self-play data collection, reward computation, policy update, iterative refinement
#### 3.5.4 Include GRPO reward function pseudocode and training loop architecture
#### 3.5.5 Document evaluation protocol: ELO change, win rate by role, human perception scoring

### 3.6 Cost Optimization Strategies

#### 3.6.1 Document the 70-85% LLM cost reduction target and measurement methodology
#### 3.6.2 Specify response caching: identical game states hash-mapped to cached decisions with TTL invalidation
#### 3.6.3 Document smart routing: low-stakes turns routed to Tier 2, only critical decisions use Tier 3
#### 3.6.4 Define context compaction: conversation summarization, irrelevant history pruning, structured state encoding
#### 3.6.5 Present cost reduction strategies table: technique, expected savings, implementation complexity, tradeoffs

### 3.7 Agent Response Validation

#### 3.7.1 Define validation layer: schema validation, action legality checking, safety filtering
#### 3.7.2 Document retry logic: malformed responses trigger re-prompt with error feedback, max 3 attempts
#### 3.7.3 Specify graceful degradation: validation failure -> fallback to lower tier -> random legal action as last resort

---

## 4. Game Loop & Phases

**Word Count Target**: 2,800
**Required Elements**: Table (phase specification matrix), Code (phase transition state machine), Code (timer configuration), Table (action resolution order), Diagram reference (phase state machine), Diagram reference (timing diagram)
**Dependencies**: Chapter 2 (event sourcing, WebSocket protocol), Chapter 3 (agent API contract)

### 4.1 Game Lifecycle

#### 4.1.1 Define game lifecycle stages: lobby -> setup -> active (phases) -> resolution -> post-game
#### 4.1.2 Document lobby mechanics: room creation, join codes, host controls, AI fill, start conditions
#### 4.1.3 Specify setup sequence: role assignment algorithm, faction distribution validation, AI agent initialization

### 4.2 Night Phase

#### 4.2.1 Define night phase structure: sequential role actions, simultaneous resolution, information asymmetry preservation
#### 4.2.2 Document Werewolf pack communication: private Werewolf chat during night, target nomination and confirmation
#### 4.2.3 Specify role action resolution order: Seer -> Werewolf -> Bodyguard -> Witch -> other roles
#### 4.2.4 Present action resolution order table: role, action type, priority, target selection, result visibility
#### 4.2.5 Document night phase timer: default duration, extension conditions, forced resolution on timeout

### 4.3 Day Phase

#### 4.3.1 Define day phase structure: morning reveal (death announcements), discussion period, nomination, defense, voting
#### 4.3.2 Document discussion mechanics: chat channels, speaking order, time limits, mute rules
#### 4.3.3 Specify nomination system: nomination threshold, self-nomination, nomination lock after deadline
#### 4.3.4 Document voting mechanics: public vs secret ballot, plurality vs majority, tie resolution
#### 4.3.5 Present complete phase specification matrix: phase, sub-phases, duration, player actions, system actions

### 4.4 Phase State Machine

#### 4.4.1 Present formal phase state machine: states, transitions, guards, entry/exit actions
#### 4.4.2 Include state machine implementation code with transition guards and validation
#### 4.4.3 Document phase transition triggers: timer expiry, unanimous action, host override, system event
#### 4.4.4 Specify timer configuration: defaults per phase, dynamic adjustment based on player count, pause/resume

### 4.5 Win Condition Detection

#### 4.5.1 Define win conditions: Werewolf faction parity, Villager faction elimination, role-specific alternate victories
#### 4.5.2 Document win detection algorithm: after each phase transition, evaluate all faction victory predicates
#### 4.5.3 Specify game end sequence: reveal all roles, compute final scores, trigger analytics recording

---

## 5. Roles & Meta Design

**Word Count Target**: 2,800
**Required Elements**: Table (complete role roster), Table (role power weight matrix), Table (balance formula application), Code (role assignment algorithm), Code (balance validation), Diagram reference (role relationship diagram)
**Dependencies**: Chapter 4 (game loop, action resolution), Chapter 3 (agent behavior variation by role)

### 5.1 Role Design Philosophy

#### 5.1.1 Define design principles: information asymmetry, meaningful decisions, faction interdependence, emergent gameplay
#### 5.1.2 Document information taxonomy: perfect information (public votes), probabilistic information (Seer checks), hidden information (secret roles)
#### 5.1.3 Specify the role of deception in design: lying as legitimate strategy, detection asymmetry as difficulty progression

### 5.2 Core Role Definitions

#### 5.2.1 Document Villager: no special abilities, relies on social deduction, baseline information level
#### 5.2.2 Document Werewolf: night kill participation, hidden faction chat, must deceive during day
#### 5.2.3 Document Seer: night investigation revealing faction alignment, high-value target, claim risk/reward
#### 5.2.4 Document Bodyguard: night protection of chosen target, conditional on Werewolf target match
#### 5.2.5 Document Witch: one-use heal and one-use kill potions, decision scarcity creates tension
#### 5.2.6 Present complete role roster table: role, faction, ability, information level, complexity rating

### 5.3 Balance Framework

#### 5.3.1 Document balance formula: b = 1 - |2*p_imp - 1| where p_imp is probability of village win
#### 5.3.2 Specify power weight assignment methodology: each role rated for information value, kill/defend capability, swing potential
#### 5.3.3 Present role power weight matrix: role, information weight, kill weight, defend weight, total power score
#### 5.3.4 Document faction composition algorithm: generate valid configurations where balance score falls within acceptable range
#### 5.3.5 Include role assignment and balance validation code with constraint satisfaction

### 5.4 Deception-Detection Asymmetry

#### 5.4.1 Define deception-detection asymmetry as core difficulty axis: lying is easy, detecting lies is hard
#### 5.4.2 Document how asymmetry creates natural progression: beginners struggle, experienced players develop heuristics
#### 5.4.3 Specify AI exploitation of asymmetry: LLM agents trained to deceive convincingly while maintaining consistency
#### 5.4.4 Present difficulty calibration options: varying AI deception sophistication by player ELO

### 5.5 Role Expansion Design

#### 5.5.1 Document design pattern for adding new roles: ability specification, faction assignment, power weight, AI prompt update
#### 5.5.2 Specify role compatibility matrix: which roles can coexist without degenerate strategies
#### 5.5.3 Present planned future roles with design rationale and balance implications

---

## 6. Chat & Communication System

**Word Count Target**: 2,500
**Required Elements**: Table (message type taxonomy), Table (channel permissions matrix), Code (message schema), Code (filter/moderation pipeline), Diagram reference (message flow), Diagram reference (channel topology)
**Dependencies**: Chapter 2 (WebSocket protocol, Redis Pub/Sub), Chapter 4 (phase transitions)

### 6.1 Communication Architecture

#### 6.1.1 Define channel model: public day chat, private faction chat (Werewolf night), system announcements, dead spectator chat
#### 6.1.2 Document message delivery guarantees: ordered delivery within channel, at-least-once across reconnection
#### 6.1.3 Specify message persistence: in-game messages stored in event log, retrievable on reconnection

### 6.2 Channel Specifications

#### 6.2.1 Document public day chat: all living players, during day phase, free-form text
#### 6.2.2 Document Werewolf night channel: Werewolf faction only, during night phase, target coordination
#### 6.2.3 Document system channel: phase announcements, death reveals, vote results, game events
#### 6.2.4 Document dead player chat: eliminated players only, spectator-only, no living player visibility
#### 6.2.5 Present channel permissions matrix: channel, eligible senders, eligible receivers, phase restriction, message type

### 6.3 Message Taxonomy

#### 6.3.1 Define player message types: free-form chat, vote declaration (optional), claim announcement, accusation
#### 6.3.2 Define system message types: phase change, death announcement, vote tally, role reveal, game result
#### 6.3.3 Define AI-specific message types: structured reasoning (internal), generated speech (external), action submission
#### 6.3.4 Present complete message type taxonomy table: type, sender, channel, schema, visibility, persistence

### 6.4 AI Speech Generation

#### 6.4.1 Document LLM speech generation pipeline: game context -> personality filter -> prompt construction -> text generation -> delivery
#### 6.4.2 Specify speech style variation by agent tier: Tier 1 (canned phrases), Tier 2 (template-based with personality), Tier 3 (fully generated)
#### 6.4.3 Document contextual awareness: AI references game events, other players' statements, voting patterns
#### 6.4.4 Specify rate limiting: AI speech frequency caps, minimum interval between messages, anti-spam rules

### 6.5 Moderation & Safety

#### 6.5.1 Document content filtering pipeline: keyword filtering, sentiment analysis, toxicity classification
#### 6.5.2 Specify moderation actions: message rejection, player warning, automatic mute, incident logging
#### 6.5.3 Document AI safety constraints: prompt-level refusal training, output guardrails, policy enforcement
#### 6.5.4 Include moderation pipeline code: message ingestion, filter chain, decision, action logging

---

## 7. UI/UX & Visual Effects

**Word Count Target**: 2,200
**Required Elements**: Table (screen inventory), Table (animation specification), Table (accessibility requirements), Code (CSS animation example), Diagram reference (screen flow), Diagram reference (component hierarchy)
**Dependencies**: Chapter 4 (phase state machine for UI sync), Chapter 6 (chat display, message rendering)

### 7.1 UI Architecture

#### 7.1.1 Define screen inventory: lobby, game board (day/night variants), role reveal, voting interface, game over, settings
#### 7.1.2 Document component hierarchy: shared components (player card, chat panel, timer), screen-specific layouts
#### 7.1.3 Specify real-time update strategy: WebSocket events mapped to UI state transitions with optimistic updates
#### 7.1.4 Present screen inventory table: screen, purpose, entry condition, exit condition, key components

### 7.2 Game Board Design

#### 7.2.1 Document player card component: avatar, name, role indicator (face-down), living/eliminated state, voting target
#### 7.2.2 Specify day layout: player grid, central chat panel, action bar (nominate, vote), timer display
#### 7.2.3 Specify night layout: contextual action panel (role-specific), Werewolf chat overlay, target selection interface
#### 7.2.4 Document information revelation timing: role reveal on death, Seer result display, final role exposure on game end

### 7.3 Animations & Visual Effects

#### 7.3.1 Define animation philosophy: enhance information delivery, reinforce phase transitions, maintain pacing
#### 7.3.2 Document critical animations: night-to-day transition, death reveal, voting tally, role card flip
#### 7.3.3 Specify animation timing: durations, easing functions, stagger delays for sequential reveals
#### 7.3.4 Present animation specification table: animation, trigger, duration, easing, target elements
#### 7.3.5 Include CSS animation code examples for key transitions

### 7.4 Accessibility

#### 7.4.1 Specify WCAG 2.1 AA compliance targets: color contrast, keyboard navigation, screen reader support
#### 7.4.2 Document accessible alternatives to visual-only information: audio cues for phase changes, text descriptions for animations
#### 7.4.3 Present accessibility requirements table: requirement, implementation approach, verification method

### 7.5 Responsive Design

#### 7.5.1 Specify breakpoint strategy: desktop (primary), tablet, mobile (degraded but functional)
#### 7.5.2 Document mobile adaptations: simplified player grid, collapsible chat, touch-optimized controls
#### 7.5.3 Specify minimum viable mobile experience: all game functions accessible, chat readable, voting functional

---

## 8. Game Modes & Customization

**Word Count Target**: 2,200
**Required Elements**: Table (game mode comparison), Table (customization parameter matrix), Code (mode configuration schema), Code (rules engine pseudo-code), Diagram reference (mode selection flow)
**Dependencies**: Chapter 4 (game loop phases), Chapter 5 (role roster, balance framework)

### 8.1 Standard Mode

#### 8.1.1 Define Classic mode: fixed role set (Villager, Werewolf, Seer), 8-12 players, standard phases
#### 8.1.2 Specify ranked mode variant: ELO-impacting, standard balance configurations, AI difficulty matched to player rating
#### 8.1.3 Document quick play mode: 6-8 players, accelerated timers, simplified role set, rapid matchmaking

### 8.2 AI-Human Hybrid Modes

#### 8.2.1 Define human + AI fill mode: human players joined by AI agents to reach minimum player count
#### 2.2.2 Specify AI difficulty calibration: tier assignment linked to human player average ELO
#### 8.2.3 Document spectator mode: observe AI-only or human-AI games, delayed or real-time viewing options
#### 8.2.4 Present game mode comparison table: mode, player count, AI count, duration, ranked, role set

### 8.3 Custom Game Framework

#### 8.3.1 Define host-customizable parameters: role set, player count, timer durations, victory conditions
#### 8.3.2 Document balance validation in custom games: real-time balance score calculation, warnings for unbalanced configurations
#### 8.3.3 Specify preset configurations: beginner, balanced, chaos (high variance), role-heavy
#### 8.3.4 Include mode configuration JSON schema with validation rules

### 8.4 Rules Engine

#### 8.4.1 Document rules engine architecture: declarative rule definitions evaluated at runtime
#### 8.4.2 Specify rule categories: phase rules, action rules, victory rules, override rules
#### 8.4.3 Present rules engine pseudocode: rule loading, evaluation context, condition checking, action execution
#### 8.4.4 Document custom rule creation: host-defined house rules stored and validated against rules engine

---

## 9. AI-Only Simulation

**Word Count Target**: 2,800
**Required Elements**: Table (simulation parameter space), Table (benchmark metrics), Code (simulation runner), Code (ELO update algorithm), Code (training data export), Diagram reference (simulation pipeline), Diagram reference (benchmark comparison)
**Dependencies**: Chapter 2 (event sourcing for replay), Chapter 3 (agent framework, GRPO training), Chapter 4 (game loop), Chapter 5 (role definitions), Chapter 6 (chat system for AI-AI communication)

### 9.1 Simulation Architecture

#### 9.1.1 Define batch simulation runner: orchestrate thousands of AI-only games without human-facing game server
#### 9.1.2 Document headless game execution: event sourcing enables deterministic replay and analysis
#### 9.1.3 Specify parallelization strategy: game instances run concurrently, no inter-game dependencies
#### 9.1.4 Present simulation parameter space table: parameter, range, default, description

### 9.2 AI Benchmarking

#### 9.2.1 Define ELO-based AI ranking: per-role ELO tracking, cross-configuration rating comparison
#### 9.2.2 Document benchmark metrics: win rate by role, average survival rounds, vote accuracy, deception success rate
#### 9.2.3 Specify controlled tournament protocol: round-robin agent matchups, statistical significance testing
#### 9.2.4 Present benchmark metrics table: metric, definition, target value, measurement frequency
#### 9.2.5 Include ELO update algorithm code with per-role rating adjustment

### 9.3 Training Data Generation

#### 9.3.1 Document event log as training data: every game produces structured dataset for fine-tuning
#### 9.3.2 Specify data extraction pipeline: filter relevant events, format as instruction-response pairs, annotate outcomes
#### 9.3.3 Define dataset schema: game_state (input), agent_action (output), reward_value (label), role_context
#### 9.3.4 Include training data export code: event log parsing, feature extraction, dataset formatting

### 9.4 GRPO Self-Play Pipeline

#### 9.4.1 Document self-play cycle: current policy plays games -> reward computation -> policy update -> evaluation
#### 9.4.2 Specify curriculum training progression: simplified games -> full games -> specific skill drills (deception, detection)
#### 9.4.3 Document evaluation gating: policy update only accepted if benchmark metrics improve
#### 9.4.4 Present training pipeline diagram: data collection, reward calculation, policy gradient update, evaluation loop

### 9.5 Human-AI Comparative Analysis

#### 9.5.1 Define human-likeness metrics: decision latency distribution, speech patterns, error types, strategic sophistication
#### 9.5.2 Document A/B testing framework: human players face AI from different training stages, rate believability
#### 9.5.3 Specify Turing-style evaluation protocol: can human spectators distinguish AI from human players
#### 9.5.4 Document feedback loop: human evaluation data feeds back into RLHF pipeline for agent improvement

---

## 10. Data & Analytics

**Word Count Target**: 2,200
**Required Elements**: Table (data model entities), Table ( analytics pipeline stages), Table (dashboard metrics), Code (event schema), Code (aggregation query), Diagram reference (data architecture), Diagram reference (dashboard wireframe)
**Dependencies**: Chapter 2 (event sourcing, PostgreSQL schema), Chapter 9 (simulation data, ELO system)

### 10.1 Data Model

#### 10.1.1 Document core entities: Player, GameSession, GameEvent, AgentConfiguration, ELOHistory, AnalyticsAggregate
#### 10.1.2 Specify event store schema: append-only log with JSONB payload for flexible event types
#### 10.1.3 Document relational schema: normalized player and agent tables, foreign key relationships
#### 10.1.4 Present entity relationship overview table: entity, attributes, relationships, access patterns

### 10.2 Analytics Pipeline

#### 10.2.1 Define real-time pipeline: Redis streams consumed by aggregation workers, incrementally updating metrics
#### 10.2.2 Document batch pipeline: nightly ETL from event store to analytics warehouse, complex aggregations
#### 10.2.3 Specify derived metrics: win rate trends, role balance over time, AI performance distribution, player retention
#### 10.2.4 Present analytics pipeline stages table: stage, input, output, frequency, technology

### 10.3 Matchmaking Data

#### 10.3.1 Document ELO system: per-player general ELO, per-role ELO for AI difficulty calibration
#### 10.3.2 Specify matchmaking algorithm: queue time vs rating parity tradeoff, AI fill for human deficit
#### 10.3.3 Document match quality metrics: rating differential, role balance score, predicted fairness
#### 10.3.4 Include ELO query and aggregation code for matchmaking decisions

### 10.4 AI Performance Analytics

#### 10.4.1 Define agent performance dashboard: win rate by tier and role, cost per game, latency distribution
#### 10.4.2 Document prompt effectiveness tracking: token usage, response quality scores, cache hit rates
#### 10.4.3 Specify A/B test analytics: comparing agent versions, statistical test results, rollout decisions
#### 10.4.4 Present dashboard metrics table: metric, calculation, refresh rate, alert threshold

### 10.5 Data Retention & Privacy

#### 10.5.1 Specify retention policy: hot data (30 days), warm data (90 days), cold archive (indefinite for research)
#### 10.5.2 Document GDPR compliance: player data export, deletion right implementation, consent tracking
#### 10.5.3 Define data anonymization: personal identifiers stripped from research datasets

---

## 11. Development Roadmap

**Word Count Target**: 1,500
**Required Elements**: Table (milestone breakdown), Table (risk assessment), Table (resource estimates), Diagram reference (Gantt-style timeline)
**Dependencies**: All preceding chapters (derived from full scope)

### 11.1 Phase 1: Core Platform

#### 11.1.1 Define milestone: real-time multiplayer with WebSocket, basic roles (Villager, Werewolf, Seer), rule-based AI
#### 11.1.2 Specify deliverables: working game loop, event sourcing foundation, lobby system, scoring
#### 11.1.3 Estimate duration and team composition

### 11.2 Phase 2: AI Integration

#### 11.2.1 Define milestone: LLM-powered agents, personality-driven tier, GRPO training pipeline, cost optimization
#### 11.2.2 Specify deliverables: three-tier agent system, prompt management, caching layer, benchmarking
#### 11.2.3 Estimate duration and dependencies on Phase 1

### 11.3 Phase 3: Advanced Features

#### 11.3.1 Define milestone: expanded role set, custom games, spectator mode, full analytics suite
#### 11.3.2 Specify deliverables: role framework, rules engine, dashboard, matchmaking with ELO
#### 11.3.3 Estimate duration and dependencies on Phase 2

### 11.4 Phase 4: Polish & Scale

#### 11.4.1 Define milestone: performance optimization, mobile responsiveness, accessibility, production hardening
#### 11.4.2 Specify deliverables: load testing results, mobile UI, WCAG compliance, monitoring
#### 11.4.3 Estimate duration and dependencies on Phase 3

### 11.5 Risk Assessment

#### 11.5.1 Document technical risks: LLM latency, scaling costs, model availability, WebSocket reliability
#### 11.5.2 Document project risks: scope creep, AI behavior unpredictability, regulatory concerns
#### 11.5.3 Present risk assessment table: risk, probability, impact, mitigation strategy, owner

---

## 12. Appendix

**Word Count Target**: 1,500
**Required Elements**: Table (API endpoint reference), Table (glossary), Code (example WebSocket message), Code (example AI service request)
**Dependencies**: All preceding chapters (reference material)

### 12.1 API Reference

#### 12.1.1 Document Game Orchestrator WebSocket API: message types, payload schemas, authentication
#### 12.1.2 Document AI Service REST API: endpoints, request/response schemas, error codes
#### 12.1.3 Present API endpoint reference table: method, path, description, request schema, response schema

### 12.2 Glossary

#### 12.2.1 Define game terminology: role names, phase names, faction concepts, action types
#### 12.2.2 Define technical terminology: event sourcing, GRPO, ReCon, ELO, polyglot architecture
#### 12.2.3 Present glossary table: term, definition, context (game/technical)

### 12.3 Example Messages

#### 12.3.1 Include example WebSocket message: client action submission with full JSON payload
#### 12.3.2 Include example AI service request: game state context with expected response format
#### 12.3.3 Include example event log entry: complete event with all required fields

### 12.4 Configuration Reference

#### 12.4.1 Document environment variables: all service configuration options, defaults, validation
#### 12.4.2 Document game constants: default timers, balance thresholds, ELO parameters
#### 12.4.3 Present configuration reference table: variable, service, default, description

---

## Chapter Dependency Map

```
Chapter 1 (Executive Summary)
    |
    v
Chapter 2 (System Architecture) <--------- Chapter 12 (Appendix) [references all]
    |
    +---> Chapter 3 (AI Player Framework)
    |           |
    |           +---> Chapter 9 (AI-Only Simulation)
    |           |           |
    |           |           +---> Chapter 10 (Data & Analytics) [ELO, training data]
    |           |
    |           +---> Chapter 6 (Chat & Communication) [AI speech generation]
    |
    +---> Chapter 4 (Game Loop & Phases)
    |           |
    |           +---> Chapter 5 (Roles & Meta Design) [action resolution, balance]
    |           |
    |           +---> Chapter 7 (UI/UX & Effects) [phase state machine sync]
    |           |
    |           +---> Chapter 8 (Game Modes & Customization) [phase customization]
    |
    +---> Chapter 6 (Chat & Communication) [WebSocket protocol]

Chapter 10 (Data & Analytics)
    ^
    |
Chapter 9 (AI-Only Simulation) [training data, benchmarking]
    ^
    |
Chapter 3 (AI Player Framework)

Chapter 11 (Development Roadmap) [depends on all chapters for scope definition]
```

### Dependency Matrix

| Chapter | Depends On | Required For |
|---------|-----------|-------------|
| 1. Executive Summary | None | All chapters |
| 2. System Architecture | Chapter 1 | Chapters 3, 4, 6, 10, 12 |
| 3. AI Player Framework | Chapter 2 | Chapters 6, 9 |
| 4. Game Loop & Phases | Chapter 2 | Chapters 5, 7, 8 |
| 5. Roles & Meta Design | Chapters 3, 4 | Chapter 8 |
| 6. Chat & Communication | Chapters 2, 3, 4 | Chapter 7 |
| 7. UI/UX & Effects | Chapters 4, 6 | None (leaf) |
| 8. Game Modes & Customization | Chapters 4, 5 | None (leaf) |
| 9. AI-Only Simulation | Chapters 2, 3, 4, 5, 6 | Chapter 10 |
| 10. Data & Analytics | Chapters 2, 9 | None (leaf) |
| 11. Development Roadmap | All preceding | None (leaf) |
| 12. Appendix | All preceding | None (reference) |

---

## Word Count Summary

| Chapter | Target Words | Primary Audience |
|---------|-------------|-----------------|
| 1. Executive Summary | 1,200 | All stakeholders |
| 2. System Architecture | 3,500 | Backend engineers, DevOps |
| 3. AI Player Framework | 4,000 | AI engineers, ML researchers |
| 4. Game Loop & Phases | 2,800 | Game designers, backend engineers |
| 5. Roles & Meta Design | 2,800 | Game designers, balance analysts |
| 6. Chat & Communication | 2,500 | Backend engineers, AI engineers |
| 7. UI/UX & Effects | 2,200 | Frontend engineers, UX designers |
| 8. Game Modes & Customization | 2,200 | Game designers, product managers |
| 9. AI-Only Simulation | 2,800 | AI researchers, data scientists |
| 10. Data & Analytics | 2,200 | Data engineers, product analysts |
| 11. Development Roadmap | 1,500 | Product managers, engineering leads |
| 12. Appendix | 1,500 | All implementers |
| **Total** | **29,000** | |
