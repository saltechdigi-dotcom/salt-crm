import { Request, Response, NextFunction } from 'express';
import { supportTicketsService } from './support-tickets.service';

export class SupportTicketsController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { status, priority, type, page, limit } = req.query;
            const result = await supportTicketsService.findAll({
                tenantId: req.user!.tenantId,
                userId: req.user!.role === 'agent' ? req.user!.id : undefined,
                status: status as string,
                priority: priority as string,
                type: type as string,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
            });
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const ticket = await supportTicketsService.findById(
                req.params.id,
                req.user!.tenantId
            );
            res.json(ticket);
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const ticket = await supportTicketsService.create(
                req.body,
                req.user!.id,
                req.user!.tenantId
            );
            res.status(201).json(ticket);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const ticket = await supportTicketsService.update(
                req.params.id,
                req.body,
                req.user!.tenantId
            );
            res.json(ticket);
        } catch (error) {
            next(error);
        }
    }

    async resolve(req: Request, res: Response, next: NextFunction) {
        try {
            const ticket = await supportTicketsService.resolve(
                req.params.id,
                req.body.resolutionNotes,
                req.user!.id,
                req.user!.tenantId
            );
            res.json(ticket);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await supportTicketsService.delete(
                req.params.id,
                req.user!.tenantId
            );
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await supportTicketsService.getStats(req.user!.tenantId);
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }
}

export const supportTicketsController = new SupportTicketsController();
