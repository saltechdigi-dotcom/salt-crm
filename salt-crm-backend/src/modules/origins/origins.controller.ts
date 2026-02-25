import { Request, Response, NextFunction } from 'express';
import { originsService } from './origins.service.js';

class OriginsController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const origins = await originsService.findAll(req.user!);
            res.json(origins);
        } catch (error) { next(error); }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, color, icon } = req.body;
            if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
            const origin = await originsService.create(req.user!, { name, color, icon });
            res.status(201).json(origin);
        } catch (error) { next(error); }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await originsService.delete(req.user!, req.params.id);
            res.status(204).send();
        } catch (error) { next(error); }
    }
}

export const originsController = new OriginsController();
