# Dimension 8: Lobby Management, Matchmaking & Player Scaling Systems

## Technical Specification for Werewolf Multiplayer Platform

---

## 1. Executive Summary

This document provides a comprehensive technical specification for the lobby management, matchmaking, and player scaling systems of a Werewolf multiplayer game platform supporting human players, rule-based bots, and LLM agents. The architecture is designed to scale from intimate 6-player social games to large-scale AI-only tournaments with 1000+ concurrent simulations. The design prioritizes low-latency WebSocket communication, Redis-backed state management, and Kubernetes-orchestrated horizontal scaling.

**Key Architectural Decisions:**
- **Lobby-Service + Game-Server separation**: Lobby handles matchmaking and player routing; dedicated game servers run actual game logic [^21^] [^49^]
- **Redis as central state store**: Sorted sets for matchmaking queues, hashes for player metadata, pub/sub for cross-server messaging [^17^] [^429^] [^430^]
- **Socket.IO with Redis Adapter**: Production-grade WebSocket handling with rooms, namespaces, auto-reconnect, and horizontal scaling [^14^] [^48^]
- **Kubernetes + Agones**: Container orchestration with game-server-specific autoscaling, fleet management, and health checking [^434^] [^435^]

---

## 2. Lobby Lifecycle State Machine

### 2.1 State Machine Overview

The lobby lifecycle follows a deterministic finite state machine (FSM) with six core states. Each state has defined entry conditions, allowed transitions, and timeout behaviors.

```
                    +---------+
         +--------->| CREATED |<-----------+
         |          +----+----+            |
         |               | Host creates    |
         |               v                 |
         |          +----+----+            |
         |          | WAITING |            |
         |          +----+----+            |
         |               | Players join,   |
         |               | bots assigned,  |
         |               | roles configured |
         |               v                 |
         |     +---------+--------+        |
         |     |  ROLE_ASSIGNMENT |        |
         |     +---------+--------+        |
         |               | Roles distributed|
         |               v                 |
         |          +----+----+            |
         |          | STARTING |           |
         |          +----+----+            |
         |               | Countdown,      |
         |               | state sync      |
         |               v                 |
         |          +----+----+            |
         |          | IN_GAME  |           |
         |          +----+----+            |
         |               | Game completes  |
         |               v                 |
         |          +----+----+            |
         |          | ENDED    |           |
         |          +----+----+            |
         |               | Cleanup TTL     |
         +---------------+                 |
                                         |
                              (Re-host creates new lobby)
```

### 2.2 State Definitions and Transitions

| State | Description | Entry Conditions | Timeout | Auto-Actions |
|-------|-------------|-----------------|---------|--------------|
| `CREATED` | Lobby just created by host | Host calls `create_lobby` | 60s to first player join | Auto-delete if empty |
| `WAITING` | Accepting players | First player joins (including host) | 300s max (configurable) | Broadcast player join/leave events |
| `ROLE_ASSIGNMENT` | Distributing roles | Minimum players reached OR host forces start | 30s for role confirmation | Run role assignment algorithm |
| `STARTING` | Pre-game countdown | All players confirmed roles | 10s countdown | Sync initial game state |
| `IN_GAME` | Active gameplay | Countdown completes | None (game-duration) | Process game phases, handle disconnects |
| `ENDED` | Game concluded | Win condition met OR all eliminated | 120s cleanup TTL | Persist results, update ELO |

**Transition Rules:**
- `CREATED -> WAITING`: Automatic upon first player (host) joining [^12^]
- `WAITING -> ROLE_ASSIGNMENT`: Triggered when `player_count >= min_players` (default 6) AND host clicks "Start" OR `auto_start` is enabled
- `ROLE_ASSIGNMENT -> STARTING`: All players confirmed their role assignment OR timeout (30s)
- `STARTING -> IN_GAME`: Countdown reaches zero AND all players connected
- `IN_GAME -> ENDED`: Win condition detected (all werewolves eliminated OR werewolves >= villagers)
- `ENDED -> CREATED`: Host elects to rematch (preserves lobby, resets state)
- Any state -> `CLOSED`: Host leaves without rematch OR TTL expires [^419^]

### 2.3 State Persistence with Redis

```
# Lobby state stored as Redis Hash
lobby:{lobby_id} -> Hash {
  "id": "uuid",
  "state": "WAITING",
  "host_id": "player_uuid",
  "max_players": 12,
  "min_players": 6,
  "player_count": 8,
  "is_private": true,
  "invite_code": "WOLF42",
  "created_at": 1718723456,
  "state_changed_at": 1718723460,
  "ttl_seconds": 3600,
  "game_config_id": "standard_9p"
}

# Player-to-lobby mapping
player_lobby:{player_id} -> "{lobby_id}"  (TTL: 600s)

# Active lobbies set (for global queries)
active_lobbies -> Set [lobby_id_1, lobby_id_2, ...]

# Lobby players (ordered set for join sequence)
lobby:{lobby_id}:players -> Sorted Set [player_id: join_timestamp]
```

---

## 3. Matchmaking System Architecture

### 3.1 Matchmaking Modes

The platform supports four distinct matchmaking modes to accommodate different player preferences:

| Mode | Description | Queue Key Pattern | Player Requirements |
|------|-------------|-------------------|-------------------|
| **Quick Match** | Fast queue-based matchmaking | `matchmaking:quick:{region}` | 6-12 players, expanding skill window |
| **Ranked (ELO)** | Skill-based competitive matching | `matchmaking:ranked:{region}:{skill_bucket}` | 8-10 players, tight ELO constraints |
| **Custom Room** | Player-created private lobbies | `lobbies:custom:{region}` | 6-16 players, invite-only |
| **AI Tournament** | Automated AI-only simulations | `matchmaking:tournament:{config_id}` | Batch-scheduled, 1000+ games |

### 3.2 Redis-Backed Matchmaking Queue

The matchmaking system uses Redis Sorted Sets for O(log n) range queries with skill-based scoring [^429^] [^430^].

```
# Data Model
matchmaking:queue:{game_mode}:{region} -> Sorted Set [player_id: elo_rating]
matchmaking:player:{player_id} -> Hash {
  "player_id": "uuid",
  "skill_rating": "1520",
  "queued_at": "1718723456",
  "game_mode": "ranked",
  "region": "us-east",
  "status": "searching",   // searching | matched | bot_fill
  "preferred_size": "10",
  "bot_fill_accepted": "true"
}

# Pub/Sub for match notifications
player:{player_id}:notifications -> "match_found" events
matchmaking:events -> Global match lifecycle events
```

### 3.3 Skill-Based Matching Algorithm

The matching algorithm implements an expanding skill window based on wait time, balancing match quality with queue speed [^429^].

```python
# Configuration
BASE_SKILL_WINDOW = 100      # Initial ELO +/- range
WINDOW_EXPAND_RATE = 50      # ELO expansion per minute of waiting
MAX_SKILL_WINDOW = 500       # Maximum skill window
MIN_PLAYERS = 6              # Minimum to start a game
OPTIMAL_PLAYERS = 9          # Optimal game size
MAX_PLAYERS = 12             # Maximum per game
BOT_FILL_THRESHOLD = 30      # Seconds before offering bot fill

class MatchmakingEngine:
    def find_match(self, anchor_player_id, game_mode, region):
        queue_key = f"matchmaking:queue:{game_mode}:{region}"
        player_data = redis.hgetall(f"matchmaking:player:{anchor_player_id}")
        
        skill_rating = int(player_data["skill_rating"])
        queued_at = float(player_data["queued_at"])
        wait_seconds = time.time() - queued_at
        
        # Expanding skill window
        skill_window = min(
            BASE_SKILL_WINDOW + int((wait_seconds / 60) * WINDOW_EXPAND_RATE),
            MAX_SKILL_WINDOW
        )
        
        min_skill = skill_rating - skill_window
        max_skill = skill_rating + skill_window
        
        # Find candidates within skill window
        candidates = redis.zrangebyscore(queue_key, min_skill, max_skill)
        candidates = [p for p in candidates if p != anchor_player_id]
        
        # Sort by skill proximity
        candidate_skills = redis.hmget(
            *[f"matchmaking:player:{c}:skill_rating" for c in candidates]
        )
        ranked = sorted(
            zip(candidates, candidate_skills),
            key=lambda x: abs(int(x[1] or 1500) - skill_rating)
        )
        
        # Select optimal number of players
        if len(ranked) >= OPTIMAL_PLAYERS - 1:
            selected = ranked[:OPTIMAL_PLAYERS - 1]
        elif len(ranked) >= MIN_PLAYERS - 1:
            selected = ranked[:MIN_PLAYERS - 1]
        elif len(ranked) >= MIN_PLAYERS - 1 or wait_seconds > BOT_FILL_THRESHOLD:
            # Fill remaining slots with bots
            bot_count = OPTIMAL_PLAYERS - 1 - len(ranked)
            selected = ranked  # Will add bots after
        else:
            return None  # Not enough players yet
            
        return [anchor_player_id] + [p for p, _ in selected]
```

### 3.4 Matchmaking Flow Sequence

```
Player A          Matchmaking Service          Redis              Player B
  |                        |                      |                    |
  |-- join_queue(elo=1500) ->|                    |                    |
  |                        |-- ZADD queue 1500 A  |                    |
  |                        |-- HSET player:A ...  |                    |
  |<-- "queued" -----------|                      |                    |
  |                        |                      |                    |-- join_queue(elo=1480)
  |                        |                      |                    |-- ZADD queue 1480 B
  |                        |<-------------------------------------------|
  |                        |                      |                    |
  |                        |-- find_match(A) ---->|                    |
  |                        |-- ZRANGEBYSCORE 1450-1550                |
  |                        |<-- [A, B] ------------|                    |
  |                        |                      |                    |
  |                        |-- WATCH queue        |                    |
  |                        |-- MULTI              |                    |
  |                        |-- ZREM A, B          |                    |
  |                        |-- EXEC (atomic)      |                    |
  |                        |<-- OK ---------------|                     |
  |                        |                      |                    |
  |                        |-- create_lobby([A,B,...])                |
  |                        |-- HSET lobby:{id} ...                    |
  |                        |-- PUBLISH player:A "match_found"         |
  |<-- "match_found" ------|                      |-- PUBLISH player:B |
  |                        |<--------------------------------------------|-- "match_found"
  |-- confirm_match() ---->|                      |                    |
  |                        |-- HSET player:A status "confirmed"        |
  |                        |                      |                    |-- confirm_match()
  |                        |                      |-- HSET player:B status "confirmed"
  |                        |                      |                    |
  |                        |-- [All confirmed]                          |
  |                        |-- HSET lobby status "STARTING"             |
  |                        |-- PUBLISH "lobby:starting"                 |
  |<-- "lobby_starting" ---|                      |                    |
```

### 3.5 ELO Rating System for Werewolf

Traditional ELO is designed for 1v1 games like chess. For Werewolf's multiplayer, team-based, asymmetric nature, we implement a **hybrid ELO system** combining the Simple Multiplayer Elo (SME) approach [^418^] with role-specific tracking [^35^] [^75^].

**Base ELO Calculation (Simple Multiplayer Elo):**
```python
def calculate_elo_updates(players, results, k_factor=32):
    """
    players: list of {player_id, role, rating, team}
    results: {survived: bool, won: bool, win_type: 'elimination'|'vote'|...}
    """
    updates = {}
    
    for i, player in enumerate(players):
        rating = player["rating"]
        
        # Each player vs players immediately above and below in ranking
        # For Werewolf: faction-based ranking (villagers vs werewolves)
        
        # Expected score based on current rating
        expected = 1 / (1 + 10 ** ((avg_opponent_rating - rating) / 400))
        
        # Actual score: combine survival + win + role difficulty bonus
        actual = (
            (0.3 if results[player["player_id"]]["survived"] else 0) +
            (0.5 if results[player["player_id"]]["won"] else 0) +
            (0.2 * role_difficulty_bonus(player["role"]))
        )
        
        # Role-specific K factor
        k = role_k_factor(player["role"])
        
        delta = round(k * (actual - expected))
        updates[player["player_id"]] = {
            "old_rating": rating,
            "new_rating": rating + delta,
            "delta": delta,
            "role": player["role"]
        }
    
    return updates

ROLE_DIFFICULTY = {
    "villager": 1.0,    # Baseline
    "werewolf": 1.15,   # Harder to win (must deceive)
    "seer": 1.10,       # Information advantage but vulnerable
    "doctor": 1.05,     # Slight advantage
    "hunter": 1.05,
    "witch": 1.10,
    "cupid": 0.95       # Can disrupt balance
}

def role_k_factor(role):
    """Different K factors per role for faster convergence."""
    return BASE_K_FACTOR * ROLE_DIFFICULTY.get(role, 1.0)
```

**Separate ELO Tracking:**
- **Overall ELO**: Combined performance across all roles
- **Villager ELO**: Performance in villager-aligned roles only
- **Werewolf ELO**: Performance in werewolf role only
- **Special Role ELO**: Performance as Seer, Doctor, etc.

This approach aligns with research from Werewolf-AgentX [^35^] and Foaster.ai [^75^], which found that per-role ELO tracking provides fairer skill assessment in social deduction games where role asymmetry significantly impacts win probability.

---

## 4. Role Assignment Algorithm

### 4.1 Point-Based Balanced Distribution

For Werewolf, role assignment must achieve equilibrium between factions. The standard approach uses a **point-based role distribution system** where each role is assigned a point value, and the total point sum should be as close to zero as possible [^170^].

**Role Point Values (Standard Configuration):**

| Role | Faction | Point Value | Description |
|------|---------|-------------|-------------|
| Villager | Good | +1 | No special abilities |
| Guard/Bodyguard | Good | +3 | Can protect one player per night |
| Seer | Good | +4 | Can investigate one player per night |
| Witch | Good | +4 | Has heal and poison potions |
| Hunter | Good | +2 | Can take someone with them when dying |
| Cupid | Good | +1 | Links two players as lovers |
| Werewolf | Evil | -4 | Can eliminate one player per night |

**Balanced Configuration Presets:**

| Players | Werewolves | Special Villagers | Plain Villagers | Point Sum |
|---------|-----------|-------------------|-----------------|-----------|
| 6 | 2 | 1 Seer | 3 | -3 (slight wolf advantage) |
| 8 | 2 | 1 Seer, 1 Guard | 4 | 0 (balanced) |
| 9 | 3 | 1 Seer, 1 Witch | 4 | -3 |
| 10 | 3 | 1 Seer, 1 Guard, 1 Witch | 5 | +1 |
| 12 | 4 | 1 Seer, 1 Guard, 1 Witch, 1 Hunter | 5 | -2 |
| 15 | 4 | 1 Seer, 1 Guard, 1 Witch, 1 Hunter | 7 | +1 |

### 4.2 Assignment Algorithm

```python
class RoleAssignmentEngine:
    def __init__(self, config):
        self.role_pool = config["role_pool"]  # Available roles with point values
        self.target_balance = config.get("target_balance", 0)  # Ideal point sum
        self.balance_tolerance = config.get("balance_tolerance", 2)
    
    def assign_roles(self, players, game_size, assignment_type="balanced"):
        """
        Assign roles to players using the specified method.
        
        assignment_type: "random" | "balanced" | "preset" | "skill_weighted"
        """
        if assignment_type == "random":
            return self._random_assignment(players, game_size)
        elif assignment_type == "balanced":
            return self._balanced_assignment(players, game_size)
        elif assignment_type == "preset":
            return self._preset_assignment(players, game_size)
        elif assignment_type == "skill_weighted":
            return self._skill_weighted_assignment(players, game_size)
    
    def _balanced_assignment(self, players, game_size):
        """Point-balanced role distribution with randomized assignment."""
        preset = BALANCED_PRESETS[game_size]
        
        # Build role list from preset
        roles = []
        for role, count in preset.items():
            roles.extend([role] * count)
        
        # Shuffle roles randomly
        random.shuffle(roles)
        
        # Assign to players
        assignments = {}
        for i, player in enumerate(players):
            assignments[player["id"]] = {
                "role": roles[i],
                "faction": ROLE_FACTIONS[roles[i]],
                "revealed_to": self._get_default_revealed(roles[i])
            }
        
        return assignments
    
    def _skill_weighted_assignment(self, players, game_size):
        """Assign complex roles to higher-skilled players for better game quality."""
        preset = BALANCED_PRESETS[game_size]
        
        # Sort players by relevant role ELO (descending)
        werewolf_elos = [(p, p.get("werewolf_elo", p["elo"])) for p in players]
        villager_elos = [(p, p.get("villager_elo", p["elo"])) for p in players]
        
        werewolf_elos.sort(key=lambda x: x[1], reverse=True)
        villager_elos.sort(key=lambda x: x[1], reverse=True)
        
        assignments = {}
        
        # Assign Werewolf roles to highest werewolf-ELO players
        wolf_count = preset.get("werewolf", 0)
        for i in range(wolf_count):
            player = werewolf_elos[i][0]
            assignments[player["id"]] = {
                "role": "werewolf",
                "faction": "evil"
            }
        
        # Assign special villager roles to highest villager-ELO players
        special_roles = []
        for role, count in preset.items():
            if role != "werewolf" and role != "villager":
                special_roles.extend([role] * count)
        
        assigned_villagers = set(assignments.keys())
        available_villagers = [p for p, _ in villager_elos 
                               if p["id"] not in assigned_villagers]
        
        for i, role in enumerate(special_roles):
            player = available_villagers[i]
            assignments[player["id"]] = {
                "role": role,
                "faction": "good"
            }
        
        # Remaining players are plain villagers
        assigned_ids = set(assignments.keys())
        for player in players:
            if player["id"] not in assigned_ids:
                assignments[player["id"]] = {
                    "role": "villager",
                    "faction": "good"
                }
        
        return assignments
    
    def _get_default_revealed(self, role):
        """Determine which players know about this role by default."""
        if role == "werewolf":
            return ["werewolf"]  # Only other werewolves know
        return []  # No one knows by default
```

### 4.3 Information Flow Control

Critical for Werewolf: the server must enforce **strict information hiding** so each client receives only information their role should have [^45^].

```python
class InformationFilter:
    """Filters game state for each player based on their role."""
    
    def get_visible_state(self, full_state, player_id):
        player = full_state.players[player_id]
        role = player.role
        
        visible = {
            "phase": full_state.phase,
            "day_number": full_state.day_number,
            "alive_players": [p.public_info() for p in full_state.players if p.alive],
            "eliminated_players": [p.public_info() for p in full_state.players if not p.alive],
            "my_role": role,
            "my_status": player.status
        }
        
        # Werewolves see other werewolves
        if role == "werewolf":
            visible["fellow_werewolves"] = [
                p.id for p in full_state.players 
                if p.role == "werewolf" and p.id != player_id and p.alive
            ]
            visible["werewolf_chat_log"] = full_state.werewolf_chat
        
        # Seer sees investigation results
        if role == "seer":
            visible["investigation_results"] = player.investigation_history
        
        # Dead players see all roles (ghost knowledge)
        if not player.alive:
            visible["all_roles"] = {p.id: p.role for p in full_state.players}
        
        return visible
```

---

## 5. Player Types and Bot Integration

### 5.1 Player Type Architecture

```
+------------------+     +------------------+     +------------------+
|   Human Player   |     |  Rule-Based Bot  |     |   LLM Agent      |
+------------------+     +------------------+     +------------------+
| - WebSocket conn |     | - Deterministic  |     | - API call to    |
| - UI interaction |     |   rule engine    |     |   LLM service    |
| - Chat input     |     | - Strategy table |     | - Prompt builder |
| - Vote buttons   |     | - Heuristic eval |     | - Memory stream  |
+------------------+     +------------------+     +------------------+
         |                        |                        |
         +------------------------+------------------------+
                                  |
                    +-------------+-------------+
                    |   Unified Player Adapter   |
                    +-------------+-------------+
                                  |
                    +-------------+-------------+
                    |    Game Server Core        |
                    +----------------------------+
```

### 5.2 Bot Replacement System

When a human player disconnects, the system can optionally replace them with a bot of equivalent skill level [^377^] [^432^]. Research shows that deep player behavior models (DPBM) can produce bot substitutes that perform similarly to human players, and players were often unable to detect substitutions [^391^].

```python
class BotReplacementManager:
    """Handles player disconnection and bot replacement."""
    
    DISCONNECT_GRACE_PERIOD = 30  # seconds to wait before replacement
    
    async def handle_disconnection(self, game_id, player_id):
        game = self.games[game_id]
        player = game.get_player(player_id)
        
        # Mark player as disconnected
        player.status = "DISCONNECTED"
        player.disconnected_at = time.time()
        
        # Start grace period timer
        asyncio.create_task(
            self._grace_period_countdown(game_id, player_id)
        )
        
        # Notify remaining players
        await game.broadcast({
            "type": "player_disconnected",
            "player_id": player_id,
            "player_name": player.name,
            "rejoin_window": self.DISCONNECT_GRACE_PERIOD
        })
    
    async def _grace_period_countdown(self, game_id, player_id):
        await asyncio.sleep(self.DISCONNECT_GRACE_PERIOD)
        
        game = self.games[game_id]
        player = game.get_player(player_id)
        
        if player.status == "DISCONNECTED":
            # Grace period expired - replace with bot
            await self.replace_with_bot(game_id, player_id)
    
    async def replace_with_bot(self, game_id, player_id):
        game = self.games[game_id]
        player = game.get_player(player_id)
        
        # Create bot with player's role and skill profile
        bot_config = {
            "skill_level": player.elo_rating,
            "role": player.role,
            "personality": self._get_bot_personality(player.elo_rating),
            "replacement_mode": True  # Don't reveal it's a bot
        }
        
        if game.config["bot_type"] == "rule_based":
            bot = RuleBasedBot(bot_config)
        elif game.config["bot_type"] == "llm":
            bot = LLMAgent(bot_config)
        
        # Replace player with bot
        game.replace_player(player_id, bot)
        
        # Notify (optionally hide that it's a bot)
        await game.broadcast({
            "type": "player_reconnected",  # Appears as reconnection
            "player_id": player_id,
            "player_name": player.name
        })
    
    async def handle_reconnection(self, game_id, player_id, ws_connection):
        game = self.games[game_id]
        player = game.get_player(player_id)
        
        if isinstance(player, Bot):
            # Player returns to replace their bot
            human_player = HumanPlayer(
                id=player_id,
                ws=ws_connection,
                role=player.role,
                game_state=player.export_state()
            )
            game.replace_bot(player_id, human_player)
            
            await game.send_to(player_id, {
                "type": "state_resync",
                "game_state": game.get_visible_state(player_id),
                "you_replaced_bot": True
            })
        else:
            # Simple reconnection
            player.ws = ws_connection
            player.status = "ACTIVE"
            await game.send_to(player_id, {
                "type": "state_resync",
                "game_state": game.get_visible_state(player_id)
            })
```

### 5.3 LLM Agent Queue Management

For AI-only tournaments and LLM-agent games, a separate queue management system handles agent registration and scheduling:

```python
class AgentTournamentManager:
    """Manages large-scale AI-only tournament execution."""
    
    def __init__(self, redis_client):
        self.redis = redis_client
        self.max_concurrent_games = 100  # Configurable
        self.game_results = []
    
    async def schedule_tournament(self, agent_configs, game_configs):
        """
        Schedule a tournament with multiple agents.
        Supports round-robin, Swiss, or bracket formats.
        """
        # Generate all match pairings
        pairings = self._generate_pairings(agent_configs, game_configs["format"])
        
        # Queue all games in Redis
        for pairing in pairings:
            await self.redis.lpush(
                "tournament:queue",
                json.dumps(pairing)
            )
        
        # Start worker pool
        workers = [
            asyncio.create_task(self._game_worker(i))
            for i in range(self.max_concurrent_games)
        ]
        
        await asyncio.gather(*workers)
    
    async def _game_worker(self, worker_id):
        """Process games from the tournament queue."""
        while True:
            # BRPOP blocks until a game is available
            result = await self.redis.brpop("tournament:queue", timeout=30)
            if not result:
                break  # Queue empty, worker done
            
            pairing = json.loads(result[1])
            game_result = await self._execute_game(pairing)
            
            # Store result
            await self.redis.lpush(
                "tournament:results",
                json.dumps(game_result)
            )
            
            # Update ELO ratings
            await self._update_elo_ratings(game_result)
    
    async def _execute_game(self, pairing):
        """Execute a single game between agents."""
        game_id = str(uuid.uuid4())
        
        # Create game instance
        game = WerewolfGame(
            game_id=game_id,
            players=pairing["agents"],
            config=pairing["game_config"],
            mode="ai_only"
        )
        
        # Run game to completion
        result = await game.run()
        
        return {
            "game_id": game_id,
            "agents": [a["agent_id"] for a in pairing["agents"]],
            "winner": result.winner,
            "turns": result.turn_count,
            "duration_ms": result.duration_ms,
            "final_state": result.state_hash
        }
```

### 5.4 Scaling to 1000+ AI Simulations

For large-scale AI tournaments, the architecture shifts from real-time WebSocket-driven to **batch simulation** mode:

| Aspect | Human Games | AI-Only Simulations |
|--------|------------|-------------------|
| Communication | WebSocket real-time | In-memory function calls |
| State Sync | Pub/Sub broadcast | Direct object reference |
| Bot Latency | ~500ms (human-like) | ~10-50ms (LLM API call) |
| Concurrency | 1 game per room | Batch: 50-100 games per pod |
| Game Speed | Real-time (1x) | Accelerated (10-100x) |
| LLM Calls | Async with timeout | Batched parallel requests |
| Persistence | Full event log | Aggregated metrics only |

**Worker Pool Architecture for Massive Simulation:**

```
Tournament Controller
        |
        v
+-------+-------+-------+-------+
| Pod 1 | Pod 2 | Pod 3 | Pod N |  <- Kubernetes Jobs
| 50    | 50    | 50    | 50    |     games each
| games | games | games | games |
+-------+-------+-------+-------+
    |       |       |       |
    v       v       v       v
Redis Queue (results aggregation)
    |
    v
ClickHouse (time-series analytics)
    |
    v
Leaderboard API
```

Key insight from Werewolf Arena [^127^]: 10 games per model pairing with role alternation provides statistically meaningful results. For 7 LLMs, this means 7 * 6 / 2 * 10 = 210 games minimum per tournament round.

---

## 6. Disconnection Recovery System

### 6.1 Disconnection Detection

```python
class ConnectionManager:
    """Manages WebSocket connections with heartbeat-based disconnection detection."""
    
    HEARTBEAT_INTERVAL = 30  # seconds between pings
    HEARTBEAT_TIMEOUT = 10   # seconds to wait for pong
    GRACE_PERIOD = 60        # seconds before declaring disconnected
    
    def __init__(self):
        self.connections = {}  # player_id -> WebSocket
        self.heartbeat_timers = {}
        self.last_pong = {}
    
    async def register_connection(self, player_id, websocket):
        self.connections[player_id] = websocket
        self.last_pong[player_id] = time.time()
        
        # Start heartbeat
        self.heartbeat_timers[player_id] = asyncio.create_task(
            self._heartbeat_loop(player_id)
        )
    
    async def _heartbeat_loop(self, player_id):
        while player_id in self.connections:
            try:
                ws = self.connections[player_id]
                if ws.state == WebSocketState.DISCONNECTED:
                    break
                    
                # Send ping
                await ws.send_json({"type": "ping", "timestamp": time.time()})
                
                # Wait for pong with timeout
                await asyncio.wait_for(
                    self._wait_for_pong(player_id),
                    timeout=self.HEARTBEAT_TIMEOUT
                )
                
                await asyncio.sleep(self.HEARTBEAT_INTERVAL)
                
            except asyncio.TimeoutError:
                # No pong received - connection likely dead
                await self._handle_missed_heartbeat(player_id)
                break
            except Exception:
                break
        
        await self._disconnect_player(player_id)
    
    async def _handle_missed_heartbeat(self, player_id):
        """Grace period before declaring player disconnected."""
        await asyncio.sleep(self.GRACE_PERIOD)
        
        # Check if player reconnected during grace period
        if player_id in self.connections:
            ws = self.connections[player_id]
            if ws.state == WebSocketState.CONNECTED:
                return  # Player reconnected
        
        await self.declare_disconnected(player_id)
```

### 6.2 State Resynchronization Flow

When a player reconnects, the server must restore their complete game state:

```
Player              WebSocket Server           Game State Manager
  |                         |                            |
  |-- connect(ws) --------->|                            |
  |-- authenticate(token) ->|                            |
  |                         |-- validate_session ------->|
  |                         |<-- session_valid ----------|
  |                         |                            |
  |                         |-- get_game_for_player ---->|
  |                         |<-- game_id, state ----------|
  |                         |                            |
  |<-- game_found ---------|                            |
  |-- request_full_state() ->|                           |
  |                         |-- build_visible_state ---->|
  |                         |<-- filtered_state ---------|
  |                         |                            |
  |<-- full_state ---------|                            |
  |                         |-- register_new_ws ------->|
  |                         |                            |
  |<-- missed_events[] ----|                            |
```

**State Resync Protocol:**
```python
class StateResyncManager:
    """Manages state resynchronization for reconnecting players."""
    
    EVENT_LOG_SIZE = 500  # Keep last N events per game
    
    def __init__(self, redis_client):
        self.redis = redis_client
    
    async def build_resync_package(self, game_id, player_id, last_event_id):
        """
        Build a complete resync package for a reconnecting player.
        Includes full visible state + all missed events.
        """
        # Get current game state
        game_state = await self._get_game_state(game_id)
        
        # Filter for player's visibility
        visible_state = self._filter_for_player(game_state, player_id)
        
        # Get missed events since last_event_id
        all_events = await self.redis.lrange(
            f"game:{game_id}:events", 0, -1
        )
        
        missed_events = []
        for event_json in all_events:
            event = json.loads(event_json)
            if event["event_id"] > last_event_id:
                # Filter events for player's visibility
                if self._can_player_see_event(event, player_id, game_state):
                    missed_events.append(event)
        
        return {
            "type": "state_resync",
            "game_state": visible_state,
            "missed_events": missed_events,
            "current_event_id": all_events[-1]["event_id"] if all_events else 0,
            "server_time": time.time()
        }
```

### 6.3 Disconnection Recovery Strategies

| Strategy | When to Use | Implementation | Player Experience |
|----------|-------------|----------------|-------------------|
| **Wait & Rejoin** | Short disconnects (<30s) | Pause timer, keep slot open | Seamless rejoin |
| **Bot Replacement** | Mid-to-long disconnects | AI takes over player's role | Game continues smoothly |
| **Auto-Eliminate** | Endgame, simple roles | Player dies, role resolves | Minimal impact |
| **Vote to Kick** | Intentional quitting | Other players vote to replace | Community-enforced |

Research on player preferences [^377^] shows:
- In team games, players prefer waiting or bot replacement over auto-elimination
- Bot quality significantly impacts player satisfaction with replacement
- Silent bot replacement (without revealing it's a bot) is preferred in casual modes
- Competitive modes should announce bot replacement transparently

---

## 7. Spectator Mode and Streaming Integration

### 7.1 Spectator Architecture

Spectators receive a **read-only event stream** of the game. Unlike players, they do not send actions. The architecture separates spectator streams into tiers based on information access [^380^]:

```
+---------------------------------------------------+
|                 Game Server Core                   |
|  (Authoritative state, processes all actions)      |
+--------+--------------+--------------+------------+
         |              |              |
    Player WS      Spectator WS    Stream Delay
    (filtered)     (filtered)      Buffer
         |              |              |
    +----+----+   +----+----+   +-----+-----+
    | Player A |   | Spectator|   | Stream   |
    | Player B |   | (full    |   | Output   |
    | ...      |   |  info)   |   | (30s     |
    +----------+   +----------+   |  delay)  |
                    |              +-----+-----+
               +----+----+              |
               | Spectator|         +----+----+
               | (limited |         | Twitch/  |
               |  info)   |         | YouTube  |
               +----------+         +----------+
```

**Spectator Information Tiers:**

| Tier | Access Level | Use Case | Implementation |
|------|-------------|----------|----------------|
| **God Mode** | All roles, all private chats | Tournament admins, replay analysis | Direct game state access with full visibility |
| **Faction View** | All players in one faction | Faction-specific streams | Filter to show only werewolf or only villager perspective |
| **Public View** | Only public information | Standard spectator | Same information as a regular player (no role reveals) |
| **Delayed View** | All info with N-second delay | Anti-stream-sniping | Ring buffer with configurable delay (15-60s) |

### 7.2 Streaming Integration

For platform streaming (Twitch/YouTube), the game server provides:

```python
class StreamIntegration:
    """Integrates with external streaming platforms."""
    
    def __init__(self, game_server):
        self.game_server = game_server
        self.stream_delay = 30  # seconds
        self.event_buffer = collections.deque(maxlen=10000)
    
    async def get_stream_feed(self, game_id, tier="public", delay=30):
        """
        Get game event stream suitable for external streaming.
        delay: seconds of delay to prevent stream sniping
        """
        # Events are buffered and served with delay
        cutoff_time = time.time() - delay
        
        events = [
            e for e in self.event_buffer
            if e["game_id"] == game_id and e["timestamp"] <= cutoff_time
        ]
        
        # Apply tier-based filtering
        if tier == "public":
            events = [e for e in events if e["visibility"] == "public"]
        elif tier == "delayed_god":
            # All info but delayed
            pass
        
        return events
    
    async def generate_overlay_data(self, game_id):
        """Generate real-time overlay data for OBS/streaming tools."""
        game = self.game_server.get_game(game_id)
        
        return {
            "phase": game.current_phase,
            "day": game.day_number,
            "alive_count": len(game.alive_players),
            "player_list": [
                {
                    "name": p.name,
                    "alive": p.alive,
                    "avatar": p.avatar_url,
                    # No role revealed in overlay
                }
                for p in game.players
            ],
            "recent_votes": game.get_public_vote_history(),
            "time_remaining": game.phase_timer.remaining()
        }
```

---

## 8. Scaling Architecture

### 8.1 Horizontal Scaling with Kubernetes

The platform uses a multi-tier scaling strategy leveraging Kubernetes Horizontal Pod Autoscaler (HPA) [^410^] [^411^] and Agones for game-server-specific scaling [^434^] [^435^].

```
                        +------------------+
                        |  Cloud Load      |
                        |  Balancer (L7)   |
                        +--------+---------+
                                 |
                    +------------+------------+
                    |                         |
            +-------v-------+         +-------v-------+
            | Lobby Service |         | Spectator     |
            | (Stateless)   |         | Service       |
            +-------+-------+         +-------+-------+
                    |                         |
            +-------v-------+         +-------v-------+
            | Redis Cluster |         | Game Server   |
            | (Stateful)    |<--------| Fleet (Agones)|
            +---------------+         +-------+-------+
                                              |
                                        +-----+-----+
                                        |  HPA      |
                                        | (Custom   |
                                        |  Metrics) |
                                        +-----------+
```

**HPA Configuration for Game Servers:**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: werewolf-game-servers
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: werewolf-game-server
  minReplicas: 3
  maxReplicas: 100
  metrics:
  - type: Pods
    pods:
      metric:
        name: active_game_sessions
      target:
        type: AverageValue
        averageValue: "8"  # 8 games per pod target
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Pods
        value: 5
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Pods
        value: 2
        periodSeconds: 120
```

### 8.2 WebSocket Scaling Patterns

A single Node.js process handles 10,000-50,000 concurrent WebSocket connections [^379^] [^381^]. For horizontal scaling, the architecture uses:

**Pattern A: Redis Pub/Sub (Standard)**
- All server instances subscribe to Redis channels per room
- Messages published to Redis, broadcast to all subscribers
- Used for: Chat, game state updates, presence
- Socket.IO `@socket.io/redis-adapter` automates this [^381^]

**Pattern B: Stateful Router (Advanced)**
- Specialized proxy routes all players in a room to the same server
- Eliminates need for message broker within a room
- Used by: Hathora, custom implementations [^378^]

**Pattern C: Sharding by Room ID**
- Consistent hashing of room_id -> server assignment
- Simple but rigid - rebalancing is complex
- Good for: Predictable load, long-lived rooms [^387^]

### 8.3 Capacity Planning

| Metric | Small (Alpha) | Medium (Beta) | Large (Launch) | Tournament |
|--------|--------------|---------------|----------------|------------|
| Concurrent Players | 100 | 2,000 | 20,000 | 50,000+ |
| Active Games | 10 | 200 | 2,500 | 5,000+ |
| WebSocket Servers | 1 | 3 | 10 | 20+ |
| Game Server Pods | 2 | 25 | 300 | 600+ |
| Redis Nodes | 1 | 3 (cluster) | 6 (cluster) | 12 (cluster) |
| DB Read Replicas | 1 | 2 | 4 | 8 |
| Message Rate/sec | 100 | 5,000 | 50,000 | 100,000+ |

### 8.4 Agones Integration for Game Server Management

Agones extends Kubernetes with game-server-specific custom resources [^434^] [^442^]:

```yaml
apiVersion: "agones.dev/v1"
kind: Fleet
metadata:
  name: werewolf-game-servers
spec:
  replicas: 10
  template:
    spec:
      container: werewolf-server
      ports:
      - name: game
        containerPort: 7777
        protocol: UDP
      health:
        initialDelaySeconds: 30
        periodSeconds: 10
        failureThreshold: 3
      template:
        spec:
          containers:
          - name: werewolf-server
            image: werewolf/game-server:v1.2.3
            resources:
              requests:
                memory: "256Mi"
                cpu: "200m"
              limits:
                memory: "512Mi"
                cpu: "500m"
---
apiVersion: "autoscaling.agones.dev/v1"
kind: FleetAutoscaler
metadata:
  name: werewolf-autoscaler
spec:
  fleetName: werewolf-game-servers
  policy:
    type: Buffer
    buffer:
      bufferSize: 5
      minReplicas: 3
      maxReplicas: 200
```

---

## 9. Private Lobby and Invite System

### 9.1 Invite Code Generation

Private lobbies use short, memorable invite codes with collision-resistant generation:

```python
import secrets
import string

class InviteCodeManager:
    """Manages secure, memorable invite codes for private lobbies."""
    
    CODE_LENGTH = 6
    CODE_CHARS = string.ascii_uppercase + string.digits
    CODE_TTL = 3600  # 1 hour
    MAX_RETRIES = 10
    
    async def generate_code(self, lobby_id):
        """Generate a unique invite code for a lobby."""
        for _ in range(self.MAX_RETRIES):
            code = ''.join(secrets.choice(self.CODE_CHARS) 
                          for _ in range(self.CODE_LENGTH))
            
            # Check for collision
            existing = await self.redis.get(f"invite:{code}")
            if not existing:
                await self.redis.setex(
                    f"invite:{code}",
                    self.CODE_TTL,
                    lobby_id
                )
                return code
        
        raise Exception("Failed to generate unique invite code")
    
    async def resolve_code(self, code):
        """Resolve an invite code to a lobby ID."""
        lobby_id = await self.redis.get(f"invite:{code}")
        if not lobby_id:
            return None
        return lobby_id.decode() if isinstance(lobby_id, bytes) else lobby_id
```

### 9.2 Private Lobby Flow

```
Host                      Server                  Guest
 |                          |                       |
 |-- create_lobby() ------> |                       |
 |  (is_private=true)       |                       |
 |                          |                       |
 |<-- lobby_created --------|                       |
 |  {lobby_id, invite_code} |                       |
 |                          |                       |
 |-- share invite_code --------------------------------->|
 |                          |                       |
 |                          |<-- join_by_code() ------|
 |                          |  (code=WOLF42)        |
 |                          |                       |
 |<-- player_joined --------|                       |
 |  {guest_id, name}        |                       |
 |                          |-- validate_code ------>|  OK
 |                          |                       |
 |                          |<-- add_to_lobby() ----|
 |                          |                       |
 |                          |--> notify host -------->|
 |                          |                       |
```

### 9.3 Access Control Matrix

| Lobby Type | Discovery | Join Method | Max Players | Visibility |
|-----------|-----------|-------------|-------------|------------|
| **Public** | Lobby browser list | Click to join | 6-16 | Player count, host name visible |
| **Private (Code)** | Not listed | Invite code only | 6-16 | Hidden from public list |
| **Private (Password)** | Not listed | Password required | 6-16 | Hidden, password gate |
| **Friends Only** | Friends list | Friend join button | 6-16 | Visible to friends only |
| **Tournament** | Registration | Admin invite | 8-12 | Event page listing |

---

## 10. API Specifications

### 10.1 Lobby Operations API

#### Create Lobby
```
POST /api/v1/lobbies
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "name": "Werewolf Night",
  "max_players": 10,
  "min_players": 6,
  "is_private": false,
  "game_config": {
    "role_preset": "balanced_10p",
    "day_duration_seconds": 300,
    "night_duration_seconds": 60,
    "bot_fill": true,
    "bot_type": "rule_based",
    "spectator_allowed": true
  },
  "matchmaking": {
    "mode": "custom",  // "custom" | "quick" | "ranked"
    "elo_min": null,
    "elo_max": null
  }
}

Response: 201 Created
{
  "lobby_id": "550e8400-e29b-41d4-a716-446655440000",
  "invite_code": "WOLF42",
  "host_id": "player_123",
  "state": "WAITING",
  "created_at": "2024-06-18T12:00:00Z",
  "websocket_url": "wss://game.example.com/ws/lobby/550e8400"
}
```

#### Join Lobby
```
POST /api/v1/lobbies/{lobby_id}/join
Authorization: Bearer {token}

Response: 200 OK
{
  "lobby_id": "550e8400-e29b-41d4-a716-446655440000",
  "player_slot": 3,
  "state": "WAITING",
  "players": [
    {"id": "host_1", "name": "Alice", "slot": 1, "ready": true, "is_host": true},
    {"id": "player_2", "name": "Bob", "slot": 2, "ready": false, "is_host": false},
    {"id": "player_123", "name": "Charlie", "slot": 3, "ready": false, "is_host": false}
  ],
  "websocket_url": "wss://game.example.com/ws/lobby/550e8400"
}
```

#### Join by Invite Code
```
POST /api/v1/lobbies/join-by-code
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "invite_code": "WOLF42"
}

Response: 200 OK
{ /* Same as regular join */ }
```

#### Matchmaking Queue
```
POST /api/v1/matchmaking/join
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "mode": "ranked",
  "region": "us-east",
  "preferred_size": 9,
  "bot_fill_accepted": true,
  "role_preferences": ["seer", "villager"]  // Optional
}

Response: 202 Accepted
{
  "queue_id": "queue_abc123",
  "status": "searching",
  "estimated_wait_seconds": 45,
  "queue_position": 12,
  "skill_window": 100
}
```

#### Get Queue Status
```
GET /api/v1/matchmaking/queue/{queue_id}
Authorization: Bearer {token}

Response: 200 OK
{
  "queue_id": "queue_abc123",
  "status": "matched",  // "searching" | "matched" | "expired"
  "wait_time_seconds": 32,
  "match": {
    "lobby_id": "lobby_def456",
    "players_found": 9,
    "skill_range": {"min": 1450, "max": 1550}
  }
}
```

#### Leave Queue
```
DELETE /api/v1/matchmaking/queue/{queue_id}
Authorization: Bearer {token}

Response: 204 No Content
```

#### Player Ready
```
WebSocket: lobby:ready
{
  "ready": true
}

Server Broadcast: lobby:player_ready
{
  "player_id": "player_123",
  "ready": true,
  "ready_count": 5,
  "total_players": 9
}
```

#### Start Game (Host Only)
```
WebSocket: lobby:start_game
{}

Server Broadcast: lobby:game_starting
{
  "countdown_seconds": 10,
  "assigned_roles": {
    "player_123": "werewolf"
  }
}
```

### 10.2 Game State WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `game:phase_change` | Server -> Client | Phase transition (night/day/voting) |
| `game:your_turn` | Server -> Client | Player's action is required |
| `game:action_result` | Server -> Client | Result of player's action |
| `game:public_event` | Server -> Client | Public game event (elimination, vote) |
| `game:private_message` | Server -> Client | Faction-specific communication |
| `game:chat` | Bidirectional | Public chat messages |
| `game:vote` | Client -> Server | Cast a vote |
| `game:action` | Client -> Server | Submit role-specific action |
| `game:ping` | Bidirectional | Connection heartbeat |
| `game:reconnect` | Client -> Server | Request state resync |
| `game:resync` | Server -> Client | Full state resync package |

---

## 11. Scaling from 6-Player to 1000+ Simulations

### 11.1 Room Capacity Management

The system supports configurable room sizes with validated role presets:

```python
ROOM_CAPACITY_CONFIG = {
    "minimum_players": 6,      # Absolute minimum to start
    "optimal_players": 9,       # Best game experience
    "maximum_players": 16,      # Upper limit (performance boundary)
    "recommended_sizes": [6, 8, 9, 10, 12, 15],  # Preset configurations
    
    # Role scaling formula
    "werewolf_ratio": "floor(n/3)",     # 1 wolf per 3 players
    "special_role_ratio": "floor(n/5)",  # 1 special per 5 players
    "seer_always": True,                 # Always have at least 1 seer
    "doctor_for_8plus": True             # Doctor for 8+ player games
}
```

### 11.2 1000+ AI Simulation Architecture

For large-scale AI-only tournaments, a dedicated batch processing architecture:

```python
class BatchSimulationEngine:
    """Engine for running thousands of AI-only games in batch mode."""
    
    def __init__(self, config):
        self.concurrency = config.get("max_concurrent_games", 100)
        self.results_db = config["results_database"]  # ClickHouse/OLAP
        self.llm_client = config["llm_api_client"]
        self.game_config = config["game_config"]
    
    async def run_tournament(self, agents, games_per_pairing=10):
        """
        Run a complete tournament between all agent pairings.
        
        agents: List of {agent_id, agent_type, config}
        games_per_pairing: Number of games per agent pair (with role rotation)
        """
        pairings = self._generate_round_robin_pairings(agents)
        
        # Generate all individual game tasks
        tasks = []
        for pairing in pairings:
            for game_num in range(games_per_pairing):
                # Rotate roles across games
                role_rotation = game_num % len(pairing["agents"])
                tasks.append({
                    "agents": pairing["agents"],
                    "role_rotation": role_rotation,
                    "game_config": self.game_config
                })
        
        # Process with controlled concurrency using semaphore
        semaphore = asyncio.Semaphore(self.concurrency)
        
        async def run_with_semaphore(task):
            async with semaphore:
                return await self._run_single_game(task)
        
        # Execute all games
        results = await asyncio.gather(
            *[run_with_semaphore(t) for t in tasks],
            return_exceptions=True
        )
        
        # Aggregate and store results
        await self._aggregate_results(results)
        
        return results
    
    async def _run_single_game(self, task):
        """Run a single game between agents (optimized for speed)."""
        game = FastWerewolfGame(task["game_config"])
        
        # Assign agents with role rotation
        for i, agent in enumerate(task["agents"]):
            game.add_agent(agent, role_rotation_offset=task["role_rotation"])
        
        # Run at accelerated speed (no human delays)
        result = await game.run(
            day_duration_ms=100,      # 100ms per day phase
            night_duration_ms=50,     # 50ms per night phase
            llm_timeout_ms=5000       # 5s max for LLM calls
        )
        
        return {
            "game_id": result.game_id,
            "agents": [a["agent_id"] for a in task["agents"]],
            "winner": result.winner_faction,
            "turns": result.turn_count,
            "duration_ms": result.duration_ms,
            "eliminations": result.elimination_order,
            "chat_log_size": result.chat_message_count
        }
```

### 11.3 Performance Targets by Scale

| Scale | Games | Time to Complete | Infrastructure | Cost Estimate |
|-------|-------|-----------------|---------------|---------------|
| Small Tournament | 210 games | ~30 minutes | 10 pods | ~$5 |
| Medium Tournament | 2,000 games | ~2 hours | 50 pods | ~$30 |
| Large Tournament | 10,000 games | ~4 hours | 100 pods | ~$100 |
| Massive Benchmark | 100,000 games | ~8 hours | 200 pods | ~$500 |

---

## 12. Technology Stack Recommendations

### 12.1 Recommended Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **WebSocket Gateway** | Node.js + Socket.IO | Built-in rooms, namespaces, auto-reconnect, Redis adapter [^14^] [^48^] |
| **Game Logic** | Node.js (primary) + Python (AI) | Node for real-time event loop; Python for LLM integration [^43^] |
| **State Store** | Redis Cluster | Sub-millisecond operations, pub/sub, sorted sets for matchmaking [^17^] [^429^] |
| **Persistent DB** | PostgreSQL + TimescaleDB | ACID transactions, time-series game analytics |
| **Orchestration** | Kubernetes + Agones | Game-server-native scaling, fleet management [^434^] |
| **Message Queue** | Redis Pub/Sub + Bull Queue | Real-time events + reliable job processing |
| **Monitoring** | Prometheus + Grafana | HPA metrics, game health dashboards |
| **LLM Integration** | FastAPI (Python microservice) | Pydantic validation, async LLM calls, model abstraction |

### 12.2 Performance Benchmarks

| Component | Target Metric | Source |
|-----------|-------------|--------|
| WebSocket Latency (p99) | < 50ms | Socket.IO with Redis adapter [^20^] |
| Matchmaking Queue Op | < 10ms | Redis sorted set ZADD/ZRANGEBYSCORE [^429^] |
| State Sync | < 100ms | Full state package + missed events [^422^] |
| Bot Decision Time | < 200ms | Rule-based heuristic evaluation |
| LLM Agent Response | < 5s | GPT-4 class model with prompt caching |
| Game Server per Pod | 8-12 concurrent games | Memory-bound (256MB per game) |
| Max Concurrent Players | 50,000+ per region | 20 WS servers x 2,500 connections |

---

## 13. Implementation Checklist

### Phase 1: Core Lobby (Weeks 1-4)
- [ ] Lobby CRUD API (create, join, leave, list)
- [ ] WebSocket connection management
- [ ] Basic state machine (WAITING -> STARTING -> IN_GAME -> ENDED)
- [ ] Invite code generation and validation
- [ ] Player presence tracking

### Phase 2: Matchmaking (Weeks 3-6)
- [ ] Redis-based matchmaking queue
- [ ] ELO rating calculation and storage
- [ ] Expanding skill window algorithm
- [ ] Bot fill for incomplete lobbies
- [ ] Queue status API and WebSocket events

### Phase 3: Game Integration (Weeks 5-8)
- [ ] Role assignment algorithm
- [ ] Information filtering per player
- [ ] Game state broadcast via Redis pub/sub
- [ ] Spectator mode (read-only event stream)
- [ ] Chat system (global, faction, dead-player)

### Phase 4: Resilience (Weeks 7-10)
- [ ] Disconnection detection with heartbeat
- [ ] Grace period and bot replacement
- [ ] State resynchronization on reconnect
- [ ] Event log for missed event replay
- [ ] Auto-cleanup of stale lobbies/games

### Phase 5: Scaling (Weeks 9-12)
- [ ] Kubernetes deployment manifests
- [ ] HPA with custom metrics
- [ ] Agones fleet configuration
- [ ] Multi-region Redis cluster
- [ ] Load balancer with sticky sessions

### Phase 6: AI Tournament (Weeks 11-14)
- [ ] Agent registration and API
- [ ] Batch simulation engine
- [ ] Tournament bracket management
- [ ] Leaderboard aggregation
- [ ] Result analytics pipeline

---

## 14. Sources and Citations

[^12^] [Create online multiplayer games based on a lobby using React and NodeJS](https://riven.ch/en/news/build-lobby-based-online-multiplayer-browser-games-with-react-and-nodejs) — Complete LobbyManager implementation with NestJS + Socket.IO patterns.

[^14^] [Socket.io vs Ws: Complete Comparison 2025](https://generalistprogrammer.com/comparisons/socket-io-vs-ws) — Performance benchmarks: 20K connections (Socket.IO) vs 65K (raw ws), 32ms vs 12ms p99 latency.

[^17^] [How to Implement Game World State Synchronization with Redis](https://oneuptime.com/blog/post/2026-03-31-redis-game-world-state-sync/view) — Redis patterns for entity state storage, zone-based indexing, and pub/sub broadcasting.

[^20^] [When to Use ws vs socket.io (And Why We Switched)](https://dev.to/alex_aslam/nodejs-websockets-when-to-use-ws-vs-socketio-and-why-we-switched-di9) — Real-world benchmark data from production sports betting app.

[^21^] [Building Scalable Real-Time Multiplayer Card Games](https://dev.to/krishanvijay/building-scalable-real-time-multiplayer-card-games-3kn6) — Authoritative server model, matchmaking, and cross-platform considerations.

[^35^] [How can I host scalable game servers using Docker or Kubernetes?](https://edgegap.com/blog/how-can-i-host-scalable-game-servers-using-docker-or-kubernetes) — Docker/Kubernetes for game servers, managed vs self-hosted comparison.

[^37^] [Comparing server- and client-side anti-cheat solutions](https://www.i3d.net/ban-or-not-comparing-server-client-side-anti-cheat-solutions/) — Server-side validation approaches and statistical analysis.

[^39^] [How to Build a Multi-Player Game Backend on AWS](https://oneuptime.com/blog/post/2026-02-12-build-a-multi-player-game-backend-on-aws/view) — Complete AWS serverless game backend with Lambda, DynamoDB, API Gateway WebSockets.

[^40^] [How to Build a Game Chat System with Redis Pub/Sub](https://oneuptime.com/blog/post/2026-03-31-redis-how-to-build-a-game-chat-system-with-redis-pubsub/view) — Channel architecture for global, match, team, and private chat.

[^41^] [Horizontal Pod Autoscaling (Kubernetes)](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/) — Official Kubernetes HPA documentation with v2 custom metrics.

[^42^] [Mafia — A Serverless Multiplayer Game](https://betterprogramming.pub/mafia-a-serverless-multiplayer-game-95427fb25fba) — Real-world serverless Mafia game on AWS Lambda + DynamoDB.

[^43^] [FastAPI vs Node.js vs Go: 2026 Benchmark Reality Check](https://acquaintsoft.com/blog/fastapi-vs-nodejs-vs-go-performance-benchmarks) — Comprehensive benchmark analysis with hybrid architecture patterns.

[^44^] [The Real Cost of AWS GameLift at Global Scale](https://edgegap.com/blog/the-hidden-cost-of-aws-gamelift-s-pricing) — Pricing analysis showing 279% cost increase for multi-region deployment.

[^45^] [Client-side vs Server-side anti-cheat (Anybrain)](https://blog.anybrain.gg/client-side-vs-server-side-anti-cheat-6721d38eb347) — Wallhack prevention through information hiding.

[^46^] [Amazon GameLift Servers Pricing](https://www.amazonaws.cn/en/gamelift/pricing/) — Official AWS GameLift pricing with free tier and spot instances.

[^47^] [How to Build Matchmaking Systems with Redis](https://oneuptime.com/blog/post/2026-01-21-redis-matchmaking-systems/view) — Lobby management with Redis including player-ready tracking and game start orchestration.

[^48^] [Socket.IO Connection State Recovery](https://socket.io/docs/v4/connection-state-recovery) — Official documentation on automatic reconnection with missed event recovery.

[^49^] [Scaling Matchmaking to One Million Players (AccelByte)](https://accelbyte.io/blog/scaling-matchmaking-to-one-million-players) — Architecture and load testing for 1M CCU matchmaking.

[^127^] Werewolf Arena (Google Research) — Dynamic turn-taking system, balanced tournament design, 10 games per pairing with role alternation.

[^170^] [RLereWolf – Reinforcement Learning Agent Development Framework](https://www.abdn.ac.uk/staffpages/uploads/s01by9/content/D51RDr521VnGVYW87ct0zg4QqKXo8Szmj1fccSkQ.pdf) — Point-based role distribution system, ratio-based vs point-based analysis.

[^377^] [Best strategy when player left the online multiplayer game](https://gamedev.stackexchange.com/questions/175301/best-strategy-when-player-left-the-online-multiplayer-game) — Comprehensive analysis of disconnection handling strategies across game genres.

[^378^] [Scalable WebSocket Architecture](https://blog.hathora.dev/scalable-websocket-architecture/) — Hathora's stateful router pattern vs traditional message-broker architecture.

[^379^] [WebSocket Real-Time Communication: Architecture and Scaling Guide 2026](https://www.smart-maple.com/en/blog/gercek-zamanli-iletisim-websocket-en) — Socket.IO rooms, namespaces, sticky sessions, Redis pub/sub patterns.

[^380^] [Spectator Mode and Streaming - Unity Engine](https://discussions.unity.com/t/spectator-mode-and-streaming/938940) — Large-scale spectatorship architecture with replay-based streaming.

[^381^] [Building Real-Time Applications with WebSockets in 2026](https://zeonedge.com/en/blog/building-real-time-applications-websockets-2026-architecture-scaling) — Horizontal scaling with Redis Pub/Sub, connection multiplexing patterns.

[^382^] [Suggestion: replace disconnected players with AI](https://forums.ageofempires.com/t/suggestion-replace-disconnected-players-with-ai/65514) — Community discussion on AI replacement for disconnected players.

[^383^] [WebSocket Scaling: Complete Beginner's Guide](https://blog.devgenius.io/websocket-scaling-complete-beginners-guide-from-basics-to-advanced-a966ef3ee6f6) — Architecture progression from 1-1000 users.

[^384^] [Players that leave matches should be replaced by bots](https://forum.crossout.net/t/players-that-leave-matches-should-be-replaced-by-bots/24992) — Player community perspectives on bot replacement.

[^385^] [Multiplayer State Management with Unity and Dragonfly Cloud](https://www.dragonflydb.io/blog/multiplayer-state-management-with-unity-and-dragonfly-cloud) — Redis pub/sub for game state synchronization.

[^387^] [WebSocket architecture best practices to design robust realtime system](https://ably.com/topic/websocket-architecture-best-practices) — Sharding, pub/sub, and operational best practices from Ably.

[^391^] [Bot or not? User Perceptions of Player Substitution with Deep Player Behavior Models](https://www.smeddinck.com/publication/pfau_bot_2020/) — CHI 2020 research: DPBM agents undetectable as substitutes.

[^410^] [HorizontalPodAutoscaler Walkthrough](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/) — Official Kubernetes HPA walkthrough with custom metrics.

[^411^] [Horizontal Pod Autoscaling](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/) — Kubernetes HPA official documentation, v2 API.

[^415^] [Lobby Quick Start (PlayFlow)](https://docs.playflowcloud.com/unity/lobbies) — Private lobby creation with invite code pattern.

[^417^] [Game Lobby (SmartFoxServer)](https://docs2x.smartfoxserver.com/ExamplesJS/game-lobby) — Public/private game rooms, invitation system, match expression patterns.

[^418^] [Multiplayer Elo (Tom Kerrigan)](https://www.tckerrigan.com/Misc/Multiplayer_Elo/) — Simple Multiplayer Elo (SME) algorithm for N-player games.

[^419^] [A Beginner's Guide to Multiplayer Lobbies](https://docs.playflowcloud.com/unity/lobby-overview) — Lobby lifecycle: Waiting -> In-Game states, host migration.

[^420^] [Teaching Elo to Play with Friends](https://blog.recommend.games/posts/teaching-elo-to-play-with-friends/) — Multiplayer ELO ranking probabilities, Board Game Arena approach.

[^422^] [How to Implement Reconnection Logic for WebSockets](https://oneuptime.com/blog/post/2026-01-27-websocket-reconnection/view) — Production-ready reconnection with exponential backoff, state recovery.

[^429^] [How to Implement Player Matchmaking Queue with Redis](https://oneuptime.com/blog/post/2026-03-31-redis-how-to-implement-player-matchmaking-queue-with-redis/view) — Sorted set skill-based matching with expanding window.

[^430^] [Build matchmaking and game session state with Redis](https://redis.io/tutorials/matchmaking-and-game-session-state-with-redis/) — Redis official tutorial with WATCH/MULTI optimistic locking.

[^431^] [How to Build Matchmaking Systems with Redis](https://oneuptime.com/blog/post/2026-01-21-redis-matchmaking-systems/view) — Complete matchmaking service with lobby management and reconnection.

[^432^] [Rejoin Feature for Disconnected Players with Bot Replacement](https://app.betahub.io/projects/pr-2055671118/feature_requests/4089) — Splitgate bot replacement system with tier-based AI.

[^433^] [Design a Simple Real-Time Matchmaking Service](https://yashh21.medium.com/designing-a-simple-real-time-matchmaking-service-architecture-implementation-96e10f095ce1) — Go-based matchmaking with Redis queue and MMR-based pairing.

[^434^] [Agones Overview](https://agones.dev/site/docs/overview/) — Kubernetes-native game server management, fleet scaling.

[^435^] [Agones Homepage](https://agones.dev/) — Open-source dedicated game server scaling and orchestration platform.

[^442^] [GitHub - Agones](https://github.com/agones-dev/agones) — GameServer and Fleet custom resources for Kubernetes.

[^443^] [Pub/Sub Patterns](https://redis.antirez.com/community/pubsub.html) — Redis fire-and-forget messaging, scaling with multiple servers.

[^444^] [How to Implement Redis Pub/Sub Patterns for Real-Time Event Broadcasting](https://oneuptime.com/blog/post/2026-02-09-redis-pubsub-event-broadcasting/view) — Chat system implementation with WebSocket + Redis Pub/Sub.

[^445^] [Is there a competitive version of werewolf/mafia?](https://boardgames.stackexchange.com/questions/11530/is-there-a-competitive-version-of-werewolf-mafia) — Multiple games approach for competitive balance.

---

*Document compiled from 19+ independent web searches across game lobby lifecycle management, matchmaking systems, WebSocket scaling, disconnection recovery, ELO rating systems, role assignment algorithms, spectator mode architecture, Kubernetes autoscaling, and AI tournament management. All findings include inline citations to original sources.*
