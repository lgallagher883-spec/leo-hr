insert into public.leo_audit_event_types (
  event_type,
  event_category,
  display_name,
  description,
  severity,
  is_security_event,
  is_active
)
values (
  'billing.administrative_entitlement_granted',
  'billing',
  'Administrative platform entitlement granted',
  'Recorded when an explicit administrative platform-access entitlement is granted. This entitlement is not derived from a trial or subscription.',
  'information',
  false,
  true
)
on conflict (event_type) do update set
  event_category = excluded.event_category,
  display_name = excluded.display_name,
  description = excluded.description,
  severity = excluded.severity,
  is_security_event = excluded.is_security_event,
  is_active = excluded.is_active;

create or replace function public.leo_sync_organisation_entitlement(p_organisation_id uuid)
returns public.leo_organisation_entitlements
language plpgsql
security definer
set search_path to 'public', 'auth', 'pg_catalog'
as $function$
declare
  v_existing public.leo_organisation_entitlements%rowtype;
  v_trial public.leo_organisation_trials%rowtype;
  v_subscription public.leo_organisation_subscriptions%rowtype;
  v_result public.leo_organisation_entitlements%rowtype;
  v_status text := 'inactive';
  v_from timestamptz;
  v_until timestamptz;
  v_source text := 'system';
  v_capacity integer;
begin
  if auth.uid() is not null
     and not public.leo_has_permission(p_organisation_id, 'billing_entitlements.manage', auth.uid()) then
    raise exception 'Not authorised to synchronise organisation entitlements.';
  end if;

  select * into v_existing
  from public.leo_organisation_entitlements
  where organisation_id = p_organisation_id
  limit 1;

  if v_existing.id is not null
     and v_existing.source = 'administrative'
     and v_existing.access_status = 'active' then
    return v_existing;
  end if;

  select * into v_subscription
  from public.leo_organisation_subscriptions
  where organisation_id = p_organisation_id
  limit 1;

  select * into v_trial
  from public.leo_organisation_trials
  where organisation_id = p_organisation_id
  limit 1;

  if v_subscription.id is not null and v_subscription.status = 'active' then
    v_status := 'active';
    v_from := v_subscription.current_period_starts_at;
    v_until := v_subscription.current_period_ends_at;
    v_source := 'subscription';
    v_capacity := v_subscription.employee_count;
  elsif v_subscription.id is not null and v_subscription.status = 'past_due' then
    v_status := 'grace';
    v_from := v_subscription.current_period_starts_at;
    v_until := v_subscription.current_period_ends_at;
    v_source := 'subscription';
    v_capacity := v_subscription.employee_count;
  elsif v_trial.id is not null and v_trial.status = 'active' and coalesce(v_trial.ends_at, timezone('utc', now())) > timezone('utc', now()) then
    v_status := 'trial';
    v_from := v_trial.starts_at;
    v_until := v_trial.ends_at;
    v_source := 'trial';
  elsif v_subscription.id is not null and v_subscription.status = 'suspended' then
    v_status := 'suspended';
    v_source := 'subscription';
    v_capacity := v_subscription.employee_count;
  elsif v_subscription.id is not null and v_subscription.status = 'cancelled' then
    v_status := 'cancelled';
    v_source := 'subscription';
    v_capacity := v_subscription.employee_count;
  elsif v_trial.id is not null and v_trial.status in ('expired', 'ended', 'cancelled') then
    v_status := 'expired';
    v_source := 'trial';
  end if;

  insert into public.leo_organisation_entitlements (
    organisation_id, subscription_id, trial_id,
    access_status, all_platform_features_enabled, module_restrictions,
    employee_capacity, effective_from, effective_until,
    source, reason, updated_by
  ) values (
    p_organisation_id, v_subscription.id, v_trial.id,
    v_status, true, '[]'::jsonb,
    v_capacity, v_from, v_until,
    v_source, 'Synchronised from trial and subscription records.', auth.uid()
  )
  on conflict (organisation_id) do update set
    subscription_id = excluded.subscription_id,
    trial_id = excluded.trial_id,
    access_status = excluded.access_status,
    all_platform_features_enabled = true,
    module_restrictions = '[]'::jsonb,
    employee_capacity = excluded.employee_capacity,
    effective_from = excluded.effective_from,
    effective_until = excluded.effective_until,
    source = excluded.source,
    reason = excluded.reason,
    updated_by = excluded.updated_by,
    updated_at = timezone('utc', now())
  returning * into v_result;

  perform public.leo_record_audit_event(
    p_organisation_id,
    'billing.entitlement_synchronised',
    'leo_organisation_entitlements',
    'organisation',
    null,
    'update',
    'success',
    jsonb_build_object('organisation_id', p_organisation_id),
    '{}'::jsonb,
    jsonb_build_object('access_status', v_result.access_status, 'source', v_result.source, 'employee_capacity', v_result.employee_capacity),
    timezone('utc', now()),
    auth.uid()
  );

  return v_result;
end;
$function$;