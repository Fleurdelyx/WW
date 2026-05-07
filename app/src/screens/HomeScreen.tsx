import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Moon, Users, HelpCircle, ChevronRight, Globe } from 'lucide-react';
import { useState } from 'react';

export default function HomeScreen() {
  const setScreen = useGameStore(s => s.setScreen);
  const setMode = useGameStore(s => s.setMode);
  const [showHelp, setShowHelp] = useState(false);

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
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F0E1A] via-[#1A1833] to-[#0F0E1A]" />
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'url(/village-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E1A] via-transparent to-[#0F0E1A]/80" />

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-accent-gold/30"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ y: [-20, -60, -20], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        {/* Werewolf avatar */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.2 }}
        >
          <img src="/werewolf-avatar.png" alt="Werewolf" className="w-32 h-32 rounded-full border-2 border-accent-gold/50 shadow-[0_0_30px_rgba(212,168,67,0.3)]" />
        </motion.div>

        {/* Title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="font-cinzel text-6xl md:text-7xl font-bold text-accent-gold tracking-wider drop-shadow-[0_0_20px_rgba(212,168,67,0.5)]">
            WEREWOLF
          </h1>
          <p className="text-text-secondary mt-2 text-lg tracking-wide">A Social Deduction Game</p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="flex flex-col gap-4 w-72"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <button
            onClick={handleLocal}
            className="group flex items-center justify-center gap-3 bg-accent-gold hover:bg-accent-gold/90 text-[#1A1833] font-semibold py-4 px-8 rounded-lg transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(212,168,67,0.4)]"
          >
            <Moon className="w-5 h-5" />
            <span className="text-lg">Play vs AI</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={handleOnline}
            className="group flex items-center justify-center gap-3 bg-bg-elevated hover:bg-bg-elevated/80 text-text-primary py-3 px-8 rounded-lg border border-accent-blue/30 transition-all hover:border-accent-blue/60 hover:scale-105"
          >
            <Globe className="w-5 h-5 text-accent-blue" />
            <span className="text-lg">Play Online</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-accent-blue" />
          </button>

          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center justify-center gap-3 bg-bg-elevated hover:bg-bg-elevated/80 text-text-primary py-3 px-8 rounded-lg border border-accent-purple/30 transition-all hover:border-accent-purple/60"
          >
            <HelpCircle className="w-5 h-5 text-accent-purple" />
            <span>How to Play</span>
          </button>
        </motion.div>

        {/* How to Play panel */}
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="w-full max-w-lg bg-bg-secondary/95 border border-accent-purple/30 rounded-lg p-6 backdrop-blur-sm"
          >
            <h3 className="font-cinzel text-xl text-accent-gold mb-4">How to Play</h3>
            <div className="space-y-3 text-text-secondary text-sm">
              <p><span className="text-accent-blue font-semibold">Villagers</span> must find and vote to eliminate all Werewolves.</p>
              <p><span className="text-werewolf-red font-semibold">Werewolves</span> secretly eliminate one villager each night. They win when wolves equal or outnumber villagers.</p>
              <p><span className="text-accent-purple font-semibold">The Seer</span> can investigate one player each night to learn if they are a Werewolf.</p>
              <div className="border-t border-accent-purple/20 pt-3 mt-3">
                <p className="text-text-primary font-medium mb-1">Game Flow:</p>
                <p>1. Role Assignment - Each player gets a secret role</p>
                <p>2. Night - Werewolves choose a victim; Seer investigates</p>
                <p>3. Day - Discuss who might be a Werewolf</p>
                <p>4. Voting - Everyone votes to eliminate one person</p>
                <p>5. Repeat until one side wins!</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
