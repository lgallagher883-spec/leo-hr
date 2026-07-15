"use client";

import {
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type JsonRecord =
  Record<string, unknown>;

type AuditLog = {
  id: number;
  organisation_id: string | null;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  action: string;
  action_category: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_name: string | null;
  description: string | null;
  previous_values: JsonRecord | null;
  new_values: JsonRecord | null;
  metadata: JsonRecord | null;
  source_page: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

type EmployeeRecord = {
  id: number;
  name: string;
};

type MatterRecord = {
  id: number;
  title: string;
  subject: string | null;
  employee_id: number | null;
};

type SarRecord = {
  id: number;
  request_title: string;
  employee_id: number;
};

type CategoryFilter =
  | "All"
  | "Employee"
  | "Matter"
  | "Compliance"
  | "HR Resource"
  | "SAR"
  | "Document"
  | "Foundation"
  | "Learning"
  | "Talent"
  | "Security"
  | "System";

type DateFilter =
  | "today"
  | "yesterday"
  | "7_days"
  | "30_days"
  | "90_days"
  | "all_time";

type ResolvedLog = AuditLog & {
  activityVerb: string;
  recordTitle: string;
  relatedPerson: string | null;
  reference: string | null;
  destinationPath: string | null;
};

const PAGE_SIZE = 25;

const categoryOptions: CategoryFilter[] = [
  "All",
  "Employee",
  "Matter",
  "Compliance",
  "HR Resource",
  "SAR",
  "Document",
  "Foundation",
  "Learning",
  "Talent",
  "Security",
  "System",
];

const dateOptions: Array<{
  value: DateFilter;
  label: string;
}> = [
  {
    value: "today",
    label: "Today",
  },
  {
    value: "yesterday",
    label: "Yesterday",
  },
  {
    value: "7_days",
    label: "Last 7 days",
  },
  {
    value: "30_days",
    label: "Last 30 days",
  },
  {
    value: "90_days",
    label: "Last 90 days",
  },
  {
    value: "all_time",
    label: "All time",
  },
];

export default function AuditLogsPage() {
  const router = useRouter();

  const [logs, setLogs] =
    useState<AuditLog[]>([]);

  const [employees, setEmployees] =
    useState<EmployeeRecord[]>([]);

  const [matters, setMatters] =
    useState<MatterRecord[]>([]);

  const [sars, setSars] =
    useState<SarRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState<CategoryFilter>("All");

  const [dateFilter, setDateFilter] =
    useState<DateFilter>("30_days");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [
    selectedLogId,
    setSelectedLogId,
  ] = useState<number | null>(null);

  useEffect(() => {
    loadAuditData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    category,
    dateFilter,
    search,
  ]);

  async function loadAuditData() {
    setLoading(true);

    const [
      auditResult,
      employeeResult,
      matterResult,
      sarResult,
    ] = await Promise.all([
      supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", {
          ascending: false,
        })
        .limit(5000),

      supabase
        .from("employees")
        .select("id,name")
        .order("name", {
          ascending: true,
        }),

      supabase
        .from("matters")
        .select(
          "id,title,subject,employee_id"
        ),

      supabase
        .from("employee_sars")
        .select(
          "id,request_title,employee_id"
        ),
    ]);

    if (auditResult.error) {
      console.error(
        "Error loading audit logs:",
        auditResult.error
      );

      setLogs([]);
    } else {
      setLogs(
        (auditResult.data ||
          []) as AuditLog[]
      );
    }

    if (employeeResult.error) {
      console.error(
        "Error loading employees for audit logs:",
        employeeResult.error
      );
    } else {
      setEmployees(
        (employeeResult.data ||
          []) as EmployeeRecord[]
      );
    }

    if (matterResult.error) {
      console.error(
        "Error loading Matters for audit logs:",
        matterResult.error
      );
    } else {
      setMatters(
        (matterResult.data ||
          []) as MatterRecord[]
      );
    }

    if (sarResult.error) {
      console.error(
        "Error loading SARs for audit logs:",
        sarResult.error
      );
    } else {
      setSars(
        (sarResult.data ||
          []) as SarRecord[]
      );
    }

    setLoading(false);
  }

  const employeeMap = useMemo(
    () =>
      new Map(
        employees.map(
          (employee) => [
            employee.id,
            employee.name,
          ]
        )
      ),
    [employees]
  );

  const matterMap = useMemo(
    () =>
      new Map(
        matters.map((matter) => [
          matter.id,
          matter,
        ])
      ),
    [matters]
  );

  const sarMap = useMemo(
    () =>
      new Map(
        sars.map((sar) => [
          sar.id,
          sar,
        ])
      ),
    [sars]
  );

  const resolvedLogs =
    useMemo<ResolvedLog[]>(
      () =>
        logs
          .map((log) =>
            resolveAuditLog({
              log,
              employeeMap,
              matterMap,
              sarMap,
            })
          )
          .sort(
            (first, second) =>
              new Date(
                second.created_at
              ).getTime() -
              new Date(
                first.created_at
              ).getTime()
          ),
      [
        employeeMap,
        logs,
        matterMap,
        sarMap,
      ]
    );

  const filteredLogs = useMemo(
    () => {
      const searchValue =
        normaliseText(search);

      return resolvedLogs.filter(
        (log) => {
          if (
            category !== "All" &&
            log.action_category !==
              category
          ) {
            return false;
          }

          if (
            !matchesDateFilter(
              log.created_at,
              dateFilter
            )
          ) {
            return false;
          }

          if (!searchValue) {
            return true;
          }

          const searchableValues = [
            log.action,
            log.activityVerb,
            log.action_category,
            log.entity_type,
            log.entity_id,
            log.entity_name,
            log.recordTitle,
            log.relatedPerson,
            log.reference,
            log.description,
            log.user_name,
            log.user_email,
            log.source_page,
            stringifyForSearch(
              log.previous_values
            ),
            stringifyForSearch(
              log.new_values
            ),
            stringifyForSearch(
              log.metadata
            ),
          ];

          const searchableText =
            normaliseText(
              searchableValues
                .filter(Boolean)
                .join(" ")
            );

          return searchableText.includes(
            searchValue
          );
        }
      );
    },
    [
      category,
      dateFilter,
      resolvedLogs,
      search,
    ]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredLogs.length /
        PAGE_SIZE
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedLogs = useMemo(
    () => {
      const start =
        (safeCurrentPage - 1) *
        PAGE_SIZE;

      return filteredLogs.slice(
        start,
        start + PAGE_SIZE
      );
    },
    [
      filteredLogs,
      safeCurrentPage,
    ]
  );

  const selectedLog =
    useMemo(
      () =>
        resolvedLogs.find(
          (log) =>
            log.id ===
            selectedLogId
        ) || null,
      [
        resolvedLogs,
        selectedLogId,
      ]
    );

  const activityToday = useMemo(
    () =>
      resolvedLogs.filter((log) =>
        matchesDateFilter(
          log.created_at,
          "today"
        )
      ).length,
    [resolvedLogs]
  );

  const activityThisMonth =
    useMemo(
      () =>
        resolvedLogs.filter((log) =>
          isInCurrentMonth(
            log.created_at
          )
        ).length,
      [resolvedLogs]
    );

  const uniqueUsers = useMemo(
    () =>
      new Set(
        resolvedLogs
          .map(
            (log) =>
              log.user_id ||
              log.user_email ||
              log.user_name
          )
          .filter(Boolean)
      ).size,
    [resolvedLogs]
  );

  const recordCount = useMemo(
    () =>
      new Set(
        resolvedLogs
          .map(
            (log) =>
              log.reference ||
              `${log.entity_type}:${log.entity_id}`
          )
          .filter(Boolean)
      ).size,
    [resolvedLogs]
  );

  function clearFilters() {
    setSearch("");
    setCategory("All");
    setDateFilter("30_days");
    setCurrentPage(1);
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            Audit Logs
          </h1>

          <p style={subtitleStyle}>
            Find and review significant
            activity recorded across the
            platform.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAuditData}
          style={secondaryButtonStyle}
        >
          Refresh
        </button>
      </div>

      <div style={summaryGridStyle}>
        <SummaryCard
          label="Recorded activity"
          value={resolvedLogs.length}
          detail="All audit entries"
        />

        <SummaryCard
          label="Today"
          value={activityToday}
          detail="Actions recorded today"
        />

        <SummaryCard
          label="This month"
          value={activityThisMonth}
          detail="Actions recorded this month"
        />

        <SummaryCard
          label="Records involved"
          value={recordCount}
          detail="Distinct records referenced"
        />

        <SummaryCard
          label="Users recorded"
          value={uniqueUsers}
          detail={
            uniqueUsers === 0
              ? "Current activity recorded as System"
              : "Distinct users in the log"
          }
        />
      </div>

      <div style={searchPanelStyle}>
        <div style={searchRowStyle}>
          <div style={searchContainerStyle}>
            <div style={searchLabelStyle}>
              Search audit history
            </div>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search employee, Matter, SAR, action, reference, user or description..."
              style={searchStyle}
            />
          </div>

          <div style={dateSelectContainerStyle}>
            <div style={searchLabelStyle}>
              Date range
            </div>

            <select
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(
                  event.target
                    .value as DateFilter
                )
              }
              style={selectStyle}
            >
              {dateOptions.map(
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
          </div>
        </div>

        <div style={quickDateRowStyle}>
          {dateOptions.map(
            (option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setDateFilter(
                    option.value
                  )
                }
                style={{
  ...quickFilterStyle,
  ...(dateFilter === option.value
    ? {
        background: "#F7F1FC",
        color: "#6E5084",
      }
    : {}),
}}
              >
                {option.label}
              </button>
            )
          )}
        </div>

        <div style={filterRowStyle}>
          {categoryOptions.map(
            (option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  setCategory(option)
                }
                style={{
  ...categoryFilterStyle,
  ...(category === option
    ? {
        background: "#F7F1FC",
        color: "#6E5084",
      }
    : {}),
}}
              >
                {option}
              </button>
            )
          )}
        </div>

        <div style={resultSummaryStyle}>
          <span>
            Showing{" "}
            <strong>
              {filteredLogs.length}
            </strong>{" "}
            matching{" "}
            {filteredLogs.length === 1
              ? "entry"
              : "entries"}
          </span>

          {(search ||
            category !== "All" ||
            dateFilter !==
              "30_days") && (
            <button
              type="button"
              onClick={clearFilters}
              style={clearButtonStyle}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div style={contentLayoutStyle}>
        <div style={tableCardStyle}>
          {loading ? (
            <div style={emptyStyle}>
              Loading audit activity...
            </div>
          ) : paginatedLogs.length ===
            0 ? (
            <div style={emptyStyle}>
              {resolvedLogs.length === 0
                ? "No audit activity has been recorded yet."
                : "No activity matches the current search and filters."}
            </div>
          ) : (
            <>
              <div style={tableWrapperStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <Th>Date and time</Th>
                      <Th>Activity</Th>
                      <Th>Category</Th>
                      <Th>Record</Th>
                      <Th>
                        Employee / related person
                      </Th>
                      <Th>User</Th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedLogs.map(
                      (log) => (
                        <tr
                          key={log.id}
                          onClick={() =>
                            setSelectedLogId(
                              log.id
                            )
                          }
                          style={{
                            ...rowStyle,
                            ...(selectedLogId ===
                            log.id
                              ? selectedRowStyle
                              : {}),
                          }}
                        >
                          <Td>
                            <div
                              style={
                                datePrimaryStyle
                              }
                            >
                              {formatFriendlyDay(
                                log.created_at
                              )}
                            </div>

                            <div
                              style={
                                timeStyle
                              }
                            >
                              {formatTime(
                                log.created_at
                              )}
                            </div>

                            <div
                              style={
                                fullDateStyle
                              }
                            >
                              {formatShortDate(
                                log.created_at
                              )}
                            </div>
                          </Td>

                          <Td>
                            <span
                              style={{
                                ...activityBadgeStyle,
                                ...getActivityStyle(
                                  log.activityVerb
                                ),
                              }}
                            >
                              {
                                log.activityVerb
                              }
                            </span>

                            <div
                              style={
                                actionTitleStyle
                              }
                            >
                              {log.action}
                            </div>

                            {log.description && (
                              <div
                                style={
                                  descriptionStyle
                                }
                              >
                                {
                                  log.description
                                }
                              </div>
                            )}
                          </Td>

                          <Td>
                            <span
                              style={{
                                ...categoryBadgeStyle,
                                ...getCategoryStyle(
                                  log.action_category
                                ),
                              }}
                            >
                              {
                                log.action_category
                              }
                            </span>
                          </Td>

                          <Td>
                            <div
                              style={
                                recordTitleStyle
                              }
                            >
                              {
                                log.recordTitle
                              }
                            </div>

                            {log.reference && (
                              <div
                                style={
                                  referenceStyle
                                }
                              >
                                {
                                  log.reference
                                }
                              </div>
                            )}
                          </Td>

                          <Td>
                            <div
                              style={
                                relatedPersonStyle
                              }
                            >
                              {log.relatedPerson ||
                                "Not linked"}
                            </div>
                          </Td>

                          <Td>
                            <div
                              style={
                                userPrimaryStyle
                              }
                            >
                              {log.user_name ||
                                log.user_email ||
                                "System"}
                            </div>

                            {log.user_name &&
                              log.user_email && (
                                <div
                                  style={
                                    userSecondaryStyle
                                  }
                                >
                                  {
                                    log.user_email
                                  }
                                </div>
                              )}
                          </Td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={
                  safeCurrentPage
                }
                totalPages={totalPages}
                totalItems={
                  filteredLogs.length
                }
                pageSize={PAGE_SIZE}
                onPrevious={() =>
                  setCurrentPage(
                    Math.max(
                      1,
                      safeCurrentPage - 1
                    )
                  )
                }
                onNext={() =>
                  setCurrentPage(
                    Math.min(
                      totalPages,
                      safeCurrentPage + 1
                    )
                  )
                }
              />
            </>
          )}
        </div>

        {selectedLog && (
          <AuditDetailPanel
            log={selectedLog}
            onClose={() =>
              setSelectedLogId(null)
            }
            onOpenRecord={() => {
              if (
                selectedLog.destinationPath
              ) {
                router.push(
                  selectedLog.destinationPath
                );
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function resolveAuditLog({
  log,
  employeeMap,
  matterMap,
  sarMap,
}: {
  log: AuditLog;
  employeeMap: Map<number, string>;
  matterMap: Map<
    number,
    MatterRecord
  >;
  sarMap: Map<number, SarRecord>;
}): ResolvedLog {
  const category =
    log.action_category;

  const entityId =
    toNumber(log.entity_id);

  const metadataEmployeeId =
    getNumberValue(
      log.metadata,
      "employee_id"
    );

  const newValueEmployeeId =
    getNumberValue(
      log.new_values,
      "employee_id"
    );

  const previousEmployeeId =
    getNumberValue(
      log.previous_values,
      "employee_id"
    );

  const metadataEmployeeName =
    getStringValue(
      log.metadata,
      "employee_name"
    );

  let employeeId =
    metadataEmployeeId ??
    newValueEmployeeId ??
    previousEmployeeId;

  let recordTitle =
    cleanRecordTitle(
      log.entity_name,
      log.entity_type
    );

  let destinationPath:
    | string
    | null = null;

  let reference =
    formatReference(
      category,
      log.entity_type,
      log.entity_id,
      log.metadata
    );

  if (
    category === "Matter" ||
    log.entity_type === "Matter"
  ) {
    const matter =
      entityId !== null
        ? matterMap.get(entityId)
        : undefined;

    if (matter) {
      recordTitle =
        matter.subject ||
        matter.title;

      employeeId =
        employeeId ??
        matter.employee_id;

      destinationPath =
        `/dashboard/matters/${matter.id}`;

      reference =
        `MAT-${padReference(
          matter.id
        )}`;
    }
  }

  if (
    category === "SAR" ||
    log.entity_type === "SAR" ||
    log.entity_type ===
      "SAR Document"
  ) {
    const metadataSarId =
      getNumberValue(
        log.metadata,
        "sar_id"
      );

    const sarId =
      log.entity_type === "SAR"
        ? entityId
        : metadataSarId;

    const sar =
      sarId !== null
        ? sarMap.get(sarId)
        : undefined;

    if (sar) {
      recordTitle =
        sar.request_title ||
        recordTitle;

      employeeId =
        employeeId ??
        sar.employee_id;

      destinationPath =
        `/dashboard/sar-requests/${sar.id}`;

      reference =
        `SAR-${padReference(
          sar.id
        )}`;
    }
  }

  if (
    category === "Employee" ||
    log.entity_type === "Employee"
  ) {
    if (entityId !== null) {
      employeeId =
        employeeId ??
        entityId;

      recordTitle =
        employeeMap.get(
          entityId
        ) ||
        recordTitle;

      destinationPath =
        `/dashboard/employees/${entityId}`;

      reference =
        `EMP-${padReference(
          entityId
        )}`;
    }
  }

  if (
    category === "HR Resource"
  ) {
    destinationPath =
      "/dashboard/hr-resources";
  }

  if (
    category === "Compliance"
  ) {
    destinationPath =
      "/dashboard/compliance";
  }

  if (
    category === "Foundation"
  ) {
    destinationPath =
      "/dashboard/foundations";
  }

  const relatedPerson =
    metadataEmployeeName ||
    (employeeId !== null &&
    employeeId !== undefined
      ? employeeMap.get(employeeId) ||
        null
      : null);

  return {
    ...log,
    activityVerb:
      getActivityVerb(log.action),
    recordTitle,
    relatedPerson,
    reference,
    destinationPath,
  };
}

function AuditDetailPanel({
  log,
  onClose,
  onOpenRecord,
}: {
  log: ResolvedLog;
  onClose: () => void;
  onOpenRecord: () => void;
}) {
  return (
    <aside style={detailPanelStyle}>
      <div style={detailHeaderStyle}>
        <div>
          <div
            style={detailEyebrowStyle}
          >
            Audit entry
          </div>

          <h2 style={detailTitleStyle}>
            {log.action}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={closeButtonStyle}
          aria-label="Close audit entry"
        >
          ×
        </button>
      </div>

      <div style={detailSummaryStyle}>
        <span
          style={{
            ...activityBadgeStyle,
            ...getActivityStyle(
              log.activityVerb
            ),
          }}
        >
          {log.activityVerb}
        </span>

        <span
          style={{
            ...categoryBadgeStyle,
            ...getCategoryStyle(
              log.action_category
            ),
          }}
        >
          {log.action_category}
        </span>
      </div>

      <DetailItem
        label="Date"
        value={formatLongDate(
          log.created_at
        )}
      />

      <DetailItem
        label="Time"
        value={formatTime(
          log.created_at
        )}
      />

      <DetailItem
        label="Record"
        value={log.recordTitle}
      />

      {log.relatedPerson && (
        <DetailItem
          label="Employee / related person"
          value={log.relatedPerson}
        />
      )}

      {log.reference && (
        <DetailItem
          label="Reference"
          value={log.reference}
        />
      )}

      <DetailItem
        label="Recorded by"
        value={
          log.user_name ||
          log.user_email ||
          "System"
        }
      />

      <DetailItem
        label="Source page"
        value={
          log.source_page ||
          "Not recorded"
        }
      />

      {log.description && (
        <div style={detailBlockStyle}>
          <div style={detailLabelStyle}>
            What happened
          </div>

          <div style={detailValueStyle}>
            {log.description}
          </div>
        </div>
      )}

      {log.previous_values && (
        <FriendlyDataBlock
          label="Previous information"
          value={log.previous_values}
        />
      )}

      {log.new_values && (
        <FriendlyDataBlock
          label="Recorded information"
          value={log.new_values}
        />
      )}

      {log.metadata && (
        <FriendlyDataBlock
          label="Related information"
          value={log.metadata}
        />
      )}

      {log.destinationPath && (
        <div style={detailActionStyle}>
          <button
            type="button"
            onClick={onOpenRecord}
            style={primaryActionButtonStyle}
          >
            {getOpenButtonLabel(log)}
          </button>
        </div>
      )}
    </aside>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div style={summaryCardStyle}>
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

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPrevious,
  onNext,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const firstItem =
    totalItems === 0
      ? 0
      : (currentPage - 1) *
          pageSize +
        1;

  const lastItem = Math.min(
    currentPage * pageSize,
    totalItems
  );

  return (
    <div style={paginationStyle}>
      <div style={paginationTextStyle}>
        Showing {firstItem}–{lastItem}{" "}
        of {totalItems}
      </div>

      <div style={paginationActionsStyle}>
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage <= 1}
          style={{
            ...paginationButtonStyle,
            opacity:
              currentPage <= 1
                ? 0.45
                : 1,
          }}
        >
          Previous
        </button>

        <div style={pageNumberStyle}>
          Page {currentPage} of{" "}
          {totalPages}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={
            currentPage >= totalPages
          }
          style={{
            ...paginationButtonStyle,
            opacity:
              currentPage >= totalPages
                ? 0.45
                : 1,
          }}
        >
          Next
        </button>
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
    <div style={detailBlockStyle}>
      <div style={detailLabelStyle}>
        {label}
      </div>

      <div style={detailValueStyle}>
        {value}
      </div>
    </div>
  );
}

function FriendlyDataBlock({
  label,
  value,
}: {
  label: string;
  value: JsonRecord;
}) {
  const entries =
    Object.entries(value).filter(
      ([, itemValue]) =>
        itemValue !== null &&
        itemValue !== undefined &&
        itemValue !== ""
    );

  if (entries.length === 0) {
    return null;
  }

  return (
    <div style={detailBlockStyle}>
      <div style={detailLabelStyle}>
        {label}
      </div>

      <div style={dataListStyle}>
        {entries.map(
          ([key, itemValue]) => (
            <div
              key={key}
              style={dataRowStyle}
            >
              <div style={dataKeyStyle}>
                {formatFieldName(key)}
              </div>

              <div style={dataValueStyle}>
                {formatDataValue(
                  itemValue
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Th({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th style={thStyle}>
      {children}
    </th>
  );
}

function Td({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <td style={tdStyle}>
      {children}
    </td>
  );
}

function getActivityVerb(
  action: string
) {
  const normalised =
    action.toLowerCase();

  if (
    normalised.includes(
      "reopened"
    )
  ) {
    return "Reopened";
  }

  if (
    normalised.includes(
      "removed"
    ) ||
    normalised.includes(
      "deleted"
    )
  ) {
    return "Removed";
  }

  if (
    normalised.includes(
      "uploaded"
    ) ||
    normalised.includes(
      "added"
    )
  ) {
    return "Added";
  }

  if (
    normalised.includes(
      "created"
    )
  ) {
    return "Created";
  }

  if (
    normalised.includes(
      "completed"
    )
  ) {
    return "Completed";
  }

  if (
    normalised.includes(
      "closed"
    )
  ) {
    return "Closed";
  }

  if (
    normalised.includes(
      "archived"
    )
  ) {
    return "Archived";
  }

  if (
    normalised.includes(
      "review"
    )
  ) {
    return "Reviewed";
  }

  if (
    normalised.includes(
      "changed"
    ) ||
    normalised.includes(
      "updated"
    )
  ) {
    return "Updated";
  }

  return "Recorded";
}

function getActivityStyle(
  activity: string
): React.CSSProperties {
  if (
    activity === "Created" ||
    activity === "Added"
  ) {
    return {
      background: "#F0FDF4",
      color: "#166534",
    };
  }

  if (
    activity === "Updated" ||
    activity === "Reviewed"
  ) {
    return {
      background: "#EFF6FF",
      color: "#1D4ED8",
    };
  }

  if (
    activity === "Completed" ||
    activity === "Closed"
  ) {
    return {
      background: "#F5F3FF",
      color: "#6D28D9",
    };
  }

  if (
    activity === "Removed" ||
    activity === "Archived"
  ) {
    return {
      background: "#F3F4F6",
      color: "#4B5563",
    };
  }

  if (
    activity === "Reopened"
  ) {
    return {
      background: "#FFF7ED",
      color: "#9A3412",
    };
  }

  return {
    background: "#F9FAFB",
    color: "#4B5563",
  };
}

function getCategoryStyle(
  category: string
): React.CSSProperties {
  if (category === "Matter") {
    return {
      background: "#F5F3FF",
      color: "#6D28D9",
    };
  }

  if (category === "Employee") {
    return {
      background: "#EFF6FF",
      color: "#1D4ED8",
    };
  }

  if (
    category === "Compliance" ||
    category === "SAR"
  ) {
    return {
      background: "#FFFBEB",
      color: "#92400E",
    };
  }

  if (
    category === "HR Resource" ||
    category === "Document"
  ) {
    return {
      background: "#F0FDF4",
      color: "#166534",
    };
  }

  if (
    category === "Security" ||
    category === "System"
  ) {
    return {
      background: "#F3F4F6",
      color: "#374151",
    };
  }

  return {
    background: "#F9FAFB",
    color: "#4B5563",
  };
}

function cleanRecordTitle(
  entityName: string | null,
  entityType: string | null
) {
  const name =
    entityName?.trim();

  if (
    name &&
    name.toLowerCase() !==
      "subject access request"
  ) {
    return name;
  }

  return (
    entityType?.trim() ||
    name ||
    "General activity"
  );
}

function formatReference(
  category: string,
  entityType: string | null,
  entityId: string | null,
  metadata: JsonRecord | null
) {
  const numericId =
    toNumber(entityId);

  if (
    entityType ===
    "SAR Document"
  ) {
    const sarId =
      getNumberValue(
        metadata,
        "sar_id"
      );

    return sarId !== null
      ? `SAR-${padReference(
          sarId
        )}`
      : numericId !== null
        ? `DOC-${padReference(
            numericId
          )}`
        : null;
  }

  if (numericId === null) {
    return null;
  }

  if (
    category === "Matter" ||
    entityType === "Matter"
  ) {
    return `MAT-${padReference(
      numericId
    )}`;
  }

  if (
    category === "SAR" ||
    entityType === "SAR"
  ) {
    return `SAR-${padReference(
      numericId
    )}`;
  }

  if (
    category === "Employee" ||
    entityType === "Employee"
  ) {
    return `EMP-${padReference(
      numericId
    )}`;
  }

  if (
    category === "Compliance"
  ) {
    return `COMP-${padReference(
      numericId
    )}`;
  }

  if (
    category === "HR Resource"
  ) {
    return `RES-${padReference(
      numericId
    )}`;
  }

  if (
    category === "Document"
  ) {
    return `DOC-${padReference(
      numericId
    )}`;
  }

  return `AUD-${padReference(
    numericId
  )}`;
}

function padReference(
  value: number
) {
  return String(value).padStart(
    4,
    "0"
  );
}

function getOpenButtonLabel(
  log: ResolvedLog
) {
  if (
    log.action_category ===
      "Matter" ||
    log.entity_type === "Matter"
  ) {
    return "Open Matter";
  }

  if (
    log.action_category === "SAR" ||
    log.entity_type === "SAR" ||
    log.entity_type ===
      "SAR Document"
  ) {
    return "Open SAR";
  }

  if (
    log.action_category ===
      "Employee" ||
    log.entity_type ===
      "Employee"
  ) {
    return "Open employee";
  }

  if (
    log.action_category ===
    "HR Resource"
  ) {
    return "Open HR Resources";
  }

  if (
    log.action_category ===
    "Compliance"
  ) {
    return "Open Compliance";
  }

  if (
    log.action_category ===
    "Foundation"
  ) {
    return "Open Foundations";
  }

  return "Open record";
}

function matchesDateFilter(
  value: string,
  filter: DateFilter
) {
  const date = new Date(value);
  const now = new Date();

  if (
    !Number.isFinite(
      date.getTime()
    )
  ) {
    return false;
  }

  if (filter === "all_time") {
    return true;
  }

  if (filter === "today") {
    return isSameDay(date, now);
  }

  if (
    filter === "yesterday"
  ) {
    const yesterday =
      new Date(now);

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    return isSameDay(
      date,
      yesterday
    );
  }

  const startDate =
    new Date(now);

  if (filter === "7_days") {
    startDate.setDate(
      startDate.getDate() - 7
    );
  }

  if (filter === "30_days") {
    startDate.setDate(
      startDate.getDate() - 30
    );
  }

  if (filter === "90_days") {
    startDate.setDate(
      startDate.getDate() - 90
    );
  }

  return date >= startDate;
}

function isSameDay(
  first: Date,
  second: Date
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}

function isInCurrentMonth(
  value: string
) {
  const date = new Date(value);
  const now = new Date();

  return (
    date.getFullYear() ===
      now.getFullYear() &&
    date.getMonth() ===
      now.getMonth()
  );
}

function formatFriendlyDay(
  value: string
) {
  const date = new Date(value);
  const today = new Date();

  if (isSameDay(date, today)) {
    return "Today";
  }

  const yesterday =
    new Date(today);

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  if (
    isSameDay(date, yesterday)
  ) {
    return "Yesterday";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      weekday: "short",
    }
  );
}

function formatTime(
  value: string
) {
  return new Date(
    value
  ).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatShortDate(
  value: string
) {
  return new Date(
    value
  ).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatLongDate(
  value: string
) {
  return new Date(
    value
  ).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function normaliseText(
  value: string
) {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function stringifyForSearch(
  value: JsonRecord | null
) {
  if (!value) {
    return "";
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function getStringValue(
  value: JsonRecord | null,
  key: string
) {
  const found =
    value?.[key];

  return typeof found === "string" &&
    found.trim()
    ? found.trim()
    : null;
}

function getNumberValue(
  value: JsonRecord | null,
  key: string
) {
  const found =
    value?.[key];

  return toNumber(found);
}

function toNumber(
  value: unknown
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const converted =
      Number(value);

    return Number.isFinite(
      converted
    )
      ? converted
      : null;
  }

  return null;
}

function formatFieldName(
  value: string
) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatDataValue(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not recorded";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (
    typeof value === "string"
  ) {
    if (
      /^\d{4}-\d{2}-\d{2}T/.test(
        value
      )
    ) {
      return new Date(
        value
      ).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        value
      )
    ) {
      return new Date(
        `${value}T00:00:00`
      ).toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    }

    return value;
  }

  if (
    typeof value === "object"
  ) {
    try {
      return JSON.stringify(value);
    } catch {
      return "Recorded";
    }
  }

  return String(value);
}

const pageStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1500px",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "20px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "27px",
  fontWeight: 700,
};

const subtitleStyle: React.CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "14px",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "11px",
  marginBottom: "18px",
};

const summaryCardStyle: React.CSSProperties = {
  padding: "15px",
  border:
    "1px solid #E5E7EB",
  borderRadius: "13px",
  background: "#FFFFFF",
};

const summaryLabelStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "11px",
  marginBottom: "7px",
};

const summaryValueStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "22px",
  fontWeight: 700,
};

const summaryDetailStyle: React.CSSProperties = {
  color: "#9CA3AF",
  fontSize: "10px",
  marginTop: "5px",
};

const searchPanelStyle: React.CSSProperties = {
  marginBottom: "14px",
  padding: "14px",
  border:
    "1px solid #E5E7EB",
  borderRadius: "14px",
  background: "#FFFFFF",
};

const searchRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) 190px",
  gap: "11px",
};

const searchContainerStyle: React.CSSProperties = {
  minWidth: 0,
};

const dateSelectContainerStyle: React.CSSProperties = {
  minWidth: 0,
};

const searchLabelStyle: React.CSSProperties = {
  marginBottom: "6px",
  color: "#4B5563",
  fontSize: "11px",
  fontWeight: 700,
};

const searchStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 11px",
  border:
    "1px solid #D1D5DB",
  borderRadius: "10px",
  fontSize: "13px",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 11px",
  border:
    "1px solid #D1D5DB",
  borderRadius: "10px",
  background: "#FFFFFF",
  color: "#374151",
  fontSize: "13px",
};

const quickDateRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
  marginTop: "12px",
};

const quickFilterStyle: React.CSSProperties = {
  border:
    "1px solid #E5E7EB",
  borderRadius: "999px",
  background: "#FFFFFF",
  color: "#6B7280",
  padding: "6px 10px",
  fontSize: "10px",
  fontWeight: 600,
  cursor: "pointer",
};


const filterRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
  marginTop: "11px",
  paddingTop: "11px",
  borderTop:
    "1px solid #F3F4F6",
};

const categoryFilterStyle: React.CSSProperties = {
  border:
    "1px solid #E5E7EB",
  borderRadius: "999px",
  background: "#FFFFFF",
  color: "#4B5563",
  padding: "7px 11px",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
};

const resultSummaryStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent:
    "space-between",
  gap: "12px",
  marginTop: "12px",
  color: "#6B7280",
  fontSize: "11px",
};

const clearButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#6E5084",
  padding: 0,
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const contentLayoutStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) auto",
  gap: "16px",
  alignItems: "start",
};

const tableCardStyle: React.CSSProperties = {
  border:
    "1px solid #E5E7EB",
  borderRadius: "14px",
  background: "#FFFFFF",
  overflow: "hidden",
  minWidth: 0,
};

const tableWrapperStyle: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: "1180px",
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  padding: "12px 13px",
  textAlign: "left",
  borderBottom:
    "1px solid #E5E7EB",
  background: "#FAFAFA",
  color: "#4B5563",
  fontSize: "11px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "13px",
  borderBottom:
    "1px solid #F3F4F6",
  verticalAlign: "top",
  color: "#374151",
  fontSize: "12px",
};

const rowStyle: React.CSSProperties = {
  cursor: "pointer",
};

const selectedRowStyle: React.CSSProperties = {
  background: "#FCFAFD",
};

const datePrimaryStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "12px",
  fontWeight: 700,
};

const timeStyle: React.CSSProperties = {
  marginTop: "3px",
  color: "#111827",
  fontSize: "13px",
  fontWeight: 700,
};

const fullDateStyle: React.CSSProperties = {
  marginTop: "3px",
  color: "#9CA3AF",
  fontSize: "10px",
  whiteSpace: "nowrap",
};

const activityBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "4px 8px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const actionTitleStyle: React.CSSProperties = {
  marginTop: "7px",
  color: "#111827",
  fontSize: "12px",
  fontWeight: 700,
};

const descriptionStyle: React.CSSProperties = {
  marginTop: "4px",
  maxWidth: "390px",
  color: "#6B7280",
  fontSize: "10px",
  lineHeight: 1.45,
};

const categoryBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "4px 8px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const recordTitleStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "12px",
  fontWeight: 700,
  maxWidth: "220px",
};

const referenceStyle: React.CSSProperties = {
  marginTop: "5px",
  color: "#6E5084",
  fontSize: "10px",
  fontWeight: 700,
};

const relatedPersonStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "12px",
  fontWeight: 600,
};

const userPrimaryStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "12px",
  fontWeight: 600,
};

const userSecondaryStyle: React.CSSProperties = {
  marginTop: "3px",
  color: "#9CA3AF",
  fontSize: "10px",
};

const paginationStyle: React.CSSProperties = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: "14px",
  padding: "12px 14px",
  borderTop:
    "1px solid #E5E7EB",
  background: "#FAFAFA",
};

const paginationTextStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "11px",
};

const paginationActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const paginationButtonStyle: React.CSSProperties = {
  border:
    "1px solid #D1D5DB",
  borderRadius: "8px",
  background: "#FFFFFF",
  color: "#4B5563",
  padding: "6px 9px",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
};

const pageNumberStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "11px",
  minWidth: "90px",
  textAlign: "center",
};

const detailPanelStyle: React.CSSProperties = {
  width: "350px",
  maxHeight: "calc(100vh - 40px)",
  overflowY: "auto",
  padding: "18px",
  border:
    "1px solid #E5E7EB",
  borderRadius: "14px",
  background: "#FFFFFF",
  position: "sticky",
  top: "18px",
};

const detailHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent:
    "space-between",
  gap: "12px",
  marginBottom: "14px",
};

const detailEyebrowStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const detailTitleStyle: React.CSSProperties = {
  margin: "5px 0 0",
  color: "#111827",
  fontSize: "17px",
  lineHeight: 1.35,
};

const closeButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#9CA3AF",
  fontSize: "22px",
  cursor: "pointer",
};

const detailSummaryStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
  marginBottom: "16px",
};

const detailBlockStyle: React.CSSProperties = {
  marginBottom: "13px",
};

const detailLabelStyle: React.CSSProperties = {
  color: "#9CA3AF",
  fontSize: "10px",
  marginBottom: "4px",
};

const detailValueStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "12px",
  lineHeight: 1.5,
  wordBreak: "break-word",
};

const dataListStyle: React.CSSProperties = {
  border:
    "1px solid #E5E7EB",
  borderRadius: "10px",
  overflow: "hidden",
};

const dataRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "130px minmax(0, 1fr)",
  gap: "9px",
  padding: "8px 9px",
  borderBottom:
    "1px solid #F3F4F6",
  background: "#FAFAFA",
};

const dataKeyStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "10px",
  fontWeight: 600,
};

const dataValueStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "10px",
  lineHeight: 1.45,
  wordBreak: "break-word",
};

const detailActionStyle: React.CSSProperties = {
  marginTop: "17px",
};

const primaryActionButtonStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderRadius: "9px",
  background: "#6E5084",
  color: "#FFFFFF",
  padding: "9px 11px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  border:
    "1px solid #D1D5DB",
  borderRadius: "9px",
  background: "#FFFFFF",
  color: "#4B5563",
  padding: "8px 11px",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
};

const emptyStyle: React.CSSProperties = {
  padding: "34px",
  color: "#6B7280",
  fontSize: "13px",
  textAlign: "center",
};