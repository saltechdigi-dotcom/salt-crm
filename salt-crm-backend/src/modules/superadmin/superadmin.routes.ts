import { Router } from 'express';
import { superAdminController } from './superadmin.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

// All superadmin routes require authentication
router.use(authMiddleware);

// Tenants CRUD
router.get('/tenants', superAdminController.listTenants);
router.get('/tenants/:id', superAdminController.getTenant);
router.post('/tenants', superAdminController.createTenant);
router.put('/tenants/:id', superAdminController.updateTenant);
router.post('/tenants/:id/suspend', superAdminController.suspendTenant);
router.post('/tenants/:id/activate', superAdminController.activateTenant);
router.delete('/tenants/:id', superAdminController.deleteTenant);

// KPIs
router.get('/kpis', superAdminController.getKPIs);

// User management
router.post('/users/:id/reset-password', superAdminController.resetUserPassword);

// Impersonation
router.post('/impersonate/:tenantId', superAdminController.impersonate);

// Plans
router.get('/plans', superAdminController.listPlans);

export { router as superAdminRoutes };
