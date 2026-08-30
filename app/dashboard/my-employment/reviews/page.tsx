// Leo HR employee reviews page.
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import mobileStyles from "../MyEmployment.module.css";

type ReviewRecord = {
  id: number;
  review_type: string | null;
  scheduled_date: string | null;
  completed_date: string | null;
  status: string | null;
  progress_summary: string | null;
  agreed_actions: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Date not set";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadReviews() {
      try {
        const response = await fetch("/api/my-employment/reviews", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const result = (await response.json().catch(() => null)) as
          | { success?: boolean; reviews?: ReviewRecord[]; error?: string }
          | null;
        if (!response.ok || !result?.success) {
          throw new Error(result?.error || "Your reviews could not be loaded.");
        }
        if (active) setReviews(Array.isArray(result.reviews) ? result.reviews : []);
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Your reviews could not be loaded.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadReviews();
    return () => { active = false; };
  }, []);

  const visibleReviews = useMemo(
    () => [...reviews].sort((a, b) =>
      String(a.scheduled_date ?? "9999").localeCompare(String(b.scheduled_date ?? "9999"))
    ),
    [reviews],
  );

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto" }}>
      <p className={mobileStyles.employeeMobileHide} style={{ color: "#6E5084", fontWeight: 700 }}>
        Employee workspace
      </p>

      <h1 style={{ fontSize: 32, color: "#6E5084", margin: "8px 0" }}>
        Upcoming Reviews
      </h1>

      <p className={mobileStyles.employeeMobileHide} style={{ color: "#64748B", marginBottom: 24 }}>
        View scheduled and completed probation reviews.
      </p>

      {loading ? (
        <div style={messageStyle}>Loading your reviews...</div>
      ) : loadError ? (
        <div style={{ ...messageStyle, color: "#8F3B3B" }}>{loadError}</div>
      ) : visibleReviews.length === 0 ? (
        <div style={messageStyle}>No reviews are currently scheduled.</div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {visibleReviews.map((review) => (
            <article key={review.id} style={cardStyle}>
              <div className={mobileStyles.reviewHeader} style={reviewHeaderStyle}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18 }}>{review.review_type || "Review"}</h2>
                  <p style={{ margin: "8px 0 0", color: "#64748B" }}>
                    {review.completed_date
                      ? `Completed ${formatDate(review.completed_date)}`
                      : formatDate(review.scheduled_date)}
                  </p>
                </div>

                <span style={statusStyle}>{review.status || "Scheduled"}</span>
              </div>

              {review.progress_summary ? (
                <p style={detailTextStyle}>{review.progress_summary}</p>
              ) : null}

              {review.agreed_actions ? (
                <div style={detailBoxStyle}>
                  <strong>Agreed actions</strong>
                  <p style={{ margin: "6px 0 0" }}>{review.agreed_actions}</p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <Link className={mobileStyles.mobileBackLink} href="/dashboard/my-employment" style={backStyle}>
          ← Back to My Employment
        </Link>
      </div>
    </main>
  );
}

const cardStyle = { background: "#fff", border: "1px solid #E8E2EB", borderRadius: 16, padding: 20, boxShadow: "0 8px 22px rgba(17,24,39,.05)" } as const;
const messageStyle = { ...cardStyle, color: "#64748B" } as const;
const reviewHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 } as const;
const statusStyle = { background: "#F7F1FC", color: "#6E5084", border: "1px solid #DFCDE9", padding: "6px 10px", borderRadius: 999, fontWeight: 700, fontSize: 12 } as const;
const detailTextStyle = { margin: "16px 0 0", color: "#526071", lineHeight: 1.55 } as const;
const detailBoxStyle = { marginTop: 14, padding: 14, borderRadius: 12, background: "#F8FAFC", color: "#526071" } as const;
const backStyle = { display: "inline-block", textDecoration: "none", color: "#6E5084", border: "1px solid #CDB2E2", borderRadius: 10, padding: "10px 16px", fontWeight: 700 } as const;
