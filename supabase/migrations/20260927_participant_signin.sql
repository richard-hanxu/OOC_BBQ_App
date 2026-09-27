-- Existing projects: run in Supabase SQL Editor before deploying sign-in.
-- This transaction refuses existing duplicates; it never deletes attendees.
begin;

create or replace function public.party_phone_key(value text)
returns text language sql immutable strict parallel safe
set search_path = public
as $$
  select case when length(digits) = 11 and left(digits, 1) = '1'
    then substring(digits from 2) else digits end
  from (select regexp_replace(value, '[^0-9]', '', 'g') as digits) normalized;
$$;

lock table public.participants in share row exclusive mode;
do $$
begin
  if exists (select 1 from public.participants group by lower(btrim(email)) having count(*) > 1)
    or exists (select 1 from public.participants group by public.party_phone_key(phone) having count(*) > 1) then
    raise exception 'Duplicate attendee email or phone found. Export and resolve duplicates before rerunning this migration. No attendees were changed.';
  end if;
end $$;

create unique index if not exists participants_email_unique on public.participants (lower(btrim(email)));
create unique index if not exists participants_phone_unique on public.participants (public.party_phone_key(phone));

create table if not exists public.participant_signin_attempts (
  email_hash text primary key,
  attempts integer not null,
  started_at timestamptz not null
);
alter table public.participant_signin_attempts enable row level security;
revoke all on public.participant_signin_attempts from anon, authenticated;
grant all on public.participant_signin_attempts to service_role;

create or replace function public.recover_party_participant(p_phone text, p_email text, p_token_hash text)
returns uuid language plpgsql security invoker
set search_path = public
as $$
declare
  attempt_count integer;
  recovered_id uuid;
begin
  -- Durable, shared limit: ten attempts per email in fifteen minutes.
  delete from public.participant_signin_attempts where started_at < now() - interval '1 day';
  insert into public.participant_signin_attempts (email_hash, attempts, started_at)
    values (md5(lower(btrim(p_email))), 1, now())
  on conflict (email_hash) do update set
    attempts = case when participant_signin_attempts.started_at < now() - interval '15 minutes'
      then 1 else participant_signin_attempts.attempts + 1 end,
    started_at = case when participant_signin_attempts.started_at < now() - interval '15 minutes'
      then now() else participant_signin_attempts.started_at end
  returning attempts into attempt_count;
  if attempt_count > 10 then raise exception 'signin_rate_limited'; end if;

  update public.participants set token_hash = p_token_hash
    where lower(btrim(email)) = lower(btrim(p_email))
      and public.party_phone_key(phone) = public.party_phone_key(p_phone)
      and is_seed = false
    returning id into recovered_id;
  return recovered_id;
end;
$$;
revoke all on function public.recover_party_participant(text, text, text) from public, anon, authenticated;
grant execute on function public.recover_party_participant(text, text, text) to service_role;

commit;
