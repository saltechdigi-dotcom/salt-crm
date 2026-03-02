import { Request, Response, NextFunction } from 'express';
import { npsService } from './nps.service.js';
import type { CreateNpsSurveyInput, RespondNpsSurveyInput, ListNpsSurveysQuery } from './nps.schema.js';

class NpsController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query as unknown as ListNpsSurveysQuery;
            const result = await npsService.findAll(req.user!, query);
            res.json(result);
        } catch (error) { next(error); }
    }

    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await npsService.getStats(req.user!);
            res.json(stats);
        } catch (error) { next(error); }
    }

    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const survey = await npsService.findById(req.user!, req.params.id);
            res.json(survey);
        } catch (error) { next(error); }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as CreateNpsSurveyInput;
            const survey = await npsService.create(req.user!, data);
            res.status(201).json(survey);
        } catch (error) { next(error); }
    }

    async respond(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as RespondNpsSurveyInput;
            const survey = await npsService.respond(req.user!, req.params.id, data);
            res.json(survey);
        } catch (error) { next(error); }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await npsService.delete(req.user!, req.params.id);
            res.json(result);
        } catch (error) { next(error); }
    }
}

export const npsController = new NpsController();
