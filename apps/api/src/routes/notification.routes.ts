import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Placeholder routes - to be implemented
router.get('/', (req, res) => {
  res.json({ message: 'Get notifications - to be implemented' });
});

router.patch('/:id/read', (req, res) => {
  res.json({ message: 'Mark notification as read - to be implemented' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete notification - to be implemented' });
});

export { router as notificationRoutes };
