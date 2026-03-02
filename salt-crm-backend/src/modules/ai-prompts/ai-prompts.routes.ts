import { Router } from 'express';
import { aiPromptsController } from './ai-prompts.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
    createAiPromptSchema,
    updateAiPromptSchema,
    aiPromptIdSchema,
    listAiPromptsSchema,
    testAiPromptSchema,
} from './ai-prompts.schema.js';

const router = Router();

router.use(authMiddleware);

// GET /ai-prompts - List prompts (filter by type, isActive)
router.get('/', validate({ query: listAiPromptsSchema }), aiPromptsController.findAll);

// GET /ai-prompts/stats - AI interaction stats
router.get('/stats', aiPromptsController.getStats);

// POST /ai-prompts/seed - Seed default prompts for tenant
router.post('/seed', aiPromptsController.seedDefaults);

// GET /ai-prompts/:id - Get single prompt with recent logs
router.get('/:id', validate({ params: aiPromptIdSchema }), aiPromptsController.findById);

// POST /ai-prompts - Create prompt
router.post('/', validate({ body: createAiPromptSchema }), aiPromptsController.create);

// PUT /ai-prompts/:id - Update prompt
router.put('/:id', validate({ params: aiPromptIdSchema, body: updateAiPromptSchema }), aiPromptsController.update);

// DELETE /ai-prompts/:id - Delete prompt
router.delete('/:id', validate({ params: aiPromptIdSchema }), aiPromptsController.delete);

// POST /ai-prompts/:id/test - Test prompt via n8n
router.post('/:id/test', validate({ params: aiPromptIdSchema, body: testAiPromptSchema }), aiPromptsController.test);

export default router;
