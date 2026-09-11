-- Platform validation views expose platform-wide operational/security
-- information and are not part of the customer-facing application.
-- Keep them unavailable through anon/authenticated PostgREST access.

alter view public.leo_platform_validation_latest set (security_invoker = true);
alter view public.leo_platform_health set (security_invoker = true);

revoke select on public.leo_platform_validation_latest from anon, authenticated;
revoke select on public.leo_platform_health from anon, authenticated;
