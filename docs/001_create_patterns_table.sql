-- Create the patterns table for storing user drum patterns
create table patterns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  pattern jsonb not null,
  bpm integer not null,
  created_at timestamptz default now() not null
);

create index patterns_user_id_idx on patterns(user_id);

-- Enable Row Level Security
alter table patterns enable row level security;

-- RLS policies: each user can only access their own patterns
create policy "Users can read own patterns"
  on patterns for select using (auth.uid() = user_id);

create policy "Users can insert own patterns"
  on patterns for insert with check (auth.uid() = user_id);

create policy "Users can update own patterns"
  on patterns for update using (auth.uid() = user_id);

create policy "Users can delete own patterns"
  on patterns for delete using (auth.uid() = user_id);
