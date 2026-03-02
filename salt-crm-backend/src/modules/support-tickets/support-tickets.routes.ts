import { Router } from 'express';
import { supportTicketsController } from './support-tickets.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
    createSupportTicketSchema,
    updateSupportTicketSchema,
    resolveSupportTicketSchema,
    findSupportTicketsSchema,
    supportTicketParamsSchema,
} from './support-tickets.schema.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /support-tickets - List tickets (agents see only theirs, managers/admins see all)
router.get('/', validate({ query: findSupportTicketsSchema }), supportTicketsController.findAll);

// GET /support-tickets/stats - Ticket statistics
router.get('/stats', supportTicketsController.getStats);

// GET /support-tickets/:id - Get ticket by ID
router.get('/:id', validate({ params: supportTicketParamsSchema }), supportTicketsController.findById);

// POST /support-tickets - Create ticket
router.post('/', validate({ body: createSupportTicketSchema }), supportTicketsController.create);

// PUT /support-tickets/:id - Update ticket
router.put('/:id', validate({ params: supportTicketParamsSchema, body: updateSupportTicketSchema }), supportTicketsController.update);

// PATCH /support-tickets/:id/resolve - Resolve ticket (admin/manager only)
router.patch(
    '/:id/resolve',
    requireRole('admin', 'manager'),
    validate({ params: supportTicketParamsSchema, body: resolveSupportTicketSchema }),
    supportTicketsController.resolve
);

// DELETE /support-tickets/:id - Delete ticket (admin/manager only)
router.delete('/:id', requireRole('admin', 'manager'), validate({ params: supportTicketParamsSchema }), supportTicketsController.delete);

export default router;
