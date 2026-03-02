# SALT CRM — API Documentation

> Base URL: `http://localhost:3000/api/v1`  
> Authentication: Bearer Token (JWT)

---

## 🔐 Auth (`/auth`)

| Method | Endpoint        | Description           |
|--------|-----------------|-----------------------|
| POST   | `/auth/login`   | Login (email+password)|
| POST   | `/auth/register`| Register new user     |
| POST   | `/auth/refresh` | Refresh JWT token     |
| GET    | `/auth/me`      | Get current user info |

---

## 👥 Users (`/users`)

| Method | Endpoint          | Description              | Auth   |
|--------|-------------------|--------------------------|--------|
| GET    | `/users`          | List all users           | admin/manager |
| GET    | `/users/:id`      | Get user by ID           | all    |
| POST   | `/users`          | Create user              | admin  |
| PUT    | `/users/:id`      | Update user              | admin  |
| DELETE | `/users/:id`      | Delete user              | admin  |

---

## 🎯 Leads (`/leads`)

| Method | Endpoint                     | Description              | Auth   |
|--------|------------------------------|--------------------------|--------|
| GET    | `/leads`                     | List leads (paginated)   | all    |
| GET    | `/leads/:id`                 | Get lead by ID           | all    |
| POST   | `/leads`                     | Create lead              | all    |
| PUT    | `/leads/:id`                 | Update lead              | all    |
| DELETE | `/leads/:id`                 | Delete lead              | admin/manager |
| GET    | `/leads/:id/history`         | Get lead history         | all    |
| POST   | `/leads/:id/history`         | Add lead observation     | all    |

---

## 🔄 Funnels (`/funnels`)

| Method | Endpoint                            | Description              | Auth   |
|--------|-------------------------------------|--------------------------|--------|
| GET    | `/funnels`                          | List all funnels         | all    |
| GET    | `/funnels/:id`                      | Get funnel with stages   | all    |
| POST   | `/funnels`                          | Create funnel            | admin/manager |
| PUT    | `/funnels/:id`                      | Update funnel            | admin/manager |
| DELETE | `/funnels/:id`                      | Delete funnel            | admin  |
| POST   | `/funnels/:id/stages`               | Add stage to funnel      | admin/manager |
| PUT    | `/funnels/:funnelId/stages/:stageId`| Update funnel stage      | admin/manager |

---

## 📊 Origins (`/origins`)

| Method | Endpoint           | Description              | Auth   |
|--------|--------------------|--------------------------|--------|
| GET    | `/origins`         | List lead origins        | all    |
| POST   | `/origins`         | Create origin            | admin  |
| PUT    | `/origins/:id`     | Update origin            | admin  |
| DELETE | `/origins/:id`     | Delete origin            | admin  |

---

## 💰 Sales (`/sales`)

| Method | Endpoint           | Description              | Auth   |
|--------|--------------------|--------------------------|--------|
| GET    | `/sales`           | List sales (paginated)   | all    |
| GET    | `/sales/stats`     | Sales KPI statistics     | all    |
| GET    | `/sales/:id`       | Get sale by ID           | all    |
| POST   | `/sales`           | Register new sale        | all    |
| PUT    | `/sales/:id`       | Update sale              | all    |
| DELETE | `/sales/:id`       | Delete sale              | admin/manager |

---

## 📦 Products (`/products`)

| Method | Endpoint           | Description              | Auth   |
|--------|--------------------|--------------------------|--------|
| GET    | `/products`        | List products            | all    |
| GET    | `/products/:id`    | Get product by ID        | all    |
| POST   | `/products`        | Create product           | admin/manager |
| PUT    | `/products/:id`    | Update product           | admin/manager |
| DELETE | `/products/:id`    | Delete product           | admin  |

---

## 📅 Schedules (`/schedules`)

| Method | Endpoint                    | Description              | Auth   |
|--------|-----------------------------|--------------------------|--------|
| GET    | `/schedules`                | List schedules           | all    |
| GET    | `/schedules/:id`            | Get schedule by ID       | all    |
| POST   | `/schedules`                | Create schedule          | all    |
| PUT    | `/schedules/:id`            | Update schedule          | all    |
| PATCH  | `/schedules/:id/complete`   | Mark as completed        | all    |
| PATCH  | `/schedules/:id/cancel`     | Cancel schedule          | all    |
| DELETE | `/schedules/:id`            | Delete schedule          | all    |

---

## 🔔 Notifications (`/notifications`)

| Method | Endpoint                           | Description              | Auth   |
|--------|------------------------------------|--------------------------|--------|
| GET    | `/notifications`                   | List notifications       | all    |
| GET    | `/notifications/unread-count`      | Get unread count         | all    |
| GET    | `/notifications/:id`               | Get notification by ID   | all    |
| POST   | `/notifications`                   | Create notification      | admin/manager |
| PUT    | `/notifications/:id`               | Update notification      | admin/manager |
| PATCH  | `/notifications/:id/read`          | Mark as read             | all    |
| PATCH  | `/notifications/read-all`          | Mark all as read         | all    |
| DELETE | `/notifications/:id`               | Delete notification      | admin  |

---

## 🎡 Distribution / Roleta (`/distribution`)

| Method | Endpoint                         | Description              | Auth   |
|--------|----------------------------------|--------------------------|--------|
| GET    | `/distribution/rules`            | List distribution rules  | admin/manager |
| POST   | `/distribution/rules`            | Create rule              | admin  |
| PUT    | `/distribution/rules/:id`        | Update rule              | admin  |
| DELETE | `/distribution/rules/:id`        | Delete rule              | admin  |
| POST   | `/distribution/distribute`       | Distribute a lead        | admin/manager |
| GET    | `/distribution/logs`             | List distribution logs   | admin/manager |

---

## ⭐ NPS (`/nps`)

| Method | Endpoint                | Description              | Auth   |
|--------|-------------------------|--------------------------|--------|
| GET    | `/nps`                  | List NPS surveys         | all    |
| GET    | `/nps/stats`            | NPS statistics/score     | all    |
| GET    | `/nps/:id`              | Get NPS survey by ID     | all    |
| POST   | `/nps`                  | Create NPS survey        | admin/manager |
| PUT    | `/nps/:id`              | Update NPS survey        | admin/manager |
| PATCH  | `/nps/:id/respond`      | Respond to NPS survey    | all    |
| DELETE | `/nps/:id`              | Delete survey            | admin  |

---

## 👥 Teams (`/teams`)

| Method | Endpoint                               | Description              | Auth   |
|--------|----------------------------------------|--------------------------|--------|
| GET    | `/teams`                               | List teams               | admin/manager |
| GET    | `/teams/:id`                           | Get team by ID           | all    |
| POST   | `/teams`                               | Create team              | admin  |
| PUT    | `/teams/:id`                           | Update team              | admin/manager |
| DELETE | `/teams/:id`                           | Delete team              | admin  |
| POST   | `/teams/:id/members`                   | Add member to team       | admin/manager |
| DELETE | `/teams/:id/members/:userId`           | Remove member from team  | admin/manager |

---

## 🎫 Support Tickets (`/support-tickets`)

| Method | Endpoint                             | Description              | Auth   |
|--------|--------------------------------------|--------------------------|--------|
| GET    | `/support-tickets`                   | List tickets             | all    |
| GET    | `/support-tickets/stats`             | Ticket statistics        | all    |
| GET    | `/support-tickets/:id`               | Get ticket by ID         | all    |
| POST   | `/support-tickets`                   | Create ticket            | all    |
| PUT    | `/support-tickets/:id`               | Update ticket            | all    |
| PATCH  | `/support-tickets/:id/resolve`       | Resolve ticket           | admin/manager |
| DELETE | `/support-tickets/:id`               | Delete ticket            | admin/manager |

### Create Ticket Body
```json
{
  "type": "whatsapp | funnel | ai | billing | technical | other",
  "subject": "Problema com integração WhatsApp",
  "description": "A conexão cai constantemente após 5 minutos...",
  "priority": "low | medium | high | critical"
}
```

---

## 💬 Conversations (`/conversations`)

| Method | Endpoint                        | Description              | Auth   |
|--------|---------------------------------|--------------------------|--------|
| GET    | `/conversations`                | List conversations       | all    |
| GET    | `/conversations/:id`            | Get conversation + msgs  | all    |
| POST   | `/conversations/:id/messages`   | Send message             | all    |

---

## 📱 WhatsApp (`/whatsapp`)

| Method | Endpoint                   | Description              | Auth   |
|--------|----------------------------|--------------------------|--------|
| GET    | `/whatsapp/connections`    | List connections         | admin  |
| POST   | `/whatsapp/connect`        | Start new connection     | admin  |
| POST   | `/whatsapp/disconnect`     | Disconnect session       | admin  |

---

## 🤖 AI Agents (`/agents`)

| Method | Endpoint           | Description              | Auth   |
|--------|--------------------|--------------------------|--------|
| GET    | `/agents`          | List AI agents           | admin/manager |
| PUT    | `/agents/:id`      | Update agent config      | admin  |

---

## 🏢 Super Admin (`/super-admin`)

> Uses separate JWT authentication with `isSuperAdmin: true` claim.

| Method | Endpoint                            | Description              | Auth       |
|--------|-------------------------------------|--------------------------|------------|
| POST   | `/super-admin/login`                | Super Admin login        | public     |
| GET    | `/super-admin/dashboard`            | Platform-wide KPIs       | superadmin |
| GET    | `/super-admin/plans`                | List available plans     | superadmin |
| GET    | `/super-admin/tenants`              | List all tenants         | superadmin |
| GET    | `/super-admin/tenants/:id`          | Get tenant details       | superadmin |
| POST   | `/super-admin/tenants`              | Create tenant            | superadmin |
| PUT    | `/super-admin/tenants/:id`          | Update tenant            | superadmin |
| DELETE | `/super-admin/tenants/:id`          | Delete tenant            | superadmin |
| GET    | `/super-admin/alerts`               | List critical alerts     | superadmin |
| PATCH  | `/super-admin/alerts/:id/resolve`   | Resolve alert            | superadmin |

### Dashboard Stats Response
```json
{
  "tenants": { "total": 45, "active": 40, "suspended": 5 },
  "users": 120,
  "leads": 5000,
  "sales": 850,
  "openTickets": 12,
  "pendingAlerts": 3,
  "mrr": 12500.00
}
```

---

## 🏢 Super Admin v1 (`/superadmin`)

> Legacy Super Admin routes (existing module).

| Method | Endpoint                                    | Description              | Auth       |
|--------|---------------------------------------------|--------------------------|------------|
| GET    | `/superadmin/tenants`                       | List all tenants         | admin      |
| GET    | `/superadmin/tenants/:id`                   | Get tenant details       | admin      |
| POST   | `/superadmin/tenants`                       | Create tenant            | admin      |
| PUT    | `/superadmin/tenants/:id`                   | Update tenant            | admin      |
| POST   | `/superadmin/tenants/:id/suspend`           | Suspend tenant           | admin      |
| POST   | `/superadmin/tenants/:id/activate`          | Activate tenant          | admin      |
| DELETE | `/superadmin/tenants/:id`                   | Delete tenant            | admin      |
| GET    | `/superadmin/kpis`                          | Platform KPIs            | admin      |
| POST   | `/superadmin/users/:id/reset-password`      | Reset user password      | admin      |
| POST   | `/superadmin/impersonate/:tenantId`         | Impersonate tenant       | admin      |
| GET    | `/superadmin/plans`                         | List plans               | admin      |

---

## 📎 Upload (`/upload` internal)

Internal file upload support for attachments and avatars.

---

## 🔗 Webhooks

| Method | Endpoint                         | Description              |
|--------|----------------------------------|--------------------------|
| POST   | `/webhook`                       | WhatsApp webhook (UaZAPI)|
| POST   | `/api/v1/whatsapp/webhook`       | WhatsApp webhook (alt)   |
| POST   | `/webhooks/uazapi/webhook`       | WhatsApp webhook (alt 2) |
| GET    | `/webhook`                       | Health check             |
