"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SettingsTab =
  | "General"
  | "Notifications"
  | "Categories"
  | "Providers"
  | "AI Studio Defaults"
  | "Certificates"
  | "Assignment Rules"
  | "Review Rules"
  | "Archive"
  | "Data & Storage";

type PlatformRole = "Owner" | "Senior" | "Manager" | "Employee";

type LearningSettings = {
  id: number;
  organisation_id: string | null;

  learning_year_start_month: number;
  learning_year_start_day: number;
  timezone: string;
  working_days: string[];

  default_learning_type: string;
  default_delivery_method: string;
  default_duration_minutes: number | null;
  default_assignment_eligible: boolean;
  default_certificate_available: boolean;
  default_assessment_required: boolean;
  default_manager_validation_required: boolean;

  default_assignment_due_days: number;
  default_review_frequency_months: number;
  default_certificate_reminder_days: number;

  employee_self_enrolment_enabled: boolean;
  manager_assignment_enabled: boolean;
  manager_team_visibility_enabled: boolean;

  created_at: string;
  updated_at: string;
};

type LearningNotificationSettings = {
  id: number;
  organisation_id: string | null;

  assignment_created_employee: boolean;
  assignment_created_manager: boolean;

  assignment_due_enabled: boolean;
  assignment_due_days_before: number[];

  assignment_overdue_employee: boolean;
  assignment_overdue_manager: boolean;
  assignment_overdue_senior: boolean;

  certificate_expiry_enabled: boolean;
  certificate_expiry_days_before: number[];

  qualification_renewal_enabled: boolean;
  learning_review_enabled: boolean;
  pathway_reminders_enabled: boolean;
  manager_validation_reminders_enabled: boolean;

  digest_enabled: boolean;
  digest_frequency: string;
  digest_day: string;
  digest_recipient_roles: PlatformRole[];

  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;

  created_at: string;
  updated_at: string;
};

type LearningCategory = {
  id: number;
  name: string;
  description: string | null;
  colour_reference: string | null;
  display_order: number;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

type LearningProvider = {
  id: number;
  name: string;
  provider_type: string;
  contact_name: string | null;
  email: string | null;
  telephone: string | null;
  website_url: string | null;
  account_reference: string | null;
  notes: string | null;
  is_preferred: boolean;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

type AIStudioDefaults = {
  id: number;
  organisation_id: string | null;

  default_tone: string;
  default_reading_level: string;
  default_language_code: string;
  default_audience: string | null;
  default_output_format: string;

  employment_law_review_default: boolean;
  equality_review_default: boolean;
  accessibility_review_default: boolean;
  manager_review_default: boolean;

  source_citation_required: boolean;
  plain_english_required: boolean;
  organisation_context_enabled: boolean;

  auto_save_outputs: boolean;
  auto_create_version_on_revision: boolean;
  require_approval_before_publish: boolean;

  permitted_roles: PlatformRole[];

  created_at: string;
  updated_at: string;
};

type CertificateSettings = {
  id: number;
  organisation_id: string | null;

  certificate_number_prefix: string;
  certificate_number_sequence_start: number;
  include_employee_number: boolean;
  include_completion_date: boolean;
  include_expiry_date: boolean;
  include_assessment_score: boolean;
  include_provider: boolean;

  default_validity_months: number | null;
  default_renewal_required: boolean;
  default_renewal_reminder_days: number;

  signatory_name: string | null;
  signatory_title: string | null;
  digital_signature_file_path: string | null;
  organisation_logo_file_path: string | null;

  verification_enabled: boolean;
  public_verification_enabled: boolean;

  created_at: string;
  updated_at: string;
};

type AssignmentRules = {
  id: number;
  organisation_id: string | null;

  default_due_days: number;
  allow_no_due_date: boolean;
  allow_manager_due_date_override: boolean;
  allow_employee_decline: boolean;
  employee_decline_reason_required: boolean;

  automatically_mark_overdue: boolean;
  overdue_escalation_enabled: boolean;
  overdue_escalation_days: number;
  overdue_escalation_roles: PlatformRole[];

  auto_reassign_failed_learning: boolean;
  failed_learning_reassignment_days: number;
  maximum_assessment_attempts: number | null;

  manager_validation_due_days: number;
  manager_validation_escalation_enabled: boolean;

  completion_evidence_required_by_default: boolean;
  completion_notes_enabled: boolean;

  created_at: string;
  updated_at: string;
};

type ReviewRules = {
  id: number;
  organisation_id: string | null;

  default_review_frequency_months: number;
  review_reminder_days_before: number[];
  review_owner_role: PlatformRole;

  require_review_before_publish: boolean;
  require_review_after_material_change: boolean;
  require_version_notes: boolean;

  automatically_set_under_review: boolean;
  automatically_archive_superseded_versions: boolean;

  legal_review_for_compliance_content: boolean;
  equality_review_for_people_content: boolean;
  accessibility_review_for_digital_learning: boolean;

  overdue_review_escalation_enabled: boolean;
  overdue_review_escalation_days: number;

  created_at: string;
  updated_at: string;
};

type LearningRolePermission = {
  id: number;
  role_key: PlatformRole;

  can_view_leo_learn: boolean;
  can_view_team_learning: boolean;
  can_view_all_learning: boolean;

  can_create_learning: boolean;
  can_edit_learning: boolean;
  can_publish_learning: boolean;
  can_archive_learning: boolean;
  can_restore_learning: boolean;

  can_assign_learning: boolean;
  can_assign_to_all_employees: boolean;
  can_assign_to_team: boolean;

  can_create_pathways: boolean;
  can_manage_qualifications: boolean;
  can_verify_qualifications: boolean;
  can_issue_certificates: boolean;

  can_use_ai_studio: boolean;
  can_manage_ai_studio: boolean;
  can_complete_professional_reviews: boolean;

  can_manage_categories: boolean;
  can_manage_providers: boolean;
  can_manage_settings: boolean;
  can_export_data: boolean;
  can_import_data: boolean;

  created_at: string;
  updated_at: string;
};

type ArchiveRecord = {
  record_type:
    | "Learning Module"
    | "Development Pathway"
    | "AI Studio Project"
    | "Qualification"
    | "Provider"
    | "Category";
  id: number;
  title: string;
  archived_at: string | null;
  status: string | null;
};

type StorageFile = {
  bucket: string;
  name: string;
  size: number | null;
  created_at: string | null;
};

const tabs: SettingsTab[] = [
  "General",
  "Notifications",
  "Categories",
  "Providers",
  "AI Studio Defaults",
  "Certificates",
  "Assignment Rules",
  "Review Rules",
  "Archive",
  "Data & Storage",
];

const platformRoles: PlatformRole[] = [
  "Owner",
  "Senior",
  "Manager",
  "Employee",
];

const learningTypes = [
  "Course",
  "Assessment",
  "Guide",
  "Workshop",
  "Toolbox Talk",
  "Induction",
  "Reference",
  "Other",
];

const deliveryMethods = [
  "Digital",
  "Face to Face",
  "Virtual",
  "Blended",
  "Self Directed",
  "Practical",
  "External",
];

const providerTypes = [
  "Internal",
  "External",
  "Professional Body",
  "Accredited Provider",
  "Consultant",
  "Online Platform",
  "Regulator or Authority",
  "Other",
];

const tones = [
  "Professional and practical",
  "Clear and accessible",
  "Calm and supportive",
  "Manager focused",
  "Employee focused",
  "Formal",
  "Conversational",
  "Plain English",
];

const readingLevels = [
  "Plain English",
  "General Workplace",
  "Manager",
  "Professional",
  "Technical",
];

const outputFormats = [
  "Learning Module",
  "Assessment",
  "Manager Guide",
  "Facilitator Guide",
  "Workbook",
  "Quick Reference Guide",
  "Development Pathway",
  "Toolbox Talk",
  "Induction Programme",
];

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const digestFrequencies = [
  "Daily",
  "Weekly",
  "Fortnightly",
  "Monthly",
];

const emptyGeneralSettings: Omit<
  LearningSettings,
  "id" | "organisation_id" | "created_at" | "updated_at"
> = {
  learning_year_start_month: 1,
  learning_year_start_day: 1,
  timezone: "Europe/London",
  working_days: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ],
  default_learning_type: "Course",
  default_delivery_method: "Digital",
  default_duration_minutes: 30,
  default_assignment_eligible: true,
  default_certificate_available: false,
  default_assessment_required: false,
  default_manager_validation_required: false,
  default_assignment_due_days: 30,
  default_review_frequency_months: 12,
  default_certificate_reminder_days: 30,
  employee_self_enrolment_enabled: false,
  manager_assignment_enabled: true,
  manager_team_visibility_enabled: true,
};

const emptyNotificationSettings: Omit<
  LearningNotificationSettings,
  "id" | "organisation_id" | "created_at" | "updated_at"
> = {
  assignment_created_employee: true,
  assignment_created_manager: false,
  assignment_due_enabled: true,
  assignment_due_days_before: [14, 7, 1],
  assignment_overdue_employee: true,
  assignment_overdue_manager: true,
  assignment_overdue_senior: false,
  certificate_expiry_enabled: true,
  certificate_expiry_days_before: [90, 60, 30, 7],
  qualification_renewal_enabled: true,
  learning_review_enabled: true,
  pathway_reminders_enabled: true,
  manager_validation_reminders_enabled: true,
  digest_enabled: true,
  digest_frequency: "Weekly",
  digest_day: "Monday",
  digest_recipient_roles: ["Owner", "Senior"],
  quiet_hours_enabled: false,
  quiet_hours_start: "18:00",
  quiet_hours_end: "08:00",
};

const emptyAIStudioDefaults: Omit<
  AIStudioDefaults,
  "id" | "organisation_id" | "created_at" | "updated_at"
> = {
  default_tone: "Professional and practical",
  default_reading_level: "General Workplace",
  default_language_code: "en-GB",
  default_audience: "Employees",
  default_output_format: "Learning Module",
  employment_law_review_default: false,
  equality_review_default: true,
  accessibility_review_default: true,
  manager_review_default: true,
  source_citation_required: false,
  plain_english_required: true,
  organisation_context_enabled: true,
  auto_save_outputs: true,
  auto_create_version_on_revision: true,
  require_approval_before_publish: true,
  permitted_roles: ["Owner", "Senior"],
};

const emptyCertificateSettings: Omit<
  CertificateSettings,
  "id" | "organisation_id" | "created_at" | "updated_at"
> = {
  certificate_number_prefix: "LEO",
  certificate_number_sequence_start: 1000,
  include_employee_number: false,
  include_completion_date: true,
  include_expiry_date: true,
  include_assessment_score: false,
  include_provider: true,
  default_validity_months: null,
  default_renewal_required: false,
  default_renewal_reminder_days: 30,
  signatory_name: null,
  signatory_title: null,
  digital_signature_file_path: null,
  organisation_logo_file_path: null,
  verification_enabled: true,
  public_verification_enabled: false,
};

const emptyAssignmentRules: Omit<
  AssignmentRules,
  "id" | "organisation_id" | "created_at" | "updated_at"
> = {
  default_due_days: 30,
  allow_no_due_date: true,
  allow_manager_due_date_override: true,
  allow_employee_decline: false,
  employee_decline_reason_required: true,
  automatically_mark_overdue: true,
  overdue_escalation_enabled: true,
  overdue_escalation_days: 7,
  overdue_escalation_roles: ["Manager", "Senior"],
  auto_reassign_failed_learning: false,
  failed_learning_reassignment_days: 7,
  maximum_assessment_attempts: 3,
  manager_validation_due_days: 7,
  manager_validation_escalation_enabled: true,
  completion_evidence_required_by_default: false,
  completion_notes_enabled: true,
};

const emptyReviewRules: Omit<
  ReviewRules,
  "id" | "organisation_id" | "created_at" | "updated_at"
> = {
  default_review_frequency_months: 12,
  review_reminder_days_before: [60, 30, 7],
  review_owner_role: "Senior",
  require_review_before_publish: true,
  require_review_after_material_change: true,
  require_version_notes: true,
  automatically_set_under_review: true,
  automatically_archive_superseded_versions: false,
  legal_review_for_compliance_content: true,
  equality_review_for_people_content: true,
  accessibility_review_for_digital_learning: true,
  overdue_review_escalation_enabled: true,
  overdue_review_escalation_days: 14,
};

export default function LearningSettingsWorkspace() {
  const [activeTab, setActiveTab] =
    useState<SettingsTab>("General");

  const [generalSettings, setGeneralSettings] =
    useState(emptyGeneralSettings);

  const [notificationSettings, setNotificationSettings] =
    useState(emptyNotificationSettings);

  const [aiStudioDefaults, setAIStudioDefaults] =
    useState(emptyAIStudioDefaults);

  const [certificateSettings, setCertificateSettings] =
    useState(emptyCertificateSettings);

  const [assignmentRules, setAssignmentRules] =
    useState(emptyAssignmentRules);

  const [reviewRules, setReviewRules] =
    useState(emptyReviewRules);

  const [categories, setCategories] = useState<LearningCategory[]>(
    []
  );

  const [providers, setProviders] = useState<LearningProvider[]>([]);

  const [rolePermissions, setRolePermissions] = useState<
    LearningRolePermission[]
  >([]);

  const [archiveRecords, setArchiveRecords] = useState<
    ArchiveRecord[]
  >([]);

  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryColourReference, setCategoryColourReference] =
    useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<
    number | null
  >(null);

  const [providerName, setProviderName] = useState("");
  const [providerType, setProviderType] = useState("Internal");
  const [providerContactName, setProviderContactName] = useState("");
  const [providerEmail, setProviderEmail] = useState("");
  const [providerTelephone, setProviderTelephone] = useState("");
  const [providerWebsite, setProviderWebsite] = useState("");
  const [providerAccountReference, setProviderAccountReference] =
    useState("");
  const [providerNotes, setProviderNotes] = useState("");
  const [providerPreferred, setProviderPreferred] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState<
    number | null
  >(null);

  const [archiveFilter, setArchiveFilter] = useState("All");
  const [archiveSearch, setArchiveSearch] = useState("");

  const [signatureFile, setSignatureFile] = useState<File | null>(
    null
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [importFile, setImportFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadSettingsWorkspace();
  }, []);

  async function loadSettingsWorkspace() {
    setLoading(true);
    setErrorMessage("");

    const [
      generalResult,
      notificationsResult,
      categoriesResult,
      providersResult,
      aiDefaultsResult,
      certificateResult,
      assignmentResult,
      reviewResult,
      permissionsResult,
    ] = await Promise.all([
      supabase
        .from("learning_settings")
        .select("*")
        .limit(1)
        .maybeSingle(),

      supabase
        .from("learning_notification_settings")
        .select("*")
        .limit(1)
        .maybeSingle(),

      supabase
        .from("learning_categories")
        .select("*")
        .eq("is_archived", false)
        .order("display_order")
        .order("name"),

      supabase
        .from("learning_providers")
        .select("*")
        .eq("is_archived", false)
        .order("is_preferred", { ascending: false })
        .order("name"),

      supabase
        .from("learning_ai_studio_defaults")
        .select("*")
        .limit(1)
        .maybeSingle(),

      supabase
        .from("learning_certificate_configuration")
        .select("*")
        .limit(1)
        .maybeSingle(),

      supabase
        .from("learning_assignment_rules")
        .select("*")
        .limit(1)
        .maybeSingle(),

      supabase
        .from("learning_review_rules")
        .select("*")
        .limit(1)
        .maybeSingle(),

      supabase
        .from("learning_role_permissions")
        .select("*")
        .order("id"),
    ]);

    const firstError =
      generalResult.error ||
      notificationsResult.error ||
      categoriesResult.error ||
      providersResult.error ||
      aiDefaultsResult.error ||
      certificateResult.error ||
      assignmentResult.error ||
      reviewResult.error ||
      permissionsResult.error;

    if (firstError) {
      console.error("Error loading Leo Learn settings:", firstError);

      setErrorMessage(
        "Leo Learn settings could not be loaded. Run the matching Settings SQL before testing this workspace."
      );

      setLoading(false);
      return;
    }

    if (generalResult.data) {
      setGeneralSettings({
        learning_year_start_month:
          generalResult.data.learning_year_start_month,
        learning_year_start_day:
          generalResult.data.learning_year_start_day,
        timezone: generalResult.data.timezone,
        working_days: generalResult.data.working_days || [],
        default_learning_type:
          generalResult.data.default_learning_type,
        default_delivery_method:
          generalResult.data.default_delivery_method,
        default_duration_minutes:
          generalResult.data.default_duration_minutes,
        default_assignment_eligible:
          generalResult.data.default_assignment_eligible,
        default_certificate_available:
          generalResult.data.default_certificate_available,
        default_assessment_required:
          generalResult.data.default_assessment_required,
        default_manager_validation_required:
          generalResult.data.default_manager_validation_required,
        default_assignment_due_days:
          generalResult.data.default_assignment_due_days,
        default_review_frequency_months:
          generalResult.data.default_review_frequency_months,
        default_certificate_reminder_days:
          generalResult.data.default_certificate_reminder_days,
        employee_self_enrolment_enabled:
          generalResult.data.employee_self_enrolment_enabled,
        manager_assignment_enabled:
          generalResult.data.manager_assignment_enabled,
        manager_team_visibility_enabled:
          generalResult.data.manager_team_visibility_enabled,
      });
    }

    if (notificationsResult.data) {
      setNotificationSettings({
        assignment_created_employee:
          notificationsResult.data.assignment_created_employee,
        assignment_created_manager:
          notificationsResult.data.assignment_created_manager,
        assignment_due_enabled:
          notificationsResult.data.assignment_due_enabled,
        assignment_due_days_before:
          notificationsResult.data.assignment_due_days_before || [],
        assignment_overdue_employee:
          notificationsResult.data.assignment_overdue_employee,
        assignment_overdue_manager:
          notificationsResult.data.assignment_overdue_manager,
        assignment_overdue_senior:
          notificationsResult.data.assignment_overdue_senior,
        certificate_expiry_enabled:
          notificationsResult.data.certificate_expiry_enabled,
        certificate_expiry_days_before:
          notificationsResult.data.certificate_expiry_days_before ||
          [],
        qualification_renewal_enabled:
          notificationsResult.data.qualification_renewal_enabled,
        learning_review_enabled:
          notificationsResult.data.learning_review_enabled,
        pathway_reminders_enabled:
          notificationsResult.data.pathway_reminders_enabled,
        manager_validation_reminders_enabled:
          notificationsResult.data
            .manager_validation_reminders_enabled,
        digest_enabled: notificationsResult.data.digest_enabled,
        digest_frequency:
          notificationsResult.data.digest_frequency,
        digest_day: notificationsResult.data.digest_day,
        digest_recipient_roles:
          notificationsResult.data.digest_recipient_roles || [],
        quiet_hours_enabled:
          notificationsResult.data.quiet_hours_enabled,
        quiet_hours_start:
          notificationsResult.data.quiet_hours_start,
        quiet_hours_end: notificationsResult.data.quiet_hours_end,
      });
    }

    if (aiDefaultsResult.data) {
      setAIStudioDefaults({
        default_tone: aiDefaultsResult.data.default_tone,
        default_reading_level:
          aiDefaultsResult.data.default_reading_level,
        default_language_code:
          aiDefaultsResult.data.default_language_code,
        default_audience: aiDefaultsResult.data.default_audience,
        default_output_format:
          aiDefaultsResult.data.default_output_format,
        employment_law_review_default:
          aiDefaultsResult.data.employment_law_review_default,
        equality_review_default:
          aiDefaultsResult.data.equality_review_default,
        accessibility_review_default:
          aiDefaultsResult.data.accessibility_review_default,
        manager_review_default:
          aiDefaultsResult.data.manager_review_default,
        source_citation_required:
          aiDefaultsResult.data.source_citation_required,
        plain_english_required:
          aiDefaultsResult.data.plain_english_required,
        organisation_context_enabled:
          aiDefaultsResult.data.organisation_context_enabled,
        auto_save_outputs: aiDefaultsResult.data.auto_save_outputs,
        auto_create_version_on_revision:
          aiDefaultsResult.data.auto_create_version_on_revision,
        require_approval_before_publish:
          aiDefaultsResult.data.require_approval_before_publish,
        permitted_roles: aiDefaultsResult.data.permitted_roles || [],
      });
    }

    if (certificateResult.data) {
      setCertificateSettings({
        certificate_number_prefix:
          certificateResult.data.certificate_number_prefix,
        certificate_number_sequence_start:
          certificateResult.data.certificate_number_sequence_start,
        include_employee_number:
          certificateResult.data.include_employee_number,
        include_completion_date:
          certificateResult.data.include_completion_date,
        include_expiry_date:
          certificateResult.data.include_expiry_date,
        include_assessment_score:
          certificateResult.data.include_assessment_score,
        include_provider: certificateResult.data.include_provider,
        default_validity_months:
          certificateResult.data.default_validity_months,
        default_renewal_required:
          certificateResult.data.default_renewal_required,
        default_renewal_reminder_days:
          certificateResult.data.default_renewal_reminder_days,
        signatory_name: certificateResult.data.signatory_name,
        signatory_title: certificateResult.data.signatory_title,
        digital_signature_file_path:
          certificateResult.data.digital_signature_file_path,
        organisation_logo_file_path:
          certificateResult.data.organisation_logo_file_path,
        verification_enabled:
          certificateResult.data.verification_enabled,
        public_verification_enabled:
          certificateResult.data.public_verification_enabled,
      });
    }

    if (assignmentResult.data) {
      setAssignmentRules({
        default_due_days: assignmentResult.data.default_due_days,
        allow_no_due_date: assignmentResult.data.allow_no_due_date,
        allow_manager_due_date_override:
          assignmentResult.data.allow_manager_due_date_override,
        allow_employee_decline:
          assignmentResult.data.allow_employee_decline,
        employee_decline_reason_required:
          assignmentResult.data.employee_decline_reason_required,
        automatically_mark_overdue:
          assignmentResult.data.automatically_mark_overdue,
        overdue_escalation_enabled:
          assignmentResult.data.overdue_escalation_enabled,
        overdue_escalation_days:
          assignmentResult.data.overdue_escalation_days,
        overdue_escalation_roles:
          assignmentResult.data.overdue_escalation_roles || [],
        auto_reassign_failed_learning:
          assignmentResult.data.auto_reassign_failed_learning,
        failed_learning_reassignment_days:
          assignmentResult.data.failed_learning_reassignment_days,
        maximum_assessment_attempts:
          assignmentResult.data.maximum_assessment_attempts,
        manager_validation_due_days:
          assignmentResult.data.manager_validation_due_days,
        manager_validation_escalation_enabled:
          assignmentResult.data
            .manager_validation_escalation_enabled,
        completion_evidence_required_by_default:
          assignmentResult.data
            .completion_evidence_required_by_default,
        completion_notes_enabled:
          assignmentResult.data.completion_notes_enabled,
      });
    }

    if (reviewResult.data) {
      setReviewRules({
        default_review_frequency_months:
          reviewResult.data.default_review_frequency_months,
        review_reminder_days_before:
          reviewResult.data.review_reminder_days_before || [],
        review_owner_role: reviewResult.data.review_owner_role,
        require_review_before_publish:
          reviewResult.data.require_review_before_publish,
        require_review_after_material_change:
          reviewResult.data.require_review_after_material_change,
        require_version_notes:
          reviewResult.data.require_version_notes,
        automatically_set_under_review:
          reviewResult.data.automatically_set_under_review,
        automatically_archive_superseded_versions:
          reviewResult.data
            .automatically_archive_superseded_versions,
        legal_review_for_compliance_content:
          reviewResult.data.legal_review_for_compliance_content,
        equality_review_for_people_content:
          reviewResult.data.equality_review_for_people_content,
        accessibility_review_for_digital_learning:
          reviewResult.data
            .accessibility_review_for_digital_learning,
        overdue_review_escalation_enabled:
          reviewResult.data.overdue_review_escalation_enabled,
        overdue_review_escalation_days:
          reviewResult.data.overdue_review_escalation_days,
      });
    }

    setCategories(
      (categoriesResult.data || []) as LearningCategory[]
    );

    setProviders(
      (providersResult.data || []) as LearningProvider[]
    );

    setRolePermissions(
      (permissionsResult.data || []) as LearningRolePermission[]
    );

    setLoading(false);
  }

  async function saveSingletonSettings(
    tableName: string,
    payload: Record<string, unknown>,
    successMessage: string
  ) {
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const { data: existing, error: existingError } = await supabase
      .from(tableName)
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existingError) {
      setErrorMessage("The settings record could not be checked.");
      setSaving(false);
      return;
    }

    const result = existing
      ? await supabase
          .from(tableName)
          .update(payload)
          .eq("id", existing.id)
      : await supabase.from(tableName).insert(payload);

    if (result.error) {
      console.error(`Error saving ${tableName}:`, result.error);
      setErrorMessage("The settings could not be saved.");
      setSaving(false);
      return;
    }

    setMessage(successMessage);
    setSaving(false);
  }

  async function saveGeneralSettings() {
    await saveSingletonSettings(
      "learning_settings",
      generalSettings,
      "General learning settings saved."
    );
  }

  async function saveNotificationSettings() {
    await saveSingletonSettings(
      "learning_notification_settings",
      notificationSettings,
      "Learning notification settings saved."
    );
  }

  async function saveAIStudioDefaults() {
    await saveSingletonSettings(
      "learning_ai_studio_defaults",
      aiStudioDefaults,
      "AI Studio defaults saved."
    );
  }

  async function saveCertificateSettings() {
    let signaturePath =
      certificateSettings.digital_signature_file_path;

    let logoPath = certificateSettings.organisation_logo_file_path;

    if (signatureFile) {
      signaturePath = await uploadSettingsFile(
        signatureFile,
        "certificate-signatures"
      );

      if (!signaturePath) {
        return;
      }
    }

    if (logoFile) {
      logoPath = await uploadSettingsFile(
        logoFile,
        "certificate-logos"
      );

      if (!logoPath) {
        return;
      }
    }

    await saveSingletonSettings(
      "learning_certificate_configuration",
      {
        ...certificateSettings,
        digital_signature_file_path: signaturePath,
        organisation_logo_file_path: logoPath,
      },
      "Certificate settings saved."
    );

    setCertificateSettings((current) => ({
      ...current,
      digital_signature_file_path: signaturePath,
      organisation_logo_file_path: logoPath,
    }));

    setSignatureFile(null);
    setLogoFile(null);
  }

  async function saveAssignmentRules() {
    await saveSingletonSettings(
      "learning_assignment_rules",
      assignmentRules,
      "Assignment rules saved."
    );
  }

  async function saveReviewRules() {
    await saveSingletonSettings(
      "learning_review_rules",
      reviewRules,
      "Learning review rules saved."
    );
  }

  async function uploadSettingsFile(
    file: File,
    folder: string
  ): Promise<string | null> {
    const safeName = file.name.replace(
      /[^a-zA-Z0-9.\-_]/g,
      "_"
    );

    const path = `${folder}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from("learning-settings")
      .upload(path, file);

    if (error) {
      console.error("Learning settings upload failed:", error);
      setErrorMessage("The selected file could not be uploaded.");
      setSaving(false);
      return null;
    }

    return path;
  }

  async function saveCategory() {
    if (!categoryName.trim()) {
      setErrorMessage("Enter the category name.");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const payload = {
      name: categoryName.trim(),
      description: categoryDescription.trim() || null,
      colour_reference:
        categoryColourReference.trim() || null,
      display_order:
        editingCategoryId !== null
          ? categories.find(
              (category) => category.id === editingCategoryId
            )?.display_order || 100
          : categories.length + 1,
      is_active: true,
      is_archived: false,
    };

    const result =
      editingCategoryId !== null
        ? await supabase
            .from("learning_categories")
            .update(payload)
            .eq("id", editingCategoryId)
        : await supabase
            .from("learning_categories")
            .insert(payload);

    if (result.error) {
      console.error("Error saving category:", result.error);
      setErrorMessage("The learning category could not be saved.");
      setSaving(false);
      return;
    }

    resetCategoryForm();

    setMessage(
      editingCategoryId !== null
        ? "Learning category updated."
        : "Learning category created."
    );

    setSaving(false);
    await loadSettingsWorkspace();
  }

  function editCategory(category: LearningCategory) {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryDescription(category.description || "");
    setCategoryColourReference(category.colour_reference || "");
  }

  function resetCategoryForm() {
    setEditingCategoryId(null);
    setCategoryName("");
    setCategoryDescription("");
    setCategoryColourReference("");
  }

  async function toggleCategory(
    category: LearningCategory,
    isActive: boolean
  ) {
    const { error } = await supabase
      .from("learning_categories")
      .update({
        is_active: isActive,
      })
      .eq("id", category.id);

    if (error) {
      setErrorMessage("The learning category could not be updated.");
      return;
    }

    setMessage(
      `${category.name} ${isActive ? "activated" : "deactivated"}.`
    );

    await loadSettingsWorkspace();
  }

  async function archiveCategory(category: LearningCategory) {
    const confirmed = window.confirm(
      `Archive "${category.name}"?\n\nExisting learning records will retain their category history.`
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("learning_categories")
      .update({
        is_active: false,
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq("id", category.id);

    if (error) {
      setErrorMessage("The category could not be archived.");
      return;
    }

    setMessage(`${category.name} archived.`);
    await loadSettingsWorkspace();
  }

  async function saveProvider() {
    if (!providerName.trim()) {
      setErrorMessage("Enter the provider name.");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const payload = {
      name: providerName.trim(),
      provider_type: providerType,
      contact_name: providerContactName.trim() || null,
      email: providerEmail.trim() || null,
      telephone: providerTelephone.trim() || null,
      website_url: providerWebsite.trim() || null,
      account_reference:
        providerAccountReference.trim() || null,
      notes: providerNotes.trim() || null,
      is_preferred: providerPreferred,
      is_active: true,
      is_archived: false,
    };

    const result =
      editingProviderId !== null
        ? await supabase
            .from("learning_providers")
            .update(payload)
            .eq("id", editingProviderId)
        : await supabase
            .from("learning_providers")
            .insert(payload);

    if (result.error) {
      console.error("Error saving provider:", result.error);
      setErrorMessage("The learning provider could not be saved.");
      setSaving(false);
      return;
    }

    resetProviderForm();

    setMessage(
      editingProviderId !== null
        ? "Learning provider updated."
        : "Learning provider created."
    );

    setSaving(false);
    await loadSettingsWorkspace();
  }

  function editProvider(provider: LearningProvider) {
    setEditingProviderId(provider.id);
    setProviderName(provider.name);
    setProviderType(provider.provider_type);
    setProviderContactName(provider.contact_name || "");
    setProviderEmail(provider.email || "");
    setProviderTelephone(provider.telephone || "");
    setProviderWebsite(provider.website_url || "");
    setProviderAccountReference(provider.account_reference || "");
    setProviderNotes(provider.notes || "");
    setProviderPreferred(provider.is_preferred);
  }

  function resetProviderForm() {
    setEditingProviderId(null);
    setProviderName("");
    setProviderType("Internal");
    setProviderContactName("");
    setProviderEmail("");
    setProviderTelephone("");
    setProviderWebsite("");
    setProviderAccountReference("");
    setProviderNotes("");
    setProviderPreferred(false);
  }

  async function toggleProvider(
    provider: LearningProvider,
    isActive: boolean
  ) {
    const { error } = await supabase
      .from("learning_providers")
      .update({
        is_active: isActive,
      })
      .eq("id", provider.id);

    if (error) {
      setErrorMessage("The learning provider could not be updated.");
      return;
    }

    setMessage(
      `${provider.name} ${isActive ? "activated" : "deactivated"}.`
    );

    await loadSettingsWorkspace();
  }

  async function archiveProvider(provider: LearningProvider) {
    const confirmed = window.confirm(
      `Archive "${provider.name}"?\n\nExisting learning and qualification records will retain their provider history.`
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("learning_providers")
      .update({
        is_active: false,
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq("id", provider.id);

    if (error) {
      setErrorMessage("The provider could not be archived.");
      return;
    }

    setMessage(`${provider.name} archived.`);
    await loadSettingsWorkspace();
  }

  async function updateRolePermission(
    permission: LearningRolePermission,
    field: keyof Omit<
      LearningRolePermission,
      "id" | "role_key" | "created_at" | "updated_at"
    >,
    value: boolean
  ) {
    const { error } = await supabase
      .from("learning_role_permissions")
      .update({
        [field]: value,
      })
      .eq("id", permission.id);

    if (error) {
      setErrorMessage("The learning permission could not be updated.");
      return;
    }

    setRolePermissions((current) =>
      current.map((item) =>
        item.id === permission.id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );

    setMessage(`${permission.role_key} permissions updated.`);
  }

  async function loadArchiveRecords() {
    setSaving(true);
    setErrorMessage("");

    const [
      modulesResult,
      pathwaysResult,
      projectsResult,
      qualificationsResult,
      providersResult,
      categoriesResult,
    ] = await Promise.all([
      supabase
        .from("learning_modules")
        .select("id, title, status, archived_at")
        .eq("is_archived", true),

      supabase
        .from("development_pathways")
        .select("id, title, status, archived_at")
        .eq("is_archived", true),

      supabase
        .from("learning_ai_projects")
        .select("id, title, status, archived_at")
        .eq("is_archived", true),

      supabase
        .from("employee_qualifications")
        .select("id, title, status, archived_at")
        .eq("is_archived", true),

      supabase
        .from("learning_providers")
        .select("id, name, archived_at")
        .eq("is_archived", true),

      supabase
        .from("learning_categories")
        .select("id, name, archived_at")
        .eq("is_archived", true),
    ]);

    const firstError =
      modulesResult.error ||
      pathwaysResult.error ||
      projectsResult.error ||
      qualificationsResult.error ||
      providersResult.error ||
      categoriesResult.error;

    if (firstError) {
      console.error("Error loading archived learning data:", firstError);
      setErrorMessage("Archived learning records could not be loaded.");
      setSaving(false);
      return;
    }

    const records: ArchiveRecord[] = [
      ...(modulesResult.data || []).map((item) => ({
        record_type: "Learning Module" as const,
        id: item.id,
        title: item.title,
        archived_at: item.archived_at,
        status: item.status,
      })),

      ...(pathwaysResult.data || []).map((item) => ({
        record_type: "Development Pathway" as const,
        id: item.id,
        title: item.title,
        archived_at: item.archived_at,
        status: item.status,
      })),

      ...(projectsResult.data || []).map((item) => ({
        record_type: "AI Studio Project" as const,
        id: item.id,
        title: item.title,
        archived_at: item.archived_at,
        status: item.status,
      })),

      ...(qualificationsResult.data || []).map((item) => ({
        record_type: "Qualification" as const,
        id: item.id,
        title: item.title,
        archived_at: item.archived_at,
        status: item.status,
      })),

      ...(providersResult.data || []).map((item) => ({
        record_type: "Provider" as const,
        id: item.id,
        title: item.name,
        archived_at: item.archived_at,
        status: "Archived",
      })),

      ...(categoriesResult.data || []).map((item) => ({
        record_type: "Category" as const,
        id: item.id,
        title: item.name,
        archived_at: item.archived_at,
        status: "Archived",
      })),
    ];

    records.sort((a, b) =>
      String(b.archived_at || "").localeCompare(
        String(a.archived_at || "")
      )
    );

    setArchiveRecords(records);
    setSaving(false);
  }

  async function restoreArchiveRecord(record: ArchiveRecord) {
    const tableAndStatus = getArchiveTable(record.record_type);

    if (!tableAndStatus) {
      setErrorMessage("This archived record cannot be restored.");
      return;
    }

    const { table, restoreStatus } = tableAndStatus;

    const payload: Record<string, unknown> = {
      is_archived: false,
      archived_at: null,
    };

    if (restoreStatus) {
      payload.status = restoreStatus;
    }

    if (
      record.record_type === "Provider" ||
      record.record_type === "Category"
    ) {
      payload.is_active = true;
    }

    const { error } = await supabase
      .from(table)
      .update(payload)
      .eq("id", record.id);

    if (error) {
      setErrorMessage("The archived record could not be restored.");
      return;
    }

    setMessage(`${record.title} restored.`);
    await loadArchiveRecords();
    await loadSettingsWorkspace();
  }

  async function exportLearningSettings() {
    const exportPayload = {
      exported_at: new Date().toISOString(),
      general: generalSettings,
      notifications: notificationSettings,
      ai_studio_defaults: aiStudioDefaults,
      certificates: certificateSettings,
      assignment_rules: assignmentRules,
      review_rules: reviewRules,
      categories,
      providers,
      role_permissions: rolePermissions,
    };

    const blob = new Blob(
      [JSON.stringify(exportPayload, null, 2)],
      {
        type: "application/json",
      }
    );

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `leo-learn-settings-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    anchor.click();

    URL.revokeObjectURL(url);

    setMessage("Leo Learn settings exported.");
  }

  async function importLearningSettings() {
    if (!importFile) {
      setErrorMessage("Choose a Leo Learn settings file.");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const content = await importFile.text();
      const parsed = JSON.parse(content) as {
        general?: typeof emptyGeneralSettings;
        notifications?: typeof emptyNotificationSettings;
        ai_studio_defaults?: typeof emptyAIStudioDefaults;
        certificates?: typeof emptyCertificateSettings;
        assignment_rules?: typeof emptyAssignmentRules;
        review_rules?: typeof emptyReviewRules;
      };

      if (parsed.general) {
        await upsertSingleton("learning_settings", parsed.general);
      }

      if (parsed.notifications) {
        await upsertSingleton(
          "learning_notification_settings",
          parsed.notifications
        );
      }

      if (parsed.ai_studio_defaults) {
        await upsertSingleton(
          "learning_ai_studio_defaults",
          parsed.ai_studio_defaults
        );
      }

      if (parsed.certificates) {
        await upsertSingleton(
          "learning_certificate_configuration",
          parsed.certificates
        );
      }

      if (parsed.assignment_rules) {
        await upsertSingleton(
          "learning_assignment_rules",
          parsed.assignment_rules
        );
      }

      if (parsed.review_rules) {
        await upsertSingleton(
          "learning_review_rules",
          parsed.review_rules
        );
      }

      setImportFile(null);
      setMessage("Leo Learn settings imported.");
      await loadSettingsWorkspace();
    } catch (error) {
      console.error("Settings import failed:", error);
      setErrorMessage(
        "The settings file could not be read. Use a valid Leo Learn JSON settings export."
      );
    }

    setSaving(false);
  }

  async function upsertSingleton(
    tableName: string,
    payload: Record<string, unknown>
  ) {
    const { data: existing } = await supabase
      .from(tableName)
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from(tableName)
        .update(payload)
        .eq("id", existing.id);

      if (error) {
        throw error;
      }

      return;
    }

    const { error } = await supabase
      .from(tableName)
      .insert(payload);

    if (error) {
      throw error;
    }
  }

  async function loadStorageOverview() {
    setSaving(true);
    setErrorMessage("");

    const buckets = [
      "learning-content",
      "learning-media",
      "learning-evidence",
      "qualification-evidence",
      "learning-ai-studio",
      "learning-settings",
    ];

    const files: StorageFile[] = [];

    for (const bucket of buckets) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list("", {
          limit: 100,
          sortBy: {
            column: "created_at",
            order: "desc",
          },
        });

      if (error) {
        continue;
      }

      for (const item of data || []) {
        files.push({
          bucket,
          name: item.name,
          size:
            typeof item.metadata?.size === "number"
              ? item.metadata.size
              : null,
          created_at: item.created_at || null,
        });
      }
    }

    setStorageFiles(files);
    setSaving(false);
  }

  const filteredArchiveRecords = useMemo(() => {
    const search = archiveSearch.trim().toLowerCase();

    return archiveRecords.filter((record) => {
      const matchesType =
        archiveFilter === "All" ||
        record.record_type === archiveFilter;

      const matchesSearch =
        !search ||
        record.title.toLowerCase().includes(search) ||
        record.record_type.toLowerCase().includes(search);

      return matchesType && matchesSearch;
    });
  }, [archiveRecords, archiveFilter, archiveSearch]);

  const totalStorageBytes = useMemo(
    () =>
      storageFiles.reduce(
        (total, item) => total + (item.size || 0),
        0
      ),
    [storageFiles]
  );

  const categoryCount = categories.length;
  const activeProviderCount = providers.filter(
    (provider) => provider.is_active
  ).length;

  const permissionFields: Array<{
    key: keyof Omit<
      LearningRolePermission,
      "id" | "role_key" | "created_at" | "updated_at"
    >;
    label: string;
  }> = [
    {
      key: "can_view_leo_learn",
      label: "Open Leo Learn",
    },
    {
      key: "can_view_team_learning",
      label: "View team learning",
    },
    {
      key: "can_view_all_learning",
      label: "View all learning",
    },
    {
      key: "can_create_learning",
      label: "Create learning",
    },
    {
      key: "can_edit_learning",
      label: "Edit learning",
    },
    {
      key: "can_publish_learning",
      label: "Publish learning",
    },
    {
      key: "can_archive_learning",
      label: "Archive learning",
    },
    {
      key: "can_restore_learning",
      label: "Restore learning",
    },
    {
      key: "can_assign_learning",
      label: "Assign learning",
    },
    {
      key: "can_assign_to_all_employees",
      label: "Assign organisation-wide",
    },
    {
      key: "can_assign_to_team",
      label: "Assign to team",
    },
    {
      key: "can_create_pathways",
      label: "Create pathways",
    },
    {
      key: "can_manage_qualifications",
      label: "Manage qualifications",
    },
    {
      key: "can_verify_qualifications",
      label: "Verify qualifications",
    },
    {
      key: "can_issue_certificates",
      label: "Issue certificates",
    },
    {
      key: "can_use_ai_studio",
      label: "Use AI Studio",
    },
    {
      key: "can_manage_ai_studio",
      label: "Manage AI Studio",
    },
    {
      key: "can_complete_professional_reviews",
      label: "Complete professional reviews",
    },
    {
      key: "can_manage_categories",
      label: "Manage categories",
    },
    {
      key: "can_manage_providers",
      label: "Manage providers",
    },
    {
      key: "can_manage_settings",
      label: "Manage settings",
    },
    {
      key: "can_export_data",
      label: "Export data",
    },
    {
      key: "can_import_data",
      label: "Import data",
    },
  ];
    if (loading) {
    return (
      <div style={emptyStateStyle}>
        Loading Leo Learn settings...
      </div>
    );
  }

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <div style={eyebrowStyle}>LEO LEARN</div>

          <h2 style={pageTitleStyle}>
            Settings
          </h2>

          <p style={pageDescriptionStyle}>
            Control organisation-wide learning defaults,
            notifications, providers, certificates, permissions,
            reviews, assignments and retained learning data.
          </p>
        </div>

        <div style={headerSummaryStyle}>
          <div style={headerSummaryValueStyle}>
            {categoryCount}
          </div>

          <div style={headerSummaryLabelStyle}>
            Categories
          </div>

          <div style={headerSummaryDividerStyle} />

          <div style={headerSummaryValueStyle}>
            {activeProviderCount}
          </div>

          <div style={headerSummaryLabelStyle}>
            Active Providers
          </div>
        </div>
      </div>

      <div style={tabNavigationStyle}>
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setMessage("");
              setErrorMessage("");

              if (tab === "Archive") {
                void loadArchiveRecords();
              }

              if (tab === "Data & Storage") {
                void loadStorageOverview();
              }
            }}
            style={
              activeTab === tab
                ? activeTabButtonStyle
                : tabButtonStyle
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {errorMessage && (
        <div style={errorStyle}>
          {errorMessage}
        </div>
      )}

      {message && (
        <div style={messageStyle}>
          {message}
        </div>
      )}

      {activeTab === "General" && (
        <div>
          <SectionHeading
            title="General"
            description="Set the organisation’s default learning behaviour and common values used throughout Leo Learn."
          />

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Learning year and working pattern
            </h3>

            <div style={formGridStyle}>
              <FormField label="Learning year start month">
                <select
                  value={generalSettings.learning_year_start_month}
                  onChange={(event) =>
                    setGeneralSettings((current) => ({
                      ...current,
                      learning_year_start_month: Number(
                        event.target.value
                      ),
                    }))
                  }
                  style={inputStyle}
                >
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((month, index) => (
                    <option
                      key={month}
                      value={index + 1}
                    >
                      {month}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Learning year start day">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={generalSettings.learning_year_start_day}
                  onChange={(event) =>
                    setGeneralSettings((current) => ({
                      ...current,
                      learning_year_start_day: Number(
                        event.target.value
                      ),
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>

            <FormField label="Time zone">
              <input
                value={generalSettings.timezone}
                onChange={(event) =>
                  setGeneralSettings((current) => ({
                    ...current,
                    timezone: event.target.value,
                  }))
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Working days">
              <div style={checkboxGridStyle}>
                {weekdays.map((day) => (
                  <CheckboxField
                    key={day}
                    label={day}
                    description="Count this as a normal organisation working day."
                    checked={generalSettings.working_days.includes(
                      day
                    )}
                    onChange={(checked) =>
                      setGeneralSettings((current) => ({
                        ...current,
                        working_days: checked
                          ? [
                              ...current.working_days,
                              day,
                            ]
                          : current.working_days.filter(
                              (item) => item !== day
                            ),
                      }))
                    }
                  />
                ))}
              </div>
            </FormField>
          </div>

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Learning defaults
            </h3>

            <div style={formGridStyle}>
              <FormField label="Default learning type">
                <select
                  value={generalSettings.default_learning_type}
                  onChange={(event) =>
                    setGeneralSettings((current) => ({
                      ...current,
                      default_learning_type:
                        event.target.value,
                    }))
                  }
                  style={inputStyle}
                >
                  {learningTypes.map((type) => (
                    <option key={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Default delivery method">
                <select
                  value={
                    generalSettings.default_delivery_method
                  }
                  onChange={(event) =>
                    setGeneralSettings((current) => ({
                      ...current,
                      default_delivery_method:
                        event.target.value,
                    }))
                  }
                  style={inputStyle}
                >
                  {deliveryMethods.map((method) => (
                    <option key={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div style={formGridStyle}>
              <FormField label="Default duration minutes">
                <input
                  type="number"
                  min="0"
                  value={
                    generalSettings.default_duration_minutes ??
                    ""
                  }
                  onChange={(event) =>
                    setGeneralSettings((current) => ({
                      ...current,
                      default_duration_minutes:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Default assignment due days">
                <input
                  type="number"
                  min="1"
                  value={
                    generalSettings.default_assignment_due_days
                  }
                  onChange={(event) =>
                    setGeneralSettings((current) => ({
                      ...current,
                      default_assignment_due_days: Number(
                        event.target.value
                      ),
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div style={formGridStyle}>
              <FormField label="Default review frequency months">
                <input
                  type="number"
                  min="1"
                  value={
                    generalSettings.default_review_frequency_months
                  }
                  onChange={(event) =>
                    setGeneralSettings((current) => ({
                      ...current,
                      default_review_frequency_months: Number(
                        event.target.value
                      ),
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Default certificate reminder days">
                <input
                  type="number"
                  min="1"
                  value={
                    generalSettings.default_certificate_reminder_days
                  }
                  onChange={(event) =>
                    setGeneralSettings((current) => ({
                      ...current,
                      default_certificate_reminder_days: Number(
                        event.target.value
                      ),
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Assignment eligible by default"
                description="New learning may be assigned unless changed in the builder."
                checked={
                  generalSettings.default_assignment_eligible
                }
                onChange={(checked) =>
                  setGeneralSettings((current) => ({
                    ...current,
                    default_assignment_eligible: checked,
                  }))
                }
              />

              <CheckboxField
                label="Certificate available by default"
                description="New learning may issue a certificate unless changed."
                checked={
                  generalSettings.default_certificate_available
                }
                onChange={(checked) =>
                  setGeneralSettings((current) => ({
                    ...current,
                    default_certificate_available: checked,
                  }))
                }
              />

              <CheckboxField
                label="Assessment required by default"
                description="New learning requires an assessment unless changed."
                checked={
                  generalSettings.default_assessment_required
                }
                onChange={(checked) =>
                  setGeneralSettings((current) => ({
                    ...current,
                    default_assessment_required: checked,
                  }))
                }
              />

              <CheckboxField
                label="Manager validation by default"
                description="New learning requires manager validation unless changed."
                checked={
                  generalSettings
                    .default_manager_validation_required
                }
                onChange={(checked) =>
                  setGeneralSettings((current) => ({
                    ...current,
                    default_manager_validation_required:
                      checked,
                  }))
                }
              />
            </div>
          </div>

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Access behaviour
            </h3>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Employee self-enrolment"
                description="Employees may enrol themselves onto learning marked as available."
                checked={
                  generalSettings
                    .employee_self_enrolment_enabled
                }
                onChange={(checked) =>
                  setGeneralSettings((current) => ({
                    ...current,
                    employee_self_enrolment_enabled: checked,
                  }))
                }
              />

              <CheckboxField
                label="Manager assignment"
                description="Managers may assign approved learning to their own teams."
                checked={
                  generalSettings.manager_assignment_enabled
                }
                onChange={(checked) =>
                  setGeneralSettings((current) => ({
                    ...current,
                    manager_assignment_enabled: checked,
                  }))
                }
              />

              <CheckboxField
                label="Manager team visibility"
                description="Managers may view learning records for employees who report to them."
                checked={
                  generalSettings
                    .manager_team_visibility_enabled
                }
                onChange={(checked) =>
                  setGeneralSettings((current) => ({
                    ...current,
                    manager_team_visibility_enabled: checked,
                  }))
                }
              />
            </div>
          </div>

          <div style={formActionsStyle}>
            <button
              type="button"
              onClick={() =>
                void saveGeneralSettings()
              }
              disabled={saving}
              style={primaryButtonStyle}
            >
              {saving
                ? "Saving..."
                : "Save General Settings"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "Notifications" && (
        <div>
          <SectionHeading
            title="Notifications"
            description="Control assignment, renewal, review, pathway and manager-validation reminders."
          />

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Assignment notifications
            </h3>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Notify employee when assigned"
                description="Send the employee a notification when learning is assigned."
                checked={
                  notificationSettings
                    .assignment_created_employee
                }
                onChange={(checked) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    assignment_created_employee: checked,
                  }))
                }
              />

              <CheckboxField
                label="Notify manager when assigned"
                description="Notify the employee’s manager when learning is assigned."
                checked={
                  notificationSettings
                    .assignment_created_manager
                }
                onChange={(checked) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    assignment_created_manager: checked,
                  }))
                }
              />

              <CheckboxField
                label="Assignment due reminders"
                description="Send reminders before an assignment reaches its due date."
                checked={
                  notificationSettings.assignment_due_enabled
                }
                onChange={(checked) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    assignment_due_enabled: checked,
                  }))
                }
              />

              <CheckboxField
                label="Overdue reminder to employee"
                description="Continue reminding the employee after learning becomes overdue."
                checked={
                  notificationSettings
                    .assignment_overdue_employee
                }
                onChange={(checked) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    assignment_overdue_employee: checked,
                  }))
                }
              />

              <CheckboxField
                label="Overdue reminder to manager"
                description="Notify the employee’s manager when learning becomes overdue."
                checked={
                  notificationSettings
                    .assignment_overdue_manager
                }
                onChange={(checked) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    assignment_overdue_manager: checked,
                  }))
                }
              />

              <CheckboxField
                label="Overdue reminder to Senior"
                description="Notify Senior users when learning remains overdue."
                checked={
                  notificationSettings
                    .assignment_overdue_senior
                }
                onChange={(checked) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    assignment_overdue_senior: checked,
                  }))
                }
              />
            </div>

            <NumberListEditor
              label="Assignment reminder days before due date"
              values={
                notificationSettings.assignment_due_days_before
              }
              onChange={(values) =>
                setNotificationSettings((current) => ({
                  ...current,
                  assignment_due_days_before: values,
                }))
              }
            />
          </div>

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Renewal and review reminders
            </h3>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Certificate expiry reminders"
                description="Send reminders before issued certificates expire."
                checked={
                  notificationSettings
                    .certificate_expiry_enabled
                }
                onChange={(checked) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    certificate_expiry_enabled: checked,
                  }))
                }
              />

              <CheckboxField
                label="Qualification renewal reminders"
                description="Send reminders for qualifications and credentials requiring renewal."
                checked={
                  notificationSettings
                    .qualification_renewal_enabled
                }
                onChange={(checked) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    qualification_renewal_enabled: checked,
                  }))
                }
              />

              <CheckboxField
                label="Learning review reminders"
                description="Notify responsible users when learning is due for review."
                checked={
                  notificationSettings
                    .learning_review_enabled
                }
                onChange={(checked) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    learning_review_enabled: checked,
                  }))
                }
              />

              <CheckboxField
                label="Pathway reminders"
                description="Remind employees and managers about pathway steps and milestones."
                checked={
                  notificationSettings
                    .pathway_reminders_enabled
                }
                onChange={(checked) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    pathway_reminders_enabled: checked,
                  }))
                }
              />

              <CheckboxField
                label="Manager validation reminders"
                description="Remind managers when completion evidence awaits validation."
                checked={
                  notificationSettings
                    .manager_validation_reminders_enabled
                }
                onChange={(checked) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    manager_validation_reminders_enabled:
                      checked,
                  }))
                }
              />
            </div>

            <NumberListEditor
              label="Certificate reminder days before expiry"
              values={
                notificationSettings
                  .certificate_expiry_days_before
              }
              onChange={(values) =>
                setNotificationSettings((current) => ({
                  ...current,
                  certificate_expiry_days_before: values,
                }))
              }
            />
          </div>

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Learning digest
            </h3>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Enable digest"
                description="Send a consolidated learning summary instead of separate administrative updates."
                checked={notificationSettings.digest_enabled}
                onChange={(checked) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    digest_enabled: checked,
                  }))
                }
              />
            </div>

            <div style={formGridStyle}>
              <FormField label="Digest frequency">
                <select
                  value={
                    notificationSettings.digest_frequency
                  }
                  onChange={(event) =>
                    setNotificationSettings((current) => ({
                      ...current,
                      digest_frequency: event.target.value,
                    }))
                  }
                  disabled={!notificationSettings.digest_enabled}
                  style={inputStyle}
                >
                  {digestFrequencies.map((frequency) => (
                    <option key={frequency}>
                      {frequency}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Digest day">
                <select
                  value={notificationSettings.digest_day}
                  onChange={(event) =>
                    setNotificationSettings((current) => ({
                      ...current,
                      digest_day: event.target.value,
                    }))
                  }
                  disabled={!notificationSettings.digest_enabled}
                  style={inputStyle}
                >
                  {weekdays.map((day) => (
                    <option key={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Digest recipient roles">
              <div style={checkboxGridStyle}>
                {platformRoles.map((role) => (
                  <CheckboxField
                    key={role}
                    label={role}
                    description={`Include ${role} users in the learning digest.`}
                    checked={notificationSettings.digest_recipient_roles.includes(
                      role
                    )}
                    onChange={(checked) =>
                      setNotificationSettings((current) => ({
                        ...current,
                        digest_recipient_roles: checked
                          ? [
                              ...current.digest_recipient_roles,
                              role,
                            ]
                          : current.digest_recipient_roles.filter(
                              (item) => item !== role
                            ),
                      }))
                    }
                  />
                ))}
              </div>
            </FormField>
          </div>

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Quiet hours
            </h3>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Enable quiet hours"
                description="Hold non-urgent notifications during the selected period."
                checked={
                  notificationSettings.quiet_hours_enabled
                }
                onChange={(checked) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    quiet_hours_enabled: checked,
                  }))
                }
              />
            </div>

            <div style={formGridStyle}>
              <FormField label="Quiet hours start">
                <input
                  type="time"
                  value={
                    notificationSettings.quiet_hours_start || ""
                  }
                  onChange={(event) =>
                    setNotificationSettings((current) => ({
                      ...current,
                      quiet_hours_start:
                        event.target.value || null,
                    }))
                  }
                  disabled={
                    !notificationSettings.quiet_hours_enabled
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Quiet hours end">
                <input
                  type="time"
                  value={
                    notificationSettings.quiet_hours_end || ""
                  }
                  onChange={(event) =>
                    setNotificationSettings((current) => ({
                      ...current,
                      quiet_hours_end:
                        event.target.value || null,
                    }))
                  }
                  disabled={
                    !notificationSettings.quiet_hours_enabled
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>
          </div>

          <div style={formActionsStyle}>
            <button
              type="button"
              onClick={() =>
                void saveNotificationSettings()
              }
              disabled={saving}
              style={primaryButtonStyle}
            >
              {saving
                ? "Saving..."
                : "Save Notification Settings"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "Categories" && (
        <div>
          <SectionHeading
            title="Categories"
            description="Create and manage the organisation’s learning categories."
          />

          <div style={twoColumnWorkspaceStyle}>
            <div style={formPanelStyle}>
              <h3 style={formTitleStyle}>
                {editingCategoryId !== null
                  ? "Edit Category"
                  : "Create Category"}
              </h3>

              <FormField label="Category name">
                <input
                  value={categoryName}
                  onChange={(event) =>
                    setCategoryName(event.target.value)
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Description">
                <textarea
                  value={categoryDescription}
                  onChange={(event) =>
                    setCategoryDescription(
                      event.target.value
                    )
                  }
                  style={textareaStyle}
                />
              </FormField>

              <FormField label="Colour reference">
                <input
                  value={categoryColourReference}
                  onChange={(event) =>
                    setCategoryColourReference(
                      event.target.value
                    )
                  }
                  placeholder="Optional reference only"
                  style={inputStyle}
                />
              </FormField>

              <div style={formActionsStyle}>
                {editingCategoryId !== null && (
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    style={secondaryButtonStyle}
                  >
                    Cancel Edit
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    void saveCategory()
                  }
                  disabled={saving}
                  style={primaryButtonStyle}
                >
                  {saving
                    ? "Saving..."
                    : editingCategoryId !== null
                      ? "Update Category"
                      : "Create Category"}
                </button>
              </div>
            </div>

            <div>
              {categories.length === 0 ? (
                <div style={emptyStateStyle}>
                  No learning categories have been created.
                </div>
              ) : (
                <div style={listStyle}>
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      style={standardCardStyle}
                    >
                      <div style={cardHeaderStyle}>
                        <div>
                          <div style={eyebrowStyle}>
                            Category
                          </div>

                          <h4 style={cardTitleStyle}>
                            {category.name}
                          </h4>
                        </div>

                        <span style={secondaryBadgeStyle}>
                          {category.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>

                      {category.description && (
                        <p style={cardDescriptionStyle}>
                          {category.description}
                        </p>
                      )}

                      <div style={cardActionsStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            editCategory(category)
                          }
                          style={secondaryButtonStyle}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void toggleCategory(
                              category,
                              !category.is_active
                            )
                          }
                          style={secondaryButtonStyle}
                        >
                          {category.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void archiveCategory(category)
                          }
                          style={archiveButtonStyle}
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Providers" && (
        <div>
          <SectionHeading
            title="Providers"
            description="Maintain internal, external and professional learning providers used across Leo Learn."
          />

          <div style={twoColumnWorkspaceStyle}>
            <div style={formPanelStyle}>
              <h3 style={formTitleStyle}>
                {editingProviderId !== null
                  ? "Edit Provider"
                  : "Create Provider"}
              </h3>

              <div style={formGridStyle}>
                <FormField label="Provider name">
                  <input
                    value={providerName}
                    onChange={(event) =>
                      setProviderName(event.target.value)
                    }
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="Provider type">
                  <select
                    value={providerType}
                    onChange={(event) =>
                      setProviderType(event.target.value)
                    }
                    style={inputStyle}
                  >
                    {providerTypes.map((type) => (
                      <option key={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div style={formGridStyle}>
                <FormField label="Contact name">
                  <input
                    value={providerContactName}
                    onChange={(event) =>
                      setProviderContactName(
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="Email">
                  <input
                    type="email"
                    value={providerEmail}
                    onChange={(event) =>
                      setProviderEmail(event.target.value)
                    }
                    style={inputStyle}
                  />
                </FormField>
              </div>

              <div style={formGridStyle}>
                <FormField label="Telephone">
                  <input
                    value={providerTelephone}
                    onChange={(event) =>
                      setProviderTelephone(
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="Website">
                  <input
                    type="url"
                    value={providerWebsite}
                    onChange={(event) =>
                      setProviderWebsite(
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </FormField>
              </div>

              <FormField label="Account reference">
                <input
                  value={providerAccountReference}
                  onChange={(event) =>
                    setProviderAccountReference(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Notes">
                <textarea
                  value={providerNotes}
                  onChange={(event) =>
                    setProviderNotes(event.target.value)
                  }
                  style={textareaStyle}
                />
              </FormField>

              <div style={optionGridStyle}>
                <CheckboxField
                  label="Preferred provider"
                  description="Show this provider first when users select a learning provider."
                  checked={providerPreferred}
                  onChange={setProviderPreferred}
                />
              </div>

              <div style={formActionsStyle}>
                {editingProviderId !== null && (
                  <button
                    type="button"
                    onClick={resetProviderForm}
                    style={secondaryButtonStyle}
                  >
                    Cancel Edit
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    void saveProvider()
                  }
                  disabled={saving}
                  style={primaryButtonStyle}
                >
                  {saving
                    ? "Saving..."
                    : editingProviderId !== null
                      ? "Update Provider"
                      : "Create Provider"}
                </button>
              </div>
            </div>

            <div>
              {providers.length === 0 ? (
                <div style={emptyStateStyle}>
                  No learning providers have been created.
                </div>
              ) : (
                <div style={listStyle}>
                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      style={standardCardStyle}
                    >
                      <div style={cardHeaderStyle}>
                        <div>
                          <div style={eyebrowStyle}>
                            {provider.provider_type}
                          </div>

                          <h4 style={cardTitleStyle}>
                            {provider.name}
                          </h4>
                        </div>

                        <div style={badgeRowStyle}>
                          {provider.is_preferred && (
                            <span style={primaryBadgeStyle}>
                              Preferred
                            </span>
                          )}

                          <span style={secondaryBadgeStyle}>
                            {provider.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <div
                        style={
                          assignmentDetailGridStyle
                        }
                      >
                        <DetailItem
                          label="Contact"
                          value={
                            provider.contact_name ||
                            "Not recorded"
                          }
                        />

                        <DetailItem
                          label="Email"
                          value={
                            provider.email || "Not recorded"
                          }
                        />

                        <DetailItem
                          label="Account"
                          value={
                            provider.account_reference ||
                            "Not recorded"
                          }
                        />
                      </div>

                      {provider.notes && (
                        <p style={cardDescriptionStyle}>
                          {provider.notes}
                        </p>
                      )}

                      <div style={cardActionsStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            editProvider(provider)
                          }
                          style={secondaryButtonStyle}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void toggleProvider(
                              provider,
                              !provider.is_active
                            )
                          }
                          style={secondaryButtonStyle}
                        >
                          {provider.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void archiveProvider(provider)
                          }
                          style={archiveButtonStyle}
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "AI Studio Defaults" && (
        <div>
          <SectionHeading
            title="AI Studio Defaults"
            description="Set the default professional standards and controls used when new AI Studio projects are created."
          />

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Content defaults
            </h3>

            <div style={formGridStyle}>
              <FormField label="Default tone">
                <select
                  value={aiStudioDefaults.default_tone}
                  onChange={(event) =>
                    setAIStudioDefaults((current) => ({
                      ...current,
                      default_tone: event.target.value,
                    }))
                  }
                  style={inputStyle}
                >
                  {tones.map((tone) => (
                    <option key={tone}>
                      {tone}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Default reading level">
                <select
                  value={
                    aiStudioDefaults.default_reading_level
                  }
                  onChange={(event) =>
                    setAIStudioDefaults((current) => ({
                      ...current,
                      default_reading_level:
                        event.target.value,
                    }))
                  }
                  style={inputStyle}
                >
                  {readingLevels.map((level) => (
                    <option key={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div style={formGridStyle}>
              <FormField label="Default language">
                <input
                  value={
                    aiStudioDefaults.default_language_code
                  }
                  onChange={(event) =>
                    setAIStudioDefaults((current) => ({
                      ...current,
                      default_language_code:
                        event.target.value,
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Default audience">
                <input
                  value={
                    aiStudioDefaults.default_audience || ""
                  }
                  onChange={(event) =>
                    setAIStudioDefaults((current) => ({
                      ...current,
                      default_audience:
                        event.target.value || null,
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>

            <FormField label="Default output format">
              <select
                value={
                  aiStudioDefaults.default_output_format
                }
                onChange={(event) =>
                  setAIStudioDefaults((current) => ({
                    ...current,
                    default_output_format:
                      event.target.value,
                  }))
                }
                style={inputStyle}
              >
                {outputFormats.map((format) => (
                  <option key={format}>
                    {format}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Professional review defaults
            </h3>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Employment law review"
                description="Select employment-law review by default for new projects."
                checked={
                  aiStudioDefaults
                    .employment_law_review_default
                }
                onChange={(checked) =>
                  setAIStudioDefaults((current) => ({
                    ...current,
                    employment_law_review_default: checked,
                  }))
                }
              />

              <CheckboxField
                label="Equality review"
                description="Select equality and bias review by default."
                checked={
                  aiStudioDefaults.equality_review_default
                }
                onChange={(checked) =>
                  setAIStudioDefaults((current) => ({
                    ...current,
                    equality_review_default: checked,
                  }))
                }
              />

              <CheckboxField
                label="Accessibility review"
                description="Select accessibility and readability review by default."
                checked={
                  aiStudioDefaults
                    .accessibility_review_default
                }
                onChange={(checked) =>
                  setAIStudioDefaults((current) => ({
                    ...current,
                    accessibility_review_default: checked,
                  }))
                }
              />

              <CheckboxField
                label="Manager review"
                description="Require manager or administrator review by default."
                checked={
                  aiStudioDefaults.manager_review_default
                }
                onChange={(checked) =>
                  setAIStudioDefaults((current) => ({
                    ...current,
                    manager_review_default: checked,
                  }))
                }
              />
            </div>
          </div>

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Output controls
            </h3>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Require source citations"
                description="Require citation or source attribution where appropriate."
                checked={
                  aiStudioDefaults.source_citation_required
                }
                onChange={(checked) =>
                  setAIStudioDefaults((current) => ({
                    ...current,
                    source_citation_required: checked,
                  }))
                }
              />

              <CheckboxField
                label="Require plain English"
                description="Ask Leo to favour clear, accessible language."
                checked={
                  aiStudioDefaults.plain_english_required
                }
                onChange={(checked) =>
                  setAIStudioDefaults((current) => ({
                    ...current,
                    plain_english_required: checked,
                  }))
                }
              />

              <CheckboxField
                label="Use organisation context"
                description="Allow AI Studio to use approved Foundations and organisation knowledge."
                checked={
                  aiStudioDefaults
                    .organisation_context_enabled
                }
                onChange={(checked) =>
                  setAIStudioDefaults((current) => ({
                    ...current,
                    organisation_context_enabled: checked,
                  }))
                }
              />

              <CheckboxField
                label="Auto-save outputs"
                description="Automatically preserve each completed AI output."
                checked={
                  aiStudioDefaults.auto_save_outputs
                }
                onChange={(checked) =>
                  setAIStudioDefaults((current) => ({
                    ...current,
                    auto_save_outputs: checked,
                  }))
                }
              />

              <CheckboxField
                label="Create a version on revision"
                description="Preserve a new version instead of overwriting previous content."
                checked={
                  aiStudioDefaults
                    .auto_create_version_on_revision
                }
                onChange={(checked) =>
                  setAIStudioDefaults((current) => ({
                    ...current,
                    auto_create_version_on_revision:
                      checked,
                  }))
                }
              />

              <CheckboxField
                label="Approval required before publish"
                description="Prevent unapproved AI Studio outputs from being published."
                checked={
                  aiStudioDefaults
                    .require_approval_before_publish
                }
                onChange={(checked) =>
                  setAIStudioDefaults((current) => ({
                    ...current,
                    require_approval_before_publish:
                      checked,
                  }))
                }
              />
            </div>
          </div>

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Permitted roles
            </h3>

            <div style={checkboxGridStyle}>
              {platformRoles.map((role) => (
                <CheckboxField
                  key={role}
                  label={role}
                  description={`Allow ${role} users to access AI Studio.`}
                  checked={aiStudioDefaults.permitted_roles.includes(
                    role
                  )}
                  onChange={(checked) =>
                    setAIStudioDefaults((current) => ({
                      ...current,
                      permitted_roles: checked
                        ? [...current.permitted_roles, role]
                        : current.permitted_roles.filter(
                            (item) => item !== role
                          ),
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <div style={formActionsStyle}>
            <button
              type="button"
              onClick={() =>
                void saveAIStudioDefaults()
              }
              disabled={saving}
              style={primaryButtonStyle}
            >
              {saving
                ? "Saving..."
                : "Save AI Studio Defaults"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "Certificates" && (
        <div>
          <SectionHeading
            title="Certificates"
            description="Set certificate numbering, content, renewal and verification defaults."
          />

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Certificate numbering
            </h3>

            <div style={formGridStyle}>
              <FormField label="Certificate number prefix">
                <input
                  value={
                    certificateSettings
                      .certificate_number_prefix
                  }
                  onChange={(event) =>
                    setCertificateSettings((current) => ({
                      ...current,
                      certificate_number_prefix:
                        event.target.value,
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Sequence starts at">
                <input
                  type="number"
                  min="1"
                  value={
                    certificateSettings
                      .certificate_number_sequence_start
                  }
                  onChange={(event) =>
                    setCertificateSettings((current) => ({
                      ...current,
                      certificate_number_sequence_start:
                        Number(event.target.value),
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>
          </div>

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Certificate content
            </h3>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Include employee number"
                description="Show the employee reference on issued certificates."
                checked={
                  certificateSettings.include_employee_number
                }
                onChange={(checked) =>
                  setCertificateSettings((current) => ({
                    ...current,
                    include_employee_number: checked,
                  }))
                }
              />

              <CheckboxField
                label="Include completion date"
                description="Show when the learning was completed."
                checked={
                  certificateSettings.include_completion_date
                }
                onChange={(checked) =>
                  setCertificateSettings((current) => ({
                    ...current,
                    include_completion_date: checked,
                  }))
                }
              />

              <CheckboxField
                label="Include expiry date"
                description="Show the certificate expiry date where one applies."
                checked={
                  certificateSettings.include_expiry_date
                }
                onChange={(checked) =>
                  setCertificateSettings((current) => ({
                    ...current,
                    include_expiry_date: checked,
                  }))
                }
              />

              <CheckboxField
                label="Include assessment score"
                description="Show the achieved assessment score."
                checked={
                  certificateSettings.include_assessment_score
                }
                onChange={(checked) =>
                  setCertificateSettings((current) => ({
                    ...current,
                    include_assessment_score: checked,
                  }))
                }
              />

              <CheckboxField
                label="Include provider"
                description="Show the learning provider or issuing body."
                checked={certificateSettings.include_provider}
                onChange={(checked) =>
                  setCertificateSettings((current) => ({
                    ...current,
                    include_provider: checked,
                  }))
                }
              />
            </div>
          </div>

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Validity and renewal
            </h3>

            <div style={formGridStyle}>
              <FormField label="Default validity months">
                <input
                  type="number"
                  min="1"
                  value={
                    certificateSettings
                      .default_validity_months ?? ""
                  }
                  onChange={(event) =>
                    setCertificateSettings((current) => ({
                      ...current,
                      default_validity_months:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Renewal reminder days">
                <input
                  type="number"
                  min="1"
                  value={
                    certificateSettings
                      .default_renewal_reminder_days
                  }
                  onChange={(event) =>
                    setCertificateSettings((current) => ({
                      ...current,
                      default_renewal_reminder_days:
                        Number(event.target.value),
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Renewal required by default"
                description="New certificate-enabled learning requires renewal unless changed."
                checked={
                  certificateSettings
                    .default_renewal_required
                }
                onChange={(checked) =>
                  setCertificateSettings((current) => ({
                    ...current,
                    default_renewal_required: checked,
                  }))
                }
              />
            </div>
          </div>

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Signatory and branding
            </h3>

            <div style={formGridStyle}>
              <FormField label="Signatory name">
                <input
                  value={
                    certificateSettings.signatory_name || ""
                  }
                  onChange={(event) =>
                    setCertificateSettings((current) => ({
                      ...current,
                      signatory_name:
                        event.target.value || null,
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Signatory title">
                <input
                  value={
                    certificateSettings.signatory_title || ""
                  }
                  onChange={(event) =>
                    setCertificateSettings((current) => ({
                      ...current,
                      signatory_title:
                        event.target.value || null,
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div style={formGridStyle}>
              <FormField label="Digital signature">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setSignatureFile(
                      event.target.files?.[0] || null
                    )
                  }
                />
              </FormField>

              <FormField label="Organisation logo">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setLogoFile(
                      event.target.files?.[0] || null
                    )
                  }
                />
              </FormField>
            </div>
          </div>

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Verification
            </h3>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Enable certificate verification"
                description="Allow Leo to verify issued certificate records."
                checked={
                  certificateSettings.verification_enabled
                }
                onChange={(checked) =>
                  setCertificateSettings((current) => ({
                    ...current,
                    verification_enabled: checked,
                  }))
                }
              />

              <CheckboxField
                label="Public verification"
                description="Allow an approved public certificate verification route."
                checked={
                  certificateSettings
                    .public_verification_enabled
                }
                onChange={(checked) =>
                  setCertificateSettings((current) => ({
                    ...current,
                    public_verification_enabled: checked,
                  }))
                }
              />
            </div>
          </div>

          <div style={formActionsStyle}>
            <button
              type="button"
              onClick={() =>
                void saveCertificateSettings()
              }
              disabled={saving}
              style={primaryButtonStyle}
            >
              {saving
                ? "Saving..."
                : "Save Certificate Settings"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "Assignment Rules" && (
        <div>
          <SectionHeading
            title="Assignment Rules"
            description="Set due dates, escalation, reassignment, assessment and manager-validation defaults."
          />

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Assignment defaults
            </h3>

            <div style={formGridStyle}>
              <FormField label="Default due days">
                <input
                  type="number"
                  min="1"
                  value={assignmentRules.default_due_days}
                  onChange={(event) =>
                    setAssignmentRules((current) => ({
                      ...current,
                      default_due_days: Number(
                        event.target.value
                      ),
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Maximum assessment attempts">
                <input
                  type="number"
                  min="1"
                  value={
                    assignmentRules.maximum_assessment_attempts ??
                    ""
                  }
                  onChange={(event) =>
                    setAssignmentRules((current) => ({
                      ...current,
                      maximum_assessment_attempts:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Allow no due date"
                description="Allow authorised users to create assignments without a due date."
                checked={assignmentRules.allow_no_due_date}
                onChange={(checked) =>
                  setAssignmentRules((current) => ({
                    ...current,
                    allow_no_due_date: checked,
                  }))
                }
              />

              <CheckboxField
                label="Manager due-date override"
                description="Allow managers to change due dates for their team assignments."
                checked={
                  assignmentRules
                    .allow_manager_due_date_override
                }
                onChange={(checked) =>
                  setAssignmentRules((current) => ({
                    ...current,
                    allow_manager_due_date_override:
                      checked,
                  }))
                }
              />

              <CheckboxField
                label="Allow employee decline"
                description="Allow employees to decline eligible non-mandatory learning."
                checked={
                  assignmentRules.allow_employee_decline
                }
                onChange={(checked) =>
                  setAssignmentRules((current) => ({
                    ...current,
                    allow_employee_decline: checked,
                  }))
                }
              />

              <CheckboxField
                label="Decline reason required"
                description="Require a reason when an employee declines learning."
                checked={
                  assignmentRules
                    .employee_decline_reason_required
                }
                onChange={(checked) =>
                  setAssignmentRules((current) => ({
                    ...current,
                    employee_decline_reason_required:
                      checked,
                  }))
                }
              />
            </div>
          </div>

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Overdue and escalation
            </h3>

            <div style={formGridStyle}>
              <FormField label="Escalate after overdue days">
                <input
                  type="number"
                  min="1"
                  value={
                    assignmentRules.overdue_escalation_days
                  }
                  onChange={(event) =>
                    setAssignmentRules((current) => ({
                      ...current,
                      overdue_escalation_days: Number(
                        event.target.value
                      ),
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Automatically mark overdue"
                description="Change assignment status automatically after the due date."
                checked={
                  assignmentRules.automatically_mark_overdue
                }
                onChange={(checked) =>
                  setAssignmentRules((current) => ({
                    ...current,
                    automatically_mark_overdue: checked,
                  }))
                }
              />

              <CheckboxField
                label="Enable overdue escalation"
                description="Escalate unresolved overdue assignments."
                checked={
                  assignmentRules
                    .overdue_escalation_enabled
                }
                onChange={(checked) =>
                  setAssignmentRules((current) => ({
                    ...current,
                    overdue_escalation_enabled: checked,
                  }))
                }
              />
            </div>

            <FormField label="Escalation roles">
              <div style={checkboxGridStyle}>
                {platformRoles.map((role) => (
                  <CheckboxField
                    key={role}
                    label={role}
                    description={`Escalate overdue learning to ${role} users.`}
                    checked={assignmentRules.overdue_escalation_roles.includes(
                      role
                    )}
                    onChange={(checked) =>
                      setAssignmentRules((current) => ({
                        ...current,
                        overdue_escalation_roles: checked
                          ? [
                              ...current.overdue_escalation_roles,
                              role,
                            ]
                          : current.overdue_escalation_roles.filter(
                              (item) => item !== role
                            ),
                      }))
                    }
                  />
                ))}
              </div>
            </FormField>
          </div>

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Failed learning and reassignment
            </h3>

            <div style={formGridStyle}>
              <FormField label="Reassign after days">
                <input
                  type="number"
                  min="1"
                  value={
                    assignmentRules
                      .failed_learning_reassignment_days
                  }
                  onChange={(event) =>
                    setAssignmentRules((current) => ({
                      ...current,
                      failed_learning_reassignment_days:
                        Number(event.target.value),
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Automatically reassign failed learning"
                description="Create a new assignment after unsuccessful completion."
                checked={
                  assignmentRules
                    .auto_reassign_failed_learning
                }
                onChange={(checked) =>
                  setAssignmentRules((current) => ({
                    ...current,
                    auto_reassign_failed_learning: checked,
                  }))
                }
              />
            </div>
          </div>

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Manager validation and evidence
            </h3>

            <div style={formGridStyle}>
              <FormField label="Manager validation due days">
                <input
                  type="number"
                  min="1"
                  value={
                    assignmentRules
                      .manager_validation_due_days
                  }
                  onChange={(event) =>
                    setAssignmentRules((current) => ({
                      ...current,
                      manager_validation_due_days:
                        Number(event.target.value),
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Manager validation escalation"
                description="Escalate manager validation that remains incomplete."
                checked={
                  assignmentRules
                    .manager_validation_escalation_enabled
                }
                onChange={(checked) =>
                  setAssignmentRules((current) => ({
                    ...current,
                    manager_validation_escalation_enabled:
                      checked,
                  }))
                }
              />

              <CheckboxField
                label="Evidence required by default"
                description="Require completion evidence for new assignments by default."
                checked={
                  assignmentRules
                    .completion_evidence_required_by_default
                }
                onChange={(checked) =>
                  setAssignmentRules((current) => ({
                    ...current,
                    completion_evidence_required_by_default:
                      checked,
                  }))
                }
              />

              <CheckboxField
                label="Completion notes enabled"
                description="Allow employees or managers to add completion notes."
                checked={
                  assignmentRules.completion_notes_enabled
                }
                onChange={(checked) =>
                  setAssignmentRules((current) => ({
                    ...current,
                    completion_notes_enabled: checked,
                  }))
                }
              />
            </div>
          </div>

          <div style={formActionsStyle}>
            <button
              type="button"
              onClick={() =>
                void saveAssignmentRules()
              }
              disabled={saving}
              style={primaryButtonStyle}
            >
              {saving
                ? "Saving..."
                : "Save Assignment Rules"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "Review Rules" && (
        <div>
          <SectionHeading
            title="Review Rules"
            description="Set review frequency, ownership, reminders, versioning and professional-review requirements."
          />

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Review schedule
            </h3>

            <div style={formGridStyle}>
              <FormField label="Default review frequency months">
                <input
                  type="number"
                  min="1"
                  value={
                    reviewRules
                      .default_review_frequency_months
                  }
                  onChange={(event) =>
                    setReviewRules((current) => ({
                      ...current,
                      default_review_frequency_months:
                        Number(event.target.value),
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Default review owner">
                <select
                  value={reviewRules.review_owner_role}
                  onChange={(event) =>
                    setReviewRules((current) => ({
                      ...current,
                      review_owner_role:
                        event.target.value as PlatformRole,
                    }))
                  }
                  style={inputStyle}
                >
                  {platformRoles.map((role) => (
                    <option key={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <NumberListEditor
              label="Review reminder days before due date"
              values={reviewRules.review_reminder_days_before}
              onChange={(values) =>
                setReviewRules((current) => ({
                  ...current,
                  review_reminder_days_before: values,
                }))
              }
            />
          </div>

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Review controls
            </h3>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Review before publish"
                description="Require formal review before learning can be published."
                checked={
                  reviewRules.require_review_before_publish
                }
                onChange={(checked) =>
                  setReviewRules((current) => ({
                    ...current,
                    require_review_before_publish: checked,
                  }))
                }
              />

              <CheckboxField
                label="Review after material change"
                description="Require another review after a significant content change."
                checked={
                  reviewRules
                    .require_review_after_material_change
                }
                onChange={(checked) =>
                  setReviewRules((current) => ({
                    ...current,
                    require_review_after_material_change:
                      checked,
                  }))
                }
              />

              <CheckboxField
                label="Version notes required"
                description="Require a summary of changes when creating a new version."
                checked={reviewRules.require_version_notes}
                onChange={(checked) =>
                  setReviewRules((current) => ({
                    ...current,
                    require_version_notes: checked,
                  }))
                }
              />

              <CheckboxField
                label="Automatically set under review"
                description="Change learning status automatically when a formal review begins."
                checked={
                  reviewRules.automatically_set_under_review
                }
                onChange={(checked) =>
                  setReviewRules((current) => ({
                    ...current,
                    automatically_set_under_review: checked,
                  }))
                }
              />

              <CheckboxField
                label="Archive superseded versions"
                description="Archive older versions automatically after a replacement is published."
                checked={
                  reviewRules
                    .automatically_archive_superseded_versions
                }
                onChange={(checked) =>
                  setReviewRules((current) => ({
                    ...current,
                    automatically_archive_superseded_versions:
                      checked,
                  }))
                }
              />
            </div>
          </div>

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Professional review requirements
            </h3>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Legal review for compliance content"
                description="Require employment-law review for compliance-related learning."
                checked={
                  reviewRules
                    .legal_review_for_compliance_content
                }
                onChange={(checked) =>
                  setReviewRules((current) => ({
                    ...current,
                    legal_review_for_compliance_content:
                      checked,
                  }))
                }
              />

              <CheckboxField
                label="Equality review for people content"
                description="Require equality and fairness review for people-management learning."
                checked={
                  reviewRules
                    .equality_review_for_people_content
                }
                onChange={(checked) =>
                  setReviewRules((current) => ({
                    ...current,
                    equality_review_for_people_content:
                      checked,
                  }))
                }
              />

              <CheckboxField
                label="Accessibility review for digital learning"
                description="Require accessibility review for digital learning resources."
                checked={
                  reviewRules
                    .accessibility_review_for_digital_learning
                }
                onChange={(checked) =>
                  setReviewRules((current) => ({
                    ...current,
                    accessibility_review_for_digital_learning:
                      checked,
                  }))
                }
              />
            </div>
          </div>

          <div style={settingsSectionStyle}>
            <h3 style={settingsSectionTitleStyle}>
              Overdue review escalation
            </h3>

            <div style={formGridStyle}>
              <FormField label="Escalate after overdue days">
                <input
                  type="number"
                  min="1"
                  value={
                    reviewRules
                      .overdue_review_escalation_days
                  }
                  onChange={(event) =>
                    setReviewRules((current) => ({
                      ...current,
                      overdue_review_escalation_days:
                        Number(event.target.value),
                    }))
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div style={optionGridStyle}>
              <CheckboxField
                label="Enable overdue review escalation"
                description="Escalate learning that remains overdue for review."
                checked={
                  reviewRules
                    .overdue_review_escalation_enabled
                }
                onChange={(checked) =>
                  setReviewRules((current) => ({
                    ...current,
                    overdue_review_escalation_enabled:
                      checked,
                  }))
                }
              />
            </div>
          </div>

          <div style={formActionsStyle}>
            <button
              type="button"
              onClick={() =>
                void saveReviewRules()
              }
              disabled={saving}
              style={primaryButtonStyle}
            >
              {saving
                ? "Saving..."
                : "Save Review Rules"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "Archive" && (
        <div>
          <div style={sectionHeaderStyle}>
            <SectionHeading
              title="Archive"
              description="Review and restore archived learning, pathways, AI projects, qualifications, categories and providers."
            />

            <button
              type="button"
              onClick={() =>
                void loadArchiveRecords()
              }
              disabled={saving}
              style={secondaryButtonStyle}
            >
              {saving
                ? "Refreshing..."
                : "Refresh Archive"}
            </button>
          </div>

          <div style={toolbarStyle}>
            <input
              type="search"
              value={archiveSearch}
              onChange={(event) =>
                setArchiveSearch(event.target.value)
              }
              placeholder="Search archived records..."
              style={inputStyle}
            />

            <select
              value={archiveFilter}
              onChange={(event) =>
                setArchiveFilter(event.target.value)
              }
              style={inputStyle}
            >
              <option>All</option>
              <option>Learning Module</option>
              <option>Development Pathway</option>
              <option>AI Studio Project</option>
              <option>Qualification</option>
              <option>Provider</option>
              <option>Category</option>
            </select>
          </div>

          {filteredArchiveRecords.length === 0 ? (
            <div style={emptyStateStyle}>
              No archived records match the current filters.
            </div>
          ) : (
            <div style={listStyle}>
              {filteredArchiveRecords.map((record) => (
                <div
                  key={`${record.record_type}-${record.id}`}
                  style={standardCardStyle}
                >
                  <div style={cardHeaderStyle}>
                    <div>
                      <div style={eyebrowStyle}>
                        {record.record_type}
                      </div>

                      <h4 style={cardTitleStyle}>
                        {record.title}
                      </h4>
                    </div>

                    <span style={secondaryBadgeStyle}>
                      {record.status || "Archived"}
                    </span>
                  </div>

                  <div
                    style={
                      assignmentDetailGridStyle
                    }
                  >
                    <DetailItem
                      label="Archived"
                      value={
                        record.archived_at
                          ? new Date(
                              record.archived_at
                            ).toLocaleString("en-GB")
                          : "Date not recorded"
                      }
                    />
                  </div>

                  <div style={cardActionsStyle}>
                    <button
                      type="button"
                      onClick={() =>
                        void restoreArchiveRecord(record)
                      }
                      style={primaryButtonStyle}
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={noticeStyle}>
            Permanent deletion is deliberately not available here.
            Archived records preserve learning, compliance and audit
            history.
          </div>
        </div>
      )}

      {activeTab === "Data & Storage" && (
        <div>
          <SectionHeading
            title="Data & Storage"
            description="Export or import Leo Learn configuration and review available learning-storage records."
          />

          <div style={dashboardGridStyle}>
            <div style={panelStyle}>
              <h3 style={panelTitleStyle}>
                Export Settings
              </h3>

              <p style={panelDescriptionStyle}>
                Download the current Leo Learn configuration as
                a structured JSON backup.
              </p>

              <button
                type="button"
                onClick={() =>
                  void exportLearningSettings()
                }
                style={primaryButtonStyle}
              >
                Export Settings
              </button>
            </div>

            <div style={panelStyle}>
              <h3 style={panelTitleStyle}>
                Import Settings
              </h3>

              <p style={panelDescriptionStyle}>
                Restore compatible Leo Learn settings from a
                previous JSON export.
              </p>

              <input
                type="file"
                accept="application/json,.json"
                onChange={(event) =>
                  setImportFile(
                    event.target.files?.[0] || null
                  )
                }
              />

              <div style={cardActionsStyle}>
                <button
                  type="button"
                  onClick={() =>
                    void importLearningSettings()
                  }
                  disabled={saving}
                  style={secondaryButtonStyle}
                >
                  {saving
                    ? "Importing..."
                    : "Import Settings"}
                </button>
              </div>
            </div>
          </div>

          <div style={settingsSectionStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h3 style={settingsSectionTitleStyle}>
                  Storage overview
                </h3>

                <p style={panelDescriptionStyle}>
                  This overview lists accessible top-level storage
                  items across Leo Learn buckets.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadStorageOverview()
                }
                disabled={saving}
                style={secondaryButtonStyle}
              >
                {saving
                  ? "Checking..."
                  : "Refresh Storage"}
              </button>
            </div>

            <div style={summaryGridStyle}>
              <SummaryCard
                label="Visible Storage Items"
                value={String(storageFiles.length)}
              />

              <SummaryCard
                label="Visible Storage Size"
                value={formatFileSize(totalStorageBytes)}
              />

              <SummaryCard
                label="Storage Buckets"
                value={String(
                  new Set(
                    storageFiles.map((item) => item.bucket)
                  ).size
                )}
              />
            </div>

            {storageFiles.length === 0 ? (
              <div style={emptyStateStyle}>
                No accessible top-level storage records were found.
              </div>
            ) : (
              <div style={versionTableWrapStyle}>
                <table style={versionTableStyle}>
                  <thead>
                    <tr>
                      <th style={versionHeaderStyle}>
                        Bucket
                      </th>
                      <th style={versionHeaderStyle}>
                        File or Folder
                      </th>
                      <th style={versionHeaderStyle}>
                        Size
                      </th>
                      <th style={versionHeaderStyle}>
                        Created
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {storageFiles.map((file, index) => (
                      <tr
                        key={`${file.bucket}-${file.name}-${index}`}
                      >
                        <td style={versionCellStyle}>
                          {file.bucket}
                        </td>

                        <td style={versionCellStyle}>
                          {file.name}
                        </td>

                        <td style={versionCellStyle}>
                          {file.size !== null
                            ? formatFileSize(file.size)
                            : "Folder or unknown"}
                        </td>

                        <td style={versionCellStyle}>
                          {file.created_at
                            ? new Date(
                                file.created_at
                              ).toLocaleString("en-GB")
                            : "Not recorded"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "General" && (
        <PermissionsPanel
          permissions={rolePermissions}
          permissionFields={permissionFields}
          onUpdate={updateRolePermission}
        />
      )}
    </div>
  );
}

function PermissionsPanel({
  permissions,
  permissionFields,
  onUpdate,
}: {
  permissions: LearningRolePermission[];
  permissionFields: Array<{
    key: keyof Omit<
      LearningRolePermission,
      "id" | "role_key" | "created_at" | "updated_at"
    >;
    label: string;
  }>;
  onUpdate: (
    permission: LearningRolePermission,
    field: keyof Omit<
      LearningRolePermission,
      "id" | "role_key" | "created_at" | "updated_at"
    >,
    value: boolean
  ) => Promise<void>;
}) {
  return (
    <div style={permissionsSectionStyle}>
      <SectionHeading
        title="Role Permissions"
        description="Leo Learn respects the platform’s four permission levels: Owner, Senior, Manager and Employee."
      />

      {permissions.length === 0 ? (
        <div style={emptyStateStyle}>
          No learning permission records are available.
        </div>
      ) : (
        <div style={permissionTableWrapStyle}>
          <table style={permissionTableStyle}>
            <thead>
              <tr>
                <th style={permissionHeaderStyle}>
                  Permission
                </th>

                {platformRoles.map((role) => (
                  <th
                    key={role}
                    style={permissionHeaderStyle}
                  >
                    {role}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {permissionFields.map((field) => (
                <tr key={field.key}>
                  <td style={permissionLabelCellStyle}>
                    {field.label}
                  </td>

                  {platformRoles.map((role) => {
                    const permission = permissions.find(
                      (item) => item.role_key === role
                    );

                    return (
                      <td
                        key={role}
                        style={permissionCellStyle}
                      >
                        {permission ? (
                          <input
                            type="checkbox"
                            checked={Boolean(
                              permission[field.key]
                            )}
                            onChange={(event) =>
                              void onUpdate(
                                permission,
                                field.key,
                                event.target.checked
                              )
                            }
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div style={sectionHeadingStyle}>
      <h3 style={sectionHeadingTitleStyle}>
        {title}
      </h3>

      <p style={sectionHeadingDescriptionStyle}>
        {description}
      </p>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={formFieldStyle}>
      <label style={labelStyle}>
        {label}
      </label>

      {children}
    </div>
  );
}

function CheckboxField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label style={checkboxCardStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
      />

      <span>
        <span style={checkboxTitleStyle}>
          {label}
        </span>

        <span style={checkboxDescriptionStyle}>
          {description}
        </span>
      </span>
    </label>
  );
}

function NumberListEditor({
  label,
  values,
  onChange,
}: {
  label: string;
  values: number[];
  onChange: (values: number[]) => void;
}) {
  const [draftValue, setDraftValue] = useState("");

  function addValue() {
    const numericValue = Number(draftValue);

    if (
      !Number.isFinite(numericValue) ||
      numericValue < 0 ||
      values.includes(numericValue)
    ) {
      return;
    }

    onChange(
      [...values, numericValue].sort((a, b) => b - a)
    );

    setDraftValue("");
  }

  return (
    <div style={formFieldStyle}>
      <label style={labelStyle}>
        {label}
      </label>

      <div style={numberListEditorStyle}>
        <div style={numberListValuesStyle}>
          {values.length === 0 ? (
            <span style={mutedStyle}>
              No reminder days configured.
            </span>
          ) : (
            values.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  onChange(
                    values.filter((item) => item !== value)
                  )
                }
                style={numberBadgeStyle}
                title="Remove"
              >
                {value} days ×
              </button>
            ))
          )}
        </div>

        <div style={numberListAddStyle}>
          <input
            type="number"
            min="0"
            value={draftValue}
            onChange={(event) =>
              setDraftValue(event.target.value)
            }
            style={smallNumberInputStyle}
          />

          <button
            type="button"
            onClick={addValue}
            style={secondaryButtonStyle}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={summaryCardStyle}>
      <div style={summaryValueStyle}>
        {value}
      </div>

      <div style={summaryLabelStyle}>
        {label}
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div style={detailLabelStyle}>
        {label}
      </div>

      <div style={detailValueStyle}>
        {value}
      </div>
    </div>
  );
}

function getArchiveTable(
  recordType: ArchiveRecord["record_type"]
): {
  table: string;
  restoreStatus: string | null;
} | null {
  const mapping: Record<
    ArchiveRecord["record_type"],
    {
      table: string;
      restoreStatus: string | null;
    }
  > = {
    "Learning Module": {
      table: "learning_modules",
      restoreStatus: "Draft",
    },
    "Development Pathway": {
      table: "development_pathways",
      restoreStatus: "Draft",
    },
    "AI Studio Project": {
      table: "learning_ai_projects",
      restoreStatus: "Draft",
    },
    Qualification: {
      table: "employee_qualifications",
      restoreStatus: "Current",
    },
    Provider: {
      table: "learning_providers",
      restoreStatus: null,
    },
    Category: {
      table: "learning_categories",
      restoreStatus: null,
    },
  };

  return mapping[recordType] || null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(
    bytes /
    (1024 * 1024 * 1024)
  ).toFixed(2)} GB`;
}

const pageHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  marginBottom: "18px",
};

const pageTitleStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#111827",
  fontSize: "26px",
};

const pageDescriptionStyle: React.CSSProperties = {
  maxWidth: "820px",
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.55,
};

const eyebrowStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "10px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const headerSummaryStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto auto 1px auto auto",
  alignItems: "center",
  gap: "9px",
  padding: "12px 14px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "12px",
};

const headerSummaryValueStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "18px",
  fontWeight: 800,
};

const headerSummaryLabelStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "11px",
};

const headerSummaryDividerStyle: React.CSSProperties = {
  width: "1px",
  height: "24px",
  background: "#E5E7EB",
};

const tabNavigationStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const tabButtonStyle: React.CSSProperties = {
  padding: "9px 12px",
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
  fontWeight: 700,
  cursor: "pointer",
};

const activeTabButtonStyle: React.CSSProperties = {
  ...tabButtonStyle,
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "10px",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  borderRadius: "10px",
  fontWeight: 800,
  cursor: "pointer",
};

const archiveButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  fontWeight: 800,
  cursor: "pointer",
};

const sectionHeadingStyle: React.CSSProperties = {
  marginBottom: "18px",
};

const sectionHeadingTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const sectionHeadingDescriptionStyle: React.CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.55,
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
};

const settingsSectionStyle: React.CSSProperties = {
  padding: "18px",
  marginBottom: "16px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
};

const settingsSectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "16px",
};

const formPanelStyle: React.CSSProperties = {
  padding: "18px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "14px",
};

const formTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const formFieldStyle: React.CSSProperties = {
  marginTop: "14px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  background: "#FFFFFF",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  fontSize: "14px",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "95px",
  resize: "vertical",
  fontFamily: "inherit",
  lineHeight: 1.5,
};

const optionGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "10px",
  marginTop: "14px",
};

const checkboxGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "9px",
};

const checkboxCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "12px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  cursor: "pointer",
};

const checkboxTitleStyle: React.CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 800,
};

const checkboxDescriptionStyle: React.CSSProperties = {
  display: "block",
  marginTop: "3px",
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: 1.4,
};

const formActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "18px",
};

const twoColumnWorkspaceStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(320px, 0.8fr) minmax(360px, 1.2fr)",
  gap: "16px",
};

const dashboardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "14px",
  marginBottom: "16px",
};

const panelStyle: React.CSSProperties = {
  padding: "18px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "16px",
};

const panelDescriptionStyle: React.CSSProperties = {
  margin: "7px 0 14px",
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: 1.5,
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "10px",
  margin: "16px 0",
};

const summaryCardStyle: React.CSSProperties = {
  padding: "14px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "12px",
};

const summaryValueStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "22px",
  fontWeight: 800,
};

const summaryLabelStyle: React.CSSProperties = {
  marginTop: "4px",
  color: "#6B7280",
  fontSize: "12px",
};

const toolbarStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(250px, 1fr) 230px",
  gap: "10px",
  marginBottom: "16px",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "11px",
};

const standardCardStyle: React.CSSProperties = {
  padding: "15px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
};

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

const cardTitleStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#111827",
  fontSize: "15px",
};

const cardDescriptionStyle: React.CSSProperties = {
  margin: "10px 0",
  color: "#4B5563",
  fontSize: "13px",
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
};

const cardActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "9px",
  flexWrap: "wrap",
  marginTop: "14px",
};

const badgeRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "7px",
  flexWrap: "wrap",
};

const primaryBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 8px",
  background: "#F7F1FC",
  color: "#6E5084",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 800,
};

const secondaryBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 8px",
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #E5E7EB",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 700,
};

const assignmentDetailGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "12px",
  marginTop: "14px",
};

const detailLabelStyle: React.CSSProperties = {
  color: "#9CA3AF",
  fontSize: "11px",
};

const detailValueStyle: React.CSSProperties = {
  marginTop: "3px",
  color: "#374151",
  fontSize: "12px",
  fontWeight: 700,
};

const permissionsSectionStyle: React.CSSProperties = {
  marginTop: "26px",
  paddingTop: "22px",
  borderTop: "1px solid #E5E7EB",
};

const permissionTableWrapStyle: React.CSSProperties = {
  overflowX: "auto",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
};

const permissionTableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: "850px",
  borderCollapse: "collapse",
  background: "#FFFFFF",
};

const permissionHeaderStyle: React.CSSProperties = {
  padding: "11px",
  background: "#F9FAFB",
  color: "#6B7280",
  borderBottom: "1px solid #E5E7EB",
  fontSize: "11px",
  textAlign: "center",
};

const permissionLabelCellStyle: React.CSSProperties = {
  padding: "12px",
  color: "#374151",
  borderBottom: "1px solid #E5E7EB",
  fontSize: "12px",
  fontWeight: 700,
};

const permissionCellStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #E5E7EB",
  textAlign: "center",
};

const numberListEditorStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  padding: "12px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
};

const numberListValuesStyle: React.CSSProperties = {
  display: "flex",
  gap: "7px",
  flexWrap: "wrap",
};

const numberBadgeStyle: React.CSSProperties = {
  padding: "6px 9px",
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #E8DDF0",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const numberListAddStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
};

const smallNumberInputStyle: React.CSSProperties = {
  width: "90px",
  padding: "9px",
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
};

const versionTableWrapStyle: React.CSSProperties = {
  overflowX: "auto",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
};

const versionTableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: "760px",
  borderCollapse: "collapse",
  background: "#FFFFFF",
};

const versionHeaderStyle: React.CSSProperties = {
  padding: "11px",
  background: "#F9FAFB",
  color: "#6B7280",
  borderBottom: "1px solid #E5E7EB",
  fontSize: "11px",
  textAlign: "left",
};

const versionCellStyle: React.CSSProperties = {
  padding: "12px",
  color: "#374151",
  borderBottom: "1px solid #E5E7EB",
  fontSize: "12px",
};

const noticeStyle: React.CSSProperties = {
  padding: "12px",
  marginTop: "14px",
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #E8DDF0",
  borderRadius: "10px",
  fontSize: "13px",
  lineHeight: 1.5,
};

const emptyStateStyle: React.CSSProperties = {
  padding: "32px 20px",
  background: "#F9FAFB",
  color: "#6B7280",
  border: "1px dashed #D1D5DB",
  borderRadius: "13px",
  textAlign: "center",
};

const mutedStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "12px",
};

const errorStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "14px",
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
  borderRadius: "10px",
};

const messageStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "14px",
  background: "#F5FFF9",
  color: "#365C48",
  border: "1px solid #CFE8DA",
  borderRadius: "10px",
};