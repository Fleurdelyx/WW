import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { getRoleDescription, getRoleName } from '@/engine/gameEngine';
import { Shield, Eye, Skull } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function RoleRevealScreen() {
  const { state, startNight, playerReady } = useGameStore();
  const humanPlayer = state.players.find(p => p.id === state.humanPlayerId);
  const [flipped, setFlipped] = useState(false);
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFlipped(true), 800);
    const t2 = setTimeout(() => setCanContinue(true), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleContinue = () => {
    if (state.mode === 'online') {
      playerReady();
    } else {
      startNight();
    }
  };

  if (!humanPlayer) return null;

  const roleImages: Record<string, string> = {
    werewolf: '/card-werewolf.png',
    villager: '/card-villager.png',
    seer: '/card-seer.png',
  };

  const roleColors: Record<string, string> = {
    werewolf: 'text-werewolf-red',
    villager: 'text-villager-blue',
    seer: 'text-accent-purple',
  };

  const roleIcons: Record<string, React.ReactNode> = {
    werewolf: <Skull className="w-6 h-6" />,
    villager: <Shield className="w-6 h-6" />,
    seer: <Eye className="w-6 h-6" />,
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4">
      <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="font-cinzel text-2xl text-text-secondary mb-8">Your Role</h2>

        {/* 3D Card Flip */}
        <div className="perspective-[1000px] mb-8">
          <motion.div
            className="relative w-64 h-96 mx-auto"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Card Back */}
            <div
              className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border-2 border-accent-purple/50"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <img src="/card-back.png" alt="Card Back" className="w-full h-full object-cover" />
            </div>

            {/* Card Front */}
            <div
              className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border-2 border-accent-gold/50"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <img src={roleImages[humanPlayer.role]} alt={getRoleName(humanPlayer.role)} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                <div className={`font-cinzel text-2xl font-bold ${roleColors[humanPlayer.role]} drop-shadow-lg`}>
                  {getRoleName(humanPlayer.role).toUpperCase()}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Role Info */}
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-sm mx-auto"
          >
            <div className={`flex items-center justify-center gap-2 text-xl font-semibold mb-2 ${roleColors[humanPlayer.role]}`}>
              {roleIcons[humanPlayer.role]}
              {getRoleName(humanPlayer.role)}
            </div>
            <p className="text-text-secondary text-sm">{getRoleDescription(humanPlayer.role)}</p>
          </motion.div>
        )}

        {/* Continue Button */}
        {canContinue && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleContinue}
            className="mt-8 bg-accent-gold hover:bg-accent-gold/90 text-[#1A1833] font-bold py-3 px-10 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(212,168,67,0.4)]"
          >
            Continue to Night {state.round}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
