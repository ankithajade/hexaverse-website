CREATE TABLE IF NOT EXISTS public.registration_attempts (
  id bigint generated always as identity primary key,
  ip_address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registration_attempts_ip_time
  ON public.registration_attempts (ip_address, created_at);

ALTER TABLE public.registration_attempts ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: only the service-role key (used by Edge Functions) may touch this table.
