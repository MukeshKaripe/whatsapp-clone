import jwt from 'jsonwebtoken';

export interface JwtUserPayload {
  userId: string;
  email: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'whatsapp-clone-secret-key-change-in-production-2026';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

export const signToken = (payload: JwtUserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): JwtUserPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtUserPayload;
};
