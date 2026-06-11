alter table public.plan_items rename to activities;
alter policy "plan_items: member" on public.activities rename to "activities: member";
