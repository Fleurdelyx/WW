import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useState, useRef, useEffect } from 'react';
import { Sun, Users, MessageSquare, Vote, Skull, Send } from 'lucide-react';
import type { Player } from '@/types/game';

function PlayerCard({ player, isSelected, onClick, voteCount, showRole }: {
  player: Player; isSelected: boolean; onClick: () => void; voteCount: number; showRole: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={player.isAlive ? { scale: 1.05, y: -2 } : {}}
      whileTap={player.isAlive ? { scale: 0.95 } : {}}
      className={`relative p-3 rounded-xl border-2 text-center transition-all ${
        !player.isAlive
          ? 'border-dead-gray/50 bg-dead-gray/20 opacity-50'
          : isSelected
          ? 'border-accent-gold bg-accent-gold/20 shadow-[0_0_20px_rgba(212,168,67,0.3)]'
          : 'border-accent-purple/30 bg-bg-secondary/80 hover:border-accent-purple/60'
      }`}
      disabled={!player.isAlive}
    >
      <div className="text-2xl mb-1 relative">
        {player.isAlive ? player.avatar : <Skull className="w-6 h-6 mx-auto text-dead-gray" />}
        {voteCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-gold text-[#1A1833] text-xs font-bold rounded-full flex items-center justify-center">
            {voteCount}
          </span>
        )}
      </div>
      <div className={`text-xs font-medium truncate ${player.isAlive ? 'text-text-primary' : 'text-text-muted line-through'}`}>
        {player.name}
      </div>
      {!player.isAlive && (
        <div className="text-[10px] text-dead-gray mt-0.5">eliminated</div>
      )}
    </motion.button>
  );
}

export default function DayScreen() {
  const { state, castVote, sendChat, startVoting } = useGameStore();
  const { players, humanPlayerId, logs, round, executionResult, chatMessages, mode, phase: gamePhase, isHost } = state;
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [localPhase, setLocalPhase] = useState<'discussion' | 'voting'>('discussion');
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const human = players.find(p => p.id === humanPlayerId);

  const isOnline = mode === 'online';
  const phase = isOnline ? (gamePhase === 'voting' ? 'voting' : 'discussion') : localPhase;

  const alivePlayers = players.filter(p => p.isAlive);
  const aliveCount = alivePlayers.length;
  const wolfCount = state.aliveWerewolfCount ?? alivePlayers.filter(p => p.faction === 'werewolf').length;

  const prevVoteCounts = executionResult?.voteCounts || {};

  const handleVote = () => {
    if (selectedTarget) {
      castVote(selectedTarget);
    }
  };

  const handleStartVoting = () => {
    if (isOnline) {
      startVoting();
    } else {
      setLocalPhase('voting');
    }
  };

  const handleSendChat = () => {
    if (chatInput.trim()) {
      sendChat(chatInput.trim());
      setChatInput('');
    }
  };

  const relevantLogs = logs.filter(l => l.round === round || l.type === 'death');
  const currentChat = (chatMessages || []).filter(m => m.round === round);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, chatMessages, round]);

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Top Bar */}
      <div className="bg-bg-secondary/80 border-b border-accent-purple/20 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-accent-gold" />
            <span className="font-cinzel text-accent-gold font-semibold">Day {round}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-text-secondary">
              <Users className="w-4 h-4" />
              <span>{aliveCount} alive</span>
            </div>
            <div className="flex items-center gap-1 text-werewolf-red">
              <Skull className="w-4 h-4" />
              <span>{wolfCount} wolves</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 flex flex-col gap-4">
        {/* Status Banner */}
        <motion.div
          className="bg-accent-blue/10 border border-accent-blue/30 rounded-lg p-3 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {phase === 'discussion' ? (
            <p className="text-text-primary text-sm">
              <MessageSquare className="w-4 h-4 inline mr-1 text-accent-blue" />
              Discuss who you suspect! Chat below, then start voting.
            </p>
          ) : (
            <p className="text-text-primary text-sm">
              <Vote className="w-4 h-4 inline mr-1 text-accent-gold" />
              Voting is open! Choose who to eliminate.
            </p>
          )}
        </motion.div>

        {/* Player Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {players.map((player, i) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <PlayerCard
                player={player}
                isSelected={phase === 'voting' && selectedTarget === player.id}
                onClick={() => {
                  if (phase === 'voting' && player.isAlive && player.id !== humanPlayerId) {
                    setSelectedTarget(player.id);
                  }
                }}
                voteCount={prevVoteCounts[player.id] || 0}
                showRole={false}
              />
            </motion.div>
          ))}
        </div>

        {/* Chat / Log Panel */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="bg-bg-secondary/60 border border-accent-purple/20 rounded-lg flex flex-col h-56">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {/* Chat messages */}
              <AnimatePresence>
                {currentChat.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-xs ${msg.senderId === humanPlayerId ? 'text-accent-gold' : 'text-text-secondary'}`}
                  >
                    <span className="font-semibold">{msg.senderName}:</span>{' '}
                    {msg.message}
                  </motion.div>
                ))}
              </AnimatePresence>
              {/* System logs */}
              {relevantLogs.slice(-15).map(log => (
                <div key={log.id} className={`text-xs ${
                  log.type === 'death' ? 'text-werewolf-red' :
                  log.type === 'vote' ? 'text-accent-gold' :
                  log.type === 'reveal' ? 'text-accent-purple' :
                  'text-text-secondary'
                }`}>
                  <span className="text-text-muted">[D{log.round}]</span>{' '}
                  {log.message}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            {phase === 'discussion' && (
              <div className="border-t border-accent-purple/20 p-2 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                  placeholder="Say something..."
                  className="flex-1 bg-bg-primary border border-accent-purple/30 rounded px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:border-accent-purple focus:outline-none"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  className="bg-accent-purple hover:bg-accent-purple/80 disabled:bg-bg-elevated disabled:text-text-muted text-white px-3 py-2 rounded transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pb-4">
          {phase === 'discussion' ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartVoting}
              disabled={isOnline && !isHost}
              className="w-full flex items-center justify-center gap-2 bg-accent-gold hover:bg-accent-gold/90 disabled:bg-bg-elevated disabled:text-text-muted text-[#1A1833] font-bold py-3 rounded-lg transition-all"
            >
              <Vote className="w-5 h-5" />
              {isOnline && !isHost ? 'Waiting for host...' : 'Start Voting'}
            </motion.button>
          ) : (
            <div className="space-y-2">
              {selectedTarget && (
                <p className="text-center text-text-secondary text-sm">
                  You are voting to eliminate: <span className="text-accent-gold font-semibold">
                    {players.find(p => p.id === selectedTarget)?.name}
                  </span>
                </p>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleVote}
                disabled={!selectedTarget}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  selectedTarget
                    ? 'bg-werewolf-red hover:bg-werewolf-red/90 text-white shadow-[0_0_15px_rgba(139,58,58,0.4)]'
                    : 'bg-bg-elevated text-text-muted cursor-not-allowed'
                }`}
              >
                <Skull className="w-4 h-4 inline mr-2" />
                Cast Vote
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
