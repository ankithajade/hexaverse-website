-- Migration: Team Short IDs (Race-safe auto-generation)
-- Adds short_id to teams and sets up atomic sequential counter per event prefix

-- 1. Ensure hackathon event exists in events table for FK integrity
INSERT INTO public.events (slug, event_type, department, title, is_team, team_min, team_max, fee_per_head, is_open)
VALUES ('hackathon', 'signature', NULL, 'Hackathon', true, 2, 4, 50, true)
ON CONFLICT (slug) DO UPDATE SET
  is_team = EXCLUDED.is_team,
  team_min = EXCLUDED.team_min,
  team_max = EXCLUDED.team_max,
  fee_per_head = EXCLUDED.fee_per_head,
  is_open = EXCLUDED.is_open;

-- 2. Add short_id column to teams (nullable for existing rows, unique constraint)
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS short_id text UNIQUE;

-- 3. Create counters table to track next number per prefix, race-safe under concurrent inserts
CREATE TABLE IF NOT EXISTS public.team_id_counters (
  prefix text PRIMARY KEY,
  counter int NOT NULL DEFAULT 0
);

ALTER TABLE public.team_id_counters ENABLE ROW LEVEL SECURITY;
-- No public policies — this table is only touched by the SECURITY DEFINER trigger function below.

-- 4. Create trigger function mapping event_slug to prefix and atomically incrementing counter
CREATE OR REPLACE FUNCTION public.assign_team_short_id()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text;
  v_counter int;
BEGIN
  v_prefix := CASE
    WHEN NEW.event_slug LIKE 'aiml-%' THEN 'ml'
    WHEN NEW.event_slug LIKE 'aids-%' THEN 'ds'
    WHEN NEW.event_slug LIKE 'cse-%'  THEN 'cs'
    WHEN NEW.event_slug LIKE 'ise-%'  THEN 'is'
    WHEN NEW.event_slug LIKE 'ece-%'  THEN 'ec'
    WHEN NEW.event_slug LIKE 'eee-%'  THEN 'ee'
    WHEN NEW.event_slug = 'treasure-hunt' THEN 'th'
    WHEN NEW.event_slug = 'hackathon'     THEN 'hk'
    ELSE NULL
  END;

  IF v_prefix IS NULL THEN
    RETURN NEW; -- unknown event_slug: leave short_id null rather than fail the insert
  END IF;

  INSERT INTO public.team_id_counters (prefix, counter)
  VALUES (v_prefix, 1)
  ON CONFLICT (prefix) DO UPDATE SET counter = public.team_id_counters.counter + 1
  RETURNING counter INTO v_counter;

  NEW.short_id := v_prefix || lpad(v_counter::text, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach trigger to teams table
DROP TRIGGER IF EXISTS trg_assign_team_short_id ON public.teams;
CREATE TRIGGER trg_assign_team_short_id
  BEFORE INSERT ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_team_short_id();
