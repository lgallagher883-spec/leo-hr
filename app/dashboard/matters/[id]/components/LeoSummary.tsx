"use client";

type LeoSummaryProps = {
  understanding: string;
  risk: string;
  nextStep: string;
};

export default function LeoSummary({
  understanding,
  risk,
  nextStep,
}: LeoSummaryProps) {
  return (
    <div
      style={{
        marginTop: "20px",
        background: "#F5FFF9",
        border: "1px solid #d1fae5",
        borderRadius: "14px",
        padding: "20px",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: "10px" }}>
        Leo
      </div>

      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontWeight: 600 }}>Current understanding</div>
        <p style={{ marginTop: "6px", color: "#374151" }}>
          {understanding}
        </p>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontWeight: 600 }}>Current risk</div>
        <p style={{ marginTop: "6px", color: "#374151" }}>
          {risk}
        </p>
      </div>

      <div>
        <div style={{ fontWeight: 600 }}>Recommended next step</div>
        <p style={{ marginTop: "6px", color: "#374151" }}>
          {nextStep}
        </p>
      </div>
    </div>
  );
}