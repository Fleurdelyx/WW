# Dimension 10: UI/UX Design, Visual Effects & Development Roadmap

## Werewolf Multiplayer Game Platform — Design Specification

---

## Table of Contents

1. [Day/Night Visual Transitions](#1-daynight-visual-transitions)
2. [Voting Interface](#2-voting-interface)
3. [Elimination Effects](#3-elimination-effects)
4. [Role-Specific Visual Cues](#4-role-specific-visual-cues)
5. [Chat UI](#5-chat-ui)
6. [Player HUD](#6-player-hud)
7. [Spectator View](#7-spectator-view)
8. [MVP Scope and Milestones](#8-mvp-scope-and-milestones)
9. [Tech Stack Recommendation](#9-tech-stack-recommendation)
10. [Risk Assessment](#10-risk-assessment)
11. [Cost Model: LLM API Costs](#11-cost-model-llm-api-costs)
12. [Color Palette & Visual Theme](#12-color-palette--visual-theme)
13. [Animation Effect Descriptions](#13-animation-effect-descriptions)
14. [UI Component Specifications](#14-ui-component-specifications)
15. [Risk Matrix with Mitigations](#15-risk-matrix-with-mitigations)

---

## 1. Day/Night Visual Transitions

### Core Design Philosophy

The day/night cycle is the central rhythmic anchor of the Werewolf experience. The visual transition must communicate phase changes with unmistakable clarity while maintaining atmospheric immersion. As noted in RLereWolf's academic framework, "whenever the time of day is changed -- day or night, certain game actions the Player can do become unavailable" [^170^]. The visual transition is the primary signal for these permission changes.

### Screen Darkening System

**Day Phase Visuals:**
- Background: Warm golden-hour gradient (#C0A788 to #F5E6D3) simulating village sunrise [^516^]
- Brightness level: 100% (full visibility)
- Ambient overlay: Subtle warm tint (5% opacity burnt sienna)
- Sky gradient: Dawn gold (#E8B86D) transitioning to sky blue (#87CEEB)

**Night Phase Visuals:**
- Background: Deep indigo (#1A1A2E) to midnight purple (#16213E) gradient [^516^]
- Brightness level: 35-40% of day brightness (using sine-wave interpolation)
- Ambient overlay: Cool blue-violet vignette (#5E4D69 at 25% opacity) [^516^]
- Stars: Subtle particle system with 50-80 twinkling star points

**Transition Animation:**
- Duration: 2.5 seconds (slower than typical UI transitions to build tension)
- Easing: ease-in-out-cubic (fast start, slow middle, fast end)
- Implementation: CSS transition on background gradient + brightness filter
- Sine-wave interpolation formula for brightness: `brightness = offset + amplitude * sin(time)` where offset = (max+min)/2, amplitude = (max-min)/2 [^497^]
- The transition should feel like "the sun setting and moon rising" rather than a hard cut

### Ambient Effects During Night

**Audio-visual pairing:**
- Wolf howl sound effect at transition start (1.5s into the animation)
- Crickets ambient loop during night phase
- Fire crackle during day phase (village bonfire atmosphere)
- Wind gust particles (subtle, 2-3 pixels, drifting across screen)

**Screen edge treatment:**
- Vignette darkening at screen corners during night (20% darker at edges)
- Subtle fog/mist particle overlay at bottom 15% of screen during night
- Moon glow orb in top-right corner (soft white, 30% opacity, pulsing slowly)

### Phase Change Announcement Banner

- Full-width banner slides down from top (0.4s, bounce easing)
- Day banner: Golden background (#E8B86D), dark text, sun icon left
- Night banner: Deep purple (#5E4D69), white text, crescent moon icon left [^516^]
- Banner auto-dismisses after 3 seconds (fade out 0.3s)
- Text: "DAY 3 BEGINS" or "NIGHT FALLS..." in bold uppercase

---

## 2. Voting Interface

### Player Card Design

Each player is represented as a card in a responsive grid layout:

**Card Structure:**
```
+------------------+
| [Avatar] [Name]  |  <- Top: Avatar (64x64 circle) + Name
| [Status Badge]   |  <- Status: Alive/Dead/Disconnected
| [Role Icon]      |  <- Hidden until reveal (shows silhouette)
| [Vote Buttons]   |  <- Vote / Accuse / Skip
| [Vote Count]     |  <- Live vote tally bar
+------------------+
```

**Card States:**
- `alive`: Full color, interactive, subtle idle breathing animation (scale 1.0-1.02, 3s loop)
- `dead`: Grayscale filter (100%), 50% opacity, card tilted 5 degrees, red X overlay
- `voted`: Green pulsing border (#4CAF50, 2px, glow effect), checkmark badge
- `accused`: Orange warning border (#FF9800, 2px), exclamation badge
- `selected-by-me`: Blue highlight border (#2196F3, 3px), persistent glow

**Avatar Design:**
- Circular, 64x64px (day) / 56x56px compact (night with many players)
- Anonymous avatar system: randomly assigned themed portraits (animal, character, symbol) per game [^28^]
- Status indicator: small 12px dot at bottom-right (green=alive, red=dead, yellow=voting, gray=disconnected)
- Frame: silver border for villagers, crimson border for wolves (only visible to self/team)

### Vote Buttons

**Vote Action Button:**
- Primary action: "VOTE" in uppercase, bold, 14px
- Background: gradient #4CAF50 to #45A049
- On hover: scale 1.05, brightness +10%, shadow expansion
- On click: ripple effect from click point, brief flash white (0.1s)
- Disabled state: 40% opacity, no hover effects, "VOTED" label if already voted

**Vote Tally Visualization:**
- Horizontal progress bar inside each player card
- Segmented: each vote adds a colored segment (voter's team color)
- Bar fills from left to right, segments stack with 2px gaps
- Tie state: both bars show "TIE" label in center, pulsing yellow
- Threshold line: dashed vertical line at majority threshold

### Vote Reveal Animation

**Phase 1: Vote Lock (1s)**
- All vote buttons lock (0.3s scale-down to 0.9, opacity to 50%)
- "Vote Lock" banner appears with countdown timer

**Phase 2: Tally Reveal (2-3s)**
- Votes reveal one by one with 0.3s stagger delay
- Each vote: colored particle flies from voter card to target card (arc trajectory, 0.5s)
- Target card receives vote with small shake animation (scale 1.05, 0.2s)
- Vote counter increments with number pop effect (scale 1.5 to 1.0, 0.3s)

**Phase 3: Resolution (2s)**
- Target player card pulses red if eliminated
- "LYNCHED" stamp overlay appears (scale 3 to 1, 0.4s, with dust particle burst)
- Card transitions to `dead` state (0.8s grayscale + tilt animation)
- Background flash: brief white/red gradient sweep across screen

**Tie Resolution:**
- Both cards pulse yellow simultaneously
- "NO LYNCH" text appears with gavel strike animation
- Cards return to normal state

---

## 3. Elimination Effects

### Role Reveal Animation

**The Card Flip Reveal (Primary):**
- The eliminated player's card performs a 3D flip animation
- Front face: anonymous/question mark card (player avatar with silhouette)
- Back face: full role card with artwork, role name, and faction color
- Animation: Y-axis rotation 0 -> 90 degrees (0.3s), swap faces at 90 degrees, 90 -> 180 degrees (0.3s)
- Total duration: 0.6s with slight overshoot bounce at end
- Unity implementation uses two superimposed panels with iTween rotation, swapping z-index at midpoint [^509^]
- ScaleX localScale approach (0.2 -> 1.0 increment per frame) works as a simpler 2D alternative [^520^]

**Dramatic Role Reveal (Spectator/Tournament Mode):**
- Full-screen dim overlay (70% black)
- Spotlight effect on eliminated player's card (radial gradient mask)
- Card floats to center screen (0.8s, ease-out)
- Lightning/electric arc effect around card (particle burst)
- Card shatters into fragments revealing role card beneath (particle system)
- Role card scales up with glow (faction color: gold for village, crimson for wolves, purple for solo)
- Dramatic sound cue: bell toll + faction-specific audio

### Death Effects

**Lynching Death (Day):**
- Screen shake: 3 short shakes (X-axis, 5px amplitude, 0.1s each)
- Chromatic aberration impulse: RGB channel separation for 0.3s [^485^]
- Player card: rapid desaturation (0.5s), tilt 15 degrees, drop shadow expands
- "DEAD" stamp overlay in blood-red (#8B0000)
- Dust/particle burst from card (20-30 particles, radial explosion, fade over 1s)
- Tombstone icon replaces avatar

**Night Kill (Werewolf Attack):**
- Screen flashes crimson for 0.15s
- Claw scratch marks animation across victim's card (3 parallel lines, 0.4s)
- Card cracks/shatters with blood spatter particles
- Wolf howl audio cue
- Victim card freezes with frost/ice overlay (indicating "found in morning")

**Poison Death (Witch):**
- Green toxic cloud (#39FF14) swirls around victim's card
- Card dissolves with corrosion/dissolve shader effect (0.8s)
- Bubbling sound effect

**Protection Saved Animation:**
- Golden shield bubble expands from protected player's card
- Werewolf claw strikes shield, deflects with spark particles
- Shield shatters with golden fragments
- Player card pulses white: "SAVED!" text floats upward

---

## 4. Role-Specific Visual Cues

### Seer Investigation

**Eye Glow Effect:**
- Seer's own avatar gains a subtle glowing eye overlay when investigating
- Eyes pulse blue (#64B5F6) with 0.5s cycle
- On target: ethereal blue beam connects Seer card to target card (0.5s fade in)
- Target card surrounded by mystical blue aura
- Result reveal: brief flash -- gold (#FFD700) for villager, crimson (#DC143C) for werewolf
- Result icon fades in: sun for villager, wolf head for werewolf

### Werewolf Night Actions

**Claw Marks:**
- Werewolf player's card shows subtle claw marks on border during night phase
- Card border pulses crimson (#8B0000) when wolves are active
- Wolf pack voting: all wolf cards connected by faint red thread lines
- Selected kill target: claw mark overlay intensifies, blood drip effect

**Wolf Chat Indicator:**
- Whisper/chat bubbles appear with jagged/scratched edges (vs smooth for day chat)
- Dark red background (#4A0000) with lighter text
- Howl icon prefix on messages

### Doctor/Protection

**Heal Animation:**
- Crossed bandages wrap around target card (SVG animation, 0.5s)
- Green healing particles (+ symbols) float upward
- Heartbeat pulse overlay on protected player

### Witch Potion Effects

**Heal Potion:**
- Sparkling red vial pours over target card
- Liquid fills card bottom-to-top, golden glow on completion
- Revive animation: phoenix feather particles rising from card

**Poison Potion:**
- Green bubbling cauldron appears above target
- Toxic green liquid drips onto card
- Card edges blacken/burn with smoke particles

### Hunter Death Shot

- Crosshair targets over selected victim
- Gun barrel flash particle (bright white, 0.1s)
- Smoke trail from hunter card to victim
- Bullet impact particle burst on victim card

### Mason/Trusted Group

- Connected players have faint golden chain links between their cards
- Chain links pulse gently when masons speak

---

## 5. Chat UI

### Message Bubbles

**Day Chat (Public):**
- Background: parchment/light tan (#F5E6D3) with subtle texture
- Border: 1px solid #D4C5A9, border-radius 12px (left) / 4px (right, own messages)
- Text: dark brown (#3D2B1F) for readability
- Own messages: blue-tinted (#E3F2FD), aligned right
- System messages: center-aligned, gold background (#FFF8E1), italic
- Max width: 75% of chat panel

**Night Chat (Faction/Role-Specific):**
- Werewolf chat: dark crimson (#4A0000) background, light text, claw-scratched border
- Spectral/dead chat: ghostly gray (#37474F) with 60% opacity
- Whisper/private: purple border (#7B1FA2), small lock icon prefix

**Message Components:**
```
[Avatar 24x24] [Name - Bold] [Timestamp - 10px gray]
[Message bubble with text]
[Reaction row - emoji reactions, clickable]
```

### Avatar Integration

- 24x24px circular avatar left of each message
- Anonymous avatar persists per game session [^28^]
- Dead player avatars: grayscale with small tombstone overlay
- Speaker highlight: avatar glows when player is typing or recently spoke

### Typing Indicators

**Design Pattern (Three Dots):**
- Small pill-shaped container (80x32px), matching chat bubble style
- Three dots animate with staggered bounce [^525^]
- Animation: each dot scales from 0.4 to 1.0 and back, 0.4s delay between dots
- CSS keyframes: `loadingFade` -- opacity 0 to 0.8 to 0, with staggered `animation-delay` (0s, 0.2s, 0.4s) [^535^]
- Container slides up from behind text input area
- Username prefix: "Alice is typing..." in muted gray text
- Disappears with 0.3s slide-down animation when typing stops

**Alternative Patterns:**
- Ripple pulse: dots scale outward in ripple rings
- Sound wave: 5 dots form audio waveform pattern
- Role-themed: wolves show claw scratch animation, seer shows eye blink

### Chat Panel Layout

```
+----------------------------------+
| [Chat Tabs: ALL | WOLF | SYS]   |  <- Tab bar, swipeable
+----------------------------------+
|                                  |
| [Message history - scrollable]   |  <- Bubbles scroll bottom-up
|                                  |
+----------------------------------+
| [Quick Phrases] [+]              |  <- Preset message shortcuts
+----------------------------------+
| [Text Input..............] [SEND]|  <- Input field + send button
+----------------------------------+
```

- Chat tabs: ALL (everyone), WOLF (faction only), SYS (system messages)
- Unread indicator: red dot badge on tab with count
- Scroll-to-bottom button appears when scrolled up
- New message: subtle bounce on chat panel edge

---

## 6. Player HUD

### Role Card Display

**Current Role Card (Persistent HUD Element):**
- Position: bottom-left corner (desktop), bottom-center (mobile)
- Size: 120x160px portrait card
- Shows: Role artwork, role name, faction icon
- Flippable: tap to reveal detailed ability description on back
- During night: card glows with faction color pulse
- Ability available: green upward arrow indicator, brief pulse animation
- Ability used: grayed out with "USED" stamp

**Role Ability Buttons:**
- Arranged horizontally above role card
- Each button: 48x48px square with rounded corners, role icon
- States:
  - `available`: Full color, subtle idle float, green glow ring
  - `active`: Selected state, pulsing yellow, larger (56x56px)
  - `used`: Grayscale, 40% opacity, strikethrough icon
  - `locked`: Red X overlay, tooltip shows unlock condition
- Cooldown overlay: radial progress circle in red when on cooldown

### Timer Display

**Circular Countdown Timer:**
- Position: top-center of HUD, 64x64px circular display [^534^]
- SVG circle with `stroke-dasharray` and `stroke-dashoffset` for smooth progress [^527^]
- Background ring: dark gray (#424242), 8px stroke
- Progress ring: faction color (day=#E8B86D gold, night=#5E4D69 purple)
- Center: time remaining in MM:SS, bold white, 18px
- Critical phase (<10s): ring flashes red, time pulses, fast ticking sound
- Expired: ring shatters animation, "TIME'S UP" text expands

**Phase Timer Variants:**
- Day Discussion: 10-15 minutes default (configurable 3-20 min) [^70^]
- Voting: 30-60 seconds [^503^]
- Night Actions: 1-2 minutes per role (configurable 1-9 min) [^70^]

### Status Bar

**Top HUD Bar:**
```
[Day/Night Icon] [Phase: Day 3] | [Alive: 8/12] | [Timer: 04:32] | [Settings] [Leave]
```
- Day/Night icon: sun or moon, transitions with rotation animation
- Alive count: heart icon + fraction, updates with pulse on death
- Current phase label: bold, updates with slide transition

### Quick Action Bar

**Vote-Related Quick Actions:**
- "Accuse [Target]" button: appears when targeting a player
- "Defend [Target]" button: appears contextually
- "Skip Vote" button: always available during voting
- "Claim Role" button: opens role claim dialog

---

## 7. Spectator View

### Information Architecture

Spectators require a fundamentally different information display than players. Academic research on spectator interfaces across CS:GO, Dota 2, Hearthstone, and StarCraft 2 reveals that "the spectator has access to information of both teams instead of just their own" and that effective spectator UIs must balance "information richness with visual clarity" [^484^].

**Design Guideline Alpha (from esports spectator research):**
1. Consistency between player and spectator interfaces where possible [^484^]
2. All information should be visible without interaction (no hover-required tooltips) [^484^]
3. Minimap/readability optimized for lower resolutions and mobile viewing [^484^]
4. Reduce or remove information that can be inferred from other visible elements [^484^]

### Spectator UI Layout

```
+----------------------------------------------------------+
| [SPECTATOR MODE - LIVE]  [Day 3]  [Alive: 8/12]  [0:45]|
+----------------------------------------------------------+
| [Player Grid - All Roles Visible]     | [Info Panel]    |
|                                       | - Vote history  |
| 12 cards with FULL role visibility    | - Night actions |
| (not anonymous to spectators)         | - Chat log      |
|                                       | - Statistics    |
+----------------------------------------------------------+
| [Spectator Chat] [Role Reveal Log] [Analytics]          |
+----------------------------------------------------------+
```

### Spectator-Only Features

**Full Role Visibility:**
- All player cards show actual role icons (not silhouettes)
- Faction colors visible: gold border=village, crimson=wolves, purple=solo
- Wolf team connections shown as red threads
- Dead players show their original role with tombstone overlay

**Night Action Replay:**
- Spectators see night actions resolve in cinematic sequence
- Each action shown with connecting lines and effect particles
- Action log panel shows chronological list with timestamps
- Pause/rewind capability for tournament casting

**Analytics Dashboard:**
- Vote history heatmap: who voted for whom, each day
- Trust network graph: visual web of claimed alliances
- Win probability meter: updates after each elimination
- Role balance indicator: remaining power roles per faction

### Delayed Spectator Mode (Anti-Cheating)

- Optional 60-second delay for competitive matches
- "LIVE" indicator changes to "DELAYED" with delay badge
- Prevents spectators from communicating live information

### Spectator Chat

- Separate chat channel from players (spectators cannot talk to players)
- Reaction system: emoji reacts to game events
- Prediction feature: spectators can predict next elimination (gamification)
- Tournament mode: caster overlays, sponsor logos, team branding [^484^]

---

## 8. MVP Scope and Milestones

### MVP Feature List with Priorities

#### P0 — Core (Must-Have for Launch)

| # | Feature | Description | Est. Effort |
|---|---------|-------------|-------------|
| 1 | Day/Night Phase System | Basic phase transitions with visual darkening | 1 week |
| 2 | Player Cards + Grid | Avatar, name, alive/dead status, responsive grid | 1 week |
| 3 | Public Voting Interface | Vote buttons, public vote tally, lynch resolution | 1 week |
| 4 | Text Chat System | Day chat, message bubbles, basic timestamps | 1 week |
| 5 | Role Assignment | Random role distribution, private role reveal | 3 days |
| 6 | Basic Win Conditions | Wolves parity, all wolves eliminated | 3 days |
| 7 | Core Roles (5) | Villager, Werewolf, Seer, Doctor, Witch | 2 weeks |
| 8 | Game Lobby | Room creation, join, ready system, player count | 1 week |
| 9 | WebSocket Real-Time | Socket.IO rooms, state sync, reconnect | 1 week |
| 10 | Basic Spectator Mode | Join as spectator, see all public info | 3 days |

#### P1 — Enhanced (Post-Launch, Month 2-3)

| # | Feature | Description | Est. Effort |
|---|---------|-------------|-------------|
| 11 | Role Reveal Animation | Card flip 3D animation on elimination | 4 days |
| 12 | Death Effects | Screen shake, particles, sound cues | 4 days |
| 13 | Typing Indicators | Three-dot animation with username | 2 days |
| 14 | Day/Night Ambient Effects | Stars, fog, particles, transitions | 1 week |
| 15 | Role-Specific Visual Cues | Seer eye glow, werewolf claws, etc. | 1 week |
| 16 | Whisper/Private Chat | Targeted private messages | 3 days |
| 17 | Timer System | Circular countdown, critical phase warnings | 4 days |
| 18 | Vote History Log | Per-day vote tracking display | 3 days |
| 19 | Extended Roles (10+) | Hunter, Masons, Jester, Serial Killer, etc. | 2 weeks |
| 20 | Basic Leaderboard | Win/loss tracking, ELO | 1 week |

#### P2 — Polish (Month 4-6)

| # | Feature | Description | Est. Effort |
|---|---------|-------------|-------------|
| 21 | Full Spectator Analytics | Trust graphs, win probability, heatmaps | 2 weeks |
| 22 | Advanced Animations | Cinematic night sequences, dramatic reveals | 2 weeks |
| 23 | Sound Design | Full audio layer -- ambient, SFX, music | 2 weeks |
| 24 | Custom Game Settings | Configurable day/night lengths, role sets | 1 week |
| 25 | Mobile Responsive | Full mobile optimization, touch gestures | 2 weeks |
| 26 | LLM Agent Integration | AI player bots with configurable difficulty | 3 weeks |
| 27 | Tournament Mode | Bracket support, delayed spectating, casting | 2 weeks |
| 28 | Achievements & Progression | Unlockable avatars, titles, stats | 1 week |

### Development Timeline

**Phase 1: Foundation (Weeks 1-4)**
- Week 1: Project setup, architecture, WebSocket plumbing
- Week 2: Lobby system, room management, player presence
- Week 3: Core game loop, phase transitions, role assignment
- Week 4: Voting system, basic chat, win condition checks

**Phase 2: Core Gameplay (Weeks 5-8)**
- Week 5: Role abilities (Seer, Doctor, Witch)
- Week 6: Player card UI, HUD, timer system
- Week 7: Day/night visual transitions, animations
- Week 8: Playtesting, bug fixes, balance tuning

**Phase 3: Alpha Release (Weeks 9-10)**
- Week 9: Spectator mode, leaderboards, polish
- Week 10: Alpha launch, feedback collection, iteration

**Phase 4: Beta & LLM (Weeks 11-18)**
- Weeks 11-13: Enhanced roles, death effects, sound
- Weeks 14-16: LLM agent integration, cost optimization
- Weeks 17-18: Beta launch, performance testing

**Phase 5: Full Launch (Weeks 19-24)**
- Weeks 19-21: Mobile optimization, tournament mode
- Weeks 22-24: Final polish, marketing, launch

This follows the standard indie milestone structure: Prototype -> Vertical Slice -> Feature Complete (Alpha) -> Content Complete (Beta) -> Release Candidate -> Launch [^507^][^508^].

---

## 9. Tech Stack Recommendation

### Frontend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | React 18 + TypeScript | Component architecture, type safety, large ecosystem |
| Animation | Framer Motion | Declarative React animations, AnimatePresence for enter/exit |
| 3D Effects | Three.js (lightweight) | Card flip 3D, particle effects, optional |
| State Management | Zustand | Lightweight, performant, simpler than Redux |
| Styling | Tailwind CSS + CSS Modules | Rapid UI development, scoped styles |
| Real-Time | Socket.IO Client | Auto-reconnect, rooms, fallback transports [^14^] |
| Audio | Howler.js | Cross-browser audio, sprite support |
| Icons | Lucide React | Clean, consistent icon set |

### Backend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Game Server | Node.js + Socket.IO | 20K+ concurrent connections, real-time event handling [^20^] |
| HTTP API | FastAPI (Python) | For LLM agent integration, ML-friendly [^43^] |
| Database | PostgreSQL + Redis | SQL for persistence, Redis for sessions/pub-sub [^51^] |
| Game State | Redis | Sub-millisecond state sync, pub/sub messaging [^17^] |
| LLM Integration | Python microservice | Agent orchestration, prompt management, cost tracking |
| Container | Docker + Kubernetes | Standard deployment, horizontal scaling |
| Reverse Proxy | Nginx | Load balancing, SSL termination, static file serving |

### LLM Agent Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Model Router | LiteLLM / Custom | Route to cheapest adequate model per task |
| Primary Model | GPT-4o Mini / DeepSeek V3 | Best cost/quality for game reasoning |
| Complex Reasoning | GPT-5 / Claude Sonnet | Fallback for difficult deception scenarios |
| Caching | Redis + Prompt Caching | 41-80% cost reduction [^177^] |
| Monitoring | Custom + Langfuse | Per-game cost tracking, token accounting |

### DevOps

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Hosting | AWS / DigitalOcean | Flexible, cost-effective for startup |
| CI/CD | GitHub Actions | Automated testing, deployment |
| Monitoring | Prometheus + Grafana | Metrics, alerts, dashboards |
| Error Tracking | Sentry | Real-time error monitoring |

### Architecture Pattern

**Lobby + Game Server Separation** [^21^][^49^]:
```
[Client] -> [Nginx] -> [Lobby Service (Node.js)]
                              |
                        [Matchmaking]
                              |
                        [Game Server (Node.js)] <-> [Redis Pub/Sub]
                              |                           |
                        [PostgreSQL]                  [LLM Agent Service]
                                                      [FastAPI/Python]
```

**Authoritative Server Model**: Server validates all actions, maintains canonical game state, clients are render-only [^21^][^39^].

---

## 10. Risk Assessment

### LLM Cost Risks

**Quadratic Token Growth Risk (CRITICAL):**
In multi-turn LLM agent gameplay, "the cost accumulates rapidly" -- turn 1 uses 100 tokens, turn 2 resends those 100 plus 100 new, and by turn 10 a Reflexion loop can consume 50x the tokens of a single linear pass [^532^]. An unconstrained agent can cost $5-8 per task in software engineering contexts [^532^].

**Mitigation:**
- Strict context window management (sliding window, max 4K tokens per agent)
- Context compaction every 5 turns (50-70% token reduction) [^496^]
- Prompt caching (41-80% cost savings) [^177^]
- Model routing: 90% cheap models, 10% premium [^496^]
- Per-game cost cap: hard limit at $0.50/game

### Latency Risks

**LLM Response Latency (HIGH):**
- LLM calls take 1-5 seconds depending on model and prompt size
- Agent decision-making can block game flow
- Multi-agent parallel calls amplify latency

**Mitigation:**
- Pre-generate agent "prepared responses" during discussion phase
- Parallel agent processing (async/await, all agents decide simultaneously)
- Streaming responses (show partial decisions as they arrive)
- Fast model tier for simple decisions (GPT-4o Mini: ~300ms)
- Timeout fallback: if LLM fails, rule-based bot takes over

### Scaling Risks

**Concurrent Game Scaling (MEDIUM):**
- WebSocket servers handle 20K connections (Socket.IO) [^20^]
- Each game room requires persistent state in Redis
- LLM agent games have higher server costs than human-only games

**Mitigation:**
- Horizontal scaling with Kubernetes HPA [^41^]
- Redis Cluster for distributed state [^51^]
- Game server auto-scaling based on active room count
- Priority queue: human games first, bot games during off-peak

### LLM Degradation Risks

**Context Window Overflow (HIGH):**
After 20-30 turns, "easily hitting 50-100k tokens per request" becomes normal, causing costs to "go through the roof" [^498^]. Models also exhibit "decreased coherence or strategic reasoning as contexts approach their maximum length" [^537^].

**Mitigation:**
- Conversation summarization every 10-15 turns (22.7% token savings) [^533^]
- Sliding window context: keep only last N messages + summaries
- Explicit compression scheduling (every 10-15 tool calls) [^533^]
- Key facts extraction: distill important claims into structured format

---

## 11. Cost Model: LLM API Costs

### Per-Game Cost Calculation

**Game Parameters:**
- 8 players per game (6 human + 2 LLM agents)
- Average game duration: 20-30 minutes
- Phases: 3-5 day/night cycles
- Messages per game: ~50-100 public messages
- LLM calls per agent per game: ~30-50 (one per phase + discussions)

**Token Estimates Per LLM Turn:**
- System prompt (role + strategy + rules): ~2,000 tokens
- Game state (player list + vote history): ~1,000 tokens
- Chat history (last 10 messages): ~800 tokens
- Output (decision + reasoning): ~300 tokens
- **Total per turn: ~3,800 input + 300 output = 4,100 tokens**

**Cost Per LLM Agent Per Game (50 turns):**

| Model | Input Cost | Output Cost | Per Turn | Per Game (50 turns) |
|-------|-----------|-------------|----------|-------------------|
| GPT-4o Mini | $0.15/1M | $0.60/1M | $0.00075 | **$0.0375** |
| DeepSeek V3.2 | $0.28/1M | $0.42/1M | $0.00119 | **$0.0595** |
| GPT-4o | $2.50/1M | $10.00/1M | $0.0125 | **$0.625** |
| Claude Sonnet 4 | $3.00/1M | $15.00/1M | $0.0159 | **$0.795** |
| GPT-5.2 | $1.75/1M | $14.00/1M | $0.0109 | **$0.545** |

**With Optimization (Prompt Caching + Routing):**

| Scenario | Per Agent/Game | 2 Agents/Game | With 80% Cache Hit |
|----------|---------------|---------------|-------------------|
| Budget (GPT-4o Mini) | $0.0375 | $0.075 | $0.0225 |
| Standard (DeepSeek V3.2) | $0.0595 | $0.119 | $0.0357 |
| Premium (GPT-4o) | $0.625 | $1.25 | $0.375 |

### Monthly Cost Projections

**Scenario A: Small Scale (100 games/day, 2 LLM agents/game, 50% of games have agents)**

| Model Choice | Daily Cost | Monthly Cost | Annual Cost |
|-------------|-----------|-------------|-------------|
| GPT-4o Mini (all) | $3.75 | $112.50 | $1,350 |
| DeepSeek V3.2 (all) | $5.95 | $178.50 | $2,142 |
| Model Router (70% Mini, 30% GPT-4o) | $20.00 | $600.00 | $7,200 |
| GPT-4o (all) | $62.50 | $1,875.00 | $22,500 |

**Scenario B: Medium Scale (1,000 games/day)**

| Model Choice | Daily Cost | Monthly Cost |
|-------------|-----------|-------------|
| GPT-4o Mini (all) | $37.50 | $1,125 |
| DeepSeek V3.2 (all) | $59.50 | $1,785 |
| Model Router (70% Mini, 30% GPT-4o) | $200.00 | $6,000 |
| GPT-4o (all) | $625.00 | $18,750 |

**Scenario C: Large Scale (10,000 games/day)**

| Model Choice | Daily Cost | Monthly Cost |
|-------------|-----------|-------------|
| GPT-4o Mini (all) | $375 | $11,250 |
| DeepSeek V3.2 (all) | $595 | $17,850 |
| Model Router (70% Mini, 30% GPT-4o) | $2,000 | $60,000 |

### Infrastructure Costs

**AWS/DigitalOcean Estimate (Medium Scale: 1,000 concurrent players, ~250 concurrent games):**

| Component | Specification | Monthly Cost |
|-----------|-------------|-------------|
| Game Servers (Node.js) | 3x c5.xlarge | $300 |
| LLM Agent Service | 2x c5.2xlarge | $400 |
| Redis (ElastiCache) | cache.r6g.large | $200 |
| PostgreSQL (RDS) | db.t3.medium | $100 |
| Load Balancer | ALB | $50 |
| Bandwidth | ~2TB/month | $180 |
| **Total Infrastructure** | | **$1,230/month** |

**Note**: Multi-region deployment increases costs by ~279% (from $1,330 to $3,713/month for AWS GameLift across 8 regions) [^493^].

### Optimization Path

**Phase 1 (Immediate -- 60-70% savings):**
1. Model routing: classify prompt difficulty, route 70% to cheapest model [^496^]
2. Prompt caching: cache system prompts, achieve 60-80% hit rate [^177^]
3. Output caps: limit agent responses to 300 tokens max
4. Structured outputs: JSON only, no prose explanations in production

**Phase 2 (Short-term -- 70-85% savings):**
1. Context compaction: compact conversation every 5 turns, 50-70% token reduction [^496^]
2. Sliding window: only send last 10 messages + summary
3. Batch API: use for non-urgent agent decisions (50% discount)
4. Self-hosted fallback: Llama 3.1 8B for simple classification tasks ($0.05/1M tokens) [^536^]

**Phase 3 (Long-term -- 85-95% savings):**
1. Self-hosted models: Llama 4 Scout on own GPU for predictable costs
2. Fine-tuned small model: train 7B model specifically for werewolf strategy
3. Hybrid agents: rule-based + LLM only for difficult decisions
4. Response caching: cache identical game states, eliminate redundant calls

---

## 12. Color Palette & Visual Theme

### Primary Palette: Dark Fantasy Theme

The visual theme draws from dark fantasy aesthetics -- mysterious, atmospheric, and tension-filled. The palette balances readability with mood [^516^][^517^].

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#1A1A2E` | Night background, primary dark |
| `--bg-secondary` | `#16213E` | Night gradient end, panels |
| `--bg-day` | `#C0A788` | Day background (warm tan) [^516^] |
| `--bg-day-light` | `#F5E6D3` | Day light areas, chat bubbles |
| `--accent-gold` | `#E8B86D` | Day highlights, villager team, sun |
| `--accent-crimson` | `#8B0000` | Wolf team, danger, blood |
| `--accent-purple` | `#5E4D69` | Mystery, night, solo roles [^516^] |
| `--accent-green` | `#4CAF50` | Success, healing, available actions |
| `--accent-blue` | `#2196F3` | Player's own actions, info |
| `--text-primary` | `#F5E6D3` | Primary text on dark backgrounds |
| `--text-secondary` | `#C0A788` | Secondary/muted text [^516^] |
| `--text-dark` | `#3D2B1F` | Text on light backgrounds |
| `--neutral-red` | `#AB6169` | Accents, warnings [^516^] |
| `--soya-bean` | `#696152` | Borders, dividers [^516^] |

### Faction Color System

| Faction | Primary | Secondary | Glow |
|---------|---------|-----------|------|
| Village (Good) | `#E8B86D` (Gold) | `#FFD700` | `rgba(232, 184, 109, 0.3)` |
| Werewolves (Evil) | `#8B0000` (Crimson) | `#DC143C` | `rgba(139, 0, 0, 0.3)` |
| Solo (Neutral) | `#5E4D69` (Purple) | `#9C27B0` | `rgba(94, 77, 105, 0.3)` |
| System | `#64B5F6` (Blue) | `#90CAF9` | `rgba(100, 181, 246, 0.3)` |

### Typography

| Purpose | Font | Weight | Size |
|---------|------|--------|------|
| Game title | Cinzel (serif) | 700 | 32px |
| Phase headers | Cinzel | 600 | 24px |
| Player names | Inter (sans-serif) | 600 | 16px |
| Body text | Inter | 400 | 14px |
| Chat messages | Inter | 400 | 14px |
| Timer | Roboto Mono | 700 | 18px |
| Role names | Cinzel | 600 | 18px |
| Button labels | Inter | 600 | 14px |

### Visual Style Principles

1. **Transparency in hierarchy**: "Great design is transparent -- it blends in with the goals of the game" [^504^]
2. **Color as information**: Every color carries game-state meaning (faction, status, phase)
3. **Animation communicates**: Movement signals importance and draws attention to changes
4. **Dark mode primary**: Night theme is default; day is the "exception"
5. **Medieval fantasy**: Ornate borders, parchment textures, Gothic accents

---

## 13. Animation Effect Descriptions

### Phase Transitions

**Day to Night (2.5s):**
1. T+0.0s: Announcement banner "NIGHT FALLS..." slides down
2. T+0.3s: Background gradient begins shift (gold -> indigo, 2.5s)
3. T+0.5s: Brightness filter drops from 100% to 35% (2.0s, ease-in)
4. T+1.0s: Wolf howl audio cue; stars begin appearing (fade in, 1.0s)
5. T+1.5s: Vignette darkens at edges (0.5s)
6. T+2.0s: Fog/mist particles begin drifting upward
7. T+2.5s: Moon glow appears in corner; transition complete

**Night to Day (2.0s):**
1. T+0.0s: Rooster crow audio; "DAY X BEGINS" banner slides down
2. T+0.2s: Moon fades, stars begin disappearing
3. T+0.3s: Background shifts indigo -> gold (1.8s)
4. T+0.5s: Brightness rises 35% to 100% (1.5s, ease-out)
5. T+1.0s: Birds audio, light rays appear (subtle)
6. T+2.0s: Transition complete, fog clears

### Micro-Interactions

**Card Hover (desktop):**
- Scale: 1.0 -> 1.03 (0.2s, ease-out)
- Shadow: expand from 4px blur to 12px blur
- Border: fade in subtle glow (faction color)

**Button Press:**
- Scale: 1.0 -> 0.95 (0.05s, ease-in)
- Scale back: 0.95 -> 1.0 (0.1s, spring)
- Ripple: radial gradient from click point, 0.3s fade

**Vote Particle:**
- Small colored circle (voter's faction color, 8px diameter)
- Bezier curve arc from voter card to target card (0.5s)
- Leaves trail of 3-4 fading circles (decay 0.1s each)
- Impact: small radial burst at target (4-6 particles, 0.2s)

**Timer Pulse (critical):**
- Ring scale: 1.0 -> 1.05 -> 1.0 (0.5s loop)
- Color: shifts from normal to red with each pulse
- Center text: subtle shake (X-axis, 1px, 0.3s loop)

### Particle Systems

**Death Burst:**
- 20-30 particles, radial explosion from card center
- Colors: faction primary + gray (ashes)
- Size: 3-6px squares/circles
- Velocity: random 50-150px/s outward
- Decay: fade + shrink over 1.0s
- Gravity: slight downward drift (20px/s)

**Role Reveal Sparkle:**
- 15-20 golden sparkles on reveal
- Size: 2-4px stars
- Spiral inward then outward burst
- Duration: 0.8s total

**Night Fog:**
- 50-100 small translucent circles (fog particles)
- Drift upward at 10-20px/s with horizontal wobble
- Size: 10-30px, opacity 0.05-0.15
- Respawn at bottom when exiting top

---

## 14. UI Component Specifications

### Player Card Component

```typescript
interface PlayerCardProps {
  playerId: string;
  name: string;
  avatar: string;           // anonymous avatar URL
  role: Role | 'hidden';    // visible role or hidden
  faction: Faction;         // village | werewolf | solo
  status: 'alive' | 'dead' | 'disconnected';
  isSpeaking: boolean;      // voice activity indicator
  isTyping: boolean;        // typing indicator
  voteCount: number;        // current votes against
  hasVoted: boolean;        // has cast vote this phase
  votedFor: string | null;  // who they voted for
  isSelected: boolean;      // selected by local player
  onSelect: () => void;
  onVote: () => void;
}

// Visual states managed via CSS classes:
// .player-card -- base
// .player-card--alive (default)
// .player-card--dead (grayscale, tilt, opacity)
// .player-card--voted (green border glow)
// .player-card--accused (orange border)
// .player-card--selected (blue persistent glow)
// .player-card--speaking (avatar ring pulse)
```

### Chat Bubble Component

```typescript
interface ChatMessageProps {
  messageId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: number;
  isOwnMessage: boolean;
  isSystemMessage: boolean;
  isWhisper: boolean;       // private message
  whisperTarget?: string;
  factionTag?: 'wolf' | 'dead' | 'system';
  reactions: Reaction[];
}

// Bubble styling:
// Own messages: align-right, blue-tinted, sharp bottom-right corner
// Others: align-left, parchment, rounded
// System: center, gold background, italic, no avatar
// Wolf chat: crimson border, dark background, howl icon
```

### Role Card HUD Component

```typescript
interface RoleCardProps {
  role: Role;
  faction: Faction;
  abilityStatus: 'available' | 'active' | 'used' | 'locked';
  cooldownRemaining?: number; // seconds
  onUseAbility: () => void;
  onViewDetails: () => void;
}

// Front: Role artwork, name, faction icon
// Back: Ability description, tips, win condition
// Flip animation on tap/click
```

### Timer Component

```typescript
interface TimerProps {
  duration: number;        // total seconds
  remaining: number;       // seconds left
  phase: 'day' | 'night' | 'voting';
  isCritical: boolean;     // < 10 seconds
  onExpire: () => void;
}

// SVG circle with animated stroke-dashoffset
// Color: gold (day), purple (night), red (voting/critical)
// Critical: flashing ring + pulsing text
```

### Vote Tally Bar

```typescript
interface VoteTallyProps {
  votes: Vote[];           // array of {voterId, voterFaction}
  threshold: number;       // votes needed for majority
  totalPlayers: number;
  isTied: boolean;
}

// Segmented horizontal bar
// Each segment colored by voter's faction
// Dashed vertical line at threshold position
// Tie: pulsing yellow overlay
```

---

## 15. Risk Matrix with Mitigations

### Risk Matrix

| Risk | Probability | Impact | Score | Mitigation Strategy |
|------|------------|--------|-------|-------------------|
| LLM costs exceed budget | HIGH | HIGH | **9/10** | Model routing, caching, context compaction, per-game cost caps |
| LLM latency disrupts game flow | HIGH | HIGH | **9/10** | Parallel processing, fast models, rule-based fallback, pre-generation |
| Context window overflow | HIGH | MEDIUM | **7/10** | Sliding window, compression every 5 turns, key fact extraction |
| WebSocket scaling limits | MEDIUM | HIGH | **7/10** | Horizontal scaling, Redis pub/sub, room sharding |
| Scope creep extends timeline | HIGH | MEDIUM | **7/10** | Locked MVP scope, milestone gates, agile sprints [^508^] |
| LLM agent poor gameplay quality | MEDIUM | HIGH | **7/10** | Extensive prompt engineering, evaluation framework, hybrid rule+LLM |
| Multiplayer networking bugs | MEDIUM | MEDIUM | **5/10** | Authoritative server, comprehensive QA, connection recovery [^48^] |
| Colorblind accessibility | LOW | MEDIUM | **3/10** | Color + icon dual coding, patterns, customizable colors |
| Player toxicity/trolling | MEDIUM | MEDIUM | **5/10** | Report system, mute, vote-kick, moderator tools |
| Platform dependency (OpenAI) | MEDIUM | LOW | **4/10** | Multi-provider setup, self-hosted fallback, LiteLLM abstraction |
| Security (info leaks) | LOW | HIGH | **5/10** | Server-side validation, no client role data, secure WebSocket |

### LLM Cost Control Framework

**Hard Limits:**
- Per-game LLM cost cap: $0.50 ( configurable )
- Per-turn token cap: 5,000 input / 500 output
- Context window max: 8,000 tokens (aggressive compaction)
- Agent count max: 3 per game (prevents cost explosion)

**Monitoring:**
- Real-time cost tracking per game
- Alerts at 50%, 75%, 90% of cost cap
- Daily spend dashboard with breakdown by model
- Automatic downgrade to cheaper model on budget threshold

**Fallback Chain:**
1. GPT-4o Mini (primary -- fast, cheap)
2. DeepSeek V3.2 (fallback -- if OpenAI down)
3. Rule-based bot (emergency -- zero cost, basic logic)

---

## 16. Additional Research Findings

### Social Deduction Game Interface Lessons

**Among Us Success Factors:**
- "The simplicity of Among Us played a significant role in its success" -- rules were simple to explain, setting made goals understandable [^469^]
- "All crucial information for the player" is visible on screen at all times -- tasks, room name, quick access buttons, map [^469^]
- "The game design has prioritized the information for the player; it mainly focuses on the game scene and players' behavior" [^469^]
- The discussion phase is kept shorter than the action phase, giving fewer opportunities for toxic behavior [^389^]

**Town of Salem Interface Problems:**
- "Several panels with duplicated information are taking most of the screen space, blocking the view of the game scene" [^469^]
- "The overall design discouraged players and hence affected the game's success" [^469^]
- Lesson: Minimize UI chrome, maximize game scene visibility

**Space Station 13 Interface Success:**
- "The separation of zones helps players to instantly and intuitively play the game" [^469^]
- Left panel for game view, right panel for chat and status
- Lesson: Clear spatial separation of gameplay and meta-information

### Spectator Interface Best Practices

From comprehensive research across CS:GO, Dota 2, Hearthstone, StarCraft 2, League of Legends, and Heroes of the Storm [^484^]:

1. **Consistency principle**: Keep spectator UI layout consistent with player UI to reduce cognitive load [^484^]
2. **Both-teams visibility**: Spectators must see all information -- "the spectator has access to information of both teams" [^484^]
3. **Color blind friendly**: Use distinguishable colors (avoid red+green); add patterns/labels [^484^]
4. **No hover dependency**: All information visible without interaction [^484^]
5. **Mobile readability**: Design for tablets/phones with smaller screens [^484^]
6. **Minimap importance**: "Keeping an eye on the minimap is critical for providing game awareness" [^484^]
7. **Information icons**: Use spatial components placed in the game world itself for clarity [^484^]

### Game Development Timeline Benchmarks

| Game Type | Timeline | Team Size | Source |
|-----------|----------|-----------|--------|
| Hyper-casual | 2-3 months | 1-2 devs | [^502^] |
| Casual/Puzzle | 3-6 months | 2-4 devs | [^502^] |
| Mid-core | 6-12 months | 3-6 devs | [^502^] |
| RPG/Strategy | 12-24 months | 4-8 devs | [^502^] |
| MMO/Multiplayer | 18-36+ months | 6-15+ devs | [^502^] |
| Indie (average) | 1-3 years | 1-10 devs | [^501^] |
| Werewolf Platform (MVP) | 6 months | 3-5 devs | *This plan* |

### Key Cost References

| Reference | Finding | Source |
|-----------|---------|--------|
| LLM API pricing 2026 | Range from $0.10 to $180 per million tokens | [^487^] |
| Prompt caching savings | 41-80% cost reduction, 13-31% latency improvement | [^177^] |
| Model routing savings | 40-70% cost reduction | [^496^] |
| Context compaction | 50-70% token reduction | [^496^] |
| Combined optimizations | 70-85% total cost reduction possible | [^496^] |
| AWS GameLift multi-region | 279% cost increase (single to 8 regions) | [^493^] |
| Bandwidth as % of bill | 40-60% of total at scale for multiplayer | [^490^] |

---

## 17. Source Reference Table

| Citation | Source | Key Content |
|----------|--------|-------------|
| [^14^] | Socket.IO vs Ws comparison | Performance benchmarks: 20K vs 50K connections |
| [^17^] | Redis game state sync | World state store, pub/sub patterns |
| [^20^] | ws vs Socket.IO benchmarks | 65K connections, latency data |
| [^21^] | Scalable multiplayer card games | Authoritative server, lobby pattern |
| [^28^] | werewolv.es How to Play | Anonymity, day/night phases, night actions |
| [^35^] | Docker/Kubernetes game hosting | HPA, managed vs self-hosted |
| [^39^] | AWS multiplayer game backend | Lambda, DynamoDB, validation patterns |
| [^41^] | Kubernetes HPA | Horizontal Pod Autoscaling docs |
| [^43^] | FastAPI vs Node.js vs Go | Polyglot architecture, benchmark reality |
| [^48^] | Socket.IO connection recovery | v4+ state recovery, reconnection |
| [^49^] | AccelByte 1M CCU | Matchmaking, Session, Lobby services |
| [^51^] | Game database architecture | Polyglot persistence patterns |
| [^70^] | Mafia.gg rules | Timing config, Vote Lock, deadlock prevention |
| [^170^] | RLereWolf thesis | Game actions, day/night UI, voting system |
| [^389^] | Social deduction evolution | Among Us design, meta-gameplay |
| [^469^] | 3D graphics social deduction | Among Us vs Town of Salem interface comparison |
| [^484^] | Spectator interfaces thesis | CS:GO, Dota 2, Hearthstone, SC2 spectator UI research |
| [^485^] | Death effects design | Screenshake, chromatic aberration on elimination |
| [^487^] | LLM API pricing 2026 | Cost comparison across providers |
| [^490^] | Gameye vs GameLift | Bandwidth costs, 40-60% of bill |
| [^493^] | AWS GameLift global cost | 279% multi-region cost increase |
| [^496^] | LLM cost optimization | 5 levers: routing, compaction, caching, batching, prompting |
| [^497^] | Day/night cycle guide | Sine-wave brightness interpolation |
| [^501^] | Video game dev timeline | 3-6 months mobile, 1-3 years indie |
| [^502^] | Game dev timeline guide | 2-3 months hyper-casual to 3+ years MMO |
| [^503^] | Wolvesville voting | 30s voting phase, tie rules, vote manipulators |
| [^504^] | Card game UI design | Transparent design principle |
| [^507^] | Rami Ismail milestones | Prototype, vertical slice, feature complete, release |
| [^508^] | Indie game planning | Vertical slice, milestone-based execution |
| [^509^] | Unity card flip animation | 3D rotation, panel swapping technique |
| [^516^] | Dark fantasy color palette | Hex codes, RGB values for fantasy theme |
| [^520^] | Unity card flip simple | ScaleX approach for 2D card flip |
| [^525^] | Typing indicator animation | CSS bouncing dots, multiple variations |
| [^527^] | Circular countdown timer | SVG stroke-dasharray technique |
| [^532^] | AI agent token costs | Quadratic cost growth, $5-8 per task |
| [^533^] | Agent loop token costs | Context constraint patterns |
| [^534^] | iOS circular progress timer | CAShapeLayer, strokeEnd animation |
| [^535^] | React typing animation | Three dots CSS keyframes |
| [^536^] | LLM cost per token guide | Real-world token spend, strategic model mixing |
| [^537^] | LLM game theory costs | Token costs for Monopoly-style games |
| [^177^] | Prompt caching evaluation | 41-80% cost reduction, best practices |
| [^172^] | Prompt caching case study | 59-70% cost savings in production |
| [^176^] | LLM caching strategies | Exact, semantic, provider-level caching |
| [^498^] | LLM agent context management | Long session token management |
| [^518^] | AI agent unit economics | 14 agents for $8/day, cost levers |
