import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected', 'reconnecting', 'disconnected'
  const socketRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      // Create new socket connection with auth token
      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('🟢 Socket Connected:', socket.id);
        setConnectionStatus('connected');
      });

      socket.on('disconnect', (reason) => {
        console.warn('🔴 Socket Disconnected:', reason);
        setConnectionStatus('disconnected');
      });

      socket.on('connect_error', (err) => {
        console.error('⚠️ Socket Connection Error:', err.message);
        setConnectionStatus('reconnecting');
      });

      socket.io.on('reconnect_attempt', () => {
        setConnectionStatus('reconnecting');
      });

      socket.io.on('reconnect', () => {
        console.log('🟡 Socket Reconnected!');
        setConnectionStatus('connected');
      });

      return () => {
        console.log('🔌 Cleaning up Socket Connection');
        socket.disconnect();
        socketRef.current = null;
        setConnectionStatus('disconnected');
      };
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnectionStatus('disconnected');
    }
  }, [token, isAuthenticated]);

  const value = {
    socket: socketRef.current,
    connectionStatus,
    isConnected: connectionStatus === 'connected',
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
