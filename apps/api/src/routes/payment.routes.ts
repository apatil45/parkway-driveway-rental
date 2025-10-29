import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All payment routes require authentication
router.use(authenticate);

// Placeholder routes - to be implemented
router.post('/create-intent', (req, res) => {
  res.json({ message: 'Create payment intent - to be implemented' });
});

router.post('/confirm', (req, res) => {
  res.json({ message: 'Confirm payment - to be implemented' });
});

router.post('/refund', (req, res) => {
  res.json({ message: 'Process refund - to be implemented' });
});

export { router as paymentRoutes };
