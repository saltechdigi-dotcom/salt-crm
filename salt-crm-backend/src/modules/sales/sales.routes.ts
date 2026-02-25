import { Router } from 'express';
import { salesController } from './sales.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/stats', salesController.getStats);
router.get('/', salesController.findAll);
router.get('/:id', salesController.findById);
router.post('/', salesController.create);
router.put('/:id/status', salesController.updateStatus);

export const salesRoutes = router;
