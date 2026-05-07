import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Moon, Eye, Skull, ArrowRight, Shield, FlaskConical, Crosshair, Sparkles, Crown, Wand2, Users } from 'lucide-react';
import PlayerAvatar from '@/components/PlayerAvatar';
import CountdownRing from '@/components/CountdownRing';
import ParticleBackground, { FogLayer, LightningFlash } from '@/components/ParticleBackground';
import AnimatedPlayerCard from '@/components/AnimatedPlayerCard';
import { getTrueFaction } from '@/engine/gameEngine';

export default function NightScreen() {
  const { state, submitNightAction, processNight, submitBodyguardAction, submitWitchAction, submitSorcererAction, submitAlphaWolfAction } = useGameStore();
  const { players, humanPlayerId, round, mode, settings } = state;
  const human = players.find(p => p.id === humanPlayerId);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [witchHealTarget, setWitchHealTarget] = useState<string | null>(null);
  const [witchPoisonTarget, setWitchPoisonTarget] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'submitted' | 'processing'>('idle');
  const [timer, setTimer] = useState(human?.role === 'villager' || human?.role === 'minion' || human?.role === 'hunter' ? 5 : settings.nightTimerSeconds);
  const [lightning, setLightning] = useState(false);

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
  const isWerewolfTeam = human ? getTrueFaction(human.role) === 'werewolf' : false;

  // Werewolf teammates visible to minion/sorcerer/alpha
  const werewolfTeammates = isWerewolfTeam
    ? alivePlayers.filter(p => p.id !== humanPlayerId && getTrueFaction(p.role) === 'werewolf')
    : [];

  // Random lightning effects
  useEffect(() => {
    if (phase !== 'idle') return;
    const interval = setInterval(() => {
      if (Math.random() < 0.15) {
        setLightning(true);
        setTimeout(() => setLightning(false), 400);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [phase]);

  const runProcessNight = useCallback(() => {
    if (processingRef.current) return;
    processingRef.current = true;

    if (isOnline) {
      if (phaseRef.current === 'idle' && human?.role !== 'villager' && human?.role !== 'hunter' && human?.role !== 'minion' && !selectedTargetRef.current) {
        const others = aliveOthersRef.current;
        const randomTarget = others[Math.floor(Math.random() * others.length)]?.id;
        if (randomTarget) {
          if (human?.role === 'bodyguard') submitBodyguardAction(randomTarget);
          else if (human?.role === 'witch') submitWitchAction(null, randomTarget);
          else if (human?.role === 'sorcerer') submitSorcererAction(randomTarget);
          else if (human?.role === 'alphaWolf') submitAlphaWolfAction(randomTarget);
          else submitNightAction(randomTarget);
        }
      }
      setPhase('processing');
      return;
    }

    setPhase('processing');
    processNight();
  }, [processNight, submitNightAction, submitBodyguardAction, submitWitchAction, submitSorcererAction, submitAlphaWolfAction, isOnline, human?.role]);

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

  const handleSubmit = () => {
    if (phaseRef.current !== 'idle') return;
    let target = selectedTarget;
    if (isOnline && human?.role !== 'villager' && human?.role !== 'hunter' && human?.role !== 'minion' && !target && human?.role !== 'witch') {
      target = aliveOthers[Math.floor(Math.random() * aliveOthers.length)]?.id || null;
    }

    if (human?.role === 'bodyguard') {
      if (!target && !isOnline) return;
      if (target) submitBodyguardAction(target);
      setPhase('submitted');
      setTimeout(() => runProcessNight(), 500);
      return;
    }

    if (human?.role === 'witch') {
      setPhase('submitted');
      submitWitchAction(witchHealTarget, witchPoisonTarget);
      setTimeout(() => runProcessNight(), 500);
      return;
    }

    if (human?.role === 'sorcerer') {
      if (!target && !isOnline) return;
      setPhase('submitted');
      if (target) submitSorcererAction(target);
      setTimeout(() => runProcessNight(), 500);
      return;
    }

    if (human?.role === 'alphaWolf') {
      if (!target && !isOnline) return;
      setPhase('submitted');
      if (target) submitAlphaWolfAction(target);
      setTimeout(() => runProcessNight(), 500);
      return;
    }

    if (human?.role !== 'villager' && human?.role !== 'hunter' && human?.role !== 'minion' && !target && !isOnline) return;
    setPhase('submitted');
    if (target) submitNightAction(target);
    setTimeout(() => runProcessNight(), human?.role === 'villager' || human?.role === 'hunter' || human?.role === 'minion' ? 200 : 500);
  };

  const getActionText = () => {
    if (!human) return '';
    switch (human.role) {
      case 'werewolf': return 'Choose a villager to eliminate';
      case 'alphaWolf': return 'Command the pack — choose who to kill';
      case 'sorcerer': return 'Choose a player to investigate for the Seer';
      case 'seer': return 'Choose a player to investigate';
      case 'bodyguard': return 'Choose a player to protect tonight';
      case 'witch': return 'Use your potions wisely';
      case 'hunter': return 'You sleep peacefully through the night...';
      case 'minion': return 'You wait silently, serving the wolf pack...';
      default: return 'You sleep peacefully through the night...';
    }
  };

  const getActionIcon = () => {
    if (!human) return null;
    switch (human.role) {
      case 'werewolf': return <Skull className="w-5 h-5 text-werewolf-red" />;
      case 'alphaWolf': return <Crown className="w-5 h-5 text-red-500" />;
      case 'sorcerer': return <Wand2 className="w-5 h-5 text-indigo-400" />;
      case 'seer': return <Eye className="w-5 h-5 text-accent-purple" />;
      case 'bodyguard': return <Shield className="w-5 h-5 text-accent-blue" />;
      case 'witch': return <FlaskConical className="w-5 h-5 text-emerald-400" />;
      case 'hunter': return <Crosshair className="w-5 h-5 text-orange-400" />;
      case 'minion': return <Users className="w-5 h-5 text-pink-400" />;
      default: return <Moon className="w-5 h-5 text-accent-blue" />;
    }
  };

  const hasAction = human?.role === 'werewolf' || human?.role === 'seer' || human?.role === 'bodyguard' || human?.role === 'witch' || human?.role === 'sorcerer' || human?.role === 'alphaWolf';
  const noAction = human?.role === 'villager' || human?.role === 'hunter' || human?.role === 'minion';

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      <motion.div
        className="absolute inset-0"
        animate={{ background: ['linear-gradient(to bottom, #0a0a1a, #12102a)', 'linear-gradient(to bottom, #0d0d1f, #151230)', 'linear-gradient(to bottom, #0a0a1a, #12102a)'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(75,60,110,0.3)_0%,_transparent_70%)]" />
      <FogLayer />
      <ParticleBackground count={40} color="rgba(123,109,141,0.2)" />
      <LightningFlash trigger={lightning} />

      <div className="relative z-10 flex flex-col items-center px-4 py-6 min-h-screen">
        {/* Header */}
        <motion.div className="text-center mb-6" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}>
          <motion.div
            className="flex items-center justify-center gap-2 mb-2"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Moon className="w-6 h-6 text-accent-gold" />
            <h2 className="font-cinzel text-3xl text-accent-gold">Night {round}</h2>
          </motion.div>
          {phase === 'idle' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.3 }}
            >
              <CountdownRing seconds={timer} maxSeconds={noAction ? 5 : settings.nightTimerSeconds} />
            </motion.div>
          )}
        </motion.div>

        {/* Action card */}
        <motion.div
          className="w-full max-w-2xl mb-6"
          initial={{ opacity: 0, y: 20, rotateX: -15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <div className="bg-bg-secondary/80 border border-accent-purple/30 rounded-xl p-4 flex items-center gap-3 backdrop-blur-sm">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {getActionIcon()}
            </motion.div>
            <span className="text-text-primary font-medium">{getActionText()}</span>
            {(human?.role === 'werewolf' || human?.role === 'alphaWolf') && (
              <motion.span
                className="ml-auto text-xs text-werewolf-red font-bold"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {human.role === 'alphaWolf' ? 'COMMAND' : 'KILL'}
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Werewolf team info for minion/sorcerer/alpha */}
        {isWerewolfTeam && werewolfTeammates.length > 0 && (
          <motion.div
            className="w-full max-w-2xl mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-red-400 text-sm font-medium flex items-center gap-2 mb-2">
                <Users className="w-4 h-4" /> Wolf Pack
              </p>
              <div className="flex flex-wrap gap-2">
                {werewolfTeammates.map(teammate => (
                  <div key={teammate.id} className="flex items-center gap-1.5 bg-red-900/30 px-2 py-1 rounded-lg">
                    <PlayerAvatar avatar={teammate.avatar} size="sm" />
                    <span className="text-red-300 text-xs font-medium">{teammate.name}</span>
                    <span className="text-red-400/60 text-[10px]">({teammate.role})</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {human?.role === 'witch' ? (
            <motion.div
              key="witch"
              className="w-full max-w-2xl mb-6 space-y-4"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
            >
              {!state.witchHealUsed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-emerald-400 text-sm mb-2 font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Healing Potion
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {aliveOthers.map((player, i) => (
                      <motion.button
                        key={`heal-${player.id}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + i * 0.08 }}
                        onClick={() => phase === 'idle' && setWitchHealTarget(player.id)}
                        disabled={phase !== 'idle'}
                        className={`relative p-3 rounded-xl border-2 text-center transition-all ${
                          witchHealTarget === player.id
                            ? 'border-emerald-400 bg-emerald-400/20 shadow-[0_0_20px_rgba(52,211,153,0.4)]'
                            : 'border-accent-purple/30 bg-bg-secondary/60 hover:border-emerald-400/50'
                        } ${phase !== 'idle' ? 'opacity-60' : ''}`}
                      >
                        <div className="flex justify-center mb-1"><PlayerAvatar avatar={player.avatar} size="sm" /></div>
                        <div className="text-text-primary text-xs font-medium truncate">{player.name}</div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
              {!state.witchPoisonUsed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-werewolf-red text-sm mb-2 font-medium flex items-center gap-2">
                    <Skull className="w-4 h-4" /> Poison Potion
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {aliveOthers.map((player, i) => (
                      <motion.button
                        key={`poison-${player.id}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + i * 0.08 }}
                        onClick={() => phase === 'idle' && setWitchPoisonTarget(player.id)}
                        disabled={phase !== 'idle'}
                        className={`relative p-3 rounded-xl border-2 text-center transition-all ${
                          witchPoisonTarget === player.id
                            ? 'border-werewolf-red bg-werewolf-red/20 shadow-[0_0_20px_rgba(139,58,58,0.4)]'
                            : 'border-accent-purple/30 bg-bg-secondary/60 hover:border-werewolf-red/50'
                        } ${phase !== 'idle' ? 'opacity-60' : ''}`}
                      >
                        <div className="flex justify-center mb-1"><PlayerAvatar avatar={player.avatar} size="sm" /></div>
                        <div className="text-text-primary text-xs font-medium truncate">{player.name}</div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
              {state.witchHealUsed && state.witchPoisonUsed && (
                <motion.p className="text-text-muted text-center" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                  You have used all your potions.
                </motion.p>
              )}
            </motion.div>
          ) : hasAction ? (
            <motion.div
              key="action-grid"
              className="w-full max-w-2xl grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {aliveOthers.map((player, i) => (
                <AnimatedPlayerCard
                  key={player.id}
                  player={player}
                  isSelected={selectedTarget === player.id}
                  isTargeted={selectedTarget === player.id && (human?.role === 'werewolf' || human?.role === 'alphaWolf')}
                  onClick={() => phase === 'idle' && setSelectedTarget(player.id)}
                  index={i}
                  disabled={phase !== 'idle'}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="sleep"
              className="flex-1 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center text-text-muted">
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Moon className="w-20 h-20 mx-auto mb-4 text-accent-blue/30" />
                </motion.div>
                <motion.p
                  className="text-lg"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  The villagers sleep...
                </motion.p>
                <p className="text-sm mt-2">Wait for dawn to break</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <motion.div className="w-full max-w-2xl" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          {phase === 'idle' ? (
            <motion.button
              onClick={handleSubmit}
              disabled={!noAction && human?.role !== 'witch' && !selectedTarget && !isOnline}
              whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(212,168,67,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-lg ${
                (noAction || human?.role === 'witch' || selectedTarget || isOnline)
                  ? 'bg-accent-gold hover:bg-accent-gold/90 text-[#1A1833] shadow-[0_0_20px_rgba(212,168,67,0.3)]'
                  : 'bg-bg-elevated text-text-muted cursor-not-allowed'
              }`}
            >
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
              {noAction
                ? 'Continue to Dawn'
                : human?.role === 'witch'
                ? 'Submit Potions'
                : selectedTarget
                ? `Target ${players.find(p => p.id === selectedTarget)?.name}`
                : isOnline
                ? 'Skip / Random'
                : 'Select a target'}
            </motion.button>
          ) : (
            <div className="text-center">
              <motion.div
                className="inline-flex items-center gap-2 text-accent-gold"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <motion.div
                  className="w-3 h-3 rounded-full bg-accent-gold"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                {phase === 'submitted' ? 'Submitting your action...' : 'Processing night actions...'}
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
