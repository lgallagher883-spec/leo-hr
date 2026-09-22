"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

type Matter = {
  id: number;
  title: string;
  subject: string | null;
  status: string | null;
  matter_type: string | null;
  workflowStage: number;
  nextStage: string | null;
};

type Reminder = {
  id: string;
  title: string;
  message: string;
  actionUrl: string | null;
  createdAt: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
};

type Escalation = {
  id: string;
  title: string;
  message: string;
  actionUrl: string | null;
  createdAt: string;
  isRead: boolean;
  matterId: number | null;
  reason: string | null;
  recipientRole: string | null;
};

type Usage = {
  proactiveTasksCreated: number;
  proactiveTasksAcknowledged: number;
  workflowStagesAdvanced: number;
  managementEscalationsRaised: number;
  matterAgentActionsCompleted: number;
  trackedAutomationEvents: number;
};

const fallbackStages = ["Open", "In Progress", "Needs Attention", "Closed"];

export default function AgentOperationsPage() {
  const router = useRouter();
  const [matters, setMatters] = useState<Matter[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [usage, setUsage] = useState<Usage>({
    proactiveTasksCreated: 0,
    proactiveTasksAcknowledged: 0,
    workflowStagesAdvanced: 0,
    managementEscalationsRaised: 0,
    matterAgentActionsCompleted: 0,
    trackedAutomationEvents: 0,
  });
  const [workflowStages, setWorkflowStages] = useState<string[]>(fallbackStages);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  async function loadData() {
    setLoading(true);
    setNotice("");
    try {
      const [operationsResponse, remindersResponse] = await Promise.all([
        fetch("/api/agent-operations", { cache: "no-store", credentials: "include" }),
        fetch("/api/reminders?limit=12", { cache: "no-store", credentials: "include" }),
      ]);
      const operations = await operationsResponse.json().catch(() => null);
      const reminderPayload = await remindersResponse.json().catch(() => null);

      if (!operationsResponse.ok || !operations?.success) {
        throw new Error(operations?.error || "Agent Operations could not be loaded.");
      }

      setMatters(Array.isArray(operations.matters) ? operations.matters : []);
      setEscalations(Array.isArray(operations.escalations) ? operations.escalations : []);
      setUsage(operations.usage || usage);
      setWorkflowStages(Array.isArray(operations.workflowStages) ? operations.workflowStages : fallbackStages);
      setReminders(remindersResponse.ok && reminderPayload?.success && Array.isArray(reminderPayload.reminders)
        ? reminderPayload.reminders
        : []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Agent Operations could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function runMatterAction(action: "escalate", matterId: number) {
    const key = `${action}:${matterId}`;
    setBusy(key);
    setNotice("");

    try {
      const response = await fetch("/api/agent-operations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          matterId,
          reason: "Leo has routed this Matter for authorised management review before the workflow continues.",
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "The action could not be completed.");
      }

      setNotice(`Escalation created and routed to ${result.recipientCount || 0} management recipient(s).`);
      await loadData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The action could not be completed.");
    } finally {
      setBusy(null);
    }
  }

  const openMatters = useMemo(
    () => matters.filter((matter) => String(matter.status || "").toLowerCase() !== "closed"),
    [matters],
  );

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>LEO AGENT OPERATIONS</div>
          <h1 style={titleStyle}>AI HR Operations</h1>
          <p style={subtitleStyle}>
            Leo proactively identifies work, runs predefined HR workflows, routes decisions to authorised people and records automation activity.
          </p>
        </div>
        <button type="button" style={secondaryButtonStyle} onClick={() => void loadData()} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {notice ? <div style={noticeStyle}>{notice}</div> : null}

      <section style={sectionStyle}>
        <SectionHeading
          kicker="Proactive Tasking"
          title="Leo Needs Your Help"
          description="Tasks are generated from live HR records and deadlines without waiting for a user prompt."
          badge={String(reminders.length)}
        />
        {reminders.length === 0 ? (
          <EmptyState text="No proactive tasks currently require attention." />
        ) : (
          <div style={cardGridStyle}>
            {reminders.slice(0, 6).map((reminder) => (
              <article key={reminder.id} style={cardStyle}>
                <div style={pillRowStyle}>
                  <Pill>{String(reminder.metadata?.module || "HR")}</Pill>
                  <Pill>{String(reminder.metadata?.status_band || "proactive")}</Pill>
                </div>
                <h3 style={cardTitleStyle}>{reminder.title}</h3>
                <p style={bodyStyle}>{reminder.message}</p>
                <div style={cardFooterStyle}>
                  <span style={mutedStyle}>Created proactively by Leo</span>
                  {reminder.actionUrl ? (
                    <button type="button" style={linkButtonStyle} onClick={() => router.push(reminder.actionUrl as string)}>
                      Open task →
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={sectionStyle}>
        <SectionHeading
          kicker="Workflow Automation"
          title="Predefined Matter workflows"
          description="Leo identifies the next step in each Matter, links the employer to the required action and records completed workflow activity."
          badge={String(openMatters.length)}
        />
        {openMatters.length === 0 ? (
          <EmptyState text="No active Matter workflows are currently running." />
        ) : (
          <div style={stackStyle}>
            {openMatters.slice(0, 5).map((matter) => (
              <article key={matter.id} style={workflowCardStyle}>
                <div style={workflowTopStyle}>
                  <div>
                    <h3 style={cardTitleStyle}>{matter.subject || matter.title}</h3>
                    <p style={mutedStyle}>{matter.matter_type || "General"} · Matter #{matter.id}</p>
                  </div>
                  <Pill>{matter.status || "Open"}</Pill>
                </div>
                <div style={stepsStyle}>
                  {workflowStages.map((stage, index) => (
                    <div key={stage} style={stepWrapStyle}>
                      <div style={{
                        ...stepDotStyle,
                        ...(index <= matter.workflowStage ? activeStepDotStyle : {}),
                      }}>
                        {index < matter.workflowStage ? "✓" : index + 1}
                      </div>
                      <span style={index <= matter.workflowStage ? activeStepLabelStyle : stepLabelStyle}>{stage}</span>
                      {index < workflowStages.length - 1 ? <div style={connectorStyle} /> : null}
                    </div>
                  ))}
                </div>
                <div style={actionRowStyle}>
                  <span style={mutedStyle}>
                    {matter.nextStage ? `Next workflow stage: ${matter.nextStage}` : "Workflow complete"}
                  </span>
                  <button
                    type="button"
                    style={primaryButtonStyle}
                    onClick={() => router.push(`/dashboard/matters/${matter.id}`)}
                  >
                    Open Leo next actions
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={sectionStyle}>
        <SectionHeading
          kicker="Escalation Management"
          title="Human review & management escalation"
          description="Complex or significant Matters can be transferred to Owner/Senior users for review. Leo does not make the final employment decision."
          badge={String(escalations.length)}
        />
        <div style={twoColumnStyle}>
          <div style={stackStyle}>
            {openMatters.slice(0, 4).map((matter) => (
              <article key={matter.id} style={compactCardStyle}>
                <div>
                  <h3 style={compactTitleStyle}>{matter.subject || matter.title}</h3>
                  <p style={mutedStyle}>Current status: {matter.status || "Open"}</p>
                </div>
                <button
                  type="button"
                  style={escalateButtonStyle}
                  disabled={busy === `escalate:${matter.id}`}
                  onClick={() => void runMatterAction("escalate", matter.id)}
                >
                  {busy === `escalate:${matter.id}` ? "Routing..." : "Escalate to management"}
                </button>
              </article>
            ))}
          </div>
          <div style={escalationPanelStyle}>
            <h3 style={panelTitleStyle}>Active escalations</h3>
            {escalations.length === 0 ? (
              <p style={bodyStyle}>No active management escalations.</p>
            ) : escalations.slice(0, 6).map((item) => (
              <button
                key={item.id}
                type="button"
                style={escalationItemStyle}
                onClick={() => item.actionUrl && router.push(item.actionUrl)}
              >
                <strong>{item.title}</strong>
                <span>{item.message}</span>
                <small>Routed to {item.recipientRole || "management"} · {item.isRead ? "Reviewed" : "Awaiting review"}</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <SectionHeading
          kicker="Usage Tracking / Analytics"
          title="AI & automation usage"
          description="Metrics are calculated from Leo's audit trail and automation events, not estimated activity."
        />
        <div style={metricGridStyle}>
          <Metric label="Proactive tasks created" value={usage.proactiveTasksCreated} detail="Milestone tasks emitted by Leo" />
          <Metric label="Tasks acknowledged" value={usage.proactiveTasksAcknowledged} detail="Proactive tasks opened by users" />
          <Metric label="Workflow stages advanced" value={usage.workflowStagesAdvanced} detail="Recorded automated transitions" />
          <Metric label="Management escalations" value={usage.managementEscalationsRaised} detail="Matters routed for human review" />
          <Metric label="Matter tasks completed" value={usage.matterAgentActionsCompleted} detail="Proactive HR actions confirmed complete" />
          <Metric label="Tracked automation events" value={usage.trackedAutomationEvents} detail="Total auditable agent activity" />
        </div>
        <div style={analyticsNoteStyle}>
          Every workflow advance, proactive reminder and management escalation is retained in Leo's audit trail for governance and reporting.
        </div>
      </section>
    </main>
  );
}

function SectionHeading({ kicker, title, description, badge }: { kicker: string; title: string; description: string; badge?: string }) {
  return (
    <div style={sectionHeadingStyle}>
      <div>
        <div style={eyebrowStyle}>{kicker}</div>
        <h2 style={sectionTitleStyle}>{title}</h2>
        <p style={sectionDescriptionStyle}>{description}</p>
      </div>
      {badge ? <span style={countBadgeStyle}>{badge}</span> : null}
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <article style={metricCardStyle}>
      <span style={metricLabelStyle}>{label}</span>
      <strong style={metricValueStyle}>{value}</strong>
      <span style={mutedStyle}>{detail}</span>
    </article>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span style={pillStyle}>{children}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>;
}

const pageStyle: CSSProperties = { width: "100%", maxWidth: "1240px", margin: "0 auto", paddingBottom: "40px" };
const headerStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", marginBottom: "22px", flexWrap: "wrap" };
const eyebrowStyle: CSSProperties = { color: "#6E5084", fontSize: "11px", fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase" };
const titleStyle: CSSProperties = { margin: "5px 0 7px", color: "#2F2635", fontSize: "30px", fontWeight: 700, letterSpacing: "-0.02em" };
const subtitleStyle: CSSProperties = { margin: 0, maxWidth: "780px", color: "#6B7280", fontSize: "14px", lineHeight: 1.6 };
const sectionStyle: CSSProperties = { marginTop: "18px", padding: "20px", border: "1px solid #E7E1EB", borderRadius: "18px", background: "#FFFFFF", boxShadow: "0 8px 24px rgba(110,80,132,0.05)" };
const sectionHeadingStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "16px" };
const sectionTitleStyle: CSSProperties = { margin: "4px 0", color: "#2F2635", fontSize: "20px" };
const sectionDescriptionStyle: CSSProperties = { margin: 0, maxWidth: "800px", color: "#6B7280", fontSize: "13px", lineHeight: 1.5 };
const countBadgeStyle: CSSProperties = { minWidth: "34px", height: "34px", display: "grid", placeItems: "center", borderRadius: "999px", background: "#F7F1FC", color: "#6E5084", fontWeight: 800 };
const cardGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: "12px" };
const cardStyle: CSSProperties = { padding: "15px", border: "1px solid #E9E3ED", borderRadius: "14px", background: "#FCFAFD" };
const cardTitleStyle: CSSProperties = { margin: "8px 0 5px", color: "#2F2635", fontSize: "15px" };
const bodyStyle: CSSProperties = { margin: 0, color: "#59616C", fontSize: "13px", lineHeight: 1.5 };
const mutedStyle: CSSProperties = { color: "#7D7D7D", fontSize: "12px", lineHeight: 1.45 };
const pillRowStyle: CSSProperties = { display: "flex", gap: "6px", flexWrap: "wrap" };
const pillStyle: CSSProperties = { display: "inline-flex", padding: "4px 8px", borderRadius: "999px", background: "#F7F1FC", color: "#6E5084", fontSize: "11px", fontWeight: 700, textTransform: "capitalize" };
const cardFooterStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", marginTop: "12px" };
const linkButtonStyle: CSSProperties = { border: 0, background: "transparent", color: "#6E5084", fontWeight: 700, cursor: "pointer" };
const stackStyle: CSSProperties = { display: "grid", gap: "10px" };
const workflowCardStyle: CSSProperties = { padding: "16px", border: "1px solid #E9E3ED", borderRadius: "14px", background: "#FCFAFD" };
const workflowTopStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" };
const stepsStyle: CSSProperties = { display: "flex", alignItems: "flex-start", margin: "18px 0", overflowX: "auto", paddingBottom: "4px" };
const stepWrapStyle: CSSProperties = { display: "flex", alignItems: "center", minWidth: "150px", position: "relative" };
const stepDotStyle: CSSProperties = { width: "30px", height: "30px", borderRadius: "999px", display: "grid", placeItems: "center", border: "1px solid #D7D1DB", background: "#FFFFFF", color: "#8B8490", fontSize: "12px", fontWeight: 800, zIndex: 1 };
const activeStepDotStyle: CSSProperties = { background: "#6E5084", color: "#FFFFFF", borderColor: "#6E5084" };
const stepLabelStyle: CSSProperties = { marginLeft: "7px", color: "#8B8490", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap" };
const activeStepLabelStyle: CSSProperties = { ...stepLabelStyle, color: "#4A4050" };
const connectorStyle: CSSProperties = { position: "absolute", height: "1px", background: "#DCD5E1", left: "30px", right: 0, top: "15px", zIndex: 0 };
const actionRowStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" };
const primaryButtonStyle: CSSProperties = { border: 0, borderRadius: "9px", padding: "9px 13px", background: "#6E5084", color: "#FFFFFF", fontWeight: 700, cursor: "pointer" };
const secondaryButtonStyle: CSSProperties = { border: "1px solid #CDB2E2", borderRadius: "9px", padding: "9px 13px", background: "#FFFFFF", color: "#6E5084", fontWeight: 700, cursor: "pointer" };
const twoColumnStyle: CSSProperties = { display: "grid", gridTemplateColumns: "minmax(0,1.15fr) minmax(300px,.85fr)", gap: "14px" };
const compactCardStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", padding: "13px", border: "1px solid #E9E3ED", borderRadius: "12px", background: "#FCFAFD" };
const compactTitleStyle: CSSProperties = { margin: "0 0 3px", color: "#2F2635", fontSize: "14px" };
const escalateButtonStyle: CSSProperties = { border: "1px solid #CDB2E2", borderRadius: "9px", padding: "8px 10px", background: "#FFFFFF", color: "#6E5084", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" };
const escalationPanelStyle: CSSProperties = { padding: "14px", borderRadius: "14px", background: "#F7F1FC", border: "1px solid #E8DAF2" };
const panelTitleStyle: CSSProperties = { margin: "0 0 10px", color: "#2F2635", fontSize: "15px" };
const escalationItemStyle: CSSProperties = { width: "100%", display: "grid", gap: "4px", textAlign: "left", padding: "10px 0", border: 0, borderBottom: "1px solid #E1D5E9", background: "transparent", color: "#4A4050", cursor: "pointer" };
const metricGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "10px" };
const metricCardStyle: CSSProperties = { display: "grid", gap: "5px", padding: "14px", border: "1px solid #E9E3ED", borderRadius: "12px", background: "#FCFAFD" };
const metricLabelStyle: CSSProperties = { color: "#59616C", fontSize: "12px", fontWeight: 700 };
const metricValueStyle: CSSProperties = { color: "#6E5084", fontSize: "28px", lineHeight: 1 };
const analyticsNoteStyle: CSSProperties = { marginTop: "12px", padding: "11px 13px", borderRadius: "10px", background: "#F5FFF9", color: "#4D6658", fontSize: "12px", lineHeight: 1.5 };
const noticeStyle: CSSProperties = { marginBottom: "12px", padding: "10px 12px", border: "1px solid #DCCCE7", borderRadius: "10px", background: "#F7F1FC", color: "#4A4050", fontSize: "13px" };
const emptyStyle: CSSProperties = { padding: "18px", border: "1px dashed #D9D1DE", borderRadius: "12px", color: "#7D7D7D", fontSize: "13px", textAlign: "center" };
