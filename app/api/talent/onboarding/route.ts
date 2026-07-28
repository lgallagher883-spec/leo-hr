import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

type PlatformRole = "owner" | "senior" | "manager" | "employee";
type ConditionalItem = "dbs" | "equipment" | "learning";

const writeRoles = new Set<PlatformRole>(["owner", "senior", "manager"]);

const itemTemplates = [
  { key: "candidate_details", name: "Complete starter details", category: "candidate_details", description: "Confirm the starter information required for the employment record.", ownerType: "candidate", dueOffsetDays: -5, candidateVisible: true, candidateEditable: true, mandatory: true },
  { key: "right_to_work", name: "Confirm right to work", category: "safer_recruitment", description: "Complete and record the required right to work check before employment begins.", ownerType: "hr", dueOffsetDays: -7, candidateVisible: false, candidateEditable: false, mandatory: true },
  { key: "references", name: "Confirm references", category: "safer_recruitment", description: "Confirm required references and record telephone verification where applicable.", ownerType: "hr", dueOffsetDays: -7, candidateVisible: false, candidateEditable: false, mandatory: true },
  { key: "dbs_clearance", name: "Confirm DBS or safeguarding clearance", category: "safer_recruitment", description: "Complete the required DBS, barred-list or safeguarding checks for the role.", ownerType: "hr", dueOffsetDays: -5, candidateVisible: false, candidateEditable: false, mandatory: true, conditional: "dbs" as ConditionalItem },
  { key: "contract_issue", name: "Issue employment contract", category: "documents", description: "Issue the contract and written particulars using the agreed employment terms.", ownerType: "hr", dueOffsetDays: -10, candidateVisible: true, candidateEditable: false, mandatory: true },
  { key: "contract_signature", name: "Receive signed employment contract", category: "documents", description: "Confirm the signed contract has been received and stored.", ownerType: "candidate", dueOffsetDays: -2, candidateVisible: true, candidateEditable: true, mandatory: true },
  { key: "payroll_information", name: "Collect payroll information", category: "payroll", description: "Collect bank and tax information through the approved secure process.", ownerType: "candidate", dueOffsetDays: -5, candidateVisible: true, candidateEditable: true, mandatory: true },
  { key: "payroll_setup", name: "Add starter to payroll", category: "payroll", description: "Complete payroll setup and confirm the first payroll cut-off.", ownerType: "employer", dueOffsetDays: -2, candidateVisible: false, candidateEditable: false, mandatory: true },
  { key: "equipment", name: "Prepare equipment", category: "equipment", description: "Prepare and allocate the equipment required for the role.", ownerType: "manager", dueOffsetDays: -2, candidateVisible: false, candidateEditable: false, mandatory: true, conditional: "equipment" as ConditionalItem },
  { key: "mandatory_learning", name: "Assign mandatory learning", category: "learning", description: "Assign organisation-wide and role-specific learning in Leo Learn.", ownerType: "hr", dueOffsetDays: -1, candidateVisible: true, candidateEditable: false, mandatory: true, conditional: "learning" as ConditionalItem },
  { key: "first_day_arrangements", name: "Confirm commencement arrangements", category: "induction", description: "Confirm the date of commencement, reporting arrangements, location and key contacts.", ownerType: "manager", dueOffsetDays: -3, candidateVisible: true, candidateEditable: false, mandatory: true },
];

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | null {
  const result = text(value);
  return result || null;
}

function normaliseRole(value: unknown): PlatformRole {
  const role = text(value).toLowerCase();
  if (role === "owner") return "owner";
  if (role === "senior" || role === "hr") return "senior";
  if (role === "manager") return "manager";
  return "employee";
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function getAppointmentDecisionOutcome(
  supabase: any,
  organisationId: string,
  applicationId: string,
) {
  const result = await (supabase as any)
    .from("leo_talent_candidate_shared_records")
    .select("payload,updated_at")
    .eq("organisation_id", organisationId)
    .eq("application_id", applicationId)
    .eq("component_key", "appointment_decision")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (result.error) throw new Error(result.error.message);

  const latest =
    Array.isArray(result.data) && result.data.length > 0
      ? result.data[0]
      : null;

  const payload =
    latest?.payload && typeof latest.payload === "object"
      ? (latest.payload as Record<string, unknown>)
      : null;

  const outcome = text(payload?.outcome).toLowerCase();
  if (outcome === "ready_for_appointment") return "ready_for_appointment";
  if (outcome === "not_ready") return "not_ready";
  if (outcome === "withdrawn") return "withdrawn";
  return "pending";
}

function blockedByDecision(outcome: string) {
  return outcome === "not_ready" || outcome === "withdrawn";
}

async function getAuthorisedContext(supabase: any) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: NextResponse.json(
        { success: false, error: "Your session is unavailable. Please sign in again." },
        { status: 401 },
      ),
    };
  }

  const resolvedRole = await resolveAuthoritativeUserRole(supabase, {
    userId: user.id,
    allowedStatuses: ["active"],
  });

  const organisationId = resolvedRole?.membership.organisation_id ?? null;
  if (!organisationId) {
    return {
      error: NextResponse.json(
        { success: false, error: "Leo could not find an active organisation for your account." },
        { status: 403 },
      ),
    };
  }

  return { user, organisationId, role: normaliseRole(resolvedRole?.roleKey) };
}

function checklistRows(
  appointmentId: string,
  organisationId: string,
  startDate: string,
  options: { includeDbs: boolean; includeEquipment: boolean; includeLearning: boolean; automatic?: boolean },
) {
  return itemTemplates
    .filter((template) => {
      if (template.conditional === "dbs") return options.includeDbs;
      if (template.conditional === "equipment") return options.includeEquipment;
      if (template.conditional === "learning") return options.includeLearning;
      return true;
    })
    .map((template) => ({
      organisation_id: organisationId,
      appointment_id: appointmentId,
      item_key: template.key,
      item_name: template.name,
      item_category: template.category,
      description: template.description,
      owner_type: template.ownerType,
      due_date: addDays(startDate, template.dueOffsetDays),
      status: "not_started",
      candidate_visible: template.candidateVisible,
      candidate_editable: template.candidateEditable,
      metadata: {
        mandatory: template.mandatory,
        ...(options.automatic ? { generated_automatically: true } : {}),
      },
    }));
}

async function createAppointmentForOffer(
  supabase: any,
  organisationId: string,
  offer: any,
  vacancy: any,
  settings: {
    agreedStartDate: string;
    managerName?: string;
    department?: string;
    locationName?: string;
    includeDbs: boolean;
    includeEquipment: boolean;
    includeLearning: boolean;
    automatic?: boolean;
    decisionOutcome?: string;
  },
) {
  const decisionOutcome =
    settings.decisionOutcome ??
    (await getAppointmentDecisionOutcome(
      supabase,
      organisationId,
      String(offer.application_id),
    ));

  if (blockedByDecision(decisionOutcome)) {
    throw new Error(
      `Appointment progression is blocked because the appointment decision is ${decisionOutcome.replaceAll("_", " ")}.`,
    );
  }

  const existingResult = await supabase
    .from("leo_talent_appointments")
    .select("*")
    .eq("organisation_id", organisationId)
    .eq("offer_id", offer.id)
    .maybeSingle();

  if (existingResult.error) throw new Error(existingResult.error.message);
  if (existingResult.data) return { appointment: existingResult.data, created: false };

  const appointmentResult = await supabase
    .from("leo_talent_appointments")
    .insert({
      organisation_id: organisationId,
      offer_id: offer.id,
      application_id: offer.application_id,
      vacancy_id: offer.vacancy_id,
      candidate_id: offer.candidate_id,
      status: "pre_employment",
      agreed_start_date: settings.agreedStartDate,
      manager_name: optionalText(settings.managerName) || optionalText(offer.manager_name) || optionalText(vacancy?.hiring_manager_name),
      manager_user_id: offer.manager_user_id ?? vacancy?.hiring_manager_user_id ?? null,
      department: optionalText(settings.department) || optionalText(offer.department) || optionalText(vacancy?.department),
      location_name: optionalText(settings.locationName) || optionalText(offer.location_name) || optionalText(vacancy?.location_name),
    })
    .select("*")
    .single();

  if (appointmentResult.error) throw new Error(appointmentResult.error.message);
  const appointment = appointmentResult.data;

  const rows = checklistRows(appointment.id, organisationId, settings.agreedStartDate, settings);
  if (rows.length > 0) {
    const itemsResult = await supabase.from("leo_talent_onboarding_items").insert(rows);
    if (itemsResult.error) {
      await supabase.from("leo_talent_appointments").delete().eq("id", appointment.id).eq("organisation_id", organisationId);
      throw new Error(itemsResult.error.message);
    }
  }

  const applicationResult = await supabase
    .from("leo_talent_applications")
    .update({ status: "onboarding", current_stage_key: "onboarding" })
    .eq("id", offer.application_id)
    .eq("organisation_id", organisationId);

  if (applicationResult.error) throw new Error(applicationResult.error.message);
  return { appointment, created: true };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase as any);
    if ("error" in access) return access.error;

    const [offersInitial, vacanciesInitial, appointmentsInitial] = await Promise.all([
      (supabase as any).from("leo_talent_offers").select("id, organisation_id, application_id, vacancy_id, candidate_id, status, job_title, department, location_name, manager_name, manager_user_id, proposed_start_date, accepted_at, archived_at").eq("organisation_id", access.organisationId).is("archived_at", null),
      (supabase as any).from("leo_talent_vacancies").select("id, title, department, location_name, hiring_manager_name, hiring_manager_user_id").eq("organisation_id", access.organisationId).is("archived_at", null),
      (supabase as any).from("leo_talent_appointments").select("offer_id").eq("organisation_id", access.organisationId),
    ]);

    const initialError = offersInitial.error || vacanciesInitial.error || appointmentsInitial.error;
    if (initialError) throw new Error(initialError.message);

    const vacancyById = new Map((vacanciesInitial.data ?? []).map((row: any) => [String(row.id), row]));
    const usedOfferIds = new Set((appointmentsInitial.data ?? []).map((row: any) => String(row.offer_id)));
    let syncedCount = 0;

    if (writeRoles.has(access.role)) {
      for (const offer of offersInitial.data ?? []) {
        if (!(offer.status === "accepted" || Boolean(offer.accepted_at)) || usedOfferIds.has(String(offer.id))) continue;
        if (!offer.proposed_start_date) continue;

        const decisionOutcome = await getAppointmentDecisionOutcome(
          supabase as any,
          access.organisationId,
          String(offer.application_id),
        );
        if (blockedByDecision(decisionOutcome)) continue;

        const result = await createAppointmentForOffer(
          supabase as any,
          access.organisationId,
          offer,
          vacancyById.get(String(offer.vacancy_id)),
          {
            agreedStartDate: offer.proposed_start_date,
            includeDbs: false,
            includeEquipment: true,
            includeLearning: true,
            automatic: true,
            decisionOutcome,
          },
        );
        if (result.created) syncedCount += 1;
      }
    }

    const [appointmentsResult, itemsResult, offersResult, applicationsResult, candidatesResult, vacanciesResult] = await Promise.all([
      (supabase as any).from("leo_talent_appointments").select("*").eq("organisation_id", access.organisationId).order("updated_at", { ascending: false }),
      (supabase as any).from("leo_talent_onboarding_items").select("*").eq("organisation_id", access.organisationId).order("created_at", { ascending: true }),
      (supabase as any).from("leo_talent_offers").select("id, organisation_id, application_id, vacancy_id, candidate_id, status, job_title, department, location_name, manager_name, manager_user_id, proposed_start_date, accepted_at, archived_at").eq("organisation_id", access.organisationId).is("archived_at", null),
      (supabase as any).from("leo_talent_applications").select("id, status, current_stage_key").eq("organisation_id", access.organisationId).is("archived_at", null),
      (supabase as any).from("leo_talent_candidates").select("id, first_name, last_name, preferred_name, email, phone").eq("organisation_id", access.organisationId).is("archived_at", null),
      (supabase as any).from("leo_talent_vacancies").select("id, title, department, location_name, hiring_manager_name, hiring_manager_user_id").eq("organisation_id", access.organisationId).is("archived_at", null),
    ]);

    const firstError = appointmentsResult.error || itemsResult.error || offersResult.error || applicationsResult.error || candidatesResult.error || vacanciesResult.error;
    if (firstError) throw new Error(firstError.message);

    return NextResponse.json({
      success: true,
      syncedCount,
      appointments: appointmentsResult.data ?? [],
      items: itemsResult.data ?? [],
      offers: offersResult.data ?? [],
      applications: applicationsResult.data ?? [],
      candidates: candidatesResult.data ?? [],
      vacancies: vacanciesResult.data ?? [],
    });
  } catch (error) {
    console.error("Onboarding loading failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Leo Talent could not load the onboarding workspace." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase as any);
    if ("error" in access) return access.error;
    if (!writeRoles.has(access.role)) {
      return NextResponse.json({ success: false, error: "You do not have permission to create onboarding records." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (text(body.action) !== "create_appointment") {
      return NextResponse.json({ success: false, error: "The requested action is not supported." }, { status: 400 });
    }

    const offerId = text(body.offerId);
    const agreedStartDate = text(body.agreedStartDate);
    if (!offerId) return NextResponse.json({ success: false, error: "Select an accepted offer." }, { status: 400 });
    if (!agreedStartDate) return NextResponse.json({ success: false, error: "Enter the agreed start date." }, { status: 400 });

    const offerResult = await (supabase as any)
      .from("leo_talent_offers")
      .select("*")
      .eq("id", offerId)
      .eq("organisation_id", access.organisationId)
      .is("archived_at", null)
      .maybeSingle();
    if (offerResult.error) throw new Error(offerResult.error.message);
    if (!offerResult.data) return NextResponse.json({ success: false, error: "The accepted offer was not found." }, { status: 404 });
    if (!(offerResult.data.status === "accepted" || Boolean(offerResult.data.accepted_at))) {
      return NextResponse.json({ success: false, error: "Only accepted offers can enter onboarding." }, { status: 400 });
    }

    const decisionOutcome = await getAppointmentDecisionOutcome(
      supabase as any,
      access.organisationId,
      String(offerResult.data.application_id),
    );

    if (blockedByDecision(decisionOutcome)) {
      return NextResponse.json(
        {
          success: false,
          error: `Appointment progression is blocked because the appointment decision is ${decisionOutcome.replaceAll("_", " ")}.`,
        },
        { status: 409 },
      );
    }

    const vacancyResult = await (supabase as any)
      .from("leo_talent_vacancies")
      .select("*")
      .eq("id", offerResult.data.vacancy_id)
      .eq("organisation_id", access.organisationId)
      .maybeSingle();
    if (vacancyResult.error) throw new Error(vacancyResult.error.message);

    const result = await createAppointmentForOffer(
      supabase as any,
      access.organisationId,
      offerResult.data,
      vacancyResult.data,
      {
        agreedStartDate,
        managerName: text(body.managerName),
        department: text(body.department),
        locationName: text(body.locationName),
        includeDbs: body.includeDbs === true,
        includeEquipment: body.includeEquipment !== false,
        includeLearning: body.includeLearning !== false,
        decisionOutcome,
      },
    );

    if (!result.created) {
      return NextResponse.json({ success: false, error: "Onboarding already exists for this offer." }, { status: 409 });
    }

    return NextResponse.json({ success: true, appointment: result.appointment }, { status: 201 });
  } catch (error) {
    console.error("Onboarding creation failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "The onboarding appointment could not be created." },
      { status: 500 },
    );
  }
}