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
  activeRoleAssignments: number;
  permissionCount: number;
  securityEvents30Days: number;
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
  return value.replaceAll(".", " · ").replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function SecurityWorkspace({ organisationId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [summary, setSummary] = useState<Summary>({
    activeMemberships: 0,
    activeOwners: 0,
    activeRoleAssignments: 0,
    permissionCount: 0,
    securityEvents30Days: 0,
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
      setPageError(userError?.message || "You must be signed in to review security.");
      setLoading(false);
      return;
    }

    setIdentityCount(user.identities?.length ?? 0);

    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setAssurance(aalData?.currentLevel ?? "aal1");
    setNextAssurance(aalData?.nextLevel ?? aalData?.currentLevel ?? "aal1");

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [
      memberships,
      assignments,
      permissions,
      securityEvents,
    ] = await Promise.all([
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
        .from("permissions")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("leo_audit_events")
        .select("id, event_type, severity, actor_display_name, action_label, occurred_at")
        .eq("organisation_id", organisationId)
        .eq("event_category", "security")
        .gte("occurred_at", since.toISOString())
        .order("occurred_at", { ascending: false })
        .limit(12),
    ]);

    const firstError =
      memberships.error ||
      assignments.error ||
      permissions.error ||
      securityEvents.error;

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
      activeOwners: assignmentRows.filter(item => item.role?.role_key === "owner").length,
      activeRoleAssignments: assignments.count ?? assignmentRows.length,
      permissionCount: permissions.count ?? 0,
      securityEvents30Days: eventRows.length,
      warningEvents30Days: eventRows.filter(item => item.severity === "warning" || item.severity === "critical").length,
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
        <div className="summary-grid">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton card" />)}</div>
        <div className="skeleton body" />
</section>
    );
  }

  if (pageError) {
    return (
      <section className={uiStyles.workspace}>
        <div className="state error" role="alert">
          <span>!</span><h2>Security information could not be loaded</h2><p>{pageError}</p>
          <button type="button" onClick={() => void loadWorkspace()}>Try again</button>
        </div>
</section>
    );
  }

  const mfaAvailable = nextAssurance === "aal2";
  const mfaVerified = assurance === "aal2";

  return (
    <section className={uiStyles.workspace}>
      <header className="workspace-heading">
        <div>
          <p className="eyebrow">Security</p>
          <h2>Organisation security posture</h2>
          <p>Review authentication assurance, active access assignments and security-relevant audit activity without bypassing the platform authorisation engine.</p>
        </div>
        <button className="secondary" type="button" onClick={() => void loadWorkspace()}>Refresh</button>
      </header>

      <div className="summary-grid">
        <article><span>Active memberships</span><strong>{summary.activeMemberships}</strong><small>Current tenant identities</small></article>
        <article><span>Active role assignments</span><strong>{summary.activeRoleAssignments}</strong><small>{summary.activeOwners} owner assignment{summary.activeOwners === 1 ? "" : "s"}</small></article>
        <article><span>Permission catalogue</span><strong>{summary.permissionCount}</strong><small>Active permission definitions</small></article>
        <article><span>Security events</span><strong>{summary.securityEvents30Days}</strong><small>{summary.warningEvents30Days} warning or critical in 30 days</small></article>
      </div>

      <div className="content-grid">
        <section className="card">
          <div className="card-heading">
            <div><p className="eyebrow">Signed-in account</p><h3>Authentication assurance</h3></div>
            <span className={`status ${mfaVerified ? "good" : mfaAvailable ? "attention" : "neutral"}`}>
              {mfaVerified ? "MFA verified" : mfaAvailable ? "MFA available" : "Standard assurance"}
            </span>
          </div>
          <dl>
            <div><dt>Current assurance</dt><dd>{assurance.toUpperCase()}</dd></div>
            <div><dt>Available assurance</dt><dd>{nextAssurance.toUpperCase()}</dd></div>
            <div><dt>Linked sign-in identities</dt><dd>{identityCount}</dd></div>
          </dl>
          <p className="explanation">
            Multi-factor enrolment and challenge remain controlled by Supabase Auth. This workspace reports the current session position and does not weaken or simulate authentication controls.
          </p>
        </section>

        <section className="card">
          <p className="eyebrow">Control model</p>
          <h3>Layered organisation access</h3>
          <div className="control-list">
            <div><span>1</span><div><strong>Authentication identity</strong><small>Supabase Auth establishes the signed-in user.</small></div></div>
            <div><span>2</span><div><strong>Active membership</strong><small>Organisation membership and access windows establish tenant access.</small></div></div>
            <div><span>3</span><div><strong>Role assignment</strong><small>Time-bounded membership roles provide approved permission bundles.</small></div></div>
            <div><span>4</span><div><strong>Database enforcement</strong><small>RLS and permission helpers enforce access at the data boundary.</small></div></div>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-heading">
          <div><p className="eyebrow">Recent security activity</p><h3>Last 30 days</h3></div>
        </div>
        {events.length === 0 ? (
          <div className="empty"><span>✦</span><p>No security events were recorded for this organisation in the last 30 days.</p></div>
        ) : (
          <div className="events">
            {events.map(event => (
              <article key={event.id}>
                <span className={`severity ${event.severity}`}>{event.severity}</span>
                <div>
                  <strong>{event.action_label || humanise(event.event_type)}</strong>
                  <small>{event.actor_display_name || "LEO system"} · {formatDateTime(event.occurred_at)}</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
</section>
  );
}