import { z } from 'zod';

export const createDistributionRuleSchema = z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    type: z.enum(['round_robin', 'weighted', 'priority', 'manual']).default('round_robin'),
    priority: z.number().int().default(0),
    isActive: z.boolean().default(true),
    criteria: z.record(z.any()).default({}),
    targetUsers: z.array(z.string().uuid()).default([]),
    targetTeams: z.array(z.string().uuid()).default([]),
    respectCapacity: z.boolean().default(true),
    respectWorkingHours: z.boolean().default(true),
});

export const updateDistributionRuleSchema = createDistributionRuleSchema.partial();

export const distributeLeadSchema = z.object({
    leadId: z.string().uuid(),
    ruleId: z.string().uuid().optional(),
    assignedToId: z.string().uuid().optional(),
    reason: z.string().optional(),
});

export const listDistributionRulesQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(['round_robin', 'weighted', 'priority', 'manual']).optional(),
    isActive: z.coerce.boolean().optional(),
});

export const listDistributionLogsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    leadId: z.string().uuid().optional(),
    assignedToId: z.string().uuid().optional(),
    ruleId: z.string().uuid().optional(),
    distributionType: z.enum(['automatic', 'manual', 'transfer']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export const ruleIdParamSchema = z.object({
    id: z.string().uuid('ID inválido'),
});

export type CreateDistributionRuleInput = z.infer<typeof createDistributionRuleSchema>;
export type UpdateDistributionRuleInput = z.infer<typeof updateDistributionRuleSchema>;
export type DistributeLeadInput = z.infer<typeof distributeLeadSchema>;
export type ListDistributionRulesQuery = z.infer<typeof listDistributionRulesQuerySchema>;
export type ListDistributionLogsQuery = z.infer<typeof listDistributionLogsQuerySchema>;
