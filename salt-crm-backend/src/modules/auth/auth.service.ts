import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database.js';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyToken
} from '../../config/jwt.js';
import {
    UnauthorizedError,
    NotFoundError,
    BadRequestError
} from '../../utils/errors.js';
import type { LoginInput, ChangePasswordInput } from './auth.schema.js';

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    expires_in: number;
}

export interface AuthResponse extends AuthTokens {
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
        tenantId: string;
        tenant: {
            id: string;
            name: string;
            slug: string | null;
        };
    };
}

export class AuthService {
    async login(data: LoginInput): Promise<AuthResponse> {
        const user = await prisma.user.findFirst({
            where: { email: data.email },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        status: true,
                    },
                },
            },
        });

        if (!user) {
            throw new UnauthorizedError('Email ou senha incorretos');
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedError('Email ou senha incorretos');
        }

        if (!user.isActive) {
            throw new UnauthorizedError('Usuário desativado');
        }

        if (user.tenant.status !== 'active') {
            throw new UnauthorizedError('Conta da empresa está inativa');
        }

        const accessToken = generateAccessToken({
            sub: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
        });

        const refreshToken = generateRefreshToken(user.id);

        // Save refresh token to database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken,
                lastLoginAt: new Date(),
            },
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 900, // 15 minutes in seconds
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenantId,
                tenant: {
                    id: user.tenant.id,
                    name: user.tenant.name,
                    slug: user.tenant.slug,
                },
            },
        };
    }

    async superAdminLogin(data: LoginInput): Promise<AuthResponse> {
        const admin = await prisma.superAdminUser.findFirst({
            where: { email: data.email },
        });

        if (!admin) {
            throw new UnauthorizedError('Email ou senha incorretos');
        }

        const isPasswordValid = await bcrypt.compare(data.password, admin.password);
        if (!isPasswordValid) {
            throw new UnauthorizedError('Email ou senha incorretos');
        }

        if (!admin.isActive) {
            throw new UnauthorizedError('Usuário desativado');
        }

        const accessToken = generateAccessToken({
            sub: admin.id,
            email: admin.email,
            role: admin.role,
            tenantId: 'master-tenant', // SuperAdmins bypass tenant checks
        });

        const refreshToken = generateRefreshToken(admin.id);

        await prisma.superAdminUser.update({
            where: { id: admin.id },
            data: {
                lastLoginAt: new Date(),
                refreshToken,
            },
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 900,
            user: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
                tenantId: 'master-tenant',
                tenant: {
                    id: 'master-tenant',
                    name: 'Super Admin',
                    slug: 'master',
                },
            },
        };
    }

    async refresh(refreshToken: string): Promise<AuthTokens> {
        let decoded;
        try {
            decoded = verifyToken(refreshToken);
        } catch {
            throw new UnauthorizedError('Refresh token inválido ou expirado');
        }

        if (decoded.type !== 'refresh') {
            throw new UnauthorizedError('Token inválido');
        }

        let user = await prisma.user.findUnique({
            where: { id: decoded.sub },
            select: {
                id: true,
                email: true,
                role: true,
                tenantId: true,
                isActive: true,
                refreshToken: true,
            },
        });

        if (!user) {
            // Check if it's a SuperAdmin
            const admin = await prisma.superAdminUser.findUnique({
                where: { id: decoded.sub },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isActive: true,
                    refreshToken: true,
                },
            });

            if (!admin) {
                throw new UnauthorizedError('Usuário não encontrado');
            }

            if (!admin.isActive) {
                throw new UnauthorizedError('Usuário desativado');
            }

            // Validate stored refresh token
            if (admin.refreshToken !== refreshToken) {
                throw new UnauthorizedError('Refresh token revogado');
            }

            const newAccessToken = generateAccessToken({
                sub: admin.id,
                email: admin.email,
                role: admin.role,
                tenantId: 'master-tenant',
            });
            const newRefreshToken = generateRefreshToken(admin.id);

            // Rotate refresh token in DB
            await prisma.superAdminUser.update({
                where: { id: admin.id },
                data: { refreshToken: newRefreshToken },
            });

            return {
                access_token: newAccessToken,
                refresh_token: newRefreshToken,
                expires_in: 900,
            };
        }

        if (!user.isActive) {
            throw new UnauthorizedError('Usuário desativado');
        }

        if (user.refreshToken !== refreshToken) {
            throw new UnauthorizedError('Refresh token revogado');
        }

        const newAccessToken = generateAccessToken({
            sub: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
        });

        const newRefreshToken = generateRefreshToken(user.id);

        // Rotate refresh token
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: newRefreshToken },
        });

        return {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            expires_in: 900,
        };
    }

    async logout(userId: string): Promise<void> {
        // Try User first, then SuperAdmin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
            await prisma.user.update({
                where: { id: userId },
                data: { refreshToken: null },
            });
        } else {
            await prisma.superAdminUser.update({
                where: { id: userId },
                data: { refreshToken: null },
            }).catch(() => { }); // Ignore if not found
        }
    }

    async getMe(userId: string) {
        let user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                avatarUrl: true,
                role: true,
                tenantId: true,
                teamId: true,
                isActive: true,
                createdAt: true,
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        }) as any;

        if (!user) {
            const admin = await prisma.superAdminUser.findUnique({
                where: { id: userId }
            });

            if (!admin) {
                throw new NotFoundError('Usuário não encontrado');
            }

            user = {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                phone: null,
                avatarUrl: admin.avatarUrl,
                role: admin.role,
                tenantId: 'master-tenant',
                teamId: null,
                isActive: admin.isActive,
                createdAt: admin.createdAt,
                tenant: {
                    id: 'master-tenant',
                    name: 'Super Admin',
                    slug: 'master',
                }
            };
        }

        return user;
    }

    async changePassword(userId: string, data: ChangePasswordInput): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true },
        });

        if (!user) {
            throw new NotFoundError('Usuário não encontrado');
        }

        const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
        if (!isPasswordValid) {
            throw new BadRequestError('Senha atual incorreta');
        }

        const hashedPassword = await bcrypt.hash(data.newPassword, 12);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
    }
}

export const authService = new AuthService();
