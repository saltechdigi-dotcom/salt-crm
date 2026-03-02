import { z } from 'zod';

export const superAdminLoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const createTenantSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    document: z.string().optional(),
    planId: z.string().uuid().optional(),
    usersLimit: z.number().int().positive().optional().default(3),
    segment: z.string().optional(),
    salesOrigin: z.string().optional(),
});

export const updateTenantSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    document: z.string().optional(),
    planId: z.string().uuid().optional(),
    usersLimit: z.number().int().positive().optional(),
    monthlyValue: z.number().positive().optional(),
    status: z.enum(['active', 'suspended', 'cancelled']).optional(),
    lifecycleStatus: z.enum(['onboarding', 'active', 'risk', 'overdue', 'suspended', 'cancelled']).optional(),
    paymentStatus: z.enum(['on_time', 'overdue']).optional(),
    segment: z.string().optional(),
    salesOrigin: z.string().optional(),
    internalNotes: z.string().optional(),
});

export const tenantParamsSchema = z.object({
    id: z.string().uuid(),
});

export const listTenantsSchema = z.object({
    status: z.enum(['active', 'suspended', 'cancelled']).optional(),
    search: z.string().optional(),
    page: z.string().optional().transform(Number).pipe(z.number().int().positive().optional()),
    limit: z.string().optional().transform(Number).pipe(z.number().int().positive().max(100).optional()),
});

export const resolveAlertSchema = z.object({
    resolutionNotes: z.string().min(1),
});
