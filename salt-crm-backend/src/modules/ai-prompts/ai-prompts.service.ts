import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/errors.js';
import { env } from '../../config/env.js';
import type { AuthUser } from '../../types/express.js';

export class AiPromptsService {
    async findAll(authUser: AuthUser, type?: string, isActive?: boolean) {
        const where: any = { tenantId: authUser.tenantId };
        if (type) where.type = type;
        if (isActive !== undefined) where.isActive = isActive;

        return prisma.aiPrompt.findMany({
            where,
            orderBy: [{ type: 'asc' }, { name: 'asc' }],
        });
    }

    async findById(authUser: AuthUser, id: string) {
        const prompt = await prisma.aiPrompt.findFirst({
            where: { id, tenantId: authUser.tenantId },
            include: {
                interactionLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        interactionType: true,
                        inputTokens: true,
                        outputTokens: true,
                        success: true,
                        latencyMs: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!prompt) throw new NotFoundError('Prompt não encontrado');
        return prompt;
    }

    async create(authUser: AuthUser, data: {
        type: string;
        name: string;
        promptTemplate: string;
        systemPrompt?: string;
        variables?: string[];
        model?: string;
        temperature?: number;
        maxTokens?: number;
        isActive?: boolean;
    }) {
        return prisma.aiPrompt.create({
            data: {
                tenantId: authUser.tenantId,
                type: data.type as any,
                name: data.name,
                promptTemplate: data.promptTemplate,
                systemPrompt: data.systemPrompt,
                variables: data.variables || [],
                model: data.model || 'gpt-4o-mini',
                temperature: data.temperature || 0.7,
                maxTokens: data.maxTokens || 500,
                isActive: data.isActive ?? true,
            },
        });
    }

    async update(authUser: AuthUser, id: string, data: any) {
        const existing = await prisma.aiPrompt.findFirst({
            where: { id, tenantId: authUser.tenantId },
        });
        if (!existing) throw new NotFoundError('Prompt não encontrado');

        const updateData: any = {};
        const fields = ['type', 'name', 'promptTemplate', 'systemPrompt', 'variables',
            'model', 'temperature', 'maxTokens', 'isActive'];
        for (const f of fields) {
            if (data[f] !== undefined) updateData[f] = data[f];
        }

        return prisma.aiPrompt.update({ where: { id }, data: updateData });
    }

    async delete(authUser: AuthUser, id: string) {
        const existing = await prisma.aiPrompt.findFirst({
            where: { id, tenantId: authUser.tenantId },
        });
        if (!existing) throw new NotFoundError('Prompt não encontrado');
        await prisma.aiPrompt.delete({ where: { id } });
        return { message: 'Prompt removido com sucesso' };
    }

    async test(authUser: AuthUser, id: string, data: { variables?: Record<string, string>; testInput?: string }) {
        const prompt = await this.findById(authUser, id);

        // Interpolate variables into template
        let processedPrompt = prompt.promptTemplate;
        const vars = data.variables || {};
        for (const [key, value] of Object.entries(vars)) {
            processedPrompt = processedPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }

        // Send to n8n webhook for processing
        const n8nUrl = env.N8N_WEBHOOK_URL;
        if (!n8nUrl) {
            return {
                prompt: processedPrompt,
                systemPrompt: prompt.systemPrompt,
                model: prompt.model,
                temperature: Number(prompt.temperature),
                maxTokens: prompt.maxTokens,
                response: '[N8N_WEBHOOK_URL não configurada — configure para testar com IA real]',
                source: 'dry-run',
            };
        }

        const startTime = Date.now();
        try {
            const response = await fetch(n8nUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(env.INTERNAL_API_KEY ? { 'X-API-Key': env.INTERNAL_API_KEY } : {}),
                },
                body: JSON.stringify({
                    action: 'test_prompt',
                    tenantId: authUser.tenantId,
                    promptId: prompt.id,
                    systemPrompt: prompt.systemPrompt,
                    userMessage: processedPrompt,
                    testInput: data.testInput,
                    model: prompt.model,
                    temperature: Number(prompt.temperature),
                    maxTokens: prompt.maxTokens,
                }),
            });

            const result: any = await response.json();
            const latencyMs = Date.now() - startTime;

            // Log interaction
            await prisma.aiInteractionLog.create({
                data: {
                    tenantId: authUser.tenantId,
                    promptId: prompt.id,
                    interactionType: 'qualification',
                    inputText: processedPrompt,
                    outputText: result.response || JSON.stringify(result),
                    modelUsed: prompt.model,
                    latencyMs,
                    success: true,
                    inputTokens: result.inputTokens,
                    outputTokens: result.outputTokens,
                    costUsd: result.costUsd,
                },
            });

            return {
                prompt: processedPrompt,
                response: result.response || result,
                latencyMs,
                source: 'n8n',
            };
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : String(err);
            const latencyMs = Date.now() - startTime;

            // Log failed interaction
            await prisma.aiInteractionLog.create({
                data: {
                    tenantId: authUser.tenantId,
                    promptId: prompt.id,
                    interactionType: 'qualification',
                    inputText: processedPrompt,
                    modelUsed: prompt.model,
                    latencyMs,
                    success: false,
                    errorMessage: errMsg,
                },
            });

            return {
                prompt: processedPrompt,
                response: `[Erro ao chamar n8n: ${errMsg}]`,
                latencyMs,
                source: 'error',
            };
        }
    }

    // Get AI interaction stats for tenant
    async getStats(authUser: AuthUser) {
        const [total, successful, failed, avgLatency] = await Promise.all([
            prisma.aiInteractionLog.count({ where: { tenantId: authUser.tenantId } }),
            prisma.aiInteractionLog.count({ where: { tenantId: authUser.tenantId, success: true } }),
            prisma.aiInteractionLog.count({ where: { tenantId: authUser.tenantId, success: false } }),
            prisma.aiInteractionLog.aggregate({
                where: { tenantId: authUser.tenantId, success: true },
                _avg: { latencyMs: true },
            }),
        ]);

        const totalTokens = await prisma.aiInteractionLog.aggregate({
            where: { tenantId: authUser.tenantId },
            _sum: { inputTokens: true, outputTokens: true },
        });

        return {
            total,
            successful,
            failed,
            avgLatencyMs: Math.round(avgLatency._avg.latencyMs || 0),
            totalInputTokens: totalTokens._sum.inputTokens || 0,
            totalOutputTokens: totalTokens._sum.outputTokens || 0,
        };
    }

    // Seed default prompts for a tenant
    async seedDefaults(tenantId: string) {
        const defaults = [
            {
                type: 'sdr' as const,
                name: 'Qualificação SDR',
                systemPrompt: 'Você é um SDR especialista em qualificação de leads. Analise as informações do lead e determine se ele é qualificado.',
                promptTemplate: 'Analise o seguinte lead e determine se ele é qualificado:\n\nNome: {{nome}}\nTelefone: {{telefone}}\nOrigem: {{origem}}\nMensagem: {{mensagem}}\n\nResponda em JSON: { "qualified": true/false, "score": 0-100, "reason": "motivo" }',
                variables: ['nome', 'telefone', 'origem', 'mensagem'],
            },
            {
                type: 'followup' as const,
                name: 'Follow-up Padrão',
                systemPrompt: 'Você é um assistente comercial profissional e cordial. Gere mensagens de follow-up naturais em português.',
                promptTemplate: 'Gere uma mensagem de follow-up para o lead {{nome}} que não responde há {{horas}} horas.\n\nContexto: {{contexto}}\nÚltima mensagem: {{ultima_mensagem}}\n\nGere uma mensagem curta, natural e profissional.',
                variables: ['nome', 'horas', 'contexto', 'ultima_mensagem'],
            },
            {
                type: 'nps' as const,
                name: 'NPS Pós-Venda',
                systemPrompt: 'Você gera mensagens de pesquisa NPS personalizadas e amigáveis em português.',
                promptTemplate: 'Gere uma mensagem de pesquisa NPS para o cliente {{nome}} que comprou {{produto}} há {{dias}} dias.\n\nA mensagem deve pedir uma nota de 0 a 10 e um comentário.\nSeja breve e cordial.',
                variables: ['nome', 'produto', 'dias'],
            },
            {
                type: 'qualification' as const,
                name: 'Qualificação por Conversa',
                systemPrompt: 'Analise a conversa e determine o nível de interesse do lead.',
                promptTemplate: 'Analise as últimas mensagens desta conversa e determine:\n1. Nível de interesse (frio/morno/quente)\n2. Intenção de compra (sim/não/talvez)\n3. Próxima ação recomendada\n\nConversa:\n{{conversa}}\n\nResponda em JSON.',
                variables: ['conversa'],
            },
        ];

        for (const d of defaults) {
            await prisma.aiPrompt.upsert({
                where: {
                    tenantId_type_name: { tenantId, type: d.type, name: d.name },
                },
                update: {},
                create: {
                    tenantId,
                    ...d,
                },
            });
        }
    }
}

export const aiPromptsService = new AiPromptsService();
