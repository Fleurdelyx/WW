import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import type { AiDifficulty } from '@/types/game';
import { ArrowLeft, Users, Brain, Eye, Play } from 'lucide-react';

export default function LobbyScreen() {
  const { state, updateSettings, createGame, setScreen } = useGameStore();
  const { settings } = state;

  const difficulties: { value: AiDifficulty; label: string; desc: string }[] = [
    { value: 'easy', label: 'Easy', desc: 'AI makes random choices' },
    { value: 'medium', label: 'Medium', desc: 'AI uses basic strategy' },
    { value: 'hard', label: 'Hard', desc: 'AI plays optimally' },
  ];

  const playerCounts = [6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Back button */}
        <button onClick={() => setScreen('home')} className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h2 className="font-cinzel text-3xl text-accent-gold mb-6">Game Setup</h2>

        <div className="space-y-6">
          {/* Player Name */}
          <div>
            <label className="block text-text-secondary text-sm mb-2">Your Name</label>
            <input
              type="text"
              value={settings.playerName}
              onChange={e => updateSettings({ playerName: e.target.value })}
              className="w-full bg-bg-secondary border border-accent-purple/30 rounded-lg px-4 py-3 text-text-primary focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/50"
              maxLength={20}
            />
          </div>

          {/* Player Count */}
          <div>
            <label className="flex items-center gap-2 text-text-secondary text-sm mb-3">
              <Users className="w-4 h-4" /> Players: {settings.playerCount}
            </label>
            <div className="flex gap-2 flex-wrap">
              {playerCounts.map(n => (
                <button
                  key={n}
                  onClick={() => updateSettings({ playerCount: n })}
                  className={`w-10 h-10 rounded-lg font-mono text-sm transition-all ${
                    settings.playerCount === n
                      ? 'bg-accent-purple text-white shadow-[0_0_10px_rgba(123,109,141,0.4)]'
                      : 'bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-elevated/80'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-text-muted text-xs mt-2">Includes you + {settings.playerCount - 1} AI bots</p>
          </div>

          {/* AI Difficulty */}
          <div>
            <label className="flex items-center gap-2 text-text-secondary text-sm mb-3">
              <Brain className="w-4 h-4" /> AI Difficulty
            </label>
            <div className="grid grid-cols-3 gap-3">
              {difficulties.map(d => (
                <button
                  key={d.value}
                  onClick={() => updateSettings({ aiDifficulty: d.value })}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    settings.aiDifficulty === d.value
                      ? 'border-accent-purple bg-accent-purple/20 text-accent-purple'
                      : 'border-accent-purple/20 bg-bg-secondary text-text-secondary hover:border-accent-purple/40'
                  }`}
                >
                  <div className="font-semibold text-sm">{d.label}</div>
                  <div className="text-xs text-text-muted mt-1">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Role Options */}
          <div>
            <label className="flex items-center gap-2 text-text-secondary text-sm mb-3">
              <Eye className="w-4 h-4" /> Special Roles
            </label>
            <button
              onClick={() => updateSettings({ hasSeer: !settings.hasSeer })}
              className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                settings.hasSeer
                  ? 'border-accent-purple bg-accent-purple/20'
                  : 'border-accent-purple/20 bg-bg-secondary'
              }`}
            >
              <div>
                <div className="text-text-primary font-medium text-sm">Include the Seer</div>
                <div className="text-text-muted text-xs">A villager who can investigate players at night</div>
              </div>
              <div className={`w-5 h-5 rounded border flex items-center justify-center ${settings.hasSeer ? 'bg-accent-purple border-accent-purple' : 'border-text-muted'}`}>
                {settings.hasSeer && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
            </button>
          </div>

          {/* Start Button */}
          <motion.button
            onClick={createGame}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 bg-accent-gold hover:bg-accent-gold/90 text-[#1A1833] font-bold py-4 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(212,168,67,0.4)]"
          >
            <Play className="w-5 h-5" />
            Start Game
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
