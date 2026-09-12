-- Honour authoritative role assignments as well as legacy membership.role
-- when evaluating access to special-category employee medical data.

drop policy if exists "leo_employee_medical_select_privileged" on public.employee_medical;
drop policy if exists "leo_employee_medical_insert_privileged" on public.employee_medical;
drop policy if exists "leo_employee_medical_update_privileged" on public.employee_medical;
drop policy if exists "leo_employee_medical_delete_privileged" on public.employee_medical;

create policy "leo_employee_medical_select_privileged"
on public.employee_medical
for select
to authenticated
using (
  public.leo_has_role(public.leo_employee_organisation_id(employee_medical.employee_id), 'owner', auth.uid())
  or public.leo_has_role(public.leo_employee_organisation_id(employee_medical.employee_id), 'senior', auth.uid())
  or exists (
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
  public.leo_has_role(public.leo_employee_organisation_id(employee_medical.employee_id), 'owner', auth.uid())
  or public.leo_has_role(public.leo_employee_organisation_id(employee_medical.employee_id), 'senior', auth.uid())
  or exists (
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
  public.leo_has_role(public.leo_employee_organisation_id(employee_medical.employee_id), 'owner', auth.uid())
  or public.leo_has_role(public.leo_employee_organisation_id(employee_medical.employee_id), 'senior', auth.uid())
  or exists (
    select 1
    from public.organisation_memberships membership
    where membership.organisation_id = public.leo_employee_organisation_id(employee_medical.employee_id)
      and membership.user_id = auth.uid()
      and membership.membership_status = 'active'
      and lower(coalesce(membership.role, '')) in ('owner','senior')
  )
)
with check (
  public.leo_has_role(public.leo_employee_organisation_id(employee_medical.employee_id), 'owner', auth.uid())
  or public.leo_has_role(public.leo_employee_organisation_id(employee_medical.employee_id), 'senior', auth.uid())
  or exists (
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
  public.leo_has_role(public.leo_employee_organisation_id(employee_medical.employee_id), 'owner', auth.uid())
  or public.leo_has_role(public.leo_employee_organisation_id(employee_medical.employee_id), 'senior', auth.uid())
  or exists (
    select 1
    from public.organisation_memberships membership
    where membership.organisation_id = public.leo_employee_organisation_id(employee_medical.employee_id)
      and membership.user_id = auth.uid()
      and membership.membership_status = 'active'
      and lower(coalesce(membership.role, '')) in ('owner','senior')
  )
);
