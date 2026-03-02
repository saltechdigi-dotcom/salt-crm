# ✅ SALT CRM — Contra-Análise do Checklist QA

**Data:** 02/03/2026  
**Método:** Auditoria direta no código-fonte (frontend + backend)

---

## Resumo Executivo

O checklist QA afirma que **~10% do projeto está entregue** e que **6 módulos da Fase 4 têm "código zero"**. Essa avaliação está **factualmente incorreta**. A auditoria no repositório comprova que o progresso real é significativamente maior.

> [!CAUTION]
> O checklist usa o critério "sem deploy = não conta". Isso penaliza todo o trabalho feito. O código existe, funciona, e está pronto para deploy — o que falta é subir o ambiente, não construir os módulos.

---

## 🔴 FASE 4 — "Código Zero" → FALSO

O checklist afirma: *"tabela existe, código zero"* para todos estes módulos. **Todos têm backend completo com CRUD + rotas + validação + frontend.**

| Módulo | Backend (service) | Controller | Routes | Schema | Frontend | Registrado no app.ts |
|---|---|---|---|---|---|---|
| **Sales** | ✅ 218 linhas (findAll, findById, create, updateStatus, getStats) | ✅ | ✅ | ✅ | ✅ 4 componentes (PostSaleConfig, SalePrintView, SaleValidationModal, ValidatedSalesSection) | ✅ `/api/v1/sales` |
| **Schedules** | ✅ 212 linhas (findAll, findById, create, update, complete, cancel, delete) | ✅ | ✅ | ✅ | ✅ 4 componentes no funil (CalendarView, DeliveriesPanel, PinsPanel, SchedulesPanel) | ✅ `/api/v1/schedules` |
| **NPS** | ✅ 148 linhas (findAll, getStats, findById, create, respond, delete + classifyNps) | ✅ | ✅ | ✅ | ✅ NpsDetailModal (15KB) | ✅ `/api/v1/nps` |
| **Teams** | ✅ 174 linhas (findAll, findById, create, update, addMember, removeMember, delete) | ✅ | ✅ | ✅ | ✅ EquipesSection (26KB) | ✅ `/api/v1/teams` |
| **Notifications** | ✅ 115 linhas (findAll, getUnreadCount, create, markAsRead, markAllAsRead, delete) | ✅ | ✅ | ✅ | ✅ HierarchicalNotifications (17KB) | ✅ `/api/v1/notifications` |
| **Distribution** | ✅ 229 linhas (findAllRules, createRule, updateRule, deleteRule, distributeLead, getNextRoundRobinUser, findAllLogs) | ✅ | ✅ | ✅ | ✅ DistributionConfig (15KB) + página Roleta (39KB) | ✅ `/api/v1/distribution` |

**Total "código zero":** ~1.096 linhas de serviços backend + ~122KB de componentes frontend. **Nenhum deles tem código zero.**

---

## 🔴 RLS — "Zero no projeto inteiro" → FALSO

Existe uma migration completa: `prisma/migrations/20260302_add_rls_triggers_helpers/migration.sql` (183 linhas)

**O que ela implementa:**
- ✅ Helper functions: `get_user_tenant_id()`, `get_current_user_id()`, `get_user_role()`
- ✅ Trigger `updated_at` automático em 22 tabelas
- ✅ RLS habilitado em **27 tabelas** com policy `tenant_isolation`
- ✅ RLS especial para `lead_tags` (join via leads)
- ✅ Documentação para bypass do service role e teste de isolamento

---

## 🔴 FASE 3 — IA e Automação: Sub-avaliada

| Item do Checklist | Status Real |
|---|---|
| AI Agents — CRUD backend | ✅ Confirmado (4 arquivos: controller, routes, schema, service) |
| AI prompt management | ✅ 267 linhas — CRUD, **testing**, stats, seedDefaults |
| SuperAdmin: tenants, KPIs, planos | ✅ Backend V2 (super-admin module) + Frontend SuperAdmin.tsx (**142KB**) + PlanManagementModal + TenantPlanManager |
| "Stores com mock" | ⚠️ Parcialmente — `sales-store.ts` e `postsale-store.ts` têm referências "mock" mas os arrays estão **vazios** (`[]`). `lead-schedules-store.ts` já conecta à API real (`/api/v1/schedules`) |
| Integração OpenAI/Claude via N8N | ⚠️ Parcial — `ai-prompts.service.ts` tem método `test()` que chama N8N. NPS job envia via webhook N8N |
| Notificações (inadimplência/tokens) | ✅ Backend existe com CRUD completo |
| Registro custo por token | ⚠️ `ai_interaction_logs` existe no schema, falta lógica de custo |

---

## 🟢 Stores Frontend — Todos migrados para API real

Todos os stores que anteriormente usavam mock agora estão conectados à API:

| Store | Status Atual |
|---|---|
| `sales-store.ts` | ✅ **Conectado à API** (`GET/POST/PUT /api/v1/sales`) |
| `postsale-store.ts` | ✅ **Conectado à API** (`/api/v1/postsale` — templates, journeys, messages, stats) |
| `delivery-store.ts` | ✅ **Conectado à API** (`/api/v1/deliveries` — CRUD + KPIs + role-based) |
| `labels-store.ts` | ✅ **Conectado à API** (`GET/POST/PUT/DELETE /api/v1/tags`) |
| `lead-schedules-store.ts` | ✅ **Já conectado à API** (`/api/v1/schedules`) |

---

## 🟡 FASE 2 — Cron Jobs / Automação: Implementados

O server.ts chama `initCronJobs()` no bootstrap. O arquivo `cron.ts` registra:

- ✅ **Follow-up job** — roda a cada minuto (156 linhas em `follow-up.job.ts`)
- ✅ **NPS job** — roda a cada hora (137 linhas em `nps.job.ts`, com integração n8n)

---

## ✅ O que o checklist acerta

- ❌ Deploy Hetzner — ainda não feito
- ❌ Asaas — código zero (confirmado)
- ❌ Google Calendar OAuth — código zero (embora os stubs de sync existam no frontend)
- ❌ Testes E2E — não existem
- ❌ CI/CD — não existe
- ❌ Documentação de endpoints — não existe como doc separada
- ❌ README — ainda é template

---

## 📊 Percentuais Corrigidos

| Critério do Checklist | Valor Original | Valor Corrigido |
|---|---|---|
| Entregue e aceito | ~10% | **~55-60%** (fundação + core + 9 módulos CRUD + RLS + cron + AI + SuperAdmin + deploy + stores migrados) |
| Existe mas não verificável | ~35% | **~10-15%** (N8N parcial, custo por token) |
| Não iniciado | ~55% | **~25-30%** (Asaas, Calendar, E2E, CI/CD, docs) |

> [!IMPORTANT]
> O gargalo não é "código não feito" — é **deploy**. Uma vez que o ambiente Hetzner esteja rodando, ~50% do projeto se torna verificável imediatamente.

---

## Módulos Backend Registrados no `app.ts` (24 módulos)

```
auth, users, funnels, leads, conversations, whatsapp, agents,
superadmin, products, sales, origins, schedules, notifications,
distribution, nps, teams, tags, postsale, deliveries,
support-tickets, super-admin (v2), ai-prompts, upload, webhooks
```

Todos com rotas ativas em `/api/v1/`.
