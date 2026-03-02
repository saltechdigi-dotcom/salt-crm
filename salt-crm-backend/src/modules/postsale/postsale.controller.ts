import { Request, Response, NextFunction } from 'express';
import { postSaleService } from './postsale.service.js';
import { createTemplateSchema, updateTemplateSchema, createJourneySchema } from './postsale.schema.js';

class PostSaleController {
    // Templates
    async findAllTemplates(req: Request, res: Response, next: NextFunction) {
        try {
            const status = req.query.status as string | undefined;
            const templates = await postSaleService.findAllTemplates(req.user!, status);
            res.json(templates);
        } catch (error) { next(error); }
    }

    async createTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const data = createTemplateSchema.parse(req.body);
            const template = await postSaleService.createTemplate(req.user!, data);
            res.status(201).json(template);
        } catch (error) { next(error); }
    }

    async updateTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const data = updateTemplateSchema.parse(req.body);
            const template = await postSaleService.updateTemplate(req.user!, req.params.id, data);
            res.json(template);
        } catch (error) { next(error); }
    }

    async deleteTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await postSaleService.deleteTemplate(req.user!, req.params.id);
            res.json(result);
        } catch (error) { next(error); }
    }

    // Journeys
    async findAllJourneys(req: Request, res: Response, next: NextFunction) {
        try {
            const status = req.query.status as string | undefined;
            const journeys = await postSaleService.findAllJourneys(req.user!, status);
            res.json(journeys);
        } catch (error) { next(error); }
    }

    async findJourneyById(req: Request, res: Response, next: NextFunction) {
        try {
            const journey = await postSaleService.findJourneyById(req.user!, req.params.id);
            res.json(journey);
        } catch (error) { next(error); }
    }

    async createJourney(req: Request, res: Response, next: NextFunction) {
        try {
            const data = createJourneySchema.parse(req.body);
            const journey = await postSaleService.createJourney(req.user!, data);
            res.status(201).json(journey);
        } catch (error) { next(error); }
    }

    async cancelJourney(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await postSaleService.cancelJourney(req.user!, req.params.id);
            res.json(result);
        } catch (error) { next(error); }
    }

    // Messages
    async findMessages(req: Request, res: Response, next: NextFunction) {
        try {
            const journeyId = req.query.journeyId as string | undefined;
            const status = req.query.status as string | undefined;
            const messages = await postSaleService.findMessages(req.user!, journeyId, status);
            res.json(messages);
        } catch (error) { next(error); }
    }

    // Stats
    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await postSaleService.getStats(req.user!);
            res.json(stats);
        } catch (error) { next(error); }
    }
}

export const postSaleController = new PostSaleController();
