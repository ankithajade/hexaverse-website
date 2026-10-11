-- Gmail ignores dots (and +tags) in the local part, so a.b@gmail.com == ab@gmail.com.
-- MUST stay identical to normalizeEmail() in create-registration/index.ts.
create or replace function public.normalize_email(p text) returns text
language sql immutable as $$
  select case
    when p is null then null
    when split_part(lower(trim(p)), '@', 2) in ('gmail.com', 'googlemail.com')
      then replace(split_part(split_part(lower(trim(p)), '@', 1), '+', 1), '.', '') || '@gmail.com'
    else lower(trim(p))
  end
$$;

-- Generated columns: always correct for every writer (edge function, admin edits, admin add),
-- computed for existing rows automatically, and they fire no triggers.
alter table public.workshop_registrations
  add column if not exists email_normalized text
  generated always as (public.normalize_email(email)) stored;

alter table public.team_members
  add column if not exists email_normalized text
  generated always as (public.normalize_email(email)) stored;

create index if not exists idx_workshop_reg_email_norm
  on public.workshop_registrations (event_slug, email_normalized);
create index if not exists idx_team_members_email_norm
  on public.team_members (email_normalized);

-- Where did each registration come from?
alter table public.workshop_registrations
  add column if not exists client_ip text,
  add column if not exists user_agent text;
alter table public.teams
  add column if not exists client_ip text,
  add column if not exists user_agent text;

-- Attempt log: distinguish raw requests from completed submissions
alter table public.registration_attempts
  add column if not exists user_agent text,
  add column if not exists event_slug text,
  add column if not exists kind text not null default 'attempt';

create index if not exists idx_reg_attempts_kind_ip_time
  on public.registration_attempts (kind, ip_address, created_at);
create index if not exists idx_reg_attempts_kind_event_time
  on public.registration_attempts (kind, event_slug, created_at);

-- Atomic slot claim. A single advisory lock makes "count then insert" one indivisible step,
-- so 50 parallel requests can't all see "0 so far" and all get through.
create or replace function public.claim_registration_slot(
  p_ip text,
  p_ua text,
  p_event_slug text,
  p_ip_max int,
  p_ip_window_minutes int,
  p_event_max int,
  p_event_window_seconds int
) returns text
language plpgsql
as $$
declare
  v_ip_count int;
  v_event_count int;
begin
  perform pg_advisory_xact_lock(hashtext('claim_registration_slot'));

  select count(*) into v_ip_count
    from public.registration_attempts
   where kind = 'registration'
     and ip_address = p_ip
     and created_at > now() - make_interval(mins => p_ip_window_minutes);
  if v_ip_count >= p_ip_max then
    return 'ip_limit';
  end if;

  select count(*) into v_event_count
    from public.registration_attempts
   where kind = 'registration'
     and event_slug = p_event_slug
     and created_at > now() - make_interval(secs => p_event_window_seconds);
  if v_event_count >= p_event_max then
    return 'event_burst';
  end if;

  insert into public.registration_attempts (ip_address, user_agent, event_slug, kind)
  values (p_ip, p_ua, p_event_slug, 'registration');
  return 'ok';
end;
$$;

-- Only the Edge Function (service role) may call it — never the public API.
revoke all on function public.claim_registration_slot(text, text, text, int, int, int, int)
  from public, anon, authenticated;
grant execute on function public.claim_registration_slot(text, text, text, int, int, int, int)
  to service_role;
