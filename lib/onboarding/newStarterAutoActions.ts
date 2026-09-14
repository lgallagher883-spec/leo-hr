import { createClient as createAdminClient } from "@supabase/supabase-js";

type AutoActionSummary = {
  key: string;
  summary: string;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase administrator credentials are not configured.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function addMonths(value: string, months: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function validEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function lowerText(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function findFoundationValue(
  rows: Array<{ section?: unknown; key?: unknown; value?: unknown }>,
  terms: string[],
): string | null {
  for (const row of rows) {
    const key = lowerText(row.key);
    if (terms.some((term) => key.includes(term))) {
      const value = typeof row.value === "string" ? row.value.trim() : "";
      if (value) return value;
    }
  }
  return null;
}

function buildContractMissingFields(args: {
  employee: Record<string, any>;
  employment: Record<string, any> | null;
  foundations: Array<Record<string, any>>;
}): string[] {
  const { employee, employment, foundations } = args;
  const missing: string[] = [];

  if (!employee.role) missing.push("Role / job title");
  if (!employee.start_date) missing.push("Start date");

  const salary =
    employment?.salary ??
    employment?.pay ??
    employment?.annual_salary ??
    findFoundationValue(foundations, ["salary", "pay", "remuneration"]);
  if (!salary) missing.push("Salary / pay");

  const hours =
    employment?.contracted_hours_per_week ??
    findFoundationValue(foundations, ["contracted hours", "working hours", "hours per week"]);
  if (!hours) missing.push("Contracted hours");

  const placeOfWork =
    employment?.place_of_work ??
    employment?.work_location ??
    findFoundationValue(foundations, ["place of work", "work location", "workplace"]);
  if (!placeOfWork) missing.push("Place of work");

  return missing;
}

export async function runNewStarterAutomaticActions(args: {
  organisationId: string;
  employeeId: number;
  userId: string;
}): Promise<{ completed: AutoActionSummary[]; deferred: AutoActionSummary[] }> {
  const { organisationId, employeeId, userId } = args;
  const admin = adminClient();
  const completed: AutoActionSummary[] = [];
  const deferred: AutoActionSummary[] = [];

  const employeeResult = await admin
    .from("employees")
    .select("id,name,email,role,start_date,status")
    .eq("id", employeeId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (employeeResult.error) throw new Error(employeeResult.error.message);
  if (!employeeResult.data) throw new Error("The employee record could not be found.");

  const employee = employeeResult.data;

  // Probation is a Leo-owned preparation step. Use the platform's standard 3-month workflow.
  if (employee.start_date) {
    const existingProbation = await admin
      .from("employee_probations")
      .select("id")
      .eq("employee_id", employeeId)
      .eq("is_archived", false)
      .maybeSingle();

    if (existingProbation.error) throw new Error(existingProbation.error.message);

    if (!existingProbation.data) {
      const standardEndDate = addMonths(employee.start_date, 3);
      const finalDecisionDeadline = addMonths(employee.start_date, 5);
      const probation = await admin
        .from("employee_probations")
        .insert({
          employee_id: employeeId,
          status: "Active",
          probation_start_date: employee.start_date,
          standard_end_date: standardEndDate,
          current_end_date: standardEndDate,
          final_decision_deadline: finalDecisionDeadline,
        })
        .select("id")
        .single();

      if (probation.error || !probation.data) {
        deferred.push({ key: "probation", summary: "Leo could not create the probation schedule automatically." });
      } else {
        const reviews = [
          { review_type: "Initial Check-in", review_week: 2, scheduled_date: addDays(employee.start_date, 14) },
          { review_type: "First Review", review_week: 4, scheduled_date: addDays(employee.start_date, 28) },
          { review_type: "Progress Review", review_week: 8, scheduled_date: addDays(employee.start_date, 56) },
          { review_type: "Final Review", review_week: 12, scheduled_date: addDays(employee.start_date, 84) },
        ].map((review) => ({
          probation_id: probation.data.id,
          employee_id: employeeId,
          ...review,
          status: "Scheduled",
        }));

        const reviewsResult = await admin.from("probation_reviews").insert(reviews);
        if (reviewsResult.error) {
          await admin.from("employee_probations").delete().eq("id", probation.data.id);
          deferred.push({ key: "probation", summary: "Leo could not complete the probation review schedule automatically." });
        } else {
          completed.push({ key: "probation", summary: "Leo created the standard probation period and review schedule." });
        }
      }
    }
  }

  // Every starter gets normal Employee portal access when a valid email is already held.
  if (validEmail(employee.email)) {
    const email = employee.email.trim().toLowerCase();
    const existingInvitation = await admin
      .from("organisation_invitations")
      .select("id,invitation_status")
      .eq("organisation_id", organisationId)
      .eq("employee_id", employeeId)
      .in("invitation_status", ["pending", "accepted"])
      .limit(1);

    if (existingInvitation.error) throw new Error(existingInvitation.error.message);

    if ((existingInvitation.data ?? []).length === 0) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
      const invitation = await admin
        .from("organisation_invitations")
        .insert({
          organisation_id: organisationId,
          employee_id: employeeId,
          email,
          role: "employee",
          invitation_status: "pending",
          invited_by: userId,
          expires_at: expiresAt,
          metadata: {
            employee_id: employeeId,
            employee_name: employee.name,
            role_name: "Employee",
            source: "agentic_leo_new_starter",
          },
          updated_at: now.toISOString(),
        })
        .select("id")
        .single();

      if (invitation.error || !invitation.data) {
        deferred.push({ key: "portal_invitation", summary: "Leo could not create the employee portal invitation automatically." });
      } else {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
        const invite = await admin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${appUrl}/auth/accept-invitation`,
          data: {
            organisation_invitation_id: invitation.data.id,
            organisation_id: organisationId,
            organisation_role: "employee",
            employee_id: employeeId,
            invited_by: userId,
          },
        });

        if (invite.error) {
          await admin.from("organisation_invitations").delete().eq("id", invitation.data.id);
          deferred.push({ key: "portal_invitation", summary: "Leo could not send the employee portal invitation automatically." });
        } else {
          completed.push({ key: "portal_invitation", summary: "Leo sent the Employee portal invitation." });
        }
      }
    }
  } else {
    deferred.push({ key: "portal_invitation", summary: "Leo needs a valid employee email before it can send the portal invitation." });
  }

  // Contract preparation belongs to Leo. Identify the organisation's contract resource and capture
  // the employee + Foundation context so the employer is not asked to re-enter information Leo holds.
  const [contractResource, foundations, employment] = await Promise.all([
    admin
      .from("company_documents")
      .select("id,name,document_type,category,file_name,file_path,notes")
      .eq("organisation_id", organisationId)
      .eq("is_archived", false)
      .or("name.ilike.%contract%,document_type.ilike.%contract%,category.ilike.%contract%")
      .order("updated_at", { ascending: false })
      .limit(1),
    admin
      .from("organisation_foundations")
      .select("section,key,value")
      .eq("organisation_id", organisationId)
      .in("section", ["Company Profile", "Employment Framework", "Organisation Structure"]),
    admin
      .from("employee_employment_details")
      .select("*")
      .eq("employee_id", employeeId)
      .maybeSingle(),
  ]);

  if (!contractResource.error && (contractResource.data ?? []).length > 0) {
    const source = contractResource.data![0];
    const contractMissingFields = buildContractMissingFields({
      employee,
      employment: employment.data ?? null,
      foundations: (foundations.data ?? []) as Array<Record<string, any>>,
    });
    const existingPrep = await admin
      .from("employee_timeline")
      .select("id")
      .eq("organisation_id", organisationId)
      .eq("employee_id", employeeId)
      .eq("source_module", "Agentic Leo")
      .eq("event_type", "Contract Preparation")
      .limit(1);

    if (!existingPrep.error && (existingPrep.data ?? []).length === 0) {
      const event = await admin.from("employee_timeline").insert({
        organisation_id: organisationId,
        employee_id: employeeId,
        event_type: "Contract Preparation",
        title: "Employment contract preparation started",
        description: "Leo selected the organisation contract resource and assembled the company and employee data already held for document preparation.",
        status: "Prepared",
        source_module: "Agentic Leo",
        source_record_id: String(source.id),
        metadata: {
          contract_resource: source,
          employee: {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
            start_date: employee.start_date,
          },
          employment_details: employment.data ?? null,
          foundation_facts: foundations.data ?? [],
          missing_fields: contractMissingFields,
          issue_status: "not_issued",
        },
        event_date: new Date().toISOString(),
        created_by: userId,
        created_at: new Date().toISOString(),
      });

      if (!event.error) {
        completed.push({
          key: "contract_preparation",
          summary: contractMissingFields.length > 0
            ? `Leo prepared the contract context and identified ${contractMissingFields.length} term${contractMissingFields.length === 1 ? "" : "s"} that still need confirmation.`
            : "Leo selected the company contract resource and assembled the known company and employee details for the draft.",
        });
      }
    }
  } else {
    deferred.push({ key: "contract_preparation", summary: "Leo could not identify an organisation contract resource to use automatically." });
  }

  return { completed, deferred };
}
