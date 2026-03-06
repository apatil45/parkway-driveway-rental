import jwt from 'jsonwebtoken';

export function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
}

export function generateRefreshToken(userId: string): string {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET or JWT_REFRESH_SECRET environment variable is not set');
  }
  return jwt.sign({ id: userId, type: 'refresh' }, secret, { expiresIn: '30d' });
}
