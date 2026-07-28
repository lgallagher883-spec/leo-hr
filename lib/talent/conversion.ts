import { normaliseEmail } from "@/lib/talent/candidateDedup";

const conversionTriggerStatuses = new Set([
  "employee_created",
  "employment_commenced",
  "started",
]);

type RecordResolution = "created" | "reused";

type ConversionAccess = {
  user: { id: string };
  organisationId: string;
};

type ConvertAppointmentParams = {
  supabase: any;
  access: ConversionAccess;
  appointment: any;
  requestedStatus: string;
  appointmentResolution?: RecordResolution;
  onboardingResolution?: RecordResolution;
};

type ProfileContinuityResult = {
  transferred: string[];
  reused: string[];
  unsupported: string[];
};

type DocumentContinuityResult = {
  linked: number;
  reused: number;
  skipped: number;
  sourceTable: string | null;
};

type TimelineContinuityResult = {
  created: number;
  reused: number;
};

type RecruitmentHistoryResult = {
  completed: boolean;
  eventCount: number;
};

type ComplianceAction = "created" | "reused" | "updated" | "skipped";

type ComplianceContinuityItem = {
  check: string;
  module: string | null;
  action: ComplianceAction;
  recordId: string | null;
  reason?: string;
};

type ComplianceContinuityResult = {
  items: ComplianceContinuityItem[];
  summary: {
    created: number;
    reused: number;
    updated: number;
    skipped: number;
  };
};

export type ConversionResult = {
  employeeId: number;
  candidateId: string;
  applicationId: string;
  appointmentId: string;
  onboardingId: string;
  recordResolution: {
    employee: RecordResolution;
    candidate: RecordResolution;
    application: RecordResolution;
    appointment: RecordResolution;
    onboarding: RecordResolution;
    timeline: RecordResolution;
  };
  candidateToEmployeeLinkCompleted: boolean;
  continuity: {
    profile: ProfileContinuityResult;
    documents: DocumentContinuityResult;
    timeline: TimelineContinuityResult;
    recruitmentHistory: RecruitmentHistoryResult;
    compliance: ComplianceContinuityResult;
    decisions: {
      retained: string[];
      excluded: string[];
    };
    nonBlockingIssues: string[];
  };
  appointment: any;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | null {
  const result = text(value);
  return result || null;
}

function parseEmployeeId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  if (value && typeof value === "object") {
    const nested = (value as any).employee_id;
    return parseEmployeeId(nested);
  }
  return null;
}

function lower(value: unknown): string {
  return text(value).toLowerCase();
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  return false;
}

function readCandidateDob(candidate: any): string | null {
  const direct =
    optionalText(candidate?.date_of_birth) ?? optionalText(candidate?.dob);
  if (direct) return direct;

  const metadata =
    candidate?.metadata && typeof candidate.metadata === "object"
      ? (candidate.metadata as Record<string, unknown>)
      : null;

  if (!metadata) return null;

  return (
    optionalText(metadata.date_of_birth) ??
    optionalText(metadata.dob) ??
    optionalText(metadata.birth_date)
  );
}

function classifyRecruitmentDocument(document: any): {
  include: boolean;
  category: string;
  employeeVisibility: "employee" | "restricted";
  sensitivity: "standard" | "sensitive";
  skipReason?: string;
} {
  const type = lower(document?.document_type);
  const title = lower(document?.title) || lower(document?.file_name);
  const haystack = `${type} ${title}`;

  if (
    haystack.includes("medical") ||
    haystack.includes("health") ||
    haystack.includes("fit note") ||
    haystack.includes("occupational")
  ) {
    return {
      include: false,
      category: "excluded",
      employeeVisibility: "restricted",
      sensitivity: "sensitive",
      skipReason: "Medical or health document excluded in Phase 2.",
    };
  }

  if (haystack.includes("cv") || haystack.includes("curriculum")) {
    return {
      include: true,
      category: "cv",
      employeeVisibility: "employee",
      sensitivity: "standard",
    };
  }

  if (
    haystack.includes("right to work") ||
    haystack.includes("passport") ||
    haystack.includes("visa")
  ) {
    return {
      include: true,
      category: "right_to_work",
      employeeVisibility: "restricted",
      sensitivity: "sensitive",
    };
  }

  if (haystack.includes("dbs") || haystack.includes("safeguard")) {
    return {
      include: true,
      category: "dbs",
      employeeVisibility: "restricted",
      sensitivity: "sensitive",
    };
  }

  if (haystack.includes("driving") || haystack.includes("licence")) {
    return {
      include: true,
      category: "driving",
      employeeVisibility: "restricted",
      sensitivity: "sensitive",
    };
  }

  if (
    haystack.includes("qualification") ||
    haystack.includes("certificate") ||
    haystack.includes("registration")
  ) {
    return {
      include: true,
      category: "qualification",
      employeeVisibility: "restricted",
      sensitivity: "sensitive",
    };
  }

  if (haystack.includes("offer") || haystack.includes("appointment")) {
    return {
      include: true,
      category: "offer_and_appointment",
      employeeVisibility: "employee",
      sensitivity: "standard",
    };
  }

  if (haystack.includes("application") || haystack.includes("cover")) {
    return {
      include: true,
      category: "application_document",
      employeeVisibility: "employee",
      sensitivity: "standard",
    };
  }

  return {
    include: true,
    category: "recruitment_other",
    employeeVisibility: "restricted",
    sensitivity: "standard",
  };
}

function shouldSkipRecruitmentNotesKey(key: string) {
  const value = key.toLowerCase();
  return (
    value.includes("internal") ||
    value.includes("recruiter") ||
    value.includes("private") ||
    value.includes("confidential") ||
    value.includes("general_notes") ||
    value.includes("notes")
  );
}

function parseDateValue(value: unknown): number {
  const textValue = optionalText(value);
  if (!textValue) return 0;
  const time = new Date(textValue).getTime();
  return Number.isFinite(time) ? time : 0;
}

function isTruthy(value: unknown): boolean {
  return value === true;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: unknown) => optionalText(item))
    .filter((item: string | null): item is string => Boolean(item));
}

function findBestDate(...values: unknown[]): string | null {
  for (const value of values) {
    const parsed = optionalText(value);
    if (parsed) return parsed;
  }
  return null;
}

function isDueDiligenceCheckComplete(
  key: string,
  payload: Record<string, unknown>,
  vacancy: any,
) {
  if (key === "dbs" && vacancy?.requires_dbs === false) return true;
  if (
    key === "overseas_checks" &&
    vacancy?.overseas_check_required_if_applicable === false
  ) {
    return true;
  }
  if (
    key === "qualifications" &&
    vacancy?.requires_qualification_checks === false
  ) {
    return true;
  }
  if (key === "driving" && vacancy?.requires_driving === false) return true;
  if (key === "vehicle" && vacancy?.requires_driving === false) return true;

  const status =
    key === "identity_verification" ||
    key === "right_to_work" ||
    key === "dbs" ||
    key === "vehicle"
      ? optionalText(payload.status)
      : key === "driving"
        ? optionalText(payload.checkStatus)
        : optionalText(payload.overallStatus);

  return [
    "verified",
    "complete",
    "satisfactory",
    "active",
    "approved",
    "not_required",
    "cleared",
    "cleared_with_conditions",
  ].includes(status ?? "");
}

async function queryEmployeeScopedRows(
  supabase: any,
  table: string,
  organisationId: string,
  employeeId: number,
) {
  let result = await (supabase as any)
    .from(table)
    .select("*")
    .eq("employee_id", employeeId)
    .eq("organisation_id", organisationId)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (!result.error) {
    return {
      rows: Array.isArray(result.data) ? result.data : [],
      hasOrganisationColumn: true,
    };
  }

  if (result.error.code !== "42703") {
    throw new Error(result.error.message);
  }

  result = await (supabase as any)
    .from(table)
    .select("*")
    .eq("employee_id", employeeId)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (result.error) {
    throw new Error(result.error.message);
  }

  return {
    rows: Array.isArray(result.data) ? result.data : [],
    hasOrganisationColumn: false,
  };
}

async function resolveFirstAvailableEmployeeTable(
  supabase: any,
  tables: string[],
  organisationId: string,
  employeeId: number,
) {
  for (const table of tables) {
    try {
      const scoped = await queryEmployeeScopedRows(
        supabase,
        table,
        organisationId,
        employeeId,
      );
      return { table, ...scoped };
    } catch (error) {
      const message = lower(error instanceof Error ? error.message : error);
      if (
        message.includes("does not exist") ||
        message.includes("schema cache") ||
        message.includes("could not find the table")
      ) {
        continue;
      }
      throw error;
    }
  }

  return { table: null, rows: [] as any[], hasOrganisationColumn: true };
}

async function updateWithUnknownColumnFallback(
  supabase: any,
  table: string,
  rowId: unknown,
  payload: Record<string, unknown>,
  organisationId: string,
  hasOrganisationColumn: boolean,
) {
  const current = { ...payload };

  for (let index = 0; index < 20; index += 1) {
    let query = (supabase as any)
      .from(table)
      .update(current)
      .eq("id", rowId);

    if (hasOrganisationColumn) {
      query = query.eq("organisation_id", organisationId);
    }

    const result = await query;
    if (!result.error) return { ok: true as const };

    if (result.error.code !== "42703") {
      return { ok: false as const, error: result.error };
    }

    const unknownColumnMatch = (result.error.message ?? "").match(
      /column\s+"?([a-zA-Z0-9_]+)"?\s+/i,
    );
    const unknownColumn = unknownColumnMatch?.[1] ?? null;

    if (!unknownColumn || !(unknownColumn in current)) {
      return { ok: false as const, error: result.error };
    }

    delete current[unknownColumn];
  }

  return {
    ok: false as const,
    error: { message: "Exceeded fallback retries while updating compliance record." },
  };
}

function extractSourceRecordId(row: any): string | null {
  const metadata =
    row?.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : {};

  return (
    optionalText(row?.source_record_id) ??
    optionalText(row?.source_shared_record_id) ??
    optionalText(metadata.source_record_id) ??
    optionalText(metadata.source_shared_record_id)
  );
}

function nonEmptyFieldCount(payload: Record<string, unknown>) {
  return Object.values(payload).filter((value) => !isEmptyValue(value)).length;
}

export function isRpcUnavailable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalised = message.toLowerCase();
  return (
    normalised.includes("could not find the function") ||
    (normalised.includes("schema cache") && normalised.includes("function"))
  );
}

export function isMissingAnalyticsTable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalised = message.toLowerCase();
  return (
    normalised.includes("talent_analytics_events") &&
    (normalised.includes("could not find the table") ||
      normalised.includes("relation") ||
      normalised.includes("schema cache"))
  );
}

export function statusRequiresEmployee(status: unknown) {
  return conversionTriggerStatuses.has(text(status));
}

async function getVerifiedEmployee(
  supabase: any,
  organisationId: string,
  employeeId: number | null,
) {
  if (!employeeId) return null;

  const result = await (supabase as any)
    .from("employees")
    .select("id,organisation_id,name,email,status")
    .eq("id", employeeId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data ?? null;
}

async function findSafeEmployeeByEmail(
  supabase: any,
  organisationId: string,
  email: string | null,
) {
  const safeEmail = normaliseEmail(email);
  if (!safeEmail) return null;

  const byEmail = await (supabase as any)
    .from("employees")
    .select("id,organisation_id,name,email,status")
    .eq("organisation_id", organisationId)
    .ilike("email", safeEmail)
    .order("id", { ascending: true });

  if (byEmail.error) throw new Error(byEmail.error.message);

  const rows = Array.isArray(byEmail.data) ? byEmail.data : [];
  if (rows.length === 0) return null;
  if (rows.length > 1) {
    throw new Error(
      "More than one employee record matches the candidate email. Resolve duplicates before conversion can continue.",
    );
  }

  return rows[0];
}

async function createEmployeeFallback(
  supabase: any,
  access: ConversionAccess,
  appointment: any,
  candidate: any,
): Promise<{ employeeId: number; resolution: RecordResolution }> {
  const preferredEmail = normaliseEmail(candidate.email);
  const safeByEmail = await findSafeEmployeeByEmail(
    supabase,
    access.organisationId,
    preferredEmail,
  );
  if (safeByEmail?.id) {
    return {
      employeeId: Number(safeByEmail.id),
      resolution: "reused",
    };
  }

  const fullName =
    [optionalText(candidate.first_name), optionalText(candidate.last_name)]
      .filter(Boolean)
      .join(" ")
      .trim() || "New employee";

  const inserted = await (supabase as any)
    .from("employees")
    .insert([
      {
        organisation_id: access.organisationId,
        name: fullName,
        role: null,
        email: preferredEmail,
        start_date:
          optionalText(appointment.agreed_start_date) ??
          optionalText(appointment.actual_start_date),
        status: "Active",
      },
    ])
    .select("id")
    .single();

  if (inserted.error) {
    const message = inserted.error.message.toLowerCase();
    if (message.includes("duplicate") || inserted.error.code === "23505") {
      const racedByEmail = await findSafeEmployeeByEmail(
        supabase,
        access.organisationId,
        preferredEmail,
      );

      if (racedByEmail?.id) {
        return {
          employeeId: Number(racedByEmail.id),
          resolution: "reused",
        };
      }
    }

    throw new Error(inserted.error.message);
  }

  const employeeId = parseEmployeeId(inserted.data?.id);
  if (!employeeId) {
    throw new Error("Employee creation did not return a valid employee id.");
  }

  return {
    employeeId,
    resolution: "created",
  };
}

async function resolveEmployeeIdForConversion(
  supabase: any,
  access: ConversionAccess,
  appointment: any,
) {
  const candidateResult = await (supabase as any)
    .from("leo_talent_candidates")
    .select("*")
    .eq("id", appointment.candidate_id)
    .eq("organisation_id", access.organisationId)
    .maybeSingle();

  if (candidateResult.error) throw new Error(candidateResult.error.message);
  if (!candidateResult.data) {
    throw new Error("The candidate linked to this appointment could not be found.");
  }

  const candidate = candidateResult.data;

  let employeeId = parseEmployeeId(appointment.employee_id);
  let verified = await getVerifiedEmployee(supabase, access.organisationId, employeeId);

  if (verified?.id) {
    return {
      employeeId: Number(verified.id),
      candidate,
      employeeResolution: "reused" as const,
    };
  }

  employeeId = parseEmployeeId(candidate.existing_employee_id);
  verified = await getVerifiedEmployee(
    supabase,
    access.organisationId,
    employeeId,
  );

  if (verified?.id) {
    return {
      employeeId: Number(verified.id),
      candidate,
      employeeResolution: "reused" as const,
    };
  }

  const safeByEmail = await findSafeEmployeeByEmail(
    supabase,
    access.organisationId,
    optionalText(candidate.email),
  );
  if (safeByEmail?.id) {
    return {
      employeeId: Number(safeByEmail.id),
      candidate,
      employeeResolution: "reused" as const,
    };
  }

  if (appointment.offer_id) {
    const pending = await (supabase as any)
      .from("leo_talent_appointments")
      .update({
        status: "employee_creation_pending",
        updated_at: new Date().toISOString(),
        updated_by: access.user.id,
      })
      .eq("id", String(appointment.id))
      .eq("organisation_id", access.organisationId);

    if (pending.error) throw new Error(pending.error.message);

    const rpcResult = await (supabase as any).rpc(
      "convert_talent_candidate_to_employee",
      {
        p_offer_id: appointment.offer_id,
      },
    );

    if (!rpcResult.error) {
      employeeId = parseEmployeeId(rpcResult.data);

      if (!employeeId) {
        const refreshed = await (supabase as any)
          .from("leo_talent_appointments")
          .select("employee_id")
          .eq("id", String(appointment.id))
          .eq("organisation_id", access.organisationId)
          .maybeSingle();

        if (refreshed.error) throw new Error(refreshed.error.message);
        employeeId = parseEmployeeId(refreshed.data?.employee_id);
      }

      verified = await getVerifiedEmployee(
        supabase,
        access.organisationId,
        employeeId,
      );

      if (verified?.id) {
        return {
          employeeId: Number(verified.id),
          candidate,
          employeeResolution: "created" as const,
        };
      }
    } else if (!isRpcUnavailable(rpcResult.error)) {
      throw new Error(rpcResult.error.message);
    }
  }

  const fallback = await createEmployeeFallback(
    supabase,
    access,
    appointment,
    candidate,
  );

  const fallbackVerified = await getVerifiedEmployee(
    supabase,
    access.organisationId,
    fallback.employeeId,
  );

  if (!fallbackVerified?.id) {
    throw new Error(
      "Employee conversion completed without a verifiable employee record in this organisation.",
    );
  }

  return {
    employeeId: Number(fallbackVerified.id),
    candidate,
    employeeResolution: fallback.resolution,
  };
}

async function writeTalentActivity(
  supabase: any,
  organisationId: string,
  actorUserId: string,
  appointmentId: string,
  eventType: string,
  description: string,
  metadata: Record<string, unknown> = {},
) {
  const result = await (supabase as any).from("talent_analytics_events").insert({
    organisation_id: organisationId,
    event_type: eventType,
    entity_type: "appointment",
    entity_id: appointmentId,
    actor_user_id: actorUserId,
    description,
    metadata,
  });

  if (result.error) {
    if (isMissingAnalyticsTable(result.error)) {
      console.warn(
        "Talent analytics logging is unavailable (missing talent_analytics_events). Conversion will continue.",
      );
    } else {
      console.warn("Appointment activity could not be recorded:", result.error);
    }
  }
}

async function ensureEmploymentDetails(
  supabase: any,
  employeeId: number,
  managerName: string | null,
) {
  const existing = await (supabase as any)
    .from("employee_employment_details")
    .select("id")
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);
  if (existing.data?.id) return;

  const now = new Date().toISOString();
  const created = await (supabase as any).from("employee_employment_details").insert({
    employee_id: employeeId,
    manager: managerName,
    created_at: now,
    updated_at: now,
  });

  if (created.error && created.error.code !== "23505") {
    throw new Error(created.error.message);
  }
}

async function ensureEmployeeTimeline(
  supabase: any,
  organisationId: string,
  employeeId: number,
  appointmentId: string,
  actorUserId: string,
): Promise<RecordResolution> {
  const existing = await (supabase as any)
    .from("employee_timeline")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("employee_id", employeeId)
    .eq("event_type", "Talent Appointment Confirmed")
    .eq("source_module", "Talent")
    .eq("source_record_id", appointmentId)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);
  if (existing.data?.id) return "reused";

  const now = new Date().toISOString();
  const inserted = await (supabase as any).from("employee_timeline").insert({
    organisation_id: organisationId,
    employee_id: employeeId,
    event_type: "Talent Appointment Confirmed",
    title: "Employment confirmed",
    description:
      "Candidate was converted to employee from the Talent onboarding appointment.",
    status: "complete",
    source_module: "Talent",
    source_record_id: appointmentId,
    metadata: {
      conversion_source: "onboarding_confirm_employment",
    },
    event_date: now,
    created_by: actorUserId,
    created_at: now,
  });

  if (inserted.error) {
    if (inserted.error.code === "23505") return "reused";
    throw new Error(inserted.error.message);
  }

  return "created";
}

async function ensureEmployeeTimelineEvent(
  supabase: any,
  organisationId: string,
  employeeId: number,
  actorUserId: string,
  eventType: string,
  title: string,
  description: string,
  sourceRecordId: string,
  metadata: Record<string, unknown>,
): Promise<RecordResolution> {
  const existing = await (supabase as any)
    .from("employee_timeline")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("employee_id", employeeId)
    .eq("source_module", "Talent")
    .eq("source_record_id", sourceRecordId)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);
  if (existing.data?.id) return "reused";

  const now = new Date().toISOString();
  const inserted = await (supabase as any).from("employee_timeline").insert({
    organisation_id: organisationId,
    employee_id: employeeId,
    event_type: eventType,
    title,
    description,
    status: "complete",
    source_module: "Talent",
    source_record_id: sourceRecordId,
    metadata,
    event_date: now,
    created_by: actorUserId,
    created_at: now,
  });

  if (inserted.error) {
    if (inserted.error.code === "23505") return "reused";
    throw new Error(inserted.error.message);
  }

  return "created";
}

async function ensureCandidateProfileContinuity(
  supabase: any,
  organisationId: string,
  employeeId: number,
  candidate: any,
): Promise<ProfileContinuityResult> {
  const employeeResult = await (supabase as any)
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (employeeResult.error) throw new Error(employeeResult.error.message);
  if (!employeeResult.data) {
    throw new Error(
      "Employee profile continuity could not load the employee record.",
    );
  }

  const employee = employeeResult.data as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  const transferred: string[] = [];
  const reused: string[] = [];
  const unsupported: string[] = [];

  const legalName = [optionalText(candidate.first_name), optionalText(candidate.last_name)]
    .filter(Boolean)
    .join(" ")
    .trim();

  const setIfSupportedAndEmpty = (
    employeeField: string,
    candidateValue: unknown,
    label: string,
  ) => {
    if (!(employeeField in employee)) {
      unsupported.push(label);
      return;
    }

    const employeeValue = employee[employeeField];
    if (isEmptyValue(employeeValue) && !isEmptyValue(candidateValue)) {
      update[employeeField] = candidateValue;
      transferred.push(label);
      return;
    }

    if (!isEmptyValue(employeeValue)) {
      reused.push(label);
    }
  };

  setIfSupportedAndEmpty("name", legalName, "legal_name");
  setIfSupportedAndEmpty(
    "email",
    normaliseEmail(candidate.email),
    "personal_email",
  );

  // Supported employee schemas vary by deployment, so only fill columns that exist.
  setIfSupportedAndEmpty("preferred_name", candidate.preferred_name, "preferred_name");
  setIfSupportedAndEmpty("phone", candidate.phone, "phone");
  setIfSupportedAndEmpty("phone_number", candidate.phone, "phone_number");
  setIfSupportedAndEmpty("mobile_phone", candidate.phone, "mobile_phone");
  setIfSupportedAndEmpty("address_line_1", candidate.address_line_1, "address_line_1");
  setIfSupportedAndEmpty("address_line_2", candidate.address_line_2, "address_line_2");
  setIfSupportedAndEmpty("town_city", candidate.town_city, "town_city");
  setIfSupportedAndEmpty("county_region", candidate.county_region, "county_region");
  setIfSupportedAndEmpty("postcode", candidate.postcode, "postcode");
  setIfSupportedAndEmpty("country", candidate.country, "country");
  setIfSupportedAndEmpty("date_of_birth", readCandidateDob(candidate), "date_of_birth");
  setIfSupportedAndEmpty("dob", readCandidateDob(candidate), "dob");

  const metadata =
    candidate.metadata && typeof candidate.metadata === "object"
      ? (candidate.metadata as Record<string, unknown>)
      : {};

  const supportedMetadataPersonalKeys = [
    "title",
    "pronouns",
    "nationality",
  ];

  for (const key of supportedMetadataPersonalKeys) {
    if (shouldSkipRecruitmentNotesKey(key)) continue;
    setIfSupportedAndEmpty(key, metadata[key], key);
  }

  if (Object.keys(update).length > 0) {
    update.updated_at = new Date().toISOString();
    const updateResult = await (supabase as any)
      .from("employees")
      .update(update)
      .eq("id", employeeId)
      .eq("organisation_id", organisationId);

    if (updateResult.error) throw new Error(updateResult.error.message);
  }

  return {
    transferred,
    reused,
    unsupported: Array.from(new Set(unsupported)),
  };
}

async function resolveEmployeeDocumentTable(
  supabase: any,
  employeeId: number,
  organisationId: string,
) {
  const tables = [
    "employee_documents",
    "leo_employee_documents",
    "employee_document_records",
  ];

  for (const tableName of tables) {
    const result = await (supabase as any)
      .from(tableName)
      .select("*")
      .eq("employee_id", employeeId)
      .eq("organisation_id", organisationId)
      .limit(200);

    if (!result.error) {
      return {
        table: tableName,
        records: Array.isArray(result.data) ? result.data : [],
      };
    }

    const message = lower(result.error?.message);
    if (
      result.error?.code === "42P01" ||
      result.error?.code === "PGRST200" ||
      result.error?.code === "PGRST204" ||
      result.error?.code === "PGRST205" ||
      message.includes("does not exist") ||
      message.includes("schema cache") ||
      message.includes("could not find the table")
    ) {
      continue;
    }

    throw new Error(result.error.message);
  }

  return { table: null, records: [] as any[] };
}

async function insertWithUnknownColumnFallback(
  supabase: any,
  table: string,
  payload: Record<string, unknown>,
) {
  const current = { ...payload };

  for (let index = 0; index < 20; index += 1) {
    const result = await (supabase as any).from(table).insert(current);
    if (!result.error) return { ok: true as const };

    const code = result.error.code;
    const message = result.error.message ?? "";
    if (code !== "42703") {
      return { ok: false as const, error: result.error };
    }

    const unknownColumnMatch = message.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+/i);
    const unknownColumn = unknownColumnMatch?.[1] ?? null;

    if (!unknownColumn || !(unknownColumn in current)) {
      return { ok: false as const, error: result.error };
    }

    delete current[unknownColumn];
  }

  return {
    ok: false as const,
    error: { message: "Exceeded fallback retries while inserting employee documents." },
  };
}

function isExistingEmployeeDocumentMatch(existing: any, sourceDocumentId: string, filePath: string) {
  const metadata =
    existing?.metadata && typeof existing.metadata === "object"
      ? (existing.metadata as Record<string, unknown>)
      : {};

  const existingSourceId =
    optionalText(existing?.source_candidate_document_id) ??
    optionalText(existing?.source_document_id) ??
    optionalText(existing?.original_document_id) ??
    optionalText(metadata.source_candidate_document_id) ??
    optionalText(metadata.source_document_id);

  const existingPath =
    optionalText(existing?.file_path) ??
    optionalText(existing?.storage_path) ??
    optionalText(metadata.source_file_path);

  return existingSourceId === sourceDocumentId || existingPath === filePath;
}

async function ensureRecruitmentDocumentContinuity(
  supabase: any,
  organisationId: string,
  employeeId: number,
  candidateId: string,
  nonBlockingIssues: string[],
): Promise<DocumentContinuityResult> {
  const candidateDocuments = await (supabase as any)
    .from("leo_talent_candidate_documents")
    .select("*")
    .eq("organisation_id", organisationId)
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: true });

  if (candidateDocuments.error) {
    throw new Error(candidateDocuments.error.message);
  }

  const sourceRows = Array.isArray(candidateDocuments.data)
    ? candidateDocuments.data
    : [];

  const documentTableResult = await resolveEmployeeDocumentTable(
    supabase,
    employeeId,
    organisationId,
  );

  if (!documentTableResult.table) {
    nonBlockingIssues.push(
      "No employee document table is available. Recruitment documents remain linked through candidate records.",
    );

    return {
      linked: 0,
      reused: 0,
      skipped: sourceRows.length,
      sourceTable: null,
    };
  }

  let linked = 0;
  let reused = 0;
  let skipped = 0;
  const existingRows = [...documentTableResult.records];

  for (const document of sourceRows) {
    const classification = classifyRecruitmentDocument(document);
    if (!classification.include) {
      skipped += 1;
      continue;
    }

    const sourceDocumentId = String(document.id);
    const sourceFilePath = optionalText(document.file_path) ?? "";

    const exists = existingRows.some((row) =>
      isExistingEmployeeDocumentMatch(row, sourceDocumentId, sourceFilePath),
    );

    if (exists) {
      reused += 1;
      continue;
    }

    const payload: Record<string, unknown> = {
      organisation_id: organisationId,
      employee_id: employeeId,
      document_type: optionalText(document.document_type) ?? classification.category,
      category: classification.category,
      title:
        optionalText(document.title) ??
        optionalText(document.file_name) ??
        "Recruitment document",
      file_name: optionalText(document.file_name),
      file_path: optionalText(document.file_path),
      storage_path: optionalText(document.file_path),
      mime_type: optionalText(document.mime_type),
      file_size_bytes:
        typeof document.file_size_bytes === "number"
          ? document.file_size_bytes
          : null,
      visible_to_employee: classification.employeeVisibility === "employee",
      is_permanent_record: true,
      deletion_locked: true,
      source_module: "Talent",
      source_table: "leo_talent_candidate_documents",
      source_record_id: sourceDocumentId,
      source_candidate_document_id: sourceDocumentId,
      metadata: {
        recruitment_source: true,
        source_candidate_id: candidateId,
        source_candidate_document_id: sourceDocumentId,
        source_file_path: optionalText(document.file_path),
        sensitivity: classification.sensitivity,
        visibility: classification.employeeVisibility,
      },
      created_at:
        optionalText(document.created_at) ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const insert = await insertWithUnknownColumnFallback(
      supabase,
      documentTableResult.table,
      payload,
    );

    if (!insert.ok) {
      nonBlockingIssues.push(
        `Recruitment document ${sourceDocumentId} could not be linked to ${documentTableResult.table}: ${insert.error.message}`,
      );
      skipped += 1;
      continue;
    }

    linked += 1;
    existingRows.push(payload);
  }

  return {
    linked,
    reused,
    skipped,
    sourceTable: documentTableResult.table,
  };
}

async function ensureRecruitmentHistoryContinuity(
  supabase: any,
  access: ConversionAccess,
  employeeId: number,
  candidate: any,
  appointment: any,
  applicationId: string,
  appointmentId: string,
  nonBlockingIssues: string[],
): Promise<{ timeline: TimelineContinuityResult; history: RecruitmentHistoryResult }> {
  const timelineResult: TimelineContinuityResult = { created: 0, reused: 0 };

  const [applicationResult, vacancyResult, interviewsResult, offerResult, decisionResult] =
    await Promise.all([
      (supabase as any)
        .from("leo_talent_applications")
        .select("*")
        .eq("id", applicationId)
        .eq("organisation_id", access.organisationId)
        .maybeSingle(),
      (supabase as any)
        .from("leo_talent_vacancies")
        .select("id,vacancy_reference,title")
        .eq("id", appointment.vacancy_id)
        .eq("organisation_id", access.organisationId)
        .maybeSingle(),
      (supabase as any)
        .from("leo_talent_interviews")
        .select("id,interview_reference,stage_name,scheduled_start,completed_at,outcome,status")
        .eq("organisation_id", access.organisationId)
        .eq("application_id", applicationId)
        .order("scheduled_start", { ascending: true }),
      appointment.offer_id
        ? (supabase as any)
            .from("leo_talent_offers")
            .select("id,offer_reference,status,sent_at,accepted_at,approval_status")
            .eq("id", appointment.offer_id)
            .eq("organisation_id", access.organisationId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      (supabase as any)
        .from("leo_talent_candidate_shared_records")
        .select("payload,updated_at")
        .eq("organisation_id", access.organisationId)
        .eq("application_id", applicationId)
        .eq("component_key", "appointment_decision")
        .order("updated_at", { ascending: false })
        .limit(1),
    ]);

  if (applicationResult.error) throw new Error(applicationResult.error.message);
  if (vacancyResult.error) throw new Error(vacancyResult.error.message);
  if (interviewsResult.error) throw new Error(interviewsResult.error.message);
  if (offerResult?.error) throw new Error(offerResult.error.message);
  if (decisionResult.error) throw new Error(decisionResult.error.message);

  const application = applicationResult.data;
  const vacancy = vacancyResult.data;
  const interviews = Array.isArray(interviewsResult.data) ? interviewsResult.data : [];
  const offer = offerResult?.data ?? null;

  const decisionPayload =
    Array.isArray(decisionResult.data) && decisionResult.data.length > 0
      ? decisionResult.data[0]?.payload
      : null;

  const events: Array<{
    key: string;
    eventType: string;
    title: string;
    description: string;
    metadata: Record<string, unknown>;
  }> = [];

  events.push({
    key: "application_received",
    eventType: "Talent Application Received",
    title: "Application received",
    description: "Candidate application entered the recruitment pipeline.",
    metadata: {
      candidate_id: candidate.id,
      application_id: applicationId,
      vacancy_id: appointment.vacancy_id,
      appointment_id: appointmentId,
      submitted_at: application?.submitted_at ?? null,
    },
  });

  events.push({
    key: "vacancy_applied",
    eventType: "Talent Vacancy Applied",
    title: "Vacancy applied for",
    description: vacancy?.title
      ? `Application was submitted for ${vacancy.title}.`
      : "Application was submitted for a recorded vacancy.",
    metadata: {
      candidate_id: candidate.id,
      application_id: applicationId,
      vacancy_id: appointment.vacancy_id,
      vacancy_reference: vacancy?.vacancy_reference ?? null,
    },
  });

  events.push({
    key: "application_progression",
    eventType: "Talent Application Progressed",
    title: "Application progression recorded",
    description: "Application stage and status progression were recorded.",
    metadata: {
      candidate_id: candidate.id,
      application_id: applicationId,
      current_stage_key: application?.current_stage_key ?? null,
      application_status: application?.status ?? null,
      updated_at: application?.updated_at ?? null,
    },
  });

  for (const interview of interviews) {
    events.push({
      key: `interview_${interview.id}`,
      eventType: "Talent Interview Outcome",
      title: "Interview outcome recorded",
      description:
        optionalText(interview.stage_name)
          ? `Interview outcome recorded for ${interview.stage_name}.`
          : "Interview outcome recorded.",
      metadata: {
        candidate_id: candidate.id,
        application_id: applicationId,
        interview_id: interview.id,
        interview_reference: interview.interview_reference ?? null,
        scheduled_start: interview.scheduled_start ?? null,
        completed_at: interview.completed_at ?? null,
        interview_outcome: interview.outcome ?? null,
        interview_status: interview.status ?? null,
      },
    });
  }

  events.push({
    key: "key_recruitment_decision",
    eventType: "Talent Recruitment Decision",
    title: "Key recruitment decision recorded",
    description: "A formal recruitment decision was recorded.",
    metadata: {
      candidate_id: candidate.id,
      application_id: applicationId,
      application_recommendation: application?.recommendation ?? null,
      application_recommendation_reason:
        application?.recommendation_reason ?? null,
      application_knockout_failed: application?.knockout_failed ?? null,
      decision_outcome:
        decisionPayload && typeof decisionPayload === "object"
          ? optionalText((decisionPayload as Record<string, unknown>).outcome)
          : null,
      decision_date:
        decisionPayload && typeof decisionPayload === "object"
          ? optionalText((decisionPayload as Record<string, unknown>).decisionDate)
          : null,
      decision_updated_at:
        Array.isArray(decisionResult.data) && decisionResult.data.length > 0
          ? decisionResult.data[0]?.updated_at ?? null
          : null,
    },
  });

  if (offer?.id) {
    events.push({
      key: "offer_issued",
      eventType: "Talent Offer Issued",
      title: "Offer issued",
      description: "A formal employment offer was issued.",
      metadata: {
        candidate_id: candidate.id,
        application_id: applicationId,
        offer_id: offer.id,
        offer_reference: offer.offer_reference ?? null,
        sent_at: offer.sent_at ?? null,
        offer_status: offer.status ?? null,
        approval_status: offer.approval_status ?? null,
      },
    });

    events.push({
      key: "offer_accepted",
      eventType: "Talent Offer Accepted",
      title: "Offer accepted",
      description: "The offer was accepted and moved to appointment.",
      metadata: {
        candidate_id: candidate.id,
        application_id: applicationId,
        offer_id: offer.id,
        accepted_at: offer.accepted_at ?? null,
      },
    });
  }

  events.push({
    key: "appointment_created",
    eventType: "Talent Appointment Created",
    title: "Appointment created",
    description: "A talent appointment record was created for employment handover.",
    metadata: {
      candidate_id: candidate.id,
      application_id: applicationId,
      appointment_id: appointmentId,
      onboarding_id: appointmentId,
      offer_id: appointment.offer_id ?? null,
      agreed_start_date: appointment.agreed_start_date ?? null,
    },
  });

  events.push({
    key: "conversion_to_employee",
    eventType: "Talent Employee Conversion",
    title: "Converted to employee",
    description: "The candidate was converted into an employee record.",
    metadata: {
      candidate_id: candidate.id,
      application_id: applicationId,
      appointment_id: appointmentId,
      onboarding_id: appointmentId,
      employee_id: employeeId,
    },
  });

  for (const event of events) {
    try {
      const sourceRecordId = `${appointmentId}:recruitment_history:${event.key}`;
      const resolution = await ensureEmployeeTimelineEvent(
        supabase,
        access.organisationId,
        employeeId,
        access.user.id,
        event.eventType,
        event.title,
        event.description,
        sourceRecordId,
        {
          ...event.metadata,
          origin: "phase_2_recruitment_handover",
          source_candidate_id: candidate.id,
          source_application_id: applicationId,
          source_vacancy_id: appointment.vacancy_id,
          source_offer_id: appointment.offer_id ?? null,
          source_appointment_id: appointmentId,
          source_onboarding_id: appointmentId,
          source_interview_ids: interviews.map((item: any) => item.id),
        },
      );

      if (resolution === "created") timelineResult.created += 1;
      if (resolution === "reused") timelineResult.reused += 1;
    } catch (error) {
      nonBlockingIssues.push(
        `Recruitment timeline event ${event.key} could not be recorded: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return {
    timeline: timelineResult,
    history: {
      completed: true,
      eventCount: events.length,
    },
  };
}

async function ensureDueDiligenceComplianceContinuity(
  supabase: any,
  access: ConversionAccess,
  employeeId: number,
  candidateId: string,
  applicationId: string,
  appointment: any,
  nonBlockingIssues: string[],
): Promise<ComplianceContinuityResult> {
  const summary: ComplianceContinuityResult["summary"] = {
    created: 0,
    reused: 0,
    updated: 0,
    skipped: 0,
  };
  const items: ComplianceContinuityItem[] = [];

  const vacancyResult = await (supabase as any)
    .from("leo_talent_vacancies")
    .select("id,requires_dbs,requires_driving,requires_qualification_checks,overseas_check_required_if_applicable")
    .eq("id", appointment.vacancy_id)
    .eq("organisation_id", access.organisationId)
    .maybeSingle();

  if (vacancyResult.error) {
    throw new Error(vacancyResult.error.message);
  }

  const sharedRecordsResult = await (supabase as any)
    .from("leo_talent_candidate_shared_records")
    .select("id,component_key,payload,updated_at")
    .eq("organisation_id", access.organisationId)
    .eq("candidate_id", candidateId)
    .eq("application_id", applicationId)
    .in("component_key", [
      "right_to_work",
      "dbs",
      "driving",
      "qualifications",
      "professional_registrations",
      "references",
      "overseas_checks",
      "vehicle",
    ]);

  if (sharedRecordsResult.error) {
    throw new Error(sharedRecordsResult.error.message);
  }

  const sharedByKey = new Map<string, any>();
  for (const row of Array.isArray(sharedRecordsResult.data)
    ? sharedRecordsResult.data
    : []) {
    const key = optionalText(row?.component_key);
    if (!key) continue;
    const existing = sharedByKey.get(key);
    if (!existing || parseDateValue(row?.updated_at) > parseDateValue(existing?.updated_at)) {
      sharedByKey.set(key, row);
    }
  }

  async function insertOrUpdateEmployeeCheck(params: {
    check: string;
    tableCandidates: string[];
    moduleName: string;
    source: any;
    payload: Record<string, unknown>;
    precedenceDate: string | null;
    dedupePredicate: (row: any) => boolean;
    updateWhen: (row: any) => boolean;
  }) {
    const resolved = await resolveFirstAvailableEmployeeTable(
      supabase,
      params.tableCandidates,
      access.organisationId,
      employeeId,
    );

    if (!resolved.table) {
      const item: ComplianceContinuityItem = {
        check: params.check,
        module: null,
        action: "skipped",
        recordId: null,
        reason: "No compatible employee module table found.",
      };
      items.push(item);
      summary.skipped += 1;
      return;
    }

    const sourceRecordId = String(params.source.id);
    const table = resolved.table;
    const sourceUpdatedAt = parseDateValue(params.source.updated_at);

    const sourceKeyMatch = resolved.rows.find((row: any) => {
      const existingSourceId = extractSourceRecordId(row);
      return existingSourceId === sourceRecordId;
    });

    if (sourceKeyMatch) {
      if (!params.updateWhen(sourceKeyMatch)) {
        items.push({
          check: params.check,
          module: params.moduleName,
          action: "reused",
          recordId: String(sourceKeyMatch.id),
        });
        summary.reused += 1;
        return;
      }

      const updatePayload: Record<string, unknown> = {
        ...params.payload,
        updated_at: new Date().toISOString(),
        updated_by: access.user.id,
      };
      const updateResult = await updateWithUnknownColumnFallback(
        supabase,
        table,
        sourceKeyMatch.id,
        updatePayload,
        access.organisationId,
        resolved.hasOrganisationColumn,
      );

      if (!updateResult.ok) {
        nonBlockingIssues.push(
          `${params.check} continuity could not update ${table}: ${updateResult.error.message}`,
        );
        items.push({
          check: params.check,
          module: params.moduleName,
          action: "skipped",
          recordId: String(sourceKeyMatch.id),
          reason: updateResult.error.message,
        });
        summary.skipped += 1;
        return;
      }

      items.push({
        check: params.check,
        module: params.moduleName,
        action: "updated",
        recordId: String(sourceKeyMatch.id),
      });
      summary.updated += 1;
      return;
    }

    const semanticMatch = resolved.rows.find(params.dedupePredicate);
    if (semanticMatch) {
      const existingUpdatedAt = parseDateValue(semanticMatch.updated_at);
      if (existingUpdatedAt >= sourceUpdatedAt && existingUpdatedAt > 0) {
        items.push({
          check: params.check,
          module: params.moduleName,
          action: "reused",
          recordId: String(semanticMatch.id),
          reason: "Existing employee record is newer than due-diligence source.",
        });
        summary.reused += 1;
        return;
      }

      if (!params.updateWhen(semanticMatch)) {
        items.push({
          check: params.check,
          module: params.moduleName,
          action: "reused",
          recordId: String(semanticMatch.id),
        });
        summary.reused += 1;
        return;
      }

      const updatePayload: Record<string, unknown> = {
        ...params.payload,
        metadata: {
          source_module: "Talent",
          source_component_key: params.source.component_key,
          source_shared_record_id: sourceRecordId,
          source_record_id: sourceRecordId,
          source_candidate_id: candidateId,
          source_application_id: applicationId,
          source_updated_at: params.source.updated_at,
          migrated_phase: "phase_3_due_diligence_continuity",
        },
        source_record_id: sourceRecordId,
        updated_at: new Date().toISOString(),
        updated_by: access.user.id,
      };

      const updateResult = await updateWithUnknownColumnFallback(
        supabase,
        table,
        semanticMatch.id,
        updatePayload,
        access.organisationId,
        resolved.hasOrganisationColumn,
      );

      if (!updateResult.ok) {
        nonBlockingIssues.push(
          `${params.check} continuity could not update ${table}: ${updateResult.error.message}`,
        );
        items.push({
          check: params.check,
          module: params.moduleName,
          action: "skipped",
          recordId: String(semanticMatch.id),
          reason: updateResult.error.message,
        });
        summary.skipped += 1;
        return;
      }

      items.push({
        check: params.check,
        module: params.moduleName,
        action: "updated",
        recordId: String(semanticMatch.id),
      });
      summary.updated += 1;
      return;
    }

    const insertPayload: Record<string, unknown> = {
      ...params.payload,
      employee_id: employeeId,
      organisation_id: access.organisationId,
      source_record_id: sourceRecordId,
      created_at: new Date().toISOString(),
      created_by: access.user.id,
      updated_at: new Date().toISOString(),
      updated_by: access.user.id,
      metadata: {
        source_module: "Talent",
        source_component_key: params.source.component_key,
        source_shared_record_id: sourceRecordId,
        source_record_id: sourceRecordId,
        source_candidate_id: candidateId,
        source_application_id: applicationId,
        source_updated_at: params.source.updated_at,
        migrated_phase: "phase_3_due_diligence_continuity",
      },
    };

    const insertResult = await insertWithUnknownColumnFallback(
      supabase,
      table,
      insertPayload,
    );

    if (!insertResult.ok) {
      nonBlockingIssues.push(
        `${params.check} continuity could not insert into ${table}: ${insertResult.error.message}`,
      );
      items.push({
        check: params.check,
        module: params.moduleName,
        action: "skipped",
        recordId: null,
        reason: insertResult.error.message,
      });
      summary.skipped += 1;
      return;
    }

    const refreshed = await queryEmployeeScopedRows(
      supabase,
      table,
      access.organisationId,
      employeeId,
    );
    const inserted = refreshed.rows.find(
      (row: any) => extractSourceRecordId(row) === sourceRecordId,
    );

    items.push({
      check: params.check,
      module: params.moduleName,
      action: "created",
      recordId: inserted?.id ? String(inserted.id) : null,
    });
    summary.created += 1;
  }

  const rtw = sharedByKey.get("right_to_work");
  if (rtw?.payload && typeof rtw.payload === "object") {
    const payload = rtw.payload as Record<string, unknown>;
    if (isDueDiligenceCheckComplete("right_to_work", payload, vacancyResult.data)) {
      const rtwPayload: Record<string, unknown> = {
        status: optionalText(payload.status),
        check_method: optionalText(payload.method),
        document_type: optionalText(payload.documentType),
        document_reference: optionalText(payload.documentReference),
        nationality: optionalText(payload.nationality),
        share_code: optionalText(payload.shareCode),
        date_of_check: findBestDate(payload.dateOfCheck),
        checked_by: optionalText(payload.checkedBy),
        expiry_date: findBestDate(payload.expiryDate),
        follow_up_date: findBestDate(payload.followUpDate),
        restrictions: optionalText(payload.restrictions),
        verification_outcome: optionalText(payload.verificationOutcome),
        notes: optionalText(payload.notes),
      };

      const precedenceDate = findBestDate(payload.dateOfCheck, payload.expiryDate);

      await insertOrUpdateEmployeeCheck({
        check: "right_to_work",
        tableCandidates: ["employee_right_to_work"],
        moduleName: "employee_right_to_work",
        source: rtw,
        payload: rtwPayload,
        precedenceDate,
        dedupePredicate: (row) => {
          const source = optionalText(row?.source_component_key);
          const status = optionalText(row?.status);
          return source === "right_to_work" || status === optionalText(payload.status);
        },
        updateWhen: (row) => {
          const existingDate = parseDateValue(row?.date_of_check ?? row?.updated_at);
          const incomingDate = parseDateValue(precedenceDate ?? rtw.updated_at);
          return incomingDate > existingDate;
        },
      });
    } else {
      items.push({
        check: "right_to_work",
        module: "employee_right_to_work",
        action: "skipped",
        recordId: null,
        reason: "Check not marked complete in due-diligence.",
      });
      summary.skipped += 1;
    }
  }

  const dbs = sharedByKey.get("dbs");
  if (dbs?.payload && typeof dbs.payload === "object") {
    const payload = dbs.payload as Record<string, unknown>;
    if (isDueDiligenceCheckComplete("dbs", payload, vacancyResult.data)) {
      const dbsPayload: Record<string, unknown> = {
        requirement_level: optionalText(payload.requirement),
        status: optionalText(payload.status),
        workforce: optionalText(payload.workforce),
        role_requires_dbs: isTruthy(payload.roleRequiresDBS),
        barred_list_required: isTruthy(payload.barredListCheckRequired),
        volunteer_application: isTruthy(payload.volunteerApplication),
        application_reference: optionalText(payload.applicationReference),
        application_submitted_date: findBestDate(payload.applicationSubmittedDate),
        certificate_number: optionalText(payload.certificateNumber),
        certificate_issue_date: findBestDate(payload.certificateIssueDate),
        certificate_seen_date: findBestDate(payload.certificateSeenDate),
        certificate_seen_by: optionalText(payload.certificateSeenBy),
        result_position: optionalText(payload.resultPosition),
        disclosure_summary: optionalText(payload.disclosureSummary),
        suitability_decision: optionalText(payload.suitabilityDecision),
        suitability_decision_date: findBestDate(payload.suitabilityDecisionDate),
        suitability_decision_by: optionalText(payload.suitabilityDecisionBy),
        update_service_registered: isTruthy(payload.updateServiceRegistered),
        update_service_last_checked_date: findBestDate(payload.updateServiceLastCheckedDate),
        update_service_last_checked_by: optionalText(payload.updateServiceLastCheckedBy),
        update_service_result: optionalText(payload.updateServiceResult),
        renewal_required: isTruthy(payload.renewalRequired),
        renewal_date: findBestDate(payload.renewalDate),
        next_review_date: findBestDate(payload.nextReviewDate),
        identity_verified: isTruthy(payload.identityVerified),
        identity_verified_date: findBestDate(payload.identityVerifiedDate),
        identity_verified_by: optionalText(payload.identityVerifiedBy),
        notes: optionalText(payload.notes),
      };

      const precedenceDate = findBestDate(
        payload.certificateIssueDate,
        payload.suitabilityDecisionDate,
        payload.applicationSubmittedDate,
      );

      await insertOrUpdateEmployeeCheck({
        check: "dbs",
        tableCandidates: ["employee_dbs_checks"],
        moduleName: "employee_dbs_checks",
        source: dbs,
        payload: dbsPayload,
        precedenceDate,
        dedupePredicate: (row) => {
          const incomingCert = optionalText(payload.certificateNumber);
          const existingCert = optionalText(row?.certificate_number);
          return Boolean(incomingCert && existingCert && incomingCert === existingCert);
        },
        updateWhen: (row) => {
          const existingDate = parseDateValue(row?.certificate_issue_date ?? row?.updated_at);
          const incomingDate = parseDateValue(precedenceDate ?? dbs.updated_at);
          return incomingDate > existingDate;
        },
      });
    } else {
      items.push({
        check: "dbs",
        module: "employee_dbs_checks",
        action: "skipped",
        recordId: null,
        reason: "Check not marked complete in due-diligence.",
      });
      summary.skipped += 1;
    }
  }

  const driving = sharedByKey.get("driving");
  if (driving?.payload && typeof driving.payload === "object") {
    const payload = driving.payload as Record<string, unknown>;
    if (isDueDiligenceCheckComplete("driving", payload, vacancyResult.data)) {
      const drivingPayload: Record<string, unknown> = {
        status: optionalText(payload.checkStatus),
        requirement_status: optionalText(payload.requirementStatus),
        licence_held: isTruthy(payload.licenceHeld),
        full_licence: isTruthy(payload.fullLicence),
        provisional_licence: isTruthy(payload.provisionalLicence),
        licence_number: optionalText(payload.licenceNumber),
        country_of_issue: optionalText(payload.countryOfIssue),
        licence_issue_date: findBestDate(payload.licenceIssueDate),
        licence_expiry_date: findBestDate(payload.licenceExpiryDate),
        licence_categories: stringArray(payload.licenceCategories),
        dvla_check_required: isTruthy(payload.dvlaCheckRequired),
        dvla_check_date: findBestDate(payload.dvlaCheckDate),
        dvla_checked_by: optionalText(payload.dvlaCheckedBy),
        dvla_check_outcome: optionalText(payload.dvlaCheckOutcome),
        dvla_follow_up_date: findBestDate(payload.dvlaFollowUpDate),
        penalty_points:
          typeof payload.penaltyPoints === "number" ? payload.penaltyPoints : null,
        endorsements: optionalText(payload.endorsements),
        restrictions_or_codes: optionalText(payload.restrictionsOrCodes),
        disqualification_history: isTruthy(payload.disqualificationHistory),
        disqualification_details: optionalText(payload.disqualificationDetails),
        insurance_verified: isTruthy(payload.insuranceVerified),
        insurance_provider: optionalText(payload.insuranceProvider),
        insurance_policy_number: optionalText(payload.insurancePolicyNumber),
        insurance_expiry_date: findBestDate(payload.insuranceExpiryDate),
        business_use_permitted: isTruthy(payload.businessUsePermitted),
        mot_verified: isTruthy(payload.motVerified),
        mot_expiry_date: findBestDate(payload.motExpiryDate),
        vehicle_tax_verified: isTruthy(payload.vehicleTaxVerified),
        vehicle_tax_expiry_date: findBestDate(payload.vehicleTaxExpiryDate),
        next_review_date: findBestDate(payload.nextReviewDate),
        notes: optionalText(payload.notes),
      };

      const precedenceDate = findBestDate(
        payload.dvlaCheckDate,
        payload.licenceExpiryDate,
        payload.nextReviewDate,
      );

      await insertOrUpdateEmployeeCheck({
        check: "driving",
        tableCandidates: ["employee_driving_checks"],
        moduleName: "employee_driving_checks",
        source: driving,
        payload: drivingPayload,
        precedenceDate,
        dedupePredicate: (row) => {
          const incomingLicence = optionalText(payload.licenceNumber);
          const existingLicence = optionalText(row?.licence_number);
          return Boolean(
            incomingLicence && existingLicence && incomingLicence === existingLicence,
          );
        },
        updateWhen: (row) => {
          const existingDate = parseDateValue(row?.dvla_check_date ?? row?.updated_at);
          const incomingDate = parseDateValue(precedenceDate ?? driving.updated_at);
          return incomingDate > existingDate;
        },
      });
    } else {
      items.push({
        check: "driving",
        module: "employee_driving_checks",
        action: "skipped",
        recordId: null,
        reason: "Check not marked complete in due-diligence.",
      });
      summary.skipped += 1;
    }
  }

  const qualifications = sharedByKey.get("qualifications");
  if (qualifications?.payload && typeof qualifications.payload === "object") {
    const payload = qualifications.payload as Record<string, unknown>;
    const records = Array.isArray(payload.qualifications)
      ? payload.qualifications
      : [];

    if (isDueDiligenceCheckComplete("qualifications", payload, vacancyResult.data)) {
      const resolved = await resolveFirstAvailableEmployeeTable(
        supabase,
        ["employee_qualifications"],
        access.organisationId,
        employeeId,
      );

      if (!resolved.table) {
        items.push({
          check: "qualifications",
          module: null,
          action: "skipped",
          recordId: null,
          reason: "No employee qualifications table found.",
        });
        summary.skipped += 1;
      } else if (records.length === 0) {
        items.push({
          check: "qualifications",
          module: "employee_qualifications",
          action: "skipped",
          recordId: null,
          reason: "No qualification records present in due-diligence payload.",
        });
        summary.skipped += 1;
      } else {
        for (const qualification of records) {
          const record =
            qualification && typeof qualification === "object"
              ? (qualification as Record<string, unknown>)
              : null;
          if (!record) continue;

          const sourceRecordId = `${qualifications.id}:${optionalText(record.id) ?? "qualification"}`;

          const existingBySource = resolved.rows.find((row: any) => {
            const source = extractSourceRecordId(row);
            return source === sourceRecordId;
          });

          const name = optionalText(record.qualificationName);
          const awardingBody = optionalText(record.awardingBody);
          const regNumber = optionalText(record.registrationOrCertificateNumber);
          const awardedDate = findBestDate(record.dateAwarded);
          const expiryDate = findBestDate(record.expiryDate);

          const qualificationPayload: Record<string, unknown> = {
            qualification_name: name,
            subject_or_specialism: optionalText(record.subjectOrSpecialism),
            requirement: optionalText(record.requirement),
            level: optionalText(record.level),
            awarding_body: awardingBody,
            institution: optionalText(record.institution),
            country_of_award: optionalText(record.countryOfAward),
            registration_or_certificate_number: regNumber,
            professional_body: optionalText(record.professionalBody),
            membership_number: optionalText(record.membershipNumber),
            date_started: findBestDate(record.dateStarted),
            date_awarded: awardedDate,
            expiry_date: expiryDate,
            renewal_date: findBestDate(record.renewalDate),
            grade_or_result: optionalText(record.gradeOrResult),
            status: optionalText(record.status),
            verified_date: findBestDate(record.verifiedDate),
            verified_by: optionalText(record.verifiedBy),
            verification_method: optionalText(record.verificationMethod),
            verification_reference: optionalText(record.verificationReference),
            role_requirement_met: isTruthy(record.roleRequirementMet),
            notes: optionalText(record.notes),
          };

          if (existingBySource) {
            const existingDate = parseDateValue(
              existingBySource.updated_at ?? existingBySource.date_awarded,
            );
            const incomingDate = parseDateValue(awardedDate ?? qualifications.updated_at);

            if (incomingDate <= existingDate && existingDate > 0) {
              items.push({
                check: "qualifications",
                module: "employee_qualifications",
                action: "reused",
                recordId: String(existingBySource.id),
                reason: "Existing employee qualification is newer.",
              });
              summary.reused += 1;
              continue;
            }

            const updatePayload = {
              ...qualificationPayload,
              updated_at: new Date().toISOString(),
              updated_by: access.user.id,
            };
            const updateResult = await updateWithUnknownColumnFallback(
              supabase,
              resolved.table,
              existingBySource.id,
              updatePayload,
              access.organisationId,
              resolved.hasOrganisationColumn,
            );

            if (!updateResult.ok) {
              nonBlockingIssues.push(
                `qualifications continuity could not update ${resolved.table}: ${updateResult.error.message}`,
              );
              items.push({
                check: "qualifications",
                module: "employee_qualifications",
                action: "skipped",
                recordId: String(existingBySource.id),
                reason: updateResult.error.message,
              });
              summary.skipped += 1;
              continue;
            }

            items.push({
              check: "qualifications",
              module: "employee_qualifications",
              action: "updated",
              recordId: String(existingBySource.id),
            });
            summary.updated += 1;
            continue;
          }

          const semanticMatch = resolved.rows.find((row: any) => {
            const rowName = optionalText(row?.qualification_name);
            const rowBody = optionalText(row?.awarding_body);
            const rowNumber = optionalText(row?.registration_or_certificate_number);
            if (regNumber && rowNumber && regNumber === rowNumber) return true;
            return Boolean(name && rowName && name === rowName && awardingBody === rowBody);
          });

          if (semanticMatch) {
            items.push({
              check: "qualifications",
              module: "employee_qualifications",
              action: "reused",
              recordId: String(semanticMatch.id),
              reason: "Matching employee qualification already exists.",
            });
            summary.reused += 1;
            continue;
          }

          if (nonEmptyFieldCount(qualificationPayload) <= 2) {
            items.push({
              check: "qualifications",
              module: "employee_qualifications",
              action: "skipped",
              recordId: null,
              reason: "Insufficient qualification detail to create record.",
            });
            summary.skipped += 1;
            continue;
          }

          const insertPayload: Record<string, unknown> = {
            ...qualificationPayload,
            employee_id: employeeId,
            organisation_id: access.organisationId,
            source_record_id: sourceRecordId,
            created_at: new Date().toISOString(),
            created_by: access.user.id,
            updated_at: new Date().toISOString(),
            updated_by: access.user.id,
            metadata: {
              source_module: "Talent",
              source_component_key: "qualifications",
              source_shared_record_id: String(qualifications.id),
              source_record_id: sourceRecordId,
              source_candidate_id: candidateId,
              source_application_id: applicationId,
              source_updated_at: qualifications.updated_at,
              migrated_phase: "phase_3_due_diligence_continuity",
            },
          };

          const insertResult = await insertWithUnknownColumnFallback(
            supabase,
            resolved.table,
            insertPayload,
          );

          if (!insertResult.ok) {
            nonBlockingIssues.push(
              `qualifications continuity could not insert into ${resolved.table}: ${insertResult.error.message}`,
            );
            items.push({
              check: "qualifications",
              module: "employee_qualifications",
              action: "skipped",
              recordId: null,
              reason: insertResult.error.message,
            });
            summary.skipped += 1;
            continue;
          }

          items.push({
            check: "qualifications",
            module: "employee_qualifications",
            action: "created",
            recordId: null,
          });
          summary.created += 1;
        }
      }
    } else {
      items.push({
        check: "qualifications",
        module: "employee_qualifications",
        action: "skipped",
        recordId: null,
        reason: "Check not marked complete in due-diligence.",
      });
      summary.skipped += 1;
    }
  }

  for (const key of ["professional_registrations", "references", "overseas_checks", "vehicle"]) {
    const record = sharedByKey.get(key);
    if (!record?.payload || typeof record.payload !== "object") continue;

    const payload = record.payload as Record<string, unknown>;
    if (!isDueDiligenceCheckComplete(key, payload, vacancyResult.data)) {
      items.push({
        check: key,
        module: null,
        action: "skipped",
        recordId: null,
        reason: "Check not marked complete in due-diligence.",
      });
      summary.skipped += 1;
      continue;
    }

    const eventKey = `${applicationId}:dd:${key}:${record.id}`;
    try {
      const eventResult = await ensureEmployeeTimelineEvent(
        supabase,
        access.organisationId,
        employeeId,
        access.user.id,
        "Talent Due Diligence Check",
        `Due-diligence ${key.replace(/_/g, " ")} transferred`,
        "Completed due-diligence evidence retained in recruitment history.",
        eventKey,
        {
          source_module: "Talent",
          source_component_key: key,
          source_shared_record_id: String(record.id),
          source_candidate_id: candidateId,
          source_application_id: applicationId,
          source_updated_at: record.updated_at,
          migrated_phase: "phase_3_due_diligence_continuity",
        },
      );

      items.push({
        check: key,
        module: "employee_timeline",
        action: eventResult === "created" ? "created" : "reused",
        recordId: eventKey,
      });
      if (eventResult === "created") summary.created += 1;
      if (eventResult === "reused") summary.reused += 1;
    } catch (error) {
      nonBlockingIssues.push(
        `${key} continuity could not be retained in employee history: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      items.push({
        check: key,
        module: "employee_timeline",
        action: "skipped",
        recordId: null,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
      summary.skipped += 1;
    }
  }

  return { items, summary };
}

async function ensureCandidateEmployeeLink(
  supabase: any,
  access: ConversionAccess,
  candidateId: string,
  employeeId: number,
  applicationId: string,
) {
  const now = new Date().toISOString();

  const existingCandidate = await (supabase as any)
    .from("leo_talent_candidates")
    .select("id,existing_employee_id,metadata")
    .eq("id", candidateId)
    .eq("organisation_id", access.organisationId)
    .maybeSingle();

  if (existingCandidate.error) throw new Error(existingCandidate.error.message);

  const currentMetadata =
    existingCandidate.data?.metadata &&
    typeof existingCandidate.data.metadata === "object"
      ? (existingCandidate.data.metadata as Record<string, unknown>)
      : {};

  const result = await (supabase as any)
    .from("leo_talent_candidates")
    .update({
      existing_employee_id: employeeId,
      updated_at: now,
      updated_by: access.user.id,
      metadata: {
        ...currentMetadata,
        hired_at: now,
        hired_employee_id: employeeId,
        hired_application_id: applicationId,
      },
    })
    .eq("id", candidateId)
    .eq("organisation_id", access.organisationId)
    .or(`existing_employee_id.is.null,existing_employee_id.eq.${employeeId}`)
    .select("id,existing_employee_id")
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  if (result.data?.id) {
    return {
      completed: true,
      resolution: "reused" as const,
    };
  }

  const current = await (supabase as any)
    .from("leo_talent_candidates")
    .select("id,existing_employee_id")
    .eq("id", candidateId)
    .eq("organisation_id", access.organisationId)
    .maybeSingle();

  if (current.error) throw new Error(current.error.message);

  const currentEmployeeId = parseEmployeeId(current.data?.existing_employee_id);
  if (currentEmployeeId === employeeId) {
    return {
      completed: true,
      resolution: "reused" as const,
    };
  }

  throw new Error(
    "Candidate-to-employee link conflicts with an existing employee link.",
  );
}

export async function convertAppointmentToEmployee(
  params: ConvertAppointmentParams,
): Promise<ConversionResult> {
  const {
    supabase,
    access,
    appointment,
    requestedStatus,
    appointmentResolution = "reused",
    onboardingResolution = "reused",
  } = params;

  const appointmentId = String(appointment.id);
  const applicationId = String(appointment.application_id);
  const requested = text(requestedStatus);
  const nonBlockingIssues: string[] = [];

  if (!statusRequiresEmployee(requested)) {
    throw new Error("The requested status does not require employee conversion.");
  }

  const resolved = await resolveEmployeeIdForConversion(
    supabase,
    access,
    appointment,
  );
  let employeeId = resolved.employeeId;

  await ensureEmploymentDetails(
    supabase,
    employeeId,
    optionalText(appointment.manager_name),
  );

  const timelineResolution = await ensureEmployeeTimeline(
    supabase,
    access.organisationId,
    employeeId,
    appointmentId,
    access.user.id,
  );

  const applicationUpdate = await (supabase as any)
    .from("leo_talent_applications")
    .update({
      status: "appointed",
      current_stage_key: "appointed",
      updated_at: new Date().toISOString(),
      updated_by: access.user.id,
    })
    .eq("id", applicationId)
    .eq("organisation_id", access.organisationId);

  if (applicationUpdate.error) throw new Error(applicationUpdate.error.message);

  const candidateLink = await ensureCandidateEmployeeLink(
    supabase,
    access,
    String(resolved.candidate.id),
    employeeId,
    applicationId,
  );

  const latestAppointment = await (supabase as any)
    .from("leo_talent_appointments")
    .select("employee_id")
    .eq("id", appointmentId)
    .eq("organisation_id", access.organisationId)
    .maybeSingle();

  if (latestAppointment.error) throw new Error(latestAppointment.error.message);

  const latestEmployeeId = parseEmployeeId(latestAppointment.data?.employee_id);
  if (latestEmployeeId && latestEmployeeId !== employeeId) {
    const latestVerified = await getVerifiedEmployee(
      supabase,
      access.organisationId,
      latestEmployeeId,
    );

    if (!latestVerified?.id) {
      throw new Error(
        "A concurrent conversion linked an invalid employee. Please retry.",
      );
    }

    employeeId = Number(latestVerified.id);
  }

  const now = new Date().toISOString();
  const appointmentUpdate = await (supabase as any)
    .from("leo_talent_appointments")
    .update({
      status: requested,
      employee_id: employeeId,
      employee_created_at: appointment.employee_created_at ?? now,
      employee_created_by: access.user.id,
      recruitment_summary_transferred: true,
      updated_at: now,
      updated_by: access.user.id,
    })
    .eq("id", appointmentId)
    .eq("organisation_id", access.organisationId)
    .or(`employee_id.is.null,employee_id.eq.${employeeId}`)
    .select("*")
    .maybeSingle();

  if (appointmentUpdate.error) throw new Error(appointmentUpdate.error.message);

  let finalAppointment = appointmentUpdate.data;

  if (!finalAppointment) {
    const conflictRecord = await (supabase as any)
      .from("leo_talent_appointments")
      .select("*")
      .eq("id", appointmentId)
      .eq("organisation_id", access.organisationId)
      .single();

    if (conflictRecord.error) throw new Error(conflictRecord.error.message);

    const conflictEmployeeId = parseEmployeeId(conflictRecord.data?.employee_id);
    const verifiedConflict = await getVerifiedEmployee(
      supabase,
      access.organisationId,
      conflictEmployeeId,
    );

    if (!verifiedConflict?.id) {
      throw new Error(
        "Employee conversion could not verify a linked employee after a concurrent update.",
      );
    }

    const statusRepair = await (supabase as any)
      .from("leo_talent_appointments")
      .update({
        status: requested,
        employee_created_at: conflictRecord.data?.employee_created_at ?? now,
        recruitment_summary_transferred: true,
        updated_at: now,
        updated_by: access.user.id,
      })
      .eq("id", appointmentId)
      .eq("organisation_id", access.organisationId)
      .eq("employee_id", Number(verifiedConflict.id))
      .select("*")
      .single();

    if (statusRepair.error) throw new Error(statusRepair.error.message);

    finalAppointment = statusRepair.data;
    employeeId = Number(verifiedConflict.id);
  }

  const verifiedLinkedEmployee = await getVerifiedEmployee(
    supabase,
    access.organisationId,
    parseEmployeeId(finalAppointment?.employee_id),
  );

  if (!verifiedLinkedEmployee?.id) {
    throw new Error(
      "Employee conversion did not produce a verifiable linked employee record.",
    );
  }

  await writeTalentActivity(
    supabase,
    access.organisationId,
    access.user.id,
    appointmentId,
    "employee_conversion_confirmed",
    "Employee creation was confirmed from the onboarding pipeline.",
    {
      employee_id: employeeId,
      candidate_id: resolved.candidate.id,
      application_id: appointment.application_id,
      offer_id: appointment.offer_id,
      requested_status: requested,
    },
  );

  let profileContinuity: ProfileContinuityResult = {
    transferred: [],
    reused: [],
    unsupported: [],
  };

  try {
    profileContinuity = await ensureCandidateProfileContinuity(
      supabase,
      access.organisationId,
      employeeId,
      resolved.candidate,
    );
  } catch (error) {
    nonBlockingIssues.push(
      `Candidate profile continuity could not complete: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  let documentContinuity: DocumentContinuityResult = {
    linked: 0,
    reused: 0,
    skipped: 0,
    sourceTable: null,
  };

  try {
    documentContinuity = await ensureRecruitmentDocumentContinuity(
      supabase,
      access.organisationId,
      employeeId,
      String(resolved.candidate.id),
      nonBlockingIssues,
    );
  } catch (error) {
    nonBlockingIssues.push(
      `Recruitment document continuity could not complete: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  let historyContinuity: {
    timeline: TimelineContinuityResult;
    history: RecruitmentHistoryResult;
  } = {
    timeline: { created: 0, reused: 0 },
    history: { completed: false, eventCount: 0 },
  };

  try {
    historyContinuity = await ensureRecruitmentHistoryContinuity(
      supabase,
      access,
      employeeId,
      resolved.candidate,
      appointment,
      applicationId,
      appointmentId,
      nonBlockingIssues,
    );
  } catch (error) {
    nonBlockingIssues.push(
      `Recruitment history continuity could not complete: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  let complianceContinuity: ComplianceContinuityResult = {
    items: [],
    summary: {
      created: 0,
      reused: 0,
      updated: 0,
      skipped: 0,
    },
  };

  try {
    complianceContinuity = await ensureDueDiligenceComplianceContinuity(
      supabase,
      access,
      employeeId,
      String(resolved.candidate.id),
      applicationId,
      appointment,
      nonBlockingIssues,
    );
  } catch (error) {
    nonBlockingIssues.push(
      `Due-diligence continuity could not complete: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  return {
    employeeId,
    candidateId: String(resolved.candidate.id),
    applicationId,
    appointmentId,
    onboardingId: appointmentId,
    recordResolution: {
      employee: resolved.employeeResolution,
      candidate: "reused",
      application: "reused",
      appointment: appointmentResolution,
      onboarding: onboardingResolution,
      timeline: timelineResolution,
    },
    candidateToEmployeeLinkCompleted: candidateLink.completed,
    continuity: {
      profile: profileContinuity,
      documents: documentContinuity,
      timeline: {
        created:
          historyContinuity.timeline.created +
          (timelineResolution === "created" ? 1 : 0),
        reused:
          historyContinuity.timeline.reused +
          (timelineResolution === "reused" ? 1 : 0),
      },
      recruitmentHistory: historyContinuity.history,
      compliance: complianceContinuity,
      decisions: {
        retained: [
          "application_status_and_stage",
          "application_recommendation",
          "interview_dates_and_outcomes",
          "appointment_decision_outcome",
          "offer_status_and_acceptance",
        ],
        excluded: [
          "candidate_general_notes",
          "recruiter_internal_notes",
          "interview_internal_instructions",
          "offer_free_text_internal_notes",
          "medical_or_health_data",
        ],
      },
      nonBlockingIssues,
    },
    appointment: finalAppointment,
  };
}
