-- Helpforge initial schema (TASK-105).
-- 8 tables, multi-tenant by user_id (or project_id which traces back to user_id).
-- See docs/ai_customer_support_saas.md for the data model rationale.

-- =============================================================================
-- Extensions
-- =============================================================================

create extension if not exists "vector" with schema "extensions";
create extension if not exists "pgcrypto" with schema "extensions"; -- gen_random_uuid

-- =============================================================================
-- profiles
-- =============================================================================
-- One row per auth.users row, created automatically by the trigger below.
-- Holds plan tier and per-user rate-limit counters.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  daily_message_count integer not null default 0,
  daily_count_reset_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profiles row on signup. Without this, every signup needs an
-- application-side call to insert into profiles, which is easy to forget.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- projects
-- =============================================================================

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  brand_color text not null default '#7c3aed', -- violet-600 default
  greeting text not null default 'Hi! How can I help you today?',
  fallback_message text not null default 'I don''t have information about that. Try rephrasing or contact support.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_user_id_idx on public.projects (user_id);

-- =============================================================================
-- sources
-- =============================================================================
-- A "source" is one ingestion unit: a crawled URL (which expands into many
-- pages, all stored as concatenated content), an uploaded PDF, or pasted text.

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  type text not null check (type in ('url', 'pdf', 'text')),
  source_url text, -- URL for type='url', storage path for type='pdf', null for type='text'
  title text not null default 'Untitled source',
  status text not null default 'pending' check (
    status in ('pending', 'crawling', 'chunking', 'embedding', 'ready', 'failed')
  ),
  error_message text,
  char_count integer not null default 0,
  pages_crawled integer not null default 0, -- only meaningful for type='url'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sources_project_id_idx on public.sources (project_id);
create index sources_status_idx on public.sources (status); -- used by progress UI subscriptions

-- =============================================================================
-- chunks
-- =============================================================================
-- Searchable text chunks with their embeddings.
--
-- IMPORTANT: project_id is DENORMALIZED here (it could be derived via sources).
-- Every retrieval query filters by project_id, and joining through sources for
-- vector search hurts latency at scale. Don't "normalize" this column away.

create table public.chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  content text not null,
  embedding extensions.vector (1536), -- text-embedding-3-small dimension; nullable until embedded
  token_count integer not null default 0,
  chunk_index integer not null default 0, -- order within source
  metadata jsonb not null default '{}'::jsonb, -- page number, URL, anchor, etc.
  created_at timestamptz not null default now()
);

create index chunks_source_id_idx on public.chunks (source_id);
create index chunks_project_id_idx on public.chunks (project_id);

-- HNSW index for fast cosine-similarity retrieval. The match_chunks() function
-- (TASK-212, Phase 2) will use this. Index added now to avoid a backfill later.
create index chunks_embedding_idx
  on public.chunks
  using hnsw (embedding extensions.vector_cosine_ops);

-- =============================================================================
-- conversations
-- =============================================================================

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index conversations_project_id_idx on public.conversations (project_id);
create index conversations_started_at_idx on public.conversations (started_at desc);

-- =============================================================================
-- messages
-- =============================================================================

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  citations jsonb not null default '[]'::jsonb, -- array of chunk_id uuids referenced by [N] markers
  confidence numeric, -- top retrieval similarity for the assistant's reply; null for user messages
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages (conversation_id);
create index messages_created_at_idx on public.messages (created_at desc);

-- =============================================================================
-- unanswered
-- =============================================================================
-- Flagged when the assistant couldn't ground its answer in the project's
-- knowledge base. Powers analytics + the unanswered-questions list.

create table public.unanswered (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  message_id uuid not null references public.messages (id) on delete cascade,
  question text not null, -- denormalized so the analytics query doesn't have to join messages
  created_at timestamptz not null default now()
);

create index unanswered_conversation_id_idx on public.unanswered (conversation_id);

-- =============================================================================
-- stripe_events
-- =============================================================================
-- Idempotency log for Stripe webhooks (TASK-606). Without this, replayed events
-- could double-process subscriptions.

create table public.stripe_events (
  id text primary key, -- Stripe event id (evt_*)
  type text not null,
  processed_at timestamptz not null default now()
);

-- =============================================================================
-- updated_at trigger (DRY)
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

create trigger sources_set_updated_at before update on public.sources
  for each row execute function public.set_updated_at();
