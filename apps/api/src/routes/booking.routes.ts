import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

// Placeholder routes - to be implemented
router.get('/', (req, res) => {
  res.json({ message: 'Get bookings - to be implemented' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get booking by ID - to be implemented' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create booking - to be implemented' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update booking - to be implemented' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Cancel booking - to be implemented' });
});

export { router as bookingRoutes };
