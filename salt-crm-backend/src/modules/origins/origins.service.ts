import { prisma } from '../../config/database.js';
import type { AuthUser } from '../../types/express.js';

export class OriginsService {
    async findAll(authUser: AuthUser) {
        return prisma.leadOrigin.findMany({
            where: { tenantId: authUser.tenantId, isActive: true },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                type: true,
                color: true,
                icon: true,
                isActive: true,
            },
        });
    }

    async create(authUser: AuthUser, data: { name: string; color?: string; icon?: string }) {
        return prisma.leadOrigin.create({
            data: {
                tenantId: authUser.tenantId,
                name: data.name,
                type: 'manual',
                color: data.color || '#6B7280',
                icon: data.icon,
            },
        });
    }

    async delete(authUser: AuthUser, id: string) {
        const origin = await prisma.leadOrigin.findFirst({
            where: { id, tenantId: authUser.tenantId },
        });
        if (!origin) throw new Error('Origem não encontrada');
        await prisma.leadOrigin.delete({ where: { id } });
    }
}

export const originsService = new OriginsService();
