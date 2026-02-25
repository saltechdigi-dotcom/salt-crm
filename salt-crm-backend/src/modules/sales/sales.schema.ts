import { z } from 'zod';

export const createSaleSchema = z.object({
    leadId: z.string().uuid().optional(),
    clientName: z.string().min(1, 'Nome do cliente é obrigatório'),
    clientDocument: z.string().optional(),
    clientDocumentType: z.enum(['cpf', 'cnpj']).optional(),
    clientPhone: z.string().optional(),
    clientEmail: z.string().email().optional().or(z.literal('')),
    productId: z.string().uuid().optional(),
    productName: z.string().min(1, 'Nome do produto é obrigatório'),
    productCode: z.string().optional(),
    saleValue: z.number().min(0.01, 'Valor deve ser maior que 0'),
    discountValue: z.number().min(0).optional(),
    paymentMethod: z.enum(['credit_card', 'debit_card', 'pix', 'cash', 'bank_transfer', 'boleto', 'other']),
    paymentCondition: z.enum(['cash', 'installment']).optional(),
    installments: z.number().int().min(1).optional(),
    observations: z.string().optional(),
});

export const updateSaleStatusSchema = z.object({
    status: z.enum(['pending_manager', 'pending_admin', 'validated', 'rejected']),
    managerComment: z.string().optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleStatusInput = z.infer<typeof updateSaleStatusSchema>;
