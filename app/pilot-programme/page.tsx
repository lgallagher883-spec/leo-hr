import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Download,
  ExternalLink,
  Flag,
  Link2,
  Mail,
  Plus,
  Settings2,
  Sparkles,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type PilotInvitationRow = {
  id: string;
  reference: string | null;
  organisation_name: string;
  contact_name: string | null;
  invited_email: string;
  status: string;
  invitation_expires_at: string;
  pilot_duration_months: number;
  employee_profile_limit: number;
  pilot_starts_at: string | null;
  pilot_ends_at: string | null;
  used_at: string | null;
  created_organisation_id: string | null;
  cancelled_at: string | null;
  opened_at: string | null;
  last_sent_at: string | null;
  send_count: number;
  converted_at: string | null;
  created_at: string;
};

type StatusTone = {
  background: string;
  border: string;
  colour: string;
  label: string;
};

function normaliseStatus(value: string | null | undefined) {
  return value?.trim().toLowerCase() || "pending";
}

function getStatusTone(value: string): StatusTone {
  const status = normaliseStatus(value);

  if (status === "converted") {
    return {
      background: "#EEFDF5",
      border: "#BCE8D0",
      colour: "#236B45",
      label: "Converted",
    };
  }

  if (status === "active" || status === "accepted" || status === "registered") {
    return {
      background: "#F0F9FF",
      border: "#BFDBFE",
      colour: "#1D4F91",
      label:
        status === "active"
          ? "Active"
          : status === "registered"
            ? "Registered"
            : "Accepted",
    };
  }

  if (status === "expired") {
    return {
      background: "#FFF7ED",
      border: "#FED7AA",
      colour: "#9A4B0F",
      label: "Expired",
    };
  }

  if (status === "cancelled" || status === "revoked") {
    return {
      background: "#FFF1F2",
      border: "#FECDD3",
      colour: "#9F1239",
      label: status === "revoked" ? "Revoked" : "Cancelled",
    };
  }

  return {
    background: "#F7F1FC",
    border: "#E5D5F0",
    colour: "#6E5084",
    label: "Pending",
  };
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function daysUntil(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const difference = date.getTime() - Date.now();

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

function isActivePilot(invitation: PilotInvitationRow) {
  const status = normaliseStatus(invitation.status);

  return (
    status === "active" ||
    status === "accepted" ||
    status === "registered" ||
    Boolean(invitation.pilot_starts_at)
  );
}

function isConverted(invitation: PilotInvitationRow) {
  return (
    normaliseStatus(invitation.status) === "converted" ||
    Boolean(invitation.converted_at)
  );
}

function isPending(invitation: PilotInvitationRow) {
  return normaliseStatus(invitation.status) === "pending";
}

function isExpiringSoon(invitation: PilotInvitationRow) {
  if (!isActivePilot(invitation) || isConverted(invitation)) {
    return false;
  }

  const remaining = daysUntil(invitation.pilot_ends_at);

  return remaining !== null && remaining >= 0 && remaining <= 30;
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof Flag;
}) {
  return (
    <article
      style={{
        minHeight: "142px",
        padding: "18px",
        borderRadius: "16px",
        background: "#FFFFFF",
        border: "1px solid #E8E2EB",
        boxShadow: "0 8px 20px rgba(47, 38, 53, 0.04)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "12px",
          background: "#F0DFFD",
          color: "#6E5084",
        }}
      >
        <Icon size={20} strokeWidth={1.8} aria-hidden />
      </div>

      <div
        style={{
          marginTop: "14px",
          color: "#2F2635",
          fontSize: "28px",
          lineHeight: 1,
          fontWeight: 780,
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: "7px",
          color: "#44384B",
          fontSize: "14px",
          fontWeight: 720,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: "4px",
          color: "#7B7181",
          fontSize: "12px",
          lineHeight: 1.5,
        }}
      >
        {detail}
      </div>
    </article>
  );
}

export default async function PilotProgrammePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  if (user.email?.trim().toLowerCase() !== "office@leohr.co.uk") {
    redirect("/dashboard");
  }


  const { data, error } = await (supabase as any)
    .from("pilot_invitations")
    .select(
      `
        id,
        reference,
        organisation_name,
        contact_name,
        invited_email,
        status,
        invitation_expires_at,
        pilot_duration_months,
        employee_profile_limit,
        pilot_starts_at,
        pilot_ends_at,
        used_at,
        created_organisation_id,
        cancelled_at,
        opened_at,
        last_sent_at,
        send_count,
        converted_at,
        created_at
      `,
    )
    .order("created_at", { ascending: false });

  const invitations = (data ?? []) as PilotInvitationRow[];

  const pendingCount = invitations.filter(isPending).length;
  const activeCount = invitations.filter(
    (invitation) =>
      isActivePilot(invitation) && !isConverted(invitation),
  ).length;
  const expiringCount = invitations.filter(isExpiringSoon).length;
  const convertedCount = invitations.filter(isConverted).length;

  const activePilots = invitations.filter(
    (invitation) =>
      isActivePilot(invitation) && !isConverted(invitation),
  );

  const recentInvitations = invitations.slice(0, 8);

  const notOpenedCount = invitations.filter(
    (invitation) => isPending(invitation) && !invitation.opened_at,
  ).length;

  const registrationOutstandingCount = invitations.filter(
    (invitation) =>
      isPending(invitation) &&
      Boolean(invitation.opened_at) &&
      !invitation.used_at,
  ).length;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        maxWidth: "1440px",
        margin: "0 auto",
        padding: "32px",
        boxSizing: "border-box",
        background: "#F5FFF9",
        fontFamily:
          '"Segoe UI", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "14px",
          color: "#6E5084",
          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        <Link
          href="/pilot-programme"
          style={{
            color: "#6E5084",
            textDecoration: "none",
          }}
        >
          Platform Administration
        </Link>
        <span aria-hidden>/</span>
        <span style={{ color: "#7B7181" }}>Pilot Programme</span>
      </div>

      <section
        style={{
          padding: "26px 28px",
          borderRadius: "18px",
          background:
            "linear-gradient(135deg, #FFFFFF 0%, #F7F1FC 62%, #F5FFF9 100%)",
          border: "1px solid #E8E2EB",
          boxShadow: "0 12px 30px rgba(47, 38, 53, 0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "22px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: "760px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
                padding: "7px 11px",
                borderRadius: "999px",
                background: "#F0DFFD",
                color: "#6E5084",
                fontSize: "12px",
                fontWeight: 750,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              <Flag size={15} strokeWidth={1.9} aria-hidden />
              Internal programme management
            </div>

            <h1
              style={{
                margin: 0,
                color: "#2F2635",
                fontSize: "30px",
                lineHeight: 1.2,
                fontWeight: 780,
                letterSpacing: "-0.03em",
              }}
            >
              Pilot Programme
            </h1>

            <p
              style={{
                margin: "10px 0 0",
                maxWidth: "720px",
                color: "#675D6D",
                fontSize: "15px",
                lineHeight: 1.7,
              }}
            >
              Invite organisations, track secure registration links and manage
              the full pilot lifecycle through to paid conversion.
            </p>
          </div>

          <Link
            href="/pilot-programme/invite"
            style={{
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "9px",
              padding: "10px 16px",
              borderRadius: "11px",
              background: "#6E5084",
              border: "1px solid #6E5084",
              color: "#FFFFFF",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 750,
              boxShadow: "0 8px 18px rgba(110, 80, 132, 0.2)",
            }}
          >
            <Plus size={18} strokeWidth={2} aria-hidden />
            Invite organisation
          </Link>
        </div>
      </section>

      {error ? (
        <section
          role="alert"
          style={{
            marginTop: "20px",
            padding: "16px 18px",
            borderRadius: "14px",
            background: "#FFF7F7",
            border: "1px solid #F3CACA",
            color: "#8A3030",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}
          >
            <CircleAlert size={19} strokeWidth={1.9} aria-hidden />
            <div>
              <div style={{ fontSize: "14px", fontWeight: 750 }}>
                Pilot data could not be loaded
              </div>
              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "13px",
                  lineHeight: 1.55,
                }}
              >
                LEO could not read the pilot invitation register. No data has
                been changed.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section
        aria-label="Pilot programme statistics"
        style={{
          marginTop: "20px",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
          gap: "14px",
        }}
      >
        <StatCard
          label="Pilot invitations"
          value={pendingCount}
          detail="Awaiting registration or acceptance"
          icon={Mail}
        />
        <StatCard
          label="Active pilots"
          value={activeCount}
          detail="Organisations currently in the programme"
          icon={Building2}
        />
        <StatCard
          label="Expiring soon"
          value={expiringCount}
          detail="Pilot periods ending within 30 days"
          icon={CalendarClock}
        />
        <StatCard
          label="Converted customers"
          value={convertedCount}
          detail="Pilots successfully moved to paid plans"
          icon={CheckCircle2}
        />
      </section>

      <section
        style={{
          marginTop: "20px",
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.55fr) minmax(280px, 0.75fr)",
          gap: "16px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            minWidth: 0,
            borderRadius: "16px",
            background: "#FFFFFF",
            border: "1px solid #E8E2EB",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
              borderBottom: "1px solid #EEE9F0",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#2F2635",
                  fontSize: "17px",
                  fontWeight: 760,
                  letterSpacing: "-0.015em",
                }}
              >
                Active pilot register
              </h2>
              <p
                style={{
                  margin: "5px 0 0",
                  color: "#7B7181",
                  fontSize: "12px",
                  lineHeight: 1.5,
                }}
              >
                Current organisations and their programme end dates.
              </p>
            </div>

            <Link
              href="/pilot-programme/active"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "#6E5084",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 720,
              }}
            >
              View all
              <ArrowRight size={15} strokeWidth={1.9} aria-hidden />
            </Link>
          </div>

          {activePilots.length === 0 ? (
            <div
              style={{
                padding: "42px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  margin: "0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "14px",
                  background: "#F7F1FC",
                  color: "#6E5084",
                }}
              >
                <Building2 size={23} strokeWidth={1.8} aria-hidden />
              </div>

              <h3
                style={{
                  margin: "14px 0 0",
                  color: "#2F2635",
                  fontSize: "15px",
                  fontWeight: 750,
                }}
              >
                No active pilots yet
              </h3>

              <p
                style={{
                  maxWidth: "430px",
                  margin: "7px auto 0",
                  color: "#7B7181",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                Active organisations will appear here automatically after they
                complete registration and their pilot begins.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "760px",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr style={{ background: "#FBFAFC" }}>
                    {[
                      "Reference",
                      "Organisation",
                      "Contact",
                      "Started",
                      "Ends",
                      "Status",
                    ].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        style={{
                          padding: "11px 16px",
                          borderBottom: "1px solid #EEE9F0",
                          color: "#756A7A",
                          fontSize: "11px",
                          fontWeight: 760,
                          letterSpacing: "0.03em",
                          textAlign: "left",
                          textTransform: "uppercase",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activePilots.slice(0, 6).map((invitation) => {
                    const tone = getStatusTone(invitation.status);
                    const remaining = daysUntil(invitation.pilot_ends_at);

                    return (
                      <tr key={invitation.id}>
                        <td
                          style={{
                            padding: "14px 16px",
                            borderBottom: "1px solid #F1EDF2",
                            color: "#6E5084",
                            fontSize: "13px",
                            fontWeight: 720,
                          }}
                        >
                          {invitation.reference ?? "—"}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            borderBottom: "1px solid #F1EDF2",
                          }}
                        >
                          <div
                            style={{
                              color: "#2F2635",
                              fontSize: "13px",
                              fontWeight: 720,
                            }}
                          >
                            {invitation.organisation_name}
                          </div>
                          <div
                            style={{
                              marginTop: "3px",
                              color: "#857B89",
                              fontSize: "11px",
                            }}
                          >
                            Up to {invitation.employee_profile_limit} employees
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            borderBottom: "1px solid #F1EDF2",
                            color: "#594F5E",
                            fontSize: "13px",
                          }}
                        >
                          {invitation.contact_name || invitation.invited_email}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            borderBottom: "1px solid #F1EDF2",
                            color: "#594F5E",
                            fontSize: "13px",
                          }}
                        >
                          {formatDate(invitation.pilot_starts_at)}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            borderBottom: "1px solid #F1EDF2",
                            color: "#594F5E",
                            fontSize: "13px",
                          }}
                        >
                          <div>{formatDate(invitation.pilot_ends_at)}</div>
                          {remaining !== null && remaining >= 0 ? (
                            <div
                              style={{
                                marginTop: "3px",
                                color:
                                  remaining <= 30 ? "#9A4B0F" : "#857B89",
                                fontSize: "11px",
                              }}
                            >
                              {remaining} days remaining
                            </div>
                          ) : null}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            borderBottom: "1px solid #F1EDF2",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              padding: "5px 8px",
                              borderRadius: "999px",
                              background: tone.background,
                              border: `1px solid ${tone.border}`,
                              color: tone.colour,
                              fontSize: "11px",
                              fontWeight: 750,
                            }}
                          >
                            {tone.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <section
            style={{
              padding: "18px",
              borderRadius: "16px",
              background: "#FFFFFF",
              border: "1px solid #E8E2EB",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
              }}
            >
              <Sparkles
                size={19}
                strokeWidth={1.8}
                color="#6E5084"
                aria-hidden
              />
              <h2
                style={{
                  margin: 0,
                  color: "#2F2635",
                  fontSize: "16px",
                  fontWeight: 760,
                }}
              >
                Programme attention
              </h2>
            </div>

            <div
              style={{
                marginTop: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div
                style={{
                  padding: "12px",
                  borderRadius: "11px",
                  background: "#FAF7FC",
                  border: "1px solid #E9DFF0",
                }}
              >
                <div
                  style={{
                    color: "#6E5084",
                    fontSize: "18px",
                    fontWeight: 780,
                  }}
                >
                  {notOpenedCount}
                </div>
                <div
                  style={{
                    marginTop: "3px",
                    color: "#5F5464",
                    fontSize: "12px",
                    lineHeight: 1.5,
                  }}
                >
                  Pending invitations have not yet been opened.
                </div>
              </div>

              <div
                style={{
                  padding: "12px",
                  borderRadius: "11px",
                  background: "#F7FBFF",
                  border: "1px solid #DCEAF7",
                }}
              >
                <div
                  style={{
                    color: "#315E85",
                    fontSize: "18px",
                    fontWeight: 780,
                  }}
                >
                  {registrationOutstandingCount}
                </div>
                <div
                  style={{
                    marginTop: "3px",
                    color: "#5F6570",
                    fontSize: "12px",
                    lineHeight: 1.5,
                  }}
                >
                  Opened invitations are still awaiting registration.
                </div>
              </div>

              <div
                style={{
                  padding: "12px",
                  borderRadius: "11px",
                  background: "#FFF9F1",
                  border: "1px solid #F1DFC2",
                }}
              >
                <div
                  style={{
                    color: "#8A5B1F",
                    fontSize: "18px",
                    fontWeight: 780,
                  }}
                >
                  {expiringCount}
                </div>
                <div
                  style={{
                    marginTop: "3px",
                    color: "#685B49",
                    fontSize: "12px",
                    lineHeight: 1.5,
                  }}
                >
                  Active pilots are approaching their end date.
                </div>
              </div>
            </div>
          </section>

          <section
            style={{
              padding: "18px",
              borderRadius: "16px",
              background: "#FFFFFF",
              border: "1px solid #E8E2EB",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#2F2635",
                fontSize: "16px",
                fontWeight: 760,
              }}
            >
              Quick actions
            </h2>

            <div
              style={{
                marginTop: "13px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {[
                {
                  label: "Invite organisation",
                  href: "/pilot-programme/invite",
                  icon: Plus,
                },
                {
                  label: "Registration links",
                  href: "/pilot-programme/invitations",
                  icon: Link2,
                },
                {
                  label: "Export programme data",
                  href: "/pilot-programme/export",
                  icon: Download,
                },
                {
                  label: "Programme settings",
                  href: "/pilot-programme/settings",
                  icon: Settings2,
                },
              ].map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    style={{
                      minHeight: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      padding: "9px 10px",
                      borderRadius: "10px",
                      background: "#FBFAFC",
                      border: "1px solid #EEE9F0",
                      color: "#403647",
                      textDecoration: "none",
                      fontSize: "13px",
                      fontWeight: 680,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "9px",
                      }}
                    >
                      <Icon
                        size={17}
                        strokeWidth={1.8}
                        color="#6E5084"
                        aria-hidden
                      />
                      {action.label}
                    </span>
                    <ExternalLink
                      size={14}
                      strokeWidth={1.8}
                      color="#8A7E8F"
                      aria-hidden
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        </aside>
      </section>

      <section
        style={{
          marginTop: "16px",
          borderRadius: "16px",
          background: "#FFFFFF",
          border: "1px solid #E8E2EB",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            borderBottom: "1px solid #EEE9F0",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#2F2635",
                fontSize: "17px",
                fontWeight: 760,
              }}
            >
              Recent invitations
            </h2>
            <p
              style={{
                margin: "5px 0 0",
                color: "#7B7181",
                fontSize: "12px",
              }}
            >
              Latest secure pilot registration invitations.
            </p>
          </div>

          <Link
            href="/pilot-programme/invitations"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#6E5084",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 720,
            }}
          >
            Manage invitations
            <ArrowRight size={15} strokeWidth={1.9} aria-hidden />
          </Link>
        </div>

        {recentInvitations.length === 0 ? (
          <div
            style={{
              padding: "42px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "14px",
                background: "#F7F1FC",
                color: "#6E5084",
              }}
            >
              <Mail size={23} strokeWidth={1.8} aria-hidden />
            </div>

            <h3
              style={{
                margin: "14px 0 0",
                color: "#2F2635",
                fontSize: "15px",
                fontWeight: 750,
              }}
            >
              No pilot invitations yet
            </h3>

            <p
              style={{
                maxWidth: "450px",
                margin: "7px auto 0",
                color: "#7B7181",
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              Create the first secure registration invitation to begin adding
              organisations to the LEO Pilot Programme.
            </p>

            <Link
              href="/pilot-programme/invite"
              style={{
                minHeight: "40px",
                marginTop: "16px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "10px",
                background: "#6E5084",
                color: "#FFFFFF",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 750,
              }}
            >
              <Plus size={17} strokeWidth={2} aria-hidden />
              Invite organisation
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: "960px",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ background: "#FBFAFC" }}>
                  {[
                    "Reference",
                    "Organisation",
                    "Contact",
                    "Sent",
                    "Opened",
                    "Expires",
                    "Status",
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      style={{
                        padding: "11px 16px",
                        borderBottom: "1px solid #EEE9F0",
                        color: "#756A7A",
                        fontSize: "11px",
                        fontWeight: 760,
                        letterSpacing: "0.03em",
                        textAlign: "left",
                        textTransform: "uppercase",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentInvitations.map((invitation) => {
                  const tone = getStatusTone(invitation.status);

                  return (
                    <tr key={invitation.id}>
                      <td
                        style={{
                          padding: "14px 16px",
                          borderBottom: "1px solid #F1EDF2",
                          color: "#6E5084",
                          fontSize: "13px",
                          fontWeight: 720,
                        }}
                      >
                        {invitation.reference ?? "—"}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          borderBottom: "1px solid #F1EDF2",
                        }}
                      >
                        <div
                          style={{
                            color: "#2F2635",
                            fontSize: "13px",
                            fontWeight: 720,
                          }}
                        >
                          {invitation.organisation_name}
                        </div>
                        <div
                          style={{
                            marginTop: "3px",
                            color: "#857B89",
                            fontSize: "11px",
                          }}
                        >
                          {invitation.pilot_duration_months}-month pilot
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          borderBottom: "1px solid #F1EDF2",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "7px",
                            color: "#514756",
                            fontSize: "13px",
                          }}
                        >
                          <UserRound
                            size={15}
                            strokeWidth={1.8}
                            color="#8A7E8F"
                            aria-hidden
                          />
                          {invitation.contact_name || "No contact name"}
                        </div>
                        <div
                          style={{
                            marginTop: "4px",
                            color: "#857B89",
                            fontSize: "11px",
                          }}
                        >
                          {invitation.invited_email}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          borderBottom: "1px solid #F1EDF2",
                          color: "#594F5E",
                          fontSize: "13px",
                        }}
                      >
                        {formatDate(
                          invitation.last_sent_at ?? invitation.created_at,
                        )}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          borderBottom: "1px solid #F1EDF2",
                          color: invitation.opened_at
                            ? "#236B45"
                            : "#857B89",
                          fontSize: "13px",
                        }}
                      >
                        {invitation.opened_at
                          ? formatDate(invitation.opened_at)
                          : "Not opened"}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          borderBottom: "1px solid #F1EDF2",
                          color: "#594F5E",
                          fontSize: "13px",
                        }}
                      >
                        {formatDate(invitation.invitation_expires_at)}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          borderBottom: "1px solid #F1EDF2",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            padding: "5px 8px",
                            borderRadius: "999px",
                            background: tone.background,
                            border: `1px solid ${tone.border}`,
                            color: tone.colour,
                            fontSize: "11px",
                            fontWeight: 750,
                          }}
                        >
                          {tone.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}