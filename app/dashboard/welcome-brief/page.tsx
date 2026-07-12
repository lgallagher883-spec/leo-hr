"use client";

import { useState } from "react";

type Stage =
  | "business_overview"
  | "working_locations"
  | "workforce_profile"
  | "management_structure"
  | "employment_basics"
  | "pay_benefits"
  | "people_management"
  | "approvals_escalation"
  | "regulation_compliance"
  | "hr_resources"
  | "company_knowledge"
  | "complete";

type Message = {
  role: "leo" | "user";
  content: string;
};

type FoundationFact = {
  section: string;
  key: string;
  value: string;
};

const stageQuestions: Record<Exclude<Stage, "complete">, string> = {
  business_overview: `Let's start with the basics.

Could you tell me a little about your organisation?

For example:

• what your business does

• your sector or industry

• approximately how many people you employ

• how many sites or settings you operate

• where you operate from

• whether you are regulated by an organisation such as Ofsted, the CQC, HSE or the FSA.`,

  working_locations: `I'd now like to understand where and how people work.

Could you tell me:

• whether employees work from one location or across several sites

• whether anyone works remotely or from home

• whether employees travel between sites during working hours

• whether you operate shifts, overnight work, on-call arrangements or different opening hours across locations?`,

  workforce_profile: `I'd now like to understand the make-up of your workforce.

For example:

• whether you employ full-time, part-time, temporary, casual or zero-hours staff

• whether you use contractors, agency workers, apprentices or volunteers

• whether any roles require professional qualifications, registrations, DBS checks, driving or safeguarding clearance

• whether you recognise a trade union or have employee representatives.`,

  management_structure: `Please tell me a little about your management and HR structure.

For example:

• who employees report to

• who manages each site, department or team

• whether you have an internal HR person or external HR support

• who can make formal people decisions

• who has authority to recruit, discipline, dismiss or approve organisational changes.`,

  employment_basics: `I'd now like to understand the employment arrangements that apply to most employees.

Could you tell me about:

• your holiday year

• your normal probation period

• your usual working week

• working patterns or shift arrangements

• breaks

• notice periods

• whether contractual terms differ between roles or groups of employees?`,

  pay_benefits: `I'd now like to understand your normal pay and benefits arrangements.

For example:

• how often employees are paid

• whether overtime is paid or taken as time off

• whether you offer enhanced sick pay

• whether maternity, paternity, adoption or shared parental pay is enhanced

• bonuses, commission, allowances or other benefits

• pension arrangements or any important contractual benefits Leo should know about.`,

  people_management: `Every organisation manages people slightly differently.

Could you tell me about your usual approach to:

• sickness absence and return-to-work discussions

• performance concerns

• probation reviews and extensions

• conduct or disciplinary concerns

• grievances and workplace conflict

• informal resolution, mediation or coaching before formal action

• Occupational Health or medical referrals?`,

  approvals_escalation: `I'd now like to understand your approval and escalation routes.

For example:

• who approves annual leave and overtime

• who approves recruitment and new vacancies

• who approves pay changes or bonuses

• who must approve disciplinary sanctions or dismissal

• when managers must escalate a matter to HR, a director, owner, trustee or operations lead

• when external legal advice would normally be sought.`,

  regulation_compliance: `Please tell me about any important compliance or regulatory requirements that affect your workforce.

For example:

• safeguarding requirements

• DBS or barred-list checks

• Right to Work checks

• professional registrations or qualification checks

• mandatory training

• health and safety responsibilities

• staffing ratios

• regulator notifications

• sector-specific rules that managers must follow.`,

  hr_resources: `I'd also like to understand what HR documentation and resources you already have.

For example:

• an employee handbook

• employment contracts or contract templates

• HR policies and procedures

• standard letters and forms

• risk assessments

• training materials

• collective agreements

• existing HR systems or records.

You can upload these to the relevant areas of Leo when you're ready, and I'll begin using them to provide more tailored guidance.`,

  company_knowledge: `Finally, is there anything else about the way your organisation operates that I should remember?

This might include:

• unwritten working practices

• recurring management preferences

• cultural expectations

• operational restrictions

• decisions that always require senior approval

• approaches you normally prefer before formal action

• anything that makes your organisation different from another employer in the same sector.`,
};

const stageOrder: Stage[] = [
  "business_overview",
  "working_locations",
  "workforce_profile",
  "management_structure",
  "employment_basics",
  "pay_benefits",
  "people_management",
  "approvals_escalation",
  "regulation_compliance",
  "hr_resources",
  "company_knowledge",
  "complete",
];

export default function WelcomeBriefPage() {
  const [started, setStarted] = useState(false);
  const [stage, setStage] = useState<Stage>("business_overview");
  const [input, setInput] = useState("");
  const [facts, setFacts] = useState<FoundationFact[]>([]);
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "leo",
      content: stageQuestions.business_overview,
    },
  ]);

  function getNextStage(currentStage: Stage): Stage {
    const currentIndex = stageOrder.indexOf(currentStage);
    return stageOrder[currentIndex + 1] || "complete";
  }

  async function sendAnswer() {
    if (!input.trim() || loading) return;

    const userAnswer = input.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userAnswer,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/leo/welcome", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stage,
          message: userAnswer,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.reply || "Leo could not process that just now."
        );
      }

      const newFacts: FoundationFact[] = Array.isArray(data.facts)
        ? data.facts
        : [];

      setFacts((prev) => {
        const combined = [...prev, ...newFacts];

        return Array.from(
          new Map(
            combined.map((fact) => [
              `${fact.section}::${fact.key}`,
              fact,
            ])
          ).values()
        );
      });

      const nextStage = getNextStage(stage);

      if (nextStage === "complete") {
        setStage("complete");

        setMessages((prev) => [
          ...prev,
          {
            role: "leo",
            content:
              "That's everything I need for the initial Welcome Brief.\n\nI've recorded the key information you've shared and will use it to provide more organisation-specific guidance.\n\nYou can review and update these details from Foundations whenever something changes. I'll also continue learning through future conversations, uploaded documents and completed Matters.",
          },
        ]);

        return;
      }

      setStage(nextStage);

      setMessages((prev) => [
        ...prev,
        {
          role: "leo",
          content: stageQuestions[nextStage],
        },
      ]);
    } catch (error) {
      console.error("Welcome Brief error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "leo",
          content:
            error instanceof Error
              ? error.message
              : "I’m sorry, I couldn’t process that just now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }
  if (!started) {
    return (
      <div style={pageWrapStyle}>
        <div style={introCardStyle}>
          <div style={sparkleStyle}>✦</div>

          <h1 style={titleStyle}>Welcome to Leo</h1>

          <p style={bodyTextStyle}>
            I’m looking forward to working with you.
          </p>

          <p style={bodyTextStyle}>
            Before I begin supporting your organisation, I’d like to understand
            how your business operates, how your people are managed and which
            rules or processes matter most.
          </p>

          <p style={bodyTextStyle}>
            The more accurate this information is, the more tailored and
            practical my guidance will become.
          </p>

          <p style={bodyTextStyle}>
            You do not need to have every answer today. You can update your
            Foundations at any time, and I’ll continue learning as we work
            together.
          </p>

          <div style={smallInfoStyle}>
            Usually takes around 20–30 minutes. You can pause and return at any
            time.
          </div>

          <button
            onClick={() => setStarted(true)}
            style={primaryButtonStyle}
          >
            Begin Welcome Brief
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrapStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Welcome Brief with Leo</h1>

          <p style={subtitleStyle}>
            A guided conversation to help me understand your organisation.
          </p>
        </div>
      </div>

      <div style={layoutStyle}>
        <div style={chatPanelStyle}>
          <div style={messagesStyle}>
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  ...messageBubbleStyle,
                  alignSelf:
                    message.role === "user"
                      ? "flex-end"
                      : "flex-start",
                  background:
                    message.role === "user"
                      ? "#6E5084"
                      : "#FFFFFF",
                  color:
                    message.role === "user"
                      ? "#FFFFFF"
                      : "#111827",
                  border:
                    message.role === "user"
                      ? "1px solid #6E5084"
                      : "1px solid #E5E7EB",
                }}
              >
                {message.content}
              </div>
            ))}

            {loading && (
              <div style={loadingBubbleStyle}>
                That’s helpful, thanks...
              </div>
            )}
          </div>

          {stage !== "complete" && (
            <div style={inputAreaStyle}>
              <textarea
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                placeholder="Type your answer here..."
                style={textareaStyle}
              />

              <button
                onClick={sendAnswer}
                disabled={loading}
                style={{
                  ...primaryButtonStyle,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
          )}
        </div>

        <div style={sidePanelStyle}>
          <div style={sideTitleStyle}>
            Foundations being built
          </div>

          <p style={sideTextStyle}>
            As you answer, I’ll turn useful details into structured
            organisational knowledge.
          </p>

          {facts.length === 0 ? (
            <div style={emptyFactsStyle}>
              No Foundation facts captured yet.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "8px",
              }}
            >
              {facts.map((fact, index) => (
                <div
                  key={`${fact.section}-${fact.key}-${index}`}
                  style={factStyle}
                >
                  <div style={factSectionStyle}>
                    {fact.section}
                  </div>

                  <div style={factTextStyle}>
                    <strong>{fact.key}:</strong>{" "}
                    {fact.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {stage === "complete" && (
            <div style={completeBoxStyle}>
              Your initial Welcome Brief is complete. Leo will continue
              learning as your organisation changes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const pageWrapStyle: React.CSSProperties = {
  maxWidth: "1100px",
  margin: "0 auto",
};

const introCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "24px",
  padding: "46px",
  textAlign: "center",
};

const sparkleStyle: React.CSSProperties = {
  width: "86px",
  height: "86px",
  margin: "0 auto 22px auto",
  borderRadius: "999px",
  background: "#F5FFF9",
  color: "#6E5084",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "52px",
  fontWeight: 800,
};

const titleStyle: React.CSSProperties = {
  fontSize: "32px",
  fontWeight: 800,
  color: "#111827",
  margin: "0 0 14px 0",
};

const subtitleStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "14px",
  margin: 0,
};

const bodyTextStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: 1.6,
  maxWidth: "720px",
  margin: "0 auto 14px auto",
};

const smallInfoStyle: React.CSSProperties = {
  background: "#F7F1FC",
  border: "1px solid #E9D5FF",
  color: "#6E5084",
  borderRadius: "14px",
  padding: "12px",
  fontSize: "14px",
  fontWeight: 700,
  margin: "24px auto",
  maxWidth: "520px",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "12px",
  padding: "12px 18px",
  fontWeight: 700,
};

const headerStyle: React.CSSProperties = {
  marginBottom: "18px",
};

const layoutStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 330px",
  gap: "18px",
};

const chatPanelStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "22px",
  padding: "18px",
};

const messagesStyle: React.CSSProperties = {
  minHeight: "430px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const messageBubbleStyle: React.CSSProperties = {
  maxWidth: "78%",
  borderRadius: "16px",
  padding: "13px 15px",
  fontSize: "14px",
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
};

const loadingBubbleStyle: React.CSSProperties = {
  alignSelf: "flex-start",
  background: "#F7F1FC",
  color: "#6E5084",
  borderRadius: "16px",
  padding: "13px 15px",
  fontSize: "14px",
  fontWeight: 700,
};

const inputAreaStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  marginTop: "16px",
  alignItems: "flex-end",
};

const textareaStyle: React.CSSProperties = {
  flex: 1,
  minHeight: "86px",
  resize: "vertical",
  padding: "12px",
  borderRadius: "14px",
  border: "1px solid #E5E7EB",
  fontSize: "14px",
  lineHeight: 1.5,
};

const sidePanelStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "22px",
  padding: "18px",
  alignSelf: "start",
};

const sideTitleStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 800,
  color: "#111827",
};

const sideTextStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.5,
};

const emptyFactsStyle: React.CSSProperties = {
  background: "#F9FAFB",
  border: "1px solid #F3F4F6",
  borderRadius: "12px",
  padding: "12px",
  color: "#6B7280",
  fontSize: "13px",
};

const factStyle: React.CSSProperties = {
  background: "#F9FAFB",
  border: "1px solid #F3F4F6",
  borderRadius: "12px",
  padding: "10px",
};

const factSectionStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 800,
  marginBottom: "4px",
};

const factTextStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "13px",
  lineHeight: 1.4,
};

const completeBoxStyle: React.CSSProperties = {
  marginTop: "14px",
  background: "#F5FFF9",
  border: "1px solid #D1FAE5",
  color: "#374151",
  borderRadius: "12px",
  padding: "12px",
  fontSize: "13px",
};