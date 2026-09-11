-- Ensure internal Talent reporting views execute with the caller's
-- permissions/RLS and are never directly readable by anonymous users.

alter view public.leo_talent_candidate_application_view
  set (security_invoker = true);
alter view public.leo_talent_dashboard_metrics_view
  set (security_invoker = true);
alter view public.leo_talent_pre_employment_progress_view
  set (security_invoker = true);
alter view public.leo_talent_upcoming_interviews_view
  set (security_invoker = true);
alter view public.leo_talent_vacancy_pipeline_view
  set (security_invoker = true);

revoke select on public.leo_talent_candidate_application_view from anon;
revoke select on public.leo_talent_dashboard_metrics_view from anon;
revoke select on public.leo_talent_pre_employment_progress_view from anon;
revoke select on public.leo_talent_upcoming_interviews_view from anon;
revoke select on public.leo_talent_vacancy_pipeline_view from anon;

grant select on public.leo_talent_candidate_application_view to authenticated;
grant select on public.leo_talent_dashboard_metrics_view to authenticated;
grant select on public.leo_talent_pre_employment_progress_view to authenticated;
grant select on public.leo_talent_upcoming_interviews_view to authenticated;
grant select on public.leo_talent_vacancy_pipeline_view to authenticated;
