import { prisma } from '../../config/database.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';
import type { AuthUser } from '../../types/express.js';
import type { CreateSaleInput, UpdateSaleStatusInput } from './sales.schema.js';

export class SalesService {
    async findAll(authUser: AuthUser, filters?: { status?: string; startDate?: string; endDate?: string }) {
        const where: any = { tenantId: authUser.tenantId };

        // Filter by role
        if (authUser.role === 'agent') {
            where.agentId = authUser.id;
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.startDate || filters?.endDate) {
            where.saleDate = {};
            if (filters.startDate) where.saleDate.gte = new Date(filters.startDate);
            if (filters.endDate) where.saleDate.lte = new Date(filters.endDate);
        }

        return prisma.sale.findMany({
            where,
            include: {
                agent: { select: { id: true, name: true, avatarUrl: true } },
                manager: { select: { id: true, name: true } },
                product: { select: { id: true, name: true, code: true } },
                lead: { select: { id: true, name: true, phone: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(authUser: AuthUser, id: string) {
        const sale = await prisma.sale.findFirst({
            where: { id, tenantId: authUser.tenantId },
            include: {
                agent: { select: { id: true, name: true, avatarUrl: true } },
                manager: { select: { id: true, name: true } },
                product: { select: { id: true, name: true, code: true } },
                lead: { select: { id: true, name: true, phone: true } },
            },
        });
        if (!sale) throw new NotFoundError('Venda não encontrada');
        return sale;
    }

    async create(authUser: AuthUser, data: CreateSaleInput) {
        const finalValue = data.saleValue - (data.discountValue || 0);

        const sale = await prisma.sale.create({
            data: {
                tenantId: authUser.tenantId,
                agentId: authUser.id,
                leadId: data.leadId,
                clientName: data.clientName,
                clientDocument: data.clientDocument,
                clientDocumentType: data.clientDocumentType as any,
                clientPhone: data.clientPhone,
                clientEmail: data.clientEmail,
                productId: data.productId,
                productName: data.productName,
                productCode: data.productCode,
                saleValue: data.saleValue,
                discountValue: data.discountValue || 0,
                finalValue,
                paymentMethod: data.paymentMethod as any,
                paymentCondition: (data.paymentCondition || 'cash') as any,
                installments: data.installments || 1,
                observations: data.observations,
                status: 'pending_manager',
            },
            include: {
                agent: { select: { id: true, name: true } },
                product: { select: { id: true, name: true } },
            },
        });

        // If linked to a lead, mark it as converted
        if (data.leadId) {
            await prisma.lead.update({
                where: { id: data.leadId },
                data: { convertedToClientAt: new Date() },
            }).catch(() => { }); // Don't fail the sale if lead update fails
        }

        return sale;
    }

    async updateStatus(authUser: AuthUser, id: string, data: UpdateSaleStatusInput) {
        const sale = await this.findById(authUser, id);

        // Only admin and manager can validate
        if (authUser.role === 'agent') {
            throw new ForbiddenError('Sem permissão para alterar status da venda');
        }

        const updateData: any = { status: data.status };

        if (data.status === 'validated' || data.status === 'pending_admin') {
            updateData.managerValidatedAt = new Date();
            updateData.managerComment = data.managerComment;
        }

        if (data.status === 'rejected') {
            updateData.managerRejectedAt = new Date();
            updateData.managerComment = data.managerComment;
        }

        if (data.status === 'validated' && authUser.role === 'admin') {
            updateData.adminViewedAt = new Date();
        }

        return prisma.sale.update({
            where: { id },
            data: updateData,
            include: {
                agent: { select: { id: true, name: true } },
                product: { select: { id: true, name: true } },
            },
        });
    }

    // Dashboard stats endpoint
    async getStats(authUser: AuthUser) {
        const tenantId = authUser.tenantId;

        // Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // This month
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        const whereBase: any = { tenantId };
        if (authUser.role === 'agent') whereBase.agentId = authUser.id;

        // Total sales (all time, validated only)
        const totalSales = await prisma.sale.aggregate({
            where: { ...whereBase, status: 'validated' },
            _sum: { finalValue: true },
            _count: true,
        });

        // Today's sales
        const todaySales = await prisma.sale.aggregate({
            where: { ...whereBase, saleDate: { gte: today, lt: tomorrow } },
            _sum: { finalValue: true },
            _count: true,
        });

        // This month's sales
        const monthSales = await prisma.sale.aggregate({
            where: { ...whereBase, saleDate: { gte: monthStart, lt: monthEnd } },
            _sum: { finalValue: true },
            _count: true,
        });

        // Pending sales
        const pendingSales = await prisma.sale.count({
            where: { ...whereBase, status: { in: ['pending_manager', 'pending_admin'] } },
        });

        // Recent sales (last 10)
        const recentSales = await prisma.sale.findMany({
            where: whereBase,
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                agent: { select: { id: true, name: true, avatarUrl: true } },
                product: { select: { id: true, name: true } },
            },
        });

        // Sales by agent (this month)
        const salesByAgent = await prisma.sale.groupBy({
            by: ['agentId'],
            where: { ...whereBase, saleDate: { gte: monthStart, lt: monthEnd }, status: 'validated' },
            _sum: { finalValue: true },
            _count: true,
        });

        // Fetch agent names
        const agentIds = salesByAgent.map(s => s.agentId);
        const agents = await prisma.user.findMany({
            where: { id: { in: agentIds } },
            select: { id: true, name: true, avatarUrl: true },
        });

        const salesByAgentWithNames = salesByAgent.map(s => ({
            agentId: s.agentId,
            agent: agents.find(a => a.id === s.agentId),
            totalValue: s._sum.finalValue,
            count: s._count,
        }));

        return {
            totalRevenue: totalSales._sum.finalValue || 0,
            totalSalesCount: totalSales._count || 0,
            todayRevenue: todaySales._sum.finalValue || 0,
            todaySalesCount: todaySales._count || 0,
            monthRevenue: monthSales._sum.finalValue || 0,
            monthSalesCount: monthSales._count || 0,
            pendingSalesCount: pendingSales,
            recentSales,
            salesByAgent: salesByAgentWithNames,
        };
    }
}

export const salesService = new SalesService();
