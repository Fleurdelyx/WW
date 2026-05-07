## 4. Roles & Meta Design

### 4.1 Role Design Philosophy

#### 4.1.1 Design Principles

The Werewolf role system rests on three interconnected principles. **Information asymmetry creates tension**: the village operates with incomplete knowledge of faction assignments while the werewolf team possesses perfect information about its own membership [^44^]. This structural imbalance forces the uninformed majority to extract signal from social interaction while the informed minority constructs believable false narratives. **Meaningful decisions every turn** ensures that even the vanilla Villager faces consequential choices during daytime voting — a player who votes incorrectly advances the opposing faction's win condition. **Faction interdependence** prevents any single role from dominating; the Seer's investigations require the Doctor's protection, while the Werewolves' night kill depends on coordinated decisions that risk exposing their alliance [^18^].

#### 4.1.2 Information Taxonomy

Information distributes across three categories. *Perfect information* — publicly observable facts including vote tallies, death announcements, and role reveals on death — is shared equally. *Probabilistic information* encompasses alignment checks, protection results, and wolf-target knowledge. It is reliable but scarce, degrading as roles are eliminated. *Hidden information* includes faction assignments, night action targets, and werewolf team communications. The asymmetry between werewolf knowledge (full team composition) and villager knowledge (only their own role) constitutes the game's core tension [^50^].

![Role capability profiles across information value, kill/defend capability, and swing potential dimensions](fig4_1_role_weight_radar.png)

#### 4.1.3 Deception as Legitimate Strategy

Lying in Werewolf is core gameplay, not cheating. Werewolves must deceive to survive; villagers must detect deception to win. This creates a natural **detection asymmetry**: the WOLF benchmark shows werewolves deceive in 31% of turns while peer detection achieves only 71–73% precision [^151^]. The Traitors benchmark reveals a 93% truth-speaking rate versus 10% fabricated claim rate [^337^]. Early-game deception succeeds reliably, but extended interaction improves detection without compounding errors against truthful roles [^151^]. The platform leverages this asymmetry as a built-in difficulty progression.

### 4.2 Core Role Definitions

#### 4.2.1 Villager

The Villager possesses no special abilities and participates solely in daytime discussion and voting. Approximately 70–75% of players in a standard setup should be villagers or near-vanilla roles [^71^]. Strategic contribution derives from social deduction — analyzing voting patterns, statement consistency, and behavioral tells. Quiet villagers may be mistaken for wolves; overly helpful villagers may be mistaken for power roles [^33^]. Villagers collectively control the vote, making their coordination decisive even without individual power.

#### 4.2.2 Werewolf

The Werewolf participates in the factional night kill (jointly selecting one victim with teammates) and wins at numerical parity [^56^]. The typical ratio is 1 wolf per 3–4 villagers [^44^]. Werewolves know all teammates from game start and communicate privately at night. During daytime each wolf must maintain a villager persona. Key strategic rules include: "Don't jump on a fellow wolf's bandwagon unless it's very likely to clear you" [^52^], and when a villager claims a power role under pressure, a wolf should counterclaim even without heat to secure a free village lynch [^52^].

#### 4.2.3 Seer

The Seer investigates one player per night, learning alignment (wolf or non-wolf). With a weight of +7, the Seer is the most powerful information role and the primary wolf target [^172^]. The Seer must balance revealing information against self-preservation: "Your task is to give the village enough solid information to go on" [^283^]. Results are binary ("wolf" or "not wolf"). Critical counterplay exists: the Alpha Werewolf appears innocent to Seer checks, and the Miller appears guilty despite being village-aligned [^16^].

#### 4.2.4 Bodyguard (Doctor)

The Bodyguard protects one player from the werewolf night kill each night, succeeding only when the target matches the wolves' kill target. Cannot self-protect on consecutive nights [^16^]. Protection priority: Night 1 self-protect; Night 2+ protect revealed Seer; late game protect confirmed villagers [^169^]. The weight of +3 reflects moderate defensive value scaling with high-value village targets [^172^].

#### 4.2.5 Witch

The Witch possesses one healing potion and one poison potion, each usable once [^33^] [^228^]. After wolves select their target, the Witch sees who was targeted and may heal them. The poison potion kills any player and bypasses Doctor protection [^225^]. Both potions may be used on the same night [^225^]. Night 1 healing guarantees at least one save and clears one player as innocent [^229^]. Poisoning on Night 1 is statistically unlikely to hit a wolf and is forbidden in competitive play [^229^]. Privileged knowledge of wolf targets creates a critical advantage: "Claiming 'he was the only one saved last night' is unknowable to anyone but the Witch" [^96^].

#### 4.2.6 Complete Role Roster

The following table defines core and extended roles with balance weights from the Ultimate Werewolf character value system [^172^].

| Role | Faction | Ability | Information Access | Complexity | Weight |
|:---|:---|:---|:---|:---|:---:|
| Villager | Village | None (votes only) | Public only | Low | +1 |
| Werewolf | Werewolf | Factional night kill | Full wolf team | Medium | -6 |
| Seer | Village | Night alignment check | Check results | High | +7 |
| Doctor | Village | Night protection | Protection target only | Medium | +3 |
| Witch | Village | One heal, one poison | Wolf kill target | Very High | +5 |
| Hunter | Village | Revenge kill on death | None | Medium | +3 |
| Mason | Village | Knows other Masons | Confirmed Masons | Low-Medium | +2 |
| Alpha Werewolf | Werewolf | Appears innocent to Seer | Full wolf team | Medium | -3 |
| Minion | Werewolf* | Knows all wolves | Full wolf team | Medium-High | -2 |
| Fool/Tanner | Solo | None | None | Medium | -1 |
| Shapeshifter | Werewolf | Identity swap with victim | Full wolf team | High | -4 |

*Minion counts as villager for parity but wins with werewolves.

A single Seer (+7) approximately counterbalances one Werewolf (-6) [^172^]. The Witch (+5) occupies a uniquely powerful position due to dual one-shot abilities with asymmetric information. Extended roles such as the Alpha Werewolf (-3) provide critical Seer counterplay, preventing the Seer from becoming a game-solving mechanism.

### 4.3 Balance Framework

#### 4.3.1 Balance Formula

Academic research formalizes balance through the balance index:

$$b = 1 - |2 \cdot p_{imp} - 1|$$

Where $b$ is the balance index (1 = perfect balance, 0 = completely one-sided) and $p_{imp}$ is the village win probability. The target is $b > 0.75$, corresponding to $p_{imp} \in [0.375, 0.625]$ [^14^].

![Balance index b as a function of village win probability, with target zone b > 0.75 highlighted](fig4_2_balance_index.png)

```python
def compute_balance_index(village_win_rate: float) -> float:
    """Compute balance index from empirical village win rate.
    
    Args:
        village_win_rate: Observed probability of village winning, [0, 1]
        
    Returns:
        Balance index b in [0, 1]. Target: b > 0.75
    """
    return 1.0 - abs(2.0 * village_win_rate - 1.0)

# Validation thresholds
TARGET_MIN = 0.75        # Acceptable balance floor
PERFECT_BALANCE = 1.0    # Ideal (village_win_rate == 0.5)
```

In 90{,}720-game experiments, homogeneous play achieved $b = 0.978$ while team-aware play dropped to $b = 0.602$, showing that "additional information and strategic complexity systematically reduce balance" [^14^]. This validates the principle that feedback and direct intel must be inversely proportional [^31^].

#### 4.3.2 Role Weight Assignment

Each role receives a composite score across three dimensions. **Information value** ($\pm 3$) measures actionable intel generated or denied. **Kill/defend capability** ($\pm 3$) quantifies elimination or protection power. **Swing potential** ($\pm 2$) captures high-variance outcome ability.

| Role | Info Value | Kill/Defend | Swing | Composite | UW Weight |
|:---|:---:|:---:|:---:|:---:|:---:|
| Villager | 0 | 0 | 0 | 0 | +1 |
| Seer | +3 | 0 | +1 | +4 | +7 |
| Doctor | 0 | +2 | +1 | +3 | +3 |
| Witch | +1 | +2 | +2 | +5 | +5 |
| Hunter | 0 | +2 | +1 | +3 | +3 |
| Werewolf | +2 | +2 | +1 | +5 | -6 |
| Mason | +2 | 0 | 0 | +2 | +2 |
| Alpha Werewolf | +2 | +2 | +1 | +5 | -3 |

Both systems share the core rule: "The sum of the character values should be close to 0" [^172^]. Positive totals favor villagers; negative totals favor werewolves [^48^].

#### 4.3.3 Villager-to-Werewolf Ratio Guidelines

The classic ratio is approximately 3:1 [^44^] [^50^], shifting based on information environment:

| Setup Type | Villager:Wolf Ratio | Example (8p) | Rationale |
|:---|:---:|:---|:---|
| Role reveal ON death | 3:1 | 6 villagers, 2 wolves | Death reveals provide village intel engine |
| Role reveal OFF death | 4:1 | 7 villagers, 1–2 wolves | No reveal removes major information source |
| Strong village roles present | 3.5:1 | 5 villagers + Seer + Doctor, 2 wolves | Intel roles compensate for lower ratio |
| Mountainous (no special roles) | 2:1 to 3:1 | 5–6 villagers, 2–3 wolves | Pure vote/number balance |

BoardGameGeek recommends a wolves:villagers:specials ratio around 1:2:1 or 1:3:1 [^53^]. Davidoff's original rules specified approximately one-third mafiosi [^73^]. The recursive trajectory model predicts: from state $(w, v) = (a, 2a)$, the next day's balance is either $(a-1, 2a-1)$ on wolf lynch or $(a, 2a-2)$ on villager lynch [^50^].

#### 4.3.4 Faction Composition Algorithm

Role assignment uses constraint satisfaction. Given player count $N$, the algorithm selects a multiset $\mathcal{R}$ such that $|\sum_{r \in \mathcal{R}} w(r)| \leq \epsilon$, with $\epsilon = 2$:

```python
import random

def generate_balanced_setup(
    player_count: int,
    available_roles: list[Role],
    target_epsilon: float = 2.0,
    max_trials: int = 10_000
) -> list[Role] | None:
    """Constraint-satisfaction role assignment.
    Ensures |sum(weights)| <= epsilon for faction balance.
    """
    wolf_count = max(1, player_count // 4)
    villager_count = player_count - wolf_count - 2  # reserve for specials
    special_count = player_count - villager_count - wolf_count
    
    pool = [r for r in available_roles if r.category == 'special']
    
    for _ in range(max_trials):
        selected = random.choices(
            pool, k=special_count,
            weights=[1.0 / (abs(r.weight) + 1) for r in pool]
        )
        setup = [villager_role] * villager_count + \
                [werewolf_role] * wolf_count + selected
        
        if abs(sum(r.weight for r in setup)) <= target_epsilon:
            return setup
    return None
```

The 10{,}000-trial budget provides near-certain convergence for player counts up to 18.

#### 4.3.5 Balance Validation

After assignment, setups undergo Monte Carlo validation:

```python
def validate_balance(setup: list[Role], n_sims: int = 10_000) -> dict:
    """Full balance validation pipeline."""
    weight_sum = sum(r.weight for r in setup)
    p_imp = estimate_win_rate(setup, n_sims)
    b = 1 - abs(2 * p_imp - 1)
    
    return {
        "weight_sum": weight_sum,
        "p_imp": p_imp,
        "balance_index": b,
        "is_balanced": b > 0.75,
        "verdict": "ACCEPT" if b > 0.75 
                   else "ADJUST" if b > 0.5 
                   else "REJECT"
    }

# Example: Classic 8-player setup
classic = [villager]*4 + [werewolf]*2 + [seer, doctor]
# Expected: p_imp ~ 0.55-0.60, b ~ 0.80-0.90, verdict: ACCEPT
```

The 10{,}000-simulation default provides $\pm 1\%$ confidence intervals at 95% confidence.

![Preset faction composition across Classic (8p), Standard (12p), and Advanced (16p) configurations](fig4_4_preset_comparison.png)

### 4.4 Tells & Deception Tactics

#### 4.4.1 Soft Tells

Soft tells are behavioral indicators with moderate reliability (35–55%) that suggest but do not prove wolf alignment. **Hesitation patterns** manifest as longer pauses due to cognitive demands of maintaining a false narrative [^97^]. **Over-justification** — excessive rationale for votes that would be natural for a genuine villager — reads as manufactured credibility. **Vague language** enables later revision but signals evasion under pressure. **Tone shifts** in confidence level often indicate strategic pivots rather than organic belief evolution. These tells compound meaningfully when multiple signals align [^104^].

#### 4.4.2 Hard Tells

Hard tells are logical incompatibilities with high reliability (72–95%). **Contradictions with known facts** occur when a current statement conflicts with a prior statement in the game record — receipt-based comparison is "highly reliable in text-based play" [^96^]. **Impossible claims** assert knowledge a role cannot possess, constituting "the unforgivable wolf error" [^96^]. **Voting pattern inconsistencies** include synchronized defense loops ("Charlie received only two votes — his own and Diana's. That is a closed loop" [^75^]).

| Tell Category | Example | Reliability | Type |
|:---|:---|:---:|:---|
| Contradiction with known facts | Vote reasoning conflicts with Day 1 statement | 92% | Hard |
| Impossible role claim | Villager knows wolf night target | 95% | Hard |
| Voting pattern inconsistency | Votes with same player without reasoning | 78% | Hard |
| Synchronized defense | Immediately defends same player when challenged | 55% | Soft |
| Pause frequency / hedging | Self-corrections increase under pressure | 42% | Soft |
| Over-justification | Excessive rationale for simple vote | 38% | Soft |
| Unknowable information claim | Non-Witch knows who was saved | 88% | Hard |
| Bandwagon timing | Follows consensus without new information | 52% | Soft |

#### 4.4.3 Meta Reads

Meta reads operate at the strategic pattern level. **Early accusation patterns** reveal whether a player is seeking information or manufacturing targets. **Bandwagon timing** distinguishes evaluating villagers from wolves joining late: "note who is voting with them, and throw suspicion on them for following the vote" [^99^]. **Defense posturing** — who defends whom — exposes wolf partnerships through detectable correlation [^75^]. **Information claim credibility** evaluates whether a claimed Seer's timeline aligns with known night action resolution ordering.

#### 4.4.4 Deception-Detection Asymmetry

The gap between deception capability and detection accuracy creates a natural difficulty curve. Werewolves deceive in 31% of turns; peer detection catches them at 71–73% precision with ~52% accuracy [^151^] [^343^]. The asymmetry deepens comparing 93% truth-speaking rates against 10% fabricated claim rates [^337^].

```python
def compute_suspicion_score(
    statement_history: list[Statement],
    player_role_estimate: str,
    alpha: float = 0.7
) -> float:
    """Update suspicion score with exponential smoothing.
    
    Args:
        statement_history: All statements from target player
        player_role_estimate: Estimated role for knowledge-bound checking
        alpha: Smoothing factor — higher = more weight on new evidence
        
    Returns:
        Composite suspicion score in [0, 1]
    """
    scores = {
        'self_contradiction': check_contradictions(statement_history),
        'unknowable_claims': check_knowledge_bounds(
            statement_history, player_role_estimate
        ),
        'voting_pattern': analyze_vote_consistency(statement_history),
        'confidence_shift': detect_calibration_changes(statement_history),
    }
    
    # Weights tuned from WOLF benchmark data [^151^]
    composite = (
        0.30 * scores['self_contradiction'] +
        0.25 * scores['unknowable_claims'] +
        0.25 * scores['voting_pattern'] +
        0.20 * scores['confidence_shift']
    )
    
    # Exponential smoothing: D_{t+1} = alpha * s_o_t + (1-alpha) * D_t
    return alpha * composite + (1 - alpha) * scores.get('prior_score', 0.5)
```

| Algorithm | Precision | Recall | Key Strength | Key Weakness |
|:---|:---:|:---:|:---|:---|
| Receipt-based contradiction | High | Medium | Logically irrefutable | Requires complete history |
| COTAM (3-stage reflective) | 0.49–0.62 F1 | 0.49–0.62 | No training needed | Computationally expensive [^359^] |
| WOLF suspicion scoring | 71–73% | ~52% | Longitudinal dynamics | Requires many rounds |
| LLM-as-Judge (direct) | Low-Medium | Low | Simple implementation | Fooled by skilled lies |

![Tell reliability comparison: hard tells achieve 72–95% reliability; soft tells achieve 35–55%](fig4_3_tell_reliability.png)

The village wins by combining hard-tell detection with systematic elimination of players whose soft-tell profiles diverge from their claimed role's expected pattern.

### 4.5 Role Expansion Design

#### 4.5.1 Design Pattern for New Roles

New roles follow a specification template ensuring faction balance and AI prompt compatibility:

```python
@dataclass
class RoleSpecification:
    """Template for defining new Werewolf roles."""
    role_id: str
    name: str
    faction: Faction
    category: Literal["core", "extended", "third_party"]
    ability_description: str
    night_action: bool
    night_action_order: int  # 1-11 per resolution pipeline
    information_access: list[str]
    win_condition: str
    setup_weight: int  # + favors village, - favors wolves
    max_per_game: int
    ai_difficulty: Literal["low", "medium", "high", "very_high"]
    ai_prompt_template: str
    interaction_rules: dict[str, str]

    def validate(self) -> list[str]:
        """Ensure role has counterplay and no auto-confirm mechanics."""
        issues = []
        if "auto_confirm" in self.interaction_rules.values():
            issues.append("Error: auto-confirm reduces deduction space")
        if not any("counter" in k for k in self.interaction_rules):
            issues.append("Warning: no counterplay defined")
        return issues
```

The `validate` method enforces that every role needs a counter — the Seer has the Alpha Werewolf, the Doctor has roleblockers, Masons can be countered by wolf Mason-fakes [^31^]. Auto-confirm mechanics that definitively prove a role remove all doubt and should be avoided.

#### 4.5.2 Role Compatibility Matrix

Not all roles coexist without degenerate strategies:

|  | Seer | Doctor | Witch | Hunter | Mason | Alpha | Minion | Fool |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Seer** | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Doctor** | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Witch** | ✓ | ✓ | — | ✓ | ✓ | ⚠ | ✓ | ✓ |
| **Hunter** | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ |
| **Mason** | ✓ | ✓ | ✓ | ✓ | — | ✓ | ⚠ | ⚠ |
| **Alpha** | ✓ | ✓ | ⚠ | ✓ | ✓ | — | ✓ | ✓ |
| **Minion** | ✓ | ✓ | ✓ | ✓ | ⚠ | ✓ | — | ✓ |
| **Fool** | ✓ | ✓ | ✓ | ✓ | ⚠ | ✓ | ✓ | — |

Key: ✓ = safe; ⚠ = requires tuning ($\pm 1$ weight adjustment).

The Witch + Alpha combination risks overpowered wolf play if the Witch's poison removes a villager while the Alpha survives a Seer check. The Mason + Minion pairing creates information warfare where the Minion knows exactly which Mason claims are fake.

#### 4.5.3 Extended Roles

Beyond the core roster, extended roles introduce specialized mechanics:

| Role | Faction | Ability | Strategic Impact | Weight |
|:---|:---|:---|:---|:---:|
| **Hunter** | Village | Revenge kill on death; target chosen at death | Deters wolf kill via 1-for-1 trade; "almost never claim early" [^101^] | +3 |
| **Fool** | Solo | Wins if voted out during day; seen as villager by Seer | Distracts village; wolves should avoid killing the Fool [^220^] | -1 |
| **Mason** | Village | Knows other Masons from game start | Voting bloc; wolves can fake Mason claims [^282^] | +2 |
| **Minion** | Werewolf* | Knows all wolves; does not participate in night kill | Pushes mislynches with plausible deniability [^285^] | -2 |

*Minion counts as villager for parity.

The Hunter's reactive kill creates a deterrent effect disproportionate to its weight. The Fool introduces a third-party win condition that helps wolves by providing a free mislynch target, requiring setup compensation. The Mason trust network narrows the suspect pool while the Minion's asymmetric knowledge enables deep-cover disruption of village coordination [^276^]. The complete role system — core, extended, and the expansion pattern — provides a modular toolkit. Balance validation through analytical weight sums and Monte Carlo simulation ensures each configuration maintains $b > 0.75$, preserving the tension between information asymmetry and detection capability that defines Werewolf's emergent gameplay.
