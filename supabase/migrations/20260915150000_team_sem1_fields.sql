-- Migration: Add cycle, selected_dept, and roll_number columns to teams and workshop_registrations
-- Date: 2026-09-15
-- Context: Stores the cycle (Physics/Chemistry), selected department, and roll number
--          for Semester 1 registrants in department-locked events.

ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS cycle text;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS selected_dept text;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS roll_number text;

ALTER TABLE public.workshop_registrations ADD COLUMN IF NOT EXISTS cycle text;
ALTER TABLE public.workshop_registrations ADD COLUMN IF NOT EXISTS selected_dept text;
ALTER TABLE public.workshop_registrations ADD COLUMN IF NOT EXISTS roll_number text;
ALTER TABLE public.workshop_registrations ADD COLUMN IF NOT EXISTS section text;

ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS roll_number text;
ALTER TABLE public.team_members ALTER COLUMN usn DROP NOT NULL;
