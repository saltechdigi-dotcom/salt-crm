import { z } from 'zod';

export const createDeliverySchema = z.object({
    saleId: z.string().uuid(),
    saleType: z.enum(['produto', 'servico']).default('produto'),
    clientName: z.string().min(1, 'Nome do cliente é obrigatório'),
    clientPhone: z.string().min(1, 'Telefone é obrigatório'),
    clientEmail: z.string().email().optional().or(z.literal('')),
    productName: z.string().min(1, 'Nome do produto é obrigatório'),
    productCode: z.string().optional(),
    saleValue: z.number().min(0),
    deliveryStatus: z.enum(['immediate', 'scheduled']).default('scheduled'),
    scheduledDate: z.string().optional(),
    scheduledShift: z.enum(['manha', 'tarde', 'noite', 'personalizado']).optional(),
    scheduledTime: z.string().optional(),
    deliveryContact: z.string().optional(),
    deliveryAddress: z.object({
        street: z.string(),
        number: z.string(),
        complement: z.string().optional(),
        neighborhood: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
    }).optional(),
    sellerName: z.string().min(1),
    saleDate: z.string().or(z.date()),
    observations: z.string().optional(),
});

export const updateDeliverySchema = z.object({
    deliveryStatus: z.enum(['immediate', 'scheduled', 'completed']).optional(),
    scheduledDate: z.string().optional(),
    scheduledShift: z.enum(['manha', 'tarde', 'noite', 'personalizado']).optional(),
    scheduledTime: z.string().optional(),
    deliveryContact: z.string().optional(),
    deliveryAddress: z.object({
        street: z.string(),
        number: z.string(),
        complement: z.string().optional(),
        neighborhood: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
    }).optional(),
    observations: z.string().optional(),
});

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;
