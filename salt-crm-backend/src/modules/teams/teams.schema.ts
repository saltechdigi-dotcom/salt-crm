import { z } from 'zod';

export const createTeamSchema = z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    description: z.string().optional().nullable(),
    managerId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().default(true),
});

export const updateTeamSchema = createTeamSchema.partial();

export const addMemberSchema = z.object({
    userId: z.string().uuid(),
});

export const listTeamsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
});

export const teamIdParamSchema = z.object({
    id: z.string().uuid('ID inválido'),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type ListTeamsQuery = z.infer<typeof listTeamsQuerySchema>;
