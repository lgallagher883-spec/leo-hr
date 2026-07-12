type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  small?: boolean;
};

export default function SelectField({
  label,
  value,
  onChange,
  options,
  small = false,
}: SelectFieldProps) {
  return (
    <div
      style={{
        marginBottom: "12px",
        width: small ? "260px" : "100%",
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

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          marginTop: "5px",
          background: "#fff",
        }}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}