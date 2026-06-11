-- profiles (Supabase Authのusersを拡張)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- トリガー: ユーザー作成時にprofileを自動生成
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 旅行
create table public.trips (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  destination text,
  cover_emoji text not null default '✈️',
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- 旅行メンバー
create table public.trip_members (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  unique(trip_id, user_id)
);

-- 招待トークン
create table public.trip_invites (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now()
);

-- 日程調整ポール
create table public.schedule_polls (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  title text not null,
  description text,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now()
);

-- 候補日
create table public.poll_dates (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references public.schedule_polls(id) on delete cascade not null,
  date date not null,
  label text,
  sort_order int default 0
);

-- 回答
create table public.poll_responses (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references public.schedule_polls(id) on delete cascade not null,
  date_id uuid references public.poll_dates(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  response text not null check (response in ('ok', 'maybe', 'ng')),
  unique(date_id, user_id)
);

-- プランアイテム
create table public.plan_items (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  date date not null,
  title text not null,
  description text,
  location text,
  start_time time,
  end_time time,
  sort_order int default 0
);

-- メモ
create table public.memos (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  title text not null,
  content text not null default '',
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 支出
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  description text not null,
  amount numeric(10,2) not null,
  paid_by uuid references public.profiles(id) not null,
  created_at timestamptz default now()
);

-- 割り勘分担
create table public.expense_splits (
  id uuid default gen_random_uuid() primary key,
  expense_id uuid references public.expenses(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  share_amount numeric(10,2) not null,
  unique(expense_id, user_id)
);

-- RLS 有効化
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_invites enable row level security;
alter table public.schedule_polls enable row level security;
alter table public.poll_dates enable row level security;
alter table public.poll_responses enable row level security;
alter table public.plan_items enable row level security;
alter table public.memos enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;

-- RLSポリシー: trip_membersにいるユーザーのみアクセス可能
create policy "profiles: own or trip member" on public.profiles
  for select using (
    id = auth.uid() or
    id in (
      select user_id from public.trip_members
      where trip_id in (
        select trip_id from public.trip_members where user_id = auth.uid()
      )
    )
  );

create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid());

-- trips
create policy "trips: member access" on public.trips
  for select using (
    id in (select trip_id from public.trip_members where user_id = auth.uid())
  );

create policy "trips: insert" on public.trips
  for insert with check (created_by = auth.uid());

create policy "trips: owner update" on public.trips
  for update using (
    id in (select trip_id from public.trip_members where user_id = auth.uid() and role = 'owner')
  );

create policy "trips: owner delete" on public.trips
  for delete using (
    id in (select trip_id from public.trip_members where user_id = auth.uid() and role = 'owner')
  );

-- trip_members
create policy "trip_members: member read" on public.trip_members
  for select using (
    trip_id in (select trip_id from public.trip_members where user_id = auth.uid())
  );

create policy "trip_members: insert self" on public.trip_members
  for insert with check (user_id = auth.uid());

create policy "trip_members: owner manage" on public.trip_members
  for delete using (
    trip_id in (select trip_id from public.trip_members where user_id = auth.uid() and role = 'owner')
  );

-- trip_invites
create policy "trip_invites: member read" on public.trip_invites
  for select using (
    trip_id in (select trip_id from public.trip_members where user_id = auth.uid())
  );

create policy "trip_invites: member insert" on public.trip_invites
  for insert with check (
    trip_id in (select trip_id from public.trip_members where user_id = auth.uid())
    and created_by = auth.uid()
  );

-- helper: tripメンバーかどうか
create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- schedule_polls, poll_dates, poll_responses, plan_items, memos, expenses, expense_splits
-- 全て is_trip_member で制御
create policy "schedule_polls: member" on public.schedule_polls
  for all using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));

create policy "poll_dates: member" on public.poll_dates
  for all using (
    poll_id in (select id from public.schedule_polls where public.is_trip_member(trip_id))
  ) with check (
    poll_id in (select id from public.schedule_polls where public.is_trip_member(trip_id))
  );

create policy "poll_responses: member" on public.poll_responses
  for all using (
    poll_id in (select id from public.schedule_polls where public.is_trip_member(trip_id))
  ) with check (
    poll_id in (select id from public.schedule_polls where public.is_trip_member(trip_id))
  );

create policy "plan_items: member" on public.plan_items
  for all using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));

create policy "memos: member" on public.memos
  for all using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));

create policy "expenses: member" on public.expenses
  for all using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));

create policy "expense_splits: member" on public.expense_splits
  for all using (
    expense_id in (select id from public.expenses where public.is_trip_member(trip_id))
  ) with check (
    expense_id in (select id from public.expenses where public.is_trip_member(trip_id))
  );

-- Realtime有効化
alter publication supabase_realtime add table public.poll_responses;
alter publication supabase_realtime add table public.plan_items;
