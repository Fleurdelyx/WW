export type Role =
  | 'villager' | 'werewolf' | 'seer' | 'bodyguard' | 'hunter' | 'witch'
  | 'alphaWolf' | 'sorcerer' | 'minion'
  | 'medium' | 'mayor' | 'vigilante' | 'doctor' | 'sheriff' | 'gravedigger'
  | 'mysticWolf' | 'wolfCub' | 'lycan' | 'prince'
  | 'unknown';

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
  type: 'system' | 'death' | 'vote' | 'reveal' | 'action' | 'chat' | 'whisper';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  round: number;
  targetId?: string;
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
  hasMedium: boolean;
  hasMayor: boolean;
  hasVigilante: boolean;
  hasDoctor: boolean;
  hasSheriff: boolean;
  hasGravedigger: boolean;
  hasMysticWolf: boolean;
  hasWolfCub: boolean;
  hasLycan: boolean;
  hasPrince: boolean;
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
  sheriffCheckResult: { playerId: string; role: Role } | null;
  gravediggerResult: { playerId: string; role: Role } | null;
  mediumCheckResult: { playerId: string; role: Role } | null;
  mysticWolfResult: { playerId: string; faction: Faction } | null;
  votes: Record<string, string>;
  lastKilled: Player | null;
  winner: Faction | null;
  logs: GameLog[];
  settings: GameSettings;
  isProcessingAI: boolean;
  executionResult: ExecutionResult | null;
  chatMessages: ChatMessage[];
  deadChatMessages: ChatMessage[];
  whispers: ChatMessage[];
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
  vigilanteTarget: string | null;
  vigilanteUsed: boolean;
  doctorTarget: string | null;
  mediumTarget: string | null;
  sheriffTarget: string | null;
  mysticWolfTarget: string | null;
  princeSurvived: boolean;
  // Multiplayer fields
  mode?: GameMode;
  roomCode?: string | null;
  isHost?: boolean;
  aliveWerewolfCount?: number;
  aliveVillagerCount?: number;
}
