function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normaliseEmail(value: unknown): string | null {
  const parsed = text(value).toLowerCase();
  return parsed || null;
}

type FindCandidateOptions = {
  select?: string;
  includeArchived?: boolean;
};

export async function findSafeCandidateByOrganisationAndEmail(
  supabase: any,
  organisationId: string,
  email: string | null,
  options: FindCandidateOptions = {},
) {
  const safeEmail = normaliseEmail(email);
  if (!safeEmail) {
    return {
      matched: false,
      ambiguous: false,
      candidate: null,
    } as const;
  }

  const query = (supabase as any)
    .from("leo_talent_candidates")
    .select(options.select ?? "*")
    .eq("organisation_id", organisationId)
    .ilike("email", safeEmail)
    .order("created_at", { ascending: true });

  if (!options.includeArchived) {
    query.is("archived_at", null);
  }

  const result = await query;
  if (result.error) throw new Error(result.error.message);

  const rows = Array.isArray(result.data) ? result.data : [];
  if (rows.length === 1) {
    return {
      matched: true,
      ambiguous: false,
      candidate: rows[0],
    } as const;
  }

  if (rows.length > 1) {
    return {
      matched: false,
      ambiguous: true,
      candidate: null,
    } as const;
  }

  return {
    matched: false,
    ambiguous: false,
    candidate: null,
  } as const;
}
