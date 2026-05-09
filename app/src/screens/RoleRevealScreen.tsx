import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { getRoleDescription, getTrueFaction } from '@/engine/gameEngine';
import { ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import RoleCard from '@/components/RoleCard';
import SpinningWheel from '@/components/SpinningWheel';
import ParticleBackground from '@/components/ParticleBackground';

type RevealPhase = 'wheel' | 'revealing' | 'card';

export default function RoleRevealScreen() {
  const { state, startNight, playerReady } = useGameStore();
  const humanPlayer = state.players.find(p => p.id === state.humanPlayerId);
  const [phase, setPhase] = useState<RevealPhase>('wheel');
  const [showContinue, setShowContinue] = useState(false);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (phase === 'revealing') {
      const t = setTimeout(() => setPhase('card'), 500);
      return () => clearTimeout(t);
    }
    if (phase === 'card') {
      const t = setTimeout(() => setShowContinue(true), 1200);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleContinue = () => {
    if (state.mode === 'online') {
      playerReady();
      setWaiting(true);
    } else {
      startNight();
    }
  };

  const handleWheelComplete = () => {
    setPhase('revealing');
  };

  if (!humanPlayer) return null;

  const isEvil = getTrueFaction(humanPlayer.role) === 'werewolf';

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <motion.div
        className="absolute inset-0"
        animate={{
          background: isEvil
            ? ['radial-gradient(circle at 50% 50%, rgba(139,58,58,0.15) 0%, transparent 60%)', 'radial-gradient(circle at 50% 50%, rgba(139,58,58,0.25) 0%, transparent 70%)', 'radial-gradient(circle at 50% 50%, rgba(139,58,58,0.15) 0%, transparent 60%)']
            : ['radial-gradient(circle at 50% 50%, rgba(96,165,250,0.1) 0%, transparent 60%)', 'radial-gradient(circle at 50% 50%, rgba(96,165,250,0.2) 0%, transparent 70%)', 'radial-gradient(circle at 50% 50%, rgba(96,165,250,0.1) 0%, transparent 60%)']
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <ParticleBackground count={20} color={isEvil ? 'rgba(139,58,58,0.2)' : 'rgba(96,165,250,0.15)'} />

      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="font-cinzel text-3xl text-accent-gold drop-shadow-[0_0_20px_rgba(212,168,67,0.4)]">
          Your Role
        </h2>
        <motion.p
          className="text-text-muted mt-1"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {phase === 'wheel' ? 'Spin the wheel to reveal your fate...' : phase === 'revealing' ? 'The wheel decides...' : 'Your destiny is sealed'}
        </motion.p>
      </motion.div>

      <div className="relative flex items-center justify-center min-h-[420px]">
        <AnimatePresence mode="wait">
          {phase === 'wheel' && (
            <motion.div
              key="wheel"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
              transition={{ duration: 0.5 }}
            >
              <SpinningWheel
                targetRole={humanPlayer.role}
                onComplete={handleWheelComplete}
                spinning={false}
              />
            </motion.div>
          )}

          {(phase === 'revealing' || phase === 'card') && (
            <motion.div
              key="card"
              className="flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
            >
              <RoleCard role={humanPlayer.role} size="lg" revealed />

              <motion.div
                className="mt-6 text-center max-w-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.p
                  className="text-text-secondary text-sm leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {getRoleDescription(humanPlayer.role)}
                </motion.p>

                {isEvil && (
                  <motion.div
                    className="mt-3 text-werewolf-red text-xs font-bold tracking-widest uppercase"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Deceive the village. Eliminate them all.
                  </motion.div>
                )}
                {!isEvil && humanPlayer.role !== 'villager' && (
                  <motion.div
                    className="mt-3 text-accent-gold text-xs font-bold tracking-widest uppercase"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Use your power wisely. Save the village.
                  </motion.div>
                )}
                {humanPlayer.role === 'villager' && (
                  <motion.div
                    className="mt-3 text-blue-400 text-xs font-bold tracking-widest uppercase"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Trust no one. Find the wolves.
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showContinue && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(212,168,67,0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleContinue}
            className="mt-8 bg-accent-gold hover:bg-accent-gold/90 text-[#1A1833] font-bold py-4 px-12 rounded-xl transition-all text-lg flex items-center gap-2"
          >
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Continue to Night {state.round}
            </motion.span>
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Waiting overlay */}
      {waiting && (
        <motion.div
          className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm flex flex-col items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-12 h-12 border-4 border-accent-purple/30 border-t-accent-gold rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.p
            className="mt-4 text-accent-gold font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Waiting for other players...
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}
