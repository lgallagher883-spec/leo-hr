"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { MatterProvider } from "./matters/MatterContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const links = [
    ["Dashboard", "/dashboard"],
    ["Welcome Brief", "/dashboard/welcome-brief"],
    ["Ask Leo", "/dashboard/ask-leo"],
    ["Matters", "/dashboard/matters"],
    ["Employees", "/dashboard/employees"],
    ["Compliance", "/dashboard/compliance"],
    ["HR Resources", "/dashboard/policies"],
    ["SAR Requests", "/dashboard/sar-requests"],
    ["Insights", "/dashboard/insights"],
    ["Audit Logs", "/dashboard/audit-logs"],
    ["Leo Learn", "/dashboard/leo-learn"],
    ["Leo Talent", "/dashboard/leo-talent"],
    ["Billing", "/dashboard/billing"],
    ["Foundations", "/dashboard/foundations"],
  ];

  return (
    <MatterProvider>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
          background: "#F7F1FC",
        }}
      >
        <aside
          style={{
            width: "260px",
            background: "#ffffff",
            color: "#111827",
            padding: "20px",
            borderRight: "1px solid #e5e7eb",
          }}
        >
          <div style={{ marginBottom: "28px" }}>
            <Image
              src="/logo.png"
              alt="Logo"
              width={220}
              height={70}
              style={{ objectFit: "contain" }}
              priority
            />
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {links.map(([label, href]) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);

              return (
                <a
                  key={href}
                  href={href}
                  style={{
                    color: active ? "#6E5084" : "#374151",
                    textDecoration: "none",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    display: "block",
                    background: active ? "#F3E8FF" : "transparent",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {label}
                </a>
              );
            })}
          </nav>
        </aside>

        <main
          style={{
            flex: 1,
            padding: "30px",
            background: "#F7F1FC",
          }}
        >
          {children}
        </main>
      </div>
    </MatterProvider>
  );
}