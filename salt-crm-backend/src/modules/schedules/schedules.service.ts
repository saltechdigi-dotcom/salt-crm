import { prisma } from '../../config/database.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';
import { paginate } from '../../utils/helpers.js';
import type { AuthUser } from '../../types/express.js';
import type {
    CreateScheduleInput,
    UpdateScheduleInput,
    CompleteScheduleInput,
    ListSchedulesQuery,
} from './schedules.schema.js';

export class SchedulesService {
    private readonly scheduleSelect = {
        id: true,
        type: true,
        title: true,
        description: true,
        scheduledAt: true,
        endAt: true,
        timezone: true,
        location: true,
        conferenceLink: true,
        status: true,
        reminderMinutes: true,
        googleCalendarId: true,
        syncStatus: true,
        completedAt: true,
        completionNotes: true,
        createdAt: true,
        updatedAt: true,
        lead: {
            select: { id: true, name: true, phone: true },
        },
        assignedTo: {
            select: { id: true, name: true, avatarUrl: true },
        },
    };

    async findAll(authUser: AuthUser, query: ListSchedulesQuery) {
        const { page, limit } = query;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = {
            tenantId: authUser.tenantId,
        };

        // Role-based filtering
        if (authUser.role === 'agent') {
            where.assignedToId = authUser.id;
        }

        // Filters
        if (query.leadId) where.leadId = query.leadId;
        if (query.assignedToId && authUser.role !== 'agent') where.assignedToId = query.assignedToId;
        if (query.type) where.type = query.type;
        if (query.status) where.status = query.status;

        // Date range
        if (query.startDate || query.endDate) {
            where.scheduledAt = {};
            if (query.startDate) where.scheduledAt.gte = new Date(query.startDate);
            if (query.endDate) where.scheduledAt.lte = new Date(query.endDate);
        }

        const [schedules, total] = await Promise.all([
            prisma.schedule.findMany({
                where,
                select: this.scheduleSelect,
                orderBy: { scheduledAt: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.schedule.count({ where }),
        ]);

        return paginate(schedules, page, limit, total);
    }

    async findById(authUser: AuthUser, id: string) {
        const schedule = await prisma.schedule.findFirst({
            where: {
                id,
                tenantId: authUser.tenantId,
            },
            select: this.scheduleSelect,
        });

        if (!schedule) {
            throw new NotFoundError('Agendamento não encontrado');
        }

        if (authUser.role === 'agent' && schedule.assignedTo?.id !== authUser.id) {
            throw new ForbiddenError('Acesso negado a este agendamento');
        }

        return schedule;
    }

    async create(authUser: AuthUser, data: CreateScheduleInput) {
        const schedule = await prisma.schedule.create({
            data: {
                tenantId: authUser.tenantId,
                leadId: data.leadId,
                assignedToId: data.assignedToId || authUser.id,
                type: data.type,
                title: data.title,
                description: data.description,
                scheduledAt: new Date(data.scheduledAt),
                endAt: data.endAt ? new Date(data.endAt) : null,
                timezone: data.timezone,
                location: data.location,
                conferenceLink: data.conferenceLink,
                status: data.status,
                reminderMinutes: data.reminderMinutes,
            },
            select: this.scheduleSelect,
        });

        // Create lead history if linked to a lead
        if (data.leadId) {
            await prisma.leadHistory.create({
                data: {
                    tenantId: authUser.tenantId,
                    leadId: data.leadId,
                    eventType: 'schedule_created',
                    title: `Agendamento criado: ${data.title}`,
                    description: `${data.type} agendado para ${new Date(data.scheduledAt).toLocaleString('pt-BR')}`,
                    createdById: authUser.id,
                },
            });
        }

        return schedule;
    }

    async update(authUser: AuthUser, id: string, data: UpdateScheduleInput) {
        await this.findById(authUser, id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: Record<string, any> = { ...data };
        if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
        if (data.endAt) updateData.endAt = new Date(data.endAt);

        return prisma.schedule.update({
            where: { id },
            data: updateData,
            select: this.scheduleSelect,
        });
    }

    async complete(authUser: AuthUser, id: string, data: CompleteScheduleInput) {
        await this.findById(authUser, id);

        const schedule = await prisma.schedule.update({
            where: { id },
            data: {
                status: 'completed',
                completedAt: new Date(),
                completionNotes: data.completionNotes,
            },
            select: this.scheduleSelect,
        });

        // Create lead history if linked
        if (schedule.lead) {
            await prisma.leadHistory.create({
                data: {
                    tenantId: authUser.tenantId,
                    leadId: schedule.lead.id,
                    eventType: 'schedule_completed',
                    title: `Agendamento concluído: ${schedule.title}`,
                    description: data.completionNotes || 'Agendamento concluído',
                    createdById: authUser.id,
                },
            });
        }

        return schedule;
    }

    async cancel(authUser: AuthUser, id: string) {
        await this.findById(authUser, id);

        const schedule = await prisma.schedule.update({
            where: { id },
            data: { status: 'cancelled' },
            select: this.scheduleSelect,
        });

        if (schedule.lead) {
            await prisma.leadHistory.create({
                data: {
                    tenantId: authUser.tenantId,
                    leadId: schedule.lead.id,
                    eventType: 'schedule_cancelled',
                    title: `Agendamento cancelado: ${schedule.title}`,
                    createdById: authUser.id,
                },
            });
        }

        return schedule;
    }

    async delete(authUser: AuthUser, id: string) {
        await this.findById(authUser, id);
        await prisma.schedule.delete({ where: { id } });
        return { message: 'Agendamento removido com sucesso' };
    }
}

export const schedulesService = new SchedulesService();
