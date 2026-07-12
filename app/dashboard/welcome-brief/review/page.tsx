"use client";

import Link from "next/link";

export default function WelcomeBriefReviewPage() {
  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "24px",
          padding: "36px",
        }}
      >
        <div
          style={{
            color: "#6E5084",
            fontWeight: 700,
            fontSize: "13px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Welcome Brief
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "34px",
            color: "#111827",
          }}
        >
          Welcome Brief Complete
        </h1>

        <p
          style={{
            marginTop: "24px",
            lineHeight: 1.8,
            color: "#374151",
            fontSize: "16px",
          }}
        >
          We've completed your Welcome Brief and I've begun building an
          understanding of your organisation.
        </p>

        <p
          style={{
            lineHeight: 1.8,
            color: "#374151",
            fontSize: "16px",
          }}
        >
          Since then I've continued learning through our conversations and by
          updating your Foundations.
        </p>

        <p
          style={{
            lineHeight: 1.8,
            color: "#374151",
            fontSize: "16px",
          }}
        >
          In most situations you won't need to complete the Welcome Brief
          again. If something changes, it's usually better to update the
          relevant Foundation instead.
        </p>

        <div
          style={{
            background: "#F7F1FC",
            border: "1px solid #E9D5FF",
            borderRadius: "16px",
            padding: "20px",
            marginTop: "30px",
          }}
        >
          <strong>Leo</strong>

          <p
            style={{
              marginTop: "12px",
              marginBottom: 0,
              lineHeight: 1.8,
            }}
          >
            The more we work together, the better I'll understand your
            organisation. Keeping your Foundations up to date helps me give
            more accurate guidance across every workplace matter.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "36px",
          }}
        >
          <Link
            href="/dashboard/welcome-brief"
            style={{
              background: "#6E5084",
              color: "#FFFFFF",
              textDecoration: "none",
              padding: "14px 22px",
              borderRadius: "12px",
              fontWeight: 700,
            }}
          >
            Restart Welcome Brief
          </Link>

          <Link
            href="/dashboard/foundations"
            style={{
              background: "#FFFFFF",
              color: "#6E5084",
              border: "1px solid #6E5084",
              textDecoration: "none",
              padding: "14px 22px",
              borderRadius: "12px",
              fontWeight: 700,
            }}
          >
            Return to Foundations
          </Link>
        </div>
      </div>
    </div>
  );
}