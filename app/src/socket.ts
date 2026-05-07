import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSocket(): Socket | null {
  return socketInstance;
}

export function connectSocket(): Socket {
  if (socketInstance) return socketInstance;
  const url = import.meta.env.VITE_SERVER_URL || window.location.origin;
  socketInstance = io(url, { transports: ['websocket', 'polling'] });
  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
