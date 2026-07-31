-- HUBIJAS backend schema: content CMS + works/events collections + admin auth + messages
create extension if not exists pgcrypto;

create table if not exists public.site_content (
  id text primary key,
  published jsonb not null default '{}'::jsonb,
  draft jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  ord int not null default 0,
  title_html text not null default '',
  title_mobile_html text,
  youtube text not null default '',
  image text not null default '',
  video text not null default '',
  poster text,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  ord int not null default 0,
  title text not null default '',
  subtitle_html text not null default '',
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  login text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_sessions (
  token text primary key,
  admin_id uuid not null references public.admins(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  email text not null default '',
  body text not null default '',
  created_at timestamptz not null default now()
);

alter table public.site_content enable row level security;
alter table public.works enable row level security;
alter table public.events enable row level security;
alter table public.admins enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.messages enable row level security;

-- public read of published content and collections
create policy "public read content" on public.site_content for select using (true);
create policy "public read works" on public.works for select using (true);
create policy "public read events" on public.events for select using (true);
-- visitors can send messages, never read them
create policy "public insert messages" on public.messages for insert with check (true);
-- admins/admin_sessions: no policies -> service role only

-- login verification without shipping bcrypt to the edge runtime
create or replace function public.verify_admin(p_login text, p_password text)
returns uuid language sql security definer set search_path = public, extensions as $$
  select id from public.admins
  where login = p_login and password_hash = crypt(p_password, password_hash)
$$;
revoke all on function public.verify_admin from public, anon, authenticated;
