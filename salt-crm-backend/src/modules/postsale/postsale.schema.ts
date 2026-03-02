import { z } from 'zod';

export const createTemplateSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    dayOffset: z.number().int().min(0),
    channel: z.enum(['whatsapp', 'email', 'sms']).default('whatsapp'),
    content: z.string().min(1, 'Conteúdo é obrigatório'),
    useAI: z.boolean().default(false),
    aiPrompt: z.string().optional(),
    status: z.enum(['active', 'inactive']).default('active'),
});

export const updateTemplateSchema = z.object({
    name: z.string().min(1).optional(),
    dayOffset: z.number().int().min(0).optional(),
    channel: z.enum(['whatsapp', 'email', 'sms']).optional(),
    content: z.string().min(1).optional(),
    useAI: z.boolean().optional(),
    aiPrompt: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
});

export const createJourneySchema = z.object({
    saleId: z.string().uuid(),
    clientName: z.string().min(1),
    productSold: z.string().min(1),
    saleDate: z.string().or(z.date()),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type CreateJourneyInput = z.infer<typeof createJourneySchema>;
