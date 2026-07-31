import { createClient as createAdminClient } from "@supabase/supabase-js";

import {
  cancelMicrosoftCalendarEvent,
  createMicrosoftCalendarEvent,
  deleteMicrosoftCalendarEvent,
  getMicrosoftCalendarEvent,
  updateMicrosoftCalendarEvent,
  type MicrosoftCalendarEventInput,
  type MicrosoftEventAttendee,
} from "@/lib/connections/microsoft/calendar";

type Relation<T> = T | T[] | null;

type Candidate = {
  first_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  email?: string | null;
};

type Vacancy = {
  title?: string | null;
};

type Application = {
  application_reference?: string | null;
};

type PanelMember = {
  member_name?: string | null;
  member_email?: string | null;
};

type Interview = {
  id: string;
  organisation_id: string;
  stage_name: string;
  interview_type: string;
  status: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  timezone_name: string | null;
  location: string | null;
  meeting_url: string | null;
  candidate_instructions: string | null;
  calendar_event_id: string | null;
  candidate: Relation<Candidate>;
  vacancy: Relation<Vacancy>;
  application: Relation<Application>;
  panel_members: PanelMember[] | null;
};

type ConnectionRow = { id: number };

const eligibleStatuses = new Set([
  "scheduled",
  "invited",
  "confirmed",
  "reschedule_requested",
]);

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase administrator credentials are not configured.");
  }

  return createAdminClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function first<T>(value: Relation<T>): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function candidateName(candidate: Candidate | null) {
  if (!candidate) return "Candidate";

  return [
    text(candidate.preferred_name) || text(candidate.first_name),
    text(candidate.last_name),
  ]
    .filter(Boolean)
    .join(" ") || "Candidate";
}

function attendees(interview: Interview): MicrosoftEventAttendee[] {
  const result = new Map<string, MicrosoftEventAttendee>();
  const candidate = first(interview.candidate);
  const candidateEmail = text(candidate?.email).toLowerCase();

  if (candidateEmail.includes("@")) {
    result.set(candidateEmail, {
      name: candidateName(candidate),
      address: candidateEmail,
      type: "required",
    });
  }

  for (const member of interview.panel_members ?? []) {
    const email = text(member.member_email).toLowerCase();

    if (email.includes("@") && !result.has(email)) {
      result.set(email, {
        name: text(member.member_name) || undefined,
        address: email,
        type: "required",
      });
    }
  }

  return Array.from(result.values());
}

function body(interview: Interview, joinUrl?: string | null) {
  const candidate = first(interview.candidate);
  const vacancy = first(interview.vacancy);
  const application = first(interview.application);

  const rows = [
    `<p>This interview was arranged through <strong>LEO Talent</strong>.</p>`,
    `<p><strong>Candidate:</strong> ${escapeHtml(candidateName(candidate))}</p>`,
    `<p><strong>Vacancy:</strong> ${escapeHtml(text(vacancy?.title) || "Vacancy")}</p>`,
    `<p><strong>Stage:</strong> ${escapeHtml(interview.stage_name)}</p>`,
  ];

  if (application?.application_reference) {
    rows.push(
      `<p><strong>Application reference:</strong> ${escapeHtml(application.application_reference)}</p>`,
    );
  }

  if (interview.candidate_instructions) {
    rows.push(
      `<p><strong>Interview information</strong></p><p>${escapeHtml(
        interview.candidate_instructions,
      ).replaceAll("\n", "<br />")}</p>`,
    );
  }

  rows.push(
    `<p><strong>Please confirm your attendance</strong></p>`,
    `<p>Use the Accept, Tentative or Decline response in this calendar invitation so the hiring team knows whether you can attend.</p>`,
  );

  if (joinUrl) {
    rows.push(
      `<p><a href="${escapeHtml(joinUrl)}"><strong>Join Microsoft Teams meeting</strong></a></p>`,
    );
  }

  rows.push(
    `<p>If you require a reasonable adjustment or need to discuss accessibility, contact the hiring organisation before the interview.</p>`,
  );

  return rows.join("\n");
}

async function connectionFor(organisationId: string): Promise<ConnectionRow | null> {
  const admin = adminClient();

  const provider = await admin
    .from("connection_providers")
    .select("id")
    .in("provider_key", [
      "microsoft-365",
      "microsoft_365",
      "microsoft365",
    ])
    .limit(1)
    .maybeSingle();

  if (provider.error || !provider.data) return null;

  const connection = await admin
    .from("organisation_connections")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("provider_id", provider.data.id)
    .ilike("status", "connected")
    .eq("is_archived", false)
    .limit(1)
    .maybeSingle();

  if (connection.error || !connection.data) return null;

  return { id: Number(connection.data.id) };
}

async function loadInterview(interviewId: string, organisationId: string) {
  const admin = adminClient();

  const result = await admin
    .from("leo_talent_interviews")
    .select(`
      id,
      organisation_id,
      stage_name,
      interview_type,
      status,
      scheduled_start,
      scheduled_end,
      timezone_name,
      location,
      meeting_url,
      candidate_instructions,
      calendar_event_id,
      candidate:leo_talent_candidates (
        first_name,
        last_name,
        preferred_name,
        email
      ),
      vacancy:leo_talent_vacancies (
        title
      ),
      application:leo_talent_applications (
        application_reference
      ),
      panel_members:leo_talent_interview_panel_members (
        member_name,
        member_email
      )
    `)
    .eq("id", interviewId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (result.error || !result.data) {
    throw new Error(
      result.error?.message || "The interview could not be loaded for Microsoft synchronisation.",
    );
  }

  return result.data as unknown as Interview;
}

function eventInput(interview: Interview, joinUrl?: string | null): MicrosoftCalendarEventInput {
  const candidate = first(interview.candidate);
  const vacancy = first(interview.vacancy);
  const video = interview.interview_type === "video";

  return {
    subject: `Interview: ${candidateName(candidate)} — ${
      text(vacancy?.title) || "Vacancy"
    }`,
    body: body(interview, joinUrl),
    bodyType: "HTML",
    startDateTime: interview.scheduled_start!,
    endDateTime: interview.scheduled_end!,
    timeZone: interview.timezone_name || "Europe/London",
    location:
      interview.location ||
      (video ? "Microsoft Teams" : undefined),
    attendees: attendees(interview),
    createTeamsMeeting: video,
    transactionId: interview.id,
    allowNewTimeProposals: true,
    responseRequested: true,
    reminderMinutesBeforeStart: 30,
  };
}

async function saveSync(
  interview: Interview,
  values: Record<string, unknown>,
) {
  const admin = adminClient();
  const result = await admin
    .from("leo_talent_interviews")
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq("id", interview.id)
    .eq("organisation_id", interview.organisation_id);

  if (result.error) throw new Error(result.error.message);
}

export async function synchroniseTalentInterview(
  interviewId: string,
  organisationId: string,
) {
  const interview = await loadInterview(interviewId, organisationId);
  const connection = await connectionFor(organisationId);

  if (!connection) {
    return {
      status: "not_synced",
      warning:
        "The interview was saved, but no connected Microsoft 365 account was available.",
    };
  }

  try {
    if (interview.status === "cancelled") {
      if (interview.calendar_event_id) {
        await cancelMicrosoftCalendarEvent(
          connection.id,
          interview.calendar_event_id,
          "This interview has been cancelled through LEO Talent.",
        );
      }

      await saveSync(interview, {
        calendar_provider: "microsoft-365",
        calendar_sync_status: "synced",
      });

      return { status: "synced", warning: null };
    }

    if (
      !eligibleStatuses.has(interview.status) ||
      !interview.scheduled_start ||
      !interview.scheduled_end
    ) {
      if (interview.calendar_event_id) {
        await deleteMicrosoftCalendarEvent(
          connection.id,
          interview.calendar_event_id,
        );
      }

      await saveSync(interview, {
        calendar_provider: "microsoft-365",
        calendar_event_id: null,
        calendar_sync_status: "not_synced",
        meeting_url: null,
      });

      return { status: "not_synced", warning: null };
    }

    await saveSync(interview, {
      calendar_provider: "microsoft-365",
      calendar_sync_status: "pending",
    });

    let result;

    if (interview.calendar_event_id) {
      const current = await getMicrosoftCalendarEvent(
        connection.id,
        interview.calendar_event_id,
      );

      const wantsTeams = interview.interview_type === "video";
      const hasTeams = current.data.isOnlineMeeting === true;

      if (wantsTeams !== hasTeams) {
        await deleteMicrosoftCalendarEvent(
          connection.id,
          interview.calendar_event_id,
        );

        result = await createMicrosoftCalendarEvent(
          connection.id,
          eventInput(interview),
        );
      } else {
        result = await updateMicrosoftCalendarEvent(
          connection.id,
          interview.calendar_event_id,
          eventInput(
            interview,
            current.data.onlineMeeting?.joinUrl,
          ),
        );
      }
    } else {
      result = await createMicrosoftCalendarEvent(
        connection.id,
        eventInput(interview),
      );
    }

    const joinUrl = result.data.onlineMeeting?.joinUrl ?? null;

    if (joinUrl) {
      result = await updateMicrosoftCalendarEvent(
        connection.id,
        result.data.id,
        eventInput(interview, joinUrl),
      );
    }

    await saveSync(interview, {
      calendar_provider: "microsoft-365",
      calendar_event_id: result.data.id,
      calendar_sync_status: "synced",
      meeting_url: result.data.onlineMeeting?.joinUrl ?? interview.meeting_url,
    });

    return { status: "synced", warning: null };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Microsoft 365 synchronisation failed.";

    await saveSync(interview, {
      calendar_provider: "microsoft-365",
      calendar_sync_status: "failed",
    });

    console.error("Talent interview Microsoft sync failed:", {
      interviewId,
      organisationId,
      error,
    });

    return {
      status: "failed",
      warning: `The interview was saved, but Microsoft 365 could not be updated: ${message}`,
    };
  }
}