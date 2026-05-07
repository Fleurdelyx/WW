import { motion } from 'framer-motion';
import type { Role } from '@/types/game';
import { Shield, Eye, Skull, Sword, Crosshair, FlaskConical, Sparkles, Crown, Wand2, VenetianMask } from 'lucide-react';

interface RoleCardProps {
  role: Role;
  size?: 'sm' | 'md' | 'lg';
  revealed?: boolean;
  animate?: boolean;
}

const roleConfig: Record<string, {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  border: string;
  text: string;
  accent: string;
  faction: string;
  factionColor: string;
  pattern: string;
}> = {
  villager: {
    name: 'Villager',
    icon: Shield,
    gradient: 'from-blue-900/80 via-blue-800/60 to-slate-900/80',
    border: 'border-blue-400/40',
    text: 'text-blue-300',
    accent: 'bg-blue-400',
    faction: 'Village',
    factionColor: 'text-blue-400',
    pattern: 'radial-gradient(circle at 30% 30%, rgba(96,165,250,0.15) 0%, transparent 50%)',
  },
  werewolf: {
    name: 'Werewolf',
    icon: Skull,
    gradient: 'from-red-950/90 via-red-900/70 to-red-950/90',
    border: 'border-red-500/50',
    text: 'text-red-400',
    accent: 'bg-red-500',
    faction: 'Werewolf',
    factionColor: 'text-red-400',
    pattern: 'radial-gradient(circle at 70% 30%, rgba(239,68,68,0.2) 0%, transparent 50%)',
  },
  seer: {
    name: 'Seer',
    icon: Eye,
    gradient: 'from-purple-900/80 via-purple-800/60 to-slate-900/80',
    border: 'border-purple-400/50',
    text: 'text-purple-300',
    accent: 'bg-purple-400',
    faction: 'Village',
    factionColor: 'text-purple-400',
    pattern: 'radial-gradient(circle at 50% 20%, rgba(168,85,247,0.2) 0%, transparent 50%)',
  },
  bodyguard: {
    name: 'Bodyguard',
    icon: Sword,
    gradient: 'from-cyan-900/80 via-cyan-800/60 to-slate-900/80',
    border: 'border-cyan-400/50',
    text: 'text-cyan-300',
    accent: 'bg-cyan-400',
    faction: 'Village',
    factionColor: 'text-cyan-400',
    pattern: 'radial-gradient(circle at 20% 70%, rgba(34,211,238,0.15) 0%, transparent 50%)',
  },
  hunter: {
    name: 'Hunter',
    icon: Crosshair,
    gradient: 'from-orange-900/80 via-orange-800/60 to-slate-900/80',
    border: 'border-orange-400/50',
    text: 'text-orange-300',
    accent: 'bg-orange-400',
    faction: 'Village',
    factionColor: 'text-orange-400',
    pattern: 'radial-gradient(circle at 80% 60%, rgba(251,146,60,0.15) 0%, transparent 50%)',
  },
  witch: {
    name: 'Witch',
    icon: FlaskConical,
    gradient: 'from-emerald-900/80 via-emerald-800/60 to-slate-900/80',
    border: 'border-emerald-400/50',
    text: 'text-emerald-300',
    accent: 'bg-emerald-400',
    faction: 'Village',
    factionColor: 'text-emerald-400',
    pattern: 'radial-gradient(circle at 50% 80%, rgba(52,211,153,0.2) 0%, transparent 50%)',
  },
  alphaWolf: {
    name: 'Alpha Wolf',
    icon: Crown,
    gradient: 'from-red-950/90 via-red-900/70 to-red-950/90',
    border: 'border-red-500/50',
    text: 'text-red-400',
    accent: 'bg-red-500',
    faction: 'Werewolf',
    factionColor: 'text-red-400',
    pattern: 'radial-gradient(circle at 40% 40%, rgba(239,68,68,0.25) 0%, transparent 50%)',
  },
  sorcerer: {
    name: 'Sorcerer',
    icon: Wand2,
    gradient: 'from-indigo-950/90 via-purple-900/70 to-slate-900/80',
    border: 'border-indigo-400/50',
    text: 'text-indigo-300',
    accent: 'bg-indigo-400',
    faction: 'Werewolf',
    factionColor: 'text-indigo-400',
    pattern: 'radial-gradient(circle at 60% 40%, rgba(129,140,248,0.2) 0%, transparent 50%)',
  },
  minion: {
    name: 'Minion',
    icon: VenetianMask,
    gradient: 'from-rose-950/90 via-pink-900/70 to-slate-900/80',
    border: 'border-pink-400/50',
    text: 'text-pink-300',
    accent: 'bg-pink-400',
    faction: 'Werewolf',
    factionColor: 'text-pink-400',
    pattern: 'radial-gradient(circle at 30% 60%, rgba(244,114,182,0.2) 0%, transparent 50%)',
  },
  unknown: {
    name: 'Unknown',
    icon: Sparkles,
    gradient: 'from-slate-800/80 via-slate-700/60 to-slate-900/80',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    accent: 'bg-slate-500',
    faction: 'Hidden',
    factionColor: 'text-slate-400',
    pattern: 'none',
  },
};

export default function RoleCard({ role, size = 'md', revealed = true, animate = true }: RoleCardProps) {
  const config = roleConfig[role] || roleConfig.unknown;
  const Icon = config.icon;

  const sizeClasses = {
    sm: { card: 'w-40 h-56', icon: 'w-10 h-10', title: 'text-lg', faction: 'text-[10px]', padding: 'p-3' },
    md: { card: 'w-56 h-80', icon: 'w-16 h-16', title: 'text-2xl', faction: 'text-xs', padding: 'p-5' },
    lg: { card: 'w-72 h-96', icon: 'w-20 h-20', title: 'text-3xl', faction: 'text-sm', padding: 'p-6' },
  };

  const s = sizeClasses[size];

  return (
    <motion.div
      className={`relative ${s.card} rounded-2xl border-2 ${config.border} backdrop-blur-sm overflow-hidden`}
      style={{ background: 'rgba(15, 14, 26, 0.9)' }}
      initial={animate ? { rotateY: 90, opacity: 0 } : false}
      animate={animate ? { rotateY: revealed ? 0 : 90, opacity: revealed ? 1 : 0 } : false}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />

      {/* Pattern overlay */}
      <div className="absolute inset-0" style={{ background: config.pattern }} />

      {/* Decorative corner ornaments */}
      <div className={`absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 ${config.border} rounded-tl-lg opacity-60`} />
      <div className={`absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 ${config.border} rounded-tr-lg opacity-60`} />
      <div className={`absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 ${config.border} rounded-bl-lg opacity-60`} />
      <div className={`absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 ${config.border} rounded-br-lg opacity-60`} />

      {/* Center line decoration */}
      <div className={`absolute top-1/2 left-0 right-0 h-px ${config.accent} opacity-20`} />

      {/* Content */}
      <div className={`relative z-10 ${s.padding} flex flex-col items-center justify-between h-full`}>
        {/* Top faction badge */}
        <motion.div
          className={`px-3 py-1 rounded-full border ${config.border} ${config.factionColor} ${s.faction} font-bold tracking-widest uppercase bg-black/30`}
          initial={animate ? { scale: 0 } : false}
          animate={animate ? { scale: 1 } : false}
          transition={{ delay: 0.4, type: 'spring' }}
        >
          {config.faction}
        </motion.div>

        {/* Icon */}
        <motion.div
          className={`relative ${config.text}`}
          initial={animate ? { scale: 0, rotate: -180 } : false}
          animate={animate ? { scale: 1, rotate: 0 } : false}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <motion.div
            className={`${s.icon}`}
            animate={animate ? { y: [0, -5, 0] } : false}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon className="w-full h-full" />
          </motion.div>
          {/* Glow behind icon */}
          <div className={`absolute inset-0 ${config.accent} opacity-20 blur-2xl rounded-full`} />
        </motion.div>

        {/* Role name */}
        <motion.div
          className="text-center"
          initial={animate ? { y: 20, opacity: 0 } : false}
          animate={animate ? { y: 0, opacity: 1 } : false}
          transition={{ delay: 0.5 }}
        >
          <h3 className={`font-cinzel font-bold ${config.text} ${s.title} tracking-wider`}>
            {config.name.toUpperCase()}
          </h3>
          {(role === 'werewolf' || role === 'alphaWolf' || role === 'sorcerer' || role === 'minion') && (
            <motion.p
              className="text-red-400/60 text-xs mt-1 tracking-widest uppercase"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {role === 'alphaWolf' ? 'Command · Kill · Dominate' : role === 'sorcerer' ? 'Seek · Spy · Serve' : role === 'minion' ? 'Deceive · Aid · Survive' : 'Deceive · Kill · Survive'}
            </motion.p>
          )}
          {(role === 'villager' || role === 'seer' || role === 'bodyguard' || role === 'hunter' || role === 'witch') && (
            <motion.p
              className={`${config.factionColor} opacity-60 text-xs mt-1 tracking-widest uppercase`}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Protect · Survive · Win
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Bottom decorative bar */}
      <motion.div
        className={`absolute bottom-0 left-0 right-0 h-1 ${config.accent}`}
        initial={animate ? { scaleX: 0 } : false}
        animate={animate ? { scaleX: 1 } : false}
        transition={{ delay: 0.6, duration: 0.5 }}
        style={{ transformOrigin: 'left' }}
      />
    </motion.div>
  );
}
