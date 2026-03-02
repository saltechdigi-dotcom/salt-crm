import { prisma } from '../../config/database.js';
import { NotFoundError, AppError } from '../../utils/errors.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class SuperAdminService {
    // ===================== AUTH =====================
    async login(email: string, password: string) {
        const admin = await prisma.superAdminUser.findUnique({ where: { email } });
        if (!admin || !admin.isActive) {
            throw new AppError('Credenciais inválidas', 401, 'UNAUTHORIZED');
        }

        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) {
            throw new AppError('Credenciais inválidas', 401, 'UNAUTHORIZED');
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: admin.role, isSuperAdmin: true },
            process.env.JWT_SECRET || 'salt-secret',
            { expiresIn: '24h' }
        );

        await prisma.superAdminUser.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() },
        });

        return {
            token,
            user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
        };
    }

    // ===================== TENANTS =====================
    async listTenants(params: {
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const { status, search, page = 1, limit = 20 } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.tenant.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    plan: { select: { id: true, name: true, displayName: true } },
                    _count: { select: { users: true, leads: true, sales: true } },
                },
            }),
            prisma.tenant.count({ where }),
        ]);

        return {
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async getTenant(id: string) {
        const tenant = await prisma.tenant.findUnique({
            where: { id },
            include: {
                plan: true,
                settings: true,
                onboarding: true,
                _count: {
                    select: { users: true, leads: true, sales: true, conversations: true, supportTickets: true },
                },
            },
        });
        if (!tenant) throw new NotFoundError('Tenant não encontrado');
        return tenant;
    }

    async createTenant(data: {
        name: string;
        email: string;
        phone?: string;
        document?: string;
        planId?: string;
        usersLimit?: number;
        segment?: string;
        salesOrigin?: string;
    }) {
        const tenant = await prisma.tenant.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                document: data.document,
                planId: data.planId,
                usersLimit: data.usersLimit || 3,
                segment: data.segment,
                salesOrigin: data.salesOrigin,
                slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            },
            include: {
                plan: { select: { id: true, name: true, displayName: true } },
            },
        });
        return tenant;
    }

    async updateTenant(id: string, data: any) {
        const existing = await prisma.tenant.findUnique({ where: { id } });
        if (!existing) throw new NotFoundError('Tenant não encontrado');

        const updateData: any = {};
        const fields = ['name', 'email', 'phone', 'document', 'planId', 'usersLimit',
            'monthlyValue', 'status', 'lifecycleStatus', 'paymentStatus', 'segment',
            'salesOrigin', 'internalNotes'];

        for (const field of fields) {
            if (data[field] !== undefined) {
                updateData[field] = data[field];
            }
        }

        // Track status changes
        if (data.status === 'suspended' && existing.status !== 'suspended') {
            updateData.suspendedAt = new Date();
        }
        if (data.status === 'cancelled' && existing.status !== 'cancelled') {
            updateData.cancelledAt = new Date();
        }

        const tenant = await prisma.tenant.update({
            where: { id },
            data: updateData,
            include: {
                plan: { select: { id: true, name: true, displayName: true } },
                _count: { select: { users: true, leads: true, sales: true } },
            },
        });
        return tenant;
    }

    async deleteTenant(id: string) {
        const existing = await prisma.tenant.findUnique({ where: { id } });
        if (!existing) throw new NotFoundError('Tenant não encontrado');
        await prisma.tenant.delete({ where: { id } });
    }

    // ===================== DASHBOARD STATS =====================
    async getDashboardStats() {
        const [totalTenants, activeTenants, suspendedTenants, totalUsers, totalLeads,
            totalSales, openTickets, pendingAlerts] = await Promise.all([
                prisma.tenant.count(),
                prisma.tenant.count({ where: { status: 'active' } }),
                prisma.tenant.count({ where: { status: 'suspended' } }),
                prisma.user.count(),
                prisma.lead.count(),
                prisma.sale.count(),
                prisma.supportTicket.count({ where: { status: { not: 'resolved' } } }),
                prisma.criticalAlert.count({ where: { status: 'pending' } }),
            ]);

        const mrr = await prisma.tenant.aggregate({
            where: { status: 'active' },
            _sum: { monthlyValue: true },
        });

        return {
            tenants: { total: totalTenants, active: activeTenants, suspended: suspendedTenants },
            users: totalUsers,
            leads: totalLeads,
            sales: totalSales,
            openTickets,
            pendingAlerts,
            mrr: mrr._sum.monthlyValue || 0,
        };
    }

    // ===================== ALERTS =====================
    async listAlerts(params: { status?: string; page?: number; limit?: number }) {
        const { status, page = 1, limit = 20 } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;

        const [data, total] = await Promise.all([
            prisma.criticalAlert.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    tenant: { select: { id: true, name: true } },
                    resolvedBy: { select: { id: true, name: true } },
                },
            }),
            prisma.criticalAlert.count({ where }),
        ]);

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async resolveAlert(id: string, resolvedById: string, resolutionNotes: string) {
        const alert = await prisma.criticalAlert.findUnique({ where: { id } });
        if (!alert) throw new NotFoundError('Alerta não encontrado');

        return prisma.criticalAlert.update({
            where: { id },
            data: {
                status: 'resolved',
                resolvedById,
                resolvedAt: new Date(),
                resolutionNotes,
            },
        });
    }

    // ===================== PLANS =====================
    async listPlans() {
        return prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } });
    }
}

export const superAdminService = new SuperAdminService();
