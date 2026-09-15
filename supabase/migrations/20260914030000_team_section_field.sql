-- Migration: Add section column to teams
-- Date: 2026-09-14
-- Context: Stores the class section (A/B/C/D) for semester 3/5/7 registrants
--          in department-locked events. NULL for mega events and sem-1 registrations.

ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS section text;
