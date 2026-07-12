type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  small?: boolean;
};

export default function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  small = false,
}: FieldProps) {
  return (
    <div
      style={{
        marginBottom: "12px",
        width: small ? "220px" : "100%",
        maxWidth: "100%",
      }}
    >
      <label
        style={{
          display: "block",
          fontSize: "13px",
          color: "#6B7280",
        }}
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          marginTop: "5px",
        }}
      />
    </div>
  );
}