import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Trophy, Skull, RotateCcw, Home, LogOut } from 'lucide-react';

export default function GameOverScreen() {
  const { state, resetGame, createGame, leaveRoom, playerReady } = useGameStore();
  const { winner, players, humanPlayerId, round, mode } = state;
  const human = players.find(p => p.id === humanPlayerId);

  const humanWon = human ? human.faction === winner : false;
  const villageWon = winner === 'village';
  const isOnline = mode === 'online';

  const handlePlayAgain = () => {
    if (isOnline) {
      playerReady();
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

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 py-8">
      <motion.div className="text-center max-w-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 12 }}
        >
          {villageWon ? (
            <Trophy className="w-16 h-16 text-accent-gold mx-auto mb-4" />
          ) : (
            <Skull className="w-16 h-16 text-werewolf-red mx-auto mb-4" />
          )}
        </motion.div>

        <motion.h2
          className={`font-cinzel text-4xl font-bold mb-2 ${villageWon ? 'text-villager-blue' : 'text-werewolf-red'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {villageWon ? 'The Village Prevails!' : 'The Werewolves Win!'}
        </motion.h2>

        <motion.p className="text-text-secondary mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {humanWon ? 'You survived! Well played.' : 'Better luck next time...'}
        </motion.p>

        <motion.p className="text-text-muted text-sm mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          Game lasted {round} rounds
        </motion.p>

        {/* Role Reveal Table */}
        <motion.div className="bg-bg-secondary/60 border border-accent-purple/20 rounded-lg p-4 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <h3 className="font-cinzel text-accent-gold text-lg mb-4">Final Roles</h3>
          <div className="space-y-2">
            {players.map((player, i) => (
              <motion.div
                key={player.id}
                className="flex items-center justify-between py-1.5 px-2 rounded"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.05 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{player.isAlive ? player.avatar : <Skull className="w-4 h-4 text-dead-gray inline" />}</span>
                  <span className={`text-sm ${player.id === humanPlayerId ? 'text-accent-gold font-semibold' : 'text-text-primary'}`}>
                    {player.name} {player.id === humanPlayerId && '(You)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase ${
                    player.role === 'werewolf' ? 'text-werewolf-red' :
                    player.role === 'seer' ? 'text-accent-purple' : 'text-villager-blue'
                  }`}>
                    {player.role === 'unknown' ? '???' : player.role}
                  </span>
                  {!player.isAlive && <span className="text-dead-gray text-xs">dead</span>}
                  {player.isAlive && <span className="text-green-400 text-xs">survived</span>}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Your Stats */}
        {human && (
          <motion.div className="bg-bg-secondary/40 border border-accent-purple/20 rounded-lg p-4 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <h3 className="font-cinzel text-accent-gold text-sm mb-2">Your Performance</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-muted">Your Role</p>
                <p className={`font-semibold ${human.role === 'werewolf' ? 'text-werewolf-red' : human.role === 'seer' ? 'text-accent-purple' : 'text-villager-blue'}`}>
                  {human.role === 'unknown' ? '???' : human.role.charAt(0).toUpperCase() + human.role.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-text-muted">Result</p>
                <p className={humanWon ? 'text-green-400 font-semibold' : 'text-werewolf-red font-semibold'}>
                  {humanWon ? 'Victory' : 'Defeat'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div className="flex flex-col gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
          <button
            onClick={handlePlayAgain}
            className="flex items-center justify-center gap-2 bg-accent-gold hover:bg-accent-gold/90 text-[#1A1833] font-bold py-3 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(212,168,67,0.4)]"
          >
            <RotateCcw className="w-5 h-5" />
            {isOnline ? 'Back to Lobby' : 'Play Again (Same Settings)'}
          </button>
          <button
            onClick={handleMainMenu}
            className="flex items-center justify-center gap-2 bg-bg-elevated hover:bg-bg-elevated/80 text-text-primary py-3 rounded-lg border border-accent-purple/30 transition-all"
          >
            {isOnline ? <LogOut className="w-5 h-5" /> : <Home className="w-5 h-5" />}
            {isOnline ? 'Leave Room' : 'Main Menu'}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
