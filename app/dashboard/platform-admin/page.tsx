import Link from "next/link";
import {
  Building2,
  CreditCard,
  Flag,
  Headphones,
  HeartPulse,
  KeyRound,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";

type AdminArea = {
  title: string;
  description: string;
  href: string;
  icon: typeof LayoutDashboard;
  available: boolean;
};

const adminAreas: AdminArea[] = [
  {
    title: "Pilot Programme",
    description:
      "Create pilot invitations and manage participating organisations.",
    href: "/dashboard/platform-admin/pilot-programme",
    icon: Flag,
    available: true,
  },
  {
    title: "Organisations",
    description:
      "Review customer organisations and their platform status.",
    href: "/dashboard/platform-admin/organisations",
    icon: Building2,
    available: false,
  },
  {
    title: "Subscriptions",
    description:
      "Manage organisation plans, limits and subscription lifecycle.",
    href: "/dashboard/platform-admin/subscriptions",
    icon: CreditCard,
    available: false,
  },
  {
    title: "Billing",
    description:
      "Review platform billing records and commercial account status.",
    href: "/dashboard/platform-admin/billing",
    icon: ReceiptText,
    available: false,
  },
  {
    title: "Support",
    description:
      "Manage customer support and controlled account assistance.",
    href: "/dashboard/platform-admin/support",
    icon: Headphones,
    available: false,
  },
  {
    title: "Platform Audit",
    description:
      "Review sensitive administration and platform-level activity.",
    href: "/dashboard/platform-admin/audit",
    icon: ShieldCheck,
    available: false,
  },
  {
    title: "Feature Flags",
    description:
      "Control the release of platform features and restricted capabilities.",
    href: "/dashboard/platform-admin/feature-flags",
    icon: KeyRound,
    available: false,
  },
  {
    title: "System Health",
    description:
      "Review service availability and important platform checks.",
    href: "/dashboard/platform-admin/system-health",
    icon: HeartPulse,
    available: false,
  },
];

export default function PlatformAdminPage() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1440px",
        margin: "0 auto",
      }}
    >
      <section
        style={{
          padding: "26px 28px",
          borderRadius: "18px",
          background:
            "linear-gradient(135deg, #FFFFFF 0%, #F7F1FC 62%, #F5FFF9 100%)",
          border: "1px solid #E8E2EB",
          boxShadow: "0 12px 30px rgba(47, 38, 53, 0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: "760px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
                padding: "7px 11px",
                borderRadius: "999px",
                background: "#F0DFFD",
                color: "#6E5084",
                fontSize: "12px",
                fontWeight: 750,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              <ShieldCheck size={15} strokeWidth={1.9} aria-hidden />
              Restricted platform area
            </div>

            <h1
              style={{
                margin: 0,
                color: "#2F2635",
                fontSize: "30px",
                lineHeight: 1.2,
                fontWeight: 780,
                letterSpacing: "-0.03em",
              }}
            >
              Platform Administration
            </h1>

            <p
              style={{
                margin: "10px 0 0",
                color: "#675D6D",
                fontSize: "15px",
                lineHeight: 1.7,
              }}
            >
              Manage LEO&apos;s internal platform operations separately from
              customer organisation administration.
            </p>
          </div>

          <div
            style={{
              minWidth: "210px",
              padding: "14px 16px",
              borderRadius: "14px",
              background: "#FFFFFF",
              border: "1px solid #E8E2EB",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Users
                size={20}
                strokeWidth={1.8}
                color="#6E5084"
                aria-hidden
              />

              <div>
                <div
                  style={{
                    color: "#2F2635",
                    fontSize: "14px",
                    fontWeight: 750,
                  }}
                >
                  Platform Owner
                </div>

                <div
                  style={{
                    marginTop: "2px",
                    color: "#7B7181",
                    fontSize: "12px",
                  }}
                >
                  Full administration access
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: "24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 290px), 1fr))",
            gap: "16px",
          }}
        >
          {adminAreas.map((area) => {
            const Icon = area.icon;

            const content = (
              <>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "12px",
                    background: area.available ? "#F0DFFD" : "#F5F2F6",
                    color: area.available ? "#6E5084" : "#8B828F",
                  }}
                >
                  <Icon size={21} strokeWidth={1.8} aria-hidden />
                </div>

                <div style={{ marginTop: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        color: "#2F2635",
                        fontSize: "17px",
                        lineHeight: 1.3,
                        fontWeight: 750,
                        letterSpacing: "-0.015em",
                      }}
                    >
                      {area.title}
                    </h2>

                    {!area.available ? (
                      <span
                        style={{
                          flexShrink: 0,
                          padding: "4px 7px",
                          borderRadius: "999px",
                          background: "#F5F2F6",
                          color: "#7B7181",
                          fontSize: "10px",
                          fontWeight: 750,
                          letterSpacing: "0.03em",
                          textTransform: "uppercase",
                        }}
                      >
                        Later
                      </span>
                    ) : null}
                  </div>

                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "#6D6472",
                      fontSize: "13px",
                      lineHeight: 1.6,
                    }}
                  >
                    {area.description}
                  </p>
                </div>
              </>
            );

            if (!area.available) {
              return (
                <article
                  key={area.title}
                  aria-disabled="true"
                  style={{
                    minHeight: "190px",
                    padding: "20px",
                    borderRadius: "16px",
                    background: "#FFFFFF",
                    border: "1px solid #E8E2EB",
                    opacity: 0.82,
                    boxSizing: "border-box",
                  }}
                >
                  {content}
                </article>
              );
            }

            return (
              <Link
                key={area.title}
                href={area.href}
                style={{
                  minHeight: "190px",
                  padding: "20px",
                  borderRadius: "16px",
                  background: "#FFFFFF",
                  border: "1px solid #E2D7E8",
                  boxShadow: "0 8px 22px rgba(47, 38, 53, 0.045)",
                  boxSizing: "border-box",
                  textDecoration: "none",
                  transition:
                    "transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease",
                }}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}