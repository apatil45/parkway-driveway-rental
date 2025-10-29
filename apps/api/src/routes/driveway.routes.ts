import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All driveway routes require authentication
router.use(authenticate);

// Placeholder routes - to be implemented
router.get('/', (req, res) => {
  res.json({ message: 'Get driveways - to be implemented' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get driveway by ID - to be implemented' });
});

router.post('/', authorize('OWNER'), (req, res) => {
  res.json({ message: 'Create driveway - to be implemented' });
});

router.put('/:id', authorize('OWNER'), (req, res) => {
  res.json({ message: 'Update driveway - to be implemented' });
});

router.delete('/:id', authorize('OWNER'), (req, res) => {
  res.json({ message: 'Delete driveway - to be implemented' });
});

export { router as drivewayRoutes };
