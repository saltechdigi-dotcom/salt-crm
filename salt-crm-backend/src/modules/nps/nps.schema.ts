import { z } from 'zod';

export const createNpsSurveySchema = z.object({
    leadId: z.string().uuid().optional().nullable(),
    saleId: z.string().uuid().optional().nullable(),
    conversationId: z.string().uuid().optional().nullable(),
    agentId: z.string().uuid().optional().nullable(),
    sentVia: z.enum(['whatsapp', 'email', 'sms']).default('whatsapp'),
});

export const respondNpsSurveySchema = z.object({
    score: z.number().int().min(0).max(10),
    feedback: z.string().optional().nullable(),
});

export const listNpsSurveysQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    classification: z.enum(['promoter', 'passive', 'detractor']).optional(),
    sentVia: z.enum(['whatsapp', 'email', 'sms']).optional(),
    agentId: z.string().uuid().optional(),
    responded: z.string().transform(v => v === 'true').optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export const npsIdParamSchema = z.object({
    id: z.string().uuid('ID inválido'),
});

export type CreateNpsSurveyInput = z.infer<typeof createNpsSurveySchema>;
export type RespondNpsSurveyInput = z.infer<typeof respondNpsSurveySchema>;
export type ListNpsSurveysQuery = z.infer<typeof listNpsSurveysQuerySchema>;
