create or replace function public.prepare_account_deletion(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  target_household_id uuid;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Service role required'
      using errcode = '42501';
  end if;

  if p_user_id is null then
    raise exception 'User id is required'
      using errcode = '22004';
  end if;

  lock table public.household_members in share row exclusive mode;

  for target_household_id in
    select h.id
    from public.households h
    join public.household_members hm on hm.household_id = h.id
    where hm.user_id = p_user_id
    order by h.id
  loop
    if exists (
      select 1
      from public.household_members hm
      where hm.household_id = target_household_id
        and hm.user_id <> p_user_id
    ) then
      update public.tasks
      set assigned_to = null
      where household_id = target_household_id
        and assigned_to::text = p_user_id::text;

      update public.task_history
      set completed_by = null
      where household_id = target_household_id
        and completed_by::text = p_user_id::text;

      delete from public.household_members
      where household_id = target_household_id
        and user_id = p_user_id;
    else
      delete from public.task_history
      where household_id = target_household_id;

      delete from public.tasks
      where household_id = target_household_id;

      delete from public.shopping_items
      where household_id = target_household_id;

      delete from public.household_members
      where household_id = target_household_id;

      delete from public.households
      where id = target_household_id;
    end if;
  end loop;

  delete from public.household_members
  where user_id = p_user_id;

  delete from public.profiles
  where id = p_user_id;
end;
$function$;

revoke all on function public.prepare_account_deletion(uuid)
  from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid)
  to service_role;
