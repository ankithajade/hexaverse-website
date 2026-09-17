-- Migration: Increase registration fees
-- Signature/department events (and hackathon): 50 -> 52 per head
-- Treasure Hunt: 80 -> 82 per head

UPDATE public.events SET fee_per_head = 52 WHERE event_type = 'signature';
UPDATE public.events SET fee_per_head = 82 WHERE event_type = 'treasure_hunt';
