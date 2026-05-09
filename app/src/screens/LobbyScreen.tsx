import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import type { AiDifficulty } from '@/types/game';
import { ArrowLeft, Users, Brain, Eye, Shield, Crosshair, FlaskConical, Play, Clock, MessageCircle, Sparkles, Moon, Crown, Wand2, VenetianMask, Skull, Ghost, Vote, Swords, HeartPulse, Search, Archive, ScanEye, Bone, Eclipse, Gem, Star } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';

export default function LobbyScreen() {
  const { state, updateSettings, createGame, setScreen } = useGameStore();
  const { settings } = state;

  const difficulties: { value: AiDifficulty; label: string; desc: string }[] = [
    { value: 'easy', label: 'Easy', desc: 'AI makes random choices' },
    { value: 'medium', label: 'Medium', desc: 'AI uses basic strategy' },
    { value: 'hard', label: 'Hard', desc: 'AI plays optimally' },
  ];

  const playerCounts = [6, 7, 8, 9, 10, 11, 12];

  const timerOptions = [30, 45, 60, 90, 120];
  const discussionTimerOptions = [60, 90, 120, 180, 240, 300];

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <ParticleBackground count={20} color="rgba(123,109,141,0.1)" />
      <motion.div
        className="absolute inset-0"
        animate={{ background: ['radial-gradient(circle at 30% 50%, rgba(123,109,141,0.05) 0%, transparent 50%)', 'radial-gradient(circle at 70% 50%, rgba(123,109,141,0.08) 0%, transparent 50%)', 'radial-gradient(circle at 30% 50%, rgba(123,109,141,0.05) 0%, transparent 50%)'] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <motion.div
        className="w-full max-w-lg relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <motion.button
          onClick={() => setScreen('home')}
          whileHover={{ x: -5 }}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </motion.button>

        <motion.div className="flex items-center gap-3 mb-6">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Moon className="w-8 h-8 text-accent-gold" />
          </motion.div>
          <h2 className="font-cinzel text-3xl text-accent-gold">Game Setup</h2>
        </motion.div>

        <div className="space-y-6">
          {/* Player Name */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-text-secondary text-sm mb-2">Your Name</label>
            <motion.input
              type="text"
              value={settings.playerName}
              onChange={e => updateSettings({ playerName: e.target.value })}
              className="w-full bg-bg-secondary border border-accent-purple/30 rounded-xl px-4 py-3 text-text-primary focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/50 transition-all"
              maxLength={20}
              whileFocus={{ scale: 1.01 }}
            />
          </motion.div>

          {/* Player Count */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="flex items-center gap-2 text-text-secondary text-sm mb-3">
              <Users className="w-4 h-4" /> Players: {settings.playerCount}
            </label>
            <div className="flex gap-2 flex-wrap">
              {playerCounts.map(n => (
                <motion.button
                  key={n}
                  onClick={() => updateSettings({ playerCount: n })}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-10 h-10 rounded-xl font-mono text-sm transition-all ${
                    settings.playerCount === n
                      ? 'bg-accent-purple text-white shadow-[0_0_15px_rgba(123,109,141,0.5)]'
                      : 'bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-elevated/80'
                  }`}
                >
                  {n}
                </motion.button>
              ))}
            </div>
            <p className="text-text-muted text-xs mt-2">Includes you + {settings.playerCount - 1} AI bots</p>
          </motion.div>

          {/* AI Difficulty */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="flex items-center gap-2 text-text-secondary text-sm mb-3">
              <Brain className="w-4 h-4" /> AI Difficulty
            </label>
            <div className="grid grid-cols-3 gap-3">
              {difficulties.map(d => (
                <motion.button
                  key={d.value}
                  onClick={() => updateSettings({ aiDifficulty: d.value })}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    settings.aiDifficulty === d.value
                      ? 'border-accent-purple bg-accent-purple/20 text-accent-purple shadow-[0_0_15px_rgba(123,109,141,0.3)]'
                      : 'border-accent-purple/20 bg-bg-secondary text-text-secondary hover:border-accent-purple/40'
                  }`}
                >
                  <div className="font-semibold text-sm">{d.label}</div>
                  <div className="text-xs text-text-muted mt-1">{d.desc}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Timers */}
          <motion.div
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div>
              <label className="flex items-center gap-2 text-text-secondary text-sm mb-3">
                <Clock className="w-4 h-4" /> Night Timer
              </label>
              <div className="flex gap-1 flex-wrap">
                {timerOptions.map(n => (
                  <motion.button
                    key={n}
                    onClick={() => updateSettings({ nightTimerSeconds: n })}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`px-2 py-1.5 rounded-lg font-mono text-xs transition-all ${
                      settings.nightTimerSeconds === n
                        ? 'bg-accent-purple text-white shadow-[0_0_10px_rgba(123,109,141,0.4)]'
                        : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {n}s
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-text-secondary text-sm mb-3">
                <MessageCircle className="w-4 h-4" /> Discussion Timer
              </label>
              <div className="flex gap-1 flex-wrap">
                {discussionTimerOptions.map(n => (
                  <motion.button
                    key={n}
                    onClick={() => updateSettings({ discussionTimerSeconds: n })}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`px-2 py-1.5 rounded-lg font-mono text-xs transition-all ${
                      settings.discussionTimerSeconds === n
                        ? 'bg-accent-purple text-white shadow-[0_0_10px_rgba(123,109,141,0.4)]'
                        : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {n >= 60 ? `${n / 60}m` : `${n}s`}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Role Options */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="flex items-center gap-2 text-text-secondary text-sm mb-3">
              <Sparkles className="w-4 h-4" /> Special Roles
            </label>
            <div className="space-y-2">
              <RoleToggle
                icon={<Eye className="w-4 h-4" />}
                title="Include the Seer"
                desc="Investigates one player each night"
                active={settings.hasSeer}
                onToggle={() => updateSettings({ hasSeer: !settings.hasSeer })}
              />
              <RoleToggle
                icon={<Shield className="w-4 h-4" />}
                title="Include the Bodyguard"
                desc="Protects one player from werewolves each night"
                active={settings.hasBodyguard}
                onToggle={() => updateSettings({ hasBodyguard: !settings.hasBodyguard })}
              />
              <RoleToggle
                icon={<Crosshair className="w-4 h-4" />}
                title="Include the Hunter"
                desc="Takes someone with them when eliminated"
                active={settings.hasHunter}
                onToggle={() => updateSettings({ hasHunter: !settings.hasHunter })}
              />
              <RoleToggle
                icon={<FlaskConical className="w-4 h-4" />}
                title="Include the Witch"
                desc="Has one healing and one poison potion"
                active={settings.hasWitch}
                onToggle={() => updateSettings({ hasWitch: !settings.hasWitch })}
              />
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-text-secondary text-sm mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-accent-gold" /> More Village Roles
              </p>
              <RoleToggle
                icon={<Ghost className="w-4 h-4" />}
                title="Include the Medium"
                desc="Can see dead chat and commune with spirits"
                active={settings.hasMedium}
                onToggle={() => updateSettings({ hasMedium: !settings.hasMedium })}
              />
              <RoleToggle
                icon={<Vote className="w-4 h-4" />}
                title="Include the Mayor"
                desc="Vote counts as two votes"
                active={settings.hasMayor}
                onToggle={() => updateSettings({ hasMayor: !settings.hasMayor })}
              />
              <RoleToggle
                icon={<Swords className="w-4 h-4" />}
                title="Include the Vigilante"
                desc="Has one bullet to shoot at night"
                active={settings.hasVigilante}
                onToggle={() => updateSettings({ hasVigilante: !settings.hasVigilante })}
              />
              <RoleToggle
                icon={<HeartPulse className="w-4 h-4" />}
                title="Include the Doctor"
                desc="Heals one player each night"
                active={settings.hasDoctor}
                onToggle={() => updateSettings({ hasDoctor: !settings.hasDoctor })}
              />
              <RoleToggle
                icon={<Search className="w-4 h-4" />}
                title="Include the Sheriff"
                desc="Investigates exact role each night"
                active={settings.hasSheriff}
                onToggle={() => updateSettings({ hasSheriff: !settings.hasSheriff })}
              />
              <RoleToggle
                icon={<Bone className="w-4 h-4" />}
                title="Include the Gravedigger"
                desc="Learns exact role of dead players"
                active={settings.hasGravedigger}
                onToggle={() => updateSettings({ hasGravedigger: !settings.hasGravedigger })}
              />
              <RoleToggle
                icon={<ScanEye className="w-4 h-4" />}
                title="Include the Lycan"
                desc="Appears as werewolf to investigators"
                active={settings.hasLycan}
                onToggle={() => updateSettings({ hasLycan: !settings.hasLycan })}
              />
              <RoleToggle
                icon={<Crown className="w-4 h-4" />}
                title="Include the Prince"
                desc="Survives first vote elimination"
                active={settings.hasPrince}
                onToggle={() => updateSettings({ hasPrince: !settings.hasPrince })}
              />
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-text-secondary text-sm mb-2 flex items-center gap-2">
                <Skull className="w-4 h-4 text-werewolf-red" /> Wolf Pack Roles
              </p>
              <RoleToggle
                icon={<Crown className="w-4 h-4" />}
                title="Include the Alpha Wolf"
                desc="Their night target overrides all other werewolves"
                active={settings.hasAlphaWolf}
                onToggle={() => updateSettings({ hasAlphaWolf: !settings.hasAlphaWolf })}
              />
              <RoleToggle
                icon={<Wand2 className="w-4 h-4" />}
                title="Include the Sorcerer"
                desc="Investigates players each night to find the Seer"
                active={settings.hasSorcerer}
                onToggle={() => updateSettings({ hasSorcerer: !settings.hasSorcerer })}
              />
              <RoleToggle
                icon={<VenetianMask className="w-4 h-4" />}
                title="Include the Minion"
                desc="Appears as a Villager but wins with the Werewolves"
                active={settings.hasMinion}
                onToggle={() => updateSettings({ hasMinion: !settings.hasMinion })}
              />
              <RoleToggle
                icon={<Eye className="w-4 h-4" />}
                title="Include the Mystic Wolf"
                desc="Can investigate like the Seer"
                active={settings.hasMysticWolf}
                onToggle={() => updateSettings({ hasMysticWolf: !settings.hasMysticWolf })}
              />
              <RoleToggle
                icon={<Bone className="w-4 h-4" />}
                title="Include the Wolf Cub"
                desc="An extra werewolf for the pack"
                active={settings.hasWolfCub}
                onToggle={() => updateSettings({ hasWolfCub: !settings.hasWolfCub })}
              />
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-text-secondary text-sm mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-gold" /> More Special Roles
              </p>
              <RoleToggle
                icon={<Ghost className="w-4 h-4" />}
                title="Include the Medium"
                desc="Sees dead chat and investigates dead players"
                active={settings.hasMedium}
                onToggle={() => updateSettings({ hasMedium: !settings.hasMedium })}
              />
              <RoleToggle
                icon={<Vote className="w-4 h-4" />}
                title="Include the Mayor"
                desc="Vote counts as two during the day"
                active={settings.hasMayor}
                onToggle={() => updateSettings({ hasMayor: !settings.hasMayor })}
              />
              <RoleToggle
                icon={<Swords className="w-4 h-4" />}
                title="Include the Vigilante"
                desc="One-time night kill ability"
                active={settings.hasVigilante}
                onToggle={() => updateSettings({ hasVigilante: !settings.hasVigilante })}
              />
              <RoleToggle
                icon={<HeartPulse className="w-4 h-4" />}
                title="Include the Doctor"
                desc="Heals one player each night"
                active={settings.hasDoctor}
                onToggle={() => updateSettings({ hasDoctor: !settings.hasDoctor })}
              />
              <RoleToggle
                icon={<Search className="w-4 h-4" />}
                title="Include the Sheriff"
                desc="Exact role investigation each night"
                active={settings.hasSheriff}
                onToggle={() => updateSettings({ hasSheriff: !settings.hasSheriff })}
              />
              <RoleToggle
                icon={<Archive className="w-4 h-4" />}
                title="Include the Gravedigger"
                desc="Auto-learns dead role at dawn"
                active={settings.hasGravedigger}
                onToggle={() => updateSettings({ hasGravedigger: !settings.hasGravedigger })}
              />
              <RoleToggle
                icon={<ScanEye className="w-4 h-4" />}
                title="Include the Mystic Wolf"
                desc="Investigates like the Seer"
                active={settings.hasMysticWolf}
                onToggle={() => updateSettings({ hasMysticWolf: !settings.hasMysticWolf })}
              />
              <RoleToggle
                icon={<Bone className="w-4 h-4" />}
                title="Include the Wolf Cub"
                desc="Basic werewolf"
                active={settings.hasWolfCub}
                onToggle={() => updateSettings({ hasWolfCub: !settings.hasWolfCub })}
              />
              <RoleToggle
                icon={<Eclipse className="w-4 h-4" />}
                title="Include the Lycan"
                desc="Appears as wolf to investigations"
                active={settings.hasLycan}
                onToggle={() => updateSettings({ hasLycan: !settings.hasLycan })}
              />
              <RoleToggle
                icon={<Gem className="w-4 h-4" />}
                title="Include the Prince"
                desc="Survives first vote elimination"
                active={settings.hasPrince}
                onToggle={() => updateSettings({ hasPrince: !settings.hasPrince })}
              />
            </div>
          </motion.div>

          {/* Start Button */}
          <motion.button
            onClick={createGame}
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(212,168,67,0.5)' }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 bg-accent-gold hover:bg-accent-gold/90 text-[#1A1833] font-bold py-4 rounded-xl transition-all text-lg"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Play className="w-5 h-5" />
            </motion.div>
            Start Game
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

function RoleToggle({ icon, title, desc, active, onToggle }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.01, x: 3 }}
      whileTap={{ scale: 0.99 }}
      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
        active
          ? 'border-accent-purple bg-accent-purple/20 shadow-[0_0_10px_rgba(123,109,141,0.2)]'
          : 'border-accent-purple/20 bg-bg-secondary'
      }`}
    >
      <div className="flex items-center gap-3">
        <motion.div
          className={active ? 'text-accent-purple' : 'text-text-muted'}
          animate={active ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {icon}
        </motion.div>
        <div>
          <div className="text-text-primary font-medium text-sm">{title}</div>
          <div className="text-text-muted text-xs">{desc}</div>
        </div>
      </div>
      <motion.div
        className={`w-5 h-5 rounded border flex items-center justify-center ${active ? 'bg-accent-purple border-accent-purple' : 'border-text-muted'}`}
        animate={active ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {active && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </motion.div>
    </motion.button>
  );
}
