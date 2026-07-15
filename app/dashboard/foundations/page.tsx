"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type FoundationFact = {
  id: number;
  section: string;
  key: string;
  value: string;
  source: string | null;
};

export default function FoundationsPage() {
  const router = useRouter();

  const [facts, setFacts] = useState<FoundationFact[]>([]);

  useEffect(() => {
    async function loadFacts() {
      const { data, error } = await supabase
        .from("organisation_foundations")
        .select("id, section, key, value, source")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading foundation facts:", error);
        return;
      }

      setFacts(data || []);
    }

    loadFacts();
  }, []);

  function getSectionFacts(section: string) {
    return facts.filter((fact) => fact.section === section);
  }

  function getDetail(section: string, fallback: string) {
    const sectionFacts = getSectionFacts(section);

    if (sectionFacts.length === 0) return fallback;

return sectionFacts
  .map((fact) => `${fact.key}: ${fact.value}`)
  .join("\n");
  }

  return (
    <div style={{ maxWidth: "1100px" }}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Foundations</h1>

        <p style={subtitleStyle}>
          Everything Leo knows about your organisation begins here.
        </p>
      </div>

      <div style={leoNoteStyle}>
        <div style={sparkleStyle}>✦</div>

        <div>
          <div style={noteTitleStyle}>A note from Leo</div>

          <p style={noteTextStyle}>
            As your organisation grows and evolves, keeping things up to date
            helps me provide guidance that's increasingly tailored to your
            business.
          </p>
        </div>
      </div>

      <div style={understandingCardStyle}>
        <div>
          <div style={sectionTitleStyle}>Leo's understanding</div>

          <p style={mutedTextStyle}>
            I've started building an understanding of your organisation. As we
            work together, I'll continue learning so my guidance becomes
            increasingly tailored to your business.
          </p>
        </div>

        <div style={understandingStatusStyle}>
          {facts.length > 0 ? "Developing" : "Just beginning"}
        </div>
      </div>

      <div style={cardsWrapStyle}>
        <FoundationCard
          featured
          title="Welcome Brief"
          description="Introduce Leo to your organisation."
          detail={
            facts.length > 0
              ? "Your Welcome Brief has been completed. Leo has started building an understanding of your organisation and will continue learning as you work together."
              : "A short first conversation to help Leo understand enough to begin."
          }
          buttonLabel={facts.length > 0 ? undefined : "Begin"}
          onClick={
            facts.length > 0
              ? undefined
              : () => router.push("/dashboard/welcome-brief")
          }
        />

        <FoundationCard
          title="Company Profile"
          description="Business information used throughout Leo."
          detail={getDetail(
            "Company Profile",
            "Company name, industry, size, locations and business overview."
          )}
          buttonLabel="Update"
          onClick={() =>
            router.push("/dashboard/foundations/company-profile")
          }
        />

        <FoundationCard
          title="Employment Framework"
          description="The employment basics Leo should understand."
          detail={getDetail(
            "Employment Framework",
            "Holiday year, probation, family leave, sick pay and working arrangements."
          )}
          buttonLabel="Update"
          onClick={() =>
            router.push("/dashboard/foundations/employment-framework")
          }
        />

        <FoundationCard
          title="Company Knowledge"
          description="Teach Leo how your organisation works."
          detail={getDetail(
            "Company Knowledge",
            "Internal practices, approval routes, working patterns and local rules."
          )}
          buttonLabel="Teach Leo"
          onClick={() =>
            router.push("/dashboard/foundations/company-knowledge")
          }
        />

        <FoundationCard
          title="Organisation Structure"
          description="Departments, locations and managers."
          detail={getDetail(
            "Organisation Structure",
            "Help Leo understand who works where and how your organisation is structured."
          )}
          buttonLabel="Manage"
          onClick={() =>
            router.push("/dashboard/foundations/organisation-structure")
          }
        />

        <FoundationCard
  title="Connections"
  description="Connect trusted platforms Leo can work with."
  detail="Manage approved connections for Microsoft, Google, Canva, Xero, ElevenLabs and other supported services."
  buttonLabel="Manage"
  onClick={() =>
    router.push("/dashboard/foundations/connections")
  }
/>

        <FoundationCard
          title="Notifications"
          description="Choose how Leo keeps you informed."
          detail="Weekly digests, compliance reminders and employee-facing notifications."
          buttonLabel="Configure"
        />

        <FoundationCard
          title="Leo Preferences"
          description="Set how Leo supports your organisation."
          detail="Tone, working style and how proactive Leo should be."
          buttonLabel="Review"
        />
      </div>
    </div>
  );
}

function FoundationCard({
  title,
  description,
  detail,
  buttonLabel,
  onClick,
  featured = false,
}: {
  title: string;
  description: string;
  detail: string;
  buttonLabel?: string;
  onClick?: () => void;
  featured?: boolean;
}) {
  return (
    <div style={featured ? featuredCardStyle : cardStyle}>
      <div>
        <div style={featured ? featuredCardTitleStyle : cardTitleStyle}>
          {title}
        </div>

        <p style={cardDescriptionStyle}>{description}</p>

        <div style={detailBoxStyle}>{detail}</div>
      </div>

      {buttonLabel ? (
        <button onClick={onClick} style={buttonStyle}>
          {buttonLabel}
        </button>
      ) : null}
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  marginBottom: "20px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "30px",
  fontWeight: 800,
  color: "#111827",
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "14px",
  marginTop: "6px",
};

const leoNoteStyle: React.CSSProperties = {
  display: "flex",
  gap: "18px",
  alignItems: "center",
  background: "#F7F1FC",
  border: "1px solid #E9D5FF",
  borderRadius: "18px",
  padding: "20px",
  marginBottom: "18px",
};

const sparkleStyle: React.CSSProperties = {
  width: "58px",
  height: "58px",
  minWidth: "58px",
  borderRadius: "999px",
  background: "#F5FFF9",
  color: "#6E5084",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "34px",
  fontWeight: 800,
};

const noteTitleStyle: React.CSSProperties = {
  fontWeight: 800,
  color: "#6E5084",
  marginBottom: "4px",
};

const noteTextStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  margin: 0,
  lineHeight: 1.5,
};

const understandingCardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "18px",
  padding: "20px",
  marginBottom: "18px",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 800,
  color: "#111827",
};

const mutedTextStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "14px",
  margin: "6px 0 0 0",
  lineHeight: 1.5,
};

const understandingStatusStyle: React.CSSProperties = {
  background: "#F7F1FC",
  color: "#6E5084",
  borderRadius: "999px",
  padding: "8px 12px",
  fontSize: "13px",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const cardsWrapStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const featuredCardStyle: React.CSSProperties = {
  gridColumn: "1 / -1",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "18px",
  padding: "20px",
  minHeight: "160px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "18px",
  padding: "18px",
  minHeight: "190px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: "17px",
  fontWeight: 800,
  color: "#111827",
};

const featuredCardTitleStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 800,
  color: "#111827",
};

const cardDescriptionStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: 1.45,
  marginTop: "10px",
};

const detailBoxStyle: React.CSSProperties = {
  background: "#F9FAFB",
  border: "1px solid #F3F4F6",
  borderRadius: "12px",
  padding: "10px",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.45,
  marginTop: "12px",
  whiteSpace: "pre-wrap",
};

const buttonStyle: React.CSSProperties = {
  alignSelf: "flex-start",
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  padding: "8px 12px",
  fontWeight: 800,
  cursor: "pointer",
  marginTop: "16px",
};
