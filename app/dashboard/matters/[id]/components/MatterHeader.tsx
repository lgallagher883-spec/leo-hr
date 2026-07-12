"use client";

type MatterHeaderProps = {
  title: string;
  status: string;
  onBack: () => void;
};

export default function MatterHeader({
  title,
  status,
  onBack,
}: MatterHeaderProps) {
  return (
    <div>
      <button
        onClick={onBack}
        style={{
          marginBottom: "20px",
          padding: "8px 12px",
          border: "1px solid #e5e7eb",
          background: "#fff",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <h1 style={{ fontSize: "28px", fontWeight: 700 }}>
        {title}
      </h1>

      <div style={{ marginTop: "6px", fontWeight: 600 }}>
        {status}
      </div>
    </div>
  );
}