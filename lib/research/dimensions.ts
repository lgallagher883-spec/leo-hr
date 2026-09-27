import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  bandOrganisationSize,
  type OrganisationSizeBand,
  type ResearchIndustryGroup,
} from "@/lib/research/events";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Research dimensions are not configured.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function normaliseStoredBand(value: unknown): OrganisationSizeBand | null {
  if (typeof value !== "string") return null;
  const compact = value.trim().toLowerCase().replace(/\s+/g, "");
  if (["1-9", "1–9"].includes(compact)) return "1-9";
  if (["10-49", "10–49"].includes(compact)) return "10-49";
  if (["50-249", "50–249"].includes(compact)) return "50-249";
  if (["250+", "250plus", "250-plus"].includes(compact)) return "250+";
  return null;
}

function mapIndustry(value: unknown): ResearchIndustryGroup {
  if (typeof value !== "string") return "unknown";
  const v = value.trim().toLowerCase();
  if (!v) return "unknown";

  // Intentionally conservative: only explicit broad sector language is mapped.
  if (/nurser|early years|childcare|pre-school|preschool/.test(v)) return "early_years";
  if (/care home|social care|domiciliary care|home care|care provider|adult care/.test(v)) return "care";
  if (/professional services|legal|law firm|accountan|consult|architect|agency/.test(v)) return "professional_services";
  return "other";
}

function parseFoundationEmployeeCount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const match = value.replace(/,/g, "").match(/\b(\d{1,6})\b/);
  return match ? Number(match[1]) : null;
}

export async function deriveResearchDimensions(organisationId: string): Promise<{
  organisationSizeBand: OrganisationSizeBand;
  industryGroup: ResearchIndustryGroup;
}> {
  const admin = adminClient();

  const [organisation, foundations, employeeCount] = await Promise.all([
    admin
      .from("organisations")
      .select("employee_count_band")
      .eq("id", organisationId)
      .maybeSingle(),
    admin
      .from("organisation_foundations")
      .select("key,value")
      .eq("organisation_id", organisationId)
      .eq("section", "Company Profile")
      .in("key", ["Sector / industry", "Number of employees"]),
    admin
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", organisationId),
  ]);

  const rows = foundations.data ?? [];
  const industryValue = rows.find((row) => row.key === "Sector / industry")?.value;
  const foundationEmployeeValue = rows.find((row) => row.key === "Number of employees")?.value;

  // Prefer an actual current employee count, then an existing stored band,
  // then the employer-provided Foundation count.
  let organisationSizeBand: OrganisationSizeBand = "unknown";
  if (!employeeCount.error && typeof employeeCount.count === "number" && employeeCount.count > 0) {
    organisationSizeBand = bandOrganisationSize(employeeCount.count);
  } else {
    organisationSizeBand =
      normaliseStoredBand(organisation.data?.employee_count_band) ??
      bandOrganisationSize(parseFoundationEmployeeCount(foundationEmployeeValue));
  }

  return {
    organisationSizeBand,
    industryGroup: mapIndustry(industryValue),
  };
}
