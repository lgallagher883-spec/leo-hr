// Leo HR employee reviews page.
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import mobileStyles from "../MyEmployment.module.css";

type ProbationSummary = {
  id: number;
  status: string;
  probation_start_date: string;
  standard_end_date: string;
  current_end_date: string;
  final_decision_deadline: string;
  extension_end_date: string | null;
  final_outcome: string | null;
  final_outcome_date: string | null;
};

type ReviewRecord = {
  id: number;
  review_type: string | null;
  scheduled_date: string | null;
  completed_date: string | null;
  status: string | null;
  manager_name: string | null;
  employee_comments: string | null;
  manager_comments: string | null;
  progress_summary: string | null;
  support_required: string | null;
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
  const [probation, setProbation] = useState<ProbationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [openReviewId, setOpenReviewId] = useState<number | null>(null);
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
          | { success?: boolean; probation?: ProbationSummary | null; reviews?: ReviewRecord[]; error?: string }
          | null;
        if (!response.ok || !result?.success) {
          throw new Error(result?.error || "Your reviews could not be loaded.");
        }
        if (active) {
          setProbation(result.probation || null);
          setReviews(Array.isArray(result.reviews) ? result.reviews : []);
        }
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

      {!loading && !loadError && probation ? (
        <section style={overviewStyle}>
          <div>
            <p style={eyebrowStyle}>Your probation</p>
            <h2 style={overviewTitleStyle}>{probation.status}</h2>
            <p style={overviewTextStyle}>
              Your current probation end date is {formatDate(probation.current_end_date)}.
            </p>
          </div>
          <div style={overviewGridStyle}>
            <div style={overviewItemStyle}>
              <span style={overviewLabelStyle}>Started</span>
              <strong>{formatDate(probation.probation_start_date)}</strong>
            </div>
            <div style={overviewItemStyle}>
              <span style={overviewLabelStyle}>Current end date</span>
              <strong>{formatDate(probation.current_end_date)}</strong>
            </div>
            <div style={overviewItemStyle}>
              <span style={overviewLabelStyle}>Final decision by</span>
              <strong>{formatDate(probation.final_decision_deadline)}</strong>
            </div>
          </div>
        </section>
      ) : null}

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

              {review.review_type === "Ad-hoc Review" ? (
                <div style={adHocBadgeStyle}>Additional probation review</div>
              ) : null}

              {review.progress_summary ? (
                <p style={detailTextStyle}>{review.progress_summary}</p>
              ) : null}

              <button
                type="button"
                onClick={() => setOpenReviewId((current) => current === review.id ? null : review.id)}
                style={detailsButtonStyle}
                aria-expanded={openReviewId === review.id}
              >
                {openReviewId === review.id ? "Hide review details" : "View review details"}
              </button>

              {openReviewId === review.id ? (
                <div style={detailsPanelStyle}>
                  {review.manager_name ? <div style={detailSectionStyle}><strong>Manager</strong><p style={detailParagraphStyle}>{review.manager_name}</p></div> : null}
                  {review.employee_comments ? <div style={detailSectionStyle}><strong>Your comments</strong><p style={detailParagraphStyle}>{review.employee_comments}</p></div> : null}
                  {review.manager_comments ? <div style={detailSectionStyle}><strong>Manager comments</strong><p style={detailParagraphStyle}>{review.manager_comments}</p></div> : null}
                  {review.support_required ? <div style={detailSectionStyle}><strong>Support agreed</strong><p style={detailParagraphStyle}>{review.support_required}</p></div> : null}
                  {review.agreed_actions ? <div style={detailSectionStyle}><strong>Agreed actions</strong><p style={detailParagraphStyle}>{review.agreed_actions}</p></div> : null}
                  {!review.employee_comments && !review.manager_comments && !review.support_required && !review.agreed_actions ? (
                    <p style={{ margin: 0, color: "#64748B" }}>No additional review notes are available yet.</p>
                  ) : null}

                  {review.status === "Completed" ? (
                    <a
                      href={"/api/my-employment/reviews/" + review.id + "/document"}
                      target="_blank"
                      rel="noreferrer"
                      style={printLinkStyle}
                    >
                      Print review
                    </a>
                  ) : null}
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

const overviewStyle = { display: "grid", gap: 18, background: "#fff", border: "1px solid #E8E2EB", borderRadius: 18, padding: 20, marginBottom: 18, boxShadow: "0 8px 22px rgba(17,24,39,.05)" } as const;
const eyebrowStyle = { margin: 0, color: "#6E5084", fontSize: 12, fontWeight: 800, textTransform: "uppercase" } as const;
const overviewTitleStyle = { margin: "6px 0 4px", fontSize: 22, color: "#2F2634" } as const;
const overviewTextStyle = { margin: 0, color: "#64748B", lineHeight: 1.5 } as const;
const overviewGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 } as const;
const overviewItemStyle = { display: "grid", gap: 4, background: "#F8FAFC", borderRadius: 12, padding: 12, color: "#334155" } as const;
const overviewLabelStyle = { fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" } as const;
const adHocBadgeStyle = { display: "inline-block", marginTop: 14, background: "#F7F1FC", border: "1px solid #DFCDE9", color: "#6E5084", borderRadius: 999, padding: "5px 9px", fontSize: 11, fontWeight: 800 } as const;
const detailsButtonStyle = { marginTop: 14, border: "1px solid #D7C9E1", background: "#fff", color: "#6E5084", borderRadius: 10, padding: "9px 12px", fontWeight: 700, cursor: "pointer" } as const;
const detailsPanelStyle = { display: "grid", gap: 12, marginTop: 12, padding: 14, borderRadius: 12, background: "#FBF9FC", border: "1px solid #ECE5EF" } as const;
const detailSectionStyle = { display: "grid", gap: 4, color: "#334155" } as const;
const detailParagraphStyle = { margin: 0, color: "#526071", lineHeight: 1.55, whiteSpace: "pre-wrap" } as const;

const printLinkStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "fit-content", border: "1px solid #D7C9E1", background: "#fff", color: "#6E5084", borderRadius: 10, padding: "9px 12px", fontWeight: 700, textDecoration: "none" } as const;
