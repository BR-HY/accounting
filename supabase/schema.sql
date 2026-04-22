create extension if not exists pgcrypto;

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_type text not null check (entry_type in ('expense', 'income')),
  amount numeric(12, 2) not null check (amount > 0),
  occurred_on date not null,
  occurred_time time,
  category text not null default '其他',
  purpose text not null,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists ledger_entries_user_date_idx
  on public.ledger_entries (user_id, occurred_on desc, occurred_time desc);

create or replace function public.set_ledger_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_set_ledger_entries_updated_at on public.ledger_entries;

create trigger trg_set_ledger_entries_updated_at
before update on public.ledger_entries
for each row
execute function public.set_ledger_entries_updated_at();

alter table public.ledger_entries enable row level security;
alter table public.ledger_entries force row level security;

drop policy if exists "ledger_select_own" on public.ledger_entries;
create policy "ledger_select_own"
on public.ledger_entries
for select
using (auth.uid() = user_id);

drop policy if exists "ledger_insert_own" on public.ledger_entries;
create policy "ledger_insert_own"
on public.ledger_entries
for insert
with check (auth.uid() = user_id);

drop policy if exists "ledger_update_own" on public.ledger_entries;
create policy "ledger_update_own"
on public.ledger_entries
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "ledger_delete_own" on public.ledger_entries;
create policy "ledger_delete_own"
on public.ledger_entries
for delete
using (auth.uid() = user_id);
