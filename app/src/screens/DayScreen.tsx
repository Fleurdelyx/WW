import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useState, useRef, useEffect } from 'react';
import { Sun, Users, MessageSquare, Vote, Skull, Send, Clock, FastForward, Zap, Flame, User, Crown, MessageCircle } from 'lucide-react';
import type { Player } from '@/types/game';
import PlayerAvatar from '@/components/PlayerAvatar';
import CountdownRing from '@/components/CountdownRing';
import AnimatedPlayerCard from '@/components/AnimatedPlayerCard';
import ParticleBackground, { FogLayer } from '@/components/ParticleBackground';
import { ToastContainer, useToasts } from '@/components/ToastNotification';
import { getTrueFaction, getRoleTooltip } from '@/engine/gameEngine';

function ChatBubble({ msg, humanId, isWhisper }: { msg: { senderId: string; senderName: string; message: string }; humanId: string; isWhisper?: boolean }) {
  const isMe = msg.senderId === humanId;
  if (isWhisper) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="flex justify-center"
      >
        <div className="max-w-[80%] px-3 py-1.5 rounded-2xl text-xs italic text-text-muted/60 bg-bg-elevated/30 border border-accent-purple/10 rounded-br-md rounded-bl-md">
          <span className="font-bold">Whisper from {msg.senderName}:</span> {msg.message}
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, x: isMe ? 30 : -30, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${
        isMe
          ? 'bg-accent-purple/30 text-accent-gold rounded-br-md border border-accent-purple/30'
          : 'bg-bg-elevated/60 text-text-secondary rounded-bl-md border border-accent-purple/20'
      }`}>
        <span className={`font-bold block mb-0.5 ${isMe ? 'text-accent-gold' : 'text-text-primary'}`}>{msg.senderName}</span>
        {msg.message}
      </div>
    </motion.div>
  );
}

export default function DayScreen() {
  const { state, castVote, sendChat, startVoting, voteSkipDiscussion, aiAutoChat, sendWhisper, sendDeadChat } = useGameStore();
  const { players, humanPlayerId, logs, round, executionResult, chatMessages, mode, phase: gamePhase, isHost, settings, skipVotes, deadChatMessages, whispers } = state;
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [localPhase, setLocalPhase] = useState<'discussion' | 'voting'>('discussion');
  const [chatInput, setChatInput] = useState('');
  const [showDeadChat, setShowDeadChat] = useState(false);
  const [whisperTarget, setWhisperTarget] = useState<string | null>(null);
  const [whisperInput, setWhisperInput] = useState('');
  const [discussionTimer, setDiscussionTimer] = useState(settings.discussionTimerSeconds);
  const [tensionShake, setTensionShake] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatLenRef = useRef(0);
  const deadChatLenRef = useRef(0);
  const whispersLenRef = useRef(0);
  const human = players.find(p => p.id === humanPlayerId);
  const { toasts, addToast, removeToast } = useToasts();

  const isOnline = mode === 'online';
  const phase = isOnline ? (gamePhase === 'voting' ? 'voting' : 'discussion') : localPhase;
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const alivePlayers = players.filter(p => p.isAlive);
  const aliveCount = alivePlayers.length;
  const wolfCount = state.aliveWerewolfCount ?? alivePlayers.filter(p => getTrueFaction(p.role) === 'werewolf').length;

  const prevVoteCounts = executionResult?.voteCounts || {};

  const canSeeDeadChat = !human?.isAlive || human?.role === 'medium';

  // Tension shake effect during voting
  useEffect(() => {
    if (phase === 'voting') {
      const interval = setInterval(() => {
        setTensionShake(Math.random() * 2 - 1);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Discussion timer
  useEffect(() => {
    if (phase !== 'discussion') return;
    const interval = setInterval(() => {
      setDiscussionTimer(t => {
        if (t <= 1) {
          clearInterval(interval);
          if (!isOnline) {
            setLocalPhase('voting');
            addToast('Time is up! Voting begins.', 'system');
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, isOnline, addToast]);

  useEffect(() => {
    setDiscussionTimer(settings.discussionTimerSeconds);
  }, [round, settings.discussionTimerSeconds]);

  const handleVote = () => {
    if (!human?.isAlive) {
      addToast('You are dead. You cannot vote.', 'system');
      return;
    }
    if (selectedTarget) {
      const targetName = players.find(p => p.id === selectedTarget)?.name;
      addToast(`You voted to eliminate ${targetName}`, 'vote');
      castVote(selectedTarget);
    }
  };

  const handleStartVoting = () => {
    if (isOnline) {
      startVoting();
    } else {
      setLocalPhase('voting');
      addToast('Voting has begun!', 'system');
    }
  };

  const handleSendChat = () => {
    if (chatInput.trim()) {
      if (showDeadChat && canSeeDeadChat) {
        sendDeadChat(chatInput.trim());
      } else {
        sendChat(chatInput.trim());
      }
      setChatInput('');
    }
  };

  const handleSendWhisper = () => {
    if (whisperInput.trim() && whisperTarget) {
      sendWhisper(whisperTarget, whisperInput.trim());
      setWhisperInput('');
      setWhisperTarget(null);
      addToast(`Whisper sent to ${players.find(p => p.id === whisperTarget)?.name}`, 'system');
    }
  };

  const handleSkipVote = () => {
    voteSkipDiscussion();
    addToast('You voted to skip discussion', 'system');
  };

  const relevantLogs = logs.filter(l => (l.round === round || l.type === 'death') && l.type !== 'chat');
  const currentChat = (chatMessages || []).filter(m => m.round === round);
  const currentDeadChat = (deadChatMessages || []).filter(m => m.round === round);
  const currentWhispers = (whispers || []).filter(m => m.round === round);

  const skipCount = Object.keys(skipVotes).length;
  const majority = Math.floor(aliveCount / 2) + 1;
  const hasSkipVoted = !!skipVotes[humanPlayerId];

  // Only auto-scroll when new messages arrive AND user is near bottom
  useEffect(() => {
    const chatLen = currentChat.length;
    const deadLen = currentDeadChat.length;
    const whispLen = currentWhispers.length;
    const hasNew = chatLen > chatLenRef.current || deadLen > deadChatLenRef.current || whispLen > whispersLenRef.current;
    chatLenRef.current = chatLen;
    deadChatLenRef.current = deadLen;
    whispersLenRef.current = whispLen;
    if (hasNew) {
      const container = chatContainerRef.current;
      if (container) {
        const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
        if (isNearBottom) {
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      }
    }
  }, [currentChat.length, currentDeadChat.length, currentWhispers.length]);

  useEffect(() => {
    if (!isOnline && phase === 'discussion' && skipCount >= majority) {
      setLocalPhase('voting');
      addToast('Majority voted to skip! Voting begins.', 'system');
    }
  }, [skipCount, majority, phase, isOnline, addToast]);

  // Periodic AI chat during discussion
  useEffect(() => {
    if (isOnline || phase !== 'discussion') return;
    const scheduleNext = () => {
      const delay = 6000 + Math.floor(Math.random() * 10000); // 6-16 seconds
      return setTimeout(() => {
        aiAutoChat();
        if (phaseRef.current === 'discussion') {
          timerId = scheduleNext();
        }
      }, delay);
    };
    let timerId = scheduleNext();
    return () => clearTimeout(timerId);
  }, [phase, isOnline, aiAutoChat]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getPlayerTooltip = (player: Player) => {
    if (player.id === humanPlayerId) return getRoleTooltip(player.role);
    if (!player.isAlive) return getRoleTooltip(player.role);
    return getRoleTooltip('unknown');
  };

  const isRoleRevealed = (player: Player) => {
    return player.id === humanPlayerId || !player.isAlive;
  };

  return (
    <motion.div
      className="min-h-screen bg-bg-primary flex flex-col relative"
      animate={{ x: tensionShake }}
      transition={{ duration: 0.1 }}
    >
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <FogLayer />
      <ParticleBackground count={20} color="rgba(212,168,67,0.1)" />

      {/* Top Bar */}
      <motion.div
        className="bg-bg-secondary/80 border-b border-accent-purple/20 px-4 py-3 backdrop-blur-sm"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring' }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Sun className="w-5 h-5 text-accent-gold" />
            </motion.div>
            <span className="font-cinzel text-accent-gold font-semibold text-lg">Day {round}</span>
          </motion.div>
          <div className="flex items-center gap-4 text-sm">
            {phase === 'discussion' && (
              <motion.div
                className="flex items-center gap-1"
                animate={discussionTimer <= 30 ? { x: [0, -2, 2, 0] } : {}}
                transition={{ duration: 0.3, repeat: discussionTimer <= 30 ? Infinity : 0 }}
              >
                <Clock className={`w-4 h-4 ${discussionTimer <= 30 ? 'text-werewolf-red' : 'text-text-secondary'}`} />
                <span className={discussionTimer <= 30 ? 'text-werewolf-red font-bold animate-pulse' : 'text-text-secondary'}>
                  {formatTime(discussionTimer)}
                </span>
              </motion.div>
            )}
            <motion.div className="flex items-center gap-1 text-text-secondary" whileHover={{ scale: 1.1 }}>
              <Users className="w-4 h-4" />
              <span>{aliveCount} alive</span>
            </motion.div>
            <motion.div className="flex items-center gap-1 text-werewolf-red" whileHover={{ scale: 1.1 }}>
              <Skull className="w-4 h-4" />
              <span>{wolfCount} wolves</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 flex flex-col gap-4">
        {/* Status Banner */}
        <motion.div
          className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-3 text-center backdrop-blur-sm"
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring' }}
        >
          {phase === 'discussion' ? (
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <motion.p className="text-text-primary text-sm" animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 3, repeat: Infinity }}>
                <MessageSquare className="w-4 h-4 inline mr-1 text-accent-blue" />
                Discuss who you suspect! Chat below, then start voting.
              </motion.p>
              <motion.div
                className="flex items-center gap-2 text-xs text-text-muted bg-bg-secondary/60 px-3 py-1 rounded-full"
                whileHover={{ scale: 1.05 }}
              >
                <FastForward className="w-3 h-3" />
                <span>{skipCount}/{majority} skip votes</span>
                <motion.div className="w-16 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-accent-gold rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (skipCount / majority) * 100)}%` }}
                    transition={{ type: 'spring' }}
                  />
                </motion.div>
              </motion.div>
            </div>
          ) : (
            <motion.p
              className="text-text-primary text-sm font-medium"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Vote className="w-4 h-4 inline mr-1 text-accent-gold" />
              </motion.span>
              Voting is open! Choose who to eliminate.
            </motion.p>
          )}
        </motion.div>

        {/* Player Grid */}
        <motion.div className="grid grid-cols-3 sm:grid-cols-4 gap-3" layout>
          <AnimatePresence mode="popLayout">
            {players.map((player, i) => (
              <div key={player.id} className="relative">
                <AnimatedPlayerCard
                  player={player}
                  isSelected={phase === 'voting' && selectedTarget === player.id}
                  onClick={() => {
                    if (phase === 'voting' && player.isAlive && player.id !== humanPlayerId && human?.isAlive) {
                      setSelectedTarget(player.id);
                    }
                  }}
                  voteCount={prevVoteCounts[player.id] || 0}
                  index={i}
                  tooltip={getPlayerTooltip(player)}
                  isMayor={player.role === 'mayor' && isRoleRevealed(player)}
                />
                {phase === 'discussion' && player.isAlive && player.id !== humanPlayerId && human?.isAlive && (
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); setWhisperTarget(player.id); }}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] bg-accent-purple/80 hover:bg-accent-purple text-white px-1.5 py-0.5 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    whileHover={{ scale: 1.1 }}
                    style={{ opacity: 1 }}
                  >
                    Whisper
                  </motion.button>
                )}
              </div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Whisper Input */}
        <AnimatePresence>
          {whisperTarget && (
            <motion.div
              className="bg-bg-secondary border border-accent-purple/30 rounded-xl p-3 flex items-center gap-2 shadow-xl"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
            >
              <MessageCircle className="w-4 h-4 text-accent-purple" />
              <span className="text-xs text-text-muted whitespace-nowrap">
                To {players.find(p => p.id === whisperTarget)?.name}:
              </span>
              <input
                type="text"
                value={whisperInput}
                onChange={e => setWhisperInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendWhisper()}
                placeholder="Type a private message..."
                className="flex-1 bg-bg-primary border border-accent-purple/30 rounded-lg px-3 py-1.5 text-text-primary text-sm placeholder:text-text-muted focus:border-accent-purple focus:outline-none"
                autoFocus
              />
              <motion.button
                onClick={handleSendWhisper}
                disabled={!whisperInput.trim()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="bg-accent-purple hover:bg-accent-purple/80 disabled:bg-bg-elevated disabled:text-text-muted text-white px-3 py-1.5 rounded-lg transition-all text-xs"
              >
                Send
              </motion.button>
              <motion.button
                onClick={() => setWhisperTarget(null)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-text-muted hover:text-text-primary px-2 py-1.5 text-xs"
              >
                ✕
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat / Log Panel */}
        <motion.div
          className="flex-1 min-h-0 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-bg-secondary/60 border border-accent-purple/20 rounded-xl flex flex-col h-64 backdrop-blur-sm overflow-hidden">
            {/* Chat tabs */}
            <div className="flex items-center border-b border-accent-purple/20">
              <button
                onClick={() => setShowDeadChat(false)}
                className={`flex-1 text-xs py-2 text-center transition-colors ${!showDeadChat ? 'text-accent-gold bg-accent-purple/10' : 'text-text-muted hover:text-text-primary'}`}
              >
                Chat
              </button>
              {canSeeDeadChat && (
                <button
                  onClick={() => setShowDeadChat(true)}
                  className={`flex-1 text-xs py-2 text-center transition-colors ${showDeadChat ? 'text-accent-gold bg-accent-purple/10' : 'text-text-muted hover:text-text-primary'}`}
                >
                  Dead Chat
                </button>
              )}
            </div>

            {/* Messages area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2">
              {showDeadChat && canSeeDeadChat ? (
                <AnimatePresence>
                  {currentDeadChat.length === 0 && (
                    <p className="text-text-muted text-xs text-center py-8">The spirits are silent...</p>
                  )}
                  {currentDeadChat.map((msg) => (
                    <ChatBubble key={msg.id} msg={msg} humanId={humanPlayerId} />
                  ))}
                </AnimatePresence>
              ) : (
                <>
                  <AnimatePresence>
                    {currentChat.map((msg) => (
                      <ChatBubble key={msg.id} msg={msg} humanId={humanPlayerId} />
                    ))}
                  </AnimatePresence>
                  {currentWhispers.map(w => (
                    <ChatBubble key={w.id} msg={w} humanId={humanPlayerId} isWhisper />
                  ))}
                  {relevantLogs.slice(-15).map(log => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`text-xs px-2 py-1 rounded ${
                        log.type === 'death' ? 'text-werewolf-red bg-werewolf-red/10' :
                        log.type === 'vote' ? 'text-accent-gold bg-accent-gold/10' :
                        log.type === 'reveal' ? 'text-accent-purple bg-accent-purple/10' :
                        'text-text-secondary bg-bg-elevated/30'
                      }`}
                    >
                      <span className="text-text-muted text-[10px]">[D{log.round}]</span>{' '}
                      {log.message}
                    </motion.div>
                  ))}
                </>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <AnimatePresence>
              {phase === 'discussion' && (
                <motion.div
                  className="border-t border-accent-purple/20 p-2 flex gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <motion.input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                    placeholder={showDeadChat && canSeeDeadChat ? "Speak to the dead..." : "Say something..."}
                    className="flex-1 bg-bg-primary border border-accent-purple/30 rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:border-accent-purple focus:outline-none"
                    whileFocus={{ scale: 1.01, borderColor: 'rgba(123,109,141,0.8)' }}
                  />
                  <motion.button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim()}
                    whileHover={{ scale: 1.1, rotate: -10 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-accent-purple hover:bg-accent-purple/80 disabled:bg-bg-elevated disabled:text-text-muted text-white px-3 py-2 rounded-lg transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div className="pb-4 space-y-2" layout>
          <AnimatePresence mode="wait">
            {phase === 'discussion' ? (
              <motion.div key="discussion-actions" className="space-y-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSkipVote}
                  disabled={hasSkipVoted}
                  className="w-full flex items-center justify-center gap-2 bg-bg-elevated hover:bg-bg-elevated/80 disabled:opacity-50 text-text-secondary font-medium py-2.5 rounded-xl transition-all text-sm border border-accent-purple/20"
                >
                  <motion.div animate={{ x: [0, 3, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                    <FastForward className="w-4 h-4" />
                  </motion.div>
                  {hasSkipVoted ? `Skip voted (${skipCount}/${majority})` : `Vote to Skip Discussion (${skipCount}/${majority})`}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(212,168,67,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleStartVoting}
                  disabled={isOnline && !isHost}
                  className="w-full flex items-center justify-center gap-2 bg-accent-gold hover:bg-accent-gold/90 disabled:bg-bg-elevated disabled:text-text-muted text-[#1A1833] font-bold py-4 rounded-xl transition-all text-lg"
                >
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Vote className="w-5 h-5" />
                  </motion.div>
                  {isOnline && !isHost ? 'Waiting for host...' : 'Start Voting'}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="voting-actions" className="space-y-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <AnimatePresence>
                  {selectedTarget && (
                    <motion.p
                      className="text-center text-text-secondary text-sm"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      You are voting to eliminate:{' '}
                      <motion.span
                        className="text-accent-gold font-semibold"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {players.find(p => p.id === selectedTarget)?.name}
                      </motion.span>
                    </motion.p>
                  )}
                </AnimatePresence>
                {!human?.isAlive && (
                  <motion.p className="text-center text-text-muted text-sm">
                    You are dead and cannot vote.
                  </motion.p>
                )}
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(139,58,58,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleVote}
                  disabled={!selectedTarget || !human?.isAlive}
                  className={`w-full py-4 rounded-xl font-bold transition-all text-lg flex items-center justify-center gap-2 ${
                    selectedTarget && human?.isAlive
                      ? 'bg-werewolf-red hover:bg-werewolf-red/90 text-white shadow-[0_0_20px_rgba(139,58,58,0.4)]'
                      : 'bg-bg-elevated text-text-muted cursor-not-allowed'
                  }`}
                >
                  <motion.div
                    animate={selectedTarget ? { rotate: [0, 10, -10, 0] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <Skull className="w-5 h-5" />
                  </motion.div>
                  Cast Vote
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
