import { Router } from 'express';
import {
  register,
  login,
  getMe,
  validateLogin,
  validateRegister
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', authenticate, getMe);

export { router as authRoutes };
