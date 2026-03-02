import { Router } from 'express';
import { deliveriesController } from './deliveries.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/stats', deliveriesController.getStats);
router.get('/', deliveriesController.findAll);
router.get('/:id', deliveriesController.findById);
router.post('/', deliveriesController.create);
router.put('/:id', deliveriesController.update);
router.patch('/:id/complete', deliveriesController.complete);
router.delete('/:id', deliveriesController.delete);

export const deliveriesRoutes = router;
