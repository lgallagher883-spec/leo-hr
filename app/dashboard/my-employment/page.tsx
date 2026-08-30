"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CarFront,
  ChevronRight,
  ClipboardCheck,
  ContactRound,
  FileCheck2,
  FileText,
  GraduationCap,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";
import styles from "./MyEmployment.module.css";

type EmploymentDestination = {
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  icon: LucideIcon;
};

export default function MyEmploymentPage() {
  const router = useRouter();

  const destinations: EmploymentDestination[] = [
    { title: "Employment Details", description: "Review your role, department, manager, key dates and employment status.", actionLabel: "View employment details", href: "/dashboard/my-employment/details", icon: BriefcaseBusiness },
    { title: "Leave", description: "Review leave information, upcoming time away and previous requests.", actionLabel: "Open leave", href: "/dashboard/my-employment/leave", icon: CalendarDays },
    { title: "Learning", description: "See assigned learning, completed courses, qualifications and certificates.", actionLabel: "Open learning", href: "/dashboard/my-employment/learning", icon: GraduationCap },
    { title: "Documents", description: "Access employment documents and records shared with you.", actionLabel: "Open documents", href: "/dashboard/my-employment/documents", icon: FileText },
    { title: "Upcoming Reviews", description: "Keep track of probation, performance and development reviews.", actionLabel: "View reviews", href: "/dashboard/my-employment/reviews", icon: ClipboardCheck },
    { title: "Emergency Contacts", description: "Review and maintain the emergency contact information held for you.", actionLabel: "Open emergency contacts", href: "/dashboard/my-employment/emergency-contacts", icon: ContactRound },
    { title: "Medical", description: "Review the workplace medical information and fit note records available to you.", actionLabel: "Open medical information", href: "/dashboard/my-employment/medical", icon: HeartPulse },
    { title: "Right to Work", description: "Review the right to work checks held for you.", actionLabel: "Open Right to Work", href: "/dashboard/my-employment/right-to-work", icon: FileCheck2 },
    { title: "DBS", description: "Review the DBS and safeguarding records held for you.", actionLabel: "Open DBS", href: "/dashboard/my-employment/dbs-safeguarding", icon: BadgeCheck },
    { title: "Driving", description: "Review driving and licence information held for you.", actionLabel: "Open driving", href: "/dashboard/my-employment/driving", icon: CarFront },
  ];

  return (
    <main className={styles.hubPage} style={pageStyle}>
      <header className={styles.hubHeader} style={headerStyle}>
        <div>
          <p className={styles.employeeMobileHide} style={eyebrowStyle}>
            Employee workspace
          </p>

          <h1 style={titleStyle}>My Employment</h1>

          <p className={styles.employeeMobileHide} style={subtitleStyle}>
            Review your employment information and open the areas available to
            you.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard/employee")}
          style={secondaryButtonStyle}
        >
          Back to dashboard
        </button>
      </header>

      <section className={styles.hubIntroCard} style={introCardStyle}>
        <div style={iconStyle} aria-hidden="true">
          ✓
        </div>

        <div>
          <h2 style={introTitleStyle}>Your employment record</h2>

          <p style={introTextStyle}>
            This workspace will bring together your role information,
            employment dates, leave, learning, documents, reviews and personal
            employment records.
          </p>
        </div>
      </section>

      <section className={styles.hubGrid} style={gridStyle} aria-label="My employment areas">
        {destinations.map((destination) => (
          <EmploymentCard
            key={destination.href}
            {...destination}
            onClick={() => router.push(destination.href)}
          />
        ))}
      </section>
    </main>
  );
}

function EmploymentCard({
  title,
  description,
  actionLabel,
  icon: Icon,
  onClick,
}: EmploymentDestination & {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.hubCard}
      onClick={onClick}
      style={cardStyle}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-2px)";
        event.currentTarget.style.borderColor = "#CDB2E2";
        event.currentTarget.style.boxShadow =
          "0 12px 28px rgba(110, 80, 132, 0.12)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.borderColor = "#E5E7EB";
        event.currentTarget.style.boxShadow =
          "0 8px 22px rgba(17, 24, 39, 0.05)";
      }}
    >
      <span className={styles.hubCardIcon} aria-hidden>
        <Icon size={21} strokeWidth={1.8} />
      </span>

      <span className={styles.hubCardTitleRow}>
        <span className={styles.hubCardTitle} style={cardTitleStyle}>
          {title}
        </span>
        <ChevronRight
          className={styles.hubCardChevron}
          size={18}
          strokeWidth={1.8}
          aria-hidden
        />
      </span>

      <span className={styles.hubCardDescription} style={cardDescriptionStyle}>
        {description}
      </span>

      <span className={styles.hubCardAction} style={cardActionStyle}>
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
  margin: 0,
  color: "#6E5084",
  fontSize: "30px",
  lineHeight: 1.2,
  fontWeight: 700,
  letterSpacing: "-0.02em",
};

const subtitleStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "15px",
  lineHeight: 1.5,
};

const secondaryButtonStyle: CSSProperties = {
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  padding: "11px 16px",
  borderRadius: "11px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 6px 16px rgba(110, 80, 132, 0.08)",
};

const introCardStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "14px",
  marginBottom: "24px",
  padding: "20px",
  background: "#F7F1FC",
  border: "1px solid #E9D5FF",
  borderRadius: "18px",
  boxShadow: "0 8px 22px rgba(110, 80, 132, 0.06)",
};

const iconStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  minWidth: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  background: "#F5FFF9",
  color: "#2F7D57",
  fontSize: "16px",
  fontWeight: 800,
};

const introTitleStyle: CSSProperties = {
  margin: 0,
  color: "#6E5084",
  fontSize: "17px",
  lineHeight: 1.4,
  fontWeight: 700,
};

const introTextStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "#4B5563",
  fontSize: "14px",
  lineHeight: 1.55,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "20px",
};

const cardStyle: CSSProperties = {
  width: "100%",
  minHeight: "210px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "16px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "18px",
  padding: "24px",
  textAlign: "left",
  cursor: "pointer",
  boxShadow: "0 8px 22px rgba(17, 24, 39, 0.05)",
  transition:
    "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
};

const cardTitleStyle: CSSProperties = {
  color: "#111827",
  fontSize: "17px",
  lineHeight: 1.35,
  fontWeight: 700,
};

const cardDescriptionStyle: CSSProperties = {
  flex: 1,
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.55,
};

const cardActionStyle: CSSProperties = {
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
