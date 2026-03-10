import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribe: (event: string, callback: (data: any) => void) => () => void;
  emit: (event: string, data: any) => void;
  onlineUsers: OnlineUser[];
}

interface OnlineUser {
  userId: string;
  name: string;
  avatar?: string;
  currentPage?: string;
  joinedAt: Date;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setOnlineUsers([]);
      }
      return;
    }

    const token = localStorage.getItem('auth_token');
    const wsUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;

    const socket = io(wsUrl, {
      path: '/ws',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join:organization', { organizationId: user.organizationId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.warn('WebSocket connection error:', error.message);
    });

    // Presence tracking
    socket.on('presence:update', (users: OnlineUser[]) => {
      setOnlineUsers(users);
    });

    socket.on('user:joined', (onlineUser: OnlineUser) => {
      setOnlineUsers(prev => {
        if (prev.find(u => u.userId === onlineUser.userId)) return prev;
        return [...prev, onlineUser];
      });
    });

    socket.on('user:left', (userId: string) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== userId));
    });

    // Forward all events to registered listeners
    socket.onAny((event: string, data: any) => {
      const callbacks = listenersRef.current.get(event);
      if (callbacks) {
        callbacks.forEach(cb => cb(data));
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setOnlineUsers([]);
    };
  }, [isAuthenticated, user]);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);

    return () => {
      const callbacks = listenersRef.current.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          listenersRef.current.delete(event);
        }
      }
    };
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      subscribe,
      emit,
      onlineUsers,
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;
