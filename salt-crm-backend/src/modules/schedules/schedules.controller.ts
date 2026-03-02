import { Request, Response, NextFunction } from 'express';
import { schedulesService } from './schedules.service.js';
import type { CreateScheduleInput, UpdateScheduleInput, CompleteScheduleInput, ListSchedulesQuery } from './schedules.schema.js';

class SchedulesController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query as unknown as ListSchedulesQuery;
            const result = await schedulesService.findAll(req.user!, query);
            res.json(result);
        } catch (error) { next(error); }
    }

    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const schedule = await schedulesService.findById(req.user!, req.params.id);
            res.json(schedule);
        } catch (error) { next(error); }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as CreateScheduleInput;
            const schedule = await schedulesService.create(req.user!, data);
            res.status(201).json(schedule);
        } catch (error) { next(error); }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as UpdateScheduleInput;
            const schedule = await schedulesService.update(req.user!, req.params.id, data);
            res.json(schedule);
        } catch (error) { next(error); }
    }

    async complete(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as CompleteScheduleInput;
            const schedule = await schedulesService.complete(req.user!, req.params.id, data);
            res.json(schedule);
        } catch (error) { next(error); }
    }

    async cancel(req: Request, res: Response, next: NextFunction) {
        try {
            const schedule = await schedulesService.cancel(req.user!, req.params.id);
            res.json(schedule);
        } catch (error) { next(error); }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await schedulesService.delete(req.user!, req.params.id);
            res.json(result);
        } catch (error) { next(error); }
    }
}

export const schedulesController = new SchedulesController();
