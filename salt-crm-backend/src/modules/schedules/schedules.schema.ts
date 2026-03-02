import { z } from 'zod';

export const createScheduleSchema = z.object({
    leadId: z.string().uuid().optional().nullable(),
    type: z.enum(['meeting', 'visit', 'call', 'return_call', 'other']).default('meeting'),
    title: z.string().min(2, 'Título deve ter no mínimo 2 caracteres'),
    description: z.string().optional().nullable(),
    scheduledAt: z.string().datetime({ message: 'Data/hora inválida' }),
    endAt: z.string().datetime().optional().nullable(),
    timezone: z.string().default('America/Sao_Paulo'),
    location: z.string().optional().nullable(),
    conferenceLink: z.string().url().optional().nullable(),
    status: z.enum(['confirmed', 'tentative', 'cancelled', 'completed']).default('confirmed'),
    reminderMinutes: z.array(z.number().int()).default([30, 60]),
    assignedToId: z.string().uuid().optional(),
});

export const updateScheduleSchema = createScheduleSchema.partial();

export const completeScheduleSchema = z.object({
    completionNotes: z.string().optional().nullable(),
});

export const listSchedulesQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    leadId: z.string().uuid().optional(),
    assignedToId: z.string().uuid().optional(),
    type: z.enum(['meeting', 'visit', 'call', 'return_call', 'other']).optional(),
    status: z.enum(['confirmed', 'tentative', 'cancelled', 'completed']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export const scheduleIdParamSchema = z.object({
    id: z.string().uuid('ID inválido'),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type CompleteScheduleInput = z.infer<typeof completeScheduleSchema>;
export type ListSchedulesQuery = z.infer<typeof listSchedulesQuerySchema>;
