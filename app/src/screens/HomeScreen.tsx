import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Moon, Users, HelpCircle, ChevronRight, Globe, Sparkles, Shield, Eye, Crosshair, FlaskConical, User } from 'lucide-react';
import { useState, useRef } from 'react';
import ParticleBackground from '@/components/ParticleBackground';

export default function HomeScreen() {
  const setScreen = useGameStore(s => s.setScreen);
  const setMode = useGameStore(s => s.setMode);
  const updateSettings = useGameStore(s => s.updateSettings);
  const settings = useGameStore(s => s.state.settings);
  const [showHelp, setShowHelp] = useState(false);
  const [nickname, setNickname] = useState(settings.playerName || 'You');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLocal = () => {
    setMode('local');
    setScreen('lobby');
  };

  const handleOnline = () => {
    setMode('online');
    setScreen('online-lobby');
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F0E1A] via-[#1A1833] to-[#0F0E1A]" />
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'url(/village-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E1A] via-transparent to-[#0F0E1A]/80" />
      <ParticleBackground count={30} color="rgba(212,168,67,0.15)" />

      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-accent-purple/5 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-werewolf-red/5 blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        {/* Werewolf avatar */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.2 }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img src="/werewolf-avatar.png" alt="Werewolf" className="w-32 h-32 rounded-full border-2 border-accent-gold/50 shadow-[0_0_30px_rgba(212,168,67,0.3)]" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.h1
            className="font-cinzel text-6xl md:text-7xl font-bold text-accent-gold tracking-wider drop-shadow-[0_0_20px_rgba(212,168,67,0.5)]"
            animate={{ textShadow: ['0 0 20px rgba(212,168,67,0.3)', '0 0 40px rgba(212,168,67,0.6)', '0 0 20px rgba(212,168,67,0.3)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {'WEREWOLF'.split('').map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.05, type: 'spring' }}
              >
                {char}
              </motion.span>
            ))}
          </motion.h1>
          <motion.p
            className="text-text-secondary mt-2 text-lg tracking-wide"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            A Social Deduction Game
          </motion.p>
        </motion.div>

        {/* Nickname Input */}
        <motion.div
          className="w-72"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="relative">
            <motion.input
              ref={inputRef}
              type="text"
              value={nickname}
              onChange={e => {
                setNickname(e.target.value);
                updateSettings({ playerName: e.target.value || 'You' });
              }}
              onFocus={() => inputRef.current?.select()}
              placeholder="Enter your nickname"
              maxLength={16}
              className="w-full bg-bg-secondary/80 border border-accent-purple/30 rounded-xl px-4 py-3 text-text-primary text-center font-medium focus:border-accent-gold focus:outline-none focus:ring-1 focus:ring-accent-gold/30 transition-all"
              whileFocus={{ scale: 1.02, borderColor: 'rgba(212,168,67,0.5)' }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs pointer-events-none">
              <User className="w-4 h-4" />
            </div>
          </div>
        </motion.div>

        {/* Role icons strip */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {[
            { icon: Shield, color: 'text-villager-blue', label: 'Villager' },
            { icon: Eye, color: 'text-accent-purple', label: 'Seer' },
            { icon: Moon, color: 'text-werewolf-red', label: 'Werewolf' },
            { icon: Crosshair, color: 'text-orange-400', label: 'Hunter' },
            { icon: FlaskConical, color: 'text-emerald-400', label: 'Witch' },
          ].map((role, i) => (
            <motion.div
              key={role.label}
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.1 }}
              whileHover={{ scale: 1.2, y: -5 }}
            >
              <div className={`p-2 rounded-lg bg-bg-secondary/60 border border-accent-purple/20 ${role.color}`}>
                <role.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-text-muted">{role.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="flex flex-col gap-4 w-72"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <motion.button
            onClick={handleLocal}
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(212,168,67,0.5)' }}
            whileTap={{ scale: 0.95 }}
            className="group flex items-center justify-center gap-3 bg-accent-gold hover:bg-accent-gold/90 text-[#1A1833] font-semibold py-4 px-8 rounded-xl transition-all"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Moon className="w-5 h-5" />
            </motion.div>
            <span className="text-lg">Play vs AI</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.div>
          </motion.button>

          <motion.button
            onClick={handleOnline}
            whileHover={{ scale: 1.05, borderColor: 'rgba(96,165,250,0.6)' }}
            whileTap={{ scale: 0.95 }}
            className="group flex items-center justify-center gap-3 bg-bg-elevated hover:bg-bg-elevated/80 text-text-primary py-3 px-8 rounded-xl border border-accent-blue/30 transition-all"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Globe className="w-5 h-5 text-accent-blue" />
            </motion.div>
            <span className="text-lg">Play Online</span>
            <ChevronRight className="w-5 h-5 text-accent-blue group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <motion.button
            onClick={() => setShowHelp(!showHelp)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-3 bg-bg-elevated hover:bg-bg-elevated/80 text-text-primary py-3 px-8 rounded-xl border border-accent-purple/30 transition-all hover:border-accent-purple/60"
          >
            <HelpCircle className="w-5 h-5 text-accent-purple" />
            <span>How to Play</span>
          </motion.button>
        </motion.div>

        {/* How to Play panel */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-full max-w-lg bg-bg-secondary/95 border border-accent-purple/30 rounded-xl p-6 backdrop-blur-sm overflow-hidden"
            >
              <h3 className="font-cinzel text-xl text-accent-gold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> How to Play
              </h3>
              <div className="space-y-3 text-text-secondary text-sm">
                <p><span className="text-villager-blue font-semibold">Villagers</span> must find and vote to eliminate all Werewolves.</p>
                <p><span className="text-werewolf-red font-semibold">Werewolves</span> secretly eliminate one villager each night. They win when wolves equal or outnumber villagers.</p>
                <p><span className="text-accent-purple font-semibold">The Seer</span> can investigate one player each night.</p>
                <p><span className="text-accent-blue font-semibold">The Bodyguard</span> protects one player from werewolves each night.</p>
                <p><span className="text-orange-400 font-semibold">The Hunter</span> takes someone with them when eliminated.</p>
                <p><span className="text-emerald-400 font-semibold">The Witch</span> has healing and poison potions to use at night.</p>
                <div className="border-t border-accent-purple/20 pt-3 mt-3">
                  <p className="text-text-primary font-medium mb-1">Game Flow:</p>
                  <p>1. Role Assignment - Each player gets a secret role</p>
                  <p>2. Night - Special roles use their abilities</p>
                  <p>3. Day - Discuss who might be a Werewolf</p>
                  <p>4. Voting - Everyone votes to eliminate one person</p>
                  <p>5. Repeat until one side wins!</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
