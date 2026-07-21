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
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

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
  ready_to_start: "Ready to start",
  employee_creation_pending: "Employee creation pending",
  employee_created: "Employee created",
  started: "Started",
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
    dueOffsetDays: -3,
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
    name: "Confirm first-day arrangements",
    category: "induction",
    description:
      "Send arrival time, location, contact details and first-day expectations.",
    ownerType: "manager",
    dueOffsetDays: -3,
    candidateVisible: true,
    candidateEditable: false,
    mandatory: true,
  },
  {
    key: "workplace_induction",
    name: "Complete workplace induction",
    category: "induction",
    description:
      "Complete the welcome, workplace and health and safety induction.",
    ownerType: "manager",
    dueOffsetDays: 0,
    candidateVisible: true,
    candidateEditable: false,
    mandatory: true,
  },
  {
    key: "first_week_checkin",
    name: "Complete first-week check-in",
    category: "manager_action",
    description:
      "Review wellbeing, access, workload, understanding and early support needs.",
    ownerType: "manager",
    dueOffsetDays: 5,
    candidateVisible: false,
    candidateEditable: false,
    mandatory: true,
  },
  {
    key: "probation_handover",
    name: "Hand onboarding into probation",
    category: "manager_action",
    description:
      "Transfer relevant onboarding information and outstanding actions into probation.",
    ownerType: "hr",
    dueOffsetDays: 30,
    candidateVisible: false,
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

  const loadData = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      const [
        appointmentsResult,
        itemsResult,
        offersResult,
        applicationsResult,
        candidatesResult,
        vacanciesResult,
      ] = await Promise.all([
        supabase
          .from("leo_talent_appointments")
          .select("*")
          .order("updated_at", { ascending: false }),
        supabase
          .from("leo_talent_onboarding_items")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("leo_talent_offers")
          .select(
            "id, application_id, vacancy_id, candidate_id, status, job_title, department, location_name, manager_name, manager_user_id, proposed_start_date, accepted_at, archived_at",
          )
          .is("archived_at", null),
        supabase
          .from("leo_talent_applications")
          .select("id, status, current_stage_key")
          .is("archived_at", null),
        supabase
          .from("leo_talent_candidates")
          .select("id, first_name, last_name, preferred_name, email, phone")
          .is("archived_at", null),
        supabase
          .from("leo_talent_vacancies")
          .select(
            "id, title, department, location_name, hiring_manager_name, hiring_manager_user_id",
          )
          .is("archived_at", null),
      ]);

      if (appointmentsResult.error) throw appointmentsResult.error;
      if (itemsResult.error) throw itemsResult.error;
      if (offersResult.error) throw offersResult.error;
      if (applicationsResult.error) throw applicationsResult.error;
      if (candidatesResult.error) throw candidatesResult.error;
      if (vacanciesResult.error) throw vacanciesResult.error;

      setAppointments((appointmentsResult.data ?? []) as Appointment[]);
      setItems((itemsResult.data ?? []) as OnboardingItem[]);
      setOffers((offersResult.data ?? []) as Offer[]);
      setApplications((applicationsResult.data ?? []) as Application[]);
      setCandidates((candidatesResult.data ?? []) as Candidate[]);
      setVacancies((vacanciesResult.data ?? []) as Vacancy[]);
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

  const availableOffers = useMemo(() => {
    const used = new Set(appointments.map((item) => item.offer_id));
    return offers
      .filter((offer) => offer.status === "accepted" && !used.has(offer.id))
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

  function generatedItems(appointmentId: string, startDate: string) {
    return itemTemplates
      .filter((template) => {
        if (template.conditional === "dbs") return createForm.includeDbs;
        if (template.conditional === "equipment")
          return createForm.includeEquipment;
        if (template.conditional === "learning")
          return createForm.includeLearning;
        return true;
      })
      .map((template) => ({
        organisation_id: null,
        appointment_id: appointmentId,
        item_key: template.key,
        item_name: template.name,
        item_category: template.category,
        description: template.description,
        owner_type: template.ownerType,
        due_date: addDays(startDate, template.dueOffsetDays),
        status: "not_started" as ItemStatus,
        candidate_visible: template.candidateVisible,
        candidate_editable: template.candidateEditable,
        metadata: { mandatory: template.mandatory },
      }));
  }

  async function createAppointment() {
    if (!createForm.offerId) return setError("Select an accepted offer.");
    if (!createForm.agreedStartDate)
      return setError("Enter the agreed start date.");

    const option = availableOffers.find(
      (item) => item.offer.id === createForm.offerId,
    );
    if (!option) return setError("The accepted offer is no longer available.");

    setSaving(true);
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from("leo_talent_appointments")
        .insert({
          organisation_id: null,
          offer_id: option.offer.id,
          application_id: option.offer.application_id,
          vacancy_id: option.offer.vacancy_id,
          candidate_id: option.offer.candidate_id,
          status: "pre_employment",
          agreed_start_date: createForm.agreedStartDate,
          manager_name: createForm.managerName.trim() || null,
          manager_user_id:
            option.offer.manager_user_id ??
            option.vacancy?.hiring_manager_user_id ??
            null,
          department: createForm.department.trim() || null,
          location_name: createForm.locationName.trim() || null,
        })
        .select("*")
        .single();

      if (insertError) throw insertError;
      const appointment = data as Appointment;

      const { data: createdItems, error: itemsError } = await supabase
        .from("leo_talent_onboarding_items")
        .insert(generatedItems(appointment.id, createForm.agreedStartDate))
        .select("*");

      if (itemsError) {
        await supabase
          .from("leo_talent_appointments")
          .delete()
          .eq("id", appointment.id);
        throw itemsError;
      }

      const application = applications.find(
        (item) => item.id === option.offer.application_id,
      );
      if (application) {
        const { error: applicationError } = await supabase
          .from("leo_talent_applications")
          .update({ status: "onboarding", current_stage_key: "onboarding" })
          .eq("id", application.id);
        if (applicationError) throw applicationError;
      }

      setAppointments((current) => [appointment, ...current]);
      setItems((current) => [
        ...current,
        ...((createdItems ?? []) as OnboardingItem[]),
      ]);
      setCreateForm(initialCreateForm);
      setShowCreate(false);
      setSelectedId(appointment.id);
      setNotice("Appointment created and onboarding checklist generated.");
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
      const { data, error: updateError } = await supabase
        .from("leo_talent_appointments")
        .update(changes)
        .eq("id", selected.id)
        .select("*")
        .single();
      if (updateError) throw updateError;
      setAppointments((current) =>
        current.map((item) =>
          item.id === selected.id ? (data as Appointment) : item,
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
      const complete = status === "complete";
      const { data, error: updateError } = await supabase
        .from("leo_talent_onboarding_items")
        .update({
          status,
          completed_at: complete ? new Date().toISOString() : null,
          completed_by: complete ? ownerLabels[item.owner_type] : null,
        })
        .eq("id", item.id)
        .select("*")
        .single();
      if (updateError) throw updateError;
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? (data as OnboardingItem) : entry,
        ),
      );
      setNotice(
        complete ? "Onboarding item completed." : "Onboarding item updated.",
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
      const key = `custom_${Date.now()}`;
      const { data, error: insertError } = await supabase
        .from("leo_talent_onboarding_items")
        .insert({
          organisation_id: selected.organisation_id,
          appointment_id: selected.id,
          item_key: key,
          item_name: taskForm.itemName.trim(),
          item_category: taskForm.category,
          description: taskForm.description.trim() || null,
          owner_type: taskForm.ownerType,
          due_date: taskForm.dueDate || null,
          status: "not_started",
          candidate_visible: taskForm.candidateVisible,
          candidate_editable: taskForm.candidateEditable,
          metadata: { mandatory: true, custom: true },
        })
        .select("*")
        .single();
      if (insertError) throw insertError;
      setItems((current) => [...current, data as OnboardingItem]);
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
      "Appointment archived.",
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
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
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
      <header className="mb-4 flex flex-col items-start justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6 lg:flex-row">
        <div>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.08em] text-[#6e5084]">
            LEO TALENT
          </p>
          <h1 className="text-3xl font-semibold text-slate-950">Onboarding</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Manage each accepted candidate from appointment through
            pre-employment checks, employee creation and their first day.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={exportView}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            <Download className="h-4 w-4" /> Export current view
          </button>
        </div>
      </header>

      {error && (
        <Banner tone="error" onClose={() => setError(null)}>
          {error}
        </Banner>
      )}
      {notice && <Banner tone="success">{notice}</Banner>}

      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Active onboarding" value={metrics.active} />
        <Metric label="Ready to start" value={metrics.ready} />
        <Metric label="Overdue items" value={metrics.overdue} />
        <Metric label="Employees created" value={metrics.employeeCreated} />
        <Metric label="Started" value={metrics.started} />
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 xl:sticky xl:top-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Starter journeys
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Select an appointment or begin onboarding from an accepted offer.
          </p>

          <div className="mt-4 rounded-xl border border-[#e8daf2] bg-[#f7f1fc] p-3">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Create onboarding for
            </label>
            <select
              value=""
              onChange={(event) => {
                selectOffer(event.target.value);
                if (event.target.value) setShowCreate(true);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">Select accepted candidate</option>
              {availableOffers.map(({ offer, candidate }) => (
                <option key={offer.id} value={offer.id}>
                  {candidate!.preferred_name || candidate!.first_name}{" "}
                  {candidate!.last_name} · {offer.job_title}
                </option>
              ))}
            </select>
          </div>

          <label className="mt-3 flex items-center gap-2 rounded-xl border border-slate-300 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search starter or role"
              className="min-w-0 flex-1 border-0 py-2.5 text-sm outline-none"
            />
          </label>

          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | AppointmentStatus)
                }
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm"
              >
                <option value="all">All statuses</option>
                {Object.entries(appointmentStatusLabels).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <button
              onClick={() => setShowArchived((value) => !value)}
              className="rounded-xl border border-slate-300 px-3 text-sm font-semibold"
            >
              {showArchived ? "Current" : "Archived"}
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No onboarding records match this view.
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-xl border p-3 text-left ${selectedId === item.id ? "border-[#cdb2e2] bg-[#f7f1fc]" : "border-slate-200 bg-white"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="truncate text-sm text-slate-950">
                      {item.fullName}
                    </strong>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">
                      {appointmentStatusLabels[item.status]}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-sm text-slate-600">
                    {item.jobTitle}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {formatDate(item.agreed_start_date)} · {item.progress}%
                    complete
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="min-w-0">
          {!selected ? (
            <div className="flex min-h-[440px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <Sparkles className="h-7 w-7 text-[#6e5084]" />
              <h2 className="mt-3 text-xl font-semibold text-slate-950">
                Select or create onboarding
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                The complete starter journey will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <section className="rounded-2xl border border-[#e5d9ef] bg-gradient-to-br from-[#f7f1fc] to-white p-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#6e5084]">
                      STARTER JOURNEY
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                      {selected.fullName}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {selected.jobTitle} · Starts{" "}
                      {formatDate(selected.agreed_start_date)}
                    </p>
                  </div>
                  <span className="rounded-full border border-[#cdb2e2] bg-white px-3 py-2 text-sm font-semibold text-[#6e5084]">
                    {appointmentStatusLabels[selected.status]}
                  </span>
                </div>
              </section>

              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Summary
                  label="Progress"
                  value={`${selected.progress}%`}
                  detail={`${selected.completedTaskCount} of ${selected.taskCount} items complete`}
                />
                <Summary
                  label="Manager"
                  value={selected.manager_name || "Not recorded"}
                  detail={selected.department || "Department not recorded"}
                />
                <Summary
                  label="Location"
                  value={selected.location_name || "Not recorded"}
                  detail={selected.personalEmail || "No personal email"}
                />
                <Summary
                  label="Outstanding"
                  value={String(
                    selected.overdueTaskCount + selected.blockedTaskCount,
                  )}
                  detail={
                    selected.overdueTaskCount
                      ? `${selected.overdueTaskCount} overdue`
                      : "No overdue items"
                  }
                />
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">
                      Onboarding checklist
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Track each action, owner, due date and candidate
                      visibility.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTask(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#cdb2e2] bg-[#f7f1fc] px-4 py-2.5 text-sm font-semibold text-[#6e5084]"
                  >
                    <Plus className="h-4 w-4" /> Add item
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {selectedItems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                      No onboarding items recorded.
                    </div>
                  ) : (
                    selectedItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-slate-900">
                                {item.item_name}
                              </h4>
                              <span className="rounded-full bg-[#f7f1fc] px-2 py-1 text-[11px] font-semibold text-[#6e5084]">
                                {categoryLabels[item.item_category]}
                              </span>
                              {isPast(item.due_date) &&
                                item.status !== "complete" && (
                                  <span className="rounded-full bg-[#fff7f7] px-2 py-1 text-[11px] font-semibold text-[#7b3f3f]">
                                    Overdue
                                  </span>
                                )}
                            </div>
                            {item.description && (
                              <p className="mt-2 text-sm leading-6 text-slate-500">
                                {item.description}
                              </p>
                            )}
                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                              <span>Owner: {ownerLabels[item.owner_type]}</span>
                              <span>Due: {formatDate(item.due_date)}</span>
                              <span>
                                {item.candidate_visible
                                  ? "Visible to starter"
                                  : "Employer only"}
                              </span>
                            </div>
                          </div>
                          <select
                            value={item.status}
                            disabled={actionId === item.id}
                            onChange={(e) =>
                              void updateItem(
                                item,
                                e.target.value as ItemStatus,
                              )
                            }
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          >
                            {Object.entries(itemStatusLabels).map(
                              ([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ),
                            )}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-slate-950">
                  Progress appointment
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Move the appointment through the existing Talent workflow.
                </p>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {selected.status === "pre_employment" && (
                    <ActionButton
                      onClick={() =>
                        void updateAppointment(
                          { status: "checks_in_progress" },
                          "Checks moved into progress.",
                        )
                      }
                    >
                      Start checks
                    </ActionButton>
                  )}
                  {selected.status === "checks_in_progress" && (
                    <ActionButton
                      onClick={() =>
                        void updateAppointment(
                          { status: "ready_to_start" },
                          "Appointment marked ready to start.",
                        )
                      }
                    >
                      Mark ready to start
                    </ActionButton>
                  )}
                  {selected.status === "ready_to_start" && (
                    <ActionButton
                      onClick={() =>
                        void updateAppointment(
                          { status: "employee_creation_pending" },
                          "Employee creation is now pending.",
                        )
                      }
                    >
                      Prepare employee record
                    </ActionButton>
                  )}
                  {selected.status === "employee_creation_pending" && (
                    <ActionButton
                      onClick={() =>
                        void updateAppointment(
                          {
                            status: "employee_created",
                            employee_created_at: new Date().toISOString(),
                          },
                          "Employee creation recorded.",
                        )
                      }
                    >
                      Record employee created
                    </ActionButton>
                  )}
                  {selected.status === "employee_created" && (
                    <ActionButton
                      onClick={() =>
                        void updateAppointment(
                          {
                            status: "started",
                            actual_start_date: new Date()
                              .toISOString()
                              .slice(0, 10),
                            onboarding_transferred: true,
                          },
                          "Starter marked as started.",
                        )
                      }
                    >
                      Confirm started
                    </ActionButton>
                  )}
                  {!selected.archived_at && (
                    <button
                      onClick={() => void archiveAppointment()}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
                    >
                      <Archive className="h-4 w-4" /> Archive
                    </button>
                  )}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {showCreate && (
        <Modal title="Start onboarding" onClose={() => setShowCreate(false)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Accepted offer" full>
              <select
                value={createForm.offerId}
                onChange={(e) => selectOffer(e.target.value)}
                className={inputClass}
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
                onChange={(e) =>
                  setCreateForm((c) => ({
                    ...c,
                    agreedStartDate: e.target.value,
                  }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Manager">
              <input
                value={createForm.managerName}
                onChange={(e) =>
                  setCreateForm((c) => ({ ...c, managerName: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Department">
              <input
                value={createForm.department}
                onChange={(e) =>
                  setCreateForm((c) => ({ ...c, department: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Location">
              <input
                value={createForm.locationName}
                onChange={(e) =>
                  setCreateForm((c) => ({ ...c, locationName: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Toggle
              label="Include DBS or safeguarding clearance"
              checked={createForm.includeDbs}
              onChange={(value) =>
                setCreateForm((c) => ({ ...c, includeDbs: value }))
              }
            />
            <Toggle
              label="Include equipment preparation"
              checked={createForm.includeEquipment}
              onChange={(value) =>
                setCreateForm((c) => ({ ...c, includeEquipment: value }))
              }
            />
            <Toggle
              label="Include Leo Learn assignments"
              checked={createForm.includeLearning}
              onChange={(value) =>
                setCreateForm((c) => ({ ...c, includeLearning: value }))
              }
            />
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => void createAppointment()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6e5084] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ClipboardCheck className="h-4 w-4" />
              )}{" "}
              Create appointment
            </button>
          </div>
        </Modal>
      )}

      {showTask && selected && (
        <Modal title="Add onboarding item" onClose={() => setShowTask(false)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Item name" full>
              <input
                value={taskForm.itemName}
                onChange={(e) =>
                  setTaskForm((c) => ({ ...c, itemName: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Description" full>
              <textarea
                rows={4}
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm((c) => ({ ...c, description: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Category">
              <select
                value={taskForm.category}
                onChange={(e) =>
                  setTaskForm((c) => ({
                    ...c,
                    category: e.target.value as ItemCategory,
                  }))
                }
                className={inputClass}
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
                onChange={(e) =>
                  setTaskForm((c) => ({
                    ...c,
                    ownerType: e.target.value as ItemOwnerType,
                  }))
                }
                className={inputClass}
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
                onChange={(e) =>
                  setTaskForm((c) => ({ ...c, dueDate: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Toggle
              label="Visible to new starter"
              checked={taskForm.candidateVisible}
              onChange={(value) =>
                setTaskForm((c) => ({ ...c, candidateVisible: value }))
              }
            />
            <Toggle
              label="Editable by new starter"
              checked={taskForm.candidateEditable}
              onChange={(value) =>
                setTaskForm((c) => ({ ...c, candidateEditable: value }))
              }
            />
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              onClick={() => setShowTask(false)}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => void createTask()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6e5084] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}{" "}
              Add item
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#a983c2] focus:ring-4 focus:ring-[#f7f1fc]";

function Banner({
  tone,
  children,
  onClose,
}: {
  tone: "error" | "success";
  children: ReactNode;
  onClose?: () => void;
}) {
  const error = tone === "error";
  return (
    <div
      className={`mb-3 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${error ? "border-[#f2caca] bg-[#fff7f7] text-[#8a2e2e]" : "border-[#cde5d6] bg-[#f5fff9] text-[#276749]"}`}
    >
      <div className="flex items-start gap-3">
        {error ? (
          <CircleAlert className="mt-0.5 h-4 w-4" />
        ) : (
          <Check className="mt-0.5 h-4 w-4" />
        )}
        <span>{children}</span>
      </div>
      {onClose && (
        <button onClick={onClose}>
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm text-slate-600">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-[#6e5084]">{value}</div>
    </div>
  );
}

function Summary({
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
      <div className="mt-1 text-xs text-slate-500">{detail}</div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl bg-[#6e5084] px-4 py-2.5 text-sm font-semibold text-white"
    >
      <CheckCircle2 className="h-4 w-4" />
      {children}
    </button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
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
    <label className={full ? "sm:col-span-2" : ""}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
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
    <label className="flex items-start gap-3 rounded-2xl border border-[#eadff2] bg-[#fcf9fe] p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4"
      />
      <span className="text-sm font-semibold text-slate-900">{label}</span>
    </label>
  );
}