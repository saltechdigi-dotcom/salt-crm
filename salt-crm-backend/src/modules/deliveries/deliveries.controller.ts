import { Request, Response, NextFunction } from 'express';
import { deliveriesService } from './deliveries.service.js';
import { createDeliverySchema, updateDeliverySchema } from './deliveries.schema.js';

class DeliveriesController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = {
                status: req.query.status as string | undefined,
                sellerId: req.query.sellerId as string | undefined,
            };
            const deliveries = await deliveriesService.findAll(req.user!, filters);
            res.json(deliveries);
        } catch (error) { next(error); }
    }

    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const delivery = await deliveriesService.findById(req.user!, req.params.id);
            res.json(delivery);
        } catch (error) { next(error); }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = createDeliverySchema.parse(req.body);
            const delivery = await deliveriesService.create(req.user!, data);
            res.status(201).json(delivery);
        } catch (error) { next(error); }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const data = updateDeliverySchema.parse(req.body);
            const delivery = await deliveriesService.update(req.user!, req.params.id, data);
            res.json(delivery);
        } catch (error) { next(error); }
    }

    async complete(req: Request, res: Response, next: NextFunction) {
        try {
            const delivery = await deliveriesService.complete(req.user!, req.params.id);
            res.json(delivery);
        } catch (error) { next(error); }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await deliveriesService.delete(req.user!, req.params.id);
            res.json(result);
        } catch (error) { next(error); }
    }

    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await deliveriesService.getStats(req.user!);
            res.json(stats);
        } catch (error) { next(error); }
    }
}

export const deliveriesController = new DeliveriesController();
