import type { GameState, GameSettings, GameScreen, Phase, Player, Role, Faction, GameLog, ChatMessage, ExecutionResult } from '../src/types/game';
import { assignRoles, getFaction, tallyVotes, checkWinCondition, generateAvatar, getAiNames } from '../src/engine/gameEngine';

let logIdCounter = 0;
function makeLog(round: number, message: string, type: GameLog['type']): GameLog {
  return { id: `log-${++logIdCounter}`, round, message, type };
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

interface RoomPlayer {
  socketId: string;
  id: string;
  name: string;
  role: Role;
  faction: Faction;
  isAlive: boolean;
  avatar: string;
  isHost: boolean;
  nightAction: string | null;
  vote: string | null;
  ready: boolean;
}

export class GameRoom {
  code: string;
  hostId: string;
  players: RoomPlayer[] = [];
  phase: Phase = 'lobby';
  screen: GameScreen = 'lobby';
  round: number = 0;
  settings: GameSettings = {
    playerName: '',
    playerCount: 8,
    aiDifficulty: 'medium',
    hasSeer: true,
  };
  logs: GameLog[] = [];
  chatMessages: ChatMessage[] = [];
  lastKilled: Player | null = null;
  winner: Faction | null = null;
  executionResult: ExecutionResult | null = null;
  seerCheckResult: { playerId: string; faction: Faction } | null = null;
  playerSeerResults: Map<string, { playerId: string; faction: Faction }> = new Map();
  nightWerewolfTarget: string | null = null;
  private nightTimer: NodeJS.Timeout | null = null;
  private voteTimer: NodeJS.Timeout | null = null;

  constructor(hostSocketId: string, hostName: string) {
    this.code = generateRoomCode();
    this.hostId = hostSocketId;
    this.addPlayer(hostSocketId, hostName);
    this.players[0].isHost = true;
  }

  addPlayer(socketId: string, name: string): { playerId: string; isHost: boolean } {
    const id = `p-${this.players.length}`;
    this.players.push({
      socketId,
      id,
      name: name || `Player ${this.players.length + 1}`,
      role: 'villager',
      faction: 'village',
      isAlive: true,
      avatar: generateAvatar(this.players.length),
      isHost: false,
      nightAction: null,
      vote: null,
      ready: false,
    });
    return { playerId: id, isHost: socketId === this.hostId };
  }

  removePlayer(socketId: string): boolean {
    const idx = this.players.findIndex(p => p.socketId === socketId);
    if (idx === -1) return false;
    this.players.splice(idx, 1);
    // Reassign IDs to keep them sequential
    this.players.forEach((p, i) => { p.id = `p-${i}`; });
    // If host left, assign new host
    if (socketId === this.hostId && this.players.length > 0) {
      this.hostId = this.players[0].socketId;
      this.players[0].isHost = true;
    }
    return true;
  }

  getPlayerCount() { return this.players.length; }

  startGame(settings?: Partial<GameSettings>) {
    if (settings) {
      this.settings = { ...this.settings, ...settings };
    }
    const count = this.players.length;
    const werewolfCount = Math.max(1, Math.floor(count * 0.25));
    const roles = assignRoles(count, werewolfCount, this.settings.hasSeer);

    this.players.forEach((p, i) => {
      p.role = roles[i];
      p.faction = getFaction(p.role);
      p.isAlive = true;
      p.nightAction = null;
      p.vote = null;
      p.ready = false;
    });

    this.phase = 'role-reveal';
    this.screen = 'role-reveal';
    this.round = 1;
    this.logs = [makeLog(1, `Game started with ${count} players.`, 'system')];
    this.chatMessages = [];
    this.lastKilled = null;
    this.winner = null;
    this.executionResult = null;
    this.seerCheckResult = null;
    this.playerSeerResults.clear();
    this.nightWerewolfTarget = null;
  }

  setPlayerReady(playerId: string) {
    const p = this.players.find(pl => pl.id === playerId);
    if (p) p.ready = true;
  }

  allReady() {
    return this.players.every(p => !p.isAlive || p.ready);
  }

  resetReady() {
    this.players.forEach(p => p.ready = false);
  }

  submitNightAction(playerId: string, targetId: string): boolean {
    const player = this.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) return false;

    player.nightAction = targetId;

    // Werewolves: collect and pick majority target
    if (player.role === 'werewolf') {
      const wolves = this.players.filter(p => p.isAlive && p.role === 'werewolf');
      const submitted = wolves.filter(p => p.nightAction !== null);
      if (submitted.length === wolves.length) {
        // All wolves submitted - pick majority
        const counts: Record<string, number> = {};
        submitted.forEach(w => {
          counts[w.nightAction!] = (counts[w.nightAction!] || 0) + 1;
        });
        let max = 0;
        let targets: string[] = [];
        Object.entries(counts).forEach(([tid, c]) => {
          if (c > max) { max = c; targets = [tid]; }
          else if (c === max) targets.push(tid);
        });
        this.nightWerewolfTarget = targets[Math.floor(Math.random() * targets.length)];
        return true; // all in
      }
    }

    // Seer: just store
    if (player.role === 'seer') {
      return true; // seer action is immediate
    }

    // Villager: auto
    if (player.role === 'villager') {
      return true;
    }

    return false;
  }

  allNightActionsIn(): boolean {
    const alive = this.players.filter(p => p.isAlive);
    const wolves = alive.filter(p => p.role === 'werewolf');
    const seers = alive.filter(p => p.role === 'seer');
    const villagers = alive.filter(p => p.role === 'villager');

    // Wolves need at least one submission (or we auto-pick after timeout)
    const wolvesReady = wolves.length === 0 || wolves.some(w => w.nightAction !== null);
    // Seers need submission
    const seersReady = seers.every(s => s.nightAction !== null);
    // Villagers auto-ready
    const villagersReady = true;

    return wolvesReady && seersReady && villagersReady;
  }

  processNight() {
    const newLogs = [...this.logs];
    let killed: RoomPlayer | null = null;

    // Werewolf kill
    const wolves = this.players.filter(p => p.isAlive && p.role === 'werewolf');
    if (wolves.length > 0) {
      if (!this.nightWerewolfTarget) {
        // Pick random target from wolves who submitted, or random villager
        const submittedWolves = wolves.filter(w => w.nightAction !== null);
        if (submittedWolves.length > 0) {
          const w = submittedWolves[Math.floor(Math.random() * submittedWolves.length)];
          this.nightWerewolfTarget = w.nightAction!;
        } else {
          // No wolves submitted - pick random alive non-wolf
          const targets = this.players.filter(p => p.isAlive && p.faction !== 'werewolf');
          if (targets.length > 0) this.nightWerewolfTarget = targets[Math.floor(Math.random() * targets.length)].id;
        }
      }
      if (this.nightWerewolfTarget) {
        const target = this.players.find(p => p.id === this.nightWerewolfTarget);
        if (target && target.isAlive) {
          target.isAlive = false;
          killed = target;
          newLogs.push(makeLog(this.round, `${target.name} was found dead this morning.`, 'death'));
        }
      }
    }

    if (!killed) {
      newLogs.push(makeLog(this.round, 'The night was peaceful. No one died.', 'system'));
    }

    // Process seer checks (server-side knowledge only)
    this.playerSeerResults.clear();
    const seers = this.players.filter(p => p.isAlive && p.role === 'seer');
    for (const seer of seers) {
      if (seer.nightAction) {
        const target = this.players.find(p => p.id === seer.nightAction);
        if (target) {
          this.playerSeerResults.set(seer.id, { playerId: target.id, faction: target.faction });
        }
      }
    }

    this.lastKilled = killed ? this.toPublicPlayer(killed) : null;
    this.logs = newLogs;
    this.winner = checkWinCondition(this.players.map(p => this.toPublicPlayer(p)));

    // Reset night actions
    this.players.forEach(p => p.nightAction = null);
    this.nightWerewolfTarget = null;
    this.resetReady();

    if (this.winner) {
      this.phase = 'game-over';
      this.screen = 'game-over';
    } else {
      this.phase = 'dawn';
      this.screen = 'dawn';
    }
  }

  submitVote(playerId: string, targetId: string) {
    const player = this.players.find(p => p.id === playerId);
    if (player && player.isAlive) {
      player.vote = targetId;
    }
  }

  allVotesIn(): boolean {
    return this.players.filter(p => p.isAlive).every(p => p.vote !== null);
  }

  processVotes() {
    const votes: Record<string, string> = {};
    this.players.forEach(p => { if (p.vote) votes[p.id] = p.vote; });

    const { eliminated, voteCounts } = tallyVotes(votes, this.players.map(p => this.toPublicPlayer(p)));
    const newLogs = [...this.logs];

    let newPlayers = [...this.players];
    let winner: Faction | null = null;

    if (eliminated) {
      const idx = newPlayers.findIndex(p => p.id === eliminated.id);
      if (idx !== -1) {
        newPlayers[idx] = { ...newPlayers[idx], isAlive: false };
        newLogs.push(makeLog(this.round, `${eliminated.name} was eliminated. They were a ${eliminated.role.toUpperCase()}!`, 'death'));
      }
    } else {
      newLogs.push(makeLog(this.round, 'The vote was tied. No one was eliminated.', 'system'));
    }

    this.players = newPlayers;
    this.logs = newLogs;
    winner = checkWinCondition(this.players.map(p => this.toPublicPlayer(p)));

    const wasTie = !eliminated && Object.keys(votes).length > 0;
    const noVotes = Object.keys(votes).length === 0;

    this.executionResult = {
      eliminated: eliminated ? { ...this.toPublicPlayer(eliminated), isAlive: true } : null,
      voteCounts,
      wasTie,
      noVotes,
    };

    // Reset votes
    this.players.forEach(p => p.vote = null);
    this.resetReady();

    if (winner) {
      this.phase = 'game-over';
      this.screen = 'game-over';
      this.winner = winner;
    } else {
      this.phase = 'execution';
      this.screen = 'execution';
    }
  }

  addChat(playerId: string, playerName: string, message: string) {
    this.chatMessages.push({
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: playerId,
      senderName: playerName,
      message: message.trim(),
      round: this.round,
    });
  }

  nextRound() {
    this.round += 1;
    this.executionResult = null;
    this.seerCheckResult = null;
    this.playerSeerResults.clear();
    this.lastKilled = null;
    this.resetReady();
    this.phase = 'night';
    this.screen = 'night';
    this.logs.push(makeLog(this.round, `Night ${this.round} falls... The village sleeps.`, 'system'));
  }

  startDay() {
    this.phase = 'day';
    this.screen = 'day';
    this.logs.push(makeLog(this.round, `Day ${this.round} begins. Discuss and find the werewolves!`, 'system'));
  }

  toPublicPlayer(p: RoomPlayer): Player {
    return {
      id: p.id,
      name: p.name,
      role: p.role,
      faction: p.faction,
      isAlive: p.isAlive,
      isHuman: false,
      avatar: p.avatar,
    };
  }

  getStateForPlayer(playerId: string): GameState {
    const me = this.players.find(p => p.id === playerId);
    const myRole = me?.role || 'villager';
    const isWerewolf = myRole === 'werewolf';

    const players: Player[] = this.players.map(p => {
      const isSelf = p.id === playerId;
      const isDead = !p.isAlive;
      const isWerewolfTeammate = isWerewolf && p.role === 'werewolf';
      const revealRole = isSelf || isDead || isWerewolfTeammate;

      return {
        id: p.id,
        name: p.name,
        role: revealRole ? p.role : 'unknown' as Role,
        faction: revealRole ? p.faction : 'unknown' as Faction,
        isAlive: p.isAlive,
        isHuman: isSelf,
        avatar: p.avatar,
      };
    });

    // Seer result: only show if this player is the seer and they checked someone this night
    let seerResult = me?.role === 'seer' ? (this.playerSeerResults.get(playerId) || null) : null;

    const aliveWerewolves = this.players.filter(p => p.isAlive && p.faction === 'werewolf').length;
    const aliveVillagers = this.players.filter(p => p.isAlive && p.faction === 'village').length;

    return {
      screen: this.screen,
      phase: this.phase,
      round: this.round,
      players,
      humanPlayerId: playerId,
      nightActionTarget: me?.nightAction || null,
      seerCheckResult: seerResult,
      votes: {}, // votes are secret until processed
      lastKilled: this.lastKilled,
      winner: this.winner,
      logs: this.logs,
      settings: this.settings,
      isProcessingAI: false,
      executionResult: this.executionResult,
      chatMessages: this.chatMessages,
      // multiplayer extras
      mode: 'online' as const,
      roomCode: this.code,
      isHost: me?.isHost || false,
      aliveWerewolfCount: aliveWerewolves,
      aliveVillagerCount: aliveVillagers,
    };
  }

  getLobbyState(): GameState {
    const players: Player[] = this.players.map(p => ({
      id: p.id,
      name: p.name,
      role: 'unknown' as Role,
      faction: 'unknown' as Faction,
      isAlive: true,
      isHuman: false,
      avatar: p.avatar,
    }));

    return {
      screen: 'room' as GameScreen,
      phase: 'lobby' as Phase,
      round: 0,
      players,
      humanPlayerId: '',
      nightActionTarget: null,
      seerCheckResult: null,
      votes: {},
      lastKilled: null,
      winner: null,
      logs: [],
      settings: this.settings,
      isProcessingAI: false,
      executionResult: null,
      chatMessages: [],
      mode: 'online' as const,
      roomCode: this.code,
      isHost: false,
      aliveWerewolfCount: 0,
      aliveVillagerCount: 0,
    };
  }
}

export { generateRoomCode };
