import { Router, Request, Response, NextFunction } from 'express';
import { superAdminController } from './super-admin.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import {
    superAdminLoginSchema,
    createTenantSchema,
    updateTenantSchema,
    tenantParamsSchema,
    listTenantsSchema,
    resolveAlertSchema,
} from './super-admin.schema.js';
import jwt from 'jsonwebtoken';

const router = Router();

// ============ Super Admin Auth Middleware ============
function superAdminAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'salt-secret') as any;
        if (!decoded.isSuperAdmin) {
            return res.status(403).json({ message: 'Acesso restrito a Super Admin' });
        }
        (req as any).superAdminId = decoded.id;
        (req as any).superAdminRole = decoded.role;
        next();
    } catch {
        return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
}

// ============ Public Routes ============
// POST /super-admin/login
router.post('/login', validate({ body: superAdminLoginSchema }), superAdminController.login);

// ============ Protected Routes (require Super Admin JWT) ============
router.use(superAdminAuth);

// Dashboard
router.get('/dashboard', superAdminController.getDashboardStats);

// Plans
router.get('/plans', superAdminController.listPlans);

// Tenants CRUD
router.get('/tenants', validate({ query: listTenantsSchema }), superAdminController.listTenants);
router.get('/tenants/:id', validate({ params: tenantParamsSchema }), superAdminController.getTenant);
router.post('/tenants', validate({ body: createTenantSchema }), superAdminController.createTenant);
router.put('/tenants/:id', validate({ params: tenantParamsSchema, body: updateTenantSchema }), superAdminController.updateTenant);
router.delete('/tenants/:id', validate({ params: tenantParamsSchema }), superAdminController.deleteTenant);

// Alerts
router.get('/alerts', superAdminController.listAlerts);
router.patch('/alerts/:id/resolve', validate({ params: tenantParamsSchema, body: resolveAlertSchema }), superAdminController.resolveAlert);

export default router;
