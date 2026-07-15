"use client";

import {
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Message = {
  role: "user" | "leo";
  content: string;
};

type SarRequest = {
  id: number;
  employee_id: number;
  matter_id: number | null;
  request_title: string;
  request_summary: string | null;
  request_received_date: string;
  response_due_date: string;
  extended_due_date: string | null;
  status: string;
  request_source: string | null;
  assigned_to: string | null;
  scope_notes: string | null;
  extension_applied: boolean;
  extension_reason: string | null;
  identity_verified: boolean;
  collection_complete: boolean;
  review_complete: boolean;
  redaction_complete: boolean;
  disclosure_sent: boolean;
};

type Employee = {
  id: number;
  name: string;
  email: string | null;
  role: string | null;
};

type Matter = {
  id: number;
  title: string;
  subject: string | null;
  description: string | null;
  status: string | null;
  matter_type: string | null;
};

type SarDocument = {
  id: number;
  document_type: string;
  title: string;
  review_status: string;
  notes: string | null;
};

type TimelineEvent = {
  id: number;
  title: string;
  description: string | null;
  event_date: string;
  created_by: string | null;
};

type SarContext = {
  sar: SarRequest;
  employee: Employee | null;
  matter: Matter | null;
  documents: SarDocument[];
  timeline: TimelineEvent[];
};

export default function AskLeoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasSentDashboardPrompt = useRef(false);

  const sarIdValue =
    searchParams.get("sarId");

  const sarId = sarIdValue
    ? Number(sarIdValue)
    : null;

  const [messages, setMessages] =
    useState<Message[]>([
      {
        role: "leo",
        content:
          "Hi, I’m Leo. How can I help you today?",
      },
    ]);

  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    loadingSarContext,
    setLoadingSarContext,
  ] = useState(false);

  const [
    sarContextError,
    setSarContextError,
  ] = useState("");

  const [sarContext, setSarContext] =
    useState<SarContext | null>(null);

  const [
    shouldCreateMatter,
    setShouldCreateMatter,
  ] = useState(false);

  useEffect(() => {
    if (
      !sarId ||
      !Number.isFinite(sarId)
    ) {
      setSarContext(null);
      setSarContextError("");
      return;
    }

    loadSarContext(sarId);
  }, [sarId]);

  useEffect(() => {
    const prompt =
      searchParams.get("prompt");

    if (
      !prompt ||
      hasSentDashboardPrompt.current
    ) {
      return;
    }

    if (
      sarId &&
      loadingSarContext
    ) {
      return;
    }

    hasSentDashboardPrompt.current =
      true;

    sendMessage(prompt);
  }, [
    loadingSarContext,
    sarId,
    searchParams,
  ]);

  async function loadSarContext(
    selectedSarId: number
  ) {
    setLoadingSarContext(true);
    setSarContextError("");

    try {
      const {
        data: sarData,
        error: sarError,
      } = await supabase
        .from("employee_sars")
        .select("*")
        .eq("id", selectedSarId)
        .single();

      if (
        sarError ||
        !sarData
      ) {
        throw (
          sarError ||
          new Error(
            "SAR could not be found."
          )
        );
      }

      const sar =
        sarData as SarRequest;

      const [
        employeeResult,
        matterResult,
        documentResult,
        timelineResult,
      ] = await Promise.all([
        supabase
          .from("employees")
          .select(
            "id,name,email,role"
          )
          .eq(
            "id",
            sar.employee_id
          )
          .single(),

        sar.matter_id
          ? supabase
              .from("matters")
              .select(
                "id,title,subject,description,status,matter_type"
              )
              .eq(
                "id",
                sar.matter_id
              )
              .single()
          : Promise.resolve({
              data: null,
              error: null,
            }),

        supabase
          .from(
            "employee_sar_documents"
          )
          .select(
            "id,document_type,title,review_status,notes"
          )
          .eq(
            "sar_id",
            selectedSarId
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from(
            "employee_sar_timeline"
          )
          .select(
            "id,title,description,event_date,created_by"
          )
          .eq(
            "sar_id",
            selectedSarId
          )
          .order("event_date", {
            ascending: false,
          }),
      ]);

      if (
        employeeResult.error
      ) {
        console.error(
          "Error loading SAR employee:",
          employeeResult.error
        );
      }

      if (
        matterResult.error
      ) {
        console.error(
          "Error loading linked Matter:",
          matterResult.error
        );
      }

      if (
        documentResult.error
      ) {
        console.error(
          "Error loading SAR documents:",
          documentResult.error
        );
      }

      if (
        timelineResult.error
      ) {
        console.error(
          "Error loading SAR chronology:",
          timelineResult.error
        );
      }

      const loadedContext: SarContext =
        {
          sar,
          employee:
            employeeResult.data ||
            null,
          matter:
            matterResult.data ||
            null,
          documents:
            documentResult.data ||
            [],
          timeline:
            timelineResult.data ||
            [],
        };

      setSarContext(
        loadedContext
      );

      setMessages([
        {
          role: "leo",
          content:
            buildSarWelcomeMessage(
              loadedContext
            ),
        },
      ]);
    } catch (error) {
      console.error(
        "Error loading SAR context:",
        error
      );

      setSarContext(null);

      setSarContextError(
        "Leo could not load this SAR. You can still ask a general question, or return to the SAR workspace."
      );
    } finally {
      setLoadingSarContext(false);
    }
  }

  async function sendMessage(
    messageOverride?: string
  ) {
    const messageText = (
      messageOverride ||
      input
    ).trim();

    if (
      !messageText ||
      loading
    ) {
      return;
    }

    const userMessage: Message =
      {
        role: "user",
        content: messageText,
      };

    const conversationBeforeReply =
      [...messages, userMessage];

    setMessages(
      conversationBeforeReply
    );

    setInput("");
    setLoading(true);
    setShouldCreateMatter(false);

    try {
      const messageForLeo =
        buildMessageForLeo(
          messageText,
          conversationBeforeReply,
          sarContext
        );

      const response = await fetch(
        "/api/ask-leo",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            message: messageForLeo,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Leo could not process the request."
        );
      }

      const leoMessage: Message =
        {
          role: "leo",
          content:
            data.response ||
            data.reply ||
            "Leo was unable to generate a response.",
        };

      setMessages((previous) => [
        ...previous,
        leoMessage,
      ]);

      setShouldCreateMatter(
        !sarContext &&
          Boolean(
            data.shouldCreateMatter
          )
      );
    } catch (error) {
      console.error(
        "Error connecting to Leo:",
        error
      );

      setMessages((previous) => [
        ...previous,
        {
          role: "leo",
          content:
            "I couldn’t complete that response. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function createMatter() {
    const lastUserMessage =
      [...messages]
        .reverse()
        .find(
          (message) =>
            message.role === "user"
        );

    const payload = {
      title:
        lastUserMessage?.content?.slice(
          0,
          60
        ) || "New HR Matter",

      subject:
        lastUserMessage?.content?.slice(
          0,
          60
        ) || "New HR Matter",

      description:
        lastUserMessage?.content ||
        "",

      risk: shouldCreateMatter
        ? "medium"
        : "low",

      suggestedNextStep:
        "Review and confirm details before submission",
    };

    localStorage.setItem(
      "leo_matter_draft",
      JSON.stringify(payload)
    );

    router.push(
      "/dashboard/matters/new"
    );
  }

  function handleInputKeyDown(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  }

  const contextSummary =
    useMemo(() => {
      if (!sarContext) {
        return null;
      }

      const completedStages =
        [
          sarContext.sar
            .identity_verified,
          sarContext.sar
            .collection_complete,
          sarContext.sar
            .review_complete,
          sarContext.sar
            .redaction_complete,
          sarContext.sar
            .disclosure_sent,
        ].filter(Boolean).length;

      return {
        deadline:
          sarContext.sar
            .extended_due_date ||
          sarContext.sar
            .response_due_date,

        completedStages,
      };
    }, [sarContext]);

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            Ask Leo
          </h1>

          <p style={subtitleStyle}>
            {sarContext
              ? "Work through this Subject Access Request with Leo."
              : "Ask Leo about a workplace question or begin a new Matter."}
          </p>
        </div>

        {sarContext && (
          <button
            onClick={() =>
              router.push(
                `/dashboard/sar-requests/${sarContext.sar.id}`
              )
            }
            style={
              secondaryButtonStyle
            }
          >
            Back to SAR
          </button>
        )}
      </div>

      {loadingSarContext && (
        <div style={noticeStyle}>
          Loading SAR context...
        </div>
      )}

      {sarContextError && (
        <div style={errorStyle}>
          {sarContextError}
        </div>
      )}

      {sarContext &&
        contextSummary && (
          <div
            style={contextCardStyle}
          >
            <div
              style={
                contextHeaderStyle
              }
            >
              <div>
                <div
                  style={
                    contextEyebrowStyle
                  }
                >
                  SAR context loaded
                </div>

                <div
                  style={
                    contextTitleStyle
                  }
                >
                  {
                    sarContext.sar
                      .request_title
                  }
                </div>
              </div>

              <span
                style={
                  contextStatusStyle
                }
              >
                {
                  sarContext.sar
                    .status
                }
              </span>
            </div>

            <div
              style={
                contextGridStyle
              }
            >
              <ContextItem
                label="Employee"
                value={
                  sarContext.employee
                    ?.name ||
                  "Unknown employee"
                }
              />

              <ContextItem
                label="Linked Matter"
                value={
                  sarContext.matter
                    ?.subject ||
                  sarContext.matter
                    ?.title ||
                  "No Matter linked"
                }
              />

              <ContextItem
                label="Deadline"
                value={formatDate(
                  contextSummary.deadline
                )}
              />

              <ContextItem
                label="Progress"
                value={`${contextSummary.completedStages} of 5 stages complete`}
              />
            </div>

            {sarContext.sar
              .request_summary && (
              <div
                style={
                  contextSummaryStyle
                }
              >
                <strong>
                  Request summary:
                </strong>{" "}
                {
                  sarContext.sar
                    .request_summary
                }
              </div>
            )}
          </div>
        )}

      <div style={chatShellStyle}>
        <div style={chatBoxStyle}>
          {messages.map(
            (message, index) => (
              <div
                key={`${message.role}-${index}`}
                style={{
                  ...messageStyle,
                  ...(message.role ===
                  "user"
                    ? userMessageStyle
                    : leoMessageStyle),
                }}
              >
                {message.content}
              </div>
            )
          )}

          {loading && (
            <div
              style={{
                ...messageStyle,
                ...leoMessageStyle,
                color: "#6B7280",
              }}
            >
              Leo is thinking...
            </div>
          )}
        </div>

        {shouldCreateMatter && (
          <div
            style={
              matterActionStyle
            }
          >
            <button
              onClick={createMatter}
              style={
                matterButtonStyle
              }
            >
              Create HR Matter
            </button>
          </div>
        )}

        <div style={composerStyle}>
          <input
            value={input}
            onChange={(event) =>
              setInput(
                event.target.value
              )
            }
            placeholder={
              sarContext
                ? "Ask Leo what to do next with this SAR..."
                : "Ask Leo something..."
            }
            style={inputStyle}
            onKeyDown={
              handleInputKeyDown
            }
            disabled={
              loading ||
              loadingSarContext
            }
          />

          <button
            onClick={() =>
              sendMessage()
            }
            disabled={
              loading ||
              loadingSarContext ||
              !input.trim()
            }
            style={{
              ...sendButtonStyle,
              opacity:
                loading ||
                loadingSarContext ||
                !input.trim()
                  ? 0.6
                  : 1,
            }}
          >
            {loading
              ? "..."
              : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

function buildSarWelcomeMessage(
  context: SarContext
) {
  const employeeName =
    context.employee?.name ||
    "the employee";

  const deadline =
    context.sar
      .extended_due_date ||
    context.sar
      .response_due_date;

  const linkedMatter =
    context.matter
      ? ` It is linked to the Matter “${
          context.matter.subject ||
          context.matter.title
        }”.`
      : " It is currently being managed as a standalone SAR.";

  return `I’ve loaded the Subject Access Request for ${employeeName}.${linkedMatter} The current status is ${context.sar.status}, and the response deadline is ${formatDate(
    deadline
  )}. What would you like to work through first?`;
}

function buildMessageForLeo(
  latestMessage: string,
  messages: Message[],
  context: SarContext | null
) {
  if (!context) {
    return latestMessage;
  }

  const sar =
    context.sar;

  const completedStages = [
    `Identity verified: ${
      sar.identity_verified
        ? "Yes"
        : "No"
    }`,
    `Records collected: ${
      sar.collection_complete
        ? "Yes"
        : "No"
    }`,
    `Records reviewed: ${
      sar.review_complete
        ? "Yes"
        : "No"
    }`,
    `Redaction complete: ${
      sar.redaction_complete
        ? "Yes"
        : "No"
    }`,
    `Disclosure sent: ${
      sar.disclosure_sent
        ? "Yes"
        : "No"
    }`,
  ].join("\n");

  const documentSummary =
    context.documents.length > 0
      ? context.documents
          .map(
            (documentItem) =>
              `- ${documentItem.document_type}: ${documentItem.title} (${documentItem.review_status})${
                documentItem.notes
                  ? ` — ${documentItem.notes}`
                  : ""
              }`
          )
          .join("\n")
      : "- No documents have been added.";

  const timelineSummary =
    context.timeline.length > 0
      ? context.timeline
          .slice(0, 10)
          .map(
            (event) =>
              `- ${formatDateTime(
                event.event_date
              )}: ${event.title}${
                event.description
                  ? ` — ${event.description}`
                  : ""
              }`
          )
          .join("\n")
      : "- No chronology entries have been recorded.";

  const recentConversation =
    messages
      .slice(-8)
      .map(
        (message) =>
          `${
            message.role ===
            "leo"
              ? "Leo"
              : "Employer"
          }: ${message.content}`
      )
      .join("\n\n");

  return `
The employer is asking Leo about an existing Subject Access Request.

Treat the SAR information below as live case context.

SUBJECT ACCESS REQUEST

SAR ID:
${sar.id}

Title:
${sar.request_title}

Employee:
${
  context.employee?.name ||
  "Unknown employee"
}

Employee role:
${
  context.employee?.role ||
  "Not recorded"
}

Employee email:
${
  context.employee?.email ||
  "Not recorded"
}

Linked Matter:
${
  context.matter
    ? `${
        context.matter
          .subject ||
        context.matter.title
      }`
    : "No Matter linked"
}

Linked Matter status:
${
  context.matter?.status ||
  "Not applicable"
}

Linked Matter type:
${
  context.matter
    ?.matter_type ||
  "Not recorded"
}

Linked Matter description:
${
  context.matter
    ?.description ||
  "Not recorded"
}

Request received:
${sar.request_received_date}

Original deadline:
${sar.response_due_date}

Effective deadline:
${
  sar.extended_due_date ||
  sar.response_due_date
}

Current SAR status:
${sar.status}

Request source:
${
  sar.request_source ||
  "Not recorded"
}

Owner:
${
  sar.assigned_to ||
  "Not assigned"
}

Request summary:
${
  sar.request_summary ||
  "No summary recorded"
}

Scope notes:
${
  sar.scope_notes ||
  "No scope notes recorded"
}

Extension applied:
${
  sar.extension_applied
    ? "Yes"
    : "No"
}

Extension reason:
${
  sar.extension_reason ||
  "Not applicable"
}

PROGRESS

${completedStages}

DOCUMENTS

${documentSummary}

RECENT CHRONOLOGY

${timelineSummary}

RECENT CONVERSATION

${recentConversation}

LATEST EMPLOYER MESSAGE

${latestMessage}

Respond as Leo, the employer's retained HR consultant.

Keep the advice specific to this SAR.

Use the SAR facts above.

Do not ask the employer to repeat information already recorded.

Guide the employer through the next proportionate stage of the SAR.
`.trim();
}

function ContextItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={contextItemStyle}>
      <div
        style={
          contextItemLabelStyle
        }
      >
        {label}
      </div>

      <div
        style={
          contextItemValueStyle
        }
      >
        {value}
      </div>
    </div>
  );
}

function formatDate(
  value: string
) {
  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatDateTime(
  value: string
) {
  return new Date(
    value
  ).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const pageStyle: React.CSSProperties =
  {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    minHeight: "75vh",
  };

const headerStyle: React.CSSProperties =
  {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "16px",
  };

const titleStyle: React.CSSProperties =
  {
    margin: 0,
    fontSize: "26px",
    fontWeight: 700,
    color: "#111827",
  };

const subtitleStyle: React.CSSProperties =
  {
    color: "#6B7280",
    margin: "6px 0 0",
    fontSize: "14px",
  };

const noticeStyle: React.CSSProperties =
  {
    background: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: "10px",
    padding: "11px 12px",
    color: "#6B7280",
    fontSize: "13px",
    marginBottom: "14px",
  };

const errorStyle: React.CSSProperties =
  {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: "10px",
    padding: "11px 12px",
    color: "#991B1B",
    fontSize: "13px",
    marginBottom: "14px",
  };

const contextCardStyle: React.CSSProperties =
  {
    background: "#FBF8FD",
    border: "1px solid #E8DDF0",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "16px",
  };

const contextHeaderStyle: React.CSSProperties =
  {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "13px",
  };

const contextEyebrowStyle: React.CSSProperties =
  {
    color: "#6E5084",
    fontSize: "11px",
    fontWeight: 700,
    textTransform:
      "uppercase",
    letterSpacing: "0.04em",
    marginBottom: "4px",
  };

const contextTitleStyle: React.CSSProperties =
  {
    color: "#111827",
    fontSize: "16px",
    fontWeight: 700,
  };

const contextStatusStyle: React.CSSProperties =
  {
    background: "#FFFFFF",
    color: "#6E5084",
    border: "1px solid #D8C8E5",
    borderRadius: "999px",
    padding: "5px 9px",
    fontSize: "11px",
    fontWeight: 700,
  };

const contextGridStyle: React.CSSProperties =
  {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "10px",
  };

const contextItemStyle: React.CSSProperties =
  {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "10px",
    padding: "10px",
  };

const contextItemLabelStyle: React.CSSProperties =
  {
    color: "#6B7280",
    fontSize: "10px",
    marginBottom: "4px",
  };

const contextItemValueStyle: React.CSSProperties =
  {
    color: "#111827",
    fontSize: "12px",
    fontWeight: 700,
    wordBreak: "break-word",
  };

const contextSummaryStyle: React.CSSProperties =
  {
    marginTop: "11px",
    color: "#5F5368",
    fontSize: "12px",
    lineHeight: 1.55,
  };

const chatShellStyle: React.CSSProperties =
  {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  };

const chatBoxStyle: React.CSSProperties =
  {
    flex: 1,
    minHeight: "420px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "14px",
    padding: "16px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };

const messageStyle: React.CSSProperties =
  {
    padding: "10px 12px",
    borderRadius: "12px",
    maxWidth: "76%",
    fontSize: "14px",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
  };

const userMessageStyle: React.CSSProperties =
  {
    alignSelf: "flex-end",
    background: "#6E5084",
    color: "#FFFFFF",
  };

const leoMessageStyle: React.CSSProperties =
  {
    alignSelf: "flex-start",
    background: "#F3F4F6",
    color: "#111827",
  };

const matterActionStyle: React.CSSProperties =
  {
    marginTop: "12px",
  };

const composerStyle: React.CSSProperties =
  {
    display: "flex",
    gap: "10px",
    marginTop: "12px",
  };

const inputStyle: React.CSSProperties =
  {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #E5E7EB",
    fontSize: "14px",
  };

const sendButtonStyle: React.CSSProperties =
  {
    background: "#6E5084",
    color: "#FFFFFF",
    border: "none",
    padding: "12px 16px",
    borderRadius: "10px",
    fontWeight: 600,
    cursor: "pointer",
  };

const matterButtonStyle: React.CSSProperties =
  {
    background: "#6E5084",
    color: "#FFFFFF",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
  };

const secondaryButtonStyle: React.CSSProperties =
  {
    background: "#FFFFFF",
    color: "#4B5563",
    border: "1px solid #D1D5DB",
    padding: "9px 12px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  };