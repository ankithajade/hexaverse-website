-- Supabase Schema & Seed Migration for HexaVerse CloudFest '26

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('workshop', 'signature', 'treasure_hunt')),
  department text,
  title text NOT NULL,
  is_team boolean NOT NULL,
  team_min int,
  team_max int,
  fee_per_head numeric NOT NULL DEFAULT 0,
  is_open boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Payments table (created prior to teams FK)
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_type text NOT NULL CHECK (registration_type IN ('workshop', 'team')),
  registration_id uuid NOT NULL,
  amount_expected numeric NOT NULL,
  amount_paid numeric,
  currency text DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'pending', 'success', 'failed', 'refunded')),
  gateway text,
  gateway_order_id text,
  gateway_payment_id text UNIQUE,
  gateway_signature text,
  raw_webhook_payload jsonb,
  created_at timestamptz DEFAULT now(),
  verified_at timestamptz
);

-- Workshop registrations table (free workshops)
CREATE TABLE IF NOT EXISTS public.workshop_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug text NOT NULL REFERENCES public.events(slug),
  name text NOT NULL,
  semester int NOT NULL CHECK (semester IN (1, 3, 5, 7)),
  usn text,
  email text NOT NULL,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes / Unique constraints for workshop registrations
CREATE UNIQUE INDEX IF NOT EXISTS idx_workshop_usn ON public.workshop_registrations (event_slug, usn) WHERE usn IS NOT NULL AND usn != '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_workshop_email ON public.workshop_registrations (event_slug, lower(email));

-- Teams table (signature events + treasure hunt)
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug text NOT NULL REFERENCES public.events(slug),
  team_name text NOT NULL,
  team_name_norm text GENERATED ALWAYS AS (lower(trim(team_name))) STORED,
  team_size int NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
  payment_ref uuid REFERENCES public.payments(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uq_team_name_per_event UNIQUE (event_slug, team_name_norm)
);

-- Team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  is_lead boolean NOT NULL DEFAULT false,
  name text NOT NULL,
  usn text NOT NULL,
  email text,
  phone text,
  position int NOT NULL,
  CONSTRAINT uq_team_position UNIQUE (team_id, position)
);

-- Admin allowlist table
CREATE TABLE IF NOT EXISTS public.admin_users (
  email text PRIMARY KEY,
  role text NOT NULL DEFAULT 'admin'
);

-- Admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  before jsonb,
  after jsonb,
  reason text,
  created_at timestamptz DEFAULT now()
);


-- ============================================================================
-- 2. SEED DATA (13 events)
-- ============================================================================

INSERT INTO public.events (slug, event_type, department, title, is_team, team_min, team_max, fee_per_head, is_open)
VALUES
  -- Free Workshops (Individual, fee = 0)
  ('aiml-workshop',  'workshop', 'aiml', 'AI & ML Workshop',        false, NULL, NULL, 0, true),
  ('aids-workshop',  'workshop', 'aids', 'AI & DS Workshop',        false, NULL, NULL, 0, true),
  ('cse-workshop',   'workshop', 'cse',  'CSE Workshop',            false, NULL, NULL, 0, true),
  ('ise-workshop',   'workshop', 'ise',  'ISE Workshop',            false, NULL, NULL, 0, true),
  ('ece-workshop',   'workshop', 'ece',  'ECE Workshop',            false, NULL, NULL, 0, true),
  ('eee-workshop',   'workshop', 'eee',  'EEE Workshop',            false, NULL, NULL, 0, true),

  -- Signature Events (Team, fee = ₹50/head, team bounds per spec)
  ('aiml-event',     'signature', 'aiml', 'AI & ML Signature Event', false, 1,    2,    50, true), -- Note: min 1, max 2
  ('aids-event',     'signature', 'aids', 'AI & DS Signature Event', true,  2,    3,    50, true),
  ('cse-event',      'signature', 'cse',  'CSE Signature Event',   true,  2,    3,    50, true),
  ('ise-event',      'signature', 'ise',  'ISE Signature Event',   true,  2,    3,    50, true),
  ('ece-event',      'signature', 'ece',  'ECE Signature Event',   true,  2,    4,    50, true), -- min 3, max 4 (updated per spec in trigger logic below)
  ('eee-event',      'signature', 'eee',  'EEE Signature Event',   true,  2,    4,    50, true),

  -- Standalone Mega Event
  ('treasure-hunt',  'treasure_hunt', NULL, 'Treasure Hunt',         true,  2,    3,    80, true)
ON CONFLICT (slug) DO UPDATE SET
  event_type = EXCLUDED.event_type,
  department = EXCLUDED.department,
  title = EXCLUDED.title,
  is_team = EXCLUDED.is_team,
  team_min = EXCLUDED.team_min,
  team_max = EXCLUDED.team_max,
  fee_per_head = EXCLUDED.fee_per_head,
  is_open = EXCLUDED.is_open;

-- Update ECE signature event team bounds per spec (min 3, max 4)
UPDATE public.events SET team_min = 3, team_max = 4 WHERE slug = 'ece-event';


-- ============================================================================
-- 3. TRIGGERS & CONSTRAINTS
-- ============================================================================

-- Function: Validate USN format on workshop registrations (only if semester in 3, 5, 7)
-- NOTE: The (23|24|25) year range is fest-specific and will need updating in future years.
CREATE OR REPLACE FUNCTION public.fn_check_workshop_usn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.semester IN (3, 5, 7) THEN
    IF NEW.usn IS NULL OR NEW.usn = '' THEN
      RAISE EXCEPTION 'USN is required for Semester %', NEW.semester;
    END IF;
    IF NOT (NEW.usn ~* '^1DB(23|24|25)(CS|IS|AD|CI|EC|EE)(00[1-9]|0[1-9]\d|[1-9]\d{2})$') THEN
      RAISE EXCEPTION 'Invalid USN format for Semester %: %', NEW.semester, NEW.usn;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_check_workshop_usn
  BEFORE INSERT OR UPDATE ON public.workshop_registrations
  FOR EACH ROW EXECUTE FUNCTION public.fn_check_workshop_usn();

-- Function: Validate team size against event bounds before insert/update on teams
CREATE OR REPLACE FUNCTION public.fn_check_team_size()
RETURNS TRIGGER AS $$
DECLARE
  v_min int;
  v_max int;
BEGIN
  SELECT team_min, team_max INTO v_min, v_max
  FROM public.events
  WHERE slug = NEW.event_slug;

  IF FOUND THEN
    IF v_min IS NOT NULL AND NEW.team_size < v_min THEN
      RAISE EXCEPTION 'Team size % is below minimum allowed (% for event %)', NEW.team_size, v_min, NEW.event_slug;
    END IF;
    IF v_max IS NOT NULL AND NEW.team_size > v_max THEN
      RAISE EXCEPTION 'Team size % exceeds maximum allowed (% for event %)', NEW.team_size, v_max, NEW.event_slug;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_check_team_size
  BEFORE INSERT OR UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.fn_check_team_size();

-- Function: Validate team member insert/update:
-- (a) Ensure duplicate USNs are not registered across teams for the SAME event
CREATE OR REPLACE FUNCTION public.fn_check_team_member()
RETURNS TRIGGER AS $$
DECLARE
  v_event_slug text;
  v_duplicate_count int;
BEGIN
  SELECT event_slug INTO v_event_slug FROM public.teams WHERE id = NEW.team_id;

  -- Check if this USN exists in another team for the same event
  SELECT COUNT(*) INTO v_duplicate_count
  FROM public.team_members tm
  JOIN public.teams t ON tm.team_id = t.id
  WHERE t.event_slug = v_event_slug
    AND lower(tm.usn) = lower(NEW.usn)
    AND tm.team_id != NEW.team_id;

  IF v_duplicate_count > 0 THEN
    RAISE EXCEPTION 'USN % is already registered in another team for event %', NEW.usn, v_event_slug;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_check_team_member
  BEFORE INSERT OR UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.fn_check_team_member();


-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current authenticated user is an authorized admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = auth.jwt() ->> 'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: events (Public read, Admin write)
CREATE POLICY "Public events select" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admin events write" ON public.events FOR ALL USING (public.is_admin());

-- RLS: workshop_registrations (Public insert only, Admin full)
CREATE POLICY "Anon workshop insert" ON public.workshop_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin workshop full" ON public.workshop_registrations FOR ALL USING (public.is_admin());

-- RLS: teams (Public insert only, Admin full)
CREATE POLICY "Anon teams insert" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin teams full" ON public.teams FOR ALL USING (public.is_admin());

-- RLS: team_members (Public insert only, Admin full)
CREATE POLICY "Anon team_members insert" ON public.team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin team_members full" ON public.team_members FOR ALL USING (public.is_admin());

-- RLS: payments (No public access, Admin read/full)
CREATE POLICY "Admin payments full" ON public.payments FOR ALL USING (public.is_admin());

-- RLS: admin_users (Admin read)
CREATE POLICY "Admin admin_users select" ON public.admin_users FOR SELECT USING (public.is_admin());

-- RLS: admin_audit_log (Admin write & read)
CREATE POLICY "Admin audit_log full" ON public.admin_audit_log FOR ALL USING (public.is_admin());
