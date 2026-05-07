import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Sun, Skull, Heart, Users, Wind, Droplets } from 'lucide-react';
import { useState, useEffect } from 'react';
import PlayerAvatar from '@/components/PlayerAvatar';
import ParticleBackground, { BloodSplatter, FogLayer } from '@/components/ParticleBackground';

export default function DawnScreen() {
  const { state, setDawnReady, startDay } = useGameStore();
  const { lastKilled, round, seerCheckResult, humanPlayerId, players, dawnReady, mode } = state;
  const [canContinue, setCanContinue] = useState(false);
  const [showBlood, setShowBlood] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCanContinue(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (lastKilled) {
      const t = setTimeout(() => setShowBlood(true), 800);
      return () => clearTimeout(t);
    }
  }, [lastKilled]);

  const human = state.players.find(p => p.id === humanPlayerId);
  const isOnline = mode === 'online';

  const alivePlayers = players.filter(p => p.isAlive);
  const readyCount = Object.keys(dawnReady).length;
  const allReady = alivePlayers.every(p => dawnReady[p.id]);

  const handleContinue = () => {
    if (isOnline) {
      startDay();
    } else {
      setDawnReady();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <motion.div
        className="absolute inset-0"
        animate={{ background: ['linear-gradient(to bottom, #0a0a1a, #12102a)', 'linear-gradient(to bottom, #1a1525, #2a2035)', 'linear-gradient(to bottom, #0a0a1a, #12102a)'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{ background: 'radial-gradient(ellipse at top, rgba(212,168,67,0.2) 0%, transparent 60%)' }}
      />
      <FogLayer />
      <ParticleBackground count={25} color="rgba(212,168,67,0.15)" />
      <BloodSplatter active={showBlood} />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Sun rise animation */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, type: 'spring' }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          >
            <Sun className="w-16 h-16 text-accent-gold mx-auto mb-4" />
          </motion.div>
          <motion.h2
            className="font-cinzel text-5xl text-accent-gold mb-2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            Dawn Breaks
          </motion.h2>
          <motion.p
            className="text-text-secondary text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Day {round} begins
          </motion.p>
        </motion.div>

        <AnimatePresence mode="wait">
          {lastKilled ? (
            <motion.div
              key="death"
              className="mt-12 text-center"
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.3 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
            >
              <motion.div
                className="w-32 h-32 mx-auto mb-6 rounded-full bg-werewolf-red/20 border-4 border-werewolf-red flex items-center justify-center relative"
                animate={{ scale: [1, 1.15, 1], boxShadow: ['0 0 0px rgba(139,58,58,0)', '0 0 40px rgba(139,58,58,0.6)', '0 0 0px rgba(139,58,58,0)'] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  <Skull className="w-16 h-16 text-werewolf-red" />
                </motion.div>
              </motion.div>

              <motion.h3
                className="text-3xl font-bold text-werewolf-red mb-2"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
              >
                {lastKilled.name} is dead
              </motion.h3>

              <motion.div
                className="flex items-center justify-center gap-3 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <PlayerAvatar avatar={lastKilled.avatar} size="lg" isDead />
                <div className="text-left">
                  <p className="text-text-secondary">
                    They were a <span className="text-accent-gold font-semibold">{lastKilled.role.charAt(0).toUpperCase() + lastKilled.role.slice(1)}</span>
                  </p>
                  <p className="text-text-muted text-sm">{lastKilled.faction === 'werewolf' ? 'A werewolf has fallen...' : 'An innocent life lost...'}</p>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="peace"
              className="mt-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="w-32 h-32 mx-auto mb-6 rounded-full bg-accent-blue/20 border-4 border-accent-blue flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1], boxShadow: ['0 0 0px rgba(96,165,250,0)', '0 0 30px rgba(96,165,250,0.4)', '0 0 0px rgba(96,165,250,0)'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Heart className="w-16 h-16 text-accent-blue" />
                </motion.div>
              </motion.div>
              <motion.h3
                className="text-2xl text-accent-blue mb-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                The Night Was Peaceful
              </motion.h3>
              <p className="text-text-secondary">No one died this night.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Seer result */}
        <AnimatePresence>
          {seerCheckResult && human?.role === 'seer' && (
            <motion.div
              className="mt-8 bg-bg-secondary/80 border-2 border-accent-purple/50 rounded-xl p-5 max-w-sm backdrop-blur-sm"
              initial={{ opacity: 0, y: 30, rotateX: -20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 1.5, type: 'spring' }}
            >
              <motion.p
                className="text-accent-purple font-medium mb-2 flex items-center gap-2"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Wind className="w-4 h-4" /> Your Vision Reveals:
              </motion.p>
              <p className="text-text-primary text-lg">
                <span className="font-bold">{state.players.find(p => p.id === seerCheckResult.playerId)?.name}</span> is{' '}
                <motion.span
                  className={seerCheckResult.faction === 'werewolf' ? 'text-werewolf-red font-bold' : 'text-villager-blue font-bold'}
                  animate={seerCheckResult.faction === 'werewolf' ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {seerCheckResult.faction === 'werewolf' ? 'a WEREWOLF!' : 'a Villager'}
                </motion.span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ready status */}
        {!isOnline && (
          <motion.div
            className="mt-8 flex items-center gap-3 text-text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <div className="flex -space-x-2">
              {alivePlayers.slice(0, 5).map((p, i) => (
                <motion.div
                  key={p.id}
                  className={`w-6 h-6 rounded-full border-2 border-bg-primary flex items-center justify-center ${dawnReady[p.id] ? 'bg-emerald-500' : 'bg-bg-elevated'}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.5 + i * 0.1 }}
                >
                  {dawnReady[p.id] && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                    >
                      <Droplets className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
            <span className="text-sm">{readyCount} / {alivePlayers.length} ready</span>
          </motion.div>
        )}

        {/* Continue button */}
        <AnimatePresence>
          {canContinue && !allReady && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(212,168,67,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleContinue}
              className="mt-8 bg-accent-gold hover:bg-accent-gold/90 text-[#1A1833] font-bold py-4 px-12 rounded-xl transition-all text-lg"
            >
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Continue to Day →
              </motion.span>
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {allReady && (
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 text-accent-gold text-lg font-medium"
            >
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                Everyone is ready...
              </motion.span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
