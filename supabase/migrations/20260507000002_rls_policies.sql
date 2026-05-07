-- Helpforge Row-Level Security (TASK-106).
--
-- This is the security floor. If these policies are wrong, one tenant's data
-- leaks into another's chatbot. Verify with the manual two-user test in
-- docs/TASKS.md TASK-106 before considering Phase 1 done.
--
-- General pattern: every table is locked down by default (RLS enabled), and
-- access is granted only where the row's user (directly or via project_id)
-- equals auth.uid().
--
-- The service-role secret key bypasses RLS entirely. That key is only used in
-- lib/supabase/admin.ts (webhooks, migrations) — never in user-facing code.

-- =============================================================================
-- Enable RLS on every table
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.sources enable row level security;
alter table public.chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.unanswered enable row level security;
alter table public.stripe_events enable row level security;

-- =============================================================================
-- profiles — read/update own row
-- =============================================================================
-- Inserts happen via the on_auth_user_created trigger (security definer), so
-- no INSERT policy needed for normal users.

create policy "users select own profile"
  on public.profiles for select
  using (id = (select auth.uid()));

create policy "users update own profile"
  on public.profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- =============================================================================
-- projects — full CRUD on rows you own
-- =============================================================================

create policy "users select own projects"
  on public.projects for select
  using (user_id = (select auth.uid()));

create policy "users insert own projects"
  on public.projects for insert
  with check (user_id = (select auth.uid()));

create policy "users update own projects"
  on public.projects for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "users delete own projects"
  on public.projects for delete
  using (user_id = (select auth.uid()));

-- =============================================================================
-- sources — scoped via project ownership
-- =============================================================================

create policy "users select sources of own projects"
  on public.sources for select
  using (
    project_id in (
      select id from public.projects where user_id = (select auth.uid())
    )
  );

create policy "users insert sources of own projects"
  on public.sources for insert
  with check (
    project_id in (
      select id from public.projects where user_id = (select auth.uid())
    )
  );

create policy "users update sources of own projects"
  on public.sources for update
  using (
    project_id in (
      select id from public.projects where user_id = (select auth.uid())
    )
  );

create policy "users delete sources of own projects"
  on public.sources for delete
  using (
    project_id in (
      select id from public.projects where user_id = (select auth.uid())
    )
  );

-- =============================================================================
-- chunks — scoped via project_id (denormalized → no join needed)
-- =============================================================================

create policy "users select chunks of own projects"
  on public.chunks for select
  using (
    project_id in (
      select id from public.projects where user_id = (select auth.uid())
    )
  );

create policy "users insert chunks of own projects"
  on public.chunks for insert
  with check (
    project_id in (
      select id from public.projects where user_id = (select auth.uid())
    )
  );

create policy "users delete chunks of own projects"
  on public.chunks for delete
  using (
    project_id in (
      select id from public.projects where user_id = (select auth.uid())
    )
  );

-- (No update policy: chunks are append-only. Re-ingestion deletes + reinserts.)

-- =============================================================================
-- conversations — scoped via project ownership
-- =============================================================================

create policy "users select conversations of own projects"
  on public.conversations for select
  using (
    project_id in (
      select id from public.projects where user_id = (select auth.uid())
    )
  );

create policy "users insert conversations of own projects"
  on public.conversations for insert
  with check (
    project_id in (
      select id from public.projects where user_id = (select auth.uid())
    )
  );

create policy "users update conversations of own projects"
  on public.conversations for update
  using (
    project_id in (
      select id from public.projects where user_id = (select auth.uid())
    )
  );

create policy "users delete conversations of own projects"
  on public.conversations for delete
  using (
    project_id in (
      select id from public.projects where user_id = (select auth.uid())
    )
  );

-- =============================================================================
-- messages — scoped via conversation → project
-- =============================================================================

create policy "users select messages of own conversations"
  on public.messages for select
  using (
    conversation_id in (
      select c.id from public.conversations c
      join public.projects p on p.id = c.project_id
      where p.user_id = (select auth.uid())
    )
  );

create policy "users insert messages of own conversations"
  on public.messages for insert
  with check (
    conversation_id in (
      select c.id from public.conversations c
      join public.projects p on p.id = c.project_id
      where p.user_id = (select auth.uid())
    )
  );

-- (No update or delete: messages are append-only history.)

-- =============================================================================
-- unanswered — scoped via conversation → project
-- =============================================================================

create policy "users select unanswered of own projects"
  on public.unanswered for select
  using (
    conversation_id in (
      select c.id from public.conversations c
      join public.projects p on p.id = c.project_id
      where p.user_id = (select auth.uid())
    )
  );

create policy "users insert unanswered of own projects"
  on public.unanswered for insert
  with check (
    conversation_id in (
      select c.id from public.conversations c
      join public.projects p on p.id = c.project_id
      where p.user_id = (select auth.uid())
    )
  );

-- =============================================================================
-- stripe_events — service-role only
-- =============================================================================
-- No policies = no access for normal users (RLS denies by default). The Stripe
-- webhook route uses the admin client, which bypasses RLS via the secret key.
