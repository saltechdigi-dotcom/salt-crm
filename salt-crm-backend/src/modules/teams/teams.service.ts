import { prisma } from '../../config/database.js';
import { NotFoundError, BadRequestError, ConflictError } from '../../utils/errors.js';
import { paginate } from '../../utils/helpers.js';
import type { AuthUser } from '../../types/express.js';
import type { CreateTeamInput, UpdateTeamInput, AddMemberInput, ListTeamsQuery } from './teams.schema.js';

export class TeamsService {
    private readonly teamSelect = {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        manager: {
            select: { id: true, name: true, email: true, avatarUrl: true },
        },
        members: {
            select: { id: true, name: true, email: true, avatarUrl: true, role: true },
            where: { isActive: true },
        },
        _count: {
            select: { leads: true, members: true },
        },
    };

    async findAll(authUser: AuthUser, query: ListTeamsQuery) {
        const { page, limit } = query;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = {
            tenantId: authUser.tenantId,
        };

        if (query.isActive !== undefined) where.isActive = query.isActive;
        if (query.search) {
            where.name = { contains: query.search, mode: 'insensitive' };
        }

        const [teams, total] = await Promise.all([
            prisma.team.findMany({
                where,
                select: this.teamSelect,
                orderBy: { name: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.team.count({ where }),
        ]);

        return paginate(teams, page, limit, total);
    }

    async findById(authUser: AuthUser, id: string) {
        const team = await prisma.team.findFirst({
            where: { id, tenantId: authUser.tenantId },
            select: this.teamSelect,
        });

        if (!team) {
            throw new NotFoundError('Equipe não encontrada');
        }

        return team;
    }

    async create(authUser: AuthUser, data: CreateTeamInput) {
        // Check for duplicate name
        const existing = await prisma.team.findFirst({
            where: { tenantId: authUser.tenantId, name: data.name },
        });

        if (existing) {
            throw new ConflictError('Já existe uma equipe com este nome');
        }

        // Verify manager exists if provided
        if (data.managerId) {
            const manager = await prisma.user.findFirst({
                where: { id: data.managerId, tenantId: authUser.tenantId, isActive: true },
            });
            if (!manager) {
                throw new BadRequestError('Gerente não encontrado');
            }
        }

        return prisma.team.create({
            data: {
                tenantId: authUser.tenantId,
                name: data.name,
                description: data.description,
                managerId: data.managerId,
                isActive: data.isActive,
            },
            select: this.teamSelect,
        });
    }

    async update(authUser: AuthUser, id: string, data: UpdateTeamInput) {
        await this.findById(authUser, id);

        if (data.managerId) {
            const manager = await prisma.user.findFirst({
                where: { id: data.managerId, tenantId: authUser.tenantId, isActive: true },
            });
            if (!manager) {
                throw new BadRequestError('Gerente não encontrado');
            }
        }

        return prisma.team.update({
            where: { id },
            data,
            select: this.teamSelect,
        });
    }

    async addMember(authUser: AuthUser, teamId: string, data: AddMemberInput) {
        await this.findById(authUser, teamId);

        const user = await prisma.user.findFirst({
            where: { id: data.userId, tenantId: authUser.tenantId, isActive: true },
        });

        if (!user) {
            throw new NotFoundError('Usuário não encontrado');
        }

        if (user.teamId === teamId) {
            throw new ConflictError('Usuário já pertence a esta equipe');
        }

        await prisma.user.update({
            where: { id: data.userId },
            data: { teamId },
        });

        return this.findById(authUser, teamId);
    }

    async removeMember(authUser: AuthUser, teamId: string, userId: string) {
        await this.findById(authUser, teamId);

        const user = await prisma.user.findFirst({
            where: { id: userId, tenantId: authUser.tenantId, teamId },
        });

        if (!user) {
            throw new NotFoundError('Usuário não encontrado nesta equipe');
        }

        await prisma.user.update({
            where: { id: userId },
            data: { teamId: null },
        });

        return this.findById(authUser, teamId);
    }

    async delete(authUser: AuthUser, id: string) {
        await this.findById(authUser, id);

        // Remove team assignment from all members first
        await prisma.user.updateMany({
            where: { teamId: id },
            data: { teamId: null },
        });

        await prisma.team.delete({ where: { id } });
        return { message: 'Equipe removida com sucesso' };
    }
}

export const teamsService = new TeamsService();
