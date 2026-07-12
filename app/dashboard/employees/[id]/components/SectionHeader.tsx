export default function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <>
      <div
        style={{
          fontWeight: 800,
          fontSize: "18px",
          marginBottom: "6px",
        }}
      >
        {title}
      </div>

      {description && (
        <div
          style={{
            color: "#6B7280",
            fontSize: "14px",
            marginBottom: "16px",
          }}
        >
          {description}
        </div>
      )}
    </>
  );
}