create table if not exists public.user_active_filters (
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, entity_type)
);

alter table public.user_active_filters enable row level security;

create policy "own active filters select"
  on public.user_active_filters for select
  using (user_id = auth.uid());

create policy "own active filters insert"
  on public.user_active_filters for insert
  with check (user_id = auth.uid());

create policy "own active filters update"
  on public.user_active_filters for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "own active filters delete"
  on public.user_active_filters for delete
  using (user_id = auth.uid());

drop trigger if exists trg_user_active_filters_uat on public.user_active_filters;
create trigger trg_user_active_filters_uat
  before update on public.user_active_filters
  for each row execute function public.update_updated_at();

create index if not exists idx_user_active_filters_user on public.user_active_filters(user_id);