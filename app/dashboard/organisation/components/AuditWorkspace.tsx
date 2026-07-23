"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import uiStyles from "./AuditWorkspace.module.css";

type Props = { organisationId: string };

type AuditEvent = {
  id: string;
  event_type: string;
  event_category: string;
  severity: "information" | "notice" | "warning" | "critical";
  actor_display_name: string | null;
  actor_type: string;
  source_table: string | null;
  record_id: string | null;
  module_key: string | null;
  action_label: string | null;
  changed_fields: string[] | null;
  metadata: Record<string, unknown>;
  occurred_at: string;
};

function humanise(value: string | null) {
  if (!value) return "Not recorded";
  return value.replaceAll(".", " · ").replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export default function AuditWorkspace({ organisationId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageError, setPageError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 50;

  const loadEvents = useCallback(async (append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    setPageError("");

    const from = append ? events.length : 0;
    const to = from + pageSize - 1;

    let query = supabase
      .from("leo_audit_events")
      .select("id, event_type, event_category, severity, actor_display_name, actor_type, source_table, record_id, module_key, action_label, changed_fields, metadata, occurred_at")
      .eq("organisation_id", organisationId)
      .order("occurred_at", { ascending: false })
      .range(from, to);

    if (category !== "all") query = query.eq("event_category", category);
    if (severity !== "all") query = query.eq("severity", severity);

    const { data, error } = await query;

    if (error) {
      setPageError(error.message);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const rows = (data ?? []) as AuditEvent[];
    setEvents(current => append ? [...current, ...rows] : rows);
    setHasMore(rows.length === pageSize);
    setLoading(false);
    setLoadingMore(false);
  }, [category, events.length, organisationId, severity, supabase]);

  useEffect(() => {
    void loadEvents(false);
    // loadEvents intentionally re-runs when filters change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organisationId, category, severity]);

  const categories = useMemo(
    () => [...new Set(events.map(event => event.event_category))].sort(),
    [events],
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return events;
    return events.filter(event =>
      [
        event.event_type,
        event.event_category,
        event.severity,
        event.actor_display_name,
        event.actor_type,
        event.source_table,
        event.record_id,
        event.module_key,
        event.action_label,
        event.changed_fields?.join(" "),
      ].filter(Boolean).join(" ").toLowerCase().includes(query),
    );
  }, [events, search]);

  const summary = useMemo(() => ({
    total: events.length,
    security: events.filter(event => event.event_category === "security").length,
    warning: events.filter(event => event.severity === "warning" || event.severity === "critical").length,
    users: new Set(events.map(event => event.actor_display_name).filter(Boolean)).size,
  }), [events]);

  function exportCsv() {
    const header = [
      "Occurred at", "Event", "Category", "Severity", "Actor", "Actor type",
      "Module", "Source table", "Record ID", "Changed fields",
    ];
    const rows = filteredEvents.map(event => [
      event.occurred_at,
      event.action_label || event.event_type,
      event.event_category,
      event.severity,
      event.actor_display_name || "",
      event.actor_type,
      event.module_key || "",
      event.source_table || "",
      event.record_id || "",
      event.changed_fields?.join("; ") || "",
    ]);
    const csv = [header, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `leo-organisation-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <section className={uiStyles.workspace}>
        <div className="skeleton heading" />
        <div className="summary-grid">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton card" />)}</div>
        <div className="skeleton body" />
</section>
    );
  }

  if (pageError && events.length === 0) {
    return (
      <section className={uiStyles.workspace}>
        <div className="state error" role="alert"><span>!</span><h2>Audit history could not be loaded</h2><p>{pageError}</p><button type="button" onClick={() => void loadEvents(false)}>Try again</button></div>
</section>
    );
  }

  return (
    <section className={uiStyles.workspace}>
      <header className="workspace-heading">
        <div><p className="eyebrow">Audit</p><h2>Organisation administration history</h2><p>Review immutable organisation-scoped evidence for access, security, data and workflow activity.</p></div>
        <div className="heading-actions">
          <button className="secondary" type="button" onClick={() => void loadEvents(false)}>Refresh</button>
          <button className="primary" type="button" disabled={filteredEvents.length === 0} onClick={exportCsv}>Export current view</button>
        </div>
      </header>

      <div className="summary-grid">
        <article><span>Loaded events</span><strong>{summary.total}</strong><small>Newest records first</small></article>
        <article><span>Security events</span><strong>{summary.security}</strong><small>Authentication and access</small></article>
        <article><span>Warnings</span><strong>{summary.warning}</strong><small>Warning or critical severity</small></article>
        <article><span>Recorded actors</span><strong>{summary.users}</strong><small>Named users in current view</small></article>
      </div>

      {pageError ? <div className="notice error" role="alert">{pageError}</div> : null}

      <div className="toolbar">
        <label className="search"><span className="sr-only">Search audit events</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search events, people, modules or records" /></label>
        <label><span className="sr-only">Event category</span><select value={category} onChange={event => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map(item => <option key={item} value={item}>{humanise(item)}</option>)}</select></label>
        <label><span className="sr-only">Event severity</span><select value={severity} onChange={event => setSeverity(event.target.value)}><option value="all">All severities</option><option value="information">Information</option><option value="notice">Notice</option><option value="warning">Warning</option><option value="critical">Critical</option></select></label>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="state"><span>✦</span><h3>No matching audit events</h3><p>There are no records matching the current search and filters.</p></div>
      ) : (
        <div className="timeline">
          {filteredEvents.map(event => (
            <article key={event.id}>
              <div className={`marker ${event.severity}`} />
              <div className="event-card">
                <div className="event-heading">
                  <div>
                    <span className={`severity ${event.severity}`}>{event.severity}</span>
                    <span className="category">{humanise(event.event_category)}</span>
                    <h3>{event.action_label || humanise(event.event_type)}</h3>
                  </div>
                  <time>{formatDateTime(event.occurred_at)}</time>
                </div>
                <dl>
                  <div><dt>Actor</dt><dd>{event.actor_display_name || humanise(event.actor_type)}</dd></div>
                  <div><dt>Module</dt><dd>{humanise(event.module_key)}</dd></div>
                  <div><dt>Record</dt><dd>{event.source_table ? `${event.source_table}${event.record_id ? ` · ${event.record_id}` : ""}` : "Not linked"}</dd></div>
                  <div><dt>Changed fields</dt><dd>{event.changed_fields?.length ? event.changed_fields.map(humanise).join(", ") : "Not applicable"}</dd></div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      )}

      {hasMore ? <div className="load-more"><button className="secondary" type="button" disabled={loadingMore} onClick={() => void loadEvents(true)}>{loadingMore ? "Loading…" : "Load more events"}</button></div> : null}
</section>
  );
}