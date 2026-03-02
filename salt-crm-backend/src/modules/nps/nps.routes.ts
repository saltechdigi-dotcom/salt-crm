import { Router } from 'express';
import { npsController } from './nps.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireManager } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
    createNpsSurveySchema,
    respondNpsSurveySchema,
    listNpsSurveysQuerySchema,
    npsIdParamSchema,
} from './nps.schema.js';

const router = Router();

router.use(authMiddleware);

// List NPS surveys
router.get(
    '/',
    validate({ query: listNpsSurveysQuerySchema }),
    npsController.findAll
);

// Get NPS stats
router.get('/stats', npsController.getStats);

// Get survey by ID
router.get(
    '/:id',
    validate({ params: npsIdParamSchema }),
    npsController.findById
);

// Create NPS survey (manager/admin)
router.post(
    '/',
    requireManager,
    validate({ body: createNpsSurveySchema }),
    npsController.create
);

// Respond to NPS survey
router.patch(
    '/:id/respond',
    validate({ params: npsIdParamSchema, body: respondNpsSurveySchema }),
    npsController.respond
);

// Delete NPS survey
router.delete(
    '/:id',
    requireManager,
    validate({ params: npsIdParamSchema }),
    npsController.delete
);

export { router as npsRoutes };
