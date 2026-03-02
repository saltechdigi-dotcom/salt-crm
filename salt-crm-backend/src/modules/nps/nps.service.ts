import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/errors.js';
import { paginate } from '../../utils/helpers.js';
import type { AuthUser } from '../../types/express.js';
import type { CreateNpsSurveyInput, RespondNpsSurveyInput, ListNpsSurveysQuery } from './nps.schema.js';
import type { NpsClassification } from '@prisma/client';

function classifyNps(score: number): NpsClassification {
    if (score >= 9) return 'promoter';
    if (score >= 7) return 'passive';
    return 'detractor';
}

export class NpsService {
    private readonly surveySelect = {
        id: true,
        sentVia: true,
        sentAt: true,
        respondedAt: true,
        score: true,
        classification: true,
        feedback: true,
        createdAt: true,
        lead: { select: { id: true, name: true, phone: true } },
        sale: { select: { id: true, clientName: true, productName: true } },
        agent: { select: { id: true, name: true, avatarUrl: true } },
    };

    async findAll(authUser: AuthUser, query: ListNpsSurveysQuery) {
        const { page, limit } = query;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = {
            tenantId: authUser.tenantId,
        };

        if (authUser.role === 'agent') {
            where.agentId = authUser.id;
        }

        if (query.classification) where.classification = query.classification;
        if (query.sentVia) where.sentVia = query.sentVia;
        if (query.agentId && authUser.role !== 'agent') where.agentId = query.agentId;
        if (query.responded !== undefined) {
            where.respondedAt = query.responded ? { not: null } : null;
        }

        if (query.startDate || query.endDate) {
            where.createdAt = {};
            if (query.startDate) where.createdAt.gte = new Date(query.startDate);
            if (query.endDate) where.createdAt.lte = new Date(query.endDate);
        }

        const [surveys, total] = await Promise.all([
            prisma.npsSurvey.findMany({
                where,
                select: this.surveySelect,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.npsSurvey.count({ where }),
        ]);

        return paginate(surveys, page, limit, total);
    }

    async getStats(authUser: AuthUser) {
        const where = {
            tenantId: authUser.tenantId,
            respondedAt: { not: null as null | undefined },
        };

        const [total, promoters, passives, detractors, avgScore] = await Promise.all([
            prisma.npsSurvey.count({ where }),
            prisma.npsSurvey.count({ where: { ...where, classification: 'promoter' } }),
            prisma.npsSurvey.count({ where: { ...where, classification: 'passive' } }),
            prisma.npsSurvey.count({ where: { ...where, classification: 'detractor' } }),
            prisma.npsSurvey.aggregate({ where, _avg: { score: true } }),
        ]);

        const npsScore = total > 0
            ? Math.round(((promoters - detractors) / total) * 100)
            : 0;

        return {
            total,
            promoters,
            passives,
            detractors,
            npsScore,
            avgScore: avgScore._avg.score || 0,
            pending: await prisma.npsSurvey.count({
                where: { tenantId: authUser.tenantId, respondedAt: null },
            }),
        };
    }

    async findById(authUser: AuthUser, id: string) {
        const survey = await prisma.npsSurvey.findFirst({
            where: { id, tenantId: authUser.tenantId },
            select: this.surveySelect,
        });

        if (!survey) {
            throw new NotFoundError('Pesquisa NPS não encontrada');
        }

        return survey;
    }

    async create(authUser: AuthUser, data: CreateNpsSurveyInput) {
        return prisma.npsSurvey.create({
            data: {
                tenantId: authUser.tenantId,
                leadId: data.leadId,
                saleId: data.saleId,
                conversationId: data.conversationId,
                agentId: data.agentId || authUser.id,
                sentVia: data.sentVia,
            },
            select: this.surveySelect,
        });
    }

    async respond(authUser: AuthUser, id: string, data: RespondNpsSurveyInput) {
        await this.findById(authUser, id);

        return prisma.npsSurvey.update({
            where: { id },
            data: {
                score: data.score,
                classification: classifyNps(data.score),
                feedback: data.feedback,
                respondedAt: new Date(),
            },
            select: this.surveySelect,
        });
    }

    async delete(authUser: AuthUser, id: string) {
        await this.findById(authUser, id);
        await prisma.npsSurvey.delete({ where: { id } });
        return { message: 'Pesquisa NPS removida com sucesso' };
    }
}

export const npsService = new NpsService();
