"use client";

import { useEffect, useState } from "react";
import ProfileSection from "./ProfileSection";


type ComplianceSummaryProps = {
  employeeId: number;
};

type ComplianceItem = {
  title: string;
  detail: string;
  level: "review" | "upcoming" | "ok";
};

function daysUntil(dateString: string | null) {
  if (!dateString) return null;

  const today = new Date();
  const target = new Date(dateString);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function buildDateMessage(label: string, dateString: string | null) {
  const days = daysUntil(dateString);

  if (!dateString || days === null) {
    return {
      title: label,
      detail: "No date recorded.",
      level: "review" as const,
    };
  }

  if (days < 0) {
    return {
      title: label,
      detail: `Date passed ${Math.abs(days)} day(s) ago. Review when convenient.`,
      level: "review" as const,
    };
  }

  if (days <= 30) {
    return {
      title: label,
      detail: `Due in ${days} day(s).`,
      level: "upcoming" as const,
    };
  }

  return {
    title: label,
    detail: `No immediate action. Due in ${days} day(s).`,
    level: "ok" as const,
  };
}

export default function ComplianceSummary({
  employeeId,
}: ComplianceSummaryProps) {
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompliance() {
      setLoading(true);
      try {
        const response = await fetch(`/api/employees/${employeeId}/compliance-summary`, { credentials: "include", cache: "no-store" });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "Compliance records could not be loaded.");
        const newItems: ComplianceItem[] = [];
        const rt = result.rightToWork;
        if (rt?.right_to_work_expiry) newItems.push(buildDateMessage("Right to Work Expiry", rt.right_to_work_expiry));
        if (rt?.next_review_date) newItems.push(buildDateMessage("Right to Work Review", rt.next_review_date));
        const dbs = result.dbs;
        if (dbs && String(dbs.dbs_required || "").toLowerCase() !== "no") {
          newItems.push(buildDateMessage("DBS Next Check", dbs.next_check_due));
          if (dbs.safeguarding_training_expiry) newItems.push(buildDateMessage("Safeguarding Training", dbs.safeguarding_training_expiry));
        }
        const d = result.driving;
        if (d?.licence_expiry_date) newItems.push(buildDateMessage("Driving Licence Expiry", d.licence_expiry_date));
        if (d?.next_dvla_check_due) newItems.push(buildDateMessage("DVLA Check Due", d.next_dvla_check_due));
        if (d?.business_insurance_expiry_date) newItems.push(buildDateMessage("Business Insurance Expiry", d.business_insurance_expiry_date));
        (result.training || []).forEach((record: any) => {
          if (record.refresh_or_expiry_date) {
            const m = buildDateMessage(`Training: ${record.training_name}`, record.refresh_or_expiry_date);
            if (m.level !== "ok") newItems.push(m);
          }
        });
        const allowance = Number(result.annualLeaveAllowance || 0), used = Number(result.annualLeaveUsed || 0);
        if (allowance > 0 && used > allowance) newItems.push({title:"Annual Leave",detail:`Recorded annual leave is ${used} days against an entitlement of ${allowance} days.`,level:"review"});
        setItems(newItems);
      } catch (error) {
        console.error("Error loading compliance summary:", error);
        setItems([]);
      } finally { setLoading(false); }
    }
    void loadCompliance();
  }, [employeeId]);

  const reviewItems = items.filter((item) => item.level === "review");
  const upcomingItems = items.filter((item) => item.level === "upcoming");
  const okItems = items.filter((item) => item.level === "ok");

  return (
    <ProfileSection title="Compliance Summary">
      {loading ? (
        <div style={{ color: "#5E456C" }}>Checking compliance records...</div>
      ) : items.length === 0 ? (
        <div style={okBoxStyle}>
          No immediate compliance items found from the records currently saved.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {reviewItems.length > 0 && (
            <Group title="Needs review" items={reviewItems} tone="review" />
          )}

          {upcomingItems.length > 0 && (
            <Group title="Coming up soon" items={upcomingItems} tone="upcoming" />
          )}

          {okItems.length > 0 && (
            <Group title="No immediate action" items={okItems} tone="ok" />
          )}
        </div>
      )}
    </ProfileSection>
  );
}

function Group({
  title,
  items,
  tone,
}: {
  title: string;
  items: ComplianceItem[];
  tone: "review" | "upcoming" | "ok";
}) {
  return (
    <div style={groupStyle(tone)}>
      <div style={{ fontWeight: 800, marginBottom: "8px" }}>{title}</div>

      <div style={{ display: "grid", gap: "8px" }}>
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} style={itemStyle}>
            <div style={{ fontWeight: 700 }}>{item.title}</div>
            <div style={{ color: "#5E456C", fontSize: "13px", marginTop: "3px" }}>
              {item.detail}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const okBoxStyle: React.CSSProperties = {
  background: "#F5FFF9",
  border: "1px solid #D1FAE5",
  borderRadius: "12px",
  padding: "14px",
  color: "#5E456C",
};

function groupStyle(tone: "review" | "upcoming" | "ok"): React.CSSProperties {
  const styles = {
    review: {
      background: "#FFF7ED",
      border: "1px solid #FED7AA",
    },
    upcoming: {
      background: "#FFFBEB",
      border: "1px solid #FDE68A",
    },
    ok: {
      background: "#F5FFF9",
      border: "1px solid #D1FAE5",
    },
  };

  return {
    ...styles[tone],
    borderRadius: "12px",
    padding: "14px",
  };
}

const itemStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "10px",
};