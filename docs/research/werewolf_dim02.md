## Dimension: AI Agent Framework & LLM Integration

*Deep-dive technical specification for agent architectures, LLM integration layer, prompt engineering, and cost optimization for the Werewolf multiplayer game platform.*

**Research Date**: 2026-07-24
**Searches Conducted**: 17 independent queries across agent architectures, A2A protocol, model routing, prompt caching, cost optimization, personality configuration, JSON schemas, and latency management
**Sources Found**: 40+ primary sources (arXiv papers, official documentation, production case studies, protocol specifications)

---

## Table of Contents

1. [Agent Type Comparison](#1-agent-type-comparison)
2. [API Abstraction Layer](#2-api-abstraction-layer-a2a-protocol-vs-custom)
3. [Prompt Templates by Role](#3-prompt-templates-by-role)
4. [JSON Action Output Schemas](#4-json-action-output-schemas)
5. [Model Selection Strategy](#5-model-selection-strategy)
6. [Cost Optimization Framework](#6-cost-optimization-framework)
7. [Turn-Based vs Real-Time Decision Handling](#7-turn-based-vs-real-time-decision-handling)
8. [LLM Latency Management](#8-llm-latency-management)
9. [Agent Personality Configuration System](#9-agent-personality-configuration-system)
10. [Implementation Pseudocode](#10-implementation-pseudocode)

---

## 1. Agent Type Comparison

### 1.1 Three-Tier Agent Architecture

The platform supports three agent types, each suited for different use cases and player skill levels.

| Dimension | Rule-Based (Decision Trees) | Personality-Driven (Trait-Based) | LLM-Powered (Prompt-Based) |
|-----------|---------------------------|--------------------------------|--------------------------|
| **Core Logic** | Hardcoded if-then-else trees + finite state machines [^205^] | Big Five/MBTI trait vectors driving probabilistic decisions [^179^][^248^] | Full LLM reasoning with structured prompting [^127^][^39^] |
| **Decision Speed** | <1ms (instant) | <10ms (fast) | 0.5-5s (API-dependent) [^228^] |
| **Strategic Depth** | Low - follows predefined heuristics | Medium - emergent behavior from trait interactions | High - human-like reasoning, persuasion, deception [^127^] |
| **Resource Cost** | Negligible (CPU only) | Low (lightweight scoring) | $0.01-0.15 per decision [^167^] |
| **Implementation Complexity** | Low | Medium | High |
| **Scalability** | Excellent (1000s concurrent) | Excellent (1000s concurrent) | Limited by API rate limits |
| **Human-Likeness** | Low - predictable patterns | Medium - personality-driven dialogue | High - nuanced reasoning [^64^] |
| **Best Use Case** | Tutorial bots, offline practice, beginner opponents | Casual multiplayer, roleplay-heavy modes | Competitive multiplayer, tournaments |

### 1.2 Hybrid Architecture Recommendation

Research strongly supports a **tiered hybrid approach** combining all three agent types [^205^][^210^][^214^]:

```
Input: Game state + player preferences
  |
  v
[Routing Layer]
  |-- Easy mode / tutorial --> Rule-Based Agent
  |-- Casual / social mode --> Personality-Driven Agent
  |-- Competitive / tournament --> LLM-Powered Agent
  |-- Mixed lobby --> All three types in same game
```

The neuro-symbolic hybrid architecture achieves **+7.2% entailment consistency** and **+5.3% multi-step accuracy** over pure LLM approaches by embedding decision trees as callable oracles within the LLM reasoning loop [^205^]. This validates the hybrid approach for Werewolf where rule-based guardrails can enforce game logic while LLMs handle social reasoning.

### 1.3 Agent Type Selection Matrix

| Game Mode | Recommended Agent | Reasoning |
|-----------|-----------------|-----------|
| Tutorial / Solo Practice | Rule-Based | Fast, predictable, teaches fundamentals |
| Casual 4-6 Player Social | Personality-Driven | Rich character interactions, low cost |
| Competitive 8-12 Player | LLM-Powered | Strategic depth, persuasion, deception |
| Tournament / Spectator | LLM-Powered + LLM-as-Judge | Full strategic expression + evaluation [^1^] |
| Mixed Skill Lobby | Hybrid (all types) | Balanced challenge across skill levels |

---

## 2. API Abstraction Layer: A2A Protocol vs Custom

### 2.1 Protocol Comparison

| Dimension | Google A2A Protocol | Custom REST/WS API | MCP (Model Context Protocol) |
|-----------|--------------------|--------------------|------------------------------|
| **Standardization** | Open standard, Linux Foundation-governed, 150+ supporters [^14^][^204^] | Fully controlled | Anthropic-led, tool-focused [^202^] |
| **Discovery** | Agent Cards at `/.well-known/agent.json` [^173^] | Manual registration | Tool enumeration |
| **Communication** | HTTP/JSON-RPC 2.0 + SSE streaming [^173^] | Any (REST, WebSocket, gRPC) | Client-server |
| **Scope** | Agent-to-agent coordination [^202^][^207^] | Internal game server | Agent-to-tool |
| **Latency** | ~10-50ms overhead (HTTP) | Optimizable (<5ms) | ~5-20ms |
| **Interoperability** | Cross-vendor, cross-framework [^208^] | Requires custom clients | Tool ecosystem |
| **Best For** | Multi-agent tournaments, BYOA | Production game server | External tool integration |

### 2.2 Werewolf Platform Architecture

The recommended architecture uses **A2A for inter-agent coordination** and **custom WebSocket API for real-time game state**:

```
                    ┌─────────────────────────────────────┐
                    │      GAME ORCHESTRATOR (Green)       │
                    │  ┌──────────┐  ┌─────────────────┐  │
                    │  │ FastAPI  │  │ Game State Mgr  │  │
                    │  │ A2A Svr  │  │ (Night/Day/Vote)│  │
                    │  └──────────┘  └─────────────────┘  │
                    └─────────────────┬─────────────────────┘
                                      │ A2A Protocol (HTTP)
                      ┌───────────────┼───────────────┐
                      ▼               ▼               ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │ Purple Agent │ │ Purple Agent │ │ Purple Agent │
            │ (LLM + A2A)  │ │ (LLM + A2A)  │ │ (Personality)│
            └──────────────┘ └──────────────┘ └──────────────┘
                      │               │               │
                      └───────────────┼───────────────┘
                                      │ WebSocket (Real-time)
                                      ▼
                    ┌─────────────────────────────────────┐
                    │      CLIENT APPLICATIONS             │
                    │  Web UI  │  Mobile  │  Spectator    │
                    └─────────────────────────────────────┘
```

### 2.3 A2A Agent Card Specification

Each agent exposes its capabilities via an Agent Card [^173^][^208^]:

```json
{
  "name": "werewolf-purple-agent",
  "description": "LLM-powered Werewolf player agent with personality-driven decision making",
  "url": "http://localhost:9010",
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": false
  },
  "skills": [
    {
      "id": "werewolf_play",
      "name": "Werewolf Gameplay",
      "description": "Participate in Werewolf games: debate, vote, and execute night actions",
      "tags": ["social_deduction", "werewolf", "debate"],
      "examples": [
        "Vote to eliminate a suspected werewolf",
        "Defend yourself against accusations",
        "Coordinate with werewolf teammates at night"
      ]
    }
  ]
}
```

### 2.4 API Endpoint Design

| Endpoint | Method | Description | Payload |
|----------|--------|-------------|---------|
| `/.well-known/agent-card.json` | GET | Agent capability discovery | AgentCard JSON |
| `/a2a` | POST | Task delegation (role assignment, action request) | A2A Task envelope |
| `/events` | WebSocket | Real-time game state streaming | GameState JSON |
| `/game/action` | POST | Submit action (vote, speak, night action) | ActionSchema JSON |
| `/game/status` | GET | Query current game phase and status | GameStatus JSON |

---

## 3. Prompt Templates by Role

### 3.1 Master Prompt Template Structure

All role prompts follow a consistent spec-pattern structure [^15^][^18^]:

```
## Role Identity (required)
You are Player {player_id}, a {role_name} in a game of Werewolf.

## Game Rules (required)
{role-specific rules, abilities, win conditions}

## Core Objectives (required)
{what this role needs to achieve to win}

## Context (current game state)
- Day/Night: {phase}
- Alive players: {list}
- Dead players: {list}
- Your observations: {memory stream}

## Response Format (required)
Please reply using the following JSON format:
{json_schema}

## Personality Configuration (optional)
{trait-based behavior modifiers}
```

### 3.2 Werewolf Role Prompt

```
## Role Identity
You are Player {player_id}, a **Werewolf**. Your werewolf teammates are: {teammate_list}.

## Core Objectives
1. Hide your Werewolf identity and survive until the end
2. Eliminate Villagers at night through coordinated kills
3. Mislead good players during day discussions to get them voted out
4. Coordinate with your Werewolf teammates to create logical confusion

## Strategic Guidance
Strategy A - Bold Werewolf (Impersonating the Seer):
  - Claim Seer in the first round, giving false investigation results
  - Speak with firm confidence, accusing opponents of "impostor Seers"
  - Risk: High reward but easily exposed if real Seer contradicts

Strategy B - Deep Cover Werewolf (Disguised as Villager):
  - Speak concisely, avoid becoming the focus of attention
  - Act like an ordinary villager earnestly trying to find Werewolves
  - Risk: Lower impact but harder to detect

Strategy C - Aggressive Accuser:
  - Accuse others to create chaos and divert suspicion from yourself
  - Target players who are gaining trust or have special roles
  - Risk: May draw counter-accusations

## Current Night Action
Choose a player to eliminate. Consider:
- Target players who are most suspicious of you or your teammates
- Avoid targeting players who others already suspect (may be protected)
- Coordinate with teammates if you have conflicting opinions

## Response Format
{
  "reasoning": "Brief strategic analysis (private, never revealed)",
  "action": "kill player_N",
  "public_statement": "What you say to other players (only used during day phase)"
}
```

### 3.3 Villager Role Prompt

```
## Role Identity
You are Player {player_id}, a **Villager**. You have no special abilities.

## Core Objectives
1. Identify and vote out all Werewolves
2. Avoid being falsely accused and eliminated
3. Support the Seer and Doctor by voting wisely
4. Contribute meaningful observations to discussions

## Strategic Guidance
- Pay attention to voting patterns and who defends whom
- Players who are too quiet or too aggressive may be suspicious
- Cross-reference claims - contradictions often reveal Werewolves
- Don't blindly trust anyone, even players who seem helpful
- If the Seer reveals themselves, protect them with your votes

## Day Discussion
Share your observations and suspicions. Ask probing questions.
Be persuasive but not domineering. Build alliances with trusted players.

## Response Format
{
  "reasoning": "Your private analysis of the situation",
  "suspicion_scores": {"player_1": 0.3, "player_2": 0.8, ...},
  "action": "vote player_N OR abstain",
  "public_statement": "Your statement to all players during discussion"
}
```

### 3.4 Seer Role Prompt

```
## Role Identity
You are Player {player_id}, the **Seer**. Each night, you can investigate
one player to learn if they are a Werewolf.

## Core Objectives
1. Identify Werewolves through nightly investigations
2. Reveal your findings strategically (not too early, not too late)
3. Avoid being killed by Werewolves - you are their #1 target
4. Build enough trust that the village believes your claims

## Investigation History
{history of past investigations and results}

## Strategic Guidance
- Revealing too early makes you a target; revealing too late wastes info
- If you find a Werewolf, build a case against them gradually
- If you find an innocent, note them as trusted allies
- Consider claiming publicly only when you have solid evidence
- The Doctor cannot protect you every night - be cautious

## Response Format
{
  "reasoning": "Strategic analysis of who to investigate",
  "action": "investigate player_N",
  "investigation_result": "player_N is/is_not a Werewolf (filled by game engine)",
  "public_statement": "Your carefully crafted daytime statement"
}
```

### 3.5 Doctor Role Prompt

```
## Role Identity
You are Player {player_id}, the **Doctor**. Each night, you can protect
one player (including yourself) from Werewolf attacks.

## Core Objectives
1. Protect the most valuable players (especially the Seer if known)
2. Survive yourself - you can't protect anyone if dead
3. Avoid revealing your role unless absolutely necessary
4. Track who dies to infer Werewolf targeting patterns

## Protection History
{history of protections and outcomes}

## Response Format
{
  "reasoning": "Who to protect tonight and why",
  "action": "protect player_N",
  "public_statement": "Your daytime contribution (careful not to reveal role)"
}
```

### 3.6 Style Conditioning Prompts

For population-based training with diverse play styles [^39^][^64^]:

**Werewolf Styles:**
- Quiet Follower: "As a Werewolf, be a quiet follower that lays low and follows others' opinions to avoid drawing attention."
- Active Contributor: "As a Werewolf, actively engage in discussion and pretend to be a Villager by looking for Werewolves."
- Aggressive Accuser: "As a Werewolf, accuse others to create chaos and divert suspicion from yourself."

**Villager Styles:**
- Secretive Player: "Hide your role to gather more information safely."
- Proactive Player: "Reveal your identity once you obtain crucial information."
- Default Player: No additional prompt.

---

## 4. JSON Action Output Schemas

### 4.1 Schema Overview

All agent outputs must conform to validated JSON schemas. OpenAI's Structured Outputs (`response_format` with `json_schema` + `strict: true`) provides the most reliable enforcement [^177^][^209^]. Claude uses tool-use pattern, Gemini uses `response_mime_type` with JSON schema [^172^].

### 4.2 Night Action Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "NightAction",
  "required": ["reasoning", "action", "target"],
  "properties": {
    "reasoning": {
      "type": "string",
      "description": "Private strategic analysis - never revealed to other players",
      "maxLength": 500
    },
    "action": {
      "type": "string",
      "enum": ["kill", "investigate", "protect", "pass"],
      "description": "The night action to execute"
    },
    "target": {
      "type": "string",
      "pattern": "^player_[0-9]+|self|none$",
      "description": "Target player ID for the action"
    }
  },
  "additionalProperties": false
}
```

### 4.3 Day Discussion Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "DayDiscussion",
  "required": ["reasoning", "public_statement"],
  "properties": {
    "reasoning": {
      "type": "string",
      "description": "Private analysis only you can see",
      "maxLength": 500
    },
    "public_statement": {
      "type": "string",
      "description": "What you say to all players during discussion",
      "maxLength": 300,
      "minLength": 10
    },
    "suspicion_scores": {
      "type": "object",
      "description": "Your suspicion levels for each player (0-1 scale)",
      "patternProperties": {
        "^player_[0-9]+$": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

### 4.4 Vote Action Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "VoteAction",
  "required": ["reasoning", "action"],
  "properties": {
    "reasoning": {
      "type": "string",
      "description": "Why you are voting this way",
      "maxLength": 300
    },
    "action": {
      "type": "string",
      "enum": ["vote", "abstain"],
      "description": "Vote to eliminate someone or abstain"
    },
    "target": {
      "type": "string",
      "pattern": "^player_[0-9]+|none$",
      "description": "Player to vote against (if voting)"
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1,
      "description": "How confident you are in this vote (0=guess, 1=certain)"
    }
  },
  "additionalProperties": false
}
```

### 4.5 Complete Turn Schema (Unified)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "AgentTurn",
  "required": ["phase", "reasoning", "actions"],
  "properties": {
    "phase": {
      "type": "string",
      "enum": ["night", "discussion", "voting"],
      "description": "Current game phase"
    },
    "reasoning": {
      "type": "string",
      "description": "Private strategic reasoning (never shared)",
      "maxLength": 600
    },
    "actions": {
      "type": "object",
      "required": ["primary_action"],
      "properties": {
        "primary_action": {
          "type": "string",
          "enum": ["kill", "investigate", "protect", "vote", "speak", "abstain", "pass"]
        },
        "target": {
          "type": "string",
          "pattern": "^player_[0-9]+|self|none$"
        },
        "public_statement": {
          "type": "string",
          "description": "Statement shared with all players",
          "maxLength": 300
        },
        "suspicion_scores": {
          "type": "object",
          "patternProperties": {
            "^player_[0-9]+$": { "type": "number", "minimum": 0, "maximum": 1 }
          }
        }
      }
    },
    "memory_update": {
      "type": "object",
      "description": "Key observations to store in memory",
      "properties": {
        "key_events": { "type": "array", "items": { "type": "string" } },
        "trust_levels": {
          "type": "object",
          "patternProperties": {
            "^player_[0-9]+$": { "type": "number", "minimum": -1, "maximum": 1 }
          }
        }
      }
    }
  },
  "additionalProperties": false
}
```

---

## 5. Model Selection Strategy

### 5.1 Model Comparison Matrix

| Model | Input Cost ($/M) | Output Cost ($/M) | Context Window | JSON Reliability | Best For | Source |
|-------|-----------------|-------------------|----------------|-----------------|----------|--------|
| **GPT-4o** | $2.50 | $10.00 | 128K | Excellent (strict mode) | General gameplay, structured output [^166^] |
| **Claude Sonnet 4** | $3.00 | $15.00 | 200K | Good (tool-use pattern) | Long-context analysis, error recovery [^166^] |
| **Gemini 2.5 Flash** | $0.15 | $0.60 | 1M | Good | High-volume processing, cost-sensitive [^172^] |
| **GPT-4o-mini** | $0.15 | $0.60 | 128K | Excellent | Simple actions, rule-based routing [^172^] |
| **Claude Haiku** | $0.25 | $1.25 | 200K | Moderate | Quick responses, cache-heavy workloads |
| **Llama 3.3-70B** | $0.10-$0.50 | $0.20-$1.00 | 128K | Moderate | Self-hosted, privacy-sensitive |

### 5.2 Model Routing Strategy

Implement **dynamic tiered routing** based on decision complexity [^167^][^170^][^174^]:

```python
# Routing logic
if decision_type == "simple_vote" and context_length < 2000:
    model = "gpt-4o-mini"       # $0.15/M tokens, 90% accuracy
elif decision_type == "night_action" and game_phase == "early":
    model = "gemini-2.5-flash"  # $0.15/M, strong reasoning
elif decision_type == "complex_deception" or context_length > 8000:
    model = "claude-sonnet-4"   # $3.00/M, best long-context
elif decision_type == "final_speech" and player_count <= 4:
    model = "gpt-4o"            # $2.50/M, best structured output
else:
    model = "gpt-4o"            # Default for critical decisions
```

**Routing benchmarks** [^167^][^174^]:
- Static routing saves 30-40% (predefined rules)
- Dynamic routing saves 45-60% (complexity analysis)
- Cascading (try cheap first) saves 50-70%
- LLM shepherding saves 60-75%

### 5.3 Production Routing Architecture

```
Request → Complexity Classifier (GPT-4o-mini, <100 tokens)
  |-- Simple (vote, basic speak) → GPT-4o-mini ($0.15/M)
  |-- Medium (night action, mid-game) → Gemini Flash ($0.15/M)
  |-- Complex (deception, endgame) → GPT-4o ($2.50/M)
  |-- Critical (final 3 players) → Claude Sonnet ($3.00/M)
  |-- Judge/Evaluation → GPT-4o (structured output quality)
```

---

## 6. Cost Optimization Framework

### 6.1 Five-Lever Optimization Model

Research shows **70-85% total cost reduction** is achievable by combining all five levers [^167^][^172^][^173^][^174^]:

| Lever | Strategy | Savings | Implementation Effort |
|-------|----------|---------|----------------------|
| **1. Prompt Caching** | Prefix caching for repeated system prompts; semantic caching for similar queries | 50-90% on cached tokens | Low (enable at provider) |
| **2. Context Compaction** | LLMLingua compression, ReSum summarization, relevance filtering | 40-60% token reduction | Medium |
| **3. Model Routing** | Route simple decisions to cheap models, complex to premium | 40-70% total cost | Medium |
| **4. Output Control** | Max token limits, structured JSON (shorter than prose), conciseness instructions | 20-30% output reduction | Low |
| **5. Batch Processing** | Async batch API for non-critical evaluations and judge scoring | 50% on batch-eligible | Low |

### 6.2 Cost Model: Per Game (8 Players, 10 Rounds)

| Scenario | Unoptimized | With All Optimizations | Source |
|----------|------------|----------------------|--------|
| LLM calls per game | ~200 calls | ~200 calls | [^1^] |
| Avg tokens per call (input) | ~3,000 | ~1,200 (compaction) | [^220^] |
| Avg tokens per call (output) | ~400 | ~250 (output control) | [^224^] |
| Model mix | 100% GPT-4o | 60% mini, 30% GPT-4o, 10% Claude | [^167^] |
| Input cost | $1.50/game | $0.18/game | Calculated |
| Output cost | $0.80/game | $0.13/game | Calculated |
| **Total per game** | **$2.30** | **$0.31** | **86% reduction** |
| **Monthly (1000 games)** | **$2,300** | **$310** | **$1,990 saved** |

### 6.3 Caching Implementation

**Provider-level prefix caching** [^172^][^174^][^175^]:

```python
# Anthropic: 90% cost reduction on cached tokens
# Cache reads at $0.30/M vs $3.00/M fresh
system_prompt = f"""{BASE_ROLE_PROMPT}\n{GAME_RULES}\n{PERSONALITY_CONFIG}"""

# Add cache_control marker (Anthropic)
messages = [
    {"role": "system", "content": [
        {"type": "text", "text": system_prompt, "cache_control": {"type": "ephemeral"}}
    ]},
    {"role": "user", "content": game_state_context}
]

# Key insight: Cache the static role prompt (2000+ tokens)
# Only send dynamic game state as fresh input
```

**Semantic caching** for similar game states [^173^][^174^]:

```python
# For decision types with similar contexts
async def get_cached_or_compute(game_state_hash, compute_fn):
    # Check exact match cache (Redis, 2ms)
    if cached := redis.get(f"exact:{game_state_hash}"):
        return json.loads(cached)
    
    # Check semantic cache (vector similarity)
    embedding = await embed(game_state_hash)
    similar = await vector_db.search(embedding, threshold=0.92)
    if similar:
        return similar[0].response
    
    # Cache miss - call LLM
    result = await compute_fn()
    
    # Store in both caches
    redis.setex(f"exact:{game_state_hash}", 3600, json.dumps(result))
    vector_db.store(embedding, result)
    return result
```

### 6.4 Context Compaction Pipeline

```python
# Multi-stage compaction (40-60% reduction)
def compact_context(full_context, token_budget=2000):
    stage1 = remove_redundant_tool_results(full_context)  # -20%
    stage2 = deduplicate_player_statements(stage1)          # -15%
    stage3 = summarize_early_rounds(stage2)                 # -30%
    stage4 = relevance_filter(stage3, token_budget)         # -10%
    return stage4

# LLMLingua-style compression (up to 20x) [^221^]
# Uses a small LM to score token importance and prune low-info tokens
```

---

## 7. Turn-Based vs Real-Time Decision Handling

### 7.1 Werewolf Phase Model

Werewolf is inherently **turn-based with real-time discussion phases**:

| Phase | Timing Model | Decision Type | Max Time | Async OK? |
|-------|-------------|---------------|----------|-----------|
| Night | Synchronous (all act simultaneously) | Kill, Investigate, Protect | 30s | No (need all responses) |
| Dawn | Automated | Death announcements | 5s | N/A |
| Discussion | Real-time (sequential or free-form) | Speak, Accuse, Defend | 60-120s | Yes (stream as ready) |
| Voting | Synchronous (all vote simultaneously) | Vote, Abstain | 20s | No (need all votes) |
| Sunset | Automated | Elimination results | 5s | N/A |

### 7.2 Decision Pipeline Architecture

```python
async def handle_night_phase(agents, timeout=30):
    """Synchronous: All agents must respond before proceeding."""
    tasks = [agent.get_night_action(timeout) for agent in alive_agents]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Handle timeouts - use default action (pass/no-kill)
    for i, result in enumerate(results):
        if isinstance(result, asyncio.TimeoutError):
            results[i] = default_action(agents[i])
    
    return apply_night_actions(results)

async def handle_discussion_phase(agents, timeout=120):
    """Real-time: Stream statements as they arrive."""
    pending = {agent.id: agent.get_statement() for agent in agents}
    
    # Stream responses as they complete
    for completed in asyncio.as_completed(pending.values(), timeout=timeout):
        try:
            statement = await completed
            await broadcast(statement)  # SSE/WebSocket push
        except asyncio.TimeoutError:
            continue  # Agent chose not to speak

async def handle_voting_phase(agents, timeout=20):
    """Synchronous: All votes needed to resolve."""
    tasks = [agent.get_vote(timeout) for agent in agents]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Late voters default to abstain
    votes = [r if not isinstance(r, Exception) else {"action": "abstain"} 
             for r in results]
    return tally_votes(votes)
```

### 7.3 Timeout and Fallback Strategy

| Decision Criticality | Timeout | Fallback Action | Logging |
|---------------------|---------|-----------------|---------|
| Night kill (Werewolf) | 30s | Random alive non-werewolf | ERROR |
| Night investigate (Seer) | 30s | Random un-investigated player | ERROR |
| Night protect (Doctor) | 30s | Self-protect | ERROR |
| Day discussion | 60s | Skip turn (silent) | WARNING |
| Day vote | 20s | Abstain | WARNING |
| Post-game evaluation | 300s | Skip evaluation | INFO |

---

## 8. LLM Latency Management

### 8.1 Streaming Architecture

For real-time discussion phases, implement **Server-Sent Events (SSE)** streaming [^228^][^250^]:

```python
# SSE streaming for real-time agent responses
@app.get("/game/{game_id}/stream")
async def game_stream(game_id: str):
    async def event_generator():
        queue = subscribe_to_game(game_id)
        while True:
            event = await queue.get()
            if event.type == "agent_statement":
                yield f"data: {json.dumps({
                    'player': event.player_id,
                    'statement': event.content,
                    'timestamp': event.timestamp
                })}\n\n"
            elif event.type == "phase_change":
                yield f"data: {json.dumps({'phase': event.new_phase})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )
```

### 8.2 Async Pattern with Timeout

```python
import asyncio
from dataclasses import dataclass

@dataclass
class AgentResponse:
    content: dict
    latency_ms: float
    model_used: str
    tokens_in: int
    tokens_out: int

async def llm_call_with_timeout(
    prompt: str,
    model: str,
    schema: dict,
    timeout_seconds: float = 30.0,
    streaming: bool = False
) -> AgentResponse:
    start = time.monotonic()
    
    try:
        if streaming:
            # Stream partial responses for real-time feel
            chunks = []
            async for chunk in llm_client.stream(prompt, model=model, schema=schema):
                chunks.append(chunk)
                # Emit partial content for UX
                await emit_partial(chunk)
            content = merge_chunks(chunks)
        else:
            # Standard async call
            content = await asyncio.wait_for(
                llm_client.complete(prompt, model=model, schema=schema),
                timeout=timeout_seconds
            )
        
        latency = (time.monotonic() - start) * 1000
        return AgentResponse(
            content=content,
            latency_ms=latency,
            model_used=model,
            tokens_in=estimate_tokens(prompt),
            tokens_out=estimate_tokens(str(content))
        )
    
    except asyncio.TimeoutError:
        logger.error(f"LLM timeout after {timeout_seconds}s: model={model}")
        raise
    except Exception as e:
        logger.error(f"LLM error: {e}, model={model}")
        # Fallback to cheaper model
        if model != "gpt-4o-mini":
            return await llm_call_with_timeout(prompt, "gpt-4o-mini", schema, timeout_seconds)
        raise
```

### 8.3 Latency Budget by Phase

| Phase | Target Latency | Max Acceptable | Optimization |
|-------|---------------|----------------|--------------|
| Night action | 3-5s | 15s | Parallel calls, caching |
| Day statement | 2-4s | 10s | Streaming, warm connections |
| Vote decision | 1-2s | 8s | Simple prompt, small model |
| Judge evaluation | 10-30s | 60s | Batch API, background |

### 8.4 Connection Optimization

- **Keep-alive HTTP/2 connections**: Reduce TCP handshake overhead
- **Pre-warmed model instances**: Avoid cold starts for first requests
- **Request coalescing**: Combine multiple simple decisions into one batch
- **Background prefetch**: Start generating next likely response before needed

---

## 9. Agent Personality Configuration System

### 9.1 Trait Model: Big Five (OCEAN)

The Big Five personality model provides the most validated framework for agent personality [^179^][^248^][^249^]:

| Trait | Range | Game Impact |
|-------|-------|-------------|
| **Openness** | 0-1 | Creativity in arguments, willingness to use novel strategies |
| **Conscientiousness** | 0-1 | Consistency in claims, attention to voting patterns |
| **Extraversion** | 0-1 | Talkativeness, initiative in discussions, bid frequency |
| **Agreeableness** | 0-1 | Cooperation tendency, trust in others, defensiveness |
| **Neuroticism** | 0-1 | Emotional reactivity when accused, paranoia level |

### 9.2 Personality Configuration Schema

```json
{
  "$schema": "agent_personality",
  "type": "object",
  "required": ["personality", "speaking_style", "strategy_bias"],
  "properties": {
    "personality": {
      "type": "object",
      "properties": {
        "openness": { "type": "number", "minimum": 0, "maximum": 1, "default": 0.5 },
        "conscientiousness": { "type": "number", "minimum": 0, "maximum": 1, "default": 0.5 },
        "extraversion": { "type": "number", "minimum": 0, "maximum": 1, "default": 0.5 },
        "agreeableness": { "type": "number", "minimum": 0, "maximum": 1, "default": 0.5 },
        "neuroticism": { "type": "number", "minimum": 0, "maximum": 1, "default": 0.5 }
      }
    },
    "speaking_style": {
      "type": "object",
      "properties": {
        "verbosity": { "type": "string", "enum": ["terse", "moderate", "verbose"], "default": "moderate" },
        "formality": { "type": "string", "enum": ["casual", "neutral", "formal"], "default": "neutral" },
        "emotionality": { "type": "string", "enum": ["stoic", "balanced", "expressive"], "default": "balanced" },
        "dialect": { "type": "string", "enum": ["standard", "regional", "character"], "default": "standard" },
        "character_persona": { "type": "string", "description": "Optional character name/archetype" }
      }
    },
    "strategy_bias": {
      "type": "object",
      "properties": {
        "deception_style": { "type": "string", "enum": ["honest", "equivocator", "bold_liar"], "default": "equivocator" },
        "trust_speed": { "type": "string", "enum": ["slow", "moderate", "fast"], "default": "moderate" },
        "risk_tolerance": { "type": "string", "enum": ["conservative", "balanced", "aggressive"], "default": "balanced" },
        "leadership_tendency": { "type": "number", "minimum": 0, "maximum": 1, "default": 0.5 }
      }
    }
  }
}
```

### 9.3 Personality Prompt Injection

```python
def generate_personality_prompt(config: PersonalityConfig) -> str:
    traits = config.personality
    style = config.speaking_style
    strategy = config.strategy_bias
    
    return f"""
## Personality Profile
You are playing with the following personality traits (scale 0-1):
- Openness to experience: {traits.openness:.1f} ({"creative/unconventional" if traits.openness > 0.7 else "traditional/practical" if traits.openness < 0.3 else "balanced"})
- Conscientiousness: {traits.conscientiousness:.1f} ({"highly organized" if traits.conscientiousness > 0.7 else "spontaneous" if traits.conscientiousness < 0.3 else "moderately careful"})
- Extraversion: {traits.extraversion:.1f} ({"outgoing/talkative" if traits.extraversion > 0.7 else "reserved/quiet" if traits.extraversion < 0.3 else "moderately social"})
- Agreeableness: {traits.agreeableness:.1f} ({"cooperative/trusting" if traits.agreeableness > 0.7 else "suspicious/competitive" if traits.agreeableness < 0.3 else "fairly agreeable"})
- Neuroticism: {traits.neuroticism:.1f} ({"anxious/reactive" if traits.neuroticism > 0.7 else "calm/stable" if traits.neuroticism < 0.3 else "moderately emotional"})

## Speaking Style
- Verbosity: {style.verbosity}
- Formality: {style.formality}
- Emotional expression: {style.emotionality}
{f'- Character persona: {style.character_persona}' if style.character_persona else ''}

## Strategic Tendencies
- Deception style: {strategy.deception_style}
- Trust development: {strategy.trust_speed}
- Risk tolerance: {strategy.risk_tolerance}
- Leadership tendency: {strategy.leadership_tendency:.1f}

Let your personality traits naturally influence your decisions and speaking style.
Do not mention your personality traits or role explicitly.
"""
```

### 9.4 Pre-configured Personality Presets

```python
PERSONALITY_PRESETS = {
    "the_detective": PersonalityConfig(
        personality=BigFive(openness=0.8, conscientiousness=0.9, extraversion=0.6, agreeableness=0.4, neuroticism=0.3),
        speaking_style=SpeakingStyle(verbosity="moderate", formality="formal", emotionality="stoic"),
        strategy_bias=StrategyBias(deception_style="honest", trust_speed="slow", risk_tolerance="conservative")
    ),
    "the_charmer": PersonalityConfig(
        personality=BigFive(openness=0.7, conscientiousness=0.3, extraversion=0.9, agreeableness=0.8, neuroticism=0.4),
        speaking_style=SpeakingStyle(verbosity="verbose", formality="casual", emotionality="expressive"),
        strategy_bias=StrategyBias(deception_style="equivocator", trust_speed="fast", risk_tolerance="aggressive")
    ),
    "the_silent_type": PersonalityConfig(
        personality=BigFive(openness=0.3, conscientiousness=0.6, extraversion=0.1, agreeableness=0.5, neuroticism=0.5),
        speaking_style=SpeakingStyle(verbosity="terse", formality="neutral", emotionality="stoic"),
        strategy_bias=StrategyBias(deception_style="honest", trust_speed="slow", risk_tolerance="conservative")
    ),
    "the_chaos_agent": PersonalityConfig(
        personality=BigFive(openness=0.9, conscientiousness=0.2, extraversion=0.8, agreeableness=0.2, neuroticism=0.7),
        speaking_style=SpeakingStyle(verbosity="verbose", formality="casual", emotionality="expressive"),
        strategy_bias=StrategyBias(deception_style="bold_liar", trust_speed="fast", risk_tolerance="aggressive")
    )
}
```

---

## 10. Implementation Pseudocode

### 10.1 Agent Class Hierarchy

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
import asyncio
import json

class AgentType(Enum):
    RULE_BASED = "rule_based"
    PERSONALITY_DRIVEN = "personality_driven"
    LLM_POWERED = "llm_powered"

class GamePhase(Enum):
    NIGHT = "night"
    DISCUSSION = "discussion"
    VOTING = "voting"

@dataclass
class GameState:
    phase: GamePhase
    day_number: int
    alive_players: list[str]
    dead_players: list[str]
    player_role: str
    memory: list[dict]
    conversation_history: list[dict]

class BaseAgent(ABC):
    """Abstract base for all agent types."""
    
    def __init__(self, player_id: str, agent_type: AgentType):
        self.player_id = player_id
        self.agent_type = agent_type
        self.memory = []
        self.suspicion_scores = {}
    
    @abstractmethod
    async def act(self, game_state: GameState, timeout: float = 30.0) -> dict:
        """Generate an action for the current game phase."""
        pass
    
    def update_memory(self, event: dict):
        """Store observations for future reasoning."""
        self.memory.append({"turn": len(self.memory), **event})
        # Keep memory within bounds
        if len(self.memory) > 100:
            self.memory = self.memory[-50:]  # Compaction: keep last 50

class RuleBasedAgent(BaseAgent):
    """Deterministic agent using decision trees."""
    
    def __init__(self, player_id: str, ruleset: dict):
        super().__init__(player_id, AgentType.RULE_BASED)
        self.ruleset = ruleset
    
    async def act(self, game_state: GameState, timeout: float = 30.0) -> dict:
        # Evaluate decision tree
        if game_state.phase == GamePhase.NIGHT:
            return self._night_action(game_state)
        elif game_state.phase == GamePhase.DISCUSSION:
            return self._discussion_action(game_state)
        elif game_state.phase == GamePhase.VOTING:
            return self._voting_action(game_state)
    
    def _night_action(self, state: GameState) -> dict:
        # Simple heuristics: target most suspicious non-teammate
        if self.ruleset.get("role") == "werewolf":
            targets = [p for p in state.alive_players 
                      if p not in self.ruleset.get("teammates", [])]
            target = targets[0] if targets else "none"
            return {"action": "kill", "target": target, "reasoning": "Heuristic: target first available"}
        # ... other roles
    
    def _voting_action(self, state: GameState) -> dict:
        # Vote for player with highest suspicion score
        if self.suspicion_scores:
            target = max(self.suspicion_scores, key=self.suspicion_scores.get)
            return {"action": "vote", "target": target}
        return {"action": "abstain"}

class PersonalityDrivenAgent(BaseAgent):
    """Agent with Big Five personality traits influencing decisions."""
    
    def __init__(self, player_id: str, personality: PersonalityConfig, llm_client):
        super().__init__(player_id, AgentType.PERSONALITY_DRIVEN)
        self.personality = personality
        self.llm_client = llm_client
    
    async def act(self, game_state: GameState, timeout: float = 30.0) -> dict:
        # Use lightweight LLM with personality-infused prompt
        prompt = self._build_prompt(game_state)
        response = await self.llm_client.complete(
            prompt=prompt,
            model="gpt-4o-mini",  # Cheap model for personality agents
            schema=ACTION_SCHEMA,
            timeout=timeout
        )
        return response
    
    def _build_prompt(self, state: GameState) -> str:
        base = get_role_prompt(state.player_role, self.player_id)
        personality = generate_personality_prompt(self.personality)
        context = format_game_state(state)
        return f"{base}\n{personality}\n{context}"

class LLMPoweredAgent(BaseAgent):
    """Full LLM-powered agent with advanced reasoning."""
    
    def __init__(self, player_id: str, model_router, memory_manager, personality: PersonalityConfig = None):
        super().__init__(player_id, AgentType.LLM_POWERED)
        self.model_router = model_router
        self.memory_manager = memory_manager
        self.personality = personality
    
    async def act(self, game_state: GameState, timeout: float = 30.0) -> dict:
        # Select model based on decision complexity
        model = self.model_router.select_model(game_state)
        
        # Build enriched prompt with memory
        prompt = await self._build_enriched_prompt(game_state)
        
        # Structured output with retry
        for attempt in range(3):
            try:
                response = await self.llm_client.complete(
                    prompt=prompt,
                    model=model,
                    schema=get_schema_for_phase(game_state.phase),
                    timeout=timeout
                )
                # Validate and return
                return validate_action(response, game_state.phase)
            except (ValidationError, TimeoutError) as e:
                if attempt == 2:
                    return get_fallback_action(game_state.phase)
                await asyncio.sleep(0.5 * (attempt + 1))
    
    async def _build_enriched_prompt(self, state: GameState) -> str:
        # Role-specific system prompt (cached)
        system = get_role_prompt(state.player_role, self.player_id)
        
        # Personality (if configured)
        personality = generate_personality_prompt(self.personality) if self.personality else ""
        
        # Retrieve relevant memories
        memories = await self.memory_manager.retrieve_relevant(
            query=f"turn {state.day_number} {state.phase.value}",
            k=5
        )
        
        # Compacted game context
        context = format_game_state_compact(state, max_tokens=1500)
        
        return f"{system}\n{personality}\n## Past Observations\n{format_memories(memories)}\n{context}"
```

### 10.2 Game Orchestrator

```python
class GameOrchestrator:
    """Manages game flow and coordinates all agents."""
    
    def __init__(self, agents: list[BaseAgent], config: GameConfig):
        self.agents = {a.player_id: a for a in agents}
        self.config = config
        self.phase = GamePhase.NIGHT
        self.day = 1
        self.alive = list(self.agents.keys())
        self.dead = []
        self.votes = {}
    
    async def run_game(self) -> GameResult:
        """Main game loop."""
        while not self._check_win_condition():
            if self.phase == GamePhase.NIGHT:
                await self._run_night_phase()
                self.phase = GamePhase.DISCUSSION
            elif self.phase == GamePhase.DISCUSSION:
                await self._run_discussion_phase()
                self.phase = GamePhase.VOTING
            elif self.phase == GamePhase.VOTING:
                await self._run_voting_phase()
                self.phase = GamePhase.NIGHT
                self.day += 1
        
        return self._create_result()
    
    async def _run_night_phase(self):
        """All alive agents submit night actions in parallel."""
        tasks = []
        for player_id in self.alive:
            state = self._get_player_state(player_id)
            task = self._agent_act_with_timeout(player_id, state, timeout=30)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        night_actions = {}
        for player_id, result in zip(self.alive, results):
            if isinstance(result, Exception):
                night_actions[player_id] = get_default_action(self.agents[player_id])
            else:
                night_actions[player_id] = result
        
        # Resolve actions
        self._resolve_night_actions(night_actions)
    
    async def _run_discussion_phase(self):
        """Stream agent statements in real-time."""
        queue = asyncio.Queue()
        
        # Start all agents speaking
        tasks = []
        for player_id in self.alive:
            state = self._get_player_state(player_id)
            task = asyncio.create_task(
                self._agent_speak_with_streaming(player_id, state, queue)
            )
            tasks.append(task)
        
        # Stream results as they arrive
        completed = 0
        timeout = asyncio.create_task(asyncio.sleep(120))
        
        while completed < len(tasks):
            done, _ = await asyncio.wait(
                [queue.get(), timeout],
                return_when=asyncio.FIRST_COMPLETED
            )
            for future in done:
                if future == timeout:
                    # Phase timeout - cancel remaining
                    for t in tasks:
                        t.cancel()
                    return
                event = future.result()
                await self._broadcast(event)
                completed += 1
    
    async def _agent_act_with_timeout(self, player_id: str, state: GameState, timeout: float) -> dict:
        """Execute agent action with timeout handling."""
        agent = self.agents[player_id]
        try:
            return await asyncio.wait_for(agent.act(state, timeout), timeout=timeout)
        except asyncio.TimeoutError:
            logger.warning(f"Agent {player_id} timed out after {timeout}s")
            return get_fallback_action(self.phase)
        except Exception as e:
            logger.error(f"Agent {player_id} error: {e}")
            return get_fallback_action(self.phase)
```

### 10.3 Model Router

```python
class ModelRouter:
    """Routes decisions to optimal models based on complexity."""
    
    MODELS = {
        "mini": {"name": "gpt-4o-mini", "input_cost": 0.15, "output_cost": 0.60},
        "flash": {"name": "gemini-2.5-flash", "input_cost": 0.15, "output_cost": 0.60},
        "gpt4o": {"name": "gpt-4o", "input_cost": 2.50, "output_cost": 10.00},
        "sonnet": {"name": "claude-sonnet-4", "input_cost": 3.00, "output_cost": 15.00},
    }
    
    def select_model(self, game_state: GameState, decision_history: list = None) -> str:
        """Select optimal model for current decision."""
        phase = game_state.phase
        day = game_state.day_number
        alive_count = len(game_state.alive_players)
        context_tokens = estimate_context_tokens(game_state)
        
        # Critical endgame -> best model
        if alive_count <= 3:
            return self.MODELS["gpt4o"]["name"]
        
        # Complex deception in late game
        if day >= 3 and phase == GamePhase.DISCUSSION:
            return self.MODELS["gpt4o"]["name"]
        
        # Long context -> Claude
        if context_tokens > 8000:
            return self.MODELS["sonnet"]["name"]
        
        # Simple votes in early game -> mini
        if phase == GamePhase.VOTING and day <= 2:
            return self.MODELS["mini"]["name"]
        
        # Default: balanced
        if day <= 2:
            return self.MODELS["flash"]["name"]
        return self.MODELS["gpt4o"]["name"]
    
    async def route_with_cascade(self, prompt: str, schema: dict, max_budget: float = 0.01) -> dict:
        """Try cheap models first, escalate if quality insufficient."""
        models = ["mini", "flash", "gpt4o"]
        
        for model_key in models:
            model = self.MODELS[model_key]
            if model["input_cost"] / 1000000 * estimate_tokens(prompt) > max_budget:
                continue
            
            try:
                result = await llm_client.complete(prompt, model["name"], schema, timeout=10)
                if result.get("confidence", 0) > 0.7:
                    return result
            except Exception:
                continue
        
        # Fallback to most capable
        return await llm_client.complete(prompt, self.MODELS["gpt4o"]["name"], schema, timeout=30)
```

### 10.4 Cost Tracker

```python
class CostTracker:
    """Track and optimize LLM API costs per game."""
    
    def __init__(self):
        self.calls = []
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.total_cost = 0.0
    
    def log_call(self, model: str, input_tokens: int, output_tokens: int, latency_ms: float, cache_hit: bool = False):
        """Log a single LLM API call."""
        cost = self._calculate_cost(model, input_tokens, output_tokens, cache_hit)
        self.calls.append({
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "latency_ms": latency_ms,
            "cache_hit": cache_hit,
            "cost": cost
        })
        self.total_input_tokens += input_tokens
        self.total_output_tokens += output_tokens
        self.total_cost += cost
    
    def _calculate_cost(self, model: str, input_t: int, output_t: int, cache_hit: bool) -> float:
        """Calculate cost in USD."""
        rates = {
            "gpt-4o": (2.50, 10.00),
            "gpt-4o-mini": (0.15, 0.60),
            "claude-sonnet-4": (3.00, 15.00),
            "gemini-2.5-flash": (0.15, 0.60),
        }
        in_rate, out_rate = rates.get(model, (2.50, 10.00))
        
        # Apply cache discount (90% off input for Anthropic)
        if cache_hit and "claude" in model:
            in_rate *= 0.10
        elif cache_hit:
            in_rate *= 0.50
        
        return (input_t * in_rate + output_t * out_rate) / 1_000_000
    
    def get_game_summary(self) -> dict:
        """Get cost breakdown for the game."""
        return {
            "total_calls": len(self.calls),
            "total_input_tokens": self.total_input_tokens,
            "total_output_tokens": self.total_output_tokens,
            "total_cost_usd": round(self.total_cost, 4),
            "avg_cost_per_call": round(self.total_cost / max(len(self.calls), 1), 6),
            "model_breakdown": self._get_model_breakdown(),
            "optimization_suggestions": self._get_optimizations()
        }
```

---

## Source Index

[^1^] Werewolf Arena: LLM Agent Benchmark (Feb 2026). https://aitinkerers.org/talks/rsvp_w6B43riADns

[^9^] AI Mafia Game: Mafia-Boardgame-via-Agents (Mar 2025). https://github.com/PranavMishra17/Mafia-Boardgame-via-Agents

[^14^] Google's A2A Protocol: How AI Agents Communicate Across Frameworks (Apr 2026). https://dev.to/agentsindex/googles-a2a-protocol-how-ai-agents-communicate-across-frameworks-52jj

[^15^] Context Engineering vs Prompt Engineering for AI Agents (Feb 2026). https://www.firecrawl.dev/blog/context-engineering

[^18^] Stop chatting. This is the prompt structure real AI AGENT need to survive in production (Sep 2025). https://www.reddit.com/r/AI_Agents/comments/1l9zbvg/stop_chatting_this_is_the_prompt_structure_real/

[^24^] How We Cut LLM Costs by 59% With Prompt Caching (Apr 2026). https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching

[^25^] LLM Cost Optimization: 5 Levers to Cut API Spend 70-85% (Mar 2026). https://www.morphllm.com/llm-cost-optimization

[^39^] Language Agents with Reinforcement Learning for Strategic Play in the Werewolf Game (ICML 2024). https://nicsefc.ee.tsinghua.edu.cn/nics_file/pdf/31ea700a-8925-483b-a623-4e701c9c8d10.pdf

[^40^] LSPO Full Paper v3 (Jun 2025). https://arxiv.org/html/2502.04686v3

[^61^] What? My Werewolf Game Skills Are Worse Than AI's? (Jan 2026). https://www.alibabacloud.com/blog/what-my-werewolf-game-skills-are-worse-than-ais_602815

[^64^] An Implementation of Werewolf Agent That does not Truly Trust LLMs (AIWolfDial 2024). https://aclanthology.org/2024.aiwolfdial-1.7.pdf

[^81^] AVALON'S GAME OF THOUGHTS (COLM 2024). https://openreview.net/pdf/6bf2dd908e405e25cc9ad480b9263b560be34740.pdf

[^127^] Werewolf Arena: A Case Study in LLM Evaluation via Social Deduction (2024). https://arxiv.org/html/2407.13943v1

[^166^] Claude vs GPT-4o for Autonomous Agent Work: 30 Days of Real Data (Apr 2026). https://dev.to/whoffagents/claude-vs-gpt-4o-for-autonomous-agent-work-30-days-of-real-data-3a4m

[^167^] LLM Cost Optimization in AI Deployment (2026 Guide). https://aisuperior.com/llm-cost-optimization-in-ai-deployment/

[^169^] Structured Outputs with agents (Microsoft, Apr 2026). https://learn.microsoft.com/en-us/agent-framework/agents/structured-outputs

[^170^] Dynamic Model Routing and Cascading for Efficient LLM Inference: A Survey (Apr 2026). https://arxiv.org/html/2603.04445v2

[^172^] Gemini vs GPT-4 vs Claude for Agent Development (Mar 2026). https://callsphere.ai/blog/gemini-vs-gpt-4-vs-claude-agent-development-practical-comparison

[^173^] Building a Multi-Agent Security Pipeline with Google's A2A Protocol (Dec 2025). https://blog.gitguardian.com/building-a-multi-agent-security-pipeline-with-googles-a2a-protocol-and-gitguardian/

[^174^] What Is an AI Model Router? Optimize Cost Across LLM Providers (Feb 2026). https://www.mindstudio.ai/blog/what-is-ai-model-router-optimize-cost-llm-providers/

[^177^] Structured model outputs | OpenAI API. https://developers.openai.com/api/docs/guides/structured-outputs

[^179^] Dynamic Personality Adjustment in AI Agents (Oct 2025). https://www.emergentmind.com/topics/dynamic-personality-adjustment

[^202^] MCP vs A2A: Architecture, Security, and When to Use Each (Mar 2026). https://www.stackone.com/blog/mcp-vs-a2a-protocol/

[^204^] What Is MCP, ACP, and A2A? AI Agent Protocols Explained (Nov 2025). https://boomi.com/blog/what-is-mcp-acp-a2a/

[^205^] A Novel Architecture for Symbolic Reasoning with Decision Trees and LLM Agents (Aug 2025). https://arxiv.org/abs/2508.05311

[^207^] MCP vs A2A: Compare Single-Agent & Multi-Agent Protocols (Sep 2025). https://www.truefoundry.com/blog/mcp-vs-a2a

[^208^] What Are AI Agent Protocols (MCP & A2A)? (Mar 2026). https://unimon.co.th/en/blog/ai-agent-protocol-mcp-a2a-guide

[^210^] Bridging Intelligence: Hybrid LLM and Rule-Based Systems (Oct 2024). https://medium.com/@ceciliabonucchi/bridging-intelligence-the-next-evolution-in-ai-with-hybrid-llm-and-rule-based-systems-db0d89998c6d

[^214^] AI agent or Rule-based DMN? Choosing the Right Abstraction (Jul 2025). https://camunda.com/blog/2025/07/ai-agent-or-based-rule-dmn-ai-powered-orchestration/

[^220^] Optimizing Token Usage: Context Compression Techniques (Mar 2026). https://www.sitepoint.com/optimizing-token-usage-context-compression-techniques/

[^221^] The Fundamentals of Context Management and Compaction in LLMs (Feb 2026). https://kargarisaac.medium.com/the-fundamentals-of-context-management-and-compaction-in-llms-171ea31741a2

[^228^] Handling long-running LLM processes with Forge Realtime (Jan 2026). https://developer.atlassian.com/platform/forge/llm-long-running-process-with-forge-realtime/

[^244^] Agentic Memory: Learning Unified Long-Term and Short-Term Memory Management for LLM Agents (Jan 2026). https://arxiv.org/html/2601.01885v1

[^248^] Driving Generative Agents With Their Personality (Feb 2024). https://arxiv.org/html/2402.14879v1

[^249^] An LLM-Based Behavior Agent with Natural Language Processing (2024). https://etasr.com/index.php/ETASR/article/download/12631/5504

[^250^] AI Assistant — Streaming Structured LLM Response over Http (Jan 2026). https://medium.com/@amitsriv99/genai-streaming-structured-llm-response-over-http-2450ed7b6749
