# Dimension 7: Multi-Channel Chat System, NLP Generation & Content Moderation

## Werewolf Multiplayer Game Platform — Technical Deep Dive

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Chat System Architecture Overview](#2-chat-system-architecture-overview)
3. [Channel Configuration](#3-channel-configuration)
4. [Message Type Schemas](#4-message-type-schemas)
5. [WebSocket Event Specifications](#5-websocket-event-specifications)
6. [NLP Generation Pipeline](#6-nlp-generation-pipeline)
7. [Content Moderation System](#7-content-moderation-system)
8. [Typing Indicators & Presence](#8-typing-indicators--presence)
9. [Chat History Persistence & Replay](#9-chat-history-persistence--replay)
10. [Rate Limiting & Spam Prevention](#10-rate-limiting--spam-prevention)
11. [Spectator & Dead Player Chat](#11-spectator--dead-player-chat)
12. [API Specifications](#12-api-specifications)
13. [Implementation Recommendations](#13-implementation-recommendations)
14. [Source Citations](#14-source-citations)

---

## 1. Executive Summary

This document provides a comprehensive technical specification for the chat and communication infrastructure of a Werewolf multiplayer game platform. The system must support **multiple concurrent chat channels** with strict **role-based access control**, **structured message types** (FreeText, Vote, Accuse, Defend, ClaimRole, Whisper), **AI-powered natural language generation** with personality variation, **real-time content moderation** for toxicity and profanity, **typing indicators**, **message history persistence**, and **rate limiting** — all delivered through WebSocket connections with sub-100ms latency.

**Key architectural decisions**:
- **WebSocket (Socket.IO) + Redis Pub/Sub** for real-time message routing [^364^] [^369^]
- **Room-based channel isolation** with server-side role validation for Werewolf's phase-dependent communication [^192^] [^428^]
- **Tiered content moderation pipeline** (keyword filter → embedding classifier → fine-tuned transformer → LLM for edge cases) [^345^] [^400^]
- **Cascading rate limiter** with per-channel, per-player, and per-message-type limits
- **Redis-backed presence** for typing indicators and online status [^349^] [^351^]

---

## 2. Chat System Architecture Overview

### 2.1 High-Level Architecture

```
                    +-------------------------+
                    |      Load Balancer      |
                    |    (Sticky Sessions)    |
                    +------------+------------+
                                 |
            +--------------------+--------------------+
            |                    |                    |
    +-------v--------+  +-------v--------+  +-------v--------+
    |  Game Server 1 |  |  Game Server 2 |  |  Game Server N |
    |  (WebSocket)   |  |  (WebSocket)   |  |  (WebSocket)   |
    +-------+--------+  +-------+--------+  +-------+--------+
            |                    |                    |
            +--------------------+--------------------+
                                 |
                    +------------v------------+
                    |    Redis Cluster        |
                    |  +-------------------+  |
                    |  |    Pub/Sub        |  |
                    |  |  chat:global      |  |
                    |  |  chat:match:id    |  |
                    |  |  chat:werewolf:id |  |
                    |  |  chat:dead:id     |  |
                    |  +-------------------+  |
                    |  +-------------------+  |
                    |  |    Presence Store  |  |
                    |  |  (online_users)   |  |
                    |  +-------------------+  |
                    |  +-------------------+  |
                    |  |  Message History   |  |
                    |  |  (chat:history:*) |  |
                    |  +-------------------+  |
                    +------------+------------+
                                 |
                    +------------v------------+
                    |   Moderation Service    |
                    |  (Tiered Pipeline)      |
                    +-------------------------+
```

**Architecture Pattern**: Each game server maintains WebSocket connections to clients. Messages are published to Redis Pub/Sub channels for cross-server broadcast, and persisted to Redis Lists for history retrieval. The moderation service operates as a sidecar pipeline intercepting messages before delivery [^364^] [^366^].

### 2.2 Core Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| WebSocket Layer | Socket.IO / raw `ws` | Bidirectional client-server communication |
| Message Router | Redis Pub/Sub | Cross-server message broadcast (<1ms delivery) [^364^] |
| Channel Manager | Room-based (Socket.IO rooms) | Logical channel isolation per game/role |
| Presence Store | Redis Hash + TTL | Online status, typing indicators, speaking state [^351^] |
| History Store | Redis List (LRU) | Recent message persistence with configurable retention |
| Moderation Pipeline | Multi-tier (keyword → embedding → transformer → LLM) | Real-time toxicity filtering [^345^] |
| Rate Limiter | Sliding Window Counter (Redis) | Per-player, per-channel message throttling [^405^] |

### 2.3 Message Flow

**Phase 1: Public Day Chat (All Players)**
```
Player A types message
  → Client emits "chat:message" { channel: "public", content: "..." }
  → Server validates: is Day phase? is player alive?
  → Moderation pipeline filters content
  → Server publishes to Redis: "chat:match:{match_id}:public"
  → All subscribers (game servers) receive message
  → Each server forwards to connected clients in that room
  → Message persisted to Redis List for history
```

**Phase 2: Werewolf Night Chat (Werewolves Only)**
```
Werewolf B types message
  → Client emits "chat:message" { channel: "werewolf", content: "..." }
  → Server validates: is Night phase? is player werewolf? is player alive?
  → Server checks socket.data.role === "werewolf"
  → Only publishes to "chat:match:{match_id}:werewolf" room
  → Only werewolf clients receive the message
  → Non-werewolf players never see this channel exists [^428^]
```

**Phase 3: Spectator/Dead Chat**
```
Eliminated Player C types message
  → Client emits "chat:message" { channel: "spectator", content: "..." }
  → Server validates: is player dead OR is spectator role?
  → Publishes to "chat:match:{match_id}:spectator"
  → Only dead players and spectators receive messages
  → Living players never see this channel [^357^]
```

---

## 3. Channel Configuration

### 3.1 Channel Types Table

| Channel ID | Name | Visibility | Who Can Send | Who Can Read | Persistence | TTL |
|------------|------|------------|--------------|--------------|-------------|-----|
| `public` | Day Chat | All living players | Living players only | All living players | Yes | 24h |
| `werewolf` | Night Chat | Werewolf team only | Werewolf role + alive | Werewolf role + alive | Yes | 24h |
| `spectator` | Dead/Spectator Chat | Dead + spectators | Dead + spectators | Dead + spectators | Yes | 24h |
| `system` | Game Events | Everyone (read-only) | Server only | All connected | Yes | 48h |
| `whisper:{player_id}` | Private Whisper | Sender + recipient | Living players | Sender + recipient | No (ephemeral) | 5min |
| `admin` | Admin Moderation | Moderators only | Moderators | Moderators | Yes | 72h |

### 3.2 Channel Lifecycle

Channels are created dynamically per game match:

```javascript
// Server-side channel creation on match start
function createMatchChannels(matchId, werewolfPlayerIds, deadPlayerIds = []) {
  const channels = {
    // Public day chat - all living players
    [`match:${matchId}:public`]: {
      type: 'public',
      canSend: (player) => player.isAlive,
      canRead: (player) => player.isAlive,
    },
    // Werewolf night chat - werewolf team only
    [`match:${matchId}:werewolf`]: {
      type: 'private',
      canSend: (player) => player.isAlive && player.role === 'werewolf',
      canRead: (player) => player.isAlive && player.role === 'werewolf',
    },
    // Dead/spectator chat
    [`match:${matchId}:spectator`]: {
      type: 'spectator',
      canSend: (player) => !player.isAlive || player.isSpectator,
      canRead: (player) => !player.isAlive || player.isSpectator,
    },
    // System announcements
    [`match:${matchId}:system`]: {
      type: 'system',
      canSend: () => false, // Server only
      canRead: () => true,
    }
  };
  return channels;
}
```

### 3.3 Channel Security Model

Authorization is enforced server-side on every message:

```javascript
// Socket.IO middleware pattern for role-based channel access
io.use((socket, next) => {
  // Attach player data from JWT token
  socket.data.playerId = decoded.playerId;
  socket.data.role = decoded.role; // 'werewolf', 'villager', 'seer', etc.
  socket.data.isAlive = decoded.isAlive;
  socket.data.matchId = decoded.matchId;
  next();
});

// Per-message authorization
socket.on('chat:message', async (data, callback) => {
  const { channel, content, messageType } = data;
  
  // Validate channel access
  const channelConfig = getChannelConfig(socket.data.matchId, channel);
  if (!channelConfig.canSend(socket.data)) {
    return callback({ error: 'Unauthorized: cannot send to this channel' });
  }
  
  // Validate game phase allows this message type
  if (!isMessageTypeAllowed(messageType, currentPhase, socket.data.role)) {
    return callback({ error: 'Message type not allowed in current phase' });
  }
  
  // Proceed with moderation and delivery...
});
```

This pattern ensures that "even if a client attempts to subscribe to a restricted channel, the server validates their role before allowing message reception" [^428^]. For Werewolf specifically, non-werewolf players should never see evidence that the werewolf channel exists — no channel list, no typing indicators, no notification sounds.

---

## 4. Message Type Schemas

### 4.1 Base Message Schema

All messages share a common envelope:

```json
{
  "id": "msg_uuid_v4",
  "timestamp": "2026-01-15T10:30:00.000Z",
  "matchId": "match_uuid",
  "channel": "public|werewolf|spectator|system|whisper",
  "senderId": "player_uuid",
  "senderName": "PlayerName",
  "senderRole": "villager|werewolf|seer|bodyguard|...",
  "messageType": "FreeText|Vote|Accuse|Defend|ClaimRole|Whisper|System",
  "content": { },
  "metadata": {
    "gamePhase": "day|night|voting|transition",
    "roundNumber": 3,
    "isModerated": true,
    "moderationScore": 0.02
  }
}
```

### 4.2 FreeText Message

```json
{
  "messageType": "FreeText",
  "content": {
    "text": "I think Player3 is suspicious because they changed their story.",
    "format": "plain|markdown",
    "mentions": ["player3_id"],
    "replyTo": null
  }
}
```

### 4.3 Vote Message

```json
{
  "messageType": "Vote",
  "content": {
    "targetId": "player3_uuid",
    "targetName": "Player3",
    "voteType": "lynch|eliminate|no_lynch",
    "reason": "Changed story, inconsistent alibi",
    "isAnonymous": false
  }
}
```

### 4.4 Accuse Message

```json
{
  "messageType": "Accuse",
  "content": {
    "targetId": "player3_uuid",
    "targetName": "Player3",
    "accusation": "I believe Player3 is a werewolf because they defended Player5 who was confirmed wolf.",
    "evidence": ["day1_statement", "day2_vote_pattern"],
    "confidence": 0.75
  }
}
```

### 4.5 Defend Message

```json
{
  "messageType": "Defend",
  "content": {
    "responseTo": "accusation_msg_id",
    "defense": "I voted for Player5 because the evidence was strong, not because I'm working with them.",
    "counterArguments": ["My voting record shows independent decisions"],
    "requestedRoleReveal": false
  }
}
```

### 4.6 ClaimRole Message

```json
{
  "messageType": "ClaimRole",
  "content": {
    "claimedRole": "seer",
    "proof": {
      "investigatedPlayer": "player4_uuid",
      "investigatedResult": "villager",
      "investigationNight": 2
    },
    "isCounterClaim": false,
    "confidence": 0.9
  }
}
```

### 4.7 Whisper Message

```json
{
  "messageType": "Whisper",
  "content": {
    "targetId": "player2_uuid",
    "targetName": "Player2",
    "text": "Meet me in the square after dark.",
    "isEncrypted": true
  },
  "channel": "whisper:player2_uuid",
  "visibility": "sender_and_recipient_only"
}
```

### 4.8 System Message

```json
{
  "messageType": "System",
  "senderId": "system",
  "content": {
    "eventType": "phase_change|death_announcement|vote_result|role_reveal|game_end",
    "title": "Night Falls",
    "body": "The sun sets. Werewolves, choose your prey.",
    "affectedPlayers": ["player3_uuid"],
    "newPhase": "night"
  }
}
```

### 4.9 AI-Generated Message

```json
{
  "messageType": "FreeText",
  "senderId": "ai_player_7",
  "senderName": "AI-7",
  "isAIGenerated": true,
  "content": {
    "text": "Hmm, I'm not sure I trust Player3's sudden change of heart. Yesterday they were adamant about lynching Player5, and now they're defending them? That doesn't add up for me.",
    "generationMetadata": {
      "model": "gpt-4o",
      "personalityProfile": "analytical_skeptic",
      "temperature": 0.7,
      "latencyMs": 850
    }
  }
}
```

---

## 5. WebSocket Event Specifications

### 5.1 Client-to-Server Events

| Event | Payload | Auth Required | Rate Limited | Description |
|-------|---------|---------------|--------------|-------------|
| `chat:send` | `{ channel, messageType, content }` | Yes | Yes (5 msg/10s public, 10 msg/10s werewolf) | Send a chat message |
| `chat:join` | `{ channel }` | Yes | No | Subscribe to a channel |
| `chat:leave` | `{ channel }` | Yes | No | Unsubscribe from a channel |
| `chat:typing:start` | `{ channel }` | Yes | Yes (1/3s) | Emit typing indicator start |
| `chat:typing:stop` | `{ channel }` | Yes | No | Emit typing indicator stop |
| `chat:history:request` | `{ channel, before, limit }` | Yes | Yes (1/5s) | Request message history |
| `chat:report` | `{ messageId, reason }` | Yes | Yes (3/min) | Report a message |
| `vote:cast` | `{ targetId, voteType }` | Yes | Yes (1/phase) | Cast a vote |
| `whisper:send` | `{ targetId, text }` | Yes | Yes (3/round) | Send a private whisper |

### 5.2 Server-to-Client Events

| Event | Payload | Target | Description |
|-------|---------|--------|-------------|
| `chat:message` | `Message` | Channel subscribers | New message in channel |
| `chat:history` | `{ channel, messages[] }` | Requester | Message history response |
| `chat:typing` | `{ userId, userName, isTyping }` | Channel subscribers | Typing indicator update |
| `chat:user:join` | `{ userId, userName, channel }` | Channel subscribers | User joined channel |
| `chat:user:leave` | `{ userId, userName, channel }` | Channel subscribers | User left channel |
| `chat:deleted` | `{ messageId, reason }` | Original recipients | Message was moderated |
| `chat:muted` | `{ duration, reason }` | Target player | Player was muted |
| `system:phase_change` | `{ newPhase, duration }` | All in match | Game phase changed |
| `system:player_died` | `{ playerId, playerName, role }` | All in match | Player eliminated |
| `presence:update` | `{ userId, status }` | All friends/room | Presence status changed |
| `error` | `{ code, message }` | Sender | Error response |

### 5.3 Message Validation Rules

```javascript
const messageValidationRules = {
  FreeText: {
    maxLength: 500,
    allowedChannels: ['public', 'werewolf', 'spectator'],
    allowedPhases: ['day', 'night'], // night only for werewolf channel
    requiredFields: ['text'],
    forbiddenPatterns: [/^\/meta/i, /^\/ooc/i] // No out-of-character messages
  },
  Vote: {
    allowedChannels: ['public'],
    allowedPhases: ['voting'],
    requiredFields: ['targetId', 'voteType'],
    maxPerPhase: 1,
    targetMustBe: 'alive'
  },
  Accuse: {
    allowedChannels: ['public'],
    allowedPhases: ['day'],
    requiredFields: ['targetId', 'accusation'],
    cooldownSeconds: 30
  },
  Defend: {
    allowedChannels: ['public'],
    allowedPhases: ['day'],
    requiredFields: ['defense'],
    maxLength: 500
  },
  ClaimRole: {
    allowedChannels: ['public'],
    allowedPhases: ['day'],
    requiredFields: ['claimedRole'],
    oncePerGame: false // Allow multiple claims (counter-claims)
  },
  Whisper: {
    allowedChannels: ['whisper'],
    allowedPhases: ['day'],
    requiredFields: ['targetId', 'text'],
    maxLength: 200,
    maxPerRound: 3
  }
};
```

---

## 6. NLP Generation Pipeline

### 6.1 Overview

The NLP generation pipeline produces human-like dialogue for AI players with personality variation, contextual awareness, and game-appropriate strategy. The system uses a structured prompt engineering approach with the OCEAN (Big Five) personality model for consistent character behavior [^249^].

### 6.2 Generation Architecture

```
                    +---------------------+
                    |  Game State Context  |
                    |  (phase, votes,     |
                    |   accusations,      |
                    |   player statuses)  |
                    +----------+----------+
                               |
                    +----------v----------+
                    |  Memory Module       |
                    |  (conversation hist  |
                    |   + key events)      |
                    +----------+----------+
                               |
                    +----------v----------+
                    |  Personality Profile |
                    |  (OCEAN + role +     |
                    |   strategy config)   |
                    +----------+----------+
                               |
                    +----------v----------+
                    |  Prompt Assembler    |
                    |  (structured prompt  |
                    |   with all context)  |
                    +----------+----------+
                               |
                    +----------v----------+
                    |  LLM Engine          |
                    |  (GPT-4o / Claude /  |
                    |   GPT-4o-mini)       |
                    +----------+----------+
                               |
                    +----------v----------+
                    |  Output Validator    |
                    |  (JSON schema check, |
                    |   toxicity pre-check)|
                    +----------+----------+
                               |
                    +----------v----------+
                    |  Message Formatter   |
                    |  (inject into chat   |
                    |   as structured msg) |
                    +---------------------+
```

### 6.3 Personality Configuration (OCEAN Model)

Based on research showing "personality-conditioned LLM agents adapt their expressive behaviors across conversational contexts" [^249^], the system uses the Big Five (OCEAN) model:

| Trait | Range | Effect on Dialogue |
|-------|-------|-------------------|
| **Openness** | 0.0 - 1.0 | High = creative accusations, novel strategies; Low = conventional approaches |
| **Conscientiousness** | 0.0 - 1.0 | High = detailed reasoning, evidence-based; Low = impulsive, gut-feel statements |
| **Extraversion** | 0.0 - 1.0 | High = frequent messages, initiates discussions; Low = quiet, responds only when addressed |
| **Agreeableness** | 0.0 - 1.0 | High = cooperative, defends others; Low = aggressive, accuses freely |
| **Neuroticism** | 0.0 - 1.0 | High = anxious language, self-doubt; Low = confident, decisive statements |

### 6.4 Personality Presets for Werewolf Roles

| Role Archetype | O | C | E | A | N | Speaking Style |
|---------------|---|---|---|---|---|----------------|
| **Analytical Villager** | 0.7 | 0.8 | 0.4 | 0.6 | 0.3 | Logical, evidence-driven, methodical |
| **Charismatic Leader** | 0.8 | 0.7 | 0.9 | 0.7 | 0.2 | Confident, rallying others, persuasive |
| **Aggressive Accuser** | 0.6 | 0.5 | 0.8 | 0.2 | 0.5 | Direct, confrontational, frequent accusations |
| **Quiet Observer** | 0.5 | 0.7 | 0.2 | 0.5 | 0.6 | Minimal, thoughtful, speaks only when confident |
| **Bold Werewolf (Deceiver)** | 0.8 | 0.6 | 0.9 | 0.3 | 0.3 | Charismatic but evasive, redirects attention |
| **Deep Cover Werewolf** | 0.4 | 0.8 | 0.3 | 0.7 | 0.2 | Friendly, helpful, blends in as villager |
| **Nervous Werewolf** | 0.5 | 0.4 | 0.5 | 0.4 | 0.9 | Anxious, contradictory, slips under pressure |
| **Wildcard / Jester** | 0.9 | 0.2 | 0.7 | 0.3 | 0.8 | Unpredictable, chaotic, impulsive claims |

### 6.5 Prompt Template for AI Dialogue Generation

```
## ROLE
You are {playerName}, a {role} in a Werewolf game. You are speaking in the
{gamePhase} phase, Round {roundNumber}.

## PERSONALITY PROFILE
Use the following traits to shape your dialogue:
- Openness: {openness} (creativity, willingness to try new strategies)
- Conscientiousness: {conscientiousness} (thoroughness, attention to detail)
- Extraversion: {extraversion} (sociability, talkativeness)
- Agreeableness: {agreeableness} (cooperativeness, trust in others)
- Neuroticism: {neuroticism} (anxiety, emotional instability)

## GAME CONTEXT
{gameStateSummary}

## CONVERSATION HISTORY (recent)
{recentMessages}

## YOUR SITUATION
{personalSituation}

## INSTRUCTIONS
Generate a dialogue message that:
1. Reflects your personality profile
2. Is appropriate for the current game phase
3. Advances your strategic goals (hide if werewolf, find wolves if villager)
4. Responds to recent conversation naturally
5. Is between 20-150 words
6. Sounds like natural human speech (not robotic or overly formal)

## OUTPUT FORMAT
Respond with JSON:
{
  "message": "your dialogue text",
  "reasoning": "brief strategic thinking (not visible to others)",
  "confidence": 0.0-1.0,
  "targetPlayer": "player_id or null",
  "messageType": "FreeText|Accuse|Defend|ClaimRole"
}
```

### 6.6 Context-Sensitive Tone Adaptation

Research shows that "even when given identical personality prompts, LLM agents' linguistic and behavioral patterns varied systematically depending on the social goals of each task" [^346^]. The system implements contextual tone shifting:

| Context | Tone Shift | Example |
|---------|-----------|---------|
| Ice-breaking (Round 1) | Positive valence, high arousal — lively, engaging | "Hey everyone! Let's figure out who the wolves are together!" |
| Negotiation/Voting | Negative valence, moderate arousal — tense, goal-conflict | "I can't let this vote pass without pointing out the inconsistency..." |
| Survival (Late game) | Mixed emotions, moderate intensity | "We're running out of time. I need you all to trust me on this." |
| Empathy (Defending ally) | Positive valence, low arousal — calm, supportive | "I understand why you'd be suspicious, but let me explain my reasoning." |

### 6.7 Cost Optimization for AI Generation

For a production Werewolf platform with 8 AI agents making 200+ API calls per game:

| Strategy | Savings | Implementation |
|----------|---------|----------------|
| **Prompt Caching** | 59-90% | Cache system prompts and game rules [^24^] |
| **Model Routing** | 40-70% | Use GPT-4o-mini for simple responses, GPT-4o for complex strategy [^25^] |
| **Context Compaction** | 50-70% | Compress conversation history, keep only high-signal messages |
| **Batching** | 10-20% | Batch parallel generation requests |
| **Total Optimized** | 70-85% | All strategies combined [^25^] |

---

## 7. Content Moderation System

### 7.1 Tiered Moderation Pipeline

Based on the cascaded confidence-guided approach from gaming toxicity research [^345^]:

```
                    +---------------------+
                    |  Incoming Message    |
                    +----------+----------+
                               |
                    +----------v----------+
         +--------->|  Tier 0: Rule-Based | <-----------+
         |          |  Profanity Filter    |            |
         |          |  (<1ms, blocks 5-10%)|            |
         |          +----------+----------+            |
         |                     |                       |
         |           MATCH ->  |  -> BLOCK + WARN      |
         |                     |                       |
         |          +----------v----------+            |
         |          |  Tier 1: Embedding  |            |
         |          |  + ML Classifier     |            |
         |          |  (CPU, 28 msg/s)     |            |
         |          +----------+----------+            |
         |                     |                       |
         |     CLEAN (<5%) ->  |  -> ALLOW             |
         |     TOXIC (>95%) -> |  -> BLOCK             |
         |     UNCERTAIN ->    |  -> TIER 2            |
         |                     |                       |
         |          +----------v----------+            |
         |          |  Tier 2: Fine-tuned |            |
         |          |  Transformer Model   |            |
         |          |  (DistilBERT, GPU)   |            |
         |          +----------+----------+            |
         |                     |                       |
         |     CLEAN (>95%) -> |  -> ALLOW             |
         |     TOXIC (<5%) ->  |  -> BLOCK             |
         |     UNCERTAIN ->    |  -> TIER 3            |
         |                     |                       |
         |          +----------v----------+            |
         |          |  Tier 3: LLM Review |            |
         |          |  (GPT-4o / RAG)      |            |
         |          |  (human fallback)    |            |
         |          +----------+----------+            |
         |                     |                       |
         |            +--------v--------+              |
         |            | Action Applied  |              |
         |            +-----------------+              |
         |                                             |
         +-----------> FEEDBACK LOOP <-----------------+
                        (model retraining)
```

### 7.2 Moderation Tier Details

**Tier 0 — Rule-Based Profanity Filter** [^345^]
- Latency: <1ms per message
- Coverage: Blocks 5-10% of most blatant abuse
- Method: Handcrafted blacklist + regex patterns
- Actions: Immediate block + warning
- Examples: "\*\*\* you", racial slurs, obvious threats

**Tier 1 — Embedding + ML Classifier** [^345^]
- Latency: ~35ms per message
- Throughput: 28.24 messages/second
- Cost: $0.50 per million messages
- Method: Sentence-BERT embeddings + SVM/Logistic Regression
- Accuracy: 80.8% overall, 61.2% recall
- Best for: High-volume initial screening

**Tier 2 — Fine-tuned Transformer** [^345^]
- Latency: ~50-100ms per message
- Model: DistilBERT fine-tuned on gaming chat data
- Accuracy: 94.3% overall, 91.8% recall
- Cost: ~$1.30 per million messages
- Best for: Moderate-confidence cases from Tier 1
- Note: "Fine-tuned DistilBERT achieves superior accuracy compared to all other methods while maintaining excellent precision and recall balance" [^345^]

**Tier 3 — LLM Review (Human Escalation)** [^345^]
- Latency: 1-2 seconds (async)
- Model: GPT-4o with few-shot prompting
- Accuracy: 91.0% overall, 90.6% recall
- Cost: $2,600x more than embedding methods per message
- Best for: Edge cases, appeals, human review queue

### 7.3 Toxicity Categories

Based on Ubisoft's ToxBuster production system [^400^]:

| Category | Description | Severity | Auto-Action |
|----------|-------------|----------|-------------|
| **Hate Speech** | Attacks based on protected characteristics | Critical | Block + Mute 24h |
| **Harassment** | Targeted abuse at specific players | High | Block + Mute 2h |
| **Profanity** | Offensive language (context-dependent) | Medium | Mask (\*\*\*) or Warn |
| **Spam** | Repeated messages, ads, noise | Low | Rate limit + Warn |
| **Gaming Slang** | Context-dependent (e.g., "killer move") | None | Allow |
| **Self-Harm** | References to self-injury | Critical | Block + Alert moderator |

### 7.4 Context-Aware Moderation Rules

```javascript
const moderationRules = {
  // Context matters for profanity
  "killer move": { 
    context: "gaming_compliment", 
    action: "allow" 
  },
  "that was sick": { 
    context: "gaming_praise", 
    action: "allow" 
  },
  // Friends vs public channel
  friends_chat: {
    profanity_filter: "opt_in", // User-configurable
    toxicity_threshold: 0.85    // Higher threshold
  },
  public_chat: {
    profanity_filter: "mandatory",
    toxicity_threshold: 0.40    // Stricter threshold
  },
  // Werewolf-specific: accusations are gameplay
  "you're lying": {
    context: "werewolf_accusation",
    action: "allow"
  },
  "I think you're the wolf": {
    context: "werewolf_suspicion",
    action: "allow"
  }
};
```

### 7.5 Soft-Prompting for Multi-Game Context

Ubisoft's research introduces a "soft-prompting approach that enables a single model to effectively handle multiple games by incorporating game-context tokens" [^400^]. For Werewolf:

```python
# Soft-prompting with game context tokens
GAME_TYPE_TOKEN = "GAME_WEREWOLF"  # Prepended to input

# This allows the moderation model to understand that:
# - "You're the wolf!" is gameplay, not toxic
# - "I will kill you tonight" refers to game mechanics
# - Accusations and deception are core gameplay elements
```

### 7.6 Multilingual Support

ToxBuster's unified approach achieves "macro F1-scores ranging from 32.96% to 58.88% across French, German, Portuguese, and Russian" using XLM-RoBERTa with LLM-assisted label transfer [^400^]. The framework extends to 7+ languages via GPT-4o-mini for label translation.

| Language | Macro F1 | Notes |
|----------|----------|-------|
| English | 45.39% | Baseline |
| German | 58.88% | Strongest performance |
| Portuguese | 45.39% | Comparable to English |
| Russian | 32.96% | Lower but functional |
| French | 42.15% | Moderate performance |

### 7.7 Mute and Penalty System

```javascript
const penaltySystem = {
  first_offense: {
    action: "warn",
    message: "Your message was flagged. Please keep conversations respectful."
  },
  second_offense: {
    action: "mute",
    duration: "5 minutes",
    channel_specific: true
  },
  third_offense: {
    action: "mute",
    duration: "30 minutes",
    match_wide: true
  },
  severe_offense: {
    action: "immediate_mute",
    duration: "24 hours",
    escalation: "human_review"
  },
  repeat_severe: {
    action: "ban",
    duration: "7 days",
    escalation: "permanent_ban_possible"
  }
};
```

---

## 8. Typing Indicators & Presence

### 8.1 Presence Data Model

```json
{
  "userId": "player_uuid",
  "userName": "PlayerName",
  "status": "online|away|playing|speaking",
  "currentChannel": "public",
  "lastSeen": "2026-01-15T10:30:00.000Z",
  "isTyping": false,
  "isSpeaking": false,
  "currentGamePhase": "day",
  "deviceInfo": {
    "type": "web|mobile|desktop",
    "platform": "ios|android|windows|mac"
  }
}
```

### 8.2 Typing Indicator Implementation

The server acts as a **relay, not a state machine** — clients manage their own debounce timers [^349^]:

```javascript
// Client-side: Debounce pattern (critical for performance)
let typingTimeout = null;
let isTyping = false;
const TYPING_DEBOUNCE_MS = 2000;

function handleInput(channelId) {
  if (!isTyping) {
    socket.emit('chat:typing:start', { channelId });
    isTyping = true;
  }
  
  if (typingTimeout) clearTimeout(typingTimeout);
  
  typingTimeout = setTimeout(() => {
    socket.emit('chat:typing:stop', { channelId });
    isTyping = false;
  }, TYPING_DEBOUNCE_MS);
}

// Server-side: Stateless relay
socket.on('chat:typing:start', ({ channelId }) => {
  // Validate channel access
  if (!canAccessChannel(socket.data, channelId)) return;
  
  // Broadcast to room (not including sender)
  socket.to(`channel:${channelId}`).emit('chat:typing', {
    userId: socket.data.userId,
    userName: socket.data.userName,
    isTyping: true
  });
});
```

**Key Performance Rules**:
- **Debounce**: Emit `typing:start` only on first keystroke, `typing:stop` after 2 seconds of inactivity [^349^]
- **Rate limit typing events**: Max 1 typing event per 3 seconds per user per channel
- **Never persist**: Typing indicators are ephemeral — no database writes [^349^]
- **Room-scoped**: Use Socket.IO rooms for channel-specific typing, not individual socket tracking

### 8.3 "Speaking" Status for Voice

For games with voice chat integration:

```javascript
// Voice activity detection (VAD) events
{
  "eventType": "presence:speaking",
  "userId": "player_uuid",
  "channel": "public",
  "isSpeaking": true,
  "confidence": 0.85,  // VAD confidence
  "volume": -24  // dB level
}
```

Speaking indicators follow the same relay pattern as typing but with shorter debounce (500ms) for natural-feeling responsiveness.

### 8.4 Presence Scaling

For production scale, use Redis-backed presence [^351^]:

```javascript
// Redis presence with TTL
async function updatePresence(userId, status) {
  const key = `presence:${userId}`;
  await redis.hset(key, {
    status,
    lastSeen: Date.now(),
    channel: currentChannel
  });
  await redis.expire(key, 300); // 5-minute TTL
}

// Heartbeat to keep presence alive
setInterval(() => {
  socket.emit('heartbeat');
}, 30000); // Every 30 seconds
```

**Presence cleanup**: A cron job scans for stale entries (TTL expired) and broadcasts offline events [^349^].

---

## 9. Chat History Persistence & Replay

### 9.1 Storage Architecture

**Redis (hot storage)**: Recent messages for active matches
```
Key: chat:history:{match_id}:{channel}
Type: Redis List (LPUSH for new, LTRIM to keep N)
Retention: Last 200 messages per channel, 24h TTL
```

**PostgreSQL (warm storage)**: Complete match history for replay
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  match_id UUID NOT NULL,
  channel VARCHAR(50) NOT NULL,
  message_type VARCHAR(20) NOT NULL,
  sender_id UUID,
  sender_name VARCHAR(50),
  sender_role VARCHAR(20),
  content JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_match_channel (match_id, channel, created_at)
);
```

**S3/Cold Storage (archival)**: Long-term storage for analytics
- Compressed JSON files per match
- Retention: Indefinite (for training AI agents, moderation review)

### 9.2 History API

```javascript
// Fetch message history with pagination
async function getChatHistory(matchId, channel, options = {}) {
  const { before, limit = 50, messageTypes = [] } = options;
  
  // Try Redis first (fast path)
  const redisKey = `chat:history:${matchId}:${channel}`;
  let messages = await redis.lrange(redisKey, 0, limit - 1);
  
  if (messages.length < limit) {
    // Fallback to PostgreSQL for older messages
    const dbMessages = await db.query(`
      SELECT * FROM chat_messages
      WHERE match_id = $1 AND channel = $2
      ${before ? 'AND created_at < $4' : ''}
      ${messageTypes.length ? 'AND message_type = ANY($5)' : ''}
      ORDER BY created_at DESC
      LIMIT $3
    `, [matchId, channel, limit - messages.length, before, messageTypes]);
    
    messages = messages.concat(dbMessages);
  }
  
  return messages.reverse(); // Chronological order
}
```

### 9.3 Chat Log for Replay

For game replay and debugging, all messages are logged with full context:

```json
{
  "replayLog": {
    "matchId": "match_uuid",
    "startTime": "2026-01-15T10:00:00Z",
    "endTime": "2026-01-15T10:45:00Z",
    "events": [
      {
        "timestamp": "2026-01-15T10:00:05Z",
        "phase": "day",
        "round": 1,
        "event": {
          "type": "chat:message",
          "channel": "public",
          "sender": "Player1",
          "messageType": "FreeText",
          "content": "Good morning everyone! Let's find those wolves."
        }
      },
      {
        "timestamp": "2026-01-15T10:00:08Z",
        "phase": "day",
        "round": 1,
        "event": {
          "type": "chat:message",
          "channel": "public",
          "sender": "AI-3",
          "messageType": "Accuse",
          "content": "I think Player2 is suspicious...",
          "aiGenerated": true,
          "personalityProfile": "analytical_skeptic"
        }
      }
    ]
  }
}
```

### 9.4 Replay Features

| Feature | Implementation | Description |
|---------|---------------|-------------|
| **Full Replay** | Stream all messages with original timing | For post-game review |
| **Condensed Replay** | Show only votes, accusations, key events | For quick analysis |
| **Filtered Replay** | Show only specific channels or players | For focused investigation |
| **Phase Navigation** | Jump to Day 1, Night 2, etc. | Time-indexed access |
| **Export** | Download as JSON or text transcript | For external analysis |

---

## 10. Rate Limiting & Spam Prevention

### 10.1 Rate Limiting Strategy

Multiple overlapping rate limits prevent different abuse patterns [^405^]:

```javascript
const rateLimitConfig = {
  // Per-player global limit
  global: {
    algorithm: 'sliding_window',
    windowMs: 60000,     // 1 minute
    maxRequests: 30,     // 30 messages per minute
    keyGenerator: (socket) => `ratelimit:global:${socket.data.playerId}`
  },
  
  // Per-channel limit
  perChannel: {
    algorithm: 'sliding_window',
    windowMs: 10000,     // 10 seconds
    maxRequests: {
      public: 5,
      werewolf: 10,      // More lenient for werewolf coordination
      spectator: 8,
      whisper: 3
    },
    keyGenerator: (socket, channel) => 
      `ratelimit:channel:${socket.data.playerId}:${channel}`
  },
  
  // Per-message-type limit
  perType: {
    Vote: { windowMs: 300000, maxRequests: 1 },      // 1 per voting phase
    Accuse: { windowMs: 30000, maxRequests: 2 },      // 2 per 30s
    ClaimRole: { windowMs: 600000, maxRequests: 3 },  // 3 per 10min
    Whisper: { windowMs: 60000, maxRequests: 3 }      // 3 per minute
  },
  
  // Typing indicator limit
  typing: {
    algorithm: 'fixed_window',
    windowMs: 3000,      // 3 seconds
    maxRequests: 1,      // 1 typing event per 3s
    keyGenerator: (socket, channel) => 
      `ratelimit:typing:${socket.data.playerId}:${channel}`
  },
  
  // Connection limit (prevent spam accounts)
  connection: {
    algorithm: 'sliding_window',
    windowMs: 3600000,   // 1 hour
    maxRequests: 5,      // 5 connections per hour per IP
    keyGenerator: (req) => `ratelimit:ip:${req.ip}`
  }
};
```

### 10.2 Rate Limit Algorithms Comparison

| Algorithm | Complexity | Burst Handling | Memory Usage | Best For |
|-----------|-----------|---------------|--------------|----------|
| **Fixed Window** | Low | Poor (edge bursts) | Low | Simple DDoS protection |
| **Sliding Window** | Medium | Good | Medium | General chat rate limiting |
| **Token Bucket** | Medium | Excellent | Low | APIs with burst tolerance |
| **Leaky Bucket** | Medium | Poor (smooths output) | Low | Outgoing message shaping |

For Werewolf chat, **Sliding Window** is recommended — "it supports smooth requests to avoid burst traffic" and is "suitable for scenarios that require high traffic smoothness" [^405^].

### 10.3 Sliding Window Implementation (Redis)

```javascript
// Redis-backed sliding window rate limiter
async function checkRateLimit(key, windowMs, maxRequests) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const pipeline = redis.pipeline();
  
  // Remove entries outside the window
  pipeline.zremrangebyscore(key, 0, windowStart);
  
  // Count entries within window
  pipeline.zcard(key);
  
  // Add current request
  pipeline.zadd(key, now, `${now}-${Math.random()}`);
  
  // Set expiry on the key
  pipeline.pexpire(key, windowMs);
  
  const results = await pipeline.exec();
  const currentCount = results[1][1];
  
  return {
    allowed: currentCount < maxRequests,
    remaining: Math.max(0, maxRequests - currentCount - 1),
    resetTime: now + windowMs
  };
}
```

### 10.4 Spam Detection Patterns

```javascript
const spamPatterns = {
  // Repeated identical messages
  identicalRepeat: {
    windowMs: 60000,
    maxRepeats: 3,
    action: 'warn_then_mute'
  },
  
  // Character flooding ("aaaaaa", "!!!!!!!!")
  charFlood: {
    pattern: /(.)\1{10,}/,
    action: 'block'
  },
  
  // ALL CAPS messages
  capsSpam: {
    minLength: 20,
    capsRatio: 0.8,
    action: 'warn'
  },
  
  // Rapid-fire short messages
  rapidFire: {
    minMessageLength: 5,
    windowMs: 10000,
    maxMessages: 5,
    action: 'rate_limit'
  },
  
  // URL/invite spam
  urlSpam: {
    pattern: /(https?:\/\/|discord\.gg|t\.me)/i,
    action: 'block_and_mute',
    muteDuration: 3600
  }
};
```

### 10.5 WebSocket-Specific Rate Limits

A production WebSocket rate limiting iRule enforces: "Each client IP is allowed up to 40 messages per 10 seconds with a maximum of 20 messages per second burst limit. Duplicate messages within 5 seconds are dropped, and any client exceeding limits is temporarily penalized for 60 seconds and disconnected" [^375^].

```javascript
const wsRateLimits = {
  messagesPerWindow: 40,
  windowSeconds: 10,
  burstPerSecond: 20,
  duplicateTTLSeconds: 5,
  penaltySeconds: 60
};
```

---

## 11. Spectator & Dead Player Chat

### 11.1 Dead Player Chat Model

Dead players transition to spectator chat immediately upon elimination:

```javascript
// On player elimination
async function handlePlayerElimination(matchId, playerId, eliminationReason) {
  // 1. Remove from living player channels
  await leaveChannel(matchId, 'public', playerId);
  await leaveChannel(matchId, 'werewolf', playerId); // If applicable
  
  // 2. Add to spectator/dead channel
  await joinChannel(matchId, 'spectator', playerId);
  
  // 3. Broadcast elimination announcement to living players
  await broadcastToChannel(matchId, 'public', {
    messageType: 'System',
    content: {
      eventType: 'death_announcement',
      body: `${playerName} was eliminated during the night.`,
      roleReveal: false // Optional: reveal role or keep secret
    }
  });
  
  // 4. Send welcome to spectator chat
  await sendToPlayer(matchId, 'spectator', playerId, {
    messageType: 'System',
    content: {
      body: `Welcome to the afterlife. You can chat with other eliminated players here.`,
      rules: [
        "No ghosting (telling living players info)",
        "Keep it respectful",
        "Have fun watching the game unfold!"
      ]
    }
  });
}
```

### 11.2 Spectator Chat Rules

| Rule | Enforcement | Penalty |
|------|-------------|---------|
| **No Ghosting** | Dead players cannot send messages to living players | Auto-block + warn |
| **No Information Leakage** | Dead players cannot reveal their role or game secrets | Auto-block + 10min mute |
| **Spectators are Read-Only** | External spectators can only watch, not chat | Server-enforced |
| **Respectful Behavior** | Standard toxicity moderation applies | Standard penalty |

### 11.3 Information Isolation

Critical: Dead players must never be able to communicate with living players. Implementation:

```javascript
// Strict channel isolation
const channelIsolation = {
  // Living players: public + werewolf (if applicable) only
  living: ['public', 'werewolf'],
  
  // Dead players: spectator only
  dead: ['spectator'],
  
  // Spectators: spectator (read-only) only
  spectators: ['spectator'],
  
  // System messages go to all
  system: ['public', 'werewolf', 'spectator']
};

// Validate: no channel overlap between living and dead
function validateMessageRoute(sender, channel) {
  if (!sender.isAlive && channel !== 'spectator') {
    return { allowed: false, reason: 'Dead players can only use spectator chat' };
  }
  if (sender.isAlive && channel === 'spectator') {
    return { allowed: false, reason: 'Living players cannot access spectator chat' };
  }
  return { allowed: true };
}
```

### 11.4 Ghost Mode (Optional Feature)

Inspired by Werewolves game implementation [^418^]:

```javascript
const ghostModeConfig = {
  enabled: true,
  // Dead players get limited influence
  ghostPowers: {
    // Can send ONE anonymous hint per round
    anonymousHint: {
      allowed: true,
      frequency: 'once_per_round',
      delivery: 'randomly_inserted_into_public_chat' // As a "mysterious voice"
    },
    // Can vote in tie-breaker (weaker weight)
    tieBreakerVote: {
      allowed: true,
      weight: 0.5 // Half weight of living player vote
    }
  }
};
```

---

## 12. API Specifications

### 12.1 REST API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/chat/history/{matchId}` | GET | JWT | Get chat history for a match |
| `/api/chat/history/{matchId}/{channel}` | GET | JWT | Get channel-specific history |
| `/api/chat/messages/{messageId}` | GET | JWT | Get a specific message |
| `/api/chat/messages/{messageId}/report` | POST | JWT | Report a message |
| `/api/chat/matches/{matchId}/mute` | POST | Admin | Mute a player in a match |
| `/api/chat/matches/{matchId}/unmute` | POST | Admin | Unmute a player |
| `/api/chat/replay/{matchId}` | GET | JWT | Get replay data |
| `/api/moderation/status` | GET | Admin | Get moderation queue status |
| `/api/moderation/reports` | GET | Admin | List reported messages |
| `/api/moderation/reports/{reportId}/resolve` | POST | Admin | Resolve a report |

### 12.2 WebSocket Event Specifications (Detailed)

**Client → Server: `chat:send`**
```json
{
  "channel": "public",
  "messageType": "FreeText",
  "content": {
    "text": "I think Player3 is suspicious..."
  },
  "clientTimestamp": "2026-01-15T10:30:00.000Z"
}
```

**Server → Client: `chat:message`**
```json
{
  "id": "msg_uuid",
  "timestamp": "2026-01-15T10:30:01.123Z",
  "matchId": "match_uuid",
  "channel": "public",
  "senderId": "player1_uuid",
  "senderName": "Player1",
  "senderRole": "villager",
  "messageType": "FreeText",
  "content": {
    "text": "I think Player3 is suspicious...",
    "format": "plain"
  },
  "metadata": {
    "gamePhase": "day",
    "roundNumber": 2,
    "serverLatencyMs": 12
  }
}
```

**Client → Server: `chat:typing:start`**
```json
{
  "channel": "public"
}
```

**Server → Client: `chat:typing`**
```json
{
  "userId": "player1_uuid",
  "userName": "Player1",
  "channel": "public",
  "isTyping": true
}
```

### 12.3 Response Codes

| Code | Meaning | Usage |
|------|---------|-------|
| `CHAT_OK` | Message delivered | Successful send |
| `CHAT_RATE_LIMITED` | Too many messages | Rate limit exceeded |
| `CHAT_UNAUTHORIZED` | Cannot access channel | Role/phase restriction |
| `CHAT_MUTED` | Player is muted | Active mute period |
| `CHAT_MODERATED` | Message blocked | Toxicity/profanity detected |
| `CHAT_INVALID_TYPE` | Message type not allowed | Wrong phase or channel |
| `CHAT_CHANNEL_FULL` | Channel at capacity | Spectator limit reached |

---

## 13. Implementation Recommendations

### 13.1 Technology Stack

| Component | Recommendation | Rationale |
|-----------|---------------|-----------|
| **WebSocket Framework** | Socket.IO | Rooms, namespaces, auto-reconnect, Redis adapter [^192^] |
| **Message Broker** | Redis Pub/Sub | <1ms delivery, proven at scale [^364^] |
| **Presence Store** | Redis Hash + TTL | Built-in expiry, fast lookups [^351^] |
| **History Store** | Redis (hot) + PostgreSQL (warm) | Speed + durability |
| **Moderation** | Custom Tier 0-2 + GPT-4o (Tier 3) | Balance of speed, cost, accuracy [^345^] |
| **Rate Limiting** | Redis Sliding Window | Precise, scalable [^405^] |
| **AI Generation** | GPT-4o / GPT-4o-mini | Cost-optimized with model routing |

### 13.2 Scaling Strategy

1. **Single Server**: Socket.IO rooms handle up to 20K connections
2. **Multi-Server**: Redis Pub/Sub adapter for cross-server messaging
3. **Horizontal Scaling**: Each game server handles N matches independently
4. **Redis Cluster**: For presence and history at 100K+ concurrent players

### 13.3 Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Message delivery latency | <50ms | End-to-end (client to client) |
| Typing indicator latency | <30ms | Visual feedback |
| History retrieval | <100ms | Last 50 messages |
| Moderation (Tier 0-1) | <50ms | Per-message |
| AI generation | <2s | For complex dialogue |
| Concurrent connections | 50K+ per server | With raw `ws` |

### 13.4 Security Checklist

- [ ] **Server-side role validation** on every message — never trust client claims [^428^]
- [ ] **Channel isolation** — living players cannot access dead chat, non-werewolves cannot access werewolf chat
- [ ] **Message type validation** — reject messages not allowed in current game phase
- [ ] **Rate limiting** on all client events to prevent spam/DoS
- [ ] **Content moderation** before message delivery
- [ ] **JWT authentication** on WebSocket connection with periodic refresh
- [ ] **Input sanitization** — prevent XSS injection in message content
- [ ] **No role information leakage** — channel existence is hidden from unauthorized players

### 13.5 Werewolf-Specific Considerations

1. **Phase-Dependent Channels**: Werewolf chat is only active during Night phase; public chat during Day. The server must enforce these transitions.

2. **Werewolf Coordination**: Werewolves need private chat for night kill coordination. This channel must be completely invisible to non-werewolves — no evidence of its existence [^428^].

3. **Accusation Mechanics**: Accusations are a core gameplay element. Moderation must distinguish between strategic accusations ("I think you're the wolf!") and genuine toxicity.

4. **Role Claims**: Players may claim roles truthfully or deceptively. The system must not interfere with gameplay-appropriate deception.

5. **Dead Player Information**: Eliminated players know the truth but must be prevented from sharing it with living players. Strict channel isolation is critical [^357^].

6. **AI Player Chat**: AI-generated messages must be indistinguishable from human messages in format and timing. The `isAIGenerated` flag is for logging only, not sent to clients.

---

## 14. Source Citations

[^192^]: Saurav MH Blog - "Building a multiplayer game using WebSockets - Part 1" (2020). https://blog.sauravmh.com/posts/building-a-multiplayer-game-using-websockets-part-1 — Socket.IO rooms and namespaces for multiplayer game organization.

[^249^]: ETASR - "An LLM-Based Behavior Agent with Natural Language Personality Control" (2025). https://etasr.com/index.php/ETASR/article/download/12631/5504 — OCEAN personality model for LLM NPC dialogue generation with Big Five traits.

[^345^]: arXiv - "Efficient Toxicity Detection in Gaming Chats" (2024). https://arxiv.org/html/2510.17924v1 — Cascaded moderation pipeline with Tier 0-3 architecture, benchmarking of SGD-SVM, DistilBERT, GPT-4, and RAG approaches.

[^346^]: CEUR-WS - "Linguistic and Behavioral Variation in LLM Agents" (2025). https://ceur-ws.org/Vol-4178/paper1.pdf — Personality-conditioned LLM agents and context-sensitive tone adaptation.

[^349^]: Dev.to - "Real-Time Typing Indicators and Presence Tracking with KickJS and Socket.IO" (2026). https://dev.to/forinda/real-time-typing-indicators-and-presence-tracking-with-kickjs-and-socketio-3jh1 — Complete implementation of typing indicators with debounce patterns and presence tracking.

[^351^]: OneUptime - "How to Implement Presence Detection with Redis" (2026). https://oneuptime.com/blog/post/2026-01-21-redis-presence-detection/view — Redis-backed presence with heartbeat and multi-device support.

[^357^]: Forlix.org - "DeadChat SourceMod Plugin" (2012). http://forlix.org/gameaddons/deadchat.shtml — Implementation of dead player chat relay for CS:S/TF2.

[^364^]: OneUptime - "How to Build a Game Chat System with Redis Pub/Sub" (2026). https://oneuptime.com/blog/post/2026-03-31-redis-how-to-build-a-game-chat-system-with-redis-pubsub/view — Complete Redis Pub/Sub chat architecture with code examples for global, match, team, and private channels.

[^365^]: Medium - "A Practical Guide to Real-Time Chat with WebSockets" (2025). https://medium.com/@vaibhav11t/a-practical-guide-to-real-time-chat-with-websockets-82a5ddf40984 — Production considerations for WebSocket chat including rate limiting.

[^366^]: Medium - "Building a Scalable Real-Time Chat Application with Spring Boot, WebSocket, and Redis" (2025). https://medium.com/@rukshan1122/building-a-scalable-real-time-chat-application-a-deep-dive-into-spring-boot-websocket-and-redis-8f16f9f7fa37 — Multi-instance architecture with Redis pub/sub for horizontal scaling.

[^367^]: AAU Project - "The Effect of Context-aware LLM-based NPC Dialogues on Player Engagement" (2025). https://projekter.aau.dk/projekter/files/536738243/The_Effect_of_Context_aware_LLM_based_NPC_Dialogues_on_Player_Engagement_in_Role_playing_Video_Games.pdf — Context-aware NPC dialogue system with personality configuration.

[^369^]: Praeclarum Tech - "WebSockets at Scale: Real-Time Architectures with NestJS and Redis Pub/Sub" (2025). https://praeclarumtech.com/websockets-at-scale-real-time-architectures-with-nestjs-and-redis-pub-sub/ — NestJS + Redis Pub/Sub for scalable real-time WebSocket applications.

[^373^]: Reddit r/gamedev - "How can I prevent action spam in a websocket environment?" https://www.reddit.com/r/gamedev/comments/4mui1c/how_can_i_prevent_action_spam_in_a_websocket/ — Discussion on rate limiting strategies for WebSocket games.

[^375^]: F5 DevCentral - "Rate limiting WebSocket messages for Agents" (2026). https://community.f5.com/kb/contest-entries/rate-limiting-websocket-messages-for-agents/345738 — WebSocket rate limiting iRule with 40 msg/10s limit and burst control.

[^400^]: ACM KDD - "Unified Game Moderation: Soft-Prompting and LLM-Assisted Label Transfer for Resource-Efficient Toxicity Detection" (2025). https://dl.acm.org/doi/10.1145/3711896.3737271 — Ubisoft's ToxBuster multi-game, multi-language moderation system.

[^405^]: Alibaba Cloud - "Three Strategies of High Concurrency Architecture Design - Rate Limiting and Degradation" (2024). https://www.alibabacloud.com/blog/three-strategies-of-high-concurrency-architecture-design---part-2-rate-limiting-and-degradation_601162 — Comparison of fixed window, sliding window, token bucket, and leaky bucket algorithms.

[^408^]: BoardGameGeek StackExchange - "Mafia - Werewolf: Online play" (2018). https://boardgames.stackexchange.com/questions/43153/mafia-werewolf-online-play — Practical methods for online Werewolf play including night phase handling.

[^415^]: Quora - "Are there any good ways to play the party game mafia online?" https://www.quora.com/Are-there-any-good-ways-to-play-the-party-game-mafia-online — Comprehensive overview of online Mafia/Werewolf platforms and implementation approaches.

[^417^]: GitHub Socket.IO - "Authorize/filter event data on a per-socket basis before sending" (2023). https://github.com/socketio/socket.io/issues/4709 — Feature request for per-socket event filtering, demonstrating authorization patterns.

[^418^]: GitHub - "davidchilin/werewolves_game" (2025). https://github.com/davidchilin/werewolves_game — Self-hosted Werewolf webgame with Ghost Mode, 24 roles, pass-and-play, and WebSocket real-time chat.

[^421^]: OneUptime - "How to Build Chat Applications with WebSockets" (2026). https://oneuptime.com/blog/post/2026-01-26-websocket-chat-application/view — Complete WebSocket chat implementation with private messages, typing indicators, and rooms.

[^428^]: StackOverflow - "socket.io room authorisation" (2015). https://stackoverflow.com/questions/28990666/socket-io-room-authorisation — Room authorization patterns in Socket.IO with per-room authentication.

[^342^]: CometChat - "A guide to effective gaming content moderation" (2026). https://www.cometchat.com/blog/gaming-content-moderation — Best practices for gaming chat moderation including automated filtering and age-appropriate filters.

[^343^]: Greip.io - "A Guide to Integrating Profanity Filters in Online Gaming" (2025). https://greip.io/blog/From-Toxic-to-Terrific-A-Guide-to-Integrating-Profanity-Filters-in-Online-Gaming-247 — Profanity filter types (keyword vs AI-powered) and implementation guide.

[^344^]: Medium - "Real-Time Toxicity Detection in Games" (2025). https://seanfalconer.medium.com/real-time-toxicity-detection-in-games-balancing-moderation-and-player-experience-4ef81b8f47db — Kafka + Flink + Databricks architecture for real-time toxicity detection.

[^389^]: GameDeveloper.com - "From Mafia to Among Us: Can social deduction evolve as online multiplayer?" (2021). https://www.gamedeveloper.com/design/from-mafia-to-among-us-can-social-deduction-evolve-as-online-multiplayer- — Night/day phase communication patterns in social deduction games.

[^406^]: SUNY Buffalo - "Toxic In-Game Voice Chat Moderation using Multimodal LLMs" (2025). https://cse.buffalo.edu/tech-reports/2025-16.pdf — GPT-4o with CoT + Few-Shot for voice chat moderation achieving F1=0.75.

[^407^]: Modulate.ai - "ToxMod is now fighting toxicity in 18 languages" (2023). https://www.modulate.ai/blog/toxmod-multilingual — Multilingual voice chat moderation across 18 languages.

[^416^]: Ably Blog - "How to add an in-game chat room with React" (2023). https://ably.com/blog/how-to-add-an-in-game-chat-room-with-react — Channel history with rewind capability for chat replay.

[^409^]: Redis.io - "Rate Limiting Algorithms" (2025). https://redis.io/glossary/rate-limiting/ — Official Redis documentation on rate limiting algorithms.

[^24^]: ProjectDiscovery - "How We Cut LLM Costs by 59% With Prompt Caching" (2026). https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching — Prompt caching strategies for LLM cost optimization.

[^25^]: MorphLLM - "LLM Cost Optimization: 5 Levers to Cut API Spend 70-85%" (2026). https://www.morphllm.com/llm-cost-optimization — Comprehensive cost optimization strategies including model routing and context compaction.

---

*Document compiled from 20+ independent research sources across WebSocket architecture, game chat systems, NLP personality generation, content moderation, and social deduction game design patterns.*
