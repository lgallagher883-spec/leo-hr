"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ProfileSection from "./ProfileSection";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
      const newItems: ComplianceItem[] = [];

      const rightToWork = await supabase
        .from("employee_right_to_work")
        .select("right_to_work_expiry, next_review_date")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })
        .limit(1);

      const dbs = await supabase
        .from("employee_dbs_checks")
        .select("next_check_due, safeguarding_training_expiry")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })
        .limit(1);

      const driving = await supabase
        .from("employee_driving_checks")
        .select(
          "licence_expiry_date, next_dvla_check_due, business_insurance_expiry_date"
        )
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })
        .limit(1);

      const training = await supabase
        .from("employee_training_logs")
        .select("training_name, refresh_or_expiry_date")
        .eq("employee_id", employeeId)
        .order("refresh_or_expiry_date", { ascending: true });

      const leaveRecords = await supabase
        .from("employee_leave_records")
        .select("leave_type, status, days_taken")
        .eq("employee_id", employeeId);

      const employmentDetails = await supabase
        .from("employee_employment_details")
        .select("annual_leave_allowance")
        .eq("employee_id", employeeId)
        .maybeSingle();

      const latestRightToWork = rightToWork.data?.[0];
      if (latestRightToWork) {
        if (latestRightToWork.right_to_work_expiry) {
          newItems.push(
            buildDateMessage(
              "Right to Work Expiry",
              latestRightToWork.right_to_work_expiry
            )
          );
        }

        if (latestRightToWork.next_review_date) {
          newItems.push(
            buildDateMessage(
              "Right to Work Review",
              latestRightToWork.next_review_date
            )
          );
        }
      }

      const latestDbs = dbs.data?.[0];
      if (latestDbs) {
        newItems.push(buildDateMessage("DBS Next Check", latestDbs.next_check_due));

        if (latestDbs.safeguarding_training_expiry) {
          newItems.push(
            buildDateMessage(
              "Safeguarding Training",
              latestDbs.safeguarding_training_expiry
            )
          );
        }
      }

      const latestDriving = driving.data?.[0];
      if (latestDriving) {
        if (latestDriving.licence_expiry_date) {
          newItems.push(
            buildDateMessage(
              "Driving Licence Expiry",
              latestDriving.licence_expiry_date
            )
          );
        }

        if (latestDriving.next_dvla_check_due) {
          newItems.push(
            buildDateMessage(
              "DVLA Check Due",
              latestDriving.next_dvla_check_due
            )
          );
        }

        if (latestDriving.business_insurance_expiry_date) {
          newItems.push(
            buildDateMessage(
              "Business Insurance Expiry",
              latestDriving.business_insurance_expiry_date
            )
          );
        }
      }

      (training.data || []).forEach((record: any) => {
        if (record.refresh_or_expiry_date) {
          const message = buildDateMessage(
            `Training: ${record.training_name}`,
            record.refresh_or_expiry_date
          );

          if (message.level !== "ok") {
            newItems.push(message);
          }
        }
      });

      const allowance = Number(
        employmentDetails.data?.annual_leave_allowance || 0
      );

      const annualLeaveUsed = (leaveRecords.data || [])
        .filter(
          (record: any) =>
            record.leave_type === "Annual Leave" &&
            record.status !== "Cancelled"
        )
        .reduce((total: number, record: any) => {
          const days = Number(record.days_taken || 0);
          return total + (Number.isNaN(days) ? 0 : days);
        }, 0);

      if (allowance > 0 && annualLeaveUsed > allowance) {
        newItems.push({
          title: "Annual Leave",
          detail: `Recorded annual leave is ${annualLeaveUsed} days against an entitlement of ${allowance} days.`,
          level: "review",
        });
      }

      setItems(newItems);
      setLoading(false);
    }

    loadCompliance();
  }, [employeeId]);

  const reviewItems = items.filter((item) => item.level === "review");
  const upcomingItems = items.filter((item) => item.level === "upcoming");
  const okItems = items.filter((item) => item.level === "ok");

  return (
    <ProfileSection title="Compliance Summary">
      

      {loading ? (
        <div style={{ color: "#6B7280" }}>Checking compliance records...</div>
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
            <div style={{ color: "#6B7280", fontSize: "13px", marginTop: "3px" }}>
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
  color: "#374151",
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