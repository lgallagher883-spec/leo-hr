"use client";

import { useParams, useRouter } from "next/navigation";
import { useMatters } from "../MatterContext";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import { runLeoCore } from "@/leo/core/router";
import { generateLeoSummary } from "@/leo/response/summary";

import MatterHeader from "./components/MatterHeader";
import LeoConversation, {
  ConversationMessage,
} from "./components/LeoConversation";
import MatterDocuments from "./components/MatterDocuments";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TimelineEvent = {
  id: number;
  event_type: string;
  title: string;
  description: string | null;
  event_date: string;
  created_by: string | null;
};

export default function MatterDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { matters, setMatters } = useMatters();

  const id = Number(params.id);
  const matter = matters.find((m) => m.id === id);

  const [status, setStatus] = useState("");
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversationError, setConversationError] = useState("");
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [bundleFormat, setBundleFormat] = useState<"docx" | "pdf">("docx");
  const [includeTranscript, setIncludeTranscript] = useState(false);
  const [generatingBundle, setGeneratingBundle] = useState(false);
  const [bundleMessage, setBundleMessage] = useState("");
  const [openWorkspace, setOpenWorkspace] = useState<
    "documents" | "chronology" | "bundle" | "status" | "details" | null
  >(null);

  useEffect(() => {
    if (matter) setStatus(matter.status);
  }, [matter]);

  useEffect(() => {
    if (!matter) return;
    loadConversation();
    loadTimeline();
    // ensureMatterCreatedTimelineEvent();
  }, [matter?.id]);

  async function loadConversation() {
    if (!matter) return;

    setLoadingConversation(true);
    setConversationError("");

    try {
      const response = await fetch(`/api/matters/${matter.id}/messages`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const result = (await response.json()) as {
        success: boolean;
        messages?: Array<{
          id: number;
          role: "user" | "leo";
          content: string;
          created_at: string;
        }>;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error || "The Matter conversation could not be loaded.");
      }

      setConversation(
        (result.messages || []).map((message) => ({
          role: message.role,
          content: message.content,
        })),
      );
    } catch (error) {
      console.error("Error loading Matter conversation:", error);
      setConversationError(
        error instanceof Error
          ? error.message
          : "The Matter conversation could not be loaded.",
      );
    } finally {
      setLoadingConversation(false);
    }
  }

  async function loadTimeline() {
    if (!matter) return;

    setLoadingTimeline(true);

    const { data } = await supabase
      .from("matter_timeline")
      .select("*")
      .eq("matter_id", matter.id)
      .order("event_date", { ascending: true });

    setTimeline(data || []);
    setLoadingTimeline(false);
  }

  async function updateStatus() {
    if (!matter) return;

    const previousStatus = matter.status;

    setMatters(matters.map((m) => (m.id === id ? { ...m, status } : m)));

    const response = await fetch(`/api/matters/${matter.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    const result = (await response.json().catch(() => null)) as
      | {
          success?: boolean;
          error?: string;
        }
      | null;

    if (!response.ok || !result?.success) {
      console.error(
        "Error updating matter status:",
        result?.error || "The matter status could not be updated.",
      );
      return;
    }

    if (previousStatus !== status) {
      await loadTimeline();
    }

    setOpenWorkspace(null);
  }

  async function saveConversationMessage(message: ConversationMessage) {
    if (!matter) {
      throw new Error("The Matter is unavailable.");
    }

    const response = await fetch(`/api/matters/${matter.id}/messages`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = (await response.json()) as {
      success: boolean;
      message?: {
        id: number;
        role: "user" | "leo";
        content: string;
        created_at: string;
      };
      error?: string;
    };

    if (!response.ok || !result.success || !result.message) {
      throw new Error(result.error || "The conversation message could not be saved.");
    }

    return result.message;
  }

  async function sendToLeo() {
    const messageText = question.trim();

    if (!messageText || !matter || sendingMessage) return;

    setSendingMessage(true);
    setConversationError("");

    const userMessage: ConversationMessage = {
      role: "user",
      content: messageText,
    };

    try {
      await saveConversationMessage(userMessage);

      setConversation((previous) => [...previous, userMessage]);
      setQuestion("");

      const fullConversation = [...conversation, userMessage]
        .map((message) => `${message.role}: ${message.content}`)
        .join("\n\n");

      const matterContext = `
Matter ID: ${matter.id}
Matter Title: ${matter.title}
Matter Description: ${matter.description || "No description provided"}
Matter Status: ${matter.status}

Conversation so far:
${fullConversation}

Latest User Message:
${messageText}
`;

      const response = await fetch("/api/ask-leo", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: matterContext }),
      });

      const data = (await response.json().catch(() => null)) as
        | { response?: string; reply?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error || "Leo could not complete the response.");
      }

      const leoMessage: ConversationMessage = {
        role: "leo",
        content:
          data?.response ||
          data?.reply ||
          "Leo was unable to generate a response.",
      };

      await saveConversationMessage(leoMessage);
      setConversation((previous) => [...previous, leoMessage]);
    } catch (error) {
      console.error("Matter conversation error:", error);
      setConversationError(
        error instanceof Error
          ? `${error.message} Your message remains saved in this Matter.`
          : "Leo could not complete the response. Your message remains saved in this Matter.",
      );
    } finally {
      setSendingMessage(false);
    }
  }

  async function generateMatterBundle() {
    if (!matter) return;

    setGeneratingBundle(true);
    setBundleMessage("");

    try {
      const response = await fetch(`/api/matters/${matter.id}/bundle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          format: bundleFormat,
          includeTranscript,
        }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(result?.error || "Matter bundle generation failed.");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition") || "";
      const match = /filename=\"([^\"]+)\"/i.exec(contentDisposition);
      const filename =
        match?.[1] ||
        `matter-${matter.id}-bundle.${bundleFormat === "pdf" ? "pdf" : "docx"}`;

      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);

      setBundleMessage("Matter Bundle generated.");
    } catch (error) {
      console.error("Matter bundle error:", error);
      setBundleMessage(
        error instanceof Error
          ? error.message
          : "Matter bundle could not be generated.",
      );
    } finally {
      setGeneratingBundle(false);
    }
  }

  if (!matter) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Matter not found</h2>
        <button onClick={() => router.push("/dashboard/matters")}>Back</button>
      </div>
    );
  }

  const summaryResult = runLeoCore(
    `${matter.title}\n${matter.description || ""}`
  );

  const leoSummary = generateLeoSummary(
    summaryResult,
    matter.description || matter.title
  );

  return (
    <div style={pageStyle}>
      <section style={matterHeroStyle}>
        <MatterHeader
          title={matter.title}
          status={status}
          onBack={() => router.push("/dashboard/matters")}
        />

        <div style={assessmentCardStyle}>
          <div style={assessmentEyebrowStyle}>LEO Assessment</div>

          <div style={assessmentGridStyle}>
            <div style={assessmentColumnStyle}>
              <div style={assessmentLabelStyle}>Current understanding</div>
              <div style={assessmentTextStyle}>
                {leoSummary.understanding}
              </div>
            </div>

            <div style={assessmentDividerColumnStyle}>
              <div style={assessmentLabelStyle}>Recommended next step</div>
              <div style={assessmentTextStyle}>
                {leoSummary.nextStep}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={conversationPanelStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionTitleStyle}>Conversation</div>
          <div style={sectionSubtitleStyle}>
            Work through this Matter with Leo.
          </div>
        </div>

        <div style={conversationBodyStyle}>
          {loadingConversation ? (
            <MutedText>Loading conversation...</MutedText>
          ) : (
            <LeoConversation conversation={conversation} />
          )}
        </div>

        {conversationError && (
          <div style={conversationErrorStyle}>{conversationError}</div>
        )}

        <div style={composerStyle}>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Update Leo or ask what to do next..."
            style={conversationTextareaStyle}
          />

          <button
            onClick={sendToLeo}
            style={{
              ...darkButtonStyle,
              opacity: sendingMessage || !question.trim() ? 0.6 : 1,
            }}
            disabled={sendingMessage || !question.trim()}
          >
            {sendingMessage ? "Sending..." : "Send to Leo"}
          </button>
        </div>
      </section>

      <section style={workspacePanelStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionTitleStyle}>Matter Workspace</div>
          <div style={sectionSubtitleStyle}>
            Open supporting records and tools only when needed.
          </div>
        </div>

        <div style={workspaceGridStyle}>
          <WorkspaceCard
            title="Documents"
            summary="Evidence, uploaded files and LEO-generated documents."
            meta="Open documents"
            onOpen={() => setOpenWorkspace("documents")}
          />

          <WorkspaceCard
            title="Case Chronology"
            summary="The dated record of this Matter as it develops."
            meta={`${timeline.length} ${timeline.length === 1 ? "event" : "events"}`}
            onOpen={() => setOpenWorkspace("chronology")}
          />

          <WorkspaceCard
            title="Matter Bundle"
            summary="Generate the Matter record for review or disclosure."
            meta="Ready to generate"
            onOpen={() => setOpenWorkspace("bundle")}
          />

          <WorkspaceCard
            title="Matter Status"
            summary="Review and update the current Matter status."
            meta={status}
            onOpen={() => setOpenWorkspace("status")}
          />

          <WorkspaceCard
            title="Matter Details"
            summary="View the Matter reference and recorded issue."
            meta={`Matter #${matter.id}`}
            onOpen={() => setOpenWorkspace("details")}
          />
        </div>
      </section>

      {openWorkspace && (
        <div style={overlayStyle} onClick={() => setOpenWorkspace(null)}>
          <aside
            style={drawerStyle}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={drawerHeaderStyle}>
              <div>
                <div style={drawerTitleStyle}>
                  {workspaceTitle(openWorkspace)}
                </div>
                <div style={drawerSubtitleStyle}>
                  Matter #{matter.id} · {matter.title}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpenWorkspace(null)}
                style={closeButtonStyle}
                aria-label="Close workspace"
              >
                ×
              </button>
            </div>

            <div style={drawerContentStyle}>
              {openWorkspace === "documents" && (
                <MatterDocuments matterId={matter.id} />
              )}

              {openWorkspace === "chronology" && (
                <div>
                  <div style={drawerActionRowStyle}>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      style={secondaryButtonStyle}
                    >
                      Print chronology
                    </button>
                  </div>

                  {loadingTimeline ? (
                    <MutedText>Loading chronology...</MutedText>
                  ) : timeline.length === 0 ? (
                    <MutedText>
                      No chronology entries have been recorded yet.
                    </MutedText>
                  ) : (
                    <div style={timelineListStyle}>
                      {timeline.map((event) => (
                        <div key={event.id} style={timelineItemStyle}>
                          <div style={timelineDateStyle}>
                            {formatDate(event.event_date)}
                          </div>

                          <div style={timelineTitleStyle}>{event.title}</div>

                          {event.description && (
                            <div style={timelineDescriptionStyle}>
                              {event.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {openWorkspace === "bundle" && (
                <div>
                  <select
                    value={bundleFormat}
                    onChange={(event) =>
                      setBundleFormat(
                        event.target.value === "pdf" ? "pdf" : "docx",
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="docx">Word (.docx)</option>
                    <option value="pdf">PDF</option>
                  </select>

                  <label style={checkboxRowStyle}>
                    <input
                      type="checkbox"
                      checked={includeTranscript}
                      onChange={(event) =>
                        setIncludeTranscript(event.target.checked)
                      }
                    />
                    <span style={{ marginLeft: "8px" }}>
                      Include complete LEO transcript as appendix
                    </span>
                  </label>

                  <button
                    onClick={generateMatterBundle}
                    style={purpleButtonStyle}
                    disabled={generatingBundle}
                  >
                    {generatingBundle
                      ? "Generating..."
                      : "Generate Matter Bundle"}
                  </button>

                  {bundleMessage && (
                    <div style={bundleMessageStyle}>{bundleMessage}</div>
                  )}
                </div>
              )}

              {openWorkspace === "status" && (
                <div>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Needs Attention">Needs Attention</option>
                    <option value="Closed">Closed</option>
                  </select>

                  <button onClick={updateStatus} style={purpleButtonStyle}>
                    Save Status
                  </button>
                </div>
              )}

              {openWorkspace === "details" && (
                <div style={detailsGridStyle}>
                  <DetailItem label="Matter reference" value={`#${matter.id}`} />
                  <DetailItem label="Status" value={status} />
                  <DetailItem
                    label="Description"
                    value={matter.description || "No description"}
                    fullWidth
                  />
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function WorkspaceCard({
  title,
  summary,
  meta,
  onOpen,
}: {
  title: string;
  summary: string;
  meta: string;
  onOpen: () => void;
}) {
  return (
    <div style={workspaceCardStyle}>
      <div style={workspaceCardTitleStyle}>{title}</div>
      <div style={workspaceCardSummaryStyle}>{summary}</div>

      <div style={workspaceCardFooterStyle}>
        <span style={workspaceMetaStyle}>{meta}</span>
        <button type="button" onClick={onOpen} style={openButtonStyle}>
          Open
        </button>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined }}>
      <div style={detailLabelStyle}>{label}</div>
      <div style={detailValueStyle}>{value}</div>
    </div>
  );
}

function MutedText({ children }: { children: React.ReactNode }) {
  return <div style={mutedTextStyle}>{children}</div>;
}

function workspaceTitle(
  workspace: "documents" | "chronology" | "bundle" | "status" | "details",
) {
  if (workspace === "documents") return "Matter Documents";
  if (workspace === "chronology") return "Case Chronology";
  if (workspace === "bundle") return "Matter Bundle";
  if (workspace === "status") return "Matter Status";
  return "Matter Details";
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const pageStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1120px",
  minWidth: 0,
};

const matterHeroStyle: React.CSSProperties = {
  background: "#F7F1FC",
  border: "1px solid #E8DAF2",
  borderRadius: "16px",
  padding: "16px 18px",
  minWidth: 0,
};

const assessmentCardStyle: React.CSSProperties = {
  marginTop: "10px",
  padding: "12px 14px",
  background: "#FFFFFF",
  border: "1px solid #E7E1EB",
  borderRadius: "12px",
  minWidth: 0,
};

const assessmentEyebrowStyle: React.CSSProperties = {
  marginBottom: "10px",
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const assessmentGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "0",
  minWidth: 0,
};

const assessmentColumnStyle: React.CSSProperties = {
  paddingRight: "16px",
  minWidth: 0,
};

const assessmentDividerColumnStyle: React.CSSProperties = {
  paddingLeft: "16px",
  borderLeft: "1px solid #E5E7EB",
  minWidth: 0,
};

const assessmentLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#111827",
};

const assessmentTextStyle: React.CSSProperties = {
  marginTop: "4px",
  fontSize: "13px",
  lineHeight: 1.45,
  color: "#374151",
  overflowWrap: "anywhere",
};

const conversationPanelStyle: React.CSSProperties = {
  marginTop: "14px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  overflow: "hidden",
  minWidth: 0,
};

const workspacePanelStyle: React.CSSProperties = {
  marginTop: "14px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  overflow: "hidden",
  minWidth: 0,
};

const sectionHeaderStyle: React.CSSProperties = {
  padding: "13px 16px",
  borderBottom: "1px solid #EEF0F3",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#111827",
};

const sectionSubtitleStyle: React.CSSProperties = {
  marginTop: "3px",
  fontSize: "12px",
  color: "#6B7280",
};

const conversationBodyStyle: React.CSSProperties = {
  height: "460px",
  overflowY: "auto",
  overflowX: "hidden",
  padding: "14px 16px",
  background: "#FCFCFD",
  minWidth: 0,
};

const composerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "end",
  gap: "10px",
  padding: "12px 16px",
  borderTop: "1px solid #EEF0F3",
};

const conversationTextareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "64px",
  maxHeight: "140px",
  resize: "vertical",
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
  fontFamily: "inherit",
  fontSize: "14px",
  boxSizing: "border-box",
};

const workspaceGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "10px",
  padding: "12px",
};

const workspaceCardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minHeight: "142px",
  minWidth: 0,
  overflow: "hidden",
  padding: "14px",
  border: "1px solid #E7E1EB",
  borderRadius: "12px",
  background: "#FCFAFD",
};

const workspaceCardTitleStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#111827",
};

const workspaceCardSummaryStyle: React.CSSProperties = {
  marginTop: "6px",
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: 1.5,
};

const workspaceCardFooterStyle: React.CSSProperties = {
  marginTop: "auto",
  paddingTop: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
};

const workspaceMetaStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 600,
};

const openButtonStyle: React.CSSProperties = {
  border: "1px solid #CDB2E2",
  background: "#FFFFFF",
  color: "#6E5084",
  padding: "7px 11px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 700,
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  justifyContent: "flex-end",
  background: "rgba(17, 24, 39, 0.32)",
};

const drawerStyle: React.CSSProperties = {
  width: "min(760px, 94vw)",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  background: "#F8F7FA",
  boxShadow: "-12px 0 35px rgba(17, 24, 39, 0.18)",
  minWidth: 0,
};

const drawerHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
  padding: "16px 18px",
  borderBottom: "1px solid #E5E7EB",
  background: "#FFFFFF",
};

const drawerTitleStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#111827",
};

const drawerSubtitleStyle: React.CSSProperties = {
  marginTop: "3px",
  fontSize: "12px",
  color: "#6B7280",
};

const closeButtonStyle: React.CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "9px",
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  color: "#4B5563",
  cursor: "pointer",
  fontSize: "22px",
};

const drawerContentStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  padding: "16px",
  minWidth: 0,
};

const drawerActionRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: "12px",
};

const timelineListStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const timelineItemStyle: React.CSSProperties = {
  padding: "12px 14px",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  background: "#FFFFFF",
};

const timelineDateStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "11px",
  fontWeight: 700,
};

const timelineTitleStyle: React.CSSProperties = {
  marginTop: "4px",
  fontSize: "14px",
  fontWeight: 700,
  color: "#111827",
};

const timelineDescriptionStyle: React.CSSProperties = {
  marginTop: "5px",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.5,
};

const detailsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#6B7280",
  textTransform: "uppercase",
};

const detailValueStyle: React.CSSProperties = {
  marginTop: "5px",
  color: "#111827",
  fontSize: "14px",
  lineHeight: 1.5,
  overflowWrap: "anywhere",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
  boxSizing: "border-box",
};

const checkboxRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  marginTop: "12px",
  color: "#374151",
  fontSize: "14px",
};

const conversationErrorStyle: React.CSSProperties = {
  margin: "10px 16px 0",
  padding: "10px 12px",
  border: "1px solid #FECACA",
  borderRadius: "8px",
  background: "#FEF2F2",
  color: "#991B1B",
  fontSize: "13px",
};

const bundleMessageStyle: React.CSSProperties = {
  marginTop: "10px",
  color: "#4B5563",
  fontSize: "13px",
};

const mutedTextStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#6B7280",
};

const darkButtonStyle: React.CSSProperties = {
  background: "#111827",
  color: "#FFFFFF",
  border: "none",
  padding: "10px 14px",
  borderRadius: "9px",
  cursor: "pointer",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const purpleButtonStyle: React.CSSProperties = {
  marginTop: "12px",
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  padding: "10px 14px",
  borderRadius: "9px",
  cursor: "pointer",
  fontWeight: 600,
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  padding: "9px 12px",
  borderRadius: "9px",
  cursor: "pointer",
  fontWeight: 700,
};