"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PathwayStatus =
  | "Draft"
  | "Under Review"
  | "Published"
  | "Archived";

type PathwayType =
  | "Onboarding"
  | "Development"
  | "Leadership"
  | "Role Progression"
  | "Compliance"
  | "Specialist"
  | "Career Development"
  | "Other";

type AssignmentType =
  | "Mandatory"
  | "Recommended"
  | "Optional";

type Pathway = {
  id: number;
  organisation_id: string | null;
  title: string;
  purpose: string | null;
  intended_audience: string | null;
  target_role: string | null;
  target_department: string | null;
  target_location: string | null;
  category: string | null;
  status: PathwayStatus;
  pathway_type: PathwayType;
  assignment_type: AssignmentType;
  estimated_completion_days: number | null;
  review_frequency_months: number | null;
  last_reviewed_at: string | null;
  next_review_date: string | null;
  current_version_number: number;
  source_type: string;
  created_at: string;
  updated_at: string;
};

type PathwayStep = {
  id: number;
  pathway_id: number;
  title: string;
  description: string | null;
  step_type: string;
  learning_module_id: number | null;
  sequence_number: number;
  estimated_duration_days: number | null;
  completion_required: boolean;
  manager_validation_required: boolean;
  evidence_required: boolean;
  previous_step_required: boolean;
  instructions: string | null;
  completion_criteria: string | null;
};

type Employee = {
  id: number;
  name: string;
  role: string | null;
  status: string | null;
};

type LearningModule = {
  id: number;
  title: string;
  status: string;
};

type PathwayAssignment = {
  id: number;
  pathway_id: number;
  employee_id: number;
  assigned_date: string;
  start_date: string;
  target_completion_date: string | null;
  actual_completion_date: string | null;
  manager_employee_id: number | null;
  status: string;
  progress_percent: number;
  current_step_id: number | null;
  assignment_source: string;
  manager_notes: string | null;
  employee_notes: string | null;
};

type PathwayReview = {
  id: number;
  review_date: string;
  review_summary: string;
  changes_required: string | null;
  outcome: string;
  next_review_date: string | null;
  created_at: string;
};

type PathwayVersion = {
  id: number;
  version_number: number;
  change_summary: string | null;
  published_at: string | null;
  created_at: string;
};

type WorkspaceTab =
  | "Overview"
  | "Learning Sequence"
  | "Assignments"
  | "Progress"
  | "Reviews"
  | "Version History";

const pathwayTypes: PathwayType[] = [
  "Onboarding",
  "Development",
  "Leadership",
  "Role Progression",
  "Compliance",
  "Specialist",
  "Career Development",
  "Other",
];

const pathwayStatuses: PathwayStatus[] = [
  "Draft",
  "Under Review",
  "Published",
  "Archived",
];

const assignmentTypes: AssignmentType[] = [
  "Mandatory",
  "Recommended",
  "Optional",
];

const stepTypes = [
  "Learning Module",
  "Assessment",
  "Manager Validation",
  "Workplace Observation",
  "External Qualification",
  "Certificate",
  "Evidence Upload",
  "AI Discussion",
  "Welcome",
  "Milestone",
  "Other",
];

const assignmentStatuses = [
  "Assigned",
  "In Progress",
  "Awaiting Validation",
  "Completed",
  "Paused",
  "Cancelled",
];

const reviewOutcomes = [
  "No Change",
  "Update Required",
  "Republish Required",
  "Archive Recommended",
];

export default function DevelopmentPathways() {
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [selectedPathway, setSelectedPathway] =
    useState<Pathway | null>(null);

  const [steps, setSteps] = useState<PathwayStep[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [learningModules, setLearningModules] = useState<
    LearningModule[]
  >([]);
  const [assignments, setAssignments] = useState<
    PathwayAssignment[]
  >([]);
  const [reviews, setReviews] = useState<PathwayReview[]>([]);
  const [versions, setVersions] = useState<PathwayVersion[]>([]);

  const [activeTab, setActiveTab] =
    useState<WorkspaceTab>("Overview");

  const [showPathwayForm, setShowPathwayForm] = useState(false);
  const [showStepForm, setShowStepForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] =
    useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const [editingStepId, setEditingStepId] =
    useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [intendedAudience, setIntendedAudience] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetDepartment, setTargetDepartment] = useState("");
  const [targetLocation, setTargetLocation] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<PathwayStatus>("Draft");
  const [pathwayType, setPathwayType] =
    useState<PathwayType>("Development");
  const [assignmentType, setAssignmentType] =
    useState<AssignmentType>("Optional");
  const [estimatedCompletionDays, setEstimatedCompletionDays] =
    useState("");
  const [reviewFrequencyMonths, setReviewFrequencyMonths] =
    useState("12");
  const [nextReviewDate, setNextReviewDate] = useState("");

  const [stepTitle, setStepTitle] = useState("");
  const [stepDescription, setStepDescription] = useState("");
  const [stepType, setStepType] = useState("Learning Module");
  const [stepLearningModuleId, setStepLearningModuleId] =
    useState("");
  const [stepDurationDays, setStepDurationDays] = useState("");
  const [stepInstructions, setStepInstructions] = useState("");
  const [stepCompletionCriteria, setStepCompletionCriteria] =
    useState("");
  const [stepCompletionRequired, setStepCompletionRequired] =
    useState(true);
  const [
    stepManagerValidationRequired,
    setStepManagerValidationRequired,
  ] = useState(false);
  const [stepEvidenceRequired, setStepEvidenceRequired] =
    useState(false);
  const [stepPreviousRequired, setStepPreviousRequired] =
    useState(true);

  const [assignmentEmployeeId, setAssignmentEmployeeId] =
    useState("");
  const [assignmentManagerId, setAssignmentManagerId] =
    useState("");
  const [assignmentStartDate, setAssignmentStartDate] =
    useState(getTodayDate());
  const [
    assignmentTargetCompletionDate,
    setAssignmentTargetCompletionDate,
  ] = useState("");
  const [assignmentSource, setAssignmentSource] =
    useState("Direct");
  const [assignmentManagerNotes, setAssignmentManagerNotes] =
    useState("");

  const [reviewDate, setReviewDate] = useState(getTodayDate());
  const [reviewSummary, setReviewSummary] = useState("");
  const [reviewChangesRequired, setReviewChangesRequired] =
    useState("");
  const [reviewOutcome, setReviewOutcome] =
    useState("No Change");
  const [reviewNextDate, setReviewNextDate] = useState("");

  const [versionSummary, setVersionSummary] = useState("");

  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadPathways();
  }, []);

  useEffect(() => {
    if (selectedPathway) {
      void loadPathwayWorkspace(selectedPathway.id);
      populatePathwayForm(selectedPathway);
    }
  }, [selectedPathway?.id]);

  async function loadPathways() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("development_pathways")
      .select("*")
      .eq("is_archived", false)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading development pathways:", error);
      setErrorMessage("Development pathways could not be loaded.");
      setLoading(false);
      return;
    }

    setPathways((data || []) as Pathway[]);
    setLoading(false);
  }

  async function loadPathwayWorkspace(pathwayId: number) {
    setWorkspaceLoading(true);
    setErrorMessage("");

    const [
      stepsResult,
      employeesResult,
      modulesResult,
      assignmentsResult,
      reviewsResult,
      versionsResult,
    ] = await Promise.all([
      supabase
        .from("pathway_steps")
        .select("*")
        .eq("pathway_id", pathwayId)
        .eq("is_archived", false)
        .order("sequence_number"),

      supabase
        .from("employees")
        .select("id, name, role, status")
        .neq("status", "Archived")
        .order("name"),

      supabase
        .from("learning_modules")
        .select("id, title, status")
        .eq("is_archived", false)
        .order("title"),

      supabase
        .from("pathway_assignments")
        .select("*")
        .eq("pathway_id", pathwayId)
        .eq("is_archived", false)
        .order("assigned_date", { ascending: false }),

      supabase
        .from("pathway_reviews")
        .select("*")
        .eq("pathway_id", pathwayId)
        .order("review_date", { ascending: false }),

      supabase
        .from("pathway_versions")
        .select(
          "id, version_number, change_summary, published_at, created_at"
        )
        .eq("pathway_id", pathwayId)
        .order("version_number", { ascending: false }),
    ]);

    const firstError =
      stepsResult.error ||
      employeesResult.error ||
      modulesResult.error ||
      assignmentsResult.error ||
      reviewsResult.error ||
      versionsResult.error;

    if (firstError) {
      console.error("Error loading pathway workspace:", firstError);
      setErrorMessage("The pathway workspace could not be loaded.");
      setWorkspaceLoading(false);
      return;
    }

    setSteps((stepsResult.data || []) as PathwayStep[]);
    setEmployees((employeesResult.data || []) as Employee[]);
    setLearningModules(
      (modulesResult.data || []) as LearningModule[]
    );
    setAssignments(
      (assignmentsResult.data || []) as PathwayAssignment[]
    );
    setReviews((reviewsResult.data || []) as PathwayReview[]);
    setVersions((versionsResult.data || []) as PathwayVersion[]);

    setWorkspaceLoading(false);
  }

  function resetPathwayForm() {
    setTitle("");
    setPurpose("");
    setIntendedAudience("");
    setTargetRole("");
    setTargetDepartment("");
    setTargetLocation("");
    setCategory("");
    setStatus("Draft");
    setPathwayType("Development");
    setAssignmentType("Optional");
    setEstimatedCompletionDays("");
    setReviewFrequencyMonths("12");
    setNextReviewDate("");
  }

  function populatePathwayForm(pathway: Pathway) {
    setTitle(pathway.title);
    setPurpose(pathway.purpose || "");
    setIntendedAudience(pathway.intended_audience || "");
    setTargetRole(pathway.target_role || "");
    setTargetDepartment(pathway.target_department || "");
    setTargetLocation(pathway.target_location || "");
    setCategory(pathway.category || "");
    setStatus(pathway.status);
    setPathwayType(pathway.pathway_type);
    setAssignmentType(pathway.assignment_type);
    setEstimatedCompletionDays(
      pathway.estimated_completion_days !== null
        ? String(pathway.estimated_completion_days)
        : ""
    );
    setReviewFrequencyMonths(
      pathway.review_frequency_months !== null
        ? String(pathway.review_frequency_months)
        : ""
    );
    setNextReviewDate(pathway.next_review_date || "");
  }

  function openCreatePathway() {
    setSelectedPathway(null);
    resetPathwayForm();
    setMessage("");
    setErrorMessage("");
    setShowPathwayForm(true);
  }

  async function savePathway() {
    if (!title.trim()) {
      setErrorMessage("Enter a pathway title.");
      return;
    }

    if (
      estimatedCompletionDays &&
      Number(estimatedCompletionDays) < 1
    ) {
      setErrorMessage(
        "Estimated completion time must be at least one day."
      );
      return;
    }

    if (
      reviewFrequencyMonths &&
      Number(reviewFrequencyMonths) < 1
    ) {
      setErrorMessage(
        "Review frequency must be at least one month."
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const pathwayData = {
      title: title.trim(),
      purpose: purpose.trim() || null,
      intended_audience: intendedAudience.trim() || null,
      target_role: targetRole.trim() || null,
      target_department: targetDepartment.trim() || null,
      target_location: targetLocation.trim() || null,
      category: category.trim() || null,
      status,
      pathway_type: pathwayType,
      assignment_type: assignmentType,
      estimated_completion_days: estimatedCompletionDays
        ? Number(estimatedCompletionDays)
        : null,
      review_frequency_months: reviewFrequencyMonths
        ? Number(reviewFrequencyMonths)
        : null,
      next_review_date: nextReviewDate || null,
      source_type: "Employer Created",
    };

    if (selectedPathway) {
      const { data, error } = await supabase
        .from("development_pathways")
        .update(pathwayData)
        .eq("id", selectedPathway.id)
        .select("*")
        .single();

      if (error || !data) {
        console.error("Error updating pathway:", error);
        setErrorMessage("The pathway could not be updated.");
        setSaving(false);
        return;
      }

      setSelectedPathway(data as Pathway);
      setMessage("Pathway overview updated.");
    } else {
      const { data, error } = await supabase
        .from("development_pathways")
        .insert(pathwayData)
        .select("*")
        .single();

      if (error || !data) {
        console.error("Error creating pathway:", error);
        setErrorMessage("The pathway could not be created.");
        setSaving(false);
        return;
      }

      setSelectedPathway(data as Pathway);
      setMessage("Development pathway created.");
    }

    setSaving(false);
    setShowPathwayForm(false);
    await loadPathways();
  }

  async function archivePathway() {
    if (!selectedPathway) return;

    const confirmed = window.confirm(
      `Archive "${selectedPathway.title}"?\n\nThe pathway, assignments, progress and version history will remain preserved.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("development_pathways")
      .update({
        status: "Archived",
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq("id", selectedPathway.id);

    if (error) {
      setErrorMessage("The pathway could not be archived.");
      return;
    }

    setSelectedPathway(null);
    setMessage("Development pathway archived.");
    await loadPathways();
  }

  function resetStepForm() {
    setEditingStepId(null);
    setStepTitle("");
    setStepDescription("");
    setStepType("Learning Module");
    setStepLearningModuleId("");
    setStepDurationDays("");
    setStepInstructions("");
    setStepCompletionCriteria("");
    setStepCompletionRequired(true);
    setStepManagerValidationRequired(false);
    setStepEvidenceRequired(false);
    setStepPreviousRequired(true);
  }

  function openEditStep(step: PathwayStep) {
    setEditingStepId(step.id);
    setStepTitle(step.title);
    setStepDescription(step.description || "");
    setStepType(step.step_type);
    setStepLearningModuleId(
      step.learning_module_id ? String(step.learning_module_id) : ""
    );
    setStepDurationDays(
      step.estimated_duration_days !== null
        ? String(step.estimated_duration_days)
        : ""
    );
    setStepInstructions(step.instructions || "");
    setStepCompletionCriteria(step.completion_criteria || "");
    setStepCompletionRequired(step.completion_required);
    setStepManagerValidationRequired(
      step.manager_validation_required
    );
    setStepEvidenceRequired(step.evidence_required);
    setStepPreviousRequired(step.previous_step_required);
    setShowStepForm(true);
  }

  async function saveStep() {
    if (!selectedPathway) return;

    if (!stepTitle.trim()) {
      setErrorMessage("Enter a step title.");
      return;
    }

    if (
      stepType === "Learning Module" &&
      !stepLearningModuleId
    ) {
      setErrorMessage("Select the learning module for this step.");
      return;
    }

    const stepData = {
      pathway_id: selectedPathway.id,
      title: stepTitle.trim(),
      description: stepDescription.trim() || null,
      step_type: stepType,
      learning_module_id:
        stepType === "Learning Module" && stepLearningModuleId
          ? Number(stepLearningModuleId)
          : null,
      estimated_duration_days: stepDurationDays
        ? Number(stepDurationDays)
        : null,
      completion_required: stepCompletionRequired,
      manager_validation_required:
        stepManagerValidationRequired,
      evidence_required: stepEvidenceRequired,
      previous_step_required: stepPreviousRequired,
      instructions: stepInstructions.trim() || null,
      completion_criteria:
        stepCompletionCriteria.trim() || null,
    };

    setSaving(true);
    setErrorMessage("");

    if (editingStepId) {
      const { error } = await supabase
        .from("pathway_steps")
        .update(stepData)
        .eq("id", editingStepId);

      if (error) {
        setErrorMessage("The pathway step could not be updated.");
        setSaving(false);
        return;
      }

      setMessage("Pathway step updated.");
    } else {
      const nextSequence =
        steps.length === 0
          ? 1
          : Math.max(...steps.map((step) => step.sequence_number)) + 1;

      const { error } = await supabase
        .from("pathway_steps")
        .insert({
          ...stepData,
          sequence_number: nextSequence,
        });

      if (error) {
        setErrorMessage("The pathway step could not be added.");
        setSaving(false);
        return;
      }

      setMessage("Pathway step added.");
    }

    setSaving(false);
    setShowStepForm(false);
    resetStepForm();
    await loadPathwayWorkspace(selectedPathway.id);
  }

  async function moveStep(step: PathwayStep, direction: -1 | 1) {
    if (!selectedPathway) return;

    const currentIndex = steps.findIndex((item) => item.id === step.id);
    const targetIndex = currentIndex + direction;

    if (targetIndex < 0 || targetIndex >= steps.length) return;

    const target = steps[targetIndex];
    const temporary = Math.max(
      ...steps.map((item) => item.sequence_number)
    ) + 1000;

    const first = await supabase
      .from("pathway_steps")
      .update({ sequence_number: temporary })
      .eq("id", step.id);

    if (first.error) return;

    const second = await supabase
      .from("pathway_steps")
      .update({ sequence_number: step.sequence_number })
      .eq("id", target.id);

    if (second.error) return;

    await supabase
      .from("pathway_steps")
      .update({ sequence_number: target.sequence_number })
      .eq("id", step.id);

    await loadPathwayWorkspace(selectedPathway.id);
  }

  async function archiveStep(step: PathwayStep) {
    if (!selectedPathway) return;

    const confirmed = window.confirm(`Archive "${step.title}"?`);
    if (!confirmed) return;

    await supabase
      .from("pathway_steps")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq("id", step.id);

    await loadPathwayWorkspace(selectedPathway.id);
  }

  async function assignPathway() {
    if (!selectedPathway) return;

    if (!assignmentEmployeeId) {
      setErrorMessage("Select an employee.");
      return;
    }

    const { data, error } = await supabase
      .from("pathway_assignments")
      .insert({
        pathway_id: selectedPathway.id,
        employee_id: Number(assignmentEmployeeId),
        assigned_date: getTodayDate(),
        start_date: assignmentStartDate,
        target_completion_date:
          assignmentTargetCompletionDate || null,
        manager_employee_id: assignmentManagerId
          ? Number(assignmentManagerId)
          : null,
        status: "Assigned",
        progress_percent: 0,
        assignment_source: assignmentSource,
        manager_notes: assignmentManagerNotes.trim() || null,
      })
      .select("id")
      .single();

    if (error || !data) {
      setErrorMessage(
        error?.code === "23505"
          ? "This pathway is already actively assigned to that employee."
          : "The pathway could not be assigned."
      );
      return;
    }

    if (steps.length > 0) {
      await supabase.from("pathway_progress").insert(
        steps.map((step, index) => ({
          pathway_assignment_id: data.id,
          pathway_step_id: step.id,
          employee_id: Number(assignmentEmployeeId),
          status: index === 0 ? "Available" : "Not Started",
          progress_percent: 0,
        }))
      );
    }

    setAssignmentEmployeeId("");
    setAssignmentManagerId("");
    setAssignmentStartDate(getTodayDate());
    setAssignmentTargetCompletionDate("");
    setAssignmentSource("Direct");
    setAssignmentManagerNotes("");
    setShowAssignmentForm(false);
    setMessage("Pathway assigned.");

    await loadPathwayWorkspace(selectedPathway.id);
  }

  async function updateAssignment(
    assignment: PathwayAssignment,
    nextStatus: string,
    progress: number
  ) {
    if (!selectedPathway) return;

    const safeProgress = Math.min(100, Math.max(0, progress));

    await supabase
      .from("pathway_assignments")
      .update({
        status: nextStatus,
        progress_percent:
          nextStatus === "Completed" ? 100 : safeProgress,
        actual_completion_date:
          nextStatus === "Completed" ? getTodayDate() : null,
      })
      .eq("id", assignment.id);

    await loadPathwayWorkspace(selectedPathway.id);
  }

  async function archiveAssignment(assignmentId: number) {
    if (!selectedPathway) return;

    await supabase
      .from("pathway_assignments")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq("id", assignmentId);

    await loadPathwayWorkspace(selectedPathway.id);
  }

  async function saveReview() {
    if (!selectedPathway) return;

    if (!reviewSummary.trim()) {
      setErrorMessage("Enter the review summary.");
      return;
    }

    const { error } = await supabase.from("pathway_reviews").insert({
      pathway_id: selectedPathway.id,
      review_date: reviewDate,
      review_summary: reviewSummary.trim(),
      changes_required: reviewChangesRequired.trim() || null,
      outcome: reviewOutcome,
      next_review_date: reviewNextDate || null,
    });

    if (error) {
      setErrorMessage("The pathway review could not be saved.");
      return;
    }

    await supabase
      .from("development_pathways")
      .update({
        last_reviewed_at: new Date(
          `${reviewDate}T12:00:00`
        ).toISOString(),
        next_review_date: reviewNextDate || null,
        status:
          reviewOutcome === "Republish Required"
            ? "Under Review"
            : selectedPathway.status,
      })
      .eq("id", selectedPathway.id);

    setReviewDate(getTodayDate());
    setReviewSummary("");
    setReviewChangesRequired("");
    setReviewOutcome("No Change");
    setReviewNextDate("");
    setShowReviewForm(false);
    setMessage("Pathway review recorded.");

    await refreshSelectedPathway();
    await loadPathwayWorkspace(selectedPathway.id);
  }

  async function createVersion() {
    if (!selectedPathway) return;

    if (!versionSummary.trim()) {
      setErrorMessage("Enter a brief change summary.");
      return;
    }

    const nextVersion = selectedPathway.current_version_number + 1;

    const { error } = await supabase.from("pathway_versions").insert({
      pathway_id: selectedPathway.id,
      version_number: nextVersion,
      version_snapshot: {
        pathway: selectedPathway,
        steps,
      },
      change_summary: versionSummary.trim(),
      published_at: new Date().toISOString(),
    });

    if (error) {
      setErrorMessage("The pathway version could not be created.");
      return;
    }

    await supabase
      .from("development_pathways")
      .update({
        current_version_number: nextVersion,
        status: "Published",
      })
      .eq("id", selectedPathway.id);

    setVersionSummary("");
    setMessage(`Version ${nextVersion} created.`);

    await refreshSelectedPathway();
    await loadPathwayWorkspace(selectedPathway.id);
  }

  async function refreshSelectedPathway() {
    if (!selectedPathway) return;

    const { data } = await supabase
      .from("development_pathways")
      .select("*")
      .eq("id", selectedPathway.id)
      .single();

    if (data) setSelectedPathway(data as Pathway);

    await loadPathways();
  }

  const filteredPathways = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return pathways.filter((pathway) => {
      const matchesSearch =
        !search ||
        pathway.title.toLowerCase().includes(search) ||
        (pathway.purpose || "").toLowerCase().includes(search) ||
        (pathway.target_role || "").toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || pathway.status === statusFilter;

      const matchesType =
        typeFilter === "All" || pathway.pathway_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [pathways, searchTerm, statusFilter, typeFilter]);

  const employeeMap = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees]
  );

  const moduleMap = useMemo(
    () =>
      new Map(
        learningModules.map((module) => [module.id, module])
      ),
    [learningModules]
  );

  const assignedEmployeeIds = new Set(
    assignments
      .filter((assignment) => assignment.status !== "Cancelled")
      .map((assignment) => assignment.employee_id)
  );

  const availableEmployees = employees.filter(
    (employee) => !assignedEmployeeIds.has(employee.id)
  );

  const activePathways = pathways.filter(
    (pathway) => pathway.status === "Published"
  ).length;

  const pathwaysDueForReview = pathways.filter(
    (pathway) =>
      Boolean(pathway.next_review_date) &&
      pathway.next_review_date! <= getTodayDate()
  ).length;

  const totalEnrolled = assignments.filter(
    (assignment) => assignment.status !== "Cancelled"
  ).length;

  if (selectedPathway) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setSelectedPathway(null);
            setActiveTab("Overview");
            setMessage("");
            setErrorMessage("");
          }}
          style={backButtonStyle}
        >
          ← Back to Development Pathways
        </button>

        <div style={workspaceHeaderStyle}>
          <div>
            <div style={badgeRowStyle}>
              <span style={statusBadgeStyle}>
                {selectedPathway.status}
              </span>

              <span style={neutralBadgeStyle}>
                {selectedPathway.pathway_type}
              </span>

              <span style={neutralBadgeStyle}>
                {selectedPathway.assignment_type}
              </span>
            </div>

            <h2 style={workspaceTitleStyle}>
              {selectedPathway.title}
            </h2>

            <p style={workspaceDescriptionStyle}>
              {selectedPathway.purpose ||
                "No pathway purpose has been added."}
            </p>
          </div>

          <div style={versionBadgeStyle}>
            Version {selectedPathway.current_version_number}
          </div>
        </div>

        <div style={tabNavigationStyle}>
          {(
            [
              "Overview",
              "Learning Sequence",
              "Assignments",
              "Progress",
              "Reviews",
              "Version History",
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
          <div style={errorStyle}>{errorMessage}</div>
        )}

        {message && <div style={messageStyle}>{message}</div>}

        {workspaceLoading ? (
          <div style={emptyStateStyle}>
            Loading pathway workspace...
          </div>
        ) : (
          <div style={workspacePanelStyle}>
            {activeTab === "Overview" && (
              <div>
                <div style={sectionHeaderStyle}>
                  <div>
                    <h3 style={sectionTitleStyle}>Overview</h3>
                    <p style={sectionDescriptionStyle}>
                      Maintain the pathway purpose, audience,
                      ownership and review position.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPathwayForm(true)}
                    style={primaryButtonStyle}
                  >
                    Edit Overview
                  </button>
                </div>

                <div style={detailGridStyle}>
                  <DetailCard
                    label="Intended Audience"
                    value={
                      selectedPathway.intended_audience ||
                      "Not recorded"
                    }
                  />

                  <DetailCard
                    label="Target Role"
                    value={
                      selectedPathway.target_role || "Not set"
                    }
                  />

                  <DetailCard
                    label="Department"
                    value={
                      selectedPathway.target_department ||
                      "Not set"
                    }
                  />

                  <DetailCard
                    label="Location"
                    value={
                      selectedPathway.target_location || "Not set"
                    }
                  />

                  <DetailCard
                    label="Estimated Completion"
                    value={
                      selectedPathway.estimated_completion_days !==
                      null
                        ? `${selectedPathway.estimated_completion_days} days`
                        : "Not set"
                    }
                  />

                  <DetailCard
                    label="Next Review"
                    value={
                      selectedPathway.next_review_date
                        ? formatDate(selectedPathway.next_review_date)
                        : "Not set"
                    }
                  />
                </div>

                <div style={dangerZoneStyle}>
                  <div>
                    <h4 style={dangerTitleStyle}>
                      Archive Pathway
                    </h4>

                    <p style={dangerDescriptionStyle}>
                      Archive this pathway when it should no longer
                      be assigned. Existing history will remain
                      preserved.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void archivePathway()}
                    style={archiveButtonStyle}
                  >
                    Archive Pathway
                  </button>
                </div>
              </div>
            )}

            {activeTab === "Learning Sequence" && (
              <div>
                <div style={sectionHeaderStyle}>
                  <div>
                    <h3 style={sectionTitleStyle}>
                      Learning Sequence
                    </h3>

                    <p style={sectionDescriptionStyle}>
                      Build the ordered learning and validation
                      journey employees must follow.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      resetStepForm();
                      setShowStepForm(true);
                    }}
                    style={primaryButtonStyle}
                  >
                    Add Step
                  </button>
                </div>

                {steps.length === 0 ? (
                  <EmptyState
                    title="No pathway steps yet"
                    description="Add the first learning module, milestone or validation step."
                  />
                ) : (
                  <div style={listStyle}>
                    {steps.map((step, index) => (
                      <div key={step.id} style={stepCardStyle}>
                        <div style={stepNumberStyle}>{index + 1}</div>

                        <div style={flexContentStyle}>
                          <div style={cardHeaderStyle}>
                            <div>
                              <div style={eyebrowStyle}>
                                {step.step_type}
                              </div>

                              <h4 style={cardTitleStyle}>
                                {step.title}
                              </h4>
                            </div>

                            <span style={neutralBadgeStyle}>
                              {step.completion_required
                                ? "Required"
                                : "Optional"}
                            </span>
                          </div>

                          {step.description && (
                            <p style={cardDescriptionStyle}>
                              {step.description}
                            </p>
                          )}

                          {step.learning_module_id && (
                            <div style={linkedItemStyle}>
                              Linked learning:{" "}
                              {moduleMap.get(step.learning_module_id)
                                ?.title || "Learning module"}
                            </div>
                          )}

                          <div style={metaRowStyle}>
                            <span>
                              {step.estimated_duration_days !== null
                                ? `${step.estimated_duration_days} days`
                                : "Duration not set"}
                            </span>

                            {step.manager_validation_required && (
                              <span>Manager validation</span>
                            )}

                            {step.evidence_required && (
                              <span>Evidence required</span>
                            )}
                          </div>

                          <div style={cardActionsStyle}>
                            <button
                              type="button"
                              onClick={() => void moveStep(step, -1)}
                              disabled={index === 0}
                              style={smallButtonStyle}
                            >
                              Move up
                            </button>

                            <button
                              type="button"
                              onClick={() => void moveStep(step, 1)}
                              disabled={index === steps.length - 1}
                              style={smallButtonStyle}
                            >
                              Move down
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditStep(step)}
                              style={editButtonStyle}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => void archiveStep(step)}
                              style={smallButtonStyle}
                            >
                              Archive
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Assignments" && (
              <div>
                <div style={sectionHeaderStyle}>
                  <div>
                    <h3 style={sectionTitleStyle}>
                      Assignments
                    </h3>

                    <p style={sectionDescriptionStyle}>
                      Assign the pathway to employees and record
                      manager oversight and target dates.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAssignmentForm(true)}
                    style={primaryButtonStyle}
                  >
                    Assign Pathway
                  </button>
                </div>

                {assignments.length === 0 ? (
                  <EmptyState
                    title="No pathway assignments"
                    description="Assign this pathway when it is ready for an employee to begin."
                  />
                ) : (
                  <div style={listStyle}>
                    {assignments.map((assignment) => {
                      const employee = employeeMap.get(
                        assignment.employee_id
                      );

                      return (
                        <AssignmentCard
                          key={assignment.id}
                          assignment={assignment}
                          employeeName={
                            employee?.name ||
                            `Employee ${assignment.employee_id}`
                          }
                          employeeRole={employee?.role || null}
                          onUpdate={(nextStatus, progress) =>
                            void updateAssignment(
                              assignment,
                              nextStatus,
                              progress
                            )
                          }
                          onArchive={() =>
                            void archiveAssignment(assignment.id)
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Progress" && (
              <div>
                <div style={sectionHeaderStyle}>
                  <div>
                    <h3 style={sectionTitleStyle}>Progress</h3>
                    <p style={sectionDescriptionStyle}>
                      Review the overall position of employees
                      currently following this pathway.
                    </p>
                  </div>
                </div>

                <div style={summaryGridStyle}>
                  <SummaryCard
                    label="Employees Enrolled"
                    value={String(
                      assignments.filter(
                        (assignment) =>
                          assignment.status !== "Cancelled"
                      ).length
                    )}
                  />

                  <SummaryCard
                    label="In Progress"
                    value={String(
                      assignments.filter(
                        (assignment) =>
                          assignment.status === "In Progress"
                      ).length
                    )}
                  />

                  <SummaryCard
                    label="Awaiting Validation"
                    value={String(
                      assignments.filter(
                        (assignment) =>
                          assignment.status ===
                          "Awaiting Validation"
                      ).length
                    )}
                  />

                  <SummaryCard
                    label="Completed"
                    value={String(
                      assignments.filter(
                        (assignment) =>
                          assignment.status === "Completed"
                      ).length
                    )}
                  />
                </div>

                {assignments.length === 0 ? (
                  <EmptyState
                    title="No progress to display"
                    description="Progress will appear when employees are assigned to the pathway."
                  />
                ) : (
                  <div style={listStyle}>
                    {assignments.map((assignment) => {
                      const employee = employeeMap.get(
                        assignment.employee_id
                      );

                      return (
                        <div key={assignment.id} style={progressCardStyle}>
                          <div style={cardHeaderStyle}>
                            <div>
                              <h4 style={cardTitleStyle}>
                                {employee?.name ||
                                  `Employee ${assignment.employee_id}`}
                              </h4>

                              <div style={cardMetaStyle}>
                                {assignment.status}
                                {assignment.target_completion_date
                                  ? ` · Target ${formatDate(
                                      assignment.target_completion_date
                                    )}`
                                  : ""}
                              </div>
                            </div>

                            <strong style={progressValueStyle}>
                              {assignment.progress_percent}%
                            </strong>
                          </div>

                          <div style={progressTrackStyle}>
                            <div
                              style={{
                                ...progressBarStyle,
                                width: `${assignment.progress_percent}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Reviews" && (
              <div>
                <div style={sectionHeaderStyle}>
                  <div>
                    <h3 style={sectionTitleStyle}>Reviews</h3>

                    <p style={sectionDescriptionStyle}>
                      Preserve formal pathway reviews, required
                      changes and future review dates.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowReviewForm(true)}
                    style={primaryButtonStyle}
                  >
                    Record Review
                  </button>
                </div>

                {reviews.length === 0 ? (
                  <EmptyState
                    title="No pathway reviews"
                    description="Record a review when the pathway content, purpose or effectiveness is formally considered."
                  />
                ) : (
                  <div style={listStyle}>
                    {reviews.map((review) => (
                      <div key={review.id} style={reviewCardStyle}>
                        <div style={cardHeaderStyle}>
                          <div>
                            <div style={eyebrowStyle}>
                              {review.outcome}
                            </div>

                            <h4 style={cardTitleStyle}>
                              Review · {formatDate(review.review_date)}
                            </h4>
                          </div>

                          {review.next_review_date && (
                            <span style={neutralBadgeStyle}>
                              Next review{" "}
                              {formatDate(review.next_review_date)}
                            </span>
                          )}
                        </div>

                        <p style={cardDescriptionStyle}>
                          {review.review_summary}
                        </p>

                        {review.changes_required && (
                          <div style={linkedItemStyle}>
                            <strong>Changes required:</strong>{" "}
                            {review.changes_required}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Version History" && (
              <div>
                <div style={sectionHeaderStyle}>
                  <div>
                    <h3 style={sectionTitleStyle}>
                      Version History
                    </h3>

                    <p style={sectionDescriptionStyle}>
                      Preserve published pathway versions and a
                      record of material changes.
                    </p>
                  </div>

                  <span style={versionBadgeStyle}>
                    Current version{" "}
                    {selectedPathway.current_version_number}
                  </span>
                </div>

                <div style={versionPanelStyle}>
                  <FormField label="Change summary">
                    <textarea
                      value={versionSummary}
                      onChange={(event) =>
                        setVersionSummary(event.target.value)
                      }
                      placeholder="Summarise what changed in this version."
                      style={textareaStyle}
                    />
                  </FormField>

                  <div style={rightAlignedActionsStyle}>
                    <button
                      type="button"
                      onClick={() => void createVersion()}
                      style={primaryButtonStyle}
                    >
                      Create Published Version
                    </button>
                  </div>
                </div>

                {versions.length === 0 ? (
                  <EmptyState
                    title="No published versions preserved"
                    description="Create a version when the pathway is ready to be published or republished."
                  />
                ) : (
                  <div style={listStyle}>
                    {versions.map((version) => (
                      <div key={version.id} style={reviewCardStyle}>
                        <div style={eyebrowStyle}>
                          Version {version.version_number}
                        </div>

                        <p style={cardDescriptionStyle}>
                          {version.change_summary ||
                            "No change summary recorded."}
                        </p>

                        <div style={cardMetaStyle}>
                          {new Date(
                            version.published_at ||
                              version.created_at
                          ).toLocaleString("en-GB")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {showPathwayForm && (
          <ModalPanel
            title={
              selectedPathway
                ? "Edit Development Pathway"
                : "Create Development Pathway"
            }
            onClose={() => setShowPathwayForm(false)}
          >
            <PathwayForm
              title={title}
              setTitle={setTitle}
              purpose={purpose}
              setPurpose={setPurpose}
              intendedAudience={intendedAudience}
              setIntendedAudience={setIntendedAudience}
              targetRole={targetRole}
              setTargetRole={setTargetRole}
              targetDepartment={targetDepartment}
              setTargetDepartment={setTargetDepartment}
              targetLocation={targetLocation}
              setTargetLocation={setTargetLocation}
              category={category}
              setCategory={setCategory}
              status={status}
              setStatus={setStatus}
              pathwayType={pathwayType}
              setPathwayType={setPathwayType}
              assignmentType={assignmentType}
              setAssignmentType={setAssignmentType}
              estimatedCompletionDays={estimatedCompletionDays}
              setEstimatedCompletionDays={setEstimatedCompletionDays}
              reviewFrequencyMonths={reviewFrequencyMonths}
              setReviewFrequencyMonths={setReviewFrequencyMonths}
              nextReviewDate={nextReviewDate}
              setNextReviewDate={setNextReviewDate}
            />

            <ModalActions
              onCancel={() => setShowPathwayForm(false)}
              onSave={() => void savePathway()}
              saving={saving}
              saveLabel={
                selectedPathway ? "Save Overview" : "Create Pathway"
              }
            />
          </ModalPanel>
        )}

        {showStepForm && (
          <ModalPanel
            title={editingStepId ? "Edit Pathway Step" : "Add Pathway Step"}
            onClose={() => {
              setShowStepForm(false);
              resetStepForm();
            }}
          >
            <div style={formGridStyle}>
              <FormField label="Step title">
                <input
                  value={stepTitle}
                  onChange={(event) =>
                    setStepTitle(event.target.value)
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Step type">
                <select
                  value={stepType}
                  onChange={(event) =>
                    setStepType(event.target.value)
                  }
                  style={inputStyle}
                >
                  {stepTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </FormField>
            </div>

            {stepType === "Learning Module" && (
              <FormField label="Learning module">
                <select
                  value={stepLearningModuleId}
                  onChange={(event) =>
                    setStepLearningModuleId(event.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="">Select learning</option>

                  {learningModules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.title} · {module.status}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <FormField label="Description">
              <textarea
                value={stepDescription}
                onChange={(event) =>
                  setStepDescription(event.target.value)
                }
                style={textareaStyle}
              />
            </FormField>

            <div style={formGridStyle}>
              <FormField label="Estimated duration in days">
                <input
                  type="number"
                  min="0"
                  value={stepDurationDays}
                  onChange={(event) =>
                    setStepDurationDays(event.target.value)
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Completion criteria">
                <input
                  value={stepCompletionCriteria}
                  onChange={(event) =>
                    setStepCompletionCriteria(event.target.value)
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>

            <FormField label="Instructions">
              <textarea
                value={stepInstructions}
                onChange={(event) =>
                  setStepInstructions(event.target.value)
                }
                style={textareaStyle}
              />
            </FormField>

            <div style={optionGridStyle}>
              <Checkbox
                label="Completion required"
                checked={stepCompletionRequired}
                onChange={setStepCompletionRequired}
              />

              <Checkbox
                label="Previous step required"
                checked={stepPreviousRequired}
                onChange={setStepPreviousRequired}
              />

              <Checkbox
                label="Manager validation required"
                checked={stepManagerValidationRequired}
                onChange={setStepManagerValidationRequired}
              />

              <Checkbox
                label="Evidence required"
                checked={stepEvidenceRequired}
                onChange={setStepEvidenceRequired}
              />
            </div>

            <ModalActions
              onCancel={() => {
                setShowStepForm(false);
                resetStepForm();
              }}
              onSave={() => void saveStep()}
              saving={saving}
              saveLabel={editingStepId ? "Update Step" : "Add Step"}
            />
          </ModalPanel>
        )}

        {showAssignmentForm && (
          <ModalPanel
            title="Assign Development Pathway"
            onClose={() => setShowAssignmentForm(false)}
          >
            <div style={formGridStyle}>
              <FormField label="Employee">
                <select
                  value={assignmentEmployeeId}
                  onChange={(event) =>
                    setAssignmentEmployeeId(event.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="">Select employee</option>

                  {availableEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                      {employee.role ? ` · ${employee.role}` : ""}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Manager">
                <select
                  value={assignmentManagerId}
                  onChange={(event) =>
                    setAssignmentManagerId(event.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="">No manager selected</option>

                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div style={formGridStyle}>
              <FormField label="Start date">
                <input
                  type="date"
                  value={assignmentStartDate}
                  onChange={(event) =>
                    setAssignmentStartDate(event.target.value)
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Target completion date">
                <input
                  type="date"
                  value={assignmentTargetCompletionDate}
                  onChange={(event) =>
                    setAssignmentTargetCompletionDate(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>

            <FormField label="Assignment source">
              <select
                value={assignmentSource}
                onChange={(event) =>
                  setAssignmentSource(event.target.value)
                }
                style={inputStyle}
              >
                <option>Direct</option>
                <option>Role Change</option>
                <option>New Starter</option>
                <option>Talent</option>
                <option>Compliance</option>
                <option>Matter</option>
                <option>Employee Development</option>
                <option>Leo Recommendation</option>
                <option>Other</option>
              </select>
            </FormField>

            <FormField label="Manager notes">
              <textarea
                value={assignmentManagerNotes}
                onChange={(event) =>
                  setAssignmentManagerNotes(event.target.value)
                }
                style={textareaStyle}
              />
            </FormField>

            <ModalActions
              onCancel={() => setShowAssignmentForm(false)}
              onSave={() => void assignPathway()}
              saving={saving}
              saveLabel="Assign Pathway"
            />
          </ModalPanel>
        )}

        {showReviewForm && (
          <ModalPanel
            title="Record Pathway Review"
            onClose={() => setShowReviewForm(false)}
          >
            <div style={formGridStyle}>
              <FormField label="Review date">
                <input
                  type="date"
                  value={reviewDate}
                  onChange={(event) =>
                    setReviewDate(event.target.value)
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Outcome">
                <select
                  value={reviewOutcome}
                  onChange={(event) =>
                    setReviewOutcome(event.target.value)
                  }
                  style={inputStyle}
                >
                  {reviewOutcomes.map((outcome) => (
                    <option key={outcome}>{outcome}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Review summary">
              <textarea
                value={reviewSummary}
                onChange={(event) =>
                  setReviewSummary(event.target.value)
                }
                style={textareaStyle}
              />
            </FormField>

            <FormField label="Changes required">
              <textarea
                value={reviewChangesRequired}
                onChange={(event) =>
                  setReviewChangesRequired(event.target.value)
                }
                style={textareaStyle}
              />
            </FormField>

            <FormField label="Next review date">
              <input
                type="date"
                value={reviewNextDate}
                onChange={(event) =>
                  setReviewNextDate(event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <ModalActions
              onCancel={() => setShowReviewForm(false)}
              onSave={() => void saveReview()}
              saving={saving}
              saveLabel="Save Review"
            />
          </ModalPanel>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <h2 style={pageTitleStyle}>Development Pathways</h2>

          <p style={pageDescriptionStyle}>
            Build structured programmes for onboarding,
            progression, leadership and professional development.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreatePathway}
          style={primaryButtonStyle}
        >
          Create Pathway
        </button>
      </div>

      {errorMessage && (
        <div style={errorStyle}>{errorMessage}</div>
      )}

      {message && <div style={messageStyle}>{message}</div>}

      <div style={summaryGridStyle}>
        <SummaryCard
          label="Total Pathways"
          value={String(pathways.length)}
        />

        <SummaryCard
          label="Published"
          value={String(activePathways)}
        />

        <SummaryCard
          label="Employees Enrolled"
          value={String(totalEnrolled)}
        />

        <SummaryCard
          label="Due for Review"
          value={String(pathwaysDueForReview)}
        />
      </div>

      <div style={toolbarStyle}>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search pathways..."
          style={inputStyle}
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          style={inputStyle}
        >
          <option value="All">All statuses</option>

          {pathwayStatuses
            .filter((item) => item !== "Archived")
            .map((item) => (
              <option key={item}>{item}</option>
            ))}
        </select>

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          style={inputStyle}
        >
          <option value="All">All pathway types</option>

          {pathwayTypes.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={emptyStateStyle}>
          Loading development pathways...
        </div>
      ) : filteredPathways.length === 0 ? (
        <EmptyState
          title="No development pathways found"
          description="Create the organisation’s first pathway or adjust the search and filters."
        />
      ) : (
        <div style={pathwayGridStyle}>
          {filteredPathways.map((pathway) => (
            <button
              key={pathway.id}
              type="button"
              onClick={() => setSelectedPathway(pathway)}
              style={pathwayCardStyle}
            >
              <div style={cardHeaderStyle}>
                <div>
                  <div style={badgeRowStyle}>
                    <span style={statusBadgeStyle}>
                      {pathway.status}
                    </span>

                    <span style={neutralBadgeStyle}>
                      {pathway.pathway_type}
                    </span>
                  </div>

                  <h3 style={pathwayCardTitleStyle}>
                    {pathway.title}
                  </h3>
                </div>

                <span style={versionBadgeStyle}>
                  v{pathway.current_version_number}
                </span>
              </div>

              <p style={pathwayCardDescriptionStyle}>
                {pathway.purpose ||
                  "No pathway purpose has been added."}
              </p>

              <div style={pathwayMetaGridStyle}>
                <DetailItem
                  label="Audience"
                  value={
                    pathway.target_role ||
                    pathway.intended_audience ||
                    "Not set"
                  }
                />

                <DetailItem
                  label="Assignment"
                  value={pathway.assignment_type}
                />

                <DetailItem
                  label="Duration"
                  value={
                    pathway.estimated_completion_days !== null
                      ? `${pathway.estimated_completion_days} days`
                      : "Not set"
                  }
                />

                <DetailItem
                  label="Next Review"
                  value={
                    pathway.next_review_date
                      ? formatDate(pathway.next_review_date)
                      : "Not set"
                  }
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {showPathwayForm && (
        <ModalPanel
          title="Create Development Pathway"
          onClose={() => setShowPathwayForm(false)}
        >
          <PathwayForm
            title={title}
            setTitle={setTitle}
            purpose={purpose}
            setPurpose={setPurpose}
            intendedAudience={intendedAudience}
            setIntendedAudience={setIntendedAudience}
            targetRole={targetRole}
            setTargetRole={setTargetRole}
            targetDepartment={targetDepartment}
            setTargetDepartment={setTargetDepartment}
            targetLocation={targetLocation}
            setTargetLocation={setTargetLocation}
            category={category}
            setCategory={setCategory}
            status={status}
            setStatus={setStatus}
            pathwayType={pathwayType}
            setPathwayType={setPathwayType}
            assignmentType={assignmentType}
            setAssignmentType={setAssignmentType}
            estimatedCompletionDays={estimatedCompletionDays}
            setEstimatedCompletionDays={setEstimatedCompletionDays}
            reviewFrequencyMonths={reviewFrequencyMonths}
            setReviewFrequencyMonths={setReviewFrequencyMonths}
            nextReviewDate={nextReviewDate}
            setNextReviewDate={setNextReviewDate}
          />

          <ModalActions
            onCancel={() => setShowPathwayForm(false)}
            onSave={() => void savePathway()}
            saving={saving}
            saveLabel="Create Pathway"
          />
        </ModalPanel>
      )}
    </div>
  );
}

function PathwayForm({
  title,
  setTitle,
  purpose,
  setPurpose,
  intendedAudience,
  setIntendedAudience,
  targetRole,
  setTargetRole,
  targetDepartment,
  setTargetDepartment,
  targetLocation,
  setTargetLocation,
  category,
  setCategory,
  status,
  setStatus,
  pathwayType,
  setPathwayType,
  assignmentType,
  setAssignmentType,
  estimatedCompletionDays,
  setEstimatedCompletionDays,
  reviewFrequencyMonths,
  setReviewFrequencyMonths,
  nextReviewDate,
  setNextReviewDate,
}: {
  title: string;
  setTitle: (value: string) => void;
  purpose: string;
  setPurpose: (value: string) => void;
  intendedAudience: string;
  setIntendedAudience: (value: string) => void;
  targetRole: string;
  setTargetRole: (value: string) => void;
  targetDepartment: string;
  setTargetDepartment: (value: string) => void;
  targetLocation: string;
  setTargetLocation: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  status: PathwayStatus;
  setStatus: (value: PathwayStatus) => void;
  pathwayType: PathwayType;
  setPathwayType: (value: PathwayType) => void;
  assignmentType: AssignmentType;
  setAssignmentType: (value: AssignmentType) => void;
  estimatedCompletionDays: string;
  setEstimatedCompletionDays: (value: string) => void;
  reviewFrequencyMonths: string;
  setReviewFrequencyMonths: (value: string) => void;
  nextReviewDate: string;
  setNextReviewDate: (value: string) => void;
}) {
  return (
    <>
      <div style={formGridStyle}>
        <FormField label="Pathway title">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="For example, New Manager Programme"
            style={inputStyle}
          />
        </FormField>

        <FormField label="Status">
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as PathwayStatus)
            }
            style={inputStyle}
          >
            {pathwayStatuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Purpose">
        <textarea
          value={purpose}
          onChange={(event) => setPurpose(event.target.value)}
          placeholder="Explain what the pathway is intended to achieve."
          style={textareaStyle}
        />
      </FormField>

      <FormField label="Intended audience">
        <input
          value={intendedAudience}
          onChange={(event) =>
            setIntendedAudience(event.target.value)
          }
          placeholder="For example, employees moving into their first management role"
          style={inputStyle}
        />
      </FormField>

      <div style={formGridStyle}>
        <FormField label="Pathway type">
          <select
            value={pathwayType}
            onChange={(event) =>
              setPathwayType(event.target.value as PathwayType)
            }
            style={inputStyle}
          >
            {pathwayTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Assignment type">
          <select
            value={assignmentType}
            onChange={(event) =>
              setAssignmentType(
                event.target.value as AssignmentType
              )
            }
            style={inputStyle}
          >
            {assignmentTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </FormField>
      </div>

      <div style={formGridStyle}>
        <FormField label="Target role">
          <input
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            style={inputStyle}
          />
        </FormField>

        <FormField label="Department">
          <input
            value={targetDepartment}
            onChange={(event) =>
              setTargetDepartment(event.target.value)
            }
            style={inputStyle}
          />
        </FormField>
      </div>

      <div style={formGridStyle}>
        <FormField label="Location">
          <input
            value={targetLocation}
            onChange={(event) =>
              setTargetLocation(event.target.value)
            }
            style={inputStyle}
          />
        </FormField>

        <FormField label="Category">
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            style={inputStyle}
          />
        </FormField>
      </div>

      <div style={formGridStyle}>
        <FormField label="Estimated completion days">
          <input
            type="number"
            min="1"
            value={estimatedCompletionDays}
            onChange={(event) =>
              setEstimatedCompletionDays(event.target.value)
            }
            style={inputStyle}
          />
        </FormField>

        <FormField label="Review frequency in months">
          <input
            type="number"
            min="1"
            value={reviewFrequencyMonths}
            onChange={(event) =>
              setReviewFrequencyMonths(event.target.value)
            }
            style={inputStyle}
          />
        </FormField>
      </div>

      <FormField label="Next review date">
        <input
          type="date"
          value={nextReviewDate}
          onChange={(event) =>
            setNextReviewDate(event.target.value)
          }
          style={inputStyle}
        />
      </FormField>
    </>
  );
}

function AssignmentCard({
  assignment,
  employeeName,
  employeeRole,
  onUpdate,
  onArchive,
}: {
  assignment: PathwayAssignment;
  employeeName: string;
  employeeRole: string | null;
  onUpdate: (status: string, progress: number) => void;
  onArchive: () => void;
}) {
  const [status, setStatus] = useState(assignment.status);
  const [progress, setProgress] = useState(
    assignment.progress_percent
  );

  return (
    <div style={assignmentCardStyle}>
      <div style={cardHeaderStyle}>
        <div>
          <h4 style={cardTitleStyle}>{employeeName}</h4>

          <div style={cardMetaStyle}>
            {employeeRole || "Role not recorded"} · Assigned{" "}
            {formatDate(assignment.assigned_date)}
          </div>
        </div>

        <span style={statusBadgeStyle}>{assignment.status}</span>
      </div>

      <div style={formGridStyle}>
        <FormField label="Status">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            style={inputStyle}
          >
            {assignmentStatuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Progress %">
          <input
            type="number"
            min="0"
            max="100"
            value={progress}
            onChange={(event) =>
              setProgress(Number(event.target.value))
            }
            style={inputStyle}
          />
        </FormField>
      </div>

      <div style={progressTrackStyle}>
        <div
          style={{
            ...progressBarStyle,
            width: `${Math.min(100, Math.max(0, progress))}%`,
          }}
        />
      </div>

      <div style={cardActionsStyle}>
        <button
          type="button"
          onClick={() => onUpdate(status, progress)}
          style={editButtonStyle}
        >
          Save Progress
        </button>

        <button
          type="button"
          onClick={onArchive}
          style={smallButtonStyle}
        >
          Archive Assignment
        </button>
      </div>
    </div>
  );
}

function ModalPanel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={modalBackdropStyle}>
      <div style={modalPanelStyle}>
        <div style={modalHeaderStyle}>
          <h3 style={modalTitleStyle}>{title}</h3>

          <button
            type="button"
            onClick={onClose}
            style={closeButtonStyle}
          >
            Close
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function ModalActions({
  onCancel,
  onSave,
  saving,
  saveLabel,
}: {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  saveLabel: string;
}) {
  return (
    <div style={modalActionsStyle}>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        style={secondaryButtonStyle}
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        style={primaryButtonStyle}
      >
        {saving ? "Saving..." : saveLabel}
      </button>
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
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label style={checkboxStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />

      <span>{label}</span>
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
      <div style={summaryValueStyle}>{value}</div>
      <div style={summaryLabelStyle}>{label}</div>
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
      <div style={detailLabelStyle}>{label}</div>
      <div style={detailCardValueStyle}>{value}</div>
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
      <div style={detailLabelStyle}>{label}</div>
      <div style={detailValueStyle}>{value}</div>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div style={emptyStateStyle}>
      <div style={emptyIconStyle}>✦</div>
      <h4 style={emptyTitleStyle}>{title}</h4>
      <p style={emptyDescriptionStyle}>{description}</p>
    </div>
  );
}

function getTodayDate(): string {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(
    2,
    "0"
  )}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
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
  whiteSpace: "nowrap",
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
  background: "transparent",
  color: "#6E5084",
  border: "none",
  padding: 0,
  marginBottom: "15px",
  fontWeight: 700,
  cursor: "pointer",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "10px",
  marginBottom: "17px",
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
  gridTemplateColumns: "minmax(250px, 1fr) 190px 220px",
  gap: "10px",
  marginBottom: "18px",
};

const pathwayGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(310px, 1fr))",
  gap: "13px",
};

const pathwayCardStyle: React.CSSProperties = {
  width: "100%",
  padding: "17px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  textAlign: "left",
  cursor: "pointer",
};

const pathwayCardTitleStyle: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#111827",
  fontSize: "17px",
};

const pathwayCardDescriptionStyle: React.CSSProperties = {
  minHeight: "42px",
  margin: "10px 0 15px",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.55,
};

const pathwayMetaGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
  paddingTop: "13px",
  borderTop: "1px solid #E5E7EB",
};

const workspaceHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  padding: "20px",
  marginBottom: "15px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "14px",
};

const workspaceTitleStyle: React.CSSProperties = {
  margin: "9px 0 0",
  color: "#111827",
};

const workspaceDescriptionStyle: React.CSSProperties = {
  maxWidth: "760px",
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.5,
};

const badgeRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "7px",
  flexWrap: "wrap",
};

const statusBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 8px",
  background: "#F7F1FC",
  color: "#6E5084",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 800,
};

const neutralBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 8px",
  background: "#F9FAFB",
  color: "#6B7280",
  border: "1px solid #E5E7EB",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 700,
};

const versionBadgeStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const tabNavigationStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginBottom: "15px",
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

const workspacePanelStyle: React.CSSProperties = {
  minHeight: "320px",
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "18px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const sectionDescriptionStyle: React.CSSProperties = {
  maxWidth: "720px",
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.5,
};

const detailGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "11px",
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

const dangerZoneStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  padding: "16px",
  marginTop: "18px",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  background: "#F9FAFB",
};

const dangerTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#374151",
};

const dangerDescriptionStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "13px",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "11px",
};

const stepCardStyle: React.CSSProperties = {
  display: "flex",
  gap: "13px",
  padding: "15px",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  background: "#FFFFFF",
};

const stepNumberStyle: React.CSSProperties = {
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

const flexContentStyle: React.CSSProperties = {
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
  margin: "9px 0 0",
  color: "#4B5563",
  fontSize: "13px",
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
};

const linkedItemStyle: React.CSSProperties = {
  marginTop: "9px",
  padding: "9px",
  background: "#F9FAFB",
  borderRadius: "8px",
  color: "#4B5563",
  fontSize: "12px",
};

const metaRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "9px",
  flexWrap: "wrap",
  marginTop: "9px",
  color: "#6B7280",
  fontSize: "11px",
};

const cardActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "7px",
  flexWrap: "wrap",
  marginTop: "11px",
};

const smallButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "8px",
  padding: "7px 9px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
};

const editButtonStyle: React.CSSProperties = {
  ...smallButtonStyle,
  color: "#6E5084",
  border: "1px solid #CDB2E2",
};

const assignmentCardStyle: React.CSSProperties = {
  padding: "15px",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  background: "#FFFFFF",
};

const cardMetaStyle: React.CSSProperties = {
  marginTop: "5px",
  color: "#6B7280",
  fontSize: "12px",
};

const progressCardStyle: React.CSSProperties = {
  padding: "15px",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  background: "#FFFFFF",
};

const progressValueStyle: React.CSSProperties = {
  color: "#6E5084",
};

const progressTrackStyle: React.CSSProperties = {
  height: "8px",
  marginTop: "12px",
  overflow: "hidden",
  background: "#F3F4F6",
  borderRadius: "999px",
};

const progressBarStyle: React.CSSProperties = {
  height: "100%",
  background: "#6E5084",
  borderRadius: "999px",
};

const reviewCardStyle: React.CSSProperties = {
  padding: "15px",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  background: "#FFFFFF",
};

const versionPanelStyle: React.CSSProperties = {
  padding: "16px",
  marginBottom: "16px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "12px",
};

const rightAlignedActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
};

const modalBackdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "40px 18px",
  overflowY: "auto",
  background: "rgba(17, 24, 39, 0.35)",
};

const modalPanelStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "820px",
  padding: "20px",
  background: "#FFFFFF",
  borderRadius: "15px",
  boxShadow: "0 20px 60px rgba(17, 24, 39, 0.18)",
};

const modalHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
  marginBottom: "6px",
};

const modalTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const closeButtonStyle: React.CSSProperties = {
  background: "transparent",
  color: "#6B7280",
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
};

const modalActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "18px",
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
    "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "9px",
  marginTop: "14px",
};

const checkboxStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  padding: "11px",
  border: "1px solid #E5E7EB",
  borderRadius: "9px",
  background: "#F9FAFB",
  fontSize: "13px",
  fontWeight: 600,
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