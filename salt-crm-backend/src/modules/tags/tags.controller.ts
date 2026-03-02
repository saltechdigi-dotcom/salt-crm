import { Request, Response, NextFunction } from 'express';
import { tagsService } from './tags.service.js';
import { createTagSchema, updateTagSchema } from './tags.schema.js';

class TagsController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const entityType = req.query.entityType as string | undefined;
            const tags = await tagsService.findAll(req.user!, entityType);
            res.json(tags);
        } catch (error) { next(error); }
    }

    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const tag = await tagsService.findById(req.user!, req.params.id);
            res.json(tag);
        } catch (error) { next(error); }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = createTagSchema.parse(req.body);
            const tag = await tagsService.create(req.user!, data);
            res.status(201).json(tag);
        } catch (error) { next(error); }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const data = updateTagSchema.parse(req.body);
            const tag = await tagsService.update(req.user!, req.params.id, data);
            res.json(tag);
        } catch (error) { next(error); }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await tagsService.delete(req.user!, req.params.id);
            res.json(result);
        } catch (error) { next(error); }
    }
}

export const tagsController = new TagsController();
