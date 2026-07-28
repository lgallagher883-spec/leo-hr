import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type AccessContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  organisationId: string;
  userId: string;
};

type MutationFilter = {
  operator: "eq" | "in";
  column: string;
  value: unknown;
};

type MutationRequest = {
  mutation?: {
    table?: unknown;
    operation?: unknown;
    values?: unknown;
    filters?: unknown;
    select?: unknown;
    single?: unknown;
  };
};

const tablePermissions: Record<string, string> = {
  learning_ai_projects: "learning.manage",
  learning_ai_messages: "learning.manage",
  learning_ai_outputs: "learning.manage",
  learning_ai_reviews: "learning.manage",
  learning_ai_source_files: "learning.manage",
  learning_ai_activity_history: "learning.manage",
  learning_ai_intelligence: "learning.manage",
  learning_modules: "learning.manage",
  learning_module_sections: "learning.manage",
  development_pathways: "learning.manage",
  learning_ai_external_exports: "learning.manage",
  connection_jobs: "learning.manage",
};

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

function readFilters(value: unknown): MutationFilter[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const raw = item as Record<string, unknown>;
      const operator = raw.operator;
      const column = readText(raw.column);

      if ((operator !== "eq" && operator !== "in") || !column) {
        return null;
      }

      return {
        operator,
        column,
        value: raw.value,
      } as MutationFilter;
    })
    .filter((item): item is MutationFilter => Boolean(item));
}

async function requireAuthorisedContext(
  permissionKey: string,
): Promise<
  | { ok: true; context: AccessContext }
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
          error: "You are not signed in.",
        },
        { status: 401 },
      ),
    };
  }

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
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 },
      ),
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organisation_memberships")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("user_id", user.id)
    .in("membership_status", ["active", "accepted"])
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "You do not have active access to this organisation.",
        },
        { status: 403 },
      ),
    };
  }

  const { data: allowed, error: permissionError } = await (supabase as any).rpc(
    "leo_has_permission",
    {
      target_organisation_id: organisationId,
      target_permission_key: permissionKey,
      target_user_id: user.id,
    },
  );

  if (permissionError) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Your Leo Learn permission could not be verified.",
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
          error: "You do not have permission to perform this Leo Learn action.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    context: {
      supabase,
      organisationId,
      userId: user.id,
    },
  };
}

function applyOrganisationAndActorGuards(
  table: string,
  values: unknown,
  organisationId: string,
  userId: string,
): unknown {
  const patchRecord = (record: unknown) => {
    if (!record || typeof record !== "object") {
      return record;
    }

    const next = { ...(record as Record<string, unknown>) };

    if (Object.prototype.hasOwnProperty.call(next, "organisation_id")) {
      next.organisation_id = organisationId;
    }

    if (Object.prototype.hasOwnProperty.call(next, "created_by")) {
      next.created_by = userId;
    }

    if (Object.prototype.hasOwnProperty.call(next, "updated_by")) {
      next.updated_by = userId;
    }

    return next;
  };

  if (Array.isArray(values)) {
    return values.map((item) => patchRecord(item));
  }

  if (table === "learning_ai_projects" && values && typeof values === "object") {
    const next = patchRecord(values) as Record<string, unknown>;

    if (!Object.prototype.hasOwnProperty.call(next, "status")) {
      next.status = "Draft";
    }

    return next;
  }

  return patchRecord(values);
}

function applyFilters(query: any, filters: MutationFilter[]) {
  let current = query;

  for (const filter of filters) {
    if (filter.operator === "eq") {
      current = current.eq(filter.column, filter.value as any);
      continue;
    }

    if (filter.operator === "in" && Array.isArray(filter.value)) {
      current = current.in(filter.column, filter.value as any);
    }
  }

  return current;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as MutationRequest | null;
    const mutation = body?.mutation;

    const table = readText(mutation?.table);
    const operation = readText(mutation?.operation);

    if (!table || !tablePermissions[table]) {
      return NextResponse.json(
        {
          success: false,
          error: "This AI Studio table is not available through the protected API.",
        },
        { status: 400 },
      );
    }

    if (operation !== "insert" && operation !== "update") {
      return NextResponse.json(
        {
          success: false,
          error: "Only AI Studio insert and update mutations are supported.",
        },
        { status: 400 },
      );
    }

    const access = await requireAuthorisedContext(tablePermissions[table]);

    if (!access.ok) {
      return access.response;
    }

    const { supabase, organisationId, userId } = access.context;
    const filters = readFilters(mutation?.filters);
    const selectColumns = readText(mutation?.select) || "*";
    const single = readBoolean(mutation?.single);

    const guardedValues = applyOrganisationAndActorGuards(
      table,
      mutation?.values ?? {},
      organisationId,
      userId,
    );

    if (operation === "insert") {
      const command = (supabase as any)
        .from(table)
        .insert(guardedValues)
        .select(selectColumns);

      const result = single ? await command.single() : await command;

      if (result.error) {
        return NextResponse.json(
          {
            success: false,
            error: result.error.message || "The AI Studio insert could not be saved.",
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data ?? null,
      });
    }

    const updateCommand = applyFilters(
      (supabase as any).from(table).update(guardedValues),
      filters,
    ).select(selectColumns);

    const updateResult = single ? await updateCommand.single() : await updateCommand;

    if (updateResult.error) {
      return NextResponse.json(
        {
          success: false,
          error: updateResult.error.message || "The AI Studio update could not be saved.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: updateResult.data ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The AI Studio request could not be processed.",
      },
      { status: 500 },
    );
  }
}
