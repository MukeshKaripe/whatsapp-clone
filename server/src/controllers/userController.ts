import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { io } from '../server';

export const searchUsers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const searchQuery = (req.query.search as string)?.trim();

    const users = await prisma.user.findMany({
      where: {
        id: {
          not: currentUserId, // Exclude current logged-in user
        },
        ...(searchQuery
          ? {
              OR: [
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { email: { contains: searchQuery, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        about: true,
        isOnline: true,
        lastSeen: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: 50,
    });

    res.status(200).json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name cannot be empty')
    .max(50, 'Name must be 50 characters or less')
    .optional(),
  about: z
    .string()
    .trim()
    .max(150, 'About must be 150 characters or less')
    .optional(),
  avatarUrl: z.string().trim().optional(),
});

/**
 * PUT /api/users/profile
 * Updates the authenticated user's display name, about status, and avatar
 * Broadcasts 'user-profile-updated' via Socket.IO to all contacts
 */
export const updateUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, about, avatarUrl } = parseResult.data;

    // Check if at least one field is provided
    if (name === undefined && about === undefined && avatarUrl === undefined) {
      res.status(400).json({ error: 'No profile fields provided to update' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(about !== undefined ? { about } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        about: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Real-time broadcast to connected contacts
    io.emit('user-profile-updated', {
      userId: updatedUser.id,
      name: updatedUser.name,
      avatarUrl: updatedUser.avatarUrl,
      about: updatedUser.about,
    });

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
};
