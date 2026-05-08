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
