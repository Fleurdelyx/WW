import { create } from 'zustand';
import type { GameState, GameSettings, GameScreen, Phase, Faction, GameLog, Player } from '@/types/game';
import { assignRoles, getFaction, getTrueFaction, tallyVotes, checkWinCondition, aiNightAction, aiDayVote, generateAvatar, getAiNames, generateAiChat, generateAiDawnReady, generateAiSkipVote } from '@/engine/gameEngine';
import { getSocket, connectSocket, disconnectSocket } from '@/socket';

let logIdCounter = 0;
function makeLog(round: number, message: string, type: GameLog['type']): GameLog {
  return { id: `log-${++logIdCounter}`, round, message, type };
}

const defaultSettings: GameSettings = {
  playerName: 'You',
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

const defaultState: GameState = {
  screen: 'home',
  phase: 'lobby',
  round: 0,
  players: [],
  humanPlayerId: '',
  nightActionTarget: null,
  seerCheckResult: null,
  sheriffCheckResult: null,
  gravediggerResult: null,
  mediumCheckResult: null,
  mysticWolfResult: null,
  sorcererCheckResult: null,
  votes: {},
  lastKilled: null,
  winner: null,
  logs: [],
  settings: { ...defaultSettings },
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
  mode: 'local',
  roomCode: null,
  isHost: false,
  aliveWerewolfCount: 0,
  aliveVillagerCount: 0,
};

export const useGameStore = create<{
  state: GameState;
  setScreen: (screen: GameScreen) => void;
  updateSettings: (s: Partial<GameSettings>) => void;
  // Local game
  createGame: () => void;
  startRoleReveal: () => void;
  startNight: () => void;
  submitNightAction: (targetId: string) => void;
  submitBodyguardAction: (targetId: string) => void;
  submitWitchAction: (healTarget: string | null, poisonTarget: string | null) => void;
  submitSorcererAction: (targetId: string) => void;
  submitAlphaWolfAction: (targetId: string) => void;
  submitVigilanteAction: (targetId: string) => void;
  submitDoctorAction: (targetId: string) => void;
  submitSheriffAction: (targetId: string) => void;
  submitMediumAction: (targetId: string) => void;
  submitMysticWolfAction: (targetId: string) => void;
  processNight: () => void;
  startDay: () => void;
  setDawnReady: () => void;
  castVote: (targetId: string) => void;
  sendChat: (message: string) => void;
  sendDeadChat: (message: string) => void;
  sendWhisper: (targetId: string, message: string) => void;
  aiAutoChat: () => void;
  voteSkipDiscussion: () => void;
  nextRound: () => void;
  resetGame: () => void;
  goHome: () => void;
  // Multiplayer
  setMode: (mode: 'local' | 'online') => void;
  setServerState: (state: Partial<GameState>) => void;
  createRoom: (name: string) => void;
  joinRoom: (code: string, name: string) => void;
  leaveRoom: () => void;
  startOnlineGame: () => void;
  playerReady: () => void;
  startVoting: () => void;
}>(set => ({
  state: { ...defaultState },

  setScreen: screen => set(d => ({ state: { ...d.state, screen } })),

  updateSettings: s => set(d => ({ state: { ...d.state, settings: { ...d.state.settings, ...s } } })),

  createGame: () => set(d => {
    const settings = d.state.settings;
    const werewolfCount = Math.max(1, Math.floor(settings.playerCount * 0.25));
    const roles = assignRoles(settings.playerCount, werewolfCount, {
      hasSeer: settings.hasSeer,
      hasBodyguard: settings.hasBodyguard,
      hasHunter: settings.hasHunter,
      hasWitch: settings.hasWitch,
      hasAlphaWolf: settings.hasAlphaWolf,
      hasSorcerer: settings.hasSorcerer,
      hasMinion: settings.hasMinion,
      hasMedium: settings.hasMedium,
      hasMayor: settings.hasMayor,
      hasVigilante: settings.hasVigilante,
      hasDoctor: settings.hasDoctor,
      hasSheriff: settings.hasSheriff,
      hasGravedigger: settings.hasGravedigger,
      hasMysticWolf: settings.hasMysticWolf,
      hasWolfCub: settings.hasWolfCub,
      hasLycan: settings.hasLycan,
      hasPrince: settings.hasPrince,
    });
    const aiNames = getAiNames(settings.playerCount - 1);

    const players: Player[] = roles.map((role, i) => ({
      id: `p-${i}`,
      name: i === 0 ? settings.playerName : aiNames[i - 1] || `Bot ${i}`,
      role,
      faction: getFaction(role),
      isAlive: true,
      isHuman: i === 0,
      avatar: generateAvatar(i),
    }));

    const humanId = players[0].id;
    return {
      state: {
        ...d.state,
        screen: 'role-reveal',
        phase: 'role-reveal',
        round: 1,
        players,
        humanPlayerId: humanId,
        nightActionTarget: null,
        seerCheckResult: null,
        sheriffCheckResult: null,
        gravediggerResult: null,
        mediumCheckResult: null,
        mysticWolfResult: null,
        sorcererCheckResult: null,
        votes: {},
        lastKilled: null,
        winner: null,
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
        logs: [makeLog(1, `Game started with ${settings.playerCount} players.`, 'system')],
      },
    };
  }),

  startRoleReveal: () => set(d => ({ state: { ...d.state, screen: 'role-reveal', phase: 'role-reveal' } })),

  startNight: () => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('playerReady');
      return d;
    }
    const logs = [...d.state.logs, makeLog(d.state.round, `Night ${d.state.round} falls... The village sleeps.`, 'system')];
    return {
      state: {
        ...d.state,
        screen: 'night',
        phase: 'night',
        nightActionTarget: null,
        seerCheckResult: null,
        sheriffCheckResult: null,
        gravediggerResult: null,
        mediumCheckResult: null,
        mysticWolfResult: null,
        sorcererCheckResult: null,
        votes: {},
        executionResult: null,
        bodyguardTarget: null,
        witchHealTarget: null,
        witchPoisonTarget: null,
        hunterTarget: null,
        alphaWolfTarget: null,
        vigilanteTarget: null,
        doctorTarget: null,
        mediumTarget: null,
        sheriffTarget: null,
        mysticWolfTarget: null,
        dawnReady: {},
        skipVotes: {},
        logs,
      },
    };
  }),

  submitNightAction: targetId => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('nightAction', targetId);
      return { state: { ...d.state, nightActionTarget: targetId } };
    }
    const human = d.state.players.find(p => p.id === d.state.humanPlayerId);
    if (!human || !human.isAlive) return d;

    let seerResult = d.state.seerCheckResult;
    if (human.role === 'seer') {
      const target = d.state.players.find(p => p.id === targetId);
      if (target) {
        // Minion appears as village to Seer
        const shownFaction = target.role === 'minion' ? 'village' : target.faction;
        seerResult = { playerId: target.id, faction: shownFaction };
      }
    }
    return { state: { ...d.state, nightActionTarget: targetId, seerCheckResult: seerResult } };
  }),

  submitBodyguardAction: targetId => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('bodyguardAction', targetId);
      return { state: { ...d.state, bodyguardTarget: targetId } };
    }
    const human = d.state.players.find(p => p.id === d.state.humanPlayerId);
    if (!human || !human.isAlive) return d;
    return { state: { ...d.state, bodyguardTarget: targetId } };
  }),

  submitWitchAction: (healTarget, poisonTarget) => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('witchAction', { healTarget, poisonTarget });
      return { state: { ...d.state, witchHealTarget: healTarget, witchPoisonTarget: poisonTarget } };
    }
    const human = d.state.players.find(p => p.id === d.state.humanPlayerId);
    if (!human || !human.isAlive) return d;
    return { state: { ...d.state, witchHealTarget: healTarget, witchPoisonTarget: poisonTarget } };
  }),

  submitSorcererAction: targetId => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('sorcererAction', targetId);
      return { state: { ...d.state, nightActionTarget: targetId } };
    }
    const human = d.state.players.find(p => p.id === d.state.humanPlayerId);
    if (!human || !human.isAlive) return d;

    let sorcererResult = d.state.sorcererCheckResult;
    if (human.role === 'sorcerer') {
      const target = d.state.players.find(p => p.id === targetId);
      if (target) {
        sorcererResult = { playerId: target.id, isSeer: target.role === 'seer' };
      }
    }
    return { state: { ...d.state, nightActionTarget: targetId, sorcererCheckResult: sorcererResult } };
  }),

  submitAlphaWolfAction: targetId => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('alphaWolfAction', targetId);
      return { state: { ...d.state, alphaWolfTarget: targetId } };
    }
    const human = d.state.players.find(p => p.id === d.state.humanPlayerId);
    if (!human || !human.isAlive) return d;
    return { state: { ...d.state, alphaWolfTarget: targetId } };
  }),

  submitVigilanteAction: targetId => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('vigilanteAction', targetId);
      return { state: { ...d.state, vigilanteTarget: targetId } };
    }
    const human = d.state.players.find(p => p.id === d.state.humanPlayerId);
    if (!human || !human.isAlive) return d;
    return { state: { ...d.state, vigilanteTarget: targetId } };
  }),

  submitDoctorAction: targetId => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('doctorAction', targetId);
      return { state: { ...d.state, doctorTarget: targetId } };
    }
    const human = d.state.players.find(p => p.id === d.state.humanPlayerId);
    if (!human || !human.isAlive) return d;
    return { state: { ...d.state, doctorTarget: targetId } };
  }),

  submitSheriffAction: targetId => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('sheriffAction', targetId);
      return { state: { ...d.state, sheriffTarget: targetId } };
    }
    const human = d.state.players.find(p => p.id === d.state.humanPlayerId);
    if (!human || !human.isAlive) return d;
    const target = d.state.players.find(p => p.id === targetId);
    const sheriffResult = target ? { playerId: target.id, role: target.role } : null;
    return { state: { ...d.state, sheriffTarget: targetId, sheriffCheckResult: sheriffResult } };
  }),

  submitMediumAction: targetId => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('mediumAction', targetId);
      return { state: { ...d.state, mediumTarget: targetId } };
    }
    const human = d.state.players.find(p => p.id === d.state.humanPlayerId);
    if (!human || !human.isAlive) return d;
    const target = d.state.players.find(p => p.id === targetId);
    const mediumResult = target ? { playerId: target.id, role: target.role } : null;
    return { state: { ...d.state, mediumTarget: targetId, mediumCheckResult: mediumResult } };
  }),

  submitMysticWolfAction: targetId => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('mysticWolfAction', targetId);
      return { state: { ...d.state, mysticWolfTarget: targetId } };
    }
    const human = d.state.players.find(p => p.id === d.state.humanPlayerId);
    if (!human || !human.isAlive) return d;
    const target = d.state.players.find(p => p.id === targetId);
    if (target) {
      const shownFaction = target.role === 'minion' ? 'village' : target.faction;
      return { state: { ...d.state, mysticWolfTarget: targetId, mysticWolfResult: { playerId: target.id, faction: shownFaction } } };
    }
    return { state: { ...d.state, mysticWolfTarget: targetId } };
  }),

  processNight: () => set(d => {
    if (d.state.mode === 'online') return d;
    const { players, humanPlayerId, settings, round, nightActionTarget, bodyguardTarget, witchHealTarget, witchPoisonTarget, witchHealUsed, witchPoisonUsed, alphaWolfTarget, sorcererCheckResult, vigilanteTarget, vigilanteUsed, doctorTarget } = d.state;
    let newPlayers = [...players];
    const newLogs = [...d.state.logs];
    let seerResult = d.state.seerCheckResult;
    let killed: Player | null = null;
    let witchKilled: Player | null = null;
    let vigilanteKilled: Player | null = null;
    let gravediggerResult = d.state.gravediggerResult;

    const alivePlayers = newPlayers.filter(p => p.isAlive);

    // Werewolf target selection
    let werewolfTarget: string | null = null;
    const werewolves = alivePlayers.filter(p => p.role === 'werewolf' || p.role === 'alphaWolf' || p.role === 'wolfCub');
    const alphaWolves = alivePlayers.filter(p => p.role === 'alphaWolf');

    if (werewolves.length > 0) {
      // Check if Alpha Wolf submitted (their choice overrides all)
      let alphaTarget: string | null = null;
      const humanAlpha = alphaWolves.find(w => w.isHuman);
      if (humanAlpha && alphaWolfTarget) {
        alphaTarget = alphaWolfTarget;
      } else {
        // AI alpha wolf
        const aiAlpha = alphaWolves.find(w => !w.isHuman);
        if (aiAlpha) {
          alphaTarget = aiNightAction(aiAlpha, newPlayers, settings.aiDifficulty);
        }
      }

      if (alphaTarget) {
        werewolfTarget = alphaTarget;
      } else if (werewolves.some(w => w.isHuman) && nightActionTarget) {
        werewolfTarget = nightActionTarget;
      } else {
        const decidingWolf = werewolves[Math.floor(Math.random() * werewolves.length)];
        werewolfTarget = aiNightAction(decidingWolf, newPlayers, settings.aiDifficulty);
      }
    }

    // Seer checks
    const seers = alivePlayers.filter(p => p.role === 'seer');
    for (const seer of seers) {
      if (seer.isHuman) continue;
      const checkTarget = aiNightAction(seer, newPlayers, settings.aiDifficulty);
      if (checkTarget) {
        // AI seer stores info implicitly for day voting
      }
    }

    // Sorcerer checks (AI)
    const sorcerers = alivePlayers.filter(p => p.role === 'sorcerer');
    for (const sorcerer of sorcerers) {
      if (sorcerer.isHuman) continue;
      const checkTarget = aiNightAction(sorcerer, newPlayers, settings.aiDifficulty);
      if (checkTarget) {
        // AI sorcerer stores info implicitly
      }
    }

    // Sheriff checks (AI)
    const sheriffs = alivePlayers.filter(p => p.role === 'sheriff');
    for (const sheriff of sheriffs) {
      if (sheriff.isHuman) continue;
      const checkTarget = aiNightAction(sheriff, newPlayers, settings.aiDifficulty);
      if (checkTarget) {
        // AI sheriff stores info implicitly
      }
    }

    // Medium checks (AI)
    const mediums = alivePlayers.filter(p => p.role === 'medium');
    for (const medium of mediums) {
      if (medium.isHuman) continue;
      const checkTarget = aiNightAction(medium, newPlayers, settings.aiDifficulty);
      if (checkTarget) {
        // AI medium stores info implicitly
      }
    }

    // Mystic Wolf checks (AI)
    const mysticWolves = alivePlayers.filter(p => p.role === 'mysticWolf');
    for (const mw of mysticWolves) {
      if (mw.isHuman) continue;
      const checkTarget = aiNightAction(mw, newPlayers, settings.aiDifficulty);
      if (checkTarget) {
        // AI mystic wolf stores info implicitly
      }
    }

    // Bodyguard action (AI)
    let bgTarget = bodyguardTarget;
    const bodyguards = alivePlayers.filter(p => p.role === 'bodyguard');
    for (const bg of bodyguards) {
      if (bg.isHuman) continue;
      bgTarget = aiNightAction(bg, newPlayers, settings.aiDifficulty);
    }

    // Doctor action (AI)
    let docTarget = doctorTarget;
    const doctors = alivePlayers.filter(p => p.role === 'doctor');
    for (const doc of doctors) {
      if (doc.isHuman) continue;
      docTarget = aiNightAction(doc, newPlayers, settings.aiDifficulty);
    }

    // Witch actions (AI)
    let witchHeal = witchHealTarget;
    let witchPoison = witchPoisonTarget;
    const witches = alivePlayers.filter(p => p.role === 'witch');
    for (const witch of witches) {
      if (witch.isHuman) continue;
      const action = aiNightAction(witch, newPlayers, settings.aiDifficulty);
      if (!witchHealUsed && action) {
        witchHeal = action;
      }
      if (!witchPoisonUsed && action) {
        witchPoison = action;
      }
    }

    // Vigilante action (AI)
    let vigTarget = vigilanteTarget;
    const vigilantes = alivePlayers.filter(p => p.role === 'vigilante');
    for (const vig of vigilantes) {
      if (vig.isHuman) continue;
      vigTarget = aiNightAction(vig, newPlayers, settings.aiDifficulty);
    }

    // Apply werewolf kill (check bodyguard, witch heal, and doctor heal)
    let werewolfKillBlocked = false;
    if (werewolfTarget) {
      if (bgTarget === werewolfTarget) {
        werewolfKillBlocked = true;
        newLogs.push(makeLog(round, 'The Bodyguard protected someone from the Werewolves!', 'action'));
      }
      if (witchHeal === werewolfTarget && !witchHealUsed) {
        werewolfKillBlocked = true;
        newLogs.push(makeLog(round, 'The Witch used her healing potion to save someone!', 'action'));
      }
      if (docTarget === werewolfTarget) {
        werewolfKillBlocked = true;
        newLogs.push(makeLog(round, 'The Doctor saved someone from death!', 'action'));
      }

      if (!werewolfKillBlocked) {
        const targetIdx = newPlayers.findIndex(p => p.id === werewolfTarget);
        if (targetIdx !== -1 && newPlayers[targetIdx].isAlive) {
          newPlayers[targetIdx] = { ...newPlayers[targetIdx], isAlive: false };
          killed = newPlayers[targetIdx];
          newLogs.push(makeLog(round, `${killed.name} was found dead this morning.`, 'death'));
        }
      }
    }

    // Apply witch poison
    if (witchPoison && !witchPoisonUsed) {
      const poisonIdx = newPlayers.findIndex(p => p.id === witchPoison);
      if (poisonIdx !== -1 && newPlayers[poisonIdx].isAlive) {
        if (docTarget === witchPoison) {
          newLogs.push(makeLog(round, 'The Doctor saved someone from the Witch\'s poison!', 'action'));
        } else {
          newPlayers[poisonIdx] = { ...newPlayers[poisonIdx], isAlive: false };
          witchKilled = newPlayers[poisonIdx];
          newLogs.push(makeLog(round, `${witchKilled.name} was found poisoned this morning.`, 'death'));
        }
      }
    }

    // Apply vigilante kill
    let newVigilanteUsed = vigilanteUsed;
    if (vigTarget && !vigilanteUsed) {
      const vigIdx = newPlayers.findIndex(p => p.id === vigTarget);
      if (vigIdx !== -1 && newPlayers[vigIdx].isAlive) {
        if (docTarget === vigTarget) {
          newLogs.push(makeLog(round, 'The Doctor saved someone from the Vigilante!', 'action'));
        } else {
          newPlayers[vigIdx] = { ...newPlayers[vigIdx], isAlive: false };
          vigilanteKilled = newPlayers[vigIdx];
          newLogs.push(makeLog(round, `${vigilanteKilled.name} was found shot by a Vigilante this morning.`, 'death'));
        }
      }
      newVigilanteUsed = true;
    }

    // Hunter night revenge
    const anyNightKilled = killed || witchKilled || vigilanteKilled;
    if (killed && killed.role === 'hunter') {
      const hunterRevengeTargets = newPlayers.filter(p => p.isAlive && p.id !== killed.id);
      if (hunterRevengeTargets.length > 0) {
        const revengeTarget = hunterRevengeTargets[Math.floor(Math.random() * hunterRevengeTargets.length)];
        const revengeIdx = newPlayers.findIndex(p => p.id === revengeTarget.id);
        if (revengeIdx !== -1) {
          newPlayers[revengeIdx] = { ...newPlayers[revengeIdx], isAlive: false };
          newLogs.push(makeLog(round, `${killed.name} fired their rifle in their dying breath! ${revengeTarget.name} was killed!`, 'death'));
        }
      }
    }

    if (!anyNightKilled && !werewolfKillBlocked) {
      newLogs.push(makeLog(round, 'The night was peaceful. No one died.', 'system'));
    } else if (!anyNightKilled && werewolfKillBlocked) {
      newLogs.push(makeLog(round, 'The night was peaceful thanks to a protector.', 'system'));
    }

    // Gravedigger auto-reveal
    if (killed) {
      gravediggerResult = { playerId: killed.id, role: killed.role };
    } else if (witchKilled) {
      gravediggerResult = { playerId: witchKilled.id, role: witchKilled.role };
    } else if (vigilanteKilled) {
      gravediggerResult = { playerId: vigilanteKilled.id, role: vigilanteKilled.role };
    }

    // Track witch potion usage
    const newWitchHealUsed = witchHealUsed || !!witchHeal;
    const newWitchPoisonUsed = witchPoisonUsed || !!witchPoison;

    const winner = checkWinCondition(newPlayers);
    if (winner) {
      return {
        state: {
          ...d.state,
          players: newPlayers,
          lastKilled: killed,
          logs: newLogs,
          screen: 'game-over',
          phase: 'game-over',
          winner,
          witchHealUsed: newWitchHealUsed,
          witchPoisonUsed: newWitchPoisonUsed,
          vigilanteUsed: newVigilanteUsed,
          gravediggerResult,
        },
      };
    }

    return {
      state: {
        ...d.state,
        players: newPlayers,
        lastKilled: killed,
        seerCheckResult: seerResult,
        screen: 'dawn',
        phase: 'dawn',
        logs: newLogs,
        witchHealUsed: newWitchHealUsed,
        witchPoisonUsed: newWitchPoisonUsed,
        vigilanteUsed: newVigilanteUsed,
        gravediggerResult,
      },
    };
  }),

  startDay: () => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('playerReady');
      return d;
    }
    const logs = [...d.state.logs, makeLog(d.state.round, `Day ${d.state.round} begins. Discuss and find the werewolves!`, 'system')];
    return { state: { ...d.state, screen: 'day', phase: 'day', logs, dawnReady: {}, skipVotes: {} } };
  }),

  setDawnReady: () => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('playerReady');
      return d;
    }
    const humanId = d.state.humanPlayerId;
    const newDawnReady = { ...d.state.dawnReady, [humanId]: true };

    // AI dawn ready
    const alivePlayers = d.state.players.filter(p => p.isAlive);
    for (const p of alivePlayers) {
      if (newDawnReady[p.id]) continue;
      if (generateAiDawnReady(p)) {
        newDawnReady[p.id] = true;
      }
    }

    const allReady = alivePlayers.every(p => newDawnReady[p.id]);
    if (allReady) {
      const logs = [...d.state.logs, makeLog(d.state.round, `Day ${d.state.round} begins. Discuss and find the werewolves!`, 'system')];
      return { state: { ...d.state, screen: 'day', phase: 'day', logs, dawnReady: {}, skipVotes: {} } };
    }

    return { state: { ...d.state, dawnReady: newDawnReady } };
  }),

  sendChat: message => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('chat', message);
      return d;
    }
    const human = d.state.players.find(p => p.id === d.state.humanPlayerId);
    if (!human || !message.trim()) return d;
    const chatMessages = [...(d.state.chatMessages || []), {
      id: `chat-${Date.now()}`,
      senderId: human.id,
      senderName: human.name,
      message: message.trim(),
      round: d.state.round,
    }];
    const logs = [...d.state.logs, makeLog(d.state.round, `${human.name}: ${message.trim()}`, 'chat')];

    // Generate AI chat responses
    const aliveAI = d.state.players.filter(p => p.isAlive && !p.isHuman);
    for (const ai of aliveAI) {
      const aiChat = generateAiChat(ai, d.state.players, d.state.round);
      if (aiChat) {
        chatMessages.push(aiChat);
        logs.push(makeLog(d.state.round, `${aiChat.senderName}: ${aiChat.message}`, 'chat'));
      }
    }

    return { state: { ...d.state, chatMessages, logs } };
  }),

  sendDeadChat: message => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('deadChat', message);
      return d;
    }
    const human = d.state.players.find(p => p.id === d.state.humanPlayerId);
    if (!human || !message.trim()) return d;
    if (human.isAlive && human.role !== 'medium') return d;

    const deadChatMessages = [...(d.state.deadChatMessages || []), {
      id: `dead-${Date.now()}`,
      senderId: human.id,
      senderName: human.name,
      message: message.trim(),
      round: d.state.round,
    }];
    const logs = [...d.state.logs, makeLog(d.state.round, `${human.name} (dead chat): ${message.trim()}`, 'chat')];

    // AI dead chat responses from dead AI players occasionally
    const deadAI = d.state.players.filter(p => !p.isAlive && !p.isHuman);
    const deadResponses = [
      'I knew it...',
      'The wolves got me.',
      'Trust no one.',
      'I had so much more to give!',
      'Watch out for the quiet ones.',
    ];
    for (const ai of deadAI) {
      if (Math.random() < 0.3) {
        const msg = deadResponses[Math.floor(Math.random() * deadResponses.length)];
        deadChatMessages.push({
          id: `dead-${Date.now()}-${ai.id}`,
          senderId: ai.id,
          senderName: ai.name,
          message: msg,
          round: d.state.round,
        });
        logs.push(makeLog(d.state.round, `${ai.name} (dead chat): ${msg}`, 'chat'));
      }
    }

    return { state: { ...d.state, deadChatMessages, logs } };
  }),

  sendWhisper: (targetId, message) => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('whisper', { targetId, message });
      return d;
    }
    const human = d.state.players.find(p => p.id === d.state.humanPlayerId);
    if (!human || !human.isAlive || !message.trim()) return d;
    if (d.state.phase !== 'day') return d;
    const target = d.state.players.find(p => p.id === targetId);
    if (!target || !target.isAlive) return d;

    const whispers = [...(d.state.whispers || []), {
      id: `whisper-${Date.now()}`,
      senderId: human.id,
      senderName: human.name,
      message: message.trim(),
      round: d.state.round,
    }];
    return { state: { ...d.state, whispers } };
  }),

  aiAutoChat: () => set(d => {
    if (d.state.mode === 'online') return d;
    const aliveAI = d.state.players.filter(p => p.isAlive && !p.isHuman);
    if (aliveAI.length === 0) return d;
    // Pick 1-2 random AI to speak
    const shuffled = [...aliveAI].sort(() => Math.random() - 0.5);
    const speakers = shuffled.slice(0, Math.floor(Math.random() * 2) + 1);
    const chatMessages = [...(d.state.chatMessages || [])];
    const logs = [...d.state.logs];
    let added = false;
    for (const ai of speakers) {
      const aiChat = generateAiChat(ai, d.state.players, d.state.round);
      if (aiChat) {
        chatMessages.push(aiChat);
        logs.push(makeLog(d.state.round, `${aiChat.senderName}: ${aiChat.message}`, 'chat'));
        added = true;
      }
    }
    if (!added) return d;
    return { state: { ...d.state, chatMessages, logs } };
  }),

  voteSkipDiscussion: () => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('voteSkip');
      return { state: { ...d.state, skipVotes: { ...d.state.skipVotes, [d.state.humanPlayerId]: true } } };
    }
    const humanId = d.state.humanPlayerId;
    const newSkipVotes = { ...d.state.skipVotes, [humanId]: true };

    // AI skip votes
    const alivePlayers = d.state.players.filter(p => p.isAlive);
    for (const p of alivePlayers) {
      if (newSkipVotes[p.id]) continue;
      if (generateAiSkipVote(p)) {
        newSkipVotes[p.id] = true;
      }
    }

    const skipCount = Object.keys(newSkipVotes).length;
    const majority = Math.floor(alivePlayers.length / 2) + 1;

    if (skipCount >= majority) {
      return { state: { ...d.state, phase: 'voting', skipVotes: newSkipVotes } };
    }

    return { state: { ...d.state, skipVotes: newSkipVotes } };
  }),

  castVote: targetId => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('vote', targetId);
      return { state: { ...d.state, votes: { ...d.state.votes, [d.state.humanPlayerId]: targetId } } };
    }
    const human = d.state.players.find(p => p.id === d.state.humanPlayerId);
    if (!human || !human.isAlive) return d;
    const voterId = d.state.humanPlayerId;
    const newVotes = { ...d.state.votes, [voterId]: targetId };
    const logs = [...d.state.logs, makeLog(d.state.round, `You voted to eliminate ${d.state.players.find(p => p.id === targetId)?.name}.`, 'vote')];

    const alivePlayers = d.state.players.filter(p => p.isAlive && !p.isHuman);
    const aiVotes = { ...newVotes };
    const aiLogs = [...logs];

    for (const ai of alivePlayers) {
      if (aiVotes[ai.id]) continue;
      const vote = aiDayVote(ai, d.state.players, d.state.logs.map(l => l.message), d.state.settings.aiDifficulty);
      if (vote) {
        aiVotes[ai.id] = vote;
        const targetName = d.state.players.find(p => p.id === vote)?.name;
        if (targetName) {
          aiLogs.push(makeLog(d.state.round, `${ai.name} voted for ${targetName}.`, 'vote'));
        }
      }
    }

    const mayor = d.state.players.find(p => p.isAlive && p.role === 'mayor');
    const mayorId = mayor ? mayor.id : null;
    const { eliminated, voteCounts } = tallyVotes(aiVotes, d.state.players, mayorId);
    let newPlayers = [...d.state.players];
    let newLogs = [...aiLogs];
    let winner: Faction | null = null;

    if (eliminated) {
      const idx = newPlayers.findIndex(p => p.id === eliminated.id);
      if (idx !== -1) {
        // Prince survival
        if (eliminated.role === 'prince' && !d.state.princeSurvived) {
          newLogs.push(makeLog(d.state.round, 'The Prince revealed himself and survived the vote!', 'system'));
          winner = checkWinCondition(newPlayers);
          return {
            state: {
              ...d.state,
              players: newPlayers,
              votes: aiVotes,
              logs: newLogs,
              winner,
              executionResult: {
                eliminated: null,
                voteCounts,
                wasTie: false,
                noVotes: Object.keys(aiVotes).length === 0,
              },
              screen: winner ? 'game-over' : 'execution',
              phase: winner ? 'game-over' : 'execution',
              princeSurvived: true,
            },
          };
        }

        newPlayers[idx] = { ...newPlayers[idx], isAlive: false };
        newLogs.push(makeLog(d.state.round, `${eliminated.name} was eliminated. They were a ${eliminated.role.toUpperCase()}!`, 'death'));

        // Hunter revenge
        if (eliminated.role === 'hunter') {
          const aliveOthers = newPlayers.filter(p => p.isAlive && p.id !== eliminated.id);
          if (aliveOthers.length > 0) {
            const revengeTarget = aliveOthers[Math.floor(Math.random() * aliveOthers.length)];
            const revengeIdx = newPlayers.findIndex(p => p.id === revengeTarget.id);
            if (revengeIdx !== -1) {
              newPlayers[revengeIdx] = { ...newPlayers[revengeIdx], isAlive: false };
              newLogs.push(makeLog(d.state.round, `${eliminated.name} fired their rifle in revenge! ${revengeTarget.name} was killed!`, 'death'));
            }
          }
        }
      }
    } else {
      newLogs.push(makeLog(d.state.round, 'The vote was tied. No one was eliminated.', 'system'));
    }

    winner = checkWinCondition(newPlayers);

    return {
      state: {
        ...d.state,
        players: newPlayers,
        votes: aiVotes,
        logs: newLogs,
        winner,
        executionResult: {
          eliminated: eliminated ? { ...eliminated, isAlive: true } : null,
          voteCounts,
          wasTie: !eliminated && Object.keys(aiVotes).length > 0,
          noVotes: Object.keys(aiVotes).length === 0,
        },
        screen: winner ? 'game-over' : 'execution',
        phase: winner ? 'game-over' : 'execution',
      },
    };
  }),

  nextRound: () => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('playerReady');
      return d;
    }
    const newRound = d.state.round + 1;
    return {
      state: {
        ...d.state,
        round: newRound,
        votes: {},
        nightActionTarget: null,
        seerCheckResult: null,
        sorcererCheckResult: null,
        executionResult: null,
        dawnReady: {},
        skipVotes: {},
        bodyguardTarget: null,
        witchHealTarget: null,
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
        sheriffCheckResult: null,
        gravediggerResult: null,
        mediumCheckResult: null,
        mysticWolfResult: null,
      },
    };
  }),

  resetGame: () => set(d => {
    if (d.state.mode === 'online') {
      disconnectSocket();
    }
    return { state: { ...defaultState } };
  }),

  goHome: () => set(d => {
    if (d.state.mode === 'online') {
      disconnectSocket();
    }
    return { state: { ...defaultState } };
  }),

  // Multiplayer
  setMode: mode => set(d => ({ state: { ...d.state, mode } })),

  setServerState: newState => set(d => ({ state: { ...d.state, ...newState } })),

  createRoom: name => {
    const socket = connectSocket();
    socket.emit('createRoom', name);
  },

  joinRoom: (code, name) => {
    const socket = connectSocket();
    socket.emit('joinRoom', code, name);
  },

  leaveRoom: () => {
    getSocket()?.emit('leaveRoom');
    set(d => ({ state: { ...defaultState } }));
  },

  startOnlineGame: () => {
    const socket = getSocket();
    if (!socket) return;
    const settings = useGameStore.getState().state.settings;
    socket.emit('startGame', {
      hasSeer: settings.hasSeer,
      hasBodyguard: settings.hasBodyguard,
      hasHunter: settings.hasHunter,
      hasWitch: settings.hasWitch,
      hasAlphaWolf: settings.hasAlphaWolf,
      hasSorcerer: settings.hasSorcerer,
      hasMinion: settings.hasMinion,
      hasMedium: settings.hasMedium,
      hasMayor: settings.hasMayor,
      hasVigilante: settings.hasVigilante,
      hasDoctor: settings.hasDoctor,
      hasSheriff: settings.hasSheriff,
      hasGravedigger: settings.hasGravedigger,
      hasMysticWolf: settings.hasMysticWolf,
      hasWolfCub: settings.hasWolfCub,
      hasLycan: settings.hasLycan,
      hasPrince: settings.hasPrince,
      nightTimerSeconds: settings.nightTimerSeconds,
      discussionTimerSeconds: settings.discussionTimerSeconds,
    });
  },

  playerReady: () => {
    getSocket()?.emit('playerReady');
  },

  startVoting: () => {
    getSocket()?.emit('startVoting');
  },
}));
