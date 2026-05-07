# Dimension 4: Comprehensive Role Design, Balance Framework & Meta Strategy Guide

## Table of Contents
1. [Core Role Specifications](#1-core-role-specifications)
2. [Extended Role Specifications](#2-extended-role-specifications)
3. [Role Balance Formula & Calculator](#3-role-balance-formula--calculator)
4. [Preset Setup Configurations](#4-preset-setup-configurations)
5. [Meta Strategy Guide Per Role](#5-meta-strategy-guide-per-role)
6. [Tells & Detection Patterns](#6-tells--detection-patterns)
7. [Open vs Semi-Open vs Closed Setups](#7-open-vs-semi-open-vs-closed-setups)
8. [AI-Structured Role Data (JSON)](#8-ai-structured-role-data-json)
9. [Design Principles for Creating New Roles](#9-design-principles-for-creating-new-roles)
10. [Role Synergy & Anti-Synergy Matrix](#10-role-synergy--anti-synergy-matrix)
11. [Source Citations](#11-source-citations)

---

## 1. Core Role Specifications

### 1.1 Villager (Vanilla)

| Attribute | Specification |
|-----------|--------------|
| **Faction** | Village (Uninformed Majority) |
| **Ability** | None. Participates in daytime discussion and voting only. |
| **Night Action** | None |
| **Information Access** | No special information. Must deduce from discussion, voting patterns, and revealed roles. |
| **Win Condition** | Eliminate all Werewolves |
| **Setup Weight** | +1 (Ultimate Werewolf character value) [^172^] |
| **AI Difficulty** | Low (no special actions to manage) |

**Role Description**: The backbone of the village. While individually weak, collectively they control the vote. Can be used for fake claims to draw wolf attention. About 70-75% of players in a standard setup should be villagers or near-vanilla roles [^71^]. "Someone is speaking too much? Could mean they're a werewolf. Someone isn't speaking enough? Could mean the same thing" [^33^].

**Tells**: Quiet villagers may be mistaken for wolves; overly helpful villagers may be mistaken for power roles. The key is consistent, moderate participation.

---

### 1.2 Werewolf (Vanilla)

| Attribute | Specification |
|-----------|--------------|
| **Faction** | Werewolves (Informed Minority) |
| **Ability** | Meets with fellow wolves at night to select one victim to kill |
| **Night Action** | Choose one player to kill (jointly with other wolves) |
| **Information Access** | Knows all other wolves. Has perfect information about team composition. |
| **Win Condition** | Achieve numerical parity with villagers (equal or more wolves than villagers) |
| **Setup Weight** | -6 (Ultimate Werewolf character value) [^172^] |
| **AI Difficulty** | Medium (requires coordination with teammates and deception during day) |

**Role Description**: Typically 1 wolf per 3-4 villagers [^44^]. Must maintain consistent villager persona during day. "The wolves win if they kill enough villagers so the number of Werewolves equal the number of Villagers left" [^56^]. The werewolf team eliminates one player each night and wins when the number of Werewolves is equal to or greater than the number of players on the Villager team [^285^].

**Tells**: Over-coordination with other wolves, sudden shifts in argument, avoiding commitment on votes, defending fellow wolves too consistently.

---

### 1.3 Seer / Detective / Sheriff

| Attribute | Specification |
|-----------|--------------|
| **Faction** | Village |
| **Ability** | Can investigate one player per night to learn their alignment (werewolf or not) |
| **Night Action** | Select one player to investigate; moderator indicates wolf/non-wolf |
| **Information Access** | Most powerful information role. Gets confirmed alignment reads each night. |
| **Win Condition** | Village wins by eliminating all wolves |
| **Setup Weight** | +7 (Ultimate Werewolf character value) [^172^] |
| **AI Difficulty** | High (must balance information revelation with self-preservation) |

**Role Description**: The primary wolf target at night. Must balance revealing information (helps village) with self-preservation (revealing = target) [^18^]. The Seer should "make your peace with the idea that you're not going to live to see the end of the game. Your task is to give the village enough solid information to go on" [^283^].

**Key Mechanics**:
- Seer results are typically "wolf" or "not wolf" (not exact role)
- In some variants, Seer learns exact role [^75^]
- Alpha Werewolf appears innocent to Seer [^16^]
- Miller (if present) appears guilty despite being village-aligned [^16^]

**Tells**: Seers often subtly guide discussion toward their checked players. May be more confident about certain players being innocent. Wolves fake-claiming Seer tend to give "checks" that can't be easily verified.

---

### 1.4 Doctor / Protector / Bodyguard

| Attribute | Specification |
|-----------|--------------|
| **Faction** | Village |
| **Ability** | Can protect one player from night kill each night |
| **Night Action** | Select one player to protect from werewolf kill |
| **Information Access** | Knows who they protected, but not alignment of target |
| **Win Condition** | Village wins by eliminating all wolves |
| **Setup Weight** | +3 (Ultimate Werewolf character value) [^172^] |
| **AI Difficulty** | Medium-High (target selection is critical) |

**Role Description**: Critical for keeping the Seer alive. Cannot typically protect the same target on successive nights [^16^]. The Doctor selects someone to heal; if the werewolves chose to kill that person, they survive [^287^]. Some variants allow self-protection once [^273^].

**Protection Priority Heuristic**:
1. Night 1: Self-protect (to survive and continue protecting) or protect likely Seer target
2. Night 2+: Protect revealed/claimed Seer or other high-value target
3. Late game: Protect confirmed villagers or power roles

**Tells**: May subtly hint at who they protected. Over-eager "who should I protect?" questions can reveal role.

---

### 1.5 Hunter / Vigilante

| Attribute | Specification |
|-----------|--------------|
| **Faction** | Village |
| **Ability** | When killed, may kill one other player (Hunter); or kill each night with limited ammo (Vigilante) |
| **Night Action** | None (reactive on death) or active kill (Vigilante variant) |
| **Information Access** | No special information |
| **Win Condition** | Village wins |
| **Setup Weight** | +3 (Ultimate Werewolf character value) [^172^] |
| **AI Difficulty** | Medium (timing of claim and kill target selection) |

**Role Description**: The Hunter, if killed by the Werewolves or lynched by the Townsfolk, can retaliate and eliminate any one other player with their dying breath [^227^]. The Vigilante can shoot up to three times at night but commits suicide the following night if they kill someone on the village team [^187^]. "The best Vigi is the silent Vigi" — should almost never claim early [^101^].

**Key Distinction**: Hunter's kill is reactive (on death); Vigilante's kill is proactive (each night) but risky.

**Tells**: Hunters tend to be more willing to die; may push for being lynched if they have a strong wolf read. Vigilantes may be more aggressive in day discussion.

---

### 1.6 Witch

| Attribute | Specification |
|-----------|--------------|
| **Faction** | Village |
| **Ability** | Has one healing potion and one poison potion, each usable once |
| **Night Action** | After wolves choose target, may use heal potion (save victim) and/or poison potion (kill any player) |
| **Information Access** | Sees who was killed by werewolves at night (informs healing decision) |
| **Win Condition** | Village wins by eliminating all wolves |
| **Setup Weight** | +5 (Ultimate Werewolf character value) [^172^] |
| **AI Difficulty** | Very High (two game-changing decisions; information management) |

**Role Description**: Extremely powerful. The moderator wakes the Witch separately: "The Witch brings someone back to life" and "The Witch poisons someone" [^33^] [^228^]. The Witch kill potion bypasses Doctor protection — no one can save the target [^225^]. Both potions can be used on the same night or different nights [^225^].

**Healing Strategy**:
- Night 1 heal guarantees at least one player is saved through the game [^229^]
- Don't panic-heal; save for when losing a player would be devastating [^225^]
- Using heal early clears at least one player as innocent [^229^]
- If wolves could take numerical advantage, consider healing [^229^]

**Poison Strategy**:
- Poisoning on Night 1 is statistically unlikely to hit a wolf — forbidden in competitive games [^229^]
- Late-game poison is especially powerful for killing last wolf [^225^]
- Wait until you have strong reads; wrong poison is worse than unused poison [^225^]

**Tells**: Witch has privileged information about wolf target. "Claiming 'he was the only one saved last night' is unknowable to anyone but the Witch" [^96^]. Revealing this information outs the Witch.

---

## 2. Extended Role Specifications

### 2.1 Mason / Three Brothers

| Attribute | Specification |
|-----------|--------------|
| **Faction** | Village |
| **Ability** | Knows the identity of other Masons from the start of the game |
| **Night Action** | None (information granted at game start) |
| **Information Access** | Confirmed good teammates (unless one is corrupted) |
| **Win Condition** | Village wins |
| **Setup Weight** | +2 to +3 per pair (estimated from KSBG values) |
| **AI Difficulty** | Low-Medium (trust network management) |

**Role Description**: Creates a trusted subgroup within the village. "These cards are ideal for large groups, as it creates a sub-group of villagers who surely already knew each other" [^25^]. Masons should confirm each other early to establish trust and narrow down who could be werewolves [^276^]. In One Night Ultimate Werewolf, Masons know each other is on the Village team [^276^]. Two Masons are typically included together.

**Strategy**: Masons form a voting bloc. They can trust each other's reads and coordinate during day. Danger: if one Mason is converted or corrupted, the entire trust network collapses.

**Wolf Counterplay**: Wolves can fake Mason claims if no real Mason contradicts them. Two wolves can claim Mason and back each other up [^282^].

---

### 2.2 Alpha Werewolf / Godfather

| Attribute | Specification |
|-----------|--------------|
| **Faction** | Werewolves |
| **Ability** | Appears innocent to Seer investigations despite being a werewolf |
| **Night Action** | Participates in wolf kill selection |
| **Information Access** | Full wolf team knowledge |
| **Win Condition** | Wolf parity |
| **Setup Weight** | -2 to -3 (estimated, stronger than vanilla wolf) |
| **AI Difficulty** | Medium (can be bolder due to Seer immunity) |

**Role Description**: The Alpha Werewolf appears innocent (shows as villager/not wolf) to Seer investigations [^16^]. In Ultimate Werewolf, the Alpha Wolf has the "additional burden of saying the word 'Werewolf' at least once during the day" [^33^]. The Godfather variant "appears innocent despite being the Mafia leader" [^16^]. These roles create essential counterplay space against the Seer.

**Strategic Value**: Enables wolves to survive Seer investigations. An Alpha who gets "cleared" by a Seer can become a trusted village leader. The Alpha can afford to be more visible and aggressive.

**Counterplay**: Villagers should be suspicious of "too clean" players. Multiple Seer checks or cross-referencing behavior with claims can catch an Alpha.

---

### 2.3 Shapeshifter

| Attribute | Specification |
|-----------|--------------|
| **Faction** | Werewolves |
| **Ability** | Single-use ability to swap identities with a victim of the werewolves |
| **Night Action** | Participates in wolf kill; may activate identity swap (resolves last in night order) |
| **Information Access** | Full wolf team knowledge; after shifting, appears as villager to others |
| **Win Condition** | Wolf parity |
| **Setup Weight** | -4 (estimated; very powerful swing role) |
| **AI Difficulty** | High (timing of shift is critical) |

**Role Description**: "The Shapeshifter is a powerful werewolf, able to turn the tide of an otherwise hopelessly lost game" [^104^]. The identity swap happens last in night action resolution [^28^]. After shifting, the Shapeshifter appears to have died but actually assumes the dead villager's identity — the rest of the game sees that the Shapeshifter has died, but in truth they have assumed the identity of the dead villager [^104^].

**Optimal Timing**: Use shift when (1) a high-trust villager is killed, (2) the wolves are losing and need a deep-cover agent, or (3) the village is close to solving the wolf team and needs disruption.

**Counterplay**: Watch for players who reference the wrong identity (indicating a shift occurred). Be suspicious of players who seem "too confident" about their survival after a known Shapeshifter death.

---

### 2.4 Minion / Sorceress / Devil

| Attribute | Specification |
|-----------|--------------|
| **Faction** | Werewolf-aligned helper (may not be a wolf themselves) |
| **Ability** | Varies: knows wolf team (Minion), detects Seers (Sorceress), or has Seer-like power (Devil) |
| **Night Action** | Varies by variant |
| **Information Access** | Minion: knows all wolves; Sorceress: learns if target is Seer; Devil: investigates alignment like Seer but doesn't know wolves |
| **Win Condition** | Werewolf team wins |
| **Setup Weight** | -2 to -3 (estimated) |
| **AI Difficulty** | Medium-High (must help wolves without revealing connection) |

**Role Variants**:
- **Minion**: Starts the game knowing which players are Werewolves but does not participate in night kill [^285^]. Counts as villager for parity. Wins with wolves.
- **Sorceress**: Investigates one player per night and learns only if they are the Seer (not general alignment) [^57^]. Provides counter-intel without adding to wolf parity count.
- **Devil**: Has the same powers as the Seer but is on the werewolf team. Does not initially know who the werewolves are, nor do they know who she is [^47^]. Counts as neither wolf nor villager for victory purposes [^47^].

**Strategy**: The Minion can openly help wolves while appearing villager. Best played by pushing village toward wrong targets while maintaining plausible deniability. The Sorceress finds the Seer so wolves can eliminate them.

---

### 2.5 Serial Killer

| Attribute | Specification |
|-----------|--------------|
| **Faction** | Solo (Third-Party / Neutral Killing) |
| **Ability** | Kills one player per night independently of wolves |
| **Night Action** | Select one player to kill |
| **Information Access** | No team knowledge; operates alone |
| **Win Condition** | Be the last player alive |
| **Setup Weight** | -4 to -5 (estimated; adds second kill source) |
| **AI Difficulty** | Very High (must balance between wolves and village) |

**Role Description**: The Serial Killer's goal is to be the last player alive by killing one person per night. The Serial Killer cannot be killed by the Werewolves [^244^]. Must balance the ratio between Villagers and Werewolves — needs wolves around for distraction but must prevent wolf majority [^244^].

**Strategy**:
- Avoid killing Night 1 (might hit useful evil player or potential ally) [^244^]
- Kill confirmed good players early (informer roles that wolves aren't killing) [^244^]
- Prevent any team from gaining decisive majority
- Claim a provable role (Marksman, Witch) when pressured to buy time [^244^]
- Kill protective/information roles after Night 3 (Doctor, aura players) [^244^]
- In endgame with 1-2 villagers + 1 wolf + SK, claim SK — villagers may side with SK over wolf [^244^]

**Setup Impact**: Adding a Serial Killer effectively adds a second night kill source. The setup must compensate with additional villagers or protective roles. Wolves may need to be reduced by 1 when SK is present.

---

### 2.6 Tanner / Jester / Fool

| Attribute | Specification |
|-----------|--------------|
| **Faction** | Solo (Neutral) |
| **Ability** | None special |
| **Night Action** | None |
| **Information Access** | None |
| **Win Condition** | Get themselves voted out during the day (varies by exact variant) |
| **Setup Weight** | -1 to -2 (slightly favors wolves by distracting village) |
| **AI Difficulty** | Medium (must appear suspicious enough to be voted but not too obvious) |

**Role Variants**:
- **Fool**: "The game immediately ends with you as the winner if you are voted out during the day. You cannot otherwise win this game" [^245^]. Seen as villager by Seer. If voted, any lovers they have do not win.
- **Jester**: "If the jester is voted out during the day, they receive an individual win. Unlike the fool, the game will continue on after the jester is voted out" [^246^]. Others can still win alongside.
- **Tanner (One Night Ultimate Werewolf)**: "Only wins if he dies. If he does win, the Werewolves cannot win" [^247^]. In ONUW, Tanner being in play dramatically changes village calculations.

**Strategy**: The Fool/Jester must appear suspicious enough to attract votes but not so obvious that the village recognizes the gambit. Should act "slightly off" — ask strange questions, make inconsistent statements, vote unusually. Wolves should generally avoid killing the Fool (wastes a night kill and denies village a mislynch target) [^220^].

**Setup Impact**: Adding a Fool/Jester gives wolves a free mislynch target (the village may waste a vote on the Fool). Slightly wolf-favorable. Compensate by adding 1 village-friendly role or reducing wolf count.

---

## 3. Role Balance Formula & Calculator

### 3.1 Academic Balance Formula

Research formalizes game balance as:

**`b = 1 - |2 * p_imp - 1|`**

Where:
- `b` = balance index (1 = perfect balance, 0 = completely one-sided)
- `p_imp` = probability of the "important" faction winning (typically villagers)

At perfect balance, `p_imp = 0.5`, so `b = 1 - |2(0.5) - 1| = 1 - 0 = 1`.

In 90,720-game experiments, homogeneous play achieved 0.978 balance while team-aware mode dropped to 0.602, showing that "additional information and strategic complexity systematically reduce balance" [^14^].

### 3.2 Ultimate Werewolf Weighting System

Ultimate Werewolf cards carry **+/- weightings** "which indicates the extent to which their inclusion favours the villagers or the wolves" [^48^] [^252^].

**Character Value Table (from KSBG Werewolves edition)** [^172^]:

| Role | Character Value |
|------|----------------|
| Villager | +1 |
| Seer | +7 |
| Healer/Doctor | +3 |
| Witch | +5 |
| Hunter | +3 |
| Mayor | +2 |
| Red Riding Hood | +3 |
| Cupid | -2 (helps wolves despite village win condition) |
| Werewolf | -6 |

**Balance Rule**: "The sum of the character values should be close to 0" [^172^]. A positive total favors villagers; a negative total favors werewolves.

**The Moderator App Deck Builder** uses four attributes [^252^]:
1. **Balance** — Sum of numbers printed on bottom left of each card
2. **Difficulty** — How hard to moderate (more roles = higher difficulty)
3. **Length** — Shorter games have more elimination roles; longer games have more protection
4. **Info** — How much information is available to village (fence post cracks indicator)

### 3.3 Villager-to-Werewolf Ratio Guidelines

**Primary Rule**: The classic villager:werewolf ratio is **approximately 3:1** [^44^] [^50^].

| Setup Type | Ratio | Example (8p) | Notes |
|------------|-------|-------------|-------|
| Role reveal ON death | 3:1 | 6 villagers, 2 wolves | Standard baseline |
| Role reveal OFF death | 4:1 to 5:1 | 7 villagers, 1-2 wolves | No reveal removes major intel source |
| With strong village roles | 3.5:1 | 5 villagers + Seer + Doctor, 2 wolves | Intel compensates for lower ratio |
| Mountainous (no roles) | 2:1 to 3:1 | 5-6 villagers, 2-3 wolves | Pure number/vote balance |

**Mathematical Model**: If balance is (wolves, villagers) = (a, 2a), the next day's balance is either (a-1, 2a-1) if a wolf is lynched, or (a, 2a-2) if a villager is lynched [^50^]. This recursive model helps predict game trajectory.

**BoardGameGeek recommendation**: "wolves:villagers:specials ratio around 1:2:1 or 1:3:1" [^53^].

**Andrew Plotkin's recommendation**: Exactly two mafiosi regardless of player count [^73^].

**Davidoff's original rules**: Approximately one-third of players as mafiosi [^73^].

### 3.4 Setup Balance Calculator (Practical Formula)

```
SETUP_BALANCE_SCORE = sum(role_weights) + ratio_adjustment + info_adjustment

Where:
  role_weights = sum of each role's UW character value
  ratio_adjustment = +1 per extra villager above 3:1, -1 per missing villager below 3:1
  info_adjustment = -1 per intel role, +1 per counter-intel role, -2 per reveal-on-death

Target: Score between -2 and +2 for balanced game
```

**Feedback-Direct Intel Inverse Proportion Principle**: "As a general rule, feedback and direct intel checks should be inversely proportional. If you give the village strong, clean feedback, you usually need less direct intel on top of that" [^31^].

**Information Sources in Balance**:
- **Direct Intel**: Seer checks, Mason knowledge, Sorceress scans
- **Feedback**: Role reveal on death, claim contradictions, protection confirmation, voting patterns
- Village needs sufficient total information — the mix of sources matters less than the total [^31^]

---

## 4. Preset Setup Configurations

### 4.1 Configuration Table

| Preset | Players | Villagers | Werewolves | Special Roles | Total Weight | Difficulty | Notes |
|--------|---------|-----------|------------|---------------|--------------|------------|-------|
| **Classic (8p)** | 8 | 4 | 2 | Seer, Doctor | ~+3 | Beginner | Baseline 3:1 ratio |
| **Standard (12p)** | 12 | 4 | 3-4 | Seer, Witch, Hunter, Masons | ~+2 to +4 | Intermediate | Standard competitive setup |
| **Large (16p)** | 16 | 6-7 | 4-5 | Seer, Doctor, Witch, Hunter, Masons, Minion | ~0 to +3 | Advanced | Multiple information axes |

### 4.2 Detailed Presets

#### Classic (8 Players) — Beginner-Friendly
```
Village: 4 Villagers, 1 Seer, 1 Doctor
Wolves: 2 Werewolves
Weight: 4(+1) + 7 + 3 + 2(-6) = +4 + 10 - 12 = +2 (slight village favor)
```
**Recommended**: Role reveal ON death. This gives the village a strong intel engine to compensate for the slight weight advantage.

#### Standard (12 Players) — Competitive
Based on BoardGames.SE recommendation [^50^]:
```
Village: 4 Villagers, 1 Seer, 1 Witch, 1 Hunter, 1 Cupid
Wolves: 4 Werewolves
Weight: 4(+1) + 7 + 5 + 3 + (-2) + 4(-6) = +4 + 15 - 2 - 24 = -7
```
Note: This setup is wolf-heavy. Adjust by reducing wolves to 3 (weight: +4+15-2-18 = -1) or adding a Mason pair (+2 more).

**Balanced 12p Standard**:
```
Village: 4 Villagers, 1 Seer, 1 Witch, 1 Hunter, 1 Mason pair
Wolves: 3 Werewolves, 1 Minion
Weight: +4 + 7 + 5 + 3 + 3 + 3(-6) + (-3) = +22 - 18 - 3 = +1
```

#### Large (16 Players) — Advanced
```
Village: 5 Villagers, 1 Seer, 1 Doctor, 1 Witch, 1 Hunter, 1 Mason pair
Wolves: 3 Werewolves, 1 Alpha Werewolf, 1 Minion
Third-Party: 1 Tanner/Fool (optional)
Weight: +5 + 7 + 3 + 5 + 3 + 3 + 3(-6) + (-3) + (-3) + (-1) = +26 - 18 - 6 - 1 = +1
```

### 4.3 Setup Variants by Experience Level

| Level | Recommended Setup Characteristics |
|-------|-----------------------------------|
| **Beginner** | Reveal on death, 3:1 ratio, Seer + Doctor, no third-party |
| **Intermediate** | Reveal on death, 3.5:1 ratio, add Witch/Hunter, optional Masons |
| **Advanced** | Semi-open, 4:1 ratio, multiple power roles, add Minion/Sorceress |
| **Expert** | Closed setup, 4:1 ratio, include Shapeshifter, optional third-party |

### 4.4 Minimum Viable Player Counts

- **7 players**: Absolute minimum for "classic" werewolf; wolves have no kill on Night 1 [^44^]
- **5-6 players**: Better suited for The Resistance/Avalon [^53^]
- **8+ players**: Full werewolf experience with meaningful role distribution

---

## 5. Meta Strategy Guide Per Role

### 5.1 Seer — Reveal Timing Decision Tree

The Seer's most critical decision is when to reveal. This depends entirely on the local **meta** [^102^] [^168^] [^283^].

**Reveal Immediately (Day 1)** — Jane McGonigal Protocol [^169^]:
1. Healer must heal self Night 1
2. Seer must reveal Day 1 immediately (werewolves have only 1/9 or 1/10 chance of randomly hitting Seer Night 1)
3. Village accepts Seer as leader
4. Healer protects Seer every night
5. Seer reveals findings daily
6. Village reorganizes seating: investigated players sit with Seer

**Pros**: Maximum information sharing; Seer protected; village has clear leader
**Cons**: Wolves may not kill revealed Seer (to discredit them); fake-claim wars; one-dimensional gameplay

**Reveal When Counterclaimed** [^168^]:
- If a fake Seer claims, the real Seer should counterclaim
- Outcome is almost always: Seer dies + fake Seer dies (1-for-1 trade, acceptable for village)
- Three possibilities: real Seer lynched (fake dies next), fake dies (real dies next night), or neither is lynched (village evaluates both)

**Reveal When On the Chopping Block**: Seer claims to avoid being lynched. Risky but can produce a counterclaim that exposes a wolf.

**Reveal Never (Silent Seer)**: Check players and relay information through a trusted proxy (seer-safe) [^99^]. "The seer-safe should lead the village; this will at least make it more annoying for wolves to try to figure out the seer" [^99^]. Best when Doctor protection is unreliable.

**Optimal Check Priority** [^283^]:
1. Check players likely to survive until you reveal (not vocal/strong players who attract night kills)
2. Avoid checking players who typically die early in your group
3. Check players whose alignment information will matter when you reveal
4. In digital play, avoid obvious avatars that wolves target

### 5.2 Doctor — Protection Target Selection

**Night 1 Priority**:
- **Self-protect**: Guarantees Doctor survives to protect later (especially important if no other protection exists) [^169^]
- **Protect likely Seer**: If Seer can be identified by behavior, protection ensures continued intel
- Random protection on a non-vocal player (who wolves may target for being "under the radar")

**Mid-Game Priority**:
1. Revealed/claimed Seer (highest value target)
2. Confirmed power roles
3. Players whose survival is critical for village voting majority

**Late-Game Priority**:
1. Confirmed villagers (protect voting power)
2. Self-protect if you're the last power role

**Key Principle**: "The Doctor must heal the Seer every single night, no matter what" in reveal-on-Day-1 metas [^169^]. In standard metas, vary protection targets to avoid being predictable.

### 5.3 Werewolf — Advanced Team Strategy

**Golden Rule**: "Don't jump on a fellow wolf's bandwagon unless it's very likely to clear you" [^52^].

**Night Kill Priority** (from most to least important) [^220^]:
1. **Information roles**: Seer, Sheriff, Spirit Seer (but only if unprotected)
2. **Protective roles**: Doctor, Bodyguard, Witch (after they've used abilities)
3. **Killing roles**: Vigilante, Jailer, Hunter
4. **Medium/Ritualist** (can communicate with dead — dangerous in info-rich games)
5. **Villagers who are "too right"** (receiving Seer intel or making accurate reads)

**Leave Alive** (wolf strategy) [^220^]:
- Cupid (may have coupled a wolf; harmless otherwise)
- Admirer (doesn't count toward wolf win condition; potential ally)
- Random Voting roles (Fool, Headhunter — cause village distraction)
- Game-throwing players (harm village more than wolves)
- Werewolf Fan (already on your team)

**Bandwagon Strategy**: Wolves should "virtually ignore several of the players in the game" [^52^]. After death, silence on ignored players incriminates them. Pick one consensus wagon to push and ignore the other.

**The Bus** (Sacrificing a Wolf Partner): When a wolf partner is going to be eliminated, other wolves should flip to vote for them to "salvage personal credibility" [^96^]. "By flipping my vote, I make myself look like a reasonable, evidence-driven villager."

**Counterclaim Power Roles**: When a villager claims a power role under pressure, a wolf should counterclaim even with no heat: "You would certainly be believed and the power villager would be lynched. You have given your team an extra villager lynch for free" [^52^].

### 5.4 Hunter — Optimal Play

**When to Claim**: Almost never. "The best Vigi is the silent Vigi" [^101^]. The Hunter should only claim when:
1. About to be lynched (to threaten taking a wolf with them)
2. When a wolf fake-claims Hunter (counterclaim forces wolf exposure)
3. Endgame when the threat of a wolf + Hunter trade is decisive

**Kill Target Selection**: On death, prioritize:
1. Players with the most votes against you (likely wolves pushing your lynch)
2. Players with strong wolf reads from day discussion
3. Players who would be most damaging if they survive (confirmed wolves or strong wolf allies)

**Vigilante Variant**: Never shoot Night 1. Shoot when you have >70% confidence. If you kill a villager, you may die (guilt suicide in some variants) [^16^].

### 5.5 Witch — Potion Timing

**Heal Potion Decision Matrix**:

| Night | Situation | Decision |
|-------|-----------|----------|
| 1 | Unsure who to save | HOLD (saves potion for known power role) |
| 1 | Wolves target obvious Seer | HEAL (confirms Seer, gains village trust) |
| 2+ | Known power role targeted | HEAL immediately |
| 2+ | Unknown/random target | HOLD unless player count critical |
| Late | Village losing numbers | HEAL any villager to preserve voting power |

**Poison Potion Decision Matrix**:

| Confidence | Timing | Recommendation |
|------------|--------|----------------|
| High (>80%) | Early game | POISON (removes wolf before they do more damage) |
| High (>80%) | Late game | POISON (game-ending kill if it removes last wolf) |
| Medium (50-70%) | Any time | HOLD (wrong poison loses game) |
| Low (<50%) | Never | HOLD (statistically worse than random lynch) |

### 5.6 Villager — How to Contribute

**Critical Principle**: "Do not wait for a power role to start playing" [^230^]. Information comes from discussion, voting patterns, and behavioral analysis — not just night actions.

**Daily Actions**:
1. Ask targeted questions that force commitment
2. Track voting patterns (who votes with whom, when)
3. Build cases based on logic, not just "vibes"
4. Pressure quiet players to contribute
5. Challenge overconfident claims

**A Bad Argument Is Not the Same Thing as an Evil Argument** [^230^]: Evil has to convince the village to act against its own interests. Bad pushes and wrong cases happen from innocent players too. What matters is "whether the mistake fits the player, how they handle pushback, and whether their story stays coherent when pressure increases."

**Noise as Counter-Surveillance**: Everyone should talk to their neighbors to anonymize Seer communication [^279^]. If only the Seer talks privately, wolves can identify them.

### 5.7 Mason — Trust Network Management

**Strategy**:
1. Confirm each other early (Day 1 if safe)
2. Form voting bloc but don't be obvious about coordination
3. Share reads and coordinate who to pressure
4. One Mason can "sacrifice" credibility to defend the other
5. If no Mason claim is contradicted, wolves may have successfully faked Mason claims

**Danger**: Over-reliance on Mason trust. Wolves can exploit Mason confirmation to push mislynches through a trusted channel.

### 5.8 Alpha Werewolf — Bold Play Guide

The Alpha can play more aggressively because:
- Seer immunity means you survive the most common detection method
- Can claim cleared status if "investigated"
- Should still avoid being too obvious (behavioral tells exist)

**Strategy**: Push for leadership positions. Volunteer for mayor/sheriff. Make bold reads that appear villager-like. The Alpha's greatest weapon is the village's trust.

### 5.9 Serial Killer — Balanced Killing

**Core Principle**: "Balance the ratio between the Villagers and Werewolves" [^244^]. The SK needs both teams to exist as distractions while slowly eliminating both.

**Kill Priority**:
1. Spirit Seer (finds you fastest)
2. Sheriff (watches proven players)
3. Confirmed good players (forces wolves to waste kills on uncertain targets)
4. Protective roles (removes village defense)

**Late Game**: If wolves are about to win, expose yourself strategically — "make the Village realize they eliminating you will grant the wolves the win" [^244^]. Force a three-way stalemate.

### 5.10 Tanner/Fool — Suicide-by-Village Tactics

**Goal**: Appear suspicious enough to be voted out, but not so obvious that the village recognizes the Fool gambit.

**Tactics**:
1. Ask slightly off-topic questions
2. Vote inconsistently (change votes frequently)
3. Make statements that contradict known facts slightly
4. Be overly defensive about minor accusations
5. Claim a power role poorly (obvious fake claim attracts votes)

**Wolf Interaction**: Wolves should avoid killing the Fool (wastes a night kill) [^220^]. If Seer reveals the Fool, the Fool may help wolves win by voting with them.

---

## 6. Tells & Detection Patterns

### 6.1 Hard Tells (High Reliability)

**Unknowable Information Claims**: Claiming to know information that the speaker's role could not possibly have access to. Described as "the unforgivable wolf error" [^96^]. Example: A wolf stated "he was the only one saved last night" — unknowable to anyone but the Witch [^96^].

**Self-Contradiction (Receipts)**: Comparing current statements with prior statements to find logical inconsistencies. Highly reliable in text-based play [^96^]. Example: A wolf claimed "I am the Seer" but was caught because "on D1 R2, Alice wrote: 'My second-best elimination, if not Liam, would be Eve.' A real Seer does not propose eliminating their N1 green as their second-best elim" [^96^].

**Policy Contradiction**: Violating a stated policy or behavior pattern in a way that reveals wolf motivation. Example: Katia "violated her stated policy and becomes the consensus elimination" — she had stated she would punish "follower" behavior but then "piled onto the consensus Liam read without adding new info" [^96^].

### 6.2 Soft Tells (Moderate Reliability)

**Synchronized Defense (Wolf Coordination)**: Two players consistently defending each other in an unnatural pattern. "When one is questioned, the other immediately rallies to protect them" [^75^]. Watch for "closed loop" voting patterns — "Charlie received only two votes — his own and Diana's. That is a closed loop" [^75^].

**Pause Frequency (Cognitive Load)**: Liars produce "longer and more frequent pauses in their speech" due to increased cognitive demands of maintaining a false narrative [^97^]. Moderate reliability in face-to-face/digital voice play. Not applicable to text-only platforms.

**Over-Coordination**: Two wolves voting together consistently in a way that creates a suspicious voting bloc. "Its predictable coordination collapses against methodical villagers who prioritize evidence over persuasion" [^75^].

**Quiet Player / Under the Radar (UTR)**: "Players who try not to attract attention to themselves. Can be done by posting little (Lurking), or by posting as much as other players but having few posts of game content. Often viewed as an evil tactic" [^110^]. However, new villagers may also be quiet.

### 6.3 Behavioral Tells by Role

| Tell | What It Suggests | Reliability |
|------|-----------------|-------------|
| Claims Seer immediately | Could be real Seer (in reveal meta) or wolf fake-claim | Context-dependent |
| Changes vote frequently | Could be Fool/Tanner, uncertain villager, or wolf bandwagoning | Low-Moderate |
| Defends specific player consistently | Wolf defending partner, Mason, or villager with genuine read | Moderate |
| Asks "who should I protect?" | Likely Doctor or protective role | Moderate |
| References wolf target knowledge | Likely Witch (or wolf who made an error) | High |
| Overly confident about specific reads | Could have Seer info, or wolf faking confidence | Context-dependent |
| Self-votes or asks to be voted | Likely Fool/Tanner, or frustrated villager | Moderate |

### 6.4 Digital-Specific Tells

**Typing Speed Patterns**: Wolves may pre-type responses or take longer to craft deceptive messages. Low-moderate reliability — highly dependent on individual habits.

**Claim Complexity**: Bluffers tend to "tell simpler stories with narrower vocabulary and more negative emotion words" [^104^]. Overly complex claims can also indicate a rehearsed wolf narrative.

**Follower Behavior on Votes**: Players who follow wagons without adding new information may be wolves trying to blend in. "If someone is being voted with no rhyme or reason... you should note who is voting with them, and throw suspicion on them for following the vote" [^99^].

---

## 7. Open vs Semi-Open vs Closed Setups

### 7.1 Definitions

| Setup Type | Role Information | Strategic Impact |
|------------|-----------------|------------------|
| **Open** | Numbers of each power role are known to all players | High process-of-elimination solving; limited bluffing space |
| **Semi-Open** | Only limited or tentative information about power roles is revealed | Moderate mystery with some anchoring; balanced approach |
| **Closed** | No role information is revealed | Maximum mystery and bluffing space; can feel swingy |

**From Wikipedia** [^73^]: "In an open setup, the numbers of each power role (e.g. militia) present in the game is known to the players, while in a closed setup, this information is not revealed, and in a semi-open setup, only limited or tentative information about the power roles is revealed."

### 7.2 Strategic Implications

**Open Setups**:
- Village can use process of elimination to narrow wolf claims
- Fake claims are riskier (village knows exactly which roles exist)
- Wolves must be more careful about counterclaiming
- Setup balance is more transparent and adjustable
- Recommended for competitive play and new groups

**Closed Setups**:
- Fake claims are more viable (village doesn't know what roles to expect)
- Greater paranoia and uncertainty
- Power roles may be accidentally lynched more often
- More swingy outcomes
- Recommended for experienced groups seeking fresh challenge

**Semi-Open Setups**:
- May reveal total number of power roles but not specific types
- Or reveal that "at least one protective role exists" without specifying Doctor/Bodyguard
- Balances mystery with some strategic anchor points
- Popular on platforms like werewolv.es [^44^]

### 7.3 Setup Design Recommendations

| Group Type | Recommended Setup | Rationale |
|------------|-------------------|-----------|
| New players | Open, reveal on death | Clear information; easier to learn |
| Intermediate | Semi-open, reveal on death | Some mystery; develops deduction skills |
| Expert | Closed or semi-open | Maximum deception; rewards reading ability |
| Competitive tournament | Open, reveal on death | Fairness and reproducibility |
| Casual fun | Closed, no reveal | Maximum chaos and surprise |

---

## 8. AI-Structured Role Data (JSON)

```json
{
  "schema_version": "1.0",
  "game_type": "werewolf",
  "role_definitions": [
    {
      "id": "villager",
      "name": "Villager",
      "faction": "village",
      "category": "core",
      "ability_type": "none",
      "night_action": false,
      "information_access": "none",
      "win_condition": "all_werewolves_eliminated",
      "setup_weight": +1,
      "max_per_game": 99,
      "ai_difficulty": "low",
      "ai_strategy": "participate_in_discussion, vote_logically, support_power_roles",
      "tells": ["inactivity_mistaken_for_wolf", "over_contribution_mistaken_for_power_role"],
      "synergy_with": ["seer", "mason", "hunter"],
      "anti_synergy_with": ["tanner"]
    },
    {
      "id": "werewolf",
      "name": "Werewolf",
      "faction": "werewolf",
      "category": "core",
      "ability_type": "factional_kill",
      "night_action": true,
      "night_action_target": "any_player",
      "night_action_joint": true,
      "information_access": "faction_members",
      "win_condition": "numerical_parity",
      "setup_weight": -6,
      "max_per_game": 99,
      "ai_difficulty": "medium",
      "ai_strategy": "coordinate_kills_with_team, maintain_villager_persona_day, bus_partner_when_necessary, avoid_over_coordination",
      "tells": ["synchronized_defense", "vote_following_without_contribution", "story_inconsistencies"],
      "kill_priority": ["seer", "doctor", "witch", "vigilante", "confirmed_villager"],
      "synergy_with": ["alpha_werewolf", "minion", "sorceress"],
      "anti_synergy_with": ["serial_killer"]
    },
    {
      "id": "seer",
      "name": "Seer",
      "faction": "village",
      "category": "core",
      "ability_type": "investigation",
      "night_action": true,
      "night_action_target": "any_player",
      "night_action_joint": false,
      "information_access": "alignment_check_result",
      "win_condition": "all_werewolves_eliminated",
      "setup_weight": +7,
      "max_per_game": 1,
      "ai_difficulty": "high",
      "ai_strategy": "check_longevity_players, evaluate_reveal_timing, use_proxy_communication, avoid_predictable_checks",
      "reveal_strategy": {
        "immediate": {"pros": ["max_info_sharing", "seer_protected"], "cons": ["wolves_may_not_kill_to_discredit", "fake_claim_wars"]},
        "when_counterclaimed": {"pros": ["exposes_wolf"], "cons": ["1_for_1_trade"]},
        "when_at_risk": {"pros": ["avoids_lynch"], "cons": ["may_be_dismissed_as_desperation"]},
        "never": {"pros": ["max_survival", "proxy_info"], "cons": ["info_dies_with_seer"]}
      },
      "synergy_with": ["doctor", "mason"],
      "anti_synergy_with": ["alpha_werewolf", "sorceress"]
    },
    {
      "id": "doctor",
      "name": "Doctor",
      "faction": "village",
      "category": "core",
      "ability_type": "protection",
      "night_action": true,
      "night_action_target": "any_player",
      "night_action_joint": false,
      "can_self_target": true,
      "consecutive_target_allowed": false,
      "information_access": "protection_target_only",
      "win_condition": "all_werewolves_eliminated",
      "setup_weight": +3,
      "max_per_game": 1,
      "ai_difficulty": "medium",
      "ai_strategy": "self_protect_night_1, protect_seer_when_known, vary_targets_to_avoid_predictability",
      "protection_priority": ["self", "seer", "confirmed_power_role", "confirmed_villager"],
      "synergy_with": ["seer", "witch"],
      "anti_synergy_with": ["serial_killer"]
    },
    {
      "id": "hunter",
      "name": "Hunter",
      "faction": "village",
      "category": "core",
      "ability_type": "revenge_kill",
      "night_action": false,
      "reaction_action": true,
      "trigger": "on_death",
      "information_access": "none",
      "win_condition": "all_werewolves_eliminated",
      "setup_weight": +3,
      "max_per_game": 1,
      "ai_difficulty": "medium",
      "ai_strategy": "never_claim_early, counterclaim_when_faked, kill_wolf_reads_on_death",
      "synergy_with": ["villager", "mason"],
      "anti_synergy_with": []
    },
    {
      "id": "witch",
      "name": "Witch",
      "faction": "village",
      "category": "core",
      "ability_type": "heal_and_kill",
      "night_action": true,
      "night_action_phases": 2,
      "heal_potions": 1,
      "kill_potions": 1,
      "information_access": "werewolf_target_each_night",
      "win_condition": "all_werewolves_eliminated",
      "setup_weight": +5,
      "max_per_game": 1,
      "ai_difficulty": "very_high",
      "ai_strategy": "hold_heal_for_power_role, poison_only_when_confident, leverage_target_knowledge_carefully",
      "heal_timing": {"early": "save_known_power_role", "mid": "preserve_village_numbers", "late": "any_villager"},
      "poison_timing": {"early": "avoid", "mid": "only_high_confidence", "late": "game_ending_kill"},
      "synergy_with": ["doctor", "seer"],
      "anti_synergy_with": ["serial_killer"]
    },
    {
      "id": "mason",
      "name": "Mason",
      "faction": "village",
      "category": "extended",
      "ability_type": "trust_network",
      "night_action": false,
      "information_at_start": "other_masons",
      "information_access": "confirmed_faction_members",
      "win_condition": "all_werewolves_eliminated",
      "setup_weight": +2,
      "min_per_game": 2,
      "max_per_game": 3,
      "ai_difficulty": "low",
      "ai_strategy": "confirm_early, form_voting_bloc, share_reads_without_over_coordination",
      "synergy_with": ["seer", "doctor"],
      "anti_synergy_with": ["sorceress"]
    },
    {
      "id": "alpha_werewolf",
      "name": "Alpha Werewolf",
      "faction": "werewolf",
      "category": "extended",
      "ability_type": "seer_immunity",
      "night_action": true,
      "night_action_joint": true,
      "seer_result": "innocent",
      "information_access": "faction_members",
      "win_condition": "numerical_parity",
      "setup_weight": -3,
      "max_per_game": 1,
      "ai_difficulty": "medium",
      "ai_strategy": "play_boldly_due_to_immunity, seek_leadership_positions, claim_cleared_status",
      "synergy_with": ["werewolf", "minion"],
      "anti_synergy_with": ["seer"]
    },
    {
      "id": "shapeshifter",
      "name": "Shapeshifter",
      "faction": "werewolf",
      "category": "extended",
      "ability_type": "identity_swap",
      "night_action": true,
      "night_action_joint": true,
      "swap_uses": 1,
      "swap_resolution": "last_in_night_order",
      "information_access": "faction_members",
      "win_condition": "numerical_parity",
      "setup_weight": -4,
      "max_per_game": 1,
      "ai_difficulty": "high",
      "ai_strategy": "swap_with_high_trust_victim, use_when_wolves_losing, avoid_referencing_wrong_identity",
      "synergy_with": ["werewolf"],
      "anti_synergy_with": ["seer"]
    },
    {
      "id": "minion",
      "name": "Minion",
      "faction": "werewolf",
      "category": "extended",
      "ability_type": "faction_knowledge",
      "night_action": false,
      "information_at_start": "all_werewolves",
      "counts_as_wolf_for_parity": false,
      "information_access": "faction_members",
      "win_condition": "werewolf_team_wins",
      "setup_weight": -2,
      "max_per_game": 1,
      "ai_difficulty": "medium",
      "ai_strategy": "help_wolves_openly_while_appearing_villager, push_mislynches_maintaining_plausible_deniability",
      "synergy_with": ["werewolf", "sorceress"],
      "anti_synergy_with": []
    },
    {
      "id": "serial_killer",
      "name": "Serial Killer",
      "faction": "solo",
      "category": "extended",
      "ability_type": "independent_kill",
      "night_action": true,
      "night_action_target": "any_player",
      "immune_to_wolf_kill": true,
      "information_access": "none",
      "win_condition": "last_player_alive",
      "setup_weight": -4,
      "max_per_game": 1,
      "ai_difficulty": "very_high",
      "ai_strategy": "balance_faction_kills, avoid_night_1_kill, kill_information_roles, create_three_way_stalemate",
      "kill_priority": ["spirit_seer", "sheriff", "confirmed_good", "protective_role"],
      "synergy_with": [],
      "anti_synergy_with": ["werewolf", "village"]
    },
    {
      "id": "tanner",
      "name": "Tanner",
      "faction": "solo",
      "category": "extended",
      "ability_type": "death_win",
      "night_action": false,
      "win_condition": "voted_out_during_day",
      "win_ends_game": true,
      "seer_result": "villager",
      "setup_weight": -1,
      "max_per_game": 1,
      "ai_difficulty": "medium",
      "ai_strategy": "appear_suspicious_but_not_obvious, vote_inconsistently, make_slightly_off_statements, claim_poorly",
      "synergy_with": ["werewolf"],
      "anti_synergy_with": ["village"]
    }
  ],
  "setup_templates": {
    "classic_8p": {
      "players": 8,
      "roles": {"villager": 4, "werewolf": 2, "seer": 1, "doctor": 1},
      "weight_total": +2,
      "reveal_on_death": true,
      "difficulty": "beginner"
    },
    "standard_12p": {
      "players": 12,
      "roles": {"villager": 4, "werewolf": 3, "seer": 1, "witch": 1, "hunter": 1, "mason": 2},
      "weight_total": +1,
      "reveal_on_death": true,
      "difficulty": "intermediate"
    },
    "large_16p": {
      "players": 16,
      "roles": {"villager": 5, "werewolf": 3, "alpha_werewolf": 1, "seer": 1, "doctor": 1, "witch": 1, "hunter": 1, "mason": 2, "minion": 1},
      "weight_total": +1,
      "reveal_on_death": true,
      "difficulty": "advanced"
    }
  },
  "balance_formula": {
    "academic": "b = 1 - |2 * p_imp - 1|",
    "uw_weighted": "sum(role_character_values) -> target 0",
    "ratio_guideline": "villagers:wolves = 3:1 (reveal on), 4:1 (reveal off)",
    "feedback_principle": "feedback_and_direct_intel_inversely_proportional"
  }
}
```

---

## 9. Design Principles for Creating New Roles

### 9.1 Role Taxonomy Framework

All social deduction roles can be classified along these dimensions:

**By Information Access**:
- **Perfect Information**: Knows full faction composition (Werewolf, Mason, Minion)
- **Partial Information**: Gets regular intel updates (Seer, Witch, Sorceress)
- **No Information**: Must deduce from discussion (Villager, Hunter, Tanner)

**By Ability Type** [^223^]:
- **Investigative**: Gathers information (Seer, Investigator, Lookout)
- **Protective**: Prevents deaths (Doctor, Bodyguard, Crusader)
- **Killing**: Causes deaths (Vigilante, Hunter, Serial Killer)
- **Roleblocking**: Prevents night actions (Escort, Bootlegger)
- **Manipulation**: Alters game state (Disguiser, Transporter, Witch)
- **Disruption**: Causes false information or confusion (Framer, Jester)

**By Faction Impact** (Blood on the Clocktower taxonomy) [^185^]:
- **Townsfolk (Good)**: Abilities benefit the good team — information gatherers, protectors
- **Outsider (Good)**: Abilities hinder the good team — falsely appear evil, cause self-harm
- **Minion (Evil)**: Abilities support the demon — deception, protection, disruption
- **Demon (Evil)**: The primary killer — central evil figure

### 9.2 Design Principles

**Principle 1: Every Role Needs a Counter**
- The Seer has the Alpha Werewolf (Seer immunity)
- The Doctor has roleblockers or multiple wolf kills
- Masons can be countered by wolf Mason-fakes
- "If you add something, ask what it strengthens. If you remove something, ask what it was quietly supporting before" [^31^]

**Principle 2: Information Should Be Hard-Won**
- Direct intel (Seer checks) should be limited in quantity or reliability
- Feedback (reveal on death, claim contradictions) should be the primary information source
- "A village that gets very little trustworthy information early will usually need more room to be wrong" [^31^]

**Principle 3: Avoid Auto-Confirm Mechanics**
- A role that can definitively prove itself removes all doubt (boring)
- Even Mason confirmation requires trust (could be faked)
- The best roles create *probabilistic* information, not *certain* information

**Principle 4: Swing Must Be Bounded**
- A single role should not determine the game outcome before Day 1 discussion
- The Witch has 2 potions (bounded); a "kill every night" role would be unbounded
- Maximum impact per role should be ~1-2 player eliminations worth of value

**Principle 5: Fun > Mathematical Perfection**
- "The point of balancing a game is not to produce a sterile 50/50 spreadsheet result. It is to create a game where both sides have room to play, where the information structure makes sense, and where the important decisions feel like they matter" [^31^]
- A 55:45 village:wolf win rate is generally considered ideal [^284^]

**Principle 6: Start Simple, Add Gradually**
- "If you are not sure whether a setup works, the safest answer is usually not to add another mechanic and hope for the best. It is usually to simplify" [^31^]
- Mountainous (no roles) is easiest to balance; each added role introduces more complexity
- Make one change at a time and observe effects before adding more

### 9.3 Role Creation Checklist

When designing a new role, answer these questions:

1. **What information does this role gain, and how reliable is it?**
2. **What is the maximum impact this role can have on the game?**
3. **What counterplay exists against this role?**
4. **Does this role have a natural counterbalance in the role pool?**
5. **How does this role change the village's optimal strategy?**
6. **How does this role change the wolves' optimal strategy?**
7. **Is this role fun to play as, fun to play against, and interesting to deduce?**
8. **Does this role create interesting decisions every turn, or is it autopilot?**

### 9.4 Common Design Pitfalls

| Pitfall | Example | Solution |
|---------|---------|----------|
| **Too powerful** | Seer that learns exact role + gets protection | Limit to alignment only; make protection separate role |
| **No counterplay** | Unstoppable night kill | Add protection, immunity, or conditional activation |
| **Autopilot** | Role that always does the same thing | Add limited uses, conditional activation, or player choice |
| **Anti-fun** | Role that eliminates a player before they act | Add save mechanics or delayed effects |
| **Information overload** | Too many information roles | Limit to 1-2 direct intel roles per game |
| **Solves too fast** | Seer + Alpha in same game = Alpha caught via process of elimination | Ensure alternative explanations exist |

---

## 10. Role Synergy & Anti-Synergy Matrix

### 10.1 Synergies (Roles That Work Well Together)

| Combination | Synergy Type | Effect |
|-------------|-------------|--------|
| Seer + Doctor | Protection + Intel | Doctor keeps Seer alive longer = more checks |
| Seer + Mason | Trusted Relay | Seer tells Mason who is innocent; Mason leads without exposing Seer |
| Witch + Doctor | Double Protection | Two layers of protection for critical roles |
| Mason + Mason | Trust Network | Confirmed voting bloc creates village anchor |
| Hunter + Villager | Bluf Target | Villager can fake Hunter claim to draw wolf attention |
| Alpha Wolf + Sorceress | Immunity + Seer Find | Alpha avoids detection while Sorceress finds the Seer |
| Minion + Wolf Team | Extra Vote + Intel | Minion adds voting power without adding to wolf parity |

### 10.2 Anti-Synergies (Roles That Conflict or Overlap)

| Combination | Conflict Type | Effect |
|-------------|--------------|--------|
| Seer + Alpha Werewolf | Counterplay | Seer reads Alpha as innocent — reduces Seer effectiveness |
| Doctor + Serial Killer | Protection Bypass | SK kill ignores Doctor protection |
| Witch + Doctor (heal) | Overlap | Both can save from wolf kill — redundant |
| Tanner + Village | Distraction | Tanner wants to be voted; village wants to vote wolves |
| Multiple Information Roles | Information Bloat | Too much clear info makes game solve too fast |
| Serial Killer + Werewolf | Kill Competition | Two kill sources can make game end too quickly |

### 10.3 Setup Adjustment Guidelines

When adding a role, adjust the setup using these compensations:

| Role Added | Compensate With | Reason |
|------------|----------------|--------|
| +Seer | +1 Werewolf OR -1 Villager + Alpha Wolf | Seer is very village-favorable |
| +Witch | +1 Werewolf OR -2 Villagers | Witch has two powerful potions |
| +Mason pair | +1 Werewolf OR -1 Villager | Confirmed trust bloc is strong |
| +Alpha Wolf | +1 Villager | Alpha removes Seer counterplay value |
| +Minion | No change needed (doesn't add kill) | Minion adds intel, not kill power |
| +Serial Killer | +2 Villagers OR +1 Doctor | SK adds second kill source |
| +Tanner/Fool | +1 Villager OR no change | Tanner is a distraction, not a threat |
| +Shapeshifter | +1 Villager | Shapeshifter creates deep-cover wolf |

---

## 11. Source Citations

| Citation | Source | Key Content |
|----------|--------|-------------|
| [^14^] | OpenReview - Multi-Agent Social Deduction | Balance formula b=1-\|2p_imp-1\|, 90K+ games |
| [^16^] | Mafia (party game) - Wikipedia Optional Roles | Detailed role descriptions (Doctor, Vigilante, Miller, Godfather) |
| [^25^] | Werewolves of Miller's Hollow Roles | Expansion roles (Brothers, Fool, Elder, Scapegoat) |
| [^28^] | werewolv.es How to Play | Day/night phases, anonymity, night actions |
| [^31^] | werewolv.es How to Balance | Feedback vs. direct intel balance theory |
| [^33^] | PlayWerewolf.co - Roles | Core roles, ratio recommendations |
| [^44^] | werewolv.es Setups | Villager:wolf ratio 3:1, setup guidelines |
| [^47^] | brenbarn.net Werewolf Rules | Devil role mechanics |
| [^48^] | Ultimate Werewolf Extreme Review | +/- card weightings, companion app |
| [^50^] | BoardGames.SE - 10-12 Player Setups | Mathematical balance model, standard 12p setup |
| [^52^] | TwoPlusTwo - Werewolf Strategy | Advanced wolf tactics, bandwagon analysis, bus strategy |
| [^53^] | BoardGameGeek - Villager/Wolf Ratio | 1:2:1 or 1:3:1 ratio recommendation |
| [^56^] | PlayWerewolf.co - Rules | Win condition definitions |
| [^57^] | Ultimate Werewolf Roles - Fandom | Comprehensive role list with descriptions |
| [^71^] | Role Assignment in Social Deduction | Assignment methods, balance best practices |
| [^73^] | Mafia (party game) - Wikipedia | History, core rules, open/semi-open/closed setups |
| [^96^] | Foaster.ai Werewolf Bench GitHub | Annotated competitive games, bus strategy, fake claims |
| [^97^] | PMC - Speech Timing and Deception | Pause frequency tells, vocal pitch study |
| [^99^] | Werewolf Wiki - Strategy | Villager/wolf strategy guides |
| [^101^] | Realms Beyond - TWG Strategy | Third-party roles, theory, wagon reading |
| [^102^] | BoardGames.SE - Seer Reveal Strategy | Meta-dependent strategy discussion |
| [^104^] | Werewolv.es - Shapeshifter Role | Identity swap mechanics |
| [^110^] | BGG Werewolf PBF Dictionary | Comprehensive werewolf terminology |
| [^169^] | Memories of a Dead Seer Blog | Jane McGonigal's Seer-reveal protocol |
| [^172^] | KSBG Werewolves Rulebook | Character values table (+/- weightings) |
| [^183^] | Ultimate Werewolf Rules School (YouTube) | Setup configurations by player count |
| [^185^] | BotC Character Types | Townsfolk/Outsider/Minion/Demon taxonomy |
| [^187^] | Ultimate Werewolf Deluxe Guide (YouTube) | Role list with abilities |
| [^225^] | The Witch Role Guide | Witch strategy, potion timing |
| [^227^] | Werewolves of Miller's Hollow Rulebook | Core role mechanics |
| [^229^] | Playing the Witch Guide | Witch healing/poison strategies |
| [^230^] | werewolv.es Strategy Guide | Village play, lying, endgame execution |
| [^244^] | Serial Killer Strategy (Wolvesville) | SK win conditions, kill priority, balance play |
| [^245^] | Fool - Werewolf Wiki | Fool win condition and mechanics |
| [^246^] | Jester - Werewolf Wiki | Jester win condition and mechanics |
| [^247^] | Tanner - One Night Wiki | Tanner mechanics in ONUW |
| [^252^] | UW Moderator App Quick Start | Deck builder, balance attributes |
| [^254^] | Reddit - Balancing Role Values | Role score balance discussion |
| [^272^] | Seer Strategy (Wolvesville) | Detailed Seer play guide |
| [^275^] | BoardGames.SE - Seer Reveal Timing | Meta-dependent reveal strategy |
| [^276^] | One Night Werewolf Roles Guide | Mason strategy tips |
| [^279^] | What Werewolf Teaches About Trust | Noise as counter-surveillance strategy |
| [^282^] | Werewolf Team Strategy (ONUW) | Mason fake claims, coordination |
| [^283^] | How to Play the Seer (werewolv.es) | Check priority, reveal timing |
| [^284^] | Arqade - How to Balance Werewolf | Role score systems, target 55:45 |
| [^285^] | Ultimate Werewolf at Miami U | Sorceress/Minion mechanics |
| [^287^] | How to Play Werewolf (Stellar Factory) | Standard day/night flow |

---

*Document compiled from 20+ independent web searches across role mechanics, balance theory, strategy guides, game design principles, and academic research. All findings include inline citations to original sources.*

*Total roles documented: 12 (6 core + 6 extended). Balance formulas: 2 (academic + practical). Preset configurations: 3. Meta strategies: 10 role-specific guides. AI-structured data: Complete JSON schema with all 12 roles.*
