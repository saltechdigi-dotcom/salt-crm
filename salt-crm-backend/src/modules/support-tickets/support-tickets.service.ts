import { prisma } from '../../config/database.js';
import { AppError, NotFoundError } from '../../utils/errors.js';

interface CreateSupportTicketData {
    type: string;
    subject: string;
    description: string;
    priority?: string;
}

interface UpdateSupportTicketData {
    type?: string;
    subject?: string;
    description?: string;
    priority?: string;
    status?: string;
    resolutionNotes?: string;
}

interface FindSupportTicketsParams {
    tenantId: string;
    userId?: string;
    status?: string;
    priority?: string;
    type?: string;
    page?: number;
    limit?: number;
}

export class SupportTicketsService {
    async findAll(params: FindSupportTicketsParams) {
        const { tenantId, userId, status, priority, type, page = 1, limit = 20 } = params;
        const skip = (page - 1) * limit;

        const where: any = { tenantId };
        if (userId) where.userId = userId;
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (type) where.type = type;

        const [data, total] = await Promise.all([
            prisma.supportTicket.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    assignedTo: { select: { id: true, name: true, email: true } },
                    resolvedBy: { select: { id: true, name: true, email: true } },
                },
            }),
            prisma.supportTicket.count({ where }),
        ]);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findById(id: string, tenantId: string) {
        const ticket = await prisma.supportTicket.findFirst({
            where: { id, tenantId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true } },
                resolvedBy: { select: { id: true, name: true, email: true } },
            },
        });

        if (!ticket) {
            throw new NotFoundError('Ticket não encontrado');
        }

        return ticket;
    }

    async create(data: CreateSupportTicketData, userId: string, tenantId: string) {
        const ticket = await prisma.supportTicket.create({
            data: {
                type: data.type as any,
                subject: data.subject,
                description: data.description,
                priority: (data.priority || 'medium') as any,
                status: 'open',
                userId,
                tenantId,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        return ticket;
    }

    async update(id: string, data: UpdateSupportTicketData, tenantId: string) {
        const existing = await prisma.supportTicket.findFirst({
            where: { id, tenantId },
        });

        if (!existing) {
            throw new NotFoundError('Ticket não encontrado');
        }

        const updateData: any = {};
        if (data.type) updateData.type = data.type;
        if (data.subject) updateData.subject = data.subject;
        if (data.description) updateData.description = data.description;
        if (data.priority) updateData.priority = data.priority;
        if (data.status) updateData.status = data.status;
        if (data.resolutionNotes !== undefined) updateData.resolutionNotes = data.resolutionNotes;

        if (data.status === 'resolved') {
            updateData.resolvedAt = new Date();
        }

        const ticket = await prisma.supportTicket.update({
            where: { id },
            data: updateData,
            include: {
                user: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true } },
            },
        });

        return ticket;
    }

    async resolve(id: string, resolutionNotes: string, resolvedById: string, tenantId: string) {
        const existing = await prisma.supportTicket.findFirst({
            where: { id, tenantId },
        });

        if (!existing) {
            throw new NotFoundError('Ticket não encontrado');
        }

        if (existing.status === 'resolved') {
            throw new AppError('Ticket já está resolvido', 400, 'ALREADY_RESOLVED');
        }

        const ticket = await prisma.supportTicket.update({
            where: { id },
            data: {
                status: 'resolved',
                resolvedAt: new Date(),
                resolvedById,
                resolutionNotes,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                resolvedBy: { select: { id: true, name: true, email: true } },
            },
        });

        return ticket;
    }

    async delete(id: string, tenantId: string) {
        const existing = await prisma.supportTicket.findFirst({
            where: { id, tenantId },
        });

        if (!existing) {
            throw new NotFoundError('Ticket não encontrado');
        }

        await prisma.supportTicket.delete({ where: { id } });
    }

    async getStats(tenantId: string) {
        const [total, open, inProgress, resolved] = await Promise.all([
            prisma.supportTicket.count({ where: { tenantId } }),
            prisma.supportTicket.count({ where: { tenantId, status: 'open' } }),
            prisma.supportTicket.count({ where: { tenantId, status: 'in_progress' } }),
            prisma.supportTicket.count({ where: { tenantId, status: 'resolved' } }),
        ]);

        return { total, open, inProgress, resolved };
    }
}

export const supportTicketsService = new SupportTicketsService();
