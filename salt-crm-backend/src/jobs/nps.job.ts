import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * NPS Job — Runs every hour
 * 
 * Finds completed sales that:
 * 1. Were validated (status = 'validated')
 * 2. Happened X hours ago (per tenant's npsDelayHours setting)
 * 3. Don't already have an NPS survey
 * 4. Tenant has NPS auto-send enabled
 * 
 * Then creates NPS survey + triggers n8n to send via WhatsApp
 */
export async function runNpsJob() {
    try {
        const tenants = await prisma.tenant.findMany({
            where: { status: 'active' },
            include: { settings: true },
        });

        let totalSent = 0;

        for (const tenant of tenants) {
            const settings = tenant.settings;
            if (!settings?.npsAutoSend) continue;

            const delayHours = settings.npsDelayHours || 24;
            const cutoffTime = new Date(Date.now() - delayHours * 60 * 60 * 1000);

            // Find validated sales that are old enough and don't have NPS yet
            const salesWithoutNps = await prisma.sale.findMany({
                where: {
                    tenantId: tenant.id,
                    status: 'validated',
                    managerValidatedAt: { lt: cutoffTime },
                    npsSurveys: { none: {} },
                    leadId: { not: null },
                },
                include: {
                    lead: {
                        select: { id: true, name: true, phone: true },
                    },
                },
                take: 20, // Max 20 per tenant per cycle
            });

            if (salesWithoutNps.length === 0) continue;

            // Get NPS prompt
            const npsPrompt = await prisma.aiPrompt.findFirst({
                where: { tenantId: tenant.id, type: 'nps', isActive: true },
            });

            const n8nUrl = env.N8N_WEBHOOK_URL;

            for (const sale of salesWithoutNps) {
                if (!sale.lead?.phone) continue;

                const daysSinceSale = Math.round((Date.now() - (sale.managerValidatedAt?.getTime() || sale.createdAt.getTime())) / (24 * 60 * 60 * 1000));

                try {
                    // Create NPS survey record
                    const npsSurvey = await prisma.npsSurvey.create({
                        data: {
                            tenantId: tenant.id,
                            leadId: sale.lead.id,
                            saleId: sale.id,
                            sentVia: 'whatsapp',
                            sentAt: new Date(),
                        },
                    });

                    // Trigger n8n to send the NPS via WhatsApp
                    if (n8nUrl) {
                        await fetch(n8nUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                ...(env.INTERNAL_API_KEY ? { 'X-API-Key': env.INTERNAL_API_KEY } : {}),
                            },
                            body: JSON.stringify({
                                action: 'send_nps',
                                tenantId: tenant.id,
                                npsSurveyId: npsSurvey.id,
                                leadId: sale.lead.id,
                                leadName: sale.lead.name,
                                leadPhone: sale.lead.phone,
                                saleId: sale.id,
                                daysSinceSale,
                                promptTemplate: npsPrompt?.promptTemplate,
                                systemPrompt: npsPrompt?.systemPrompt,
                            }),
                        });
                    }

                    // Log interaction
                    await prisma.aiInteractionLog.create({
                        data: {
                            tenantId: tenant.id,
                            leadId: sale.lead.id,
                            promptId: npsPrompt?.id,
                            interactionType: 'nps',
                            inputText: `NPS survey sent to ${sale.lead.name} (${daysSinceSale} days post-sale)`,
                            success: true,
                        },
                    });

                    totalSent++;
                } catch (err: unknown) {
                    const errMsg = err instanceof Error ? err.message : String(err);
                    logger.error(`NPS send failed for lead ${sale.lead?.id}:`, errMsg);

                    await prisma.aiInteractionLog.create({
                        data: {
                            tenantId: tenant.id,
                            leadId: sale.lead?.id,
                            interactionType: 'nps',
                            inputText: `NPS attempt for ${sale.lead?.name}`,
                            success: false,
                            errorMessage: errMsg,
                        },
                    });
                }
            }
        }

        if (totalSent > 0) {
            logger.info(`[CRON] NPS: ${totalSent} surveys sent`);
        }
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        logger.error('[CRON] NPS job error:', errMsg);
    }
}
