Yago, segue o checklist da análise do repositório.

Contexto geral:
Para chegar nos percentuais abaixo, usei o seguinte critério: entregue de fato = funcionalidade testada em ambiente real, sem mock, acessível para validação.

**Atualizado em 02/03/2026 (pós-deploy + migração de stores):**
* **~55-60% entregue** — Fundação + Core + 6 módulos CRUD + RLS + Cron + IA + SuperAdmin + Deploy Hetzner + Stores conectados à API real
* **~10-15% existe mas parcial** — N8N parcial, custo por token pendente
* **~25-30% não iniciado** — Asaas, Calendar, E2E, CI/CD, documentação

---

FASE 1 — Fundação ✅ Entregue e aceita (~10% do projeto)
✓ Setup Node.js + Express + TypeScript
✓ Prisma + Supabase
✓ Migrations + seed (34 tabelas)
✓ Auth: login, JWT, refresh
✓ Middlewares: auth, tenant, role
✓ Tela de Login conectada à API real

---

FASE 2 — Core ✅ Entregue
✓ CRUD Leads, Funnels, Users
✓ Conversations + Messages
✓ Socket.io
✓ UAZAPI: QR, envio, recebimento, webhook, delete
✓ chat-store com API real
✓ Deploy Hetzner — ✅ Feito
✓ Ambiente acessível para testes — ✅ Staging no ar

---

FASE 3 — IA e Automação ✅ Maioria entregue
✓ AI Agents — CRUD backend
✓ AI prompt management com CRUD, testing e stats
✓ SuperAdmin: tenants, KPIs, planos
✓ Stores migrados para API real — ✅ **Todos 4 conectados à API** (sales-store, labels-store, postsale-store, delivery-store)
✓ Notificações — backend CRUD completo
⚠️ Registro de custo por token — tabela `ai_interaction_logs` existe, falta lógica de custo
⚠️ Integração OpenAI/Claude via N8N — parcial (ai-prompts tem test via N8N, NPS job com webhook)

---

FASE 4 — Polish ⚠️ Maioria feita, pendências restantes
✓ Módulo Sales — ✅ Backend completo (218 linhas service) + 4 componentes frontend + store migrado
✓ Módulo Schedules — ✅ Backend completo (212 linhas) + 4 componentes funil
✓ Módulo NPS — ✅ Backend completo (148 linhas) + NpsDetailModal
✓ Módulo Teams — ✅ Backend completo (174 linhas) + EquipesSection
✓ Módulo Notifications — ✅ Backend completo (115 linhas) + HierarchicalNotifications
✓ Distribution / Roleta — ✅ Backend completo (229 linhas) + DistributionConfig + Roleta
✓ Módulo PostSale — ✅ Backend NOVO (templates, jornadas, mensagens) + store migrado
✓ Módulo Deliveries — ✅ Backend NOVO (CRUD + KPIs + role-based) + store migrado
✓ Módulo Tags — ✅ Backend NOVO (CRUD) + labels-store migrado
✓ RLS — ✅ Migration com 27 tabelas protegidas
✕ Testes E2E — não iniciado
✕ CI/CD — não iniciado

---

INTEGRAÇÕES CRÍTICAS ❌ Zero código até agora

Asaas (Cláusula 2.3) — confirmado para essa semana:
✕ Criar cliente ao criar tenant
✕ Assinatura recorrente
✕ Webhook de pagamento
✕ Espelhamento de faturas + tela
✕ Suspensão por inadimplência

Google Calendar (Cláusula 2.5) — confirmado para essa semana:
✕ OAuth2 por usuário
✕ Criar evento via CRM
✕ Webhook de atualizações
✕ Config por usuário + tela frontend

❓ Previsão de dias para cada integração — Asaas e Calendar são complexas, preciso saber o peso de cada uma na semana.

---

DOCUMENTAÇÃO ❌ Não iniciado
✕ Endpoints do SALT CRM documentados para o Nicolas
✕ README atualizado
✕ Relatórios de progresso a cada 5 dias (Cláusula 3.4)

---

## 📊 RESUMO GERAL — 24 módulos backend registrados no app.ts

```
auth, users, funnels, leads, conversations, whatsapp, agents,
superadmin, products, sales, origins, schedules, notifications,
distribution, nps, teams, tags, postsale, deliveries,
support-tickets, super-admin (v2), ai-prompts, upload, webhooks
```

Todos em `/api/v1/` com auth middleware.