import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameRoom } from './gameRoom';
import { checkWinCondition } from '../src/engine/gameEngine';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
});

const rooms = new Map<string, GameRoom>();
const socketToRoom = new Map<string, string>();
const socketToPlayerId = new Map<string, string>();

const PORT = process.env.PORT || 3000;

// Serve built frontend
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback to index.html for SPA routes
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

function broadcastRoomState(room: GameRoom) {
  room.players.forEach(p => {
    const state = room.getStateForPlayer(p.id);
    io.to(p.socketId).emit('gameState', state);
  });
}

function broadcastLobbyState(room: GameRoom) {
  const state = room.getLobbyState();
  room.players.forEach(p => {
    io.to(p.socketId).emit('gameState', {
      ...state,
      humanPlayerId: p.id,
      isHost: p.isHost,
    });
  });
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('createRoom', (name: string) => {
    // Leave any existing room
    const existingRoomCode = socketToRoom.get(socket.id);
    if (existingRoomCode) {
      const existingRoom = rooms.get(existingRoomCode);
      if (existingRoom) {
        existingRoom.removePlayer(socket.id);
        socket.leave(existingRoomCode);
        if (existingRoom.getPlayerCount() === 0) {
          rooms.delete(existingRoomCode);
        } else {
          broadcastLobbyState(existingRoom);
        }
      }
    }

    const room = new GameRoom(socket.id, name);
    rooms.set(room.code, room);
    socketToRoom.set(socket.id, room.code);
    socketToPlayerId.set(socket.id, room.players[0].id);
    socket.join(room.code);

    socket.emit('roomCreated', { roomCode: room.code, playerId: room.players[0].id });
    broadcastLobbyState(room);
  });

  socket.on('joinRoom', (code: string, name: string) => {
    const room = rooms.get(code.toUpperCase());
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    if (room.phase !== 'lobby') {
      socket.emit('error', { message: 'Game already in progress' });
      return;
    }
    if (room.getPlayerCount() >= 12) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }
    const trimmedName = name.trim();
    const resolvedName = trimmedName || `Player ${room.getPlayerCount() + 1}`;
    if (room.players.some(p => p.name.toLowerCase() === resolvedName.toLowerCase())) {
      socket.emit('error', { message: 'That name is already taken' });
      return;
    }

    // Leave any existing room
    const existingRoomCode = socketToRoom.get(socket.id);
    if (existingRoomCode && existingRoomCode !== code) {
      const existingRoom = rooms.get(existingRoomCode);
      if (existingRoom) {
        existingRoom.removePlayer(socket.id);
        socket.leave(existingRoomCode);
        if (existingRoom.getPlayerCount() === 0) {
          rooms.delete(existingRoomCode);
        } else {
          broadcastLobbyState(existingRoom);
        }
      }
    }

    const { playerId } = room.addPlayer(socket.id, name);
    socketToRoom.set(socket.id, room.code);
    socketToPlayerId.set(socket.id, playerId);
    socket.join(room.code);

    socket.emit('joinedRoom', { roomCode: room.code, playerId, isHost: false });
    broadcastLobbyState(room);
  });

  socket.on('startGame', (settings?: Partial<{ hasSeer: boolean; hasBodyguard: boolean; hasHunter: boolean; hasWitch: boolean; hasAlphaWolf: boolean; hasSorcerer: boolean; hasMinion: boolean; hasMedium: boolean; hasMayor: boolean; hasVigilante: boolean; hasDoctor: boolean; hasSheriff: boolean; hasGravedigger: boolean; hasMysticWolf: boolean; hasWolfCub: boolean; hasLycan: boolean; hasPrince: boolean; nightTimerSeconds: number; discussionTimerSeconds: number }>) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    if (room.hostId !== socket.id) {
      socket.emit('error', { message: 'Only the host can start the game' });
      return;
    }
    if (room.getPlayerCount() < 4) {
      socket.emit('error', { message: 'Need at least 4 players' });
      return;
    }

    room.startGame(settings);
    broadcastRoomState(room);
  });

  socket.on('playerReady', () => {
    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayerId.get(socket.id);
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    room.setPlayerReady(playerId);

    // Auto-advance from role-reveal to night when all ready
    if (room.phase === 'role-reveal' && room.allReady()) {
      room.resetReady();
      room.phase = 'night';
      room.screen = 'night';
      room.logs.push({ id: `log-${Date.now()}`, round: room.round, message: `Night ${room.round} falls... The village sleeps.`, type: 'system' });
    }

    // Auto-advance from dawn to day when all ready
    if (room.phase === 'dawn' && room.allReady()) {
      room.resetReady();
      room.startDay();
    }

    // Auto-advance from execution to next night when all ready
    if (room.phase === 'execution' && room.allReady()) {
      room.resetReady();
      room.nextRound();
    }

    // Auto-advance from game-over to lobby when all ready (or just host)
    if (room.phase === 'game-over' && room.allReady()) {
      room.phase = 'lobby';
      room.screen = 'lobby';
      room.round = 0;
      room.players.forEach(p => {
        p.role = 'villager';
        p.faction = 'village';
        p.isAlive = true;
        p.nightAction = null;
        p.vote = null;
        p.ready = false;
      });
      broadcastLobbyState(room);
      return;
    }

    broadcastRoomState(room);
  });

  socket.on('rename', (newName: string) => {
    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayerId.get(socket.id);
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    if (room.phase !== 'lobby') return;

    const trimmedName = newName.trim();
    const resolvedName = trimmedName || `Player ${room.getPlayerCount()}`;
    if (room.players.some(p => p.id !== playerId && p.name.toLowerCase() === resolvedName.toLowerCase())) {
      socket.emit('error', { message: 'That name is already taken' });
      return;
    }

    room.renamePlayer(playerId, trimmedName);
    broadcastLobbyState(room);
  });

  socket.on('updateSettings', (newSettings: Partial<GameSettings>) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    if (room.phase !== 'lobby') return;
    if (room.hostId !== socket.id) return;

    room.updateSettings(newSettings);
    broadcastLobbyState(room);
  });

  socket.on('nightAction', (targetId: string) => {
    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayerId.get(socket.id);
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    const allIn = room.submitNightAction(playerId, targetId);
    if (allIn || room.allNightActionsIn()) {
      room.processNight();
    }
    broadcastRoomState(room);
  });

  socket.on('bodyguardAction', (targetId: string) => {
    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayerId.get(socket.id);
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    room.submitBodyguardAction(playerId, targetId);
    if (room.allNightActionsIn()) {
      room.processNight();
    }
    broadcastRoomState(room);
  });

  socket.on('witchAction', ({ healTarget, poisonTarget }: { healTarget: string | null; poisonTarget: string | null }) => {
    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayerId.get(socket.id);
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    room.submitWitchAction(playerId, healTarget, poisonTarget);
    if (room.allNightActionsIn()) {
      room.processNight();
    }
    broadcastRoomState(room);
  });

  socket.on('sorcererAction', (targetId: string) => {
    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayerId.get(socket.id);
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    room.submitSorcererAction(playerId, targetId);
    if (room.allNightActionsIn()) {
      room.processNight();
    }
    broadcastRoomState(room);
  });

  socket.on('alphaWolfAction', (targetId: string) => {
    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayerId.get(socket.id);
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    room.submitAlphaWolfAction(playerId, targetId);
    if (room.allNightActionsIn()) {
      room.processNight();
    }
    broadcastRoomState(room);
  });

  socket.on('vigilanteAction', (targetId: string) => {
    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayerId.get(socket.id);
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    room.submitVigilanteAction(playerId, targetId);
    if (room.allNightActionsIn()) {
      room.processNight();
    }
    broadcastRoomState(room);
  });

  socket.on('doctorAction', (targetId: string) => {
    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayerId.get(socket.id);
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    room.submitDoctorAction(playerId, targetId);
    if (room.allNightActionsIn()) {
      room.processNight();
    }
    broadcastRoomState(room);
  });

  socket.on('sheriffAction', (targetId: string) => {
    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayerId.get(socket.id);
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    room.submitSheriffAction(playerId, targetId);
    if (room.allNightActionsIn()) {
      room.processNight();
    }
    broadcastRoomState(room);
  });

  socket.on('mediumAction', (targetId: string) => {
    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayerId.get(socket.id);
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    room.submitMediumAction(playerId, targetId);
    if (room.allNightActionsIn()) {
      room.processNight();
    }
    broadcastRoomState(room);
  });

  socket.on('mysticWolfAction', (targetId: string) => {
    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayerId.get(socket.id);
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    room.submitMysticWolfAction(playerId, targetId);
    if (room.allNightActionsIn()) {
      room.processNight();
    }
    broadcastRoomState(room);
  });

  socket.on('startVoting', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    if (room.hostId !== socket.id) return;

    room.phase = 'voting';
    room.screen = 'day';
    room.resetSkipVotes();
    broadcastRoomState(room);
  });

  socket.on('voteSkip', () => {
    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayerId.get(socket.id);
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    room.submitSkipVote(playerId);
    if (room.shouldSkipToVote()) {
      room.phase = 'voting';
      room.screen = 'day';
      room.resetSkipVotes();
    }
    broadcastRoomState(room);
  });

  socket.on('vote', (targetId: string) => {
    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayerId.get(socket.id);
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    room.submitVote(playerId, targetId);

    if (room.allVotesIn()) {
      room.processVotes();
    }
    broadcastRoomState(room);
  });

  socket.on('voteSkipElimination', () => {
    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayerId.get(socket.id);
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    if (room.phase !== 'voting') return;

    room.submitSkipVote(playerId);
    if (room.shouldSkipElimination()) {
      room.skipElimination();
    }
    broadcastRoomState(room);
  });

  socket.on('chat', (message: string) => {
    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayerId.get(socket.id);
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) return;

    room.addChat(playerId, player.name, message);
    broadcastRoomState(room);
  });

  socket.on('deadChat', (message: string) => {
    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayerId.get(socket.id);
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;
    if (player.isAlive && player.role !== 'medium') return;

    room.addDeadChat(playerId, player.name, message);
    broadcastRoomState(room);
  });

  socket.on('whisper', ({ targetId, message }: { targetId: string; message: string }) => {
    const roomCode = socketToRoom.get(socket.id);
    const playerId = socketToPlayerId.get(socket.id);
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) return;
    if (room.phase !== 'day' && room.phase !== 'voting') return;
    if (!message.trim()) return;
    if (targetId === playerId) return;

    const target = room.players.find(p => p.id === targetId);
    if (!target || !target.isAlive) return;

    room.addWhisper(playerId, player.name, targetId, message);
    broadcastRoomState(room);
  });

  socket.on('leaveRoom', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (roomCode) {
      const room = rooms.get(roomCode);
      if (room) {
        room.removePlayer(socket.id);
        socket.leave(roomCode);
        socketToRoom.delete(socket.id);
        socketToPlayerId.delete(socket.id);
        if (room.getPlayerCount() === 0) {
          rooms.delete(roomCode);
        } else {
          if (room.phase === 'lobby') {
            broadcastLobbyState(room);
          } else {
            const winner = checkWinCondition(room.players.map(p => room.toPublicPlayer(p)));
            if (winner) {
              room.winner = winner;
              room.phase = 'game-over';
              room.screen = 'game-over';
            }
            broadcastRoomState(room);
          }
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const roomCode = socketToRoom.get(socket.id);
    if (roomCode) {
      const room = rooms.get(roomCode);
      if (room) {
        room.removePlayer(socket.id);
        socketToRoom.delete(socket.id);
        socketToPlayerId.delete(socket.id);
        if (room.getPlayerCount() === 0) {
          rooms.delete(roomCode);
        } else {
          if (room.phase === 'lobby') {
            broadcastLobbyState(room);
          } else {
            const winner = checkWinCondition(room.players.map(p => room.toPublicPlayer(p)));
            if (winner) {
              room.winner = winner;
              room.phase = 'game-over';
              room.screen = 'game-over';
            }
            broadcastRoomState(room);
          }
        }
      }
    }
  });
});

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
