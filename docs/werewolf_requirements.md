# Werewolf Social Deduction Game Platform — Technical Requirements Document

**Version**: 1.0
**Status**: Requirements Extraction Complete
**Scope**: Multiplayer Werewolf platform with human, AI bot, and LLM-powered AI player support

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [AI Player Framework](#2-ai-player-framework)
3. [Game Loop & Phases](#3-game-loop--phases)
4. [Roles & Meta Design](#4-roles--meta-design)
5. [Chat & Communication System](#5-chat--communication-system)
6. [UI/UX, Animations & Effects](#6-uiux-animations--effects)
7. [Game Modes & Customization](#7-game-modes--customization)
8. [AI-Only Simulation Mode](#8-ai-only-simulation-mode)
9. [Data & Analytics](#9-data--analytics)
10. [Development Roadmap](#10-development-roadmap)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Implicit Requirements](#12-implicit-requirements)
13. [Priority Summary Matrix](#13-priority-summary-matrix)

---

## Legend

| Priority | Definition |
|----------|------------|
| P0 | MVP-critical. Must be implemented for initial release. |
| P1 | Important. Required for full feature parity and player satisfaction. |
| P2 | Nice-to-have. Enhances experience but not blocking. |

---

## 1. System Architecture

### 1.1 Backend Infrastructure

**FR-ARCH-001** (P0): The backend shall expose a real-time multiplayer game server capable of managing multiple concurrent game lobbies with stateful session persistence.

**FR-ARCH-002** (P0): The backend shall implement a WebSocket-based communication layer for bidirectional real-time messaging between clients and the game server, with automatic reconnection handling and message ordering guarantees.

**FR-ARCH-003** (P0): The system shall persist game state to a durable store (database or event log) to enable recovery from server crashes and support post-game replay and analysis.

**FR-ARCH-004** (P0): The backend shall enforce strict player authentication and authorization, preventing unauthorized access to game lobbies, admin endpoints, and AI configuration interfaces.

**FR-ARCH-005** (P1): The backend shall expose RESTful APIs for lobby management, player profiles, game history retrieval, leaderboard queries, and configuration management.

**FR-ARCH-006** (P1): The backend shall implement an event-sourced architecture or structured event logging for all game actions (votes, ability uses, deaths, chat messages) to enable replay, audit trails, and analytics ingestion.

**FR-ARCH-007** (P1): The backend shall support horizontal scaling of game server instances behind a load balancer, with player sessions pinned to specific instances (sticky sessions) or distributed via a shared state store (Redis/similar).

**FR-ARCH-008** (P2): The backend shall support regional server deployment to minimize latency for geographically distributed players.

### 1.2 AI Integration Layer

**FR-ARCH-009** (P0): The system shall implement a modular AI Integration Layer (AIL) that abstracts LLM provider APIs (OpenAI, Anthropic, local models via vLLM/llama.cpp) behind a unified interface, allowing swap of underlying models without game logic changes.

**FR-ARCH-010** (P0): The AIL shall implement prompt templating with version control, enabling A/B testing of prompts and rollback to previous versions.

**FR-ARCH-011** (P0): The AIL shall enforce configurable rate limiting and token budgets per AI player per game to control API costs and prevent runaway usage.

**FR-ARCH-012** (P0): The AIL shall implement structured output parsing (JSON Schema) for all LLM responses, with validation, retry logic (exponential backoff), and fallback to deterministic pre-programmed behavior on repeated failures.

**FR-ARCH-013** (P1): The AIL shall support prompt caching and context window management, including automatic summarization of long game histories to fit within model context limits.

**FR-ARCH-014** (P1): The AIL shall implement a prompt registry service that stores, versions, and serves prompt templates per role, per game mode, and per AI personality type.

**FR-ARCH-015** (P2): The AIL shall support fine-tuned or adapter-based models (LoRA) specialized for Werewolf gameplay, with model selection configurable per AI player.

### 1.3 Multiplayer Infrastructure

**FR-ARCH-016** (P0): The system shall support game lobbies of 6 to 16 players, mixing human and AI participants, with configurable composition at lobby creation time.

**FR-ARCH-017** (P0): The server shall implement phase-based state machines for each active game, enforcing valid transitions (e.g., Night -> Dawn -> Day -> Dusk -> Night) and rejecting out-of-phase actions.

**FR-ARCH-018** (P0): The server shall validate all client-submitted actions against current game state and player role permissions, discarding or logging invalid actions.

**FR-ARCH-019** (P1): The server shall implement anti-cheating measures including: encrypted game state visible only to authorized players, server-authoritative resolution of all actions, and detection of anomalous request patterns.

**FR-ARCH-020** (P1): The system shall support spectator mode for completed and in-progress games (with information masking for in-progress).

**FR-ARCH-021** (P2): The system shall support ranked matchmaking with Elo/Glicko rating system and skill-based lobby assignment.

### 1.4 Chat System Architecture

**FR-ARCH-022** (P0): The chat system shall support three message channels: public (all players), private (specific player-to-player), and faction (Werewolf team only), with server-side enforcement of channel visibility rules.

**FR-ARCH-023** (P0): Chat messages shall be stored with metadata (sender, timestamp, phase, channel) and made available to AI players via the AIL context feed.

**FR-ARCH-024** (P1): The chat system shall implement rate limiting (messages per phase) and message length limits to prevent spam and excessive token consumption for AI processing.

**FR-ARCH-025** (P2): The chat system shall support rich message types (accusations, defenses, votes, emotes) with semantic tagging for analytics.

---

## 2. AI Player Framework

### 2.1 Agent Types

**FR-AI-001** (P0): The system shall support three distinct AI agent types: (a) Pre-programmed Rule-Based Bots (deterministic heuristics), (b) LLM-Powered AI Players (language model driven), (c) Hybrid Agents (rule-based base with LLM augmentation for natural language).

**FR-AI-002** (P0): Rule-based bots shall implement role-specific heuristics for voting, accusation, deception, and ability usage, configurable via parameter files (aggression level, trust thresholds, randomness factors).

**FR-AI-003** (P0): LLM-powered AI players shall receive a structured game context and produce structured decisions (vote targets, ability targets, speech content) parsed and validated by the AIL.

**FR-AI-004** (P1): The framework shall allow runtime substitution of agent types for any seat in a lobby, enabling A/B testing and gradual LLM rollout.

**FR-AI-005** (P1): AI players shall be assignable unique personalities (aggressive, cautious, analytical, emotional, chaotic) that influence prompt instructions and heuristic parameters.

**FR-AI-006** (P2): The framework shall support custom user-defined bot configurations uploaded as JSON/YAML heuristic parameter files.

### 2.2 LLM Input/Output Format

**FR-AI-007** (P0): The AI context prompt shall include: player identity and role, known information, public chat history, private observations, current game phase, valid actions, and win condition.

**FR-AI-008** (P0): The AI context prompt shall exclude information the player is not entitled to know (other players' roles, night actions not visible to the player), enforced server-side before prompt construction.

**FR-AI-009** (P0): LLM responses shall conform to a JSON Schema specifying: action_type (enum), target_player (optional), reasoning (internal monologue), public_speech (natural language message), private_speech (whisper, optional).

**FR-AI-010** (P0): All LLM requests shall include a system prompt defining the game rules, role abilities, deception expectations, tone guidelines, and output format constraints.

**FR-AI-011** (P1): The system prompt shall include dynamic injection of current game meta (common strategies observed in recent games) to keep AI playstyles current and human-like.

**FR-AI-012** (P1): The framework shall support chain-of-thought prompting, requiring AI to output reasoning before decisions, with reasoning logged for post-game analysis but never exposed to other players.

### 2.3 Memory & Context Management

**FR-AI-013** (P0): Each AI player shall maintain a persistent memory structure across phases of a single game: trust/distrust assessments per player, claimed roles, voting history, contradictions detected, and private observations.

**FR-AI-014** (P0): When game history exceeds the LLM context window, the system shall summarize early-game events into a compressed memory representation, preserving critical information (confirmed roles, key contradictions, alliance patterns).

**FR-AI-015** (P1): AI players shall implement recency weighting, prioritizing recent events over distant ones when making decisions, mirroring human cognitive bias.

**FR-AI-016** (P1): AI memory shall be tagged with confidence levels (certain, likely, suspected, claimed), distinguishing observed facts from inferred or claimed information.

**FR-AI-017** (P2): AI players shall maintain cross-game memory profiles (anonymized) to develop persistent playstyles and adapt to recurring human opponents.

### 2.4 Deception & Social Reasoning

**FR-AI-018** (P0): LLM AI Werewolf players shall generate deceptive claims (false role claims, alibis, accusations) consistent with their claimed role and game state, avoiding contradictions with publicly known facts.

**FR-AI-019** (P0): AI players shall evaluate the credibility of other players' claims using consistency checking against observed facts, vote patterns, and claim probability analysis.

**FR-AI-020** (P1): AI players shall implement social modeling: tracking alliance proposals, reciprocity in voting, and betrayal detection to inform trust assessments.

**FR-AI-021** (P1): AI Werewolf players shall coordinate deception with teammate AI via the faction chat channel, including vote coordination, false claim distribution, and bussing (sacrificing a teammate) decisions.

**FR-AI-022** (P2): AI players shall adapt deception complexity based on opponent skill estimation (simpler deception against novices, layered deception against experienced players).

### 2.5 Response Quality & Human-likeness

**FR-AI-023** (P0): AI-generated public speech shall vary in length, tone, and style to avoid robotic patterns, incorporating colloquialisms, hedging, emotional expressions, and imperfect reasoning.

**FR-AI-024** (P0): AI players shall exhibit controlled response latency (1-5 seconds) before responding in chat, simulating human typing and thinking time, with variation based on message complexity.

**FR-AI-025** (P1): AI Werewolf players shall occasionally make suboptimal but believable plays (emotional votes, tunnel vision, over-reactions) to avoid appearing mechanically perfect.

**FR-AI-026** (P2): AI players shall reference previous game events in their speech ("You said yesterday you were the Doctor, but now...") to demonstrate coherent memory and increase believability.

---

## 3. Game Loop & Phases

### 3.1 Lobby & Pre-Game

**FR-LOOP-001** (P0): The lobby system shall support creating, joining, and leaving lobbies with configurable player capacity (6-16), privacy settings (public/private), and host privileges.

**FR-LOOP-002** (P0): Lobby hosts shall configure: game mode (role set), human/AI composition, AI difficulty/personality selection, timing parameters (phase durations), and LLM model selection for AI players.

**FR-LOOP-003** (P0): The system shall automatically fill empty lobby seats with AI players of specified types when the lobby is launched with fewer than capacity human players.

**FR-LOOP-004** (P0): Once a lobby reaches minimum player count and all players mark "ready", the host may start the game, triggering role assignment and game initialization.

**FR-LOOP-005** (P1): The system shall support AI-only lobby creation with bulk configuration for simulation runs (specifying number of games, AI compositions, and batch execution).

### 3.2 Role Assignment

**FR-LOOP-006** (P0): Role assignment shall be random and uniformly distributed subject to game mode constraints (exact role counts per player count), executed server-side with cryptographically secure randomness.

**FR-LOOP-007** (P0): Role assignment data shall be transmitted to each player individually and securely, ensuring no player learns another player's role through network inspection (server-side only, no client-side role list).

**FR-LOOP-008** (P0): Werewolf faction members shall be informed of their teammates at role assignment time; all other players learn only their own role.

**FR-LOOP-009** (P1): The system shall support role assignment presets (balanced, random-extra, test configurations) and custom role distributions validated for game balance before game start.

**FR-LOOP-010** (P2): The system shall implement a role history tracker preventing the same player (or AI) from receiving the same role in consecutive games within a session.

### 3.3 Night Phase

**FR-LOOP-011** (P0): The Night phase shall execute all night actions in a defined resolution order: Werewolf attack -> Witch save/poison -> Doctor heal -> Seer check -> other role abilities, with server-side atomic resolution.

**FR-LOOP-012** (P0): Each player with a night action shall receive a prompt (UI for humans, structured request for AI) with a configurable time limit (default 30 seconds) to submit their action.

**FR-LOOP-013** (P0): Players without night actions (standard Villagers, dead players) shall see a "Night falls" screen with no actionable input during this phase.

**FR-LOOP-014** (P0): Night actions shall be kept secret; results (Seer's check, death outcomes) revealed only to the respective players, with public announcement deferred to Dawn.

**FR-LOOP-015** (P0): The Werewolf faction shall have a private faction chat during Night to coordinate their attack target vote (majority or plurality decides).

**FR-LOOP-016** (P1): Night actions shall support simultaneous submission with resolution order applied after all submissions are received or the timer expires (late submissions ignored).

**FR-LOOP-017** (P1): The system shall handle edge cases: multiple protection targets (Doctor vs Witch on same target), tied Werewolf votes (random break or no kill), self-targeting rules per role.

### 3.4 Dawn Phase

**FR-LOOP-018** (P0): Dawn shall announce: players who died during the night, their roles (public reveal on death), and any public status effects (e.g., Trickster swaps).

**FR-LOOP-019** (P0): If no deaths occurred, the system shall announce "It was a peaceful night" (Hunter's identity not revealed in this case).

**FR-LOOP-020** (P0): Death announcements shall trigger elimination animations and remove dead players from all subsequent votes and actions (except Hunter's post-death revenge).

### 3.5 Day Phase

**FR-LOOP-021** (P0): During Day, all living players may participate in public chat to discuss, accuse, defend, and form consensus on who to eliminate.

**FR-LOOP-022** (P0): The Day phase shall have a configurable duration (default 3 minutes), with a visible countdown timer to all players.

**FR-LOOP-023** (P0): Players may call for an early vote if a supermajority (configurable, default 70%) of living players agree, shortening the Day phase.

**FR-LOOP-024** (P1): The system shall track and display public nomination counts: any player receiving nominations from at least two other players is placed on the "trial block" for formal voting.

### 3.6 Voting & Execution

**FR-LOOP-025** (P0): At the end of Day (or when early vote is triggered), all living players cast a vote for one player to eliminate. Votes are public and visible in real-time.

**FR-LOOP-026** (P0): The player with the most votes is executed. In case of a tie, the system shall apply a configurable tiebreaker (random, no execution, or revote).

**FR-LOOP-027** (P0): Upon execution, the eliminated player's role is publicly revealed, they are removed from the game, and any post-death abilities (Hunter's revenge) are triggered immediately.

**FR-LOOP-028** (P1): Players may change their vote before the voting phase closes; final vote tallies displayed after closure.

### 3.7 Win Condition Evaluation

**FR-LOOP-029** (P0): Win conditions evaluated after each elimination (day execution or night death): (a) Werewolves win if Werewolf count >= Villager count, (b) Villagers win if all Werewolves are eliminated, (c) Faction-specific win conditions for special roles (Trickster solo win if survives to final 3).

**FR-LOOP-030** (P0): Upon win condition satisfaction, the game ends immediately, all roles are revealed, and a post-game summary screen displays.

**FR-LOOP-031** (P1): The system shall detect and handle rare stalemate conditions (e.g., 1 Werewolf + 1 Villager + 1 unkillable role) with a declared draw or timeout-based resolution.

### 3.8 Timing Configuration

**FR-LOOP-032** (P0): Lobby hosts shall configure: Night phase duration (15-60 seconds), Day phase duration (60-300 seconds), AI response timeout (5-30 seconds).

**FR-LOOP-033** (P1): AI-only simulation games shall support accelerated timing (1-5 second phases) with configurable speed multiplier.

---

## 4. Roles & Meta Design

### 4.1 Core Roles (Classic Mode)

**FR-ROLE-001** (P0) — **Villager**: No special night ability. Objective: eliminate all Werewolves. Must use social deduction, voting patterns, and claim evaluation to identify threats.

**FR-ROLE-002** (P0) — **Werewolf**: Night ability: vote with Werewolf teammates to kill one non-Werewolf player. Objective: achieve parity with or exceed non-Werewolf count. Access to faction chat. Must deceive other players about identity.

**FR-ROLE-003** (P0) — **Seer**: Night ability: select one player to learn their role (or team alignment). Objective: identify Werewolves and guide village without exposing self. Information advantage makes them a high-priority Werewolf target.

### 4.2 Extended Roles

**FR-ROLE-004** (P1) — **Doctor**: Night ability: select one player to protect from Werewolf attack that night. Cannot select the same player on consecutive nights. Objective: protect confirmed villagers and power roles.

**FR-ROLE-005** (P1) — **Hunter**: Passive ability: upon death (day or night), may immediately kill one other player of their choice. Objective: take a suspected Werewolf with them when eliminated.

**FR-ROLE-006** (P1) — **Witch**: Night ability (2 potions, one-time each): (a) Save potion — prevent a Werewolf kill on the targeted player, (b) Poison potion — kill any player. Learns who was targeted by Werewolves each night. Objective: use potions strategically for maximum village benefit.

**FR-ROLE-007** (P1) — **Trickster**: Night ability: swap the roles (not identities) of two other players. If checked by Seer, swapped players return the other's role. Objective: create chaos and confusion; wins alone if survives to final 3 players.

**FR-ROLE-008** (P2) — **Bodyguard**: Night ability: select one player to protect; if that player is attacked, the Bodyguard dies instead. One-time self-protection available.

**FR-ROLE-009** (P2) — **Mayor**: Day ability: once per game, publicly reveal as Mayor; their vote counts double thereafter. Immune to Werewolf kill on the night of reveal.

**FR-ROLE-010** (P2) — **Fool**: Objective: get themselves voted out during the day. Wins independently if executed by vote. Loses if killed at night or survives to game end.

### 4.3 Role Design Principles

**FR-ROLE-011** (P0): Every role shall have a clear, unambiguous win condition documented and communicated to the player at role assignment.

**FR-ROLE-012** (P0): Role abilities shall have defined edge cases and resolution order documented to prevent ambiguous game states.

**FR-ROLE-013** (P1): Roles shall be designed with both human and AI playability in mind — abilities must be expressible as structured actions and describable in prompts.

**FR-ROLE-014** (P1): Each role shall have identifiable "tells" (behavioral patterns that may reveal the role) that skilled players and AI can detect: e.g., Seers may over-defend their check targets, Werewolves may avoid voting for teammates.

### 4.4 Meta & Deception Tactics

**FR-ROLE-015** (P0): The system shall document and make available to AI prompts a library of common meta tactics: false Seer claims by Werewolves, Doctor self-save claims, bussing (Werewolf voting for a teammate to appear innocent), and quiet play (laying low to avoid attention).

**FR-ROLE-016** (P1): AI prompts shall include dynamic meta updates based on current game state (e.g., "Two players have claimed Seer — consider which is more credible based on their voting history").

**FR-ROLE-017** (P1): The system shall track meta evolution across games, detecting when certain strategies become overused (predictable) and prompting AI to adapt counter-strategies.

**FR-ROLE-018** (P2): A publicly visible meta guide shall be available in the UI, documenting common tactics for human players, updated based on aggregate game data.

---

## 5. Chat & Communication System

### 5.1 Chat Channels

**FR-CHAT-001** (P0): **Public Chat**: Open to all living players during Day phase. Messages visible to all. Logged with player name, timestamp, and game phase.

**FR-CHAT-002** (P0): **Faction Chat (Werewolf)**: Private channel for all living Werewolf team members, available during Night phase and optionally during Day. Messages never visible to non-Werewolves.

**FR-CHAT-003** (P0): **Private Whispers**: One-to-one messages between any two living players, available during Day phase. Server-side delivery with optional logging for moderation.

**FR-CHAT-004** (P0): **Dead Chat**: Eliminated players may chat with each other but cannot communicate with living players. Dead chat visible only to other dead players and spectators.

**FR-CHAT-005** (P1): **System Messages**: Automated announcements for phase transitions, vote tallies, death announcements, and ability results. Distinct formatting from player messages.

### 5.2 Message Types & Semantics

**FR-CHAT-006** (P0): Chat messages shall support: free-form text, @mentions (highlighting specific players), and vote declarations (formally stating intent to vote for a player).

**FR-CHAT-007** (P1): The system shall support structured message intents tagged by AI: accusation, defense, inquiry, claim, agreement, disagreement, suspicion level expression.

**FR-CHAT-008** (P1): Role claims shall be formally tagged ("/claim Doctor") with system acknowledgment, making claims searchable and auditable.

**FR-CHAT-009** (P2): Rich formatting support: italics for emphasis, pre-defined emote phrases (sigh, gasp, shrug), and reaction emoji to specific messages.

### 5.3 AI Natural Language Generation

**FR-CHAT-010** (P0): AI-generated chat messages shall be produced by the LLM as part of the structured response, with tone and content guided by personality parameters and current game context.

**FR-CHAT-011** (P0): AI chat output shall pass through a content filter to prevent out-of-character, out-of-game, or rule-violating messages before broadcast.

**FR-CHAT-012** (P1): AI shall vary response length: brief for acknowledgments ("I agree"), medium for arguments (2-3 sentences), longer for complex accusations or defenses.

**FR-CHAT-013** (P1): AI shall reference specific game events in messages (player names, previous votes, contradictions) to demonstrate contextual awareness.

**FR-CHAT-014** (P2): AI shall adapt linguistic style based on game phase: cautious and probing early game, direct and accusatory late game.

### 5.4 Moderation & Safety

**FR-CHAT-015** (P1): All chat messages shall pass through automated content moderation filtering profanity, harassment, hate speech, and off-topic content, with configurable strictness levels.

**FR-CHAT-016** (P1): Human players may report messages or players for review; reports logged with context for manual moderator review.

**FR-CHAT-017** (P2): AI players shall be monitored for toxic output patterns; repeated generation of inappropriate content triggers model swap or prompt revision.

**FR-CHAT-018** (P2): Support for human moderator mode: designated moderator can observe all channels (including faction and dead chat) and intervene in case of disputes or rule violations.

---

## 6. UI/UX, Animations & Effects

### 6.1 Core UI Layout

**FR-UI-001** (P0): The game screen shall display: player roster with status indicators (alive/dead, role reveal on death), chat panel, current phase indicator with timer, action buttons (context-sensitive to role and phase), and vote interface.

**FR-UI-002** (P0): Player avatars/portraits shall display: name, alive status, current vote target (during voting), and claimed role (if publicly claimed). Hover reveals additional stats if applicable.

**FR-UI-003** (P0): The UI shall distinguish living and dead players visually (grayscale, opacity reduction, or ghost overlay for dead players).

**FR-UI-004** (P1): Responsive layout supporting desktop (primary), tablet, and mobile browsers with adaptive panel arrangements.

### 6.2 Day/Night Transitions

**FR-UI-005** (P0): Day/Night phase transitions shall include visual animations: night overlay (darkening, moon/stars), dawn reveal (sunrise, light transition), and phase name announcement.

**FR-UI-006** (P0): During Night, non-active players see an atmospheric "sleeping" animation; active players see their action interface with a visible timer.

**FR-UI-007** (P1): Transition animations shall have configurable duration (1-3 seconds) to balance dramatic effect with game pacing.

**FR-UI-008** (P1): Sound effects shall accompany transitions: night ambient sounds (crickets, howling), day ambient sounds (birds, morning atmosphere).

### 6.3 Voting & Elimination Effects

**FR-UI-009** (P0): The voting interface shall display all living players as selectable targets, with real-time vote tally indicators updating as votes are cast.

**FR-UI-010** (P0): Upon execution, an elimination animation plays: dramatic reveal of the player's role card, thematic elimination effect, and removal from the active roster.

**FR-UI-011** (P0): The Hunter's revenge trigger shall display a brief action selection window (for human Hunter) or immediate resolution (for AI Hunter) with a distinct visual treatment.

**FR-UI-012** (P1): Vote history shall be visually tracked, showing who voted for whom in each round, accessible via an expandable panel.

### 6.4 Chat UI

**FR-UI-013** (P0): The chat panel shall support: channel tabs (Public, Faction, Whispers, Dead), message history scrollback, player name highlighting, and timestamp display.

**FR-UI-014** (P0): Chat messages from AI players and human players shall be visually indistinguishable (no "AI" badge) to preserve game integrity.

**FR-UI-015** (P1): Chat shall support message threading or reply-to functionality for coherent conversation tracking.

**FR-UI-016** (P2): Typing indicators shall display when AI or human players are composing messages, with AI latency randomized to appear human.

### 6.5 Lobby & Menu UI

**FR-UI-017** (P0): The lobby creation interface shall include: game mode selector, player count slider, AI composition configurator (count, type, difficulty per seat), timing settings, and LLM model dropdown.

**FR-UI-018** (P0): The main menu shall provide access to: Join Public Lobby, Create Lobby, AI Simulation Setup, Game History, Leaderboard, and Settings.

**FR-UI-019** (P1): A game history viewer shall display past games with role assignments, chat logs, vote history, and outcome, filterable by date, mode, and player count.

---

## 7. Game Modes & Customization

### 7.1 Preset Game Modes

**FR-MODE-001** (P0): **Classic Mode**: Villagers, Werewolves, and Seer only. Balanced for 6-10 players. Recommended for beginners.

**FR-MODE-002** (P0): **Extended Mode**: Classic roles plus Doctor, Hunter, Witch, and Trickster. Balanced for 8-16 players. Recommended for experienced players.

**FR-MODE-003** (P1): **Chaos Mode**: Random role distribution with potential for unbalanced compositions, designed for unpredictable gameplay.

**FR-MODE-004** (P1): **Custom Mode**: Host-defined role set with server validation for minimum viable composition (at least one Werewolf, at least one non-Werewolf, not auto-winning for either side).

### 7.2 Player Count & Composition

**FR-MODE-005** (P0): The system shall validate role distributions before game start: Werewolf count must be between 1 and floor((N-1)/2) for N players; at least one information role (Seer) recommended for village.

**FR-MODE-006** (P0): Lobby hosts shall specify the number and type of AI players filling each seat: None, Rule-Based Bot, LLM AI (with model selection), or Hybrid.

**FR-MODE-007** (P1): The system shall provide a "quick start" option that auto-balances AI types and role distribution for a given player count.

**FR-MODE-008** (P2): Support for asymmetrical team sizes as a configurable experimental option, with balance warnings.

### 7.3 LLM Model Selection

**FR-MODE-009** (P1): Per-lobby configuration of which LLM provider and model to use for AI players (e.g., GPT-4o, Claude Sonnet, local Llama-3).

**FR-MODE-010** (P1): Per-seat model override allowing mixed-model lobbies (e.g., GPT-4o for some AI, Claude for others) to compare model performance in identical game conditions.

**FR-MODE-011** (P2): Cost estimation displayed at lobby creation based on expected token usage per game and selected models.

### 7.4 Configuration Persistence

**FR-MODE-012** (P1): Users shall save custom lobby configurations as named presets for quick reuse.

**FR-MODE-013** (P1): The system shall provide a set of recommended presets (Beginner, Intermediate, Advanced, AI Showdown) with pre-validated role distributions.

---

## 8. AI-Only Simulation Mode

### 8.1 Batch Simulation Execution

**FR-SIM-001** (P0): The system shall support launching AI-only games with configurable parameters: number of games (1-1000), AI composition per seat, role distribution, timing speed, and LLM configuration.

**FR-SIM-002** (P0): Simulations shall run at accelerated speed with phase timers reduced to 1-5 seconds (or instant for rule-based bots), completing full games in under 2 minutes.

**FR-SIM-003** (P1): Multiple simulation games shall run in parallel up to a configurable concurrency limit, bounded by API rate limits and server resources.

**FR-SIM-004** (P1): The system shall support parameter sweeps: varying one variable (e.g., Werewolf count, AI personality) across a batch of simulations while holding others constant.

### 8.2 Logging & Observability

**FR-SIM-005** (P0): Every simulation game shall produce a complete structured log: player list with roles, all chat messages, all actions with timestamps, vote tallies, death events, and final outcome with win condition trigger.

**FR-SIM-006** (P0): AI reasoning (chain-of-thought) from each LLM decision shall be captured in logs for post-hoc analysis, even though this reasoning is hidden during actual gameplay.

**FR-SIM-007** (P1): Logs shall be exportable in JSON format for external analysis tools and research use.

**FR-SIM-008** (P1): The system shall provide a real-time dashboard showing simulation progress: games completed, current game status, aggregate win rates updating live.

### 8.3 Behavioral Analysis

**FR-SIM-009** (P1): Post-simulation analysis shall compute per-role win rates, average game length, most common vote targets, alliance formation patterns, and claim accuracy rates.

**FR-SIM-010** (P1): The system shall generate deception effectiveness metrics: how often Werewolf false claims succeed, which claim types are most believable, and detection rates by Seer/AI.

**FR-SIM-011** (P1): Comparative analysis across AI types: rule-based vs LLM win rates, different LLM models head-to-head, personality type performance by role.

**FR-SIM-012** (P2): Emergent strategy detection: automated identification of recurring strategy patterns not explicitly programmed (e.g., novel claim chains, new coordination tactics), flagged for human review.

### 8.4 Replay & Inspection

**FR-SIM-013** (P1): Any completed simulation game shall be fully replayable step-by-step with all information visible (no hidden state), including AI reasoning inspection.

**FR-SIM-014** (P2): Replay shall support time-scrubbing, pause on key events (deaths, claims, votes), and annotation tools for researchers.

---

## 9. Data & Analytics

### 9.1 Core Metrics

**FR-DATA-001** (P0): The system shall track and persist for every completed game: players (human/AI types, roles), outcome (winning faction, survivors), duration (per phase and total), all votes, all deaths, and chat message counts.

**FR-DATA-002** (P0): Aggregate win rates shall be computed and displayed per: role, game mode, player (for registered humans), AI type/model, and AI personality.

**FR-DATA-003** (P1): Role balance metrics: for each role and game mode, track win rate differential from 50% target, with alerts when any role exceeds 60% or falls below 40% win rate over a statistically significant sample (minimum 100 games).

### 9.2 AI Behavior Analytics

**FR-DATA-004** (P1): Per-AI decision quality metrics: accuracy of accusations (correctly identifying Werewolves), self-preservation rate, cooperation index, and deception success rate.

**FR-DATA-005** (P1): LLM token usage tracking: average tokens per request, per game, per model, with cost attribution for billing and optimization.

**FR-DATA-006** (P1): Response time distributions per AI type, identifying latency outliers that may indicate prompt engineering issues.

**FR-DATA-007** (P2): AI personality consistency: measuring whether an AI with "aggressive" personality actually exhibits higher accusation rates and risk-taking in practice.

### 9.3 Player-Facing Analytics

**FR-DATA-008** (P1): Registered human players shall have a personal profile page showing: games played, win rate by role, most played role, recent game history, and performance trends over time.

**FR-DATA-009** (P1): A global leaderboard shall display top human players by win rate (minimum games threshold) and a separate leaderboard for longest win streaks.

**FR-DATA-010** (P2): Comparative insights: "You perform 15% better as Seer than average" or "Your village win rate is above the 80th percentile."

### 9.4 Data Export & Research

**FR-DATA-011** (P1): Bulk data export capability for researchers: anonymized game logs, decision trees, and chat corpora with appropriate consent and privacy filtering.

**FR-DATA-012** (P2): API endpoint for querying aggregate statistics programmatically, supporting academic research on multi-agent LLM behavior.

---

## 10. Development Roadmap

### 10.1 Phase 1: MVP (Months 1-3)

**FR-ROAD-001** (P0): Core backend: WebSocket game server, lobby management, authentication, and basic game state persistence.

**FR-ROAD-002** (P0): Classic Mode implementation: Villager, Werewolf, and Seer roles with complete night/day loop, voting, and win conditions.

**FR-ROAD-003** (P0): Human player UI: lobby, game screen, chat, voting interface, day/night transitions.

**FR-ROAD-004** (P0): Rule-based AI bot framework with basic heuristics for all MVP roles, filling any empty lobby seats.

**FR-ROAD-005** (P0): AI Integration Layer with LLM provider abstraction, prompt templating, and structured response parsing.

**FR-ROAD-006** (P0): Basic LLM AI player support (GPT-4o or equivalent) for all MVP roles, with prompt-based deception and social reasoning.

**FR-ROAD-007** (P0): Public and Werewolf faction chat channels with basic rate limiting.

### 10.2 Phase 2: Extended Gameplay (Months 4-6)

**FR-ROAD-008** (P1): Extended roles: Doctor, Hunter, Witch, Trickster with full ability implementation and UI.

**FR-ROAD-009** (P1): Extended Mode and Custom Mode configuration with role distribution validation.

**FR-ROAD-010** (P1): AI memory and context management: trust tracking, conversation history summarization, cross-phase reasoning.

**FR-ROAD-011** (P1): AI personality system: configurable aggression, caution, analytical bias parameters affecting prompts and heuristics.

**FR-ROAD-012** (P1): Private whisper chat between players.

**FR-ROAD-013** (P1): Player profiles, game history viewer, and basic leaderboard.

### 10.3 Phase 3: AI Simulation & Analytics (Months 7-9)

**FR-ROAD-014** (P1): AI-only simulation mode with batch execution, accelerated timing, and parallel game running.

**FR-ROAD-015** (P1): Comprehensive simulation logging with structured JSON export and chain-of-thought capture.

**FR-ROAD-016** (P1): Analytics dashboard: aggregate win rates, role balance metrics, AI performance comparison, deception effectiveness.

**FR-ROAD-017** (P1): LLM model selection per lobby and per-seat, supporting multiple providers.

**FR-ROAD-018** (P1): Content moderation and player reporting system.

### 10.4 Phase 4: Polish & Scale (Months 10-12)

**FR-ROAD-019** (P2): Advanced UI animations, sound effects, mobile responsiveness, accessibility improvements.

**FR-ROAD-020** (P2): Ranked matchmaking, Elo system, seasonal leaderboards.

**FR-ROAD-021** (P2): Additional roles (Bodyguard, Mayor, Fool) and experimental game modes.

**FR-ROAD-022** (P2): AI emergent strategy detection, meta evolution tracking, dynamic prompt updates.

**FR-ROAD-023** (P2): Research API, bulk data export, academic collaboration tools.

**FR-ROAD-024** (P2): Regional server deployment, horizontal scaling optimization.

### 10.5 Risk Assessment

**FR-ROAD-025** (P0): **Risk — LLM API Costs**: Uncontrolled token usage in LLM AI games could generate prohibitive costs per game. Mitigation: strict token budgets, prompt optimization, local model fallback, cost estimation at lobby creation.

**FR-ROAD-026** (P0): **Risk — AI Response Latency**: LLM API calls (1-5 seconds) may slow game pace below acceptable levels. Mitigation: asynchronous processing, timeout fallbacks, streaming responses, hybrid AI for non-critical decisions.

**FR-ROAD-027** (P1): **Risk — AI Predictability**: LLM AI may converge on predictable strategies, reducing game quality. Mitigation: personality randomization, prompt diversity, temperature tuning, periodic prompt refreshes.

**FR-ROAD-028** (P1): **Risk — Anti-Cheating**: AI/human collusion or information leakage could compromise game integrity. Mitigation: server-authoritative design, encrypted state, AI reasoning isolation, monitoring.

**FR-ROAD-029** (P1): **Risk — Role Balance**: Poorly balanced role distributions could frustrate players. Mitigation: analytics-driven balance validation, win rate monitoring, player feedback integration.

**FR-ROAD-030** (P2): **Risk — Model Deprecation**: LLM providers may change APIs or discontinue models. Mitigation: provider-agnostic AIL, multi-provider support, local model fallback.

---

## 11. Non-Functional Requirements

### 11.1 Performance

**NFR-PERF-001** (P0): Game server shall support at least 50 concurrent game lobbies without degradation of response time.

**NFR-PERF-002** (P0): WebSocket message latency between client action and server acknowledgment shall not exceed 200ms under normal load (p95).

**NFR-PERF-003** (P0): AI response generation (LLM API call + parsing) shall complete within 10 seconds; responses exceeding timeout trigger fallback behavior.

**NFR-PERF-004** (P1): AI-only simulation games shall complete at 10x speed multiplier (e.g., a 20-minute human game completes in under 2 minutes).

**NFR-PERF-005** (P1): Page load time for the game UI shall not exceed 3 seconds on a standard broadband connection.

**NFR-PERF-006** (P2): The analytics dashboard shall load aggregate statistics within 5 seconds for datasets up to 100,000 games.

### 11.2 Scalability

**NFR-SCAL-001** (P0): The backend architecture shall allow horizontal scaling of game server instances to support growth from 50 to 500+ concurrent lobbies.

**NFR-SCAL-002** (P1): The AI Integration Layer shall support rate-limited queuing of LLM requests to prevent provider quota exhaustion, with graceful degradation to rule-based behavior.

**NFR-SCAL-003** (P1): The database/event store shall support partitioning by game ID or time range to handle high write volumes from concurrent games and simulations.

**NFR-SCAL-004** (P2): The system shall support running 100+ AI-only simulation games in parallel on a single server instance, limited primarily by LLM API concurrency.

### 11.3 Cost Efficiency

**NFR-COST-001** (P0): Per-game LLM API cost shall not exceed a configurable threshold (default $0.50 USD per game at MVP, targeting $0.20 through optimization).

**NFR-COST-002** (P1): Rule-based and hybrid AI shall be available as zero-API-cost alternatives to full LLM AI for cost-sensitive deployments.

**NFR-COST-003** (P1): Token usage per AI decision shall be logged and trended; prompt optimization initiatives target 20% token reduction per quarter.

**NFR-COST-004** (P2): Support for local LLM inference (via vLLM, Ollama, or llama.cpp) to eliminate per-token API costs at the expense of hosting compute.

### 11.4 Security

**NFR-SEC-001** (P0): All WebSocket and HTTP traffic shall use TLS 1.2+ encryption in transit.

**NFR-SEC-002** (P0): Game state containing role assignments shall be encrypted at rest and only decrypted server-side; clients receive only information their player is entitled to know.

**NFR-SEC-003** (P0): Authentication shall use industry-standard protocols (JWT tokens, OAuth 2.0) with session expiration and refresh token rotation.

**NFR-SEC-004** (P1): The system shall implement rate limiting on all API endpoints to prevent abuse, with IP-based and account-based throttling.

**NFR-SEC-005** (P1): LLM prompts shall be sanitized to prevent prompt injection attacks where malicious chat content could alter AI behavior.

**NFR-SEC-006** (P2): Game logs containing chat data shall implement data retention policies with automatic purging after a configurable period, respecting privacy regulations.

### 11.5 Reliability & Availability

**NFR-REL-001** (P0): Game server uptime target: 99.9% availability during scheduled operating hours.

**NFR-REL-002** (P0): In-progress games shall tolerate server restart without data loss via state persistence and recovery protocols.

**NFR-REL-003** (P1): The AI Integration Layer shall implement circuit breaker pattern: after consecutive LLM API failures, fallback to rule-based AI for a cooldown period before retrying.

**NFR-REL-004** (P1): Database backups shall be performed at least daily with point-in-time recovery capability for the past 7 days.

### 11.6 Maintainability

**NFR-MAINT-001** (P0): Role implementations shall be modular: adding a new role requires only a new module file (rules, abilities, prompts, UI components) without modifying core game loop code.

**NFR-MAINT-002** (P0): AI agent implementations shall be pluggable: new AI types (new heuristic bot, new LLM provider) implement a standard interface without game logic changes.

**NFR-MAINT-003** (P1): Prompt templates shall be version-controlled and hot-swappable without server restart, enabling prompt A/B testing and rapid iteration.

**NFR-MAINT-004** (P1): The codebase shall maintain comprehensive API documentation and game rule documentation, updated as part of every feature PR.

### 11.7 Usability

**NFR-UI-001** (P0): A new human player shall understand core mechanics and be able to complete their first game without external documentation, guided by in-game tooltips and phase instructions.

**NFR-UI-002** (P0): The UI shall clearly distinguish actionable and non-actionable phases, with prominent indicators of what the player should do next.

**NFR-UI-003** (P1): The game shall support keyboard shortcuts for common actions (vote, send message, switch tab).

**NFR-UI-004** (P2): The UI shall meet WCAG 2.1 AA accessibility standards: colorblind-friendly palettes, screen reader support, keyboard navigation, and sufficient contrast ratios.

---

## 12. Implicit Requirements

Derived from stated constraints and design principles.

### 12.1 Modularity

**IMP-MOD-001** (P0): The role system shall use a plugin architecture where each role is a self-contained module exposing: role metadata, ability definitions, night action handlers, win condition evaluator, and AI prompt extensions. Adding a role requires registration of a single module with no core code changes.

**IMP-MOD-002** (P0): The AI agent system shall use a strategy pattern where each agent type (rule-based, LLM, hybrid) implements a common `AIAgent` interface with methods: `receiveContext()`, `generateAction()`, `generateChat()`. New agent types are registered without modifying game loop logic.

**IMP-MOD-003** (P1): Game modes shall be composable configurations of role sets, timing parameters, and special rules, stored as declarative JSON/YAML files. New modes are created by authoring a new configuration file.

**IMP-MOD-004** (P1): Chat channels shall be dynamically creatable and destroyable; the system shall support adding new channel types (e.g., Masons channel for a Mason role) via role module definitions.

### 12.2 Fairness & Anti-Cheating

**IMP-FAIR-001** (P0): The game server shall be the sole authority on all game state. Clients are thin presentation layers; all validation, randomization, and resolution occur server-side. Network inspection cannot reveal hidden information.

**IMP-FAIR-002** (P0): AI players shall not share memory or communicate outside defined game channels. Each AI instance is strictly isolated with its own memory and context; the system shall prevent information leakage between AI instances.

**IMP-FAIR-003** (P1): Random number generation for role assignment and tie-breaking shall use cryptographically secure random sources and be logged for auditability.

**IMP-FAIR-004** (P1): The system shall detect and flag anomalous patterns: players with impossible knowledge, AI exhibiting behaviors suggesting information leakage, or collusion between human and AI accounts.

**IMP-FAIR-005** (P2): Public verifiability: for tournament or competitive games, the system shall support publishing game logs with server signatures to prove no tampering occurred.

### 12.3 Emergent Gameplay

**IMP-EMERGE-001** (P0): Game rules shall be designed with sufficient complexity and interaction between roles to produce emergent strategies not explicitly programmed. Role abilities should combine in interesting ways (e.g., Doctor + Seer coordination, Witch double-kill scenarios).

**IMP-EMERGE-002** (P1): AI prompts shall encourage creative and context-dependent play rather than rigid scripted responses, leaving room for novel approaches to emerge from LLM reasoning.

**IMP-EMERGE-003** (P1): The system shall track and surface emergent patterns from simulation data, feeding insights back into prompt design and meta documentation.

### 12.4 Human-Like AI

**IMP-HUMAN-001** (P0): AI chat output shall avoid telltale LLM patterns: excessive politeness, over-structured responses, hedging in every statement, or always mentioning all possibilities. Prompts shall explicitly instruct natural, occasionally flawed human-like communication.

**IMP-HUMAN-002** (P0): AI shall exhibit imperfect memory (occasionally forgetting minor details, misremembering early-game events) to avoid the unrealistic perfect recall of machine agents.

**IMP-HUMAN-003** (P1): AI Werewolf players shall demonstrate realistic emotional responses under pressure: defensiveness when accused, relief when a teammate is saved, frustration when plans fail.

**IMP-HUMAN-004** (P1): AI shall adapt its communication style to interlocutors: matching verbosity, mirroring argumentative strategies, and recognizing when a player is experienced versus novice.

**IMP-HUMAN-005** (P2): AI shall occasionally make genuine mistakes (misreading a situation, voting emotionally) at a rate comparable to human players (roughly 5-10% of key decisions), with frequency configurable per personality.

### 12.5 Scalability Considerations

**IMP-SCALE-001** (P0): The architecture shall support seamless scaling from 6-player social lobbies to 1000-game AI simulation batches using the same core components, with performance degrading gracefully rather than failing abruptly.

**IMP-SCALE-002** (P1): AI simulation batches shall be queue-based: submitted jobs are queued and processed as resources permit, with users able to check status and retrieve results asynchronously.

**IMP-SCALE-003** (P2): The system shall support tournament brackets and seasonal events with hundreds of human participants and AI fill-in players.

---

## 13. Priority Summary Matrix

### P0 (MVP — Must Have)

System Architecture: FR-ARCH-001 through FR-ARCH-004, FR-ARCH-009 through FR-ARCH-012, FR-ARCH-016 through FR-ARCH-018, FR-ARCH-022, FR-ARCH-023
AI Framework: FR-AI-001 through FR-AI-003, FR-AI-007 through FR-AI-010, FR-AI-013, FR-AI-014, FR-AI-018, FR-AI-019, FR-AI-023, FR-AI-024
Game Loop: FR-LOOP-001 through FR-LOOP-008, FR-LOOP-011 through FR-LOOP-015, FR-LOOP-018 through FR-LOOP-021, FR-LOOP-025 through FR-LOOP-027, FR-LOOP-029, FR-LOOP-030, FR-LOOP-032
Roles: FR-ROLE-001 through FR-ROLE-003, FR-ROLE-011, FR-ROLE-012, FR-ROLE-015
Chat: FR-CHAT-001 through FR-CHAT-004, FR-CHAT-006, FR-CHAT-010, FR-CHAT-011
UI/UX: FR-UI-001 through FR-UI-003, FR-UI-005, FR-UI-006, FR-UI-009 through FR-UI-011, FR-UI-013, FR-UI-014, FR-UI-017, FR-UI-018
Game Modes: FR-MODE-001, FR-MODE-002, FR-MODE-005, FR-MODE-006
Simulation: FR-SIM-001, FR-SIM-002, FR-SIM-005, FR-SIM-006
Roadmap: FR-ROAD-001 through FR-ROAD-007, FR-ROAD-025, FR-ROAD-026
NFRs: All P0 NFRs (NFR-PERF-001 through NFR-PERF-003, NFR-SEC-001 through NFR-SEC-003, NFR-REL-001, NFR-REL-002, NFR-MAINT-001, NFR-MAINT-002, NFR-UI-001, NFR-UI-002)
Implicit: IMP-MOD-001, IMP-MOD-002, IMP-FAIR-001, IMP-FAIR-002, IMP-EMERGE-001, IMP-HUMAN-001, IMP-HUMAN-002, IMP-SCALE-001

### P1 (Important — Should Have)

System Architecture: FR-ARCH-005 through FR-ARCH-007, FR-ARCH-013, FR-ARCH-014, FR-ARCH-019 through FR-ARCH-021, FR-ARCH-024, FR-ARCH-025
AI Framework: FR-AI-004 through FR-AI-006, FR-AI-011, FR-AI-012, FR-AI-015, FR-AI-016, FR-AI-020, FR-AI-021, FR-AI-025
Game Loop: FR-LOOP-003, FR-LOOP-005, FR-LOOP-009, FR-LOOP-016, FR-LOOP-017, FR-LOOP-023, FR-LOOP-028, FR-LOOP-031, FR-LOOP-033
Roles: FR-ROLE-004 through FR-ROLE-007, FR-ROLE-013, FR-ROLE-014, FR-ROLE-016, FR-ROLE-017
Chat: FR-CHAT-005, FR-CHAT-007 through FR-CHAT-009, FR-CHAT-012 through FR-CHAT-015, FR-CHAT-017, FR-CHAT-018
UI/UX: FR-UI-004, FR-UI-007, FR-UI-008, FR-UI-012, FR-UI-015, FR-UI-016, FR-UI-019
Game Modes: FR-MODE-003, FR-MODE-004, FR-MODE-007, FR-MODE-009 through FR-MODE-013
Simulation: FR-SIM-003, FR-SIM-004, FR-SIM-007 through FR-SIM-014
Data: FR-DATA-001 through FR-DATA-012
Roadmap: FR-ROAD-008 through FR-ROAD-018, FR-ROAD-027 through FR-ROAD-029
NFRs: All P1 NFRs
Implicit: IMP-MOD-003, IMP-MOD-004, IMP-FAIR-003, IMP-FAIR-004, IMP-EMERGE-002, IMP-EMERGE-003, IMP-HUMAN-003, IMP-HUMAN-004, IMP-SCALE-002

### P2 (Nice-to-Have — Could Have)

System Architecture: FR-ARCH-008, FR-ARCH-015, FR-ARCH-026
AI Framework: FR-AI-017, FR-AI-022, FR-AI-026
Game Loop: FR-LOOP-010
Roles: FR-ROLE-008 through FR-ROLE-010, FR-ROLE-018
Chat: FR-CHAT-016, FR-CHAT-019
UI/UX: FR-UI-009, FR-UI-010, FR-UI-020
Game Modes: FR-MODE-008, FR-MODE-011
Simulation: FR-SIM-012, FR-SIM-014
Roadmap: FR-ROAD-019 through FR-ROAD-024, FR-ROAD-030
NFRs: All P2 NFRs
Implicit: IMP-FAIR-005, IMP-HUMAN-005, IMP-SCALE-003
