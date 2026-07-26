import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type ImportMode =
  | "create_new"
  | "update_existing"
  | "create_and_update";

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

type EmploymentDetails = {
  manager: string | null;
  probation_end_date: string | null;
  employment_end_date: string | null;
  reason_for_leaving: string | null;
  annual_leave_allowance: string | null;
};

type MatchingEmployee = {
  id: number;
  name: string;
  role: string | null;
  email: string | null;
  start_date: string | null;
  status: string | null;
  employmentDetails: EmploymentDetails | null;
};

type ImportRow = {
  rowNumber: number;
  sourceData: Record<string, unknown>;
  mappedData: MappedEmployeeRow;
  status:
    | "ready"
    | "update"
    | "warning"
    | "error"
    | "skip";
  matchingEmployee: MatchingEmployee | null;
  errors: string[];
  warnings: string[];
};

type ImportRequest = {
  fileName?: string;
  fileType?: string | null;
  importMode?: ImportMode;
  columnMapping?: Record<string, string>;
  rows?: ImportRow[];
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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not signed in.",
        },
        { status: 401 }
      );
    }

    const body =
      (await request.json()) as ImportRequest;

    const importMode = body.importMode;
    const rows = Array.isArray(body.rows)
      ? body.rows
      : [];

    if (
      !importMode ||
      ![
        "create_new",
        "update_existing",
        "create_and_update",
      ].includes(importMode)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid import mode is required.",
        },
        { status: 400 }
      );
    }

    if (
      rows.length === 0 ||
      rows.length > 5000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            rows.length > 5000
              ? "A single import cannot contain more than 5,000 rows."
              : "There are no employee rows to import.",
        },
        { status: 400 }
      );
    }

    const requiredPermissions =
      importMode === "create_new"
        ? ["employees.create"]
        : importMode ===
            "update_existing"
          ? ["employees.manage"]
          : [
              "employees.create",
              "employees.manage",
            ];

    const accessResult = await requireAccess(
      supabase,
      user.id,
      requiredPermissions
    );

    if (!accessResult.ok) {
      return accessResult.response;
    }

    const { organisationId } =
      accessResult.access;

    const {
      data: importRecord,
      error: importRecordError,
    } = await supabase
      .from("employee_imports")
      .insert({
        organisation_id: organisationId,
        file_name:
          cleanText(body.fileName, 255) ||
          "Employee import",
        file_type:
          cleanText(body.fileType, 100) ||
          null,
        import_mode: importMode,
        status: "processing",
        total_rows: rows.length,
        created_rows: 0,
        updated_rows: 0,
        skipped_rows: 0,
        error_rows: 0,
        column_mapping:
          body.columnMapping || {},
        import_options: {
          preserve_existing_values: true,
          source:
            "Employee Import Wizard",
        },
        created_by: user.id,
      })
      .select("id")
      .single();

    if (importRecordError) {
      throw importRecordError;
    }

    const importId =
      importRecord?.id ?? null;

    const result: ImportResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      rowResults: [],
    };

    for (const row of rows) {
      const mappedData =
        normaliseMappedData(row.mappedData);

      try {
        if (
          !Number.isInteger(row.rowNumber) ||
          row.rowNumber < 1
        ) {
          throw new Error(
            "The source row number is invalid."
          );
        }

        if (
          row.status === "error" ||
          row.status === "skip"
        ) {
          result.skipped += 1;
          result.rowResults.push({
            rowNumber: row.rowNumber,
            name: mappedData.name,
            result: "Skipped",
            employeeId: null,
            message:
              row.errors?.join("; ") ||
              row.warnings?.join("; ") ||
              "The row was not eligible for import.",
          });

          await saveImportRowResult(
            supabase,
            importId,
            row,
            mappedData,
            "skipped"
          );

          continue;
        }

        validateMappedEmployee(
          mappedData
        );

        const matchingEmployee =
          await resolveMatchingEmployee(
            supabase,
            organisationId,
            row.matchingEmployee?.id ??
              null,
            mappedData.email
          );

        const shouldUpdate =
          Boolean(matchingEmployee) &&
          (importMode ===
            "update_existing" ||
            importMode ===
              "create_and_update");

        const shouldCreate =
          !matchingEmployee &&
          (importMode === "create_new" ||
            importMode ===
              "create_and_update");

        if (
          !shouldUpdate &&
          !shouldCreate
        ) {
          result.skipped += 1;
          result.rowResults.push({
            rowNumber: row.rowNumber,
            name: mappedData.name,
            result: "Skipped",
            employeeId:
              matchingEmployee?.id ??
              null,
            message: matchingEmployee
              ? "A matching employee already exists."
              : "The selected import mode does not create new employees.",
          });

          await saveImportRowResult(
            supabase,
            importId,
            row,
            mappedData,
            "skipped",
            matchingEmployee?.id ?? null
          );

          continue;
        }

        if (
          shouldUpdate &&
          matchingEmployee
        ) {
          const employeeId =
            matchingEmployee.id;

          const { error: updateError } =
            await supabase
              .from("employees")
              .update({
                name:
                  mappedData.name ||
                  matchingEmployee.name,
                role:
                  emptyToNull(
                    mappedData.role
                  ) ??
                  matchingEmployee.role,
                email:
                  emptyToNull(
                    mappedData.email
                  ) ??
                  matchingEmployee.email,
                start_date:
                  emptyToNull(
                    mappedData.start_date
                  ) ??
                  matchingEmployee.start_date,
                status:
                  normaliseEmployeeStatus(
                    mappedData.status
                  ) ||
                  normaliseEmployeeStatus(
                    matchingEmployee.status
                  ),
                updated_at:
                  new Date().toISOString(),
              })
              .eq("id", employeeId)
              .eq(
                "organisation_id",
                organisationId
              );

          if (updateError) {
            throw updateError;
          }

          await upsertEmploymentDetails(
            supabase,
            employeeId,
            mappedData,
            matchingEmployee.employmentDetails
          );

          await writeTimelineEvent(
            supabase,
            organisationId,
            employeeId,
            "Employee record updated by import",
            `${mappedData.name} was updated through the Employee Import Wizard.`,
            importId,
            "Updated",
            user.id
          );

          result.updated += 1;

          result.rowResults.push({
            rowNumber: row.rowNumber,
            name: mappedData.name,
            result: "Updated",
            employeeId,
            message:
              "The existing employee record was updated.",
          });

          await saveImportRowResult(
            supabase,
            importId,
            row,
            mappedData,
            "updated",
            employeeId
          );
        }

        if (shouldCreate) {
          const {
            data: createdEmployee,
            error: createError,
          } = await supabase
            .from("employees")
            .insert({
              organisation_id:
                organisationId,
              name: mappedData.name,
              role: emptyToNull(
                mappedData.role
              ),
              email: emptyToNull(
                mappedData.email
              ),
              start_date: emptyToNull(
                mappedData.start_date
              ),
              status:
                normaliseEmployeeStatus(
                  mappedData.status
                ) || "Active",
            })
            .select("id")
            .single();

          if (
            createError ||
            !createdEmployee
          ) {
            throw (
              createError ||
              new Error(
                "Employee creation failed."
              )
            );
          }

          const employeeId =
            createdEmployee.id;

          await upsertEmploymentDetails(
            supabase,
            employeeId,
            mappedData,
            null
          );

          await writeTimelineEvent(
            supabase,
            organisationId,
            employeeId,
            "Employee created by import",
            `${mappedData.name} was added through the Employee Import Wizard.`,
            importId,
            "Created",
            user.id
          );

          result.created += 1;

          result.rowResults.push({
            rowNumber: row.rowNumber,
            name: mappedData.name,
            result: "Created",
            employeeId,
            message:
              "A new employee record was created.",
          });

          await saveImportRowResult(
            supabase,
            importId,
            row,
            mappedData,
            "created",
            employeeId
          );
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "The employee row could not be imported.";

        result.errors += 1;

        result.rowResults.push({
          rowNumber:
            Number.isInteger(row.rowNumber)
              ? row.rowNumber
              : 0,
          name: mappedData.name,
          result: "Error",
          employeeId: null,
          message,
        });

        await saveImportRowResult(
          supabase,
          importId,
          row,
          mappedData,
          "error",
          null,
          message
        );
      }
    }

    if (importId) {
      const { error: completionError } =
        await supabase
          .from("employee_imports")
          .update({
            status:
              result.errors > 0
                ? "completed_with_errors"
                : "completed",
            created_rows:
              result.created,
            updated_rows:
              result.updated,
            skipped_rows:
              result.skipped,
            error_rows: result.errors,
            completed_at:
              new Date().toISOString(),
          })
          .eq("id", importId)
          .eq(
            "organisation_id",
            organisationId
          );

      if (completionError) {
        throw completionError;
      }
    }

    await writeImportAuditEvent({
      supabase,
      request,
      user,
      organisationId,
      importId,
      fileName:
        cleanText(body.fileName, 255) ||
        "Employee import",
      importMode,
      rowCount: rows.length,
      result,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error(
      "Employee import API failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The employee import could not be completed.",
      },
      { status: 500 }
    );
  }
}

async function resolveMatchingEmployee(
  supabase: Awaited<
    ReturnType<typeof createClient>
  >,
  organisationId: string,
  requestedEmployeeId: number | null,
  email: string
): Promise<MatchingEmployee | null> {
  let employee:
    | {
        id: number;
        name: string;
        role: string | null;
        email: string | null;
        start_date: string | null;
        status: string | null;
      }
    | null = null;

  if (
    requestedEmployeeId &&
    Number.isInteger(
      requestedEmployeeId
    ) &&
    requestedEmployeeId > 0
  ) {
    const { data, error } =
      await supabase
        .from("employees")
        .select(
          "id,name,role,email,start_date,status"
        )
        .eq("id", requestedEmployeeId)
        .eq(
          "organisation_id",
          organisationId
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    employee = data;
  }

  if (!employee && email) {
    const { data, error } =
      await supabase
        .from("employees")
        .select(
          "id,name,role,email,start_date,status"
        )
        .eq(
          "organisation_id",
          organisationId
        )
        .ilike("email", email)
        .limit(1)
        .maybeSingle();

    if (error) {
      throw error;
    }

    employee = data;
  }

  if (!employee) {
    return null;
  }

  const { data: details, error } =
    await supabase
      .from(
        "employee_employment_details"
      )
      .select(
        "manager,probation_end_date,employment_end_date,reason_for_leaving,annual_leave_allowance"
      )
      .eq("employee_id", employee.id)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    ...employee,
    employmentDetails: details ?? null,
  };
}

async function upsertEmploymentDetails(
  supabase: Awaited<
    ReturnType<typeof createClient>
  >,
  employeeId: number,
  mappedData: MappedEmployeeRow,
  existingDetails: EmploymentDetails | null
) {
  const { error } = await supabase
    .from("employee_employment_details")
    .upsert(
      {
        employee_id: employeeId,
        manager:
          emptyToNull(
            mappedData.manager
          ) ??
          existingDetails?.manager ??
          null,
        probation_end_date:
          emptyToNull(
            mappedData.probation_end_date
          ) ??
          existingDetails?.probation_end_date ??
          null,
        employment_end_date:
          emptyToNull(
            mappedData.employment_end_date
          ) ??
          existingDetails?.employment_end_date ??
          null,
        reason_for_leaving:
          emptyToNull(
            mappedData.reason_for_leaving
          ) ??
          existingDetails?.reason_for_leaving ??
          null,
        annual_leave_allowance:
          emptyToNull(
            mappedData.annual_leave_allowance
          ) ??
          existingDetails?.annual_leave_allowance ??
          null,
        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict: "employee_id",
      }
    );

  if (error) {
    throw error;
  }
}

async function saveImportRowResult(
  supabase: Awaited<
    ReturnType<typeof createClient>
  >,
  importId: number | null,
  row: ImportRow,
  mappedData: MappedEmployeeRow,
  resultStatus: string,
  employeeId: number | null = null,
  additionalError?: string
) {
  if (!importId) {
    return;
  }

  const errors = Array.isArray(
    row.errors
  )
    ? row.errors
    : [];

  const warnings = Array.isArray(
    row.warnings
  )
    ? row.warnings
    : [];

  const { error } = await supabase
    .from("employee_import_rows")
    .insert({
      import_id: importId,
      row_number:
        Number.isInteger(row.rowNumber)
          ? row.rowNumber
          : 0,
      source_data:
        row.sourceData || {},
      mapped_data: mappedData,
      result_status: resultStatus,
      employee_id: employeeId,
      validation_errors:
        additionalError
          ? [...errors, additionalError]
          : errors,
      validation_warnings: warnings,
    });

  if (error) {
    console.warn(
      "Employee import row history was not saved:",
      error
    );
  }
}

async function writeTimelineEvent(
  supabase: Awaited<
    ReturnType<typeof createClient>
  >,
  organisationId: string,
  employeeId: number,
  title: string,
  description: string,
  importId: number | null,
  status: string,
  userId: string
) {
  const { error } = await supabase
    .from("employee_timeline")
    .insert({
      organisation_id: organisationId,
      employee_id: employeeId,
      event_type: "Employee Import",
      title,
      description,
      status,
      source_module: "Employees",
      source_record_id: importId
        ? String(importId)
        : null,
      metadata: {
        import_source:
          "Employee Import Wizard",
      },
      event_date:
        new Date().toISOString(),
      created_by: userId,
      created_at:
        new Date().toISOString(),
    });

  if (error) {
    console.warn(
      "Employee import timeline event was not saved:",
      error
    );
  }
}

async function writeImportAuditEvent({
  supabase,
  request,
  user,
  organisationId,
  importId,
  fileName,
  importMode,
  rowCount,
  result,
}: {
  supabase: Awaited<
    ReturnType<typeof createClient>
  >;
  request: Request;
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<
      string,
      unknown
    >;
  };
  organisationId: string;
  importId: number | null;
  fileName: string;
  importMode: ImportMode;
  rowCount: number;
  result: ImportResult;
}) {
  const userName =
    readString(
      user.user_metadata?.full_name
    ) ||
    readString(
      user.user_metadata?.name
    ) ||
    user.email ||
    "System user";

  const { error } = await supabase
    .from("audit_logs")
    .insert({
      organisation_id: organisationId,
      user_id: user.id,
      user_name: userName,
      user_email: user.email || null,
      action:
        "Employee import completed",
      action_category: "Employee",
      entity_type:
        "Employee Import",
      entity_id: importId
        ? String(importId)
        : null,
      entity_name: fileName,
      description: `${result.created} employee records were created, ${result.updated} were updated, ${result.skipped} were skipped and ${result.errors} contained errors.`,
      previous_values: null,
      new_values: {
        import_mode: importMode,
        total_rows: rowCount,
        created_rows:
          result.created,
        updated_rows:
          result.updated,
        skipped_rows:
          result.skipped,
        error_rows: result.errors,
      },
      metadata: {
        import_mode: importMode,
        total_rows: rowCount,
        created_rows:
          result.created,
        updated_rows:
          result.updated,
        skipped_rows:
          result.skipped,
        error_rows: result.errors,
        source_module: "Employees",
      },
      source_page:
        "/dashboard/employees",
      ip_address:
        request.headers
          .get("x-forwarded-for")
          ?.split(",")[0]
          ?.trim() || null,
      user_agent:
        request.headers.get(
          "user-agent"
        ),
      created_at:
        new Date().toISOString(),
    });

  if (error) {
    console.warn(
      "Employee import audit event was not saved:",
      error
    );
  }
}

function normaliseMappedData(
  value: MappedEmployeeRow
): MappedEmployeeRow {
  const source =
    value &&
    typeof value === "object"
      ? value
      : ({} as MappedEmployeeRow);

  return {
    name: cleanText(
      source.name,
      200
    ),
    role: cleanText(
      source.role,
      200
    ),
    email: cleanText(
      source.email,
      320
    ).toLowerCase(),
    start_date: cleanText(
      source.start_date,
      10
    ),
    status: cleanText(
      source.status,
      100
    ),
    manager: cleanText(
      source.manager,
      200
    ),
    probation_end_date:
      cleanText(
        source.probation_end_date,
        10
      ),
    employment_end_date:
      cleanText(
        source.employment_end_date,
        10
      ),
    reason_for_leaving:
      cleanText(
        source.reason_for_leaving,
        1000
      ),
    annual_leave_allowance:
      cleanText(
        source.annual_leave_allowance,
        100
      ),
  };
}

function validateMappedEmployee(
  value: MappedEmployeeRow
) {
  if (!value.name) {
    throw new Error(
      "Employee name is required."
    );
  }

  if (
    value.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value.email
    )
  ) {
    throw new Error(
      "The employee email address is not valid."
    );
  }

  for (const [
    label,
    dateValue,
  ] of [
    ["start date", value.start_date],
    [
      "probation end date",
      value.probation_end_date,
    ],
    [
      "employment end date",
      value.employment_end_date,
    ],
  ] as const) {
    if (
      dateValue &&
      !/^\d{4}-\d{2}-\d{2}$/.test(
        dateValue
      )
    ) {
      throw new Error(
        `The ${label} must use YYYY-MM-DD format.`
      );
    }
  }
}

function cleanText(
  value: unknown,
  maximumLength: number
): string {
  return typeof value === "string"
    ? value
        .trim()
        .slice(0, maximumLength)
    : "";
}

function emptyToNull(
  value: string
): string | null {
  const trimmed = value?.trim();

  return trimmed
    ? trimmed
    : null;
}

function normaliseEmployeeStatus(
  value: string | null
): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "";
  }

  const match = [
    "New Starter",
    "Active",
    "Leaving",
    "Former Employee",
    "Archived",
    "Suspended",
  ].find(
    (status) =>
      status.toLowerCase() ===
      trimmed.toLowerCase()
  );

  return match || trimmed;
}

function readString(
  value: unknown
): string {
  return typeof value === "string"
    ? value
    : "";
}

type AccessContext = {
  organisationId: string;
  role: string;
  permissionKeys: Set<string>;
};

async function requireAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  requiredPermissions: string[]
): Promise<
  | { ok: true; access: AccessContext }
  | { ok: false; response: NextResponse }
> {
  const { data: organisationId, error: organisationError } =
    await supabase.rpc("leo_current_organisation_id");

  if (
    organisationError ||
    typeof organisationId !== "string" ||
    !organisationId
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error:
            "Your active organisation could not be resolved.",
        },
        { status: 403 }
      ),
    };
  }

  const { data: membership, error: membershipError } =
    await supabase
      .from("organisation_memberships")
      .select(
        "id,role,membership_status,access_starts_at,access_ends_at"
      )
      .eq("organisation_id", organisationId)
      .eq("user_id", userId)
      .eq("membership_status", "active")
      .maybeSingle();

  if (membershipError || !membership) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error:
            "You do not have active access to this organisation.",
        },
        { status: 403 }
      ),
    };
  }

  const now = Date.now();
  const accessStartsAt = membership.access_starts_at
    ? new Date(membership.access_starts_at).getTime()
    : null;
  const accessEndsAt = membership.access_ends_at
    ? new Date(membership.access_ends_at).getTime()
    : null;

  if (
    (accessStartsAt !== null &&
      Number.isFinite(accessStartsAt) &&
      accessStartsAt > now) ||
    (accessEndsAt !== null &&
      Number.isFinite(accessEndsAt) &&
      accessEndsAt <= now)
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error:
            "Your organisation access is not currently active.",
        },
        { status: 403 }
      ),
    };
  }

  const role = membership.role || "";
  const permissionKeys = new Set<string>();

  if (role.toLowerCase() !== "owner") {
    const { data: permissions, error: permissionsError } =
      await supabase.rpc("leo_effective_permissions", {
        target_organisation_id: organisationId,
      });

    if (permissionsError) {
      console.error(
        "Employee permission lookup failed:",
        permissionsError
      );

      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            error:
              "Your employee permissions could not be verified.",
          },
          { status: 403 }
        ),
      };
    }

    for (const permission of permissions ?? []) {
      if (
        permission &&
        typeof permission.permission_key === "string"
      ) {
        permissionKeys.add(permission.permission_key);
      }
    }

    const missingPermission = requiredPermissions.find(
      (permission) => !permissionKeys.has(permission)
    );

    if (missingPermission) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            error:
              "You do not have permission to perform this employee action.",
          },
          { status: 403 }
        ),
      };
    }
  }

  return {
    ok: true,
    access: {
      organisationId,
      role,
      permissionKeys,
    },
  };
}