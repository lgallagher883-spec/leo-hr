alter table public.leo_organisation_entitlements enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'leo_organisation_entitlements'
      and policyname = 'leo_organisation_entitlements_select_organisation_members'
  ) then
    create policy leo_organisation_entitlements_select_organisation_members
      on public.leo_organisation_entitlements
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.organisation_memberships membership
          where membership.organisation_id = leo_organisation_entitlements.organisation_id
            and membership.user_id = auth.uid()
            and membership.membership_status in ('active', 'accepted')
        )
      );
  end if;
end
$$;