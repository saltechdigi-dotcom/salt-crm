import { Router } from 'express';
import { originsController } from './origins.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', originsController.findAll);
router.post('/', originsController.create);
router.delete('/:id', originsController.delete);

export const originsRoutes = router;
