import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/errors.js';
import { paginate } from '../../utils/helpers.js';
import type { AuthUser } from '../../types/express.js';
import type { CreateNotificationInput, ListNotificationsQuery } from './notifications.schema.js';

export class NotificationsService {
    async findAll(authUser: AuthUser, query: ListNotificationsQuery) {
        const { page, limit } = query;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = {
            tenantId: authUser.tenantId,
            OR: [
                { userId: authUser.id },
                { userId: null, targetRoles: { has: authUser.role } },
                { userId: null, teamId: authUser.teamId },
            ],
        };

        if (query.isRead !== undefined) where.isRead = query.isRead;
        if (query.category) where.category = query.category;
        if (query.type) where.type = query.type;

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.notification.count({ where }),
        ]);

        return paginate(notifications, page, limit, total);
    }

    async getUnreadCount(authUser: AuthUser) {
        const count = await prisma.notification.count({
            where: {
                tenantId: authUser.tenantId,
                isRead: false,
                OR: [
                    { userId: authUser.id },
                    { userId: null, targetRoles: { has: authUser.role } },
                    { userId: null, teamId: authUser.teamId },
                ],
            },
        });
        return { unreadCount: count };
    }

    async create(authUser: AuthUser, data: CreateNotificationInput) {
        return prisma.notification.create({
            data: {
                tenantId: authUser.tenantId,
                userId: data.userId,
                targetRoles: data.targetRoles,
                teamId: data.teamId,
                type: data.type,
                category: data.category,
                title: data.title,
                message: data.message,
                actionUrl: data.actionUrl,
                icon: data.icon,
            },
        });
    }

    async markAsRead(authUser: AuthUser, id: string) {
        const notification = await prisma.notification.findFirst({
            where: { id, tenantId: authUser.tenantId },
        });

        if (!notification) {
            throw new NotFoundError('Notificação não encontrada');
        }

        return prisma.notification.update({
            where: { id },
            data: { isRead: true, readAt: new Date() },
        });
    }

    async markAllAsRead(authUser: AuthUser) {
        const result = await prisma.notification.updateMany({
            where: {
                tenantId: authUser.tenantId,
                isRead: false,
                OR: [
                    { userId: authUser.id },
                    { userId: null, targetRoles: { has: authUser.role } },
                    { userId: null, teamId: authUser.teamId },
                ],
            },
            data: { isRead: true, readAt: new Date() },
        });
        return { updated: result.count };
    }

    async delete(authUser: AuthUser, id: string) {
        const notification = await prisma.notification.findFirst({
            where: { id, tenantId: authUser.tenantId },
        });

        if (!notification) {
            throw new NotFoundError('Notificação não encontrada');
        }

        await prisma.notification.delete({ where: { id } });
        return { message: 'Notificação removida com sucesso' };
    }
}

export const notificationsService = new NotificationsService();
