import { createClient as createAdminClient } from "@supabase/supabase-js";

type AppliedAction = {
  key: string;
  summary: string;
};

type PendingDetail = {
  key: string;
  summary: string;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase administrator credentials are not configured.");
  }

  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function extractManager(message: string): string | null {
  const patterns = [
    /line manager is\s+([A-Za-z][A-Za-z'’-]{0,40}(?:\s+[A-Za-z][A-Za-z'’-]{0,40})?)(?=\s+(?:which|who|and|but|as)\b|[.,]|$)/i,
    /report(?:s)? to\s+([A-Za-z][A-Za-z'’-]{0,40}(?:\s+[A-Za-z][A-Za-z'’-]{0,40})?)(?=\s+(?:which|who|and|but|as)\b|[.,]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return null;
}

function confirmsNoDbs(message: string): boolean {
  return /does(?:n['’]?t| not)\s+(?:need|require)\s+(?:a\s+)?dbs(?:\s+check)?/i.test(message) ||
    /dbs(?:\s+check)?\s+(?:is\s+)?not\s+required/i.test(message);
}

function confirmsNoTraining(message: string): boolean {
  return /\bfully trained\b/i.test(message) ||
    /does(?:n['’]?t| not)\s+(?:need|require)\s+(?:any\s+)?(?:mandatory\s+)?training/i.test(message) ||
    /\bno\s+(?:mandatory\s+)?training\s+(?:is\s+)?required\b/i.test(message);
}

function selectsDraftContract(message: string): boolean {
  return /\b(?:company\s+)?draft contract\b/i.test(message);
}

function extractEmergencyContacts(message: string): Array<{
  name: string | null;
  relationship: string;
  email: string | null;
}> {
  const relationshipMap: Record<string, string> = {
    mum: "Mother",
    mother: "Mother",
    dad: "Father",
    father: "Father",
    wife: "Wife",
    husband: "Husband",
    partner: "Partner",
    sister: "Sister",
    brother: "Brother",
  };

  const contacts: Array<{ name: string | null; relationship: string; email: string | null }> = [];
  const relationPattern = /\b(mum|mother|dad|father|wife|husband|partner|sister|brother)\b/gi;
  const relationMatches = Array.from(message.matchAll(relationPattern));
  const emails = Array.from(message.matchAll(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi));

  for (let index = 0; index < relationMatches.length; index += 1) {
    const match = relationMatches[index];
    const relationship = relationshipMap[match[1].toLowerCase()];
    const start = (match.index ?? 0) + match[0].length;
    const end = relationMatches[index + 1]?.index ?? message.length;
    const segment = message.slice(start, end);

    const named = segment.match(/^\s*[,\-:]?\s*([A-Za-z][A-Za-z'’-]{1,60})(?=\s*(?:[,.;]|\band\b|$))/i);
    const rejectedWords = new Set(["can", "is", "will", "should", "could", "may", "has", "have"]);
    const candidateName = named?.[1]?.trim() ?? null;
    const name = candidateName && !rejectedWords.has(candidateName.toLowerCase()) ? candidateName : null;
    const email = segment.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0] ?? null;

    contacts.push({ name, relationship, email });
  }

  // If relationships were supplied earlier but this message now supplies contact emails in order,
  // preserve those emails for the existing contact slots rather than inventing names.
  if (contacts.length === 0 && emails.length > 0) {
    return emails.slice(0, 2).map((match, index) => ({
      name: null,
      relationship: index === 0 ? "Mother" : "Father",
      email: match[0],
    }));
  }

  const sharedEmail = message.match(/\b(?:they|both|either|them)\b[^.]{0,80}\b(?:contact(?:ed)?|email(?:ed)?)\b[^.]{0,80}\b(?:on|at)\s+([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)?.[1] ?? null;
  if (sharedEmail && contacts.length > 1) {
    for (const contact of contacts) contact.email = contact.email || sharedEmail;
  }

  // A second email may follow "and Dave can be contacted..." without repeating "dad".
  if (contacts.length === 1 && emails.length > 1) {
    contacts.push({
      name: null,
      relationship: contacts[0].relationship === "Mother" ? "Father" : "Emergency contact",
      email: emails[1][0],
    });
  }

  return contacts.slice(0, 2);
}

function extractVerifiedPassportRtw(message: string): { verified: boolean; isBritishPassport: boolean; passportExpiry: string | null } {
  const verified =
    /\b(?:right to work|rtw)\b[^.]{0,80}\b(?:verified|checked|complete(?:d)?)\b/i.test(message) ||
    /\b(?:verified|checked|complete(?:d)?)\b[^.]{0,80}\b(?:right to work|rtw)\b/i.test(message);

  const hasPassport = /\bpassport\b/i.test(message);
  const isBritishPassport = /\bbritish passport\b/i.test(message);

  if (!verified || !hasPassport) {
    return { verified: false, isBritishPassport: false, passportExpiry: null };
  }

  const expiryMatch = message.match(
    /passport[^.]{0,100}expir(?:es|y|ed)?\s+(?:on\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/i,
  );

  if (!expiryMatch) return { verified: true, isBritishPassport, passportExpiry: null };

  const months: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
    july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
  };
  const month = months[expiryMatch[2].toLowerCase()];
  if (!month) return { verified: true, isBritishPassport, passportExpiry: null };

  return {
    verified: true,
    isBritishPassport,
    passportExpiry: `${expiryMatch[3]}-${month}-${expiryMatch[1].padStart(2, "0")}`,
  };
}

async function writeDecisionEvent(args: {
  admin: ReturnType<typeof getAdminClient>;
  organisationId: string;
  employeeId: number;
  userId: string;
  key: string;
  value: string;
  title: string;
  description: string;
}) {
  const { admin, organisationId, employeeId, userId, key, value, title, description } = args;
  const now = new Date().toISOString();

  const existing = await admin
    .from("employee_timeline")
    .select("id,metadata")
    .eq("organisation_id", organisationId)
    .eq("employee_id", employeeId)
    .eq("source_module", "Agentic Leo")
    .order("created_at", { ascending: false })
    .limit(50);

  if (existing.error) throw new Error(existing.error.message);

  const duplicate = (existing.data ?? []).some(
    (row: any) =>
      row?.metadata?.decision_key === key &&
      String(row?.metadata?.decision_value ?? "") === value,
  );

  if (duplicate) return;

  const result = await admin.from("employee_timeline").insert({
    organisation_id: organisationId,
    employee_id: employeeId,
    event_type: "New Starter Decision",
    title,
    description,
    status: "Confirmed",
    source_module: "Agentic Leo",
    source_record_id: String(employeeId),
    metadata: {
      decision_key: key,
      decision_value: value,
    },
    event_date: now,
    created_by: userId,
    created_at: now,
  });

  if (result.error) throw new Error(result.error.message);
}

async function writeAudit(args: {
  admin: ReturnType<typeof getAdminClient>;
  organisationId: string;
  employeeId: number;
  employeeName: string;
  userId: string;
  userEmail: string | null;
  action: string;
  description: string;
  newValues: Record<string, unknown>;
}) {
  const result = await args.admin.from("audit_logs").insert({
    organisation_id: args.organisationId,
    user_id: args.userId,
    user_name: args.userEmail || "System user",
    user_email: args.userEmail,
    action: args.action,
    action_category: "Employee",
    entity_type: "Employee",
    entity_id: String(args.employeeId),
    entity_name: args.employeeName,
    description: args.description,
    new_values: args.newValues,
    metadata: {
      source_module: "Agentic Leo",
      workflow: "new_starter",
    },
    source_page: `/dashboard/employees/${args.employeeId}`,
    created_at: new Date().toISOString(),
  });

  if (result.error) {
    console.warn("Agentic Leo audit event could not be written:", result.error);
  }
}

export async function applyNewStarterEmployerMessage(args: {
  organisationId: string;
  employeeId: number;
  userId: string;
  userEmail: string | null;
  message: string;
}): Promise<{
  recognised: boolean;
  applied: AppliedAction[];
  pending: PendingDetail[];
}> {
  const { organisationId, employeeId, userId, userEmail, message } = args;
  const admin = getAdminClient();

  const employeeResult = await admin
    .from("employees")
    .select("id,name")
    .eq("id", employeeId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (employeeResult.error) throw new Error(employeeResult.error.message);
  if (!employeeResult.data) throw new Error("The employee record could not be found or accessed.");

  const employee = employeeResult.data;
  const applied: AppliedAction[] = [];
  const pending: PendingDetail[] = [];

  const managerCandidate = extractManager(message);
  if (managerCandidate) {
    const managerMatches = await admin
      .from("employees")
      .select("id,name,status")
      .eq("organisation_id", organisationId)
      .ilike("name", managerCandidate)
      .neq("id", employeeId)
      .limit(3);

    if (managerMatches.error) throw new Error(managerMatches.error.message);

    const viable = (managerMatches.data ?? []).filter(
      (row: any) => !["Archived", "Former", "Former Employee"].includes(text(row.status)),
    );

    if (viable.length === 1) {
      const canonicalManager = viable[0].name;
      const existingDetails = await admin
        .from("employee_employment_details")
        .select("id,manager")
        .eq("employee_id", employeeId)
        .maybeSingle();

      if (existingDetails.error) throw new Error(existingDetails.error.message);

      const payload = {
        employee_id: employeeId,
        manager: canonicalManager,
        updated_at: new Date().toISOString(),
      };

      const managerUpdate = existingDetails.data
        ? await admin
            .from("employee_employment_details")
            .update(payload)
            .eq("id", existingDetails.data.id)
        : await admin
            .from("employee_employment_details")
            .insert(payload);

      if (managerUpdate.error) throw new Error(managerUpdate.error.message);

      applied.push({
        key: "manager",
        summary: `${canonicalManager} is now recorded as ${employee.name}'s line manager.`,
      });

      await writeAudit({
        admin,
        organisationId,
        employeeId,
        employeeName: employee.name,
        userId,
        userEmail,
        action: "New starter manager confirmed",
        description: `${canonicalManager} was recorded as ${employee.name}'s line manager from an explicit employer instruction in Agentic Leo.`,
        newValues: { manager: canonicalManager },
      });
    } else {
      pending.push({
        key: "manager",
        summary:
          viable.length === 0
            ? `You told me ${managerCandidate} will be the line manager, but I cannot match that name to a current employee in this organisation. I have kept the manager action open rather than guessing.`
            : `You told me ${managerCandidate} will be the line manager, but I found more than one possible match. I have kept the manager action open rather than guessing.`,
      });
    }
  }

  if (confirmsNoDbs(message)) {
    const dbsInsert = await admin.from("employee_dbs_checks").insert({
      employee_id: employeeId,
      dbs_required: "No",
      dbs_level: null,
      certificate_number: null,
      certificate_issue_date: null,
      next_check_due: null,
      update_service: "No",
      update_service_id: null,
      notes: "Employer confirmed through Agentic Leo that DBS is not required for this role.",
      updated_at: new Date().toISOString(),
    });

    if (dbsInsert.error) throw new Error(dbsInsert.error.message);

    applied.push({
      key: "dbs",
      summary: "DBS is recorded as not required for this role.",
    });

    await writeAudit({
      admin,
      organisationId,
      employeeId,
      employeeName: employee.name,
      userId,
      userEmail,
      action: "DBS requirement confirmed",
      description: `The employer confirmed that a DBS check is not required for ${employee.name}'s role.`,
      newValues: { dbs_required: "No" },
    });
  }

  if (confirmsNoTraining(message)) {
    await writeDecisionEvent({
      admin,
      organisationId,
      employeeId,
      userId,
      key: "mandatory_learning",
      value: "not_required",
      title: "Mandatory learning not required",
      description: "The employer confirmed that no additional mandatory learning is required for this starter.",
    });

    applied.push({
      key: "mandatory_learning",
      summary: "No additional mandatory learning is recorded as required for this starter.",
    });

    await writeAudit({
      admin,
      organisationId,
      employeeId,
      employeeName: employee.name,
      userId,
      userEmail,
      action: "Mandatory learning requirement confirmed",
      description: `The employer confirmed that no additional mandatory learning is required for ${employee.name}.`,
      newValues: { mandatory_learning: "not_required" },
    });
  }

  if (selectsDraftContract(message)) {
    await writeDecisionEvent({
      admin,
      organisationId,
      employeeId,
      userId,
      key: "contract_source",
      value: "company_draft_contract",
      title: "Draft contract selected",
      description: "The employer selected the organisation's company draft contract as the basis for this starter's employment documents.",
    });

    applied.push({
      key: "contract_source",
      summary: "The company draft contract is recorded as the basis for preparing the employment documents. Nothing has been issued.",
    });
  }

  const passportRtw = extractVerifiedPassportRtw(message);
  if (passportRtw.verified) {
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const notes = passportRtw.passportExpiry
      ? passportRtw.isBritishPassport
        ? `Employer confirmed through Agentic Leo that a British passport was used to verify right to work. Passport expiry: ${passportRtw.passportExpiry}. Passport expiry is recorded as document information only and is not treated as an expiry of British right to work.`
        : `Employer confirmed through Agentic Leo that a passport was used to verify right to work. Passport expiry: ${passportRtw.passportExpiry}.`
      : passportRtw.isBritishPassport
        ? "Employer confirmed through Agentic Leo that a British passport was used to verify right to work."
        : "Employer confirmed through Agentic Leo that a passport was used to verify right to work.";

    const rtwInsert = await admin.from("employee_right_to_work").insert({
      employee_id: employeeId,
      nationality: passportRtw.isBritishPassport ? "British" : null,
      immigration_status: null,
      visa_or_permit_type: null,
      share_code: null,
      right_to_work_expiry: null,
      restrictions: null,
      check_completed_date: today,
      next_review_date: null,
      notes,
      updated_at: now,
    });

    if (rtwInsert.error) throw new Error(rtwInsert.error.message);

    applied.push({
      key: "right_to_work",
      summary: passportRtw.passportExpiry
        ? passportRtw.isBritishPassport
          ? `Right to work is recorded as verified using a British passport. I noted the passport expiry as ${passportRtw.passportExpiry}, but I have not treated that as an expiry of the right to work.`
          : `Right to work is recorded as verified using a passport. Passport expiry: ${passportRtw.passportExpiry}.`
        : passportRtw.isBritishPassport
          ? "Right to work is recorded as verified using a British passport."
          : "Right to work is recorded as verified using a passport.",
    });

    await writeAudit({
      admin,
      organisationId,
      employeeId,
      employeeName: employee.name,
      userId,
      userEmail,
      action: "Right to work verified",
      description: `The employer confirmed that ${employee.name}'s right to work was verified using a ${passportRtw.isBritishPassport ? "British passport" : "passport"}.`,
      newValues: {
        nationality: passportRtw.isBritishPassport ? "British" : null,
        check_completed_date: today,
        passport_expiry: passportRtw.passportExpiry,
        right_to_work_expiry: null,
      },
    });
  }

  const emergencyContacts = extractEmergencyContacts(message);
  if (emergencyContacts.length > 0) {
    const existingContacts = await admin
      .from("employee_emergency_contacts")
      .select("id,contact_number,full_name,relationship,phone,email,address")
      .eq("employee_id", employeeId)
      .order("contact_number", { ascending: true });

    if (existingContacts.error) throw new Error(existingContacts.error.message);

    for (let index = 0; index < emergencyContacts.length; index += 1) {
      const incoming = emergencyContacts[index];
      const contactNumber = (index + 1) as 1 | 2;
      const existing = (existingContacts.data ?? []).find(
        (row: any) => row.contact_number === contactNumber,
      );

      const payload = {
        employee_id: employeeId,
        contact_number: contactNumber,
        full_name: incoming.name || existing?.full_name || incoming.relationship,
        relationship: incoming.relationship || existing?.relationship || "Emergency contact",
        phone: existing?.phone ?? null,
        email: incoming.email || existing?.email || null,
        address: existing?.address ?? null,
        updated_at: new Date().toISOString(),
      };

      const save = existing
        ? await admin
            .from("employee_emergency_contacts")
            .update(payload)
            .eq("id", existing.id)
        : await admin
            .from("employee_emergency_contacts")
            .insert(payload);

      if (save.error) throw new Error(save.error.message);
    }

    applied.push({
      key: "emergency_contact",
      summary: `I recorded the emergency contact information supplied for ${emergencyContacts.map((contact) => contact.name ? `${contact.name} (${contact.relationship.toLowerCase()})` : contact.relationship.toLowerCase()).join(" and ")}.`,
    });

    const savedContactDetails = emergencyContacts.map((incoming, index) => {
      const existing = (existingContacts.data ?? []).find(
        (row: any) => row.contact_number === index + 1,
      );
      return {
        phone: text(existing?.phone),
        email: text(incoming.email) || text(existing?.email),
      };
    });
    const contactDetailsMissing = savedContactDetails.some(
      (contact) => !contact.phone && !contact.email,
    );
    if (contactDetailsMissing) {
      pending.push({
        key: "emergency_contact_details",
        summary: "At least one emergency contact still needs a telephone number or email address, so I have kept that action open.",
      });
    }

    await writeAudit({
      admin,
      organisationId,
      employeeId,
      employeeName: employee.name,
      userId,
      userEmail,
      action: "Emergency contact names recorded",
      description: `Partial emergency contact details were recorded for ${employee.name}. The readiness item remains open until the required contact details are complete.`,
      newValues: {
        contacts: emergencyContacts,
        incomplete: true,
      },
    });
  }

  return {
    recognised:
      Boolean(managerCandidate) ||
      confirmsNoDbs(message) ||
      confirmsNoTraining(message) ||
      selectsDraftContract(message) ||
      passportRtw.verified ||
      emergencyContacts.length > 0,
    applied,
    pending,
  };
}
