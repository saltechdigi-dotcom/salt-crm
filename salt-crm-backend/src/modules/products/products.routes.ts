import { Router } from 'express';
import { productsController } from './products.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', productsController.findAll);
router.get('/:id', productsController.findById);
router.post('/', productsController.create);
router.put('/:id', productsController.update);
router.delete('/:id', productsController.delete);

export const productsRoutes = router;
