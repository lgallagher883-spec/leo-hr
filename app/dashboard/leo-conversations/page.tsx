"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ConversationListItem = {
  id: number;
  title: string;
  last_message_preview: string;
  last_message_at: string;
  updated_at: string;
  created_at: string;
};

export default function LeoConversationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q")?.trim() || "";

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<ConversationListItem[]>([]);

  const activeQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      setLoading(true);
      setError("");

      try {
        const qs = activeQuery
          ? `?q=${encodeURIComponent(activeQuery)}`
          : "";

        const response = await fetch(`/api/ask-leo/conversations${qs}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const result = (await response.json().catch(() => null)) as
          | {
              success?: boolean;
              conversations?: ConversationListItem[];
              error?: string;
            }
          | null;

        if (!response.ok || !result?.success) {
          throw new Error(result?.error || "Conversations could not be loaded.");
        }

        if (cancelled) {
          return;
        }

        setItems(result.conversations || []);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setItems([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Conversations could not be loaded."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadConversations();

    return () => {
      cancelled = true;
    };
  }, [activeQuery]);

  function openConversation(conversationId: number) {
    router.push(`/dashboard/ask-leo?conversationId=${conversationId}`);
  }

  function startNewConversation() {
    router.push("/dashboard/ask-leo");
  }

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Recent Conversations</h1>
          <p style={subtitleStyle}>
            Continue your saved Ask Leo conversations.
          </p>
        </div>

        <button type="button" style={newButtonStyle} onClick={startNewConversation}>
          New conversation
        </button>
      </header>

      <div style={toolbarStyle}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title or preview..."
          style={searchInputStyle}
          aria-label="Search conversations"
        />
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      {loading ? (
        <div style={noticeStyle}>Loading conversations...</div>
      ) : items.length === 0 ? (
        <div style={noticeStyle}>
          {activeQuery
            ? "No conversations match your search."
            : "No saved Ask Leo conversations yet. Start a new conversation to begin."}
        </div>
      ) : (
        <div style={listStyle}>
          {items.map((item) => (
            <button
              type="button"
              key={item.id}
              style={rowButtonStyle}
              onClick={() => openConversation(item.id)}
            >
              <div style={rowHeaderStyle}>
                <strong style={rowTitleStyle}>{item.title}</strong>
                <span style={rowDateStyle}>{formatDate(item.last_message_at)}</span>
              </div>

              <div style={rowPreviewStyle}>
                {item.last_message_preview || "No preview available."}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const pageStyle: React.CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto",
  padding: "8px 12px 24px",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "18px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "26px",
  lineHeight: 1.2,
  color: "#111827",
};

const subtitleStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "14px",
};

const newButtonStyle: React.CSSProperties = {
  border: "none",
  background: "#6E5084",
  color: "#FFFFFF",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 600,
  cursor: "pointer",
};

const toolbarStyle: React.CSSProperties = {
  marginBottom: "14px",
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "14px",
  boxSizing: "border-box",
};

const noticeStyle: React.CSSProperties = {
  border: "1px solid #E5E7EB",
  background: "#F9FAFB",
  color: "#374151",
  borderRadius: "10px",
  padding: "12px",
  fontSize: "14px",
};

const errorStyle: React.CSSProperties = {
  border: "1px solid #FECACA",
  background: "#FEF2F2",
  color: "#991B1B",
  borderRadius: "10px",
  padding: "12px",
  fontSize: "14px",
  marginBottom: "12px",
};

const listStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const rowButtonStyle: React.CSSProperties = {
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  borderRadius: "12px",
  padding: "12px",
  textAlign: "left",
  cursor: "pointer",
};

const rowHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: "10px",
  marginBottom: "6px",
};

const rowTitleStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "15px",
};

const rowDateStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "12px",
  whiteSpace: "nowrap",
};

const rowPreviewStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "13px",
  lineHeight: 1.45,
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
};
