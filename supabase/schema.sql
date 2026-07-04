create extension if not exists "pgcrypto";

create type public.member_role as enum ('owner', 'manager', 'admin');
create type public.member_status as enum ('pending', 'active', 'suspended');
create type public.comment_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  salon_name text,
  role public.member_role not null default 'owner',
  status public.member_status not null default 'pending',
  pdpa_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.authorized_locations (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  radius_meters integer not null check (radius_meters > 0),
  created_at timestamptz not null default now()
);

create table public.hairdressers (
  id uuid primary key default gen_random_uuid(),
  trustcut_id text not null unique,
  first_name text not null,
  last_name text not null,
  nick_name text,
  hometown_address text,
  current_address text,
  phone text,
  email text,
  line_id text,
  instagram text,
  social_media jsonb not null default '[]'::jsonb,
  years_experience integer not null default 0,
  specialties text[] not null default '{}',
  work_history text[] not null default '{}',
  certificates text[] not null default '{}',
  competency_scores jsonb not null default '[]'::jsonb,
  aptitude_scores jsonb not null default '[]'::jsonb,
  behavior_score integer not null default 0 check (behavior_score between 0 and 100),
  reliability_score integer not null default 0 check (reliability_score between 0 and 100),
  pdpa_accepted_at timestamptz,
  last_verified_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(trustcut_id, '') || ' ' ||
      coalesce(first_name, '') || ' ' ||
      coalesce(last_name, '') || ' ' ||
      coalesce(nick_name, '') || ' ' ||
      coalesce(phone, '') || ' ' ||
      coalesce(email, '') || ' ' ||
      coalesce(line_id, '') || ' ' ||
      coalesce(instagram, '')
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hairdresser_photos (
  id uuid primary key default gen_random_uuid(),
  hairdresser_id uuid not null references public.hairdressers(id) on delete cascade,
  image_url text not null,
  kind text not null check (kind in ('profile', 'id_photo', 'portfolio')),
  created_at timestamptz not null default now()
);

create table public.pdpa_consents (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('member', 'hairdresser')),
  subject_id uuid not null,
  consent_version text not null,
  accepted_at timestamptz not null default now(),
  ip_address inet,
  user_agent text
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  hairdresser_id uuid not null references public.hairdressers(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(body) between 3 and 2000),
  rating integer not null check (rating between 1 and 5),
  status public.comment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hair_style_posts (
  id uuid primary key default gen_random_uuid(),
  hairdresser_id uuid not null references public.hairdressers(id) on delete cascade,
  member_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  image_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index hairdressers_search_idx on public.hairdressers using gin (search_vector);
create index comments_status_idx on public.comments (status, created_at desc);
create index usage_events_name_created_idx on public.usage_events (event_name, created_at desc);

create or replace function public.current_profile_role()
returns public.member_role
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and status = 'active'
$$;

create or replace function public.current_profile_is_active()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and status = 'active'
  )
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger hairdressers_touch_updated_at
before update on public.hairdressers
for each row execute function public.touch_updated_at();

create trigger comments_touch_updated_at
before update on public.comments
for each row execute function public.touch_updated_at();

create trigger hair_style_posts_touch_updated_at
before update on public.hair_style_posts
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.authorized_locations enable row level security;
alter table public.hairdressers enable row level security;
alter table public.hairdresser_photos enable row level security;
alter table public.pdpa_consents enable row level security;
alter table public.comments enable row level security;
alter table public.hair_style_posts enable row level security;
alter table public.usage_events enable row level security;

create policy "profiles self select"
on public.profiles for select
using (id = auth.uid() or public.current_profile_role() = 'admin');

create policy "profiles self update"
on public.profiles for update
using (id = auth.uid() or public.current_profile_role() = 'admin')
with check (id = auth.uid() or public.current_profile_role() = 'admin');

create policy "admin profiles insert"
on public.profiles for insert
with check (public.current_profile_role() = 'admin');

create policy "locations owner or admin select"
on public.authorized_locations for select
using (member_id = auth.uid() or public.current_profile_role() = 'admin');

create policy "admin manage locations"
on public.authorized_locations for all
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

create policy "active members read hairdressers"
on public.hairdressers for select
using (public.current_profile_is_active());

create policy "admin manage hairdressers"
on public.hairdressers for all
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

create policy "active members read photos"
on public.hairdresser_photos for select
using (public.current_profile_is_active());

create policy "admin manage photos"
on public.hairdresser_photos for all
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

create policy "active members read approved comments"
on public.comments for select
using (
  public.current_profile_role() = 'admin'
  or (public.current_profile_is_active() and status = 'approved')
  or author_id = auth.uid()
);

create policy "active members create pending comments"
on public.comments for insert
with check (
  public.current_profile_is_active()
  and author_id = auth.uid()
  and status = 'pending'
);

create policy "admin moderate comments"
on public.comments for update
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

create policy "active members read styles"
on public.hair_style_posts for select
using (public.current_profile_is_active());

create policy "active members post styles"
on public.hair_style_posts for insert
with check (public.current_profile_is_active() and member_id = auth.uid());

create policy "admin manage styles"
on public.hair_style_posts for all
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

create policy "consent owner or admin read"
on public.pdpa_consents for select
using (subject_id = auth.uid() or public.current_profile_role() = 'admin');

create policy "authenticated users record own consent"
on public.pdpa_consents for insert
with check (subject_id = auth.uid() or public.current_profile_role() = 'admin');

create policy "active members insert usage"
on public.usage_events for insert
with check (public.current_profile_is_active() or member_id is null);

create policy "admin read usage"
on public.usage_events for select
using (public.current_profile_role() = 'admin');
