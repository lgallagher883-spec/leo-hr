"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type EmployeeDashboardCard = {
  title: string;
  value: string;
  description: string;
  actionLabel: string;
  href: string;
  tone?: "purple" | "green" | "neutral";
};

export default function EmployeeDashboardPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState<string | null>(null);
  const [loadingName, setLoadingName] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadEmployeeIdentity() {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (error) {
          console.error(
            "LEO employee dashboard could not load the signed-in user:",
            error,
          );
          return;
        }

        const displayName =
          user?.user_metadata?.display_name ||
          user?.user_metadata?.full_name ||
          user?.user_metadata?.name ||
          user?.user_metadata?.first_name ||
          user?.email?.split("@")[0] ||
          null;

        if (!displayName) return;

        const rawFirstName = displayName.trim().split(/\s+/)[0];

        setFirstName(
          rawFirstName.charAt(0).toUpperCase() +
            rawFirstName.slice(1).toLowerCase(),
        );
      } finally {
        if (active) {
          setLoadingName(false);
        }
      }
    }

    void loadEmployeeIdentity();

    return () => {
      active = false;
    };
  }, []);

  const cards: EmployeeDashboardCard[] = [
    {
      title: "My Employment",
      value: "View",
      description:
        "Review your role, employment details, key dates and workplace information.",
      actionLabel: "Open My Employment",
      href: "/dashboard/my-employment",
      tone: "purple",
    },
    {
      title: "My Leave",
      value: "View",
      description:
        "Check your leave information, upcoming time away and previous requests.",
      actionLabel: "Open My Leave",
      href: "/dashboard/my-employment/leave",
      tone: "green",
    },
    {
      title: "My Learning",
      value: "View",
      description:
        "See assigned learning, completed courses, qualifications and certificates.",
      actionLabel: "Open My Learning",
      href: "/dashboard/my-employment/learning",
      tone: "neutral",
    },
    {
      title: "My Documents",
      value: "View",
      description:
        "Access employment documents and records that have been shared with you.",
      actionLabel: "Open My Documents",
      href: "/dashboard/my-employment/documents",
      tone: "purple",
    },
    {
      title: "Upcoming Reviews",
      value: "View",
      description:
        "Keep track of upcoming probation, performance and development reviews.",
      actionLabel: "View Upcoming Reviews",
      href: "/dashboard/my-employment/reviews",
      tone: "green",
    },
    {
      title: "Emergency Contacts",
      value: "View",
      description:
        "Review and maintain the emergency contact information held for you.",
      actionLabel: "Open Emergency Contacts",
      href: "/dashboard/my-employment/emergency-contacts",
      tone: "neutral",
    },
    {
      title: "Medical Information",
      value: "View",
      description:
        "Review the workplace medical information and fit note records you can access.",
      actionLabel: "Open Medical Information",
      href: "/dashboard/my-employment/medical",
      tone: "purple",
    },
    {
      title: "Checks & Compliance",
      value: "View",
      description:
        "See your right to work, DBS, driving and other role-related checks.",
      actionLabel: "Open Checks & Compliance",
      href: "/dashboard/my-employment/checks",
      tone: "green",
    },
  ];

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>Employee workspace</p>

          <h1 style={titleStyle}>
            Welcome back
            {!loadingName && firstName ? `, ${firstName}` : ""}
          </h1>

          <p style={welcomeTextStyle}>
            Your employment information, learning and workplace support in one
            place.
          </p>
        </div>

      </header>

      <section aria-labelledby="employee-services-heading">
        <div style={summaryGridStyle}>
          {cards.map((card) => (
            <EmployeeCard
              key={card.title}
              {...card}
              onClick={() => router.push(card.href)}
            />
          ))}
        </div>
      </section>

      <section style={updatesSectionStyle} aria-labelledby="company-updates-heading">
        <div>
          <p style={updatesEyebrowStyle}>Company updates</p>

          <h2 id="company-updates-heading" style={updatesTitleStyle}>
            Latest company information
          </h2>

          <p style={updatesTextStyle}>
            Important announcements, policy updates and organisation messages
            will appear here when they are published.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard/my-employment/updates")}
          style={updatesButtonStyle}
        >
          View updates
          <span aria-hidden="true">→</span>
        </button>
      </section>
    </main>
  );
}

function EmployeeCard({
  title,
  value,
  description,
  actionLabel,
  tone = "neutral",
  onClick,
}: EmployeeDashboardCard & {
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const toneStyle =
    tone === "purple"
      ? purpleAccentStyle
      : tone === "green"
        ? greenAccentStyle
        : neutralAccentStyle;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{
        ...summaryCardStyle,
        ...(hovered ? summaryCardHoverStyle : {}),
      }}
      aria-label={actionLabel}
    >
      <span style={{ ...cardAccentStyle, ...toneStyle }} aria-hidden="true" />

      <span style={summaryLabelStyle}>{title}</span>

      <span style={summaryWordStyle}>{value}</span>

      <span style={summaryDescriptionStyle}>{description}</span>

      <span style={summaryActionStyle}>
        {actionLabel}
        <span aria-hidden="true">→</span>
      </span>
    </button>
  );
}

const pageStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1440px",
  margin: "0 auto",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "24px",
  flexWrap: "wrap",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#6E5084",
  fontSize: "12px",
  lineHeight: 1.4,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  fontSize: "30px",
  lineHeight: 1.2,
  fontWeight: 700,
  letterSpacing: "-0.02em",
  margin: 0,
  color: "#6E5084",
};

const welcomeTextStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "15px",
  lineHeight: 1.5,
};



















const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
};

const summaryCardStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  width: "100%",
  minHeight: "250px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "14px",
  background: "#FFFFFF",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "#E5E7EB",
  borderRadius: "18px",
  padding: "24px",
  textAlign: "left",
  cursor: "pointer",
  boxShadow: "0 8px 22px rgba(17, 24, 39, 0.05)",
  transition:
    "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
};

const summaryCardHoverStyle: CSSProperties = {
  transform: "translateY(-2px)",
  borderColor: "#CDB2E2",
  boxShadow: "0 12px 28px rgba(110, 80, 132, 0.12)",
};

const cardAccentStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "5px",
};

const purpleAccentStyle: CSSProperties = {
  background: "#CDB2E2",
};

const greenAccentStyle: CSSProperties = {
  background: "#BFE8CF",
};

const neutralAccentStyle: CSSProperties = {
  background: "#E5E7EB",
};

const summaryLabelStyle: CSSProperties = {
  display: "block",
  fontSize: "17px",
  lineHeight: 1.35,
  fontWeight: 700,
  color: "#111827",
  marginTop: "4px",
};

const summaryWordStyle: CSSProperties = {
  display: "block",
  fontSize: "32px",
  lineHeight: 1,
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: "#6E5084",
};

const summaryDescriptionStyle: CSSProperties = {
  display: "block",
  flex: 1,
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.55,
};

const summaryActionStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  paddingTop: "16px",
  borderTop: "1px solid #F0EAF4",
  color: "#6E5084",
  fontSize: "14px",
  fontWeight: 700,
};

const updatesSectionStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "24px",
  marginTop: "24px",
  padding: "24px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "18px",
  boxShadow: "0 8px 22px rgba(17, 24, 39, 0.04)",
  flexWrap: "wrap",
};

const updatesEyebrowStyle: CSSProperties = {
  margin: "0 0 6px",
  color: "#6E5084",
  fontSize: "12px",
  lineHeight: 1.4,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const updatesTitleStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "19px",
  lineHeight: 1.35,
  fontWeight: 700,
};

const updatesTextStyle: CSSProperties = {
  maxWidth: "760px",
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.55,
};

const updatesButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  borderRadius: "11px",
  padding: "11px 15px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};