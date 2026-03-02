import { Router } from 'express';
import { tagsController } from './tags.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', tagsController.findAll);
router.get('/:id', tagsController.findById);
router.post('/', tagsController.create);
router.put('/:id', tagsController.update);
router.delete('/:id', tagsController.delete);

export const tagsRoutes = router;
