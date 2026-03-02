import { z } from 'zod';

export const createTagSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    color: z.string().default('#6B7280'),
    entityType: z.enum(['lead']).optional().default('lead'),
});

export const updateTagSchema = z.object({
    name: z.string().min(1).optional(),
    color: z.string().optional(),
});

export const tagIdParamSchema = z.object({
    id: z.string().uuid(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
