export default function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "18px",
        marginBottom: "16px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: "12px", color: "#5E456C", fontFamily: "inherit" }}>{title}</div>
      {children}
    </div>
  );
}