import { z } from 'zod';

export const createSupportTicketSchema = z.object({
    type: z.enum(['whatsapp', 'funnel', 'ai', 'billing', 'technical', 'other']),
    subject: z.string().min(3, 'Assunto deve ter pelo menos 3 caracteres'),
    description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
});

export const updateSupportTicketSchema = z.object({
    type: z.enum(['whatsapp', 'funnel', 'ai', 'billing', 'technical', 'other']).optional(),
    subject: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    status: z.enum(['open', 'in_progress', 'resolved']).optional(),
    resolutionNotes: z.string().optional(),
});

export const resolveSupportTicketSchema = z.object({
    resolutionNotes: z.string().min(1, 'Notas de resolução são obrigatórias'),
});

export const findSupportTicketsSchema = z.object({
    status: z.enum(['open', 'in_progress', 'resolved']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    type: z.enum(['whatsapp', 'funnel', 'ai', 'billing', 'technical', 'other']).optional(),
    page: z.string().optional().transform(Number).pipe(z.number().int().positive().optional()),
    limit: z.string().optional().transform(Number).pipe(z.number().int().positive().max(100).optional()),
});

export const supportTicketParamsSchema = z.object({
    id: z.string().uuid(),
});
