import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  type ResearchEventInput,
  validateResearchEvent,
} from "@/lib/research/events";
import { pseudonymiseOrganisationId } from "@/lib/research/pseudonym";

function researchAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Research event storage is not configured.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type ResearchWriteContext = {
  organisationId: string;
};

export async function recordResearchEvent(
  input: ResearchEventInput,
  context: ResearchWriteContext,
): Promise<void> {
  const safe = validateResearchEvent(input);
  const organisationKey = pseudonymiseOrganisationId(context.organisationId);

  const supabase = researchAdminClient();
  const { error } = await supabase.from("research_events").insert({
    event_type: safe.eventType,
    event_category: safe.eventCategory ?? null,
    organisation_key: organisationKey,
    organisation_size_band: safe.organisationSizeBand,
    industry_group: safe.industryGroup,
    properties: safe.properties ?? {},
    schema_version: 1,
    occurred_at: safe.occurredAt ?? new Date().toISOString(),
  });

  if (error) throw new Error(`Research event could not be recorded: ${error.message}`);
}

/**
 * Research must never break the employer's HR action.
 * Use this only after the underlying application state change has succeeded.
 */
export async function recordResearchEventBestEffort(
  input: ResearchEventInput,
  context: ResearchWriteContext,
): Promise<void> {
  try {
    await recordResearchEvent(input, context);
  } catch (error) {
    console.warn("Research event was not recorded:", error);
  }
}
