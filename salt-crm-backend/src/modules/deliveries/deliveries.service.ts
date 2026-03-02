import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/errors.js';
import type { AuthUser } from '../../types/express.js';
import type { CreateDeliveryInput, UpdateDeliveryInput } from './deliveries.schema.js';

export class DeliveriesService {
    async findAll(authUser: AuthUser, filters?: { status?: string; sellerId?: string }) {
        const where: Record<string, any> = { tenantId: authUser.tenantId };

        if (filters?.status) where.deliveryStatus = filters.status;
        if (filters?.sellerId) where.sellerId = filters.sellerId;

        // Role-based filtering: agents only see their own, managers see all
        if (authUser.role === 'agent') {
            where.sellerId = authUser.id;
        }

        return prisma.delivery.findMany({
            where,
            orderBy: { scheduledDate: 'asc' },
            include: {
                seller: { select: { id: true, name: true } },
            },
        });
    }

    async findById(authUser: AuthUser, id: string) {
        const delivery = await prisma.delivery.findFirst({
            where: { id, tenantId: authUser.tenantId },
            include: {
                seller: { select: { id: true, name: true } },
                sale: { select: { id: true, clientName: true, status: true } },
            },
        });
        if (!delivery) throw new NotFoundError('Entrega não encontrada');
        return delivery;
    }

    async create(authUser: AuthUser, data: CreateDeliveryInput) {
        return prisma.delivery.create({
            data: {
                tenantId: authUser.tenantId,
                saleId: data.saleId,
                saleType: data.saleType,
                clientName: data.clientName,
                clientPhone: data.clientPhone,
                clientEmail: data.clientEmail || null,
                productName: data.productName,
                productCode: data.productCode || null,
                saleValue: data.saleValue,
                deliveryStatus: data.deliveryStatus,
                scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
                scheduledShift: data.scheduledShift || null,
                scheduledTime: data.scheduledTime || null,
                deliveryContact: data.deliveryContact || null,
                deliveryAddress: data.deliveryAddress || undefined,
                sellerId: authUser.id,
                sellerName: data.sellerName,
                saleDate: new Date(data.saleDate),
                observations: data.observations || null,
            },
        });
    }

    async update(authUser: AuthUser, id: string, data: UpdateDeliveryInput) {
        await this.findById(authUser, id);

        const updateData: Record<string, any> = {};
        if (data.deliveryStatus) {
            updateData.deliveryStatus = data.deliveryStatus;
            if (data.deliveryStatus === 'completed') {
                updateData.completedAt = new Date();
            }
        }
        if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate);
        if (data.scheduledShift !== undefined) updateData.scheduledShift = data.scheduledShift;
        if (data.scheduledTime !== undefined) updateData.scheduledTime = data.scheduledTime;
        if (data.deliveryContact !== undefined) updateData.deliveryContact = data.deliveryContact;
        if (data.deliveryAddress !== undefined) updateData.deliveryAddress = data.deliveryAddress;
        if (data.observations !== undefined) updateData.observations = data.observations;

        return prisma.delivery.update({
            where: { id },
            data: updateData,
        });
    }

    async complete(authUser: AuthUser, id: string) {
        await this.findById(authUser, id);

        return prisma.delivery.update({
            where: { id },
            data: { deliveryStatus: 'completed', completedAt: new Date() },
        });
    }

    async delete(authUser: AuthUser, id: string) {
        await this.findById(authUser, id);
        await prisma.delivery.delete({ where: { id } });
        return { message: 'Entrega removida' };
    }

    async getStats(authUser: AuthUser) {
        const where = { tenantId: authUser.tenantId };

        // Role-based: agents only see their own stats
        const agentFilter: Record<string, any> = { ...where };
        if (authUser.role === 'agent') {
            agentFilter.sellerId = authUser.id;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [totalPending, totalCompleted, todayCount, pendingProducts, pendingServices] = await Promise.all([
            prisma.delivery.count({ where: { ...agentFilter, deliveryStatus: { in: ['scheduled', 'immediate'] } } }),
            prisma.delivery.count({ where: { ...agentFilter, deliveryStatus: 'completed' } }),
            prisma.delivery.count({
                where: {
                    ...agentFilter,
                    deliveryStatus: { in: ['scheduled', 'immediate'] },
                    scheduledDate: { gte: today, lt: tomorrow },
                },
            }),
            prisma.delivery.count({ where: { ...agentFilter, deliveryStatus: { in: ['scheduled', 'immediate'] }, saleType: 'produto' } }),
            prisma.delivery.count({ where: { ...agentFilter, deliveryStatus: { in: ['scheduled', 'immediate'] }, saleType: 'servico' } }),
        ]);

        // Sum pending value
        const pendingAgg = await prisma.delivery.aggregate({
            where: { ...agentFilter, deliveryStatus: { in: ['scheduled', 'immediate'] } },
            _sum: { saleValue: true },
        });

        return {
            totalPending,
            totalCompleted,
            todayCount,
            pendingProducts,
            pendingServices,
            pendingValue: Number(pendingAgg._sum.saleValue || 0),
        };
    }
}

export const deliveriesService = new DeliveriesService();
