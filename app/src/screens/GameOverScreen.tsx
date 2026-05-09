import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Trophy, Skull, RotateCcw, Home, LogOut, Crown, Star, Sparkles } from 'lucide-react';
import PlayerAvatar from '@/components/PlayerAvatar';
import RoleCard from '@/components/RoleCard';
import ParticleBackground from '@/components/ParticleBackground';
import { useEffect, useState } from 'react';

function VictoryParticle({ delay }: { delay: number }) {
  const x = Math.random() * 200 - 100;
  const y = Math.random() * -300 - 50;
  const colors = ['#d4a843', '#60a5fa', '#34d399', '#f472b6', '#a78bfa'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{ backgroundColor: color, left: '50%', top: '50%' }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
      animate={{
        x: [0, x * 0.5, x],
        y: [0, y * 0.5, y],
        opacity: [1, 1, 0],
        scale: [0, 1.5, 0.5],
        rotate: [0, 180, 360],
      }}
      transition={{ duration: 2.5, delay, ease: 'easeOut' }}
    />
  );
}

export default function GameOverScreen() {
  const { state, resetGame, createGame, leaveRoom, playerReady } = useGameStore();
  const { winner, players, humanPlayerId, round, mode } = state;
  const human = players.find(p => p.id === humanPlayerId);

  const humanWon = human ? human.faction === winner : false;
  const villageWon = winner === 'village';
  const isOnline = mode === 'online';

  const [showConfetti, setShowConfetti] = useState(false);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(true), 500);
    return () => clearTimeout(t);
  }, []);

  const handlePlayAgain = () => {
    if (isOnline) {
      playerReady();
      setWaiting(true);
    } else {
      createGame();
    }
  };

  const handleMainMenu = () => {
    if (isOnline) {
      leaveRoom();
    } else {
      resetGame();
    }
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

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Victory celebration background */}
      {villageWon && humanWon && (
        <>
          <ParticleBackground count={50} color="rgba(212,168,67,0.2)" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {showConfetti && Array.from({ length: 30 }).map((_, i) => (
              <VictoryParticle key={i} delay={i * 0.1} />
            ))}
          </div>
          <motion.div
            className="absolute inset-0"
            animate={{ background: ['radial-gradient(circle at 50% 50%, rgba(212,168,67,0.1) 0%, transparent 50%)', 'radial-gradient(circle at 50% 50%, rgba(212,168,67,0.2) 0%, transparent 60%)', 'radial-gradient(circle at 50% 50%, rgba(212,168,67,0.1) 0%, transparent 50%)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </>
      )}
      {!villageWon && (
        <>
          <ParticleBackground count={30} color="rgba(139,58,58,0.15)" />
          <motion.div
            className="absolute inset-0"
            animate={{ background: ['radial-gradient(circle at 50% 50%, rgba(139,58,58,0.05) 0%, transparent 50%)', 'radial-gradient(circle at 50% 50%, rgba(139,58,58,0.15) 0%, transparent 60%)', 'radial-gradient(circle at 50% 50%, rgba(139,58,58,0.05) 0%, transparent 50%)'] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </>
      )}

      <motion.div className="text-center max-w-lg relative z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 12 }}
        >
          {villageWon ? (
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Trophy className="w-20 h-20 text-accent-gold mx-auto mb-4" />
            </motion.div>
          ) : (
            <motion.div
              animate={{ y: [0, 5, 0], rotate: [0, -3, 3, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Skull className="w-20 h-20 text-werewolf-red mx-auto mb-4" />
            </motion.div>
          )}
        </motion.div>

        <motion.h2
          className={`font-cinzel text-5xl font-bold mb-2 ${villageWon ? 'text-villager-blue' : 'text-werewolf-red'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {villageWon ? 'The Village Prevails!' : 'The Werewolves Win!'}
        </motion.h2>

        <motion.p className="text-text-secondary mb-2 text-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {humanWon ? 'You survived! Well played.' : 'Better luck next time...'}
        </motion.p>

        <motion.p className="text-text-muted text-sm mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          Game lasted {round} rounds
        </motion.p>

        {/* Role Reveal Table */}
        <motion.div className="bg-bg-secondary/60 border border-accent-purple/20 rounded-xl p-4 mb-8 backdrop-blur-sm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <h3 className="font-cinzel text-accent-gold text-lg mb-4 flex items-center justify-center gap-2">
            <Crown className="w-5 h-5" /> Final Roles
          </h3>
          <div className="space-y-2">
            {players.map((player, i) => (
              <motion.div
                key={player.id}
                className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-bg-primary/30 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.05 }}
              >
                <div className="flex items-center gap-2">
                  {player.isAlive ? (
                    <motion.div whileHover={{ scale: 1.2, rotate: 10 }}>
                      <PlayerAvatar avatar={player.avatar} size="sm" />
                    </motion.div>
                  ) : (
                    <Skull className="w-4 h-4 text-dead-gray" />
                  )}
                  <span className={`text-sm ${player.id === humanPlayerId ? 'text-accent-gold font-semibold' : 'text-text-primary'}`}>
                    {player.name} {player.id === humanPlayerId && '(You)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.span
                    className={`text-xs font-bold uppercase ${getRoleColor(player.role)}`}
                    whileHover={{ scale: 1.1 }}
                  >
                    {player.role === 'unknown' ? '???' : player.role}
                  </motion.span>
                  {!player.isAlive && <span className="text-dead-gray text-xs">dead</span>}
                  {player.isAlive && (
                    <motion.span
                      className="text-green-400 text-xs flex items-center gap-1"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Star className="w-3 h-3" /> survived
                    </motion.span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Your Stats */}
        {human && (
          <motion.div className="bg-bg-secondary/40 border border-accent-purple/20 rounded-xl p-4 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <h3 className="font-cinzel text-accent-gold text-sm mb-3 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> Your Performance
            </h3>
            <div className="flex flex-col items-center gap-3">
              <RoleCard role={human.role} size="sm" animate />
              <div className="grid grid-cols-2 gap-4 text-sm w-full">
                <div className="text-center">
                  <p className="text-text-muted">Result</p>
                  <motion.p
                    className={humanWon ? 'text-green-400 font-semibold text-lg' : 'text-werewolf-red font-semibold text-lg'}
                    animate={humanWon ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {humanWon ? 'Victory' : 'Defeat'}
                  </motion.p>
                </div>
                <div className="text-center">
                  <p className="text-text-muted">Rounds</p>
                  <p className="text-text-primary font-semibold text-lg">{round}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div className="flex flex-col gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
          <motion.button
            onClick={handlePlayAgain}
            whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(212,168,67,0.4)' }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 bg-accent-gold hover:bg-accent-gold/90 text-[#1A1833] font-bold py-4 rounded-xl transition-all text-lg"
          >
            <RotateCcw className="w-5 h-5" />
            {isOnline ? 'Back to Lobby' : 'Play Again (Same Settings)'}
          </motion.button>
          <motion.button
            onClick={handleMainMenu}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 bg-bg-elevated hover:bg-bg-elevated/80 text-text-primary py-3 rounded-xl border border-accent-purple/30 transition-all"
          >
            {isOnline ? <LogOut className="w-5 h-5" /> : <Home className="w-5 h-5" />}
            {isOnline ? 'Leave Room' : 'Main Menu'}
          </motion.button>
        </motion.div>
      </motion.div>

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
