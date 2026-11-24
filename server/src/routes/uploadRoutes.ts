import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();

// Locate or initialize the uploads directory
const getUploadsDir = (): string => {
  const candidates = [
    path.resolve(__dirname, '../../uploads'),
    path.resolve(__dirname, '../uploads'),
    path.resolve(process.cwd(), 'server/uploads'),
    path.resolve(process.cwd(), 'uploads'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  const fallback = path.resolve(__dirname, '../../uploads');
  fs.mkdirSync(fallback, { recursive: true });
  return fallback;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, getUploadsDir());
  },
  filename: (_req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext) {
      if (file.mimetype.includes('webm')) ext = '.webm';
      else if (file.mimetype.includes('ogg')) ext = '.ogg';
      else if (file.mimetype.includes('mp4') || file.mimetype.includes('m4a')) ext = '.m4a';
      else if (file.mimetype.includes('wav')) ext = '.wav';
      else if (file.mimetype.includes('mpeg') || file.mimetype.includes('mp3')) ext = '.mp3';
      else if (file.mimetype.startsWith('audio/')) ext = '.webm';
      else if (file.mimetype.startsWith('image/')) ext = '.jpg';
    }
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Allow all standard image and audio mime types
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('audio/') ||
    file.mimetype === 'video/webm' // Some browsers record WebM audio under video/webm container
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only image and audio files (WebM, MP3, WAV, OGG, M4A, JPEG, PNG, etc.) are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB maximum limit
  fileFilter,
});

/**
 * POST /api/upload
 * Accepts a multipart/form-data with field 'file'
 * Returns persisted static fileUrl accessible by all clients
 */
router.post(
  '/',
  authMiddleware,
  upload.single('file'),
  (req: AuthenticatedRequest, res: Response): void => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const host =
      (req.headers['x-forwarded-host'] as string) ||
      req.get('host') ||
      'localhost:5000';
    const protocol =
      (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.status(200).json({
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
  }
);

export default router;
