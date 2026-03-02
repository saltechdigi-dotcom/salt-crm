import { Router } from 'express';
import { postSaleController } from './postsale.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

// Stats
router.get('/stats', postSaleController.getStats);

// Templates
router.get('/templates', postSaleController.findAllTemplates);
router.post('/templates', postSaleController.createTemplate);
router.put('/templates/:id', postSaleController.updateTemplate);
router.delete('/templates/:id', postSaleController.deleteTemplate);

// Journeys
router.get('/journeys', postSaleController.findAllJourneys);
router.get('/journeys/:id', postSaleController.findJourneyById);
router.post('/journeys', postSaleController.createJourney);
router.patch('/journeys/:id/cancel', postSaleController.cancelJourney);

// Messages
router.get('/messages', postSaleController.findMessages);

export const postSaleRoutes = router;
