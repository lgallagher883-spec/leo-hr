export default function AccessUnavailablePage() {
  return (
    <main
      style={{
        width: "100%",
        maxWidth: "720px",
        margin: "0 auto",
        paddingTop: "48px",
      }}
    >
      <section
        style={{
          padding: "32px",
          background: "#FFFFFF",
          border: "1px solid #E8E2EB",
          borderRadius: "18px",
          boxShadow: "0 8px 22px rgba(17, 24, 39, 0.05)",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            color: "#6E5084",
            fontSize: "12px",
            lineHeight: 1.4,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Leo HR
        </p>
        <h1
          style={{
            margin: 0,
            color: "#2F2635",
            fontSize: "30px",
            lineHeight: 1.2,
            fontWeight: 700,
          }}
        >
          Platform access unavailable
        </h1>
        <p
          style={{
            margin: "14px 0 0",
            color: "#6B7280",
            fontSize: "15px",
            lineHeight: 1.55,
          }}
        >
          Your organisation&apos;s access to Leo HR is currently unavailable.
        </p>
        <p
          style={{
            margin: "8px 0 0",
            color: "#6B7280",
            fontSize: "15px",
            lineHeight: 1.55,
          }}
        >
          Please contact your organisation administrator.
        </p>
      </section>
    </main>
  );
}