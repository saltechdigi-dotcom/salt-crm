import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/errors.js';
import type { AuthUser } from '../../types/express.js';
import type { CreateProductInput, UpdateProductInput } from './products.schema.js';

export class ProductsService {
    async findAll(authUser: AuthUser) {
        return prisma.product.findMany({
            where: { tenantId: authUser.tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(authUser: AuthUser, id: string) {
        const product = await prisma.product.findFirst({
            where: { id, tenantId: authUser.tenantId },
        });
        if (!product) throw new NotFoundError('Produto não encontrado');
        return product;
    }

    async create(authUser: AuthUser, data: CreateProductInput) {
        return prisma.product.create({
            data: {
                tenantId: authUser.tenantId,
                name: data.name,
                code: data.code,
                description: data.description,
                price: data.price,
                category: data.category,
                isActive: data.isActive ?? true,
            },
        });
    }

    async update(authUser: AuthUser, id: string, data: UpdateProductInput) {
        await this.findById(authUser, id);
        return prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                code: data.code,
                description: data.description,
                price: data.price,
                category: data.category,
                isActive: data.isActive,
            },
        });
    }

    async delete(authUser: AuthUser, id: string) {
        await this.findById(authUser, id);
        await prisma.product.delete({ where: { id } });
    }
}

export const productsService = new ProductsService();
