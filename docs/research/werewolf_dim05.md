# Dimension 5: Memory Systems, Belief Tracking & Theory of Mind for Social Deduction

**Research Date**: 2025-07-22  
**Search Coverage**: 18 independent search queries across memory architectures, belief tracking, theory of mind, trust networks, memory compression, and ReCon reasoning  
**Sources Found**: 35+ primary sources (NeurIPS, ACL, AAAI, arXiv, ACM, Science, cognitive architecture papers)  
**Total Independent Searches**: 18 (exceeds minimum of 15)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Memory System Architecture](#2-memory-system-architecture)
3. [Short-Term Memory (STM)](#3-short-term-memory-stm)
4. [Long-Term Memory (LTM) / Episodic Memory](#4-long-term-memory-ltm--episodic-memory)
5. [Semantic Memory](#5-semantic-memory)
6. [Belief Tracking & Suspicion Scoring](#6-belief-tracking--suspicion-scoring)
7. [Theory of Mind Implementation](#7-theory-of-mind-implementation)
8. [Trust Network Architecture](#8-trust-network-architecture)
9. [Memory Compression & Context Window Management](#9-memory-compression--context-window-management)
10. [ReCon Dual-Perspective Reasoning](#10-recon-dual-perspective-reasoning)
11. [Complete Memory Storage Schemas](#11-complete-memory-storage-schemas)
12. [Integration Architecture for Werewolf Platform](#12-integration-architecture-for-werewolf-platform)
13. [Source Index](#13-source-index)

---

## 1. Executive Summary

This deep-dive research synthesizes findings from 35+ academic and industry sources to design a comprehensive memory, belief tracking, and theory of mind architecture for a Werewolf multiplayer game platform. The key findings are:

- **Unified memory management** via tool-based actions (AgeMem) outperforms separate STM/LTM pipelines, achieving autonomous decisions about when, what, and how to store, retrieve, summarize, or discard information [^244^][^336^].

- **Belief tracking** works best as a hybrid: structured probabilistic models (factor graphs, belief matrices) for role inference combined with LLM-powered semantic analysis for statement evaluation. The WOLF benchmark provides a validated suspicion scoring methodology using exponential smoothing with α=0.7 [^151^][^342^].

- **Theory of Mind** requires explicit architectural support -- not just scaling. ReCon's dual-perspective reasoning (formulation + refinement contemplation with first-order and second-order perspective transitions) provides a concrete prompt-based implementation that outperforms CoT across all six evaluated metrics [^346^][^81^]. MultiMind's Transformer-based belief matrix extends this with second-order ToM modeling suspicion levels between all player pairs [^316^].

- **Trust networks** should be implemented as directed weighted graphs with game-theoretic update rules. Trust scores must incorporate both direct observations and propagated reputation, with explicit handling of malicious misinformation [^340^][^301^].

- **Memory compression** is critical for production: a multi-layer cascade (tool output offloading → sliding window → LLM summarization) achieves 22-57% token reduction while maintaining accuracy. Active compression (agent decides when to compress) outperforms passive heuristics [^315^][^320^][^319^].

- **Context window management** should follow the hierarchy: raw recent messages > compaction > summarization, with structured note-taking (NOTES.md pattern) for persistent cross-session state [^325^][^323^].

---

## 2. Memory System Architecture

### 2.1 Hierarchical Memory Model

Based on cognitive architecture research (ACT-R, Soar) and modern LLM agent implementations, the recommended memory architecture follows a four-tier hierarchy:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MEMORY SYSTEM ARCHITECTURE                           │
│                     for Werewolf Game Agent                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   WORKING    │    │   EPISODIC   │    │   SEMANTIC   │              │
│  │   MEMORY     │◄──►│   MEMORY     │◄──►│   MEMORY     │              │
│  │   (STM)      │    │   (LTM)      │    │   (FACTS)    │              │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘              │
│         │                    │                    │                      │
│    In context window    Vector DB / Graph     RAG / Structured           │
│    ~2-8K tokens         DB persistence        Knowledge Base             │
│    Volatile             Cross-game            Rules, strategies           │
│    Milliseconds         Seconds retrieval     Instant retrieval           │
│                         Mem0 / Zep / LangMem                             │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    PROCEDURAL MEMORY                                ││
│  │  (Implicit in LLM weights + Explicit in agent code/rules)           ││
│  │  - Game rules enforcement    - Strategy patterns                    ││
│  │  - Role abilities            - Communication protocols              ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │              CONTEXT WINDOW MANAGEMENT LAYER                        ││
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────────────┐    ││
│  │  │  Recent    │  │Compacted   │  │  Compressed Summary         │    ││
│  │  │ Messages   │  │Tool Calls  │  │  (Knowledge Block)          │    ││
│  │  │ (raw)      │  │(reversible)│  │  (lossy, LLM-generated)     │    ││
│  │  └────────────┘  └────────────┘  └────────────────────────────┘    ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │              UNIFIED MEMORY MANAGER (AgeMem-style)                  ││
│  │  Tool Interface: store() │ retrieve() │ update() │ summarize()      ││
│  │  │ discard() - Learned via three-stage progressive RL (GRPO)        ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Memory Architecture Decision Matrix

| Dimension | STM (Working Memory) | LTM (Episodic Memory) | Semantic Memory | Procedural Memory |
|-----------|---------------------|----------------------|-----------------|-------------------|
| **Content** | Current dialogue, recent votes, phase context | Past games, key events, player patterns | Game rules, role abilities, strategies | Action selection policies, communication norms |
| **Duration** | Current game only | Cross-game persistent | Persistent, updatable | Learned/fine-tuned |
| **Storage** | LLM context window | Vector DB / Graph DB | Structured KB / RAG | LLM weights + Code |
| **Retrieval** | Direct (always in context) | Semantic similarity search | Structured query | Implicit generation |
| **Update Freq** | Every turn | After key events, end of game | Manual / scheduled | Training / RL |
| **Key Source** | [^326^] ACT-R/Soar WM | [^330^] Reflexion episodic buffer | [^335^] GraphRAG | [^326^] ACT-R PM |
| **Implementation** | InMemoryMemory [^61^] | Mem0 / Zep / Qdrant [^337^][^338^] | Neo4j / JSON schemas | LLM + rule engine |

---

## 3. Short-Term Memory (STM)

### 3.1 STM Schema

```json
{
  "stm": {
    "game_context": {
      "game_id": "uuid",
      "current_round": 3,
      "current_phase": "day_debate|night_action|voting|results",
      "my_role": "werewolf|villager|seer|doctor",
      "my_player_id": "p1",
      "alive_players": ["p1", "p2", "p4", "p6"],
      "eliminated_players": ["p3", "p5"]
    },
    "conversation_history": [
      {
        "turn_id": 42,
        "round": 3,
        "phase": "day_debate",
        "speaker_id": "p2",
        "content": "I think p4 is suspicious because they changed their vote last minute.",
        "timestamp": "2025-07-22T14:32:10Z",
        "sentiment": "accusatory",
        "topics": ["vote_analysis", "suspicion", "p4"]
      }
    ],
    "recent_votes": [
      {
        "round": 2,
        "phase": "voting",
        "votes": {
          "p1": "p4",
          "p2": "p4",
          "p4": "p1",
          "p6": "p1"
        },
        "eliminated": "p4",
        "vote_reasons": {
          "p1": "p4 was too quiet",
          "p2": "p4 defended the wrong person"
        }
      }
    ],
    "night_actions_log": [
      {
        "round": 1,
        "action": "seer_check",
        "target": "p3",
        "result": "werewolf",
        "my_role_at_time": "seer"
      }
    ],
    "current_suspicion_snapshot": {
      "p1": 0.35,
      "p2": 0.62,
      "p4": 0.78,
      "p6": 0.41
    }
  }
}
```

### 3.2 STM Implementation Approaches

**Approach 1: InMemoryMemory (AgentScope)**
- Stores all heard/said messages as conversation turns
- Retrieved as full context on each `call()` invocation
- Simple list append with no summarization
- Pros: Maximum fidelity, simple implementation
- Cons: Hits context limit quickly; suffers from "lost in the middle" [^61^][^22^]

**Approach 2: Recency-Importance Weighted Retrieval (Unity Werewolf Framework)**
- Memories scored on recency (half-cycle decay) and importance (1-10 agent self-rating)
- Agent prompted: "On a scale of 1 to 10, where 1 is highly redundant and 10 is indispensable, rate the importance of the following memory"
- Retrieves top-K by combined score for context injection
- Pros: Mimics human memory prioritization; evaluates agent's own judgment
- Cons: Requires additional LLM call per memory for importance rating [^66^]

**Approach 3: ReSum-Style Compression**
- Periodically compress interaction histories into compact reasoning states
- Maintains running summary updated each turn
- Pros: Bounded context size; preserves key inferences over raw dialogue
- Cons: Lossy; may discard nuance critical for deception detection [^17^]

**Recommended**: Hybrid of Approach 2 + 3 — maintain raw recent messages (last 3-5 turns) + running compressed summary of earlier dialogue + importance-weighted key event extraction.

---

## 4. Long-Term Memory (LTM) / Episodic Memory

### 4.1 Episodic Memory Schema

```json
{
  "episodic_memory_entry": {
    "memory_id": "uuid",
    "episode_type": "key_event|player_pattern|strategy_outcome|social_interaction",
    "timestamp": "2025-07-22T14:32:10Z",
    "game_id": "uuid",
    "game_round": 3,
    "my_role": "seer",
    "context": {
      "situation": "Night 3: I checked Alice (p2), she was a villager.",
      "players_involved": ["p2"],
      "game_state": {
        "round": 3,
        "phase": "night",
        "alive": ["p1", "p2", "p3", "p4"]
      }
    },
    "emotional_valence": "relief",
    "strategic_significance": 8,
    "embedding_vector": [0.12, -0.34, 0.89, ...],
    "retrieval_metadata": {
      "player_tags": ["p2"],
      "role_tags": ["villager", "seer"],
      "event_tags": ["night_check", "investigation"],
      "importance_score": 0.85,
      "recency_score": 0.72,
      "access_count": 3,
      "last_accessed": "2025-07-22T15:10:00Z"
    }
  }
}
```

### 4.2 Cross-Game Player Profile Schema

```json
{
  "player_profile": {
    "player_id": "alice",
    "total_games_observed": 47,
    "games_against": 23,
    "games_together": 24,
    "role_distribution_observed": {
      "werewolf": {"count": 8, "win_rate": 0.75, "avg_survival_rounds": 4.2},
      "villager": {"count": 12, "win_rate": 0.33, "avg_survival_rounds": 3.1},
      "seer": {"count": 4, "win_rate": 0.50, "avg_survival_rounds": 2.8},
      "doctor": {"count": 3, "win_rate": 0.67, "avg_survival_rounds": 3.9}
    },
    "behavioral_patterns": {
      "as_werewolf": {
        "speaking_style": "moderate_frequency, deflects_accusations, allies_with_strong_players",
        "common_strategies": ["bushes_teammate_early", "claims_villager_late"],
        "tells": ["over-explains_absence", "changes_vote_when_pressed"]
      },
      "as_villager": {
        "speaking_style": "active_accuser, shares_reasoning, leads_votes",
        "common_strategies": ["early_seer_claim_if_checked", "votes_consistently"]
      }
    },
    "trustworthiness_score": 0.42,
    "deception_detection_rate": 0.65,
    "bluff_success_rate": 0.71,
    "last_updated": "2025-07-22T16:00:00Z",
    "embedding_vector": [0.45, -0.12, 0.78, ...]
  }
}
```

### 4.3 Episodic Memory Implementation Approaches

**Approach 1: Reflexion-Style Verbal Reinforcement**
- Actor generates actions; Evaluator scores outcomes; Self-Reflection generates linguistic feedback
- Episodic memory buffer stores reflective text (max 3 experiences as sliding window)
- Retrieval: inject past reflections into current context as "lessons learned"
- Achieved 91% pass@1 on HumanEval (vs 80% for GPT-4 baseline)
- Pros: No fine-tuning needed; highly interpretable; flexible feedback types
- Cons: Simple sliding window design; memory can only add/remove, not edit [^330^][^332^][^333^]

**Approach 2: MemRL (Runtime RL on Episodic Memory)**
- Store experiences as triplets: (intent_embedding, experience_trace, utility_score)
- Retrieve: filter by similarity (threshold 0.7), re-rank by utility score
- Update utilities based on outcomes: `utility += learning_rate * (reward - utility)`
- New experiences written back with initial Q-value
- Pros: Self-improving without parameter updates; filters "look-alike" bad solutions
- Cons: Needs clear success/failure signals; cold start problem [^304^][^314^]

**Approach 3: AgeMem Unified Memory Management**
- Exposes memory operations as tool-based actions: Add, Update, Delete, Retrieve, Summary, Filter
- Three-stage progressive RL training: (1) LTM storage, (2) STM management with distractors, (3) Coordinated LTM+STM
- Step-wise GRPO addresses sparse/discontinuous rewards from memory operations
- Achieves consistent outperformance across 5 long-horizon benchmarks
- Pros: End-to-end optimized; agent autonomously manages memory; unified action space
- Cons: Requires expensive RL training; fixed tool set may limit flexibility [^336^][^244^][^341^]

**Recommended**: Hybrid of MemRL (utility-weighted retrieval) + AgeMem-style tools (for explicit memory operations) + Reflexion (for verbal reflection generation).

---

## 5. Semantic Memory

### 5.1 Semantic Memory Schema

```json
{
  "semantic_memory": {
    "game_rules": {
      "roles": {
        "werewolf": {
          "team": "evil",
          "abilities": ["night_kill", "secret_chat"],
          "win_condition": "werewolf_count >= villager_count",
          "count_per_game": 2
        },
        "villager": {
          "team": "good",
          "abilities": ["day_vote", "day_discussion"],
          "win_condition": "all_werewolves_eliminated",
          "count_per_game": 4
        },
        "seer": {
          "team": "good",
          "abilities": ["night_check", "day_vote", "day_discussion"],
          "night_check_reveals": "werewolf_or_not_werewolf",
          "win_condition": "all_werewolves_eliminated"
        },
        "doctor": {
          "team": "good",
          "abilities": ["night_protect", "day_vote", "day_discussion"],
          "protection": "blocks_one_kill",
          "self_protection_limit": "every_other_night"
        }
      },
      "phases": ["night", "day_announcement", "day_debate", "day_voting", "elimination"],
      "voting_rules": "majority_vote_eliminates"
    },
    "common_strategies": {
      "werewolf": [
        {"name": "deep_cover", "description": "Act like villager, avoid attention", "risk": "low", "reward": "moderate"},
        {"name": "false_seer_claim", "description": "Claim Seer role with fake results", "risk": "high", "reward": "high"},
        {"name": "bushes_teammate", "description": "Vote out werewolf teammate to gain trust", "risk": "medium", "reward": "high"}
      ],
      "villager": [
        {"name": "active_hunter", "description": "Lead discussion, accuse suspicious players", "risk": "medium", "reward": "moderate"},
        {"name": "quiet_observer", "description": "Minimal statements, watch patterns", "risk": "low", "reward": "low"}
      ],
      "seer": [
        {"name": "early_reveal", "description": "Reveal role and share check results early", "risk": "high", "reward": "high_if_believed"},
        {"name": "late_reveal", "description": "Wait for strong evidence before claiming", "risk": "medium", "reward": "moderate"}
      ]
    },
    "meta_strategies": {
      "when_to_share_info": "balance_between_trust_building_and_info_hiding",
      "voting_coalition_formation": "identify_trusted_allies_through_consistent_behavior",
      "deception_detection": "inconsistency_between_statements_and_actions"
    }
  }
}
```

### 5.2 Semantic Memory Implementation

Semantic memory is implemented via **Retrieval-Augmented Generation (RAG)** with structured knowledge bases:

- **Vector databases** (Pinecone, Qdrant, FAISS): Store game rules, strategies, and player patterns as embeddings for semantic retrieval [^329^][^335^]
- **Graph databases** (Neo4j): Store structured relationships like "Strategy X is effective against Behavior Y" or "Player A often uses Strategy Z when role is Werewolf" [^335^][^331^]
- **Hybrid Vector + Graph**: Use vector similarity for initial retrieval + graph traversal for multi-hop reasoning about strategy effectiveness [^331^]

**Mem0 vs Zep comparison for semantic memory** [^337^][^338^]:
- Mem0: 0.200s p95 retrieval, 66.9% recall, self-hosted, best for fast preference recall
- Zep: <200ms retrieval, 63.8% recall, temporal knowledge graph, best for "how facts changed over time"
- LangMem: 59.82s p95 latency — unsuitable for real-time game agents

---

## 6. Belief Tracking & Suspicion Scoring

### 6.1 Belief State Architecture

The belief state represents an agent's probabilistic understanding of the game. Three complementary approaches are recommended:

**Layer 1: Role Probability Distribution (Symbolic)**
```python
belief_state = {
    "p1": {"werewolf": 0.15, "villager": 0.55, "seer": 0.20, "doctor": 0.10},
    "p2": {"werewolf": 0.75, "villager": 0.15, "seer": 0.05, "doctor": 0.05},
    # ... per player
}
```

**Layer 2: Suspicion Score (Scalar, WOLF-style)**
- Continuous score s ∈ [0, 1] per observer-target pair
- 0 = full trust, 1 = certainty of deception
- Updated via exponential smoothing after each statement

**Layer 3: Belief Matrix (MultiMind-style)**
- Matrix B where B[i, j] = probability that player i believes player j is a werewolf
- Computed by Transformer with causal attention over game history
- Enables second-order ToM: "What does Alice think about Bob?" [^316^][^328^]

### 6.2 Suspicion Update Algorithm (WOLF Benchmark)

```
ALGORITHM: Exponential Smoothing Suspicion Update
─────────────────────────────────────────────────

Input: 
  - D_t(o, t): Current suspicion of observer o toward target t
  - s(o, t): New suspicion assessment from observer for latest statement
  - alpha: Smoothing factor (default 0.7)

Output: Updated suspicion D_{t+1}(o, t)

PROCEDURE UpdateSuspicion:
  1. D_{t+1}(o, t) = alpha * s(o, t) + (1 - alpha) * D_t(o, t)
  
  2. RETURN D_{t+1}(o, t)

PROCEDURE GetPeerSuspicion(peer_ratings):
  3. s(o, t) = MEAN of all peer suspicion scores for target's latest statement
  
  4. RETURN s(o, t)

PROCEDURE StatementAnalysis(statement):
  5. Deception type = classify(statement)  // omission, distortion, fabrication, misdirection
  6. Self_honesty = speaker_self_assess(statement)
  7. Peer_ratings = all_observers_assess(statement)
  8. RETURN (deception_type, self_honesty, peer_ratings)

NOTES:
  - alpha = 0.7 ensures new evidence carries significant weight while prior 
    history tempers overreaction [^151^]
  - Suspicion toward Werewolves rises from ~52% to >60% across rounds
  - Suspicion toward Villagers stabilizes near 44-46%
  - Divergence begins around round 3 (95% CIs no longer overlap)
```

### 6.3 Bayesian Belief Update (Factor Graph Approach)

For structured probabilistic inference, the Bayesian Social Deduction with Graph-Informed Language Models approach [^342^] provides:

```
ALGORITHM: Max-Product Belief Propagation for Role Inference
─────────────────────────────────────────────────────────────

Input:
  - Factor graph with: role variables R_i per player, constraint factors
  - Hard constraints: exactly K werewolves, exactly 1 seer, exactly 1 doctor
  - Soft constraints: failed quest → at least 1 evil in party
  - Observations: dialogue, votes, night results

Output: Belief b_i = P(player i is werewolf | observations)

PROCEDURE:
  1. Construct factor graph:
     - Nodes: role variables R_1, R_2, ..., R_N
     - Factors: role_count_factors, vote_consistency_factors, 
                claim_verification_factors, team_behavior_factors

  2. Run max-product belief propagation:
     For each iteration until convergence:
       For each variable node R_i:
         mu_{f→i}(R_i) = max_{R_{N(f)\i}} [ f(R_{N(f)}) * PROD_{j∈N(f)\i} mu_{j→f}(R_j) ]
       
  3. Compute max-marginals (beliefs):
     b_i = max-marginal(R_i) ∝ P(R_i = werewolf | all observations)

  4. Normalize beliefs across role assignments

  5. RETURN belief vector [b_1, b_2, ..., b_N]

KEY PROPERTIES:
  - Max-product (not sum-product) better handles deterministic constraints
  - Can incorporate dialogue-derived soft constraints from LLM analysis
  - Scales to 8+ player games
```

### 6.4 MultiMind Belief Matrix Computation

```python
# MultiMind ToM Belief Matrix [^316^][^328^]

class ToMModel:
    """
    Transformer with causal attention that computes a belief matrix
    representing each player's suspicion toward every other player.
    """
    
    def compute_belief_matrix(self, action_triplets, face_emotions, tone_emotions):
        """
        Args:
            action_triplets: [(player_i, action, player_j), ...]
            face_emotions: emotion labels from facial analysis
            tone_emotions: emotion labels from vocal analysis
            
        Returns:
            B: belief matrix where B[i,j] = P(player_i believes player_j is werewolf)
        """
        # Encode each action triplet as input token
        embeddings = []
        for triplet in action_triplets:
            e = E_subj(triplet.subject) + E_pred(triplet.action) + E_obj(triplet.object)
            e += E_face(face_emotions) + E_tone(tone_emotions)
            embeddings.append(e)
        
        # Transformer with causal attention processes sequence
        hidden_states = self.transformer(embeddings)
        
        # Final hidden state → belief matrix via linear layer
        B = softmax(W @ hidden_states[-1] + b)
        
        return B  # Shape: (num_players, num_players)
    
    def compute_suspicion_cost(self, B, my_index):
        """Total suspicion directed at self from all other players."""
        return sum(B[j, my_index] for j in range(num_players) if j != my_index)
```

### 6.5 Belief Update Pseudocode (Complete Integration)

```python
class BeliefTracker:
    """
    Integrated belief tracker combining multiple update mechanisms.
    """
    
    def __init__(self, num_players, my_id, roles, alpha=0.7):
        self.num_players = num_players
        self.my_id = my_id
        self.alpha = alpha  # WOLF smoothing factor
        
        # Layer 1: Role probability distributions
        self.role_beliefs = {p: uniform_dist(roles) for p in range(num_players)}
        
        # Layer 2: Suspicion scores (WOLF-style)
        self.suspicion = {p: 0.5 for p in range(num_players)}  # Initialize neutral
        
        # Layer 3: Belief matrix (MultiMind-style)  
        self.belief_matrix = np.ones((num_players, num_players)) * 0.5
        
        # Constraint tracker (hard/soft game constraints)
        self.constraints = ConstraintStore()
    
    def update_from_statement(self, speaker_id, statement, context):
        """Update beliefs after a public statement."""
        
        # Step 1: LLM-powered statement analysis
        analysis = self.llm_analyze_statement(statement, context)
        # Returns: {consistency_score, deception_likelihood, role_claims, 
        #           contradiction_with_prior, emotional_anomaly}
        
        # Step 2: Update suspicion score (WOLF exponential smoothing)
        peer_assessment = analysis['deception_likelihood']  # 0-1
        self.suspicion[speaker_id] = (
            self.alpha * peer_assessment + 
            (1 - self.alpha) * self.suspicion[speaker_id]
        )
        
        # Step 3: Update role probabilities via Bayesian update
        if analysis['role_claims']:
            for claimed_role, confidence in analysis['role_claims'].items():
                self.role_beliefs[speaker_id] = bayesian_update(
                    prior=self.role_beliefs[speaker_id],
                    likelihood=self.compute_role_likelihood(claimed_role, statement),
                    confidence=confidence
                )
        
        # Step 4: Update belief matrix (MultiMind-style)
        # How does this statement change what others think?
        self.belief_matrix = self.tom_model.compute_belief_matrix(
            action_triplets=self.extract_action_triplets(statement),
            face_emotions=context.get('face_emotions'),
            tone_emotions=context.get('tone_emotions')
        )
        
        # Step 5: Apply game constraints
        self.role_beliefs = self.constraints.apply(
            self.role_beliefs, 
            new_evidence={'vote': context.get('vote'), 
                         'night_result': context.get('night_result')}
        )
        
        # Step 6: Cross-player belief propagation
        # If Alice thinks Bob is werewolf, and I trust Alice, 
        # then I should increase my suspicion of Bob
        self.propagate_beliefs()
    
    def propagate_beliefs(self):
        """Propagate beliefs through trust network (iterative)."""
        for iteration in range(MAX_PROPAGATION_ITERATIONS):
            new_beliefs = copy(self.role_beliefs)
            for observer in range(self.num_players):
                if observer == self.my_id:
                    continue
                for target in range(self.num_players):
                    if observer == target:
                        continue
                    # Weighted average: other's belief × my trust in that observer
                    trust_in_observer = self.get_trust(observer)
                    their_belief = self.belief_matrix[observer][target]
                    new_beliefs[target]['werewolf'] += (
                        0.1 * trust_in_observer * their_belief
                    )
            if converged(new_beliefs, self.role_beliefs):
                break
            self.role_beliefs = normalize(new_beliefs)
```

---

## 7. Theory of Mind Implementation

### 7.1 Theory of Mind Capability Hierarchy

| Order | Description | Werewolf Application | Implementation |
|-------|------------|---------------------|----------------|
| **0th-order** | Beliefs about world state | "I know player 3 was eliminated" | Direct observation |
| **1st-order** | Beliefs about others' beliefs | "Alice thinks Bob is a werewolf" | First-order perspective transition (ReCon) [^346^] |
| **2nd-order** | Beliefs about others' beliefs about self | "Alice thinks I believe she is a villager" | Second-order perspective transition (ReCon) [^346^] |
| **3rd-order+** | Higher-order recursive reasoning | "Alice thinks I think she suspects me" | A-ToM adaptive estimation [^305^] |

### 7.2 ReCon Dual-Perspective Reasoning (Complete Prompt Templates)

ReCon (Recursive Contemplation) is the most thoroughly validated prompt-based ToM framework for social deduction. It uses a two-stage process with explicit perspective transitions [^346^][^81^]:

**Stage 1: Formulation Contemplation**

```
FIRST-ORDER PERSPECTIVE TRANSITION PROMPT:
───────────────────────────────────────────
You're Player[id] with role[role].

Current situation: [current situation]. 
Current round game dialogue: [dialogue].

Your task is to:
Analyze [other players] based on game dialogues with roles: Werewolf, 
Villager, Seer, Doctor. Werewolves are evil; others are good.

Consider:
1. Quest Outcomes: Take into account the results of past missions/votes 
   to analyze players' roles.
2. Role List: Remember the possible roles in the game and their 
   alignments.
3. Level of Certainty: Use 'Certain' or 'Unknown' to gauge your 
   confidence in your role guesses.
4. Players Disclosing Evil Roles: Be cautious around players who have 
   openly claimed or hinted at being evil.
5. Prior Guesses: Reflect on your earlier estimations, but don't rely 
   solely on them.

Output: Updated role guesses G'_k for each player.
```

```
FORMULATION CONTEMPLATION PROMPT:
─────────────────────────────────
Respond in two stages: THINK and SPEAK

In THINK: Internally strategize using history and consider possible 
          deception. Understand your role's main objective and break it 
          down into chronological sub-goals based on game history. Your 
          thought process should follow these sub-goals for a systematic 
          approach.

In SPEAK: Organize your language based on your contemplation and speak 
          accordingly.

Output: T_k (private thought), S_k (public spoken content)
```

**Stage 2: Refinement Contemplation**

```
SECOND-ORDER PERSPECTIVE TRANSITION PROMPT:
────────────────────────────────────────────
You're Player[id] with role[role].

Current situation: [current situation].
Current round game dialogue: [dialogue].

Your original SPEAK content: [S_k]

Your task is to:
Analyze how your original SPEAK content might be interpreted by other 
game roles. Reflect on whether it may inadvertently reveal your 
role-specific clues.

Consider:
1. The perspectives of each game role, including their probable reactions 
   to your SPEAK content.
2. Any unique hints or clues in your original SPEAK that might disclose 
   your role.

Output: O_k (analysis of others' mental states about your speech)
```

```
REFINEMENT CONTEMPLATION PROMPT:
─────────────────────────────────
You're observing Player[id] with role[role].

Current situation: [current situation].
Current round game dialogue: [dialogue].

Your task is to:
1. Evaluate if Player[id]'s actions align with [role].
2. Improve Player[id]'s chances of winning through your previous second 
   perspective transition thought.
3. Keep role hints out of public dialogue.

Consider:
1. Target Outcome: Aim to achieve [desired result] as your role dictates.
2. Role Alignment: Evaluate whether your THINK and SPEAK contents align 
   well with your role in the current game state.
3. Strategy Reevaluation: Consider what changes could be made to your 
   THINK and SPEAK to improve winning chances as [role].
4. Public and Private Content: Remember that THINK contents are private, 
   while SPEAK contents are publicly visible. Strategize accordingly.

Output: T'_k (refined thought), S'_k (refined spoken content)
```

**Complete ReCon Pipeline:**
```
G'_k ← FirstOrderPerspectiveTransition(H, I_Rk, G_k)    [Eq. 1]
T_k, S_k ← Formulate(G'_k, H, I_Rk)                    [Eq. 2-3]
O_k ← SecondOrderPerspectiveTransition(S_k, I_Rk, H)   [Eq. 4]
T'_k, S'_k ← Refine(T_k, S_k, H, O_k, I_Rk)            [Eq. 5]
```

### 7.3 Adaptive Theory of Mind (A-ToM)

A-ToM addresses the critical finding that **misaligned ToM orders impair coordination** [^305^]:

- Two agents with mismatched ToM orders (e.g., both 1st-order) can suffer worse performance than 0-order agents
- A-ToM estimates partner's ToM order in real-time using Follow-the-Leader (FTL) algorithm
- Maintains multiple hypothetical agents, each representing a different ToM order
- Selects action that structurally aligns with estimated partner's ToM order

```
ALGORITHM: ToM Alignment via Follow-the-Leader (FTL) [^305^]
────────────────────────────────────────────────────────

Input: Environment M, ego agent π_i, candidate ToM orders K = {0, 1, 2}
       hypothetical ToM agents {π_j^(k)} for k ∈ K

Initialize: L(k) ← 0 for all k ∈ K (cumulative loss)

WHILE M is not terminated:
  1. Observe current state s
  2. FOR each k ∈ K:
       â_j^(k) ← π_j^(k)(s, b_j^(k))   // Predict partner's action
  3. k̂ ← argmin_k L(k)                // Select best-matching ToM order
     a^pred_j ← â_j^(k̂)                // Predicted partner action
  4. Acting: a_i^t ← π_i(s, a^pred_j)  // Ego action based on prediction
  5. t ← t + 1
  6. Observe true partner's action a_j^(t-1)
  7. FOR each k ∈ K:
       IF â_j^(k) == a_j^(t-1):
          L(k) ← L(k) + 1              // Update loss for matching orders
```

### 7.4 MultiMind ToM + MCTS Integration

MultiMind combines ToM with Monte Carlo Tree Search for strategic planning [^316^][^328^]:

```
ALGORITHM: ToM-Guided MCTS for Communication Strategy
──────────────────────────────────────────────────────

Input: Current game history H, agent index i, ToM model f_ToM

OBJECTIVE: Find action sequence A* that minimizes suspicion toward self
  A*_{t+1} = argmin_{A_{t+1}} Σ_{j≠i} B_{t+1}[j, i]

MCTS PROCEDURE:
  1. For each candidate action (statement, tone, facial expression):
     a. Simulate: Predict next belief state B_{t+1} = f_ToM(H ∪ {action})
     b. Evaluate: Compute suspicion cost = Σ_{j≠i} B_{t+1}[j, i]
     c. Backpropagate: Update action value with cost

  2. Select action with lowest expected suspicion cost

  3. Execute action and observe actual belief update
```

### 7.5 Hypothetical Minds (ToM for General Multi-Agent Tasks)

Hypothetical Minds provides a cognitively-inspired architecture for ToM scaffolding [^307^]:

```
Architecture Components:
├── Perception Module: Observes environment state
├── Memory Module: Stores interaction history + beliefs
├── Theory of Mind Module:
│   ├── Generates hypotheses about other agents' strategies (in natural language)
│   ├── Evaluates hypotheses by predicting behavior
│   ├── Reinforces hypotheses that make correct predictions
│   └── Iteratively refines understanding
├── Hierarchical Planning:
│   ├── High-level: Strategic goals (via ToM + MCTS)
│   └── Low-level: Tactical actions (via LLM generation)
└── Action Controller: Executes selected actions
```

---

## 8. Trust Network Architecture

### 8.1 Trust Network Data Structure

```json
{
  "trust_network": {
    "metadata": {
      "game_id": "uuid",
      "num_players": 8,
      "created_at": "2025-07-22T14:00:00Z"
    },
    "edges": [
      {
        "from": "p1",
        "to": "p2",
        "trust_score": 0.65,
        "confidence": 0.80,
        "evidence": [
          {
            "type": "consistent_statement",
            "round": 1,
            "weight": 0.15,
            "description": "p2's claim aligned with known facts"
          },
          {
            "type": "voting_alignment",
            "round": 2,
            "weight": 0.20,
            "description": "voted together against p4 who was werewolf"
          },
          {
            "type": "defense_under_pressure",
            "round": 3,
            "weight": 0.30,
            "description": "p2 defended me when I was falsely accused"
          }
        ],
        "last_updated": "2025-07-22T14:45:00Z",
        "decay_rate": 0.05
      }
    ],
    "aggregate_metrics": {
      "network_density": 0.75,
      "avg_trust": 0.52,
      "most_trusted": "p3",
      "most_distrusted": "p5",
      "clustering_coefficient": 0.68
    }
  }
}
```

### 8.2 Trust Score Update Algorithm

Based on Ev-Trust (game-theoretic trust mechanism) [^301^] and directed graph trust learning [^340^]:

```python
class TrustNetwork:
    """
    Directed weighted trust graph between players.
    Trust is asymmetric: trust[p1][p2] != trust[p2][p1]
    """
    
    def __init__(self, num_players):
        self.trust = np.ones((num_players, num_players)) * 0.5
        np.fill_diagonal(self.trust, 1.0)  # Self-trust is always 1.0
        self.evidence_log = defaultdict(list)
        self.decay_rates = np.ones((num_players, num_players)) * 0.05
    
    def update_from_observation(self, observer, target, observation_type, 
                                outcome, weight=1.0):
        """
        Update trust based on a single behavioral observation.
        
        Observation types and their trust impact:
        - 'statement_consistent': +0.1 (truth-telling signal)
        - 'statement_contradicted': -0.15 (deception signal)
        - 'vote_aligned_with_me': +0.08 (cooperation signal)
        - 'vote_against_me': -0.05 (conflict signal)
        - 'defended_me': +0.12 (loyalty signal)
        - 'accused_me_falsely': -0.18 (hostility signal)
        - 'role_claim_verified': +0.20 (strong verification)
        - 'role_claim_falsified': -0.25 (strong falsification)
        """
        impact = TRUST_IMPACT_TABLE[observation_type]
        
        # Game-theoretic update with recency weighting
        current_trust = self.trust[observer][target]
        new_trust = current_trust + weight * impact * (1 - abs(current_trust - 0.5))
        
        # Bound to [0, 1]
        self.trust[observer][target] = clip(new_trust, 0.0, 1.0)
        
        # Log evidence
        self.evidence_log[(observer, target)].append({
            'type': observation_type,
            'outcome': outcome,
            'weight': weight,
            'timestamp': now()
        })
    
    def propagate_trust(self, observer, max_hops=2):
        """
        Propagate trust through network (transitive trust).
        If I trust Alice and Alice trusts Bob, I should partially trust Bob.
        Based on Learning Trust Over Directed Graphs [^340^].
        """
        propagated = self.trust[observer].copy()
        
        for hop in range(1, max_hops + 1):
            for intermediate in range(self.num_players):
                if intermediate == observer:
                    continue
                trust_to_intermediate = self.trust[observer][intermediate]
                trust_from_intermediate = self.trust[intermediate]
                
                # Weighted propagation with decay per hop
                propagation_weight = trust_to_intermediate * (0.5 ** hop)
                propagated += propagation_weight * trust_from_intermediate
        
        return normalize(propagated)
    
    def apply_temporal_decay(self):
        """Apply forgetting curve decay to all trust scores."""
        for i in range(self.num_players):
            for j in range(self.num_players):
                if i != j:
                    age = now() - self.last_updated[i][j]
                    decay = self.decay_rates[i][j] * age_hours
                    # Decay toward neutral (0.5)
                    self.trust[i][j] = lerp(self.trust[i][j], 0.5, decay)
    
    def detect_trust_manipulation(self):
        """
        Detect agents attempting to game trust scores.
        Malicious agents may fake reliability to build trust then exploit it.
        [^308^][^301^]
        """
        for player in range(self.num_players):
            # Check for suspicious trust-building pattern:
            # Rapid trust gain followed by trust-violating behavior
            trust_trajectory = self.get_trust_trajectory_toward(player)
            if is_rapid_trust_build_then_betray(trust_trajectory):
                return Alert(f"Potential trust manipulation by player {player}")
```

### 8.3 Suspicion-Trust Duality

In Werewolf, suspicion and trust are dual representations:

```python
# Direct conversion: suspicion = 1 - trust
suspicion_matrix = 1.0 - trust_matrix

# But weighted by confidence (uncertainty)
def compute_effective_suspicion(trust, confidence):
    """
    High trust + high confidence → low effective suspicion
    High trust + low confidence → moderate effective suspicion (don't fully trust yet)
    Low trust + high confidence → high effective suspicion
    Low trust + low confidence → moderate effective suspicion (not sure)
    """
    uncertainty = 1.0 - confidence
    effective_suspicion = (1.0 - trust) * confidence + 0.5 * uncertainty
    return effective_suspicion
```

---

## 9. Memory Compression & Context Window Management

### 9.1 Multi-Layer Compression Pipeline

Based on the Focus Agent [^315^], Deep Agents SDK [^320^], and production patterns from OpenHands [^319^]:

```
┌─────────────────────────────────────────────────────────────────────┐
│               CONTEXT WINDOW MANAGEMENT PIPELINE                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Layer 0: Raw Recent Messages (always kept, ~30% of window)        │
│  ├─ Last 3-5 full dialogue turns in raw form                       │
│  ├─ Critical for maintaining conversational "rhythm"               │
│  └─ Prevents output quality degradation                            │
│                                                                     │
│  Layer 1: Tool Output Compaction (~40% token savings) [^320^]      │
│  ├─ Offload large tool responses (>20K tokens) to filesystem       │
│  ├─ Replace with: filepath + 10-line preview                       │
│  ├─ Reversible: agent can re-read full content via tool            │
│  └─ Trigger: immediate on large response                           │
│                                                                     │
│  Layer 2: Sliding Window with Importance Scoring [^66^]            │
│  ├─ Score each memory: recency * importance                        │
│  ├─ Importance: agent self-rated 1-10 scale                        │
│  ├─ Recency: half-cycle decay per game phase                       │
│  └─ Keep top-K by score; archive rest                              │
│                                                                     │
│  Layer 3: Active Context Compression [^315^]                       │
│  ├─ Agent autonomously decides when to compress                    │
│  ├─ start_focus + complete_focus primitives                        │
│  ├─ complete_focus generates summary:                             │
│  │   ├─ What was attempted?                                        │
│  │   ├─ What was learned? (facts, file paths, bugs)               │
│  │   └─ What was the outcome?                                      │
│  ├─ System appends summary to "Knowledge" block                    │
│  └─ Raw logs between checkpoint and current step are DELETED       │
│                                                                     │
│  Layer 4: LLM Summarization (last resort) [^319^]                  │
│  ├─ Trigger: context at 80% of window limit                       │
│  ├─ Use cheaper model (GPT-4o-mini, Claude Haiku)                 │
│  ├─ Summary preserves: key decisions, facts, strategic state       │
│  ├─ Summary discards: verbose outputs, failed attempts, reasoning │
│  └─ Incremental: only summarize oldest block, not everything       │
│                                                                     │
│  Layer 5: Structured Note-Taking [^325^]                           │
│  ├─ Agent maintains NOTES.md / game_state.json                    │
│  ├─ Written at key decision points                                 │
│  ├─ Read back after context resets                                 │
│  └─ Enables long-horizon strategy across context boundaries       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.2 Focus Agent: Active Compression Details

The Focus architecture [^315^] introduces two primitives to the ReAct loop:

```python
class FocusAgent:
    """
    Agent autonomously decides when to consolidate learnings and 
    prune raw interaction history. Inspired by Physarum polycephalum 
    (slime mold) exploring and retracting from dead ends.
    """
    
    def start_focus(self, investigation_topic):
        """Mark checkpoint: "Debug the database connection""""
        self.focus_checkpoint = len(self.conversation_history)
        self.focus_topic = investigation_topic
    
    def complete_focus(self):
        """
        Agent decides sub-task is done or hit dead end.
        Generates summary, appends to Knowledge block, 
        deletes raw messages between checkpoint and now.
        """
        summary = self.llm.generate_summary(
            history=self.conversation_history[self.focus_checkpoint:],
            topic=self.focus_topic,
            template="""
            Summarize this investigation:
            - What was attempted?
            - What was learned (facts, file paths, bugs)?
            - What was the outcome?
            """
        )
        
        # Append to persistent Knowledge block
        self.knowledge_block += f"\n## {self.focus_topic}\n{summary}\n"
        
        # PHYSICALLY DELETE raw messages (critical for token savings)
        del self.conversation_history[self.focus_checkpoint:]
        
        self.compression_count += 1
    
    # Results: 22.7% token reduction (14.9M → 11.5M tokens)
    #          6.0 autonomous compressions per task
    #          Up to 57% token savings on exploration-heavy tasks
    #          ZERO accuracy degradation (3/5 = 60% for both agents)
```

### 9.3 Context Management Best Practices

Based on Anthropic's effective context engineering [^325^] and Manus's context engineering patterns [^323^]:

| Priority | Always Keep | Compress When Needed | Summarize/Drop |
|----------|-----------|---------------------|----------------|
| **High** | Original game objective (win condition) | Recent 2-3 turns (full detail) | Tool outputs from 5+ turns ago |
| **Medium** | Current role and known information | Key decisions and their rationale | Intermediate chain-of-thought |
| **Low** | Running suspicion scores | Older vote records | Failed strategy attempts |
| **Drop** | — | — | Redundant confirmations, "I agree" statements |

**Key Principles** [^323^]:
- Prefer raw > Compaction > Summarization (only when compaction insufficient)
- Keep last 3 turns raw to preserve model's "rhythm"
- "Share memory by communicating, don't communicate by sharing memory" (GoLang concurrency principle)
- Spin up fresh sub-agents for discrete tasks rather than sharing full context
- Hierarchical action space: ~20 core tools stable, Level 2 sandbox utilities, Level 3 code packages

---

## 10. ReCon Dual-Perspective Reasoning

### 10.1 Complete Mathematical Formulation

The ReCon pipeline [^346^][^81^]:

```
For player k taking their turn:

1. FORMULATION CONTEMPLATION:
   G'_k ~ PT_1(· | H, I_Rk, G_k)          [First-order perspective transition]
   G_k ← G'_k                               [Update role guesses]
   T_k, S_k ~ Formulate(· | G'_k, H, I_Rk)  [Generate thought + speech]

2. REFINEMENT CONTEMPLATION:
   O_k ~ PT_2(· | S_k, I_Rk, H)            [Second-order perspective transition]
   T'_k, S'_k ~ Refine(· | T_k, S_k, H, O_k, I_Rk)  [Refine thought + speech]

Where:
   H = game history (dialogue, votes, night results)
   I_Rk = player k's role information
   G_k = player k's current role guesses about others
   PT_1 = first-order perspective transition (infer others' mental states from self)
   PT_2 = second-order perspective transition (infer how others perceive self)
   T_k, T'_k = private thoughts (original, refined)
   S_k, S'_k = public spoken content (original, refined)
   O_k = analysis of others' mental states
```

### 10.2 ReCon Evaluation Results

ReCon significantly outperforms CoT baseline across all six metrics [^81^]:

| Metric | Description | CoT | ReCon | Improvement |
|--------|------------|-----|-------|-------------|
| **CCL** | Concealment (hiding role) | Baseline | +++ | Formulation + Refinement both help |
| **LG** | Logic quality | Baseline | +++ | First-order PT critical |
| **CTR** | Contribution to team | Baseline | +++ | Second-order PT for team play |
| **PRS** | Persuasiveness | Baseline | +++ | Formulation contemplation helps |
| **INF** | Information value | Baseline | +++ | Both stages contribute |
| **CRT** | Creativity | Baseline | +++ | Second-order PT enables creativity |

**Key Findings**:
- Removing first-order perspective transition decreases performance across ALL metrics
- Removing second-order perspective transition decreases performance across ALL metrics
- GPT-3.5 + ReCon outperforms GPT-4 + CoT (showing mechanism > raw capability)
- ReCon more effective at detecting deception (helping "good" side) than creating deception
- Win rate shift: CoT 15%/85% (good/evil) → ReCon 19.4%/70.6%

### 10.3 ReCon Implementation for Werewolf

Adapted prompt templates for Werewolf (from Avalon originals):

```
WEREWOLF FIRST-ORDER PERSPECTIVE TRANSITION:
────────────────────────────────────────────
You're Player {id}, a {role} (Werewolf team).

Game History:
- Night 1: You eliminated Player 3
- Day 1 Discussion: Player 2 claimed Seer, said Player 4 is werewolf
- Day 1 Vote: Players 1,5 voted Player 4; Players 2,4,6 voted Player 1

Current dialogue this round: {dialogue}

Analyze each player:
1. What role do they likely have? (Werewolf, Villager, Seer, Doctor)
2. What team are they on? (Good/Evil)
3. How confident are you? (Certain/Probable/Uncertain)
4. What evidence supports your guess?
5. How have they behaved differently from their claimed role?

For each other player, output:
- Player ID, Guessed Role, Confidence, Key Evidence
```

```
WEREWOLF SECOND-ORDER PERSPECTIVE TRANSITION:
──────────────────────────────────────────────
Your planned statement: "I think we should trust Player 2's Seer claim 
because they were very specific about Player 4."

Now analyze how EACH other player would perceive this statement:

For Player 2 (claimed Seer):
- Would they think you're supporting them genuinely or trying to ally?
- Could this reveal you're not a Villager (who should be skeptical)?

For Player 4 (accused):
- Would they think you're piling on or being fair?
- How would a Werewolf react vs. how would a Villager react?

For Player 5 (quiet observer):
- Would they see this as leadership or manipulation?
- What would make them trust vs. suspect you?

Does your planned statement inadvertently reveal your werewolf identity?
If yes, how can you modify it to sound more like a genuine Villager?

Output: Refined statement + reasoning for changes
```

---

## 11. Complete Memory Storage Schemas

### 11.1 Per-Game Session Memory (Episodic)

```json
{
  "session_memory": {
    "game_id": "uuid",
    "started_at": "timestamp",
    "ended_at": "timestamp",
    "my_role": "werewolf",
    "outcome": "win|loss|draw",
    "total_rounds": 5,
    "key_episodes": [
      {
        "episode_id": "uuid",
        "type": "night_action",
        "round": 1,
        "description": "Eliminated Player 3 (the Seer)",
        "strategic_significance": 10,
        "consequences": ["Removed info-gathering threat", "Seer never revealed check results"],
        "players_involved": ["p3"],
        "my_emotion": "satisfaction",
        "retrieval_count": 5
      },
      {
        "episode_id": "uuid",
        "type": "social_interaction",
        "round": 2,
        "description": "Player 2 falsely claimed Seer - I supported their claim to build trust",
        "strategic_significance": 8,
        "consequences": ["Gained trust of Player 2", "Villagers wasted vote on wrong target"],
        "deception_used": "false_agreement_with_wrong_claim",
        "players_involved": ["p2"],
        "my_emotion": "tension",
        "retrieval_count": 3
      }
    ],
    "player_observations": {
      "p2": {
        "claimed_role": "seer",
        "actual_role": "villager",
        "speaking_style": "confident_but_incorrect",
        "trustworthiness": 0.30,
        "deception_detected": false,
        "my_interaction_summary": "Supported their false claim for strategic advantage"
      },
      "p4": {
        "claimed_role": "villager",
        "actual_role": "doctor",
        "speaking_style": "quiet_defensive",
        "trustworthiness": 0.65,
        "deception_detected": false,
        "my_interaction_summary": "Successfully framed as suspicious, eliminated in round 3"
      }
    },
    "strategic_reflection": {
      "what_worked": ["Supporting false Seer claim", "Eliminating real Seer night 1", "Maintaining low profile"],
      "what_failed": ["Almost contradicted teammate's story"],
      "lessons_for_future": ["Always coordinate night kill targets with teammates", "When supporting false claims, add specific fabricated details"],
      "emotional_arc": ["confident", "tense", "relieved", "triumphant"]
    },
    "embedding_vector": [0.23, -0.45, 0.89, ...]
  }
}
```

### 11.2 Cross-Game Persistent Memory (Long-Term)

```json
{
  "persistent_memory": {
    "player_models": {
      "alice": {
        "first_seen": "2025-01-15",
        "games_played_with": 23,
        "reliability": 0.72,
        "deception_rate": 0.31,
        "tell_patterns": {
          "as_werewolf": ["over_justifies_votes", "deflects_with_questions"],
          "as_villager": ["shares_reasoning_openly", "consistent_voting"]
        },
        "trust_history": [
          {"game": 1, "my_trust": 0.5, "they_were": "villager"},
          {"game": 5, "my_trust": 0.8, "they_were": "villager", "betrayed": false},
          {"game": 12, "my_trust": 0.9, "they_were": "werewolf", "betrayed": true}
        ],
        "communication_style": "analytical, asks probing questions",
        "optimal_counter_strategy": "don't_share_info_early, verify_claims_independently"
      }
    },
    "strategy_effectiveness": {
      "false_seer_claim_as_werewolf": {
        "times_used": 8,
        "win_rate": 0.75,
        "avg_lifespan_rounds": 4.2,
        "best_against": ["passive_villagers", "inexperienced_players"],
        "worst_against": ["active_seers", "aggressive_accusers"]
      },
      "early_seer_reveal": {
        "times_used": 5,
        "win_rate_as_seer": 0.40,
        "survival_rate": 0.20,
        "risk_assessment": "high_risk_high_reward"
      }
    },
    "personal_performance": {
      "total_games": 150,
      "win_rate_by_role": {
        "werewolf": 0.68,
        "villager": 0.45,
        "seer": 0.52,
        "doctor": 0.58
      },
      "avg_survival_rounds_by_role": {
        "werewolf": 4.8,
        "villager": 3.2,
        "seer": 2.9,
        "doctor": 3.7
      },
      "improvement_trends": {
        "deception_detection": "improving",
        "persuasion_effectiveness": "stable",
        "survival_rate": "improving"
      }
    }
  }
}
```

### 11.3 Semantic Knowledge Base (Game Rules & Strategies)

```json
{
  "semantic_knowledge": {
    "game_configurations": {
      "standard_8player": {
        "roles": {"werewolf": 2, "villager": 4, "seer": 1, "doctor": 1},
        "werewolf_win_condition": "werewolf_count >= villager_count",
        "villager_win_condition": "all_werewolves_eliminated"
      }
    },
    "role_strategies": {
      "werewolf": {
        "early_game": [
          {"strategy": "lay_low", "description": "Minimal statements, avoid attention", "risk": "low", "when": "strong_players_present"},
          {"strategy": "false_claim", "description": "Claim Seer/Villager with fabricated info", "risk": "high", "when": "real_special_role_dead_or_quiet"}
        ],
        "mid_game": [
          {"strategy": "bus_teammate", "description": "Vote out werewolf teammate to gain trust", "risk": "medium", "when": "teammate_about_to_be_eliminated_anyway"},
          {"strategy": "coordinate_kill", "description": "Night kill targets strategically chosen", "risk": "low", "when": "always"}
        ],
        "late_game": [
          {"strategy": "final_push", "description": "Aggressive accusations when numbers are close", "risk": "high", "when": "werewolves_almost_winning"}
        ]
      },
      "villager": {
        "early_game": [
          {"strategy": "observe_and_listen", "description": "Watch for inconsistencies, minimal claims", "risk": "low"}
        ],
        "mid_game": [
          {"strategy": "form_coalition", "description": "Identify trusted players, vote together", "risk": "medium"}
        ]
      },
      "seer": {
        "check_priority": ["most_suspicious", "most_trusted", "claimed_special"],
        "reveal_timing": {
          "early": {"when": "found_werewolf_and_have_support", "risk": "high"},
          "late": {"when": "about_to_be_eliminated", "risk": "medium"}
        }
      }
    },
    "meta_patterns": {
      "voting_coalition_signals": "players_who_vote_together_3+_times_likely_allied",
      "defensive_overreaction": "players_who_defend_themselves_excessively_often_guilty",
      "information_hedging": "players_who_withhold_specifics_may_have_info_to_hide",
      "trust_cascade": "once_a_leader_is_trusted_their_targets_gain_suspicion"
    }
  }
}
```

---

## 12. Integration Architecture for Werewolf Platform

### 12.1 Complete Agent Memory Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PER-TURN MEMORY PIPELINE                              │
│                                                                         │
│  INPUT: Game state update + new messages                                │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 1. STM UPDATE                                                   │   │
│  │    - Append new messages to conversation_history                │   │
│  │    - Update current phase, alive players                        │   │
│  │    - Record vote if voting phase                                │   │
│  │    - O(1) operation                                             │   │
│  └──────────────────────────┬──────────────────────────────────────┘   │
│                             │                                           │
│  ┌──────────────────────────▼──────────────────────────────────────┐   │
│  │ 2. BELIEF TRACKING UPDATE                                       │   │
│  │    - LLM analyzes new statements (deception, consistency)       │   │
│  │    - Update suspicion scores (WOLF exponential smoothing)       │   │
│  │    - Update role probabilities (Bayesian + constraints)         │   │
│  │    - Update belief matrix (MultiMind ToM model)                 │   │
│  │    - LLM call + matrix computation                              │   │
│  └──────────────────────────┬──────────────────────────────────────┘   │
│                             │                                           │
│  ┌──────────────────────────▼──────────────────────────────────────┐   │
│  │ 3. TRUST NETWORK UPDATE                                         │   │
│  │    - Evaluate behavioral observations (vote alignment, etc.)    │   │
│  │    - Update trust scores with evidence logging                  │   │
│  │    - Propagate trust through network (2-hop max)                │   │
│  │    - Detect trust manipulation patterns                        │   │
│  │    - Graph algorithm + evidence tracking                        │   │
│  └──────────────────────────┬──────────────────────────────────────┘   │
│                             │                                           │
│  ┌──────────────────────────▼──────────────────────────────────────┐   │
│  │ 4. THEORY OF MIND REASONING                                     │   │
│  │    - First-order PT: infer others' roles from self-perspective  │   │
│  │    - Formulate: generate initial thought + speech (ReCon)       │   │
│  │    - Second-order PT: infer how others perceive my speech       │   │
│  │    - Refine: adjust speech to minimize self-exposure (ReCon)    │   │
│  │    - 4 LLM calls (or 2 if GPT-3.5 for PT1 + GPT-4 for PT2)     │   │
│  └──────────────────────────┬──────────────────────────────────────┘   │
│                             │                                           │
│  ┌──────────────────────────▼──────────────────────────────────────┐   │
│  │ 5. EPISODIC MEMORY UPDATE (conditional)                         │   │
│  │    - If key event (night kill, seer check, betrayal):           │   │
│  │      • Generate importance score (1-10)                         │   │
│  │      • Create episodic memory entry with embedding              │   │
│  │      • Store in vector database                                  │   │
│  │    - If strategic reflection needed:                            │   │
│  │      • Generate verbal reflection (Reflexion-style)             │   │
│  │      • Add to episodic memory buffer                            │   │
│  │    - Vector DB write + optional LLM call                        │   │
│  └──────────────────────────┬──────────────────────────────────────┘   │
│                             │                                           │
│  ┌──────────────────────────▼──────────────────────────────────────┐   │
│  │ 6. CONTEXT COMPRESSION (when needed)                            │   │
│  │    - Check context size against threshold (80% of limit)        │   │
│  │    - If exceeded:                                                │   │
│  │      • Offload large tool outputs to filesystem                 │   │
│  │      • Apply importance-weighted sliding window                 │   │
│  │      • If still needed: LLM summarization of oldest block       │   │
│  │    - Update knowledge block with compressed state               │   │
│  │    - Conditional, only when threshold exceeded                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  OUTPUT: Action (statement, vote, or night action) + updated memories   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Cost-Performance Optimization

For a production Werewolf platform with 8 agents making 200+ API calls per game:

| Component | Calls/Game | Model | Est. Cost/Game | Optimizations |
|-----------|-----------|-------|---------------|---------------|
| STM Update | ~200 | N/A (in-memory) | $0 | InMemoryMemory [^61^] |
| Belief Tracking | ~80 | GPT-4o-mini | ~$1.20 | Batch statement analysis |
| ToM Reasoning | ~60 | GPT-3.5 + GPT-4 | ~$3.00 | PT1 with 3.5, PT2 with 4 |
| Episodic Storage | ~20 | GPT-4o-mini | ~$0.30 | Only key events trigger |
| Trust Updates | ~200 | N/A (algorithmic) | $0 | Pure computation |
| Context Compression | ~10 | GPT-4o-mini | ~$0.15 | Only when needed |
| **TOTAL** | **~570** | **Mixed** | **~$4.65** | With prompt caching: **~$2.80** |

Key optimizations [^24^][^25^]:
- **Prompt caching**: 59-90% cost reduction on repeated system prompts
- **Model routing**: GPT-3.5 for simple tasks, GPT-4 only for ToM refinement
- **Context compaction**: 22-57% token reduction via active compression
- **Batch processing**: Group multiple statement analyses into single calls

### 12.3 Data Flow Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Game Engine │────►│  Agent Core  │────►│    LLM API   │
│  (Unity/     │     │  (Memory +   │     │  (GPT-4o/    │
│   FastAPI)   │◄────│   Reasoning) │◄────│   Claude)    │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Vector   │  │ Graph    │  │ Filesystem│
        │ Database │  │ Database │  │ (Notes,  │
        │(Qdrant)  │  │(Neo4j)   │  │ summaries)│
        └──────────┘  └──────────┘  └──────────┘
        (Episodic)    (Trust Net)   (Compressed)
        (Semantic)    (Player      (Context
        (Long-term)    Profiles)    Offload)
```

---

## 13. Source Index

[^17^]: arXiv - "Agentic Memory: Learning Unified Long-Term and Short-Term Memory Management for LLM Agents" (Jan 2026). https://arxiv.org/html/2601.01885v2

[^21^]: Medium - "How to Setup Memory in an LLM Agent" (Jan 2025). https://medium.com/@aydinKerem/how-to-setup-memory-in-an-llm-agent-3efdc5d56169

[^22^]: MongoDB - "What Is Agent Memory? A Guide to Enhancing AI Learning and Recall" (Jan 2025). https://www.mongodb.com/resources/basics/artificial-intelligence/agent-memory

[^24^]: ProjectDiscovery - "How We Cut LLM Costs by 59% With Prompt Caching" (Apr 2026). https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching

[^25^]: MorphLLM - "LLM Cost Optimization: 5 Levers to Cut API Spend 70-85%" (Mar 2026). https://www.morphllm.com/llm-cost-optimization

[^61^]: Alibaba Cloud - "What? My Werewolf Game Skills Are Worse Than AI's?" (Jan 2026). https://www.alibabacloud.com/blog/what-my-werewolf-game-skills-are-worse-than-ais_602815

[^66^]: ACM - "An Agent-Based Framework Using Werewolf in Unity" (Sep 2025). https://dl.acm.org/doi/full/10.1145/3723498.3723702

[^81^]: OpenReview - "AVALON'S GAME OF THOUGHTS" (COLM 2024). https://openreview.net/pdf/6bf2dd908e405e25cc9ad480b9263b560be34740.pdf

[^151^]: arXiv - "WOLF: Werewolf-based Observations for LLM Deception and Falsehoods" (Dec 2025). https://arxiv.org/html/2512.09187v1

[^244^]: arXiv - "Agentic Memory: Learning Unified Long-Term and Short-Term Memory Management for LLM Agents" (Jan 2026). https://arxiv.org/html/2601.01885v1

[^300^]: arXiv - "Trust, Lies, and Long Memories: Emergent Social Dynamics and Reputation in Multi-Round Avalon with LLM Agents" (Apr 2026). https://arxiv.org/html/2604.20582v1

[^301^]: arXiv - "Ev-Trust: A Strategy Equilibrium Trust Mechanism for Evolutionary Games in LLM-Based Multi-Agent Services" (Dec 2025). https://arxiv.org/html/2512.16167v1

[^302^]: arXiv - "Revac: A Social Deduction Reasoning Agent" (2025). https://arxiv.org/pdf/2604.19523

[^303^]: Centron - "Episodic Memory in AI Agents: Long-Term Context & Learning" (Feb 2026). https://www.centron.de/en/tutorial/episodic-memory-in-ai-agents-long-term-context-learning/

[^304^]: GitHub - "Awesome Agentic Patterns: Memory Reinforcement Learning (MemRL)" (Jan 2026). https://github.com/nibzard/awesome-agentic-patterns/blob/main/patterns/memory-reinforcement-learning-memrl.md

[^305^]: AAAI - "Adaptive Theory of Mind for LLM-based Multi-Agent Coordination" (2025). https://ojs.aaai.org/index.php/AAAI/article/view/40204/44165

[^306^]: CMU - "Theory of Mind in Multi-Agent Systems" (PhD Dissertation, 2025). https://ml.cmu.edu/research/phd-dissertation-pdfs/ioguntol_phd_mld_2025.pdf

[^307^]: NeurIPS - "Scaffolding Theory of Mind for Multi-Agent Tasks with Large Language Models" (2024). https://neurips.cc/virtual/2024/100957

[^308^]: Milvus - "What is the role of trust in multi-agent systems?" (Mar 2026). https://milvus.io/ai-quick-reference/what-is-the-role-of-trust-in-multiagent-systems

[^309^]: NLPer - "Theory of Mind in Multi-Agent LLM Collaboration" (Jul 2025). https://nlper.com/2025/07/24/theory-of-mind-multiagent-llm-collaboration/

[^310^]: PMC - "Modeling the Role of Working Memory and Episodic Memory in Reinforcement Learning" https://pmc.ncbi.nlm.nih.gov/articles/PMC2376903/

[^311^]: ACL - "Theory of Mind for Multi-Agent Collaboration via Large Language Models" (EMNLP 2023). https://aclanthology.org/2023.emnlp-main.13.pdf

[^312^]: arXiv - "A Game-Theoretic Approach to Multi-Agent Trust Region Optimization" (Jun 2021). https://arxiv.org/abs/2106.06828

[^314^]: arXiv - "Self-Evolving Agents via Runtime Reinforcement Learning on Episodic Memory" (Feb 2026). https://arxiv.org/html/2601.03192v2

[^315^]: arXiv - "Active Context Compression: Autonomous Memory Management in LLM Agents" (Jan 2026). https://arxiv.org/html/2601.07190v1

[^316^]: arXiv - "MultiMind: Enhancing Werewolf Agents with Multimodal Reasoning and Theory of Mind" (Apr 2025). https://arxiv.org/abs/2504.18039

[^318^]: YouTube - "The Agent Memory Compressor: Architecting Infinite Context" (Apr 2026). https://www.youtube.com/watch?v=UOgkYLF11KA

[^319^]: GitHub - "Feature: LLM-Based Context Condensation for Long Sessions" (Mar 2026). https://github.com/NousResearch/hermes-agent/issues/480

[^320^]: LangChain - "Context Management for Deep Agents" (Jan 2026). https://www.langchain.com/blog/context-management-for-deepagents

[^323^]: Phil Schmid - "Context Engineering for AI Agents: Part 2" (Dec 2025). https://www.philschmid.de/context-engineering-part-2

[^325^]: Anthropic - "Effective context engineering for AI agents" (Sep 2025). https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

[^326^]: ACS - "An Analysis and Comparison of ACT-R and Soar" (2021). https://advancesincognitivesystems.github.io/acs2021/data/ACS-21_paper_6.pdf

[^328^]: arXiv - MultiMind Paper (PDF with ToM model details). https://arxiv.org/pdf/2504.18039

[^329^]: Dev.to - "Beyond the Hype: Building a Practical AI Memory System with Vector Databases" (Mar 2026). https://dev.to/midas126/beyond-the-hype-building-a-practical-ai-memory-system-with-vector-databases-17oc

[^330^]: arXiv - "Reflexion: Language Agents with Verbal Reinforcement Learning" (Mar 2023). https://arxiv.org/abs/2303.11366

[^331^]: Machine Learning Mastery - "Vector Databases vs. Graph RAG for Agent Memory" (Mar 2026). https://machinelearningmastery.com/vector-databases-vs-graph-rag-for-agent-memory-when-to-use-which/

[^332^]: ACM - "Reflexion: Language Agents with Verbal Reinforcement Learning" (NeurIPS 2023). https://dl.acm.org/doi/10.5555/3666122.3666499

[^333^]: CSDN - "Reflexion论文理解" (Sep 2024). https://agent.csdn.net/67d7f1e11056564ee2462326.html

[^335^]: Mem0 - "Architectures, Vector Stores, and GraphRAG" (Jan 2026). https://mem0.ai/blog/what-is-ai-agent-memory

[^336^]: arXiv - "Agentic Memory: Learning Unified Long-Term and Short-Term Memory Management for Large Language Model Agents" (Jan 2026). https://arxiv.org/abs/2601.01885

[^337^]: arXiv - "Mem0: Building Production-Ready AI Agents" (2025). https://arxiv.org/pdf/2504.19413

[^338^]: Atlan - "How to Implement Long-Term Memory for AI Agents" (Apr 2026). https://atlan.com/know/how-to-implement-long-term-memory-ai-agents/

[^339^]: Atlan - "Best AI Agent Memory Frameworks in 2026" (Apr 2026). https://atlan.com/know/best-ai-agent-memory-frameworks-2026/

[^340^]: Harvard - "Learning Trust Over Directed Graphs in Multiagent Systems" https://react.seas.harvard.edu/sites/projects.iq.harvard.edu/files/react/files/learning_trust_over_directed_graphs.pdf

[^341^]: Kuma Blog - "Agentic Memory (AgeMem) Study Notes" (Jan 2026). https://snowan.gitbook.io/study-notes/ai-manga-learnings/agentic-memory/agentic-memory

[^342^]: arXiv - "Bayesian Social Deduction with Graph-Informed Language Models" (Apr 2026). https://arxiv.org/html/2506.17788v2

[^344^]: arXiv - "Learning Strategic Language Agents in the Werewolf Game with Iterative Latent Space Policy Optimization" (2025). https://arxiv.org/html/2502.04686v2

[^346^]: ACL - "Boosting LLM Agents with Recursive Contemplation for Hidden-Role Games" (ACL 2024 Findings). https://aclanthology.org/2024.findings-acl.591.pdf

---

*Document compiled from 18 independent web searches and 35+ primary sources. All findings include citations [^number^] for traceability.*
