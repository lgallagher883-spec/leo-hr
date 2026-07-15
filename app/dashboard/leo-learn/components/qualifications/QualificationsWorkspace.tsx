"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Employee = {
  id: number;
  name: string;
  role: string | null;
  status: string | null;
};

type QualificationType = {
  id: number;
  name: string;
  category: string;
  description: string | null;
  issuing_body: string | null;
  reference_code: string | null;
  default_validity_months: number | null;
  renewal_required: boolean;
  verification_required: boolean;
  evidence_required: boolean;
  mandatory_by_default: boolean;
  regulator_name: string | null;
  source_type: string;
  is_active: boolean;
};

type EmployeeQualification = {
  id: number;
  employee_id: number;
  qualification_type_id: number | null;
  title: string;
  category: string;
  issuing_body: string | null;
  qualification_level: string | null;
  subject_or_specialism: string | null;
  registration_number: string | null;
  certificate_number: string | null;
  membership_number: string | null;
  licence_number: string | null;
  issue_date: string | null;
  valid_from: string | null;
  expiry_date: string | null;
  renewal_date: string | null;
  status: string;
  verification_status: string;
  verified_at: string | null;
  verified_by: number | null;
  verification_method: string | null;
  verification_reference: string | null;
  verification_notes: string | null;
  mandatory: boolean;
  renewal_required: boolean;
  renewal_reminder_days: number | null;
  employee_notes: string | null;
  manager_notes: string | null;
  source_type: string;
  source_reference_type: string | null;
  source_reference_id: number | null;
  created_at: string;
  updated_at: string;
};

type QualificationEvidence = {
  id: number;
  employee_qualification_id: number;
  employee_id: number;
  evidence_type: string;
  title: string;
  description: string | null;
  file_name: string | null;
  file_path: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  external_url: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  uploaded_at: string;
};

type QualificationVerification = {
  id: number;
  employee_qualification_id: number;
  employee_id: number;
  verification_date: string;
  verification_status: string;
  verification_method: string | null;
  verification_reference: string | null;
  verified_with: string | null;
  verifier_employee_id: number | null;
  verification_summary: string | null;
  concerns_or_actions: string | null;
  next_verification_date: string | null;
  created_at: string;
};

type QualificationRenewal = {
  id: number;
  employee_qualification_id: number;
  employee_id: number;
  previous_issue_date: string | null;
  previous_expiry_date: string | null;
  renewal_due_date: string | null;
  renewal_started_date: string | null;
  renewed_date: string | null;
  new_issue_date: string | null;
  new_expiry_date: string | null;
  status: string;
  renewal_method: string | null;
  provider_or_body: string | null;
  cost_amount: number | null;
  currency_code: string;
  employee_notes: string | null;
  manager_notes: string | null;
  created_at: string;
};

type QualificationRequirement = {
  id: number;
  qualification_type_id: number | null;
  requirement_title: string;
  target_role: string | null;
  target_department: string | null;
  target_location: string | null;
  employment_status: string | null;
  mandatory: boolean;
  required_before_start: boolean;
  grace_period_days: number | null;
  minimum_level: string | null;
  regulator_or_authority: string | null;
  requirement_reason: string | null;
  review_frequency_months: number | null;
  next_review_date: string | null;
  is_active: boolean;
  created_at: string;
};

type EmployeeRequirement = {
  id: number;
  qualification_requirement_id: number;
  employee_id: number;
  employee_qualification_id: number | null;
  status: string;
  required_date: string | null;
  compliance_date: string | null;
  exception_reason: string | null;
  exception_approved_by: number | null;
  exception_approved_at: string | null;
  notes: string | null;
};

type QualificationActivity = {
  id: number;
  employee_qualification_id: number | null;
  employee_id: number | null;
  qualification_requirement_id: number | null;
  activity_type: string;
  activity_summary: string;
  activity_details: Record<string, unknown> | null;
  created_at: string;
};

type WorkspaceTab =
  | "Overview"
  | "Evidence"
  | "Verification"
  | "Renewal"
  | "Requirements"
  | "Activity";

const qualificationCategories = [
  "Qualification",
  "Certificate",
  "Licence",
  "Professional Membership",
  "Training Credential",
  "Registration",
  "Accreditation",
  "Compliance Credential",
  "Other",
];

const qualificationStatuses = [
  "Pending Evidence",
  "Pending Verification",
  "Current",
  "Due for Renewal",
  "Expired",
  "Suspended",
  "Revoked",
  "Superseded",
  "Not Required",
];

const verificationStatuses = [
  "Not Required",
  "Not Verified",
  "Pending Verification",
  "Verified",
  "Verification Failed",
  "Expired Verification",
];

const evidenceTypes = [
  "Certificate",
  "Qualification Document",
  "Membership Evidence",
  "Licence",
  "Registration Evidence",
  "Transcript",
  "Verification Record",
  "Renewal Evidence",
  "External Link",
  "Other",
];

const renewalStatuses = [
  "Not Started",
  "Reminder Sent",
  "In Progress",
  "Evidence Submitted",
  "Awaiting Verification",
  "Completed",
  "Overdue",
  "Cancelled",
  "Not Required",
];

const requirementStatuses = [
  "Required",
  "Pending Evidence",
  "Pending Verification",
  "Compliant",
  "Due for Renewal",
  "Expired",
  "Exception Approved",
  "Not Applicable",
];

const verificationMethods = [
  "Original Document Checked",
  "Issuing Body Website",
  "Online Register",
  "Email Confirmation",
  "Telephone Confirmation",
  "Learning Completion",
  "Other",
];

export default function QualificationsWorkspace() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [qualificationTypes, setQualificationTypes] = useState<
    QualificationType[]
  >([]);
  const [qualifications, setQualifications] = useState<
    EmployeeQualification[]
  >([]);
  const [requirements, setRequirements] = useState<
    QualificationRequirement[]
  >([]);
  const [employeeRequirements, setEmployeeRequirements] = useState<
    EmployeeRequirement[]
  >([]);

  const [selectedQualification, setSelectedQualification] =
    useState<EmployeeQualification | null>(null);

  const [activeTab, setActiveTab] =
    useState<WorkspaceTab>("Overview");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [verificationFilter, setVerificationFilter] =
    useState("All");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRequirementForm, setShowRequirementForm] =
    useState(false);

  const [createEmployeeId, setCreateEmployeeId] = useState("");
  const [createTypeId, setCreateTypeId] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createCategory, setCreateCategory] =
    useState("Qualification");
  const [createIssuingBody, setCreateIssuingBody] = useState("");
  const [createLevel, setCreateLevel] = useState("");
  const [createSpecialism, setCreateSpecialism] = useState("");
  const [createRegistrationNumber, setCreateRegistrationNumber] =
    useState("");
  const [createCertificateNumber, setCreateCertificateNumber] =
    useState("");
  const [createMembershipNumber, setCreateMembershipNumber] =
    useState("");
  const [createLicenceNumber, setCreateLicenceNumber] =
    useState("");
  const [createIssueDate, setCreateIssueDate] = useState("");
  const [createValidFrom, setCreateValidFrom] = useState("");
  const [createExpiryDate, setCreateExpiryDate] = useState("");
  const [createRenewalDate, setCreateRenewalDate] = useState("");
  const [createStatus, setCreateStatus] = useState("Current");
  const [createVerificationStatus, setCreateVerificationStatus] =
    useState("Not Verified");
  const [createMandatory, setCreateMandatory] = useState(false);
  const [createRenewalRequired, setCreateRenewalRequired] =
    useState(false);
  const [createRenewalReminderDays, setCreateRenewalReminderDays] =
    useState("30");
  const [createEmployeeNotes, setCreateEmployeeNotes] =
    useState("");
  const [createManagerNotes, setCreateManagerNotes] =
    useState("");

  const [requirementTitle, setRequirementTitle] = useState("");
  const [requirementTypeId, setRequirementTypeId] = useState("");
  const [requirementRole, setRequirementRole] = useState("");
  const [requirementDepartment, setRequirementDepartment] =
    useState("");
  const [requirementLocation, setRequirementLocation] =
    useState("");
  const [requirementEmploymentStatus, setRequirementEmploymentStatus] =
    useState("");
  const [requirementMandatory, setRequirementMandatory] =
    useState(true);
  const [requirementBeforeStart, setRequirementBeforeStart] =
    useState(false);
  const [requirementGraceDays, setRequirementGraceDays] =
    useState("");
  const [requirementMinimumLevel, setRequirementMinimumLevel] =
    useState("");
  const [requirementAuthority, setRequirementAuthority] =
    useState("");
  const [requirementReason, setRequirementReason] = useState("");
  const [requirementReviewMonths, setRequirementReviewMonths] =
    useState("12");
  const [requirementNextReviewDate, setRequirementNextReviewDate] =
    useState("");

  const [evidence, setEvidence] = useState<QualificationEvidence[]>(
    []
  );
  const [verifications, setVerifications] = useState<
    QualificationVerification[]
  >([]);
  const [renewals, setRenewals] = useState<QualificationRenewal[]>(
    []
  );
  const [activity, setActivity] = useState<QualificationActivity[]>(
    []
  );

  const [overviewTitle, setOverviewTitle] = useState("");
  const [overviewCategory, setOverviewCategory] =
    useState("Qualification");
  const [overviewIssuingBody, setOverviewIssuingBody] =
    useState("");
  const [overviewLevel, setOverviewLevel] = useState("");
  const [overviewSpecialism, setOverviewSpecialism] = useState("");
  const [overviewRegistrationNumber, setOverviewRegistrationNumber] =
    useState("");
  const [overviewCertificateNumber, setOverviewCertificateNumber] =
    useState("");
  const [overviewMembershipNumber, setOverviewMembershipNumber] =
    useState("");
  const [overviewLicenceNumber, setOverviewLicenceNumber] =
    useState("");
  const [overviewIssueDate, setOverviewIssueDate] = useState("");
  const [overviewValidFrom, setOverviewValidFrom] = useState("");
  const [overviewExpiryDate, setOverviewExpiryDate] = useState("");
  const [overviewRenewalDate, setOverviewRenewalDate] = useState("");
  const [overviewStatus, setOverviewStatus] = useState("Current");
  const [overviewVerificationStatus, setOverviewVerificationStatus] =
    useState("Not Verified");
  const [overviewMandatory, setOverviewMandatory] = useState(false);
  const [overviewRenewalRequired, setOverviewRenewalRequired] =
    useState(false);
  const [
    overviewRenewalReminderDays,
    setOverviewRenewalReminderDays,
  ] = useState("30");
  const [overviewEmployeeNotes, setOverviewEmployeeNotes] =
    useState("");
  const [overviewManagerNotes, setOverviewManagerNotes] =
    useState("");

  const [evidenceType, setEvidenceType] = useState("Certificate");
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceDescription, setEvidenceDescription] =
    useState("");
  const [evidenceIssueDate, setEvidenceIssueDate] = useState("");
  const [evidenceExpiryDate, setEvidenceExpiryDate] = useState("");
  const [evidenceExternalUrl, setEvidenceExternalUrl] =
    useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const [verificationDate, setVerificationDate] =
    useState(getTodayDate());
  const [verificationStatus, setVerificationStatus] =
    useState("Verified");
  const [verificationMethod, setVerificationMethod] =
    useState("Original Document Checked");
  const [verificationReference, setVerificationReference] =
    useState("");
  const [verifiedWith, setVerifiedWith] = useState("");
  const [verificationEmployeeId, setVerificationEmployeeId] =
    useState("");
  const [verificationSummary, setVerificationSummary] =
    useState("");
  const [verificationConcerns, setVerificationConcerns] =
    useState("");
  const [nextVerificationDate, setNextVerificationDate] =
    useState("");

  const [renewalDueDate, setRenewalDueDate] = useState("");
  const [renewalStartedDate, setRenewalStartedDate] = useState("");
  const [renewedDate, setRenewedDate] = useState("");
  const [renewalNewIssueDate, setRenewalNewIssueDate] =
    useState("");
  const [renewalNewExpiryDate, setRenewalNewExpiryDate] =
    useState("");
  const [renewalStatus, setRenewalStatus] =
    useState("Not Started");
  const [renewalMethod, setRenewalMethod] = useState("");
  const [renewalProvider, setRenewalProvider] = useState("");
  const [renewalCost, setRenewalCost] = useState("");
  const [renewalEmployeeNotes, setRenewalEmployeeNotes] =
    useState("");
  const [renewalManagerNotes, setRenewalManagerNotes] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadPageData();
  }, []);

  useEffect(() => {
    if (selectedQualification) {
      populateOverview(selectedQualification);
      void loadQualificationWorkspace(selectedQualification.id);
    }
  }, [selectedQualification?.id]);

  async function loadPageData() {
    setLoading(true);
    setErrorMessage("");

    const [
      employeesResult,
      typesResult,
      qualificationsResult,
      requirementsResult,
      employeeRequirementsResult,
    ] = await Promise.all([
      supabase
        .from("employees")
        .select("id, name, role, status")
        .neq("status", "Archived")
        .order("name"),

      supabase
        .from("qualification_types")
        .select("*")
        .eq("is_archived", false)
        .eq("is_active", true)
        .order("name"),

      supabase
        .from("employee_qualifications")
        .select("*")
        .eq("is_archived", false)
        .order("updated_at", { ascending: false }),

      supabase
        .from("qualification_requirements")
        .select("*")
        .eq("is_archived", false)
        .order("updated_at", { ascending: false }),

      supabase
        .from("employee_qualification_requirements")
        .select("*")
        .order("updated_at", { ascending: false }),
    ]);

    const firstError =
      employeesResult.error ||
      typesResult.error ||
      qualificationsResult.error ||
      requirementsResult.error ||
      employeeRequirementsResult.error;

    if (firstError) {
      console.error(
        "Error loading qualifications workspace:",
        firstError
      );
      setErrorMessage(
        "Qualifications and certificates could not be loaded."
      );
      setLoading(false);
      return;
    }

    setEmployees((employeesResult.data || []) as Employee[]);
    setQualificationTypes(
      (typesResult.data || []) as QualificationType[]
    );
    setQualifications(
      (qualificationsResult.data || []) as EmployeeQualification[]
    );
    setRequirements(
      (requirementsResult.data || []) as QualificationRequirement[]
    );
    setEmployeeRequirements(
      (employeeRequirementsResult.data ||
        []) as EmployeeRequirement[]
    );

    setLoading(false);
  }

  async function loadQualificationWorkspace(
    qualificationId: number
  ) {
    setWorkspaceLoading(true);
    setErrorMessage("");

    const [
      evidenceResult,
      verificationResult,
      renewalResult,
      activityResult,
    ] = await Promise.all([
      supabase
        .from("qualification_evidence")
        .select("*")
        .eq("employee_qualification_id", qualificationId)
        .eq("is_archived", false)
        .order("uploaded_at", { ascending: false }),

      supabase
        .from("qualification_verifications")
        .select("*")
        .eq("employee_qualification_id", qualificationId)
        .order("verification_date", { ascending: false }),

      supabase
        .from("qualification_renewals")
        .select("*")
        .eq("employee_qualification_id", qualificationId)
        .eq("is_archived", false)
        .order("created_at", { ascending: false }),

      supabase
        .from("qualification_activity_history")
        .select("*")
        .eq("employee_qualification_id", qualificationId)
        .order("created_at", { ascending: false }),
    ]);

    const firstError =
      evidenceResult.error ||
      verificationResult.error ||
      renewalResult.error ||
      activityResult.error;

    if (firstError) {
      console.error(
        "Error loading qualification workspace:",
        firstError
      );
      setErrorMessage(
        "The qualification workspace could not be loaded."
      );
      setWorkspaceLoading(false);
      return;
    }

    setEvidence(
      (evidenceResult.data || []) as QualificationEvidence[]
    );
    setVerifications(
      (verificationResult.data ||
        []) as QualificationVerification[]
    );
    setRenewals(
      (renewalResult.data || []) as QualificationRenewal[]
    );
    setActivity(
      (activityResult.data || []) as QualificationActivity[]
    );

    setWorkspaceLoading(false);
  }

  function populateOverview(
    qualification: EmployeeQualification
  ) {
    setOverviewTitle(qualification.title);
    setOverviewCategory(qualification.category);
    setOverviewIssuingBody(qualification.issuing_body || "");
    setOverviewLevel(qualification.qualification_level || "");
    setOverviewSpecialism(
      qualification.subject_or_specialism || ""
    );
    setOverviewRegistrationNumber(
      qualification.registration_number || ""
    );
    setOverviewCertificateNumber(
      qualification.certificate_number || ""
    );
    setOverviewMembershipNumber(
      qualification.membership_number || ""
    );
    setOverviewLicenceNumber(qualification.licence_number || "");
    setOverviewIssueDate(qualification.issue_date || "");
    setOverviewValidFrom(qualification.valid_from || "");
    setOverviewExpiryDate(qualification.expiry_date || "");
    setOverviewRenewalDate(qualification.renewal_date || "");
    setOverviewStatus(qualification.status);
    setOverviewVerificationStatus(
      qualification.verification_status
    );
    setOverviewMandatory(qualification.mandatory);
    setOverviewRenewalRequired(
      qualification.renewal_required
    );
    setOverviewRenewalReminderDays(
      qualification.renewal_reminder_days !== null
        ? String(qualification.renewal_reminder_days)
        : "30"
    );
    setOverviewEmployeeNotes(qualification.employee_notes || "");
    setOverviewManagerNotes(qualification.manager_notes || "");
  }

  function resetCreateForm() {
    setCreateEmployeeId("");
    setCreateTypeId("");
    setCreateTitle("");
    setCreateCategory("Qualification");
    setCreateIssuingBody("");
    setCreateLevel("");
    setCreateSpecialism("");
    setCreateRegistrationNumber("");
    setCreateCertificateNumber("");
    setCreateMembershipNumber("");
    setCreateLicenceNumber("");
    setCreateIssueDate("");
    setCreateValidFrom("");
    setCreateExpiryDate("");
    setCreateRenewalDate("");
    setCreateStatus("Current");
    setCreateVerificationStatus("Not Verified");
    setCreateMandatory(false);
    setCreateRenewalRequired(false);
    setCreateRenewalReminderDays("30");
    setCreateEmployeeNotes("");
    setCreateManagerNotes("");
    setErrorMessage("");
  }

  function applyQualificationType(typeId: string) {
    setCreateTypeId(typeId);

    const selectedType = qualificationTypes.find(
      (item) => item.id === Number(typeId)
    );

    if (!selectedType) {
      return;
    }

    setCreateTitle(selectedType.name);
    setCreateCategory(selectedType.category);
    setCreateIssuingBody(selectedType.issuing_body || "");
    setCreateMandatory(selectedType.mandatory_by_default);
    setCreateRenewalRequired(selectedType.renewal_required);
    setCreateVerificationStatus(
      selectedType.verification_required
        ? "Pending Verification"
        : "Not Required"
    );

    if (
      selectedType.default_validity_months &&
      createIssueDate
    ) {
      setCreateExpiryDate(
        addMonthsToDate(
          createIssueDate,
          selectedType.default_validity_months
        )
      );
    }
  }

  async function createQualification() {
    if (!createEmployeeId) {
      setErrorMessage("Select an employee.");
      return;
    }

    if (!createTitle.trim()) {
      setErrorMessage("Enter the qualification or certificate title.");
      return;
    }

    if (
      createExpiryDate &&
      createIssueDate &&
      createExpiryDate < createIssueDate
    ) {
      setErrorMessage(
        "The expiry date cannot be before the issue date."
      );
      return;
    }

    if (
      createRenewalRequired &&
      Number(createRenewalReminderDays || 0) < 1
    ) {
      setErrorMessage(
        "Enter how many days before expiry the renewal reminder should appear."
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const { data, error } = await supabase
      .from("employee_qualifications")
      .insert({
        employee_id: Number(createEmployeeId),
        qualification_type_id: createTypeId
          ? Number(createTypeId)
          : null,
        title: createTitle.trim(),
        category: createCategory,
        issuing_body: createIssuingBody.trim() || null,
        qualification_level: createLevel.trim() || null,
        subject_or_specialism: createSpecialism.trim() || null,
        registration_number:
          createRegistrationNumber.trim() || null,
        certificate_number:
          createCertificateNumber.trim() || null,
        membership_number:
          createMembershipNumber.trim() || null,
        licence_number: createLicenceNumber.trim() || null,
        issue_date: createIssueDate || null,
        valid_from: createValidFrom || null,
        expiry_date: createExpiryDate || null,
        renewal_date: createRenewalDate || null,
        status: deriveQualificationStatus(
          createStatus,
          createExpiryDate,
          createRenewalRequired
        ),
        verification_status: createVerificationStatus,
        mandatory: createMandatory,
        renewal_required: createRenewalRequired,
        renewal_reminder_days: createRenewalRequired
          ? Number(createRenewalReminderDays)
          : null,
        employee_notes: createEmployeeNotes.trim() || null,
        manager_notes: createManagerNotes.trim() || null,
        source_type: "Direct",
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("Error creating qualification:", error);
      setErrorMessage(
        "The qualification or certificate could not be created."
      );
      setSaving(false);
      return;
    }

    await recordActivity({
      qualificationId: data.id,
      employeeId: data.employee_id,
      requirementId: null,
      activityType: "Created",
      summary: `${data.title} added to the employee qualification record.`,
      details: {
        category: data.category,
        status: data.status,
        expiry_date: data.expiry_date,
      },
    });

    setSaving(false);
    setShowCreateForm(false);
    resetCreateForm();

    await loadPageData();

    setSelectedQualification(data as EmployeeQualification);
  }

  async function saveOverview() {
    if (!selectedQualification) return;

    if (!overviewTitle.trim()) {
      setErrorMessage("Enter the qualification title.");
      return;
    }

    if (
      overviewExpiryDate &&
      overviewIssueDate &&
      overviewExpiryDate < overviewIssueDate
    ) {
      setErrorMessage(
        "The expiry date cannot be before the issue date."
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const calculatedStatus = deriveQualificationStatus(
      overviewStatus,
      overviewExpiryDate,
      overviewRenewalRequired
    );

    const { data, error } = await supabase
      .from("employee_qualifications")
      .update({
        title: overviewTitle.trim(),
        category: overviewCategory,
        issuing_body: overviewIssuingBody.trim() || null,
        qualification_level: overviewLevel.trim() || null,
        subject_or_specialism:
          overviewSpecialism.trim() || null,
        registration_number:
          overviewRegistrationNumber.trim() || null,
        certificate_number:
          overviewCertificateNumber.trim() || null,
        membership_number:
          overviewMembershipNumber.trim() || null,
        licence_number: overviewLicenceNumber.trim() || null,
        issue_date: overviewIssueDate || null,
        valid_from: overviewValidFrom || null,
        expiry_date: overviewExpiryDate || null,
        renewal_date: overviewRenewalDate || null,
        status: calculatedStatus,
        verification_status: overviewVerificationStatus,
        mandatory: overviewMandatory,
        renewal_required: overviewRenewalRequired,
        renewal_reminder_days: overviewRenewalRequired
          ? Number(overviewRenewalReminderDays || 30)
          : null,
        employee_notes: overviewEmployeeNotes.trim() || null,
        manager_notes: overviewManagerNotes.trim() || null,
      })
      .eq("id", selectedQualification.id)
      .select("*")
      .single();

    if (error || !data) {
      console.error("Error updating qualification:", error);
      setErrorMessage(
        "The qualification record could not be updated."
      );
      setSaving(false);
      return;
    }

    await recordActivity({
      qualificationId: selectedQualification.id,
      employeeId: selectedQualification.employee_id,
      requirementId: null,
      activityType: "Status Changed",
      summary: `${overviewTitle.trim()} updated.`,
      details: {
        status: calculatedStatus,
        verification_status: overviewVerificationStatus,
        expiry_date: overviewExpiryDate || null,
      },
    });

    setSelectedQualification(data as EmployeeQualification);
    setMessage("Qualification record updated.");
    setSaving(false);

    await loadPageData();
    await loadQualificationWorkspace(selectedQualification.id);
  }

  async function archiveQualification() {
    if (!selectedQualification) return;

    const employee = employees.find(
      (item) => item.id === selectedQualification.employee_id
    );

    const confirmed = window.confirm(
      `Archive "${selectedQualification.title}" for ${
        employee?.name || "this employee"
      }?\n\nThe qualification, evidence, verification and renewal history will remain preserved.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("employee_qualifications")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq("id", selectedQualification.id);

    if (error) {
      setErrorMessage(
        "The qualification record could not be archived."
      );
      return;
    }

    await recordActivity({
      qualificationId: selectedQualification.id,
      employeeId: selectedQualification.employee_id,
      requirementId: null,
      activityType: "Archived",
      summary: `${selectedQualification.title} archived.`,
      details: null,
    });

    setSelectedQualification(null);
    setMessage("Qualification record archived.");

    await loadPageData();
  }

  async function uploadEvidence() {
    if (!selectedQualification) return;

    if (!evidenceTitle.trim()) {
      setErrorMessage("Enter an evidence title.");
      return;
    }

    if (
      evidenceType === "External Link" &&
      !evidenceExternalUrl.trim()
    ) {
      setErrorMessage("Enter the external evidence link.");
      return;
    }

    if (evidenceType !== "External Link" && !evidenceFile) {
      setErrorMessage("Choose an evidence file.");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    let filePath: string | null = null;
    let fileName: string | null = null;
    let mimeType: string | null = null;
    let fileSizeBytes: number | null = null;

    if (evidenceFile) {
      const safeFileName = evidenceFile.name.replace(
        /[^a-zA-Z0-9.\-_]/g,
        "_"
      );

      filePath = `${selectedQualification.employee_id}/${selectedQualification.id}/${Date.now()}-${safeFileName}`;
      fileName = evidenceFile.name;
      mimeType = evidenceFile.type || null;
      fileSizeBytes = evidenceFile.size;

      const upload = await supabase.storage
        .from("qualification-evidence")
        .upload(filePath, evidenceFile);

      if (upload.error) {
        console.error(
          "Error uploading qualification evidence:",
          upload.error
        );
        setErrorMessage(
          "The qualification evidence file could not be uploaded."
        );
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("qualification_evidence")
      .insert({
        employee_qualification_id: selectedQualification.id,
        employee_id: selectedQualification.employee_id,
        evidence_type: evidenceType,
        title: evidenceTitle.trim(),
        description: evidenceDescription.trim() || null,
        file_name: fileName,
        file_path: filePath,
        mime_type: mimeType,
        file_size_bytes: fileSizeBytes,
        external_url:
          evidenceType === "External Link"
            ? evidenceExternalUrl.trim()
            : null,
        issue_date: evidenceIssueDate || null,
        expiry_date: evidenceExpiryDate || null,
      });

    if (error) {
      console.error(
        "Error saving qualification evidence:",
        error
      );

      if (filePath) {
        await supabase.storage
          .from("qualification-evidence")
          .remove([filePath]);
      }

      setErrorMessage(
        "The qualification evidence record could not be saved."
      );
      setSaving(false);
      return;
    }

    await recordActivity({
      qualificationId: selectedQualification.id,
      employeeId: selectedQualification.employee_id,
      requirementId: null,
      activityType: "Evidence Uploaded",
      summary: `${evidenceTitle.trim()} uploaded.`,
      details: {
        evidence_type: evidenceType,
        issue_date: evidenceIssueDate || null,
        expiry_date: evidenceExpiryDate || null,
      },
    });

    setEvidenceType("Certificate");
    setEvidenceTitle("");
    setEvidenceDescription("");
    setEvidenceIssueDate("");
    setEvidenceExpiryDate("");
    setEvidenceExternalUrl("");
    setEvidenceFile(null);
    setMessage("Qualification evidence uploaded.");
    setSaving(false);

    await loadQualificationWorkspace(selectedQualification.id);
  }

  async function openEvidence(
    evidenceRecord: QualificationEvidence
  ) {
    if (evidenceRecord.external_url) {
      window.open(
        evidenceRecord.external_url,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    if (!evidenceRecord.file_path) {
      setErrorMessage(
        "This evidence record does not contain a file or link."
      );
      return;
    }

    const { data, error } = await supabase.storage
      .from("qualification-evidence")
      .createSignedUrl(evidenceRecord.file_path, 60);

    if (error) {
      setErrorMessage(
        "The evidence file could not be opened."
      );
      return;
    }

    if (data?.signedUrl) {
      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );
    }
  }

  async function archiveEvidence(
    evidenceRecord: QualificationEvidence
  ) {
    if (!selectedQualification) return;

    const confirmed = window.confirm(
      `Archive "${evidenceRecord.title}"?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("qualification_evidence")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq("id", evidenceRecord.id);

    if (error) {
      setErrorMessage(
        "The qualification evidence could not be archived."
      );
      return;
    }

    await recordActivity({
      qualificationId: selectedQualification.id,
      employeeId: selectedQualification.employee_id,
      requirementId: null,
      activityType: "Evidence Archived",
      summary: `${evidenceRecord.title} archived.`,
      details: {
        evidence_id: evidenceRecord.id,
      },
    });

    await loadQualificationWorkspace(selectedQualification.id);
  }

  async function recordVerification() {
    if (!selectedQualification) return;

    if (!verificationSummary.trim()) {
      setErrorMessage("Enter the verification summary.");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("qualification_verifications")
      .insert({
        employee_qualification_id: selectedQualification.id,
        employee_id: selectedQualification.employee_id,
        verification_date: verificationDate,
        verification_status: verificationStatus,
        verification_method: verificationMethod || null,
        verification_reference:
          verificationReference.trim() || null,
        verified_with: verifiedWith.trim() || null,
        verifier_employee_id: verificationEmployeeId
          ? Number(verificationEmployeeId)
          : null,
        verification_summary: verificationSummary.trim(),
        concerns_or_actions:
          verificationConcerns.trim() || null,
        next_verification_date: nextVerificationDate || null,
      });

    if (error) {
      console.error(
        "Error recording qualification verification:",
        error
      );
      setErrorMessage(
        "The qualification verification could not be recorded."
      );
      setSaving(false);
      return;
    }

    const mappedStatus =
      verificationStatus === "Verified"
        ? "Verified"
        : verificationStatus;

    const { data: updatedQualification } = await supabase
      .from("employee_qualifications")
      .update({
        verification_status: mappedStatus,
        verified_at:
          verificationStatus === "Verified"
            ? new Date().toISOString()
            : null,
        verified_by: verificationEmployeeId
          ? Number(verificationEmployeeId)
          : null,
        verification_method: verificationMethod || null,
        verification_reference:
          verificationReference.trim() || null,
        verification_notes:
          verificationSummary.trim() || null,
        status:
          verificationStatus === "Verified" &&
          selectedQualification.status === "Pending Verification"
            ? "Current"
            : selectedQualification.status,
      })
      .eq("id", selectedQualification.id)
      .select("*")
      .single();

    await recordActivity({
      qualificationId: selectedQualification.id,
      employeeId: selectedQualification.employee_id,
      requirementId: null,
      activityType:
        verificationStatus === "Verified"
          ? "Verification Completed"
          : verificationStatus === "Verification Failed"
            ? "Verification Failed"
            : "Verification Requested",
      summary: `${selectedQualification.title} verification recorded as ${verificationStatus}.`,
      details: {
        verification_method: verificationMethod,
        verification_reference:
          verificationReference.trim() || null,
        next_verification_date:
          nextVerificationDate || null,
      },
    });

    setVerificationDate(getTodayDate());
    setVerificationStatus("Verified");
    setVerificationMethod("Original Document Checked");
    setVerificationReference("");
    setVerifiedWith("");
    setVerificationEmployeeId("");
    setVerificationSummary("");
    setVerificationConcerns("");
    setNextVerificationDate("");
    setMessage("Qualification verification recorded.");
    setSaving(false);

    if (updatedQualification) {
      setSelectedQualification(
        updatedQualification as EmployeeQualification
      );
    }

    await loadPageData();
    await loadQualificationWorkspace(selectedQualification.id);
  }

  async function createRenewal() {
    if (!selectedQualification) return;

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("qualification_renewals")
      .insert({
        employee_qualification_id: selectedQualification.id,
        employee_id: selectedQualification.employee_id,
        previous_issue_date: selectedQualification.issue_date,
        previous_expiry_date: selectedQualification.expiry_date,
        renewal_due_date:
          renewalDueDate ||
          selectedQualification.renewal_date ||
          selectedQualification.expiry_date ||
          null,
        renewal_started_date: renewalStartedDate || null,
        renewed_date: renewedDate || null,
        new_issue_date: renewalNewIssueDate || null,
        new_expiry_date: renewalNewExpiryDate || null,
        status: renewalStatus,
        renewal_method: renewalMethod.trim() || null,
        provider_or_body: renewalProvider.trim() || null,
        cost_amount: renewalCost ? Number(renewalCost) : null,
        currency_code: "GBP",
        employee_notes: renewalEmployeeNotes.trim() || null,
        manager_notes: renewalManagerNotes.trim() || null,
      });

    if (error) {
      console.error(
        "Error creating qualification renewal:",
        error
      );
      setErrorMessage(
        "The qualification renewal could not be recorded."
      );
      setSaving(false);
      return;
    }

    let qualificationUpdates: Record<string, unknown> = {
      status:
        renewalStatus === "Completed"
          ? "Current"
          : renewalStatus === "Overdue"
            ? "Expired"
            : "Due for Renewal",
      renewal_date:
        renewalDueDate ||
        selectedQualification.renewal_date ||
        null,
    };

    if (renewalStatus === "Completed") {
      qualificationUpdates = {
        ...qualificationUpdates,
        issue_date:
          renewalNewIssueDate || selectedQualification.issue_date,
        valid_from:
          renewalNewIssueDate ||
          selectedQualification.valid_from,
        expiry_date:
          renewalNewExpiryDate ||
          selectedQualification.expiry_date,
        renewal_date:
          renewalNewExpiryDate ||
          selectedQualification.renewal_date,
      };
    }

    const { data: updatedQualification } = await supabase
      .from("employee_qualifications")
      .update(qualificationUpdates)
      .eq("id", selectedQualification.id)
      .select("*")
      .single();

    await recordActivity({
      qualificationId: selectedQualification.id,
      employeeId: selectedQualification.employee_id,
      requirementId: null,
      activityType:
        renewalStatus === "Completed"
          ? "Renewal Completed"
          : renewalStatus === "In Progress"
            ? "Renewal Started"
            : "Renewal Due",
      summary: `${selectedQualification.title} renewal recorded as ${renewalStatus}.`,
      details: {
        renewal_due_date: renewalDueDate || null,
        new_issue_date: renewalNewIssueDate || null,
        new_expiry_date: renewalNewExpiryDate || null,
      },
    });

    setRenewalDueDate("");
    setRenewalStartedDate("");
    setRenewedDate("");
    setRenewalNewIssueDate("");
    setRenewalNewExpiryDate("");
    setRenewalStatus("Not Started");
    setRenewalMethod("");
    setRenewalProvider("");
    setRenewalCost("");
    setRenewalEmployeeNotes("");
    setRenewalManagerNotes("");
    setMessage("Qualification renewal recorded.");
    setSaving(false);

    if (updatedQualification) {
      setSelectedQualification(
        updatedQualification as EmployeeQualification
      );
    }

    await loadPageData();
    await loadQualificationWorkspace(selectedQualification.id);
  }
    async function createRequirement() {
    if (!requirementTitle.trim()) {
      setErrorMessage("Enter the requirement title.");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const { data, error } = await supabase
      .from("qualification_requirements")
      .insert({
        qualification_type_id: requirementTypeId
          ? Number(requirementTypeId)
          : null,
        requirement_title: requirementTitle.trim(),
        target_role: requirementRole.trim() || null,
        target_department:
          requirementDepartment.trim() || null,
        target_location: requirementLocation.trim() || null,
        employment_status:
          requirementEmploymentStatus.trim() || null,
        mandatory: requirementMandatory,
        required_before_start: requirementBeforeStart,
        grace_period_days: requirementGraceDays
          ? Number(requirementGraceDays)
          : null,
        minimum_level: requirementMinimumLevel.trim() || null,
        regulator_or_authority:
          requirementAuthority.trim() || null,
        requirement_reason:
          requirementReason.trim() || null,
        review_frequency_months: requirementReviewMonths
          ? Number(requirementReviewMonths)
          : null,
        next_review_date:
          requirementNextReviewDate || null,
        is_active: true,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error(
        "Error creating qualification requirement:",
        error
      );

      setErrorMessage(
        "The qualification requirement could not be created."
      );

      setSaving(false);
      return;
    }

    const matchingEmployees = employees.filter((employee) => {
      const roleMatches =
        !requirementRole.trim() ||
        (employee.role || "")
          .trim()
          .toLowerCase() ===
          requirementRole.trim().toLowerCase();

      return roleMatches;
    });

    if (matchingEmployees.length > 0) {
      await supabase
        .from("employee_qualification_requirements")
        .insert(
          matchingEmployees.map((employee) => ({
            qualification_requirement_id: data.id,
            employee_id: employee.id,
            employee_qualification_id: null,
            status: "Required",
            required_date: getTodayDate(),
          }))
        );
    }

    setRequirementTitle("");
    setRequirementTypeId("");
    setRequirementRole("");
    setRequirementDepartment("");
    setRequirementLocation("");
    setRequirementEmploymentStatus("");
    setRequirementMandatory(true);
    setRequirementBeforeStart(false);
    setRequirementGraceDays("");
    setRequirementMinimumLevel("");
    setRequirementAuthority("");
    setRequirementReason("");
    setRequirementReviewMonths("12");
    setRequirementNextReviewDate("");
    setShowRequirementForm(false);
    setMessage("Qualification requirement created.");
    setSaving(false);

    await loadPageData();
  }

  async function updateEmployeeRequirement(
    requirement: EmployeeRequirement,
    nextStatus: string
  ) {
    const { error } = await supabase
      .from("employee_qualification_requirements")
      .update({
        status: nextStatus,
        compliance_date:
          nextStatus === "Compliant"
            ? getTodayDate()
            : requirement.compliance_date,
      })
      .eq("id", requirement.id);

    if (error) {
      setErrorMessage(
        "The employee requirement status could not be updated."
      );
      return;
    }

    await recordActivity({
      qualificationId:
        requirement.employee_qualification_id,
      employeeId: requirement.employee_id,
      requirementId:
        requirement.qualification_requirement_id,
      activityType: "Status Changed",
      summary: `Qualification requirement changed to ${nextStatus}.`,
      details: {
        requirement_status: nextStatus,
      },
    });

    setMessage("Requirement status updated.");
    await loadPageData();
  }

  async function linkQualificationToRequirement(
    requirement: EmployeeRequirement
  ) {
    if (!selectedQualification) return;

    if (
      requirement.employee_id !==
      selectedQualification.employee_id
    ) {
      setErrorMessage(
        "This requirement belongs to a different employee."
      );
      return;
    }

    const { error } = await supabase
      .from("employee_qualification_requirements")
      .update({
        employee_qualification_id:
          selectedQualification.id,
        status:
          selectedQualification.status === "Current" &&
          [
            "Verified",
            "Not Required",
          ].includes(
            selectedQualification.verification_status
          )
            ? "Compliant"
            : selectedQualification.verification_status ===
                "Pending Verification"
              ? "Pending Verification"
              : "Pending Evidence",
        compliance_date:
          selectedQualification.status === "Current"
            ? getTodayDate()
            : null,
      })
      .eq("id", requirement.id);

    if (error) {
      setErrorMessage(
        "The qualification could not be linked to the requirement."
      );
      return;
    }

    await recordActivity({
      qualificationId: selectedQualification.id,
      employeeId: selectedQualification.employee_id,
      requirementId:
        requirement.qualification_requirement_id,
      activityType: "Requirement Assigned",
      summary: `${selectedQualification.title} linked to a qualification requirement.`,
      details: {
        employee_requirement_id: requirement.id,
      },
    });

    setMessage("Qualification linked to requirement.");
    await loadPageData();
  }

  async function recordActivity({
    qualificationId,
    employeeId,
    requirementId,
    activityType,
    summary,
    details,
  }: {
    qualificationId: number | null;
    employeeId: number | null;
    requirementId: number | null;
    activityType: string;
    summary: string;
    details: Record<string, unknown> | null;
  }) {
    const { error } = await supabase
      .from("qualification_activity_history")
      .insert({
        employee_qualification_id: qualificationId,
        employee_id: employeeId,
        qualification_requirement_id: requirementId,
        activity_type: activityType,
        activity_summary: summary,
        activity_details: details,
      });

    if (error) {
      console.error(
        "Error recording qualification activity:",
        error
      );
    }
  }

  const employeeMap = useMemo(
    () =>
      new Map(
        employees.map((employee) => [
          employee.id,
          employee,
        ])
      ),
    [employees]
  );

  const typeMap = useMemo(
    () =>
      new Map(
        qualificationTypes.map((type) => [
          type.id,
          type,
        ])
      ),
    [qualificationTypes]
  );

  const requirementMap = useMemo(
    () =>
      new Map(
        requirements.map((requirement) => [
          requirement.id,
          requirement,
        ])
      ),
    [requirements]
  );

  const filteredQualifications = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return qualifications.filter((qualification) => {
      const employee = employeeMap.get(
        qualification.employee_id
      );

      const matchesSearch =
        !search ||
        qualification.title
          .toLowerCase()
          .includes(search) ||
        qualification.category
          .toLowerCase()
          .includes(search) ||
        (qualification.issuing_body || "")
          .toLowerCase()
          .includes(search) ||
        (employee?.name || "")
          .toLowerCase()
          .includes(search) ||
        (employee?.role || "")
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        qualification.status === statusFilter;

      const matchesCategory =
        categoryFilter === "All" ||
        qualification.category === categoryFilter;

      const matchesEmployee =
        employeeFilter === "All" ||
        qualification.employee_id ===
          Number(employeeFilter);

      const matchesVerification =
        verificationFilter === "All" ||
        qualification.verification_status ===
          verificationFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesEmployee &&
        matchesVerification
      );
    });
  }, [
    qualifications,
    searchTerm,
    statusFilter,
    categoryFilter,
    employeeFilter,
    verificationFilter,
    employeeMap,
  ]);

  const currentCount = qualifications.filter(
    (qualification) =>
      qualification.status === "Current"
  ).length;

  const renewalDueCount = qualifications.filter(
    (qualification) =>
      qualification.status === "Due for Renewal" ||
      (qualification.expiry_date &&
        qualification.expiry_date >= getTodayDate() &&
        daysBetween(
          getTodayDate(),
          qualification.expiry_date
        ) <=
          (qualification.renewal_reminder_days || 30))
  ).length;

  const expiredCount = qualifications.filter(
    (qualification) =>
      qualification.status === "Expired" ||
      Boolean(
        qualification.expiry_date &&
          qualification.expiry_date < getTodayDate()
      )
  ).length;

  const pendingVerificationCount = qualifications.filter(
    (qualification) =>
      qualification.verification_status ===
        "Pending Verification" ||
      qualification.verification_status ===
        "Not Verified"
  ).length;

  const mandatoryCount = qualifications.filter(
    (qualification) => qualification.mandatory
  ).length;

  const selectedEmployee = selectedQualification
    ? employeeMap.get(selectedQualification.employee_id)
    : null;

  const linkedRequirements = selectedQualification
    ? employeeRequirements.filter(
        (requirement) =>
          requirement.employee_id ===
          selectedQualification.employee_id
      )
    : [];

  if (selectedQualification) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setSelectedQualification(null);
            setActiveTab("Overview");
            setMessage("");
            setErrorMessage("");
          }}
          style={backButtonStyle}
        >
          ← Back to Qualifications & Certificates
        </button>

        <div style={workspaceHeaderStyle}>
          <div>
            <div style={badgeRowStyle}>
              <span style={primaryBadgeStyle}>
                {selectedQualification.status}
              </span>

              <span style={secondaryBadgeStyle}>
                {selectedQualification.category}
              </span>

              <span style={secondaryBadgeStyle}>
                {
                  selectedQualification.verification_status
                }
              </span>

              {selectedQualification.mandatory && (
                <span style={secondaryBadgeStyle}>
                  Mandatory
                </span>
              )}
            </div>

            <h2 style={workspaceTitleStyle}>
              {selectedQualification.title}
            </h2>

            <p style={workspaceDescriptionStyle}>
              {selectedEmployee?.name ||
                `Employee ${selectedQualification.employee_id}`}
              {selectedEmployee?.role
                ? ` · ${selectedEmployee.role}`
                : ""}
            </p>
          </div>

          <div style={referenceSummaryStyle}>
            {getQualificationReference(
              selectedQualification
            ) || "No reference recorded"}
          </div>
        </div>

        <div style={tabNavigationStyle}>
          {(
            [
              "Overview",
              "Evidence",
              "Verification",
              "Renewal",
              "Requirements",
              "Activity",
            ] as WorkspaceTab[]
          ).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
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

        {workspaceLoading ? (
          <div style={emptyStateStyle}>
            Loading qualification workspace...
          </div>
        ) : (
          <>
            {activeTab === "Overview" && (
              <div>
                <SectionHeading
                  title="Overview"
                  description="Maintain the qualification, licence, membership or certificate details."
                />

                <div style={detailGridStyle}>
                  <DetailCard
                    label="Employee"
                    value={
                      selectedEmployee?.name ||
                      "Employee not found"
                    }
                  />

                  <DetailCard
                    label="Issuing Body"
                    value={
                      selectedQualification.issuing_body ||
                      "Not recorded"
                    }
                  />

                  <DetailCard
                    label="Issue Date"
                    value={
                      selectedQualification.issue_date
                        ? formatDate(
                            selectedQualification.issue_date
                          )
                        : "Not recorded"
                    }
                  />

                  <DetailCard
                    label="Expiry Date"
                    value={
                      selectedQualification.expiry_date
                        ? formatDate(
                            selectedQualification.expiry_date
                          )
                        : "Does not expire"
                    }
                  />
                </div>

                <div style={formGridStyle}>
                  <FormField label="Title">
                    <input
                      value={overviewTitle}
                      onChange={(event) =>
                        setOverviewTitle(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Category">
                    <select
                      value={overviewCategory}
                      onChange={(event) =>
                        setOverviewCategory(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    >
                      {qualificationCategories.map(
                        (category) => (
                          <option key={category}>
                            {category}
                          </option>
                        )
                      )}
                    </select>
                  </FormField>
                </div>

                <div style={formGridStyle}>
                  <FormField label="Issuing body">
                    <input
                      value={overviewIssuingBody}
                      onChange={(event) =>
                        setOverviewIssuingBody(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Qualification level">
                    <input
                      value={overviewLevel}
                      onChange={(event) =>
                        setOverviewLevel(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>
                </div>

                <FormField label="Subject or specialism">
                  <input
                    value={overviewSpecialism}
                    onChange={(event) =>
                      setOverviewSpecialism(
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </FormField>

                <div style={formGridStyle}>
                  <FormField label="Registration number">
                    <input
                      value={overviewRegistrationNumber}
                      onChange={(event) =>
                        setOverviewRegistrationNumber(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Certificate number">
                    <input
                      value={overviewCertificateNumber}
                      onChange={(event) =>
                        setOverviewCertificateNumber(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>
                </div>

                <div style={formGridStyle}>
                  <FormField label="Membership number">
                    <input
                      value={overviewMembershipNumber}
                      onChange={(event) =>
                        setOverviewMembershipNumber(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Licence number">
                    <input
                      value={overviewLicenceNumber}
                      onChange={(event) =>
                        setOverviewLicenceNumber(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>
                </div>

                <div style={formGridStyle}>
                  <FormField label="Issue date">
                    <input
                      type="date"
                      value={overviewIssueDate}
                      onChange={(event) =>
                        setOverviewIssueDate(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Valid from">
                    <input
                      type="date"
                      value={overviewValidFrom}
                      onChange={(event) =>
                        setOverviewValidFrom(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>
                </div>

                <div style={formGridStyle}>
                  <FormField label="Expiry date">
                    <input
                      type="date"
                      value={overviewExpiryDate}
                      onChange={(event) =>
                        setOverviewExpiryDate(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Renewal date">
                    <input
                      type="date"
                      value={overviewRenewalDate}
                      onChange={(event) =>
                        setOverviewRenewalDate(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>
                </div>

                <div style={formGridStyle}>
                  <FormField label="Status">
                    <select
                      value={overviewStatus}
                      onChange={(event) =>
                        setOverviewStatus(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    >
                      {qualificationStatuses.map(
                        (status) => (
                          <option key={status}>
                            {status}
                          </option>
                        )
                      )}
                    </select>
                  </FormField>

                  <FormField label="Verification status">
                    <select
                      value={
                        overviewVerificationStatus
                      }
                      onChange={(event) =>
                        setOverviewVerificationStatus(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    >
                      {verificationStatuses.map(
                        (status) => (
                          <option key={status}>
                            {status}
                          </option>
                        )
                      )}
                    </select>
                  </FormField>
                </div>

                <div style={optionGridStyle}>
                  <CheckboxField
                    label="Mandatory"
                    description="This credential is mandatory for the employee or role."
                    checked={overviewMandatory}
                    onChange={setOverviewMandatory}
                  />

                  <CheckboxField
                    label="Renewal required"
                    description="This credential must be renewed."
                    checked={
                      overviewRenewalRequired
                    }
                    onChange={
                      setOverviewRenewalRequired
                    }
                  />
                </div>

                {overviewRenewalRequired && (
                  <FormField label="Renewal reminder days">
                    <input
                      type="number"
                      min="1"
                      value={
                        overviewRenewalReminderDays
                      }
                      onChange={(event) =>
                        setOverviewRenewalReminderDays(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>
                )}

                <FormField label="Employee notes">
                  <textarea
                    value={overviewEmployeeNotes}
                    onChange={(event) =>
                      setOverviewEmployeeNotes(
                        event.target.value
                      )
                    }
                    style={textareaStyle}
                  />
                </FormField>

                <FormField label="Manager notes">
                  <textarea
                    value={overviewManagerNotes}
                    onChange={(event) =>
                      setOverviewManagerNotes(
                        event.target.value
                      )
                    }
                    style={textareaStyle}
                  />
                </FormField>

                <div style={splitActionsStyle}>
                  <button
                    type="button"
                    onClick={() =>
                      void archiveQualification()
                    }
                    style={archiveButtonStyle}
                  >
                    Archive Record
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void saveOverview()
                    }
                    disabled={saving}
                    style={primaryButtonStyle}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Record"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "Evidence" && (
              <div>
                <SectionHeading
                  title="Evidence"
                  description="Upload and preserve certificates, licences, transcripts and verification documents."
                />

                <div style={formPanelStyle}>
                  <div style={formGridStyle}>
                    <FormField label="Evidence type">
                      <select
                        value={evidenceType}
                        onChange={(event) =>
                          setEvidenceType(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      >
                        {evidenceTypes.map((type) => (
                          <option key={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Evidence title">
                      <input
                        value={evidenceTitle}
                        onChange={(event) =>
                          setEvidenceTitle(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </FormField>
                  </div>

                  <FormField label="Description">
                    <textarea
                      value={evidenceDescription}
                      onChange={(event) =>
                        setEvidenceDescription(
                          event.target.value
                        )
                      }
                      style={textareaStyle}
                    />
                  </FormField>

                  <div style={formGridStyle}>
                    <FormField label="Issue date">
                      <input
                        type="date"
                        value={evidenceIssueDate}
                        onChange={(event) =>
                          setEvidenceIssueDate(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </FormField>

                    <FormField label="Expiry date">
                      <input
                        type="date"
                        value={evidenceExpiryDate}
                        onChange={(event) =>
                          setEvidenceExpiryDate(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </FormField>
                  </div>

                  {evidenceType ===
                  "External Link" ? (
                    <FormField label="External link">
                      <input
                        type="url"
                        value={evidenceExternalUrl}
                        onChange={(event) =>
                          setEvidenceExternalUrl(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </FormField>
                  ) : (
                    <FormField label="Evidence file">
                      <input
                        type="file"
                        onChange={(event) =>
                          setEvidenceFile(
                            event.target.files?.[0] ||
                              null
                          )
                        }
                      />
                    </FormField>
                  )}

                  <div style={formActionsStyle}>
                    <button
                      type="button"
                      onClick={() =>
                        void uploadEvidence()
                      }
                      disabled={saving}
                      style={primaryButtonStyle}
                    >
                      {saving
                        ? "Uploading..."
                        : "Upload Evidence"}
                    </button>
                  </div>
                </div>

                {evidence.length === 0 ? (
                  <div style={emptyStateStyle}>
                    No qualification evidence has been uploaded.
                  </div>
                ) : (
                  <div style={listStyle}>
                    {evidence.map((record) => (
                      <div
                        key={record.id}
                        style={standardCardStyle}
                      >
                        <div style={cardHeaderStyle}>
                          <div>
                            <div style={eyebrowStyle}>
                              {record.evidence_type}
                            </div>

                            <h4 style={cardTitleStyle}>
                              {record.title}
                            </h4>
                          </div>

                          <div style={mutedStyle}>
                            {new Date(
                              record.uploaded_at
                            ).toLocaleDateString(
                              "en-GB"
                            )}
                          </div>
                        </div>

                        {record.description && (
                          <p style={cardDescriptionStyle}>
                            {record.description}
                          </p>
                        )}

                        <div style={cardActionsStyle}>
                          {(record.file_path ||
                            record.external_url) && (
                            <button
                              type="button"
                              onClick={() =>
                                void openEvidence(
                                  record
                                )
                              }
                              style={
                                secondaryButtonStyle
                              }
                            >
                              Open Evidence
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              void archiveEvidence(
                                record
                              )
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
            )}

            {activeTab === "Verification" && (
              <div>
                <SectionHeading
                  title="Verification"
                  description="Record how the qualification or credential was checked and preserve the verification history."
                />

                <div style={formPanelStyle}>
                  <div style={formGridStyle}>
                    <FormField label="Verification date">
                      <input
                        type="date"
                        value={verificationDate}
                        onChange={(event) =>
                          setVerificationDate(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </FormField>

                    <FormField label="Verification outcome">
                      <select
                        value={verificationStatus}
                        onChange={(event) =>
                          setVerificationStatus(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      >
                        <option>
                          Pending Verification
                        </option>
                        <option>Verified</option>
                        <option>
                          Verification Failed
                        </option>
                        <option>
                          Expired Verification
                        </option>
                      </select>
                    </FormField>
                  </div>

                  <div style={formGridStyle}>
                    <FormField label="Verification method">
                      <select
                        value={verificationMethod}
                        onChange={(event) =>
                          setVerificationMethod(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      >
                        {verificationMethods.map(
                          (method) => (
                            <option key={method}>
                              {method}
                            </option>
                          )
                        )}
                      </select>
                    </FormField>

                    <FormField label="Verified by">
                      <select
                        value={
                          verificationEmployeeId
                        }
                        onChange={(event) =>
                          setVerificationEmployeeId(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      >
                        <option value="">
                          Select employee
                        </option>

                        {employees.map(
                          (employee) => (
                            <option
                              key={employee.id}
                              value={employee.id}
                            >
                              {employee.name}
                            </option>
                          )
                        )}
                      </select>
                    </FormField>
                  </div>

                  <div style={formGridStyle}>
                    <FormField label="Verification reference">
                      <input
                        value={
                          verificationReference
                        }
                        onChange={(event) =>
                          setVerificationReference(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </FormField>

                    <FormField label="Verified with">
                      <input
                        value={verifiedWith}
                        onChange={(event) =>
                          setVerifiedWith(
                            event.target.value
                          )
                        }
                        placeholder="Issuing body, register or named contact"
                        style={inputStyle}
                      />
                    </FormField>
                  </div>

                  <FormField label="Verification summary">
                    <textarea
                      value={verificationSummary}
                      onChange={(event) =>
                        setVerificationSummary(
                          event.target.value
                        )
                      }
                      style={textareaStyle}
                    />
                  </FormField>

                  <FormField label="Concerns or actions">
                    <textarea
                      value={verificationConcerns}
                      onChange={(event) =>
                        setVerificationConcerns(
                          event.target.value
                        )
                      }
                      style={textareaStyle}
                    />
                  </FormField>

                  <FormField label="Next verification date">
                    <input
                      type="date"
                      value={nextVerificationDate}
                      onChange={(event) =>
                        setNextVerificationDate(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <div style={formActionsStyle}>
                    <button
                      type="button"
                      onClick={() =>
                        void recordVerification()
                      }
                      disabled={saving}
                      style={primaryButtonStyle}
                    >
                      {saving
                        ? "Saving..."
                        : "Record Verification"}
                    </button>
                  </div>
                </div>

                {verifications.length === 0 ? (
                  <div style={emptyStateStyle}>
                    No verification history has been recorded.
                  </div>
                ) : (
                  <div style={listStyle}>
                    {verifications.map(
                      (verification) => (
                        <div
                          key={verification.id}
                          style={standardCardStyle}
                        >
                          <div
                            style={cardHeaderStyle}
                          >
                            <div>
                              <div
                                style={eyebrowStyle}
                              >
                                {
                                  verification.verification_status
                                }
                              </div>

                              <h4
                                style={cardTitleStyle}
                              >
                                {formatDate(
                                  verification.verification_date
                                )}
                              </h4>
                            </div>

                            <span
                              style={primaryBadgeStyle}
                            >
                              {
                                verification.verification_method ||
                                "Method not recorded"
                              }
                            </span>
                          </div>

                          {verification.verification_summary && (
                            <p
                              style={
                                cardDescriptionStyle
                              }
                            >
                              {
                                verification.verification_summary
                              }
                            </p>
                          )}

                          {verification.concerns_or_actions && (
                            <div style={noticeStyle}>
                              <strong>
                                Concerns or actions:
                              </strong>{" "}
                              {
                                verification.concerns_or_actions
                              }
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Renewal" && (
              <div>
                <SectionHeading
                  title="Renewal"
                  description="Track renewal activity, costs, providers and replacement dates."
                />

                {!selectedQualification.renewal_required && (
                  <div style={noticeStyle}>
                    This qualification is not currently marked as requiring renewal.
                  </div>
                )}

                <div style={formPanelStyle}>
                  <div style={formGridStyle}>
                    <FormField label="Renewal status">
                      <select
                        value={renewalStatus}
                        onChange={(event) =>
                          setRenewalStatus(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      >
                        {renewalStatuses.map(
                          (status) => (
                            <option key={status}>
                              {status}
                            </option>
                          )
                        )}
                      </select>
                    </FormField>

                    <FormField label="Renewal due date">
                      <input
                        type="date"
                        value={renewalDueDate}
                        onChange={(event) =>
                          setRenewalDueDate(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </FormField>
                  </div>

                  <div style={formGridStyle}>
                    <FormField label="Renewal started">
                      <input
                        type="date"
                        value={renewalStartedDate}
                        onChange={(event) =>
                          setRenewalStartedDate(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </FormField>

                    <FormField label="Renewed date">
                      <input
                        type="date"
                        value={renewedDate}
                        onChange={(event) =>
                          setRenewedDate(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </FormField>
                  </div>

                  <div style={formGridStyle}>
                    <FormField label="New issue date">
                      <input
                        type="date"
                        value={renewalNewIssueDate}
                        onChange={(event) =>
                          setRenewalNewIssueDate(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </FormField>

                    <FormField label="New expiry date">
                      <input
                        type="date"
                        value={renewalNewExpiryDate}
                        onChange={(event) =>
                          setRenewalNewExpiryDate(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </FormField>
                  </div>

                  <div style={formGridStyle}>
                    <FormField label="Renewal method">
                      <input
                        value={renewalMethod}
                        onChange={(event) =>
                          setRenewalMethod(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </FormField>

                    <FormField label="Provider or body">
                      <input
                        value={renewalProvider}
                        onChange={(event) =>
                          setRenewalProvider(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </FormField>
                  </div>

                  <FormField label="Cost">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={renewalCost}
                      onChange={(event) =>
                        setRenewalCost(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Employee notes">
                    <textarea
                      value={renewalEmployeeNotes}
                      onChange={(event) =>
                        setRenewalEmployeeNotes(
                          event.target.value
                        )
                      }
                      style={textareaStyle}
                    />
                  </FormField>

                  <FormField label="Manager notes">
                    <textarea
                      value={renewalManagerNotes}
                      onChange={(event) =>
                        setRenewalManagerNotes(
                          event.target.value
                        )
                      }
                      style={textareaStyle}
                    />
                  </FormField>

                  <div style={formActionsStyle}>
                    <button
                      type="button"
                      onClick={() =>
                        void createRenewal()
                      }
                      disabled={saving}
                      style={primaryButtonStyle}
                    >
                      {saving
                        ? "Saving..."
                        : "Record Renewal"}
                    </button>
                  </div>
                </div>

                {renewals.length === 0 ? (
                  <div style={emptyStateStyle}>
                    No renewal history has been recorded.
                  </div>
                ) : (
                  <div style={listStyle}>
                    {renewals.map((renewal) => (
                      <div
                        key={renewal.id}
                        style={standardCardStyle}
                      >
                        <div style={cardHeaderStyle}>
                          <div>
                            <div style={eyebrowStyle}>
                              Renewal
                            </div>

                            <h4 style={cardTitleStyle}>
                              {renewal.status}
                            </h4>
                          </div>

                          {renewal.renewal_due_date && (
                            <span
                              style={
                                primaryBadgeStyle
                              }
                            >
                              Due{" "}
                              {formatDate(
                                renewal.renewal_due_date
                              )}
                            </span>
                          )}
                        </div>

                        <div
                          style={
                            assignmentDetailGridStyle
                          }
                        >
                          <DetailItem
                            label="Provider"
                            value={
                              renewal.provider_or_body ||
                              "Not recorded"
                            }
                          />

                          <DetailItem
                            label="Method"
                            value={
                              renewal.renewal_method ||
                              "Not recorded"
                            }
                          />

                          <DetailItem
                            label="New Expiry"
                            value={
                              renewal.new_expiry_date
                                ? formatDate(
                                    renewal.new_expiry_date
                                  )
                                : "Not recorded"
                            }
                          />

                          <DetailItem
                            label="Cost"
                            value={
                              renewal.cost_amount !==
                              null
                                ? `${renewal.currency_code} ${Number(
                                    renewal.cost_amount
                                  ).toFixed(2)}`
                                : "Not recorded"
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Requirements" && (
              <div>
                <SectionHeading
                  title="Requirements"
                  description="Link this employee’s qualification to role, department or compliance requirements."
                />

                {linkedRequirements.length === 0 ? (
                  <div style={emptyStateStyle}>
                    No qualification requirements are currently assigned to this employee.
                  </div>
                ) : (
                  <div style={listStyle}>
                    {linkedRequirements.map(
                      (employeeRequirement) => {
                        const requirement =
                          requirementMap.get(
                            employeeRequirement.qualification_requirement_id
                          );

                        return (
                          <div
                            key={
                              employeeRequirement.id
                            }
                            style={
                              standardCardStyle
                            }
                          >
                            <div
                              style={
                                cardHeaderStyle
                              }
                            >
                              <div>
                                <div
                                  style={
                                    eyebrowStyle
                                  }
                                >
                                  Requirement
                                </div>

                                <h4
                                  style={
                                    cardTitleStyle
                                  }
                                >
                                  {requirement?.requirement_title ||
                                    "Qualification requirement"}
                                </h4>
                              </div>

                              <select
                                value={
                                  employeeRequirement.status
                                }
                                onChange={(event) =>
                                  void updateEmployeeRequirement(
                                    employeeRequirement,
                                    event.target
                                      .value
                                  )
                                }
                                style={
                                  statusSelectStyle
                                }
                              >
                                {requirementStatuses.map(
                                  (status) => (
                                    <option
                                      key={status}
                                    >
                                      {status}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>

                            <div
                              style={
                                assignmentDetailGridStyle
                              }
                            >
                              <DetailItem
                                label="Target Role"
                                value={
                                  requirement?.target_role ||
                                  "All roles"
                                }
                              />

                              <DetailItem
                                label="Department"
                                value={
                                  requirement?.target_department ||
                                  "All departments"
                                }
                              />

                              <DetailItem
                                label="Mandatory"
                                value={
                                  requirement?.mandatory
                                    ? "Yes"
                                    : "No"
                                }
                              />

                              <DetailItem
                                label="Required Date"
                                value={
                                  employeeRequirement.required_date
                                    ? formatDate(
                                        employeeRequirement.required_date
                                      )
                                    : "Not set"
                                }
                              />
                            </div>

                            {employeeRequirement.employee_qualification_id !==
                              selectedQualification.id && (
                              <div
                                style={
                                  cardActionsStyle
                                }
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    void linkQualificationToRequirement(
                                      employeeRequirement
                                    )
                                  }
                                  style={
                                    secondaryButtonStyle
                                  }
                                >
                                  Link This Qualification
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Activity" && (
              <div>
                <SectionHeading
                  title="Activity"
                  description="A permanent chronology of evidence, verification, renewal and status activity."
                />

                {activity.length === 0 ? (
                  <div style={emptyStateStyle}>
                    No qualification activity has been recorded.
                  </div>
                ) : (
                  <div style={timelineStyle}>
                    {activity.map((record) => (
                      <div
                        key={record.id}
                        style={timelineItemStyle}
                      >
                        <div style={timelineDotStyle} />

                        <div style={flexStyle}>
                          <div style={cardHeaderStyle}>
                            <div>
                              <div style={eyebrowStyle}>
                                {
                                  record.activity_type
                                }
                              </div>

                              <div
                                style={
                                  timelineSummaryStyle
                                }
                              >
                                {
                                  record.activity_summary
                                }
                              </div>
                            </div>

                            <div style={mutedStyle}>
                              {new Date(
                                record.created_at
                              ).toLocaleString(
                                "en-GB"
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <h2 style={pageTitleStyle}>
            Qualifications & Certificates
          </h2>

          <p style={pageDescriptionStyle}>
            Maintain qualifications, licences, memberships,
            certificates, renewals and verification across the
            organisation.
          </p>
        </div>

        <div style={headerActionsStyle}>
          <button
            type="button"
            onClick={() => {
              setShowRequirementForm(
                !showRequirementForm
              );
              setShowCreateForm(false);
              setMessage("");
              setErrorMessage("");
            }}
            style={secondaryButtonStyle}
          >
            Create Requirement
          </button>

          <button
            type="button"
            onClick={() => {
              resetCreateForm();
              setShowCreateForm(true);
              setShowRequirementForm(false);
              setMessage("");
            }}
            style={primaryButtonStyle}
          >
            Add Qualification
          </button>
        </div>
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

      <div style={summaryGridStyle}>
        <SummaryCard
          label="Total Records"
          value={String(qualifications.length)}
        />

        <SummaryCard
          label="Current"
          value={String(currentCount)}
        />

        <SummaryCard
          label="Due for Renewal"
          value={String(renewalDueCount)}
        />

        <SummaryCard
          label="Expired"
          value={String(expiredCount)}
        />

        <SummaryCard
          label="Pending Verification"
          value={String(
            pendingVerificationCount
          )}
        />

        <SummaryCard
          label="Mandatory"
          value={String(mandatoryCount)}
        />
      </div>

      {showCreateForm && (
        <div style={formPanelStyle}>
          <div style={formHeaderStyle}>
            <div>
              <h3 style={formTitleStyle}>
                Add Qualification or Certificate
              </h3>

              <p style={formDescriptionStyle}>
                Record an employee qualification, licence,
                membership, registration or compliance credential.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                resetCreateForm();
              }}
              style={closeButtonStyle}
            >
              Close
            </button>
          </div>

          <div style={formGridStyle}>
            <FormField label="Employee">
              <select
                value={createEmployeeId}
                onChange={(event) =>
                  setCreateEmployeeId(
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                <option value="">
                  Select employee
                </option>

                {employees.map((employee) => (
                  <option
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.name}
                    {employee.role
                      ? ` · ${employee.role}`
                      : ""}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Qualification type">
              <select
                value={createTypeId}
                onChange={(event) =>
                  applyQualificationType(
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                <option value="">
                  Select or enter manually
                </option>

                {qualificationTypes.map((type) => (
                  <option
                    key={type.id}
                    value={type.id}
                  >
                    {type.name} · {type.category}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div style={formGridStyle}>
            <FormField label="Title">
              <input
                value={createTitle}
                onChange={(event) =>
                  setCreateTitle(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Category">
              <select
                value={createCategory}
                onChange={(event) =>
                  setCreateCategory(
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                {qualificationCategories.map(
                  (category) => (
                    <option key={category}>
                      {category}
                    </option>
                  )
                )}
              </select>
            </FormField>
          </div>

          <div style={formGridStyle}>
            <FormField label="Issuing body">
              <input
                value={createIssuingBody}
                onChange={(event) =>
                  setCreateIssuingBody(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Qualification level">
              <input
                value={createLevel}
                onChange={(event) =>
                  setCreateLevel(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>
          </div>

          <FormField label="Subject or specialism">
            <input
              value={createSpecialism}
              onChange={(event) =>
                setCreateSpecialism(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </FormField>

          <div style={formGridStyle}>
            <FormField label="Registration number">
              <input
                value={createRegistrationNumber}
                onChange={(event) =>
                  setCreateRegistrationNumber(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Certificate number">
              <input
                value={createCertificateNumber}
                onChange={(event) =>
                  setCreateCertificateNumber(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>
          </div>

          <div style={formGridStyle}>
            <FormField label="Membership number">
              <input
                value={createMembershipNumber}
                onChange={(event) =>
                  setCreateMembershipNumber(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Licence number">
              <input
                value={createLicenceNumber}
                onChange={(event) =>
                  setCreateLicenceNumber(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>
          </div>

          <div style={formGridStyle}>
            <FormField label="Issue date">
              <input
                type="date"
                value={createIssueDate}
                onChange={(event) => {
                  const nextDate =
                    event.target.value;

                  setCreateIssueDate(nextDate);

                  const selectedType =
                    qualificationTypes.find(
                      (type) =>
                        type.id ===
                        Number(createTypeId)
                    );

                  if (
                    nextDate &&
                    selectedType?.default_validity_months
                  ) {
                    setCreateExpiryDate(
                      addMonthsToDate(
                        nextDate,
                        selectedType.default_validity_months
                      )
                    );
                  }
                }}
                style={inputStyle}
              />
            </FormField>

            <FormField label="Valid from">
              <input
                type="date"
                value={createValidFrom}
                onChange={(event) =>
                  setCreateValidFrom(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>
          </div>

          <div style={formGridStyle}>
            <FormField label="Expiry date">
              <input
                type="date"
                value={createExpiryDate}
                onChange={(event) =>
                  setCreateExpiryDate(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Renewal date">
              <input
                type="date"
                value={createRenewalDate}
                onChange={(event) =>
                  setCreateRenewalDate(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>
          </div>

          <div style={formGridStyle}>
            <FormField label="Status">
              <select
                value={createStatus}
                onChange={(event) =>
                  setCreateStatus(
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                {qualificationStatuses.map(
                  (status) => (
                    <option key={status}>
                      {status}
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField label="Verification status">
              <select
                value={
                  createVerificationStatus
                }
                onChange={(event) =>
                  setCreateVerificationStatus(
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                {verificationStatuses.map(
                  (status) => (
                    <option key={status}>
                      {status}
                    </option>
                  )
                )}
              </select>
            </FormField>
          </div>

          <div style={optionGridStyle}>
            <CheckboxField
              label="Mandatory"
              description="This credential is mandatory for the employee or role."
              checked={createMandatory}
              onChange={setCreateMandatory}
            />

            <CheckboxField
              label="Renewal required"
              description="This credential must be renewed."
              checked={createRenewalRequired}
              onChange={
                setCreateRenewalRequired
              }
            />
          </div>

          {createRenewalRequired && (
            <FormField label="Renewal reminder days">
              <input
                type="number"
                min="1"
                value={
                  createRenewalReminderDays
                }
                onChange={(event) =>
                  setCreateRenewalReminderDays(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>
          )}

          <FormField label="Employee notes">
            <textarea
              value={createEmployeeNotes}
              onChange={(event) =>
                setCreateEmployeeNotes(
                  event.target.value
                )
              }
              style={textareaStyle}
            />
          </FormField>

          <FormField label="Manager notes">
            <textarea
              value={createManagerNotes}
              onChange={(event) =>
                setCreateManagerNotes(
                  event.target.value
                )
              }
              style={textareaStyle}
            />
          </FormField>

          <div style={formActionsStyle}>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                resetCreateForm();
              }}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() =>
                void createQualification()
              }
              disabled={saving}
              style={primaryButtonStyle}
            >
              {saving
                ? "Saving..."
                : "Add Qualification"}
            </button>
          </div>
        </div>
      )}

      {showRequirementForm && (
        <div style={formPanelStyle}>
          <div style={formHeaderStyle}>
            <div>
              <h3 style={formTitleStyle}>
                Create Qualification Requirement
              </h3>

              <p style={formDescriptionStyle}>
                Define a role, department, location or
                employment requirement.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowRequirementForm(false)
              }
              style={closeButtonStyle}
            >
              Close
            </button>
          </div>

          <div style={formGridStyle}>
            <FormField label="Requirement title">
              <input
                value={requirementTitle}
                onChange={(event) =>
                  setRequirementTitle(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Qualification type">
              <select
                value={requirementTypeId}
                onChange={(event) =>
                  setRequirementTypeId(
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                <option value="">
                  No specific type
                </option>

                {qualificationTypes.map((type) => (
                  <option
                    key={type.id}
                    value={type.id}
                  >
                    {type.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div style={formGridStyle}>
            <FormField label="Target role">
              <input
                value={requirementRole}
                onChange={(event) =>
                  setRequirementRole(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Target department">
              <input
                value={
                  requirementDepartment
                }
                onChange={(event) =>
                  setRequirementDepartment(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>
          </div>

          <div style={formGridStyle}>
            <FormField label="Target location">
              <input
                value={requirementLocation}
                onChange={(event) =>
                  setRequirementLocation(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Employment status">
              <input
                value={
                  requirementEmploymentStatus
                }
                onChange={(event) =>
                  setRequirementEmploymentStatus(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>
          </div>

          <div style={optionGridStyle}>
            <CheckboxField
              label="Mandatory"
              description="Employees within scope must hold this credential."
              checked={requirementMandatory}
              onChange={
                setRequirementMandatory
              }
            />

            <CheckboxField
              label="Required before start"
              description="The credential must be confirmed before employment or duties begin."
              checked={requirementBeforeStart}
              onChange={
                setRequirementBeforeStart
              }
            />
          </div>

          <div style={formGridStyle}>
            <FormField label="Grace period days">
              <input
                type="number"
                min="0"
                value={requirementGraceDays}
                onChange={(event) =>
                  setRequirementGraceDays(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Minimum level">
              <input
                value={
                  requirementMinimumLevel
                }
                onChange={(event) =>
                  setRequirementMinimumLevel(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>
          </div>

          <FormField label="Regulator or authority">
            <input
              value={requirementAuthority}
              onChange={(event) =>
                setRequirementAuthority(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </FormField>

          <FormField label="Requirement reason">
            <textarea
              value={requirementReason}
              onChange={(event) =>
                setRequirementReason(
                  event.target.value
                )
              }
              style={textareaStyle}
            />
          </FormField>

          <div style={formGridStyle}>
            <FormField label="Review frequency months">
              <input
                type="number"
                min="1"
                value={
                  requirementReviewMonths
                }
                onChange={(event) =>
                  setRequirementReviewMonths(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Next review date">
              <input
                type="date"
                value={
                  requirementNextReviewDate
                }
                onChange={(event) =>
                  setRequirementNextReviewDate(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>
          </div>

          <div style={formActionsStyle}>
            <button
              type="button"
              onClick={() =>
                setShowRequirementForm(false)
              }
              style={secondaryButtonStyle}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() =>
                void createRequirement()
              }
              disabled={saving}
              style={primaryButtonStyle}
            >
              {saving
                ? "Saving..."
                : "Create Requirement"}
            </button>
          </div>
        </div>
      )}

      <div style={toolbarStyle}>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(
              event.target.value
            )
          }
          placeholder="Search employee, qualification or issuing body..."
          style={inputStyle}
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
          style={inputStyle}
        >
          <option value="All">
            All statuses
          </option>

          {qualificationStatuses.map(
            (status) => (
              <option key={status}>
                {status}
              </option>
            )
          )}
        </select>

        <select
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(
              event.target.value
            )
          }
          style={inputStyle}
        >
          <option value="All">
            All categories
          </option>

          {qualificationCategories.map(
            (category) => (
              <option key={category}>
                {category}
              </option>
            )
          )}
        </select>

        <select
          value={employeeFilter}
          onChange={(event) =>
            setEmployeeFilter(
              event.target.value
            )
          }
          style={inputStyle}
        >
          <option value="All">
            All employees
          </option>

          {employees.map((employee) => (
            <option
              key={employee.id}
              value={employee.id}
            >
              {employee.name}
            </option>
          ))}
        </select>

        <select
          value={verificationFilter}
          onChange={(event) =>
            setVerificationFilter(
              event.target.value
            )
          }
          style={inputStyle}
        >
          <option value="All">
            All verification statuses
          </option>

          {verificationStatuses.map(
            (status) => (
              <option key={status}>
                {status}
              </option>
            )
          )}
        </select>
      </div>

      {loading ? (
        <div style={emptyStateStyle}>
          Loading qualifications and certificates...
        </div>
      ) : filteredQualifications.length ===
        0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyIconStyle}>
            ✦
          </div>

          <h3 style={emptyTitleStyle}>
            No qualifications or certificates found
          </h3>

          <p style={emptyDescriptionStyle}>
            Add the organisation’s first qualification record
            or adjust the current filters.
          </p>
        </div>
      ) : (
        <div style={recordGridStyle}>
          {filteredQualifications.map(
            (qualification) => {
              const employee =
                employeeMap.get(
                  qualification.employee_id
                );

              const expired =
                Boolean(
                  qualification.expiry_date
                ) &&
                qualification.expiry_date! <
                  getTodayDate();

              const dueSoon =
                Boolean(
                  qualification.expiry_date
                ) &&
                !expired &&
                daysBetween(
                  getTodayDate(),
                  qualification.expiry_date!
                ) <=
                  (qualification.renewal_reminder_days ||
                    30);

              return (
                <button
                  key={qualification.id}
                  type="button"
                  onClick={() =>
                    setSelectedQualification(
                      qualification
                    )
                  }
                  style={recordCardStyle}
                >
                  <div style={cardHeaderStyle}>
                    <div>
                      <div style={badgeRowStyle}>
                        <span
                          style={
                            primaryBadgeStyle
                          }
                        >
                          {expired
                            ? "Expired"
                            : dueSoon
                              ? "Due for Renewal"
                              : qualification.status}
                        </span>

                        <span
                          style={
                            secondaryBadgeStyle
                          }
                        >
                          {
                            qualification.category
                          }
                        </span>
                      </div>

                      <h3
                        style={
                          recordCardTitleStyle
                        }
                      >
                        {qualification.title}
                      </h3>
                    </div>

                    {qualification.mandatory && (
                      <span
                        style={
                          secondaryBadgeStyle
                        }
                      >
                        Mandatory
                      </span>
                    )}
                  </div>

                  <div
                    style={
                      recordEmployeeStyle
                    }
                  >
                    {employee?.name ||
                      `Employee ${qualification.employee_id}`}
                    {employee?.role
                      ? ` · ${employee.role}`
                      : ""}
                  </div>

                  <div
                    style={
                      assignmentDetailGridStyle
                    }
                  >
                    <DetailItem
                      label="Issuing Body"
                      value={
                        qualification.issuing_body ||
                        "Not recorded"
                      }
                    />

                    <DetailItem
                      label="Reference"
                      value={
                        getQualificationReference(
                          qualification
                        ) || "Not recorded"
                      }
                    />

                    <DetailItem
                      label="Expiry"
                      value={
                        qualification.expiry_date
                          ? formatDate(
                              qualification.expiry_date
                            )
                          : "Does not expire"
                      }
                    />

                    <DetailItem
                      label="Verification"
                      value={
                        qualification.verification_status
                      }
                    />
                  </div>
                </button>
              );
            }
          )}
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

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={detailCardStyle}>
      <div style={detailLabelStyle}>
        {label}
      </div>

      <div style={detailCardValueStyle}>
        {value}
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

function getQualificationReference(
  qualification: EmployeeQualification
): string {
  return (
    qualification.certificate_number ||
    qualification.registration_number ||
    qualification.membership_number ||
    qualification.licence_number ||
    ""
  );
}

function deriveQualificationStatus(
  currentStatus: string,
  expiryDate: string,
  renewalRequired: boolean
): string {
  if (!expiryDate) {
    return currentStatus;
  }

  const today = getTodayDate();

  if (expiryDate < today) {
    return "Expired";
  }

  if (
    renewalRequired &&
    daysBetween(today, expiryDate) <= 30
  ) {
    return "Due for Renewal";
  }

  if (
    currentStatus === "Expired" ||
    currentStatus === "Due for Renewal"
  ) {
    return "Current";
  }

  return currentStatus;
}

function getTodayDate(): string {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function addMonthsToDate(
  value: string,
  months: number
): string {
  const date = new Date(`${value}T12:00:00`);

  date.setMonth(date.getMonth() + months);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function daysBetween(
  startDate: string,
  endDate: string
): number {
  const start = new Date(
    `${startDate}T12:00:00`
  ).getTime();

  const end = new Date(
    `${endDate}T12:00:00`
  ).getTime();

  return Math.ceil(
    (end - start) /
      (1000 * 60 * 60 * 24)
  );
}

const pageHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  marginBottom: "18px",
};

const headerActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const pageTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const pageDescriptionStyle: React.CSSProperties = {
  maxWidth: "780px",
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.5,
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const archiveButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const backButtonStyle: React.CSSProperties = {
  padding: 0,
  marginBottom: "16px",
  background: "transparent",
  border: "none",
  color: "#6E5084",
  fontWeight: 700,
  cursor: "pointer",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "10px",
  marginBottom: "18px",
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
  gridTemplateColumns:
    "minmax(250px, 1fr) 180px 190px 190px 210px",
  gap: "10px",
  marginBottom: "18px",
};

const formPanelStyle: React.CSSProperties = {
  padding: "18px",
  marginBottom: "18px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "14px",
};

const formHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
};

const formTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const formDescriptionStyle: React.CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.5,
};

const closeButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#6B7280",
  fontWeight: 700,
  cursor: "pointer",
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
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  boxSizing: "border-box",
  background: "#FFFFFF",
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

const checkboxCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "12px",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  background: "#FFFFFF",
  cursor: "pointer",
};

const checkboxTitleStyle: React.CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 700,
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

const splitActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  marginTop: "18px",
};

const recordGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "13px",
};

const recordCardStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "13px",
  textAlign: "left",
  cursor: "pointer",
};

const recordCardTitleStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#111827",
  fontSize: "16px",
};

const recordEmployeeStyle: React.CSSProperties = {
  marginTop: "10px",
  color: "#4B5563",
  fontSize: "13px",
  fontWeight: 700,
};

const workspaceHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  padding: "20px",
  marginBottom: "16px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "14px",
};

const workspaceTitleStyle: React.CSSProperties = {
  margin: "9px 0 0",
  color: "#111827",
};

const workspaceDescriptionStyle: React.CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "14px",
};

const referenceSummaryStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "13px",
  fontWeight: 800,
  whiteSpace: "nowrap",
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

const tabNavigationStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const tabButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
  padding: "9px 12px",
  fontWeight: 700,
  cursor: "pointer",
};

const activeTabButtonStyle: React.CSSProperties = {
  ...tabButtonStyle,
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
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
  lineHeight: 1.5,
};

const detailGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "10px",
  marginBottom: "16px",
};

const detailCardStyle: React.CSSProperties = {
  padding: "14px",
  border: "1px solid #E5E7EB",
  borderRadius: "11px",
  background: "#FFFFFF",
};

const detailLabelStyle: React.CSSProperties = {
  color: "#9CA3AF",
  fontSize: "11px",
};

const detailCardValueStyle: React.CSSProperties = {
  marginTop: "5px",
  color: "#111827",
  fontSize: "14px",
  fontWeight: 700,
};

const detailValueStyle: React.CSSProperties = {
  marginTop: "3px",
  color: "#374151",
  fontSize: "12px",
  fontWeight: 700,
};

const assignmentDetailGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "12px",
  marginTop: "14px",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "11px",
};

const standardCardStyle: React.CSSProperties = {
  padding: "15px",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  background: "#FFFFFF",
};

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "10px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
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

const statusSelectStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
  background: "#FFFFFF",
};

const noticeStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "14px",
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #E8DDF0",
  borderRadius: "10px",
  fontSize: "13px",
  lineHeight: 1.5,
};

const timelineStyle: React.CSSProperties = {
  display: "grid",
};

const timelineItemStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  padding: "13px 0",
  borderBottom: "1px solid #E5E7EB",
};

const timelineDotStyle: React.CSSProperties = {
  flexShrink: 0,
  width: "10px",
  height: "10px",
  marginTop: "5px",
  background: "#6E5084",
  borderRadius: "999px",
};

const flexStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const timelineSummaryStyle: React.CSSProperties = {
  marginTop: "4px",
  color: "#374151",
  fontSize: "14px",
  fontWeight: 600,
};

const mutedStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "12px",
};

const emptyStateStyle: React.CSSProperties = {
  padding: "30px 20px",
  border: "1px dashed #D1D5DB",
  borderRadius: "13px",
  background: "#F9FAFB",
  color: "#6B7280",
  textAlign: "center",
};

const emptyIconStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "22px",
  marginBottom: "8px",
};

const emptyTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const emptyDescriptionStyle: React.CSSProperties = {
  margin: "7px 0 0",
  fontSize: "14px",
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