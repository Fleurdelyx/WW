export type Role = 'villager' | 'werewolf' | 'seer' | 'bodyguard' | 'hunter' | 'witch' | 'alphaWolf' | 'sorcerer' | 'minion' | 'unknown';
export type Faction = 'village' | 'werewolf' | 'unknown';
export type Phase = 'lobby' | 'role-reveal' | 'night' | 'dawn' | 'day' | 'voting' | 'execution' | 'game-over';
export type GameScreen = 'home' | 'lobby' | 'online-lobby' | 'room' | 'role-reveal' | 'night' | 'dawn' | 'day' | 'execution' | 'game-over';
export type AiDifficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'local' | 'online';

export interface PlayerAvatar {
  icon: string;
  bg: string;
  text: string;
  border: string;
}

export interface Player {
  id: string;
  name: string;
  role: Role;
  faction: Faction;
  isAlive: boolean;
  isHuman: boolean;
  avatar: PlayerAvatar;
}

export interface GameLog {
  id: string;
  round: number;
  message: string;
  type: 'system' | 'death' | 'vote' | 'reveal' | 'action' | 'chat';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  round: number;
}

export interface ExecutionResult {
  eliminated: Player | null;
  voteCounts: Record<string, number>;
  wasTie: boolean;
  noVotes: boolean;
}

export interface GameSettings {
  playerName: string;
  playerCount: number;
  aiDifficulty: AiDifficulty;
  hasSeer: boolean;
  hasBodyguard: boolean;
  hasHunter: boolean;
  hasWitch: boolean;
  hasAlphaWolf: boolean;
  hasSorcerer: boolean;
  hasMinion: boolean;
  nightTimerSeconds: number;
  discussionTimerSeconds: number;
}

export interface GameState {
  screen: GameScreen;
  phase: Phase;
  round: number;
  players: Player[];
  humanPlayerId: string;
  nightActionTarget: string | null;
  seerCheckResult: { playerId: string; faction: Faction } | null;
  votes: Record<string, string>;
  lastKilled: Player | null;
  winner: Faction | null;
  logs: GameLog[];
  settings: GameSettings;
  isProcessingAI: boolean;
  executionResult: ExecutionResult | null;
  chatMessages: ChatMessage[];
  // Dawn skip
  dawnReady: Record<string, boolean>;
  // Discussion skip
  skipVotes: Record<string, boolean>;
  // Night action targets for special roles
  bodyguardTarget: string | null;
  witchHealUsed: boolean;
  witchHealTarget: string | null;
  witchPoisonUsed: boolean;
  witchPoisonTarget: string | null;
  hunterTarget: string | null;
  sorcererCheckResult: { playerId: string; isSeer: boolean } | null;
  alphaWolfTarget: string | null;
  // Multiplayer fields
  mode?: GameMode;
  roomCode?: string | null;
  isHost?: boolean;
  aliveWerewolfCount?: number;
  aliveVillagerCount?: number;
}
