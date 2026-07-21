import type {
  ApplicationRecommendation,
  ApplicationStatus,
  AppointmentStatus,
  ApprovalStatus,
  CalendarSyncStatus,
  DbsLevel,
  InterviewOutcome,
  InterviewPanelRole,
  InterviewStatus,
  InterviewType,
  OfferStatus,
  OfferType,
  SalaryPeriod,
  ScorecardRecommendation,
  TalentPoolStatus,
  TalentSelectOption,
  VacancyEmploymentType,
  VacancyStatus,
  VerificationStatus,
} from "../types/talent";

export const TALENT_MODULE_NAME = "Leo Talent";

export const TALENT_DATE_FORMAT = "dd MMM yyyy";

export const TALENT_DATE_TIME_FORMAT = "dd MMM yyyy, HH:mm";

export const TALENT_DEFAULT_PAGE_SIZE = 25;

export const TALENT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export const TALENT_EXPORT_FORMATS = [
  {
    value: "csv",
    label: "CSV",
    description: "Export the current view as a CSV file.",
  },
  {
    value: "xlsx",
    label: "Excel",
    description: "Export the current view as an Excel workbook.",
  },
  {
    value: "pdf",
    label: "PDF",
    description: "Export the current view as a formatted PDF.",
  },
] as const;

export const VACANCY_STATUS_OPTIONS: TalentSelectOption<VacancyStatus>[] = [
  {
    value: "draft",
    label: "Draft",
    description: "The vacancy is still being prepared.",
  },
  {
    value: "approval_required",
    label: "Approval required",
    description: "The vacancy is waiting for internal approval.",
  },
  {
    value: "approved",
    label: "Approved",
    description: "The vacancy has been approved but is not yet open.",
  },
  {
    value: "open",
    label: "Open",
    description: "Applications are currently being accepted.",
  },
  {
    value: "paused",
    label: "Paused",
    description: "Recruitment has been temporarily paused.",
  },
  {
    value: "closed",
    label: "Closed",
    description: "Applications are no longer being accepted.",
  },
  {
    value: "filled",
    label: "Filled",
    description: "The vacancy has been successfully filled.",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    description: "Recruitment for this vacancy has been cancelled.",
  },
  {
    value: "archived",
    label: "Archived",
    description: "The vacancy is retained for record purposes.",
  },
];

export const VACANCY_EMPLOYMENT_TYPE_OPTIONS: TalentSelectOption<VacancyEmploymentType>[] =
  [
    { value: "permanent", label: "Permanent" },
    { value: "fixed_term", label: "Fixed-term" },
    { value: "temporary", label: "Temporary" },
    { value: "casual", label: "Casual" },
    { value: "zero_hours", label: "Zero-hours" },
    { value: "apprenticeship", label: "Apprenticeship" },
    { value: "internship", label: "Internship" },
    { value: "contractor", label: "Contractor" },
    { value: "volunteer", label: "Volunteer" },
    { value: "other", label: "Other" },
  ];

export const SALARY_PERIOD_OPTIONS: TalentSelectOption<SalaryPeriod>[] = [
  { value: "hour", label: "Per hour" },
  { value: "day", label: "Per day" },
  { value: "week", label: "Per week" },
  { value: "month", label: "Per month" },
  { value: "year", label: "Per year" },
  { value: "fixed", label: "Fixed amount" },
];

export const APPROVAL_STATUS_OPTIONS: TalentSelectOption<ApprovalStatus>[] = [
  { value: "not_required", label: "Not required" },
  { value: "pending", label: "Pending approval" },
  { value: "approved", label: "Approved" },
  { value: "returned", label: "Returned for changes" },
  { value: "declined", label: "Declined" },
];

export const APPLICATION_STATUS_OPTIONS: TalentSelectOption<ApplicationStatus>[] =
  [
    { value: "draft", label: "Draft" },
    { value: "submitted", label: "Submitted" },
    { value: "active", label: "Active" },
    { value: "on_hold", label: "On hold" },
    { value: "withdrawn", label: "Withdrawn" },
    { value: "rejected", label: "Rejected" },
    { value: "unsuccessful", label: "Unsuccessful" },
    { value: "offered", label: "Offered" },
    { value: "appointed", label: "Appointed" },
    { value: "archived", label: "Archived" },
  ];

export const APPLICATION_RECOMMENDATION_OPTIONS: TalentSelectOption<ApplicationRecommendation>[] =
  [
    {
      value: "strong_proceed",
      label: "Strong proceed",
      description: "The candidate strongly meets the required criteria.",
    },
    {
      value: "proceed",
      label: "Proceed",
      description: "The candidate should continue to the next stage.",
    },
    {
      value: "hold",
      label: "Hold",
      description: "Retain the application while further review takes place.",
    },
    {
      value: "do_not_proceed",
      label: "Do not proceed",
      description: "The application should not continue.",
    },
    {
      value: "manual_review_required",
      label: "Manual review required",
      description: "A person must review the application before a decision.",
    },
  ];

export const TALENT_POOL_STATUS_OPTIONS: TalentSelectOption<TalentPoolStatus>[] =
  [
    { value: "not_added", label: "Not in talent pool" },
    { value: "active", label: "Active" },
    { value: "do_not_contact", label: "Do not contact" },
    { value: "withdrawn", label: "Withdrawn" },
    { value: "archived", label: "Archived" },
  ];

export const INTERVIEW_TYPE_OPTIONS: TalentSelectOption<InterviewType>[] = [
  { value: "telephone", label: "Telephone" },
  { value: "video", label: "Video" },
  { value: "in_person", label: "In person" },
  { value: "panel", label: "Panel" },
  { value: "practical", label: "Practical assessment" },
  { value: "assessment", label: "Assessment" },
  { value: "presentation", label: "Presentation" },
  { value: "structured", label: "Structured interview" },
  { value: "other", label: "Other" },
];

export const INTERVIEW_STATUS_OPTIONS: TalentSelectOption<InterviewStatus>[] = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "invited", label: "Invitation sent" },
  { value: "confirmed", label: "Confirmed" },
  { value: "reschedule_requested", label: "Reschedule requested" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "Did not attend" },
];

export const INTERVIEW_OUTCOME_OPTIONS: TalentSelectOption<InterviewOutcome>[] =
  [
    { value: "proceed", label: "Proceed" },
    { value: "hold", label: "Hold" },
    { value: "additional_stage", label: "Additional stage" },
    { value: "offer", label: "Make offer" },
    { value: "unsuccessful", label: "Unsuccessful" },
    { value: "withdrawn", label: "Candidate withdrew" },
  ];

export const INTERVIEW_PANEL_ROLE_OPTIONS: TalentSelectOption<InterviewPanelRole>[] =
  [
    { value: "chair", label: "Chair" },
    { value: "member", label: "Panel member" },
    { value: "observer", label: "Observer" },
    { value: "note_taker", label: "Note taker" },
    { value: "hiring_manager", label: "Hiring manager" },
  ];

export const SCORECARD_RECOMMENDATION_OPTIONS: TalentSelectOption<ScorecardRecommendation>[] =
  [
    { value: "strong_proceed", label: "Strong proceed" },
    { value: "proceed", label: "Proceed" },
    { value: "hold", label: "Hold" },
    { value: "do_not_proceed", label: "Do not proceed" },
  ];

export const OFFER_TYPE_OPTIONS: TalentSelectOption<OfferType>[] = [
  {
    value: "conditional",
    label: "Conditional",
    description: "The offer depends on specified checks or conditions.",
  },
  {
    value: "unconditional",
    label: "Unconditional",
    description: "No outstanding conditions remain.",
  },
  {
    value: "verbal",
    label: "Verbal",
    description: "A verbal offer has been made.",
  },
  {
    value: "revised",
    label: "Revised",
    description: "The offer replaces an earlier version.",
  },
];

export const OFFER_STATUS_OPTIONS: TalentSelectOption<OfferStatus>[] = [
  { value: "draft", label: "Draft" },
  { value: "approval_required", label: "Approval required" },
  { value: "approved", label: "Approved" },
  { value: "sent", label: "Sent" },
  { value: "viewed", label: "Viewed" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "expired", label: "Expired" },
  { value: "superseded", label: "Superseded" },
];

export const APPOINTMENT_STATUS_OPTIONS: TalentSelectOption<AppointmentStatus>[] =
  [
    { value: "pre_employment", label: "Pre-employment" },
    { value: "checks_in_progress", label: "Checks in progress" },
    { value: "ready_to_start", label: "Ready to start" },
    {
      value: "employee_creation_pending",
      label: "Employee creation pending",
    },
    { value: "employee_created", label: "Employee created" },
    { value: "started", label: "Started" },
    { value: "withdrawn", label: "Withdrawn" },
    { value: "cancelled", label: "Cancelled" },
  ];

export const DBS_LEVEL_OPTIONS: TalentSelectOption<DbsLevel>[] = [
  { value: "basic", label: "Basic DBS" },
  { value: "standard", label: "Standard DBS" },
  { value: "enhanced", label: "Enhanced DBS" },
  {
    value: "enhanced_barred_list",
    label: "Enhanced DBS with barred list",
  },
];

export const VERIFICATION_STATUS_OPTIONS: TalentSelectOption<VerificationStatus>[] =
  [
    { value: "not_checked", label: "Not checked" },
    { value: "pending", label: "Pending" },
    { value: "verified", label: "Verified" },
    { value: "rejected", label: "Rejected" },
    { value: "expired", label: "Expired" },
    { value: "not_applicable", label: "Not applicable" },
  ];

export const CALENDAR_SYNC_STATUS_OPTIONS: TalentSelectOption<CalendarSyncStatus>[] =
  [
    { value: "not_synced", label: "Not synced" },
    { value: "pending", label: "Sync pending" },
    { value: "synced", label: "Synced" },
    { value: "failed", label: "Sync failed" },
    { value: "removed", label: "Removed" },
  ];

export const CANDIDATE_SOURCE_OPTIONS = [
  { value: "direct", label: "Direct application" },
  { value: "organisation_website", label: "Organisation website" },
  { value: "internal", label: "Internal candidate" },
  { value: "employee_referral", label: "Employee referral" },
  { value: "recruitment_agency", label: "Recruitment agency" },
  { value: "job_board", label: "Job board" },
  { value: "social_media", label: "Social media" },
  { value: "talent_pool", label: "Talent pool" },
  { value: "event", label: "Recruitment event" },
  { value: "speculative", label: "Speculative application" },
  { value: "other", label: "Other" },
] as const;

export const AI_SCREENING_MODE_OPTIONS = [
  {
    value: "off",
    label: "Off",
    description: "Leo will not analyse or score applications.",
  },
  {
    value: "assist",
    label: "Assist",
    description:
      "Leo may summarise evidence and highlight areas for human review.",
  },
  {
    value: "score",
    label: "Score",
    description:
      "Leo may provide a score and recommendation, but a person must decide.",
  },
] as const;

export const BLIND_REVIEW_OPTIONS = [
  {
    value: "off",
    label: "Off",
    description: "Candidate identity information remains visible.",
  },
  {
    value: "application_review",
    label: "Application review",
    description:
      "Identity information is hidden during initial application review.",
  },
  {
    value: "shortlisting",
    label: "Application and shortlisting",
    description:
      "Identity information remains hidden until shortlisting is complete.",
  },
] as const;

export const REFERENCE_REQUIREMENT_OPTIONS = [
  {
    value: 0,
    label: "No references required",
  },
  {
    value: 1,
    label: "One reference",
  },
  {
    value: 2,
    label: "Two references",
  },
  {
    value: 3,
    label: "Three references",
  },
] as const;

export const RIGHT_TO_WORK_METHOD_OPTIONS = [
  { value: "manual_document_check", label: "Manual document check" },
  { value: "online_share_code", label: "Online share code" },
  {
    value: "employer_checking_service",
    label: "Employer Checking Service",
  },
  { value: "digital_identity", label: "Digital identity check" },
] as const;

export const REFERENCE_TYPE_OPTIONS = [
  { value: "employment", label: "Employment reference" },
  { value: "character", label: "Character reference" },
  { value: "academic", label: "Academic reference" },
  { value: "regulated_role", label: "Regulated-role reference" },
  { value: "other", label: "Other" },
] as const;

export const REFERENCE_VERIFICATION_METHOD_OPTIONS = [
  { value: "telephone", label: "Telephone verification" },
  { value: "email", label: "Email verification" },
  { value: "organisation_directory", label: "Organisation directory" },
  { value: "website", label: "Official website" },
  { value: "other", label: "Other" },
] as const;

export const OVERSEAS_CHECK_TYPE_OPTIONS = [
  { value: "police_clearance", label: "Overseas police clearance" },
  { value: "certificate_good_conduct", label: "Certificate of good conduct" },
  { value: "criminal_record_check", label: "Criminal record check" },
  { value: "embassy_confirmation", label: "Embassy confirmation" },
  { value: "other", label: "Other" },
] as const;

export const DOCUMENT_CATEGORY_OPTIONS = [
  { value: "cv", label: "CV" },
  { value: "application_form", label: "Application form" },
  { value: "cover_letter", label: "Cover letter" },
  { value: "identity", label: "Identity evidence" },
  { value: "right_to_work", label: "Right to Work evidence" },
  { value: "dbs", label: "DBS evidence" },
  { value: "reference", label: "Reference" },
  { value: "qualification", label: "Qualification evidence" },
  { value: "overseas_check", label: "Overseas check" },
  { value: "interview", label: "Interview document" },
  { value: "offer", label: "Offer document" },
  { value: "contract", label: "Contract document" },
  { value: "onboarding", label: "Onboarding document" },
  { value: "other", label: "Other" },
] as const;

export const TALENT_PIPELINE_STAGES = [
  {
    key: "new_application",
    label: "New applications",
    description: "Applications received but not yet reviewed.",
    order: 10,
  },
  {
    key: "initial_review",
    label: "Initial review",
    description: "Applications undergoing initial assessment.",
    order: 20,
  },
  {
    key: "shortlisting",
    label: "Shortlisting",
    description: "Candidates being considered for interview.",
    order: 30,
  },
  {
    key: "interview",
    label: "Interview",
    description: "Candidates progressing through interview stages.",
    order: 40,
  },
  {
    key: "pre_employment_checks",
    label: "Pre-employment checks",
    description: "Due diligence and other pre-employment checks are underway.",
    order: 50,
  },
  {
    key: "offer",
    label: "Offer",
    description: "An offer is being prepared or considered.",
    order: 60,
  },
  {
    key: "appointed",
    label: "Appointed",
    description: "The candidate has accepted and is being appointed.",
    order: 70,
  },
  {
    key: "unsuccessful",
    label: "Unsuccessful",
    description: "The application is no longer progressing.",
    order: 80,
  },
  {
    key: "withdrawn",
    label: "Withdrawn",
    description: "The candidate has withdrawn.",
    order: 90,
  },
] as const;

export const TALENT_QUICK_ACTIONS = [
  {
    key: "create_vacancy",
    label: "Create vacancy",
    description: "Create and prepare a new vacancy.",
    href: "/dashboard/leo-talent/vacancies/create",
  },
  {
    key: "view_applications",
    label: "Review applications",
    description: "Open the application register.",
    href: "/dashboard/leo-talent/applications",
  },
  {
    key: "schedule_interview",
    label: "Schedule interview",
    description: "Create or manage an interview.",
    href: "/dashboard/leo-talent/interviews",
  },
  {
    key: "review_checks",
    label: "Review due diligence",
    description: "Review outstanding pre-employment checks.",
    href: "/dashboard/leo-talent/safer-recruitment",
  },
  {
    key: "manage_offers",
    label: "Manage offers",
    description: "Prepare and monitor candidate offers.",
    href: "/dashboard/leo-talent/offers",
  },
] as const;

export const TALENT_NAVIGATION_ITEMS = [
  {
    key: "dashboard",
    label: "Overview",
    href: "/dashboard/leo-talent",
  },
  {
    key: "vacancies",
    label: "Vacancies",
    href: "/dashboard/leo-talent/vacancies",
  },
  {
    key: "applications",
    label: "Applications",
    href: "/dashboard/leo-talent/applications",
  },
  {
    key: "candidates",
    label: "Candidates",
    href: "/dashboard/leo-talent/candidates",
  },
  {
    key: "interviews",
    label: "Interviews",
    href: "/dashboard/leo-talent/interviews",
  },
  {
    key: "safer_recruitment",
    label: "Due Diligence",
    href: "/dashboard/leo-talent/safer-recruitment",
  },
  {
    key: "offers",
    label: "Offers",
    href: "/dashboard/leo-talent/offers",
  },
  {
    key: "system",
    label: "System",
    href: "/dashboard/leo-talent/system",
  },
] as const;

export const TALENT_SYSTEM_NAVIGATION_ITEMS = [
  {
    key: "ai_studio",
    label: "AI Studio",
    href: "/dashboard/leo-talent/system/ai-studio",
  },
  {
    key: "templates",
    label: "Templates",
    href: "/dashboard/leo-talent/system/templates",
  },
  {
    key: "settings",
    label: "Settings",
    href: "/dashboard/leo-talent/system/settings",
  },
  {
    key: "imports",
    label: "Imports",
    href: "/dashboard/leo-talent/system/import",
  },
  {
    key: "exports",
    label: "Exports",
    href: "/dashboard/leo-talent/system/export",
  },
  {
    key: "audit",
    label: "Audit",
    href: "/dashboard/leo-talent/system/audit",
  },
  {
    key: "archive",
    label: "Archive",
    href: "/dashboard/leo-talent/system/archive",
  },
] as const;

export const TALENT_BADGE_CLASS_NAMES = {
  neutral: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  purple: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200",
  blue: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
  red: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
} as const;

export const VACANCY_STATUS_BADGE_VARIANT: Record<
  VacancyStatus,
  keyof typeof TALENT_BADGE_CLASS_NAMES
> = {
  draft: "neutral",
  approval_required: "amber",
  approved: "blue",
  open: "green",
  paused: "amber",
  closed: "neutral",
  filled: "purple",
  cancelled: "red",
  archived: "neutral",
};

export const APPLICATION_STATUS_BADGE_VARIANT: Record<
  ApplicationStatus,
  keyof typeof TALENT_BADGE_CLASS_NAMES
> = {
  draft: "neutral",
  submitted: "blue",
  active: "green",
  on_hold: "amber",
  withdrawn: "neutral",
  rejected: "red",
  unsuccessful: "red",
  offered: "purple",
  appointed: "green",
  archived: "neutral",
};

export const INTERVIEW_STATUS_BADGE_VARIANT: Record<
  InterviewStatus,
  keyof typeof TALENT_BADGE_CLASS_NAMES
> = {
  draft: "neutral",
  scheduled: "blue",
  invited: "purple",
  confirmed: "green",
  reschedule_requested: "amber",
  cancelled: "red",
  completed: "green",
  no_show: "red",
};

export const OFFER_STATUS_BADGE_VARIANT: Record<
  OfferStatus,
  keyof typeof TALENT_BADGE_CLASS_NAMES
> = {
  draft: "neutral",
  approval_required: "amber",
  approved: "blue",
  sent: "purple",
  viewed: "blue",
  accepted: "green",
  declined: "red",
  withdrawn: "red",
  expired: "amber",
  superseded: "neutral",
};

export const APPOINTMENT_STATUS_BADGE_VARIANT: Record<
  AppointmentStatus,
  keyof typeof TALENT_BADGE_CLASS_NAMES
> = {
  pre_employment: "blue",
  checks_in_progress: "amber",
  ready_to_start: "green",
  employee_creation_pending: "purple",
  employee_created: "green",
  started: "green",
  withdrawn: "red",
  cancelled: "red",
};

export const TALENT_EMPTY_STATES = {
  vacancies: {
    title: "No vacancies found",
    description:
      "Create a vacancy to begin managing recruitment through Leo Talent.",
    actionLabel: "Create vacancy",
    actionHref: "/dashboard/leo-talent/vacancies/create",
  },
  applications: {
    title: "No applications found",
    description:
      "Applications will appear here once candidates apply for a vacancy.",
  },
  candidates: {
    title: "No candidates found",
    description:
      "Candidate records will appear here when applications are received or created.",
  },
  interviews: {
    title: "No interviews found",
    description:
      "Scheduled and completed interviews will appear in this register.",
  },
  saferRecruitment: {
    title: "No checks found",
    description:
     "Due diligence checks will appear after a candidate progresses.",
  },
  offers: {
    title: "No offers found",
    description:
      "Candidate offers will appear here when they are prepared or sent.",
  },
} as const;

export function getTalentOptionLabel<
  TValue extends string,
>(
  options: ReadonlyArray<TalentSelectOption<TValue>>,
  value: TValue | null | undefined,
): string {
  if (!value) {
    return "Not set";
  }

  return options.find((option) => option.value === value)?.label ?? value;
}