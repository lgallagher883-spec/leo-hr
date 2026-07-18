"use client";

import { createClient } from "@supabase/supabase-js";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import ProfileSection from "./ProfileSection";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type LeaveAbsenceProps = {
  employeeId: number;
};

type PlatformRole = "Owner" | "Senior" | "Manager" | "Employee";

type LeaveStatus =
  | "Draft"
  | "Submitted"
  | "Approved"
  | "Declined"
  | "Returned"
  | "Cancelled"
  | "Completed";

type DayPortion = "Full day" | "Half day - morning" | "Half day - afternoon";

type RecordCategory =
  | "Annual leave"
  | "Absence"
  | "Family leave"
  | "Special leave"
  | "Employment arrangement";

type LeaveMetadata = {
  version: 1;
  employeeNotes: string;
  managerComments: string;
  dayPortion: DayPortion;
  submittedAt: string | null;
  submittedBy: string | null;
  decisionAt: string | null;
  decisionBy: string | null;
  returnedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string;
  recordCategory: RecordCategory;
  calculatedDays: number | null;
  manuallyAdjusted: boolean;
  source: "Employee" | "Manager" | "Senior" | "Owner" | "Legacy";
  futureCalendarSync: boolean;
};

type LeaveRecord = {
  id: number;
  employee_id?: number;
  leave_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  days_taken: number | string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string | null;
};

type ParsedLeaveRecord = LeaveRecord & {
  normalisedStatus: LeaveStatus;
  metadata: LeaveMetadata;
};

type LeaveFormState = {
  leaveType: string;
  startDate: string;
  endDate: string;
  dayPortion: DayPortion;
  employeeNotes: string;
  calculatedDays: number;
  manualDays: string;
  useManualDays: boolean;
};

type DecisionMode = "approve" | "decline" | "return" | null;

type LeaveView = "Requests" | "Upcoming" | "History";

type MessageTone = "success" | "error" | "information";

const metadataPrefix = "LEO_LEAVE_METADATA_V1:";

const roleRank: Record<PlatformRole, number> = {
  Employee: 1,
  Manager: 2,
  Senior: 3,
  Owner: 4,
};

const leaveTypeDefinitions: Array<{
  label: string;
  category: RecordCategory;
  requiresApproval: boolean;
  deductsAnnualLeave: boolean;
}> = [
  {
    label: "Annual Leave",
    category: "Annual leave",
    requiresApproval: true,
    deductsAnnualLeave: true,
  },
  {
    label: "Half Day Leave",
    category: "Annual leave",
    requiresApproval: true,
    deductsAnnualLeave: true,
  },
  {
    label: "Unpaid Leave",
    category: "Special leave",
    requiresApproval: true,
    deductsAnnualLeave: false,
  },
  {
    label: "Sickness Absence",
    category: "Absence",
    requiresApproval: false,
    deductsAnnualLeave: false,
  },
  {
    label: "Medical Appointment",
    category: "Special leave",
    requiresApproval: true,
    deductsAnnualLeave: false,
  },
  {
    label: "Hospital Appointment",
    category: "Special leave",
    requiresApproval: true,
    deductsAnnualLeave: false,
  },
  {
    label: "Compassionate Leave",
    category: "Special leave",
    requiresApproval: true,
    deductsAnnualLeave: false,
  },
  {
    label: "Time Off for Dependants",
    category: "Special leave",
    requiresApproval: true,
    deductsAnnualLeave: false,
  },
  {
    label: "Carer's Leave",
    category: "Special leave",
    requiresApproval: true,
    deductsAnnualLeave: false,
  },
  {
    label: "Maternity Leave",
    category: "Family leave",
    requiresApproval: false,
    deductsAnnualLeave: false,
  },
  {
    label: "Paternity Leave",
    category: "Family leave",
    requiresApproval: false,
    deductsAnnualLeave: false,
  },
  {
    label: "Adoption Leave",
    category: "Family leave",
    requiresApproval: false,
    deductsAnnualLeave: false,
  },
  {
    label: "Shared Parental Leave",
    category: "Family leave",
    requiresApproval: false,
    deductsAnnualLeave: false,
  },
  {
    label: "Parental Leave",
    category: "Family leave",
    requiresApproval: true,
    deductsAnnualLeave: false,
  },
  {
    label: "Parental Bereavement Leave",
    category: "Family leave",
    requiresApproval: false,
    deductsAnnualLeave: false,
  },
  {
    label: "Neonatal Care Leave",
    category: "Family leave",
    requiresApproval: false,
    deductsAnnualLeave: false,
  },
  {
    label: "Jury Service",
    category: "Special leave",
    requiresApproval: false,
    deductsAnnualLeave: false,
  },
  {
    label: "Public Duties",
    category: "Special leave",
    requiresApproval: true,
    deductsAnnualLeave: false,
  },
  {
    label: "Military Reserve Leave",
    category: "Special leave",
    requiresApproval: true,
    deductsAnnualLeave: false,
  },
  {
    label: "Study Leave",
    category: "Special leave",
    requiresApproval: true,
    deductsAnnualLeave: false,
  },
  {
    label: "Sabbatical",
    category: "Special leave",
    requiresApproval: true,
    deductsAnnualLeave: false,
  },
  {
    label: "Time Off in Lieu (TOIL)",
    category: "Special leave",
    requiresApproval: true,
    deductsAnnualLeave: false,
  },
  {
    label: "Garden Leave",
    category: "Employment arrangement",
    requiresApproval: false,
    deductsAnnualLeave: false,
  },
  {
    label: "Furlough",
    category: "Employment arrangement",
    requiresApproval: false,
    deductsAnnualLeave: false,
  },
  {
    label: "Other",
    category: "Special leave",
    requiresApproval: true,
    deductsAnnualLeave: false,
  },
];

const leaveTypes = leaveTypeDefinitions.map((definition) => definition.label);

const dayPortionOptions: DayPortion[] = [
  "Full day",
  "Half day - morning",
  "Half day - afternoon",
];

const initialFormState: LeaveFormState = {
  leaveType: "Annual Leave",
  startDate: "",
  endDate: "",
  dayPortion: "Full day",
  employeeNotes: "",
  calculatedDays: 0,
  manualDays: "",
  useManualDays: false,
};

export default function LeaveAbsence({ employeeId }: LeaveAbsenceProps) {
  const [records, setRecords] = useState<ParsedLeaveRecord[]>([]);
  const [annualLeaveAllowance, setAnnualLeaveAllowance] = useState(0);

  const [platformRole, setPlatformRole] =
    useState<PlatformRole>("Owner");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<LeaveView>("Requests");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [form, setForm] = useState<LeaveFormState>(initialFormState);

  const [editingRecordId, setEditingRecordId] =
    useState<number | null>(null);
  const [editForm, setEditForm] =
    useState<LeaveFormState>(initialFormState);

  const [decisionRecordId, setDecisionRecordId] =
    useState<number | null>(null);
  const [decisionMode, setDecisionMode] =
    useState<DecisionMode>(null);
  const [decisionComments, setDecisionComments] = useState("");

  const [cancellingRecordId, setCancellingRecordId] =
    useState<number | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionInProgress, setActionInProgress] =
    useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] =
    useState<MessageTone>("information");

  const hasPermission = useCallback(
    (minimumRole: PlatformRole) =>
      roleRank[platformRole] >= roleRank[minimumRole],
    [platformRole]
  );

  const canApprove = hasPermission("Manager");
  const canManageRecords = hasPermission("Senior");
  const isEmployeeView = platformRole === "Employee";

  const selectedLeaveDefinition = useMemo(
    () =>
      leaveTypeDefinitions.find(
        (definition) => definition.label === form.leaveType
      ) || leaveTypeDefinitions[0],
    [form.leaveType]
  );

  const selectedEditLeaveDefinition = useMemo(
    () =>
      leaveTypeDefinitions.find(
        (definition) => definition.label === editForm.leaveType
      ) || leaveTypeDefinitions[0],
    [editForm.leaveType]
  );

  const loadCurrentUser = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPlatformRole("Owner");
        setCurrentUserId(null);
        return;
      }

      setCurrentUserId(user.id);

      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !profile) {
        setPlatformRole("Owner");
        return;
      }

      const rawRole =
        readString(profile.platform_role) ||
        readString(profile.role) ||
        readString(profile.access_level);

      setPlatformRole(normalisePlatformRole(rawRole));
    } catch (error) {
      console.warn("User role could not be loaded:", error);
      setPlatformRole("Owner");
      setCurrentUserId(null);
    }
  }, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("employee_leave_records")
      .select("*")
      .eq("employee_id", employeeId)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Error loading leave records:", error);
      showMessage(
        "Leave and absence records could not be loaded.",
        "error"
      );
      setRecords([]);
      setLoading(false);
      return;
    }

    const parsedRecords = (data || []).map((record) =>
      parseLeaveRecord(record as LeaveRecord)
    );

    setRecords(parsedRecords);
    setLoading(false);
  }, [employeeId]);

  const loadAnnualLeaveAllowance = useCallback(async () => {
    const { data, error } = await supabase
      .from("employee_employment_details")
      .select("annual_leave_allowance")
      .eq("employee_id", employeeId)
      .maybeSingle();

    if (error) {
      console.error("Error loading annual leave allowance:", error);
      return;
    }

    const allowance = Number(data?.annual_leave_allowance || 0);

    setAnnualLeaveAllowance(
      Number.isNaN(allowance) ? 0 : allowance
    );
  }, [employeeId]);

  useEffect(() => {
    void Promise.all([
      loadCurrentUser(),
      loadRecords(),
      loadAnnualLeaveAllowance(),
    ]);
  }, [
    loadCurrentUser,
    loadRecords,
    loadAnnualLeaveAllowance,
  ]);

  useEffect(() => {
    const calculatedDays = calculateRequestedDays(
      form.startDate,
      form.endDate,
      form.dayPortion
    );

    setForm((current) => ({
      ...current,
      calculatedDays,
    }));
  }, [form.startDate, form.endDate, form.dayPortion]);

  useEffect(() => {
    const calculatedDays = calculateRequestedDays(
      editForm.startDate,
      editForm.endDate,
      editForm.dayPortion
    );

    setEditForm((current) => ({
      ...current,
      calculatedDays,
    }));
  }, [
    editForm.startDate,
    editForm.endDate,
    editForm.dayPortion,
  ]);

  const annualLeaveRecords = useMemo(
    () =>
      records.filter((record) =>
        doesLeaveTypeDeductAnnualLeave(record.leave_type)
      ),
    [records]
  );

  const annualLeaveTaken = useMemo(
    () =>
      sumLeaveDays(
        annualLeaveRecords.filter(
          (record) =>
            record.normalisedStatus === "Completed" ||
            (record.normalisedStatus === "Approved" &&
              isPastDate(record.end_date || record.start_date))
        )
      ),
    [annualLeaveRecords]
  );

  const annualLeaveBooked = useMemo(
    () =>
      sumLeaveDays(
        annualLeaveRecords.filter(
          (record) =>
            record.normalisedStatus === "Approved" &&
            !isPastDate(record.end_date || record.start_date)
        )
      ),
    [annualLeaveRecords]
  );

  const annualLeavePending = useMemo(
    () =>
      sumLeaveDays(
        annualLeaveRecords.filter(
          (record) =>
            record.normalisedStatus === "Submitted" ||
            record.normalisedStatus === "Returned"
        )
      ),
    [annualLeaveRecords]
  );

  const annualLeaveConfirmed =
    annualLeaveTaken + annualLeaveBooked;

  const annualLeaveRemaining = Math.max(
    annualLeaveAllowance - annualLeaveConfirmed,
    0
  );

  const requestDays = getEffectiveDays(form);

  const remainingAfterRequest = Math.max(
    annualLeaveRemaining -
      (selectedLeaveDefinition.deductsAnnualLeave
        ? requestDays
        : 0),
    0
  );

  const pendingRequests = useMemo(
    () =>
      records.filter(
        (record) =>
          record.normalisedStatus === "Submitted" ||
          record.normalisedStatus === "Returned"
      ),
    [records]
  );

  const upcomingLeave = useMemo(
    () =>
      records.filter(
        (record) =>
          record.normalisedStatus === "Approved" &&
          !isPastDate(record.end_date || record.start_date)
      ),
    [records]
  );

  const leaveHistory = useMemo(
    () =>
      records.filter(
        (record) =>
          record.normalisedStatus === "Completed" ||
          record.normalisedStatus === "Declined" ||
          record.normalisedStatus === "Cancelled" ||
          (record.normalisedStatus === "Approved" &&
            isPastDate(record.end_date || record.start_date))
      ),
    [records]
  );

  const visibleRecords = useMemo(() => {
    if (activeView === "Requests") return pendingRequests;
    if (activeView === "Upcoming") return upcomingLeave;

    return leaveHistory;
  }, [
    activeView,
    pendingRequests,
    upcomingLeave,
    leaveHistory,
  ]);

  function showMessage(text: string, tone: MessageTone) {
    setMessage(text);
    setMessageTone(tone);
  }

  function updateForm<K extends keyof LeaveFormState>(
    field: K,
    value: LeaveFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateEditForm<K extends keyof LeaveFormState>(
    field: K,
    value: LeaveFormState[K]
  ) {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetRequestForm() {
    setForm(initialFormState);
    setShowRequestForm(false);
  }

  function validateForm(
    formState: LeaveFormState
  ): string | null {
    if (!formState.startDate) {
      return "Please add a start date.";
    }

    const effectiveEndDate =
      formState.endDate || formState.startDate;

    if (
      compareDateOnly(
        effectiveEndDate,
        formState.startDate
      ) < 0
    ) {
      return "The end date cannot be before the start date.";
    }

    const effectiveDays = getEffectiveDays(formState);

    if (effectiveDays <= 0) {
      return "The requested period does not contain any working days.";
    }

    if (
      formState.useManualDays &&
      (!formState.manualDays ||
        Number(formState.manualDays) <= 0)
    ) {
      return "Enter a valid adjusted number of days.";
    }

    return null;
  }

  function findOverlappingRecord(
    formState: LeaveFormState,
    ignoreRecordId?: number
  ): ParsedLeaveRecord | null {
    const requestedStart = formState.startDate;
    const requestedEnd =
      formState.endDate || formState.startDate;

    return (
      records.find((record) => {
        if (record.id === ignoreRecordId) return false;

        if (
          record.normalisedStatus === "Cancelled" ||
          record.normalisedStatus === "Declined"
        ) {
          return false;
        }

        const recordStart = record.start_date;
        const recordEnd =
          record.end_date || record.start_date;

        if (!recordStart || !recordEnd) return false;

        return dateRangesOverlap(
          requestedStart,
          requestedEnd,
          recordStart,
          recordEnd
        );
      }) || null
    );
  }

  async function submitRequest() {
    const validationError = validateForm(form);

    if (validationError) {
      showMessage(validationError, "error");
      return;
    }

    const overlappingRecord = findOverlappingRecord(form);

    if (overlappingRecord) {
      showMessage(
        `This request overlaps with an existing ${overlappingRecord.leave_type.toLowerCase()} record from ${formatDate(
          overlappingRecord.start_date
        )} to ${formatDate(
          overlappingRecord.end_date ||
            overlappingRecord.start_date
        )}.`,
        "error"
      );
      return;
    }

    const effectiveDays = getEffectiveDays(form);

    if (
      selectedLeaveDefinition.deductsAnnualLeave &&
      effectiveDays > annualLeaveRemaining
    ) {
      const confirmed = window.confirm(
        `This request is for ${formatDays(
          effectiveDays
        )}, but the employee currently has ${formatDays(
          annualLeaveRemaining
        )} confirmed annual leave remaining.\n\nSubmit the request for review anyway?`
      );

      if (!confirmed) return;
    }

    setSaving(true);
    showMessage("", "information");

    const requiresApproval =
      selectedLeaveDefinition.requiresApproval;

    const newStatus: LeaveStatus = requiresApproval
      ? "Submitted"
      : canManageRecords
      ? "Approved"
      : "Submitted";

    const now = new Date().toISOString();

    const metadata: LeaveMetadata = {
      version: 1,
      employeeNotes: form.employeeNotes.trim(),
      managerComments: "",
      dayPortion: form.dayPortion,
      submittedAt: now,
      submittedBy: currentUserId,
      decisionAt:
        newStatus === "Approved" ? now : null,
      decisionBy:
        newStatus === "Approved" ? currentUserId : null,
      returnedAt: null,
      cancelledAt: null,
      cancellationReason: "",
      recordCategory: selectedLeaveDefinition.category,
      calculatedDays: form.calculatedDays,
      manuallyAdjusted: form.useManualDays,
      source: platformRole,
      futureCalendarSync: false,
    };

    const { data, error } = await supabase
      .from("employee_leave_records")
      .insert({
        employee_id: employeeId,
        leave_type: form.leaveType,
        status: newStatus,
        start_date: form.startDate,
        end_date: form.endDate || form.startDate,
        days_taken: effectiveDays,
        notes: serialiseLeaveMetadata(metadata),
        updated_at: now,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error submitting leave request:", error);
      showMessage(
        "The leave request could not be submitted.",
        "error"
      );
      setSaving(false);
      return;
    }

    await recordLeaveAuditEvent(
      employeeId,
      "Leave request submitted",
      `${form.leaveType} was submitted for ${formatDateRange(
        form.startDate,
        form.endDate || form.startDate
      )}.`,
      {
        leave_record_id: data?.id,
        status: newStatus,
        days: effectiveDays,
        future_calendar_sync: false,
      }
    );

    await recordTimelineEvent(
      employeeId,
      data?.id,
      newStatus === "Approved"
        ? "Leave recorded"
        : "Leave requested",
      `${form.leaveType} · ${formatDateRange(
        form.startDate,
        form.endDate || form.startDate
      )} · ${formatDays(effectiveDays)}.`,
      newStatus === "Approved"
        ? "Leave approved"
        : "Awaiting manager review"
    );

    resetRequestForm();
    setActiveView(
      newStatus === "Approved" ? "Upcoming" : "Requests"
    );
    showMessage(
      newStatus === "Approved"
        ? "The leave record has been added."
        : "The leave request has been submitted for review.",
      "success"
    );
    setSaving(false);

    await loadRecords();
  }

  function startEditing(record: ParsedLeaveRecord) {
    setEditingRecordId(record.id);

    setEditForm({
      leaveType: record.leave_type || "Annual Leave",
      startDate: record.start_date || "",
      endDate: record.end_date || record.start_date || "",
      dayPortion: record.metadata.dayPortion,
      employeeNotes: record.metadata.employeeNotes,
      calculatedDays:
        record.metadata.calculatedDays ??
        Number(record.days_taken || 0),
      manualDays: record.metadata.manuallyAdjusted
        ? String(record.days_taken || "")
        : "",
      useManualDays: record.metadata.manuallyAdjusted,
    });

    setDecisionRecordId(null);
    setDecisionMode(null);
    setDecisionComments("");
    showMessage("", "information");
  }

  function cancelEditing() {
    setEditingRecordId(null);
    setEditForm(initialFormState);
  }

  async function saveEditedRecord(record: ParsedLeaveRecord) {
    const validationError = validateForm(editForm);

    if (validationError) {
      showMessage(validationError, "error");
      return;
    }

    const overlappingRecord = findOverlappingRecord(
      editForm,
      record.id
    );

    if (overlappingRecord) {
      showMessage(
        `The amended dates overlap with an existing ${overlappingRecord.leave_type.toLowerCase()} record.`,
        "error"
      );
      return;
    }

    const effectiveDays = getEffectiveDays(editForm);
    const now = new Date().toISOString();

    const metadata: LeaveMetadata = {
      ...record.metadata,
      employeeNotes: editForm.employeeNotes.trim(),
      dayPortion: editForm.dayPortion,
      recordCategory:
        selectedEditLeaveDefinition.category,
      calculatedDays: editForm.calculatedDays,
      manuallyAdjusted: editForm.useManualDays,
    };

    /*
      A returned request becomes submitted again when the employee
      or an authorised user makes the requested amendments.
    */
    const nextStatus: LeaveStatus =
      record.normalisedStatus === "Returned"
        ? "Submitted"
        : record.normalisedStatus;

    setSaving(true);

    const { error } = await supabase
      .from("employee_leave_records")
      .update({
        leave_type: editForm.leaveType,
        status: nextStatus,
        start_date: editForm.startDate,
        end_date:
          editForm.endDate || editForm.startDate,
        days_taken: effectiveDays,
        notes: serialiseLeaveMetadata(metadata),
        updated_at: now,
      })
      .eq("id", record.id)
      .eq("employee_id", employeeId);

    if (error) {
      console.error("Error updating leave record:", error);
      showMessage(
        "The leave record could not be updated.",
        "error"
      );
      setSaving(false);
      return;
    }

    await recordLeaveAuditEvent(
      employeeId,
      "Leave record updated",
      `${editForm.leaveType} was updated for ${formatDateRange(
        editForm.startDate,
        editForm.endDate || editForm.startDate
      )}.`,
      {
        leave_record_id: record.id,
        previous_status: record.normalisedStatus,
        new_status: nextStatus,
        days: effectiveDays,
      }
    );

    await recordTimelineEvent(
      employeeId,
      record.id,
      "Leave record updated",
      `${editForm.leaveType} · ${formatDateRange(
        editForm.startDate,
        editForm.endDate || editForm.startDate
      )} · ${formatDays(effectiveDays)}.`,
      nextStatus
    );

    cancelEditing();
    showMessage(
      nextStatus === "Submitted" &&
        record.normalisedStatus === "Returned"
        ? "The amended request has been resubmitted."
        : "The leave record has been updated.",
      "success"
    );
    setSaving(false);

    await loadRecords();
  }
    function openDecision(
    record: ParsedLeaveRecord,
    mode: Exclude<DecisionMode, null>
  ) {
    setDecisionRecordId(record.id);
    setDecisionMode(mode);
    setDecisionComments(record.metadata.managerComments || "");
    setEditingRecordId(null);
    showMessage("", "information");
  }

  function closeDecision() {
    setDecisionRecordId(null);
    setDecisionMode(null);
    setDecisionComments("");
  }

  async function completeDecision(record: ParsedLeaveRecord) {
    if (!decisionMode || actionInProgress === record.id) return;

    if (
      (decisionMode === "decline" || decisionMode === "return") &&
      !decisionComments.trim()
    ) {
      showMessage(
        decisionMode === "decline"
          ? "Please add a reason before declining the request."
          : "Please explain what clarification or amendment is needed.",
        "error"
      );
      return;
    }

    const nextStatus: LeaveStatus =
      decisionMode === "approve"
        ? "Approved"
        : decisionMode === "decline"
        ? "Declined"
        : "Returned";

    const now = new Date().toISOString();

    const metadata: LeaveMetadata = {
      ...record.metadata,
      managerComments: decisionComments.trim(),
      decisionAt:
        nextStatus === "Approved" || nextStatus === "Declined"
          ? now
          : record.metadata.decisionAt,
      decisionBy:
        nextStatus === "Approved" || nextStatus === "Declined"
          ? currentUserId
          : record.metadata.decisionBy,
      returnedAt:
        nextStatus === "Returned"
          ? now
          : record.metadata.returnedAt,
    };

    setActionInProgress(record.id);

    const { error } = await supabase
      .from("employee_leave_records")
      .update({
        status: nextStatus,
        notes: serialiseLeaveMetadata(metadata),
        updated_at: now,
      })
      .eq("id", record.id)
      .eq("employee_id", employeeId);

    if (error) {
      console.error("Error updating leave decision:", error);
      showMessage(
        "The leave request decision could not be saved.",
        "error"
      );
      setActionInProgress(null);
      return;
    }

    const actionTitle =
      nextStatus === "Approved"
        ? "Leave request approved"
        : nextStatus === "Declined"
        ? "Leave request declined"
        : "Leave request returned";

    await recordLeaveAuditEvent(
      employeeId,
      actionTitle,
      `${record.leave_type} for ${formatDateRange(
        record.start_date,
        record.end_date || record.start_date
      )} was ${nextStatus.toLowerCase()}.`,
      {
        leave_record_id: record.id,
        previous_status: record.normalisedStatus,
        new_status: nextStatus,
        comments: decisionComments.trim(),
      }
    );

    await recordTimelineEvent(
      employeeId,
      record.id,
      actionTitle,
      `${record.leave_type} · ${formatDateRange(
        record.start_date,
        record.end_date || record.start_date
      )} · ${formatDays(
        Number(record.days_taken || 0)
      )}.`,
      nextStatus
    );

    closeDecision();
    showMessage(
      nextStatus === "Approved"
        ? "The leave request has been approved."
        : nextStatus === "Declined"
        ? "The leave request has been declined."
        : "The request has been returned for clarification.",
      "success"
    );
    setActionInProgress(null);

    await loadRecords();
  }

  function openCancellation(record: ParsedLeaveRecord) {
    setCancellingRecordId(record.id);
    setCancellationReason("");
    setEditingRecordId(null);
    closeDecision();
    showMessage("", "information");
  }

  function closeCancellation() {
    setCancellingRecordId(null);
    setCancellationReason("");
  }

  async function cancelLeaveRecord(record: ParsedLeaveRecord) {
    if (actionInProgress === record.id) return;

    if (
      record.normalisedStatus === "Approved" &&
      !cancellationReason.trim()
    ) {
      showMessage(
        "Please add a reason for cancelling approved leave.",
        "error"
      );
      return;
    }

    const confirmed = window.confirm(
      `Cancel ${record.leave_type.toLowerCase()} for ${formatDateRange(
        record.start_date,
        record.end_date || record.start_date
      )}?`
    );

    if (!confirmed) return;

    const now = new Date().toISOString();

    const metadata: LeaveMetadata = {
      ...record.metadata,
      cancelledAt: now,
      cancellationReason: cancellationReason.trim(),
    };

    setActionInProgress(record.id);

    const { error } = await supabase
      .from("employee_leave_records")
      .update({
        status: "Cancelled",
        notes: serialiseLeaveMetadata(metadata),
        updated_at: now,
      })
      .eq("id", record.id)
      .eq("employee_id", employeeId);

    if (error) {
      console.error("Error cancelling leave record:", error);
      showMessage(
        "The leave record could not be cancelled.",
        "error"
      );
      setActionInProgress(null);
      return;
    }

    await recordLeaveAuditEvent(
      employeeId,
      "Leave record cancelled",
      `${record.leave_type} for ${formatDateRange(
        record.start_date,
        record.end_date || record.start_date
      )} was cancelled.`,
      {
        leave_record_id: record.id,
        previous_status: record.normalisedStatus,
        new_status: "Cancelled",
        cancellation_reason: cancellationReason.trim(),
      }
    );

    await recordTimelineEvent(
      employeeId,
      record.id,
      "Leave cancelled",
      `${record.leave_type} · ${formatDateRange(
        record.start_date,
        record.end_date || record.start_date
      )}.`,
      "Cancelled"
    );

    closeCancellation();
    showMessage(
      "The leave record has been cancelled.",
      "success"
    );
    setActionInProgress(null);

    await loadRecords();
  }

  async function markCompleted(record: ParsedLeaveRecord) {
    if (
      record.normalisedStatus !== "Approved" ||
      actionInProgress === record.id
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Mark this ${record.leave_type.toLowerCase()} record as completed?`
    );

    if (!confirmed) return;

    setActionInProgress(record.id);

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("employee_leave_records")
      .update({
        status: "Completed",
        updated_at: now,
      })
      .eq("id", record.id)
      .eq("employee_id", employeeId);

    if (error) {
      console.error("Error completing leave record:", error);
      showMessage(
        "The leave record could not be marked as completed.",
        "error"
      );
      setActionInProgress(null);
      return;
    }

    await recordLeaveAuditEvent(
      employeeId,
      "Leave completed",
      `${record.leave_type} for ${formatDateRange(
        record.start_date,
        record.end_date || record.start_date
      )} was marked as completed.`,
      {
        leave_record_id: record.id,
        previous_status: "Approved",
        new_status: "Completed",
      }
    );

    await recordTimelineEvent(
      employeeId,
      record.id,
      "Leave completed",
      `${record.leave_type} · ${formatDateRange(
        record.start_date,
        record.end_date || record.start_date
      )}.`,
      "Completed"
    );

    showMessage(
      "The leave record has been marked as completed.",
      "success"
    );
    setActionInProgress(null);

    await loadRecords();
  }

  function canEditRecord(record: ParsedLeaveRecord): boolean {
    if (canManageRecords) return true;

    if (isEmployeeView) {
      return (
        record.normalisedStatus === "Draft" ||
        record.normalisedStatus === "Returned" ||
        record.normalisedStatus === "Submitted"
      );
    }

    return (
      record.normalisedStatus === "Submitted" ||
      record.normalisedStatus === "Returned"
    );
  }

  function canCancelRecord(record: ParsedLeaveRecord): boolean {
    if (
      record.normalisedStatus === "Cancelled" ||
      record.normalisedStatus === "Declined" ||
      record.normalisedStatus === "Completed"
    ) {
      return false;
    }

    if (canManageRecords) return true;

    return (
      record.normalisedStatus === "Submitted" ||
      record.normalisedStatus === "Returned" ||
      (record.normalisedStatus === "Approved" &&
        !isPastDate(record.start_date))
    );
  }

  return (
    <ProfileSection title="Leave & Absence">
      <div style={headerRowStyle}>
        <div>
          <p style={introStyle}>
            Manage leave requests, approvals, absence records and annual
            leave entitlement from one connected workspace.
          </p>
        </div>

        <div style={headerActionsStyle}>
          <button
            type="button"
            onClick={() => {
              setShowRequestForm((current) => !current);
              showMessage("", "information");
            }}
            style={primaryButtonStyle}
          >
            {showRequestForm
              ? "Close request form"
              : isEmployeeView
              ? "Request leave"
              : "Add leave / absence"}
          </button>

          {canManageRecords && (
            <button
              type="button"
              onClick={() =>
                exportLeaveRecords(records, employeeId)
              }
              style={secondaryButtonStyle}
            >
              Export records
            </button>
          )}
        </div>
      </div>

      <div style={summaryGridStyle}>
        <SummaryCard
          label="Annual entitlement"
          value={formatDays(annualLeaveAllowance)}
          supportingText="Current recorded entitlement."
        />

        <SummaryCard
          label="Taken"
          value={formatDays(annualLeaveTaken)}
          supportingText="Approved annual leave already taken."
        />

        <SummaryCard
          label="Booked"
          value={formatDays(annualLeaveBooked)}
          supportingText="Approved future annual leave."
        />

        <SummaryCard
          label="Pending"
          value={formatDays(annualLeavePending)}
          supportingText="Awaiting review or clarification."
        />

        <SummaryCard
          label="Remaining"
          value={formatDays(annualLeaveRemaining)}
          supportingText="Confirmed balance after approved leave."
          emphasis
        />
      </div>

      {message && (
        <MessageBox tone={messageTone}>{message}</MessageBox>
      )}

      {showRequestForm && (
        <Panel
          title={
            isEmployeeView
              ? "Request leave"
              : "Add leave or absence"
          }
          description={
            isEmployeeView
              ? "Submit a request for your manager to review."
              : "Record a request, absence or employment-related leave arrangement."
          }
        >
          <div style={formGridStyle}>
            <FormField label="Leave type">
              <select
                value={form.leaveType}
                onChange={(event) =>
                  updateForm("leaveType", event.target.value)
                }
                style={inputStyle}
              >
                {leaveTypes.map((leaveType) => (
                  <option key={leaveType} value={leaveType}>
                    {leaveType}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Day type">
              <select
                value={form.dayPortion}
                onChange={(event) =>
                  updateForm(
                    "dayPortion",
                    event.target.value as DayPortion
                  )
                }
                style={inputStyle}
              >
                {dayPortionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Start date">
              <input
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  updateForm("startDate", event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="End date">
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(event) =>
                  updateForm("endDate", event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Calculated working days">
              <input
                value={formatNumber(form.calculatedDays)}
                readOnly
                style={readOnlyInputStyle}
              />
            </FormField>

            {canManageRecords && (
              <FormField label="Adjust calculated days">
                <div style={manualAdjustmentStyle}>
                  <label style={checkboxLabelStyle}>
                    <input
                      type="checkbox"
                      checked={form.useManualDays}
                      onChange={(event) =>
                        updateForm(
                          "useManualDays",
                          event.target.checked
                        )
                      }
                    />
                    Use adjusted total
                  </label>

                  {form.useManualDays && (
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={form.manualDays}
                      onChange={(event) =>
                        updateForm(
                          "manualDays",
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  )}
                </div>
              </FormField>
            )}

            <FormField
              label={
                isEmployeeView
                  ? "Notes for manager"
                  : "Employee / record notes"
              }
              fullWidth
            >
              <textarea
                value={form.employeeNotes}
                onChange={(event) =>
                  updateForm(
                    "employeeNotes",
                    event.target.value
                  )
                }
                rows={4}
                placeholder="Add any relevant information for this request."
                style={textareaStyle}
              />
            </FormField>
          </div>

          <div style={requestPreviewStyle}>
            <div>
              <div style={previewLabelStyle}>
                Request summary
              </div>

              <div style={previewValueStyle}>
                {form.leaveType} · {formatDays(requestDays)}
              </div>

              <div style={previewSupportingStyle}>
                {form.startDate
                  ? formatDateRange(
                      form.startDate,
                      form.endDate || form.startDate
                    )
                  : "Add dates to calculate the request."}
              </div>
            </div>

            {selectedLeaveDefinition.deductsAnnualLeave && (
              <div>
                <div style={previewLabelStyle}>
                  Remaining after approval
                </div>

                <div style={previewValueStyle}>
                  {formatDays(remainingAfterRequest)}
                </div>

                <div style={previewSupportingStyle}>
                  Pending requests are shown separately until approved.
                </div>
              </div>
            )}
          </div>

          <div style={formActionsStyle}>
            <button
              type="button"
              onClick={submitRequest}
              disabled={saving}
              style={
                saving
                  ? disabledPrimaryButtonStyle
                  : primaryButtonStyle
              }
            >
              {saving
                ? "Saving..."
                : selectedLeaveDefinition.requiresApproval
                ? "Submit for approval"
                : canManageRecords
                ? "Add record"
                : "Submit for review"}
            </button>

            <button
              type="button"
              onClick={resetRequestForm}
              disabled={saving}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>
          </div>
        </Panel>
      )}

      <div style={viewTabsStyle}>
        <button
          type="button"
          onClick={() => setActiveView("Requests")}
          style={
            activeView === "Requests"
              ? activeViewTabStyle
              : viewTabStyle
          }
        >
          Requests ({pendingRequests.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveView("Upcoming")}
          style={
            activeView === "Upcoming"
              ? activeViewTabStyle
              : viewTabStyle
          }
        >
          Upcoming ({upcomingLeave.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveView("History")}
          style={
            activeView === "History"
              ? activeViewTabStyle
              : viewTabStyle
          }
        >
          History ({leaveHistory.length})
        </button>
      </div>

      <Panel
        title={
          activeView === "Requests"
            ? "Leave requests"
            : activeView === "Upcoming"
            ? "Upcoming leave"
            : "Leave and absence history"
        }
        description={
          activeView === "Requests"
            ? canApprove
              ? "Review requests awaiting approval or clarification."
              : "Track submitted requests and any amendments requested."
            : activeView === "Upcoming"
            ? "Approved future leave and absence."
            : "Completed, declined and cancelled records."
        }
      >
        {loading ? (
          <EmptyState message="Loading leave and absence records..." />
        ) : visibleRecords.length === 0 ? (
          <EmptyState
            message={
              activeView === "Requests"
                ? "There are no requests awaiting review."
                : activeView === "Upcoming"
                ? "There is no approved upcoming leave."
                : "No historical leave or absence records are available."
            }
          />
        ) : (
          <div style={recordListStyle}>
            {visibleRecords.map((record) => {
              const isEditing = editingRecordId === record.id;
              const isDecisionOpen =
                decisionRecordId === record.id;
              const isCancellationOpen =
                cancellingRecordId === record.id;

              return (
                <article key={record.id} style={recordCardStyle}>
                  <div style={recordHeaderStyle}>
                    <div>
                      <div style={recordTypeRowStyle}>
                        <h4 style={recordTitleStyle}>
                          {record.leave_type}
                        </h4>

                        <StatusBadge
                          status={record.normalisedStatus}
                        />
                      </div>

                      <div style={recordMetaStyle}>
                        {formatDateRange(
                          record.start_date,
                          record.end_date ||
                            record.start_date
                        )}{" "}
                        ·{" "}
                        {formatDays(
                          Number(record.days_taken || 0)
                        )}
                      </div>
                    </div>

                    <div style={recordHeaderActionsStyle}>
                      {canApprove &&
                        record.normalisedStatus ===
                          "Submitted" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                openDecision(record, "approve")
                              }
                              style={smallPrimaryButtonStyle}
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openDecision(record, "return")
                              }
                              style={smallSecondaryButtonStyle}
                            >
                              Return
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openDecision(record, "decline")
                              }
                              style={smallDeclineButtonStyle}
                            >
                              Decline
                            </button>
                          </>
                        )}

                      {canEditRecord(record) && (
                        <button
                          type="button"
                          onClick={() => startEditing(record)}
                          style={smallSecondaryButtonStyle}
                        >
                          Edit
                        </button>
                      )}

                      {canCancelRecord(record) && (
                        <button
                          type="button"
                          onClick={() =>
                            openCancellation(record)
                          }
                          style={smallSecondaryButtonStyle}
                        >
                          Cancel
                        </button>
                      )}

                      {canManageRecords &&
                        record.normalisedStatus ===
                          "Approved" &&
                        isPastDate(
                          record.end_date ||
                            record.start_date
                        ) && (
                          <button
                            type="button"
                            onClick={() =>
                              void markCompleted(record)
                            }
                            disabled={
                              actionInProgress === record.id
                            }
                            style={smallPrimaryButtonStyle}
                          >
                            Mark completed
                          </button>
                        )}
                    </div>
                  </div>

                  <div style={recordInformationGridStyle}>
                    <RecordInformation
                      label="Category"
                      value={record.metadata.recordCategory}
                    />
                    <RecordInformation
                      label="Day type"
                      value={record.metadata.dayPortion}
                    />
                    <RecordInformation
                      label="Submitted"
                      value={formatDateTime(
                        record.metadata.submittedAt ||
                          record.created_at
                      )}
                    />
                    <RecordInformation
                      label="Source"
                      value={record.metadata.source}
                    />
                  </div>

                  {record.metadata.employeeNotes && (
                    <RecordNote
                      label="Employee / record notes"
                      value={record.metadata.employeeNotes}
                    />
                  )}

                  {record.metadata.managerComments && (
                    <RecordNote
                      label="Manager comments"
                      value={record.metadata.managerComments}
                    />
                  )}

                  {record.metadata.cancellationReason && (
                    <RecordNote
                      label="Cancellation reason"
                      value={
                        record.metadata.cancellationReason
                      }
                    />
                  )}

                  {isEditing && (
                    <div style={embeddedFormStyle}>
                      <div style={formGridStyle}>
                        <FormField label="Leave type">
                          <select
                            value={editForm.leaveType}
                            onChange={(event) =>
                              updateEditForm(
                                "leaveType",
                                event.target.value
                              )
                            }
                            style={inputStyle}
                          >
                            {leaveTypes.map((leaveType) => (
                              <option
                                key={leaveType}
                                value={leaveType}
                              >
                                {leaveType}
                              </option>
                            ))}
                          </select>
                        </FormField>

                        <FormField label="Day type">
                          <select
                            value={editForm.dayPortion}
                            onChange={(event) =>
                              updateEditForm(
                                "dayPortion",
                                event.target
                                  .value as DayPortion
                              )
                            }
                            style={inputStyle}
                          >
                            {dayPortionOptions.map(
                              (option) => (
                                <option
                                  key={option}
                                  value={option}
                                >
                                  {option}
                                </option>
                              )
                            )}
                          </select>
                        </FormField>

                        <FormField label="Start date">
                          <input
                            type="date"
                            value={editForm.startDate}
                            onChange={(event) =>
                              updateEditForm(
                                "startDate",
                                event.target.value
                              )
                            }
                            style={inputStyle}
                          />
                        </FormField>

                        <FormField label="End date">
                          <input
                            type="date"
                            value={editForm.endDate}
                            min={
                              editForm.startDate || undefined
                            }
                            onChange={(event) =>
                              updateEditForm(
                                "endDate",
                                event.target.value
                              )
                            }
                            style={inputStyle}
                          />
                        </FormField>

                        <FormField label="Calculated days">
                          <input
                            value={formatNumber(
                              editForm.calculatedDays
                            )}
                            readOnly
                            style={readOnlyInputStyle}
                          />
                        </FormField>

                        {canManageRecords && (
                          <FormField label="Adjust days">
                            <div style={manualAdjustmentStyle}>
                              <label style={checkboxLabelStyle}>
                                <input
                                  type="checkbox"
                                  checked={
                                    editForm.useManualDays
                                  }
                                  onChange={(event) =>
                                    updateEditForm(
                                      "useManualDays",
                                      event.target.checked
                                    )
                                  }
                                />
                                Use adjusted total
                              </label>

                              {editForm.useManualDays && (
                                <input
                                  type="number"
                                  min="0.5"
                                  step="0.5"
                                  value={editForm.manualDays}
                                  onChange={(event) =>
                                    updateEditForm(
                                      "manualDays",
                                      event.target.value
                                    )
                                  }
                                  style={inputStyle}
                                />
                              )}
                            </div>
                          </FormField>
                        )}

                        <FormField
                          label="Notes"
                          fullWidth
                        >
                          <textarea
                            rows={4}
                            value={editForm.employeeNotes}
                            onChange={(event) =>
                              updateEditForm(
                                "employeeNotes",
                                event.target.value
                              )
                            }
                            style={textareaStyle}
                          />
                        </FormField>
                      </div>

                      <div style={formActionsStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            void saveEditedRecord(record)
                          }
                          disabled={saving}
                          style={smallPrimaryButtonStyle}
                        >
                          {saving
                            ? "Saving..."
                            : "Save changes"}
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={saving}
                          style={smallSecondaryButtonStyle}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}

                  {isDecisionOpen && decisionMode && (
                    <div style={embeddedFormStyle}>
                      <div style={decisionHeadingStyle}>
                        {decisionMode === "approve"
                          ? "Approve request"
                          : decisionMode === "decline"
                          ? "Decline request"
                          : "Return for clarification"}
                      </div>

                      <textarea
                        rows={4}
                        value={decisionComments}
                        onChange={(event) =>
                          setDecisionComments(
                            event.target.value
                          )
                        }
                        placeholder={
                          decisionMode === "approve"
                            ? "Optional manager comments"
                            : decisionMode === "decline"
                            ? "Explain why the request is being declined"
                            : "Explain what clarification or amendment is needed"
                        }
                        style={textareaStyle}
                      />

                      <div style={formActionsStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            void completeDecision(record)
                          }
                          disabled={
                            actionInProgress === record.id
                          }
                          style={
                            decisionMode === "decline"
                              ? smallDeclineButtonStyle
                              : smallPrimaryButtonStyle
                          }
                        >
                          {actionInProgress === record.id
                            ? "Saving..."
                            : decisionMode === "approve"
                            ? "Confirm approval"
                            : decisionMode === "decline"
                            ? "Confirm decline"
                            : "Return request"}
                        </button>

                        <button
                          type="button"
                          onClick={closeDecision}
                          disabled={
                            actionInProgress === record.id
                          }
                          style={smallSecondaryButtonStyle}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}

                  {isCancellationOpen && (
                    <div style={embeddedFormStyle}>
                      <div style={decisionHeadingStyle}>
                        Cancel leave record
                      </div>

                      <textarea
                        rows={3}
                        value={cancellationReason}
                        onChange={(event) =>
                          setCancellationReason(
                            event.target.value
                          )
                        }
                        placeholder="Add a reason where appropriate"
                        style={textareaStyle}
                      />

                      <div style={formActionsStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            void cancelLeaveRecord(record)
                          }
                          disabled={
                            actionInProgress === record.id
                          }
                          style={smallDeclineButtonStyle}
                        >
                          {actionInProgress === record.id
                            ? "Cancelling..."
                            : "Confirm cancellation"}
                        </button>

                        <button
                          type="button"
                          onClick={closeCancellation}
                          disabled={
                            actionInProgress === record.id
                          }
                          style={smallSecondaryButtonStyle}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </Panel>
          </ProfileSection>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section style={panelStyle}>
      <div style={panelHeadingStyle}>
        <h3 style={panelTitleStyle}>{title}</h3>

        {description && (
          <p style={panelDescriptionStyle}>{description}</p>
        )}
      </div>

      {children}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  supportingText,
  emphasis = false,
}: {
  label: string;
  value: string;
  supportingText: string;
  emphasis?: boolean;
}) {
  return (
    <div
      style={
        emphasis
          ? emphasizedSummaryCardStyle
          : summaryCardStyle
      }
    >
      <div style={summaryCardLabelStyle}>{label}</div>

      <div style={summaryCardValueStyle}>{value}</div>

      <div style={summaryCardSupportingStyle}>
        {supportingText}
      </div>
    </div>
  );
}

function FormField({
  label,
  fullWidth = false,
  children,
}: {
  label: string;
  fullWidth?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      style={{
        ...formFieldStyle,
        ...(fullWidth ? fullWidthFieldStyle : {}),
      }}
    >
      <span style={formLabelStyle}>{label}</span>
      {children}
    </label>
  );
}

function RecordInformation({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={recordInformationItemStyle}>
      <div style={recordInformationLabelStyle}>{label}</div>
      <div style={recordInformationValueStyle}>{value}</div>
    </div>
  );
}

function RecordNote({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={recordNoteStyle}>
      <div style={recordNoteLabelStyle}>{label}</div>
      <div style={recordNoteValueStyle}>{value}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div style={emptyStateStyle}>{message}</div>;
}

function StatusBadge({
  status,
}: {
  status: LeaveStatus;
}) {
  return (
    <span style={getLeaveStatusStyle(status)}>
      {status}
    </span>
  );
}

function MessageBox({
  tone,
  children,
}: {
  tone: MessageTone;
  children: ReactNode;
}) {
  const style =
    tone === "success"
      ? successMessageStyle
      : tone === "error"
      ? errorMessageStyle
      : informationMessageStyle;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      style={style}
    >
      {children}
    </div>
  );
}

function normalisePlatformRole(value: string): PlatformRole {
  const normalised = value.trim().toLowerCase();

  if (normalised === "employee") return "Employee";
  if (normalised === "manager") return "Manager";
  if (normalised === "senior") return "Senior";
  if (normalised === "owner") return "Owner";

  return "Owner";
}

function normaliseLeaveStatus(value: string | null): LeaveStatus {
  const normalised = value?.trim().toLowerCase();

  if (!normalised) return "Submitted";

  if (normalised === "draft") return "Draft";

  if (
    normalised === "requested" ||
    normalised === "submitted" ||
    normalised === "pending"
  ) {
    return "Submitted";
  }

  if (normalised === "approved") return "Approved";
  if (normalised === "declined") return "Declined";

  if (
    normalised === "returned" ||
    normalised === "clarification required"
  ) {
    return "Returned";
  }

  if (normalised === "cancelled") return "Cancelled";

  if (
    normalised === "taken" ||
    normalised === "completed"
  ) {
    return "Completed";
  }

  return "Submitted";
}

function getLeaveTypeDefinition(
  leaveType: string
): (typeof leaveTypeDefinitions)[number] {
  return (
    leaveTypeDefinitions.find(
      (definition) => definition.label === leaveType
    ) || {
      label: leaveType || "Other",
      category: "Special leave" as RecordCategory,
      requiresApproval: true,
      deductsAnnualLeave: false,
    }
  );
}

function doesLeaveTypeDeductAnnualLeave(
  leaveType: string
): boolean {
  return getLeaveTypeDefinition(
    leaveType
  ).deductsAnnualLeave;
}

function createDefaultMetadata(
  record: LeaveRecord
): LeaveMetadata {
  const definition = getLeaveTypeDefinition(
    record.leave_type
  );

  return {
    version: 1,
    employeeNotes: record.notes || "",
    managerComments: "",
    dayPortion:
      record.leave_type === "Half Day Leave"
        ? "Half day - morning"
        : "Full day",
    submittedAt: record.created_at || null,
    submittedBy: null,
    decisionAt: null,
    decisionBy: null,
    returnedAt: null,
    cancelledAt: null,
    cancellationReason: "",
    recordCategory: definition.category,
    calculatedDays: Number(record.days_taken || 0),
    manuallyAdjusted: false,
    source: "Legacy",
    futureCalendarSync: false,
  };
}

function parseLeaveRecord(
  record: LeaveRecord
): ParsedLeaveRecord {
  const metadata = parseLeaveMetadata(record);
  const savedDays = Number(record.days_taken || 0);

  const calculatedDays = calculateRequestedDays(
    record.start_date || "",
    record.end_date || record.start_date || "",
    metadata.dayPortion
  );

  const effectiveDays =
    !Number.isNaN(savedDays) && savedDays > 0
      ? savedDays
      : calculatedDays;

  return {
    ...record,
    days_taken: effectiveDays,
    normalisedStatus: normaliseLeaveStatus(record.status),
    metadata: {
      ...metadata,
      calculatedDays:
        metadata.calculatedDays && metadata.calculatedDays > 0
          ? metadata.calculatedDays
          : calculatedDays,
    },
  };
}

function parseLeaveMetadata(
  record: LeaveRecord
): LeaveMetadata {
  const notes = record.notes || "";

  if (!notes.startsWith(metadataPrefix)) {
    return createDefaultMetadata(record);
  }

  const encodedValue = notes.slice(metadataPrefix.length);

  try {
    const parsed = JSON.parse(encodedValue) as Partial<LeaveMetadata>;
    const defaultMetadata = createDefaultMetadata(record);

    return {
      version: 1,
      employeeNotes:
        typeof parsed.employeeNotes === "string"
          ? parsed.employeeNotes
          : defaultMetadata.employeeNotes,
      managerComments:
        typeof parsed.managerComments === "string"
          ? parsed.managerComments
          : "",
      dayPortion: isDayPortion(parsed.dayPortion)
        ? parsed.dayPortion
        : defaultMetadata.dayPortion,
      submittedAt:
        typeof parsed.submittedAt === "string"
          ? parsed.submittedAt
          : defaultMetadata.submittedAt,
      submittedBy:
        typeof parsed.submittedBy === "string"
          ? parsed.submittedBy
          : null,
      decisionAt:
        typeof parsed.decisionAt === "string"
          ? parsed.decisionAt
          : null,
      decisionBy:
        typeof parsed.decisionBy === "string"
          ? parsed.decisionBy
          : null,
      returnedAt:
        typeof parsed.returnedAt === "string"
          ? parsed.returnedAt
          : null,
      cancelledAt:
        typeof parsed.cancelledAt === "string"
          ? parsed.cancelledAt
          : null,
      cancellationReason:
        typeof parsed.cancellationReason === "string"
          ? parsed.cancellationReason
          : "",
      recordCategory: isRecordCategory(
        parsed.recordCategory
      )
        ? parsed.recordCategory
        : defaultMetadata.recordCategory,
      calculatedDays:
        typeof parsed.calculatedDays === "number"
          ? parsed.calculatedDays
          : defaultMetadata.calculatedDays,
      manuallyAdjusted:
        typeof parsed.manuallyAdjusted === "boolean"
          ? parsed.manuallyAdjusted
          : false,
      source: isMetadataSource(parsed.source)
        ? parsed.source
        : "Legacy",
      futureCalendarSync:
        typeof parsed.futureCalendarSync === "boolean"
          ? parsed.futureCalendarSync
          : false,
    };
  } catch (error) {
    console.warn(
      "Leave metadata could not be parsed:",
      error
    );

    return createDefaultMetadata(record);
  }
}

function serialiseLeaveMetadata(
  metadata: LeaveMetadata
): string {
  return `${metadataPrefix}${JSON.stringify(metadata)}`;
}

function isDayPortion(value: unknown): value is DayPortion {
  return (
    value === "Full day" ||
    value === "Half day - morning" ||
    value === "Half day - afternoon"
  );
}

function isRecordCategory(
  value: unknown
): value is RecordCategory {
  return (
    value === "Annual leave" ||
    value === "Absence" ||
    value === "Family leave" ||
    value === "Special leave" ||
    value === "Employment arrangement"
  );
}

function isMetadataSource(
  value: unknown
): value is LeaveMetadata["source"] {
  return (
    value === "Employee" ||
    value === "Manager" ||
    value === "Senior" ||
    value === "Owner" ||
    value === "Legacy"
  );
}

function parseDateOnly(value: string): Date | null {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) return null;

  const [, year, month, day] = match;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    12,
    0,
    0,
    0
  );

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

function toDateOnlyValue(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0"
  );
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function compareDateOnly(
  first: string,
  second: string
): number {
  if (first === second) return 0;
  return first > second ? 1 : -1;
}

function calculateRequestedDays(
  startDate: string,
  endDate: string,
  dayPortion: DayPortion
): number {
  if (!startDate) return 0;

  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate || startDate);

  if (!start || !end || end < start) return 0;

  let total = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    const dayOfWeek = cursor.getDay();

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      total += 1;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (
    total > 0 &&
    (dayPortion === "Half day - morning" ||
      dayPortion === "Half day - afternoon")
  ) {
    if (startDate === (endDate || startDate)) {
      return 0.5;
    }

    return Math.max(total - 0.5, 0.5);
  }

  return total;
}

function getEffectiveDays(
  formState: LeaveFormState
): number {
  if (formState.useManualDays) {
    const adjustedDays = Number(formState.manualDays);

    return Number.isNaN(adjustedDays)
      ? 0
      : adjustedDays;
  }

  return formState.calculatedDays;
}

function sumLeaveDays(
  records: ParsedLeaveRecord[]
): number {
  return records.reduce((total, record) => {
    const value = Number(record.days_taken || 0);

    return total + (Number.isNaN(value) ? 0 : value);
  }, 0);
}

function dateRangesOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string
): boolean {
  return (
    compareDateOnly(firstStart, secondEnd) <= 0 &&
    compareDateOnly(firstEnd, secondStart) >= 0
  );
}

function isPastDate(
  value: string | null
): boolean {
  if (!value) return false;

  const today = new Date();

  const todayValue = toDateOnlyValue(today);

  return compareDateOnly(value, todayValue) < 0;
}

function formatDate(
  value: string | null
): string {
  if (!value) return "Not recorded";

  const parsed = parseDateOnly(value);

  if (!parsed) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function formatDateRange(
  startDate: string | null,
  endDate: string | null
): string {
  if (!startDate) return "Dates not recorded";

  const effectiveEndDate = endDate || startDate;

  if (startDate === effectiveEndDate) {
    return formatDate(startDate);
  }

  return `${formatDate(startDate)} to ${formatDate(
    effectiveEndDate
  )}`;
}

function formatDateTime(
  value: string | null
): string {
  if (!value) return "Not recorded";

  const dateOnly = parseDateOnly(value);

  if (dateOnly) {
    return formatDate(value);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(parsed);
}

function formatDays(value: number): string {
  const normalised = Number(
    value.toFixed(2)
  );

  return `${formatNumber(normalised)} ${
    normalised === 1 ? "day" : "days"
  }`;
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);

  return value.toFixed(1).replace(/\.0$/, "");
}

function readString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);

  return "";
}

async function recordLeaveAuditEvent(
  employeeId: number,
  actionTitle: string,
  description: string,
  metadata: Record<string, unknown>
) {
  try {
    const { error } = await supabase
      .from("audit_logs")
      .insert({
        employee_id: employeeId,
        action_title: actionTitle,
        description,
        category: "Employee",
        source_module: "Leave & Absence",
        metadata,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.warn(
        "Leave audit event was not written:",
        error
      );
    }
  } catch (error) {
    console.warn(
      "Leave audit event was not written:",
      error
    );
  }
}

async function recordTimelineEvent(
  employeeId: number,
  leaveRecordId: number | null | undefined,
  title: string,
  description: string,
  status: string
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("employee_timeline")
      .insert({
        organisation_id: null,
        employee_id: employeeId,
        event_type: "Leave & Absence",
        title,
        description,
        status,
        source_module: "Leave & Absence",
        source_record_id: leaveRecordId
          ? String(leaveRecordId)
          : null,
        metadata: {
          leave_record_id: leaveRecordId || null,
          leave_status: status,
        },
        event_date: new Date().toISOString(),
        created_by: user?.id || null,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.warn(
        "Employee timeline event was not written:",
        error
      );
    }
  } catch (error) {
    console.warn(
      "Employee timeline event was not written:",
      error
    );
  }
}

function exportLeaveRecords(
  records: ParsedLeaveRecord[],
  employeeId: number
) {
  if (records.length === 0) {
    window.alert(
      "There are no leave or absence records to export."
    );
    return;
  }

  const headings = [
    "Employee Reference",
    "Leave Type",
    "Category",
    "Status",
    "Start Date",
    "End Date",
    "Days",
    "Day Type",
    "Submitted",
    "Employee Notes",
    "Manager Comments",
    "Cancellation Reason",
    "Source",
  ];

  const rows = records.map((record) => [
    String(employeeId),
    record.leave_type,
    record.metadata.recordCategory,
    record.normalisedStatus,
    record.start_date || "",
    record.end_date || "",
    String(record.days_taken || ""),
    record.metadata.dayPortion,
    record.metadata.submittedAt || record.created_at || "",
    record.metadata.employeeNotes,
    record.metadata.managerComments,
    record.metadata.cancellationReason,
    record.metadata.source,
  ]);

  const csv = [headings, ...rows]
    .map((row) =>
      row
        .map((cell) => escapeCsvValue(cell))
        .join(",")
    )
    .join("\n");

  const blob = new Blob(
    [`\uFEFF${csv}`],
    {
      type: "text/csv;charset=utf-8",
    }
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `employee-${employeeId}-leave-records-${toDateOnlyValue(
    new Date()
  )}.csv`;

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
}

function escapeCsvValue(value: string): string {
  const escaped = value.replace(/"/g, '""');

  return `"${escaped}"`;
}

function getLeaveStatusStyle(
  status: LeaveStatus
): CSSProperties {
  const shared: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    padding: "5px 10px",
    fontSize: "11px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  };

  switch (status) {
    case "Approved":
      return {
        ...shared,
        background: "#F5FFF9",
        color: "#356653",
        border: "1px solid #CDE7DA",
      };

    case "Submitted":
      return {
        ...shared,
        background: "#F7F1FC",
        color: "#6E5084",
        border: "1px solid #DCCBE7",
      };

    case "Returned":
      return {
        ...shared,
        background: "#F4F1F8",
        color: "#69587A",
        border: "1px solid #D9CFE3",
      };

    case "Declined":
      return {
        ...shared,
        background: "#FBF2F4",
        color: "#81505B",
        border: "1px solid #E7CBD1",
      };

    case "Cancelled":
      return {
        ...shared,
        background: "#F3F4F6",
        color: "#626872",
        border: "1px solid #D9DCE1",
      };

    case "Completed":
      return {
        ...shared,
        background: "#F2F7F6",
        color: "#49675F",
        border: "1px solid #D1E1DD",
      };

    default:
      return {
        ...shared,
        background: "#F7F7F8",
        color: "#63636A",
        border: "1px solid #DEDEE2",
      };
  }
}

const headerRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "16px",
  marginBottom: "20px",
};

const headerActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
};

const introStyle: CSSProperties = {
  margin: 0,
  color: "#6F6773",
  fontSize: "14px",
  lineHeight: 1.6,
  maxWidth: "760px",
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "12px",
  marginBottom: "20px",
};

const summaryCardStyle: CSSProperties = {
  background: "#FBF9FC",
  border: "1px solid #E9E1ED",
  borderRadius: "14px",
  padding: "16px",
};

const emphasizedSummaryCardStyle: CSSProperties = {
  ...summaryCardStyle,
  background: "#F7F1FC",
  border: "1px solid #DCCBE7",
};

const summaryCardLabelStyle: CSSProperties = {
  color: "#79717E",
  fontSize: "12px",
  fontWeight: 700,
};

const summaryCardValueStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "20px",
  fontWeight: 900,
  marginTop: "7px",
};

const summaryCardSupportingStyle: CSSProperties = {
  color: "#746C78",
  fontSize: "11px",
  lineHeight: 1.5,
  marginTop: "6px",
};

const panelStyle: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E7E1EA",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "18px",
};

const panelHeadingStyle: CSSProperties = {
  marginBottom: "16px",
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  color: "#302638",
  fontSize: "18px",
};

const panelDescriptionStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#746C78",
  fontSize: "13px",
  lineHeight: 1.55,
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "14px 16px",
};

const formFieldStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const fullWidthFieldStyle: CSSProperties = {
  gridColumn: "1 / -1",
};

const formLabelStyle: CSSProperties = {
  color: "#514758",
  fontSize: "12px",
  fontWeight: 800,
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: "42px",
  border: "1px solid #DCD3E0",
  borderRadius: "10px",
  padding: "10px 11px",
  background: "#FFFFFF",
  color: "#302638",
  fontFamily: "inherit",
  fontSize: "13px",
};

const readOnlyInputStyle: CSSProperties = {
  ...inputStyle,
  background: "#F7F5F8",
  color: "#675D6C",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "96px",
  resize: "vertical",
  lineHeight: 1.5,
};

const manualAdjustmentStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
};

const checkboxLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#655B6B",
  fontSize: "12px",
  fontWeight: 700,
};

const requestPreviewStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "12px",
  marginTop: "18px",
  padding: "15px",
  borderRadius: "12px",
  background: "#FBF9FC",
  border: "1px solid #E9E1ED",
};

const previewLabelStyle: CSSProperties = {
  color: "#7B737F",
  fontSize: "11px",
  fontWeight: 800,
};

const previewValueStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "16px",
  fontWeight: 900,
  marginTop: "5px",
};

const previewSupportingStyle: CSSProperties = {
  color: "#756D79",
  fontSize: "11px",
  lineHeight: 1.5,
  marginTop: "5px",
};

const formActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "9px",
  marginTop: "16px",
};

const primaryButtonStyle: CSSProperties = {
  border: "1px solid #6E5084",
  background: "#6E5084",
  color: "#FFFFFF",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "13px",
};

const disabledPrimaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  opacity: 0.55,
  cursor: "not-allowed",
};

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid #D8CCDE",
  background: "#FFFFFF",
  color: "#5B4568",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "13px",
};

const smallPrimaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  padding: "7px 10px",
  fontSize: "12px",
};

const smallSecondaryButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  padding: "7px 10px",
  fontSize: "12px",
};

const smallDeclineButtonStyle: CSSProperties = {
  border: "1px solid #C69BA5",
  background: "#FBF2F4",
  color: "#81505B",
  padding: "7px 10px",
  borderRadius: "9px",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "12px",
};

const viewTabsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginBottom: "14px",
};

const viewTabStyle: CSSProperties = {
  border: "1px solid #DED5E3",
  background: "#FFFFFF",
  color: "#675B6D",
  padding: "9px 12px",
  borderRadius: "999px",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "12px",
};

const activeViewTabStyle: CSSProperties = {
  ...viewTabStyle,
  background: "#6E5084",
  color: "#FFFFFF",
  border: "1px solid #6E5084",
};

const recordListStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const recordCardStyle: CSSProperties = {
  border: "1px solid #E7E1EA",
  borderRadius: "14px",
  padding: "16px",
  background: "#FCFBFD",
};

const recordHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "12px",
};

const recordTypeRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "9px",
};

const recordTitleStyle: CSSProperties = {
  margin: 0,
  color: "#302638",
  fontSize: "16px",
};

const recordMetaStyle: CSSProperties = {
  color: "#746D78",
  fontSize: "12px",
  marginTop: "6px",
};

const recordHeaderActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
};

const recordInformationGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(145px, 1fr))",
  gap: "9px",
  marginTop: "14px",
};

const recordInformationItemStyle: CSSProperties = {
  padding: "10px",
  borderRadius: "10px",
  background: "#FFFFFF",
  border: "1px solid #EEE8F0",
};

const recordInformationLabelStyle: CSSProperties = {
  color: "#807885",
  fontSize: "10px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const recordInformationValueStyle: CSSProperties = {
  color: "#3A3040",
  fontSize: "12px",
  fontWeight: 800,
  marginTop: "5px",
  overflowWrap: "anywhere",
};

const recordNoteStyle: CSSProperties = {
  marginTop: "12px",
  padding: "12px",
  borderRadius: "10px",
  background: "#FFFFFF",
  border: "1px solid #EEE8F0",
};

const recordNoteLabelStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "11px",
  fontWeight: 900,
};

const recordNoteValueStyle: CSSProperties = {
  color: "#5E5662",
  fontSize: "12px",
  lineHeight: 1.55,
  whiteSpace: "pre-wrap",
  marginTop: "5px",
};

const embeddedFormStyle: CSSProperties = {
  marginTop: "14px",
  padding: "14px",
  borderRadius: "12px",
  background: "#FFFFFF",
  border: "1px solid #DED4E3",
};

const decisionHeadingStyle: CSSProperties = {
  color: "#4C3D55",
  fontSize: "13px",
  fontWeight: 900,
  marginBottom: "10px",
};

const emptyStateStyle: CSSProperties = {
  padding: "24px",
  textAlign: "center",
  color: "#746D78",
  background: "#FBF9FC",
  border: "1px dashed #DCCFE3",
  borderRadius: "12px",
  fontSize: "13px",
};

const successMessageStyle: CSSProperties = {
  background: "#F5FFF9",
  color: "#356653",
  border: "1px solid #CDE7DA",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "16px",
  fontSize: "13px",
};

const errorMessageStyle: CSSProperties = {
  background: "#FBF2F4",
  color: "#81505B",
  border: "1px solid #E7CBD1",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "16px",
  fontSize: "13px",
};

const informationMessageStyle: CSSProperties = {
  background: "#F7F1FC",
  color: "#60496E",
  border: "1px solid #DCCBE7",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "16px",
  fontSize: "13px",
};