"use client";

import {
  Archive,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  ClipboardCheck,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import TalentIntelligencePanel from "./shared/TalentIntelligencePanel";

type AppointmentStatus =
  | "pre_employment"
  | "checks_in_progress"
  | "ready_to_start"
  | "employee_creation_pending"
  | "employee_created"
  | "started"
  | "withdrawn"
  | "cancelled";

type ItemStatus =
  | "not_started"
  | "in_progress"
  | "awaiting_information"
  | "complete"
  | "not_required"
  | "blocked";

type ItemCategory =
  | "candidate_details"
  | "documents"
  | "safer_recruitment"
  | "payroll"
  | "equipment"
  | "learning"
  | "induction"
  | "manager_action"
  | "other";

type ItemOwnerType = "candidate" | "manager" | "hr" | "employer" | "system";

type OnboardingSection =
  | "overview"
  | "documents"
  | "due_diligence"
  | "payroll"
  | "equipment"
  | "learning"
  | "tasks"
  | "timeline";

interface Appointment {
  id: string;
  organisation_id: string | null;
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
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

interface OnboardingItem {
  id: string;
  organisation_id: string | null;
  appointment_id: string;
  item_key: string;
  item_name: string;
  item_category: ItemCategory;
  description: string | null;
  owner_type: ItemOwnerType;
  assigned_to_user_id: string | null;
  due_date: string | null;
  status: ItemStatus;
  candidate_visible: boolean;
  candidate_editable: boolean;
  completion_notes: string | null;
  completed_by: string | null;
  completed_at: string | null;
  source_template_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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
}

interface Offer {
  id: string;
  organisation_id: string | null;
  application_id: string;
  vacancy_id: string;
  candidate_id: string;
  status: string;
  job_title: string;
  department: string | null;
  location_name: string | null;
  manager_name: string | null;
  manager_user_id: string | null;
  proposed_start_date: string | null;
  accepted_at: string | null;
  archived_at: string | null;
}

interface Application {
  id: string;
  status: string;
  current_stage_key: string;
}

interface AppointmentView extends Appointment {
  fullName: string;
  jobTitle: string;
  personalEmail: string | null;
  phone: string | null;
  taskCount: number;
  completedTaskCount: number;
  mandatoryTaskCount: number;
  completedMandatoryTaskCount: number;
  overdueTaskCount: number;
  blockedTaskCount: number;
  progress: number;
}

interface CreateForm {
  offerId: string;
  agreedStartDate: string;
  managerName: string;
  department: string;
  locationName: string;
  includeDbs: boolean;
  includeEquipment: boolean;
  includeLearning: boolean;
}

interface TaskForm {
  itemName: string;
  description: string;
  category: ItemCategory;
  ownerType: ItemOwnerType;
  dueDate: string;
  candidateVisible: boolean;
  candidateEditable: boolean;
}

interface ItemTemplate {
  key: string;
  name: string;
  category: ItemCategory;
  description: string;
  ownerType: ItemOwnerType;
  dueOffsetDays: number;
  candidateVisible: boolean;
  candidateEditable: boolean;
  mandatory: boolean;
  conditional?: "dbs" | "equipment" | "learning";
}

const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  pre_employment: "Pre-employment",
  checks_in_progress: "Checks in progress",
  ready_to_start: "Ready for commencement",
  employee_creation_pending: "Employee creation pending",
  employee_created: "Employee created",
  started: "Employment commenced",
  withdrawn: "Withdrawn",
  cancelled: "Cancelled",
};

const itemStatusLabels: Record<ItemStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  awaiting_information: "Awaiting information",
  complete: "Complete",
  not_required: "Not required",
  blocked: "Blocked",
};

const categoryLabels: Record<ItemCategory, string> = {
  candidate_details: "Candidate details",
  documents: "Documents",
  safer_recruitment: "Due diligence",
  payroll: "Payroll",
  equipment: "Equipment",
  learning: "Learning",
  induction: "Induction",
  manager_action: "Manager action",
  other: "Other",
};

const ownerLabels: Record<ItemOwnerType, string> = {
  candidate: "New starter",
  manager: "Manager",
  hr: "HR",
  employer: "Employer",
  system: "System",
};

const onboardingSections: Array<{ value: OnboardingSection; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "documents", label: "Documents" },
  { value: "due_diligence", label: "Due Diligence" },
  { value: "payroll", label: "Payroll" },
  { value: "equipment", label: "Equipment & Access" },
  { value: "learning", label: "Learning" },
  { value: "tasks", label: "Tasks" },
  { value: "timeline", label: "Timeline" },
];

const initialCreateForm: CreateForm = {
  offerId: "",
  agreedStartDate: "",
  managerName: "",
  department: "",
  locationName: "",
  includeDbs: false,
  includeEquipment: true,
  includeLearning: true,
};

const initialTaskForm: TaskForm = {
  itemName: "",
  description: "",
  category: "other",
  ownerType: "employer",
  dueDate: "",
  candidateVisible: false,
  candidateEditable: false,
};

const itemTemplates: ItemTemplate[] = [
  {
    key: "candidate_details",
    name: "Complete starter details",
    category: "candidate_details",
    description:
      "Confirm the starter information required for the employment record.",
    ownerType: "candidate",
    dueOffsetDays: -5,
    candidateVisible: true,
    candidateEditable: true,
    mandatory: true,
  },
  {
    key: "right_to_work",
    name: "Confirm right to work",
    category: "safer_recruitment",
    description:
      "Complete and record the required right to work check before employment begins.",
    ownerType: "hr",
    dueOffsetDays: -7,
    candidateVisible: false,
    candidateEditable: false,
    mandatory: true,
  },
  {
    key: "references",
    name: "Confirm references",
    category: "safer_recruitment",
    description:
      "Confirm required references and record telephone verification where applicable.",
    ownerType: "hr",
    dueOffsetDays: -7,
    candidateVisible: false,
    candidateEditable: false,
    mandatory: true,
  },
  {
    key: "dbs_clearance",
    name: "Confirm DBS or safeguarding clearance",
    category: "safer_recruitment",
    description:
      "Complete the required DBS, barred-list or safeguarding checks for the role.",
    ownerType: "hr",
    dueOffsetDays: -5,
    candidateVisible: false,
    candidateEditable: false,
    mandatory: true,
    conditional: "dbs",
  },
  {
    key: "contract_issue",
    name: "Issue employment contract",
    category: "documents",
    description:
      "Issue the contract and written particulars using the agreed employment terms.",
    ownerType: "hr",
    dueOffsetDays: -10,
    candidateVisible: true,
    candidateEditable: false,
    mandatory: true,
  },
  {
    key: "contract_signature",
    name: "Receive signed employment contract",
    category: "documents",
    description: "Confirm the signed contract has been received and stored.",
    ownerType: "candidate",
    dueOffsetDays: -2,
    candidateVisible: true,
    candidateEditable: true,
    mandatory: true,
  },
  {
    key: "payroll_information",
    name: "Collect payroll information",
    category: "payroll",
    description:
      "Collect bank and tax information through the approved secure process.",
    ownerType: "candidate",
    dueOffsetDays: -5,
    candidateVisible: true,
    candidateEditable: true,
    mandatory: true,
  },
  {
    key: "payroll_setup",
    name: "Add starter to payroll",
    category: "payroll",
    description:
      "Complete payroll setup and confirm the first payroll cut-off.",
    ownerType: "employer",
    dueOffsetDays: -2,
    candidateVisible: false,
    candidateEditable: false,
    mandatory: true,
  },
  {
    key: "equipment",
    name: "Prepare equipment",
    category: "equipment",
    description: "Prepare and allocate the equipment required for the role.",
    ownerType: "manager",
    dueOffsetDays: -2,
    candidateVisible: false,
    candidateEditable: false,
    mandatory: true,
    conditional: "equipment",
  },
  {
    key: "mandatory_learning",
    name: "Assign mandatory learning",
    category: "learning",
    description:
      "Assign organisation-wide and role-specific learning in Leo Learn.",
    ownerType: "hr",
    dueOffsetDays: -1,
    candidateVisible: true,
    candidateEditable: false,
    mandatory: true,
    conditional: "learning",
  },
  {
    key: "first_day_arrangements",
    name: "Confirm commencement arrangements",
    category: "induction",
    description:
      "Confirm the date of commencement, reporting arrangements, location and key contacts.",
    ownerType: "manager",
    dueOffsetDays: -3,
    candidateVisible: true,
    candidateEditable: false,
    mandatory: true,
  },
];

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function formatDate(value: string | null): string {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function isPast(value: string | null): boolean {
  if (!value) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${value}T00:00:00`) < today;
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [items, setItems] = useState<OnboardingItem[]>([]);
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

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>(
    "all",
  );
  const [showArchived, setShowArchived] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(initialCreateForm);
  const [taskForm, setTaskForm] = useState<TaskForm>(initialTaskForm);
  const [activeSection, setActiveSection] = useState<OnboardingSection>("overview");

  const loadData = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/talent/onboarding", {
        method: "GET",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload.success !== true) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Leo Talent could not load the onboarding workspace.",
        );
      }

      setAppointments((payload.appointments ?? []) as Appointment[]);
      setItems((payload.items ?? []) as OnboardingItem[]);
      setOffers((payload.offers ?? []) as Offer[]);
      setApplications((payload.applications ?? []) as Application[]);
      setCandidates((payload.candidates ?? []) as Candidate[]);
      setVacancies((payload.vacancies ?? []) as Vacancy[]);

      if (payload.syncedCount > 0) {
        setNotice(
          payload.syncedCount === 1
            ? "An accepted offer has been added to onboarding automatically."
            : `${payload.syncedCount} accepted offers have been added to onboarding automatically.`,
        );
      }
    } catch (loadError) {
      setError(
        errorMessage(
          loadError,
          "Leo Talent could not load the onboarding workspace.",
        ),
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
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const candidateMap = useMemo(
    () => new Map(candidates.map((item) => [item.id, item])),
    [candidates],
  );
  const vacancyMap = useMemo(
    () => new Map(vacancies.map((item) => [item.id, item])),
    [vacancies],
  );
  const offerMap = useMemo(
    () => new Map(offers.map((item) => [item.id, item])),
    [offers],
  );
  const itemMap = useMemo(() => {
    const map = new Map<string, OnboardingItem[]>();
    for (const item of items) {
      const current = map.get(item.appointment_id) ?? [];
      current.push(item);
      map.set(item.appointment_id, current);
    }
    return map;
  }, [items]);

  const views = useMemo<AppointmentView[]>(() => {
    return appointments.map((appointment) => {
      const candidate = candidateMap.get(appointment.candidate_id);
      const offer = offerMap.get(appointment.offer_id);
      const vacancy = vacancyMap.get(appointment.vacancy_id);
      const appointmentItems = itemMap.get(appointment.id) ?? [];
      const included = appointmentItems.filter(
        (item) => item.status !== "not_required",
      );
      const complete = included.filter(
        (item) => item.status === "complete",
      ).length;
      const mandatory = included.filter((item) =>
        Boolean(item.metadata?.mandatory ?? true),
      );
      const completedMandatory = mandatory.filter(
        (item) => item.status === "complete",
      ).length;
      const overdue = included.filter(
        (item) => item.status !== "complete" && isPast(item.due_date),
      ).length;
      const blocked = included.filter(
        (item) => item.status === "blocked",
      ).length;

      return {
        ...appointment,
        fullName: candidate
          ? `${candidate.preferred_name || candidate.first_name} ${candidate.last_name}`
          : "Unknown candidate",
        jobTitle: offer?.job_title || vacancy?.title || "Role not recorded",
        personalEmail: candidate?.email ?? null,
        phone: candidate?.phone ?? null,
        taskCount: included.length,
        completedTaskCount: complete,
        mandatoryTaskCount: mandatory.length,
        completedMandatoryTaskCount: completedMandatory,
        overdueTaskCount: overdue,
        blockedTaskCount: blocked,
        progress: included.length
          ? Math.round((complete / included.length) * 100)
          : 0,
      };
    });
  }, [appointments, candidateMap, offerMap, vacancyMap, itemMap]);

  const selected = useMemo(
    () => views.find((item) => item.id === selectedId) ?? null,
    [views, selectedId],
  );
  const selectedItems = useMemo(
    () =>
      selectedId
        ? [...(itemMap.get(selectedId) ?? [])].sort((a, b) =>
            a.created_at.localeCompare(b.created_at),
          )
        : [],
    [itemMap, selectedId],
  );

  const visibleSelectedItems = useMemo(() => {
    if (activeSection === "overview") {
      return selectedItems
        .filter((item) => !["complete", "not_required"].includes(item.status))
        .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))
        .slice(0, 6);
    }
    if (activeSection === "documents") {
      return selectedItems.filter((item) => item.item_category === "documents");
    }
    if (activeSection === "due_diligence") {
      return selectedItems.filter(
        (item) => item.item_category === "safer_recruitment",
      );
    }
    if (activeSection === "payroll") {
      return selectedItems.filter((item) => item.item_category === "payroll");
    }
    if (activeSection === "equipment") {
      return selectedItems.filter((item) => item.item_category === "equipment");
    }
    if (activeSection === "learning") {
      return selectedItems.filter((item) => item.item_category === "learning");
    }
    if (activeSection === "tasks") {
      return selectedItems.filter((item) =>
        [
          "candidate_details",
          "induction",
          "manager_action",
          "other",
        ].includes(item.item_category),
      );
    }
    return [];
  }, [activeSection, selectedItems]);

  const availableOffers = useMemo(() => {
    const used = new Set(appointments.map((item) => item.offer_id));
    return offers
      .filter((offer) => (offer.status === "accepted" || Boolean(offer.accepted_at)) && !used.has(offer.id))
      .map((offer) => ({
        offer,
        candidate: candidateMap.get(offer.candidate_id),
        vacancy: vacancyMap.get(offer.vacancy_id),
      }))
      .filter((item) => item.candidate);
  }, [appointments, offers, candidateMap, vacancyMap]);

  const filtered = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return views.filter((item) => {
      const archivedMatch = showArchived
        ? Boolean(item.archived_at)
        : !item.archived_at;
      const statusMatch =
        statusFilter === "all" || item.status === statusFilter;
      const searchMatch =
        !search ||
        item.fullName.toLowerCase().includes(search) ||
        item.jobTitle.toLowerCase().includes(search) ||
        item.appointment_reference.toLowerCase().includes(search) ||
        item.department?.toLowerCase().includes(search) ||
        item.location_name?.toLowerCase().includes(search);
      return archivedMatch && statusMatch && searchMatch;
    });
  }, [views, searchTerm, statusFilter, showArchived]);

  const metrics = useMemo(() => {
    const active = views.filter((item) => !item.archived_at);
    return {
      active: active.filter(
        (item) => !["started", "withdrawn", "cancelled"].includes(item.status),
      ).length,
      ready: active.filter((item) => item.status === "ready_to_start").length,
      overdue: active.reduce((sum, item) => sum + item.overdueTaskCount, 0),
      employeeCreated: active.filter(
        (item) => item.status === "employee_created",
      ).length,
      started: active.filter((item) => item.status === "started").length,
    };
  }, [views]);

  function selectOffer(offerId: string) {
    const option = availableOffers.find((item) => item.offer.id === offerId);
    if (!option) {
      setCreateForm((current) => ({ ...current, offerId }));
      return;
    }
    setCreateForm({
      offerId,
      agreedStartDate: option.offer.proposed_start_date ?? "",
      managerName:
        option.offer.manager_name ?? option.vacancy?.hiring_manager_name ?? "",
      department: option.offer.department ?? option.vacancy?.department ?? "",
      locationName:
        option.offer.location_name ?? option.vacancy?.location_name ?? "",
      includeDbs: false,
      includeEquipment: true,
      includeLearning: true,
    });
  }

  async function createAppointment() {
    if (!createForm.offerId) return setError("Select an accepted offer.");
    if (!createForm.agreedStartDate)
      return setError("Enter the agreed start date.");

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/talent/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_appointment",
          ...createForm,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "The onboarding appointment could not be created.",
        );
      }

      setCreateForm(initialCreateForm);
      setShowCreate(false);
      setSelectedId(String(payload.appointment.id));
      setNotice("Onboarding created and checklist generated.");
      await loadData(true);
    } catch (createError) {
      setError(
        errorMessage(
          createError,
          "The onboarding appointment could not be created.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateAppointment(
    changes: Partial<Appointment>,
    message: string,
  ) {
    if (!selected) return;
    setActionId(selected.id);
    setError(null);
    try {
      const response = await fetch(`/api/talent/onboarding/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_appointment", changes }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "The appointment could not be updated.",
        );
      }
      setAppointments((current) =>
        current.map((item) =>
          item.id === selected.id ? (payload.appointment as Appointment) : item,
        ),
      );
      setNotice(message);
    } catch (updateError) {
      setError(
        errorMessage(updateError, "The appointment could not be updated."),
      );
    } finally {
      setActionId(null);
    }
  }

  async function updateItem(item: OnboardingItem, status: ItemStatus) {
    setActionId(item.id);
    setError(null);
    try {
      const response = await fetch(`/api/talent/onboarding/${item.appointment_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_item",
          itemId: item.id,
          status,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "The onboarding item could not be updated.",
        );
      }
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? (payload.item as OnboardingItem) : entry,
        ),
      );
      setNotice(
        status === "complete"
          ? "Onboarding item completed."
          : "Onboarding item updated.",
      );
    } catch (updateError) {
      setError(
        errorMessage(updateError, "The onboarding item could not be updated."),
      );
    } finally {
      setActionId(null);
    }
  }

  async function createTask() {
    if (!selected) return setError("Select an appointment first.");
    if (!taskForm.itemName.trim()) return setError("Enter a task name.");
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/talent/onboarding/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_item", item: taskForm }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "The onboarding item could not be added.",
        );
      }
      setItems((current) => [...current, payload.item as OnboardingItem]);
      setTaskForm(initialTaskForm);
      setShowTask(false);
      setNotice("Onboarding item added.");
    } catch (createError) {
      setError(
        errorMessage(createError, "The onboarding item could not be added."),
      );
    } finally {
      setSaving(false);
    }
  }

  async function archiveAppointment() {
    if (!selected) return;
    if (!window.confirm("Archive this appointment?")) return;
    await updateAppointment(
      { archived_at: new Date().toISOString() },
      "Onboarding record archived.",
    );
    setSelectedId(null);
  }

  function exportView() {
    const headers = [
      "Reference",
      "Starter",
      "Role",
      "Start date",
      "Status",
      "Progress",
      "Completed",
      "Total",
      "Overdue",
    ];
    const rows = filtered.map((item) => [
      item.appointment_reference,
      item.fullName,
      item.jobTitle,
      item.agreed_start_date ?? "",
      appointmentStatusLabels[item.status],
      `${item.progress}%`,
      item.completedTaskCount,
      item.taskCount,
      item.overdueTaskCount,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `leo-talent-onboarding-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div>
        <WorkspaceHeading />
        <div style={loadingPanelStyle}>
          <Loader2
            size={28}
            strokeWidth={2}
            style={{ ...spinnerIconStyle }}
          />
          <strong style={loadingTitleStyle}>Loading onboarding</strong>
          <p style={loadingTextStyle}>
            Leo is preparing the new starter register.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{onboardingWorkspaceCss}</style>

      <div style={workspaceHeaderStyle}>
        <div>
          <h2 style={workspaceTitleStyle}>Onboarding</h2>
          <p style={workspaceDescriptionStyle}>
            Manage every new starter from accepted offer through pre-employment
            checks, employee creation and their date of commencement.
          </p>
        </div>

        <div style={headerActionsStyle}>
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={() => void loadData(true)}
            disabled={refreshing}
          >
            <RefreshCw size={16} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>

          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={exportView}
          >
            <Download size={16} />
            Export current view
          </button>

          <button
            type="button"
            style={primaryButtonStyle}
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} />
            Start onboarding
          </button>
        </div>
      </div>

      {error ? (
        <div style={errorPanelStyle}>
          <div style={messageContentStyle}>
            <CircleAlert size={18} />
            <div>
              <strong style={errorTitleStyle}>
                Onboarding could not be updated
              </strong>
              <p style={errorTextStyle}>{error}</p>
            </div>
          </div>
          <button
            type="button"
            style={compactButtonStyle}
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {notice ? (
        <div style={successPanelStyle}>
          <div style={messageContentStyle}>
            <CheckCircle2 size={18} />
            <strong style={successTextStyle}>{notice}</strong>
          </div>
        </div>
      ) : null}

      <TalentIntelligencePanel stage="onboarding" />

      <div style={kpiGridStyle}>
        <KpiCard
          label="New Starters"
          value={String(metrics.active)}
          active={statusFilter === "all" && !showArchived}
          onClick={() => {
            setStatusFilter("all");
            setShowArchived(false);
          }}
        />

        <KpiCard
          label="Ready for Commencement"
          value={String(metrics.ready)}
          active={statusFilter === "ready_to_start"}
          onClick={() => {
            setStatusFilter("ready_to_start");
            setShowArchived(false);
          }}
        />

        <KpiCard
          label="Overdue Items"
          value={String(metrics.overdue)}
          warning={metrics.overdue > 0}
          onClick={() => {
            setStatusFilter("all");
            setShowArchived(false);
          }}
        />

        <KpiCard
          label="Employees Created"
          value={String(metrics.employeeCreated)}
          active={statusFilter === "employee_created"}
          onClick={() => {
            setStatusFilter("employee_created");
            setShowArchived(false);
          }}
        />

        <KpiCard
          label="Employment Commenced"
          value={String(metrics.started)}
          active={statusFilter === "started"}
          onClick={() => {
            setStatusFilter("started");
            setShowArchived(false);
          }}
        />
      </div>

      <div style={registerPanelStyle}>
        <div style={registerHeadingStyle}>
          <div>
            <h3 style={panelTitleStyle}>New Starter Register</h3>
            <p style={panelDescriptionStyle}>
              Review active, completed and archived onboarding records across
              every vacancy.
            </p>
          </div>

          <span style={resultCountStyle}>
            {filtered.length} {filtered.length === 1 ? "starter" : "starters"}
          </span>
        </div>

        <div style={automationPanelStyle}>
          <Sparkles size={18} color="#6E5084" />
          <div>
            <strong style={automationTitleStyle}>
              Connected automatically
            </strong>
            <p style={automationTextStyle}>
              Accepted offers create the starter onboarding record
              automatically. Manual creation remains available for exceptional
              cases.
            </p>
          </div>
        </div>

        <div style={filterAreaStyle}>
          <label style={fieldStyle}>
            <span style={fieldLabelStyle}>Search onboarding</span>
            <div style={searchInputWrapStyle}>
              <Search size={16} color="#9CA3AF" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search starter, role, department, location or reference"
                style={searchInputStyle}
              />
            </div>
          </label>

          <div style={filterButtonRowStyle}>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setShowArchived(false);
              }}
              style={
                statusFilter === "all" && !showArchived
                  ? activeFilterButtonStyle
                  : filterButtonStyle
              }
            >
              Current
            </button>

            {(
              Object.entries(appointmentStatusLabels) as Array<
                [AppointmentStatus, string]
              >
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setStatusFilter(value);
                  setShowArchived(false);
                }}
                style={
                  statusFilter === value && !showArchived
                    ? activeFilterButtonStyle
                    : filterButtonStyle
                }
              >
                {label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setShowArchived(true);
              }}
              style={
                showArchived ? activeFilterButtonStyle : filterButtonStyle
              }
            >
              Archived
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={emptyPanelStyle}>
            <div style={emptyIconStyle}>✦</div>
            <strong style={emptyTitleStyle}>
              {views.length === 0
                ? "No onboarding records have been created"
                : "No onboarding records match this view"}
            </strong>
            <p style={emptyTextStyle}>
              {views.length === 0
                ? "Accepted offers will appear here automatically, or you can start onboarding manually."
                : "Try changing the search term or selecting another onboarding status."}
            </p>
            {views.length === 0 ? (
              <button
                type="button"
                style={emptyPrimaryButtonStyle}
                onClick={() => setShowCreate(true)}
              >
                Start first onboarding
              </button>
            ) : null}
          </div>
        ) : (
          <div style={starterListStyle}>
            {filtered.map((appointment) => (
              <OnboardingCard
                key={appointment.id}
                appointment={appointment}
                items={itemMap.get(appointment.id) ?? []}
                expanded={selectedId === appointment.id}
                activeSection={activeSection}
                visibleItems={
                  selectedId === appointment.id ? visibleSelectedItems : []
                }
                actionId={actionId}
                onToggle={() => {
                  if (selectedId === appointment.id) {
                    setSelectedId(null);
                  } else {
                    setSelectedId(appointment.id);
                    setActiveSection("overview");
                  }
                }}
                onSectionChange={setActiveSection}
                onAddItem={() => {
                  setSelectedId(appointment.id);
                  setShowTask(true);
                }}
                onUpdateItem={(item, status) => void updateItem(item, status)}
                onProgress={(changes, message) => {
                  setSelectedId(appointment.id);
                  void updateAppointment(changes, message);
                }}
                onArchive={() => {
                  setSelectedId(appointment.id);
                  void archiveAppointment();
                }}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate ? (
        <Modal title="Start onboarding" onClose={() => setShowCreate(false)}>
          <div style={modalIntroStyle}>
            Select an accepted offer and confirm the starter arrangements. Leo
            will generate the standard onboarding checklist.
          </div>

          <div style={twoColumnGridStyle}>
            <Field label="Accepted offer" full>
              <select
                value={createForm.offerId}
                onChange={(event) => selectOffer(event.target.value)}
                style={inputStyle}
              >
                <option value="">Select accepted offer</option>
                {availableOffers.map(({ offer, candidate }) => (
                  <option key={offer.id} value={offer.id}>
                    {candidate!.preferred_name || candidate!.first_name}{" "}
                    {candidate!.last_name} — {offer.job_title}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Agreed start date">
              <input
                type="date"
                value={createForm.agreedStartDate}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    agreedStartDate: event.target.value,
                  }))
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Manager">
              <input
                value={createForm.managerName}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    managerName: event.target.value,
                  }))
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Department">
              <input
                value={createForm.department}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    department: event.target.value,
                  }))
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Location">
              <input
                value={createForm.locationName}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    locationName: event.target.value,
                  }))
                }
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={toggleGridStyle}>
            <Toggle
              label="Include DBS or safeguarding clearance"
              checked={createForm.includeDbs}
              onChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  includeDbs: value,
                }))
              }
            />
            <Toggle
              label="Include equipment preparation"
              checked={createForm.includeEquipment}
              onChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  includeEquipment: value,
                }))
              }
            />
            <Toggle
              label="Include Leo Learn assignments"
              checked={createForm.includeLearning}
              onChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  includeLearning: value,
                }))
              }
            />
          </div>

          <div style={modalActionsStyle}>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              style={primaryButtonStyle}
              onClick={() => void createAppointment()}
              disabled={saving}
            >
              {saving ? <Loader2 size={16} /> : <ClipboardCheck size={16} />}
              {saving ? "Creating…" : "Create onboarding"}
            </button>
          </div>
        </Modal>
      ) : null}

      {showTask && selected ? (
        <Modal title="Add onboarding item" onClose={() => setShowTask(false)}>
          <div style={modalIntroStyle}>
            Add a tailored action to {selected.fullName}&apos;s onboarding
            record.
          </div>

          <div style={twoColumnGridStyle}>
            <Field label="Item name" full>
              <input
                value={taskForm.itemName}
                onChange={(event) =>
                  setTaskForm((current) => ({
                    ...current,
                    itemName: event.target.value,
                  }))
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Description" full>
              <textarea
                rows={4}
                value={taskForm.description}
                onChange={(event) =>
                  setTaskForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                style={textAreaStyle}
              />
            </Field>

            <Field label="Category">
              <select
                value={taskForm.category}
                onChange={(event) =>
                  setTaskForm((current) => ({
                    ...current,
                    category: event.target.value as ItemCategory,
                  }))
                }
                style={inputStyle}
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Owner">
              <select
                value={taskForm.ownerType}
                onChange={(event) =>
                  setTaskForm((current) => ({
                    ...current,
                    ownerType: event.target.value as ItemOwnerType,
                  }))
                }
                style={inputStyle}
              >
                {Object.entries(ownerLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Due date">
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(event) =>
                  setTaskForm((current) => ({
                    ...current,
                    dueDate: event.target.value,
                  }))
                }
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={toggleGridStyle}>
            <Toggle
              label="Visible to new starter"
              checked={taskForm.candidateVisible}
              onChange={(value) =>
                setTaskForm((current) => ({
                  ...current,
                  candidateVisible: value,
                }))
              }
            />
            <Toggle
              label="Editable by new starter"
              checked={taskForm.candidateEditable}
              onChange={(value) =>
                setTaskForm((current) => ({
                  ...current,
                  candidateEditable: value,
                }))
              }
            />
          </div>

          <div style={modalActionsStyle}>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={() => setShowTask(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              style={primaryButtonStyle}
              onClick={() => void createTask()}
              disabled={saving}
            >
              {saving ? <Loader2 size={16} /> : <Plus size={16} />}
              {saving ? "Adding…" : "Add item"}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function OnboardingCard({
  appointment,
  items,
  expanded,
  activeSection,
  visibleItems,
  actionId,
  onToggle,
  onSectionChange,
  onAddItem,
  onUpdateItem,
  onProgress,
  onArchive,
}: {
  appointment: AppointmentView;
  items: OnboardingItem[];
  expanded: boolean;
  activeSection: OnboardingSection;
  visibleItems: OnboardingItem[];
  actionId: string | null;
  onToggle: () => void;
  onSectionChange: (section: OnboardingSection) => void;
  onAddItem: () => void;
  onUpdateItem: (item: OnboardingItem, status: ItemStatus) => void;
  onProgress: (changes: Partial<Appointment>, message: string) => void;
  onArchive: () => void;
}) {
  const initials = appointment.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const outstanding = items.filter(
    (item) => !["complete", "not_required"].includes(item.status),
  ).length;

  return (
    <article style={starterCardStyle}>
      <div style={starterHeadingStyle}>
        <div style={starterIdentityStyle}>
          <div style={starterAvatarStyle}>{initials || "—"}</div>
          <div>
            <h4 style={starterNameStyle}>{appointment.fullName}</h4>
            <p style={referenceStyle}>
              {appointment.appointment_reference} · {appointment.jobTitle}
            </p>
          </div>
        </div>

        <div style={badgeRowStyle}>
          <span style={getAppointmentStatusBadgeStyle(appointment.status)}>
            {appointmentStatusLabels[appointment.status]}
          </span>
          {appointment.archived_at ? (
            <span style={archivedBadgeStyle}>Archived</span>
          ) : null}
        </div>
      </div>

      <div style={starterDetailsGridStyle}>
        <Detail
          label="Start Date"
          value={formatDate(appointment.agreed_start_date)}
          help={
            appointment.actual_start_date
              ? `Actual: ${formatDate(appointment.actual_start_date)}`
              : "Agreed commencement"
          }
        />
        <Detail
          label="Manager"
          value={appointment.manager_name || "Not recorded"}
          help={appointment.department || "Department not recorded"}
        />
        <Detail
          label="Location"
          value={appointment.location_name || "Not recorded"}
          help={appointment.personalEmail || "No personal email"}
        />
        <Detail
          label="Progress"
          value={`${appointment.progress}%`}
          help={`${appointment.completedTaskCount} of ${appointment.taskCount} complete`}
        />
        <Detail
          label="Outstanding"
          value={String(outstanding)}
          help={
            appointment.overdueTaskCount
              ? `${appointment.overdueTaskCount} overdue`
              : "No overdue items"
          }
        />
        <Detail
          label="Blocked"
          value={String(appointment.blockedTaskCount)}
          help={
            appointment.blockedTaskCount
              ? "Requires attention"
              : "No blocked items"
          }
        />
      </div>

      <div style={progressTrackStyle}>
        <div
          style={{
            ...progressBarStyle,
            width: `${Math.min(100, Math.max(0, appointment.progress))}%`,
          }}
        />
      </div>

      {expanded ? (
        <div style={expandedAreaStyle}>
          <div style={starterOverviewGridStyle}>
            <InformationPanel title="Starter Information">
              <InformationRow
                label="Personal email"
                value={appointment.personalEmail || "Not recorded"}
              />
              <InformationRow
                label="Telephone"
                value={appointment.phone || "Not recorded"}
              />
              <InformationRow
                label="Department"
                value={appointment.department || "Not recorded"}
              />
              <InformationRow
                label="Manager"
                value={appointment.manager_name || "Not recorded"}
              />
              <InformationRow
                label="Location"
                value={appointment.location_name || "Not recorded"}
              />
            </InformationPanel>

            <InformationPanel title="Appointment Handover">
              <InformationRow
                label="Employee record"
                value={
                  appointment.employee_id
                    ? `Employee ${appointment.employee_id}`
                    : "Not yet created"
                }
              />
              <InformationRow
                label="Recruitment summary"
                value={
                  appointment.recruitment_summary_transferred
                    ? "Transferred"
                    : "Pending"
                }
              />
              <InformationRow
                label="Documents"
                value={
                  appointment.documents_transferred ? "Transferred" : "Pending"
                }
              />
              <InformationRow
                label="Learning pathway"
                value={
                  appointment.learning_pathway_triggered
                    ? "Triggered"
                    : "Not triggered"
                }
              />
              <InformationRow
                label="Handover"
                value={
                  appointment.handover_completed_at
                    ? "Completed"
                    : "Not completed"
                }
              />
            </InformationPanel>
          </div>

          <div style={sectionToolbarStyle}>
            <div style={sectionButtonRowStyle}>
              {onboardingSections.map((section) => (
                <button
                  key={section.value}
                  type="button"
                  onClick={() => onSectionChange(section.value)}
                  style={
                    activeSection === section.value
                      ? activeSectionButtonStyle
                      : sectionButtonStyle
                  }
                >
                  {section.label}
                </button>
              ))}
            </div>

            {activeSection !== "timeline" ? (
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={onAddItem}
              >
                <Plus size={15} />
                Add item
              </button>
            ) : null}
          </div>

          {activeSection === "timeline" ? (
            <div style={timelineGridStyle}>
              <TimelineStep label="Application" complete />
              <TimelineStep label="Interview" complete />
              <TimelineStep label="Offer accepted" complete />
              <TimelineStep label="Appointment created" complete />
              <TimelineStep
                label="Onboarding"
                complete={appointment.progress === 100}
                current={appointment.progress < 100}
              />
              <TimelineStep
                label="Employee created"
                complete={["employee_created", "started"].includes(
                  appointment.status,
                )}
                current={
                  appointment.status === "employee_creation_pending"
                }
              />
              <TimelineStep
                label="Date of commencement"
                complete={appointment.status === "started"}
                current={appointment.status === "employee_created"}
                detail={formatDate(appointment.agreed_start_date)}
              />
            </div>
          ) : (
            <div style={itemListStyle}>
              {visibleItems.length === 0 ? (
                <div style={emptyItemsStyle}>
                  {activeSection === "overview"
                    ? "No outstanding onboarding actions."
                    : "No items are recorded in this section."}
                </div>
              ) : (
                visibleItems.map((item) => (
                  <OnboardingItemCard
                    key={item.id}
                    item={item}
                    actioning={actionId === item.id}
                    onUpdate={(status) => onUpdateItem(item, status)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      ) : null}

      <div style={cardActionsStyle}>
        <button type="button" style={secondaryButtonStyle} onClick={onToggle}>
          {expanded ? "Hide details" : "View details"}
        </button>

        {!appointment.archived_at ? (
          <>
            {appointment.status === "pre_employment" ? (
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={() =>
                  onProgress(
                    { status: "checks_in_progress" },
                    "Checks moved into progress.",
                  )
                }
              >
                <ClipboardCheck size={15} />
                Start due diligence
              </button>
            ) : null}

            {appointment.status === "checks_in_progress" ? (
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={() =>
                  onProgress(
                    { status: "ready_to_start" },
                    "Onboarding marked ready for commencement.",
                  )
                }
              >
                <CheckCircle2 size={15} />
                Ready for commencement
              </button>
            ) : null}

            {appointment.status === "ready_to_start" ? (
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={() =>
                  onProgress(
                    { status: "employee_creation_pending" },
                    "Employee creation is now pending.",
                  )
                }
              >
                <UserCheck size={15} />
                Create employee
              </button>
            ) : null}

            {appointment.status === "employee_creation_pending" ? (
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={() =>
                  onProgress(
                    {
                      status: "employee_created",
                      employee_created_at: new Date().toISOString(),
                    },
                    "Employee creation recorded.",
                  )
                }
              >
                <UserCheck size={15} />
                Confirm employee created
              </button>
            ) : null}

            {appointment.status === "employee_created" ? (
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={() =>
                  onProgress(
                    {
                      status: "started",
                      actual_start_date: new Date()
                        .toISOString()
                        .slice(0, 10),
                      onboarding_transferred: true,
                    },
                    "Employment commencement recorded.",
                  )
                }
              >
                <CalendarDays size={15} />
                Confirm commencement
              </button>
            ) : null}

            <button
              type="button"
              style={archiveButtonStyle}
              onClick={onArchive}
            >
              <Archive size={15} />
              Archive
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}

function OnboardingItemCard({
  item,
  actioning,
  onUpdate,
}: {
  item: OnboardingItem;
  actioning: boolean;
  onUpdate: (status: ItemStatus) => void;
}) {
  const overdue = isPast(item.due_date) && item.status !== "complete";

  return (
    <div style={itemCardStyle}>
      <div style={itemHeadingStyle}>
        <div>
          <div style={badgeRowLeftStyle}>
            <h5 style={itemTitleStyle}>{item.item_name}</h5>
            <span style={categoryBadgeStyle}>
              {categoryLabels[item.item_category]}
            </span>
            {overdue ? <span style={overdueBadgeStyle}>Overdue</span> : null}
          </div>

          {item.description ? (
            <p style={itemDescriptionStyle}>{item.description}</p>
          ) : null}
        </div>

        <select
          value={item.status}
          onChange={(event) => onUpdate(event.target.value as ItemStatus)}
          disabled={actioning}
          style={statusSelectStyle}
        >
          {(
            Object.entries(itemStatusLabels) as Array<[ItemStatus, string]>
          ).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div style={itemMetaRowStyle}>
        <span>Owner: {ownerLabels[item.owner_type]}</span>
        <span>Due: {formatDate(item.due_date)}</span>
        <span>
          {item.candidate_visible ? "Visible to starter" : "Employer only"}
        </span>
        {Boolean(item.metadata?.mandatory ?? true) ? (
          <span>Mandatory</span>
        ) : null}
      </div>
    </div>
  );
}

function WorkspaceHeading() {
  return (
    <div style={workspaceHeaderStyle}>
      <div>
        <h2 style={workspaceTitleStyle}>Onboarding</h2>
        <p style={workspaceDescriptionStyle}>
          Manage every new starter from accepted offer through pre-employment
          checks, employee creation and their date of commencement.
        </p>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  active = false,
  warning = false,
  onClick,
}: {
  label: string;
  value: string;
  active?: boolean;
  warning?: boolean;
  onClick?: () => void;
}) {
  const style = active
    ? activeKpiCardStyle
    : warning
      ? warningKpiCardStyle
      : kpiCardStyle;

  return (
    <button
      type="button"
      style={style}
      onClick={onClick}
      aria-pressed={active}
    >
      <div style={kpiValueStyle}>{value}</div>
      <div style={kpiLabelStyle}>{label}</div>
    </button>
  );
}

function Detail({
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
      <strong style={detailValueStyle}>{value}</strong>
      {help ? <span style={detailHelpStyle}>{help}</span> : null}
    </div>
  );
}

function InformationPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div style={informationPanelStyle}>
      <h5 style={expandedPanelTitleStyle}>{title}</h5>
      <div style={informationListStyle}>{children}</div>
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
      <span style={informationLabelStyle}>{label}</span>
      <span style={informationValueStyle}>{value}</span>
    </div>
  );
}

function TimelineStep({
  label,
  complete = false,
  current = false,
  detail,
}: {
  label: string;
  complete?: boolean;
  current?: boolean;
  detail?: string;
}) {
  return (
    <div
      style={
        complete
          ? completeTimelineStepStyle
          : current
            ? currentTimelineStepStyle
            : timelineStepStyle
      }
    >
      <div style={timelineHeadingStyle}>
        <span
          style={
            complete
              ? completeTimelineDotStyle
              : current
                ? currentTimelineDotStyle
                : timelineDotStyle
          }
        >
          {complete ? "✓" : current ? "•" : ""}
        </span>
        <strong style={timelineLabelStyle}>{label}</strong>
      </div>
      {detail ? <span style={timelineDetailStyle}>{detail}</span> : null}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div style={modalBackdropStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            style={closeButtonStyle}
            aria-label={`Close ${title}`}
          >
            <X size={18} />
          </button>
        </div>
        <div style={modalBodyStyle}>{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label style={full ? fullFieldStyle : fieldStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label style={toggleStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        style={checkboxStyle}
      />
      <span style={toggleLabelStyle}>{label}</span>
    </label>
  );
}

function getAppointmentStatusBadgeStyle(
  status: AppointmentStatus,
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
    case "ready_to_start":
    case "employee_created":
    case "started":
      return {
        ...base,
        background: "#F5FFF9",
        borderColor: "#CFE5D7",
        color: "#41644D",
      };

    case "pre_employment":
    case "checks_in_progress":
    case "employee_creation_pending":
      return {
        ...base,
        background: "#F7F1FC",
        borderColor: "#CDB2E2",
        color: "#6E5084",
      };

    case "withdrawn":
    case "cancelled":
      return {
        ...base,
        background: "#F3F4F6",
        borderColor: "#D1D5DB",
        color: "#5B6470",
      };
  }
}

const workspaceHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "16px",
  marginBottom: "20px",
};

const workspaceTitleStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "24px",
  lineHeight: 1.2,
};

const workspaceDescriptionStyle: CSSProperties = {
  margin: "8px 0 0",
  maxWidth: "760px",
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
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const secondaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const compactButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  padding: "7px 10px",
  fontSize: "12px",
};

const archiveButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const kpiGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "12px",
  marginBottom: "18px",
};

const kpiCardStyle: CSSProperties = {
  width: "100%",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "14px",
  padding: "16px",
  textAlign: "left",
  cursor: "pointer",
};

const activeKpiCardStyle: CSSProperties = {
  ...kpiCardStyle,
  border: "1px solid #6E5084",
  boxShadow: "0 0 0 2px rgba(110, 80, 132, 0.10)",
};

const warningKpiCardStyle: CSSProperties = {
  ...kpiCardStyle,
  background: "#FFF9EE",
  border: "1px solid #E8D9B7",
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
  marginBottom: "14px",
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

const automationPanelStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "12px",
  marginBottom: "14px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "11px",
};

const automationTitleStyle: CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "12px",
};

const automationTextStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#6B7280",
  fontSize: "11px",
  lineHeight: 1.5,
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

const fullFieldStyle: CSSProperties = {
  ...fieldStyle,
  gridColumn: "1 / -1",
};

const fieldLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "12px",
  fontWeight: 700,
};

const searchInputWrapStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "0 12px",
  background: "#FFFFFF",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  padding: "10px 0",
  background: "transparent",
  color: "#111827",
  fontSize: "14px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: "40px",
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

const starterListStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const starterCardStyle: CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: "13px",
  padding: "16px",
  background: "#FFFFFF",
};

const starterHeadingStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
};

const starterIdentityStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  minWidth: 0,
};

const starterAvatarStyle: CSSProperties = {
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

const starterNameStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "16px",
};

const referenceStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "#6B7280",
  fontSize: "11px",
  overflowWrap: "anywhere",
};

const badgeRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: "6px",
};

const badgeRowLeftStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "6px",
};

const archivedBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  padding: "4px 8px",
  background: "#F3F4F6",
  border: "1px solid #D1D5DB",
  color: "#5B6470",
  fontSize: "11px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const starterDetailsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
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

const progressTrackStyle: CSSProperties = {
  height: "7px",
  marginTop: "15px",
  overflow: "hidden",
  background: "#EEF0F2",
  borderRadius: "999px",
};

const progressBarStyle: CSSProperties = {
  height: "100%",
  background: "#6E5084",
  borderRadius: "999px",
  transition: "width 180ms ease",
};

const expandedAreaStyle: CSSProperties = {
  marginTop: "16px",
  paddingTop: "16px",
  borderTop: "1px solid #EEF0F2",
};

const starterOverviewGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
  gridTemplateColumns: "145px minmax(0, 1fr)",
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

const sectionToolbarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "10px",
  marginTop: "14px",
  padding: "12px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "11px",
};

const sectionButtonRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
};

const sectionButtonStyle: CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "8px",
  padding: "7px 9px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const activeSectionButtonStyle: CSSProperties = {
  ...sectionButtonStyle,
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
};

const itemListStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  marginTop: "12px",
};

const itemCardStyle: CSSProperties = {
  padding: "13px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "11px",
};

const itemHeadingStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "12px",
};

const itemTitleStyle: CSSProperties = {
  margin: 0,
  color: "#374151",
  fontSize: "13px",
};

const itemDescriptionStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: 1.55,
};

const categoryBadgeStyle: CSSProperties = {
  display: "inline-flex",
  borderRadius: "999px",
  padding: "3px 7px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  color: "#6E5084",
  fontSize: "10px",
  fontWeight: 700,
};

const overdueBadgeStyle: CSSProperties = {
  ...categoryBadgeStyle,
  background: "#FFF7F7",
  border: "1px solid #EAD0D0",
  color: "#7B3F3F",
};

const statusSelectStyle: CSSProperties = {
  minHeight: "36px",
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
  padding: "7px 10px",
  background: "#FFFFFF",
  color: "#374151",
  fontSize: "12px",
};

const itemMetaRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
  marginTop: "10px",
  color: "#6B7280",
  fontSize: "10px",
};

const emptyItemsStyle: CSSProperties = {
  padding: "22px",
  background: "#F9FAFB",
  border: "1px dashed #D1D5DB",
  borderRadius: "10px",
  color: "#6B7280",
  fontSize: "12px",
  textAlign: "center",
};

const timelineGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "10px",
  marginTop: "12px",
};

const timelineStepStyle: CSSProperties = {
  padding: "13px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "11px",
};

const currentTimelineStepStyle: CSSProperties = {
  ...timelineStepStyle,
  background: "#F7F1FC",
  border: "1px solid #CDB2E2",
};

const completeTimelineStepStyle: CSSProperties = {
  ...timelineStepStyle,
  background: "#F5FFF9",
  border: "1px solid #CFE5D7",
};

const timelineHeadingStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const timelineDotStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "22px",
  height: "22px",
  borderRadius: "999px",
  background: "#E5E7EB",
  color: "#6B7280",
  fontSize: "11px",
  fontWeight: 800,
};

const currentTimelineDotStyle: CSSProperties = {
  ...timelineDotStyle,
  background: "#6E5084",
  color: "#FFFFFF",
};

const completeTimelineDotStyle: CSSProperties = {
  ...timelineDotStyle,
  background: "#41644D",
  color: "#FFFFFF",
};

const timelineLabelStyle: CSSProperties = {
  color: "#374151",
  fontSize: "12px",
};

const timelineDetailStyle: CSSProperties = {
  display: "block",
  marginTop: "7px",
  color: "#6B7280",
  fontSize: "10px",
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

const successPanelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  marginBottom: "18px",
  padding: "13px 14px",
  border: "1px solid #CFE5D7",
  borderRadius: "12px",
  background: "#F5FFF9",
  color: "#41644D",
};

const messageContentStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
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

const successTextStyle: CSSProperties = {
  color: "#41644D",
  fontSize: "12px",
};

const loadingPanelStyle: CSSProperties = {
  padding: "38px",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  background: "#F9FAFB",
  textAlign: "center",
};

const spinnerIconStyle: CSSProperties = {
  display: "block",
  margin: "0 auto 12px",
  color: "#6E5084",
  animation: "onboarding-spin 1s linear infinite",
};

const loadingTitleStyle: CSSProperties = {
  display: "block",
  color: "#111827",
  fontSize: "14px",
};

const loadingTextStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "13px",
};

const modalBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "18px",
  background: "rgba(17, 24, 39, 0.45)",
};

const modalStyle: CSSProperties = {
  width: "min(760px, 100%)",
  maxHeight: "92vh",
  overflowY: "auto",
  background: "#FFFFFF",
  borderRadius: "16px",
  boxShadow: "0 24px 60px rgba(17, 24, 39, 0.22)",
};

const modalHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  padding: "18px 20px",
  borderBottom: "1px solid #E5E7EB",
};

const modalTitleStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "18px",
};

const closeButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "34px",
  height: "34px",
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
  background: "#FFFFFF",
  color: "#6B7280",
  cursor: "pointer",
};

const modalBodyStyle: CSSProperties = {
  padding: "20px",
};

const modalIntroStyle: CSSProperties = {
  marginBottom: "16px",
  padding: "12px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "10px",
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: 1.55,
};

const twoColumnGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "12px",
};

const toggleGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "10px",
  marginTop: "14px",
};

const toggleStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "9px",
  padding: "12px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  cursor: "pointer",
};

const checkboxStyle: CSSProperties = {
  width: "16px",
  height: "16px",
  marginTop: "1px",
  accentColor: "#6E5084",
};

const toggleLabelStyle: CSSProperties = {
  color: "#374151",
  fontSize: "12px",
  fontWeight: 700,
  lineHeight: 1.45,
};

const modalActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "18px",
  paddingTop: "16px",
  borderTop: "1px solid #E5E7EB",
};