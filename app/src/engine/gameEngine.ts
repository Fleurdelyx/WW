import type { Player, Role, Faction, AiDifficulty, PlayerAvatar, ChatMessage } from '@/types/game';

export function assignRoles(playerCount: number, werewolfCount: number, settings: {
  hasSeer: boolean;
  hasBodyguard: boolean;
  hasHunter: boolean;
  hasWitch: boolean;
  hasAlphaWolf: boolean;
  hasSorcerer: boolean;
  hasMinion: boolean;
}): Role[] {
  const roles: Role[] = [];

  // Build werewolf team
  const wolfRoles: Role[] = [];
  if (settings.hasAlphaWolf) wolfRoles.push('alphaWolf');
  if (settings.hasSorcerer) wolfRoles.push('sorcerer');
  if (settings.hasMinion) wolfRoles.push('minion');

  // Fill remaining werewolf slots with regular werewolves
  while (wolfRoles.length < werewolfCount) wolfRoles.push('werewolf');
  // Truncate if too many special wolves for the slot count
  if (wolfRoles.length > werewolfCount) wolfRoles.length = werewolfCount;

  roles.push(...wolfRoles);

  // Village specials
  if (settings.hasSeer) roles.push('seer');
  if (settings.hasBodyguard) roles.push('bodyguard');
  if (settings.hasHunter) roles.push('hunter');
  if (settings.hasWitch) roles.push('witch');

  // Fill with villagers
  while (roles.length < playerCount) roles.push('villager');

  // Fisher-Yates shuffle
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  return roles;
}

export function getFaction(role: Role): Faction {
  if (role === 'unknown') return 'unknown';
  if (role === 'minion') return 'village'; // Minion appears as village to Seer
  return (role === 'werewolf' || role === 'alphaWolf' || role === 'sorcerer') ? 'werewolf' : 'village';
}

export function getTrueFaction(role: Role): Faction {
  if (role === 'unknown') return 'unknown';
  return (role === 'werewolf' || role === 'alphaWolf' || role === 'sorcerer' || role === 'minion') ? 'werewolf' : 'village';
}

export function getRoleName(role: Role): string {
  const names: Record<Role, string> = {
    villager: 'Villager',
    werewolf: 'Werewolf',
    seer: 'Seer',
    bodyguard: 'Bodyguard',
    hunter: 'Hunter',
    witch: 'Witch',
    alphaWolf: 'Alpha Wolf',
    sorcerer: 'Sorcerer',
    minion: 'Minion',
    unknown: 'Unknown',
  };
  return names[role];
}

export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    villager: 'You are a Villager. Find and eliminate the Werewolves through discussion and voting.',
    werewolf: 'You are a Werewolf! Eliminate villagers at night and deceive them during the day.',
    seer: 'You are the Seer. Each night, investigate one player to learn if they are a Werewolf.',
    bodyguard: 'You are the Bodyguard. Each night, choose a player to protect from the Werewolves.',
    hunter: 'You are the Hunter. When you are eliminated, you may take one player with you.',
    witch: 'You are the Witch. You have one healing potion and one poison potion. Use them wisely at night.',
    alphaWolf: 'You are the Alpha Wolf. Your night target choice overrides all other werewolves. Lead the pack.',
    sorcerer: 'You are the Sorcerer. Each night, investigate one player to find the Seer. Serve the wolf pack.',
    minion: 'You are the Minion. You appear as a Villager but win with the Werewolves. You know who they are.',
    unknown: 'Role hidden.',
  };
  return descriptions[role];
}

export function tallyVotes(votes: Record<string, string>, players: Player[]): { eliminated: Player | null; voteCounts: Record<string, number> } {
  const alivePlayers = players.filter(p => p.isAlive);
  const counts: Record<string, number> = {};
  alivePlayers.forEach(p => counts[p.id] = 0);
  Object.values(votes).forEach(targetId => {
    if (counts[targetId] !== undefined) counts[targetId]++;
  });

  let maxVotes = 0;
  const topVoted: string[] = [];
  Object.entries(counts).forEach(([id, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      topVoted.length = 0;
      topVoted.push(id);
    } else if (count === maxVotes && count > 0) {
      topVoted.push(id);
    }
  });

  if (topVoted.length === 1) {
    return { eliminated: players.find(p => p.id === topVoted[0]) || null, voteCounts: counts };
  }
  return { eliminated: null, voteCounts: counts }; // Tie
}

export function checkWinCondition(players: Player[]): Faction | null {
  const aliveWerewolves = players.filter(p => p.isAlive && getTrueFaction(p.role) === 'werewolf').length;
  const aliveVillagers = players.filter(p => p.isAlive && getTrueFaction(p.role) === 'village').length;
  if (aliveWerewolves === 0) return 'village';
  if (aliveWerewolves >= aliveVillagers) return 'werewolf';
  return null;
}

export function getAliveCounts(players: Player[]) {
  return {
    werewolves: players.filter(p => p.isAlive && getTrueFaction(p.role) === 'werewolf').length,
    villagers: players.filter(p => p.isAlive && getTrueFaction(p.role) === 'village').length,
  };
}

const AVATAR_CONFIGS: PlayerAvatar[] = [
  { icon: 'Shield', bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
  { icon: 'Sword', bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/30' },
  { icon: 'Heart', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { icon: 'Star', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  { icon: 'Moon', bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
  { icon: 'Sun', bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  { icon: 'Flame', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  { icon: 'Snowflake', bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  { icon: 'Zap', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  { icon: 'Anchor', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  { icon: 'Crown', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  { icon: 'Key', bg: 'bg-lime-500/20', text: 'text-lime-400', border: 'border-lime-500/30' },
  { icon: 'Bell', bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  { icon: 'Feather', bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
  { icon: 'Gem', bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
];

export function generateAvatar(index: number): PlayerAvatar {
  return AVATAR_CONFIGS[index % AVATAR_CONFIGS.length];
}

export function aiNightAction(player: Player, players: Player[], difficulty: AiDifficulty): string | null {
  const aliveOthers = players.filter(p => p.id !== player.id && p.isAlive);
  if (aliveOthers.length === 0) return null;

  if (player.role === 'werewolf' || player.role === 'alphaWolf') {
    const villagers = aliveOthers.filter(p => getTrueFaction(p.role) !== 'werewolf');
    if (villagers.length === 0) return aliveOthers[Math.floor(Math.random() * aliveOthers.length)].id;

    if (difficulty === 'easy') {
      return villagers[Math.floor(Math.random() * villagers.length)].id;
    } else if (difficulty === 'medium') {
      const seerSuspects = villagers.filter(p => p.role === 'seer');
      if (seerSuspects.length > 0 && Math.random() < 0.5) {
        return seerSuspects[Math.floor(Math.random() * seerSuspects.length)].id;
      }
      return villagers[Math.floor(Math.random() * villagers.length)].id;
    } else {
      const seers = villagers.filter(p => p.role === 'seer');
      if (seers.length > 0) return seers[0].id;
      return villagers[Math.floor(Math.random() * villagers.length)].id;
    }
  }

  if (player.role === 'seer') {
    const unchecked = aliveOthers.filter(p => p.id !== player.id);
    if (unchecked.length === 0) return null;
    if (difficulty === 'hard') {
      return unchecked[Math.floor(Math.random() * Math.min(3, unchecked.length))].id;
    }
    return unchecked[Math.floor(Math.random() * unchecked.length)].id;
  }

  if (player.role === 'sorcerer') {
    // Try to find the seer
    const seerTargets = aliveOthers.filter(p => p.role === 'seer');
    if (seerTargets.length > 0 && difficulty !== 'easy') {
      return seerTargets[Math.floor(Math.random() * seerTargets.length)].id;
    }
    return aliveOthers[Math.floor(Math.random() * aliveOthers.length)].id;
  }

  if (player.role === 'bodyguard') {
    const villageAligned = aliveOthers.filter(p => getTrueFaction(p.role) !== 'werewolf');
    if (villageAligned.length === 0) return aliveOthers[Math.floor(Math.random() * aliveOthers.length)].id;
    return villageAligned[Math.floor(Math.random() * villageAligned.length)].id;
  }

  if (player.role === 'witch') {
    const nonVillagers = aliveOthers.filter(p => getTrueFaction(p.role) === 'werewolf');
    if (difficulty !== 'easy' && nonVillagers.length > 0 && Math.random() < 0.5) {
      return nonVillagers[Math.floor(Math.random() * nonVillagers.length)].id;
    }
    return aliveOthers[Math.floor(Math.random() * aliveOthers.length)].id;
  }

  return null; // Villager, Hunter, Minion have no night action
}

export function aiDayVote(player: Player, players: Player[], logs: string[], difficulty: AiDifficulty): string {
  const aliveOthers = players.filter(p => p.id !== player.id && p.isAlive);
  if (aliveOthers.length === 0) return '';

  const trueFaction = getTrueFaction(player.role);

  if (trueFaction === 'werewolf') {
    // Werewolf team votes for villagers
    const villagers = aliveOthers.filter(p => getTrueFaction(p.role) !== 'werewolf');
    if (villagers.length === 0) return aliveOthers[0].id;

    if (difficulty === 'hard') {
      const seerTargets = villagers.filter(p => p.role === 'seer');
      if (seerTargets.length > 0) return seerTargets[0].id;
    }
    return villagers[Math.floor(Math.random() * villagers.length)].id;
  }

  // Villager team: try to vote for werewolves
  if (difficulty === 'hard' && player.role === 'seer') {
    const suspectedWerewolves = aliveOthers.filter(p => getTrueFaction(p.role) === 'werewolf');
    if (suspectedWerewolves.length > 0) return suspectedWerewolves[0].id;
  }

  const werewolves = aliveOthers.filter(p => getTrueFaction(p.role) === 'werewolf');
  if (difficulty === 'hard' && werewolves.length > 0 && Math.random() < 0.4) {
    return werewolves[Math.floor(Math.random() * werewolves.length)].id;
  }

  return aliveOthers[Math.floor(Math.random() * aliveOthers.length)].id;
}

export function getAiNames(count: number): string[] {
  const names = ['Aldric','Branwen','Cedric','Darcy','Eldon','Fiona','Gareth','Hilda','Ivor','Jenna','Kael','Liora','Maren','Nolan','Petra'];
  const shuffled = [...names].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// AI Chat responses
const VILLAGER_CHAT_RESPONSES = [
  "I don't trust {name}, they've been too quiet.",
  "We need to stick together and find the wolves.",
  "{name} seems suspicious to me...",
  "Let's not rush to conclusions.",
  "I think {name} is hiding something.",
  "The wolves are among us, I can feel it.",
  "We should watch {name} carefully.",
  "I have a bad feeling about this round.",
  "Let's focus on who acted strangely yesterday.",
  "{name} was defending the wrong people...",
];

const WEREWOLF_CHAT_RESPONSES = [
  "{name} looks suspicious, don't you think?",
  "I'm just a simple villager, I swear!",
  "Why are you all looking at me?",
  "{name} is trying to throw us off track.",
  "We should be careful who we trust.",
  "I think {name} is the real werewolf here.",
  "Let's not vote too quickly.",
  "I've been watching {name} closely...",
  "The real threat is still out there.",
  "Don't listen to {name}, they're lying!",
];

const SEER_CHAT_RESPONSES = [
  "I have some information... but I can't reveal too much.",
  "Trust me, {name} is not what they seem.",
  "We need to protect the village at all costs.",
  "I've seen things in my visions...",
  "{name} should be our next target.",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateAiChat(player: Player, players: Player[], round: number): ChatMessage | null {
  if (!player.isAlive || player.isHuman) return null;
  if (Math.random() > 0.4) return null;

  const aliveOthers = players.filter(p => p.id !== player.id && p.isAlive);
  if (aliveOthers.length === 0) return null;

  const target = pickRandom(aliveOthers);
  let template: string;

  if (getTrueFaction(player.role) === 'werewolf') {
    template = pickRandom(WEREWOLF_CHAT_RESPONSES);
  } else if (player.role === 'seer') {
    template = pickRandom(SEER_CHAT_RESPONSES);
  } else {
    template = pickRandom(VILLAGER_CHAT_RESPONSES);
  }

  const message = template.replace(/{name}/g, target.name);

  return {
    id: `ai-chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    senderId: player.id,
    senderName: player.name,
    message,
    round,
  };
}

export function generateAiDawnReady(player: Player): boolean {
  if (!player.isAlive || player.isHuman) return false;
  return Math.random() < 0.7;
}

export function generateAiSkipVote(player: Player): boolean {
  if (!player.isAlive || player.isHuman) return false;
  return Math.random() < 0.5;
}
