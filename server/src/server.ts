import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import http from 'http';
import os from 'os';
import express, { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { checkDatabaseConnection, prisma } from './config/db';
import fs from 'fs';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import chatRoutes from './routes/chatRoutes';
import uploadRoutes from './routes/uploadRoutes';
import { setupSocketHandlers } from './sockets/socketHandler';

const app = express();
const httpServer = http.createServer(app);
const server = httpServer;

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Locate or fallback to uploads directory for static media serving
const uploadsCandidates = [
  path.resolve(__dirname, '../../uploads'),
  path.resolve(__dirname, '../uploads'),
  path.resolve(process.cwd(), 'server/uploads'),
  path.resolve(process.cwd(), 'uploads'),
];
let staticUploadsDir = path.resolve(__dirname, '../../uploads');
for (const cand of uploadsCandidates) {
  if (fs.existsSync(cand)) {
    staticUploadsDir = cand;
    break;
  }
}
fs.mkdirSync(staticUploadsDir, { recursive: true });

// Parse all allowed client origins (supports comma-separated URLs in process.env.CLIENT_URL)
const getAllowedOrigins = (): string[] => {
  const envOrigins = [process.env.CLIENT_URL, CLIENT_URL]
    .filter(Boolean)
    .join(',');

  return envOrigins
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
};

// Origin verification supporting localhost, LAN IPs (192.168.*, 10.*, 172.16-31.*), and production CLIENT_URL(s)
export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Allow non-browser requests or same-origin
  try {
    const cleanOrigin = origin.replace(/\/$/, '');
    const url = new URL(cleanOrigin);
    const hostname = url.hostname;

    // Localhost and loopback
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1'
    ) {
      return true;
    }

    // Private IPv4 LAN ranges (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return true;
    }

    // Explicit production client origins (e.g., https://your-app.vercel.app)
    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.includes(cleanOrigin)) {
      return true;
    }
  } catch {
    // If invalid URL, fallback to false
  }
  return false;
};

// CORS origin delegate for Express
const corsOriginDelegate = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) => {
  if (isOriginAllowed(origin)) {
    callback(null, true);
  } else {
    callback(new Error(`Not allowed by CORS: ${origin}`));
  }
};

// Initialize Socket.IO server with CORS policies
export const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`), false);
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Global Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: corsOriginDelegate,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static serving of uploaded image files
app.use('/uploads', express.static(staticUploadsDir));

// Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  const dbStatus = await checkDatabaseConnection(5000);

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(1)}s`,
    service: 'whatsapp-clone-backend',
    database: {
      connected: dbStatus.connected,
      message: dbStatus.connected
        ? 'Connected to PostgreSQL database via Prisma'
        : 'PostgreSQL connection offline or pending configuration in server/.env',
      error: dbStatus.error,
    },
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/upload', uploadRoutes);

// Initialize real-time Socket.IO event handlers
setupSocketHandlers(io);

// Helper to identify LAN IPv4 address for console display
const getLanIp = (): string => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

// Start Server listening on all network interfaces (0.0.0.0)
httpServer.listen(PORT, '0.0.0.0', () => {
  const lanIp = getLanIp();
  console.log(`=========================================`);
  console.log(`🚀 WhatsApp Clone Server running on port ${PORT}`);
  console.log(`📡 Local:   http://localhost:${PORT}`);
  console.log(`📡 Network: http://${lanIp}:${PORT}`);
  console.log(`📡 Health:  http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);

  // Asynchronously check database connection without blocking startup
  checkDatabaseConnection(5000).then((dbStatus) => {
    if (dbStatus.connected) {
      console.log(`✅ PostgreSQL database connection established.`);
    } else {
      console.warn(`⚠️ PostgreSQL database connection pending or offline:`);
      console.warn(`   Configure DATABASE_URL in server/.env with your local or cloud Postgres instance.`);
    }
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\nShutting down server gracefully...');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('HTTP & Socket.IO server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
