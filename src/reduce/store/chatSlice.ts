import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';

// Updated types to match your backend models
interface ChatMessage {
    _id: string;
    room_id: string;
    message: string;
    date: string;
    msgType: 'text' | 'image' | 'video' | 'notification';
    senderId: string;
    conn_type: 'group' | 'onetoone';
    receiverId: string;
    image?: string;
    seen: boolean;
    right: boolean;
    isMyMsg?: boolean;
    send?: boolean;
    replyFor?: {
        id: string;
        message: string;
        name: string;
    };
}

interface Connection {
    _id: string;
    room_id: string;
    conn_type: 'onetoone' | 'group';
    conn_name?: string;
    display_name: string;
    about?: string;
    profile?: string;
    users: Array<{
        _id: string;
        name?: string;
        phoneNumber: string;
        display_name: string;
    }>;
    admins: string[];
    online_status?: string;
    unreadCount: number;
    messages: ChatMessage[];
    lastMessage?: ChatMessage;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

interface ChatState {
    connections: Connection[];
    activeConnection: Connection | null;
    messages: Record<string, ChatMessage[]>; // room_id -> messages
    loading: boolean;
    error: string | null;
    isConnected: boolean;
    socketId: string | null; // Store only socket ID, not the socket instance
}

const initialState: ChatState = {
    connections: [],
    activeConnection: null,
    messages: {},
    loading: false,
    error: null,
    isConnected: false,
    socketId: null,
};

// Global socket instance (outside Redux)
let socketInstance: Socket | null = null;

// Helper function to get socket instance
export const getSocket = (): Socket | null => socketInstance;

// Async thunk for initializing socket connection
export const initializeSocket = createAsyncThunk(
    'chat/initializeSocket',
    async (user: any, { dispatch }) => {
        return new Promise<{ connections: Connection[] }>((resolve, reject) => {
            // Disconnect existing socket if any
            if (socketInstance) {
                socketInstance.disconnect();
            }

            socketInstance = io(import.meta.env.VITE_APP_API_URL || 'http://localhost:5000', {
                withCredentials: true,
                transports: ['websocket', 'polling']
            });

            socketInstance.on('connect', () => {
                console.log('Socket connected:', socketInstance!.id);
                dispatch(setConnected(true));
                dispatch(setSocketId(socketInstance!.id));

                // Get all messages/connections
                socketInstance!.emit('getAllMessages', (response: any) => {
                    if (response.status) {
                        console.log('Connections loaded:', response.connections);
                        resolve({ connections: response.connections });
                    } else {
                        reject(new Error(response.error || 'Failed to load connections'));
                    }
                });
            });

            socketInstance.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                dispatch(setConnected(false));
                reject(error);
            });

            socketInstance.on('disconnect', () => {
                console.log('Socket disconnected');
                dispatch(setConnected(false));
                dispatch(setSocketId(null));
            });

            // Listen for real-time message events
            socketInstance.on('recieve_message', (message: ChatMessage) => {
                console.log('Received message:', message);
                dispatch(receiveMessage(message));
            });

            socketInstance.on('new_connection', (connection: Connection) => {
                console.log('New connection:', connection);
                dispatch(addConnection(connection));
            });

            socketInstance.on('update_msg', (message: ChatMessage) => {
                console.log('Message updated:', message);
                dispatch(updateMessage(message));
            });

            socketInstance.on('delete_msg', (message: ChatMessage) => {
                console.log('Message deleted:', message);
                dispatch(updateMessage(message));
            });
        });
    }
);

// Async thunk for sending messages
export const sendMessageThunk = createAsyncThunk(
    'chat/sendMessage',
    async (
        { room_id, message, msgType = 'text' }: { room_id: string; message: string; msgType?: string },
        { rejectWithValue }
    ) => {
        return new Promise<ChatMessage>((resolve, reject) => {
            if (!socketInstance) {
                reject(new Error('Socket not connected'));
                return;
            }

            const messageData = {
                room_id,
                message,
                msgType,
                date: new Date().toISOString(),
            };

            socketInstance.emit('sendMessage', messageData, (response: ChatMessage | { error: string }) => {
                if ('error' in response) {
                    reject(new Error(response.error));
                } else {
                    console.log('Message sent:', response);
                    resolve(response);
                }
            });
        });
    }
);

// Async thunk for creating connections
export const createConnectionThunk = createAsyncThunk(
    'chat/createConnection',
    async (
        { userIds, connType, connectionInfo }: {
            userIds: string[];
            connType: 'onetoone' | 'group';
            connectionInfo?: { conn_name?: string; about?: string };
        }
    ) => {
        return new Promise<{ success?: string; error?: string }>((resolve) => {
            if (!socketInstance) {
                resolve({ error: 'Socket not connected' });
                return;
            }

            socketInstance.emit('createConnection', userIds, connType, connectionInfo, (response: any) => {
                console.log('Connection creation response:', response);
                resolve(response);
            });
        });
    }
);

// Async thunk for editing messages
export const editMessageThunk = createAsyncThunk(
    'chat/editMessage',
    async (messageData: ChatMessage) => {
        return new Promise<ChatMessage>((resolve, reject) => {
            if (!socketInstance) {
                reject(new Error('Socket not connected'));
                return;
            }

            socketInstance.emit('editMessage', messageData, (response: ChatMessage | { error: string }) => {
                if ('error' in response) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            });
        });
    }
);

// Async thunk for deleting messages
export const deleteMessageThunk = createAsyncThunk(
    'chat/deleteMessage',
    async (messageData: ChatMessage) => {
        return new Promise<ChatMessage>((resolve, reject) => {
            if (!socketInstance) {
                reject(new Error('Socket not connected'));
                return;
            }

            socketInstance.emit('deleteMessage', messageData, (response: ChatMessage | { error: string }) => {
                if ('error' in response) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            });
        });
    }
);

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setConnected: (state, action: PayloadAction<boolean>) => {
            state.isConnected = action.payload;
        },
        setSocketId: (state, action: PayloadAction<string | null>) => {
            state.socketId = action.payload;
        },
        setActiveConnection: (state, action: PayloadAction<string>) => {
            const connection = state.connections.find(c => c.room_id === action.payload);
            if (connection) {
                state.activeConnection = connection;
                // Reset unread count when selecting a connection
                connection.unreadCount = 0;
            }
        },
        addConnection: (state, action: PayloadAction<Connection>) => {
            const existingIndex = state.connections.findIndex(
                c => c.room_id === action.payload.room_id
            );
            if (existingIndex === -1) {
                state.connections.unshift(action.payload);
                // Initialize messages array for this connection
                state.messages[action.payload.room_id] = action.payload.messages || [];
            }
        },
        receiveMessage: (state, action: PayloadAction<ChatMessage>) => {
            const message = action.payload;
            const room_id = message.room_id;

            // Add message to messages array
            if (!state.messages[room_id]) {
                state.messages[room_id] = [];
            }
            state.messages[room_id].push(message);

            // Update connection's last message and unread count
            const connectionIndex = state.connections.findIndex(c => c.room_id === room_id);
            if (connectionIndex !== -1) {
                state.connections[connectionIndex].lastMessage = message;

                // Increment unread count if it's not from current user and not the active chat
                if (!message.isMyMsg && state.activeConnection?.room_id !== room_id) {
                    state.connections[connectionIndex].unreadCount += 1;
                }

                // Move connection to top of list
                const connection = state.connections.splice(connectionIndex, 1)[0];
                state.connections.unshift(connection);
            }
        },
        updateMessage: (state, action: PayloadAction<ChatMessage>) => {
            const message = action.payload;
            const room_id = message.room_id;

            if (state.messages[room_id]) {
                const messageIndex = state.messages[room_id].findIndex(m => m._id === message._id);
                if (messageIndex !== -1) {
                    state.messages[room_id][messageIndex] = message;
                }
            }
        },
        markMessagesAsSeen: (state, action: PayloadAction<string>) => {
            const room_id = action.payload;
            if (state.messages[room_id]) {
                state.messages[room_id].forEach(message => {
                    if (!message.isMyMsg) {
                        message.seen = true;
                    }
                });
            }
        },
        clearError: (state) => {
            state.error = null;
        },
        disconnectSocket: (state) => {
            if (socketInstance) {
                socketInstance.disconnect();
                socketInstance = null;
            }
            state.isConnected = false;
            state.socketId = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(initializeSocket.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(initializeSocket.fulfilled, (state, action) => {
                state.loading = false;
                state.connections = action.payload.connections;
                // Initialize messages for each connection
                action.payload.connections.forEach(connection => {
                    state.messages[connection.room_id] = connection.messages || [];
                });
            })
            .addCase(initializeSocket.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to initialize socket';
            })
            .addCase(sendMessageThunk.pending, (state) => {
                // Optional: Add loading state for sending messages
            })
            .addCase(sendMessageThunk.fulfilled, (state, action) => {
                const message = action.payload;
                const room_id = message.room_id;

                // Add sent message to messages array
                if (!state.messages[room_id]) {
                    state.messages[room_id] = [];
                }
                state.messages[room_id].push(message);

                // Update connection's last message
                const connectionIndex = state.connections.findIndex(c => c.room_id === room_id);
                if (connectionIndex !== -1) {
                    state.connections[connectionIndex].lastMessage = message;
                    // Move connection to top
                    const connection = state.connections.splice(connectionIndex, 1)[0];
                    state.connections.unshift(connection);
                }
            })
            .addCase(sendMessageThunk.rejected, (state, action) => {
                state.error = action.error.message || 'Failed to send message';
            })
            .addCase(createConnectionThunk.fulfilled, (state, action) => {
                if (action.payload.error) {
                    state.error = action.payload.error;
                }
                // Success will be handled by the 'new_connection' socket event
            })
            .addCase(editMessageThunk.fulfilled, (state, action) => {
                const message = action.payload;
                const room_id = message.room_id;

                if (state.messages[room_id]) {
                    const messageIndex = state.messages[room_id].findIndex(m => m._id === message._id);
                    if (messageIndex !== -1) {
                        state.messages[room_id][messageIndex] = message;
                    }
                }
            })
            .addCase(deleteMessageThunk.fulfilled, (state, action) => {
                const message = action.payload;
                const room_id = message.room_id;

                if (state.messages[room_id]) {
                    const messageIndex = state.messages[room_id].findIndex(m => m._id === message._id);
                    if (messageIndex !== -1) {
                        state.messages[room_id][messageIndex] = message;
                    }
                }
            });
    },
});

export const {
    setConnected,
    setSocketId,
    setActiveConnection,
    addConnection,
    receiveMessage,
    updateMessage,
    markMessagesAsSeen,
    clearError,
    disconnectSocket,
} = chatSlice.actions;

export default chatSlice.reducer;