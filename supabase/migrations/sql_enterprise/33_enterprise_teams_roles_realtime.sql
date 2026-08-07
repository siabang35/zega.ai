-- ============================================================================
-- ZEGA AI ENTERPRISE ORCHESTRATOR HUB - REAL-TIME TEAMS & ROLES SCHEMAS
-- Migration File: 33_enterprise_teams_roles_realtime.sql
-- Modules: Team Members, Roles Directory, Permission Matrix, Governance & Security
-- Enterprise Standards: RLS Policies, Defensive Schema Evolution, Realtime Synchronization
-- ============================================================================

-- 1. ENTERPRISE TEAM MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.enterprise_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_code VARCHAR(100) DEFAULT 'mem_01H8QZ9WJ7GJ',
  full_name VARCHAR(255) DEFAULT 'Danz Assyidq',
  email VARCHAR(255) DEFAULT 'danz@acme.com',
  avatar_url VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  role_name VARCHAR(100) DEFAULT 'Enterprise Admin',
  department VARCHAR(100) DEFAULT 'Engineering',
  status VARCHAR(20) DEFAULT 'Active', -- Active, Pending, Inactive
  last_active VARCHAR(100) DEFAULT '2 minutes ago',
  mfa_enabled BOOLEAN DEFAULT TRUE,
  sso_provider VARCHAR(50) DEFAULT 'SAML',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEFENSIVE COLUMN PROVISIONS & CONSTRAINT RELAXATION
ALTER TABLE public.enterprise_team_members ADD COLUMN IF NOT EXISTS member_code VARCHAR(100) DEFAULT 'mem_01H8QZ9WJ7GJ';
ALTER TABLE public.enterprise_team_members ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) DEFAULT 'Danz Assyidq';
ALTER TABLE public.enterprise_team_members ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT 'danz@acme.com';
ALTER TABLE public.enterprise_team_members ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces';
ALTER TABLE public.enterprise_team_members ADD COLUMN IF NOT EXISTS role_name VARCHAR(100) DEFAULT 'Enterprise Admin';
ALTER TABLE public.enterprise_team_members ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Engineering';
ALTER TABLE public.enterprise_team_members ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';
ALTER TABLE public.enterprise_team_members ADD COLUMN IF NOT EXISTS last_active VARCHAR(100) DEFAULT '2 minutes ago';
ALTER TABLE public.enterprise_team_members ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.enterprise_team_members ADD COLUMN IF NOT EXISTS sso_provider VARCHAR(50) DEFAULT 'SAML';

ALTER TABLE public.enterprise_team_members ALTER COLUMN full_name DROP NOT NULL;
ALTER TABLE public.enterprise_team_members ALTER COLUMN email DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'enterprise_team_members_email_key'
  ) THEN
    ALTER TABLE public.enterprise_team_members ADD CONSTRAINT enterprise_team_members_email_key UNIQUE (email);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. ENTERPRISE ROLES TABLE
CREATE TABLE IF NOT EXISTS public.enterprise_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code VARCHAR(100) DEFAULT 'role_ent_admin',
  name VARCHAR(100) DEFAULT 'Enterprise Admin',
  role_type VARCHAR(20) DEFAULT 'System', -- System, Custom
  description TEXT DEFAULT 'Full access to all features and settings',
  assigned_users_count INT DEFAULT 3,
  permissions_count_label VARCHAR(50) DEFAULT 'All',
  created_date_label VARCHAR(50) DEFAULT 'Jan 10, 2025',
  last_updated_label VARCHAR(50) DEFAULT 'May 28, 2025',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEFENSIVE COLUMN PROVISIONS & CONSTRAINT RELAXATION
ALTER TABLE public.enterprise_roles ADD COLUMN IF NOT EXISTS role_code VARCHAR(100) DEFAULT 'role_ent_admin';
ALTER TABLE public.enterprise_roles ADD COLUMN IF NOT EXISTS name VARCHAR(100) DEFAULT 'Enterprise Admin';
ALTER TABLE public.enterprise_roles ADD COLUMN IF NOT EXISTS role_type VARCHAR(20) DEFAULT 'System';
ALTER TABLE public.enterprise_roles ADD COLUMN IF NOT EXISTS description TEXT DEFAULT 'Full access to all features and settings';
ALTER TABLE public.enterprise_roles ADD COLUMN IF NOT EXISTS assigned_users_count INT DEFAULT 3;
ALTER TABLE public.enterprise_roles ADD COLUMN IF NOT EXISTS permissions_count_label VARCHAR(50) DEFAULT 'All';
ALTER TABLE public.enterprise_roles ADD COLUMN IF NOT EXISTS created_date_label VARCHAR(50) DEFAULT 'Jan 10, 2025';
ALTER TABLE public.enterprise_roles ADD COLUMN IF NOT EXISTS last_updated_label VARCHAR(50) DEFAULT 'May 28, 2025';

ALTER TABLE public.enterprise_roles ALTER COLUMN name DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'enterprise_roles_name_key'
  ) THEN
    ALTER TABLE public.enterprise_roles ADD CONSTRAINT enterprise_roles_name_key UNIQUE (name);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. ENTERPRISE PERMISSIONS MATRIX TABLE
CREATE TABLE IF NOT EXISTS public.enterprise_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_code VARCHAR(100) DEFAULT 'org.create',
  category VARCHAR(100) DEFAULT 'Organization',
  description TEXT DEFAULT 'Create new organizations',
  allow_enterprise_admin BOOLEAN DEFAULT TRUE,
  allow_admin BOOLEAN DEFAULT TRUE,
  allow_developer BOOLEAN DEFAULT TRUE,
  allow_analyst BOOLEAN DEFAULT FALSE,
  allow_viewer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEFENSIVE COLUMN PROVISIONS & CONSTRAINT RELAXATION
ALTER TABLE public.enterprise_permissions ADD COLUMN IF NOT EXISTS permission_code VARCHAR(100) DEFAULT 'org.create';
ALTER TABLE public.enterprise_permissions ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Organization';
ALTER TABLE public.enterprise_permissions ADD COLUMN IF NOT EXISTS description TEXT DEFAULT 'Create new organizations';
ALTER TABLE public.enterprise_permissions ADD COLUMN IF NOT EXISTS allow_enterprise_admin BOOLEAN DEFAULT TRUE;
ALTER TABLE public.enterprise_permissions ADD COLUMN IF NOT EXISTS allow_admin BOOLEAN DEFAULT TRUE;
ALTER TABLE public.enterprise_permissions ADD COLUMN IF NOT EXISTS allow_developer BOOLEAN DEFAULT TRUE;
ALTER TABLE public.enterprise_permissions ADD COLUMN IF NOT EXISTS allow_analyst BOOLEAN DEFAULT FALSE;
ALTER TABLE public.enterprise_permissions ADD COLUMN IF NOT EXISTS allow_viewer BOOLEAN DEFAULT FALSE;

ALTER TABLE public.enterprise_permissions ALTER COLUMN permission_code DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'enterprise_permissions_code_key'
  ) THEN
    ALTER TABLE public.enterprise_permissions ADD CONSTRAINT enterprise_permissions_code_key UNIQUE (permission_code);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- HIGH-PERFORMANCE INDEXING
CREATE INDEX IF NOT EXISTS idx_ent_members_role ON public.enterprise_team_members(role_name);
CREATE INDEX IF NOT EXISTS idx_ent_members_status ON public.enterprise_team_members(status);
CREATE INDEX IF NOT EXISTS idx_ent_members_dept ON public.enterprise_team_members(department);
CREATE INDEX IF NOT EXISTS idx_ent_permissions_cat ON public.enterprise_permissions(category);

-- RLS POLICIES (IDEMPOTENT PROVISIONS)
ALTER TABLE public.enterprise_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read enterprise_team_members" ON public.enterprise_team_members;
DROP POLICY IF EXISTS "Allow public insert enterprise_team_members" ON public.enterprise_team_members;
DROP POLICY IF EXISTS "Allow public update enterprise_team_members" ON public.enterprise_team_members;
DROP POLICY IF EXISTS "Allow public delete enterprise_team_members" ON public.enterprise_team_members;
CREATE POLICY "Allow public read enterprise_team_members" ON public.enterprise_team_members FOR SELECT USING (true);
CREATE POLICY "Allow public insert enterprise_team_members" ON public.enterprise_team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update enterprise_team_members" ON public.enterprise_team_members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete enterprise_team_members" ON public.enterprise_team_members FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read enterprise_roles" ON public.enterprise_roles;
DROP POLICY IF EXISTS "Allow public insert enterprise_roles" ON public.enterprise_roles;
DROP POLICY IF EXISTS "Allow public update enterprise_roles" ON public.enterprise_roles;
DROP POLICY IF EXISTS "Allow public delete enterprise_roles" ON public.enterprise_roles;
CREATE POLICY "Allow public read enterprise_roles" ON public.enterprise_roles FOR SELECT USING (true);
CREATE POLICY "Allow public insert enterprise_roles" ON public.enterprise_roles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update enterprise_roles" ON public.enterprise_roles FOR UPDATE USING (true);
CREATE POLICY "Allow public delete enterprise_roles" ON public.enterprise_roles FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read enterprise_permissions" ON public.enterprise_permissions;
DROP POLICY IF EXISTS "Allow public insert enterprise_permissions" ON public.enterprise_permissions;
DROP POLICY IF EXISTS "Allow public update enterprise_permissions" ON public.enterprise_permissions;
DROP POLICY IF EXISTS "Allow public delete enterprise_permissions" ON public.enterprise_permissions;
CREATE POLICY "Allow public read enterprise_permissions" ON public.enterprise_permissions FOR SELECT USING (true);
CREATE POLICY "Allow public insert enterprise_permissions" ON public.enterprise_permissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update enterprise_permissions" ON public.enterprise_permissions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete enterprise_permissions" ON public.enterprise_permissions FOR DELETE USING (true);

-- STORED PROCEDURE TO INVITE TEAM MEMBER
CREATE OR REPLACE FUNCTION public.fn_invite_team_member(
  p_full_name VARCHAR,
  p_email VARCHAR,
  p_role_name VARCHAR DEFAULT 'Developer',
  p_department VARCHAR DEFAULT 'Engineering'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_code VARCHAR(100);
BEGIN
  v_code := 'mem_' || substr(md5(random()::text), 1, 12);
  INSERT INTO public.enterprise_team_members (
    member_code, full_name, email, role_name, department, status, last_active, mfa_enabled, sso_provider
  )
  VALUES (
    v_code, p_full_name, p_email, p_role_name, p_department, 'Pending', '-', TRUE, 'SAML'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- STORED PROCEDURE TO UPDATE TEAM MEMBER
CREATE OR REPLACE FUNCTION public.fn_update_team_member(
  p_id UUID,
  p_full_name VARCHAR,
  p_email VARCHAR,
  p_role_name VARCHAR,
  p_department VARCHAR,
  p_status VARCHAR,
  p_mfa_enabled BOOLEAN DEFAULT TRUE,
  p_avatar_url VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.enterprise_team_members
  SET full_name = COALESCE(p_full_name, full_name),
      email = COALESCE(p_email, email),
      role_name = COALESCE(p_role_name, role_name),
      department = COALESCE(p_department, department),
      status = COALESCE(p_status, status),
      mfa_enabled = COALESCE(p_mfa_enabled, mfa_enabled),
      avatar_url = COALESCE(p_avatar_url, avatar_url),
      updated_at = NOW()
  WHERE id = p_id;
  RETURN FOUND;
END;
$$;

-- STORED PROCEDURE TO DELETE TEAM MEMBER
CREATE OR REPLACE FUNCTION public.fn_delete_team_member(
  p_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.enterprise_team_members WHERE id = p_id;
  RETURN FOUND;
END;
$$;

-- STORED PROCEDURE TO CREATE CUSTOM ROLE
CREATE OR REPLACE FUNCTION public.fn_create_custom_role(
  p_name VARCHAR,
  p_description TEXT DEFAULT 'Custom enterprise role'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_code VARCHAR(100);
BEGIN
  v_code := 'role_' || lower(regexp_replace(p_name, '[^a-zA-Z0-9]', '_', 'g'));
  INSERT INTO public.enterprise_roles (
    role_code, name, role_type, description, assigned_users_count, permissions_count_label, created_date_label, last_updated_label
  )
  VALUES (
    v_code, p_name, 'Custom', p_description, 0, '24', TO_CHAR(NOW(), 'Mon DD, YYYY'), TO_CHAR(NOW(), 'Mon DD, YYYY')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- STORED PROCEDURE TO UPDATE CUSTOM ROLE
CREATE OR REPLACE FUNCTION public.fn_update_custom_role(
  p_id UUID,
  p_name VARCHAR,
  p_description TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.enterprise_roles
  SET name = COALESCE(p_name, name),
      description = COALESCE(p_description, description),
      last_updated_label = TO_CHAR(NOW(), 'Mon DD, YYYY')
  WHERE id = p_id;
  RETURN FOUND;
END;
$$;

-- STORED PROCEDURE TO DELETE CUSTOM ROLE
CREATE OR REPLACE FUNCTION public.fn_delete_custom_role(
  p_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.enterprise_roles WHERE id = p_id AND role_type = 'Custom';
  RETURN FOUND;
END;
$$;

-- STORED PROCEDURE TO TOGGLE PERMISSION
CREATE OR REPLACE FUNCTION public.fn_toggle_permission(
  p_id UUID,
  p_role_column VARCHAR,
  p_value BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_role_column = 'enterprise_admin' THEN
    UPDATE public.enterprise_permissions SET allow_enterprise_admin = p_value WHERE id = p_id;
  ELSIF p_role_column = 'admin' THEN
    UPDATE public.enterprise_permissions SET allow_admin = p_value WHERE id = p_id;
  ELSIF p_role_column = 'developer' THEN
    UPDATE public.enterprise_permissions SET allow_developer = p_value WHERE id = p_id;
  ELSIF p_role_column = 'analyst' THEN
    UPDATE public.enterprise_permissions SET allow_analyst = p_value WHERE id = p_id;
  ELSIF p_role_column = 'viewer' THEN
    UPDATE public.enterprise_permissions SET allow_viewer = p_value WHERE id = p_id;
  END IF;
  RETURN FOUND;
END;
$$;

-- STORED PROCEDURE TO CREATE PERMISSION
CREATE OR REPLACE FUNCTION public.fn_create_permission(
  p_permission_code VARCHAR,
  p_category VARCHAR,
  p_description TEXT,
  p_allow_enterprise_admin BOOLEAN DEFAULT TRUE,
  p_allow_admin BOOLEAN DEFAULT TRUE,
  p_allow_developer BOOLEAN DEFAULT FALSE,
  p_allow_analyst BOOLEAN DEFAULT FALSE,
  p_allow_viewer BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.enterprise_permissions (
    permission_code, category, description, allow_enterprise_admin, allow_admin, allow_developer, allow_analyst, allow_viewer
  )
  VALUES (
    p_permission_code, p_category, p_description, p_allow_enterprise_admin, p_allow_admin, p_allow_developer, p_allow_analyst, p_allow_viewer
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- SAFE SEED DATA (EXACTLY MATCHING SCREENSHOT)
-- 1. TEAM MEMBERS
INSERT INTO public.enterprise_team_members (member_code, full_name, email, avatar_url, role_name, department, status, last_active, mfa_enabled, sso_provider)
SELECT 'mem_01', 'Danz Assyidq', 'danz@acme.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', 'Enterprise Admin', 'Engineering', 'Active', '2 minutes ago', TRUE, 'SAML'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_team_members WHERE email = 'danz@acme.com');

INSERT INTO public.enterprise_team_members (member_code, full_name, email, avatar_url, role_name, department, status, last_active, mfa_enabled, sso_provider)
SELECT 'mem_02', 'Alsa Dwi Nur H.', 'alsa@acme.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces', 'Admin', 'Operations', 'Active', '18 minutes ago', TRUE, 'SAML'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_team_members WHERE email = 'alsa@acme.com');

INSERT INTO public.enterprise_team_members (member_code, full_name, email, avatar_url, role_name, department, status, last_active, mfa_enabled, sso_provider)
SELECT 'mem_03', 'Faris Ramadhan', 'faris@acme.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', 'Developer', 'Engineering', 'Active', '1 hour ago', TRUE, 'SAML'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_team_members WHERE email = 'faris@acme.com');

INSERT INTO public.enterprise_team_members (member_code, full_name, email, avatar_url, role_name, department, status, last_active, mfa_enabled, sso_provider)
SELECT 'mem_04', 'Siti Aisyah', 'aisyah@acme.com', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces', 'Analyst', 'Analytics', 'Active', '2 hours ago', TRUE, 'SAML'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_team_members WHERE email = 'aisyah@acme.com');

INSERT INTO public.enterprise_team_members (member_code, full_name, email, avatar_url, role_name, department, status, last_active, mfa_enabled, sso_provider)
SELECT 'mem_05', 'Dimas Pratama', 'dimas@acme.com', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces', 'Viewer', 'Finance', 'Active', '1 day ago', TRUE, 'SAML'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_team_members WHERE email = 'dimas@acme.com');

INSERT INTO public.enterprise_team_members (member_code, full_name, email, avatar_url, role_name, department, status, last_active, mfa_enabled, sso_provider)
SELECT 'mem_06', 'Rizky Abdullah', 'rizky@acme.com', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces', 'Developer', 'Engineering', 'Active', '3 days ago', FALSE, 'SAML'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_team_members WHERE email = 'rizky@acme.com');

INSERT INTO public.enterprise_team_members (member_code, full_name, email, avatar_url, role_name, department, status, last_active, mfa_enabled, sso_provider)
SELECT 'mem_07', 'Naufal Hakim', 'naufal@acme.com', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces', 'Viewer', 'Support', 'Pending', '-', FALSE, 'SAML'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_team_members WHERE email = 'naufal@acme.com');

-- 2. ROLES
INSERT INTO public.enterprise_roles (role_code, name, role_type, description, assigned_users_count, permissions_count_label, created_date_label, last_updated_label)
SELECT 'role_ent_admin', 'Enterprise Admin', 'System', 'Full access to all features and settings', 3, 'All', 'Jan 10, 2025', 'May 28, 2025'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_roles WHERE name = 'Enterprise Admin');

INSERT INTO public.enterprise_roles (role_code, name, role_type, description, assigned_users_count, permissions_count_label, created_date_label, last_updated_label)
SELECT 'role_admin', 'Admin', 'System', 'Manage organization, teams, and settings', 7, '128', 'Jan 12, 2025', 'May 28, 2025'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_roles WHERE name = 'Admin');

INSERT INTO public.enterprise_roles (role_code, name, role_type, description, assigned_users_count, permissions_count_label, created_date_label, last_updated_label)
SELECT 'role_developer', 'Developer', 'Custom', 'Build, deploy, and manage AI workflows', 18, '84', 'Jan 18, 2025', 'May 28, 2025'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_roles WHERE name = 'Developer');

INSERT INTO public.enterprise_roles (role_code, name, role_type, description, assigned_users_count, permissions_count_label, created_date_label, last_updated_label)
SELECT 'role_analyst', 'Analyst', 'Custom', 'View analytics, reports, and insights', 9, '42', 'Feb 01, 2025', 'May 28, 2025'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_roles WHERE name = 'Analyst');

INSERT INTO public.enterprise_roles (role_code, name, role_type, description, assigned_users_count, permissions_count_label, created_date_label, last_updated_label)
SELECT 'role_viewer', 'Viewer', 'Custom', 'View-only access to limited resources', 4, '12', 'Feb 15, 2025', 'May 28, 2025'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_roles WHERE name = 'Viewer');

INSERT INTO public.enterprise_roles (role_code, name, role_type, description, assigned_users_count, permissions_count_label, created_date_label, last_updated_label)
SELECT 'role_billing', 'Billing Manager', 'Custom', 'Manage billing, payments, and invoices', 2, '26', 'Mar 01, 2025', 'May 28, 2025'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_roles WHERE name = 'Billing Manager');

-- 3. PERMISSIONS MATRIX (EXACT FROM SCREENSHOT)
INSERT INTO public.enterprise_permissions (permission_code, category, description, allow_enterprise_admin, allow_admin, allow_developer, allow_analyst, allow_viewer)
SELECT 'org.create', 'Organization', 'Create new organizations', TRUE, TRUE, TRUE, FALSE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_permissions WHERE permission_code = 'org.create');

INSERT INTO public.enterprise_permissions (permission_code, category, description, allow_enterprise_admin, allow_admin, allow_developer, allow_analyst, allow_viewer)
SELECT 'org.manage', 'Organization', 'Manage organization settings', TRUE, TRUE, FALSE, FALSE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_permissions WHERE permission_code = 'org.manage');

INSERT INTO public.enterprise_permissions (permission_code, category, description, allow_enterprise_admin, allow_admin, allow_developer, allow_analyst, allow_viewer)
SELECT 'org.delete', 'Organization', 'Delete organizations', TRUE, FALSE, FALSE, FALSE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_permissions WHERE permission_code = 'org.delete');

INSERT INTO public.enterprise_permissions (permission_code, category, description, allow_enterprise_admin, allow_admin, allow_developer, allow_analyst, allow_viewer)
SELECT 'member.invite', 'Members & Teams', 'Invite new team members', TRUE, TRUE, TRUE, FALSE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_permissions WHERE permission_code = 'member.invite');

INSERT INTO public.enterprise_permissions (permission_code, category, description, allow_enterprise_admin, allow_admin, allow_developer, allow_analyst, allow_viewer)
SELECT 'member.manage', 'Members & Teams', 'Manage team members', TRUE, TRUE, FALSE, FALSE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_permissions WHERE permission_code = 'member.manage');

INSERT INTO public.enterprise_permissions (permission_code, category, description, allow_enterprise_admin, allow_admin, allow_developer, allow_analyst, allow_viewer)
SELECT 'member.remove', 'Members & Teams', 'Remove team members', TRUE, TRUE, FALSE, FALSE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_permissions WHERE permission_code = 'member.remove');

INSERT INTO public.enterprise_permissions (permission_code, category, description, allow_enterprise_admin, allow_admin, allow_developer, allow_analyst, allow_viewer)
SELECT 'project.create', 'Projects', 'Create new projects', TRUE, TRUE, TRUE, FALSE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_permissions WHERE permission_code = 'project.create');

INSERT INTO public.enterprise_permissions (permission_code, category, description, allow_enterprise_admin, allow_admin, allow_developer, allow_analyst, allow_viewer)
SELECT 'project.manage', 'Projects', 'Manage project settings', TRUE, TRUE, TRUE, FALSE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_permissions WHERE permission_code = 'project.manage');

INSERT INTO public.enterprise_permissions (permission_code, category, description, allow_enterprise_admin, allow_admin, allow_developer, allow_analyst, allow_viewer)
SELECT 'project.delete', 'Projects', 'Delete projects', TRUE, TRUE, FALSE, FALSE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_permissions WHERE permission_code = 'project.delete');

INSERT INTO public.enterprise_permissions (permission_code, category, description, allow_enterprise_admin, allow_admin, allow_developer, allow_analyst, allow_viewer)
SELECT 'agent.create', 'AI Agents', 'Create AI agents', TRUE, TRUE, TRUE, FALSE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_permissions WHERE permission_code = 'agent.create');

-- SUPABASE REALTIME PUBLICATION
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'publication_enterprise_teams_roles_realtime') THEN
    CREATE PUBLICATION publication_enterprise_teams_roles_realtime FOR TABLE
      public.enterprise_team_members,
      public.enterprise_roles,
      public.enterprise_permissions;
  END IF;
END $$;

