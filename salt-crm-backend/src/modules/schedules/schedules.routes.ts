import { Router } from 'express';
import { schedulesController } from './schedules.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
    createScheduleSchema,
    updateScheduleSchema,
    completeScheduleSchema,
    listSchedulesQuerySchema,
    scheduleIdParamSchema,
} from './schedules.schema.js';

const router = Router();

router.use(authMiddleware);

// List schedules
router.get(
    '/',
    validate({ query: listSchedulesQuerySchema }),
    schedulesController.findAll
);

// Get schedule by ID
router.get(
    '/:id',
    validate({ params: scheduleIdParamSchema }),
    schedulesController.findById
);

// Create schedule
router.post(
    '/',
    validate({ body: createScheduleSchema }),
    schedulesController.create
);

// Update schedule
router.put(
    '/:id',
    validate({ params: scheduleIdParamSchema, body: updateScheduleSchema }),
    schedulesController.update
);

// Complete schedule
router.patch(
    '/:id/complete',
    validate({ params: scheduleIdParamSchema, body: completeScheduleSchema }),
    schedulesController.complete
);

// Cancel schedule
router.patch(
    '/:id/cancel',
    validate({ params: scheduleIdParamSchema }),
    schedulesController.cancel
);

// Delete schedule
router.delete(
    '/:id',
    validate({ params: scheduleIdParamSchema }),
    schedulesController.delete
);

export { router as schedulesRoutes };
