"use client";

import { useParams, useRouter } from "next/navigation";
import { useMatters } from "../MatterContext";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import { runLeoCore } from "@/leo/core/router";
import { generateLeoSummary } from "@/leo/response/summary";

import MatterHeader from "./components/MatterHeader";
import LeoSummary from "./components/LeoSummary";
import LeoConversation, {
  ConversationMessage,
} from "./components/LeoConversation";

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
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const [timelineTitle, setTimelineTitle] = useState("");
  const [timelineDescription, setTimelineDescription] = useState("");

  useEffect(() => {
    if (matter) setStatus(matter.status);
  }, [matter]);

  useEffect(() => {
    if (!matter) return;
    loadConversation();
    loadTimeline();
    ensureMatterCreatedTimelineEvent();
  }, [matter?.id]);

  async function loadConversation() {
    if (!matter) return;

    setLoadingConversation(true);

    const { data } = await supabase
      .from("matter_messages")
      .select("*")
      .eq("matter_id", matter.id)
      .order("created_at", { ascending: true });

    setConversation(
      (data || []).map((message: any) => ({
        role: message.role,
        content: message.content,
      }))
    );

    setLoadingConversation(false);
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

  async function addTimelineEvent({
    eventType,
    title,
    description,
    createdBy = "System",
  }: {
    eventType: string;
    title: string;
    description?: string;
    createdBy?: string;
  }) {
    if (!matter) return;

    const { error } = await supabase.from("matter_timeline").insert({
      matter_id: matter.id,
      event_type: eventType,
      title,
      description: description || null,
      created_by: createdBy,
    });

    if (error) {
      console.error("Error saving timeline event:", error);
      return;
    }

    await loadTimeline();
  }

  async function ensureMatterCreatedTimelineEvent() {
    if (!matter) return;

    const { data } = await supabase
      .from("matter_timeline")
      .select("id")
      .eq("matter_id", matter.id)
      .eq("event_type", "matter_created")
      .limit(1);

    if (data && data.length > 0) return;

    await addTimelineEvent({
      eventType: "matter_created",
      title: "Matter created",
      description: matter.description || "Matter record created.",
    });
  }

  async function updateStatus() {
    if (!matter) return;

    const previousStatus = matter.status;

    setMatters(matters.map((m) => (m.id === id ? { ...m, status } : m)));

    const { error } = await supabase
      .from("matters")
      .update({ status })
      .eq("id", matter.id);

    if (error) {
      console.error("Error updating matter status:", error);
      return;
    }

    if (previousStatus !== status) {
      await addTimelineEvent({
        eventType: "status_changed",
        title: "Matter status updated",
        description: `Status changed from ${previousStatus} to ${status}.`,
      });
    }
  }

  async function sendToLeo() {
    if (!question.trim() || !matter) return;

    const userMessage: ConversationMessage = {
      role: "user",
      content: question,
    };

    const fullConversation = [...conversation, userMessage]
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n\n");

    const matterContext = `
Matter Title: ${matter.title}
Matter Description: ${matter.description || "No description provided"}
Matter Status: ${matter.status}

Conversation so far:
${fullConversation}

Latest User Message:
${question}
`;

    const response = await fetch("/api/ask-leo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: matterContext }),
    });

    if (!response.ok) return;

    const data = await response.json();
    const leoReply = data.response || "Leo was unable to generate a response.";

    const leoMessage: ConversationMessage = {
      role: "leo",
      content: leoReply,
    };

    setConversation((prev) => [...prev, userMessage, leoMessage]);
    setQuestion("");

    await supabase.from("matter_messages").insert([
      { matter_id: matter.id, role: "user", content: userMessage.content },
      { matter_id: matter.id, role: "leo", content: leoMessage.content },
    ]);
  }

  async function saveManualTimelineEntry() {
    if (!timelineTitle.trim()) return;

    await addTimelineEvent({
      eventType: "manual_entry",
      title: timelineTitle.trim(),
      description: timelineDescription.trim(),
      createdBy: "User",
    });

    setTimelineTitle("");
    setTimelineDescription("");
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
    <div style={{ maxWidth: "1000px" }}>
      <MatterHeader
        title={matter.title}
        status={status}
        onBack={() => router.push("/dashboard/matters")}
      />

      <LeoSummary
        understanding={leoSummary.understanding}
        risk={leoSummary.risk}
        nextStep={leoSummary.nextStep}
      />

      <Panel title="Conversation" subtitle="Work through this matter with Leo.">
        {loadingConversation ? (
          <MutedText>Loading conversation...</MutedText>
        ) : (
          <LeoConversation conversation={conversation} />
        )}

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Update Leo or ask what to do next..."
          style={textareaStyle}
        />

        <button onClick={sendToLeo} style={darkButtonStyle}>
          Send to Leo
        </button>
      </Panel>

      <Panel title="Matter Status">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
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
      </Panel>

      <Panel title="Matter Details">
        <div style={{ fontSize: "14px", color: "#6B7280" }}>
          <div>
            <strong>ID:</strong> {matter.id}
          </div>

          <div style={{ marginTop: "10px" }}>
            <strong>Description:</strong>
            <div style={{ marginTop: "6px" }}>
              {matter.description || "No description"}
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title="Add Chronology Entry"
        subtitle="Record key factual events only. This is separate from the Leo conversation."
      >
        <input
          value={timelineTitle}
          onChange={(e) => setTimelineTitle(e.target.value)}
          placeholder="Example: Investigation meeting held"
          style={inputStyle}
        />

        <textarea
          value={timelineDescription}
          onChange={(e) => setTimelineDescription(e.target.value)}
          placeholder="Brief factual note..."
          style={textareaStyle}
        />

        <button onClick={saveManualTimelineEntry} style={purpleButtonStyle}>
          Add to Chronology
        </button>
      </Panel>

      <Panel title="Case Chronology">
        {loadingTimeline ? (
          <MutedText>Loading chronology...</MutedText>
        ) : timeline.length === 0 ? (
          <MutedText>No chronology entries recorded yet.</MutedText>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {timeline.map((event) => (
              <div key={event.id} style={timelineItemStyle}>
                <div style={{ fontWeight: 700 }}>
                  {formatDate(event.event_date)} — {event.title}
                </div>

                {event.description && (
                  <div style={{ color: "#6B7280", marginTop: "3px" }}>
                    {event.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={panelStyle}>
      <div style={{ fontWeight: 700, marginBottom: subtitle ? "6px" : "12px" }}>
        {title}
      </div>
      {subtitle && <MutedText>{subtitle}</MutedText>}
      {children}
    </div>
  );
}

function MutedText({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "14px", color: "#6B7280", marginBottom: "14px" }}>
      {children}
    </div>
  );
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

const panelStyle: React.CSSProperties = {
  marginTop: "20px",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "20px",
};

const timelineItemStyle: React.CSSProperties = {
  borderLeft: "2px solid #E5E7EB",
  paddingLeft: "10px",
  paddingTop: "2px",
  paddingBottom: "2px",
  fontSize: "13px",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "80px",
  padding: "10px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  marginTop: "10px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  border: "1px solid #ddd",
  borderRadius: "8px",
};

const darkButtonStyle: React.CSSProperties = {
  marginTop: "10px",
  background: "#111827",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 600,
};

const purpleButtonStyle: React.CSSProperties = {
  marginTop: "10px",
  background: "#6E5084",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 600,
};