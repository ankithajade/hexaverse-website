-- Migration: Update AIML signature event to individual event (min 1, max 1, is_team = false)
UPDATE public.events 
SET is_team = false, team_min = 1, team_max = 1 
WHERE slug = 'aiml-event';
