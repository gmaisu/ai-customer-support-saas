-- Add a per-user OpenAI API key. Helpforge follows a BYOK (Bring-Your-Own-Key)
-- model: each user supplies their own OpenAI key, which Helpforge uses for
-- embeddings (Phase 2) and chat completions (Phase 3) on their behalf.
--
-- Why BYOK:
-- - Zero ongoing platform cost (users pay OpenAI directly)
-- - Real-world pattern that portfolio buyers recognize
-- - Sidesteps platform-level rate-limiting / metering complexity
--
-- Storage model:
-- - Stored as plaintext in profiles.openai_api_key
-- - Read-protected by the existing RLS on profiles (users can only read
--   their own row)
-- - Supabase encrypts data at rest at the disk layer
-- - For real production: switch to pgsodium / Supabase Vault for
--   application-layer encryption. Out of scope for the portfolio MVP.

alter table public.profiles
  add column if not exists openai_api_key text;

-- Helper for the dashboard: tell the UI whether the user has a key without
-- exposing the key itself. Prefix is "sk-..." for OpenAI keys, last 4
-- visible characters help users confirm "yes, that's mine."
comment on column public.profiles.openai_api_key is
  'User-provided OpenAI API key (sk-...). Read by server-side code via RLS-protected profiles row.';
