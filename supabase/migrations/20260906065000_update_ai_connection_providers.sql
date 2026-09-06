begin;

update public.connection_providers
set
  is_active = false,
  is_archived = true,
  archived_at = coalesce(archived_at, now()),
  updated_at = now()
where provider_key in ('anthropic', 'google-gemini');

update public.connection_providers
set
  name = 'ChatGPT',
  category = 'Artificial Intelligence',
  description = 'Use ChatGPT alongside Leo as a general business assistant, with secure access to approved Leo information and tools.',
  website_url = 'https://chatgpt.com',
  documentation_url = 'https://platform.openai.com/docs/apps',
  authentication_type = 'OAuth 2.0',
  connection_scope = 'Organisation',
  supports_multiple_connections = false,
  supports_webhooks = false,
  supports_background_sync = false,
  supports_import = false,
  supports_export = true,
  supports_disconnect = true,
  requires_admin_approval = true,
  setup_status = 'Planned',
  display_order = 20,
  configuration_schema = '{}'::jsonb,
  metadata = jsonb_build_object(
    'connection_model', 'chatgpt_app_mcp',
    'display_subtitle', 'Business Assistant',
    'direction', 'chatgpt_to_leo'
  ),
  is_active = true,
  is_archived = false,
  archived_at = null,
  updated_at = now()
where provider_key = 'chatgpt';

insert into public.connection_providers (
  provider_key,
  name,
  category,
  description,
  website_url,
  documentation_url,
  logo_url,
  authentication_type,
  connection_scope,
  supports_multiple_connections,
  supports_webhooks,
  supports_background_sync,
  supports_import,
  supports_export,
  supports_disconnect,
  requires_admin_approval,
  setup_status,
  display_order,
  configuration_schema,
  metadata,
  is_active,
  is_archived,
  archived_at,
  updated_at
)
select
  'chatgpt',
  'ChatGPT',
  'Artificial Intelligence',
  'Use ChatGPT alongside Leo as a general business assistant, with secure access to approved Leo information and tools.',
  'https://chatgpt.com',
  'https://platform.openai.com/docs/apps',
  null,
  'OAuth 2.0',
  'Organisation',
  false,
  false,
  false,
  false,
  true,
  true,
  true,
  'Planned',
  20,
  '{}'::jsonb,
  jsonb_build_object(
    'connection_model', 'chatgpt_app_mcp',
    'display_subtitle', 'Business Assistant',
    'direction', 'chatgpt_to_leo'
  ),
  true,
  false,
  null,
  now()
where not exists (
  select 1
  from public.connection_providers
  where provider_key = 'chatgpt'
);

commit;
