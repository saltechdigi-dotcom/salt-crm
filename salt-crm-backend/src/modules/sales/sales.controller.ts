import { Request, Response, NextFunction } from 'express';
import { salesService } from './sales.service.js';
import { createSaleSchema, updateSaleStatusSchema } from './sales.schema.js';

class SalesController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = {
                status: req.query.status as string | undefined,
                startDate: req.query.startDate as string | undefined,
                endDate: req.query.endDate as string | undefined,
            };
            const sales = await salesService.findAll(req.user!, filters);
            res.json(sales);
        } catch (error) { next(error); }
    }

    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const sale = await salesService.findById(req.user!, req.params.id);
            res.json(sale);
        } catch (error) { next(error); }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = createSaleSchema.parse(req.body);
            const sale = await salesService.create(req.user!, data);
            res.status(201).json(sale);
        } catch (error) { next(error); }
    }

    async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const data = updateSaleStatusSchema.parse(req.body);
            const sale = await salesService.updateStatus(req.user!, req.params.id, data);
            res.json(sale);
        } catch (error) { next(error); }
    }

    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await salesService.getStats(req.user!);
            res.json(stats);
        } catch (error) { next(error); }
    }
}

export const salesController = new SalesController();
