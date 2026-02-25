import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // ============ PLANS ============
    const plansData = [
        {
            name: 'start',
            displayName: 'Start',
            description: 'Para pequenos times começando a vender',
            pricePerUserMonthly: 97.00,
            pricePerUserAnnual: 79.00,
            baseUsers: 3,
            maxUsers: 5,
            sortOrder: 1,
            features: {
                crm: true, funnel: true, whatsapp: true, whatsappLimit: 1,
                leads: 'unlimited', ai_sdr: false, ai_nps: false,
                reports: 'basic', api: false, support: 'standard',
            },
        },
        {
            name: 'pro',
            displayName: 'Pro',
            description: 'Para times em crescimento',
            pricePerUserMonthly: 147.00,
            pricePerUserAnnual: 119.00,
            baseUsers: 5,
            maxUsers: 20,
            sortOrder: 2,
            features: {
                crm: true, funnel: true, whatsapp: true, whatsappLimit: 3,
                leads: 'unlimited', ai_sdr: true, ai_nps: true,
                reports: 'advanced', api: false, support: 'standard',
            },
        },
        {
            name: 'enterprise',
            displayName: 'Enterprise',
            description: 'Para operações robustas',
            pricePerUserMonthly: 197.00,
            pricePerUserAnnual: 159.00,
            baseUsers: 10,
            maxUsers: null,
            sortOrder: 3,
            features: {
                crm: true, funnel: true, whatsapp: true, whatsappLimit: null,
                leads: 'unlimited', ai_sdr: true, ai_nps: true,
                reports: 'advanced', api: true, support: 'priority',
            },
        },
    ];

    for (const plan of plansData) {
        await prisma.plan.upsert({
            where: { name: plan.name },
            update: {
                displayName: plan.displayName,
                description: plan.description,
                pricePerUserMonthly: plan.pricePerUserMonthly,
                pricePerUserAnnual: plan.pricePerUserAnnual,
                baseUsers: plan.baseUsers,
                maxUsers: plan.maxUsers,
                sortOrder: plan.sortOrder,
                features: plan.features,
            },
            create: plan,
        });
        console.log(`  ✅ Plan "${plan.displayName}" created/updated`);
    }

    // Get pro plan for tenant association
    const proPlan = await prisma.plan.findUnique({ where: { name: 'pro' } });

    // Create default tenant
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'salt-demo' },
        update: { planId: proPlan?.id },
        create: {
            name: 'SALT Demo',
            slug: 'salt-demo',
            email: 'contato@saltdigi.com.br',
            status: 'active',
            planId: proPlan?.id,
            segment: 'b2b_consultoria',
            monthlyValue: 735.00,
            usersLimit: 5,
        },
    });

    console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);

    const admin = await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId: tenant.id,
                email: 'eryk@saltdigi.com.br',
            },
        },
        update: {},
        create: {
            email: 'eryk@saltdigi.com.br',
            name: 'Eryk Silva',
            password: adminPassword,
            role: 'admin',
            tenantId: tenant.id,
            isActive: true,
        },
    });

    console.log(`✅ Admin user created: ${admin.email}`);

    // Create manager user
    const managerPassword = await bcrypt.hash('123456', 12);

    const manager = await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId: tenant.id,
                email: 'gerente@saltdigi.com.br',
            },
        },
        update: {},
        create: {
            email: 'gerente@saltdigi.com.br',
            name: 'Gerente SALT',
            password: managerPassword,
            role: 'manager',
            tenantId: tenant.id,
            isActive: true,
        },
    });

    console.log(`✅ Manager user created: ${manager.email}`);

    // Create agent user
    const agentPassword = await bcrypt.hash('123456', 12);

    const agent = await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId: tenant.id,
                email: 'vendas@saltdigi.com.br',
            },
        },
        update: {},
        create: {
            email: 'vendas@saltdigi.com.br',
            name: 'Vendedor SALT',
            password: agentPassword,
            role: 'agent',
            tenantId: tenant.id,
            isActive: true,
        },
    });

    console.log(`✅ Agent user created: ${agent.email}`);

    // Create default funnel
    const funnel = await prisma.funnel.upsert({
        where: {
            tenantId_name: {
                tenantId: tenant.id,
                name: 'Funil Principal',
            },
        },
        update: {},
        create: {
            name: 'Funil Principal',
            tenantId: tenant.id,
            isDefault: true,
            isActive: true,
            type: 'sales',
        },
    });

    console.log(`✅ Funnel created: ${funnel.name}`);

    // Create stages
    const stages = [
        { name: 'Novos Leads', color: '#3B82F6', orderIndex: 0, isEntry: true },
        { name: 'Qualificação', color: '#8B5CF6', orderIndex: 1, isEntry: false },
        { name: 'Proposta', color: '#F59E0B', orderIndex: 2, isEntry: false },
        { name: 'Negociação', color: '#EF4444', orderIndex: 3, isEntry: false },
        { name: 'Fechamento', color: '#10B981', orderIndex: 4, isEntry: false, isExit: true, exitType: 'won' as const },
    ];

    for (const stage of stages) {
        await prisma.funnelStage.upsert({
            where: {
                funnelId_orderIndex: {
                    funnelId: funnel.id,
                    orderIndex: stage.orderIndex,
                },
            },
            update: {},
            create: {
                name: stage.name,
                color: stage.color,
                orderIndex: stage.orderIndex,
                isEntry: stage.isEntry,
                isExit: stage.isExit || false,
                exitType: stage.exitType || null,
                funnelId: funnel.id,
                tenantId: tenant.id,
            },
        });
    }

    console.log(`✅ ${stages.length} stages created`);

    // ============ LEAD ORIGINS ============
    const defaultOrigins = [
        { name: 'WhatsApp', color: '#25D366' },
        { name: 'Instagram', color: '#E4405F' },
        { name: 'Facebook', color: '#1877F2' },
        { name: 'Google Ads', color: '#4285F4' },
        { name: 'Site', color: '#6366F1' },
        { name: 'Indicação', color: '#F59E0B' },
        { name: 'Telefone', color: '#10B981' },
        { name: 'E-mail', color: '#EF4444' },
        { name: 'Landing Page', color: '#8B5CF6' },
        { name: 'Presencial', color: '#06B6D4' },
    ];

    for (const origin of defaultOrigins) {
        await prisma.leadOrigin.upsert({
            where: {
                tenantId_name: {
                    tenantId: tenant.id,
                    name: origin.name,
                },
            },
            update: {},
            create: {
                tenantId: tenant.id,
                name: origin.name,
                color: origin.color,
                type: 'manual',
            },
        });
    }

    console.log(`✅ ${defaultOrigins.length} lead origins created`);
    console.log('\n🎉 Seed completed!');
    console.log('\n📋 Login credentials:');
    console.log('  Admin:    eryk@saltdigi.com.br / admin123');
    console.log('  Gerente:  gerente@saltdigi.com.br / 123456');
    console.log('  Vendedor: vendas@saltdigi.com.br / 123456');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
