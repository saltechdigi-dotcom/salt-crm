import { z } from 'zod';

export const createProductSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    code: z.string().optional(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    category: z.string().optional(),
    isActive: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
