"use client";

export type ConversationMessage = {
  role: "user" | "leo";
  content: string;
};

type LeoConversationProps = {
  conversation: ConversationMessage[];
};

export default function LeoConversation({
  conversation,
}: LeoConversationProps) {
  if (conversation.length === 0) {
    return (
      <div
        style={{
          color: "#6B7280",
          fontStyle: "italic",
        }}
      >
        Start a conversation with Leo...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {conversation.map((message, index) => (
        <div
          key={index}
          style={{
            alignSelf:
              message.role === "user"
                ? "flex-end"
                : "flex-start",
            background:
              message.role === "user"
                ? "#6E5084"
                : "#F3F4F6",
            color:
              message.role === "user"
                ? "#fff"
                : "#111827",
            padding: "12px",
            borderRadius: "12px",
            maxWidth: "85%",
            fontSize: "14px",
          }}
        >
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
            }}
          >
            {message.content}
          </pre>
        </div>
      ))}
    </div>
  );
}