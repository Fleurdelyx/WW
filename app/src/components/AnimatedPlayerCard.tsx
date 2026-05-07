import { motion } from 'framer-motion';
import type { Player } from '@/types/game';
import PlayerAvatar from './PlayerAvatar';
import { Skull, Vote, ShieldCheck } from 'lucide-react';

interface AnimatedPlayerCardProps {
  player: Player;
  isSelected?: boolean;
  isTargeted?: boolean;
  isProtected?: boolean;
  onClick?: () => void;
  voteCount?: number;
  index?: number;
  disabled?: boolean;
}

export default function AnimatedPlayerCard({
  player,
  isSelected = false,
  isTargeted = false,
  isProtected = false,
  onClick,
  voteCount = 0,
  index = 0,
  disabled = false,
}: AnimatedPlayerCardProps) {
  return (
    <motion.button
      onClick={onClick}
      layout
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{
        opacity: player.isAlive ? 1 : 0.5,
        scale: 1,
        y: 0,
        rotate: isSelected ? [0, -2, 2, 0] : 0,
      }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
      whileHover={player.isAlive && !disabled ? { scale: 1.08, y: -4 } : {}}
      whileTap={player.isAlive && !disabled ? { scale: 0.92 } : {}}
      transition={{
        delay: index * 0.05,
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className={`relative p-3 rounded-xl border-2 text-center transition-colors ${
        !player.isAlive
          ? 'border-dead-gray/30 bg-dead-gray/10'
          : isSelected
          ? 'border-accent-gold bg-accent-gold/20 shadow-[0_0_25px_rgba(212,168,67,0.4)]'
          : isTargeted
          ? 'border-werewolf-red bg-werewolf-red/20 shadow-[0_0_25px_rgba(139,58,58,0.4)]'
          : isProtected
          ? 'border-emerald-400 bg-emerald-400/10 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
          : 'border-accent-purple/20 bg-bg-secondary/60 hover:border-accent-purple/50 hover:shadow-[0_0_15px_rgba(123,109,141,0.2)]'
      }`}
      disabled={!player.isAlive || disabled}
    >
      {/* Selection glow pulse */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-accent-gold"
          animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Targeted red pulse */}
      {isTargeted && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-werewolf-red"
          animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {/* Protected shield */}
      {isProtected && (
        <motion.div
          className="absolute -top-1 -right-1 z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </motion.div>
      )}

      <div className="flex justify-center mb-1 relative">
        {player.isAlive ? (
          <motion.div
            animate={isSelected ? { y: [0, -3, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <PlayerAvatar avatar={player.avatar} size="md" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -10, 10, -5, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Skull className="w-8 h-8 text-dead-gray" />
          </motion.div>
        )}

        {/* Vote badges */}
        {voteCount > 0 && (
          <motion.div
            className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-accent-gold text-[#1A1833] text-xs font-bold rounded-full flex items-center justify-center px-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            {voteCount}
          </motion.div>
        )}
      </div>

      <div className={`text-xs font-medium truncate ${player.isAlive ? 'text-text-primary' : 'text-text-muted line-through'}`}>
        {player.name}
      </div>

      {!player.isAlive && (
        <motion.div
          className="text-[10px] text-dead-gray mt-0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          eliminated
        </motion.div>
      )}

      {voteCount > 0 && (
        <motion.div
          className="flex justify-center gap-0.5 mt-1"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {[...Array(Math.min(voteCount, 5))].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, x: -10 }}
              animate={{ scale: 1, x: 0 }}
              transition={{ delay: i * 0.1, type: 'spring' }}
            >
              <Vote className="w-3 h-3 text-accent-gold" />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.button>
  );
}
