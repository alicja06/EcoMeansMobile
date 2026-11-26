alter table public.households
  add column if not exists owner_id uuid
  references auth.users(id) on delete set null;

update public.households h
set owner_id = member.user_id
from (
  select household_id, (array_agg(user_id))[1] as user_id
  from public.household_members
  group by household_id
  having count(*) = 1
) as member
where h.id = member.household_id
  and h.owner_id is null;

create table if not exists public.household_invite_codes (
  token uuid primary key default gen_random_uuid(),
  household_id uuid not null
    references public.households(id) on delete cascade,
  created_by uuid not null
    references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_by uuid
    references auth.users(id) on delete set null,
  redeemed_at timestamptz
);

create index if not exists household_invite_codes_household_id_idx
  on public.household_invite_codes (household_id);

alter table public.household_invite_codes enable row level security;
revoke all on table public.household_invite_codes
  from public, anon, authenticated;

create or replace function public.protect_household_owner_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'UPDATE'
    and new.owner_id is not distinct from old.owner_id then
    return new;
  end if;

  if tg_op = 'INSERT' and new.owner_id is null then
    return new;
  end if;

  if pg_catalog.current_setting(
    'app.allow_household_owner_update',
    true
  ) is distinct from 'on' then
    raise exception 'Household ownership can only be changed through its RPC'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

create trigger protect_household_owner_on_insert
before insert on public.households
for each row
execute function public.protect_household_owner_id();

create trigger protect_household_owner_on_update
before update of owner_id on public.households
for each row
execute function public.protect_household_owner_id();

create or replace function public.set_first_household_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if (
    select count(*)
    from public.household_members hm
    where hm.household_id = new.household_id
  ) <> 1 then
    return new;
  end if;

  perform pg_catalog.set_config(
    'app.allow_household_owner_update',
    'on',
    true
  );

  update public.households
  set owner_id = new.user_id
  where id = new.household_id
    and owner_id is null;

  perform pg_catalog.set_config(
    'app.allow_household_owner_update',
    'off',
    true
  );

  return new;
end;
$function$;

create trigger set_first_household_owner_after_member_insert
after insert on public.household_members
for each row
execute function public.set_first_household_owner();

create or replace function public.transfer_household_owner_before_member_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_owner_id uuid;
  next_owner_id uuid;
begin
  select owner_id
  into current_owner_id
  from public.households
  where id = old.household_id;

  if current_owner_id = old.user_id then
    select user_id
    into next_owner_id
    from public.household_members
    where household_id = old.household_id
      and user_id <> old.user_id
    order by user_id
    limit 1;

    if next_owner_id is not null then
      perform pg_catalog.set_config(
        'app.allow_household_owner_update',
        'on',
        true
      );

      update public.households
      set owner_id = next_owner_id
      where id = old.household_id;

      perform pg_catalog.set_config(
        'app.allow_household_owner_update',
        'off',
        true
      );
    end if;
  end if;

  return old;
end;
$function$;

create trigger transfer_household_owner_before_member_delete
before delete on public.household_members
for each row
execute function public.transfer_household_owner_before_member_delete();

create or replace function public.guard_task_assignment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  household_owner_id uuid;
begin
  if tg_op = 'UPDATE'
    and new.assigned_to is not distinct from old.assigned_to then
    return new;
  end if;

  if tg_op = 'INSERT' and new.assigned_to is null then
    return new;
  end if;

  select owner_id
  into household_owner_id
  from public.households
  where id = new.household_id;

  if auth.role() is distinct from 'service_role'
    and auth.uid() is distinct from household_owner_id then
    raise exception 'Only the household owner can change task assignments'
      using errcode = '42501';
  end if;

  if new.assigned_to is not null
    and not exists (
      select 1
      from public.household_members hm
      where hm.household_id = new.household_id
        and hm.user_id::text = new.assigned_to::text
    ) then
    raise exception 'Assigned user must be a household member'
      using errcode = '23503';
  end if;

  return new;
end;
$function$;

create trigger guard_task_assignment_change
before insert or update on public.tasks
for each row
execute function public.guard_task_assignment_change();

create or replace function public.list_household_members(
  p_household_id uuid
)
returns table (
  user_id uuid,
  display_name text,
  owner_user_id uuid
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
  ) then
    raise exception 'Household membership required'
      using errcode = '42501';
  end if;

  return query
  select
    hm.user_id,
    coalesce(nullif(p.display_name, ''), 'Domownik'),
    h.owner_id
  from public.household_members hm
  join public.households h on h.id = hm.household_id
  left join public.profiles p on p.id = hm.user_id
  where hm.household_id = p_household_id
  order by
    (hm.user_id = h.owner_id) desc,
    lower(coalesce(nullif(p.display_name, ''), 'Domownik')),
    hm.user_id;
end;
$function$;

create or replace function public.set_household_owner(
  p_household_id uuid,
  p_owner_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_owner_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
  ) then
    raise exception 'Household membership required'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = p_owner_user_id
  ) then
    raise exception 'Owner must be a household member'
      using errcode = '23503';
  end if;

  perform pg_catalog.set_config(
    'app.allow_household_owner_update',
    'on',
    true
  );

  update public.households
  set owner_id = p_owner_user_id
  where id = p_household_id
    and owner_id is null;

  perform pg_catalog.set_config(
    'app.allow_household_owner_update',
    'off',
    true
  );

  select owner_id
  into current_owner_id
  from public.households
  where id = p_household_id;

  if current_owner_id is null then
    raise exception 'Household not found'
      using errcode = 'P0002';
  end if;

  return current_owner_id;
end;
$function$;

create or replace function public.create_household_invite_code(
  p_household_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  invitation_token uuid;
begin
  if auth.uid() is null or not exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
  ) then
    raise exception 'Household membership required'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.households h
    where h.id = p_household_id
      and h.owner_id = auth.uid()
  ) then
    raise exception 'Only the household owner can invite members'
      using errcode = '42501';
  end if;

  insert into public.household_invite_codes (
    household_id,
    created_by,
    expires_at
  )
  values (
    p_household_id,
    auth.uid(),
    now() + interval '7 days'
  )
  returning token into invitation_token;

  return invitation_token::text;
end;
$function$;

create or replace function public.accept_household_invite_code(
  p_code text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  invitation_id uuid;
  invitation_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.household_members hm
    where hm.user_id = auth.uid()
  ) then
    raise exception 'User already belongs to a household'
      using errcode = '23505';
  end if;

  select token, household_id
  into invitation_id, invitation_household_id
  from public.household_invite_codes
  where token::text = lower(trim(p_code))
    and redeemed_at is null
    and expires_at > now()
  for update;

  if invitation_id is null then
    raise exception 'Invitation code is invalid, expired, or already used'
      using errcode = '22023';
  end if;

  insert into public.household_members (household_id, user_id)
  values (invitation_household_id, auth.uid());

  update public.household_invite_codes
  set
    redeemed_by = auth.uid(),
    redeemed_at = now()
  where token = invitation_id;

  return invitation_household_id;
end;
$function$;

revoke all on function public.list_household_members(uuid)
  from public, anon;
grant execute on function public.list_household_members(uuid)
  to authenticated;

revoke all on function public.set_household_owner(uuid, uuid)
  from public, anon;
grant execute on function public.set_household_owner(uuid, uuid)
  to authenticated;

revoke all on function public.create_household_invite_code(uuid)
  from public, anon;
grant execute on function public.create_household_invite_code(uuid)
  to authenticated;

revoke all on function public.accept_household_invite_code(text)
  from public, anon;
grant execute on function public.accept_household_invite_code(text)
  to authenticated;
