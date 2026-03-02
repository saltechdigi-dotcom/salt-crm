 ✅ SALT CRM — Checklist QA (ATUALIZADO com staging)
### Baseado no Contrato + PRD v3 + Código no GitHub (main + staging)
**Data:** 27/02/2026 | **Prazo contratual:** 16/03/2026 (tolerância até 23/03)

---

## O QUE MUDOU de main → staging

| O que | main | staging | Mudou? |
|-------|------|---------|--------|
| Módulos backend | 7 | 10 (+agents, +superadmin, +upload) | ✅ Sim |
| Linhas backend | 4.063 | 5.965 (+1.902) | ✅ Sim |
| Linhas frontend | 37.718 | 38.520 (+802) | Pouco |
| Chat-store com API real | Não | Sim (novo arquivo) | ✅ Sim |
| Documentação endpoints | Não | Sim (references/endpoints.md) | ✅ Sim* |
| Asaas | Zero | Zero | ❌ Nada |
| Google Calendar | Zero | Zero | ❌ Nada |
| RLS (segurança) | Zero | Zero | ❌ Nada |
| Sales/Vendas módulo | Não | Não | ❌ Nada |
| Schedules módulo | Não | Não | ❌ Nada |
| Notifications módulo | Não | Não | ❌ Nada |
| Distribution/Roleta | Não | Não | ❌ Nada |
| NPS módulo | Não | Não | ❌ Nada |
| Teams módulo | Não | Não | ❌ Nada |

*A documentação de endpoints é da API do UAZAPI (WhatsApp), não dos endpoints do SALT CRM.

---

## 🟢 FEITO

### Banco de Dados
- [x] 34 tabelas criadas (migration de 10/02)
- [x] Seed com tenant demo + usuários
- [x] Índices nas tabelas principais
- [x] Nova migration: add avatar_url to leads (22/02)
- [x] Novo model AiAgent adicionado ao schema

### Autenticação
- [x] Login com e-mail e senha (JWT + refresh)
- [x] Login SuperAdmin separado
- [x] Middleware de autenticação
- [x] Middleware de tenant
- [x] Middleware de role
- [x] Tela de Login conectada à API real

### CRUDs Backend
- [x] Leads (637 linhas)
- [x] Funnels + Stages (513 linhas)
- [x] Users (397 linhas)
- [x] Conversations (500 linhas)
- [x] **NOVO: Agents — CRUD de agentes IA (151 linhas)**
- [x] **NOVO: SuperAdmin — listagem de tenants, KPIs, planos (653 linhas)**
- [x] **NOVO: Upload — envio de arquivos/mídia (50 linhas)**

### WhatsApp / UAZAPI
- [x] Criar instância + QR Code
- [x] Receber mensagens via webhook
- [x] Salvar mensagens + criar lead automaticamente
- [x] Enviar texto e mídia
- [x] Status em tempo real via Socket.io
- [x] Deletar conexão
- [x] **NOVO: Webhook refatorado em arquivo separado (320 linhas)**
- [x] **NOVO: Múltiplos paths de webhook (/webhook, /api/v1/whatsapp/webhook, /webhooks/uazapi/webhook)**

### Frontend conectado ao backend real
- [x] auth-store → login real
- [x] whatsapp-api → WhatsApp real (agora com delete também)
- [x] **NOVO: chat-store → conversas e mensagens reais via API**
- [x] **NOVO: socket.ts → WebSocket client configurado**

---

## 🔴 PENDENTE — Entregáveis do Contrato

### Banco de Dados — Cláusula 2.1/2.2
- [ ] **RLS (Row Level Security) — ZERO no projeto inteiro**
- [ ] **Funções helper (get_user_tenant_id, etc) — ZERO**
- [ ] **Teste de isolamento multi-tenant — ZERO**
- [ ] **Triggers updated_at nativos SQL — ZERO**

### Integração Asaas — Cláusula 2.3
- [ ] **Criar cliente Asaas ao criar tenant — ZERO CÓDIGO**
- [ ] **Criar assinatura recorrente — ZERO**
- [ ] **Webhook de pagamento — ZERO**
- [ ] **Espelhamento faturas — ZERO**
- [ ] **Tela de fatura — ZERO**
- [ ] **Suspensão por inadimplência — ZERO**

> ⚠️ Busquei no projeto INTEIRO: a palavra "asaas" não aparece em NENHUM arquivo fora do PRD.

### Integração Google Calendar — Cláusula 2.5
- [ ] **OAuth2 — ZERO CÓDIGO**
- [ ] **Criar evento — ZERO**
- [ ] **Webhook de atualizações — ZERO**
- [ ] **Config por usuário — ZERO**
- [ ] **Tela frontend — ZERO**

> ⚠️ Busquei no projeto INTEIRO: nenhum arquivo de integração Google existe.

### Módulos Backend que NÃO existem
- [ ] **Sales (vendas com validação hierárquica) — tabela no banco mas ZERO código**
- [ ] **Schedules (agendamentos) — tabela no banco mas ZERO código**
- [ ] **Notifications — tabela no banco mas ZERO código**
- [ ] **Distribution / Roleta de leads — tabela no banco mas ZERO código**
- [ ] **NPS (pesquisa satisfação) — tabela no banco mas ZERO código**
- [ ] **Teams (CRUD equipes) — tabela no banco mas ZERO código**

### Frontend — Stores ainda com dados falsos (MOCK)
- [ ] **lists-store → mockLists**
- [ ] **lead-history-store → mockHistoryEvents, mockLeadProfiles**
- [ ] **lead-schedules-store → mock schedules**
- [ ] **lead-demands-store → mock demands**
- [ ] **support-tickets-store → mockSupportTickets**
- [ ] **inventory-store → mockInventoryItems, mockStockMovements**
- [ ] **admin-store → mockSuperAdminUsers, mockTenants**

### Frontend — Telas sem conexão real
- [ ] **Dashboard com dados reais (hoje parcialmente mock)**
- [ ] **Funil visual drag-and-drop com dados reais**
- [ ] **Tela de vendas funcional**
- [ ] **Tela de clientes funcional**
- [ ] **Tela de estoque funcional**
- [ ] **Roleta de leads funcional**
- [ ] **Tela de suporte funcional**

### Documentação — Cláusula 7.1
- [ ] **Documentação dos endpoints do SALT CRM para o Nicolas**
  - *Obs: o arquivo endpoints.md que está no repo é da API da UAZAPI, não do SALT*
- [ ] **README atualizado (hoje é template Lovable.dev)**
- [ ] **Relatórios de progresso a cada 5 dias (Cláusula 3.4)**

### Deploy e Testes
- [ ] **Deploy na Hetzner**
- [ ] **Ambiente acessível para teste**
- [ ] **Testes E2E**
- [ ] **CI/CD**

---

## 📊 SCORECARD ATUALIZADO

| Área | % Feito | Status |
|------|---------|--------|
| Banco de Dados (sem RLS) | ~50% | 🟡 Parcial |
| Auth/Login | ~95% | 🟢 OK |
| CRUDs Backend (8 de 14 módulos) | ~55% | 🟡 Parcial |
| WhatsApp (UAZAPI) | ~85% | 🟢 Quase OK |
| Chat em tempo real | ~70% | 🟡 Parcial |
| Asaas (cobrança) | 0% | 🔴 Zero |
| Google Calendar | 0% | 🔴 Zero |
| Agentes IA | ~15% | 🟡 Iniciado |
| Frontend conectado | 4 de 12 stores | 🔴 ~30% |
| Deploy/Testes | 0% | 🔴 Zero |
| Documentação | ~5% | 🔴 Quase zero |