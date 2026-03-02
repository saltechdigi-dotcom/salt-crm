-- ============================================================
-- SALT CRM - RLS + TRIGGERS + HELPER FUNCTIONS
-- Migration: add_rls_triggers_helpers
-- ============================================================

-- ============================================================
-- 1. HELPER FUNCTIONS
-- ============================================================

-- Function to get current user's tenant_id from session variable
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.tenant_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get current user's ID from session variable
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.user_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get current user's role from session variable
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.user_role', true), '');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- 2. UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables that have updated_at column
DO $$
DECLARE
  tbl TEXT;
  tables_with_updated_at TEXT[] := ARRAY[
    'tenants',
    'users',
    'teams',
    'plans',
    'tenant_feature_overrides',
    'lead_origins',
    'funnels',
    'funnel_stages',
    'leads',
    'whatsapp_connections',
    'conversations',
    'products',
    'sales',
    'schedules',
    'distribution_rules',
    'ai_prompts',
    'dashboard_metrics_daily',
    'tenant_settings',
    'tenant_onboarding',
    'support_tickets',
    'super_admin_users',
    'ai_agents'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_with_updated_at
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON %I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_updated_at();
    ', tbl, tbl);
  END LOOP;
END;
$$;

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tenant-scoped tables
DO $$
DECLARE
  tbl TEXT;
  tenant_tables TEXT[] := ARRAY[
    'users',
    'teams',
    'lead_origins',
    'funnels',
    'funnel_stages',
    'loss_reasons',
    'leads',
    'lead_stage_history',
    'lead_history',
    'tags',
    'lead_tags',
    'whatsapp_connections',
    'conversations',
    'messages',
    'products',
    'sales',
    'schedules',
    'nps_surveys',
    'distribution_rules',
    'distribution_logs',
    'ai_prompts',
    'ai_interaction_logs',
    'automation_logs',
    'sla_metrics',
    'dashboard_metrics_daily',
    'tenant_settings',
    'tenant_onboarding',
    'notifications',
    'support_tickets',
    'ai_agents'
  ];
BEGIN
  FOREACH tbl IN ARRAY tenant_tables
  LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);

    -- Drop existing policies if they exist
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I;', tbl);

    -- Create tenant isolation policy
    EXECUTE format('
      CREATE POLICY tenant_isolation ON %I
        USING (tenant_id = get_user_tenant_id())
        WITH CHECK (tenant_id = get_user_tenant_id());
    ', tbl);
  END LOOP;
END;
$$;

-- Special RLS for lead_tags (no direct tenant_id, uses join)
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON lead_tags;
CREATE POLICY tenant_isolation ON lead_tags
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = lead_tags.lead_id
      AND leads.tenant_id = get_user_tenant_id()
    )
  );

-- ============================================================
-- 4. SERVICE ROLE BYPASS (for backend API access)
-- ============================================================
-- The application connects as a service role that bypasses RLS.
-- If you want RLS enforcement at DB level, create a restricted role:

-- CREATE ROLE salt_app_user NOINHERIT;
-- GRANT USAGE ON SCHEMA public TO salt_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO salt_app_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO salt_app_user;

-- To use RLS with the app, before each request set:
-- SET app.tenant_id = '<tenant-uuid>';
-- SET app.user_id = '<user-uuid>';
-- SET app.user_role = '<role>';

-- ============================================================
-- 5. MULTI-TENANT ISOLATION TEST QUERY
-- ============================================================
-- Run this to verify isolation works correctly:
--
-- SET app.tenant_id = '<test-tenant-uuid>';
-- SELECT * FROM leads;  -- Should only return leads for that tenant
-- RESET app.tenant_id;
