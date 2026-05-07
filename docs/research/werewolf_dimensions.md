# Werewolf Game Platform — Dimension Decomposition

## Dimensions (12 total, each mapped to design document sections)

### Dim01: System Architecture & Game Engine Design
- **Scope**: Authoritative server patterns, game state machines, WebSocket architecture, role-based information flow, event sourcing
- **Angle**: Engineering — selecting and justifying backend architecture decisions
- **Key Sources**: wide03 (architecture), wide02 (A2A protocol)
- **Expected Depth**: Architecture diagrams, tech stack recommendations, anti-cheat patterns

### Dim02: AI Agent Framework & LLM Integration
- **Scope**: Agent types (rule-based, personality-driven, LLM), prompt structures, A2A protocol integration, model selection, cost optimization
- **Angle**: AI Engineering — practical integration of LLMs as game agents
- **Key Sources**: wide02 (LLM frameworks), wide04 (deception models)
- **Expected Depth**: Prompt templates, API abstraction layer, model routing

### Dim03: Game Loop & Phase Management
- **Scope**: Day/night cycle design, action resolution ordering, timing systems, win condition checking, state transitions
- **Angle**: Game Systems Engineering — the core game loop implementation
- **Key Sources**: wide01 (night action order, timing), wide03 (FSM patterns)
- **Expected Depth**: Phase diagrams, timing configurations, edge case handling

### Dim04: Role Design & Balance Framework
- **Scope**: Complete role taxonomy (Villager, Werewolf, Seer, Doctor, Hunter, Witch, etc.), mathematical balance formulas, setup configurations, meta evolution
- **Angle**: Game Design — creating fair and interesting role combinations
- **Key Sources**: wide01 (20+ roles, balance formula), wide05 (win rate analytics)
- **Expected Depth**: Role cards, balance calculator, preset configurations

### Dim05: Memory & Social Reasoning Architectures
- **Scope**: Short-term vs long-term memory, episodic/semantic memory, belief tracking, theory of mind, trust scoring
- **Angle**: Cognitive AI — how agents remember and reason about social relationships
- **Key Sources**: wide02 (memory systems), wide04 (ToM, trust systems)
- **Expected Depth**: Memory data structures, belief update algorithms

### Dim06: Deception & Persuasion Systems
- **Scope**: Believable lying, bluffing patterns, Stackelberg optimization, GRPO training, persuasion techniques, deception detection
- **Angle**: Behavioral AI — making agents that can lie and detect lies convincingly
- **Key Sources**: wide04 (Stackelberg, GRPO), wide01 (tells), wide05 (deception metrics)
- **Expected Depth**: Deception algorithms, detection systems, believability scoring

### Dim07: Chat & Communication Infrastructure
- **Scope**: Public chat, private/role chat (werewolf night chat), message types (free text, structured actions), NLP generation, tone variation, toxicity filtering
- **Angle**: Real-time Communication — chat system design for social deduction
- **Key Sources**: wide03 (chat architecture), wide02 (prompt structures for dialogue)
- **Expected Depth**: Chat system architecture, message schemas, content moderation

### Dim08: Multiplayer, Lobby & Matchmaking
- **Scope**: Room creation, player joining, role assignment, spectator mode, disconnection recovery, matchmaking algorithms
- **Angle**: Multiplayer Systems — scaling from small lobbies to large simulations
- **Key Sources**: wide03 (lobby patterns), wide05 (simulation systems)
- **Expected Depth**: Lobby lifecycle, matchmaking logic, scaling strategies

### Dim09: AI-Only Simulation & Tournament Mode
- **Scope**: All-AI accelerated games, tournament brackets, ELO ratings, leaderboard systems, CI integration
- **Angle**: Simulation Engineering — running AI tournaments at scale
- **Key Sources**: wide05 (ELO systems, simulation platforms), wide01 (AI benchmarks)
- **Expected Depth**: Tournament formats, rating algorithms, automation pipelines

### Dim10: Analytics, Evaluation & Replay Systems
- **Scope**: Win rate tracking, behavioral metrics, LLM-as-a-Judge, replay systems, event sourcing, dashboards
- **Angle**: Data & Observability — understanding what happens in games
- **Key Sources**: wide05 (analytics frameworks), wide04 (evaluation methods)
- **Expected Depth**: Metrics definitions, pipeline architecture, visualization

### Dim11: UI/UX, Animations & Visual Effects
- **Scope**: Day/night transitions, voting animations, elimination effects, role reveal visuals, chat UI, player avatars, spectator interface
- **Angle**: Visual Design — creating an immersive social deduction experience
- **Key Sources**: wide01 (digital adaptations), wide03 (spectator mode)
- **Expected Depth**: UI wireframes, animation specs, visual effect descriptions

### Dim12: Development Roadmap & Cost Optimization
- **Scope**: MVP scope, milestones, tech stack selection, risk assessment, LLM cost management, scaling economics
- **Angle**: Product Management — delivering the platform incrementally
- **Key Sources**: wide02 (cost optimization), wide03 (tech stack comparison)
- **Expected Depth**: Roadmap phases, budget estimates, risk mitigations
