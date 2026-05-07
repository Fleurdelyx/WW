# Dimension 3: Game Loop & Phase Management

## Complete Phase State Diagram (ASCII)

```
                         +-----------+
                         |   START   |
                         +----+------+
                              |
                              v
                    +--------+---------+
                    |     LOBBY        |<----------+
                    |  (Waiting for    |           |
                    |   players to     |           |
                    |    join/ready)   |           |
                    +--------+---------+           |
                             |                     |
                    All players ready              |
                    (min 6, max 18)                |
                             |                     |
                             v                     |
               +-------------+------------+        |
               |     ROLE_ASSIGNMENT      |        |
               |  (Server assigns roles   |        |
               |   based on setup config; |        |
               |   wolves learn teammates)|        |
               +-------------+------------+        |
                             |                     |
                             | [Always starts with |
                             |   Night by default] |
                             v                     |
           +-----------------+------------------+  |
           |              NIGHT_PHASE            |  |
           |  +-------------------------------+  |  |
           |  | NIGHT_START (Instant)         |  |  |
           |  | - Assign meetings             |  |  |
           |  | - Process bleeding deaths     |  |  |
           |  +-------------------------------+  |  |
           |  | NIGHT_MAIN (Configurable:     |  |  |
           |  |   1-9 min, default 5)         |  |  |
           |  | - Wolves discuss & vote kill  |  |  |
           |  | - Seer selects investigate    |  |  |
           |  | - Doctor/Protector selects    |  |  |
           |  |   protection target           |  |  |
           |  | - Witch sees kill target,     |  |  |
           |  |   decides heal/poison         |  |  |
           |  | - Other roles take actions    |  |  |
           |  +-------------------------------+  |  |
           |  | NIGHT_END (Instant)           |  |  |
           |  | - Resolve actions by priority |  |  |
           |  | - Process kills/protections   |  |  |
           |  | - Swap identities             |  |  |
           |  +-------------------------------+  |  |
           +-----------------+------------------+  |
                             |                     |
                             v                     |
              +--------------+--------------+     |
              |   DAWN_ANNOUNCEMENT         |     |
              |   (Instant)                 |     |
              | - Report deaths (or no-kill)|     |
              | - Reveal roles of deceased  |     |
              |   (if reveal-on-death on)   |     |
              | - Trigger Hunter checks     |     |
              | - Award post-death actions  |     |
              +--------------+--------------+     |
                             |                     |
                             v                     |
              +--------------+--------------+     |
              |     CHECK_WIN_CONDITION     |     |
              |     (After each elimination)|     |
              +--------------+--------------+     |
                    |              |               |
         No winner  |              | Winner found  |
                    v              v               |
         +----------+---+  +-----+--------+      |
         | DAY_DISCUSSION | |  GAME_OVER   |      |
         | (Configurable:  | |              |      |
         |  3-20 min,      | | - Reveal all |      |
         |  default 13)    | |   remaining  |      |
         |                 | |   roles      |      |
         | - Free speech   | | - Award win  |      |
         | - Accusations   | |   to faction |      |
         | - Claim/counter-| | - Persist to |      |
         |   claim analysis| |   database   |      |
         +--------+------+ +--------------+      |
                  |                                 |
                  v                                 |
         +--------+--------+                        |
         |  DAY_VOTING     |                        |
         |  (Plurality     |                        |
         |   voting; ends  |                        |
         |   on timer or   |                        |
         |   all votes in) |                        |
         +--------+--------+                        |
                  |                                 |
                  v                                 |
         +--------+--------+                        |
         |  VOTE_LOCK      |                        |
         |  (90 seconds;   |                        |
         |   votes frozen) |                        |
         +--------+--------+                        |
                  |                                 |
                  v                                 |
         +--------+--------+                        |
         |  EXECUTION      |                        |
         |  - Kill player  |                        |
         |    with most    |                        |
         |    votes        |                        |
         |  - Handle ties  |                        |
         |    (random/no   |                        |
         |    kill/mayor)  |                        |
         +--------+--------+                        |
                  |                                 |
                  v                                 |
         +--------+--------+                        |
         |  CHECK_WIN      |--------------------+   |
         |  _CONDITION     |                    |   |
         +--------+--------+                    |   |
                  |              Winner found   |   |
         No winner|                             |   |
                  v                             |   |
         +--------+--------+                   |   |
         | DEADLOCK_CHECK  |                   |   |
         | (Increment round|                   |   |
         |  counter; check |                   |   |
         |  meteor trigger)|                   |   |
         +--------+--------+                   |   |
                  |                             |   |
                  v                             |   |
                  +-----------------------------+   |
                  |                                 |
                  v                                 |
     +------------+-------------+                   |
     | METEOR_RESOLUTION        |                   |
     | (If 5-6 rounds of no-    |                   |
     |  lynch/no-kill; kills    |                   |
     |  offending faction)      |                   |
     +------------+-------------+                   |
                  |                                 |
                  v                                 |
     +------------+-------------+                   |
     | POST_EXECUTION           |                   |
     | - Process post-lynch     |                   |
     |   actions (Hunter kill,  |                   |
     |   role reveals)          |                   |
     +------------+-------------+                   |
                  |                                 |
                  +---------------------------------+
                  (Return to NIGHT_PHASE)
```

## Night Phase Sub-State Detail

```
+------------------------------------------------------------------+
|                    NIGHT_PHASE (Composite State)                   |
|                                                                    |
|  +--------------+    +--------------+    +-------------------+   |
|  | NIGHT_START  |--->| NIGHT_MAIN   |--->| NIGHT_RESOLUTION  |   |
|  | (Instant)    |    | (Timer-based)|    | (Instant)         |   |
|  +--------------+    +--------------+    +-------------------+   |
|                                               |                    |
|                                               v                    |
|  Internal action resolution pipeline:          |                    |
|  (All within NIGHT_RESOLUTION)                 |                    |
|  +------------------------+                    |                    |
|  | 1. REDIRECTS           |                    |                    |
|  |    (Succubus actions)  |                    |                    |
|  +------------------------+                    |                    |
|  | 2. ROLEBLOCKS          |                    |                    |
|  |    (Direwolf, Courtesan|                    |                    |
|  |     Manacles of Spite) |                    |                    |
|  +------------------------+                    |                    |
|  | 3. PROTECTION_VISITS   |                    |                    |
|  |    (Protector, Huntsman|                    |                    |
|  |     Shaman, Armour)    |                    |                    |
|  +------------------------+                    |                    |
|  | 4. MOST_VISITS         |                    |                    |
|  |    (All other visits)  |                    |                    |
|  +------------------------+                    |                    |
|  | 5. ITEM_THEFTS         |                    |                    |
|  |    (Ability/potion)    |                    |                    |
|  +------------------------+                    |                    |
|  | 6. KILLS               |                    |                    |
|  |    (Wolf kill, Vamp,   |                    |                    |
|  |     Witch poison,      |                    |                    |
|  |     Militia)           |                    |                    |
|  +------------------------+                    |                    |
|  | 7. REPORT_VISITS       |                    |                    |
|  |    (Stalkers, Harlots) |                    |                    |
|  +------------------------+                    |                    |
|  | 8. PASSING_OF_ITEMS    |                    |                    |
|  +------------------------+                    |                    |
|  | 9. SWAP_IDENTITIES     |                    |                    |
|  |    (Djinn, Shapeshifter|                    |                    |
|  |     - LAST before      |                    |                    |
|  |       reports)         |                    |                    |
|  +------------------------+                    |                    |
|  | 10. REPORT_KILLS       |                    |                    |
|  |     (Announce deaths   |                    |                    |
|  |      to village)       |                    |                    |
|  +------------------------+                    |                    |
|  | 11. REPORT_REVIVES     |                    |                    |
|  |     (Announce revives  |                    |                    |
|  |      to village)       |                    |                    |
|  +------------------------+                    |                    |
|                                                |                    |
|  +------------------------+                    |                    |
|  | HUNTER_CHECK           |<------------------+                    |
|  | (After lynch kill:     |                                        |
|  |  Hunter picks target)  |                                        |
|  +------------------------+                                        |
+------------------------------------------------------------------+
```

---

## Night Action Resolution Ordering (11-Category System)

Based on the werewolv.es platform's extensively tested resolution order [^46^], night actions resolve in the following strict sequence. Actions within the same category execute simultaneously, with conflicts resolved by deterministic server-defined ordering.

### Resolution Pipeline

| Priority | Category | Roles/Actions Included | Effect |
|----------|----------|----------------------|--------|
| 1 | **Redirects** | Succubus | Changes target of another player's action |
| 2 | **Roleblocks** | Direwolf, Courtesan, Manacles of Spite | Prevents target from taking their night action |
| 3 | **Protection Visits** | Protector, Huntsman, Shaman, Armour, Heavy Shield | Grants protection against kills |
| 4 | **Most Visits** | All visit actions not in other categories (including items) | Role-specific effects on targets |
| 5 | **Item Thefts** | Ability and potion-based theft | Steals items from targets |
| 6 | **Kills** | Werewolf/Alphawolf/Shapeshifter, Vampire, Witch poison, Militia | Elimination attempts |
| 7 | **Report Visits** | Stalker, Harlot, Familiar | Reports on who visited whom |
| 8 | **Passing of Items** | Item transfer between players | Items change hands |
| 9 | **Swap Identities** | Djinn, Shapeshifter | Exchanges avatar/username (not abilities/faction) |
| 10 | **Report Kills** | Village death announcement | Public notification of deaths |
| 11 | **Report Revives** | Village revive announcement | Public notification of revivals |

### Conflict Resolution Rules

Multiple actions targeting the same player within the same category are resolved as follows [^46^]:

1. **Redirects & Identity Swaps**: Execute in deterministic server-defined order. Two Succubi targeting each other produces unpredictable but deterministic results based on internal ordering.

2. **Multiple Roleblocks**: Target receives one message per roleblock but suffers no cumulative effect. Being roleblocked twice is identical to being roleblocked once.

3. **Protection Overlap**: Multiple protections on the same target provide no additional defensive benefit (one protection blocks one kill). However, if the target IS attacked, all associated protection-triggered effects fire. Example: Huntsman + Protector on same target means if attacked, Huntsman kills attacker AND Protector saves target.

4. **Item Theft Conflict**: If multiple players attempt to steal from the same target, no items are stolen by anyone.

5. **Simultaneous Kills**: If multiple killers target the same player, the kill is attributed to a single killer in deterministic server-defined order. However, all "on-success" effects (like item theft from kills, Werewolf Cub extra kill) still trigger for all successful killers.

6. **Roleblocks prevent roleblocks**: A roleblocker can be roleblocked by another roleblocker, preventing their roleblock from applying.

### Alternative Priority System: Town of Salem Model

Town of Salem uses a numbered priority system (1-6) where lower numbers execute first [^209^]:

| Priority | Example Roles |
|----------|--------------|
| 1 (Highest) | Transporter, Veteran (on alert), Jester (haunt) |
| 2 | Tavern Keeper (roleblock), Witch (control) |
| 3 | Bodyguard, Crusader, Doctor, Tracker |
| 4 | Investigator, Lookout, Psychic, Sheriff |
| 5 | Jailor (execute), Godfather, Mafioso, Serial Killer, Werewolf |
| 6 (Lowest) | Spy, Amnesiac |

This model differs from werewolv.es in that it uses numeric priority rather than category-based resolution, but the fundamental principle (order matters) is identical.

---

## Timing Configuration Table

Based on mafia.gg's extensively configurable system [^70^] and industry standards:

| Parameter | Min | Max | Default | Description |
|-----------|-----|-----|---------|-------------|
| **Day Length** | 3 min | 20 min | 13 min | Total discussion + voting time |
| **Night Length** | 1 min | 9 min | 5 min | Time for night actions |
| **Vote Lock Period** | 0 (disabled) | Fixed | 90 sec | End-of-day period where votes are frozen |
| **Post-Lynch Period** | 0 | Fixed | 90 sec | Time for post-lynch actions (Hunter kill, etc.) |
| **Scale Timer** | Off | On | Off | Dynamically scales timers based on alive player count |
| **Scale Factor** | 70% | 100% | 100% | Timer at 100%/0% alive players; peaks at 100% at 50% alive |
| **Start Phase** | Night | Day | Night | Whether game begins with Night or Day |
| **No-Kill Night 1** | Off | On | Off | First night wolves identify but don't kill |
| **AFK Warning** | 30 sec | 60 sec | 45 sec | Warning before marking player AFK |
| **AFK Kill Threshold** | 1 miss | 3 misses | 2 misses | Consecutive missed votes before auto-kill |
| **Discussion Rounds** | 1 | 5 | 3 | Structured speech rounds per day |
| **Speech Time** | 30 sec | 3 min | 1 min | Per-player speaking time limit |
| **Majority Finalize** | Off | 75% | Off | End voting early when X% majority reached |

### Scale Timer Behavior

When Scale Timer is enabled [^70^]:
- At 100% of players alive: timer runs at 70% of configured duration
- At 50% of players alive: timer runs at 100% of configured duration (peak)
- At 0% of players alive (endgame): timer runs at 70% of configured duration
- Linear interpolation between these points

### Vote Lock Behavior

During the Vote Lock period [^70^]:
1. Players may NO LONGER change their vote or unvote
2. Players who have not voted by end of Vote Lock are marked AFK and default to "No One"
3. Missing vote twice consecutively = automatic death, vote nullified, cannot win
4. If Disable Vote Lock is enabled, the day simply ends when timer expires without the lock period

---

## Win Condition Algorithm

### Win Check Timing

Win conditions are checked at these exact moments [^171^]:
1. **After each night kill resolution** (Dawn Announcement)
2. **After each lynch execution** (Post-Lynch)
3. **After Hunter revenge kill** (if Hunter was lynched/killed)
4. **After meteor resolution** (deadlock prevention)

### Village Win Condition

```
function checkVillageWin(alivePlayers):
    wolfCount = count players with wolf alignment alive
    return wolfCount == 0
```

### Werewolf Win Condition (Parity)

```
function checkWerewolfWin(alivePlayers):
    wolfCount = count players with wolf alignment alive
    nonWolfCount = count players without wolf alignment alive
    return wolfCount >= nonWolfCount
    // Note: "equal or greater" - wolves win at parity
```

### Special Role Win Conditions

| Role/Team | Win Condition |
|-----------|--------------|
| **Tanner/Jester** | Get themselves voted out (independent) |
| **Serial Killer** | Be last player alive (independent) |
| **Cult Leader** | All alive players are cult members |
| **Lovers (Cupid)** | Both lovers survive when all others eliminated |
| **Fool** | Get voted out and spared (different from Tanner) |

### Win Check Order of Precedence

When checking wins after an elimination, evaluate in this order:

1. **Simultaneous elimination scenarios first** - if both last wolf AND last non-wolf die simultaneously (e.g., Hunter kills last wolf while being lynched), the game is a **draw** [^256^]
2. **Village win** - if no wolves remain
3. **Werewolf win** - if wolves achieve parity
4. **Neutral win** - if neutral role's condition is met
5. **Multiple winners possible** - Town of Salem allows "multiple winners, one winner, or no winners" [^103^]

### Draw/Deadlock Prevention (Meteor Mechanic)

To prevent games from stalling indefinitely, mafia.gg implements a "meteor" system [^70^] [^181^]:

#### Configuration Options

| Setting | Rounds Until Meteor | Punishment Target |
|---------|--------------------|-------------------|
| **Punish Randomly** (default) | 5-6 rounds | Randomly chosen faction |
| **Punish Initiators** | 5 rounds | Faction that first chose no-lynch/no-kill |
| **Punish Responders** | 6 rounds | Faction that responded with no-lynch/no-kill |
| **Disable Meteor** | N/A | No automatic punishment |

#### Meteor Trigger Conditions

A "round of indecision" is counted when:
- Town votes "No Lynch" (no player is lynched that day), AND
- Mafia chooses "No Kill" (no night kill)

Both must occur in the same full cycle (day + night) to count as one indecision round.

#### Meteor Resolution

When the meteor threshold is reached:
1. A system warning is broadcast: "You need to vote someone to condemn/kill today/tonight, or else [faction] will lose!"
2. If the offending faction again chooses no-action, ALL members of that faction die instantly
3. The opposing faction wins by default

#### Strategic Implications

The meteor mechanic creates critical strategic pressure points [^181^]:
- **MYLO (Mislynch and Lose)**: Town MUST lynch a wolf or they face meteor
- **CYLO (Can't Lynch and Lose)**: Town cannot afford to no-lynch
- Wolves are forced to kill (cannot stall for parity advantage)
- The parity math changes: odd rounds generally favor town, even rounds favor mafia

---

## State Transition Matrix

| From State | To State | Trigger Condition | Validation |
|------------|----------|-------------------|------------|
| LOBBY | ROLE_ASSIGNMENT | All players ready, min count met | >= 6 players, <= setup max |
| ROLE_ASSIGNMENT | NIGHT_PHASE | Role assignment complete | Every player has exactly one role and faction |
| NIGHT_PHASE | DAWN_ANNOUNCEMENT | Night timer expired OR all actions submitted | All required actions collected |
| DAWN_ANNOUNCEMENT | CHECK_WIN | Death announcements complete | All night effects processed |
| CHECK_WIN | GAME_OVER | Win condition satisfied | Village win OR Wolf win OR Neutral win |
| CHECK_WIN | DAY_DISCUSSION | No winner yet | Game continues |
| DAY_DISCUSSION | DAY_VOTING | Discussion timer expired OR majority called vote | Vote phase enabled |
| DAY_VOTING | VOTE_LOCK | Voting timer expired OR all votes cast | Votes tallied |
| VOTE_LOCK | EXECUTION | Vote lock timer expired | Votes are final |
| EXECUTION | CHECK_WIN | Execution complete | Death processed |
| CHECK_WIN | POST_EXECUTION | No winner yet | Continue to post-lynch |
| POST_EXECUTION | CHECK_WIN | Post-lynch actions complete | Hunter kill, etc. |
| CHECK_WIN | NIGHT_PHASE | No winner after post-execution | Cycle continues |
| CHECK_WIN | METEOR_RESOLUTION | Deadlock threshold reached | 5-6 rounds of indecision |
| METEOR_RESOLUTION | GAME_OVER | Meteor executed | One faction eliminated |
| METEOR_RESOLUTION | NIGHT_PHASE | Faction complied (acted) | Reset indecision counter |
| GAME_OVER | LOBBY | Post-game complete | Persist results, return to lobby |

### Transition Validation Rules

Each state transition must pass validation [^170^] [^223^]:

```
function validateTransition(fromState, toState, gameContext):
    // Check transition is in allowed matrix
    if !ALLOWED_TRANSITIONS[fromState].includes(toState):
        return ValidationResult.INVALID_TRANSITION
    
    // State-specific validations
    switch(fromState):
        case NIGHT_PHASE:
            // All required night actions must be collected
            if !gameContext.allActionsCollected():
                return ValidationResult.MISSING_ACTIONS
            // Actions must be from valid sources (alive, correct phase)
            for action in gameContext.pendingActions:
                if !action.player.isAlive:
                    return ValidationResult.DEAD_PLAYER_ACTION
                if !action.player.role.canActInNight():
                    return ValidationResult.INVALID_ROLE_ACTION
        
        case DAY_VOTING:
            // Votes must be for alive players
            for vote in gameContext.votes:
                if !vote.target.isAlive:
                    return ValidationResult.DEAD_PLAYER_TARGET
                if vote.target == vote.voter:
                    return ValidationResult.SELF_VOTE  // Usually disallowed
        
        case EXECUTION:
            // Must have a valid lynch target
            if gameContext.lynchTarget == null:
                return ValidationResult.NO_LYNCH_TARGET
    
    return ValidationResult.VALID
```

---

## Edge Case Handling

### Simultaneous Kills

When multiple killers target the same victim [^46^] [^234^]:

```
function resolveSimultaneousKills(target, killers):
    // Kills are attributed in deterministic server-defined order
    primaryKiller = sortByServerOrder(killers)[0]
    
    // Target dies once (not multiple times)
    target.kill(attributedTo: primaryKiller)
    
    // All on-success effects trigger
    for killer in killers:
        killer.triggerOnKillEffects(target)
    
    // Item theft from kill goes to primaryKiller only
    if target.hasItems():
        primaryKiller.receiveItems(target.items)
```

**Example**: Werewolf AND Witch poison AND Serial Killer all target Player A. Player A dies once. Werewolf gets credit (server-defined order). All three get their "on-kill" effects (Witch poison consumed, SK tracks as kill, Werewolf team gets kill credit).

### Protection Stack Resolution

When a target has multiple protections [^46^] [^290^]:

```
function resolveKillWithProtections(target, killers, protections):
    // Each protection blocks ONE kill attempt
    // But protection-triggered effects ALL fire
    
    activeProtections = protections.clone()
    
    for killer in killers:
        if activeProtections.length > 0:
            protection = activeProtections.shift()  // Consume one protection
            protection.onTrigger(killer)  // Huntsman kills attacker, etc.
            // Target survives this kill
        else:
            target.kill(attributedTo: killer)
            break
```

**Example**: Doctor + Huntsman protect Player A. Werewolf attacks Player A. First protection (say, Huntsman) blocks the kill AND kills the attacking Werewolf. Doctor's protection is NOT consumed but remains "active" (though redundant since there's no more attacks).

### Roleblock vs Protection Timing

Roleblocks resolve BEFORE protections [^46^]. A roleblocked Protector cannot protect their target. However:
- If Protector A is roleblocked but Protector B (not blocked) also protects the same target, B's protection still works
- Roleblockers themselves can be roleblocked

### Identity Swaps (Shapeshifter)

Identity swaps occur LAST in night resolution, just before kill reporting [^28^] [^104^]:

```
function resolveIdentitySwap(playerA, playerB):
    // Swap ONLY visual identity (avatar, username)
    // Do NOT swap: faction, abilities, night chats, statuses
    tempIdentity = playerA.identity
    playerA.identity = playerB.identity
    playerB.identity = tempIdentity
    
    // Intelligence reports after this point show NEW identities
    // But night actions already resolved with ORIGINAL targeting
```

**Key implication**: If Seer investigates Player A, and Shapeshifter swaps A and B before dawn, the Seer's morning report shows B's name but A's role information (since the investigation resolved before the swap).

### Hunter Death Triggers

The Hunter presents two distinct timing scenarios [^235^] [^243^]:

**Revealed game (role shown on death)**:
- Hunter dies (lynch or night kill)
- Role is revealed
- Hunter immediately selects a target to kill
- Target dies instantly
- Win check runs after Hunter's kill

**No-reveal game**:
- At START of each Night phase, moderator asks Hunter: "If you died, choose someone to kill"
- Moderator gives thumbs-up if Hunter died, thumbs-down if not
- Hunter's kill resolves during night phase and CAN be protected against

### First Night Special Rules

Many configurations modify Night 1 [^231^]:

| Setting | Effect |
|---------|--------|
| **Normal Night Start** | Standard night with full wolf kill |
| **No Kill Night 1 (NKN1)** | Wolves identify teammates but do NOT kill |
| **Day Start (Informed)** | Game starts with Day; wolves know each other |
| **Day Start (Uninformed)** | Game starts with Day; wolves do NOT know each other |

No Kill Night 1 is commonly used to prevent random first-night deaths and give Seer at least one check.

### Witch Timing Specifics

The Witch's action timing is critical [^258^] [^56^]:

1. Witch is shown who the Werewolves' kill target is ("who MAY die tonight")
2. Witch decides whether to use healing potion
3. Witch decides whether to use poison potion
4. Both decisions are made BEFORE kill resolution
5. A saved player is announced as "someone was saved" at dawn (without revealing who)
6. Poison kills resolve as part of the Kill category (priority 6)
7. If Witch is killed the same night they use poison, the poison STILL resolves (kills do not prevent already-submitted actions) [^28^]

### AFK/Inactive Player Handling

Based on mafia.gg and werewolv.es systems [^70^] [^28^]:

```
function handleAFKPlayer(player, dayPhase):
    if player.hasNotVoted():
        // First offense: mark AFK, vote defaults to "No One"
        player.afkStrikeCount++
        player.castDefaultVote()
        
        if player.afkStrikeCount >= 2:
            // Second offense: kill player
            player.kill(cause: AFK)
            player.vote = null  // Vote does not count
            player.canWin = false  // Cannot win even if faction wins
            
            // Announce AFK kill to all players
            broadcast(f"{player.name} was removed for inactivity.")
```

Night phase AFK handling: if a player does not select an action, it defaults to "No One" (or randomizes if "No One" is not a valid option).

---

## Turn Timer Management & Auto-Skip

### Timer Architecture

For a turn-based game server, the recommended tick rate is **1-10 ticks per second** [^183^]. Nakama's authoritative multiplayer documentation specifically recommends starting with the lowest acceptable rate and incrementing by 1-2 ticks until desired responsiveness is achieved.

```
class PhaseTimer {
    tickRate: 1,           // 1 tick per second for turn-based
    currentPhase: Phase,
    remainingSeconds: number,
    
    function onTick():
        remainingSeconds--
        
        // Broadcast timer update to all clients
        broadcastTimerUpdate(remainingSeconds)
        
        // Check for phase transition trigger
        if remainingSeconds <= 0:
            forceAdvancePhase()
        
        // Check for majority-vote early end
        if currentPhase == DAY_VOTING && hasMajorityVote():
            if config.finalizeOnMajority:
                advancePhase()
    
    function forceAdvancePhase():
        // Collect any pending actions with defaults
        for player in pendingActionPlayers:
            assignDefaultAction(player)
        
        // Execute state transition
        transitionTo(nextPhase)
    
    function onPlayerAction(player, action):
        // If all players have acted, potentially end early
        if allPlayersActed() && config.endEarlyOnFull participation:
            remainingSeconds = min(remainingSeconds, 5)  // 5-sec grace
}
```

### Auto-Skip Behavior

| Scenario | Behavior |
|----------|----------|
| **All night actions submitted** | Night ends early (5-second buffer for changes) |
| **All day votes cast** | Day continues unless "Finalize on Majority" enabled |
| **Vote Lock reached** | Votes frozen; timer continues to Post-Lynch |
| **Player goes AFK** | Default vote assigned; kill after 2 strikes |
| **Player disconnects** | Action defaults to "No One"; can reconnect within grace period |
| **Grace period expired** | Player marked as abandoned; may be replaced by bot |

### Server Tick Budget

For a Werewolf game server:
- **Recommended tick rate**: 1-4 ticks/second (turn-based, low-frequency updates)
- **Maximum concurrent matches per core**: Inversely proportional to tick rate
- **Tick budget at 1 tick/sec**: 1000ms (extremely generous)
- **Tick budget at 4 ticks/sec**: 250ms (still very generous for turn-based)

The server must ensure each tick completes within its budget; falling behind causes cascading delays [^183^].

---

## Pseudocode: Complete Game Loop

```python
class WerewolfGameLoop:
    state = GameState.LOBBY
    round = 0                    # Full day+night cycles
    indecisionRounds = 0         # Counter for deadlock detection
    meteorThreshold = 5          # Configurable (5-6)
    alivePlayers = []
    pendingActions = {}
    
    function runTick():
        match state:
            case LOBBY:
                checkAllPlayersReady()
                
            case ROLE_ASSIGNMENT:
                assignRoles()
                distributeFactionKnowledge()
                transitionTo(NIGHT_PHASE)
                
            case NIGHT_PHASE:
                processNightPhase()
                
            case DAWN_ANNOUNCEMENT:
                announceNightResults()
                checkWinConditions()
                
            case DAY_DISCUSSION:
                processDiscussionPhase()
                
            case DAY_VOTING:
                processVotingPhase()
                
            case VOTE_LOCK:
                // Votes are frozen; just wait for timer
                if voteLockTimer.expired():
                    tallyFinalVotes()
                    transitionTo(EXECUTION)
                    
            case EXECUTION:
                executeLynchTarget()
                checkWinConditions()
                
            case POST_EXECUTION:
                processPostLynchActions()
                checkDeadlock()
                checkWinConditions()
                if noWinner:
                    transitionTo(NIGHT_PHASE)
                    
            case METEOR_RESOLUTION:
                resolveMeteor()
                checkWinConditions()
                
            case GAME_OVER:
                finalizeGame()
                transitionTo(LOBBY)
    
    function processNightPhase():
        if nightTimer.justStarted():
            round++  # Increment round counter
            initializeNightMeetings()
            processBleedingDeaths()
            requestActionsFromPlayers()
        
        if allActionsCollected() or nightTimer.expired():
            resolveNightActions()
            transitionTo(DAWN_ANNOUNCEMENT)
    
    function resolveNightActions():
        # Step 1: Redirects
        for action in pendingActions.where(type == REDIRECT):
            applyRedirect(action)
        
        # Step 2: Roleblocks
        for action in pendingActions.where(type == ROLEBLOCK):
            if !isRoleblockImmune(action.target):
                blockTarget(action.target)
        
        # Step 3: Protection visits
        protections = {}
        for action in pendingActions.where(type == PROTECT):
            if !isBlocked(action.source):
                protections[action.target].add(action)
        
        # Step 4: Most visits (intelligence gathering)
        for action in pendingActions.where(type == VISIT):
            if !isBlocked(action.source):
                recordVisit(action.source, action.target)
        
        # Step 5: Item thefts
        for action in pendingActions.where(type == ITEM_THEFT):
            if !isBlocked(action.source):
                attemptTheft(action)
        
        # Step 6: Kills (THE CRITICAL STEP)
        killResults = []
        for action in pendingActions.where(type == KILL):
            if !isBlocked(action.source):
                result = processKill(action, protections)
                killResults.add(result)
        
        # Step 7: Report visits to observers
        for observer in rolesThatSeeVisits:
            sendVisitReport(observer, recordedVisits)
        
        # Step 8: Pass items
        for action in pendingActions.where(type == ITEM_PASS):
            transferItem(action.source, action.target, action.item)
        
        # Step 9: Swap identities (Shapeshifter)
        for action in pendingActions.where(type == IDENTITY_SWAP):
            swapIdentities(action.source, action.target)
        
        # Step 10: Report kills
        for result in killResults:
            if result.playerDied:
                broadcastDeath(result.target, result.revealedRole)
        
        # Step 11: Report revives
        for action in pendingActions.where(type == REVIVE):
            processRevive(action)
    
    function processKill(killAction, activeProtections):
        target = killAction.target
        
        # Check if target has active protections
        if activeProtections[target].length > 0:
            protection = activeProtections[target].shift()
            protection.onTrigger(killAction.source)
            return KillResult(survived: true, protectionUsed: protection)
        
        # No protection: target dies
        target.isAlive = false
        target.deathCause = killAction.source.role
        
        # Trigger killer on-success effects
        killAction.source.onKillSuccess(target)
        
        return KillResult(
            playerDied: true,
            target: target,
            attributedTo: killAction.source,
            revealedRole: config.hideRolesOnDeath ? null : target.role
        )
    
    function checkWinConditions():
        wolvesAlive = alivePlayers.where(faction == WOLF)
        nonWolvesAlive = alivePlayers.where(faction != WOLF)
        
        # Check village win
        if wolvesAlive.length == 0:
            endGame(VILLAGE_WIN)
            return true
        
        # Check wolf win (parity)
        if wolvesAlive.length >= nonWolvesAlive.length:
            endGame(WEREWOLF_WIN)
            return true
        
        # Check neutral wins
        for player in alivePlayers.where(faction == NEUTRAL):
            if player.role.checkWinCondition():
                endGame(NEUTRAL_WIN, player)
                return true
        
        return false
    
    function checkDeadlock():
        # Count indecision rounds (no-lynch + no-kill)
        if noLynchOccurred && noKillOccurred:
            indecisionRounds++
        else:
            indecisionRounds = 0  # Reset counter
        
        if indecisionRounds >= meteorThreshold:
            transitionTo(METEOR_RESOLUTION)
    
    function processVotingPhase():
        if votingTimer.expired():
            transitionTo(VOTE_LOCK)
        
        # Check for majority-based early finalization
        if config.finalizeOnMajority:
            votes = tallyVotes()
            leadingCandidate = getLeadingCandidate(votes)
            requiredMajority = ceil(alivePlayers.length * config.majorityPercent)
            if votes[leadingCandidate] >= requiredMajority:
                transitionTo(EXECUTION)
    
    function tallyFinalVotes():
        votes = {}  # Map: player -> vote count
        for player in alivePlayers:
            if player.vote != null:
                votes[player.vote]++
        
        # Plurality voting (most votes wins)
        maxVotes = max(votes.values)
        leading = playersWith(votes, maxVotes)
        
        if leading.length == 1:
            lynchTarget = leading[0]
        else:
            # Tie resolution
            match config.tieBreaker:
                case RANDOM:      lynchTarget = randomChoice(leading)
                case MAYOR:       lynchTarget = mayor.breakTie(leading)
                case NO_KILL:     lynchTarget = null  # No one dies
    
    function executeLynchTarget():
        if lynchTarget != null:
            lynchTarget.isAlive = false
            lynchTarget.deathCause = LYNCH
            
            # Check for Hunter revenge
            if lynchTarget.role == HUNTER:
                hunterTarget = lynchTarget.selectRevengeTarget()
                if hunterTarget:
                    hunterTarget.isAlive = false
                    hunterTarget.deathCause = HUNTER_KILL
            
            broadcast(f"{lynchTarget.name} was lynched.")
            if !config.hideRolesOnDeath:
                broadcast(f"Their role was: {lynchTarget.role.name}")
```

---

## Information Reveal Rules (Dawn Announcement)

The Dawn Announcement phase controls exactly what information is public [^56^] [^47^]:

### Always Revealed
- Which players died during the night (by name)
- Whether "someone was saved" (Doctor/Protector successful save - no name revealed)

### Conditionally Revealed
- **Role reveal on death**: If enabled, dead player's role is shown to all
- **No-reveal mode**: Dead player's role is hidden
- **Partial reveal**: Only alignment shown (villager/wolf/neutral), not specific role

### Never Revealed
- Who the Werewolves targeted (unless Witch reveals it)
- Who the Doctor protected
- Who the Seer investigated
- Witch's poison usage
- Individual wolf identity (unless revealed through play)

### Hunter-Specific Reveal Timing
In no-reveal games, the Hunter creates a special case [^235^]:
- Moderator asks ALL "dead" Hunters at start of each night: "If you died, pick someone to kill"
- Uses thumbs-up/down to indicate whether Hunter actually died
- This preserves anonymity while allowing Hunter their revenge kill

---

## References

| Citation | Source | Key Content |
|----------|--------|-------------|
| [^28^] | werewolv.es How to Play | Night action types, identity swaps, roleblock mechanics |
| [^46^] | werewolv.es Night Action Order | 11-category resolution order with conflict rules |
| [^56^] | PlayWerewolf.co Rules | Complete rules, timing, day/night flow, role descriptions |
| [^70^] | Mafia.gg Wiki | Configurable timing (day 3-20, night 1-9), Vote Lock, deadlock prevention, phases table |
| [^73^] | Mafia (party game) - Wikipedia | Core game mechanics, win conditions, optional roles |
| [^103^] | Town of Salem Game Breakdown | Three-team win system, multiple possible winners |
| [^104^] | werewolv.es Shapeshifter | Identity swap mechanics, resolution timing |
| [^106^] | BotC Guide | Phase structure comparison, dead player engagement |
| [^153^] | Optimal Strategy in Werewolf | Game theoretic analysis of phase structure, parity |
| [^166^] | Language Agents for Werewolf | Night action prompt structure, action resolution timing |
| [^167^] | One Night Ultimate Werewolf NeurIPS | Night action order in ONUW, simultaneous resolution |
| [^170^] | RLereWolf Framework | Action validation, state transitions, action types per role |
| [^171^] | Werewolf Moderator Tool | Win condition checking after each elimination |
| [^181^] | Mafia.gg Deadlock Prevention | Meteor mechanic detailed explanation, strategic implications |
| [^183^] | Nakama Authoritative Multiplayer | Tick rate recommendations, match loop patterns |
| [^184^] | Learning to Vote Differently | Plurality vs approval voting, phase observation structure |
| [^209^] | Town of Salem Priority | 1-6 numeric priority system for night actions |
| [^212^] | Braingle Werewolf Rules | Majority voting, vote changing rules, win conditions |
| [^231^] | Mafia.gg Hosting Helper | Timer settings terminology, NKN1, hosting recommendations |
| [^233^] | Mafia.gg Update Notes | Game settings introduction, deadlock prevention config |
| [^235^] | Werewolf Dark Arts Hunter | Hunter mechanics, reveal vs no-reveal handling |
| [^243^] | Werewolf Game Wiki Hunter | Hunter variations, timing rules |
| [^251^] | Game Server Architecture | Server-authoritative loop, state machine pattern |
| [^254^] | State Pattern for Games | FSM implementation for game phases |
| [^256^] | Miller's Hollow Rulebook | Simultaneous death = draw, Witch timing, Cupid/Lovers |
| [^258^] | Werewolf Dark Arts Witch | Witch GM instructions, potion timing, FAQ |
| [^272^] | Seer Reveal Strategy | Seer reveal timing, meta considerations |
| [^275^] | State Machine Diagram | UML state diagram patterns, composite states |
| [^290^] | Bodyguard+Doctor Stacking | Protection overlap mechanics |
| [^292^] | Tick Rate Explained | Tick rate fundamentals for game servers |
| [^296^] | GameDev Tick Rate Thread | Turn-based tick rates (as low as 4/sec) |
