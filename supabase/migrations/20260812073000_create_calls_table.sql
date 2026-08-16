create table public.calls (
  id uuid primary key default uuid_generate_v4(),
  caller_id uuid not null references public.profiles(id) on delete cascade,
  callee_id uuid not null references public.profiles(id) on delete cascade,
  room_id text not null,
  call_type text not null check (call_type in ('voice', 'video')),
  status text not null default 'ringing' check (status in ('ringing', 'accepted', 'declined', 'missed', 'ended', 'cancelled')),
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  ended_at timestamptz
);

-- Enable RLS
alter table public.calls enable row level security;

-- Policies
create policy "Users can see their own calls"
  on public.calls for select
  using (auth.uid() = caller_id or auth.uid() = callee_id);

create policy "Caller can insert a call"
  on public.calls for insert
  with check (auth.uid() = caller_id);

create policy "Caller or callee can update their call"
  on public.calls for update
  using (auth.uid() = caller_id or auth.uid() = callee_id);

-- Enable Realtime
alter publication supabase_realtime add table public.calls;
