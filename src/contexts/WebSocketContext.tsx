// contexts/WebSocketContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from './AuthContext';
import { createWebSocketService, getWebSocketService } from '../services/websocketService';
import { addMessage, updateChatList, setUserOnlineStatus } from '@/reduce/store/chatSlice';

interface WebSocketContextType {
    isConnected: boolean;
    connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
    sendMessage: (data: any) => boolean;
    reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
    children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    const { user, token } = useAuth();
    const dispatch = useDispatch();
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

    useEffect(() => {
        if (!user || !token) {
            console.log('🔌 No user or token, skipping WebSocket connection');
            return;
        }

        // Create WebSocket connection
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5173';
        const wsService = createWebSocketService(wsUrl, token);

        setConnectionStatus('connecting');

        // Set up event listeners
        wsService.on('connected', () => {
            console.log('✅ WebSocket connected');
            setIsConnected(true);
            setConnectionStatus('connected');
        });

        wsService.on('disconnected', () => {
            console.log('🔌 WebSocket disconnected');
            setIsConnected(false);
            setConnectionStatus('disconnected');
        });

        wsService.on('error', (error: any) => {
            console.error('❌ WebSocket