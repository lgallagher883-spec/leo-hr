-- Additive fields for employer-recorded DBS Update Service safeguards.
-- The Update Service subscription remains personal to the certificate holder;
-- Leo records the employer's status-check evidence only.

alter table public.employee_dbs_checks
  add column if not exists update_service_consent_confirmed boolean,
  add column if not exists update_service_certificate_seen boolean,
  add column if not exists update_service_identity_confirmed boolean,
  add column if not exists update_service_eligibility_confirmed boolean,
  add column if not exists update_service_result text;

comment on column public.employee_dbs_checks.update_service_consent_confirmed is
  'Employer records that the individual consented to the DBS Update Service status check.';
comment on column public.employee_dbs_checks.update_service_certificate_seen is
  'Employer records that the original DBS certificate was viewed before Update Service checking.';
comment on column public.employee_dbs_checks.update_service_identity_confirmed is
  'Employer records that identity was checked before Update Service checking.';
comment on column public.employee_dbs_checks.update_service_eligibility_confirmed is
  'Employer records legal entitlement to the same DBS level/type and relevant workforce before an Update Service check.';
comment on column public.employee_dbs_checks.update_service_result is
  'Employer-recorded result of the DBS Update Service status check.';
