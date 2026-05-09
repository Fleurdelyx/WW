import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Moon, Eye, Skull, ArrowRight, Shield, FlaskConical, Crosshair, Sparkles, Crown, Wand2, Users, Swords, HeartPulse, Search, Ghost, ScanEye, Bone } from 'lucide-react';
import PlayerAvatar from '@/components/PlayerAvatar';
import CountdownRing from '@/components/CountdownRing';
import ParticleBackground, { FogLayer, LightningFlash } from '@/components/ParticleBackground';
import AnimatedPlayerCard from '@/components/AnimatedPlayerCard';
import { getTrueFaction } from '@/engine/gameEngine';

export default function NightScreen() {
  const { state, submitNightAction, processNight, submitBodyguardAction, submitWitchAction, submitSorcererAction, submitAlphaWolfAction, submitVigilanteAction, submitDoctorAction, submitSheriffAction, submitMediumAction, submitMysticWolfAction } = useGameStore();
  const { players, humanPlayerId, round, mode, settings } = state;
  const human = players.find(p => p.id === humanPlayerId);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [witchHealTarget, setWitchHealTarget] = useState<string | null>(null);
  const [witchPoisonTarget, setWitchPoisonTarget] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'submitted' | 'processing'>('idle');

  const noAction = human?.role === 'villager' || human?.role === 'hunter' || human?.role === 'minion' || human?.role === 'mayor' || human?.role === 'gravedigger' || human?.role === 'lycan' || human?.role === 'prince';
  const [timer, setTimer] = useState(noAction || !human?.isAlive ? 5 : settings.nightTimerSeconds);
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

  const deadPlayers = players.filter(p => !p.isAlive);
  const deadPlayersRef = useRef(deadPlayers);
  deadPlayersRef.current = deadPlayers;

  const isOnline = mode === 'online';
  const isWerewolfTeam = human ? getTrueFaction(human.role) === 'werewolf' : false;

  // Werewolf teammates visible to minion/sorcerer/alpha/mysticWolf/wolfCub
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
      if (phaseRef.current === 'idle' && !noAction && !selectedTargetRef.current && !(human?.role === 'vigilante' && state.vigilanteUsed)) {
        const others = aliveOthersRef.current;
        const randomTarget = others[Math.floor(Math.random() * others.length)]?.id;
        if (randomTarget) {
          if (human?.role === 'bodyguard') submitBodyguardAction(randomTarget);
          else if (human?.role === 'witch') submitWitchAction(null, randomTarget);
          else if (human?.role === 'sorcerer') submitSorcererAction(randomTarget);
          else if (human?.role === 'alphaWolf') submitAlphaWolfAction(randomTarget);
          else if (human?.role === 'vigilante') submitVigilanteAction(randomTarget);
          else if (human?.role === 'doctor') submitDoctorAction(randomTarget);
          else if (human?.role === 'sheriff') submitSheriffAction(randomTarget);
          else if (human?.role === 'mysticWolf') submitMysticWolfAction(randomTarget);
          else if (human?.role === 'medium') {
            const dead = deadPlayersRef.current;
            const randomDead = dead[Math.floor(Math.random() * dead.length)]?.id;
            if (randomDead) submitMediumAction(randomDead);
          }
          else submitNightAction(randomTarget);
        }
      }
      setPhase('processing');
      return;
    }

    setPhase('processing');
    setTimeout(() => processNight(), 100);
  }, [processNight, submitNightAction, submitBodyguardAction, submitWitchAction, submitSorcererAction, submitAlphaWolfAction, submitVigilanteAction, submitDoctorAction, submitSheriffAction, submitMediumAction, submitMysticWolfAction, isOnline, human?.role, noAction, state.vigilanteUsed]);

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
    const needsTarget = !noAction && human?.role !== 'witch' && !(human?.role === 'vigilante' && state.vigilanteUsed);
    if (isOnline && needsTarget && !target) {
      if (human?.role === 'medium') {
        const dead = players.filter(p => !p.isAlive);
        target = dead[Math.floor(Math.random() * dead.length)]?.id || null;
      } else {
        target = aliveOthers[Math.floor(Math.random() * aliveOthers.length)]?.id || null;
      }
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

    if (human?.role === 'vigilante') {
      if (state.vigilanteUsed) {
        setPhase('submitted');
        setTimeout(() => runProcessNight(), 500);
        return;
      }
      if (!target && !isOnline) return;
      setPhase('submitted');
      if (target) submitVigilanteAction(target);
      setTimeout(() => runProcessNight(), 500);
      return;
    }

    if (human?.role === 'doctor') {
      if (!target && !isOnline) return;
      if (target) submitDoctorAction(target);
      setPhase('submitted');
      setTimeout(() => runProcessNight(), 500);
      return;
    }

    if (human?.role === 'sheriff') {
      if (!target && !isOnline) return;
      setPhase('submitted');
      if (target) submitSheriffAction(target);
      setTimeout(() => runProcessNight(), 500);
      return;
    }

    if (human?.role === 'medium') {
      if (!target && !isOnline) return;
      setPhase('submitted');
      if (target) submitMediumAction(target);
      setTimeout(() => runProcessNight(), 500);
      return;
    }

    if (human?.role === 'mysticWolf') {
      if (!target && !isOnline) return;
      setPhase('submitted');
      if (target) submitMysticWolfAction(target);
      setTimeout(() => runProcessNight(), 500);
      return;
    }

    if (human?.role === 'wolfCub') {
      if (!target && !isOnline) return;
      setPhase('submitted');
      if (target) submitNightAction(target);
      setTimeout(() => runProcessNight(), 500);
      return;
    }

    if (!noAction && !target && !isOnline) return;
    setPhase('submitted');
    if (target) submitNightAction(target);
    setTimeout(() => runProcessNight(), human?.role === 'villager' || human?.role === 'hunter' || human?.role === 'minion' || human?.role === 'mayor' || human?.role === 'gravedigger' || human?.role === 'lycan' || human?.role === 'prince' ? 200 : 500);
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
      case 'vigilante': return state.vigilanteUsed ? 'You have already used your bullet' : 'Choose a target for your bullet';
      case 'doctor': return 'Choose a player to heal tonight';
      case 'sheriff': return 'Choose a player to investigate their exact role';
      case 'medium': return 'Choose a dead player to commune with';
      case 'mysticWolf': return 'Choose a player to investigate';
      case 'wolfCub': return 'Choose a villager to eliminate';
      case 'mayor': return 'You sleep peacefully through the night...';
      case 'gravedigger': return 'You sleep peacefully through the night...';
      case 'lycan': return 'You sleep peacefully through the night...';
      case 'prince': return 'You sleep peacefully through the night...';
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
      case 'vigilante': return <Swords className="w-5 h-5 text-orange-400" />;
      case 'doctor': return <HeartPulse className="w-5 h-5 text-teal-400" />;
      case 'sheriff': return <Search className="w-5 h-5 text-sky-400" />;
      case 'medium': return <Ghost className="w-5 h-5 text-violet-400" />;
      case 'mysticWolf': return <ScanEye className="w-5 h-5 text-fuchsia-400" />;
      case 'wolfCub': return <Bone className="w-5 h-5 text-rose-400" />;
      default: return <Moon className="w-5 h-5 text-accent-blue" />;
    }
  };

  const hasAction = human?.role === 'werewolf' || human?.role === 'seer' || human?.role === 'bodyguard' || human?.role === 'witch' || human?.role === 'sorcerer' || human?.role === 'alphaWolf' || human?.role === 'vigilante' || human?.role === 'doctor' || human?.role === 'sheriff' || human?.role === 'medium' || human?.role === 'mysticWolf' || human?.role === 'wolfCub';

  const canSubmit = noAction || human?.role === 'witch' || (human?.role === 'vigilante' && state.vigilanteUsed) || selectedTarget !== null || isOnline;
  const submitDisabled = !canSubmit && !isOnline;

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Base night gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060614] via-[#0d0d1f] to-[#0a0a1a]" />

      {/* Animated stars */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 60 }).map((_, i) => {
          const x = Math.random() * 100;
          const y = Math.random() * 60;
          const size = 1 + Math.random() * 2;
          const delay = Math.random() * 5;
          const duration = 2 + Math.random() * 4;
          return (
            <motion.div
              key={`star-${i}`}
              className="absolute rounded-full bg-white"
              style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
              animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.3, 1] }}
              transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          );
        })}
      </div>

      {/* Glowing moon */}
      <motion.div
        className="absolute top-8 right-12 w-24 h-24 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(212,168,67,0.25) 0%, rgba(212,168,67,0.05) 50%, transparent 70%)',
          boxShadow: '0 0 60px rgba(212,168,67,0.15), 0 0 120px rgba(212,168,67,0.05)',
        }}
        animate={{ y: [0, -4, 0], scale: [1, 1.02, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute top-10 right-14 w-16 h-16 rounded-full opacity-60"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #f5e6c8 0%, #d4a843 40%, transparent 70%)',
        }}
      />

      {/* Nebula clouds */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(96,60,120,0.4) 0%, transparent 70%)', filter: 'blur(40px)' }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, rgba(60,80,120,0.3) 0%, transparent 70%)', filter: 'blur(50px)' }}
        animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Village silhouette at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none">
        <svg viewBox="0 0 1200 200" preserveAspectRatio="none" className="w-full h-full opacity-30">
          <path
            d="M0,200 L0,140 L20,140 L20,120 L40,120 L40,100 L60,100 L60,130 L80,130 L80,90 L110,90 L110,140 L130,140 L130,80 L160,80 L160,110 L180,110 L180,130 L200,130 L200,70 L230,70 L230,100 L250,100 L250,140 L280,140 L280,60 L320,60 L320,120 L350,120 L350,90 L380,90 L380,130 L400,130 L400,100 L430,100 L430,140 L460,140 L460,80 L490,80 L490,110 L520,110 L520,130 L550,130 L550,70 L590,70 L590,120 L620,120 L620,90 L650,90 L650,140 L680,140 L680,100 L710,100 L710,130 L740,130 L740,80 L770,80 L770,110 L800,110 L800,130 L830,130 L830,60 L870,60 L870,120 L900,120 L900,90 L930,90 L930,140 L960,140 L960,100 L990,100 L990,130 L1020,130 L1020,80 L1050,80 L1050,110 L1080,110 L1080,130 L1110,130 L1110,70 L1140,70 L1140,120 L1170,120 L1170,140 L1200,140 L1200,200 Z"
            fill="#0a0a14"
          />
        </svg>
        {/* Window lights in village */}
        {Array.from({ length: 12 }).map((_, i) => {
          const left = 5 + Math.random() * 90;
          const bottom = 15 + Math.random() * 25;
          const delay = Math.random() * 4;
          return (
            <motion.div
              key={`window-${i}`}
              className="absolute w-1 h-1 rounded-full bg-yellow-600/60"
              style={{ left: `${left}%`, bottom: `${bottom}%` }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 3, delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          );
        })}
      </div>

      {/* Ground fog layers */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(15,14,26,0.9) 0%, transparent 100%)' }}
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(15,14,26,1) 0%, transparent 100%)' }}
      />

      <FogLayer />
      <ParticleBackground count={30} color="rgba(123,109,141,0.15)" />
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
              <CountdownRing seconds={timer} maxSeconds={noAction || !human?.isAlive ? 5 : settings.nightTimerSeconds} />
            </motion.div>
          )}
        </motion.div>

        {!human?.isAlive ? (
          <>
            {/* Dead player message */}
            <motion.div
              className="w-full max-w-2xl mb-6 flex items-center justify-center gap-3 bg-bg-secondary/80 border border-dead-gray/30 rounded-xl p-4 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20, rotateX: -15 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              <Skull className="w-5 h-5 text-dead-gray" />
              <span className="text-text-muted font-medium">You are dead. You cannot act at night.</span>
            </motion.div>

            <motion.div
              className="flex-1 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-center text-text-muted">
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Moon className="w-20 h-20 mx-auto mb-4 text-accent-blue/20" />
                </motion.div>
                <motion.p
                  className="text-lg"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  Rest in peace...
                </motion.p>
              </div>
            </motion.div>

            {/* Submit button for dead players */}
            <motion.div className="w-full max-w-2xl" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <motion.button
                onClick={handleSubmit}
                whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(212,168,67,0.4)' }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-lg bg-accent-gold hover:bg-accent-gold/90 text-[#1A1833] shadow-[0_0_20px_rgba(212,168,67,0.3)]"
              >
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
                Continue to Dawn
              </motion.button>
            </motion.div>
          </>
        ) : (
          <>
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
                {(human?.role === 'werewolf' || human?.role === 'alphaWolf' || human?.role === 'wolfCub') && (
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

            {/* Werewolf team info for minion/sorcerer/alpha/mysticWolf/wolfCub */}
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
              ) : human?.role === 'vigilante' && state.vigilanteUsed ? (
                <motion.div
                  key="vigilante-used"
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
                      <Crosshair className="w-20 h-20 mx-auto mb-4 text-orange-400/30" />
                    </motion.div>
                    <motion.p
                      className="text-lg"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      You have already used your bullet.
                    </motion.p>
                  </div>
                </motion.div>
              ) : human?.role === 'medium' ? (
                <motion.div
                  key="medium-grid"
                  className="w-full max-w-2xl grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {deadPlayers.length === 0 ? (
                    <motion.p className="col-span-full text-text-muted text-center" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                      No dead players to commune with.
                    </motion.p>
                  ) : (
                    deadPlayers.map((player, i) => (
                      <AnimatedPlayerCard
                        key={player.id}
                        player={player}
                        isSelected={selectedTarget === player.id}
                        onClick={() => phase === 'idle' && setSelectedTarget(player.id)}
                        index={i}
                        disabled={phase !== 'idle'}
                      />
                    ))
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
                      isTargeted={selectedTarget === player.id && (human?.role === 'werewolf' || human?.role === 'alphaWolf' || human?.role === 'wolfCub' || human?.role === 'vigilante')}
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
                  disabled={submitDisabled}
                  whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(212,168,67,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-lg ${
                    canSubmit
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
                    : human?.role === 'vigilante' && state.vigilanteUsed
                    ? 'Continue to Dawn'
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
          </>
        )}
      </div>

      {/* Full-screen processing overlay */}
      {phase === 'processing' && (
        <motion.div
          className="absolute inset-0 bg-bg-primary/90 backdrop-blur-sm flex flex-col items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-accent-purple/30 border-t-accent-gold rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.p
            className="mt-6 text-accent-gold text-lg font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            The wolves are hunting...
          </motion.p>
          <p className="mt-2 text-text-muted text-sm">Processing night actions</p>
        </motion.div>
      )}
    </div>
  );
}
