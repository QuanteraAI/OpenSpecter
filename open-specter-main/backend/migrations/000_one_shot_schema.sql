-- Open Specter one-shot Supabase schema
-- Based on supabase-migration.sql plus the later backend/migrations/*.sql files.
-- Use this for a fresh Supabase database. Existing deployments should continue
-- to apply the incremental migration files instead.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- User profiles
-- ---------------------------------------------------------------------------

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  organisation text,
  tier text not null default 'Free',
  message_credits_used integer not null default 0,
  credits_reset_date timestamptz not null default (now() + interval '30 days'),
  tabular_model text not null default 'gemini-3-flash-preview',
  claude_api_key text,
  gemini_api_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_user
  on public.user_profiles(user_id);

alter table public.user_profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.user_profiles;
create policy "Users can view their own profile"
  on public.user_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own profile" on public.user_profiles;
create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
exception when others then
  -- Never block signup if the profile insert fails.
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Projects and documents
-- ---------------------------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  cm_number text,
  visibility text not null default 'private',
  shared_with jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_user
  on public.projects(user_id);

create index if not exists projects_shared_with_idx
  on public.projects using gin (shared_with);

create table if not exists public.project_subfolders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id text not null,
  name text not null,
  parent_folder_id uuid references public.project_subfolders(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_subfolders_project
  on public.project_subfolders(project_id);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  user_id text not null,
  filename text not null,
  file_type text,
  size_bytes integer not null default 0,
  page_count integer,
  structure_tree jsonb,
  status text not null default 'pending',
  folder_id uuid references public.project_subfolders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_documents_user_project
  on public.documents(user_id, project_id);

create index if not exists idx_documents_project_folder
  on public.documents(project_id, folder_id);

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  storage_path text not null,
  pdf_storage_path text,
  source text not null default 'upload',
  version_number integer,
  display_name text,
  created_at timestamptz not null default now(),
  constraint document_versions_source_check
    check (source = any (array[
      'upload'::text,
      'user_upload'::text,
      'assistant_edit'::text,
      'user_accept'::text,
      'user_reject'::text,
      'generated'::text
    ]))
);

create index if not exists document_versions_document_id_idx
  on public.document_versions(document_id, created_at desc);

create index if not exists document_versions_doc_vnum_idx
  on public.document_versions(document_id, version_number);

alter table public.documents
  add column if not exists current_version_id uuid
  references public.document_versions(id) on delete set null;

create table if not exists public.document_edits (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chat_message_id uuid,
  version_id uuid not null references public.document_versions(id) on delete cascade,
  change_id text not null,
  del_w_id text,
  ins_w_id text,
  deleted_text text not null default '',
  inserted_text text not null default '',
  context_before text,
  context_after text,
  status text not null default 'pending'
    check (status = any (array[
      'pending'::text,
      'accepted'::text,
      'rejected'::text
    ])),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists document_edits_document_id_idx
  on public.document_edits(document_id, created_at desc);

create index if not exists document_edits_message_id_idx
  on public.document_edits(chat_message_id);

create index if not exists document_edits_version_id_idx
  on public.document_edits(version_id);

-- ---------------------------------------------------------------------------
-- Workflows
-- ---------------------------------------------------------------------------

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  title text not null,
  type text not null,
  prompt_md text,
  columns_config jsonb,
  practice text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_workflows_user
  on public.workflows(user_id);

create table if not exists public.hidden_workflows (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  workflow_id text not null,
  created_at timestamptz not null default now(),
  unique(user_id, workflow_id)
);

create index if not exists idx_hidden_workflows_user
  on public.hidden_workflows(user_id);

create table if not exists public.workflow_shares (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  shared_by_user_id text not null,
  shared_with_email text not null,
  allow_edit boolean not null default false,
  created_at timestamptz not null default now(),
  constraint workflow_shares_workflow_email_unique
    unique(workflow_id, shared_with_email)
);

create index if not exists workflow_shares_workflow_id_idx
  on public.workflow_shares(workflow_id);

create index if not exists workflow_shares_email_idx
  on public.workflow_shares(shared_with_email);

-- ---------------------------------------------------------------------------
-- Assistant chats
-- ---------------------------------------------------------------------------

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  user_id text not null,
  title text,
  created_at timestamptz not null default now()
);

create index if not exists idx_chats_user
  on public.chats(user_id);

create index if not exists idx_chats_project
  on public.chats(project_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null,
  content jsonb,
  files jsonb,
  workflow jsonb,
  annotations jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_chat
  on public.chat_messages(chat_id);

-- ---------------------------------------------------------------------------
-- Recent activity
-- ---------------------------------------------------------------------------

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  project_id uuid references public.projects(id) on delete cascade,
  event_type text not null check (event_type = any (array[
    'assistant_chat_created'::text,
    'tabular_review_created'::text,
    'workflow_used'::text
  ])),
  entity_type text,
  entity_id uuid,
  title text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_user_created_idx
  on public.activity_events(user_id, created_at desc);

create index if not exists activity_events_project_created_idx
  on public.activity_events(project_id, created_at desc);

create index if not exists activity_events_event_type_idx
  on public.activity_events(event_type);

alter table public.activity_events enable row level security;

drop policy if exists "Users can view their own activity" on public.activity_events;
create policy "Users can view their own activity"
  on public.activity_events for select
  using (auth.uid()::text = user_id);

drop policy if exists "Users can insert their own activity" on public.activity_events;
create policy "Users can insert their own activity"
  on public.activity_events for insert
  with check (auth.uid()::text = user_id);


do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'document_edits_chat_message_id_fkey'
      and conrelid = 'public.document_edits'::regclass
  ) then
    alter table public.document_edits
      add constraint document_edits_chat_message_id_fkey
      foreign key (chat_message_id)
      references public.chat_messages(id)
      on delete set null;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tabular reviews
-- ---------------------------------------------------------------------------

create table if not exists public.tabular_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  user_id text not null,
  title text,
  columns_config jsonb,
  workflow_id uuid references public.workflows(id) on delete set null,
  practice text,
  shared_with jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tabular_reviews_user
  on public.tabular_reviews(user_id);

create index if not exists idx_tabular_reviews_project
  on public.tabular_reviews(project_id);

create index if not exists tabular_reviews_shared_with_idx
  on public.tabular_reviews using gin (shared_with);

create table if not exists public.tabular_cells (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.tabular_reviews(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  column_index integer not null,
  content text,
  citations jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists idx_tabular_cells_review
  on public.tabular_cells(review_id, document_id, column_index);

create table if not exists public.tabular_review_chats (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.tabular_reviews(id) on delete cascade,
  user_id text not null,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tabular_review_chats_review_idx
  on public.tabular_review_chats(review_id, updated_at desc);

create index if not exists tabular_review_chats_user_idx
  on public.tabular_review_chats(user_id);

create table if not exists public.tabular_review_chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.tabular_review_chats(id) on delete cascade,
  role text not null,
  content jsonb,
  annotations jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tabular_review_chat_messages_chat_idx
  on public.tabular_review_chat_messages(chat_id, created_at);

-- Open Specter content row-level security policies
-- Applies RLS to all user/content tables beyond user_profiles.
-- Safe to run repeatedly: policies are dropped/recreated idempotently.

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;

drop policy if exists projects_select_owner_or_shared on public.projects;
create policy projects_select_owner_or_shared
  on public.projects for select
  using (
    user_id = auth.uid()::text
    or exists (
      select 1
      from jsonb_array_elements_text(coalesce(shared_with, '[]'::jsonb)) as member(email)
      where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

drop policy if exists projects_insert_owner_only on public.projects;
create policy projects_insert_owner_only
  on public.projects for insert
  with check (user_id = auth.uid()::text);

drop policy if exists projects_update_owner_only on public.projects;
create policy projects_update_owner_only
  on public.projects for update
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists projects_delete_owner_only on public.projects;
create policy projects_delete_owner_only
  on public.projects for delete
  using (user_id = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Project subfolders
-- ---------------------------------------------------------------------------

alter table public.project_subfolders enable row level security;

drop policy if exists project_subfolders_select_project_access on public.project_subfolders;
create policy project_subfolders_select_project_access
  on public.project_subfolders for select
  using (
    user_id = auth.uid()::text
    or exists (
      select 1
      from public.projects p
      where p.id = project_subfolders.project_id
        and (
          p.user_id = auth.uid()::text
          or exists (
            select 1
            from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
            where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
          )
        )
    )
  );

drop policy if exists project_subfolders_insert_project_access on public.project_subfolders;
create policy project_subfolders_insert_project_access
  on public.project_subfolders for insert
  with check (
    user_id = auth.uid()::text
    and exists (
      select 1
      from public.projects p
      where p.id = project_subfolders.project_id
        and (
          p.user_id = auth.uid()::text
          or exists (
            select 1
            from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
            where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
          )
        )
    )
  );

drop policy if exists project_subfolders_update_owner_only on public.project_subfolders;
create policy project_subfolders_update_owner_only
  on public.project_subfolders for update
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists project_subfolders_delete_owner_only on public.project_subfolders;
create policy project_subfolders_delete_owner_only
  on public.project_subfolders for delete
  using (user_id = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Documents and document versions/edits
-- ---------------------------------------------------------------------------

alter table public.documents enable row level security;

drop policy if exists documents_select_owner_or_project_access on public.documents;
create policy documents_select_owner_or_project_access
  on public.documents for select
  using (
    user_id = auth.uid()::text
    or (
      project_id is not null
      and exists (
        select 1
        from public.projects p
        where p.id = documents.project_id
          and (
            p.user_id = auth.uid()::text
            or exists (
              select 1
              from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
              where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
            )
          )
      )
    )
  );

drop policy if exists documents_insert_owner_or_project_access on public.documents;
create policy documents_insert_owner_or_project_access
  on public.documents for insert
  with check (
    user_id = auth.uid()::text
    and (
      project_id is null
      or exists (
        select 1
        from public.projects p
        where p.id = documents.project_id
          and (
            p.user_id = auth.uid()::text
            or exists (
              select 1
              from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
              where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
            )
          )
      )
    )
  );

drop policy if exists documents_update_owner_only on public.documents;
create policy documents_update_owner_only
  on public.documents for update
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists documents_delete_owner_only on public.documents;
create policy documents_delete_owner_only
  on public.documents for delete
  using (user_id = auth.uid()::text);

alter table public.document_versions enable row level security;

drop policy if exists document_versions_access_via_document on public.document_versions;
create policy document_versions_access_via_document
  on public.document_versions for all
  using (
    exists (
      select 1
      from public.documents d
      where d.id = document_versions.document_id
        and (
          d.user_id = auth.uid()::text
          or (
            d.project_id is not null
            and exists (
              select 1
              from public.projects p
              where p.id = d.project_id
                and (
                  p.user_id = auth.uid()::text
                  or exists (
                    select 1
                    from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
                    where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
                  )
                )
            )
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.documents d
      where d.id = document_versions.document_id
        and (
          d.user_id = auth.uid()::text
          or (
            d.project_id is not null
            and exists (
              select 1
              from public.projects p
              where p.id = d.project_id
                and (
                  p.user_id = auth.uid()::text
                  or exists (
                    select 1
                    from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
                    where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
                  )
                )
            )
          )
        )
    )
  );

alter table public.document_edits enable row level security;

drop policy if exists document_edits_access_via_document on public.document_edits;
create policy document_edits_access_via_document
  on public.document_edits for all
  using (
    exists (
      select 1
      from public.documents d
      where d.id = document_edits.document_id
        and (
          d.user_id = auth.uid()::text
          or (
            d.project_id is not null
            and exists (
              select 1
              from public.projects p
              where p.id = d.project_id
                and (
                  p.user_id = auth.uid()::text
                  or exists (
                    select 1
                    from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
                    where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
                  )
                )
            )
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.documents d
      where d.id = document_edits.document_id
        and (
          d.user_id = auth.uid()::text
          or (
            d.project_id is not null
            and exists (
              select 1
              from public.projects p
              where p.id = d.project_id
                and (
                  p.user_id = auth.uid()::text
                  or exists (
                    select 1
                    from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
                    where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
                  )
                )
            )
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Workflows and workflow shares
-- ---------------------------------------------------------------------------

alter table public.workflows enable row level security;

drop policy if exists workflows_select_owner_system_or_shared on public.workflows;
create policy workflows_select_owner_system_or_shared
  on public.workflows for select
  using (
    is_system = true
    or user_id = auth.uid()::text
    or exists (
      select 1
      from public.workflow_shares ws
      where ws.workflow_id = workflows.id
        and lower(ws.shared_with_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

drop policy if exists workflows_insert_owner_only on public.workflows;
create policy workflows_insert_owner_only
  on public.workflows for insert
  with check (user_id = auth.uid()::text and is_system = false);

drop policy if exists workflows_update_owner_only on public.workflows;
create policy workflows_update_owner_only
  on public.workflows for update
  using (user_id = auth.uid()::text and is_system = false)
  with check (user_id = auth.uid()::text and is_system = false);

drop policy if exists workflows_delete_owner_only on public.workflows;
create policy workflows_delete_owner_only
  on public.workflows for delete
  using (user_id = auth.uid()::text and is_system = false);

alter table public.hidden_workflows enable row level security;

drop policy if exists hidden_workflows_owner_all on public.hidden_workflows;
create policy hidden_workflows_owner_all
  on public.hidden_workflows for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

alter table public.workflow_shares enable row level security;

drop policy if exists workflow_shares_select_owner_or_recipient on public.workflow_shares;
create policy workflow_shares_select_owner_or_recipient
  on public.workflow_shares for select
  using (
    shared_by_user_id = auth.uid()::text
    or lower(shared_with_email) = lower(coalesce(auth.jwt()->>'email', ''))
  );

drop policy if exists workflow_shares_insert_owner_only on public.workflow_shares;
create policy workflow_shares_insert_owner_only
  on public.workflow_shares for insert
  with check (
    shared_by_user_id = auth.uid()::text
    and exists (
      select 1
      from public.workflows w
      where w.id = workflow_shares.workflow_id
        and w.user_id = auth.uid()::text
        and w.is_system = false
    )
  );

drop policy if exists workflow_shares_update_owner_only on public.workflow_shares;
create policy workflow_shares_update_owner_only
  on public.workflow_shares for update
  using (shared_by_user_id = auth.uid()::text)
  with check (shared_by_user_id = auth.uid()::text);

drop policy if exists workflow_shares_delete_owner_only on public.workflow_shares;
create policy workflow_shares_delete_owner_only
  on public.workflow_shares for delete
  using (shared_by_user_id = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Assistant chats and messages
-- ---------------------------------------------------------------------------

alter table public.chats enable row level security;

drop policy if exists chats_select_owner_or_project_member on public.chats;
create policy chats_select_owner_or_project_member
  on public.chats for select
  using (
    user_id = auth.uid()::text
    or (
      project_id is not null
      and exists (
        select 1
        from public.projects p
        where p.id = chats.project_id
          and (
            p.user_id = auth.uid()::text
            or exists (
              select 1
              from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
              where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
            )
          )
      )
    )
  );

drop policy if exists chats_insert_user_and_project_access on public.chats;
create policy chats_insert_user_and_project_access
  on public.chats for insert
  with check (
    user_id = auth.uid()::text
    and (
      project_id is null
      or exists (
        select 1
        from public.projects p
        where p.id = chats.project_id
          and (
            p.user_id = auth.uid()::text
            or exists (
              select 1
              from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
              where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
            )
          )
      )
    )
  );

drop policy if exists chats_update_owner_only on public.chats;
create policy chats_update_owner_only
  on public.chats for update
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists chats_delete_owner_only on public.chats;
create policy chats_delete_owner_only
  on public.chats for delete
  using (user_id = auth.uid()::text);

alter table public.chat_messages enable row level security;

drop policy if exists chat_messages_access_by_chat_access on public.chat_messages;
create policy chat_messages_access_by_chat_access
  on public.chat_messages for all
  using (
    exists (
      select 1
      from public.chats c
      where c.id = chat_messages.chat_id
        and (
          c.user_id = auth.uid()::text
          or (
            c.project_id is not null
            and exists (
              select 1
              from public.projects p
              where p.id = c.project_id
                and (
                  p.user_id = auth.uid()::text
                  or exists (
                    select 1
                    from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
                    where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
                  )
                )
            )
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.chats c
      where c.id = chat_messages.chat_id
        and (
          c.user_id = auth.uid()::text
          or (
            c.project_id is not null
            and exists (
              select 1
              from public.projects p
              where p.id = c.project_id
                and (
                  p.user_id = auth.uid()::text
                  or exists (
                    select 1
                    from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
                    where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
                  )
                )
            )
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Tabular reviews and related chats
-- ---------------------------------------------------------------------------

alter table public.tabular_reviews enable row level security;

drop policy if exists tabular_reviews_select_owner_project_or_shared on public.tabular_reviews;
create policy tabular_reviews_select_owner_project_or_shared
  on public.tabular_reviews for select
  using (
    user_id = auth.uid()::text
    or exists (
      select 1
      from jsonb_array_elements_text(coalesce(shared_with, '[]'::jsonb)) as member(email)
      where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
    or (
      project_id is not null
      and exists (
        select 1
        from public.projects p
        where p.id = tabular_reviews.project_id
          and (
            p.user_id = auth.uid()::text
            or exists (
              select 1
              from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
              where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
            )
          )
      )
    )
  );

drop policy if exists tabular_reviews_insert_owner_or_project_access on public.tabular_reviews;
create policy tabular_reviews_insert_owner_or_project_access
  on public.tabular_reviews for insert
  with check (
    user_id = auth.uid()::text
    and (
      project_id is null
      or exists (
        select 1
        from public.projects p
        where p.id = tabular_reviews.project_id
          and (
            p.user_id = auth.uid()::text
            or exists (
              select 1
              from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
              where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
            )
          )
      )
    )
  );

drop policy if exists tabular_reviews_update_owner_only on public.tabular_reviews;
create policy tabular_reviews_update_owner_only
  on public.tabular_reviews for update
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists tabular_reviews_delete_owner_only on public.tabular_reviews;
create policy tabular_reviews_delete_owner_only
  on public.tabular_reviews for delete
  using (user_id = auth.uid()::text);

alter table public.tabular_cells enable row level security;

drop policy if exists tabular_cells_access_via_review on public.tabular_cells;
create policy tabular_cells_access_via_review
  on public.tabular_cells for all
  using (
    exists (
      select 1
      from public.tabular_reviews tr
      where tr.id = tabular_cells.review_id
        and (
          tr.user_id = auth.uid()::text
          or exists (
            select 1
            from jsonb_array_elements_text(coalesce(tr.shared_with, '[]'::jsonb)) as member(email)
            where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
          )
          or (
            tr.project_id is not null
            and exists (
              select 1
              from public.projects p
              where p.id = tr.project_id
                and (
                  p.user_id = auth.uid()::text
                  or exists (
                    select 1
                    from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
                    where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
                  )
                )
            )
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.tabular_reviews tr
      where tr.id = tabular_cells.review_id
        and (
          tr.user_id = auth.uid()::text
          or (
            tr.project_id is not null
            and exists (
              select 1
              from public.projects p
              where p.id = tr.project_id
                and (
                  p.user_id = auth.uid()::text
                  or exists (
                    select 1
                    from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
                    where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
                  )
                )
            )
          )
        )
    )
  );

alter table public.tabular_review_chats enable row level security;

drop policy if exists tabular_review_chats_access_via_review on public.tabular_review_chats;
create policy tabular_review_chats_access_via_review
  on public.tabular_review_chats for all
  using (
    user_id = auth.uid()::text
    or exists (
      select 1
      from public.tabular_reviews tr
      where tr.id = tabular_review_chats.review_id
        and (
          tr.user_id = auth.uid()::text
          or exists (
            select 1
            from jsonb_array_elements_text(coalesce(tr.shared_with, '[]'::jsonb)) as member(email)
            where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
          )
          or (
            tr.project_id is not null
            and exists (
              select 1
              from public.projects p
              where p.id = tr.project_id
                and (
                  p.user_id = auth.uid()::text
                  or exists (
                    select 1
                    from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
                    where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
                  )
                )
            )
          )
        )
    )
  )
  with check (
    user_id = auth.uid()::text
    and exists (
      select 1
      from public.tabular_reviews tr
      where tr.id = tabular_review_chats.review_id
        and (
          tr.user_id = auth.uid()::text
          or (
            tr.project_id is not null
            and exists (
              select 1
              from public.projects p
              where p.id = tr.project_id
                and (
                  p.user_id = auth.uid()::text
                  or exists (
                    select 1
                    from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
                    where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
                  )
                )
            )
          )
        )
    )
  );

alter table public.tabular_review_chat_messages enable row level security;

drop policy if exists tabular_review_chat_messages_access_via_chat on public.tabular_review_chat_messages;
create policy tabular_review_chat_messages_access_via_chat
  on public.tabular_review_chat_messages for all
  using (
    exists (
      select 1
      from public.tabular_review_chats trc
      join public.tabular_reviews tr on tr.id = trc.review_id
      where trc.id = tabular_review_chat_messages.chat_id
        and (
          trc.user_id = auth.uid()::text
          or tr.user_id = auth.uid()::text
          or exists (
            select 1
            from jsonb_array_elements_text(coalesce(tr.shared_with, '[]'::jsonb)) as member(email)
            where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
          )
          or (
            tr.project_id is not null
            and exists (
              select 1
              from public.projects p
              where p.id = tr.project_id
                and (
                  p.user_id = auth.uid()::text
                  or exists (
                    select 1
                    from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
                    where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
                  )
                )
            )
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.tabular_review_chats trc
      join public.tabular_reviews tr on tr.id = trc.review_id
      where trc.id = tabular_review_chat_messages.chat_id
        and (
          trc.user_id = auth.uid()::text
          or tr.user_id = auth.uid()::text
          or (
            tr.project_id is not null
            and exists (
              select 1
              from public.projects p
              where p.id = tr.project_id
                and (
                  p.user_id = auth.uid()::text
                  or exists (
                    select 1
                    from jsonb_array_elements_text(coalesce(p.shared_with, '[]'::jsonb)) as member(email)
                    where lower(member.email) = lower(coalesce(auth.jwt()->>'email', ''))
                  )
                )
            )
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Recent activity
-- ---------------------------------------------------------------------------

alter table public.activity_events enable row level security;

drop policy if exists "Users can view their own activity" on public.activity_events;
create policy "Users can view their own activity"
  on public.activity_events for select
  using (auth.uid()::text = user_id);

drop policy if exists "Users can insert their own activity" on public.activity_events;
create policy "Users can insert their own activity"
  on public.activity_events for insert
  with check (auth.uid()::text = user_id);

