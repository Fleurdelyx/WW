import type { Player, Role, Faction, AiDifficulty } from '@/types/game';

export function assignRoles(playerCount: number, werewolfCount: number, hasSeer: boolean): Role[] {
  const roles: Role[] = [];
  for (let i = 0; i < werewolfCount; i++) roles.push('werewolf');
  if (hasSeer) roles.push('seer');
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
  return role === 'werewolf' ? 'werewolf' : 'village';
}

export function getRoleName(role: Role): string {
  const names: Record<Role, string> = {
    villager: 'Villager',
    werewolf: 'Werewolf',
    seer: 'Seer',
    unknown: 'Unknown',
  };
  return names[role];
}

export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    villager: 'You are a Villager. Find and eliminate the Werewolves through discussion and voting.',
    werewolf: 'You are a Werewolf! Eliminate villagers at night and deceive them during the day.',
    seer: 'You are the Seer. Each night, investigate one player to learn if they are a Werewolf.',
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
  const aliveWerewolves = players.filter(p => p.isAlive && p.faction === 'werewolf').length;
  const aliveVillagers = players.filter(p => p.isAlive && p.faction === 'village').length;
  if (aliveWerewolves === 0) return 'village';
  if (aliveWerewolves >= aliveVillagers) return 'werewolf';
  return null;
}

export function getAliveCounts(players: Player[]) {
  return {
    werewolves: players.filter(p => p.isAlive && p.faction === 'werewolf').length,
    villagers: players.filter(p => p.isAlive && p.faction === 'village').length,
  };
}

export function generateAvatar(index: number): string {
  const avatars = ['🧙','🗡️','🛡️','🏹','⚔️','🦉','🌙','🔮','⚡','🌲','🐺','👁️','🔥','❄️','🦇'];
  return avatars[index % avatars.length];
}

export function aiNightAction(player: Player, players: Player[], difficulty: AiDifficulty): string | null {
  const aliveOthers = players.filter(p => p.id !== player.id && p.isAlive);
  if (aliveOthers.length === 0) return null;

  if (player.role === 'werewolf') {
    // Target villagers, avoid other werewolves
    const villagers = aliveOthers.filter(p => p.faction === 'village');
    if (villagers.length === 0) return aliveOthers[Math.floor(Math.random() * aliveOthers.length)].id;

    if (difficulty === 'easy') {
      return villagers[Math.floor(Math.random() * villagers.length)].id;
    } else if (difficulty === 'medium') {
      // Prefer seer if known or suspected
      const seerSuspects = villagers.filter(p => p.role === 'seer');
      if (seerSuspects.length > 0 && Math.random() < 0.5) {
        return seerSuspects[Math.floor(Math.random() * seerSuspects.length)].id;
      }
      return villagers[Math.floor(Math.random() * villagers.length)].id;
    } else {
      // Hard: always target seer first, then random villager
      const seers = villagers.filter(p => p.role === 'seer');
      if (seers.length > 0) return seers[0].id;
      return villagers[Math.floor(Math.random() * villagers.length)].id;
    }
  }

  if (player.role === 'seer') {
    // Check suspicious players (non-villagers or random if easy)
    const unchecked = aliveOthers.filter(p => p.id !== player.id);
    if (unchecked.length === 0) return null;

    if (difficulty === 'hard') {
      // Prefer checking players who talk a lot (simulated by position)
      return unchecked[Math.floor(Math.random() * Math.min(3, unchecked.length))].id;
    }
    return unchecked[Math.floor(Math.random() * unchecked.length)].id;
  }

  return null; // Villager has no night action
}

export function aiDayVote(player: Player, players: Player[], logs: string[], difficulty: AiDifficulty): string {
  const aliveOthers = players.filter(p => p.id !== player.id && p.isAlive);
  if (aliveOthers.length === 0) return '';

  if (player.role === 'werewolf') {
    // Vote for villagers, defend werewolves
    const villagers = aliveOthers.filter(p => p.faction === 'village');
    if (villagers.length === 0) return aliveOthers[0].id;

    if (difficulty === 'hard') {
      // Try to vote for confirmed or suspected seer
      const seerTargets = villagers.filter(p => p.role === 'seer');
      if (seerTargets.length > 0) return seerTargets[0].id;
    }
    return villagers[Math.floor(Math.random() * villagers.length)].id;
  }

  // Villager or Seer: try to vote for werewolves
  if (difficulty === 'hard' && player.role === 'seer') {
    // Seer has info from night checks - vote for werewolf if found
    const suspectedWerewolves = aliveOthers.filter(p => p.faction === 'werewolf');
    if (suspectedWerewolves.length > 0) return suspectedWerewolves[0].id;
  }

  // Random vote with some suspicion logic
  const werewolves = aliveOthers.filter(p => p.faction === 'werewolf');
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
