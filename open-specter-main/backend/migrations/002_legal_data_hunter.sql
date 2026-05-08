-- Add LegalDataHunter API key column to user_profiles.
-- Apply once in the Supabase SQL editor or via `supabase db push`.
alter table public.user_profiles
    add column if not exists legal_data_hunter_api_key text;
