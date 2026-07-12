export default function SaveButton({
  children,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#9CA3AF" : "#6E5084",
        color: "#fff",
        border: "none",
        padding: "9px 13px",
        borderRadius: "9px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 600,
        marginTop: "6px",
      }}
    >
      {children}
    </button>
  );
}