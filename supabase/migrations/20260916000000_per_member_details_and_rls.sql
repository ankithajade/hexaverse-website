-- Migration: 20260916000000_per_member_details_and_rls.sql
-- Description:
-- 1. Adds per-member academic columns to team_members (semester, section, cycle).
-- 2. Ensures team_members.usn is nullable for Semester 1 registrants.
-- 3. Updates fn_check_team_member trigger to safely ignore null/empty USNs.
-- 4. Updates events table for treasure-hunt (team_min = 3, team_max = 3, fee_per_head = 80).
-- 5. Drops anonymous INSERT policies so all public registrations must go through create-registration Edge Function.

-- 1. Schema updates on public.team_members
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS semester int;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS section text;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS cycle text;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS dept text;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS roll_number text;
ALTER TABLE public.team_members ALTER COLUMN usn DROP NOT NULL;

-- 2. Update fn_check_team_member trigger function
CREATE OR REPLACE FUNCTION public.fn_check_team_member()
RETURNS TRIGGER AS $$
DECLARE
  v_event_slug text;
  v_duplicate_count int;
BEGIN
  IF NEW.usn IS NOT NULL AND trim(NEW.usn) != '' THEN
    SELECT event_slug INTO v_event_slug FROM public.teams WHERE id = NEW.team_id;

    -- Check if this USN exists in another team for the same event
    SELECT COUNT(*) INTO v_duplicate_count
    FROM public.team_members tm
    JOIN public.teams t ON tm.team_id = t.id
    WHERE t.event_slug = v_event_slug
      AND lower(tm.usn) = lower(trim(NEW.usn))
      AND tm.team_id != NEW.team_id;

    IF v_duplicate_count > 0 THEN
      RAISE EXCEPTION 'USN % is already registered in another team for event %', NEW.usn, v_event_slug;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Update events table for Treasure Hunt (exactly 3 participants, ₹80/head = ₹240 total)
UPDATE public.events
SET team_min = 3, team_max = 3, fee_per_head = 80
WHERE slug = 'treasure-hunt';

-- 4. Row Level Security: Remove anonymous INSERT policies
DROP POLICY IF EXISTS "Anon workshop insert" ON public.workshop_registrations;
DROP POLICY IF EXISTS "Anon teams insert" ON public.teams;
DROP POLICY IF EXISTS "Anon team_members insert" ON public.team_members;
