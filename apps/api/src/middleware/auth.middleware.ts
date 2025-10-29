import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@parkway/database';
import { UserRole } from '@parkway/shared';
import { createApiError } from '@parkway/shared';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: UserRole[];
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json(createApiError('Access denied. No token provided.', 401, 'NO_TOKEN'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, roles: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json(createApiError('Invalid token or user not found.', 401, 'INVALID_TOKEN'));
    }

    req.user = {
      id: user.id,
      email: user.email,
      roles: user.roles
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(createApiError('Token expired.', 401, 'TOKEN_EXPIRED'));
    }
    return res.status(401).json(createApiError('Invalid token.', 401, 'INVALID_TOKEN'));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(createApiError('Authentication required.', 401, 'AUTH_REQUIRED'));
    }

    const hasRole = roles.some(role => req.user!.roles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json(createApiError('Insufficient permissions.', 403, 'INSUFFICIENT_PERMISSIONS'));
    }

    next();
  };
};
