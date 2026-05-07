import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Skull, AlertTriangle, Vote } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ExecutionScreen() {
  const { state, nextRound, startNight } = useGameStore();
  const { executionResult, players, round } = state;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!executionResult) return null;

  const { eliminated, voteCounts, wasTie, noVotes } = executionResult;

  const handleContinue = () => {
    nextRound();
    setTimeout(() => startNight(), 100);
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4">
      <motion.div className="text-center max-w-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <Vote className="w-10 h-10 text-accent-gold mx-auto mb-4" />
        </motion.div>
        <h2 className="font-cinzel text-3xl text-accent-gold mb-6">The Verdict</h2>

        {/* Vote tally */}
        <div className="space-y-2 mb-8">
          {Object.entries(voteCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([playerId, count], i) => {
              const player = players.find(p => p.id === playerId);
              if (!player || count === 0) return null;
              return (
                <motion.div
                  key={playerId}
                  className="flex items-center justify-between bg-bg-secondary/60 border border-accent-purple/20 rounded-lg px-4 py-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{player.isAlive ? player.avatar : <Skull className="w-5 h-5 text-dead-gray" />}</span>
                    <span className="text-text-primary text-sm">{player.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(count)].map((_, j) => (
                      <motion.div
                        key={j}
                        className="w-2 h-2 rounded-full bg-accent-gold"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + j * 0.1 }}
                      />
                    ))}
                    <span className="text-accent-gold font-mono text-sm ml-1">{count}</span>
                  </div>
                </motion.div>
              );
            })}
        </div>

        {/* Result */}
        {revealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            {eliminated ? (
              <div className="mb-8">
                <motion.div
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-werewolf-red/20 border-2 border-werewolf-red flex items-center justify-center"
                  animate={{ rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Skull className="w-10 h-10 text-werewolf-red" />
                </motion.div>
                <h3 className="text-2xl font-bold text-werewolf-red mb-1">
                  {eliminated.name} has been eliminated!
                </h3>
                <p className="text-text-secondary">
                  They were a{' '}
                  <span className={`font-bold ${
                    eliminated.role === 'werewolf' ? 'text-werewolf-red' :
                    eliminated.role === 'seer' ? 'text-accent-purple' : 'text-villager-blue'
                  }`}>
                    {eliminated.role.charAt(0).toUpperCase() + eliminated.role.slice(1)}
                  </span>
                </p>
              </div>
            ) : wasTie ? (
              <div className="mb-8 flex flex-col items-center">
                <AlertTriangle className="w-10 h-10 text-accent-gold mb-2" />
                <h3 className="text-xl text-accent-gold mb-1">The vote was tied</h3>
                <p className="text-text-secondary">No one was eliminated.</p>
              </div>
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={handleContinue}
              className="bg-accent-gold hover:bg-accent-gold/90 text-[#1A1833] font-bold py-3 px-10 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(212,168,67,0.4)]"
            >
              Continue to Night {round + 1}
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
