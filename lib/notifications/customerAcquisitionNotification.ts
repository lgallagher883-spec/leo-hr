import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const NOTIFICATION_RECIPIENT = "leohr010126@gmail.com";
const NOTIFICATION_SENDER_EMAIL = "office@leohr.co.uk";
const NOTIFICATION_SENDER_NAME = "LEO Platform Alerts";

export type CustomerAcquisitionEvent =
  | "trial_started"
  | "paid_direct"
  | "trial_converted";

type NotificationInput = {
  event: CustomerAcquisitionEvent;
  organisationId: string;
  userId?: string | null;
  planKey?: string | null;
  employeeCapacity?: number | null;
  trialStartsAt?: string | null;
  trialEndsAt?: string | null;
  subscriptionStartsAt?: string | null;
  subscriptionEndsAt?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
};

type OrganisationRow = {
  id: string;
  name: string | null;
  website_url: string | null;
  employee_count_band: string | null;
  created_at: string | null;
};

type MembershipRow = {
  user_id: string;
  role: string | null;
  is_primary_organisation: boolean | null;
  is_default_organisation: boolean | null;
  created_at: string | null;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function displayValue(value: unknown, fallback = "Not available") {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  return String(value);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not applicable";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(parsed);
}

function planDetails(planKey: string | null | undefined) {
  switch (planKey) {
    case "organisation_50":
      return {
        label: "Up to 50 Employees",
        price: "£75 per month",
      };
    case "organisation_150":
      return {
        label: "Up to 150 Employees",
        price: "£125 per month",
      };
    case "organisation_250":
      return {
        label: "Up to 250 Employees",
        price: "£175 per month",
      };
    default:
      return {
        label: planKey || "Plan not available",
        price: "Not available",
      };
  }
}

function eventDetails(event: CustomerAcquisitionEvent) {
  switch (event) {
    case "trial_started":
      return {
        subjectPrefix: "New LEO Free Trial",
        heading: "New free trial started",
        journey: "Free 7 Day Trial",
      };
    case "paid_direct":
      return {
        subjectPrefix: "New LEO Paid Subscription — Direct",
        heading: "New direct paid subscription",
        journey: "Direct to paid subscription",
      };
    case "trial_converted":
      return {
        subjectPrefix: "LEO Trial Converted to Paid",
        heading: "Free trial converted to paid",
        journey: "Trial → Paid",
      };
  }
}

async function resolveNotificationUserId(
  organisationId: string,
  suppliedUserId?: string | null,
) {
  if (suppliedUserId) {
    return suppliedUserId;
  }

  const admin = createAdminClient();

  const { data: memberships } = await admin
    .from("organisation_memberships")
    .select(
      "user_id, role, is_primary_organisation, is_default_organisation, created_at",
    )
    .eq("organisation_id", organisationId)
    .in("membership_status", ["active", "accepted"])
    .order("is_primary_organisation", { ascending: false })
    .order("is_default_organisation", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(20);

  const rows = (memberships ?? []) as MembershipRow[];

  const owner =
    rows.find((membership) => membership.role?.toLowerCase() === "owner") ??
    rows[0] ??
    null;

  return owner?.user_id ?? null;
}

async function loadCustomerContext(
  organisationId: string,
  suppliedUserId?: string | null,
) {
  const admin = createAdminClient();

  const [{ data: organisation }, resolvedUserId] = await Promise.all([
    admin
      .from("organisations")
      .select("id, name, website_url, employee_count_band, created_at")
      .eq("id", organisationId)
      .maybeSingle(),
    resolveNotificationUserId(organisationId, suppliedUserId),
  ]);

  let authUser:
    | {
        id: string;
        email?: string | null;
        created_at?: string | null;
        user_metadata?: Record<string, unknown>;
      }
    | null = null;

  if (resolvedUserId) {
    const { data, error } = await admin.auth.admin.getUserById(resolvedUserId);

    if (error) {
      console.error(
        "LEO signup notification could not load the Auth user:",
        error,
      );
    } else if (data.user) {
      authUser = {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
        user_metadata:
          data.user.user_metadata &&
          typeof data.user.user_metadata === "object" &&
          !Array.isArray(data.user.user_metadata)
            ? (data.user.user_metadata as Record<string, unknown>)
            : {},
      };
    }
  }

  return {
    organisation: (organisation as OrganisationRow | null) ?? null,
    authUser,
  };
}

function environmentLabel() {
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV;
  }

  return process.env.NODE_ENV ?? "unknown";
}

export async function sendCustomerAcquisitionNotification(
  input: NotificationInput,
) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.error(
      "LEO signup notification was skipped because BREVO_API_KEY is missing.",
    );
    return false;
  }

  try {
    const { organisation, authUser } = await loadCustomerContext(
      input.organisationId,
      input.userId,
    );

    const metadata = authUser?.user_metadata ?? {};
    const firstName = displayValue(metadata.first_name, "");
    const lastName = displayValue(metadata.last_name, "");
    const fullName = `${firstName} ${lastName}`.trim() || "Not available";
    const organisationName =
      displayValue(organisation?.name, "Unknown organisation");
    const website = displayValue(organisation?.website_url);
    const employeeBand = displayValue(organisation?.employee_count_band);
    const email = displayValue(authUser?.email);
    const authUserId = displayValue(authUser?.id);
    const accountCreatedAt = formatDateTime(
      authUser?.created_at ?? organisation?.created_at ?? null,
    );

    const event = eventDetails(input.event);
    const plan =
      input.event === "trial_started"
        ? {
            label: "Free 7 Day Trial",
            price: "Free",
          }
        : planDetails(input.planKey);

    const subject = `${event.subjectPrefix} — ${organisationName}`;

    const rows: Array<[string, string]> = [
      ["Customer journey", event.journey],
      ["Organisation", organisationName],
      ["Contact", fullName],
      ["Email", email],
      ["Website", website],
      ["Employee band", employeeBand],
      ["Plan", plan.label],
      ["Price", plan.price],
      [
        "Employee capacity",
        input.employeeCapacity
          ? `Up to ${input.employeeCapacity} employees`
          : "Not applicable",
      ],
      ["Auth user ID", authUserId],
      ["Organisation ID", input.organisationId],
      ["Account created", accountCreatedAt],
    ];

    if (input.event === "trial_started") {
      rows.push(
        ["Trial starts", formatDateTime(input.trialStartsAt)],
        ["Trial ends", formatDateTime(input.trialEndsAt)],
      );
    } else {
      rows.push(
        ["Subscription starts", formatDateTime(input.subscriptionStartsAt)],
        ["Current period ends", formatDateTime(input.subscriptionEndsAt)],
        [
          "Stripe customer",
          displayValue(input.stripeCustomerId),
        ],
        [
          "Stripe subscription",
          displayValue(input.stripeSubscriptionId),
        ],
      );
    }

    rows.push(["Environment", environmentLabel()]);

    const htmlRows = rows
      .map(
        ([label, value]) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #ece7f1;font-weight:600;vertical-align:top;width:190px;">
              ${escapeHtml(label)}
            </td>
            <td style="padding:8px 12px;border-bottom:1px solid #ece7f1;vertical-align:top;">
              ${escapeHtml(value)}
            </td>
          </tr>`,
      )
      .join("");

    const htmlContent = `
      <html>
        <body style="margin:0;padding:0;background:#f7f1fc;font-family:Arial,sans-serif;color:#172036;">
          <div style="max-width:720px;margin:0 auto;padding:28px 18px;">
            <div style="background:#ffffff;border:1px solid #e5dcec;border-radius:14px;overflow:hidden;">
              <div style="background:#6E5084;color:#ffffff;padding:20px 24px;">
                <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.85;">LEO HR</div>
                <h1 style="font-size:22px;line-height:1.3;margin:6px 0 0;">${escapeHtml(event.heading)}</h1>
              </div>
              <div style="padding:22px 24px;">
                <p style="margin:0 0 18px;line-height:1.55;">
                  A customer acquisition event has been recorded in LEO. The details available at the time of the event are below.
                </p>
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  ${htmlRows}
                </table>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: NOTIFICATION_SENDER_NAME,
          email: NOTIFICATION_SENDER_EMAIL,
        },
        to: [
          {
            email: NOTIFICATION_RECIPIENT,
            name: "Lindsay Gallagher",
          },
        ],
        subject,
        htmlContent,
        tags: ["leo-customer-acquisition", input.event],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(
        `LEO signup notification failed with Brevo status ${response.status}:`,
        detail,
      );
      return false;
    }

    return true;
  } catch (error) {
    /*
     * Internal founder notifications must never block account creation,
     * trial activation, Stripe webhook processing or customer access.
     */
    console.error("LEO signup notification failed:", error);
    return false;
  }
}