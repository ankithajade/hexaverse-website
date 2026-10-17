-- EEE signature event: registration fee 52 -> 32 per head
UPDATE public.events
   SET fee_per_head = 32
 WHERE slug = 'eee-event';
