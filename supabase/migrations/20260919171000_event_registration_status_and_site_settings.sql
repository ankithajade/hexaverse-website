-- Migration: Event registration status, status changed timestamps, and site_settings global maintenance override

-- ============================================================================
-- 1. EVENTS TABLE ENHANCEMENTS
-- ============================================================================

-- Add registration_status column with constraint
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS registration_status text NOT NULL DEFAULT 'open'
CHECK (registration_status IN ('open', 'paused', 'closed'));

-- Add status_changed_at column
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS status_changed_at timestamptz NOT NULL DEFAULT now();

-- Backfill registration_status based on existing is_open values
UPDATE public.events
SET registration_status = CASE
  WHEN is_open = true THEN 'open'
  ELSE 'closed'
END;

-- Function: update status_changed_at automatically when registration_status changes
CREATE OR REPLACE FUNCTION public.fn_events_update_status_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.registration_status IS DISTINCT FROM OLD.registration_status THEN
    NEW.status_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on events table
DROP TRIGGER IF EXISTS trg_events_status_changed_at ON public.events;
CREATE TRIGGER trg_events_status_changed_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.fn_events_update_status_changed_at();


-- ============================================================================
-- 2. SITE_SETTINGS TABLE (Global Override / Maintenance Mode)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  global_override text NOT NULL DEFAULT 'none' CHECK (global_override IN ('none', 'paused', 'closed')),
  global_status_changed_at timestamptz NOT NULL DEFAULT now()
);

-- Function: update global_status_changed_at on global_override changes
CREATE OR REPLACE FUNCTION public.fn_site_settings_update_status_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.global_override IS DISTINCT FROM OLD.global_override THEN
    NEW.global_status_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on site_settings table
DROP TRIGGER IF EXISTS trg_site_settings_status_changed_at ON public.site_settings;
CREATE TRIGGER trg_site_settings_status_changed_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.fn_site_settings_update_status_changed_at();

-- Seed single row
INSERT INTO public.site_settings (id, global_override, global_status_changed_at)
VALUES (1, 'none', now())
ON CONFLICT (id) DO NOTHING;

-- RLS: site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public site_settings select" ON public.site_settings;
CREATE POLICY "Public site_settings select" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin site_settings write" ON public.site_settings;
CREATE POLICY "Admin site_settings write" ON public.site_settings FOR ALL USING (public.is_admin());
