"use client";

import { useEffect, useRef } from "react";

export type ConversationMessage = {
  role: "user" | "leo";
  content: string;
};

type LeoConversationProps = {
  conversation: ConversationMessage[];
  hasContext?: boolean;
};

export default function LeoConversation({
  conversation,
  hasContext = false,
}: LeoConversationProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation]);

  if (conversation.length === 0) {
    return (
      <div style={emptyStyle}>
        {hasContext
          ? "Continue this Matter with Leo..."
          : "Start a conversation with Leo..."}
      </div>
    );
  }

  return (
    <div style={listStyle}>
      {conversation.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          style={{
            display: "flex",
            justifyContent:
              message.role === "user" ? "flex-end" : "flex-start",
            width: "100%",
            minWidth: 0,
          }}
        >
          <div
            style={{
              maxWidth: "78%",
              minWidth: 0,
              overflow: "hidden",
              padding: "10px 12px",
              borderRadius: "12px",
              border:
                message.role === "user"
                  ? "1px solid #6E5084"
                  : "1px solid #E5E7EB",
              background:
                message.role === "user" ? "#6E5084" : "#FFFFFF",
              color:
                message.role === "user" ? "#FFFFFF" : "#111827",
            }}
          >
            <div style={labelStyle}>
              {message.role === "user" ? "You" : "Leo"}
            </div>
            <div style={contentStyle}>{message.content}</div>
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

const listStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  minWidth: 0,
};

const labelStyle: React.CSSProperties = {
  marginBottom: "4px",
  fontSize: "10px",
  fontWeight: 700,
  opacity: 0.72,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const contentStyle: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  fontFamily: "inherit",
  fontSize: "13px",
  lineHeight: 1.55,
};

const emptyStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100%",
  color: "#6B7280",
  fontSize: "13px",
  fontStyle: "italic",
};