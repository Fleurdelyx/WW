import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Users, Crown, Play, ArrowLeft, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function RoomScreen() {
  const { state, leaveRoom, startOnlineGame } = useGameStore();
  const { players, roomCode, isHost, settings } = state;
  const [copied, setCopied] = useState(false);
  const count = players.length;
  const canStart = count >= 4 && count <= 12;

  const handleCopy = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={leaveRoom}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Leave Room
        </button>

        <div className="text-center mb-8">
          <h2 className="font-cinzel text-3xl text-accent-gold mb-2">Waiting Room</h2>
          <div className="flex items-center justify-center gap-2">
            <p className="text-text-secondary">Room Code:</p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-bg-secondary border border-accent-purple/30 rounded-lg px-3 py-1 hover:border-accent-purple/60 transition-all"
            >
              <span className="font-mono text-lg text-accent-gold tracking-widest">{roomCode}</span>
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-text-muted" />}
            </button>
          </div>
        </div>

        {/* Player List */}
        <div className="bg-bg-secondary/60 border border-accent-purple/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <Users className="w-4 h-4" />
              <span>{count} / 12 players</span>
            </div>
            <span className="text-text-muted text-xs">{canStart ? 'Ready to start' : 'Need at least 4 players'}</span>
          </div>

          <div className="space-y-2">
            {players.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 bg-bg-primary/50 rounded-lg px-3 py-2.5"
              >
                <span className="text-xl">{player.avatar}</span>
                <span className="text-text-primary text-sm font-medium flex-1">{player.name}</span>
                {player.id === state.humanPlayerId && (
                  <span className="text-xs text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded">You</span>
                )}
                {i === 0 && (
                  <span className="flex items-center gap-1 text-xs text-accent-gold bg-accent-gold/10 px-2 py-0.5 rounded">
                    <Crown className="w-3 h-3" /> Host
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {isHost ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startOnlineGame}
            disabled={!canStart}
            className="w-full flex items-center justify-center gap-2 bg-accent-gold hover:bg-accent-gold/90 disabled:bg-bg-elevated disabled:text-text-muted text-[#1A1833] font-bold py-4 rounded-lg transition-all"
          >
            <Play className="w-5 h-5" />
            Start Game
          </motion.button>
        ) : (
          <div className="text-center text-text-secondary text-sm py-4">
            Waiting for host to start the game...
          </div>
        )}
      </motion.div>
    </div>
  );
}
