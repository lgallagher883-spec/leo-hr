"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type AIProject = {
  id: number;
  organisation_id: string | null;
  title: string;
  project_type: string;
  status: string;
  description: string | null;
  objective: string | null;
  intended_audience: string | null;
  target_role: string | null;
  target_department: string | null;
  target_location: string | null;
  subject_area: string | null;
  output_format: string | null;
  tone: string | null;
  reading_level: string | null;
  language_code: string;
  estimated_duration_minutes: number | null;
  source_type: string;
  source_reference_type: string | null;
  source_reference_id: number | null;
  source_text: string | null;
  instructions: string | null;
  constraints: string | null;
  legal_review_required: boolean;
  equality_review_required: boolean;
  accessibility_review_required: boolean;
  manager_review_required: boolean;
  current_version_number: number;
  created_at: string;
  updated_at: string;
};

type AIMessage = {
  id: number;
  project_id: number;
  role: "system" | "user" | "assistant";
  message_type: string;
  content: string;
  sequence_number: number;
  model_name: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  created_at: string;
};

type AIOutput = {
  id: number;
  project_id: number;
  output_type: string;
  title: string;
  content: string;
  structured_content: Record<string, unknown> | null;
  status: string;
  version_number: number;
  parent_output_id: number | null;
  learning_module_id: number | null;
  development_pathway_id: number | null;
  published_reference_type: string | null;
  published_reference_id: number | null;
  generated_at: string;
  approved_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type AIReview = {
  id: number;
  project_id: number;
  output_id: number | null;
  review_type: string;
  review_status: string;
  summary: string | null;
  findings: Record<string, unknown> | null;
  recommendations: string | null;
  risk_level: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type AISourceFile = {
  id: number;
  project_id: number;
  file_name: string;
  original_file_name: string | null;
  file_path: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  source_category: string;
  extracted_text: string | null;
  extraction_status: string;
  uploaded_at: string;
};

type AITemplate = {
  id: number;
  name: string;
  template_type: string;
  description: string | null;
  prompt_template: string;
  default_output_type: string | null;
  default_tone: string | null;
  default_audience: string | null;
  default_constraints: string | null;
  system_template: boolean;
};

type IntelligenceFinding = {
  id: number;
  project_id: number | null;
  finding_type: string;
  title: string;
  summary: string;
  recommendation: string | null;
  priority: string;
  status: string;
  source_reference_type: string | null;
  source_reference_id: number | null;
  due_date: string | null;
  resolved_at: string | null;
  created_at: string;
};

type AIActivity = {
  id: number;
  project_id: number | null;
  output_id: number | null;
  activity_type: string;
  activity_summary: string;
  activity_details: Record<string, unknown> | null;
  created_at: string;
};

type Provider = {
  id: number;
  provider_key: string;
  name: string;
  category: string;
  description: string | null;
  setup_status: string;
};

type OrganisationConnection = {
  id: number;
  provider_id: number;
  status: string;
  health_status: string;
  account_display_name: string | null;
};

type ConnectionModule = {
  id: number;
  connection_id: number;
  module_key: string;
  is_enabled: boolean;
  allowed_actions: string[];
};

type ConnectionCapability = {
  id: number;
  connection_id: number;
  provider_capability_id: number;
  is_enabled: boolean;
  approval_status: string;
};

type ProviderCapability = {
  id: number;
  provider_id: number;
  capability_key: string;
  name: string;
  description: string | null;
  capability_group: string;
  direction: string;
  setup_status: string;
};

type ExternalExport = {
  id: number;
  project_id: number;
  output_id: number | null;
  connection_id: number;
  connection_job_id: number | null;
  export_type: string;
  external_resource_type: string | null;
  external_resource_id: string | null;
  external_url: string | null;
  status: string;
  requested_at: string;
  completed_at: string | null;
  last_synced_at: string | null;
  error_message: string | null;
};

type ConnectionJob = {
  id: number;
  connection_id: number;
  module_key: string;
  action_key: string;
  direction: string;
  title: string | null;
  status: string;
  progress_percent: number;
  result_url: string | null;
  error_message: string | null;
  requested_at: string;
  completed_at: string | null;
};

type LearningModule = {
  id: number;
  title: string;
  status: string;
};

type DevelopmentPathway = {
  id: number;
  title: string;
  status: string;
};

type WorkspaceTab =
  | "Overview"
  | "Conversation"
  | "Sources"
  | "Generated Content"
  | "Professional Review"
  | "Version History"
  | "Publish & Export"
  | "Activity";

type MainView =
  | "Dashboard"
  | "Projects"
  | "Create"
  | "Professional Review"
  | "Learning Intelligence";

const projectTypes = [
  "Create Learning",
  "Rewrite Learning",
  "Policy to Learning",
  "SOP to Learning",
  "Transcript to Learning",
  "Create Assessment",
  "Improve Assessment",
  "Create Scenario",
  "Create Practical Exercise",
  "Create Role Play",
  "Create Manager Guide",
  "Create Facilitator Guide",
  "Create Workbook",
  "Create Quick Reference Guide",
  "Create Knowledge Check",
  "Create Certificate Template",
  "Create Development Pathway",
  "Create Learning Series",
  "Improve Accessibility",
  "Plain English Rewrite",
  "Manager Rewrite",
  "Employee Rewrite",
  "Translate Learning",
  "Voiceover Script",
  "Presentation Script",
  "Toolbox Talk",
  "Induction Programme",
  "Professional Review",
  "Learning Intelligence",
  "Other",
];

const projectStatuses = [
  "Draft",
  "In Progress",
  "Awaiting Review",
  "Approved",
  "Published",
  "Archived",
];

const outputTypes = [
  "Learning Module",
  "Learning Section",
  "Assessment",
  "Question Set",
  "Scenario",
  "Practical Exercise",
  "Role Play",
  "Manager Guide",
  "Facilitator Guide",
  "Workbook",
  "Quick Reference Guide",
  "Knowledge Check",
  "Certificate Template",
  "Development Pathway",
  "Learning Series",
  "Accessibility Review",
  "Professional Review",
  "Translation",
  "Voiceover Script",
  "Presentation Script",
  "Toolbox Talk",
  "Induction Programme",
  "Learning Intelligence Report",
  "Other",
];

const outputStatuses = [
  "Draft",
  "Awaiting Review",
  "Approved",
  "Published",
  "Rejected",
  "Archived",
];

const reviewTypes = [
  "Employment Law",
  "Equality",
  "Bias",
  "Accessibility",
  "Tone",
  "Professionalism",
  "Accuracy",
  "Readability",
  "Missing Content",
  "Practicality",
  "Compliance",
  "Regulatory",
  "Full Professional Review",
  "Other",
];

const reviewStatuses = [
  "Pending",
  "In Review",
  "Passed",
  "Passed with Recommendations",
  "Changes Required",
  "Not Applicable",
];

const riskLevels = ["Low", "Moderate", "High", "Critical"];

const sourceCategories = [
  "Policy",
  "Procedure",
  "SOP",
  "Transcript",
  "Existing Learning",
  "Assessment",
  "Reference Material",
  "Supporting Document",
  "Other",
];

const sourceTypes = [
  "Manual",
  "Learning Module",
  "Policy",
  "Document",
  "Transcript",
  "Development Pathway",
  "Compliance",
  "Matter",
  "Employee Development",
  "Talent",
  "Imported",
  "Other",
];

const intelligenceTypes = [
  "Outdated Learning",
  "Duplicate Learning",
  "Learning Gap",
  "Role Gap",
  "Department Gap",
  "Mandatory Learning Missing",
  "Pathway Recommendation",
  "Review Required",
  "Low Completion",
  "Assessment Concern",
  "Certificate Risk",
  "Accessibility Concern",
  "Matter Trend",
  "Compliance Trend",
  "Talent Trend",
  "Other",
];

const intelligenceStatuses = [
  "Open",
  "Acknowledged",
  "Action Planned",
  "In Progress",
  "Resolved",
  "Dismissed",
];

const priorities = ["Low", "Normal", "High", "Urgent"];

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

export default function AIStudioWorkspace() {
  const router = useRouter();

  const [mainView, setMainView] = useState<MainView>("Dashboard");
  const [activeTab, setActiveTab] =
    useState<WorkspaceTab>("Overview");

  const [projects, setProjects] = useState<AIProject[]>([]);
  const [selectedProject, setSelectedProject] =
    useState<AIProject | null>(null);

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [outputs, setOutputs] = useState<AIOutput[]>([]);
  const [reviews, setReviews] = useState<AIReview[]>([]);
  const [sourceFiles, setSourceFiles] = useState<AISourceFile[]>([]);
  const [templates, setTemplates] = useState<AITemplate[]>([]);
  const [intelligence, setIntelligence] = useState<
    IntelligenceFinding[]
  >([]);
  const [activity, setActivity] = useState<AIActivity[]>([]);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [connections, setConnections] = useState<
    OrganisationConnection[]
  >([]);
  const [connectionModules, setConnectionModules] = useState<
    ConnectionModule[]
  >([]);
  const [connectionCapabilities, setConnectionCapabilities] =
    useState<ConnectionCapability[]>([]);
  const [providerCapabilities, setProviderCapabilities] = useState<
    ProviderCapability[]
  >([]);
  const [externalExports, setExternalExports] = useState<
    ExternalExport[]
  >([]);
  const [connectionJobs, setConnectionJobs] = useState<
    ConnectionJob[]
  >([]);

  const [learningModules, setLearningModules] = useState<
    LearningModule[]
  >([]);
  const [developmentPathways, setDevelopmentPathways] = useState<
    DevelopmentPathway[]
  >([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [projectTypeFilter, setProjectTypeFilter] = useState("All");
  const [projectStatusFilter, setProjectStatusFilter] =
    useState("All");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const [createTitle, setCreateTitle] = useState("");
  const [createProjectType, setCreateProjectType] =
    useState("Create Learning");
  const [createDescription, setCreateDescription] = useState("");
  const [createObjective, setCreateObjective] = useState("");
  const [createAudience, setCreateAudience] = useState("");
  const [createRole, setCreateRole] = useState("");
  const [createDepartment, setCreateDepartment] = useState("");
  const [createLocation, setCreateLocation] = useState("");
  const [createSubjectArea, setCreateSubjectArea] = useState("");
  const [createOutputFormat, setCreateOutputFormat] =
    useState("Learning Module");
  const [createTone, setCreateTone] = useState(
    "Professional and practical"
  );
  const [createReadingLevel, setCreateReadingLevel] =
    useState("General Workplace");
  const [createLanguageCode, setCreateLanguageCode] =
    useState("en-GB");
  const [createDuration, setCreateDuration] = useState("");
  const [createSourceType, setCreateSourceType] =
    useState("Manual");
  const [createSourceText, setCreateSourceText] = useState("");
  const [createInstructions, setCreateInstructions] = useState("");
  const [createConstraints, setCreateConstraints] = useState("");
  const [createLegalReview, setCreateLegalReview] = useState(false);
  const [createEqualityReview, setCreateEqualityReview] =
    useState(false);
  const [createAccessibilityReview, setCreateAccessibilityReview] =
    useState(false);
  const [createManagerReview, setCreateManagerReview] =
    useState(false);

  const [overviewTitle, setOverviewTitle] = useState("");
  const [overviewStatus, setOverviewStatus] = useState("Draft");
  const [overviewDescription, setOverviewDescription] =
    useState("");
  const [overviewObjective, setOverviewObjective] = useState("");
  const [overviewAudience, setOverviewAudience] = useState("");
  const [overviewRole, setOverviewRole] = useState("");
  const [overviewDepartment, setOverviewDepartment] = useState("");
  const [overviewLocation, setOverviewLocation] = useState("");
  const [overviewSubjectArea, setOverviewSubjectArea] = useState("");
  const [overviewOutputFormat, setOverviewOutputFormat] =
    useState("");
  const [overviewTone, setOverviewTone] = useState("");
  const [overviewReadingLevel, setOverviewReadingLevel] =
    useState("");
  const [overviewLanguageCode, setOverviewLanguageCode] =
    useState("en-GB");
  const [overviewDuration, setOverviewDuration] = useState("");
  const [overviewSourceText, setOverviewSourceText] = useState("");
  const [overviewInstructions, setOverviewInstructions] =
    useState("");
  const [overviewConstraints, setOverviewConstraints] = useState("");
  const [overviewLegalReview, setOverviewLegalReview] =
    useState(false);
  const [overviewEqualityReview, setOverviewEqualityReview] =
    useState(false);
  const [overviewAccessibilityReview, setOverviewAccessibilityReview] =
    useState(false);
  const [overviewManagerReview, setOverviewManagerReview] =
    useState(false);

  const [conversationInput, setConversationInput] = useState("");
  const [generationInstruction, setGenerationInstruction] =
    useState("");
  const [generationOutputType, setGenerationOutputType] =
    useState("Learning Module");
  const [generationTitle, setGenerationTitle] = useState("");

  const [selectedOutput, setSelectedOutput] =
    useState<AIOutput | null>(null);
  const [outputTitle, setOutputTitle] = useState("");
  const [outputContent, setOutputContent] = useState("");
  const [outputStatus, setOutputStatus] = useState("Draft");

  const [sourceCategory, setSourceCategory] =
    useState("Supporting Document");
  const [sourceFile, setSourceFile] = useState<File | null>(null);

  const [reviewOutputId, setReviewOutputId] = useState("");
  const [reviewType, setReviewType] =
    useState("Full Professional Review");
  const [reviewStatus, setReviewStatus] = useState("Pending");
  const [reviewSummary, setReviewSummary] = useState("");
  const [reviewRecommendations, setReviewRecommendations] =
    useState("");
  const [reviewRiskLevel, setReviewRiskLevel] = useState("Low");

  const [findingType, setFindingType] =
    useState("Learning Gap");
  const [findingTitle, setFindingTitle] = useState("");
  const [findingSummary, setFindingSummary] = useState("");
  const [findingRecommendation, setFindingRecommendation] =
    useState("");
  const [findingPriority, setFindingPriority] =
    useState("Normal");
  const [findingDueDate, setFindingDueDate] = useState("");

  const [publishLearningTitle, setPublishLearningTitle] =
    useState("");
  const [publishPathwayTitle, setPublishPathwayTitle] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadPageData();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      populateOverview(selectedProject);
      void loadProjectWorkspace(selectedProject.id);
    }
  }, [selectedProject?.id]);

  useEffect(() => {
    if (selectedOutput) {
      setOutputTitle(selectedOutput.title);
      setOutputContent(selectedOutput.content);
      setOutputStatus(selectedOutput.status);
    } else {
      setOutputTitle("");
      setOutputContent("");
      setOutputStatus("Draft");
    }
  }, [selectedOutput?.id]);

  async function loadPageData() {
    setLoading(true);
    setErrorMessage("");

    const [
      projectsResult,
      templatesResult,
      intelligenceResult,
      providersResult,
      connectionsResult,
      modulesResult,
      capabilitiesResult,
      providerCapabilitiesResult,
      learningModulesResult,
      pathwaysResult,
    ] = await Promise.all([
      supabase
        .from("learning_ai_projects")
        .select("*")
        .eq("is_archived", false)
        .order("updated_at", { ascending: false }),

      supabase
        .from("learning_ai_templates")
        .select("*")
        .eq("is_active", true)
        .eq("is_archived", false)
        .order("system_template", { ascending: false })
        .order("name"),

      supabase
        .from("learning_ai_intelligence")
        .select("*")
        .eq("is_archived", false)
        .order("created_at", { ascending: false }),

      supabase
        .from("connection_providers")
        .select("id, provider_key, name, category, description, setup_status")
        .eq("is_active", true)
        .eq("is_archived", false)
        .order("display_order"),

      supabase
        .from("organisation_connections")
        .select("id, provider_id, status, health_status, account_display_name")
        .eq("is_archived", false),

      supabase
        .from("organisation_connection_modules")
        .select("*")
        .eq("module_key", "AI Studio")
        .eq("is_enabled", true),

      supabase
        .from("organisation_connection_capabilities")
        .select("*")
        .eq("is_enabled", true)
        .eq("approval_status", "Approved"),

      supabase
        .from("connection_provider_capabilities")
        .select("*")
        .eq("is_active", true),

      supabase
        .from("learning_modules")
        .select("id, title, status")
        .eq("is_archived", false)
        .order("title"),

      supabase
        .from("development_pathways")
        .select("id, title, status")
        .eq("is_archived", false)
        .order("title"),
    ]);

    const firstError =
      projectsResult.error ||
      templatesResult.error ||
      intelligenceResult.error ||
      providersResult.error ||
      connectionsResult.error ||
      modulesResult.error ||
      capabilitiesResult.error ||
      providerCapabilitiesResult.error ||
      learningModulesResult.error ||
      pathwaysResult.error;

    if (firstError) {
      console.error("Error loading AI Studio:", firstError);
      setErrorMessage("AI Studio could not be loaded.");
      setLoading(false);
      return;
    }

    setProjects((projectsResult.data || []) as AIProject[]);
    setTemplates((templatesResult.data || []) as AITemplate[]);
    setIntelligence(
      (intelligenceResult.data || []) as IntelligenceFinding[]
    );
    setProviders((providersResult.data || []) as Provider[]);
    setConnections(
      (connectionsResult.data || []) as OrganisationConnection[]
    );
    setConnectionModules(
      (modulesResult.data || []) as ConnectionModule[]
    );
    setConnectionCapabilities(
      (capabilitiesResult.data || []) as ConnectionCapability[]
    );
    setProviderCapabilities(
      (providerCapabilitiesResult.data || []) as ProviderCapability[]
    );
    setLearningModules(
      (learningModulesResult.data || []) as LearningModule[]
    );
    setDevelopmentPathways(
      (pathwaysResult.data || []) as DevelopmentPathway[]
    );

    setLoading(false);
  }

  async function loadProjectWorkspace(projectId: number) {
    setWorkspaceLoading(true);
    setErrorMessage("");

    const [
      messagesResult,
      outputsResult,
      reviewsResult,
      filesResult,
      activityResult,
      exportsResult,
    ] = await Promise.all([
      supabase
        .from("learning_ai_messages")
        .select("*")
        .eq("project_id", projectId)
        .order("sequence_number"),

      supabase
        .from("learning_ai_outputs")
        .select("*")
        .eq("project_id", projectId)
        .eq("is_archived", false)
        .order("version_number", { ascending: false })
        .order("updated_at", { ascending: false }),

      supabase
        .from("learning_ai_reviews")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),

      supabase
        .from("learning_ai_source_files")
        .select("*")
        .eq("project_id", projectId)
        .eq("is_archived", false)
        .order("uploaded_at", { ascending: false }),

      supabase
        .from("learning_ai_activity_history")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),

      supabase
        .from("learning_ai_external_exports")
        .select("*")
        .eq("project_id", projectId)
        .order("requested_at", { ascending: false }),
    ]);

    const firstError =
      messagesResult.error ||
      outputsResult.error ||
      reviewsResult.error ||
      filesResult.error ||
      activityResult.error ||
      exportsResult.error;

    if (firstError) {
      console.error("Error loading AI Studio project:", firstError);
      setErrorMessage("The AI Studio project could not be loaded.");
      setWorkspaceLoading(false);
      return;
    }

    const loadedExports =
      (exportsResult.data || []) as ExternalExport[];

    const jobIds = loadedExports
      .map((item) => item.connection_job_id)
      .filter((id): id is number => id !== null);

    let loadedJobs: ConnectionJob[] = [];

    if (jobIds.length > 0) {
      const { data: jobsData, error: jobsError } = await supabase
        .from("connection_jobs")
        .select("*")
        .in("id", jobIds)
        .order("requested_at", { ascending: false });

      if (!jobsError) {
        loadedJobs = (jobsData || []) as ConnectionJob[];
      }
    }

    setMessages((messagesResult.data || []) as AIMessage[]);
    setOutputs((outputsResult.data || []) as AIOutput[]);
    setReviews((reviewsResult.data || []) as AIReview[]);
    setSourceFiles((filesResult.data || []) as AISourceFile[]);
    setActivity((activityResult.data || []) as AIActivity[]);
    setExternalExports(loadedExports);
    setConnectionJobs(loadedJobs);

    setSelectedOutput(null);
    setWorkspaceLoading(false);
  }

  function populateOverview(project: AIProject) {
    setOverviewTitle(project.title);
    setOverviewStatus(project.status);
    setOverviewDescription(project.description || "");
    setOverviewObjective(project.objective || "");
    setOverviewAudience(project.intended_audience || "");
    setOverviewRole(project.target_role || "");
    setOverviewDepartment(project.target_department || "");
    setOverviewLocation(project.target_location || "");
    setOverviewSubjectArea(project.subject_area || "");
    setOverviewOutputFormat(project.output_format || "");
    setOverviewTone(project.tone || "");
    setOverviewReadingLevel(project.reading_level || "");
    setOverviewLanguageCode(project.language_code || "en-GB");
    setOverviewDuration(
      project.estimated_duration_minutes !== null
        ? String(project.estimated_duration_minutes)
        : ""
    );
    setOverviewSourceText(project.source_text || "");
    setOverviewInstructions(project.instructions || "");
    setOverviewConstraints(project.constraints || "");
    setOverviewLegalReview(project.legal_review_required);
    setOverviewEqualityReview(project.equality_review_required);
    setOverviewAccessibilityReview(
      project.accessibility_review_required
    );
    setOverviewManagerReview(project.manager_review_required);
  }

  function resetCreateForm() {
    setSelectedTemplateId("");
    setCreateTitle("");
    setCreateProjectType("Create Learning");
    setCreateDescription("");
    setCreateObjective("");
    setCreateAudience("");
    setCreateRole("");
    setCreateDepartment("");
    setCreateLocation("");
    setCreateSubjectArea("");
    setCreateOutputFormat("Learning Module");
    setCreateTone("Professional and practical");
    setCreateReadingLevel("General Workplace");
    setCreateLanguageCode("en-GB");
    setCreateDuration("");
    setCreateSourceType("Manual");
    setCreateSourceText("");
    setCreateInstructions("");
    setCreateConstraints("");
    setCreateLegalReview(false);
    setCreateEqualityReview(false);
    setCreateAccessibilityReview(false);
    setCreateManagerReview(false);
    setErrorMessage("");
  }

  function applyTemplate(templateId: string) {
    setSelectedTemplateId(templateId);

    const template = templates.find(
      (item) => item.id === Number(templateId)
    );

    if (!template) return;

    setCreateProjectType(template.template_type);
    setCreateDescription(template.description || "");
    setCreateInstructions(template.prompt_template);
    setCreateOutputFormat(
      template.default_output_type || "Learning Module"
    );
    setCreateTone(
      template.default_tone || "Professional and practical"
    );
    setCreateAudience(template.default_audience || "");
    setCreateConstraints(template.default_constraints || "");
  }

  async function createProject() {
    if (!createTitle.trim()) {
      setErrorMessage("Enter the project title.");
      return;
    }

    if (!createObjective.trim()) {
      setErrorMessage("Enter the project objective.");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const { data, error } = await supabase
      .from("learning_ai_projects")
      .insert({
        title: createTitle.trim(),
        project_type: createProjectType,
        status: "Draft",
        description: createDescription.trim() || null,
        objective: createObjective.trim(),
        intended_audience: createAudience.trim() || null,
        target_role: createRole.trim() || null,
        target_department: createDepartment.trim() || null,
        target_location: createLocation.trim() || null,
        subject_area: createSubjectArea.trim() || null,
        output_format: createOutputFormat || null,
        tone: createTone || null,
        reading_level: createReadingLevel || null,
        language_code: createLanguageCode || "en-GB",
        estimated_duration_minutes: createDuration
          ? Number(createDuration)
          : null,
        source_type: createSourceType,
        source_text: createSourceText.trim() || null,
        instructions: createInstructions.trim() || null,
        constraints: createConstraints.trim() || null,
        legal_review_required: createLegalReview,
        equality_review_required: createEqualityReview,
        accessibility_review_required: createAccessibilityReview,
        manager_review_required: createManagerReview,
        current_version_number: 1,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("Error creating AI Studio project:", error);
      setErrorMessage("The AI Studio project could not be created.");
      setSaving(false);
      return;
    }

    await supabase.from("learning_ai_messages").insert({
      project_id: data.id,
      role: "system",
      message_type: "Instruction",
      content: buildProjectInstruction(data as AIProject),
      sequence_number: 1,
    });

    await recordActivity({
      projectId: data.id,
      outputId: null,
      activityType: "Project Created",
      summary: `${data.title} created in AI Studio.`,
      details: {
        project_type: data.project_type,
        output_format: data.output_format,
      },
    });

    setSaving(false);
    setShowCreateForm(false);
    resetCreateForm();

    await loadPageData();
    setSelectedProject(data as AIProject);
    setMainView("Projects");
  }

  async function saveProjectOverview() {
    if (!selectedProject) return;

    if (!overviewTitle.trim()) {
      setErrorMessage("Enter the project title.");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const { data, error } = await supabase
      .from("learning_ai_projects")
      .update({
        title: overviewTitle.trim(),
        status: overviewStatus,
        description: overviewDescription.trim() || null,
        objective: overviewObjective.trim() || null,
        intended_audience: overviewAudience.trim() || null,
        target_role: overviewRole.trim() || null,
        target_department: overviewDepartment.trim() || null,
        target_location: overviewLocation.trim() || null,
        subject_area: overviewSubjectArea.trim() || null,
        output_format: overviewOutputFormat.trim() || null,
        tone: overviewTone.trim() || null,
        reading_level: overviewReadingLevel.trim() || null,
        language_code: overviewLanguageCode || "en-GB",
        estimated_duration_minutes: overviewDuration
          ? Number(overviewDuration)
          : null,
        source_text: overviewSourceText.trim() || null,
        instructions: overviewInstructions.trim() || null,
        constraints: overviewConstraints.trim() || null,
        legal_review_required: overviewLegalReview,
        equality_review_required: overviewEqualityReview,
        accessibility_review_required:
          overviewAccessibilityReview,
        manager_review_required: overviewManagerReview,
      })
      .eq("id", selectedProject.id)
      .select("*")
      .single();

    if (error || !data) {
      console.error("Error saving AI Studio project:", error);
      setErrorMessage("The project could not be updated.");
      setSaving(false);
      return;
    }

    await recordActivity({
      projectId: selectedProject.id,
      outputId: null,
      activityType:
        selectedProject.status !== overviewStatus
          ? "Status Changed"
          : "Project Updated",
      summary: `${overviewTitle.trim()} updated.`,
      details: {
        status: overviewStatus,
      },
    });

    setSelectedProject(data as AIProject);
    setMessage("Project updated.");
    setSaving(false);

    await loadPageData();
  }

  async function archiveProject() {
    if (!selectedProject) return;

    const confirmed = window.confirm(
      `Archive "${selectedProject.title}"?\n\nThe project, sources, messages, outputs, reviews, exports and activity history will remain preserved.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("learning_ai_projects")
      .update({
        status: "Archived",
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq("id", selectedProject.id);

    if (error) {
      setErrorMessage("The project could not be archived.");
      return;
    }

    await recordActivity({
      projectId: selectedProject.id,
      outputId: null,
      activityType: "Archived",
      summary: `${selectedProject.title} archived.`,
      details: null,
    });

    setSelectedProject(null);
    setMessage("AI Studio project archived.");
    await loadPageData();
  }

  async function sendConversationMessage() {
    if (!selectedProject) return;

    if (!conversationInput.trim()) {
      setErrorMessage("Enter a message for Leo.");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const nextSequence =
      messages.length > 0
        ? Math.max(...messages.map((item) => item.sequence_number)) + 1
        : 1;

    const { error } = await supabase
      .from("learning_ai_messages")
      .insert({
        project_id: selectedProject.id,
        role: "user",
        message_type: "Conversation",
        content: conversationInput.trim(),
        sequence_number: nextSequence,
      });

    if (error) {
      setErrorMessage("The message could not be saved.");
      setSaving(false);
      return;
    }

    const submittedMessage = conversationInput.trim();
    setConversationInput("");

    await supabase
      .from("learning_ai_projects")
      .update({
        status:
          selectedProject.status === "Draft"
            ? "In Progress"
            : selectedProject.status,
      })
      .eq("id", selectedProject.id);

    await recordActivity({
      projectId: selectedProject.id,
      outputId: null,
      activityType: "Project Updated",
      summary: "A new project instruction was added.",
      details: {
        instruction: submittedMessage,
      },
    });

    setSaving(false);
    await loadProjectWorkspace(selectedProject.id);
  }

  async function generateOutput() {
    if (!selectedProject) return;

    if (!generationInstruction.trim()) {
      setErrorMessage("Tell Leo what you want it to create.");
      return;
    }

    const proposedTitle =
      generationTitle.trim() ||
      `${selectedProject.title} — ${generationOutputType}`;

    setGenerating(true);
    setMessage("");
    setErrorMessage("");

    const nextSequence =
      messages.length > 0
        ? Math.max(...messages.map((item) => item.sequence_number)) + 1
        : 1;

    const { error: messageError } = await supabase
      .from("learning_ai_messages")
      .insert({
        project_id: selectedProject.id,
        role: "user",
        message_type: "Instruction",
        content: generationInstruction.trim(),
        sequence_number: nextSequence,
      });

    if (messageError) {
      setErrorMessage("The generation instruction could not be saved.");
      setGenerating(false);
      return;
    }

    await recordActivity({
      projectId: selectedProject.id,
      outputId: null,
      activityType: "Generation Started",
      summary: `${generationOutputType} generation requested.`,
      details: {
        title: proposedTitle,
      },
    });

    try {
      const response = await fetch("/api/leo-learn/ai-studio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project: selectedProject,
          messages: [
            ...messages,
            {
              role: "user",
              content: generationInstruction.trim(),
            },
          ],
          outputType: generationOutputType,
          outputTitle: proposedTitle,
          sourceFiles: sourceFiles.map((file) => ({
            name: file.original_file_name || file.file_name,
            category: file.source_category,
            extractedText: file.extracted_text,
          })),
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();

        throw new Error(
          responseText ||
            "The AI Studio generation route is not available."
        );
      }

      const result = (await response.json()) as {
        content?: string;
        structuredContent?: Record<string, unknown>;
        assistantMessage?: string;
        modelName?: string;
        promptTokens?: number;
        completionTokens?: number;
      };

      if (!result.content?.trim()) {
        throw new Error("Leo returned an empty draft.");
      }

      const nextVersion =
        outputs
          .filter(
            (output) =>
              output.output_type === generationOutputType
          )
          .reduce(
            (highest, output) =>
              Math.max(highest, output.version_number),
            0
          ) + 1;

      const { data: createdOutput, error: outputError } =
        await supabase
          .from("learning_ai_outputs")
          .insert({
            project_id: selectedProject.id,
            output_type: generationOutputType,
            title: proposedTitle,
            content: result.content.trim(),
            structured_content:
              result.structuredContent || null,
            status: "Draft",
            version_number: nextVersion,
          })
          .select("*")
          .single();

      if (outputError || !createdOutput) {
        throw new Error("The generated output could not be saved.");
      }

      await supabase.from("learning_ai_messages").insert({
        project_id: selectedProject.id,
        role: "assistant",
        message_type: "Draft",
        content:
          result.assistantMessage ||
          `${proposedTitle} has been created and saved as a working draft.`,
        sequence_number: nextSequence + 1,
        model_name: result.modelName || null,
        prompt_tokens: result.promptTokens || null,
        completion_tokens: result.completionTokens || null,
      });

      await supabase
        .from("learning_ai_projects")
        .update({
          status: "In Progress",
          current_version_number: Math.max(
            selectedProject.current_version_number,
            nextVersion
          ),
        })
        .eq("id", selectedProject.id);

      await recordActivity({
        projectId: selectedProject.id,
        outputId: createdOutput.id,
        activityType: "Output Generated",
        summary: `${proposedTitle} generated.`,
        details: {
          output_type: generationOutputType,
          version_number: nextVersion,
        },
      });

      setGenerationInstruction("");
      setGenerationTitle("");
      setMessage("Leo created and saved the new draft.");
      setActiveTab("Generated Content");

      await loadProjectWorkspace(selectedProject.id);
      await loadPageData();
    } catch (error) {
      console.error("AI Studio generation failed:", error);

      setErrorMessage(
        error instanceof Error
          ? `${error.message} The AI Studio page is ready, but the secure server generation route must be active before Leo can generate live content.`
          : "Leo could not generate the draft."
      );
    }

    setGenerating(false);
  }

  async function createManualOutput() {
    if (!selectedProject) return;

    if (!generationTitle.trim()) {
      setErrorMessage("Enter the output title.");
      return;
    }

    if (!generationInstruction.trim()) {
      setErrorMessage("Enter the draft content.");
      return;
    }

    const nextVersion =
      outputs
        .filter(
          (output) => output.output_type === generationOutputType
        )
        .reduce(
          (highest, output) =>
            Math.max(highest, output.version_number),
          0
        ) + 1;

    const { data, error } = await supabase
      .from("learning_ai_outputs")
      .insert({
        project_id: selectedProject.id,
        output_type: generationOutputType,
        title: generationTitle.trim(),
        content: generationInstruction.trim(),
        status: "Draft",
        version_number: nextVersion,
      })
      .select("*")
      .single();

    if (error || !data) {
      setErrorMessage("The working draft could not be saved.");
      return;
    }

    await recordActivity({
      projectId: selectedProject.id,
      outputId: data.id,
      activityType: "Output Generated",
      summary: `${data.title} added as a working draft.`,
      details: {
        output_type: data.output_type,
        version_number: data.version_number,
        source: "Manual",
      },
    });

    setGenerationTitle("");
    setGenerationInstruction("");
    setMessage("Working draft saved.");
    await loadProjectWorkspace(selectedProject.id);
  }

  async function saveOutput() {
    if (!selectedProject || !selectedOutput) return;

    if (!outputTitle.trim() || !outputContent.trim()) {
      setErrorMessage("The output title and content are required.");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const { data, error } = await supabase
      .from("learning_ai_outputs")
      .update({
        title: outputTitle.trim(),
        content: outputContent.trim(),
        status: outputStatus,
        approved_at:
          outputStatus === "Approved"
            ? new Date().toISOString()
            : selectedOutput.approved_at,
        published_at:
          outputStatus === "Published"
            ? new Date().toISOString()
            : selectedOutput.published_at,
      })
      .eq("id", selectedOutput.id)
      .select("*")
      .single();

    if (error || !data) {
      setErrorMessage("The generated output could not be updated.");
      setSaving(false);
      return;
    }

    await recordActivity({
      projectId: selectedProject.id,
      outputId: selectedOutput.id,
      activityType:
        selectedOutput.status !== outputStatus
          ? "Status Changed"
          : "Output Revised",
      summary: `${outputTitle.trim()} updated.`,
      details: {
        status: outputStatus,
      },
    });

    setSelectedOutput(data as AIOutput);
    setMessage("Generated output updated.");
    setSaving(false);

    await loadProjectWorkspace(selectedProject.id);
  }

  async function createNewOutputVersion() {
    if (!selectedProject || !selectedOutput) return;

    if (!outputTitle.trim() || !outputContent.trim()) {
      setErrorMessage("The output title and content are required.");
      return;
    }

    const nextVersion =
      outputs
        .filter(
          (output) =>
            output.output_type === selectedOutput.output_type
        )
        .reduce(
          (highest, output) =>
            Math.max(highest, output.version_number),
          0
        ) + 1;

    const { data, error } = await supabase
      .from("learning_ai_outputs")
      .insert({
        project_id: selectedProject.id,
        output_type: selectedOutput.output_type,
        title: outputTitle.trim(),
        content: outputContent.trim(),
        structured_content: selectedOutput.structured_content,
        status: "Draft",
        version_number: nextVersion,
        parent_output_id: selectedOutput.id,
      })
      .select("*")
      .single();

    if (error || !data) {
      setErrorMessage("The new output version could not be created.");
      return;
    }

    await supabase
      .from("learning_ai_projects")
      .update({
        current_version_number: Math.max(
          selectedProject.current_version_number,
          nextVersion
        ),
      })
      .eq("id", selectedProject.id);

    await recordActivity({
      projectId: selectedProject.id,
      outputId: data.id,
      activityType: "Output Revised",
      summary: `${data.title} version ${nextVersion} created.`,
      details: {
        previous_output_id: selectedOutput.id,
        version_number: nextVersion,
      },
    });

    setSelectedOutput(data as AIOutput);
    setMessage(`Version ${nextVersion} created.`);

    await loadProjectWorkspace(selectedProject.id);
    await loadPageData();
  }

  async function archiveOutput(output: AIOutput) {
    if (!selectedProject) return;

    const confirmed = window.confirm(
      `Archive "${output.title}" version ${output.version_number}?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("learning_ai_outputs")
      .update({
        status: "Archived",
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq("id", output.id);

    if (error) {
      setErrorMessage("The output could not be archived.");
      return;
    }

    await recordActivity({
      projectId: selectedProject.id,
      outputId: output.id,
      activityType: "Archived",
      summary: `${output.title} version ${output.version_number} archived.`,
      details: null,
    });

    if (selectedOutput?.id === output.id) {
      setSelectedOutput(null);
    }

    await loadProjectWorkspace(selectedProject.id);
  }

  async function uploadSourceFile() {
    if (!selectedProject) return;

    if (!sourceFile) {
      setErrorMessage("Choose a source file.");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const safeFileName = sourceFile.name.replace(
      /[^a-zA-Z0-9.\-_]/g,
      "_"
    );

    const filePath = `${selectedProject.id}/${Date.now()}-${safeFileName}`;

    const upload = await supabase.storage
      .from("learning-ai-studio")
      .upload(filePath, sourceFile);

    if (upload.error) {
      console.error("Error uploading AI Studio source:", upload.error);
      setErrorMessage("The source file could not be uploaded.");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("learning_ai_source_files")
      .insert({
        project_id: selectedProject.id,
        file_name: safeFileName,
        original_file_name: sourceFile.name,
        file_path: filePath,
        mime_type: sourceFile.type || null,
        file_size_bytes: sourceFile.size,
        source_category: sourceCategory,
        extraction_status: "Not Processed",
      })
      .select("*")
      .single();

    if (error || !data) {
      await supabase.storage
        .from("learning-ai-studio")
        .remove([filePath]);

      setErrorMessage("The source file record could not be saved.");
      setSaving(false);
      return;
    }

    await recordActivity({
      projectId: selectedProject.id,
      outputId: null,
      activityType: "Source Added",
      summary: `${sourceFile.name} added to the project.`,
      details: {
        source_category: sourceCategory,
        source_file_id: data.id,
      },
    });

    setSourceFile(null);
    setSourceCategory("Supporting Document");
    setMessage("Source file uploaded.");
    setSaving(false);

    await loadProjectWorkspace(selectedProject.id);
  }

  async function openSourceFile(file: AISourceFile) {
    const { data, error } = await supabase.storage
      .from("learning-ai-studio")
      .createSignedUrl(file.file_path, 60);

    if (error || !data?.signedUrl) {
      setErrorMessage("The source file could not be opened.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function archiveSourceFile(file: AISourceFile) {
    if (!selectedProject) return;

    const confirmed = window.confirm(
      `Archive "${file.original_file_name || file.file_name}"?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("learning_ai_source_files")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq("id", file.id);

    if (error) {
      setErrorMessage("The source file could not be archived.");
      return;
    }

    await recordActivity({
      projectId: selectedProject.id,
      outputId: null,
      activityType: "Project Updated",
      summary: `${file.original_file_name || file.file_name} archived.`,
      details: {
        source_file_id: file.id,
      },
    });

    await loadProjectWorkspace(selectedProject.id);
  }

  async function createReview() {
    if (!selectedProject) return;

    if (!reviewSummary.trim()) {
      setErrorMessage("Enter the professional review summary.");
      return;
    }

    const outputId = reviewOutputId
      ? Number(reviewOutputId)
      : null;

    const { data, error } = await supabase
      .from("learning_ai_reviews")
      .insert({
        project_id: selectedProject.id,
        output_id: outputId,
        review_type: reviewType,
        review_status: reviewStatus,
        summary: reviewSummary.trim(),
        recommendations: reviewRecommendations.trim() || null,
        risk_level:
          reviewStatus === "Not Applicable"
            ? null
            : reviewRiskLevel,
        reviewed_at:
          reviewStatus === "Pending" ||
          reviewStatus === "In Review"
            ? null
            : new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error || !data) {
      setErrorMessage("The professional review could not be saved.");
      return;
    }

    await recordActivity({
      projectId: selectedProject.id,
      outputId,
      activityType:
        reviewStatus === "Pending" ||
        reviewStatus === "In Review"
          ? "Review Requested"
          : "Review Completed",
      summary: `${reviewType} review recorded as ${reviewStatus}.`,
      details: {
        review_id: data.id,
        risk_level: data.risk_level,
      },
    });

    setReviewOutputId("");
    setReviewType("Full Professional Review");
    setReviewStatus("Pending");
    setReviewSummary("");
    setReviewRecommendations("");
    setReviewRiskLevel("Low");
    setMessage("Professional review saved.");

    await loadProjectWorkspace(selectedProject.id);
  }

  async function updateReviewStatus(
    review: AIReview,
    nextStatus: string
  ) {
    if (!selectedProject) return;

    const { error } = await supabase
      .from("learning_ai_reviews")
      .update({
        review_status: nextStatus,
        reviewed_at:
          nextStatus === "Pending" ||
          nextStatus === "In Review"
            ? null
            : new Date().toISOString(),
      })
      .eq("id", review.id);

    if (error) {
      setErrorMessage("The review status could not be updated.");
      return;
    }

    await recordActivity({
      projectId: selectedProject.id,
      outputId: review.output_id,
      activityType:
        nextStatus === "Pending" ||
        nextStatus === "In Review"
          ? "Review Requested"
          : "Review Completed",
      summary: `${review.review_type} review changed to ${nextStatus}.`,
      details: {
        review_id: review.id,
      },
    });

    await loadProjectWorkspace(selectedProject.id);
  }

  async function createIntelligenceFinding() {
    if (!findingTitle.trim() || !findingSummary.trim()) {
      setErrorMessage("Enter the finding title and summary.");
      return;
    }

    const { data, error } = await supabase
      .from("learning_ai_intelligence")
      .insert({
        project_id: selectedProject?.id || null,
        finding_type: findingType,
        title: findingTitle.trim(),
        summary: findingSummary.trim(),
        recommendation: findingRecommendation.trim() || null,
        priority: findingPriority,
        status: "Open",
        due_date: findingDueDate || null,
      })
      .select("*")
      .single();

    if (error || !data) {
      setErrorMessage("The learning-intelligence finding could not be saved.");
      return;
    }

    if (selectedProject) {
      await recordActivity({
        projectId: selectedProject.id,
        outputId: null,
        activityType: "Intelligence Finding Created",
        summary: `${data.title} recorded.`,
        details: {
          finding_type: data.finding_type,
          priority: data.priority,
        },
      });
    }

    setFindingType("Learning Gap");
    setFindingTitle("");
    setFindingSummary("");
    setFindingRecommendation("");
    setFindingPriority("Normal");
    setFindingDueDate("");
    setMessage("Learning-intelligence finding created.");

    await loadPageData();

    if (selectedProject) {
      await loadProjectWorkspace(selectedProject.id);
    }
  }

  async function updateFindingStatus(
    finding: IntelligenceFinding,
    nextStatus: string
  ) {
    const { error } = await supabase
      .from("learning_ai_intelligence")
      .update({
        status: nextStatus,
        resolved_at:
          nextStatus === "Resolved"
            ? new Date().toISOString()
            : null,
      })
      .eq("id", finding.id);

    if (error) {
      setErrorMessage("The finding status could not be updated.");
      return;
    }

    setMessage("Learning-intelligence status updated.");
    await loadPageData();
  }

  async function publishOutputToLearning(output: AIOutput) {
    if (!selectedProject) return;

    if (
      output.status !== "Approved" &&
      output.status !== "Published"
    ) {
      setErrorMessage(
        "Approve the output before publishing it to the Learning Library."
      );
      return;
    }

    const moduleTitle =
      publishLearningTitle.trim() || output.title;

    const { data: module, error } = await supabase
      .from("learning_modules")
      .insert({
        title: moduleTitle,
        description:
          selectedProject.description ||
          selectedProject.objective ||
          `Created from AI Studio project ${selectedProject.title}.`,
        learning_type: mapOutputToLearningType(output.output_type),
        delivery_method: "Digital",
        status: "Draft",
        assignment_eligible: true,
        certificate_available:
          output.output_type === "Certificate Template",
        assessment_required:
          output.output_type === "Assessment" ||
          output.output_type === "Question Set" ||
          output.output_type === "Knowledge Check",
        manager_validation_required: false,
        current_version_number: 1,
        source_type: "AI Studio",
      })
      .select("*")
      .single();

    if (error || !module) {
      console.error("Error publishing to Learning Library:", error);
      setErrorMessage(
        "The output could not be published to the Learning Library."
      );
      return;
    }

    await supabase.from("learning_module_sections").insert({
      learning_module_id: module.id,
      title: output.title,
      section_type: "Content",
      sequence_number: 1,
      content: output.content,
      completion_required: true,
      manager_validation_required: false,
      evidence_required: false,
      is_archived: false,
    });

    await supabase
      .from("learning_ai_outputs")
      .update({
        status: "Published",
        learning_module_id: module.id,
        published_reference_type: "Learning Module",
        published_reference_id: module.id,
        published_at: new Date().toISOString(),
      })
      .eq("id", output.id);

    await supabase
      .from("learning_ai_projects")
      .update({
        status: "Published",
      })
      .eq("id", selectedProject.id);

    await recordActivity({
      projectId: selectedProject.id,
      outputId: output.id,
      activityType: "Published to Learning",
      summary: `${output.title} published to the Learning Library.`,
      details: {
        learning_module_id: module.id,
      },
    });

    setPublishLearningTitle("");
    setMessage("Output published to the Learning Library.");

    await loadProjectWorkspace(selectedProject.id);
    await loadPageData();
  }

  async function publishOutputToPathway(output: AIOutput) {
    if (!selectedProject) return;

    if (
      output.status !== "Approved" &&
      output.status !== "Published"
    ) {
      setErrorMessage(
        "Approve the output before publishing it as a Development Pathway."
      );
      return;
    }

    const pathwayTitle =
      publishPathwayTitle.trim() || output.title;

    const { data: pathway, error } = await supabase
      .from("development_pathways")
      .insert({
        title: pathwayTitle,
        description:
          selectedProject.description ||
          selectedProject.objective ||
          output.content.slice(0, 500),
        status: "Draft",
        source_type: "AI Studio",
      })
      .select("*")
      .single();

    if (error || !pathway) {
      console.error("Error publishing pathway:", error);
      setErrorMessage(
        "The output could not be published as a Development Pathway."
      );
      return;
    }

    await supabase
      .from("learning_ai_outputs")
      .update({
        status: "Published",
        development_pathway_id: pathway.id,
        published_reference_type: "Development Pathway",
        published_reference_id: pathway.id,
        published_at: new Date().toISOString(),
      })
      .eq("id", output.id);

    await supabase
      .from("learning_ai_projects")
      .update({
        status: "Published",
      })
      .eq("id", selectedProject.id);

    await recordActivity({
      projectId: selectedProject.id,
      outputId: output.id,
      activityType: "Published to Pathway",
      summary: `${output.title} published as a Development Pathway.`,
      details: {
        development_pathway_id: pathway.id,
      },
    });

    setPublishPathwayTitle("");
    setMessage("Output published as a Development Pathway.");

    await loadProjectWorkspace(selectedProject.id);
    await loadPageData();
  }

  async function queueExternalExport(
    output: AIOutput,
    connection: OrganisationConnection,
    capability: ProviderCapability
  ) {
    if (!selectedProject) return;

    if (
      connection.status !== "Connected" ||
      connection.health_status !== "Healthy"
    ) {
      setErrorMessage(
        "This provider must be connected and healthy before an export can run."
      );
      return;
    }

    const provider = providers.find(
      (item) => item.id === connection.provider_id
    );

    const { data: job, error: jobError } = await supabase
      .from("connection_jobs")
      .insert({
        connection_id: connection.id,
        module_key: "AI Studio",
        action_key: capability.capability_key,
        direction:
          capability.direction === "Read" ? "Import" : "Export",
        source_reference_type: "AI Studio Output",
        source_reference_id: output.id,
        title: `${capability.name}: ${output.title}`,
        status: "Queued",
        progress_percent: 0,
        request_payload: {
          project_id: selectedProject.id,
          output_id: output.id,
          output_type: output.output_type,
          output_title: output.title,
          output_content: output.content,
        },
      })
      .select("*")
      .single();

    if (jobError || !job) {
      setErrorMessage("The provider export job could not be created.");
      return;
    }

    const { error: exportError } = await supabase
      .from("learning_ai_external_exports")
      .insert({
        project_id: selectedProject.id,
        output_id: output.id,
        connection_id: connection.id,
        connection_job_id: job.id,
        export_type: capability.name,
        status: "Queued",
      });

    if (exportError) {
      await supabase
        .from("connection_jobs")
        .update({
          status: "Failed",
          error_message:
            "The AI Studio export record could not be created.",
        })
        .eq("id", job.id);

      setErrorMessage("The AI Studio export could not be queued.");
      return;
    }

    await recordActivity({
      projectId: selectedProject.id,
      outputId: output.id,
      activityType: "Project Updated",
      summary: `${output.title} queued for ${capability.name} through ${provider?.name || "the connected provider"}.`,
      details: {
        connection_id: connection.id,
        connection_job_id: job.id,
        capability_key: capability.capability_key,
      },
    });

    setMessage(
      `${capability.name} has been queued through ${provider?.name || "the connected provider"}.`
    );

    await loadProjectWorkspace(selectedProject.id);
  }

  async function recordActivity({
    projectId,
    outputId,
    activityType,
    summary,
    details,
  }: {
    projectId: number | null;
    outputId: number | null;
    activityType: string;
    summary: string;
    details: Record<string, unknown> | null;
  }) {
    const { error } = await supabase
      .from("learning_ai_activity_history")
      .insert({
        project_id: projectId,
        output_id: outputId,
        activity_type: activityType,
        activity_summary: summary,
        activity_details: details || {},
      });

    if (error) {
      console.error("Error recording AI Studio activity:", error);
    }
  }

  const providerMap = useMemo(
    () =>
      new Map(
        providers.map((provider) => [provider.id, provider])
      ),
    [providers]
  );

  const connectionMap = useMemo(
    () =>
      new Map(
        connections.map((connection) => [
          connection.id,
          connection,
        ])
      ),
    [connections]
  );

  const connectedAIStudioProviders = useMemo(() => {
    const enabledConnectionIds = new Set(
      connectionModules
        .filter(
          (module) =>
            module.module_key === "AI Studio" &&
            module.is_enabled
        )
        .map((module) => module.connection_id)
    );

    return connections.filter(
      (connection) =>
        enabledConnectionIds.has(connection.id) &&
        connection.status === "Connected"
    );
  }, [connections, connectionModules]);

  const availableExportCapabilities = useMemo(() => {
    return connectedAIStudioProviders.flatMap((connection) => {
      const provider = providerMap.get(connection.provider_id);

      const enabledCapabilityIds = new Set(
        connectionCapabilities
          .filter(
            (item) =>
              item.connection_id === connection.id &&
              item.is_enabled &&
              item.approval_status === "Approved"
          )
          .map((item) => item.provider_capability_id)
      );

      return providerCapabilities
        .filter(
          (capability) =>
            capability.provider_id === connection.provider_id &&
            enabledCapabilityIds.has(capability.id) &&
            ["Write", "Both", "Action"].includes(
              capability.direction
            )
        )
        .map((capability) => ({
          connection,
          provider,
          capability,
        }));
    });
  }, [
    connectedAIStudioProviders,
    connectionCapabilities,
    providerCapabilities,
    providerMap,
  ]);

  const filteredProjects = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !search ||
        project.title.toLowerCase().includes(search) ||
        project.project_type.toLowerCase().includes(search) ||
        (project.description || "")
          .toLowerCase()
          .includes(search) ||
        (project.subject_area || "")
          .toLowerCase()
          .includes(search);

      const matchesType =
        projectTypeFilter === "All" ||
        project.project_type === projectTypeFilter;

      const matchesStatus =
        projectStatusFilter === "All" ||
        project.status === projectStatusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [
    projects,
    searchTerm,
    projectTypeFilter,
    projectStatusFilter,
  ]);

  const projectIntelligence = selectedProject
    ? intelligence.filter(
        (finding) =>
          finding.project_id === selectedProject.id
      )
    : [];

  const draftCount = projects.filter(
    (project) =>
      project.status === "Draft" ||
      project.status === "In Progress"
  ).length;

  const awaitingReviewCount = projects.filter(
    (project) => project.status === "Awaiting Review"
  ).length;

  const publishedCount = projects.filter(
    (project) => project.status === "Published"
  ).length;

  const openFindingCount = intelligence.filter(
    (finding) =>
      finding.status !== "Resolved" &&
      finding.status !== "Dismissed"
  ).length;

  const pendingReviewCount = reviews.filter(
    (review) =>
      review.review_status === "Pending" ||
      review.review_status === "In Review"
  ).length;

  const selectedOutputReviews = selectedOutput
    ? reviews.filter(
        (review) => review.output_id === selectedOutput.id
      )
    : [];

  const selectedOutputExports = selectedOutput
    ? externalExports.filter(
        (item) => item.output_id === selectedOutput.id
      )
    : [];
      if (selectedProject) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setSelectedProject(null);
            setSelectedOutput(null);
            setActiveTab("Overview");
            setMessage("");
            setErrorMessage("");
          }}
          style={backButtonStyle}
        >
          ← Back to AI Studio
        </button>

        <div style={projectHeaderStyle}>
          <div>
            <div style={badgeRowStyle}>
              <span style={primaryBadgeStyle}>
                {selectedProject.status}
              </span>

              <span style={secondaryBadgeStyle}>
                {selectedProject.project_type}
              </span>

              <span style={secondaryBadgeStyle}>
                Version {selectedProject.current_version_number}
              </span>

              {selectedProject.legal_review_required && (
                <span style={secondaryBadgeStyle}>
                  Legal Review
                </span>
              )}

              {selectedProject.equality_review_required && (
                <span style={secondaryBadgeStyle}>
                  Equality Review
                </span>
              )}

              {selectedProject.accessibility_review_required && (
                <span style={secondaryBadgeStyle}>
                  Accessibility Review
                </span>
              )}
            </div>

            <h2 style={projectTitleStyle}>
              {selectedProject.title}
            </h2>

            <p style={projectDescriptionStyle}>
              {selectedProject.description ||
                selectedProject.objective ||
                "No project description has been added."}
            </p>
          </div>

          <div style={projectVersionStyle}>
            {outputs.length} saved output
            {outputs.length === 1 ? "" : "s"}
          </div>
        </div>

        <div style={tabNavigationStyle}>
          {(
            [
              "Overview",
              "Conversation",
              "Sources",
              "Generated Content",
              "Professional Review",
              "Version History",
              "Publish & Export",
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
            Loading AI Studio project...
          </div>
        ) : (
          <>
            {activeTab === "Overview" && (
              <div>
                <SectionHeading
                  title="Project Overview"
                  description="Maintain the project brief, audience, source information, review requirements and working instructions."
                />

                <div style={detailGridStyle}>
                  <DetailCard
                    label="Project Type"
                    value={selectedProject.project_type}
                  />

                  <DetailCard
                    label="Output Format"
                    value={
                      selectedProject.output_format ||
                      "Not recorded"
                    }
                  />

                  <DetailCard
                    label="Audience"
                    value={
                      selectedProject.intended_audience ||
                      "Not recorded"
                    }
                  />

                  <DetailCard
                    label="Last Updated"
                    value={new Date(
                      selectedProject.updated_at
                    ).toLocaleString("en-GB")}
                  />
                </div>

                <div style={formGridStyle}>
                  <FormField label="Project title">
                    <input
                      value={overviewTitle}
                      onChange={(event) =>
                        setOverviewTitle(event.target.value)
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Status">
                    <select
                      value={overviewStatus}
                      onChange={(event) =>
                        setOverviewStatus(event.target.value)
                      }
                      style={inputStyle}
                    >
                      {projectStatuses.map((status) => (
                        <option key={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <FormField label="Description">
                  <textarea
                    value={overviewDescription}
                    onChange={(event) =>
                      setOverviewDescription(
                        event.target.value
                      )
                    }
                    style={textareaStyle}
                  />
                </FormField>

                <FormField label="Objective">
                  <textarea
                    value={overviewObjective}
                    onChange={(event) =>
                      setOverviewObjective(event.target.value)
                    }
                    style={textareaStyle}
                  />
                </FormField>

                <div style={formGridStyle}>
                  <FormField label="Intended audience">
                    <input
                      value={overviewAudience}
                      onChange={(event) =>
                        setOverviewAudience(event.target.value)
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Target role">
                    <input
                      value={overviewRole}
                      onChange={(event) =>
                        setOverviewRole(event.target.value)
                      }
                      style={inputStyle}
                    />
                  </FormField>
                </div>

                <div style={formGridStyle}>
                  <FormField label="Target department">
                    <input
                      value={overviewDepartment}
                      onChange={(event) =>
                        setOverviewDepartment(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Target location">
                    <input
                      value={overviewLocation}
                      onChange={(event) =>
                        setOverviewLocation(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>
                </div>

                <div style={formGridStyle}>
                  <FormField label="Subject area">
                    <input
                      value={overviewSubjectArea}
                      onChange={(event) =>
                        setOverviewSubjectArea(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Output format">
                    <select
                      value={overviewOutputFormat}
                      onChange={(event) =>
                        setOverviewOutputFormat(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    >
                      <option value="">
                        Select output
                      </option>

                      {outputTypes.map((type) => (
                        <option key={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <div style={formGridStyle}>
                  <FormField label="Tone">
                    <select
                      value={overviewTone}
                      onChange={(event) =>
                        setOverviewTone(event.target.value)
                      }
                      style={inputStyle}
                    >
                      <option value="">
                        Select tone
                      </option>

                      {tones.map((tone) => (
                        <option key={tone}>
                          {tone}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Reading level">
                    <select
                      value={overviewReadingLevel}
                      onChange={(event) =>
                        setOverviewReadingLevel(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    >
                      <option value="">
                        Select level
                      </option>

                      {readingLevels.map((level) => (
                        <option key={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <div style={formGridStyle}>
                  <FormField label="Language">
                    <input
                      value={overviewLanguageCode}
                      onChange={(event) =>
                        setOverviewLanguageCode(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Estimated duration minutes">
                    <input
                      type="number"
                      min="0"
                      value={overviewDuration}
                      onChange={(event) =>
                        setOverviewDuration(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>
                </div>

                <FormField label="Source text">
                  <textarea
                    value={overviewSourceText}
                    onChange={(event) =>
                      setOverviewSourceText(
                        event.target.value
                      )
                    }
                    style={largeTextareaStyle}
                  />
                </FormField>

                <FormField label="Instructions for Leo">
                  <textarea
                    value={overviewInstructions}
                    onChange={(event) =>
                      setOverviewInstructions(
                        event.target.value
                      )
                    }
                    style={textareaStyle}
                  />
                </FormField>

                <FormField label="Constraints">
                  <textarea
                    value={overviewConstraints}
                    onChange={(event) =>
                      setOverviewConstraints(
                        event.target.value
                      )
                    }
                    style={textareaStyle}
                  />
                </FormField>

                <div style={optionGridStyle}>
                  <CheckboxField
                    label="Employment law review"
                    description="Review the output for employment-law risk and legal accuracy."
                    checked={overviewLegalReview}
                    onChange={setOverviewLegalReview}
                  />

                  <CheckboxField
                    label="Equality review"
                    description="Review the output for equality, fairness and bias."
                    checked={overviewEqualityReview}
                    onChange={setOverviewEqualityReview}
                  />

                  <CheckboxField
                    label="Accessibility review"
                    description="Review readability, accessibility and inclusive design."
                    checked={overviewAccessibilityReview}
                    onChange={setOverviewAccessibilityReview}
                  />

                  <CheckboxField
                    label="Manager review"
                    description="Require a manager or administrator review before publishing."
                    checked={overviewManagerReview}
                    onChange={setOverviewManagerReview}
                  />
                </div>

                <div style={splitActionsStyle}>
                  <button
                    type="button"
                    onClick={() =>
                      void archiveProject()
                    }
                    style={archiveButtonStyle}
                  >
                    Archive Project
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void saveProjectOverview()
                    }
                    disabled={saving}
                    style={primaryButtonStyle}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Project"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "Conversation" && (
              <div>
                <SectionHeading
                  title="Conversation"
                  description="Develop the project with Leo while preserving every instruction and decision."
                />

                <div style={conversationPanelStyle}>
                  {messages.length === 0 ? (
                    <div style={emptyCompactStyle}>
                      No project conversation has been recorded.
                    </div>
                  ) : (
                    <div style={conversationListStyle}>
                      {messages.map((chatMessage) => (
                        <div
                          key={chatMessage.id}
                          style={
                            chatMessage.role === "assistant"
                              ? assistantMessageStyle
                              : chatMessage.role === "system"
                                ? systemMessageStyle
                                : userMessageStyle
                          }
                        >
                          <div style={messageHeaderStyle}>
                            <strong>
                              {chatMessage.role === "assistant"
                                ? "Leo"
                                : chatMessage.role === "system"
                                  ? "Project Brief"
                                  : "You"}
                            </strong>

                            <span style={mutedStyle}>
                              {new Date(
                                chatMessage.created_at
                              ).toLocaleString("en-GB")}
                            </span>
                          </div>

                          <div style={conversationTextStyle}>
                            {chatMessage.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={conversationComposerStyle}>
                    <textarea
                      value={conversationInput}
                      onChange={(event) =>
                        setConversationInput(
                          event.target.value
                        )
                      }
                      placeholder="Add an instruction, clarification or decision..."
                      style={conversationTextareaStyle}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        void sendConversationMessage()
                      }
                      disabled={saving}
                      style={primaryButtonStyle}
                    >
                      {saving
                        ? "Saving..."
                        : "Add to Project"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Sources" && (
              <div>
                <SectionHeading
                  title="Source Documents"
                  description="Upload policies, procedures, transcripts, assessments and reference material for the project."
                />

                <div style={formPanelStyle}>
                  <div style={formGridStyle}>
                    <FormField label="Source category">
                      <select
                        value={sourceCategory}
                        onChange={(event) =>
                          setSourceCategory(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      >
                        {sourceCategories.map((category) => (
                          <option key={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Source file">
                      <input
                        type="file"
                        onChange={(event) =>
                          setSourceFile(
                            event.target.files?.[0] ||
                              null
                          )
                        }
                      />
                    </FormField>
                  </div>

                  <div style={formActionsStyle}>
                    <button
                      type="button"
                      onClick={() =>
                        void uploadSourceFile()
                      }
                      disabled={saving}
                      style={primaryButtonStyle}
                    >
                      {saving
                        ? "Uploading..."
                        : "Upload Source"}
                    </button>
                  </div>
                </div>

                {sourceFiles.length === 0 ? (
                  <div style={emptyStateStyle}>
                    No source documents have been added.
                  </div>
                ) : (
                  <div style={listStyle}>
                    {sourceFiles.map((file) => (
                      <div
                        key={file.id}
                        style={standardCardStyle}
                      >
                        <div style={cardHeaderStyle}>
                          <div>
                            <div style={eyebrowStyle}>
                              {file.source_category}
                            </div>

                            <h4 style={cardTitleStyle}>
                              {file.original_file_name ||
                                file.file_name}
                            </h4>
                          </div>

                          <span style={secondaryBadgeStyle}>
                            {file.extraction_status}
                          </span>
                        </div>

                        <div
                          style={
                            assignmentDetailGridStyle
                          }
                        >
                          <DetailItem
                            label="Type"
                            value={
                              file.mime_type ||
                              "Not recorded"
                            }
                          />

                          <DetailItem
                            label="Size"
                            value={
                              file.file_size_bytes !== null
                                ? formatFileSize(
                                    file.file_size_bytes
                                  )
                                : "Not recorded"
                            }
                          />

                          <DetailItem
                            label="Uploaded"
                            value={new Date(
                              file.uploaded_at
                            ).toLocaleString("en-GB")}
                          />
                        </div>

                        <div style={cardActionsStyle}>
                          <button
                            type="button"
                            onClick={() =>
                              void openSourceFile(file)
                            }
                            style={secondaryButtonStyle}
                          >
                            Open Source
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void archiveSourceFile(file)
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

            {activeTab === "Generated Content" && (
              <div>
                <SectionHeading
                  title="Generated Content"
                  description="Create, edit, review and preserve every version of the project output."
                />

                <div style={generationWorkspaceStyle}>
                  <div style={generationFormStyle}>
                    <h3 style={subsectionTitleStyle}>
                      Create New Output
                    </h3>

                    <div style={formGridStyle}>
                      <FormField label="Output type">
                        <select
                          value={generationOutputType}
                          onChange={(event) =>
                            setGenerationOutputType(
                              event.target.value
                            )
                          }
                          style={inputStyle}
                        >
                          {outputTypes.map((type) => (
                            <option key={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField label="Output title">
                        <input
                          value={generationTitle}
                          onChange={(event) =>
                            setGenerationTitle(
                              event.target.value
                            )
                          }
                          placeholder="Optional for AI generation"
                          style={inputStyle}
                        />
                      </FormField>
                    </div>

                    <FormField label="Instruction or draft content">
                      <textarea
                        value={generationInstruction}
                        onChange={(event) =>
                          setGenerationInstruction(
                            event.target.value
                          )
                        }
                        placeholder="Tell Leo what to create, or paste content to save as a manual draft."
                        style={largeTextareaStyle}
                      />
                    </FormField>

                    <div style={generationActionsStyle}>
                      <button
                        type="button"
                        onClick={() =>
                          void createManualOutput()
                        }
                        disabled={generating}
                        style={secondaryButtonStyle}
                      >
                        Save Manual Draft
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void generateOutput()
                        }
                        disabled={generating}
                        style={primaryButtonStyle}
                      >
                        {generating
                          ? "Leo is creating..."
                          : "Create with Leo"}
                      </button>
                    </div>

                    <div style={noticeStyle}>
                      Live AI generation uses the secure route:
                      <code style={inlineCodeStyle}>
                        {" "}
                        /api/leo-learn/ai-studio
                      </code>
                      . Manual drafts remain available even before
                      that server route is activated.
                    </div>
                  </div>

                  <div>
                    <h3 style={subsectionTitleStyle}>
                      Saved Outputs
                    </h3>

                    {outputs.length === 0 ? (
                      <div style={emptyCompactStyle}>
                        No outputs have been created.
                      </div>
                    ) : (
                      <div style={outputListStyle}>
                        {outputs.map((output) => (
                          <button
                            key={output.id}
                            type="button"
                            onClick={() =>
                              setSelectedOutput(output)
                            }
                            style={
                              selectedOutput?.id === output.id
                                ? activeOutputCardStyle
                                : outputCardStyle
                            }
                          >
                            <div style={cardHeaderStyle}>
                              <div>
                                <div style={eyebrowStyle}>
                                  {output.output_type}
                                </div>

                                <h4 style={cardTitleStyle}>
                                  {output.title}
                                </h4>
                              </div>

                              <span style={primaryBadgeStyle}>
                                v{output.version_number}
                              </span>
                            </div>

                            <div style={outputMetaStyle}>
                              {output.status} ·{" "}
                              {new Date(
                                output.updated_at
                              ).toLocaleString("en-GB")}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedOutput && (
                  <div style={outputEditorStyle}>
                    <div style={sectionHeaderStyle}>
                      <div>
                        <h3 style={subsectionTitleStyle}>
                          Edit Output
                        </h3>

                        <p style={subsectionDescriptionStyle}>
                          {selectedOutput.output_type} · Version{" "}
                          {selectedOutput.version_number}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void archiveOutput(selectedOutput)
                        }
                        style={archiveButtonStyle}
                      >
                        Archive Version
                      </button>
                    </div>

                    <div style={formGridStyle}>
                      <FormField label="Title">
                        <input
                          value={outputTitle}
                          onChange={(event) =>
                            setOutputTitle(
                              event.target.value
                            )
                          }
                          style={inputStyle}
                        />
                      </FormField>

                      <FormField label="Status">
                        <select
                          value={outputStatus}
                          onChange={(event) =>
                            setOutputStatus(
                              event.target.value
                            )
                          }
                          style={inputStyle}
                        >
                          {outputStatuses.map((status) => (
                            <option key={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </FormField>
                    </div>

                    <FormField label="Content">
                      <textarea
                        value={outputContent}
                        onChange={(event) =>
                          setOutputContent(
                            event.target.value
                          )
                        }
                        style={outputTextareaStyle}
                      />
                    </FormField>

                    <div style={formActionsStyle}>
                      <button
                        type="button"
                        onClick={() =>
                          void createNewOutputVersion()
                        }
                        style={secondaryButtonStyle}
                      >
                        Save as New Version
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void saveOutput()
                        }
                        disabled={saving}
                        style={primaryButtonStyle}
                      >
                        {saving
                          ? "Saving..."
                          : "Save Output"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Professional Review" && (
              <div>
                <SectionHeading
                  title="Professional Review"
                  description="Review generated content for accuracy, law, equality, accessibility, tone, professionalism and practical quality."
                />

                <div style={formPanelStyle}>
                  <div style={formGridStyle}>
                    <FormField label="Output">
                      <select
                        value={reviewOutputId}
                        onChange={(event) =>
                          setReviewOutputId(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      >
                        <option value="">
                          Whole project
                        </option>

                        {outputs.map((output) => (
                          <option
                            key={output.id}
                            value={output.id}
                          >
                            {output.title} · v
                            {output.version_number}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Review type">
                      <select
                        value={reviewType}
                        onChange={(event) =>
                          setReviewType(event.target.value)
                        }
                        style={inputStyle}
                      >
                        {reviewTypes.map((type) => (
                          <option key={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <div style={formGridStyle}>
                    <FormField label="Review status">
                      <select
                        value={reviewStatus}
                        onChange={(event) =>
                          setReviewStatus(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      >
                        {reviewStatuses.map((status) => (
                          <option key={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Risk level">
                      <select
                        value={reviewRiskLevel}
                        onChange={(event) =>
                          setReviewRiskLevel(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      >
                        {riskLevels.map((level) => (
                          <option key={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <FormField label="Review summary">
                    <textarea
                      value={reviewSummary}
                      onChange={(event) =>
                        setReviewSummary(
                          event.target.value
                        )
                      }
                      style={textareaStyle}
                    />
                  </FormField>

                  <FormField label="Recommendations">
                    <textarea
                      value={reviewRecommendations}
                      onChange={(event) =>
                        setReviewRecommendations(
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
                        void createReview()
                      }
                      style={primaryButtonStyle}
                    >
                      Save Professional Review
                    </button>
                  </div>
                </div>

                {reviews.length === 0 ? (
                  <div style={emptyStateStyle}>
                    No professional reviews have been recorded.
                  </div>
                ) : (
                  <div style={listStyle}>
                    {reviews.map((review) => {
                      const linkedOutput = outputs.find(
                        (output) =>
                          output.id === review.output_id
                      );

                      return (
                        <div
                          key={review.id}
                          style={standardCardStyle}
                        >
                          <div style={cardHeaderStyle}>
                            <div>
                              <div style={eyebrowStyle}>
                                {review.review_type}
                              </div>

                              <h4 style={cardTitleStyle}>
                                {linkedOutput?.title ||
                                  "Whole Project Review"}
                              </h4>
                            </div>

                            <select
                              value={review.review_status}
                              onChange={(event) =>
                                void updateReviewStatus(
                                  review,
                                  event.target.value
                                )
                              }
                              style={statusSelectStyle}
                            >
                              {reviewStatuses.map((status) => (
                                <option key={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div style={badgeRowStyle}>
                            {review.risk_level && (
                              <span style={secondaryBadgeStyle}>
                                {review.risk_level} Risk
                              </span>
                            )}

                            <span style={secondaryBadgeStyle}>
                              {new Date(
                                review.created_at
                              ).toLocaleDateString("en-GB")}
                            </span>
                          </div>

                          {review.summary && (
                            <p style={cardDescriptionStyle}>
                              {review.summary}
                            </p>
                          )}

                          {review.recommendations && (
                            <div style={noticeStyle}>
                              <strong>Recommendations:</strong>{" "}
                              {review.recommendations}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {projectIntelligence.length > 0 && (
                  <div style={projectIntelligenceStyle}>
                    <h3 style={subsectionTitleStyle}>
                      Related Learning Intelligence
                    </h3>

                    <div style={listStyle}>
                      {projectIntelligence.map((finding) => (
                        <div
                          key={finding.id}
                          style={standardCardStyle}
                        >
                          <div style={cardHeaderStyle}>
                            <div>
                              <div style={eyebrowStyle}>
                                {finding.finding_type}
                              </div>

                              <h4 style={cardTitleStyle}>
                                {finding.title}
                              </h4>
                            </div>

                            <span style={primaryBadgeStyle}>
                              {finding.priority}
                            </span>
                          </div>

                          <p style={cardDescriptionStyle}>
                            {finding.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Version History" && (
              <div>
                <SectionHeading
                  title="Version History"
                  description="Review every saved output version and preserve the development history."
                />

                {outputs.length === 0 ? (
                  <div style={emptyStateStyle}>
                    No output versions have been created.
                  </div>
                ) : (
                  <div style={versionTableWrapStyle}>
                    <table style={versionTableStyle}>
                      <thead>
                        <tr>
                          <th style={versionHeaderStyle}>
                            Output
                          </th>
                          <th style={versionHeaderStyle}>
                            Type
                          </th>
                          <th style={versionHeaderStyle}>
                            Version
                          </th>
                          <th style={versionHeaderStyle}>
                            Status
                          </th>
                          <th style={versionHeaderStyle}>
                            Reviews
                          </th>
                          <th style={versionHeaderStyle}>
                            Updated
                          </th>
                          <th style={versionHeaderStyle}>
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {outputs.map((output) => {
                          const outputReviews = reviews.filter(
                            (review) =>
                              review.output_id === output.id
                          );

                          return (
                            <tr key={output.id}>
                              <td style={versionCellStyle}>
                                <strong>{output.title}</strong>
                              </td>

                              <td style={versionCellStyle}>
                                {output.output_type}
                              </td>

                              <td style={versionCellStyle}>
                                v{output.version_number}
                              </td>

                              <td style={versionCellStyle}>
                                {output.status}
                              </td>

                              <td style={versionCellStyle}>
                                {outputReviews.length}
                              </td>

                              <td style={versionCellStyle}>
                                {new Date(
                                  output.updated_at
                                ).toLocaleString("en-GB")}
                              </td>

                              <td style={versionCellStyle}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOutput(output);
                                    setActiveTab(
                                      "Generated Content"
                                    );
                                  }}
                                  style={smallButtonStyle}
                                >
                                  Open
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Publish & Export" && (
              <div>
                <SectionHeading
                  title="Publish & Export"
                  description="Publish approved content into Leo or send it through organisation-approved external connections."
                />

                {outputs.length === 0 ? (
                  <div style={emptyStateStyle}>
                    Create an output before publishing or exporting.
                  </div>
                ) : (
                  <div style={publishWorkspaceStyle}>
                    {outputs.map((output) => {
                      const outputReviews = reviews.filter(
                        (review) =>
                          review.output_id === output.id
                      );

                      const blockingReviews =
                        outputReviews.filter(
                          (review) =>
                            review.review_status ===
                              "Changes Required" ||
                            review.review_status === "Pending" ||
                            review.review_status === "In Review"
                        );

                      return (
                        <div
                          key={output.id}
                          style={publishCardStyle}
                        >
                          <div style={cardHeaderStyle}>
                            <div>
                              <div style={eyebrowStyle}>
                                {output.output_type} · Version{" "}
                                {output.version_number}
                              </div>

                              <h3 style={publishTitleStyle}>
                                {output.title}
                              </h3>
                            </div>

                            <span style={primaryBadgeStyle}>
                              {output.status}
                            </span>
                          </div>

                          {blockingReviews.length > 0 && (
                            <div style={noticeStyle}>
                              {blockingReviews.length} review
                              {blockingReviews.length === 1
                                ? ""
                                : "s"}{" "}
                              still require attention before final
                              publication.
                            </div>
                          )}

                          <div style={publishSectionStyle}>
                            <h4 style={publishSectionTitleStyle}>
                              Publish inside Leo
                            </h4>

                            <div style={formGridStyle}>
                              <FormField label="Learning Library title">
                                <input
                                  value={publishLearningTitle}
                                  onChange={(event) =>
                                    setPublishLearningTitle(
                                      event.target.value
                                    )
                                  }
                                  placeholder={output.title}
                                  style={inputStyle}
                                />
                              </FormField>

                              <FormField label="Development Pathway title">
                                <input
                                  value={publishPathwayTitle}
                                  onChange={(event) =>
                                    setPublishPathwayTitle(
                                      event.target.value
                                    )
                                  }
                                  placeholder={output.title}
                                  style={inputStyle}
                                />
                              </FormField>
                            </div>

                            <div style={cardActionsStyle}>
                              <button
                                type="button"
                                onClick={() =>
                                  void publishOutputToLearning(
                                    output
                                  )
                                }
                                style={secondaryButtonStyle}
                              >
                                Publish to Learning Library
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void publishOutputToPathway(
                                    output
                                  )
                                }
                                style={secondaryButtonStyle}
                              >
                                Publish as Development Pathway
                              </button>
                            </div>
                          </div>

                          <div style={publishSectionStyle}>
                            <h4 style={publishSectionTitleStyle}>
                              Connected Providers
                            </h4>

                            {availableExportCapabilities.length ===
                            0 ? (
                              <div style={connectionPromptStyle}>
                                <div>
                                  <strong>
                                    No approved export connection is
                                    currently available.
                                  </strong>

                                  <p style={connectionPromptTextStyle}>
                                    Connect and approve Canva,
                                    ElevenLabs, Microsoft, Google or
                                    another provider in Foundations.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(
                                      "/dashboard/foundations/connections"
                                    )
                                  }
                                  style={secondaryButtonStyle}
                                >
                                  Open Connections
                                </button>
                              </div>
                            ) : (
                              <div style={providerExportGridStyle}>
                                {availableExportCapabilities.map(
                                  ({
                                    connection,
                                    provider,
                                    capability,
                                  }) => (
                                    <button
                                      key={`${connection.id}-${capability.id}`}
                                      type="button"
                                      onClick={() =>
                                        void queueExternalExport(
                                          output,
                                          connection,
                                          capability
                                        )
                                      }
                                      style={providerExportButtonStyle}
                                    >
                                      <span
                                        style={
                                          providerExportTitleStyle
                                        }
                                      >
                                        {capability.name}
                                      </span>

                                      <span
                                        style={
                                          providerExportDetailStyle
                                        }
                                      >
                                        {provider?.name ||
                                          "Connected provider"}
                                        {connection.account_display_name
                                          ? ` · ${connection.account_display_name}`
                                          : ""}
                                      </span>
                                    </button>
                                  )
                                )}
                              </div>
                            )}
                          </div>

                          {externalExports.filter(
                            (item) => item.output_id === output.id
                          ).length > 0 && (
                            <div style={publishSectionStyle}>
                              <h4 style={publishSectionTitleStyle}>
                                Export History
                              </h4>

                              <div style={listStyle}>
                                {externalExports
                                  .filter(
                                    (item) =>
                                      item.output_id === output.id
                                  )
                                  .map((exportRecord) => {
                                    const connection =
                                      connectionMap.get(
                                        exportRecord.connection_id
                                      );

                                    const provider = connection
                                      ? providerMap.get(
                                          connection.provider_id
                                        )
                                      : null;

                                    const job = connectionJobs.find(
                                      (item) =>
                                        item.id ===
                                        exportRecord.connection_job_id
                                    );

                                    return (
                                      <div
                                        key={exportRecord.id}
                                        style={exportHistoryStyle}
                                      >
                                        <div>
                                          <strong>
                                            {exportRecord.export_type}
                                          </strong>

                                          <div style={mutedStyle}>
                                            {provider?.name ||
                                              "Provider"}{" "}
                                            ·{" "}
                                            {new Date(
                                              exportRecord.requested_at
                                            ).toLocaleString(
                                              "en-GB"
                                            )}
                                          </div>
                                        </div>

                                        <div
                                          style={
                                            exportStatusWrapStyle
                                          }
                                        >
                                          <span
                                            style={
                                              secondaryBadgeStyle
                                            }
                                          >
                                            {job?.status ||
                                              exportRecord.status}
                                          </span>

                                          {(exportRecord.external_url ||
                                            job?.result_url) && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                window.open(
                                                  exportRecord.external_url ||
                                                    job?.result_url ||
                                                    "",
                                                  "_blank",
                                                  "noopener,noreferrer"
                                                )
                                              }
                                              style={smallButtonStyle}
                                            >
                                              Open
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Activity" && (
              <div>
                <SectionHeading
                  title="Activity"
                  description="A permanent chronology of project creation, instructions, generation, review, publication and export activity."
                />

                {activity.length === 0 ? (
                  <div style={emptyStateStyle}>
                    No AI Studio activity has been recorded.
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
                                {record.activity_type}
                              </div>

                              <div
                                style={
                                  timelineSummaryStyle
                                }
                              >
                                {record.activity_summary}
                              </div>
                            </div>

                            <div style={mutedStyle}>
                              {new Date(
                                record.created_at
                              ).toLocaleString("en-GB")}
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
          <div style={eyebrowStyle}>LEO AI STUDIO</div>

          <h2 style={pageTitleStyle}>
            AI Studio
          </h2>

          <p style={pageDescriptionStyle}>
            Create, improve, review and publish professional
            workplace learning with Leo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetCreateForm();
            setShowCreateForm(true);
            setMainView("Create");
            setMessage("");
            setErrorMessage("");
          }}
          style={primaryButtonStyle}
        >
          New AI Project
        </button>
      </div>

      <div style={mainNavigationStyle}>
        {(
          [
            "Dashboard",
            "Projects",
            "Create",
            "Professional Review",
            "Learning Intelligence",
          ] as MainView[]
        ).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => {
              setMainView(view);

              if (view === "Create") {
                setShowCreateForm(true);
              }
            }}
            style={
              mainView === view
                ? activeMainNavigationButtonStyle
                : mainNavigationButtonStyle
            }
          >
            {view}
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

      {loading ? (
        <div style={emptyStateStyle}>
          Loading AI Studio...
        </div>
      ) : (
        <>
          {mainView === "Dashboard" && (
            <div>
              <div style={summaryGridStyle}>
                <SummaryCard
                  label="Total Projects"
                  value={String(projects.length)}
                />

                <SummaryCard
                  label="Drafts & In Progress"
                  value={String(draftCount)}
                />

                <SummaryCard
                  label="Awaiting Review"
                  value={String(awaitingReviewCount)}
                />

                <SummaryCard
                  label="Published"
                  value={String(publishedCount)}
                />

                <SummaryCard
                  label="Open Intelligence Findings"
                  value={String(openFindingCount)}
                />

                <SummaryCard
                  label="Connected Export Providers"
                  value={String(
                    connectedAIStudioProviders.length
                  )}
                />
              </div>

              <div style={dashboardGridStyle}>
                <div style={panelStyle}>
                  <div style={panelHeaderStyle}>
                    <div>
                      <h3 style={panelTitleStyle}>
                        Start with Leo
                      </h3>

                      <p style={panelDescriptionStyle}>
                        Choose a professional learning-design
                        workflow.
                      </p>
                    </div>
                  </div>

                  <div style={quickActionGridStyle}>
                    {[
                      "Create Learning",
                      "Policy to Learning",
                      "Create Assessment",
                      "Create Manager Guide",
                      "Create Development Pathway",
                      "Induction Programme",
                      "Professional Review",
                      "Learning Intelligence",
                    ].map((projectType) => (
                      <button
                        key={projectType}
                        type="button"
                        onClick={() => {
                          resetCreateForm();
                          setCreateProjectType(projectType);

                          const matchingTemplate =
                            templates.find(
                              (template) =>
                                template.template_type ===
                                projectType
                            );

                          if (matchingTemplate) {
                            applyTemplate(
                              String(matchingTemplate.id)
                            );
                          }

                          setShowCreateForm(true);
                          setMainView("Create");
                        }}
                        style={quickActionStyle}
                      >
                        {projectType}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={panelStyle}>
                  <div style={panelHeaderStyle}>
                    <div>
                      <h3 style={panelTitleStyle}>
                        Connected Tools
                      </h3>

                      <p style={panelDescriptionStyle}>
                        Provider access is controlled through
                        Foundations.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          "/dashboard/foundations/connections"
                        )
                      }
                      style={smallButtonStyle}
                    >
                      Manage
                    </button>
                  </div>

                  {connectedAIStudioProviders.length === 0 ? (
                    <div style={emptyCompactStyle}>
                      No provider is currently connected and
                      enabled for AI Studio.
                    </div>
                  ) : (
                    <div style={connectedProviderListStyle}>
                      {connectedAIStudioProviders.map(
                        (connection) => {
                          const provider = providerMap.get(
                            connection.provider_id
                          );

                          return (
                            <div
                              key={connection.id}
                              style={connectedProviderStyle}
                            >
                              <div>
                                <strong>
                                  {provider?.name ||
                                    "Connected Provider"}
                                </strong>

                                <div style={mutedStyle}>
                                  {connection.account_display_name ||
                                    connection.health_status}
                                </div>
                              </div>

                              <span style={primaryBadgeStyle}>
                                {connection.status}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={dashboardGridStyle}>
                <div style={panelStyle}>
                  <h3 style={panelTitleStyle}>
                    Recent Projects
                  </h3>

                  {projects.length === 0 ? (
                    <div style={emptyCompactStyle}>
                      No AI Studio projects have been created.
                    </div>
                  ) : (
                    <div style={listStyle}>
                      {projects.slice(0, 5).map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => {
                            setSelectedProject(project);
                            setMainView("Projects");
                          }}
                          style={recentProjectStyle}
                        >
                          <div>
                            <strong>{project.title}</strong>

                            <div style={mutedStyle}>
                              {project.project_type} ·{" "}
                              {project.status}
                            </div>
                          </div>

                          <span style={openLabelStyle}>
                            Open →
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={panelStyle}>
                  <h3 style={panelTitleStyle}>
                    Learning Intelligence
                  </h3>

                  {intelligence.length === 0 ? (
                    <div style={emptyCompactStyle}>
                      No learning-intelligence findings have been
                      recorded.
                    </div>
                  ) : (
                    <div style={listStyle}>
                      {intelligence.slice(0, 5).map((finding) => (
                        <div
                          key={finding.id}
                          style={intelligenceSummaryStyle}
                        >
                          <div>
                            <strong>{finding.title}</strong>

                            <div style={mutedStyle}>
                              {finding.finding_type} ·{" "}
                              {finding.status}
                            </div>
                          </div>

                          <span style={secondaryBadgeStyle}>
                            {finding.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {mainView === "Projects" && (
            <div>
              <div style={sectionHeaderStyle}>
                <SectionHeading
                  title="Projects"
                  description="Reopen and continue every saved learning-design project."
                />

                <button
                  type="button"
                  onClick={() => {
                    resetCreateForm();
                    setShowCreateForm(true);
                    setMainView("Create");
                  }}
                  style={primaryButtonStyle}
                >
                  New Project
                </button>
              </div>

              <div style={toolbarStyle}>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search projects..."
                  style={inputStyle}
                />

                <select
                  value={projectTypeFilter}
                  onChange={(event) =>
                    setProjectTypeFilter(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="All">
                    All project types
                  </option>

                  {projectTypes.map((type) => (
                    <option key={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <select
                  value={projectStatusFilter}
                  onChange={(event) =>
                    setProjectStatusFilter(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="All">
                    All statuses
                  </option>

                  {projectStatuses
                    .filter((status) => status !== "Archived")
                    .map((status) => (
                      <option key={status}>
                        {status}
                      </option>
                    ))}
                </select>
              </div>

              {filteredProjects.length === 0 ? (
                <div style={emptyStateStyle}>
                  <div style={emptyIconStyle}>✦</div>

                  <h3 style={emptyTitleStyle}>
                    No AI Studio projects found
                  </h3>

                  <p style={emptyDescriptionStyle}>
                    Create a new project or adjust the current
                    search and filters.
                  </p>
                </div>
              ) : (
                <div style={projectGridStyle}>
                  {filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() =>
                        setSelectedProject(project)
                      }
                      style={projectCardStyle}
                    >
                      <div style={cardHeaderStyle}>
                        <div>
                          <div style={badgeRowStyle}>
                            <span style={primaryBadgeStyle}>
                              {project.status}
                            </span>

                            <span style={secondaryBadgeStyle}>
                              {project.project_type}
                            </span>
                          </div>

                          <h3 style={projectCardTitleStyle}>
                            {project.title}
                          </h3>
                        </div>

                        <span style={secondaryBadgeStyle}>
                          v{project.current_version_number}
                        </span>
                      </div>

                      <p style={projectCardDescriptionStyle}>
                        {project.description ||
                          project.objective ||
                          "No description has been added."}
                      </p>

                      <div
                        style={
                          assignmentDetailGridStyle
                        }
                      >
                        <DetailItem
                          label="Audience"
                          value={
                            project.intended_audience ||
                            "Not recorded"
                          }
                        />

                        <DetailItem
                          label="Output"
                          value={
                            project.output_format ||
                            "Not recorded"
                          }
                        />

                        <DetailItem
                          label="Updated"
                          value={new Date(
                            project.updated_at
                          ).toLocaleDateString("en-GB")}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {mainView === "Create" && showCreateForm && (
            <div>
              <SectionHeading
                title="Create AI Studio Project"
                description="Define the complete project brief before Leo begins creating."
              />

              <div style={formPanelStyle}>
                <div style={formHeaderStyle}>
                  <div>
                    <h3 style={formTitleStyle}>
                      Project Brief
                    </h3>

                    <p style={formDescriptionStyle}>
                      Use a template or create a fully tailored
                      project.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setMainView("Dashboard");
                    }}
                    style={closeButtonStyle}
                  >
                    Close
                  </button>
                </div>

                <FormField label="Template">
                  <select
                    value={selectedTemplateId}
                    onChange={(event) =>
                      applyTemplate(event.target.value)
                    }
                    style={inputStyle}
                  >
                    <option value="">
                      Start without a template
                    </option>

                    {templates.map((template) => (
                      <option
                        key={template.id}
                        value={template.id}
                      >
                        {template.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <div style={formGridStyle}>
                  <FormField label="Project title">
                    <input
                      value={createTitle}
                      onChange={(event) =>
                        setCreateTitle(event.target.value)
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Project type">
                    <select
                      value={createProjectType}
                      onChange={(event) =>
                        setCreateProjectType(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    >
                      {projectTypes.map((type) => (
                        <option key={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <FormField label="Description">
                  <textarea
                    value={createDescription}
                    onChange={(event) =>
                      setCreateDescription(
                        event.target.value
                      )
                    }
                    style={textareaStyle}
                  />
                </FormField>

                <FormField label="Objective">
                  <textarea
                    value={createObjective}
                    onChange={(event) =>
                      setCreateObjective(
                        event.target.value
                      )
                    }
                    style={textareaStyle}
                  />
                </FormField>

                <div style={formGridStyle}>
                  <FormField label="Intended audience">
                    <input
                      value={createAudience}
                      onChange={(event) =>
                        setCreateAudience(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Target role">
                    <input
                      value={createRole}
                      onChange={(event) =>
                        setCreateRole(event.target.value)
                      }
                      style={inputStyle}
                    />
                  </FormField>
                </div>

                <div style={formGridStyle}>
                  <FormField label="Target department">
                    <input
                      value={createDepartment}
                      onChange={(event) =>
                        setCreateDepartment(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Target location">
                    <input
                      value={createLocation}
                      onChange={(event) =>
                        setCreateLocation(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>
                </div>

                <div style={formGridStyle}>
                  <FormField label="Subject area">
                    <input
                      value={createSubjectArea}
                      onChange={(event) =>
                        setCreateSubjectArea(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Output format">
                    <select
                      value={createOutputFormat}
                      onChange={(event) =>
                        setCreateOutputFormat(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    >
                      {outputTypes.map((type) => (
                        <option key={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <div style={formGridStyle}>
                  <FormField label="Tone">
                    <select
                      value={createTone}
                      onChange={(event) =>
                        setCreateTone(event.target.value)
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

                  <FormField label="Reading level">
                    <select
                      value={createReadingLevel}
                      onChange={(event) =>
                        setCreateReadingLevel(
                          event.target.value
                        )
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
                  <FormField label="Language">
                    <input
                      value={createLanguageCode}
                      onChange={(event) =>
                        setCreateLanguageCode(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Estimated duration minutes">
                    <input
                      type="number"
                      min="0"
                      value={createDuration}
                      onChange={(event) =>
                        setCreateDuration(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  </FormField>
                </div>

                <FormField label="Source type">
                  <select
                    value={createSourceType}
                    onChange={(event) =>
                      setCreateSourceType(
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  >
                    {sourceTypes.map((type) => (
                      <option key={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Source text">
                  <textarea
                    value={createSourceText}
                    onChange={(event) =>
                      setCreateSourceText(
                        event.target.value
                      )
                    }
                    style={largeTextareaStyle}
                  />
                </FormField>

                <FormField label="Instructions for Leo">
                  <textarea
                    value={createInstructions}
                    onChange={(event) =>
                      setCreateInstructions(
                        event.target.value
                      )
                    }
                    style={textareaStyle}
                  />
                </FormField>

                <FormField label="Constraints">
                  <textarea
                    value={createConstraints}
                    onChange={(event) =>
                      setCreateConstraints(
                        event.target.value
                      )
                    }
                    style={textareaStyle}
                  />
                </FormField>

                <div style={optionGridStyle}>
                  <CheckboxField
                    label="Employment law review"
                    description="Review the output for employment-law risk and accuracy."
                    checked={createLegalReview}
                    onChange={setCreateLegalReview}
                  />

                  <CheckboxField
                    label="Equality review"
                    description="Review the output for equality, fairness and bias."
                    checked={createEqualityReview}
                    onChange={setCreateEqualityReview}
                  />

                  <CheckboxField
                    label="Accessibility review"
                    description="Review accessibility, readability and inclusive design."
                    checked={createAccessibilityReview}
                    onChange={setCreateAccessibilityReview}
                  />

                  <CheckboxField
                    label="Manager review"
                    description="Require a manager or administrator review before publication."
                    checked={createManagerReview}
                    onChange={setCreateManagerReview}
                  />
                </div>

                <div style={formActionsStyle}>
                  <button
                    type="button"
                    onClick={() => {
                      resetCreateForm();
                      setShowCreateForm(false);
                      setMainView("Dashboard");
                    }}
                    style={secondaryButtonStyle}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void createProject()
                    }
                    disabled={saving}
                    style={primaryButtonStyle}
                  >
                    {saving
                      ? "Creating..."
                      : "Create Project"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {mainView === "Professional Review" && (
            <div>
              <SectionHeading
                title="Professional Review"
                description="Review projects and outputs that require professional approval or changes."
              />

              <div style={summaryGridStyle}>
                <SummaryCard
                  label="Pending Reviews"
                  value={String(pendingReviewCount)}
                />

                <SummaryCard
                  label="Projects Awaiting Review"
                  value={String(awaitingReviewCount)}
                />

                <SummaryCard
                  label="Changes Required"
                  value={String(
                    reviews.filter(
                      (review) =>
                        review.review_status ===
                        "Changes Required"
                    ).length
                  )}
                />
              </div>

              {reviews.length === 0 ? (
                <div style={emptyStateStyle}>
                  No professional reviews have been recorded yet.
                </div>
              ) : (
                <div style={listStyle}>
                  {reviews.map((review) => {
                    const project = projects.find(
                      (item) => item.id === review.project_id
                    );

                    return (
                      <button
                        key={review.id}
                        type="button"
                        onClick={() => {
                          if (project) {
                            setSelectedProject(project);
                            setActiveTab(
                              "Professional Review"
                            );
                          }
                        }}
                        style={reviewQueueCardStyle}
                      >
                        <div style={cardHeaderStyle}>
                          <div>
                            <div style={eyebrowStyle}>
                              {review.review_type}
                            </div>

                            <h4 style={cardTitleStyle}>
                              {project?.title ||
                                "AI Studio Project"}
                            </h4>
                          </div>

                          <span style={primaryBadgeStyle}>
                            {review.review_status}
                          </span>
                        </div>

                        {review.summary && (
                          <p style={cardDescriptionStyle}>
                            {review.summary}
                          </p>
                        )}

                        <div style={mutedStyle}>
                          {review.risk_level
                            ? `${review.risk_level} risk · `
                            : ""}
                          {new Date(
                            review.created_at
                          ).toLocaleDateString("en-GB")}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {mainView === "Learning Intelligence" && (
            <div>
              <div style={sectionHeaderStyle}>
                <SectionHeading
                  title="Learning Intelligence"
                  description="Record and manage learning gaps, risks, duplication, review needs and workforce-development opportunities."
                />
              </div>

              <div style={formPanelStyle}>
                <div style={formGridStyle}>
                  <FormField label="Finding type">
                    <select
                      value={findingType}
                      onChange={(event) =>
                        setFindingType(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    >
                      {intelligenceTypes.map((type) => (
                        <option key={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Priority">
                    <select
                      value={findingPriority}
                      onChange={(event) =>
                        setFindingPriority(
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    >
                      {priorities.map((priority) => (
                        <option key={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <FormField label="Finding title">
                  <input
                    value={findingTitle}
                    onChange={(event) =>
                      setFindingTitle(event.target.value)
                    }
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="Summary">
                  <textarea
                    value={findingSummary}
                    onChange={(event) =>
                      setFindingSummary(
                        event.target.value
                      )
                    }
                    style={textareaStyle}
                  />
                </FormField>

                <FormField label="Recommendation">
                  <textarea
                    value={findingRecommendation}
                    onChange={(event) =>
                      setFindingRecommendation(
                        event.target.value
                      )
                    }
                    style={textareaStyle}
                  />
                </FormField>

                <FormField label="Due date">
                  <input
                    type="date"
                    value={findingDueDate}
                    onChange={(event) =>
                      setFindingDueDate(
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
                      void createIntelligenceFinding()
                    }
                    style={primaryButtonStyle}
                  >
                    Create Finding
                  </button>
                </div>
              </div>

              {intelligence.length === 0 ? (
                <div style={emptyStateStyle}>
                  No learning-intelligence findings have been
                  recorded.
                </div>
              ) : (
                <div style={listStyle}>
                  {intelligence.map((finding) => (
                    <div
                      key={finding.id}
                      style={standardCardStyle}
                    >
                      <div style={cardHeaderStyle}>
                        <div>
                          <div style={eyebrowStyle}>
                            {finding.finding_type}
                          </div>

                          <h4 style={cardTitleStyle}>
                            {finding.title}
                          </h4>
                        </div>

                        <div style={findingControlsStyle}>
                          <span style={primaryBadgeStyle}>
                            {finding.priority}
                          </span>

                          <select
                            value={finding.status}
                            onChange={(event) =>
                              void updateFindingStatus(
                                finding,
                                event.target.value
                              )
                            }
                            style={statusSelectStyle}
                          >
                            {intelligenceStatuses.map(
                              (status) => (
                                <option key={status}>
                                  {status}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>

                      <p style={cardDescriptionStyle}>
                        {finding.summary}
                      </p>

                      {finding.recommendation && (
                        <div style={noticeStyle}>
                          <strong>Recommendation:</strong>{" "}
                          {finding.recommendation}
                        </div>
                      )}

                      <div
                        style={
                          assignmentDetailGridStyle
                        }
                      >
                        <DetailItem
                          label="Created"
                          value={new Date(
                            finding.created_at
                          ).toLocaleDateString("en-GB")}
                        />

                        <DetailItem
                          label="Due"
                          value={
                            finding.due_date
                              ? formatDate(
                                  finding.due_date
                                )
                              : "Not set"
                          }
                        />

                        <DetailItem
                          label="Linked Project"
                          value={
                            projects.find(
                              (project) =>
                                project.id ===
                                finding.project_id
                            )?.title || "Not linked"
                          }
                        />
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

function buildProjectInstruction(
  project: AIProject
): string {
  return [
    `Project: ${project.title}`,
    `Project type: ${project.project_type}`,
    project.objective
      ? `Objective: ${project.objective}`
      : null,
    project.intended_audience
      ? `Audience: ${project.intended_audience}`
      : null,
    project.target_role
      ? `Target role: ${project.target_role}`
      : null,
    project.subject_area
      ? `Subject: ${project.subject_area}`
      : null,
    project.output_format
      ? `Output format: ${project.output_format}`
      : null,
    project.tone ? `Tone: ${project.tone}` : null,
    project.reading_level
      ? `Reading level: ${project.reading_level}`
      : null,
    project.instructions
      ? `Instructions: ${project.instructions}`
      : null,
    project.constraints
      ? `Constraints: ${project.constraints}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function mapOutputToLearningType(
  outputType: string
): string {
  if (
    [
      "Assessment",
      "Question Set",
      "Knowledge Check",
    ].includes(outputType)
  ) {
    return "Assessment";
  }

  if (
    [
      "Manager Guide",
      "Facilitator Guide",
      "Quick Reference Guide",
      "Workbook",
    ].includes(outputType)
  ) {
    return "Guide";
  }

  if (outputType === "Toolbox Talk") {
    return "Toolbox Talk";
  }

  return "Course";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  maxWidth: "780px",
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.55,
};

const mainNavigationStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const mainNavigationButtonStyle: React.CSSProperties = {
  padding: "9px 13px",
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  fontWeight: 700,
  cursor: "pointer",
};

const activeMainNavigationButtonStyle: React.CSSProperties = {
  ...mainNavigationButtonStyle,
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const archiveButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const smallButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  borderRadius: "8px",
  padding: "6px 9px",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "12px",
};

const backButtonStyle: React.CSSProperties = {
  padding: 0,
  marginBottom: "16px",
  background: "transparent",
  color: "#6E5084",
  border: "none",
  fontWeight: 800,
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
  padding: "15px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "13px",
};

const summaryValueStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "23px",
  fontWeight: 800,
};

const summaryLabelStyle: React.CSSProperties = {
  marginTop: "5px",
  color: "#6B7280",
  fontSize: "12px",
};

const dashboardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(340px, 1fr))",
  gap: "14px",
  marginBottom: "14px",
};

const panelStyle: React.CSSProperties = {
  padding: "18px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "14px",
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "16px",
};

const panelDescriptionStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: 1.5,
};

const quickActionGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "9px",
};

const quickActionStyle: React.CSSProperties = {
  padding: "11px",
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #E8DDF0",
  borderRadius: "10px",
  fontWeight: 700,
  textAlign: "left",
  cursor: "pointer",
};

const connectedProviderListStyle: React.CSSProperties = {
  display: "grid",
  gap: "9px",
};

const connectedProviderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  padding: "11px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
};

const recentProjectStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  width: "100%",
  padding: "11px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  textAlign: "left",
  cursor: "pointer",
};

const intelligenceSummaryStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  padding: "11px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
};

const openLabelStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 800,
};

const toolbarStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(250px, 1fr) 220px 190px",
  gap: "10px",
  marginBottom: "18px",
};

const projectGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "13px",
};

const projectCardStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "13px",
  textAlign: "left",
  cursor: "pointer",
};

const projectCardTitleStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#111827",
  fontSize: "16px",
};

const projectCardDescriptionStyle: React.CSSProperties = {
  margin: "11px 0 0",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.5,
};

const projectHeaderStyle: React.CSSProperties = {
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

const projectTitleStyle: React.CSSProperties = {
  margin: "9px 0 0",
  color: "#111827",
};

const projectDescriptionStyle: React.CSSProperties = {
  maxWidth: "800px",
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.55,
};

const projectVersionStyle: React.CSSProperties = {
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
};

const closeButtonStyle: React.CSSProperties = {
  background: "transparent",
  color: "#6B7280",
  border: "none",
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
  boxSizing: "border-box",
  padding: "10px 12px",
  background: "#FFFFFF",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  fontSize: "14px",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "100px",
  resize: "vertical",
  fontFamily: "inherit",
  lineHeight: 1.5,
};

const largeTextareaStyle: React.CSSProperties = {
  ...textareaStyle,
  minHeight: "180px",
};

const outputTextareaStyle: React.CSSProperties = {
  ...textareaStyle,
  minHeight: "420px",
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

const splitActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  marginTop: "18px",
};

const detailGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "10px",
  marginBottom: "18px",
};

const detailCardStyle: React.CSSProperties = {
  padding: "14px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "11px",
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

const conversationPanelStyle: React.CSSProperties = {
  display: "grid",
  gap: "14px",
};

const conversationListStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const userMessageStyle: React.CSSProperties = {
  maxWidth: "85%",
  marginLeft: "auto",
  padding: "13px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "13px",
};

const assistantMessageStyle: React.CSSProperties = {
  maxWidth: "85%",
  padding: "13px",
  background: "#F5FFF9",
  border: "1px solid #CFE8DA",
  borderRadius: "13px",
};

const systemMessageStyle: React.CSSProperties = {
  padding: "13px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "13px",
};

const messageHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "7px",
  color: "#374151",
  fontSize: "12px",
};

const conversationTextStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
};

const conversationComposerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  gap: "10px",
  padding: "14px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "13px",
};

const conversationTextareaStyle: React.CSSProperties = {
  ...textareaStyle,
  flex: 1,
  minHeight: "90px",
};

const generationWorkspaceStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1.4fr) minmax(280px, 0.6fr)",
  gap: "16px",
};

const generationFormStyle: React.CSSProperties = {
  padding: "16px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "13px",
};

const generationActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "16px",
};

const outputListStyle: React.CSSProperties = {
  display: "grid",
  gap: "9px",
};

const outputCardStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  textAlign: "left",
  cursor: "pointer",
};

const activeOutputCardStyle: React.CSSProperties = {
  ...outputCardStyle,
  background: "#F7F1FC",
  border: "1px solid #CDB2E2",
};

const outputMetaStyle: React.CSSProperties = {
  marginTop: "8px",
  color: "#6B7280",
  fontSize: "11px",
};

const outputEditorStyle: React.CSSProperties = {
  padding: "18px",
  marginTop: "18px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
};

const projectIntelligenceStyle: React.CSSProperties = {
  marginTop: "20px",
};

const versionTableWrapStyle: React.CSSProperties = {
  overflowX: "auto",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
};

const versionTableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: "900px",
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

const publishWorkspaceStyle: React.CSSProperties = {
  display: "grid",
  gap: "16px",
};

const publishCardStyle: React.CSSProperties = {
  padding: "17px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
};

const publishTitleStyle: React.CSSProperties = {
  margin: "5px 0 0",
  color: "#111827",
  fontSize: "17px",
};

const publishSectionStyle: React.CSSProperties = {
  marginTop: "17px",
  paddingTop: "15px",
  borderTop: "1px solid #E5E7EB",
};

const publishSectionTitleStyle: React.CSSProperties = {
  margin: "0 0 12px",
  color: "#111827",
  fontSize: "14px",
};

const connectionPromptStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  padding: "14px",
  background: "#F9FAFB",
  border: "1px dashed #D1D5DB",
  borderRadius: "11px",
};

const connectionPromptTextStyle: React.CSSProperties = {
  margin: "5px 0 0",
  color: "#6B7280",
  fontSize: "12px",
};

const providerExportGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "9px",
};

const providerExportButtonStyle: React.CSSProperties = {
  padding: "12px",
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #E8DDF0",
  borderRadius: "10px",
  textAlign: "left",
  cursor: "pointer",
};

const providerExportTitleStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 800,
};

const providerExportDetailStyle: React.CSSProperties = {
  display: "block",
  marginTop: "4px",
  color: "#6B7280",
  fontSize: "11px",
};

const exportHistoryStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  padding: "11px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
};

const exportStatusWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const findingControlsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const reviewQueueCardStyle: React.CSSProperties = {
  width: "100%",
  padding: "15px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  textAlign: "left",
  cursor: "pointer",
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
  background: "#FFFFFF",
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
};

const subsectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "16px",
};

const subsectionDescriptionStyle: React.CSSProperties = {
  margin: "5px 0 0",
  color: "#6B7280",
  fontSize: "12px",
};

const inlineCodeStyle: React.CSSProperties = {
  color: "#6E5084",
  fontWeight: 700,
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

const timelineSummaryStyle: React.CSSProperties = {
  marginTop: "4px",
  color: "#374151",
  fontSize: "14px",
  fontWeight: 600,
};

const flexStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const mutedStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "12px",
};

const noticeStyle: React.CSSProperties = {
  padding: "12px",
  marginTop: "13px",
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

const emptyCompactStyle: React.CSSProperties = {
  padding: "20px",
  background: "#F9FAFB",
  color: "#6B7280",
  border: "1px dashed #D1D5DB",
  borderRadius: "11px",
  textAlign: "center",
  fontSize: "13px",
};

const emptyIconStyle: React.CSSProperties = {
  marginBottom: "8px",
  color: "#6E5084",
  fontSize: "22px",
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