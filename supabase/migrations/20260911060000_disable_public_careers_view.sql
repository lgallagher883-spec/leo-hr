-- Public careers publishing is not currently in use.
-- Remove direct public/authenticated access to the helper view and
-- force caller security semantics if it is ever re-enabled later.

alter view public.leo_public_careers_vacancies
  set (security_invoker = true);

revoke select on public.leo_public_careers_vacancies from anon, authenticated;
