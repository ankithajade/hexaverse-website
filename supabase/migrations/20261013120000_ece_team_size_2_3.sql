-- ECE signature event: team size 2–3 (was 3–4)
UPDATE public.events
   SET team_min = 2, team_max = 3
 WHERE slug = 'ece-event';

-- IMPORTANT: the existing trigger re-validates team_size on EVERY update of a team row.
-- After this change, any already-registered ECE team with 4 members would make ANY update
-- to that row fail — including the Cashfree webhook marking a payment as successful, and
-- admin edits. Only validate when a team is created or its size actually changes.
CREATE OR REPLACE FUNCTION public.fn_check_team_size()
RETURNS TRIGGER AS $$
DECLARE
  v_min int;
  v_max int;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.team_size IS NOT DISTINCT FROM OLD.team_size THEN
    RETURN NEW;
  END IF;

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
