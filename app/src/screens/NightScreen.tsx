import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Moon, Eye, Skull, Clock, ArrowRight } from 'lucide-react';

export default function NightScreen() {
  const { state, submitNightAction, processNight } = useGameStore();
  const { players, humanPlayerId, round, mode } = state;
  const human = players.find(p => p.id === humanPlayerId);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'submitted' | 'processing'>('idle');
  const [timer, setTimer] = useState(human?.role === 'villager' ? 5 : 30);

  // Refs for race-condition-free guards and stale closures
  const processingRef = useRef(false);
  const phaseRef = useRef('idle');
  const selectedTargetRef = useRef<string | null>(null);
  phaseRef.current = phase;
  selectedTargetRef.current = selectedTarget;

  const alivePlayers = players.filter(p => p.isAlive);
  const aliveOthers = alivePlayers.filter(p => p.id !== humanPlayerId);
  const aliveOthersRef = useRef(aliveOthers);
  aliveOthersRef.current = aliveOthers;

  const isOnline = mode === 'online';

  // Single guarded processNight - can only run once
  const runProcessNight = useCallback(() => {
    if (processingRef.current) return;
    processingRef.current = true;

    if (isOnline) {
      // In online mode, ensure night action is submitted before we go to processing
      if (phaseRef.current === 'idle' && human?.role !== 'villager' && !selectedTargetRef.current) {
        const others = aliveOthersRef.current;
        const randomTarget = others[Math.floor(Math.random() * others.length)]?.id;
        if (randomTarget) submitNightAction(randomTarget);
      }
      setPhase('processing');
      return;
    }

    setPhase('processing');
    processNight();
  }, [processNight, submitNightAction, isOnline, human?.role]);

  // Timer effect - auto-process when time runs out
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(t => {
        if (phaseRef.current !== 'idle') {
          clearInterval(interval);
          return t;
        }
        if (t <= 1) {
          clearInterval(interval);
          runProcessNight();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [runProcessNight]);

  // Manual submit handler
  const handleSubmit = () => {
    if (phaseRef.current !== 'idle') return;
    let target = selectedTarget;
    if (isOnline && human?.role !== 'villager' && !target) {
      target = aliveOthers[Math.floor(Math.random() * aliveOthers.length)]?.id || null;
    }
    if (human?.role !== 'villager' && !target) return;
    setPhase('submitted');
    if (target) submitNightAction(target);
    setTimeout(() => runProcessNight(), human?.role === 'villager' ? 200 : 500);
  };

  const getActionText = () => {
    if (!human) return '';
    switch (human.role) {
      case 'werewolf': return 'Choose a villager to eliminate';
      case 'seer': return 'Choose a player to investigate';
      default: return 'You sleep peacefully through the night...';
    }
  };

  const getActionIcon = () => {
    if (!human) return null;
    switch (human.role) {
      case 'werewolf': return <Skull className="w-5 h-5 text-werewolf-red" />;
      case 'seer': return <Eye className="w-5 h-5 text-accent-purple" />;
      default: return <Moon className="w-5 h-5 text-accent-blue" />;
    }
  };

  // For werewolves in online mode, show teammate indicator
  const isWerewolf = human?.role === 'werewolf';

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a] via-[#12102a] to-[#0a0a1a]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(75,60,110,0.3)_0%,_transparent_70%)]" />

      <div className="relative z-10 flex flex-col items-center px-4 py-6 min-h-screen">
        <motion.div className="text-center mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Moon className="w-6 h-6 text-accent-gold" />
            <h2 className="font-cinzel text-3xl text-accent-gold">Night {round}</h2>
          </div>
          {phase === 'idle' && (
            <div className="flex items-center justify-center gap-2 text-text-muted">
              <Clock className="w-4 h-4" />
              <span>{timer}s</span>
            </div>
          )}
        </motion.div>

        <motion.div className="w-full max-w-2xl mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="bg-bg-secondary/80 border border-accent-purple/30 rounded-lg p-4 flex items-center gap-3">
            {getActionIcon()}
            <span className="text-text-primary">{getActionText()}</span>
          </div>
        </motion.div>

        {human?.role !== 'villager' ? (
          <div className="w-full max-w-2xl grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
            {aliveOthers.map((player, i) => (
              <motion.button
                key={player.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                onClick={() => phase === 'idle' && setSelectedTarget(player.id)}
                disabled={phase !== 'idle'}
                className={`relative p-3 rounded-lg border-2 text-center transition-all ${
                  selectedTarget === player.id
                    ? 'border-accent-gold bg-accent-gold/20 shadow-[0_0_15px_rgba(212,168,67,0.3)]'
                    : 'border-accent-purple/30 bg-bg-secondary/60 hover:border-accent-purple/60'
                } ${phase !== 'idle' ? 'opacity-60' : ''}`}
              >
                <div className="text-2xl mb-1">{player.avatar}</div>
                <div className="text-text-primary text-xs font-medium truncate">{player.name}</div>
                {isWerewolf && player.role === 'werewolf' && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-werewolf-red" title="Werewolf teammate" />
                )}
              </motion.button>
            ))}
          </div>
        ) : (
          <motion.div className="flex-1 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <div className="text-center text-text-muted">
              <Moon className="w-16 h-16 mx-auto mb-4 animate-pulse text-accent-blue/40" />
              <p className="text-lg">The villagers sleep...</p>
              <p className="text-sm mt-2">Wait for dawn to break</p>
            </div>
          </motion.div>
        )}

        <motion.div className="w-full max-w-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          {phase === 'idle' ? (
            <button
              onClick={handleSubmit}
              disabled={human?.role !== 'villager' && !selectedTarget && !isOnline}
              className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                (human?.role === 'villager' || selectedTarget || isOnline)
                  ? 'bg-accent-gold hover:bg-accent-gold/90 text-[#1A1833] shadow-[0_0_15px_rgba(212,168,67,0.3)]'
                  : 'bg-bg-elevated text-text-muted cursor-not-allowed'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
              {human?.role === 'villager' ? 'Continue to Dawn' : (selectedTarget ? `Eliminate ${players.find(p => p.id === selectedTarget)?.name}` : isOnline ? 'Skip / Random' : 'Select a target')}
            </button>
          ) : (
            <div className="text-center text-accent-gold animate-pulse">
              {phase === 'submitted' ? 'Submitting your action...' : 'Processing night actions...'}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
