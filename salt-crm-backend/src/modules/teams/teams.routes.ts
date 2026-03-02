import { Router } from 'express';
import { teamsController } from './teams.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireManager } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
    createTeamSchema,
    updateTeamSchema,
    addMemberSchema,
    listTeamsQuerySchema,
    teamIdParamSchema,
} from './teams.schema.js';

const router = Router();

router.use(authMiddleware);

// List teams
router.get(
    '/',
    validate({ query: listTeamsQuerySchema }),
    teamsController.findAll
);

// Get team by ID
router.get(
    '/:id',
    validate({ params: teamIdParamSchema }),
    teamsController.findById
);

// Create team (manager/admin only)
router.post(
    '/',
    requireManager,
    validate({ body: createTeamSchema }),
    teamsController.create
);

// Update team (manager/admin only)
router.put(
    '/:id',
    requireManager,
    validate({ params: teamIdParamSchema, body: updateTeamSchema }),
    teamsController.update
);

// Add member to team
router.post(
    '/:id/members',
    requireManager,
    validate({ params: teamIdParamSchema, body: addMemberSchema }),
    teamsController.addMember
);

// Remove member from team
router.delete(
    '/:id/members/:userId',
    requireManager,
    validate({ params: teamIdParamSchema }),
    teamsController.removeMember
);

// Delete team
router.delete(
    '/:id',
    requireManager,
    validate({ params: teamIdParamSchema }),
    teamsController.delete
);

export { router as teamsRoutes };
