export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export type MessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  avatarUrl?: string | null;
  about?: string;
  isOnline: boolean;
  lastSeen?: string | Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  content: string;
  messageType: MessageType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  timestamp: string;
  date?: string;
  status: MessageStatus;
  replyToId?: string;
  replyTo?: {
    id: string;
    content: string | null;
    messageType: MessageType;
    senderId: string;
  };
  isDeleted?: boolean;
}

export interface Chat {
  id: string;
  isGroup: boolean;
  name: string;
  avatar: string;
  about?: string;
  isOnline?: boolean;
  lastSeen?: string;
  unreadCount: number;
  isPinned?: boolean;
  otherUser?: User;
  participants?: User[];
  lastMessage?: {
    id?: string;
    content: string;
    timestamp: string;
    senderId: string;
    senderName?: string;
    status: MessageStatus;
    type: MessageType;
  };
}
