import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { connectSocket } from '@/socket';
import HomeScreen from '@/screens/HomeScreen';
import LobbyScreen from '@/screens/LobbyScreen';
import OnlineLobbyScreen from '@/screens/OnlineLobbyScreen';
import RoomScreen from '@/screens/RoomScreen';
import RoleRevealScreen from '@/screens/RoleRevealScreen';
import NightScreen from '@/screens/NightScreen';
import DawnScreen from '@/screens/DawnScreen';
import DayScreen from '@/screens/DayScreen';
import ExecutionScreen from '@/screens/ExecutionScreen';
import GameOverScreen from '@/screens/GameOverScreen';

const screenComponents = {
  home: HomeScreen,
  lobby: LobbyScreen,
  'online-lobby': OnlineLobbyScreen,
  room: RoomScreen,
  'role-reveal': RoleRevealScreen,
  night: NightScreen,
  dawn: DawnScreen,
  day: DayScreen,
  execution: ExecutionScreen,
  'game-over': GameOverScreen,
} as const;

const transitionVariants = {
  initial: { opacity: 0, scale: 0.95, filter: 'blur(10px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 1.05, filter: 'blur(10px)' },
};

export default function App() {
  const screen = useGameStore(s => s.state.screen);
  const setServerState = useGameStore(s => s.setServerState);
  const ScreenComponent = screenComponents[screen] || HomeScreen;

  useEffect(() => {
    const socket = connectSocket();

    const onRoomCreated = (data: { roomCode: string; playerId: string }) => {
      setServerState({
        roomCode: data.roomCode,
        humanPlayerId: data.playerId,
        isHost: true,
        screen: 'room',
        phase: 'lobby',
      });
    };

    const onJoinedRoom = (data: { roomCode: string; playerId: string; isHost: boolean }) => {
      setServerState({
        roomCode: data.roomCode,
        humanPlayerId: data.playerId,
        isHost: data.isHost,
        screen: 'room',
        phase: 'lobby',
      });
    };

    const onGameState = (state: Record<string, unknown>) => {
      setServerState(state as Partial<import('@/types/game').GameState>);
    };

    const onError = (data: { message: string }) => {
      alert(data.message);
    };

    socket.on('roomCreated', onRoomCreated);
    socket.on('joinedRoom', onJoinedRoom);
    socket.on('gameState', onGameState);
    socket.on('error', onError);

    return () => {
      socket.off('roomCreated', onRoomCreated);
      socket.off('joinedRoom', onJoinedRoom);
      socket.off('gameState', onGameState);
      socket.off('error', onError);
    };
  }, [setServerState]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          variants={transitionVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <ScreenComponent />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
