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

type LearningModule = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  learning_type: string;
  delivery_method: string;
  estimated_duration_minutes: number | null;
  assessment_required: boolean;
  certificate_available: boolean;
  manager_validation_required: boolean;
};

type LearningSection = {
  id: number;
  learning_module_id: number;
  title: string;
  section_type: string;
  sequence_number: number;
  completion_required: boolean;
  manager_validation_required: boolean;
  evidence_required: boolean;
};

type LearningAssignment = {
  id: number;
  learning_module_id: number;
  employee_id: number;
  assigned_date: string;
  due_date: string | null;
  status: string;
  progress_percent: number;
  started_at: string | null;
  completed_date: string | null;
  completed_at: string | null;
  completion_confirmed_at: string | null;
  completion_confirmed_by: number | null;
  manager_validation_required: boolean;
  manager_validation_status: string;
  assessment_required: boolean;
  certificate_issued: boolean;
  certificate_issued_at: string | null;
  certificate_reference: string | null;
  assignment_source: string;
  source_reference_type: string | null;
  source_reference_id: number | null;
  employee_notes: string | null;
  manager_notes: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
};

type SectionProgress = {
  id: number;
  learning_assignment_id: number;
  learning_module_id: number;
  learning_section_id: number;
  employee_id: number;
  status: string;
  progress_percent: number;
  started_at: string | null;
  completed_at: string | null;
  time_spent_seconds: number | null;
  employee_notes: string | null;
  manager_notes: string | null;
};

type AssessmentAttempt = {
  id: number;
  learning_assignment_id: number;
  learning_module_id: number;
  employee_id: number;
  attempt_number: number;
  status: string;
  total_questions: number;
  total_points_available: number;
  points_awarded: number;
  score_percent: number | null;
  pass_mark: number | null;
  started_at: string;
  submitted_at: string | null;
  completed_at: string | null;
};

type LearningEvidence = {
  id: number;
  learning_assignment_id: number;
  learning_module_id: number;
  learning_section_id: number | null;
  employee_id: number;
  evidence_type: string;
  title: string;
  description: string | null;
  file_name: string | null;
  file_path: string | null;
  external_url: string | null;
  submitted_at: string;
  review_status: string;
  reviewed_by: number | null;
  reviewed_at: string | null;
  reviewer_comments: string | null;
};

type ManagerValidation = {
  id: number;
  learning_assignment_id: number;
  learning_module_id: number;
  learning_section_id: number | null;
  employee_id: number;
  manager_employee_id: number | null;
  validation_type: string;
  status: string;
  requested_at: string;
  validated_at: string | null;
  validation_summary: string | null;
  further_action_required: string | null;
};

type ActivityRecord = {
  id: number;
  learning_assignment_id: number | null;
  learning_module_id: number | null;
  employee_id: number | null;
  activity_type: string;
  activity_summary: string;
  activity_details: Record<string, unknown> | null;
  created_at: string;
};

type IssuedCertificate = {
  id: number;
  learning_assignment_id: number;
  learning_module_id: number;
  employee_id: number;
  certificate_title: string;
  certificate_reference: string;
  issue_date: string;
  expiry_date: string | null;
  status: string;
  file_name: string | null;
  file_path: string | null;
  notes: string | null;
};

type WorkspaceTab =
  | "Overview"
  | "Progress"
  | "Assessment"
  | "Evidence"
  | "Validation"
  | "Certificate"
  | "Activity";

const assignmentStatuses = [
  "Assigned",
  "In Progress",
  "Completed",
  "Cancelled",
];

const sectionStatuses = [
  "Not Started",
  "Available",
  "In Progress",
  "Awaiting Validation",
  "Completed",
  "Skipped",
  "Not Required",
];

const evidenceTypes = [
  "File",
  "Document",
  "Image",
  "Video",
  "External Link",
  "Written Evidence",
  "Manager Observation",
  "Practical Demonstration",
  "Other",
];

const evidenceReviewStatuses = [
  "Submitted",
  "Under Review",
  "Accepted",
  "Further Evidence Required",
  "Rejected",
];

const validationStatuses = [
  "Awaiting Validation",
  "Validated",
  "Further Action Required",
  "Declined",
  "Not Required",
];

export default function LearningWorkspace() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [assignments, setAssignments] = useState<
    LearningAssignment[]
  >([]);

  const [selectedAssignment, setSelectedAssignment] =
    useState<LearningAssignment | null>(null);

  const [activeTab, setActiveTab] =
    useState<WorkspaceTab>("Overview");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [moduleFilter, setModuleFilter] = useState("All");

  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignmentEmployeeId, setAssignmentEmployeeId] =
    useState("");
  const [assignmentModuleId, setAssignmentModuleId] =
    useState("");
  const [assignmentDueDate, setAssignmentDueDate] =
    useState("");
  const [assignmentSource, setAssignmentSource] =
    useState("Direct");
  const [assignmentManagerNotes, setAssignmentManagerNotes] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] =
    useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [sections, setSections] = useState<LearningSection[]>([]);
  const [sectionProgress, setSectionProgress] = useState<
    SectionProgress[]
  >([]);
  const [assessmentAttempts, setAssessmentAttempts] = useState<
    AssessmentAttempt[]
  >([]);
  const [evidence, setEvidence] = useState<LearningEvidence[]>([]);
  const [validations, setValidations] = useState<
    ManagerValidation[]
  >([]);
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [certificate, setCertificate] =
    useState<IssuedCertificate | null>(null);

  const [overviewStatus, setOverviewStatus] =
    useState("Assigned");
  const [overviewProgress, setOverviewProgress] = useState("0");
  const [overviewDueDate, setOverviewDueDate] = useState("");
  const [overviewEmployeeNotes, setOverviewEmployeeNotes] =
    useState("");
  const [overviewManagerNotes, setOverviewManagerNotes] =
    useState("");

  const [evidenceType, setEvidenceType] = useState("File");
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceDescription, setEvidenceDescription] =
    useState("");
  const [evidenceExternalUrl, setEvidenceExternalUrl] =
    useState("");
  const [evidenceSectionId, setEvidenceSectionId] =
    useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(
    null
  );

  const [validationType, setValidationType] =
    useState("Completion");
  const [validationManagerId, setValidationManagerId] =
    useState("");
  const [validationSummary, setValidationSummary] =
    useState("");
  const [validationFurtherAction, setValidationFurtherAction] =
    useState("");

  const [certificateTitle, setCertificateTitle] = useState("");
  const [certificateReference, setCertificateReference] =
    useState("");
  const [certificateIssueDate, setCertificateIssueDate] =
    useState(getTodayDate());
  const [certificateExpiryDate, setCertificateExpiryDate] =
    useState("");
  const [certificateNotes, setCertificateNotes] = useState("");

  useEffect(() => {
    void loadPageData();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      populateOverview(selectedAssignment);
      void loadAssignmentWorkspace(selectedAssignment);
    }
  }, [selectedAssignment?.id]);

  async function loadPageData() {
    setLoading(true);
    setErrorMessage("");

    const [employeeResult, moduleResult, assignmentResult] =
      await Promise.all([
        supabase
          .from("employees")
          .select("id, name, role, status")
          .neq("status", "Archived")
          .order("name"),

        supabase
          .from("learning_modules")
          .select(
            `
            id,
            title,
            description,
            status,
            learning_type,
            delivery_method,
            estimated_duration_minutes,
            assessment_required,
            certificate_available,
            manager_validation_required
            `
          )
          .eq("is_archived", false)
          .order("title"),

        supabase
          .from("learning_assignments")
          .select("*")
          .eq("is_archived", false)
          .order("updated_at", { ascending: false }),
      ]);

    if (employeeResult.error) {
      console.error("Error loading employees:", employeeResult.error);
      setErrorMessage("Employees could not be loaded.");
      setLoading(false);
      return;
    }

    if (moduleResult.error) {
      console.error(
        "Error loading learning modules:",
        moduleResult.error
      );
      setErrorMessage("Learning modules could not be loaded.");
      setLoading(false);
      return;
    }

    if (assignmentResult.error) {
      console.error(
        "Error loading learning assignments:",
        assignmentResult.error
      );
      setErrorMessage("Learning assignments could not be loaded.");
      setLoading(false);
      return;
    }

    setEmployees((employeeResult.data || []) as Employee[]);
    setModules((moduleResult.data || []) as LearningModule[]);
    setAssignments(
      (assignmentResult.data || []) as LearningAssignment[]
    );

    setLoading(false);
  }

  async function loadAssignmentWorkspace(
    assignment: LearningAssignment
  ) {
    setWorkspaceLoading(true);
    setErrorMessage("");

    const [
      sectionsResult,
      progressResult,
      attemptsResult,
      evidenceResult,
      validationsResult,
      activityResult,
      certificateResult,
    ] = await Promise.all([
      supabase
        .from("learning_module_sections")
        .select(
          `
          id,
          learning_module_id,
          title,
          section_type,
          sequence_number,
          completion_required,
          manager_validation_required,
          evidence_required
          `
        )
        .eq("learning_module_id", assignment.learning_module_id)
        .eq("is_archived", false)
        .order("sequence_number"),

      supabase
        .from("learning_section_progress")
        .select("*")
        .eq("learning_assignment_id", assignment.id)
        .order("id"),

      supabase
        .from("learning_assessment_attempts")
        .select("*")
        .eq("learning_assignment_id", assignment.id)
        .order("attempt_number", { ascending: false }),

      supabase
        .from("learning_evidence")
        .select("*")
        .eq("learning_assignment_id", assignment.id)
        .eq("is_archived", false)
        .order("submitted_at", { ascending: false }),

      supabase
        .from("learning_manager_validations")
        .select("*")
        .eq("learning_assignment_id", assignment.id)
        .eq("is_archived", false)
        .order("requested_at", { ascending: false }),

      supabase
        .from("learning_activity_history")
        .select("*")
        .eq("learning_assignment_id", assignment.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("learning_certificates_issued")
        .select("*")
        .eq("learning_assignment_id", assignment.id)
        .eq("is_archived", false)
        .maybeSingle(),
    ]);

    const firstError =
      sectionsResult.error ||
      progressResult.error ||
      attemptsResult.error ||
      evidenceResult.error ||
      validationsResult.error ||
      activityResult.error ||
      certificateResult.error;

    if (firstError) {
      console.error(
        "Error loading learning assignment workspace:",
        firstError
      );
      setErrorMessage(
        "The learning assignment workspace could not be loaded."
      );
      setWorkspaceLoading(false);
      return;
    }

    const loadedSections =
      (sectionsResult.data || []) as LearningSection[];

    let loadedProgress =
      (progressResult.data || []) as SectionProgress[];

    if (
      loadedProgress.length === 0 &&
      loadedSections.length > 0
    ) {
      const { data: createdProgress, error: progressCreateError } =
        await supabase
          .from("learning_section_progress")
          .insert(
            loadedSections.map((section, index) => ({
              learning_assignment_id: assignment.id,
              learning_module_id: assignment.learning_module_id,
              learning_section_id: section.id,
              employee_id: assignment.employee_id,
              status: index === 0 ? "Available" : "Not Started",
              progress_percent: 0,
            }))
          )
          .select("*");

      if (!progressCreateError) {
        loadedProgress =
          (createdProgress || []) as SectionProgress[];
      }
    }

    setSections(loadedSections);
    setSectionProgress(loadedProgress);
    setAssessmentAttempts(
      (attemptsResult.data || []) as AssessmentAttempt[]
    );
    setEvidence((evidenceResult.data || []) as LearningEvidence[]);
    setValidations(
      (validationsResult.data || []) as ManagerValidation[]
    );
    setActivity((activityResult.data || []) as ActivityRecord[]);
    setCertificate(
      certificateResult.data
        ? (certificateResult.data as IssuedCertificate)
        : null
    );

    setWorkspaceLoading(false);
  }

  function populateOverview(assignment: LearningAssignment) {
    setOverviewStatus(assignment.status);
    setOverviewProgress(String(assignment.progress_percent));
    setOverviewDueDate(assignment.due_date || "");
    setOverviewEmployeeNotes(assignment.employee_notes || "");
    setOverviewManagerNotes(assignment.manager_notes || "");
  }

  async function assignLearning() {
    if (!assignmentEmployeeId) {
      setErrorMessage("Select an employee.");
      return;
    }

    if (!assignmentModuleId) {
      setErrorMessage("Select a learning resource.");
      return;
    }

    const selectedModule = modules.find(
      (module) => module.id === Number(assignmentModuleId)
    );

    if (!selectedModule) {
      setErrorMessage("The selected learning resource was not found.");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const { data: createdAssignment, error } = await supabase
      .from("learning_assignments")
      .insert({
        learning_module_id: selectedModule.id,
        employee_id: Number(assignmentEmployeeId),
        assigned_date: getTodayDate(),
        due_date: assignmentDueDate || null,
        status: "Assigned",
        progress_percent: 0,
        assignment_source: assignmentSource,
        manager_notes: assignmentManagerNotes.trim() || null,
        manager_validation_required:
          selectedModule.manager_validation_required,
        manager_validation_status:
          selectedModule.manager_validation_required
            ? "Awaiting Validation"
            : "Not Required",
        assessment_required: selectedModule.assessment_required,
        certificate_issued: false,
        last_activity_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error || !createdAssignment) {
      console.error("Error assigning learning:", error);
      setErrorMessage(
        error?.code === "23505"
          ? "This learning is already actively assigned to that employee."
          : "The learning could not be assigned."
      );
      setSaving(false);
      return;
    }

    const { data: moduleSections } = await supabase
      .from("learning_module_sections")
      .select("id, sequence_number")
      .eq("learning_module_id", selectedModule.id)
      .eq("is_archived", false)
      .order("sequence_number");

    if (moduleSections && moduleSections.length > 0) {
      await supabase.from("learning_section_progress").insert(
        moduleSections.map((section, index) => ({
          learning_assignment_id: createdAssignment.id,
          learning_module_id: selectedModule.id,
          learning_section_id: section.id,
          employee_id: Number(assignmentEmployeeId),
          status: index === 0 ? "Available" : "Not Started",
          progress_percent: 0,
        }))
      );
    }

    await recordActivity({
      assignmentId: createdAssignment.id,
      moduleId: selectedModule.id,
      employeeId: Number(assignmentEmployeeId),
      activityType: "Assigned",
      summary: `${selectedModule.title} assigned.`,
      details: {
        due_date: assignmentDueDate || null,
        assignment_source: assignmentSource,
      },
    });

    setAssignmentEmployeeId("");
    setAssignmentModuleId("");
    setAssignmentDueDate("");
    setAssignmentSource("Direct");
    setAssignmentManagerNotes("");
    setShowAssignForm(false);
    setMessage("Learning assigned.");
    setSaving(false);

    await loadPageData();

    setSelectedAssignment(
      createdAssignment as LearningAssignment
    );
  }

  async function saveOverview() {
    if (!selectedAssignment) return;

    const numericProgress = Math.min(
      100,
      Math.max(0, Number(overviewProgress))
    );

    const completed = overviewStatus === "Completed";

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const { data, error } = await supabase
      .from("learning_assignments")
      .update({
        status: overviewStatus,
        progress_percent: completed ? 100 : numericProgress,
        due_date: overviewDueDate || null,
        employee_notes: overviewEmployeeNotes.trim() || null,
        manager_notes: overviewManagerNotes.trim() || null,
        started_at:
          overviewStatus === "In Progress" &&
          !selectedAssignment.started_at
            ? new Date().toISOString()
            : selectedAssignment.started_at,
        completed_date: completed ? getTodayDate() : null,
        completed_at: completed ? new Date().toISOString() : null,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", selectedAssignment.id)
      .select("*")
      .single();

    if (error || !data) {
      console.error("Error updating learning assignment:", error);
      setErrorMessage(
        "The learning assignment could not be updated."
      );
      setSaving(false);
      return;
    }

    await recordActivity({
      assignmentId: selectedAssignment.id,
      moduleId: selectedAssignment.learning_module_id,
      employeeId: selectedAssignment.employee_id,
      activityType:
        overviewStatus === "Completed"
          ? "Learning Completed"
          : "Status Changed",
      summary:
        overviewStatus === "Completed"
          ? "Learning marked as completed."
          : `Learning status changed to ${overviewStatus}.`,
      details: {
        progress_percent: completed ? 100 : numericProgress,
        due_date: overviewDueDate || null,
      },
    });

    setSelectedAssignment(data as LearningAssignment);
    setMessage("Learning assignment updated.");
    setSaving(false);

    await loadPageData();
    await loadAssignmentWorkspace(data as LearningAssignment);
  }

  async function updateSectionProgress(
    progress: SectionProgress,
    nextStatus: string
  ) {
    if (!selectedAssignment) return;

    const completed = nextStatus === "Completed";

    const { error } = await supabase
      .from("learning_section_progress")
      .update({
        status: nextStatus,
        progress_percent: completed
          ? 100
          : nextStatus === "In Progress"
            ? 50
            : 0,
        started_at:
          nextStatus === "In Progress" && !progress.started_at
            ? new Date().toISOString()
            : progress.started_at,
        completed_at: completed
          ? new Date().toISOString()
          : null,
      })
      .eq("id", progress.id);

    if (error) {
      setErrorMessage(
        "The learning section progress could not be updated."
      );
      return;
    }

    const updatedRecords = sectionProgress.map((record) =>
      record.id === progress.id
        ? {
            ...record,
            status: nextStatus,
            progress_percent: completed
              ? 100
              : nextStatus === "In Progress"
                ? 50
                : 0,
          }
        : record
    );

    const requiredSectionIds = new Set(
      sections
        .filter((section) => section.completion_required)
        .map((section) => section.id)
    );

    const requiredProgress = updatedRecords.filter((record) =>
      requiredSectionIds.has(record.learning_section_id)
    );

    const completedRequiredCount = requiredProgress.filter(
      (record) =>
        record.status === "Completed" ||
        record.status === "Not Required"
    ).length;

    const overallProgress =
      requiredProgress.length > 0
        ? Math.round(
            (completedRequiredCount / requiredProgress.length) * 100
          )
        : 0;

    const overallCompleted =
      requiredProgress.length > 0 &&
      completedRequiredCount === requiredProgress.length;

    const { data: updatedAssignment } = await supabase
      .from("learning_assignments")
      .update({
        progress_percent: overallProgress,
        status: overallCompleted
          ? selectedAssignment.assessment_required ||
            selectedAssignment.manager_validation_required
            ? "In Progress"
            : "Completed"
          : overallProgress > 0
            ? "In Progress"
            : "Assigned",
        completed_date:
          overallCompleted &&
          !selectedAssignment.assessment_required &&
          !selectedAssignment.manager_validation_required
            ? getTodayDate()
            : null,
        completed_at:
          overallCompleted &&
          !selectedAssignment.assessment_required &&
          !selectedAssignment.manager_validation_required
            ? new Date().toISOString()
            : null,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", selectedAssignment.id)
      .select("*")
      .single();

    const section = sections.find(
      (item) => item.id === progress.learning_section_id
    );

    await recordActivity({
      assignmentId: selectedAssignment.id,
      moduleId: selectedAssignment.learning_module_id,
      employeeId: selectedAssignment.employee_id,
      activityType: completed
        ? "Section Completed"
        : nextStatus === "In Progress"
          ? "Section Started"
          : "Status Changed",
      summary: `${section?.title || "Learning section"} changed to ${nextStatus}.`,
      details: {
        learning_section_id: progress.learning_section_id,
        overall_progress_percent: overallProgress,
      },
    });

    if (updatedAssignment) {
      setSelectedAssignment(
        updatedAssignment as LearningAssignment
      );
      populateOverview(
        updatedAssignment as LearningAssignment
      );
    }

    await loadPageData();
    await loadAssignmentWorkspace(
      (updatedAssignment ||
        selectedAssignment) as LearningAssignment
    );
  }
    async function startAssessmentAttempt() {
    if (!selectedAssignment) return;

    const module = modules.find(
      (item) =>
        item.id === selectedAssignment.learning_module_id
    );

    const { data: assessmentSettings } = await supabase
      .from("learning_assessments")
      .select("pass_mark, max_attempts")
      .eq(
        "learning_module_id",
        selectedAssignment.learning_module_id
      )
      .maybeSingle();

    const { data: questions } = await supabase
      .from("learning_assessment_questions")
      .select("id, points")
      .eq(
        "learning_module_id",
        selectedAssignment.learning_module_id
      )
      .eq("is_archived", false);

    const nextAttemptNumber =
      assessmentAttempts.length === 0
        ? 1
        : Math.max(
            ...assessmentAttempts.map(
              (attempt) => attempt.attempt_number
            )
          ) + 1;

    if (
      assessmentSettings?.max_attempts &&
      nextAttemptNumber > assessmentSettings.max_attempts
    ) {
      setErrorMessage(
        "The maximum number of assessment attempts has been reached."
      );
      return;
    }

    const totalQuestions = questions?.length || 0;

    const totalPoints =
      questions?.reduce(
        (total, question) =>
          total + Number(question.points || 1),
        0
      ) || 0;

    const { error } = await supabase
      .from("learning_assessment_attempts")
      .insert({
        learning_assignment_id: selectedAssignment.id,
        learning_module_id:
          selectedAssignment.learning_module_id,
        employee_id: selectedAssignment.employee_id,
        attempt_number: nextAttemptNumber,
        status: "In Progress",
        total_questions: totalQuestions,
        total_points_available: totalPoints,
        points_awarded: 0,
        score_percent: null,
        pass_mark: assessmentSettings?.pass_mark || 80,
      });

    if (error) {
      console.error(
        "Error starting assessment attempt:",
        error
      );

      setErrorMessage(
        "The assessment attempt could not be started."
      );
      return;
    }

    await recordActivity({
      assignmentId: selectedAssignment.id,
      moduleId: selectedAssignment.learning_module_id,
      employeeId: selectedAssignment.employee_id,
      activityType: "Assessment Started",
      summary: `${module?.title || "Assessment"} attempt ${nextAttemptNumber} started.`,
      details: {
        attempt_number: nextAttemptNumber,
      },
    });

    setMessage(
      `Assessment attempt ${nextAttemptNumber} started.`
    );

    await loadAssignmentWorkspace(selectedAssignment);
  }

  async function completeAssessmentAttempt(
    attempt: AssessmentAttempt,
    passed: boolean
  ) {
    if (!selectedAssignment) return;

    const passMark = attempt.pass_mark || 80;

    const score = passed
      ? Math.max(passMark, 100)
      : Math.max(0, passMark - 1);

    const { error } = await supabase
      .from("learning_assessment_attempts")
      .update({
        status: passed ? "Passed" : "Failed",
        score_percent: score,
        points_awarded: passed
          ? attempt.total_points_available
          : 0,
        submitted_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq("id", attempt.id);

    if (error) {
      setErrorMessage(
        "The assessment result could not be recorded."
      );
      return;
    }

    await recordActivity({
      assignmentId: selectedAssignment.id,
      moduleId: selectedAssignment.learning_module_id,
      employeeId: selectedAssignment.employee_id,
      activityType: passed
        ? "Assessment Passed"
        : "Assessment Failed",
      summary: `Assessment attempt ${attempt.attempt_number} ${passed ? "passed" : "failed"}.`,
      details: {
        attempt_number: attempt.attempt_number,
        score_percent: score,
      },
    });

    if (
      passed &&
      !selectedAssignment.manager_validation_required
    ) {
      const allRequiredSectionsComplete =
        sectionProgress
          .filter((record) => {
            const section = sections.find(
              (item) =>
                item.id === record.learning_section_id
            );

            return section?.completion_required;
          })
          .every(
            (record) =>
              record.status === "Completed" ||
              record.status === "Not Required"
          );

      if (allRequiredSectionsComplete) {
        const { data } = await supabase
          .from("learning_assignments")
          .update({
            status: "Completed",
            progress_percent: 100,
            completed_date: getTodayDate(),
            completed_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
          })
          .eq("id", selectedAssignment.id)
          .select("*")
          .single();

        if (data) {
          setSelectedAssignment(
            data as LearningAssignment
          );
        }
      }
    }

    setMessage(
      passed
        ? "Assessment marked as passed."
        : "Assessment marked as failed."
    );

    await loadPageData();
    await loadAssignmentWorkspace(selectedAssignment);
  }

  async function submitEvidence() {
    if (!selectedAssignment) return;

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

    if (
      evidenceType !== "External Link" &&
      evidenceType !== "Written Evidence" &&
      evidenceType !== "Manager Observation" &&
      evidenceType !== "Practical Demonstration" &&
      !evidenceFile
    ) {
      setErrorMessage("Choose the evidence file.");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    let filePath: string | null = null;
    let fileName: string | null = null;

    if (evidenceFile) {
      const safeFileName =
        evidenceFile.name.replace(
          /[^a-zA-Z0-9.\-_]/g,
          "_"
        );

      filePath = `${selectedAssignment.id}/${Date.now()}-${safeFileName}`;
      fileName = evidenceFile.name;

      const upload = await supabase.storage
        .from("learning-evidence")
        .upload(filePath, evidenceFile);

      if (upload.error) {
        console.error(
          "Error uploading learning evidence:",
          upload.error
        );

        setErrorMessage(
          "The evidence file could not be uploaded."
        );
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("learning_evidence")
      .insert({
        learning_assignment_id: selectedAssignment.id,
        learning_module_id:
          selectedAssignment.learning_module_id,
        learning_section_id: evidenceSectionId
          ? Number(evidenceSectionId)
          : null,
        employee_id: selectedAssignment.employee_id,
        evidence_type: evidenceType,
        title: evidenceTitle.trim(),
        description:
          evidenceDescription.trim() || null,
        file_name: fileName,
        file_path: filePath,
        external_url:
          evidenceType === "External Link"
            ? evidenceExternalUrl.trim()
            : null,
        review_status: "Submitted",
      });

    if (error) {
      console.error(
        "Error saving learning evidence:",
        error
      );

      if (filePath) {
        await supabase.storage
          .from("learning-evidence")
          .remove([filePath]);
      }

      setErrorMessage(
        "The learning evidence could not be saved."
      );
      setSaving(false);
      return;
    }

    await recordActivity({
      assignmentId: selectedAssignment.id,
      moduleId: selectedAssignment.learning_module_id,
      employeeId: selectedAssignment.employee_id,
      activityType: "Evidence Submitted",
      summary: `${evidenceTitle.trim()} submitted as learning evidence.`,
      details: {
        evidence_type: evidenceType,
        learning_section_id: evidenceSectionId
          ? Number(evidenceSectionId)
          : null,
      },
    });

    setEvidenceType("File");
    setEvidenceTitle("");
    setEvidenceDescription("");
    setEvidenceExternalUrl("");
    setEvidenceSectionId("");
    setEvidenceFile(null);
    setMessage("Learning evidence submitted.");
    setSaving(false);

    await loadAssignmentWorkspace(selectedAssignment);
  }

  async function reviewEvidence(
    evidenceRecord: LearningEvidence,
    nextStatus: string
  ) {
    if (!selectedAssignment) return;

    const reviewer = employees.find(
      (employee) =>
        employee.id === selectedAssignment.completion_confirmed_by
    );

    const { error } = await supabase
      .from("learning_evidence")
      .update({
        review_status: nextStatus,
        reviewed_by: reviewer?.id || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", evidenceRecord.id);

    if (error) {
      setErrorMessage(
        "The evidence review status could not be updated."
      );
      return;
    }

    await recordActivity({
      assignmentId: selectedAssignment.id,
      moduleId: selectedAssignment.learning_module_id,
      employeeId: selectedAssignment.employee_id,
      activityType: "Evidence Reviewed",
      summary: `${evidenceRecord.title} marked as ${nextStatus}.`,
      details: {
        evidence_id: evidenceRecord.id,
        review_status: nextStatus,
      },
    });

    await loadAssignmentWorkspace(selectedAssignment);
  }

  async function openEvidence(
    evidenceRecord: LearningEvidence
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
      .from("learning-evidence")
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

  async function requestValidation() {
    if (!selectedAssignment) return;

    if (!validationManagerId) {
      setErrorMessage("Select the validating manager.");
      return;
    }

    const { error } = await supabase
      .from("learning_manager_validations")
      .insert({
        learning_assignment_id: selectedAssignment.id,
        learning_module_id:
          selectedAssignment.learning_module_id,
        learning_section_id: null,
        employee_id: selectedAssignment.employee_id,
        manager_employee_id: Number(validationManagerId),
        validation_type: validationType,
        status: "Awaiting Validation",
        validation_summary:
          validationSummary.trim() || null,
        further_action_required:
          validationFurtherAction.trim() || null,
      });

    if (error) {
      setErrorMessage(
        "The manager validation request could not be created."
      );
      return;
    }

    await supabase
      .from("learning_assignments")
      .update({
        manager_validation_status:
          "Awaiting Validation",
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", selectedAssignment.id);

    await recordActivity({
      assignmentId: selectedAssignment.id,
      moduleId: selectedAssignment.learning_module_id,
      employeeId: selectedAssignment.employee_id,
      activityType: "Validation Requested",
      summary: "Manager validation requested.",
      details: {
        manager_employee_id:
          Number(validationManagerId),
        validation_type: validationType,
      },
    });

    setValidationManagerId("");
    setValidationType("Completion");
    setValidationSummary("");
    setValidationFurtherAction("");
    setMessage("Manager validation requested.");

    await loadAssignmentWorkspace(selectedAssignment);
  }

  async function updateValidation(
    validation: ManagerValidation,
    nextStatus: string
  ) {
    if (!selectedAssignment) return;

    const validated =
      nextStatus === "Validated";

    const { error } = await supabase
      .from("learning_manager_validations")
      .update({
        status: nextStatus,
        validated_at: validated
          ? new Date().toISOString()
          : null,
      })
      .eq("id", validation.id);

    if (error) {
      setErrorMessage(
        "The validation status could not be updated."
      );
      return;
    }

    const { data: updatedAssignment } = await supabase
      .from("learning_assignments")
      .update({
        manager_validation_status: nextStatus,
        status:
          validated &&
          selectedAssignment.progress_percent === 100
            ? "Completed"
            : selectedAssignment.status,
        completed_date:
          validated &&
          selectedAssignment.progress_percent === 100
            ? getTodayDate()
            : selectedAssignment.completed_date,
        completed_at:
          validated &&
          selectedAssignment.progress_percent === 100
            ? new Date().toISOString()
            : selectedAssignment.completed_at,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", selectedAssignment.id)
      .select("*")
      .single();

    await recordActivity({
      assignmentId: selectedAssignment.id,
      moduleId: selectedAssignment.learning_module_id,
      employeeId: selectedAssignment.employee_id,
      activityType: "Validation Completed",
      summary: `Manager validation changed to ${nextStatus}.`,
      details: {
        validation_id: validation.id,
        validation_status: nextStatus,
      },
    });

    if (updatedAssignment) {
      setSelectedAssignment(
        updatedAssignment as LearningAssignment
      );
    }

    await loadPageData();
    await loadAssignmentWorkspace(
      (updatedAssignment ||
        selectedAssignment) as LearningAssignment
    );
  }

  async function issueCertificate() {
    if (!selectedAssignment) return;

    if (!certificateTitle.trim()) {
      setErrorMessage("Enter the certificate title.");
      return;
    }

    if (!certificateReference.trim()) {
      setErrorMessage(
        "Enter a unique certificate reference."
      );
      return;
    }

    const { data, error } = await supabase
      .from("learning_certificates_issued")
      .insert({
        learning_assignment_id: selectedAssignment.id,
        learning_module_id:
          selectedAssignment.learning_module_id,
        employee_id: selectedAssignment.employee_id,
        certificate_title: certificateTitle.trim(),
        certificate_reference:
          certificateReference.trim(),
        issue_date: certificateIssueDate,
        expiry_date: certificateExpiryDate || null,
        status: "Valid",
        notes: certificateNotes.trim() || null,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error(
        "Error issuing learning certificate:",
        error
      );

      setErrorMessage(
        error?.code === "23505"
          ? "That certificate reference is already in use."
          : "The certificate could not be issued."
      );
      return;
    }

    await supabase
      .from("learning_assignments")
      .update({
        certificate_issued: true,
        certificate_issued_at:
          new Date().toISOString(),
        certificate_reference:
          certificateReference.trim(),
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", selectedAssignment.id);

    await recordActivity({
      assignmentId: selectedAssignment.id,
      moduleId: selectedAssignment.learning_module_id,
      employeeId: selectedAssignment.employee_id,
      activityType: "Certificate Issued",
      summary: `${certificateTitle.trim()} issued.`,
      details: {
        certificate_reference:
          certificateReference.trim(),
        issue_date: certificateIssueDate,
        expiry_date: certificateExpiryDate || null,
      },
    });

    setCertificate(data as IssuedCertificate);
    setMessage("Certificate issued.");

    await loadPageData();
  }

  async function openIssuedCertificate() {
    if (!certificate?.file_path) {
      setErrorMessage(
        "No certificate file has been uploaded yet."
      );
      return;
    }

    const { data, error } = await supabase.storage
      .from("learning-certificates")
      .createSignedUrl(certificate.file_path, 60);

    if (error) {
      setErrorMessage(
        "The certificate file could not be opened."
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

  async function archiveAssignment() {
    if (!selectedAssignment) return;

    const employee = employees.find(
      (item) =>
        item.id === selectedAssignment.employee_id
    );

    const module = modules.find(
      (item) =>
        item.id === selectedAssignment.learning_module_id
    );

    const confirmed = window.confirm(
      `Archive the ${module?.title || "learning"} assignment for ${employee?.name || "this employee"}?\n\nIts full history will remain preserved.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("learning_assignments")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq("id", selectedAssignment.id);

    if (error) {
      setErrorMessage(
        "The learning assignment could not be archived."
      );
      return;
    }

    await recordActivity({
      assignmentId: selectedAssignment.id,
      moduleId: selectedAssignment.learning_module_id,
      employeeId: selectedAssignment.employee_id,
      activityType: "Archived",
      summary: "Learning assignment archived.",
      details: null,
    });

    setSelectedAssignment(null);
    setMessage("Learning assignment archived.");

    await loadPageData();
  }

  async function recordActivity({
    assignmentId,
    moduleId,
    employeeId,
    activityType,
    summary,
    details,
  }: {
    assignmentId: number | null;
    moduleId: number | null;
    employeeId: number | null;
    activityType: string;
    summary: string;
    details: Record<string, unknown> | null;
  }) {
    const { error } = await supabase
      .from("learning_activity_history")
      .insert({
        learning_assignment_id: assignmentId,
        learning_module_id: moduleId,
        employee_id: employeeId,
        activity_type: activityType,
        activity_summary: summary,
        activity_details: details,
      });

    if (error) {
      console.error(
        "Error recording learning activity:",
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

  const moduleMap = useMemo(
    () =>
      new Map(
        modules.map((module) => [
          module.id,
          module,
        ])
      ),
    [modules]
  );

  const filteredAssignments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const employee = employeeMap.get(
        assignment.employee_id
      );

      const module = moduleMap.get(
        assignment.learning_module_id
      );

      const matchesSearch =
        !search ||
        (employee?.name || "")
          .toLowerCase()
          .includes(search) ||
        (employee?.role || "")
          .toLowerCase()
          .includes(search) ||
        (module?.title || "")
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        assignment.status === statusFilter;

      const matchesEmployee =
        employeeFilter === "All" ||
        assignment.employee_id ===
          Number(employeeFilter);

      const matchesModule =
        moduleFilter === "All" ||
        assignment.learning_module_id ===
          Number(moduleFilter);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesEmployee &&
        matchesModule
      );
    });
  }, [
    assignments,
    searchTerm,
    statusFilter,
    employeeFilter,
    moduleFilter,
    employeeMap,
    moduleMap,
  ]);

  const activeCount = assignments.filter(
    (assignment) =>
      assignment.status === "Assigned" ||
      assignment.status === "In Progress"
  ).length;

  const completedCount = assignments.filter(
    (assignment) =>
      assignment.status === "Completed"
  ).length;

  const overdueCount = assignments.filter(
    (assignment) =>
      Boolean(assignment.due_date) &&
      assignment.due_date! < getTodayDate() &&
      assignment.status !== "Completed" &&
      assignment.status !== "Cancelled"
  ).length;

  const validationCount = assignments.filter(
    (assignment) =>
      assignment.manager_validation_status ===
      "Awaiting Validation"
  ).length;

  const selectedEmployee = selectedAssignment
    ? employeeMap.get(selectedAssignment.employee_id)
    : null;

  const selectedModule = selectedAssignment
    ? moduleMap.get(
        selectedAssignment.learning_module_id
      )
    : null;

  if (selectedAssignment) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setSelectedAssignment(null);
            setActiveTab("Overview");
            setMessage("");
            setErrorMessage("");
          }}
          style={backButtonStyle}
        >
          ← Back to Learning
        </button>

        <div style={assignmentHeaderStyle}>
          <div>
            <div style={badgeRowStyle}>
              <span style={primaryBadgeStyle}>
                {selectedAssignment.status}
              </span>

              <span style={secondaryBadgeStyle}>
                {selectedModule?.learning_type ||
                  "Learning"}
              </span>

              {selectedAssignment.assessment_required && (
                <span style={secondaryBadgeStyle}>
                  Assessment
                </span>
              )}

              {selectedAssignment.manager_validation_required && (
                <span style={secondaryBadgeStyle}>
                  Manager Validation
                </span>
              )}
            </div>

            <h2 style={assignmentTitleStyle}>
              {selectedModule?.title ||
                "Learning Assignment"}
            </h2>

            <p style={assignmentDescriptionStyle}>
              {selectedEmployee?.name ||
                `Employee ${selectedAssignment.employee_id}`}
              {selectedEmployee?.role
                ? ` · ${selectedEmployee.role}`
                : ""}
            </p>
          </div>

          <div style={progressSummaryStyle}>
            {selectedAssignment.progress_percent}% complete
          </div>
        </div>

        <div style={tabNavigationStyle}>
          {(
            [
              "Overview",
              "Progress",
              "Assessment",
              "Evidence",
              "Validation",
              "Certificate",
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
            Loading learning workspace...
          </div>
        ) : (
          <>
            {activeTab === "Overview" && (
              <div>
                <SectionHeading
                  title="Overview"
                  description="Maintain the assignment status, due date and working notes."
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
                    label="Learning"
                    value={
                      selectedModule?.title ||
                      "Learning not found"
                    }
                  />

                  <DetailCard
                    label="Assigned"
                    value={formatDate(
                      selectedAssignment.assigned_date
                    )}
                  />

                  <DetailCard
                    label="Due Date"
                    value={
                      selectedAssignment.due_date
                        ? formatDate(
                            selectedAssignment.due_date
                          )
                        : "Not set"
                    }
                  />
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
                      {assignmentStatuses.map(
                        (status) => (
                          <option key={status}>
                            {status}
                          </option>
                        )
                      )}
                    </select>
                  </FormField>

                  <FormField label="Progress %">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={overviewProgress}
                      onChange={(event) =>
                        setOverviewProgress(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>
                </div>

                <FormField label="Due date">
                  <input
                    type="date"
                    value={overviewDueDate}
                    onChange={(event) =>
                      setOverviewDueDate(
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </FormField>

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
                      void archiveAssignment()
                    }
                    style={archiveButtonStyle}
                  >
                    Archive Assignment
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
                      : "Save Assignment"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "Progress" && (
              <div>
                <SectionHeading
                  title="Progress"
                  description="Review and update completion across each learning section."
                />

                {sections.length === 0 ? (
                  <div style={emptyStateStyle}>
                    This learning resource has no content sections.
                  </div>
                ) : (
                  <div style={listStyle}>
                    {sections.map(
                      (section, index) => {
                        const progress =
                          sectionProgress.find(
                            (item) =>
                              item.learning_section_id ===
                              section.id
                          );

                        return (
                          <div
                            key={section.id}
                            style={progressCardStyle}
                          >
                            <div
                              style={sectionNumberStyle}
                            >
                              {index + 1}
                            </div>

                            <div style={flexStyle}>
                              <div
                                style={cardHeaderStyle}
                              >
                                <div>
                                  <div
                                    style={
                                      eyebrowStyle
                                    }
                                  >
                                    {
                                      section.section_type
                                    }
                                  </div>

                                  <h4
                                    style={
                                      cardTitleStyle
                                    }
                                  >
                                    {section.title}
                                  </h4>
                                </div>

                                <div
                                  style={badgeRowStyle}
                                >
                                  {section.completion_required && (
                                    <span
                                      style={
                                        secondaryBadgeStyle
                                      }
                                    >
                                      Required
                                    </span>
                                  )}

                                  {section.manager_validation_required && (
                                    <span
                                      style={
                                        secondaryBadgeStyle
                                      }
                                    >
                                      Validation
                                    </span>
                                  )}

                                  {section.evidence_required && (
                                    <span
                                      style={
                                        secondaryBadgeStyle
                                      }
                                    >
                                      Evidence
                                    </span>
                                  )}
                                </div>
                              </div>

                              {progress ? (
                                <div
                                  style={
                                    inlineControlStyle
                                  }
                                >
                                  <select
                                    value={
                                      progress.status
                                    }
                                    onChange={(event) =>
                                      void updateSectionProgress(
                                        progress,
                                        event.target
                                          .value
                                      )
                                    }
                                    style={statusSelectStyle}
                                  >
                                    {sectionStatuses.map(
                                      (status) => (
                                        <option
                                          key={status}
                                        >
                                          {status}
                                        </option>
                                      )
                                    )}
                                  </select>

                                  <strong
                                    style={
                                      percentageStyle
                                    }
                                  >
                                    {
                                      progress.progress_percent
                                    }
                                    %
                                  </strong>
                                </div>
                              ) : (
                                <div
                                  style={mutedStyle}
                                >
                                  Progress record not
                                  available
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Assessment" && (
              <div>
                <div style={sectionHeaderStyle}>
                  <SectionHeading
                    title="Assessment"
                    description="Review assessment attempts and record the result."
                  />

                  {selectedAssignment.assessment_required && (
                    <button
                      type="button"
                      onClick={() =>
                        void startAssessmentAttempt()
                      }
                      style={primaryButtonStyle}
                    >
                      Start Attempt
                    </button>
                  )}
                </div>

                {!selectedAssignment.assessment_required && (
                  <div style={noticeStyle}>
                    An assessment is not required for this learning assignment.
                  </div>
                )}

                {assessmentAttempts.length === 0 ? (
                  <div style={emptyStateStyle}>
                    No assessment attempts have been recorded.
                  </div>
                ) : (
                  <div style={listStyle}>
                    {assessmentAttempts.map(
                      (attempt) => (
                        <div
                          key={attempt.id}
                          style={standardCardStyle}
                        >
                          <div
                            style={cardHeaderStyle}
                          >
                            <div>
                              <div
                                style={eyebrowStyle}
                              >
                                Attempt{" "}
                                {
                                  attempt.attempt_number
                                }
                              </div>

                              <h4
                                style={
                                  cardTitleStyle
                                }
                              >
                                {attempt.status}
                              </h4>
                            </div>

                            <span
                              style={
                                primaryBadgeStyle
                              }
                            >
                              {attempt.score_percent !==
                              null
                                ? `${attempt.score_percent}%`
                                : "No score"}
                            </span>
                          </div>

                          <div
                            style={
                              assignmentDetailGridStyle
                            }
                          >
                            <DetailItem
                              label="Pass Mark"
                              value={`${attempt.pass_mark || 80}%`}
                            />

                            <DetailItem
                              label="Questions"
                              value={String(
                                attempt.total_questions
                              )}
                            />

                            <DetailItem
                              label="Points"
                              value={`${attempt.points_awarded}/${attempt.total_points_available}`}
                            />

                            <DetailItem
                              label="Started"
                              value={new Date(
                                attempt.started_at
                              ).toLocaleString(
                                "en-GB"
                              )}
                            />
                          </div>

                          {attempt.status ===
                            "In Progress" && (
                            <div
                              style={
                                cardActionsStyle
                              }
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  void completeAssessmentAttempt(
                                    attempt,
                                    true
                                  )
                                }
                                style={
                                  primaryButtonStyle
                                }
                              >
                                Mark Passed
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void completeAssessmentAttempt(
                                    attempt,
                                    false
                                  )
                                }
                                style={
                                  secondaryButtonStyle
                                }
                              >
                                Mark Failed
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Evidence" && (
              <div>
                <SectionHeading
                  title="Evidence"
                  description="Upload or record evidence of practical learning and competence."
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
                        {evidenceTypes.map(
                          (type) => (
                            <option key={type}>
                              {type}
                            </option>
                          )
                        )}
                      </select>
                    </FormField>

                    <FormField label="Linked section">
                      <select
                        value={evidenceSectionId}
                        onChange={(event) =>
                          setEvidenceSectionId(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      >
                        <option value="">
                          Whole learning assignment
                        </option>

                        {sections.map(
                          (section) => (
                            <option
                              key={section.id}
                              value={section.id}
                            >
                              {section.title}
                            </option>
                          )
                        )}
                      </select>
                    </FormField>
                  </div>

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

                  <FormField label="Description">
                    <textarea
                      value={
                        evidenceDescription
                      }
                      onChange={(event) =>
                        setEvidenceDescription(
                          event.target.value
                        )
                      }
                      style={textareaStyle}
                    />
                  </FormField>

                  {evidenceType ===
                  "External Link" ? (
                    <FormField label="External link">
                      <input
                        type="url"
                        value={
                          evidenceExternalUrl
                        }
                        onChange={(event) =>
                          setEvidenceExternalUrl(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </FormField>
                  ) : ![
                      "Written Evidence",
                      "Manager Observation",
                      "Practical Demonstration",
                    ].includes(
                      evidenceType
                    ) ? (
                    <FormField label="Evidence file">
                      <input
                        type="file"
                        onChange={(event) =>
                          setEvidenceFile(
                            event.target
                              .files?.[0] ||
                              null
                          )
                        }
                      />
                    </FormField>
                  ) : null}

                  <div
                    style={formActionsStyle}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        void submitEvidence()
                      }
                      disabled={saving}
                      style={primaryButtonStyle}
                    >
                      {saving
                        ? "Submitting..."
                        : "Submit Evidence"}
                    </button>
                  </div>
                </div>

                {evidence.length === 0 ? (
                  <div style={emptyStateStyle}>
                    No learning evidence has been submitted.
                  </div>
                ) : (
                  <div style={listStyle}>
                    {evidence.map(
                      (record) => (
                        <div
                          key={record.id}
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
                                  record.evidence_type
                                }
                              </div>

                              <h4
                                style={
                                  cardTitleStyle
                                }
                              >
                                {record.title}
                              </h4>
                            </div>

                            <select
                              value={
                                record.review_status
                              }
                              onChange={(event) =>
                                void reviewEvidence(
                                  record,
                                  event.target
                                    .value
                                )
                              }
                              style={statusSelectStyle}
                            >
                              {evidenceReviewStatuses.map(
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

                          {record.description && (
                            <p
                              style={
                                cardDescriptionStyle
                              }
                            >
                              {
                                record.description
                              }
                            </p>
                          )}

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
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Validation" && (
              <div>
                <SectionHeading
                  title="Manager Validation"
                  description="Request and record manager confirmation of practical learning or competence."
                />

                <div style={formPanelStyle}>
                  <div style={formGridStyle}>
                    <FormField label="Validation type">
                      <select
                        value={validationType}
                        onChange={(event) =>
                          setValidationType(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      >
                        <option>
                          Completion
                        </option>
                        <option>
                          Practical Observation
                        </option>
                        <option>
                          Evidence Review
                        </option>
                        <option>
                          Competence Confirmation
                        </option>
                        <option>
                          Assessment Review
                        </option>
                        <option>Other</option>
                      </select>
                    </FormField>

                    <FormField label="Validating manager">
                      <select
                        value={
                          validationManagerId
                        }
                        onChange={(event) =>
                          setValidationManagerId(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      >
                        <option value="">
                          Select manager
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

                  <FormField label="Validation summary">
                    <textarea
                      value={validationSummary}
                      onChange={(event) =>
                        setValidationSummary(
                          event.target.value
                        )
                      }
                      style={textareaStyle}
                    />
                  </FormField>

                  <FormField label="Further action required">
                    <textarea
                      value={
                        validationFurtherAction
                      }
                      onChange={(event) =>
                        setValidationFurtherAction(
                          event.target.value
                        )
                      }
                      style={textareaStyle}
                    />
                  </FormField>

                  <div
                    style={formActionsStyle}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        void requestValidation()
                      }
                      style={primaryButtonStyle}
                    >
                      Request Validation
                    </button>
                  </div>
                </div>

                {validations.length === 0 ? (
                  <div style={emptyStateStyle}>
                    No manager validations have been requested.
                  </div>
                ) : (
                  <div style={listStyle}>
                    {validations.map(
                      (validation) => (
                        <div
                          key={validation.id}
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
                                  validation.validation_type
                                }
                              </div>

                              <h4
                                style={
                                  cardTitleStyle
                                }
                              >
                                {employeeMap.get(
                                  validation.manager_employee_id ||
                                    0
                                )?.name ||
                                  "Manager not recorded"}
                              </h4>
                            </div>

                            <select
                              value={
                                validation.status
                              }
                              onChange={(event) =>
                                void updateValidation(
                                  validation,
                                  event.target
                                    .value
                                )
                              }
                              style={statusSelectStyle}
                            >
                              {validationStatuses.map(
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

                          {validation.validation_summary && (
                            <p
                              style={
                                cardDescriptionStyle
                              }
                            >
                              {
                                validation.validation_summary
                              }
                            </p>
                          )}

                          {validation.further_action_required && (
                            <div
                              style={noticeStyle}
                            >
                              <strong>
                                Further action:
                              </strong>{" "}
                              {
                                validation.further_action_required
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

            {activeTab === "Certificate" && (
              <div>
                <SectionHeading
                  title="Certificate"
                  description="Issue and maintain the employee’s certificate for this learning."
                />

                {!selectedModule?.certificate_available && (
                  <div style={noticeStyle}>
                    Certificates are not enabled for this learning resource.
                  </div>
                )}

                {certificate ? (
                  <div style={standardCardStyle}>
                    <div style={cardHeaderStyle}>
                      <div>
                        <div style={eyebrowStyle}>
                          Issued Certificate
                        </div>

                        <h4 style={cardTitleStyle}>
                          {
                            certificate.certificate_title
                          }
                        </h4>
                      </div>

                      <span
                        style={primaryBadgeStyle}
                      >
                        {certificate.status}
                      </span>
                    </div>

                    <div
                      style={
                        assignmentDetailGridStyle
                      }
                    >
                      <DetailItem
                        label="Reference"
                        value={
                          certificate.certificate_reference
                        }
                      />

                      <DetailItem
                        label="Issue Date"
                        value={formatDate(
                          certificate.issue_date
                        )}
                      />

                      <DetailItem
                        label="Expiry"
                        value={
                          certificate.expiry_date
                            ? formatDate(
                                certificate.expiry_date
                              )
                            : "Does not expire"
                        }
                      />
                    </div>

                    {certificate.file_path && (
                      <div
                        style={cardActionsStyle}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            void openIssuedCertificate()
                          }
                          style={
                            secondaryButtonStyle
                          }
                        >
                          Open Certificate
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={formPanelStyle}>
                    <div style={formGridStyle}>
                      <FormField label="Certificate title">
                        <input
                          value={certificateTitle}
                          onChange={(event) =>
                            setCertificateTitle(
                              event.target.value
                            )
                          }
                          style={inputStyle}
                        />
                      </FormField>

                      <FormField label="Certificate reference">
                        <input
                          value={
                            certificateReference
                          }
                          onChange={(event) =>
                            setCertificateReference(
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
                          value={
                            certificateIssueDate
                          }
                          onChange={(event) =>
                            setCertificateIssueDate(
                              event.target.value
                            )
                          }
                          style={inputStyle}
                        />
                      </FormField>

                      <FormField label="Expiry date">
                        <input
                          type="date"
                          value={
                            certificateExpiryDate
                          }
                          onChange={(event) =>
                            setCertificateExpiryDate(
                              event.target.value
                            )
                          }
                          style={inputStyle}
                        />
                      </FormField>
                    </div>

                    <FormField label="Notes">
                      <textarea
                        value={certificateNotes}
                        onChange={(event) =>
                          setCertificateNotes(
                            event.target.value
                          )
                        }
                        style={textareaStyle}
                      />
                    </FormField>

                    <div
                      style={formActionsStyle}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          void issueCertificate()
                        }
                        style={primaryButtonStyle}
                      >
                        Issue Certificate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Activity" && (
              <div>
                <SectionHeading
                  title="Activity"
                  description="A permanent chronology of assignment, progress, assessment, evidence and completion activity."
                />

                {activity.length === 0 ? (
                  <div style={emptyStateStyle}>
                    No learning activity has been recorded.
                  </div>
                ) : (
                  <div style={timelineStyle}>
                    {activity.map(
                      (record) => (
                        <div
                          key={record.id}
                          style={timelineItemStyle}
                        >
                          <div
                            style={timelineDotStyle}
                          />

                          <div style={flexStyle}>
                            <div
                              style={cardHeaderStyle}
                            >
                              <div>
                                <div
                                  style={
                                    eyebrowStyle
                                  }
                                >
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

                              <div
                                style={mutedStyle}
                              >
                                {new Date(
                                  record.created_at
                                ).toLocaleString(
                                  "en-GB"
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
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
            Learning
          </h2>

          <p style={pageDescriptionStyle}>
            Assign learning, monitor progress,
            review evidence and preserve completion
            history across the organisation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAssignForm(true);
            setMessage("");
            setErrorMessage("");
          }}
          style={primaryButtonStyle}
        >
          Assign Learning
        </button>
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
          label="Total Assignments"
          value={String(assignments.length)}
        />

        <SummaryCard
          label="Currently Learning"
          value={String(activeCount)}
        />

        <SummaryCard
          label="Completed"
          value={String(completedCount)}
        />

        <SummaryCard
          label="Past Due"
          value={String(overdueCount)}
        />

        <SummaryCard
          label="Awaiting Validation"
          value={String(validationCount)}
        />
      </div>

      {showAssignForm && (
        <div style={formPanelStyle}>
          <div style={formHeaderStyle}>
            <div>
              <h3 style={formTitleStyle}>
                Assign Learning
              </h3>

              <p style={formDescriptionStyle}>
                Select an employee and a published
                learning resource.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowAssignForm(false)
              }
              style={closeButtonStyle}
            >
              Close
            </button>
          </div>

          <div style={formGridStyle}>
            <FormField label="Employee">
              <select
                value={assignmentEmployeeId}
                onChange={(event) =>
                  setAssignmentEmployeeId(
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
                      {employee.role
                        ? ` · ${employee.role}`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField label="Learning resource">
              <select
                value={assignmentModuleId}
                onChange={(event) =>
                  setAssignmentModuleId(
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                <option value="">
                  Select learning
                </option>

                {modules.map(
                  (module) => (
                    <option
                      key={module.id}
                      value={module.id}
                    >
                      {module.title} ·{" "}
                      {module.status}
                    </option>
                  )
                )}
              </select>
            </FormField>
          </div>

          <div style={formGridStyle}>
            <FormField label="Due date">
              <input
                type="date"
                value={assignmentDueDate}
                onChange={(event) =>
                  setAssignmentDueDate(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Assignment source">
              <select
                value={assignmentSource}
                onChange={(event) =>
                  setAssignmentSource(
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                <option>Direct</option>
                <option>Pathway</option>
                <option>Compliance</option>
                <option>Employee Development</option>
                <option>Talent</option>
                <option>Matter</option>
                <option>Leo Recommendation</option>
                <option>Other</option>
              </select>
            </FormField>
          </div>

          <FormField label="Manager notes">
            <textarea
              value={
                assignmentManagerNotes
              }
              onChange={(event) =>
                setAssignmentManagerNotes(
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
                setShowAssignForm(false)
              }
              style={secondaryButtonStyle}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() =>
                void assignLearning()
              }
              disabled={saving}
              style={primaryButtonStyle}
            >
              {saving
                ? "Assigning..."
                : "Assign Learning"}
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
          placeholder="Search employee or learning..."
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

          {assignmentStatuses.map(
            (status) => (
              <option key={status}>
                {status}
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

        <select
          value={moduleFilter}
          onChange={(event) =>
            setModuleFilter(
              event.target.value
            )
          }
          style={inputStyle}
        >
          <option value="All">
            All learning
          </option>

          {modules.map(
            (module) => (
              <option
                key={module.id}
                value={module.id}
              >
                {module.title}
              </option>
            )
          )}
        </select>
      </div>

      {loading ? (
        <div style={emptyStateStyle}>
          Loading learning assignments...
        </div>
      ) : filteredAssignments.length ===
        0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyIconStyle}>
            ✦
          </div>

          <h3 style={emptyTitleStyle}>
            No learning assignments found
          </h3>

          <p style={emptyDescriptionStyle}>
            Assign learning or adjust the
            current search and filters.
          </p>
        </div>
      ) : (
        <div style={assignmentGridStyle}>
          {filteredAssignments.map(
            (assignment) => {
              const employee =
                employeeMap.get(
                  assignment.employee_id
                );

              const module =
                moduleMap.get(
                  assignment.learning_module_id
                );

              const overdue =
                Boolean(
                  assignment.due_date
                ) &&
                assignment.due_date! <
                  getTodayDate() &&
                assignment.status !==
                  "Completed" &&
                assignment.status !==
                  "Cancelled";

              return (
                <button
                  key={assignment.id}
                  type="button"
                  onClick={() =>
                    setSelectedAssignment(
                      assignment
                    )
                  }
                  style={
                    assignmentCardButtonStyle
                  }
                >
                  <div
                    style={cardHeaderStyle}
                  >
                    <div>
                      <div
                        style={badgeRowStyle}
                      >
                        <span
                          style={
                            primaryBadgeStyle
                          }
                        >
                          {overdue
                            ? "Past Due"
                            : assignment.status}
                        </span>

                        <span
                          style={
                            secondaryBadgeStyle
                          }
                        >
                          {module?.learning_type ||
                            "Learning"}
                        </span>
                      </div>

                      <h3
                        style={
                          assignmentCardTitleStyle
                        }
                      >
                        {module?.title ||
                          "Learning Resource"}
                      </h3>
                    </div>

                    <strong
                      style={
                        percentageStyle
                      }
                    >
                      {
                        assignment.progress_percent
                      }
                      %
                    </strong>
                  </div>

                  <div
                    style={
                      assignmentEmployeeStyle
                    }
                  >
                    {employee?.name ||
                      `Employee ${assignment.employee_id}`}
                    {employee?.role
                      ? ` · ${employee.role}`
                      : ""}
                  </div>

                  <div
                    style={
                      progressTrackStyle
                    }
                  >
                    <div
                      style={{
                        ...progressBarStyle,
                        width: `${assignment.progress_percent}%`,
                      }}
                    />
                  </div>

                  <div
                    style={
                      assignmentDetailGridStyle
                    }
                  >
                    <DetailItem
                      label="Assigned"
                      value={formatDate(
                        assignment.assigned_date
                      )}
                    />

                    <DetailItem
                      label="Due"
                      value={
                        assignment.due_date
                          ? formatDate(
                              assignment.due_date
                            )
                          : "Not set"
                      }
                    />

                    <DetailItem
                      label="Assessment"
                      value={
                        assignment.assessment_required
                          ? "Required"
                          : "Not required"
                      }
                    />

                    <DetailItem
                      label="Validation"
                      value={
                        assignment.manager_validation_status
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

      <p
        style={
          sectionHeadingDescriptionStyle
        }
      >
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

function getTodayDate(): string {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function formatDate(
  value: string
): string {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(`${value}T12:00:00`)
  );
}

const pageHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  marginBottom: "18px",
};

const pageTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const pageDescriptionStyle: React.CSSProperties = {
  maxWidth: "760px",
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
    "repeat(auto-fit, minmax(170px, 1fr))",
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
    "minmax(230px, 1fr) 170px 200px 220px",
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
};

const formDescriptionStyle: React.CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "13px",
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

const formActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "17px",
};

const splitActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  marginTop: "18px",
};

const assignmentGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "13px",
};

const assignmentCardButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "13px",
  textAlign: "left",
  cursor: "pointer",
};

const assignmentCardTitleStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#111827",
  fontSize: "16px",
};

const assignmentEmployeeStyle: React.CSSProperties = {
  marginTop: "10px",
  color: "#4B5563",
  fontSize: "13px",
  fontWeight: 700,
};

const assignmentHeaderStyle: React.CSSProperties = {
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

const assignmentTitleStyle: React.CSSProperties = {
  margin: "9px 0 0",
  color: "#111827",
};

const assignmentDescriptionStyle: React.CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "14px",
};

const progressSummaryStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "14px",
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

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
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

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "11px",
};

const progressCardStyle: React.CSSProperties = {
  display: "flex",
  gap: "13px",
  padding: "15px",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
};

const sectionNumberStyle: React.CSSProperties = {
  flexShrink: 0,
  width: "32px",
  height: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#F7F1FC",
  color: "#6E5084",
  borderRadius: "9px",
  fontWeight: 800,
};

const flexStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
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

const inlineControlStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginTop: "12px",
};

const statusSelectStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
  background: "#FFFFFF",
};

const percentageStyle: React.CSSProperties = {
  color: "#6E5084",
};

const standardCardStyle: React.CSSProperties = {
  padding: "15px",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  background: "#FFFFFF",
};

const assignmentDetailGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "12px",
  marginTop: "14px",
};

const cardActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "9px",
  flexWrap: "wrap",
  marginTop: "14px",
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

const progressTrackStyle: React.CSSProperties = {
  height: "8px",
  marginTop: "13px",
  background: "#F3F4F6",
  borderRadius: "999px",
  overflow: "hidden",
};

const progressBarStyle: React.CSSProperties = {
  height: "100%",
  background: "#6E5084",
  borderRadius: "999px",
};

const timelineStyle: React.CSSProperties = {
  display: "grid",
  gap: "0",
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