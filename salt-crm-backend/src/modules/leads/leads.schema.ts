import { z } from 'zod';

export const createLeadSchema = z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    phone: z.string().min(10, 'Telefone inválido'),
    email: z.string().email('Email inválido').optional().nullable(),
    document: z.string().optional().nullable(),
    documentType: z.enum(['cpf', 'cnpj']).optional().nullable(),

    // Address
    city: z.string().optional().nullable(),
    state: z.string().max(2).optional().nullable(),
    country: z.string().default('BR').optional(),
    addressStreet: z.string().optional().nullable(),
    addressNumber: z.string().optional().nullable(),
    addressComplement: z.string().optional().nullable(),
    addressNeighborhood: z.string().optional().nullable(),
    addressZipcode: z.string().optional().nullable(),

    // Origin
    originId: z.string().uuid().optional().nullable(),
    reference: z.string().optional().nullable(),
    utmSource: z.string().optional().nullable(),
    utmMedium: z.string().optional().nullable(),
    utmCampaign: z.string().optional().nullable(),
    utmContent: z.string().optional().nullable(),
    utmTerm: z.string().optional().nullable(),

    // Funnel
    funnelId: z.string().uuid(),
    stageId: z.string().uuid(),
    temperature: z.enum(['cold', 'warm', 'hot']).default('cold'),

    // Assignment
    assignedToId: z.string().uuid().optional().nullable(),
    teamId: z.string().uuid().optional().nullable(),

    // Custom
    customFields: z.record(z.any()).optional(),
});

export const updateLeadSchema = createLeadSchema.partial().omit({ funnelId: true });

export const moveLeadSchema = z.object({
    stageId: z.string().uuid(),
    notes: z.string().optional(),
});

export const assignLeadSchema = z.object({
    assignedToId: z.string().uuid().nullable(),
    teamId: z.string().uuid().optional().nullable(),
});

export const listLeadsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(500).default(20),
    search: z.string().optional(),
    funnelId: z.string().uuid().optional(),
    stageId: z.string().uuid().optional(),
    temperature: z.enum(['cold', 'warm', 'hot']).optional(),
    originId: z.string().uuid().optional(),
    assignedToId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional(),
    qualifiedByAi: z.coerce.boolean().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export const leadIdParamSchema = z.object({
    id: z.string().uuid('ID inválido'),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type MoveLeadInput = z.infer<typeof moveLeadSchema>;
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
