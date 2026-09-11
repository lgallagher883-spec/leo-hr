alter table public.employee_employment_details
  add column if not exists continuous_service_date date;

comment on column public.employee_employment_details.continuous_service_date is
  'Date from which statutory continuous employment is recognised where different from the employee start date.';
