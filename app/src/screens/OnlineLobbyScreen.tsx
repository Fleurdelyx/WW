import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useState } from 'react';
import { ArrowLeft, Globe, Plus, LogIn, Users } from 'lucide-react';

export default function OnlineLobbyScreen() {
  const { setScreen, createRoom, joinRoom, updateSettings, state } = useGameStore();
  const [name, setName] = useState(state.settings.playerName);
  const [roomCode, setRoomCode] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return;
    updateSettings({ playerName: name.trim() });
    setIsLoading(true);
    createRoom(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim() || !roomCode.trim()) return;
    updateSettings({ playerName: name.trim() });
    setIsLoading(true);
    joinRoom(roomCode.trim().toUpperCase(), name.trim());
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => setScreen('home')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-center mb-8">
          <Globe className="w-10 h-10 text-accent-blue mx-auto mb-3" />
          <h2 className="font-cinzel text-3xl text-accent-gold">Play Online</h2>
          <p className="text-text-secondary text-sm mt-1">Create or join a room with friends</p>
        </div>

        {/* Name Input */}
        <div className="mb-6">
          <label className="block text-text-secondary text-sm mb-2">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-bg-secondary border border-accent-purple/30 rounded-lg px-4 py-3 text-text-primary focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/50"
            maxLength={20}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (tab === 'create') handleCreate();
                else handleJoin();
              }
            }}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              tab === 'create'
                ? 'bg-accent-purple text-white'
                : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            <Plus className="w-4 h-4" /> Create Room
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              tab === 'join'
                ? 'bg-accent-purple text-white'
                : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            <LogIn className="w-4 h-4" /> Join Room
          </button>
        </div>

        {tab === 'create' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-bg-secondary/60 border border-accent-purple/20 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-accent-gold" />
                <span className="text-text-primary font-medium">Create a new room</span>
              </div>
              <p className="text-text-secondary text-sm">
                You'll get a 4-letter room code to share with friends. You need 4-12 players to start.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              disabled={!name.trim() || isLoading}
              className="w-full flex items-center justify-center gap-2 bg-accent-gold hover:bg-accent-gold/90 disabled:bg-bg-elevated disabled:text-text-muted text-[#1A1833] font-bold py-4 rounded-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              {isLoading ? 'Creating...' : 'Create Room'}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-4">
              <label className="block text-text-secondary text-sm mb-2">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. AB12"
                className="w-full bg-bg-secondary border border-accent-purple/30 rounded-lg px-4 py-3 text-text-primary font-mono tracking-widest uppercase focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/50"
                maxLength={4}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleJoin}
              disabled={!name.trim() || roomCode.length < 4 || isLoading}
              className="w-full flex items-center justify-center gap-2 bg-accent-gold hover:bg-accent-gold/90 disabled:bg-bg-elevated disabled:text-text-muted text-[#1A1833] font-bold py-4 rounded-lg transition-all"
            >
              <LogIn className="w-5 h-5" />
              {isLoading ? 'Joining...' : 'Join Room'}
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
