-- Restrict employer-side access to special-category medical data.
-- Employee self-service medical access uses the permission-checked server route.

drop policy if exists "leo_employees_select" on public.employee_medical;
drop policy if exists "leo_employees_insert" on public.employee_medical;
drop policy if exists "leo_employees_update" on public.employee_medical;
drop policy if exists "leo_employees_delete" on public.employee_medical;

create policy "leo_employee_medical_select_privileged"
on public.employee_medical
for select
to authenticated
using (
  exists (
    select 1
    from public.organisation_memberships membership
    where membership.organisation_id = public.leo_employee_organisation_id(employee_medical.employee_id)
      and membership.user_id = auth.uid()
      and membership.membership_status = 'active'
      and lower(coalesce(membership.role, '')) in ('owner','senior')
  )
);

create policy "leo_employee_medical_insert_privileged"
on public.employee_medical
for insert
to authenticated
with check (
  exists (
    select 1
    from public.organisation_memberships membership
    where membership.organisation_id = public.leo_employee_organisation_id(employee_medical.employee_id)
      and membership.user_id = auth.uid()
      and membership.membership_status = 'active'
      and lower(coalesce(membership.role, '')) in ('owner','senior')
  )
);

create policy "leo_employee_medical_update_privileged"
on public.employee_medical
for update
to authenticated
using (
  exists (
    select 1
    from public.organisation_memberships membership
    where membership.organisation_id = public.leo_employee_organisation_id(employee_medical.employee_id)
      and membership.user_id = auth.uid()
      and membership.membership_status = 'active'
      and lower(coalesce(membership.role, '')) in ('owner','senior')
  )
)
with check (
  exists (
    select 1
    from public.organisation_memberships membership
    where membership.organisation_id = public.leo_employee_organisation_id(employee_medical.employee_id)
      and membership.user_id = auth.uid()
      and membership.membership_status = 'active'
      and lower(coalesce(membership.role, '')) in ('owner','senior')
  )
);

create policy "leo_employee_medical_delete_privileged"
on public.employee_medical
for delete
to authenticated
using (
  exists (
    select 1
    from public.organisation_memberships membership
    where membership.organisation_id = public.leo_employee_organisation_id(employee_medical.employee_id)
      and membership.user_id = auth.uid()
      and membership.membership_status = 'active'
      and lower(coalesce(membership.role, '')) in ('owner','senior')
  )
);
