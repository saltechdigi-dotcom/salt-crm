import { Request, Response, NextFunction } from 'express';
import { superAdminService } from './superadmin.service.js';

class SuperAdminController {
    // GET /superadmin/tenants
    async listTenants(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenants = await superAdminService.listTenants();
            res.status(200).json(tenants);
        } catch (error) {
            next(error);
        }
    }

    // GET /superadmin/tenants/:id
    async getTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenant = await superAdminService.getTenantById(req.params.id);
            res.status(200).json(tenant);
        } catch (error) {
            next(error);
        }
    }

    // POST /superadmin/tenants
    async createTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenant = await superAdminService.createTenant(req.body);
            res.status(201).json(tenant);
        } catch (error) {
            next(error);
        }
    }

    // PUT /superadmin/tenants/:id
    async updateTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenant = await superAdminService.updateTenant(req.params.id, req.body);
            res.status(200).json(tenant);
        } catch (error) {
            next(error);
        }
    }

    // POST /superadmin/tenants/:id/suspend
    async suspendTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await superAdminService.suspendTenant(req.params.id);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    // POST /superadmin/tenants/:id/activate
    async activateTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await superAdminService.activateTenant(req.params.id);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    // DELETE /superadmin/tenants/:id
    async deleteTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await superAdminService.deleteTenant(req.params.id);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    // GET /superadmin/kpis
    async getKPIs(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const [dashboard, financial] = await Promise.all([
                superAdminService.getDashboardKPIs(),
                superAdminService.getFinancialKPIs(),
            ]);
            res.status(200).json({ dashboard, financial });
        } catch (error) {
            next(error);
        }
    }

    // POST /superadmin/users/:id/reset-password
    async resetUserPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { newPassword } = req.body;
            if (!newPassword || newPassword.length < 6) {
                res.status(400).json({ message: 'Nova senha deve ter pelo menos 6 caracteres' });
                return;
            }
            const result = await superAdminService.resetUserPassword(req.params.id, newPassword);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    // POST /superadmin/impersonate/:tenantId
    async impersonate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await superAdminService.impersonate(req.params.tenantId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    // GET /superadmin/plans
    async listPlans(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const plans = await superAdminService.listPlans();
            res.status(200).json(plans);
        } catch (error) {
            next(error);
        }
    }
}

export const superAdminController = new SuperAdminController();
