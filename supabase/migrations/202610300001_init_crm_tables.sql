-- Mini CRM schema. This migration only creates the CRM tables and policies;
-- it does not delete or rewrite existing rows.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  email text,
  phone text,
  company text,
  category text not null default 'Новый'
    check (category in ('Постоянный', 'Новый', 'Партнёр', 'VIP')),
  status text not null default 'potential'
    check (status in ('active', 'potential', 'inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_id_user_id_key unique (id, user_id)
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id uuid not null,
  title text not null check (length(btrim(title)) > 0),
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  status text not null default 'new'
    check (status in ('new', 'progress', 'won', 'lost')),
  close_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deals_id_user_id_key unique (id, user_id),
  constraint deals_id_client_user_key unique (id, client_id, user_id),
  constraint deals_client_user_fkey
    foreign key (client_id, user_id)
    references public.clients (id, user_id)
    on delete restrict
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  description text,
  client_id uuid,
  deal_id uuid,
  constraint tasks_deal_requires_client_check check (deal_id is null or client_id is not null),
  due_date date not null,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high')),
  status text not null default 'open'
    check (status in ('open', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_client_user_fkey
    foreign key (client_id, user_id)
    references public.clients (id, user_id)
    on delete restrict,
  constraint tasks_deal_user_fkey
    foreign key (deal_id, client_id, user_id)
    references public.deals (id, client_id, user_id)
    on delete restrict
);

create index if not exists clients_user_created_idx on public.clients (user_id, created_at desc);
create index if not exists clients_user_status_idx on public.clients (user_id, status);
create index if not exists clients_user_category_idx on public.clients (user_id, category);
create index if not exists deals_user_created_idx on public.deals (user_id, created_at desc);
create index if not exists deals_user_status_close_idx on public.deals (user_id, status, close_date);
create index if not exists deals_client_user_idx on public.deals (client_id, user_id);
create index if not exists tasks_user_due_idx on public.tasks (user_id, due_date);
create index if not exists tasks_user_status_due_idx on public.tasks (user_id, status, due_date);
create index if not exists tasks_client_user_idx on public.tasks (client_id, user_id);
create index if not exists tasks_deal_user_idx on public.tasks (deal_id, user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists deals_set_updated_at on public.deals;
create trigger deals_set_updated_at
before update on public.deals
for each row execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

alter table public.clients enable row level security;
alter table public.deals enable row level security;
alter table public.tasks enable row level security;

revoke all on table public.clients, public.deals, public.tasks from public, anon, authenticated;
grant select, insert, update, delete on table public.clients, public.deals, public.tasks to authenticated;

create policy clients_select_own on public.clients
  for select to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy clients_insert_own on public.clients
  for insert to authenticated
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy clients_update_own on public.clients
  for update to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy clients_delete_own on public.clients
  for delete to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy deals_select_own on public.deals
  for select to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy deals_insert_own on public.deals
  for insert to authenticated
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy deals_update_own on public.deals
  for update to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy deals_delete_own on public.deals
  for delete to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy tasks_select_own on public.tasks
  for select to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy tasks_insert_own on public.tasks
  for insert to authenticated
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy tasks_update_own on public.tasks
  for update to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy tasks_delete_own on public.tasks
  for delete to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));
