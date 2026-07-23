"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { supabase } from "@/lib/supabase";

type InterviewType =
  | "telephone"
  | "video"
  | "in_person"
  | "panel"
  | "practical"
  | "assessment"
  | "presentation"
  | "structured"
  | "other";

type InterviewStatus =
  | "draft"
  | "scheduled"
  | "invited"
  | "confirmed"
  | "reschedule_requested"
  | "cancelled"
  | "completed"
  | "no_show";

type InterviewOutcome =
  | "proceed"
  | "hold"
  | "additional_stage"
  | "offer"
  | "unsuccessful"
  | "withdrawn";

type CalendarSyncStatus =
  | "not_synced"
  | "pending"
  | "synced"
  | "failed"
  | "removed";

type PanelRole =
  | "chair"
  | "member"
  | "observer"
  | "note_taker"
  | "hiring_manager";

type AttendanceStatus =
  | "invited"
  | "accepted"
  | "declined"
  | "tentative"
  | "attended"
  | "absent";

type InterviewFilter =
  | "upcoming"
  | "today"
  | "awaiting_confirmation"
  | "reschedule"
  | "completed"
  | "cancelled"
  | "archived"
  | "all";

type CandidateSummary = {
  id: string;
  candidate_reference: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
};

type VacancySummary = {
  id: string;
  vacancy_reference: string;
  title: string;
  department: string | null;
  location_name: string | null;
};

type ApplicationOption = {
  id: string;
  application_reference: string;
  candidate_id: string;
  vacancy_id: string;
  current_stage_key: string;
  status: string;
  archived_at: string | null;
  candidate: CandidateSummary | null;
  vacancy: VacancySummary | null;
};

type InterviewTemplate = {
  id: string;
  name: string;
  description: string | null;
  stage_name: string | null;
  interview_type: InterviewType;
  instructions: string | null;
  total_score_available: number | null;
  pass_score: number | null;
  is_default: boolean;
  is_active: boolean;
  archived_at: string | null;
};

type PanelMember = {
  id: string;
  interview_id: string;
  user_id: string | null;
  employee_id: number | null;
  member_name: string;
  member_email: string | null;
  panel_role: PanelRole;
  attendance_status: AttendanceStatus;
  can_score: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type InterviewScorecard = {
  id: string;
  interview_id: string;
  reviewer_name: string | null;
  status: "draft" | "submitted" | "locked" | "returned";
  total_score: number | null;
  maximum_score: number | null;
  recommendation:
    | "strong_proceed"
    | "proceed"
    | "hold"
    | "do_not_proceed"
    | null;
  strengths: string | null;
  concerns: string | null;
  overall_notes: string | null;
  submitted_at: string | null;
};

type TalentInterview = {
  id: string;
  organisation_id: string | null;
  interview_reference: string;
  application_id: string;
  vacancy_id: string;
  candidate_id: string;
  template_id: string | null;
  stage_number: number;
  stage_name: string;
  interview_type: InterviewType;
  status: InterviewStatus;
  scheduled_start: string | null;
  scheduled_end: string | null;
  timezone_name: string;
  location: string | null;
  meeting_url: string | null;
  candidate_instructions: string | null;
  internal_instructions: string | null;
  invitation_sent_at: string | null;
  candidate_confirmed_at: string | null;
  completed_at: string | null;
  overall_score: number | null;
  outcome: InterviewOutcome | null;
  outcome_reason: string | null;
  ai_recommendation: string | null;
  ai_recommendation_reason: string | null;
  calendar_provider: string | null;
  calendar_event_id: string | null;
  calendar_sync_status: CalendarSyncStatus;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  candidate: CandidateSummary | null;
  vacancy: VacancySummary | null;
  application: {
    id: string;
    application_reference: string;
    current_stage_key: string;
    status: string;
  } | null;
  template: InterviewTemplate | null;
  panel_members: PanelMember[];
  scorecards: InterviewScorecard[];
};

type PanelMemberForm = {
  localId: string;
  existingId: string | null;
  memberName: string;
  memberEmail: string;
  panelRole: PanelRole;
  attendanceStatus: AttendanceStatus;
  canScore: boolean;
};

type InterviewFormState = {
  applicationId: string;
  templateId: string;
  stageNumber: string;
  stageName: string;
  interviewType: InterviewType;
  status: InterviewStatus;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  timezoneName: string;
  location: string;
  meetingUrl: string;
  candidateInstructions: string;
  internalInstructions: string;
  outcome: "" | InterviewOutcome;
  outcomeReason: string;
  overallScore: string;
  panelMembers: PanelMemberForm[];
};

const emptyForm: InterviewFormState = {
  applicationId: "",
  templateId: "",
  stageNumber: "1",
  stageName: "First Interview",
  interviewType: "in_person",
  status: "draft",
  scheduledDate: "",
  startTime: "10:00",
  endTime: "11:00",
  timezoneName: "Europe/London",
  location: "",
  meetingUrl: "",
  candidateInstructions: "",
  internalInstructions: "",
  outcome: "",
  outcomeReason: "",
  overallScore: "",
  panelMembers: [],
};

const filterOptions: Array<{
  value: InterviewFilter;
  label: string;
}> = [
  { value: "upcoming", label: "Upcoming" },
  { value: "today", label: "Today" },
  {
    value: "awaiting_confirmation",
    label: "Awaiting Confirmation",
  },
  {
    value: "reschedule",
    label: "Reschedule Requested",
  },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

const interviewTypeOptions: Array<{
  value: InterviewType;
  label: string;
}> = [
  { value: "telephone", label: "Telephone" },
  { value: "video", label: "Video" },
  { value: "in_person", label: "In Person" },
  { value: "panel", label: "Panel" },
  { value: "practical", label: "Practical" },
  { value: "assessment", label: "Assessment" },
  { value: "presentation", label: "Presentation" },
  { value: "structured", label: "Structured" },
  { value: "other", label: "Other" },
];

const interviewStatusOptions: Array<{
  value: InterviewStatus;
  label: string;
}> = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "invited", label: "Invited" },
  { value: "confirmed", label: "Confirmed" },
  {
    value: "reschedule_requested",
    label: "Reschedule Requested",
  },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No Show" },
];

const outcomeOptions: Array<{
  value: "" | InterviewOutcome;
  label: string;
}> = [
  { value: "", label: "No outcome recorded" },
  { value: "proceed", label: "Proceed" },
  { value: "hold", label: "Hold" },
  {
    value: "additional_stage",
    label: "Additional Stage",
  },
  { value: "offer", label: "Offer" },
  { value: "unsuccessful", label: "Unsuccessful" },
  { value: "withdrawn", label: "Withdrawn" },
];

const panelRoleOptions: Array<{
  value: PanelRole;
  label: string;
}> = [
  { value: "chair", label: "Chair" },
  { value: "member", label: "Member" },
  { value: "observer", label: "Observer" },
  { value: "note_taker", label: "Note Taker" },
  {
    value: "hiring_manager",
    label: "Hiring Manager",
  },
];

const attendanceOptions: Array<{
  value: AttendanceStatus;
  label: string;
}> = [
  { value: "invited", label: "Invited" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "tentative", label: "Tentative" },
  { value: "attended", label: "Attended" },
  { value: "absent", label: "Absent" },
];

const liveInterviewStatuses: InterviewStatus[] = [
  "scheduled",
  "invited",
  "confirmed",
  "reschedule_requested",
];

export default function InterviewsWorkspace() {
  const [interviews, setInterviews] = useState<
    TalentInterview[]
  >([]);

  const [applications, setApplications] = useState<
    ApplicationOption[]
  >([]);

  const [templates, setTemplates] = useState<
    InterviewTemplate[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] =
    useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<InterviewFilter>("upcoming");

  const [showForm, setShowForm] = useState(false);
  const [editingInterviewId, setEditingInterviewId] =
    useState<string | null>(null);

  const [expandedInterviewId, setExpandedInterviewId] =
    useState<string | null>(null);

  const [actionInterviewId, setActionInterviewId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<InterviewFormState>(emptyForm);

  const loadWorkspace = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const [
        interviewsResult,
        applicationsResult,
        templatesResult,
      ] = await Promise.all([
        supabase
          .from("leo_talent_interviews")
          .select(
            `
              id,
              organisation_id,
              interview_reference,
              application_id,
              vacancy_id,
              candidate_id,
              template_id,
              stage_number,
              stage_name,
              interview_type,
              status,
              scheduled_start,
              scheduled_end,
              timezone_name,
              location,
              meeting_url,
              candidate_instructions,
              internal_instructions,
              invitation_sent_at,
              candidate_confirmed_at,
              completed_at,
              overall_score,
              outcome,
              outcome_reason,
              ai_recommendation,
              ai_recommendation_reason,
              calendar_provider,
              calendar_event_id,
              calendar_sync_status,
              created_at,
              updated_at,
              archived_at,
              candidate:leo_talent_candidates (
                id,
                candidate_reference,
                first_name,
                last_name,
                preferred_name,
                email,
                phone
              ),
              vacancy:leo_talent_vacancies (
                id,
                vacancy_reference,
                title,
                department,
                location_name
              ),
              application:leo_talent_applications (
                id,
                application_reference,
                current_stage_key,
                status
              ),
              template:leo_talent_interview_templates (
                id,
                name,
                description,
                stage_name,
                interview_type,
                instructions,
                total_score_available,
                pass_score,
                is_default,
                is_active,
                archived_at
              ),
              panel_members:leo_talent_interview_panel_members (
                id,
                interview_id,
                user_id,
                employee_id,
                member_name,
                member_email,
                panel_role,
                attendance_status,
                can_score,
                display_order,
                created_at,
                updated_at
              ),
              scorecards:leo_talent_interview_scorecards (
                id,
                interview_id,
                reviewer_name,
                status,
                total_score,
                maximum_score,
                recommendation,
                strengths,
                concerns,
                overall_notes,
                submitted_at
              )
            `,
          )
          .order("scheduled_start", {
            ascending: true,
            nullsFirst: false,
          }),

        supabase
          .from("leo_talent_applications")
          .select(
            `
              id,
              application_reference,
              candidate_id,
              vacancy_id,
              current_stage_key,
              status,
              archived_at,
              candidate:leo_talent_candidates (
                id,
                candidate_reference,
                first_name,
                last_name,
                preferred_name,
                email,
                phone
              ),
              vacancy:leo_talent_vacancies (
                id,
                vacancy_reference,
                title,
                department,
                location_name
              )
            `,
          )
          .is("archived_at", null)
          .order("updated_at", {
            ascending: false,
          }),

        supabase
          .from("leo_talent_interview_templates")
          .select(
            `
              id,
              name,
              description,
              stage_name,
              interview_type,
              instructions,
              total_score_available,
              pass_score,
              is_default,
              is_active,
              archived_at
            `,
          )
          .eq("is_active", true)
          .is("archived_at", null)
          .order("is_default", {
            ascending: false,
          })
          .order("name", {
            ascending: true,
          }),
      ]);

      if (interviewsResult.error) {
        console.error(
          "Unable to load interviews:",
          interviewsResult.error,
        );

        setInterviews([]);
        setError(
          "Leo could not load the interview register. Check that the Talent database foundation has been completed, then try again.",
        );
      } else {
        setInterviews(
          normaliseInterviews(
            interviewsResult.data ?? [],
          ),
        );
      }

      if (applicationsResult.error) {
        console.error(
          "Unable to load interview applications:",
          applicationsResult.error,
        );

        setApplications([]);
      } else {
        setApplications(
          normaliseApplications(
            applicationsResult.data ?? [],
          ),
        );
      }

      if (templatesResult.error) {
        console.error(
          "Unable to load interview templates:",
          templatesResult.error,
        );

        setTemplates([]);
      } else {
        setTemplates(
          (templatesResult.data ??
            []) as InterviewTemplate[],
        );
      }

      setLoading(false);
      setRefreshing(false);
    },
    [],
  );

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const metrics = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    return {
      upcoming: interviews.filter(
        (interview) =>
          !interview.archived_at &&
          liveInterviewStatuses.includes(
            interview.status,
          ) &&
          interview.scheduled_start !== null &&
          new Date(
            interview.scheduled_start,
          ).getTime() >= Date.now(),
      ).length,

      today: interviews.filter(
        (interview) =>
          !interview.archived_at &&
          interview.scheduled_start !== null &&
          isDateWithinRange(
            interview.scheduled_start,
            todayStart,
            todayEnd,
          ),
      ).length,

      awaitingConfirmation: interviews.filter(
        (interview) =>
          !interview.archived_at &&
          ["scheduled", "invited"].includes(
            interview.status,
          ),
      ).length,

      rescheduleRequested: interviews.filter(
        (interview) =>
          !interview.archived_at &&
          interview.status ===
            "reschedule_requested",
      ).length,

      completed: interviews.filter(
        (interview) =>
          !interview.archived_at &&
          interview.status === "completed",
      ).length,

      outcomesPending: interviews.filter(
        (interview) =>
          !interview.archived_at &&
          interview.status === "completed" &&
          !interview.outcome,
      ).length,
    };
  }, [interviews]);

  const filteredInterviews = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    return interviews
      .filter((interview) => {
        const candidateName = getCandidateName(
          interview.candidate,
        ).toLowerCase();

        const panelSearch = interview.panel_members
          .map((member) =>
            [
              member.member_name,
              member.member_email,
              member.panel_role,
            ]
              .filter(Boolean)
              .join(" "),
          )
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          search.length === 0 ||
          interview.interview_reference
            .toLowerCase()
            .includes(search) ||
          candidateName.includes(search) ||
          interview.candidate?.candidate_reference
            .toLowerCase()
            .includes(search) ||
          interview.candidate?.email
            ?.toLowerCase()
            .includes(search) ||
          interview.vacancy?.title
            .toLowerCase()
            .includes(search) ||
          interview.vacancy?.vacancy_reference
            .toLowerCase()
            .includes(search) ||
          interview.application?.application_reference
            .toLowerCase()
            .includes(search) ||
          interview.stage_name
            .toLowerCase()
            .includes(search) ||
          interview.location
            ?.toLowerCase()
            .includes(search) ||
          panelSearch.includes(search);

        let matchesFilter = true;

        switch (activeFilter) {
          case "upcoming":
            matchesFilter =
              !interview.archived_at &&
              liveInterviewStatuses.includes(
                interview.status,
              ) &&
              interview.scheduled_start !== null &&
              new Date(
                interview.scheduled_start,
              ).getTime() >= Date.now();
            break;

          case "today":
            matchesFilter =
              !interview.archived_at &&
              interview.scheduled_start !== null &&
              isDateWithinRange(
                interview.scheduled_start,
                todayStart,
                todayEnd,
              );
            break;

          case "awaiting_confirmation":
            matchesFilter =
              !interview.archived_at &&
              ["scheduled", "invited"].includes(
                interview.status,
              );
            break;

          case "reschedule":
            matchesFilter =
              !interview.archived_at &&
              interview.status ===
                "reschedule_requested";
            break;

          case "completed":
            matchesFilter =
              !interview.archived_at &&
              interview.status === "completed";
            break;

          case "cancelled":
            matchesFilter =
              !interview.archived_at &&
              ["cancelled", "no_show"].includes(
                interview.status,
              );
            break;

          case "archived":
            matchesFilter =
              interview.archived_at !== null;
            break;

          case "all":
            matchesFilter = true;
            break;
        }

        return matchesSearch && matchesFilter;
      })
      .sort(compareInterviews);
  }, [activeFilter, interviews, searchTerm]);

  function updateForm<
    K extends keyof InterviewFormState,
  >(
    key: K,
    value: InterviewFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openCreateForm() {
    const defaultTemplate = templates.find(
      (template) => template.is_default,
    );

    setEditingInterviewId(null);
    setForm({
      ...emptyForm,
      templateId: defaultTemplate?.id ?? "",
      interviewType:
        defaultTemplate?.interview_type ??
        "in_person",
      stageName:
        defaultTemplate?.stage_name ??
        "First Interview",
      candidateInstructions:
        defaultTemplate?.instructions ?? "",
    });
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(interview: TalentInterview) {
    const start = interview.scheduled_start
      ? toLocalDateTimeParts(
          interview.scheduled_start,
        )
      : null;

    const end = interview.scheduled_end
      ? toLocalDateTimeParts(interview.scheduled_end)
      : null;

    setEditingInterviewId(interview.id);

    setForm({
      applicationId: interview.application_id,
      templateId: interview.template_id ?? "",
      stageNumber: String(interview.stage_number),
      stageName: interview.stage_name,
      interviewType: interview.interview_type,
      status: interview.status,
      scheduledDate: start?.date ?? "",
      startTime: start?.time ?? "10:00",
      endTime: end?.time ?? "11:00",
      timezoneName:
        interview.timezone_name ||
        "Europe/London",
      location: interview.location ?? "",
      meetingUrl: interview.meeting_url ?? "",
      candidateInstructions:
        interview.candidate_instructions ?? "",
      internalInstructions:
        interview.internal_instructions ?? "",
      outcome: interview.outcome ?? "",
      outcomeReason:
        interview.outcome_reason ?? "",
      overallScore:
        interview.overall_score !== null
          ? String(interview.overall_score)
          : "",
      panelMembers: interview.panel_members
        .sort(
          (a, b) =>
            a.display_order - b.display_order,
        )
        .map((member) => ({
          localId: member.id,
          existingId: member.id,
          memberName: member.member_name,
          memberEmail: member.member_email ?? "",
          panelRole: member.panel_role,
          attendanceStatus:
            member.attendance_status,
          canScore: member.can_score,
        })),
    });

    setFormError(null);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingInterviewId(null);
    setForm(emptyForm);
    setFormError(null);
  }

  function handleApplicationChange(
    applicationId: string,
  ) {
    const application = applications.find(
      (item) => item.id === applicationId,
    );

    setForm((current) => ({
      ...current,
      applicationId,
      stageName:
        current.stageName.trim() ||
        "First Interview",
      location:
        current.location ||
        application?.vacancy?.location_name ||
        "",
    }));
  }

  function handleTemplateChange(
    templateId: string,
  ) {
    const template = templates.find(
      (item) => item.id === templateId,
    );

    setForm((current) => ({
      ...current,
      templateId,
      interviewType:
        template?.interview_type ??
        current.interviewType,
      stageName:
        template?.stage_name ??
        current.stageName,
      candidateInstructions:
        template?.instructions ??
        current.candidateInstructions,
    }));
  }

  function addPanelMember() {
    setForm((current) => ({
      ...current,
      panelMembers: [
        ...current.panelMembers,
        {
          localId: createLocalId(),
          existingId: null,
          memberName: "",
          memberEmail: "",
          panelRole:
            current.panelMembers.length === 0
              ? "chair"
              : "member",
          attendanceStatus: "invited",
          canScore: true,
        },
      ],
    }));
  }

  function updatePanelMember<
    K extends keyof PanelMemberForm,
  >(
    localId: string,
    key: K,
    value: PanelMemberForm[K],
  ) {
    setForm((current) => ({
      ...current,
      panelMembers: current.panelMembers.map(
        (member) =>
          member.localId === localId
            ? {
                ...member,
                [key]: value,
              }
            : member,
      ),
    }));
  }

  function removePanelMember(localId: string) {
    setForm((current) => ({
      ...current,
      panelMembers: current.panelMembers.filter(
        (member) => member.localId !== localId,
      ),
    }));
  }

  async function saveInterview(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setFormError(null);
    setError(null);

    const application = applications.find(
      (item) => item.id === form.applicationId,
    );

    if (!application) {
      setFormError(
        "Select the application this interview belongs to.",
      );
      return;
    }

    const stageNumber = Number(form.stageNumber);

    if (
      !Number.isInteger(stageNumber) ||
      stageNumber < 1
    ) {
      setFormError(
        "The interview stage number must be a whole number of 1 or more.",
      );
      return;
    }

    if (!form.stageName.trim()) {
      setFormError(
        "Enter a name for this interview stage.",
      );
      return;
    }

    const requiresSchedule =
      form.status !== "draft" &&
      form.status !== "cancelled";

    if (
      requiresSchedule &&
      !form.scheduledDate
    ) {
      setFormError(
        "Select the interview date before using this status.",
      );
      return;
    }

    let scheduledStart: string | null = null;
    let scheduledEnd: string | null = null;

    if (form.scheduledDate) {
      if (!form.startTime || !form.endTime) {
        setFormError(
          "Enter both the interview start and end times.",
        );
        return;
      }

      const startDate = combineLocalDateAndTime(
        form.scheduledDate,
        form.startTime,
      );

      const endDate = combineLocalDateAndTime(
        form.scheduledDate,
        form.endTime,
      );

      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
      ) {
        setFormError(
          "Enter a valid interview date and time.",
        );
        return;
      }

      if (endDate.getTime() <= startDate.getTime()) {
        setFormError(
          "The interview end time must be later than the start time.",
        );
        return;
      }

      scheduledStart = startDate.toISOString();
      scheduledEnd = endDate.toISOString();
    }

    if (
      form.interviewType === "video" &&
      !form.meetingUrl.trim()
    ) {
      setFormError(
        "Add the meeting link for a video interview.",
      );
      return;
    }

    if (
      ["in_person", "panel", "practical"].includes(
        form.interviewType,
      ) &&
      !form.location.trim()
    ) {
      setFormError(
        "Add the interview location.",
      );
      return;
    }

    for (const member of form.panelMembers) {
      if (!member.memberName.trim()) {
        setFormError(
          "Every panel member must have a name.",
        );
        return;
      }

      if (
        member.memberEmail.trim() &&
        !isValidEmail(member.memberEmail.trim())
      ) {
        setFormError(
          `Enter a valid email address for ${member.memberName.trim()}.`,
        );
        return;
      }
    }

    if (
      form.outcome &&
      !form.outcomeReason.trim()
    ) {
      setFormError(
        "Add a brief factual reason for the interview outcome.",
      );
      return;
    }

    if (
      form.overallScore.trim() &&
      !isValidNonNegativeNumber(
        form.overallScore,
      )
    ) {
      setFormError(
        "The overall score must be zero or a positive number.",
      );
      return;
    }

    setSaving(true);

    const now = new Date().toISOString();

    const previousInterview =
      editingInterviewId !== null
        ? interviews.find(
            (interview) =>
              interview.id === editingInterviewId,
          )
        : null;

    const payload = {
      application_id: application.id,
      candidate_id: application.candidate_id,
      vacancy_id: application.vacancy_id,
      template_id:
        normaliseOptionalText(form.templateId),
      stage_number: stageNumber,
      stage_name: form.stageName.trim(),
      interview_type: form.interviewType,
      status: form.status,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      timezone_name:
        form.timezoneName.trim() ||
        "Europe/London",
      location: normaliseOptionalText(
        form.location,
      ),
      meeting_url: normaliseOptionalText(
        form.meetingUrl,
      ),
      candidate_instructions:
        normaliseOptionalText(
          form.candidateInstructions,
        ),
      internal_instructions:
        normaliseOptionalText(
          form.internalInstructions,
        ),
      invitation_sent_at:
        ["invited", "confirmed"].includes(
          form.status,
        )
          ? previousInterview?.invitation_sent_at ??
            now
          : previousInterview?.invitation_sent_at ??
            null,
      candidate_confirmed_at:
        form.status === "confirmed"
          ? previousInterview
              ?.candidate_confirmed_at ?? now
          : form.status === "draft" ||
              form.status === "scheduled" ||
              form.status ===
                "reschedule_requested"
            ? null
            : previousInterview
                ?.candidate_confirmed_at ?? null,
      completed_at:
        form.status === "completed"
          ? previousInterview?.completed_at ?? now
          : null,
      overall_score: form.overallScore.trim()
        ? Number(form.overallScore)
        : null,
      outcome: form.outcome || null,
      outcome_reason: form.outcome
        ? form.outcomeReason.trim()
        : null,
      updated_at: now,
    };

    let interviewId = editingInterviewId;

    if (editingInterviewId) {
      const { error: updateError } = await supabase
        .from("leo_talent_interviews")
        .update(payload as any)
        .eq("id", editingInterviewId);

      if (updateError) {
        console.error(
          "Unable to update interview:",
          updateError,
        );

        setFormError(
          "Leo could not save the interview changes. No panel changes were made.",
        );

        setSaving(false);
        return;
      }
    } else {
      const { data, error: insertError } =
        await supabase
          .from("leo_talent_interviews")
          .insert({
            ...payload,
            created_at: now,
          })
          .select("id")
          .single();

      if (insertError || !data) {
        console.error(
          "Unable to create interview:",
          insertError,
        );

        setFormError(
          "Leo could not create the interview.",
        );

        setSaving(false);
        return;
      }

      interviewId = data.id as string;
    }

    if (!interviewId) {
      setFormError(
        "Leo could not identify the interview record.",
      );
      setSaving(false);
      return;
    }

    const panelSaved =
      await replacePanelMembers(
        interviewId,
        form.panelMembers,
      );

    if (!panelSaved.success) {
      setFormError(panelSaved.message);
      setSaving(false);
      return;
    }

    const nextApplicationStage =
      getApplicationStageForInterview(
        form.status,
        form.outcome,
        stageNumber,
      );

    const nextApplicationStatus =
      getApplicationStatusForOutcome(
        form.outcome,
      );

    const applicationUpdate: Record<
      string,
      unknown
    > = {
      updated_at: now,
    };

    if (nextApplicationStage) {
      applicationUpdate.current_stage_key =
        nextApplicationStage;
    }

    if (nextApplicationStatus) {
      applicationUpdate.status =
        nextApplicationStatus;
    }

    if (
      Object.keys(applicationUpdate).length > 1
    ) {
      const { error: applicationUpdateError } =
        await supabase
          .from("leo_talent_applications")
          .update(applicationUpdate as any)
          .eq("id", application.id);

      if (applicationUpdateError) {
        console.error(
          "Interview saved but application progression could not be updated:",
          applicationUpdateError,
        );
      }
    }

    setSaving(false);
    closeForm();
    await loadWorkspace(true);
  }

  async function replacePanelMembers(
    interviewId: string,
    panelMembers: PanelMemberForm[],
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const { error: deleteError } = await supabase
      .from("leo_talent_interview_panel_members")
      .delete()
      .eq("interview_id", interviewId);

    if (deleteError) {
      console.error(
        "Unable to replace panel members:",
        deleteError,
      );

      return {
        success: false,
        message:
          "The interview was saved, but Leo could not update the interview panel.",
      };
    }

    if (panelMembers.length === 0) {
      return {
        success: true,
        message: "",
      };
    }

    const { error: insertError } = await supabase
      .from("leo_talent_interview_panel_members")
      .insert(
        panelMembers.map((member, index) => ({
          interview_id: interviewId,
          member_name: member.memberName.trim(),
          member_email:
            normaliseOptionalText(
              member.memberEmail,
            ),
          panel_role: member.panelRole,
          attendance_status:
            member.attendanceStatus,
          can_score: member.canScore,
          display_order: index,
        })),
      );

    if (insertError) {
      console.error(
        "Unable to insert panel members:",
        insertError,
      );

      return {
        success: false,
        message:
          "The interview was saved, but Leo could not recreate the interview panel.",
      };
    }

    return {
      success: true,
      message: "",
    };
  }

  async function updateInterviewStatus(
    interview: TalentInterview,
    status: InterviewStatus,
  ) {
    setActionInterviewId(interview.id);
    setError(null);

    const now = new Date().toISOString();

    const payload: Record<string, unknown> = {
      status,
      updated_at: now,
    };

    if (status === "invited") {
      payload.invitation_sent_at =
        interview.invitation_sent_at ?? now;
    }

    if (status === "confirmed") {
      payload.invitation_sent_at =
        interview.invitation_sent_at ?? now;
      payload.candidate_confirmed_at =
        interview.candidate_confirmed_at ?? now;
    }

    if (status === "completed") {
      payload.completed_at =
        interview.completed_at ?? now;
    }

    const { error: updateError } = await supabase
      .from("leo_talent_interviews")
      .update(payload as any)
      .eq("id", interview.id);

    if (updateError) {
      console.error(
        "Unable to update interview status:",
        updateError,
      );

      setError(
        "Leo could not update the interview status.",
      );

      setActionInterviewId(null);
      return;
    }

    await loadWorkspace(true);
    setActionInterviewId(null);
  }

  async function archiveInterview(
    interview: TalentInterview,
  ) {
    const confirmed = window.confirm(
      `Archive ${interview.interview_reference}? The record and its panel evidence will remain available in the Archived view.`,
    );

    if (!confirmed) {
      return;
    }

    setActionInterviewId(interview.id);
    setError(null);

    const { error: archiveError } = await supabase
      .from("leo_talent_interviews")
      .update({
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", interview.id);

    if (archiveError) {
      console.error(
        "Unable to archive interview:",
        archiveError,
      );

      setError(
        "Leo could not archive this interview.",
      );

      setActionInterviewId(null);
      return;
    }

    if (expandedInterviewId === interview.id) {
      setExpandedInterviewId(null);
    }

    await loadWorkspace(true);
    setActionInterviewId(null);
  }

  async function restoreInterview(
    interview: TalentInterview,
  ) {
    setActionInterviewId(interview.id);
    setError(null);

    const { error: restoreError } = await supabase
      .from("leo_talent_interviews")
      .update({
        archived_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", interview.id);

    if (restoreError) {
      console.error(
        "Unable to restore interview:",
        restoreError,
      );

      setError(
        "Leo could not restore this interview.",
      );

      setActionInterviewId(null);
      return;
    }

    await loadWorkspace(true);
    setActionInterviewId(null);
  }

  function exportCurrentView() {
    if (filteredInterviews.length === 0) {
      window.alert(
        "There are no interviews in the current view to export.",
      );
      return;
    }

    const headers = [
      "Interview Reference",
      "Candidate",
      "Candidate Reference",
      "Candidate Email",
      "Vacancy",
      "Vacancy Reference",
      "Application Reference",
      "Stage Number",
      "Stage Name",
      "Interview Type",
      "Status",
      "Date",
      "Start",
      "End",
      "Timezone",
      "Location",
      "Meeting URL",
      "Panel Members",
      "Invitation Sent",
      "Candidate Confirmed",
      "Completed",
      "Overall Score",
      "Outcome",
      "Outcome Reason",
      "Calendar Sync",
      "Created",
      "Last Updated",
      "Archived",
    ];

    const rows = filteredInterviews.map(
      (interview) => [
        interview.interview_reference,
        getCandidateName(interview.candidate),
        interview.candidate?.candidate_reference ??
          "",
        interview.candidate?.email ?? "",
        interview.vacancy?.title ?? "",
        interview.vacancy?.vacancy_reference ??
          "",
        interview.application
          ?.application_reference ?? "",
        String(interview.stage_number),
        interview.stage_name,
        formatValue(interview.interview_type),
        formatValue(interview.status),
        formatDate(interview.scheduled_start),
        formatTime(interview.scheduled_start),
        formatTime(interview.scheduled_end),
        interview.timezone_name,
        interview.location ?? "",
        interview.meeting_url ?? "",
        interview.panel_members
          .map(
            (member) =>
              `${member.member_name} (${formatValue(
                member.panel_role,
              )})`,
          )
          .join("; "),
        interview.invitation_sent_at ?? "",
        interview.candidate_confirmed_at ?? "",
        interview.completed_at ?? "",
        interview.overall_score !== null
          ? String(interview.overall_score)
          : "",
        interview.outcome
          ? formatValue(interview.outcome)
          : "",
        interview.outcome_reason ?? "",
        formatValue(
          interview.calendar_sync_status,
        ),
        interview.created_at,
        interview.updated_at,
        interview.archived_at ? "Yes" : "No",
      ],
    );

    const csv = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) =>
        row.map(escapeCsvValue).join(","),
      ),
    ].join("\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `leo-talent-interviews-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div>
        <WorkspaceHeading />

        <div style={loadingPanelStyle}>
          <div style={spinnerStyle} />

          <strong style={loadingTitleStyle}>
            Loading interviews
          </strong>

          <p style={loadingTextStyle}>
            Leo is preparing the interview register.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={workspaceHeaderStyle}>
        <div>
          <h2 style={workspaceTitleStyle}>
            Interviews
          </h2>

          <p style={workspaceDescriptionStyle}>
            Schedule structured interviews, manage panel
            participation, record outcomes and preserve a
            clear recruitment evidence trail.
          </p>
        </div>

        <div style={headerActionsStyle}>
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={() => void loadWorkspace(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>

          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={exportCurrentView}
          >
            Export current view
          </button>

          <button
            type="button"
            style={primaryButtonStyle}
            onClick={openCreateForm}
          >
            Schedule Interview
          </button>
        </div>
      </div>

      {error ? (
        <div style={errorPanelStyle}>
          <div>
            <strong style={errorTitleStyle}>
              Interviews could not be updated
            </strong>

            <p style={errorTextStyle}>{error}</p>
          </div>

          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={() => void loadWorkspace(true)}
          >
            Try again
          </button>
        </div>
      ) : null}

      {showForm ? (
        <InterviewForm
          form={form}
          applications={applications}
          templates={templates}
          editing={editingInterviewId !== null}
          saving={saving}
          error={formError}
          onUpdate={updateForm}
          onApplicationChange={
            handleApplicationChange
          }
          onTemplateChange={handleTemplateChange}
          onAddPanelMember={addPanelMember}
          onUpdatePanelMember={updatePanelMember}
          onRemovePanelMember={removePanelMember}
          onSubmit={saveInterview}
          onCancel={closeForm}
        />
      ) : null}

      <div style={kpiGridStyle}>
        <KpiCard
          label="Upcoming"
          value={String(metrics.upcoming)}
        />

        <KpiCard
          label="Today"
          value={String(metrics.today)}
        />

        <KpiCard
          label="Awaiting Confirmation"
          value={String(
            metrics.awaitingConfirmation,
          )}
        />

        <KpiCard
          label="Reschedule Requested"
          value={String(
            metrics.rescheduleRequested,
          )}
        />

        <KpiCard
          label="Completed"
          value={String(metrics.completed)}
        />

        <KpiCard
          label="Outcomes Pending"
          value={String(metrics.outcomesPending)}
        />
      </div>

      <div style={registerPanelStyle}>
        <div style={registerHeadingStyle}>
          <div>
            <h3 style={panelTitleStyle}>
              Interview Register
            </h3>

            <p style={panelDescriptionStyle}>
              Review scheduled, completed and archived
              interviews across every live vacancy.
            </p>
          </div>

          <span style={resultCountStyle}>
            {filteredInterviews.length}{" "}
            {filteredInterviews.length === 1
              ? "interview"
              : "interviews"}
          </span>
        </div>

        <div style={filterAreaStyle}>
          <label style={fieldStyle}>
            <span style={fieldLabelStyle}>
              Search interviews
            </span>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search candidate, vacancy, panel member or reference"
              style={inputStyle}
            />
          </label>

          <div style={filterButtonRowStyle}>
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setActiveFilter(option.value)
                }
                style={
                  activeFilter === option.value
                    ? activeFilterButtonStyle
                    : filterButtonStyle
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {filteredInterviews.length === 0 ? (
          <div style={emptyPanelStyle}>
            <div style={emptyIconStyle}>✦</div>

            <strong style={emptyTitleStyle}>
              {interviews.length === 0
                ? "No interviews have been created"
                : "No interviews match this view"}
            </strong>

            <p style={emptyTextStyle}>
              {interviews.length === 0
                ? "Scheduled interviews will appear here with their candidate, panel and outcome information."
                : "Try changing the search term or selecting another interview view."}
            </p>

            {interviews.length === 0 ? (
              <button
                type="button"
                style={emptyPrimaryButtonStyle}
                onClick={openCreateForm}
              >
                Schedule first interview
              </button>
            ) : null}
          </div>
        ) : (
          <div style={interviewListStyle}>
            {filteredInterviews.map(
              (interview) => (
                <InterviewCard
                  key={interview.id}
                  interview={interview}
                  expanded={
                    expandedInterviewId ===
                    interview.id
                  }
                  actioning={
                    actionInterviewId ===
                    interview.id
                  }
                  onToggleExpanded={() =>
                    setExpandedInterviewId(
                      expandedInterviewId ===
                        interview.id
                        ? null
                        : interview.id,
                    )
                  }
                  onEdit={() =>
                    openEditForm(interview)
                  }
                  onStatusChange={(status) =>
                    void updateInterviewStatus(
                      interview,
                      status,
                    )
                  }
                  onArchive={() =>
                    void archiveInterview(interview)
                  }
                  onRestore={() =>
                    void restoreInterview(interview)
                  }
                />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InterviewForm({
  form,
  applications,
  templates,
  editing,
  saving,
  error,
  onUpdate,
  onApplicationChange,
  onTemplateChange,
  onAddPanelMember,
  onUpdatePanelMember,
  onRemovePanelMember,
  onSubmit,
  onCancel,
}: {
  form: InterviewFormState;
  applications: ApplicationOption[];
  templates: InterviewTemplate[];
  editing: boolean;
  saving: boolean;
  error: string | null;
  onUpdate: <
    K extends keyof InterviewFormState,
  >(
    key: K,
    value: InterviewFormState[K],
  ) => void;
  onApplicationChange: (
    applicationId: string,
  ) => void;
  onTemplateChange: (
    templateId: string,
  ) => void;
  onAddPanelMember: () => void;
  onUpdatePanelMember: <
    K extends keyof PanelMemberForm,
  >(
    localId: string,
    key: K,
    value: PanelMemberForm[K],
  ) => void;
  onRemovePanelMember: (
    localId: string,
  ) => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
  onCancel: () => void;
}) {
  const selectedApplication = applications.find(
    (application) =>
      application.id === form.applicationId,
  );

  return (
    <form
      onSubmit={onSubmit}
      style={formPanelStyle}
    >
      <div style={formHeadingStyle}>
        <div>
          <h3 style={formTitleStyle}>
            {editing
              ? "Edit Interview"
              : "Schedule Interview"}
          </h3>

          <p style={formDescriptionStyle}>
            Record the interview arrangement, panel,
            candidate instructions and final outcome.
          </p>
        </div>

        <button
          type="button"
          style={closeButtonStyle}
          onClick={onCancel}
          disabled={saving}
          aria-label="Close interview form"
        >
          ×
        </button>
      </div>

      {error ? (
        <div style={formErrorStyle}>{error}</div>
      ) : null}

      <FormSection
        title="Interview Record"
        description="Link the interview to the correct application and recruitment stage."
      >
        <div style={twoColumnGridStyle}>
          <SelectField
            label="Application"
            value={form.applicationId}
            onChange={onApplicationChange}
            options={[
              {
                value: "",
                label: "Select an application",
              },
              ...applications.map(
                (application) => ({
                  value: application.id,
                  label: `${getCandidateName(
                    application.candidate,
                  )} — ${
                    application.vacancy?.title ??
                    "Vacancy unavailable"
                  } — ${
                    application.application_reference
                  }`,
                }),
              ),
            ]}
            required
            disabled={saving || editing}
          />

          <SelectField
            label="Interview template"
            value={form.templateId}
            onChange={onTemplateChange}
            options={[
              {
                value: "",
                label: "No template selected",
              },
              ...templates.map((template) => ({
                value: template.id,
                label: template.name,
              })),
            ]}
            disabled={saving}
          />

          <TextField
            label="Stage number"
            type="number"
            min="1"
            value={form.stageNumber}
            onChange={(value) =>
              onUpdate("stageNumber", value)
            }
            required
            disabled={saving}
          />

          <TextField
            label="Stage name"
            value={form.stageName}
            onChange={(value) =>
              onUpdate("stageName", value)
            }
            placeholder="For example: First Interview"
            required
            disabled={saving}
          />

          <SelectField
            label="Interview type"
            value={form.interviewType}
            onChange={(value) =>
              onUpdate(
                "interviewType",
                value as InterviewType,
              )
            }
            options={interviewTypeOptions}
            disabled={saving}
          />

          <SelectField
            label="Status"
            value={form.status}
            onChange={(value) =>
              onUpdate(
                "status",
                value as InterviewStatus,
              )
            }
            options={interviewStatusOptions}
            disabled={saving}
          />
        </div>

        {selectedApplication ? (
          <div style={selectedRecordStyle}>
            <strong style={selectedRecordTitleStyle}>
              {getCandidateName(
                selectedApplication.candidate,
              )}
            </strong>

            <span style={selectedRecordTextStyle}>
              {selectedApplication.vacancy?.title ??
                "Vacancy unavailable"}
              {" · "}
              {
                selectedApplication.application_reference
              }
              {" · "}
              {formatValue(
                selectedApplication.current_stage_key,
              )}
            </span>
          </div>
        ) : null}
      </FormSection>

      <FormSection
        title="Schedule and Location"
        description="Set the interview date, time and joining information."
      >
        <div style={threeColumnGridStyle}>
          <TextField
            label="Interview date"
            type="date"
            value={form.scheduledDate}
            onChange={(value) =>
              onUpdate("scheduledDate", value)
            }
            disabled={saving}
          />

          <TextField
            label="Start time"
            type="time"
            value={form.startTime}
            onChange={(value) =>
              onUpdate("startTime", value)
            }
            disabled={saving}
          />

          <TextField
            label="End time"
            type="time"
            value={form.endTime}
            onChange={(value) =>
              onUpdate("endTime", value)
            }
            disabled={saving}
          />

          <TextField
            label="Timezone"
            value={form.timezoneName}
            onChange={(value) =>
              onUpdate("timezoneName", value)
            }
            disabled={saving}
          />

          <TextField
            label="Location"
            value={form.location}
            onChange={(value) =>
              onUpdate("location", value)
            }
            placeholder="Office, site or room"
            disabled={saving}
          />

          <TextField
            label="Meeting link"
            type="url"
            value={form.meetingUrl}
            onChange={(value) =>
              onUpdate("meetingUrl", value)
            }
            placeholder="Video interview URL"
            disabled={saving}
          />
        </div>
      </FormSection>

      <FormSection
        title="Interview Panel"
        description="Add interviewers, assign panel roles and control scoring access."
      >
        <div style={panelFormListStyle}>
          {form.panelMembers.map(
            (member, index) => (
              <div
                key={member.localId}
                style={panelMemberFormStyle}
              >
                <div style={panelMemberHeadingStyle}>
                  <strong
                    style={panelMemberNumberStyle}
                  >
                    Panel member {index + 1}
                  </strong>

                  <button
                    type="button"
                    style={removeButtonStyle}
                    onClick={() =>
                      onRemovePanelMember(
                        member.localId,
                      )
                    }
                    disabled={saving}
                  >
                    Remove
                  </button>
                </div>

                <div style={twoColumnGridStyle}>
                  <TextField
                    label="Name"
                    value={member.memberName}
                    onChange={(value) =>
                      onUpdatePanelMember(
                        member.localId,
                        "memberName",
                        value,
                      )
                    }
                    required
                    disabled={saving}
                  />

                  <TextField
                    label="Email"
                    type="email"
                    value={member.memberEmail}
                    onChange={(value) =>
                      onUpdatePanelMember(
                        member.localId,
                        "memberEmail",
                        value,
                      )
                    }
                    disabled={saving}
                  />

                  <SelectField
                    label="Panel role"
                    value={member.panelRole}
                    onChange={(value) =>
                      onUpdatePanelMember(
                        member.localId,
                        "panelRole",
                        value as PanelRole,
                      )
                    }
                    options={panelRoleOptions}
                    disabled={saving}
                  />

                  <SelectField
                    label="Attendance"
                    value={
                      member.attendanceStatus
                    }
                    onChange={(value) =>
                      onUpdatePanelMember(
                        member.localId,
                        "attendanceStatus",
                        value as AttendanceStatus,
                      )
                    }
                    options={attendanceOptions}
                    disabled={saving}
                  />
                </div>

                <CheckboxField
                  label="Can submit scores"
                  description="This panel member may complete an interview scorecard."
                  checked={member.canScore}
                  onChange={(checked) =>
                    onUpdatePanelMember(
                      member.localId,
                      "canScore",
                      checked,
                    )
                  }
                  disabled={saving}
                />
              </div>
            ),
          )}

          {form.panelMembers.length === 0 ? (
            <div style={emptyPanelMemberStyle}>
              No panel members have been added.
            </div>
          ) : null}

          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={onAddPanelMember}
            disabled={saving}
          >
            Add panel member
          </button>
        </div>
      </FormSection>

      <FormSection
        title="Instructions"
        description="Keep candidate-facing information separate from internal panel guidance."
      >
        <TextAreaField
          label="Candidate instructions"
          value={form.candidateInstructions}
          onChange={(value) =>
            onUpdate(
              "candidateInstructions",
              value,
            )
          }
          placeholder="Arrival information, preparation requirements, documents to bring or joining instructions"
          rows={4}
          disabled={saving}
        />

        <TextAreaField
          label="Internal instructions"
          value={form.internalInstructions}
          onChange={(value) =>
            onUpdate(
              "internalInstructions",
              value,
            )
          }
          placeholder="Internal preparation notes, panel responsibilities or process reminders"
          rows={4}
          disabled={saving}
        />
      </FormSection>

      <FormSection
        title="Outcome"
        description="Complete this section when the interview has concluded."
      >
        <div style={twoColumnGridStyle}>
          <SelectField
            label="Outcome"
            value={form.outcome}
            onChange={(value) =>
              onUpdate(
                "outcome",
                value as
                  | ""
                  | InterviewOutcome,
              )
            }
            options={outcomeOptions}
            disabled={saving}
          />

          <TextField
            label="Overall score"
            type="number"
            min="0"
            step="0.01"
            value={form.overallScore}
            onChange={(value) =>
              onUpdate("overallScore", value)
            }
            disabled={saving}
          />
        </div>

        <TextAreaField
          label="Outcome reason"
          value={form.outcomeReason}
          onChange={(value) =>
            onUpdate("outcomeReason", value)
          }
          placeholder="Brief factual rationale supported by the interview evidence"
          rows={4}
          required={Boolean(form.outcome)}
          disabled={saving}
        />
      </FormSection>

      <div style={formActionsStyle}>
        <button
          type="button"
          style={secondaryButtonStyle}
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="submit"
          style={primaryButtonStyle}
          disabled={saving}
        >
          {saving
            ? "Saving…"
            : editing
              ? "Save interview"
              : "Create interview"}
        </button>
      </div>
    </form>
  );
}

function InterviewCard({
  interview,
  expanded,
  actioning,
  onToggleExpanded,
  onEdit,
  onStatusChange,
  onArchive,
  onRestore,
}: {
  interview: TalentInterview;
  expanded: boolean;
  actioning: boolean;
  onToggleExpanded: () => void;
  onEdit: () => void;
  onStatusChange: (
    status: InterviewStatus,
  ) => void;
  onArchive: () => void;
  onRestore: () => void;
}) {
  const archived = interview.archived_at !== null;

  return (
    <article style={interviewCardStyle}>
      <div style={interviewHeadingStyle}>
        <div>
          <div style={candidateIdentityStyle}>
            <div style={candidateAvatarStyle}>
              {getCandidateInitials(
                interview.candidate,
              )}
            </div>

            <div>
              <h4 style={candidateNameStyle}>
                {getCandidateName(
                  interview.candidate,
                )}
              </h4>

              <p style={referenceStyle}>
                {interview.interview_reference}
                {" · "}
                {interview.application
                  ?.application_reference ??
                  "Application unavailable"}
              </p>
            </div>
          </div>
        </div>

        <div style={badgeRowStyle}>
          <span
            style={getStatusBadgeStyle(
              interview.status,
            )}
          >
            {formatValue(interview.status)}
          </span>

          <span style={typeBadgeStyle}>
            {formatValue(
              interview.interview_type,
            )}
          </span>

          {interview.outcome ? (
            <span style={outcomeBadgeStyle}>
              {formatValue(interview.outcome)}
            </span>
          ) : null}

          {archived ? (
            <span style={archivedBadgeStyle}>
              Archived
            </span>
          ) : null}
        </div>
      </div>

      <div style={interviewDetailsGridStyle}>
        <InterviewDetail
          label="Vacancy"
          value={
            interview.vacancy?.title ??
            "Vacancy unavailable"
          }
          help={[
            interview.vacancy?.vacancy_reference,
            interview.vacancy?.department,
          ]
            .filter(Boolean)
            .join(" · ")}
        />

        <InterviewDetail
          label="Stage"
          value={interview.stage_name}
          help={`Stage ${interview.stage_number}`}
        />

        <InterviewDetail
          label="Date"
          value={formatDate(
            interview.scheduled_start,
          )}
          help={formatTimeRange(
            interview.scheduled_start,
            interview.scheduled_end,
          )}
        />

        <InterviewDetail
          label="Location"
          value={
            interview.location ??
            (interview.meeting_url
              ? "Online"
              : "Not recorded")
          }
          help={
            interview.meeting_url ??
            interview.timezone_name
          }
        />

        <InterviewDetail
          label="Panel"
          value={String(
            interview.panel_members.length,
          )}
          help={
            interview.panel_members.length === 1
              ? "panel member"
              : "panel members"
          }
        />

        <InterviewDetail
          label="Score"
          value={
            interview.overall_score !== null
              ? String(interview.overall_score)
              : "Not recorded"
          }
          help={`${interview.scorecards.length} scorecard${
            interview.scorecards.length === 1
              ? ""
              : "s"
          }`}
        />
      </div>

      {interview.outcome_reason ? (
        <div style={outcomePanelStyle}>
          <span style={outcomeLabelStyle}>
            Outcome rationale
          </span>

          <p style={outcomeReasonStyle}>
            {interview.outcome_reason}
          </p>
        </div>
      ) : null}

      {expanded ? (
        <div style={expandedAreaStyle}>
          <div style={expandedGridStyle}>
            <InformationPanel
              interview={interview}
            />

            <PanelMembersPanel
              members={interview.panel_members}
            />

            <ScorecardsPanel
              scorecards={interview.scorecards}
            />
          </div>
        </div>
      ) : null}

      <div style={cardActionsStyle}>
        <button
          type="button"
          style={secondaryButtonStyle}
          onClick={onToggleExpanded}
        >
          {expanded
            ? "Hide details"
            : "View details"}
        </button>

        {!archived ? (
          <>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={onEdit}
              disabled={actioning}
            >
              Edit interview
            </button>

            {interview.status === "scheduled" ? (
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() =>
                  onStatusChange("invited")
                }
                disabled={actioning}
              >
                Mark invitation sent
              </button>
            ) : null}

            {["scheduled", "invited"].includes(
              interview.status,
            ) ? (
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() =>
                  onStatusChange("confirmed")
                }
                disabled={actioning}
              >
                Mark confirmed
              </button>
            ) : null}

            {[
              "scheduled",
              "invited",
              "confirmed",
            ].includes(interview.status) ? (
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() =>
                  onStatusChange("completed")
                }
                disabled={actioning}
              >
                Mark completed
              </button>
            ) : null}

            <button
              type="button"
              style={archiveButtonStyle}
              onClick={onArchive}
              disabled={actioning}
            >
              {actioning
                ? "Updating…"
                : "Archive"}
            </button>
          </>
        ) : (
          <button
            type="button"
            style={primaryButtonStyle}
            onClick={onRestore}
            disabled={actioning}
          >
            {actioning
              ? "Restoring…"
              : "Restore interview"}
          </button>
        )}
      </div>
    </article>
  );
}

function InformationPanel({
  interview,
}: {
  interview: TalentInterview;
}) {
  return (
    <div style={informationPanelStyle}>
      <h5 style={expandedPanelTitleStyle}>
        Interview Information
      </h5>

      <div style={informationListStyle}>
        <InformationRow
          label="Candidate email"
          value={
            interview.candidate?.email ??
            "Not recorded"
          }
        />

        <InformationRow
          label="Candidate phone"
          value={
            interview.candidate?.phone ??
            "Not recorded"
          }
        />

        <InformationRow
          label="Invitation sent"
          value={formatDateTime(
            interview.invitation_sent_at,
          )}
        />

        <InformationRow
          label="Candidate confirmed"
          value={formatDateTime(
            interview.candidate_confirmed_at,
          )}
        />

        <InformationRow
          label="Completed"
          value={formatDateTime(
            interview.completed_at,
          )}
        />

        <InformationRow
          label="Calendar status"
          value={formatValue(
            interview.calendar_sync_status,
          )}
        />

        <InformationRow
          label="Candidate instructions"
          value={
            interview.candidate_instructions ??
            "Not recorded"
          }
        />

        <InformationRow
          label="Internal instructions"
          value={
            interview.internal_instructions ??
            "Not recorded"
          }
        />

        {interview.ai_recommendation ? (
          <InformationRow
            label="Leo recommendation"
            value={[
              formatValue(
                interview.ai_recommendation,
              ),
              interview.ai_recommendation_reason,
            ]
              .filter(Boolean)
              .join(" — ")}
          />
        ) : null}
      </div>
    </div>
  );
}

function PanelMembersPanel({
  members,
}: {
  members: PanelMember[];
}) {
  const sortedMembers = [...members].sort(
    (a, b) =>
      a.display_order - b.display_order,
  );

  return (
    <div style={informationPanelStyle}>
      <h5 style={expandedPanelTitleStyle}>
        Interview Panel
      </h5>

      {sortedMembers.length === 0 ? (
        <p style={emptyInformationTextStyle}>
          No panel members are recorded.
        </p>
      ) : (
        <div style={panelDisplayListStyle}>
          {sortedMembers.map((member) => (
            <div
              key={member.id}
              style={panelDisplayItemStyle}
            >
              <div>
                <strong
                  style={panelDisplayNameStyle}
                >
                  {member.member_name}
                </strong>

                <span
                  style={panelDisplayEmailStyle}
                >
                  {member.member_email ??
                    "No email recorded"}
                </span>
              </div>

              <div style={badgeRowStyle}>
                <span style={neutralBadgeStyle}>
                  {formatValue(
                    member.panel_role,
                  )}
                </span>

                <span
                  style={getAttendanceBadgeStyle(
                    member.attendance_status,
                  )}
                >
                  {formatValue(
                    member.attendance_status,
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScorecardsPanel({
  scorecards,
}: {
  scorecards: InterviewScorecard[];
}) {
  return (
    <div style={informationPanelStyle}>
      <h5 style={expandedPanelTitleStyle}>
        Scorecards
      </h5>

      {scorecards.length === 0 ? (
        <p style={emptyInformationTextStyle}>
          No scorecards have been submitted.
        </p>
      ) : (
        <div style={panelDisplayListStyle}>
          {scorecards.map((scorecard) => (
            <div
              key={scorecard.id}
              style={scorecardItemStyle}
            >
              <div style={scorecardHeadingStyle}>
                <strong
                  style={panelDisplayNameStyle}
                >
                  {scorecard.reviewer_name ??
                    "Reviewer not recorded"}
                </strong>

                <span style={neutralBadgeStyle}>
                  {formatValue(scorecard.status)}
                </span>
              </div>

              <div style={scorecardMetricsStyle}>
                <span>
                  Score:{" "}
                  <strong>
                    {formatScore(
                      scorecard.total_score,
                    )}
                    {scorecard.maximum_score !== null
                      ? ` / ${formatScore(
                          scorecard.maximum_score,
                        )}`
                      : ""}
                  </strong>
                </span>

                <span>
                  Recommendation:{" "}
                  <strong>
                    {scorecard.recommendation
                      ? formatValue(
                          scorecard.recommendation,
                        )
                      : "Not recorded"}
                  </strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section style={formSectionStyle}>
      <div style={sectionHeadingStyle}>
        <h4 style={sectionTitleStyle}>{title}</h4>

        <p style={sectionDescriptionStyle}>
          {description}
        </p>
      </div>

      <div style={sectionContentStyle}>
        {children}
      </div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  disabled = false,
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>
        {label}
        {required ? (
          <span style={requiredStyle}> *</span>
        ) : null}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        step={step}
        style={inputStyle}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>
        {label}
        {required ? (
          <span style={requiredStyle}> *</span>
        ) : null}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        required={required}
        disabled={disabled}
        style={inputStyle}
      >
        {options.map((option) => (
          <option
            key={`${label}-${option.value}`}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows,
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows: number;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>
        {label}
        {required ? (
          <span style={requiredStyle}> *</span>
        ) : null}
      </span>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        style={textAreaStyle}
      />
    </label>
  );
}

function CheckboxField({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label style={checkboxFieldStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        disabled={disabled}
        style={checkboxInputStyle}
      />

      <span>
        <strong style={checkboxLabelStyle}>
          {label}
        </strong>

        <span style={checkboxDescriptionStyle}>
          {description}
        </span>
      </span>
    </label>
  );
}

function WorkspaceHeading() {
  return (
    <div style={workspaceHeaderStyle}>
      <div>
        <h2 style={workspaceTitleStyle}>
          Interviews
        </h2>

        <p style={workspaceDescriptionStyle}>
          Schedule structured interviews, manage panel
          participation, record outcomes and preserve a
          clear recruitment evidence trail.
        </p>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={kpiCardStyle}>
      <div style={kpiValueStyle}>{value}</div>
      <div style={kpiLabelStyle}>{label}</div>
    </div>
  );
}

function InterviewDetail({
  label,
  value,
  help,
}: {
  label: string;
  value: string;
  help?: string;
}) {
  return (
    <div>
      <span style={detailLabelStyle}>{label}</span>

      <strong style={detailValueStyle}>
        {value}
      </strong>

      {help ? (
        <span style={detailHelpStyle}>{help}</span>
      ) : null}
    </div>
  );
}

function InformationRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={informationRowStyle}>
      <span style={informationLabelStyle}>
        {label}
      </span>

      <span style={informationValueStyle}>
        {value}
      </span>
    </div>
  );
}

function normaliseInterviews(
  rows: unknown[],
): TalentInterview[] {
  return rows.map((row) => {
    const item = row as Record<string, unknown>;

    return {
      ...item,
      candidate:
        normaliseRelatedRecord<CandidateSummary>(
          item.candidate,
        ),
      vacancy:
        normaliseRelatedRecord<VacancySummary>(
          item.vacancy,
        ),
      application: normaliseRelatedRecord<
        TalentInterview["application"]
      >(item.application),
      template: normaliseRelatedRecord<
        InterviewTemplate
      >(item.template),
      panel_members: Array.isArray(
        item.panel_members,
      )
        ? (item.panel_members as PanelMember[])
        : [],
      scorecards: Array.isArray(item.scorecards)
        ? (item.scorecards as InterviewScorecard[])
        : [],
    } as TalentInterview;
  });
}

function normaliseApplications(
  rows: unknown[],
): ApplicationOption[] {
  return rows.map((row) => {
    const item = row as Record<string, unknown>;

    return {
      ...item,
      candidate:
        normaliseRelatedRecord<CandidateSummary>(
          item.candidate,
        ),
      vacancy:
        normaliseRelatedRecord<VacancySummary>(
          item.vacancy,
        ),
    } as ApplicationOption;
  });
}

function normaliseRelatedRecord<T>(
  value: unknown,
): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }

  if (value && typeof value === "object") {
    return value as T;
  }

  return null;
}

function getCandidateName(
  candidate: CandidateSummary | null,
) {
  if (!candidate) {
    return "Candidate unavailable";
  }

  const first =
    candidate.preferred_name?.trim() ||
    candidate.first_name.trim();

  return `${first} ${candidate.last_name}`.trim();
}

function getCandidateInitials(
  candidate: CandidateSummary | null,
) {
  if (!candidate) {
    return "—";
  }

  const first =
    candidate.preferred_name?.trim() ||
    candidate.first_name.trim();

  return `${first.charAt(0)}${candidate.last_name.charAt(
    0,
  )}`.toUpperCase();
}

function compareInterviews(
  a: TalentInterview,
  b: TalentInterview,
) {
  if (a.archived_at && !b.archived_at) {
    return 1;
  }

  if (!a.archived_at && b.archived_at) {
    return -1;
  }

  if (!a.scheduled_start && !b.scheduled_start) {
    return (
      new Date(b.updated_at).getTime() -
      new Date(a.updated_at).getTime()
    );
  }

  if (!a.scheduled_start) {
    return 1;
  }

  if (!b.scheduled_start) {
    return -1;
  }

  return (
    new Date(a.scheduled_start).getTime() -
    new Date(b.scheduled_start).getTime()
  );
}

function getApplicationStageForInterview(
  status: InterviewStatus,
  outcome: "" | InterviewOutcome,
  stageNumber: number,
) {
  if (outcome === "offer") {
    return "offer";
  }

  if (outcome === "unsuccessful") {
    return "unsuccessful";
  }

  if (outcome === "withdrawn") {
    return "withdrawn";
  }

  if (
    outcome === "additional_stage" ||
    outcome === "proceed"
  ) {
    return `interview_${stageNumber + 1}`;
  }

  if (
    [
      "scheduled",
      "invited",
      "confirmed",
      "reschedule_requested",
      "completed",
    ].includes(status)
  ) {
    return `interview_${stageNumber}`;
  }

  return null;
}

function getApplicationStatusForOutcome(
  outcome: "" | InterviewOutcome,
) {
  switch (outcome) {
    case "offer":
      return "offered";

    case "unsuccessful":
      return "unsuccessful";

    case "withdrawn":
      return "withdrawn";

    case "proceed":
    case "additional_stage":
    case "hold":
      return "active";

    default:
      return null;
  }
}

function createLocalId() {
  return `panel-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function combineLocalDateAndTime(
  date: string,
  time: string,
) {
  return new Date(`${date}T${time}:00`);
}

function toLocalDateTimeParts(value: string) {
  const date = new Date(value);

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(date.getDate()).padStart(
    2,
    "0",
  );
  const hours = String(date.getHours()).padStart(
    2,
    "0",
  );
  const minutes = String(
    date.getMinutes(),
  ).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function isDateWithinRange(
  value: string,
  start: Date,
  end: Date,
) {
  const time = new Date(value).getTime();

  return (
    time >= start.getTime() &&
    time <= end.getTime()
  );
}

function normaliseOptionalText(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

function isValidNonNegativeNumber(
  value: string,
) {
  const number = Number(value);

  return (
    Number.isFinite(number) &&
    number >= 0
  );
}

function formatValue(value: string) {
  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTimeRange(
  start: string | null,
  end: string | null,
) {
  if (!start) {
    return "Time not recorded";
  }

  const startTime = formatTime(start);
  const endTime = formatTime(end);

  return endTime
    ? `${startTime}–${endTime}`
    : startTime;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatScore(value: number | null) {
  if (value === null) {
    return "—";
  }

  return Number(value).toLocaleString("en-GB", {
    maximumFractionDigits: 2,
  });
}

function escapeCsvValue(value: string) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function getStatusBadgeStyle(
  status: InterviewStatus,
): CSSProperties {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "4px 8px",
    border: "1px solid",
    fontSize: "11px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  };

  switch (status) {
    case "confirmed":
    case "completed":
      return {
        ...base,
        background: "#F5FFF9",
        borderColor: "#CFE5D7",
        color: "#41644D",
      };

    case "scheduled":
    case "invited":
      return {
        ...base,
        background: "#F7F1FC",
        borderColor: "#CDB2E2",
        color: "#6E5084",
      };

    case "reschedule_requested":
      return {
        ...base,
        background: "#FFF9EE",
        borderColor: "#E8D9B7",
        color: "#755E2C",
      };

    default:
      return {
        ...base,
        background: "#F3F4F6",
        borderColor: "#D1D5DB",
        color: "#5B6470",
      };
  }
}

function getAttendanceBadgeStyle(
  status: AttendanceStatus,
): CSSProperties {
  if (
    ["accepted", "attended"].includes(status)
  ) {
    return consentBadgeStyle;
  }

  if (
    ["declined", "absent"].includes(status)
  ) {
    return archivedBadgeStyle;
  }

  if (status === "tentative") {
    return warningBadgeStyle;
  }

  return neutralBadgeStyle;
}

const workspaceHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "20px",
};

const workspaceTitleStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
};

const workspaceDescriptionStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.6,
};

const headerActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: "8px",
};

const primaryButtonStyle: CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const secondaryButtonStyle: CSSProperties = {
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const archiveButtonStyle: CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const removeButtonStyle: CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "8px",
  padding: "6px 9px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const kpiGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "12px",
  marginBottom: "18px",
};

const kpiCardStyle: CSSProperties = {
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "14px",
  padding: "16px",
};

const kpiValueStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "26px",
  fontWeight: 800,
};

const kpiLabelStyle: CSSProperties = {
  marginTop: "6px",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.4,
};

const registerPanelStyle: CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  padding: "18px",
  background: "#FFFFFF",
};

const registerHeadingStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "16px",
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "16px",
};

const panelDescriptionStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.5,
};

const resultCountStyle: CSSProperties = {
  color: "#6E5084",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "999px",
  padding: "5px 9px",
  fontSize: "12px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const filterAreaStyle: CSSProperties = {
  padding: "14px",
  marginBottom: "16px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
};

const filterButtonRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "12px",
};

const filterButtonStyle: CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
  padding: "7px 10px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
};

const activeFilterButtonStyle: CSSProperties = {
  ...filterButtonStyle,
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
};

const fieldStyle: CSSProperties = {
  display: "block",
  width: "100%",
};

const fieldLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "12px",
  fontWeight: 700,
};

const requiredStyle: CSSProperties = {
  color: "#6E5084",
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  padding: "10px 12px",
  background: "#FFFFFF",
  color: "#111827",
  fontSize: "14px",
  outline: "none",
};

const textAreaStyle: CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  fontFamily: "inherit",
  lineHeight: 1.5,
};

const formPanelStyle: CSSProperties = {
  marginBottom: "18px",
  padding: "20px",
  background: "#FFFFFF",
  border: "1px solid #CDB2E2",
  borderRadius: "14px",
};

const formHeadingStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "18px",
};

const formTitleStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "18px",
};

const formDescriptionStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.5,
};

const closeButtonStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  flexShrink: 0,
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
  background: "#FFFFFF",
  color: "#6B7280",
  fontSize: "20px",
  cursor: "pointer",
};

const formErrorStyle: CSSProperties = {
  marginBottom: "16px",
  padding: "11px 12px",
  background: "#FFF9EE",
  border: "1px solid #E8D9B7",
  borderRadius: "10px",
  color: "#755E2C",
  fontSize: "12px",
  lineHeight: 1.5,
};

const formSectionStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "210px minmax(0, 1fr)",
  gap: "18px",
  padding: "18px 0",
  borderTop: "1px solid #EEF0F2",
};

const sectionHeadingStyle: CSSProperties = {
  paddingRight: "10px",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "14px",
};

const sectionDescriptionStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "11px",
  lineHeight: 1.5,
};

const sectionContentStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
};

const twoColumnGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "12px",
};

const threeColumnGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
};

const selectedRecordStyle: CSSProperties = {
  padding: "12px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "10px",
};

const selectedRecordTitleStyle: CSSProperties = {
  display: "block",
  color: "#6E5084",
  fontSize: "13px",
};

const selectedRecordTextStyle: CSSProperties = {
  display: "block",
  marginTop: "4px",
  color: "#6B7280",
  fontSize: "11px",
};

const panelFormListStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const panelMemberFormStyle: CSSProperties = {
  padding: "14px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "11px",
};

const panelMemberHeadingStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
};

const panelMemberNumberStyle: CSSProperties = {
  color: "#374151",
  fontSize: "12px",
};

const emptyPanelMemberStyle: CSSProperties = {
  padding: "14px",
  background: "#F9FAFB",
  border: "1px dashed #D1D5DB",
  borderRadius: "10px",
  color: "#6B7280",
  fontSize: "12px",
  textAlign: "center",
};

const checkboxFieldStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  marginTop: "12px",
  padding: "12px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  cursor: "pointer",
};

const checkboxInputStyle: CSSProperties = {
  marginTop: "2px",
  width: "16px",
  height: "16px",
  accentColor: "#6E5084",
};

const checkboxLabelStyle: CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "12px",
};

const checkboxDescriptionStyle: CSSProperties = {
  display: "block",
  marginTop: "4px",
  color: "#6B7280",
  fontSize: "11px",
  lineHeight: 1.45,
};

const formActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
  paddingTop: "18px",
  borderTop: "1px solid #EEF0F2",
};

const interviewListStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const interviewCardStyle: CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: "13px",
  padding: "16px",
  background: "#FFFFFF",
};

const interviewHeadingStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
};

const candidateIdentityStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const candidateAvatarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "42px",
  height: "42px",
  flexShrink: 0,
  borderRadius: "12px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  color: "#6E5084",
  fontSize: "14px",
  fontWeight: 800,
};

const candidateNameStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "16px",
};

const referenceStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "#6B7280",
  fontSize: "11px",
};

const badgeRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: "6px",
};

const typeBadgeStyle: CSSProperties = {
  display: "inline-flex",
  borderRadius: "999px",
  padding: "4px 8px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  color: "#6E5084",
  fontSize: "11px",
  fontWeight: 700,
};

const outcomeBadgeStyle: CSSProperties = {
  display: "inline-flex",
  borderRadius: "999px",
  padding: "4px 8px",
  background: "#F5FFF9",
  border: "1px solid #CFE5D7",
  color: "#41644D",
  fontSize: "11px",
  fontWeight: 700,
};

const neutralBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  padding: "4px 8px",
  background: "#F9FAFB",
  border: "1px solid #D1D5DB",
  color: "#6B7280",
  fontSize: "11px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const consentBadgeStyle: CSSProperties = {
  ...neutralBadgeStyle,
  background: "#F5FFF9",
  borderColor: "#CFE5D7",
  color: "#41644D",
};

const warningBadgeStyle: CSSProperties = {
  ...neutralBadgeStyle,
  background: "#FFF9EE",
  borderColor: "#E8D9B7",
  color: "#755E2C",
};

const archivedBadgeStyle: CSSProperties = {
  ...neutralBadgeStyle,
  background: "#F3F4F6",
  color: "#5B6470",
};

const interviewDetailsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(145px, 1fr))",
  gap: "14px",
  marginTop: "16px",
};

const detailLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: "4px",
  color: "#6B7280",
  fontSize: "10px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const detailValueStyle: CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "13px",
  lineHeight: 1.4,
};

const detailHelpStyle: CSSProperties = {
  display: "block",
  marginTop: "3px",
  color: "#6B7280",
  fontSize: "11px",
  lineHeight: 1.4,
  overflowWrap: "anywhere",
};

const outcomePanelStyle: CSSProperties = {
  marginTop: "15px",
  padding: "12px",
  background: "#F5FFF9",
  border: "1px solid #CFE5D7",
  borderRadius: "10px",
};

const outcomeLabelStyle: CSSProperties = {
  color: "#41644D",
  fontSize: "10px",
  fontWeight: 800,
  textTransform: "uppercase",
};

const outcomeReasonStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "#43584A",
  fontSize: "12px",
  lineHeight: 1.55,
};

const expandedAreaStyle: CSSProperties = {
  marginTop: "16px",
  paddingTop: "16px",
  borderTop: "1px solid #EEF0F2",
};

const expandedGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "12px",
};

const informationPanelStyle: CSSProperties = {
  padding: "14px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "11px",
};

const expandedPanelTitleStyle: CSSProperties = {
  margin: "0 0 12px",
  color: "#111827",
  fontSize: "13px",
};

const informationListStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
};

const informationRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "135px minmax(0, 1fr)",
  gap: "10px",
  paddingBottom: "8px",
  borderBottom: "1px solid #E5E7EB",
};

const informationLabelStyle: CSSProperties = {
  color: "#6B7280",
  fontSize: "11px",
  fontWeight: 700,
};

const informationValueStyle: CSSProperties = {
  color: "#374151",
  fontSize: "11px",
  lineHeight: 1.5,
  overflowWrap: "anywhere",
};

const panelDisplayListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
};

const panelDisplayItemStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "10px",
  padding: "10px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "9px",
};

const panelDisplayNameStyle: CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "12px",
};

const panelDisplayEmailStyle: CSSProperties = {
  display: "block",
  marginTop: "4px",
  color: "#6B7280",
  fontSize: "10px",
};

const scorecardItemStyle: CSSProperties = {
  padding: "10px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "9px",
};

const scorecardHeadingStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
};

const scorecardMetricsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
  marginTop: "8px",
  color: "#6B7280",
  fontSize: "10px",
};

const emptyInformationTextStyle: CSSProperties = {
  margin: 0,
  color: "#6B7280",
  fontSize: "12px",
};

const cardActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: "8px",
  marginTop: "16px",
  paddingTop: "14px",
  borderTop: "1px solid #EEF0F2",
};

const emptyPanelStyle: CSSProperties = {
  padding: "28px",
  background: "#F9FAFB",
  border: "1px dashed #D1D5DB",
  borderRadius: "12px",
  textAlign: "center",
};

const emptyIconStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "22px",
  marginBottom: "8px",
};

const emptyTitleStyle: CSSProperties = {
  display: "block",
  color: "#111827",
  fontSize: "14px",
};

const emptyTextStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.6,
};

const emptyPrimaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  marginTop: "14px",
};

const errorPanelStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "18px",
  padding: "14px",
  border: "1px solid #E8D9B7",
  borderRadius: "12px",
  background: "#FFF9EE",
};

const errorTitleStyle: CSSProperties = {
  color: "#5F4A22",
  fontSize: "13px",
};

const errorTextStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#765E32",
  fontSize: "12px",
  lineHeight: 1.5,
};

const loadingPanelStyle: CSSProperties = {
  padding: "38px",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  background: "#F9FAFB",
  textAlign: "center",
};

const spinnerStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  margin: "0 auto 12px",
  border: "3px solid #E8DDF0",
  borderTopColor: "#6E5084",
  borderRadius: "999px",
};

const loadingTitleStyle: CSSProperties = {
  color: "#111827",
  fontSize: "14px",
};

const loadingTextStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "13px",
};
