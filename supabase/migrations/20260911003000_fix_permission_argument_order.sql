-- Correct legacy positional calls to leo_has_permission.
-- Canonical signature:
--   leo_has_permission(target_organisation_id, target_permission_key, target_user_id)
--
-- These replacements preserve each existing function body and only correct the
-- permission-call argument order.

do $$
declare
  r record;
  definition text;
  updated_definition text;
begin
  for r in
    select p.oid, p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'leo_approve_foundation_profile',
        'leo_complete_workflow_action',
        'leo_create_notification',
        'leo_register_knowledge_source',
        'leo_request_ai_execution',
        'leo_request_insight_export',
        'leo_request_platform_admin_export',
        'leo_request_workflow',
        'leo_retrieve_organisation_memory',
        'leo_review_ai_output',
        'leo_set_platform_feature_flag'
      )
  loop
    definition := pg_get_functiondef(r.oid);
    updated_definition := definition;

    updated_definition := replace(updated_definition,
      'public.leo_has_permission(auth.uid(),''foundations.approve'',p_organisation_id)',
      'public.leo_has_permission(p_organisation_id,''foundations.approve'',auth.uid())');

    updated_definition := replace(updated_definition,
      'public.leo_has_permission(auth.uid(),''workflow.action'',p_organisation_id)',
      'public.leo_has_permission(p_organisation_id,''workflow.action'',auth.uid())');
    updated_definition := replace(updated_definition,
      'public.leo_has_permission(auth.uid(),''automation.approve'',p_organisation_id)',
      'public.leo_has_permission(p_organisation_id,''automation.approve'',auth.uid())');

    updated_definition := replace(updated_definition,
      'public.leo_has_permission(auth.uid(),''notifications.send'',p_organisation_id)',
      'public.leo_has_permission(p_organisation_id,''notifications.send'',auth.uid())');

    updated_definition := replace(updated_definition,
      'public.leo_has_permission(auth.uid(),''knowledge.manage'',p_organisation_id)',
      'public.leo_has_permission(p_organisation_id,''knowledge.manage'',auth.uid())');

    updated_definition := replace(updated_definition,
      'public.leo_has_permission(auth.uid(),''ai_execution.request'',p_organisation_id)',
      'public.leo_has_permission(p_organisation_id,''ai_execution.request'',auth.uid())');

    updated_definition := replace(updated_definition,
      'public.leo_has_permission(auth.uid(), ''insights_exports.execute'', p_organisation_id)',
      'public.leo_has_permission(p_organisation_id, ''insights_exports.execute'', auth.uid())');

    updated_definition := replace(updated_definition,
      'public.leo_has_permission(auth.uid(),''platform_admin_export.execute'',p_organisation_id)',
      'public.leo_has_permission(p_organisation_id,''platform_admin_export.execute'',auth.uid())');

    updated_definition := replace(updated_definition,
      'public.leo_has_permission(auth.uid(),''automation.execute'',p_organisation_id)',
      'public.leo_has_permission(p_organisation_id,''automation.execute'',auth.uid())');

    updated_definition := replace(updated_definition,
      'public.leo_has_permission(auth.uid(),''organisation_memory_ai.use'',p_organisation_id)',
      'public.leo_has_permission(p_organisation_id,''organisation_memory_ai.use'',auth.uid())');

    updated_definition := replace(updated_definition,
      'public.leo_has_permission(auth.uid(),''ai_execution.review'',v_execution.organisation_id)',
      'public.leo_has_permission(v_execution.organisation_id,''ai_execution.review'',auth.uid())');

    updated_definition := replace(updated_definition,
      'public.leo_has_permission(auth.uid(),''platform_feature_flags.manage'',p_organisation_id)',
      'public.leo_has_permission(p_organisation_id,''platform_feature_flags.manage'',auth.uid())');

    if updated_definition <> definition then
      execute updated_definition;
    end if;
  end loop;
end
$$;
