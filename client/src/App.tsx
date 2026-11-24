import { useState, useEffect, useRef } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { EmptyChatState } from './components/chat/EmptyChatState';
import { ChatWindow } from './components/chat/ChatWindow';
import { CallModal } from './components/chat/CallModal';
import { NewChatModal } from './components/sidebar/NewChatModal';
import { NewGroupModal } from './components/sidebar/NewGroupModal';
import { ProfileDrawer } from './components/sidebar/ProfileDrawer';
import { AuthScreen } from './components/auth/AuthScreen';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import { Chat, Message, User } from './types/chat';
import api from './services/api';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { user: authUser, isLoading: isAuthLoading } = useAuth();
  const {
    socket,
    isConnected,
    joinChat,
    leaveChat,
    emitTyping,
    markMessagesRead,
  } = useSocket();

  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState<boolean>(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [typingChats, setTypingChats] = useState<Record<string, boolean>>({});

  // Keep a ref to selectedChat so socket callbacks don't capture stale closures
  const selectedChatRef = useRef<Chat | null>(null);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Keep a ref to previous chat ID for room leave/join
  const prevChatIdRef = useRef<string | null>(null);

  // 1. Fetch user's chats from PostgreSQL on auth login
  useEffect(() => {
    if (!authUser) {
      setChats([]);
      setSelectedChat(null);
      setMessagesMap({});
      setTypingChats({});
      return;
    }

    const loadChats = async () => {
      setChatsLoading(true);
      try {
        const res = await api.get('/chats');
        setChats(res.data.chats || []);
      } catch (err) {
        console.error('Failed to load user chats:', err);
      } finally {
        setChatsLoading(false);
      }
    };

    loadChats();
  }, [authUser?.id]);

  // 2. Fetch messages from PostgreSQL whenever selectedChat changes
  useEffect(() => {
    if (!selectedChat || !authUser) return;

    const loadMessages = async () => {
      setMessagesLoading(true);
      try {
        const res = await api.get(`/chats/${selectedChat.id}/messages`);
        setMessagesMap((prev) => ({
          ...prev,
          [selectedChat.id]: res.data.messages || [],
        }));
        // Emit mark as read once messages have loaded
        markMessagesRead(selectedChat.id);
      } catch (err) {
        console.error('Failed to load messages for chat:', err);
      } finally {
        setMessagesLoading(false);
      }
    };

    loadMessages();
  }, [selectedChat?.id, authUser?.id]);

  // 3. Socket.IO Room Management (join active chat room, leave previous)
  useEffect(() => {
    const currentChatId = selectedChat?.id;
    const prevChatId = prevChatIdRef.current;

    if (prevChatId && prevChatId !== currentChatId) {
      leaveChat(prevChatId);
    }

    if (currentChatId && isConnected) {
      joinChat(currentChatId);
      markMessagesRead(currentChatId);
    }

    prevChatIdRef.current = currentChatId || null;

    return () => {
      if (currentChatId) {
        leaveChat(currentChatId);
      }
    };
  }, [selectedChat?.id, isConnected]);

  // 4. Socket.IO Real-Time Event Handlers
  useEffect(() => {
    if (!socket || !authUser) return;

    // A. Real-Time Incoming Message
    const handleNewMessage = ({
      message,
      chatId,
    }: {
      message: Message;
      chatId: string;
    }) => {
      // Deduplicate: avoid appending if message already exists in state
      setMessagesMap((prev) => {
        const currentList = prev[chatId] || [];
        if (currentList.some((m) => m.id === message.id)) {
          return prev;
        }
        return {
          ...prev,
          [chatId]: [...currentList, message],
        };
      });

      const isCurrentActiveChat = selectedChatRef.current?.id === chatId;
      const isFromOtherUser = message.senderId !== authUser.id;

      // If this conversation is currently open and someone else sent the message, mark it as read immediately
      if (isCurrentActiveChat && isFromOtherUser) {
        markMessagesRead(chatId);
      }

      // Update sidebar chats list: bump to top and update preview snippet
      setChats((prev) => {
        const chatIndex = prev.findIndex((c) => c.id === chatId);
        const displayContent =
          message.messageType === 'IMAGE'
            ? message.content || 'Photo'
            : message.messageType === 'AUDIO'
            ? '🎤 Voice message'
            : message.content;

        const updatedLastMessage = {
          id: message.id,
          content: displayContent,
          timestamp: message.timestamp,
          senderId: message.senderId,
          senderName: message.senderName,
          status: message.status,
          type: message.messageType,
        };

        if (chatIndex === -1) {
          // Fresh conversation started by another user: refresh full chat list
          api.get('/chats').then((res) => {
            if (res.data.chats) setChats(res.data.chats);
          });
          return prev;
        }

        const targetChat = prev[chatIndex];
        const newUnreadCount =
          !isCurrentActiveChat && isFromOtherUser
            ? (targetChat.unreadCount || 0) + 1
            : targetChat.unreadCount;

        const updatedChat: Chat = {
          ...targetChat,
          lastMessage: updatedLastMessage,
          unreadCount: newUnreadCount,
        };

        const others = prev.filter((_, idx) => idx !== chatIndex);
        return [updatedChat, ...others];
      });

      // Also update selectedChat lastMessage if it matches the active chat
      if (isCurrentActiveChat) {
        setSelectedChat((prev) =>
          prev
            ? {
                ...prev,
                lastMessage: {
                  id: message.id,
                  content:
                    message.messageType === 'IMAGE'
                      ? message.content || 'Photo'
                      : message.messageType === 'AUDIO'
                      ? '🎤 Voice message'
                      : message.content,
                  timestamp: message.timestamp,
                  senderId: message.senderId,
                  senderName: message.senderName,
                  status: message.status,
                  type: message.messageType,
                },
              }
            : null
        );
      }
    };

    // B. Ephemeral Typing Indicators
    const handleTypingStart = ({
      chatId,
      userId,
    }: {
      chatId: string;
      userId: string;
    }) => {
      if (userId !== authUser.id) {
        setTypingChats((prev) => ({ ...prev, [chatId]: true }));
      }
    };

    const handleTypingStop = ({
      chatId,
      userId,
    }: {
      chatId: string;
      userId: string;
    }) => {
      if (userId !== authUser.id) {
        setTypingChats((prev) => ({ ...prev, [chatId]: false }));
      }
    };

    // C. Live Read Receipts (Sent messages marked as READ with double blue ticks)
    const handleMessagesRead = ({
      chatId,
      readerId,
    }: {
      chatId: string;
      readerId: string;
    }) => {
      setMessagesMap((prev) => {
        const list = prev[chatId];
        if (!list) return prev;
        const updated = list.map((m) =>
          m.senderId !== readerId && m.status !== 'READ'
            ? { ...m, status: 'READ' as const }
            : m
        );
        return { ...prev, [chatId]: updated };
      });

      setChats((prev) =>
        prev.map((c) => {
          if (c.id === chatId && c.lastMessage && c.lastMessage.senderId !== readerId) {
            return {
              ...c,
              lastMessage: {
                ...c.lastMessage,
                status: 'READ',
              },
            };
          }
          return c;
        })
      );

      setSelectedChat((prev) => {
        if (
          prev &&
          prev.id === chatId &&
          prev.lastMessage &&
          prev.lastMessage.senderId !== readerId
        ) {
          return {
            ...prev,
            lastMessage: {
              ...prev.lastMessage,
              status: 'READ',
            },
          };
        }
        return prev;
      });
    };

    // D. Live Delivery Receipts (Sent messages marked as DELIVERED with double grey ticks)
    const handleMessagesDelivered = ({
      chatId,
      recipientId,
    }: {
      chatId: string;
      recipientId: string;
    }) => {
      setMessagesMap((prev) => {
        const list = prev[chatId];
        if (!list) return prev;
        const updated = list.map((m) =>
          m.senderId !== recipientId && m.status === 'SENT'
            ? { ...m, status: 'DELIVERED' as const }
            : m
        );
        return { ...prev, [chatId]: updated };
      });

      setChats((prev) =>
        prev.map((c) => {
          if (
            c.id === chatId &&
            c.lastMessage &&
            c.lastMessage.senderId !== recipientId &&
            c.lastMessage.status === 'SENT'
          ) {
            return {
              ...c,
              lastMessage: {
                ...c.lastMessage,
                status: 'DELIVERED',
              },
            };
          }
          return c;
        })
      );

      setSelectedChat((prev) => {
        if (
          prev &&
          prev.id === chatId &&
          prev.lastMessage &&
          prev.lastMessage.senderId !== recipientId &&
          prev.lastMessage.status === 'SENT'
        ) {
          return {
            ...prev,
            lastMessage: {
              ...prev.lastMessage,
              status: 'DELIVERED',
            },
          };
        }
        return prev;
      });
    };

    // E. Online Presence (User comes online or goes offline)
    const handleUserPresence = ({
      userId,
      isOnline,
      lastSeen,
    }: {
      userId: string;
      isOnline: boolean;
      lastSeen?: string;
    }) => {
      const formattedLastSeen = lastSeen
        ? new Date(lastSeen).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : undefined;

      setChats((prev) =>
        prev.map((c) => {
          if (c.otherUser?.id === userId) {
            return {
              ...c,
              isOnline,
              lastSeen: formattedLastSeen || c.lastSeen,
              otherUser: {
                ...c.otherUser,
                isOnline,
                lastSeen: lastSeen || c.otherUser.lastSeen,
              },
            };
          }
          return c;
        })
      );

      setSelectedChat((prev) => {
        if (prev && prev.otherUser?.id === userId) {
          return {
            ...prev,
            isOnline,
            lastSeen: formattedLastSeen || prev.lastSeen,
            otherUser: {
              ...prev.otherUser,
              isOnline,
              lastSeen: lastSeen || prev.otherUser.lastSeen,
            },
          };
        }
        return prev;
      });
    };

    // F. User Profile Updated (Contact changed name, about, or avatar)
    const handleUserProfileUpdated = ({
      userId,
      name,
      avatarUrl,
      about,
    }: {
      userId: string;
      name: string;
      avatarUrl?: string;
      about?: string;
    }) => {
      const displayAvatar =
        avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

      setChats((prev) =>
        prev.map((c) => {
          if (c.otherUser?.id === userId) {
            return {
              ...c,
              name: c.isGroup ? c.name : name,
              avatar: c.isGroup ? c.avatar : displayAvatar,
              about: c.isGroup ? c.about : about,
              otherUser: {
                ...c.otherUser,
                name,
                avatarUrl,
                avatar: displayAvatar,
                about,
              },
            };
          }
          return c;
        })
      );

      setSelectedChat((prev) => {
        if (prev && prev.otherUser?.id === userId) {
          return {
            ...prev,
            name: prev.isGroup ? prev.name : name,
            avatar: prev.isGroup ? prev.avatar : displayAvatar,
            about: prev.isGroup ? prev.about : about,
            otherUser: {
              ...prev.otherUser,
              name,
              avatarUrl,
              avatar: displayAvatar,
              about,
            },
          };
        }
        return prev;
      });
    };

    // G. New Group / Chat created in real time
    const handleNewChat = ({ chat }: { chat: Chat }) => {
      setChats((prev) => {
        if (prev.some((c) => c.id === chat.id)) {
          return prev;
        }
        return [chat, ...prev];
      });
    };

    socket.on('new-message', handleNewMessage);
    socket.on('new-chat', handleNewChat);
    socket.on('typing-start', handleTypingStart);
    socket.on('typing-stop', handleTypingStop);
    socket.on('messages-read', handleMessagesRead);
    socket.on('messages-delivered', handleMessagesDelivered);
    socket.on('user-presence', handleUserPresence);
    socket.on('user-profile-updated', handleUserProfileUpdated);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('new-chat', handleNewChat);
      socket.off('typing-start', handleTypingStart);
      socket.off('typing-stop', handleTypingStop);
      socket.off('messages-read', handleMessagesRead);
      socket.off('messages-delivered', handleMessagesDelivered);
      socket.off('user-presence', handleUserPresence);
      socket.off('user-profile-updated', handleUserProfileUpdated);
    };
  }, [socket, authUser?.id, markMessagesRead]);

  // Selecting a chat from sidebar
  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    markMessagesRead(chat.id);
    // Clear unread count locally
    setChats((prev) =>
      prev.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleBackToChatList = () => {
    setSelectedChat(null);
  };

  // Start or find a 1-on-1 chat with a user via PostgreSQL
  const handleStartChatWithUser = async (user: User) => {
    // 1. If an active conversation with this user already exists locally, select it immediately
    const existingChat = chats.find(
      (c) => !c.isGroup && c.otherUser?.id === user.id
    );

    if (existingChat) {
      setSelectedChat(existingChat);
      setIsNewChatOpen(false);
      markMessagesRead(existingChat.id);
      // Bring existing chat to the top of the list
      setChats((prev) => {
        const others = prev.filter((c) => c.id !== existingChat.id);
        return [existingChat, ...others];
      });
      return;
    }

    try {
      const res = await api.post('/chats', { recipientId: user.id });
      const backendChat: Chat = res.data.chat;

      setChats((prev) => {
        // Prevent any duplicates by chat.id or contact id
        const existingIndex = prev.findIndex(
          (c) =>
            c.id === backendChat.id ||
            (!c.isGroup && c.otherUser?.id === user.id)
        );

        if (existingIndex !== -1) {
          const updated = { ...prev[existingIndex], ...backendChat };
          const others = prev.filter((_, idx) => idx !== existingIndex);
          return [updated, ...others];
        }

        return [backendChat, ...prev];
      });

      setSelectedChat(backendChat);
      setIsNewChatOpen(false);
    } catch (err) {
      console.error('Failed to create or find chat:', err);
    }
  };

  // Debounced typing callback forwarded to Socket.IO
  const handleTypingChange = (isTyping: boolean) => {
    if (selectedChat) {
      emitTyping(selectedChat.id, isTyping);
    }
  };

  // Send a text message with PostgreSQL persistence
  const handleSendMessage = async (text: string, replyToId?: string) => {
    if (!selectedChat || !authUser) return;

    try {
      const res = await api.post(`/chats/${selectedChat.id}/messages`, {
        content: text,
        messageType: 'TEXT',
        replyToId,
      });

      const savedMessage: Message = res.data.message;

      // Append saved message to conversation feed (with deduplication)
      setMessagesMap((prev) => {
        const existing = prev[selectedChat.id] || [];
        if (existing.some((m) => m.id === savedMessage.id)) {
          return prev;
        }
        return {
          ...prev,
          [selectedChat.id]: [...existing, savedMessage],
        };
      });

      // Update sidebar chat snippet and bump to top
      setChats((prev) => {
        const updatedChat: Chat = {
          ...selectedChat,
          lastMessage: {
            id: savedMessage.id,
            content: savedMessage.content,
            timestamp: savedMessage.timestamp,
            senderId: authUser.id,
            senderName: authUser.name,
            status: savedMessage.status,
            type: 'TEXT',
          },
        };
        const others = prev.filter((c) => c.id !== selectedChat.id);
        return [updatedChat, ...others];
      });

      setSelectedChat((prev) =>
        prev
          ? {
              ...prev,
              lastMessage: {
                id: savedMessage.id,
                content: savedMessage.content,
                timestamp: savedMessage.timestamp,
                senderId: authUser.id,
                senderName: authUser.name,
                status: savedMessage.status,
                type: 'TEXT',
              },
            }
          : null
      );
    } catch (err) {
      console.error('Failed to send message to backend:', err);
    }
  };

  // Send an image message with static backend upload & PostgreSQL persistence
  const handleSendImage = async (
    file: File,
    previewUrl: string,
    caption?: string,
    replyToId?: string
  ) => {
    if (!selectedChat || !authUser) return;

    try {
      // 1. Upload the image file to backend static uploads
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const persistedFileUrl: string = uploadRes.data.fileUrl;

      // Revoke local object URL to prevent memory leaks
      URL.revokeObjectURL(previewUrl);

      // 2. Persist image message with the static backend URL
      const res = await api.post(`/chats/${selectedChat.id}/messages`, {
        content: caption || '',
        messageType: 'IMAGE',
        fileUrl: persistedFileUrl,
        replyToId,
      });

      const savedMessage: Message = res.data.message;

      setMessagesMap((prev) => {
        const existing = prev[selectedChat.id] || [];
        if (existing.some((m) => m.id === savedMessage.id)) {
          return prev;
        }
        return {
          ...prev,
          [selectedChat.id]: [...existing, savedMessage],
        };
      });

      const displaySnippet = caption ? caption : 'Photo';

      setChats((prev) => {
        const updatedChat: Chat = {
          ...selectedChat,
          lastMessage: {
            id: savedMessage.id,
            content: displaySnippet,
            timestamp: savedMessage.timestamp,
            senderId: authUser.id,
            senderName: authUser.name,
            status: savedMessage.status,
            type: 'IMAGE',
          },
        };
        const others = prev.filter((c) => c.id !== selectedChat.id);
        return [updatedChat, ...others];
      });

      setSelectedChat((prev) =>
        prev
          ? {
              ...prev,
              lastMessage: {
                id: savedMessage.id,
                content: displaySnippet,
                timestamp: savedMessage.timestamp,
                senderId: authUser.id,
                senderName: authUser.name,
                status: savedMessage.status,
                type: 'IMAGE',
              },
            }
          : null
      );
    } catch (err) {
      console.error('Failed to send image message to backend:', err);
    }
  };

  // Send a voice note with static backend upload & PostgreSQL persistence
  const handleSendAudio = async (
    audioBlob: Blob,
    durationSeconds: number,
    replyToId?: string
  ) => {
    if (!selectedChat || !authUser) return;

    try {
      const formData = new FormData();
      const ext =
        audioBlob.type.includes('mp4') || audioBlob.type.includes('m4a')
          ? 'm4a'
          : audioBlob.type.includes('ogg')
          ? 'ogg'
          : 'webm';
      formData.append('file', audioBlob, `voice-note-${Date.now()}.${ext}`);

      const uploadRes = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const persistedFileUrl: string = uploadRes.data.fileUrl;
      const m = Math.floor(durationSeconds / 60);
      const s = Math.floor(durationSeconds % 60);
      const formattedDuration = `${m}:${s.toString().padStart(2, '0')}`;

      const res = await api.post(`/chats/${selectedChat.id}/messages`, {
        content: `Voice message (${formattedDuration})`,
        messageType: 'AUDIO',
        fileUrl: persistedFileUrl,
        replyToId,
      });

      const savedMessage: Message = res.data.message;

      setMessagesMap((prev) => {
        const existing = prev[selectedChat.id] || [];
        if (existing.some((m) => m.id === savedMessage.id)) {
          return prev;
        }
        return {
          ...prev,
          [selectedChat.id]: [...existing, savedMessage],
        };
      });

      const displaySnippet = '🎤 Voice message';

      setChats((prev) => {
        const updatedChat: Chat = {
          ...selectedChat,
          lastMessage: {
            id: savedMessage.id,
            content: displaySnippet,
            timestamp: savedMessage.timestamp,
            senderId: authUser.id,
            senderName: authUser.name,
            status: savedMessage.status,
            type: 'AUDIO',
          },
        };
        const others = prev.filter((c) => c.id !== selectedChat.id);
        return [updatedChat, ...others];
      });

      setSelectedChat((prev) =>
        prev
          ? {
              ...prev,
              lastMessage: {
                id: savedMessage.id,
                content: displaySnippet,
                timestamp: savedMessage.timestamp,
                senderId: authUser.id,
                senderName: authUser.name,
                status: savedMessage.status,
                type: 'AUDIO',
              },
            }
          : null
      );
    } catch (err) {
      console.error('Failed to send audio message to backend:', err);
    }
  };

  // Delete message locally
  const handleDeleteMessage = (messageId: string) => {
    if (!selectedChat) return;

    setMessagesMap((prev) => {
      const currentList = prev[selectedChat.id] || [];
      const updatedList = currentList.map((m) =>
        m.id === messageId
          ? { ...m, isDeleted: true, content: 'This message was deleted' }
          : m
      );

      return {
        ...prev,
        [selectedChat.id]: updatedList,
      };
    });
  };

  // Handle newly created group chat
  const handleGroupCreated = (newGroupChat: Chat) => {
    setChats((prev) => {
      const existing = prev.find((c) => c.id === newGroupChat.id);
      if (existing) {
        return [existing, ...prev.filter((c) => c.id !== newGroupChat.id)];
      }
      return [newGroupChat, ...prev];
    });
    setSelectedChat(newGroupChat);
    setIsNewGroupOpen(false);
  };

  // Loading Screen while session token is being validated
  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-wa-bg text-wa-primary select-none">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-wa-green text-white shadow-lg animate-pulse">
            <svg
              className="h-10 w-10 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.37 21.82 12.04 21.82C17.5 21.82 21.95 17.37 21.95 11.91C21.95 6.45 17.5 2 12.04 2M12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.04 3.67C16.58 3.67 20.28 7.37 20.28 11.91C20.28 16.45 16.58 20.15 12.04 20.15M16.57 14.53C16.32 14.4 15.1 13.8 14.87 13.72C14.64 13.64 14.48 13.6 14.31 13.85C14.15 14.1 13.67 14.67 13.52 14.84C13.38 15 13.23 15.02 12.98 14.9C12.73 14.77 11.93 14.51 10.99 13.67C10.25 13.01 9.75 12.19 9.61 11.94C9.46 11.69 9.59 11.56 9.72 11.43C9.83 11.32 9.97 11.14 10.1 10.99C10.22 10.84 10.26 10.74 10.34 10.57C10.42 10.41 10.38 10.26 10.32 10.14C10.26 10.01 9.77 8.81 9.56 8.32C9.37 7.84 9.17 7.91 9.02 7.9C8.88 7.89 8.71 7.89 8.55 7.89C8.38 7.89 8.12 7.95 7.89 8.2C7.66 8.45 7.02 9.05 7.02 10.28C7.02 11.5 7.91 12.69 8.04 12.86C8.16 13.02 9.79 15.54 12.28 16.61C12.87 16.87 13.33 17.02 13.69 17.14C14.29 17.33 14.83 17.3 15.26 17.24C15.74 17.17 16.74 16.63 16.95 16.05C17.15 15.46 17.15 14.97 17.09 14.86C17.03 14.76 16.87 14.67 16.57 14.53Z" />
            </svg>
          </div>
          <div className="flex items-center gap-2 text-sm text-wa-secondary">
            <Loader2 className="h-4 w-4 animate-spin text-wa-green" />
            <span>Connecting to WhatsApp...</span>
          </div>
        </div>
      </div>
    );
  }

  // If user is unauthenticated, render the Login / Register screen
  if (!authUser) {
    return <AuthScreen />;
  }

  const activeMessages = selectedChat ? messagesMap[selectedChat.id] || [] : [];
  const isSelectedChatTyping = Boolean(
    selectedChat && typingChats[selectedChat.id]
  );

  return (
    <>
      <MainLayout
        currentUser={authUser}
      chats={chats}
      selectedChat={selectedChat}
      onSelectChat={handleSelectChat}
      onNewChat={() => {
        setIsProfileOpen(false);
        setIsNewGroupOpen(false);
        setIsNewChatOpen(true);
      }}
      onNewGroup={() => {
        setIsProfileOpen(false);
        setIsNewChatOpen(false);
        setIsNewGroupOpen(true);
      }}
      onOpenProfile={() => {
        setIsNewChatOpen(false);
        setIsNewGroupOpen(false);
        setIsProfileOpen(true);
      }}
      sidebarDrawer={
        <>
          <NewChatModal
            isOpen={isNewChatOpen}
            onClose={() => setIsNewChatOpen(false)}
            onSelectUser={handleStartChatWithUser}
            onOpenNewGroup={() => {
              setIsNewChatOpen(false);
              setIsNewGroupOpen(true);
            }}
          />
          <NewGroupModal
            isOpen={isNewGroupOpen}
            onClose={() => setIsNewGroupOpen(false)}
            onGroupCreated={handleGroupCreated}
          />
          <ProfileDrawer
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
          />
        </>
      }
    >
      {selectedChat ? (
        messagesLoading && activeMessages.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center bg-wa-bg text-wa-secondary">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-wa-green" />
            <span className="text-sm">Loading messages...</span>
          </div>
        ) : (
          <ChatWindow
            chat={selectedChat}
            messages={activeMessages}
            currentUserId={authUser.id}
            isTyping={isSelectedChatTyping}
            onBack={handleBackToChatList}
            onSendMessage={handleSendMessage}
            onSendImage={handleSendImage}
            onSendAudio={handleSendAudio}
            onDeleteMessage={handleDeleteMessage}
            onTypingChange={handleTypingChange}
          />
        )
      ) : chatsLoading ? (
        <div className="flex h-full w-full items-center justify-center bg-wa-bg text-wa-secondary">
          <Loader2 className="h-6 w-6 animate-spin mr-2 text-wa-green" />
          <span className="text-sm">Loading conversations...</span>
        </div>
      ) : (
        <EmptyChatState />
      )}
    </MainLayout>
    <CallModal />
    </>
  );
}
