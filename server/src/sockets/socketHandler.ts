import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/db';

// Track connected socket instances per userId (handles multi-tab connections cleanly)
const userSocketCounts = new Map<string, number>();

// Track active 1-on-1 WebRTC call partnerships (userId -> partnerUserId)
const activeCallPartners = new Map<string, string>();

export const isUserOnline = (userId: string): boolean => {
  return (userSocketCounts.get(userId) || 0) > 0;
};

export const setupSocketHandlers = (io: SocketIOServer): void => {
  // Authentication Handshake Middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const payload = verifyToken(token);
      socket.data.userId = payload.userId;
      socket.data.email = payload.email;
      next();
    } catch {
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    console.log(`[Socket.IO] Authenticated user connected: ${userId} (Socket: ${socket.id})`);

    // 1. Join personal user room immediately for targeted notifications
    socket.join(`user:${userId}`);

    // 2. Track connection count
    const currentCount = userSocketCounts.get(userId) || 0;
    userSocketCounts.set(userId, currentCount + 1);

    // 3. Register ALL socket event listeners SYNCHRONOUSLY so no incoming events are dropped
    // Active chat room management
    socket.on('join-chat', ({ chatId }: { chatId: string }) => {
      if (chatId) {
        socket.join(`chat:${chatId}`);
        console.log(`[Socket.IO] User ${userId} joined room chat:${chatId}`);
      }
    });

    socket.on('leave-chat', ({ chatId }: { chatId: string }) => {
      if (chatId) {
        socket.leave(`chat:${chatId}`);
        console.log(`[Socket.IO] User ${userId} left room chat:${chatId}`);
      }
    });

    // Ephemeral Typing Indicators
    socket.on('typing-start', ({ chatId }: { chatId: string }) => {
      if (chatId) {
        console.log(`[Socket.IO] User ${userId} started typing in chat:${chatId}`);
        socket.to(`chat:${chatId}`).emit('typing-start', {
          chatId,
          userId,
        });
      }
    });

    socket.on('typing-stop', ({ chatId }: { chatId: string }) => {
      if (chatId) {
        console.log(`[Socket.IO] User ${userId} stopped typing in chat:${chatId}`);
        socket.to(`chat:${chatId}`).emit('typing-stop', {
          chatId,
          userId,
        });
      }
    });

    // Live Read Receipts (Recipient views conversation)
    socket.on('mark-messages-read', async ({ chatId }: { chatId: string }) => {
      if (!chatId) return;

      try {
        const updateResult = await prisma.message.updateMany({
          where: {
            chatId,
            senderId: { not: userId },
            status: { not: 'READ' },
          },
          data: {
            status: 'READ',
          },
        });

        if (updateResult.count > 0) {
          // Notify both the active chat room and participant rooms that messages were read
          const participants = await prisma.chatParticipant.findMany({
            where: { chatId },
            select: { userId: true },
          });
          const targetRooms = [`chat:${chatId}`, ...participants.map((p) => `user:${p.userId}`)];
          io.to(targetRooms).emit('messages-read', {
            chatId,
            readerId: userId,
          });
        }
      } catch (err) {
        console.error('Error marking messages read:', err);
      }
    });

    // WebRTC 1-on-1 Audio/Video Call Signaling
    socket.on(
      'call-user',
      ({
        toUserId,
        fromUser,
        offer,
        callType,
      }: {
        toUserId: string;
        fromUser: any;
        offer: any;
        callType: 'audio' | 'video';
      }) => {
        if (!toUserId || toUserId === userId) return;

        if (!isUserOnline(toUserId)) {
          socket.emit('call-unavailable', { toUserId, reason: 'offline' });
          return;
        }

        activeCallPartners.set(userId, toUserId);
        activeCallPartners.set(toUserId, userId);

        console.log(`[WebRTC] Relay call-user (${callType}) from ${userId} to ${toUserId}`);
        io.to(`user:${toUserId}`).emit('incoming-call', {
          fromUserId: userId,
          fromUser,
          offer,
          callType,
        });
      }
    );

    socket.on(
      'answer-call',
      ({ toUserId, answer }: { toUserId: string; answer: any }) => {
        if (!toUserId) return;
        activeCallPartners.set(userId, toUserId);
        activeCallPartners.set(toUserId, userId);

        console.log(`[WebRTC] Relay answer-call from ${userId} to ${toUserId}`);
        io.to(`user:${toUserId}`).emit('call-answered', {
          fromUserId: userId,
          answer,
        });
      }
    );

    socket.on(
      'ice-candidate',
      ({ toUserId, candidate }: { toUserId: string; candidate: any }) => {
        if (!toUserId || !candidate) {
          console.warn(`[WebRTC] Dropped ice-candidate from ${userId}: missing toUserId (${toUserId}) or candidate`);
          return;
        }
        console.log(`[WebRTC] Relay ice-candidate from ${userId} to ${toUserId}`);
        io.to(`user:${toUserId}`).emit('ice-candidate', {
          fromUserId: userId,
          candidate,
        });
      }
    );

    socket.on('reject-call', ({ toUserId }: { toUserId: string }) => {
      if (!toUserId) return;
      activeCallPartners.delete(userId);
      activeCallPartners.delete(toUserId);

      console.log(`[WebRTC] Relay reject-call from ${userId} to ${toUserId}`);
      io.to(`user:${toUserId}`).emit('call-rejected', {
        fromUserId: userId,
      });
    });

    socket.on('end-call', ({ toUserId }: { toUserId: string }) => {
      if (!toUserId) return;
      activeCallPartners.delete(userId);
      activeCallPartners.delete(toUserId);

      console.log(`[WebRTC] Relay end-call from ${userId} to ${toUserId}`);
      io.to(`user:${toUserId}`).emit('call-ended', {
        fromUserId: userId,
      });
    });

    // Handle Disconnect
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] User disconnected: ${userId} (${reason})`);

      // Clean up any ongoing WebRTC call
      const partnerId = activeCallPartners.get(userId);
      if (partnerId) {
        activeCallPartners.delete(userId);
        activeCallPartners.delete(partnerId);
        io.to(`user:${partnerId}`).emit('call-ended', {
          fromUserId: userId,
          reason: 'disconnected',
        });
      }

      const remainingCount = (userSocketCounts.get(userId) || 1) - 1;
      if (remainingCount <= 0) {
        userSocketCounts.delete(userId);

        (async () => {
          try {
            const now = new Date();
            await prisma.user.update({
              where: { id: userId },
              data: { isOnline: false, lastSeen: now },
            });

            io.emit('user-presence', {
              userId,
              isOnline: false,
              lastSeen: now.toISOString(),
            });
          } catch (err) {
            console.error('Error updating presence on disconnect:', err);
          }
        })();
      } else {
        userSocketCounts.set(userId, remainingCount);
      }
    });

    // 4. Update online presence and pending message status in background (non-blocking)
    if (currentCount === 0) {
      (async () => {
        try {
          await prisma.user.update({
            where: { id: userId },
            data: { isOnline: true },
          });

          io.emit('user-presence', {
            userId,
            isOnline: true,
          });

          // Automatically mark pending messages sent to this user as DELIVERED
          const pendingChats = await prisma.chatParticipant.findMany({
            where: { userId },
            select: { chatId: true },
          });

          for (const { chatId } of pendingChats) {
            const updated = await prisma.message.updateMany({
              where: {
                chatId,
                senderId: { not: userId },
                status: 'SENT',
              },
              data: { status: 'DELIVERED' },
            });

            if (updated.count > 0) {
              const participants = await prisma.chatParticipant.findMany({
                where: { chatId },
                select: { userId: true },
              });
              const targetRooms = [`chat:${chatId}`, ...participants.map((p) => `user:${p.userId}`)];
              io.to(targetRooms).emit('messages-delivered', {
                chatId,
                recipientId: userId,
              });
            }
          }
        } catch (err) {
          console.error('Error updating presence on connect:', err);
        }
      })();
    }
  });
};
