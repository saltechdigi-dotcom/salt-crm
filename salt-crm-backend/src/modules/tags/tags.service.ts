import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import type { AuthUser } from '../../types/express.js';
import type { CreateTagInput, UpdateTagInput } from './tags.schema.js';

export class TagsService {
    async findAll(authUser: AuthUser, entityType?: string) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = {
            tenantId: authUser.tenantId,
        };

        if (entityType) where.entityType = entityType;

        return prisma.tag.findMany({
            where,
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                color: true,
                entityType: true,
                createdAt: true,
                _count: {
                    select: { leadTags: true },
                },
            },
        });
    }

    async findById(authUser: AuthUser, id: string) {
        const tag = await prisma.tag.findFirst({
            where: { id, tenantId: authUser.tenantId },
            select: {
                id: true,
                name: true,
                color: true,
                entityType: true,
                createdAt: true,
                _count: {
                    select: { leadTags: true },
                },
            },
        });

        if (!tag) {
            throw new NotFoundError('Tag não encontrada');
        }

        return tag;
    }

    async create(authUser: AuthUser, data: CreateTagInput) {
        // Check for duplicate name
        const existing = await prisma.tag.findFirst({
            where: {
                tenantId: authUser.tenantId,
                name: data.name,
                entityType: data.entityType || 'lead',
            },
        });

        if (existing) {
            throw new ConflictError('Já existe uma tag com este nome');
        }

        return prisma.tag.create({
            data: {
                tenantId: authUser.tenantId,
                name: data.name,
                color: data.color || '#6B7280',
                entityType: data.entityType || 'lead',
            },
            select: {
                id: true,
                name: true,
                color: true,
                entityType: true,
                createdAt: true,
            },
        });
    }

    async update(authUser: AuthUser, id: string, data: UpdateTagInput) {
        await this.findById(authUser, id);

        // Check for duplicate name if name is being changed
        if (data.name) {
            const existing = await prisma.tag.findFirst({
                where: {
                    tenantId: authUser.tenantId,
                    name: data.name,
                    id: { not: id },
                },
            });

            if (existing) {
                throw new ConflictError('Já existe uma tag com este nome');
            }
        }

        return prisma.tag.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                color: true,
                entityType: true,
                createdAt: true,
            },
        });
    }

    async delete(authUser: AuthUser, id: string) {
        await this.findById(authUser, id);

        // Delete associated lead_tags first
        await prisma.leadTag.deleteMany({ where: { tagId: id } });

        await prisma.tag.delete({ where: { id } });
        return { message: 'Tag removida com sucesso' };
    }
}

export const tagsService = new TagsService();
