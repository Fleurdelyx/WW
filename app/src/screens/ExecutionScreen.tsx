import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Skull, AlertTriangle, Vote, Swords, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import PlayerAvatar from '@/components/PlayerAvatar';
import RoleCard from '@/components/RoleCard';
import ParticleBackground, { BloodSplatter, LightningFlash } from '@/components/ParticleBackground';

export default function ExecutionScreen() {
  const { state, nextRound, startNight } = useGameStore();
  const { executionResult, players, round } = state;
  const [revealed, setRevealed] = useState(false);
  const [flash, setFlash] = useState(false);
  const [showBlood, setShowBlood] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (revealed && executionResult?.eliminated) {
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
      setTimeout(() => setShowBlood(true), 200);
    }
  }, [revealed, executionResult?.eliminated]);

  if (!executionResult) return null;

  const { eliminated, voteCounts, wasTie, noVotes } = executionResult;

  const handleContinue = () => {
    nextRound();
    setTimeout(() => startNight(), 100);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'werewolf': return 'text-werewolf-red';
      case 'seer': return 'text-accent-purple';
      case 'bodyguard': return 'text-accent-blue';
      case 'hunter': return 'text-orange-400';
      case 'witch': return 'text-emerald-400';
      default: return 'text-villager-blue';
    }
  };

  const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
  const maxVotes = Math.max(...Object.values(voteCounts));

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <ParticleBackground count={30} color="rgba(139,58,58,0.1)" />
      <LightningFlash trigger={flash} />
      <BloodSplatter active={showBlood} />

      <motion.div className="text-center max-w-lg relative z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Swords className="w-12 h-12 text-accent-gold mx-auto mb-4" />
          </motion.div>
        </motion.div>

        <motion.h2
          className="font-cinzel text-4xl text-accent-gold mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          The Verdict
        </motion.h2>

        {/* Vote tally */}
        <div className="space-y-3 mb-8">
          <AnimatePresence>
            {sortedVotes.map(([playerId, count], i) => {
              const player = players.find(p => p.id === playerId);
              if (!player || count === 0) return null;
              return (
                <motion.div
                  key={playerId}
                  className="flex items-center justify-between bg-bg-secondary/60 border border-accent-purple/20 rounded-xl px-4 py-3 backdrop-blur-sm"
                  initial={{ opacity: 0, x: -50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ delay: i * 0.2, type: 'spring', stiffness: 200 }}
                >
                  <div className="flex items-center gap-3">
                    {player.isAlive ? (
                      <motion.div whileHover={{ scale: 1.2, rotate: 10 }}>
                        <PlayerAvatar avatar={player.avatar} size="sm" />
                      </motion.div>
                    ) : (
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <Skull className="w-5 h-5 text-dead-gray" />
                      </motion.div>
                    )}
                    <span className="text-text-primary text-sm font-medium">{player.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AnimatePresence>
                      {[...Array(count)].map((_, j) => (
                        <motion.div
                          key={j}
                          initial={{ scale: 0, x: -20, opacity: 0 }}
                          animate={{ scale: 1, x: 0, opacity: 1 }}
                          transition={{ delay: 0.5 + i * 0.2 + j * 0.1, type: 'spring', stiffness: 400 }}
                        >
                          <Vote className="w-4 h-4 text-accent-gold" />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <motion.span
                      className="text-accent-gold font-mono text-sm ml-1 font-bold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.2 + count * 0.1, type: 'spring' }}
                    >
                      {count}
                    </motion.span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Result */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
              {eliminated ? (
                <motion.div className="mb-8 flex flex-col items-center">
                  <motion.div
                    className="w-24 h-24 mx-auto mb-4 rounded-full bg-werewolf-red/20 border-4 border-werewolf-red flex items-center justify-center"
                    animate={{
                      scale: [1, 1.2, 1],
                      boxShadow: ['0 0 0px rgba(139,58,58,0)', '0 0 50px rgba(139,58,58,0.6)', '0 0 0px rgba(139,58,58,0)'],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <motion.div
                      initial={{ rotate: 0 }}
                      animate={{ rotate: [0, -20, 20, -10, 10, 0] }}
                      transition={{ duration: 0.8 }}
                    >
                      <Skull className="w-12 h-12 text-werewolf-red" />
                    </motion.div>
                  </motion.div>
                  <motion.h3
                    className="text-3xl font-bold text-werewolf-red mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {eliminated.name} has been eliminated!
                  </motion.h3>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                  >
                    <RoleCard role={eliminated.role} size="sm" animate />
                  </motion.div>
                </motion.div>
              ) : wasTie ? (
                <motion.div className="mb-8 flex flex-col items-center">
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <AlertTriangle className="w-12 h-12 text-accent-gold mb-2" />
                  </motion.div>
                  <h3 className="text-2xl text-accent-gold mb-1">The vote was tied</h3>
                  <p className="text-text-secondary">No one was eliminated.</p>
                </motion.div>
              ) : noVotes ? (
                <div className="mb-8">
                  <p className="text-text-secondary">No votes were cast.</p>
                </div>
              ) : (
                <div className="mb-8">
                  <p className="text-text-secondary">No one was eliminated.</p>
                </div>
              )}

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(212,168,67,0.5)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleContinue}
                className="bg-accent-gold hover:bg-accent-gold/90 text-[#1A1833] font-bold py-4 px-12 rounded-xl transition-all text-lg"
              >
                <motion.span
                  className="flex items-center gap-2"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5" />
                  Continue to Night {round + 1}
                </motion.span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
