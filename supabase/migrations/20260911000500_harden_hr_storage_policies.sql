-- Security hardening for Supabase Storage used by Leo HR.
-- IMPORTANT: deploy the corresponding server-side storage routes before
-- applying the candidate, matter, company and policy bucket changes.

-- Record the already-applied removal of the unsafe anonymous employee policy.
drop policy if exists "Allow temporary anon upload employee documents"
on storage.objects;

-- Candidate documents: access is handled through permission-checked server routes.
drop policy if exists "Authenticated candidate document read"
on storage.objects;
drop policy if exists "Authenticated candidate document upload"
on storage.objects;
drop policy if exists "Authenticated candidate document update"
on storage.objects;
drop policy if exists "Authenticated candidate document delete"
on storage.objects;

-- Matter documents: access is handled through permission-checked server routes.
drop policy if exists "Authenticated matter document read"
on storage.objects;
drop policy if exists "Authenticated matter document upload"
on storage.objects;
drop policy if exists "Authenticated matter document delete"
on storage.objects;

-- Company and policy documents must not be publicly deliverable.
update storage.buckets
set public = false
where id in ('company-documents', 'policy-documents');

drop policy if exists "Allow public reads from company documents"
on storage.objects;
drop policy if exists "Allow public uploads to company documents"
on storage.objects;
drop policy if exists "Allow public reads from policy documents"
on storage.objects;
drop policy if exists "Allow public uploads to policy documents"
on storage.objects;
