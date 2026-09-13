import { createAdminClient } from "@/lib/supabase/admin";

type AccessKind = "free_trial" | "paid_subscription";

type AdminAlertInput = {
  organisationId: string;
  accessKind: AccessKind;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  planKey?: string | null;
  employeeCapacity?: number | null;
  activatedAt?: string | null;
  providerReference?: string | null;
};

type OrganisationRow = {
  name: string | null;
  website_url: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function displayPlan(planKey: string | null | undefined, capacity: number | null | undefined) {
  if (capacity && capacity > 0) {
    return `Up to ${capacity} employees`;
  }

  switch (planKey) {
    case "organisation_50":
      return "Up to 50 employees";
    case "organisation_150":
      return "Up to 150 employees";
    case "organisation_250":
      return "Up to 250 employees";
    default:
      return planKey || "Not recorded";
  }
}

function formatDate(value: string | null | undefined) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/London",
    });
  }

  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  });
}

async function resolveRegistrant(input: AdminAlertInput) {
  if (input.userEmail || input.userName) {
    return {
      email: input.userEmail ?? "Not recorded",
      name: input.userName ?? "Not recorded",
    };
  }

  if (!input.userId) {
    return {
      email: "Not recorded",
      name: "Not recorded",
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(input.userId);

  if (error || !data.user) {
    console.warn("Leo registration alert could not load the registrant:", error);
    return {
      email: "Not recorded",
      name: "Not recorded",
    };
  }

  const firstName =
    typeof data.user.user_metadata?.first_name === "string"
      ? data.user.user_metadata.first_name.trim()
      : "";
  const lastName =
    typeof data.user.user_metadata?.last_name === "string"
      ? data.user.user_metadata.last_name.trim()
      : "";
  const name = [firstName, lastName].filter(Boolean).join(" ");

  return {
    email: data.user.email ?? "Not recorded",
    name: name || "Not recorded",
  };
}

export async function sendNewAccessAdminAlert(input: AdminAlertInput) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.error(
      "New Leo HR access alert was not sent because BREVO_API_KEY is not configured.",
    );
    return { sent: false as const, reason: "missing_brevo_api_key" as const };
  }

  const admin = createAdminClient();
  const { data: organisation, error: organisationError } = await admin
    .from("organisations")
    .select("name, website_url")
    .eq("id", input.organisationId)
    .maybeSingle();

  if (organisationError) {
    console.warn(
      "Leo registration alert could not load organisation details:",
      organisationError,
    );
  }

  const org = (organisation as OrganisationRow | null) ?? {
    name: null,
    website_url: null,
  };
  const registrant = await resolveRegistrant(input);

  const isPaid = input.accessKind === "paid_subscription";
  const accessLabel = isPaid ? "Paid Subscription" : "7-Day Free Trial";
  const subject = isPaid
    ? `New Leo HR Paid Subscription: ${org.name || registrant.email}`
    : `New Leo HR Free Trial: ${org.name || registrant.email}`;

  const rows = [
    ["Access", accessLabel],
    ["Organisation", org.name || "Not recorded"],
    ["Registrant", registrant.name],
    ["Email", registrant.email],
    ["Website", org.website_url || "Not recorded"],
    ["Plan", isPaid ? displayPlan(input.planKey, input.employeeCapacity) : "7-day free trial"],
    ["Activated", formatDate(input.activatedAt)],
  ];

  if (input.providerReference) {
    rows.push(["Reference", input.providerReference]);
  }

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:9px 12px;border-bottom:1px solid #eadff0;font-weight:700;color:#6e5084;width:150px">${escapeHtml(label)}</td><td style="padding:9px 12px;border-bottom:1px solid #eadff0;color:#4b3a58">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const htmlContent = `<!doctype html>
<html>
<body style="margin:0;background:#f5fff9;font-family:Arial,Helvetica,sans-serif;color:#4b3a58">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr><td align="center" style="padding:24px 12px">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="padding:26px 32px;background:#f7f1fc">
<div style="font-size:13px;font-weight:700;color:#6e5084;letter-spacing:.6px">Leo HR</div>
<h1 style="margin:8px 0 0;color:#6e5084;font-size:26px">${escapeHtml(accessLabel)}</h1>
<p style="margin:10px 0 0;font-size:15px;line-height:1.5">A new customer access event has been completed in Leo HR.</p>
</td></tr>
<tr><td style="padding:24px 32px">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #eadff0;border-radius:10px;overflow:hidden">
${htmlRows}
</table>
<p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#6b6570">This is an internal Leo HR business notification. No action is required unless you want to follow up with the customer.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const recipient =
    process.env.LEO_NEW_SUBSCRIPTION_ALERT_TO?.trim() || "office@leohr.co.uk";

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "Leo HR",
        email: process.env.LEO_EMAIL_FROM?.trim() || "office@leohr.co.uk",
      },
      to: [{ email: recipient, name: "Leo HR" }],
      replyTo: {
        email: "office@leohr.co.uk",
        name: "Leo HR",
      },
      subject,
      htmlContent,
      tags: ["leo-admin-access-alert"],
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    console.error(
      "Brevo rejected the Leo HR registration alert:",
      response.status,
      responseText,
    );
    return {
      sent: false as const,
      reason: "brevo_rejected" as const,
      status: response.status,
    };
  }

  return { sent: true as const };
}
