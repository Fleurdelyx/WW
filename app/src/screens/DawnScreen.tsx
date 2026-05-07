import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Sun, Skull, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DawnScreen() {
  const { state, startDay } = useGameStore();
  const { lastKilled, round, seerCheckResult, humanPlayerId } = state;
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCanContinue(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const human = state.players.find(p => p.id === humanPlayerId);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Day transition gradient */}
      <motion.div
        className="absolute inset-0"
        initial={{ background: 'linear-gradient(to bottom, #0a0a1a, #12102a)' }}
        animate={{ background: 'linear-gradient(to bottom, #1a1525, #2a2035)' }}
        transition={{ duration: 2 }}
      />
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,168,67,0.15)_0%,_transparent_60%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <Sun className="w-12 h-12 text-accent-gold mx-auto mb-4" />
          <h2 className="font-cinzel text-4xl text-accent-gold mb-2">Dawn Breaks</h2>
          <p className="text-text-secondary">Day {round} begins</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {lastKilled ? (
            <motion.div
              key="death"
              className="mt-10 text-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: 'spring', stiffness: 100 }}
            >
              <motion.div
                className="w-24 h-24 mx-auto mb-4 rounded-full bg-werewolf-red/20 border-2 border-werewolf-red flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Skull className="w-12 h-12 text-werewolf-red" />
              </motion.div>
              <h3 className="text-2xl font-bold text-werewolf-red mb-1">{lastKilled.name} is dead</h3>
              <p className="text-text-secondary">They were a <span className="text-accent-gold font-semibold">{lastKilled.role.charAt(0).toUpperCase() + lastKilled.role.slice(1)}</span></p>
              <p className="text-text-muted text-sm mt-2 max-w-sm">{lastKilled.faction === 'werewolf' ? 'A werewolf has fallen...' : 'An innocent life lost...'}</p>
            </motion.div>
          ) : (
            <motion.div
              key="peace"
              className="mt-10 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-accent-blue/20 border-2 border-accent-blue flex items-center justify-center">
                <Heart className="w-12 h-12 text-accent-blue" />
              </div>
              <h3 className="text-xl text-accent-blue mb-1">The Night Was Peaceful</h3>
              <p className="text-text-secondary">No one died this night.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Seer result */}
        {seerCheckResult && human?.role === 'seer' && (
          <motion.div
            className="mt-6 bg-bg-secondary/80 border border-accent-purple/40 rounded-lg p-4 max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
          >
            <p className="text-accent-purple font-medium mb-1">Your Vision Reveals:</p>
            <p className="text-text-primary">
              <span className="font-semibold">{state.players.find(p => p.id === seerCheckResult.playerId)?.name}</span> is{' '}
              <span className={seerCheckResult.faction === 'werewolf' ? 'text-werewolf-red font-bold' : 'text-villager-blue font-bold'}>
                {seerCheckResult.faction === 'werewolf' ? 'a WEREWOLF!' : 'a Villager'}
              </span>
            </p>
          </motion.div>
        )}

        {/* Continue */}
        {canContinue && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={startDay}
            className="mt-10 bg-accent-gold hover:bg-accent-gold/90 text-[#1A1833] font-bold py-3 px-10 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(212,168,67,0.4)]"
          >
            Continue to Day
          </motion.button>
        )}
      </div>
    </div>
  );
}
