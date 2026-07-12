"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Message = {
  role: "user" | "leo";
  content: string;
};

export default function AskLeoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasSentDashboardPrompt = useRef(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "leo",
      content: "Hi, I’m Leo. How can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [shouldCreateMatter, setShouldCreateMatter] = useState(false);

  useEffect(() => {
    const prompt = searchParams.get("prompt");

    if (!prompt || hasSentDashboardPrompt.current) return;

    hasSentDashboardPrompt.current = true;
    sendMessage(prompt);
  }, [searchParams]);

  async function sendMessage(messageOverride?: string) {
    const messageText = (messageOverride || input).trim();

    if (!messageText) return;

    const userMessage: Message = {
      role: "user",
      content: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask-leo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await res.json();

      const leoMessage: Message = {
        role: "leo",
        content:
          data.response ||
          data.reply ||
          "Leo was unable to generate a response.",
      };

      setMessages((prev) => [...prev, leoMessage]);
      setShouldCreateMatter(!!data.shouldCreateMatter);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "leo",
          content: "Error connecting to Leo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function createMatter() {
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");

    const payload = {
      title: lastUserMessage?.content?.slice(0, 60) || "New HR Matter",
      subject: lastUserMessage?.content?.slice(0, 60) || "New HR Matter",
      description: lastUserMessage?.content || "",
      risk: shouldCreateMatter ? "medium" : "low",
      suggestedNextStep: "Review and confirm details before submission",
    };

    localStorage.setItem("leo_matter_draft", JSON.stringify(payload));
    router.push("/dashboard/matters/new");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "75vh" }}>
      <h1 style={{ fontSize: "26px", fontWeight: 700 }}>Ask Leo</h1>

      <p style={{ color: "#6B7280", marginBottom: "16px" }}>
        Chat with your AI HR assistant
      </p>

      <div style={chatBoxStyle}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#6E5084" : "#F3F4F6",
              color: m.role === "user" ? "white" : "#111827",
              padding: "10px 12px",
              borderRadius: "12px",
              maxWidth: "70%",
              fontSize: "14px",
              whiteSpace: "pre-wrap",
            }}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "#F3F4F6",
              color: "#6B7280",
              padding: "10px 12px",
              borderRadius: "12px",
              fontSize: "14px",
            }}
          >
            Leo is thinking...
          </div>
        )}
      </div>

      {shouldCreateMatter && (
        <div style={{ marginTop: "12px" }}>
          <button onClick={createMatter} style={matterButtonStyle}>
            Create HR Matter
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Leo something..."
          style={inputStyle}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />

        <button
          onClick={() => sendMessage()}
          disabled={loading}
          style={sendButtonStyle}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

const chatBoxStyle: React.CSSProperties = {
  flex: 1,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "16px",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
};

const sendButtonStyle: React.CSSProperties = {
  background: "#6E5084",
  color: "white",
  border: "none",
  padding: "12px 16px",
  borderRadius: "10px",
  fontWeight: 600,
  cursor: "pointer",
};

const matterButtonStyle: React.CSSProperties = {
  background: "#6E5084",
  color: "white",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  fontWeight: 600,
  cursor: "pointer",
};