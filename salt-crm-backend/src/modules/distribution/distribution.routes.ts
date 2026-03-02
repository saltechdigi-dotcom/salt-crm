import { Router } from 'express';
import { distributionController } from './distribution.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireManager } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
    createDistributionRuleSchema,
    updateDistributionRuleSchema,
    distributeLeadSchema,
    listDistributionRulesQuerySchema,
    listDistributionLogsQuerySchema,
    ruleIdParamSchema,
} from './distribution.schema.js';

const router = Router();

router.use(authMiddleware);

// ===== Rules =====

// List rules (manager/admin only)
router.get(
    '/rules',
    requireManager,
    validate({ query: listDistributionRulesQuerySchema }),
    distributionController.findAllRules
);

// Get rule by ID
router.get(
    '/rules/:id',
    requireManager,
    validate({ params: ruleIdParamSchema }),
    distributionController.findRuleById
);

// Create rule
router.post(
    '/rules',
    requireManager,
    validate({ body: createDistributionRuleSchema }),
    distributionController.createRule
);

// Update rule
router.put(
    '/rules/:id',
    requireManager,
    validate({ params: ruleIdParamSchema, body: updateDistributionRuleSchema }),
    distributionController.updateRule
);

// Delete rule
router.delete(
    '/rules/:id',
    requireManager,
    validate({ params: ruleIdParamSchema }),
    distributionController.deleteRule
);

// ===== Distribution =====

// Distribute a lead
router.post(
    '/distribute',
    requireManager,
    validate({ body: distributeLeadSchema }),
    distributionController.distributeLead
);

// ===== Logs =====

// List distribution logs
router.get(
    '/logs',
    requireManager,
    validate({ query: listDistributionLogsQuerySchema }),
    distributionController.findAllLogs
);

export { router as distributionRoutes };
