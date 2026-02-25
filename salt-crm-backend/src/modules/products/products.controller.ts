import { Request, Response, NextFunction } from 'express';
import { productsService } from './products.service.js';
import { createProductSchema, updateProductSchema } from './products.schema.js';

class ProductsController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const products = await productsService.findAll(req.user!);
            res.json(products);
        } catch (error) { next(error); }
    }

    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const product = await productsService.findById(req.user!, req.params.id);
            res.json(product);
        } catch (error) { next(error); }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = createProductSchema.parse(req.body);
            const product = await productsService.create(req.user!, data);
            res.status(201).json(product);
        } catch (error) { next(error); }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const data = updateProductSchema.parse(req.body);
            const product = await productsService.update(req.user!, req.params.id, data);
            res.json(product);
        } catch (error) { next(error); }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await productsService.delete(req.user!, req.params.id);
            res.status(204).send();
        } catch (error) { next(error); }
    }
}

export const productsController = new ProductsController();
