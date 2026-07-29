import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

export const SAR_ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
  "text/rtf",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const SAR_MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024;

export type SarAccessContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  organisationId: string;
};

export function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function optionalText(value: unknown): string | null {
  const trimmed = readText(value);
  return trimmed || null;
}

export function safeFileName(fileName: string): string {
  return (
    fileName
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "document"
  );
}

export function parseInteger(value: unknown): number | null {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function calculateInitialDeadline(receivedDate: string): string | null {
  const parts = receivedDate.split("-").map(Number);

  if (parts.length !== 3) {
    return null;
  }

  const [year, month, day] = parts;

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  const targetMonthIndex = month;
  const lastDayOfTargetMonth = new Date(year, targetMonthIndex + 1, 0).getDate();
  const targetDay = Math.min(day, lastDayOfTargetMonth);
  const deadline = new Date(year, targetMonthIndex, targetDay);

  return [
    deadline.getFullYear(),
    String(deadline.getMonth() + 1).padStart(2, "0"),
    String(deadline.getDate()).padStart(2, "0"),
  ].join("-");
}

export async function requireSarAccess(
  requiredPermission = "sar_requests.view",
): Promise<
  | { ok: true; context: SarAccessContext }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "You must be signed in to access SAR requests.",
        },
        { status: 401 },
      ),
    };
  }

  const resolvedRole = await resolveAuthoritativeUserRole(supabase as any, {
    userId: user.id,
    allowedStatuses: ["active", "accepted"],
  });

  if (!resolvedRole?.membership.organisation_id) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 },
      ),
    };
  }

  const organisationId = resolvedRole.membership.organisation_id;

  if (resolvedRole.roleKey !== "owner") {
    const { data: allowed, error: permissionError } = await (supabase as any).rpc(
      "leo_has_permission",
      {
        target_organisation_id: organisationId,
        target_permission_key: requiredPermission,
        target_user_id: user.id,
      },
    );

    if (permissionError) {
      console.error("SAR permission lookup failed:", permissionError);

      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            error: "Your SAR permissions could not be verified.",
          },
          { status: 500 },
        ),
      };
    }

    if (!allowed) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            error: "You do not have permission to perform this SAR action.",
          },
          { status: 403 },
        ),
      };
    }
  }

  return {
    ok: true,
    context: {
      supabase,
      userId: user.id,
      organisationId,
    },
  };
}

export async function employeeBelongsToOrganisation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organisationId: string,
  employeeId: number,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  return !error && Boolean(data);
}

export async function matterBelongsToOrganisation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organisationId: string,
  matterId: number,
): Promise<boolean> {
  const { data: matter, error: matterError } = await supabase
    .from("matters")
    .select("id,employee_id")
    .eq("id", matterId)
    .maybeSingle();

  if (matterError || !matter || !matter.employee_id) {
    return false;
  }

  return employeeBelongsToOrganisation(
    supabase,
    organisationId,
    Number(matter.employee_id),
  );
}

export async function sarBelongsToOrganisation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organisationId: string,
  sarId: number,
): Promise<boolean> {
  const { data: sar, error: sarError } = await supabase
    .from("employee_sars")
    .select("id,employee_id")
    .eq("id", sarId)
    .maybeSingle();

  if (sarError || !sar) {
    return false;
  }

  return employeeBelongsToOrganisation(
    supabase,
    organisationId,
    Number(sar.employee_id),
  );
}

export async function assertSarOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organisationId: string,
  sarId: number,
): Promise<
  | { ok: true }
  | { ok: false; response: NextResponse }
> {
  const belongs = await sarBelongsToOrganisation(
    supabase,
    organisationId,
    sarId,
  );

  if (!belongs) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "The SAR request could not be found.",
        },
        { status: 404 },
      ),
    };
  }

  return { ok: true };
}

export async function insertSarTimelineEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    sarId: number;
    eventType: string;
    title: string;
    description?: string | null;
    createdBy?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from("employee_sar_timeline")
    .insert({
      sar_id: input.sarId,
      event_type: input.eventType,
      title: input.title,
      description: optionalText(input.description),
      created_by: optionalText(input.createdBy) || "User",
    });

  if (error) {
    throw new Error(error.message || "The SAR timeline could not be updated.");
  }
}

export function validateSarUploadFile(file: File): string | null {
  if (file.size <= 0) {
    return "Choose a file to upload.";
  }

  if (file.size > SAR_MAX_UPLOAD_SIZE_BYTES) {
    return "Files must be 15 MB or smaller.";
  }

  if (!file.type || !SAR_ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) {
    return "The selected file type is not supported.";
  }

  return null;
}
