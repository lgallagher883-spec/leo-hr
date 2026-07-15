import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type AuditCategory =
  | "General"
  | "Employee"
  | "Matter"
  | "Compliance"
  | "HR Resource"
  | "SAR"
  | "Learning"
  | "Talent"
  | "Foundation"
  | "Document"
  | "Security"
  | "System";

export type AuditLogInput = {
  action: string;
  actionCategory: AuditCategory;

  entityType?: string | null;
  entityId?: string | number | null;
  entityName?: string | null;

  description?: string | null;

  previousValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;

  sourcePage?: string | null;

  organisationId?: string | null;

  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
};

export async function recordAuditLog(
  input: AuditLogInput
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userMetadata =
      user?.user_metadata || {};

    const { error } = await supabase
      .from("audit_logs")
      .insert({
        organisation_id:
          input.organisationId || null,

        user_id:
          input.userId ||
          user?.id ||
          null,

        user_name:
          input.userName ||
          getUserDisplayName(
            userMetadata
          ) ||
          null,

        user_email:
          input.userEmail ||
          user?.email ||
          null,

        action: input.action,

        action_category:
          input.actionCategory,

        entity_type:
          input.entityType || null,

        entity_id:
          input.entityId !== undefined &&
          input.entityId !== null
            ? String(input.entityId)
            : null,

        entity_name:
          input.entityName || null,

        description:
          input.description || null,

        previous_values:
          input.previousValues || null,

        new_values:
          input.newValues || null,

        metadata:
          input.metadata || null,

        source_page:
          input.sourcePage ||
          getCurrentPage(),

        user_agent:
          getUserAgent(),
      });

    if (error) {
      console.error(
        "Audit log could not be recorded:",
        error
      );
    }
  } catch (error) {
    console.error(
      "Unexpected audit logging error:",
      error
    );
  }
}

function getCurrentPage(): string | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  return window.location.pathname;
}

function getUserAgent(): string | null {
  if (
    typeof navigator === "undefined"
  ) {
    return null;
  }

  return navigator.userAgent;
}

function getUserDisplayName(
  metadata: Record<string, unknown>
): string | null {
  const possibleNames = [
    metadata.full_name,
    metadata.name,
    metadata.display_name,
  ];

  const matchedName =
    possibleNames.find(
      (value) =>
        typeof value === "string" &&
        value.trim().length > 0
    );

  return typeof matchedName ===
    "string"
    ? matchedName
    : null;
}