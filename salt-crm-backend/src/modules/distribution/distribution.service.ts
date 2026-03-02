import { prisma } from '../../config/database.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { paginate } from '../../utils/helpers.js';
import type { AuthUser } from '../../types/express.js';
import type {
    CreateDistributionRuleInput,
    UpdateDistributionRuleInput,
    DistributeLeadInput,
    ListDistributionRulesQuery,
    ListDistributionLogsQuery,
} from './distribution.schema.js';

export class DistributionService {
    // ============ RULES ============

    async findAllRules(authUser: AuthUser, query: ListDistributionRulesQuery) {
        const { page, limit } = query;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = {
            tenantId: authUser.tenantId,
        };

        if (query.type) where.type = query.type;
        if (query.isActive !== undefined) where.isActive = query.isActive;

        const [rules, total] = await Promise.all([
            prisma.distributionRule.findMany({
                where,
                orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.distributionRule.count({ where }),
        ]);

        return paginate(rules, page, limit, total);
    }

    async findRuleById(authUser: AuthUser, id: string) {
        const rule = await prisma.distributionRule.findFirst({
            where: { id, tenantId: authUser.tenantId },
            include: {
                lastAssignedUser: {
                    select: { id: true, name: true, avatarUrl: true },
                },
                _count: { select: { distributionLogs: true } },
            },
        });

        if (!rule) {
            throw new NotFoundError('Regra de distribuição não encontrada');
        }

        return rule;
    }

    async createRule(authUser: AuthUser, data: CreateDistributionRuleInput) {
        return prisma.distributionRule.create({
            data: {
                tenantId: authUser.tenantId,
                name: data.name,
                type: data.type,
                priority: data.priority,
                isActive: data.isActive,
                criteria: data.criteria,
                targetUsers: data.targetUsers,
                targetTeams: data.targetTeams,
                respectCapacity: data.respectCapacity,
                respectWorkingHours: data.respectWorkingHours,
            },
        });
    }

    async updateRule(authUser: AuthUser, id: string, data: UpdateDistributionRuleInput) {
        await this.findRuleById(authUser, id);

        return prisma.distributionRule.update({
            where: { id },
            data,
        });
    }

    async deleteRule(authUser: AuthUser, id: string) {
        await this.findRuleById(authUser, id);
        await prisma.distributionRule.delete({ where: { id } });
        return { message: 'Regra de distribuição removida com sucesso' };
    }

    // ============ DISTRIBUTION ============

    async distributeLead(authUser: AuthUser, data: DistributeLeadInput) {
        // Verify lead exists
        const lead = await prisma.lead.findFirst({
            where: { id: data.leadId, tenantId: authUser.tenantId },
        });

        if (!lead) {
            throw new NotFoundError('Lead não encontrado');
        }

        let assignedToId = data.assignedToId;
        let ruleId = data.ruleId;
        let distributionType: 'automatic' | 'manual' | 'transfer' = 'manual';

        // If a rule is specified, use it to find the next user
        if (ruleId && !assignedToId) {
            const rule = await this.findRuleById(authUser, ruleId);
            distributionType = 'automatic';

            if (rule.type === 'round_robin') {
                assignedToId = (await this.getNextRoundRobinUser(authUser.tenantId, rule)) ?? undefined;
            } else {
                // For other types, use weighted or priority logic
                assignedToId = (await this.getNextRoundRobinUser(authUser.tenantId, rule)) ?? undefined;
            }

            if (!assignedToId) {
                throw new BadRequestError('Nenhum usuário disponível para distribuição');
            }

            // Update rule's last assigned
            await prisma.distributionRule.update({
                where: { id: ruleId },
                data: { lastAssignedUserId: assignedToId, lastAssignedAt: new Date() },
            });
        }

        if (!assignedToId) {
            throw new BadRequestError('É necessário especificar um usuário ou uma regra de distribuição');
        }

        // If lead already has an owner, this is a transfer
        if (lead.assignedToId) {
            distributionType = 'transfer';
        }

        // Assign the lead
        await prisma.lead.update({
            where: { id: data.leadId },
            data: { assignedToId },
        });

        // Create distribution log
        const log = await prisma.distributionLog.create({
            data: {
                tenantId: authUser.tenantId,
                leadId: data.leadId,
                ruleId: ruleId || undefined,
                assignedToId,
                distributionType,
                previousOwnerId: lead.assignedToId || undefined,
                reason: data.reason,
            },
            include: {
                lead: { select: { id: true, name: true } },
                assignedTo: { select: { id: true, name: true } },
                previousOwner: { select: { id: true, name: true } },
            },
        });

        return log;
    }

    private async getNextRoundRobinUser(tenantId: string, rule: { targetUsers: string[]; lastAssignedUserId: string | null }) {
        const eligibleUsers = await prisma.user.findMany({
            where: {
                tenantId,
                isActive: true,
                receivesLeads: true,
                id: rule.targetUsers.length > 0 ? { in: rule.targetUsers } : undefined,
            },
            select: { id: true },
            orderBy: { createdAt: 'asc' },
        });

        if (eligibleUsers.length === 0) return null;

        // Find next user after last assigned
        if (rule.lastAssignedUserId) {
            const lastIndex = eligibleUsers.findIndex(u => u.id === rule.lastAssignedUserId);
            const nextIndex = (lastIndex + 1) % eligibleUsers.length;
            return eligibleUsers[nextIndex].id;
        }

        return eligibleUsers[0].id;
    }

    // ============ LOGS ============

    async findAllLogs(authUser: AuthUser, query: ListDistributionLogsQuery) {
        const { page, limit } = query;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = {
            tenantId: authUser.tenantId,
        };

        if (query.leadId) where.leadId = query.leadId;
        if (query.assignedToId) where.assignedToId = query.assignedToId;
        if (query.ruleId) where.ruleId = query.ruleId;
        if (query.distributionType) where.distributionType = query.distributionType;

        if (query.startDate || query.endDate) {
            where.createdAt = {};
            if (query.startDate) where.createdAt.gte = new Date(query.startDate);
            if (query.endDate) where.createdAt.lte = new Date(query.endDate);
        }

        const [logs, total] = await Promise.all([
            prisma.distributionLog.findMany({
                where,
                include: {
                    lead: { select: { id: true, name: true, phone: true } },
                    assignedTo: { select: { id: true, name: true, avatarUrl: true } },
                    previousOwner: { select: { id: true, name: true } },
                    rule: { select: { id: true, name: true, type: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.distributionLog.count({ where }),
        ]);

        return paginate(logs, page, limit, total);
    }
}

export const distributionService = new DistributionService();
