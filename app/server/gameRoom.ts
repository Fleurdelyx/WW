import type { GameState, GameSettings, GameScreen, Phase, Player, Role, Faction, GameLog, ChatMessage, ExecutionResult } from '../src/types/game';
import { assignRoles, getFaction, getTrueFaction, tallyVotes, checkWinCondition, generateAvatar, getAiNames } from '../src/engine/gameEngine';

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
  avatar: { icon: string; bg: string; text: string; border: string };
  isHost: boolean;
  nightAction: string | null;
  bodyguardTarget: string | null;
  witchHealTarget: string | null;
  witchPoisonTarget: string | null;
  sorcererTarget: string | null;
  alphaWolfTarget: string | null;
  vigilanteTarget: string | null;
  doctorTarget: string | null;
  sheriffTarget: string | null;
  mediumTarget: string | null;
  mysticWolfTarget: string | null;
  vote: string | null;
  ready: boolean;
  skipVoted: boolean;
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
    hasBodyguard: true,
    hasHunter: true,
    hasWitch: true,
    hasAlphaWolf: true,
    hasSorcerer: true,
    hasMinion: true,
    hasMedium: true,
    hasMayor: true,
    hasVigilante: true,
    hasDoctor: true,
    hasSheriff: true,
    hasGravedigger: true,
    hasMysticWolf: true,
    hasWolfCub: true,
    hasLycan: true,
    hasPrince: true,
    nightTimerSeconds: 60,
    discussionTimerSeconds: 120,
  };
  logs: GameLog[] = [];
  chatMessages: ChatMessage[] = [];
  deadChatMessages: ChatMessage[] = [];
  whispers: ChatMessage[] = [];
  lastKilled: Player | null = null;
  winner: Faction | null = null;
  executionResult: ExecutionResult | null = null;
  seerCheckResult: { playerId: string; faction: Faction } | null = null;
  sorcererCheckResult: { playerId: string; isSeer: boolean } | null = null;
  playerSeerResults: Map<string, { playerId: string; faction: Faction }> = new Map();
  playerSorcererResults: Map<string, { playerId: string; isSeer: boolean }> = new Map();
  playerSheriffResults: Map<string, { playerId: string; role: Role }> = new Map();
  playerMediumResults: Map<string, { playerId: string; role: Role }> = new Map();
  playerMysticWolfResults: Map<string, { playerId: string; faction: Faction }> = new Map();
  nightWerewolfTarget: string | null = null;
  witchHealUsed: boolean = false;
  witchPoisonUsed: boolean = false;
  vigilanteUsed: boolean = false;
  princeSurvived: boolean = false;
  gravediggerResult: { playerId: string; role: Role } | null = null;
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
      name: name?.trim() || `Player ${this.players.length + 1}`,
      role: 'villager',
      faction: 'village',
      isAlive: true,
      avatar: generateAvatar(this.players.length),
      isHost: false,
      nightAction: null,
      bodyguardTarget: null,
      witchHealTarget: null,
      witchPoisonTarget: null,
      sorcererTarget: null,
      alphaWolfTarget: null,
      vigilanteTarget: null,
      doctorTarget: null,
      sheriffTarget: null,
      mediumTarget: null,
      mysticWolfTarget: null,
      vote: null,
      ready: false,
      skipVoted: false,
    });
    return { playerId: id, isHost: socketId === this.hostId };
  }

  removePlayer(socketId: string): boolean {
    const idx = this.players.findIndex(p => p.socketId === socketId);
    if (idx === -1) return false;
    this.players.splice(idx, 1);
    this.players.forEach((p, i) => { p.id = `p-${i}`; });
    if (socketId === this.hostId && this.players.length > 0) {
      this.hostId = this.players[0].socketId;
      this.players[0].isHost = true;
    }
    return true;
  }

  getPlayerCount() { return this.players.length; }

  renamePlayer(playerId: string, newName: string): boolean {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return false;
    player.name = newName?.trim() || player.name;
    return true;
  }

  updateSettings(newSettings: Partial<GameSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  startGame(settings?: Partial<GameSettings>) {
    if (settings) {
      this.settings = { ...this.settings, ...settings };
    }
    const count = this.players.length;
    const werewolfCount = Math.max(1, Math.floor(count * 0.25));
    const roles = assignRoles(count, werewolfCount, {
      hasSeer: this.settings.hasSeer,
      hasBodyguard: this.settings.hasBodyguard,
      hasHunter: this.settings.hasHunter,
      hasWitch: this.settings.hasWitch,
      hasAlphaWolf: this.settings.hasAlphaWolf,
      hasSorcerer: this.settings.hasSorcerer,
      hasMinion: this.settings.hasMinion,
      hasMedium: this.settings.hasMedium,
      hasMayor: this.settings.hasMayor,
      hasVigilante: this.settings.hasVigilante,
      hasDoctor: this.settings.hasDoctor,
      hasSheriff: this.settings.hasSheriff,
      hasGravedigger: this.settings.hasGravedigger,
      hasMysticWolf: this.settings.hasMysticWolf,
      hasWolfCub: this.settings.hasWolfCub,
      hasLycan: this.settings.hasLycan,
      hasPrince: this.settings.hasPrince,
    });

    this.players.forEach((p, i) => {
      p.role = roles[i];
      p.faction = getFaction(p.role);
      p.isAlive = true;
      p.nightAction = null;
      p.bodyguardTarget = null;
      p.witchHealTarget = null;
      p.witchPoisonTarget = null;
      p.sorcererTarget = null;
      p.alphaWolfTarget = null;
      p.vigilanteTarget = null;
      p.doctorTarget = null;
      p.sheriffTarget = null;
      p.mediumTarget = null;
      p.mysticWolfTarget = null;
      p.vote = null;
      p.ready = false;
      p.skipVoted = false;
    });

    this.phase = 'role-reveal';
    this.screen = 'role-reveal';
    this.round = 1;
    this.logs = [makeLog(1, `Game started with ${count} players.`, 'system')];
    this.chatMessages = [];
    this.deadChatMessages = [];
    this.whispers = [];
    this.lastKilled = null;
    this.winner = null;
    this.executionResult = null;
    this.seerCheckResult = null;
    this.sorcererCheckResult = null;
    this.playerSeerResults.clear();
    this.playerSorcererResults.clear();
    this.playerSheriffResults.clear();
    this.playerMediumResults.clear();
    this.playerMysticWolfResults.clear();
    this.nightWerewolfTarget = null;
    this.witchHealUsed = false;
    this.witchPoisonUsed = false;
    this.vigilanteUsed = false;
    this.princeSurvived = false;
    this.gravediggerResult = null;
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

  resetSkipVotes() {
    this.players.forEach(p => p.skipVoted = false);
  }

  submitNightAction(playerId: string, targetId: string): boolean {
    const player = this.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) return false;

    player.nightAction = targetId;

    if (player.role === 'werewolf' || player.role === 'alphaWolf' || player.role === 'wolfCub') {
      const wolves = this.players.filter(p => p.isAlive && (p.role === 'werewolf' || p.role === 'alphaWolf' || p.role === 'wolfCub'));
      const submitted = wolves.filter(p => p.nightAction !== null || p.alphaWolfTarget !== null);
      if (submitted.length === wolves.length) {
        // Check alpha wolf override first
        const alpha = wolves.find(w => w.role === 'alphaWolf');
        if (alpha && alpha.alphaWolfTarget) {
          this.nightWerewolfTarget = alpha.alphaWolfTarget;
        } else if (alpha && alpha.nightAction) {
          this.nightWerewolfTarget = alpha.nightAction;
        } else {
          const counts: Record<string, number> = {};
          submitted.forEach(w => {
            const target = w.alphaWolfTarget || w.nightAction;
            if (target) counts[target] = (counts[target] || 0) + 1;
          });
          let max = 0;
          let targets: string[] = [];
          Object.entries(counts).forEach(([tid, c]) => {
            if (c > max) { max = c; targets = [tid]; }
            else if (c === max) targets.push(tid);
          });
          this.nightWerewolfTarget = targets[Math.floor(Math.random() * targets.length)];
        }
        return true;
      }
    }

    if (player.role === 'seer' || player.role === 'sheriff' || player.role === 'medium' || player.role === 'mysticWolf' || player.role === 'villager') {
      return true;
    }

    return false;
  }

  submitBodyguardAction(playerId: string, targetId: string) {
    const player = this.players.find(p => p.id === playerId);
    if (player && player.isAlive && player.role === 'bodyguard') {
      player.bodyguardTarget = targetId;
    }
  }

  submitWitchAction(playerId: string, healTarget: string | null, poisonTarget: string | null) {
    const player = this.players.find(p => p.id === playerId);
    if (player && player.isAlive && player.role === 'witch') {
      player.ready = true;
      if (healTarget && !this.witchHealUsed) {
        player.witchHealTarget = healTarget;
      }
      if (poisonTarget && !this.witchPoisonUsed) {
        player.witchPoisonTarget = poisonTarget;
      }
    }
  }

  submitSorcererAction(playerId: string, targetId: string) {
    const player = this.players.find(p => p.id === playerId);
    if (player && player.isAlive && player.role === 'sorcerer') {
      player.sorcererTarget = targetId;
      const target = this.players.find(p => p.id === targetId);
      if (target) {
        this.playerSorcererResults.set(playerId, { playerId: target.id, isSeer: target.role === 'seer' });
      }
    }
  }

  submitAlphaWolfAction(playerId: string, targetId: string) {
    const player = this.players.find(p => p.id === playerId);
    if (player && player.isAlive && player.role === 'alphaWolf') {
      player.alphaWolfTarget = targetId;
    }
  }

  submitVigilanteAction(playerId: string, targetId: string) {
    const player = this.players.find(p => p.id === playerId);
    if (player && player.isAlive && player.role === 'vigilante' && !this.vigilanteUsed) {
      player.vigilanteTarget = targetId;
    }
  }

  submitDoctorAction(playerId: string, targetId: string) {
    const player = this.players.find(p => p.id === playerId);
    if (player && player.isAlive && player.role === 'doctor') {
      player.doctorTarget = targetId;
    }
  }

  submitSheriffAction(playerId: string, targetId: string) {
    const player = this.players.find(p => p.id === playerId);
    if (player && player.isAlive && player.role === 'sheriff') {
      player.sheriffTarget = targetId;
      const target = this.players.find(p => p.id === targetId);
      if (target) {
        this.playerSheriffResults.set(playerId, { playerId: target.id, role: target.role });
      }
    }
  }

  submitMediumAction(playerId: string, targetId: string) {
    const player = this.players.find(p => p.id === playerId);
    if (player && player.isAlive && player.role === 'medium') {
      player.mediumTarget = targetId;
      const target = this.players.find(p => p.id === targetId);
      if (target) {
        this.playerMediumResults.set(playerId, { playerId: target.id, role: target.role });
      }
    }
  }

  submitMysticWolfAction(playerId: string, targetId: string) {
    const player = this.players.find(p => p.id === playerId);
    if (player && player.isAlive && player.role === 'mysticWolf') {
      player.mysticWolfTarget = targetId;
      const target = this.players.find(p => p.id === targetId);
      if (target) {
        const shownFaction = target.role === 'minion' ? 'village' : target.faction;
        this.playerMysticWolfResults.set(playerId, { playerId: target.id, faction: shownFaction });
      }
    }
  }

  allNightActionsIn(): boolean {
    const alive = this.players.filter(p => p.isAlive);
    const wolves = alive.filter(p => p.role === 'werewolf' || p.role === 'alphaWolf' || p.role === 'wolfCub');
    const seers = alive.filter(p => p.role === 'seer');
    const bodyguards = alive.filter(p => p.role === 'bodyguard');
    const witches = alive.filter(p => p.role === 'witch');
    const sorcerers = alive.filter(p => p.role === 'sorcerer');
    const villagers = alive.filter(p => p.role === 'villager');
    const minions = alive.filter(p => p.role === 'minion');
    const hunters = alive.filter(p => p.role === 'hunter');
    const vigilantes = alive.filter(p => p.role === 'vigilante');
    const doctors = alive.filter(p => p.role === 'doctor');
    const sheriffs = alive.filter(p => p.role === 'sheriff');
    const mediums = alive.filter(p => p.role === 'medium');
    const mysticWolves = alive.filter(p => p.role === 'mysticWolf');
    const mayors = alive.filter(p => p.role === 'mayor');
    const gravediggers = alive.filter(p => p.role === 'gravedigger');
    const lycans = alive.filter(p => p.role === 'lycan');
    const princes = alive.filter(p => p.role === 'prince');

    const wolvesReady = wolves.length === 0 || wolves.every(w => w.nightAction !== null || w.alphaWolfTarget !== null);
    const seersReady = seers.every(s => s.nightAction !== null);
    const bodyguardsReady = bodyguards.every(b => b.bodyguardTarget !== null);
    const witchesReady = witches.every(w => w.ready || (this.witchHealUsed && this.witchPoisonUsed));
    const sorcerersReady = sorcerers.every(s => s.sorcererTarget !== null);
    const villagersReady = true;
    const minionsReady = true;
    const huntersReady = true;
    const vigilantesReady = vigilantes.every(v => v.vigilanteTarget !== null || this.vigilanteUsed);
    const doctorsReady = doctors.every(d => d.doctorTarget !== null);
    const sheriffsReady = sheriffs.every(s => s.sheriffTarget !== null);
    const mediumsReady = mediums.every(m => m.mediumTarget !== null || this.players.filter(p => !p.isAlive).length === 0);
    const mysticWolvesReady = mysticWolves.every(mw => mw.mysticWolfTarget !== null);
    const mayorsReady = true;
    const gravediggersReady = true;
    const lycansReady = true;
    const princesReady = true;

    return wolvesReady && seersReady && bodyguardsReady && witchesReady && sorcerersReady && villagersReady && minionsReady && huntersReady && vigilantesReady && doctorsReady && sheriffsReady && mediumsReady && mysticWolvesReady && mayorsReady && gravediggersReady && lycansReady && princesReady;
  }

  processNight() {
    const newLogs = [...this.logs];
    let killed: RoomPlayer | null = null;
    let witchKilled: RoomPlayer | null = null;
    let vigilanteKilled: RoomPlayer | null = null;

    // Werewolf kill
    const wolves = this.players.filter(p => p.isAlive && (p.role === 'werewolf' || p.role === 'alphaWolf' || p.role === 'wolfCub'));
    if (wolves.length > 0) {
      if (!this.nightWerewolfTarget) {
        const alpha = wolves.find(w => w.role === 'alphaWolf');
        if (alpha && (alpha.alphaWolfTarget || alpha.nightAction)) {
          this.nightWerewolfTarget = alpha.alphaWolfTarget || alpha.nightAction;
        } else {
          const submittedWolves = wolves.filter(w => w.nightAction !== null || w.alphaWolfTarget !== null);
          if (submittedWolves.length > 0) {
            const w = submittedWolves[Math.floor(Math.random() * submittedWolves.length)];
            this.nightWerewolfTarget = w.alphaWolfTarget || w.nightAction!;
          } else {
            const targets = this.players.filter(p => p.isAlive && getTrueFaction(p.role) !== 'werewolf');
            if (targets.length > 0) this.nightWerewolfTarget = targets[Math.floor(Math.random() * targets.length)].id;
          }
        }
      }

      let werewolfKillBlocked = false;
      if (this.nightWerewolfTarget) {
        const bgTarget = this.players.find(p => p.isAlive && p.role === 'bodyguard')?.bodyguardTarget;
        const witchHeal = this.players.find(p => p.isAlive && p.role === 'witch')?.witchHealTarget;
        const docTarget = this.players.find(p => p.isAlive && p.role === 'doctor')?.doctorTarget;

        if (bgTarget === this.nightWerewolfTarget) {
          werewolfKillBlocked = true;
          newLogs.push(makeLog(this.round, 'The Bodyguard protected someone from the Werewolves!', 'action'));
        }
        if (witchHeal === this.nightWerewolfTarget && !this.witchHealUsed) {
          werewolfKillBlocked = true;
          newLogs.push(makeLog(this.round, 'The Witch used her healing potion to save someone!', 'action'));
        }
        if (docTarget === this.nightWerewolfTarget) {
          werewolfKillBlocked = true;
          newLogs.push(makeLog(this.round, 'The Doctor saved someone from death!', 'action'));
        }

        if (!werewolfKillBlocked) {
          const target = this.players.find(p => p.id === this.nightWerewolfTarget);
          if (target && target.isAlive) {
            target.isAlive = false;
            killed = target;
            newLogs.push(makeLog(this.round, `${target.name} was found dead this morning.`, 'death'));
          }
        }
      }

      if (!killed && !werewolfKillBlocked) {
        newLogs.push(makeLog(this.round, 'The night was peaceful. No one died.', 'system'));
      } else if (!killed && werewolfKillBlocked) {
        newLogs.push(makeLog(this.round, 'The night was peaceful thanks to a protector.', 'system'));
      }
    }

    // Witch poison
    const witch = this.players.find(p => p.isAlive && p.role === 'witch');
    if (witch && witch.witchPoisonTarget && !this.witchPoisonUsed) {
      const poisonTarget = this.players.find(p => p.id === witch.witchPoisonTarget);
      if (poisonTarget && poisonTarget.isAlive) {
        const docTarget = this.players.find(p => p.isAlive && p.role === 'doctor')?.doctorTarget;
        if (docTarget === witch.witchPoisonTarget) {
          newLogs.push(makeLog(this.round, 'The Doctor saved someone from the Witch\'s poison!', 'action'));
        } else {
          poisonTarget.isAlive = false;
          witchKilled = poisonTarget;
          newLogs.push(makeLog(this.round, `${poisonTarget.name} was found poisoned this morning.`, 'death'));
        }
      }
    }

    // Vigilante kill
    const vigilante = this.players.find(p => p.isAlive && p.role === 'vigilante');
    if (vigilante && vigilante.vigilanteTarget && !this.vigilanteUsed) {
      const vigTarget = this.players.find(p => p.id === vigilante.vigilanteTarget);
      if (vigTarget && vigTarget.isAlive) {
        const docTarget = this.players.find(p => p.isAlive && p.role === 'doctor')?.doctorTarget;
        if (docTarget === vigilante.vigilanteTarget) {
          newLogs.push(makeLog(this.round, 'The Doctor saved someone from the Vigilante!', 'action'));
        } else {
          vigTarget.isAlive = false;
          vigilanteKilled = vigTarget;
          newLogs.push(makeLog(this.round, `${vigTarget.name} was found shot by a Vigilante this morning.`, 'death'));
        }
      }
      this.vigilanteUsed = true;
    }

    // Hunter night revenge
    const anyNightKilled = killed || witchKilled || vigilanteKilled;
    if (killed && killed.role === 'hunter') {
      const hunterRevengeTargets = this.players.filter(p => p.isAlive && p.id !== killed.id);
      if (hunterRevengeTargets.length > 0) {
        const revengeTarget = hunterRevengeTargets[Math.floor(Math.random() * hunterRevengeTargets.length)];
        const revengeIdx = this.players.findIndex(p => p.id === revengeTarget.id);
        if (revengeIdx !== -1) {
          this.players[revengeIdx].isAlive = false;
          newLogs.push(makeLog(this.round, `${killed.name} fired their rifle in their dying breath! ${revengeTarget.name} was killed!`, 'death'));
        }
      }
    }

    // Process seer checks
    this.playerSeerResults.clear();
    const seers = this.players.filter(p => p.isAlive && p.role === 'seer');
    for (const seer of seers) {
      if (seer.nightAction) {
        const target = this.players.find(p => p.id === seer.nightAction);
        if (target) {
          const shownFaction = target.role === 'minion' ? 'village' : target.faction;
          this.playerSeerResults.set(seer.id, { playerId: target.id, faction: shownFaction });
        }
      }
    }

    // Process sorcerer checks
    this.playerSorcererResults.clear();
    const sorcerers = this.players.filter(p => p.isAlive && p.role === 'sorcerer');
    for (const sorcerer of sorcerers) {
      if (sorcerer.sorcererTarget) {
        const target = this.players.find(p => p.id === sorcerer.sorcererTarget);
        if (target) {
          this.playerSorcererResults.set(sorcerer.id, { playerId: target.id, isSeer: target.role === 'seer' });
        }
      }
    }

    // Process sheriff checks
    this.playerSheriffResults.clear();
    const sheriffs = this.players.filter(p => p.isAlive && p.role === 'sheriff');
    for (const sheriff of sheriffs) {
      if (sheriff.sheriffTarget) {
        const target = this.players.find(p => p.id === sheriff.sheriffTarget);
        if (target) {
          this.playerSheriffResults.set(sheriff.id, { playerId: target.id, role: target.role });
        }
      }
    }

    // Process medium checks
    this.playerMediumResults.clear();
    const mediums = this.players.filter(p => p.isAlive && p.role === 'medium');
    for (const medium of mediums) {
      if (medium.mediumTarget) {
        const target = this.players.find(p => p.id === medium.mediumTarget);
        if (target) {
          this.playerMediumResults.set(medium.id, { playerId: target.id, role: target.role });
        }
      }
    }

    // Process mystic wolf checks
    this.playerMysticWolfResults.clear();
    const mysticWolves = this.players.filter(p => p.isAlive && p.role === 'mysticWolf');
    for (const mw of mysticWolves) {
      if (mw.mysticWolfTarget) {
        const target = this.players.find(p => p.id === mw.mysticWolfTarget);
        if (target) {
          const shownFaction = target.role === 'minion' ? 'village' : target.faction;
          this.playerMysticWolfResults.set(mw.id, { playerId: target.id, faction: shownFaction });
        }
      }
    }

    // Gravedigger auto-reveal
    if (killed) {
      this.gravediggerResult = { playerId: killed.id, role: killed.role };
    } else if (witchKilled) {
      this.gravediggerResult = { playerId: witchKilled.id, role: witchKilled.role };
    } else if (vigilanteKilled) {
      this.gravediggerResult = { playerId: vigilanteKilled.id, role: vigilanteKilled.role };
    }

    // Track witch potions
    if (witch?.witchHealTarget) this.witchHealUsed = true;
    if (witch?.witchPoisonTarget) this.witchPoisonUsed = true;

    this.lastKilled = killed ? this.toPublicPlayer(killed) : null;
    this.logs = newLogs;
    this.winner = checkWinCondition(this.players.map(p => this.toPublicPlayer(p)));

    // Reset night actions
    this.players.forEach(p => {
      p.nightAction = null;
      p.bodyguardTarget = null;
      p.witchHealTarget = null;
      p.witchPoisonTarget = null;
      p.sorcererTarget = null;
      p.alphaWolfTarget = null;
      p.vigilanteTarget = null;
      p.doctorTarget = null;
      p.sheriffTarget = null;
      p.mediumTarget = null;
      p.mysticWolfTarget = null;
    });
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

    const mayor = this.players.find(p => p.isAlive && p.role === 'mayor');
    const mayorId = mayor ? mayor.id : null;
    const { eliminated, voteCounts } = tallyVotes(votes, this.players.map(p => this.toPublicPlayer(p)), mayorId);
    const newLogs = [...this.logs];

    let newPlayers = [...this.players];
    let winner: Faction | null = null;

    if (eliminated) {
      const idx = newPlayers.findIndex(p => p.id === eliminated.id);
      if (idx !== -1) {
        // Prince survival
        if (eliminated.role === 'prince' && !this.princeSurvived) {
          newLogs.push(makeLog(this.round, 'The Prince revealed himself and survived the vote!', 'system'));
          winner = checkWinCondition(newPlayers.map(p => this.toPublicPlayer(p)));
          this.players = newPlayers;
          this.logs = newLogs;
          this.winner = winner;
          this.executionResult = {
            eliminated: null,
            voteCounts,
            wasTie: false,
            noVotes: Object.keys(votes).length === 0,
          };
          this.screen = winner ? 'game-over' : 'execution';
          this.phase = winner ? 'game-over' : 'execution';
          this.princeSurvived = true;
          this.players.forEach(p => { p.vote = null; p.skipVoted = false; });
          this.resetReady();
          return;
        }

        newPlayers[idx] = { ...newPlayers[idx], isAlive: false };
        newLogs.push(makeLog(this.round, `${eliminated.name} was eliminated. They were a ${eliminated.role.toUpperCase()}!`, 'death'));

        // Hunter revenge
        if (eliminated.role === 'hunter') {
          const aliveOthers = newPlayers.filter(p => p.isAlive && p.id !== eliminated.id);
          if (aliveOthers.length > 0) {
            const revengeTarget = aliveOthers[Math.floor(Math.random() * aliveOthers.length)];
            const revengeIdx = newPlayers.findIndex(p => p.id === revengeTarget.id);
            if (revengeIdx !== -1) {
              newPlayers[revengeIdx] = { ...newPlayers[revengeIdx], isAlive: false };
              newLogs.push(makeLog(this.round, `${eliminated.name} fired their rifle in revenge! ${revengeTarget.name} was killed!`, 'death'));
            }
          }
        }
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

    // Reset votes and skip votes
    this.players.forEach(p => { p.vote = null; p.skipVoted = false; });
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

  submitSkipVote(playerId: string) {
    const player = this.players.find(p => p.id === playerId);
    if (player && player.isAlive) {
      player.skipVoted = true;
    }
  }

  shouldSkipToVote(): boolean {
    const alive = this.players.filter(p => p.isAlive);
    const skipCount = alive.filter(p => p.skipVoted).length;
    const majority = Math.floor(alive.length / 2) + 1;
    return skipCount >= majority;
  }

  shouldSkipElimination(): boolean {
    const alive = this.players.filter(p => p.isAlive);
    const skipCount = alive.filter(p => p.skipVoted).length;
    const majority = Math.floor(alive.length / 2) + 1;
    return skipCount >= majority;
  }

  skipElimination() {
    const newLogs = [...this.logs, makeLog(this.round, 'The village could not decide. No one was eliminated.', 'system')];
    this.players.forEach(p => { p.vote = null; p.skipVoted = false; });
    this.resetReady();
    this.executionResult = {
      eliminated: null,
      voteCounts: {},
      wasTie: false,
      noVotes: true,
    };
    this.logs = newLogs;
    const winner = checkWinCondition(this.players.map(p => this.toPublicPlayer(p)));
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

  addDeadChat(playerId: string, playerName: string, message: string) {
    this.deadChatMessages.push({
      id: `dead-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: playerId,
      senderName: playerName,
      message: message.trim(),
      round: this.round,
    });
  }

  addWhisper(playerId: string, playerName: string, targetId: string, message: string) {
    this.whispers.push({
      id: `whisper-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: playerId,
      senderName: playerName,
      targetId,
      message: message.trim(),
      round: this.round,
    });
  }

  nextRound() {
    this.round += 1;
    this.executionResult = null;
    this.seerCheckResult = null;
    this.sorcererCheckResult = null;
    this.playerSeerResults.clear();
    this.playerSorcererResults.clear();
    this.playerSheriffResults.clear();
    this.playerMediumResults.clear();
    this.playerMysticWolfResults.clear();
    this.lastKilled = null;
    this.gravediggerResult = null;
    this.resetReady();
    this.players.forEach(p => { p.skipVoted = false; });
    this.phase = 'night';
    this.screen = 'night';
    this.logs.push(makeLog(this.round, `Night ${this.round} falls... The village sleeps.`, 'system'));
  }

  startDay() {
    this.phase = 'day';
    this.screen = 'day';
    this.players.forEach(p => { p.skipVoted = false; });
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
    const myTrueFaction = getTrueFaction(myRole);
    const isWerewolf = myTrueFaction === 'werewolf';

    const players: Player[] = this.players.map(p => {
      const isSelf = p.id === playerId;
      const isDead = !p.isAlive;
      // Werewolf team sees each other (including minion)
      const isWerewolfTeammate = isWerewolf && getTrueFaction(p.role) === 'werewolf';
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

    let seerResult = me?.role === 'seer' ? (this.playerSeerResults.get(playerId) || null) : null;
    let sorcererResult = me?.role === 'sorcerer' ? (this.playerSorcererResults.get(playerId) || null) : null;
    let sheriffResult = me?.role === 'sheriff' ? (this.playerSheriffResults.get(playerId) || null) : null;
    let mediumResult = me?.role === 'medium' ? (this.playerMediumResults.get(playerId) || null) : null;
    let mysticWolfResult = me?.role === 'mysticWolf' ? (this.playerMysticWolfResults.get(playerId) || null) : null;

    const aliveWerewolves = this.players.filter(p => p.isAlive && getTrueFaction(p.role) === 'werewolf').length;
    const aliveVillagers = this.players.filter(p => p.isAlive && getTrueFaction(p.role) === 'village').length;

    const skipVotes: Record<string, boolean> = {};
    this.players.forEach(p => { if (p.isAlive && p.skipVoted) skipVotes[p.id] = true; });

    return {
      screen: this.screen,
      phase: this.phase,
      round: this.round,
      players,
      humanPlayerId: playerId,
      nightActionTarget: me?.nightAction || null,
      seerCheckResult: seerResult,
      sorcererCheckResult: sorcererResult,
      sheriffCheckResult: sheriffResult,
      gravediggerResult: this.gravediggerResult,
      mediumCheckResult: mediumResult,
      mysticWolfResult: mysticWolfResult,
      votes: {},
      lastKilled: this.lastKilled,
      winner: this.winner,
      logs: this.logs,
      settings: this.settings,
      isProcessingAI: false,
      executionResult: this.executionResult,
      chatMessages: this.chatMessages,
      deadChatMessages: this.deadChatMessages,
      whispers: this.whispers.filter(w => w.senderId === playerId || w.targetId === playerId),
      dawnReady: {},
      skipVotes,
      bodyguardTarget: me?.bodyguardTarget || null,
      witchHealUsed: this.witchHealUsed,
      witchHealTarget: me?.witchHealTarget || null,
      witchPoisonUsed: this.witchPoisonUsed,
      witchPoisonTarget: me?.witchPoisonTarget || null,
      hunterTarget: null,
      alphaWolfTarget: me?.alphaWolfTarget || null,
      vigilanteTarget: me?.vigilanteTarget || null,
      vigilanteUsed: this.vigilanteUsed,
      doctorTarget: me?.doctorTarget || null,
      mediumTarget: me?.mediumTarget || null,
      sheriffTarget: me?.sheriffTarget || null,
      mysticWolfTarget: me?.mysticWolfTarget || null,
      princeSurvived: this.princeSurvived,
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
      sorcererCheckResult: null,
      sheriffCheckResult: null,
      gravediggerResult: null,
      mediumCheckResult: null,
      mysticWolfResult: null,
      votes: {},
      lastKilled: null,
      winner: null,
      logs: [],
      settings: this.settings,
      isProcessingAI: false,
      executionResult: null,
      chatMessages: [],
      deadChatMessages: [],
      whispers: [],
      dawnReady: {},
      skipVotes: {},
      bodyguardTarget: null,
      witchHealUsed: false,
      witchHealTarget: null,
      witchPoisonUsed: false,
      witchPoisonTarget: null,
      hunterTarget: null,
      alphaWolfTarget: null,
      vigilanteTarget: null,
      vigilanteUsed: false,
      doctorTarget: null,
      mediumTarget: null,
      sheriffTarget: null,
      mysticWolfTarget: null,
      princeSurvived: false,
      mode: 'online' as const,
      roomCode: this.code,
      isHost: false,
      aliveWerewolfCount: 0,
      aliveVillagerCount: 0,
    };
  }
}

export { generateRoomCode };
