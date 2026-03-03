import { z } from 'zod';

export const createNotificationSchema = z.object({
    userId: z.string().uuid().optional().nullable(),
    targetRoles: z.array(z.enum(['admin', 'manager', 'agent'])).default([]),
    teamId: z.string().uuid().optional().nullable(),
    type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
    category: z.enum(['message', 'team_message', 'operational', 'institutional', 'sale']).default('operational'),
    title: z.string().min(1, 'Título obrigatório'),
    message: z.string().min(1, 'Mensagem obrigatória'),
    actionUrl: z.string().optional().nullable(),
    icon: z.string().optional().nullable(),
});

export const listNotificationsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    isRead: z.coerce.boolean().optional(),
    category: z.enum(['message', 'team_message', 'operational', 'institutional', 'sale']).optional(),
    type: z.enum(['info', 'success', 'warning', 'error']).optional(),
});

export const notificationIdParamSchema = z.object({
    id: z.string().uuid('ID inválido'),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
