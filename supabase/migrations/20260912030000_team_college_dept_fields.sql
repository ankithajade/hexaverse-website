-- Migration: Add college to teams and dept to team_members
-- Date: 2026-09-12

ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS college text;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS dept text;
