import { Request, Response, NextFunction } from 'express';
import { aiPromptsService } from './ai-prompts.service.js';

export class AiPromptsController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { type, isActive } = req.query;
            const prompts = await aiPromptsService.findAll(
                req.user!,
                type as string,
                isActive === 'true' ? true : isActive === 'false' ? false : undefined
            );
            res.json(prompts);
        } catch (error) {
            next(error);
        }
    }

    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const prompt = await aiPromptsService.findById(req.user!, req.params.id);
            res.json(prompt);
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const prompt = await aiPromptsService.create(req.user!, req.body);
            res.status(201).json(prompt);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const prompt = await aiPromptsService.update(req.user!, req.params.id, req.body);
            res.json(prompt);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await aiPromptsService.delete(req.user!, req.params.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async test(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await aiPromptsService.test(req.user!, req.params.id, req.body);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await aiPromptsService.getStats(req.user!);
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    async seedDefaults(req: Request, res: Response, next: NextFunction) {
        try {
            await aiPromptsService.seedDefaults(req.user!.tenantId);
            res.json({ message: 'Prompts padrão criados com sucesso' });
        } catch (error) {
            next(error);
        }
    }
}

export const aiPromptsController = new AiPromptsController();
