create extension if not exists pgcrypto with schema extensions;

create table if not exists public.email_otps (
  id uuid primary key,
  email_normalized text not null,
  email text not null,
  code_hash text not null,
  attempts int not null default 0,
  expires_at timestamptz not null,             -- code validity (10 min)
  verified_at timestamptz,
  token_hash text,                             -- sha256 of the verification token
  token_expires_at timestamptz,                -- 30 min after verification
  uses_remaining int not null default 0,       -- how many registrations the token may be used for
  client_ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_otps_email_time on public.email_otps (email_normalized, created_at desc);
create index if not exists idx_email_otps_ip_time on public.email_otps (client_ip, created_at);
create index if not exists idx_email_otps_token on public.email_otps (token_hash) where token_hash is not null;

alter table public.email_otps enable row level security;
-- Intentionally NO policies: only Edge Functions (service role) touch this table.

-- Create a code. One advisory lock makes the limit checks + insert atomic, so parallel
-- requests can't all slip past the counts (this endpoint can be abused to spam inboxes).
create or replace function public.create_email_otp(
  p_id uuid, p_email_norm text, p_email text, p_code text, p_ip text, p_ua text,
  p_cooldown_seconds int, p_email_max int, p_email_window_minutes int,
  p_ip_max int, p_ip_window_minutes int, p_global_max int
) returns text
language plpgsql
set search_path = public, extensions
as $$
begin
  perform pg_advisory_xact_lock(hashtext('create_email_otp'));

  if exists (select 1 from public.email_otps
              where email_normalized = p_email_norm
                and created_at > now() - make_interval(secs => p_cooldown_seconds)) then
    return 'cooldown';
  end if;

  if (select count(*) from public.email_otps
       where email_normalized = p_email_norm
         and created_at > now() - make_interval(mins => p_email_window_minutes)) >= p_email_max then
    return 'email_limit';
  end if;

  if p_ip <> 'unknown' and (select count(*) from public.email_otps
       where client_ip = p_ip
         and created_at > now() - make_interval(mins => p_ip_window_minutes)) >= p_ip_max then
    return 'ip_limit';
  end if;

  -- Protects the sending mailbox's daily quota
  if (select count(*) from public.email_otps
       where created_at > now() - interval '24 hours') >= p_global_max then
    return 'global_limit';
  end if;

  -- Only the newest code works: expire older unverified codes for this email
  update public.email_otps set expires_at = now()
   where email_normalized = p_email_norm and verified_at is null and expires_at > now();

  insert into public.email_otps (id, email_normalized, email, code_hash, expires_at, client_ip, user_agent)
  values (p_id, p_email_norm, p_email,
          encode(digest(p_id::text || ':' || p_code, 'sha256'), 'hex'),
          now() + interval '10 minutes', p_ip, p_ua);
  return 'ok';
end;
$$;

-- Check a code. Row lock + atomic attempt counting: parallel guesses can't exceed 5 tries.
create or replace function public.verify_email_otp(
  p_email_norm text, p_code text, p_token_hash text
) returns text
language plpgsql
set search_path = public, extensions
as $$
declare
  v_row public.email_otps%rowtype;
begin
  select * into v_row from public.email_otps
   where email_normalized = p_email_norm and verified_at is null and expires_at > now()
   order by created_at desc limit 1
   for update;

  if not found then return 'no_active_code'; end if;
  if v_row.attempts >= 5 then return 'too_many_attempts'; end if;

  update public.email_otps set attempts = attempts + 1 where id = v_row.id;

  if v_row.code_hash <> encode(digest(v_row.id::text || ':' || p_code, 'sha256'), 'hex') then
    return 'bad_code';
  end if;

  update public.email_otps
     set verified_at = now(),
         token_hash = p_token_hash,
         token_expires_at = now() + interval '30 minutes',
         uses_remaining = 3
   where id = v_row.id;
  return 'ok';
end;
$$;

-- Spend one use of a verification token (single atomic UPDATE).
create or replace function public.consume_email_verification(
  p_token_hash text, p_email_norm text
) returns boolean
language plpgsql
as $$
declare
  v_id uuid;
begin
  update public.email_otps
     set uses_remaining = uses_remaining - 1
   where token_hash = p_token_hash
     and email_normalized = p_email_norm
     and verified_at is not null
     and token_expires_at > now()
     and uses_remaining > 0
  returning id into v_id;
  return v_id is not null;
end;
$$;

-- Only the Edge Functions (service role) may call these — never the public API.
revoke all on function public.create_email_otp(uuid, text, text, text, text, text, int, int, int, int, int, int) from public, anon, authenticated;
revoke all on function public.verify_email_otp(text, text, text) from public, anon, authenticated;
revoke all on function public.consume_email_verification(text, text) from public, anon, authenticated;
grant execute on function public.create_email_otp(uuid, text, text, text, text, text, int, int, int, int, int, int) to service_role;
grant execute on function public.verify_email_otp(text, text, text) to service_role;
grant execute on function public.consume_email_verification(text, text) to service_role;
