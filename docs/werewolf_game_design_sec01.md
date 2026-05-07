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
