create table coach_usage_daily (
  user_id uuid references auth.users(id) on delete cascade not null,
  usage_date date not null default current_date,
  request_count integer not null default 0,
  last_request_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  primary key (user_id, usage_date)
);

create index coach_usage_daily_usage_date_idx
  on coach_usage_daily (usage_date desc);

alter table coach_usage_daily enable row level security;

create policy "Users can read own coach usage"
  on coach_usage_daily for select using (auth.uid() = user_id);

create policy "Users can insert own coach usage"
  on coach_usage_daily for insert with check (auth.uid() = user_id);

create policy "Users can update own coach usage"
  on coach_usage_daily for update using (auth.uid() = user_id);

create or replace function consume_coach_quota(
  p_daily_limit integer,
  p_cooldown_seconds integer
)
returns table (
  allowed boolean,
  reason text,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_row coach_usage_daily%rowtype;
begin
  if v_user_id is null then
    return query select false, 'unauthorized', 0, 0;
    return;
  end if;

  insert into coach_usage_daily (user_id, usage_date, last_request_at)
  values (v_user_id, current_date, null)
  on conflict (user_id, usage_date) do nothing;

  select *
  into v_row
  from coach_usage_daily
  where user_id = v_user_id and usage_date = current_date
  for update;

  if v_row.last_request_at is not null
    and v_row.last_request_at > v_now - make_interval(secs => p_cooldown_seconds) then
    return query
      select
        false,
        'cooldown',
        greatest(p_daily_limit - v_row.request_count, 0),
        greatest(
          ceil(extract(epoch from (v_row.last_request_at + make_interval(secs => p_cooldown_seconds) - v_now)))::integer,
          1
        );
    return;
  end if;

  if v_row.request_count >= p_daily_limit then
    return query select false, 'daily_limit', 0, 0;
    return;
  end if;

  update coach_usage_daily
  set
    request_count = request_count + 1,
    last_request_at = v_now,
    updated_at = v_now
  where user_id = v_user_id and usage_date = current_date;

  return query
    select true, 'ok', greatest(p_daily_limit - (v_row.request_count + 1), 0), 0;
end;
$$;

grant execute on function consume_coach_quota(integer, integer) to authenticated;
