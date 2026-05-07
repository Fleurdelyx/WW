# Werewolf Game Platform: Research Artifact Synthesis

## 1. Key Themes Across All Dimensions

### Theme 1: The Memory-Deception-Chat Cognitive Loop
The most frequently reinforced architectural insight across dimensions is that compelling gameplay emerges from a recursive cycle: (a) memory formation, (b) belief updating, (c) deceptive narrative construction, (d) contradiction detection. Dim05 documents belief tracking with exponential smoothing (alpha=0.7); Dim06 provides the GRPO-trained Stackelberg Speaker for persuasive utterance generation; Dim07's chat system is the channel. Every message should automatically trigger belief updates, suspicion recalculation, and consistency checks across all agents. This is described as a "cognitive event bus" in the cross-dimension insights.

**Source coverage**: Dim05 (belief matrices, ReCon dual-perspective reasoning), Dim06 (Stackelberg Speaker, contradiction detection), Dim07 (structured message types as cognitive events)

### Theme 2: Cost Architecture as Design Constraint
LLM costs create a sharp viability divide: $2.30/game unoptimized drops to $0.31/game optimized at 8 agents x 50 turns. Human-only games cost ~$0 infrastructure. Mixed human-AI games cost ~$0.15/game (1-2 AI agents). Full AI simulation at 1000 games/day costs $310/day optimized. Five levers drive the 70-85% reduction: prompt caching (59-90%), context compaction (50-70%), model routing (40-70%), sliding window context management, and JSON schema-constrained outputs.

**Source coverage**: Dim02 (per-game cost model, 5-lever framework), Dim08 (player type distribution), Dim09 (simulation throughput targets), Dim10 (3-scenario cost spreadsheet: $112.50-$600/month at 100 games/day)

### Theme 3: Polyglot Authoritative Server Architecture
A 3-layer architecture is the consensus pattern: Node.js/Socket.IO for real-time game orchestration (~44% higher RPS than FastAPI for I/O), Python/FastAPI for LLM agent orchestration (native AI/ML ecosystem), Redis Cluster for state synchronization (sub-millisecond). The authoritative server model is non-negotiable for social deduction -- the server maintains full game state and generates per-player views before sending updates. Event sourcing (Redis Streams + PostgreSQL) is the highest-ROI single decision, unlocking replay, AI training data, and real-time spectator streaming simultaneously.

**Source coverage**: Dim01 (full architecture with 3-layer diagram, information boundary matrix), Dim02 (A2A protocol, HTTP inter-service code), Dim08 (Socket.IO Redis adapter, Kubernetes scaling)

### Theme 4: Deception-Detection Asymmetry as Natural Difficulty Curve
Empirically validated: deception scales faster than detection (93% TSR vs 10% FCR in Traitors; 31% deception rate vs 48% detection recall in WOLF benchmark). Rather than fighting this, the platform should leverage it as a core design feature -- early AI agents are convincing liars but poor lie detectors, creating natural skill progression. This informs a "deception academy" training curriculum: honest play -> lying -> detecting -> advanced bluffing.

**Source coverage**: Dim04 (role design), Dim05 (trust networks evolve over rounds), Dim06 (detection algorithms, GRPO training), Dim09 (metrics track this progression)

### Theme 5: ELO as Dual-Use Infrastructure (Matchmaking + AI Benchmark)
The same rating system serves two purposes: matching human players of similar skill, and benchmarking LLM agents against each other and humans. Simple Multiplayer Elo (SME) with per-role tracking is the validated approach. Per-role ELO (Overall, Villager, Werewolf, Seer, Doctor) plus auxiliary ratings (Deception, Detection, Influence, Survival) provides comprehensive skill assessment. The leaderboard becomes a marketing tool: "see how GPT-4o compares to Claude at Werewolf."

**Source coverage**: Dim08 (SME algorithm, role difficulty weights), Dim09 (tournament system, 3 rating variants, TrueSkill alternative), cross-verification HC-7 (5+ independent implementations)

### Theme 6: Three-Tier Agent Architecture for Cost-Efficiency
Rule-Based (<1ms, negligible cost), Personality-Driven (<10ms, Big Five/MBTI trait vectors), and LLM-Powered (0.5-5s, $0.01-0.15 per decision). A hybrid neuro-symbolic approach achieves +7.2% entailment consistency and +5.3% multi-step accuracy over pure LLM. Game modes map to agent tiers: Tutorial -> Rule-Based, Casual -> Personality-Driven, Competitive -> LLM-Powered, Tournament -> LLM + LLM-as-Judge.

**Source coverage**: Dim02 (3-tier comparison table, hybrid architecture), Dim09 (tournament automation), Dim10 (cost model by agent tier)

### Theme 7: Night Phase as Architectural Proving Ground
The night phase encapsulates all hardest challenges in miniature: parallel secret actions, information hiding, ordered resolution, state synchronization, anti-cheat. The 11-category resolution order (Redirects -> Roleblocks -> Protection -> Visits -> Item Theft -> Kills -> Report Visits -> Item Passing -> Identity Swap -> Report Kills -> Report Revives) is production-validated by werewolv.es. If night is architected correctly, day phase follows naturally.

**Source coverage**: Dim01 (resolution engine in TypeScript), Dim03 (full 11-category pipeline, conflict resolution rules), Dim04 (role abilities determine per-player night visibility)

### Theme 8: Unified NLP Pipeline for Moderation and Gameplay
The NLP pipeline for toxicity filtering and the pipeline for contradiction detection are structurally identical -- both parse natural language, extract claims, and compare against rules. A 5-tier unified pipeline is recommended: Tier 1 (keyword rules), Tier 2 (embedding similarity), Tier 3 (transformer classifier), Tier 4 (LLM reasoning), Tier 5 (game logic contradiction check). This adds deception detection as just another plugin.

**Source coverage**: Dim06 (ContradictionChecker), Dim07 (4-tier moderation pipeline extensible to Tier 5)

---

## 2. Critical Data Points with Citations

### Architecture
- **Authoritative server with per-player view generation**: Server maintains `FullGameState`, transforms via `createPlayerView()` before sending. Information boundary matrix defines 9-row classification of what each client type sees (Dim01)
- **3-layer system diagram**: Client Layer (Web App + LLM Agent) -> API Gateway (Nginx/ALB) -> Game Server (Node.js) + AI Agent Service (Python/FastAPI) + Analytics Service (Node.js/Go) -> Data Layer (Redis + PostgreSQL) (Dim01)
- **WebSocket + Redis Pub/Sub**: Socket.IO with Redis Adapter for horizontal scaling; Redis pub/sub for cross-server broadcast <1ms delivery (Dim01, Dim07, Dim08)
- **Event sourcing with dual-store**: Redis Streams for real-time event stream, PostgreSQL for persistent append-only log. Enables replay, training data generation, spectator streaming from single decision (Dim01, Dim09)

### Game Loop
- **11-category night action resolution**: Redirects(1) -> Roleblocks(2) -> Protection(3) -> Most Visits(4) -> Item Thefts(5) -> Kills(6) -> Report Visits(7) -> Item Passing(8) -> Swap Identities(9) -> Report Kills(10) -> Report Revives(11). Actions within category execute simultaneously (Dim03)
- **Win condition checks at 4 points**: After night kill resolution, after lynch execution, after Hunter revenge kill, after meteor resolution (Dim03)
- **Meteor deadlock prevention**: After 5-6 rounds of no-lynch + no-kill, offending faction loses all members. Creates MYLO/CYLO strategic pressure (Dim03)
- **Timing defaults**: Day 13 min (3-20 configurable), Night 5 min (1-9), Vote Lock 90 sec, Post-Lynch 90 sec. Scale Timer: 70% at full players, 100% at 50%, 70% at endgame (Dim03)
- **Balance formula**: `b = 1 - |2*p_imp - 1|` validated across 90,720-game experiments. 3:1 villager:wolf ratio is baseline (Dim03, Dim04)

### Role Design
- **Ultimate Werewolf weighting system**: Villager +1, Seer +7, Doctor +3, Witch +5, Hunter +3, Werewolf -6. Target sum near 0 (Dim04)
- **15+ role specifications**: 6 core (Villager, Werewolf, Seer, Doctor, Hunter, Witch), 9+ extended (Mason, Alpha Wolf, Shapeshifter, Minion, Sorceress, Serial Killer, Tanner/Jester/Fool, Cupid, Bodyguard variants) (Dim04)
- **Role setup presets**: Classic 8p (4 Villager, 1 Seer, 1 Doctor, 2 Werewolf, weight +2), Standard 12p (4 Villager, 1 Seer, 1 Witch, 1 Hunter, 1 Mason pair, 3 Werewolf, 1 Minion), Large 16p (Dim04)
- **Open/semi-open/closed setup configurations** with balance calculators (Dim04)

### AI Agent Framework
- **A2A protocol**: Google-led open standard, Linux Foundation-governed, 150+ supporters. Agent Cards at `/.well-known/agent.json` for capability discovery. HTTP/JSON-RPC 2.0 + SSE streaming (Dim02)
- **Prompt templates by role**: Werewolf (3 strategies: Bold/Deep Cover/Aggressive Accuser), Villager, Seer, Doctor -- each with role identity, objectives, strategic guidance, response format (Dim02)
- **JSON action schemas**: NightAction (reasoning, action, target), DayDiscussion (reasoning, public_statement, suspicion_scores), VoteAction (reasoning, action, target, confidence), unified AgentTurn schema. Enforced via OpenAI Structured Outputs with `strict: true` (Dim02)
- **GRPO training for persuasion**: Qwen2.5-7B-Instruct + LoRA rank 16, group size 8, beta 0.04, epsilon 0.2, lr 1e-6, 3 epochs, ~50 hours on 4x A800 GPUs. 4,000 instances per game from 500 self-play logs (Dim06)
- **Model routing cost savings**: 40-70% by routing simple tasks to cheaper models, reserving frontier models for complex deception (Dim02)
- **Big Five (OCEAN) personality model**: JSON schema for trait vectors (-1 to +1), injected into prompts for behavior variation (Dim02)

### Memory Systems
- **4-tier memory hierarchy**: Working Memory (STM, ~2-8K tokens, volatile) -> Episodic Memory (LTM, vector DB, cross-game) -> Semantic Memory (RAG/structured KB) -> Procedural Memory (LLM weights + code) (Dim05)
- **Belief tracking 3-layer approach**: Layer 1 (symbolic role probability distribution per player), Layer 2 (scalar suspicion score s in [0,1] via exponential smoothing alpha=0.7), Layer 3 (MultiMind Transformer-based belief matrix) (Dim05)
- **ReCon dual-perspective reasoning**: Formulation + refinement contemplation with first-order and second-order perspective transitions. Outperforms CoT across all 6 evaluated metrics (ACL Findings) (Dim05, Dim06)
- **Trust network**: Directed weighted graph with game-theoretic update rules, direct observations + propagated reputation, explicit malicious misinformation handling (Dim05)
- **Memory compression cascade**: Tool output offloading -> sliding window -> LLM summarization. 22-57% token reduction. Active compression outperforms passive heuristics (Dim05)
- **AgeMem unified memory management**: Tool-based actions (store, retrieve, update, summarize, discard) learned via 3-stage progressive GRPO. Outperforms separate STM/LTM pipelines (Dim05)

### Deception Systems
- **Stackelberg Speaker model**: Formalizes turn-based dialogue as sequential Stackelberg competition. Reward = pi_F(desired_response) - pi_F(undesired_response). Three-step pipeline: Intent Identification -> Impact Measurement -> GRPO Optimization (Dim06)
- **Deception taxonomy**: 4 categories -- Omission (withholding info), Distortion (partial truth), Fabrication (false claims), Misdirection (redirecting attention). Each with Werewolf-specific examples (Dim06)
- **Detection algorithms**: ContradictionChecker (decomposes messages, checks against memory), Receipt-Based Logic (verify claim consistency), Social Tells (pause frequency, linguistic markers). WOLF benchmark: 31% deception rate vs 48% detection recall (Dim06)
- **Bluffing strategy library**: Role-specific strategies (False Seer Claim, Deep Cover, Bus Teammate) with risk/reward ratings and timing guidance (Dim06)
- **Safety guardrails**: Prevent deception generalization beyond game context. Content filters, behavioral constraints, monitoring for policy violations (Dim06)

### Chat System
- **5 channel types**: public (day chat), werewolf (night faction chat), spectator (dead/observer chat), system (game events), whisper (ephemeral 5min TTL). Server-side role validation on every message (Dim07)
- **7 structured message types**: FreeText, Vote, Accuse, Defend, ClaimRole, Whisper, System. Each with validated JSON schema (Dim07)
- **4-tier moderation pipeline**: Keyword filter (fast path) -> Embedding classifier -> Fine-tuned transformer -> LLM for edge cases. Extensible to Tier 5 for game logic contradiction check (Dim07)
- **Rate limits**: 5 msg/10s public, 10 msg/10s werewolf, 1 vote/phase, 3 whispers/round, 1 typing indicator/3s (Dim07)
- **Typing indicators**: Three-dot animation with staggered bounce, Redis-backed presence store. Potential deception signal via pause frequency analysis (Dim07)

### Multiplayer/Lobby
- **6-state lobby FSM**: CREATED -> WAITING -> ROLE_ASSIGNMENT -> STARTING -> IN_GAME -> ENDED. Each with entry conditions, timeouts, auto-actions (Dim08)
- **4 matchmaking modes**: Quick Match, Ranked (ELO), Custom Room, AI Tournament. Redis Sorted Sets for O(log n) range queries (Dim08)
- **ELO with expanding skill window**: Base +/-100, expands 50/min, max +/-500. Bot fill offered after 30s. Role-specific K-factors (calibration 40 -> discovery 32 -> normal 20 -> established 16) (Dim08)
- **Role difficulty weights**: Villager 1.0, Werewolf 1.15, Seer 1.10, Doctor 1.05, Hunter 1.05, Witch 1.10, Cupid 0.95 (Dim08)
- **Point-based role assignment**: Sum of role point values targets near zero. 4 assignment types: random, balanced, preset, skill_weighted (Dim08)
- **Ghost mode**: Eliminated players observe with full information but limited communication (emojis, preset phrases). Improves retention and AI training data (cross-dimension Insight 8)

### Simulation/Analytics
- **AI-only simulation throughput**: Werewolf Arena ~50 games/hour (8 LLMs, Cloud TPU), WOLF ~30 games/hour (4 LLMs, single GPU), Werewolf-AgentX ~120 games/hour (8 agents, GitHub Actions). GPU batch (Pgx) achieves 1.9M steps/sec (Dim09)
- **Tournament formats**: Round-Robin (best for 4-16 agents), Swiss System (FIDE Dutch, best for 16+), Single/Double Elimination bracket. Burstein pairing > Dutch BBP in ranking quality (Dim09)
- **5 rating system variants**: Standard ELO, Team-Based ELO, Performance-Weighted ELO (MOBA-style), TrueSkill (Gaussian, Microsoft), Elo-MMR (Bayesian, Codeforces). TrueSkill converges in ~3 games for 8P-FFA (Dim09)
- **Behavioral metrics suite**: Deception score, detection accuracy, influence score, vote accuracy, survival rate, contradiction rate, trust consistency, persuasion effectiveness (Dim09)
- **LLM-as-a-Judge evaluation**: Automated scoring of agent responses on strategy, coherence, fairness, role-appropriateness. Human validation required for ground truth (Dim09)
- **Data pipeline**: Events -> Kafka/Redis Streams -> ClickHouse -> Streamlit dashboard. Event schema covers 15+ event types (Dim09)
- **Emergent strategy detection**: Automated identification of novel strategies via pattern mining on game transcripts (Dim09)

### UI/UX/Roadmap
- **Day/night visual transitions**: 2.5s CSS transition, sine-wave brightness interpolation, warm gold (#E8B86D) day to deep indigo (#1A1A2E) night, wolf howl audio cue at 1.5s (Dim10)
- **Voting interface**: Player cards in responsive grid, 5 states (alive/dead/voted/accused/selected-by-me), live vote tally with segmented progress bar, 3-phase reveal animation (vote lock -> tally reveal -> resolution) (Dim10)
- **Elimination effects**: Lynch (screen shake, chromatic aberration, grayscale tilt), Night kill (crimson flash, claw scratches), Poison (green dissolve shader), Protection saved (golden shield) (Dim10)
- **24-week MVP timeline**: Phase 1 Foundation (W1-4), Phase 2 Core Gameplay (W5-8), Phase 3 Alpha (W9-10), Phase 4 Beta & LLM (W11-18), Phase 5 Full Launch (W19-24) (Dim10)
- **Tech stack**: React 18 + TypeScript + Framer Motion + Zustand + Tailwind (frontend); Node.js + Socket.IO + FastAPI + PostgreSQL + Redis (backend); LiteLLM model router (Dim10)
- **3-tier cost model**: Free (human-only + 1 rule-based bot), Premium (mixed human-AI, up to 3 LLM agents), Simulation (AI-only tournaments at bulk pricing) (cross-dimension Insight 3)

---

## 3. Architecture Decisions and Justifications

### Decision: Polyglot Backend (Node.js + Python + Redis)
- **Justification**: Node.js provides ~44% higher RPS than FastAPI for I/O-bound WebSocket tasks with the deepest WebSocket ecosystem. Python/FastAPI provides native AI/ML ecosystem (LangChain, auto-OpenAPI docs). Redis provides sub-millisecond operations with battle-tested game reliability.
- **Confirmed by**: 4 dimensions (Dim01, Dim02, Dim08, Dim10), industry consensus pattern
- **Confidence**: HIGH

### Decision: Event Sourcing + CQRS
- **Justification**: A single architectural decision unlocks three product features: replay system, AI training data generation, real-time spectator streaming. Redis Streams for real-time event stream, PostgreSQL for persistent append-only log.
- **Confirmed by**: Dim01 (dual-store architecture), Dim09 (complete event schema and rehydration algorithm)
- **Confidence**: HIGH

### Decision: Three-Tier Agent Architecture (Rule-Based / Personality-Driven / LLM-Powered)
- **Justification**: Cost architecture demands tiered approach. Rule-based for tutorials (<1ms, zero cost), personality-driven for casual (Big Five traits, <10ms), LLM for competitive ($0.01-0.15/decision). Neuro-symbolic hybrid achieves +7.2% consistency over pure LLM.
- **Confirmed by**: Dim02 (full comparison table), multiple research sources on hybrid architectures
- **Confidence**: HIGH

### Decision: GRPO for Persuasive Agent Training
- **Justification**: Eliminates critic model need; computes relative advantages across response groups. Validated across Werewolf, Avalon, ONUW (AAAI-26 publication). Group size 8, LoRA rank 16, ~50 hours on 4x A800.
- **Confirmed by**: Dim02 (cost-efficient training), Dim06 (full GRPOTrainer pseudocode)
- **Confidence**: HIGH

### Decision: ReCon Dual-Perspective Reasoning for Theory of Mind
- **Justification**: Outperforms Chain-of-Thought across all 6 evaluated metrics. Formulation + refinement contemplation with first-order and second-order perspective transitions. Concrete prompt-based implementation.
- **Confirmed by**: Dim05 (complete prompt templates), Dim06 (integration with deception detection), ACL Findings publication
- **Confidence**: HIGH

### Decision: ELO with Per-Role Tracking (SME)
- **Justification**: Traditional ELO designed for 1v1; multiplayer social deduction requires adaptation. SME addresses "excellent player can still lose due to teammates." Per-role tracking (Overall, Villager, Werewolf, Seer, Doctor) validated by Werewolf Arena, Foaster.ai, Chessmata.
- **Confirmed by**: Dim08 (SME algorithm), Dim09 (3 rating variants), 5+ independent implementations
- **Confidence**: HIGH

### Decision: Tiered Content Moderation Pipeline
- **Justification**: 4-tier approach (keyword -> embedding -> transformer -> LLM) balances speed and accuracy. 90%+ of toxic content caught at Tier 1-2. Extensible to Tier 5 for game logic contradiction checking, unifying moderation and gameplay NLP.
- **Confirmed by**: Dim07 (full pipeline spec), Dim06 (contradiction detection algorithms)
- **Confidence**: MEDIUM-HIGH

### Decision: A2A Protocol for Inter-Agent Coordination
- **Justification**: Open standard, Linux Foundation-governed, 150+ supporters. Agent Cards enable capability discovery. HTTP/JSON-RPC 2.0 + SSE streaming. Cross-vendor interoperability. But nascent adoption in social deduction.
- **Confirmed by**: Dim02 (full implementation), Werewolf Arena (only social deduction adopter)
- **Confidence**: MEDIUM (strong momentum, limited game validation)

### Decision: Ghost Mode for Eliminated Players
- **Justification**: Solves two problems simultaneously: human retention (eliminated players don't leave) and AI training (more data points per game). Ghosts see all roles (full information) but communicate via limited channels only.
- **Confirmed by**: Dim04 (BotC dead player participation reference), Dim08 (spectator architecture), Dim09 (simulation data benefits)
- **Confidence**: MEDIUM

---

## 4. Content Recommendations Per Section

### For Architecture Section
- Lead with the 3-layer architecture diagram (Dim01)
- Include the information boundary matrix as a key table (Dim01)
- Present event sourcing as the highest-ROI decision with its 1-to-3 feature unlock
- Include the `createPlayerView()` TypeScript pseudo-code for per-player state transformation
- Cover the 11-category night resolution order as a critical correctness requirement

### For Game Loop Section
- Present the complete FSM state diagram with all 14 states and transitions (Dim01, Dim03)
- Include the 11-category night resolution table as a reference table
- Cover win condition algorithms (village: wolfCount==0, werewolf: wolfCount>=nonWolfCount)
- Include the timing configuration table with defaults, min/max, and descriptions
- Cover the meteor deadlock prevention mechanic with its strategic implications (MYLO/CYLO)
- Present the balance formula `b = 1 - |2*p_imp - 1|` with validation data

### For Role Design Section
- Present the Ultimate Werewolf weighting table as the canonical balance reference
- Include role specification tables for all 6 core + 9 extended roles
- Cover the 3 preset configurations (Classic 8p, Standard 12p, Large 16p) with weight calculations
- Include the setup balance calculator formula
- Present the open/semi-open/closed setup discussion
- Cover role synergy and anti-synergy matrix

### For AI Agent Framework Section
- Present the 3-tier agent comparison table (rule-based / personality-driven / LLM-powered)
- Include the A2A protocol architecture diagram and Agent Card JSON spec
- Present complete prompt templates for Werewolf, Villager, Seer, Doctor roles
- Include all 4 JSON action schemas (NightAction, DayDiscussion, VoteAction, unified AgentTurn)
- Cover the cost optimization 5-lever framework with percentage savings
- Present the Big Five personality JSON schema

### For Memory Systems Section
- Present the 4-tier memory hierarchy diagram
- Include the STM and episodic memory JSON schemas
- Cover the 3-layer belief tracking approach (symbolic, scalar, Transformer-based)
- Present the ReCon dual-perspective reasoning prompt template
- Include the trust network update algorithm
- Cover the memory compression cascade with token reduction percentages

### For Deception Systems Section
- Present the Stackelberg Speaker mathematical formulation
- Include the full GRPOTrainer pseudocode (the most complete implementation reference)
- Present the 4-category deception taxonomy with Werewolf examples
- Include the ContradictionChecker algorithm pseudocode
- Cover the bluffing strategy library (False Seer, Deep Cover, Bus Teammate)
- Present the detection asymmetry data (93% TSR vs 10% FCR)

### For Chat System Section
- Present the multi-channel architecture diagram
- Include the channel configuration table (visibility, send/read permissions, TTL)
- Present all 7 message type JSON schemas
- Include the WebSocket event specification tables (client-to-server and server-to-client)
- Cover the 4-tier moderation pipeline with latency targets
- Present rate limiting configuration

### For Multiplayer/Lobby Section
- Present the 6-state lobby FSM diagram
- Include the matchmaking modes comparison table
- Present the ELO calculation pseudocode with role difficulty weights
- Include the role assignment algorithm with point-based balancing
- Cover the Redis data models for lobby state and matchmaking queues

### For Simulation/Analytics Section
- Present the simulation architecture diagram (Orchestrator -> Batch Runner -> Results DB)
- Include the throughput benchmarks table (Arena, WOLF, Pgx, AlphaZero)
- Present the tournament format comparison (Round-Robin, Swiss, Elimination)
- Include the ELO rating system architecture diagram (Overall + per-role + auxiliary)
- Cover the behavioral metrics suite definition
- Present the LLM-as-a-Judge evaluation framework

### For UI/UX/Roadmap Section
- Present the day/night color palette and transition spec
- Include the player card state definitions and voting interface spec
- Present the elimination effect descriptions (lynch, night kill, poison, protection)
- Include the MVP feature list with priorities (P0/P1/P2) and effort estimates
- Present the 24-week development timeline
- Include the 3-scenario cost model table

---

## 5. Tables That Should Appear in Final Document

1. **Information Boundary Matrix** (Dim01) -- 9-row table showing what each client type knows
2. **Architectural Decisions Summary** (Dim01) -- Decision/Choice/Rationale format
3. **11-Category Night Resolution Order** (Dim03) -- Priority/Category/Roles/Effect
4. **Timing Configuration Table** (Dim03) -- Parameter/Min/Max/Default/Description
5. **Ultimate Werewolf Role Weights** (Dim04) -- Role/Character Value table
6. **Preset Setup Configurations** (Dim04) -- Players/Villagers/Werewolves/Specials/Weight/Difficulty
7. **3-Tier Agent Comparison** (Dim02) -- 8-dimension comparison table
8. **A2A Protocol Comparison** (Dim02) -- Standardization/Discovery/Communication/Scope/Latency
9. **Model Cost Per Game** (Dim10) -- Model/Per Turn/Per Game (50 turns)/With 80% cache
10. **5-Lever Cost Optimization** (Dim02) -- Lever/Mechanism/Savings Range
11. **Memory Architecture Decision Matrix** (Dim05) -- 4 memory types x 7 dimensions
12. **Belief Tracking 3-Layer Comparison** (Dim05) -- Approach/Representation/Update/Pros/Cons
13. **Deception Taxonomy** (Dim06) -- Category/Definition/Werewolf Example/Detection Difficulty
14. **Bluffing Strategy Library** (Dim06) -- Strategy/Role/Risk/Reward/Timing
15. **Channel Configuration** (Dim07) -- Channel/Visibility/Send/Read/Persistence/TTL
16. **Message Type Schemas** (Dim07) -- 7 types with JSON structure
17. **Moderation Pipeline Tiers** (Dim07) -- Tier/Technology/Latency/Accuracy/Coverage
18. **Lobby State Definitions** (Dim08) -- State/Description/Entry/Timeout/Auto-Actions
19. **Matchmaking Modes** (Dim08) -- Mode/Description/Queue Pattern/Requirements
20. **Role Difficulty Weights** (Dim08) -- Role/Weight for ELO adjustment
21. **Tournament Format Comparison** (Dim09) -- Format/Rounds/Elimination/Best For/Complexity
22. **Simulation Throughput Benchmarks** (Dim09) -- System/Games/Hour/Agents/Hardware
23. **ELO K-Factor Schedule** (Dim09) -- Games Played/K-Factor/Phase
24. **MVP Feature List** (Dim10) -- P0/P1/P2 with effort estimates
25. **Tech Stack Recommendation** (Dim10) -- Layer/Technology/Rationale for Frontend/Backend/LLM/DevOps
26. **3-Scenario Cost Projection** (Dim10) -- Games/Day/Model/Daily/Monthly cost

---

## 6. Code Examples That Should Appear in Final Document

1. **`createPlayerView()` TypeScript function** (Dim01) -- Server-side view transformation
2. **WerewolfStateMachine TypeScript class** (Dim01) -- State transition with enter/exit/handleAction
3. **A2A Agent Card JSON** (Dim02) -- Capability discovery spec
4. **Complete role prompts** (Dim02) -- Werewolf, Villager, Seer, Doctor with JSON response format
5. **JSON action schemas** (Dim02) -- NightAction, DayDiscussion, VoteAction, AgentTurn (strict validation)
6. **STM JSON schema** (Dim05) -- Complete short-term memory data model
7. **Episodic memory entry schema** (Dim05) -- Cross-game player profile with behavioral patterns
8. **Belief state probability distribution** (Dim05) -- Per-player role probability
9. **StackelbergSpeaker Python class** (Dim06) -- Full persuasive utterance optimization pipeline
10. **GRPOTrainer Python class** (Dim06) -- Complete training loop with 5 phases
11. **ContradictionChecker pseudocode** (Dim06) -- Message decomposition and consistency check
12. **Channel creation JavaScript** (Dim07) -- Server-side role-based channel access
13. **Socket.IO middleware** (Dim07) -- Per-message authorization pattern
14. **MatchmakingEngine Python** (Dim08) -- Expanding skill window algorithm
15. **ELO update function** (Dim08) -- Team-based multiplayer adaptation
16. **RoleAssignmentEngine Python** (Dim08) -- Point-based balanced distribution
17. **Round-robin schedule generator** (Dim09) -- Circle method for tournaments
18. **Simulation config Python** (Dim09) -- Batch execution parameters
19. **Win condition check functions** (Dim03) -- Village and Werewolf algorithms
20. **Night resolution pipeline pseudocode** (Dim03) -- 11-category ordered execution

---

## 7. Research Gaps

### Gap 1: Client-Side Implementation Details
The research is heavily backend-focused. Dim10 provides UI/UX design specifications but lacks concrete client-side architecture: no state management patterns for the frontend, no reconnection handling for dropped WebSocket connections, no mobile-specific implementation guidance beyond "responsive design."

### Gap 2: Deployment and Operations
Missing: Kubernetes manifest examples, auto-scaling configuration, monitoring/alerting setup, disaster recovery procedures, CDN configuration for static assets, database migration strategies. Dim10 mentions Docker + Kubernetes but provides no specifics.

### Gap 3: Security Deep-Dive
While Dim01 covers authoritative server and information hiding, the research lacks: penetration testing scenarios, specific attack vectors for WebSocket-based games, rate limiting implementation details beyond configuration numbers, OAuth/JWT token lifecycle management, GDPR/privacy compliance for chat logging.

### Gap 4: Audio System
Dim10 references audio (wolf howl, ambient loops, sound cues) but provides no technical specification: audio format, compression, streaming architecture, spatial audio considerations, voice chat integration (a significant gap for a social deduction game).

### Gap 5: Mobile Native Experience
The research assumes a web-first approach (React + Socket.IO). Missing: native iOS/Android app architecture, push notifications for game events, offline mode considerations, battery optimization for long games, app store compliance.

### Gap 6: Internationalization (i18n)
No coverage of multi-language support for: game rules, role descriptions, chat messages (real-time translation?), system announcements, moderation (multi-language toxicity detection). Critical for global audience.

### Gap 7: Long-Term Persistence and Data Retention
While Redis + PostgreSQL are specified, missing: data retention policies, archival strategies for game logs, GDPR right-to-erasure implementation, database sharding for scale, backup and point-in-time recovery procedures.

### Gap 8: Player Onboarding and Tutorial System
Dim10's MVP includes basic roles but lacks: interactive tutorial design, progressive complexity introduction, first-time user experience (FTUE) flow, single-player practice mode specification, difficulty progression for human players.

### Gap 9: Community and Social Features
Missing: friend system, player reporting and reputation, clan/guild mechanics, tournament creation by users, custom role creation tools, user-generated content moderation, forum/community integration.

### Gap 10: Integration with External AI Platforms
While Dim02 covers LLM integration extensively, missing: OpenAI/Anthropic API error handling and retry logic, fallback model selection when primary is unavailable, API key rotation and quota management, local model deployment (Ollama/vLLM) for offline play, multi-model ensemble strategies.

### Gap 11: Quantitative Balance Validation
The balance formula `b = 1 - |2*p_imp - 1|` is validated at 90,720 games, but the research lacks: specific win rate targets per preset configuration, A/B testing framework for balance changes, automated balance regression detection, Monte Carlo simulation for setup validation.

### Gap 12: Accessibility
No coverage of: screen reader support for a chat-heavy game, colorblind-friendly palettes (despite heavy reliance on color-coding for factions), text-to-speech for chat messages, keyboard navigation, WCAG compliance targets.
