"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as XLSX from "xlsx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PlatformRole = "Owner" | "Senior" | "Manager" | "Employee";

type RegisterView = "compliance" | "training";

type DueFilter =
  | "all"
  | "expired"
  | "due_30"
  | "current"
  | "missing";

type SortDirection = "ascending" | "descending";

type ComplianceStatus =
  | "Expired"
  | "Due within 30 days"
  | "Current"
  | "Awaiting evidence"
  | "Review required"
  | "Not required";

type EmployeeDestination =
  | "overview"
  | "employment"
  | "right_to_work"
  | "dbs"
  | "driving"
  | "learning";

type Site = {
  id: number;
  name: string;
  manager: string | null;
  status: string | null;
};

type Employee = {
  id: number;
  name: string;
  role: string | null;
  email: string | null;
  status: string | null;
  start_date: string | null;
  site_id: number | null;
  department: string | null;
};

type EmploymentDetails = {
  employee_id: number;
  manager: string | null;
  probation_end_date: string | null;
  employment_end_date: string | null;
};

type RightToWorkRecord = {
  id: number;
  employee_id: number;
  nationality: string;
  immigration_status: string | null;
  visa_or_permit_type: string | null;
  right_to_work_expiry: string | null;
  check_completed_date: string | null;
  next_review_date: string | null;
  created_at: string | null;
};

type DbsRecord = {
  id: number;
  employee_id: number;
  dbs_required: string;
  dbs_level: string | null;
  certificate_number: string | null;
  certificate_issue_date: string | null;
  next_check_due: string | null;
  update_service: string | null;
  update_service_id: string | null;
  update_service_last_check_date: string | null;
  update_service_next_check_due: string | null;
  safeguarding_training_completed: string | null;
  safeguarding_training_expiry: string | null;
  created_at: string | null;
};

type DrivingRecord = {
  id: number;
  employee_id: number;
  drives_for_work: string;
  vehicle_used: string | null;
  vehicle_registration: string | null;
  vehicle_ownership: string | null;
  authorised_to_drive: string | null;
  licence_expiry_date: string | null;
  dvla_check_completed: string | null;
  dvla_check_date: string | null;
  next_dvla_check_due: string | null;
  business_insurance_confirmed: string | null;
  business_insurance_expiry_date: string | null;
  mot_required: string | null;
  mot_expiry_date: string | null;
  created_at: string | null;
};

type TrainingRecord = {
  id: number;
  employee_id: number;
  training_name: string;
  date_completed: string | null;
  refresh_or_expiry_date: string | null;
  notes: string | null;
  created_at: string | null;
};

type ComplianceCell = {
  label: string;
  status: ComplianceStatus;
  date: string | null;
  daysRemaining: number | null;
  detail: string;
  destination: EmployeeDestination;
};

type ComplianceRegisterRow = {
  employeeId: number;
  employeeName: string;
  employeeStatus: string;
  role: string;
  siteId: number | null;
  siteName: string;
  department: string;
  manager: string;
  rightToWork: ComplianceCell;
  visa: ComplianceCell;
  dbs: ComplianceCell;
  updateService: ComplianceCell;
  safeguarding: ComplianceCell;
  drivingLicence: ComplianceCell;
  dvla: ComplianceCell;
  businessInsurance: ComplianceCell;
  mot: ComplianceCell;
  probation: ComplianceCell;
  reviewCount: number;
  soonestDays: number | null;
};

type TrainingRegisterRow = {
  employeeId: number;
  employeeName: string;
  employeeStatus: string;
  role: string;
  siteId: number | null;
  siteName: string;
  department: string;
  manager: string;
  trainingId: number | null;
  trainingName: string;
  dateCompleted: string | null;
  refreshDate: string | null;
  status: ComplianceStatus;
  daysRemaining: number | null;
  detail: string;
};

type RegisterFilters = {
  site: string;
  department: string;
  manager: string;
  employeeStatus: string;
  due: DueFilter;
};

type SortState = {
  column: string;
  direction: SortDirection;
};

const roleRank: Record<PlatformRole, number> = {
  Employee: 1,
  Manager: 2,
  Senior: 3,
  Owner: 4,
};

const defaultFilters: RegisterFilters = {
  site: "All",
  department: "All",
  manager: "All",
  employeeStatus: "Active",
  due: "all",
};

const dueFilterOptions: Array<{
  value: DueFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "All records",
  },
  {
    value: "expired",
    label: "Expired",
  },
  {
    value: "due_30",
    label: "Due within 30 days",
  },
  {
    value: "current",
    label: "Current",
  },
  {
    value: "missing",
    label: "Awaiting evidence",
  },
];

export default function CompliancePage() {
  const router = useRouter();

  const [platformRole, setPlatformRole] =
    useState<PlatformRole>("Owner");

  const [activeView, setActiveView] =
    useState<RegisterView>("compliance");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [employmentDetails, setEmploymentDetails] = useState<
    EmploymentDetails[]
  >([]);

  const [rightToWorkRecords, setRightToWorkRecords] = useState<
    RightToWorkRecord[]
  >([]);

  const [dbsRecords, setDbsRecords] = useState<DbsRecord[]>([]);

  const [drivingRecords, setDrivingRecords] = useState<
    DrivingRecord[]
  >([]);

  const [trainingRecords, setTrainingRecords] = useState<
    TrainingRecord[]
  >([]);

  const [filters, setFilters] =
    useState<RegisterFilters>(defaultFilters);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  const [complianceSort, setComplianceSort] =
    useState<SortState>({
      column: "employeeName",
      direction: "ascending",
    });

  const [trainingSort, setTrainingSort] =
    useState<SortState>({
      column: "employeeName",
      direction: "ascending",
    });

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<
    number[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const [pageMessage, setPageMessage] = useState("");
  const [pageMessageTone, setPageMessageTone] = useState<
    "success" | "error" | "information"
  >("information");

  const hasPermission = useCallback(
    (minimumRole: PlatformRole) =>
      roleRank[platformRole] >= roleRank[minimumRole],
    [platformRole]
  );

  const canViewRegisters = hasPermission("Manager");
  const canExport = hasPermission("Senior");
  const canUseBulkActions = hasPermission("Senior");

  const showMessage = useCallback(
    (
      message: string,
      tone: "success" | "error" | "information"
    ) => {
      setPageMessage(message);
      setPageMessageTone(tone);
    },
    []
  );

  const loadCurrentUser = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPlatformRole("Owner");
        return;
      }

      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !profile) {
        setPlatformRole("Owner");
        return;
      }

      const role =
        readString(profile.platform_role) ||
        readString(profile.role) ||
        readString(profile.access_level);

      setPlatformRole(normalisePlatformRole(role));
    } catch (error) {
      console.warn(
        "Compliance permissions could not be loaded:",
        error
      );

      setPlatformRole("Owner");
    }
  }, []);

  const loadComplianceData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    setPageMessage("");

    const [
      employeeResult,
      siteResult,
      employmentResult,
      rightToWorkResult,
      dbsResult,
      drivingResult,
      trainingResult,
    ] = await Promise.all([
      supabase
        .from("employees")
        .select(
          "id, name, role, email, status, start_date, site_id, department"
        )
        .order("name", {
          ascending: true,
        }),

      supabase
        .from("sites")
        .select("id, name, manager, status")
        .order("name", {
          ascending: true,
        }),

      supabase
        .from("employee_employment_details")
        .select(
          "employee_id, manager, probation_end_date, employment_end_date"
        ),

      supabase
        .from("employee_right_to_work")
        .select(
          "id, employee_id, nationality, immigration_status, visa_or_permit_type, right_to_work_expiry, check_completed_date, next_review_date, created_at"
        )
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("employee_dbs_checks")
        .select(
          "id, employee_id, dbs_required, dbs_level, certificate_number, certificate_issue_date, next_check_due, update_service, update_service_id, update_service_last_check_date, update_service_next_check_due, safeguarding_training_completed, safeguarding_training_expiry, created_at"
        )
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("employee_driving_checks")
        .select(
          "id, employee_id, drives_for_work, vehicle_used, vehicle_registration, vehicle_ownership, authorised_to_drive, licence_expiry_date, dvla_check_completed, dvla_check_date, next_dvla_check_due, business_insurance_confirmed, business_insurance_expiry_date, mot_required, mot_expiry_date, created_at"
        )
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("employee_training_logs")
        .select(
          "id, employee_id, training_name, date_completed, refresh_or_expiry_date, notes, created_at"
        )
        .order("refresh_or_expiry_date", {
          ascending: true,
        }),
    ]);

    if (employeeResult.error) {
      console.error(
        "Employee records could not be loaded:",
        employeeResult.error
      );

      setLoadError(
        "The compliance registers could not be loaded because employee records are unavailable."
      );

      setLoading(false);
      return;
    }

    const optionalErrors = [
      siteResult.error,
      employmentResult.error,
      rightToWorkResult.error,
      dbsResult.error,
      drivingResult.error,
      trainingResult.error,
    ].filter(Boolean);

    if (optionalErrors.length > 0) {
      console.warn(
        "Some compliance data sources could not be loaded:",
        optionalErrors
      );

      showMessage(
        "Some connected compliance records could not be loaded. Available records are still shown.",
        "information"
      );
    }

    setEmployees((employeeResult.data || []) as Employee[]);
    setSites((siteResult.data || []) as Site[]);

    setEmploymentDetails(
      (employmentResult.data || []) as EmploymentDetails[]
    );

    setRightToWorkRecords(
      (rightToWorkResult.data || []) as RightToWorkRecord[]
    );

    setDbsRecords((dbsResult.data || []) as DbsRecord[]);

    setDrivingRecords(
      (drivingResult.data || []) as DrivingRecord[]
    );

    setTrainingRecords(
      (trainingResult.data || []) as TrainingRecord[]
    );

    setLastUpdated(
      new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/London",
      }).format(new Date())
    );

    setLoading(false);
  }, [showMessage]);

  useEffect(() => {
    void loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    void loadComplianceData();
  }, [loadComplianceData]);

  useEffect(() => {
    setSelectedEmployeeIds([]);
  }, [activeView, filters, search]);

  const siteMap = useMemo(
    () =>
      new Map<number, string>(
        sites.map((site) => [site.id, site.name])
      ),
    [sites]
  );

  const employmentMap = useMemo(
    () =>
      mapLatestByEmployee(
        employmentDetails,
        (record) => record.employee_id
      ),
    [employmentDetails]
  );

  const rightToWorkMap = useMemo(
    () =>
      mapLatestByEmployee(
        rightToWorkRecords,
        (record) => record.employee_id
      ),
    [rightToWorkRecords]
  );

  const dbsMap = useMemo(
    () =>
      mapLatestByEmployee(
        dbsRecords,
        (record) => record.employee_id
      ),
    [dbsRecords]
  );

  const drivingMap = useMemo(
    () =>
      mapLatestByEmployee(
        drivingRecords,
        (record) => record.employee_id
      ),
    [drivingRecords]
  );

  const complianceRows = useMemo<ComplianceRegisterRow[]>(() => {
    return employees.map((employee) => {
      const employment =
        employmentMap.get(employee.id) || null;

      const rightToWork =
        rightToWorkMap.get(employee.id) || null;

      const dbs = dbsMap.get(employee.id) || null;

      const driving =
        drivingMap.get(employee.id) || null;

      const rightToWorkCell = buildDateCell({
        label: "Right to Work",
        date:
          rightToWork?.next_review_date ||
          rightToWork?.right_to_work_expiry ||
          null,
        missingStatus: "Awaiting evidence",
        missingDetail:
          "No Right to Work review or expiry date is recorded.",
        destination: "right_to_work",
      });

      const visaRequired =
        Boolean(rightToWork?.visa_or_permit_type) ||
        Boolean(rightToWork?.right_to_work_expiry);

      const visaCell = visaRequired
        ? buildDateCell({
            label:
              rightToWork?.visa_or_permit_type ||
              "Visa / permit",
            date:
              rightToWork?.right_to_work_expiry ||
              null,
            missingStatus: "Review required",
            missingDetail:
              "A visa or permit is recorded without an expiry date.",
            destination: "right_to_work",
          })
        : buildNotRequiredCell({
            label: "Visa / permit",
            detail:
              "No visa or permit requirement is recorded.",
            destination: "right_to_work",
          });

      const dbsRequired = isAffirmative(
        dbs?.dbs_required
      );

      const dbsCell = dbsRequired
        ? buildDateCell({
            label: dbs?.dbs_level
              ? `${dbs.dbs_level} DBS`
              : "DBS",
            date: dbs?.next_check_due || null,
            missingStatus: "Awaiting evidence",
            missingDetail:
              "DBS is required but the next three-year check date is not recorded.",
            destination: "dbs",
          })
        : dbs
        ? buildNotRequiredCell({
            label: "DBS",
            detail:
              "DBS is recorded as not required.",
            destination: "dbs",
          })
        : buildMissingCell({
            label: "DBS requirement",
            detail:
              "The employee's DBS requirement has not been confirmed.",
            destination: "dbs",
          });

      const updateServiceActive = isAffirmative(
        dbs?.update_service
      );

      const updateServiceCell = updateServiceActive
        ? buildDateCell({
            label: "Update Service",
            date:
              dbs?.update_service_next_check_due ||
              null,
            missingStatus: "Review required",
            missingDetail:
              "The DBS Update Service is active but the next annual status-check date is not recorded.",
            destination: "dbs",
          })
        : buildNotRequiredCell({
            label: "Update Service",
            detail:
              "The employee is not recorded as using the DBS Update Service.",
            destination: "dbs",
          });

      const safeguardingCell = dbsRequired
        ? buildDateCell({
            label: "Safeguarding",
            date:
              dbs?.safeguarding_training_expiry ||
              null,
            missingStatus: "Awaiting evidence",
            missingDetail:
              "Safeguarding training expiry has not been recorded.",
            destination: "dbs",
          })
        : buildNotRequiredCell({
            label: "Safeguarding",
            detail:
              "No safeguarding requirement is currently recorded.",
            destination: "dbs",
          });

      const drivesForWork = isAffirmative(
        driving?.drives_for_work
      );

      const drivingLicenceCell = drivesForWork
        ? buildDateCell({
            label: "Driving licence",
            date:
              driving?.licence_expiry_date || null,
            missingStatus: "Awaiting evidence",
            missingDetail:
              "The employee drives for work but no driving licence expiry is recorded.",
            destination: "driving",
          })
        : buildNotRequiredCell({
            label: "Driving licence",
            detail:
              "The employee is not recorded as driving for work.",
            destination: "driving",
          });

      const dvlaCell = drivesForWork
        ? buildDateCell({
            label: "Annual DVLA check",
            date:
              driving?.next_dvla_check_due || null,
            missingStatus: "Awaiting evidence",
            missingDetail:
              "The next annual DVLA check date has not been recorded.",
            destination: "driving",
          })
        : buildNotRequiredCell({
            label: "Annual DVLA check",
            detail:
              "The employee is not recorded as driving for work.",
            destination: "driving",
          });

      const businessInsuranceCell = drivesForWork
        ? buildDateCell({
            label: "Business insurance",
            date:
              driving?.business_insurance_expiry_date ||
              null,
            missingStatus: "Awaiting evidence",
            missingDetail:
              "Business-use insurance expiry has not been recorded.",
            destination: "driving",
          })
        : buildNotRequiredCell({
            label: "Business insurance",
            detail:
              "The employee is not recorded as using a vehicle for work.",
            destination: "driving",
          });

      const personalVehicle =
        normaliseText(driving?.vehicle_ownership).includes(
          "personal"
        ) ||
        normaliseText(driving?.vehicle_used).includes(
          "personal"
        ) ||
        isAffirmative(driving?.mot_required);

      const motCell =
        drivesForWork && personalVehicle
          ? buildDateCell({
              label: "MOT",
              date:
                driving?.mot_expiry_date || null,
              missingStatus: "Awaiting evidence",
              missingDetail:
                "A personal vehicle is used for work but the MOT expiry is not recorded.",
              destination: "driving",
            })
          : buildNotRequiredCell({
              label: "MOT",
              detail: drivesForWork
                ? "MOT monitoring is not recorded as required for this vehicle."
                : "The employee is not recorded as driving for work.",
              destination: "driving",
            });

      const probationCell = employment?.probation_end_date
        ? buildDateCell({
            label: "Probation",
            date: employment.probation_end_date,
            missingStatus: "Review required",
            missingDetail:
              "Probation end date has not been recorded.",
            destination: "employment",
          })
        : buildNotRequiredCell({
            label: "Probation",
            detail:
              "No probation end date is currently recorded.",
            destination: "employment",
          });

      const cells: ComplianceCell[] = [
        rightToWorkCell,
        visaCell,
        dbsCell,
        updateServiceCell,
        safeguardingCell,
        drivingLicenceCell,
        dvlaCell,
        businessInsuranceCell,
        motCell,
        probationCell,
      ];

      const reviewCount = cells.filter((cell) =>
        isActionableStatus(cell.status)
      ).length;

      const soonestDays = cells
        .map((cell) => cell.daysRemaining)
        .filter(
          (value): value is number =>
            typeof value === "number"
        )
        .sort((first, second) => first - second)[0];

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        employeeStatus: normaliseEmployeeStatus(
          employee.status
        ),
        role: employee.role || "Not set",
        siteId: employee.site_id,
        siteName: employee.site_id
          ? siteMap.get(employee.site_id) ||
            "Site not found"
          : "Not assigned",
        department:
          employee.department || "Not set",
        manager:
          employment?.manager || "Not set",
        rightToWork: rightToWorkCell,
        visa: visaCell,
        dbs: dbsCell,
        updateService: updateServiceCell,
        safeguarding: safeguardingCell,
        drivingLicence: drivingLicenceCell,
        dvla: dvlaCell,
        businessInsurance: businessInsuranceCell,
        mot: motCell,
        probation: probationCell,
        reviewCount,
        soonestDays:
          typeof soonestDays === "number"
            ? soonestDays
            : null,
      };
    });
  }, [
    dbsMap,
    drivingMap,
    employees,
    employmentMap,
    rightToWorkMap,
    siteMap,
  ]);

  const trainingRows = useMemo<TrainingRegisterRow[]>(() => {
    const recordsByEmployee = new Map<
      number,
      TrainingRecord[]
    >();

    for (const record of trainingRecords) {
      const existing =
        recordsByEmployee.get(record.employee_id) || [];

      existing.push(record);

      recordsByEmployee.set(
        record.employee_id,
        existing
      );
    }

    const rows: TrainingRegisterRow[] = [];

    for (const employee of employees) {
      const employment =
        employmentMap.get(employee.id) || null;

      const employeeTraining =
        recordsByEmployee.get(employee.id) || [];

      const baseRow = {
        employeeId: employee.id,
        employeeName: employee.name,
        employeeStatus: normaliseEmployeeStatus(
          employee.status
        ),
        role: employee.role || "Not set",
        siteId: employee.site_id,
        siteName: employee.site_id
          ? siteMap.get(employee.site_id) ||
            "Site not found"
          : "Not assigned",
        department:
          employee.department || "Not set",
        manager:
          employment?.manager || "Not set",
      };

      if (employeeTraining.length === 0) {
        rows.push({
          ...baseRow,
          trainingId: null,
          trainingName: "No learning recorded",
          dateCompleted: null,
          refreshDate: null,
          status: "Awaiting evidence",
          daysRemaining: null,
          detail:
            "No employee training or qualification records have been added.",
        });

        continue;
      }

      for (const training of employeeTraining) {
        const statusCell = training.refresh_or_expiry_date
          ? buildDateCell({
              label: training.training_name,
              date:
                training.refresh_or_expiry_date,
              missingStatus: "Awaiting evidence",
              missingDetail:
                "No refresher or expiry date is recorded.",
              destination: "learning",
            })
          : training.date_completed
          ? {
              label: training.training_name,
              status: "Current" as ComplianceStatus,
              date: null,
              daysRemaining: null,
              detail:
                "Completed with no refresher requirement recorded.",
              destination:
                "learning" as EmployeeDestination,
            }
          : buildMissingCell({
              label: training.training_name,
              detail:
                "Completion evidence has not been recorded.",
              destination: "learning",
            });

        rows.push({
          ...baseRow,
          trainingId: training.id,
          trainingName: training.training_name,
          dateCompleted:
            training.date_completed,
          refreshDate:
            training.refresh_or_expiry_date,
          status: statusCell.status,
          daysRemaining:
            statusCell.daysRemaining,
          detail:
            training.notes ||
            statusCell.detail,
        });
      }
    }

    return rows;
  }, [
    employees,
    employmentMap,
    siteMap,
    trainingRecords,
  ]);

  const siteOptions = useMemo(
    () => [
      "All",
      ...sites
        .filter(
          (site) =>
            normaliseEmployeeStatus(
              site.status || "Active"
            ) !== "Archived"
        )
        .map((site) => site.name),
    ],
    [sites]
  );

  const departmentOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          employees
            .map((employee) =>
              employee.department?.trim()
            )
            .filter(
              (value): value is string =>
                Boolean(value)
            )
        )
      ).sort((first, second) =>
        first.localeCompare(second)
      ),
    ],
    [employees]
  );

  const managerOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          employmentDetails
            .map((record) =>
              record.manager?.trim()
            )
            .filter(
              (value): value is string =>
                Boolean(value)
            )
        )
      ).sort((first, second) =>
        first.localeCompare(second)
      ),
    ],
    [employmentDetails]
  );

  const filteredComplianceRows = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    const filtered = complianceRows.filter((row) => {
      if (!matchesRegisterFilters(row, filters)) {
        return false;
      }

      if (
        filters.due !== "all" &&
        !complianceRowMatchesDueFilter(
          row,
          filters.due
        )
      ) {
        return false;
      }

      if (!searchValue) return true;

      return [
        row.employeeName,
        row.employeeStatus,
        row.role,
        row.siteName,
        row.department,
        row.manager,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchValue);
    });

    return sortComplianceRows(
      filtered,
      complianceSort
    );
  }, [
    complianceRows,
    complianceSort,
    filters,
    search,
  ]);

  const filteredTrainingRows = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    const filtered = trainingRows.filter((row) => {
      if (!matchesRegisterFilters(row, filters)) {
        return false;
      }

      if (
        filters.due !== "all" &&
        !statusMatchesDueFilter(
          row.status,
          filters.due
        )
      ) {
        return false;
      }

      if (!searchValue) return true;

      return [
        row.employeeName,
        row.employeeStatus,
        row.role,
        row.siteName,
        row.department,
        row.manager,
        row.trainingName,
        row.detail,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchValue);
    });

    return sortTrainingRows(
      filtered,
      trainingSort
    );
  }, [
    filters,
    search,
    trainingRows,
    trainingSort,
  ]);

  const uniqueVisibleEmployeeIds = useMemo(() => {
    const activeRows =
      activeView === "compliance"
        ? filteredComplianceRows
        : filteredTrainingRows;

    return Array.from(
      new Set(
        activeRows.map((row) => row.employeeId)
      )
    );
  }, [
    activeView,
    filteredComplianceRows,
    filteredTrainingRows,
  ]);

  const metrics = useMemo(() => {
    const complianceCells = complianceRows.flatMap(
      (row) => [
        row.rightToWork,
        row.visa,
        row.dbs,
        row.updateService,
        row.safeguarding,
        row.drivingLicence,
        row.dvla,
        row.businessInsurance,
        row.mot,
        row.probation,
      ]
    );

    return {
      employees: complianceRows.length,

      expired: complianceCells.filter(
        (cell) => cell.status === "Expired"
      ).length,

      dueWithin30: complianceCells.filter(
        (cell) =>
          cell.status === "Due within 30 days"
      ).length,

      awaitingEvidence: complianceCells.filter(
        (cell) =>
          cell.status === "Awaiting evidence" ||
          cell.status === "Review required"
      ).length,

      learningDue: trainingRows.filter(
        (row) =>
          row.status === "Expired" ||
          row.status === "Due within 30 days"
      ).length,
    };
  }, [complianceRows, trainingRows]);

  function updateFilter<K extends keyof RegisterFilters>(
    field: K,
    value: RegisterFilters[K]
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

  function toggleEmployeeSelection(
    employeeId: number
  ) {
    setSelectedEmployeeIds((current) =>
      current.includes(employeeId)
        ? current.filter(
            (id) => id !== employeeId
          )
        : [...current, employeeId]
    );
  }

  function toggleAllVisibleEmployees() {
    const allSelected =
      uniqueVisibleEmployeeIds.length > 0 &&
      uniqueVisibleEmployeeIds.every((employeeId) =>
        selectedEmployeeIds.includes(employeeId)
      );

    if (allSelected) {
      setSelectedEmployeeIds((current) =>
        current.filter(
          (employeeId) =>
            !uniqueVisibleEmployeeIds.includes(
              employeeId
            )
        )
      );

      return;
    }

    setSelectedEmployeeIds((current) =>
      Array.from(
        new Set([
          ...current,
          ...uniqueVisibleEmployeeIds,
        ])
      )
    );
  }

  function updateComplianceSort(column: string) {
    setComplianceSort((current) => ({
      column,
      direction:
        current.column === column &&
        current.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  }

  function updateTrainingSort(column: string) {
    setTrainingSort((current) => ({
      column,
      direction:
        current.column === column &&
        current.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  }

  function openEmployeeSection(
    employeeId: number,
    destination: EmployeeDestination
  ) {
    const sectionMap: Record<
      EmployeeDestination,
      string
    > = {
      overview: "Overview",
      employment: "Employment",
      right_to_work: "Right to Work",
      dbs: "DBS / Safeguarding",
      driving: "Driving",
      learning: "Learning",
    };

    router.push(
      `/dashboard/employees/${employeeId}?section=${encodeURIComponent(
        sectionMap[destination]
      )}`
    );
  }

  async function exportCurrentRegister() {
    if (!canExport) return;

    const exportRows =
      activeView === "compliance"
        ? buildComplianceExportRows(
            filteredComplianceRows
          )
        : buildTrainingExportRows(
            filteredTrainingRows
          );

    if (exportRows.length === 0) {
      showMessage(
        "There are no records in the current view to export.",
        "error"
      );

      return;
    }

    const worksheet =
      XLSX.utils.json_to_sheet(exportRows);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      activeView === "compliance"
        ? "Compliance Register"
        : "Training Register"
    );

    XLSX.writeFile(
      workbook,
      `LEO-${
        activeView === "compliance"
          ? "Compliance-Register"
          : "Training-Register"
      }-${toDateOnlyValue(new Date())}.xlsx`
    );

    await writeComplianceAuditEvent({
      action:
        activeView === "compliance"
          ? "Compliance register exported"
          : "Training register exported",
      description: `${exportRows.length} register rows were exported.`,
      entityName:
        activeView === "compliance"
          ? "Compliance Register"
          : "Training Register",
      metadata: {
        view: activeView,
        filters,
        row_count: exportRows.length,
      },
    });

    showMessage(
      "The current register has been exported.",
      "success"
    );
  }

  async function exportSelectedEmployees() {
    if (
      !canExport ||
      selectedEmployeeIds.length === 0
    ) {
      return;
    }

    const exportRows =
      activeView === "compliance"
        ? buildComplianceExportRows(
            filteredComplianceRows.filter((row) =>
              selectedEmployeeIds.includes(
                row.employeeId
              )
            )
          )
        : buildTrainingExportRows(
            filteredTrainingRows.filter((row) =>
              selectedEmployeeIds.includes(
                row.employeeId
              )
            )
          );

    const worksheet =
      XLSX.utils.json_to_sheet(exportRows);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      activeView === "compliance"
        ? "Selected Compliance"
        : "Selected Training"
    );

    XLSX.writeFile(
      workbook,
      `LEO-Selected-${
        activeView === "compliance"
          ? "Compliance"
          : "Training"
      }-${toDateOnlyValue(new Date())}.xlsx`
    );

    await writeComplianceAuditEvent({
      action:
        "Selected compliance records exported",
      description: `${selectedEmployeeIds.length} selected employee records were exported.`,
      entityName:
        "Selected compliance records",
      metadata: {
        view: activeView,
        selected_employee_ids:
          selectedEmployeeIds,
        row_count: exportRows.length,
      },
    });

    showMessage(
      "The selected records have been exported.",
      "success"
    );
  }

  if (!canViewRegisters) {
    return (
      <PageState
        title="Compliance registers unavailable"
        message="Your current permission level does not include organisation compliance registers."
      />
    );
  }

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>
            Workforce assurance
          </div>

          <h1 style={titleStyle}>Compliance</h1>

          <p style={subtitleStyle}>
            Review employee checks and learning
            renewal dates in clear spreadsheet-style
            registers.
          </p>

          {lastUpdated && (
            <div style={lastUpdatedStyle}>
              Last refreshed: {lastUpdated}
            </div>
          )}
        </div>

        <div style={headerActionsStyle}>
          <button
            type="button"
            onClick={() =>
              void loadComplianceData()
            }
            style={secondaryButtonStyle}
          >
            Refresh
          </button>

          {canExport && (
            <button
              type="button"
              onClick={() =>
                void exportCurrentRegister()
              }
              style={primaryButtonStyle}
            >
              Export current view
            </button>
          )}
        </div>
      </header>

      <div style={summaryGridStyle}>
        <SummaryCard
          label="Employees"
          value={metrics.employees}
          detail="Employees within the register"
        />

        <SummaryCard
          label="Expired"
          value={metrics.expired}
          detail="Recorded dates that have passed"
          tone="expired"
        />

        <SummaryCard
          label="Due within 30 days"
          value={metrics.dueWithin30}
          detail="Renewals approaching"
          tone="due"
        />

        <SummaryCard
          label="Awaiting evidence"
          value={metrics.awaitingEvidence}
          detail="Missing or unconfirmed records"
          tone="missing"
        />

        <SummaryCard
          label="Learning due"
          value={metrics.learningDue}
          detail="Training expired or due shortly"
          tone="due"
        />
      </div>

      <StatusLegend />

      {pageMessage && (
        <MessageBox tone={pageMessageTone}>
          {pageMessage}
        </MessageBox>
      )}

      <div style={viewTabsStyle}>
        <button
          type="button"
          onClick={() =>
            setActiveView("compliance")
          }
          style={
            activeView === "compliance"
              ? activeViewTabStyle
              : viewTabStyle
          }
        >
          Compliance Register
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveView("training")
          }
          style={
            activeView === "training"
              ? activeViewTabStyle
              : viewTabStyle
          }
        >
          Training Register
        </button>
      </div>

      <section style={filterPanelStyle}>
        <div style={filterTopRowStyle}>
          <label style={searchContainerStyle}>
            <span style={fieldLabelStyle}>
              Search register
            </span>

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search employee, role, site, department, manager or learning..."
              style={inputStyle}
            />
          </label>

          <button
            type="button"
            onClick={() =>
              setShowFilters((current) => !current)
            }
            style={secondaryButtonStyle}
          >
            {showFilters
              ? "Hide filters"
              : "Show filters"}
          </button>

          <button
            type="button"
            onClick={clearFilters}
            style={quietButtonStyle}
          >
            Clear
          </button>
        </div>

        {showFilters && (
          <div style={filterGridStyle}>
            <FormField label="Site">
              <select
                value={filters.site}
                onChange={(event) =>
                  updateFilter(
                    "site",
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                {siteOptions.map((site) => (
                  <option
                    key={site}
                    value={site}
                  >
                    {site === "All"
                      ? "All sites"
                      : site}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Department">
              <select
                value={filters.department}
                onChange={(event) =>
                  updateFilter(
                    "department",
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                {departmentOptions.map(
                  (department) => (
                    <option
                      key={department}
                      value={department}
                    >
                      {department === "All"
                        ? "All departments"
                        : department}
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField label="Manager">
              <select
                value={filters.manager}
                onChange={(event) =>
                  updateFilter(
                    "manager",
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                {managerOptions.map(
                  (manager) => (
                    <option
                      key={manager}
                      value={manager}
                    >
                      {manager === "All"
                        ? "All managers"
                        : manager}
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField label="Employee status">
              <select
                value={filters.employeeStatus}
                onChange={(event) =>
                  updateFilter(
                    "employeeStatus",
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                <option value="All">
                  All statuses
                </option>
                <option value="New Starter">
                  New Starter
                </option>
                <option value="Active">
                  Active
                </option>
                <option value="Leaving">
                  Leaving
                </option>
                <option value="Former Employee">
                  Former Employee
                </option>
                <option value="Archived">
                  Archived
                </option>
                <option value="Suspended">
                  Suspended
                </option>
              </select>
            </FormField>

            <FormField label="Due position">
              <select
                value={filters.due}
                onChange={(event) =>
                  updateFilter(
                    "due",
                    event.target.value as DueFilter
                  )
                }
                style={inputStyle}
              >
                {dueFilterOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </FormField>
          </div>
        )}
      </section>

      {selectedEmployeeIds.length > 0 &&
        canUseBulkActions && (
          <section style={bulkActionBarStyle}>
            <div>
              <div style={bulkActionTitleStyle}>
                {selectedEmployeeIds.length} employee
                {selectedEmployeeIds.length === 1
                  ? ""
                  : "s"}{" "}
                selected
              </div>

              <div
                style={
                  bulkActionDescriptionStyle
                }
              >
                Export the selected compliance
                or training records.
              </div>
            </div>

            <div style={bulkActionButtonsStyle}>
              <button
                type="button"
                onClick={() =>
                  void exportSelectedEmployees()
                }
                style={secondaryButtonStyle}
              >
                Export selected
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedEmployeeIds([])
                }
                style={quietButtonStyle}
              >
                Clear selection
              </button>
            </div>
          </section>
        )}

      {loading ? (
        <PageState
          title="Preparing compliance registers"
          message="Leo is gathering employee checks, renewal dates and learning records."
        />
      ) : loadError ? (
        <PageState
          title="Compliance registers unavailable"
          message={loadError}
          actionLabel="Try again"
          onAction={() =>
            void loadComplianceData()
          }
        />
      ) : activeView === "compliance" ? (
        <ComplianceRegister
          rows={filteredComplianceRows}
          selectedEmployeeIds={
            selectedEmployeeIds
          }
          allVisibleSelected={
            uniqueVisibleEmployeeIds.length > 0 &&
            uniqueVisibleEmployeeIds.every(
              (employeeId) =>
                selectedEmployeeIds.includes(
                  employeeId
                )
            )
          }
          onToggleEmployee={
            toggleEmployeeSelection
          }
          onToggleAll={
            toggleAllVisibleEmployees
          }
          onSort={updateComplianceSort}
          sortState={complianceSort}
          onOpenCell={openEmployeeSection}
        />
      ) : (
        <TrainingRegister
          rows={filteredTrainingRows}
          selectedEmployeeIds={
            selectedEmployeeIds
          }
          allVisibleSelected={
            uniqueVisibleEmployeeIds.length > 0 &&
            uniqueVisibleEmployeeIds.every(
              (employeeId) =>
                selectedEmployeeIds.includes(
                  employeeId
                )
            )
          }
          onToggleEmployee={
            toggleEmployeeSelection
          }
          onToggleAll={
            toggleAllVisibleEmployees
          }
          onSort={updateTrainingSort}
          sortState={trainingSort}
          onOpenEmployee={(employeeId) =>
            openEmployeeSection(
              employeeId,
              "learning"
            )
          }
        />
      )}
          </div>
  );
}

function ComplianceRegister({
  rows,
  selectedEmployeeIds,
  allVisibleSelected,
  onToggleEmployee,
  onToggleAll,
  onSort,
  sortState,
  onOpenCell,
}: {
  rows: ComplianceRegisterRow[];
  selectedEmployeeIds: number[];
  allVisibleSelected: boolean;
  onToggleEmployee: (employeeId: number) => void;
  onToggleAll: () => void;
  onSort: (column: string) => void;
  sortState: SortState;
  onOpenCell: (
    employeeId: number,
    destination: EmployeeDestination
  ) => void;
}) {
  if (rows.length === 0) {
    return (
      <PageState
        title="No matching compliance records"
        message="No employees match the selected filters or search."
      />
    );
  }

  return (
    <section style={registerPanelStyle}>
      <div style={registerHeadingStyle}>
        <div>
          <h2 style={registerTitleStyle}>
            Compliance Register
          </h2>

          <p style={registerDescriptionStyle}>
            Select any compliance cell to open the relevant employee
            record.
          </p>
        </div>

        <div style={recordCountStyle}>
          {rows.length} employee
          {rows.length === 1 ? "" : "s"}
        </div>
      </div>

      <div style={registerTableWrapperStyle}>
        <table style={registerTableStyle}>
          <thead>
            <tr>
              <th
                rowSpan={2}
                style={stickyCheckboxHeaderStyle}
              >
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={onToggleAll}
                  aria-label="Select all visible employees"
                />
              </th>

              <th
                rowSpan={2}
                style={stickyEmployeeHeaderStyle}
              >
                <SortableHeaderButton
                  label="Employee"
                  column="employeeName"
                  sortState={sortState}
                  onSort={onSort}
                />
              </th>

              <th
                rowSpan={2}
                style={narrowHeaderStyle}
              >
                <SortableHeaderButton
                  label="Site"
                  column="siteName"
                  sortState={sortState}
                  onSort={onSort}
                />
              </th>

              <th
                rowSpan={2}
                style={narrowHeaderStyle}
              >
                <SortableHeaderButton
                  label="Department"
                  column="department"
                  sortState={sortState}
                  onSort={onSort}
                />
              </th>

              <th
                rowSpan={2}
                style={narrowHeaderStyle}
              >
                <SortableHeaderButton
                  label="Manager"
                  column="manager"
                  sortState={sortState}
                  onSort={onSort}
                />
              </th>

              <th
                rowSpan={2}
                style={roleHeaderStyle}
              >
                <SortableHeaderButton
                  label="Role"
                  column="role"
                  sortState={sortState}
                  onSort={onSort}
                />
              </th>

              <th
                colSpan={2}
                style={groupHeaderStyle}
              >
                Identity & Eligibility
              </th>

              <th
                colSpan={3}
                style={groupHeaderStyle}
              >
                DBS & Safeguarding
              </th>

              <th
                colSpan={4}
                style={groupHeaderStyle}
              >
                Driving Compliance
              </th>

              <th
                colSpan={1}
                style={groupHeaderStyle}
              >
                Employment
              </th>

              <th
                rowSpan={2}
                style={reviewHeaderStyle}
              >
                <SortableHeaderButton
                  label="Items to Review"
                  column="reviewCount"
                  sortState={sortState}
                  onSort={onSort}
                />
              </th>
            </tr>

            <tr>
              <ComplianceColumnHeader
                label="Right to Work"
                column="rightToWork"
                sortState={sortState}
                onSort={onSort}
              />

              <ComplianceColumnHeader
                label="Visa / Permit"
                column="visa"
                sortState={sortState}
                onSort={onSort}
              />

              <ComplianceColumnHeader
                label="DBS"
                column="dbs"
                sortState={sortState}
                onSort={onSort}
              />

              <ComplianceColumnHeader
                label="Update Service"
                column="updateService"
                sortState={sortState}
                onSort={onSort}
              />

              <ComplianceColumnHeader
                label="Safeguarding"
                column="safeguarding"
                sortState={sortState}
                onSort={onSort}
              />

              <ComplianceColumnHeader
                label="Driving Licence"
                column="drivingLicence"
                sortState={sortState}
                onSort={onSort}
              />

              <ComplianceColumnHeader
                label="DVLA Check"
                column="dvla"
                sortState={sortState}
                onSort={onSort}
              />

              <ComplianceColumnHeader
                label="Business Insurance"
                column="businessInsurance"
                sortState={sortState}
                onSort={onSort}
              />

              <ComplianceColumnHeader
                label="MOT Expiry"
                column="mot"
                sortState={sortState}
                onSort={onSort}
              />

              <ComplianceColumnHeader
                label="Probation"
                column="probation"
                sortState={sortState}
                onSort={onSort}
              />
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.employeeId}>
                <td style={stickyCheckboxCellStyle}>
                  <input
                    type="checkbox"
                    checked={selectedEmployeeIds.includes(
                      row.employeeId
                    )}
                    onChange={() =>
                      onToggleEmployee(row.employeeId)
                    }
                    aria-label={`Select ${row.employeeName}`}
                  />
                </td>

                <td style={stickyEmployeeCellStyle}>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenCell(
                        row.employeeId,
                        "overview"
                      )
                    }
                    style={employeeLinkButtonStyle}
                  >
                    <span style={employeeNameCellStyle}>
                      {row.employeeName}
                    </span>

                    <span
                      style={employeeReferenceCellStyle}
                    >
                      REF {row.employeeId} ·{" "}
                      {row.employeeStatus}
                    </span>
                  </button>
                </td>

                <PlainRegisterCell
                  value={row.siteName}
                  narrow
                />

                <PlainRegisterCell
                  value={row.department}
                  narrow
                />

                <PlainRegisterCell
                  value={row.manager}
                  narrow
                />

                <PlainRegisterCell
                  value={row.role}
                  role
                />

                <ComplianceRegisterCell
                  cell={row.rightToWork}
                  employeeId={row.employeeId}
                  onOpen={onOpenCell}
                />

                <ComplianceRegisterCell
                  cell={row.visa}
                  employeeId={row.employeeId}
                  onOpen={onOpenCell}
                />

                <ComplianceRegisterCell
                  cell={row.dbs}
                  employeeId={row.employeeId}
                  onOpen={onOpenCell}
                />

                <ComplianceRegisterCell
                  cell={row.updateService}
                  employeeId={row.employeeId}
                  onOpen={onOpenCell}
                />

                <ComplianceRegisterCell
                  cell={row.safeguarding}
                  employeeId={row.employeeId}
                  onOpen={onOpenCell}
                />

                <ComplianceRegisterCell
                  cell={row.drivingLicence}
                  employeeId={row.employeeId}
                  onOpen={onOpenCell}
                />

                <ComplianceRegisterCell
                  cell={row.dvla}
                  employeeId={row.employeeId}
                  onOpen={onOpenCell}
                />

                <ComplianceRegisterCell
                  cell={row.businessInsurance}
                  employeeId={row.employeeId}
                  onOpen={onOpenCell}
                />

                <ComplianceRegisterCell
                  cell={row.mot}
                  employeeId={row.employeeId}
                  onOpen={onOpenCell}
                />

                <ComplianceRegisterCell
                  cell={row.probation}
                  employeeId={row.employeeId}
                  onOpen={onOpenCell}
                />

                <td style={reviewCountCellStyle}>
                  <span
                    style={
                      row.reviewCount > 0
                        ? reviewCountActionStyle
                        : reviewCountCurrentStyle
                    }
                  >
                    {row.reviewCount}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TrainingRegister({
  rows,
  selectedEmployeeIds,
  allVisibleSelected,
  onToggleEmployee,
  onToggleAll,
  onSort,
  sortState,
  onOpenEmployee,
}: {
  rows: TrainingRegisterRow[];
  selectedEmployeeIds: number[];
  allVisibleSelected: boolean;
  onToggleEmployee: (employeeId: number) => void;
  onToggleAll: () => void;
  onSort: (column: string) => void;
  sortState: SortState;
  onOpenEmployee: (employeeId: number) => void;
}) {
  if (rows.length === 0) {
    return (
      <PageState
        title="No matching training records"
        message="No learning or refresher records match the selected filters."
      />
    );
  }

  return (
    <section style={registerPanelStyle}>
      <div style={registerHeadingStyle}>
        <div>
          <h2 style={registerTitleStyle}>
            Training Register
          </h2>

          <p style={registerDescriptionStyle}>
            Review learning completion and refresher dates across the
            workforce.
          </p>
        </div>

        <div style={recordCountStyle}>
          {rows.length} record
          {rows.length === 1 ? "" : "s"}
        </div>
      </div>

      <div style={registerTableWrapperStyle}>
        <table style={trainingTableStyle}>
          <thead>
            <tr>
              <th style={stickyCheckboxHeaderStyle}>
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={onToggleAll}
                  aria-label="Select all visible employees"
                />
              </th>

              <th style={stickyEmployeeHeaderStyle}>
                <SortableHeaderButton
                  label="Employee"
                  column="employeeName"
                  sortState={sortState}
                  onSort={onSort}
                />
              </th>

              <th style={trainingNarrowHeaderStyle}>
                <SortableHeaderButton
                  label="Site"
                  column="siteName"
                  sortState={sortState}
                  onSort={onSort}
                />
              </th>

              <th style={trainingNarrowHeaderStyle}>
                <SortableHeaderButton
                  label="Department"
                  column="department"
                  sortState={sortState}
                  onSort={onSort}
                />
              </th>

              <th style={trainingNarrowHeaderStyle}>
                <SortableHeaderButton
                  label="Manager"
                  column="manager"
                  sortState={sortState}
                  onSort={onSort}
                />
              </th>

              <th style={trainingRoleHeaderStyle}>
                <SortableHeaderButton
                  label="Role"
                  column="role"
                  sortState={sortState}
                  onSort={onSort}
                />
              </th>

              <th style={trainingNameHeaderStyle}>
                <SortableHeaderButton
                  label="Learning / Qualification"
                  column="trainingName"
                  sortState={sortState}
                  onSort={onSort}
                />
              </th>

              <th style={trainingDateHeaderStyle}>
                <SortableHeaderButton
                  label="Completed"
                  column="dateCompleted"
                  sortState={sortState}
                  onSort={onSort}
                />
              </th>

              <th style={trainingDateHeaderStyle}>
                <SortableHeaderButton
                  label="Refresh / Expiry"
                  column="refreshDate"
                  sortState={sortState}
                  onSort={onSort}
                />
              </th>

              <th style={trainingDateHeaderStyle}>
                <SortableHeaderButton
                  label="Days Remaining"
                  column="daysRemaining"
                  sortState={sortState}
                  onSort={onSort}
                />
              </th>

              <th style={trainingStatusHeaderStyle}>
                <SortableHeaderButton
                  label="Status"
                  column="status"
                  sortState={sortState}
                  onSort={onSort}
                />
              </th>

              <th style={trainingDetailHeaderStyle}>
                Details
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.employeeId}-${
                  row.trainingId ?? "empty"
                }-${row.trainingName}`}
              >
                <td style={stickyCheckboxCellStyle}>
                  <input
                    type="checkbox"
                    checked={selectedEmployeeIds.includes(
                      row.employeeId
                    )}
                    onChange={() =>
                      onToggleEmployee(row.employeeId)
                    }
                    aria-label={`Select ${row.employeeName}`}
                  />
                </td>

                <td style={stickyEmployeeCellStyle}>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenEmployee(row.employeeId)
                    }
                    style={employeeLinkButtonStyle}
                  >
                    <span style={employeeNameCellStyle}>
                      {row.employeeName}
                    </span>

                    <span
                      style={employeeReferenceCellStyle}
                    >
                      REF {row.employeeId} ·{" "}
                      {row.employeeStatus}
                    </span>
                  </button>
                </td>

                <PlainRegisterCell
                  value={row.siteName}
                  narrow
                />

                <PlainRegisterCell
                  value={row.department}
                  narrow
                />

                <PlainRegisterCell
                  value={row.manager}
                  narrow
                />

                <PlainRegisterCell
                  value={row.role}
                  role
                />

                <td style={trainingNameCellStyle}>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenEmployee(row.employeeId)
                    }
                    style={learningLinkButtonStyle}
                  >
                    {row.trainingName}
                  </button>
                </td>

                <td style={trainingDateCellStyle}>
                  {formatDate(row.dateCompleted)}
                </td>

                <td style={trainingDateCellStyle}>
                  {formatDate(row.refreshDate)}
                </td>

                <td style={trainingDateCellStyle}>
                  {formatDaysRemaining(
                    row.daysRemaining
                  )}
                </td>

                <td style={trainingStatusCellStyle}>
                  <ComplianceStatusBadge
                    status={row.status}
                  />
                </td>

                <td style={trainingDetailCellStyle}>
                  {row.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ComplianceColumnHeader({
  label,
  column,
  sortState,
  onSort,
}: {
  label: string;
  column: string;
  sortState: SortState;
  onSort: (column: string) => void;
}) {
  return (
    <th style={complianceColumnHeaderStyle}>
      <SortableHeaderButton
        label={label}
        column={column}
        sortState={sortState}
        onSort={onSort}
      />
    </th>
  );
}

function SortableHeaderButton({
  label,
  column,
  sortState,
  onSort,
}: {
  label: string;
  column: string;
  sortState: SortState;
  onSort: (column: string) => void;
}) {
  const active = sortState.column === column;

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      style={sortHeaderButtonStyle}
    >
      <span>{label}</span>

      <span
        aria-hidden="true"
        style={sortIndicatorStyle}
      >
        {active
          ? sortState.direction === "ascending"
            ? "↑"
            : "↓"
          : "↕"}
      </span>
    </button>
  );
}

function ComplianceRegisterCell({
  cell,
  employeeId,
  onOpen,
}: {
  cell: ComplianceCell;
  employeeId: number;
  onOpen: (
    employeeId: number,
    destination: EmployeeDestination
  ) => void;
}) {
  return (
    <td style={complianceTableCellStyle}>
      <button
        type="button"
        onClick={() =>
          onOpen(
            employeeId,
            cell.destination
          )
        }
        style={{
          ...complianceCellButtonStyle,
          ...getComplianceCellStyle(
            cell.status
          ),
        }}
        title={cell.detail}
      >
        <span style={complianceCellLabelStyle}>
          {cell.label}
        </span>

        <ComplianceStatusBadge
          status={cell.status}
        />

        <span style={complianceCellDateStyle}>
          {cell.date
            ? formatDate(cell.date)
            : cell.status === "Not required"
            ? "Not required"
            : cell.detail}
        </span>

        {cell.date && (
          <span style={complianceCellDaysStyle}>
            {formatDaysRemaining(
              cell.daysRemaining
            )}
          </span>
        )}
      </button>
    </td>
  );
}

function PlainRegisterCell({
  value,
  narrow = false,
  role = false,
}: {
  value: string;
  narrow?: boolean;
  role?: boolean;
}) {
  return (
    <td
      style={
        narrow
          ? narrowRegisterCellStyle
          : role
          ? roleRegisterCellStyle
          : registerCellStyle
      }
      title={value || "Not set"}
    >
      <span style={plainCellValueStyle}>
        {value || "Not set"}
      </span>
    </td>
  );
}

function ComplianceStatusBadge({
  status,
}: {
  status: ComplianceStatus;
}) {
  return (
    <span
      style={getComplianceBadgeStyle(
        status
      )}
    >
      {status}
    </span>
  );
}

function StatusLegend() {
  return (
    <section style={legendStyle}>
      <div style={legendTitleStyle}>
        Status key
      </div>

      <div style={legendItemsStyle}>
        <LegendItem
          label="Expired"
          description="The recorded date has passed."
          status="Expired"
        />

        <LegendItem
          label="Due within 30 days"
          description="Renewal or review is approaching."
          status="Due within 30 days"
        />

        <LegendItem
          label="Current"
          description="No immediate action is due."
          status="Current"
        />

        <LegendItem
          label="Awaiting evidence"
          description="A required record or date is missing."
          status="Awaiting evidence"
        />

        <LegendItem
          label="Not required"
          description="The check does not currently apply."
          status="Not required"
        />
      </div>
    </section>
  );
}

function LegendItem({
  label,
  description,
  status,
}: {
  label: string;
  description: string;
  status: ComplianceStatus;
}) {
  return (
    <div style={legendItemStyle}>
      <div
        style={{
          ...legendSwatchStyle,
          ...getComplianceCellStyle(status),
        }}
      />

      <div>
        <div style={legendItemLabelStyle}>
          {label}
        </div>

        <div
          style={
            legendItemDescriptionStyle
          }
        >
          {description}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: number;
  detail: string;
  tone?: "default" | "expired" | "due" | "missing";
}) {
  return (
    <div
      style={{
        ...summaryCardStyle,
        ...(tone === "expired"
          ? summaryExpiredStyle
          : tone === "due"
          ? summaryDueStyle
          : tone === "missing"
          ? summaryMissingStyle
          : {}),
      }}
    >
      <div style={summaryLabelStyle}>
        {label}
      </div>

      <div style={summaryValueStyle}>
        {value}
      </div>

      <div style={summaryDetailStyle}>
        {detail}
      </div>
    </div>
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
      <span style={fieldLabelStyle}>
        {label}
      </span>

      {children}
    </label>
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
    <div
      role={
        tone === "error"
          ? "alert"
          : "status"
      }
      style={style}
    >
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
      <h2 style={pageStateTitleStyle}>
        {title}
      </h2>

      <p style={pageStateMessageStyle}>
        {message}
      </p>

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

function mapLatestByEmployee<T>(
  records: T[],
  getEmployeeId: (record: T) => number
): Map<number, T> {
  const map = new Map<number, T>();

  for (const record of records) {
    const employeeId =
      getEmployeeId(record);

    if (!map.has(employeeId)) {
      map.set(employeeId, record);
    }
  }

  return map;
}

function buildDateCell({
  label,
  date,
  missingStatus,
  missingDetail,
  destination,
}: {
  label: string;
  date: string | null;
  missingStatus: ComplianceStatus;
  missingDetail: string;
  destination: EmployeeDestination;
}): ComplianceCell {
  if (!date) {
    return {
      label,
      status: missingStatus,
      date: null,
      daysRemaining: null,
      detail: missingDetail,
      destination,
    };
  }

  const daysRemaining =
    daysUntil(date);

  return {
    label,
    status:
      complianceStatusFromDays(
        daysRemaining
      ),
    date,
    daysRemaining,
    detail:
      complianceDetailFromDays(
        daysRemaining
      ),
    destination,
  };
}

function buildNotRequiredCell({
  label,
  detail,
  destination,
}: {
  label: string;
  detail: string;
  destination: EmployeeDestination;
}): ComplianceCell {
  return {
    label,
    status: "Not required",
    date: null,
    daysRemaining: null,
    detail,
    destination,
  };
}

function buildMissingCell({
  label,
  detail,
  destination,
}: {
  label: string;
  detail: string;
  destination: EmployeeDestination;
}): ComplianceCell {
  return {
    label,
    status: "Awaiting evidence",
    date: null,
    daysRemaining: null,
    detail,
    destination,
  };
}

function complianceStatusFromDays(
  daysRemaining: number | null
): ComplianceStatus {
  if (daysRemaining === null) {
    return "Awaiting evidence";
  }

  if (daysRemaining < 0) {
    return "Expired";
  }

  if (daysRemaining <= 30) {
    return "Due within 30 days";
  }

  return "Current";
}

function complianceDetailFromDays(
  daysRemaining: number | null
): string {
  if (daysRemaining === null) {
    return "No date has been recorded.";
  }

  if (daysRemaining < 0) {
    const overdue =
      Math.abs(daysRemaining);

    return `Expired ${overdue} day${
      overdue === 1 ? "" : "s"
    } ago.`;
  }

  if (daysRemaining === 0) {
    return "Due today.";
  }

  return `Due in ${daysRemaining} day${
    daysRemaining === 1 ? "" : "s"
  }.`;
}

function daysUntil(
  value: string | null
): number | null {
  if (!value) return null;

  const target =
    parseDateOnly(value);

  if (!target) return null;

  const today = new Date();

  today.setHours(12, 0, 0, 0);

  return Math.round(
    (target.getTime() -
      today.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function parseDateOnly(
  value: string
): Date | null {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) return null;

  const [, year, month, day] =
    match;

  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    12,
    0,
    0
  );

  if (
    parsed.getFullYear() !==
      Number(year) ||
    parsed.getMonth() !==
      Number(month) - 1 ||
    parsed.getDate() !== Number(day)
  ) {
    return null;
  }

  return parsed;
}

function formatDate(
  value: string | null
): string {
  if (!value) {
    return "Not recorded";
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (match) {
    const [, year, month, day] =
      match;

    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(value);

  if (
    Number.isNaN(parsed.getTime())
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Europe/London",
    }
  ).format(parsed);
}

function formatDaysRemaining(
  value: number | null
): string {
  if (value === null) {
    return "No date";
  }

  if (value < 0) {
    const overdue = Math.abs(value);

    return `${overdue} day${
      overdue === 1 ? "" : "s"
    } overdue`;
  }

  if (value === 0) {
    return "Due today";
  }

  return `${value} day${
    value === 1 ? "" : "s"
  }`;
}

function normalisePlatformRole(
  value: string
): PlatformRole {
  const normalised = value
    .trim()
    .toLowerCase();

  if (normalised === "employee") {
    return "Employee";
  }

  if (normalised === "manager") {
    return "Manager";
  }

  if (normalised === "senior") {
    return "Senior";
  }

  if (normalised === "owner") {
    return "Owner";
  }

  return "Owner";
}

function normaliseEmployeeStatus(
  value: string | null | undefined
): string {
  const normalised = value
    ?.trim()
    .toLowerCase();

  if (!normalised) {
    return "Active";
  }

  if (normalised === "new starter") {
    return "New Starter";
  }

  if (normalised === "active") {
    return "Active";
  }

  if (normalised === "leaving") {
    return "Leaving";
  }

  if (
    normalised === "former employee"
  ) {
    return "Former Employee";
  }

  if (normalised === "archived") {
    return "Archived";
  }

  if (normalised === "suspended") {
    return "Suspended";
  }

  return value?.trim() || "Active";
}

function normaliseText(
  value: string | null | undefined
): string {
  return value
    ?.trim()
    .toLowerCase() || "";
}

function isAffirmative(
  value: string | null | undefined
): boolean {
  return [
    "yes",
    "true",
    "required",
    "active",
    "completed",
    "confirmed",
    "personal",
  ].includes(normaliseText(value));
}

function readString(
  value: unknown
): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

function isActionableStatus(
  status: ComplianceStatus
): boolean {
  return [
    "Expired",
    "Due within 30 days",
    "Awaiting evidence",
    "Review required",
  ].includes(status);
}

function matchesRegisterFilters(
  row: {
    siteName: string;
    department: string;
    manager: string;
    employeeStatus: string;
  },
  filters: RegisterFilters
): boolean {
  if (
    filters.site !== "All" &&
    row.siteName !== filters.site
  ) {
    return false;
  }

  if (
    filters.department !== "All" &&
    row.department !==
      filters.department
  ) {
    return false;
  }

  if (
    filters.manager !== "All" &&
    row.manager !== filters.manager
  ) {
    return false;
  }

  if (
    filters.employeeStatus !== "All" &&
    row.employeeStatus !==
      filters.employeeStatus
  ) {
    return false;
  }

  return true;
}

function complianceRowMatchesDueFilter(
  row: ComplianceRegisterRow,
  dueFilter: DueFilter
): boolean {
  const cells: ComplianceCell[] = [
    row.rightToWork,
    row.visa,
    row.dbs,
    row.updateService,
    row.safeguarding,
    row.drivingLicence,
    row.dvla,
    row.businessInsurance,
    row.mot,
    row.probation,
  ];

  return cells.some((cell) =>
    statusMatchesDueFilter(
      cell.status,
      dueFilter
    )
  );
}

function statusMatchesDueFilter(
  status: ComplianceStatus,
  dueFilter: DueFilter
): boolean {
  if (dueFilter === "all") {
    return true;
  }

  if (dueFilter === "expired") {
    return status === "Expired";
  }

  if (dueFilter === "due_30") {
    return (
      status ===
      "Due within 30 days"
    );
  }

  if (dueFilter === "current") {
    return status === "Current";
  }

  return (
    status === "Awaiting evidence" ||
    status === "Review required"
  );
}

function sortComplianceRows(
  rows: ComplianceRegisterRow[],
  sortState: SortState
): ComplianceRegisterRow[] {
  const sorted = [...rows];

  sorted.sort((first, second) => {
    const firstValue =
      complianceSortValue(
        first,
        sortState.column
      );

    const secondValue =
      complianceSortValue(
        second,
        sortState.column
      );

    const comparison =
      compareSortValues(
        firstValue,
        secondValue
      );

    return sortState.direction ===
      "ascending"
      ? comparison
      : comparison * -1;
  });

  return sorted;
}

function complianceSortValue(
  row: ComplianceRegisterRow,
  column: string
): string | number | null {
  if (column === "employeeName") {
    return row.employeeName;
  }

  if (column === "siteName") {
    return row.siteName;
  }

  if (column === "department") {
    return row.department;
  }

  if (column === "manager") {
    return row.manager;
  }

  if (column === "role") {
    return row.role;
  }

  if (column === "reviewCount") {
    return row.reviewCount;
  }

  const cell = row[
    column as keyof Pick<
      ComplianceRegisterRow,
      | "rightToWork"
      | "visa"
      | "dbs"
      | "updateService"
      | "safeguarding"
      | "drivingLicence"
      | "dvla"
      | "businessInsurance"
      | "mot"
      | "probation"
    >
  ] as ComplianceCell | undefined;

  if (!cell) {
    return null;
  }

  if (
    cell.daysRemaining !== null
  ) {
    return cell.daysRemaining;
  }

  return complianceStatusRank(
    cell.status
  );
}

function sortTrainingRows(
  rows: TrainingRegisterRow[],
  sortState: SortState
): TrainingRegisterRow[] {
  const sorted = [...rows];

  sorted.sort((first, second) => {
    const firstValue = first[
      sortState.column as keyof TrainingRegisterRow
    ] as unknown;

    const secondValue = second[
      sortState.column as keyof TrainingRegisterRow
    ] as unknown;

    const comparison =
      compareSortValues(
        typeof firstValue ===
          "string" ||
          typeof firstValue ===
            "number"
          ? firstValue
          : null,
        typeof secondValue ===
          "string" ||
          typeof secondValue ===
            "number"
          ? secondValue
          : null
      );

    return sortState.direction ===
      "ascending"
      ? comparison
      : comparison * -1;
  });

  return sorted;
}

function compareSortValues(
  first: string | number | null,
  second: string | number | null
): number {
  if (
    first === null &&
    second === null
  ) {
    return 0;
  }

  if (first === null) {
    return 1;
  }

  if (second === null) {
    return -1;
  }

  if (
    typeof first === "number" &&
    typeof second === "number"
  ) {
    return first - second;
  }

  return String(first).localeCompare(
    String(second),
    "en-GB",
    {
      numeric: true,
      sensitivity: "base",
    }
  );
}

function complianceStatusRank(
  status: ComplianceStatus
): number {
  if (status === "Expired") {
    return -10000;
  }

  if (
    status ===
    "Due within 30 days"
  ) {
    return 30;
  }

  if (
    status ===
    "Awaiting evidence"
  ) {
    return 10001;
  }

  if (
    status ===
    "Review required"
  ) {
    return 10002;
  }

  if (status === "Current") {
    return 10003;
  }

  return 10004;
}

function buildComplianceExportRows(
  rows: ComplianceRegisterRow[]
): Array<
  Record<string, string | number>
> {
  return rows.map((row) => ({
    "Employee Reference":
      row.employeeId,
    Employee: row.employeeName,
    Status: row.employeeStatus,
    Site: row.siteName,
    Department: row.department,
    Manager: row.manager,
    Role: row.role,
    "Right to Work":
      exportCellValue(
        row.rightToWork
      ),
    "Visa / Permit":
      exportCellValue(row.visa),
    DBS: exportCellValue(row.dbs),
    "DBS Update Service":
      exportCellValue(
        row.updateService
      ),
    Safeguarding:
      exportCellValue(
        row.safeguarding
      ),
    "Driving Licence":
      exportCellValue(
        row.drivingLicence
      ),
    "Annual DVLA Check":
      exportCellValue(row.dvla),
    "Business Insurance":
      exportCellValue(
        row.businessInsurance
      ),
    "MOT Expiry":
      exportCellValue(row.mot),
    Probation:
      exportCellValue(
        row.probation
      ),
    "Items to Review":
      row.reviewCount,
  }));
}

function buildTrainingExportRows(
  rows: TrainingRegisterRow[]
): Array<
  Record<string, string | number>
> {
  return rows.map((row) => ({
    "Employee Reference":
      row.employeeId,
    Employee: row.employeeName,
    Status: row.employeeStatus,
    Site: row.siteName,
    Department: row.department,
    Manager: row.manager,
    Role: row.role,
    "Learning / Qualification":
      row.trainingName,
    "Date Completed":
      formatDate(
        row.dateCompleted
      ),
    "Refresh / Expiry Date":
      formatDate(row.refreshDate),
    "Days Remaining":
      formatDaysRemaining(
        row.daysRemaining
      ),
    "Record Status": row.status,
    Details: row.detail,
  }));
}

function exportCellValue(
  cell: ComplianceCell
): string {
  return [
    cell.status,
    cell.date
      ? formatDate(cell.date)
      : "",
    cell.detail,
  ]
    .filter(Boolean)
    .join(" · ");
}

async function writeComplianceAuditEvent({
  action,
  description,
  entityName,
  metadata,
}: {
  action: string;
  description: string;
  entityName: string;
  metadata: Record<
    string,
    unknown
  >;
}) {
  try {
    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    const userName =
      user?.user_metadata
        ?.full_name ||
      user?.user_metadata?.name ||
      user?.email ||
      "System user";

    const { error } = await supabase
      .from("audit_logs")
      .insert({
        organisation_id: null,
        user_id: user?.id || null,
        user_name: userName,
        user_email:
          user?.email || null,
        action,
        action_category:
          "Compliance",
        entity_type:
          "Compliance",
        entity_id: null,
        entity_name: entityName,
        description,
        previous_values: null,
        new_values: metadata,
        metadata: {
          ...metadata,
          source_module:
            "Compliance",
        },
        source_page:
          "/dashboard/compliance",
        ip_address: null,
        user_agent:
          typeof navigator !==
          "undefined"
            ? navigator.userAgent
            : null,
        created_at:
          new Date().toISOString(),
      });

    if (error) {
      console.warn(
        "Compliance audit event was not saved:",
        error
      );
    }
  } catch (error) {
    console.warn(
      "Compliance audit event was not saved:",
      error
    );
  }
}

function toDateOnlyValue(
  date: Date
): string {
  const year = String(
    date.getFullYear()
  );

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getComplianceCellStyle(
  status: ComplianceStatus
): CSSProperties {
  if (status === "Expired") {
    return {
      background: "#F4DDE4",
      borderColor: "#C78D9D",
      boxShadow:
        "inset 4px 0 0 #A86573",
    };
  }

  if (
    status ===
    "Due within 30 days"
  ) {
    return {
      background: "#FFF0CC",
      borderColor: "#D5A94E",
      boxShadow:
        "inset 4px 0 0 #C58E2A",
    };
  }

  if (status === "Current") {
    return {
      background: "#DFF3EC",
      borderColor: "#9FCFBE",
      boxShadow:
        "inset 4px 0 0 #5F9F89",
    };
  }

  if (
    status ===
      "Awaiting evidence" ||
    status ===
      "Review required"
  ) {
    return {
      background: "#F0EEF2",
      borderColor: "#C9C3CD",
      boxShadow:
        "inset 4px 0 0 #938A99",
    };
  }

  return {
    background: "#F7F7F8",
    borderColor: "#DBDADF",
    boxShadow:
      "inset 4px 0 0 #B4B0B8",
  };
}

function getComplianceBadgeStyle(
  status: ComplianceStatus
): CSSProperties {
  const shared: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    borderRadius: "999px",
    padding: "5px 9px",
    fontSize: "10px",
    fontWeight: 900,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
  };

  if (status === "Expired") {
    return {
      ...shared,
      background: "#A86573",
      color: "#FFFFFF",
    };
  }

  if (
    status ===
    "Due within 30 days"
  ) {
    return {
      ...shared,
      background: "#C58E2A",
      color: "#FFFFFF",
    };
  }

  if (status === "Current") {
    return {
      ...shared,
      background: "#5F9F89",
      color: "#FFFFFF",
    };
  }

  if (
    status ===
      "Awaiting evidence" ||
    status ===
      "Review required"
  ) {
    return {
      ...shared,
      background: "#817783",
      color: "#FFFFFF",
    };
  }

  return {
    ...shared,
    background: "#D8D6DB",
    color: "#56515A",
  };
}

const pageStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1700px",
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
  color: "#2D2433",
  fontSize: "30px",
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  color: "#6F6773",
  fontSize: "14px",
  lineHeight: 1.6,
  maxWidth: "740px",
};

const lastUpdatedStyle: CSSProperties = {
  marginTop: "8px",
  color: "#938B97",
  fontSize: "11px",
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
  padding: "10px 7px",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "13px",
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "12px",
  marginBottom: "16px",
};

const summaryCardStyle: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E7E1EA",
  borderRadius: "14px",
  padding: "16px",
};

const summaryExpiredStyle: CSSProperties = {
  background: "#F8E9ED",
  borderColor: "#D6A7B3",
};

const summaryDueStyle: CSSProperties = {
  background: "#FFF5DF",
  borderColor: "#E2BF78",
};

const summaryMissingStyle: CSSProperties = {
  background: "#F4F2F5",
  borderColor: "#D5D0D8",
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

const legendStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "16px",
  padding: "14px 16px",
  marginBottom: "16px",
  background: "#FFFFFF",
  border: "1px solid #E7E1EA",
  borderRadius: "14px",
};

const legendTitleStyle: CSSProperties = {
  color: "#4F4555",
  fontSize: "12px",
  fontWeight: 900,
  paddingTop: "4px",
};

const legendItemsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "16px",
};

const legendItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const legendSwatchStyle: CSSProperties = {
  width: "20px",
  height: "20px",
  borderRadius: "6px",
  border: "1px solid",
};

const legendItemLabelStyle: CSSProperties = {
  color: "#4D444F",
  fontSize: "11px",
  fontWeight: 900,
};

const legendItemDescriptionStyle: CSSProperties = {
  color: "#847C88",
  fontSize: "9px",
  marginTop: "2px",
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
  padding: "9px 13px",
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

const filterPanelStyle: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E7E1EA",
  borderRadius: "16px",
  padding: "16px",
  marginBottom: "16px",
};

const filterTopRowStyle: CSSProperties = {
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

const filterGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
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

const bulkActionBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "14px",
  padding: "14px 16px",
  borderRadius: "14px",
  background: "#F7F1FC",
  border: "1px solid #DCCBE7",
  marginBottom: "16px",
};

const bulkActionTitleStyle: CSSProperties = {
  color: "#503E5A",
  fontSize: "13px",
  fontWeight: 900,
};

const bulkActionDescriptionStyle: CSSProperties = {
  color: "#746C78",
  fontSize: "11px",
  marginTop: "4px",
};

const bulkActionButtonsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const registerPanelStyle: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E7E1EA",
  borderRadius: "16px",
  overflow: "hidden",
};

const registerHeadingStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "12px",
  padding: "18px",
  borderBottom: "1px solid #E7E1EA",
};

const registerTitleStyle: CSSProperties = {
  margin: 0,
  color: "#302638",
  fontSize: "18px",
};

const registerDescriptionStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "#746C78",
  fontSize: "12px",
};

const recordCountStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 900,
  background: "#F7F1FC",
  borderRadius: "999px",
  padding: "6px 10px",
};

const registerTableWrapperStyle: CSSProperties = {
  width: "100%",
  overflowX: "auto",
  overflowY: "visible",
};

const registerTableStyle: CSSProperties = {
  width: "100%",
  minWidth: "2520px",
  borderCollapse: "separate",
  borderSpacing: 0,
};

const trainingTableStyle: CSSProperties = {
  width: "100%",
  minWidth: "1560px",
  borderCollapse: "separate",
  borderSpacing: 0,
};

const baseHeaderStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  background: "#F8F6F9",
  borderBottom: "1px solid #DCD4E0",
  borderRight: "1px solid #EAE4ED",
  padding: "10px",
  textAlign: "left",
  verticalAlign: "middle",
};

const stickyCheckboxHeaderStyle: CSSProperties = {
  ...baseHeaderStyle,
  left: 0,
  zIndex: 8,
  width: "44px",
  minWidth: "44px",
  maxWidth: "44px",
};

const stickyEmployeeHeaderStyle: CSSProperties = {
  ...baseHeaderStyle,
  left: "44px",
  zIndex: 7,
  width: "205px",
  minWidth: "205px",
  maxWidth: "205px",
};

const narrowHeaderStyle: CSSProperties = {
  ...baseHeaderStyle,
  width: "105px",
  minWidth: "105px",
  maxWidth: "105px",
};

const roleHeaderStyle: CSSProperties = {
  ...baseHeaderStyle,
  width: "135px",
  minWidth: "135px",
  maxWidth: "135px",
};

const reviewHeaderStyle: CSSProperties = {
  ...baseHeaderStyle,
  width: "110px",
  minWidth: "110px",
  maxWidth: "110px",
};

const groupHeaderStyle: CSSProperties = {
  ...baseHeaderStyle,
  zIndex: 4,
  color: "#6E5084",
  background: "#F4EFF7",
  fontSize: "11px",
  fontWeight: 900,
  textAlign: "center",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const complianceColumnHeaderStyle: CSSProperties = {
  ...baseHeaderStyle,
  top: "38px",
  zIndex: 3,
  width: "178px",
  minWidth: "178px",
  maxWidth: "178px",
};

const trainingNarrowHeaderStyle: CSSProperties = {
  ...baseHeaderStyle,
  width: "110px",
  minWidth: "110px",
  maxWidth: "110px",
};

const trainingRoleHeaderStyle: CSSProperties = {
  ...baseHeaderStyle,
  width: "140px",
  minWidth: "140px",
  maxWidth: "140px",
};

const trainingNameHeaderStyle: CSSProperties = {
  ...baseHeaderStyle,
  width: "220px",
  minWidth: "220px",
  maxWidth: "220px",
};

const trainingDateHeaderStyle: CSSProperties = {
  ...baseHeaderStyle,
  width: "125px",
  minWidth: "125px",
  maxWidth: "125px",
};

const trainingStatusHeaderStyle: CSSProperties = {
  ...baseHeaderStyle,
  width: "150px",
  minWidth: "150px",
  maxWidth: "150px",
};

const trainingDetailHeaderStyle: CSSProperties = {
  ...baseHeaderStyle,
  width: "260px",
  minWidth: "260px",
  maxWidth: "260px",
  color: "#5B5260",
  fontSize: "10px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const sortHeaderButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "7px",
  width: "100%",
  border: "none",
  padding: 0,
  background: "transparent",
  color: "#5B5260",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "10px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  textAlign: "left",
};

const sortIndicatorStyle: CSSProperties = {
  color: "#9A90A0",
  fontSize: "12px",
};

const registerCellStyle: CSSProperties = {
  borderBottom: "1px solid #EEE8F0",
  borderRight: "1px solid #F1EDF2",
  padding: "9px",
  color: "#514958",
  fontSize: "11px",
  verticalAlign: "top",
  background: "#FFFFFF",
};

const narrowRegisterCellStyle: CSSProperties = {
  ...registerCellStyle,
  width: "105px",
  minWidth: "105px",
  maxWidth: "105px",
};

const roleRegisterCellStyle: CSSProperties = {
  ...registerCellStyle,
  width: "135px",
  minWidth: "135px",
  maxWidth: "135px",
};

const plainCellValueStyle: CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  lineHeight: 1.4,
};

const stickyCheckboxCellStyle: CSSProperties = {
  ...registerCellStyle,
  position: "sticky",
  left: 0,
  zIndex: 6,
  width: "44px",
  minWidth: "44px",
  maxWidth: "44px",
  background: "#FFFFFF",
  textAlign: "center",
};

const stickyEmployeeCellStyle: CSSProperties = {
  ...registerCellStyle,
  position: "sticky",
  left: "44px",
  zIndex: 5,
  width: "205px",
  minWidth: "205px",
  maxWidth: "205px",
  background: "#FFFFFF",
};

const employeeLinkButtonStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  width: "100%",
  border: "none",
  background: "transparent",
  padding: 0,
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "inherit",
};

const employeeNameCellStyle: CSSProperties = {
  color: "#5E456C",
  fontSize: "12px",
  fontWeight: 900,
};

const employeeReferenceCellStyle: CSSProperties = {
  color: "#918895",
  fontSize: "9px",
  fontWeight: 700,
};

const complianceTableCellStyle: CSSProperties = {
  ...registerCellStyle,
  width: "178px",
  minWidth: "178px",
  maxWidth: "178px",
};

const complianceCellButtonStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "7px",
  width: "100%",
  minHeight: "122px",
  border: "1px solid",
  borderRadius: "12px",
  padding: "11px 11px 11px 14px",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "inherit",
};

const complianceCellLabelStyle: CSSProperties = {
  color: "#3D333F",
  fontSize: "12px",
  fontWeight: 900,
};

const complianceCellDateStyle: CSSProperties = {
  color: "#645A68",
  fontSize: "10px",
  lineHeight: 1.45,
  overflowWrap: "anywhere",
};

const complianceCellDaysStyle: CSSProperties = {
  color: "#4F4653",
  fontSize: "10px",
  fontWeight: 900,
};

const reviewCountCellStyle: CSSProperties = {
  ...registerCellStyle,
  width: "110px",
  minWidth: "110px",
  maxWidth: "110px",
  textAlign: "center",
};

const reviewCountActionStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "34px",
  minHeight: "34px",
  borderRadius: "999px",
  background: "#A86573",
  color: "#FFFFFF",
  fontWeight: 900,
};

const reviewCountCurrentStyle: CSSProperties = {
  ...reviewCountActionStyle,
  background: "#5F9F89",
};

const trainingNameCellStyle: CSSProperties = {
  ...registerCellStyle,
  width: "220px",
  minWidth: "220px",
  maxWidth: "220px",
};

const trainingDateCellStyle: CSSProperties = {
  ...registerCellStyle,
  width: "125px",
  minWidth: "125px",
  maxWidth: "125px",
};

const trainingStatusCellStyle: CSSProperties = {
  ...registerCellStyle,
  width: "150px",
  minWidth: "150px",
  maxWidth: "150px",
};

const trainingDetailCellStyle: CSSProperties = {
  ...registerCellStyle,
  width: "260px",
  minWidth: "260px",
  maxWidth: "260px",
  lineHeight: 1.5,
};

const learningLinkButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  color: "#6E5084",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "inherit",
  fontSize: "11px",
  fontWeight: 900,
};

const pageStateStyle: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E7E1EA",
  borderRadius: "16px",
  padding: "28px",
  textAlign: "center",
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
  maxWidth: "640px",
};

const successMessageStyle: CSSProperties = {
  background: "#DFF3EC",
  color: "#356653",
  border: "1px solid #9FCFBE",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "16px",
  fontSize: "13px",
};

const errorMessageStyle: CSSProperties = {
  background: "#F4DDE4",
  color: "#79505C",
  border: "1px solid #C78D9D",
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