"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import uiStyles from "./SecurityWorkspace.module.css";

type Props = { organisationId: string };

type SecurityEvent = {
  id: string;
  event_type: string;
  severity: "information" | "notice" | "warning" | "critical";
  actor_display_name: string | null;
  action_label: string | null;
  occurred_at: string;
};

type Summary = {
  activeMemberships: number;
  activeOwners: number;
  warningEvents30Days: number;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function humanise(value: string) {
  return value
    .replaceAll(".", " · ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, character => character.toUpperCase());
}

export default function SecurityWorkspace({ organisationId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [summary, setSummary] = useState<Summary>({
    activeMemberships: 0,
    activeOwners: 0,
    warningEvents30Days: 0,
  });
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [assurance, setAssurance] = useState<string>("aal1");
  const [nextAssurance, setNextAssurance] = useState<string>("aal1");
  const [identityCount, setIdentityCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setPageError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setPageError(
        userError?.message || "You must be signed in to review security.",
      );
      setLoading(false);
      return;
    }

    setIdentityCount(user.identities?.length ?? 0);

    const { data: aalData } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    setAssurance(aalData?.currentLevel ?? "aal1");
    setNextAssurance(
      aalData?.nextLevel ?? aalData?.currentLevel ?? "aal1",
    );

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [memberships, assignments, securityEvents] = await Promise.all([
      supabase
        .from("organisation_memberships")
        .select("id, membership_status", { count: "exact" })
        .eq("organisation_id", organisationId)
        .eq("membership_status", "active"),
      supabase
        .from("membership_roles")
        .select(
          "id, membership_id, role:roles!inner(role_key), membership:organisation_memberships!inner(organisation_id)",
          { count: "exact" },
        )
        .eq("is_active", true)
        .eq("membership.organisation_id", organisationId),
      supabase
        .from("leo_audit_events")
        .select(
          "id, event_type, severity, actor_display_name, action_label, occurred_at",
        )
        .eq("organisation_id", organisationId)
        .eq("event_category", "security")
        .gte("occurred_at", since.toISOString())
        .order("occurred_at", { ascending: false })
        .limit(12),
    ]);

    const firstError =
      memberships.error || assignments.error || securityEvents.error;

    if (firstError) {
      setPageError(firstError.message);
      setLoading(false);
      return;
    }

    const assignmentRows = (assignments.data ?? []) as unknown as Array<{
      role: { role_key: string } | null;
    }>;

    const eventRows = (securityEvents.data ?? []) as SecurityEvent[];

    setSummary({
      activeMemberships: memberships.count ?? 0,
      activeOwners: assignmentRows.filter(
        item => item.role?.role_key === "owner",
      ).length,
      warningEvents30Days: eventRows.filter(
        item => item.severity === "warning" || item.severity === "critical",
      ).length,
    });

    setEvents(eventRows);
    setLoading(false);
  }, [organisationId, supabase]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  if (loading) {
    return (
      <section className={uiStyles.workspace}>
        <div className="skeleton heading" />
        <div className="summary-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton card" />
          ))}
        </div>
        <div className="skeleton body" />
      </section>
    );
  }

  if (pageError) {
    return (
      <section className={uiStyles.workspace}>
        <div className="state error" role="alert">
          <span>!</span>
          <h2>Security information could not be loaded</h2>
          <p>{pageError}</p>
          <button type="button" onClick={() => void loadWorkspace()}>
            Try again
          </button>
        </div>
      </section>
    );
  }

  const mfaVerified = assurance === "aal2";
  const mfaSetUp = nextAssurance === "aal2";
  const mfaLabel = mfaVerified ? "Verified" : mfaSetUp ? "Set up" : "Standard";

  return (
    <section className={uiStyles.workspace}>
      <header className="workspace-heading">
        <div>
          <p className="eyebrow">Access & security</p>
          <h2>Organisation access & security</h2>
          <p>
            See who currently has access to Leo HR, check your sign-in
            protection and review any recent security alerts.
          </p>
        </div>
        <button
          className="secondary"
          type="button"
          onClick={() => void loadWorkspace()}
        >
          Refresh
        </button>
      </header>

      <div className="summary-grid">
        <article>
          <span>Users with access</span>
          <strong>{summary.activeMemberships}</strong>
          <small>Active organisation users</small>
        </article>

        <article>
          <span>Owners</span>
          <strong>{summary.activeOwners}</strong>
          <small>Users with owner-level access</small>
        </article>

        <article>
          <span>Sign-in protection</span>
          <strong>{mfaLabel}</strong>
          <small>
            {mfaVerified
              ? "Multi-factor verification is active for this session"
              : mfaSetUp
                ? "Multi-factor authentication is set up for this account"
                : "Standard sign-in protection is in use"}
          </small>
        </article>

        <article>
          <span>Security alerts</span>
          <strong>{summary.warningEvents30Days}</strong>
          <small>Warning or critical events in the last 30 days</small>
        </article>
      </div>

      <div className="content-grid">
        <section className="card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Your account</p>
              <h3>Sign-in security</h3>
            </div>
            <span
              className={
                `status ${mfaVerified ? "good" : mfaSetUp ? "attention" : "neutral"}`
              }
            >
              {mfaVerified
                ? "MFA verified"
                : mfaSetUp
                  ? "MFA set up"
                  : "Standard sign-in"}
            </span>
          </div>

          <dl>
            <div>
              <dt>Multi-factor authentication</dt>
              <dd>{mfaSetUp || mfaVerified ? "Set up" : "Not set up"}</dd>
            </div>
            <div>
              <dt>Sign-in methods</dt>
              <dd>{identityCount}</dd>
            </div>
          </dl>

          <p className="explanation">
            Leo uses secure sign-in, organisation membership and role-based
            permissions to control access. The underlying security controls
            remain enforced automatically.
          </p>
        </section>

        <section className="card">
          <p className="eyebrow">How access is protected</p>
          <h3>Simple, layered access control</h3>

          <div className="control-list">
            <div>
              <span>1</span>
              <div>
                <strong>Secure sign-in</strong>
                <small>Every user must sign in before accessing Leo HR.</small>
              </div>
            </div>
            <div>
              <span>2</span>
              <div>
                <strong>Organisation access</strong>
                <small>
                  Only active users linked to this organisation can access its
                  records.
                </small>
              </div>
            </div>
            <div>
              <span>3</span>
              <div>
                <strong>Role-based permissions</strong>
                <small>
                  Owners, senior users, managers and employees only see the
                  areas their role allows.
                </small>
              </div>
            </div>
            <div>
              <span>4</span>
              <div>
                <strong>Protected organisation data</strong>
                <small>
                  Access rules are enforced behind the scenes as well as in the
                  interface.
                </small>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">Recent security activity</p>
            <h3>Last 30 days</h3>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="empty">
            <span>✓</span>
            <p>
              No security activity requiring review has been recorded for this
              organisation in the last 30 days.
            </p>
          </div>
        ) : (
          <div className="events">
            {events.map(event => (
              <article key={event.id}>
                <span className={`severity ${event.severity}`}>
                  {event.severity}
                </span>
                <div>
                  <strong>
                    {event.action_label || humanise(event.event_type)}
                  </strong>
                  <small>
                    {event.actor_display_name || "Leo system"} ·{" "}
                    {formatDateTime(event.occurred_at)}
                  </small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
