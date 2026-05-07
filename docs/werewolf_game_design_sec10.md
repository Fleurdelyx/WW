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
