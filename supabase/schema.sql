-- Pool Party Personality — Supabase schema
-- Run once in the Supabase SQL editor. The app talks to these tables with the
-- service-role key from the server only; RLS stays on with no anon policies so
-- nothing is readable publicly.

create extension if not exists pgcrypto;

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null,
  brought_items text check (char_length(brought_items) <= 500),
  undergraduate_university text,
  graduate_university text,
  cmu_program text,
  avatar_type text,
  quiz_completed_at timestamptz,
  is_seed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists answers (
  participant_id uuid not null references participants(id) on delete cascade,
  question_id text not null,
  normalized_value real not null check (normalized_value >= 0 and normalized_value <= 100),
  display_value text not null,
  primary key (participant_id, question_id)
);

create index if not exists answers_participant_idx on answers(participant_id);

alter table participants enable row level security;
alter table answers enable row level security;

-- Run this migration once on an existing Supabase project.
-- Old profiles keep their existing guest-visible contact setting.
alter table public.participants add column if not exists contact_visibility text not null default 'guests'
  check (contact_visibility in ('guests', 'organizers'));

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  closed boolean not null default false,
  options jsonb not null default '[]'::jsonb
    check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) in (0, 2, 3, 4))
);

create table if not exists public.announcement_votes (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  option_id text not null,
  primary key (announcement_id, participant_id)
);
alter table public.announcements enable row level security;
alter table public.announcement_votes enable row level security;

-- Lock the poll while validating and upserting so closing a poll cannot race a vote.
create or replace function public.cast_announcement_vote(
  p_announcement_id uuid, p_participant_id uuid, p_option_id text
) returns text language plpgsql security invoker set search_path = public, pg_temp as $$
declare poll public.announcements%rowtype;
begin
  select * into poll from public.announcements where id = p_announcement_id for update;
  if not found then return 'not-found'; end if;
  if not exists (select 1 from public.participants where id = p_participant_id) then return 'not-found'; end if;
  if poll.closed then return 'closed'; end if;
  if not exists (select 1 from jsonb_array_elements(poll.options) as item where item->>'id' = p_option_id)
    then return 'invalid-option'; end if;
  insert into public.announcement_votes (announcement_id, participant_id, option_id)
    values (p_announcement_id, p_participant_id, p_option_id)
    on conflict (announcement_id, participant_id) do update set option_id = excluded.option_id;
  return 'ok';
end;
$$;
revoke all on function public.cast_announcement_vote(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.cast_announcement_vote(uuid, uuid, text) to service_role;
