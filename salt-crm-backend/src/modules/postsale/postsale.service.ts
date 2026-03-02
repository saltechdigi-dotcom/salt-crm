import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/errors.js';
import type { AuthUser } from '../../types/express.js';
import type { CreateTemplateInput, UpdateTemplateInput, CreateJourneyInput } from './postsale.schema.js';

export class PostSaleService {
    // ========== TEMPLATES ==========

    async findAllTemplates(authUser: AuthUser, status?: string) {
        const where: Record<string, any> = { tenantId: authUser.tenantId };
        if (status) where.status = status;

        return prisma.postSaleTemplate.findMany({
            where,
            orderBy: { dayOffset: 'asc' },
        });
    }

    async createTemplate(authUser: AuthUser, data: CreateTemplateInput) {
        return prisma.postSaleTemplate.create({
            data: {
                tenantId: authUser.tenantId,
                ...data,
            },
        });
    }

    async updateTemplate(authUser: AuthUser, id: string, data: UpdateTemplateInput) {
        const existing = await prisma.postSaleTemplate.findFirst({
            where: { id, tenantId: authUser.tenantId },
        });
        if (!existing) throw new NotFoundError('Template não encontrado');

        return prisma.postSaleTemplate.update({
            where: { id },
            data,
        });
    }

    async deleteTemplate(authUser: AuthUser, id: string) {
        const existing = await prisma.postSaleTemplate.findFirst({
            where: { id, tenantId: authUser.tenantId },
        });
        if (!existing) throw new NotFoundError('Template não encontrado');

        await prisma.postSaleTemplate.delete({ where: { id } });
        return { message: 'Template removido' };
    }

    // ========== JOURNEYS ==========

    async findAllJourneys(authUser: AuthUser, status?: string) {
        const where: Record<string, any> = { tenantId: authUser.tenantId };
        if (status) where.status = status;

        return prisma.postSaleJourney.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { messages: true } },
            },
        });
    }

    async findJourneyById(authUser: AuthUser, id: string) {
        const journey = await prisma.postSaleJourney.findFirst({
            where: { id, tenantId: authUser.tenantId },
            include: {
                messages: { orderBy: { scheduledFor: 'asc' } },
            },
        });
        if (!journey) throw new NotFoundError('Jornada não encontrada');
        return journey;
    }

    async createJourney(authUser: AuthUser, data: CreateJourneyInput) {
        const templates = await prisma.postSaleTemplate.findMany({
            where: { tenantId: authUser.tenantId, status: 'active' },
            orderBy: { dayOffset: 'asc' },
        });

        const saleDate = new Date(data.saleDate);

        const journey = await prisma.postSaleJourney.create({
            data: {
                tenantId: authUser.tenantId,
                saleId: data.saleId,
                clientName: data.clientName,
                productSold: data.productSold,
                saleDate,
                messagesTotal: templates.length,
                messagesSent: 0,
            },
        });

        // Create scheduled messages from templates
        if (templates.length > 0) {
            await prisma.postSaleMessage.createMany({
                data: templates.map(t => ({
                    tenantId: authUser.tenantId,
                    templateId: t.id,
                    journeyId: journey.id,
                    clientName: data.clientName,
                    channel: t.channel,
                    content: t.content
                        .replace('{nome}', data.clientName)
                        .replace('{produto}', data.productSold),
                    wasAIGenerated: t.useAI,
                    scheduledFor: new Date(saleDate.getTime() + t.dayOffset * 86400000),
                    status: 'pending',
                })),
            });
        }

        return journey;
    }

    async cancelJourney(authUser: AuthUser, id: string) {
        const journey = await prisma.postSaleJourney.findFirst({
            where: { id, tenantId: authUser.tenantId },
        });
        if (!journey) throw new NotFoundError('Jornada não encontrada');

        await prisma.$transaction([
            prisma.postSaleMessage.updateMany({
                where: { journeyId: id, status: 'pending' },
                data: { status: 'cancelled' },
            }),
            prisma.postSaleJourney.update({
                where: { id },
                data: { status: 'cancelled', completedAt: new Date() },
            }),
        ]);

        return { message: 'Jornada cancelada' };
    }

    // ========== MESSAGES ==========

    async findMessages(authUser: AuthUser, journeyId?: string, status?: string) {
        const where: Record<string, any> = { tenantId: authUser.tenantId };
        if (journeyId) where.journeyId = journeyId;
        if (status) where.status = status;

        return prisma.postSaleMessage.findMany({
            where,
            orderBy: { scheduledFor: 'asc' },
        });
    }

    // ========== STATS ==========

    async getStats(authUser: AuthUser) {
        const [activeJourneys, pendingMessages, sentMessages, aiMessages, respondedMessages] = await Promise.all([
            prisma.postSaleJourney.count({ where: { tenantId: authUser.tenantId, status: 'active' } }),
            prisma.postSaleMessage.count({ where: { tenantId: authUser.tenantId, status: 'pending' } }),
            prisma.postSaleMessage.count({ where: { tenantId: authUser.tenantId, status: 'sent' } }),
            prisma.postSaleMessage.count({ where: { tenantId: authUser.tenantId, wasAIGenerated: true } }),
            prisma.postSaleMessage.count({ where: { tenantId: authUser.tenantId, response: { not: null } } }),
        ]);

        const responseRate = sentMessages > 0 ? Math.round((respondedMessages / sentMessages) * 100) : 0;

        return { activeJourneys, pendingMessages, sentMessages, aiMessages, responseRate };
    }
}

export const postSaleService = new PostSaleService();
