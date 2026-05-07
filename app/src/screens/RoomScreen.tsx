import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Users, Crown, Play, ArrowLeft, Copy, Check, Eye, Shield, Crosshair, FlaskConical, Clock, MessageCircle, Settings2, Sparkles, Wifi, Wand2, VenetianMask, Skull } from 'lucide-react';
import { useState } from 'react';
import PlayerAvatar from '@/components/PlayerAvatar';
import ParticleBackground from '@/components/ParticleBackground';

export default function RoomScreen() {
  const { state, leaveRoom, startOnlineGame, updateSettings } = useGameStore();
  const { players, roomCode, isHost, settings } = state;
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const count = players.length;
  const canStart = count >= 4 && count <= 12;

  const handleCopy = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const timerOptions = [30, 45, 60, 90, 120];
  const discussionTimerOptions = [60, 90, 120, 180, 240, 300];

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <ParticleBackground count={15} color="rgba(123,109,141,0.1)" />

      <motion.div
        className="w-full max-w-lg relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring' }}
      >
        <motion.button
          onClick={leaveRoom}
          whileHover={{ x: -5 }}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Leave Room
        </motion.button>

        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Wifi className="w-10 h-10 text-accent-blue mx-auto mb-3" />
          </motion.div>
          <motion.h2
            className="font-cinzel text-3xl text-accent-gold mb-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring' }}
          >
            Waiting Room
          </motion.h2>
          <motion.div
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-text-secondary">Room Code:</p>
            <motion.button
              onClick={handleCopy}
              whileHover={{ scale: 1.05, borderColor: 'rgba(123,109,141,0.8)' }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 bg-bg-secondary border border-accent-purple/30 rounded-xl px-4 py-2 hover:border-accent-purple/60 transition-all"
            >
              <span className="font-mono text-xl text-accent-gold tracking-[0.2em]">{roomCode}</span>
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="w-4 h-4 text-green-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Copy className="w-4 h-4 text-text-muted" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </div>

        {/* Player List */}
        <motion.div
          className="bg-bg-secondary/60 border border-accent-purple/20 rounded-xl p-4 mb-6 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <Users className="w-4 h-4" />
              <span>{count} / 12 players</span>
            </div>
            <motion.span
              className={`text-xs px-2 py-1 rounded-full ${canStart ? 'text-green-400 bg-green-400/10' : 'text-text-muted bg-bg-elevated'}`}
              animate={canStart ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {canStart ? 'Ready to start' : 'Need at least 4 players'}
            </motion.span>
          </div>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {players.map((player, i) => (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.9 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
                  className="flex items-center gap-3 bg-bg-primary/50 rounded-xl px-3 py-2.5 hover:bg-bg-primary/70 transition-colors"
                >
                  <motion.div whileHover={{ scale: 1.2, rotate: 10 }}>
                    <PlayerAvatar avatar={player.avatar} size="sm" />
                  </motion.div>
                  <span className="text-text-primary text-sm font-medium flex-1">{player.name}</span>
                  {player.id === state.humanPlayerId && (
                    <motion.span
                      className="text-xs text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded-full"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      You
                    </motion.span>
                  )}
                  {i === 0 && (
                    <motion.span
                      className="flex items-center gap-1 text-xs text-accent-gold bg-accent-gold/10 px-2 py-0.5 rounded-full"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Crown className="w-3 h-3" /> Host
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Settings Panel */}
        <AnimatePresence>
          {isHost && (
            <motion.div
              className="bg-bg-secondary/60 border border-accent-purple/20 rounded-xl p-4 mb-6 backdrop-blur-sm"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <motion.button
                onClick={() => setShowSettings(!showSettings)}
                whileHover={{ x: 3 }}
                className="flex items-center gap-2 text-text-secondary text-sm mb-3 w-full"
              >
                <Settings2 className="w-4 h-4" />
                <span>Game Settings</span>
                <motion.div
                  animate={{ rotate: showSettings ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="ml-auto"
                >
                  <Sparkles className="w-3 h-3" />
                </motion.div>
              </motion.button>
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-1 text-text-muted text-xs mb-2">
                          <Clock className="w-3 h-3" /> Night Timer
                        </label>
                        <div className="flex gap-1 flex-wrap">
                          {timerOptions.map(n => (
                            <motion.button
                              key={n}
                              onClick={() => updateSettings({ nightTimerSeconds: n })}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className={`px-2 py-1 rounded-lg text-xs transition-all ${
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
                        <label className="flex items-center gap-1 text-text-muted text-xs mb-2">
                          <MessageCircle className="w-3 h-3" /> Discussion Timer
                        </label>
                        <div className="flex gap-1 flex-wrap">
                          {discussionTimerOptions.map(n => (
                            <motion.button
                              key={n}
                              onClick={() => updateSettings({ discussionTimerSeconds: n })}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className={`px-2 py-1 rounded-lg text-xs transition-all ${
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
                    </div>
                    <div className="space-y-2">
                      <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">Village Roles</p>
                      <RoleToggle icon={<Eye className="w-3 h-3" />} title="Seer" active={settings.hasSeer} onToggle={() => updateSettings({ hasSeer: !settings.hasSeer })} />
                      <RoleToggle icon={<Shield className="w-3 h-3" />} title="Bodyguard" active={settings.hasBodyguard} onToggle={() => updateSettings({ hasBodyguard: !settings.hasBodyguard })} />
                      <RoleToggle icon={<Crosshair className="w-3 h-3" />} title="Hunter" active={settings.hasHunter} onToggle={() => updateSettings({ hasHunter: !settings.hasHunter })} />
                      <RoleToggle icon={<FlaskConical className="w-3 h-3" />} title="Witch" active={settings.hasWitch} onToggle={() => updateSettings({ hasWitch: !settings.hasWitch })} />
                    </div>
                    <div className="space-y-2 mt-3">
                      <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">Wolf Pack</p>
                      <RoleToggle icon={<Crown className="w-3 h-3" />} title="Alpha Wolf" active={settings.hasAlphaWolf} onToggle={() => updateSettings({ hasAlphaWolf: !settings.hasAlphaWolf })} />
                      <RoleToggle icon={<Wand2 className="w-3 h-3" />} title="Sorcerer" active={settings.hasSorcerer} onToggle={() => updateSettings({ hasSorcerer: !settings.hasSorcerer })} />
                      <RoleToggle icon={<VenetianMask className="w-3 h-3" />} title="Minion" active={settings.hasMinion} onToggle={() => updateSettings({ hasMinion: !settings.hasMinion })} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {isHost ? (
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(212,168,67,0.5)' }}
            whileTap={{ scale: 0.97 }}
            onClick={startOnlineGame}
            disabled={!canStart}
            className="w-full flex items-center justify-center gap-2 bg-accent-gold hover:bg-accent-gold/90 disabled:bg-bg-elevated disabled:text-text-muted text-[#1A1833] font-bold py-4 rounded-xl transition-all text-lg"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Play className="w-5 h-5" />
            </motion.div>
            Start Game
          </motion.button>
        ) : (
          <motion.div
            className="text-center text-text-secondary text-sm py-4"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Waiting for host to start the game...
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function RoleToggle({ icon, title, active, onToggle }: {
  icon: React.ReactNode;
  title: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.02, x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full p-2 rounded-lg border text-left transition-all flex items-center justify-between ${
        active
          ? 'border-accent-purple bg-accent-purple/20'
          : 'border-accent-purple/20 bg-bg-primary/50'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={active ? 'text-accent-purple' : 'text-text-muted'}>{icon}</div>
        <div className="text-text-primary text-xs font-medium">{title}</div>
      </div>
      <motion.div
        className={`w-4 h-4 rounded border flex items-center justify-center ${active ? 'bg-accent-purple border-accent-purple' : 'border-text-muted'}`}
        animate={active ? { scale: [1, 1.2, 1] } : {}}
      >
        {active && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </motion.div>
    </motion.button>
  );
}
