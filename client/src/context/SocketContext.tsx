import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  emitTyping: (chatId: string, isTyping: boolean) => void;
  markMessagesRead: (chatId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const getSocketUrl = (): string => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.trim();
  }
  if (import.meta.env.VITE_API_URL) {
    // Strip trailing /api or / if present so socket connects to the host root
    return import.meta.env.VITE_API_URL.trim().replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
  return typeof window !== 'undefined'
    ? `http://${window.location.hostname}:5000`
    : 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize authenticated socket connection
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log(`[Socket.IO Client] Connected to server: ${newSocket.id}`);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log(`[Socket.IO Client] Disconnected: ${reason}`);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('[Socket.IO Client] Connection error:', err.message);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, user?.id]);

  const joinChat = (chatId: string) => {
    socketRef.current?.emit('join-chat', { chatId });
  };

  const leaveChat = (chatId: string) => {
    socketRef.current?.emit('leave-chat', { chatId });
  };

  const emitTyping = (chatId: string, isTyping: boolean) => {
    if (isTyping) {
      socketRef.current?.emit('typing-start', { chatId });
    } else {
      socketRef.current?.emit('typing-stop', { chatId });
    }
  };

  const markMessagesRead = (chatId: string) => {
    socketRef.current?.emit('mark-messages-read', { chatId });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinChat,
        leaveChat,
        emitTyping,
        markMessagesRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
