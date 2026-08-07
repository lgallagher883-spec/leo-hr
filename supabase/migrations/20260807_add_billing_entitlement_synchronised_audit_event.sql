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
  'billing.entitlement_synchronised',
  'billing',
  'Billing entitlement synchronised',
  'Recorded when an organisation entitlement is synchronised from its trial or subscription record.',
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