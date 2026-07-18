"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as XLSX from "xlsx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PlatformRole = "Owner" | "Senior" | "Manager" | "Employee";

type EmployeeStatus =
  | "New Starter"
  | "Active"
  | "Leaving"
  | "Former Employee"
  | "Archived"
  | "Suspended";

type ViewMode =
  | "all"
  | "new_starters"
  | "active"
  | "leaving"
  | "archived";

type Employee = {
  id: number;
  name: string;
  role: string | null;
  email: string | null;
  start_date: string | null;
  status: string | null;
};

type EmploymentDetails = {
  id?: number;
  employee_id: number;
  manager: string | null;
  probation_end_date: string | null;
  employment_end_date: string | null;
  reason_for_leaving: string | null;
  annual_leave_allowance: string | null;
};

type EmployeeWithDetails = Employee & {
  employmentDetails: EmploymentDetails | null;
};

type ImportMode =
  | "create_new"
  | "update_existing"
  | "create_and_update"
  | "preview_only";

type ImportStep =
  | "upload"
  | "mapping"
  | "validation"
  | "importing"
  | "complete";

type ImportField =
  | "ignore"
  | "name"
  | "role"
  | "email"
  | "start_date"
  | "status"
  | "manager"
  | "probation_end_date"
  | "employment_end_date"
  | "reason_for_leaving"
  | "annual_leave_allowance";

type RawImportRow = Record<string, unknown>;

type MappedEmployeeRow = {
  name: string;
  role: string;
  email: string;
  start_date: string;
  status: string;
  manager: string;
  probation_end_date: string;
  employment_end_date: string;
  reason_for_leaving: string;
  annual_leave_allowance: string;
};

type ValidationStatus =
  | "ready"
  | "update"
  | "warning"
  | "error"
  | "skip";

type ValidatedImportRow = {
  rowNumber: number;
  sourceData: RawImportRow;
  mappedData: MappedEmployeeRow;
  status: ValidationStatus;
  matchingEmployee: EmployeeWithDetails | null;
  errors: string[];
  warnings: string[];
};

type ImportSummary = {
  total: number;
  ready: number;
  updates: number;
  warnings: number;
  errors: number;
  skipped: number;
};

type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  rowResults: Array<{
    rowNumber: number;
    name: string;
    result: string;
    employeeId: number | null;
    message: string;
  }>;
};

type ImportHistoryRecord = {
  id: number;
  file_name: string;
  file_type: string | null;
  import_mode: string;
  status: string;
  total_rows: number;
  created_rows: number;
  updated_rows: number;
  skipped_rows: number;
  error_rows: number;
  created_at: string;
  completed_at: string | null;
};

type ColumnMapping = Record<string, ImportField>;

type FilterState = {
  role: string;
  status: string;
  manager: string;
  startDateFrom: string;
  startDateTo: string;
};

const roleRank: Record<PlatformRole, number> = {
  Employee: 1,
  Manager: 2,
  Senior: 3,
  Owner: 4,
};

const importFieldOptions: Array<{
  value: ImportField;
  label: string;
}> = [
  { value: "ignore", label: "Do not import" },
  { value: "name", label: "Employee name" },
  { value: "role", label: "Role / job title" },
  { value: "email", label: "Email address" },
  { value: "start_date", label: "Start date" },
  { value: "status", label: "Employment status" },
  { value: "manager", label: "Manager" },
  { value: "probation_end_date", label: "Probation end date" },
  { value: "employment_end_date", label: "Employment end date" },
  { value: "reason_for_leaving", label: "Reason for leaving" },
  {
    value: "annual_leave_allowance",
    label: "Annual leave allowance",
  },
];

const employeeStatuses: EmployeeStatus[] = [
  "New Starter",
  "Active",
  "Leaving",
  "Former Employee",
  "Archived",
  "Suspended",
];

const defaultFilters: FilterState = {
  role: "All",
  status: "All",
  manager: "All",
  startDateFrom: "",
  startDateTo: "",
};

const leoTemplateHeaders = [
  "Employee Name",
  "Role",
  "Email",
  "Start Date",
  "Status",
  "Manager",
  "Probation End Date",
  "Employment End Date",
  "Reason for Leaving",
  "Annual Leave Allowance",
];

const sampleRows = [
  {
    "Employee Name": "Alex Morgan",
    Role: "Operations Manager",
    Email: "alex.morgan@example.com",
    "Start Date": "01/08/2026",
    Status: "New Starter",
    Manager: "Lindsay Gallagher",
    "Probation End Date": "01/11/2026",
    "Employment End Date": "",
    "Reason for Leaving": "",
    "Annual Leave Allowance": "28",
  },
  {
    "Employee Name": "Jordan Taylor",
    Role: "Administrator",
    Email: "jordan.taylor@example.com",
    "Start Date": "15/05/2024",
    Status: "Active",
    Manager: "Alex Morgan",
    "Probation End Date": "15/08/2024",
    "Employment End Date": "",
    "Reason for Leaving": "",
    "Annual Leave Allowance": "25",
  },
];

export default function EmployeesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [employees, setEmployees] = useState<EmployeeWithDetails[]>([]);
  const [importHistory, setImportHistory] = useState<ImportHistoryRecord[]>([]);

  const [platformRole, setPlatformRole] =
    useState<PlatformRole>("Owner");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);

  const [showImportWorkspace, setShowImportWorkspace] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>("upload");
  const [importMode, setImportMode] =
    useState<ImportMode>("create_and_update");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceHeaders, setSourceHeaders] = useState<string[]>([]);
  const [sourceRows, setSourceRows] = useState<RawImportRow[]>([]);
  const [columnMapping, setColumnMapping] =
    useState<ColumnMapping>({});
  const [validatedRows, setValidatedRows] =
    useState<ValidatedImportRow[]>([]);

  const [parsingFile, setParsingFile] = useState(false);
  const [validatingImport, setValidatingImport] = useState(false);
  const [runningImport, setRunningImport] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] =
    useState<ImportResult | null>(null);

  const [pageMessage, setPageMessage] = useState("");
  const [pageMessageTone, setPageMessageTone] =
    useState<"success" | "error" | "information">("information");

  const hasPermission = useCallback(
    (minimumRole: PlatformRole) =>
      roleRank[platformRole] >= roleRank[minimumRole],
    [platformRole]
  );

  const canImport = hasPermission("Senior");
  const canExport = hasPermission("Senior");
  const canAddEmployee = hasPermission("Senior");

  const loadCurrentUser = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPlatformRole("Owner");
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const role =
        readString(profile?.platform_role) ||
        readString(profile?.role) ||
        readString(profile?.access_level);

      setPlatformRole(normalisePlatformRole(role));
    } catch (error) {
      console.warn("Employee page permissions could not be loaded:", error);
      setPlatformRole("Owner");
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    const [employeeResult, employmentResult] = await Promise.all([
      supabase
        .from("employees")
        .select("id, name, role, email, start_date, status")
        .order("name", { ascending: true }),

      supabase
        .from("employee_employment_details")
        .select(
          "id, employee_id, manager, probation_end_date, employment_end_date, reason_for_leaving, annual_leave_allowance"
        ),
    ]);

    if (employeeResult.error) {
      console.error("Error loading employees:", employeeResult.error);
      setEmployees([]);
      setLoadError(
        "Employee records could not be loaded. Please refresh the page and try again."
      );
      setLoading(false);
      return;
    }

    if (employmentResult.error) {
      console.warn(
        "Employment details could not be loaded:",
        employmentResult.error
      );
    }

    const employmentMap = new Map<number, EmploymentDetails>();

    for (const detail of employmentResult.data || []) {
      employmentMap.set(detail.employee_id, detail as EmploymentDetails);
    }

    const combinedEmployees = (employeeResult.data || []).map(
      (employee) =>
        ({
          ...employee,
          employmentDetails: employmentMap.get(employee.id) || null,
        }) as EmployeeWithDetails
    );

    setEmployees(combinedEmployees);
    setLoading(false);
  }, []);

  const loadImportHistory = useCallback(async () => {
    if (!canImport) {
      setImportHistory([]);
      return;
    }

    const { data, error } = await supabase
      .from("employee_imports")
      .select(
        "id, file_name, file_type, import_mode, status, total_rows, created_rows, updated_rows, skipped_rows, error_rows, created_at, completed_at"
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.warn("Employee import history could not be loaded:", error);
      setImportHistory([]);
      return;
    }

    setImportHistory((data || []) as ImportHistoryRecord[]);
  }, [canImport]);

  useEffect(() => {
    void loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    void loadImportHistory();
  }, [loadImportHistory]);

  const activeCount = useMemo(
    () =>
      employees.filter(
        (employee) =>
          normaliseEmployeeStatus(employee.status) === "Active"
      ).length,
    [employees]
  );

  const newStarterCount = useMemo(
    () =>
      employees.filter(
        (employee) =>
          normaliseEmployeeStatus(employee.status) === "New Starter"
      ).length,
    [employees]
  );

  const leavingCount = useMemo(
    () =>
      employees.filter(
        (employee) =>
          normaliseEmployeeStatus(employee.status) === "Leaving"
      ).length,
    [employees]
  );

  const archivedCount = useMemo(
    () =>
      employees.filter(
        (employee) =>
          normaliseEmployeeStatus(employee.status) === "Archived"
      ).length,
    [employees]
  );

  const roleOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          employees
            .map((employee) => employee.role?.trim())
            .filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => a.localeCompare(b)),
    ],
    [employees]
  );

  const managerOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          employees
            .map((employee) =>
              employee.employmentDetails?.manager?.trim()
            )
            .filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => a.localeCompare(b)),
    ],
    [employees]
  );

  const visibleEmployees = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const status = normaliseEmployeeStatus(employee.status);
      const manager = employee.employmentDetails?.manager || "";

      if (viewMode === "new_starters" && status !== "New Starter") {
        return false;
      }

      if (viewMode === "active" && status !== "Active") {
        return false;
      }

      if (viewMode === "leaving" && status !== "Leaving") {
        return false;
      }

      if (viewMode === "archived" && status !== "Archived") {
        return false;
      }

      if (filters.role !== "All" && employee.role !== filters.role) {
        return false;
      }

      if (filters.status !== "All" && status !== filters.status) {
        return false;
      }

      if (filters.manager !== "All" && manager !== filters.manager) {
        return false;
      }

      if (
        filters.startDateFrom &&
        (!employee.start_date ||
          employee.start_date < filters.startDateFrom)
      ) {
        return false;
      }

      if (
        filters.startDateTo &&
        (!employee.start_date ||
          employee.start_date > filters.startDateTo)
      ) {
        return false;
      }

      if (!searchValue) return true;

      const searchableText = [
        employee.name,
        employee.role,
        employee.email,
        status,
        employee.id,
        manager,
        employee.start_date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchValue);
    });
  }, [employees, filters, search, viewMode]);

  const importSummary = useMemo<ImportSummary>(() => {
    return {
      total: validatedRows.length,
      ready: validatedRows.filter((row) => row.status === "ready").length,
      updates: validatedRows.filter((row) => row.status === "update").length,
      warnings: validatedRows.filter((row) => row.status === "warning")
        .length,
      errors: validatedRows.filter((row) => row.status === "error").length,
      skipped: validatedRows.filter((row) => row.status === "skip").length,
    };
  }, [validatedRows]);

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === "startDateFrom" || key === "startDateTo") {
        return Boolean(value);
      }

      return value !== "All";
    }).length;
  }, [filters]);

  function showMessage(
    message: string,
    tone: "success" | "error" | "information"
  ) {
    setPageMessage(message);
    setPageMessageTone(tone);
  }

  function updateFilter<K extends keyof FilterState>(
    field: K,
    value: FilterState[K]
  ) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function clearFilters() {
    setFilters(defaultFilters);
    setSearch("");
  }

  function openImportWorkspace() {
    if (!canImport) return;

    resetImportWorkspace();
    setShowImportWorkspace(true);
  }

  function closeImportWorkspace() {
    if (runningImport) return;

    setShowImportWorkspace(false);
    resetImportWorkspace();
  }

  function resetImportWorkspace() {
    setImportStep("upload");
    setImportMode("create_and_update");
    setSelectedFile(null);
    setSourceHeaders([]);
    setSourceRows([]);
    setColumnMapping({});
    setValidatedRows([]);
    setParsingFile(false);
    setValidatingImport(false);
    setRunningImport(false);
    setImportProgress(0);
    setImportResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleFileSelection(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const extension = getFileExtension(file.name);

    if (!["csv", "xlsx", "xls"].includes(extension)) {
      showMessage(
        "Please select a CSV or Excel file.",
        "error"
      );
      event.target.value = "";
      return;
    }

    setParsingFile(true);
    setSelectedFile(file);
    setSourceRows([]);
    setSourceHeaders([]);
    setValidatedRows([]);

    try {
      const arrayBuffer = await file.arrayBuffer();

      const workbook = XLSX.read(arrayBuffer, {
        type: "array",
        cellDates: true,
      });

      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("The workbook does not contain a worksheet.");
      }

      const worksheet = workbook.Sheets[firstSheetName];

      const rows = XLSX.utils.sheet_to_json<RawImportRow>(worksheet, {
        defval: "",
        raw: false,
        dateNF: "dd/mm/yyyy",
      });

      if (rows.length === 0) {
        throw new Error("The selected file does not contain any employee rows.");
      }

      const headers = Array.from(
        new Set(rows.flatMap((row) => Object.keys(row)))
      );

      if (headers.length === 0) {
        throw new Error("No column headings were found in the selected file.");
      }

      const suggestedMapping = suggestColumnMapping(headers);

      setSourceHeaders(headers);
      setSourceRows(rows);
      setColumnMapping(suggestedMapping);
      setImportStep("mapping");
      showMessage(
        `${rows.length} row${rows.length === 1 ? "" : "s"} loaded from ${
          file.name
        }. Review the column mapping before validation.`,
        "success"
      );
    } catch (error) {
      console.error("Employee import file could not be read:", error);

      showMessage(
        error instanceof Error
          ? error.message
          : "The selected file could not be read.",
        "error"
      );

      setSelectedFile(null);
      event.target.value = "";
    } finally {
      setParsingFile(false);
    }
  }

  function updateColumnMapping(
    sourceColumn: string,
    targetField: ImportField
  ) {
    setColumnMapping((current) => {
      const nextMapping = { ...current };

      if (targetField !== "ignore") {
        for (const [column, mappedField] of Object.entries(nextMapping)) {
          if (mappedField === targetField && column !== sourceColumn) {
            nextMapping[column] = "ignore";
          }
        }
      }

      nextMapping[sourceColumn] = targetField;

      return nextMapping;
    });
  }

  async function validateImportRows() {
    const mappedNameColumn = Object.entries(columnMapping).find(
      ([, field]) => field === "name"
    );

    if (!mappedNameColumn) {
      showMessage(
        "Map one source column to Employee name before continuing.",
        "error"
      );
      return;
    }

    setValidatingImport(true);
    setValidatedRows([]);

    const validated = sourceRows.map((sourceRow, index) =>
      validateImportRow({
        rowNumber: index + 2,
        sourceRow,
        columnMapping,
        existingEmployees: employees,
        importMode,
      })
    );

    setValidatedRows(validated);
    setImportStep("validation");
    setValidatingImport(false);

    const errorCount = validated.filter(
      (row) => row.status === "error"
    ).length;

    if (errorCount > 0) {
      showMessage(
        `${errorCount} row${
          errorCount === 1 ? " contains" : "s contain"
        } errors that must be corrected or skipped before import.`,
        "error"
      );
    } else {
      showMessage(
        "Validation is complete. Review the import preview before confirming.",
        "success"
      );
    }
  }

  async function runEmployeeImport() {
    if (runningImport) return;

    const actionableRows = validatedRows.filter(
      (row) =>
        row.status === "ready" ||
        row.status === "update" ||
        row.status === "warning"
    );

    if (actionableRows.length === 0) {
      showMessage(
        "There are no valid employee rows available to import.",
        "error"
      );
      return;
    }

    if (importMode === "preview_only") {
      setImportResult({
        created: 0,
        updated: 0,
        skipped: validatedRows.length,
        errors: 0,
        rowResults: validatedRows.map((row) => ({
          rowNumber: row.rowNumber,
          name: row.mappedData.name,
          result: "Preview only",
          employeeId: row.matchingEmployee?.id || null,
          message: "No database changes were made.",
        })),
      });

      setImportStep("complete");
      showMessage(
        "Preview completed. No employee records were changed.",
        "success"
      );
      return;
    }

    const confirmed = window.confirm(
      `Import ${actionableRows.length} employee row${
        actionableRows.length === 1 ? "" : "s"
      }?\n\nThe import will ${
        importMode === "create_new"
          ? "create new employees and skip existing matches"
          : importMode === "update_existing"
          ? "update matching employees and skip new employees"
          : "create new employees and update confirmed matches"
      }.`
    );

    if (!confirmed) return;

    setRunningImport(true);
    setImportStep("importing");
    setImportProgress(0);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const importRecordResult = await supabase
      .from("employee_imports")
      .insert({
        organisation_id: null,
        file_name: selectedFile?.name || "Employee import",
        file_type: selectedFile
          ? getFileExtension(selectedFile.name)
          : null,
        import_mode: importMode,
        status: "processing",
        total_rows: validatedRows.length,
        created_rows: 0,
        updated_rows: 0,
        skipped_rows: 0,
        error_rows: 0,
        column_mapping: columnMapping,
        import_options: {
          preserve_existing_values: true,
          source: "Employee Import Wizard",
        },
        created_by: user?.id || null,
      })
      .select("id")
      .single();

    const importId = importRecordResult.data?.id || null;

    const result: ImportResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      rowResults: [],
    };

    for (let index = 0; index < validatedRows.length; index += 1) {
      const row = validatedRows[index];

      try {
        if (row.status === "error" || row.status === "skip") {
          result.skipped += 1;

          result.rowResults.push({
            rowNumber: row.rowNumber,
            name: row.mappedData.name,
            result: "Skipped",
            employeeId: row.matchingEmployee?.id || null,
            message:
              row.errors.join("; ") ||
              row.warnings.join("; ") ||
              "The row was not eligible for import.",
          });

          await saveImportRowResult({
            importId,
            row,
            resultStatus: "skipped",
            employeeId: row.matchingEmployee?.id || null,
          });

          setImportProgress(
            Math.round(((index + 1) / validatedRows.length) * 100)
          );

          continue;
        }

        const shouldUpdate =
          Boolean(row.matchingEmployee) &&
          (importMode === "update_existing" ||
            importMode === "create_and_update");

        const shouldCreate =
          !row.matchingEmployee &&
          (importMode === "create_new" ||
            importMode === "create_and_update");

        if (!shouldUpdate && !shouldCreate) {
          result.skipped += 1;

          result.rowResults.push({
            rowNumber: row.rowNumber,
            name: row.mappedData.name,
            result: "Skipped",
            employeeId: row.matchingEmployee?.id || null,
            message: row.matchingEmployee
              ? "A matching employee already exists."
              : "The selected import mode does not create new employees.",
          });

          await saveImportRowResult({
            importId,
            row,
            resultStatus: "skipped",
            employeeId: row.matchingEmployee?.id || null,
          });

          setImportProgress(
            Math.round(((index + 1) / validatedRows.length) * 100)
          );

          continue;
        }

        if (shouldUpdate && row.matchingEmployee) {
          const employeeId = row.matchingEmployee.id;

          const employeeUpdate = buildEmployeeUpdatePayload(
            row.mappedData,
            row.matchingEmployee
          );

          const { error: employeeUpdateError } = await supabase
            .from("employees")
            .update(employeeUpdate)
            .eq("id", employeeId);

          if (employeeUpdateError) {
            throw employeeUpdateError;
          }

          await upsertEmploymentDetails(
            employeeId,
            row.mappedData,
            row.matchingEmployee.employmentDetails
          );

          await writeEmployeeImportTimelineEvent({
            employeeId,
            title: "Employee record updated by import",
            description: `${row.mappedData.name} was updated through the Employee Import Wizard.`,
            sourceRecordId: importId ? String(importId) : null,
            status: "Updated",
            createdBy: user?.id || null,
          });

          result.updated += 1;

          result.rowResults.push({
            rowNumber: row.rowNumber,
            name: row.mappedData.name,
            result: "Updated",
            employeeId,
            message: "The existing employee record was updated.",
          });

          await saveImportRowResult({
            importId,
            row,
            resultStatus: "updated",
            employeeId,
          });
        }

        if (shouldCreate) {
          const { data: createdEmployee, error: createError } =
            await supabase
              .from("employees")
              .insert({
                name: row.mappedData.name,
                role: emptyToNull(row.mappedData.role),
                email: emptyToNull(row.mappedData.email),
                start_date: emptyToNull(row.mappedData.start_date),
                status:
                  normaliseEmployeeStatus(row.mappedData.status) || "Active",
              })
              .select("id")
              .single();

          if (createError || !createdEmployee) {
            throw createError || new Error("Employee creation failed.");
          }

          const employeeId = createdEmployee.id;

          await upsertEmploymentDetails(
            employeeId,
            row.mappedData,
            null
          );

          await writeEmployeeImportTimelineEvent({
            employeeId,
            title: "Employee created by import",
            description: `${row.mappedData.name} was added through the Employee Import Wizard.`,
            sourceRecordId: importId ? String(importId) : null,
            status: "Created",
            createdBy: user?.id || null,
          });

          result.created += 1;

          result.rowResults.push({
            rowNumber: row.rowNumber,
            name: row.mappedData.name,
            result: "Created",
            employeeId,
            message: "A new employee record was created.",
          });

          await saveImportRowResult({
            importId,
            row,
            resultStatus: "created",
            employeeId,
          });
        }
      } catch (error) {
        console.error(
          `Employee import failed for row ${row.rowNumber}:`,
          error
        );

        result.errors += 1;

        result.rowResults.push({
          rowNumber: row.rowNumber,
          name: row.mappedData.name,
          result: "Error",
          employeeId: row.matchingEmployee?.id || null,
          message:
            error instanceof Error
              ? error.message
              : "The employee row could not be imported.",
        });

        await saveImportRowResult({
          importId,
          row,
          resultStatus: "error",
          employeeId: row.matchingEmployee?.id || null,
          additionalError:
            error instanceof Error
              ? error.message
              : "The employee row could not be imported.",
        });
      }

      setImportProgress(
        Math.round(((index + 1) / validatedRows.length) * 100)
      );
    }

    if (importId) {
      await supabase
        .from("employee_imports")
        .update({
          status: result.errors > 0 ? "completed_with_errors" : "completed",
          created_rows: result.created,
          updated_rows: result.updated,
          skipped_rows: result.skipped,
          error_rows: result.errors,
          completed_at: new Date().toISOString(),
        })
        .eq("id", importId);
    }

    await writeAuditEvent({
      action: "Employee import completed",
      description: `${result.created} employee records were created, ${result.updated} were updated, ${result.skipped} were skipped and ${result.errors} contained errors.`,
      entityType: "Employee Import",
      entityId: importId ? String(importId) : null,
      entityName: selectedFile?.name || "Employee import",
      metadata: {
        import_mode: importMode,
        total_rows: validatedRows.length,
        created_rows: result.created,
        updated_rows: result.updated,
        skipped_rows: result.skipped,
        error_rows: result.errors,
      },
    });

    setImportResult(result);
    setImportProgress(100);
    setRunningImport(false);
    setImportStep("complete");

    showMessage(
      result.errors > 0
        ? "The import completed with some errors. Review the result report below."
        : "The employee import completed successfully.",
      result.errors > 0 ? "error" : "success"
    );

    await Promise.all([loadEmployees(), loadImportHistory()]);
  }

  function downloadLeoTemplate() {
    const worksheet = XLSX.utils.aoa_to_sheet([leoTemplateHeaders]);

    worksheet["!cols"] = leoTemplateHeaders.map((header) => ({
      wch: Math.max(header.length + 4, 18),
    }));

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    XLSX.writeFile(workbook, "LEO-Employee-Import-Template.xlsx");
  }

  function downloadSampleFile() {
    const worksheet = XLSX.utils.json_to_sheet(sampleRows);

    worksheet["!cols"] = leoTemplateHeaders.map((header) => ({
      wch: Math.max(header.length + 4, 18),
    }));

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    XLSX.writeFile(workbook, "LEO-Employee-Import-Sample.xlsx");
  }

  function exportCurrentEmployeeView() {
    if (visibleEmployees.length === 0) {
      showMessage(
        "There are no employees in the current view to export.",
        "error"
      );
      return;
    }

    const exportRows = visibleEmployees.map((employee) => ({
      "Employee Reference": employee.id,
      Name: employee.name,
      Role: employee.role || "",
      Email: employee.email || "",
      Status: normaliseEmployeeStatus(employee.status),
      "Start Date": formatDate(employee.start_date),
      Manager: employee.employmentDetails?.manager || "",
      "Probation End Date": formatDate(
        employee.employmentDetails?.probation_end_date || null
      ),
      "Employment End Date": formatDate(
        employee.employmentDetails?.employment_end_date || null
      ),
      "Reason for Leaving":
        employee.employmentDetails?.reason_for_leaving || "",
      "Annual Leave Allowance":
        employee.employmentDetails?.annual_leave_allowance || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    XLSX.writeFile(
      workbook,
      `LEO-Employees-${toDateOnlyValue(new Date())}.xlsx`
    );

    void writeAuditEvent({
      action: "Employee records exported",
      description: `${visibleEmployees.length} employee records were exported from the current Employees view.`,
      entityType: "Employee",
      entityId: null,
      entityName: "Employees export",
      metadata: {
        view_mode: viewMode,
        employee_count: visibleEmployees.length,
        filters,
      },
    });
  }

  function downloadImportResult() {
    if (!importResult) return;

    const worksheet = XLSX.utils.json_to_sheet(
      importResult.rowResults.map((row) => ({
        "Source Row": row.rowNumber,
        Employee: row.name,
        Result: row.result,
        "Employee Reference": row.employeeId || "",
        Details: row.message,
      }))
    );

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Import Results");

    XLSX.writeFile(
      workbook,
      `LEO-Employee-Import-Results-${toDateOnlyValue(new Date())}.xlsx`
    );
  }

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Workforce</div>
          <h1 style={titleStyle}>Employees</h1>
          <p style={subtitleStyle}>
            Manage the organisation’s employee records, employment status and
            workforce entry into Leo.
          </p>
        </div>

        <div style={headerActionsStyle}>
          {canExport && (
            <button
              type="button"
              onClick={exportCurrentEmployeeView}
              style={secondaryButtonStyle}
            >
              Export current view
            </button>
          )}

          {canImport && (
            <button
              type="button"
              onClick={openImportWorkspace}
              style={secondaryButtonStyle}
            >
              Import employees
            </button>
          )}

          {canAddEmployee && (
            <button
              type="button"
              onClick={() => router.push("/dashboard/employees/new")}
              style={primaryButtonStyle}
            >
              Add employee
            </button>
          )}
        </div>
      </header>

      <div style={summaryGridStyle}>
        <SummaryCard
          label="New starters"
          value={newStarterCount}
          detail="Pre-employment or onboarding underway"
          active={viewMode === "new_starters"}
          onClick={() => setViewMode("new_starters")}
        />

        <SummaryCard
          label="Active employees"
          value={activeCount}
          detail="Currently active employee records"
          active={viewMode === "active"}
          onClick={() => setViewMode("active")}
        />

        <SummaryCard
          label="Leaving"
          value={leavingCount}
          detail="Employment end date or notice underway"
          active={viewMode === "leaving"}
          onClick={() => setViewMode("leaving")}
        />

        <SummaryCard
          label="Archived"
          value={archivedCount}
          detail="Preserved historical employee records"
          active={viewMode === "archived"}
          onClick={() => setViewMode("archived")}
        />

        <SummaryCard
          label="All employees"
          value={employees.length}
          detail="All records within your permission scope"
          active={viewMode === "all"}
          onClick={() => setViewMode("all")}
        />
      </div>

      {pageMessage && (
        <MessageBox tone={pageMessageTone}>{pageMessage}</MessageBox>
      )}

      <section style={searchPanelStyle}>
        <div style={searchRowStyle}>
          <label style={searchContainerStyle}>
            <span style={fieldLabelStyle}>Search employees</span>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, role, email, manager, status or reference..."
              style={searchInputStyle}
            />
          </label>

          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            style={
              showFilters || activeFilterCount > 0
                ? activeFilterButtonStyle
                : secondaryButtonStyle
            }
          >
            Filters
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>

          {(search || activeFilterCount > 0) && (
            <button
              type="button"
              onClick={clearFilters}
              style={quietButtonStyle}
            >
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div style={filterGridStyle}>
            <FormField label="Role">
              <select
                value={filters.role}
                onChange={(event) =>
                  updateFilter("role", event.target.value)
                }
                style={inputStyle}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Status">
              <select
                value={filters.status}
                onChange={(event) =>
                  updateFilter("status", event.target.value)
                }
                style={inputStyle}
              >
                <option value="All">All statuses</option>

                {employeeStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Manager">
              <select
                value={filters.manager}
                onChange={(event) =>
                  updateFilter("manager", event.target.value)
                }
                style={inputStyle}
              >
                {managerOptions.map((manager) => (
                  <option key={manager} value={manager}>
                    {manager}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Started from">
              <input
                type="date"
                value={filters.startDateFrom}
                onChange={(event) =>
                  updateFilter("startDateFrom", event.target.value)
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Started before">
              <input
                type="date"
                value={filters.startDateTo}
                onChange={(event) =>
                  updateFilter("startDateTo", event.target.value)
                }
                style={inputStyle}
              />
            </FormField>
          </div>
        )}
      </section>

      <div style={resultsHeaderStyle}>
        <div>
          <div style={resultsTitleStyle}>
            {viewModeLabel(viewMode)}
          </div>

          <div style={resultsSupportingStyle}>
            Showing {visibleEmployees.length} matching employee
            {visibleEmployees.length === 1 ? "" : "s"}.
          </div>
        </div>
      </div>

      {loading ? (
        <PageState
          title="Loading employees"
          message="The workforce register is being prepared."
        />
      ) : loadError ? (
        <PageState
          title="Employees unavailable"
          message={loadError}
          actionLabel="Try again"
          onAction={() => void loadEmployees()}
        />
      ) : visibleEmployees.length === 0 ? (
        <PageState
          title="No matching employees"
          message={
            employees.length === 0
              ? "Add an employee manually or import an existing workforce spreadsheet."
              : "No employee records match the selected view, search or filters."
          }
          actionLabel={
            employees.length === 0 && canImport
              ? "Import employees"
              : "Clear filters"
          }
          onAction={
            employees.length === 0 && canImport
              ? openImportWorkspace
              : clearFilters
          }
        />
      ) : (
        <div style={employeeGridStyle}>
          {visibleEmployees.map((employee) => {
            const status = normaliseEmployeeStatus(employee.status);

            return (
              <button
                key={employee.id}
                type="button"
                onClick={() =>
                  router.push(`/dashboard/employees/${employee.id}`)
                }
                style={employeeCardStyle}
              >
                <div style={employeeCardHeaderStyle}>
                  <div style={employeeInitialStyle}>
                    {employeeInitials(employee.name)}
                  </div>

                  <StatusBadge status={status} />
                </div>

                <div style={employeeCardBodyStyle}>
                  <h2 style={employeeNameStyle}>{employee.name}</h2>

                  <div style={employeeRoleStyle}>
                    {employee.role || "Role not set"}
                  </div>

                  <div style={employeeInformationGridStyle}>
                    <EmployeeInformation
                      label="Employee reference"
                      value={String(employee.id)}
                    />

                    <EmployeeInformation
                      label="Start date"
                      value={formatDate(employee.start_date)}
                    />

                    <EmployeeInformation
                      label="Manager"
                      value={
                        employee.employmentDetails?.manager || "Not set"
                      }
                    />

                    <EmployeeInformation
                      label="Email"
                      value={employee.email || "Not set"}
                    />
                  </div>
                </div>

                <div style={employeeCardFooterStyle}>
                  <span>Open employee workspace</span>
                  <span aria-hidden="true">→</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {canImport && importHistory.length > 0 && (
        <section style={panelStyle}>
          <div style={panelHeadingRowStyle}>
            <div>
              <h2 style={panelTitleStyle}>Recent employee imports</h2>

              <p style={panelDescriptionStyle}>
                Review the latest workforce uploads and their recorded
                outcomes.
              </p>
            </div>
          </div>

          <div style={historyTableWrapperStyle}>
            <table style={historyTableStyle}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Date</th>
                  <th style={tableHeaderStyle}>File</th>
                  <th style={tableHeaderStyle}>Mode</th>
                  <th style={tableHeaderStyle}>Created</th>
                  <th style={tableHeaderStyle}>Updated</th>
                  <th style={tableHeaderStyle}>Skipped</th>
                  <th style={tableHeaderStyle}>Errors</th>
                  <th style={tableHeaderStyle}>Status</th>
                </tr>
              </thead>

              <tbody>
                {importHistory.map((record) => (
                  <tr key={record.id}>
                    <td style={tableCellStyle}>
                      {formatDateTime(record.created_at)}
                    </td>
                    <td style={tableCellStyle}>{record.file_name}</td>
                    <td style={tableCellStyle}>
                      {importModeLabel(record.import_mode)}
                    </td>
                    <td style={tableCellStyle}>{record.created_rows}</td>
                    <td style={tableCellStyle}>{record.updated_rows}</td>
                    <td style={tableCellStyle}>{record.skipped_rows}</td>
                    <td style={tableCellStyle}>{record.error_rows}</td>
                    <td style={tableCellStyle}>
                      <ImportStatusBadge status={record.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showImportWorkspace && (
        <div
          style={modalBackdropStyle}
          role="dialog"
          aria-modal="true"
          aria-label="Employee import workspace"
        >
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <div style={eyebrowStyle}>Employee import</div>
                <h2 style={modalTitleStyle}>Import employees</h2>
                <p style={modalDescriptionStyle}>
                  Upload, map, validate and confirm an existing employee
                  spreadsheet before any records are changed.
                </p>
              </div>

              <button
                type="button"
                onClick={closeImportWorkspace}
                disabled={runningImport}
                style={modalCloseButtonStyle}
                aria-label="Close import workspace"
              >
                ×
              </button>
            </div>

            <ImportStepIndicator currentStep={importStep} />

            <div style={modalContentStyle}>
              {importStep === "upload" && (
                <div style={importSectionStackStyle}>
                  <Panel
                    title="Prepare your employee file"
                    description="Use the Leo template or upload an existing CSV or Excel file."
                  >
                    <div style={downloadActionGridStyle}>
                      <ActionCard
                        title="Download Leo template"
                        description="Start with a clean workbook containing every supported employee field."
                        actionLabel="Download template"
                        onAction={downloadLeoTemplate}
                      />

                      <ActionCard
                        title="Download sample file"
                        description="See two completed example rows before preparing your own import."
                        actionLabel="Download sample"
                        onAction={downloadSampleFile}
                      />
                    </div>
                  </Panel>

                  <Panel
                    title="Upload employee data"
                    description="Supported file types: CSV, XLSX and XLS."
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelection}
                      style={{ display: "none" }}
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={parsingFile}
                      style={
                        parsingFile
                          ? disabledUploadButtonStyle
                          : uploadButtonStyle
                      }
                    >
                      {parsingFile
                        ? "Reading file..."
                        : "Choose employee file"}
                    </button>

                    <div style={uploadGuidanceStyle}>
                      The file is read and validated in the browser first.
                      Nothing is added to Leo until you review and confirm the
                      import.
                    </div>
                  </Panel>

                  <Panel
                    title="Import mode"
                    description="Choose how Leo should handle new and existing employee records."
                  >
                    <div style={importModeGridStyle}>
                      <ImportModeOption
                        title="Create and update"
                        description="Create new employees and update confidently matched existing records."
                        selected={importMode === "create_and_update"}
                        onSelect={() =>
                          setImportMode("create_and_update")
                        }
                      />

                      <ImportModeOption
                        title="Create new only"
                        description="Create new employees and skip any existing matches."
                        selected={importMode === "create_new"}
                        onSelect={() => setImportMode("create_new")}
                      />

                      <ImportModeOption
                        title="Update existing only"
                        description="Update matched employees without creating new records."
                        selected={importMode === "update_existing"}
                        onSelect={() =>
                          setImportMode("update_existing")
                        }
                      />

                      <ImportModeOption
                        title="Preview only"
                        description="Validate the entire file without changing employee records."
                        selected={importMode === "preview_only"}
                        onSelect={() => setImportMode("preview_only")}
                      />
                    </div>
                  </Panel>
                </div>
              )}

              {importStep === "mapping" && (
                <div style={importSectionStackStyle}>
                  <Panel
                    title="Uploaded file"
                    description="Confirm the selected file and source data before mapping."
                  >
                    <div style={uploadedFileStyle}>
                      <div>
                        <div style={uploadedFileNameStyle}>
                          {selectedFile?.name}
                        </div>

                        <div style={uploadedFileMetaStyle}>
                          {sourceRows.length} data row
                          {sourceRows.length === 1 ? "" : "s"} ·{" "}
                          {sourceHeaders.length} source column
                          {sourceHeaders.length === 1 ? "" : "s"}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={resetImportWorkspace}
                        style={quietButtonStyle}
                      >
                        Choose another file
                      </button>
                    </div>
                  </Panel>

                  <Panel
                    title="Map spreadsheet columns"
                    description="Match each source column to the correct Leo employee field. Each Leo field can be mapped once."
                  >
                    <div style={mappingListStyle}>
                      {sourceHeaders.map((header) => (
                        <div key={header} style={mappingRowStyle}>
                          <div>
                            <div style={mappingSourceLabelStyle}>
                              Source column
                            </div>

                            <div style={mappingSourceValueStyle}>
                              {header}
                            </div>

                            <div style={mappingExampleStyle}>
                              Example:{" "}
                              {firstNonEmptyValue(sourceRows, header) ||
                                "No example value"}
                            </div>
                          </div>

                          <div style={mappingArrowStyle}>→</div>

                          <label style={mappingSelectContainerStyle}>
                            <span style={mappingSourceLabelStyle}>
                              Leo field
                            </span>

                            <select
                              value={columnMapping[header] || "ignore"}
                              onChange={(event) =>
                                updateColumnMapping(
                                  header,
                                  event.target.value as ImportField
                                )
                              }
                              style={inputStyle}
                            >
                              {importFieldOptions.map((option) => (
                                <option
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      ))}
                    </div>

                    <div style={modalFooterActionsStyle}>
                      <button
                        type="button"
                        onClick={() => {
                          setImportStep("upload");
                          setSelectedFile(null);
                          setSourceHeaders([]);
                          setSourceRows([]);
                          setColumnMapping({});
                        }}
                        style={secondaryButtonStyle}
                      >
                        Back
                      </button>

                      <button
                        type="button"
                        onClick={() => void validateImportRows()}
                        disabled={validatingImport}
                        style={
                          validatingImport
                            ? disabledPrimaryButtonStyle
                            : primaryButtonStyle
                        }
                      >
                        {validatingImport
                          ? "Validating..."
                          : "Validate import"}
                      </button>
                    </div>
                  </Panel>
                </div>
              )}
                            {importStep === "validation" && (
                <div style={importSectionStackStyle}>
                  <div style={importSummaryGridStyle}>
                    <SummaryMetric
                      label="Rows reviewed"
                      value={importSummary.total}
                    />

                    <SummaryMetric
                      label="Ready to create"
                      value={importSummary.ready}
                    />

                    <SummaryMetric
                      label="Existing updates"
                      value={importSummary.updates}
                    />

                    <SummaryMetric
                      label="Warnings"
                      value={importSummary.warnings}
                    />

                    <SummaryMetric
                      label="Errors"
                      value={importSummary.errors}
                    />

                    <SummaryMetric
                      label="Skipped"
                      value={importSummary.skipped}
                    />
                  </div>

                  <Panel
                    title="Import preview"
                    description="Review every row before confirming the import."
                  >
                    <div style={previewTableWrapperStyle}>
                      <table style={previewTableStyle}>
                        <thead>
                          <tr>
                            <th style={tableHeaderStyle}>Source row</th>
                            <th style={tableHeaderStyle}>Employee</th>
                            <th style={tableHeaderStyle}>Role</th>
                            <th style={tableHeaderStyle}>Email</th>
                            <th style={tableHeaderStyle}>Start date</th>
                            <th style={tableHeaderStyle}>Status</th>
                            <th style={tableHeaderStyle}>Result</th>
                            <th style={tableHeaderStyle}>Details</th>
                          </tr>
                        </thead>

                        <tbody>
                          {validatedRows.map((row) => (
                            <tr key={row.rowNumber}>
                              <td style={tableCellStyle}>{row.rowNumber}</td>

                              <td style={tableCellStyle}>
                                {row.mappedData.name || "Not provided"}
                              </td>

                              <td style={tableCellStyle}>
                                {row.mappedData.role || "Not provided"}
                              </td>

                              <td style={tableCellStyle}>
                                {row.mappedData.email || "Not provided"}
                              </td>

                              <td style={tableCellStyle}>
                                {formatDate(row.mappedData.start_date)}
                              </td>

                              <td style={tableCellStyle}>
                                {normaliseEmployeeStatus(
                                  row.mappedData.status
                                )}
                              </td>

                              <td style={tableCellStyle}>
                                <ValidationStatusBadge status={row.status} />
                              </td>

                              <td style={tableCellStyle}>
                                <div style={validationDetailStyle}>
                                  {row.errors.map((error) => (
                                    <div
                                      key={error}
                                      style={validationErrorTextStyle}
                                    >
                                      {error}
                                    </div>
                                  ))}

                                  {row.warnings.map((warning) => (
                                    <div
                                      key={warning}
                                      style={validationWarningTextStyle}
                                    >
                                      {warning}
                                    </div>
                                  ))}

                                  {row.errors.length === 0 &&
                                    row.warnings.length === 0 && (
                                      <span style={validationReadyTextStyle}>
                                        Ready for import.
                                      </span>
                                    )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={modalFooterActionsStyle}>
                      <button
                        type="button"
                        onClick={() => setImportStep("mapping")}
                        style={secondaryButtonStyle}
                      >
                        Back to mapping
                      </button>

                      <button
                        type="button"
                        onClick={() => void runEmployeeImport()}
                        disabled={
                          runningImport ||
                          importSummary.errors === importSummary.total
                        }
                        style={
                          runningImport ||
                          importSummary.errors === importSummary.total
                            ? disabledPrimaryButtonStyle
                            : primaryButtonStyle
                        }
                      >
                        {importMode === "preview_only"
                          ? "Complete preview"
                          : "Confirm import"}
                      </button>
                    </div>
                  </Panel>
                </div>
              )}

              {importStep === "importing" && (
                <Panel
                  title="Importing employees"
                  description="Leo is creating and updating the confirmed employee records."
                >
                  <div style={progressOuterStyle}>
                    <div
                      style={{
                        ...progressInnerStyle,
                        width: `${importProgress}%`,
                      }}
                    />
                  </div>

                  <div style={progressLabelStyle}>
                    {importProgress}% complete
                  </div>

                  <div style={uploadGuidanceStyle}>
                    Keep this page open until the import has completed.
                  </div>
                </Panel>
              )}

              {importStep === "complete" && importResult && (
                <div style={importSectionStackStyle}>
                  <div style={importSummaryGridStyle}>
                    <SummaryMetric
                      label="Created"
                      value={importResult.created}
                    />

                    <SummaryMetric
                      label="Updated"
                      value={importResult.updated}
                    />

                    <SummaryMetric
                      label="Skipped"
                      value={importResult.skipped}
                    />

                    <SummaryMetric
                      label="Errors"
                      value={importResult.errors}
                    />
                  </div>

                  <Panel
                    title="Import complete"
                    description="Review the final result for each source row."
                  >
                    <div style={previewTableWrapperStyle}>
                      <table style={previewTableStyle}>
                        <thead>
                          <tr>
                            <th style={tableHeaderStyle}>Source row</th>
                            <th style={tableHeaderStyle}>Employee</th>
                            <th style={tableHeaderStyle}>Result</th>
                            <th style={tableHeaderStyle}>
                              Employee reference
                            </th>
                            <th style={tableHeaderStyle}>Details</th>
                          </tr>
                        </thead>

                        <tbody>
                          {importResult.rowResults.map((row) => (
                            <tr key={`${row.rowNumber}-${row.name}`}>
                              <td style={tableCellStyle}>{row.rowNumber}</td>
                              <td style={tableCellStyle}>{row.name}</td>
                              <td style={tableCellStyle}>{row.result}</td>
                              <td style={tableCellStyle}>
                                {row.employeeId || "Not created"}
                              </td>
                              <td style={tableCellStyle}>{row.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={modalFooterActionsStyle}>
                      <button
                        type="button"
                        onClick={downloadImportResult}
                        style={secondaryButtonStyle}
                      >
                        Download result report
                      </button>

                      <button
                        type="button"
                        onClick={closeImportWorkspace}
                        style={primaryButtonStyle}
                      >
                        Finish
                      </button>
                    </div>
                  </Panel>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 900px) {
          .employee-import-modal {
            width: calc(100vw - 24px);
          }
        }
      `}</style>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  active,
  onClick,
}: {
  label: string;
  value: number;
  detail: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={active ? activeSummaryCardStyle : summaryCardStyle}
    >
      <div style={summaryLabelStyle}>{label}</div>
      <div style={summaryValueStyle}>{value}</div>
      <div style={summaryDetailStyle}>{detail}</div>
    </button>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div style={summaryMetricStyle}>
      <div style={summaryLabelStyle}>{label}</div>
      <div style={summaryMetricValueStyle}>{value}</div>
    </div>
  );
}

function EmployeeInformation({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={employeeInformationItemStyle}>
      <div style={employeeInformationLabelStyle}>{label}</div>
      <div style={employeeInformationValueStyle}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span style={getEmployeeStatusStyle(status)}>{status}</span>;
}

function ValidationStatusBadge({
  status,
}: {
  status: ValidationStatus;
}) {
  return <span style={getValidationStatusStyle(status)}>{status}</span>;
}

function ImportStatusBadge({ status }: { status: string }) {
  const normalised = status.replace(/_/g, " ");

  return <span style={getImportStatusStyle(status)}>{normalised}</span>;
}

function ImportStepIndicator({
  currentStep,
}: {
  currentStep: ImportStep;
}) {
  const steps: Array<{
    key: ImportStep;
    label: string;
  }> = [
    { key: "upload", label: "Upload" },
    { key: "mapping", label: "Map columns" },
    { key: "validation", label: "Validate" },
    { key: "importing", label: "Import" },
    { key: "complete", label: "Complete" },
  ];

  const currentIndex = steps.findIndex(
    (step) => step.key === currentStep
  );

  return (
    <div style={stepIndicatorStyle}>
      {steps.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isComplete = index < currentIndex;

        return (
          <div key={step.key} style={stepItemStyle}>
            <div
              style={
                isCurrent
                  ? currentStepCircleStyle
                  : isComplete
                  ? completeStepCircleStyle
                  : stepCircleStyle
              }
            >
              {isComplete ? "✓" : index + 1}
            </div>

            <div
              style={
                isCurrent || isComplete
                  ? activeStepLabelStyle
                  : stepLabelStyle
              }
            >
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
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
        <h2 style={panelTitleStyle}>{title}</h2>

        {description && (
          <p style={panelDescriptionStyle}>{description}</p>
        )}
      </div>

      {children}
    </section>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label style={formFieldStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      {children}
    </label>
  );
}

function ActionCard({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div style={actionCardStyle}>
      <h3 style={actionCardTitleStyle}>{title}</h3>
      <p style={actionCardDescriptionStyle}>{description}</p>

      <button
        type="button"
        onClick={onAction}
        style={secondaryButtonStyle}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function ImportModeOption({
  title,
  description,
  selected,
  onSelect,
}: {
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={selected ? selectedImportModeStyle : importModeStyle}
    >
      <div style={importModeTitleStyle}>{title}</div>
      <div style={importModeDescriptionStyle}>{description}</div>
    </button>
  );
}

function MessageBox({
  tone,
  children,
}: {
  tone: "success" | "error" | "information";
  children: ReactNode;
}) {
  const style =
    tone === "success"
      ? successMessageStyle
      : tone === "error"
      ? errorMessageStyle
      : informationMessageStyle;

  return (
    <div role={tone === "error" ? "alert" : "status"} style={style}>
      {children}
    </div>
  );
}

function PageState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div style={pageStateStyle}>
      <h2 style={pageStateTitleStyle}>{title}</h2>
      <p style={pageStateMessageStyle}>{message}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={primaryButtonStyle}
        >
          {actionLabel}
        </button>
      )}
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

function normaliseEmployeeStatus(
  status: string | null | undefined
): string {
  const normalised = status?.trim().toLowerCase();

  if (!normalised) return "Active";
  if (normalised === "new starter") return "New Starter";
  if (normalised === "active") return "Active";
  if (normalised === "leaving") return "Leaving";
  if (normalised === "former employee") return "Former Employee";
  if (normalised === "archived") return "Archived";
  if (normalised === "suspended") return "Suspended";

  return status?.trim() || "Active";
}

function viewModeLabel(viewMode: ViewMode): string {
  if (viewMode === "new_starters") return "New starters";
  if (viewMode === "active") return "Active employees";
  if (viewMode === "leaving") return "Leaving employees";
  if (viewMode === "archived") return "Archived employees";

  return "All employees";
}

function importModeLabel(value: string): string {
  if (value === "create_new") return "Create new";
  if (value === "update_existing") return "Update existing";
  if (value === "create_and_update") return "Create and update";
  if (value === "preview_only") return "Preview only";

  return value.replace(/_/g, " ");
}

function employeeInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "E";

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");

  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function suggestColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};

  for (const header of headers) {
    const normalised = normaliseHeader(header);

    if (
      ["employee name", "name", "full name", "employee"].includes(normalised)
    ) {
      mapping[header] = "name";
    } else if (
      ["role", "job title", "position", "employee role"].includes(normalised)
    ) {
      mapping[header] = "role";
    } else if (
      ["email", "email address", "work email", "employee email"].includes(
        normalised
      )
    ) {
      mapping[header] = "email";
    } else if (
      ["start date", "employment start date", "date started"].includes(
        normalised
      )
    ) {
      mapping[header] = "start_date";
    } else if (
      ["status", "employment status", "employee status"].includes(normalised)
    ) {
      mapping[header] = "status";
    } else if (
      ["manager", "line manager", "reports to"].includes(normalised)
    ) {
      mapping[header] = "manager";
    } else if (
      ["probation end date", "probation date", "probation end"].includes(
        normalised
      )
    ) {
      mapping[header] = "probation_end_date";
    } else if (
      ["employment end date", "end date", "leaving date"].includes(normalised)
    ) {
      mapping[header] = "employment_end_date";
    } else if (
      ["reason for leaving", "leaving reason"].includes(normalised)
    ) {
      mapping[header] = "reason_for_leaving";
    } else if (
      [
        "annual leave allowance",
        "holiday allowance",
        "leave allowance",
      ].includes(normalised)
    ) {
      mapping[header] = "annual_leave_allowance";
    } else {
      mapping[header] = "ignore";
    }
  }

  return mapping;
}

function normaliseHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function firstNonEmptyValue(
  rows: RawImportRow[],
  column: string
): string {
  for (const row of rows) {
    const value = readString(row[column]).trim();

    if (value) return value;
  }

  return "";
}

function mapImportRow(
  sourceRow: RawImportRow,
  columnMapping: ColumnMapping
): MappedEmployeeRow {
  const mapped: MappedEmployeeRow = {
    name: "",
    role: "",
    email: "",
    start_date: "",
    status: "Active",
    manager: "",
    probation_end_date: "",
    employment_end_date: "",
    reason_for_leaving: "",
    annual_leave_allowance: "",
  };

  for (const [sourceColumn, targetField] of Object.entries(columnMapping)) {
    if (targetField === "ignore") continue;

    const rawValue = sourceRow[sourceColumn];
    const stringValue = readString(rawValue).trim();

    if (
      targetField === "start_date" ||
      targetField === "probation_end_date" ||
      targetField === "employment_end_date"
    ) {
      mapped[targetField] = normaliseImportedDate(stringValue);
    } else {
      mapped[targetField] = stringValue;
    }
  }

  mapped.status = normaliseEmployeeStatus(mapped.status);

  return mapped;
}

function validateImportRow({
  rowNumber,
  sourceRow,
  columnMapping,
  existingEmployees,
  importMode,
}: {
  rowNumber: number;
  sourceRow: RawImportRow;
  columnMapping: ColumnMapping;
  existingEmployees: EmployeeWithDetails[];
  importMode: ImportMode;
}): ValidatedImportRow {
  const mappedData = mapImportRow(sourceRow, columnMapping);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!mappedData.name) {
    errors.push("Employee name is required.");
  }

  if (mappedData.email && !isValidEmail(mappedData.email)) {
    errors.push("Email address is not valid.");
  }

  if (mappedData.start_date && !isValidDateOnly(mappedData.start_date)) {
    errors.push("Start date is not valid.");
  }

  if (
    mappedData.probation_end_date &&
    !isValidDateOnly(mappedData.probation_end_date)
  ) {
    errors.push("Probation end date is not valid.");
  }

  if (
    mappedData.employment_end_date &&
    !isValidDateOnly(mappedData.employment_end_date)
  ) {
    errors.push("Employment end date is not valid.");
  }

  if (
    mappedData.start_date &&
    mappedData.probation_end_date &&
    mappedData.probation_end_date < mappedData.start_date
  ) {
    errors.push("Probation end date cannot be before the start date.");
  }

  if (
    mappedData.start_date &&
    mappedData.employment_end_date &&
    mappedData.employment_end_date < mappedData.start_date
  ) {
    errors.push("Employment end date cannot be before the start date.");
  }

  if (
    mappedData.annual_leave_allowance &&
    Number.isNaN(Number(mappedData.annual_leave_allowance))
  ) {
    errors.push("Annual leave allowance must be a number.");
  }

  if (
    mappedData.status &&
    !employeeStatuses.includes(
      normaliseEmployeeStatus(mappedData.status) as EmployeeStatus
    )
  ) {
    warnings.push(
      `Status "${mappedData.status}" is not a standard Leo employee status.`
    );
  }

  if (!mappedData.role) {
    warnings.push("Role has not been provided.");
  }

  if (!mappedData.start_date) {
    warnings.push("Start date has not been provided.");
  }

  const matchingEmployee = findMatchingEmployee(
    mappedData,
    existingEmployees
  );

  if (matchingEmployee) {
    warnings.push(
      `Possible existing employee match: ${matchingEmployee.name} (reference ${matchingEmployee.id}).`
    );
  }

  let status: ValidationStatus = "ready";

  if (errors.length > 0) {
    status = "error";
  } else if (importMode === "preview_only") {
    status = warnings.length > 0 ? "warning" : "ready";
  } else if (matchingEmployee) {
    if (importMode === "create_new") {
      status = "skip";
      warnings.push("Existing matches are skipped in Create new only mode.");
    } else {
      status = "update";
    }
  } else if (importMode === "update_existing") {
    status = "skip";
    warnings.push(
      "No existing employee match was found for Update existing only mode."
    );
  } else if (warnings.length > 0) {
    status = "warning";
  }

  return {
    rowNumber,
    sourceData: sourceRow,
    mappedData,
    status,
    matchingEmployee,
    errors,
    warnings,
  };
}

function findMatchingEmployee(
  mappedData: MappedEmployeeRow,
  existingEmployees: EmployeeWithDetails[]
): EmployeeWithDetails | null {
  const email = mappedData.email.trim().toLowerCase();

  if (email) {
    const emailMatch = existingEmployees.find(
      (employee) => employee.email?.trim().toLowerCase() === email
    );

    if (emailMatch) return emailMatch;
  }

  const name = mappedData.name.trim().toLowerCase();

  if (!name) return null;

  const nameMatches = existingEmployees.filter(
    (employee) => employee.name.trim().toLowerCase() === name
  );

  if (nameMatches.length === 1) {
    return nameMatches[0];
  }

  if (mappedData.start_date) {
    const nameAndDateMatch = nameMatches.find(
      (employee) => employee.start_date === mappedData.start_date
    );

    if (nameAndDateMatch) return nameAndDateMatch;
  }

  return null;
}

function buildEmployeeUpdatePayload(
  mappedData: MappedEmployeeRow,
  existingEmployee: EmployeeWithDetails
): Record<string, unknown> {
  return {
    name: mappedData.name || existingEmployee.name,
    role: emptyToNull(mappedData.role) ?? existingEmployee.role,
    email: emptyToNull(mappedData.email) ?? existingEmployee.email,
    start_date:
      emptyToNull(mappedData.start_date) ?? existingEmployee.start_date,
    status:
      mappedData.status ||
      normaliseEmployeeStatus(existingEmployee.status),
  };
}

async function upsertEmploymentDetails(
  employeeId: number,
  mappedData: MappedEmployeeRow,
  existingDetails: EmploymentDetails | null
) {
  const payload = {
    employee_id: employeeId,
    manager:
      emptyToNull(mappedData.manager) ?? existingDetails?.manager ?? null,
    probation_end_date:
      emptyToNull(mappedData.probation_end_date) ??
      existingDetails?.probation_end_date ??
      null,
    employment_end_date:
      emptyToNull(mappedData.employment_end_date) ??
      existingDetails?.employment_end_date ??
      null,
    reason_for_leaving:
      emptyToNull(mappedData.reason_for_leaving) ??
      existingDetails?.reason_for_leaving ??
      null,
    annual_leave_allowance:
      emptyToNull(mappedData.annual_leave_allowance) ??
      existingDetails?.annual_leave_allowance ??
      null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("employee_employment_details")
    .upsert(payload, {
      onConflict: "employee_id",
    });

  if (error) {
    throw error;
  }
}

async function saveImportRowResult({
  importId,
  row,
  resultStatus,
  employeeId,
  additionalError,
}: {
  importId: number | null;
  row: ValidatedImportRow;
  resultStatus: string;
  employeeId: number | null;
  additionalError?: string;
}) {
  if (!importId) return;

  const errors = additionalError
    ? [...row.errors, additionalError]
    : row.errors;

  const { error } = await supabase.from("employee_import_rows").insert({
    import_id: importId,
    row_number: row.rowNumber,
    source_data: row.sourceData,
    mapped_data: row.mappedData,
    result_status: resultStatus,
    employee_id: employeeId,
    validation_errors: errors,
    validation_warnings: row.warnings,
  });

  if (error) {
    console.warn("Employee import row history was not saved:", error);
  }
}

async function writeEmployeeImportTimelineEvent({
  employeeId,
  title,
  description,
  sourceRecordId,
  status,
  createdBy,
}: {
  employeeId: number;
  title: string;
  description: string;
  sourceRecordId: string | null;
  status: string;
  createdBy: string | null;
}) {
  const { error } = await supabase.from("employee_timeline").insert({
    organisation_id: null,
    employee_id: employeeId,
    event_type: "Employee Import",
    title,
    description,
    status,
    source_module: "Employees",
    source_record_id: sourceRecordId,
    metadata: {
      import_source: "Employee Import Wizard",
    },
    event_date: new Date().toISOString(),
    created_by: createdBy,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.warn("Employee import timeline event was not saved:", error);
  }
}

async function writeAuditEvent({
  action,
  description,
  entityType,
  entityId,
  entityName,
  metadata,
}: {
  action: string;
  description: string;
  entityType: string;
  entityId: string | null;
  entityName: string;
  metadata: Record<string, unknown>;
}) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email ||
      "System user";

    const { error } = await supabase.from("audit_logs").insert({
      organisation_id: null,
      user_id: user?.id || null,
      user_name: userName,
      user_email: user?.email || null,
      action,
      action_category: "Employee",
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      description,
      previous_values: null,
      new_values: metadata,
      metadata: {
        ...metadata,
        source_module: "Employees",
      },
      source_page: "/dashboard/employees",
      ip_address: null,
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("Employee audit event was not saved:", error);
    }
  } catch (error) {
    console.warn("Employee audit event was not saved:", error);
  }
}

function normaliseImportedDate(value: string): string {
  if (!value) return "";

  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const ukMatch = trimmed.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);

  if (ukMatch) {
    const [, day, month, year] = ukMatch;

    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  return toDateOnlyValue(parsed);
}

function isValidDateOnly(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return false;

  const [, year, month, day] = match;

  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    12,
    0,
    0
  );

  return (
    parsed.getFullYear() === Number(year) &&
    parsed.getMonth() === Number(month) - 1 &&
    parsed.getDate() === Number(day)
  );
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function readString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value instanceof Date) return toDateOnlyValue(value);

  return "";
}

function formatDate(value: string | null): string {
  if (!value) return "Not set";

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    const [, year, month, day] = match;

    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(parsed);
}

function formatDateTime(value: string | null): string {
  if (!value) return "Not recorded";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(parsed);
}

function toDateOnlyValue(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getEmployeeStatusStyle(status: string): CSSProperties {
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

  if (status === "New Starter") {
    return {
      ...shared,
      background: "#F7F1FC",
      color: "#6E5084",
      border: "1px solid #DCCBE7",
    };
  }

  if (status === "Leaving") {
    return {
      ...shared,
      background: "#FFF8E7",
      color: "#7C5A18",
      border: "1px solid #EAD8A5",
    };
  }

  if (status === "Archived" || status === "Former Employee") {
    return {
      ...shared,
      background: "#F3F4F6",
      color: "#626872",
      border: "1px solid #D9DCE1",
    };
  }

  if (status === "Suspended") {
    return {
      ...shared,
      background: "#F8EFF2",
      color: "#76515E",
      border: "1px solid #DEC7CE",
    };
  }

  return {
    ...shared,
    background: "#F5FFF9",
    color: "#356653",
    border: "1px solid #CDE7DA",
  };
}

function getValidationStatusStyle(
  status: ValidationStatus
): CSSProperties {
  const shared: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "5px 9px",
    fontSize: "11px",
    fontWeight: 800,
    textTransform: "capitalize",
  };

  if (status === "ready") {
    return {
      ...shared,
      background: "#F5FFF9",
      color: "#356653",
      border: "1px solid #CDE7DA",
    };
  }

  if (status === "update") {
    return {
      ...shared,
      background: "#F7F1FC",
      color: "#6E5084",
      border: "1px solid #DCCBE7",
    };
  }

  if (status === "warning") {
    return {
      ...shared,
      background: "#FFF8E7",
      color: "#7C5A18",
      border: "1px solid #EAD8A5",
    };
  }

  if (status === "error") {
    return {
      ...shared,
      background: "#FBF2F4",
      color: "#81505B",
      border: "1px solid #E7CBD1",
    };
  }

  return {
    ...shared,
    background: "#F3F4F6",
    color: "#626872",
    border: "1px solid #D9DCE1",
  };
}

function getImportStatusStyle(status: string): CSSProperties {
  if (status === "completed") {
    return getValidationStatusStyle("ready");
  }

  if (status === "completed_with_errors") {
    return getValidationStatusStyle("warning");
  }

  if (status === "processing") {
    return getValidationStatusStyle("update");
  }

  return getValidationStatusStyle("skip");
}

const pageStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1440px",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "18px",
  marginBottom: "20px",
};

const headerActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
};

const eyebrowStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: "5px 0 6px",
  fontSize: "30px",
  color: "#2D2433",
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  color: "#6F6773",
  fontSize: "14px",
  lineHeight: 1.6,
  maxWidth: "720px",
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

const quietButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#6E5084",
  padding: "10px 6px",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "13px",
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
  gap: "12px",
  marginBottom: "18px",
};

const summaryCardStyle: CSSProperties = {
  textAlign: "left",
  background: "#FFFFFF",
  border: "1px solid #E7E1EA",
  borderRadius: "14px",
  padding: "16px",
  cursor: "pointer",
  fontFamily: "inherit",
};

const activeSummaryCardStyle: CSSProperties = {
  ...summaryCardStyle,
  background: "#F7F1FC",
  border: "1px solid #DCCBE7",
};

const summaryLabelStyle: CSSProperties = {
  color: "#79717E",
  fontSize: "12px",
  fontWeight: 700,
};

const summaryValueStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "24px",
  fontWeight: 900,
  marginTop: "7px",
};

const summaryDetailStyle: CSSProperties = {
  color: "#746C78",
  fontSize: "11px",
  lineHeight: 1.5,
  marginTop: "6px",
};

const summaryMetricStyle: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E7E1EA",
  borderRadius: "12px",
  padding: "14px",
};

const summaryMetricValueStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "21px",
  fontWeight: 900,
  marginTop: "6px",
};

const searchPanelStyle: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E7E1EA",
  borderRadius: "16px",
  padding: "16px",
  marginBottom: "18px",
};

const searchRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  flexWrap: "wrap",
  gap: "10px",
};

const searchContainerStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  flex: "1 1 420px",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: "42px",
  border: "1px solid #DCD3E0",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "13px",
};

const activeFilterButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  background: "#F7F1FC",
  border: "1px solid #DCCBE7",
};

const filterGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "12px",
  marginTop: "14px",
  paddingTop: "14px",
  borderTop: "1px solid #EEE8F0",
};

const formFieldStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
};

const fieldLabelStyle: CSSProperties = {
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

const resultsHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "12px",
  marginBottom: "12px",
};

const resultsTitleStyle: CSSProperties = {
  color: "#302638",
  fontSize: "18px",
  fontWeight: 900,
};

const resultsSupportingStyle: CSSProperties = {
  color: "#746C78",
  fontSize: "12px",
  marginTop: "4px",
};

const employeeGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(285px, 1fr))",
  gap: "14px",
  marginBottom: "20px",
};

const employeeCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  textAlign: "left",
  background: "#FFFFFF",
  border: "1px solid #E7E1EA",
  borderRadius: "16px",
  padding: 0,
  overflow: "hidden",
  cursor: "pointer",
  fontFamily: "inherit",
};

const employeeCardHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "16px 16px 0",
};

const employeeInitialStyle: CSSProperties = {
  display: "grid",
  placeItems: "center",
  width: "42px",
  height: "42px",
  borderRadius: "12px",
  background: "#F7F1FC",
  color: "#6E5084",
  fontSize: "14px",
  fontWeight: 900,
};

const employeeCardBodyStyle: CSSProperties = {
  padding: "14px 16px 16px",
};

const employeeNameStyle: CSSProperties = {
  margin: 0,
  color: "#302638",
  fontSize: "19px",
};

const employeeRoleStyle: CSSProperties = {
  color: "#746C78",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginTop: "5px",
};

const employeeInformationGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "9px",
  marginTop: "15px",
};

const employeeInformationItemStyle: CSSProperties = {
  background: "#FBF9FC",
  border: "1px solid #EEE8F0",
  borderRadius: "10px",
  padding: "10px",
  minWidth: 0,
};

const employeeInformationLabelStyle: CSSProperties = {
  color: "#817985",
  fontSize: "10px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const employeeInformationValueStyle: CSSProperties = {
  color: "#3A3040",
  fontSize: "12px",
  fontWeight: 800,
  marginTop: "5px",
  overflowWrap: "anywhere",
};

const employeeCardFooterStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "auto",
  padding: "12px 16px",
  background: "#FBF9FC",
  borderTop: "1px solid #EEE8F0",
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 800,
};

const panelStyle: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E7E1EA",
  borderRadius: "16px",
  padding: "20px",
};

const panelHeadingRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  marginBottom: "14px",
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

const historyTableWrapperStyle: CSSProperties = {
  overflowX: "auto",
};

const historyTableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "820px",
};

const tableHeaderStyle: CSSProperties = {
  textAlign: "left",
  color: "#6B6270",
  fontSize: "11px",
  fontWeight: 900,
  padding: "10px",
  borderBottom: "1px solid #E7E1EA",
  whiteSpace: "nowrap",
};

const tableCellStyle: CSSProperties = {
  color: "#514958",
  fontSize: "12px",
  padding: "11px 10px",
  borderBottom: "1px solid #F0EBF2",
  verticalAlign: "top",
};

const modalBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background: "rgba(35, 27, 40, 0.48)",
  display: "grid",
  placeItems: "center",
  padding: "20px",
};

const modalStyle: CSSProperties = {
  width: "min(1180px, calc(100vw - 40px))",
  maxHeight: "calc(100vh - 40px)",
  overflowY: "auto",
  background: "#F9F7FA",
  borderRadius: "20px",
  border: "1px solid #E1D8E5",
  boxShadow: "0 24px 80px rgba(43, 34, 49, 0.24)",
};

const modalHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  padding: "22px",
  background: "#FFFFFF",
  borderBottom: "1px solid #E7E1EA",
};

const modalTitleStyle: CSSProperties = {
  margin: "5px 0 6px",
  color: "#302638",
  fontSize: "24px",
};

const modalDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "#746C78",
  fontSize: "13px",
  lineHeight: 1.55,
  maxWidth: "700px",
};

const modalCloseButtonStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "10px",
  border: "1px solid #D8CCDE",
  background: "#FFFFFF",
  color: "#5B4568",
  cursor: "pointer",
  fontSize: "22px",
};

const modalContentStyle: CSSProperties = {
  padding: "20px",
};

const stepIndicatorStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "8px",
  padding: "16px 20px",
  background: "#FFFFFF",
  borderBottom: "1px solid #E7E1EA",
};

const stepItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const stepCircleStyle: CSSProperties = {
  display: "grid",
  placeItems: "center",
  width: "26px",
  height: "26px",
  borderRadius: "999px",
  background: "#F3F1F4",
  color: "#8A838E",
  fontSize: "11px",
  fontWeight: 900,
};

const currentStepCircleStyle: CSSProperties = {
  ...stepCircleStyle,
  background: "#6E5084",
  color: "#FFFFFF",
};

const completeStepCircleStyle: CSSProperties = {
  ...stepCircleStyle,
  background: "#F5FFF9",
  color: "#356653",
  border: "1px solid #CDE7DA",
};

const stepLabelStyle: CSSProperties = {
  color: "#8A838E",
  fontSize: "11px",
  fontWeight: 700,
};

const activeStepLabelStyle: CSSProperties = {
  ...stepLabelStyle,
  color: "#5D476A",
  fontWeight: 900,
};

const importSectionStackStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
};

const downloadActionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "12px",
};

const actionCardStyle: CSSProperties = {
  background: "#FBF9FC",
  border: "1px solid #E9E1ED",
  borderRadius: "12px",
  padding: "15px",
};

const actionCardTitleStyle: CSSProperties = {
  margin: 0,
  color: "#3A3040",
  fontSize: "15px",
};

const actionCardDescriptionStyle: CSSProperties = {
  color: "#746C78",
  fontSize: "12px",
  lineHeight: 1.55,
  margin: "7px 0 12px",
};

const uploadButtonStyle: CSSProperties = {
  width: "100%",
  border: "1px dashed #BDAAC7",
  background: "#F7F1FC",
  color: "#6E5084",
  borderRadius: "14px",
  padding: "28px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 900,
};

const disabledUploadButtonStyle: CSSProperties = {
  ...uploadButtonStyle,
  opacity: 0.6,
  cursor: "not-allowed",
};

const uploadGuidanceStyle: CSSProperties = {
  color: "#746C78",
  fontSize: "12px",
  lineHeight: 1.55,
  marginTop: "10px",
};

const importModeGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "10px",
};

const importModeStyle: CSSProperties = {
  textAlign: "left",
  background: "#FFFFFF",
  border: "1px solid #DED5E3",
  borderRadius: "12px",
  padding: "14px",
  cursor: "pointer",
  fontFamily: "inherit",
};

const selectedImportModeStyle: CSSProperties = {
  ...importModeStyle,
  background: "#F7F1FC",
  border: "1px solid #CDB2E2",
};

const importModeTitleStyle: CSSProperties = {
  color: "#4E3D58",
  fontSize: "13px",
  fontWeight: 900,
};

const importModeDescriptionStyle: CSSProperties = {
  color: "#746C78",
  fontSize: "11px",
  lineHeight: 1.5,
  marginTop: "5px",
};

const uploadedFileStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
};

const uploadedFileNameStyle: CSSProperties = {
  color: "#302638",
  fontSize: "14px",
  fontWeight: 900,
};

const uploadedFileMetaStyle: CSSProperties = {
  color: "#746C78",
  fontSize: "12px",
  marginTop: "5px",
};

const mappingListStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
};

const mappingRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 40px minmax(0, 1fr)",
  gap: "12px",
  alignItems: "center",
  padding: "13px",
  background: "#FBF9FC",
  border: "1px solid #E9E1ED",
  borderRadius: "12px",
};

const mappingSourceLabelStyle: CSSProperties = {
  color: "#817985",
  fontSize: "10px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const mappingSourceValueStyle: CSSProperties = {
  color: "#352B3B",
  fontSize: "13px",
  fontWeight: 900,
  marginTop: "4px",
};

const mappingExampleStyle: CSSProperties = {
  color: "#746C78",
  fontSize: "11px",
  marginTop: "5px",
  overflowWrap: "anywhere",
};

const mappingArrowStyle: CSSProperties = {
  textAlign: "center",
  color: "#6E5084",
  fontSize: "18px",
  fontWeight: 900,
};

const mappingSelectContainerStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
};

const modalFooterActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: "9px",
  marginTop: "18px",
};

const importSummaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "10px",
};

const previewTableWrapperStyle: CSSProperties = {
  overflowX: "auto",
};

const previewTableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "980px",
};

const validationDetailStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: "200px",
};

const validationErrorTextStyle: CSSProperties = {
  color: "#81505B",
  fontSize: "11px",
};

const validationWarningTextStyle: CSSProperties = {
  color: "#7C5A18",
  fontSize: "11px",
};

const validationReadyTextStyle: CSSProperties = {
  color: "#356653",
  fontSize: "11px",
};

const progressOuterStyle: CSSProperties = {
  width: "100%",
  height: "14px",
  background: "#EEE8F0",
  borderRadius: "999px",
  overflow: "hidden",
};

const progressInnerStyle: CSSProperties = {
  height: "100%",
  background: "#6E5084",
  borderRadius: "999px",
  transition: "width 180ms ease",
};

const progressLabelStyle: CSSProperties = {
  color: "#5D476A",
  fontSize: "13px",
  fontWeight: 900,
  marginTop: "10px",
};

const pageStateStyle: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E7E1EA",
  borderRadius: "16px",
  padding: "28px",
  textAlign: "center",
  marginBottom: "20px",
};

const pageStateTitleStyle: CSSProperties = {
  margin: 0,
  color: "#302638",
  fontSize: "20px",
};

const pageStateMessageStyle: CSSProperties = {
  margin: "8px auto 16px",
  color: "#746C78",
  fontSize: "13px",
  lineHeight: 1.55,
  maxWidth: "620px",
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