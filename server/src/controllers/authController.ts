import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { registerSchema, loginSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.errors.map((e) => e.message),
      });
      return;
    }

    const { name, email, password, avatarUrl, about } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      res.status(409).json({ error: 'Email is already registered' });
      return;
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        avatarUrl: avatarUrl || null,
        about: about?.trim() || 'Hey there! I am using WhatsApp.',
        isOnline: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        about: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error while creating user' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.errors.map((e) => e.message),
      });
      return;
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Update user presence to online on successful login
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        about: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = signToken({
      userId: updatedUser.id,
      email: updatedUser.email,
    });

    res.status(200).json({
      message: 'Login successful',
      user: updatedUser,
      token,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  res.status(200).json({ user: req.user });
};
