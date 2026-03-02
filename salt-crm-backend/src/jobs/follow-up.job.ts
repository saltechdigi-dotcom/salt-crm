import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Follow-up Job — Runs every minute
 * 
 * Finds leads that:
 * 1. Have an active conversation
 * 2. Last message was INBOUND (client sent something)
 * 3. No response was sent within the tenant's SLA window
 * 4. Tenant has AI follow-up enabled
 * 
 * Then triggers n8n webhook to generate and send a follow-up
 */
export async function runFollowUpJob() {
    try {
        // Get all tenants with AI enabled and auto-respond on
        const tenants = await prisma.tenant.findMany({
            where: { status: 'active' },
            include: {
                settings: true,
            },
        });

        let totalProcessed = 0;

        for (const tenant of tenants) {
            const settings = tenant.settings;
            if (!settings?.aiEnabled || !settings?.aiAutoRespond) continue;

            const followupHours = settings.slaFollowupHours || 24;
            const cutoffTime = new Date(Date.now() - followupHours * 60 * 60 * 1000);

            // Find conversations where last message is inbound and older than SLA
            const staleConversations = await prisma.conversation.findMany({
                where: {
                    tenantId: tenant.id,
                    status: { in: ['ai_handling', 'waiting'] },
                    lastMessageAt: { lt: cutoffTime },
                },
                include: {
                    lead: { select: { id: true, name: true, phone: true } },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { direction: true, content: true, createdAt: true },
                    },
                },
                take: 50, // Process max 50 per tenant per cycle
            });

            // Filter: only those where last message was inbound (client waiting)
            const needsFollowUp = staleConversations.filter(c =>
                c.messages.length > 0 && c.messages[0].direction === 'inbound'
            );

            if (needsFollowUp.length === 0) continue;

            // Get follow-up prompt for this tenant
            const followupPrompt = await prisma.aiPrompt.findFirst({
                where: { tenantId: tenant.id, type: 'followup', isActive: true },
            });

            // Trigger n8n webhook for each conversation needing follow-up
            const n8nUrl = env.N8N_WEBHOOK_URL;
            if (!n8nUrl) continue;

            for (const conv of needsFollowUp) {
                const hoursWaiting = Math.round((Date.now() - conv.lastMessageAt!.getTime()) / (60 * 60 * 1000));

                try {
                    await fetch(n8nUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(env.INTERNAL_API_KEY ? { 'X-API-Key': env.INTERNAL_API_KEY } : {}),
                        },
                        body: JSON.stringify({
                            action: 'follow_up',
                            tenantId: tenant.id,
                            conversationId: conv.id,
                            leadId: conv.lead?.id,
                            leadName: conv.lead?.name,
                            leadPhone: conv.lead?.phone,
                            lastMessage: conv.messages[0]?.content,
                            hoursWaiting,
                            promptTemplate: followupPrompt?.promptTemplate,
                            systemPrompt: followupPrompt?.systemPrompt,
                        }),
                    });

                    // Log interaction
                    await prisma.aiInteractionLog.create({
                        data: {
                            tenantId: tenant.id,
                            conversationId: conv.id,
                            leadId: conv.lead?.id,
                            promptId: followupPrompt?.id,
                            interactionType: 'followup',
                            inputText: `Follow-up para ${conv.lead?.name} (${hoursWaiting}h sem resposta)`,
                            success: true,
                        },
                    });

                    totalProcessed++;
                } catch (err: unknown) {
                    const errMsg = err instanceof Error ? err.message : String(err);
                    logger.error(`Follow-up failed for conversation ${conv.id}:`, errMsg);

                    await prisma.aiInteractionLog.create({
                        data: {
                            tenantId: tenant.id,
                            conversationId: conv.id,
                            leadId: conv.lead?.id,
                            interactionType: 'followup',
                            inputText: `Follow-up attempt for ${conv.lead?.name}`,
                            success: false,
                            errorMessage: errMsg,
                        },
                    });
                }
            }
        }

        if (totalProcessed > 0) {
            logger.info(`[CRON] Follow-up: ${totalProcessed} follow-ups triggered`);
        }
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        logger.error('[CRON] Follow-up job error:', errMsg);
    }
}
