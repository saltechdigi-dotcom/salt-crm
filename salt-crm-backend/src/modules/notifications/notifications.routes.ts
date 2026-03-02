import { Router } from 'express';
import { notificationsController } from './notifications.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireManager } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
    createNotificationSchema,
    listNotificationsQuerySchema,
    notificationIdParamSchema,
} from './notifications.schema.js';

const router = Router();

router.use(authMiddleware);

// List notifications for current user
router.get(
    '/',
    validate({ query: listNotificationsQuerySchema }),
    notificationsController.findAll
);

// Get unread count
router.get('/unread-count', notificationsController.getUnreadCount);

// Create notification (manager/admin only)
router.post(
    '/',
    requireManager,
    validate({ body: createNotificationSchema }),
    notificationsController.create
);

// Mark single as read
router.patch(
    '/:id/read',
    validate({ params: notificationIdParamSchema }),
    notificationsController.markAsRead
);

// Mark all as read
router.patch('/read-all', notificationsController.markAllAsRead);

// Delete notification
router.delete(
    '/:id',
    validate({ params: notificationIdParamSchema }),
    notificationsController.delete
);

export { router as notificationsRoutes };
