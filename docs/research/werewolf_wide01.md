# Facet: Social Deduction Game Mechanics & Role Design

## Key Findings

- **Core Game Loop**: Social deduction games follow a strict day/night alternation where the informed minority (Werewolves/Mafia) kills covertly at night, and the uninformed majority debates and votes to eliminate suspects during the day [^1^]. The game was created in 1986 by Dmitry Davidoff, then a psychology student at Moscow State University [^73^].

- **Balance Formula**: The classic villager-to-werewolf ratio is approximately 3:1, meaning in an 8-player game, 2 would be werewolves [^44^]. A mathematical model shows: if the balance is (wolves, villagers) = (a, 2a), the next day's balance is either (a-1, 2a-1) if a wolf is lynched, or (a, 2a-2) if a villager is lynched [^50^]. For groups of 5-7 players, The Resistance is recommended as a better alternative [^53^].

- **Role Reveal Impact**: Revealing a player's true role on death is a "powerful intel engine for the village" and should be balanced by placing fewer intel-gathering roles or increasing werewolf count [^44^]. Without reveal, the ratio should lean toward 4:1 or even 5:1 [^44^].

- **Game Balance Index**: Academic research formalizes balance as `b = 1 - |2 * p_imp - 1|`, where `b = 1` at perfect balance (p_imp = 0.5) and decreases linearly to 0 as games become one-sided [^14^]. In 90,720-game experiments, homogeneous play achieved 0.978 balance while team-aware mode dropped to 0.602, showing that "additional information and strategic complexity systematically reduce balance" [^14^].

- **Seer Reveal Meta**: Whether a Seer should reveal on Day 1 depends entirely on the local "meta" — the accumulated expectations and play-styles of a particular group [^102^]. If the meta is "Seer always reveals first day," wolves will kill the revealed Seer first night, but then wolves might NOT kill the revealed Seer to discredit her, creating a metagame spiral [^102^].

- **Deception Detection in Humans**: Research shows human lie detection accuracy is approximately 54% — "ever so slightly better than guessing" (50% random) [^104^]. Training in non-verbal cues only improves detection by ~4% on average [^94^]. Speaker "transparency" (how much a person gives away) explains most accurate lie detection, not receiver skill [^94^].

- **Speech Timing Tells**: Ecologically valid studies of social deduction gameplay found that liars produce "longer and more frequent pauses in their speech" — consistent with cognitive load theory — but lying was NOT reliably associated with vocal pitch [^97^].

- **Blood on the Clocktower Innovation**: BotC differentiates itself through dead-player participation (ghost votes and continued discussion), massive information availability (typically 8+ separate information sources per game), active Storyteller role with misinformation authority, and explicit script-based role selection (22-25 characters per script) [^106^][^109^]. The game raised $573,621 on Kickstarter and sold over 30,000 copies by January 2024 [^107^].

- **Night Action Resolution Order**: The order in which night actions resolve critically affects gameplay. In werewolv.es, the order is: (1) Redirects, (2) Roleblocks, (3) Protection visits, (4) Most visits, (5) Item thefts, (6) Kills, (7) Report visits to Stalkers, (8) Passing of items, (9) Identity swaps, (10) Report kills, (11) Report revives [^46^]. One Night Ultimate Werewolf resolves roles in a strict predetermined order with a companion app [^43^].

- **Voting System Variants**: Standard Werewolf uses plurality voting (most votes wins, ties broken randomly) [^15^]. Academic research also explores dis&approval voting where players submit trinary ballots (+1 support, -1 accusation, 0 neutral), with ties broken randomly [^15^]. Blood on the Clocktower uses majority voting with ghost votes from dead players [^106^].

- **LLM Deception Capabilities**: State-of-the-art LLMs show diverse performance in social deception, with roughly half remaining below 0.50 in deception reasoning tasks, revealing "clear gaps in deception and counterfactual reasoning" [^17^]. MaKTO-14B achieved 74% overall win rate (70% as werewolves, 78% as villagers) against DeepSeek-14B models [^29^]. GPT-5 leads in werewolf ELO ratings with "true sweep capability" against weaker opponents [^75^].

- **Werewolf Arena Findings**: In the LLM benchmark environment, "all models, except GPT-3.5 achieved relatively balanced win rates (40-60%) in self-play, indicating a relatively balanced game setup where neither the Werewolf nor Villager roles had an inherent advantage" [^19^]. Gemini 1.5 Pro emerged as the strongest overall player, excelling especially as Villager [^19^].

- **Anonymous Play Mechanics**: Online platforms like werewolv.es assign each player "a random name and avatar from a theme" to allow anonymous play and "disconnect players from tells that could otherwise put them in a disadvantage" [^28^]. Divulging true identity outside faction night chat is against the rules [^28^].

- **Advanced Wolf Strategy**: Wolves should "virtually ignore several of the players in the game" and after death, "your silence will incriminate" players you ignored if they are still alive [^52^]. The "golden rule" for wolves: "Don't jump on a fellow wolf's bandwagon unless it's very likely to clear you" [^52^]. Counterclaiming power roles when not under heat is a high-value sacrifice: "You would certainly be believed and the power villager would be lynched...worth far more to your team than staying alive" [^52^].

- **Feedback vs. Direct Intel Balance**: "Feedback and direct intel checks should be inversely proportional" — if you give strong, clean feedback, you need less direct intel. A village with "very little trustworthy information early will usually need more room to be wrong" [^31^].

- **Town of Salem Model**: A 15-person online social deduction game with three teams (Mafia, Town, Neutral), each with unique win conditions — "you can have multiple winners, one winner, or no winners" [^103^]. Ranked mode uses predetermined roles and ELO rating system with 50-game minimum before participation [^74^].

- **Among Us Digital Adaptation**: Uses built-in text chat for meetings, imposters masquerade as crewmates while sabotaging, and crewmates perform maintenance tasks — adding "tasks" as a parallel information channel to social deduction [^54^]. The game saw explosive popularity during COVID-19 pandemic in 2020 [^54^].

- **Mafia.gg Platform Mechanics**: Day lengths configurable from 3-20 minutes (default 13), night lengths from 1-9 minutes (default 5), with Vote Lock period of 90 seconds where votes cannot be changed [^70^]. Includes "Deadlock Prevention" via meteor mechanic after 5-6 rounds of no-lynch/no-kill [^70^].

- **Role Weighting System**: Ultimate Werewolf cards carry +/- weightings "which indicates the extent to which their inclusion favours the villagers or the wolves," with the moderator encouraged to adjust to balance if one side is winning too many games [^48^].

- **Open/Semi-Open/Closed Setups**: In open setups, numbers of each power role are known; in closed setups, this is hidden; semi-open reveals only limited or tentative information [^73^]. This dramatically affects bluffing space and game complexity.

- **Shapeshifter Identity Swap**: A powerful werewolf role that can swap identities with a wolf kill victim — "the rest of the game will see that the Shapeshifter has died, but in truth, he has assumed the identity of the dead villager" [^104^]. This is resolved last in night action order, just before kills are reported [^28^].

---

## Roles Analysis (Detailed)

### Core Faction: Villagers (The Uninformed Majority)

**Villager (Vanilla)**
- **Abilities**: None. Participates in daytime discussion and voting only.
- **Information Access**: No special information. Must deduce from discussion, voting patterns, and revealed roles.
- **Win Condition**: Eliminate all Werewolves/Mafia.
- **Strategic Notes**: The backbone of the village. While individually weak, collectively they control the vote. Can be used for fake claims to draw wolf attention. About 70-75% of players in a standard setup [^71^]. "Someone is speaking too much? Could mean they're a werewolf. Someone isn't speaking enough? Could mean the same thing" [^33^].

**Seer / Detective / Sheriff**
- **Abilities**: Can investigate one player per night to learn their alignment (werewolf or not).
- **Information Access**: Most powerful information role. Gets confirmed alignment reads each night.
- **Win Condition**: Village wins by eliminating all wolves.
- **Strategic Notes**: The primary wolf target at night. Must balance revealing information (helps village) with self-preservation (revealing = target) [^18^]. If the meta is Seer-reveal-heavy, wolves may "fake-claim Seer in the hopes of drawing the Doctor's protection and creating confusion" [^102^]. The RL-ins agent trained for Werewolf found that "declaring itself as the Seer" is "the most commonly declared role by our agent" when bluffing as wolf [^24^].

**Doctor / Protector / Bodyguard**
- **Abilities**: Can protect one player from night kill each night. Cannot typically protect the same target on successive nights [^16^].
- **Information Access**: Knows who they protected, but not alignment of target.
- **Win Condition**: Village wins by eliminating all wolves.
- **Strategic Notes**: Critical for keeping the Seer alive. The Jailer variant also blocks the target's night action simultaneously [^16^]. In the MaKTO model gameplay, "Guard accurately protected the key Witch role" showing the importance of protection target selection [^29^].

**Witch**
- **Abilities**: Has one healing potion and one poison potion, each usable once. Healing can save from werewolf kill; poison kills a target [^33^].
- **Information Access**: Sees who was killed by werewolves at night (informs healing decision).
- **Win Condition**: Village wins by eliminating all wolves.
- **Strategic Notes**: Extremely powerful. The moderator wakes the Witch separately: "The Witch brings someone back to life" and "The Witch poisons someone" [^33^]. In competitive gameplay, "Witch used antidotes to save Player 7; did not use poison" on Night 1 shows conservative early play [^29^].

**Hunter / Vigilante / Bomb**
- **Abilities**: Can kill one other player when they die (Hunter) or kill every night (Vigilante). The Bomb triggers if targeted at night [^16^].
- **Information Access**: No special information.
- **Win Condition**: Village wins.
- **Strategic Notes**: The Vigilante's "ammunition is often limited" and killing an innocent may cause guilt suicide [^16^]. The Hunter should almost never claim — "the best Vigi is the silent Vigi" [^101^].

**Masons / Three Brothers**
- **Abilities**: Know each other's identities from the start of the game [^16^].
- **Information Access**: Confirmed good teammates (unless one is corrupted).
- **Win Condition**: Village wins.
- **Strategic Notes**: Creates a trusted subgroup within the village. "These cards are ideal for large groups, as it creates a sub-group of villagers who surely already knew each other" [^25^].

### Core Faction: Werewolves (The Informed Minority)

**Werewolf (Vanilla)**
- **Abilities**: Meets with fellow wolves at night to select one victim to kill.
- **Information Access**: Knows all other wolves. Has perfect information about team composition.
- **Win Condition**: Achieve numerical parity with villagers (equal number or more wolves than villagers).
- **Strategic Notes**: Typically 1 wolf per 3-4 villagers [^44^]. Must maintain consistent villager persona during day. "The wolves win if they kill enough villagers so the number of Werewolves equal the number of Villagers left" [^56^].

**Alpha Werewolf / Godfather**
- **Abilities**: Appears innocent to Seer investigations despite being a werewolf [^16^].
- **Information Access**: Full wolf team knowledge.
- **Win Condition**: Wolf parity.
- **Strategic Notes**: The Alpha Wolf in Ultimate Werewolf has the "additional burden of saying the word 'Werewolf' at least once during the day" [^33^]. The Godfather "appears innocent despite being the Mafia leader" [^16^]. These roles create counterplay space against the Seer.

**Shapeshifter**
- **Abilities**: Single-use ability to swap identities with a victim of the werewolves. Appears to have died but actually assumes the dead villager's identity [^104^].
- **Information Access**: Full wolf team knowledge. After shifting, appears as a villager to others.
- **Win Condition**: Wolf parity.
- **Strategic Notes**: "The Shapeshifter is a powerful werewolf, able to turn the tide of an otherwise hopelessly lost game" [^104^]. The identity swap happens last in night action resolution [^28^].

**Minion / Sorcerer / Devil**
- **Abilities**: Works with the wolves but may not have a night kill. The Sorcerer "only know[s] if you've found a werewolf, another seer, or something else" [^57^]. The Devil has "the same powers as the seer but is on the werewolf team" [^47^].
- **Information Access**: The Devil does not initially know who the werewolves are, nor do they know who she is [^47^].
- **Win Condition**: Werewolf team wins.
- **Strategic Notes**: The Devil counts as "neither a wolf nor a villager for victory purposes" [^47^]. The Sorcerer provides counter-intel to the wolf team without adding to wolf parity count.

### Alignment-Fooling Roles

**Miller**
- **Abilities**: An innocent who appears guilty to investigations (usually because they are an outsider) [^16^].
- **Information Access**: No special information.
- **Win Condition**: Village wins.
- **Strategic Notes**: Creates ambiguity in Seer results. "If you seer someone green and there's a Master Wolf in the game, you could wait until you get a second green seering and claim to both of them at the same time" [^101^].

### Neutral / Third-Party Roles

**Serial Killer**
- **Abilities**: Kills one player per night independently of wolves.
- **Information Access**: No team knowledge; operates alone.
- **Win Condition**: Be the last player alive.
- **Strategic Notes**: Solitary guilty party. The Psychiatrist can "cure" the Serial Killer in some variants [^16^]. In Town of Salem Ranked mode, Neutral Killing is one of the role slots [^74^].

**Tanner / Jester / Fool**
- **Abilities**: No special abilities.
- **Information Access**: None.
- **Win Condition**: Get themselves killed by the village (Tanner/Jester) or voted out and spared (Fool) [^25^][^57^].
- **Strategic Notes**: "You only win if you are killed" [^57^]. In Werewolves of Miller's Hollow, "If the foolish villager is chosen as the victim of the court of the village, it is revealed at the last moment, that he is just the fool of the village. The village spares his life, but now he has no more right to vote" [^25^].

**Cult Leader**
- **Abilities**: Each night, add a player to your cult [^57^].
- **Information Access**: Knows cult members.
- **Win Condition**: All remaining alive players are part of the cult.
- **Strategic Notes**: Creates a third faction. Highly disruptive to standard village/wolf dynamics.

**Traveller (Blood on the Clocktower)**
- **Abilities**: Can enter or leave the game at any point. Character is known but alignment is hidden [^107^].
- **Information Access**: Varies.
- **Win Condition**: Varies by traveller role.
- **Strategic Notes**: "Allows everyone to be included and gives them a chance to play. A handy mechanic if there's someone in your group who has outside commitments" [^109^].

### Blood on the Clocktower Role Categories

**Townsfolk (Good - Information gatherers)**
- Roles that gather information each night. Examples: Librarian, Investigator, Empath, Chef, Fortune Teller [^106^]. In a typical game with 9 Townsfolk, "that is usually 8 separate pieces of information" [^109^].

**Outsiders (Good - Disruptive to own team)**
- Good-aligned but with abilities that cause trouble. Examples: Recluse (may appear evil to investigations), Drunk (thinks they have an ability but don't), Saint (dies if executed) [^106^]. The Recluse "may appear evil to investigations, which will cause them to execute incorrectly" [^105^].

**Minions (Evil - Support)**
- Evil-aligned supporting roles. Examples: Poisoner, Spy, Scarlet Woman, Baron (adds Outsiders). The Poisoner "poisons" a player each night, causing their information to be false [^105^].

**Demon (Evil - The killer)**
- The central evil figure with a night kill. Examples: Imp (standard demon), Po (can choose not to kill to appear safe). The game ends when the Demon is executed [^105^].

---

## Metagame Strategies

### Seer-Claim Dueling (Counterclaiming)
- **Description**: When a fake Seer claims early, the real Seer must decide whether to counterclaim immediately or wait. Wolves use fake Seer claims to (a) draw protection from Doctor, (b) create confusion, or (c) get villagers to mislynch. The RL-ins agent "chose to declare itself as the Seer, which is the most commonly declared role by our agent" [^24^].
- **When to Use**: Wolves should fake-claim Seer when the real Seer is likely to stay hidden. The real Seer should counterclaim when the fake claim threatens to dominate the village narrative.
- **Counterplay**: The MaKTO models demonstrated that villagers can evaluate claims by checking consistency: "A real Seer does not propose eliminating their N1 green as their second-best elim" [^96^]. Receipt-based logic (tracking prior statements against current claims) is highly effective.

### Wolf Bandwagon Analysis
- **Description**: Wolves can "set people up by faking wolf-wolf interactions" [^52^]. If two villagers are being bandwagoned, a wolf should "pick one of them and make a case for them being a wolf. Ignore the other or act non-committal" [^52^]. After the wolf dies, their silence on the ignored player incriminates them.
- **When to Use**: Early-to-mid game when multiple villagers are under suspicion. Particularly effective when wolves can predict which villagers will look "clear" later.
- **Counterplay**: Villagers should track who is consistently pushing the same wagons and analyze whether they're building cases or just following. The MaKTO models "spot some humorous statements in the discussion period" and use them for deduction [^29^].

### The Bus (Sacrificing a Wolf Partner)
- **Description**: When a wolf partner is going to be eliminated anyway, other wolves should flip to vote for them to "salvage personal credibility." The reasoning: "This is a bus, and it's the only winning move. Katia is going to be eliminated no matter what... By flipping my vote, I make myself look like a reasonable, evidence-driven villager" [^96^].
- **When to Use**: When one wolf is consensus elimination and others can gain village trust by joining the vote.
- **Counterplay**: Villagers should examine whether the bus voters had prior suspicion on the eliminated wolf or conveniently "discovered" it only when elimination was certain.

### Fake-Claim Counterclaim (Power Role Sacrifice)
- **Description**: Wolves can counterclaim a power role when NOT under pressure to eliminate a genuine power player. "You would certainly be believed and the power villager would be lynched. You have given your team an extra villager lynch for free, and given them an extra night kill to work with as well" [^52^].
- **When to Use**: When a villager is about to be lynched and claims a power role. The wolf should counterclaim even with no heat on them.
- **Counterplay**: The village should cross-reference counterclaims with night-action resolution and test claims against actual game events.

### Quiet Player Strategy
- **Description**: Both wolves and villagers may stay quiet for different reasons. Wolves stay quiet to avoid drawing attention; villagers stay quiet because they have nothing to add. However, "someone isn't speaking enough? Could mean [they're] a werewolf" [^33^].
- **When to Use**: Wolves should ignore several players "virtually" to create incrimination chains after death [^52^].
- **Counterplay**: Inactivity rules — on werewolv.es, "players must cast a vote at least once every two days, and preferably vote each day. A player that fails to vote for two days in a row is smited" [^28^].

### Mayor/Leader Election
- **Description**: Some platforms and variants allow for a Mayor or Sheriff election who gets tie-breaking vote power. The wolves attempted "a high-leverage mayor kill" in one recorded game because "Taking him out now completely disrupts the village's plans and removes the tie-breaking vote" [^96^].
- **When to Use**: Villages should elect a confirmed or highly-trusted player as mayor. Wolves should target the mayor at night.
- **Counterplay**: The Seer checking the newly elected mayor early is "maximal EV" [^96^].

### Information Soft-Lock
- **Description**: The Seer privately confirms a trusted player (seer-safe) who then leads the village discussion. This creates a trusted information hub without exposing the Seer.
- **When to Use**: When the Seer finds a villager early and can privately communicate. In 6-player games, "the seer-safe should lead the village; this will at least make it more annoying for wolves to try to figure out the seer" [^99^].
- **Counterplay**: Wolves should watch for players who are "too right" about things and may be receiving Seer intel. "Remember how the wolves don't like to eat people leaving really obvious hints unless they are sure they are hitting the seer?" [^52^]

---

## Tells & Deception Patterns

### Verbal Tells

**Pause Frequency (Cognitive Load)**
- **Description**: Liars produce "longer and more frequent pauses in their speech" due to increased cognitive demands of maintaining a false narrative [^97^].
- **Reliability**: Moderate in face-to-face/digital voice play. Not applicable to text-only platforms.
- **Examples**: "When speakers chose to lie, they were prone to longer and more frequent pauses in their speech" [^97^].

**Vocal Pitch (Arousal)**
- **Description**: Contrary to popular belief, lying was "NOT reliably associated with vocal pitch" in ecologically valid studies [^97^]. This contradicts predictions that physiological arousal from lying increases laryngeal tension.
- **Reliability**: Low.

**Claim Complexity and Confidence**
- **Description**: Overly confident claims with specific details can indicate both genuine information (Seer with a read) and deception (wolf faking). Bluffers tend to "tell simpler stories with narrower vocabulary and more negative emotion words" [^104^].
- **Reliability**: Moderate. Must be evaluated in context.
- **Examples**: The RL-ins agent "declared that player 2 was not a Werewolf, instead of someone else being a Werewolf, which earned it support to resist questioning from others" [^24^].

**Self-Contradiction (Receipts)**
- **Description**: Comparing current statements with prior statements to find logical inconsistencies. Highly reliable in text-based play.
- **Reliability**: High.
- **Examples**: In competitive LLM play, a wolf claimed "I am the Seer" but was caught because "on D1 R2, Alice wrote: 'My second-best elimination, if not Liam, would be Eve.' A real Seer does not propose eliminating their N1 green as their second-best elim" [^96^].

**Unknowable Information Claims**
- **Description**: Claiming to know information that the speaker's role could not possibly have access to.
- **Reliability**: Very High.
- **Examples**: A wolf stated "he was the only one saved last night" which is "unknowable to anyone but the Witch" [^96^]. This is described as "the unforgivable wolf error." Similarly, Diana stated "The wolves targeted Oscar, so the Witch saved Oscar" — the first clause is "mechanics truth; the rest is fabricated/unknowable and outs a supposed target" [^96^].

### Behavioral Tells

**Synchronized Defense (Wolf Coordination)**
- **Description**: Two players consistently defending each other in an unnatural pattern. "When one is questioned, the other immediately rallies to protect them. That's not just alignment — it's synchronization" [^75^].
- **Reliability**: Moderate-High. Can also indicate genuine alliance.
- **Counterplay**: Watch for "closed loop" voting patterns — "Charlie received only two votes—his own and Diana's. That is a closed loop" [^75^].

**Policy Contradiction**
- **Description**: Violating a stated policy or behavior pattern in a way that reveals wolf motivation.
- **Reliability**: High.
- **Examples**: A wolf (Katia) "violated her stated policy and becomes the consensus elimination" — she had stated she would punish "follower" behavior but then "piled onto the consensus Liam read without adding new info" [^96^].

**Over-Coordination**
- **Description**: Two wolves voting together consistently in a way that creates a suspicious voting bloc. Grok-4 wolves showed this weakness: "its predictable coordination collapses against methodical villagers who prioritize evidence over persuasion" [^75^].
- **Reliability**: Moderate.

### Digital-Specific Tells

**Typing Speed Patterns**
- **Description**: In real-time chat, wolves may pre-type responses or take longer to craft deceptive messages.
- **Reliability**: Low-Moderate. Highly dependent on individual typing habits.

**Avatar/Identity Swap Exploitation**
- **Description**: On platforms with identity swapping (Shapeshifter), players may reference the wrong identity.
- **Reliability**: Moderate. Swaps "do not exchange any other characteristics of the players, including their factions, night chats, abilities, and statuses" but only swap visual identity [^28^].

**Follower Behavior on Votes**
- **Description**: Players who follow wagons without adding new information may be wolves trying to blend in. "If someone is being voted with no rhyme or reason... you should not follow the wagon. Instead, you should note who is voting with them, and throw suspicion on them for following the vote" [^99^].
- **Reliability**: Moderate.

---

## Major Players & Sources

- **werewolv.es**: Premier online Werewolf platform with anonymous play via random avatars/names, structured day/night phases, smite rules for inactivity, and sophisticated night action resolution order [^28^][^46^]. Active community with community-maintained wiki [^26^].

- **Town of Salem**: 15-player online social deduction game by BlankMediaGames. Three-team system (Town, Mafia, Neutral), ranked mode with ELO, 50-game minimum for ranked entry. Multiple game modes including Classic, Ranked, and All Any [^103^][^74^].

- **Mafia.gg**: Online Mafia platform with highly configurable settings (day length 3-20 min, night 1-9 min), Vote Lock mechanism, deadlock prevention via meteor mechanic, and extensive role/meeting customization [^70^].

- **Werewolf Arena (Google Research)**: Academic LLM evaluation framework with 8-player environments, ELO ratings, and tournament structure. Found "relatively balanced win rates (40-60%) in self-play" across most models [^19^].

- **Foaster.ai Werewolf Benchmark**: Extended Werewolf Arena with per-role ELO, social-strategy indicators (auto-sabotage, D1 wolf eliminations, wolf-side manipulation success), and per-message vote-swing instrumentation. GPT-5 leads with "true sweep capability" [^75^].

- **Ultimate Werewolf (Bezier Games)**: Physical card game with extensive role expansions. Cards carry +/- weightings for balance. Companion app assists with deck building. Supports up to 75 players across parallel games (recommended 10-12) [^48^].

- **Blood on the Clocktower (The Pandemonium Institute)**: Innovative social deduction game with dead-player participation, massive information mechanics, active Storyteller role, and script-based setup. $573K+ Kickstarter, rated #1 Party Game on BoardGameGeek [^107^][^109^].

- **Among Us (InnerSloth)**: Task-based social deduction with built-in text chat. Saw pandemic-driven explosive popularity in 2020. Adds "tasks" as parallel information channel [^54^].

- **One Night Ultimate Werewolf (Bezier Games)**: Condensed single-night, single-day variant. Uses 3 extra role cards in center. Free companion app handles night action order. Playable in 5 minutes with 3+ players [^43^][^73^].

- **The Resistance / Avalon**: Competing social deduction game by Don Eskridge. Avalon variant adds Merlin (knows evil), Assassin (guesses Merlin), Percival (knows Merlin), and Morgana (appears as Merlin) [^58^].

- **TwoPlusTwo Forums**: Long-running werewolf strategy community. The "Werewolf Strategy for Advanced Players" post is a classic reference for wolf meta-tactics [^52^].

- **MaKTO Research (Multi-agent KTO)**: Academic work achieving 74% win rate with 14B models against comparable opponents. Demonstrated strategic adaptation, team collaboration, and role ability optimization [^29^][^30^].

- **AIWolfDial**: International workshop/competition for AI Werewolf agents. Features GPT-4o-mini based agents with analysis, strategy, generation, and refinement model layers [^98^].

---

## Trends & Signals

- **AI-Agent Werewolf Evaluation Trend**: Multiple academic projects now use Werewolf as a benchmark for social intelligence. Werewolf Arena, Foaster.ai, MaKTO, and AIWolfDial all represent a growing trend of using social deduction as a testbed for "the ability to play a multi-agent game under uncertainty, adapt in real time, manage long context, invent strategies, form alliances, manipulate and resist manipulation" [^75^].

- **Information-Rich Design**: Blood on the Clocktower's design philosophy signals a shift from "analyzing body language" to "placing a heavy focus on information and the intricate interaction of character powers" [^109^]. This may influence future digital werewolf designs toward more structured information mechanics.

- **Dead Player Engagement**: BotC's dead-player participation (ghost votes, continued discussion) addresses the traditional werewolf problem of early elimination boredom. This mechanic is gaining attention and may be adapted for digital platforms [^106^][^107^].

- **Anonymous Digital Play**: Online platforms (werewolv.es, mafia.gg, Town of Salem) increasingly use anonymous identities to prevent meta-gaming based on player relationships [^28^]. This normalizes anonymized play for fairer competitive environments.

- **Structured Timing and Anti-Stalling**: Modern platforms implement structured phase timing, inactivity smiting, and deadlock prevention (meteor mechanics) to address the traditional problem of stalled games [^70^][^28^].

- **LLM Deception Capabilities Growing**: Research shows LLMs can "engage in spontaneous deception even without explicit prompting" and "larger models show such behavior more often than smaller counterparts" [^100^]. However, "larger reasoning models often struggle to maintain deception, as they tend to leak internal reasoning information" [^100^].

- **Companion App Integration**: Both Ultimate Werewolf and One Night Ultimate Werewolf provide companion apps for night action management. Digital platforms are increasingly replacing the human moderator role with automated systems [^48^][^43^].

- **Role Weighting for Balance**: The trend toward systematic balance tools (Ultimate Werewolf's +/- card weightings, werewolv.es setup guides) replaces intuitive balancing with mathematical approaches [^48^][^31^].

- **Script/Setup Customization**: Blood on the Clocktower's "script" system (22-25 curated roles per game) and Ultimate Werewolf's custom deck building represent a trend toward modular, customizable role sets rather than fixed role lists [^106^][^48^].

---

## Controversies & Conflicting Claims

- **Optimal Villager:Wolf Ratio**: Sources disagree on the ideal ratio. werewolv.es suggests "around 3:1" as classic [^44^], while BoardGameGeek discussions suggest "3.5 villagers to 1 wolf" [^53^], and Ultimate Werewolf's basic setup uses approximately 2:1 ("typically werewolves are outnumbered by villagers 2 to 1") [^33^]. The variation depends heavily on special roles present and whether roles are revealed on death.

- **Seer Reveal Timing**: Strong disagreement on whether Seer should reveal immediately. Some argue immediate reveal maximizes information; others argue it leads to guaranteed Seer death. The truth is highly meta-dependent: "Questions about werewolf strategy often depend on the meta of the group" [^102^].

- **Effectiveness of Deception Detection Training**: While some studies show "secret service agents" can learn to detect lies better, "the ability to teach deception detection appears to be fairly small, with on average only a 4% increase in probability of detecting lies" [^94^]. Popular fiction suggests behavioral tells are reliable, but research shows "when we lie, we do not give ourselves away so easily" [^104^].

- **LLM vs. Human Social Reasoning**: The WereBench evaluation framework reveals that "state-of-the-art LLMs show diverse performance, with roughly half remain below 0.50" on human-aligned social deduction strategies [^17^]. However, MaKTO-72B models show superior strategic reasoning against comparable LLMs, achieving 84% win rates [^29^]. The gap between LLM and human strategic reasoning remains contested.

- **Digital vs. Physical Play Experience**: Blood on the Clocktower designer Steven Medway explicitly designed away from body-language analysis, arguing that digital/text-heavy information systems are more strategically interesting [^109^]. Conversely, traditional werewolf purists value in-person body language as core to the experience.

- **Player Elimination Design**: Classic Werewolf eliminates players permanently, which can create long periods of boredom. Ghost/house rules allow dead players to contribute clues or observations [^76^], but purists argue this compromises game integrity by giving dead players influence. BotC resolves this by keeping dead players fully engaged with limited ghost votes [^107^].

- **Voting System Efficacy**: Academic work suggests approval/disapproval voting may be "a more natural representation of player deliberation" than simple plurality [^15^], but standard Werewolf and most platforms use plurality. Whether alternative voting systems improve gameplay remains an open research question.

- **Open vs. Closed Setup**: Open setups (known role list) allow process-of-elimination solving, making the game more "solvable" [^74^]. Closed setups preserve mystery but can feel swingy. werewolv.es supports both and notes "A village that gets very little trustworthy information early will usually need more room to be wrong" [^31^].

---

## Recommended Deep-Dive Areas

- **AI Agent Werewolf Benchmarking (Werewolf Arena / Foaster.ai)**: Why it warrants depth — The growing academic field of evaluating LLMs through social deduction provides insights into both AI capabilities and game balance. The Foaster.ai per-message vote-swing instrumentation and social-strategy indicators offer novel metrics for measuring "persuasion" in gameplay [^75^]. The ELO systems and head-to-head matrices reveal asymmetric skill profiles (some models better as wolves vs. villagers) that have implications for player matching.

- **Blood on the Clocktower Design Philosophy**: Why it warrants depth — BotC represents the most significant innovation in social deduction game design in decades. Its information-rich mechanics, dead-player engagement, active Storyteller role, and script-based customization offer a model for elevating werewolf from party game to strategic experience. The explicit design away from body-language reading toward information-logic gameplay is particularly relevant for digital adaptation [^109^][^106^].

- **Night Action Resolution Complexity**: Why it warrants depth — The precise ordering of night actions (redirects → roleblocks → protection → visits → kills → reports → swaps) creates emergent strategic depth that most players never fully appreciate [^46^]. Edge cases (two Succubi targeting each other, overlapping protections, simultaneous kills) create gameplay scenarios that could be a source of competitive depth or frustration depending on implementation quality.

- **Digital Platform Anti-Cheating and Anonymity Systems**: Why it warrants depth — werewolv.es's avatar/name randomization, mafia.gg's structured phase timing, and anti-stall mechanics represent hard-won design knowledge about making online social deduction fair and engaging. The tradeoffs between anonymity (prevents relationship-meta) and identity (enables reputation systems) are critical for platform design [^28^][^70^].

- **Metagame Evolution Dynamics**: Why it warrants depth — The cyclical nature of metagame adaptation (Seer reveals → wolves target revealed Seer → Seer doesn't reveal → wolves fake-claim Seer → ...) creates a fascinating strategic ecosystem [^102^]. Understanding these cycles is essential for designing systems that remain interesting over repeated play. The werewolv.es community's accumulated knowledge represents decades of collective learning.

- **Information Theory in Werewolf**: Why it warrants depth — The relationship between "feedback" (information revealed through gameplay events) and "direct intel" (Seer checks, etc.) is fundamental to setup balance [^31^]. Mathematical models of information flow could inform automated setup balancing. The Werewolf Arena balance formula `b = 1 - |2 * p_imp - 1|` provides a starting point [^14^].

- **Role Design Pattern Library**: Why it warrants depth — The taxonomy of roles (core, support, disruptive; alignment-fooling, protective, killing, information) represents a design space that could be systematically explored. Ultimate Werewolf's 75+ roles, Town of Salem's 49+ roles, and BotC's 70+ roles across scripts offer extensive comparative material for identifying effective design patterns [^48^][^74^][^106^].

- **Deception Mechanics in LLM-Human Hybrid Games**: Why it warrants depth — As LLM agents become capable werewolf players, the dynamics of human-AI and AI-AI interaction create new strategic territories. The MaKTO models' ability to "strategically eliminate [a] werewolf to cast doubt on the real Seer in subsequent rounds" demonstrates multi-level deception that could inform both AI development and game design [^29^].

---

## Source Reference Table

| Citation | Source | Key Content |
|----------|--------|-------------|
| [^1^] | Mafia (party game) - Wikipedia | Core game mechanics, history, roles |
| [^14^] | OpenReview - Multi-Agent Social Deduction | Balance formula b=1-\|2p_imp-1\|, 90K+ games |
| [^15^] | Learning to vote differently in social deduction | Plurality vs. approval voting rules |
| [^16^] | Mafia (party game) - Wikipedia Optional Roles | Detailed role descriptions (Doctor, Vigilante, Miller, Godfather) |
| [^17^] | Evaluating LLMs in Social Deduction Games | WereBench dataset, human-aligned evaluation |
| [^18^] | PlayWerewolf.co - Character Roles | Seer and Doctor role descriptions |
| [^19^] | Werewolf Arena - arXiv | LLM evaluation, win rates 40-60% self-play |
| [^24^] | One Night Ultimate Werewolf - NeurIPS | RL agent bluffing strategies |
| [^25^] | Werewolves of Miller's Hollow Roles | Expansion roles (Brothers, Fool, Elder, Scapegoat) |
| [^26^] | werewolv.es Unofficial Wiki | Community knowledge base |
| [^27^] | Learning Persuasive Agents - arXiv | Intent identification formalism |
| [^28^] | werewolv.es How to Play | Day/night phases, anonymity, lynching, night actions |
| [^29^] | Multi-agent KTO - arXiv | MaKTO 74% win rate, strategic cases |
| [^30^] | Multi-agent KTO Reinforcement - arXiv | Extended case studies and prompts |
| [^31^] | werewolv.es How to Balance | Feedback vs. direct intel balance theory |
| [^33^] | PlayWerewolf.co - Roles | Core roles, ratio recommendations |
| [^43^] | One Night Ultimate Werewolf - Fandom | Night action order, app-based resolution |
| [^44^] | werewolv.es Setups | Villager:wolf ratio 3:1, setup guidelines |
| [^46^] | werewolv.es Night Action Order | 11-category resolution order |
| [^47^] | brenbarn.net Werewolf Rules | Devil role, additional rules, day/night flow |
| [^48^] | Ultimate Werewolf Extreme Review | +/- card weightings, companion app |
| [^50^] | BoardGames.SE - 10-12 Player Setups | Mathematical balance model, standard 12p setup |
| [^52^] | TwoPlusTwo - Werewolf Strategy | Advanced wolf tactics, bandwagon analysis, bus strategy |
| [^53^] | BoardGameGeek - Villager/Wolf Ratio | 3.5:1 ratio recommendation |
| [^54^] | Among Us - VT Research | Digital adaptation, task mechanics, pandemic popularity |
| [^56^] | PlayWerewolf.co - Rules | Complete rules walkthrough, timing |
| [^57^] | Ultimate Werewolf Roles - Fandom | Comprehensive role list with descriptions |
| [^58^] | The Resistance: Avalon Review | Merlin, Assassin, Percival, Morgana roles |
| [^70^] | Mafia.gg Wiki - Rules and Mechanics | Configurable timing, Vote Lock, deadlock prevention |
| [^71^] | Role Assignment in Social Deduction | Assignment methods, balance best practices |
| [^73^] | Mafia (party game) - Wikipedia | History, core rules, open/semi-open/closed setups |
| [^74^] | Town of Salem Wiki - Game Modes | Ranked mode, ELO, role lists |
| [^75^] | Foaster.ai Werewolf Benchmark | Per-role ELO, model profiles, head-to-head matrices |
| [^76^] | BoardGames.SE - Dead Player Rules | Ghost rules, house rules for dead participation |
| [^94^] | Psychology of Board Games - Substack | Deception detection research, 4% training improvement |
| [^96^] | Foaster.ai Werewolf Bench GitHub | Annotated competitive games, bus strategy, fake claims |
| [^97^] | PMC - Speech Timing and Deception | Pause frequency tells, vocal pitch study |
| [^98^] | AIWolfDial 2024 - ACL Anthology | GPT-4o-mini based agents, strategy databases |
| [^99^] | Werewolf Wiki - Strategy Drabble | Villager/wolf strategy guides, common mistakes |
| [^100^] | Evaluating LLMs in Hidden Role Games | Secret Hitler evaluation, DRR/RIA metrics |
| [^101^] | Realms Beyond - TWG Strategy | Third-party roles, theory, wagon reading |
| [^102^] | BoardGames.SE - Seer Reveal Strategy | Meta-dependent strategy discussion |
| [^103^] | Town of Salem Game Breakdown | Three-team system, role design analysis |
| [^104^] | Werewolv.es - Shapeshifter Role | Identity swap mechanics |
| [^104^] | Wired - Among Us Psychology | 54% human lie detection, adaptive lie detector theory |
| [^105^] | Critical Play - Blood on the Clocktower | BotC mechanics, dead player participation |
| [^106^] | Blood on the Clocktower Guide | Complete BotC rules, phases, scripts |
| [^107^] | BotC Community Analysis | Kickstarter data, convention history, sales figures |
| [^109^] | BotC Behind the Curtain - Designer Blog | Steven Medway's design philosophy, information focus |
| [^110^] | BGG Werewolf PBF Dictionary | Comprehensive werewolf terminology |
| [^111^] | Reddit - Ultimate Werewolf Minion Rules | Parity win condition clarification |
