import { prisma } from '../../config/database.js';
import { generateAccessToken, generateRefreshToken } from '../../config/jwt.js';
import bcrypt from 'bcryptjs';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

export class SuperAdminService {

    // ==========================================
    // TENANTS - LIST
    // ==========================================
    async listTenants() {
        const tenants = await prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                plan: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                    }
                },
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                        isActive: true,
                        lastLoginAt: true,
                    }
                },
                whatsappConnections: {
                    select: {
                        id: true,
                        name: true,
                        phoneNumber: true,
                        status: true,
                        type: true,
                        createdAt: true,
                    }
                },
                onboarding: true,
                _count: {
                    select: {
                        leads: true,
                        sales: true,
                        conversations: true,
                    }
                }
            }
        });

        return tenants.map(t => this.formatTenant(t));
    }

    // ==========================================
    // TENANTS - GET BY ID
    // ==========================================
    async getTenantById(id: string) {
        const t = await prisma.tenant.findUnique({
            where: { id },
            include: {
                plan: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                    }
                },
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                        isActive: true,
                        lastLoginAt: true,
                        createdAt: true,
                    }
                },
                whatsappConnections: {
                    select: {
                        id: true,
                        name: true,
                        phoneNumber: true,
                        status: true,
                        type: true,
                        createdAt: true,
                    }
                },
                onboarding: true,
                _count: {
                    select: {
                        leads: true,
                        sales: true,
                        conversations: true,
                    }
                }
            }
        });

        if (!t) {
            throw new NotFoundError('Empresa não encontrada');
        }

        return this.formatTenant(t);
    }

    // ==========================================
    // TENANTS - CREATE
    // ==========================================
    async createTenant(data: {
        name: string;
        email: string;
        phone?: string;
        document?: string;
        segment?: string;
        planId?: string;
        monthlyValue?: number;
        usersLimit?: number;
        adminName?: string;
        adminEmail?: string;
        adminPassword?: string;
    }) {
        // Generate slug from name
        const slug = data.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        // Check if slug exists
        const existing = await prisma.tenant.findUnique({ where: { slug } });
        if (existing) {
            throw new BadRequestError('Já existe uma empresa com nome similar');
        }

        // Create tenant
        const tenant = await prisma.tenant.create({
            data: {
                name: data.name,
                slug,
                email: data.email,
                phone: data.phone,
                document: data.document,
                segment: data.segment,
                planId: data.planId || undefined,
                monthlyValue: data.monthlyValue || 0,
                usersLimit: data.usersLimit || 3,
                status: 'active',
                lifecycleStatus: 'onboarding',
            },
        });

        // Create onboarding record
        await prisma.tenantOnboarding.create({
            data: {
                tenantId: tenant.id,
                adminCreated: !!data.adminEmail,
            },
        });

        // Create admin user if provided
        if (data.adminEmail && data.adminName) {
            const password = data.adminPassword || 'salt@123';
            const hashedPassword = await bcrypt.hash(password, 12);

            await prisma.user.create({
                data: {
                    email: data.adminEmail,
                    name: data.adminName,
                    password: hashedPassword,
                    role: 'admin',
                    tenantId: tenant.id,
                    isActive: true,
                },
            });
        }

        // Create default funnel
        const funnel = await prisma.funnel.create({
            data: {
                name: 'Funil Principal',
                tenantId: tenant.id,
                isDefault: true,
                isActive: true,
                type: 'sales',
            },
        });

        // Create default stages
        const stages = [
            { name: 'Novos Leads', color: '#3B82F6', orderIndex: 0, isEntry: true },
            { name: 'Qualificação', color: '#8B5CF6', orderIndex: 1 },
            { name: 'Proposta', color: '#F59E0B', orderIndex: 2 },
            { name: 'Negociação', color: '#EF4444', orderIndex: 3 },
            { name: 'Fechamento', color: '#10B981', orderIndex: 4, isExit: true, exitType: 'won' as const },
        ];

        for (const stage of stages) {
            await prisma.funnelStage.create({
                data: {
                    name: stage.name,
                    color: stage.color,
                    orderIndex: stage.orderIndex,
                    isEntry: stage.isEntry || false,
                    isExit: stage.isExit || false,
                    exitType: stage.exitType || null,
                    funnelId: funnel.id,
                    tenantId: tenant.id,
                },
            });
        }

        return this.getTenantById(tenant.id);
    }

    // ==========================================
    // TENANTS - UPDATE
    // ==========================================
    async updateTenant(id: string, data: {
        name?: string;
        email?: string;
        phone?: string;
        document?: string;
        segment?: string;
        planId?: string;
        monthlyValue?: number;
        usersLimit?: number;
        internalNotes?: string;
        salesOrigin?: string;
    }) {
        const tenant = await prisma.tenant.findUnique({ where: { id } });
        if (!tenant) {
            throw new NotFoundError('Empresa não encontrada');
        }

        await prisma.tenant.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.email && { email: data.email }),
                ...(data.phone !== undefined && { phone: data.phone }),
                ...(data.document !== undefined && { document: data.document }),
                ...(data.segment !== undefined && { segment: data.segment }),
                ...(data.planId !== undefined && { planId: data.planId }),
                ...(data.monthlyValue !== undefined && { monthlyValue: data.monthlyValue }),
                ...(data.usersLimit !== undefined && { usersLimit: data.usersLimit }),
                ...(data.internalNotes !== undefined && { internalNotes: data.internalNotes }),
                ...(data.salesOrigin !== undefined && { salesOrigin: data.salesOrigin }),
            },
        });

        return this.getTenantById(id);
    }

    // ==========================================
    // TENANTS - SUSPEND / ACTIVATE
    // ==========================================
    async suspendTenant(id: string) {
        const tenant = await prisma.tenant.findUnique({ where: { id } });
        if (!tenant) throw new NotFoundError('Empresa não encontrada');

        await prisma.tenant.update({
            where: { id },
            data: {
                status: 'suspended',
                lifecycleStatus: 'suspended',
                suspendedAt: new Date(),
            },
        });

        return { success: true, message: 'Empresa suspensa com sucesso' };
    }

    async activateTenant(id: string) {
        const tenant = await prisma.tenant.findUnique({ where: { id } });
        if (!tenant) throw new NotFoundError('Empresa não encontrada');

        await prisma.tenant.update({
            where: { id },
            data: {
                status: 'active',
                lifecycleStatus: 'active',
                suspendedAt: null,
            },
        });

        return { success: true, message: 'Empresa reativada com sucesso' };
    }

    // ==========================================
    // TENANTS - DELETE (CASCADE)
    // ==========================================
    async deleteTenant(id: string) {
        const tenant = await prisma.tenant.findUnique({ where: { id } });
        if (!tenant) throw new NotFoundError('Empresa não encontrada');

        // Delete ALL related records in dependency order via transaction
        await prisma.$transaction(async (tx) => {
            // 1. Delete deep nested relations first
            await tx.leadTag.deleteMany({ where: { lead: { tenantId: id } } });
            await tx.leadStageHistory.deleteMany({ where: { tenantId: id } });
            await tx.leadHistory.deleteMany({ where: { tenantId: id } });
            await tx.slaMetric.deleteMany({ where: { tenantId: id } });
            await tx.aiInteractionLog.deleteMany({ where: { tenantId: id } });
            await tx.distributionLog.deleteMany({ where: { tenantId: id } });
            await tx.npsSurvey.deleteMany({ where: { tenantId: id } });
            await tx.schedule.deleteMany({ where: { tenantId: id } });
            await tx.dashboardMetricDaily.deleteMany({ where: { tenantId: id } });
            await tx.automationLog.deleteMany({ where: { tenantId: id } });
            await tx.notification.deleteMany({ where: { tenantId: id } });

            // 2. Delete sales
            await tx.sale.deleteMany({ where: { tenantId: id } });

            // 3. Delete messages, then conversations
            await tx.message.deleteMany({ where: { tenantId: id } });
            await tx.conversation.deleteMany({ where: { tenantId: id } });

            // 4. Delete leads
            await tx.lead.deleteMany({ where: { tenantId: id } });

            // 5. Delete funnel stages, funnels, loss reasons, tags, lead origins
            await tx.funnelStage.deleteMany({ where: { tenantId: id } });
            await tx.funnel.deleteMany({ where: { tenantId: id } });
            await tx.lossReason.deleteMany({ where: { tenantId: id } });
            await tx.tag.deleteMany({ where: { tenantId: id } });
            await tx.leadOrigin.deleteMany({ where: { tenantId: id } });

            // 6. Delete products, AI agents, AI prompts, distribution rules
            await tx.product.deleteMany({ where: { tenantId: id } });
            await tx.aiAgent.deleteMany({ where: { tenantId: id } });
            await tx.aiPrompt.deleteMany({ where: { tenantId: id } });
            await tx.distributionRule.deleteMany({ where: { tenantId: id } });

            // 7. Delete WhatsApp connections
            await tx.whatsappConnection.deleteMany({ where: { tenantId: id } });

            // 8. Delete support tickets, critical alerts
            await tx.supportTicket.deleteMany({ where: { tenantId: id } });
            await tx.criticalAlert.deleteMany({ where: { tenantId: id } });

            // 9. Delete tenant settings, onboarding, feature overrides
            await tx.tenantSettings.deleteMany({ where: { tenantId: id } });
            await tx.tenantOnboarding.deleteMany({ where: { tenantId: id } });
            await tx.tenantFeatureOverride.deleteMany({ where: { tenantId: id } });

            // 10. Delete users and teams
            await tx.user.deleteMany({ where: { tenantId: id } });
            await tx.team.deleteMany({ where: { tenantId: id } });

            // 11. Finally delete the tenant
            await tx.tenant.delete({ where: { id } });
        });

        return { success: true, message: `Empresa "${tenant.name}" deletada permanentemente` };
    }

    // ==========================================
    // USER PASSWORD RESET
    // ==========================================
    async resetUserPassword(userId: string, newPassword: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundError('Usuário não encontrado');

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { success: true, message: `Senha do usuário ${user.name} redefinida com sucesso` };
    }

    // ==========================================
    // IMPERSONATE TENANT
    // ==========================================
    async impersonate(tenantId: string) {
        // Find the admin user of the tenant
        const adminUser = await prisma.user.findFirst({
            where: {
                tenantId,
                role: 'admin',
                isActive: true,
            },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });

        if (!adminUser) {
            throw new NotFoundError('Nenhum administrador ativo encontrado nesta empresa');
        }

        // Generate tokens as if this admin logged in
        const accessToken = generateAccessToken({
            sub: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
            tenantId: adminUser.tenantId,
        });

        const refreshToken = generateRefreshToken(adminUser.id);

        // Store the refresh token
        await prisma.user.update({
            where: { id: adminUser.id },
            data: { refreshToken },
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 900,
            user: {
                id: adminUser.id,
                email: adminUser.email,
                name: adminUser.name,
                role: adminUser.role,
                tenantId: adminUser.tenantId,
                tenant: adminUser.tenant,
            },
        };
    }

    // ==========================================
    // PLANS
    // ==========================================
    async listPlans() {
        return prisma.plan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }

    // ==========================================
    // DASHBOARD KPIs
    // ==========================================
    async getDashboardKPIs() {
        const [
            totalTenants,
            activeTenants,
            overdueTenants,
            suspendedTenants,
            totalActiveUsers,
            disconnectedWhatsapps,
            pendingOnboarding,
        ] = await Promise.all([
            prisma.tenant.count(),
            prisma.tenant.count({ where: { status: 'active' } }),
            prisma.tenant.count({ where: { paymentStatus: 'overdue' } }),
            prisma.tenant.count({ where: { status: 'suspended' } }),
            prisma.user.count({ where: { isActive: true } }),
            prisma.whatsappConnection.count({ where: { status: 'disconnected' } }),
            prisma.tenantOnboarding.count({
                where: {
                    OR: [
                        { adminCreated: false },
                        { whatsappConnected: false },
                        { funnelConfigured: false },
                    ],
                },
            }),
        ]);

        return {
            totalTenants,
            activeTenants,
            overdueTenants,
            suspendedTenants,
            totalActiveUsers,
            disconnectedWhatsapps,
            criticalAlerts: 0,
            pendingOnboarding,
        };
    }

    // ==========================================
    // FINANCIAL KPIs
    // ==========================================
    async getFinancialKPIs() {
        const tenants = await prisma.tenant.findMany({
            where: { status: 'active' },
            select: { monthlyValue: true },
        });

        const mrr = tenants.reduce((sum, t) => sum + Number(t.monthlyValue), 0);

        return {
            mrr,
            lastMonthRevenue: mrr,
            currentMonthRevenue: mrr,
            forecastedRevenue: mrr,
            overdueAmount: 0,
            avgTicket: tenants.length > 0 ? mrr / tenants.length : 0,
        };
    }

    // ==========================================
    // PRIVATE HELPERS
    // ==========================================
    private formatTenant(t: any) {
        return {
            id: t.id,
            name: t.name,
            slug: t.slug,
            segment: t.segment || 'Geral',
            plan: t.plan?.displayName || t.plan?.name || 'Sem plano',
            planId: t.planId,
            status: t.status === 'active' ? 'ativa' : t.status === 'suspended' ? 'suspensa' : 'cancelada',
            lifecycleStatus: t.lifecycleStatus || 'onboarding',
            paymentStatus: t.paymentStatus === 'on_time' ? 'em_dia' : 'atraso',
            monthlyValue: Number(t.monthlyValue) || 0,
            usersActive: t.users?.filter((u: any) => u.isActive).length || 0,
            usersLimit: t.usersLimit,
            whatsappConnections: (t.whatsappConnections || []).map((wa: any) => ({
                id: wa.id,
                number: wa.phoneNumber || '',
                name: wa.name || '',
                type: wa.type === 'business' ? 'Business' : 'API',
                status: wa.status === 'connected' ? 'conectado' : wa.status === 'pending' ? 'pendente' : 'desconectado',
                lastActivity: wa.createdAt?.toISOString?.() || '',
            })),
            users: (t.users || []).map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone || undefined,
                role: u.role as string,
                status: u.isActive ? 'ativo' : 'inativo',
                lastLogin: u.lastLoginAt?.toISOString?.() || '',
            })),
            modules: [],
            payments: [],
            onboarding: {
                adminCreated: t.onboarding?.adminCreated ?? false,
                additionalUsersCreated: t.onboarding?.usersCreated ?? false,
                whatsappConnected: t.onboarding?.whatsappConnected ?? false,
                funnelConfigured: t.onboarding?.funnelConfigured ?? false,
                iaConfigured: t.onboarding?.aiConfigured ?? false,
                firstLeadReceived: t.onboarding?.firstLeadReceived ?? false,
                firstServiceDone: t.onboarding?.firstSaleDone ?? false,
            },
            createdAt: t.createdAt?.toISOString?.() || '',
            lastActivity: {
                type: 'login' as const,
                occurredAt: t.updatedAt?.toISOString?.() || '',
            },
            email: t.email,
            phone: t.phone || '',
            document: t.document || '',
            salesOrigin: t.salesOrigin || '',
            internalNotes: t.internalNotes || '',
            healthScore: 100,
            leadsTotal: t._count?.leads || 0,
            leadsConverted: t._count?.sales || 0,
            conversationsTotal: t._count?.conversations || 0,
            avgResponseTime: '-',
            avgFrequency: '-',
            churnRisk: 'baixo' as const,
            n8nFlows: [],
        };
    }
}

export const superAdminService = new SuperAdminService();
