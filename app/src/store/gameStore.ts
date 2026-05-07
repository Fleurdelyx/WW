import { create } from 'zustand';
import type { GameState, GameSettings, GameScreen, Phase, Faction, GameLog, Player } from '@/types/game';
import { assignRoles, getFaction, tallyVotes, checkWinCondition, aiNightAction, aiDayVote, generateAvatar, getAiNames } from '@/engine/gameEngine';
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
};

const defaultState: GameState = {
  screen: 'home',
  phase: 'lobby',
  round: 0,
  players: [],
  humanPlayerId: '',
  nightActionTarget: null,
  seerCheckResult: null,
  votes: {},
  lastKilled: null,
  winner: null,
  logs: [],
  settings: { ...defaultSettings },
  isProcessingAI: false,
  executionResult: null,
  chatMessages: [],
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
  processNight: () => void;
  startDay: () => void;
  castVote: (targetId: string) => void;
  sendChat: (message: string) => void;
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
    const roles = assignRoles(settings.playerCount, werewolfCount, settings.hasSeer);
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
        votes: {},
        lastKilled: null,
        winner: null,
        executionResult: null,
        chatMessages: [],
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
        votes: {},
        executionResult: null,
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
        seerResult = { playerId: target.id, faction: target.faction };
      }
    }
    return { state: { ...d.state, nightActionTarget: targetId, seerCheckResult: seerResult } };
  }),

  processNight: () => set(d => {
    if (d.state.mode === 'online') return d;
    const { players, humanPlayerId, settings, round, nightActionTarget } = d.state;
    let newPlayers = [...players];
    const newLogs = [...d.state.logs];
    let seerResult = d.state.seerCheckResult;
    let killed: Player | null = null;

    const alivePlayers = newPlayers.filter(p => p.isAlive);
    let werewolfTarget: string | null = null;

    const werewolves = alivePlayers.filter(p => p.role === 'werewolf');
    if (werewolves.length > 0) {
      if (werewolves.some(w => w.isHuman) && nightActionTarget) {
        werewolfTarget = nightActionTarget;
      } else {
        const decidingWolf = werewolves[Math.floor(Math.random() * werewolves.length)];
        werewolfTarget = aiNightAction(decidingWolf, newPlayers, settings.aiDifficulty);
      }
    }

    const seers = alivePlayers.filter(p => p.role === 'seer');
    for (const seer of seers) {
      if (seer.isHuman) continue;
      const checkTarget = aiNightAction(seer, newPlayers, settings.aiDifficulty);
      if (checkTarget) {
        // AI seer stores info implicitly for day voting
      }
    }

    if (werewolfTarget) {
      const targetIdx = newPlayers.findIndex(p => p.id === werewolfTarget);
      if (targetIdx !== -1 && newPlayers[targetIdx].isAlive) {
        newPlayers[targetIdx] = { ...newPlayers[targetIdx], isAlive: false };
        killed = newPlayers[targetIdx];
        newLogs.push(makeLog(round, `${killed.name} was found dead this morning.`, 'death'));
      }
    }

    if (!killed) {
      newLogs.push(makeLog(round, 'The night was peaceful. No one died.', 'system'));
    }

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
      },
    };
  }),

  startDay: () => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('playerReady');
      return d;
    }
    const logs = [...d.state.logs, makeLog(d.state.round, `Day ${d.state.round} begins. Discuss and find the werewolves!`, 'system')];
    return { state: { ...d.state, screen: 'day', phase: 'day', logs } };
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
    const logs = [...d.state.logs, makeLog(d.state.round, `You: ${message.trim()}`, 'system')];
    return { state: { ...d.state, chatMessages, logs } };
  }),

  castVote: targetId => set(d => {
    if (d.state.mode === 'online') {
      getSocket()?.emit('vote', targetId);
      return { state: { ...d.state, votes: { ...d.state.votes, [d.state.humanPlayerId]: targetId } } };
    }
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

    const { eliminated, voteCounts } = tallyVotes(aiVotes, d.state.players);
    let newPlayers = [...d.state.players];
    let newLogs = [...aiLogs];
    let winner: Faction | null = null;

    if (eliminated) {
      const idx = newPlayers.findIndex(p => p.id === eliminated.id);
      if (idx !== -1) {
        newPlayers[idx] = { ...newPlayers[idx], isAlive: false };
        newLogs.push(makeLog(d.state.round, `${eliminated.name} was eliminated. They were a ${eliminated.role.toUpperCase()}!`, 'death'));
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
        executionResult: null,
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
    socket.emit('startGame', { hasSeer: true });
  },

  playerReady: () => {
    getSocket()?.emit('playerReady');
  },

  startVoting: () => {
    getSocket()?.emit('startVoting');
  },
}));
