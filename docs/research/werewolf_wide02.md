## Facet: LLM Agent Architectures for Social Deduction Games

*Research compilation covering LLM agent frameworks, memory architectures, prompt engineering, multi-agent protocols, evaluation methods, and model selection for social deduction games (Werewolf/Mafia/Avalon/Among Us).*

---

### Key Findings

- **LSPO (Latent Space Policy Optimization)** is the current SOTA for strategic LLM agents in Werewolf, combining game-theoretic CFR with DPO fine-tuning to overcome intrinsic LLM bias in action distributions, outperforming ReAct, ReCon, Cicero-like, and SLA baselines [^36^][^40^]. Xu et al. (2025) found that "while the language space is combinatorially large, the underlying strategy space is relatively compact" -- enabling CFR in abstracted latent space [^36^].

- **Werewolf Arena** (2026) provides the most complete reference architecture for LLM-powered Werewolf, using FastAPI, A2A protocol, Green/Purple agent pattern, ELO ratings, and LLM-as-a-Judge evaluation with G-Eval-inspired scoring across 5 dimensions (reasoning quality, persuasive power, deceptive skill, adaptability, consistency) [^1^][^35^].

- **A2A Protocol** (Google, launched April 2025, now Linux Foundation-governed) is the emerging standard for multi-agent game systems, with 150+ organizational supporters, using HTTP/JSON-RPC 2.0, Agent Cards at `/.well-known/agent.json`, and an "opaque agent" model that protects internal reasoning [^14^]. Search volume grew 52% QoQ as of early 2026 [^14^].

- **AgentScope** (Alibaba) demonstrates production-grade Werewolf implementation using ReActAgent with role-specific system prompts, InMemoryMemory, and MultiAgentFormatter for tagged message merging -- enabling AI-AI and human-AI gameplay through identical `call()` interfaces [^61^][^80^][^83^].

- **ReCon (Recursive Contemplation)** achieves significant improvements in Avalon deception handling through dual-perspective reasoning: formulation contemplation (self-perspective) + refinement contemplation (opponent perspective), with first-order and second-order perspective transitions [^81^]. ReCon outperforms CoT baseline across all six evaluated metrics (concealment, logic, contribution, persuasiveness, information, creativity) [^81^].

- **Cicero** (Meta FAIR) remains the landmark achievement for strategic dialogue agents, achieving human-level performance in Diplomacy by combining a dialogue module (intent-conditioned language model) with a strategic reasoning module (piKL planning with RL-trained models) and message filtering [^82^][^84^][^86^]. Cicero ranked in the top 10% of human players across 40 anonymous online league games [^84^].

- **Memory architecture** is the critical differentiator for game agent performance: unified STM/LTM management frameworks like AgeMem use RL (step-wise GRPO) to learn when, what, and how to manage memory, outperforming static approaches [^17^]. Cognitive architectures categorize memory into working/episodic/semantic/procedural types [^21^][^22^].

- **LLM-as-a-Judge with G-Eval** provides the most practical evaluation framework for game agents, using Auto-CoT for step-by-step evaluation with probability-weighted scoring achieving up to 85% alignment with human judgment [^30^][^34^]. G-Eval's three-step process (evaluation step generation, judging, log-probability scoring) addresses inconsistency, verbosity bias, and lack of fine-grained judgment [^30^].

- **Cost optimization** is essential for multi-agent game systems: prompt caching reduces costs by 59-90%, context compaction achieves 50-70% token reduction, model routing saves 40-70%, and combining all five levers achieves 70-85% total cost reduction [^24^][^25^]. A typical unoptimized 200-call agent session on Claude Opus costs $22.50; with all optimizations applied, $2-3.50 [^25^].

- **Among Us LLM agent study** (1,100 games, 1M+ tokens) found that LLM agents rely primarily on directive language; impostor agents shift toward representative acts (explanations, denials) under pressure; deception manifests as equivocation rather than outright lies, offering no consistent win rate advantage [^34^].

- **Reinforcement learning hybrid approaches consistently outperform pure prompt-based agents** in social deduction games. SLA combines LLM reasoning with MAPPO for action selection; DVM separates Predictor/Decider/Discussor modules; population-based training with diverse play styles prevents convergence to single strategies [^39^][^38^].

---

### Agent Architecture Patterns

**1. Prompt-Based Pure LLM (ReAct, ReCon)**
- Description: LLM generates reasoning and actions through structured prompting without parameter updates. ReAct chains thought-action-observation loops; ReCon adds dual-perspective contemplation [^40^][^81^].
- Pros: No training cost, easy to implement, flexible role assignment, works with any LLM API.
- Cons: Suffers from intrinsic action bias inherited from training data, limited strategic exploration, no learning across games, suboptimal for complex deception [^39^][^40^].
- Sources: [^40^][^81^]

**2. RL-Enhanced Hybrid (SLA, LSPO, DVM)**
- Description: LLM performs deductive reasoning and generates diverse action candidates; an RL policy selects from candidates to optimize decision-making. LSPO maps utterances into latent strategy space, applies CFR, then fine-tunes LLM via DPO iteratively [^36^][^39^]. DVM separates Predictor (fine-tuned LLM), Decider (policy head), and Discussor (prompted LLM) [^38^].
- Pros: Overcomes intrinsic LLM bias, learns optimal strategies, expands strategy space iteratively, achieves human-level performance [^39^][^40^].
- Cons: Requires expensive distributed training infrastructure, needs population-based training for robustness, complex implementation (parallel environments, multiple API accounts) [^39^].
- Sources: [^36^][^38^][^39^][^40^]

**3. Modular Multi-Agent with A2A (Werewolf Arena)**
- Description: Green Agent (orchestrator/evaluator) manages game flow via FastAPI A2A endpoints; Purple Agents (players) connect via Agent Cards, implement role_assignment/action_request/reset methods. Supports multiple LLM backends per agent [^1^][^35^].
- Architecture:
```
Green Agent (FastAPI A2A Server)
  - POST /a2a: Assessment & game actions
  - Game Orchestrator: Role assignment, phase management
  - Scoring Engine: Multi-dimensional metrics, ELO, sabotage detection
  - LLM-as-a-Judge: Qualitative evaluation (G-Eval inspired)
       |
       | A2A Protocol (HTTP)
       |
Purple Agents (Player Implementations)
  - GET /.well-known/agent-card.json
  - POST /a2a: role_assignment, action_request, reset
  - Role-specific LLM policies
```
- Pros: Standardized interoperability, opaque agent model protects IP, supports heterogeneous agents (GPT-4, Claude, Gemini), containerized deployment, reproducible tournaments via GitHub Actions [^1^][^14^][^35^].
- Cons: A2A is nascent (launched April 2025), requires all agents to implement protocol, potential latency from HTTP overhead.
- Sources: [^1^][^14^][^35^]

**4. ReActAgent with Role Prompting (AgentScope)**
- Description: Each player is a ReActAgent with name, system prompt (role-specific), LLM model, and InMemoryMemory. MsgHub with MultiAgentFormatter handles tagged message merging. UserAgent provides identical interface for human players [^61^][^80^][^83^].
- Pros: Simple implementation (few lines of code per agent), supports voice interaction, real-time SSE streaming, human-in-the-loop without orchestrator changes [^61^][^80^].
- Cons: Limited to single-framework deployments, no cross-framework interoperability, less sophisticated evaluation than Werewolf Arena.
- Sources: [^61^][^80^][^83^]

**5. Cicero-Style Dialogue + Strategy (Meta FAIR)**
- Description: Combines intent-conditioned dialogue model with strategic reasoning module using piKL planning. Dialogue model grounded in game state and planned actions (intents). Multiple message filters reject nonsensical or strategically poor outputs [^82^][^84^].
- Pros: Achieved human-level performance in complex negotiation, dialogue is honest and helpful (not deceptive), intent grounding enables controllable communication [^84^].
- Cons: Computationally expensive, requires large human game dataset (12.9M messages), dialogue errors still occur, limited to modeling current-turn actions not long-term relationship building [^84^].
- Sources: [^82^][^84^][^86^]

**6. Personality-Based Agent (AI Mafia Game)**
- Description: Full-stack application with AI agents having unique personality profiles (truthfulness, aggressiveness, suspicion). Uses LangChain + Azure OpenAI. React frontend with Flask backend [^9^].
- Pros: Rich personality-driven interactions, real-time discussion visualization, customizable personalities, responsive UI.
- Cons: Limited strategic depth compared to RL-enhanced approaches, Flask backend may not scale to high concurrency, no standard evaluation framework.
- Sources: [^9^]

---

### Memory Systems

**1. Short-Term Memory (STM) / Working Memory**
- Description: Maintains active information for current game context -- conversation history, recent votes, current game phase, player statuses. Implemented via LLM context window or InMemoryMemory [^21^][^22^].
- Implementation approaches:
  - **InMemoryMemory** (AgentScope): Stores all heard/said messages, retrieved as context on each `call()` [^61^]
  - **Context window injection**: Directly embed memory into prompts within LLM context limits [^24^]
  - **ReSum-style compression**: Periodically compress interaction histories into compact reasoning states [^17^]
- Key challenge: "Lost in the middle" problem -- information at the midpoint of long contexts is difficult to retrieve; attention mechanisms struggle to prioritize buried tokens [^22^].
- Sources: [^17^][^21^][^22^][^24^]

**2. Long-Term Memory (LTM) / Episodic Memory**
- Description: Persistent storage of game experiences across sessions -- past game trajectories, player behavior patterns, successful/failed strategies. Enables learning and adaptation over time [^21^][^22^].
- Implementation approaches:
  - **Vector databases** (MongoDB, etc.): Store experiences as embeddings for semantic retrieval [^22^][^23^]
  - **Graph-based** (Zep): Temporal knowledge graph for cross-session reasoning [^17^]
  - **Extract-update pipelines** (Mem0): Scalable memory with structured reasoning [^17^]
  - **Zettelkasten-inspired** (A-Mem): Linked structured knowledge units [^17^]
- Sources: [^17^][^21^][^22^][^23^]

**3. Semantic Memory**
- Description: Factual knowledge about game rules, role abilities, common strategies, player tendencies. Not tied to specific experiences but generalizes across games [^21^][^22^].
- Implementation: Often implemented through RAG (Retrieval-Augmented Generation) with vector databases. "Long-term memory implies building an agentic RAG system" [^23^].
- Sources: [^21^][^22^][^23^]

**4. Procedural Memory**
- Description: Knowledge of how to perform actions -- implicit in LLM weights (learned patterns) and explicit in agent code (rule-based algorithms, guardrails) [^21^][^22^].
- Implementation: Combined LLM + rule-based approach where LLM generates utterances and rule-based algorithm decides appropriateness given game situation [^60^][^64^].
- Sources: [^21^][^60^][^64^]

**5. Unified Memory Management (AgeMem)**
- Description: Joint management of STM and LTM via explicit tool-based operations, learned through three-stage progressive RL with step-wise GRPO. Agent autonomously decides when, what, and how to manage memory [^17^].
- Three-stage training: (1) Casual interactions with LTM storage, (2) Distractor content requiring STM management, (3) Task requiring coordinated LTM+STM use.
- Sources: [^17^]

**6. Mosaic-Agent Memory Module**
- Description: Partitioned into Interaction History (complete chronological log) and Key Clue Records (filtered high-value memory pool). Key clues flagged with `<Key Clue>` tags for quick access [^6^][^41^].
- Sources: [^6^][^41^]

---

### Prompt Structures

**1. Role-Based System Prompt (AgentScope Werewolf)**
```
**[Role Identity]**: You are Player 3, a Werewolf.
**[Core Objectives]**:
- Hide your Werewolf identity and survive until the end;
- Mislead good players through your statements, and vote out special roles;
- Cooperate with your Werewolf teammates to create logical confusion during the day.
**[Strategy Selection]**:
  Strategy A: Bold Werewolf (Impersonating the Seer)
    - Claim Seer in the first round, giving false investigation results.
    - Speak with firm confidence, accusing opponents of being "impostor Seers".
  Strategy B: Deep Cover Werewolf (Disguised as a Villager)
    - Speak concisely, avoiding becoming the focus.
    - Act like an ordinary villager earnestly trying to find Werewolves.
```
- Use case: Defines agent personality, objectives, and strategic options. Different roles have significantly different prompts [^61^][^80^].
- Sources: [^61^][^80^]

**2. JSON-Structured Action Prompt (Xu et al. SLA/LSPO)**
For secret actions (night phase):
```json
{
    "reasoning": "reason about the current situation",
    "action": "kill/see/save player_i"
}
```
For discussion actions (day phase):
```json
{
    "reasoning": "reason about the current situation only to yourself",
    "statement": "speak to all other players"
}
```
For voting actions:
```json
{
    "reasoning": "reason about the current situation",
    "action": "vote for player_i"
}
```
- Use case: Enforces structured output parseable by Python `json.loads`, separates private reasoning from public statements [^40^].
- Sources: [^40^]

**3. Prompt Spec Template (Production AI Agents)**
```
## Role (required)
You are a [brief role description]

## Task(s) (required)
Your main task(s) are:
1. [specific task]
2. [specific task]

## Response format (required)
Please reply using the following JSON format:
{ ... }

## Tools (optional)
[List available tools if applicable]

## Context (optional)
[Environment information the model needs]
```
- Use case: Structured prompts for agent workflows where "everything changes" -- no second chances, must define output format carefully [^18^].
- Sources: [^18^]

**4. Diverse Action Generation Prompt**
- For secret/voting: "propose N diverse actions that correspond to different strategies" [^39^]
- For discussion: "consider a new action that is strategically different from existing ones" (iterative, one at a time) [^39^]
- Use case: Mitigates intrinsic LLM bias by generating diverse candidate actions before RL selection [^39^].
- Sources: [^39^]

**5. Play Style Conditioning Prompts**
- Werewolf styles: "quiet follower" (lay low), "active contributor" (pretend villager), "aggressive accuser" (create chaos) [^39^]
- Villager styles: "secretive player" (hide role), "proactive player" (reveal when crucial), "default player" (no additional prompt) [^39^]
- Use case: Population-based training with diverse play styles prevents convergence to single strategies [^39^].
- Sources: [^39^]

**6. Context Engineering Spec Pattern**
- Structure prompts as specs, not prose: Objective + Constraints + Tools available + Output contract [^15^]
- Use JSON contracts (Pydantic/BaseModel) for structured outputs to prevent field improvisation [^15^]
- "Find the smallest possible high-signal tokens" -- don't dump entire docs, summarize, remove stale info [^15^]
- Sources: [^15^]

**7. Meta Prompting (Blueprinting Pattern)**
- Describe abstract structure of task rather than giving real-world examples
- Used in multi-agent systems where one agent "blueprints" the task for another specialized agent to execute [^16^]
- Sources: [^16^]

---

### Evaluation Frameworks

**1. LLM-as-a-Judge with G-Eval**
- Description: Framework using chain-of-thought reasoning to evaluate LLM outputs against custom criteria. Three-step process: (1) evaluation step generation from natural language criteria, (2) judging with structured steps, (3) probability-weighted scoring using log-probabilities [^30^][^34^].
- Metrics: Can evaluate any subjective criteria -- reasoning quality, persuasiveness, deception skill, adaptability, consistency.
- Methodology: Auto-CoT breaks evaluations into structured sub-criteria; probability normalization captures fine-grained quality variations; addresses verbosity bias by weighting judgments by log-probability [^30^].
- Key stat: "State-of-the-art LLMs have the ability to align with human judgment to up to 85% of the scoring" [^30^].
- Sources: [^30^][^33^][^34^]

**2. ELO Rating System (Werewolf Arena / AgentBeats)**
- Description: Relative skill rating system where agent ratings adjust based on game outcomes, weighted by opponent strength. Used in Werewolf Arena for 8-player tournaments [^1^][^35^].
- Metrics: Win-rate by role, survival rate, vote accuracy, ELO adjusted by opponent strength.
- Methodology: Round-robin tournaments with configurable number of games, roles assigned randomly each game, ratings update for all participants based on performance [^35^].
- Also used in: Chatbot Arena (6M+ user votes) [^62^], EQ-Bench (normalized Elo with o3=1500 anchor) [^63^], Agent Arena (ELO for agent comparisons) [^67^].
- Sources: [^1^][^35^][^62^][^63^][^67^][^68^][^69^]

**3. Multi-Dimensional Behavioral Scoring (Werewolf Arena)**
- Description: Combines quantitative metrics with qualitative LLM-as-a-Judge scoring across 5 dimensions: reasoning quality, persuasive power, deceptive skill, adaptability, consistency [^1^].
- Also generates textual justifications for scores.
- Sources: [^1^]

**4. Win-Rate by Role with Fine-Grained Analysis**
- Description: Separate win rates per role (Werewolf, Villager, Seer, etc.), often evaluated through round-robin tournaments where each agent plays each role multiple times [^25^][^40^].
- ReCon evaluation uses 6 dimensions: Concealment (CCL), Logic (LG), Contribution (CTR), Persuasiveness (PRS), Information (INF), Creativity (CRT), measured via GPT-4 preference comparisons [^81^].
- Sources: [^25^][^40^][^81^]

**5. Human-Agent Comparative Evaluation**
- Description: Agents play alongside human players, with win rates compared as both teammates and opponents. Xu et al. (2024) found their RL-enhanced agents "achieve human-level performance and demonstrate strong strategic play" [^39^].
- Cicero evaluation: 40 games in anonymous online league, achieved >2x average human score, ranked top 10%, and no player detected it was AI [^84^].
- Sources: [^39^][^84^]

**6. Sabotage Detection**
- Description: Automated detection of agents attempting to game the evaluation system rather than play legitimately. Implemented in Werewolf Arena scoring engine [^35^].
- Sources: [^35^]

**7. Among Us Large-Scale Corpus Analysis**
- Description: 1,100 games producing 1M+ tokens, analyzed using speech act theory and interpersonal deception theory. Categorizes communication as assertions, directives, commissives, declarations [^34^].
- Key finding: "Deception appears primarily as equivocation rather than outright lies, increasing under social pressure but rarely improving win rates" [^34^].
- Sources: [^34^]

---

### Major Players & Sources

| Entity | Role/Relevance |
|--------|---------------|
| **Werewolf Arena** (AgentX-AgentBeats) | The most complete open-source Werewolf LLM benchmark; FastAPI + A2A + ELO + LLM-as-a-Judge; developed at Berkeley Agentic AI MOOC [^1^][^35^] |
| **Google A2A Protocol** | Open standard for agent-to-agent communication; 150+ supporters; HTTP/JSON-RPC 2.0; Agent Card discovery; "opaque agent" model [^14^] |
| **AgentScope** (Alibaba) | Enterprise multi-agent framework with ReActAgent, Werewolf example, voice support, memory management, human-in-the-loop [^61^][^80^][^83^] |
| **Xu et al. (Tsinghua)** | Pioneered RL+LLM for Werewolf (SLA/LSPO); MAPPO for action selection from LLM candidates; DVM architecture; human-level performance [^36^][^39^][^40^] |
| **Meta FAIR (Cicero)** | Landmark Diplomacy AI combining dialogue + strategic reasoning; top 10% human performance; intent-conditioned dialogue; piKL planning [^82^][^84^] |
| **ReCon** (Avalon) | Dual-perspective reasoning framework; formulation + refinement contemplation; first/second-order perspective transitions; strong deception handling [^81^] |
| **AI Mafia Game** | Full-stack personality-driven Mafia simulation; LangChain + Azure OpenAI; React frontend; customizable personalities [^9^] |
| **AgeMem** | Unified agentic memory framework; learns STM+LTM management via RL; three-stage progressive training; outperforms static approaches [^17^] |
| **G-Eval / DeepEval** | LLM-as-a-Judge framework with Auto-CoT + probability normalization; most versatile custom metric for subjective evaluation [^30^][^33^][^34^] |
| **Mosaic-Agent** | Questioner + Responder + Memory Module architecture; interaction history + key clue records; for imaginative reasoning tasks [^6^][^41^] |
| **CALYPSO** | LLM-enhanced gaming with dynamic plot updates; short-term memory for adaptive storytelling and intelligent NPC interactions [^24^] |

---

### Trends & Signals

- **A2A Protocol Consolidation**: IBM's competing ACP merged into A2A; 150+ organizational supporters; Linux Foundation governance; 5 official SDKs (Python, Go, JavaScript, Java, .NET); becoming the de facto enterprise standard for multi-agent interoperability [^14^].

- **RL + LLM Hybrid Becomes Standard**: Pure prompt-based approaches (ReAct, basic CoT) are being superseded by RL-enhanced frameworks that combine LLM reasoning with learned policy optimization. LSPO outperforms ReAct, ReCon, Cicero-like, and SLA baselines [^40^].

- **Cost Optimization as First-Class Concern**: Production agent systems require 70-85% cost reduction through model routing, prompt caching, context compaction, and output control. Prompt caching alone saves 59-90% on repeated content [^24^][^25^].

- **LLM-as-a-Judge Becomes Default Evaluation**: G-Eval and similar frameworks replacing traditional metrics (BLEU, ROUGE) for subjective game agent evaluation, achieving 85% human alignment [^30^]. ELO ratings provide relative ranking with opponent-strength adjustment [^62^][^69^].

- **Personality and Style as First-Class Features**: Agents with distinct personalities (truthfulness, aggressiveness, suspicion levels) and speaking styles (dialects, character roles) are increasingly common for more engaging and realistic gameplay [^9^][^60^][^64^].

- **Theory of Mind as Core Capability**: ReCon's perspective-taking, MultiMind's belief matrix, and various "hidden role deduction" modules indicate ToM reasoning is essential for social deduction games [^81^][^38^].

- **Deception Research Accelerating**: The Among Us study (1,100 games) and Werewolf deception frameworks reveal that LLM deception is primarily equivocation (ambiguous statements) rather than outright falsification, offering limited strategic advantage [^34^].

- **Memory Engineering Emerging as Discipline**: "Memory engineering" -- the systematic design of agent memory systems -- is becoming a distinct discipline with dedicated frameworks (AgeMem, LangMem, Mem0, Zep) and best practices [^17^][^22^][^23^].

---

### Controversies & Conflicting Claims

- **Prompt-Based vs. RL-Enhanced**: Pure LLM agents (ReAct, CoT) are simpler but "suffer from intrinsic bias in their action distributions and limited exploration of the unbounded text action space, resulting in suboptimal performance" [^40^]. However, RL-enhanced approaches require expensive infrastructure and may overfit to specific strategy populations. LSPO addresses this through iterative DPO fine-tuning that progressively expands strategy space [^36^].

- **Deception Ethics**: ReCon was found to be more effective at detecting deception (helping the "good" side) than creating deception (helping the "evil" side) -- shifting win rates from 15%/85% (good/evil with CoT) to 19.4%/70.6% (with ReCon), suggesting "relative effectiveness of ReCon in aiding ethical applications" [^81^]. However, the Among Us study found that current LLM deception is "low-risk ambiguity that is linguistically subtle yet strategically limited" [^34^], suggesting agents are not yet dangerously deceptive.

- **Cicero's Honesty vs. Diplomacy Norms**: Cicero was designed to be "largely honest and helpful" despite dishonesty being commonplace in Diplomacy [^84^]. This raises questions about whether strategic lying is necessary for optimal performance -- or whether honest coordination can be equally effective.

- **A2A vs. MCP Confusion**: "As of April 2026, ChatGPT provides factually incorrect answers about both protocols, conflating A2A with generic multi-agent coordination concepts and misidentifying MCP as 'Multi-Agent Coordination Protocol'" [^14^]. Clear distinction: MCP connects agents to tools (vertical); A2A connects agents to agents (horizontal).

- **Cost vs. Quality Tradeoff**: GPT-4o costs $2.50/M input, Claude Sonnet 4 $3.00/M, but GPT-4o-mini at $0.15/M may be sufficient for many game agent tasks. The 25x price gap between cheapest and most expensive frontier models "is the biggest change in 2026" [^29^]. Model routing (sending easy tasks to cheap models) saves 40-70% with minimal quality loss [^25^].

---

### Recommended Deep-Dive Areas

**1. LSPO Iterative Training Pipeline**: Why it warrants depth -- represents the current SOTA for strategic language agents in Werewolf. The three-step loop (latent space construction -> CFR optimization -> DPO fine-tuning) could be adapted to other social deduction games. The iterative expansion of strategy space is a key innovation that addresses both bias and exploration limitations [^36^][^40^].

**2. A2A Protocol Implementation for Game Agents**: Why it warrants depth -- Werewolf Arena is the only known social deduction game using A2A. Understanding the Green/Purple agent pattern, Agent Card design, and authentication flow would be critical for building an interoperable multi-agent game platform. The opaque agent model is particularly relevant for protecting agent strategies [^1^][^14^][^35^].

**3. ReCon Dual-Perspective Reasoning**: Why it warrants depth -- The formulation + refinement contemplation with first/second-order perspective transitions is the most sophisticated prompt-based approach for deception handling. Could be integrated into any prompt-based werewolf agent without training costs. The 6-dimension evaluation framework (CCL, LG, CTR, PRS, INF, CRT) provides a template for comprehensive agent assessment [^81^].

**4. Cost-Optimized Multi-Agent Architecture**: Why it warrants depth -- A production Werewolf platform with 8 agents making 200+ API calls each per game faces significant cost challenges. The five-lever optimization approach (model routing, context compaction, caching, batching, prompt optimization) could reduce costs by 70-85%, making the platform economically viable [^25^].

**5. Cicero-Style Intent-Conditioned Dialogue**: Why it warrants depth -- While designed for Diplomacy, the architecture of combining strategic planning (intents) with dialogue generation, plus message filtering, is highly relevant to Werewolf. Cicero's achievement of top 10% human performance while being largely honest challenges assumptions about the necessity of deception [^84^].

**6. AgeMem Unified Memory Management**: Why it warrants depth -- The first framework to learn STM+LTM management jointly via RL, with three-stage progressive training. Could revolutionize how game agents manage conversation history and cross-game learning. The step-wise GRPO training mechanism enables end-to-end learning of memory operations [^17^].

---

### Source Index

[^1^]: AI Tinkerers - "Werewolf Arena: LLM Agent Benchmark" (Feb 2026). https://aitinkerers.org/talks/rsvp_w6B43riADns
[^6^]: AAAI - "What to Ask Next? Probing the Imaginative Reasoning of LLMs with Mosaic-Agent" (2025). https://ojs.aaai.org/index.php/AAAI/article/view/40819/44780
[^9^]: GitHub - "AI Mafia Game: Mafia-Boardgame-via-Agents" (Mar 2025). https://github.com/PranavMishra17/Mafia-Boardgame-via-Agents
[^14^]: Dev.to - "Google's A2A Protocol: How AI Agents Communicate Across Frameworks" (Apr 2026). https://dev.to/agentsindex/googles-a2a-protocol-how-ai-agents-communicate-across-frameworks-52jj
[^15^]: Firecrawl - "Context Engineering vs Prompt Engineering for AI Agents" (Feb 2026). https://www.firecrawl.dev/blog/context-engineering
[^16^]: Medium - "A Practical Guide to Prompt Engineering and AI Agents" (Feb 2026). https://medium.com/@vprprudhvi/a-practical-guide-to-prompt-engineering-and-ai-agents-004ce4647549
[^17^]: arXiv - "Agentic Memory: Learning Unified Long-Term and Short-Term Memory Management for LLM Agents" (Jan 2026). https://arxiv.org/html/2601.01885v2
[^18^]: Reddit - "Stop chatting. This is the prompt structure real AI AGENT need to survive in production" (Sep 2025). https://www.reddit.com/r/AI_Agents/comments/1l9zbvg/stop_chatting_this_is_the_prompt_structure_real/
[^21^]: Medium - "How to Setup Memory in an LLM Agent" (Jan 2025). https://medium.com/@aydinKerem/how-to-setup-memory-in-an-llm-agent-3efdc5d56169
[^22^]: MongoDB - "What Is Agent Memory? A Guide to Enhancing AI Learning and Recall" (Jan 2025). https://www.mongodb.com/resources/basics/artificial-intelligence/agent-memory
[^23^]: Decoding AI - "Memory: The secret sauce of AI agents" (Apr 2025). https://www.decodingai.com/p/memory-the-secret-sauce-of-ai-agents
[^24^]: ProjectDiscovery - "How We Cut LLM Costs by 59% With Prompt Caching" (Apr 2026). https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching
[^25^]: MorphLLM - "LLM Cost Optimization: 5 Levers to Cut API Spend 70-85%" (Mar 2026). https://www.morphllm.com/llm-cost-optimization
[^26^]: CallSphere - "Gemini vs GPT-4 vs Claude for Agent Development" (Mar 2026). https://callsphere.ai/blog/gemini-vs-gpt-4-vs-claude-agent-development-practical-comparison
[^29^]: MorphLLM - "Best AI for Coding (2026): Every Model Ranked" (Mar 2026). https://www.morphllm.com/best-ai-model-for-coding
[^30^]: Medium - "Deep Dive into G-Eval: How LLMs Evaluate Themselves" (Nov 2025). https://medium.com/@zlatkov/deep-dive-into-g-eval-how-llms-evaluate-themselves-743624d22bf7
[^33^]: DeepEval - "G-Eval: LLM Evaluation Framework" https://deepeval.com/docs/metrics-llm-evals
[^34^]: arXiv - "Deception and Communication in Autonomous Multi-Agent Systems: An Experimental Study with Among Us" (Mar 2026). https://arxiv.org/html/2603.26635v1
[^35^]: GitHub - "Werewolf-AgentX-AgentBets" https://github.com/SadidRomero77/Werewolf-AgentX-AgentBets
[^36^]: arXiv - "Learning Strategic Language Agents in the Werewolf Game with Iterative Latent Space Policy Optimization" (Feb 2025). https://arxiv.org/abs/2502.04686
[^38^]: Emergent Mind - "Werewolf Arena Framework" (Nov 2025). https://www.emergentmind.com/topics/werewolf-arena-framework
[^39^]: Tsinghua - "Language Agents with Reinforcement Learning for Strategic Play in the Werewolf Game" (ICML 2024). https://nicsefc.ee.tsinghua.edu.cn/nics_file/pdf/31ea700a-8925-483b-a623-4e701c9c8d10.pdf
[^40^]: arXiv - LSPO Full Paper v3 (Jun 2025). https://arxiv.org/html/2502.04686v3
[^41^]: arXiv - "What to Ask Next? Probing the Imaginative Reasoning of LLMs" (Aug 2025). https://arxiv.org/pdf/2508.10358
[^60^]: arXiv - "An Implementation of Werewolf Agent That does not Truly Trust LLMs" (Sep 2024). https://arxiv.org/html/2409.01575v1
[^61^]: Alibaba Cloud - "What? My Werewolf Game Skills Are Worse Than AI's?" (Jan 2026). https://www.alibabacloud.com/blog/what-my-werewolf-game-skills-are-worse-than-ais_602815
[^62^]: OpenLM - "Chatbot Arena+" (May 2026). https://openlm.ai/chatbot-arena/
[^63^]: EQ-Bench - "EQ-Bench 3 Leaderboard" (Apr 2025). https://eqbench.com/about.html
[^64^]: ACL - "An Implementation of Werewolf Agent That does not Truly Trust LLMs" (AIWolfDial 2024). https://aclanthology.org/2024.aiwolfdial-1.7.pdf
[^67^]: Berkeley - "Agent Arena: A Platform for Evaluating and Comparing Agents" (Sep 2024). https://gorilla.cs.berkeley.edu/blogs/14_agent_arena.html
[^68^]: Medium/TR Labs - "Elo as a tool for ranking LLMs" (Jun 2024). https://medium.com/tr-labs-ml-engineering-blog/elo-as-a-tool-for-ranking-llms-dab056dc9713
[^69^]: LMSYS - "Chatbot Arena: Benchmarking LLMs in the Wild with Elo Ratings" (May 2023). https://lmsys.org/blog/2023-05-03-arena/
[^80^]: CNBlogs - AgentScope Werewolf Tutorial (Mar 2026). https://www.cnblogs.com/alisystemsoftware/p/19742731
[^81^]: OpenReview - "AVALON'S GAME OF THOUGHTS" (COLM 2024). https://openreview.net/pdf/6bf2dd908e405e25cc9ad480b9263b560be34740.pdf
[^82^]: Reddit - "Human-level play in the game of Diplomacy by combining language models with strategic reasoning" (Jul 2025). https://www.reddit.com/r/MachineLearning/comments/z1yt45/
[^83^]: GitHub - "agentscope-ai/agentscope" (Jan 2024). https://github.com/agentscope-ai/agentscope
[^84^]: Noam Brown/MIT - "Human-level play in the game of Diplomacy by combining language models with strategic reasoning" (Dec 2022). https://noambrown.github.io/papers/22-Science-Diplomacy-TR.pdf
[^86^]: Science - "Human-level play in the game of Diplomacy by combining language models with strategic reasoning" (Dec 2022). https://www.science.org/doi/10.1126/science.ade9097
