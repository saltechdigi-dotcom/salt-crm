import { z } from 'zod';

export const createAiPromptSchema = z.object({
    type: z.enum(['sdr', 'followup', 'nps', 'qualification', 'objection']),
    name: z.string().min(2),
    promptTemplate: z.string().min(10),
    systemPrompt: z.string().optional(),
    variables: z.array(z.string()).optional().default([]),
    model: z.string().optional().default('gpt-4o-mini'),
    temperature: z.number().min(0).max(2).optional().default(0.7),
    maxTokens: z.number().int().min(50).max(4000).optional().default(500),
    isActive: z.boolean().optional().default(true),
});

export const updateAiPromptSchema = z.object({
    type: z.enum(['sdr', 'followup', 'nps', 'qualification', 'objection']).optional(),
    name: z.string().min(2).optional(),
    promptTemplate: z.string().min(10).optional(),
    systemPrompt: z.string().optional(),
    variables: z.array(z.string()).optional(),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().min(50).max(4000).optional(),
    isActive: z.boolean().optional(),
});

export const aiPromptIdSchema = z.object({
    id: z.string().uuid(),
});

export const listAiPromptsSchema = z.object({
    type: z.enum(['sdr', 'followup', 'nps', 'qualification', 'objection']).optional(),
    isActive: z.string().optional().transform(v => v === 'true'),
});

export const testAiPromptSchema = z.object({
    variables: z.record(z.string(), z.string()).optional().default({}),
    testInput: z.string().optional().default('Lead de teste para qualificação'),
});
