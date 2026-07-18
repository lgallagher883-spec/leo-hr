export type TalentPermissionLevel =
  | "owner"
  | "senior"
  | "manager"
  | "employee";

export type TalentRecordStatus =
  | "active"
  | "inactive"
  | "archived";

export type VacancyEmploymentType =
  | "permanent"
  | "fixed_term"
  | "temporary"
  | "casual"
  | "zero_hours"
  | "apprenticeship"
  | "internship"
  | "contractor"
  | "volunteer"
  | "other";

export type SalaryPeriod =
  | "hour"
  | "day"
  | "week"
  | "month"
  | "year"
  | "fixed";

export type VacancyStatus =
  | "draft"
  | "approval_required"
  | "approved"
  | "open"
  | "paused"
  | "closed"
  | "filled"
  | "cancelled"
  | "archived";

export type ApprovalStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "returned"
  | "declined";

export type DbsLevel =
  | "basic"
  | "standard"
  | "enhanced"
  | "enhanced_barred_list";

export type TalentPoolStatus =
  | "not_added"
  | "active"
  | "do_not_contact"
  | "withdrawn"
  | "archived";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "active"
  | "on_hold"
  | "withdrawn"
  | "rejected"
  | "unsuccessful"
  | "offered"
  | "appointed"
  | "archived";

export type ApplicationRecommendation =
  | "strong_proceed"
  | "proceed"
  | "hold"
  | "do_not_proceed"
  | "manual_review_required";

export type InterviewType =
  | "telephone"
  | "video"
  | "in_person"
  | "panel"
  | "practical"
  | "assessment"
  | "presentation"
  | "structured"
  | "other";

export type InterviewStatus =
  | "draft"
  | "scheduled"
  | "invited"
  | "confirmed"
  | "reschedule_requested"
  | "cancelled"
  | "completed"
  | "no_show";

export type InterviewOutcome =
  | "proceed"
  | "hold"
  | "additional_stage"
  | "offer"
  | "unsuccessful"
  | "withdrawn";

export type CalendarSyncStatus =
  | "not_synced"
  | "pending"
  | "synced"
  | "failed"
  | "removed";

export type InterviewPanelRole =
  | "chair"
  | "member"
  | "observer"
  | "note_taker"
  | "hiring_manager";

export type InterviewAttendanceStatus =
  | "invited"
  | "accepted"
  | "declined"
  | "tentative"
  | "attended"
  | "absent";

export type ScorecardStatus =
  | "draft"
  | "submitted"
  | "locked"
  | "returned";

export type ScorecardRecommendation =
  | "strong_proceed"
  | "proceed"
  | "hold"
  | "do_not_proceed";

export type OfferType =
  | "conditional"
  | "unconditional"
  | "verbal"
  | "revised";

export type OfferStatus =
  | "draft"
  | "approval_required"
  | "approved"
  | "sent"
  | "viewed"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "expired"
  | "superseded";

export type AppointmentStatus =
  | "pre_employment"
  | "checks_in_progress"
  | "ready_to_start"
  | "employee_creation_pending"
  | "employee_created"
  | "started"
  | "withdrawn"
  | "cancelled";

export type VerificationStatus =
  | "not_checked"
  | "pending"
  | "verified"
  | "rejected"
  | "expired"
  | "not_applicable";

export interface TalentBaseRecord {
  id: string;
  organisation_id: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  archived_at?: string | null;
  archived_by?: string | null;
  archive_reason?: string | null;
}

export interface TalentVacancy extends TalentBaseRecord {
  vacancy_reference: string;
  title: string;
  department: string | null;
  location_name: string | null;
  site_id: string | null;
  hiring_manager_name: string | null;
  hiring_manager_user_id: string | null;
  employment_type: VacancyEmploymentType;
  work_pattern: string | null;
  hours_per_week: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: SalaryPeriod | null;
  salary_currency: string;
  salary_visible: boolean;
  number_of_positions: number;
  role_summary: string | null;
  responsibilities: string | null;
  essential_criteria: string | null;
  desirable_criteria: string | null;
  benefits: string | null;
  advert_text: string | null;
  status: VacancyStatus;
  approval_status: ApprovalStatus;
  approval_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  opening_date: string | null;
  closing_date: string | null;
  target_start_date: string | null;
  published_at: string | null;
  closed_at: string | null;
  closed_reason: string | null;
  recruitment_lead_name: string | null;
  recruitment_lead_user_id: string | null;
  is_internal_only: boolean;
  accepts_internal_candidates: boolean;
  blind_review_enabled: boolean;
  ai_screening_enabled: boolean;
  safer_recruitment_required: boolean;
  regulated_role: boolean;
  requires_dbs: boolean;
  dbs_level: DbsLevel | null;
  requires_driving: boolean;
  requires_qualification_checks: boolean;
  required_reference_count: number;
  overseas_check_required_if_applicable: boolean;
  application_form_template_id: string | null;
  interview_template_id: string | null;
  onboarding_template_id: string | null;
  metadata: Record<string, unknown>;
}

export interface TalentCandidate extends TalentBaseRecord {
  candidate_reference: string;
  first_name: string;
  middle_names: string | null;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  town_city: string | null;
  county_region: string | null;
  postcode: string | null;
  country: string | null;
  is_internal_candidate: boolean;
  existing_employee_id: number | null;
  source: string | null;
  source_detail: string | null;
  talent_pool_status: TalentPoolStatus;
  consent_to_contact: boolean;
  consent_recorded_at: string | null;
  privacy_notice_version: string | null;
  data_retention_review_date: string | null;
  do_not_contact: boolean;
  do_not_contact_reason: string | null;
  summary: string | null;
  skills: unknown[];
  metadata: Record<string, unknown>;
}

export interface TalentApplication extends TalentBaseRecord {
  application_reference: string;
  vacancy_id: string;
  candidate_id: string;
  current_stage_key: string;
  status: ApplicationStatus;
  source: string | null;
  submitted_at: string | null;
  last_reviewed_at: string | null;
  last_reviewed_by: string | null;
  blind_review_enabled: boolean;
  ai_screening_enabled: boolean;
  manual_score: number | null;
  ai_score: number | null;
  combined_score: number | null;
  recommendation: ApplicationRecommendation | null;
  recommendation_reason: string | null;
  knockout_failed: boolean;
  knockout_details: unknown[];
  withdrawn_at: string | null;
  withdrawal_reason: string | null;
  closed_at: string | null;
  closed_reason: string | null;
  metadata: Record<string, unknown>;
}

export interface TalentInterview extends TalentBaseRecord {
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
}

export interface TalentInterviewPanelMember {
  id: string;
  interview_id: string;
  user_id: string | null;
  employee_id: number | null;
  member_name: string;
  member_email: string | null;
  panel_role: InterviewPanelRole;
  attendance_status: InterviewAttendanceStatus;
  can_score: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TalentOffer extends TalentBaseRecord {
  offer_reference: string;
  application_id: string;
  vacancy_id: string;
  candidate_id: string;
  offer_type: OfferType;
  status: OfferStatus;
  job_title: string;
  department: string | null;
  location_name: string | null;
  manager_name: string | null;
  manager_user_id: string | null;
  employment_type: string;
  proposed_start_date: string | null;
  hours_per_week: number | null;
  work_pattern: string | null;
  salary_amount: number | null;
  salary_period: SalaryPeriod | null;
  salary_currency: string;
  probation_months: number | null;
  holiday_allowance_days: number | null;
  notice_period: string | null;
  conditions: unknown[];
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  approval_notes: string | null;
  sent_at: string | null;
  response_deadline: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  withdrawn_at: string | null;
  withdrawal_reason: string | null;
  candidate_response_notes: string | null;
}

export interface TalentAppointment extends TalentBaseRecord {
  appointment_reference: string;
  offer_id: string;
  application_id: string;
  vacancy_id: string;
  candidate_id: string;
  status: AppointmentStatus;
  agreed_start_date: string | null;
  actual_start_date: string | null;
  manager_name: string | null;
  manager_user_id: string | null;
  department: string | null;
  location_name: string | null;
  employee_id: number | null;
  employee_created_at: string | null;
  employee_created_by: string | null;
  recruitment_summary_transferred: boolean;
  documents_transferred: boolean;
  onboarding_transferred: boolean;
  learning_pathway_triggered: boolean;
  handover_completed_at: string | null;
  handover_notes: string | null;
}

export interface TalentDashboardKpis {
  openVacancies: number;
  activeApplications: number;
  candidatesInProcess: number;
  upcomingInterviews: number;
  outstandingChecks: number;
  offersAwaitingResponse: number;
  appointmentsInProgress: number;
}

export interface TalentDashboardData {
  kpis: TalentDashboardKpis;
  vacancies: TalentVacancy[];
  applications: TalentApplication[];
  candidates: TalentCandidate[];
  interviews: TalentInterview[];
  offers: TalentOffer[];
  appointments: TalentAppointment[];
}

export interface TalentSelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

export interface TalentActionResult<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
  fieldErrors?: Record<string, string[]>;
}

export interface TalentPagination {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface TalentListResponse<T> {
  records: T[];
  pagination: TalentPagination;
}

export interface TalentListFilters {
  search?: string;
  status?: string;
  vacancyId?: string;
  candidateId?: string;
  applicationId?: string;
  dateFrom?: string;
  dateTo?: string;
  archived?: boolean;
  page?: number;
  pageSize?: number;
}