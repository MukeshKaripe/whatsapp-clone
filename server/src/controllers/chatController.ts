import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { io } from '../server';
import { isUserOnline } from '../sockets/socketHandler';

// Helper to format ISO date to "HH:mm"
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

// Helper to determine date group string (TODAY, YESTERDAY, or Date)
const formatDateGroup = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'TODAY';
  if (diffDays === 1) return 'YESTERDAY';
  return date.toLocaleDateString();
};

// Helper to format a chat model into the client contract
const formatChatResponse = (chat: any, currentUserId: string) => {
  const otherParticipant = chat.participants?.find(
    (p: any) => p.userId !== currentUserId
  )?.user;

  const allParticipants =
    chat.participants?.map((p: any) => ({
      id: p.user?.id || p.userId,
      name: p.user?.name || 'User',
      email: p.user?.email,
      avatarUrl: p.user?.avatarUrl,
      avatar:
        p.user?.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      about: p.user?.about,
      isOnline: Boolean(p.user?.isOnline),
      lastSeen: p.user?.lastSeen
        ? new Date(p.user.lastSeen).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'offline',
    })) || [];

  const lastMsg = chat.messages?.[0];

  return {
    id: chat.id,
    isGroup: Boolean(chat.isGroup),
    name: chat.isGroup ? chat.name : (otherParticipant?.name || 'Contact'),
    avatar:
      (chat.isGroup ? chat.avatarUrl : otherParticipant?.avatarUrl) ||
      (chat.isGroup
        ? 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
    about: chat.isGroup
      ? `${allParticipants.length} participants`
      : otherParticipant?.about,
    isOnline: chat.isGroup ? false : Boolean(otherParticipant?.isOnline),
    lastSeen: chat.isGroup
      ? undefined
      : otherParticipant?.lastSeen
      ? new Date(otherParticipant.lastSeen).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'offline',
    unreadCount: 0,
    updatedAt: chat.updatedAt,
    participants: allParticipants,
    lastMessage: lastMsg
      ? {
          id: lastMsg.id,
          content:
            lastMsg.content ||
            (lastMsg.messageType === 'IMAGE'
              ? '📷 Photo'
              : lastMsg.messageType === 'AUDIO'
              ? '🎤 Voice message'
              : ''),
          timestamp: formatTime(lastMsg.createdAt),
          senderId: lastMsg.senderId,
          senderName: lastMsg.sender?.name,
          status: lastMsg.status,
          type: lastMsg.messageType,
        }
      : undefined,
    otherUser: otherParticipant,
  };
};

// Concurrency lock to prevent race conditions during rapid clicks on chat creation
const pendingChatCreations = new Map<string, Promise<any>>();

/**
 * POST /api/chats
 * Finds an existing 1-on-1 chat or creates a new one between req.user.id and recipientId
 */
export const findOrCreateChat = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { recipientId } = req.body;
    if (!recipientId || recipientId === currentUserId) {
      res.status(400).json({ error: 'Invalid recipient ID' });
      return;
    }

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });
    if (!recipient) {
      res.status(404).json({ error: 'Recipient user not found' });
      return;
    }

    const lockKey = [currentUserId, recipientId].sort().join(':');

    // If a creation request for these exact two users is already pending, wait for it
    if (pendingChatCreations.has(lockKey)) {
      try {
        await pendingChatCreations.get(lockKey);
      } catch {
        // proceed if previous failed
      }
    }

    // Helper to query for existing 1-on-1 conversation
    const queryExistingChat = () =>
      prisma.chat.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { userId: currentUserId } } },
            { participants: { some: { userId: recipientId } } },
          ],
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                  about: true,
                  isOnline: true,
                  lastSeen: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: { id: true, name: true, avatarUrl: true },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

    // 1. Check if 1-on-1 chat already exists
    const existingChat = await queryExistingChat();
    if (existingChat) {
      res.status(200).json({ chat: formatChatResponse(existingChat, currentUserId) });
      return;
    }

    // 2. Create new 1-on-1 chat with mutex protection
    const creationPromise = (async () => {
      // Re-check once locked to ensure another concurrent thread didn't create it
      const doubleCheck = await queryExistingChat();
      if (doubleCheck) return doubleCheck;

      return prisma.chat.create({
        data: {
          isGroup: false,
          participants: {
            create: [{ userId: currentUserId }, { userId: recipientId }],
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                  about: true,
                  isOnline: true,
                  lastSeen: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: { id: true, name: true, avatarUrl: true },
              },
            },
          },
        },
      });
    })();

    pendingChatCreations.set(lockKey, creationPromise);
    let resolvedChat;
    try {
      resolvedChat = await creationPromise;
    } finally {
      pendingChatCreations.delete(lockKey);
    }

    res.status(201).json({ chat: formatChatResponse(resolvedChat, currentUserId) });
  } catch (error) {
    console.error('Error in findOrCreateChat:', error);
    res.status(500).json({ error: 'Failed to find or create chat' });
  }
};

const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Group subject is required')
    .max(50, 'Group subject cannot exceed 50 characters'),
  participantIds: z
    .array(z.string())
    .min(2, 'Please select at least 2 other contacts for a group'),
  avatarUrl: z.string().optional().nullable(),
});

/**
 * POST /api/chats/group
 * Creates a new group conversation with at least 2 other contacts
 */
export const createGroupChat = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const parseResult = createGroupSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: parseResult.error.errors[0]?.message || 'Invalid group data',
      });
      return;
    }

    const { name, participantIds, avatarUrl } = parseResult.data;

    // Filter out duplicates and ensure current user is part of the group
    const otherParticipantIds = Array.from(
      new Set(participantIds.filter((id) => id !== currentUserId))
    );

    if (otherParticipantIds.length < 2) {
      res.status(400).json({
        error: 'Please select at least 2 other contacts for the group',
      });
      return;
    }

    const allMemberIds = [currentUserId, ...otherParticipantIds];

    // Verify all participants exist in database
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: allMemberIds } },
      select: { id: true },
    });

    if (existingUsers.length !== allMemberIds.length) {
      res
        .status(400)
        .json({ error: 'One or more selected participants do not exist' });
      return;
    }

    // Create group chat and participants
    const newGroupChat = await prisma.chat.create({
      data: {
        isGroup: true,
        name,
        avatarUrl: avatarUrl || null,
        participants: {
          create: allMemberIds.map((userId) => ({ userId })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                about: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });

    const formattedForCreator = formatChatResponse(newGroupChat, currentUserId);

    // Broadcast new-chat event to each member's personal socket room
    allMemberIds.forEach((memberId) => {
      const formattedForMember = formatChatResponse(newGroupChat, memberId);
      io.to(`user:${memberId}`).emit('new-chat', { chat: formattedForMember });
    });

    res.status(201).json({ chat: formattedForCreator });
  } catch (error) {
    console.error('Error in createGroupChat:', error);
    res.status(500).json({ error: 'Failed to create group chat' });
  }
};

/**
 * GET /api/chats
 * Returns all chats where req.user.id is a participant, sorted by updatedAt DESC
 */
export const getUserChats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: currentUserId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                about: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const formattedChats = chats.map((c) => formatChatResponse(c, currentUserId));

    // Deduplicate any historical 1-on-1 duplicate chats, keeping the most recent
    const seenContacts = new Set<string>();
    const uniqueChats = formattedChats.filter((chat) => {
      if (chat.isGroup) return true;
      const otherId = chat.otherUser?.id;
      if (!otherId) return true;
      if (seenContacts.has(otherId)) return false;
      seenContacts.add(otherId);
      return true;
    });

    res.status(200).json({ chats: uniqueChats });
  } catch (error) {
    console.error('Error in getUserChats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

/**
 * GET /api/chats/:chatId/messages
 * Returns chronological message history for a chat
 */
export const getChatMessages = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const chatId = String(req.params.chatId);

    if (!currentUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify current user is a participant
    const isParticipant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId: currentUserId,
        },
      },
    });

    if (!isParticipant) {
      res.status(403).json({ error: 'Access denied: not a participant of this chat' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            messageType: true,
            senderId: true,
          },
        },
      },
    });

    const formattedMessages = messages.map((m: any) => ({
      id: m.id,
      chatId: m.chatId,
      senderId: m.senderId,
      senderName: m.sender?.name,
      content: m.content || '',
      messageType: m.messageType,
      fileUrl: m.fileUrl || undefined,
      timestamp: formatTime(m.createdAt),
      date: formatDateGroup(m.createdAt),
      status: m.status,
      replyToId: m.replyToId || undefined,
      replyTo: m.replyTo || undefined,
      isDeleted: m.isDeleted,
      createdAt: m.createdAt,
    }));

    res.status(200).json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error in getChatMessages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

/**
 * POST /api/chats/:chatId/messages
 * Persists a new message in the chat and updates chat.updatedAt
 */
export const sendMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const chatId = String(req.params.chatId);

    if (!currentUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { content, messageType = 'TEXT', fileUrl, replyToId } = req.body;

    // Verify current user is a participant
    const isParticipant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId: currentUserId,
        },
      },
    });

    if (!isParticipant) {
      res.status(403).json({ error: 'Access denied: not a participant of this chat' });
      return;
    }

    // Check if other participant is online to set initial status
    const participants = await prisma.chatParticipant.findMany({
      where: { chatId },
      select: { userId: true },
    });

    const isRecipientOnline = participants.some(
      (p) => p.userId !== currentUserId && isUserOnline(p.userId)
    );

    const initialStatus = isRecipientOnline ? 'DELIVERED' : 'SENT';

    // Create message with reply details and sender info
    const newMessage = await prisma.message.create({
      data: {
        chatId,
        senderId: currentUserId,
        content: content || null,
        messageType: messageType || 'TEXT',
        fileUrl: fileUrl || null,
        replyToId: replyToId || null,
        status: initialStatus,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            messageType: true,
            senderId: true,
          },
        },
      },
    });

    // Touch chat updatedAt
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    const formattedMessage = {
      id: newMessage.id,
      chatId: newMessage.chatId,
      senderId: newMessage.senderId,
      senderName: (newMessage as any).sender?.name,
      content: newMessage.content || '',
      messageType: newMessage.messageType,
      fileUrl: newMessage.fileUrl || undefined,
      timestamp: formatTime(newMessage.createdAt),
      date: formatDateGroup(newMessage.createdAt),
      status: newMessage.status,
      replyToId: newMessage.replyToId || undefined,
      replyTo: (newMessage as any).replyTo || undefined,
      isDeleted: newMessage.isDeleted,
      createdAt: newMessage.createdAt,
    };

    // Real-time broadcast:
    // Broadcast to the active chat room and participant personal rooms (Socket.IO deduplicates automatically)
    const targetRooms = [
      `chat:${chatId}`,
      ...participants.map((p) => `user:${p.userId}`),
    ];
    io.to(targetRooms).emit('new-message', {
      message: formattedMessage,
      chatId,
    });

    res.status(201).json({ message: formattedMessage });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};
