import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/reduce/store';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Send,
    Paperclip,
    Mic,
    MoreVertical,
    Phone,
    Video,
    ArrowLeft,
    Check,
    CheckCheck,
    Users
} from 'lucide-react';

interface Message {
    _id: string;
    message: string;
    msgType: 'text' | 'image' | 'audio' | 'file' | 'notification';
    sender: {
        id: string;
        name?: string;
        mobile?: string;
    };
    room_id: string;
    date: string;
    seen: boolean;
    isMyMsg: boolean;
    send: boolean;
    right?: boolean;
}

interface ChatAreaProps {
    onBack?: () => void;
    showBackButton?: boolean;
}

const ChatArea: React.FC<ChatAreaProps> = ({ onBack, showBackButton = false }) => {
    const dispatch = useDispatch();
    const { user } = useAuth();
    const { activeConnection, socket, isConnected } = useSelector((state: RootState) => state.chat);

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [onlineStatus, setOnlineStatus] = useState(false);
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom when messages change
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Load messages for active connection
    useEffect(() => {
        if (activeConnection?.messages) {
            setMessages(activeConnection.messages);
        }
    }, [activeConnection]);

    // Socket event listeners
    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleReceiveMessage = (message: Message) => {
            if (message.room_id === activeConnection?.room_id) {
                setMessages(prev => [...prev, message]);

                // Mark message as seen if chat is active
                if (socket && message.sender.id !== user?._id) {
                    socket.emit('updateSeen', [message]);
                }
            }
        };

        const handleUpdateMessage = (updatedMessage: Message) => {
            if (updatedMessage.room_id === activeConnection?.room_id) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg._id === updatedMessage._id ? updatedMessage : msg
                    )
                );
            }
        };

        const handleDeleteMessage = (deletedMessage: Message) => {
            if (deletedMessage.room_id === activeConnection?.room_id) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg._id === deletedMessage._id ? deletedMessage : msg
                    )
                );
            }
        };

        const handleUpdateView = (message: Message) => {
            if (message.room_id === activeConnection?.room_id) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg._id === message._id ? { ...msg, seen: true } : msg
                    )
                );
            }
        };

        socket.on('recieve_message', handleReceiveMessage);
        socket.on('update_msg', handleUpdateMessage);
        socket.on('delete_msg', handleDeleteMessage);
        socket.on('update_view', handleUpdateView);

        return () => {
            socket.off('recieve_message', handleReceiveMessage);
            socket.off('update_msg', handleUpdateMessage);
            socket.off('delete_msg', handleDeleteMessage);
            socket.off('update_view', handleUpdateView);
        };
    }, [socket, isConnected, activeConnection, user]);

    // Check online status
    useEffect(() => {
        if (socket && activeConnection && activeConnection.conn_type === 'onetoone') {
            socket.emit('onlineStatus', {
                user_id: activeConnection.users?.find((u: any) => u._id !== user?._id)?._id,
                room_id: activeConnection.room_id
            }, (response: any) => {
                setOnlineStatus(response.online_status);
            });
        }
    }, [socket, activeConnection, user]);

    // Send message via socket with HTTP fallback
    const sendMessage = async () => {
        if (!newMessage.trim() || !activeConnection || !user) return;

        const messageData = {
            message: newMessage.trim(),
            msgType: 'text' as const,
            room_id: activeConnection.room_id,
            sender: {
                id: user._id,
                name: user.name,
                mobile: user.mobile
            },
            date: new Date().toISOString(),
            seen: false
        };

        setSending(true);
        setNewMessage('');

        try {
            if (socket && isConnected) {
                // Send via socket
                socket.emit('send_message', messageData, (response: Message) => {
                    if (response.error) {
                        // Fallback to HTTP API
                        sendMessageViaHTTP(messageData);
                    } else {
                        setMessages(prev => [...prev, response]);
                    }
                    setSending(false);
                });
            } else {
                // Direct HTTP API call
                await sendMessageViaHTTP(messageData);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setSending(false);
            // Restore message in input if failed
            setNewMessage(messageData.message);
        }
    };

    // HTTP API fallback for sending messages
    const sendMessageViaHTTP = async (messageData: any) => {
        try {
            const response = await fetch('/api/messages/create', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: messageData.message,
                    room_id: messageData.room_id,
                    msgType: messageData.msgType,
                    sender: messageData.sender
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message via HTTP');
            }

            const result = await response.json();

            // Add to local messages with proper format
            const httpMessage: Message = {
                _id: result._id || Date.now().toString(),
                message: messageData.message,
                msgType: messageData.msgType,
                sender: messageData.sender,
                room_id: messageData.room_id,
                date: messageData.date,
                seen: false,
                isMyMsg: true,
                send: true
            };

            setMessages(prev => [...prev, httpMessage]);
            setSending(false);
        } catch (error) {
            console.error('HTTP message send failed:', error);
            setSending(false);
            throw error;
        }
    };

    // Handle input key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Format message time
    const formatMessageTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Get display name for connection
    const getDisplayName = () => {
        if (!activeConnection) return '';

        if (activeConnection.conn_type === 'group') {
            return activeConnection.conn_name || activeConnection.display_name;
        }

        return activeConnection.display_name;
    };

    // Render message status icon
    const renderMessageStatus = (message: Message) => {
        if (!message.isMyMsg) return null;

        if (message.seen) {
            return <CheckCheck size={14} className="text-blue-500" />;
        } else if (message.send) {
            return <Check size={14} className="text-gray-400" />;
        }
        return null;
    };

    if (!activeConnection) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-lg font-medium mb-2">Select a chat</h3>
                    <p className="text-muted-foreground">Choose a conversation to start messaging</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background">
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border bg-background/95 backdrop-blur">
                {showBackButton && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="md:hidden"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                )}

                <div className="relative">
                    <Avatar className="w-10 h-10">
                        {activeConnection.profile ? (
                            <AvatarImage src={activeConnection.profile} alt={getDisplayName()} />
                        ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {activeConnection.conn_type === 'group' ? (
                                    <Users size={16} />
                                ) : (
                                    getDisplayName()[0]?.toUpperCase()
                                )}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    {activeConnection.conn_type === 'onetoone' && onlineStatus && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{getDisplayName()}</h3>
                    {activeConnection.conn_type === 'onetoone' && (
                        <p className="text-sm text-muted-foreground">
                            {onlineStatus ? 'Online' : 'Offline'}
                        </p>
                    )}
                    {activeConnection.conn_type === 'group' && activeConnection.about && (
                        <p className="text-sm text-muted-foreground truncate">
                            {activeConnection.about}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <Phone size={18} />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Video size={18} />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <MoreVertical size={18} />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                    <div
                        key={message._id || index}
                        className={`flex ${message.isMyMsg ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[70%] ${message.isMyMsg ? 'order-2' : 'order-1'}`}>
                            {!message.isMyMsg && activeConnection.conn_type === 'group' && (
                                <p className="text-xs text-muted-foreground mb-1 px-3">
                                    {message.sender.name || message.sender.mobile}
                                </p>
                            )}

                            <div
                                className={`rounded-2xl px-4 py-2 ${message.isMyMsg
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground'
                                    } ${message.msgType === 'notification'
                                        ? 'bg-muted/50 text-center text-muted-foreground text-sm'
                                        : ''
                                    }`}
                            >
                                {message.msgType === 'text' || message.msgType === 'notification' ? (
                                    <p className="whitespace-pre-wrap break-words">{message.message}</p>
                                ) : message.msgType === 'image' ? (
                                    <div>
                                        <div className="w-48 h-48 bg-muted rounded-lg mb-2 flex items-center justify-center">
                                            📷 Image
                                        </div>
                                        {message.message && <p>{message.message}</p>}
                                    </div>
                                ) : message.msgType === 'audio' ? (
                                    <div className="flex items-center gap-2">
                                        🎵 <span>Audio message</span>
                                    </div>
                                ) : message.msgType === 'file' ? (
                                    <div className="flex items-center gap-2">
                                        📎 <span>File attachment</span>
                                    </div>
                                ) : null}

                                <div className={`flex items-center gap-1 mt-1 ${message.msgType === 'notification' ? 'justify-center' :
                                        message.isMyMsg ? 'justify-end' : 'justify-start'
                                    }`}>
                                    <span className="text-xs opacity-70">
                                        {formatMessageTime(message.date)}
                                    </span>
                                    {renderMessageStatus(message)}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {sending && (
                    <div className="flex justify-end">
                        <div className="max-w-[70%] bg-primary/50 text-primary-foreground rounded-2xl px-4 py-2">
                            <p>Sending...</p>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-background">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <Paperclip size={20} />
                    </Button>

                    <div className="flex-1 relative">
                        <Input
                            ref={inputRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            className="pr-12"
                            disabled={sending}
                        />
                    </div>

                    {newMessage.trim() ? (
                        <Button
                            onClick={sendMessage}
                            size="icon"
                            disabled={sending}
                        >
                            <Send size={18} />
                        </Button>
                    ) : (
                        <Button variant="ghost" size="icon">
                            <Mic size={20} />
                        </Button>
                    )}
                </div>

                {!isConnected && (
                    <p className="text-xs text-yellow-600 mt-2 text-center">
                        ⚠️ Connection lost. Messages will be sent when reconnected.
                    </p>
                )}
            </div>
        </div>
    );
};

export default ChatArea;