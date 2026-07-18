"use client";

import {
  Archive,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  Laptop,
  Loader2,
  Mail,
  NotebookPen,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

type OnboardingStatus =
  | "not_started"
  | "pre_start"
  | "in_progress"
  | "ready_for_first_day"
  | "first_week"
  | "first_month"
  | "completed"
  | "paused"
  | "withdrawn";

type OnboardingPriority = "standard" | "priority" | "urgent";

type TaskStatus =
  | "not_started"
  | "in_progress"
  | "awaiting_evidence"
  | "blocked"
  | "completed"
  | "not_required";

type TaskCategory =
  | "pre_employment"
  | "contract_and_documents"
  | "payroll"
  | "equipment"
  | "systems"
  | "learning"
  | "first_day"
  | "first_week"
  | "first_month"
  | "probation_handover"
  | "other";

type TaskOwnerType =
  | "employee"
  | "manager"
  | "hr"
  | "it"
  | "payroll"
  | "other";

type EmploymentType =
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

interface OnboardingRecord {
  id: string;
  organisation_id: string | null;
  onboarding_reference: string;
  offer_id: string | null;
  application_id: string | null;
  vacancy_id: string | null;
  candidate_id: string;
  employee_id: string | null;
  status: OnboardingStatus;
  priority: OnboardingPriority;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  personal_email: string | null;
  work_email: string | null;
  phone: string | null;
  job_title: string;
  department: string | null;
  location_name: string | null;
  manager_name: string | null;
  manager_user_id: string | null;
  employment_type: EmploymentType;
  start_date: string;
  end_date: string | null;
  hours_per_week: number | null;
  work_pattern: string | null;
  salary_amount: number | null;
  salary_currency: string | null;
  probation_months: number | null;
  contract_issued_at: string | null;
  contract_signed_at: string | null;
  payroll_ready_at: string | null;
  equipment_ready_at: string | null;
  systems_ready_at: string | null;
  right_to_work_confirmed_at: string | null;
  references_confirmed_at: string | null;
  dbs_confirmed_at: string | null;
  first_day_confirmed_at: string | null;
  probation_handover_at: string | null;
  completed_at: string | null;
  completion_notes: string | null;
  paused_at: string | null;
  pause_reason: string | null;
  withdrawn_at: string | null;
  withdrawal_reason: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

interface OnboardingTask {
  id: string;
  organisation_id: string | null;
  onboarding_id: string;
  category: TaskCategory;
  title: string;
  description: string | null;
  owner_type: TaskOwnerType;
  owner_name: string | null;
  due_date: string | null;
  status: TaskStatus;
  is_mandatory: boolean;
  evidence_required: boolean;
  evidence_file_name: string | null;
  evidence_file_path: string | null;
  completed_at: string | null;
  completed_by: string | null;
  completion_notes: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
}

interface Vacancy {
  id: string;
  title: string;
  department: string | null;
  location_name: string | null;
  hiring_manager_name: string | null;
  hiring_manager_user_id: string | null;
  employment_type: EmploymentType;
  work_pattern: string | null;
  hours_per_week: number | null;
}

interface Application {
  id: string;
  vacancy_id: string;
  candidate_id: string;
  status: string;
  current_stage_key: string;
}

interface Offer {
  id: string;
  application_id: string;
  vacancy_id: string;
  candidate_id: string;
  status: string;
  job_title: string;
  department: string | null;
  location_name: string | null;
  manager_name: string | null;
  manager_user_id: string | null;
  employment_type: EmploymentType;
  proposed_start_date: string | null;
  hours_per_week: number | null;
  work_pattern: string | null;
  salary_amount: number | null;
  salary_currency: string | null;
  probation_months: number | null;
  accepted_at: string | null;
  archived_at: string | null;
}

interface OnboardingView extends OnboardingRecord {
  fullName: string;
  taskCount: number;
  completedTaskCount: number;
  mandatoryTaskCount: number;
  completedMandatoryTaskCount: number;
  overdueTaskCount: number;
  blockedTaskCount: number;
  progress: number;
}

interface StarterOption {
  offer: Offer;
  candidate: Candidate;
  vacancy: Vacancy | null;
  candidateName: string;
}

interface CreateOnboardingForm {
  offer_id: string;
  first_name: string;
  last_name: string;
  preferred_name: string;
  personal_email: string;
  phone: string;
  job_title: string;
  department: string;
  location_name: string;
  manager_name: string;
  manager_user_id: string;
  employment_type: EmploymentType;
  start_date: string;
  end_date: string;
  hours_per_week: string;
  work_pattern: string;
  salary_amount: string;
  salary_currency: string;
  probation_months: string;
  priority: OnboardingPriority;
  include_dbs: boolean;
  include_equipment: boolean;
  include_systems: boolean;
  include_learning: boolean;
}

interface TaskForm {
  title: string;
  description: string;
  category: TaskCategory;
  owner_type: TaskOwnerType;
  owner_name: string;
  due_date: string;
  is_mandatory: boolean;
  evidence_required: boolean;
}

interface TaskTemplate {
  category: TaskCategory;
  title: string;
  description: string;
  owner_type: TaskOwnerType;
  dueOffsetDays: number;
  isMandatory: boolean;
  evidenceRequired: boolean;
  conditionalKey?:
    | "dbs"
    | "equipment"
    | "systems"
    | "learning";
}

const initialCreateForm: CreateOnboardingForm = {
  offer_id: "",
  first_name: "",
  last_name: "",
  preferred_name: "",
  personal_email: "",
  phone: "",
  job_title: "",
  department: "",
  location_name: "",
  manager_name: "",
  manager_user_id: "",
  employment_type: "permanent",
  start_date: "",
  end_date: "",
  hours_per_week: "",
  work_pattern: "",
  salary_amount: "",
  salary_currency: "GBP",
  probation_months: "3",
  priority: "standard",
  include_dbs: false,
  include_equipment: true,
  include_systems: true,
  include_learning: true,
};

const initialTaskForm: TaskForm = {
  title: "",
  description: "",
  category: "other",
  owner_type: "hr",
  owner_name: "",
  due_date: "",
  is_mandatory: true,
  evidence_required: false,
};

const onboardingStatusLabels: Record<OnboardingStatus, string> = {
  not_started: "Not started",
  pre_start: "Pre-start",
  in_progress: "In progress",
  ready_for_first_day: "Ready for first day",
  first_week: "First week",
  first_month: "First month",
  completed: "Completed",
  paused: "Paused",
  withdrawn: "Withdrawn",
};

const taskStatusLabels: Record<TaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  awaiting_evidence: "Awaiting evidence",
  blocked: "Blocked",
  completed: "Completed",
  not_required: "Not required",
};

const categoryLabels: Record<TaskCategory, string> = {
  pre_employment: "Pre-employment",
  contract_and_documents: "Contract and documents",
  payroll: "Payroll",
  equipment: "Equipment",
  systems: "Systems and access",
  learning: "Learning",
  first_day: "First day",
  first_week: "First week",
  first_month: "First month",
  probation_handover: "Probation handover",
  other: "Other",
};

const ownerTypeLabels: Record<TaskOwnerType, string> = {
  employee: "New starter",
  manager: "Manager",
  hr: "HR",
  it: "IT",
  payroll: "Payroll",
  other: "Other",
};

const employmentTypeLabels: Record<EmploymentType, string> = {
  permanent: "Permanent",
  fixed_term: "Fixed term",
  temporary: "Temporary",
  casual: "Casual",
  zero_hours: "Zero hours",
  apprenticeship: "Apprenticeship",
  internship: "Internship",
  contractor: "Contractor",
  volunteer: "Volunteer",
  other: "Other",
};

const priorityLabels: Record<OnboardingPriority, string> = {
  standard: "Standard",
  priority: "Priority",
  urgent: "Urgent",
};

const defaultTaskTemplates: TaskTemplate[] = [
  {
    category: "pre_employment",
    title: "Confirm right to work",
    description:
      "Complete and evidence the required right to work check before employment begins.",
    owner_type: "hr",
    dueOffsetDays: -7,
    isMandatory: true,
    evidenceRequired: true,
  },
  {
    category: "pre_employment",
    title: "Confirm references",
    description:
      "Review the required references and record that they are satisfactory or escalated.",
    owner_type: "hr",
    dueOffsetDays: -7,
    isMandatory: true,
    evidenceRequired: true,
  },
  {
    category: "pre_employment",
    title: "Confirm DBS or safeguarding clearance",
    description:
      "Complete the required DBS, barred-list or safeguarding checks for the role.",
    owner_type: "hr",
    dueOffsetDays: -5,
    isMandatory: true,
    evidenceRequired: true,
    conditionalKey: "dbs",
  },
  {
    category: "contract_and_documents",
    title: "Issue employment contract",
    description:
      "Issue the contract and written particulars using the approved employment terms.",
    owner_type: "hr",
    dueOffsetDays: -10,
    isMandatory: true,
    evidenceRequired: true,
  },
  {
    category: "contract_and_documents",
    title: "Receive signed employment contract",
    description:
      "Confirm that the signed contract has been received and stored.",
    owner_type: "employee",
    dueOffsetDays: -3,
    isMandatory: true,
    evidenceRequired: true,
  },
  {
    category: "contract_and_documents",
    title: "Complete starter information",
    description:
      "Collect the starter information required for employment records and payroll.",
    owner_type: "employee",
    dueOffsetDays: -5,
    isMandatory: true,
    evidenceRequired: false,
  },
  {
    category: "contract_and_documents",
    title: "Record emergency contact",
    description:
      "Collect and securely record the new starter's emergency contact details.",
    owner_type: "employee",
    dueOffsetDays: 0,
    isMandatory: true,
    evidenceRequired: false,
  },
  {
    category: "contract_and_documents",
    title: "Acknowledge employee handbook",
    description:
      "Provide the current employee handbook and record acknowledgement.",
    owner_type: "employee",
    dueOffsetDays: 2,
    isMandatory: true,
    evidenceRequired: false,
  },
  {
    category: "contract_and_documents",
    title: "Acknowledge required policies",
    description:
      "Provide the policies that apply to the role and record the starter's acknowledgement.",
    owner_type: "employee",
    dueOffsetDays: 5,
    isMandatory: true,
    evidenceRequired: false,
  },
  {
    category: "payroll",
    title: "Collect payroll information",
    description:
      "Collect bank, tax and payroll information through the approved secure process.",
    owner_type: "employee",
    dueOffsetDays: -5,
    isMandatory: true,
    evidenceRequired: false,
  },
  {
    category: "payroll",
    title: "Add starter to payroll",
    description:
      "Complete payroll setup and verify the first payroll cut-off.",
    owner_type: "payroll",
    dueOffsetDays: -2,
    isMandatory: true,
    evidenceRequired: false,
  },
  {
    category: "equipment",
    title: "Prepare equipment",
    description:
      "Prepare, record and allocate all equipment required for the role.",
    owner_type: "manager",
    dueOffsetDays: -2,
    isMandatory: true,
    evidenceRequired: false,
    conditionalKey: "equipment",
  },
  {
    category: "systems",
    title: "Create work email and system accounts",
    description:
      "Create the approved accounts and access permissions required for the role.",
    owner_type: "it",
    dueOffsetDays: -2,
    isMandatory: true,
    evidenceRequired: false,
    conditionalKey: "systems",
  },
  {
    category: "systems",
    title: "Confirm data access permissions",
    description:
      "Check that access reflects the starter's role and follows least-privilege principles.",
    owner_type: "manager",
    dueOffsetDays: 0,
    isMandatory: true,
    evidenceRequired: false,
    conditionalKey: "systems",
  },
  {
    category: "learning",
    title: "Assign mandatory learning",
    description:
      "Assign organisation-wide and role-specific mandatory learning in Leo Learn.",
    owner_type: "hr",
    dueOffsetDays: -1,
    isMandatory: true,
    evidenceRequired: false,
    conditionalKey: "learning",
  },
  {
    category: "learning",
    title: "Assign new starter development pathway",
    description:
      "Assign the appropriate onboarding or role-development pathway in Leo Learn.",
    owner_type: "manager",
    dueOffsetDays: 0,
    isMandatory: false,
    evidenceRequired: false,
    conditionalKey: "learning",
  },
  {
    category: "first_day",
    title: "Confirm first-day arrangements",
    description:
      "Send arrival time, location, contact details, dress requirements and first-day expectations.",
    owner_type: "manager",
    dueOffsetDays: -3,
    isMandatory: true,
    evidenceRequired: false,
  },
  {
    category: "first_day",
    title: "Complete welcome and workplace induction",
    description:
      "Welcome the starter, introduce key colleagues and complete the workplace induction.",
    owner_type: "manager",
    dueOffsetDays: 0,
    isMandatory: true,
    evidenceRequired: false,
  },
  {
    category: "first_day",
    title: "Complete health and safety induction",
    description:
      "Cover emergency arrangements, reporting procedures and role-specific safety requirements.",
    owner_type: "manager",
    dueOffsetDays: 0,
    isMandatory: true,
    evidenceRequired: true,
  },
  {
    category: "first_week",
    title: "Complete first-week manager check-in",
    description:
      "Check understanding, wellbeing, access, workload and any early support needs.",
    owner_type: "manager",
    dueOffsetDays: 5,
    isMandatory: true,
    evidenceRequired: false,
  },
  {
    category: "first_week",
    title: "Confirm role expectations",
    description:
      "Review responsibilities, standards, priorities and the support available.",
    owner_type: "manager",
    dueOffsetDays: 5,
    isMandatory: true,
    evidenceRequired: false,
  },
  {
    category: "first_month",
    title: "Complete first-month review",
    description:
      "Review progress, integration, learning, support needs and any early concerns.",
    owner_type: "manager",
    dueOffsetDays: 28,
    isMandatory: true,
    evidenceRequired: false,
  },
  {
    category: "probation_handover",
    title: "Create probation review schedule",
    description:
      "Confirm the probation dates and schedule the required review points.",
    owner_type: "hr",
    dueOffsetDays: 2,
    isMandatory: true,
    evidenceRequired: false,
  },
  {
    category: "probation_handover",
    title: "Hand onboarding record to probation",
    description:
      "Transfer relevant onboarding information, support needs and outstanding actions into probation.",
    owner_type: "hr",
    dueOffsetDays: 30,
    isMandatory: true,
    evidenceRequired: false,
  },
];

function formatDate(value: string | null): string {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function formatDateTime(value: string | null): string {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function addDays(dateValue: string, days: number): string {
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function isPastDate(value: string | null): boolean {
  if (!value) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return date < today;
}

function getOnboardingStatusClass(status: OnboardingStatus): string {
  switch (status) {
    case "completed":
      return "border-[#b9dfcf] bg-[#f5fff9] text-[#285f4a]";
    case "ready_for_first_day":
    case "first_week":
    case "first_month":
      return "border-[#d9c5e8] bg-[#f7f1fc] text-[#6e5084]";
    case "pre_start":
    case "in_progress":
      return "border-[#d8dce8] bg-[#f8f9fc] text-[#455168]";
    case "paused":
      return "border-[#ead7af] bg-[#fffaf0] text-[#7a5c1e]";
    case "withdrawn":
      return "border-[#ead0d0] bg-[#fff7f7] text-[#7b3f3f]";
    default:
      return "border-slate-200 bg-white text-slate-700";
  }
}

function getTaskStatusClass(status: TaskStatus): string {
  switch (status) {
    case "completed":
      return "border-[#b9dfcf] bg-[#f5fff9] text-[#285f4a]";
    case "in_progress":
      return "border-[#d9c5e8] bg-[#f7f1fc] text-[#6e5084]";
    case "awaiting_evidence":
      return "border-[#d8dce8] bg-[#f8f9fc] text-[#455168]";
    case "blocked":
      return "border-[#ead0d0] bg-[#fff7f7] text-[#7b3f3f]";
    case "not_required":
      return "border-slate-200 bg-slate-50 text-slate-500";
    default:
      return "border-slate-200 bg-white text-slate-700";
  }
}

function getPriorityClass(priority: OnboardingPriority): string {
  switch (priority) {
    case "urgent":
      return "border-[#ead0d0] bg-[#fff7f7] text-[#7b3f3f]";
    case "priority":
      return "border-[#ead7af] bg-[#fffaf0] text-[#7a5c1e]";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getCategoryIcon(category: TaskCategory): ReactNode {
  switch (category) {
    case "pre_employment":
      return <ShieldCheck className="h-4 w-4" />;
    case "contract_and_documents":
      return <FileText className="h-4 w-4" />;
    case "payroll":
      return <BriefcaseBusiness className="h-4 w-4" />;
    case "equipment":
      return <PackageCheck className="h-4 w-4" />;
    case "systems":
      return <Laptop className="h-4 w-4" />;
    case "learning":
      return <Sparkles className="h-4 w-4" />;
    case "first_day":
      return <UserCheck className="h-4 w-4" />;
    case "first_week":
      return <CalendarDays className="h-4 w-4" />;
    case "first_month":
      return <NotebookPen className="h-4 w-4" />;
    case "probation_handover":
      return <ClipboardCheck className="h-4 w-4" />;
    default:
      return <CheckCircle2 className="h-4 w-4" />;
  }
}


const onboardingWorkspaceCss = String.raw`
.onboarding-workspace, .onboarding-workspace * { box-sizing: border-box; }
.onboarding-workspace { width:100%; color:#1f2937; font-family:inherit; }
.onboarding-workspace button, .onboarding-workspace input, .onboarding-workspace select, .onboarding-workspace textarea { font:inherit; }
.onboarding-workspace button { cursor:pointer; }
.onboarding-workspace button:disabled { cursor:not-allowed; }
.onboarding-workspace [class~="flex"]{display:flex}.onboarding-workspace [class~="inline-flex"]{display:inline-flex}.onboarding-workspace [class~="grid"]{display:grid}.onboarding-workspace [class~="block"]{display:block}
.onboarding-workspace [class~="flex-col"]{flex-direction:column}.onboarding-workspace [class~="flex-wrap"]{flex-wrap:wrap}.onboarding-workspace [class~="flex-1"]{flex:1 1 0%}
.onboarding-workspace [class~="items-start"]{align-items:flex-start}.onboarding-workspace [class~="items-center"]{align-items:center}.onboarding-workspace [class~="justify-between"]{justify-content:space-between}.onboarding-workspace [class~="justify-center"]{justify-content:center}.onboarding-workspace [class~="justify-end"]{justify-content:flex-end}.onboarding-workspace [class~="place-items-center"]{place-items:center}.onboarding-workspace [class~="self-start"]{align-self:flex-start}
.onboarding-workspace [class~="gap-1"]{gap:.25rem}.onboarding-workspace [class~="gap-2"]{gap:.5rem}.onboarding-workspace [class~="gap-2.5"]{gap:.625rem}.onboarding-workspace [class~="gap-3"]{gap:.75rem}.onboarding-workspace [class~="gap-4"]{gap:1rem}.onboarding-workspace [class~="gap-5"]{gap:1.25rem}.onboarding-workspace [class~="gap-x-5"]{column-gap:1.25rem}.onboarding-workspace [class~="gap-y-2"]{row-gap:.5rem}
.onboarding-workspace [class~="space-y-3"]>*+*{margin-top:.75rem}.onboarding-workspace [class~="space-y-7"]>*+*{margin-top:1.75rem}
.onboarding-workspace [class~="grid-cols-6"]{grid-template-columns:repeat(6,minmax(0,1fr))}.onboarding-workspace [class~="grid-cols-[1fr_auto]"]{grid-template-columns:1fr auto}.onboarding-workspace [class~="grid-cols-[repeat(auto-fit,minmax(150px,1fr))]"]{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}.onboarding-workspace [class~="xl:grid-cols-[minmax(270px,340px)_minmax(0,1fr)]"]{grid-template-columns:minmax(270px,340px) minmax(0,1fr)}
.onboarding-workspace [class~="relative"]{position:relative}.onboarding-workspace [class~="absolute"]{position:absolute}.onboarding-workspace [class~="fixed"]{position:fixed}.onboarding-workspace [class~="sticky"]{position:sticky}.onboarding-workspace [class~="inset-0"]{inset:0}.onboarding-workspace [class~="top-0"]{top:0}.onboarding-workspace [class~="top-4"]{top:1rem}.onboarding-workspace [class~="top-1/2"]{top:50%}.onboarding-workspace [class~="right-3"]{right:.75rem}.onboarding-workspace [class~="bottom-0"]{bottom:0}.onboarding-workspace [class~="-translate-y-1/2"]{transform:translateY(-50%)}
.onboarding-workspace [class~="z-10"]{z-index:10}.onboarding-workspace [class~="z-20"]{z-index:20}.onboarding-workspace [class~="z-50"]{z-index:50}.onboarding-workspace [class~="z-[60]"]{z-index:60}
.onboarding-workspace [class~="w-full"]{width:100%}.onboarding-workspace [class~="w-3.5"]{width:.875rem}.onboarding-workspace [class~="w-4"]{width:1rem}.onboarding-workspace [class~="w-5"]{width:1.25rem}.onboarding-workspace [class~="w-6"]{width:1.5rem}.onboarding-workspace [class~="w-7"]{width:1.75rem}.onboarding-workspace [class~="w-[27px]"]{width:27px}.onboarding-workspace [class~="h-full"]{height:100%}.onboarding-workspace [class~="h-2.5"]{height:.625rem}.onboarding-workspace [class~="h-3.5"]{height:.875rem}.onboarding-workspace [class~="h-4"]{height:1rem}.onboarding-workspace [class~="h-5"]{height:1.25rem}.onboarding-workspace [class~="h-6"]{height:1.5rem}.onboarding-workspace [class~="h-7"]{height:1.75rem}.onboarding-workspace [class~="h-[27px]"]{height:27px}
.onboarding-workspace [class~="min-w-0"]{min-width:0}.onboarding-workspace [class~="min-w-[110px]"]{min-width:110px}.onboarding-workspace [class~="min-h-[300px]"]{min-height:300px}.onboarding-workspace [class~="min-h-[420px]"]{min-height:420px}.onboarding-workspace [class~="max-w-lg"]{max-width:32rem}.onboarding-workspace [class~="max-w-2xl"]{max-width:42rem}.onboarding-workspace [class~="max-w-3xl"]{max-width:48rem}.onboarding-workspace [class~="max-w-5xl"]{max-width:64rem}.onboarding-workspace [class~="max-w-[780px]"]{max-width:780px}.onboarding-workspace [class~="max-h-[92vh]"]{max-height:92vh}.onboarding-workspace [class~="max-h-[calc(100vh-32px)]"]{max-height:calc(100vh - 32px)}
.onboarding-workspace [class~="overflow-hidden"]{overflow:hidden}.onboarding-workspace [class~="overflow-auto"]{overflow:auto}.onboarding-workspace [class~="overflow-y-auto"]{overflow-y:auto}.onboarding-workspace [class~="overflow-x-auto"]{overflow-x:auto}
.onboarding-workspace [class~="p-1"]{padding:.25rem}.onboarding-workspace [class~="p-2"]{padding:.5rem}.onboarding-workspace [class~="p-2.5"]{padding:.625rem}.onboarding-workspace [class~="p-4"]{padding:1rem}.onboarding-workspace [class~="p-6"]{padding:1.5rem}.onboarding-workspace [class~="p-8"]{padding:2rem}.onboarding-workspace [class~="p-[13px]"]{padding:13px}.onboarding-workspace [class~="p-[17px]"]{padding:17px}.onboarding-workspace [class~="p-[18px]"]{padding:18px}.onboarding-workspace [class~="p-[22px]"]{padding:22px}
.onboarding-workspace [class~="px-2"]{padding-left:.5rem;padding-right:.5rem}.onboarding-workspace [class~="px-2.5"]{padding-left:.625rem;padding-right:.625rem}.onboarding-workspace [class~="px-3"]{padding-left:.75rem;padding-right:.75rem}.onboarding-workspace [class~="px-3.5"]{padding-left:.875rem;padding-right:.875rem}.onboarding-workspace [class~="px-4"]{padding-left:1rem;padding-right:1rem}.onboarding-workspace [class~="px-6"]{padding-left:1.5rem;padding-right:1.5rem}.onboarding-workspace [class~="px-[13px]"]{padding-left:13px;padding-right:13px}
.onboarding-workspace [class~="py-0.5"]{padding-top:.125rem;padding-bottom:.125rem}.onboarding-workspace [class~="py-1"]{padding-top:.25rem;padding-bottom:.25rem}.onboarding-workspace [class~="py-2"]{padding-top:.5rem;padding-bottom:.5rem}.onboarding-workspace [class~="py-2.5"]{padding-top:.625rem;padding-bottom:.625rem}.onboarding-workspace [class~="py-3"]{padding-top:.75rem;padding-bottom:.75rem}.onboarding-workspace [class~="py-4"]{padding-top:1rem;padding-bottom:1rem}.onboarding-workspace [class~="py-5"]{padding-top:1.25rem;padding-bottom:1.25rem}.onboarding-workspace [class~="py-6"]{padding-top:1.5rem;padding-bottom:1.5rem}.onboarding-workspace [class~="py-[7px]"]{padding-top:7px;padding-bottom:7px}.onboarding-workspace [class~="pl-3"]{padding-left:.75rem}.onboarding-workspace [class~="pr-9"]{padding-right:2.25rem}
.onboarding-workspace [class~="m-0"]{margin:0}.onboarding-workspace [class~="mx-auto"]{margin-left:auto;margin-right:auto}.onboarding-workspace [class~="ml-1"]{margin-left:.25rem}.onboarding-workspace [class~="mt-0.5"]{margin-top:.125rem}.onboarding-workspace [class~="mt-1"]{margin-top:.25rem}.onboarding-workspace [class~="mt-1.5"]{margin-top:.375rem}.onboarding-workspace [class~="mt-2"]{margin-top:.5rem}.onboarding-workspace [class~="mt-3"]{margin-top:.75rem}.onboarding-workspace [class~="mt-4"]{margin-top:1rem}.onboarding-workspace [class~="mt-5"]{margin-top:1.25rem}.onboarding-workspace [class~="mb-1.5"]{margin-bottom:.375rem}.onboarding-workspace [class~="mb-2"]{margin-bottom:.5rem}.onboarding-workspace [class~="mb-2.5"]{margin-bottom:.625rem}.onboarding-workspace [class~="mb-3"]{margin-bottom:.75rem}.onboarding-workspace [class~="mb-4"]{margin-bottom:1rem}.onboarding-workspace [class~="mb-[7px]"]{margin-bottom:7px}
.onboarding-workspace [class~="rounded"]{border-radius:.25rem}.onboarding-workspace [class~="rounded-lg"]{border-radius:.5rem}.onboarding-workspace [class~="rounded-xl"]{border-radius:.75rem}.onboarding-workspace [class~="rounded-2xl"]{border-radius:1rem}.onboarding-workspace [class~="rounded-3xl"]{border-radius:1.5rem}.onboarding-workspace [class~="rounded-full"]{border-radius:9999px}.onboarding-workspace [class~="rounded-[10px]"]{border-radius:10px}.onboarding-workspace [class~="rounded-[11px]"]{border-radius:11px}.onboarding-workspace [class~="rounded-[12px]"]{border-radius:12px}.onboarding-workspace [class~="rounded-[13px]"]{border-radius:13px}.onboarding-workspace [class~="rounded-[15px]"]{border-radius:15px}.onboarding-workspace [class~="rounded-[18px]"]{border-radius:18px}
.onboarding-workspace [class~="border"]{border-width:1px;border-style:solid}.onboarding-workspace [class~="border-0"]{border:0}.onboarding-workspace [class~="border-b"]{border-bottom-width:1px;border-bottom-style:solid}.onboarding-workspace [class~="border-t"]{border-top-width:1px;border-top-style:solid}.onboarding-workspace [class~="border-dashed"]{border-style:dashed}.onboarding-workspace [class~="border-slate-200"]{border-color:#e5e7eb}.onboarding-workspace [class~="border-slate-300"]{border-color:#d1d5db}.onboarding-workspace [class~="border-[#b7dec7]"]{border-color:#b7dec7}.onboarding-workspace [class~="border-[#b9dfcf]"]{border-color:#b9dfcf}.onboarding-workspace [class~="border-[#cdb2e2]"]{border-color:#cdb2e2}.onboarding-workspace [class~="border-[#cde5d6]"]{border-color:#cde5d6}.onboarding-workspace [class~="border-[#d9c5e8]"]{border-color:#d9c5e8}.onboarding-workspace [class~="border-[#e5d9ef]"]{border-color:#e5d9ef}.onboarding-workspace [class~="border-[#e8daf2]"]{border-color:#e8daf2}.onboarding-workspace [class~="border-[#ead0d0]"]{border-color:#ead0d0}.onboarding-workspace [class~="border-[#ead7af]"]{border-color:#ead7af}.onboarding-workspace [class~="border-[#eadff2]"]{border-color:#eadff2}.onboarding-workspace [class~="border-[#f2caca]"]{border-color:#f2caca}
.onboarding-workspace [class~="bg-white"]{background:#fff}.onboarding-workspace [class~="bg-transparent"]{background:transparent}.onboarding-workspace [class~="bg-slate-50"]{background:#f8fafc}.onboarding-workspace [class~="bg-slate-100"]{background:#f1f5f9}.onboarding-workspace [class~="bg-[#6e5084]"]{background:#6e5084}.onboarding-workspace [class~="bg-[#eee7f3]"]{background:#eee7f3}.onboarding-workspace [class~="bg-[#f5fff9]"]{background:#f5fff9}.onboarding-workspace [class~="bg-[#f7f1fc]"]{background:#f7f1fc}.onboarding-workspace [class~="bg-[#fcf9fe]"]{background:#fcf9fe}.onboarding-workspace [class~="bg-[#fff7f7]"]{background:#fff7f7}.onboarding-workspace [class~="bg-[#fffaf0]"]{background:#fffaf0}.onboarding-workspace [class~="bg-slate-950/30"]{background:rgba(2,6,23,.3)}.onboarding-workspace [class~="bg-slate-950/40"]{background:rgba(2,6,23,.4)}.onboarding-workspace [class~="bg-gradient-to-br"]{background-image:linear-gradient(135deg,#f7f1fc 0%,#fff 100%)}
.onboarding-workspace [class~="text-left"]{text-align:left}.onboarding-workspace [class~="text-center"]{text-align:center}.onboarding-workspace [class~="text-xs"]{font-size:.75rem}.onboarding-workspace [class~="text-sm"]{font-size:.875rem}.onboarding-workspace [class~="text-base"]{font-size:1rem}.onboarding-workspace [class~="text-lg"]{font-size:1.125rem}.onboarding-workspace [class~="text-xl"]{font-size:1.25rem}.onboarding-workspace [class~="text-3xl"]{font-size:1.875rem}.onboarding-workspace [class~="text-[10px]"]{font-size:10px}.onboarding-workspace [class~="text-[11px]"]{font-size:11px}.onboarding-workspace [class~="text-[13px]"]{font-size:13px}.onboarding-workspace [class~="text-[25px]"]{font-size:25px}.onboarding-workspace [class~="text-[30px]"]{font-size:30px}.onboarding-workspace [class~="font-medium"]{font-weight:500}.onboarding-workspace [class~="font-semibold"]{font-weight:600}.onboarding-workspace [class~="font-bold"]{font-weight:700}.onboarding-workspace [class~="font-extrabold"]{font-weight:800}.onboarding-workspace [class~="uppercase"]{text-transform:uppercase}.onboarding-workspace [class~="tracking-tight"]{letter-spacing:-.025em}.onboarding-workspace [class~="tracking-wide"]{letter-spacing:.025em}.onboarding-workspace [class~="tracking-[0.08em]"]{letter-spacing:.08em}.onboarding-workspace [class~="leading-5"]{line-height:1.25rem}.onboarding-workspace [class~="leading-6"]{line-height:1.5rem}.onboarding-workspace [class~="leading-[1.15]"]{line-height:1.15}.onboarding-workspace [class~="leading-[1.55]"]{line-height:1.55}.onboarding-workspace [class~="leading-[1.6]"]{line-height:1.6}
.onboarding-workspace [class~="text-white"]{color:#fff}.onboarding-workspace [class~="text-slate-400"]{color:#94a3b8}.onboarding-workspace [class~="text-slate-500"]{color:#64748b}.onboarding-workspace [class~="text-slate-600"]{color:#475569}.onboarding-workspace [class~="text-slate-700"]{color:#334155}.onboarding-workspace [class~="text-slate-800"]{color:#1e293b}.onboarding-workspace [class~="text-slate-900"]{color:#0f172a}.onboarding-workspace [class~="text-slate-950"]{color:#020617}.onboarding-workspace [class~="text-[#276749]"]{color:#276749}.onboarding-workspace [class~="text-[#285f4a]"]{color:#285f4a}.onboarding-workspace [class~="text-[#6e5084]"]{color:#6e5084}.onboarding-workspace [class~="text-[#7a5c1e]"]{color:#7a5c1e}.onboarding-workspace [class~="text-[#7b3f3f]"]{color:#7b3f3f}.onboarding-workspace [class~="text-[#8a2e2e]"]{color:#8a2e2e}
.onboarding-workspace [class~="truncate"]{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.onboarding-workspace [class~="whitespace-nowrap"]{white-space:nowrap}.onboarding-workspace [class~="whitespace-pre-wrap"]{white-space:pre-wrap}.onboarding-workspace [class~="break-words"]{overflow-wrap:break-word}.onboarding-workspace [class~="shrink-0"]{flex-shrink:0}.onboarding-workspace [class~="pointer-events-none"]{pointer-events:none}.onboarding-workspace [class~="appearance-none"]{appearance:none}.onboarding-workspace [class~="outline-none"]{outline:none}.onboarding-workspace [class~="resize-y"]{resize:vertical}.onboarding-workspace [class~="shadow-2xl"]{box-shadow:0 25px 50px -12px rgba(0,0,0,.25)}.onboarding-workspace [class~="transition"],.onboarding-workspace [class~="transition-all"]{transition:all .15s ease}.onboarding-workspace [class~="animate-spin"]{animation:onboarding-spin 1s linear infinite}@keyframes onboarding-spin{to{transform:rotate(360deg)}}
.onboarding-workspace [class~="hover:bg-[#5f4574]"]:hover{background:#5f4574}.onboarding-workspace [class~="hover:bg-[#efe4f7]"]:hover{background:#efe4f7}.onboarding-workspace [class~="hover:bg-[#f7f1fc]"]:hover{background:#f7f1fc}.onboarding-workspace [class~="hover:bg-slate-100"]:hover{background:#f1f5f9}.onboarding-workspace [class~="hover:bg-white"]:hover{background:#fff}.onboarding-workspace [class~="hover:border-[#cdb2e2]"]:hover{border-color:#cdb2e2}.onboarding-workspace [class~="hover:text-[#6e5084]"]:hover{color:#6e5084}.onboarding-workspace [class~="hover:underline"]:hover{text-decoration:underline}.onboarding-workspace [class~="disabled:opacity-60"]:disabled{opacity:.6}
.onboarding-workspace input,.onboarding-workspace select,.onboarding-workspace textarea{min-height:40px}.onboarding-workspace textarea{padding-top:.625rem;padding-bottom:.625rem}
@media(min-width:640px){.onboarding-workspace [class~="sm:grid-cols-2"]{grid-template-columns:repeat(2,minmax(0,1fr))}.onboarding-workspace [class~="sm:flex-row"]{flex-direction:row}.onboarding-workspace [class~="sm:items-start"]{align-items:flex-start}.onboarding-workspace [class~="sm:justify-between"]{justify-content:space-between}.onboarding-workspace [class~="sm:col-span-2"]{grid-column:span 2/span 2}}
@media(min-width:1024px){.onboarding-workspace [class~="lg:flex-row"]{flex-direction:row}.onboarding-workspace [class~="lg:items-start"]{align-items:flex-start}.onboarding-workspace [class~="lg:justify-between"]{justify-content:space-between}.onboarding-workspace [class~="lg:grid-cols-2"]{grid-template-columns:repeat(2,minmax(0,1fr))}.onboarding-workspace [class~="lg:grid-cols-3"]{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(min-width:1280px){.onboarding-workspace [class~="xl:grid-cols-4"]{grid-template-columns:repeat(4,minmax(0,1fr))}.onboarding-workspace [class~="xl:grid-cols-[minmax(270px,340px)_minmax(0,1fr)]"]{grid-template-columns:minmax(270px,340px) minmax(0,1fr)}}
@media(max-width:1279px){.onboarding-workspace [class~="xl:grid-cols-[minmax(270px,340px)_minmax(0,1fr)]"]{grid-template-columns:1fr}.onboarding-workspace aside[class~="sticky"]{position:static;max-height:none}}
`;

export default function OnboardingWorkspace() {
  const [onboardingRecords, setOnboardingRecords] = useState<
    OnboardingRecord[]
  >([]);
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | OnboardingStatus
  >("all");
  const [showArchived, setShowArchived] = useState(false);

  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [selectedOnboardingId, setSelectedOnboardingId] = useState<
    string | null
  >(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [createForm, setCreateForm] =
    useState<CreateOnboardingForm>(initialCreateForm);
  const [taskForm, setTaskForm] =
    useState<TaskForm>(initialTaskForm);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [
        onboardingResult,
        tasksResult,
        offersResult,
        applicationsResult,
        candidatesResult,
        vacanciesResult,
      ] = await Promise.all([
        supabase
          .from("leo_talent_onboarding")
          .select("*")
          .order("updated_at", { ascending: false }),
        supabase
          .from("leo_talent_onboarding_tasks")
          .select("*")
          .order("display_order", { ascending: true }),
        supabase
          .from("leo_talent_offers")
          .select(
            "id, application_id, vacancy_id, candidate_id, status, job_title, department, location_name, manager_name, manager_user_id, employment_type, proposed_start_date, hours_per_week, work_pattern, salary_amount, salary_currency, probation_months, accepted_at, archived_at"
          )
          .is("archived_at", null),
        supabase
          .from("leo_talent_applications")
          .select(
            "id, vacancy_id, candidate_id, status, current_stage_key"
          )
          .is("archived_at", null),
        supabase
          .from("leo_talent_candidates")
          .select(
            "id, first_name, last_name, preferred_name, email, phone"
          )
          .is("archived_at", null),
        supabase
          .from("leo_talent_vacancies")
          .select(
            "id, title, department, location_name, hiring_manager_name, hiring_manager_user_id, employment_type, work_pattern, hours_per_week"
          )
          .is("archived_at", null),
      ]);

      if (onboardingResult.error) throw onboardingResult.error;
      if (tasksResult.error) throw tasksResult.error;
      if (offersResult.error) throw offersResult.error;
      if (applicationsResult.error) throw applicationsResult.error;
      if (candidatesResult.error) throw candidatesResult.error;
      if (vacanciesResult.error) throw vacanciesResult.error;

      setOnboardingRecords(
        (onboardingResult.data ?? []) as OnboardingRecord[]
      );
      setTasks((tasksResult.data ?? []) as OnboardingTask[]);
      setOffers((offersResult.data ?? []) as Offer[]);
      setApplications(
        (applicationsResult.data ?? []) as Application[]
      );
      setCandidates((candidatesResult.data ?? []) as Candidate[]);
      setVacancies((vacanciesResult.data ?? []) as Vacancy[]);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Leo Talent could not load the onboarding workspace."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [notice]);

  const candidateMap = useMemo(() => {
    return new Map(
      candidates.map((candidate) => [candidate.id, candidate])
    );
  }, [candidates]);

  const vacancyMap = useMemo(() => {
    return new Map(
      vacancies.map((vacancy) => [vacancy.id, vacancy])
    );
  }, [vacancies]);

  const applicationMap = useMemo(() => {
    return new Map(
      applications.map((application) => [
        application.id,
        application,
      ])
    );
  }, [applications]);

  const taskMap = useMemo(() => {
    const grouped = new Map<string, OnboardingTask[]>();

    for (const task of tasks) {
      const current = grouped.get(task.onboarding_id) ?? [];
      current.push(task);
      grouped.set(task.onboarding_id, current);
    }

    return grouped;
  }, [tasks]);

  const starterOptions = useMemo<StarterOption[]>(() => {
    const existingOfferIds = new Set(
      onboardingRecords
        .filter((record) => !record.archived_at && record.offer_id)
        .map((record) => record.offer_id as string)
    );

    return offers
      .filter((offer) => {
        return (
          offer.status === "accepted" &&
          !offer.archived_at &&
          !existingOfferIds.has(offer.id)
        );
      })
      .map((offer) => {
        const candidate = candidateMap.get(offer.candidate_id);
        const vacancy = vacancyMap.get(offer.vacancy_id);

        if (!candidate) return null;

        return {
          offer,
          candidate,
          vacancy: vacancy ?? null,
          candidateName: `${
            candidate.preferred_name || candidate.first_name
          } ${candidate.last_name}`,
        };
      })
      .filter(
        (option): option is StarterOption => option !== null
      )
      .sort((a, b) =>
        a.candidateName.localeCompare(b.candidateName)
      );
  }, [
    offers,
    onboardingRecords,
    candidateMap,
    vacancyMap,
  ]);

  const onboardingViews = useMemo<OnboardingView[]>(() => {
    return onboardingRecords.map((record) => {
      const recordTasks = (taskMap.get(record.id) ?? []).filter(
        (task) => !task.archived_at
      );

      const includedTasks = recordTasks.filter(
        (task) => task.status !== "not_required"
      );

      const completedTaskCount = includedTasks.filter(
        (task) => task.status === "completed"
      ).length;

      const mandatoryTasks = includedTasks.filter(
        (task) => task.is_mandatory
      );

      const completedMandatoryTaskCount = mandatoryTasks.filter(
        (task) => task.status === "completed"
      ).length;

      const overdueTaskCount = includedTasks.filter(
        (task) =>
          task.status !== "completed" &&
          task.status !== "not_required" &&
          isPastDate(task.due_date)
      ).length;

      const blockedTaskCount = includedTasks.filter(
        (task) => task.status === "blocked"
      ).length;

      const progress =
        includedTasks.length === 0
          ? 0
          : Math.round(
              (completedTaskCount / includedTasks.length) * 100
            );

      return {
        ...record,
        fullName: `${record.preferred_name || record.first_name} ${
          record.last_name
        }`,
        taskCount: includedTasks.length,
        completedTaskCount,
        mandatoryTaskCount: mandatoryTasks.length,
        completedMandatoryTaskCount,
        overdueTaskCount,
        blockedTaskCount,
        progress,
      };
    });
  }, [onboardingRecords, taskMap]);

  const selectedOnboarding = useMemo(() => {
    if (!selectedOnboardingId) return null;

    return (
      onboardingViews.find(
        (record) => record.id === selectedOnboardingId
      ) ?? null
    );
  }, [onboardingViews, selectedOnboardingId]);

  const selectedTasks = useMemo(() => {
    if (!selectedOnboardingId) return [];

    return (taskMap.get(selectedOnboardingId) ?? [])
      .filter((task) => !task.archived_at)
      .sort((a, b) => {
        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order;
        }

        return a.title.localeCompare(b.title);
      });
  }, [taskMap, selectedOnboardingId]);

  const filteredOnboarding = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return onboardingViews.filter((record) => {
      const matchesArchived = showArchived
        ? Boolean(record.archived_at)
        : !record.archived_at;

      const matchesStatus =
        statusFilter === "all" ||
        record.status === statusFilter;

      const matchesSearch =
        !search ||
        record.fullName.toLowerCase().includes(search) ||
        record.job_title.toLowerCase().includes(search) ||
        record.onboarding_reference
          .toLowerCase()
          .includes(search) ||
        record.personal_email?.toLowerCase().includes(search) ||
        record.department?.toLowerCase().includes(search) ||
        record.location_name?.toLowerCase().includes(search) ||
        record.manager_name?.toLowerCase().includes(search);

      return matchesArchived && matchesStatus && matchesSearch;
    });
  }, [
    onboardingViews,
    searchTerm,
    statusFilter,
    showArchived,
  ]);

  const metrics = useMemo(() => {
    const activeRecords = onboardingViews.filter(
      (record) => !record.archived_at
    );

    return {
      active: activeRecords.filter(
        (record) =>
          !["completed", "withdrawn"].includes(record.status)
      ).length,
      startingSoon: activeRecords.filter((record) => {
        if (
          ["completed", "withdrawn"].includes(record.status)
        ) {
          return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const limit = new Date(today);
        limit.setDate(limit.getDate() + 14);

        const startDate = new Date(
          `${record.start_date}T00:00:00`
        );

        return startDate >= today && startDate <= limit;
      }).length,
      overdue: activeRecords.reduce(
        (total, record) => total + record.overdueTaskCount,
        0
      ),
      ready: activeRecords.filter(
        (record) => record.status === "ready_for_first_day"
      ).length,
      completed: activeRecords.filter(
        (record) => record.status === "completed"
      ).length,
    };
  }, [onboardingViews]);

  function updateCreateForm<
    K extends keyof CreateOnboardingForm
  >(field: K, value: CreateOnboardingForm[K]) {
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateTaskForm<K extends keyof TaskForm>(
    field: K,
    value: TaskForm[K]
  ) {
    setTaskForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetCreatePanel() {
    setCreateForm(initialCreateForm);
    setShowCreatePanel(false);
  }

  function resetTaskPanel() {
    setTaskForm(initialTaskForm);
    setShowTaskPanel(false);
  }

  function handleOfferSelection(offerId: string) {
    const option = starterOptions.find(
      (starter) => starter.offer.id === offerId
    );

    if (!option) {
      updateCreateForm("offer_id", offerId);
      return;
    }

    const { offer, candidate, vacancy } = option;

    setCreateForm((current) => ({
      ...current,
      offer_id: offer.id,
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      preferred_name: candidate.preferred_name ?? "",
      personal_email: candidate.email ?? "",
      phone: candidate.phone ?? "",
      job_title: offer.job_title || vacancy?.title || "",
      department:
        offer.department ?? vacancy?.department ?? "",
      location_name:
        offer.location_name ?? vacancy?.location_name ?? "",
      manager_name:
        offer.manager_name ??
        vacancy?.hiring_manager_name ??
        "",
      manager_user_id:
        offer.manager_user_id ??
        vacancy?.hiring_manager_user_id ??
        "",
      employment_type:
        offer.employment_type ??
        vacancy?.employment_type ??
        "permanent",
      start_date: offer.proposed_start_date ?? "",
      hours_per_week:
        offer.hours_per_week !== null
          ? String(offer.hours_per_week)
          : vacancy?.hours_per_week !== null &&
            vacancy?.hours_per_week !== undefined
          ? String(vacancy.hours_per_week)
          : "",
      work_pattern:
        offer.work_pattern ?? vacancy?.work_pattern ?? "",
      salary_amount:
        offer.salary_amount !== null
          ? String(offer.salary_amount)
          : "",
      salary_currency: offer.salary_currency ?? "GBP",
      probation_months:
        offer.probation_months !== null
          ? String(offer.probation_months)
          : "3",
    }));
  }

  function validateCreateForm(): string | null {
    if (!createForm.offer_id) {
      return "Select an accepted offer.";
    }

    if (!createForm.first_name.trim()) {
      return "Enter the starter's first name.";
    }

    if (!createForm.last_name.trim()) {
      return "Enter the starter's last name.";
    }

    if (!createForm.job_title.trim()) {
      return "Enter the job title.";
    }

    if (!createForm.start_date) {
      return "Enter the agreed start date.";
    }

    if (
      createForm.end_date &&
      createForm.end_date < createForm.start_date
    ) {
      return "The employment end date cannot be before the start date.";
    }

    if (
      createForm.probation_months &&
      Number(createForm.probation_months) > 6
    ) {
      return "Probation cannot be recorded as longer than six months.";
    }

    return null;
  }

  function buildStarterTasks(
    onboardingId: string,
    startDate: string
  ) {
    return defaultTaskTemplates
      .filter((template) => {
        if (!template.conditionalKey) return true;

        switch (template.conditionalKey) {
          case "dbs":
            return createForm.include_dbs;
          case "equipment":
            return createForm.include_equipment;
          case "systems":
            return createForm.include_systems;
          case "learning":
            return createForm.include_learning;
          default:
            return true;
        }
      })
      .map((template, index) => ({
        organisation_id: null,
        onboarding_id: onboardingId,
        category: template.category,
        title: template.title,
        description: template.description,
        owner_type: template.owner_type,
        owner_name:
          template.owner_type === "manager"
            ? createForm.manager_name.trim() || null
            : null,
        due_date: addDays(startDate, template.dueOffsetDays),
        status: "not_started" as TaskStatus,
        is_mandatory: template.isMandatory,
        evidence_required: template.evidenceRequired,
        display_order: index + 1,
      }));
  }

  async function createOnboarding() {
    const validationError = validateCreateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const option = starterOptions.find(
      (starter) =>
        starter.offer.id === createForm.offer_id
    );

    if (!option) {
      setError(
        "The accepted offer could not be found or already has an onboarding record."
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const application =
        applicationMap.get(option.offer.application_id) ??
        null;

      const now = new Date().toISOString();

      const { data: onboardingData, error: onboardingError } =
        await supabase
          .from("leo_talent_onboarding")
          .insert({
            organisation_id: null,
            offer_id: option.offer.id,
            application_id: option.offer.application_id,
            vacancy_id: option.offer.vacancy_id,
            candidate_id: option.offer.candidate_id,
            employee_id: null,
            status: "pre_start",
            priority: createForm.priority,
            first_name: createForm.first_name.trim(),
            last_name: createForm.last_name.trim(),
            preferred_name:
              createForm.preferred_name.trim() || null,
            personal_email:
              createForm.personal_email.trim() || null,
            work_email: null,
            phone: createForm.phone.trim() || null,
            job_title: createForm.job_title.trim(),
            department:
              createForm.department.trim() || null,
            location_name:
              createForm.location_name.trim() || null,
            manager_name:
              createForm.manager_name.trim() || null,
            manager_user_id:
              createForm.manager_user_id || null,
            employment_type: createForm.employment_type,
            start_date: createForm.start_date,
            end_date: createForm.end_date || null,
            hours_per_week: createForm.hours_per_week
              ? Number(createForm.hours_per_week)
              : null,
            work_pattern:
              createForm.work_pattern.trim() || null,
            salary_amount: createForm.salary_amount
              ? Number(createForm.salary_amount)
              : null,
            salary_currency:
              createForm.salary_currency || "GBP",
            probation_months: createForm.probation_months
              ? Number(createForm.probation_months)
              : null,
          })
          .select("*")
          .single();

      if (onboardingError) throw onboardingError;

      const newOnboarding =
        onboardingData as OnboardingRecord;

      const generatedTasks = buildStarterTasks(
        newOnboarding.id,
        createForm.start_date
      );

      const { data: createdTasks, error: tasksError } =
        await supabase
          .from("leo_talent_onboarding_tasks")
          .insert(generatedTasks)
          .select("*");

      if (tasksError) {
        await supabase
          .from("leo_talent_onboarding")
          .delete()
          .eq("id", newOnboarding.id);

        throw tasksError;
      }

      if (application) {
        const { error: applicationError } = await supabase
          .from("leo_talent_applications")
          .update({
            status: "onboarding",
            current_stage_key: "onboarding",
            updated_at: now,
          })
          .eq("id", application.id);

        if (applicationError) throw applicationError;
      }

      setOnboardingRecords((current) => [
        newOnboarding,
        ...current,
      ]);

      setTasks((current) => [
        ...current,
        ...((createdTasks ?? []) as OnboardingTask[]),
      ]);

      setApplications((current) =>
        current.map((item) =>
          item.id === option.offer.application_id
            ? {
                ...item,
                status: "onboarding",
                current_stage_key: "onboarding",
              }
            : item
        )
      );

      resetCreatePanel();
      setSelectedOnboardingId(newOnboarding.id);
      setDetailsOpen(true);
      setNotice(
        "Onboarding record created with the complete starter checklist."
      );
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "The onboarding record could not be created."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateOnboarding(
    record: OnboardingRecord,
    changes: Partial<OnboardingRecord>,
    successMessage: string
  ) {
    setActionId(record.id);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from("leo_talent_onboarding")
        .update({
          ...changes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id)
        .select("*")
        .single();

      if (updateError) throw updateError;

      setOnboardingRecords((current) =>
        current.map((item) =>
          item.id === record.id
            ? (data as OnboardingRecord)
            : item
        )
      );

      setNotice(successMessage);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "The onboarding record could not be updated."
      );
    } finally {
      setActionId(null);
    }
  }

  async function updateTask(
    task: OnboardingTask,
    changes: Partial<OnboardingTask>,
    successMessage?: string
  ) {
    setActionId(task.id);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from("leo_talent_onboarding_tasks")
        .update({
          ...changes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id)
        .select("*")
        .single();

      if (updateError) throw updateError;

      const updatedTask = data as OnboardingTask;

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? updatedTask : item
        )
      );

      if (successMessage) {
        setNotice(successMessage);
      }
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "The onboarding task could not be updated."
      );
    } finally {
      setActionId(null);
    }
  }

  async function changeTaskStatus(
    task: OnboardingTask,
    status: TaskStatus
  ) {
    const now = new Date().toISOString();

    await updateTask(
      task,
      {
        status,
        completed_at:
          status === "completed" ? now : null,
        completed_by:
          status === "completed"
            ? task.owner_name ||
              ownerTypeLabels[task.owner_type]
            : null,
      },
      status === "completed"
        ? "Task completed."
        : "Task status updated."
    );

    if (!selectedOnboarding) return;

    const updatedTasks = selectedTasks.map((item) =>
      item.id === task.id
        ? {
            ...item,
            status,
            completed_at:
              status === "completed" ? now : null,
          }
        : item
    );

    const requiredTasks = updatedTasks.filter(
      (item) =>
        item.is_mandatory &&
        item.status !== "not_required"
    );

    const allMandatoryComplete =
      requiredTasks.length > 0 &&
      requiredTasks.every(
        (item) => item.status === "completed"
      );

    if (
      allMandatoryComplete &&
      selectedOnboarding.status === "pre_start"
    ) {
      await updateOnboarding(
        selectedOnboarding,
        {
          status: "ready_for_first_day",
        },
        "All mandatory pre-start actions are complete. The starter is ready for their first day."
      );
    }
  }

  async function createCustomTask() {
    if (!selectedOnboarding) {
      setError("Select an onboarding record first.");
      return;
    }

    if (!taskForm.title.trim()) {
      setError("Enter a task title.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const currentTasks =
        taskMap.get(selectedOnboarding.id) ?? [];

      const highestOrder = currentTasks.reduce(
        (highest, task) =>
          Math.max(highest, task.display_order),
        0
      );

      const { data, error: insertError } = await supabase
        .from("leo_talent_onboarding_tasks")
        .insert({
          organisation_id: null,
          onboarding_id: selectedOnboarding.id,
          category: taskForm.category,
          title: taskForm.title.trim(),
          description:
            taskForm.description.trim() || null,
          owner_type: taskForm.owner_type,
          owner_name:
            taskForm.owner_name.trim() || null,
          due_date: taskForm.due_date || null,
          status: "not_started",
          is_mandatory: taskForm.is_mandatory,
          evidence_required:
            taskForm.evidence_required,
          display_order: highestOrder + 1,
        })
        .select("*")
        .single();

      if (insertError) throw insertError;

      setTasks((current) => [
        ...current,
        data as OnboardingTask,
      ]);

      resetTaskPanel();
      setNotice("Onboarding task added.");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "The onboarding task could not be created."
      );
    } finally {
      setSaving(false);
    }
  }

  async function markContractIssued(
    record: OnboardingRecord
  ) {
    await updateOnboarding(
      record,
      {
        contract_issued_at: new Date().toISOString(),
      },
      "Contract issue recorded."
    );
  }

  async function markContractSigned(
    record: OnboardingRecord
  ) {
    await updateOnboarding(
      record,
      {
        contract_signed_at: new Date().toISOString(),
      },
      "Signed contract recorded."
    );
  }

  async function markPayrollReady(
    record: OnboardingRecord
  ) {
    await updateOnboarding(
      record,
      {
        payroll_ready_at: new Date().toISOString(),
      },
      "Payroll readiness recorded."
    );
  }

  async function markEquipmentReady(
    record: OnboardingRecord
  ) {
    await updateOnboarding(
      record,
      {
        equipment_ready_at: new Date().toISOString(),
      },
      "Equipment readiness recorded."
    );
  }

  async function markSystemsReady(
    record: OnboardingRecord
  ) {
    await updateOnboarding(
      record,
      {
        systems_ready_at: new Date().toISOString(),
      },
      "System access readiness recorded."
    );
  }

  async function startFirstDay(
    record: OnboardingRecord
  ) {
    await updateOnboarding(
      record,
      {
        status: "in_progress",
        first_day_confirmed_at: new Date().toISOString(),
      },
      "First day confirmed and onboarding moved into progress."
    );
  }

  async function moveToFirstWeek(
    record: OnboardingRecord
  ) {
    await updateOnboarding(
      record,
      {
        status: "first_week",
      },
      "Onboarding moved to the first-week stage."
    );
  }

  async function moveToFirstMonth(
    record: OnboardingRecord
  ) {
    await updateOnboarding(
      record,
      {
        status: "first_month",
      },
      "Onboarding moved to the first-month stage."
    );
  }

  async function completeOnboarding(
    record: OnboardingView
  ) {
    const incompleteMandatory =
      record.mandatoryTaskCount -
      record.completedMandatoryTaskCount;

    if (incompleteMandatory > 0) {
      setError(
        `${incompleteMandatory} mandatory onboarding ${
          incompleteMandatory === 1 ? "task is" : "tasks are"
        } still incomplete.`
      );
      return;
    }

    const notes = window.prompt(
      "Add any final onboarding or probation handover notes:"
    );

    if (notes === null) return;

    const confirmed = window.confirm(
      "Complete onboarding and hand the starter into probation?"
    );

    if (!confirmed) return;

    await updateOnboarding(
      record,
      {
        status: "completed",
        completed_at: new Date().toISOString(),
        probation_handover_at: new Date().toISOString(),
        completion_notes: notes.trim() || null,
      },
      "Onboarding completed and handed into probation."
    );
  }

  async function pauseOnboarding(
    record: OnboardingRecord
  ) {
    const reason = window.prompt(
      "Enter the reason onboarding is being paused:"
    );

    if (reason === null) return;

    if (!reason.trim()) {
      setError("A pause reason is required.");
      return;
    }

    await updateOnboarding(
      record,
      {
        status: "paused",
        paused_at: new Date().toISOString(),
        pause_reason: reason.trim(),
      },
      "Onboarding paused."
    );
  }

  async function resumeOnboarding(
    record: OnboardingRecord
  ) {
    await updateOnboarding(
      record,
      {
        status: isPastDate(record.start_date)
          ? "in_progress"
          : "pre_start",
        paused_at: null,
        pause_reason: null,
      },
      "Onboarding resumed."
    );
  }

  async function withdrawOnboarding(
    record: OnboardingRecord
  ) {
    const reason = window.prompt(
      "Enter the reason this onboarding is being withdrawn:"
    );

    if (reason === null) return;

    if (!reason.trim()) {
      setError("A withdrawal reason is required.");
      return;
    }

    const confirmed = window.confirm(
      "Withdraw this onboarding record? The record and its evidence will remain available."
    );

    if (!confirmed) return;

    await updateOnboarding(
      record,
      {
        status: "withdrawn",
        withdrawn_at: new Date().toISOString(),
        withdrawal_reason: reason.trim(),
      },
      "Onboarding withdrawn."
    );
  }

  async function archiveOnboarding(
    record: OnboardingRecord
  ) {
    const confirmed = window.confirm(
      "Archive this onboarding record? It will remain available in the archived view."
    );

    if (!confirmed) return;

    await updateOnboarding(
      record,
      {
        archived_at: new Date().toISOString(),
      },
      "Onboarding record archived."
    );

    if (selectedOnboardingId === record.id) {
      setSelectedOnboardingId(null);
      setDetailsOpen(false);
    }
  }

  async function restoreOnboarding(
    record: OnboardingRecord
  ) {
    await updateOnboarding(
      record,
      {
        archived_at: null,
      },
      "Onboarding record restored."
    );
  }

  async function archiveTask(task: OnboardingTask) {
    const confirmed = window.confirm(
      "Archive this onboarding task?"
    );

    if (!confirmed) return;

    await updateTask(
      task,
      {
        archived_at: new Date().toISOString(),
      },
      "Task archived."
    );
  }

  function exportOnboarding() {
    const headers = [
      "Onboarding reference",
      "Starter",
      "Job title",
      "Department",
      "Location",
      "Manager",
      "Start date",
      "Status",
      "Priority",
      "Progress",
      "Completed tasks",
      "Total tasks",
      "Overdue tasks",
      "Contract issued",
      "Contract signed",
      "Payroll ready",
      "Equipment ready",
      "Systems ready",
      "Completed",
    ];

    const rows = filteredOnboarding.map((record) => [
      record.onboarding_reference,
      record.fullName,
      record.job_title,
      record.department ?? "",
      record.location_name ?? "",
      record.manager_name ?? "",
      record.start_date,
      onboardingStatusLabels[record.status],
      priorityLabels[record.priority],
      `${record.progress}%`,
      record.completedTaskCount,
      record.taskCount,
      record.overdueTaskCount,
      record.contract_issued_at ?? "",
      record.contract_signed_at ?? "",
      record.payroll_ready_at ?? "",
      record.equipment_ready_at ?? "",
      record.systems_ready_at ?? "",
      record.completed_at ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replaceAll('"', '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `leo-talent-onboarding-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    setNotice("Current onboarding view exported.");
  }
  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-[18px] border border-slate-200 bg-white">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-[#6e5084]" />
          <strong>Loading onboarding…</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-workspace w-full text-slate-900">
      <style>{onboardingWorkspaceCss}</style>
      <header className="mb-4 flex flex-col items-start justify-between gap-5 rounded-[18px] border border-slate-200 bg-white p-6 lg:flex-row">
        <div>
          <p className="mb-[7px] text-xs font-extrabold uppercase tracking-[0.08em] text-[#6e5084]">
            LEO TALENT
          </p>
          <h1 className="m-0 text-[30px] font-semibold leading-[1.15] text-slate-950">
            Onboarding
          </h1>
          <p className="mt-2 max-w-[780px] text-sm leading-[1.6] text-slate-500">
            Prepare every new starter from accepted offer through pre-start, first day,
            first week and first month in one connected workspace.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => void loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-slate-300 bg-white px-[13px] py-2.5 text-sm font-bold text-slate-700 hover:border-[#cdb2e2] hover:text-[#6e5084] disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={exportOnboarding}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-slate-300 bg-white px-[13px] py-2.5 text-sm font-bold text-slate-700 hover:border-[#cdb2e2] hover:text-[#6e5084]"
          >
            <Download className="h-4 w-4" />
            Export current view
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-3 flex items-start justify-between gap-3 rounded-[11px] border border-[#f2caca] bg-[#fff7f7] px-4 py-3 text-sm text-[#8a2e2e]">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="rounded-lg p-1 hover:bg-white" aria-label="Dismiss error">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {notice && (
        <div className="mb-3 flex items-start gap-3 rounded-[11px] border border-[#cde5d6] bg-[#f5fff9] px-4 py-3 text-sm text-[#276749]">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <section className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        <MetricCard label="Active onboarding" value={metrics.active} />
        <MetricCard label="Starting in 14 days" value={metrics.startingSoon} />
        <MetricCard label="Overdue tasks" value={metrics.overdue} />
        <MetricCard label="Ready for first day" value={metrics.ready} />
        <MetricCard label="Completed" value={metrics.completed} />
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(270px,340px)_minmax(0,1fr)]">
        <aside className="sticky top-4 max-h-[calc(100vh-32px)] overflow-auto rounded-[18px] border border-slate-200 bg-white p-4">
          <div className="mb-4">
            <h2 className="m-0 text-lg font-semibold text-slate-950">Starter journeys</h2>
            <p className="mt-1 text-sm leading-[1.55] text-slate-500">
              Select an onboarding record or begin one for an accepted candidate.
            </p>
          </div>

          <div className="mb-3 rounded-[13px] border border-[#e8daf2] bg-[#f7f1fc] p-[13px]">
            <label className="mb-1.5 block text-[13px] font-bold text-slate-700">
              Create onboarding for
            </label>
            <select
              value=""
              onChange={(event) => {
                handleOfferSelection(event.target.value);
                setShowCreatePanel(true);
              }}
              className="w-full rounded-[10px] border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#a983c2] focus:ring-4 focus:ring-[#f7f1fc]"
            >
              <option value="">Select accepted candidate</option>
              {starterOptions.map((option) => (
                <option key={option.offer.id} value={option.offer.id}>
                  {option.candidateName} · {option.offer.job_title}
                </option>
              ))}
            </select>
            {starterOptions.length === 0 && (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                No accepted offers are currently ready for onboarding.
              </p>
            )}
          </div>

          <label className="mb-2.5 flex items-center gap-2 rounded-[10px] border border-slate-300 px-2.5">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search starter or role"
              className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="mb-3 grid grid-cols-[1fr_auto] gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "all" | OnboardingStatus)}
                className="w-full appearance-none rounded-[10px] border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-[#a983c2] focus:ring-4 focus:ring-[#f7f1fc]"
              >
                <option value="all">Active journeys</option>
                {Object.entries(onboardingStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <button
              type="button"
              onClick={() => setShowArchived((current) => !current)}
              className={`rounded-[10px] border px-3 py-2.5 text-sm font-bold ${
                showArchived
                  ? "border-[#cdb2e2] bg-[#f7f1fc] text-[#6e5084]"
                  : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              {showArchived ? "Current" : "Archived"}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {filteredOnboarding.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-3 py-6 text-center text-sm text-slate-500">
                <UserCheck className="h-6 w-6 text-[#6e5084]" />
                <strong className="text-slate-800">No onboarding records match this view</strong>
                <span>Create onboarding from an accepted offer or adjust the filters.</span>
              </div>
            ) : (
              filteredOnboarding.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => setSelectedOnboardingId(record.id)}
                  className={`flex w-full flex-col gap-1 rounded-[12px] border p-[13px] text-left text-slate-600 transition ${
                    record.id === selectedOnboardingId
                      ? "border-[#cdb2e2] bg-[#f7f1fc]"
                      : "border-slate-200 bg-white hover:border-[#cdb2e2]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-slate-950">
                    <strong className="min-w-0 truncate text-sm">{record.fullName}</strong>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">
                      {onboardingStatusLabels[record.status]}
                    </span>
                  </div>
                  <span className="truncate text-sm">{record.job_title}</span>
                  <small>{formatDate(record.start_date)} · {record.progress}% complete</small>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="flex min-w-0 flex-col gap-4">
          {!selectedOnboarding ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[18px] border border-slate-200 bg-white p-8 text-center text-slate-500">
              <Sparkles className="h-7 w-7 text-[#6e5084]" />
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Select or create onboarding</h2>
              <p className="mt-2 max-w-lg text-sm leading-6">
                The complete starter journey will appear here.
              </p>
            </div>
          ) : (
            <>
              <section className="flex flex-col items-start justify-between gap-4 rounded-[18px] border border-[#e5d9ef] bg-gradient-to-br from-[#f7f1fc] to-white p-[22px] lg:flex-row">
                <div>
                  <p className="mb-[7px] text-xs font-extrabold uppercase tracking-[0.08em] text-[#6e5084]">
                    STARTER JOURNEY
                  </p>
                  <h2 className="m-0 text-[25px] font-semibold text-slate-950">
                    {selectedOnboarding.fullName}
                  </h2>
                  <p className="mt-2 text-sm leading-[1.6] text-slate-500">
                    {selectedOnboarding.job_title}
                    {selectedOnboarding.department ? ` · ${selectedOnboarding.department}` : ""}
                    {` · Starts ${formatDate(selectedOnboarding.start_date)}`}
                  </p>
                </div>
                <span className="rounded-full border border-[#cdb2e2] bg-white px-3 py-[7px] text-[13px] font-extrabold text-[#6e5084]">
                  {onboardingStatusLabels[selectedOnboarding.status]}
                </span>
              </section>

              <OnboardingJourney status={selectedOnboarding.status} />

              <section className="rounded-[18px] border border-slate-200 bg-white p-[22px]">
                <SectionHeading
                  title="Onboarding overview"
                  description="Keep the starter’s preparation, responsibilities and progress together."
                />

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <OnboardingSummary
                    label="Progress"
                    value={`${selectedOnboarding.progress}%`}
                    detail={`${selectedOnboarding.completedTaskCount} of ${selectedOnboarding.taskCount} tasks complete`}
                  />
                  <OnboardingSummary
                    label="Manager"
                    value={selectedOnboarding.manager_name || "Not recorded"}
                    detail={selectedOnboarding.department || "Department not recorded"}
                  />
                  <OnboardingSummary
                    label="Location"
                    value={selectedOnboarding.location_name || "Not recorded"}
                    detail={employmentTypeLabels[selectedOnboarding.employment_type]}
                  />
                  <OnboardingSummary
                    label="Actions"
                    value={String(selectedOnboarding.overdueTaskCount + selectedOnboarding.blockedTaskCount)}
                    detail={selectedOnboarding.overdueTaskCount ? `${selectedOnboarding.overdueTaskCount} overdue` : "No overdue tasks"}
                  />
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[18px] border border-slate-200 bg-white p-[22px]">
                  <SectionHeading
                    title="Readiness"
                    description="See whether the essential pre-start arrangements are in place."
                  />
                  <div className="space-y-3">
                    <ReadinessRow label="Contract issued" complete={Boolean(selectedOnboarding.contract_issued_at)} />
                    <ReadinessRow label="Contract signed" complete={Boolean(selectedOnboarding.contract_signed_at)} />
                    <ReadinessRow label="Payroll ready" complete={Boolean(selectedOnboarding.payroll_ready_at)} />
                    <ReadinessRow label="Equipment ready" complete={Boolean(selectedOnboarding.equipment_ready_at)} />
                    <ReadinessRow label="Systems ready" complete={Boolean(selectedOnboarding.systems_ready_at)} />
                  </div>
                </div>

                <div className="rounded-[18px] border border-slate-200 bg-white p-[22px]">
                  <SectionHeading
                    title="Task progress"
                    description="Mandatory and outstanding work across the starter journey."
                  />
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <strong>{selectedOnboarding.completedTaskCount} of {selectedOnboarding.taskCount} complete</strong>
                    <span className="font-bold text-[#6e5084]">{selectedOnboarding.progress}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#eee7f3]">
                    <div
                      className="h-full rounded-full bg-[#6e5084]"
                      style={{ width: `${selectedOnboarding.progress}%` }}
                    />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-500">
                    {selectedOnboarding.overdueTaskCount > 0
                      ? `${selectedOnboarding.overdueTaskCount} task${selectedOnboarding.overdueTaskCount === 1 ? " is" : "s are"} overdue.`
                      : "There are no overdue onboarding tasks."}
                  </p>
                </div>
              </section>

              <section className="rounded-[18px] border border-slate-200 bg-white p-[22px]">
                <SectionHeading
                  title="Manage onboarding"
                  description="Open the full record to manage details, readiness checks, documents, tasks and progression."
                />
                <div className="flex flex-wrap justify-end gap-2">
                  {selectedOnboarding.status === "ready_for_first_day" && (
                    <button type="button" onClick={() => void startFirstDay(selectedOnboarding)} className="rounded-[10px] border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700">
                      Confirm first day
                    </button>
                  )}
                  {selectedOnboarding.status === "in_progress" && (
                    <button type="button" onClick={() => void moveToFirstWeek(selectedOnboarding)} className="rounded-[10px] border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700">
                      Move to first week
                    </button>
                  )}
                  {selectedOnboarding.status === "first_week" && (
                    <button type="button" onClick={() => void moveToFirstMonth(selectedOnboarding)} className="rounded-[10px] border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700">
                      Move to first month
                    </button>
                  )}
                  {selectedOnboarding.status === "first_month" && (
                    <button type="button" onClick={() => void completeOnboarding(selectedOnboarding)} className="rounded-[10px] border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700">
                      Complete onboarding
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDetailsOpen(true)}
                    className="inline-flex items-center gap-2 rounded-[10px] border-0 bg-[#6e5084] px-3.5 py-2.5 text-sm font-extrabold text-white hover:bg-[#5f4574]"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    Open onboarding record
                  </button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {showCreatePanel && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30">
          <div className="h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Start onboarding
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create the starter record and generate the full
                  onboarding checklist.
                </p>
              </div>

              <button
                type="button"
                onClick={resetCreatePanel}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close onboarding panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-7 p-6">
              <FormSection
                title="Accepted offer"
                description="Choose the successful candidate moving into onboarding."
              >
                <Field
                  label="Candidate and role"
                  required
                  fullWidth
                >
                  <select
                    value={createForm.offer_id}
                    onChange={(event) =>
                      handleOfferSelection(event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">
                      Select an accepted offer
                    </option>

                    {starterOptions.map((option) => (
                      <option
                        key={option.offer.id}
                        value={option.offer.id}
                      >
                        {option.candidateName} —{" "}
                        {option.offer.job_title}
                      </option>
                    ))}
                  </select>
                </Field>

                {starterOptions.length === 0 && (
                  <div className="col-span-full rounded-xl border border-[#ead7af] bg-[#fffaf0] px-4 py-3 text-sm text-[#7a5c1e]">
                    No accepted offer is currently available for
                    onboarding. The candidate may not yet have accepted,
                    or their onboarding record may already exist.
                  </div>
                )}
              </FormSection>

              <FormSection
                title="Starter details"
                description="Confirm the personal contact information carried forward from recruitment."
              >
                <Field label="First name" required>
                  <input
                    value={createForm.first_name}
                    onChange={(event) =>
                      updateCreateForm(
                        "first_name",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Last name" required>
                  <input
                    value={createForm.last_name}
                    onChange={(event) =>
                      updateCreateForm(
                        "last_name",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Preferred name">
                  <input
                    value={createForm.preferred_name}
                    onChange={(event) =>
                      updateCreateForm(
                        "preferred_name",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Personal email">
                  <input
                    type="email"
                    value={createForm.personal_email}
                    onChange={(event) =>
                      updateCreateForm(
                        "personal_email",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Phone">
                  <input
                    value={createForm.phone}
                    onChange={(event) =>
                      updateCreateForm(
                        "phone",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Priority">
                  <select
                    value={createForm.priority}
                    onChange={(event) =>
                      updateCreateForm(
                        "priority",
                        event.target
                          .value as OnboardingPriority
                      )
                    }
                    className={inputClass}
                  >
                    {Object.entries(priorityLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </Field>
              </FormSection>

              <FormSection
                title="Employment details"
                description="Confirm the agreed role, reporting line and employment arrangements."
              >
                <Field label="Job title" required>
                  <input
                    value={createForm.job_title}
                    onChange={(event) =>
                      updateCreateForm(
                        "job_title",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Employment type">
                  <select
                    value={createForm.employment_type}
                    onChange={(event) =>
                      updateCreateForm(
                        "employment_type",
                        event.target.value as EmploymentType
                      )
                    }
                    className={inputClass}
                  >
                    {Object.entries(employmentTypeLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Department">
                  <input
                    value={createForm.department}
                    onChange={(event) =>
                      updateCreateForm(
                        "department",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Location">
                  <input
                    value={createForm.location_name}
                    onChange={(event) =>
                      updateCreateForm(
                        "location_name",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Manager">
                  <input
                    value={createForm.manager_name}
                    onChange={(event) =>
                      updateCreateForm(
                        "manager_name",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Weekly hours">
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={createForm.hours_per_week}
                    onChange={(event) =>
                      updateCreateForm(
                        "hours_per_week",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Work pattern" fullWidth>
                  <input
                    value={createForm.work_pattern}
                    onChange={(event) =>
                      updateCreateForm(
                        "work_pattern",
                        event.target.value
                      )
                    }
                    placeholder="For example, Monday to Friday"
                    className={inputClass}
                  />
                </Field>
              </FormSection>

              <FormSection
                title="Dates and terms"
                description="Confirm the start date, any fixed end date and the agreed probation period."
              >
                <Field label="Start date" required>
                  <input
                    type="date"
                    value={createForm.start_date}
                    onChange={(event) =>
                      updateCreateForm(
                        "start_date",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Employment end date">
                  <input
                    type="date"
                    value={createForm.end_date}
                    onChange={(event) =>
                      updateCreateForm(
                        "end_date",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Salary">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={createForm.salary_amount}
                    onChange={(event) =>
                      updateCreateForm(
                        "salary_amount",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Currency">
                  <select
                    value={createForm.salary_currency}
                    onChange={(event) =>
                      updateCreateForm(
                        "salary_currency",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </Field>

                <Field label="Probation period">
                  <select
                    value={createForm.probation_months}
                    onChange={(event) =>
                      updateCreateForm(
                        "probation_months",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="">Not recorded</option>
                    <option value="0">No probation</option>
                    <option value="1">1 month</option>
                    <option value="2">2 months</option>
                    <option value="3">3 months</option>
                    <option value="4">4 months</option>
                    <option value="5">5 months</option>
                    <option value="6">6 months</option>
                  </select>
                </Field>
              </FormSection>

              <FormSection
                title="Checklist requirements"
                description="Choose the role-specific tasks that should be included in the generated checklist."
              >
                <ChecklistToggle
                  label="DBS or safeguarding clearance"
                  description="Include DBS, barred-list or safeguarding checks."
                  checked={createForm.include_dbs}
                  onChange={(checked) =>
                    updateCreateForm("include_dbs", checked)
                  }
                />

                <ChecklistToggle
                  label="Equipment preparation"
                  description="Include equipment allocation and readiness tasks."
                  checked={createForm.include_equipment}
                  onChange={(checked) =>
                    updateCreateForm(
                      "include_equipment",
                      checked
                    )
                  }
                />

                <ChecklistToggle
                  label="Systems and account access"
                  description="Include work email, accounts and permission checks."
                  checked={createForm.include_systems}
                  onChange={(checked) =>
                    updateCreateForm(
                      "include_systems",
                      checked
                    )
                  }
                />

                <ChecklistToggle
                  label="Leo Learn assignments"
                  description="Include mandatory learning and development pathway tasks."
                  checked={createForm.include_learning}
                  onChange={(checked) =>
                    updateCreateForm(
                      "include_learning",
                      checked
                    )
                  }
                />
              </FormSection>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                type="button"
                onClick={resetCreatePanel}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-[#cdb2e2] disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void createOnboarding()}
                disabled={saving || !createForm.offer_id}
                className="inline-flex items-center gap-2 rounded-xl bg-[#6e5084] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5f4574] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ClipboardCheck className="h-4 w-4" />
                )}
                Create onboarding record
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsOpen && selectedOnboarding && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30">
          <div className="h-full w-full max-w-5xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-20 border-b border-slate-200 bg-white px-6 py-5">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getOnboardingStatusClass(
                        selectedOnboarding.status
                      )}`}
                    >
                      {
                        onboardingStatusLabels[
                          selectedOnboarding.status
                        ]
                      }
                    </span>

                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityClass(
                        selectedOnboarding.priority
                      )}`}
                    >
                      {
                        priorityLabels[
                          selectedOnboarding.priority
                        ]
                      }
                    </span>

                    <span className="text-xs text-slate-500">
                      {selectedOnboarding.onboarding_reference}
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold text-slate-950">
                    {selectedOnboarding.fullName}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedOnboarding.job_title} · Starts{" "}
                    {formatDate(selectedOnboarding.start_date)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailsOpen(false)}
                  className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close onboarding details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {selectedOnboarding.completedTaskCount} of{" "}
                    {selectedOnboarding.taskCount} tasks complete
                  </span>

                  <span className="font-semibold text-[#6e5084]">
                    {selectedOnboarding.progress}%
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#6e5084] transition-all"
                    style={{
                      width: `${selectedOnboarding.progress}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-7 p-6">
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ReadinessCard
                  icon={<FileText className="h-5 w-5" />}
                  label="Contract issued"
                  complete={Boolean(
                    selectedOnboarding.contract_issued_at
                  )}
                  detail={formatDateTime(
                    selectedOnboarding.contract_issued_at
                  )}
                  actionLabel="Mark issued"
                  onAction={() =>
                    void markContractIssued(
                      selectedOnboarding
                    )
                  }
                />

                <ReadinessCard
                  icon={<FileCheck2 className="h-5 w-5" />}
                  label="Contract signed"
                  complete={Boolean(
                    selectedOnboarding.contract_signed_at
                  )}
                  detail={formatDateTime(
                    selectedOnboarding.contract_signed_at
                  )}
                  actionLabel="Mark signed"
                  onAction={() =>
                    void markContractSigned(
                      selectedOnboarding
                    )
                  }
                />

                <ReadinessCard
                  icon={
                    <BriefcaseBusiness className="h-5 w-5" />
                  }
                  label="Payroll ready"
                  complete={Boolean(
                    selectedOnboarding.payroll_ready_at
                  )}
                  detail={formatDateTime(
                    selectedOnboarding.payroll_ready_at
                  )}
                  actionLabel="Mark ready"
                  onAction={() =>
                    void markPayrollReady(
                      selectedOnboarding
                    )
                  }
                />

                <ReadinessCard
                  icon={<PackageCheck className="h-5 w-5" />}
                  label="Equipment ready"
                  complete={Boolean(
                    selectedOnboarding.equipment_ready_at
                  )}
                  detail={formatDateTime(
                    selectedOnboarding.equipment_ready_at
                  )}
                  actionLabel="Mark ready"
                  onAction={() =>
                    void markEquipmentReady(
                      selectedOnboarding
                    )
                  }
                />

                <ReadinessCard
                  icon={<Laptop className="h-5 w-5" />}
                  label="Systems ready"
                  complete={Boolean(
                    selectedOnboarding.systems_ready_at
                  )}
                  detail={formatDateTime(
                    selectedOnboarding.systems_ready_at
                  )}
                  actionLabel="Mark ready"
                  onAction={() =>
                    void markSystemsReady(
                      selectedOnboarding
                    )
                  }
                />

                <ReadinessCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  label="Right to work"
                  complete={Boolean(
                    selectedOnboarding.right_to_work_confirmed_at
                  )}
                  detail={formatDateTime(
                    selectedOnboarding.right_to_work_confirmed_at
                  )}
                />

                <ReadinessCard
                  icon={<Mail className="h-5 w-5" />}
                  label="References"
                  complete={Boolean(
                    selectedOnboarding.references_confirmed_at
                  )}
                  detail={formatDateTime(
                    selectedOnboarding.references_confirmed_at
                  )}
                />

                <ReadinessCard
                  icon={<UserCheck className="h-5 w-5" />}
                  label="First day confirmed"
                  complete={Boolean(
                    selectedOnboarding.first_day_confirmed_at
                  )}
                  detail={formatDateTime(
                    selectedOnboarding.first_day_confirmed_at
                  )}
                />
              </section>

              <DetailSection title="Starter and employment details">
                <DetailItem
                  label="Starter"
                  value={selectedOnboarding.fullName}
                />
                <DetailItem
                  label="Personal email"
                  value={
                    selectedOnboarding.personal_email ||
                    "Not recorded"
                  }
                />
                <DetailItem
                  label="Work email"
                  value={
                    selectedOnboarding.work_email ||
                    "Not created"
                  }
                />
                <DetailItem
                  label="Phone"
                  value={
                    selectedOnboarding.phone || "Not recorded"
                  }
                />
                <DetailItem
                  label="Job title"
                  value={selectedOnboarding.job_title}
                />
                <DetailItem
                  label="Employment type"
                  value={
                    employmentTypeLabels[
                      selectedOnboarding.employment_type
                    ]
                  }
                />
                <DetailItem
                  label="Department"
                  value={
                    selectedOnboarding.department ||
                    "Not recorded"
                  }
                />
                <DetailItem
                  label="Location"
                  value={
                    selectedOnboarding.location_name ||
                    "Not recorded"
                  }
                />
                <DetailItem
                  label="Manager"
                  value={
                    selectedOnboarding.manager_name ||
                    "Not recorded"
                  }
                />
                <DetailItem
                  label="Start date"
                  value={formatDate(
                    selectedOnboarding.start_date
                  )}
                />
                <DetailItem
                  label="Weekly hours"
                  value={
                    selectedOnboarding.hours_per_week !== null
                      ? String(
                          selectedOnboarding.hours_per_week
                        )
                      : "Not recorded"
                  }
                />
                <DetailItem
                  label="Probation"
                  value={
                    selectedOnboarding.probation_months !== null
                      ? selectedOnboarding.probation_months === 0
                        ? "No probation"
                        : `${selectedOnboarding.probation_months} months`
                      : "Not recorded"
                  }
                />
              </DetailSection>

              {selectedOnboarding.pause_reason && (
                <div className="rounded-2xl border border-[#ead7af] bg-[#fffaf0] p-4">
                  <div className="text-sm font-semibold text-[#7a5c1e]">
                    Onboarding paused
                  </div>

                  <p className="mt-2 text-sm leading-6 text-[#7a5c1e]">
                    {selectedOnboarding.pause_reason}
                  </p>
                </div>
              )}

              {selectedOnboarding.withdrawal_reason && (
                <div className="rounded-2xl border border-[#ead0d0] bg-[#fff7f7] p-4">
                  <div className="text-sm font-semibold text-[#7b3f3f]">
                    Onboarding withdrawn
                  </div>

                  <p className="mt-2 text-sm leading-6 text-[#7b3f3f]">
                    {selectedOnboarding.withdrawal_reason}
                  </p>
                </div>
              )}

              <section>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">
                      Onboarding checklist
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Track each action, its owner, due date and
                      evidence requirement.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTaskPanel(true)}
                    className="inline-flex items-center gap-2 self-start rounded-xl border border-[#cdb2e2] bg-[#f7f1fc] px-4 py-2.5 text-sm font-semibold text-[#6e5084] hover:bg-[#efe4f7]"
                  >
                    <Plus className="h-4 w-4" />
                    Add task
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {selectedTasks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                      <ClipboardCheck className="mx-auto h-7 w-7 text-slate-400" />

                      <p className="mt-3 text-sm font-medium text-slate-700">
                        No onboarding tasks recorded
                      </p>
                    </div>
                  ) : (
                    selectedTasks.map((task) => {
                      const overdue =
                        task.status !== "completed" &&
                        task.status !== "not_required" &&
                        isPastDate(task.due_date);

                      return (
                        <div
                          key={task.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="mt-0.5 rounded-xl bg-[#f7f1fc] p-2.5 text-[#6e5084]">
                                {getCategoryIcon(task.category)}
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-semibold text-slate-900">
                                    {task.title}
                                  </h4>

                                  {task.is_mandatory && (
                                    <span className="rounded-full border border-[#d9c5e8] bg-[#f7f1fc] px-2 py-0.5 text-[11px] font-semibold text-[#6e5084]">
                                      Mandatory
                                    </span>
                                  )}

                                  {task.evidence_required && (
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                      Evidence required
                                    </span>
                                  )}

                                  {overdue && (
                                    <span className="rounded-full border border-[#ead0d0] bg-[#fff7f7] px-2 py-0.5 text-[11px] font-semibold text-[#7b3f3f]">
                                      Overdue
                                    </span>
                                  )}
                                </div>

                                {task.description && (
                                  <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
                                    {task.description}
                                  </p>
                                )}

                                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                                  <span>
                                    Category:{" "}
                                    {categoryLabels[task.category]}
                                  </span>

                                  <span>
                                    Owner:{" "}
                                    {task.owner_name ||
                                      ownerTypeLabels[
                                        task.owner_type
                                      ]}
                                  </span>

                                  <span>
                                    Due: {formatDate(task.due_date)}
                                  </span>

                                  {task.completed_at && (
                                    <span>
                                      Completed:{" "}
                                      {formatDateTime(
                                        task.completed_at
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                              <select
                                value={task.status}
                                disabled={actionId === task.id}
                                onChange={(event) =>
                                  void changeTaskStatus(
                                    task,
                                    event.target
                                      .value as TaskStatus
                                  )
                                }
                                className={`rounded-xl border px-3 py-2 text-xs font-semibold outline-none ${getTaskStatusClass(
                                  task.status
                                )}`}
                              >
                                {Object.entries(
                                  taskStatusLabels
                                ).map(([value, label]) => (
                                  <option
                                    key={value}
                                    value={value}
                                  >
                                    {label}
                                  </option>
                                ))}
                              </select>

                              {actionId === task.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-[#6e5084]" />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void archiveTask(task)
                                  }
                                  className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-[#cdb2e2] hover:bg-[#f7f1fc] hover:text-[#6e5084]"
                                  aria-label="Archive onboarding task"
                                >
                                  <Archive className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {selectedOnboarding.completion_notes && (
                <div className="rounded-2xl border border-[#b9dfcf] bg-[#f5fff9] p-4">
                  <div className="text-sm font-semibold text-[#285f4a]">
                    Completion and probation handover notes
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#285f4a]">
                    {selectedOnboarding.completion_notes}
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white px-6 py-4">
              {selectedOnboarding.status === "paused" ? (
                <button
                  type="button"
                  onClick={() =>
                    void resumeOnboarding(
                      selectedOnboarding
                    )
                  }
                  disabled={
                    actionId === selectedOnboarding.id
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-[#cdb2e2] bg-[#f7f1fc] px-4 py-2.5 text-sm font-semibold text-[#6e5084] hover:bg-[#efe4f7] disabled:opacity-60"
                >
                  <RefreshCw className="h-4 w-4" />
                  Resume onboarding
                </button>
              ) : (
                !["completed", "withdrawn"].includes(
                  selectedOnboarding.status
                ) && (
                  <button
                    type="button"
                    onClick={() =>
                      void pauseOnboarding(
                        selectedOnboarding
                      )
                    }
                    disabled={
                      actionId === selectedOnboarding.id
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-[#cdb2e2] hover:text-[#6e5084] disabled:opacity-60"
                  >
                    <Clock3 className="h-4 w-4" />
                    Pause
                  </button>
                )
              )}

              {selectedOnboarding.status ===
                "ready_for_first_day" && (
                <button
                  type="button"
                  onClick={() =>
                    void startFirstDay(selectedOnboarding)
                  }
                  disabled={
                    actionId === selectedOnboarding.id
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#6e5084] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5f4574] disabled:opacity-60"
                >
                  <UserCheck className="h-4 w-4" />
                  Confirm first day
                </button>
              )}

              {selectedOnboarding.status ===
                "in_progress" && (
                <button
                  type="button"
                  onClick={() =>
                    void moveToFirstWeek(
                      selectedOnboarding
                    )
                  }
                  disabled={
                    actionId === selectedOnboarding.id
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#6e5084] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5f4574] disabled:opacity-60"
                >
                  <CalendarDays className="h-4 w-4" />
                  Move to first week
                </button>
              )}

              {selectedOnboarding.status ===
                "first_week" && (
                <button
                  type="button"
                  onClick={() =>
                    void moveToFirstMonth(
                      selectedOnboarding
                    )
                  }
                  disabled={
                    actionId === selectedOnboarding.id
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#6e5084] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5f4574] disabled:opacity-60"
                >
                  <NotebookPen className="h-4 w-4" />
                  Move to first month
                </button>
              )}

              {selectedOnboarding.status ===
                "first_month" && (
                <button
                  type="button"
                  onClick={() =>
                    void completeOnboarding(
                      selectedOnboarding
                    )
                  }
                  disabled={
                    actionId === selectedOnboarding.id
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#6e5084] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5f4574] disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Complete onboarding
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showTaskPanel && selectedOnboarding && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Add onboarding task
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add a role-specific or organisation-specific action
                  for {selectedOnboarding.fullName}.
                </p>
              </div>

              <button
                type="button"
                onClick={resetTaskPanel}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close task panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <Field label="Task title" required fullWidth>
                <input
                  value={taskForm.title}
                  onChange={(event) =>
                    updateTaskForm(
                      "title",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Description" fullWidth>
                <textarea
                  rows={4}
                  value={taskForm.description}
                  onChange={(event) =>
                    updateTaskForm(
                      "description",
                      event.target.value
                    )
                  }
                  className={`${inputClass} resize-y`}
                />
              </Field>

              <Field label="Category">
                <select
                  value={taskForm.category}
                  onChange={(event) =>
                    updateTaskForm(
                      "category",
                      event.target.value as TaskCategory
                    )
                  }
                  className={inputClass}
                >
                  {Object.entries(categoryLabels).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Owner type">
                <select
                  value={taskForm.owner_type}
                  onChange={(event) =>
                    updateTaskForm(
                      "owner_type",
                      event.target.value as TaskOwnerType
                    )
                  }
                  className={inputClass}
                >
                  {Object.entries(ownerTypeLabels).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Named owner">
                <input
                  value={taskForm.owner_name}
                  onChange={(event) =>
                    updateTaskForm(
                      "owner_name",
                      event.target.value
                    )
                  }
                  placeholder="Optional"
                  className={inputClass}
                />
              </Field>

              <Field label="Due date">
                <input
                  type="date"
                  value={taskForm.due_date}
                  onChange={(event) =>
                    updateTaskForm(
                      "due_date",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#eadff2] bg-[#fcf9fe] p-4">
                <input
                  type="checkbox"
                  checked={taskForm.is_mandatory}
                  onChange={(event) =>
                    updateTaskForm(
                      "is_mandatory",
                      event.target.checked
                    )
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#6e5084] focus:ring-[#cdb2e2]"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    Mandatory task
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Onboarding cannot be completed while this task is
                    outstanding.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#eadff2] bg-[#fcf9fe] p-4">
                <input
                  type="checkbox"
                  checked={taskForm.evidence_required}
                  onChange={(event) =>
                    updateTaskForm(
                      "evidence_required",
                      event.target.checked
                    )
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#6e5084] focus:ring-[#cdb2e2]"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    Evidence required
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    The task should have supporting evidence recorded.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={resetTaskPanel}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-[#cdb2e2] disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void createCustomTask()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#6e5084] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5f4574] disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#a983c2] focus:ring-4 focus:ring-[#f7f1fc]";

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[15px] border border-slate-200 bg-white p-[17px]">
      <span className="text-sm text-slate-600">{label}</span>
      <strong className="text-3xl font-semibold tracking-tight text-[#6e5084]">
        {value}
      </strong>
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
    <div className="mb-4">
      <h2 className="m-0 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm leading-[1.55] text-slate-500">{description}</p>
    </div>
  );
}

function OnboardingJourney({ status }: { status: OnboardingStatus }) {
  const stages = ["Offer accepted", "Pre-start", "First day", "First week", "First month", "Complete"];
  const current =
    status === "completed" ? 5 :
    status === "first_month" ? 4 :
    status === "first_week" ? 3 :
    ["in_progress", "ready_for_first_day"].includes(status) ? 2 :
    status === "pre_start" ? 1 : 0;

  return (
    <section className="grid grid-cols-6 gap-2 overflow-x-auto rounded-[18px] border border-slate-200 bg-white p-[18px]">
      {stages.map((stage, index) => (
        <div key={stage} className="flex min-w-[110px] items-center gap-2 text-[13px]">
          <span
            className={`grid h-[27px] w-[27px] shrink-0 place-items-center rounded-full font-extrabold ${
              index < current
                ? "border border-[#b7dec7] bg-[#f5fff9] text-[#276749]"
                : index === current
                  ? "bg-[#6e5084] text-white"
                  : "bg-slate-100 text-slate-500"
            }`}
          >
            {index < current ? <Check className="h-3.5 w-3.5" /> : index + 1}
          </span>
          <strong className="whitespace-nowrap">{stage}</strong>
        </div>
      ))}
    </section>
  );
}

function ReadinessRow({ label, complete }: { label: string; complete: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-[12px] border px-3 py-2.5 ${
      complete ? "border-[#cde5d6] bg-[#f5fff9]" : "border-slate-200 bg-white"
    }`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {complete ? (
        <CheckCircle2 className="h-4 w-4 text-[#276749]" />
      ) : (
        <span className="text-xs font-semibold text-slate-400">Not ready</span>
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
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-950">
          {title}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  required = false,
  fullWidth = false,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={fullWidth ? "sm:col-span-2" : ""}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-[#6e5084]">*</span>
        )}
      </span>

      {children}

      {hint && (
        <span className="mt-1.5 block text-xs text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}

function ChecklistToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#eadff2] bg-[#fcf9fe] p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#6e5084] focus:ring-[#cdb2e2]"
      />

      <span>
        <span className="block text-sm font-semibold text-slate-900">
          {label}
        </span>

        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-900">
        {title}
      </h3>

      <div className="mt-3 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
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
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-sm font-medium text-slate-800">
        {value}
      </div>
    </div>
  );
}

function OnboardingSummary({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 break-words text-xl font-semibold text-slate-950">
        {value}
      </div>
      <div className="mt-1 text-xs leading-5 text-slate-500">
        {detail}
      </div>
    </div>
  );
}

function ReadinessCard({
  icon,
  label,
  complete,
  detail,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  label: string;
  complete: boolean;
  detail: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        complete
          ? "border-[#b9dfcf] bg-[#f5fff9]"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`rounded-xl p-2.5 ${
            complete
              ? "bg-white text-[#285f4a]"
              : "bg-[#f7f1fc] text-[#6e5084]"
          }`}
        >
          {icon}
        </div>

        {complete && (
          <CheckCircle2 className="h-5 w-5 text-[#285f4a]" />
        )}
      </div>

      <div className="mt-3 text-sm font-semibold text-slate-900">
        {label}
      </div>

      <div className="mt-1 text-xs text-slate-500">
        {detail}
      </div>

      {!complete && actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 text-xs font-semibold text-[#6e5084] hover:underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}