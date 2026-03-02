import { Request, Response, NextFunction } from 'express';
import { superAdminService } from './super-admin.service';

export class SuperAdminController {
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await superAdminService.login(req.body.email, req.body.password);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    // Tenants
    async listTenants(req: Request, res: Response, next: NextFunction) {
        try {
            const { status, search, page, limit } = req.query;
            const result = await superAdminService.listTenants({
                status: status as string,
                search: search as string,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
            });
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getTenant(req: Request, res: Response, next: NextFunction) {
        try {
            const tenant = await superAdminService.getTenant(req.params.id);
            res.json(tenant);
        } catch (error) {
            next(error);
        }
    }

    async createTenant(req: Request, res: Response, next: NextFunction) {
        try {
            const tenant = await superAdminService.createTenant(req.body);
            res.status(201).json(tenant);
        } catch (error) {
            next(error);
        }
    }

    async updateTenant(req: Request, res: Response, next: NextFunction) {
        try {
            const tenant = await superAdminService.updateTenant(req.params.id, req.body);
            res.json(tenant);
        } catch (error) {
            next(error);
        }
    }

    async deleteTenant(req: Request, res: Response, next: NextFunction) {
        try {
            await superAdminService.deleteTenant(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    // Dashboard
    async getDashboardStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await superAdminService.getDashboardStats();
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    // Alerts
    async listAlerts(req: Request, res: Response, next: NextFunction) {
        try {
            const { status, page, limit } = req.query;
            const result = await superAdminService.listAlerts({
                status: status as string,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
            });
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async resolveAlert(req: Request, res: Response, next: NextFunction) {
        try {
            const alert = await superAdminService.resolveAlert(
                req.params.id,
                (req as any).superAdminId || req.params.id,
                req.body.resolutionNotes
            );
            res.json(alert);
        } catch (error) {
            next(error);
        }
    }

    // Plans
    async listPlans(req: Request, res: Response, next: NextFunction) {
        try {
            const plans = await superAdminService.listPlans();
            res.json(plans);
        } catch (error) {
            next(error);
        }
    }
}

export const superAdminController = new SuperAdminController();
