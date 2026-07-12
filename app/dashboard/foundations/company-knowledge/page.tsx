"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type FoundationFact = {
  id: number | string;
  key: string;
  value: string;
};

export default function CompanyKnowledgePage() {
  const [facts, setFacts] = useState<FoundationFact[]>([]);
  const [input, setInput] = useState("");
  const [loadingFacts, setLoadingFacts] = useState(true);
  const [sending, setSending] = useState(false);
  const [leoMessage, setLeoMessage] = useState(
    "I'd like to keep learning how your organisation works. Tell me anything that will help me give better HR advice in future."
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function loadCompanyKnowledge() {
    setLoadingFacts(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("organisation_foundations")
      .select("id, key, value")
      .eq("section", "Company Knowledge")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading company knowledge:", error);

      setErrorMessage(
        "I couldn't load your Company Knowledge just now. Please refresh the page and try again."
      );

      setLoadingFacts(false);
      return;
    }

    setFacts(data || []);
    setLoadingFacts(false);
  }

  useEffect(() => {
    loadCompanyKnowledge();
  }, []);

  async function sendUpdate() {
    if (!input.trim() || sending) return;

    const employerUpdate = input.trim();

    setSending(true);
    setErrorMessage("");
    setLeoMessage("That's helpful. I'm adding that to my understanding.");

    try {
      const response = await fetch("/api/leo/welcome", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stage: "company_knowledge",
          message: employerUpdate,
          existingFacts: facts.map((fact) => ({
            key: fact.key,
            value: fact.value,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.reply || "The update could not be processed.");
      }

      setInput("");

      setLeoMessage(
        data.reply ||
          "Thank you. I've updated what I know about your organisation."
      );

      await loadCompanyKnowledge();
    } catch (error) {
      console.error("Error updating company knowledge:", error);

      setLeoMessage(
        "I'm sorry, I couldn't save that information just now."
      );

      setErrorMessage(
        "I couldn't update your Company Knowledge just now. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Foundations</div>

          <h1 style={titleStyle}>Company Knowledge</h1>

          <p style={subtitleStyle}>
            This is where Leo learns the things that make your organisation
            unique.
          </p>
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
          <div style={sectionHeadingStyle}>What I currently know</div>

          {loadingFacts ? (
            <div style={emptyStateStyle}>
              I'm retrieving your Company Knowledge...
            </div>
          ) : facts.length === 0 ? (
            <div style={emptyStateStyle}>
              I don't yet have any Company Knowledge recorded. Tell me how your
              organisation works below and I'll begin learning.
            </div>
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
          <div style={promptTitleStyle}>Teach Leo something new</div>

          <p style={promptTextStyle}>
            Tell Leo naturally about an internal practice, approval route,
            compliance requirement or anything else he should remember.
          </p>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Tell Leo something that will help him better understand your organisation..."
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
              {sending ? "Leo is updating..." : "Teach Leo"}
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