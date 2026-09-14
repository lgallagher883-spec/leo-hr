import { getOnboardingTemplates } from "@/lib/onboarding/templates";

export type NewStarterReadinessStatus = "ready" | "needs_attention" | "blocked";

export type NewStarterReadinessItem = {
  key: string;
  label: string;
  status: "complete" | "missing" | "not_required" | "needs_review";
  blocking: boolean;
  dueDate: string | null;
  detail: string;
};

export type NewStarterReadinessResult = {
  employee: {
    id: number;
    name: string;
    email: string | null;
    role: string | null;
    startDate: string | null;
    status: string | null;
  };
  overallStatus: NewStarterReadinessStatus;
  items: NewStarterReadinessItem[];
  counts: {
    complete: number;
    missing: number;
    needsReview: number;
    blocking: number;
  };
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function lower(value: unknown): string {
  return text(value).toLowerCase();
}

function latest<T extends Record<string, unknown>>(rows: T[] | null | undefined): T | null {
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

function isContractDocument(type: unknown, title: unknown) {
  const value = `${lower(type)} ${lower(title)}`;
  return value.includes("contract") || value.includes("written statement") || value.includes("written particulars");
}

function isFutureDate(value: string | null) {
  if (!value) return false;
  const date = new Date(`${value}T12:00:00`).getTime();
  const today = new Date();
  const todayValue = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12).getTime();
  return Number.isFinite(date) && date >= todayValue;
}

export async function assessNewStarterReadiness(args: {
  supabase: any;
  organisationId: string;
  employeeId: number;
}): Promise<NewStarterReadinessResult> {
  const { supabase, organisationId, employeeId } = args;

  const employeeResult = await supabase
    .from("employees")
    .select("id,name,email,role,start_date,status")
    .eq("id", employeeId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (employeeResult.error) throw new Error(employeeResult.error.message);
  if (!employeeResult.data) throw new Error("The employee record could not be found.");

  const employee = employeeResult.data;

  const [
    employmentResult,
    rtwResult,
    dbsResult,
    documentsResult,
    emergencyResult,
    probationResult,
    invitationResult,
    contractPrepResult,
  ] = await Promise.all([
    supabase
      .from("employee_employment_details")
      .select("manager,probation_end_date")
      .eq("employee_id", employeeId)
      .maybeSingle(),
    supabase
      .from("employee_right_to_work")
      .select("check_completed_date,right_to_work_expiry,next_review_date,created_at")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("employee_dbs_checks")
      .select("dbs_required,dbs_level,certificate_issue_date,next_check_due,created_at")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("employee_documents")
      .select("id,title,document_type,created_at")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("employee_emergency_contacts")
      .select("id,full_name,relationship,phone,email")
      .eq("employee_id", employeeId)
      .limit(1),
    supabase
      .from("employee_probations")
      .select("id,status,probation_start_date,standard_end_date")
      .eq("employee_id", employeeId)
      .eq("is_archived", false)
      .maybeSingle(),
    supabase
      .from("organisation_invitations")
      .select("id,invitation_status,expires_at,created_at")
      .eq("organisation_id", organisationId)
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("employee_timeline")
      .select("id,metadata,created_at")
      .eq("organisation_id", organisationId)
      .eq("employee_id", employeeId)
      .eq("source_module", "Agentic Leo")
      .eq("event_type", "Contract Preparation")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const errors = [
    employmentResult.error,
    rtwResult.error,
    dbsResult.error,
    documentsResult.error,
    emergencyResult.error,
    probationResult.error,
    invitationResult.error,
    contractPrepResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error("Leo could not complete the new starter readiness check.");
  }

  const startDate = employee.start_date ?? null;
  const rtw = latest<Record<string, unknown>>(rtwResult.data);
  const dbs = latest<Record<string, unknown>>(dbsResult.data);
  const invitation = latest<Record<string, unknown>>(invitationResult.data);
  const contractPrep = latest<Record<string, unknown>>(contractPrepResult.data);
  const contractMetadata =
    contractPrep && typeof contractPrep.metadata === "object" && contractPrep.metadata
      ? (contractPrep.metadata as Record<string, unknown>)
      : {};
  const contractMissingFields = Array.isArray(contractMetadata.missing_fields)
    ? contractMetadata.missing_fields.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];
  const hasContract = (documentsResult.data ?? []).some((document: any) =>
    isContractDocument(document.document_type, document.title),
  );
  const hasEmergencyContact = (emergencyResult.data ?? []).some(
    (contact: any) =>
      Boolean(text(contact.full_name)) &&
      Boolean(text(contact.relationship)) &&
      (Boolean(text(contact.phone)) || Boolean(text(contact.email))),
  );
  const manager = text(employmentResult.data?.manager);
  const dbsRequiredRaw = dbs?.dbs_required;
  const dbsRequirementKnown =
    typeof dbsRequiredRaw === "boolean" ||
    (typeof dbsRequiredRaw === "string" &&
      ["yes", "no", "true", "false"].includes(dbsRequiredRaw.trim().toLowerCase()));
  const dbsRequired =
    dbsRequiredRaw === true ||
    (typeof dbsRequiredRaw === "string" &&
      ["yes", "true"].includes(dbsRequiredRaw.trim().toLowerCase()));
  const dbsComplete = dbsRequired && Boolean(dbs?.certificate_issue_date);
  const hasRtw = Boolean(rtw?.check_completed_date);
  const hasProbation = Boolean(probationResult.data?.id);
  const hasPortalInvite =
    invitation?.invitation_status === "pending" ||
    invitation?.invitation_status === "accepted";

  const templateDueDates = new Map(
    getOnboardingTemplates({
      includeDbs: dbsRequired,
      includeEquipment: true,
      includeLearning: false,
    }).map((template) => [template.key, template.dueOffsetDays]),
  );

  const dueDate = (key: string) => {
    const offset = templateDueDates.get(key);
    if (!startDate || offset === undefined) return null;
    const date = new Date(`${startDate}T12:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  };

  const items: NewStarterReadinessItem[] = [
    {
      key: "starter_details",
      label: "Starter details",
      status: employee.name && employee.role && startDate ? "complete" : "missing",
      blocking: !employee.name || !startDate,
      dueDate: dueDate("candidate_details"),
      detail: employee.role && startDate ? "Core starter details are recorded." : "Add the missing starter details, including start date and role.",
    },
    {
      key: "manager",
      label: "Line manager",
      status: manager ? "complete" : "missing",
      blocking: false,
      dueDate: dueDate("first_day_arrangements"),
      detail: manager ? `Line manager: ${manager}.` : "Confirm who will manage the starter.",
    },
    {
      key: "right_to_work",
      label: "Right to work",
      status: hasRtw ? "complete" : "missing",
      blocking: !hasRtw,
      dueDate: dueDate("right_to_work"),
      detail: hasRtw ? "A completed right to work check is recorded." : "A completed right to work check is required before employment begins.",
    },
    {
      key: "dbs",
      label: "DBS / safeguarding",
      status: !dbsRequirementKnown ? "needs_review" : !dbsRequired ? "not_required" : dbsComplete ? "complete" : "missing",
      blocking: dbsRequirementKnown && dbsRequired && !dbsComplete,
      dueDate: dueDate("dbs_clearance"),
      detail: !dbsRequirementKnown ? "Confirm whether this role requires DBS or safeguarding clearance." : !dbsRequired ? "DBS is explicitly recorded as not required." : dbsComplete ? "DBS clearance is recorded." : "DBS is marked as required but clearance is not yet recorded.",
    },
    {
      key: "contract",
      label: "Contract / written particulars",
      status: hasContract ? "complete" : "missing",
      blocking: false,
      dueDate: dueDate("contract_issue"),
      detail: hasContract
        ? "An employment contract or written particulars document is recorded."
        : contractMissingFields.length > 0
          ? `Leo has prepared the contract as far as possible. Confirm: ${contractMissingFields.join(" · ")}.`
          : contractPrep
            ? "Leo has assembled the contract context and is continuing preparation."
            : "Leo will prepare the employment contract from the organisation resource and information already held.",
    },
    {
      key: "emergency_contact",
      label: "Emergency contact",
      status: hasEmergencyContact ? "complete" : "missing",
      blocking: false,
      dueDate: startDate,
      detail: hasEmergencyContact ? "An emergency contact is recorded." : "Ask the starter to provide an emergency contact.",
    },
    {
      key: "probation",
      label: "Probation schedule",
      status: hasProbation ? "complete" : "missing",
      blocking: false,
      dueDate: startDate,
      detail: hasProbation ? "A probation record is already active." : "Prepare the probation period and review schedule.",
    },
    {
      key: "portal_invitation",
      label: "Employee portal invitation",
      status: hasPortalInvite ? "complete" : "missing",
      blocking: false,
      dueDate: startDate,
      detail: hasPortalInvite ? "A portal invitation has already been sent or accepted." : "Prepare an employee portal invitation for employer approval.",
    },
  ];

  if (!isFutureDate(startDate)) {
    items.unshift({
      key: "future_start_date",
      label: "Future start date",
      status: "needs_review",
      blocking: false,
      dueDate: null,
      detail: "This readiness workflow is intended for a current or future starter. Review the recorded start date.",
    });
  }

  const counts = {
    complete: items.filter((item) => item.status === "complete" || item.status === "not_required").length,
    missing: items.filter((item) => item.status === "missing").length,
    needsReview: items.filter((item) => item.status === "needs_review").length,
    blocking: items.filter((item) => item.blocking && item.status === "missing").length,
  };

  const overallStatus: NewStarterReadinessStatus =
    counts.blocking > 0 ? "blocked" : counts.missing > 0 || counts.needsReview > 0 ? "needs_attention" : "ready";

  return {
    employee: {
      id: employee.id,
      name: employee.name,
      email: employee.email ?? null,
      role: employee.role ?? null,
      startDate,
      status: employee.status ?? null,
    },
    overallStatus,
    items,
    counts,
  };
}
