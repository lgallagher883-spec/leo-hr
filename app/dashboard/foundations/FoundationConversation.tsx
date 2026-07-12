"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type FoundationFact = {
  id: number | string;
  key: string;
  value: string;
};

type FoundationConversationProps = {
  title: string;
  section: string;
  stage: string;
  subtitle: string;
  introMessage: string;
  emptyMessage: string;
  promptTitle: string;
  example: string;
  placeholder?: string;
  buttonLabel?: string;
  successMessage?: string;
};

export default function FoundationConversation({
  title,
  section,
  stage,
  subtitle,
  introMessage,
  emptyMessage,
  promptTitle,
  example,
  placeholder = "Tell Leo what has changed...",
  buttonLabel = "Send to Leo",
  successMessage = "Thank you. I've updated my understanding of your organisation.",
}: FoundationConversationProps) {
  const [facts, setFacts] = useState<FoundationFact[]>([]);
  const [input, setInput] = useState("");
  const [loadingFacts, setLoadingFacts] = useState(true);
  const [sending, setSending] = useState(false);
  const [leoMessage, setLeoMessage] = useState(introMessage);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadFacts() {
    setLoadingFacts(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("organisation_foundations")
      .select("id, key, value")
      .eq("section", section)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(`Error loading ${section}:`, error);

      setErrorMessage(
        `I couldn't load your ${title} information just now. Please refresh the page and try again.`
      );

      setLoadingFacts(false);
      return;
    }

    setFacts(data || []);
    setLoadingFacts(false);
  }

  useEffect(() => {
    loadFacts();
  }, [section]);

  async function sendUpdate() {
    if (!input.trim() || sending) return;

    const employerUpdate = input.trim();

    setSending(true);
    setErrorMessage("");
    setLeoMessage("Thanks. I'm reviewing that information now.");

    try {
      const response = await fetch("/api/leo/welcome", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stage,
          message: employerUpdate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.reply || "The update could not be processed.");
      }

      setInput("");
      setLeoMessage(data.reply || successMessage);

      await loadFacts();
    } catch (error) {
      console.error(`Error updating ${section}:`, error);

      setErrorMessage(
        `I couldn't update your ${title} information just now. Please try again.`
      );

      setLeoMessage("I'm sorry, I couldn't save that update just now.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Foundations</div>

          <h1 style={titleStyle}>{title}</h1>

          <p style={subtitleStyle}>{subtitle}</p>
        </div>

        <a href="/dashboard/foundations" style={backLinkStyle}>
          ← Back to Foundations
        </a>
      </div>

      <div style={conversationCardStyle}>
        <div style={leoHeaderStyle}>
          <div style={leoIconStyle}>✦</div>

          <div>
            <div style={leoNameStyle}>Leo</div>
            <div style={leoRoleStyle}>Your AI HR Director</div>
          </div>
        </div>

        <div style={leoMessageStyle}>{leoMessage}</div>

        <div style={factsSectionStyle}>
          <div style={sectionHeadingStyle}>What I currently understand</div>

          {loadingFacts ? (
            <div style={emptyStateStyle}>
              I'm retrieving this information...
            </div>
          ) : facts.length === 0 ? (
            <div style={emptyStateStyle}>{emptyMessage}</div>
          ) : (
            <div style={factsGridStyle}>
              {facts.map((fact) => (
                <div key={fact.id} style={factCardStyle}>
                  <div style={factKeyStyle}>{fact.key}</div>
                  <div style={factValueStyle}>{fact.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={conversationPromptStyle}>
          <div style={promptTitleStyle}>{promptTitle}</div>

          <p style={promptTextStyle}>{example}</p>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={placeholder}
            disabled={sending}
            style={{
              ...textareaStyle,
              opacity: sending ? 0.7 : 1,
            }}
          />

          {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

          <div style={buttonRowStyle}>
            <button
              type="button"
              onClick={sendUpdate}
              disabled={sending || !input.trim()}
              style={{
                ...buttonStyle,
                opacity: sending || !input.trim() ? 0.6 : 1,
                cursor:
                  sending || !input.trim() ? "not-allowed" : "pointer",
              }}
            >
              {sending ? "Leo is updating..." : buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  maxWidth: "960px",
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "24px",
  marginBottom: "22px",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "13px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "8px",
};

const titleStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "32px",
  fontWeight: 800,
  margin: "0 0 8px 0",
};

const subtitleStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "15px",
  margin: 0,
};

const backLinkStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "14px",
  fontWeight: 700,
  textDecoration: "none",
  paddingTop: "8px",
};

const conversationCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "22px",
  padding: "26px",
};

const leoHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "18px",
};

const leoIconStyle: React.CSSProperties = {
  width: "46px",
  height: "46px",
  borderRadius: "999px",
  background: "#F7F1FC",
  color: "#6E5084",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "25px",
  fontWeight: 800,
};

const leoNameStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: 800,
};

const leoRoleStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "12px",
  marginTop: "2px",
};

const leoMessageStyle: React.CSSProperties = {
  background: "#F7F1FC",
  border: "1px solid #E9D5FF",
  borderRadius: "16px",
  padding: "16px",
  color: "#374151",
  fontSize: "15px",
  lineHeight: 1.6,
  marginBottom: "24px",
};

const factsSectionStyle: React.CSSProperties = {
  marginBottom: "26px",
};

const sectionHeadingStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: 800,
  marginBottom: "12px",
};

const factsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "12px",
};

const factCardStyle: React.CSSProperties = {
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  padding: "14px",
};

const factKeyStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: "6px",
};

const factValueStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "15px",
  fontWeight: 700,
  lineHeight: 1.45,
};

const emptyStateStyle: React.CSSProperties = {
  background: "#F9FAFB",
  border: "1px dashed #D1D5DB",
  borderRadius: "14px",
  padding: "18px",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.6,
};

const conversationPromptStyle: React.CSSProperties = {
  borderTop: "1px solid #E5E7EB",
  paddingTop: "24px",
};

const promptTitleStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "17px",
  fontWeight: 800,
  marginBottom: "7px",
};

const promptTextStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.55,
  margin: "0 0 14px 0",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "120px",
  boxSizing: "border-box",
  resize: "vertical",
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid #D1D5DB",
  color: "#111827",
  background: "#FFFFFF",
  fontSize: "14px",
  fontFamily: "inherit",
  lineHeight: 1.55,
  outline: "none",
};

const errorStyle: React.CSSProperties = {
  marginTop: "12px",
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  color: "#991B1B",
  borderRadius: "12px",
  padding: "11px 13px",
  fontSize: "13px",
};

const buttonRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: "14px",
};

const buttonStyle: React.CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "12px",
  padding: "12px 18px",
  fontSize: "14px",
  fontWeight: 800,
};