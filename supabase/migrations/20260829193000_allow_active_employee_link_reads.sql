alter table public.employee_user_links enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'employee_user_links'
      and policyname = 'employee_user_links_select_own_active_membership'
  ) then
    create policy employee_user_links_select_own_active_membership
      on public.employee_user_links
      for select
      to authenticated
      using (
        employee_user_links.user_id = auth.uid()
        and employee_user_links.link_status = 'active'
        and exists (
          select 1
          from public.organisation_memberships membership
          where membership.organisation_id = employee_user_links.organisation_id
            and membership.user_id = auth.uid()
            and membership.membership_status in ('active', 'accepted')
        )
      );
  end if;
end
$$;