# SALT CRM — Backend

Node.js + Express + Prisma + PostgreSQL multi-tenant CRM backend.

## Setup

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start development
npm run dev
```

## Architecture

```
src/
├── config/         # Database, env, logger
├── middlewares/     # Auth, validation, error, role
├── modules/        # Feature modules (routes, controller, service, schema)
│   ├── auth/
│   ├── users/
│   ├── leads/
│   ├── funnels/
│   ├── sales/
│   ├── products/
│   ├── conversations/
│   ├── whatsapp/
│   ├── schedules/
│   ├── notifications/
│   ├── distribution/
│   ├── nps/
│   ├── teams/
│   ├── support-tickets/
│   ├── super-admin/
│   ├── superadmin/
│   ├── agents/
│   ├── origins/
│   ├── upload/
│   └── webhooks/
├── utils/          # Errors, helpers
└── app.ts          # Express app entry
```

## Key Features

- **Multi-tenancy** via `tenant_id` on all resources
- **Row Level Security** (RLS) in PostgreSQL
- **JWT Authentication** (separate for tenants vs super-admin)
- **Role-based access** (admin, manager, agent)
- **Zod validation** on all endpoints
- **WhatsApp** integration via UaZAPI
- **AI Agents** configuration (SDR, NPS, Follow-up)

## API Docs

See [API_DOCS.md](./API_DOCS.md) for full endpoint reference.
