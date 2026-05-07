# Dimension 1: Backend Architecture, Game State Management & Information Flow

## Deep-Dive Technical Specification for Werewolf Multiplayer Game Platform

**Date**: 2025-07-15
**Dimension**: Backend Architecture, Game Engine Design, Information Flow
**Searches Conducted**: 18 independent searches across 5 batches
**Sources Consulted**: 40+ primary sources with inline citations

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [High-Level Architecture Overview](#2-high-level-architecture-overview)
3. [Authoritative Server Architecture](#3-authoritative-server-architecture)
4. [Game State Machine Design](#4-game-state-machine-design)
5. [Night Action Resolution Ordering](#5-night-action-resolution-ordering)
6. [WebSocket Event Architecture](#6-websocket-event-architecture)
7. [Event Sourcing for Replay/Debugging](#7-event-sourcing-for-replaydebugging)
8. [Anti-Cheat via Server-Side Validation](#8-anti-cheat-via-server-side-validation)
9. [Polyglot Backend Recommendation](#9-polyglot-backend-recommendation)
10. [Redis Pub/Sub State Synchronization](#10-redis-pubsub-state-synchronization)
11. [Database Schema Design](#11-database-schema-design)
12. [Implementation Roadmap](#12-implementation-roadmap)

---

## 1. Executive Summary

This document provides a comprehensive technical specification for the backend architecture of a Werewolf multiplayer game platform designed to support both human players and LLM agents. The architecture follows an **authoritative server model** with **polyglot backend services** (Node.js for real-time game orchestration, Python/FastAPI for LLM agent integration), **Redis pub/sub** for distributed state synchronization, **event sourcing** for complete game replay capability, and **server-side validation** for anti-cheat protection.

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Authoritative Model | Full server authority | Non-negotiable for social deduction; prevents information leakage and action spoofing [^39^] |
| Real-time Layer | Node.js + Socket.IO | ~44% higher RPS than FastAPI for I/O tasks; deepest WebSocket ecosystem [^47^] |
| LLM Agent Layer | Python + FastAPI | Native AI/ML ecosystem (LangChain, LlamaIndex); async-native; auto-OpenAPI docs [^264^] |
| State Store | Redis (Cluster) | Sub-millisecond operations; pub/sub for real-time sync; battle-tested for games [^17^] |
| Persistent DB | PostgreSQL | ACID transactions for game results; JSONB for flexible game state snapshots [^267^] |
| Event Log | Redis Streams + PostgreSQL | Immutable append-only log; enables replay and analytics [^172^] |
| State Machine | Finite State Machine (FSM) | Standard pattern for turn-based phase management; clear transitions [^76^] |

---

## 2. High-Level Architecture Overview

### 2.1 System Architecture Diagram

```
                              ┌──────────────────────────────────────────────────┐
                              │                   CLIENT LAYER                    │
                              │  ┌──────────────┐  ┌─────────────────────────┐  │
                              │  │   Web App    │  │   LLM Agent (A2A)       │  │
                              │  │  (React/Vue) │  │   (Python Client)       │  │
                              │  └──────┬───────┘  └───────────┬─────────────┘  │
                              │         │    WebSocket/SSE       │    HTTP        │
                              └─────────┼──────────────────────┼────────────────┘
                                        │                      │
                              ┌─────────▼──────────────────────▼────────────────┐
                              │              API GATEWAY LAYER                   │
                              │  ┌──────────────────────────────────────────┐  │
                              │  │   Nginx / AWS ALB (Sticky Sessions)      │  │
                              │  │   - TLS termination                       │  │
                              │  │   - Rate limiting                         │  │
                              │  │   - Load balancing with ip_hash           │  │
                              │  └────────────────────┬─────────────────────┘  │
                              └───────────────────────┼────────────────────────┘
                                                      │
                    ┌─────────────────────────────────┼─────────────────────────────────┐
                    │                                 │                                 │
           ┌────────▼──────────┐          ┌───────────▼────────────┐         ┌──────────▼──────────┐
           │  GAME SERVER      │          │   AI AGENT SERVICE      │         │   ANALYTICS svc    │
           │  (Node.js/Socket) │◄────────►│   (Python/FastAPI)      │         │   (Node.js/Go)     │
           │                   │   HTTP   │                         │         │                    │
           │  • Game Engine    │          │  • LLM orchestration    │         │  • Event processor │
           │  • State Machine  │          │  • Agent memory mgmt    │         │  • Leaderboards    │
           │  • Room Manager   │          │  • A2A protocol         │         │  • Replay renderer │
           │  • Anti-cheat     │          │  • Prompt engineering   │         │  • Metrics         │
           │  • Event sourcing │          │  • Cost optimization    │         │                    │
           └────────┬──────────┘          └─────────────────────────┘         └────────────────────┘
                    │
           ┌────────▼─────────────────────────────────────────────┐
           │              DATA & MESSAGING LAYER                   │
           │  ┌─────────────────┐    ┌──────────────────────────┐  │
           │  │   REDIS CLUSTER  │    │    POSTGRESQL            │  │
           │  │                  │    │                          │  │
           │  │  • Game state    │    │  • Player accounts       │  │
           │  │  • Sessions      │    │  • Game history          │  │
           │  │  • Pub/Sub       │    │  • Event log (append)    │  │
           │  │  • Matchmaking   │    │  • Analytics             │  │
           │  │  • Leaderboards  │    │  • Achievements          │  │
           │  │  • Streams       │    │                          │  │
           │  └─────────────────┘    └──────────────────────────┘  │
           └────────────────────────────────────────────────────────┘
```

### 2.2 Service Boundary Definitions

**Game Server (Node.js)**
- Responsibilities: Real-time game orchestration, state machine execution, WebSocket management, room lifecycle, anti-cheat validation, event emission
- Communication: Socket.IO (WebSocket) to clients; HTTP to AI Agent Service; Redis pub/sub for cross-server sync
- Scaling: Horizontal via Kubernetes HPA; Socket.IO Redis adapter for multi-node broadcast [^208^]

**AI Agent Service (Python/FastAPI)**
- Responsibilities: LLM inference orchestration, agent memory management, A2A protocol handling, prompt templating, cost optimization
- Communication: HTTP/REST (A2A protocol) from Game Server; SSE streaming for responses
- Scaling: Independent HPA based on inference queue depth; GPU nodes for local models [^266^]

**Analytics Service (Node.js/Go)**
- Responsibilities: Event log processing, replay generation, leaderboards, player stats, game metrics
- Communication: Consumes from Redis Streams; writes to PostgreSQL
- Scaling: Event-driven scaling based on stream backlog

---

## 3. Authoritative Server Architecture

### 3.1 Core Principle: Server as Sole Source of Truth

In an authoritative server architecture, "the server must be the single source of truth for all game state. Clients only render what the server confirms." [^21^] For Werewolf, this means:

- **Role assignment**: Server generates and holds all role assignments; only reveals each player their own role
- **Night actions**: Server collects, validates, and resolves all actions without client knowledge
- **Win conditions**: Server evaluates win conditions after each state transition
- **Information disclosure**: Server controls exactly what information each client receives

### 3.2 Information Hiding Architecture

The most critical security requirement for Werewolf is **zero information leakage**. "Not feeding the client with so much information -- if the client does not have this information, it is impossible to hack and create the cheat by manipulating this data." [^45^]

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVER INFORMATION MODEL                          │
│                                                                      │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│   │  FULL STATE   │    │ PLAYER VIEW  │    │  SPECTATOR   │         │
│   │  (Server Only)│    │  (Per-Client)│    │    VIEW      │         │
│   │              │    │              │    │              │         │
│   │ • All roles  │    │ • Own role   │    │ • All public │         │
│   │ • All night  │    │ • Own status │    │   actions    │         │
│   │   actions    │    │ • Public info│    │ • Vote tallies│        │
│   │ • All votes  │    │ • Phase info │    │ • Eliminated │         │
│   │ • Werewolf   │    │ • Time remaining│  │   players    │         │
│   │   chat logs  │    │              │    │              │         │
│   │ • Seer       │    │ ❌ Other roles│    │ ❌ All roles  │         │
│   │   results    │    │ ❌ Night actions│  │ ❌ Night actions│       │
│   │ • Win eval   │    │ ❌ Werewolf   │    │ ❌ Private    │         │
│   │              │    │    identity   │    │    comms      │         │
│   └──────────────┘    └──────────────┘    └──────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Per-Player View Generation

The server maintains a single `GameState` object containing all game information. Before sending any update to a client, the server transforms this into a **player-specific view** using the `createPlayerView()` function:

```typescript
// Server-side view transformation (TypeScript pseudo-code)
interface FullGameState {
  gameId: string;
  phase: GamePhase;
  players: Map<string, Player>;       // All players with their true roles
  nightActions: NightAction[];        // All submitted night actions
  votes: Map<string, string>;         // All votes (voter -> target)
  werewolfChat: ChatMessage[];        // Private werewolf discussion
  seerResults: Map<number, boolean>;  // Seer's investigation results
  dayEvents: DayEvent[];              // Public day events
  round: number;
}

interface PlayerView {
  gameId: string;
  phase: GamePhase;
  self: PublicPlayer & { role?: Role }; // Only own role revealed
  players: PublicPlayer[];              // Other players without roles
  phaseTimer: number;
  phaseData?: PhaseSpecificData;        // Phase-specific info visible to this player
  history: PublicEvent[];               // Public game history
}

function createPlayerView(fullState: FullGameState, playerId: string): PlayerView {
  const self = fullState.players.get(playerId)!;
  const isWerewolf = self.role === Role.WEREWOLF;
  const isSeer = self.role === Role.SEER;
  const isAlive = self.isAlive;

  return {
    gameId: fullState.gameId,
    phase: fullState.phase,
    self: {
      ...self.publicInfo,
      role: self.role, // Only reveal own role
    },
    players: Array.from(fullState.players.values())
      .filter(p => p.id !== playerId)
      .map(p => p.publicInfo), // Strip roles from other players
    phaseTimer: calculatePhaseTimer(fullState),
    phaseData: generatePhaseData(fullState, playerId, isWerewolf, isSeer, isAlive),
    history: filterHistoryForPlayer(fullState.dayEvents, playerId, isWerewolf),
  };
}
```

### 3.4 Critical Information Boundaries

| Information Type | Server Knows | Werewolf Client | Villager Client | Spectator |
|-----------------|--------------|-----------------|-----------------|-----------|
| All player roles | Yes | No | No | No |
| Own role | Yes | Yes | Yes | N/A |
| Werewolf identities | Yes | Yes (teammates only) | No | No |
| Night kill target | Yes | Yes (during submission) | No | No |
| Seer investigation result | Yes | N/A | Yes (seer only) | No |
| Bodyguard protection target | Yes | N/A | Yes (bodyguard only) | No |
| Vote submissions | Yes (real-time) | Partial (own vote only) | Partial (own vote only) | Yes (anonymous) |
| Chat messages | Yes | Public + WW channel | Public only | Public only |
| Death cause | Yes | Yes (announced) | Yes (announced) | Yes (announced) |
| Win condition status | Yes | Announced | Announced | Announced |

---

## 4. Game State Machine Design

### 4.1 State Machine Overview

The Werewolf game follows a **Finite State Machine (FSM)** pattern where "each state has its own code and behavior, and the machine can only be in one state at a time." [^76^] The game progresses through discrete phases with clear entry/exit logic and transition conditions.

### 4.2 Complete State Diagram

```
                              ┌─────────────┐
                              │   CREATED   │
                              │  (game init) │
                              └──────┬──────┘
                                     │ players join
                                     ▼
                              ┌─────────────┐     min players not met
          ┌──────────────────►│    LOBBY    │──────────────────────────┐
          │                   │  (waiting)  │                          │
          │                   └──────┬──────┘                          │
          │                          │ host starts                     │
          │                          ▼                                │
          │                   ┌─────────────┐                         │
          │                   │ ROLE_ASSIGN │                         │
          │                   │ (distribute)│                         │
          │                   └──────┬──────┘                         │
          │                          │                                │
          │                          ▼                                │
          │  ┌────────────────┌─────────────┐                         │
          │  │                │   NIGHT     │                         │
          │  │     ┌─────────►│  (begin)    │                         │
          │  │     │          └──────┬──────┘                         │
          │  │     │                 │                                │
          │  │     │                 ▼                                │
          │  │     │          ┌─────────────┐                         │
          │  │     │          │  WW_DISCUSS │◄── werewolves discuss   │
          │  │     │          │(werewolf chat)│    who to kill         │
          │  │     │          └──────┬──────┘                         │
          │  │     │                 │                                │
          │  │     │                 ▼                                │
          │  │     │          ┌─────────────┐                         │
          │  │     │          │  WW_SELECT  │                         │
          │  │     │          │ (choose victim)│                      │
          │  │     │          └──────┬──────┘                         │
          │  │     │                 │                                │
          │  │     │                 ▼                                │
          │  │     │          ┌─────────────┐     ┌──────────────┐    │
          │  │     │          │  SEER_ACTION │───►│ BODYGUARD_ACT│    │
          │  │     │          │ (investigate)│    │  (protect)   │    │
          │  │     │          └──────┬──────┘     └──────┬───────┘    │
          │  │     │                 │                    │            │
          │  │     │                 └────────┬───────────┘            │
          │  │     │                          │                        │
          │  │     │                          ▼                        │
          │  │     │          ╔═══════════════════════════════╗        │
          │  │     │          ║      NIGHT_RESOLUTION         ║        │
          │  │     │          ║  (resolve all night actions)  ║        │
          │  │     │          ╚═══════════════╤═══════════════╝        │
          │  │     │                          │                        │
          │  │     │                          ▼                        │
          │  │     │          ┌─────────────┐                         │
          │  │     └──────────┤   DAWN      │                         │
          │  │                │ (announce)  │                         │
          │  │                └──────┬──────┘                         │
          │  │                       │ deaths revealed                 │
          │  │                       ▼                                │
          │  │                ┌─────────────┐    win condition met    │
          │  │                │  CHECK_WIN  │─────────────────────┐   │
          │  │                └──────┬──────┘                     │   │
          │  │                       │ win not met                │   │
          │  │                       ▼                            │   │
          │  │                ┌─────────────┐                     │   │
          │  │                │  DAY_DISCUSS │                     │   │
          │  │                │ (free talk)  │                     │   │
          │  │                └──────┬──────┘                     │   │
          │  │                       │ timer expires               │   │
          │  │                       ▼                             │   │
          │  │                ┌─────────────┐                     │   │
          │  │                │   VOTING    │                     │   │
          │  │                │ (nominate)  │                     │   │
          │  │                └──────┬──────┘                     │   │
          │  │                       │                            │   │
          │  │                       ▼                            │   │
          │  │                ┌─────────────┐                     │   │
          │  │                │VOTE_RESOLUTION│                   │   │
          │  │                │(tally & eliminate)│               │   │
          │  │                └──────┬──────┘                     │   │
          │  │                       │                            │   │
          │  │                       ▼                            │   │
          │  │                ┌─────────────┐    win condition met│   │
          │  └───────────────►│  CHECK_WIN  │◄────────────────────┘   │
          │                   └──────┬──────┘                         │
          │                          │ win not met, players remain     │
          │                          ▼                                 │
          │                   ┌─────────────┐                          │
          └───────────────────┤   GAME_OVER  │◄─────────────────────────┘
                              │  (finalize)  │
                              └─────────────┘
```

### 4.3 State Definitions

| State | Description | Entry Actions | Allowed Transitions |
|-------|-------------|---------------|-------------------|
| `CREATED` | Game instance initialized | Create game record, set config | `LOBBY` |
| `LOBBY` | Players joining | Open room, start timer | `ROLE_ASSIGN`, `GAME_OVER` (if abandoned) |
| `ROLE_ASSIGN` | Roles distributed | Randomly assign roles, send private notifications | `NIGHT` |
| `NIGHT` | Night phase begins | Increment round, reset night actions | `WW_DISCUSS` |
| `WW_DISCUSS` | Werewolves discuss | Open werewolf-only chat channel | `WW_SELECT` (on timer or consensus) |
| `WW_SELECT` | Werewolves choose victim | Collect werewolf votes for kill target | `SEER_ACTION` (on selection) |
| `SEER_ACTION` | Seer investigates | Request investigation target from seer | `BODYGUARD_ACTION` (on timer or selection) |
| `BODYGUARD_ACTION` | Bodyguard protects | Request protection target from bodyguard | `NIGHT_RESOLUTION` (on timer or selection) |
| `NIGHT_RESOLUTION` | Resolve all night actions | Execute resolution algorithm (see Section 5) | `DAWN` |
| `DAWN` | Morning announcement | Reveal deaths, apply status effects | `CHECK_WIN` |
| `DAY_DISCUSS` | Day discussion | Open public chat, start timer | `VOTING` (on timer) |
| `VOTING` | Players vote | Collect votes from all alive players | `VOTE_RESOLUTION` (on timer or all voted) |
| `VOTE_RESOLUTION` | Tally votes | Calculate results, eliminate player | `CHECK_WIN` |
| `CHECK_WIN` | Evaluate win conditions | Count werewolves vs villagers | `DAY_DISCUSS` (no winner), `GAME_OVER` (winner found) |
| `GAME_OVER` | Game ends | Reveal all roles, calculate stats, save results | (terminal) |

### 4.4 State Machine Implementation (TypeScript)

```typescript
// Core state machine implementation
interface StateDefinition {
  onEnter: (ctx: GameContext) => Promise<void>;
  onExit: (ctx: GameContext) => Promise<void>;
  handleAction: (ctx: GameContext, action: PlayerAction) => Promise<StateTransition | null>;
  handleTimer: (ctx: GameContext) => Promise<StateTransition | null>;
  getPhaseDuration: (ctx: GameContext) => number; // milliseconds
}

type StateTransition = {
  target: GamePhase;
  reason: string;
};

class WerewolfStateMachine {
  private states: Map<GamePhase, StateDefinition>;
  private context: GameContext;

  constructor(context: GameContext) {
    this.context = context;
    this.states = this.buildStates();
  }

  private async transitionTo(newPhase: GamePhase, reason: string): Promise<void> {
    const currentDef = this.states.get(this.context.phase)!;
    await currentDef.onExit(this.context);

    // Emit state change event (for replay and client sync)
    await this.emitEvent({
      type: 'PHASE_CHANGE',
      from: this.context.phase,
      to: newPhase,
      reason,
      timestamp: Date.now(),
    });

    this.context.phase = newPhase;
    const newDef = this.states.get(newPhase)!;
    await newDef.onEnter(this.context);

    // Start phase timer (if applicable)
    const duration = newDef.getPhaseDuration(this.context);
    if (duration > 0) {
      this.startPhaseTimer(duration);
    }
  }

  async handlePlayerAction(playerId: string, action: PlayerAction): Promise<void> {
    // Validate: Is player alive?
    const player = this.context.players.get(playerId);
    if (!player?.isAlive) throw new Error('Dead players cannot act');

    // Validate: Is action valid for current phase?
    if (!this.isActionValid(action, this.context.phase)) {
      throw new Error(`Action ${action.type} not valid in phase ${this.context.phase}`);
    }

    // Route to state handler
    const stateDef = this.states.get(this.context.phase)!;
    const transition = await stateDef.handleAction(this.context, action);

    if (transition) {
      await this.transitionTo(transition.target, transition.reason);
    }
  }

  private async handleTimerExpired(): Promise<void> {
    const stateDef = this.states.get(this.context.phase)!;
    const transition = await stateDef.handleTimer(this.context);

    if (transition) {
      await this.transitionTo(transition.target, transition.reason);
    }
  }
}
```

---

## 5. Night Action Resolution Ordering

### 5.1 Resolution Priority System

Night actions in Werewolf must be resolved in a specific priority order to handle interactions correctly. "The idea is that an ability that wants to get executed, registers itself with the central GameController independently of other abilities. GameController controls the execution and computes the final game state at the end of each night." [^10^]

Based on comprehensive research of Werewolf/Mafia rule systems [^47^] [^211^] [^218^], the following priority order is recommended:

```
┌──────────────────────────────────────────────────────────────────┐
│              NIGHT ACTION RESOLUTION PIPELINE                     │
│                                                                   │
│  Priority │ Category      │ Roles                 │ Action        │
│  ─────────┼───────────────┼───────────────────────┼───────────────│
│     1     │ Role-Block    │ Escort, Stalker       │ Prevent target│
│           │               │                       │ from acting   │
│  ─────────┼───────────────┼───────────────────────┼───────────────│
│     2     │ Protection    │ Bodyguard, Doctor     │ Protect target│
│           │               │                       │ from kill     │
│  ─────────┼───────────────┼───────────────────────┼───────────────│
│     3     │ Manipulation  │ Witch, Framer         │ Alter target  │
│           │               │                       │ status/result │
│  ─────────┼───────────────┼───────────────────────┼───────────────│
│     4     │ Information   │ Seer, Investigator,   │ Gather intel  │
│           │               │ Tracker               │ on target     │
│  ─────────┼───────────────┼───────────────────────┼───────────────│
│     5     │ Killing       │ Werewolf, Serial Killer│ Kill target  │
│           │               │ Vigilante             │               │
│  ─────────┼───────────────┼───────────────────────┼───────────────│
│     6     │ Post-Death    │ Hunter, Oracle(curse) │ Trigger on    │
│           │               │                       │ death         │
│  ─────────┼───────────────┼───────────────────────┼───────────────│
│     7     │ Resolution    │ All effects applied   │ Final state   │
│           │               │                       │ computed      │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Resolution Algorithm

```typescript
// Night action resolution implementation
interface NightAction {
  playerId: string;
  role: Role;
  actionType: ActionType;
  targetId: string;
  priority: number;
  category: ActionCategory;
}

class NightResolutionEngine {
  resolveNightActions(actions: NightAction[], gameState: GameState): NightResult {
    // Step 1: Sort by priority (lower number = earlier)
    const sortedActions = actions.sort((a, b) => a.priority - b.priority);

    // Step 2: Track active status and effects
    const activeEffects = new Map<string, Effect[]>(); // targetId -> effects
    const blockedPlayers = new Set<string>();
    const protectedPlayers = new Set<string>();
    const killedPlayers = new Set<string>();
    const investigationResults = new Map<string, InvestigationResult>();

    // Step 3: Process each category in order
    for (const action of sortedActions) {
      // Skip if player was blocked by a higher-priority role-block
      if (blockedPlayers.has(action.playerId)) continue;

      // Skip if player was killed by a higher-priority killing action
      // (some roles still act when killed; others don't)
      if (killedPlayers.has(action.playerId) && !this.actsWhenKilled(action.role)) continue;

      switch (action.category) {
        case 'ROLE_BLOCK':
          blockedPlayers.add(action.targetId);
          this.logEffect(activeEffects, action.targetId, {
            type: 'BLOCKED',
            source: action.playerId,
            role: action.role,
          });
          break;

        case 'PROTECTION':
          protectedPlayers.add(action.targetId);
          this.logEffect(activeEffects, action.targetId, {
            type: 'PROTECTED',
            source: action.playerId,
            role: action.role,
          });
          break;

        case 'MANIPULATION':
          // Apply frame, hex, or other manipulation
          this.logEffect(activeEffects, action.targetId, {
            type: 'MANIPULATED',
            source: action.playerId,
            role: action.role,
          });
          break;

        case 'INFORMATION':
          // Resolve investigation
          const trueRole = gameState.players.get(action.targetId)!.role;
          const reportedRole = this.calculateInvestigationResult(
            trueRole,
            activeEffects.get(action.targetId) || []
          );
          investigationResults.set(action.playerId, {
            targetId: action.targetId,
            reportedRole,
            trueRole,
          });
          break;

        case 'KILLING':
          // Check if target is protected
          if (protectedPlayers.has(action.targetId)) {
            this.logEffect(activeEffects, action.targetId, {
              type: 'ATTACK_DEFLECTED',
              source: action.playerId,
              role: action.role,
            });
            // Bodyguard may die counter-attacking
            if (this.hasBodyguardProtection(activeEffects, action.targetId)) {
              const bodyguard = this.findBodyguard(activeEffects, action.targetId);
              killedPlayers.add(bodyguard);
            }
          } else {
            killedPlayers.add(action.targetId);
            this.logEffect(activeEffects, action.targetId, {
              type: 'KILLED',
              source: action.playerId,
              role: action.role,
            });
          }
          break;
      }
    }

    // Step 4: Resolve post-death triggers (Hunter, Oracle curse, etc.)
    const postDeathActions = this.resolvePostDeathTriggers(killedPlayers, gameState);

    // Step 5: Compile final night result
    return {
      deaths: Array.from(killedPlayers),
      investigationResults,
      activeEffects,
      postDeathActions,
      werewolfKillTarget: this.findWerewolfTarget(sortedActions),
    };
  }

  private actsWhenKilled(role: Role): boolean {
    // Hunter can shoot when killed; some other roles have post-death effects
    return [Role.HUNTER, Role.ORACLE].includes(role);
  }
}
```

### 5.3 Handling Edge Cases

| Scenario | Resolution |
|----------|------------|
| Werewolves disagree on target | Require consensus (all werewolves must vote same target); if timer expires, no kill |
| Seer investigates dead player | Return "player is dead" result |
| Bodyguard protects self | Disallowed by rules; server rejects |
| Bodyguard protects same player 2 nights in a row | Disallowed; server enforces constraint [^218^] |
| Multiple protections on same target | All protections consumed simultaneously on first attack |
| Role-block blocks role-block | Priority order determines: higher-priority role-blocker wins [^218^] |
| Hunter killed at night | Hunter gets post-death action to shoot another player |
| No werewolves alive | Automatic villager win (checked in CHECK_WIN) |

---

## 6. WebSocket Event Architecture

### 6.1 Room-Based Architecture

The architecture uses **Socket.IO rooms** to organize connections. "A room will collect specific client connections and allow events to be emitted only to the clients within the room. Rooms are perfect for creating individual games using one server." [^197^]

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SOCKET.IO ROOM ARCHITECTURE                      │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    Namespace: /game                          │   │
│   │                                                              │   │
│   │   Room: "lobby"         Room: "game_abc123"                  │   │
│   │   ┌──────────┐          ┌──────────────────────────────┐    │   │
│   │   │ Player 1 │          │ Player 1  (Werewolf)         │    │   │
│   │   │ Player 2 │          │ Player 2  (Villager)         │    │   │
│   │   │ Player 3 │          │ Player 3  (Seer)             │    │   │
│   │   │  ...     │          │ Player 4  (Werewolf)         │    │   │
│   │   └──────────┘          │ ...                          │    │   │
│   │                         │                              │    │   │
│   │                         │ Sub-rooms:                   │    │   │
│   │                         │   "game_abc123:werewolf" ────┼────┼───┼──► WW-only chat
│   │                         │   (Players 1, 4 only)        │    │   │
│   │                         │                              │    │   │
│   │                         └──────────────────────────────┘    │   │
│   │                                                              │   │
│   │   Room: "game_def456"                                        │   │
│   │   ┌──────────────────────────────────────────────────────┐  │   │
│   │   │ Players 5-12 (another game in progress)              │  │   │
│   │   └──────────────────────────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Event Types and Flow

```typescript
// Server-to-Client events
enum ServerEvent {
  // Game lifecycle
  GAME_CREATED = 'game:created',
  PLAYER_JOINED = 'player:joined',
  PLAYER_LEFT = 'player:left',
  GAME_STARTED = 'game:started',
  GAME_ENDED = 'game:ended',

  // Phase transitions
  PHASE_CHANGED = 'phase:changed',
  PHASE_TIMER = 'phase:timer',

  // Night-specific (role-filtered)
  WW_YOUR_TURN = 'werewolf:your_turn',          // Only to werewolves
  WW_CHAT_MESSAGE = 'werewolf:chat_message',    // Only to werewolves
  SEER_YOUR_TURN = 'seer:your_turn',            // Only to seer
  SEER_RESULT = 'seer:result',                  // Only to seer
  BODYGUARD_YOUR_TURN = 'bodyguard:your_turn',  // Only to bodyguard

  // Day/public events
  DAWN_ANNOUNCEMENT = 'dawn:announcement',      // Deaths revealed
  PUBLIC_CHAT_MESSAGE = 'chat:public_message',
  PLAYER_VOTED = 'vote:player_voted',           // Anonymous or public
  VOTE_RESULT = 'vote:result',

  // Player eliminated
  PLAYER_DIED = 'player:died',
  ROLE_REVEALED = 'player:role_revealed',       // On death or game end

  // System
  ERROR = 'system:error',
  RECONNECTED = 'system:reconnected',
}

// Client-to-Server events
enum ClientEvent {
  JOIN_GAME = 'game:join',
  LEAVE_GAME = 'game:leave',
  READY = 'player:ready',
  START_GAME = 'game:start',

  // Night actions
  WW_SELECT_TARGET = 'werewolf:select_target',
  WW_SEND_MESSAGE = 'werewolf:send_message',
  SEER_INVESTIGATE = 'seer:investigate',
  BODYGUARD_PROTECT = 'bodyguard:protect',

  // Day actions
  SEND_CHAT = 'chat:send',
  CAST_VOTE = 'vote:cast',
}
```

### 6.3 Event Handler Pattern

```typescript
// Server-side event handler with validation
class GameEventHandler {
  constructor(
    private gameEngine: WerewolfGameEngine,
    private validator: ActionValidator,
    private broadcaster: EventBroadcaster,
  ) {}

  @OnEvent(ClientEvent.WW_SELECT_TARGET)
  async onWerewolfSelectTarget(
    socket: Socket,
    data: { gameId: string; targetId: string }
  ): Promise<void> {
    const { gameId, targetId } = data;
    const playerId = socket.data.playerId;

    // 1. Validate player is in game
    const game = await this.gameEngine.getGame(gameId);
    if (!game) throw new GameError('Game not found');

    // 2. Validate player is werewolf
    const player = game.players.get(playerId);
    if (!player || player.role !== Role.WEREWOLF) {
      throw new GameError('Only werewolves can select kill targets');
    }

    // 3. Validate player is alive
    if (!player.isAlive) throw new GameError('Dead players cannot act');

    // 4. Validate current phase
    if (game.phase !== GamePhase.WW_SELECT) {
      throw new GameError('Not the werewolf selection phase');
    }

    // 5. Validate target exists and is alive
    const target = game.players.get(targetId);
    if (!target || !target.isAlive) {
      throw new GameError('Invalid target');
    }

    // 6. Validate target is not werewolf teammate
    if (target.role === Role.WEREWOLF) {
      throw new GameError('Cannot target werewolf teammate');
    }

    // 7. Process action
    await this.gameEngine.submitWerewolfVote(gameId, playerId, targetId);

    // 8. Broadcast to werewolves only (not to target or other players)
    await this.broadcaster.toWerewolves(gameId, ServerEvent.WW_VOTE_RECEIVED, {
      voterId: playerId,
      targetId,
    });

    // 9. Check if all werewolves have voted
    const allVoted = await this.gameEngine.checkAllWerewolvesVoted(gameId);
    if (allVoted) {
      const consensus = await this.gameEngine.getWerewolfConsensus(gameId);
      if (consensus) {
        await this.gameEngine.advancePhase(gameId);
      }
    }
  }
}
```

### 6.4 Horizontal Scaling with Redis Adapter

For horizontal scaling, Socket.IO requires the Redis adapter: "Every event emit/broadcast goes through Redis Pub/Sub. Redis keeps track of which socket IDs exist on which server. Messages get routed to the right server instance -- even across machines." [^208^]

```typescript
// Multi-node Socket.IO setup with Redis adapter
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const io = new Server(httpServer, {
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
  },
});

// Redis adapter for cross-node communication
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await pubClient.connect();
await subClient.connect();

io.adapter(createAdapter(pubClient, subClient));

// Production considerations [^214^]:
// 1. Sticky sessions required (ip_hash or cookie-based)
// 2. Redis Cluster for >100K connections
// 3. Namespace partitioning for different game modes
// 4. Monitor with Prometheus + Grafana
```

---

## 7. Event Sourcing for Replay/Debugging

### 7.1 Event Sourcing Architecture

"Event Sourcing is a software architecture pattern where the state of a system is derived from a sequence of events, rather than being stored directly in database rows. Each event captures a meaningful change that has occurred in the system." [^209^] For Werewolf, this means every game action is recorded as an immutable event, enabling:

- **Complete game replay** with exact timing
- **Post-game analysis** and statistics
- **Anti-cheat verification** by replaying action sequences
- **Bug reproduction** from event logs

### 7.2 Event Store Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EVENT STORE ARCHITECTURE                          │
│                                                                      │
│   ┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐ │
│   │  GAME EVENTS    │     │  REDIS STREAMS  │     │  POSTGRESQL  │ │
│   │  (Domain)       │────►│  (Real-time)    │────►│  (Persistent)│ │
│   │                 │     │                 │     │              │ │
│   │ Every action    │     │ • Ordered log   │     │ • Immutable  │ │
│   │ emits an event  │     │ • Time-indexed  │     │   append-only│ │
│   │                 │     │ • Consumer      │     │ • Queryable  │ │
│   │ Examples:       │     │   groups        │     │ • Indexed    │ │
│   │ • PlayerJoined  │     │ • Auto-trim     │     │   by gameId  │ │
│   │ • RoleAssigned  │     │                 │     │ • Partitioned│ │
│   │ • NightAction   │     │ game:{id}:events│     │   by date    │ │
│   │ • VoteCast      │     │                 │     │              │ │
│   │ • PhaseChanged  │     │ TTL: 24 hours   │     │ Retention:   │ │
│   │ • PlayerDied    │     │                 │     │   indefinite │ │
│   │ • GameEnded     │     │                 │     │              │ │
│   └─────────────────┘     └─────────────────┘     └──────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.3 Event Schema

```typescript
// Base event interface
interface GameEvent {
  eventId: string;          // ULID - sortable unique ID
  gameId: string;           // Reference to game
  type: EventType;          // Event discriminator
  timestamp: number;        // Server timestamp (ms)
  round: number;            // Game round
  phase: GamePhase;         // Current phase when event occurred
  payload: unknown;         // Event-specific data
  metadata: {
    playerId?: string;      // Acting player (if applicable)
    clientTimestamp?: number; // Client-reported timestamp
    serverVersion: string;   // For migration tracking
  };
}

// Event type enumeration
enum EventType {
  // Game lifecycle
  GAME_CREATED = 'GAME_CREATED',
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  PLAYER_RECONNECTED = 'PLAYER_RECONNECTED',
  GAME_STARTED = 'GAME_STARTED',

  // Role assignment
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',     // Per-player (hidden in replay until reveal)
  ROLES_DISTRIBUTED = 'ROLES_DISTRIBUTED', // All roles assigned

  // Night phase
  PHASE_ENTERED_NIGHT = 'PHASE_ENTERED_NIGHT',
  WW_TARGET_SELECTED = 'WW_TARGET_SELECTED',
  WW_VOTE_SUBMITTED = 'WW_VOTE_SUBMITTED',
  WW_CONSENSUS_REACHED = 'WW_CONSENSUS_REACHED',
  SEER_INVESTIGATION = 'SEER_INVESTIGATION',
  BODYGUARD_PROTECTION = 'BODYGUARD_PROTECTION',
  NIGHT_RESOLVED = 'NIGHT_RESOLVED',

  // Dawn/Day
  DAWN_DEATHS_ANNOUNCED = 'DAWN_DEATHS_ANNOUNCED',
  PHASE_ENTERED_DAY = 'PHASE_ENTERED_DAY',
  CHAT_MESSAGE = 'CHAT_MESSAGE',

  // Voting
  VOTE_CAST = 'VOTE_CAST',
  VOTE_CHANGED = 'VOTE_CHANGED',       // Player changes vote
  VOTE_TALLIED = 'VOTE_TALLIED',
  PLAYER_EXECUTED = 'PLAYER_EXECUTED',

  // Player death
  PLAYER_DIED = 'PLAYER_DIED',
  ROLE_REVEALED = 'ROLE_REVEALED',
  HUNTER_SHOT = 'HUNTER_SHOT',         // Post-death action

  // Win/game end
  WIN_CONDITION_CHECKED = 'WIN_CONDITION_CHECKED',
  GAME_ENDED = 'GAME_ENDED',
  ROLES_REVEALED = 'ROLES_REVEALED',   // All roles revealed at end
}

// Example: Vote cast event
interface VoteCastEvent extends GameEvent {
  type: EventType.VOTE_CAST;
  payload: {
    voterId: string;
    targetId: string;
    voteNumber: number;      // Sequential vote counter
  };
}

// Example: Night resolved event
interface NightResolvedEvent extends GameEvent {
  type: EventType.NIGHT_RESOLVED;
  payload: {
    deaths: Array<{
      playerId: string;
      cause: DeathCause;
      killedBy: string;       // Role that caused death
    }>;
    investigationResults: Array<{
      seerId: string;
      targetId: string;
      result: Role;           // What the seer was told
    }>;
    protections: Array<{
      bodyguardId: string;
      targetId: string;
      successful: boolean;
    }>;
  };
}
```

### 7.4 Replay Engine

```typescript
class GameReplayEngine {
  async replayGame(gameId: string): Promise<GameReplay> {
    // 1. Fetch all events for game
    const events = await this.eventStore.getEventsForGame(gameId);

    // 2. Reconstruct game state at each event
    const states: ReplayFrame[] = [];
    let currentState = this.createEmptyState();

    for (const event of events) {
      currentState = this.applyEvent(currentState, event);
      states.push({
        timestamp: event.timestamp,
        event,
        state: this.cloneState(currentState),
      });
    }

    // 3. Generate replay with timing
    return {
      gameId,
      totalDuration: states[states.length - 1].timestamp - states[0].timestamp,
      frames: states,
      statistics: this.calculateStatistics(events),
    };
  }

  private applyEvent(state: GameState, event: GameEvent): GameState {
    switch (event.type) {
      case EventType.PLAYER_JOINED:
        state.players.set(event.metadata.playerId!, {
          id: event.metadata.playerId!,
          ...event.payload as PlayerJoinPayload,
          isAlive: true,
        });
        break;

      case EventType.ROLE_ASSIGNED:
        // Note: role is only visible to that player until death/game end
        const { playerId, role } = event.payload as RoleAssignPayload;
        state.players.get(playerId)!.role = role;
        break;

      case EventType.VOTE_CAST:
        const { voterId, targetId } = event.payload as VoteCastPayload;
        state.votes.set(voterId, targetId);
        break;

      case EventType.PLAYER_DIED:
        const { playerId } = event.payload as PlayerDiedPayload;
        state.players.get(playerId)!.isAlive = false;
        state.players.get(playerId)!.roleRevealed = true;
        break;

      // ... other event types
    }
    return state;
  }
}
```

### 7.5 Redis Streams Implementation

Redis Streams provide an excellent event log implementation: "Redis Streams (XADD, XRANGE) capture every player action as immutable events. Real-time event processing feeds AI context for intelligent responses." [^172^]

```typescript
// Redis Streams event storage
class RedisEventStore {
  private redis: Redis;

  async appendEvent(event: GameEvent): Promise<void> {
    const streamKey = `game:${event.gameId}:events`;

    await this.redis.xAdd(streamKey, '*', {
      eventId: event.eventId,
      type: event.type,
      timestamp: event.timestamp.toString(),
      round: event.round.toString(),
      phase: event.phase,
      payload: JSON.stringify(event.payload),
      metadata: JSON.stringify(event.metadata),
    });

    // Also publish for real-time subscribers
    await this.redis.publish(`game:${event.gameId}:updates`, JSON.stringify(event));
  }

  async getEventsForGame(gameId: string): Promise<GameEvent[]> {
    const streamKey = `game:${gameId}:events`;
    const entries = await this.redis.xRange(streamKey, '-', '+');

    return entries.map(entry => this.parseEvent(entry));
  }

  async getEventsSince(gameId: string, eventId: string): Promise<GameEvent[]> {
    const streamKey = `game:${gameId}:events`;
    const entries = await this.redis.xRange(streamKey, eventId, '+');
    return entries.map(entry => this.parseEvent(entry));
  }
}
```

---

## 8. Anti-Cheat via Server-Side Validation

### 8.1 Validation Layers

"Server-side anti-cheats work by using real-time in-game player information for statistical analyses. They do not scan the player's files, or require any software installed on the client's side." [^190^] For Werewolf, the server validates:

```
┌─────────────────────────────────────────────────────────────────────┐
│                   SERVER-SIDE VALIDATION PIPELINE                     │
│                                                                      │
│  Layer 1: Connection Authentication                                  │
│  ├── Valid JWT token                                                │
│  └── Player ID matches authenticated user                           │
│                                                                      │
│  Layer 2: Game Membership                                            │
│  ├── Player is in the game room                                     │
│  └── Player hasn't been kicked/banned                               │
│                                                                      │
│  Layer 3: Alive Status                                               │
│  ├── Dead players cannot submit actions                             │
│  └── Dead players cannot send chat messages                         │
│                                                                      │
│  Layer 4: Phase Validation                                           │
│  ├── Action type must be valid for current game phase               │
│  └── Action must be submitted within phase time limit               │
│                                                                      │
│  Layer 5: Role Validation                                            │
│  ├── Only werewolves can submit werewolf actions                    │
│  ├── Only seer can submit investigation actions                     │
│  └── Only bodyguard can submit protection actions                   │
│                                                                      │
│  Layer 6: Target Validation                                          │
│  ├── Target must be an alive player in the same game                │
│  ├── Cannot target self (for most actions)                          │
│  ├── Cannot target werewolf teammate (for werewolf kill)            │
│  └── Cannot target same player 2 nights in a row (bodyguard)        │
│                                                                      │
│  Layer 7: Rate Limiting                                              │
│  ├── Maximum actions per time window                                │
│  └── Cooldown between actions                                       │
│                                                                      │
│  Layer 8: Statistical Anomaly Detection                              │
│  ├── Unusual voting patterns (always voting with/against same       │
│  │   player)                                                          │
│  └── Impossible knowledge (player knowing roles they shouldn't)     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Validator Implementation

```typescript
class ActionValidator {
  validate(
    action: PlayerAction,
    context: ValidationContext
  ): ValidationResult {
    const errors: string[] = [];

    // Layer 3: Alive check
    if (!context.player.isAlive) {
      errors.push('Dead players cannot perform actions');
    }

    // Layer 4: Phase validation
    if (!this.isActionValidForPhase(action.type, context.phase)) {
      errors.push(`Action ${action.type} not valid in phase ${context.phase}`);
    }

    // Layer 5: Role validation
    if (!this.hasRoleForAction(action.type, context.player.role)) {
      errors.push(`Role ${context.player.role} cannot perform ${action.type}`);
    }

    // Layer 6: Target validation
    if (action.targetId) {
      const target = context.game.players.get(action.targetId);
      if (!target) {
        errors.push('Target player not found');
      } else if (!target.isAlive) {
        errors.push('Cannot target dead players');
      } else if (action.targetId === context.player.id && !this.allowsSelfTarget(action.type)) {
        errors.push('Cannot target self');
      }
    }

    // Layer 7: Rate limiting
    if (this.isRateLimited(context.player.id, action.type)) {
      errors.push('Rate limit exceeded');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private isActionValidForPhase(actionType: ActionType, phase: GamePhase): boolean {
    const validActions: Record<GamePhase, ActionType[]> = {
      [GamePhase.LOBBY]: [ActionType.READY, ActionType.LEAVE],
      [GamePhase.WW_DISCUSS]: [ActionType.SEND_MESSAGE],
      [GamePhase.WW_SELECT]: [ActionType.SELECT_TARGET, ActionType.SEND_MESSAGE],
      [GamePhase.SEER_ACTION]: [ActionType.INVESTIGATE],
      [GamePhase.BODYGUARD_ACTION]: [ActionType.PROTECT],
      [GamePhase.DAY_DISCUSS]: [ActionType.SEND_MESSAGE],
      [GamePhase.VOTING]: [ActionType.CAST_VOTE],
      // ... other phases
    };
    return validActions[phase]?.includes(actionType) ?? false;
  }

  private hasRoleForAction(actionType: ActionType, role: Role): boolean {
    const roleActions: Record<Role, ActionType[]> = {
      [Role.WEREWOLF]: [ActionType.SELECT_TARGET, ActionType.SEND_MESSAGE],
      [Role.SEER]: [ActionType.INVESTIGATE, ActionType.SEND_MESSAGE],
      [Role.BODYGUARD]: [ActionType.PROTECT, ActionType.SEND_MESSAGE],
      [Role.VILLAGER]: [ActionType.SEND_MESSAGE, ActionType.CAST_VOTE],
      // ... other roles
    };
    return roleActions[role]?.includes(actionType) ?? false;
  }
}
```

### 8.3 Replay-Based Verification

"Record all game actions with timestamps for post-game review. Enables detection of impossible sequences (e.g., a villager knowing werewolf identities prematurely). Server-authoritative logging ensures clients cannot tamper with replay data." [^37^]

```typescript
class ReplayAntiCheat {
  async verifyGameIntegrity(gameId: string): Promise<CheatReport> {
    const replay = await this.replayEngine.replayGame(gameId);
    const anomalies: Anomaly[] = [];

    // Check 1: Information leakage
    // A player consistently votes against werewolves before any public information
    // could suggest their identity
    anomalies.push(...this.detectImpossibleKnowledge(replay));

    // Check 2: Coordination patterns
    // Multiple players always vote identically (possible multi-accounting)
    anomalies.push(...this.detectCoordination(replay));

    // Check 3: Timing patterns
    // Actions submitted at inhuman speeds or with suspicious regularity
    anomalies.push(...this.detectTimingAnomalies(replay));

    return {
      gameId,
      anomalies,
      riskScore: this.calculateRiskScore(anomalies),
    };
  }

  private detectImpossibleKnowledge(replay: GameReplay): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const villagerCorrectWwVotes: Map<string, number> = new Map();

    for (const frame of replay.frames) {
      if (frame.event.type === EventType.VOTE_CAST) {
        const { voterId, targetId } = frame.event.payload as VoteCastPayload;
        const voter = frame.state.players.get(voterId)!;
        const target = frame.state.players.get(targetId)!;

        // Track when villagers correctly vote for werewolves
        if (voter.role === Role.VILLAGER && target.role === Role.WEREWOLF) {
          const count = (villagerCorrectWwVotes.get(voterId) || 0) + 1;
          villagerCorrectWwVotes.set(voterId, count);
        }
      }
    }

    // Flag players with statistically improbable correct votes
    for (const [playerId, correctVotes] of villagerCorrectWwVotes) {
      if (correctVotes > 3) { // Threshold based on game analysis
        anomalies.push({
          type: 'IMPOSSIBLE_KNOWLEDGE',
          playerId,
          description: `Player correctly identified ${correctVotes} werewolves without public information`,
          severity: 'HIGH',
        });
      }
    }

    return anomalies;
  }
}
```

---

## 9. Polyglot Backend Recommendation

### 9.1 Recommended Architecture: Node.js + Python/FastAPI

"The pattern that consistently wins is FastAPI for the parts that touch Python's strengths, Go for the parts that touch raw throughput, and Node.js for the parts that touch real-time." [^43^] For a Werewolf platform with LLM agents:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    POLYGLOT SERVICE ARCHITECTURE                     │
│                                                                      │
│   ┌──────────────────────┐         ┌──────────────────────┐         │
│   │  REAL-TIME LAYER      │         │   AI/ML LAYER         │         │
│   │  (Node.js/Socket.IO)  │         │   (Python/FastAPI)    │         │
│   │                       │         │                       │         │
│   │  Port: 3001           │◄───────►│  Port: 8000           │         │
│   │                       │  HTTP   │                       │         │
│   │  Responsibilities:    │         │  Responsibilities:    │         │
│   │  • WebSocket mgmt     │         │  • LLM orchestration  │         │
│   │  • Game state machine │         │  • Agent memory       │         │
│   │  • Room lifecycle     │         │  • Prompt templating  │         │
│   │  • Anti-cheat valid.  │         │  • A2A protocol       │         │
│   │  • Event sourcing     │         │  • Cost optimization  │         │
│   │  • Client sync        │         │  • Model routing      │         │
│   │                       │         │                       │         │
│   │  Tech:                │         │  Tech:                │         │
│   │  • Socket.IO v4+      │         │  • FastAPI + uvicorn  │         │
│   │  • TypeScript         │         │  • LangChain/LangGraph│         │
│   │  • Redis adapter      │         │  • OpenAI/Anthropic   │         │
│   │  • Pino (logging)     │         │  • Pydantic           │         │
│   └──────────────────────┘         └──────────────────────┘         │
│                                                                      │
│   ┌──────────────────────┐         ┌──────────────────────┐         │
│   │   SHARED DATA LAYER   │         │   ORCHESTRATION       │         │
│   │                       │         │                       │         │
│   │  • Redis Cluster      │         │  • Docker Compose     │         │
│   │  • PostgreSQL         │         │  • Kubernetes         │         │
│   │  • Prometheus/Grafana │         │  • Nginx ingress      │         │
│   │  • OpenTelemetry      │         │  • CI/CD (GitHub)     │         │
│   └──────────────────────┘         └──────────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.2 Inter-Service Communication

```typescript
// Node.js Game Server calling Python AI Agent Service
class AIAgentService {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.AI_SERVICE_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async requestAgentAction(
    gameId: string,
    agentId: string,
    role: Role,
    phase: GamePhase,
    context: AgentContext
  ): Promise<AgentAction> {
    const response = await fetch(`${this.baseUrl}/agents/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_id: gameId,
        agent_id: agentId,
        role: role.toLowerCase(),
        phase: phase.toLowerCase(),
        context: {
          players: context.players,
          history: context.history,
          previous_actions: context.previousActions,
          time_remaining_ms: context.timeRemaining,
        },
        // Streaming support for real-time response
        stream: false,
      }),
      // LLM calls can be slow; use appropriate timeout
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      // Fallback: random valid action if AI service fails
      return this.generateFallbackAction(role, phase, context);
    }

    const result = await response.json();
    return this.validateAndParseAction(result, role, phase, context);
  }

  // Health check for circuit breaker pattern
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

```python
# Python FastAPI Agent Service (counterpart)
# ai_agent_service/main.py

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import asyncio

app = FastAPI(title="Werewolf AI Agent Service")

class ActionRequest(BaseModel):
    game_id: str
    agent_id: str
    role: str
    phase: str
    context: dict
    stream: bool = False

class ActionResponse(BaseModel):
    action_type: str
    target_id: Optional[str] = None
    message: Optional[str] = None
    reasoning: Optional[str] = None

@app.post("/agents/action", response_model=ActionResponse)
async def request_agent_action(request: ActionRequest):
    """Request an action from an LLM agent."""
    try:
        # Route to appropriate agent handler
        handler = get_agent_handler(request.role)

        # Generate action using LLM
        action = await handler.generate_action(
            context=request.context,
            phase=request.phase,
        )

        return ActionResponse(**action)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}

def get_agent_handler(role: str):
    """Factory for role-specific agent handlers."""
    handlers = {
        'werewolf': WerewolfAgentHandler(),
        'seer': SeerAgentHandler(),
        'bodyguard': BodyguardAgentHandler(),
        'villager': VillagerAgentHandler(),
    }
    return handlers.get(role, BaseAgentHandler())
```

### 9.3 Technology Stack Comparison

| Aspect | Node.js (Game Server) | Python/FastAPI (AI Service) | Go (Analytics) |
|--------|----------------------|---------------------------|----------------|
| **RPS** | ~38K (I/O bound) [^47^] | ~26K (I/O bound) [^43^] | ~142K [^43^] |
| **WebSocket** | Native Socket.IO, 20K+ conn/server [^20^] | Requires external lib | Raw performance best |
| **LLM Ecosystem** | Vercel AI SDK (limited) | LangChain, LlamaIndex, Hugging Face [^264^] | Minimal |
| **Async** | Event loop (mature) | asyncio (FastAPI-native) [^266^] | Goroutines (excellent) |
| **Memory/conn** | 8KB (Socket.IO) / 3KB (raw ws) [^20^] | Higher baseline | Lowest |
| **p99 Latency** | 32ms (Socket.IO) / 12ms (raw) [^20^] | ~45ms | Sub-ms |
| **Best For** | Real-time, WebSocket, client sync | LLM inference, agent logic | High-throughput analytics |

---

## 10. Redis Pub/Sub State Synchronization

### 10.1 Redis Data Model for Werewolf

```
┌─────────────────────────────────────────────────────────────────────┐
│                   REDIS DATA MODEL FOR WEREWOLF                      │
│                                                                      │
│  KEYS (with TTL):                                                    │
│                                                                      │
│  game:{gameId}:info              → Hash   {phase, round, config,     │
│                                            startedAt, hostId}         │
│  TTL: game duration + 1 hour                                         │
│                                                                      │
│  game:{gameId}:players           → Hash   {playerId → JSON(player)}  │
│  game:{gameId}:player:{pid}      → Hash   {role, isAlive, socketId}  │
│  game:{gameId}:alive             → Set    {alive player IDs}         │
│  game:{gameId}:werewolves        → Set    {werewolf player IDs}      │
│  game:{gameId}:ww_chat           → Stream (werewolf chat messages)   │
│  game:{gameId}:public_chat       → Stream (public chat messages)     │
│  game:{gameId}:votes             → Hash   {voterId → targetId}       │
│  game:{gameId}:night_actions     → Hash   {role → JSON(action)}      │
│  game:{gameId}:events            → Stream (all game events)          │
│                                                                      │
│  player:{playerId}:session       → Hash   {gameId, socketId,         │
│                                            connectedAt}               │
│  player:{playerId}:games         → Set    {gameIds played}           │
│                                                                      │
│  lobby:waiting                   → SortedSet {score: joinTime,        │
│                                              member: gameId}          │
│                                                                      │
│  PUB/SUB Channels:                                                   │
│                                                                      │
│  game:{gameId}:updates           → All game state changes             │
│  game:{gameId}:werewolf          → Werewolf-only messages             │
│  game:{gameId}:public            → Public chat and announcements      │
│  game:{gameId}:phase             → Phase transitions                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.2 State Synchronization Pattern

```typescript
// Redis-backed game state manager
class RedisGameStateManager {
  constructor(private redis: Redis) {}

  async createGame(config: GameConfig): Promise<string> {
    const gameId = generateId();
    const pipeline = this.redis.pipeline();

    // Initialize game info
    pipeline.hset(`game:${gameId}:info`, {
      phase: GamePhase.LOBBY,
      round: '0',
      config: JSON.stringify(config),
      createdAt: Date.now().toString(),
      status: 'waiting',
    });

    // Set TTL
    pipeline.expire(`game:${gameId}:info`, 3600 * 4); // 4 hours

    await pipeline.exec();
    return gameId;
  }

  async addPlayer(gameId: string, player: Player): Promise<void> {
    const pipeline = this.redis.pipeline();

    // Add player data
    pipeline.hset(`game:${gameId}:player:${player.id}`, {
      id: player.id,
      name: player.name,
      role: '', // Assigned later
      isAlive: 'true',
      socketId: player.socketId,
      joinedAt: Date.now().toString(),
    });

    // Add to alive set
    pipeline.sadd(`game:${gameId}:alive`, player.id);

    // Add to players list
    pipeline.hset(`game:${gameId}:players`, player.id, JSON.stringify(player));

    await pipeline.exec();

    // Publish player joined event
    await this.redis.publish(`game:${gameId}:updates`, JSON.stringify({
      type: 'PLAYER_JOINED',
      playerId: player.id,
      timestamp: Date.now(),
    }));
  }

  async assignRoles(gameId: string, assignments: Map<string, Role>): Promise<void> {
    const pipeline = this.redis.pipeline();

    for (const [playerId, role] of assignments) {
      pipeline.hset(`game:${gameId}:player:${playerId}`, 'role', role);

      if (role === Role.WEREWOLF) {
        pipeline.sadd(`game:${gameId}:werewolves`, playerId);
      }
    }

    // Update game status
    pipeline.hset(`game:${gameId}:info`, 'phase', GamePhase.NIGHT);
    pipeline.hset(`game:${gameId}:info`, 'round', '1');

    await pipeline.exec();

    // Publish role assignment (role info NOT included - sent privately via WebSocket)
    await this.redis.publish(`game:${gameId}:updates`, JSON.stringify({
      type: 'ROLES_ASSIGNED',
      playerCount: assignments.size,
      timestamp: Date.now(),
    }));
  }

  // Atomic state transition with version checking (prevents race conditions)
  async transitionPhase(
    gameId: string,
    from: GamePhase,
    to: GamePhase
  ): Promise<boolean> {
    const luaScript = `
      local key = KEYS[1]
      local expectedPhase = ARGV[1]
      local newPhase = ARGV[2]
      local timestamp = ARGV[3]

      local currentPhase = redis.call('HGET', key, 'phase')
      if currentPhase ~= expectedPhase then
        return 0  -- Race condition: phase already changed
      end

      redis.call('HSET', key, 'phase', newPhase)
      redis.call('HSET', key, 'lastPhaseChange', timestamp)
      return 1
    `;

    const result = await this.redis.eval(
      luaScript,
      1,
      `game:${gameId}:info`,
      from,
      to,
      Date.now().toString()
    );

    if (result === 1) {
      // Publish phase change
      await this.redis.publish(`game:${gameId}:phase`, JSON.stringify({
        from,
        to,
        timestamp: Date.now(),
      }));
      return true;
    }

    return false; // Transition failed due to race condition
  }
}
```

### 10.3 Cross-Server Broadcasting

When scaling horizontally, the Socket.IO Redis adapter handles cross-server broadcasting: "Messages get routed to the right server instance -- even across machines." [^208^]

```typescript
// The @socket.io/redis-adapter handles this automatically:
// When Server A emits to room "game_abc123":
// 1. Server A publishes to Redis channel "socket.io#/#game_abc123#"
// 2. All subscribed servers (B, C, D) receive the message
// 3. Each server forwards to its connected clients in that room

// Custom game state pub/sub for non-Socket.IO state
class GamePubSub {
  private subscriber: Redis;
  private listeners: Map<string, Set<(message: any) => void>> = new Map();

  async subscribe(gameId: string, callback: (message: any) => void): Promise<void> {
    const channel = `game:${gameId}:updates`;

    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
      await this.subscriber.subscribe(channel, (message) => {
        const callbacks = this.listeners.get(channel) || new Set();
        for (const cb of callbacks) {
          cb(JSON.parse(message));
        }
      });
    }

    this.listeners.get(channel)!.add(callback);
  }

  async publish(gameId: string, message: any): Promise<void> {
    await this.redis.publish(`game:${gameId}:updates`, JSON.stringify(message));
  }
}
```

---

## 11. Database Schema Design

### 11.1 PostgreSQL Schema

```sql
-- ============================================================
-- WEREWOLF GAME PLATFORM - POSTGRESQL SCHEMA
-- ============================================================

-- Players / Users table
CREATE TABLE players (
    player_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50) NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(100),
    avatar_url      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    last_login      TIMESTAMPTZ,
    stats           JSONB DEFAULT '{}'::jsonb,
    preferences     JSONB DEFAULT '{}'::jsonb,
    is_banned       BOOLEAN DEFAULT FALSE,
    ban_reason      TEXT,
    ban_expires_at  TIMESTAMPTZ
);

-- Games table (immutable event log)
CREATE TABLE games (
    game_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code       VARCHAR(10) NOT NULL UNIQUE,    -- Short join code
    host_id         UUID NOT NULL REFERENCES players(player_id),
    status          VARCHAR(20) NOT NULL DEFAULT 'created'
                    CHECK (status IN ('created', 'lobby', 'in_progress', 'completed', 'abandoned')),
    config          JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Role counts, timers, etc.
    winner_team     VARCHAR(20) CHECK (winner_team IN ('village', 'werewolf', 'neutral', null)),
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    total_rounds    INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes for common queries
    CONSTRAINT valid_times CHECK (ended_at IS NULL OR started_at IS NOT NULL)
);

CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_host ON games(host_id);
CREATE INDEX idx_games_started ON games(started_at);

-- Game participants (players in each game)
CREATE TABLE game_participants (
    participant_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id         UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    player_id       UUID REFERENCES players(player_id),  -- NULL for anonymous/guest
    guest_name      VARCHAR(50),  -- For non-registered players
    role            VARCHAR(30) NOT NULL,
    initial_role    VARCHAR(30) NOT NULL,  -- May differ due to role-copy mechanics
    final_role      VARCHAR(30),  -- Role at game end (may have changed)
    team            VARCHAR(20) NOT NULL,
    was_alive_at_start BOOLEAN DEFAULT TRUE,
    died_at_round   INTEGER,
    died_by         VARCHAR(30),  -- 'werewolf', 'voting', 'hunter', etc.
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    left_at         TIMESTAMPTZ,
    socket_id       VARCHAR(100),

    UNIQUE(game_id, player_id),
    UNIQUE(game_id, guest_name) WHERE guest_name IS NOT NULL
);

CREATE INDEX idx_participants_game ON game_participants(game_id);
CREATE INDEX idx_participants_player ON game_participants(player_id);

-- Game events (event sourcing - append only)
CREATE TABLE game_events (
    event_id        BIGSERIAL,
    game_id         UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    event_type      VARCHAR(50) NOT NULL,
    round           INTEGER NOT NULL DEFAULT 0,
    phase           VARCHAR(20),
    actor_id        UUID,  -- Player who triggered the event (if any)
    payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata        JSONB DEFAULT '{}'::jsonb,
    server_timestamp TIMESTAMPTZ DEFAULT NOW(),
    client_timestamp TIMESTAMPTZ,
    sequence_number BIGINT NOT NULL,  -- Monotonic within game

    PRIMARY KEY (game_id, sequence_number)
) PARTITION BY RANGE (server_timestamp);

-- Partition events by month for efficient querying
CREATE TABLE game_events_2025_01 PARTITION OF game_events
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE game_events_2025_02 PARTITION OF game_events
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
-- ... auto-create future partitions

CREATE INDEX idx_events_game_seq ON game_events(game_id, sequence_number);
CREATE INDEX idx_events_type ON game_events(event_type);
CREATE INDEX idx_events_game_type ON game_events(game_id, event_type);

-- Night actions (denormalized for fast querying)
CREATE TABLE night_actions (
    action_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id         UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    round           INTEGER NOT NULL,
    actor_id        UUID NOT NULL REFERENCES players(player_id),
    actor_role      VARCHAR(30) NOT NULL,
    action_type     VARCHAR(30) NOT NULL,
    target_id       UUID REFERENCES players(player_id),
    target_role     VARCHAR(30),  -- Role of target at the time
    resolved        BOOLEAN DEFAULT FALSE,
    result          VARCHAR(50),  -- 'killed', 'protected', 'investigated', etc.
    result_payload  JSONB DEFAULT '{}'::jsonb,
    submitted_at    TIMESTAMPTZ DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_night_actions_game ON night_actions(game_id, round);
CREATE INDEX idx_night_actions_actor ON night_actions(actor_id);

-- Votes (for post-game analysis)
CREATE TABLE votes (
    vote_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id         UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    round           INTEGER NOT NULL,
    voter_id        UUID NOT NULL REFERENCES players(player_id),
    target_id       UUID NOT NULL REFERENCES players(player_id),
    vote_number     INTEGER NOT NULL,  -- Sequence within the round
    changed_from    UUID REFERENCES players(player_id),  -- Previous target (if changed)
    submitted_at    TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(game_id, round, voter_id, vote_number)
);

CREATE INDEX idx_votes_game_round ON votes(game_id, round);

-- Chat messages
CREATE TABLE chat_messages (
    message_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id         UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    sender_id       UUID REFERENCES players(player_id),
    sender_name     VARCHAR(50) NOT NULL,
    sender_role     VARCHAR(30),  -- Role at time of sending (filled post-game)
    channel         VARCHAR(20) NOT NULL DEFAULT 'public'
                    CHECK (channel IN ('public', 'werewolf', 'system')),
    round           INTEGER NOT NULL,
    phase           VARCHAR(20) NOT NULL,
    content         TEXT NOT NULL,
    sent_at         TIMESTAMPTZ DEFAULT NOW(),
    is_deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_chat_game ON chat_messages(game_id, round);
CREATE INDEX idx_chat_sender ON chat_messages(sender_id);

-- Player statistics (aggregated)
CREATE TABLE player_stats (
    player_id       UUID PRIMARY KEY REFERENCES players(player_id) ON DELETE CASCADE,
    games_played    INTEGER DEFAULT 0,
    games_won       INTEGER DEFAULT 0,
    games_as_werewolf INTEGER DEFAULT 0,
    games_won_as_werewolf INTEGER DEFAULT 0,
    games_as_villager INTEGER DEFAULT 0,
    games_won_as_villager INTEGER DEFAULT 0,
    games_as_seer   INTEGER DEFAULT 0,
    games_won_as_seer INTEGER DEFAULT 0,
    total_votes_cast INTEGER DEFAULT 0,
    correct_votes   INTEGER DEFAULT 0,  -- Voted for werewolf
    survival_rate   DECIMAL(5,2),  -- % of games survived to end
    avg_game_duration INTERVAL,
    last_updated    TIMESTAMPTZ DEFAULT NOW()
);

-- Game replays (pre-computed for fast loading)
CREATE TABLE game_replays (
    replay_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id         UUID NOT NULL UNIQUE REFERENCES games(game_id) ON DELETE CASCADE,
    replay_data     JSONB NOT NULL,  -- Complete replay frames
    duration_ms     BIGINT,
    key_moments     JSONB DEFAULT '[]'::jsonb,  -- Tagged interesting moments
    generated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_replay_game ON game_replays(game_id);
```

### 11.2 Redis Schema Summary

| Key Pattern | Type | Purpose | TTL |
|-------------|------|---------|-----|
| `game:{id}:info` | Hash | Game metadata & current phase | 4 hours |
| `game:{id}:player:{pid}` | Hash | Individual player state (role, alive) | 4 hours |
| `game:{id}:alive` | Set | Currently alive player IDs | 4 hours |
| `game:{id}:werewolves` | Set | Werewolf player IDs | 4 hours |
| `game:{id}:events` | Stream | Event log (XADD) | 24 hours |
| `game:{id}:ww_chat` | Stream | Werewolf chat | 4 hours |
| `game:{id}:public_chat` | Stream | Public chat | 4 hours |
| `game:{id}:votes` | Hash | Current round votes | 4 hours |
| `player:{id}:session` | Hash | Current game/socket mapping | 4 hours |
| `lobby:waiting` | Sorted Set | Available lobbies (by creation time) | 1 hour |
| `matchmaking:queue:{mode}` | Sorted Set | Matchmaking queue | 5 min |

---

## 12. Implementation Roadmap

### 12.1 Phase 1: Core Game Engine (Weeks 1-4)

**Deliverables:**
- [ ] Game state machine with all 15 states
- [ ] Night action resolution engine with priority ordering
- [ ] Role assignment system (configurable role counts)
- [ ] Basic WebSocket server with room management
- [ ] In-memory game state (single server)
- [ ] Event sourcing foundation (in-memory event log)

**Tech:** Node.js, Socket.IO, TypeScript

### 12.2 Phase 2: Persistence & Scaling (Weeks 5-8)

**Deliverables:**
- [ ] Redis integration for game state and pub/sub
- [ ] PostgreSQL schema and event persistence
- [ ] Socket.IO Redis adapter for horizontal scaling
- [ ] Connection state recovery for disconnections
- [ ] Game replay engine
- [ ] Player statistics aggregation

**Tech:** Redis Cluster, PostgreSQL, TypeORM/Prisma

### 12.3 Phase 3: AI Agent Integration (Weeks 9-12)

**Deliverables:**
- [ ] Python/FastAPI agent service
- [ ] A2A protocol endpoint implementation
- [ ] Role-specific prompt templates
- [ ] Agent memory system (per-game context)
- [ ] LLM cost optimization (caching, model routing)
- [ ] Inter-service communication (HTTP + circuit breaker)

**Tech:** Python, FastAPI, LangChain, OpenAI API

### 12.4 Phase 4: Anti-Cheat & Analytics (Weeks 13-16)

**Deliverables:**
- [ ] Complete server-side validation pipeline
- [ ] Replay-based anomaly detection
- [ ] Spectator mode with delayed information
- [ ] Leaderboards and player stats API
- [ ] Game analytics dashboard
- [ ] Load testing (target: 10K concurrent games)

**Tech:** Node.js analytics service, Prometheus, Grafana

### 12.5 Phase 5: Production Hardening (Weeks 17-20)

**Deliverables:**
- [ ] Kubernetes deployment with HPA
- [ ] Multi-region deployment
- [ ] Rate limiting and DDoS protection
- [ ] Comprehensive monitoring and alerting
- [ ] Disaster recovery procedures
- [ ] Security audit and penetration testing

**Tech:** Kubernetes, Terraform, AWS/GCP

---

## Key Sequence Diagrams

### A. Complete Game Flow

```
Client A          Client B         Game Server      Redis      AI Service     PostgreSQL
  |                  |                  |             |            |             |
  │── join_game() ──►│                  │             │            │             │
  │                  │── join_game() ──►│             │            │             │
  │                  │                  │── HSET game:info ───────►│             │
  │                  │                  │── SADD players           │             │
  │◄─ player_joined ─│◄─ player_joined │             │            │             │
  │                  │                  │             │            │             │
  │── start_game() ─►│                  │             │            │             │
  │                  │◄── role_assigned │             │            │             │
  │◄── role_assigned─│                  │             │            │             │
  │                  │                  │             │            │             │
  │                  │                  │ [NIGHT phase]            │             │
  │                  │◄─ seer_your_turn │             │            │             │
  │◄─ ww_your_turn ──│                  │             │            │             │
  │── select_target ►│                  │             │            │             │
  │                  │── investigate ──►│             │            │             │
  │                  │                  │── resolve night ──────────│             │
  │                  │                  │             │            │             │
  │                  │                  │ [DAWN phase]             │             │
  │◄─ dawn_announce ─│◄─ dawn_announce │             │            │             │
  │                  │                  │             │            │             │
  │                  │                  │ [DAY_DISCUSS]            │             │
  │── chat_message ─►│                  │             │            │             │
  │                  │◄─ chat_message ──│             │            │             │
  │                  │                  │             │            │             │
  │                  │                  │ [VOTING phase]           │             │
  │── cast_vote() ──►│                  │             │            │             │
  │                  │── cast_vote() ──►│             │            │             │
  │                  │                  │── tally votes            │             │
  │◄─ vote_result ───│◄─ vote_result ──│             │            │             │
  │                  │                  │             │            │             │
  │                  │                  │ [CHECK_WIN]              │             │
  │                  │                  │             │            │             │
  │                  │                  │ [GAME_OVER]              │             │
  │◄─ game_ended() ──│◄─ game_ended() ─│             │            │             │
  │◄─ roles_revealed │◄─ roles_revealed│             │            │             │
  │                  │                  │── save_events()──────────│────────────►│
  │                  │                  │             │            │             │
```

### B. AI Agent Action Request

```
Game Server                                    AI Agent Service        LLM API
    │                                              │                     │
    │── HTTP POST /agents/action ─────────────────►│                     │
    │  { game_id, agent_id, role, context }        │                     │
    │                                              │── build_prompt() ──►│
    │                                              │                     │
    │                                              │◄── LLM response ────│
    │                                              │                     │
    │                                              │── parse_action()    │
    │                                              │                     │
    │◄── { action_type, target_id, reasoning } ────│                     │
    │                                              │                     │
    │── validate action (server-side)              │                     │
    │── apply to game state                        │                     │
```

### C. Disconnection & Reconnection

```
Client                 Game Server              Redis
  │                        │                      │
  │◄── connected ──────────│                      │
  │                        │── HSET session       │
  │                        │                      │
  X  [connection lost]     │                      │
  │                        │                      │
  │                        │── detect disconnect  │
  │                        │── mark player AFK    │
  │                        │                      │
  │── reconnect() ────────►│                      │
  │  { sessionId, offset } │                      │
  │                        │                      │
  │◄── recovered state ────│◄── XRANGE events    │
  │◄── missed events ──────│                      │
  │                        │                      │
  │◄── sync complete ──────│                      │
```

---

## Source Index

[^10^]: Stack Overflow - "Design pattern for werewolf/social deduction game" (2019). https://stackoverflow.com/questions/59145515/design-pattern-for-werewolfsocial-deduction-game

[^17^]: OneUptime - "How to Implement Game World State Synchronization with Redis" (2026). https://oneuptime.com/blog/post/2026-03-31-redis-game-world-state-sync/view

[^20^]: Dev.to - "When to use ws vs socket.io (And Why We Switched)" (2025). https://dev.to/alex_aslam/nodejs-websockets-when-to-use-ws-vs-socketio-and-why-we-switched-di9

[^21^]: Dev.to - "Building Scalable Real-Time Multiplayer Card Games" (2025). https://dev.to/krishanvijay/building-scalable-real-time-multiplayer-card-games-3kn6

[^37^]: i3D.net - "Comparing server- and client-side anti-cheat solutions" (2024). https://www.i3d.net/ban-or-not-comparing-server-client-side-anti-cheat-solutions/

[^39^]: OneUptime - "How to Build a Multi-Player Game Backend on AWS" (2026). https://oneuptime.com/blog/post/2026-02-12-build-a-multi-player-game-backend-on-aws/view

[^43^]: AcquaintSoft - "FastAPI vs Node.js vs Go: 2026 Benchmark Reality Check" (2026). https://acquaintsoft.com/blog/fastapi-vs-nodejs-vs-go-performance-benchmarks

[^45^]: Anybrain - "Client-side vs Server-side anti-cheat" (2022). https://blog.anybrain.gg/client-side-vs-server-side-anti-cheat-6721d38eb347

[^47^]: OneUptime - "How to Build Matchmaking Systems with Redis" (2026). https://oneuptime.com/blog/post/2026-01-21-redis-matchmaking-systems/view

[^76^]: GDQuest - "Make a Finite State Machine in Godot 4" (2024). https://gdquest.com/tutorial/godot/design-patterns/finite-state-machine/

[^172^]: GitHub - "realtime_ai_dungeon_master" (2025). https://github.com/ntanwir10/realtime_ai_dungeon_master

[^173^]: Dev.to - "Real-Time AI Dungeon Master: Multiplayer Storytelling with Redis 8" (2025). https://dev.to/ntanwir10/real-time-ai-dungeon-master-multiplayer-storytelling-with-redis-8-streams-pubsub-redisjson-j32

[^174^]: OneUptime - "How to Implement Game State Management with Redis" (2026). https://oneuptime.com/blog/post/2026-01-21-redis-game-state-management/view

[^190^]: i3D.net - "Comparing server- and client-side anti-cheat solutions" (2024). https://www.i3d.net/ban-or-not-comparing-server-client-side-anti-cheat-solutions/

[^191^]: Hacker News - "How can cheats exist in a server authoritative game engine architecture?" (2024). https://news.ycombinator.com/item?id=40642637

[^196^]: OneUptime - "How to Trace a Polyglot Microservices Architecture" (2026). https://oneuptime.com/blog/post/2026-02-06-trace-polyglot-microservices-architecture/view

[^197^]: Frontender Magazine - "Building Multiplayer Games with Node.js and Socket.IO" (2013). https://github.com/FrontenderMagazine/building-multiplayer-games-with-node-js-and-socket-io/blob/master/eng.md

[^200^]: Anybrain - "Client-side vs Server-side anti-cheat" (2022). https://blog.anybrain.gg/client-side-vs-server-side-anti-cheat-6721d38eb347

[^208^]: Medium - "Scaling Socket.IO: Redis Adapters and Namespace Partitioning for 100K+ Connections" (2025). https://medium.com/@connect.hashblock/scaling-socket-io-redis-adapters-and-namespace-partitioning-for-100k-connections-afd01c6938e7

[^209^]: Medium/PlainEnglish - "Mastering Event Sourcing and CQRS with a Hero Adventure Game Example in Node.js" (2025). https://javascript.plainenglish.io/mastering-event-sourcing-and-cqrs-with-a-hero-adventure-game-example-in-node-js-and-typescript-b321fa9717ab

[^211^]: Werewolves of the Dark Arts - "Night Phase" (n.d.). https://werewolfdarkarts.com/pages/nightphase.php

[^214^]: Ably - "What it really takes to scale Socket.IO in production" (2025). https://ably.com/topic/scaling-socketio

[^218^]: WikiWolf - "Roles" (n.d.). http://wikiwolf.wikidot.com/roles

[^231^]: Socket.IO Docs - "Connection state recovery" (v4). https://socket.io/docs/v4/connection-state-recovery

[^232^]: OneUptime - "How to Implement Reconnection Logic for WebSockets" (2026). https://oneuptime.com/blog/post/2026-01-27-websocket-reconnection/view

[^235^]: Godot Forum - "Creating a Finite State Machine for turn-based combat" (2026). https://forum.godotengine.org/t/creating-a-finite-state-machine-for-turn-based-combat-how-to-handle-button-input-signals/137128

[^238^]: Kent C. Dodds - "Implementing a simple state machine library in JavaScript" (2020). https://kentcdodds.com/blog/implementing-a-simple-state-machine-library-in-javascript

[^264^]: GroovyWeb - "Node.js vs Python for Backend: Which Wins in 2026?" (2026). https://www.groovyweb.co/blog/nodejs-vs-python-backend-comparison-2026

[^265^]: GSB - "Player Data Schema Design: NoSQL vs SQL for Game Backends" (2026). https://gsb.supercraft.host/blog/player-data-schema-design-nosql-vs-sql/

[^266^]: Medium - "Architecting Scalable FastAPI Systems for Large Language Model (LLM) Applications" (2025). https://medium.com/@moradikor296/architecting-scalable-fastapi-systems-for-large-language-model-llm-applications-and-external-cf72f76ad849

[^267^]: GeeksforGeeks - "How to Design a Database for Multiplayer Online Games" (2024). https://www.geeksforgeeks.org/dbms/how-to-design-a-database-for-multiplayer-online-games/

[^268^]: Fenix (Tecnico Lisboa) - "A Natural Language capable agent to play a Werewolf game" (n.d.). https://fenix.tecnico.ulisboa.pt/downloadFile/281870113703992/extended-summary%2073622.pdf

[^47^]: Brenbarn - "How to play werewolf" (n.d.). https://www.brenbarn.net/werewolf/rules.html
