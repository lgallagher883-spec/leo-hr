-- Atomically provision exactly one Employer Support Matter from one paid purchase.
-- The purchase row is locked for the transaction so concurrent Stripe retries cannot create duplicates.

create or replace function public.leo_provision_employer_support_matter(p_purchase_id bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.leo_employer_support_purchases%rowtype;
  v_matter_id bigint;
  v_issue text;
begin
  select *
    into v_purchase
  from public.leo_employer_support_purchases
  where id = p_purchase_id
  for update;

  if not found then
    raise exception 'Employer Support purchase could not be loaded.';
  end if;

  if v_purchase.status = 'provisioned' and v_purchase.matter_id is not null then
    return v_purchase.matter_id;
  end if;

  if v_purchase.status <> 'paid' then
    raise exception 'Employer Support Matter cannot be provisioned before payment is confirmed.';
  end if;

  v_issue := btrim(coalesce(v_purchase.initial_issue, ''));
  if v_issue = '' then
    raise exception 'Employer Support purchase has no initial issue to provision.';
  end if;

  insert into public.matters (
    organisation_id,
    product_source,
    title,
    subject,
    matter_type,
    description,
    status,
    workflow_stage
  )
  values (
    v_purchase.organisation_id,
    'employer_support',
    'Employer Support Matter',
    'Employee relations issue',
    'Employer Support',
    v_issue,
    'Open',
    'Initial Assessment'
  )
  returning id into v_matter_id;

  update public.leo_employer_support_purchases
  set matter_id = v_matter_id,
      status = 'provisioned',
      provisioned_at = now(),
      updated_at = now()
  where id = v_purchase.id;

  return v_matter_id;
end;
$$;

revoke all on function public.leo_provision_employer_support_matter(bigint) from public;
revoke all on function public.leo_provision_employer_support_matter(bigint) from anon;
revoke all on function public.leo_provision_employer_support_matter(bigint) from authenticated;
grant execute on function public.leo_provision_employer_support_matter(bigint) to service_role;

comment on function public.leo_provision_employer_support_matter(bigint) is
  'Service-role-only atomic provisioning for one paid Employer Support purchase. Locks the purchase row and returns the existing Matter on retries.';
